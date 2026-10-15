# Nika – Dyreappen

En norsk, lokal webdemo for hundehverdagen. Vanlig HTML, CSS og JavaScript, uten rammeverk, byggesteg eller backend.

**Live og offentlig testet:** https://nika-dyreapp.netlify.app/

Produksjonsdeploy `6ad0ab11dac7f520701ace97` er `ready`, publisert 15. oktober 2026 kl. 12:29 Oslo-tid via Netlify Drop til det eksisterende Nika-prosjektet. Appnavnet er Nika; Nika og Tyra er ansiktene og historien bak. Hundene er flyttet foran chatten på stående mobil og står ved siden av den på korte, liggende skjermer. Profilkortet og brukerdataene er uendret. Alle 20 funksjonstestgruppene, ti skjermstørrelser og en rotasjonssekvens besto mot offentlig HTTPS uten Netlify-innlogging. Se [produksjonstesten](https://github.com/minevo93/Nika-dyreapp/actions/runs/38720783576) og [TESTING.md](TESTING.md).

## Kjør lokalt

```sh
python3 -m http.server 4173 --directory public
```

Åpne http://localhost:4173. Bruk HTTP-server, ikke `file://`.

## Innhold

- Appnavnet er fortsatt Nika. Nika og Tyra presenteres som to firbente bestevenninner og inspirasjonen bak appen. I stående mobilvisning kommer duoen før chatten; liggende mobil får et kompakt side-ved-side-oppsett.
- Chatstyrt registrering: navn, rase og alder i år/måneder, stegvis eller `Luna, golden retriever, 3 år`. Oppsummering og korrigering før lagring.
- Profilredigering og dashboard med faktiske tomtilstander.
- Én aktiv tur, løpende varighet, tidsfestet tissing/bæsjing, angre og historikk. Varighet lagres i millisekunder; korte turer vises i sekunder. Egne, manuelt navngitte favorittsteder.
- Daglig måltidsplan med opprett/rediger/slett. «Gitt nå» lagres som en separat datert hendelse og kan angres. Historikken bevares når planen slettes.
- Lokal familieliste med navn og rolle, uten invitasjoner eller synkronisering.
- Eksport og bekreftet sletting av bare Nika-data.

## Lagring og personvern

`nika-demo-v2` inneholder versjonert og validert struktur i localStorage. Eksisterende `nika-mvp-v1` migreres én gang når v2 mangler. Originalen beholdes urørt til brukeren uttrykkelig sletter Nika-data. Profil, turer, aktive turer, måltidsplan, familie og gammelt kontaktfelt bevares. Gamle turhendelser hadde ikke tidspunkt og vises som historiske antall. Gamle «gitt»-flagg hadde ingen dato og overføres derfor ikke til den daterte måltidshistorikken; brukeren varsles.

Korrupt struktur beholdes, skriving blokkeres og et varsel vises. Ved utilgjengelig/full localStorage virker demoen i minnet, med et vedvarende varsel om at oppdatering mister nye endringer. Eksport kan lagre øktdata. En annen fanes endringer blokkerer videre redigering og ber om oppdatering for å hindre overskriving. Alderen er alder ved registrering og oppdateres manuelt.

Ingen analyse, nettverks-API-er, eksterne fonter, posisjonsinnsamling eller hemmeligheter. Eksportfiler inneholder brukerens lokale data og må oppbevares privat. Ingen data er forhåndsutfylt i appen. Lokal lagring er ingen sikkerhetskopi.

## Netlify

Bruk eksisterende prosjekt `nika-dyreapp`, team `minevo93`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`. Repository: `minevo93/Nika-dyreapp`. Publiserte webfiler tilsvarer commit `e7b5f49ce0b520913a05712bcfe809a559959128` på `feat/nika-demo-v2`. Koden og dokumentasjonen er samlet i PR #1. `main` er ikke endret.

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
```

Testen starter en lokal server og kjører reelle nettleserinteraksjoner med Playwright. `NIKA_TEST_URL=https://... npm test` kan teste en Netlify-forhåndsvisning eller produksjon. Ikke bruk en URL med private data. Tester kjøres i isolerte nettleserkontekster med kun oppdiktede testdata.

GitHub Actions kjører funksjonstestene og en egen mobil-/rotasjonstest. `tests/responsive.cjs` dekker ti visningsstørrelser fra 320 × 568 til 1440 × 1000, inkludert 568 × 320 og 844 × 390 i liggende format. Den kontrollerer bildeplassering, historie, overflyt, berøringsflater, registrering og profil etter oppdatering. En egen sekvens kontrollerer fremdrift gjennom rotasjon og redusert høyde som med et åpent skjermtastatur. Dette er nettleseremulering, ikke en fysisk telefon eller et faktisk iOS-/Android-tastatur. Resultater og skjermbilder lagres som `nika-browser-evidence`. Dokumenter utførte resultater separat; konfigurerte tester er ikke i seg selv bevis på beståtte tester.

## Begrensninger

Ingen generell AI-chat, GPS/kart/ruter, brukerkontoer, database, enhetsdeling, aktiv QR-ID/finner-side, butikk, betaling eller individuelle helse-/kostråd. QR og butikk er skjult til de har fungerende arbeidsflyter. Nika-maskoten er en AI-generert illustrasjon basert på fire referansebilder brukeren har levert. Den er en merkevareillustrasjon, ikke et profilfoto av hver registrerte hund eller en interaktiv 3D-modell. Bare den avledede, optimaliserte WebP-filen publiseres; originalfotoene og bakgrunnene er ikke inkludert. Se [illustrasjonens kilde og prompt](docs/mascot-reference-v2.md). Den tidligere SVG-illustrasjonen er beholdt som en eldre ressurs.

Den hvite hunden er lagt til i en egen transparent [duoillustrasjon](docs/mascot-duo-v3.md), med samme stil som Nika. Tidligere illustrasjoner er bevart. Kun avledede illustrasjoner publiseres, aldri de brukerleverte originalfotoene. Designreferansefilen var ikke tilgjengelig under første implementering; den skriftlige retningen ble fulgt.

## Utført kvalitetssikring

Se [TESTING.md](TESTING.md) for 20 beståtte funksjonstestgrupper, ti skjermstørrelser og rotasjon mot offentlig produksjon, faktisk miljø og skjermbilder i stående, liggende og desktopformat. Ingen JavaScript-feil, konsollfeil eller manglende appressurser ble registrert i produksjonstesten. Ikke testet på fysisk telefon, Firefox eller Safari.
