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

 const CID = 1;
 const HCD = 2;
 const ETD = 3;
 const PQD = 4;
 const ZLIB = 1;
 const NO_COMPRESSION = false;
 const MZ_INT = true;
 const INT_MZ = false;
 const MZ = true;
 const INT = false;
 
 var _MzFile = function(f) {
  MSLIB.Format.MsDataFile.call(this, f);
  if (f.name.match(/\.mzML$/i)) {
   this.fileType = "mzML";
  }
  else if (f.name.match(/\.mzXML$/i)) {
   this.fileType = "mzXML";
  }
  else {
   throw new Error("MzFileInvalidFileType");
  }
  this.internal.offsets.index = 0;
 };
 _MzFile.prototype = Object.create(MSLIB.Format.MsDataFile.prototype);

 //------------------------------------------------------------------------------
 //MzFile ASync methods
 //------------------------------------------------------------------------------

 _MzFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
  if (!this.ready) throw new Error("MzFileNotReady");
  MSLIB.Common.start(this);
  this.scans = [];
  if (prefetchScanHeaders) this.internal.prefetchScanHeaders = true;
  return this.reader.readText(
   parseScanOffsetStart,
   this.reader.file.size-INDEXOFFSET_SLICE_SIZE
  );
 };

 _MzFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  if (!this.internal.fetchAll) {
   if (!this.ready) throw new Error("MzFileNotReady");
   if (!this.scans.length) throw new Error("MzFileNoScanOffsets");
   if (!this.scans[scan]) throw new Error("MzFileScanUnknown");
   MSLIB.Common.start(this);
  }
  if (prefetchSpectrumData) this.internal.prefetchSpectrum = true;
  if (this.scans[scan] && this.scans[scan].scanData) {
   this.currentScan = new MSLIB.Data.Scan(this.scans[scan].scanData);
   if (prefetchSpectrumData) this.fetchSpectrumData();
   else MSLIB.Common.finish(this);
  }
  else {
   this.currentScan = new MSLIB.Data.Scan();
   this.currentScan.internal.compressionType      = [];
   this.currentScan.internal.binaryDataPrecision  = [];
   if (this.fileType == "mzML") this.currentScan.internal.binaryDataLength = [];
   this.currentScan.internal.binaryDataOffset     = [];
   this.currentScan.internal.binaryDataOrder      = [];
   this.internal.textBuffer = "";
   this.reader.readText(
    parseScanHeader,
    this.scans[scan].offset,
    HEADER_SLICE_SIZE
   );
  }
 };

 _MzFile.prototype.fetchAllScanHeaders = function() {
  if (this.internal.prefetchScanHeaders) delete this.internal.prefetchScanHeaders;
  else if (!this.ready) throw new Error("MzFileNotReady");
  if (!this.scans.length) this.fetchScanOffsets(true);
  else {
   MSLIB.Common.start(this);
   this.internal.fetchAll = true;
   this.fetchScanHeader(this.getFirstScanNumber());
  }
 };
 
 _MzFile.prototype.fetchSpectrumData = function() {
  if (this.internal.prefetchSpectrum) delete this.internal.prefetchSpectrum;
  else {
   if (!this.ready) throw new Error("MzFileNotReady");
   MSLIB.Common.start(this);
  }
  if (!this.scans.length) throw new Error("MzFileNoScanOffsets");
  if (!this.currentScan) throw new Error("MzFileScanNotLoaded");
  this.currentScan.spectrum = null;
  this.internal.textBuffer = "";
  this.reader.readText(
   parseSpectrumData[this.fileType],
   this.currentScan.internal.binaryDataOffset[0],
   (this.fileType == "mzML") && this.currentScan.internal.binaryDataLength[0]
   ? this.currentScan.internal.binaryDataLength[0] + 10
   : this.scans[this.currentScan.scanNumber].length - (this.currentScan.internal.binaryDataOffset[0]-this.scans[this.currentScan.scanNumber].offset)
  );
 };

 //Post-read callback functions

 var parseScanOffsetStart = function() {
  var regexmatch = regex[this.parent.fileType].index.exec(this.result);
  this.parent.internal.previousScanNumber = null;
  if (regexmatch) {
   this.parent.internal.offsets.index = +regexmatch[1];
   this.parent.reader.readText(
    parseScanOffsetList,
    this.parent.internal.offsets.index
   );
  }
  else {
   if (this.parent.fileType == "mzXML") {
    console.log("Warning: Index offset is undefined - will parse scan offsets line-by-line");
    this.parent.internal.textBuffer = "";
    this.parent.reader.readText(
     parseUnindexedScanOffsets,
     0,
     UNINDEXED_OFFSET_SLICE_SIZE
    );
   }
   else throw new Error("MzFileCannotParseIndexOffset");
  }
 };

 var parseUnindexedScanOffsets = function() {
  var text = this.parent.internal.textBuffer + this.result;
  var text_offset = this.position - text.length;
  var RE = /<scan num="(\d+)"/g;
  var regexmatch,endScanNumIndex;
  while ((regexmatch = RE.exec(text)) !== null) {
   this.parent.scans[+regexmatch[1]] = {};
   this.parent.scans[+regexmatch[1]].offset = (text_offset + RE.lastIndex - regexmatch[0].length);
   endScanNumIndex = RE.lastIndex;
   linkPrevious.call(this,+regexmatch[1]);
  }
  text = text.substr(endScanNumIndex);
  if (text.match(/<\/mzXML>/)) {
   //ensure last scan also has a length property
   this.parent.scans[this.parent.scans.length-1].length = this.parent.reader.file.size - this.parent.scans[this.parent.scans.length-1].offset; 
   if (this.parent.internal.prefetchScanHeaders) this.parent.fetchAllScanHeaders();
   else MSLIB.Common.finish(this.parent);
  }
  else {
   this.parent.internal.textBuffer = text;
   this.parent.reader.readText(
    parseUnindexedScanOffsets,
    this.position,
    UNINDEXED_OFFSET_SLICE_SIZE
   );
  }
 };

 var parseScanOffsetList = function() {
  var endOffsetIndex = this.result.lastIndexOf("</offset>") + 9;
  if (endOffsetIndex != 8) {
   var offsets = this.result.substr(0,endOffsetIndex).split("</offset>");
   for (var i = 0; i < offsets.length-1; i++) {
    var regexmatch = regex[this.parent.fileType].scanOffset.exec(offsets[i]);
    if (regexmatch) {
     this.parent.scans[+regexmatch[1]] = {};
     this.parent.scans[+regexmatch[1]].offset = +regexmatch[2];
     linkPrevious.call(this,+regexmatch[1]);
    }
   }
   //ensure last scan also has a length property
   this.parent.scans[this.parent.scans.length-1].length = this.parent.internal.offsets.index - this.parent.scans[this.parent.scans.length-1].offset;                  
  }
  else {
   throw new Error("MzFileCannotParseIndexOffsetEntries");
  }
  if (this.parent.internal.prefetchScanHeaders) this.parent.fetchAllScanHeaders();
  else MSLIB.Common.finish(this.parent);
 }

 var linkPrevious = function(s) {
  if (this.parent.internal.previousScanNumber) {
   if (this.parent.scans[s].offset < this.parent.scans[this.parent.internal.previousScanNumber].offset) {
    throw new Error("MzFileInvalidUnindexedOffset");
   }
   this.parent.scans[this.parent.internal.previousScanNumber].length = this.parent.scans[s].offset - this.parent.scans[this.parent.internal.previousScanNumber].offset;
   this.parent.scans[this.parent.internal.previousScanNumber].next = s;
   this.parent.scans[s].previous = this.parent.internal.previousScanNumber;
  }
  this.parent.internal.previousScanNumber = s;
 }

 var parseScanHeader = function() {
  var text = this.parent.internal.textBuffer + this.result;
  var end_ele_index = text.lastIndexOf(">") + 1;
  var eles = text.substr(0,end_ele_index).split(">").slice(0,-1);
  for (var i = 0; i < eles.length; i++) {
   if (this.parent.fileType == "mzML" && /<binary$/.exec(eles[i])) {
    if (this.parent.currentScan.internal.binaryDataListCount != 2) {
     throw new Error("MzFileInvalidNumberOfBinaryDataArrays");
    }
    //current binary element offset is start position of the text + length of this and all previous eles + i + 1(correct for missing >)
    this.parent.currentScan.internal.binaryDataOffset.push(this.position - text.length + eles.slice(0,i+1).join("").length + i + 1)   
    if (!this.parent.currentScan.internal.binaryDataOffset[1]) {
     if (this.parent.currentScan.internal.binaryDataLength[0]) {
      this.position = +this.parent.currentScan.internal.binaryDataOffset[0]+this.parent.currentScan.internal.binaryDataLength[0] + 9;
     }
     else { //finding second binary element when no BinaryDataLength - large read from BinaryDataOffset of the first binary element
      this.position = +this.parent.currentScan.internal.binaryDataOffset[0];
     }
    }
    break;
   }
   regex[this.parent.fileType].scanKeys.forEach(function(key) {
    var regexmatch = regex[this.parent.fileType].scan[key].exec(eles[i]);
    if (regexmatch) {
     var scope = this.parent.currentScan;
     var value = (isNaN(regexmatch[1]) ? regexmatch[1] : (+regexmatch[1]));
     if (typeof(scope[key]) == "undefined") {
      scope = this.parent.currentScan.internal;
     }
     if (Array.isArray(scope[key])) {
      scope[key].push(value);
     }
     else {
      scope[key] = value;
     }
    }
   },this);
   if (this.parent.fileType == "mzXML" && /<peaks\s/.exec(eles[i])) {
    this.parent.currentScan.internal.binaryDataOffset.push(this.position - text.length + eles.slice(0,i+1).join("").length + i + 1);
    break;
   }
  }
  if (this.parent.currentScan.internal.binaryDataOffset[(this.parent.fileType == "mzML" ? 1 : 0)]) { //End of header
   //Standardise values
   if (this.parent.fileType == "mzXML" || this.parent.currentScan.internal.rtUnits=="second") {
    this.parent.currentScan.retentionTime /= 60;
   }
   this.parent.currentScan.centroided = this.parent.currentScan.centroided ? true : false; //standardise null, 0 etc
   this.parent.currentScan.activationMethods = this.parent.currentScan.activationMethods.map(function(value) {
    switch(value) {
     case 1000133 : 
     case "CID"   : return CID;
     case 1000422 : 
     case "HCD"   : return HCD;
     case 1000598 : 
     case "ETD"   : return ETD;
     case 1000599 : 
     case "PQD"   : return PQD;
     default : return value;
    }
   });
   this.parent.currentScan.internal.compressionType = this.parent.currentScan.internal.compressionType.map(function(value) {
    switch(value) {
     case "zlib" : return ZLIB;
     default : return NO_COMPRESSION;
    }
   });
   this.parent.currentScan.internal.binaryDataOrder = this.parent.currentScan.internal.binaryDataOrder.map(function(value) {
    switch(value) {
     case "-int" : return MZ_INT;
     case "int-" : return INT_MZ;
     case 1000514 : return MZ;
     case 1000515 : return INT;
     default : return value;
    }
   });
   if (this.parent.currentScan.internal.binaryDataEndianness) {
    if (this.parent.currentScan.internal.binaryDataEndianness == "network") {
     delete(this.parent.currentScan.internal.binaryDataEndianness);
    }
    else throw new Error("MzFileUnrecognisedByteOrder");
   }
   if (this.parent.internal.prefetchSpectrum) {
    this.parent.fetchSpectrumData();
   }
   else {
    if (this.parent.internal.fetchAll) {
     this.parent.scans[this.parent.currentScan.scanNumber].scanData = this.parent.currentScan.toArray();
     if (this.parent.getNextScanNumber(this.parent.currentScan.scanNumber)) {
      MSLIB.Common.progress(this.parent,(this.parent.currentScan.scanNumber/this.parent.getLastScanNumber())*100);
      this.parent.fetchScanHeader(this.parent.getNextScanNumber(this.parent.currentScan.scanNumber))
     }
     else {
      delete this.parent.internal.fetchAll;
      MSLIB.Common.finish(this.parent);
     }
    }
    else {
     MSLIB.Common.finish(this.parent);
    }
   }
  }
  else {
   this.parent.internal.textBuffer = this.parent.currentScan.internal.binaryDataOffset[0] ? "" : text.substr(end_ele_index)
   this.parent.reader.readText(
    parseScanHeader,
    this.position,
    this.parent.currentScan.internal.binaryDataOffset[0] ? MZML_SPECTRUM_SLICE_SIZE : HEADER_SLICE_SIZE
   );
  }
 };

 var parseSpectrumData = {
  mzML : function() {
   var text = this.parent.internal.textBuffer.replace(/\n|\r/gm,"") + this.result;
   var binaryIndex = text.indexOf("</binary>");
   if (binaryIndex >= 0) {
    text = text.substr(0,binaryIndex);
    if (!this.parent.internal.firstBinaryArray) {
     this.parent.internal.firstBinaryArray = text;
     this.parent.reader.readText(
      parseSpectrumData.mzML,
      this.parent.currentScan.internal.binaryDataOffset[1],
      this.parent.currentScan.internal.binaryDataLength[1] ? this.parent.currentScan.internal.binaryDataLength[1] + 10 : MZML_SPECTRUM_SLICE_SIZE
     );
    }
    else {
     var first = decodeByteArray(this.parent.internal.firstBinaryArray,this.parent.currentScan.internal.compressionType[0],this.parent.currentScan.internal.binaryDataPrecision[0],true);
     var second = decodeByteArray(text,this.parent.currentScan.internal.compressionType[1],this.parent.currentScan.internal.binaryDataPrecision[1],true);
     var a = [];
     var b = [];
     if (this.parent.currentScan.internal.binaryDataOrder[0] && !this.parent.currentScan.internal.binaryDataOrder[1]) {
      a = first;
      b = second;
     }
     else if (!this.parent.currentScan.internal.binaryDataOrder[0] && this.parent.currentScan.internal.binaryDataOrder[1]) {
      b = first;
      a = second;
     }
     else {
      console.log("MzFileError");
      console.log(this.parent.currentScan.internal.binaryDataOrder);
      throw new Error("MzFileUnrecognisedBinaryDataOrder");
     }
     this.parent.currentScan.spectrum = new MSLIB.Data.Spectrum(a.filter((mz,i) => b[i]),b.filter(inten => inten));
     delete this.parent.internal.firstBinaryArray;
     MSLIB.Common.finish(this.parent);
    }
   }
   else {
    this.parent.internal.textBuffer = text;
    this.parent.reader.readText(
     parseSpectrumData.mzML,
     this.position,
     MZML_SPECTRUM_SLICE_SIZE
    )
   }
  },
  mzXML : function() {
   var text = this.parent.internal.textBuffer.replace(/\n|\r/gm,"") + this.result;
   var end_peaks_index = text.indexOf("</peaks>")
   if (end_peaks_index >= 0) {
    text = text.substr(0,end_peaks_index);
    var values = decodeByteArray(text,this.parent.currentScan.internal.compressionType[0],this.parent.currentScan.internal.binaryDataPrecision[0],false)
    var a = [];
    var b = [];
    if (this.parent.currentScan.internal.binaryDataOrder[0] == INT_MZ) {
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
    this.parent.currentScan.spectrum = new MSLIB.Data.Spectrum(a.filter((mz,i) => b[i]),b.filter(inten => inten));
    MSLIB.Common.finish(this.parent);
   }
   else {
    this.parent.internal.textBuffer = text;
    this.parent.reader.readText(
     parseSpectrumData.mzXML,
     this.position,
     MZXML_SPECTRUM_SLICE_SIZE
    );
   }
  }
 };

 //------------------------------------------------------------------------------
 //Format-specific regexes for data extraction
 //------------------------------------------------------------------------------

 //The pattern [^] is a multiline single character wildcard (since . will not match \n)

 var regex = {};
 regex.mzML = {
  index : /<indexListOffset>(\d+)<\/indexListOffset>/,
  scanOffset : /<offset\sidRef=".*?scan=(\d+)".*?>(\d+)$/,
  scan : {
   scanNumber : /<spectrum\s(?:[^]+\s)?id=".*?scan=(\d+)"/,
   msLevel : /<cvParam\s(?:[^]+\s)?accession="MS:1000511" name="ms level" value="(\d+)"/,
   centroided : /<cvParam\s(?:[^]+\s)?accession="MS:(1)000127" name="centroid spectrum"/,
   retentionTime : /<cvParam\s(?:[^]+\s)?accession="MS:1000016" name="scan start time" value="(.+?)"/,
   rtUnits : /<cvParam\s(?:[^]+\s)?accession="MS:1000016" name="scan start time"\s(?:[^]+\s)?unitName="(.+?)"/,
   lowMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000501" name="scan window lower limit" value="(.+?)"/,
   highMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000500" name="scan window upper limit" value="(.+?)"/,
   basePeakMz : /<cvParam\s(?:[^]+\s)?accession="MS:1000504" name="base peak m\/z" value="(.+?)"/,
   basePeakIntensity : /<cvParam\s(?:[^]+\s)?accession="MS:1000505" name="base peak intensity" value="(.+?)"/,
   totalCurrent : /<cvParam\s(?:[^]+\s)?accession="MS:1000285" name="total ion current" value="(.+?)"/,
   precursorMzs : /<cvParam\s(?:[^]+\s)?accession="MS:1000744" name="selected ion m\/z" value="(.+?)"/,
   precursorCharges : /<cvParam\s(?:[^]+\s)?accession="MS:1000041" name="charge state" value="(.+?)"/,
   precursorIntensities : /<cvParam\s(?:[^]+\s)?accession="MS:1000042" name="peak intensity" value="(.+?)"/,
   activationMethods : /<cvParam\s(?:[^]+\s)?accession="MS:(1000133|1000422|1000598|1000599)"/,
   binaryDataListCount : /<binaryDataArrayList\s(?:[^]+\s)?count="(\d+)"/,
   binaryDataLength : /<binaryDataArray\s(?:[^]+\s)?encodedLength="(\d+)"/,
   compressionType : /<cvParam\s(?:[^]+\s)?accession="MS:1000574" name="(zlib) compression"/,
   binaryDataPrecision : /<cvParam\s(?:[^]+\s)?accession="(?:MS:1000521|MS:1000523)" name="(32|64)-bit float"/,
   binaryDataOrder : /<cvParam\s(?:[^]+\s)?accession="MS:(1000514|1000515)"/
  }
 }
 regex.mzML.scanKeys = Object.keys(regex.mzML.scan);

 regex.mzXML = {
  index : /<indexOffset>(\d+)<\/indexOffset>/,
  scanOffset : /<offset\sid="(\d+)".*?>(\d+)$/,
  scan : {
   scanNumber : /<scan\s(?:[^]+\s)?num="(\d+?)"/,
   msLevel : /<scan\s(?:[^]+\s)?msLevel="(\d+?)"/,
   centroided : /<scan\s(?:[^]+\s)?centroided="([01])"/,
   retentionTime : /<scan\s(?:[^]+\s)?retentionTime="PT(\d+\.?\d+)S"/,
   lowMz : /<scan\s(?:[^]+\s)?startMz="(.+?)"/,
   highMz : /<scan\s(?:[^]+\s)?endMz="(.+?)"/,
   basePeakMz : /<scan\s(?:[^]+\s)?basePeakMz="(.+?)"/,
   basePeakIntensity : /<scan\s(?:[^]+\s)?basePeakIntensity="(.+?)"/,
   totalCurrent : /<scan\s(?:[^]+\s)?totIonCurrent="(.+?)"/,
   precursorMzs : /^(.+?)<\/precursorMz/,
   precursorCharges : /<precursorMz\s(?:[^]+\s)?precursorCharge="(.+?)"/,
   precursorIntensities : /<precursorMz\s(?:[^]+\s)?precursorIntensity="(.+?)"/,
   activationMethods : /<precursorMz\s(?:[^]+\s)?activationMethod="(.+?)"/,
   compressionType : /<peaks\s(?:[^]+\s)?compressionType="(.+?)"/,
   binaryDataPrecision : /<peaks\s(?:[^]+\s)?precision="(32|64)"/,  
   binaryDataOrder : /<peaks\s(?:[^]+\s)?(?:contentType|pairOrder)=".*(-int|int-).*"/,
   binaryDataEndianness : /<peaks\s(?:[^]+\s)?byteOrder="(.+?)"/
  }
 }
 regex.mzXML.scanKeys = Object.keys(regex.mzXML.scan);
 
 //------------------------------------------------------------------------------
 //Data array decoding
 //------------------------------------------------------------------------------
 
 var decodeByteArray = function(t,c,p,e) {
  if (!t.length) {
   return [];
  }
  var s = self.atob(t); //decode base64
  var bytes;
  if (c && (c == ZLIB)) {
   try {
    bytes = zlib.inflate(s); //inflate zlib
   }
   catch (err) {
    console.log("Error: zpipe threw error (" + err + ") for compressed text:" + t);
    throw new Error("MzFileZLibDecompressionFailure");
    return [];
   }
  }
  else if (c) {
   throw new Error("MzFileUnknownCompressionType");
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
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (var i = 0; i < dV.byteLength; i = i+4) { 
    values.push(dV.getFloat32(i,e)); 
   }
  }
  else if (p == 64) {
   if (bytes.length % 8) {
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (var i = 0; i < dV.byteLength-1; i = i+8) { 
    values.push(dV.getFloat64(i,e)); 
   }
  }
  else {
   throw new Error("MzFileInvalidPrecision");
  }
  return values;
 }

 _MzFile._SOURCE = _SOURCE;

 return _MzFile;

}();

else throw new Error("MzFileNoZLib");