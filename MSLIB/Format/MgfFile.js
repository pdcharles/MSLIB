"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Format == 'undefined') MSLIB.Format = {};
MSLIB.Format.MgfFile = function _SOURCE() {

 var MgfFile = function(f) {
  MSLIB.Format.MsDataFile.call(this, f);
  this.Reader.onprogress      = function(data) {
   if (data.lengthComputable) {                                            
    this.Progress = parseInt(((data.loaded/data.total)*100).toFixed(2));
   }
  }
  this.FileType               = "mgf";
 };

 var headerParse = /^([^=]+)=(.+)$/;
 var pepmassParse = /^(\S+)(?:\s+(\S+))?/;
 var chargeParse = /^(\d+)\+?/;
 var mzIntPairParse = /^(\S+)\s+(\S+)$/;

 MgfFile.prototype.load = function() {
  MSLIB.Common.starting.call(this);
  this.LastError = this.Reader.readText(
   function() {
    var text = this.result.replace(/\r\n?/gm,"\n");
    var entries = text.split("END IONS");
    while (entries[entries.length-1].match(/^\s*$/)) entries.pop(); // remove trailing blank lines
    var previousScan = null;
    entries.forEach(function(entry,i) {
     var mgfEntryLines = entry.substr(entry.indexOf("BEGIN IONS")+10).split("\n");
     var headers = {};
     var startIndex = 0;
     for (var j = startIndex; j < mgfEntryLines.length; j++) {
      if (!mgfEntryLines[j].length) continue;
      if (mgfEntryLines[j].indexOf("=") <= 0) {
       startIndex = j;
       break;
      }
      var hdr = headerParse.exec(mgfEntryLines[j]);
      if (hdr) {
       headers[hdr[1]] = hdr[2];
      }
      else {
       console.log(mgfEntryLines[j]);
      }
     }
     if (headers.TITLE && ("PEPMASS" in headers)) {
      var mzs = [];
      var ints = [];
      for (var j = startIndex; j < mgfEntryLines.length; j++) {
       if (!mgfEntryLines[j].length) continue;
       var mzIntPair = mzIntPairParse.exec(mgfEntryLines[j]);
       if (mzIntPair) {
        mzs.push(+mzIntPair[1]);
        ints.push(+mzIntPair[2]);
       }
       else {
        console.log(mgfEntryLines[j]);
       }
      }
      var scan = new MSLIB.Data.Scan();
      scan.ScanNumber = i;
      var pm_match = pepmassParse.exec(headers.PEPMASS);
      if (pm_match[1]) {
       scan.PrecursorMzs = [+pm_match[1]];
       if (pm_match[2]) {
        scan.PrecursorIntensities = [+pm_match[2]];
       }
       if (headers.CHARGE) {
        scan.PrecursorCharges = [+chargeParse.exec(headers.CHARGE)[1]];
       }
       if (headers.RTINSECONDS) {
        scan.RetentionTime = [headers.RTINSECONDS/60];
       }
       scan.Spectrum = new MSLIB.Data.Spectrum(mzs, ints);
       scan.BasePeakMz = scan.Spectrum.getBasePeakMz();
       scan.BasePeakIntensity = scan.Spectrum.getBasePeakIntensity(); 
       scan.TotalCurrent = scan.Spectrum.getTotalIntensity();
       scan.Internal.Headers = headers;
       this.Parent.Scans[i] = {}
       this.Parent.Scans[i].Scan = scan;
       this.Parent.Scans[i].Length = entry.length;
       if (previousScan) {
        this.Parent.Scans[previousScan].Next = i;
        this.Parent.Scans[i].Previous = previousScan;
       }
       previousScan = scan.ScanNumber;
      }
      else {
       console.log("Failed to parse Precursor mass from PEPMASS in "+i+":"+entry);
      }
     }
     else {
      console.log("Failed to parse TITLE and PEPMASS from entry "+i+":"+entry);
     }
    },this);
    MSLIB.Common.finished.call(this.Parent);
   }
  );
 };

 MgfFile.prototype.export = function() {
  var out = "";
  this.Scans.forEach(function(s) {
   var scan = s.Scan;
   out += "BEGIN IONS\n";
   out += ("TITLE=" + scan.Internal.Headers.TITLE + "\n");
   out += ("PEPMASS=" + scan.PrecursorMzs[0]);
   if (scan.PrecursorIntensities.length) out += (" " + scan.PrecursorIntensities[0]);
   out += "\n";
   Object.keys(scan.Internal.Headers).forEach(function(key) {
    if ((key != "TITLE") && (key != "PEPMASS")) {
     out += (key + "=" + scan.Internal.Headers[key])+"\n";
    }
   });
   scan.Spectrum.mzs.forEach(function(mz,i) {
    out += (mz + " " + scan.Spectrum.ints[i] + "\n");
   });
   out += "END IONS\n";  
  });
  return out;
 }

 MgfFile._SOURCE = _SOURCE;

 return MgfFile;

}();