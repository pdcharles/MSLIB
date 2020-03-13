"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.FastaFile = function _SOURCE() {

 var _FastaFile = function(f) {
  this.reader            = new MSLIB.Common.Reader(f,this);
  MSLIB.Common.initialise(this):
  this.fileType               = "fasta";
  this.accessionParse         = new RegExp(/>(\S+)/);
  this.descriptionParse       = new RegExp(/\s(.+)$/);
  this.entries = {};
 };
 
 _FastaFile.prototype.setParseRules = function(a,d) {
  this.accessionParse         = new RegExp(a);
  this.descriptionParse       = new RegExp(d);
 };

 _FastaFile.prototype.load = function() {
  if (!(this.accessionParse && this.descriptionParse)) return ("FastaFileNoParseRules");
  MSLIB.Common.start(this);
  this.reader.readText(
   function() {
    var text = this.result.replace(/\r\n?/gm,"\n");
    text = text.replace(/^>/gm,"__START__");
    var entries = text.split("__START__");
    entries.forEach(function(entry,i) {
     MSLIB.Common.progress(this.parent,((i/entries.length)*100).toFixed(2));
     if (entry.length) {
      var firstNewLine = entry.indexOf("\n");
      var entryheader = ">"+entry.substr(0,firstNewLine);
      var entryacc = this.parent.accessionParse.exec(entryheader)[1];
      var entrydesc = this.parent.descriptionParse.exec(entryheader)[1];
      if (!entryacc || !entrydesc) {
       console.log("Failed to parse "+entryheader);
       return;
      }
      var entrybody = entry.substr(firstNewLine);
      entrybody = entrybody.replace(/\n/gm,"");
      this.parent.entries[entryacc]=[entrydesc,entrybody];
     }
    },this);
    MSLIB.Common.finish(this.parent);
   }
  );
 };

 _FastaFile._SOURCE = _SOURCE;

 return _FastaFile;

}();