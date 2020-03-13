export let ResidueChain = function _SOURCE() {

 const multiplierRegex = new RegExp(/^\(([1-9]\d*)\)/);

 let _ResidueChain = function(residueData,baseResidues) {

  this.type = null;

  if (typeof(residueData) === 'string') residueData = { sequenceString : residueData };

  if (!residueData.modificationNotationStyles) residueData.modificationNotationStyles = { 'modX' : true, 'X(mod)' : true, 'X[mod]' : true }

  let possibleResiduesByToken = Object.entries(baseResidues).reduce((obj,[key,residue]) => { 
   obj[residue.token] = residue;
   obj[residue.token].label = key;
   return obj;
  },{});

  if ('residueDefinitions' in residueData) {
   this.possibleResiduesByToken = Object.entries(residueData.residueDefinitions).reduce((obj,[key,residue]) => { 
    obj[residue.token] = residue;
    obj[residue.token].label = key;
    return obj;
   },possibleResiduesByToken);
  }

  if ('modificationDefinitions' in residueData) {
   Object.entries(residueData.modificationDefinitions).forEach(([key,v]) => {
    if (Number.isInteger(+key)) throw new Error('ResidueChainIllegalModification \''+key+'\'');
    if (v.allowedResidues) v.allowedResidues.forEach(residueToken => {
     if (!(residueToken in possibleResiduesByToken)) throw new Error('ResidueChainIllegalModifiedResidueToken \''+residueToken+'\'');
     modifiedResidue = mslib.data.Moiety.add(possibleResiduesByToken[residueToken],v.atoms,key.toLowerCase()+residueToken);
     if (residueData.modificationNotationStyles['modX']) possibleResiduesByToken[key.toLowerCase()+residueToken] = modifiedResidue;
     if (residueData.modificationNotationStyles['X(mod)']) possibleResiduesByToken[residue+'('+key+')'] = modifiedResidue;
     if (residueData.modificationNotationStyles['X[mod]']) possibleResiduesByToken[residue+'['+key+']'] = modifiedResidue;
    });
   });
  }

  let [ tokens, massDeltas ] = getTokensAndMassDeltas(residueData.sequenceString,possibleResiduesByToken);
  this.residueArray = tokens.map((t,i) => {
   let residue;
   if (t in possibleResiduesByToken) {
    residue = mslib.data.Moiety.clone(possibleResiduesByToken[t]);
    if (massDeltas[i]) residue = mslib.data.Moiety.addMassDelta(residue,massDeltas[i]);
    return residue;
   }
   else throw new Error('ResidueChainUnknownToken \''+t+'\'');
  })

  if (residueData.fixedModifications) {
   Object.entries(residueData.fixedModifications).forEach(([key,v]) => {
    let [ tokens, undefined ] = getTokensAndMassDeltas(key,possibleResiduesByToken)
    if (Number.isInteger(+v)) {
     this.residueArray.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.symbol)) this.residueArray[pos] = mslib.data.Moiety.addMassDelta(residue,+v,residue.symbol)
     });
    }
    else {
     if (typeof(v) === 'string') {
      if (residueData.modificationDefinitions[v]) v = residueData.modificationDefinitions[v];
      else throw new Error('ResidueChainUndefinedFixedModification');
     }
     else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedFixedModicationDefinition');
     this.residueArray.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.symbol)) this.residueArray[pos] = mslib.data.Moiety.add(residue,v,residue.symbol);
     });
    }
   });
  }
  if (residueData.variableModifications) {
   Object.entries(residueData.variableModifications).forEach(([key,v]) => {
    if (Number.isInteger(+key)) {
     let pos = +key-1;
     if (Number.isInteger(+v)) {
      this.residueArray[pos] = mslib.data.Moiety.addMassDelta(this.residueArray[pos],+v,this.residueArray[pos].symbol);
     }
     else {
      if (typeof(v) === 'string') {
       if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
       else throw new Error('ResidueChainUndefinedVariableModification');
      }
      else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedVariableModicationDefinition');
      this.residueArray[pos] = mslib.data.Moiety.add(this.residueArray[pos],v,this.residueArray[pos].symbol);
     }    
    }
    else throw new Error('ResidueChainCannotParseVariableModificationPosition');
   });
  }
