export let Peptide = function _SOURCE() {
 
 let _Peptide = function(data) {
 // alt call  : function(sequence, charge, modifications)

  if (typeof(data) === 'string' && arguments.length > 1 && typeof(arguments[1]) === 'number') {
   let mods = arguments.length > 2 && typeof(arguments[2]) === 'object' ? arguments[2] : {};
   data = { 
    charge: arguments[1],
    chains: [
     new mslib.data.AminoAcidChain({
      sequenceString: data,
      residueDefinitions: {},
      modificationDefinitions: {},
      fixedModifications: {},
      variableModifications: mods
     })
    ]
   }
  }

  if (!('charge' in data)) throw new Error ('no precursor charge');
  this.charge = +data.charge;

  if (!('chains' in data) || data.chains.length < 1) throw new Error ('no primary');
  this.chains = data.chains;

  if ('branches' in data) {
   this.branches = data.branches;
   Object.entries(data.branches).forEach(([chainIdx,positions]) => {
    Object.entries(positions).forEach(([p,branch]) => {
     let [branchChainIdx,branchChainPosition,branchNetAdjust] = branch;
     if (!(branchChainIdx in this.branches)) this.branches[branchChainIdx] = {};
     this.branches[branchChainIdx][branchChainPosition] = [+chainIdx,+p,branchNetAdjust];
    });
   });
  }
  else this.branches = {};

  if ('elements' in data) {
   this.elements = data.elements;
  }
  else this.elements = mslib.constants.ELEMENTS;

  if ('quickCalculateMzs' in data) {
   this.quickCalculateMzs = data.quickCalculateMzs;
  }
  else this.quickCalculateMzs = true;
 };

 let Accumulator = function(chainIdx,descending) {
  let acc = mslib.moietymath.blank();
  acc.chainIdx = chainIdx;
  acc.descending = descending;
  acc.nResiduesThisChain = 0;
  acc.nResiduesAllChains = 0;
  acc.nBranches = 0;
  acc.complete = false;
  return acc;
 }

 _Peptide.prototype.calculate = function() {
  return new Promise((resolve,reject) => {
   this.traversals = {};
   this.uniqueResidues = {};
   this.products = {};
   this.productIons = {};
   this.chainPrefix = new Array(this.chains.length);

   let numChainsOfType = this.chains.reduce((a,v) => { a[v.type] = (v.type in a ? a[v.type]+1 : 1); return a},{});

   for (let i = 0; i < this.chains.length; i++) {
    this.chains[i].nOfType = numChainsOfType[this.chains[i].type];
    if (this.chains[i].nOfType == 1) {
     this.chainPrefix[i] = this.chains[i].notationSingular;
    }
    else {
     let ithChainOfType = this.chains.slice(0,i+1).filter(v => v.type==this.chains[i].type).length-1;
     this.chainPrefix[i] = this.chains[i].notationPlural[ithChainOfType];
    }
    traverseChain.call(this,
                       i,0,false,true,
                       new Accumulator(i,false),JSON.parse(JSON.stringify(this.branches)));
    traverseChain.call(this,
                       i,this.chains[i].residues.length-1,true,true,
                       new Accumulator(i,true),JSON.parse(JSON.stringify(this.branches)))
   }

   Object.entries(this.traversals).forEach(([k,v]) => {
    let prefix = this.chainPrefix[v.chainIdx];
    if (v.complete) {
     Object.entries(mslib.data[this.chains[v.chainIdx].type].products.nonfragment)
     .forEach(([notation,func]) => {
      let id = `${prefix}${notation}`
      if (id in this.products) {
       this.products[id].traversal += (';'+k);
      }
      else {
       this.products[id] = func(v);
       delete(this.products[id]).descending;
       delete(this.products[id]).unitGained;
       this.products[id].traversal = k;
       this.products[id].id = id;
       this.products[id].group = 'nonfragment';
       this.products[id].type = notation;
      }
     });
    }
    else {
     Object.entries(mslib.data[this.chains[v.chainIdx].type].products[v.descending ? 'descending' : 'ascending'])
     .forEach(([notation,func]) => {
      let id = `${prefix}${notation}${v.nResiduesThisChain}`
      this.products[id] = func(v);
      this.products[id].traversal = k;
      this.products[id].id = id;
      this.products[id].group = 'series';
      this.products[id].type = notation;
     });
    }
   });
   Object.entries(this.uniqueResidues).forEach(([k,v]) => {
    let id = `i${k}`
    this.products[id] = mslib.data[v.type].products.immonium(v);
    this.products[id].id = id;
    this.products[id].group = 'immonium';
    this.products[id].type = 'i';
   });

   let getTop2Mzs = this.quickCalculateMzs ?
    (v,charge) => mslib.moietymath.monoAndPlusOneMz(v,charge,this.elements) :
    (v,charge) => mslib.moietymath.topNMz(2,v,charge,this.elements);

   Object.entries(this.products).filter(([k,v]) => v.group == 'nonfragment').forEach(([k,v]) => {
    let similar = Object.values(this.products).filter(v2 => v2.type == v.type);
    if ((k == similar[0].id) && similar.every(vs => mslib.moietymath.equalComposition(vs,v))) {
     this.productIons[`${v.type}${'+'.repeat(this.charge)}`] = {
      mzs: getTop2Mzs(v,this.charge),
      charge: this.charge,
      products: similar
     };
    }
    else {
     this.productIons[`${k}${'+'.repeat(this.charge)}`] = {
      mzs: getTop2Mzs(v,this.charge),
      charge: this.charge,
      products: [v]
     };
    }
   });

   Object.entries(this.products).filter(([k,v]) => v.group == 'series').forEach(([k,v]) => {
    this.productIons[`${k}+`] = {
     mzs: getTop2Mzs(v,1),
     charge: 1,
     products: [v]
    };
    this.productIons[`${k}++`] = {
     mzs: getTop2Mzs(v,2),
     charge: 2,
     products: [v]
    };
   });

   Object.entries(this.products).filter(([k,v]) => v.group == 'immonium').forEach(([k,v]) => {
    this.productIons[`${k}+`] = {
     mzs: getTop2Mzs(v,1),
     charge: 1,
     products: [v]
    };
   });
  });

 }

 let traverseChain = function(chainIdx,position,descending,storeTraversal,chainAccumulator,branchesToDo) {

  let residue = this.chains[chainIdx].residues[position];
  let unit = { atoms: residue.atoms, symbol: { text: residue.token} }; 

  let unitHasBranch = false;

  if ((chainIdx in branchesToDo) && (position in branchesToDo[chainIdx])) {
   let [branchChainIdx,branchChainPosition,branchNetAdjust] = branchesToDo[chainIdx][position];
   if (typeof(branchNetAdjust) != 'object'
       || !('atoms' in branchNetAdjust) 
      ) {
    console.log('Not following');
    //Do not follow branches of unknown type (or include branch residue)
    return(chainAccumulator);
   }
   delete(branchesToDo[chainIdx][position]);
   delete(branchesToDo[branchChainIdx][branchChainPosition]);
   let branchAccumulatorAsc = new Accumulator(branchChainIdx,false);
   let branch = mslib.data[this.chains[branchChainIdx].type].products.nonfragment.p(traverseChain.call(this,branchChainIdx,0,false,false,branchAccumulatorAsc,branchesToDo));
   unit = mslib.moietymath.add(unit, { atoms:branch.atoms, nResiduesAllChains: branch.nResiduesAllChains, symbol:{ text:`(${branch.symbol.text})`} });
   unitHasBranch = true;
   if (typeof(branchNetAdjust) == 'object' && 'atoms' in branchNetAdjust) {
    unit = mslib.moietymath.add(unit, branchNetAdjust);
   }
  }
  else {
   //Assume no immonium ion if a branch node
   if (!(residue.token in this.uniqueResidues)) {
    this.uniqueResidues[residue.token] = residue;
    this.uniqueResidues[residue.token].type = this.chains[chainIdx].type
   }
  }

  if (descending) chainAccumulator = mslib.moietymath.add(unit,chainAccumulator);
  else chainAccumulator = mslib.moietymath.add(chainAccumulator,unit);
  chainAccumulator.nResiduesThisChain++;
  chainAccumulator.nResiduesAllChains++;
  chainAccumulator.unitGained = unit;
  if (unitHasBranch) {
   chainAccumulator.nBranches++;
   chainAccumulator.nResiduesAllChains+=unit.nResiduesAllChains;
  }
  
  if (storeTraversal) {
   if ((descending && position == 0) || (!descending && position == this.chains[chainIdx].residues.length-1)) {
    chainAccumulator.complete = true;
   }
   let key = (descending ? '←' : '→')+chainIdx+'_'+position+'_'+residue.token+'['+chainAccumulator.nResiduesThisChain+']'+'¥'.repeat(chainAccumulator.nBranches);
   if (!(key in this.traversals)) {
    this.traversals[key] = chainAccumulator;
    this.traversals[key].traversal = key;
   }
  }

  if (descending) {
   if (position > 0) {
    return(traverseChain.call(this,chainIdx,position-1,true,storeTraversal,chainAccumulator,branchesToDo));
   }
  }
  else {
   if (position < (this.chains[chainIdx].residues.length-1)) {
    return(traverseChain.call(this,chainIdx,position+1,false,storeTraversal,chainAccumulator,branchesToDo));
   }
  }
//  console.log('endchain');
  return(chainAccumulator);
 }


 _Peptide._SOURCE = _SOURCE;

 return _Peptide;

}();