// UI integration with an explicit fake account service; not OAuth-provider verification.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
let browser,server;
const base='http://127.0.0.1:4173';
(async()=>{
 server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{await fetch(base);break}catch{await new Promise(r=>setTimeout(r,100))}}
 browser=await chromium.launch({headless:true}); const errors=[];
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{
  const listeners=[];
  const record={version:2,dog:{name:'Kontodyr',breed:'Ukjent rase',age:'2 år',sex:'Ikke oppgitt',species:'Hund'},draft:{name:'',breed:'',age:''},walks:[],active:null,meals:[],feedings:[],family:[],places:[],revision:0,multiPetVersion:1,petId:'cloud-pet',otherPets:[],addingPet:false,sessionEnded:false};
  // Keep a different local animal to detect unintended cloud import/disclosure.
  localStorage.setItem('nika-demo-v2',JSON.stringify({...record,dog:{...record.dog,name:'Lokalt dyr'}}));
  window.testCalls=[];
  const a={enabled:true,user:null,on(fn){listeners.push(fn)},async restore(){if(!sessionStorage.getItem('test-signed-out')){a.user={id:'test-user',email:'test@example.invalid'};return a.user}return null},async access(){return sessionStorage.getItem('test-admin')?{role:'admin',accounts:2,savedAccounts:1}:{role:'member'}},async load(){return JSON.parse(sessionStorage.getItem('test-cloud')||JSON.stringify(record))},async save(d){window.testCalls.push('save');sessionStorage.setItem('test-cloud',JSON.stringify(d));listeners.forEach(fn=>fn('saved'));},async signOut(){sessionStorage.setItem('test-signed-out','1');location.replace('/?signedout=1')},async providers(){return {google:true,azure:true,email:true}},async requestEmailCode(address){window.testCalls.push('email-send');},async verifyEmailCode(code){if(code==='00000000')throw Error('Koden er feil eller utløpt.');window.testCalls.push('email-verified');},async signIn(provider){window.testCalls.push(provider)},async removeData(){window.testCalls.push('delete')}};
  Object.defineProperty(window,'NikaAccount',{get:()=>a,set:()=>{}});
 });
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('.welcome-banner h1').waitFor();assert.match(await p.locator('.welcome-banner h1').innerText(),/Kontodyr/);assert.doesNotMatch(await p.locator('#content').innerText(),/Lokalt dyr/);
 assert.match(await p.locator('#data-location').textContent(),/Lagret på kontoen/);
 await p.locator('#account-button').click();assert.equal(await p.locator('#admin-summary').isVisible(),false);assert.match(await p.locator('#account-role').innerText(),/Vanlig brukertilgang/);await p.locator('[data-action="close"]').click();
 await p.evaluate(()=>sessionStorage.setItem('test-admin','1'));await p.locator('#account-button').click();assert.equal(await p.locator('#admin-summary').isVisible(),true);assert.match(await p.locator('#account-role').innerText(),/Administrator/);await p.locator('[data-action="close"]').click();
 const imageData=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=32;c.getContext('2d').fillRect(0,0,32,32);return c.toDataURL('image/png').split(',')[1]});
 await p.locator('.pet-avatar').click();await p.locator('#photo-file').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(imageData,'base64')});await p.waitForFunction(()=>!document.querySelector('#photo-save').disabled);await p.locator('#photo-save').click();await p.reload();assert.equal(await p.locator('.pet-avatar img').count(),1);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).dog.photo),undefined,'account photo not copied into local demo');
 console.log('PASS_ACCOUNT_UI admin/member states, account photo save/reload and local separation; simulated service');
 await p.locator('[data-go="profile"]').click();await p.locator('#dog-name').fill('Kontodyr endret');await p.getByRole('button',{name:'Lagre profil',exact:true}).click();await p.reload();assert.match(await p.locator('.welcome-banner h1').innerText(),/Kontodyr endret/);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).dog.name),'Lokalt dyr');
 await p.locator('[data-go="family"]').click();assert.match(await p.locator('#page-body > .notice').innerText(),/gir ingen andre tilgang/);
 await p.locator('[data-action="privacy"]').click();assert.match(await p.locator('#dialog-content').innerText(),/ingen administratortilgang/);await p.locator('[data-action="close"]').click();
 await p.locator('[data-action="menu"]').click();await p.locator('[data-action="logout"]').click();await p.locator('.signed-out-home').waitFor();assert.match(await p.locator('h1').innerText(),/Et bedre liv/);assert.equal(await p.locator('#pet-select').count(),0);assert.doesNotMatch(await p.locator('#content').innerText(),/Kontodyr|Lokalt dyr/);
 await p.locator('#account-button').click();assert.equal(await p.locator('[data-action="google"]').isEnabled(),true);await p.locator('[data-action="azure"]').click();assert.deepEqual(await p.evaluate(()=>window.testCalls),['azure']);
 await p.locator('#email-signup').click();await p.locator('#login-email').fill('person@hotmail.com');await p.getByRole('button',{name:'Send innloggingskode',exact:true}).click();await p.locator('#login-code').waitFor();
 await p.locator('#login-code').fill('00000000');await p.getByRole('button',{name:'Bekreft og velg passord',exact:true}).click();assert.match(await p.locator('#account-error').innerText(),/feil eller utløpt/);
 await p.locator('#email-change').click();assert.equal(await p.locator('#login-email').inputValue(),'person@hotmail.com');await p.getByRole('button',{name:'Send innloggingskode',exact:true}).click();await p.locator('#login-code').fill('12345678');await p.getByRole('button',{name:'Bekreft og velg passord',exact:true}).click();assert.ok((await p.evaluate(()=>window.testCalls)).includes('email-verified'));
 assert.equal(await p.locator('#dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
 console.log('PASS_EMAIL_BROWSER address, code, invalid-code feedback, edit address and verification; simulated service');
 fs.mkdirSync('evidence' ,{recursive:true});await p.screenshot({path:'evidence/account-options-mobile.png',fullPage:true});
 console.log('NIKA_IMAGE account-options-mobile '+(await p.screenshot({type:'jpeg',quality:75,fullPage:true})).toString('base64'));
 await p.locator('[data-action="close"]').click();await p.reload();assert.equal(await p.locator('#pet-select').count(),0);assert.equal(await p.locator('[data-action="resume"]').count(),0);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem("nika-demo-v2")).dog.name),"Lokalt dyr","old local data retained without public access");
 assert.deepEqual(errors,[]);console.log('PASS_ACCOUNT_BROWSER cloud/local separation, profile save/reload, truthful family status, ordinary role, direct homepage logout, Microsoft choice, no JS errors. Simulated service, Chromium '+browser.version());
 await ctx.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server?.kill()});
