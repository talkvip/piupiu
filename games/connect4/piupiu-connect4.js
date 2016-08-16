/* piupiu-connect4.js */

/* reed-solomon */

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

function LOG(msg) {
  console.log(msg);
  document.getElementById('console').innerText = msg + ' (Game status: ' + PIUPIU_GameStatus + ')\r\n' + document.getElementById('console').innerText;
}

/* piupiu connect 4 addon: play connect 4 using 2 devices and the piupiu (chirp) protocol */

var PIUPIU_Game = 'c4';
var PIUPIU_GameStatus = '';
var PIUPIU_OldStatus = '';
var PIUPIU_LastMove = '';
var PIUPIU_Player = 0;
var PIUPIU_Opponent = 0;
var chirpAudio = null;
var piupiu = null;
var chirp = new Chirp();
var game = null;
var firstMove = true;
var colors = ['', 'yellow', 'red'];
var timeoutInterval = null; 

function startGame(ai_1_strength, ai_2_strength) {
  document.getElementById('board').innerText = '';
  game = new C4({
    ai_1_strength: ai_1_strength,
    ai_2_strength: ai_2_strength,
    container: '#board'
  });
}

function chirpPlayer(data) {
  var code = data;
  try {
    data = PIUPIU_decode(code);
  } catch(e) {
    data = code.substring(0, 5);
  }
  if(data != '') LOG('Data: ' + data);
  if(data.indexOf(PIUPIU_Game) == 0) {
    data = data.substring(PIUPIU_Game.length);
    if(data != '') LOG('Code: ' + data);  
    //if(data.indexOf(PIUPIU_Game) == 0) data = data.substring(PIUPIU_Game.length);
    var cmd = data[0];
    LOG('Command: ' + cmd);
    if(cmd == 'r') {
      LOG('Opponent asked to rechirp');
      var p = parseInt(('' + parseInt(data.substring(1))).substring(0, 1));
      if(p == PIUPIU_Player || p == 0 || isNaN(p)) return; // ignore current/invalid player
      LOG('Opponent ' + p + ' asked to rechirp');
      if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }    
      setTimeout(function() { PIUPIU_replay(); }, 500);  
      return;
    }
    if(cmd == 'p') {
      var p = parseInt(('' + parseInt(data.substring(1))).substring(0, 1));
      LOG('Broadcast from: ' + p + ' (you are player ' + PIUPIU_Player + ')');
      if(p == PIUPIU_Player || p == 0 || isNaN(p) || (PIUPIU_GameStatus != '' && PIUPIU_GameStatus != 'chirp')) return; // ignore current/invalid player
      if(confirm('Player ' + p + ' wants to play Connect 4 with you. Agree?')) { // join game
        PIUPIU_Opponent = p;
        PIUPIU_Player = (p == 1) ? 2 : 1;
        var players = document.getElementById('players');
        var player = players.elements['player_' + PIUPIU_Player];
        var n = player.options.length - 1;
        player.options[n].text = 'piupiu - joining...';
        player.options.selectedIndex = n;
        player.disabled = true;
        var opponent = players.elements['player_' + PIUPIU_Opponent];
        var n = opponent.options.length - 1;
        opponent.options[n].text = 'piupiu - waiting for confirmation...';
        opponent.options.selectedIndex = n;
        opponent.disabled = true;
        setTimeout(function() { PIUPIU_join(); }, 500);
      }
      if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }    
      return;
    }
    if(cmd == 'j') { // opponent joined the game
      var p = data[1];
      LOG('Player ' + p + ' joined the game');
      if(parseInt(p) != PIUPIU_Player || (PIUPIU_GameStatus != 'play' && PIUPIU_GameStatus != 'chirp')) return; // game not initiated by current player
      if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }       
      var o = data[2];
      PIUPIU_Opponent = parseInt(o);
      if(PIUPIU_Opponent != ((PIUPIU_Player == 1)?2:1)) return;
      var players = document.getElementById('players');
      var opponent = players.elements['player_' + PIUPIU_Opponent];
      var n = opponent.options.length - 1;
      opponent.options[n].text = 'piupiu - starting game...';
      opponent.options.selectedIndex = n;
      opponent.disabled = true;
      PIUPIU_GameStatus = 'join';
      setTimeout(function() { PIUPIU_start(); }, 500);
      return;
    }
    if(cmd == 's') { // game started by opponent - restart if not moved within 10 sec
      var p = data[1];
      //LOG('Player: ' + p);
      if(parseInt(p) != PIUPIU_Opponent) return; // game not initiated by this player
      var o = data[2];
      //LOG('Opponent: ' + o);
      LOG('Game started by ' + o);
      if(parseInt(o) != PIUPIU_Player || (PIUPIU_GameStatus != 'join' && PIUPIU_GameStatus != 'chirp')) return; // game not shared with this player
      if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }               
      var players = document.getElementById('players');
      var player = players.elements['player_' + PIUPIU_Player];
      var n = player.options.length - 1;
      player.options[n].text = 'piupiu - you';
      player.options.selectedIndex = n;
      player.disabled = false;   
      var opponent = players.elements['player_' + PIUPIU_Opponent];
      var n = opponent.options.length - 1;
      opponent.options[n].text = 'piupiu - opponent';
      opponent.options.selectedIndex = n;
      opponent.disabled = false;
      newGame();
      player.disabled = true;      
      opponent.disabled = true;   
      PIUPIU_GameStatus = 'started';  
      timeoutInterval = setInterval(function() {
        if(PIUPIU_GameStatus == 'started') {
          setTimeout(function() { PIUPIU_rechirp(); }, 500);
        } else {
          clearInterval(timeoutInterval);
          timeoutInterval = null;          
        }
      }, 10000);      
      return;
    }   
    if(cmd == 'm') { // opponent moved - reask if no move within 10 sec
      var p = data[1];
      LOG('Player ' + p + ' moved');
      if(parseInt(p) != PIUPIU_Opponent) {
        if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; } 
        if(parseInt(p) != PIUPIU_Player) setTimeout(function() { PIUPIU_rechirp(); }, 500);
        return; // move not initiated by opponent      
      }
      var c = data[2];
      LOG('Player ' + p + ' moved ' + c);
      var col = document.getElementById('piupiu-col-' + c);
      if(typeof col == 'undefined' || col == null) {  // invalid col
        if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; } 
        if(parseInt(p) != PIUPIU_Player) setTimeout(function() { PIUPIU_rechirp(); }, 500);
      }
      col.className = col.className.replace(' piupiu', '');
      col.click();
      col.className = col.className + ' piupiu';
      PIUPIU_GameStatus = 'move' + p;
      PIUPIU_LastMove = PIUPIU_GameStatus;
      timeoutInterval = setInterval(function() {
        if(PIUPIU_GameStatus == PIUPIU_LastMove) setTimeout(function() { PIUPIU_rechirp(); }, 500);
        if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }       
      }, 10000);
      return;
    }
    if(PIUPIU_GameStatus == 'join' || PIUPIU_GameStatus == 'start' || PIUPIU_GameStatus == 'started' || PIUPIU_GameStatus == 'move' || PIUPIU_GameStatus == PIUPIU_LastMove) setTimeout(function() { PIUPIU_rechirp(); }, 500);
  }
  if(data.length >= 5 && (data[0] == PIUPIU_Game[0] || data[0] == PIUPIU_Game[1]) && PIUPIU_GameStatus == 'join' || PIUPIU_GameStatus == 'start' || PIUPIU_GameStatus == 'move' || PIUPIU_GameStatus == 'started' || PIUPIU_GameStatus == PIUPIU_LastMove) setTimeout(function() { PIUPIU_rechirp(); }, 500);
}

