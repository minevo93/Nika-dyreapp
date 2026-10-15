// Verify that public HTTPS serves the exact reviewed web files before browser tests.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
(async()=>{
 const base=process.env.NIKA_TEST_URL;if(!base)throw Error('NIKA_TEST_URL required');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 for(const file of ['index.html','style.css','app.js','registration.js','pet-photo.js','gps.js','support.js','account.bundle.js','assets/nika-dog-duo-v3.webp']){
  const r=await fetch(new URL(file,base));assert.equal(r.status,200,file);assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(fs.readFileSync('public/'+file)),file+' must match repository');
 }
 console.log('PASS_PUBLIC_RELEASE reviewed HTML, CSS, JavaScript, account bundle and mascot match public HTTPS deployment');
})().catch(e=>{console.error(e);process.exitCode=1});
