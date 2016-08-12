var chirpAudio = null;
var piupiu = null;
var chirp = null;

if(typeof chrome == 'undefined' || chrome == null) chrome = {};

function showError(err, u, l) {
  document.body.innerText = '';
  var div = document.createElement('div');
  div.setAttribute('class', 'chrome-menu');
  div.setAttribute('style', 'width: 100% !important;');
  div.innerText = u.substring(u.lastIndexOf('/') + 1) + '[' + l + '] ' + err;
  document.body.appendChild(div);
}

window.addEventListener('load', function(event) {

  window.onerror = function(err, u, l) {
    showError(err, u, l);
		return false;
  }
  
 	var h = decodeURIComponent(new String(location.hash).substring(1));

  if(h != 'mic') {  
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || 
                              navigator.msGetUserMedia);  

    if(navigator.getUserMedia) {
      // Request the microphone
      navigator.getUserMedia({audio:true}, function() {
      }, function() {
        setTimeout(function() {
          chrome.windows.create({type: 'normal', url: 'popup.html#mic', width: 500, height: 100});  
          document.body.className = 'mic';
          document.body.innerText = 'Please allow...';
        }, 1000);
        return;
      });
    }
  
    if(document.body.innerText == 'Please allow...') return;
  }
  
  chirpAudio = new ChirpAudio({onReceive: function(data) {
    console.log(data);
    var script = 'https://piupiuml.alwaysdata.net/chirp.php?data=' + encodeURIComponent(JSON.stringify({shortcode: data.substring(0, 10), callback: 'loadCards'})) + '&callback=Chirp_getResponse';
    //console.log(script);
    var jsonp = piupiu.loadScript(script);
    setTimeout(function() { piupiu.unloadScript(jsonp); }, 5000); 
  }});
  //var chirpAudio = new ChirpAudio();
  piupiu = new PIUPIU();
  chirp = new Chirp();
  
	//console.log(h);
	var data = {};
	if(h == 'mic') {
  	document.title = 'piupiu - PLEASE ALLOW MICROPHONE ACCESS';
		document.body.innerText = '';
	  var div = document.createElement('div');
		div.setAttribute('class', 'chrome-menu');
		div.setAttribute('style', 'width: 100% !important;');
		div.setAttribute('id', 'debug');
	  var div1 = document.createElement('div');
		div1.setAttribute('style', 'height: 40px;');
		div1.setAttribute('class', 'loading');
	  var div2 = document.createElement('div');
		div2.setAttribute('style', 'height: 40px; line-height: 40px;');
		div2.innerText = 'Please allow...';
		if(chrome.i18n) div2.innerText = chrome.i18n.getMessage('loading') + '...';
		div.appendChild(div1);
		div.appendChild(div2);
		document.body.appendChild(div);
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia || 
                              navigator.msGetUserMedia);  

    if(navigator.getUserMedia) {
      // Request the microphone
      navigator.getUserMedia({audio:true}, function() {
        window.close();
      }, function() {
        // error 
      });
    }
	  return;
	}
	if(h != '') data = JSON.parse(h);
	if(typeof data != 'object' || data == null) data = {};
	//console.log(data);
	if(('title' in data) && ('url' in data)) {
		document.body.innerText = '';
	  var div = document.createElement('div');
		div.setAttribute('class', 'chrome-menu');
		div.setAttribute('style', 'width: 100% !important;');
	  var div1 = document.createElement('div');
		div1.setAttribute('style', 'height: 40px;');
		div1.setAttribute('class', 'loading');
	  var div2 = document.createElement('div');
		div2.setAttribute('style', 'height: 40px; line-height: 40px;');
		div2.innerText = 'Please wait...';
		div.appendChild(div1);
		div.appendChild(div2);
		document.body.appendChild(div);
		try {
      if('image' in data) {
        //console.log(data.url.indexOf('data:'));
        if(data.url.indexOf('data:') == 0) { // data URI
          var blob = piupiu.dataURItoBlob(data.url);
          //console.log(blob);
          var f = data.title.replace(/[?*\/\\:]/g, ' ') + blob.type.replace('image/', '.');
          var file = new File([blob], f, {type: blob.type});
          var form = new FormData();
          form.append('format', 'json');
          form.append('file', file, f);
          piupiu.uploadImage(form, function(r) {
            if('url' in r) {
              chirp.create({title: r.filename, url: r.url}, 'newChirpClose');
            } else {
              chirp.create({title: data.title, url: data.url}, 'newChirpClose');
            }
          });
          return;
        }
        if(data.image) {
          var form = new FormData();
          form.append('format', 'json');
          form.append('lutim-file-url', data.url);
          piupiu.uploadImage(form, function(r) {
            if('url' in r) {
              chirp.create({title: r.filename, url: r.url}, 'newChirpClose');
            } else {
              chirp.create({title: data.title, url: data.url}, 'newChirpClose');
            }
          });        
          /*
          var blob = null;
          var xhr = new XMLHttpRequest(); 
          xhr.open('GET', data.url); 
          xhr.responseType = 'blob';
          xhr.onload = function() {
            blob = xhr.response;
            //console.log(blob);
            var f = data.url.substring(data.url.lastIndexOf('/') + 1);
            if(f.indexOf('.') == -1) f += blob.type.replace('image/', '.');
            if(f.length > 50) f = f.substring(f.length - 50);
            console.log(f);
            var file = new File([blob], f, {type: blob.type});
            var form = new FormData();
            form.append('format', 'json');
            form.append('file', file, f);
            piupiu.uploadImage(form, function(r) {
              if('url' in r) {
                chirp.create({title: r.filename, url: r.url}, 'newChirpClose');
              } else {
                chirp.create({title: data.title, url: data.url}, 'newChirpClose');
              }
            });
          }
          xhr.send();		  
          */
          return;
        } else {
          chirp.create({title: data.title, url: data.url}, 'newChirpClose');        
          return;
        }
      }
		} catch(e) {
		  console.log(e);
      chirp.create({title: data.title, url: data.url}, 'newChirpClose');
      return;		
		}
		if(data.url.indexOf(piupiu.old_url) == 0 || data.url.indexOf(piupiu.url) == 0) {
      chirp.create({title: data.title, url: data.url}, 'newChirpClose');
      return;
		} else {
      piupiu.shortenURL(data.url, function(r) {
        if('shorturl' in r) {
          chirp.create({title: data.title, url: r.shorturl}, 'newChirpClose');
        } else {
          chirp.create({title: data.title, url: data.url}, 'newChirpClose');
        }
      });		
      return;
		}
	}

  if(!chrome.tabs) document.getElementById('chirp-url').innerText = 'Share URL';
  if(chrome.i18n) document.getElementById('chirp-url').innerText = chrome.i18n.getMessage('shareURL');
	document.getElementById('chirp-url').addEventListener('click', function(event) {
	  if(chrome.tabs) {
      chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
        var activeTab = arrayOfTabs[0];
        var activeTabId = activeTab.id; // or do whatever you need	
        document.getElementById('chirp-url').className = document.getElementById('chirp-url').className + ' loading';
        piupiu.shortenURL(activeTab.url, function(r) {
          var a = document.createElement('a');
          a.href = activeTab.url;				
          if('shorturl' in r) {
            chirp.create({title: a.hostname.replace('www.', '') + ' - ' + activeTab.title, url: r.shorturl}, 'newChirp');
          } else {
            chirp.create({title: a.hostname.replace('www.', '') + ' - ' + activeTab.title, url: activeTab.url}, 'newChirp');
          }
        });
      });		
		} else {
		  var url = prompt('URL to share', '');
		  if(typeof url == 'undefined' || url == null) url = '';
		  if(url == '') return;
      document.getElementById('chirp-url').className = document.getElementById('chirp-url').className + ' loading';
      piupiu.shortenURL(url, function(r) {
        var a = document.createElement('a');
        a.href = url;				
        if('shorturl' in r) {
          chirp.create({title: a.hostname.replace('www.', ''), url: r.shorturl}, 'newChirp');
        } else {
          chirp.create({title: a.hostname.replace('www.', ''), url: url}, 'newChirp');
        }
      });		  
		}
	});

	if(chrome.i18n) document.getElementById('del-message').innerText = chrome.i18n.getMessage('remove');

	
	if(chrome.i18n) document.getElementById('confirm-del-btn').innerText = chrome.i18n.getMessage('confirm');
	document.getElementById('confirm-del-btn').addEventListener('click', function(event) {
	  if(event.target.getAttribute('longcode') == '') return;
    localStorage.removeItem('$chirp-' + event.target.getAttribute('longcode'));
    try { chrome.storage.sync.remove('$chirp-' + event.target.getAttribute('longcode'), function() {}); } catch(e) { console.log(e); }
    event.target.setAttribute('longcode', '');
    document.getElementById('confirm-del').style.display = 'none';
    setTimeout(function() {
      Chirps = {};
      loadCards();
    }, 1000);	
	});

	if(chrome.i18n) document.getElementById('confirm-del-cancel').innerText = chrome.i18n.getMessage('cancel');
	document.getElementById('confirm-del-cancel').addEventListener('click', function(event) {
    event.target.setAttribute('longcode', '');
    document.getElementById('confirm-del').style.display = 'none';
	});
	
	loadCards();
});

