"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
if (typeof MSLIB.Data == 'undefined') MSLIB.Data = {};

MSLIB.Data.Chromatogram = function() {

 var Chromatogram = function(rts,ints,modulus) {
  if ([rts,ints].some(function(v) {return !((typeof(v) == "object") && Array.isArray(v))})) {
   console.log("the first two arguments to MSLIB.Chromatogram must be an array");
   return {};
  }
  if (rts.length != ints.length) {
   console.log("the first two arguments to MSLIB.Chromatogram must be of equal length");
   return {};
  }
  this.rts = rts.map(function(v){return parseFloat(v)});
  this.ints = ints.map(function(v){return parseFloat(v)});
  if (modulus) { //2D chromatograms!
   this.modulus = modulus;
  }
 }

 Chromatogram.prototype.getIntegratedArea = function() {
  if (this.rts.length < 2) { return 0 };
  return this.rts.reduce((function(area,rt,i) {
   if (i >= this.rts.length-1) {
    return area
   }
   else {
    var w = this.rts[i+1] - rt;
    var h = (this.ints[i] + this.ints[i+1])/2;
    return (area + (w * h));
   }
  }).bind(this));
 }

 Chromatogram.prototype.getMinRT = function() {
  if(!this.rts.length) {
   return 0;
  }
  else {
   return Math.min.apply(null,this.rts);
  }
 }

 Chromatogram.prototype.getMaxRT = function() {
  if(!this.rts.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.rts);
  }
 }

 Chromatogram.prototype.getMaxIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.ints);
  }
 }

 return Chromatogram;

}();