if (typeof MSLIB.Data.Spectrum == 'undefined') throw new Error("TimingTestSpectrumUndefined")
if (typeof MSLIB.Tests == 'undefined') MSLIB.Data = {};

MSLIB.Tests.SpectrumScoringTimer = function () {
 var _SpectrumScoringTimer = function(isotopologueN,repeat) {
   var worker = new Worker(MSLIB.Common.getMSLIBWorkerURI(workerInterface,["Common","Math","Data","Spectrum"]));
   worker.addEventListener("message", e => console.log(e.data));
   worker.postMessage([isotopologueN,repeat]);
  }
 
 var workerInterface = function(e) {
  var isotopologueN = e.data[0]
  var repeat = e.data[1]
  var isotopologues = Array(isotopologueN).fill();
 
  var a = new MSLIB.Data.Spectrum(isotopologues.map(e => Math.random()*1500+300).sort((a,b) => a-b),isotopologues.map(e => Math.random()));
  var b = new MSLIB.Data.Spectrum(isotopologues.map(e => Math.random()*1500+300).sort((a,b) => a-b),isotopologues.map(e => Math.random()));
 
  var startEUC = new Date().getTime()
  for (var i=0; i <= repeat; i++) {
   a.getNormalisedEuclideanDistanceFrom(b)
  }
  var endEUC = new Date().getTime()
 
  var startWEUC = new Date().getTime()
  for (var i=0; i <= repeat; i++) {
   a.getNormalisedWeightedEuclideanDistanceFrom(b)
  }
  var endWEUC = new Date().getTime()
 
  var startSCA = new Date().getTime()
  for (var i=0; i <= repeat; i++) {
   a.getNormalisedSpectralContrastAngleTo(b)
  }
  var endSCA = new Date().getTime()
 
  var startKL = new Date().getTime()
  for (var i=0; i <= repeat; i++) {
   a.getNormalisedKullbackLeiblerDivergenceFrom(b)
  }
  var endKL = new Date().getTime()
 
  self.postMessage(repeat+" replicates on a spectrum of "+isotopologueN+" pairs\n"+
                   "EUC: "+(endEUC-startEUC)+"\n"+
                   "WEUC: "+(endWEUC-startWEUC)+"\n"+
                   "SCA: "+(endSCA-startSCA)+"\n"+
                   "KL: "+(endKL-startKL)+"\n")
 }

 return _SpectrumScoringTimer;

}();