import { MsDataFile } from './base/MsDataFile.js';

export let MzFile = function _SOURCE() {

 //try to optimise buffer size in bytes for various tasks
 //for indexoffset and header, want to grab entire header in one read most of the time, but not too much of the spectrum
 //however if offsets are not indexed, need to slurp huge chucks of the file and locate scan tags by regex
 //for spectrum (if can't calculate length), want to grab a large chunk but not too large or inefficient for the very numerous low-data spectra

 const INDEXOFFSET_SLICE_SIZE = 1000;
 const UNINDEXED_OFFSET_SLICE_SIZE = 5000000;
 const HEADER_SLICE_SIZE = 3000;
 const SPECTRUM_SLICE_SIZE = { MZML : 12000, MZXML : 24000 };

 const CID = 1;
 const HCD = 2;
 const ETD = 3;
 const PQD = 4;
 const ZLIB = true;
 const NO_COMPRESSION = false;
 const MZ_INT = true;
 const INT_MZ = false;
 const MZ = true;
 const INT = false;
 
 let _MzFile = function(f) {
  mslib.format.base.MsDataFile.call(this, f);
  if (f) {
   if (f.name.match(/\.mzML$/i)) {
    this.fileType = "mzML";
   }
   else if (f.name.match(/\.mzXML$/i)) {
    this.fileType = "mzXML";
   }
   else {
    throw new Error("MzFileInvalidFileType");
   }
  }
  this.internal.offsets.index = 0;
 };
 _MzFile.prototype = Object.create((typeof MsDataFile !== 'undefined') ? MsDataFile.prototype : mslib.format.base.MsDataFile.prototype);

 //------------------------------------------------------------------------------
 //MzFile ASync methods
 //------------------------------------------------------------------------------

 _MzFile.prototype.fetchScanOffsets = function(prefetchingScanHeaders) {
  return new Promise((resolve,reject) => {
   if (!this.ready) reject(new Error("MzFileNotReady"));
   else {
    mslib.common.start(this);
    this.resolve = resolve;
    fetchScanOffsetsInternal.call(this);
   }
  });
 };

 let fetchScanOffsetsInternal = function(prefetchingScanHeaders) {
  this.scans = [];
  this.reader.readText(
   this.reader.file.size-INDEXOFFSET_SLICE_SIZE
  ).then((r) => processScanOffsetStart.call(this,r,prefetchingScanHeaders));
 }

 _MzFile.prototype.fetchScanHeader = function(sNum,prefetchingSpectralData) {
  return new Promise((resolve,reject) => {
   if (!this.ready) reject(new Error("MzFileNotReady"));
   else if (!this.scans.length) reject(new Error("MzFileNoScanOffsets"));
   else {
    if (!sNum && this.currentScanNumber) sNum = this.currentScanNumber;
    if (!this.scans[sNum]) reject(new Error("MzFileScanUnknown"));
    else {
     mslib.common.start(this);
     this.resolve = resolve;
     fetchScanHeaderInternal.call(this,sNum,false,prefetchingSpectralData);
    }
   }
  });
 }

 let fetchScanHeaderInternal = function(sNum,prefetchingScanHeaders,prefetchingSpectralData) {
  this.setCurrentScanNumber(sNum);
  if (this.scans[sNum].headerParsed) {
   if (prefetchingScanHeaders) fetchNextScanHeaderInternal.call(this,sNum);
   else if (prefetchingSpectralData) fetchSpectrumInternal.call(this);
   else { 
    mslib.common.finish(this);
    this.resolve();
   }
  }
  else {
   this.reader.readText(
    this.scans[sNum].offset,
    HEADER_SLICE_SIZE
   ).then((r) => processScanHeader.call(this,r,prefetchingScanHeaders,prefetchingSpectralData));
  } 
 };

 let fetchNextScanHeaderInternal = function(sNum) {
  let nextScanNumber = this.getNextScanNumber(sNum);
  if (nextScanNumber) {
   mslib.common.progress(this,(sNum/this.getLastScanNumber())*100);
   fetchScanHeaderInternal.call(this,nextScanNumber,true)
  }
  else {
   mslib.common.finish(this);
   this.resolve();
  }
 }

 _MzFile.prototype.fetchAllScanHeaders = function() {
  return new Promise((resolve,reject) => {
   if (!this.ready) reject(new Error("MzFileNotReady")); 
   else {
    mslib.common.start(this);
    this.resolve = resolve;
    fetchAllScanHeadersInternal.call(this);
   }
  });
 }

 let fetchAllScanHeadersInternal = function() {
  if (!this.scans.length) fetchScanOffsetsInternal.call(this,true);
  else fetchScanHeaderInternal.call(this,this.getFirstScanNumber(),true);
 }
 
 _MzFile.prototype.fetchSpectrum = function() {
  return new Promise((resolve,reject) => {
   if (!this.ready) reject(new Error("MzFileNotReady"));
   else if (!this.scans.length) reject(new Error("MzFileNoScanOffsets"));
   else if (!this.scans[this.currentScanNumber]) reject(new Error("MzFileScanUnknown"));
   else {
    mslib.common.start(this);
    this.resolve = resolve;
    fetchSpectrumInternal.call(this);
   }
  });
 }

 let fetchSpectrumInternal = function() {
  this.currentScanSpectrum = null;
  this.internal.textBuffer = "";
  this.reader.readText(
   this.scans[this.currentScanNumber].internal.binaryDataOffset[0],
   (this.fileType == "mzML") && this.scans[this.currentScanNumber].internal.binaryDataLength[0]
   ? this.scans[this.currentScanNumber].internal.binaryDataLength[0] + 10
   : this.scans[this.currentScanNumber].bytes - (this.scans[this.currentScanNumber].internal.binaryDataOffset[0]-this.scans[this.currentScanNumber].offset)
  ).then((r) => processSpectrum.call(this,r));
 };

 //Post-read callback functions

 let processScanOffsetStart = function(result,prefetchingScanHeaders) {
  let regexmatch = regex[this.fileType].index.exec(result);
  this.internal.previousScanNumber = null;
  if (regexmatch) {
   this.internal.offsets.index = +regexmatch[1];
   this.reader.readText(this.internal.offsets.index).then((r) => processScanOffsetList.call(this,r,prefetchingScanHeaders));
  }
  else {
   if (this.fileType == "mzXML") {
    console.log("Warning: Index offset is undefined - will parse scan offsets line-by-line");
    this.internal.textBuffer = "";
    this.reader.readText(0,UNINDEXED_OFFSET_SLICE_SIZE).then((r) => processUnindexedScanOffsets.call(this,r,prefetchingScanHeaders,null));
   }
   else throw new Error("MzFileCannotParseIndexOffset");
  }
 }

 let processScanOffsetList = function(result,prefetchingScanHeaders) {
  mslib.common.performTask(['mslib.format.MzFile.parsers.scanOffsetList',result,regex[this.fileType].scanOffsetList,this.scans])
  .then((r) => {
   this.scans = r;
   if (prefetchingScanHeaders) fetchAllScanHeadersInternal.call(this);
   else {
    mslib.common.finish(this);
    this.resolve();
   }
  });
 }

 let processUnindexedScanOffsets = function(result,prefetchingScanHeaders,prevScanNumber) {
  mslib.common.performTask(['mslib.format.MzFile.parsers.unindexedScanOffsets',this.internal.textBuffer,result,this.reader.position,regex['mzXML'].scanNumber,this.scans,this.internal.prevScanNumber])
  .then((r) => {
   this.scans = r.scans;
   this.reader.position = r.position;
   if (r.isIncomplete) {
    this.internal.textBuffer = r.remaining;
    this.internal.prevScanNumber = r.prevScanNumber;
    this.reader.readText(
     this.reader.position,
     UNINDEXED_OFFSET_SLICE_SIZE
    ).then((r) => processUnindexedScanOffsets.call(this,r,prevScanNumber));
   }
   else {
    if (prefetchingScanHeaders) fetchAllScanHeadersInternal.call(this);
    else {
     mslib.common.finish(this);
     this.resolve();
    }
   }
  });
 }

 let processScanHeader = function(result,prefetchingScanHeaders,prefetchingSpectralData) {
  this.scans[this.currentScanNumber].internal.compressionType      = [];
  this.scans[this.currentScanNumber].internal.binaryDataPrecision  = [];
  if (this.fileType == "mzML") this.scans[this.currentScanNumber].internal.binaryDataLength = [];
  this.scans[this.currentScanNumber].internal.binaryDataOffset     = [];
  this.scans[this.currentScanNumber].internal.binaryDataOrder      = [];
  this.internal.textBuffer = "";  
  mslib.common.performTask(['mslib.format.MzFile.parsers.scanHeader',this.internal.textBuffer,result,this.reader.position,regex[this.fileType],this.scans[this.currentScanNumber],this.fileType])
  .then((r) => {
   this.scans[this.currentScanNumber] = r.scan;
   if (r.isIncomplete) {
    this.internal.textBuffer = r.remaining;
    this.reader.readText(
     this.reader.position,
     this.scans[this.currentScanNumber].internal.binaryDataOffset[0] ? SPECTRUM_SLICE_SIZE.MZML : HEADER_SLICE_SIZE
    ).then((r) => processScanHeader.call(this,r,prefetchingScanHeaders,prefetchingSpectralData));
   }
   else {
    this.scans[this.currentScanNumber].headerParsed = true;
    if (prefetchingScanHeaders) fetchNextScanHeaderInternal.call(this,this.currentScanNumber);
    else if (prefetchingSpectralData) fetchSpectrumInternal.call(this);
    else {
     mslib.common.finish(this);
     this.resolve();
    }
   }
  });
 }

 let processSpectrum = function(result) {
  mslib.common.performTask(['mslib.format.MzFile.parsers.spectrum',this.internal.textBuffer,result,this.reader.position,regex[this.fileType],this.scans[this.currentScanNumber],this.fileType,this.internal.firstBinaryArray])
  .then((r) => {
   if (r.isIncomplete) {
    if (r.firstBinaryArray) {
     this.internal.firstBinaryArray = r.firstBinaryArray;
     this.reader.readText(
      this.scans[this.currentScanNumber].internal.binaryDataOffset[1],
      this.scans[this.currentScanNumber].internal.binaryDataLength[1] ? this.scans[this.currentScanNumber].internal.binaryDataLength[1] + 10 : SPECTRUM_SLICE_SIZE.MZML
     ).then((r) => processSpectrum.call(this,r));
    }
    else { 
     this.internal.textBuffer = r.remaining;
     this.parent.reader.readText(
      this.reader.position,
      SPECTRUM_SLICE_SIZE[this.fileType]
     ).then((r) => processSpectrum.call(this,r));
    }
   }
   else {
    this.currentScanSpectrum = new mslib.data.Spectrum(...r.spectralData)
    mslib.common.finish(this);
    this.resolve();
   }
  });
 }

 _MzFile.parsers = {}

 let linkPrevious = function(scans,scanNumber,prevScanNumber) {
  if (prevScanNumber) {
   if (scans[scanNumber].offset < scans[prevScanNumber].offset) throw new Error("MzFileInvalidUnindexedOffset");
   scans[prevScanNumber].bytes = scans[scanNumber].offset - scans[prevScanNumber].offset;
   scans[prevScanNumber].next = scanNumber;
   scans[scanNumber].previous = prevScanNumber;
  }
 }


 _MzFile.parsers.scanOffsetList = function(data,scanOffsetRegex,scans) {
  let prevScanNumber = null;
  let endOffsetIndex = data.lastIndexOf("</offset>");
  if (endOffsetIndex != -1) {
   let offsets = data.substr(0,endOffsetIndex).split("</offset>");
   for (let i = 0; i < offsets.length; i++) {
    let regexMatch = scanOffsetRegex.exec(offsets[i]);
    if (regexMatch) {
     let scanNumber = +regexMatch[1];
     scans[scanNumber] = new mslib.data.Scan();
     scans[scanNumber].offset = +regexMatch[2];
     linkPrevious(scans,scanNumber,prevScanNumber);
     prevScanNumber = scanNumber;
    }
   }          
  }
  else {
   throw new Error("MzFileCannotParseIndexOffsetEntries");
  }
  return scans;
 }


 _MzFile.parsers.unindexedScanOffsets = function(buffer,newText,position,scanNumberRegex,scans,prevScanNumber) {
  let data = buffer + newText;
  let dataOffset = position - data.length;
  let regexMatch,endScanNumIndex;
  while ((regexMatch = scanNumberRegex.exec(data)) !== null) {
   let scanNumber = +regexmatch[1];
//   if (scanNumber == prevScanNumber) continue;
   scans[scanNumber] = new mslib.data.Scan();
   scans[scanNumber].offset = dataOffset + scanNumberRegex.lastIndex - regexMatch[0].length;
   linkPrevious(scans,scanNumber,prevScanNumber);
   prevScanNumber = scanNumber;
  }
  if (data.match(/<\/mzXML>/)) {
   scans[scanNumber].bytes = data.length-8; //ensure last scan also has a length property
   return { isIncomplete : false, scans : scans };
  }
  else {
   data = data.substr(scanNumberRegex.lastIndex);
   return { isIncomplete : true, scans : scans, remaining : data, prevScanNumber : prevScanNumber};
  } 
 }

 _MzFile.parsers.scanHeader = function(buffer,newText,position,regex,scan,fileType) {
  let data = buffer + newText;
  let endEleIndex = data.lastIndexOf(">") + 1;
  let eles = data.substr(0,endEleIndex).split(">").slice(0,-1);
  for (let i = 0; i < eles.length; i++) {
   if (fileType == "mzML" && /<binary$/.exec(eles[i])) {
    if (scan.internal.binaryDataListCount != 2) {
     throw new Error("MzFileInvalidNumberOfBinaryDataArrays");
    }
    //current binary element offset is start position of the data + length of this and all previous eles + i + 1(correct for missing >)
    scan.internal.binaryDataOffset.push(position - data.length + eles.slice(0,i+1).join("").length + i + 1)   
    if (!scan.internal.binaryDataOffset[1]) {
     if (scan.internal.binaryDataLength[0]) {
      position = +scan.internal.binaryDataOffset[0]+scan.internal.binaryDataLength[0] + 9;
     }
     else { //finding second binary element when no BinaryDataLength - large read from BinaryDataOffset of the first binary element
      position = +scan.internal.binaryDataOffset[0];
     }
    }
    break;
   }
   regex.scanKeys.forEach(function(key) {
    let regexmatch = regex.scan[key].exec(eles[i]);
    if (regexmatch) {
     let scope = scan;
     let value = (isNaN(regexmatch[1]) ? regexmatch[1] : (+regexmatch[1]));
     if (typeof(scope[key]) == "undefined") scope = scan.internal;
     if (Array.isArray(scope[key])) scope[key].push(value);
     else scope[key] = value;
    }
   },this);
   if (fileType == "mzXML" && /<peaks\s/.exec(eles[i])) {
    scan.internal.binaryDataOffset.push(position - data.length + eles.slice(0,i+1).join("").length + i + 1);
    break;
   }
  }
  if (!scan.internal.binaryDataOffset[(fileType == "mzML" ? 1 : 0)]) { //further reading required
   return { isIncomplete : true, scan : scan, remaining : scan.internal.binaryDataOffset[0] ? "" : data.substr(endEleIndex) };
  }
  else { //End of header
   //Standardise values
   if (fileType == "mzXML" || scan.internal.rtUnits=="second") {
    scan.retentionTime /= 60;
   }
   scan.centroided = scan.centroided ? true : false; //standardise null, 0 etc
   scan.activationMethods = scan.activationMethods.map(function(value) {
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
   scan.internal.compressionType = scan.internal.compressionType.map(function(value) {
    switch(value) {
     case "zlib" : return ZLIB;
     default : return NO_COMPRESSION;
    }
   });
   scan.internal.binaryDataOrder = scan.internal.binaryDataOrder.map(function(value) {
    switch(value) {
     case "-int" : return MZ_INT;
     case "int-" : return INT_MZ;
     case 1000514 : return MZ;
     case 1000515 : return INT;
     default : return value;
    }
   });
   if (scan.internal.binaryDataEndianness) {
    if (scan.internal.binaryDataEndianness == "network") delete(scan.internal.binaryDataEndianness);
    else throw new Error("MzFileUnrecognisedByteOrder");
   }
   return { isIncomplete : false,  scan : scan };
  }
 }

 _MzFile.parsers.spectrum = function(buffer,text,position,regex,scan,fileType,firstBinaryArray) {
  let data = buffer.replace(/\n|\r/gm,"") + text;
  if (fileType == 'mzML') {
   let binaryIndex = data.indexOf("</binary>");
   if (binaryIndex < 0) return { isIncomplete : true, remaining : data };
   else {
    data = data.substr(0,binaryIndex);
    if (!firstBinaryArray) {
     firstBinaryArray = data;
     return { isIncomplete : true, firstBinaryArray : firstBinaryArray};
    }
    else {
     let first = decodeByteArray(firstBinaryArray,scan.internal.compressionType[0],scan.internal.binaryDataPrecision[0],true);
     let second = decodeByteArray(data,scan.internal.compressionType[1],scan.internal.binaryDataPrecision[1],true);
     let a = [];
     let b = [];
     if (scan.internal.binaryDataOrder[0] && !scan.internal.binaryDataOrder[1]) {
      a = first;
      b = second;
     }
     else if (!scan.internal.binaryDataOrder[0] && scan.internal.binaryDataOrder[1]) {
      b = first;
      a = second;
     }
     else {
      throw new Error('MzFileUnrecognisedBinaryDataOrder: '+scan.internal.binaryDataOrder);
     }
     return { isIncomplete : false, spectralData : [a.filter((mz,i) => b[i]),b.filter(inten => inten)] };
    }
   }
  }
  else if (fileType == 'mzXML') {
   let endPeaksIndex = data.indexOf('</peaks>')
   if (endPeaksIndex < 0) return { isIncomplete : true, remaining : data }
   else {
    data = data.substr(0,endPeaksIndex);
    let values = decodeByteArray(data,scan.internal.compressionType[0],scan.internal.binaryDataPrecision[0],false)
    let a = [];
    let b = [];
    if (scan.internal.binaryDataOrder[0] == INT_MZ) {
     for (let i = 0; i < values.length; i = i+2) { 
      b.push(values[i]);
      a.push(values[i+1]);
     }
    }
    else {
     for (let i = 0; i < values.length; i = i+2) { 
      a.push(values[i]); 
      b.push(values[i+1]);
     }
    }
    return { isIncomplete : false, spectralData : [a.filter((mz,i) => b[i]),b.filter(inten => inten)] };
   }
  }
 };

 //------------------------------------------------------------------------------
 //Format-specific regexes for data extraction
 //------------------------------------------------------------------------------

 //The pattern [^] is a multiline single character wildcard (since . will not match \n)

 let regex = {};
 regex.mzML = {
  index : /<indexListOffset>(\d+)<\/indexListOffset>/,
  scanOffsetList : /<offset\sidRef=".*?scan=(\d+)".*?>(\d+)$/,
  scanNumber : /<spectrum\s(?:[^]+\s)?id=".*?scan=(\d+)"/,
  scan : {
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
  scanOffsetList : /<offset\sid="(\d+)".*?>(\d+)$/,
  scanNumber : /<scan\s(?:[^]+\s)?num="(\d+?)"/,
  scan : {
   msLevel : /<scan\s(?:[^]+\s)?msLevel="(\d+?)"/,
   centroided : /<scan\s(?:[^]+\s)?centroided="([01])"/,
   retentionTime : /<scan\s(?:[^]+\s)?retentionTime="PT(\d+\.?\d+)S"/,
   lowMz : /<scan\s(?:[^]+\s)?(?:lowMz|startMz)="(.+?)"/,
   highMz : /<scan\s(?:[^]+\s)?(?:highMz|endMz)="(.+?)"/,
   basePeakMz : /<scan\s(?:[^]+\s)?basePeakMz="(.+?)"/,
   basePeakIntensity : /<scan\s(?:[^]+\s)?basePeakIntensity="(.+?)"/,
   collisionEnergy : /<scan\s(?:[^]+\s)?collisionEnergy="(.+?)"/,
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
 
 let decodeByteArray = function(t,c,p,e) {
  if (!t.length) {
   return [];
  }
  let s = globalThis.atob(t); //decode base64
  let bytes;
  if (c && (c == ZLIB)) {
   try {
    bytes = mslib.dist.zlib.inflate(s); //inflate zlib
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
   for (let i = 0; i < s.length; i++) { 
    bytes[i] = s.charCodeAt(i);
   }
  }
  let dV = new DataView(bytes.buffer);  //Have to use DataView to access in Big-Endian format
  let values = [];
  if (p == 32) {
   if (bytes.length % 4) {
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (let i = 0; i < dV.byteLength; i = i+4) { 
    values.push(dV.getFloat32(i,e)); 
   }
  }
  else if (p == 64) {
   if (bytes.length % 8) {
    throw new Error("MzFileInvalidByteArrayLength");
   }
   for (let i = 0; i < dV.byteLength-1; i = i+8) { 
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