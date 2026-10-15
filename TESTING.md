# Verifisering – Nika demo v2

## Gjeldende produksjon – referansebasert Nika-maskot

**Live:** https://nika-dyreapp.netlify.app/

- Deploy `6ad0a37f11d74bb82c0ff615`, **ready**, produksjon på eksisterende Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`. Publisert via Netlify Drop 15. oktober 2026 kl. 11:57 Oslo-tid. Ingen andre prosjekter eller innstillinger er endret.
- Publiserte webfiler: commit `0da67cbbca41f33957d44145a763c6051e990bb3`. Ny maskot brukes i registrering, banner og profilkort. WebP 930 × 1020, 292 560 byte, alfakanal kontrollert (min 0, maks 255). Originalfotoene er ikke publisert eller lagt i GitHub.
- Forhåndsvisning: **19/19** bestått før opplasting: [kjøring 38716487697](https://github.com/minevo93/Nika-dyreapp/actions/runs/38716487697).
- Offentlig produksjon: **20/20** bestått uten Netlify-innlogging: [kjøring 38716880801](https://github.com/minevo93/Nika-dyreapp/actions/runs/38716880801), testcommit `6c8aeb02371aa0e6b6defa0c3416645e30c4f15f`. Den ekstra kontrollen dekoder den nye WebP-filen og kontrollerer ressursnavn og bildestørrelse.
- Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions. Alle eksisterende funksjons-, lagrings-, dato-, fokus- og bevegelsestester kjørt på nytt. Layout ved 390, 768 og 1440 px. Ingen JavaScript-/konsollfeil eller manglende ressurser. Ingen fysisk telefon, Safari eller Firefox testet.
- Visuell gjennomgang av registrering og dashboard på desktop og mobilbredde. Den offentlige appen er også åpnet i Chrome, og riktig bilde er kontrollert som ferdig lastet med naturlig bredde 930 px.
- Første ZIP-opplasting viste en tilkoblingsfeil og ble ikke publisert. Ett nytt forsøk lyktes. Den tidligere produksjonen var tilgjengelig hele tiden. Netlify bekrefter nå det nye deployet som publisert og behandler sikkerhetsheaderne uten feil.
- Fortsatt lokal demo uten backend, generell AI, GPS, deling, aktiv QR-ID eller butikk. Ingen nye kjente funksjonsfeil innen testdekningen. Git-koblingen er fortsatt ikke aktiv; PR #1 står åpen og main er uendret.

Faktiske skjermbilder fra denne produksjonstesten:

| Skjerm | Desktop (1440 px) | Mobilbredde (390 px) |
| --- | --- | --- |
| Førstegangsopplevelse | [Registrering](docs/screenshots/reference-v2-live-onboarding-desktop.jpg) | [Registrering](docs/screenshots/reference-v2-live-onboarding-mobile.jpg) |
| Dashboard | [Dashboard](docs/screenshots/reference-v2-live-dashboard-desktop.jpg) | [Dashboard](docs/screenshots/reference-v2-live-dashboard-mobile.jpg) |

Mobilbildet av registrering viser også den fokuserte «Hopp til innhold»-lenken fra tastaturtesten. Dette er en bevisst tilgjengelighetstilstand, ikke et permanent overlegg.

## Tidligere offentlig produksjon – før referansebildene

**Live:** https://nika-dyreapp.netlify.app/

- Netlify Site ID: `8d14e785-89c3-412a-9fce-acbd2113e653`, kun prosjekt `nika-dyreapp` i team `minevo93`.
- Produksjonsdeploy: `6ad08a19fec92ad38a193f62`, status **ready**, publisert 15. oktober 2026 kl. 10:08 Oslo-tid via Netlify Drop.
- Publisert appkode og sikkerhetsregler: commit `618eba1485087c8cc596a327eb6f4f91ee22877c`, gren `feat/nika-demo-v2`. Senere commits gjelder tester, rapport og bilder. Alle fem offentlig serverte filene er i tillegg sammenlignet byte for byte med lokale kildefiler: identiske.
- **19/19 bestått mot den offentlige HTTPS-adressen**, i Chromium 151.0.7922.34 med Playwright 1.62.1 i isolerte nettleserkontekster uten Netlify-konto/cookies: [produksjonskjøring](https://github.com/minevo93/Nika-dyreapp/actions/runs/38703780099).
- Testet registrering, korrigering, profil, oppdatering, aktiv tur, hendelser/angre, korte/lengre turer, måltider, midnatt, familie, eksport, sletting, migrering, utilgjengelig/full/korrupt lagring, dobbelklikk, trygg tekst, tastaturfokus, redusert bevegelse og 390/768/1440 px.
- Ingen konsoll-/JavaScript-feil eller manglende appressurser under testene. Kun oppdiktede lokale testprofiler; ingen testdata lastes opp til appens statiske filer. Ingen fysisk telefon, Firefox eller Safari er testet.
- Netlify behandlet én headerregel uten feil; offentlig HTTP-respons bekrefter CSP, `nosniff`, Permissions-Policy, Referrer-Policy og rammebeskyttelse.
- Netlify General bekrefter riktig Site ID og offentlig produksjon. Developer settings bekrefter **Current repository: Not linked**. Automatisk Git-publisering er ikke konfigurert. PR #1 står åpen; tidligere stopp av merge til `main` er ikke omgått.
- Kun Nikas egen `public`-mappe ble lastet opp til Nikas eget Netlify-prosjekt. Ingen andre prosjekter, teaminnstillinger eller betalte tjenester er endret.

Faktiske skjermbilder fra produksjonstesten:

| Skjerm | Desktop (1440 px) | Mobilbredde (390 px) |
| --- | --- | --- |
| Førstegangsopplevelse | [Live onboarding](docs/screenshots/live-onboarding-desktop.jpg) | [Live onboarding](docs/screenshots/live-onboarding-mobile.jpg) |
| Dashboard | [Live dashboard](docs/screenshots/live-dashboard-desktop.jpg) | [Live dashboard](docs/screenshots/live-dashboard-mobile.jpg) |

Ingen kjente funksjonsfeil ble funnet innen testdekningen. Dette er fremdeles en lokal demo, ikke en backend-basert tjeneste; begrensningene er oppgitt i README og i appen.

## Ny kontroll: isolert direktepublisering

Commit `618eba1485087c8cc596a327eb6f4f91ee22877c` besto **19 av 19 testgrupper** i [denne GitHub Actions-kjøringen](https://github.com/minevo93/Nika-dyreapp/actions/runs/38702551606). Samme Chromium-versjon og bredder som under.

I tillegg til de 17 kontrollene nedenfor er følgende verifisert:

- Sikkerhetsheadere følger de statiske filene i `public/_headers`, slik at også direkte ZIP-publisering har CSP og `nosniff`. Testserveren bruker disse reglene under alle nettlesertestene.
- Dataeksport laster faktisk ned gyldig `nika-data.json` under samme CSP.

Nika-pakken inneholder kun `index.html`, `style.css`, `app.js`, `_headers` og de to SVG-filene i `assets/`. Den inneholder ingen testprofiler, andre prosjekter, dokumentasjon eller nøkler. På Netlify skal den bare lastes inn i `nika-dyreapp`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`. Ingen andre prosjekter eller teaminnstillinger skal endres.

