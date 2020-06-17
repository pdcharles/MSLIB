import { ResidueChain } from './base/ResidueChain.js';

export let AminoAcidChain = function _SOURCE() {
 
 let _AminoAcidChain = function(residueData) {
  mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.AMINOACIDS);
  this.type = 'AminoAcidChain';
  this.notationSingular = '';
  this.notationPlural = ['α','β','γ','δ']; //Assuming 4 crosslink limit!
 };
 _AminoAcidChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

 let nterm = M => mslib.moietymath.add(mslib.constants.MOIETIES.NTERM,M);
 let cterm = M => mslib.moietymath.add(M,mslib.constants.MOIETIES.CTERM);

 let products = {
  nonfragment : {
   'p'  : M => cterm(nterm(M)),
   'p*' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
   'p°' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
  },

  immonium : R => mslib.moietymath.subtract(R,mslib.constants.MOIETIES.CO),

  ascending : {
   'a'  : M => mslib.moietymath.subtract(nterm(M),mslib.constants.MOIETIES.CHO),
   'a*' : M => mslib.moietymath.subtract(products.ascending.a(M),mslib.constants.MOIETIES.AMMONIA),
   'a°' 	: M => mslib.moietymath.subtract(products.ascending.a(M),mslib.constants.MOIETIES.WATER),

   'b'  : M => mslib.moietymath.subtract(nterm(M),mslib.constants.MOIETIES.H),
   'b*' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
   'b°' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

   'c'  : M => mslib.moietymath.add(nterm(M),mslib.constants.MOIETIES.NH2)
  },

  descending : {
   'x'  : M => mslib.moietymath.subtract(mslib.moietymath.add(cterm(M),mslib.constants.MOIETIES.CO),mslib.constants.MOIETIES.H),

   'y'  : M => mslib.moietymath.add(cterm(M),mslib.constants.MOIETIES.H),
   'y*' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
   'y°' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

   'z'  : M => mslib.moietymath.subtract(cterm(M),mslib.constants.MOIETIES.NH2)
  }
 }

 _AminoAcidChain.products = products;

 _AminoAcidChain._SOURCE = _SOURCE;

 return _AminoAcidChain;

}();