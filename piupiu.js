/* piupiu.js */

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