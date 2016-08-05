/* piupiu.js */

PIUPIU = function() {

  this.old_url = 'http://piupiu.ml/#';
  this.url = 'http://piupiu.ml/?';
  this.shortenURL_Callback = null;
  this.shortenURL_Id = null;
  
	this.loadScript = function(url) {
		var id = 'script-' + new Date().getTime();
		var script = document.createElement('script');
		script.setAttribute('id', id);
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', url);
		document.body.appendChild(script);
		return id;
	}

	this.unloadScript = function(id) {
		var el = document.getElementById(id);
		if(typeof el == 'undefined' || el == null) return;
		document.body.removeChild(el);
	}

	this.uploadImage = function(form, callback) {
		try {
		  var formData = null;
		  if('append' in form) {
		    formData = form;
		  } else {
        form.target = '_self';
        formData = new FormData(form);
			}
			var request = new XMLHttpRequest();
			request.open('POST', 'https://lut.im');
			request.onerror = function(e) {
			  callback(e);
			}
			request.onload = function(r) {
				if(request.status == 200) {
					var im = JSON.parse(request.responseText);
					console.log(im);
					//f = form.file.value;
					f = 'image.jpeg';
					if('msg' in im) {
						if('filename' in im.msg) f = im.msg.filename;
						if('short' in im.msg) {
							callback({url: 'https://lut.im/' + im.msg.short + '?dl', filename: f});
						}
					}
				}
			}
			request.send(formData);
			return false;
		} catch(e) {
		  callback({err: e});
			form.target = '_blank';
			return true;
		}
	}

  this.dataURItoBlob = function(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

	this.shortenURL = function(url, callback) {
		this.shortenURL_Callback = callback;
		this.shortenURL_Id = this.loadScript('https://is.gd/create.php?format=json&url=' + encodeURIComponent(url) + '&callback=' + encodeURIComponent('piupiu.shortenURL_getResult'));
	}
	
	this.shortenURL_getResult = function(r) {
		if('shorturl' in r) {
			var https = new String('https://');
			if(r.shorturl.indexOf(https) == 0) r.shorturl = 'http://' + r.shorturl.substring(https.length);
			r.shorturl = r.shorturl.replace('http://is.gd/', this.url);
		}
		this.shortenURL_Callback(r);
		this.unloadScript(this.shortenURL_Id);
		this.shortenURL_Id = null;
		this.shortenURL_Callback = null;
	}
}
