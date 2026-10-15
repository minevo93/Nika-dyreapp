"use strict";
(() => {
  const account = window.NikaAccount;
  let cloudMode = false, cloudReady = false, accountRole = "member";
  const gps=window.NikaGPS.recorder({geolocation:navigator.geolocation,onPoint:()=>{save();updateGPS();},onStatus:()=>updateGPS()});
  function updateGPS(){
    const panel=$('gps-panel');if(!panel)return;
    panel.querySelector('[data-gps-status]').textContent=gps.status;
    const button=panel.querySelector('[data-action^="gps-"]');
    button.textContent=gps.active?'Sett GPS på pause':'Slå på GPS';
    button.dataset.action=gps.active?'gps-stop':'gps-start';
    panel.querySelector('[data-gps-route]').innerHTML=window.NikaGPS.route(d.active?.gps);
  }
  function gpsPanel(){return `<p role="status" data-gps-status>${html(gps.status)}</p><p class="subline">GPS er valgfritt og registrerer bare mens Nika er synlig. Ved skjermlås eller bytte av app pauses GPS. ${cloudMode && account.workspace==='family'?'Ruten deles med familien.':'Ruten lagres sammen med turen.'}</p><div class="form-actions">${btn(gps.active?'Sett GPS på pause':'Slå på GPS',gps.active?'gps-stop':'gps-start')}${btn('Hjelp med GPS','gps-help','text-button')}</div><div data-gps-route>${window.NikaGPS.route(d.active?.gps)}</div>`;}
  const KEY = "nika-demo-v2",
    LEGACY = "nika-mvp-v1",
    PRE_MULTI = "nika-demo-v2-before-multi";
  const SPECIES = ["Hund", "Katt", "Kanin", "Annet dyr"];
  // Keep the active profile in the original v2 shape. otherPets contains only inactive profiles, never a second copy of the active one.
  const PET_FIELDS = ["dog", "walks", "active", "meals", "feedings", "places"];
  const $ = (id) => document.getElementById(id),
    html = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  const uid = () => crypto.randomUUID(),
    clean = (s, n = 100) => (typeof s === "string" ? s.trim().slice(0, n) : ""),
    validText = (s, n = 100) =>
      typeof s === "string" && s.trim().length > 0 && s.length <= n;
  const finite = (n) => Number.isFinite(n) && n >= 0,
    stamp = (n) => finite(n) && n <= Date.now() + 60000;
  const timeRE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const dateKey = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateTime = (n) =>
    new Date(n).toLocaleString("nb-NO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const clock = (n) =>
    new Date(n).toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  const duration = (ms) => {
    let s = Math.max(0, Math.floor(ms / 1000));
    return s < 60 ? `${s} sek` : `${Math.floor(s / 60)} min ${s % 60} sek`;
  };
  function age(v) {
    return window.NikaRegistration.normalizeAge(v);
  }
  const defaults = () => ({
    version: 2,
    dog: null,
    draft: { name: "", breed: "", age: "" },
    walks: [],
    active: null,
    meals: [],
    feedings: [],
    family: [],
    places: [],
    legacyContact: "",
    revision: 0,
    multiPetVersion: 1,
    petId: uid(),
    otherPets: [],
    addingPet: false,
    sessionEnded: false,
  });
  function validDog(d) {
    return (
      d &&
      validText(d.name, 60) &&
      validText(d.breed, 100) &&
      validText(d.age, 50) &&
      validText(d.sex, 30) &&
      window.NikaPhoto.valid(d.photo) &&
      (d.species === undefined || SPECIES.includes(d.species))
    );
  }
  function validateSingle(d) {
    if (
      !d ||
      d.version !== 2 ||
      !d.draft ||
      !["name", "breed", "age"].every(
        (k) => typeof d.draft[k] === "string" && d.draft[k].length <= 100,
      ) ||
      (d.dog !== null && !validDog(d.dog))
    )
      throw Error("Ugyldig profil");
    for (const k of ["walks", "meals", "feedings", "family", "places"])
      if (!Array.isArray(d[k])) throw Error("Ugyldig liste");
    const evt = (e) =>
      e &&
      typeof e.id === "string" &&
      ["pee", "poop"].includes(e.type) &&
      stamp(e.at);
    const walk = (w) =>
      w &&
      typeof w.id === "string" &&
      stamp(w.start) &&
      window.NikaGPS.valid(w.gps) &&
      (w.note===undefined || (typeof w.note==="string" && w.note.length<=300)) &&
      Array.isArray(w.events) &&
      w.events.every(evt) &&
      (!w.legacyCounts ||
        ["pee", "poop"].every(
          (k) => Number.isInteger(w.legacyCounts[k]) && w.legacyCounts[k] >= 0,
        ));
    if (d.active !== null && !walk(d.active)) throw Error("Ugyldig aktiv tur");
    if (
      !d.walks.every(
        (w) =>
          walk(w) && stamp(w.end) && w.end >= w.start && finite(w.durationMs),
      )
    )
      throw Error("Ugyldig turhistorikk");
    if (
      !d.meals.every(
        (m) =>
          m &&
          typeof m.id === "string" &&
          timeRE.test(m.time) &&
          validText(m.food, 100),
      )
    )
      throw Error("Ugyldig måltidsplan");
    if (
      !d.feedings.every(
        (f) =>
          f &&
          typeof f.id === "string" &&
          typeof f.mealId === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(f.day) &&
          stamp(f.at) &&
          validText(f.food, 100),
      )
    )
      throw Error("Ugyldig måltidshistorikk");
    if (
      !d.family.every(
        (m) =>
          m &&
          typeof m.id === "string" &&
          validText(m.name, 60) &&
          validText(m.role, 60),
      )
    )
      throw Error("Ugyldig familie");
    if (
      !d.places.every(
        (p) => p && typeof p.id === "string" && validText(p.name, 100),
      )
    )
      throw Error("Ugyldig favorittsted");
    return { ...defaults(), ...d };
  }
  function petSnapshot(source = d) {
    return { id: source.petId, ...Object.fromEntries(PET_FIELDS.map(k => [k, source[k]])) };
  }
  function validate(input) {
    const value = validateSingle(input);
    if (input.multiPetVersion !== undefined && input.multiPetVersion !== 1) throw Error("Ukjent profilversjon");
    if (!validText(value.petId,80) || !Array.isArray(value.otherPets) || value.otherPets.length>49 || typeof value.addingPet!=="boolean" || typeof value.sessionEnded!=="boolean") throw Error("Ugyldig profilliste");
    const ids = new Set([value.petId]);
    value.otherPets = value.otherPets.map(p => {
      if (!p || !validText(p.id,80) || ids.has(p.id) || !validDog(p.dog)) throw Error("Ugyldig dyreprofil");
      ids.add(p.id);
      const checked = validateSingle({...defaults(),...Object.fromEntries(PET_FIELDS.map(k=>[k,p[k]]))});
      return {id:p.id,...Object.fromEntries(PET_FIELDS.map(k=>[k,checked[k]])),dog:{...checked.dog,species:checked.dog.species || "Hund"}};
    });
    if (value.dog) value.dog = {...value.dog,species:value.dog.species || "Hund"};
    if (value.draft.species !== undefined && !SPECIES.includes(value.draft.species)) throw Error("Ugyldig dyreart");
    if (value.draft.sex !== undefined && !["Hann","Hunn","Ikke oppgitt"].includes(value.draft.sex)) throw Error("Ugyldig kjønn");
    if (!input.multiPetVersion && value.dog) value.draft = defaults().draft;
    return value;
  }
  function allPets() {
    return [...(d.dog ? [petSnapshot()] : []),...d.otherPets];
  }
  function selectPet(id) {
    gps.stop();
    if (id === d.petId) { d.addingPet=false; save(); closeModal(); go("home"); return; }
    const target=d.otherPets.find(p=>p.id===id);
    if (!target) return;
    const previous=d.dog ? petSnapshot() : null;
    d.otherPets=d.otherPets.filter(p=>p.id!==id);
    if(previous)d.otherPets.push(previous);
    for(const key of PET_FIELDS)d[key]=target[key];
    d.petId=target.id;
    d.addingPet=false;
    lastClick={};
    save(); closeModal(); go("home");
  }
  function migrate(v) {
    if (!v || typeof v !== "object" || Array.isArray(v))
      throw Error("Ugyldige eldre data");
    const d = defaults();
    if (v.dog) {
      if (
        !validText(v.dog.name, 60) ||
        !validText(v.dog.breed, 100) ||
        !validText(v.dog.age, 50)
      )
        throw Error("Eldre profil må gjenopprettes");
      d.dog = {
        name: v.dog.name,
        breed: v.dog.breed,
        age: v.dog.age,
        sex: clean(v.dog.sex, 30) || "Ikke oppgitt",
      };
    }
    d.draft = { name: clean(v.name, 60), breed: clean(v.breed), age: "" };
    if (v.walks !== undefined && !Array.isArray(v.walks))
      throw Error("Ugyldig eldre turhistorikk");
    for (const w of v.walks || []) {
      if (
        !stamp(w.start) ||
        !finite(w.minutes) ||
        !["pee", "poop"].every((k) => Number.isInteger(w[k]) && w[k] >= 0)
      )
        throw Error("Ugyldig eldre tur");
      const ms = w.minutes * 60000;
      d.walks.push({
        id: uid(),
        start: w.start,
        end: Math.min(Date.now(), w.start + ms),
        durationMs: ms,
        events: [],
        legacyCounts: { pee: w.pee, poop: w.poop },
        legacy: true,
      });
    }
    if (v.active) {
      if (
        !stamp(v.active.start) ||
        !["pee", "poop"].every(
          (k) => Number.isInteger(v.active[k]) && v.active[k] >= 0,
        )
      )
        throw Error("Ugyldig eldre aktiv tur");
      d.active = {
        id: uid(),
        start: v.active.start,
        events: [],
        legacyCounts: { pee: v.active.pee, poop: v.active.poop },
      };
    }
    if (v.meals !== undefined && !Array.isArray(v.meals))
      throw Error("Ugyldig eldre måltidsplan");
    for (const m of v.meals || []) {
      if (!timeRE.test(m.time) || !validText(m.food, 100))
        throw Error("Ugyldig eldre måltid");
      d.meals.push({ id: uid(), time: m.time, food: m.food });
    }
    if (v.family !== undefined && !Array.isArray(v.family))
      throw Error("Ugyldig eldre familie");
    for (const m of v.family || []) {
      if (!validText(m, 60)) throw Error("Ugyldig eldre familiemedlem");
      d.family.push({ id: uid(), name: m, role: "Familiemedlem" });
    }
    d.legacyContact = clean(v.contact, 200);
    return d;
  }
  let d = defaults(),
    storageIssue = "",
    blocked = false,
    storageAvailable = true,
    page = "home",
    mealEdit = null,
    familyEdit = null,
    toastTimer,
    lastClick = {},
    upgradeBackupPending = "",
    externalChanged = false;
  try {
    const raw = localStorage.getItem(KEY),
      old = localStorage.getItem(LEGACY);
    if (raw) {
      const parsed=JSON.parse(raw);
      d = validate(parsed);
      if (!parsed.multiPetVersion) {
        if (!d.dog && d.draft.name && (!d.draft.breed || age(d.draft.breed))) {
          const repaired=window.NikaRegistration.parse(d.draft.name);
          if (repaired.fields.name && repaired.fields.breed && repaired.fields.age) d.draft={...defaults().draft,...repaired.fields};
        }
        upgradeBackupPending=raw;
        if (!localStorage.getItem(PRE_MULTI)) localStorage.setItem(PRE_MULTI,raw);
        localStorage.setItem(KEY,JSON.stringify(d));
        upgradeBackupPending="";
        storageIssue="Nika støtter nå flere dyr. Den eksisterende profilen og historikken er bevart, og originalversjonen er beholdt lokalt.";
      }
    }
    else if (old) {
      d = validate(migrate(JSON.parse(old)));
      localStorage.setItem(KEY, JSON.stringify(d));
      storageIssue =
        "Dataene dine er flyttet til den nye versjonen. Originalen er bevart. Gamle «gitt»-markeringer manglet dato og er ikke overført; måltidsplanen er bevart.";
    }
  } catch (e) {
    if (e.name === "SecurityError" || e.name === "QuotaExceededError") {
      storageAvailable = false;
      storageIssue =
        "Nettleseren tillater ikke lagring. Du kan bruke Nika i denne økten, men nye endringer forsvinner ved oppdatering.";
    } else {
      blocked = true;
      storageIssue =
        "Lagrede Nika-data kunne ikke leses. Originalen er urørt. Endringer lagres ikke før du har eksportert eller slettet Nika-data i «Personvern og dine data».";
    }
  }
  function showStorage() {
    const el = $("storage-alert");
    el.hidden = !storageIssue;
    el.textContent = storageIssue;
  }
  function save() {
    d.revision++;
    if (cloudMode) {
      if (!cloudReady || blocked) return false;
      storageIssue = "Lagrer på kontoen …";
      showStorage();
      account.save(d).catch(() => {});
      return true;
    }
    if (blocked) {
      showStorage();
      return false;
    }
    try {
      if (upgradeBackupPending) {
        if (!localStorage.getItem(PRE_MULTI)) localStorage.setItem(PRE_MULTI,upgradeBackupPending);
        upgradeBackupPending="";
      }
      localStorage.setItem(KEY, JSON.stringify(d));
      if (!storageAvailable) {
        storageAvailable = true;
        storageIssue = "Lagring fungerer igjen. Endringene er lagret.";
      }
      showStorage();
      return true;
    } catch (e) {
      storageAvailable = false;
      storageIssue =
        "Kunne ikke lagre. Endringene finnes bare i denne økten og forsvinner ved oppdatering. Frigjør plass eller tillat lokal lagring. Du kan eksportere Nika-data under «Personvern og dine data».";
      showStorage();
      return false;
    }
  }
  function notify(s) {
    $("toast").textContent = s;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").textContent = ""), 4000);
  }
  const paths = {
    paw: "M8 14c1-3 7-3 8 0 1 2 4 4 2 6-2 2-4-1-6-1s-4 3-6 1c-2-2 1-4 2-6zM8 4a2 3 0 1 0 0 6 2 3 0 0 0 0-6zm8 0a2 3 0 1 0 0 6 2 3 0 0 0 0-6zM3 9a1.5 2.5 0 1 0 0 5 1.5 2.5 0 0 0 0-5zm18 0a1.5 2.5 0 1 0 0 5 1.5 2.5 0 0 0 0-5z",
    walk: "M5 20h9a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7M16 2l3 2-3 2M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
    bowl: "M3 12h18c0 7-3 9-9 9s-9-2-9-9zM8 4v3m4-4v4m4-3v3",
    family:
      "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8-1a3 3 0 1 0 0-6M2 21v-2a6 6 0 0 1 12 0v2m3-6a5 5 0 0 1 5 5v1",
    heart: "M12 21S2 14 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 6-10 13-10 13z",
    leaf: "M20 3C7 2 2 8 5 15s15 6 15-12zM4 21L16 8",
    shield: "M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l4 2",
    pin: "M12 22s8-9 8-14a8 8 0 1 0-16 0c0 5 8 14 8 14zm0-17a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    drop: "M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14z",
    check: "M5 12l4 4L19 6",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    home: "M3 10l9-7 9 7v11h-6v-7H9v7H3z",
    plus: "M12 5v14M5 12h14",
    edit: "M15 4l5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15z",
    logout: "M9 3H4v18h5M10 12h11m-4-4 4 4-4 4",
    support: "M4 4h16v13H9l-5 4zM8 8h8M8 12h5",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 6l12 12M18 6 6 18",
  };
  const icon = (n) =>
    `<span class="icon icon-${n}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="${paths[n] || paths.paw}"/></svg></span>`;
  const actionIcons = {pets:'paw', logout:'logout', profile:'edit', 'add-pet':'plus', confirm:'check', correct:'edit', close:'close', 'logout-confirm':'logout', resume:'paw'};
  const btn = (label, action, cls = "secondary", id = "") =>
    `<button type="button" class="btn ${cls}" data-action="${action}"${id ? ` data-id="${html(id)}"` : ""}>${actionIcons[action]?icon(actionIcons[action]):''}${label}</button>`;
  const card = (title, ico, body, cls = "", extra = "") =>
    `<section class="card ${cls}"><div class="card-top"><h3>${icon(ico)}${title}</h3>${extra}</div>${body}</section>`;
  const empty = (s) => `<p class="empty">${s}</p>`;
  const field = (label, name, value = "", type = "text", max = 100) =>
    `<label class="field">${label}<input name="${name}" id="${name}" type="${type}" value="${html(value)}" required maxlength="${max}" autocomplete="off"></label>`;
  const errorSlot = '<p class="error" id="form-error" role="alert"></p>';
  const count = (w, t) =>
    w.events.filter((e) => e.type === t).length + (w.legacyCounts?.[t] || 0);
  function mealToday(m) {
    return d.feedings.find((f) => f.mealId === m.id && f.day === dateKey());
  }
  function nextMeal() {
    let list = d.meals
      .filter((m) => !mealToday(m))
      .sort((a, b) => a.time.localeCompare(b.time));
    return (
      list.find((m) => m.time >= new Date().toTimeString().slice(0, 5)) ||
      list[0] ||
      null
    );
  }
  const supportUI=window.NikaSupport({account,modal,html,icon});
  function nav() {
    const accountButton = $("account-button");
    accountButton.hidden = !account?.enabled;
    accountButton.innerHTML = cloudMode ? icon("family")+"<span>Min konto</span>" : "Logg inn";
    accountButton.setAttribute("aria-label",cloudMode?"Min konto":"Logg inn");
    const tabs = d.dog && !d.addingPet && !d.sessionEnded
      ? [
          ["home", "Oversikt"],
          ["walks", "Turer"],
          ["meals", "Måltider"],
          ["family", "Familie"],
          ["profile", d.dog.species === "Hund" ? "Min hund" : "Mitt dyr"],
        ]
      : [];
    $("nav").innerHTML = tabs
      .map(
        ([p, n]) =>
          `<button data-go="${p}"${p === page ? ' aria-current="page"' : ""}>${icon({home:'home',walks:'walk',meals:'bowl',family:'family',profile:'paw'}[p])}<span>${n}</span></button>`,
      )
      .join("");
    document.body.classList.toggle('has-bottom-nav', tabs.length > 0);
    document.querySelector(".header").append(accountButton);
    $('header-tools').innerHTML=cloudMode?`<button class="icon-button" data-action="support" aria-label="Support">${icon('support')}</button>${accountRole==='admin'?`<button class="icon-button" data-action="admin" aria-label="Administrer Nika">${icon('shield')}</button>`:''}<button class="icon-button" data-action="menu" aria-label="Konto og dyr">${icon('menu')}</button>`:'';
    const tools=$("pet-controls");
    tools.hidden=cloudMode || !d.dog || d.sessionEnded;
    if (!tools.hidden) {
      const running=allPets().filter(p=>p.active).length;
      tools.innerHTML=d.addingPet
        ? `<span>Registrer et nytt dyr – eksisterende profiler er bevart.</span>${btn("Tilbake til "+html(d.dog.name),"cancel-pet")}${btn("Logg ut","logout")}`
        : `<label class="pet-picker">Valgt dyr<select id="pet-select" aria-label="Velg dyr">${allPets().map(p=>`<option value="${html(p.id)}"${p.id===d.petId?" selected":""}>${html(p.dog.name)} · ${html(p.dog.species || "Hund")}${p.active?" · på tur":""}</option>`).join("")}</select></label><div class="pet-actions">${running?btn(`${running} tur${running>1?"er":""} pågår`,"pets"):""}${btn("Mine dyr", "pets")}${btn("Logg ut","logout")}</div>`;
      tools.querySelector(".pet-actions")?.prepend(accountButton);
      $("pet-select")?.addEventListener("change",e=>selectPet(e.target.value));
    } else tools.innerHTML="";
  }
  function menuDialog(){
    modal(`<h2 id="dialog-title">Konto og dyr</h2>${d.dog?`<label class="field">Valgt dyr<select id="pet-select">${allPets().map(p=>`<option value="${html(p.id)}"${p.id===d.petId?' selected':''}>${html(p.dog.name)} · ${html(p.dog.species||'Hund')}${p.active?' · på tur':''}</option>`).join('')}</select></label>`:''}<div class="menu-grid">${btn('Min konto','account')}${d.dog?btn('Mine dyr','pets'):''}${btn('Support','support')}${accountRole==='admin'?btn('Administrer Nika','admin'):''}${btn('Logg ut','logout')}${btn('Lukk','close')}</div>`);
    $('pet-select')?.addEventListener('change',e=>{const id=e.target.value;closeModal();selectPet(id);});
  }
  function petManager() {
    modal(`<h2 id="dialog-title">Mine dyr</h2><p class="muted">Profiler og historikk lagres bare i denne nettleseren. Familien er felles; turer, måltider og favorittsteder tilhører hvert dyr.</p><div class="pet-list">${allPets().map(p=>`<div class="pet-list-row"><div><strong>${html(p.dog.name)}</strong><span>${html(p.dog.species || "Hund")} · ${html(p.dog.age)}${p.active?" · en tur pågår":""}</span></div>${p.id===d.petId?'<button class="btn secondary" disabled>Valgt</button>':btn("Velg "+html(p.dog.name),"choose-pet","secondary",p.id)}</div>`).join("")}</div><div class="form-actions">${allPets().length<50?btn(d.draft.name?"Fortsett ny registrering":"Legg til dyr","add-pet",""):"<p>Nika støtter inntil 50 dyr.</p>"}${btn("Lukk","close")}</div>`);
  }
  function sessionScreen() {
    const saved = d;
    d = defaults();
    onboarding();
    d = saved;
    document.querySelector('.chat').innerHTML = `<div class="signed-out-home"><h2>Velkommen til Nika</h2><p>Et bedre liv sammen, én liten hverdag av gangen.</p>${account?.enabled?btn("Logg inn eller opprett konto","account",""):btn("Åpne lagrede dyr","resume")}<p class="muted">Din konto. Dine dyr. Hverdagen samlet på ett sted.</p></div>`;

  }
  function render(focus = false) {
    nav();
    showStorage();
    if (d.sessionEnded) sessionScreen();
    else if (!d.dog || d.addingPet) onboarding();
    else dashboardPage();
    const trustLabel=document.querySelector('.trust-row span');if(trustLabel)trustLabel.innerHTML=icon('shield')+'Privat på kontoen';
    if (cloudMode) {
      const shared=account.workspace==='family';
      document.querySelector('.account-tag').textContent = shared?'Delt familie':'Privat konto';
      if(shared){const notice=document.createElement('div');notice.className='workspace-banner';notice.innerHTML=`<span>${icon('family')} <strong>${html(account.family?.name || 'Familien')}</strong> · Delt oversikt</span>${btn('Tilgang og oppdatering','sharing','secondary small')}`;$('content').prepend(notice);}
      $('data-location').textContent = shared?'Lagret på kontoen · Delt med familien':'Lagret på kontoen · Privat oversikt';
      for (const el of document.querySelectorAll('.chat-help')) {
        el.textContent = el.textContent.replace('Opplysningene lagres bare i denne nettleseren.', shared?'Opplysningene deles med familien.':'Opplysningene lagres privat på kontoen din.');
      }
      const trust = document.querySelector('.trust-row span');
      if (trust) trust.textContent = shared?'Delt med familien':'Privat på kontoen';
      if (blocked) document.querySelectorAll('#content input,#content select,#content button,#pet-controls button,#pet-controls select,#nav button').forEach(el => el.disabled = true);
    }
    if (focus) $("content").focus({ preventScroll: true });
  }
  function onboarding() {
    const step = !d.draft.name ? 0 : !d.draft.breed ? 1 : !d.draft.age ? 2 : 3;
    const questions = [
      "Hei, så hyggelig å se deg! Hva heter dyret ditt? Du kan også skrive navn, rase og alder i én setning.",
      "Hvilken rase er dyret? Blandingshund, ukjent rase eller ikke oppgitt går helt fint.",
      "Hvor gammelt er dyret? Skriv alder i år eller måneder, for eksempel «3 år» eller «8 måneder».",
    ];
    let msgs = `<div class="bubble">${questions[0]}</div>`;
    for (const [key,label] of [["name","Navn"],["breed","Rase"],["age","Alder"]]) {
      if (d.draft[key]) msgs += `<div class="bubble mine">${label}: ${html(d.draft[key])}</div>`;
    }
    if (step>0 || d.draft.age || d.draft.species) msgs += `<div class="bubble">${step<3?questions[step]:"Her er det jeg har tolket. Kontroller og korriger opplysningene før du lagrer."}</div>`;
    $("content").innerHTML =
      `<section class="welcome-top"><span class="eyebrow">DITT DYR. DIN FAMILIE. DERES HVERDAG.</span><h1>Et bedre liv <em>sammen</em></h1><p>Litt mer oversikt. Litt mindre å huske på. <span class="welcome-second-line">Og mer tid til det som betyr noe.</span></p></section><div class="onboard-scene"><aside class="dog-scene" aria-label="Møt Nika og Tyra"><img src="assets/nika-dog-duo-v3.webp" alt="Bestevenninnene Tyra med hvit pels og Nika med svart og lysebrun pels" width="620" height="680"><div class="floating-note note-one">${icon("heart")}<span><b>En del av familien</b>Hver eneste dag.</span></div><div class="floating-note note-two">${icon("leaf")}<span><b>Små turer. Store øyeblikk.</b>En enklere hverdag sammen.</span></div><p class="duo-story"><strong>Møt Nika og Tyra</strong><span>To firbente bestevenninner.<br>Inspirasjonen bak Nika.</span></p></aside><section class="chat" aria-label="Registrer dyret ditt"><div class="chat-head"><div class="chat-id"><img src="assets/paw.svg" alt="" width="38" height="38"><div><strong>Hei, jeg er Nika</strong><span>La oss bli litt kjent</span></div></div><span class="chat-step">${step === 3 ? "Klar til å bekrefte" : `Steg ${step + 1} av 3`}</span></div><div class="messages" id="messages" role="log" aria-label="Registreringssamtale">${msgs}</div>${step < 3 ? `<form id="onboard-form" class="chat-form"><input id="answer" name="answer" aria-label="Svar til Nika" placeholder="${["Dyrets navn …", "Rase eller ukjent rase …", "For eksempel 3 år …"][step]}" maxlength="300" required autocomplete="off"><button class="send" aria-label="Send svar">↑</button></form><p class="error chat-help" id="onboard-error" role="alert"></p>${step === 0 ? '<button class="quick-example" data-action="example">Prøv: «Jessica schæfer tispe 2 år» – uten komma</button>' : ""}` : `<div class="onboard-summary"><h3>En liten oppsummering</h3><dl class="details"><div><dt>Navn</dt><dd>${html(d.draft.name)}</dd></div><div><dt>Rase</dt><dd>${html(d.draft.breed)}</dd></div><div><dt>Alder</dt><dd>${html(d.draft.age)}</dd></div><div><dt>Art</dt><dd>${html(d.draft.species || "Hund")}</dd></div><div><dt>Kjønn</dt><dd>${html(d.draft.sex || "Ikke oppgitt")}</dd></div></dl><div class="form-actions">${btn("Ja, opprett profilen", "confirm", "")}${btn("Korriger", "correct")}</div></div>`}<p class="chat-help">En veiviser for registrering, ikke AI-rådgivning.<br>Opplysningene lagres bare i denne nettleseren.</p></section></div><div class="trust-row"><span>${icon("shield")}Privat og lokalt</span><span>${icon("paw")}Laget for hundehverdagen</span><span>${icon("heart")}Plass til hele familien</span></div>`;
    // Match the requested reading order: title, supporting copy, then the family line.
    document.querySelector('.welcome-top').append(document.querySelector('.welcome-top .eyebrow'));
    const msgsEl = $("messages");
    if (cloudMode) for (const el of document.querySelectorAll('.chat-help')) el.textContent = el.textContent.replace('Opplysningene lagres bare i denne nettleseren.', account.workspace==='family'?'Opplysningene deles med familien.':'Opplysningene lagres privat på kontoen din.');
    msgsEl.scrollTop = msgsEl.scrollHeight;
    const form = $("onboard-form");
    if (form) form.onsubmit = (e) => {
      e.preventDefault();
      const v=$("answer").value.trim();
      const field=["name","breed","age"][step];
      const parsed=window.NikaRegistration.parse(v,{field});
      let err=parsed.error || "";
      const next={...d.draft};
      if(!v) err="Skriv et svar først.";
      if(!err && parsed.structured) {
        for(const [key,value] of Object.entries(parsed.fields)) {
          if(["name","breed","age","sex","species"].includes(key))next[key]=value;
        }
        if(!Object.keys(parsed.fields).length)err="Jeg fant ikke opplysningene. Svar gjerne på ett spørsmål om gangen.";
      } else if(!err) {
        if(field==="age") { const a=age(v); if(a)next.age=a; else err="Skriv en gyldig alder med år eller måneder."; }
        else if(validText(v,field==="name"?60:100))next[field]=v;
        else err="Svaret er for langt. Bruk inntil "+(field==="name"?60:100)+" tegn.";
      }
      if(!err && ((next.name && !validText(next.name,60)) || (next.breed && !validText(next.breed,100))))err="Bruk inntil 60 tegn i navn og 100 tegn i rase.";
      if(err) { $("onboard-error").textContent=err; return; }
      d.draft=next;
      save(); onboarding(); $("answer")?.focus();
    };
  }
  function dashboardPage() {
    if (page === "home") {
      home();
      return;
    }
    const titles = {
      profile: [d.dog.species === "Hund" ? "Min hund" : "Mitt dyr", "En liten profil. En stor personlighet."],
      walks: ["Ut på tur", "Frisk luft og små øyeblikk, samlet på ett sted."],
      meals: [
        "Tid for mat",
        "En enkel dagsplan, med oversikt over det som er gitt.",
      ],
      family: [
        "Hele familien",
        "Gjør det enklere å holde oversikt over hvem som er med.",
      ],
    };
    const [title, desc] = titles[page] || titles.home || ["Oversikt", ""];
    $("content").innerHTML =
      `<div class="page-head"><div><span class="eyebrow">HVERDAGEN MED ${html(d.dog.name.toUpperCase())}</span><h1>${title}</h1><p>${desc}</p></div>${btn("Til oversikten", "home")}</div><div id="page-body"></div>`;
    if (page === "profile") profile();
    if (page === "walks") walks();
    if (page === "meals") meals();
    if (page === "family") family();
  }
  function home() {
    const dog=d.dog,last=d.walks.at(-1),m=nextMeal();
    const row=(title,ico,body,action,label,extra="")=>
      `<section class="routine-row ${extra}">${icon(ico)}<div class="routine-copy"><h3>${title}</h3><p>${body}</p></div><button class="routine-action" data-action="${action}" aria-label="${html(label)}" title="${html(label)}">${icon("arrow")}</button></section>`;
    const walkBody=d.active
      ? `<strong data-timer>${duration(Date.now()-d.active.start)}</strong> · ${count(d.active,"pee")} tissing · ${count(d.active,"poop")} bæsjing`
      : last ? `<strong>${duration(last.durationMs)}</strong> · ${dateTime(last.start)}` : "Ingen turer registrert ennå. Start når dere er klare.";
    const mealBody=m ? `<strong>${html(m.time)}</strong> · ${html(m.food)} · ikke gitt i dag`
      : d.meals.length ? "Alle planlagte måltider er gitt i dag." : "Ingen måltider planlagt ennå.";
    $("content").innerHTML=
      `<div class="welcome-banner"><div><span class="date">${new Date().toLocaleDateString("nb-NO",{weekday:"long",day:"numeric",month:"long"})}</span><h1>Hei, ${html(dog.name)} ${icon("heart")}</h1><p>Små øyeblikk. En enklere hverdag.<br>Her er oversikten for ${html(dog.name)}.</p>${btn(`${icon("walk")}${d.active?"Fortsett turen":"Start luftetur"}`,d.active?"walks":"startwalk","")}</div><img class="banner-dog" src="assets/nika-dog-duo-v3.webp" alt="" width="620" height="680"></div>
      <div class="dashboard-grid compact-dashboard"><section class="card profile-card"><div class="card-top"><h3>${icon("paw")}Min beste venn</h3><span class="badge">${html(dog.species || "Hund")}</span></div><button class="pet-avatar" data-action="photo" aria-label="Rediger profilbildet til ${html(dog.name)}">${dog.photo ? `<img src="${html(dog.photo)}" alt="Profilbilde av ${html(dog.name)}">` : `<strong>${html([...dog.name][0]?.toLocaleUpperCase("nb-NO") || "?")}</strong>${icon("paw")}`}</button><h2>${html(dog.name)}</h2><p class="muted">Et helt spesielt familiemedlem.</p><dl class="details"><div><dt>Art</dt><dd>${html(dog.species || "Hund")}</dd></div><div><dt>Rase</dt><dd>${html(dog.breed)}</dd></div><div><dt>Alder ved registrering</dt><dd>${html(dog.age)}</dd></div><div><dt>Kjønn</dt><dd>${html(dog.sex)}</dd></div></dl>${btn("Se og rediger profil","profile")}</section>
      <section class="card routine-card" aria-label="Samlet hverdagsoversikt"><div class="routine-heading"><div><span class="eyebrow">DET VIKTIGSTE, SAMLET</span><h2>Hverdagen deres</h2></div><span class="badge">For ${html(dog.name)}</span></div>
      ${row(d.active?"På tur nå":"Siste luftetur","walk",walkBody,d.active||last?"walks":"startwalk",d.active?"Åpne aktiv tur":last?"Se turhistorikk":"Start den første turen")}
      ${row("Neste måltid","bowl",mealBody,"meals",m?"Åpne måltider":"Planlegg et måltid","meal-row")}
      ${row("Familien vår","family",d.family.length?`${d.family.length} familiemedlem${d.family.length>1?"mer":""} · felles for alle dyrene`:"Ingen familiemedlemmer lagt til ennå.","family",d.family.length?"Se familien":"Legg til familie","family-row")}
      ${row("Favorittstedene deres","pin",d.places.length?d.places.slice(0,3).map(p=>html(p.name)).join(" · ")+(d.places.length>3?" · flere":""):"Ingen favorittsteder ennå. Dere velger selv.","walks",d.places.length?"Se favorittsteder":"Legg til et sted")}
      <p class="routine-footnote">Turer, måltider og favoritter gjelder ${html(dog.name)}. Familien er felles.</p></section></div>`;
  }
  function profile() {
    const x = d.dog;
    $("page-body").innerHTML =
      `<div class="two-cols">${card("Profilen til " + html(x.name), "paw", `<div class="photo-profile">${x.photo ? `<img src="${html(x.photo)}" alt="Profilbilde av ${html(x.name)}" width="76" height="76">` : icon("paw")}<div><strong>Profilbilde</strong>${btn(x.photo ? "Endre eller fjern bilde" : "Last opp bilde","photo")}</div></div><form id="profile-form">${field(x.species==="Hund"?"Hundens navn":"Dyrets navn", "dog-name", x.name, "text", 60)}<label class="field">Art<select id="dog-species">${SPECIES.map(s=>`<option${s===(x.species || "Hund")?" selected":""}>${s}</option>`).join("")}</select></label>${field("Rase, blandingshund eller ukjent rase", "dog-breed", x.breed)}${field("Alder ved registrering (år eller måneder)", "dog-age", x.age, "text", 50)}<label class="field">Kjønn<select name="dog-sex" id="dog-sex">${["Ikke oppgitt", "Hann", "Hunn"].map((s) => `<option${x.sex === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>${errorSlot}<button class="btn">Lagre profil</button></form>`)}<div class="stack">${card("Deres lille hverdagsbok", "heart", '<p class="muted">Profilen hjelper deg å samle turer, måltider og familie. Alderen er den du oppga ved registrering, og oppdateres manuelt.</p>')}<div class="notice">${cloudMode ? (account.workspace==="family"?"Dyredata deles med medlemmene i familien.":"Dyredata lagres i din private oversikt. Du velger selv om du vil opprette en delt familie.") : "Eldre data er lagret lokalt. Dataene deles ikke og er ingen sikkerhetskopi."} Vi gir ikke individuelle helse- eller kostråd.</div></div></div>`;
    $("profile-form").onsubmit = (e) => {
      e.preventDefault();
      const name = clean($("dog-name").value, 60),
        breed = clean($("dog-breed").value),
        a = age($("dog-age").value);
      if (!name || !breed || !a) {
        $("form-error").textContent =
          "Fyll inn navn, rase og en gyldig alder med år eller måneder.";
        return;
      }
      d.dog = { ...d.dog, name, breed, age: a, sex: $("dog-sex").value, species: $("dog-species").value };
      save();
      render();
      notify("Profilen er oppdatert.");
    };
  }
  async function photoDialog() {
    const pet=d.dog, petId=d.petId;
    let img=null, busy=true, removed=false;
    modal(`<h2 id="dialog-title">Profilbildet til ${html(pet.name)}</h2><p class="muted">Velg utsnittet som passer. Bildet lagres med dette dyret.</p><div class="photo-editor"><div class="photo-preview-wrap"><span id="photo-placeholder">Velg et bilde av dyret ditt</span><canvas id="photo-preview" width="320" height="320" aria-label="Forhåndsvisning av profilbilde"></canvas></div><label class="photo-upload"><span>Velg bilde fra enheten</span><input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="photo-crop"><label class="field">Zoom<input id="photo-zoom" type="range" min="1" max="3" step="0.05" value="1"></label><label class="field">Vannrett<input id="photo-x" type="range" min="0" max="100" value="50"></label><label class="field">Loddrett<input id="photo-y" type="range" min="0" max="100" value="50"></label></div><p id="photo-error" class="error" role="status"></p><div class="form-actions"><button id="photo-save" class="btn" disabled>Lagre bilde</button><button id="photo-remove" class="btn secondary">Fjern bildet</button>${btn("Avbryt","close")}</div></div>`);
    const canvas=$('photo-preview'), picker=$('photo-file'), saveButton=$('photo-save'), removeButton=$('photo-remove'), status=$('photo-error');
    const crop=()=>({zoom:Number($('photo-zoom').value),x:Number($('photo-x').value),y:Number($('photo-y').value)});
    const draw=()=>{$('photo-placeholder').hidden=!!img;picker.disabled=busy;window.NikaPhoto.draw(canvas,img,crop());$('photo-crop').hidden=!img;removeButton.disabled=busy||(!img&&!pet.photo);saveButton.disabled=busy||(!img&&!removed);};
    for(const id of ['photo-zoom','photo-x','photo-y'])$(id).oninput=draw;
    picker.onchange=async()=>{
      if(!picker.files[0])return;
      busy=true;draw();status.textContent='Åpner bildet …';
      try { const decoded=await window.NikaPhoto.read(picker.files[0]); if(!canvas.isConnected)return;img=decoded;removed=false;$('photo-zoom').value=1;$('photo-x').value=$('photo-y').value=50;status.textContent=''; }
      catch(error){if(canvas.isConnected)status.textContent=error.message;}
      finally{busy=false;if(canvas.isConnected)draw();picker.value='';}
    };
    removeButton.onclick=()=>{img=null;removed=true;status.textContent='Bildet fjernes når du velger Lagre bilde.';draw();};
    saveButton.onclick=()=>{
      if(busy||blocked||petId!==d.petId)return;
      try {if(img)pet.photo=window.NikaPhoto.encode(img,crop());else delete pet.photo; save();closeModal();render();notify(cloudMode?'Profilbildet er oppdatert. Lagringsstatus vises øverst.':'Profilbildet er oppdatert.');}
      catch(error){status.textContent=error.message;}
    };
    draw();
    try {if(pet.photo)img=await window.NikaPhoto.decode(pet.photo);}
    catch{status.textContent='Det lagrede bildet kunne ikke åpnes. Velg et nytt bilde.';}
    busy=false;if(canvas.isConnected)draw();
  }
  function startWalkDialog() {
    if(d.active){go('walks');return;}
    modal(`<h2 id="dialog-title">Klar for tur?</h2><p>Turen for ${html(d.dog.name)} starter først når du trykker «Start tur».</p><label class="check-option"><input id="walk-use-gps" type="checkbox"> Registrer ruten med GPS</label><p class="muted">GPS krever at du tillater posisjon. Nika må være synlig; ved skjermlås pauses registreringen.</p><div class="form-actions">${btn('Start tur','startwalk-confirm','')}${btn('Avbryt','close')}</div>`);
  }
  function editWalk(id) {
    const walk=d.walks.find(w=>w.id===id);if(!walk)return;
    const local=ms=>{const t=new Date(ms);return new Date(ms-t.getTimezoneOffset()*60000).toISOString().slice(0,23);};
    modal(`<h2 id="dialog-title">Rediger tur</h2><form id="walk-edit-form">${field('Starttid','walk-start',local(walk.start),'datetime-local')}${field('Sluttid','walk-end',local(walk.end),'datetime-local')}<label class="field">Notat<input id="walk-note" maxlength="300" value="${html(walk.note||'')}" placeholder="For eksempel: En rolig tur i skogen"></label><p class="muted">Registrerte hendelser og GPS-punkter beholder sine faktiske tidspunkter.</p><p id="walk-edit-error" role="alert"></p><div class="form-actions"><button class="btn" type="submit">Lagre tur</button>${btn('Avbryt','close')}</div></form>`);
    $('walk-start').step=$('walk-end').step='0.001';
    $('walk-edit-form').onsubmit=e=>{
      e.preventDefault();if(blocked)return;
      const start=new Date($('walk-start').value).getTime(),end=new Date($('walk-end').value).getTime();
      const times=[...walk.events.map(ev=>ev.at),...(walk.gps||[]).map(p=>p.at)];
      if(!stamp(start)||!stamp(end)||end<start||end>Date.now()+1000||end-start>7*86400000){$('walk-edit-error').textContent='Velg gyldige tider. Slutten må være etter starten, ikke i fremtiden, og turen kan være høyst sju døgn.';return;}
      if(times.some(at=>at<start||at>end)){$('walk-edit-error').textContent='Tidsrommet må romme alle registrerte hendelser og GPS-punkter.';return;}
      walk.start=start;walk.end=end;walk.durationMs=end-start;walk.note=$('walk-note').value.trim();save();closeModal();render();notify('Turen er oppdatert.');
    };
  }
  function gpsHelp() {
    modal(`<h2 id="dialog-title">Tillat GPS for Nika</h2><p>Telefonen eller nettleseren har stoppet posisjonstilgangen. Ingen rute registreres før du tillater den.</p><ol class="help-steps"><li>Åpne nettstedets innstillinger ved adresselinjen og sett <strong>Posisjon</strong> til «Spør» eller «Tillat».</li><li>På iPhone: sjekk Innstillinger → Personvern og sikkerhet → Stedstjenester → Safari-nettsteder. Tillat mens appen brukes.</li><li>Gå tilbake til Nika, lukk denne hjelpen og trykk «Slå på GPS». Hold siden synlig under turen.</li></ol><p class="muted">Turtiden og hendelsene virker også uten GPS. Ved dårlig signal, prøv utendørs.</p>${btn('Lukk','close','')}`);
  }

  function walks() {
    const active = d.active;
    let current = active
      ? `<span class="live-dot">Tur pågår · startet ${clock(active.start)}</span><div class="timer" data-timer>${duration(Date.now() - active.start)}</div><p class="subline">${count(active, "pee")} tissing · ${count(active, "poop")} bæsjing</p><div class="event-buttons">${btn(`${icon("drop")}Tisset`, "pee")}${btn("Bæsjet", "poop")}</div>${btn("Avslutt og lagre tur", "endwalk", "")}<section id="gps-panel" class="gps-panel">${gpsPanel()}</section><ul class="list">${active.events
          .slice()
          .reverse()
          .map(
            (ev) =>
              `<li class="row"><span>${ev.type === "pee" ? "Tisset" : "Bæsjet"} · ${clock(ev.at)}</span>${btn("Angre", "undo-event", "secondary small", ev.id)}</li>`,
          )
          .join(
            "",
          )}</ul>${active.legacyCounts ? '<p class="subline">Hendelser fra den tidligere versjonen er bevart som antall uten tidspunkt.</p>' : ""}`
      : `${empty("Klar for litt frisk luft? Start turen når dere går ut.")}<p class="subline">Varighet og hendelser lagres. Du kan slå på GPS etter at turen er startet.</p>${btn("Start ny luftetur", "startwalk", "")}`;
    $("page-body").innerHTML =
      `<div class="two-cols"><div class="stack">${card("Lufteturen deres", "walk", current)}${card("Favorittsteder", "pin", `<p class="subline">Dine egne stedsnavn, uten GPS. Vi utleder ikke trivsel fra hendelser.</p><form id="place-form">${field("Navn på favorittsted", "place-name", "", "text", 100)}<button class="btn secondary">Legg til sted</button><p class="error" id="place-error" role="alert"></p></form><ul class="list">${d.places.map((p) => `<li class="row"><strong>${html(p.name)}</strong>${btn("Fjern", "remove-place", "secondary small", p.id)}</li>`).join("")}</ul>`, "blue-card")}</div>${card(
        "Turhistorikk",
        "clock",
        d.walks.length
          ? `<ul class="list">${d.walks
              .slice()
              .reverse()
              .map(
                (w) =>
                  `<li><div class="row"><strong>${dateTime(w.start)}</strong><span class="badge">${duration(w.durationMs)}</span></div><p class="muted">${count(w, "pee")} tissing · ${count(w, "poop")} bæsjing${w.legacy ? " · varighet fra eldre versjon" : ""}</p>${w.gps?.length ? `<details><summary>Vis GPS-rute</summary>${window.NikaGPS.route(w.gps)}${btn("Slett GPS-ruten","delete-route","secondary small",w.id)}</details>` : ""}${w.events.length ? `<details><summary>Vis hendelser</summary><ul>${w.events.map((ev) => `<li>${ev.type === "pee" ? "Tisset" : "Bæsjet"} · ${clock(ev.at)}</li>`).join("")}</ul></details>` : ""}${w.note?`<p class="walk-note">${html(w.note)}</p>`:""}<div class="history-actions">${btn("Rediger","edit-walk","secondary small",w.id)}${btn("Slett","delete-walk","secondary small",w.id)}</div></li>`,
              )
              .join("")}</ul>`
          : empty(
              "Her dukker turene opp når du avslutter dem.<br>Ingen turer registrert ennå.",
            ),
      )}</div>`;
    $("place-form").onsubmit = (e) => {
      e.preventDefault();
      const name = clean($("place-name").value);
      if (!name) {
        $("place-error").textContent = "Skriv et stedsnavn.";
        return;
      }
      if (d.places.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        $("place-error").textContent = "Dette stedet er allerede lagt til.";
        return;
      }
      d.places.push({ id: uid(), name });
      save();
      render();
      notify("Favorittstedet er lagt til.");
    };
  }
  function meals() {
    const edit = d.meals.find((m) => m.id === mealEdit);
    $("page-body").innerHTML =
      `<div class="two-cols"><div class="stack">${card(edit ? "Rediger måltid" : "Legg til et måltid", "bowl", `<form id="meal-form">${field("Tidspunkt hver dag", "meal-time", edit?.time || "17:00", "time")}${field("Fôr eller beskrivelse", "meal-food", edit?.food || "")}<p class="subline">Bruk hundens etablerte fôrplan for mengde og innhold. Nika beregner ikke porsjoner.</p>${errorSlot}<div class="form-actions"><button class="btn">${edit ? "Lagre endringer" : "Legg til måltid"}</button>${edit ? btn("Avbryt", "cancel-meal") : ""}</div></form>`, "beige-card")}${card(
        "Gjennomførte måltider",
        "check",
        d.feedings.length
          ? `<ul class="list">${d.feedings
              .slice()
              .reverse()
              .map(
                (f) =>
                  `<li><strong>${html(f.food)}</strong><p class="muted">Gitt ${dateTime(f.at)} · dagsplan ${f.day}</p>${btn("Angre registrering", "undo-feeding", "secondary small", f.id)}</li>`,
              )
              .join("")}</ul>`
          : empty("Ingen måltider er registrert som gitt."),
      )}</div>${card(
        "Dagens måltidsplan",
        "clock",
        `<p class="subline">${new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })} · Gjentas hver dag</p>${
          d.meals.length
            ? `<ul class="list">${[...d.meals]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((m) => {
                  const f = mealToday(m);
                  return `<li><div class="row"><strong>${html(m.time)} · ${html(m.food)}</strong>${f ? '<span class="badge">Gitt i dag</span>' : ""}</div><p class="muted">${f ? `Registrert kl. ${clock(f.at)}` : "Ikke gitt i dag"}</p><div class="list-actions">${f ? btn("Angre gitt", "undo-feeding", "secondary small", f.id) : btn("Marker gitt nå", "give", "small", m.id)}${btn("Rediger", "edit-meal", "secondary small", m.id)}${btn("Slett", "delete-meal", "secondary small", m.id)}</div></li>`;
                })
                .join("")}</ul>`
            : empty(
                "Ingen måltider i planen.<br>Legg til det første måltidet til venstre eller over.",
              )
        }`,
      )}</div>`;
    $("meal-form").onsubmit = (e) => {
      e.preventDefault();
      const food = clean($("meal-food").value),
        time = $("meal-time").value;
      if (!food || !timeRE.test(time)) {
        $("form-error").textContent =
          "Velg et gyldig klokkeslett og skriv en beskrivelse.";
        return;
      }
      if (edit) {
        edit.food = food;
        edit.time = time;
      } else d.meals.push({ id: uid(), time, food });
      mealEdit = null;
      save();
      render();
      notify("Måltidsplanen er lagret.");
    };
  }
  function family() {
    const edit = d.family.find((m) => m.id === familyEdit);
    $("page-body").innerHTML =
      `<div class="notice">Dette er en lokal familieliste. Det sendes ingen invitasjoner, og data synkroniseres ikke mellom personer eller enheter.</div><div class="two-cols family-cols">${card(edit ? "Rediger familiemedlem" : "Plass til flere", "family", `<form id="family-form">${field("Navn", "member-name", edit?.name || "", "text", 60)}${field("Rolle", "member-role", edit?.role || "Familiemedlem", "text", 60)}${errorSlot}<div class="form-actions"><button class="btn">${edit ? "Lagre endringer" : "Legg til familiemedlem"}</button>${edit ? btn("Avbryt", "cancel-family") : ""}</div></form>`, "blue-card")}${card("Familien til " + html(d.dog.name), "heart", d.family.length ? `<ul class="list">${d.family.map((m) => `<li><div class="row"><div class="member"><span class="avatar" aria-hidden="true">${html(m.name.charAt(0).toUpperCase())}</span><div><strong>${html(m.name)}</strong><p class="muted">${html(m.role)}</p></div></div><div class="list-actions">${btn("Rediger", "edit-family", "secondary small", m.id)}${btn("Fjern", "delete-family", "secondary small", m.id)}</div></div></li>`).join("")}</ul>` : empty("Her er det plass til dem som er med på hundehverdagen.<br>Ingen familiemedlemmer lagt til ennå."))}</div>`;
    $("family-form").onsubmit = (e) => {
      e.preventDefault();
      const name = clean($("member-name").value, 60),
        role = clean($("member-role").value, 60);
      if (!name || !role) {
        $("form-error").textContent = "Fyll inn både navn og rolle.";
        return;
      }
      if (edit) {
        edit.name = name;
        edit.role = role;
      } else d.family.push({ id: uid(), name, role });
      familyEdit = null;
      save();
      render();
      notify("Familielisten er oppdatert.");
    };
    if (cloudMode) document.querySelector('#page-body > .notice').innerHTML = `<p>Dette er en navneliste for oppgaver og roller. Den gir ingen andre tilgang. Kontotilgang administreres separat i Familiedeling.</p>${btn('Administrer familiedeling','sharing','')}`;
  }
  // Remove credentials on every dialog close, including Escape and displayed passwords.
  function clearDialogCredentials(){
    $('dialog-content').querySelectorAll('.password-field input,#login-code,#password-nonce').forEach(input=>{input.value='';});
  }
  $('dialog').addEventListener('cancel',clearDialogCredentials);
  $('dialog').addEventListener('close',()=>{if(!$('dialog').open)clearDialogCredentials();});
  let modalReturn = null, modalOpenedAt=0;
  function modal(content) {
    modalReturn = document.activeElement;modalOpenedAt=Date.now();
    $("dialog-content").innerHTML = content;
    if (cloudMode) for (const el of document.querySelectorAll('#dialog-content .muted')) el.textContent=el.textContent.replace('Profiler og historikk lagres bare i denne nettleseren.', 'Profiler og historikk lagres i den valgte kontooversikten.');
    $("dialog").showModal();
  }
  function closeModal() {
    clearDialogCredentials();
    $("dialog").close();
    if (modalReturn?.isConnected) modalReturn.focus();
  }
  function confirmRemove(title, desc, action, id) {
    modal(
      `<h2 id="dialog-title">${title}</h2><p>${desc}</p><div class="form-actions">${btn("Ja, slett", action, "danger", id)}${btn("Avbryt", "close")}</div>`,
    );
  }
  function privacy() {
    if (account?.enabled) {
      modal(`<h2 id="dialog-title">Dine data på kontoen</h2><p>Dyreprofiler og historikk lagres i Nika sitt separate Supabase-prosjekt i Stockholm. Din private oversikt er bare tilgjengelig for deg. Velger du familiedeling, får medlemmene lese og redigere familiens separate oversikt. Invitasjonskoder gir tilgang og skal deles privat.</p><p>Du logger inn med e-post og ditt eget Nika-passord, eller en tilgjengelig innloggingstjeneste. E-postkode brukes ved registrering og når du trenger å opprette eller tilbakestille passord. Nika får ikke tilgang til innboksen din eller e-postpassordet ditt. Innlogging gir ingen administratortilgang.</p><p>Tidligere lokale data ligger fortsatt lokalt og lastes ikke opp automatisk. GPS er valgfritt. Posisjoner registreres kun etter at du slår på GPS, og pauses når siden skjules. GPS-ruter i familiens oversikt deles med familiemedlemmene. Supportmeldinger er bare tilgjengelige for deg og Nika-administratoren. Administratoren ser registrert e-post, registreringsdato og siste innlogging, men ikke dyreprofilene dine. Ingen skjult sporing brukes.</p><h3>Historien bak Nika</h3><p>Nika og Tyra er to firbente bestevenninner – og inspirasjonen bak appen.</p><div class="form-actions">${btn("Eksporter Nika-data","export")}${cloudMode?btn("Slett dyredata på kontoen","cloud-reset","danger"):""}${btn("Lukk","close")}</div>`);
      return;
    }
    modal(
      `<h2 id="dialog-title">Dine data, på din enhet</h2><p>Dette er eldre data på denne enheten. Dyreprofiler, registreringsfremdrift, turer, måltider og familie lagres bare i denne nettleseren. De deles ikke, og lagringen er ingen sikkerhetskopi.</p><h3>Historien bak Nika</h3><p>Nika og Tyra er to firbente bestevenninner – og inspirasjonen bak appen. Du møter dem som illustrasjoner i Nika. De er appens ansikter, ikke profilbilder av hunden du registrerer.</p><p>Lokal modus har ingen familiedeling, aktiv QR-ID eller butikk. GPS er valgfritt og aktiveres bare når du ber om det under en tur. Ruten lagres lokalt. Ingen skjult analyse eller sporing brukes.</p><p>Du kan ha flere lokale dyreprofiler. Turer, måltider og favorittsteder holdes adskilt; familien er felles. «Logg ut» avslutter bare den lokale økten og er ingen passordbeskyttelse.</p><p>Eksport kan inneholde opplysningene du har skrevet inn. Oppbevar filen privat. Sletting gjelder bare Nika-data i denne nettleseren.</p>${d.legacyContact ? "<p>Kontaktfeltet fra den tidligere versjonen er bevart i lokal lagring og eksport. Det publiseres ikke.</p>" : ""}<div class="form-actions">${btn("Eksporter Nika-data", "export")}${btn("Slett Nika-data", "reset", "danger")}${btn("Lukk", "close")}</div>`,
    );
  }
  function exportData() {
    let data;
    try {
      data = cloudMode ? {format:"Nika kontoeksport",exportedAt:new Date().toISOString(),current:d} : {
        format: "Nika lokal eksport",
        exportedAt: new Date().toISOString(),
        current: d,
        stored: localStorage.getItem(KEY),
        legacy: localStorage.getItem(LEGACY),
        beforeMultiPet: localStorage.getItem(PRE_MULTI),
      };
    } catch {
      data = { format: "Nika økteksport", current: d };
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "nika-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Eksporten er lastet ned.");
  }
  function correction() {
    modal(
      `<h2 id="dialog-title">Ser alt riktig ut?</h2><form id="correction-form">${field("Dyrets navn", "draft-name", d.draft.name, "text", 60)}<label class="field">Art<select id="draft-species">${SPECIES.map(s=>`<option${s===(d.draft.species || "Hund")?" selected":""}>${s}</option>`).join("")}</select></label><label class="field">Kjønn<select id="draft-sex">${["Ikke oppgitt","Hann","Hunn"].map(s=>`<option${s===(d.draft.sex || "Ikke oppgitt")?" selected":""}>${s}</option>`).join("")}</select></label>${field("Rase eller blandingshund", "draft-breed", d.draft.breed)}${field("Alder i år eller måneder", "draft-age", d.draft.age, "text", 50)}${errorSlot}<div class="form-actions"><button class="btn">Oppdater oppsummering</button>${btn("Avbryt", "close")}</div></form>`,
    );
    $("correction-form").onsubmit = (e) => {
      e.preventDefault();
      const name = clean($("draft-name").value, 60),
        breed = clean($("draft-breed").value),
        a = age($("draft-age").value);
      if (!name || !breed || !a) {
        $("form-error").textContent =
          "Fyll inn navn, rase og en alder med år eller måneder.";
        return;
      }
      d.draft = { name, breed, age: a, sex: $("draft-sex").value, species: $("draft-species").value };
      save();
      closeModal();
      render();
    };
  }
  function go(p) {
    if (d.addingPet) { d.addingPet=false; save(); }
    page = ["home", "walks", "meals", "family", "profile"].includes(p)
      ? p
      : "home";
    mealEdit = null;
    familyEdit = null;
    render(true);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const accountAction = b.dataset.action;
    if(accountAction==='menu'){menuDialog();return;}
    if(accountAction==='admin'){if(cloudMode)supportUI.admin();return;}
    if(accountAction==='support'){if(cloudMode)supportUI.chat();else modal(`<h2 id="dialog-title">Kontakt Nika-support</h2><p>Logg inn for å sende en privat melding og lese svar i appen.</p><div class="form-actions">${btn('Logg inn','account','')}${btn('Lukk','close')}</div><p class="subline">Problemer med innlogging? <a href="mailto:support.nika@miveno.no">support.nika@miveno.no</a></p>`);return;}
    if(accountAction?.startsWith('sharing')) {if(e.detail<=1)handleSharing(accountAction,b);return;}
    if(accountAction==='gps-help'){gpsHelp();return;}
    if(accountAction==='edit-walk' && !blocked){editWalk(b.dataset.id);return;}
    if(accountAction==='delete-walk' && !blocked){confirmRemove('Slette denne turen?','Turen, hendelsene og eventuelle GPS-punkter slettes fra valgt dyr.','delete-walk-confirm',b.dataset.id);return;}
    if(accountAction==='delete-walk-confirm' && !blocked){d.walks=d.walks.filter(w=>w.id!==b.dataset.id);save();closeModal();render();notify('Turen er slettet.');return;}
    if(accountAction==='gps-start' && d.active && !blocked){d.active.gps ||= [];gps.start(d.active.gps);updateGPS();return;}
    if(accountAction==='gps-stop'){gps.stop();return;}
    if(accountAction==='delete-route'){confirmRemove('Slette GPS-ruten?','Posisjonene slettes fra denne turen. Tid og hendelser beholdes.','delete-route-confirm',b.dataset.id);return;}
    if(accountAction==='delete-route-confirm' && !blocked){const walk=d.walks.find(w=>w.id===b.dataset.id);if(walk)delete walk.gps;save();closeModal();render();return;}
    if(accountAction === "photo") { if(!blocked) photoDialog(); return; }
    if (["account","password","google","azure","cloud-logout","cloud-discard","cloud-discard-confirm","cloud-reset","cloud-reset-confirm"].includes(accountAction)) {
      if (e.detail <= 1) handleAccountAction(accountAction, b);
      return;
    }
    if (externalChanged && !["close","privacy","export","reset","reset-confirm"].includes(b.dataset.action)) {
      notify("Oppdater siden før du fortsetter. Dataene er endret i en annen fane.");
      return;
    }
    if (b.dataset.go) {
      go(b.dataset.go);
      return;
    }
    const a = b.dataset.action,
      id = b.dataset.id;
    if (!a) return;
    // Ignore a physical double-click; subsequent intentional clicks remain available.
    if (e.detail > 1) return;
    if (a === "close") {
      closeModal();
      return;
    }
    if (a === "privacy") {
      privacy();
      return;
    }
    if (a === "export") {
      exportData();
      return;
    }
    if (a === "resume" && !account?.enabled) {
      try { sessionStorage.removeItem('nika-home-after-logout'); } catch {}
      d.sessionEnded=false;
      save(); go("home");
      return;
    }
    if (d.sessionEnded && !["reset","reset-confirm"].includes(a)) return;
    if (a === "logout" && (d.dog || cloudMode)) {
      if (cloudMode) { handleAccountAction('cloud-logout', b); return; }
      modal(`<section class="logout-panel"><h2 id="dialog-title">Logge ut?</h2><p>Du tas til forsiden. Dyreprofiler og historikk beholdes på denne enheten.</p>${allPets().some(p=>p.active)?"<p>En tur pågår. Tiden fortsetter til du åpner profilen og avslutter turen.</p>":""}<p class="notice">Eldre lokal lagring har ingen konto eller passord. Utlogging låser ikke profilene. Andre som bruker denne nettleseren kan åpne dem igjen.</p><div class="form-actions">${btn("Logg ut","logout-confirm","")}${btn("Avbryt","close")}</div></section>`);
      return;
    }
    if (a === "logout-confirm" && d.dog) {
      gps.stop();
      d.sessionEnded=true;
      save(); closeModal(); render(true);
      return;
    }
    if (a === "pets" && d.dog) { petManager(); return; }
    if (a === "choose-pet") { selectPet(id); return; }
    if (a === "add-pet" && d.dog) {
      gps.stop();
      if(allPets().length>=50) {notify("Nika støtter inntil 50 dyreprofiler.");return;}
      d.addingPet=true;
      save(); closeModal(); render(true);
      return;
    }
    if (a === "cancel-pet" && d.dog) {
      d.addingPet=false;
      save(); render(true);
      notify("Utkastet er beholdt. Du kan fortsette under Mine dyr.");
      return;
    }
    if (a === "example") {
      $("answer").value = "Jessica schæfer tispe 2 år";
      $("answer").focus();
      return;
    }
    if (a === "correct") {
      correction();
      return;
    }
    if (
      a === "confirm" &&
      (!d.dog || d.addingPet) &&
      d.draft.name &&
      d.draft.breed &&
      age(d.draft.age)
    ) {
      if(d.dog) {
        d.otherPets.push(petSnapshot());
        const blank=defaults();
        for(const key of PET_FIELDS)d[key]=blank[key];
        d.petId=uid();
      }
      d.dog = { name:d.draft.name,breed:d.draft.breed,age:age(d.draft.age),sex:d.draft.sex || "Ikke oppgitt",species:d.draft.species || "Hund" };
      d.draft=defaults().draft;
      d.addingPet=false;
      save();
      go("home");
      notify(`Velkommen til Nika, ${d.dog.name}!`);
      return;
    }
    if (a === "reset") {
      confirmRemove(
        "Slette alle Nika-data?",
        "Alle dyreprofiler, turer, måltider, familie, utkast og eldre Nika-versjoner fjernes fra denne nettleseren. Eksporter først hvis du vil beholde dem. Annen nettleserlagring berøres ikke.",
        "reset-confirm",
      );
      return;
    }
    if (a === "reset-confirm") {
      gps.stop();
      try {
        localStorage.removeItem(KEY);
        localStorage.removeItem(LEGACY);
        localStorage.removeItem(PRE_MULTI);
        blocked = false;
        storageAvailable = true;
        storageIssue = "";
        upgradeBackupPending="";
        externalChanged=false;
      } catch {
        storageIssue =
          "Nettleseren tillater ikke sletting. Lagrede data kan fortsatt finnes. Tillat nettleserlagring og prøv igjen.";
        showStorage();
        closeModal();
        return;
      }
      d = defaults();
      page = "home";
      closeModal();
      render(true);
      notify("Nika-data er slettet.");
      return;
    }
    if (!d.dog) return;
    if (["home", "profile", "walks", "meals", "family"].includes(a)) {
      go(a);
      return;
    }
    if (a === "startwalk") { startWalkDialog(); return; }
    if (a === "startwalk-confirm") {
      const useGPS=$("walk-use-gps")?.checked;
      closeModal();
      if (!d.active) {
        d.active = { id: uid(), start: Date.now(), events: [] };
        save();
      }
      go("walks");
      if(useGPS){d.active.gps ||= [];gps.start(d.active.gps);updateGPS();}
      return;
    }
    if ((a === "pee" || a === "poop") && d.active) {
      if (Date.now() - (lastClick[a] || 0) < 500) return;
      lastClick[a] = Date.now();
      d.active.events.push({ id: uid(), type: a, at: Date.now() });
      save();
      render();
      notify(
        a === "pee"
          ? "Tissing registrert. Du kan angre i listen."
          : "Bæsjing registrert. Du kan angre i listen.",
      );
      return;
    }
    if (a === "undo-event" && d.active) {
      d.active.events = d.active.events.filter((ev) => ev.id !== id);
      save();
      render();
      notify("Hendelsen er angret.");
      return;
    }
    if (a === "endwalk" && d.active) {
      gps.stop();
      const end = Date.now();
      d.walks.push({
        ...d.active,
        end,
        durationMs: Math.max(0, end - d.active.start),
      });
      d.active = null;
      save();
      render();
      notify("Turen er lagret.");
      return;
    }
    if (a === "remove-place") {
      confirmRemove(
        "Fjerne favorittstedet?",
        "Bare navnet på favorittstedet fjernes.",
        "remove-place-confirm",
        id,
      );
      return;
    }
    if (a === "remove-place-confirm") {
      d.places = d.places.filter((p) => p.id !== id);
      closeModal();
      save();
      render();
      return;
    }
    if (a === "edit-meal") {
      mealEdit = id;
      render();
      $("meal-food")?.focus();
      return;
    }
    if (a === "cancel-meal") {
      mealEdit = null;
      render();
      return;
    }
    if (a === "give") {
      const m = d.meals.find((m) => m.id === id);
      if (m && !mealToday(m)) {
        d.feedings.push({
          id: uid(),
          mealId: m.id,
          food: m.food,
          day: dateKey(),
          at: Date.now(),
        });
        save();
        render();
        notify("Måltidet er registrert som gitt nå.");
      }
      return;
    }
    if (a === "undo-feeding") {
      d.feedings = d.feedings.filter((f) => f.id !== id);
      save();
      render();
      notify("Måltidsregistreringen er angret.");
      return;
    }
    if (a === "delete-meal") {
      confirmRemove(
        "Slette det planlagte måltidet?",
        "Måltidet fjernes fra dagsplanen. Tidligere registreringer bevares i historikken.",
        "delete-meal-confirm",
        id,
      );
      return;
    }
    if (a === "delete-meal-confirm") {
      d.meals = d.meals.filter((m) => m.id !== id);
      mealEdit = null;
      closeModal();
      save();
      render();
      return;
    }
    if (a === "edit-family") {
      familyEdit = id;
      render();
      $("member-name")?.focus();
      return;
    }
    if (a === "cancel-family") {
      familyEdit = null;
      render();
      return;
    }
    if (a === "delete-family") {
      confirmRemove(
        "Fjerne familiemedlemmet?",
        "Personen fjernes bare fra listen på denne enheten. Det sendes ingen melding.",
        "delete-family-confirm",
        id,
      );
      return;
    }
    if (a === "delete-family-confirm") {
      d.family = d.family.filter((m) => m.id !== id);
      familyEdit = null;
      closeModal();
      save();
      render();
      return;
    }
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#home"]');
    if (a) {
      e.preventDefault();
      go("home");
    }
  });
  $("dialog").addEventListener("click", (e) => {
    if (e.target === $("dialog") && e.detail<=1 && Date.now()-modalOpenedAt>350) closeModal();
  });
  let today = dateKey();
  setInterval(() => {
    if (d.active)
      document
        .querySelectorAll("[data-timer]")
        .forEach(
          (el) => (el.textContent = duration(Date.now() - d.active.start)),
        );
    if (today !== dateKey()) {
      today = dateKey();
      if (d.dog && !d.addingPet && !d.sessionEnded && ["home", "meals"].includes(page) && !$("dialog").open)
        render();
    }
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if(document.hidden && gps.active)gps.stop();
    if (!document.hidden && today !== dateKey()) {
      today = dateKey();
      if (!d.addingPet) render();
    }
  });
  window.addEventListener('pagehide',()=>gps.stop());
  window.addEventListener("storage", (e) => {
    if (cloudMode) return;
    if (e.key === KEY || e.key === LEGACY || e.key === PRE_MULTI || e.key === null) {
      storageIssue =
        "Nika-data er endret i en annen fane. Oppdater denne siden før du fortsetter, slik at endringer ikke overskrives.";
      blocked = true;
      gps.stop();
      externalChanged=true;
      showStorage();
      document
        .querySelectorAll("#content input,#content button,#content select,#pet-controls button,#pet-controls select,#nav button")
        .forEach((el) => (el.disabled = true));
    }
  });
  async function sharingDialog() {
    if(!cloudMode){accountDialog();return;}
    modal('<h2 id="dialog-title">Familiedeling</h2><p role="status">Henter tilgang …</p>'+btn('Lukk','close'));
    try {
      const fam=await account.familyContext();
      if(!$('dialog').open)return;
      let body;
      if(!fam) body=`<p>Opprett en delt oversikt, eller bli med med en invitasjonskode. Private profiler beholdes separat.</p><div class="form-actions">${btn('Opprett familie','sharing-create','')}${btn('Bli med i familie','sharing-join')}</div>`;
      else body=`<p class="badge">${account.workspace==='family'?'Du bruker familiens oversikt':'Du bruker din private oversikt'}</p><h3>${html(fam.name)}</h3><p>Medlemmene kan se og redigere alle dyr, bilder, turer, GPS-ruter og måltider i denne delte oversikten. Private profiler deles ikke.</p><ul class="list">${fam.members.map(m=>`<li class="row"><span><strong>${html(m.name)}</strong><br>${m.isOwner?'Familieeier':'Familiemedlem'}</span>${fam.isOwner&&!m.isOwner?btn('Fjern tilgang','sharing-remove','secondary small',m.id):''}</li>`).join('')}</ul><div class="form-actions">${btn(account.workspace==='family'?'Åpne privat oversikt':'Åpne familiens oversikt','sharing-switch','',account.workspace==='family'?'personal':'family')}${account.workspace==='family'?btn('Hent siste familieversjon','sharing-refresh'):''}${btn('Endre mitt visningsnavn','sharing-rename')}${fam.isOwner?btn('Lag invitasjonskode','sharing-invite')+(fam.hasInvitation?btn('Trekk tilbake invitasjon','sharing-revoke'):'')+btn('Avslutt familiedeling','sharing-delete','danger'):btn('Forlat familien','sharing-leave','danger')}</div><p class="muted">Én familie per konto, inntil 12 medlemmer. Hent siste versjon før du redigerer på en annen enhet. Samtidige endringer overskrives ikke automatisk.</p>`;
      modal(`<h2 id="dialog-title">Familiedeling</h2>${body}<p id="sharing-error" class="error" role="alert"></p>${btn('Lukk','close')}`);
    } catch(error){modal(`<h2 id="dialog-title">Familiedeling</h2><p role="alert">${html(error.message)}</p>${btn('Lukk','close')}`);}
  }
  function sharingForm(kind) {
    const create=kind==='create', join=kind==='join';
    if(create && allPets().some(p=>p.active)){notify('Avslutt aktive turer før du oppretter familien.');return;}
    modal(`<h2 id="dialog-title">${create?'Opprett familie':join?'Bli med i familie':'Endre visningsnavn'}</h2><form id="sharing-form">${create?field('Familienavn','sharing-name','','text',60):''}${field('Ditt visningsnavn','sharing-person','','text',60)}${join?field('Invitasjonskode','sharing-code','','text',64):''}${create?'<label class="sharing-consent"><input id="sharing-consent" type="checkbox" required> Jeg vil dele en kopi av dyrene i min private oversikt, inkludert bilder, historikk og eventuelle GPS-ruter, med dem som blir med i familien.</label><p class="muted">Den private oversikten beholdes. Senere endringer i den private og den delte oversikten er separate.</p>':join?'<p>Alle familiemedlemmer kan redigere den delte oversikten. Dine private dyr lastes ikke opp til familien.</p>':''}<p id="sharing-error" class="error" role="alert"></p><div class="form-actions"><button class="btn" type="submit">${create?'Opprett og åpne familie':join?'Bli med og åpne familie':'Lagre navn'}</button>${btn('Avbryt','close')}</div></form>`);
    const form=$('sharing-form');let busy=false;
    form.onsubmit=async event=>{
      event.preventDefault();if(busy||blocked)return;busy=true;
      const error=$('sharing-error');const body={displayName:clean($('sharing-person').value,60)};
      if(create){body.name=clean($('sharing-name').value,60);body.payload=structuredClone(d);body.payload.addingPet=false;body.payload.draft=defaults().draft;}
      if(join)body.code=clean($('sharing-code').value,64);
      form.querySelectorAll('button').forEach(b=>b.disabled=true);gps.stop();
      try{await account.familyAction(kind,body);if(create||join)await account.switchWorkspace('family');else await sharingDialog();}
      catch(e){if(error.isConnected)error.textContent=e.message;}
      finally{busy=false;form.querySelectorAll('button').forEach(b=>b.disabled=false);}
    };
  }
  async function handleSharing(action,button) {
    if(!cloudMode){accountDialog();return;}
    if(action==='sharing'){await sharingDialog();return;}
    if(blocked){notify('Eksporter ulagrede endringer før du oppdaterer siden.');return;}
    const kind=action.replace('sharing-','');
    if(['create','join','rename'].includes(kind)){sharingForm(kind);return;}
    if(['delete','leave','remove'].includes(kind)){
      const messages={delete:['Avslutte familiedelingen?','Den delte oversikten, inkludert bilder og turer, slettes for hele familien. Private oversikter beholdes. Eksporter først hvis dere vil ta vare på dataene.'],leave:['Forlate familien?','Du mister tilgangen til den delte oversikten. Dine private dyr beholdes.'],remove:['Fjerne tilgangen?','Medlemmet mister tilgang til familiens delte oversikt. Allerede nedlastede kopier kan ikke trekkes tilbake.']};
      confirmRemove(...messages[kind],'sharing-'+kind+'-confirm',button.dataset.id);return;
    }
    button.disabled=true;gps.stop();
    try {
      if(kind==='switch')await account.switchWorkspace(button.dataset.id);
      else if(kind==='refresh')await account.switchWorkspace('family');
      else if(kind==='invite'){
        const invitation=await account.familyAction('invite');
        modal(`<h2 id="dialog-title">Inviter til familien</h2><p>Del koden privat med én person du ønsker å gi tilgang. Koden virker én gang og utløper etter 24 timer. En ny kode erstatter den forrige.</p><label class="field">Invitasjonskode<textarea id="invite-code" readonly rows="3">${html(invitation.code)}</textarea></label><p>Gyldig til ${html(dateTime(Date.parse(invitation.expiresAt)))}</p><p class="muted">Ingen e-post sendes automatisk. Personen logger inn i Nika og velger Familie → Bli med i familie.</p><p id="sharing-error" role="status"></p><div class="form-actions">${btn('Kopier kode','sharing-copy','')}${btn('Lukk','close')}</div>`);
      } else if(kind==='copy'){
        try{await navigator.clipboard.writeText($('invite-code').value);$('sharing-error').textContent='Koden er kopiert.';}catch{$('invite-code').select();$('sharing-error').textContent='Marker og kopier koden manuelt.';}
      } else {
        const request=kind.replace('-confirm','');
        await account.familyAction(request,request==='remove'?{userId:button.dataset.id}:{});
        if(['delete','leave'].includes(request))await account.switchWorkspace('personal');else await sharingDialog();
      }
    }catch(e){if($('sharing-error'))$('sharing-error').textContent=e.message;else notify(e.message);}
    finally{button.disabled=false;}
  }

  async function accountDialog() {
    if (cloudMode) {
      modal(`<h2 id="dialog-title">Min konto</h2><p>${html(account.user?.email || 'Innlogget bruker')}</p><p id="account-role">Dine dyr og din historikk er private.</p><section id="admin-summary" hidden></section>${blocked ? '<p class="notice">Du har ulagrede endringer. Eksporter dem før du forlater siden.</p>' : ''}<div class="form-actions">${btn("Opprett eller endre passord","password","")}${btn("Familiedeling","sharing","")}${btn("Logg ut","cloud-logout")}${btn("Eksporter Nika-data","export")}${btn("Lukk","close")}</div><p id="account-error" class="error" role="alert"></p>`);
      const roleEl=$('account-role'), summary=$('admin-summary');
      try {
        const access=await account.access();
        if(!roleEl.isConnected)return;
        roleEl.textContent=(access.role==='admin' ? 'Administrator for Nika. ' : 'Vanlig brukertilgang. ')+(account.workspace==='family'?'Du bruker familiens delte oversikt.':'Du bruker din private oversikt.');
        if(access.role==='admin') {
          summary.hidden=false;
          accountRole='admin';nav();
          summary.innerHTML=btn('Åpne adminpanelet','admin');
        }
      } catch { if(roleEl.isConnected) roleEl.textContent='Kunne ikke kontrollere kontorollen. Lukk og prøv igjen.'; }
      return;
    }
    modal(`<h2 id="dialog-title">Velkommen til Nika</h2><p>Logg inn eller opprett en privat konto.</p><div id="email-login" hidden></div><div class="account-options"><button class="btn secondary" data-action="google" hidden>Fortsett med Google</button><button class="btn secondary" data-action="azure" hidden>Fortsett med Microsoft</button></div><p id="account-error" role="status">Kontrollerer tilgjengelig innlogging …</p><div class="login-footer">${btn("Kontakt support","support","text-button")}${btn("Lukk","close")}</div>`);
    const emailBox = $('email-login');
    try {
      const available = await account.providers();
      if (!$("dialog").open || $('email-login') !== emailBox) return;
      for (const provider of ['google','azure']) document.querySelector(`[data-action="${provider}"]`).hidden = !available[provider];
      if (available.email) { emailBox.hidden=false; emailLoginForm(emailBox); }
      $("account-error").textContent = Object.values(available).some(Boolean) ? '' : 'Innlogging er under klargjøring. Prøv igjen senere.';
    } catch { if ($('email-login') === emailBox) $('account-error').textContent = 'Kunne ikke nå innloggingstjenesten. Lukk og prøv igjen.'; }
  }
  function bindPasswordToggle(root) {
    root.querySelectorAll('[data-password-toggle]').forEach(button => {
      button.onclick=()=>{
        const input=$(button.dataset.passwordToggle), visible=input.type==='password';
        input.type=visible?'text':'password';
        button.textContent=visible?'Skjul':'Vis';
        button.setAttribute('aria-pressed',String(visible));
      };
    });
  }
  function passwordField(id,label,autocomplete='new-password') {
    return `<label for="${id}">${label}</label><div class="password-field"><input id="${id}" type="password" name="${id}" autocomplete="${autocomplete}" required ${autocomplete==='new-password'?'minlength="12" maxlength="72"':'maxlength="1024"'}><button type="button" class="text-button" data-password-toggle="${id}" aria-label="Vis eller skjul ${label.toLowerCase()}" aria-pressed="false">Vis</button></div>`;
  }
  function passwordDialog() {
    if(!cloudMode || !account.user)return;
    modal(`<h2 id="dialog-title">Ditt passord</h2><p>Velg et eget passord til Nika. Neste gang logger du inn med e-post og passord, uten engangskode.</p><form id="password-form" class="auth-form"><input type="text" name="username" autocomplete="username" value="${html(account.user.email)}" hidden>${passwordField('new-password','Nytt passord')}${passwordField('confirm-password','Gjenta passord')}<p id="password-help" class="muted">Minst 12 tegn. Bruk gjerne en lang, unik passordfrase. Ikke bruk passordet til e-postkontoen din.</p><div id="password-reauth" hidden><p>Økten må bekreftes på nytt.</p><button type="button" id="password-send-code" class="btn secondary">Send bekreftelseskode</button><label for="password-nonce">Kode fra e-posten</label><input id="password-nonce" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8"></div><p id="password-status" role="status"></p><div class="form-actions"><button class="btn" type="submit">Lagre passord</button>${btn('Avbryt','close')}</div></form>`);
    const form=$('password-form'),status=$('password-status');let busy=false;
    bindPasswordToggle(form);
    const clear=()=>form.querySelectorAll('input[type="password"],input[data-secret],#password-nonce').forEach(input=>input.value='');
    form.querySelectorAll('.password-field input').forEach(input=>{input.dataset.secret='true';input.setAttribute('aria-describedby','password-help');});
    async function run(work){
      if(busy)return;busy=true;form.setAttribute('aria-busy','true');
      form.querySelectorAll('button,input').forEach(el=>el.disabled=true);
      try{await work();}catch(error){
        if(form.isConnected){status.textContent=error.message;if(['reauthentication_needed','reauthentication_not_valid'].includes(error.code))$('password-reauth').hidden=false;}
      }finally{busy=false;form.removeAttribute('aria-busy');form.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
    }
    form.onsubmit=event=>{
      event.preventDefault();
      if(busy)return;
      if($('new-password').value!==$('confirm-password').value){status.textContent='Passordene er ikke like. Skriv dem på nytt.';clear();$('new-password').focus();return;}
      let password=$('new-password').value,nonce=$('password-nonce').value.trim();
      run(async()=>{
        status.textContent='Lagrer passord …';
        try{await account.setPassword(password,nonce);if(form.isConnected && $('dialog').open){clear();modal(`<h2 id="dialog-title">Passordet er lagret</h2><p>Du kan nå logge inn med e-postadressen din og det nye passordet. Dyrene og historikken er beholdt.</p>${btn('Ferdig','close','')}`);}}
        finally{password='';nonce='';clear();}
      });
    };
    $('password-send-code').onclick=()=>run(async()=>{await account.requestPasswordConfirmation();if(form.isConnected)status.textContent='Sjekk e-posten din. Skriv koden og det nye passordet for å fullføre.';});
  }
  function emailLoginForm(box) {
    let address='',busy=false,mode='login';
    function show(codeStep=false) {
      const emailField=`<label for="login-email">E-postadresse</label><input id="login-email" name="email" type="email" autocomplete="username" maxlength="254" required placeholder="deg@eksempel.no" value="${html(address)}">`;
      box.innerHTML=codeStep
        ? `<form id="email-code-form"><p>Hvis adressen kan brukes til dette, kommer en kode til <strong>${html(address)}</strong>. Sjekk også søppelposten.</p><label for="login-code">Engangskode</label><input id="login-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" minlength="8" maxlength="8" required placeholder="8 siffer"><button class="btn" type="submit">Bekreft og velg passord</button><button id="email-resend" class="text-button" type="button">Send ny kode</button><button id="email-change" class="text-button" type="button">Endre e-postadresse</button></form>`
        : mode==='login'
          ? `<form id="password-login-form">${emailField}${passwordField('login-password','Passord','current-password')}<button class="btn" type="submit">Logg inn</button><div class="auth-links"><button type="button" class="text-button" id="password-recover">Opprett eller glemt passord</button><button type="button" class="text-button" id="email-signup">Opprett konto</button></div><p class="muted">Har du brukt kode før? Velg «Opprett eller glemt passord» for å lage ditt eget passord.</p></form>`
          : `<form id="email-address-form"><h3>${mode==='signup'?'Opprett konto':'Opprett eller glemt passord'}</h3>${emailField}<p class="muted">${mode==='signup'?'Bekreft e-posten med en kode første gang. Deretter velger du passordet ditt.':'Bruk e-postadressen til den eksisterende kontoen. Bekreft en engangskode og velg nytt passord. Dyrene dine beholdes.'}</p><button class="btn" type="submit">Send innloggingskode</button><button type="button" class="text-button" id="password-back">Tilbake til innlogging</button></form>`;
      const form=box.querySelector('form');bindPasswordToggle(form);
      async function run(work){
        if(busy)return;busy=true;form.setAttribute('aria-busy','true');
        form.querySelectorAll('button,input').forEach(el=>el.disabled=true);
        const status=$('account-error');status.textContent='Vent litt …';
        try{await work();}catch(error){if(box.isConnected)status.textContent=error.message;}
        finally{busy=false;form.removeAttribute('aria-busy');form.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
      }
      form.onsubmit=event=>{
        event.preventDefault();if(busy)return;
        if(codeStep){let code=$('login-code').value;run(async()=>{try{await account.verifyEmailCode(code);}finally{code='';const input=form.querySelector('#login-code');if(input)input.value='';}});}
        else {
          address=$('login-email').value.trim();
          if(mode==='login'){
            let password=$('login-password').value;
            run(async()=>{try{await account.signInPassword(address,password);}finally{password='';const input=form.querySelector('#login-password');if(input)input.value='';}});
          } else run(async()=>{await account.requestEmailCode(address,mode);if(box.isConnected && $('dialog').open){show(true);$('account-error').textContent='Kode forespurt. Sjekk e-posten din.';$('login-code').focus();}});
        }
      };
      const changeMode=next=>{if(busy)return;address=$('login-email')?.value.trim()||address;mode=next;show();$('account-error').textContent='';$('login-email').focus();};
      if(codeStep){
        $('email-change').onclick=()=>{if(!busy){show();$('account-error').textContent='';$('login-email').focus();}};
        $('email-resend').onclick=()=>run(async()=>{await account.requestEmailCode(address,mode);if(box.isConnected)$('account-error').textContent='Ny kode forespurt. Sjekk e-posten din.';});
      }else if(mode==='login'){
        $('password-recover').onclick=()=>changeMode('password');$('email-signup').onclick=()=>changeMode('signup');
      }else $('password-back').onclick=()=>changeMode('login');
    }
    show();
  }

  async function handleAccountAction(action, button) {
    if(action.includes("logout") || action.includes("reset") || action.includes("discard"))gps.stop();
    if (!account?.enabled) return;
    if (action === 'account') { await accountDialog(); return; }
    if (action === 'password') { passwordDialog(); return; }
    if (action === 'cloud-logout' && blocked) {
      modal(`<h2 id="dialog-title">Ulagrede endringer</h2><p>Eksporter endringene før du logger ut. Ellers forsvinner det som ikke ble lagret på kontoen.</p><div class="form-actions">${btn("Eksporter Nika-data","export")}${btn("Logg ut uten å lagre","cloud-discard-confirm","danger")}${btn("Avbryt","close")}</div>`);
      return;
    }
    if (action === 'cloud-reset') {
      confirmRemove('Slette dyredata på kontoen?', 'Alle dyreprofiler og historikk på denne kontoen slettes. Selve innloggingskontoen og tidligere lokale data beholdes. Eksporter først hvis du vil beholde historikken.', 'cloud-reset-confirm');
      return;
    }
    button.disabled = true;
    try {
      if (action === 'google' || action === 'azure') await account.signIn(action);
      if (action === 'cloud-logout') await account.signOut();
      if (action === 'cloud-discard-confirm') await account.signOut({discardUnsaved:true});
      if (action === 'cloud-reset-confirm') { await account.removeData(); d=defaults(); closeModal(); render(true); notify('Dyredata på kontoen er slettet.'); }
    } catch(e) {
      if ($('account-error')) $('account-error').textContent = 'Handlingen kunne ikke fullføres. '+e.message;
      else { storageIssue=e.message; showStorage(); }
      button.disabled = false;
    }
  }
  async function boot() {
    if (!account?.enabled) { render(); return; }
    if(!storageAvailable){d=defaults();d.sessionEnded=true;render();return;}
    $('content').innerHTML = '<p role="status" class="notice">Åpner Nika …</p>';
    account.on((type,error) => {
      if (type === 'saved') { storageIssue='Lagret på kontoen.'; showStorage(); }
      if (type === 'saveerror') { gps.stop('GPS er stoppet fordi lagring feilet.'); blocked=true; storageIssue=error.message; render(); }
      if (type === 'signedout' || type === 'accountchanged') {
        gps.stop(); d=defaults(); cloudReady=false;
        $('dialog').close(); $('pet-controls').replaceChildren(); $('nav').replaceChildren();
        $('content').replaceChildren();
        location.replace('/?signedout=1');
      }
    });
    try {
      const user = await account.restore();
      if (user) {
        cloudMode=true;
        // Do not show a previous local user's data while a cloud account is loading.
        d=defaults();
        const stored=await account.load();
        d=stored ? validate(stored) : defaults();
        d.sessionEnded=false; blocked=false; storageIssue=''; cloudReady=true;
        try{accountRole=(await account.access()).role==='admin'?'admin':'member';}catch{accountRole='member';}
      } else {
        d=defaults(); d.sessionEnded=true;

      }
      const params = new URLSearchParams(location.search);
      if (params.has('error') || params.has('error_description')) storageIssue='Innloggingen ble avbrutt eller avvist. Du kan prøve igjen.';
      const setupPassword=cloudMode && params.get('password')==='setup';
      if (params.has('code') || params.has('error') || params.has('signedout') || params.has('password')) history.replaceState(null,'',location.pathname);
      render();
      if(setupPassword)passwordDialog();
    } catch {
      $('content').innerHTML='<section class="card"><h1>Kunne ikke åpne kontoen</h1><p>Dataene er ikke endret. Kontroller forbindelsen og oppdater siden.</p><button class="btn" data-action="cloud-logout">Logg ut og gå til forsiden</button></section>';
    }
  }
  boot();
})();
