"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
MSLIB.Math = function() {
 
 var log2 = function(x) {
  return(Math.log(x)/Math.log(2));
 };

 var mean = function(arr) {
  var nonsparsearr = arr.filter(function(ele) {return ele != null});
  if (!nonsparsearr.length) return null;
  else {
   var total = nonsparsearr.reduce(function(a,b) {return a+b},0);
   return total/nonsparsearr.length;
  }
 };
 
 var percentile = function(a,p) {
  if ((typeof(a) == "object") && Array.isArray(a)) {
   console.log("first argument to percentile must be an array");
   return Number.NaN;
  }
  var r = (p * (a.length/100));
  var v;
  if (r < 1) {
   v = a[0];
  }
  else if (r > a.length) {
   v = a[a.length-1];
  }
  else if(!(r % 1)) {
   v = a[r-1];
  }
  else {
   var k = Math.floor(r);
   var k1 = Math.ceil(r);
   var pk = k * (100/a.length);
   v = a[k-1] + (p-pk)*(a.length/100)*(a[k1-1]-a[k-1]);
  }
  return(v);
 };
 
 var erfc = function(x) {
  var z = Math.abs(x);
  var t = 2.0/(2.0+z);
  var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (1.48851587 + (t * (-0.82215223 + t * 0.17087277)))))))));
  return( x >= 0.0 ? ans : 2.0-ans);
 };
 
 //Based on code from Skyline statistics library
 var dotProduct = function(vector_a,vector_b) {
  if ([vector_a,vector_b].some(function(v) {return !((typeof(v) == "object") && Array.isArray(v))})) {
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
 
 var normalisedSpectralContrastAngle = function(dotProduct) {
  return (1 - Math.acos(dotProduct)*2/Math.PI);
 };
 
 var unitLengthVector = function(arr) {
  var total = arr.reduce(function(a,b){return a+b});
  return (total ? arr.map(function(a){return a/total}) : arr);
 };
 
 var sqrtVector = function(arr) {
  return arr.map(function(a){return Math.sqrt(a)});
 };
 
 var sqrtUnitNormalisedSpectralContrastAngle = function(vector_a,vector_b) {
  return normalisedSpectralContrastAngle(
          dotProduct(
           unitLengthVector(sqrtVector(vector_a)),
           unitLengthVector(sqrtVector(vector_b))
          )
         );
 };
 
 var avgPpmDiff = function(a,b) {
  return (Math.abs(a-b)/((a+b)/2) * 1000000);
 };

 var ppmError = function(mass,ppm) {
  return (mass/1000000)*ppm;
 };

 var movingAverageSmooth = function(arr,mar) {
  if (!arr.length) return null;
  if (arr.length <= (2*mar + 1)) return arr;
  mar = Math.round(mar);
  var padding = Array.apply(null,Array(mar)).map(Number.prototype.valueOf,0);
  var smth = padding.concat(arr,padding).map(function(ele,i,paddedarr) {
   if ((i >= mar) && ((i+mar) < paddedarr.length)) {
    return paddedarr.slice(i-mar,i+mar+1).reduce(function(a,b) {return a+b})/(2*mar + 1);
   }
   else {
    return 0;
   }
  });
  return smth.slice(mar,smth.length-mar);
 }

 var maxima = function(arr,allow_ends) { //returns a binary vector of the same length where local maxima are indicated by 1s
  if (!arr.length) return null;
  if (arr.length == 1) return [1];
  var plateau_start = -1;
  var difference = [0].concat(arr.slice(1).map(function(ele,i){ return ele - arr[i]}));
  if (allow_ends) { //don't report the ends of the array as maxima unless allow_ends set
   difference.unshift(1);
   difference.push(-1);
   plateau_start = 0;
  }
  var is_max = difference.map(Number.prototype.valueOf,0); 
  difference.slice(1).forEach(function(diff,i) { //difference[i] is the *previous* difference for the current diff
   if (diff < 0) {
    if ((difference[i]) >= 0 && (plateau_start > -1)) {
     is_max[Math.floor((i+plateau_start)/2)+1] = 1;
     plateau_start = -1; //end of a plateau
    } 
   }
   else if (diff > 0) {
    plateau_start = i;
   }
  });
  if (allow_ends) {
   is_max.shift();
   is_max.pop();
  }
  return is_max;
 };

 return {
  log2          : log2,
  mean          : mean,
  percentile    : percentile,
  erfc          : erfc,
  dotProduct    : dotProduct,
  normalisedSpectralContrastAngle : normalisedSpectralContrastAngle,
  unitLengthVector : unitLengthVector,
  sqrtVector    : sqrtVector,
  sqrtUnitNormalisedSpectralContrastAngle : sqrtUnitNormalisedSpectralContrastAngle,
  avgPpmDiff    : avgPpmDiff,
  ppmError      : ppmError,
  movingAverageSmooth : movingAverageSmooth,
  maxima        : maxima,
 }

}();