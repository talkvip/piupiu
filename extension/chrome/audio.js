/* audio.js */

var ChirpAudio = function(params) {
  params = params || {};
  this.alphabet = params.alphabet || '0123456789abcdefghijklmnopqrstuv';
  this.minFreq = params.minFreq || 1760.0;
  this.freqError = params.freqError || 50;
  this.noteRatio = params.noteRatio || 1.0594630943591;
  this.noteDuration = params.noteDuration || 0.0872;
  this.rampDuration = params.rampDuration || 0.008;
  this.volume = params.volume || 0.25;
  this.fade = params.fade || 0.15;
  this.fadeIn = (params.fadeIn || this.fade) * this.noteDuration;
  this.fadeOut = (params.fadeOut || this.fade) * this.noteDuration;
  this.handShake = params.handShake || 'hj';
  this.sampleRate = params.sampleRate || 44100.0;
  this.waveTableSize = 1024;  
  this.audio = new (window.AudioContext || window.webkitAudioContext)();
  this.gain = null;
  this.buffer = null;
  this.script = null;
  this.noteSamples = Math.round(this.noteDuration * this.sampleRate);
  this.rampSamples = Math.round(this.rampDuration * this.sampleRate);
  this.inSamples = Math.round(this.fadeIn * this.sampleRate);
  this.outSamples = Math.round(this.fadeOut * this.sampleRate);
  this.samples = Math.round((this.noteDuration - this.fadeIn - this.fadeOut) * this.sampleRate);
  this.data = '';
  this.phase = 0.0;
  this.volume = 0.25;
  this.freqTable = {};
  this.freq = 0;
  this.freqTarget = 0;
  this.freqChange = 0.0;
  this.onReceive = params.onReceive || null;
  
  if(this.audio.sampleRate) this.sampleRate = parseFloat(this.audio.sampleRate);

  for(var i = 0; i < this.alphabet.length; i++) {
    this.freqTable[this.alphabet[i]] = this.minFreq * Math.pow(this.noteRatio, i);
  }
  
  this.waveTable = new Array(this.waveTableSize);
  for(var i = 0; i < this.waveTableSize + 2; i++) {
    this.waveTable[i] = Math.sin(Math.PI * 2.0 * i / this.waveTableSize);
  }
  
  if(this.gain == null) this.gain = this.audio.createGain();
  this.gain.gain.value = 0.5;  
  this.buffer = this.audio.createBufferSource();
  
  this.script = this.audio.createScriptProcessor(4096, 1, 2);
  this.script.parent = this;
  this.script.onaudioprocess = function(event) {
    //if(this.parent.sample == -1) console.log(this.parent);
    var lD = event.outputBuffer.getChannelData(0);
    var rD = event.outputBuffer.getChannelData(1);
    var cA = 0.0;
    for(var i = 0; i < lD.length; i++) {
      this.parent.sample++;
      if(this.parent.sample % this.parent.noteSamples == 0) {
        this.parent.index++;
        this.parent.position = -1;
        this.parent.freqTarget = this.parent.charToFreq(this.parent.data[this.parent.index]);
        if(!this.parent.freq) this.parent.freq = this.parent.freqTarget;
        this.parent.freqChange = (this.parent.freqTarget - this.parent.freq) / this.parent.rampSamples;
      }      
      this.parent.position++;
      if(this.parent.position < this.parent.rampSamples) this.parent.freq += this.parent.freqChange;
      cA = 0.0;
      if(this.parent.position < this.parent.inSamples) cA = (this.parent.position / this.parent.inSamples) * this.parent.volume;
      else if(this.parent.position < this.parent.inSamples + this.parent.samples) cA = this.parent.volume;
      else if(this.parent.position < this.parent.inSamples + this.parent.samples + this.parent.outSamples) cA = this.parent.volume * (1.0 - (this.parent.position - this.parent.inSamples - this.parent.samples) / this.parent.outSamples);

      lD[i] = this.parent.interpolate(this.parent.phase) * cA;
      rD[i] = lD[i];

      this.parent.phase += this.parent.freq * this.parent.waveTableSize / this.parent.sampleRate;
      if(this.parent.phase > this.parent.waveTableSize) this.parent.phase -= this.parent.waveTableSize;

      if(this.parent.sample > this.parent.noteSamples * this.parent.data.length) {
        lD[i] = 0;
        rD[i] = 0;
      }
    }    
  }  
  
  this.buffer.connect(this.script);
  this.script.connect(this.audio.destination);
  
  this.interpolate = function(p) {
    var iP = Math.floor(p);
    var dP = p - iP;
    return this.waveTable[iP] + (dP * (this.waveTable[iP + 1] - this.waveTable[iP]));
  }
  
  this.charToFreq = function(c) {
    var note = this.alphabet.indexOf(c);
    return this.minFreq * Math.pow(this.noteRatio, note);
  }

  this.freqToChar = function(freq) {    
    var d = this.minFreq;
    var c = '';
    for(var i in this.freqTable) {
      if(Math.abs(this.freqTable[i] - freq) < d) {
        d = Math.abs(this.freqTable[i] - freq);
        c = i;
      }
    }
    if(d > this.freqError) {
      //console.log(['Not in alphabet', freq, freq + d, freq - d, d]);
      return '';
    }
    return c;
  }
  
  this.play = function(data) {
    if(this.gain == null) this.gain = this.audio.createGain();
    this.gain.gain.value = 0.5;  
    this.data = this.handShake + data;
    this.sample = -1;
    this.index = -1;
    this.position = -1;
  }
  
  /* receive chirps */
  
  var _this = this; 
  var proc = 0;
  var timedBuffer = [];
  var minFreq = this.minFreq;
  var micEvent = '';
  var drawVisual = null;
  var micAnalyser = null;
  
  function micCallback(ev) {
    console.log(ev);
    if('error' in ev) {
      document.getElementById('debug').innerText = ev.error;
    }
    if(ev.event == 'gotstream') {
      mic.startListening();
      micAnalyser = ev.analyser;
    }
    if(ev.event == 'listening') {
      if(micEvent != ev.event) {

        setTimeout(function() {
          var analyser = micAnalyser;

          var canvas = document.getElementById('wave');
          if(typeof canvas == 'undefined' || canvas == null) return;
          var canvasCtx = canvas.getContext('2d');

          var WIDTH = 175, HEIGHT = 25;
          canvasCtx.canvas.width = WIDTH;
          canvasCtx.canvas.height = HEIGHT;

          //if(chrome.tabs) {
      
            analyser.fftSize = 64;
            var bufferLength = analyser.frequencyBinCount;
            if(bufferLength == 0) {
              setTimeout(function() {
                mic.initialize();
              }, 1000);
              return;        
            }      
            var dataArray = new Uint8Array(bufferLength);   

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            function draw() {
                drawVisual = requestAnimationFrame(draw);
                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
                analyser.getByteTimeDomainData(dataArray);
                canvasCtx.beginPath();
  
                var sliceWidth = WIDTH * 1.0 / bufferLength;
                var x = 0;

                for(var i = 0; i < bufferLength; i++) {
                         
                    //var v = dataArray[i] / 128.0;
                    //var y = v * HEIGHT/2;
                    var v = dataArray[i] - 128;
                    y = HEIGHT / 2;
                    y += v * 0.5;
     
                    if(i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }
      
                    x += sliceWidth;        
                  
       
                 }

                 //canvasCtx.lineTo(WIDTH, HEIGHT/2);
                 canvasCtx.stroke();

            }

            draw(); 
          
          //} else {
            // too cpu intensive for mobile
          //}
        }, 100);

      
        setTimeout(function() { analyse(); }, 100);
        micEvent = ev.event;
      }
    }   
    if(ev.event == 'done') {
      if(micEvent != ev.event) {
        //setTimeout(function() { mic.initialize(); }, 100);         
        //setTimeout(function() { mic.startListening(); }, 100); 
        history.go(-1);
        micEvent = ev.event;
      }
    }
  }
  
  if(typeof Microphone != 'undefined') {
    var mic = new Microphone({minFreq: this.minFreq - 100, notes: this.freqTable, callback: function(ev) { micCallback(ev); }});
    mic.initialize();
  }

  var isChirp = false;

  function analyse() {
    proc = requestAnimationFrame(analyse);
    //proc = setInterval(function() {
      //var freq = mic.getFreq(2);
      var note = mic.getNote(2);
      //if(freq >= minFreq - 100) {
        //console.log(note);
        if(note == _this.handShake[0] && !isChirp) isChirp = true;
        if(isChirp) {
          timedBuffer['_' + new Date().getTime()] = note;
          setTimeout(function() {
            //cancelAnimationFrame(proc);
            //if(drawVisual) cancelAnimationFrame(drawVisual);
            //clearInterval(proc);
            analyseBuffer();
            isChirp = false;
            setTimeout(function() {
              //mic.stopListening();
              setTimeout(function() {
              //mic.initialize();
              }, 100);
            }, 100);
          }, 1000 + (chirpAudio.noteDuration * 1000) * (_this.data.length + _this.handShake.length));
        }
        //console.log(freq, note);
      //}
    //}, 1);
  }

  function analyseBuffer() {
    //console.log(timedBuffer);
    if(chrome.tabs) {
      //
    } else {    
      //document.getElementById('console').innerText += 'Timed buffer: ' + JSON.stringify(timedBuffer) + '\n';
    }
    // analyse timedBuffer
    var hTime = -1;
    var startTime = -1;
    for(var t in timedBuffer) {
      if(hTime != -1 && timedBuffer[t] == _this.handShake[1]) {
        startTime = parseFloat(t.substring(1));
        break;
      }
      if(timedBuffer[t] == _this.handShake[0]) {
        hTime = parseFloat(t.substring(1));
      }
    }
    //console.log(hTime);
    //console.log(startTime);
    if(hTime == -1 && startTime == -1) return;
    if(startTime == -1) startTime = hTime + 87.2;
    startTime += 87.2;
    var endTime = startTime + (87.2 * 19);
    //console.log(startTime);
    //console.log(endTime);
    var charBuffer = [];
    var prev = -1;
    for(var t in timedBuffer) {
      f = parseFloat(t.substring(1));
      if(f > endTime) break;
      if(f >= startTime) {
        var i = parseInt((f - startTime) / 87.2);
        if(typeof charBuffer[i] == 'undefined') charBuffer[i] = [];
        charBuffer[i].push(timedBuffer[t]);
        if(prev > 0) {
          if(charBuffer[i][0] == charBuffer[prev][charBuffer[prev].length - 1]) {
            charBuffer[i] = [];              
            charBuffer[prev].push(timedBuffer[t]);
          }
        }
        prev = i;
      }
    }
    //console.log(charBuffer);
    if(chrome.tabs) {
      //
    } else {
      //document.getElementById('console').innerText += 'Char buffer: ' + JSON.stringify(charBuffer) + '\n';
    }
    var charBuffer2 = [];
    var data = '';
    for(var i in charBuffer) {
      var arr2 = charBuffer[i];
      if(arr2.length > 1) {
        var newArr = arr2.slice().sort(), most = [undefined, 0], counter = 0;
        newArr.reduce(function(old, chr){
           old == chr ? ++counter > most[1] && (most = [chr, counter]) : (counter = 1)
           return chr
        });          
        if(typeof most[0] != 'undefined') {
          charBuffer2[i] = most[0];
        } else {
          if(charBuffer[i][0] != 'undefined') charBuffer2[i] = charBuffer[i][0];
        }
      } else {
        if(charBuffer[i][0] != 'undefined') charBuffer2[i] = charBuffer[i][0];
      }
      data += charBuffer2[i];
    }
    //console.log(charBuffer2);
    if(chrome.tabs) {
      //
    } else {
      document.getElementById('console').innerText += 'Char buffer2: ' + JSON.stringify(charBuffer2) + '\n';
    }
    //console.log(data);
    timedBuffer = [];
    if(_this.onReceive) {
      _this.onReceive(data);
    } else {
      var script = 'https://piupiuml.alwaysdata.net/chirp.php?data=' + encodeURIComponent(JSON.stringify({shortcode: data.substring(0, 10), callback: 'loadCards'})) + '&callback=Chirp_getResponse';
      //console.log(script);
      var jsonp = piupiu.loadScript(script);
      setTimeout(function() { piupiu.unloadScript(jsonp); }, 5000); 
    }
  }
}