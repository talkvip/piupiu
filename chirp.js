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
  
  this.freqTable = {};
  
  this.charTable = {};
    
  this.coder = new SonicCoder({
    freqMin: 1760.0,
    freqMax: 10500.0
  });
  
  this.coder.alphabet = '0123456789abcdefghijklmnopqrstuv';
  
  var fundamental = this.coder.freqMin;  
  var noteratio = 1.0594630943591;
  for(var i = 0; i < this.coder.alphabet.length; i++) {
    this.charTable[this.coder.alphabet.charAt(i)] = fundamental * Math.pow(noteratio, i);
    this.freqTable[fundamental * Math.pow(noteratio, i)] = this.coder.alphabet.charAt(i);
  }  
  
  this.coder.chirp = this;
  
  this.coder.charToFreq = function(char) {
    if(!(char in this.chirp.charTable)) {
      console.error(char, 'is an invalid character.');
      return 0;    
    } 
	  return this.chirp.charTable[char]; 
	};

  this.coder.freqToChar = function(freq) {
    var diff = this.freqError;
    var index = -1;
    for(var i in this.chirp.freqTable) {
      if(Math.abs(freq - i) < diff) {
        index = i;
        diff = Math.abs(freq - i);
      }
    }
    if(index == -1) {
      console.error(freq, 'is an invalid frequency.');
      return '';    
    }
    return this.freqTable[index];
	};
	
  this.socket = new SonicSocket({
    coder: {},
    charDuration: 0.0872,
    rampDuration: 0.008
  });  
  
  this.socket.coder = this.coder;
    
  this.socket.scheduleToneAt = function(freq, startTime, duration) {
    var gainNode = audioContext.createGain();

    startTime += 1.0;

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
          for(var i in allKeys) {
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