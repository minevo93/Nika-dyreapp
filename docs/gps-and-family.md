# GPS og familiedeling

GPS er et aktivt valg etter at en tur er startet. Nettleseren ber om posisjonstillatelse. Nika lagrer inntil 2 000 punkter per tur og viser ruten som et diagram uten bakgrunnskart. Avstanden er omtrentlig. Punkter med dårlig nøyaktighet forkastes. Pauser, avbrudd og hull i signalet kobles ikke sammen som en sammenhengende rute.

GPS pauses når siden skjules, ved utlogging, bytte av dyr eller oversikt og ved lagringsfeil. Oppdatering av siden bevarer turen og tidligere punkter, men starter ikke GPS på nytt. Bakgrunnssporing med låst skjerm støttes ikke. Ruter kan slettes uten å slette turens varighet og hendelser. Posisjoner inngår i dataeksporten.

Familiedeling åpnes fra Min konto eller Familie. Ved opprettelse samtykker brukeren til å kopiere private dyreprofiler, bilder og historikk til en separat familieoversikt. Private data beholdes; senere endringer i de to oversiktene er uavhengige. Aktive turer må avsluttes før opprettelse. En konto kan være med i én familie med inntil 12 medlemmer.

Familieeieren lager en engangskode, gyldig i 24 timer, og deler den privat. Ingen e-post sendes automatisk. Koden lagres bare som en hash på serveren. En ny kode ugyldiggjør forrige kode. Vanlige medlemmer kan redigere familiens dyr og historikk, men bare eieren kan invitere, fjerne tilgang eller avslutte delingen. Familieeier er ikke det samme som appadministrator.

Velg Hent siste familieversjon før redigering fra en annen enhet. Oppdateringer bruker revisjonskontroll: konflikter og mistet tilgang stopper lagring, uten å overskrive nyere data. Eksporter ulagrede endringer før oppdatering av siden. Deling er ikke sanntidsredigering. Allerede nedlastede kopier kan ikke trekkes tilbake.

Slett dyredata gjelder privat oversikt. Den delte oversikten slettes ved at familieeieren velger Avslutt familiedeling og bekrefter. Medlemmer kan forlate familien.

Kjør `npm run build:account`, `npm run test:account`, `node tests/gps.cjs` og `node tests/family.cjs`. Nettlesertestene er `node tests/gps-browser.cjs` og `node tests/family-browser.cjs`, i tillegg til eksisterende tester. GPS-testen bruker nettleserens geolocation med simulerte koordinater, ikke en fysisk telefon. Familiegrensesnittet testes med simulert kontotjeneste. Serverens tilgangsregler testes separat med transaksjonen i `supabase/family-sharing-test.sql`, som rulles tilbake.

Publiser kun `public/`. Både `_headers` og `netlify.toml` tillater geolocation bare for samme nettsted. Ingen nye eksterne karttjenester er nødvendige.
