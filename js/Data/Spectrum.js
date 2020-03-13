"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Data == 'undefined') MSLIB.Data = {};
MSLIB.Data.Spectrum = function _SOURCE() {

 var _Spectrum = function(mzs,ints) {
  if ([mzs,ints].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) throw new Error("SpectrumArgumentNotArray");
  if (mzs.length != ints.length) throw new Error("SpectrumArgumentsUnequalLength");
  this.mzs = mzs.map((v) => parseFloat(v));
  if (!this.mzs.every((e,i,a) => i == 0 || a[i-1] <= e)) throw new Error("SpectrumMzsNotOrderedAscending");
  this.ints = ints.map((v) => parseFloat(v));
 }

 _Spectrum.prototype.clone = function() {
  return new _Spectrum(this.mzs,this.ints);
 };

 _Spectrum.prototype.getCroppedSpectrum = function(mz_min,mz_max) {
  var mask = this.mzs.map((ele,i) => ((ele >= mz_min) && (ele <= mz_max)));
  var start = mask.indexOf(true);
  var end = mask.lastIndexOf(true);
  return new _Spectrum(
   this.mzs.slice(start,end+1),
   this.ints.slice(start,end+1)
  )
 };

 _Spectrum.prototype.getMinMz = function() {
  if(!this.mzs.length) {
   return 0;
  }
  else {
   return Math.min.apply(null,this.mzs);
  }
 };

 _Spectrum.prototype.getMaxMz = function() {
  if(!this.mzs.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.mzs);
  }
 };

 _Spectrum.prototype.getMaxIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.ints);
  }
 };

 _Spectrum.prototype.getTotalIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return(this.ints.reduce((a,b) => a+b));
  }
 };

 _Spectrum.prototype.getBasePeakIndex = function() {
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

 _Spectrum.prototype.getBasePeakMz = function() {
  return(this.mzs[this.getBasePeakIndex()]);
 };

 _Spectrum.prototype.getBasePeakIntensity = function() {
  return(this.ints[this.getBasePeakIndex()]);
 };

 _Spectrum.prototype.getMatchedSpectra = function(comparator,mzPPMError) {
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
           [this_matchlist.map((a) => a[0]),this_matchlist.map((a) => a[1])],
           [comp_matchlist.map((a) => a[0]),comp_matchlist.map((a) => a[1])]
          ]);
 };

 //Based on code from Skyline statistics library
 var dotProduct = function(vector_a,vector_b) {
  if ([vector_a,vector_b].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) {
   console.log("both arguments to dotProduct must be an array");
   return Number.NaN;
  }
  if (vector_a.length != vector_b.length) {
   console.log("arguments to dotProduct must be of equal length");
   return Number.NaN;
  }
  var sumCross = 0;
  var sumLeft  = 0;
  var sumRight = 0;
  for (var i = 0, len = vector_a.length; i < len; i++) {
   var left = vector_a[i];
   var right = vector_b[i];
   sumCross += left*right;
   sumLeft += left*left;
   sumRight += right*right;
  }
  if (sumLeft == 0 || sumRight == 0) {
   return (sumLeft == 0 && sumRight == 0 ? 1.0 : 0);
  }
  else {
   return Math.min(1.0, sumCross/Math.sqrt(sumLeft*sumRight));
  }
 };
 
 var normalisedSpectralContrastAngle = function(dp) {
  return (1 - Math.acos(dp)*2/Math.PI);
 };
 
 var unitLengthVector = function(arr) {
  var total = arr.reduce((a,b) => (a+b));
  return (total ? arr.map((a) => (a/total)) : arr);
 };
 
 var sqrtVector = function(arr) {
  return arr.map((a) => Math.sqrt(a));
 };
 
 var sqrtUnitNormalisedSpectralContrastAngle = function(vector_a,vector_b) {
  return normalisedSpectralContrastAngle(
          dotProduct(
           unitLengthVector(sqrtVector(vector_a)),
           unitLengthVector(sqrtVector(vector_b))
          )
         );
 };

 _Spectrum.prototype.getNormalisedSpectralContrastAngleTo = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getNormalisedSpectralContrastAngleTo another Spectrum (or object with mzs and int)");
   return Number.NaN;
  }
  if (typeof(mzPPMError) == "undefined") {
   mzPPMError = 5.0;
  }
  var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
  return sqrtUnitNormalisedSpectralContrastAngle(matchedSpectra[0][1],matchedSpectra[1][1]);
 };

 _Spectrum.prototype.getNormalisedWeightedEuclideanDistanceFrom = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getWeightedEuclideanDistanceFrom another Spectrum (or object with mzs and int)");
   return Number.NaN;
  }
  if (typeof(mzPPMError) == "undefined") {
   mzPPMError = 5.0;
  }
  var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
  var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
  var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
  var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
  var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
  var squaredDiffsWeighted = proportionsP.map((propP,i)=>propP*Math.pow(propP-proportionsQ[i],2));
  return 1-Math.sqrt(squaredDiffsWeighted.reduce((a,b)=>a+b));
 };

 _Spectrum.prototype.getNormalisedEuclideanDistanceFrom = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getEuclideanDistanceFrom another Spectrum (or object with mzs and int)");
   return Number.NaN;
  }
  if (typeof(mzPPMError) == "undefined") {
   mzPPMError = 5.0;
  }
  var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
  var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
  var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
  var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
  var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
  var squaredDiffs = proportionsP.map((propP,i)=>Math.pow(propP-proportionsQ[i],2));
  return 1-Math.sqrt(squaredDiffs.reduce((a,b)=>a+b));
 };

 _Spectrum.prototype.getNormalisedKullbackLeiblerDivergenceFrom = function(comparator,mzPPMError) {
  if ((typeof(comparator) != "object") || !((comparator.constructor == this.constructor) || (comparator.mzs && comparator.ints))) {
   console.log("can only getKullbackLeiblerDivergenceFrom another Spectrum (or object with mzs and int)");
   return Number.NaN;
  }
  if (typeof(mzPPMError) == "undefined") {
   mzPPMError = 5.0;
  }
  var matchedSpectra = _Spectrum.prototype.getMatchedSpectra.call(this,comparator,mzPPMError);
  matchedSpectra[0][1] = matchedSpectra[0][1].map((inten,i) => matchedSpectra[1][1][i] > 0 ? inten : 0);
  var sumP = matchedSpectra[0][1].reduce((a,b)=>a+b,0);
  if (sumP > 0) {
   var sumQ = matchedSpectra[1][1].reduce((a,b)=>a+b,0);
   var proportionsP = matchedSpectra[0][1].map(inten=>inten/sumP);
   var proportionsQ = matchedSpectra[1][1].map(inten=>inten/sumQ);
   var kld = proportionsP.map((propP,i)=> propP ? propP*Math.log(propP/proportionsQ[i]) : 0).reduce((a,b)=>a+b);
   return(2-2/(1+Math.exp(-kld)));
  } else return 0;
 };

 _Spectrum._SOURCE = _SOURCE;

 return _Spectrum;

}();