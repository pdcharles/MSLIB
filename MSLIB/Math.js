"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
MSLIB.Math = function _SOURCE() {
 
 var log2 = function(x) {
  return Math.log(x)/Math.log(2);
 };

 var getNonSparseNumericArray = function(arr) {
  if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
  return arr.map(ele => parseFloat(ele)).filter(ele => (ele !== null) && !isNaN(ele)).sort((a,b) => (a-b));
 }

 var mean = function(arr) {
  var safeArr = getNonSparseNumericArray(arr);
  if (!safeArr.length) return null;
  else return safeArr.reduce((a,b) => (a+b),0)/safeArr.length;
 };

 var median = function(arr) {
  var safeArr = getNonSparseNumericArray(arr);
  switch (safeArr.length) {
   case 0 : return null;
   case 1 : return safeArr[0];
   default : {
    var halfIndex = Math.floor(safeArr.length/2);
    return safeArr.length % 2 ? safeArr[halfIndex] : mean(safeArr.slice(halfIndex-1,halfIndex+1));
   }
  }
 }

 var mad = function(arr) {
  var safeArr = getNonSparseNumericArray(arr);
  if (!safeArr.length) return null;
  var arrMedian = median(safeArr);
  if (arrMedian === null) return null;
  else return median(safeArr.map(ele => Math.abs(ele-arrMedian)))*1.4826;
 }
 
 var percentile = function(arr,p) {
  var safeArr = getNonSparseNumericArray(arr);
  var r = (p * (safeArr.length/100));
  var v;
  if (r < 1) {
   v = safeArr[0];
  }
  else if (r > safeArr.length) {
   v = safeArr[safeArr.length-1];
  }
  else if(!(r % 1)) {
   v = safeArr[r-1];
  }
  else {
   var k = Math.floor(r);
   var k1 = Math.ceil(r);
   var pk = k * (100/safeArr.length);
   v = safeArr[k-1] + (p-pk)*(safeArr.length/100)*(safeArr[k1-1]-safeArr[k-1]);
  }
  return v;
 };
 
 var erfc = function(x) {
  var z = Math.abs(x);
  var t = 2.0/(2.0+z);
  var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (1.48851587 + (t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0.0 ? ans : 2.0-ans;
 };
 
 var avgPpmDiff = function(a,b) {
  return Math.abs(a-b)/((a+b)/2) * 1e6;
 };

 var ppmError = function(mass,ppm) {
  return (mass/1e6) * ppm;
 };

 var movingAverageSmooth = function(arr,mar) {
  if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
  if (!arr.length) return null;
  if (arr.length <= (2*mar + 1)) return arr;
  mar = Math.round(mar);
  var padding = Array(mar).fill(0);
  var smth = padding.concat(arr,padding).map(function(ele,i,paddedarr) {
   if ((i >= mar) && ((i+mar) < paddedarr.length)) {
    return paddedarr.slice(i-mar,i+mar+1).reduce((a,b) => (a+b))/(2*mar + 1);
   }
   else {
    return 0;
   }
  });
  return smth.slice(mar,smth.length-mar);
 }

 var maxima = function(arr,allowEnds) { //returns a binary vector of the same length where local maxima are indicated by trues
  if (!Array.isArray(arr)) throw new Error("MathArgumentIsNotArray");
  if (!arr.length) return null;
  if (arr.length == 1) return [true];
  var plateauStart = -1;
  var difference = [0].concat(arr.slice(1).map((ele,i) => (ele - arr[i])));
  if (allowEnds) { //don't report the ends of the array as maxima unless allowEnds set
   difference.unshift(1);
   difference.push(-1);
   plateauStart = 0;
  }
  var isMaxList = difference.map(() => false); 
  difference.slice(1).forEach(function(diff,i) { //difference[i] is the *previous* difference for the current diff
   if (diff < 0) {
    if ((difference[i]) >= 0 && (plateauStart > -1)) {
     isMaxList[Math.floor((i+plateauStart)/2)+1] = true;
     plateauStart = -1; //end of a plateau
    } 
   }
   else if (diff > 0) {
    plateauStart = i;
   }
  });
  if (allowEnds) {
   isMaxList.shift();
   isMaxList.pop();
  }
  return isMaxList;
 };

 return {
  log2          : log2,
  mean          : mean,
  median        : median,
  mad           : mad,
  percentile    : percentile,
  erfc          : erfc,
  avgPpmDiff    : avgPpmDiff,
  ppmError      : ppmError,
  movingAverageSmooth : movingAverageSmooth,
  maxima        : maxima,
  _SOURCE : _SOURCE
 }

}();