/* background.js */

function share(title, url) {
  var popupUrl = 'popup.html#' + encodeURIComponent('{"title":"' + title.replace(/"/g, '\"') + '","url":"' + url.replace(/"/g, '\"') + '"}');
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

var mainMenu = chrome.contextMenus.create({title: 'piupiu', contexts: ['all']});

var shareURLMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share current URL', contexts: ['page'], onclick: function(info) {
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		//chrome.tabs.create({url:'popup.html#' + encodeURIComponent('{"title":"' + activeTab.title.replace(/"/, '\"') + '","url":"' + activeTab.url + '"}')});
		share(activeTab.title, activeTab.url);
	});
}});

var shareImageMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share image', contexts: ['image'], onclick: function(info) {
  var url = info.srcUrl;
  var title = url;
  if(title.indexOf('#') != -1) title = title.substring(0, title.indexOf('#'));
  if(title.indexOf('?') != -1) title = title.substring(0, title.indexOf('?'));
  var title = title.substring(title.lastIndexOf('/') + 1);
  if(title == '') {
    var a = document.createElement('a');
    a.href = url;
    title = a.hostname;
  }
  //chrome.tabs.create({url:'popup.html#' + encodeURIComponent('{"title":"' + title.replace(/"/, '\"') + '","url":"' + url + '"}')});
  share(title, url);
}});

var shareFrameMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share frame URL', contexts: ['frame'], onclick: function(info) {
  console.log(info);
  var url = info.frameUrl;
  var a = document.createElement('a');
  a.href = url;
  var title = a.hostname;
  //chrome.tabs.create({url:'popup.html#' + encodeURIComponent('{"title":"' + title.replace(/"/, '\"') + '","url":"' + url + '"}')});
  share(title, url);
}});

var shareLinkMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share link URL', contexts: ['link'], onclick: function(info) {
  var url = info.linkUrl;
  var a = document.createElement('a');
  a.href = url;
  var title = a.hostname;
  //chrome.tabs.create({url:'popup.html#' + encodeURIComponent('{"title":"' + title.replace(/"/, '\"') + '","url":"' + url + '"}')});
  share(title, url);
}});

