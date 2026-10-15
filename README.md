# Nika – Dyreappen

En norsk, lokal webdemo for hundehverdagen. Vanlig HTML, CSS og JavaScript, uten rammeverk, byggesteg eller backend.

**Live og offentlig testet:** https://nika-dyreapp.netlify.app/

Produksjonsdeploy `6ad08a19fec92ad38a193f62` er `ready`, publisert 15. oktober 2026 via Netlify Drop til det eksisterende Nika-prosjektet. Alle 19 testgruppene besto mot HTTPS-adressen i en ren Chromium-nettleser uten Netlify-innlogging. Se [produksjonstesten](https://github.com/minevo93/Nika-dyreapp/actions/runs/38703780099) og [TESTING.md](TESTING.md).

## Kjør lokalt

```sh
python3 -m http.server 4173 --directory public
```

Åpne http://localhost:4173. Bruk HTTP-server, ikke `file://`.

## Innhold

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

Bruk eksisterende prosjekt `nika-dyreapp`, team `minevo93`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`. Repository: `minevo93/Nika-dyreapp`. Publisert appkode og `_headers` tilsvarer commit `618eba1485087c8cc596a327eb6f4f91ee22877c` på `feat/nika-demo-v2`. Koden og dokumentasjonen er samlet i PR #1. `main` er ikke endret.

Netlifys Developer settings er kontrollert og viser **Current repository: Not linked**. Dette er derfor et manuelt produksjonsdeploy, ikke automatisk Git-publisering. Ingen konto- eller repository-tilgang er utvidet for å koble Git. Før en eventuell senere Git-kobling med produksjonsgren `main` må den ferdige koden merges med nødvendig godkjenning, slik at en eldre main-versjon ikke erstatter demoen.

`netlify.toml` publiserer **public/**, uten build-kommando. Bare appfilene og Netlifys `_headers`-fil inngår; dokumentasjon, tester, node_modules og testbevis ligger utenfor. `.netlify/` ignoreres og skal ikke committes. `_headers` sikrer at også direkte ZIP-publisering får sikkerhetsheaderne, uten et Git-bygg.

Forhåndsvisning via PR/Netlify Git-kobling, eller `netlify deploy --site 8d14e785-89c3-412a-9fce-acbd2113e653 --dir public`. Produksjon etter bestått test: Git-deploy fra main, eller samme CLI med `--prod`. En senere Git-deploy fra main erstatter et manuelt produksjonsdeploy. Ikke endre andre prosjekter eller teamets innstillinger.

Sikkerhetsheadere inkluderer CSP, blokkering av geolokasjon/kamera/mikrofon og rammeinnbygging. En vellykket deploy må i tillegg kontrolleres i en nettleser uten Netlify-økt; HTTP 200 alene er ikke tilstrekkelig.

## Tester

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

Testen starter en lokal server og kjører reelle nettleserinteraksjoner med Playwright. `NIKA_TEST_URL=https://... npm test` kan teste en Netlify-forhåndsvisning eller produksjon. Ikke bruk en URL med private data. Tester kjøres i isolerte nettleserkontekster med kun oppdiktede testdata.

GitHub Actions kjører samme test. Resultater og skjermbilder ved 390 og 1440 px lagres som `nika-browser-evidence`; layout kontrolleres også ved 768 px. Mobilbredde er nettleseremulering, ikke en fysisk telefon. Se `tests/e2e.cjs` for faktisk testdekning. Dokumenter utførte resultater separat; konfigurerte tester er ikke i seg selv bevis på beståtte tester.

## Begrensninger

Ingen generell AI-chat, GPS/kart/ruter, brukerkontoer, database, enhetsdeling, aktiv QR-ID/finner-side, butikk, betaling eller individuelle helse-/kostråd. QR og butikk er skjult til de har fungerende arbeidsflyter. Profilbildet er en original SVG-illustrasjon laget til prosjektet, ikke en modell av brukerens faktiske hund. Alle illustrasjoner og ikoner i public/assets er laget for Nika og kan brukes med prosjektet.

Designreferansefilen var ikke tilgjengelig i arbeidsmiljøet under implementeringen; den skriftlige retningen er fulgt. Nettleser- og publiseringsstatus må fremgå av leveransen.

## Utført kvalitetssikring

Se [TESTING.md](TESTING.md) for 19 beståtte nettlesertestgrupper mot offentlig produksjon, faktisk miljø og mobil-/desktopskjermbilder. Ingen JavaScript-feil, konsollfeil eller manglende appressurser ble registrert i produksjonstesten. Ikke testet på fysisk telefon, Firefox eller Safari.
