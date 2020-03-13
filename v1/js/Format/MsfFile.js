"use strict";
zip.useWebWorkers = false;

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.MsfFile = function _SOURCE() {

 var _MsfFile = function(f) {
  MSLIB.Format.SQLiteFile.call(this, f);
  if (f.name.match(/\.blib$/i)) {
   this.fileType = "msf";
  }
  else {
   console.log("Error: unsupported file type");
   return {};
  }
 }
 _MsfFile.prototype = Object.create(MSLIB.Format.SQLiteFile.prototype);

 _MsfFile.prototype.getPeptideSequences = function() {
  this.queryDB("select Sequence from Peptides group by Sequence;")
 }
 
 _MsfFile.prototype.getPrecursorMzs = function() {
  this.queryDB("select round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz from SpectrumHeaders group by PrecursorMz;")
 }
 
 _MsfFile.prototype.getEntriesBySequence = function(seq) {
  this.queryDB("select Sequence,round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from (select Sequence,SpectrumID from Peptides where Sequence=\""+seq+"\") as A left outer join SpectrumHeaders as B on A.SpectrumID = B.SpectrumID;")
 }
 
 _MsfFile.prototype.getEntriesByPrecursorMz = function(mz) {
  this.queryDB("select Sequence,PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from (select SpectrumID,round((Mass+(Charge*1.0078246))/Charge,4) as PrecursorMz,Charge,RetentionTime,UniqueSpectrumID from SpectrumHeaders where PrecursorMz="+mz+") as A left outer join Peptides as B on A.SpectrumID = B.SpectrumID;")
 }
 
 _MsfFile.prototype.getSpectrum = function(specID) {
  this.queryDB("select Spectrum from Spectra where UniqueSpectrumID = \""+specID+"\";")
  MSLIB.Common.whenReady(this,(function() {
   var compressedBlob = new Blob([this.query.result.Data[0][0]], {type: 'application/octet-binary'});
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
          var mzs = [];
          var ints = [];
          for (var i in peaks) {
           mzs.push(peaks[i].getAttribute("X"));
           ints.push(peaks[i].getAttribute("Y"));
          }
          this.query.result.Spectrum = new MSLIB.Data.Spectrum(mzs,ints);
          reader.close(() => {});
         }).bind(this)
        )
       }
       else {
        throw new Error("MsfFileSpectrumXMLMissing");
       }
      }).bind(this)
     )
    }).bind(this), 
    function(error) {
     throw new Error("MsfFileError - "+error);
    }
   );
  }).bind(this));
 }

 _MsfFile._SOURCE = _SOURCE;

 return MsfFile;

}();