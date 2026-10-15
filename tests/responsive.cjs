const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'evidence');
const base = process.env.NIKA_TEST_URL || 'http://127.0.0.1:4173';
const sizes = [[320,568],[390,844],[430,932],[568,320],[667,375],[844,390],[932,430],[768,1024],[1024,768],[1440,1000]];
let server, browser;
const errors = [];
fs.mkdirSync(evidence, {recursive:true});
async function photo(p, name) {
  await p.screenshot({path:path.join(evidence, name+'.png'),fullPage:true,animations:'disabled'});
  console.log('NIKA_IMAGE '+name+' '+(await p.screenshot({type:'jpeg',quality:70,fullPage:true,animations:'disabled'})).toString('base64'));
}
(async()=>{
  if (!process.env.NIKA_TEST_URL) {
    server = spawn(process.execPath,[path.join(__dirname,'server.cjs')],{stdio:'ignore'});
    for(let n=0;n<30;n++) {
      try { await fetch(base); break; } catch { await new Promise(r=>setTimeout(r,100)); }
    }
  }
  browser = await chromium.launch({headless:true});
  console.log('RESPONSIVE_BROWSER',browser.version());
  for(const [width,height] of sizes) {
    const ctx = await browser.newContext({viewport:{width,height},timezoneId:'Europe/Oslo'});
    const p = await ctx.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await p.goto(base);
    await p.locator('.dog-scene > img').evaluate(img=>img.decode());
    await p.locator('.dog-scene > img').evaluate(img=>Promise.all(img.getAnimations().map(animation=>animation.finished)));
    assert.equal(await p.title(),'Nika – Dyreappen');
    assert.match(await p.locator('.duo-story').innerText(),/Møt Nika og Tyra/);
    if (!process.env.NIKA_TEST_URL) {
      assert.equal(await p.locator('.note-one').isVisible(),true,'family text retained on every screen');
      assert.equal(await p.locator('.note-two').isVisible(),true,'walk text retained on every screen');
    }
    const geometry = await p.evaluate(()=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {image:rect('.dog-scene > img'),chat:rect('.chat'),story:rect('.duo-story'),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.equal(geometry.overflow,false,'horizontal overflow '+width+'x'+height);
    assert.ok(geometry.image.x>=-1 && geometry.image.right<=width+1,'dog image fits width');
    assert.ok(geometry.story.x>=-1 && geometry.story.right<=width+1,'story fits width');
    if(width<=760 && height>width) {
      assert.ok(geometry.image.bottom<=height,'dogs visible before scrolling '+width+'x'+height);
      assert.ok(geometry.story.bottom<=geometry.chat.y,'dogs and story precede chat');
    }
    if(width>height && width<=1024 && height<=560) {
      assert.ok(geometry.image.right<=geometry.chat.x+1,'dogs beside chat in landscape');
      assert.ok(geometry.image.bottom<=height+1,'dogs visible in short landscape viewport');
    }
    // Desktop chat has a deliberate 0.5-degree tilt; allow its ~2px visual edge offset.
    if(width===1440)assert.ok(Math.abs(geometry.image.y-geometry.chat.y)<=4,'dogs align with top of desktop chat');
    const tiny=await p.locator('button').evaluateAll(els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.width<44 || r.height<44);}).map(e=>e.textContent));
    assert.deepEqual(tiny,[],'44px touch controls');
    if((width===390&&height===844)||(width===844&&height===390))await photo(p,'orientation-onboarding-'+width+'x'+height);
    await p.locator('#answer').fill('Luna, blandingshund, 8 måneder');
    await p.locator('#answer').press('Enter');
    await p.getByRole('button',{name:'Ja, opprett profilen',exact:true}).click();
    await p.locator('.banner-dog').evaluate(img=>img.decode());
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'dashboard overflow');
    const banner=await p.evaluate(()=>{const b=document.querySelector('.welcome-banner').getBoundingClientRect();const i=document.querySelector('.banner-dog').getBoundingClientRect();return {br:b.right,ir:i.right,iy:i.y,by:b.y};});
    assert.ok(banner.ir<=banner.br+1,'both dogs within banner right edge');
    await p.reload();
    assert.match(await p.locator('.welcome-banner h1').innerText(),/Luna/);
    if((width===390&&height===844)||(width===844&&height===390))await photo(p,'orientation-dashboard-'+width+'x'+height);
    console.log('PASS_ORIENTATION',width+'x'+height,JSON.stringify(geometry));
    await ctx.close();
  }
  const rotationContext = await browser.newContext({viewport:{width:390,height:844}});
  const rotation = await rotationContext.newPage();
  await rotation.goto(base);
  await rotation.locator('#answer').fill('Luna');
  await rotation.locator('#answer').press('Enter');
  await rotation.setViewportSize({width:844,height:390});
  assert.match(await rotation.locator('#messages').innerText(),/Hvilken rase/);
  await rotation.locator('#answer').fill('blandingshund');
  await rotation.setViewportSize({width:390,height:360});
  assert.equal(await rotation.locator('.onboard-scene').evaluate(el=>getComputedStyle(el).flexDirection),'column','portrait keyboard must not trigger landscape layout');
  assert.equal(await rotation.locator('#answer').inputValue(),'blandingshund');
  await rotation.setViewportSize({width:390,height:844});
  await rotation.locator('#answer').press('Enter');
  await rotation.locator('#answer').fill('3 år');
  await rotation.locator('#answer').press('Enter');
  await rotation.setViewportSize({width:844,height:390});
  await rotation.getByRole('button',{name:'Ja, opprett profilen',exact:true}).click();
  assert.match(await rotation.locator('.welcome-banner h1').innerText(),/Luna/);
  await rotationContext.close();
  console.log('PASS_ROTATION draft and typed input survive orientation changes; portrait keyboard keeps column layout');
  assert.deepEqual(errors,[]);
  console.log('PASS_RESPONSIVE 10 viewports, onboarding, dashboard, reload and no console/resource errors');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();});
