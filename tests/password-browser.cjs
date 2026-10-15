// Browser UI test with a controlled account service. Never sends mail or changes a real password.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
let browser,server;const base='http://127.0.0.1:4173';
(async()=>{
 server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});
 for(let i=0;i<30;i++){try{await fetch(base);break}catch{await new Promise(r=>setTimeout(r,100))}}
 browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
 await ctx.addInitScript(()=>{
  window.passwordCalls=[];window.passwordFailure='';
  const record={version:2,dog:{name:'Testdyr',breed:'Ukjent rase',age:'2 år',species:'Hund'},draft:{name:'',breed:'',age:''},walks:[],active:null,meals:[],feedings:[],family:[],places:[],revision:0,multiPetVersion:1,petId:'test-pet',otherPets:[],sessionEnded:false};
  const a={enabled:true,user:null,on(){},async restore(){if(sessionStorage.getItem('test-auth'))return a.user={id:'existing-test-id',email:'person@example.invalid'};return null;},async load(){return record;},async access(){return {role:'member'};},async providers(){return {email:true,google:false,azure:false};},async signInPassword(email,password){window.passwordCalls.push({action:'login',email,hasPassword:!!password});if(password==='wrong')throw Error('Kontroller e-post og passord.');sessionStorage.setItem('test-auth','1');location.replace('/');},async requestEmailCode(email,purpose){window.passwordCalls.push({action:'otp',email,purpose});},async verifyEmailCode(code){if(code==='00000000')throw Error('Koden er feil eller utløpt.');sessionStorage.setItem('test-auth','1');location.replace('/?password=setup');},async setPassword(password,nonce){window.passwordCalls.push({action:'update',hasNonce:!!nonce});await new Promise(r=>setTimeout(r,100));if(window.passwordFailure){const e=Error('Bekreft e-posten på nytt.');e.code=window.passwordFailure;throw e;}},async requestPasswordConfirmation(){window.passwordCalls.push({action:'reauth'});},async signOut(){sessionStorage.removeItem('test-auth');location.replace('/?signedout=1');},async save(){throw Error('Password flow must not write animal payload');}};
  Object.defineProperty(window,'NikaAccount',{get:()=>a,set:()=>{}});
 });
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('#account-button').click();await p.locator('#login-password').waitFor();
 assert.equal(await p.locator('#login-password').getAttribute('autocomplete'),'current-password');
 await p.locator('#login-email').fill('person@example.invalid');await p.locator('#login-password').fill('wrong');await p.locator('#password-login-form button[type="submit"]').click();await p.waitForFunction(()=>document.querySelector('#account-error').textContent.includes('Kontroller'));
 assert.equal(await p.locator('#login-password').inputValue(),'');assert.equal(await p.locator('#login-email').inputValue(),'person@example.invalid');
 await p.locator('#password-recover').click();await p.locator('#email-address-form button[type="submit"]').click();assert.equal(await p.evaluate(()=>window.passwordCalls.at(-1).purpose),'password');await p.locator('#login-code').fill('00000000');await p.locator('#email-code-form button[type="submit"]').click();await p.waitForFunction(()=>document.querySelector('#account-error').textContent.includes('utløpt'));
 await p.locator('#login-code').fill('12345678');await p.locator('#email-code-form button[type="submit"]').click();await p.locator('#password-form').waitFor();assert.equal(new URL(p.url()).search,'','setup UI flag consumed');
 assert.match(await p.locator('.welcome-banner h1').textContent(),/Testdyr/);
 await p.locator('#new-password').fill('Synthetic phrase 43!');await p.locator('#confirm-password').fill('Different phrase 43!');await p.getByRole('button',{name:'Lagre passord',exact:true}).click();assert.match(await p.locator('#password-status').innerText(),/ikke like/);assert.equal(await p.locator('#new-password').inputValue(),'');assert.equal(await p.evaluate(()=>window.passwordCalls.length),0);
 fs.mkdirSync('evidence',{recursive:true});
 for(const [width,height]of [[390,844],[844,390],[768,1024],[1440,1000]]){
  await p.setViewportSize({width,height});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await p.locator('#dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  const button=await p.getByRole('button',{name:'Lagre passord',exact:true}).boundingBox();assert.ok(button.height>=44&&button.width>=44);
  await p.screenshot({path:`evidence/password-setup-${width}x${height}.png`,fullPage:true});
 }
 await p.setViewportSize({width:390,height:844});
 await p.evaluate(()=>window.passwordFailure='reauthentication_needed');
 await p.locator('#new-password').fill('Synthetic phrase 43!');await p.locator('#confirm-password').fill('Synthetic phrase 43!');await p.getByRole('button',{name:'Lagre passord',exact:true}).click();await p.locator('#password-reauth').waitFor({state:'visible'});assert.equal(await p.locator('#new-password').inputValue(),'');
 await p.locator('#password-send-code').click();await p.waitForFunction(()=>window.passwordCalls.at(-1)?.action==='reauth');
 await p.evaluate(()=>window.passwordFailure='');await p.locator('#password-nonce').fill('12345678');await p.locator('#new-password').fill('Synthetic phrase 43!');await p.locator('#confirm-password').fill('Synthetic phrase 43!');
 await p.locator('[data-password-toggle="new-password"]').click();assert.equal(await p.locator('#new-password').getAttribute('type'),'text');
 await p.getByRole('button',{name:'Lagre passord',exact:true}).dblclick();await p.getByRole('heading',{name:'Passordet er lagret'}).waitFor();assert.equal(await p.evaluate(()=>window.passwordCalls.filter(c=>c.action==='update'&&c.hasNonce).length),1);
 await p.getByRole('button',{name:'Ferdig',exact:true}).click();assert.match(await p.locator('.welcome-banner h1').innerText(),/Testdyr/);
 await p.locator('#account-button').click();await p.locator('[data-action="password"]').click();await p.locator('#new-password').fill('Synthetic phrase 43!');await p.locator('[data-password-toggle="new-password"]').click();await p.keyboard.press('Escape');assert.equal(await p.locator('#new-password').inputValue(),'','Escape clears even revealed password');
 await p.locator('[data-action="logout"]').click();await p.locator('.signed-out-home').waitFor();await p.locator('#account-button').click();await p.locator('#email-signup').click();await p.locator('#login-email').fill('new@example.invalid');await p.locator('#email-address-form button[type="submit"]').click();assert.equal(await p.evaluate(()=>window.passwordCalls.at(-1).purpose),'signup');
 await p.locator('[data-action="close"]').click();await p.locator('#account-button').click();await p.locator('#login-email').fill('person@example.invalid');await p.locator('#login-password').fill('Synthetic phrase 43!');await p.locator('#password-login-form button[type="submit"]').click();await p.locator('.welcome-banner h1').waitFor();assert.equal(await p.locator('#password-form').count(),0,'ordinary login needs no OTP/setup');
 assert.deepEqual(errors,[]);console.log('PASS_PASSWORD_BROWSER password login, recovery and signup, setup after verified session, mismatch, reauthentication, double-submit, clearing credentials, unchanged animal, logout, 4 viewports; simulated account service; Chromium '+browser.version());
 await ctx.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server?.kill()});
