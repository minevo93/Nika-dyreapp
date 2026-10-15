const assert=require('node:assert/strict');
const {parse,normalizeAge}=require('../public/registration.js');
const examples=[
 ['Jessica schæfer tispe 2 år',{name:'Jessica',breed:'schæfer',sex:'Hunn',age:'2 år'}],
 ['Hunden min heter Luna og er en golden retriever på 3 år.',{name:'Luna',breed:'golden retriever',age:'3 år',species:'Hund'}],
 ['Luna er en 3 år gammel golden retriever',{name:'Luna',breed:'golden retriever',age:'3 år'}],
 ['Jeg har en katt som heter Mio. Han er en huskatt og er 6 måneder gammel.',{name:'Mio',breed:'huskatt',sex:'Hann',species:'Katt',age:'6 måneder'}],
 ['Tyra 4 år samojed tispe',{name:'Tyra',breed:'samojed',sex:'Hunn',age:'4 år'}],
 ['Luna, golden retriever, 3 år',{name:'Luna',breed:'golden retriever',age:'3 år'}],
 ['Luna, blandingshund, 2,5 år',{name:'Luna',breed:'blandingshund',age:'2.5 år'}],
 ['Bamse eurasier hann 5 år',{name:'Bamse',breed:'eurasier',sex:'Hann',age:'5 år'}],
 ['Luna Bella golden retriever tre år',{name:'Luna Bella',breed:'golden retriever',age:'3 år'}],
 ['Katten min heter Pus og er av ukjent rase og er åtte måneder.',{name:'Pus',breed:'Ukjent rase',species:'Katt',age:'8 måneder'}],
 ['Luna 3 år',{name:'Luna',age:'3 år'}],
 ['Jeg har en golden retriever på 3 år',{breed:'golden retriever',age:'3 år'}],
 ['Jessica er en schæfer tispe på to år',{name:'Jessica',breed:'schæfer',sex:'Hunn',age:'2 år'}],
 ['Hunden min heter Bella Rosa og er en terrierblanding på 18 måneder',{name:'Bella Rosa',breed:'terrierblanding',species:'Hund',age:'18 måneder'}],
 ['Mio, huskatt, hann, 6 mnd',{name:'Mio',breed:'huskatt',sex:'Hann',species:'Katt',age:'6 måneder'}],
 ['Kaninen Nusse dvergvedder 1 år',{name:'Nusse',breed:'dvergvedder',species:'Kanin',age:'1 år'}],
 ['Hunden Jessica er en schæfer 2 år',{name:'Jessica',breed:'schæfer',species:'Hund',age:'2 år'}],
];
for(const [text,expected] of examples){const out=parse(text);for(const [k,v] of Object.entries(expected))assert.equal(out.fields[k],v,text+' -> '+k);assert.equal(out.error,undefined,text);}
assert.deepEqual(parse('Luna').fields,{});
assert.equal(parse('schæfer tispe 2 år',{field:'breed'}).fields.breed,'schæfer');
assert.equal(parse('schæfer tispe 2 år',{field:'breed'}).fields.name,undefined);
assert.ok(parse('Luna puddel 0 år').error);
assert.ok(parse('Luna puddel 101 år').error);
assert.ok(parse('Luna tispe hann 3 år').error);
assert.equal(normalizeAge('8 måneder'),'8 måneder');
assert.equal(normalizeAge('tre år'),'3 år');
assert.equal(normalizeAge('tre'),null);
console.log('PASS_REGISTRATION '+examples.length+' sentence cases and validation/partial-answer checks');
