# piupiu

Send text, pictures or links using sound waves! (Chirp compatible)

## API

### PIUPIU API

**Constructor**

``var piupiu = new PIUPIU();``

**Shorten URL**

PIUPIU uses http://is.gd url shortener to allow more URL types in Chirp.io.

``piupiu.shortenURL("http://domain.tld", callback);``

_callback receives and object containing shorturl_

PIUPIU replaces https://is.gd/ with http://piupiu.ml/#

**Upload Image**

PIUPIU uses https://lut.im service to host images and send the URL to Chirp.io

``piupiu.uploadImage(form, callback)``

_form must have an input file named file_

_if browser does not support scripted form upload, a new window with the image is opened to be shared with extension_

### Chirp API

Chirps are saved locally (unique by URL) to avoid multiple creations and chirp.io service overloading

**Constructor**

``var chirp = new Chirp(); // initialize once``

**Create a new Chirp**

``chirp.create({title: "The title", url: "http://domain.tld"}, callback);``

**Play Chirp**

``chirp.data.longcode = 'abcdefghijklmnopqr'; chirp.play();``

_chirp.data.longcode is defined when using chirp.create with callback_

``chirp.create({title: "The title", url: "http://domain.tld"}, function(data) { chirp.play(); });``

