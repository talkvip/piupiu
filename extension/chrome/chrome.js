var piupiu = new PIUPIU();
var chirp = new Chirp();

window.addEventListener('load', function(event) {
	var h = decodeURIComponent(new String(location.hash).substring(1));
	var data = {};
	if(h != '') data = JSON.parse(h);
	if(typeof data != 'object' || data == null) data = {};
	if(('title' in data) && ('url' in data)) {
		document.body.innerText = 'Please wait...';
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
			piupiu.shortenURL(activeTab.url, function(r) {
        if('shorturl' in r) {
          chirp.create({title: activeTab.title, url: r.shorturl}, 'newChirp');
        } else {
          chirp.create({title: activeTab.title, url: activeTab.url}, 'newChirp');
        }
      });
		});		
	});
	
	chirp.load(function() {
    document.getElementById('cards').innerText = '';

    for(var i in Chirps) {
      var chirp = Chirps[i];
      var div = document.createElement('div');
      div.setAttribute('id', i);
      div.setAttribute('class', 'card');
      div.innerText = chirp.data.title;
      document.getElementById('cards').appendChild(div);
      document.getElementById(i).addEventListener('click', function(event) {
        console.log(event);
      });
    }	
	});
});

function newChirp(data) {
	console.log(data);
	if('error' in data) {
		alert(data.error.msg + '(Invalid URL?)');
	} else {
		data.obj.play();
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
  