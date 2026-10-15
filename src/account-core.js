export function createAccount({config, createClient, storage = () => window.localStorage, fetcher = (...args) => fetch(...args), navigate = url => window.location.replace(url), origin = () => window.location.origin, now = () => Date.now()}) {
  const storageKey = 'nika-auth-v1';
  let client, user = null, revision = null, queue = Promise.resolve(), failed = null, generation = 0, signingIn = false;
  const listeners = new Set();
  let workspace = "personal", familyInfo = null;
  let emailBusy = false, pendingEmail = '', nextEmailAt = 0, passwordBusy = false, nextReauthAt = 0;
  const signal = (type, detail) => listeners.forEach(fn => fn(type, detail));
  function getClient() {
    if (!config.enabled) throw Error('Kontoinnlogging er ikke aktivert ennå.');
    if (!client) {
      // PKCE cannot safely resume if its verifier cannot be stored. Fail visibly.
      const s = storage();
      s.setItem('nika-auth-storage-check', '1');
      s.removeItem('nika-auth-storage-check');
      client = createClient(config.url, config.key, {auth:{flowType:'pkce', storage:s, storageKey, persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
      client.auth.onAuthStateChange((event, session) => {
        // No awaited Supabase operation inside the auth callback (SDK lock).
        if (event === 'SIGNED_OUT' && user) {
          generation++; user = null; revision = null;
          signal('signedout');
        }
        if (event === 'SIGNED_IN' && user && session?.user.id !== user.id) {
          generation++; user = null; revision = null;
          signal('accountchanged');
        }
      });
    }
    return client;
  }
  async function providers() {
    if (!config.enabled) return {google:false, azure:false};
    const r = await fetcher(config.url+'/auth/v1/settings', {headers:{apikey:config.key}, signal:AbortSignal.timeout(12000)});
    if (!r.ok) throw Error('Kunne ikke kontrollere innloggingen. Prøv igjen.');
    const settings = await r.json();
    return {google:settings.external?.google === true, azure:settings.external?.azure === true, email:config.emailEnabled === true && settings.external?.email === true};
  }
  function emailReady() {
    if (!config.enabled || !config.emailEnabled) throw Error('E-postinnlogging er ikke aktivert ennå.');
    if (origin() !== new URL(config.redirectTo).origin) throw Error('Åpne Nika på den offentlige nettadressen for å logge inn.');
    if (user) throw Error('Logg ut før du bytter konto.');
  }
  async function requestEmailCode(address, purpose = 'signup') {
    emailReady();
    if (!['signup','password'].includes(purpose)) throw Error('Velg registrering eller opprett nytt passord.');
    const email = String(address || '').trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Skriv en gyldig e-postadresse.');
    if (emailBusy || passwordBusy) throw Error('Vent til forespørselen er ferdig.');
    if (now() < nextEmailAt) throw Error('Vent ett minutt før du ber om en ny kode.');
    emailBusy = true;
    try {
      if (!(await providers()).email) throw Error('E-postinnlogging er ikke klar ennå.');
      const {error} = await getClient().auth.signInWithOtp({email, options:{shouldCreateUser:purpose === 'signup', emailRedirectTo:config.redirectTo}});
      // Recovery never creates accounts or reveals whether an address is registered.
      if (error && !(purpose === 'password' && error.code === 'otp_disabled')) throw Error('Kunne ikke sende kode. Vent litt og prøv igjen, eller kontakt support.');
      pendingEmail = email; nextEmailAt = now() + 60000;
    } finally { emailBusy = false; }
  }
  async function verifyEmailCode(value) {
    emailReady();
    const token = String(value || '').trim();
    if (!pendingEmail) throw Error('Be om en kode først.');
    if (!/^\d{8}$/.test(token)) throw Error('Skriv den åttesifrede koden fra e-posten.');
    if (emailBusy || passwordBusy) throw Error('Vent til forespørselen er ferdig.');
    emailBusy = true;
    try {
      const {data,error} = await getClient().auth.verifyOtp({email:pendingEmail, token, type:'email'});
      if (error || !data.session) throw Error('Koden er feil eller utløpt. Prøv igjen eller be om en ny kode.');
      // Never grant access from form values: boot verifies the session with getUser.
      pendingEmail = '';
      const target = new URL(config.redirectTo);
      target.searchParams.set('password','setup');
      navigate(target.href);
    } finally { emailBusy = false; }
  }
  async function signInPassword(address, password) {
    emailReady();
    const email=String(address || '').trim();
    if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Skriv en gyldig e-postadresse.');
    if(typeof password!=='string' || !password || password.length>1024) throw Error('Skriv passordet ditt.');
    if(emailBusy || passwordBusy) throw Error('Vent til forespørselen er ferdig.');
    passwordBusy=true;
    try {
      const {data,error}=await getClient().auth.signInWithPassword({email,password});
      if(error || !data?.session) throw Error('Kunne ikke logge inn. Kontroller e-post og passord, eller velg «Opprett eller glemt passord».');
      navigate(config.redirectTo);
    } finally {passwordBusy=false;}
  }
  async function verifiedOwner() {
    if(!user) throw Error('Du må logge inn først.');
    const owner=user.id, epoch=generation;
    const {data,error}=await getClient().auth.getUser();
    if(error || data?.user?.id!==owner || generation!==epoch || user?.id!==owner) throw Error('Økten kunne ikke bekreftes. Logg inn på nytt.');
    return {owner,epoch};
  }
  async function setPassword(password, nonce = '') {
    if(typeof password!=='string' || password.length<12 || new TextEncoder().encode(password).length>72) throw Error('Bruk minst 12 tegn og maksimalt 72 byte. Norske tegn kan bruke flere byte.');
    if(nonce && !/^\d{6,8}$/.test(nonce)) throw Error('Skriv bekreftelseskoden fra e-posten.');
    if(passwordBusy) throw Error('Vent til forespørselen er ferdig.');
    passwordBusy=true;
    try {
      const {owner,epoch}=await verifiedOwner();
      const {data,error}=await getClient().auth.updateUser({password,...(nonce?{nonce}:{})});
      if(error) {
        const messages={reauthentication_needed:'Bekreft e-posten på nytt før du endrer passord.',reauthentication_not_valid:'Bekreftelseskoden er feil eller utløpt.',same_password:'Velg et annet passord enn det du allerede bruker.',weak_password:'Passordet ble avvist. Velg et lengre, unikt passord.'};
        const e=Error(messages[error.code] || 'Passordet kunne ikke lagres. Prøv igjen. Ved fortsatt feil: logg ut og velg «Opprett eller glemt passord».');
        e.code=error.code; throw e;
      }
      if(data?.user?.id!==owner || generation!==epoch || user?.id!==owner) throw Error('Økten er endret. Logg inn på nytt.');
      // Passwords never enter animal payloads, browser storage, metadata or logs.
    } finally {passwordBusy=false;}
  }
  async function requestPasswordConfirmation() {
    if(passwordBusy) throw Error('Vent til forespørselen er ferdig.');
    if(now()<nextReauthAt) throw Error('Vent ett minutt før du ber om en ny kode.');
    passwordBusy=true;
    try {
      await verifiedOwner();
      const {error}=await getClient().auth.reauthenticate();
      if(error) throw Error('Kunne ikke sende bekreftelseskoden. Prøv igjen senere.');
      nextReauthAt=now()+60000;
    } finally {passwordBusy=false;}
  }
  async function signIn(provider) {
    if (!['google','azure'].includes(provider)) throw Error('Velg Google eller Microsoft.');
    if (signingIn) return;
    signingIn = true;
    try {
      const available = await providers();
      if (!available[provider]) throw Error('Denne innloggingen er ikke klar ennå. Ingen konto er opprettet.');
      // No caller-controlled redirect, scopes, or role values.
      if (origin() !== new URL(config.redirectTo).origin) throw Error('Åpne Nika på den offentlige nettadressen for å logge inn.');
      const options = {redirectTo:config.redirectTo, ...(provider === 'azure' ? {scopes:'email', queryParams:{prompt:'select_account'}} : {queryParams:{prompt:'select_account'}})};
      const {error} = await getClient().auth.signInWithOAuth({provider,options});
      if (error) throw error;
    } catch(e) { signingIn = false; throw e; }
  }
  async function restore() {
    if (!config.enabled) return null;
    const c = getClient();
    const {data, error} = await c.auth.getSession();
    if (error) throw Error('Innloggingen kunne ikke gjenopprettes. Prøv å logge inn på nytt.');
    if (!data.session) return null;
    const verified = await c.auth.getUser();
    if (verified.error || !verified.data.user) throw Error('Kunne ikke bekrefte innloggingen. Ingen dyredata er åpnet.');
    user = {id:verified.data.user.id, email:verified.data.user.email || ''};
    return user;
  }
  async function access() {
    if (!user) throw Error("Du må logge inn først.");
    const {data,error}=await getClient().rpc("nika_account_access");
    if(error || !["admin","member"].includes(data?.role)) throw Error("Kunne ikke kontrollere tilgangen. Prøv igjen.");
    return data;
  }
  async function familyRequest(action, body = {}) {
    if (!user) throw Error('Du må logge inn først.');
    const {data,error} = await getClient().rpc('nika_family', {action,body});
    if(error) throw Error(action === 'save' ? 'Familieendringene kunne ikke lagres. En annen enhet kan ha nyere endringer. Eksporter øktdata før du oppdaterer siden.' : 'Kunne ikke fullføre familiehandlingen. Kontroller tilgang, invitasjonskode og forbindelse.');
    return data;
  }
  async function familyContext() {
    const data = await familyRequest('context');
    familyInfo = data.family;
    return familyInfo;
  }
  async function familyAction(action, body = {}) {
    await queue;
    if (!['create','join','invite','revoke','remove','leave','delete','rename'].includes(action)) throw Error('Ukjent handling.');
    return familyRequest(action,body);
  }
  async function switchWorkspace(target) {
    await queue;
    if (!['personal','family'].includes(target)) throw Error('Ukjent oversikt.');
    if(target === 'family' && !(await familyContext())) throw Error('Du er ikke med i en familie.');
    storage().setItem('nika-workspace-'+user.id,target);
    navigate('/');
  }
  async function load() {
    if (!user) throw Error('Du må logge inn først.');
    await familyContext();
    workspace = storage().getItem('nika-workspace-'+user.id) === 'family' && familyInfo ? 'family' : 'personal';
    if(workspace === 'family') {
      const data=await familyRequest('load');
      revision=data.revision;
      return data.payload;
    }
    const {data,error} = await getClient().from('nika_user_state').select('payload,revision').eq('user_id',user.id).maybeSingle();
    if (error) throw Error('Kunne ikke hente data fra kontoen. Prøv igjen når forbindelsen er tilbake.');
    revision = data?.revision ?? null;
    return data?.payload ?? null;
  }
  function save(payload) {
    if (!user) return Promise.reject(Error('Du må logge inn først.'));
    const snapshot = structuredClone(payload), owner = user.id, currentGeneration = generation;
    // Session/view flags do not belong to the synchronized animal data.
    snapshot.sessionEnded = false;
    queue = queue.then(async () => {
      if (failed) throw failed;
      if (generation !== currentGeneration || user?.id !== owner) throw Error('Økten er avsluttet.');
      if (workspace === 'family') {
        const data=await familyRequest('save',{payload:snapshot,revision});
        if(generation !== currentGeneration)return;
        revision=data.revision; signal('saved'); return;
      }
      const table = getClient().from('nika_user_state');
      const operation = revision === null
        ? table.insert({user_id:owner,payload:snapshot,revision:0})
        : table.update({payload:snapshot,revision:revision+1}).eq('user_id',owner).eq('revision',revision);
      const {data,error} = await operation.select('revision').maybeSingle();
      if (generation !== currentGeneration) return;
      if (error || !data) throw Error('Endringene ble ikke lagret. En annen enhet kan ha endret dataene, eller forbindelsen er brutt. Eksporter øktdata før du oppdaterer siden.');
      revision = data.revision;
      signal('saved');
    }).catch(error => {failed = error; signal('saveerror',error); throw error;});
    // The caller receives the rejection; preserve the queue's rejection without unhandled promises.
    queue.catch(() => {});
    return queue;
  }
  async function signOut({discardUnsaved = false} = {}) {
    if (!discardUnsaved) await queue;
    const {error} = await getClient().auth.signOut({scope:'local'});
    if (error) throw Error('Utloggingen kunne ikke fullføres. Sjekk forbindelsen og prøv igjen.');
    generation++; user = null; revision = null;
    // The SDK removes only its own session; demo data and unrelated storage are retained.
    navigate('/?signedout=1');
  }
  async function removeData() {
    await queue;
    if(workspace === 'family') throw Error('Avslutt delingen i Familie for å slette den delte oversikten. Private dyredata slettes fra privat oversikt.');
    if (!user) throw Error('Du må logge inn først.');
    const {error} = await getClient().from('nika_user_state').delete().eq('user_id',user.id);
    if (error) throw Error('Dataene kunne ikke slettes. Prøv igjen.');
    revision = null;
  }
  return {enabled:config.enabled,providers,signIn,signInPassword,setPassword,requestPasswordConfirmation,requestEmailCode,verifyEmailCode,restore,access,load,save,signOut,removeData,familyContext,familyAction,switchWorkspace,
    get workspace(){return workspace;}, get family(){return familyInfo;},
    get user(){return user;}, get failed(){return failed;}, on(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
