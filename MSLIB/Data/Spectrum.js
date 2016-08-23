"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Data == 'undefined') MSLIB.Data = {};
MSLIB.Data.Spectrum = function _SOURCE() {

 var Spectrum = function(mzs,ints) {
  if ([mzs,ints].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) {
   console.log("both arguments to Spectrum must be an array");
   return {};
  }
  if (mzs.length != ints.length) {
   console.log("both arguments to Spectrum must be of equal length");
   return {};
  }
  this.mzs = mzs.map((v) => parseFloat(v));
  this.ints = ints.map((v) => parseFloat(v));
  if (!this.mzs.every((e,i,a) => i == 0 || a[i-1] <= e)) {
   console.log("mzs provided for Spectrum must be sorted in ascending order");
   console.log(this.mzs);
   return {};
  }
 }

 Spectrum.prototype.clone = function() {
  return new Spectrum(this.mzs,this.ints);
 };

 Spectrum.prototype.getCroppedSpectrum = function(mz_min,mz_max) {
  var mask = this.mzs.map((ele,i) => ((ele >= mz_min) && (ele <= mz_max)));
  var start = mask.indexOf(true);
  var end = mask.lastIndexOf(true);
  return new Spectrum(
   this.mzs.slice(start,end+1),
   this.ints.slice(start,end+1)
  )
 };

 Spectrum.prototype.getMinMz = function() {
  if(!this.mzs.length) {
   return 0;
  }
  else {
   return Math.min.apply(null,this.mzs);
  }
 };

 Spectrum.prototype.getMaxMz = function() {
  if(!this.mzs.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.mzs);
  }
 };

 Spectrum.prototype.getMaxIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.ints);
  }
 };

 Spectrum.prototype.getTotalIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return(this.ints.reduce((a,b) => a+b));
  }
 };

 Spectrum.prototype.getBasePeakIndex = function() {
  var maxIndex = 0;
  var maxInt = 0;
  for (var i in this.ints) {
   if (this.ints[i] > maxInt) {
    maxIndex = i;
    maxInt = this.ints[i];
   }
  }
  return(maxIndex);
 };

 Spectrum.prototype.getBasePeakMz = function() {
  return(this.mzs[this.getBasePeakIndex()]);
 };

 Spectrum.prototype.getBasePeakIntensity = function() {
  return(this.ints[this.getBasePeakIndex()]);
 };

 Spectrum.prototype.getMatchedSpectra = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getMatchedSpectra against another Spectrum (or object with mzs and int)");
   return Number.NaN;
  } 
  if (typeof(mzPPMError) == "undefined") {
   console.log("mzPPMError must be specified");
   return Number.NaN;
  }
 
  var diffs = [];
  for (var i in this.mzs) {
   for (var j in comparator.mzs) {
    diffs.push([i,j,MSLIB.Math.avgPpmDiff(this.mzs[i],comparator.mzs[j])]);
   }
  }
  diffs.sort((a,b) => a[2] - b[2]);
 
  var this_matched = [];
  for (var i in this.mzs) {
   this_matched[i] = 0;
  }
  var comp_matched = [];
  for (var j in comparator.mzs) {
   comp_matched[j] = 0;
  }
 
  var this_matchlist = [];
  var comp_matchlist = [];
  for (var d in diffs) {
   if (diffs[d][2] > mzPPMError) {
    break;
   }
   if (this_matched[diffs[d][0]] || comp_matched[diffs[d][1]]) {
    continue;
   }
   else {
    this_matchlist.push([this.mzs[diffs[d][0]],this.ints[diffs[d][0]]]);
    comp_matchlist.push([comparator.mzs[diffs[d][1]],comparator.ints[diffs[d][1]]]);
    this_matched[diffs[d][0]] = 1;
    comp_matched[diffs[d][1]] = 1;
   }
  }
 
  for (var i in this.mzs) {
   if (!this_matched[i]) {
    this_matchlist.push([this.mzs[i],this.ints[i]]);
    comp_matchlist.push([this.mzs[i],0]);
   }
  }
  for (var j in comparator.mzs) {
   if (!comp_matched[j]) {
    this_matchlist.push([comparator.mzs[j],0]);
    comp_matchlist.push([comparator.mzs[j],comparator.ints[j]]);
   }
  }
 
  this_matchlist.sort((a,b) => a[0] - b[0]);
  comp_matchlist.sort((a,b) => a[0] - b[0]);
 
  return ([
           new Spectrum(this_matchlist.map((a) => a[0]),this_matchlist.map((a) => a[1])),
           new Spectrum(comp_matchlist.map((a) => a[0]),comp_matchlist.map((a) => a[1]))
          ]);
 };

 Spectrum.prototype.getNormalisedSpectralContrastAngleTo = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getNormalisedSpectralContrastAngleTo another Spectrum (or object with mzs and int)");
   return Number.NaN;
  }
  if (typeof(mzPPMError) == "undefined") {
   mzPPMError = 5.0;
  }
  var matched_spectra = this.getMatchedSpectra(comparator,mzPPMError);
  return MSLIB.Math.sqrtUnitNormalisedSpectralContrastAngle(matched_spectra[0].ints,matched_spectra[1].ints);
 };

 Spectrum._SOURCE = _SOURCE;

 return Spectrum;

}();