window.addEventListener('load', function(event) {

  var h = new String(location.hash).substring(1);
  if(h != '') PIUPIU_Player = parseInt(h);

  var meta = document.createElement('meta');
  meta.setAttribute('name', 'viewport');
  meta.setAttribute('content', 'width=device-width, user-scalable=no');
  document.getElementsByTagName('head')[0].appendChild(meta);

  var debug = document.createElement('div');
  debug.setAttribute('id', 'debug');
  
  var canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'wave');
  debug.appendChild(canvas);
  document.body.appendChild(debug);

  var consoleDiv = document.createElement('div');
  consoleDiv.setAttribute('id', 'console');
  //consoleDiv.setAttribute('style', 'display: none;');
  document.body.appendChild(consoleDiv);

  PIUPIU_Player = 0;
  chirpAudio = new ChirpAudio({handShake: 'pi', onReceive: chirpPlayer});  
  piupiu = new PIUPIU();

  var players = document.getElementById('players');
  var player1 = players.player_1;
  var player2 = players.player_2;
  var n = player1.options.length;
  player1.options.length++;
  player2.options.length++;
  player1.options[n].value = player2.options[n].value = '0';
  player1.options[n].text = player2.options[n].text = 'piupiu';
  player1.addEventListener('change', function(event) {
    if(player1.options[player1.options.selectedIndex].text == 'piupiu') {
      player1.options.selectedIndex = 0;
      PIUPIU_Player = 1;
      var n = player2.options.length - 1;
      player2.options[n].text = 'piupiu - waiting for opponent...';
      player2.options.selectedIndex = n;
      player2.disabled = true;
      if(PIUPIU_Opponent == 0) {
        PIUPIU_chirpPlayer();
      } else {
        PIUPIU_start();
      }
    }
  });
  player2.addEventListener('change', function(event) {
    if(player2.options[player1.options.selectedIndex].text == 'piupiu') {
      player2.options.selectedIndex = 0;
      PIUPIU_Player = 2;
      var n = player1.options.length - 1;
      player1.options[n].text = 'piupiu - waiting for opponent...';
      player1.options.selectedIndex = n;
      player1.disabled = true;
      if(PIUPIU_Opponent == 0) {
        PIUPIU_chirpPlayer();
      } else {
        PIUPIU_start();
      }
    }
  });
  
});

