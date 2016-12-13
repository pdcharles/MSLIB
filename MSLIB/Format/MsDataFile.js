"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.MsDataFile = function _SOURCE() {

 var MsDataFile = function(f) {
  if (f) {
   this.Reader     = new MSLIB.Common.Reader(f,this);
  }
  else {
   this.Reader     = null;
  }
  this.Ready       = true;
  this.Progress    = 100;
  this.Report      = false;
  this.FileType    = null;
  this.Scans       = [];
  this.Internal    = {Offsets: {}, Minutes: []};
  this.CurrentScan = new MSLIB.Data.Scan();
 };

 MsDataFile.prototype.getFirstScanNumber = function() {
  if (this.Scans.length) {
   var s = this.Scans.findIndex((ele) => (typeof(ele) != 'undefined'));
   return (s >= 0 ? s : null);
  }
  else {
   return(null);
  }
 };
 
 MsDataFile.prototype.getLastScanNumber = function() {
  if (this.Scans.length) {
   return(this.Scans.length-1);
  }
  else {
   return(null);
  }
 };
 
 MsDataFile.prototype.getPreviousScanNumber = function(s,mslevel) {
  if ((typeof(s) === 'undefined') && (typeof(this.CurrentScan.ScanNumber) != 'undefined')) s = this.CurrentScan.ScanNumber;
  if ((typeof(mslevel) === 'undefined') || isNaN(mslevel) || !Number.isInteger(mslevel) || (mslevel < 1)) {
   if (this.Scans.length && this.Scans[s]) return(this.Scans[s].Previous || null);
   else return(null);
  }
  else {
   var FirstScan = this.getFirstScanNumber();
   do { s = this.getPreviousScanNumber(s) } while ((this.Scans[s].Scan.MsLevel != mslevel) && (s > FirstScan));
   if (this.Scans[s].Scan.MsLevel == mslevel) return(s);
   else return(null);
  }
 };
 
 MsDataFile.prototype.getNextScanNumber = function(s,mslevel) {
  if ((typeof(s) === 'undefined') && (typeof(this.CurrentScan.ScanNumber) != 'undefined')) s = this.CurrentScan.ScanNumber;
  if ((typeof(mslevel) === 'undefined') || isNaN(mslevel) || !Number.isInteger(mslevel) || (mslevel < 1)) {
   if (this.Scans.length && this.Scans[s]) return(this.Scans[s].Next || null);
   else return(null);
  }
  else {
   var LastScan = this.getLastScanNumber();
   do { s = this.getNextScanNumber(s); } while ((this.Scans[s].Scan.MsLevel != mslevel) && (s < LastScan));
   if (this.Scans[s].Scan.MsLevel == mslevel) return(s);
   else return(null);
  }
 };

 var populateMinutes = function() {
  this.Scans.forEach(function(ele) {
   if (ele.Scan.RetentionTime) {
    var minute = Math.round(ele.Scan.RetentionTime);
    if (!this.Internal.Minutes[minute]) {
     this.Internal.Minutes[minute] = [];
    }
    this.Internal.Minutes[minute].push(ele.Scan.ScanNumber);
   }
  },this);
 }

 MsDataFile.prototype.getNearestMSXScanNumberfromRT = function(mslevel,retention_time,match_low) {
  if (!this.Ready) return null;
  if (!this.Internal.Minutes.length) populateMinutes.call(this);
  var S = this.Scans; // can't use thisArg in sorts
  if (!S.length) return null;
  var MS1ScanNumbers = S.filter((ele) => (ele.Scan.MsLevel == mslevel)).map((ele) => ele.Scan.ScanNumber);
  var firstMSXRT = S[MS1ScanNumbers[0]].Scan.RetentionTime;
  var lastMSXRT = S[MS1ScanNumbers[MS1ScanNumbers.length-1]].Scan.RetentionTime;
  if (retention_time <= firstMSXRT) { return MS1ScanNumbers[0] };
  if (retention_time >= lastMSXRT) { return MS1ScanNumbers[MS1ScanNumbers.length-1] };
  var minute = Math.round(retention_time);
  if (!this.Internal.Minutes[minute]) {
   console.log("Cannot localise RT "+retention_time);
   throw new Error("MsDataFileCannotLocaliseRT");
  }
  var possibles = this.Internal.Minutes[minute].filter((p) => (S[p].Scan.MsLevel == mslevel));
  //check for exact match
  var exact_match = possibles.find((p) => (S[p].Scan.RetentionTime == retention_time));
  if (exact_match) { return exact_match }
  else {
   //Otherwise find closest match
   var firstRTMinute = Math.round(firstMSXRT);
   var lastRTMinute = Math.round(lastMSXRT);
   var range = 0;
   do {
    range++;
    var minute_to_add = minute + (match_low ? -range : range);
    if ((minute_to_add < firstRTMinute) || (minute_to_add > lastRTMinute)) {
     return null;
    }
    possibles = possibles.concat(this.Internal.Minutes[minute_to_add].filter((p) => (S[p].Scan.MsLevel == mslevel)) || []);
   } while (possibles.length < 1);
   var m;
   if (match_low) {
    possibles.sort((a,b) => (S[b].Scan.RetentionTime-S[a].Scan.RetentionTime));
    m = possibles.find((p) => (S[p].Scan.RetentionTime < retention_time));
   }
   else {
    possibles.sort((a,b) => (S[a].Scan.RetentionTime-S[b].Scan.RetentionTime));
    m = possibles.find((p) => (S[p].Scan.RetentionTime > retention_time));
   }
   return typeof(m) != "undefined" ? m : null;
  }
 }

 MsDataFile.prototype.getNearestMSXRTfromRT = function(mslevel,retention_time,match_low) {
  var s = this.getNearestMSXScanNumberfromRT(mslevel,retention_time,match_low);
  return(s != null ? this.Scans[s].Scan.RetentionTime : null);
 }
 
 MsDataFile.prototype.getNearestMSXScanNumberfromScanNumber = function(mslevel,s,match_low) {
  if (!this.Ready) return null;
  var firstScan = this.getFirstScanNumber();
  if (!this.Scans[s]) { //e.g. Might be an MS2+ and the mzFile only has MS1
   while(--s >= firstScan) { if (this.Scans[s]) break };
  };
  if (!this.Scans[s]) return(null); //Still couldn't find the scan
  if (this.Scans[s].Scan.MsLevel == mslevel) return(s);
  if (match_low) return(this.getPreviousScanNumber(s,mslevel));
  else return(this.getNextScanNumber(s,mslevel));
 }

 MsDataFile.prototype.getNearestMSXRTfromScanNumber = function(mslevel,s,match_low) {
  s = this.getNearestMSXScanNumberfromScanNumber(mslevel,s,match_low);
  return(s != null ? this.Scans[s].Scan.RetentionTime : null);
 }

 //Async PlaceHolders

 MsDataFile.prototype.fetchScanOffsets = function(prefetchScanHeaders) {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 MsDataFile.prototype.fetchScanHeader = function(scan,prefetchSpectrumData) {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 MsDataFile.prototype.fetchAllScanHeaders = function() {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 MsDataFile.prototype.fetchSpectrumData = function() {
  throw new Error("MsDataFileFunctionNotImplemented");
 }

 MsDataFile._SOURCE = _SOURCE;

 return MsDataFile;

}();