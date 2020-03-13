export let MgfFile = function _SOURCE() {

 var _MgfFile = function(f) {
  mslib.format.MsDataFile.call(this, f);
  this.reader.onprogress      = function(data) {
   if (data.lengthComputable) {                                            
    mslib.common.progress(this,parseInt(((data.loaded/data.total)*100).toFixed(2)));
   }
  }
  this.fileType               = "mgf";
 };

 var headerParse = /^([^=]+)=(.+)$/;
 var pepmassParse = /^(\S+)(?:\s+(\S+))?/;
 var chargeParse = /^(\d+)\+?/;
 var mzIntPairParse = /^(\S+)\s+(\S+)$/;

 _MgfFile.prototype.load = function() {
  mslib.common.start(this);
  this.Reader.readText(
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
      var scan = new mslib.data.Scan();
      scan.scanNumber = i;
      var pmMatch = pepmassParse.exec(headers.PEPMASS);
      if (pmMatch[1]) {
       scan.precursorMzs = [+pmMatch[1]];
       if (pmMatch[2]) {
        scan.precursorIntensities = [+pmMatch[2]];
       }
       if (headers.CHARGE) {
        scan.precursorCharges = [+chargeParse.exec(headers.CHARGE)[1]];
       }
       if (headers.RTINSECONDS) {
        scan.retentionTime = [headers.RTINSECONDS/60];
       }
       scan.spectrum = new mslib.data.Spectrum(mzs, ints);
       scan.basePeakMz = scan.spectrum.getBasePeakMz();
       scan.basePeakIntensity = scan.spectrum.getBasePeakIntensity(); 
       scan.totalCurrent = scan.spectrum.getTotalIntensity();
       scan.internal.headers = headers;
       this.Parent.scans[i] = {}
       this.Parent.scans[i].scanData = scan.toArray(true);
       this.Parent.scans[i].length = entry.length;
       if (previousScan) {
        this.Parent.scans[previousScan].next = i;
        this.Parent.scans[i].previous = previousScan;
       }
       previousScan = scan.scanNumber;
      }
      else {
       console.log("Failed to parse Precursor mass from PEPMASS in "+i+":"+entry);
      }
     }
     else {
      console.log("Failed to parse TITLE and PEPMASS from entry "+i+":"+entry);
     }
    },this);
    mslib.common.finish(this.Parent);
   }
  );
 };

 _MgfFile.prototype.export = function() {
  var out = "";
  this.scans.forEach(function(s) {
   var scan = new mslib.Scan(s.scanData);
   out += "BEGIN IONS\n";
   out += ("TITLE=" + scan.internal.headers.TITLE + "\n");
   out += ("PEPMASS=" + scan.precursorMzs[0]);
   if (scan.precursorIntensities.length) out += (" " + scan.precursorIntensities[0]);
   out += "\n";
   Object.keys(scan.internal.headers).forEach(function(key) {
    if ((key != "TITLE") && (key != "PEPMASS")) {
     out += (key + "=" + scan.internal.headers[key])+"\n";
    }
   });
   scan.spectrum.mzs.forEach(function(mz,i) {
    out += (mz + " " + scan.spectrum.ints[i] + "\n");
   });
   out += "END IONS\n";  
  });
  return out;
 }

 _MgfFile._SOURCE = _SOURCE;

 return _MgfFile;

}();