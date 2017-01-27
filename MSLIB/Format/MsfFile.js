"use strict";
zip.useWebWorkers = false;

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.MsfFile = function _SOURCE() {

 var MsfFile = function(f) {
  MSLIB.Format.SQLiteFile.call(this, f);
  if (f.name.match(/\.blib$/i)) {
   this.FileType = "msf";
  }
  else {
   console.log("Error: unsupported file type");
   return {};
  }
 }
 MsfFile.prototype = Object.create(MSLIB.Format.SQLiteFile.prototype);

 MsfFile.prototype.getPeptideSequences = function() {
  this.LastError = this.queryDB("select Sequence from Peptides group by Sequence;")
 }
 
 MsfFile.prototype.getPrecursorMzs = function() {
  this.LastError = this.queryDB("select round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz from SpectrumHeaders group by PrecursorMz;")
 }
 
 MsfFile.prototype.getEntriesBySequence = function(seq) {
  this.LastError = this.queryDB("select Sequence,round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from (select Sequence,SpectrumID from Peptides where Sequence=\""+seq+"\") as A left outer join SpectrumHeaders as B on A.SpectrumID = B.SpectrumID;")
 }
 
 MsfFile.prototype.getEntriesByPrecursorMz = function(mz) {
  this.LastError = this.queryDB("select Sequence,PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from (select SpectrumID,round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from SpectrumHeaders where PrecursorMz="+mz+") as A left outer join Peptides as B on A.SpectrumID = B.SpectrumID;")
 }
 
 MsfFile.prototype.getSpectrum = function(specID) {
  this.LastError = this.queryDB("select Spectrum from Spectra where UniqueSpectrumID = \""+specID+"\";")
  MSLIB.Common.whenReady(this,(function() {
   var compressedBlob = new Blob([this.Query.Result.Data[0][0]], {type: 'application/octet-binary'});
   zip.createReader(
    new zip.BlobReader(compressedBlob),
    (function(reader) {
     reader.getEntries(
      (function(entries) {
       if (entries.length) {
        entries[0].getData(
         new zip.TextWriter(), 
         (function(text) {
          var xmlDoc = (new DOMParser()).parseFromString(text,"text/xml");
          var peaks = Array.prototype.slice.call(xmlDoc.getElementsByTagName("PeakCentroids")[0].getElementsByTagName("Peak"));
          var values_mz = [];
          var values_int = [];
          for (var i in peaks) {
           values_mz.push(peaks[i].getAttribute("X"));
           values_int.push(peaks[i].getAttribute("Y"));
          }
          this.Query.Result.Spectrum = new MSLIB.Data.Spectrum(values_mz,values_int);
          reader.close(() => {});
         }).bind(this)
        )
       }
       else {
        this.Ready = 1;
        console.log("msf decode - spectrum xml missing");
       }
      }).bind(this)
     )
    }).bind(this), 
    function(error) {
     this.Ready = 1;
     console.log("Cannot decode msf spectrum zipped xml");
    }
   );
  }).bind(this));
 }

 MsfFile._SOURCE = _SOURCE;

 return MsfFile;

}();