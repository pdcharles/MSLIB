"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.BlibFile = function _SOURCE() {

 var _BlibFile = function(f) {
  MSLIB.Format.SQLiteFile.call(this, f);
  if (f.name.match(/\.blib$/i)) {
   this.fileType = "blib";
  }
  else {
   console.log("Error: unsupported file type");
   return {};
  }
 }
 _BlibFile.prototype = Object.create(MSLIB.Format.SQLiteFile.prototype);

 _BlibFile.prototype.fetchPeptideSequences = function() {
  this.LastError = this.queryDB("select peptideSeq as Sequence from RefSpectra group by Sequence;")
 }
 
 _BlibFile.prototype.fetchPrecursorMzs = function() {
  this.LastError = this.queryDB("select precursorMz as PrecursorMz from RefSpectra group by PrecursorMz;")
 }
 
 _BlibFile.prototype.fetchEntriesBySequence = function(seq) {
  this.LastError = this.queryDB("select peptideSeq as Sequence,precursorMz as PrecursorMz,precursorCharge,retentionTime,id from RefSpectra where Sequence=\""+seq+"\";")
 }
 
 _BlibFile.prototype.fetchEntriesByPrecursorMz = function(mz) {
  this.LastError = this.queryDB("select peptideSeq as Sequence,precursorMz as PrecursorMz,precursorCharge,retentionTime,id from RefSpectra where PrecursorMz=\""+mz+"\";")
 }
 
 _BlibFile.prototype.fetchSpectrum = function(specID) {
  this.LastError = this.queryDB("select peakMz,peakIntensity from RefSpectraPeaks where RefSpectraID=\""+specID+"\";")
  MMSLIB.Common.whenReady(this,(function() {
    var uncompressedMz = zpipe.inflate(String.fromCharCode.apply(null,this.queryResult.data[0][0]));
    var bytesMz = new Uint8Array(uncompressedMz.length);
    for (var i = 0; i < uncompressedMz.length; i++) { 
     bytesMz[i] = uncompressedMz.charCodeAt(i);
    }
    var dVmz = new DataView(bytes_mz.buffer);
    var mzs = [];
    if (bytes_mz.length % 8) {
     console.log("Error: m/z byte array length not a multiple of 8");
    }
    for (var i = 0; i < dVmz.byteLength-1; i = i+8) { 
     mzs.push(dVmz.getFloat64(i,true)); 
    }
    var uncompressedIntData = zpipe.inflate(String.fromCharCode.apply(null,this.queryResult.data[0][1]));
    var intBytes = new Uint8Array(uncompressedIntData.length);
    for (var i = 0; i < uncompressedIntData.length; i++) { 
     intBytes[i] = uncompressedIntData.charCodeAt(i);
    }
    var dVint = new DataView(intBytes.buffer);
    var ints = [];
    if (intBytes.length % 4) {
     console.log("Error: Intensity byte array length not a multiple of 4");
    }
    for (var i = 0; i < dVint.byteLength; i = i+4) { 
     ints.push(dVint.getFloat32(i,true)); 
    }
    this.query.result.spectrum = new MSLIB.Data.Spectrum(mzs,ints);
   }).bind(this)
  );
 }
 
 _BlibFile._SOURCE = _SOURCE;

 return BlibFile;

}();