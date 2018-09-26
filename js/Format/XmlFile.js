"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.XmlFile = function _SOURCE() {
 
 var _XmlFile = function(f) {
  this.reader                 = new MSLIB.Common.Reader(f,this);
  MSLIB.Common.initialise(this);
  this.fileType               = "xml";
  this.docRoot                = null;
 };
 
 _XmlFile.prototype.load = function() {
  MSLIB.Common.start(this);
  this.reader.readText(
   function() {
    this.Parent.docRoot = (new DOMParser()).parseFromString(this.result, "text/xml");
    MSLIB.Common.finish(this.parent);
   }
  );
 };

 _XmlFile._SOURCE = _SOURCE;

 return _XmlFile;

}();