export let moietymath = function _SOURCE() {
 let blank = function() {
  return {
   atoms: {},
   symbol: { text : '', display: null},
   token: null,
   caption: null
  }
 };

 let check = function(m) {
  if (!m) throw new Error('moietymathInvalidInput');
  //todo
 }

 let distribution = function(m,charge,elements) {
  check(m);
  // console.log(m);
  // console.log(charge);
  let newDistribution;
  if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
  if (charge > 0) {
   newDistribution = new mslib.data.Distribution(elements.HYDROGEN.isotopes).normalise();
   for (let i = 1; i < charge; i++) {
    newDistribution = newDistribution.convolute(new mslib.data.Distribution(elements.HYDROGEN.isotopes).normalise());
   }
  }
  else {
   newDistribution = new mslib.data.Distribution([[0,1]]);
  }
  Object.keys(m.atoms).forEach(ele => {
   if (m.atoms[ele]) {
    let binaryMask = m.atoms[ele].toString(2).split("").reverse().map((i) => parseInt(i));
    let doublingsRequired = binaryMask.length-1;
    let intermediateDistributions = []
    // console.log(ele + ' REQUIRE '+m.atoms[ele]);
    // console.log(ele + ' ' + 1);
    intermediateDistributions[0] = new mslib.data.Distribution(elements[ele].isotopes).normalise();
    for (var i = 0; i < doublingsRequired; i++) {
     // console.log(ele + ' ' + Math.pow(2,i+1));
     intermediateDistributions[i+1] = intermediateDistributions[i].convolute(intermediateDistributions[i]).normalise();
    }
    let eleDistribution = intermediateDistributions[doublingsRequired];
    let n = Math.pow(2,doublingsRequired);
    for (var i = 0; i < doublingsRequired; i++) {
     if (binaryMask[i]) {
      // console.log(ele + ' ' + (n+=Math.pow(2,i)));
      eleDistribution = eleDistribution.convolute(intermediateDistributions[i]).normalise();
     }
    }
    // console.log('ADDING TO TOTAL');
    newDistribution = newDistribution.convolute(eleDistribution).normalise();
   }
  });
  if (charge) {
   newDistribution = newDistribution.overZ(charge);
  }
  return newDistribution;
 }

 let monoisotopicMass = function(m,elements) {
  check(m);
  if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
  return (Object.entries(m.atoms).reduce((acc,[atom,n]) => {
   acc += elements[atom].isotopes[0][0]*n;
   return acc;
  },m.massDelta ? m.massDelta : 0));
 }

 let monoisotopicMz = function(m,charge,elements) {
  check(m);
  charge = (charge ? +charge : 1);
  if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
  return (monoisotopicMass(m,elements) + elements.HYDROGEN.isotopes[0][0]*charge)/charge;
 }

 let monoAndPlusOneMz = function(m,charge,elements) {
  check(m);
  if (typeof(elements) === 'undefined') elements = mslib.constants.ELEMENTS;
  let monoMz = monoisotopicMz(m,charge,elements);
  let massDiff = (elements.HYDROGEN.isotopes[1][0] - elements.HYDROGEN.isotopes[0][0]) * charge * elements.HYDROGEN.isotopes[1][1];
  let totalAtoms = 0;
  Object.entries(m.atoms).forEach(([k,v]) => {
   totalAtoms += v;
   massDiff += (elements[k].isotopes[1][0] - elements[k].isotopes[0][0]) * v * elements[k].isotopes[1][1];
  });
  massDiff /= totalAtoms;
  return [monoMz,monoMz+massDiff/charge];
 }

 let topNMz = function(n,m,charge,elements,ppmGap) {
  check(m);
  if (!n) n = 1;
  if (!charge) charge = 1;
  if (typeof(ppm) == 'undefined') ppmGap = 5;
  let mzs = distribution(m,charge,elements).centroidToMaximas(ppmGap).normalise().values.sort((a,b) => b[1] - a[1]);
  return mzs.slice(0,Math.min(n,mzs.length)).map(e => e[0]);
 }

 let clone = function(m) {
  return JSON.parse(JSON.stringify(m));
 }

 let add = function(m1,m2,newSymbol) {
  check(m1);
  check(m2);
  let r = clone(m1);
  r.caption = null;
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}${m1.symbol.text.length && m2.symbol.text.length && (m2.symbol.text.charAt(0) != '-') ? '+' : ''}${m2.symbol.text}` , display : 'text' };
  Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) + v);
  if (m2.massDelta) {
   if (r.massDelta) { r.massDelta += m2.massDelta } else r.massDelta = m2.massDelta;
  }
  Object.entries(m2).filter(([k,v]) => !Object.keys(r).includes(k)).forEach(([k,v]) => r[k] = v);
  return r;
 }

 let addMassDelta = function(m1,delta) {
  check(m1);
  let r = clone(m1);
  r.caption = null;
  if (!r.massDelta) r.massDelta = delta;
  else r.massDelta += delta;
  return r;
 }

 let subtract = function(m1,m2,newSymbol) {
  check(m1);
  check(m2);
  let r = clone(m1);
  r.caption = null;
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}-${m2.symbol.text}` , display : 'text' };
  Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) - v);
  if (m2.massDelta) {
   if (r.massDelta) { r.massDelta -= m2.massDelta } else r.massDelta = -m2.massDelta;
  }
  return r;
 }

 let multiply = function(m1,n,newSymbol) {
  check(m1);
  let r = clone(m1);
  r.caption = null;
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol) r.symbol = { text : `${m1.symbol.value}(${n})` , display : 'text' };
  Object.entries(r.atoms).forEach(([k,v]) => r.atoms[k] = v*n);
  if (r.massDelta) r.massDelta =  r.massDelta * n;
  return r;
 }

 let equalComposition = function(m1,m2) {
  check(m1);
  check(m2);
  return (Object.keys(m1.atoms).length == Object.keys(m2.atoms).length
          && Object.entries(m1.atoms).every(([k,v]) => ((k in m2.atoms) && v == m2.atoms[k])));
 }

 return {
  blank: blank,
  distribution: distribution,
  monoisotopicMass: monoisotopicMass,
  monoisotopicMz: monoisotopicMz,
  monoAndPlusOneMz: monoAndPlusOneMz,
  topNMz: topNMz,
  clone: clone,
  add: add,
  addMassDelta: addMassDelta,
  subtract: subtract,
  multiply: multiply,
  equalComposition: equalComposition,
  _SOURCE: _SOURCE
 }
}();