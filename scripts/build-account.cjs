const {buildSync}=require('esbuild');
buildSync({entryPoints:['src/account.js'],outfile:'public/account.bundle.js',bundle:true,format:'iife',platform:'browser',target:['safari15','chrome100','firefox100'],minify:true,legalComments:'linked'});
