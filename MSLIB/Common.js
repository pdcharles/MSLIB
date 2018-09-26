"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
MSLIB.Common = function _SOURCE() {

 var waitUntil = function(tfunc,rfunc) {
  throw new Error("Error: waitUntil has been removed.  Re-factor to use window.setTimeout or MSLIB.Common.whenReady");
 }

 var callAsync = function(Func) {
  Promise.resolve().then(Func);
 }

 if (!(self.File && self.FileReader && self.Blob)) throw new Error("Reader requires full File API support");
 
 var Reader = function(file,parent) {

  var _reader = function(file,parent) {
   if ((typeof(file) == 'object') && file.constructor === File) this.file = file;
   else throw new Error("ReaderInvalidFileObject");
   initialise(this);
   this.parent = parent;
   this.position = 0;
   this.fileReader = new fileReaderWithEventHandles(this);
  }
  _reader.prototype.readBinary = function(callback,pos,len) {
   return readAs.call(this,this.fileReader.readAsArrayBuffer,callback,pos,len);
  }
  _reader.prototype.readText = function(callback,pos,len) {
   return readAs.call(this,this.fileReader.readAsText,callback,pos,len);
  }

  var fileReaderWithEventHandles = function(reader) {
   var fr = new FileReader();
   fr.onprogress = (function(e) { progress(this,(e.lengthComputable ? (e.loaded/e.total)*100 : -1 )) }).bind(reader);
   fr.onerror = function(e) { throw new Error("ReaderError") };
   if (reader.report) fr.onloadstart = (function(e) { console.log("Reader ("+this.file.name+"): Reading from file") }).bind(reader);
   return fr;
  }

  var getFileSlice = function(pos,len) {
   if (pos >= this.file.size) {
    console.log("Error: Last valid file offset ("+(this.file.size-1)+") is before offset " + pos);
    throw new Error("ReaderInvalidFileOffset");
   }
   else {
    var fs;
    if (len && (len < (this.file.size - pos))) {
     fs = this.file.slice(pos, pos + len);
     this.position = pos + len;
    }
    else {
     fs = this.file.slice(pos);
     this.position = this.file.size;
    }
    return(fs);
   }
  }
  var readAs = function(method,callback,pos,len) {
   if (this.fileReader.readyState == FileReader.LOADING) throw new Error("ReaderNotReady");
   pos = pos > 0 ? pos: 0;
   if (len <= 0) throw new Error("ReaderZeroLengthFileSlice");
   if (this.report) {
    console.log("Reader ("+this.file.name+"): Requested offsets "+pos+" to "+(len ? (pos+len) : this.file.size));
    if (this.lastReadStart) console.log("Reader ("+this.file.name+"): Current buffer is offsets "+this.lastReadStart+" to "+(this.lastReadEnd));
   }
   if (this.lastReadStart && (pos >= this.lastReadStart) && ((pos+len) <= (this.lastReadEnd))) {
    this.position = pos + len;
    var cachepos = pos - this.lastReadStart;
    if (this.report) console.log("Reader ("+this.file.name+"): Returning cache-offsets "+cachepos+" to "+(cachepos+len));
    if (!this.cache) {
     if (this.fileReader.result !== null) this.cache = this.fileReader.result.slice(0); //speed up repeated access (fileReader.result is slow to access)
     else throw new Error("ReaderResultIsNull")
    }
    callAsync(callback.bind(new ReaderResult(this.cache.slice(cachepos, cachepos + len),this.parent,this.position)));
   }
   else {
    if (this.lastReadStart) {
     delete this.lastReadStart;
     delete this.lastReadEnd;
     delete this.cache;
    }
    var fs = getFileSlice.call(this,pos,len);
    if (fs) {
     if (this.report) console.log("Reader ("+this.file.name+"): New read of offsets "+pos+" to "+this.position);
     this.lastReadStart = pos;
     this.lastReadEnd = pos + len;
     if (this.report) console.log("Reader ("+this.file.name+"): Calling "+method.name);
     startRead.call(this,method,fs,callback);
    }
    else {
     throw new Error("ReaderInvalidFileSlice");
    }
   }
  }
  var startRead = function(method,fs,callback) {
   this.fileReader.onload = finishRead.bind(this,callback);
   method.call(this.fileReader,fs)
  }

  var finishRead = function(callback) {
   if (this.report) console.log("Reader ("+this.file.name+"): Read Complete");
   callback.call(new ReaderResult(this.fileReader.result,this.parent,this.position));
  }

  return _reader;
 }();

 var ReaderResult = function(result,parent,position) {
  this.result = result;
  this.parent = parent;
  this.position = position;
 };

 var initialise = function(obj) {
  obj.ready = true;
  obj.progress = 100;
  obj.report = false;
 }

 var start = function(obj) {
  obj.ready = false;
  obj.progress = 0;
 }

 var progress = function(obj,p) {
  obj.progress = p;
 }

 var finish = function(obj) {
  obj.ready = true;
  obj.progress = 100;
  if (obj.onReady) { 
   var func = obj.onReady; 
   delete(obj.onReady);
   func();
  }
 }

 var whenReady = function(obj,func) {
  if (obj.onReady) throw new Error("OnReadyFunctionExists");
  if (obj.ready) func();
  else obj.onReady = func;
 }

 var getMSLIBWorkerURI = function(onMessage,coreModuleFilter,extraModules,extraModuleNamespaces,extraModuleFilters) {
  return URL.createObjectURL(new Blob([
   getRecursiveSOURCE([MSLIB],["MSLIB"],[coreModuleFilter]).concat(getRecursiveSOURCE(extraModules,extraModuleNamespaces,extraModuleFilters),
    "self.addEventListener(\"message\","+onMessage.toString()+");"
   ).join(";\n")
  ]));
 }

 var getRecursiveSOURCE = function(objects,namespaces,filter) {
  if (!objects) return [];
  else return [].concat.apply([],objects.map((o,i) => {
   if (!o) return [];
   var namespace = (namespaces && namespaces[i]);
   if (!namespace) return [];
   var declaration = (namespace.indexOf(".") < 0 ? "var " : "")+namespace+"=";
   if (o._SOURCE) return declaration+o._SOURCE.toString()+"()";
   else return [].concat.apply([declaration+"{}"],Object.keys(o).map((k) => (filter[i] && filter[i].length && !filter[i].find(e=>(e==k))) ? [] : getRecursiveSOURCE([o[k]],[namespace+"."+k],[filter[i]])));
  }));
 }

 return {
  callAsync: callAsync,
  Reader: Reader,
  initialise: initialise,
  start: start,
  progress: progress,
  finish: finish,
  whenReady: whenReady,
  getMSLIBWorkerURI : getMSLIBWorkerURI,
  _SOURCE: _SOURCE
 }

}();