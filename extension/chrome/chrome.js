var piupiu = new PIUPIU();
var chirp = new Chirp();

window.addEventListener('load', function(event) {
	var h = decodeURIComponent(new String(location.hash).substring(1));
	var data = {};
	if(h != '') data = JSON.parse(h);
	if(typeof data != 'object' || data == null) data = {};
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
		if(data.url.indexOf('http://piupiu.ml/#') == 0) {
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
      font.innerText = Chirps[i].data.title;
      font.setAttribute('id', i + '-title');
      div.appendChild(del);      
      div.appendChild(font);
      document.getElementById('cards').appendChild(div);
      document.getElementById(i + '-del').addEventListener('click', function(event) {
      	var data = Chirps[event.target.id.replace('-del', '')].data;
        localStorage.removeItem('$chirp-' + data.longcode);
        setTimeout(function() {
          Chirps = {};
          loadCards();
        }, 1000);
        event.stopPropagation();
      });
      document.getElementById(i).addEventListener('click', function(event) {
      	var data = Chirps[event.target.id.replace('-title', '')].data;
      	var content = document.getElementById(data.url + '-content');
      	if(typeof content == 'undefined' || content == null) {
        	showCard(data);
        } else {
          var card = document.getElementById(event.target.id.replace('-title', ''));
        	card.removeChild(content);
					card.className = card.className.replace(' card-open', '');
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
	if(url.indexOf('http://piupiu.ml/#') == 0) {
	  var parts = url.replace('http://piupiu.ml/#', '').split(':');
	  if(parts.length > 1) {
	    if(parts[0] == '') {
  	    url = decodeURIComponent(url.replace('http://piupiu.ml/#', '').substring(1));
	    } else {
  	    url = decodeURIComponent(url.replace('http://piupiu.ml/#', ''));
	    }
	  }
	}
	div.setAttribute('title', url);	
	div.innerText = url;
  parent.appendChild(div);
	var btn = document.createElement('div');
	btn.setAttribute('id', data.url + '-chirp');
	btn.setAttribute('class', 'chirp-button');
	btn.setAttribute('title', 'Click here to share with sound!');
  document.getElementById(data.url + '-content').appendChild(btn);
  document.getElementById(data.url + '-content').addEventListener('click', function(event) {
		var data = Chirps[event.target.id.replace('-content', '')].data;
		chrome.tabs.create({url: data.url});
  });
  document.getElementById(data.url + '-chirp').addEventListener('click', function(event) {
		chirp.data.longcode = Chirps[event.target.id.replace('-chirp', '')].data.longcode;
		chirp.play();
  });
}

function newChirp(data) {
	document.getElementById('chirp-url').className = document.getElementById('chirp-url').className.replace(' loading', '');
	console.log(data);
	if('error' in data) {
		alert(data.error.msg + '(Invalid URL?)');
	} else {
		data.obj.play();
		loadCards();
	}
}

function newChirpClose(data) {
	console.log(data);
	if('error' in data) {
		alert(data.error.msg + '(Invalid URL?)');
		document.body.innerText = data.error.msg;
		window.close();
	} else {
		data.obj.play();
		setTimeout(function() {
		  window.close();
		}, 2000);
	}
}
  