Før publisering ble arbeidsøkten blokkert av Netlify-innlogging og tidsavbrudd i sikker innlogging. Brukeren fullførte deretter innloggingen i den overleverte nettleseren, og produksjonsdeployet og testen over ble fullført. Kontrollene i denne delen er fra før publisering.

## Tidligere kontroll og visuelle bevis

Kontrollert 15. oktober 2026. Appkode testet på commit `e127f7aaeb6888f03d9c39c2a01fe5364a4d6d9d`.

**17 av 17 testgrupper bestått.** [Vellykket GitHub Actions-kjøring](https://github.com/minevo93/Nika-dyreapp/actions/runs/38672391894).

## Faktisk testmiljø

- Chromium 151.0.7922.34, headless via Playwright 1.62.1, Ubuntu GitHub Actions-runner.
- Lokal HTTP-forhåndsvisning på testmaskinen, med isolerte nettleserkontekster og oppdiktede testdata. Ingen faktisk brukerprofil er publisert.
- Skjermbredder 390, 768 og 1440 CSS-piksler. Skjermbilder ved 390 og 1440.
- Europe/Oslo for datotester. Playwrights nettleserklokke brukes til å teste over midnatt og lengre turer; dette er kontrollert tid, ikke en virkelig to minutters gåtur.
- Ikke testet på fysisk telefon, Firefox eller Safari. Den lokale arbeidsmaskinens Chromium kunne ikke starte; selve nettlesertestene ble gjennomført på GitHub-runneren.

## Bestått dekning

1. Stegvis registrering, tomt svar, ugyldig alder, gjenopptakelse etter oppdatering, korrigering og eksplisitt bekreftelse før hunden opprettes.
2. Profilredigering, kjønn og lagring etter oppdatering.
3. Én aktiv tur over oppdatering, dobbelklikk, tidsfestet tissing/bæsjing, hendelsesantall, angre og varighet under ett minutt.
4. Manuelt navngitte favorittsteder.
5. Opprett/rediger/slett måltidsplan, gitt/angre, tidligere dato og bevart historikk etter sletting.
6. Opprett/rediger/fjern lokale familiemedlemmer og roller, med tydelig tekst om manglende invitasjon/deling.
7. Dashboard uten horisontal overflyt ved 390/768/1440. Synlige dashboardknapper minst 44 × 44 px.
8. Datasletting med bekreftelse og avbryt, og bevaring av en annen localStorage-nøkkel.
9. Onboarding uten horisontal overflyt ved 390/768/1440.
10. Redusert bevegelse og grunnleggende tastaturfokus. Native dialoger brukes for bekreftelser; ikke en full tilgjengelighetssertifisering.
11. Kombinert registrering og HTML-tekst som gjengis trygt uten å lage nye elementer.
12. Utilgjengelig localStorage: fungerende økt og synlig varsel.
13. Korrupt JSON: originalen beholdes og overskrives ikke.
14. Migrering fra v1 med profil, historiske antall, aktiv tur, måltidsplan, familie og bevart original. Udaterte «gitt»-flagg blir ikke dagens registreringer.
15. Faktisk passering av lokal midnatt i nettleserklokken, ny dags måltider, dobbelklikk på gitt og korrekt varighet rundt to minutter.
16. Full localStorage: varig feilmelding og aktiv tur i minnet.
17. Ingen JavaScript-feil, konsollfeil eller HTTP-feil fra appressurser under testene.

## Skjermbilder og visuell kontroll

Bildene er faktiske nettleserskjermbilder fra den vellykkede kjøringen, ikke designbilder. Animasjoner fullføres før opptak. Illustrasjonens proporsjoner er rettet etter første visuelle kontroll.

| Skjerm | Desktop (1440 px) | Mobilbredde (390 px) |
| --- | --- | --- |
| Førstegangsopplevelse | [Onboarding](docs/screenshots/onboarding-desktop.jpg) | [Onboarding](docs/screenshots/onboarding-mobile.jpg) |
| Dashboard | [Dashboard](docs/screenshots/dashboard-desktop.jpg) | [Dashboard](docs/screenshots/dashboard-mobile.jpg) |

## Historikk: tidligere publiseringsblokkering

Punktene nedenfor beskriver situasjonen før innloggingen ble fullført. De er erstattet av den verifiserte live-statusen øverst.

- Eksisterende Netlify-prosjekt: `nika-dyreapp`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`, team `minevo93`.
- Kun dette prosjektets besøkskontroll ble satt til offentlig med den tilkoblede Netlify-integrasjonen. Ingen andre prosjekter eller teaminnstillinger ble endret.
- `https://nika-dyreapp.netlify.app` returnerte **HTTP 404 / Not Found** ved kontroll. Ingen produksjonsdeploy eller deploy-ID er verifisert.
- Netlify-oppslaget returnerer ikke bygginnstillinger/Git-kobling og ga et tomt `currentDeploy`-objekt. Git-koblingen er derfor ikke bekreftet.
- Netlify-administrasjon åpnet en innloggingsside. Sikker innlogging via GitHub ble forsøkt, men ga ingen verifisert Netlify-økt; den etterfølgende nettleserkanalen fikk tidsavbrudd. Integrasjonen har prosjekt-/tilgangsoperasjoner, men ingen operasjon for å laste opp kode eller starte et deploy. Ingen token eller passord er lest fra lokale filer eller lagt i kode.
- Baseline-, Netlify-forhåndsvisning og produksjonsdeploy er dermed blokkert av manglende fungerende administrasjons-/publiseringstilgang i denne økten. Lokal nettleserforhåndsvisning på GitHub-runneren er testet; det er ikke en offentlig Netlify-test.
- Koden er klar med `publish = "public"` og ingen build-kommando. Neste nødvendige brukerhandling er å fullføre sikker Netlify-administrasjonsinnlogging for arbeidsøkten, slik at eksisterende Git-kobling og deploy kan kontrolleres og publisering utføres. Ikke opprett et nytt prosjekt.

Denne historiske blokkeringen er løst. Netlify-headere og den offentlige produksjonsflyten er nå testet som dokumentert øverst.
