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
 
 var Reader = function(F,Parent) {
  var R = new FileReader();
  if ((typeof(F) == 'object') && F.constructor === File) {
   R.File = F;
  }
  else {
   throw new Error("ReaderInvalidFileObject");
  }
  R.Parent = Parent;
  R.Position = 0;
  R.Report = false;
  R.readBinary = readBinary;
  R.readText = readText;
  R.Ready = true;
  R.Progress = 100;
  R.onprogress = function(e) { R.Progress = (e.lengthComputable ? (e.loaded/e.total)*100 : -1 ) };
  R.onerror = (function(e) { console.log("Reader ("+this.File.name+"): Error - "+this.error.name)}).bind(R);
  R.onabort = (function(e) { console.log("Reader ("+this.File.name+"): Aborted")}).bind(R);
  return R;
 };

 var getFileSlice = function(Pos,Len) {
  if (Pos >= this.File.size) {
   console.log("Error: Last valid file offset ("+(this.File.size-1)+") is before offset " + Pos);
   throw new Error("ReaderInvalidFileOffset");
  }
  else {
   var FS;
   if (Len && (Len < (this.File.size - Pos))) {
    FS = this.File.slice(Pos, Pos + Len);
    this.Position = Pos + Len;
   }
   else {
    FS = this.File.slice(Pos);
    this.Position = this.File.size;
   }
   return(FS);
  }
 }

 var readBinary = function(Callback,Pos,Len) {
  return readAs.call(this,this.readAsArrayBuffer,Callback,Pos,Len);
 }

 var readText = function(Callback,Pos,Len) {
  return readAs.call(this,this.readAsText,Callback,Pos,Len);
 }

 var readAs = function(Method,Callback,Pos,Len) {
  if (this.readyState == 1) throw new Error("ReaderNotReady");
  Pos = Pos > 0 ? Pos : 0;
  Len = Len > 0 ? Len : 0;
  if (this.Report) {
   if (this.LastReadStart) console.log("Reader ("+this.File.name+"): Current buffer is offsets "+this.LastReadStart+" to "+(this.LastReadEnd));
   console.log("Reader ("+this.File.name+"): Requested offsets "+Pos+" to "+(Len ? (Pos+Len) : this.File.size));
  }
  if (this.LastReadStart && (Pos >= this.LastReadStart) && ((Pos + Len) <= (this.LastReadEnd))) {
   this.Position = Pos + Len;
   var Pseudopos = Pos - this.LastReadStart;
   //Return a pseudo reader element contaning result, parent and position.  Can't call reader methods on it though (would require duplication)
   if (this.Report) console.log("Reader ("+this.File.name+"): Returning psuedo-offsets "+Pseudopos+" to "+(Pseudopos+Len));
   if (!this.Cache) this.Cache = this.result.slice(0); //speed up repeated access (Reader.result is slow to access)
   callAsync(Callback.bind({result: this.Cache.slice(Pseudopos, Pseudopos + Len), Parent: this.Parent, Position: this.Position}));
  }
  else {
   if (this.LastReadStart) {
    delete this.LastReadStart;
    delete this.LastReadEnd;
    delete this.Cache;
   }
   var FS = getFileSlice.call(this,Pos,Len);
   if (FS) {
    if (this.Report) console.log("Reader ("+this.File.name+"): New read of offsets "+Pos+" to "+this.Position);
    this.LastReadStart = Pos;
    this.LastReadEnd = Pos + Len;
    this.onloadend = Callback.bind(this);
    if (this.Report) console.log("Reader ("+this.File.name+"): Calling "+Method.name);
    Method.call(this,FS);
   }
   else {
    throw new Error("ReaderInvalidFileSlice");
   }
  }
 }

 var initialise = function() {
  this.Ready = true;
  this.Progress = 100;
  this.Report = false;
 }

 var starting = function() {
  this.Ready = false;
  this.Progress = 0;
 }

 var progress = function(p) {
  this.Progress = p;
 }

 var finished = function() {
  this.Ready = true;
  this.Progress = 100;
  if (this.onReady) { 
   var Func = this.onReady; 
   delete(this.onReady);
   Func();
  }
 }

 var whenReady = function(Obj,Func) {
  if (Obj.onReady) throw new Error("OnReadyFunctionExists");
  if (Obj.Ready) Func();
  else Obj.onReady = Func;
 }

 var getMSLIBWorkerURI = function(OnMessage,SelectCoreModules,ExtraModules,ExtraModuleNameSpaces) {
  return URL.createObjectURL(new Blob([
   getRecursiveSOURCE([MSLIB],["MSLIB"],SelectCoreModules).concat(getRecursiveSOURCE(ExtraModules,ExtraModuleNameSpaces),
    "self.addEventListener(\"message\","+OnMessage.toString()+");"
   ).join(";\n")
  ]));
 }

 var getRecursiveSOURCE = function(OArr,PArr,CArr) {
  if (!OArr) return [];
  else return [].concat.apply([],OArr.map((O,i) => {
   if (!O) return [];
   var Path = (PArr && PArr[i]);
   if (!Path) return [];
   var Declaration = (Path.indexOf(".") < 0 ? "var " : "")+Path+"=";
   if (O._SOURCE) return Declaration+O._SOURCE.toString()+"()";
   else return [].concat.apply([Declaration+"{}"],Object.keys(O).map((K) => (CArr && !CArr.find((E)=>(E==K))) ? [] : getRecursiveSOURCE([O[K]],[Path+"."+K],CArr)));
  }));
 }

 return {
  callAsync: callAsync,
  Reader: Reader,
  initialise: initialise,
  starting: starting,
  progress: progress,
  finished: finished,
  whenReady: whenReady,
  getMSLIBWorkerURI : getMSLIBWorkerURI,
  _SOURCE: _SOURCE
 }

}();