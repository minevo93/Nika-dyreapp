const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createAccount}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/account-core.js','utf8')).toString('base64'));
 const config={enabled:true,emailEnabled:true,url:'https://example.supabase.co',key:'test-public',redirectTo:'https://www.nikaappen.no/'};
 function harness(){
  let clock=0,callback,serverUser={id:'existing-account',email:'person@example.invalid'};
  const writes=[],navigation=[],storage=new Map([['unrelated','keep']]);
  const auth={onAuthStateChange(fn){callback=fn;},async getSession(){return {data:{session:{}}}},async getUser(){return {data:{user:serverUser}}},async updateUser(body){writes.push(['password',body]);return {data:{user:serverUser}}},async signInWithPassword(body){writes.push(['login',body]);return {data:{session:{}}}},async signInWithOtp(body){writes.push(['otp',body]);return {}},async verifyOtp(){return {data:{session:{}}}},async reauthenticate(){writes.push(['reauth']);return {}}};
  const a=createAccount({config,createClient:()=>({auth}),storage:()=>({setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)}),origin:()=>new URL(config.redirectTo).origin,now:()=>clock,fetcher:async()=>({ok:true,json:async()=>({external:{email:true}})}),navigate:url=>navigation.push(url)});
  return {a,auth,writes,navigation,storage,setUser:u=>serverUser=u,tick:()=>clock+=61000,fire:(...args)=>callback(...args)};
 }
 const secret='Synthetic test phrase 43!';
 let h=harness();await h.a.signInPassword(' person@example.invalid ',secret);
 assert.deepEqual(h.writes,[['login',{email:'person@example.invalid',password:secret}]]);assert.deepEqual(h.navigation,[config.redirectTo]);assert.equal(h.a.user,null,'server restore verifies identity before opening data');assert.deepEqual([...h.storage],[['unrelated','keep']]);
 h=harness();h.auth.signInWithPassword=async()=>({error:{message:'private upstream details'},data:{session:null}});
 await assert.rejects(()=>h.a.signInPassword('person@example.invalid',secret),e=>e.message.includes('Kontroller')&&!e.message.includes('upstream'));assert.equal(h.navigation.length,0);
 await assert.rejects(()=>h.a.signInPassword('invalid',secret),/gyldig/);
 let release;h.auth.signInWithPassword=()=>new Promise(r=>release=r);const login=h.a.signInPassword('person@example.invalid',secret);await assert.rejects(()=>h.a.signInPassword('person@example.invalid',secret),/Vent/);release({data:{session:{}}});await login;
 console.log('PASS_PASSWORD login, generic errors, no auto-signup, double-submit guard, fixed redirect and no password storage');
 h=harness();await h.a.requestEmailCode('person@example.invalid','password');assert.equal(h.writes[0][1].options.shouldCreateUser,false);await h.a.verifyEmailCode('12345678');assert.deepEqual(h.navigation,[config.redirectTo+'?password=setup']);h.tick();await h.a.requestEmailCode('person@example.invalid','signup');assert.equal(h.writes[1][1].options.shouldCreateUser,true);
 h=harness();h.auth.signInWithOtp=async()=>({error:{code:'otp_disabled'}});await h.a.requestEmailCode('unknown@example.invalid','password');assert.equal(h.navigation.length,0);h.auth.verifyOtp=async()=>({data:{session:null},error:{code:'otp_expired'}});await assert.rejects(()=>h.a.verifyEmailCode('12345678'),/utløpt/);
 console.log('PASS_PASSWORD recovery never creates accounts, hides missing accounts, signup requires verification, expired code denied');
 h=harness();await assert.rejects(()=>h.a.setPassword(secret),/logge inn/);await h.a.restore();
 await assert.rejects(()=>h.a.setPassword('short'),/12 tegn/);await assert.rejects(()=>h.a.setPassword('ø'.repeat(37)),/72 byte/);
 await h.a.setPassword(secret);assert.equal(h.a.user.id,'existing-account');assert.deepEqual(h.writes,[['password',{password:secret}]]);assert.deepEqual([...h.storage],[['unrelated','keep']]);
 h.setUser({id:'someone-else'});await assert.rejects(()=>h.a.setPassword(secret),/bekreftes/);assert.equal(h.writes.length,1);
 h=harness();await h.a.restore();h.auth.getUser=async()=>{h.fire('SIGNED_OUT');return {data:{user:{id:'existing-account'}}}};await assert.rejects(()=>h.a.setPassword(secret),/bekreftes/);assert.equal(h.writes.length,0);
 console.log('PASS_PASSWORD verified same-account update, no role or data changes, length/byte validation, logout and changed identity abort');
 h=harness();await h.a.restore();h.auth.updateUser=async()=>({error:{code:'reauthentication_needed',message:'internal'}});await assert.rejects(()=>h.a.setPassword(secret),e=>e.code==='reauthentication_needed');await h.a.requestPasswordConfirmation();await assert.rejects(()=>h.a.requestPasswordConfirmation(),/ett minutt/);
 h.auth.updateUser=async body=>{h.writes.push(['password',body]);return {data:{user:{id:'existing-account'}}}};await h.a.setPassword(secret,'12345678');assert.deepEqual(h.writes.at(-1),['password',{password:secret,nonce:'12345678'}]);
 h.auth.updateUser=()=>new Promise(r=>release=r);const update=h.a.setPassword(secret);await new Promise(r=>setImmediate(r));await assert.rejects(()=>h.a.setPassword(secret),/Vent/);release({data:{user:{id:'existing-account'}}});await update;
 console.log('PASS_PASSWORD reauthentication, nonce, cooldown and single update in flight; SDK simulation, no real user password changed');
})().catch(e=>{console.error(e);process.exitCode=1});
