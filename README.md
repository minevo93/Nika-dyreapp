# Nika – Dyreappen

En norsk webapp for dyreprofiler, turer, måltider og familie. Nika og Tyra er ansiktene og historien bak appen. Grensesnittet bruker HTML, CSS og JavaScript. Kontofunksjonene bruker Supabase.

**Nettsted:** https://www.nikaappen.no/

Denne grenen inneholder også GPS og familiedeling. En commit betyr ikke at nettstedet er oppdatert: produksjon må publiseres og verifiseres separat.

## Kjør og bygg

```sh
npm ci
npm run build:account
node tests/server.cjs
```

Åpne http://127.0.0.1:4173. `build:account` bygger Supabase-klienten fra `src/` til `public/account.bundle.js`. Den øvrige appen trenger ikke et rammeverk eller byggesteg. Avhengigheter og låsefil er versjonsfestet.

## Funksjoner

- Regelstyrt chatregistrering med navn, rase og alder, også i setninger uten komma. Oppsummering kan korrigeres før lagring.
- Flere dyr med separate profiler, turer, måltider og favorittsteder.
- Profilbilder kan lastes opp, beskjæres, erstattes og fjernes. Bilder komprimeres før lagring. Se [profilbilder](docs/profile-photos.md).
- Turer med bekreftet start, varighet, tidsfestede hendelser, angre og historikk som kan redigeres eller slettes. Korte turer lagres i sekunder.
- Valgfri GPS med eksplisitt aktivering, pause og lagrede ruter uten bakgrunnskart.
- Daglig måltidsplan og separat, datert historikk over måltider som er gitt.
- Kontoinnlogging med e-post og eget passord. Nye brukere bekrefter e-posten med engangskode før de velger passord. Eksisterende brukere kan opprette passord fra Min konto eller via «Opprett eller glemt passord». Utlogging avslutter kontoøkten og går til forsiden.
- Familiedeling med separate private og delte oversikter, engangskoder, medlemskontroll og beskyttelse mot overskriving fra samtidige enheter.
- Eksport og bekreftet sletting av data. Navnelister for familiens oppgaver gir ikke kontotilgang.

Se [GPS og familiedeling](docs/gps-and-family.md) for brukerflyt, tilgang og begrensninger.

## Lagring og tilgang

Innloggede brukeres private data lagres med tilgangskontroll på serveren. Familiens data ligger separat og er bare tilgjengelige for medlemmer. Familieeier kan administrere medlemskap; dette er ikke administratorrettigheter i selve Nika. Appadministratorens eget panel viser registrerte brukere, e-post, registreringsdato og siste innlogging. Aktivitetstallet betyr innlogget siste 30 dager, ikke tilstede akkurat nå. Dyreprofiler og GPS-ruter er ikke tilgjengelige i adminpanelet.

Produksjonsappen krever konto. Eldre lokal lagring bruker `nika-demo-v2`. Eksisterende data fra `nika-mvp-v1` migreres uten å fjerne originalen. Oppgradering til flere dyr bevarer en kopi under `nika-demo-v2-before-multi`. Lokal data lastes ikke automatisk opp til en konto. Det gamle Netlify-domenet og det nye domenet har separate nettleserlagre.

Korrupt lagring beholdes og skriving blokkeres med en forklaring. Utilgjengelig lokal lagring varsles; øktdata kan eksporteres. Skykonflikter stopper lagring i stedet for å overskrive nyere data. Eksporter ulagrede endringer før oppdatering av siden. Eksportfiler kan inneholde bilder og GPS-ruter og bør oppbevares privat.

Bare den offentlige publishable-nøkkelen finnes i frontend. Servernøkler og SMTP-hemmeligheter skal aldri ligge i repository eller publiserte filer. SQL-oppsettet ligger i `supabase/`; endringer skal testes og gjennomgås før de brukes på eksisterende data.

## Publisering på Netlify

