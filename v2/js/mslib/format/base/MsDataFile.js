export let MsDataFile = function _SOURCE() {

 let _MsDataFile = function(file) {
  if (file) {
   this.reader     = new mslib.common.Reader(file,this);
  }
  else {
   this.reader     = null;
  }
  mslib.common.initialise(this);
  this.fileType    = null;
  this.scans       = [];
  this.internal    = { offsets : {}, minutes : [], firstScan : null, lastScan : null };
  this.currentScanNumber = null;
  this.currentScanSpectrum = null;
 };

 _MsDataFile.prototype.setCurrentScanNumber = function(sNum) {
  if (this.currentScanNumber != sNum) {
   this.currentScanSpectrum = null;
   if (this.scans[sNum]) this.currentScanNumber = sNum;
  }
 };

 _MsDataFile.prototype.getFirstScanNumber = function() {
  if (this.internal.firstScan) return this.internal.firstScan;
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  let s = this.scans.findIndex((scan) => (typeof(scan) != 'undefined'));
  s = (s >= 0 ? s : null);
  return this.internal.firstScan = s;
 };
 
 _MsDataFile.prototype.getLastScanNumber = function() {
  if (this.internal.lastScan) return this.internal.lastScan;
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  let s = (this.scans.length-1) - [...this.scans].reverse().findIndex((scan) => (typeof(scan) != 'undefined'));
  s = (s >= 0 ? s : null);
  return this.internal.lastScan = s;
 };
 
 _MsDataFile.prototype.getPreviousScanNumber = function(sNum,msLevel) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if ((typeof(sNum) === 'undefined')) sNum = this.currentScanNumber;
  let firstScan = this.getFirstScanNumber();
  if (!firstScan || (sNum <= firstScan)) return null;
  if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
   if (this.scans[sNum]) return(this.scans[sNum].previous || null);
   else return(null);
  }
  else {
   do { sNum = this.getPreviousScanNumber(sNum) } while ((this.scans[sNum].msLevel != msLevel) && (sNum > firstScan));
   if (this.scans[sNum].msLevel == msLevel) return(sNum);
   else return(null);
  }
 };
 
 _MsDataFile.prototype.getNextScanNumber = function(sNum,msLevel) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if ((typeof(s) === 'undefined')) sNum =  this.currentScanNumber;
  let lastScan = this.getLastScanNumber();
  if (!lastScan || sNum >= lastScan) return(null);
  if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
   if (this.scans[sNum]) return(this.scans[sNum].next || null);
   else return(null);
  }
  else {
   do { sNum = this.getNextScanNumber(sNum); } while ((this.scans[sNum].msLevel != msLevel) && (sNum < lastScan));
   if (this.scans[sNum].msLevel == msLevel) return(sNum);
   else return(null);
  }
 };

 let populateMinutes = function() {
  this.scans.forEach(function(scan,sNum) {
   if (scan.msLevel) {
    let minute = Math.round(scan.retentionTime);
    if (!this.internal.minutes[minute]) {
     this.internal.minutes[minute] = [];
    }
    this.internal.minutes[minute].push(sNum);
   }
  },this);
 }

 _MsDataFile.prototype.getAllMSXScans = function(msLevel) {
  return this.scans.reduce((acc,scan,i) => { if (scan.msLevel == msLevel) acc.push(i); return acc },[])
 }

 _MsDataFile.prototype.getNearestMSXScanNumberfromRT = function(msLevel,retentionTime,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if (!this.internal.minutes.length) populateMinutes.call(this);
//  let S = this.scans; // can't use thisArg in sorts
  let ms1ScanNumbers = this.scans.getAllMSXScans(1)
  let firstMSXRT = this.scans[ms1ScanNumbers[0]].retentionTime;
  let lastMSXRT = this.scans[ms1ScanNumbers[ms1ScanNumbers.length-1]].retentionTime;
  if (retentionTime <= firstMSXRT) { return ms1ScanNumbers[0] };
  if (retentionTime >= lastMSXRT) { return ms1ScanNumbers[ms1ScanNumbers.length-1] };
  let minute = Math.round(retentionTime);
  if (!this.internal.minutes[minute]) {
   console.log("Cannot localise RT "+retentionTime);
   throw new Error("MsDataFileCannotLocaliseRT");
  }
  let possibles = this.internal.minutes[minute].filter((p) => (this.scans[p].msLevel == msLevel));
  //check for exact match
  let exactMatch = possibles.find((p) => (this.scans[p].retentionTime == retentionTime));
  if (exactMatch) { return exactMatch }
  else {
   //Otherwise find closest match
   let firstRTMinute = Math.round(firstMSXRT);
   let lastRTMinute = Math.round(lastMSXRT);
   let range = 0;
   do {
    range++;
    let minuteToAdd = minute + (matchLow ? -range : range);
    if ((minuteToAdd < firstRTMinute) || (minuteToAdd > lastRTMinute)) {
     return null;
    }
    possibles = possibles.concat(this.internal.minutes[minuteToAdd].filter((p) => (this.scans[p].msLevel == msLevel)) || []);
   } while (possibles.length < 1);
   let m;
   if (matchLow) {
    possibles.sort((a,b) => (this.scans[b].retentionTime-this.scans[a].retentionTime));
    m = possibles.find((p) => (this.scans[p].retentionTime < retentionTime));
   }
   else {
    possibles.sort((a,b) => (this.scans[a].retentionTime-this.scans[b].retentionTime));
    m = possibles.find((p) => (this.scans[p].retentionTime > retentionTime));
   }
   return typeof(m) != "undefined" ? m : null;
  }
 }

 _MsDataFile.prototype.getNearestMSXRTfromRT = function(msLevel,retentionTime,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  let sNum = this.getNearestMSXScanNumberfromRT(msLevel,retentionTime,matchLow);
  return(sNum != null ? this.scans[sNum].retentionTime : null);
 }
 
 _MsDataFile.prototype.getNearestMSXScanNumberfromScanNumber = function(msLevel,sNum,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  let firstScan = this.getFirstScanNumber();
  if (!this.scans[sNum]) { //e.g. Might be an MS2+ and the mzFile only has MS1
   while(--sNum >= firstScan) { if (this.scans[sNum]) break };
  };
  if (!this.scans[sNum]) return(null); //Still couldn't find the scan
  if (this.scans[sNum].msLevel == msLevel) return(sNum);
  if (matchLow) return(this.getPreviousScanNumber(sNum,msLevel));
  else return(this.getNextScanNumber(sNum,msLevel));
 }

 _MsDataFile.prototype.getNearestMSXRTfromScanNumber = function(msLevel,sNum,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  sNum = this.getNearestMSXScanNumberfromScanNumber(msLevel,sNum,matchLow);
  return(sNum != null ? this.scans[sNum].retentionTime : null);
 }

 //Async PlaceHolders

 _MsDataFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
  return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
 }

 _MsDataFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
 }

 _MsDataFile.prototype.fetchAllScanHeaders = function() {
  return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
 }

 _MsDataFile.prototype.fetchSpectrum = function() {
  return new Promise((resolve,reject) => reject(new Error("MsDataFileFunctionNotImplemented")));
 }

 _MsDataFile._SOURCE = _SOURCE;

 return _MsDataFile;

}();