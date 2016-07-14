/* chirp.js */

Chirp = function() {
  this.data = {};
}

Chirp.prototype.create = function(data) {
  this.data = data;
  this.coder = new SonicCoder({
    alphabet: '0123456789abcdefghijklmnopqrstuv',
    freqMin: 1760,
    freqMax: 10500,
    startChar: '',
    endChar: ''
  });
}

Chirp.prototype.play = function() {
  ssocket = new SonicSocket({
    coder: this.coder,
    charDuration: 0.0872
  });
  ssocket.send(this.data.longcode);  
}