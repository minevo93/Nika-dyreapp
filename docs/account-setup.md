# Kontoer: status og aktivering

Arbeidsgren `feat/nika-demo-v2`. **Ikke aktivert eller publisert med ekte innlogging ennå.**

## Klargjort

- Separat Supabase-organisasjon Nika (`rzbvzvjomulcomvaizwu`), prosjekt `irqcatqpllzzcktjnffq`, Stockholm, gratisplan.
- `public.nika_user_state`: privat tilstand per autentisert bruker, 2 MB grense. RLS på alle operasjoner, eierskap låst, revisjonssjekk for samtidige endringer. Ingen administratorrolle eller organisasjonsmedlemskap for appbrukere.
- Tilgangstest i faktisk database med to midlertidige identiteter: egen lesing/skriving tillatt; fremmed lesing/oppdatering/sletting, eierskifte og anonyme forespørsler avvist. Falsk admin-verdi i brukerens metadata gir ingen ekstra tilgang. Hele testen avsluttes med ROLLBACK.
- Google og Microsoft (`azure`) via Supabase SDK 2.117.3, PKCE. Microsoft ber bare om identitets-/e-postopplysninger, ikke innboks eller kontakter.
- Innlogging, utlogging til forsiden, isolerte kontodata, synlige lagringsfeil, eksport og sletting av dyredata. Gamle lokale demodata lastes ikke opp automatisk.
- Syv testgrupper for kontokoden med simulert SDK. Dette beviser ikke at ekte Google-/Microsoft-innlogging virker.
- Nettlesertest av kontoarbeidsflyt med simulert tjeneste besto i Chromium via [GitHub Actions](https://github.com/minevo93/Nika-dyreapp/actions/runs/38730846008): kontodyr atskilt fra lokale dyr, profilredigering/oppdatering, ærlig familietekst, Microsoft-valg og utlogging til forsiden. De eksisterende funksjons- og layouttestene besto også. Ingen ekte OAuth-pålogging er testet.
- Supabase sikkerhetskontroll etter migreringene: ingen merknader. Plattformens automatiske RLS-trigger hadde offentlige EXECUTE-rettigheter; disse er fjernet kun i Nika-prosjektet. Selve triggeren forblir aktiv.

## E-postkode via Resend – under klargjøring

Brukeren har bekreftet at **support.nika@miveno.no** er en fungerende kundesupportadresse. Adressen er lagt inn som kontaktlenke. Domenet er `miveno.no` (ikke antatt eller korrigert til et annet navn).

- `requestEmailCode` / `verifyEmailCode` bruker Supabase Auth. Ny bruker opprettes ved verifisert e-postkode, uten administratorrettigheter. Sekssifret kode beholdes ikke i lokal lagring eller logger. Kontoidentiteten kontrolleres med `getUser` før dyredata åpnes.
- E-postinnlogging har egen `emailEnabled: false`-bryter og overordnet `enabled: false`. Ingen reell sending eller innlogging er aktivert. Aktiver først etter SMTP-/leveringstest og verifisering av kontoseparasjon.
- Resend krever eierpålogging. Domenestatus/DNS er ennå ikke kontrollert. Legg til kun Resends faktiske SPF/DKIM-poster for sending. Ikke erstatt eksisterende MX-poster for supportinnboksen. Ingen receiving-oppsett er nødvendig.
- Bruk egen Nika-konfigurasjon/nøkkel med bare nødvendig sendingstilgang. Hemmelig nøkkel skal bare legges i Supabase Custom SMTP, aldri i kildekode eller chat. Sett avsendernavn `Nika` og avsender `support.nika@miveno.no` først når domenet er verifisert.
- Supabase-maler for både **Confirm signup** og **Magic Link** må inneholde `{{ .Token }}`. Ferdig norsk mal ligger i `supabase/templates/email-code.html`. Bekreft seks sifre og kort utløpstid i Supabase. Behold e-postbekreftelse og serverens rate limits; frontend har i tillegg ett minutts ventetid og dobbelklikkvern.
- Test ekte registrering, ny innlogging, feil/utløpt kode, ny kode, utlogging og at en annen konto ikke får dyredata. Ingen e-post er sendt som del av kodeforberedelsen.

## Eget domene

Hovedadresse: `https://www.nikaappen.no/`. Netlify videresender rotdomenet dit, og HTTPS svarer. Appens faste OAuth-returadresse er oppdatert til samme URL. Supabase Site URL og eksakt Redirect URL er satt til denne adressen; den tidligere Netlify-returadressen beholdes under overgangen. Ingen wildcard er lagt til.

Google JavaScript origin endres til `https://www.nikaappen.no`. Leverandørenes OAuth callback skal fortsatt være `https://irqcatqpllzzcktjnffq.supabase.co/auth/v1/callback`; den skal ikke erstattes med nettsidens adresse. Provider-aktivering og reelle innloggingstester gjenstår.

Lokale demodata er knyttet til nettadressen i nettleseren. Data fra den gamle Netlify-adressen vises ikke automatisk på det nye domenet. Ingen gamle data er slettet eller lastet opp.

## Det som blokkerer aktivering

Kontroll 15. oktober kl. 22:30 Oslo: Site URL er `https://www.nikaappen.no/`. Google og Azure er fortsatt av. Google Cloud viste «Site Unavailable». Microsoft-kontoen er innlogget, men Entra avviser tilgang til organisasjonen Microsoft Services. SMTP er ikke aktivert. E-postkode via Resend klargjøres som alternativ.

Eierens ønskede administratoradresse er kontrollert mot Auth Users, men har ennå ingen Nika-konto. Ingen administratorrolle er derfor tildelt. Rollen skal knyttes serverstyrt til en bekreftet Auth-bruker etter registrering, aldri gis gjennom frontend eller redigerbare brukermetadata. Alle øvrige brukere beholder vanlig tilgang. Dette gir ikke medlemskap eller administrasjon i Supabase-organisasjonen.

Supabase `/auth/v1/settings` bekreftet `google: false` og `azure: false` den 15. oktober 2026. Vi mangler Nika-spesifikke OAuth-appregistreringer og konfigurasjon hos leverandørene. Det finnes ingen tilgjengelig tilkoblet integrasjon for disse administrasjonsoppgavene. Ikke send klienthemmeligheter i chat eller legg dem i GitHub.

1. Google Cloud: registrer Nika, audience External, bare `openid`, `email`, `profile`, OAuth web client. JavaScript origin: `https://www.nikaappen.no`. Callback: `https://irqcatqpllzzcktjnffq.supabase.co/auth/v1/callback`. Bruk klient-ID og hemmelighet bare i Supabase sin Google-provider. Fjern testbrukerbegrensningen før offentlig lansering, etter Googles krav.
2. Microsoft Entra: egen app Nika med **Personal Microsoft accounts** (Hotmail/Outlook/Live). Web callback som over. Supabase Azure Tenant URL: `https://login.microsoftonline.com/consumers`. Legg inn klient-ID/hemmelighet i Supabase Azure-provider, og noter hemmelighetens utløpsdato. Aktiver anbefalt `xms_edov` og `email` optional claims. Ikke bruk single-tenant organisasjonspålogging.
3. Supabase Site URL og tillatt returadresse: nøyaktig `https://www.nikaappen.no/`. Ikke bruk wildcard til vilkårlige forhåndsvisninger. Behold e-postbekreftelse; e-post/passord er ikke en offentlig arbeidsflyt før SMTP er konfigurert.
4. Test reell registrering med én Google-konto og én personlig Microsoft-konto, avbrutt samtykke, oppdatering, separate data, utlogging og tilbakeknapp. Hver bruker skal bare være i Auth Users, aldri i Supabase-organisasjonens team.
5. Sett `enabled: true` i `src/account.js`, bygg, test i forhåndsvisning, og publiser til eksisterende Netlify Site ID. Endre aldri flagget for å omgå manglende leverandøroppsett.

## Bygg og avgrensning

`npm ci && npm run build:account && npm run test:account`. Den genererte `public/account.bundle.js` committes, så Netlify kan fortsatt publisere `public/` uten byggesteg. SDK-avhengigheter og esbuild er låst med package-lock. Nettleseren kontakter bare Nika sitt Supabase-prosjekt når kontodelen er aktivert.

GPS og faktisk familiedeling gjenstår. Familielisten er foreløpig kun en privat navneliste, også i kontomodus, og gir ingen tilgang. Kontodata har eksport og sletting av dyredata; sletting av selve Auth-kontoen gjenstår. Ingen ekstern sikkerhetskopi loves. Feil ved samtidig redigering blokkerer nye endringer og ber brukeren eksportere før oppdatering, fremfor å overskrive en annen enhet.

CLI-opprettelsen av en migreringsfil ble stoppet av automatisk sikkerhetskontroll på grunn av mulig ekstern telemetri. Filen var opprettet, og SQL ble deretter anvendt gjennom den godkjente Supabase-integrasjonen. Ingen videre CLI-kjøring er nødvendig.

Kilder kontrollert 15. oktober 2026:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-azure
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated (krever moderne TLS fra november; nettleser-SDK bruker nettleserens TLS)
