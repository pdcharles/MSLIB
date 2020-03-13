import { ResidueChain } from './base/ResidueChain.js';

export let AminoAcidChain = function _SOURCE() {
 
 let _AminoAcidChain = function(residueData) {
  mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.AMINOACIDS);
  this.type = 'AminoAcidChain';
 };
 _AminoAcidChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

 let nterm = M => mslib.data.Moiety.add(mslib.constants.MOIETIES.NTERM,M);
 let cterm = M => mslib.data.Moiety.add(M,mslib.constants.MOIETIES.CTERM);

 let products = {
  nonfragment : {
   'p'  : M => cterm(nterm(M)),
   'p*' : M => mslib.data.Moiety.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
   'p°' : M => mslib.data.Moiety.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
  },

  immonium : R => mslib.data.Moiety.subtract(R,mslib.constants.MOIETIES.CO),

  ascending : {
   'a'  : M => mslib.data.Moiety.subtract(nterm(M),mslib.constants.MOIETIES.CHO),
   'a*' : M => mslib.data.Moiety.subtract(products.ascending.a(M),mslib.constants.MOIETIES.AMMONIA),
   'a°' 	: M => mslib.data.Moiety.subtract(products.ascending.a(M),mslib.constants.MOIETIES.WATER),

   'b'  : M => mslib.data.Moiety.subtract(nterm(M),mslib.constants.MOIETIES.H),
   'b*' : M => mslib.data.Moiety.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
   'b°' : M => mslib.data.Moiety.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

   'c'  : M => mslib.data.Moiety.add(nterm(M),mslib.constants.MOIETIES.NH2)
  },

  descending : {
   'x'  : M => mslib.data.Moiety.subtract(mslib.data.Moiety.add(cterm(M),mslib.constants.MOIETIES.CO),mslib.constants.MOIETIES.H),

   'y'  : M => mslib.data.Moiety.add(cterm(M),mslib.constants.MOIETIES.H),
   'y*' : M => mslib.data.Moiety.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
   'y°' : M => mslib.data.Moiety.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

   'z'  : M => mslib.data.Moiety.subtract(cterm(M),mslib.constants.MOIETIES.NH2)
  }
 }

 _AminoAcidChain.products = products;

 _AminoAcidChain._SOURCE = _SOURCE;

 return _AminoAcidChain;

}();