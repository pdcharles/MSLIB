"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.XmlFile = function _SOURCE() {
 
 var XmlFile = function(f) {
  this.Reader                 = new MSLIB.Common.Reader(f,this);
  this.Ready                  = true;
  this.Progress               = 100;
  this.Report                 = false;
  this.FileType               = "xml";
  this.DocRoot                = null;
 };
 
 XmlFile.prototype.load = function() {
  MSLIB.Common.starting.call(this);
  this.LastError = this.Reader.readText(
   function() {
    this.Parent.DocRoot = (new DOMParser()).parseFromString(this.result, "text/xml");
    MSLIB.Common.finished.call(this.Parent);
   }
  );
 };

 XmlFile._SOURCE = _SOURCE;

 return XmlFile;

}();