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

var rs = {
  GenericGF: GenericGF,
  GenericGFPoly: GenericGFPoly,
  ReedSolomonEncoder: ReedSolomonEncoder,
  ReedSolomonDecoder: ReedSolomonDecoder
}

function RS(messageLength, errorCorrectionLength) {
    var dataLength = messageLength - errorCorrectionLength;
    var encoder = new rs.ReedSolomonEncoder(rs.GenericGF.AZTEC_DATA_8());
    var decoder = new rs.ReedSolomonDecoder(rs.GenericGF.AZTEC_DATA_8());
    return {
        dataLength: dataLength,
        messageLength: messageLength,
        errorCorrectionLength: errorCorrectionLength,

        encode : function (message) {
            encoder.encode(message, errorCorrectionLength);
        },

        decode: function (message) {
            decoder.decode(message, errorCorrectionLength);
        }
    };
}

/*
var alphabet = '0123456789abcdefghijklmnopqrstuv';
var bin = 'Hel0o!';
var code = base32hex.encode(bin);
var s = '';
console.log(bin.length);
console.log(base32hex.encode(bin).substring(0, 10));
console.log(code);
var el = 5; // error length
var ec = RS(bin.length + el, el);
var message = new Int32Array(ec.messageLength);
for (var i = 0; i < ec.dataLength; i++) message[i] = bin.charCodeAt(i) & 0xff;

console.log('raw data');
console.log(Array.prototype.join.call(message));
//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,0,0,0,0,0,0,0

ec.encode(message);

console.log('rs coded');
console.log(Array.prototype.join.call(message));
//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,180,183,0,112,111,203,47,126

console.log('corrupted');
for (var i = 0; i < 2; i++) message[ Math.floor(Math.random() * message.length) ] = parseInt(Math.random() * 0xff);
console.log(Array.prototype.join.call(message));
//=> 0,1,2,3,4,255,6,7,8,9,10,11,12,13,14,15,255,17,18,19,20,21,22,23,255,183,255,112,111,203,47,126

s = '';
for(var i = 0; i < 6; i++) s += String.fromCharCode(message[i]);
console.log(s);
console.log(s.length);

e = '';
for(var i = 6; i < message.length; i++) e += String.fromCharCode(message[i]);
console.log(e);
console.log(e.length);

code = base32hex.encode(s.substring(0, 6)).substring(0, 10) + base32hex.encode(e);
console.log(code);
b = base32hex.decode(code.substring(0, 10)) + base32hex.decode(code.substring(10));
console.log(b);

for (var i = 0; i < b.length; i++) message[i] = b.charCodeAt(i) & 0xff;
console.log(Array.prototype.join.call(message));

ec.decode(message);

console.log('rs decoded');
console.log(Array.prototype.join.call(message));
//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,180,183,0,112,111,203,47,126

s = '';
for(var i = 0; i < 6; i++) s += String.fromCharCode(message[i]);
console.log(s);
console.log(s.length);

e = '';
for(var i = 6; i < message.length; i++) e += String.fromCharCode(message[i]);
console.log(e);
console.log(e.length);

code = base32hex.encode(s.substring(0, 6)).substring(0, 10) + base32hex.encode(e);
console.log(code);
b = base32hex.decode(code.substring(0, 10)) + base32hex.decode(code.substring(10));
console.log(b);
*/