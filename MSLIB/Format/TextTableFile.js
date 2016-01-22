"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.TextTableFile = function () {
 
 var TextTableFile = function(f) {
  this.Reader                 = new MSLIB.Common.Reader(f,this);
  this.Ready                  = true;
  this.Progress               = 100;
  this.Report                 = false;
  this.FileType               = "text_table";
  this.Delimiter              = "";
  if (f.name.match(/\.csv$/i)) {
   this.Delimiter = ",";
  }
  else if (f.name.match(/\.tsv$/i) || f.name.match(/\.tab.txt$/i)) {
   this.Delimiter = "\t";
  }
  this.UseFirstLineAsHeaders  = false;
  this.Headers                = [];
  this.Lines                  = [];
 };
 
 TextTableFile.prototype.load = function() {
  MSLIB.Common.Starting.call(this);
  this.LastError = this.Reader.readText(
   function() {
    var text = this.result.replace(/\r\n?/gm,"\n");
    var lines = text.split("\n");
    while (!lines[lines.length-1]) lines.pop(); // remove trailing blank lines
    lines.forEach(function(line,i) {
     this.Parent.Progress = ((i/lines.length)*100).toFixed(2);
     if (this.Parent.Delimiter) {
      var splitarr = line.split(this.Parent.Delimiter);
      var fields = [];
      while (splitarr.length) {
       var field = splitarr.shift();
       if (field.match(/^"/)) {
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
    MSLIB.Common.Finished.call(this.Parent);
   },
   0
  );
 };

 return TextTableFile;

}();