function loadCards(data) {
  //console.log(data);
	chirp.load(function() {
    document.getElementById('cards').innerText = '';
    for(var i in Chirps) {
      var div = document.createElement('div');
      div.setAttribute('id', i);
      div.setAttribute('class', 'card');
      if(typeof data == 'object') {
        if(data.longcode == Chirps[i].data.longcode) div.setAttribute('class', 'card pulse');
      }  
      div.setAttribute('title', Chirps[i].data.title);
      var del = document.createElement('div');
      del.setAttribute('id', i + '-del');
      del.setAttribute('class', 'del');
      var font = document.createElement('font');
      var title = Chirps[i].data.title;
      if(title.length > 100) title = title.substring(0, 100);
      if(title.length > 97) title = title.substring(0, title.lastIndexOf(' ')) + '...';
      font.innerText = title;
      font.setAttribute('id', i + '-title');
      div.appendChild(del);      
      div.appendChild(font);
      document.getElementById('cards').appendChild(div);
      document.getElementById(i + '-del').addEventListener('click', function(event) {
      	var data = Chirps[event.target.id.replace('-del', '')].data;
        document.getElementById('confirm-del-btn').setAttribute('longcode', data.longcode);
        document.getElementById('confirm-del').style.display = 'block';
        event.stopPropagation();
      });
      document.getElementById(i).addEventListener('click', function(event) {
        if(event.target.id.replace('-title', '') in Chirps) {
          var data = Chirps[event.target.id.replace('-title', '')].data;
          var content = document.getElementById(data.url + '-content');
          if(typeof content == 'undefined' || content == null) {
            showCard(data);
          } else {
            var card = document.getElementById(event.target.id.replace('-title', ''));
            card.removeChild(content);
            card.className = card.className.replace(' card-open', '');
          }
        }
      });
    }	
    if(typeof data == 'object') {
      showCard(data);
      if('body' in data) {
        if(data.body.indexOf('clipboard:') == 0) {
          piupiu.copyTextToClipboard(data.body.substring(10));
        }
      }
    }
	});
}

