export let Moiety = function _SOURCE() {
 let _Moiety = function(m) {
  this.atoms = {};
  this.symbol = { text : '', display: null};
  this.token = null;
  this.caption = null;
  if (typeof(m) !== 'undefined') Object.entries(m).filter(([k,v]) => Object.keys(this).includes(k)).forEach(([k,v]) => m[k] = v);
 };

 let check = function(m1) {
  if (!m1) throw new Error('MoietyMathInvalidMoiety')
 }

 let clone = function(m) {
  return JSON.parse(JSON.stringify(m));
 }

 let add = function(m1,m2,newSymbol) {
  check(m1);
  check(m2);
  let r = clone(m1);
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}${m1.symbol.text.length && m2.symbol.text.length ? '+' : ''}${m2.symbol.text}` , display : 'text' };
  Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) + v);
  if (m2.massDelta) {
   if (r.massDelta) { r.massDelta += m2.massDelta } else r.massDelta = m2.massDelta;
  }
  Object.entries(m2).filter(([k,v]) => !Object.keys(r).includes(k)).forEach(([k,v]) => r[k] = v);
  return r;
 }

 let addMassDelta = function(m1,delta) {
  check(m1);
  let r = clone(m1);
  if (!r.massDelta) r.massDelta = delta;
  else r.massDelta += delta;
  return r;
 }

 let subtract = function(m1,m2,newSymbol) {
  check(m1);
  check(m2);
  let r = clone(m1);
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol && m2.symbol) r.symbol = { text : `${m1.symbol.text}-${m2.symbol.text}` , display : 'text' };
  Object.entries(m2.atoms).forEach(([k,v]) => r.atoms[k] = (r.atoms[k] ? r.atoms[k] : 0) - v);
  if (m2.massDelta) {
   if (r.massDelta) { r.massDelta -= m2.massDelta } else r.massDelta = -m2.massDelta;
  }
  return r;
 }

 let multiply = function(m1,n,newSymbol) {
  check(m1);
  let r = clone(m1);
  if (newSymbol) r.symbol = newSymbol;
  else if (m1.symbol) r.symbol = { text : `${m1.symbol.value}(${n})` , display : 'text' };
  Object.entries(r.atoms).forEach(([k,v]) => r.atoms[k] = v*n);
  if (r.massDelta) r.massDelta =  r.massDelta * n;
  return r;
 }

 let monoisotopicMz = function(m1,charge) {
  check(m1);
  if (!charge) charge = 1;
  return (Object.entries(m1.atoms).reduce((acc,[atom,n]) => {
   acc += mslib.constants.ELEMENTS[atom].isotopes[0][0]*n;
   return acc;
  },mslib.constants.ELEMENTS.HYDROGEN.isotopes[0][0]*charge)+(m1.massDelta ? m1.massDelta : 0))/charge;
 }

 let topNMz = function(m1,charge,n) {
  check(m1);
  if (!charge) charge = 1;
  if (!n) n = 1;
  //todo
 }

 _Moiety.clone = clone;
 _Moiety.add = add;
 _Moiety.addMassDelta = addMassDelta;
 _Moiety.subtract = subtract;
 _Moiety.monoisotopicMz = monoisotopicMz;
 _Moiety.topNMz = topNMz;
 _Moiety._SOURCE = _SOURCE;

 return _Moiety;
}();