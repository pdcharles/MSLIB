export let Distribution = function _SOURCE() {

 const FRACTION_LIMIT = 0.000001;

 let _Distribution = function(values) {
  // console.log(values);
  if (!(typeof(values) == "object" && 
     Array.isArray(values) && 
     values.length > 0 &&
     values.every(entry => 
      entry.length==2 &&
      typeof(entry[0]) == "number" &&
      typeof(entry[1]) == "number"
     ) 
  )) throw new Error('DistributionInvalidArgument');
  this.values = values;
 }

 _Distribution.prototype.normalise = function() {
  let totalAbundance = 0;
  for (let i = 0; i < this.values.length; i++) totalAbundance += this.values[i][1];
  return new _Distribution(this.values.map(entry => [entry[0],entry[1]/totalAbundance]));
 }

 const DPRE = /\d*$/;
 
 _Distribution.prototype.convolute = function(dist) {
  if ((typeof(dist) != "object") || (dist.constructor !== Distribution)) throw new Error('DistributionCanOnlyConvoluteWithDistribution');
  let convolutionResult = Array.prototype.concat.apply([],
   this.values.map((i) => dist.values.map((j) => [i[0]+j[0],i[1]*j[1]]))
  );
  // console.log(convolutionResult);
  let newValues = {};
  for (let i = 0; i < convolutionResult.length; i++){
   let resultKey = convolutionResult[i][0];
   let resultKeyDigits = DPRE.exec(resultKey)[0].length-1;
   let match;
   
   if (match = Object.keys(newValues)
                  .find(key => {
                    let n = Math.min(resultKeyDigits,DPRE.exec(key)[0].length-1)
                    return (+key).toFixed(n) == resultKey.toFixed(n)
                  })) {
    newValues[match] += convolutionResult[i][1];
   }
   else {
    newValues[convolutionResult[i][0]] = convolutionResult[i][1];
   }
  }
  // console.log(newValues);
  return new _Distribution(Object.entries(newValues)
                           .map(e => [+e[0],e[1]]) //Ensure numeric
                           .filter(e => (e[1] > FRACTION_LIMIT))
                           .sort((a,b) => (a[0]-b[0])));
 }

 _Distribution.prototype.overZ = function(z) {
  return new _Distribution(this.values.map(e => [e[0]/z,e[1]]));
 }

 _Distribution.prototype.asSpectrum = function() {
  return new mslib.data.Spectrum(this.values.map(e => e[0]),this.values.map(e => e[1]));
 }

 _Distribution.prototype.centroid = function() {
  let weightedMeanMass = 0;
  let totalAbundance = 0;
  let weights = this.normalise().values;
  for (let i = 0; i < this.values.length; i++){
   weightedMeanMass += (this.values[i][0]*weights[i][1]);
   totalAbundance += this.values[i][1];
  }
  return new _Distribution([[weightedMeanMass,totalAbundance]]);
 }

 _Distribution.prototype.centroidToMaximas = function(ppmGap) {
  let maxGapRatio = (ppmGap / 1e6);

  // Find maxima
  let isMax = mslib.math.maxima(this.values.map(value => value[1]),true);
  let nIsMax = 0;
  var maxima = [];
   
  // Add any peaks separated from all others by more than maxGap as maxima
  for (let i = 0; i < this.values.length; i++) {
   if (
       (
        (i == 0) || 
        (((this.values[i][0] - this.values[i-1][0])/this.values[i][0]) > maxGapRatio) ||
        (this.values[i][1] > this.values[i-1][1])
       ) && (
        (i == (this.values.length-1)) || 
        (((this.values[i+1][0] - this.values[i][0])/this.values[i][0]) > maxGapRatio) || 
        (this.values[i][1] > this.values[i+1][1])
       )
      ) {
    isMax[i] = true;
    nIsMax += 1;
    maxima.push(i);
   }
  }

  maxima.sort((a,b) => a-b);

//  console.log(isMax.map(m => (m ? 1 : 0)));
  
  // Early finish if only one maxima
  if (nIsMax == 1) {
   return this.centroid();
  }

  // Then group to closest maxima
  var groups = [[]];

 // console.log(maxima.map(i => this.values[i]));

  for (let i = 0; i < this.values.length; i++) {
   if (i < maxima[0]) {
    groups[0].push(this.values[i]);
   }
   else if (i > maxima[maxima.length-1]) {
    groups[maxima.length-1].push(this.values[i]);
   }
   else if (isMax[i]) {
    groups[groups.length-1].push(this.values[i]);
    if (groups.length < maxima.length) groups.push([]);
   }
   else {
    groups[groups.length-1-((this.values[i][0]-this.values[maxima[groups.length-2]][0]) <= (this.values[maxima[groups.length-1]][0]-this.values[i][0]))].push(this.values[i]);
   }
  }

 // console.log(groups);

  let centroidedGroups = groups.map((g) => new mslib.data.Distribution(g).centroid().values[0]);
  let previousLength;

 // console.log(centroidedGroups);
 
  //Then, group maxima closer than ppmGap

  // console.log(maxGapRatio);
  do {
   let groupedCentroidedGroups = [[centroidedGroups[0]]];
   for (let i = 1; i < centroidedGroups.length; i++) {
    if ((centroidedGroups[i][0] - centroidedGroups[i-1][0])/centroidedGroups[i][0] <= maxGapRatio) {
     // console.log((centroidedGroups[i][0] - centroidedGroups[i-1][0])/centroidedGroups[i][0]);
     groupedCentroidedGroups[groupedCentroidedGroups.length-1].push(centroidedGroups[i]);
    }
    else {
     groupedCentroidedGroups.push([centroidedGroups[i]]);
    }
   }
   previousLength = centroidedGroups.length;
   // console.log(centroidedGroups);
   // console.log(groupedCentroidedGroups);
   centroidedGroups = groupedCentroidedGroups.map((g) => new mslib.data.Distribution(g).centroid().values[0]);
  } while (centroidedGroups.length < previousLength);

  //Finally, remove any peaks representing less than FRACTION_LIMIT total intensity
  return new mslib.data.Distribution(centroidedGroups.filter(i => i[1] > FRACTION_LIMIT));
 }

 _Distribution._SOURCE = _SOURCE;

 return _Distribution;
}();