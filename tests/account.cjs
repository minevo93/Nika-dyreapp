const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const source=fs.readFileSync('src/account-core.js','utf8');
 const {createAccount}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const config={enabled:true,url:'https://example.supabase.co',key:'public-test',redirectTo:'https://nika-dyreapp.netlify.app/'};
 function harness(overrides={}) {
  const calls=[], values=new Map([['unrelated','keep'],['nika-demo-v2','local-data']]);
  let callback, row=null, refuse=false, oauthError=null, logoutError=null;
  const client={auth:{onAuthStateChange(fn){callback=fn;return {data:{subscription:{unsubscribe(){}}}}},async getSession(){return {data:{session:{user:{id:'user-a'}}}}},async getUser(){return {data:{user:{id:'user-a',email:'test@example.invalid'}}}},async signInWithOAuth(o){calls.push(['oauth',o]);return {error:oauthError}},async signOut(o){calls.push(['signout',o]);if(!logoutError)callback('SIGNED_OUT',null);return {error:logoutError}}},from(name){calls.push(['table',name]);let type='read', input, filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},insert(v){type='insert';input=v;return q},update(v){type='update';input=v;return q},delete(){type='delete';return q},async maybeSingle(){calls.push([type,input,filters]);if(refuse)return {data:null,error:null};if(type==='insert'){row={...input};return {data:{revision:0}}}if(type==='update'){assert.ok(filters.some(([k,v])=>k==='revision'&&v===row.revision));row={...row,...input};return {data:{revision:row.revision}}}return {data:row}},then(resolve){if(type==='delete'){row=null;return Promise.resolve({error:null}).then(resolve)}}};return q;}};
  const a=createAccount({config,createClient:(...args)=>{calls.push(['create',args]);return client},storage:()=>({setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}),origin:()=>new URL(config.redirectTo).origin,fetcher:async()=>({ok:true,json:async()=>({external:{google:true,azure:true}})}),navigate:u=>calls.push(['navigate',u]),...overrides});
  return {a,calls,values,client,setRefuse(v){refuse=v},setOauthError(v){oauthError=v},setLogoutError(v){logoutError=v},fire:(e,s)=>callback(e,s)};
 }
 let h=harness(); await h.a.signIn('azure'); await h.a.signIn('azure');
 assert.equal(h.calls.filter(x=>x[0]==='oauth').length,1);const request=h.calls.find(x=>x[0]==='oauth')[1];assert.equal(request.provider,'azure');assert.equal(request.options.scopes,'email');assert.equal(request.options.redirectTo,config.redirectTo);
 assert.equal(h.calls.find(x=>x[0]==='create')[1][2].auth.flowType,'pkce');
 console.log('PASS_ACCOUNT Microsoft personal-account flow, email scope, fixed redirect, PKCE, double click');
 h=harness();await h.a.signIn('google');assert.equal(h.calls.find(x=>x[0]==='oauth')[1].options.scopes,undefined);await assert.rejects(()=>h.a.signIn('admin'),/Velg/);
 h=harness({origin:()=> 'https://evil.invalid'});await assert.rejects(()=>h.a.signIn('google'),/offentlige/);
 h=harness({fetcher:async()=>({ok:true,json:async()=>({external:{google:false,azure:false}})})});await assert.rejects(()=>h.a.signIn('google'),/ikke klar/);assert.equal(h.calls.length,0);
 console.log('PASS_ACCOUNT minimum Google scopes, provider allowlist, rejected foreign redirect and disabled provider');
 h=harness({storage:()=>{throw Error('storage unavailable')}});await assert.rejects(()=>h.a.restore(),/storage unavailable/);
 h=harness({fetcher:async()=>({ok:false})});await assert.rejects(()=>h.a.providers(),/kontrollere/);
 h=harness({config:{...config,enabled:false}});assert.equal(await h.a.restore(),null);assert.deepEqual(await h.a.providers(),{google:false,azure:false});assert.equal(h.calls.length,0);
 console.log('PASS_ACCOUNT storage/network failures and inactive release make no authentication calls');
 h=harness();await h.a.restore();assert.equal(h.a.user.id,'user-a');assert.equal(await h.a.load(),null);
 const data={version:2,sessionEnded:true,dog:{name:'A'}};const p1=h.a.save(data);data.dog.name='B';const p2=h.a.save(data);await Promise.all([p1,p2]);
 const writes=h.calls.filter(x=>['insert','update'].includes(x[0]));assert.equal(writes[0][1].payload.dog.name,'A');assert.equal(writes[0][1].payload.sessionEnded,false);assert.equal(writes[1][1].payload.dog.name,'B');assert.ok(writes[1][2].some(([k,v])=>k==='user_id'&&v==='user-a'));assert.ok(writes[1][2].some(([k,v])=>k==='revision'&&v===0));
 assert.equal(h.values.get('nika-demo-v2'),'local-data');await h.a.signOut();assert.equal(h.a.user,null);assert.deepEqual(h.calls.at(-1),['navigate','/?signedout=1']);assert.equal(h.values.get('unrelated'),'keep');
 console.log('PASS_ACCOUNT verified identity, serialized snapshots, revision conflict protection, isolated local data, logout to homepage');
 h=harness();await h.a.restore();await h.a.load();h.setRefuse(true);await assert.rejects(()=>h.a.save({version:2}),/ikke lagret/);await assert.rejects(()=>h.a.save({version:2}),/ikke lagret/);await assert.rejects(()=>h.a.signOut(),/ikke lagret/);await h.a.signOut({discardUnsaved:true});assert.deepEqual(h.calls.at(-1),['navigate','/?signedout=1']);
 h=harness();await h.a.restore();h.setLogoutError(Error('network'));await assert.rejects(()=>h.a.signOut(),/Utloggingen/);assert.equal(h.calls.some(x=>x[0]==='navigate'),false);
 console.log('PASS_ACCOUNT conflicts never silently overwrite; unsaved data require explicit discard; failed logout stays visible');
 h=harness();await h.a.restore();let changed=false;h.a.on(t=>{if(t==='accountchanged')changed=true});h.fire('SIGNED_IN',{user:{id:'user-b'}});assert.equal(changed,true);assert.equal(h.a.user,null);
 console.log('PASS_ACCOUNT account switching clears previous identity');
 console.log('PASS_ACCOUNT_ALL 7 groups (controlled SDK simulation, not real Google/Microsoft login)');
})().catch(e=>{console.error(e);process.exitCode=1});
