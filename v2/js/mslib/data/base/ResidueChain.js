export let ResidueChain = function _SOURCE() {

 const multiplierRegex = new RegExp(/^\(([1-9]\d*)\)/);

 let _ResidueChain = function(residueData,baseResidues) {

  this.type = 'unknown';
  this.notationSingular = '?';
  this.notationPlural = ['?','?','?','?','?','?','?','?','?','?'];

  if (typeof(residueData) === 'string') residueData = { sequenceString : residueData };

  if (!residueData.modificationNotationStyles) residueData.modificationNotationStyles = { 'modX' : true, 'X(mod)' : true, 'X[mod]' : true }

  let possibleResidueTokens = Object.entries(baseResidues).reduce((obj,[key,residue]) => { 
   obj[residue.token] = residue;
   obj[residue.token].label = key;
   return obj;
  },{});

  if ('residueDefinitions' in residueData) {
   this.possibleResidueTokens = Object.entries(residueData.residueDefinitions).reduce((obj,[key,residue]) => { 
    obj[residue.token] = residue;
    obj[residue.token].label = key;
    return obj;
   },possibleResidueTokens);
  }

  if ('modificationDefinitions' in residueData) {
   Object.values(residueData.modificationDefinitions).forEach(mod => {
    if (Number.isInteger(+mod.token)) throw new Error('ResidueChainIllegalModification \''+mod.token+'\'');
    if ('allowedResidues' in mod) Object.values(possibleResidueTokens)
                                  .filter(r => mod.allowedResidues.includes(r.token))
                                  .forEach(residue => {
     let modifiedResidue = mslib.moietymath.add(residue,mod,{ text: residue.symbol.text, note: mod.symbol.text, display: 'text' });
     if (residueData.modificationNotationStyles['modX']) possibleResidueTokens[mod.token.toLowerCase()+residue.token] = modifiedResidue;
     if (residueData.modificationNotationStyles['X(mod)']) {
      possibleResidueTokens[residue.token+'\('+mod.token+'\)'] = modifiedResidue;
      possibleResidueTokens[residue.token+'\('+mod.token.toLowerCase()+'\)'] = modifiedResidue;
     }
     if (residueData.modificationNotationStyles['X[mod]']) {
      possibleResidueTokens[residue.token+'\['+mod.token+'\]'] = modifiedResidue;
      possibleResidueTokens[residue.token+'\['+mod.token.toLowerCase()+'\]'] = modifiedResidue;
     }
    });
   });
  }

  let [ tokens, massDeltas ] = getTokensAndMassDeltas(residueData.sequenceString,possibleResidueTokens);
  this.residues = tokens.map((t,i) => {
   let residue;
   if (t in possibleResidueTokens) {
    residue = mslib.moietymath.clone(possibleResidueTokens[t]);
    if (massDeltas[i]) residue = mslib.moietymath.addMassDelta(residue,massDeltas[i],{ text: residue.symbol.text, note: (massDeltas[i] > 0 ? '+' : '')+massDeltas[i], display: 'text' });
    return residue;
   }
   else throw new Error('ResidueChainUnknownToken \''+t+'\'');
  })

  if ('fixedModifications' in residueData) {
   Object.entries(residueData.fixedModifications).forEach(([key,v]) => {
    let [ tokens, undefined ] = getTokensAndMassDeltas(key,possibleResidueTokens)
    if (!Number.isNaN(+v)) {
     this.residues.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.token)) {
       this.residues[pos] = mslib.moietymath.addMassDelta(residue,+v,{ text: residue.symbol.text, note: (v > 0 ? '+' : '')+v, display: 'text' });
       this.residues[pos].token = `${residue.token}(${+v})`;
      }
     });
    }
    else {
     if (typeof(v) === 'string') {
      if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
      else throw new Error('ResidueChainUndefinedFixedModification');
     }
     else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedFixedModicationDefinition');
     this.residues.forEach((residue,pos) => { 
      if (tokens.some(t => t==residue.token)) {
       this.residues[pos] = mslib.moietymath.add(residue,v,{ text: residue.symbol.text, note: v.symbol.text, display: 'text' });
       this.residues[pos].token = `${residue.token}(${v.token})`;
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
      this.residues[pos] = mslib.moietymath.addMassDelta(this.residues[pos],+v,{ text: this.residues[pos].symbol.text, note: v.symbol.text, display: 'text' });
      this.residues[pos].token = `${residue.token}(${+v})`;
     }
     else {
      if (typeof(v) === 'string') {
       if (v in residueData.modificationDefinitions) v = residueData.modificationDefinitions[v];
       else throw new Error('ResidueChainUndefinedVariableModification');
      }
      else if (typeof(v) !== 'object' || !v.atoms) throw new Error('ResidueChainMalformedVariableModicationDefinition');
      this.residues[pos] = mslib.moietymath.add(this.residues[pos],v,{ text: this.residues[pos].symbol.text, note: v.symbol.text, display: 'text' });
      this.residues[pos].token = `${residue.token}(${v.token})`;
     }    
    }
    else throw new Error('ResidueChainCannotParseVariableModificationPosition');
   });
  }
 }

 let getTokensAndMassDeltas = function(seqString,possibleResidueTokens) {
  if (!seqString.length) throw new Error('ResidueChainTokenParsingZeroLengthSeqString');

  let residueTokenString = Object.keys(possibleResidueTokens).sort((a,b) => b.length - a.length).join('|').replace(/(\(|\)|\[|\])/g,m => '\\'+m);

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
     token = Object.keys(possibleResidueTokens).find(t => t.toUpperCase() == match[1].toUpperCase());
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