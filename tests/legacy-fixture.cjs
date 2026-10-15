// Isolated migration/regression fixture. The production account service is replaced
// in the browser test only; there is no public URL, flag or entry point for local mode.
module.exports = async target => target.addInitScript(()=>{
 Object.defineProperty(window,'NikaAccount',{get:()=>({enabled:false}),set:()=>{}});
});
