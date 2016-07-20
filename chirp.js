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
    var chirp = {};
    if('longcode' in data) {
      window.localStorage.setItem('$chirp-' + data.longcode, JSON.stringify(data));
      if(chrome) {
        if('storage' in chrome) {
          if('sync' in chrome.storage) {
            chirp['$chirp-' + data.longcode] = JSON.stringify(data);
            chrome.storage.sync.set(chirp, function() {});
          }
        }
      }
    }
    if(data.url in Chirps) {
      chirp = Chirps[data.url];
    } else { // chirp.io changed the URL !!!
      if('debug' in data) {
        for(var i in data.debug) {
          if('operation' in data.debug[i]) {
            if(data.debug[i].operation.indexOf('resolve_url(') == 0) {
              data.orig = data.debug[i].operation.substring(12, data.debug[i].operation.length - 1);
              console.log(data.orig);
              chirp = Chirps[data.orig];
            }
          }
        }
      }
    }
    chirp.data = data;
    data.obj = chirp;
    console.log(chirp);
    console.log(data);
    if(typeof fn == 'function') fn(data);
  }
}

Chirp = function() {

	this.piupiu = new PIUPIU();

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
    var script = 'https://piupiuml.alwaysdata.net/chirp.php?data=' + encodeURIComponent(JSON.stringify(data)) + '&callback=Chirp_getResponse';
    console.log(script);
    var jsonp = this.piupiu.loadScript(script);
    setTimeout(function() { this.piupiu.unloadScript(jsonp); }, 5000);
  } else {
    if(typeof fn == 'function') fn({err: 'Missing required argument title/url'});
  }
}

Chirp.prototype.play = function() {
  this.socket.send('hj' + this.data.longcode);
}

Chirp.prototype.load = function(callback) {
  for(var i in window.localStorage) {
    if(i.substring(0, 7) == '$chirp-') {
      var obj = JSON.parse(window.localStorage.getItem(i));
      if(typeof obj == 'object') {
        if('url' in obj) {
          Chirps[obj.url] = new Chirp();
          Chirps[obj.url].data = obj;
          Chirps[obj.url].data.obj = Chirps[obj.url];
        }
      }
    }
  }

  if(chrome) {
    if('storage' in chrome) {
      if('sync' in chrome.storage) {
        chrome.storage.sync.get(null, function(items) {
          var allKeys = Object.keys(items);
          for(var i in window.localStorage) {
            if(i.substring(0, 7) == '$chirp-') {
              var obj = JSON.parse(window.localStorage.getItem(i));
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
          callback();          
        });    
      } else {
        console.log(Chirps);
        callback();
        return;
      }
    } else {
      console.log(Chirps);
      callback();
      return;
    }
  } else {
    console.log(Chirps);
    callback();
    return;
  }
}

window.addEventListener('load', function() {
  new Chirp().load(function(){});
});