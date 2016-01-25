"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.BlibFile = function() {

 var BlibFile = function(f) {
  MSLIB.Format.SQLiteFile.call(this, f);
  if (f.name.match(/\.blib$/i)) {
   this.FileType = "blib";
  }
  else {
   console.log("Error: unsupported file type");
   return {};
  }
 }
 BlibFile.prototype = Object.create(MSLIB.Format.SQLiteFile.prototype);

 BlibFile.prototype.fetchPeptideSequences = function() {
  this.LastError = this.queryDB("select peptideSeq as Sequence from RefSpectra group by Sequence;")
 }
 
 BlibFile.prototype.fetchPrecursorMzs = function() {
  this.LastError = this.queryDB("select precursorMz as PrecursorMz from RefSpectra group by PrecursorMz;")
 }
 
 BlibFile.prototype.fetchEntriesBySequence = function(seq) {
  this.LastError = this.queryDB("select peptideSeq as Sequence,precursorMz as PrecursorMz,precursorCharge,retentionTime,id from RefSpectra where Sequence=\""+seq+"\";")
 }
 
 BlibFile.prototype.fetchEntriesByPrecursorMz = function(mz) {
  this.LastError = this.queryDB("select peptideSeq as Sequence,precursorMz as PrecursorMz,precursorCharge,retentionTime,id from RefSpectra where PrecursorMz=\""+mz+"\";")
 }
 
 BlibFile.prototype.fetchSpectrum = function(specID) {
  this.LastError = this.queryDB("select peakMz,peakIntensity from RefSpectraPeaks where RefSpectraID=\""+specID+"\";")
  MSLIB.Common.WaitUntil(function() {return this.Ready},(function() {
    var uncompressed_mz = zpipe.inflate(String.fromCharCode.apply(null,this.QueryResult.Data[0][0]));
    var bytes_mz = new Uint8Array(uncompressed_mz.length);
    for (var i = 0; i < uncompressed_mz.length; i++) { 
     bytes_mz[i] = uncompressed_mz.charCodeAt(i);
    }
    var dV_mz = new DataView(bytes_mz.buffer);
    var values_mz = [];
    if (bytes_mz.length % 8) {
     console.log("Error: m/z byte array length not a multiple of 8");
    }
    for (var i = 0; i < dV_mz.byteLength-1; i = i+8) { 
     values_mz.push(dV_mz.getFloat64(i,true)); 
    }
    var uncompressed_int = zpipe.inflate(String.fromCharCode.apply(null,this.QueryResult.Data[0][1]));
    var bytes_int = new Uint8Array(uncompressed_int.length);
    for (var i = 0; i < uncompressed_int.length; i++) { 
     bytes_int[i] = uncompressed_int.charCodeAt(i);
    }
    var dV_int = new DataView(bytes_int.buffer);
    var values_int = [];
    if (bytes_int.length % 4) {
     console.log("Error: Intensity byte array length not a multiple of 4");
    }
    for (var i = 0; i < dV_int.byteLength; i = i+4) { 
     values_int.push(dV_int.getFloat32(i,true)); 
    }
    this.Query.Result.Spectrum = new MSLIB.Data.Spectrum(values_mz,values_int);
   }).bind(this)
  );
 }
  
 return BlibFile;

}();