'use strict';
// Conversations are account scoped by the server. No messages are stored in browser storage.
window.NikaSupport = ({account, modal, html, icon}) => {
  let viewId=0;
  const stamp=value=>value?new Date(value).toLocaleString('nb-NO',{dateStyle:'short',timeStyle:'short'}):'Ikke registrert';
  const button=(label,action)=>`<button class="btn secondary small" type="button" data-support="${action}">${label}</button>`;
  function shell(title,description){
    const id=++viewId;
    modal(`<section class="support-view"><div class="support-heading"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close" aria-label="Lukk">${icon('close')}</button></div><p class="subline">${description}</p><div id="support-body"></div><p class="error" id="support-error" role="status"></p></section>`);
    const root=document.querySelector('.support-view');
    return {root,body:root.querySelector('#support-body'),alive:()=>id===viewId&&root.isConnected&&document.querySelector('#dialog').open,error:e=>{if(root.isConnected)root.querySelector('#support-error').textContent=e.message;}};
  }
  async function chat(userId=null,email=''){
    const v=shell(userId?'Support · '+html(email):'Nika-support',userId?'Svar sendes til brukerens private samtale.':'Skriv til oss her. Bare du og Nika-administratoren kan lese samtalen.');
    v.body.innerHTML=`<div class="support-tools">${userId?button('Til innboksen','back'):''}${button('Oppdater','refresh')}${button('Avslutt samtalen','close-thread')}</div><p id="thread-status" class="subline"></p>${button('Vis eldre meldinger','older')}<ol class="support-messages" aria-label="Supportmeldinger" aria-live="polite"></ol><form id="support-form"><label class="field">Melding<textarea id="support-message" rows="3" maxlength="2000" required placeholder="Hva kan vi hjelpe deg med?"></textarea></label><div class="form-actions"><button class="btn" type="submit">Send melding ${icon('arrow')}</button><span class="subline">Maks 2000 tegn</span></div></form>`;
    const list=v.body.querySelector('ol'),form=v.body.querySelector('form'),input=form.querySelector('textarea'),older=v.body.querySelector('[data-support="older"]');
    let messages=[],busy=false,loading=false,requestId=null,requestText='',timer;
    const body=userId?{userId}:{};
    const render=()=>{list.innerHTML=messages.length?messages.map(m=>`<li class="${m.fromAdmin?'support-answer':'support-question'}"><div><strong>${m.fromAdmin?'Nika-support':(userId?'Bruker':'Du')}</strong><time>${html(stamp(m.createdAt))}</time></div><p>${html(m.message)}</p></li>`).join(''):'<li class="empty">Ingen meldinger ennå. Hvordan kan vi hjelpe?</li>';};
    async function load(previous=false){
      if(loading||!v.alive())return; loading=true;
      try{
        const result=await account.support('messages',{...body,...(previous&&messages.length?{before:messages[0].id}:{})});
        if(!v.alive())return;
        const incoming=result.messages||[];
        messages=previous?[...incoming,...messages]:[...messages.filter(m=>incoming.length&&m.id<incoming[0].id),...incoming];
        render(); if(previous||messages.length<=50)older.hidden=incoming.length<50;
        v.body.querySelector('#thread-status').textContent=result.status==='closed'?'Samtalen er avsluttet. En ny melding åpner den igjen.':'Vi svarer her i samtalen. Trykk Oppdater for å hente nye svar.';
      }catch(e){v.error(e);}finally{loading=false;}
    }
    form.onsubmit=async e=>{e.preventDefault();if(busy||!input.value.trim())return;busy=true;const send=form.querySelector('button');send.disabled=true;v.error({message:''});
      const message=input.value.trim();if(message!==requestText||!requestId){requestText=message;requestId=crypto.randomUUID();}
      try{await account.support('send',{...body,message,clientId:requestId});if(!v.alive())return;input.value='';requestId=null;await load();list.scrollTop=list.scrollHeight;}catch(e){v.error(e);}finally{busy=false;send.disabled=false;}
    };
    v.body.onclick=async e=>{const b=e.target.closest('[data-support]');if(!b)return;
      if(b.dataset.support==='back'){clearTimeout(timer);admin('threads');return;}
      if(b.dataset.support==='refresh'){await load();return;}
      if(b.dataset.support==='older'){await load(true);return;}
      if(b.dataset.support==='close-thread'){b.disabled=true;try{await account.support('close',body);await load();}catch(e){v.error(e);}finally{b.disabled=false;}}
    };
    await load();
    const poll=async()=>{if(!v.alive())return;if(document.visibilityState==='visible')await load();timer=setTimeout(poll,20000);};timer=setTimeout(poll,20000);
  }
  async function admin(initial='users'){
    const v=shell('Administrer Nika','Brukeroversikt og private supporthenvendelser. Dyreprofiler og GPS-ruter vises ikke her.');
    v.body.innerHTML=`<div class="support-tabs">${button('Brukere','users')}${button('Supportinnboks','threads')}</div><div id="admin-content"></div>`;
    let tab=initial,offset=0,search='',loading=false;
    const content=v.body.querySelector('#admin-content');
    async function load(){
      if(loading||!v.alive())return;loading=true;v.body.setAttribute('aria-busy','true');v.error({message:''});
      try{
        const result=await account.support(tab,{offset,search});if(!v.alive())return;
        v.body.querySelectorAll('.support-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.support===tab)));
        if(tab==='users'){
          content.innerHTML=`<div class="admin-stats"><div><strong>${html(result.total)}</strong><span>Registrerte brukere</span></div><div><strong>${html(result.active30Days)}</strong><span>Logget inn siste 30 dager</span></div></div><form id="admin-search"><label class="field">Søk på e-post<input type="search" maxlength="100" value="${html(search)}"></label><button class="btn secondary" type="submit">Søk</button></form><ul class="admin-list">${result.users.map(u=>`<li><strong>${html(u.email||'Uten e-post')}</strong><span>${u.verified?'Bekreftet':'Venter på bekreftelse'}</span><small>Registrert ${html(stamp(u.createdAt))} · Sist innlogget ${html(stamp(u.lastSignInAt))}</small></li>`).join('')||'<li>Ingen brukere funnet.</li>'}</ul>`;
          content.querySelector('form').onsubmit=e=>{e.preventDefault();if(loading)return;search=content.querySelector('input').value.trim();offset=0;load();};
        }else{
          content.innerHTML=`<h3>Supportinnboks</h3><ul class="admin-list">${result.threads.map(t=>`<li><button class="thread-button" data-user="${html(t.userId)}" data-email="${html(t.email)}"><strong>${html(t.email)}</strong><span>${t.status==='closed'?'Avsluttet':'Åpen'}${Number(t.unread)>0?' · '+html(t.unread)+' uleste':''}</span><small>${html(stamp(t.updatedAt))} · Åpne samtalen ${icon('arrow')}</small></button></li>`).join('')||'<li>Ingen supporthenvendelser ennå.</li>'}</ul>`;
        }
        const total=tab==='users'?result.matching:result.total;
        content.insertAdjacentHTML('beforeend',`<div class="support-tools">${button('Forrige','prev')}<span class="subline">${total?offset+1:0}–${Math.min(offset+50,total)} av ${html(total)}</span>${button('Neste','next')}${button('Oppdater','refresh')}</div>`);
        content.querySelector('[data-support="prev"]').disabled=offset===0;content.querySelector('[data-support="next"]').disabled=offset+50>=total;
      }catch(e){v.error(e);}finally{loading=false;v.body.setAttribute('aria-busy','false');}
    }
    v.body.onclick=e=>{if(loading)return;const thread=e.target.closest('[data-user]');if(thread){chat(thread.dataset.user,thread.dataset.email);return;}const b=e.target.closest('[data-support]');if(!b)return;const a=b.dataset.support;if(['users','threads'].includes(a)){tab=a;offset=0;}else if(a==='prev')offset=Math.max(0,offset-50);else if(a==='next')offset+=50;load();};
    await load();
  }
  return {chat,admin};
};
