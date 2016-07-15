/* chirp.js */

var Chirps = {};

function Chirp_getResponse(data) {
  if(typeof data != 'object') data = {};
  if('callback' in data) var fn = window[data.callback];       
  if('error' in data) {
    console.log(data.error.msg);
    if(typeof fn == 'function') fn(data);
    return;
  }
  if(('title' in data) && ('url' in data)) {
    if('longcode' in data) window.localStorage.setItem('$chirp-' + data.longcode, JSON.stringify(data));
    var chirp = Chirps[data.url];
    chirp.data = data;
    data.obj = chirp;
    console.log(chirp);
    console.log(data);
    if(typeof fn == 'function') fn(data);
  }
}

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
    if(index == -1 && char != this.startChar) { 
      // If this character isn't in the alphabet, error out.
      console.error(char, 'is an invalid character.');
      return 0;
    }  
	  return fundamental * Math.pow(noteratio, index); 
	};
	
  this.socket = new SonicSocket({
    coder: {},
    charDuration: 0.0872,
    rampDuration: 0.008
  });  
  
  this.socket.coder = this.coder;
    
  this.socket.scheduleToneAt = function(freq, startTime, duration) {
    var gainNode = audioContext.createGain();

    // Gain => Merger
    gainNode.gain.value = 0;

    gainNode.gain.setValueAtTime(0.0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + this.rampDuration);
    gainNode.gain.setValueAtTime(0.15, startTime + duration - this.rampDuration);
    gainNode.gain.linearRampToValueAtTime(0.0, startTime + duration);
    
    gainNode.connect(audioContext.destination);

    var osc = audioContext.createOscillator();
    osc.frequency.value = freq;
    osc.connect(gainNode);

    if (this.onsend && typeof this.onsend == "function")
      osc.onended = this.onsend;

    osc.start(startTime);
    osc.stop(startTime+duration);
  };
}

Chirp.prototype.create = function(data, callback) {
  if(typeof data != 'object') data = {};
  console.log(data);
  var fn = window[callback];   
  if(('title' in data) && ('url' in data)) {
    if(data.url in Chirps) {
      if('data' in Chirps[data.url]) {
        if('longcode' in Chirps[data.url].data) {
          if(typeof fn == 'function') fn(Chirps[data.url].data);
          return;
        }
      }
    }
    this.data = data;
    Chirps[data.url] = this;
    data.callback = callback;
    console.log(data);
    var script = 'http://piupiu.ml/chirp.php?data=' + encodeURIComponent(JSON.stringify(data)) + '&callback=Chirp_getResponse';
    console.log(script);
    var jsonp = loadScript(script);
    setTimeout(function() { unloadScript(jsonp); }, 5000);
  } else {
    if(typeof fn == 'function') fn({err: 'Missing required argument title/url'});
  }
}

Chirp.prototype.play = function() {
  this.socket.send('hj' + this.data.longcode);
}

for(var i in window.localStorage) {
  if(i.substring(0, 7) == '$chirp-') {
    var obj = eval('(' + window.localStorage.getItem(i) + ')');
    if(typeof obj == 'object') {
      if('url' in obj) {
        Chirps[obj.url] = new Chirp();
        Chirps[obj.url].data = obj;
        Chirps[obj.url].data.obj = Chirps[obj.url];
      }
    }
  }
} 

console.log(Chirps);