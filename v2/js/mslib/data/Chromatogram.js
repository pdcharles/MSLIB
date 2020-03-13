export let Chromatogram = function _SOURCE() {

 var _Chromatogram = function(rts,ints,modulus) {
  if ([rts,ints].some((v) => !((typeof(v) == "object") && Array.isArray(v)))) {
   console.log("the first two arguments to mslib.Chromatogram must be an array");
   return {};
  }
  if (rts.length != ints.length) {
   console.log("the first two arguments to mslib.Chromatogram must be of equal length");
   return {};
  }
  this.rts = rts.map((v) => parseFloat(v));
  this.ints = ints.map((v) => parseFloat(v));
  if (modulus) { //2D chromatograms!
   this.modulus = modulus;
  }
 }

 _Chromatogram.prototype.getIntegratedArea = function() {
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

 _Chromatogram.prototype.getMinRT = function() {
  if(!this.rts.length) {
   return 0;
  }
  else {
   return Math.min.apply(null,this.rts);
  }
 }

 _Chromatogram.prototype.getMaxRT = function() {
  if(!this.rts.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.rts);
  }
 }

 _Chromatogram.prototype.getMaxIntensity = function() {
  if(!this.ints.length) {
   return 0;
  }
  else {
   return Math.max.apply(null,this.ints);
  }
 }

 _Chromatogram._SOURCE = _SOURCE;

 return _Chromatogram;

}();