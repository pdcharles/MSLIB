export let XmlFile = function _SOURCE() {
 
 var _XmlFile = function(f) {
  this.reader                 = new mslib.common.Reader(f,this);
  mslib.common.initialise(this);
  this.fileType               = "xml";
  this.docRoot                = null;
 };
 
 _XmlFile.prototype.load = function() {
  mslib.common.start(this);
  this.reader.readText(
   function() {
    this.Parent.docRoot = (new DOMParser()).parseFromString(this.result, "text/xml");
    mslib.common.finish(this.parent);
   }
  );
 };

 _XmlFile._SOURCE = _SOURCE;

 return _XmlFile;

}();