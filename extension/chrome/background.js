/* background.js */

var PIUPIU_url = 'http://piupiu.ml/?';

navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia || 
                          navigator.msGetUserMedia);  

if(navigator.getUserMedia) {
  // Request the microphone
  navigator.getUserMedia({audio:true}, function() {
  }, function() {
    chrome.windows.create({type: 'popup', url: 'popup.html#mic', width: 300, height: 100});  
  });
}

function share(data) {
  var popupUrl = 'popup.html#' + encodeURIComponent('{"title":"' + data.title.replace(/"/g, '\\"') + '","url":"' + data.url.replace(/"/g, '\\"') + '"' + (('image' in data && data.image)?',"image":true':'') + '}');
  if(chrome.windows) {
		chrome.windows.create({type: 'popup', url: popupUrl, width: 300, height: 100});
	} else {
	  if(chrome.tabs) {
	  	chrome.tabs.create({url: popupUrl});
	  } else {
	  	window.open(popupUrl);
	  }
	}
}

var mainMenu = chrome.contextMenus.create({title: 'piupiu', contexts: ['page', 'image', 'frame', 'link', 'selection']});
var actionMenu = chrome.contextMenus.create({title: chrome.i18n.getMessage('shareURL'), contexts: ['browser_action'], onclick: function(info) {
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		share({title: activeTab.title, url: activeTab.url});
	});
}});

var shareURLMenu = chrome.contextMenus.create({parentId: mainMenu, title: chrome.i18n.getMessage('shareURL'), contexts: ['page'], onclick: function(info) {
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		share({title: activeTab.title, url: activeTab.url});
	});
}});

var shareImageMenu = chrome.contextMenus.create({parentId: mainMenu, title: chrome.i18n.getMessage('shareImage'), contexts: ['image'], onclick: function(info) {
  var url = info.srcUrl;
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {  
    var activeTab = arrayOfTabs[0];
    title = activeTab.title;
    //var title = url;
    if(title == '') {
      title = url;
      if(title.indexOf('#') != -1) title = title.substring(0, title.indexOf('#'));
      if(title.indexOf('?') != -1) title = title.substring(0, title.indexOf('?'));
      title = title.substring(title.lastIndexOf('/') + 1);
    }
    if(title == '') {
      var a = document.createElement('a');
      a.href = url;
      title = a.hostname;
    }
    share({title: title, url: url, image: true});
  });
}});

var shareFrameMenu = chrome.contextMenus.create({parentId: mainMenu, title: chrome.i18n.getMessage('shareFrame'), contexts: ['frame'], onclick: function(info) {
  //console.log(info);
  var url = info.frameUrl;
  var a = document.createElement('a');
  a.href = url;
  var title = a.hostname;
  share({title: title, url: url});
}});

var shareLinkMenu = chrome.contextMenus.create({parentId: mainMenu, title: chrome.i18n.getMessage('shareLink'), contexts: ['link'], onclick: function(info) {
  var url = info.linkUrl;
  var title = url;
  if('selectionText' in info) {
    title = info.selectionText;
  } else {
    try {
      var a = document.createElement('a');
      a.href = url;
      title = a.hostname;
    } catch(e) {
      title = url;
    }
  }
  if(url.indexOf('http:') != 0 && url.indexOf('https:')) url = PIUPIU_url + url;
  share({title: title, url: url});
}});

var shareTextMenu = chrome.contextMenus.create({parentId: mainMenu, title: chrome.i18n.getMessage('shareText'), contexts: ['selection'], onclick: function(info) {
  var url = PIUPIU_url + ':' + encodeURIComponent(info.selectionText).replace(/\%20/g, ' ');
  share({title: info.selectionText, url: url});
}});

