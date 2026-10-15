const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
const {createAccount}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/account-core.js','utf8')).toString('base64'));
let revision=0,removed=false,payload={version:2,dog:{name:'Shared'}},privateReads=0,privateWrites=0,navigation='';const records=new Map([['nika-workspace-user','family']]);
const client={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{}}}),getUser:async()=>({data:{user:{id:'user'}}})},from(){privateReads++;return {select(){return this},eq(){return this},maybeSingle:async()=>({data:{payload:{version:2,dog:{name:'Private'}},revision:0}})}},async rpc(name,{action,body}){
 assert.equal(name,'nika_family');if(action==='context')return {data:{family:removed?null:{id:'family',name:'Our family'}}};
 if(removed)return {error:{code:'42501'}};
 if(action==='load')return {data:{payload,revision}};
 if(action==='save'){if(body.revision!==revision)return {error:{code:'40001'}};payload=body.payload;revision++;return {data:{revision}};}
 return {data:{}};
}};
const make=()=>createAccount({config:{enabled:true,url:'https://example.invalid',key:'public'},createClient:()=>client,storage:()=>({getItem:k=>records.get(k),setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)}),navigate:u=>navigation=u});
let a=make();await a.restore();assert.equal((await a.load()).dog.name,'Shared');assert.equal(a.workspace,'family');assert.equal(privateReads,0);
const first={version:2,dog:{name:'First'}};const write=a.save(first);first.dog.name='Second';await Promise.all([write,a.save(first)]);assert.equal(revision,2);assert.equal(payload.dog.name,'Second');assert.equal(privateReads,0);
await assert.rejects(()=>a.removeData(),/Avslutt/);revision++;await assert.rejects(()=>a.save(first),/nyere/);await assert.rejects(()=>a.switchWorkspace('personal'),/nyere/);assert.equal(navigation,'','conflict prevents leaving unsaved data');
a=make();await a.restore();await a.load();removed=true;await assert.rejects(()=>a.save(first),/kunne ikke lagres/);assert.equal(privateReads,0,'revoked shared write never falls back into personal data');
a=make();await a.restore();assert.equal((await a.load()).dog.name,'Private');assert.equal(a.workspace,'personal');assert.equal(privateReads,1,'fresh session returns private data after removal');
console.log('PASS_FAMILY_CORE workspace isolation, serialized revisions, stale conflict, revoked access, no silent private fallback while editing');
})().catch(e=>{console.error(e);process.exitCode=1});
