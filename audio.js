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
  
  if(this.audio.sampleRate) this.sampleRate = parseFloat(this.audio.sampleRate);

  for(var i = 0; i < this.alphabet.length; i++) {
    this.freqTable[this.alphabet[i]] = this.minFreq * Math.pow(this.noteRatio, i);
  }
  
  this.waveTable = new Array(this.waveTableSize);
  for(var i = 0; i < this.waveTableSize + 2; i++) {
    this.waveTable[i] = Math.sin(Math.PI * 2.0 * i / this.waveTableSize);
  }
  
  this.audio.createGain();
  this.buffer = this.audio.createBufferSource();
  
  this.script = this.audio.createScriptProcessor(4096, 1, 2);
  this.script.parent = this;
  this.script.onaudioprocess = function(event) {
    if(this.parent.sample == -1) console.log(this.parent);
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
    this.data = this.handShake + data;
    this.sample = -1;
    this.index = -1;
    this.position = -1;
  }
  
  navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  navigator.getUserMedia({audio: true}, function(stream) {
    var audio = new (window.AudioContext || window.webkitAudioContext)(); //chirpAudio.audio || 
    //var buffer = audio.createBufferSource(stream);
    var source = audio.createMediaStreamSource(stream);
    var script = audio.createScriptProcessor(4096, 1, 2);
    script.buffer = [];
    script.onaudioprocess = function(event) {
      var lD = event.inputBuffer.getChannelData(0);
      this.buffer = this.buffer.concat(lD);
      var samples = chirpAudio.noteSamples;
      if(samples % 2 != 0) samples++;
      var fft = new FFT(samples, chirpAudio.sampleRate);
      var buffer = this.buffer.slice(0, samples);
      fft.forward(buffer);
      this.buffer = this.buffer.slice(4096);
      if(fft.peakBand != 0) {
        var freq = fft.getBandFrequency(fft.peakBand);
        if(freq >= chirpAudio.minFreq - chirpAudio.freqError) console.log([freq, chirpAudio.freqToChar(freq)]);
      }
    }
    //buffer.connect(script);
    source.connect(script);
    script.connect(audio.destination);  
  }, function(err) {
    console.log(err);
  });  
}