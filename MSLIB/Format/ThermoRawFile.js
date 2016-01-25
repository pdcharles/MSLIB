"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.ThermoRawFile = function() {

 const ANALYSER = ["ITMS","TQMS","SQMS","TOFMS","FTMS","Sector"];

 var ThermoRawFile = function(f) {
  MSLIB.Format.MsDataFile.call(this, f);
  if (f.name.match(/\.raw$/i)) {
   this.FileType = "thermo_raw";
  }
  else {
   console.log("Error: unsupported file type");
   return {};
  }
  this.FetchProfileSpectraWhenAvailable = 1;
 };
 ThermoRawFile.prototype = Object.create(MSLIB.Format.MsDataFile.prototype);

 var Reporting = false;

 //------------------------------------------------------------------------------
 //ThermoRawFile ASync methods
 //------------------------------------------------------------------------------

 ThermoRawFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) { //Nested calls to get all file headers at once
  //prefetchScanHeaders not used (they have to be fetched either way)
  if (!this.Ready) return("ThermoRawFileNotReady");
  MSLIB.Common.Starting.call(this);
  this.LastError = this.Reader.readBinary(function() {
    (function() {
     this.LastError = fetchStruct.call(this,(function(s){
      this.Internal.Header = s;
      this.Internal.Offsets.SequencerRow = this.Reader.Position;
      this.LastError = fetchStruct.call(this,(function(s){
       this.Internal.SequencerRow = s;
       this.Internal.Offsets.AutoSamplerInfo = this.Reader.Position;
       this.LastError = fetchStruct.call(this,(function(s){
        this.Internal.AutoSamplerInfo = s;
        this.Internal.Offsets.RawFileInfo = this.Reader.Position;
        this.LastError = fetchStruct.call(this,(function(s){
         this.Internal.RawFileInfo = s;
         this.Internal.Offsets.RunHeaders = this.Internal.RawFileInfo.RunHeaderAddr.map(function(ele){return ele.Offset});
         this.Internal.RunHeaders = [];
         fetchRunHeaders.call(this);
        }).bind(this),null,RawFileInfo);        
       }).bind(this),null,AutoSamplerInfo);
      }).bind(this),null,SequencerRow);
     }).bind(this),0,Header);
    }).call(this.Parent);
   },
   0,
   1420,
   true // First 1420 bytes are fixed and can be prebuffered
  );
 };

 //fetchScanOffsets callbacks
 var fetchRunHeaders = function() {
  if (this.Internal.Offsets.RunHeaders.length && (this.Internal.Offsets.RunHeaders[this.Internal.Offsets.RunHeaders.length-1] < this.Reader.File.size)) {
   if (this.Internal.RunHeaders.length < this.Internal.Offsets.RunHeaders.length) {
    this.LastError = fetchStruct.call(this,(function(s){
     this.Internal.RunHeaders.push(s); 
     fetchRunHeaders.call(this);
    }).bind(this),this.Internal.Offsets.RunHeaders[this.Internal.RunHeaders.length],RunHeader);
   }
   else {
    this.Internal.MSRunHeader = null;
    for (var i in this.Internal.RunHeaders) {
     if (this.Internal.Offsets.ScanEventList = this.Internal.RunHeaders[i].ScanTrailerAddr) { //Find a RunHeader with defined ScanTrailerAddr (=mass spec device)
      this.Internal.Offsets.ScanHeaderList = this.Internal.RunHeaders[i].ScanHeaderAddr;
      this.Internal.MSRunHeader = this.Internal.RunHeaders[i];
      break;
     }
    }
    if (this.Internal.MSRunHeader != null) {
     this.Internal.NScans = this.Internal.MSRunHeader.LastScanNumber - this.Internal.MSRunHeader.FirstScanNumber + 1;
     fetchScanHeaderList.call(this);
    }
    else {
     console.log("Error: cannot find MSRunHeader in file");
    }
   }
  }
  else {
  console.log("Error retrieving RunHeaders");
  } 
 }

 var fetchScanHeaderList = function() {
  this.LastError = this.Reader.readBinary(function() {
    (function() {
     this.LastError = fetchStruct.call(this,(function(s){
      this.Internal.ScanHeaderList = s;
      var prevSN = null;
      this.Internal.ScanHeaderList.ScanHeaders.forEach(function(H,i) {
       var s = H.Index+1;
       var E = this.Internal.ScanHeaderList.ScanEvents[i];
       this.Scans[s] = {};
       this.Scans[s].Offset = H.Offset + this.Internal.MSRunHeader.DataAddr;
       this.Scans[s].Length = H.DataPacketSize;
       this.Scans[s].Scan   = new MSLIB.Data.Scan();
       this.Scans[s].Scan.ScanNumber         = s;
       this.Scans[s].Scan.MsLevel            = E.SEPreamble[6];
       this.Scans[s].Scan.RetentionTime      = H.Time;
       this.Scans[s].Scan.LowMz              = H.LowMz;
       this.Scans[s].Scan.HighMz             = H.HighMz;
       this.Scans[s].Scan.TotalCurrent       = H.TotalCurrent;
       this.Scans[s].Scan.BasePeakMz         = H.BaseMz;
       this.Scans[s].Scan.BasePeakIntensity  = H.BaseIntensity;
       this.Scans[s].Scan.Analyser           = (E.SEPreamble[40] >= ANALYSER.length ? undefined : ANALYSER[E.SEPreamble[40]]);
       this.Scans[s].Scan.Internal.HzConversionParams = [E.NParam,E.A,E.B,E.C];
       if (E.NPrecursors) {
        this.Scans[s].Scan.PrecursorMzs      = (E.NPrecursors > 1 ? E.Reaction.map(function(ele) {return ele.PrecursorMz}) : [E.Reaction.PrecursorMz]);
       }
       if (prevSN != null) {
        this.Scans[prevSN].Next = s;
        this.Scans[s].Previous = prevSN;
       }
       prevSN = s;
      },this);
      MSLIB.Common.Finished.call(this);
     }).bind(this),this.Internal.Offsets.ScanHeaderList,ScanHeaderList);
    }).call(this.Parent);
   },
   this.Internal.Offsets.ScanHeaderList,
   this.Internal.MSRunHeader.ScanParamsAddr - this.Internal.Offsets.ScanHeaderList,
   true // Pre-buffer ScanEvent and ScanHeader reads
  );
 }

 ThermoRawFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  if (!this.Ready) return("ThermoRawFileNotReady");
  if (!this.Scans.length) return("ThermoRawFileNoScanOffsets");
  if (!this.Scans[scan]) return("ThermoRawFileScanUnknown");
  this.CurrentScan = this.Scans[scan].Scan;
  if (prefetchSpectrumData) {
   this.Internal.PrefetchSpectrum = true;
   this.fetchSpectrumData();
  }
 }

 ThermoRawFile.prototype.fetchAllScanHeaders = function() {
  if (!this.Ready) return("ThermoRawFileNotReady");
  if (!this.Scans.length) this.fetchScanOffsets();
  //Already done during fetchScanOffsets
 }

 ThermoRawFile.prototype.fetchSpectrumData = function() {
  if (this.Internal.PrefetchSpectrum) delete this.Internal.PrefetchSpectrum;
  else {
   if (!this.Ready) return("MzFileNotReady");
   if (!this.Scans.length) return("ThermoRawFileNoScanOffsets");
   if (!this.CurrentScan) return("ThermoRawFileScanNotLoaded");
   MSLIB.Common.Starting.call(this);
  }
  this.LastError = this.Reader.readBinary(function() {
    (function() {
     this.LastError = fetchStruct.call(this,(function(s){
      this.Internal.ScanDataPacket = s;
      var mzs = [];
      var ints = [];     
     	if ((this.Internal.ScanDataPacket.Profile.PeakCount > 0) && this.FetchProfileSpectraWhenAvailable) {
       var fv = this.Internal.ScanDataPacket.Profile.FirstValue;
       var step = this.Internal.ScanDataPacket.Profile.Step; 
     		//convert Hz values into m/z and save the profile peaks
     		this.Internal.ScanDataPacket.Profile.Chunks.forEach(function(chunk,i) {
     			this.Internal.ScanDataPacket.Profile.Chunks[i].Signal.forEach(function(signal,j) {
     				mzs.push(ConvertHz(this.CurrentScan.Internal.HzConversionParams,(fv+(chunk.FirstBin+j)*step)) + chunk.Fudge);
     				ints.push(signal);
     			},this);
     		},this);
     	} 
      else {
     		//Save the Centroided Peaks, they also occur in profile scans but
     		//overlap with profiles, Thermo always does centroiding just for fun
       this.CurrentScan.Centroided = 1;
       mzs = this.Internal.ScanDataPacket.Profile.PeakList.Peaks.map(function(peak) {return peak.Mz});
       ints = this.Internal.ScanDataPacket.Profile.PeakList.Peaks.map(function(peak) {return peak.Abundance});
      }
      this.CurrentScan.Spectrum = new MSLIB.Data.Spectrum(mzs,ints);
      MSLIB.Common.Finished.call(this);
     }).bind(this),this.Scans[this.CurrentScan.ScanNumber].Offset,ScanDataPacket);
    }).call(this.Parent);
   },
   this.Scans[this.CurrentScan.ScanNumber].Offset,
   this.Scans[this.CurrentScan.ScanNumber].Length,
   true // Pre-buffer ScanEvent and ScanHeader reads
  );
 }

 var ConvertHz = function(p,v) {
	 switch (p[0]) {
	  case 4 : return p[1] + p[2]/v + p[3]/v/v;
	  case 5 :
   case 7 :	return p[1] + p[2]/v/v + p[3]/v/v/v/v;
  	default: return v
	 }
 }

 //------------------------------------------------------------------------------
 //ThermoRawFile Structure
 //------------------------------------------------------------------------------

 //Values starting $ are parsed as utf16 text

 //pseudo-ctypes
 var   uint8 = function() { return { CType :   "uint8", ByteLength : 1, read : DataView.prototype.getUint8   } };
 var  uint16 = function() { return { CType :  "uint16", ByteLength : 2, read : DataView.prototype.getUint16  } };
 var  uint32 = function() { return { CType :  "uint32", ByteLength : 4, read : DataView.prototype.getUint32  } };
 var  uint64 = function() { return { CType :  "uint64", ByteLength : 8, read : DataView.prototype.getUint32  } };// Javascript doesn't support 64 bit integers, however the number is stored in little-endian format and for the (relevant) use-cases is exceedingly unlikely to be larger than 2^53 so can be read as uint32 
 var float32 = function() { return { CType : "float32", ByteLength : 4, read : DataView.prototype.getFloat32 } };
 var float64 = function() { return { CType : "float64", ByteLength : 8, read : DataView.prototype.getFloat64 } };

 //pseudo-pascalstring
 var PString = function() {
  var _PString = function() { return [
   ["Length",          uint32,   1,   1e5], //4 bytes
   ["$Text",           uint16,   function(parentStruct) {return parentStruct.Length}]]; //Length * 2 bytes
  }
  return _PString;
 }();

 //pseudo-structs
 var Header = function() {
  var _Header = function() { Reporting = this.Report; if (Reporting) console.log("__Header__"); var hdr = [
   ["Magic",          uint16,   1], //   2 bytes - Start of fixed size file start block at byte offset 0
   ["$Signature",     uint16,   9], //  18 bytes
   ["u1",              uint8,   4], //   4 bytes
   ["u2",              uint8,   4], //   4 bytes 
   ["u3",              uint8,   4], //   4 bytes 
   ["u4",              uint8,   4], //   4 bytes 
   ["Version",        uint32,   1], //   4 bytes
   ["AuditStart",   AuditTag,   1], //   8 bytes
   ["AuditEnd",     AuditTag,   1], //   8 bytes
   ["u5",              uint8,   4], //   4 bytes
   ["u6",              uint8,  60], //  60 bytes
   ["$Tag",           uint16, 514]];//1028 bytes
   return hdr;
  }
  var AuditTag = function() { var adt = [
   ["AuditTime",      uint64,   1], //   8 bytes
   ["$AuditTag1",     uint16,  25], //  50 bytes
   ["$AuditTag2",     uint16,  25], //  50 bytes
   ["u1",              uint8,   4]];//   4 bytes
   return adt;
  }
  return _Header;
 }();

 var SequencerRow = function() {
  var _SequencerRow = function() { Reporting = this.Report; if (Reporting) console.log("__SequencerRow__"); var sr = [
   ["Inj_u1",         uint32,   1], //   4 bytes
   ["Inj_RowNumber",  uint32,   1], //   4 bytes
   ["Inj_u2",         uint32,   1], //   4 bytes
   ["Inj_Vial",       uint16,   6], //  12 bytes
   ["Inj_Volume",    float64,   1], //   8 bytes
   ["Inj_SampWeight",float64,   1], //   8 bytes
   ["Inj_SampVolume",float64,   1], //   8 bytes
   ["Inj_IntStdAmt", float64,   1], //   8 bytes
   ["Inj_DilFactor", float64,   1], //   8 bytes - End of fixed size file start block at byte offset 1420
  	["u1",            PString,   1],
  	["u2",            PString,   1],
  	["ID",            PString,   1],
  	["Comment",       PString,   1],
  	["Userlabel1",    PString,   1],
  	["Userlabel2",    PString,   1],
  	["Userlabel3",    PString,   1],
  	["Userlabel4",    PString,   1],
  	["Userlabel5",    PString,   1],
  	["InstMethod",    PString,   1],
  	["ProcMethod",    PString,   1],
  	["Filename",      PString,   1],
  	["Path",          PString,   1]];
   if (this.Internal.Header.Version >= 57) { sr = sr.concat([
   	["Vial",          PString,   1],
   	["u3",            PString,   1],
   	["u4",            PString,   1],
   	["u5",             uint32,   1]]);
   }
   if (this.Internal.Header.Version >= 60) { sr = sr.concat([
   	["u6-20",         PString,  15]]);
   }
   return sr;
  }
  return _SequencerRow;
 }();

 var AutoSamplerInfo = function() {
  var _AutoSamplerInfo = function() { Reporting = this.Report; if (Reporting) console.log("__AutoSamplerInfo__"); var asi = [
   ["u1",              uint32,  1],
   ["u2",              uint32,  1],
   ["NumberOfWells",   uint32,  1],
   ["u3",              uint32,  1],
   ["u4",              uint32,  1],
   ["u5",              uint32,  1],
   ["ASText",         PString,  1]];
   return asi;
  }
  return _AutoSamplerInfo;
 }();

 var RawFileInfo = function() {
  var _RawFileInfo = function() { Reporting = this.Report; if (Reporting) console.log("__RawFileInfo__"); var rf = [
  	["MethFilePres",   uint32,   1],
  	["Year",           uint16,   1],
  	["Month",          uint16,   1],
  	["Weekday",        uint16,   1],
  	["Day",            uint16,   1],
  	["Hour",           uint16,   1],
  	["Minute",         uint16,   1],
  	["Second",         uint16,   1],
  	["Millisecond",    uint16,   1]];
   if (this.Internal.Header.Version >= 57) { rf = rf.concat([ 
   	["u1",             uint32,   1],
   	["DataAddr32",     uint32,   1],
   	["NControllers",   uint32,   1,   100],
   	["NControllers2",  uint32,   1],
   	["u2",             uint32,   1],
   	["u3",             uint32,   1]]);
    if (this.Internal.Header.Version < 64) { rf = rf.concat([ 
    	["RunHeaderAddr",RunHeaderAddr32, function(parentStruct) {return parentStruct.NControllers}],
    	["Padding1",       uint8,    function(parentStruct) {return (this.Internal.Header.Version == 57 ? 756-12*parentStruct.NControllers : 760-12*parentStruct.NControllers)}]]);
    }
    else { rf = rf.concat([
     ["Padding1",       uint8,  764]]); 
    }
   }
   if (this.Internal.Header.Version >=64) { rf = rf.concat([   
   	["DataAddr",        uint64,   1],
   	["Unknown6",        uint64,   1],
   	["RunHeaderAddr",RunHeaderAddr64, function(parentStruct) {return parentStruct.NControllers}],
   	["Padding2",         uint8,   function(parentStruct) {return (this.Internal.Header.Version < 66 ? 1016-16*parentStruct.NControllers : 1032-16*parentStruct.NControllers)}]]);
   }
   rf = rf.concat([
 	 ["Headings",       PString,  5],
 		["u4",             PString,  1]]);
   return rf;
  }
  var RunHeaderAddr32 = function() { var rha32 = [
  	["Offset32",        uint32,   1],
  	["u4",              uint32,   1],
  	["u5",              uint32,   1]];
   return rha32;
  }
  var RunHeaderAddr64 = function() { var rha = [
  	["Offset",          uint64,   1],
  	["u7",              uint64,   1]];
   return rha;
  }
  return _RawFileInfo;
 }();

 var RunHeader = function() {
  var _RunHeader = function () { Reporting = this.Report; if (Reporting) console.log("__RunHeader["+(this.Internal.RunHeaders.length)+"]__"); var rh = [
  	["SI_u1",           uint32,   1],
  	["SI_u2",           uint32,   1],
  	["FirstScanNumber", uint32,   1],
  	["LastScanNumber",  uint32,   1],
  	["InstLogLength",   uint32,   1],
  	["SI_u3",           uint32,   1],
  	["SI_u4",           uint32,   1]];
   if (this.Internal.Header.Version < 64) { rh = rh.concat([
  	 ["ScanHeaderAddr",  uint32,   1],
   	["DataAddr",        uint32,   1],
   	["InstLogAddr",     uint32,   1],
   	["ErrorLogAddr",    uint32,   1]]);
    }
    else { rh = rh.concat([
   	["ScanHeaderAddr32",uint32,   1],
   	["DataAddr32",      uint32,   1],
    ["InstLogAddr32",   uint32,   1],
  	 ["ErrorLogAddr32",  uint32,   1]]);
   }
   rh = rh.concat([
  	["SI_u5",           uint32,   1],
  	["MaxSignal",      float64,   1],
  	["LowMz",          float64,   1],
  	["HighMz",         float64,   1],
  	["StartTime",      float64,   1],
  	["EndTime",        float64,   1],
  	["SI_u6",            uint8,  56],
  	["$Tag1",           uint16,  44],
  	["$Tag2",           uint16,  20],
  	["$Tag3",           uint16, 160],
  	["$Filename1",      uint16, 260],
  	["$FileName2",      uint16, 260],
  	["$FileName3",      uint16, 260],
  	["$FileName4",      uint16, 260],
  	["$FileName5",      uint16, 260],
  	["$FileName6",      uint16, 260],
  	["u1",             float64,   1],
  	["u2",             float64,   1],
  	["$FileName7",      uint16, 260],
  	["$FileName8",      uint16, 260],
  	["$FileName9",      uint16, 260],
  	["$FileName10",     uint16, 260],
  	["$FileName11",     uint16, 260],
  	["$FileName12",     uint16, 260],
  	["$FileName13",     uint16, 260]]);
   if (this.Internal.Header.Version < 64) { rh = rh.concat([
  	 ["ScanTrailerAddr", uint32,   1],
  	 ["ScanParamsAddr",  uint32,   1]]);
   }
   else { rh = rh.concat([
  	 ["ScanTrailerAddr32",uint32,  1],
  	 ["ScanParamsAddr32",uint32,   1]]);
   }
   rh = rh.concat([
  	["u3",             uint32,   1],
  	["u4",             uint32,   1],
  	["NSegs",          uint32,   1],
  	["u5",             uint32,   1],
  	["u6",             uint32,   1],
  	["OwnAddr32",      uint32,   1],
  	["u7",             uint32,   1],
  	["u8",             uint32,   1]]);
   if (this.Internal.Header.Version >= 64) { rh = rh.concat([
   	["ScanHeaderAddr", uint64,   1],
   	["DataAddr",       uint64,   1],
   	["InstLogAddr",    uint64,   1],
   	["ErrorLogAddr",   uint64,   1],
   	["Unknown9",       uint64,   1],
   	["ScanTrailerAddr",uint64,   1],
   	["ScanParamsAddr", uint64,   1],
   	["u10",            uint32,   1],
   	["u11",            uint32,   1],
   	["OwnAddr",        uint64,   1],
   	["u12-35",         uint32,  24]]);
   }
   rh = rh.concat([
  	["u36",             uint8,   8],
  	["u37",            uint32,   1],
  	["Device",        PString,   1],
  	["Model",         PString,   1],
  	["SN",            PString,   1],
  	["SWVer",         PString,   1],
  	["Tag1",          PString,   1],
  	["Tag2",          PString,   1],
  	["Tag3",          PString,   1],
  	["Tag4",          PString,   1]]);
   return rh;
  }
  return _RunHeader;
 }();

 var ScanHeaderList = function() {
  var _ScanHeaderList = function () { Reporting = this.Report; if (Reporting) console.log("__ScanHeaderList__(silent)"); Reporting = false; var shl = [
   ["ScanHeaders",ScanHeader,   function() {return this.Internal.NScans}],
  	["?NScans",        uint32,   1],
  	["ScanEvents",  ScanEvent,   function() {return this.Internal.NScans}]];
   return shl;
  }
  var ScanHeader = function() {
   var sh = [];
   if (this.Internal.Construction.PartialStruct[0].ScanHeaders && this.Internal.Construction.PartialStruct[0].ScanHeaders.length) {
    this.Progress = (this.Internal.Construction.PartialStruct[0].ScanHeaders.length/this.Internal.NScans)*50;
    if (this.Report && !(this.Internal.Construction.PartialStruct[0].ScanHeaders.length % 2000)) console.log("Reading ScanHeaderList: "+this.Progress.toFixed(0)+"%");
   }
   if (this.Internal.Header.Version < 64) { sh = sh.concat([ 
  	 ["Offset",        uint32,   1]]);
   }
   else { sh = sh.concat([ 
	   ["Offset32",      uint32,   1]]);
   }
   sh = sh.concat([
  	["Index",          uint32,   1],
  	["ScanEvent",      uint16,   1],
  	["ScanSegment",    uint16,   1],
  	["Next",           uint32,   1],
  	["u1",             uint32,   1],
  	["DataPacketSize", uint32,   1],
  	["Time",          float64,   1],
  	["TotalCurrent",  float64,   1],
  	["BaseIntensity", float64,   1],
  	["BaseMz",        float64,   1],
  	["LowMz",         float64,   1],
  	["HighMz",        float64,   1]]);
   if (this.Internal.Header.Version >= 64) { sh = sh.concat([ 
  	 ["Offset",         uint64,   1]]);
   }
   if (this.Internal.Header.Version >= 66) { sh = sh.concat([ 
  	 ["u2",             uint32,   1],
    ["u3",             uint32,   1]]);
   }
   return sh;
  }
  var ScanEvent = function() { var sev;
  	//Preamble[6] == ms-level
  	//Preamble[40] == analyzer
   if (this.Internal.Construction.PartialStruct[0].ScanEvents && this.Internal.Construction.PartialStruct[0].ScanEvents.length) {
    this.Progress = (this.Internal.Construction.PartialStruct[0].ScanEvents.length/this.Internal.NScans)*50 + 50;
    if (this.Report && !(this.Internal.Construction.PartialStruct[0].ScanEvents.length % 2000)) console.log("Reading ScanHeaderList: "+this.Progress.toFixed(0)+"%");
   }
   if (this.Internal.Header.Version < 66) { sev = [  //Fix this?
    ["SEPreamble",      uint8,   function() {
                                        if      (this.Internal.Header.Version < 57) return  41;
                                        else if (this.Internal.Header.Version < 62) return  80;
                                        else if (this.Internal.Header.Version < 63) return 120;
                                        else return 128;
                                 }],
    ["NPrecursors",    uint32,   1,   100],
  	 ["Reaction",     Reaction,   function(parentStruct) {return parentStruct.NPrecursors}],
   	["u1",             uint32,   1],
   	["MzRange",FractionCollector,1],
   	["NParam",         uint32,   1],
   	["u2",            float64,   function(parentStruct) {return (parentStruct.NParam == 7 ? 2 : 1)}],
   	["A",             float64,   1],
   	["B",             float64,   1],
   	["C",             float64,   1],
   	["u2",            float64,   function(parentStruct) {return (parentStruct.NParam == 7 ? 2 : 0)}],
   	["u1",             uint32,   2]];
   }
   else { sev = [  //v66
    ["Preamble",        uint8, 132],
   	["u1",             uint32,   1],
    ["NPrecursors",    uint32,   1],
  	 ["Reaction",     Reaction,   function(parentStruct) {return (parentStruct.SEPreamble[10] == 1 ? parentStruct.NPrecursors : 0)}],
    ["u2",            float64,   function(parentStruct) {return (parentStruct.SEPreamble[10] == 1 ? 2 : 0)}],
    ["MzRange",FractionCollector,function(parentStruct) {return (parentStruct.SEPreamble[10] != 1 ? 1 : 0)}],
    ["u1",             uint32,   function(parentStruct) {return (parentStruct.SEPreamble[10] != 1 ? 4 : 0)}],
    ["MzRange",FractionCollector,function(parentStruct) {return (parentStruct.SEPreamble[10] != 1 ? 1 : 0)}],
    ["u1",             uint32,   3],
    ["MzRange",FractionCollector,1],
   	["NParam",         uint32,   1],
    ["u3",            float64,   2],
   	["A",             float64,   1],
   	["B",             float64,   1],
   	["C",             float64,   1],
    ["u4",             uint32,   5]];
   }
   return sev;
  }
  var	Reaction = function() { return [
   ["PrecursorMz",   float64,   1],
  	["u1",            float64,   1],
  	["Energy",        float64,   1],
  	["u2",             uint32,   1],
  	["u3",             uint32,   1]];
  }
  var FractionCollector = function() { return [
	  ["LowMz",         float64,   1],
	  ["HighMz",        float64,   1]];
  }
  return _ScanHeaderList;
 }();

 var ScanDataPacket = function() {
  var _ScanDataPacket = function() { Reporting = this.Report; if (Reporting) console.log("__ScanDataPacket__"); return [
  	["u1",             uint32,   1],
  	["ProfileSize",    uint32,   1],
  	["PeakListSize",   uint32,   1],
  	["Layout",         uint32,   1],
  	["DescriptorListSize",uint32,1],
  	["unkStreamSize",  uint32,   1],
  	["TripletStreamSize",uint32, 1],
  	["u2",             uint32,   1],
  	["LowMz",         float32,   1],
  	["HighMz",        float32,   1],
  	["Profile",       Profile,   function(parentStruct) {return (parentStruct.ProfileSize > 0)}],
  	["PeakList",     PeakList,   function(parentStruct) {return (parentStruct.PeakListSize > 0)}],
  	["DescriptorList",Descriptor,function(parentStruct) {return parentStruct.DescriptorListSize}],
  	["unk",           float32,   function(parentStruct) {return parentStruct.unkStreamSize}],
  	["Triplets",      float32,   function(parentStruct) {return parentStruct.TripletStreamSize}]];
  }
  var Profile = function() { return [
  	["FirstValue",    float64,   1],
  	["Step",          float64,   1],
  	["PeakCount",      uint32,   1],
  	["NBins",          uint32,   1],
  	["Chunks",   ProfileChunk,   function(parentStruct) {return parentStruct.PeakCount}]];
  }
  var ProfileChunk = function() { return [
  	["FirstBin",       uint32,   1],
  	["NBins",          uint32,   1],
  	["Fudge",         float32,   function() {return (this.Internal.Construction.PartialStruct[2].Layout > 0)}],
  	["Signal",        float32,   function(parentStruct) {return parentStruct.NBins}]];
  }
  var PeakList = function () { return [
   ["Count",          uint32,   1],
   ["Peaks",  CentroidedPeak,   function(parentStruct) {return parentStruct.Count}]];
  }
  var CentroidedPeak = function () { return [
  	["Mz",            float32,   1],
  	["Abundance",     float32,   1]];
  }
  var Descriptor = function() { return [
  	["Index",          uint16,   1],
  	["Flags",           uint8,   1],
  	["Charge",          uint8,   1]];
  }
  return _ScanDataPacket;
 }();

 //pseudo-struct fetch

 //use: fetchStruct.call(ThermoRawFile,callback,pos,structfn)

 var fetchStruct = function(callback,pos,structfn) {
  if (!structfn) return("ThermoRawFileUnknownStruct");
  this.Ready = 0;
  this.Progress = 0;
  if (pos != null) this.Reader.Position = pos;
  this.Internal.Construction = {};
  this.Internal.Construction.Callback = callback;
  this.Internal.Construction.Queue = [structfn.call(this)];
  this.Internal.Construction.PartialStruct = [{}];
  this.Internal.Construction.CurrentStructDef = [];
  processConstruction.call(this);
 }

 var processConstruction = function() {
  if (this.Internal.Construction) {
   if (this.Internal.Construction.Queue.length) {
    if (this.Internal.Construction.Queue[0].length) {
     var curr = this.Internal.Construction.Queue[0].shift();
     var substruct = curr[1].call(this);
     var repeat = (typeof(curr[2]) === "function" ? curr[2].call(this,this.Internal.Construction.PartialStruct[0]) : curr[2]);
     if (repeat == 0) processConstruction.bind(this)();
     else {
      this.Internal.Construction.CurrentStructDef.unshift(curr);
      if (substruct.CType) {
       if ((repeat * substruct.ByteLength) > (this.Reader.File.size-this.Reader.Position)) {
        console.log("Error fetching "+this.Internal.Construction.CurrentStructDef[0][0]+" in "+this.Internal.Construction.CurrentStructDef[1][0]+": "+repeat+" * "+substruct.ByteLength+" bytes is more than remaining file length of "+(this.Reader.File.size-this.Reader.Position)+" at position "+this.Reader.Position);
        console.log(this.Internal.Construction.PartialStruct);
       }
       else {
        if (Reporting) console.log(this.Internal.Construction.CurrentStructDef.map(function(e) {return e[0]}).reverse().join(":") + " - " + substruct.ByteLength * repeat + " bytes at offset " + this.Reader.Position);
        this.LastError = this.Reader.readBinary(
         parseStructBinary,
         this.Reader.Position,
         substruct.ByteLength * repeat
        );
       }
      }
      else { //Down a recursion level
       if (repeat > 1) { // expand repeated structs into multiple singlets
        curr[2] = 1;
        for (var i = 0; i < (repeat-1); i++) { //one less than repeat as instigate first read of struct below anyway
         this.Internal.Construction.Queue[0].unshift(curr)
        }
       }
       this.Internal.Construction.Queue.unshift(substruct);
       this.Internal.Construction.PartialStruct.unshift({});
       processConstruction.call(this);
      }    
     }
    }
    else { //Up a recursion level
     var finishedStructDef = this.Internal.Construction.CurrentStructDef.shift();
     var finishedStruct = this.Internal.Construction.PartialStruct.shift();
     if (finishedStructDef) {
      if (this.Internal.Construction.PartialStruct[0][finishedStructDef[0]]) {
       if (Array.isArray(this.Internal.Construction.PartialStruct[0][finishedStructDef[0]])) {
        this.Internal.Construction.PartialStruct[0][finishedStructDef[0]].push(finishedStruct)
       }
       else {
        this.Internal.Construction.PartialStruct[0][finishedStructDef[0]] = [this.Internal.Construction.PartialStruct[0][finishedStructDef[0]],finishedStruct]
       }
      }
      else {
       this.Internal.Construction.PartialStruct[0][finishedStructDef[0]] = finishedStruct;
      }
      this.Internal.Construction.Queue.shift()  //Remove empty recursion level
      processConstruction.call(this);
     }
     else { //Done!
      var callback = this.Internal.Construction.Callback;
      delete(this.Internal.Construction);
      callback(finishedStruct);
     }
    }
   }
  }
 }

 var parseStructBinary = function() { //Use DataView to force little endian reads
  var dV = new DataView(this.result);
  var sdef = this.Parent.Internal.Construction.CurrentStructDef.shift();
  var ctype = sdef[1]();
  var repeat = (typeof(sdef[2]) === "function" ? sdef[2].call(this.Parent,this.Parent.Internal.Construction.PartialStruct[0]) : sdef[2]);
  var values = [];
  if (sdef[3]) {
   for (var i=0; i<repeat; i++) {
    values.push(Math.min(ctype.read.call(dV,i*ctype.ByteLength,true),sdef[3]));
   }
  }
  else {
   for (var i=0; i<repeat; i++) {
    values.push(ctype.read.call(dV,i*ctype.ByteLength,true));
   }
  }
  var finalval = (sdef[0].charAt(0) == "$" ?  DecodeUTF16(values) : (repeat == 1 ? values[0] : values));
  if (this.Parent.Internal.Construction.PartialStruct[0][sdef[0]]) {
   if (Array.isArray(this.Parent.Internal.Construction.PartialStruct[0][sdef[0]])) {
    this.Parent.Internal.Construction.PartialStruct[0][sdef[0]] = this.Parent.Internal.Construction.PartialStruct[0][sdef[0]].concat(finalval);
   }
   else {
    this.Parent.Internal.Construction.PartialStruct[0][sdef[0]] = [this.Parent.Internal.Construction.PartialStruct[0][sdef[0]]].concat(finalval);
   }
  }
  else {
   this.Parent.Internal.Construction.PartialStruct[0][sdef[0]] = finalval;
  }
  processConstruction.bind(this.Parent)();
 }

 var DecodeUTF16 = function(arr) {
  var endindex = arr.indexOf(0);
  if (endindex < 0) {
   return String.fromCharCode.apply(null,arr);
  } 
  else {
   return String.fromCharCode.apply(null,arr.slice(0,endindex));
  }
 }

 return ThermoRawFile;

}();