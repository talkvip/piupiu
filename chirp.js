/* chirp.js */

Chirp = function() {

  this.data = {};
  
  this.coder = new SonicCoder({
    alphabet: '0123456789abcdefghijklmnopqrstuv',
    freqMin: 1760.0,
    freqMax: 10500.0
  });
  
  this.coder.charToFreq = function(char) {
    var fundamental = this.freqMin;  
    var noteratio = 1.0594630943591;
    var index = this.alphabet.indexOf(char) - 1; // ignore startChar
    if(index == -1) { 
      // If this character isn't in the alphabet, error out.
      console.error(char, 'is an invalid character.');
      index = 0;
    }  
	  return fundamental * Math.pow(noteratio, index); 
	};
	
  this.socket = new SonicSocket({
    coder: {},
    charDuration: 0.0872,
    rampDuration: 0.008
  });  
  
  this.socket.coder = this.coder;
}

Chirp.prototype.create = function(data) {
  this.data = data;
}

Chirp.prototype.play = function() {
  this.socket.send(this.data.longcode);
}