"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
MSLIB.Common = function _SOURCE(){

 var WaitStack = [];
 var waitUntil = function(tfunc,rfunc) {
  WaitStack.push([tfunc,rfunc])
  if (self.document === undefined) self.postMessage("WaitUntilPing");
  else self.postMessage("WaitUntilEcho", "*");
 }

 self.addEventListener("message", function(e) {
  if (e.data == "WaitUntilEcho") {
   e.stopImmediatePropagation();
   if (WaitStack.length > 0) {
    var args = WaitStack.shift();
    if (args[0]()) args[1]();
    else {
     WaitStack.push([args[0],args[1]])
     if (self.document === undefined) self.postMessage("WaitUntilPing");
     else self.postMessage("WaitUntilEcho", "*");
    }
   }
  }
 });

 if (!(self.File && self.FileReader && self.Blob)) console.log("Warning: Reader requires full File API support!");
 
 var Reader = function(f,parent) {
  var r = new FileReader();
  if ((typeof(f) == 'object') && f.constructor === File) {
   r.File = f;
  }
  else {
   throw new Error("ReaderInvalidFileObject");
  }
  r.Parent = parent;
  r.Position = 0;
  r.Report = false;
  r.readBinary = readBinary;
  r.readText = readText;
  r.Progress = 0;
  r.onprogress = function(e) { r.Progress = (e.lengthComputable ? (e.loaded/e.total)*100 : -1 ) };
  r.onerror = (function(e) { console.log("Reader ("+this.File.name+"): Error - "+this.error.name)}).bind(r);
  r.onabort = (function(e) { console.log("Reader ("+this.File.name+"): Aborted")}).bind(r);
  return r;
 };

 var getFileSlice = function(pos,len) {
  if (pos >= this.File.size) {
   console.log("Error: Last valid file offset ("+(this.File.size-1)+") is before offset " + pos);
   throw new Error("ReaderInvalidFileOffset");
  }
  else {
   var fS;
   if (len && (len < (this.File.size - pos))) {
    fS = this.File.slice(pos, pos + len);
    this.Position = pos + len;
   }
   else {
    fS = this.File.slice(pos);
    this.Position = this.File.size;
   }
   return(fS);
  }
 }

 var readBinary = function(callback,pos,len) {
  return readAs.call(this,this.readAsArrayBuffer,callback,pos,len);
 }

 var readText = function(callback,pos,len) {
  return readAs.call(this,this.readAsText,callback,pos,len);
 }

 var readAs = function(method,callback,pos,len) {
  self.readAs=[pos,len,this.readyState];
  if (this.readyState == 1) throw new Error("ReaderNotReady");
  pos = pos > 0 ? pos : 0;
  len = len > 0 ? len : 0;
  if (this.Report) {
   if (this.LastReadStart) console.log("Reader ("+this.File.name+"): Current buffer is offsets "+this.LastReadStart+" to "+(this.LastReadEnd));
   console.log("Reader ("+this.File.name+"): Requested offsets "+pos+" to "+(len ? (pos+len) : this.File.size));
  }
  if (this.LastReadStart && (pos >= this.LastReadStart) && ((pos + len) <= (this.LastReadEnd))) {
   this.Position = pos + len;
   var pseudopos = pos - this.LastReadStart;
   //Return a pseudo reader element contaning result, parent and position.  Can't call reader methods on it though (would require duplication)
   if (this.Report) console.log("Reader ("+this.File.name+"): Returning psuedo-offsets "+pseudopos+" to "+(pseudopos+len));
   if (!this.Cache) this.Cache = this.result.slice(0); //speed up repeated access (Reader.result is slow to access)
   waitUntil(() => true,callback.bind({result: this.Cache.slice(pseudopos, pseudopos + len), Parent: this.Parent, Position: this.Position}));
  }
  else {
   if (this.LastReadStart) {
    delete this.LastReadStart;
    delete this.LastReadEnd;
    delete this.Cache;
   }
   var fS = getFileSlice.call(this,pos,len);
   if (fS) {
    if (this.Report) console.log("Reader ("+this.File.name+"): New read of offsets "+pos+" to "+this.Position);
    this.LastReadStart = pos;
    this.LastReadEnd = pos + len;
    this.onloadend = callback.bind(this);
    if (this.Report) console.log("Reader ("+this.File.name+"): Calling "+method.name);
    method.call(this,fS);
   }
   else {
    throw new Error("ReaderInvalidFileSlice");
   }
  }
 }

 var starting = function() {
  this.Ready = false;
  this.Progress = 0;
 }

 var finished = function() {
  this.Ready = true;
  this.Progress = 100;
 }

 var getMSLIBWorkerURI = function(OnMessage,SelectCoreModules,ExtraModules,ExtraModuleNameSpaces) {
  return URL.createObjectURL(new Blob([
   recursiveSOURCE([MSLIB],["MSLIB"],SelectCoreModules).concat(recursiveSOURCE(ExtraModules,ExtraModuleNameSpaces),
    "self.addEventListener(\"message\","+OnMessage.toString()+");"
   ).join(";\n")
  ]));
 }

 var recursiveSOURCE = function(oArr,pArr,cArr) {
  if (!oArr) return [];
  else return [].concat.apply([],oArr.map((o,i) => {
   if (!o) return [];
   var path = (pArr && pArr[i]);
   if (!path) return [];
   var declaration = (path.indexOf(".") < 0 ? "var " : "")+path+"=";
   if (o._SOURCE) return declaration+o._SOURCE.toString()+"()";
   else return [].concat.apply([declaration+"{}"],Object.keys(o).map((k) => (cArr && !cArr.find((e)=>(e==k))) ? [] : recursiveSOURCE([o[k]],[path+"."+k],cArr)));
  }));
 }

 var MSLIBWorker = function(uri) {
  var worker = new Worker(uri);
  worker.addEventListener("message", function(e) {
   if (e.data == "WaitUntilPing") {
    e.stopImmediatePropagation();
    worker.postMessage("WaitUntilEcho");
   }
   else if ((e.data[0] == "Ready") || (e.data[0] == "Progress")) {
    e.stopImmediatePropagation();
    worker[e.data[0]] = e.data[1]
   }
  });
  return worker;
 }

 return {
  waitUntil: waitUntil,
  Reader: Reader,
  starting: starting,
  finished: finished,
  getMSLIBWorkerURI : getMSLIBWorkerURI,
  MSLIBWorker: MSLIBWorker,
  _SOURCE: _SOURCE
 }

}();