window.onkeydown = function(event) {
  if(event.keyCode == 13) {
    setTimeout(function() { PIUPIU_replay(); }, 500);
  }
}

function PIUPIU_command(cmd) {
  bin = PIUPIU_Game + cmd;
  while(bin.length < 5) bin += '0';
  //LOG(bin.length);
  
  var el = 6; // error length
  var ec = RS(bin.length + el, el);
  var message = new Int32Array(ec.messageLength);
  for (var i = 0; i < ec.dataLength; i++) message[i] = chirpAudio.alphabet.indexOf(bin.charAt(i));
  
  //LOG('raw data');
  //LOG(Array.prototype.join.call(message));  
  ec.encode(message);
  
  //LOG('rs coded');
  //LOG(Array.prototype.join.call(message));  
  
  var e = message.slice(5);
  //LOG(e);
  //LOG(e.length);  
  
  var ec = base32hex.encode(e);
  //LOG(ec);
  //LOG(ec.length);  

  //LOG(base32hex.decode(ec));

  code = bin + ec.toLowerCase();
  //LOG(code);
  
  return code;
}

function PIUPIU_decode(code) {

  b = code.substring(0, 13);
  //LOG(b);

  var el = 6; // error length
  var ec = RS(5 + el, el);
  var message = new Int32Array(ec.messageLength);
  
  var e = base32hex.decode(b.slice(5));
  //LOG(e.length);
  //LOG(e);

  for (var i = 0; i < 5; i++) message[i] = chirpAudio.alphabet.indexOf(b.charAt(i));
  for (var i = 5; i < b.length; i++) message[i] = e[i - 5];
  //LOG(Array.prototype.join.call(message));

  ec.decode(message);

  //LOG('rs decoded');
  //LOG(Array.prototype.join.call(message));

  var code = '';
  for(var i = 0; i < 5; i++) code += chirpAudio.alphabet.charAt(message[i]);
  //LOG(code);
  
  return code;
}

function PIUPIU_replay() { // ask opponent to replay last chirp
  if(timeoutInterval != null) { clearInterval(timeoutInterval); timeoutInterval = null; }
  LOG('Did not get it!? Replay... ' + chirp.data.longcode);
  setTimeout(function() { chirp.play(); }, 500);
}

function PIUPIU_rechirp() { // look for player (broadcast every 10 sec.)
  if(PIUPIU_Opponent == 0) return;
  LOG('Ask opponent to rechirp');
  chirp.data.longcode = PIUPIU_command('r' + PIUPIU_Player);
  setTimeout(function() { chirp.play(); }, 500);
  /*PIUPIU_OldStatus = PIUPIU_GameStatus;
  timeoutInterval = setInterval(function() {
    if(PIUPIU_OldStatus == PIUPIU_GameStatus) {
      setTimeout(function() { PIUPIU_replay(); }, 500);
    } else {
      PIUPIU_OldStatus = '';
      clearInterval(timeoutInterval);
      timeoutInterval = null;
    }
  }, 10000);*/
}


