# Verifisering – Nika demo v2

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

## Publiseringsstatus og reell blokkering

- Eksisterende Netlify-prosjekt: `nika-dyreapp`, Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`, team `minevo93`.
- Kun dette prosjektets besøkskontroll ble satt til offentlig med den tilkoblede Netlify-integrasjonen. Ingen andre prosjekter eller teaminnstillinger ble endret.
- `https://nika-dyreapp.netlify.app` returnerte **HTTP 404 / Not Found** ved kontroll. Ingen produksjonsdeploy eller deploy-ID er verifisert.
- Netlify-oppslaget returnerer ikke bygginnstillinger/Git-kobling og ga et tomt `currentDeploy`-objekt. Git-koblingen er derfor ikke bekreftet.
- Netlify-administrasjon åpnet en innloggingsside. Sikker innlogging via GitHub ble forsøkt, men ga ingen verifisert Netlify-økt; den etterfølgende nettleserkanalen fikk tidsavbrudd. Integrasjonen har prosjekt-/tilgangsoperasjoner, men ingen operasjon for å laste opp kode eller starte et deploy. Ingen token eller passord er lest fra lokale filer eller lagt i kode.
- Baseline-, Netlify-forhåndsvisning og produksjonsdeploy er dermed blokkert av manglende fungerende administrasjons-/publiseringstilgang i denne økten. Lokal nettleserforhåndsvisning på GitHub-runneren er testet; det er ikke en offentlig Netlify-test.
- Koden er klar med `publish = "public"` og ingen build-kommando. Neste nødvendige brukerhandling er å fullføre sikker Netlify-administrasjonsinnlogging for arbeidsøkten, slik at eksisterende Git-kobling og deploy kan kontrolleres og publisering utføres. Ikke opprett et nytt prosjekt.

Denne statusen er ikke en bekreftelse på publisering. Netlify-headere og offentlig produksjonsflyt er ikke nettlesertestet før et reelt deploy finnes.
