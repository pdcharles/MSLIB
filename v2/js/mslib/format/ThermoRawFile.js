import { MsDataFile } from './base/MsDataFile.js';

export let ThermoRawFile = function _SOURCE() {

 if (typeof MsDataFile === 'undefined') let MsDataFile = mslib.format.base.MsDataFile;

 const ANALYSER = ["ITMS","TQMS","SQMS","TOFMS","FTMS","Sector"];

 var _ThermoRawFile = function(f) {
  mslib.format.MsDataFile.call(this, f);
  if (f.name.match(/\.raw$/i)) {
   this.fileType = "thermo_raw";
  }
  else {
   throw new Error("ThermoRawFileInvalidFileType");
  }
  this.fetchProfileSpectraWhenAvailable = true;
 };
 _ThermoRawFile.prototype = Object.create((typeof MsDataFile !== 'undefined') ? MsDataFile.prototype : mslib.format.base.MsDataFile.prototype);

 var verbose = false;

 //------------------------------------------------------------------------------
 //ThermoRawFile ASync methods
 //------------------------------------------------------------------------------

 _ThermoRawFile.prototype.fetchScanoffsets = function(prefetchscanHeaders) { //Nested calls to get all file headers at once
  //prefetchscanHeaders not used (they have to be fetched either way)
  if (!this.ready) throw new Error("ThermoRawFileNotReady");
  mslib.common.start(this);
  this.reader.readBinary(function() {
    (function() {
     fetchStruct.call(this,(function(s){
      this.internal.header = s;
      this.internal.offsets.sequencerRow = this.reader.position;
      fetchStruct.call(this,(function(s){
       this.internal.sequencerRow = s;
       this.internal.offsets.autoSamplerInfo = this.reader.position;
       fetchStruct.call(this,(function(s){
        this.internal.autoSamplerInfo = s;
        this.internal.offsets.rawFileInfo = this.reader.position;
        fetchStruct.call(this,(function(s){
         this.internal.rawFileInfo = s;
         this.internal.offsets.runHeaders = this.internal.rawFileInfo.runHeaderAddr.map((ele) => ele.offset);
         this.internal.runHeaders = [];
         fetchrunHeaders.call(this);
        }).bind(this),null,rawFileInfo);        
       }).bind(this),null,autoSamplerInfo);
      }).bind(this),null,sequencerRow);
     }).bind(this),0,header);
    }).call(this.parent);
   },
   0,
   1420 // First 1420 bytes are fixed and can be prebuffered
  );
 };

 //fetchScanoffsets callbacks
 var fetchrunHeaders = function() {
  if (this.internal.offsets.runHeaders.length && (this.internal.offsets.runHeaders[this.internal.offsets.runHeaders.length-1] < this.reader.File.size)) {
   if (this.internal.runHeaders.length < this.internal.offsets.runHeaders.length) {
    fetchStruct.call(this,(function(s){
     this.internal.runHeaders.push(s); 
     fetchrunHeaders.call(this);
    }).bind(this),this.internal.offsets.runHeaders[this.internal.runHeaders.length],runHeader);
   }
   else {
    this.internal.msRunHeader = null;
    for (var i in this.internal.runHeaders) {
     if (this.internal.offsets.scanEventList = this.internal.runHeaders[i].scanTrailerAddr) { //Find a runHeader with defined scanTrailerAddr (=mass spec device)
      this.internal.offsets.scanHeaderList = this.internal.runHeaders[i].scanHeaderAddr;
      this.internal.msRunHeader = this.internal.runHeaders[i];
      break;
     }
    }
    if (this.internal.msRunHeader != null) {
     this.internal.nScans = this.internal.msRunHeader.LastScanNumber - this.internal.msRunHeader.firstScanNumber + 1;
     fetchscanHeaderList.call(this);
    }
    else {
     console.log("Error: cannot find msRunHeader in file");
    }
   }
  }
  else {
  console.log("Error retrieving runHeaders");
  } 
 }

 var fetchscanHeaderList = function() {
  this.reader.readBinary(function() { // Pre-buffer
    (function() {
     fetchStruct.call(this,(function(s){
      this.internal.scanHeaderList = s;
      var prevSN = null;
      this.internal.scanHeaderList.scanHeaders.forEach(function(h,i) {
       var s = h.Index+1;
       var e = this.internal.scanHeaderList.scanEvents[i];
       this.scans[s] = {};
       this.scans[s].offset = H.offset + this.internal.msRunHeader.dataAddr;
       this.scans[s].length = H.DataPacketSize;
       var scan = new mslib.data.Scan();
       scan.scanNumber         = s;
       scan.msLevel            = e.sePreamble[6];
       scan.retentionTime      = h.Time;
       scan.lowMz              = h.LowMz;
       scan.highMz             = h.HighMz;
       scan.totalCurrent       = h.TotalCurrent;
       scan.basePeakMz         = h.BaseMz;
       scan.basePeakIntensity  = h.BaseIntensity;
       scan.analyser           = (e.sePreamble[40] >= ANALYSER.length ? undefined : ANALYSER[e.sePreamble[40]]);
       scan.internal.hzConversionParams = [e.nParam,e.a,e.b,e.c];
       if (e.nPrecursors) {
        scan.precursorMzs      = (e.nPrecursors > 1 ? e.reaction.map((ele) => ele.precursorMz) : [e.reaction.precursorMz]);
       }
       this.scans[s].scanData = scan.toArray();
       if (prevSN != null) {
        this.scans[prevSN].next = s;
        this.scans[s].previous = prevSN;
       }
       prevSN = s;
      },this);
      mslib.common.finish(this);
     }).bind(this),this.internal.offsets.scanHeaderList,scanHeaderList);
    }).call(this.parent);
   },
   this.internal.offsets.scanHeaderList,
   this.internal.msRunHeader.scanParamsAddr - this.internal.offsets.scanHeaderList
  );
 }

 _ThermoRawFile.prototype.fetchscanHeader = function(scan,prefetchSpectrumData) {
  if (!this.ready) throw new Error("ThermoRawFileNotReady");
  if (!this.scans.length) throw new Error("ThermoRawFileNoScanoffsets");
  if (!this.scans[scan]) throw new Error("ThermoRawFileScanunknown");
  this.currentScan = new mslib.data.Scan(this.scans[scan].scanData);
  if (prefetchSpectrumData) {
   this.internal.prefetchSpectrum = true;
   this.fetchSpectrumData();
  }
 }

 _ThermoRawFile.prototype.fetchAllscanHeaders = function() {
  if (!this.ready) throw new Error("ThermoRawFileNotReady");
  if (!this.scans.length) this.fetchScanoffsets();
  //Already done during fetchScanoffsets
 }

 _ThermoRawFile.prototype.fetchSpectrumData = function() {
  if (this.internal.PrefetchSpectrum) delete this.internal.PrefetchSpectrum;
  else {
   if (!this.ready) throw new Error("ThermoRawFileNotReady");
   if (!this.scans.length) throw new Error("ThermoRawFileNoScanoffsets");
   if (!this.currentScan) throw new Error("ThermoRawFileScanNotLoaded");
   mslib.common.start(this);
  }
  this.reader.readBinary(function() { // Pre-buffer
    (function() {
     fetchStruct.call(this,(function(s){
      this.internal.scanDataPacket = s;
      var mzs = [];
      var ints = [];     
     	if ((this.internal.scanDataPacket.profile.peakCount > 0) && this.fetchProfileSpectraWhenAvailable) {
       var fv = this.internal.scanDataPacket.profile.FirstValue;
       var step = this.internal.scanDataPacket.profile.Step; 
     		//convert Hz values into m/z and save the profile peaks
     		this.internal.scanDataPacket.profile.chunks.forEach(function(chunk,i) {
     			this.internal.scanDataPacket.profile.chunks[i].signal.forEach(function(signal,j) {
     				mzs.push(convertHz(this.currentScan.internal.hzConversionParams,(fv+(chunk.firstBin+j)*step)) + chunk.fudge);
     				ints.push(signal);
     			},this);
     		},this);
     	} 
      else {
     		//Save the Centroided Peaks, they also occur in profile scans but
     		//overlap with profiles, Thermo always does centroiding just for fun
       this.currentScan.centroided = true;
       mzs = this.internal.scanDataPacket.profile.peakList.peaks.map((peak) => peak.mz);
       ints = this.internal.scanDataPacket.profile.peakList.peaks.map((peak) => peak.abundance);
      }
      this.currentScan.spectrum = new mslib.data.Spectrum(mzs,ints);
      mslib.common.finish(this);
     }).bind(this),this.scans[this.currentScan.scanNumber].offset,scanDataPacket);
    }).call(this.parent);
   },
   this.scans[this.currentScan.scanNumber].offset,
   this.scans[this.currentScan.scanNumber].length 
  );
 }

 var convertHz = function(p,v) {
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

 //pseudo-cTypes
 var uint8   = function() { return { cType :   "uint8", byteLength : 1, read : DataView.prototype.getUint8   } };
 var uint16  = function() { return { cType :  "uint16", byteLength : 2, read : DataView.prototype.getUint16  } };
 var uint32  = function() { return { cType :  "uint32", byteLength : 4, read : DataView.prototype.getUint32  } };
 var uint64  = function() { return { cType :  "uint64", byteLength : 8, read : DataView.prototype.getUint32  } };// Javascript doesn't support 64 bit integers, however the number is stored in little-endian format and for the (relevant) use-cases is exceedingly unlikely to be larger than 2^53 so can be read as uint32 
 var float32 = function() { return { cType : "float32", byteLength : 4, read : DataView.prototype.getFloat32 } };
 var float64 = function() { return { cType : "float64", byteLength : 8, read : DataView.prototype.getFloat64 } };

 //pseudo-pascalstring
 var pString = function() {
  var _pString = function() { return [
   ["length",          uint32,   1,   1e5], //4 bytes
   ["$text",           uint16,   ps => ps.Length]]; //Length * 2 bytes
  }
  return _pString;
 }();

 //pseudo-structs
 var header = function() {
  var _header = function() { if (this.report) console.log("__Header__"); var hdr = [
   ["magic",          uint16,   1], //   2 bytes - Start of fixed size file start block at byte offset 0
   ["$signature",     uint16,   9], //  18 bytes
   ["u1",              uint8,   4], //   4 bytes
   ["u2",              uint8,   4], //   4 bytes 
   ["u3",              uint8,   4], //   4 bytes 
   ["u4",              uint8,   4], //   4 bytes 
   ["version",        uint32,   1], //   4 bytes
   ["auditStart",   Audittag,   1], //   8 bytes
   ["auditEnd",     Audittag,   1], //   8 bytes
   ["u5",              uint8,   4], //   4 bytes
   ["u6",              uint8,  60], //  60 bytes
   ["$tag",           uint16, 514]];//1028 bytes
   return hdr;
  }
  var audittag = function() { var adt = [
   ["auditTime",      uint64,   1], //   8 bytes
   ["$audittag1",     uint16,  25], //  50 bytes
   ["$audittag2",     uint16,  25], //  50 bytes
   ["u1",              uint8,   4]];//   4 bytes
   return adt;
  }
  return _header;
 }();

 var sequencerRow = function() {
  var _sequencerRow = function() { if(this.report) console.log("__sequencerRow__"); var sr = [
   ["inj_u1",         uint32,   1], //   4 bytes
   ["inj_rowNumber",  uint32,   1], //   4 bytes
   ["inj_u2",         uint32,   1], //   4 bytes
   ["inj_vial",       uint16,   6], //  12 bytes
   ["inj_volume",    float64,   1], //   8 bytes
   ["inj_sampWeight",float64,   1], //   8 bytes
   ["inj_sampVolume",float64,   1], //   8 bytes
   ["inj_intStdAmt", float64,   1], //   8 bytes
   ["inj_dilFactor", float64,   1], //   8 bytes - End of fixed size file start block at byte offset 1420
  	["u1",            pString,   1],
  	["u2",            pString,   1],
  	["id",            pString,   1],
  	["comment",       pString,   1],
  	["userLabel1",    pString,   1],
  	["userLabel2",    pString,   1],
  	["userLabel3",    pString,   1],
  	["userLabel4",    pString,   1],
  	["userLabel5",    pString,   1],
  	["instMethod",    pString,   1],
  	["procMethod",    pString,   1],
  	["filename",      pString,   1],
  	["path",          pString,   1]];
   if (this.internal.header.version >= 57) { sr = sr.concat([
   	["vial",          pString,   1],
   	["u3",            pString,   1],
   	["u4",            pString,   1],
   	["u5",             uint32,   1]]);
   }
   if (this.internal.header.version >= 60) { sr = sr.concat([
   	["u6-20",         pString,  15]]);
   }
   return sr;
  }
  return _sequencerRow;
 }();

 var autoSamplerInfo = function() {
  var _autoSamplerInfo = function() { if (this.report) console.log("__autoSamplerInfo__"); var asi = [
   ["u1",              uint32,  1],
   ["u2",              uint32,  1],
   ["numberOfWells",   uint32,  1],
   ["u3",              uint32,  1],
   ["u4",              uint32,  1],
   ["u5",              uint32,  1],
   ["asText",         pString,  1]];
   return asi;
  }
  return _autoSamplerInfo;
 }();

 var rawFileInfo = function() {
  var _rawFileInfo = function() { if (this.report) console.log("__rawFileInfo__"); var rf = [
  	["methFilePres",   uint32,   1],
  	["year",           uint16,   1],
  	["month",          uint16,   1],
  	["weekday",        uint16,   1],
  	["day",            uint16,   1],
  	["hour",           uint16,   1],
  	["minute",         uint16,   1],
  	["second",         uint16,   1],
  	["millisecond",    uint16,   1]];
   if (this.internal.header.version >= 57) { rf = rf.concat([ 
   	["u1",             uint32,   1],
   	["dataAddr32",     uint32,   1],
   	["nControllers",   uint32,   1,   100],
   	["nControllers2",  uint32,   1],
   	["u2",             uint32,   1],
   	["u3",             uint32,   1]]);
    if (this.internal.header.version < 64) { rf = rf.concat([ 
    	["runHeaderAddr",runHeaderAddr32, ps => ps.nControllers],
    	["padding1",       uint8,    ps => (this.internal.header.version == 57 ? 756-12*ps.nControllers : 760-12*ps.nControllers)]]);
    }
    else { rf = rf.concat([
     ["padding1",       uint8,  764]]); 
    }
   }
   if (this.internal.header.version >=64) { rf = rf.concat([   
   	["dataAddr",        uint64,   1],
   	["unknown6",        uint64,   1],
   	["runHeaderAddr",runHeaderAddr64, (ps => (ps.nControllers))],
   	["padding2",         uint8,   ps => (this.internal.header.version < 66 ? 1016-16*ps.nControllers : 1032-16*ps.nControllers)]]);
   }
   rf = rf.concat([
 	 ["headings",       pString,  5],
 		["u4",             pString,  1]]);
   return rf;
  }
  var runHeaderAddr32 = function() { var rha32 = [
  	["offset32",        uint32,   1],
  	["u4",              uint32,   1],
  	["u5",              uint32,   1]];
   return rha32;
  }
  var runHeaderAddr64 = function() { var rha = [
  	["offset",          uint64,   1],
  	["u7",              uint64,   1]];
   return rha;
  }
  return _rawFileInfo;
 }();

 var runHeader = function() {
  var _runHeader = function () { if (this.report) console.log("__runHeader["+(this.internal.runHeaders.length)+"]__"); var rh = [
  	["si_u1",           uint32,   1],
  	["si_u2",           uint32,   1],
  	["firstScanNumber", uint32,   1],
  	["lastScanNumber",  uint32,   1],
  	["instLogLength",   uint32,   1],
  	["si_u3",           uint32,   1],
  	["si_u4",           uint32,   1]];
   if (this.internal.header.version < 64) { rh = rh.concat([
  	 ["scanHeaderAddr",  uint32,   1],
   	["dataAddr",        uint32,   1],
   	["instLogAddr",     uint32,   1],
   	["errorLogAddr",    uint32,   1]]);
    }
    else { rh = rh.concat([
   	["scanHeaderAddr32",uint32,   1],
   	["dataAddr32",      uint32,   1],
    ["instLogAddr32",   uint32,   1],
  	 ["errorLogAddr32",  uint32,   1]]);
   }
   rh = rh.concat([
  	["si_u5",           uint32,   1],
  	["maxSignal",      float64,   1],
  	["lowMz",          float64,   1],
  	["highMz",         float64,   1],
  	["startTime",      float64,   1],
  	["endTime",        float64,   1],
  	["si_u6",            uint8,  56],
  	["$tag1",           uint16,  44],
  	["$tag2",           uint16,  20],
  	["$tag3",           uint16, 160],
  	["$fileName1",      uint16, 260],
  	["$fileName2",      uint16, 260],
  	["$fileName3",      uint16, 260],
  	["$fileName4",      uint16, 260],
  	["$fileName5",      uint16, 260],
  	["$fileName6",      uint16, 260],
  	["u1",             float64,   1],
  	["u2",             float64,   1],
  	["$fileName7",      uint16, 260],
  	["$fileName8",      uint16, 260],
  	["$fileName9",      uint16, 260],
  	["$fileName10",     uint16, 260],
  	["$fileName11",     uint16, 260],
  	["$fileName12",     uint16, 260],
  	["$fileName13",     uint16, 260]]);
   if (this.internal.header.version < 64) { rh = rh.concat([
  	 ["scanTrailerAddr", uint32,   1],
  	 ["scanParamsAddr",  uint32,   1]]);
   }
   else { rh = rh.concat([
  	 ["scanTrailerAddr32",uint32,  1],
  	 ["scanParamsAddr32",uint32,   1]]);
   }
   rh = rh.concat([
  	["u3",             uint32,   1],
  	["u4",             uint32,   1],
  	["nSegs",          uint32,   1],
  	["u5",             uint32,   1],
  	["u6",             uint32,   1],
  	["ownAddr32",      uint32,   1],
  	["u7",             uint32,   1],
  	["u8",             uint32,   1]]);
   if (this.internal.header.version >= 64) { rh = rh.concat([
   	["scanHeaderAddr", uint64,   1],
   	["dataAddr",       uint64,   1],
   	["instLogAddr",    uint64,   1],
   	["errorLogAddr",   uint64,   1],
   	["unknown9",       uint64,   1],
   	["scanTrailerAddr",uint64,   1],
   	["scanParamsAddr", uint64,   1],
   	["u10",            uint32,   1],
   	["u11",            uint32,   1],
   	["ownAddr",        uint64,   1],
   	["u12-35",         uint32,  24]]);
   }
   rh = rh.concat([
  	["u36",             uint8,   8],
  	["u37",            uint32,   1],
  	["device",        pString,   1],
  	["model",         pString,   1],
  	["sn",            pString,   1],
  	["swVer",         pString,   1],
  	["tag1",          pString,   1],
  	["tag2",          pString,   1],
  	["tag3",          pString,   1],
  	["tag4",          pString,   1]]);
   return rh;
  }
  return _runHeader;
 }();

 var scanHeaderList = function() {
  var _scanHeaderList = function () { if (this.report) console.log("__scanHeaderList__(silent)"); var shl = [
   ["scanHeaders",scanHeader,   function () {return this.internal.nScans}],
  	["?nScans",        uint32,   1],
  	["scanEvents",  ScanEvent,   function () {return this.internal.nScans}]];
   return shl;
  }
  var scanHeader = function() {
   var sh = [];
   if (this.internal.construction.partialStruct[0].scanHeaders && this.internal.construction.partialStruct[0].scanHeaders.length) {
    mslib.common.progress(this,(this.internal.construction.partialStruct[0].scanHeaders.length/this.internal.nScans)*50);
    if (this.report && !(this.internal.construction.partialStruct[0].scanHeaders.length % 2000)) console.log("Reading scanHeaderList: "+this.progress.toFixed(0)+"%");
   }
   if (this.internal.header.version < 64) { sh = sh.concat([ 
  	 ["offset",        uint32,   1]]);
   }
   else { sh = sh.concat([ 
	   ["offset32",      uint32,   1]]);
   }
   sh = sh.concat([
  	["index",          uint32,   1],
  	["scanEvent",      uint16,   1],
  	["scanSegment",    uint16,   1],
  	["next",           uint32,   1],
  	["u1",             uint32,   1],
  	["dataPacketSize", uint32,   1],
  	["time",          float64,   1],
  	["totalCurrent",  float64,   1],
  	["baseIntensity", float64,   1],
  	["baseMz",        float64,   1],
  	["lowMz",         float64,   1],
  	["highMz",        float64,   1]]);
   if (this.internal.header.version >= 64) { sh = sh.concat([ 
  	 ["offset",         uint64,   1]]);
   }
   if (this.internal.header.version >= 66) { sh = sh.concat([ 
  	 ["u2",             uint32,   1],
    ["u3",             uint32,   1]]);
   }
   return sh;
  }
  var scanEvent = function() { var sev;
  	//Preamble[6] == ms-level
  	//Preamble[40] == analyzer
   if (this.internal.construction.partialStruct[0].scanEvents && this.internal.construction.partialStruct[0].scanEvents.length) {
    mslib.common.progress(this,(this.internal.construction.partialStruct[0].scanEvents.length/this.internal.nScans)*50 + 50);
    if (this.report && !(this.internal.construction.partialStruct[0].scanEvents.length % 2000)) console.log("Reading scanHeaderList: "+this.progress.toFixed(0)+"%");
   }
   if (this.internal.header.version < 66) { sev = [  //Fix this?
    ["sePreamble",      uint8,   function() {
                                  if      (this.internal.header.version < 57) return  41;
                                  else if (this.internal.header.version < 62) return  80;
                                  else if (this.internal.header.version < 63) return 120;
                                  else return 128;
                                 }],
    ["nPrecursors",    uint32,   1,   100],
  	 ["reaction",     reaction,   ps => ps.nPrecursors],
   	["u1",             uint32,   1],
   	["mzRange",fractionCollector,1],
   	["nParam",         uint32,   1],
   	["u2",            float64,   ps => (ps.nParam == 7 ? 2 : 1)],
   	["a",             float64,   1],
   	["b",             float64,   1],
   	["c",             float64,   1],
   	["u2",            float64,   ps => (ps.nParam == 7 ? 2 : 0)],
   	["u1",             uint32,   2]];
   }
   else { sev = [  //v66
    ["preamble",        uint8, 132],
   	["u1",             uint32,   1],
    ["nPrecursors",    uint32,   1],
  	 ["reaction",     reaction,   ps => (ps.sePreamble[10] == 1 ? ps.nPrecursors : 0)],
    ["u2",            float64,   ps => (ps.sePreamble[10] == 1 ? 2 : 0)],
    ["mzRange",fractionCollector,ps => (ps.sePreamble[10] != 1 ? 1 : 0)],
    ["u1",             uint32,   ps => (ps.sePreamble[10] != 1 ? 4 : 0)],
    ["mzRange",fractionCollector,ps => (ps.sePreamble[10] != 1 ? 1 : 0)],
    ["u1",             uint32,   3],
    ["mzRange",fractionCollector,1],
   	["nParam",         uint32,   1],
    ["u3",            float64,   2],
   	["a",             float64,   1],
   	["b",             float64,   1],
   	["c",             float64,   1],
    ["u4",             uint32,   5]];
   }
   return sev;
  }
  var	reaction = function() { return [
   ["precursorMz",   float64,   1],
  	["u1",            float64,   1],
  	["energy",        float64,   1],
  	["u2",             uint32,   1],
  	["u3",             uint32,   1]];
  }
  var fractionCollector = function() { return [
	  ["lowMz",         float64,   1],
	  ["highMz",        float64,   1]];
  }
  return _scanHeaderList;
 }();

 var scanDataPacket = function() {
  var _scanDataPacket = function() { if (this.report) console.log("__scanDataPacket__"); return [
  	["u1",             uint32,   1],
  	["profileSize",    uint32,   1],
  	["peakListSize",   uint32,   1],
  	["layout",         uint32,   1],
  	["descriptorListSize",uint32,1],
  	["unkStreamSize",  uint32,   1],
  	["tripletStreamSize",uint32, 1],
  	["u2",             uint32,   1],
  	["lowMz",         float32,   1],
  	["highMz",        float32,   1],
  	["profile",       profile,   ps => (ps.profileSize > 0)],
  	["peakList",     peakList,   ps => (ps.peakListSize > 0)],
  	["descriptorList",descriptor,ps => ps.descriptorListSize],
  	["unk",           float32,   ps => ps.unkStreamSize],
  	["triplets",      float32,   ps => ps.tripletStreamSize]];
  }
  var profile = function() { return [
  	["firstValue",    float64,   1],
  	["step",          float64,   1],
  	["peakCount",      uint32,   1],
  	["nBins",          uint32,   1],
  	["chunks",   profileChunk,   ps => ps.peakCount]];
  }
  var profileChunk = function() { return [
  	["firstBin",       uint32,   1],
  	["nBins",          uint32,   1],
  	["fudge",         float32,   function() {return (this.internal.construction.partialStruct[2].layout > 0)}],
  	["signal",        float32,   ps => ps.nBins]];
  }
  var peakList = function () { return [
   ["count",          uint32,   1],
   ["peaks",  centroidedPeak,   ps => ps.count]];
  }
  var centroidedPeak = function () { return [
  	["mz",            float32,   1],
  	["abundance",     float32,   1]];
  }
  var descriptor = function() { return [
  	["index",          uint16,   1],
  	["flags",           uint8,   1],
  	["charge",          uint8,   1]];
  }
  return _scanDataPacket;
 }();

 //pseudo-struct fetch

 //use: fetchStruct.call(ThermoRawFile,callback,pos,structfn)

 var fetchStruct = function(callback,pos,structfn) {
  if (!structfn) throw new Error("ThermoRawFileUnknownStruct");
  mslib.common.start(this);
  if (pos != null) this.reader.position = pos;
  this.internal.construction = {};
  this.internal.construction.callback = callback;
  this.internal.construction.queue = [structfn.call(this)];
  this.internal.construction.partialStruct = [{}];
  this.internal.construction.currentStructDef = [];
  processconstruction.call(this);
 }

 var processconstruction = function() {
  if (this.internal.construction) {
   if (this.internal.construction.queue.length) {
    if (this.internal.construction.queue[0].length) {
     var currentStruct = this.internal.construction.queue[0].shift();
     var substruct = currentStruct[1].call(this);
     var repeat = (typeof(currentStruct[2]) === "function" ? currentStruct[2].call(this,this.internal.construction.partialStruct[0]) : currentStruct[2]);
     if (repeat == 0) processconstruction.call(this);
     else {
      this.internal.construction.currentStructDef.unshift(currentStruct);
      if (substruct.cType) {
       if ((repeat * substruct.byteLength) > (this.reader.File.size-this.reader.position)) {
        console.log("Error fetching "+this.internal.construction.currentStructDef[0][0]+" in "+this.internal.construction.currentStructDef[1][0]+": "+repeat+" * "+substruct.byteLength+" bytes is more than remaining file length of "+(this.reader.File.size-this.reader.position)+" at position "+this.reader.position);
        console.log(this.internal.construction.partialStruct);
       }
       else {
        if (this.report && verbose) console.log(this.internal.construction.currentStructDef.map((e) => e[0]).reverse().join(":") + " - " + substruct.byteLength * repeat + " bytes at offset " + this.reader.position);
        this.reader.readBinary(
         parseStructBinary,
         this.reader.position,
         substruct.byteLength * repeat
        );
       }
      }
      else { //Down a recursion level
       if (repeat > 1) { // expand repeated structs into multiple singlets
        currentStruct[2] = 1;
        for (var i = 0; i < (repeat-1); i++) { //one less than repeat as instigate first read of struct below anyway
         this.internal.construction.queue[0].unshift(currentStruct)
        }
       }
       this.internal.construction.queue.unshift(substruct);
       this.internal.construction.partialStruct.unshift({});
       processconstruction.call(this);
      }    
     }
    }
    else { //Up a recursion level
     var finishedStructDef = this.internal.construction.currentStructDef.shift();
     var finishedStruct = this.internal.construction.partialStruct.shift();
     if (finishedStructDef) {
      if (this.internal.construction.partialStruct[0][finishedStructDef[0]]) {
       if (Array.isArray(this.internal.construction.partialStruct[0][finishedStructDef[0]])) {
        this.internal.construction.partialStruct[0][finishedStructDef[0]].push(finishedStruct)
       }
       else {
        this.internal.construction.partialStruct[0][finishedStructDef[0]] = [this.internal.construction.partialStruct[0][finishedStructDef[0]],finishedStruct]
       }
      }
      else {
       this.internal.construction.partialStruct[0][finishedStructDef[0]] = finishedStruct;
      }
      this.internal.construction.queue.shift()  //Remove empty recursion level
      processconstruction.call(this);
     }
     else { //Done!
      var callback = this.internal.construction.callback;
      delete(this.internal.construction);
      callback(finishedStruct);
     }
    }
   }
  }
 }

 var parseStructBinary = function() { //Use DataView to force little endian reads
  var dV = new DataView(this.result);
  var structDef = this.parent.internal.construction.currentStructDef.shift();
  var cType = structDef[1]();
  var repeat = (typeof(structDef[2]) === "function" ? structDef[2].call(this.parent,this.parent.internal.construction.partialStruct[0]) : structDef[2]);
  var values = [];
  if (structDef[3]) {
   for (var i=0; i<repeat; i++) {
    values.push(Math.min(cType.read.call(dV,i*cType.byteLength,true),structDef[3]));
   }
  }
  else {
   for (var i=0; i<repeat; i++) {
    values.push(cType.read.call(dV,i*cType.byteLength,true));
   }
  }
  var finalVal = (structDef[0].charAt(0) == "$" ?  decodeUTF16(values) : (repeat == 1 ? values[0] : values));
  if (this.parent.internal.construction.partialStruct[0][structDef[0]]) {
   if (Array.isArray(this.parent.internal.construction.partialStruct[0][structDef[0]])) {
    this.parent.internal.construction.partialStruct[0][structDef[0]] = this.parent.internal.construction.partialStruct[0][structDef[0]].concat(finalVal);
   }
   else {
    this.parent.internal.construction.partialStruct[0][structDef[0]] = [this.parent.internal.construction.partialStruct[0][structDef[0]]].concat(finalVal);
   }
  }
  else {
   this.parent.internal.construction.partialStruct[0][structDef[0]] = finalVal;
  }
  processconstruction.call(this.parent);
 }

 var decodeUTF16 = function(arr) {
  var endIndex = arr.indexOf(0);
  if (endIndex < 0) {
   return String.fromCharCode.apply(null,arr);
  } 
  else {
   return String.fromCharCode.apply(null,arr.slice(0,endIndex));
  }
 }

 _ThermoRawFile._SOURCE = _SOURCE;

 return _ThermoRawFile;

}();