import { ResidueChain } from './base/ResidueChain.js';

export let MonosaccharideChain = function _SOURCE() {
 
 let _MonosaccharideChain = function(residueData) {
  mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.MONOSACCHARIDES);
  this.type = 'MonosaccharideChain';
 };
 _MonosaccharideChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

 let re = M => mslib.data.Moiety.add(M,mslib.constants.MOIETIES.REDUCINGEND);
 let nre = M => mslib.data.Moiety.add(mslib.constants.MOIETIES.NONREDUCINGEND,M);

 let products = {
  nonfragment : {
   'p'  : M => nre(re(M)),
//   'p*' : M => mslib.data.Moiety.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
//   'p°' : M => mslib.data.Moiety.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
  },

//  immonium : R => mslib.data.Moiety.subtract(R,mslib.constants.MOIETIES.CO),

  ascending : {
   'b'  : M => mslib.data.Moiety.subtract(nre(M),mslib.constants.MOIETIES.H),
//   'b*' : M => mslib.data.Moiety.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
//   'b°' : M => mslib.data.Moiety.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

   'c'  : M => mslib.data.Moiety.add(nre(M),mslib.constants.MOIETIES.NH2)
  },

  descending : {
   'y'  : M => mslib.data.Moiety.add(re(M),mslib.constants.MOIETIES.H),
//   'y*' : M => mslib.data.Moiety.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
//   'y°' : M => mslib.data.Moiety.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

   'z'  : M => mslib.data.Moiety.subtract(re(M),mslib.constants.MOIETIES.NH2)
  }
 }

 _MonosaccharideChain.products = products;

 _MonosaccharideChain._SOURCE = _SOURCE;

 return _MonosaccharideChain;

}();