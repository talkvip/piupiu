/* chirp.js */

var Chirps = {};

function Chirp_getResponse(data) {
  console.log(data);
  if(typeof data != 'object') data = {};
  if('callback' in data) var fn = window[data.callback];       
  if('error' in data) {
    //console.log(data.error.msg);
    if(typeof fn == 'function') fn(data);
    return;
  }
  if(('title' in data) && ('url' in data)) {
    var obj = {};
    if('longcode' in data) {
      window.localStorage.setItem('$chirp-' + data.longcode, JSON.stringify(data));
      if(chrome) {
        if('storage' in chrome) {
          if('sync' in chrome.storage) {
            obj['$chirp-' + data.longcode] = JSON.stringify(data);
            chrome.storage.sync.set(obj, function() {});
          }
        }
      }
    }
    if(data.url in Chirps) {
      obj = Chirps[data.url];
    } else { // chirp.io changed the URL !!!
      if('debug' in data) {
        for(var i in data.debug) {
          if('operation' in data.debug[i]) {
            if(data.debug[i].operation.indexOf('resolve_url(') == 0) {
              data.orig = data.debug[i].operation.substring(12, data.debug[i].operation.length - 1);
              //console.log(data.orig);
              obj = Chirps[data.orig];
            }
          }
        }
      }
    }
    chirp.data = data;
    data.obj = obj;
    //console.log(obj);
    //console.log(data);
    if(typeof fn == 'function') fn(data);
  }
}

Chirp = function() {
  this.data = {};
}

Chirp.prototype.create = function(data, callback) {
  if(typeof data != 'object') data = {};
  //console.log(data);
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
    //console.log(data);
    var script = 'https://piupiuml.alwaysdata.net/chirp.php?data=' + encodeURIComponent(JSON.stringify(data)) + '&callback=Chirp_getResponse';
    //console.log(script);
    var jsonp = piupiu.loadScript(script);
    setTimeout(function() { piupiu.unloadScript(jsonp); }, 5000);
  } else {
    if(typeof fn == 'function') fn({err: 'Missing required argument title/url'});
  }
}

Chirp.prototype.play = function() {
  chirpAudio.play(this.data.longcode);
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

	//console.log('*** localstorage ***');	
	//console.log(Chirps);

  if(typeof chrome != 'undefined') {
    if('storage' in chrome) {
      if('sync' in chrome.storage) {
        chrome.storage.sync.get(null, function(items) {
          var allKeys = Object.keys(items);
          for(var i in allKeys) {
            if(allKeys[i].indexOf('$chirp-') == 0) {
              var obj = JSON.parse(items[allKeys[i]]);
              if(typeof obj == 'object') {
                if('url' in obj) {
                  Chirps[obj.url] = new Chirp();
                  Chirps[obj.url].data = obj;
                  Chirps[obj.url].data.obj = Chirps[obj.url];
                }
              }
            }
          }
          //console.log('*** chrome sync ***');
          //console.log(Chirps);
          callback();          
        });    
      } else {
        //console.log('*** chrome sync not available ***');
        callback();
        return;
      }
    } else {
      //console.log('*** chrome storage not available ***');
      callback();
      return;
    }
  } else {
    //console.log('*** chrome not available ***');
    callback();
    return;
  }
}

window.addEventListener('load', function() {
  new Chirp().load(function(){});
});