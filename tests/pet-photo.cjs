const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
let browser,server;
(async()=>{
 const base=process.env.NIKA_TEST_URL||'http://127.0.0.1:4173';
 if(!process.env.NIKA_TEST_URL){server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});for(let i=0;i<30;i++){try{await fetch(base);break}catch{await new Promise(r=>setTimeout(r,100))}}}
 browser=await chromium.launch();const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('#answer').fill('Luna blandingshund 3 år');await p.locator('#answer').press('Enter');await p.getByRole('button',{name:'Ja, opprett profilen',exact:true}).click();
 assert.equal(await p.locator('#pet-controls #account-button').count(),1,'account control grouped with pet controls');
 const data=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='#b86c3b';ctx.fillRect(0,0,300,400);ctx.fillStyle='#486b52';ctx.fillRect(300,0,300,400);return c.toDataURL('image/png').split(',')[1]});
 const slide=(id,value)=>p.locator(id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))},value);
 const file={name:'test-photo.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
 await p.locator('.pet-avatar').click();await p.locator('#photo-file').setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await p.waitForFunction(()=>document.querySelector('#photo-error').textContent.includes('JPG'));assert.equal(await p.locator('#photo-save').isDisabled(),true);
 await p.locator('#photo-file').setInputFiles(file);await p.waitForFunction(()=>!document.querySelector('#photo-save').disabled);
 await slide('#photo-zoom','1.5');await slide('#photo-x','80');await p.locator('#photo-save').click();await p.reload();await p.locator('.pet-avatar img').waitFor();
 const first=await p.locator('.pet-avatar img').getAttribute('src');assert.match(first,/^data:image\/webp;base64,/);assert.ok(first.length<=33000);
 await p.locator('[data-go="profile"]').click();await p.locator('#dog-name').fill('Luna endret');await p.getByRole('button',{name:'Lagre profil',exact:true}).click();await p.reload();assert.equal(await p.locator('.pet-avatar img').getAttribute('src'),first,'editing name preserves photo');
 await p.locator('.pet-avatar').click();await p.locator('#photo-preview').waitFor();await p.waitForFunction(()=>!document.querySelector('#photo-remove').disabled);await p.locator('#photo-remove').click();await p.getByRole('button',{name:'Avbryt',exact:true}).click();assert.equal(await p.locator('.pet-avatar img').getAttribute('src'),first,'cancel preserves image');
 await p.locator('.pet-avatar').click();await p.locator('#photo-file').setInputFiles(file);await p.waitForFunction(()=>!document.querySelector('#photo-save').disabled);await slide('#photo-x','0');await p.locator('#photo-save').click();assert.notEqual(await p.locator('.pet-avatar img').getAttribute('src'),first,'replacement saved');
 await p.locator('[data-action="pets"]').click();await p.locator('[data-action="add-pet"]').click();await p.locator('#answer').fill('Tyra samojed 2 år');await p.locator('#answer').press('Enter');await p.getByRole('button',{name:'Ja, opprett profilen',exact:true}).click();assert.equal(await p.locator('.pet-avatar img').count(),0,'another pet does not inherit photo');
 await p.locator('#pet-select').selectOption({label:'Luna endret · Hund'});assert.equal(await p.locator('.pet-avatar img').count(),1);
 fs.mkdirSync('evidence',{recursive:true});
 for(const[width,height]of [[390,844],[768,1024],[844,390],[1440,1000]]){await p.setViewportSize({width,height});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:`evidence/pet-photo-${width}x${height}.png`,fullPage:true});}
 assert.match(await p.locator('.partnership').innerText(),/I samarbeid med www.miveno.no & www.pusterom.eu/);
 await p.locator('.pet-avatar').click();await p.waitForFunction(()=>!document.querySelector('#photo-remove').disabled);await p.locator('#photo-remove').click();await p.locator('#photo-save').click();await p.reload();assert.equal(await p.locator('.pet-avatar img').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS_PHOTO upload, invalid type, crop, replace, cancel, delete, reload, profile editing, per-pet isolation, compact toolbar and 4 viewport sizes; synthetic image only');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.kill()});
