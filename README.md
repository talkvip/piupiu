# piupiu

Send text, pictures or links using sound waves! (Chirp compatible)

## API

### PIUPIU API



### Chirp API

Chirps are saved locally (unique by URL) to avoid multiple creations and chirp.io service overloading

*Constructor*

``var chirp = new Chirp(); // initialize once``

*Create a new Chirp*

``chirp.create({title: "The title", url: "http://domain.tld"}, callback);``

*Play Chirp*

``chirp.data.longcode = 'abcdefghijklmnopqr'; chirp.play();``

_chirp.data.longcode is defined when using chirp.create with callback_



