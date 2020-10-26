/* 
 Masses from www.CIAAW.org, abundances from https://doi.org/10.1515/pac-2015-0503. 
 All values given at a precision of 1 fewer sf than the fewest given by CIAAW for that element
*/

export let constants = function _SOURCE() {
 let _constants = {
  ELEMENTS:
  { 
   C:
   {
    caption: 'Carbon',
    token: 'C',
    symbol: {
     text: 'C',
     display: 'text'
    },
    isotopes: [
               [ 12.00000000,  0.98892 ],  //NBS 19 (TS-Limestone)
               [ 13.00335484,  0.01108 ]
              ]              
   },
   '13C':
   {
    caption: 'Carbon-13',
    token: '13C',
    symbol: {
     text: '13C',
     display: 'text'
    },
    isotopes: [
               [ 12.00000000,  0.005 ],    //SILAC Carbon-13 incorporation typically ~99.5% (Thermo & Sigma reagents)
               [ 13.00335484,  0.995 ]
              ]              
   },
   H:
   {
    caption: 'Hydrogen',
    token: 'H',
    symbol: {
     text: 'H',
     display: 'text'
    },
    isotopes: [
               [ 1.007825032,  0.9998443 ], //VSMOW (Vienna Standard Mean Ocean Water)
               [ 2.014101778,  0.0001557 ]
              ]
   },
   N:
   {
    caption: 'Nitrogen',
    token: 'N',
    symbol: {
     text: 'N',
     display: 'text'
    },
    isotopes: [
               [ 14.00307400, 0.99634 ],   //Air
               [ 15.00010890, 0.00366 ] 
              ]
   },
   '15N':
   {
    caption: 'Nitrogen-15',
    token: '15N',
    symbol: {
     text: '15N',
     display: 'text'
    },
    isotopes: [
               [ 14.00307400, 0.005 ],     //SILAC Nitrogen-15 incorporation typically ~99.5% (Thermo & Sigma reagents)
               [ 15.00010890, 0.995 ] 
              ]
   },
   O:
   {
    caption: 'Oxygen',
    token: 'O',
    symbol: {
     text: 'O',
     display: 'text'
    },
    isotopes: [
               [ 15.99491462,  0.997621 ],  //VSMOW (Vienna Standard Mean Ocean Water)
               [ 16.99913176,  0.000379 ],
               [ 17.99915961,  0.002000 ]
              ]
   },
   P:
   {
    caption: 'Phosphorus',
    token: 'P',
    symbol: {
     text: 'P',
     display: 'text'
    },
    isotopes: [
               [ 30.97376200, 1 ]           //N/A
              ]
   },
   S:
   {
    caption: 'Sulphur',
    token: 'S',
    symbol: {
     text: 'S',
     display: 'text'
    },
    isotopes: [
               [ 31.97207117,  0.9504074 ],    //IAEA-S-1
               [ 32.9714590,   0.0074869 ],
               [ 33.967867,    0.0419599 ],
               [ 35.96708,     0.0001458 ]
              ]
   },
   Br:
   {
    caption: 'Bromine',
    token: 'Br',
    symbol: {
     text: 'Br',
     display: 'text'
    },
    isotopes: [
               [ 78.91834,  0.50686 ],    //NIST SRM 977
               [ 80.91629,  0.49314 ]
              ]
   },
   Se:
   {
    caption: 'Selenium',
    token: 'Se',
    symbol: {
     text: 'Se',
     display: 'text'
    },
    isotopes: [
               [ 73.922476,  0.0086 ],
               [ 75.919214,  0.0923 ],
               [ 76.919914,  0.0760 ],
               [ 77.91731,   0.2369 ],
               [ 79.91652,   0.4980 ],
               [ 81.91670,   0.0882 ],
              ]
   }
  },
  RESIDUES:
  {
   AMINOACIDS:
   {
    ALANINE:
    {
     token: 'A',
     symbol: {
      text: 'A',
      display: 'text'
     },
     atoms: {
      C: 3,
      H: 5,
      N: 1,
      O: 1
     },
     caption: 'Alanine'
    },
    ARGININE:
    {
     token: 'R',
     symbol: {
      text: 'R',
      display: 'text'
     },
     atoms: {
      C: 6,
      H:12,
      N: 4,
      O: 1
     },
     caption: 'Arginine'
    },
    ASPARAGINE: 
    {
     token: 'N',
     symbol: {
      text: 'N',
      display: 'text'
     },
     atoms: {
      C: 4,
      H: 6,
      N: 2,
      O: 2
     },
     caption: 'Asparagine'
    },
    ASPARTATE:  
    {
     token: 'D',
     symbol: {
      text: 'D',
      display: 'text'
     },
     atoms: {
      C: 4,
      H: 5,
      N: 1,
      O: 3
     },
     caption: 'Aspartate'
    },
    CYSTEINE:  
    {
     token: 'C',
     symbol: {
      text: 'C',
      display: 'text'
     },
     atoms: {
      C: 3,
      H: 5,
      N: 1,
      O: 1,
      S: 1
     },
     caption: 'Cysteine'
    },
    GLUTAMATE:
    {
     token: 'E',
     symbol: {
      text: 'E',
      display: 'text'
     },
     atoms: {
      C: 5,
      H: 7,
      N: 1,
      O: 3
     },
     caption: 'Glutamate'
    },
    GLUTAMINE:
    {
     token: 'Q',
     symbol: {
      text: 'Q',
      display: 'text'
     },
     atoms: {
      C: 5,
      H: 8,
      N: 2,
      O: 2
     },
     caption: 'Glutamine'
    },
    GLYCINE:
    {
     token: 'G',
     symbol: {
      text: 'G',
      display: 'text'
     },
     atoms: {
      C: 2,
      H: 3,
      N: 1,
      O: 1
     },
     caption: 'Glycine'
    },
    HISTIDINE:
    {
     token: 'H',
     symbol: {
      text: 'H',
      display: 'text'
     },
     atoms: {
      C: 6,
      H: 7,
      N: 3,
      O: 1
     },
     caption: 'Histidine'
    },
    ISOLEUCINE:
    {
     token: 'I',
     symbol: {
      text: 'I',
      display: 'text'
     },
     atoms: {
      C: 6,
      H:11,
      N: 1,
      O: 1
     },
     caption: 'Isoleucine'
    },
    LEUCINE:
    {
     token: 'L',
     symbol: {
      text: 'L',
      display: 'text'
     },
     atoms: {
      C: 6,
      H:11,
      N: 1,
      O: 1
     },
     caption: 'Leucine'
    },
    LYSINE:
    {
     token: 'K',
     symbol: {
      text: 'K',
      display: 'text'
     },
     atoms: {
      C: 6,
      H:12,
      N: 2,
      O: 1
     },
     caption: 'Lysine'
    },
    METHIONINE:
    {
     token: 'M',
     symbol: {
      text: 'M',
      display: 'text'
     },
     atoms: {
      C: 5,
      H: 9,
      N: 1,
      O: 1,
      S: 1
     },
     caption: 'Methionine'
    },
    PHENYLALANINE:
    {
     token: 'F',
     symbol: {
      text: 'F',
      display: 'text'
     },
     atoms: {
      C: 9,
      H: 9,
      N: 1,
      O: 1
     },
     caption: 'Phenylalanine'
    },
    PROLINE:
    {
     token: 'P',
     symbol: {
      text: 'P',
      display: 'text'
     },
     atoms: {
      C: 5,
      H: 7,
      N: 1,
      O: 1
     },
     caption: 'Proline'
    },
    SERINE:
    {
     token: 'S',
     symbol: {
      text: 'S',
      display: 'text'
     },
     atoms: {
      C: 3,
      H: 5,
      N: 1,
      O: 2
     },
     caption: 'Serine'
    },
    THREONINE:
    {
     token: 'T',
     symbol: {
      text: 'T',
      display: 'text'
     },
     atoms: {
      C: 4,
      H: 7,
      N: 1,
      O: 2
     },
     caption: 'Threonine'
    },
    TRYPTOPHAN:
    {
     token: 'W',
     symbol: {
      text: 'W',
      display: 'text'
     },
     atoms: {
      C:11,
      H:10,
      N: 2,
      O: 1
     },
     caption: 'Tryptophan'
    },
    TYROSINE:
    {
     token: 'Y',
     symbol: {
      text: 'Y',
      display: 'text'
     },
     atoms: {
      C: 9,
      H: 9,
      N: 1,
      O: 2
     },
     caption: 'Tyrosine'
    },
    VALINE:
    {
     token: 'V',
     symbol: {
      text: 'V',
      display: 'text'
     },
     atoms: {
      C: 5,
      H: 9,
      N: 1,
      O: 1
     },
     caption: 'Valine'
    },
    SELENOCYSTEINE:
    {
     token: 'U',
     symbol: {
      text: 'U',
      display: 'text'
     },
     atoms: {
      C: 3,
      H: 5,
      N: 1,
      O: 1,
      Se: 1
     },
     caption: 'Selenocysteine'
    },
    PYRROLYSINE:
    {
     token: 'O',
     symbol: {
      text: 'O',
      display: 'text'
     },
     atoms: {
      C: 12,
      H: 19,
      N: 3,
      O: 2,
     },
     caption: 'Pyrrolysine'
    }
   },

//White	255/255/255
//Blue	0/144/188
//Green	0/166/81
//Yellow	255/212/0
//Light blue	143/204/233
//Pink	246/158/161
//Purple	165/67/153
//Brown	161/122/77
//Orange	244/121/32
//Red	237/28/36

   MONOSACCHARIDES:
   {
    SIALICACID:
    {
     token: 'Sia',
     symbol: {
      text: 'Sia',
      icon: 'diamond',
      colour: 'rgb(237,28,36)', //red
      display: 'icon'
     },
     atoms: {
      C: 11,
      H: 17,
      N: 1,
      O: 8
     },
     caption: 'Unspecified Sialic Acid'
    },
    GALACTOSE:
    {
     token: 'Gal',
     symbol: {
      text: 'Gal',
      icon: 'circle',
      colour: 'rgb(255,212,0)', //yellow
      display: 'icon'
     },
     atoms: {
      C: 6,
      H: 10,
      O: 5
     },
     caption: 'D-Galactose'
    },
    MANNOSE:
    {
     token: 'Man',
     symbol: {
      text: 'Man',
      icon: 'circle',
      colour: 'rgb(0,166,81)', //green
      display: 'icon'
     },
     atoms: {
      C: 6,
      H: 10,
      O: 5
     },
     caption: 'D-Mannose'
    },
    NACETYLGLUCOSAMINE:
    {
     token: 'GlcNAc',
     symbol: {
      text: 'GlcNAc',
      icon: 'square',
      colour: 'rgb(0,144,188)', //blue
      display: 'icon'
     },
     atoms: {
      C: 11,
      H: 17,
      N: 1,
      O: 8
     },
     caption: 'N-Acetyl-D-Glucosamine'
    },
    FUCOSE:
    {
     token: 'Fuc',
     symbol: {
      text: 'Fuc',
      icon: 'triangle',
      colour: 'rgb(237,28,36)', //red
      display: 'icon'
     },
     atoms: {
      C: 6,
      H: 10,
      O: 4
     },
     caption: 'Fucose'
    }
   }
  },
  MOIETIES:
  {
   NTERM:
   {
    symbol: {
     text: '[N-term.]',
     display: 'text'
    },
    atoms: {
     H:1
    },
    caption: 'Peptide N-terminus'
   },
   CTERM:
   {
    symbol: {
     text: '[C-term.]',
     display: 'text'
    },
    atoms: {
     H:1,
     O:  1
    },
    caption: 'Peptide C-terminus'
   },
   REDUCINGEND:
   {
    symbol: {
     text: '[Red.]',
     display: 'text'
    },
    atoms: {
     H:1
    },
    caption: 'Oligosaccharide Reducing End'
   },
   NONREDUCINGEND:
   {
    symbol: {
     text: '[Non-red.]',
     display: 'text'
    },
    atoms: {
     H:1,
     O:  1
    },
    caption: 'Oligosaccharide Non-reducing End'
   },
   NH2:
   {
    symbol: {
     text: '[NH2]',
     display: 'text'
    },
    atoms: {
     H:2,
     N:1
    },
    caption: 'Amino group'
   },
   CHO:
   {
    symbol: {
     text: '[CHO]',
     display: 'text'
    },
    atoms: {
     C:1,
     H:1,
     O:  1
    },
    caption: 'Aldehyde (formyl) group'
   },
   H:
   {
    symbol: {
     text: '[H]',
     display: 'text'
    },
    atoms: {
     H:1
    },
    caption: 'Hydrogen'
   },
   CO:
   {
    symbol: {
     text: '[CO]',
     display: 'text'
    },
    atoms: {
     C:  1,
     O:  1
    },
    caption: 'Carbonyl group'
   },
   AMMONIA:
   {
    symbol: {
     text: '[NH3]',
     display: 'text'
    },
    atoms: {
     H:3,
     N:1
    },
    caption: 'Ammonia'
   },
   WATER:
   {
    symbol: {
     text: '[H2O]',
     display: 'text'
    },
    atoms: {
     H:2,
     O:1
    },
    caption: 'Water'
   }
  },
  MODIFICATIONS:
  {
   OXIDATION:  {
    token: 'ox',
    symbol: {
     text: 'ox',
     display: 'text'
    },
    allowedResidues: ['M'],
    atoms: {
            O: 1
           },
    caption: 'Oxidation'
   },
   CARBAMIDOMETHYLATION: {
    token: 'cam',
    symbol: {
     text: 'cam',
     display: 'text'
    },
    allowedResidues: ['C'],
    atoms: {
            C: 2,
            H: 3,
            N: 1,
            O: 1
           },
    caption: 'Carbamidomethylation'
   },
   DEAMIDATION: {
    token: 'd',
    symbol: {
     text: 'd',
     display: 'text'
    },
    allowedResidues: ['N','Q'],
    atoms: {
            H: -1,
            N: -1,
            O: 1
           },
    caption: 'Deamidation'
   },
   PHOSPHORYLATION: {
    token: 'p',
    symbol: {
     text: 'p',
     display: 'text'
    },
    allowedResidues: ['N','Q'],
    atoms: {
            H: 1,
            O: 3,
            P: 1
           },
    caption: 'Phosphorylation'
   },
   SILAC_LYS8: {
    token: 'sk8',
    symbol: {
     text: 'sk8',
     display: 'text'
    },
    allowedResidues: ['K'],
    atoms: {
            C: -6,
            '13C': 6,
            N: -2,
            '15N': 2
           },
    caption: '13C(6)15N(2) Lysine'
   },
   SILAC_ARG10: {
    token: 'sr10',
    symbol: {
     text: 'sr10',
     display: 'text'
    },
    allowedResidues: ['R'],
    atoms: {
            C: -6,
            '13C': 6,
            N: -4,
            '15N': 4
           },
    caption: '13C(6)15N(4) Arginine'
   }
  }
 }

  _constants._SOURCE=_SOURCE;
 return _constants;
}();