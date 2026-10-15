// Public, read-only integration check. Never requests or enters a real sign-in code.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const base=process.env.NIKA_TEST_URL;
 if(!base)throw Error('NIKA_TEST_URL required');
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage(),errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='OPTIONS')writes.push(r.method()+' '+new URL(r.url()).pathname)});
 await page.goto(base,{waitUntil:'networkidle'});
 assert.equal(await page.locator('#account-button').isVisible(),false,'ordinary homepage remains gated');
 const url=new URL(base);url.searchParams.set('kontotest','1');
 await page.goto(url.href,{waitUntil:'networkidle'});
 await page.locator('#account-button').click();
 await page.locator('#login-email').waitFor({state:'visible'});
 assert.equal(await page.getByRole('button',{name:'Send innloggingskode',exact:true}).isEnabled(),true);
 assert.equal(await page.locator('[data-action="google"]').isVisible(),false);
 assert.equal(await page.locator('[data-action="azure"]').isVisible(),false);
 assert.equal(await page.locator('#account-error').innerText(),'');
 fs.mkdirSync('evidence',{recursive:true});
 for(const [width,height] of [[390,844],[844,390],[1440,1000]]){
  await page.setViewportSize({width,height});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
  const button=await page.getByRole('button',{name:'Send innloggingskode',exact:true}).boundingBox();
  assert.ok(button.height>=44&&button.width>=44,'touch target');
  await page.screenshot({path:`evidence/account-public-${width}x${height}.png`,fullPage:true});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[],'no email, user or data mutations');
 console.log('PASS_PUBLIC_ACCOUNT actual production bundle and provider settings: gated homepage, real email form, unavailable social providers hidden, 3 viewport sizes, zero writes, zero page errors');
 console.log('PUBLIC_ACCOUNT_URL '+page.url());
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
