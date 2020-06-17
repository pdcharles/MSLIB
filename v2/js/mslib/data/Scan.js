export let Scan = function _SOURCE() {
 var _Scan = function(scan) {
  if (!scan) scan = {};
  this.bytes                = scan.bytes || null;
  this.next                 = scan.next || null;
  this.previous             = scan.previous || null;
  this.headerParsed         = scan.headerParsed || false;
  this.msLevel              = scan.msLevel || null;
  this.retentionTime        = scan.retentionTime || null;
  this.centroided           = scan.centroided || null;
  this.lowMz                = scan.lowMz || null;
  this.highMz               = scan.highMz || null;
  this.collisionEnergy      = scan.collisionEnergy || null;
  this.totalCurrent         = scan.totalCurrent || null;
  this.basePeakMz           = scan.basePeakMz || null;
  this.basePeakIntensity    = scan.basePeakIntensity || null;
  this.analyser             = scan.analyser || null;
  this.precursorMzs         = scan.precursorMzs || [];
  this.precursorIntensities = scan.precursorIntensities || [];
  this.precursorCharges     = scan.precursorCharges || [];
  this.activationMethods    = scan.activationMethods || [];
  this.internal             = scan.internal || {};
 };

 _Scan.clone = function(scan) { //does not duplicate spectral data as not stored in scan
  return JSON.parse(JSON.stringify(scan));
 };

 _Scan._SOURCE = _SOURCE;

 return _Scan;
}();