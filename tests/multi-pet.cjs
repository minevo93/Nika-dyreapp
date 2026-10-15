const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'evidence');
const base=process.env.NIKA_TEST_URL || 'http://127.0.0.1:4173';
const KEY='nika-demo-v2',BACKUP='nika-demo-v2-before-multi';
let browser,server;
const errors=[];
const act=(p,a)=>p.locator('[data-action="'+a+'"]').first().click();
const store=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const nav=(p,n)=>p.getByRole('navigation').getByRole('button',{name:n,exact:true}).click();
async function answer(p,text){await p.locator('#answer').fill(text);await p.locator('#answer').press('Enter');}
async function fresh(){const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Europe/Oslo'});await require('./legacy-fixture.cjs')(ctx);const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(base);return {ctx,p};}
async function add(p,text){await act(p,'pets');await act(p,'add-pet');await answer(p,text);await act(p,'confirm');}
async function photo(p,name){await p.waitForFunction(()=>!document.getElementById('toast').textContent,{},{timeout:5000});const fullPage=!/switcher|logout/.test(name);await p.screenshot({path:path.join(evidence,name+'.png'),fullPage,animations:'disabled'});console.log('NIKA_IMAGE '+name+' '+(await p.screenshot({type:'jpeg',quality:70,fullPage,animations:'disabled'})).toString('base64'));}
(async()=>{
  fs.mkdirSync(evidence,{recursive:true});
  if(!process.env.NIKA_TEST_URL){server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});for(let i=0;i<30;i++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,100));}}}
  browser=await chromium.launch({headless:true});console.log('MULTI_BROWSER',browser.version());
  let {ctx,p}=await fresh();
  await answer(p,'Jessica schæfer tispe 2 år');
  assert.match(await p.locator('.onboard-summary').innerText(),/Jessica[\s\S]*schæfer[\s\S]*2 år[\s\S]*Hunn/);
  await photo(p,'sentence-summary-mobile');
  await act(p,'correct');
  assert.equal(await p.locator('#draft-name').inputValue(),'Jessica');
  assert.equal(await p.locator('#draft-sex').inputValue(),'Hunn');
  await p.getByRole('button',{name:'Oppdater oppsummering',exact:true}).click();
  await p.reload();await act(p,'confirm');
  let d=await store(p);assert.equal(d.dog.name,'Jessica');assert.equal(d.dog.sex,'Hunn');const jessica=d.petId;
  assert.equal(await p.locator('.routine-card').count(),1);assert.equal(await p.locator('.routine-row').count(),4);
  assert.ok((await p.locator('.routine-card').boundingBox()).height<550);
  console.log('PASS_MULTI sentence registration, editable confirmation and one compact four-row overview');
  await nav(p,'Måltider');await p.locator('#meal-food').fill('Jessica-fôr');await p.getByRole('button',{name:'Legg til måltid',exact:true}).click();
  await nav(p,'Familie');await p.locator('#member-name').fill('Testperson');await p.locator('#member-role').fill('Turvenn');await p.getByRole('button',{name:'Legg til familiemedlem',exact:true}).click();
  await nav(p,'Turer');await p.locator('#place-name').fill('Skogstien');await p.getByRole('button',{name:'Legg til sted',exact:true}).click();await act(p,'startwalk');await act(p,'startwalk-confirm');await act(p,'pee');
  await add(p,'Tyra samojed tispe 4 år');d=await store(p);const tyra=d.petId;
  assert.equal(d.dog.name,'Tyra');assert.equal(d.otherPets.length,1);assert.equal(d.meals.length,0);assert.equal(d.places.length,0);assert.equal(d.active,null);assert.equal(d.family.length,1);
  await nav(p,'Måltider');await p.locator('#meal-food').fill('Tyra-fôr');await p.getByRole('button',{name:'Legg til måltid',exact:true}).click();await act(p,'give');
  await p.locator('#pet-select').selectOption(jessica);d=await store(p);assert.equal(d.dog.name,'Jessica');assert.equal(d.active.events.length,1);assert.equal(d.meals[0].food,'Jessica-fôr');assert.equal(d.feedings.length,0);assert.equal(d.places[0].name,'Skogstien');
  await nav(p,'Turer');await act(p,'endwalk');
  await p.locator('#pet-select').selectOption(tyra);d=await store(p);assert.equal(d.feedings.length,1);assert.equal(d.walks.length,0);assert.equal(d.places.length,0);
  assert.equal(await p.locator('.pet-avatar strong').innerText(),'T');
  console.log('PASS_MULTI separate walks, meals, feeding history and places; shared family; ongoing walk survives profile switch');
  await add(p,'Jeg har en katt som heter Mio. Han er en huskatt og er 6 måneder gammel.');d=await store(p);assert.equal(d.dog.species,'Katt');assert.equal(d.dog.sex,'Hann');assert.equal(d.dog.name,'Mio');const mio=d.petId;
  await nav(p,'Mitt dyr');assert.equal(await p.locator('#dog-species').inputValue(),'Katt');await p.locator('#dog-name').fill('Mio Test');await p.getByRole('button',{name:'Lagre profil',exact:true}).click();await p.reload();assert.match(await p.locator('.welcome-banner h1').innerText(),/Mio Test/);
  await p.locator('#pet-select').selectOption(jessica);assert.equal((await store(p)).dog.name,'Jessica');assert.equal((await store(p)).otherPets.find(x=>x.id===mio).dog.name,'Mio Test');
  console.log('PASS_MULTI third animal, species, profile editing and reload without cross-profile changes');
  await act(p,'pets');await act(p,'add-pet');await answer(p,'Fido');await p.reload();assert.equal((await store(p)).addingPet,true);assert.equal((await store(p)).dog.name,'Jessica');await act(p,'cancel-pet');await act(p,'pets');await act(p,'add-pet');assert.match(await p.locator('#messages').innerText(),/Fido/);await act(p,'cancel-pet');
  console.log('PASS_MULTI extra-animal registration resumes after reload and cancellation without overwriting existing profile');
  await p.locator('#pet-select').selectOption(tyra);await nav(p,'Turer');await act(p,'startwalk');await act(p,'startwalk-confirm');await p.locator('#pet-select').selectOption(jessica);
  await act(p,'logout');assert.match(await p.locator('#dialog-content').innerText(),/ingen konto eller passord/);await act(p,'logout-confirm');assert.match(await p.locator('h1').innerText(),process.env.NIKA_TEST_URL ? /logget ut|Et bedre liv/ : /Et bedre liv/);assert.equal((await store(p)).otherPets.length,2);await p.reload();assert.match(await p.locator('h1').innerText(),process.env.NIKA_TEST_URL ? /logget ut|Et bedre liv/ : /Et bedre liv/);assert.equal(await p.locator('#pet-select').count(),0);await photo(p,'local-logout-mobile');await act(p,'resume');assert.equal((await store(p)).dog.name,'Jessica');await p.locator('#pet-select').selectOption(tyra);assert.ok((await store(p)).active);await nav(p,'Turer');await act(p,'endwalk');assert.equal((await store(p)).walks.length,1);
  console.log('PASS_MULTI honest local logout, persisted ended session, resume and inactive-profile active walk');
  for(const [width,height,name] of [[390,844,'compact-dashboard-mobile'],[844,390,'compact-dashboard-landscape'],[1440,1000,'compact-dashboard-desktop']]){await p.setViewportSize({width,height});await nav(p,'Oversikt');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const small=await p.locator('button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.width<44||r.height<44);}).map(e=>e.textContent));assert.deepEqual(small,[]);await photo(p,name);}
  await p.setViewportSize({width:390,height:844});await act(p,'logout');await photo(p,'logout-dialog-mobile');await act(p,'close');
  await act(p,'pets');await photo(p,'pet-switcher-mobile');await act(p,'close');
  const second=await ctx.newPage();await second.goto(base);await p.locator('#pet-select').selectOption(jessica);await second.locator('#storage-alert').waitFor({state:'visible'});assert.equal(await second.locator('[data-action="pets"]').isDisabled(),true);await second.close();
  console.log('PASS_MULTI compact portrait/landscape/desktop, 44px controls and cross-tab write protection');
  await ctx.close();({ctx,p}=await fresh());
  const old={version:2,dog:{name:'Eldre Luna',breed:'Schæfer',age:'2 år',sex:'Hunn'},draft:{name:'Eldre Luna',breed:'Schæfer',age:'2 år'},walks:[],active:{id:'walk-old',start:Date.now()-1000,events:[]},meals:[{id:'meal-old',time:'08:00',food:'Vanlig fôr'}],feedings:[],family:[{id:'family-old',name:'Testperson',role:'Turvenn'}],places:[{id:'place-old',name:'Parken'}],revision:4};const raw=JSON.stringify(old);
  await p.evaluate(({KEY,raw})=>localStorage.setItem(KEY,raw),{KEY,raw});await p.reload();d=await store(p);assert.equal(d.multiPetVersion,1);assert.equal(d.dog.name,old.dog.name);assert.equal(d.active.id,'walk-old');assert.equal(d.meals[0].id,'meal-old');assert.equal(d.family.length,1);assert.equal(d.places[0].name,'Parken');assert.equal(await p.evaluate(k=>localStorage.getItem(k),BACKUP),raw);
  await add(p,'Bella puddel 3 år');assert.equal((await store(p)).otherPets[0].active.id,'walk-old');
  console.log('PASS_MULTI v2 migration preserves original byte-for-byte plus active walk and all existing lists');
  await p.evaluate(()=>localStorage.setItem('unrelated-data','keep'));await act(p,'privacy');await act(p,'reset');await act(p,'reset-confirm');assert.equal(await p.evaluate(k=>localStorage.getItem(k),BACKUP),null);assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),null);assert.equal(await p.evaluate(()=>localStorage.getItem('unrelated-data')),'keep');
  console.log('PASS_MULTI Nika-only deletion includes all profiles and migration copy; unrelated browser data preserved');
  await ctx.close();({ctx,p}=await fresh());
  const bad={...old,multiPetVersion:1,petId:'first',otherPets:[{id:'broken',dog:{name:'bad'}}],addingPet:false,sessionEnded:false};const badRaw=JSON.stringify(bad);await p.evaluate(({KEY,badRaw})=>localStorage.setItem(KEY,badRaw),{KEY,badRaw});await p.reload();assert.match(await p.locator('#storage-alert').innerText(),/Originalen er urørt/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),badRaw);
  console.log('PASS_MULTI malformed additional profile blocks writes without losing original data');
  await ctx.close();({ctx,p}=await fresh());
  await p.evaluate(({KEY,raw})=>localStorage.setItem(KEY,raw),{KEY,raw});await p.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='nika-demo-v2-before-multi')throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v);};});await p.reload();assert.match(await p.locator('.welcome-banner h1').innerText(),/Eldre Luna/);assert.match(await p.locator('#storage-alert').innerText(),/lagring/);assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);
  console.log('PASS_MULTI migration backup failure preserves original and usable in-memory profile');
  await ctx.close();({ctx,p}=await fresh());
  await p.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Disabled','SecurityError');}}));await p.reload();await answer(p,'Luna golden retriever 3 år');await act(p,'confirm');await add(p,'Tyra samojed 4 år');assert.match(await p.locator('.welcome-banner h1').innerText(),/Tyra/);assert.equal(await p.locator('#pet-select option').count(),2);assert.match(await p.locator('#storage-alert').innerText(),/Kunne ikke lagre/);await act(p,'logout');await act(p,'logout-confirm');assert.match(await p.locator('h1').innerText(),process.env.NIKA_TEST_URL ? /logget ut|Et bedre liv/ : /Et bedre liv/);await act(p,'resume');assert.match(await p.locator('.welcome-banner h1').innerText(),/Tyra/);
  console.log('PASS_MULTI two animals and local logout work in memory when storage is unavailable, with persistent warning');
  await ctx.close();assert.deepEqual(errors,[]);console.log('PASS_MULTI_ALL 11 multi-pet test groups and no console/resource errors');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
