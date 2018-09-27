By Phil Charles (estofi.uk@gmail.com)
Inital git commit 22/01/2016

MSLIB is a javascript library for reading several major file formats assosciated with proteomic Mass Spectrometry.

The aim is to allow allows client-side analysis scripts to be build and distributed as a self-contained webpage, enabling rapid prototyping and distribution of bespoke analysis scripts while only requiring end-users to have an up-to-date web browser installed.

File formats currently supported:
 => Generic comma and tab-separated text files
 => .fasta Amino and Nucleic acid sequence files
 => .mgf Matrix Science(TM) Mascot Generic Format MS/MS peaklist files
 => .mzML and .mzXML MS data files (most vendor-specific raw data files can be converted to or exported as this format)
 => .raw Thermo Fisher Scientific(TM) Raw data files (experimental, a port of UnThermo - https://godoc.org/bitbucket.org/proteinspector/ms/unthermo)
 => .msf Thermo Fisher Scientific(TM) Magellan Storage Format files produced by Thermo Proteome Discoverer(TM)
 => .blib BiblioSpec Spectral Library files (see https://skyline.gs.washington.edu/labkey/project/home/software/BiblioSpec/begin.view)

Support may also be added in the future for:
 => .ms1 and .ms2 MS data files (Yates Lab format http://fields.scripps.edu/)

MSLIB has the following dependencies which, slightly modified (as allowed by their respective licenses) to self-report their own source, are provided in the distrib/ folder. Not all dependencies are required, depending on what formats need to be read.

pako (required for reading mzML/mzXML with zlib compression)
https://github.com/nodeca/pako
 => pako_inflate.1.0.3.min.js

zip (required for reading zipped spectra in .msf) files)
http://gildas-lormeau.github.io/zip.js
 => zip.js
 => inflate.js

sqlite (required for reading .msf and .blib files, both of which are SQLite 
https://github.com/kripken/sql.js/
 => sql.js

Dependencies should be loaded in the header of your page along with the required MSLIB modules