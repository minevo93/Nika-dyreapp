# Nika – Dyreappen

**Pågående kontoarbeid:** Google og Microsoft/Hotmail er valgt. Privat database og kontokode er klargjort, men innlogging er deaktivert til OAuth-appene er registrert og ekte innlogging er testet. Se [status og aktivering](docs/account-setup.md). GPS og familiedeling gjenstår. Den offentlige appen fungerer fortsatt som lokal demo.

En norsk, lokal webdemo for dyrehverdagen. Vanlig HTML, CSS og JavaScript, uten rammeverk, byggesteg eller backend.

**Live og offentlig testet:** https://nika-dyreapp.netlify.app/

Produksjonsdeploy `6ad0c1cda037728230eda36a` er `ready`, publisert 15. oktober 2026 kl. 14:06 Oslo-tid via Netlify Drop til det eksisterende Nika-prosjektet. Forsidetekstene følger rekkefølgen overskrift → støttesetninger → «DITT DYR. DIN FAMILIE. DERES HVERDAG.», med én eller to linjer per tekst. Mobil har fast bunnmeny med alle fem hovedvalg og plass under innholdet, stående og liggende. Begge tekstkortene ved Nika og Tyra er synlige på mobil. Lokal utlogging går til forsiden og bevarer profilene. Funksjonene med flere dyr, setningsregistrering, turer, måltider og kompakt hverdagsoversikt er bevart. [Produksjonstesten](https://github.com/minevo93/Nika-dyreapp/actions/runs/38732405926) verifiserte publiserte filer mot kodebasen og besto funksjonstestene, ti skjermstørrelser og rotasjon. Se [TESTING.md](TESTING.md).

## Kjør lokalt

```sh
python3 -m http.server 4173 --directory public
```

Åpne http://localhost:4173. Bruk HTTP-server, ikke `file://`.

## Innhold

- Appnavnet er fortsatt Nika. Nika og Tyra presenteres som to firbente bestevenninner og inspirasjonen bak appen. I stående mobilvisning kommer duoen før chatten; liggende mobil får et kompakt side-ved-side-oppsett.
- Chatstyrt registrering: navn, rase og alder i år/måneder, stegvis, med komma eller som setning: `Jessica schæfer tispe 2 år` og `Hunden min heter Luna og er en golden retriever på 3 år.` Art og kjønn kan angis og redigeres. Oppsummering og korrigering før lagring; manglende opplysninger etterspørres.
- «Mine dyr»: legg til og bytt mellom opptil 50 lokale profiler. Turer, måltider og favorittsteder holdes atskilt; familien er felles. En uferdig tilleggsregistrering kan pauses og gjenopptas uten å erstatte eksisterende profil.
- Profilredigering, egen forbokstav per dyr og samlet «Hverdagen deres»-kort med tur, måltid, familie og favorittsteder. Faktiske tomtilstander, ikke oppdiktet aktivitet.
- Én aktiv tur per dyr, løpende varighet, tidsfestet tissing/bæsjing, angre og historikk. Turer fortsetter også ved profilbytte. Varighet lagres i millisekunder; korte turer vises i sekunder. Egne, manuelt navngitte favorittsteder.
- Daglig måltidsplan med opprett/rediger/slett. «Gitt nå» lagres som en separat datert hendelse og kan angres. Historikken bevares når planen slettes.
- Lokal familieliste med navn og rolle, uten invitasjoner eller synkronisering.
- «Logg ut» avslutter den lokale visningsøkten, men beholder data og pågående turer. «Åpne mine dyr» åpner igjen uten passord. Dette er uttrykkelig ikke en sikker kontoinnlogging eller tilgangsbeskyttelse.
- Eksport og bekreftet sletting av bare Nika-data.

## Lagring og personvern

`nika-demo-v2` inneholder versjonert og validert struktur i localStorage. Eksisterende `nika-mvp-v1` migreres én gang når v2 mangler. Originalen beholdes urørt til brukeren uttrykkelig sletter Nika-data. Profil, turer, aktive turer, måltidsplan, familie og gammelt kontaktfelt bevares. Gamle turhendelser hadde ikke tidspunkt og vises som historiske antall. Gamle «gitt»-flagg hadde ingen dato og overføres derfor ikke til den daterte måltidshistorikken; brukeren varsles.

Flere dyr bruker fortsatt samme lagringsnøkkel og `version: 2`, med `multiPetVersion: 1`. Valgt dyr ligger i rotfeltene; bare inaktive profiler ligger i `otherPets`. Hver profil har stabil ID og egne turer, aktiv tur, måltidsplan, gjennomførte måltider og steder. Familien er felles. `addingPet`/`draft` bevarer registreringsfremdrift, og `sessionEnded` bevarer lokal utlogging. Før en eldre v2 oppgraderes, kopieres originalteksten uendret til `nika-demo-v2-before-multi`. Hvis kopieringen feiler, overskrives ikke originalen; appen varsler og virker i minnet. Kopien er lokal og ingen ekstern sikkerhetskopi. Eksport inkluderer alle profiler og migreringskopien. Bekreftet sletting fjerner bare de tre navngitte Nika-nøklene, aldri annen nettleserlagring.

Korrupt struktur beholdes, skriving blokkeres og et varsel vises. Ved utilgjengelig/full localStorage virker demoen i minnet, med et vedvarende varsel om at oppdatering mister nye endringer. Eksport kan lagre øktdata. En annen fanes endringer blokkerer videre redigering og ber om oppdatering for å hindre overskriving. Alderen er alder ved registrering og oppdateres manuelt.

Ingen analyse, nettverks-API-er, eksterne fonter, posisjonsinnsamling eller hemmeligheter. Eksportfiler inneholder brukerens lokale data og må oppbevares privat. Ingen data er forhåndsutfylt i appen. Lokal lagring er ingen sikkerhetskopi.

## Netlify

Bruk eksisterende prosjekt `nika-dyreapp`, team `minevo93`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`. Repository: `minevo93/Nika-dyreapp`. Publiserte webfiler tilsvarer commit `ded09440b25c671bd4760d4eaf12ad3ed46f2e3e` på `feat/nika-demo-v2`. Produksjonstesten ligger i `9e26c62993429578817ba75ef7d06998d6be8cb3`. Koden og dokumentasjonen er samlet i PR #1. `main` er ikke endret.

Netlifys Developer settings er kontrollert og viser **Current repository: Not linked**. Dette er derfor et manuelt produksjonsdeploy, ikke automatisk Git-publisering. Ingen konto- eller repository-tilgang er utvidet for å koble Git. Før en eventuell senere Git-kobling med produksjonsgren `main` må den ferdige koden merges med nødvendig godkjenning, slik at en eldre main-versjon ikke erstatter demoen.

`netlify.toml` publiserer **public/**, uten build-kommando. Bare appfilene og Netlifys `_headers`-fil inngår; dokumentasjon, tester, node_modules og testbevis ligger utenfor. `.netlify/` ignoreres og skal ikke committes. `_headers` sikrer at også direkte ZIP-publisering får sikkerhetsheaderne, uten et Git-bygg.

Forhåndsvisning via PR/Netlify Git-kobling, eller `netlify deploy --site 8d14e785-89c3-412a-9fce-acbd2113e653 --dir public`. Produksjon etter bestått test: Git-deploy fra main, eller samme CLI med `--prod`. En senere Git-deploy fra main erstatter et manuelt produksjonsdeploy. Ikke endre andre prosjekter eller teamets innstillinger.

Sikkerhetsheadere inkluderer CSP, blokkering av geolokasjon/kamera/mikrofon og rammeinnbygging. En vellykket deploy må i tillegg kontrolleres i en nettleser uten Netlify-økt; HTTP 200 alene er ikke tilstrekkelig.

## Tester

```sh
npm ci
npx playwright install --with-deps chromium
npm test
node tests/responsive.cjs
node tests/registration.cjs
node tests/multi-pet.cjs
```

Testen starter en lokal server og kjører reelle nettleserinteraksjoner med Playwright. `NIKA_TEST_URL=https://... npm test` kan teste en Netlify-forhåndsvisning eller produksjon. Ikke bruk en URL med private data. Tester kjøres i isolerte nettleserkontekster med kun oppdiktede testdata.

GitHub Actions kjører funksjonstestene og en egen mobil-/rotasjonstest. `tests/responsive.cjs` dekker ti visningsstørrelser fra 320 × 568 til 1440 × 1000, inkludert 568 × 320 og 844 × 390 i liggende format. Den kontrollerer bildeplassering, historie, overflyt, berøringsflater, registrering og profil etter oppdatering. En egen sekvens kontrollerer fremdrift gjennom rotasjon og redusert høyde som med et åpent skjermtastatur. Dette er nettleseremulering, ikke en fysisk telefon eller et faktisk iOS-/Android-tastatur. Resultater og skjermbilder lagres som `nika-browser-evidence`. Dokumenter utførte resultater separat; konfigurerte tester er ikke i seg selv bevis på beståtte tester.

`tests/registration.cjs` tester den rene, regelstyrte parseren. `tests/multi-pet.cjs` tester setningsregistrering, redigerbar oppsummering, separate profiler/historikker, delt familie, uferdig registrering, utlogging/gjenåpning, kompakt layout, 44 px knapper, fanekonflikter, migrering, lagringsfeil og sletting. Nettlesertestene støtter `NIKA_TEST_URL` og er kjørt både i forhåndsvisning og mot offentlig produksjon.

## Begrensninger

Ingen generell AI-chat, GPS/kart/ruter, brukerkontoer, database, enhetsdeling, aktiv QR-ID/finner-side, butikk, betaling eller individuelle helse-/kostråd. QR og butikk er skjult til de har fungerende arbeidsflyter. Registreringsveiviseren er regelstyrt og kan ikke forstå alle frie formuleringer; oppsummering og manuell korrigering er alltid tilgjengelig. Hund, katt, kanin og annet dyr er profilvalg, ikke artsbestemt helserådgivning. Alderen valideres til over null og høyst 100 år. Enkeltprofiler har foreløpig ikke egen sletteknapp; bekreftet sletting gjelder alle Nika-data.

Nika-maskoten er en AI-generert illustrasjon basert på brukerens referansebilder. Den er en merkevareillustrasjon, ikke et profilfoto av hvert registrerte dyr eller en interaktiv 3D-modell. Profilkortet viser nå dyrets egen forbokstav. Bare avledede, optimaliserte illustrasjoner publiseres; originalfotoene og bakgrunnene er ikke inkludert. Se [illustrasjonens kilde og prompt](docs/mascot-reference-v2.md). Den tidligere SVG-illustrasjonen er beholdt som en eldre ressurs.

Den hvite hunden er lagt til i en egen transparent [duoillustrasjon](docs/mascot-duo-v3.md), med samme stil som Nika. Tidligere illustrasjoner er bevart. Kun avledede illustrasjoner publiseres, aldri de brukerleverte originalfotoene. Designreferansefilen var ikke tilgjengelig under første implementering; den skriftlige retningen ble fulgt.

## Utført kvalitetssikring

Se [TESTING.md](TESTING.md) for 20 eksisterende og 11 nye beståtte funksjonstestgrupper, 17 parser-eksempler med ekstra validering, ti skjermstørrelser og rotasjon. Testcommit `ce695fb0d65c4a19ff466cb7e0ec127c1821638d` verifiserer offentlig produksjon uten Netlify-innlogging. Ingen JavaScript-feil, konsollfeil eller manglende appressurser ble registrert. Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions. Ikke testet på fysisk telefon, Firefox eller Safari.
