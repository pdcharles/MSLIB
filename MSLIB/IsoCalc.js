"use strict";

if (typeof MSLIB == 'undefined') var MSLIB = {};
MSLIB.IsoCalc = function _SOURCE() {

 var FRACTION_LIMIT = 0.000001;
 
 var Atom = function(params) {
  if (typeof(params) != "object") {
   console.log("parameters must be supplied as an object");
   return {};
  }
  if ((typeof(params.isotopes) == "object") && Array.isArray(params.isotopes)) {
   if (params.isotopes.length) {
    var abundanceTotal = 0;
    params.isotopes.forEach(function(isotope) {
     if (Array.isArray(isotope) && (isotope.length == 2) && (typeof(isotope[0]) == "number") && (typeof(isotope[1]) == "number")) {
      abundanceTotal += isotope[1];
     }
     else {
      console.log("isotopes parameter must be in form [[isotopologue1,abundance1],[isotopologue2,abundance2]] etc");
      return {};
     }    
    });
    this.isotopes = [];
    params.isotopes.forEach(function(isotope,i) {
     this.isotopes[i] = [];
     this.isotopes[i][0] = isotope[0];
     this.isotopes[i][1] = isotope[1]/abundanceTotal;
    },this);
   }
   else {
    console.log("isotopes parameter contains no data");
    return {};
   }
  }
  else {
   console.log("isotopes parameter undefined");
   return {};
  }
  if (typeof(params.symbol) != "undefined") {
   if (typeof(params.symbol) == "string") {
    this.symbol = params.symbol;
   }
   else {
    console.log("invalid Atomic symbol specified");
    return {};
   }
  }
  if ((typeof(this.isotopes) != "object") || !Array.isArray(this.isotopes) || !this.isotopes.length) {
   console.log("uncaught error while constructing Atom");
   return {};
  }
 }
 
 var Hyperatom = function(params) {
  Atom.apply(this,arguments);
 }
 Hyperatom.prototype.convolute = function(convHa) {
  if ((typeof(convHa) != "object") || (convHa.constructor !== Hyperatom)) {
   console.log("can only convolute with another Hyperatom");
   return {};
  }
  var isotopeArray = Array.prototype.concat.apply([],
   this.isotopes.map((i) => convHa.isotopes.map((j) => [i[0]+j[0],i[1]*j[1]]))
  );
  var isotopeHash = {};
  isotopeArray.forEach(function(isotope) {
   if (typeof(isotopeHash[isotope[0]]) == "undefined") {
    isotopeHash[isotope[0]] = isotope[1];
   }
   else {
    isotopeHash[isotope[0]] += isotope[1];
   }
  });
  var finalArray = Object.keys(isotopeHash).map((i) => [parseFloat(i),isotopeHash[i]]);
  return new Hyperatom({isotopes:finalArray.filter((i) => (i[1] > FRACTION_LIMIT)).sort((a,b) => (a[0]-b[0]))})
 }
 Hyperatom.prototype.overZ = function(z) {
  return new Hyperatom({isotopes:this.isotopes.map((i) => [i[0]/z,i[1]])})
 }
 Hyperatom.prototype.asSpectrum = function() {
  return new MSLIB.Data.Spectrum(this.isotopes.map(e => e[0]),this.isotopes.map(e => e[1]));
 }
 
 var Molecule = function(params) {
  if (typeof(params) != "object") {
   console.log("parameters must be supplied as an object");
   return {};
  }
  if (typeof(params.atoms) == "object") {
   var els = Object.keys(params.atoms);
   this.atoms = {};
   Object.keys(params.atoms).forEach(function(ele) {
    if ((typeof(ele) == "string") && (typeof(params.atoms[ele]) == "number")) {
     var element = elementalConstants.getElementName(ele);
     if (element) {
      this.atoms[element] = params.atoms[ele];
     }
     else {
      console.log("element "+ele+" is unknown");
      return {};
     }
    }
    else {
     console.log("atoms parameter must be in form {element1:count1,element2:count2} etc");
     return {};
    }
   },this);
  }
  else {
   console.log("atoms parameter undefined");
   return {};
  }
 }
 
 var AminoAcid = function(params) {
  if (typeof(params) != "object") {
   console.log("parameters must be supplied as an object");
   return {};
  }
  Molecule.apply(this,arguments);
  if (typeof(params.lettercode) != "undefined") {
   if ((typeof(params.lettercode) == "string") && (params.lettercode.length == 1)) {
    this.lettercode = new RegExp(params.lettercode,"ig");
   }
   else {
    console.log("lettercode parameter must be a single character");
    return {};
   }
  }
  else {
   console.log("lettercode parameter undefined");
   return {};
  }
 }
 
 var Modification = function(params) {
  if (typeof(params) != "object") {
   console.log("parameters must be supplied as an object");
   return {};
  }
  Molecule.apply(this,arguments);
  if (typeof(params.name) != "undefined") {
   if ((typeof(params.name) == "string")) {
    this.name = params.name;
   }
   else {
    console.log("name parameter must be a string");
    return {};
   }
  }
  else {
   console.log("name parameter undefined");
   return {};
  }
 }
 
 var Peptide = function(params) {
  if (typeof(params) != "object") {
   console.log("parameters must be supplied as an object");
   return {};
  }
  if (typeof(params.sequence) != "undefined") {
   if (typeof(params.sequence) == "string") {
    this.sequence = params.sequence;
    var validationMatch = this.sequence.match(getValidationPattern());
    if (validationMatch) {
     this.atoms = {};
     Object.keys(water.atoms).forEach(function(ele) {
      this.atoms[ele] = water.atoms[ele];
     },this);
     Object.keys(aminoAcids).forEach(function(aa) {
      var aaMatches = this.sequence.match(aminoAcids[aa].lettercode);
      if (aaMatches) {
       var aaCount = aaMatches.length;
       var atomKeys = Object.keys(aminoAcids[aa].atoms);
       Object.keys(aminoAcids[aa].atoms).forEach(function(ele) {
        var aaAtoms = (aaCount * aminoAcids[aa].atoms[ele]);
        if (typeof(this.atoms[ele]) == "undefined") this.atoms[ele] = aaAtoms;
        else this.atoms[ele] += aaAtoms;
       },this);
      }
     },this);
     if (typeof(params.modifications) != "undefined") {
      if ((typeof(params.modifications) == "object") && Array.isArray(params.modifications) && !params.modifications.map((a) => ((typeof(a) != "object") || (a.constructor !== Modification))).reduce((a,b) => (a+b),0)) {
       this.modifications = params.modifications;
       this.modifications.forEach(function(mod) {
        Object.keys(mod.atoms).forEach(function(ele) {
         if (typeof(this.atoms[ele]) == "undefined") this.atoms[ele] = mod.atoms[ele];
         else this.atoms[ele] += mod.atoms[ele];
        },this);      
       },this);
      }
      else {
       console.log("modifications parameter must be an array of Modification objects");
       return {};
      }
     }
     if (typeof(params.charge) != "undefined") {
      if ((typeof(params.charge) == "number") && !isNaN(params.charge) && (function(x){return (x|0)===x;})(parseFloat(params.charge))) {
       this.charge = params.charge;
      }
      else {
       console.log("charge parameter must be an integer");
       return {};
      }
     }
     else {
      this.charge = 0;
     }
    }
    else {
     console.log("sequence parameter contains invalid characters: "+this.sequence);
     return {};
    }
   }
   else {
    console.log("sequence parameter must be a string");
    return {};
   }
  }
  else {
   console.log("sequence parameter undefined");
   return {};
  }
 }
 Peptide.prototype.getDistribution = function(altEleConst) {
  var distribution = new Hyperatom({isotopes:[[0,1]]});
  Object.keys(this.atoms).forEach(function(ele) {
   var hyperatomRequired = this.atoms[ele];
   if (this.charge >0 && ele == "Hydrogen") {
    hyperatomRequired += this.charge;
   }
   if (hyperatomRequired) {
    var binArray = hyperatomRequired.toString(2).split("").reverse().map((i) => parseInt(i));
    var maxExp = binArray.length-1;
    var intermediateHyperatom = {};
    if (altEleConst && altEleConst[ele]) {
     intermediateHyperatom[0] = new Hyperatom({isotopes:altEleConst[ele].isotopes});
    }
    else {
     intermediateHyperatom[0] = new Hyperatom({isotopes:elementalConstants[ele].isotopes});
    }
    for (var i = 0; i < maxExp; i++) {
     intermediateHyperatom[i+1] = intermediateHyperatom[i].convolute(intermediateHyperatom[i]);
    }
    var hyperatom = intermediateHyperatom[maxExp];
    for (var i = 0; i < maxExp; i++) {
     if (binArray[i]) {
      hyperatom = hyperatom.convolute(intermediateHyperatom[i]);
     }
    }
   distribution = distribution.convolute(hyperatom);
   }
  },this);
  if (this.charge) {
   distribution = distribution.overZ(this.charge);
   distribution.charge = this.charge
  }
  distribution
  return distribution;
 }
 Peptide.prototype.getCentroidedDistribution = function(ppmGap,altEleConst) {
  if (typeof(ppmGap) != "number") {
   console.log("Must provide ppm gap argument as a number")
   return {};
  }

  var maxGapRatio = (ppmGap / 1e6);
  var isotopes = this.getDistribution(altEleConst).isotopes;

  // Find maxima
  var isMax = MSLIB.Math.maxima(isotopes.map(iso => iso[1]),true);

//  console.log(isMax.map(m => (m ? 1 : 0)));
   
  // Add any peaks separated from all others by more than maxGap as maxima
  isotopes.forEach(function(iso,i) {
   if (
       (
        (i == 0) || 
        (((iso[0] - isotopes[i-1][0])/iso[0]) > maxGapRatio) ||
        (iso[1] > isotopes[i-1][1])
       ) && (
        (i == (isotopes.length-1)) || 
        (((isotopes[i+1][0] - iso[0])/iso[0]) > maxGapRatio) || 
        (iso[1] > isotopes[i+1][1])
       )
      ) {
    isMax[i] = true;
   }
  });
 
//  console.log("*****");
//  console.log(isMax.map(m => (m ? 1 : 0)));
  
  // Early finish if only one maxima
  if (isMax.reduce((a,b) => a+b) == 1) {
   return new Hyperatom({isotopes:[centroid(a)]});
  }

  // Then group to closest maxima
  var groups = [[]];
  var maxima = [];

  isotopes.forEach(function(iso,i) {
   if (isMax[i]) {
    maxima.push(i);
   }
  });

//  console.log(maxima.map(i => isotopes[i]));

  isotopes.forEach(function(iso,i) {
   if (i < maxima[0]) {
    groups[0].push(iso);
   }
   else if (i > maxima[maxima.length-1]) {
    groups[groups.length-1].push(iso);
   }
   else if (isMax[i]) {
    groups[groups.length-1].push(iso);
    if (groups.length < maxima.length) groups.push([]);
   }
   else {
    groups[groups.length-1-((iso[0]-isotopes[maxima[groups.length-2]][0]) <= (isotopes[maxima[groups.length-1]][0]-iso[0]))].push(iso);
   }
  });

//  console.log(groups);

  var centroidedGroups = groups.map((g) => centroid(g));
  var previousLength;

//  console.log(centroidedGroups);
 
  //Then, group maxima closer than ppmGap

  do {

   var groupedCentroidedGroups = [[centroidedGroups[0]]];
  
   for (var i = 1; i < centroidedGroups.length; i++) {
    if ((centroidedGroups[i][0] - centroidedGroups[i-1][0])/centroidedGroups[i][0] <= maxGapRatio) {
     groupedCentroidedGroups[groupedCentroidedGroups.length-1].push(centroidedGroups[i]);
    }
    else {
     groupedCentroidedGroups[groupedCentroidedGroups.length] = [centroidedGroups[i]];
    }
   }
   
   previousLength = centroidedGroups.length;

   centroidedGroups = groupedCentroidedGroups.map((g) => centroid(g));

  } while (centroidedGroups.length < previousLength);

  //Finally, remove any peaks representing less than 1% total intensity
  var finalCentroids = centroidedGroups.filter((i) => (i[1] > 0.01));

  return(new Hyperatom({isotopes:finalCentroids}));
 }
 
 //Define constants
 
 var elementalConstants = {
  getElementName : function(specifier) {
   if (elementalConstants[specifier]) return specifier;
   var matches = (Object.keys(elementalConstants).filter(function(ele) {
    if (!elementalConstants[ele].symbol) return false; 
    switch(specifier.toUpperCase()) {
     case ele.toUpperCase():
     case elementalConstants[ele].symbol: return true;
     default: return false;
    }
   }));
   if (matches.length == 1) {
    return matches[0];
   }
   else return undefined;
  }
 };

 //Using Fan et al constants
 elementalConstants["Carbon"]   = new Atom({
                                             symbol: "C",
                                             isotopes:[
                                              [12.0000000,  98.93],
                                              [13.0033554,   1.07]
                                             ]});
 elementalConstants["Hydrogen"] = new Atom({
                                             symbol: "H",
                                             isotopes:[
                                              [ 1.0078246,  99.985],
                                              [ 2.0141021,   0.015]
                                             ]});
 elementalConstants["Nitrogen"] = new Atom({
                                             symbol: "N",
                                             isotopes:[
                                              [14.0030732,  99.632],
                                              [15.0001088,   0.368]
                                             ]});
 elementalConstants["Oxygen"]   = new Atom({
                                             symbol: "O",
                                             isotopes:[
                                              [15.9949141,  99.757],
                                              [16.9991322,   0.038],
                                              [17.9991616,   0.205]
                                             ]});
 elementalConstants["Sulphur"]  = new Atom({
                                             symbol: "S",
                                             isotopes:[
                                              [31.9720700,  95.02],
                                              [32.9720700,   0.75],
                                              [33.9678660,   4.21],
                                              [35.9670800,   0.02]
                                             ]});

// elementalConstants["Carbon"]   = new Atom({
//                                             symbol: "C",
//                                             isotopes:[
//                                              [12.0000000,  98.8930],
//                                              [13.0033554,   1.0700]
//                                             ]});
// elementalConstants["Hydrogen"] = new Atom({
//                                             symbol: "H",
//                                             isotopes:[
//                                              [ 1.0078246,  99.9850],
//                                              [ 2.0141021,   0.0150]
//                                             ]});
// elementalConstants["Nitrogen"] = new Atom({
//                                             symbol: "N",
//                                             isotopes:[
//                                              [14.0030732,  99.6320],
//                                              [15.0001088,   0.3680]
//                                             ]});
// elementalConstants["Oxygen"]   = new Atom({
//                                             symbol: "O",
//                                             isotopes:[
//                                              [15.9949141,  99.7590],
//                                              [16.9991322,   0.0374],
//                                              [17.9991616,   0.2036]
//                                             ]});
// elementalConstants["Sulphur"]  = new Atom({
//                                             symbol: "S",
//                                             isotopes:[
//                                              [31.9720700,  95.0200],
//                                              [32.9720700,   0.7500],
//                                              [33.9678660,   4.2100],
//                                              [35.9670800,   0.0200]
//                                             ]});
 
 var water = new Molecule({atoms:{Hydrogen:2,Oxygen:1}});
 
 var aminoAcids = {};
 aminoAcids["Alanine"] =       new AminoAcid({
                                              lettercode:"A",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Arginine"] =      new AminoAcid({
                                              lettercode:"R",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:12,
                                               Nitrogen: 4,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Asparagine"] =    new AminoAcid({
                                              lettercode:"N",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 6,
                                               Nitrogen: 2,
                                               Oxygen  : 2
                                              }});
 aminoAcids["Aspartate"] =     new AminoAcid({
                                              lettercode:"D",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 3
                                              }});
 aminoAcids["Cysteine"] =      new AminoAcid({
                                              lettercode:"C",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 1,
                                               Sulphur : 1
                                              }});
 aminoAcids["Glutamate"] =     new AminoAcid({
                                              lettercode:"E",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 3
                                              }});
 aminoAcids["Glutamine"] =     new AminoAcid({
                                              lettercode:"Q",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 8,
                                               Nitrogen: 2,
                                               Oxygen  : 2
                                              }});
 aminoAcids["Glycine"] =       new AminoAcid({
                                              lettercode:"G",
                                              atoms:{
                                               Carbon  : 2,
                                               Hydrogen: 3,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Histidine"] =     new AminoAcid({
                                              lettercode:"H",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen: 7,
                                               Nitrogen: 3,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Isoleucine"] =    new AminoAcid({
                                              lettercode:"I",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:11,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Leucine"] =       new AminoAcid({
                                              lettercode:"L",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:11,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Lysine"] =        new AminoAcid({
                                              lettercode:"K",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:12,
                                               Nitrogen: 2,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Methionine"] =    new AminoAcid({
                                              lettercode:"M",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1,
                                               Sulphur : 1
                                              }});
 aminoAcids["Phenylalanine"] = new AminoAcid({
                                              lettercode:"F",
                                              atoms:{
                                               Carbon  : 9,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Proline"] =       new AminoAcid({
                                              lettercode:"P",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Serine"] =        new AminoAcid({
                                              lettercode:"S",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 aminoAcids["Threonine"] =     new AminoAcid({
                                              lettercode:"T",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 aminoAcids["Tryptophan"] =    new AminoAcid({
                                              lettercode:"W",
                                              atoms:{
                                               Carbon  :11,
                                               Hydrogen:10,
                                               Nitrogen: 2,
                                               Oxygen  : 1
                                              }});
 aminoAcids["Tyrosine"] =      new AminoAcid({
                                              lettercode:"Y",
                                              atoms:{
                                               Carbon  : 9,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 aminoAcids["Valine"] =        new AminoAcid({
                                              lettercode:"V",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 
 var getValidationPattern = function() {
  var availableLettercodes = {};
  Object.keys(aminoAcids).forEach(function(aa) {
   if (typeof(availableLettercodes[aminoAcids[aa].lettercode.source]) != "undefined") {
    console.log("warning - duplicate lettercode "+aminoAcids[aa].lettercode.source+" for "+aa);
   }
   availableLettercodes[aminoAcids[aa].lettercode.source] = 1;
  });
  return new RegExp("^["+Object.keys(availableLettercodes).join("")+"]+$","i");
 }
 
 var centroid = function(arr) {
  if ((typeof(arr) == "object") && Array.isArray(arr) && arr.every((a) => ((typeof(a) == "object") && Array.isArray(a)))) {
   var totInt = arr.reduce((acc,ele) => (acc+ele[1]), 0);
   var weightedMeanMass = arr.reduce((acc,ele) => (acc+(ele[0]*ele[1])/totInt), 0);
   return [weightedMeanMass,totInt];
  }
  else {
   console.log("array must be in form [[mass1,abundance1],[mass2,abundance2]] etc");
   return [];
  }
 }

 return {
  elementalConstants: elementalConstants,
  aminoAcids: aminoAcids,
  Modification: Modification,
  Atom : Atom,
  Hyperatom : Hyperatom,
  Peptide: Peptide,
  _SOURCE: _SOURCE
 }

}();