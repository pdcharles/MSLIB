export let Peptide = function _SOURCE() {
 
 let _Peptide = function(data) {

  if (!('chains' in data) || data.chains.length < 1) throw new Error ('no primary');

  this.chains = data.chains;
  if ('branches' in data) {
   this.branches = data.branches;
   Object.entries(data.branches).forEach(([chainIdx,positions]) => {
    Object.entries(positions).forEach(([p,branch]) => {
     let [branchChainIdx,branchChainPosition] = branch;
     if (!(branchChainIdx in this.branches)) this.branches[branchChainIdx] = {};
     this.branches[branchChainIdx][branchChainPosition] = [+chainIdx,+p];
    });
   });
  }
  else this.branches = {};

  this.calculate();
 };

 _Peptide.prototype.calculate = function() {
  this.subsets = {};
  this.uniqueResidues = {};
  this.products = {};
  this.productMasses = {};

  for (let i = 0; i < this.chains.length; i++) {
//   console.log('chain '+i);
   let accumulatorAsc = new mslib.data.Moiety();
   accumulatorAsc.n = 0;
   accumulatorAsc.chainIdx = i;
   accumulatorAsc.descending = false;
   traverseChain.call(this,
                      i,0,false,true,
                      accumulatorAsc,JSON.parse(JSON.stringify(this.branches)));
   let accumulatorDesc = new mslib.data.Moiety();
   accumulatorDesc.n = 0;
   accumulatorDesc.chainIdx = i;
   accumulatorDesc.descending = true;
   traverseChain.call(this,
                      i,this.chains[i].residueArray.length-1,true,true,
                      accumulatorDesc,JSON.parse(JSON.stringify(this.branches)))
  }

  Object.entries(this.subsets).forEach(([k,v]) => {
    Object.entries(mslib.data[this.chains[v.chainIdx].type].products[v.descending ? 'descending' : 'ascending'])
    .forEach(([notation,func]) => {
    let id = `${v.chainIdx}${notation}${v.n}`
     this.products[id] = func(v);
    this.products[id].subsetKey = k;
     this.products[id].caption = id;
    });
  });
  Object.entries(this.uniqueResidues).forEach(([k,v]) => {
   let id = `${v.chainIdx}i${k}`
   this.products[id] = mslib.data[v.type].products.immonium(v);
   this.products[id].caption = id;
  });
//  this.chains.forEach((chain,i) => {
//   Object.entries(mslib.data[chain.type].products.nonfragment)
//   .forEach(([notation,func]) => {
//    let id = `${i}${notation}`
//    this.products[id] = func(chain);
//    this.products[id].caption = id;
//   });
//  });
  
  Object.entries(this.products).forEach(([k,v]) => {
   this.productMasses[k] = mslib.data.Moiety.monoisotopicMz(v,1)
  }); 
 }

 let traverseChain = function(chainIdx,position,descending,storeSubset,accumulator,branchesToDo) {

  let residue = this.chains[chainIdx].residueArray[position];

  if (!(residue.token in this.uniqueResidues)) {
   this.uniqueResidues[residue.token] = residue;
   this.uniqueResidues[residue.token].type = this.chains[chainIdx].type
  }

  let unit = { atoms: residue.atoms, symbol: { text: residue.token} };

  if ((chainIdx in branchesToDo) && (position in branchesToDo[chainIdx])) {
   let [branchChainIdx,branchChainPosition] = branchesToDo[chainIdx][position];
   delete(branchesToDo[chainIdx][position]);
   delete(branchesToDo[branchChainIdx][branchChainPosition]);
//   console.log('branch');
   let branchAccumulatorAsc = new mslib.data.Moiety();
   branchAccumulatorAsc.n = 0;
   branchAccumulatorAsc.chainIdx = branchChainIdx;
   let branch = mslib.data[this.chains[branchChainIdx].type].products.nonfragment.p(traverseChain.call(this,branchChainIdx,0,false,false,branchAccumulatorAsc,branchesToDo));
   unit = mslib.data.Moiety.add(unit, { atoms:branch.atoms, symbol:{ text:`(${branch.symbol.text})`} });
//   console.log('endbranch');
//   console.log(branchesToDo);
  }

  if (descending) accumulator = mslib.data.Moiety.add(unit,accumulator);
  else accumulator = mslib.data.Moiety.add(accumulator,unit);
  accumulator.n++;
  
  if (storeSubset) {
   let subsetCode = (descending ? '←' : '→')+chainIdx+'_'+position+'_'+residue.token+'['+accumulator.n+']';
  
   if (!(subsetCode in this.subsets)) {
    this.subsets[subsetCode] = accumulator;
    this.subsets[subsetCode].caption=null;
//    console.log(subsetCode);
//    console.log(accumulator);
   }
  }

  if (descending) {
   if (position > 0) {
    //fragions
    return(traverseChain.call(this,chainIdx,position-1,true,storeSubset,accumulator,branchesToDo));
   }
  }
  else {
   if (position < (this.chains[chainIdx].residueArray.length-1)) {
    //fragions
    return(traverseChain.call(this,chainIdx,position+1,false,storeSubset,accumulator,branchesToDo));
   }
  }
//  console.log('endchain');
  return(accumulator);
 }


 _Peptide._SOURCE = _SOURCE;

 return _Peptide;

}();