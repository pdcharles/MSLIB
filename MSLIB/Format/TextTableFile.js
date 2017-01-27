"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.TextTableFile = function _SOURCE() {
 
 var TextTableFile = function(f) {
  this.Reader                 = new MSLIB.Common.Reader(f,this);
  MSLIB.Common.initialise.call(this);
  this.FileType               = "text_table";
  if (f.name.match(/\.csv$/i)) {
   this.Delimiter = ",";
  }
  else if (f.name.match(/\.tsv$/i) || f.name.match(/\.txt$/i)) {
   this.Delimiter = "\t";
  }
  else {
   this.Delimiter = "";
  }
  this.UseFirstLineAsHeaders  = false;
  this.Headers                = [];
  this.Lines                  = [];
 };
 
 TextTableFile.prototype.load = function() {
  MSLIB.Common.starting.call(this);
  this.LastError = this.Reader.readText(
   function() {
    var lines = this.result.replace(/\r\n?/gm,"\n").split("\n");
    while (!lines[lines.length-1].length) lines.pop(); // remove trailing blank lines
    lines.forEach(function(line,i) {
     MSLIB.Common.progress.call(this.Parent,((i/lines.length)*100).toFixed(2));
     if (this.Parent.Delimiter) {
      var splitarr = line.split(this.Parent.Delimiter);
      var fields = [];
      while (splitarr.length) {
       var field = splitarr.shift();
       if (field.match(/^"/)) { //handle quoted fields
        while (!field.match(/"$/) && splitarr.length) {
         field += splitarr.shift();
        }
        field = field.substring(1,field.length-1);
       }
       fields.push(field);
      }
      this.Parent.Lines.push(fields);
     }
     else {
      this.Parent.Lines.push([line]);
     }
    },this);
    if (this.Parent.UseFirstLineAsHeaders && this.Parent.Lines.length && !this.Parent.Headers.length) {
     this.Parent.Headers = this.Parent.Lines.shift();
    }
    MSLIB.Common.finished.call(this.Parent);
   }
  );
 };

 TextTableFile._SOURCE = _SOURCE;

 return TextTableFile;

}();