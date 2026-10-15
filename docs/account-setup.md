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

## Det som blokkerer aktivering

Kontroll 15. oktober kl. 17 Oslo: Site URL er lagret som `https://nika-dyreapp.netlify.app/`. Google og Azure er fortsatt av. Google Cloud viste «Site Unavailable» i arbeidsnettleseren også etter én oppdatering. Microsoft Entra åpnet en reell innloggingsside; sikker eierinnlogging kreves for videre appregistrering. SMTP er ikke aktivert.

Eierens ønskede administratoradresse er kontrollert mot Auth Users, men har ennå ingen Nika-konto. Ingen administratorrolle er derfor tildelt. Rollen skal knyttes serverstyrt til en bekreftet Auth-bruker etter registrering, aldri gis gjennom frontend eller redigerbare brukermetadata. Alle øvrige brukere beholder vanlig tilgang. Dette gir ikke medlemskap eller administrasjon i Supabase-organisasjonen.

Supabase `/auth/v1/settings` bekreftet `google: false` og `azure: false` den 15. oktober 2026. Vi mangler Nika-spesifikke OAuth-appregistreringer og konfigurasjon hos leverandørene. Det finnes ingen tilgjengelig tilkoblet integrasjon for disse administrasjonsoppgavene. Ikke send klienthemmeligheter i chat eller legg dem i GitHub.

1. Google Cloud: registrer Nika, audience External, bare `openid`, `email`, `profile`, OAuth web client. JavaScript origin: `https://nika-dyreapp.netlify.app`. Callback: `https://irqcatqpllzzcktjnffq.supabase.co/auth/v1/callback`. Bruk klient-ID og hemmelighet bare i Supabase sin Google-provider. Fjern testbrukerbegrensningen før offentlig lansering, etter Googles krav.
2. Microsoft Entra: egen app Nika med **Personal Microsoft accounts** (Hotmail/Outlook/Live). Web callback som over. Supabase Azure Tenant URL: `https://login.microsoftonline.com/consumers`. Legg inn klient-ID/hemmelighet i Supabase Azure-provider, og noter hemmelighetens utløpsdato. Aktiver anbefalt `xms_edov` og `email` optional claims. Ikke bruk single-tenant organisasjonspålogging.
3. Supabase Site URL og tillatt returadresse: nøyaktig `https://nika-dyreapp.netlify.app/`. Ikke bruk wildcard til vilkårlige forhåndsvisninger. Behold e-postbekreftelse; e-post/passord er ikke en offentlig arbeidsflyt før SMTP er konfigurert.
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
