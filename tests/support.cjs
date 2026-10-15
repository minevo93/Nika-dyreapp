const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createAccount}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/account-core.js','utf8')).toString('base64'));
 let callback,rpcResponse={data:{messages:[]}},hold;
 const calls=[],storage=new Map(),client={auth:{onAuthStateChange(fn){callback=fn},async getSession(){return {data:{session:{}}}},async getUser(){return {data:{user:{id:'support-user'}}}}},async rpc(name,args){calls.push({name,args});return hold?new Promise(r=>hold=r):rpcResponse}};
 const a=createAccount({config:{enabled:true,url:'https://example.supabase.co',key:'public-test'},createClient:()=>client,storage:()=>({setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)})});
 await assert.rejects(()=>a.support('messages'),/Logg inn/);await a.restore();
 assert.deepEqual(await a.support('messages'),{messages:[]});assert.deepEqual(calls[0],{name:'nika_support',args:{action:'messages',body:{}}});
 await assert.rejects(()=>a.support('promote'),/Ukjent/);
 rpcResponse={error:{code:'42501',message:'private detail'}};await assert.rejects(()=>a.support('users'),/ikke tilgang/);
 rpcResponse={error:{code:'P0001',message:'Too many messages'}};await assert.rejects(()=>a.support('send'),/ett minutt/);
 rpcResponse={error:{message:'private details'}};await assert.rejects(()=>a.support('messages'),e=>!e.message.includes('private details'));
 hold=true;const pending=a.support('messages');callback('SIGNED_OUT');hold({data:{messages:[{message:'stale'}]}});await assert.rejects(()=>pending,/Økten er endret/);assert.equal(storage.size,0);
 console.log('PASS_SUPPORT_CORE authenticated calls, fixed RPC, action allowlist, access/rate/network errors, stale account response discarded and no message storage');
})().catch(e=>{console.error(e);process.exitCode=1});
