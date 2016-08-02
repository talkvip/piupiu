var chirpAudio = new ChirpAudio();
var piupiu = new PIUPIU();
var chirp = new Chirp();

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
	//console.log(h);
	var data = {};
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
        chirp.create({title: data.title, url: data.url}, 'newChirpClose');
        return; // lut.im down?
        if(data.image) {
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

	document.getElementById('chirp-url').addEventListener('click', function(event) {
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
	});
	
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

	document.getElementById('confirm-del-cancel').addEventListener('click', function(event) {
    event.target.setAttribute('longcode', '');
    document.getElementById('confirm-del').style.display = 'none';
	});
	
	loadCards();
});

function loadCards() {
	chirp.load(function() {
    document.getElementById('cards').innerText = '';

    for(var i in Chirps) {
      var div = document.createElement('div');
      div.setAttribute('id', i);
      div.setAttribute('class', 'card');
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
      chrome.tabs.create({url: data.url});
		}
  });
  if(typeof document.getElementById(data.url + '-image') != 'undefined' && document.getElementById(data.url + '-image') != null) {
    document.getElementById(data.url + '-image').addEventListener('click', function(event) {
      if(event.target.id.replace('-image', '') in Chirps) {
        var data = Chirps[event.target.id.replace('-image', '')].data;
        chrome.tabs.create({url: data.url});
      }
    });
  }
  document.getElementById(data.url + '-chirp').addEventListener('click', function(event) {
		chirp.data.longcode = Chirps[event.target.id.replace('-chirp', '')].data.longcode;
		chirp.play();
		event.stopPropagation();
  });
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
