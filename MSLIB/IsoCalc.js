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
    var abundance_total = 0;
    params.isotopes.forEach(function(isotope) {
     if (Array.isArray(isotope) && (isotope.length == 2) && (typeof(isotope[0]) == "number") && (typeof(isotope[1]) == "number")) {
      abundance_total += isotope[1];
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
     this.isotopes[i][1] = isotope[1]/abundance_total;
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
 Hyperatom.prototype.convolute = function(conv_ha) {
  if ((typeof(conv_ha) != "object") || (conv_ha.constructor !== Hyperatom)) {
   console.log("can only convolute with another Hyperatom");
   return {};
  }
  var isotope_array = Array.prototype.concat.apply([],
   this.isotopes.map((i) => conv_ha.isotopes.map((j) => [i[0]+j[0],i[1]*j[1]]))
  );
  var isotope_hash = {};
  isotope_array.forEach(function(isotope) {
   if (typeof(isotope_hash[isotope[0]]) == "undefined") {
    isotope_hash[isotope[0]] = isotope[1];
   }
   else {
    isotope_hash[isotope[0]] += isotope[1];
   }
  });
  var final_array = Object.keys(isotope_hash).map((i) => [parseFloat(i),isotope_hash[i]]);
  var final_array_filtered_and_sorted = final_array.filter((i) => (i[1] > FRACTION_LIMIT)).sort((a,b) => (a[0]-b[0]));
  return new Hyperatom({isotopes:final_array_filtered_and_sorted})
 }
 Hyperatom.prototype.overZ = function(z) {
  var isotopes_over_z = this.isotopes.map((i) => [i[0]/z,i[1]]);
  return new Hyperatom({isotopes:isotopes_over_z})
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
     var element = ElementalConstants.getElementName(ele);
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
    var validation_match = this.sequence.match(getValidationPattern());
    if (validation_match) {
     this.atoms = {};
     Object.keys(water.atoms).forEach(function(ele) {
      this.atoms[ele] = water.atoms[ele];
     },this);
     Object.keys(AminoAcids).forEach(function(aa) {
      var aa_matches = this.sequence.match(AminoAcids[aa].lettercode);
      if (aa_matches) {
       var aa_count = aa_matches.length;
       var atom_keys = Object.keys(AminoAcids[aa].atoms);
       Object.keys(AminoAcids[aa].atoms).forEach(function(ele) {
        var aa_atoms = (aa_count * AminoAcids[aa].atoms[ele]);
        if (typeof(this.atoms[ele]) == "undefined") this.atoms[ele] = aa_atoms;
        else this.atoms[ele] += aa_atoms;
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
   var hyperatom_required = this.atoms[ele];
   if (this.charge >0 && ele == "Hydrogen") {
    hyperatom_required += this.charge;
   }
   if (hyperatom_required) {
    var bin_array = hyperatom_required.toString(2).split("").reverse().map((i) => parseInt(i));
    var max_exp = bin_array.length-1;
    var intermediate_hyperatom = {};
    if (altEleConst && altEleConst[ele]) {
     intermediate_hyperatom[0] = new Hyperatom({isotopes:altEleConst[ele].isotopes});
    }
    else {
     intermediate_hyperatom[0] = new Hyperatom({isotopes:ElementalConstants[ele].isotopes});
    }
    for (var i = 0; i < max_exp; i++) {
     intermediate_hyperatom[i+1] = intermediate_hyperatom[i].convolute(intermediate_hyperatom[i]);
    }
    var hyperatom = intermediate_hyperatom[max_exp];
    for (var i = 0; i < max_exp; i++) {
     if (bin_array[i]) {
      hyperatom = hyperatom.convolute(intermediate_hyperatom[i]);
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
 Peptide.prototype.getCentroidedDistribution = function(ppm_gap,altEleConst) {
  if (typeof(ppm_gap) != "number") {
   console.log("Must provide ppm gap argument as a number")
   return {};
  }

  var max_gap_ratio = (ppm_gap / 1e6);
  var isotopes = this.getDistribution(altEleConst).isotopes;

  // Find maxima
  var is_max = MSLIB.Math.maxima(isotopes.map(iso => iso[1]),true);

//  console.log(is_max.map(m => (m ? 1 : 0)));
   
  // Add any peaks separated from all others by more than max_gap as maxima
  isotopes.forEach(function(iso,i) {
   if (
       (
        (i == 0) || 
        (((iso[0] - isotopes[i-1][0])/iso[0]) > max_gap_ratio) ||
        (iso[1] > isotopes[i-1][1])
       ) && (
        (i == (isotopes.length-1)) || 
        (((isotopes[i+1][0] - iso[0])/iso[0]) > max_gap_ratio) || 
        (iso[1] > isotopes[i+1][1])
       )
      ) {
    is_max[i] = true;
   }
  });
 
//  console.log("*****");
//  console.log(is_max.map(m => (m ? 1 : 0)));
  
  // Early finish if only one maxima
  if (is_max.reduce((a,b) => a+b) == 1) {
//   console.log(first_max,last_max)
   return new Hyperatom({isotopes:[centroid(a)]});
  }

  // Then group to closest maxima
  var groups = [[]];
  var maxima = [];

  isotopes.forEach(function(iso,i) {
   if (is_max[i]) {
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
   else if (is_max[i]) {
    groups[groups.length-1].push(iso);
    if (groups.length < maxima.length) groups.push([]);
   }
   else {
    groups[groups.length-1-((iso[0]-isotopes[maxima[groups.length-2]][0]) <= (isotopes[maxima[groups.length-1]][0]-iso[0]))].push(iso);
   }
  });

//  console.log(groups);

  var centroided_groups = groups.map((g) => centroid(g));
  var previous_length;

//  console.log(centroided_groups);
 
  //Then, group maxima closer than ppm_gap

  do {

   var grouped_cgs = [[centroided_groups[0]]];
  
   for (var i = 1; i < centroided_groups.length; i++) {
    if ((centroided_groups[i][0] - centroided_groups[i-1][0])/centroided_groups[i][0] <= max_gap_ratio) {
     grouped_cgs[grouped_cgs.length-1].push(centroided_groups[i]);
    }
    else {
     grouped_cgs[grouped_cgs.length] = [centroided_groups[i]];
    }
   }
   
   previous_length = centroided_groups.length;

   centroided_groups = grouped_cgs.map((g) => centroid(g));

  } while (centroided_groups.length < previous_length);

  //Finally, remove any peaks representing less than 1% total intensity
  var final_centroids = centroided_groups.filter((i) => (i[1] > 0.01));

  return(new Hyperatom({isotopes:final_centroids}));
 }
 
 //Define constants
 
 var ElementalConstants = {
  getElementName : function(specifier) {
   if (ElementalConstants[specifier]) return specifier;
   var matches = (Object.keys(ElementalConstants).filter(function(ele) {
    if (!ElementalConstants[ele].symbol) return false; 
    switch(specifier.toUpperCase()) {
     case ele.toUpperCase():
     case ElementalConstants[ele].symbol: return true;
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
 ElementalConstants["Carbon"]   = new Atom({
                                             symbol: "C",
                                             isotopes:[
                                              [12.0000000,  98.93],
                                              [13.0033554,   1.07]
                                             ]});
 ElementalConstants["Hydrogen"] = new Atom({
                                             symbol: "H",
                                             isotopes:[
                                              [ 1.0078246,  99.985],
                                              [ 2.0141021,   0.015]
                                             ]});
 ElementalConstants["Nitrogen"] = new Atom({
                                             symbol: "N",
                                             isotopes:[
                                              [14.0030732,  99.632],
                                              [15.0001088,   0.368]
                                             ]});
 ElementalConstants["Oxygen"]   = new Atom({
                                             symbol: "O",
                                             isotopes:[
                                              [15.9949141,  99.757],
                                              [16.9991322,   0.038],
                                              [17.9991616,   0.205]
                                             ]});
 ElementalConstants["Sulphur"]  = new Atom({
                                             symbol: "S",
                                             isotopes:[
                                              [31.9720700,  95.02],
                                              [32.9720700,   0.75],
                                              [33.9678660,   4.21],
                                              [35.9670800,   0.02]
                                             ]});

// ElementalConstants["Carbon"]   = new Atom({
//                                             symbol: "C",
//                                             isotopes:[
//                                              [12.0000000,  98.8930],
//                                              [13.0033554,   1.0700]
//                                             ]});
// ElementalConstants["Hydrogen"] = new Atom({
//                                             symbol: "H",
//                                             isotopes:[
//                                              [ 1.0078246,  99.9850],
//                                              [ 2.0141021,   0.0150]
//                                             ]});
// ElementalConstants["Nitrogen"] = new Atom({
//                                             symbol: "N",
//                                             isotopes:[
//                                              [14.0030732,  99.6320],
//                                              [15.0001088,   0.3680]
//                                             ]});
// ElementalConstants["Oxygen"]   = new Atom({
//                                             symbol: "O",
//                                             isotopes:[
//                                              [15.9949141,  99.7590],
//                                              [16.9991322,   0.0374],
//                                              [17.9991616,   0.2036]
//                                             ]});
// ElementalConstants["Sulphur"]  = new Atom({
//                                             symbol: "S",
//                                             isotopes:[
//                                              [31.9720700,  95.0200],
//                                              [32.9720700,   0.7500],
//                                              [33.9678660,   4.2100],
//                                              [35.9670800,   0.0200]
//                                             ]});
 
 var water = new Molecule({atoms:{Hydrogen:2,Oxygen:1}});
 
 var AminoAcids = {};
 AminoAcids["Alanine"] =       new AminoAcid({
                                              lettercode:"A",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Arginine"] =      new AminoAcid({
                                              lettercode:"R",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:12,
                                               Nitrogen: 4,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Asparagine"] =    new AminoAcid({
                                              lettercode:"N",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 6,
                                               Nitrogen: 2,
                                               Oxygen  : 2
                                              }});
 AminoAcids["Aspartate"] =     new AminoAcid({
                                              lettercode:"D",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 3
                                              }});
 AminoAcids["Cysteine"] =      new AminoAcid({
                                              lettercode:"C",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 1,
                                               Sulphur : 1
                                              }});
 AminoAcids["Glutamate"] =     new AminoAcid({
                                              lettercode:"E",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 3
                                              }});
 AminoAcids["Glutamine"] =     new AminoAcid({
                                              lettercode:"Q",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 8,
                                               Nitrogen: 2,
                                               Oxygen  : 2
                                              }});
 AminoAcids["Glycine"] =       new AminoAcid({
                                              lettercode:"G",
                                              atoms:{
                                               Carbon  : 2,
                                               Hydrogen: 3,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Histidine"] =     new AminoAcid({
                                              lettercode:"H",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen: 7,
                                               Nitrogen: 3,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Isoleucine"] =    new AminoAcid({
                                              lettercode:"I",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:11,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Leucine"] =       new AminoAcid({
                                              lettercode:"L",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:11,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Lysine"] =        new AminoAcid({
                                              lettercode:"K",
                                              atoms:{
                                               Carbon  : 6,
                                               Hydrogen:12,
                                               Nitrogen: 2,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Methionine"] =    new AminoAcid({
                                              lettercode:"M",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1,
                                               Sulphur : 1
                                              }});
 AminoAcids["Phenylalanine"] = new AminoAcid({
                                              lettercode:"F",
                                              atoms:{
                                               Carbon  : 9,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Proline"] =       new AminoAcid({
                                              lettercode:"P",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Serine"] =        new AminoAcid({
                                              lettercode:"S",
                                              atoms:{
                                               Carbon  : 3,
                                               Hydrogen: 5,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 AminoAcids["Threonine"] =     new AminoAcid({
                                              lettercode:"T",
                                              atoms:{
                                               Carbon  : 4,
                                               Hydrogen: 7,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 AminoAcids["Tryptophan"] =    new AminoAcid({
                                              lettercode:"W",
                                              atoms:{
                                               Carbon  :11,
                                               Hydrogen:10,
                                               Nitrogen: 2,
                                               Oxygen  : 1
                                              }});
 AminoAcids["Tyrosine"] =      new AminoAcid({
                                              lettercode:"Y",
                                              atoms:{
                                               Carbon  : 9,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 2
                                              }});
 AminoAcids["Valine"] =        new AminoAcid({
                                              lettercode:"V",
                                              atoms:{
                                               Carbon  : 5,
                                               Hydrogen: 9,
                                               Nitrogen: 1,
                                               Oxygen  : 1
                                              }});
 
 var getValidationPattern = function() {
  var available_lettercodes = {};
  Object.keys(AminoAcids).forEach(function(aa) {
   if (typeof(available_lettercodes[AminoAcids[aa].lettercode.source]) != "undefined") {
    console.log("warning - duplicate lettercode "+AminoAcids[aa].lettercode.source+" for "+aa);
   }
   available_lettercodes[AminoAcids[aa].lettercode.source] = 1;
  });
  return new RegExp("^["+Object.keys(available_lettercodes).join("")+"]+$","i");
 }
 
 var centroid = function(arr) {
  if ((typeof(arr) == "object") && Array.isArray(arr) && arr.every((a) => ((typeof(a) == "object") && Array.isArray(a)))) {
   var tot_int = arr.reduce((acc,ele) => (acc+ele[1]), 0);
   var weighted_mean_mass = arr.reduce((acc,ele) => (acc+(ele[0]*ele[1])/tot_int), 0);
   return [weighted_mean_mass,tot_int];
  }
  else {
   console.log("array must be in form [[mass1,abundance1],[mass2,abundance2]] etc");
   return [];
  }
 }

 return {
  ElementalConstants: ElementalConstants,
  AminoAcids: AminoAcids,
  Modification: Modification,
  Atom : Atom,
  Hyperatom : Hyperatom,
  Peptide: Peptide,
  _SOURCE: _SOURCE
 }

}();