function showCard(data) {
	var parent = document.getElementById(data.url);
	parent.className = parent.className += ' card-open';
	var div = document.createElement('div');
	div.setAttribute('id', data.url + '-content');
	div.setAttribute('class', 'card-content');
	div.setAttribute('style', 'margin-top: 5px; word-wrap: break-word; text-overflow: ellipsis;');
	var url = data.url;
	if(url.indexOf(piupiu.old_url) == 0 || url.indexOf(piupiu.url) == 0) {
	  var parts = url.replace(piupiu.old_url, '').replace(piupiu.url, '').split(':');
	  if(parts.length > 1) {
	    if(parts[0] == '') {
  	    url = decodeURIComponent(url.replace(piupiu.old_url, '').replace(piupiu.url, '').substring(1));
	    } else {
  	    url = decodeURIComponent(url.replace(piupiu.old_url, '').replace(piupiu.url, ''));
	    }
	  }
	}
	div.setAttribute('title', url);	
	if('mimetype' in data) {
	  if(data.mimetype.indexOf('image/') == 0) {
	    var img = document.createElement('img');
	    img.setAttribute('id', data.url + '-image');
	    img.src = data.url;
	    div.appendChild(img);
	  } else if(data.mimetype == 'text/plain') {
	    div.innerText = data.body;
	  } else {
	    div.innerText = url.replace(piupiu.url, piupiu.old_url);
	  }
	} else {
	  div.innerText = url.replace(piupiu.url, piupiu.old_url);
	}
  parent.appendChild(div);
	var btn = document.createElement('div');
	btn.setAttribute('id', data.url + '-chirp');
	btn.setAttribute('class', 'chirp-button');
	btn.setAttribute('title', 'Click here to share with sound!');
  document.getElementById(data.url + '-content').appendChild(btn);
  document.getElementById(data.url + '-content').addEventListener('click', function(event) {
    if(event.target.id.replace('-content', '') in Chirps) {
      var data = Chirps[event.target.id.replace('-content', '')].data;
      if(chrome.tabs) {
        chrome.tabs.create({url: data.url});
      } else {
        window.open(data.url);
      }
		}
  });
  if(typeof document.getElementById(data.url + '-image') != 'undefined' && document.getElementById(data.url + '-image') != null) {
    document.getElementById(data.url + '-image').addEventListener('click', function(event) {
      if(event.target.id.replace('-image', '') in Chirps) {
        var data = Chirps[event.target.id.replace('-image', '')].data;
        if(chrome.tabs) {
          chrome.tabs.create({url: data.url});
        } else {
          window.open(data.url);
        }          
      }
    });
  }
  document.getElementById(data.url + '-chirp').addEventListener('click', function(event) {
		chirp.data.longcode = Chirps[event.target.id.replace('-chirp', '')].data.longcode;
		chirp.play();
		event.stopPropagation();
  });
  setTimeout(function() {
    if(parent.offsetTop + parent.clientHeight > document.getElementById('cards').clientHeight + document.getElementById('cards').scrollTop) {
      document.getElementById('cards').scrollTop = parent.offsetTop + parent.clientHeight;
    }
    if(parent.offsetTop < document.getElementById('cards').scrollTop) document.getElementById('cards').scrollTop = parent.offsetTop;
  }, 100);
}

function newChirp(data) {
	document.getElementById('chirp-url').className = document.getElementById('chirp-url').className.replace(' loading', '');
	//console.log(data);
	if('error' in data) {
    showError(data.error.msg + '(Invalid URL?)', 'newChirp', 0);
	} else {
		data.obj.play();
		loadCards();
	}
}

function newChirpClose(data) {
	//console.log(data);
	if('error' in data) {
    showError(data.error.msg + '(Invalid URL?)', 'newChirpClose', 0);
		window.close();
	} else {
		data.obj.play();
		setTimeout(function() {
		  window.close();
		}, 4000);
	}
}
