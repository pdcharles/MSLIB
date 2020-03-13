export let SqliteFile = function _SOURCE() {

 if (typeof SQL === 'undefined') throw new Error("SqliteFileNoSQL");

 var _SqliteFile = function(f) {
  if (!f) {
   console.log("Error: file path not specified");
   return {};
  }
  this.reader      = new mslib.common.Reader(f,this);
  this.reader.onprogress = function(data) {
   if (data.lengthComputable) {                                            
    mslib.common.progress(this,((data.loaded/data.total)*100).toFixed(2));
   }
  }
  mslib.common.initialise(this);
  this.fileType    = "generic_sqlite";
  this.database    = {};
  this.query       = {sql: "", result: {}};
 };

 _SqliteFile.prototype.openDB = function() {
  mslib.common.start(this);
  this.Reader.readBinary(
   function() {
    this.parent.database = new SQL.Database(new Uint8Array(this.result));
    mslib.common.finished.call(this.parent);
   }
  );
 }

 _SqliteFile.prototype.queryDB = function(q) {
  if (!this.ready) return("SqliteFileNotReady");
  if (!this.database) return("SqliteFileDatabaseNotOpen");
  mslib.common.start(this);
  this.query.sql = q.replace(/\n/g, '; ');
  mslib.common.callAsync(function() {
   this.query.result = {};
   try {
    var jsondata = this.database.exec(this.query.SQL);
    this.query.result.columns = jsondata[0]["columns"];
    this.query.result.data = jsondata[0]["values"];
   } 
   catch(err) {
    console.log("Error: " + err);
   }
   mslib.common.finished.call(this);
  }).bind(this)
 };

 _SqliteFile._SOURCE = _SOURCE;

 return _SqliteFile;

}();