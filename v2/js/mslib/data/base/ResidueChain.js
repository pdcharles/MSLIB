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

  if ('fixedModifications' in residueData) {
   Object.entries(residueData.fixedModifications).forEach(([key,v]) => {
    let [ tokens, undefined ] = getTokensAndMassDeltas(key,possibleResiduesByToken)
    if (!Number.isNaN(+v)) {
     this.residueArray.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.token)) {
       this.residueArray[pos] = mslib.data.Moiety.addMassDelta(residue,+v,{ text: `${residue.symbol.text}(${+v})`, display: 'text' });
       this.residueArray[pos].token = `${residue.token}(${+v})`;
      }
     });
    }
    else {
     if (typeof(v) === 'string') {
      if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
      else throw new Error('ResidueChainUndefinedFixedModification');
     }
     else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedFixedModicationDefinition');
     this.residueArray.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.token)) {
       this.residueArray[pos] = mslib.data.Moiety.add(residue,v,{ text: `${residue.symbol.text}(${v.symbol.text})`, display: 'text' });
       this.residueArray[pos].token = `${residue.token}(${v.token})`;
      }
     });
    }
   });
  }

  if ('variableModifications' in residueData) {
   Object.entries(residueData.variableModifications).forEach(([key,v]) => {
    if (Number.isInteger(+key)) {
     let pos = +key-1;
     if (!Number.isNaN(+v)) {
      this.residueArray[pos] = mslib.data.Moiety.addMassDelta(this.residueArray[pos],+v,{ text: `${this.residueArray[pos].symbol.text}(${+v})`, display: 'text' });
      this.residueArray[pos].token = `${residue.token}(${+v})`;
     }
     else {
      if (typeof(v) === 'string') {
       if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
       else throw new Error('ResidueChainUndefinedVariableModification');
      }
      else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedVariableModicationDefinition');
      this.residueArray[pos] = mslib.data.Moiety.add(this.residueArray[pos],v,{ text: `${this.residueArray[pos].symbol.text}(${v.symbol.text})`, display: 'text' });
      this.residueArray[pos].token = `${residue.token}(${v.token})`;
     }    
    }
    else throw new Error('ResidueChainCannotParseVariableModificationPosition');
   });
  }
 }

 let getTokensAndMassDeltas = function(seqString,possibleResiduesByToken) {
  if (!seqString.length) throw new Error('ResidueChainTokenParsingZeroLengthSeqString');

  let residueTokenString = Object.keys(possibleResiduesByToken).join('|').replace(/(\(|\)|\[|\])/g,m => '\\'+m);

  let tokens = [];
  let massDeltas = [];
  let pos = 0;

  let tokenRegex = new RegExp(`^(${residueTokenString})(?:\\(([+-](?:\\d+|\\d+\\.\\d+|\\.\\d+))\\))?`);
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

 _ResidueChain._SOURCE = _SOURCE;
 return _ResidueChain;
}();