/* Local, rule-based registration. No network, breed lookup or general AI. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NikaRegistration = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const numbers = {en:1,ett:1,'én':1,to:2,tre:3,fire:4,fem:5,seks:6,sju:7,syv:7,'åtte':8,ni:9,ti:10,elleve:11,tolv:12};
  const agePattern = /(?<![\p{L}\p{N}_])(\d+(?:[.,]\d+)?|en|ett|én|to|tre|fire|fem|seks|sju|syv|åtte|ni|ti|elleve|tolv)\s*(år|måneder|måned|mnd\.?)(?!\p{L})(?:\s+gammel)?/iu;
  const breeds = ['golden retriever','labrador retriever','border collie','norsk skogkatt','maine coon','ukjent rase','blandingshund','blanding','schæfer','schaefer','samojed','pomeranian','chihuahua','dvergpuddel','puddel','huskatt','labrador','eurasier'];
  const tidy = s => String(s || '').replace(/\s+/g,' ').trim();
  const edge = s => tidy(s).replace(/^[\s,;:.!?–—-]+|[\s,;:.!?–—-]+$/g,'').trim();
  function normalizeAge(v) {
    const m = tidy(v).match(new RegExp('^'+agePattern.source+'$','iu'));
    if (!m) return null;
    const n = numbers[m[1].toLowerCase()] || Number(m[1].replace(',','.'));
    const years = m[2].toLowerCase()==='år';
    if (!Number.isFinite(n) || n<=0 || (years?n*12:n)>1200) return null;
    return n+' '+(years?'år':n===1?'måned':'måneder');
  }
  function parse(input, options = {}) {
    const text = tidy(input);
    if (!text || text.length>300) return {fields:{}, error:'Skriv et svar på inntil 300 tegn.'};
    const fields = {}, ageMatch=text.match(agePattern);
    if (ageMatch) {
      fields.age = normalizeAge(ageMatch[0]);
      if (!fields.age) return {fields:{},error:'Skriv en gyldig alder over 0 og inntil 100 år, med år eller måneder.'};
    }
    const female=/\b(tispe|hunn(?:hund|katt)?|hun)\b/iu.test(text);
    const male=/\b(hann(?:hund|katt)?|han)\b/iu.test(text);
    if(female && male)return {fields:{},error:'Jeg fant både hann og hunn. Skriv ett kjønn, eller bruk den stegvis registreringen.'};
    if(female) fields.sex='Hunn';
    if(male) fields.sex='Hann';
    if(/\b(katt|katten|kattunge|huskatt|maine coon|norsk skogkatt)\b/iu.test(text))fields.species='Katt';
    else if(/\b(kanin|kaninen)\b/iu.test(text))fields.species='Kanin';
    else if(/\b(hund|hunden|valp|valpen)\b/iu.test(text))fields.species='Hund';
    const named = text.match(/(?:\bheter\s+|\bkalles\s+|\bnavn(?:et)?\s*(?:er\s+|:\s*))([\p{L}][\p{L}\p{M}'’ -]{0,59}?)(?=\s+(?:og|er|som|på|har)\b|[,;.!?]|\s+\d|$)/iu);
    let nameRange=null;
    if(named){fields.name=edge(named[1]);nameRange={text:named[0],index:named.index};}
    let rest = ageMatch ? text.slice(0,ageMatch.index)+' '+text.slice(ageMatch.index+ageMatch[0].length) : text;
    if(!named)rest=rest.replace(/^(?:hunden|katten|kaninen|valpen)(?:\s+(?:min|vår))?\s+(?!heter\b)/iu,'');
    // Comma-separated input remains supported, including decimal ages (2,5 år).
    const commaParts=rest.split(/[,;]/).map(edge).filter(Boolean);
    if(!named && /[,;]/.test(rest) && commaParts.length>=2 && !/\b(heter|jeg|hunden|katten)\b/iu.test(commaParts[0])) {
      fields.name=commaParts[0];
      rest=commaParts.slice(1).join(' ');
    } else if(named) {
      rest=rest.replace(nameRange.text,' ');
    } else {
      const breedHit=breeds.map(b=>({b,index:rest.toLowerCase().indexOf(b)})).filter(x=>x.index>=0).sort((a,b)=>a.index-b.index || b.b.length-a.b.length)[0];
      const structured=!!(ageMatch || female || male || fields.species || /\s+er\s+/iu.test(rest));
      if(options.field!=='breed' || (breedHit && breedHit.index>0)) {
        let prefix=breedHit?edge(rest.slice(0,breedHit.index)):'';
        prefix=prefix.replace(/\s+(?:er|som er|og er|på|en|ei|et).*$/iu,'').trim();
        if(prefix && /^[\p{L}][\p{L}\p{M}'’ -]{0,59}$/u.test(prefix) && !/^(jeg|min|vi|det|hun|han|en|ei|et|hunden|katten|kaninen)\b/iu.test(prefix)) {
          fields.name=prefix;rest=rest.slice(rest.toLowerCase().indexOf(breedHit.b));
        } else if(structured && options.field!=='breed') {
          const first=rest.match(/^([\p{L}][\p{L}\p{M}'’-]*)(?:\s+|$)/u);
          if(first && !/^(jeg|min|vi|det|hun|han|en|ei|et|hund|hunden|katt|katten|kanin|kaninen|dette|er|har)$/iu.test(first[1])) {
            fields.name=first[1];rest=rest.slice(first[0].length);
          }
        }
      }
    }
    rest=rest
      .replace(/\b(?:tispe|hunn(?:hund|katt)?|hun|hann(?:hund|katt)?|han)\b/giu,' ')
      .replace(/\b(?:jeg|vi)\s+har\s+(?:en|ei|et)?\s*/giu,' ')
      .replace(/\b(?:hund(?:en)?|katt(?:en)?|kanin(?:en)?|valp(?:en)?|kattunge)(?:\s+(?:min|vår))?\b/giu,' ')
      .replace(/\b(?:det|den|dette)\s+er\b/giu,' ')
      .replace(/(?<!\p{L})(?:hun|han|som|og|er|en|ei|et|på|min|vår|har|gammel|år|heter|av)(?!\p{L})/giu,' ')
      .replace(/\b(?:rasen\s*(?:er|:)?|rase\s*:)/giu,' ');
    rest=edge(rest);
    if(/^(?:vet ikke|ukjent|vet ikke rasen|ukjent rase)$/iu.test(rest))rest='Ukjent rase';
    if(rest && !/[<>]/.test(rest) && (ageMatch || named || female || male || fields.species || options.field==='breed' || /[,;]/.test(text)))fields.breed=rest;
    // A plain first answer is just a name; don't invent a breed or age.
    if(!ageMatch && !named && !female && !male && !fields.species && !/[,;]/.test(text) && options.field!=='breed')return {fields:{},structured:false};
    return {fields,structured:true};
  }
  return {parse,normalizeAge};
});
