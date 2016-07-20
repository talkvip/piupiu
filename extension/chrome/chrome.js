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
		piupiu.shortenURL(data.url, function(r) {
			if('shorturl' in r) {
				chirp.create({title: data.title, url: r.shorturl}, 'newChirpClose');
			} else {
				chirp.create({title: data.title, url: data.url}, 'newChirpClose');
			}
		});		
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
      div.innerText = Chirps[i].data.title;
      document.getElementById('cards').appendChild(div);
      document.getElementById(i).addEventListener('click', function(event) {
      	var data = Chirps[event.target.id].data;
      	var content = document.getElementById(data.longcode + '-content');
      	if(typeof content == 'undefined' || content == null) {
        	showCard(Chirps[event.target.id].data);
        } else {
        	event.target.removeChild(content);
					event.target.className = event.target.className.replace(' card-open', '');
        }
      });
    }	
	});
}

function showCard(data) {
	var parent = document.getElementById(data.url);
	parent.className = parent.className += ' card-open';
	var div = document.createElement('div');
	div.setAttribute('id', data.longcode + '-content');
	div.setAttribute('class', 'card-content');
	div.setAttribute('title', data.url);	
	div.innerText = data.url;
  parent.appendChild(div);
	var btn = document.createElement('div');
	btn.setAttribute('id', data.longcode + '-chirp');
	btn.setAttribute('class', 'chirp-button');
	btn.setAttribute('title', 'Click here to share with sound!');
  document.getElementById(data.longcode + '-content').appendChild(btn);
  document.getElementById(data.longcode + '-content').addEventListener('click', function(event) {
		var data = Chirps[event.target.id.replace('-content', '')].data;
		chrome.tabs.create({url: data.url});
  });
  document.getElementById(data.longcode + '-chirp').addEventListener('click', function(event) {
		chirp.data.longcode = event.target.id.replace('-content', '');
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
  