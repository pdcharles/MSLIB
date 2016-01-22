"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.FastaFile = function () {

 var FastaFile = function(f) {
  this.Reader                 = new MSLIB.Common.Reader(f,this);
  this.Reader.onprogress = function(data) {
   if (data.lengthComputable) {                                            
    this.Progress = parseInt(((data.loaded/data.total)*100).toFixed(2));
   }
  }
  this.Ready                  = true;
  this.Progress               = 100;
  this.Report                 = false;
  this.FileType               = "fasta";
  this.AccessionParse         = new RegExp(/>(\S+)/);
  this.DescriptionParse       = new RegExp(/\s(.+)$/);
  this.Entries = {};
 };
 
 FastaFile.prototype.setParseRules = function(a,d) {
  this.AccessionParse         = new RegExp(a);
  this.DescriptionParse       = new RegExp(d);
 };

 FastaFile.prototype.load = function() {
  if (!(this.AccessionParse && this.DescriptionParse)) return ("FastaFileNoParseRules");
  MSLIB.Common.Starting.call(this);
  this.LastError = this.Reader.readText(
   function() {
    var text = this.result.replace(/\r\n?/gm,"\n");
    text = text.replace(/^>/gm,"__START__");
    var entries = text.split("__START__");
    entries.forEach(function(entry,i) {
     this.Parent.Progress = ((i/entries.length)*100).toFixed(2);
     if (entry.length) {
      var firstNewLine = entry.indexOf("\n");
      var entryheader = ">"+entry.substr(0,firstNewLine);
      var entryacc = this.Parent.AccessionParse.exec(entryheader)[1];
      var entrydesc = this.Parent.DescriptionParse.exec(entryheader)[1];
      if (!entryacc || !entrydesc) {
       console.log("Failed to parse "+entryheader);
       return;
      }
      var entrybody = entry.substr(firstNewLine);
      entrybody = entrybody.replace(/\n/gm,"");
      this.Parent.Entries[entryacc]=[entrydesc,entrybody];
     }
    },this);
    MSLIB.Common.Finished.call(this.Parent);
   },
   0
  );
 };

 return FastaFile;

}();