//  console.log(this.residueArray);
 }

 let getTokensAndMassDeltas = function(seqString,possibleResiduesByToken) {
  if (!seqString.length) throw new Error('ResidueChainTokenParsingZeroLengthSeqString');

  let residueSymbolString = Object.keys(possibleResiduesByToken).join('|').replace(/(\(|\)|\[|\])/g,m => '\\'+m);

  let tokens = [];
  let massDeltas = [];
  let pos = 0;

  let tokenRegex = new RegExp(`^(${residueSymbolString})(?:\\(([+-](?:\\d+|\\d+\\.\\d+|\\.\\d+))\\))?`);
  let tokenRegexCaseInsensitive = new RegExp(tokenRegex,'i');

  do {
   let s = seqString.substring(pos);
   let match;
   if (tokens.length && ( match = s.match(multiplierRegex) )) {
    if (!Number.isInteger(+match[1])) throw new Error('ResidueChainTokenMultiplierParseError');
    tokens = tokens.concat(Array(+match[1]).fill(tokens[tokens.length-1]));
    massDeltas = massDeltas.concat(Array(+match[1]).fill(massDeltas[massDeltas.length-1]));
   }
   else {
    let token;
    if (match = s.match(tokenRegex)) token = match[1];
    else if (match = s.match(tokenRegexCaseInsensitive)) {
     token = Object.keys(possibleResiduesByToken).find(t => t.toUpperCase() == match[1].toUpperCase());
    }
    if (match) {
     tokens.push(token);
     massDeltas.push(match[2] ? parseFloat(match[2]) : 0);
    }
   }
   if (!match) throw new Error('ResidueChainTokenParseError');
   pos += match[0].length;
  } while(pos < seqString.length);
//  console.log([tokens,massDeltas]);
  return [ tokens , massDeltas ];
 }


//
//  this.productStructureTable = {};
//  this.productStructureTable.series = [...Object.keys(fragN),...Object.keys(fragC)].reduce((obj,k) => {obj[k]=Array(residueArrays.length).fill([]); return obj},{});
//  this.productStructureTable['i'] = {};
//  this.productStructureTable['p'] = {};
//
//  this.precursor = {};
//  this.productMassTable = { series : {} };
//
//  this.residueArrays.forEach((residueArray,r) => {
//
//  //Get N-term products, and total as precursor
//   residueArray.slice(0,-1).reduce((accumulator,residue,i) => {
//    let M = mslib.data.Moiety.add(accumulator,residue)
//    Object.entries(fragN).forEach(([k,v]) => { this.productStructureTable.series[r][k][i] = v(M) });
//    return M;
//   },mslib.constants.MOIETIES.NTERM)
//
//   //Get C-term products by working from the other end
//   residueArray.slice(1).reduceRight((accumulator,residue,i,arr) => {
//    let M = mslib.data.Moiety.add(residue,accumulator)
//    Object.entries(fragC).forEach(([k,v]) => { this.productStructureTable.series[r][k][arr.length-i-1] = v(M) });
//    return M;
//   },mslib.constants.MOIETIES.CTERM);
//
//   let residueArrayTotal = mslib.data.Moiety.add(residueArray.reduce((accumulator,residue,i) => {
//    return mslib.data.Moiety.add(accumulator,residue)
//   }),mslib.constants.MOIETIES.CTERM)
//
//   Object.entries(nonfrag).forEach(([k,v]) => { this.productStructureTable['s'][r][k] = v(residueArrayTotal) });
// 
//   this.precursor = mslib.data.Moiety.add(this.precursor,residueArrayTotal);
// 
//   residueArray.filter((residue,i) => i == residueArray.indexOf(residue)).forEach(residue => {
//    this.productStructureTable['i']['i'+residue.symbol] = immonium(residue)
//   });
//
//   this.productMassTable.series[r] = Object.entries(this.productStructureTable.series[r]).reduce((obj,[ion,series]) => {
//    obj[ion] = series.map(m => mslib.data.Moiety.monoisotopicMz(m,1));
//    return obj;
//   },{});
//
//  });

//  Object.entries(nonfrag).forEach(([k,v]) => { this.productStructureTable['p'][k] = v(this.precursor) });
//
//
//  Object.entries(this.productStructureTable).filter(([k,v]) => ['p','i'].includes(k)).forEach(([k,v]) => {
//   this.productMassTable[k] = Object.entries(v).reduce((obj,[res,m]) => {
//    obj[res]=mslib.data.Moiety.monoisotopicMz(m,1);
//    return obj;
//   },{});
//  });
//
//  this.products = [
//   ...Object.entries(this.productMassTable).filter(([k,v]) => ['p','i'].includes(k)).reduce((acc,[k,v]) => {
//    acc.push(...Array.from(Object.entries(v))); 
//    return acc;
//   },[]),
//   ...Object.entries(this.productMassTable.series).reduce((acc,[k,v]) => {
//    acc.push(...v.map((m,i) => [k+(i+1),m]));
//    return acc;
//   },[])
//  ].sort((a,b) => (a[1]-b[1]));
// }
// 


 _ResidueChain._SOURCE = _SOURCE;
 return _ResidueChain;
}();