export function createAccount({config, createClient, storage = () => window.localStorage, fetcher = (...args) => fetch(...args), navigate = url => window.location.replace(url), origin = () => window.location.origin}) {
  const storageKey = 'nika-auth-v1';
  let client, user = null, revision = null, queue = Promise.resolve(), failed = null, generation = 0, signingIn = false;
  const listeners = new Set();
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
    return {google:settings.external?.google === true, azure:settings.external?.azure === true};
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
  async function load() {
    if (!user) throw Error('Du må logge inn først.');
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
    if (!user) throw Error('Du må logge inn først.');
    const {error} = await getClient().from('nika_user_state').delete().eq('user_id',user.id);
    if (error) throw Error('Dataene kunne ikke slettes. Prøv igjen.');
    revision = null;
  }
  return {enabled:config.enabled,providers,signIn,restore,load,save,signOut,removeData,
    get user(){return user;}, get failed(){return failed;}, on(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
