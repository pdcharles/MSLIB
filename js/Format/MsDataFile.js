"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.MsDataFile = function _SOURCE() {

 var _MsDataFile = function(file) {
  if (file) {
   this.reader     = new MSLIB.Common.Reader(file,this);
  }
  else {
   this.reader     = null;
  }
  MSLIB.Common.initialise(this);
  this.fileType    = null;
  this.scans       = [];
  this.internal    = {offsets: {}, minutes: []};
  this.currentScan = new MSLIB.Data.Scan();
 };

 _MsDataFile.prototype.getFirstScanNumber = function() {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  var s = this.scans.findIndex((ele) => (typeof(ele) != 'undefined'));
  return (s >= 0 ? s : null);
 };
 
 _MsDataFile.prototype.getLastScanNumber = function() {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  return(this.scans.length-1);
 };
 
 _MsDataFile.prototype.getPreviousScanNumber = function(s,msLevel) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if ((typeof(s) === 'undefined') && (typeof(this.currentScan.scanNumber) != 'undefined')) s = this.currentScan.scanNumber;
  var firstScan = this.getFirstScanNumber();
  if (!firstScan || (s <= firstScan)) return null;
  if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
   if (this.scans[s]) return(this.scans[s].previous || null);
   else return(null);
  }
  else {
   do { s = this.getPreviousScanNumber(s) } while ((this.scans[s].scanData[1] != msLevel) && (s > firstScan));
   if (this.scans[s].scanData[1] == msLevel) return(s);
   else return(null);
  }
 };
 
 _MsDataFile.prototype.getNextScanNumber = function(s,msLevel) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if ((typeof(s) === 'undefined') && (typeof(this.currentScan.scanNumber) != 'undefined')) s = this.currentScan.scanNumber;
  var lastScan = this.getLastScanNumber();
  if (!lastScan || s >= lastScan) return(null);
  if ((typeof(msLevel) === 'undefined') || isNaN(msLevel) || !Number.isInteger(msLevel) || (msLevel < 1)) {
   if (this.scans[s]) return(this.scans[s].next || null);
   else return(null);
  }
  else {
   do { s = this.getNextScanNumber(s); } while ((this.scans[s].scanData[1] != msLevel) && (s < lastScan));
   if (this.scans[s].scanData[1] == msLevel) return(s);
   else return(null);
  }
 };

 var populateMinutes = function() {
  this.scans.forEach(function(ele) {
   if (ele.scanData[1]) {
    var minute = Math.round(ele.scanData[2]);
    if (!this.internal.minutes[minute]) {
     this.internal.minutes[minute] = [];
    }
    this.internal.minutes[minute].push(ele.scanData[0]);
   }
  },this);
 }

 _MsDataFile.prototype.getNearestMSXScanNumberfromRT = function(msLevel,retentionTime,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  if (!this.internal.minutes.length) populateMinutes.call(this);
  var S = this.scans; // can't use thisArg in sorts
  var ms1ScanNumbers = S.filter((ele) => (ele.scanData[1] == msLevel)).map((ele) => ele.scanData[0]);
  var firstMSXRT = S[ms1ScanNumbers[0]].scanData[2];
  var lastMSXRT = S[ms1ScanNumbers[ms1ScanNumbers.length-1]].scanData[2];
  if (retentionTime <= firstMSXRT) { return ms1ScanNumbers[0] };
  if (retentionTime >= lastMSXRT) { return ms1ScanNumbers[ms1ScanNumbers.length-1] };
  var minute = Math.round(retentionTime);
  if (!this.internal.minutes[minute]) {
   console.log("Cannot localise RT "+retentionTime);
   throw new Error("MsDataFileCannotLocaliseRT");
  }
  var possibles = this.internal.minutes[minute].filter((p) => (S[p].scanData[1] == msLevel));
  //check for exact match
  var exactMatch = possibles.find((p) => (S[p].scanData[2] == retentionTime));
  if (exactMatch) { return exactMatch }
  else {
   //Otherwise find closest match
   var firstRTMinute = Math.round(firstMSXRT);
   var lastRTMinute = Math.round(lastMSXRT);
   var range = 0;
   do {
    range++;
    var minuteToAdd = minute + (matchLow ? -range : range);
    if ((minuteToAdd < firstRTMinute) || (minuteToAdd > lastRTMinute)) {
     return null;
    }
    possibles = possibles.concat(this.internal.minutes[minuteToAdd].filter((p) => (S[p].scanData[1] == msLevel)) || []);
   } while (possibles.length < 1);
   var m;
   if (matchLow) {
    possibles.sort((a,b) => (S[b].scanData[2]-S[a].scanData[2]));
    m = possibles.find((p) => (S[p].scanData[2] < retentionTime));
   }
   else {
    possibles.sort((a,b) => (S[a].scanData[2]-S[b].scanData[2]));
    m = possibles.find((p) => (S[p].scanData[2] > retentionTime));
   }
   return typeof(m) != "undefined" ? m : null;
  }
 }

 _MsDataFile.prototype.getNearestMSXRTfromRT = function(msLevel,retentionTime,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  var s = this.getNearestMSXScanNumberfromRT(msLevel,retentionTime,matchLow);
  return(s != null ? this.scans[s].scanData[2]: null);
 }
 
 _MsDataFile.prototype.getNearestMSXScanNumberfromScanNumber = function(msLevel,s,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  var firstScan = this.getFirstScanNumber();
  if (!this.scans[s]) { //e.g. Might be an MS2+ and the mzFile only has MS1
   while(--s >= firstScan) { if (this.scans[s]) break };
  };
  if (!this.scans[s]) return(null); //Still couldn't find the scan
  if (this.scans[s].scanData[1] == msLevel) return(s);
  if (matchLow) return(this.getPreviousScanNumber(s,msLevel));
  else return(this.getNextScanNumber(s,msLevel));
 }

 _MsDataFile.prototype.getNearestMSXRTfromScanNumber = function(msLevel,s,matchLow) {
  if (!this.scans.length) throw new Error("MsDataFileNoScans");
  s = this.getNearestMSXScanNumberfromScanNumber(msLevel,s,matchLow);
  return(s != null ? this.scans[s].scanData[2] : null);
 }

 //Async PlaceHolders

 _MsDataFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 _MsDataFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 _MsDataFile.prototype.fetchAllScanHeaders = function() {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 _MsDataFile.prototype.fetchSpectrumData = function() {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 _MsDataFile._SOURCE = _SOURCE;

 return _MsDataFile;

}();