export let TextTableFile = function _SOURCE() {
 
 var _TextTableFile = function(f) {
  this.reader                 = new mslib.common.Reader(f,this);
  mslib.common.initialise(this);
  this.fileType               = "text_table";
  if (f.name.match(/\.csv$/i)) {
   this.delimiter = ",";
  }
  else if (f.name.match(/\.tsv$/i) || f.name.match(/\.txt$/i)) {
   this.delimiter = "\t";
  }
  else {
   this.delimiter = "";
  }
  this.useFirstLineAsHeaders  = false;
  this.headers                = [];
  this.lines                  = [];
 };
 
 _TextTableFile.prototype.load = function() {
  mslib.common.start(this);
  this.reader.readText(
   function() {
    var lines = this.result.replace(/\r\n?/gm,"\n").split("\n");
    while (!lines[lines.length-1].length) lines.pop(); // remove trailing blank lines
    lines.forEach(function(line,i) {
     mslib.common.progress(this.parent,((i/lines.length)*100).toFixed(2));
     if (this.parent.delimiter) {
      var splitarr = line.split(this.parent.delimiter);
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
      this.parent.lines.push(fields);
     }
     else {
      this.parent.lines.push([line]);
     }
    },this);
    if (this.parent.useFirstLineAsHeaders && this.parent.lines.length && !this.parent.headers.length) {
     this.parent.headers = this.parent.lines.shift();
    }
    mslib.common.finish(this.parent);
   }
  );
 };

 _TextTableFile._SOURCE = _SOURCE;

 return _TextTableFile;

}();