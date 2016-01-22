"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
if (typeof SQL) MSLIB.Format.SQLiteFile = function() {

 var SQLiteFile = function(f) {
  if (!f) {
   console.log("Error: file path not specified");
   return {};
  }
  this.Reader      = new MSLIB.Common.Reader(f,this);
  this.Reader.onprogress = function(data) {
   if (data.lengthComputable) {                                            
    this.Progress = ((data.loaded/data.total)*100).toFixed(2));
   }
  }
  this.Ready       = true;
  this.Progress    = 100;
  this.Report      = false;
  this.FileType    = "generic_sqlite";
  this.Database    = {};
  this.Query       = {SQL: "", Result: {}};
 };

 SQLiteFile.prototype.openDB = function() {
  MSLIB.Common.Starting.call(this);
  this.LastError = this.Reader.readBinary(
   function() {
    this.Parent.Database = new SQL.Database(new Uint8Array(this.result));
    MSLIB.Common.Finished.call(this.Parent);
   },
   0
  );
 }

 SQLiteFile.prototype.queryDB = function(q) {
  if (!this.Ready) return("SQLiteFileNotReady");
  if (!this.Database) return("SQLiteFileDatabaseNotOpen");
  MSLIB.Common.Starting.call(this);
  this.Query.SQL = q.replace(/\n/g, '; ');
  MSLIB.Common.WaitUntil(function() {return true}, (function() {
    this.Query.Result = {};
    try {
     var jsondata = this.Database.exec(this.Query.SQL);
     this.Query.Result.Columns = jsondata[0]["columns"];
     this.Query.Result.Data = jsondata[0]["values"];
    } 
    catch(err) {
     console.log("Error: " + err);
    }
    MSLIB.Common.Finished.call(this);
   }).bind(this)
  );
 };

 return SQLiteFile;

}();

else console.log("Warning: SQLiteFile requires SQL library!");
