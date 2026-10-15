# E-postinnlogging: teststatus

Appens kodefelt og validering er rettet til åtte siffer. Kontoflyten er tilgjengelig i kode via testparameteren `kontotest=1`; den vanlige forsiden er fortsatt lokal demo. Parameteren gir ingen kontotilgang uten en gyldig, bekreftet innlogging.

Enhetstester og nettlesertester av kandidaten er bestått. Kontotestene bruker en simulert innloggingstjeneste. Ekte e-postlevering, innlogging, lagring på konto og utlogging gjenstår å bekrefte.

Kandidaten er ikke publisert: nettleserøkten stoppet før filopplasting. Produksjonskontrollen avviste derfor forventet forskjell mellom de nye filene og den tidligere publiserte versjonen. Kontrollen skal kjøres igjen etter publisering. Ingen kontroll er slått av.
