# Profilbilder og kontomeny

Profilbildet åpnes fra dyrets avatar eller profilside. Velg JPG, PNG eller WebP (maks 10 MB), juster utsnitt og velg **Lagre bilde**. **Fjern bildet** etterfulgt av **Lagre bilde** sletter bildet; **Avbryt** beholder det gamle. Navneendringer og bytte mellom dyr beholder riktig bilde.

Bildet tegnes på nytt som et kvadratisk WebP-bilde på inntil 320 piksler. Originalfil og metadata lagres ikke. Den komprimerte bildekopien lagres med dyreprofilen, privat på kontoen eller lokalt hvis lokal modus brukes. Eksport inkluderer bildet. Feil ved lagring vises; ikke lukk siden før ulagrede data er eksportert.

Kontoknappene er samlet med dyrevelgeren. **Min konto** viser kontorollen. Administratoren får en oversikt over antall kontoer og kontoer med lagrede data. Rollen gir ikke tilgang til andre brukeres dyreprofiler. Rollen bestemmes av databasen, ikke av e-posttekst i nettleseren eller brukerredigerbare metadata. Registeret har plass til én administrator, og kan ikke endres av appbrukere.

Kjør eksisterende kontotester og nettlesertesten `node tests/pet-photo.cjs`. SQL-testen `supabase/admin-access-test.sql` kontrollerer administrator, vanlig bruker, anonym tilgang og forsøk på rolleeskalering i en transaksjon som rulles tilbake.
