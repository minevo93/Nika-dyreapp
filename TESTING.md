# Verifisering – Nika demo v2

## Gjeldende produksjon – eget domene, 15. oktober 2026

- Hovedadresse: https://www.nikaappen.no/. Rotdomene og HTTP videresender til HTTPS på www (kontrollert med gyldig TLS).
- Deploy `6ad132cbc7be86312eea6201`: production, ready, publisert 22:08 Oslo. Webkode `8dd768fb5f6cc2a9f4d3e190da686cf22578deaf`, testcommit `84341e25a5bce2b198fae62b9753f60c3264e866`, gren `feat/nika-demo-v2`, PR #1.
- [Før publisering](https://github.com/minevo93/Nika-dyreapp/actions/runs/38799108234): success. [Offentlig test på www](https://github.com/minevo93/Nika-dyreapp/actions/runs/38799679494): success. SHA-256 bekrefter appfilene, inkludert kontobundle og illustrasjon.
- Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions uten Netlify-innlogging: 20 funksjonsgrupper, 17 registreringseksempler, 11 flerprofilgrupper, ti skjermstørrelser, rotasjon, tastatur og redusert bevegelse. Ingen konsollfeil eller manglende ressurser. Ikke fysisk telefon, Safari eller Firefox.
- Supabase Site URL og eksakt tillatt returadresse er `https://www.nikaappen.no/`, verifisert etter ny sidelasting. Tidligere eksakt Netlify-returadresse beholdes i overgangsperioden. Ingen wildcard lagt til.
- Appens OAuth-returadresse er oppdatert og simulert SDK-test bestått. Google/Microsoft er fortsatt deaktivert; ingen ekte OAuth-innlogging er testet. Google Cloud viste «Site Unavailable» i arbeidsnettleseren; Microsoft krever eierpålogging. GPS, reell familiedeling og administratorrollen gjenstår.
- Netlify-opplastingen lyktes etter ett nytt forsøk på en generisk forbindelsesfeil. Ingen andre prosjekter eller teaminnstillinger ble endret.

Bevis: [Supabase-innstillinger](docs/screenshots/domain-supabase-settings.jpg), [forside mobil](docs/screenshots/domain-live-orientation-onboarding-390x844.jpg), [dashboard mobil](docs/screenshots/domain-live-compact-dashboard-mobile.jpg).

## Tidligere produksjon – knapper, ikoner og fokus, 15. oktober 2026

- Deploy `6ad0eba9e31e68278e8adc63`, production, ready, publisert kl. 17:05 Oslo. Webkode `64e22133e39b5d5f756c5d0801a36a4467bd1024`, testcommit `de5d0d2c6622d671c27ce231acdb233d80b6c72e`, samme gren og PR.
- [Test før publisering](https://github.com/minevo93/Nika-dyreapp/actions/runs/38756161583): success. [Offentlig produksjonstest](https://github.com/minevo93/Nika-dyreapp/actions/runs/38757743940): success. SHA-256 bekrefter identiske publiserte webfiler.
- Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions uten Netlify-innlogging. Alle 20 funksjonsgrupper, 17 registreringseksempler, 11 flerprofilgrupper og ti skjermstørrelser besto. Ingen konsollfeil eller manglende ressurser. Ikke fysisk telefon, Safari eller Firefox.
- Nye kontroller bekrefter at profilavatar åpner profilsiden, tastaturfokus fortsatt er synlig og grønt, og navigasjon ikke tegner ramme rundt hele siden. Bunnmeny med ikon og tekst, minst 44 px knapper og redusert bevegelse er kontrollert.
- En første ekstra test forventet feilaktig en dialog ved profilknappen; den ble rettet til å kontrollere den faktiske profilsiden. Ingen appfeil ble skjult eller omgått.
- Første Netlify-opplasting viste forbindelsesfeil. Ett nytt forsøk lyktes. Ingen innstillinger eller andre prosjekter ble endret.
- Kontoer er fortsatt deaktivert. Google/Microsoft-registrering, faktisk familiedeling, GPS og administratorrollen er ikke ferdig levert.

Skjermbilder fra offentlig produksjon:

- [Forside mobil](docs/screenshots/controls-live-orientation-onboarding-390x844.jpg)
- [Dashboard mobil](docs/screenshots/controls-live-compact-dashboard-mobile.jpg)
- [Dashboard desktop](docs/screenshots/controls-live-compact-dashboard-desktop.jpg)
- [Utlogging mobil](docs/screenshots/controls-live-logout-dialog-mobile.jpg)

## Tidligere produksjon – kompakte tekstkort, profil og utlogging, 15. oktober 2026

- Live: https://nika-dyreapp.netlify.app/
- Deploy `6ad0d4085ad29accfc6fce24`, production, ready, publisert kl. 15:24 Oslo. Samme eksisterende Nika-prosjekt, ingen endring av andre prosjekter eller besøksrettigheter.
- Webkode: `5d050f213dffb7995fa7feb4d313174e06d6044f`, gren `feat/nika-demo-v2`, PR #1. Produksjonstestcommit: `bcd424ab53ba9e5ef85591cf67339fd5ccf345e1`.
- [Test før publisering](https://github.com/minevo93/Nika-dyreapp/actions/runs/38741981232): success. Alle eksisterende funksjons-, registrerings-, flerprofil-, responsive- og simulerte kontotester besto.
- [Offentlig produksjonstest](https://github.com/minevo93/Nika-dyreapp/actions/runs/38742589449): success. Publiserte filer matcher kildekoden med SHA-256. Funksjoner, registrering, flere dyr, ti skjermstørrelser og rotasjon besto uten konsollfeil eller manglende appressurser. Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions, uten Netlify-innlogging. Ikke testet på fysisk telefon eller i Safari/Firefox.
- Tekstkortene er forskjøvet rundt illustrasjonen uten å dekke ansiktene. Profilens fire opplysninger vises i to kolonner. Hverdagsikoner passer nå i sine 34 px kolonner med egen avstand til teksten. Handlingsknappene er fortsatt minst 44 px.
- Utloggingsdialogen har en kompakt overskrift og forklarer at lokal lagring beholdes, at dette ikke låser profilene, og at en eventuell tur fortsetter. Utlogging, oppdatering og gjenåpning ble testet uten datatap.
- Ingen endring av lagringsformat, backend eller innloggingsaktivering i denne utgivelsen.

Skjermbilder fra offentlig produksjon:

- [Tekstkort, stående mobil](docs/screenshots/compact-v7-live-orientation-onboarding-390x844.jpg)
- [Tekstkort, liggende mobil](docs/screenshots/compact-v7-live-orientation-onboarding-844x390.jpg)
- [Profil og hverdagsoversikt](docs/screenshots/compact-v7-live-compact-dashboard-mobile.jpg)
- [Utloggingsdialog](docs/screenshots/compact-v7-live-logout-dialog-mobile.jpg)

## Tidligere produksjon – mobiltekst og bunnmeny, 15. oktober 2026

- Live: https://nika-dyreapp.netlify.app/
- Deploy `6ad0c1cda037728230eda36a`, production, ready, publisert kl. 14:06 Oslo. Ingen besøksinnlogging/passord.
- Webkode: `ded09440b25c671bd4760d4eaf12ad3ed46f2e3e`, gren `feat/nika-demo-v2`, åpen PR #1.
- [Test før publisering](https://github.com/minevo93/Nika-dyreapp/actions/runs/38731961440): success.
- [Offentlig produksjonstest](https://github.com/minevo93/Nika-dyreapp/actions/runs/38732405926), commit `9e26c62993429578817ba75ef7d06998d6be8cb3`: success. Isolerte nettleserkontekster uten Netlify-innlogging.
- SHA-256-sammenligning bekrefter riktig publisert HTML, CSS, JavaScript, inaktiv kontobundle og duoillustrasjon.
- 20 eksisterende funksjonsgrupper, 11 grupper for flere dyr, 17 parsereksempler, ti skjermstørrelser og rotasjon besto. Ingen konsollfeil eller manglende appressurser.
- Nye kontroller: riktig tekstrekkefølge, maks to linjer per tekst, begge maskottekstkort synlige, fem menyvalg nederst på mobil, aktiv markering og minst 44 px trykkflater.
- Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions. 320×568, 390×844, 430×932, 568×320, 667×375, 844×390, 932×430, 768×1024, 1024×768 og 1440×1000. Ikke fysisk telefon, Safari eller Firefox.

| Visning | Skjermbilde fra offentlig produksjon |
| --- | --- |
| Førstegangsopplevelse, mobil | [Bilde](docs/screenshots/mobile-v6-live-orientation-onboarding-390x844.jpg) |
| Bunnmeny, stående mobil | [Bilde](docs/screenshots/mobile-v6-live-orientation-dashboard-390x844.jpg) |
| Bunnmeny, liggende mobil | [Bilde](docs/screenshots/mobile-v6-live-orientation-dashboard-844x390.jpg) |
| Førstegangsopplevelse, desktop | [Bilde](docs/screenshots/mobile-v6-live-onboarding-desktop.jpg) |
| Dashboard, desktop | [Bilde](docs/screenshots/mobile-v6-live-compact-dashboard-desktop.jpg) |

Kontoinnlogging er fortsatt deaktivert. Privat RLS-lagring er testet med to midlertidige identiteter i den faktiske Nika-databasen, med ROLLBACK; ingen testdata gjenstår. Sikkerhetskontrollen har ingen merknader. Syv kontotestgrupper og nettlesertest av kontoarbeidsflyten besto med simulert tjeneste. Ekte Google-/Microsoft-registrering og innlogging er ikke testet, og leverandørene er ikke aktivert. GPS og familiedeling gjenstår.

## Tidligere produksjon – setninger, flere dyr og kompakt oversikt

- Live: https://nika-dyreapp.netlify.app/
- Deploy `6ad0b102d458b47e45e85b74`, **ready**, publisert 15. oktober 2026 kl. 12:55 Oslo-tid. Samme eksisterende Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`, kun Nika-prosjektets egne webfiler. Ingen andre prosjekter, konto-/teaminnstillinger eller betalte tjenester endret.
- Publisert appkode: `a622736f91c3126ceafb9fd3304a3d8264f0a3d5`, gren `feat/nika-demo-v2`. Testcommit mot produksjon: `ce695fb0d65c4a19ff466cb7e0ec127c1821638d`. Senere rapport-/bildecommits endrer ikke webfilene. PR #1 er åpen og main uendret. Fortsatt manuelt publisert, ikke automatisk Git-deploy.
- Forhåndsvisning: [38723312583](https://github.com/minevo93/Nika-dyreapp/actions/runs/38723312583), bestått. Offentlig HTTPS uten Netlify-innlogging: [38723795476](https://github.com/minevo93/Nika-dyreapp/actions/runs/38723795476), **bestått**.
- Faktisk miljø: Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu GitHub Actions. 20 eksisterende og 11 nye nettlesertestgrupper, 17 parser-eksempler med ekstra ugyldig-/delvis-input-kontroller, ti visningsstørrelser og rotasjon bestått. Kun oppdiktede profiler i isolerte lokale nettleserkontekster, ikke publiserte testdata.
- Setninger uten komma, blant annet «Jessica schæfer tispe 2 år» og «Hunden min heter Luna og er en golden retriever på 3 år.», ga riktige navn, rase og alder. Også katt, kjønn, delvise svar, ukjent/blandet rase, flerdelte navn, desimaltall og år/måneder testet. Oppsummering kan redigeres før lagring. Dette er regelstyrt registrering, ikke generell AI-forståelse.
- Nye profiler holder turer, aktive turer, måltidsplan, gjennomførte måltider og favorittsteder atskilt. Familie er felles. Profilbytte, tredje dyr, artsredigering og oppdatering testet uten kryssendring. Aktiv tur på et inaktivt dyr fortsetter.
- Påbegynt ekstra registrering beholdes ved oppdatering, pause og gjenopptakelse. Eksisterende profil erstattes ikke før bekreftet tillegg.
- Lokal utlogging bekreftes, skjuler oversikten og beholdes ved oppdatering; gjenåpning virker uten passord og beholder data/pågående tur. Grensesnittet forklarer at dette ikke er sikker autentisering.
- Det samlede «Hverdagen deres»-kortet har fire kompakte rader med fungerende handlinger. Kontrollert på stående mobil, liggende mobil og desktop, med minst 44 px knapper. Fanekonflikt blokkerer videre handlinger også i nye profilkontroller.
- Eldre v2 oppgraderes først etter byte-for-byte lokal originalkopi. Profil, aktive turer og lister bevares. Feil ved kopiering/full lagring bevarer originalen og varsler mens appen virker i minnet. Korrupt inaktiv profil bevares og blokkerer skriving. To dyr og utlogging fungerer også i minnet ved utilgjengelig localStorage. Sletting fjerner alle tre Nika-nøkler, men beholder uvedkommende lagring.
- Eksisterende funksjoner testet på nytt: profilredigering, oppdatering, turhendelser/angre, dobbelklikk, korrekt kort turvarighet, måltidsplan/registrering/angre/datoovergang, familie, favoritter, eksport, v1-migrering, korrupt/full/utilgjengelig lagring, trygg tekst, tastaturfokus, redusert bevegelse og sikkerhetsheadere.
- Visningsstørrelser: 320×568, 390×844, 430×932, 568×320, 667×375, 844×390, 932×430, 768×1024, 1024×768 og 1440×1000 CSS-piksler. Ingen horisontal overflyt. Rotasjon og 390×360 simulert tastaturhøyde bevarer fremdrift og ikke-innsendt tekst. Nika og Tyra står fortsatt høyt, før chatten i stående format og ved siden av i kort liggende format.
- Ingen registrerte JavaScript-/konsollfeil eller manglende appressurser. Ingen nye kjente funksjonsfeil innen testdekningen. Ikke fysisk telefon, Safari eller Firefox; tastaturhøyde og mobil er emulert.
- Begrensninger: ingen ekte konto, sikker utlogging, backend, deling, GPS, generell AI, aktiv QR-ID eller butikk. Registrering kan korrigeres manuelt; parseren garanterer ikke vilkårlige setninger. Individuell profilsletting er ikke implementert; sletting gjelder alle Nika-data.

Produksjonsskjermbilder (oppdiktet lokal testprofil):

| Visning | Mobil | Liggende mobil | Desktop |
| --- | --- | --- | --- |
| Førstegangsopplevelse | [Registrering](docs/screenshots/multi-v5-live-onboarding-mobile.jpg) | Se forrige mobilplasseringskontroll nedenfor | [Registrering](docs/screenshots/multi-v5-live-onboarding-desktop.jpg) |
| Samlet oversikt | [Dashboard](docs/screenshots/multi-v5-live-compact-dashboard-mobile.jpg) | [Dashboard](docs/screenshots/multi-v5-live-compact-dashboard-landscape.jpg) | [Dashboard](docs/screenshots/multi-v5-live-compact-dashboard-desktop.jpg) |

[Setningsoppsummering](docs/screenshots/multi-v5-live-sentence-summary-mobile.jpg) · [Mine dyr](docs/screenshots/multi-v5-live-pet-switcher-mobile.jpg) · [Lokal utlogging](docs/screenshots/multi-v5-live-local-logout-mobile.jpg)

## Tidligere produksjon – mobilplassering og Nika og Tyra

- Live: https://nika-dyreapp.netlify.app/
- Deploy `6ad0ab11dac7f520701ace97`, **ready**, publisert 15. oktober 2026 kl. 12:29 Oslo-tid. Eksisterende Site ID `8d14e785-89c3-412a-9fce-acbd2113e653`, kun Nika-prosjektet. Ingen nye prosjekter, kontoendringer eller betalte tjenester.
- Publiserte webfiler: `e7b5f49ce0b520913a05712bcfe809a559959128`, gren `feat/nika-demo-v2`. Appnavn fortsatt Nika. Ny tekst: «Møt Nika og Tyra», «To firbente bestevenninner» og «Inspirasjonen bak Nika». Historien finnes også under «Om demoen og dine data».
- Stående mobil: bilde og historie før chatten, kompakt overskrift og ingen overliggende kort som dekker hundene. Liggende mobil: bilde til venstre, chat til høyre. Innhold kan scrolles naturlig; ingen fastlåst sidehøyde. Minst 540 px bredde kreves for liggende-oppsettet, slik at et åpent tastatur på en smal, stående skjerm ikke bytter oppsett.
- Forhåndstest: [38720521089](https://github.com/minevo93/Nika-dyreapp/actions/runs/38720521089), **20 funksjonstestgrupper + ti visningsstørrelser + rotasjon bestått**.
- Offentlig produksjon uten Netlify-innlogging: [38720783576](https://github.com/minevo93/Nika-dyreapp/actions/runs/38720783576), samme dekning bestått. Testcommit `97b10fc12d0a893ce940eda3fa546122826f76b4`.
- Chromium 151.0.7922.34 / Playwright 1.62.1, Ubuntu GitHub Actions. Registrering, turer, måltider, familie, eksport, sletting, migrering, lagringsfeil, datooverganger, dobbelklikk, tastaturfokus og redusert bevegelse testet på nytt. Ingen JavaScript-/konsollfeil eller manglende ressurser. Testdata finnes bare i isolerte nettleserkontekster.
- Faktiske visningsstørrelser: 320×568, 390×844, 430×932, 568×320, 667×375, 844×390, 932×430, 768×1024, 1024×768 og 1440×1000 CSS-piksler. Ingen horisontal overflyt. Synlige registreringsknapper minst 44×44 px. Registrering og dashboard virker og beholder profil etter oppdatering i alle ti formatene.
- Rotasjonstest: stegvis navn, bytte til liggende, skrive rase, redusere til 390×360 (simulert tastaturhøyde), tilbake til stående, alder og bekreftelse i liggende. Ingen tap av lagret fremdrift eller ikke-innsendt tekst ved størrelsesendring.
- Målt i produksjon: ved 390×844 ligger bildefeltet fra y=254 til y=464, og chatten starter ved y=551. Ved 844×390 ligger bildefeltet fra y=160 til y=336, ved siden av chatten. Begge hundene er dermed synlige i første skjermbilde i de testede mobilformatene.
- Visuell kontroll av stående/liggende registrering og dashboard, samt desktop. Offentlig side åpnet også i Chrome. Målinger tas etter innlastingsanimasjon; desktop har en tilsiktet 0,5° vinkel på chatten, med 4 px geometrisk toleranse i testen.
- Mobil er nettleseremulering, ikke fysisk telefon. Tastaturhøyde er simulert, ikke en faktisk iOS-/Android-tastaturtest. Safari og Firefox er ikke testet. Ingen nye kjente funksjonsfeil innen dekningen.
- Dataformat, lokale brukerdata og originale hundefoto er urørt. Fortsatt lokal demo og manuell publisering; PR #1 er åpen og main uendret.

| Skjerm | Stående mobil 390×844 | Liggende mobil 844×390 | Desktop 1440×1000 |
| --- | --- | --- | --- |
| Registrering | [Skjermbilde](docs/screenshots/layout-v4-live-orientation-onboarding-390x844.jpg) | [Skjermbilde](docs/screenshots/layout-v4-live-orientation-onboarding-844x390.jpg) | [Skjermbilde](docs/screenshots/layout-v4-live-onboarding-desktop.jpg) |
| Dashboard | [Skjermbilde](docs/screenshots/layout-v4-live-orientation-dashboard-390x844.jpg) | [Skjermbilde](docs/screenshots/layout-v4-live-orientation-dashboard-844x390.jpg) | [Skjermbilde](docs/screenshots/layout-v4-live-dashboard-desktop.jpg) |


## Tidligere produksjon – Nika og den hvite hunden

- Live: https://nika-dyreapp.netlify.app/
- Deploy `6ad0a678d17c33ffa3e78a71`, **ready**, publisert 15. oktober 2026 kl. 12:10 Oslo-tid. Samme eksisterende Nika-prosjekt og Site ID; ingen endringer i andre prosjekter eller innstillinger.
- Publiserte webfiler: `318dc798ad1db2e6a2604c76b261dafb77571be2`. Duoen er brukerens godkjente illustrasjon, med den hvite hunden ved siden av Nika. Brukes i registrering og dashboardbanner; profilkortet og lokale profiler endres ikke. Originalfotoene er ikke publisert.
- Optimalisert WebP: 930 × 1020, 228 384 byte, ekte alfa kontrollert fra 0 til 255. Merker rundt hundene er flyttet for å holde ansiktene synlige. Mobilbanneret viser begge hundene uten å klippe ansiktene.
- Forhåndstest **20/20**: [38718149835](https://github.com/minevo93/Nika-dyreapp/actions/runs/38718149835).
- Offentlig produksjon **20/20**: [38718441471](https://github.com/minevo93/Nika-dyreapp/actions/runs/38718441471), testcommit `9d9fee54e70cc45d586826b8fe803aba1b723b77`. Tester krever duoressursen i registrering og banner, og fortsatt enkeltillustrasjon på profilkortet.
- Chromium 151.0.7922.34 / Playwright 1.62.1 på Ubuntu-runner, isolerte kontekster uten Netlify-innlogging. Hele funksjons- og lagringstesten kjørt på nytt, med layout 390/768/1440, tastaturfokus og redusert bevegelse. Ingen konsoll-/JavaScript-feil eller manglende ressurser. Ikke fysisk telefon, Safari eller Firefox.
- Offentlig app også åpnet i Chrome, begge hundene visuelt bekreftet ferdig lastet. Ingen nye kjente funksjonsfeil innen testdekningen. Fortsatt lokal demo, manuell Netlify-publisering, PR #1 åpen og main uendret.

| Skjerm | Desktop | Mobilbredde |
| --- | --- | --- |
| Registrering | [1440 px](docs/screenshots/duo-v3-live-onboarding-desktop.jpg) | [390 px](docs/screenshots/duo-v3-live-onboarding-mobile.jpg) |
| Dashboard | [1440 px](docs/screenshots/duo-v3-live-dashboard-desktop.jpg) | [390 px](docs/screenshots/duo-v3-live-dashboard-mobile.jpg) |


## Tidligere produksjon – referansebasert Nika-maskot

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
