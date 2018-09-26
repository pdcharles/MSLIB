"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Data == 'undefined') MSLIB.Data = {};
MSLIB.Data.Scan = function _SOURCE() {
 var _Scan = function(a) {
  if (a && Array.isArray(a)) a = JSON.parse(JSON.stringify(a));
  else a = new Array(16);
  this.scanNumber           = a[0] || null;
  this.msLevel              = a[1] || null;
  this.retentionTime        = a[2] || null;
  this.centroided           = a[3] || null;
  this.lowMz                = a[4] || null;
  this.highMz               = a[5] || null;
  this.totalCurrent         = a[6] || null;
  this.basePeakMz           = a[7] || null;
  this.basePeakIntensity    = a[8] || null;
  this.analyser             = a[9] || null;
  this.precursorMzs         = a[10] || [];
  this.precursorIntensities = a[11] || [];
  this.precursorCharges     = a[12] || [];
  this.activationMethods    = a[13] || [];
  this.internal             = a[14] || {};
  this.spectrum             = a[15] || null;
 };

 _Scan.prototype.clone = function() {
  var copy = new _Scan();
  Object.keys(this).forEach((k) => {
   if (k != "spectrum") copy[k] = JSON.parse(JSON.stringify(this[k]));
  });
  return(copy);
 };

 _Scan.prototype.toArray = function(storeSpectrum) {
  var a = new Array(storeSpectrum ? 16 : 15);
  a[0]  = this.scanNumber;
  a[1]  = this.msLevel;
  a[2]  = this.retentionTime;
  a[3]  = this.centroided;
  a[4]  = this.lowMz;
  a[5]  = this.highMz;
  a[6]  = this.totalCurrent;
  a[7]  = this.basePeakMz;
  a[8]  = this.basePeakIntensity;
  a[9]  = this.analyser;
  a[10] = this.precursorMzs;
  a[11] = this.precursorIntensities;
  a[12] = this.precursorCharges;
  a[13] = this.activationMethods;
  a[14] = this.internal;
  if (storeSpectrum) a[15] = this.spectrum;
  return(JSON.parse(JSON.stringify(a)));
 };

 _Scan._SOURCE = _SOURCE;

 return _Scan;
}();