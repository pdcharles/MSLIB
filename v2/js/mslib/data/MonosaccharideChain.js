import { ResidueChain } from './base/ResidueChain.js';

export let MonosaccharideChain = function _SOURCE() {
 
 let _MonosaccharideChain = function(residueData) {
  mslib.data.base.ResidueChain.call(this, residueData, mslib.constants.RESIDUES.MONOSACCHARIDES);
  this.type = 'MonosaccharideChain';
  this.notationSingular = 'G';
  this.notationPlural = ['G1','G2','G3','G4','G5','G6','G7','G8'];
 };
 _MonosaccharideChain.prototype = Object.create((typeof ResidueChain !== 'undefined') ? ResidueChain.prototype : mslib.data.base.ResidueChain.prototype);

 let re = M => mslib.moietymath.add(M,mslib.constants.MOIETIES.REDUCINGEND);
 let nre = M => mslib.moietymath.add(mslib.constants.MOIETIES.NONREDUCINGEND,M);

 let products = {
  nonfragment : {
   'p'  : M => nre(re(M)),
//   'p*' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.AMMONIA),
//   'p°' : M => mslib.moietymath.subtract(products.nonfragment.p(M),mslib.constants.MOIETIES.WATER)
  },

//  immonium : R => mslib.moietymath.subtract(R,mslib.constants.MOIETIES.CO),

  ascending : {
   'b'  : M => mslib.moietymath.subtract(nre(M),mslib.constants.MOIETIES.H),
//   'b*' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.AMMONIA),
//   'b°' : M => mslib.moietymath.subtract(products.ascending.b(M),mslib.constants.MOIETIES.WATER),

   'c'  : M => mslib.moietymath.add(nre(M),mslib.constants.MOIETIES.NH2)
  },

  descending : {
   'y'  : M => mslib.moietymath.add(re(M),mslib.constants.MOIETIES.H),
//   'y*' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.AMMONIA),
//   'y°' : M => mslib.moietymath.subtract(products.descending.y(M),mslib.constants.MOIETIES.WATER),

   'z'  : M => mslib.moietymath.subtract(re(M),mslib.constants.MOIETIES.NH2)
  }
 }

 _MonosaccharideChain.products = products;

 _MonosaccharideChain._SOURCE = _SOURCE;

 return _MonosaccharideChain;

}();