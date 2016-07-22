/* background.js */

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

var mainMenu = chrome.contextMenus.create({title: 'piupiu', contexts: ['all']});

var shareURLMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share current URL', contexts: ['page'], onclick: function(info) {
	chrome.tabs.query({active: true, currentWindow: true}, function(arrayOfTabs) {
		var activeTab = arrayOfTabs[0];
		share({title: activeTab.title, url: activeTab.url});
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
  share({title: title, url: url, image: true});
}});

var shareFrameMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share frame URL', contexts: ['frame'], onclick: function(info) {
  console.log(info);
  var url = info.frameUrl;
  var a = document.createElement('a');
  a.href = url;
  var title = a.hostname;
  share({title: title, url: url});
}});

var shareLinkMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share link URL', contexts: ['link'], onclick: function(info) {
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
  if(url.indexOf('http:') != 0 && url.indexOf('https:')) url = 'http://piupiu.ml/#' + url;
  share({title: title, url: url});
}});

var shareTextMenu = chrome.contextMenus.create({parentId: mainMenu, title: 'Share text', contexts: ['selection'], onclick: function(info) {
  var url = 'http://piupiu.ml/#:' + encodeURIComponent(info.selectionText).replace(/\%20/g, ' ');
  share({title: info.selectionText, url: url});
}});

