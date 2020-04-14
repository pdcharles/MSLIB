export let Peptide = function _SOURCE() {
 
 let _Peptide = function(data) {

  if (!('charge' in data)) throw new Error ('no precursor charge');
  this.charge = data.charge;

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

  this.calculate();
 };

 let accumulator = function(chainIdx,descending) {
  let acc = new mslib.data.Moiety();
  acc.n = 0;
  acc.chainIdx = chainIdx;
  acc.descending = descending;
  acc.nBranches = 0;
  acc.complete = false;
  return acc;
 }

 _Peptide.prototype.calculate = function() {
  this.traversals = {};
  this.uniqueResidues = {};
  this.products = {};
  this.productMasses = {};
  this.chainPrefix = new Array(this.chains.length);

  let numChainsOfType = this.chains.reduce((a,v) => { a[v.type] = (v.type in a ? a[v.type]+1 : 1); return a},{})

  for (let i = 0; i < this.chains.length; i++) {
   if (numChainsOfType[this.chains[i].type] == 1) {
    this.chainPrefix[i] = this.chains[i].notationSingular;
   }
   else {
    let ithChainOfType = this.chains.slice(0,i+1).filter(v => v.type==this.chains[i].type).length-1;
    this.chainPrefix[i] = this.chains[i].notationPlural[ithChainOfType];
   }
   traverseChain.call(this,
                      i,0,false,true,
                      new accumulator(i,false),JSON.parse(JSON.stringify(this.branches)));
   traverseChain.call(this,
                      i,this.chains[i].residueArray.length-1,true,true,
                      new accumulator(i,true),JSON.parse(JSON.stringify(this.branches)))
  }

  Object.entries(this.traversals).forEach(([k,v]) => {
   let prefix = this.chainPrefix[v.chainIdx];
   if (prefix.length > 0) {
    prefix += '|';
   }
   if (v.complete) {
    Object.entries(mslib.data[this.chains[v.chainIdx].type].products.nonfragment)
    .forEach(([notation,func]) => {
    let id = `${prefix}${notation}`
    this.products[id] = func(v);
    this.products[id].traversal = k;
    this.products[id].caption = id;
    this.products[id].type = 'nonfragment';
    });
   }
   else {
    Object.entries(mslib.data[this.chains[v.chainIdx].type].products[v.descending ? 'descending' : 'ascending'])
    .forEach(([notation,func]) => {
     let id = `${prefix}${notation}${v.n}`
     this.products[id] = func(v);
     this.products[id].traversal = k;
     this.products[id].caption = id;
     this.products[id].type = 'series';
    });
   }
  });
  Object.entries(this.uniqueResidues).forEach(([k,v]) => {
   let id = `i${k}`
   this.products[id] = mslib.data[v.type].products.immonium(v);
   this.products[id].caption = id;
   this.products[id].type = 'immonium';
  });
  
  Object.entries(this.products).filter(([k,v]) => v.type == 'nonfragment').forEach(([k,v]) => {
   this.productMasses[`${k}+`] = mslib.data.Moiety.monoisotopicMz(v,1);
  }); 
  Object.entries(this.products).filter(([k,v]) => v.type == 'series').forEach(([k,v]) => {
   this.productMasses[`${k}+`] = mslib.data.Moiety.monoisotopicMz(v,1);
   this.productMasses[`${k}++`] = mslib.data.Moiety.monoisotopicMz(v,2);
  }); 
  Object.entries(this.products).filter(([k,v]) => v.type == 'immonium').forEach(([k,v]) => {
   this.productMasses[`${k}+`] = mslib.data.Moiety.monoisotopicMz(v,1);
  }); 
 }

 let traverseChain = function(chainIdx,position,descending,storeTraversal,accumulator,branchesToDo) {

  let residue = this.chains[chainIdx].residueArray[position];
  let unit = { atoms: residue.atoms, symbol: { text: residue.token} }; 

  let unitHasBranch = false;

  if ((chainIdx in branchesToDo) && (position in branchesToDo[chainIdx])) {
   let [branchChainIdx,branchChainPosition,branchNetAdjust] = branchesToDo[chainIdx][position];
   if (typeof(branchNetAdjust) != 'object'
       || !('atoms' in branchNetAdjust) 
      ) {
    console.log('Not following');
    //Do not follow branches of unknown type (or include branch residue)
    return(accumulator);
   }
   delete(branchesToDo[chainIdx][position]);
   delete(branchesToDo[branchChainIdx][branchChainPosition]);
   let branchAccumulatorAsc = new mslib.data.Moiety();
   branchAccumulatorAsc.n = 0;
   branchAccumulatorAsc.chainIdx = branchChainIdx;
   let branch = mslib.data[this.chains[branchChainIdx].type].products.nonfragment.p(traverseChain.call(this,branchChainIdx,0,false,false,branchAccumulatorAsc,branchesToDo));
   unit = mslib.data.Moiety.add(unit, { atoms:branch.atoms, symbol:{ text:`(${branch.symbol.text})`} });
   unitHasBranch = true;
   if (typeof(branchNetAdjust) == 'object' && 'atoms' in branchNetAdjust) {
    unit = mslib.data.Moiety.add(unit, branchNetAdjust);
   }
  }
  else {
   //Assume no immonium ion if a branch node
   if (!(residue.token in this.uniqueResidues)) {
    this.uniqueResidues[residue.token] = residue;
    this.uniqueResidues[residue.token].type = this.chains[chainIdx].type
   }
  }

  if (descending) accumulator = mslib.data.Moiety.add(unit,accumulator);
  else accumulator = mslib.data.Moiety.add(accumulator,unit);
  accumulator.n++;
  if (unitHasBranch) accumulator.nBranches++;
  
  if (storeTraversal) {
   if ((descending && position == 0) || (!descending && position == this.chains[chainIdx].residueArray.length-1)) {
    accumulator.complete = true;
   }
   let key = (descending ? '←' : '→')+chainIdx+'_'+position+'_'+residue.token+'['+accumulator.n+']'+'¥'.repeat(accumulator.nBranches);
   if (!(key in this.traversals)) {
    this.traversals[key] = accumulator;
    this.traversals[key].caption=null;
   }
  }

  if (descending) {
   if (position > 0) {
    return(traverseChain.call(this,chainIdx,position-1,true,storeTraversal,accumulator,branchesToDo));
   }
  }
  else {
   if (position < (this.chains[chainIdx].residueArray.length-1)) {
    return(traverseChain.call(this,chainIdx,position+1,false,storeTraversal,accumulator,branchesToDo));
   }
  }
//  console.log('endchain');
  return(accumulator);
 }


 _Peptide._SOURCE = _SOURCE;

 return _Peptide;

}();