function PIUPIU_chirpPlayer() { // look for player (broadcast every 10 sec.)
  LOG('Broadcast: you are player ' + PIUPIU_Player);
  chirp.data.longcode = PIUPIU_command('p' + PIUPIU_Player);
  setTimeout(function() { chirp.play(); }, 500);
  PIUPIU_GameStatus = 'play';
  timeoutInterval = setInterval(function() {
    if(PIUPIU_GameStatus == 'play') {
      setTimeout(function() { PIUPIU_replay(); }, 500);
    } else {
      clearInterval(timeoutInterval);
      timeoutInterval = null;
    }
  }, 10000);
}

function PIUPIU_join() { // join game - resend join if status does not become started
  LOG('Join game: you vs ' + PIUPIU_Opponent);
  chirp.data.longcode = PIUPIU_command('j' + PIUPIU_Opponent + PIUPIU_Player);
  setTimeout(function() { chirp.play(); }, 500);
  PIUPIU_GameStatus = 'join';
  timeoutInterval = setInterval(function() {
    if(PIUPIU_GameStatus == 'join') {
      setTimeout(function() { PIUPIU_replay(); }, 500);
    } else {
      clearInterval(timeoutInterval);
      timeoutInterval = null;
    }
  }, 10000);  
}

function PIUPIU_start() { // start the game - restart if no move
  LOG('Start game with ' + PIUPIU_Opponent);
  chirp.data.longcode = PIUPIU_command('s' + PIUPIU_Player + PIUPIU_Opponent);
  setTimeout(function() { chirp.play(); }, 500);
  var players = document.getElementById('players');
  var player = players.elements['player_' + PIUPIU_Player];
  var n = player.options.length - 1;
  player.options[n].text = 'piupiu - you - make your move...';
  player.options.selectedIndex = n;
  player.disabled = false;      
  var opponent = players.elements['player_' + PIUPIU_Opponent];
  var n = opponent.options.length - 1;
  opponent.options[n].text = 'piupiu - opponent';
  opponent.options.selectedIndex = n;
  opponent.disabled = false;
  newGame();
  player.disabled = true;      
  opponent.disabled = true;    
  PIUPIU_GameStatus = 'started';
  timeoutInterval = setInterval(function() {
    if(PIUPIU_GameStatus == 'started') {
      setTimeout(function() { PIUPIU_replay(); }, 500);
    } else {
      clearInterval(timeoutInterval);
      timeoutInterval = null;
    }
  }, 10000);  
}

function newGame() {
  firstMove = true;
  var ai_1_strength = parseInt(players.player_1.value, 10);
  var ai_2_strength = parseInt(players.player_2.value, 10);
  startGame(ai_1_strength, ai_2_strength);
  //LOG(game);
  var controls = document.getElementById('board').firstChild.firstChild.getElementsByTagName('div');
  for(var i = 0; i < controls.length; i++) {
    var control = controls[i];
    var parts = control.className.split(' ');
    col = parts[1].replace('col-', '');
    control.setAttribute('id', 'piupiu-col-' + col);
    control.className = control.className.replace(' piupiu', '') + ' piupiu';
    control.addEventListener('click', function(event) {
      if(event.target.className.indexOf('piupiu') != -1) {
        if(event.target.className.indexOf(colors[PIUPIU_Player]) == -1) {
          alert('Not your turn!');
          event.preventDefault();
          event.stopPropagation();
          return false;
        } else {
          if(timeoutInterval != null) clearInterval(timeoutInterval);            
          PIUPIU_GameStatus = 'move';
          var parts = event.target.className.split(' ');
          col = parts[1].replace('col-', '');
          chirp.data.longcode = PIUPIU_command('m' + PIUPIU_Player + col);
          setTimeout(function() { chirp.play(); });
          if(firstMove) {
            var players = document.getElementById('players');
            var player = players.elements['player_' + PIUPIU_Player];
            var n = player.options.length - 1;
            player.options[n].text = 'piupiu - you';
            player.options.selectedIndex = n;
            player.disabled = true;                
            firstMove = false;
          }
        }
      }
    });
  }
}