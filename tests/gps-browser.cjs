const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
let browser,server;const base=process.env.NIKA_TEST_URL||'http://127.0.0.1:4173';
(async()=>{
if(!process.env.NIKA_TEST_URL){server=spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});for(let i=0;i<30;i++){try{await fetch(base);break}catch{await new Promise(r=>setTimeout(r,100))}}}
browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:390,height:844},geolocation:{latitude:59,longitude:10,accuracy:5},permissions:['geolocation']});
const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('#answer').fill('Luna golden retriever 3 år');await p.locator('#onboard-form button').click();await p.locator('[data-action="confirm"]').click();await p.locator('[data-action="startwalk"]').first().click();
assert.equal(await p.locator('[data-action="gps-start"]').count(),1);await p.locator('[data-action="gps-start"]').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).active.gps?.length===1);
await p.waitForTimeout(5100);await ctx.setGeolocation({latitude:59.001,longitude:10.001,accuracy:5});await p.waitForFunction(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).active.gps.length===2);
await p.locator('[data-action="gps-stop"]').click();await ctx.setGeolocation({latitude:60,longitude:11,accuracy:5});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).active.gps.length),2);
await p.reload();await p.locator('[data-go="walks"]').click();assert.equal(await p.locator('[data-action="gps-start"]').count(),1);assert.match(await p.locator('#gps-panel').innerText(),/GPS er av/);
await p.locator('[data-action="endwalk"]').click();await p.getByText('Vis GPS-rute',{exact:true}).click();assert.equal(await p.locator('.gps-route svg').count(),1);
fs.mkdirSync('evidence',{recursive:true});for(const [width,height] of [[390,844],[768,1024],[844,390],[1440,1000]]){await p.setViewportSize({width,height});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:`evidence/gps-${width}x${height}.png`,fullPage:true});}
await p.locator('[data-action="delete-route"]').click();await p.locator('[data-action="delete-route-confirm"]').click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('nika-demo-v2')).walks[0].gps),undefined);
assert.deepEqual(errors,[]);console.log('PASS_GPS_BROWSER Chromium '+browser.version()+': browser geolocation with simulated coordinates, opt-in, pause, reload, history, deletion, 390/768/844/1440 layout; not physical phone');
await ctx.close();
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server?.kill()});