Bruk prosjektets eksisterende Netlify-site. Ikke opprett nye prosjekter. `netlify.toml` har publiseringsmappe **public/** og ingen build-kommando: bygg kontoklienten før publisering. Ved manuell ZIP-publisering skal innholdet i `public/` ligge i ZIP-roten, inkludert `_headers`. Ikke publiser repo-roten, testdata, dokumentasjon, node_modules eller lokale innstillinger.

`.netlify/` ignoreres av Git. Sikkerhetsheadere finnes i både `netlify.toml` og `public/_headers`. GPS tillates bare for samme nettsted; kamera, mikrofon og rammeinnbygging blokkeres.

Følg grenbeskyttelse og godkjenningskrav før merge. Kontroller etter publisering at filene stemmer med testet commit, og kjør nettlesertestene mot den offentlige HTTPS-adressen uten Netlify-innlogging.

## Tester

```sh
npm run test:account
node tests/password.cjs
node tests/gps.cjs
node tests/family.cjs
npx playwright install --with-deps chromium
npm test
node tests/responsive.cjs
node tests/registration.cjs
node tests/multi-pet.cjs
node tests/account-browser.cjs
node tests/password-browser.cjs
node tests/support-browser.cjs
node tests/pet-photo.cjs
node tests/gps-browser.cjs
node tests/family-browser.cjs
```

GitHub Actions kjører disse testene. Skjermbilder lagres som workflow-artefakter. `NIKA_TEST_URL=https://www.nikaappen.no node tests/public-release.cjs` sammenligner publiserte webfiler med repository. Flere nettlesertester støtter samme miljøvariabel.

Account- og familietester bruker simulerte tjenester for brukergrensesnittet. Servertilgang testes separat med SQL-transaksjoner som rulles tilbake. GPS-nettlesertesten bruker simulerte koordinater. Dette er ikke testing på en fysisk telefon eller bekreftelse på levering av e-post. Se workflow-resultatet for hvilke tester som faktisk er bestått.

## Begrensninger

- GPS fungerer i forgrunnen og pauses når appen skjules eller skjermen låses. Ingen bakgrunnssporing. Ruten er et diagram uten kartlag, og avstand er omtrentlig.
- Familiedeling er ikke samtidig sanntidsredigering. Bruk Hent siste familieversjon når en annen enhet har gjort endringer. En familie kan ha inntil 12 medlemmer. Invitasjonskoder deles manuelt.
- Google/Microsoft-knapper vises bare dersom tilbyderne er konfigurert. E-postadresser hos disse kan brukes til kodeinnlogging uten OAuth.
- Tidligere lokale data beholdes for å unngå datatap, men den offentlige appen har ingen lokal inngang.
- Ingen generell AI-rådgivning, aktiv QR-ID, butikk eller individuelle helse-/kostråd.
- Dyrets alder er alder ved registrering og oppdateres manuelt. Illustrasjonene av Nika og Tyra er merkevareillustrasjoner, ikke brukerens profilbilder.

## Passord

Supabase Auth håndterer passord; appen lagrer dem ikke i dyredata, nettleserlagring eller logger. Opprettelse og endring bruker `updateUser` på den verifiserte kontoen, slik at konto-ID, dyr og medlemskap beholdes. Skjemaet krever minst 12 tegn og maksimalt 72 UTF-8-byte. Serverens gjeldende passordregler gjelder i tillegg.

«Opprett eller glemt passord» bekrefter eksisterende e-post med OTP og oppretter aldri en ny konto (`shouldCreateUser: false`). Førstegangsregistrering bruker en separat handling. Etter kodebekreftelse verifiserer appen økten på serveren før passordskjema og data åpnes. Vanlig passordinnlogging sender ingen kode. Hvis serveren krever ny bekreftelse ved passordendring, kan brukeren be om en bekreftelseskode fra skjemaet.

Passordtestene bruker en kontrollert Auth-tjeneste. De verifiserer flyt og SDK-kall, men endrer ikke virkelige brukeres passord og bekrefter ikke levering av e-post. Etter publisering må en bruker selv velge passord og bekrefte at påfølgende innlogging fungerer på sin konto.

## Support og administrasjon

Innloggede brukere har én privat supportsamtale. Administratoren har en separat innboks med svar, status og uleste meldinger. Meldinger hentes ved åpning, manuelt og hvert 20. sekund mens samtalen er synlig. Samtalen kan avsluttes og åpnes igjen med en ny melding. Tidligere meldinger kan hentes i sider på 50. Ingen e-postvarsler sendes av chatten.

`supabase/support-and-admin.sql` gir kontrollerte RPC-operasjoner for egne samtaler og den utpekte administratoren. Private tabeller har RLS, ingen direkte klienttilgang og ingen klientstyrte roller. Meldinger begrenses til 2000 tegn og 10 per minutt per avsender. En klient-ID hindrer duplikater ved ny sending etter nettverksfeil. SQL-testen bruker syntetiske brukere i en transaksjon som rulles tilbake. Nettlesertestene bruker simulerte tjenester; eldre migrasjonstester erstatter kontotjenesten bare inne i testnettleseren.
