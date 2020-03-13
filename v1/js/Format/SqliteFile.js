"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
if (typeof SQL) MSLIB.Format.SQLiteFile = function _SOURCE() {

 var _SQLiteFile = function(f) {
  if (!f) {
   console.log("Error: file path not specified");
   return {};
  }
  this.reader      = new MSLIB.Common.Reader(f,this);
  this.reader.onprogress = function(data) {
   if (data.lengthComputable) {                                            
    MSLIB.Common.progress(this,((data.loaded/data.total)*100).toFixed(2));
   }
  }
  MSLIB.Common.initialise(this);
  this.fileType    = "generic_sqlite";
  this.database    = {};
  this.query       = {sql: "", result: {}};
 };

 _SQLiteFile.prototype.openDB = function() {
  MSLIB.Common.start(this);
  this.Reader.readBinary(
   function() {
    this.parent.database = new SQL.Database(new Uint8Array(this.result));
    MSLIB.Common.finished.call(this.parent);
   }
  );
 }

 _SQLiteFile.prototype.queryDB = function(q) {
  if (!this.ready) return("SQLiteFileNotReady");
  if (!this.database) return("SQLiteFileDatabaseNotOpen");
  MSLIB.Common.start(this);
  this.query.sql = q.replace(/\n/g, '; ');
  MSLIB.Common.callAsync(function() {
    this.query.result = {};
    try {
     var jsondata = this.database.exec(this.query.SQL);
     this.query.result.columns = jsondata[0]["columns"];
     this.query.result.data = jsondata[0]["values"];
    } 
    catch(err) {
     console.log("Error: " + err);
    }
    MSLIB.Common.finished.call(this);
   }).bind(this)
  );
 };

 _SQLiteFile._SOURCE = _SOURCE;

 return _SQLiteFile;

}();

else throw new Error("SQLiteFileNoSQL");
