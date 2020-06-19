export let common = function _SOURCE() {

 let workerPool = [];
 let taskQueue = [];
 globalThis.wp = workerPool; //for monitoring
 globalThis.tq = taskQueue; //for monitoring

 let initWorker = function(coreModuleFilter,extraModules,extraModuleNamespaces,extraModuleFilters) {
  let w = new Worker(getMslibWorkerURI(e => globalThis.postMessage(eval(e.data.shift())(...e.data)),...arguments));
  w.addEventListener("message", (e) => {
   if (e.data) w.resolve(e.data);
   else w.reject(e);
   if (taskQueue.length) {
    let [payload,resolve,reject] = taskQueue.shift()
    w.resolve = resolve;
    w.reject = reject;
    w.postMessage(payload);     
   }
   else w.ready = true; 
  },false);
  w.ready = true;
  workerPool.push(w);
 }

 let initWorkers = function(n) {
  let len;
  do {
   len = workerPool.length;
   initWorker();
  } while( len < workerPool.length && len < n);
  return len;
 }

 let killWorker = function(i) {
  i = i || 0;
  workerPool[i].terminate();
  workerPool.splice(i,1);
 }

 let performTask = function(payload) {
  return new Promise((resolve,reject) => {
   if (workerPool.length) {
    let freeWorker = workerPool.find(w => w.ready);
    if (freeWorker) {
     freeWorker.ready = false;
     freeWorker.resolve = resolve;
     freeWorker.reject = reject;
     freeWorker.postMessage(payload);
    }
    else {
     taskQueue.push([payload,resolve,reject]);
    }
   }
   else {
    resolve(eval(payload.shift())(...payload));
   } 
  })
 }

 let getMslibWorkerURI = function(onMessage,coreModuleFilter,extraModules,extraModuleNamespaces,extraModuleFilters) {
  return URL.createObjectURL(new Blob([
   getRecursiveSOURCE([mslib],["mslib"],[coreModuleFilter]).concat(getRecursiveSOURCE(extraModules,extraModuleNamespaces,extraModuleFilters),
    "globalThis.addEventListener(\"message\","+onMessage.toString()+");"
   ).join(";\n")
  ]));
 }

 let getRecursiveSOURCE = function(objects,namespaces,filter) {
  if (!objects) return [];
  else return [].concat.apply([],objects.map((o,i) => {
   if (!o) return [];
   let namespace = (namespaces && namespaces[i]);
   if (!namespace) return [];
   let declaration = (namespace.includes(".") ? "let " : "")+namespace+"=";
   if (o._SOURCE) return declaration+o._SOURCE.toString()+"()";
   else return [].concat.apply([declaration+"{}"],
                               Object.keys(o)
                               .sort()
                               .sort((a,b) => {
                                if (typeof(o[a]._SOURCE) == typeof(o[b]._SOURCE)) return 0;
                                else if (o[a]._SOURCE) return 1;
                                else return -1;
                               })
                               .map((k) => (filter[i] && filter[i].length && !filter[i].find(e=>(e==k))) ? [] : getRecursiveSOURCE([o[k]],[namespace+"."+k],[filter[i]])));
  }));
 }

 let callAsync = function(func) {  //To be removed when everything works as a Promise
  Promise.resolve().then(func);
 }

 if (!(globalThis.File && globalThis.FileReader && globalThis.Blob)) throw new Error("Reader requires full File API support");
 
 let Reader = function(file,parent) {

  let _reader = function(file,parent) {
   if ((typeof(file) == 'object') && file.constructor === File) this.file = file;
   else throw new Error("ReaderInvalidFileObject");
   initialise(this);
   this.parent = parent;
   this.position = 0;
   this.fileReader = new fileReaderWithEventHandles(this);
  }
  _reader.prototype.readBinary = function(pos,len) {
   return readAs.call(this,this.fileReader.readAsArrayBuffer,pos,len);
  }
  _reader.prototype.readText = function(pos,len) {
   return readAs.call(this,this.fileReader.readAsText,pos,len);
  }

  let fileReaderWithEventHandles = function(reader) {
   let fr = new FileReader();
   fr.onprogress = (function(e) { progress(this,(e.lengthComputable ? (e.loaded/e.total)*100 : -1 )) }).bind(reader);
   fr.onerror = function(e) { throw new Error("ReaderError") };
   if (reader.report) fr.onloadstart = (function(e) { console.log("Reader ("+this.file.name+"): Reading from file") }).bind(reader);
   return fr;
  }

  let getFileSlice = function(pos,len) {
   if (pos >= this.file.size) {
    console.log("Error: Last valid file offset ("+(this.file.size-1)+") is before offset " + pos);
    throw new Error("ReaderInvalidFileOffset");
   }
   else {
    let fs,newPos;
    if (len && (len < (this.file.size - pos))) {
     fs = this.file.slice(pos, pos + len);
     newPos = pos + len;
    }
    else {
     fs = this.file.slice(pos);
     newPos = this.file.size;
    }
    return([fs,newPos]);
   }
  }

  let readAs = function(method,pos,len) {
   return new Promise((resolve) => {
    if (this.fileReader.readyState == FileReader.LOADING) throw new Error("ReaderNotReady");
    pos = pos > 0 ? pos: 0;
    if (len <= 0) throw new Error("ReaderZeroLengthFileSlice");
    if (this.report) {
     console.log("Reader ("+this.file.name+"): Requested offsets "+pos+" to "+(len ? (pos+len) : this.file.size));
     if (this.lastReadStart) console.log("Reader ("+this.file.name+"): Current buffer is offsets "+this.lastReadStart+" to "+(this.lastReadEnd));
    }
    if (this.lastReadStart && (pos >= this.lastReadStart) && ((pos+len) <= (this.lastReadEnd))) {
     let cachepos = pos - this.lastReadStart;
     if (this.report) console.log("Reader ("+this.file.name+"): Returning cache-offsets "+cachepos+" to "+(cachepos+len));
     if (!this.cache) {
      if (this.fileReader.result !== null) this.cache = this.fileReader.result.slice(0); //speed up repeated access (fileReader.result is slow to access)
      else throw new Error("ReaderResultIsNull")
     }
     this.position = pos + len;
     resolve(this.cache.slice(cachepos, cachepos + len));
    }
    else {
     if (this.lastReadStart) {
      delete this.lastReadStart;
      delete this.lastReadEnd;
      delete this.cache;
     }
     let [fs,newPos] = getFileSlice.call(this,pos,len);
     if (fs) {
      this.lastReadStart = pos;
      this.position = this.lastReadEnd = newPos;
      if (this.report) console.log("Reader ("+this.file.name+"): New read of offsets "+this.lastReadStart+" to "+this.lastReadEnd);
      if (this.report) console.log("Reader ("+this.file.name+"): Calling "+method.name);
      this.fileReader.onload = (r) => resolve(this.fileReader.result);
      method.call(this.fileReader,fs)
     }
     else {
      throw new Error("ReaderInvalidFileSlice");
     }
    }
   });
  }
  return _reader;
 }();

 let initialise = function(obj) {
  obj.ready = true;
  obj.progress = 100;
  obj.report = false;
 }

 let start = function(obj) {
  obj.ready = false;
  obj.progress = 0;
 }

 let progress = function(obj,p) {
  obj.progress = p;
 }

 let finish = function(obj) {
  obj.ready = true;
  obj.progress = 100;
  if (obj.onReady) { 
   let func = obj.onReady; 
   delete(obj.onReady);
   func();
  }
 }

 let whenReady = function(obj,func) {
  if (obj.onReady) throw new Error("OnReadyFunctionExists");
  if (obj.ready) func();
  else obj.onReady = func;
 }

 return {
  performTask : performTask,
  initWorker : initWorker,
  initWorkers : initWorkers,
  killWorker : killWorker,
  callAsync: callAsync,
  Reader: Reader,
  initialise: initialise,
  start: start,
  progress: progress,
  finish: finish,
  whenReady: whenReady,
  getMslibWorkerURI : getMslibWorkerURI,
  _SOURCE: _SOURCE
 }

}();