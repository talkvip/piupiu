var PIUPIU = {

  element: null,
  
  onLoad: function(event) {
    // initialization code
    this.initialized = true;
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.piupiu.');
    prefs.addObserver('', this, false);
    if(!prefs.getBoolPref('firstRunDone')) {
      prefs.setBoolPref('firstRunDone', true);
      installButton('nav-bar', 'piupiu-button');
      // The "addon-bar" is available since Firefox 4
      installButton('addon-bar', 'piupiu-button');
    } 
  },
  
  openPopup: function(event) {
    var button = document.getElementById('piupiu-button');
    document.getElementById('piupiu-popup').openPopup(button, 'bottomcenter topright', 25, 0, false, false);  
  },
  
  loadPopup: function(event) {
    var frame = document.getElementById('piupiu-frame');
    frame.setAttribute('src', 'chrome://piupiu/content/popup.html');
  },
  
  unloadPopup: function(event) {
    var frame = document.getElementById('piupiu-frame');
    frame.setAttribute('src', 'about:blank');
  },
  
  onMenu: function(event) {
    element = event.target.triggerNode;
    document.getElementById('share-image').hidden = false;
    document.getElementById('share-video').hidden = false;
    document.getElementById('share-audio').hidden = false;
    document.getElementById('share-frame').hidden = false;
    document.getElementById('share-link').hidden = false;
    if(element.nodeName != 'IMG') document.getElementById('share-image').hidden = true;
    if(element.nodeName != 'VIDEO') document.getElementById('share-video').hidden = true;
    if(element.nodeName != 'AUDIO') document.getElementById('share-audio').hidden = true;
    if(element.nodeName != 'FRAME' && element.nodeName != 'IFRAME') document.getElementById('share-frame').hidden = true;
    if(element.nodeName != 'A') document.getElementById('share-link').hidden = true;
  },
  
  share: function(event) {
    var t = '';
    var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
    var recentWindow = wm.getMostRecentWindow('navigator:browser');    
    t = recentWindow.content.document.title;    
    var data = {title: t, url: recentWindow.content.document.location, image: false};
    if(event.target.id == 'share-image') {
      if(element.hasAttribute('title')) t = element.getAttribute('title');
      data.url = element.src;
      data.image = true;
    }
    if(event.target.id == 'share-video' || event.target.id == 'share-audio') {
      data.url = element.src;
    }
    if(event.target.id == 'share-frame') {
      data.url = element.src;
    }
    if(event.target.id == 'share-link') {
      t = element.innerText;
      data.url = element.href;
    }    
    if(t == '') recentWindow.content.document.title;
    data.title = t;
    var button = document.getElementById('piupiu-button');    
    document.getElementById('piupiu-popup').openPopup(button, 'bottomcenter topright', 25, 0, false, false);  
    var frame = document.getElementById('piupiu-frame');
    frame.setAttribute('src', 'chrome://piupiu/content/popup.html#' + encodeURIComponent(JSON.stringify(data)));
  }
};

window.addEventListener('load', function(e) { PIUPIU.onLoad(e); }, false);
    
function installButton(toolbarId, id, afterId) {
  if (!document.getElementById(id)) {
    var toolbar = document.getElementById(toolbarId);

    // If no afterId is given, then append the item to the toolbar
    var before = null;
    if(afterId) {
      let elem = document.getElementById(afterId);
      if(elem && elem.parentNode == toolbar) before = elem.nextElementSibling;
    }

    toolbar.insertItem(id, before);
    toolbar.setAttribute('currentset', toolbar.currentSet);
    document.persist(toolbar.id, 'currentset');

    if(toolbarId == 'addon-bar') toolbar.collapsed = false;
  }
}    