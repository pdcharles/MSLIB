"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
if (typeof zlib != 'undefined') MSLIB.Format.MzFile = function _SOURCE() {

 //try to optimise buffer size in bytes for various tasks
 //for indexoffset and header, want to grab entire header in one read most of the time, but not too much of the spectrum
 //however if offsets are not indexed, need to slurp huge chucks of the file and locate scan tags by regex
 //for spectrum (if can't calculate length), want to grab a large chunk but not too large or inefficient for the very numerous low-data spectra

 const INDEXOFFSET_SLICE_SIZE = 1000;
 const UNINDEXED_OFFSET_SLICE_SIZE = 5000000;
 const HEADER_SLICE_SIZE = 3000;
 const MZML_SPECTRUM_SLICE_SIZE = 12000;
 const MZXML_SPECTRUM_SLICE_SIZE = 24000;
 
 var MzFile = function(f) {
  MSLIB.Format.MsDataFile.call(this, f);
  if (f.name.match(/\.mzML$/i)) {
   this.FileType = "mzML";
  }
  else if (f.name.match(/\.mzXML$/i)) {
   this.FileType = "mzXML";
  }
  else {
   throw new Error("MzFileInvalidFileType");
  }
  this.Internal.Offsets.Index = 0;
 };
 MzFile.prototype = Object.create(MSLIB.Format.MsDataFile.prototype);

 //------------------------------------------------------------------------------
 //MzFile ASync methods
 //------------------------------------------------------------------------------

 MzFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
  if (!this.Ready) throw new Error("MzFileNotReady");
  MSLIB.Common.starting.call(this);
  this.Scans = [];
  if (prefetchScanHeaders) this.Internal.PrefetchScanHeaders = true;
  return this.Reader.readText(
   parseScanOffsetStart,
   this.Reader.File.size-INDEXOFFSET_SLICE_SIZE
  );
 };

 MzFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  if (!this.Internal.FetchAll) {
   if (!this.Ready) throw new Error("MzFileNotReady");
   if (!this.Scans.length) throw new Error("MzFileNoScanOffsets");
   if (!this.Scans[scan]) throw new Error("MzFileScanUnknown");
   MSLIB.Common.starting.call(this);
  }
  if (prefetchSpectrumData) this.Internal.PrefetchSpectrum = true;
  if (this.Scans[scan] && this.Scans[scan].Scan) {
   this.CurrentScan = this.Scans[scan].Scan;
   if (prefetchSpectrumData) {
    this.fetchSpectrumData();
   }
   else {
    MSLIB.Common.finished.call(this);
   }
  }
  else {
   this.CurrentScan = new MSLIB.Data.Scan();
   this.CurrentScan.Internal.CompressionType      = [];
   this.CurrentScan.Internal.BinaryDataPrecision  = [];
   this.CurrentScan.Internal.BinaryDataLength     = [];
   this.CurrentScan.Internal.BinaryDataOffset     = [];
   this.CurrentScan.Internal.BinaryDataID         = [];
   this.Internal.TextBuffer = "";
   this.Reader.readText(
    parseScanHeader,
    this.Scans[scan].Offset,
    HEADER_SLICE_SIZE
   );
  }
 };

 MzFile.prototype.fetchAllScanHeaders = function() {
  if (this.Internal.PrefetchScanHeaders) delete this.Internal.PrefetchScanHeaders;
  else if (!this.Ready) throw new Error("MzFileNotReady");
  if (!this.Scans.length) this.fetchScanOffsets(true);
  else {
   MSLIB.Common.starting.call(this);
   this.Internal.FetchAll = true;
   this.fetchScanHeader(this.getFirstScanNumber());
  }
 };
 
 MzFile.prototype.fetchSpectrumData = function() {
  if (this.Internal.PrefetchSpectrum) delete this.Internal.PrefetchSpectrum;
  else {
   if (!this.Ready) throw new Error("MzFileNotReady");
   MSLIB.Common.starting.call(this);
  }
  if (!this.Scans.length) throw new Error("MzFileNoScanOffsets");
  if (!this.CurrentScan) throw new Error("MzFileScanNotLoaded");
  this.CurrentScan.Spectrum = null;
  this.Internal.TextBuffer = "";
  this.Reader.readText(
   parseSpectrumData[this.FileType],
   this.CurrentScan.Internal.BinaryDataOffset[0],
   this.CurrentScan.Internal.BinaryDataLength[0]
   ? this.CurrentScan.Internal.BinaryDataLength[0] + (this.FileType == "mzML" ? 10 : 9)
   : this.Scans[this.CurrentScan.ScanNumber].Length - (this.CurrentScan.Internal.BinaryDataOffset[0]-this.Scans[this.CurrentScan.ScanNumber].Offset)
  );
 };

 //Post-read callback functions

 var parseScanOffsetStart = function() {
  var regexmatch = regex[this.Parent.FileType].Index.exec(this.result);
  this.Parent.Internal.PreviousScanNumber = null;
  if (regexmatch) {
   this.Parent.Internal.Offsets.Index = +regexmatch[1];
   this.Parent.Reader.readText(
    parseScanOffsetList,
    this.Parent.Internal.Offsets.Index
   );
  }
  else {
   if (this.Parent.FileType == "mzXML") {
    console.log("Warning: Index offset is undefined - will parse scan offsets line-by-line");
    this.Parent.Internal.TextBuffer = "";
    this.Parent.Reader.readText(
     parseUnindexedScanOffsets,
     0,
     UNINDEXED_OFFSET_SLICE_SIZE
    );
   }
   else throw new Error("MzFileCannotParseIndexOffset");
  }
 };

 var parseUnindexedScanOffsets = function() {
  var text = this.Parent.Internal.TextBuffer + this.result;
  var text_offset = this.Position - text.length;
  var RE = /<scan num="(\d+)"/g;
  var regexmatch,end_scannum_index;
  while ((regexmatch = RE.exec(text)) !== null) {
   this.Parent.Scans[+regexmatch[1]] = {};
   this.Parent.Scans[+regexmatch[1]].Offset = (text_offset + RE.lastIndex - regexmatch[0].length);
   end_scannum_index = RE.lastIndex;
   if ((+regexmatch[1] == 33416) || (+regexmatch[1] == 33417)) {
    console.log(this.Position);
    console.log(this.Parent.Internal.TextBuffer.length);
    console.log(text_offset);   
   }
   linkPrevious.call(this,+regexmatch[1]);
  }
  text = text.substr(end_scannum_index);
  if (text.match(/<\/mzXML>/)) {
   if (this.Parent.Internal.PrefetchScanHeaders) {
    this.Parent.fetchAllScanHeaders();
   }
   else {
    MSLIB.Common.finished.call(this.Parent);
   }
  }
  else {
   this.Parent.Internal.TextBuffer = text;
   this.Parent.Reader.readText(
    parseUnindexedScanOffsets,
    this.Position,
    UNINDEXED_OFFSET_SLICE_SIZE
   );
  }
 };

 var parseScanOffsetList = function() {
  var end_offset_index = this.result.lastIndexOf("</offset>") + 9;
  if (end_offset_index != 8) {
   var offsets = this.result.substr(0,end_offset_index).split("</offset>");
   for (var i = 0; i < offsets.length-1; i++) {
    var regexmatch = regex[this.Parent.FileType].ScanOffset.exec(offsets[i]);
    if (regexmatch) {
     this.Parent.Scans[+regexmatch[1]] = {};
     this.Parent.Scans[+regexmatch[1]].Offset = +regexmatch[2];
     linkPrevious.call(this,+regexmatch[1]);
    }
   }
   //ensure last scan also has a length property
   this.Parent.Scans[this.Parent.Scans.length-1].Length = (this.Parent.Internal.Offsets.Index || this.Reader.File.size) - this.Parent.Scans[this.Parent.Scans.length-1].Offset;                  
  }
  else {
   throw new Error("MzFileCannotParseIndexOffsetEntries");
  }
  if (this.Parent.Internal.PrefetchScanHeaders) {
   this.Parent.fetchAllScanHeaders();
  }
  else {
   MSLIB.Common.finished.call(this.Parent);
  }
 }

 var linkPrevious = function(s) {
  if (this.Parent.Internal.PreviousScanNumber) {
   if (this.Parent.Scans[s].Offset < this.Parent.Scans[this.Parent.Internal.PreviousScanNumber].Offset) {
    throw new Error("MzFileInvalidUnindexedOffset");
   }
   this.Parent.Scans[this.Parent.Internal.PreviousScanNumber].Length = this.Parent.Scans[s].Offset - this.Parent.Scans[this.Parent.Internal.PreviousScanNumber].Offset;
   this.Parent.Scans[this.Parent.Internal.PreviousScanNumber].Next = s;
   this.Parent.Scans[s].Previous = this.Parent.Internal.PreviousScanNumber;
  }
  this.Parent.Internal.PreviousScanNumber = s;
 }

 var parseScanHeader = function() {
  var text = this.Parent.Internal.TextBuffer + this.result;
  var end_ele_index = text.lastIndexOf(">") + 1;
  var eles = text.substr(0,end_ele_index).split(">").slice(0,-1);
  for (var i = 0; i < eles.length; i++) {
   if (this.Parent.FileType == "mzML" && /<binary$/.exec(eles[i])) {
    if (this.Parent.CurrentScan.Internal.BinaryDataListCount != 2) {
     throw new Error("MzFileInvalidNumberOfBinaryDataArrays");
    }
    //current binary element offset is start position of the text + length of this and all previous eles + i + 1(correct for missing >)
    this.Parent.CurrentScan.Internal.BinaryDataOffset.push(this.Position - text.length + eles.slice(0,i+1).join("").length + i + 1)   
    if (!this.Parent.CurrentScan.Internal.BinaryDataOffset[1]) {
     if (this.Parent.CurrentScan.Internal.BinaryDataLength[0]) {
      this.Position = +this.Parent.CurrentScan.Internal.BinaryDataOffset[0]+this.Parent.CurrentScan.Internal.BinaryDataLength[0] + 9;
     }
     else { //finding second binary element when no BinaryDataLength - large read from BinaryDataOffset of the first binary element
      this.Position = +this.Parent.CurrentScan.Internal.BinaryDataOffset[0];
     }
    }
    break;
   }
   regex[this.Parent.FileType].ScanKeys.forEach(function(key) {
    var regexmatch = regex[this.Parent.FileType].Scan[key].exec(eles[i]);
    if (regexmatch) {
     var scope = this.Parent.CurrentScan;
     var value = (isNaN(regexmatch[1]) ? regexmatch[1] : (+regexmatch[1]));
     if (typeof(scope[key]) == "undefined") {
      scope = this.Parent.CurrentScan.Internal;
     }
     if (Array.isArray(scope[key])) {
      scope[key].push(value);
     }
     else {
      scope[key] = value;
     }
    }
   },this);
   if (this.Parent.FileType == "mzXML" && /<peaks\s/.exec(eles[i])) {
//    this.Parent.CurrentScan.Internal.BinaryDataID.push('mz-int');
    this.Parent.CurrentScan.Internal.BinaryDataOffset.push(this.Position - text.length + eles.slice(0,i+1).join("").length + i + 1);
    break;
   }
  }
  if (this.Parent.CurrentScan.Internal.BinaryDataOffset[(this.Parent.FileType == "mzML" ? 1 : 0)]) {
   //Standardise values
   if (this.Parent.FileType == "mzXML" || this.Parent.CurrentScan.Internal.RTUnits=="second") {
    this.Parent.CurrentScan.RetentionTime /= 60;
   }
   if (this.Parent.FileType == "mzML") {
    this.Parent.CurrentScan.ActivationMethods = this.Parent.CurrentScan.ActivationMethods.map(function(m) {
     switch(m) {
      case 1000133 : return "CID";
      case 1000422 : return "HCD";
      case 1000598 : return "ETD";
      case 1000599 : return "PQD";
      default : return m;
     }
    });
    if (this.Parent.CurrentScan.Centroided == null) this.Parent.CurrentScan.Centroided = 0;
   }
   if (this.Parent.Internal.PrefetchSpectrum) {
    this.Parent.fetchSpectrumData();
   }
   else {
    if (this.Parent.Internal.FetchAll) {
     this.Parent.Scans[this.Parent.CurrentScan.ScanNumber].Scan = this.Parent.CurrentScan;
     if (this.Parent.getNextScanNumber(this.Parent.CurrentScan.ScanNumber)) {
      this.Parent.Progress = (this.Parent.CurrentScan.ScanNumber/this.Parent.getLastScanNumber())*100;
      this.Parent.fetchScanHeader(this.Parent.getNextScanNumber(this.Parent.CurrentScan.ScanNumber))
     }
     else {
      console.log("got here");
      delete this.Parent.Internal.FetchAll;
      MSLIB.Common.finished.call(this.Parent);
     }
    }
    else {
     MSLIB.Common.finished.call(this.Parent);
    }
   }
  }
  else {
   this.Parent.Internal.TextBuffer = this.Parent.CurrentScan.Internal.BinaryDataOffset[0] ? "" : text.substr(end_ele_index)
   this.Parent.Reader.readText(
    parseScanHeader,
    this.Position,
    this.Parent.CurrentScan.Internal.BinaryDataOffset[0] ? MZML_SPECTRUM_SLICE_SIZE : HEADER_SLICE_SIZE
   );
  }
 };

 var parseSpectrumData = {
  mzML : function() {
   var text = this.Parent.Internal.TextBuffer.replace(/\n|\r/gm,"") + this.result;
   var binary_index = text.indexOf("</binary>");
   if (binary_index >= 0) {
    text = text.substr(0,binary_index);
    if (!this.Parent.Internal.firstBinaryArray) {
     this.Parent.Internal.firstBinaryArray = text;
     this.Parent.Reader.readText(
      parseSpectrumData.mzML,
      this.Parent.CurrentScan.Internal.BinaryDataOffset[1],
      this.Parent.CurrentScan.Internal.BinaryDataLength[1] ? this.Parent.CurrentScan.Internal.BinaryDataLength[1] + 10 : MZML_SPECTRUM_SLICE_SIZE
     );
    }
    else {
     var first = decodeByteArray(this.Parent.Internal.firstBinaryArray,this.Parent.CurrentScan.Internal.CompressionType[0],this.Parent.CurrentScan.Internal.BinaryDataPrecision[0],true);
     var second = decodeByteArray(text,this.Parent.CurrentScan.Internal.CompressionType[1],this.Parent.CurrentScan.Internal.BinaryDataPrecision[1],true);
     var a = [];
     var b = [];
     if (this.Parent.CurrentScan.Internal.BinaryDataID[0] == 1000514 && this.Parent.CurrentScan.Internal.BinaryDataID[1] == 1000515) {
      a = first;
      b = second;
     }
     else if (this.Parent.CurrentScan.Internal.BinaryDataID[0] == 1000515 && this.Parent.CurrentScan.Internal.BinaryDataID[1] == 1000514) {
      b = first;
      a = second;
     }
     else {
      throw new Error("MzFileUnrecognisedBinaryDataOrder");
     }
     this.Parent.CurrentScan.Spectrum = new MSLIB.Data.Spectrum(a.filter((mz,i) => b[i]),b.filter((inten,i) => b[i]));
     delete this.Parent.Internal.firstBinaryArray;
     MSLIB.Common.finished.call(this.Parent);
    }
   }
   else {
    this.Parent.Internal.TextBuffer = text;
    this.Parent.Reader.readText(
     parseSpectrumData.mzML,
     this.Position,
     MZML_SPECTRUM_SLICE_SIZE
    )
   }
  },
  mzXML : function() {
   var text = this.Parent.Internal.TextBuffer.replace(/\n|\r/gm,"") + this.result;
   var end_peaks_index = text.indexOf("</peaks>")
   if (end_peaks_index >= 0) {
    text = text.substr(0,end_peaks_index);
    var values = decodeByteArray(text,this.Parent.CurrentScan.Internal.CompressionType[0],this.Parent.CurrentScan.Internal.BinaryDataPrecision[0],(this.Parent.CurrentScan.Internal.BinaryDataEndianness!="network"))
    var a = [];
    var b = [];
    if (this.Parent.CurrentScan.Internal.BinaryDataID[0] == "int-") {
     for (var i = 0; i < values.length; i = i+2) { 
      b.push(values[i]);
      a.push(values[i+1]);
     }
    }
    else {
     for (var i = 0; i < values.length; i = i+2) { 
      a.push(values[i]); 
      b.push(values[i+1]);
     }
    }
    this.Parent.CurrentScan.Spectrum = new MSLIB.Data.Spectrum(a.filter((mz,i) => b[i]),b.filter((inten,i)  => b[i]));
    MSLIB.Common.finished.call(this.Parent);
   }
   else {
    this.Parent.Internal.TextBuffer = text;
    this.Parent.Reader.readText(
     parseSpectrumData.mzXML,
     this.Position,
     MZXML_SPECTRUM_SLICE_SIZE
    );
   }
  }
 };

 //------------------------------------------------------------------------------
 //Format-specific regexes for data extraction
 //------------------------------------------------------------------------------

 var regex = {};
 regex.mzML = {
  Index : /<indexListOffset>(\d+)<\/indexListOffset>/,
  ScanOffset : /<offset\sidRef=".*?scan=(\d+)".*?>(\d+)$/,
  Scan : {
   ScanNumber : /<spectrum\s(?:[^]+\s)?id=".*?scan=(\d+)"/,
   MsLevel : /<cvParam\s(?:[^]+\s)?accession="MS:1000511" name="ms level" value="(\d+)"/,
   Centroided : /<cvParam\s(?:[^]+\s)?accession="MS:(1)000127" name="centroid spectrum"/,
   RetentionTime : /<cvParam\s(?:[^]+\s)?accession="MS:1000016" name="scan start time" value="(.+?)"/,
   RTUnits : /<cvParam\s(?:[^]+\s)?accession="MS:1000016" name="scan start time"\s(?:[^]+\s)?unitName="(.+?)"/,
   LowMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000501" name="scan window lower limit" value="(.+?)"/,
   HighMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000500" name="scan window upper limit" value="(.+?)"/,
   BasePeakMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000504" name="base peak m\/z" value="(.+?)"/,
   BasePeakIntensity : /<cvParam\s(?:[^]+\s)?accession="MS:1000505" name="base peak intensity" value="(.+?)"/,
   TotalCurrent : /<cvParam\s(?:[^]+\s)?accession="MS:1000285" name="total ion current" value="(.+?)"/,
   PrecursorMzs : /<cvParam\s(?:[^]+\s)?accession="MS:1000744" name="selected ion m\/z" value="(.+?)"/,
   PrecursorCharges : /<cvParam\s(?:[^]+\s)?accession="MS:1000041" name="charge state" value="(.+?)"/,
   PrecursorIntensities : /<cvParam\s(?:[^]+\s)?accession="MS:1000042" name="peak intensity" value="(.+?)"/,
   ActivationMethods : /<cvParam\s(?:[^]+\s)?accession="MS:(1000133|1000422|1000598|1000599)"/,
   BinaryDataListCount : /<binaryDataArrayList\s(?:[^]+\s)?count="(\d+)"/,
   BinaryDataLength : /<binaryDataArray\s(?:[^]+\s)?encodedLength="(\d+)"/,
   CompressionType : /<cvParam\s(?:[^]+\s)?accession="MS:1000574" name="(zlib) compression"/,
   BinaryDataPrecision : /<cvParam\s(?:[^]+\s)?accession="(?:MS:1000521|MS:1000523)" name="(32|64)-bit float"/,
   BinaryDataID : /<cvParam\s(?:[^]+\s)?accession="MS:(1000514|1000515)"/
  }
 }
 regex.mzML.ScanKeys = Object.keys(regex.mzML.Scan);

 regex.mzXML = {
  Index : /<indexOffset>(\d+)<\/indexOffset>/,
  ScanOffset : /<offset\sid="(\d+)".*?>(\d+)$/,
  Scan : {
   ScanNumber : /<scan\s(?:[^]+\s)?num="(\d+?)"/,
   MsLevel : /<scan\s(?:[^]+\s)?msLevel="(\d+?)"/,
   Centroided : /<scan\s(?:[^]+\s)?centroided="([01])"/,
   RetentionTime : /<scan\s(?:[^]+\s)?retentionTime="PT(\d+\.?\d+)S"/,
   LowMz : /<scan\s(?:[^]+\s)?startMz="(.+?)"/,
   HighMz : /<scan\s(?:[^]+\s)?endMz="(.+?)"/,
   BasePeakMz : /<scan\s(?:[^]+\s)?basePeakMz="(.+?)"/,
   BasePeakIntensity : /<scan\s(?:[^]+\s)?basePeakIntensity="(.+?)"/,
   TotalCurrent : /<scan\s(?:[^]+\s)?totIonCurrent="(.+?)"/,
   PrecursorMzs : /^(.+?)<\/precursorMz/,
   PrecursorCharges : /<precursorMz\s(?:[^]+\s)?precursorCharge="(.+?)"/,
   PrecursorIntensities : /<precursorMz\s(?:[^]+\s)?precursorIntensity="(.+?)"/,
   ActivationMethods : /<precursorMz\s(?:[^]+\s)?activationMethod="(.+?)"/,
//   BinaryDataLength :  /<peaks\s(?:[^]+\s)?compressedLen="(\d+)"/,  //usually inaccurate (or is mis-documented)
   CompressionType : /<peaks\s(?:[^]+\s)?compressionType="(.+?)"/,
   BinaryDataPrecision : /<peaks\s(?:[^]+\s)?precision="(32|64)"/,  
   BinaryDataID : /<peaks\s(?:[^]+\s)?(?:contentType|pairOrder)=".*(-int|int-).*"/,
   BinaryDataEndianness : /<peaks\s(?:[^]+\s)?byteOrder="(.+?)"/
  }
 }
 regex.mzXML.ScanKeys = Object.keys(regex.mzXML.Scan);
 
 //------------------------------------------------------------------------------
 //Data array decoding
 //------------------------------------------------------------------------------
 
 var decodeByteArray = function(t,c,p,e) {
  if (!t.length) {
   return [];
  }
  var s = self.atob(t); //decode base64
  var bytes;
  if (c && (c == "zlib")) {
   try {
    bytes = zlib.inflate(s); //inflate zlib
   }
   catch (err) {
    console.log("Error: zpipe threw error (" + err + ") for compressed text:" + t);
    throw new Error("MzFileZLibDecompressionFailure");
    return [];
   }
  }
  else {
   bytes = new Uint8Array(s.length);
   for (var i = 0; i < s.length; i++) { 
    bytes[i] = s.charCodeAt(i);
   }
  }
  var dV = new DataView(bytes.buffer);  //Have to use DataView to access in Big-Endian format
  var values = [];
  if (p == 32) {
   if (bytes.length % 4) {
    console.log("Error: Byte array length not a multiple of 4");
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (var i = 0; i < dV.byteLength; i = i+4) { 
    values.push(dV.getFloat32(i,e)); 
   }
  }
  else if (p == 64) {
   if (bytes.length % 8) {
    console.log("Error: Byte array length not a multiple of 8");
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (var i = 0; i < dV.byteLength-1; i = i+8) { 
    values.push(dV.getFloat64(i,e)); 
   }
  }
  else {
   console.log("Error: Unknown precision value");
   throw new Error("MzFileInvalidPrecision");
  }
  return values;
 }

 MzFile._SOURCE = _SOURCE;

 return MzFile;

}();

else throw new Error("MzFileNoZLib");