var PIUPIU = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService)
         .getBranch("extensions.piupiu.");
    prefs.addObserver("", this, false);
    if(!prefs.getBoolPref("firstRunDone")) {
      prefs.setBoolPref("firstRunDone", true);
      installButton("nav-bar", "piupiu-button");
      // The "addon-bar" is available since Firefox 4
      installButton("addon-bar", "piupiu-button");
    } 

    var parent = document.getElementById('piupiu-popup');

    for(var i = 1; i <= 100; i++) {
      var sampleChirp = document.createElement('menuitem');
      sampleChirp.setAttribute('label', 'Sample chirp ' + i + ' (fake)');
      sampleChirp.setAttribute('oncommand', 'PIUPIU.showCard(\'' + i + '\');');
      parent.appendChild(sampleChirp);
      if(i == 10) {
        var menu =  document.createElement('menu');
        menu.setAttribute('label', 'More...');
        parent =  document.createElement('menupopup');
        parent.setAttribute('id', 'piupiu-more');
        menu.appendChild(parent);
        document.getElementById('piupiu-popup').appendChild(menu);
      }
    }

    var sp = document.createElement('menuseparator');
    document.getElementById('piupiu-popup').appendChild(sp);

    var shareURL = document.createElement('menuitem');
    shareURL.setAttribute('label', 'Share current page URL');
    document.getElementById('piupiu-popup').appendChild(shareURL);
  },

  popup: function(event) {
    //window.open("chrome://piupiu/content/popup.xul", "", "chrome");
    document.getElementById('piupiu-popup').openPopup(document.getElementById('piupiu-button'), 'after_start', 0, 0, false, false);
  },
  
  showCard: function(id) {
    alert(id);
    window.open('chrome://piupiu/content/popup.xul', '', 'chrome');
  }
};

window.addEventListener('load', function(e) { PIUPIU.onLoad(e); }, false);
    
function installButton(toolbarId, id, afterId) {
    if (!document.getElementById(id)) {
        var toolbar = document.getElementById(toolbarId);

        // If no afterId is given, then append the item to the toolbar
        var before = null;
        if (afterId) {
            let elem = document.getElementById(afterId);
            if (elem && elem.parentNode == toolbar)
                before = elem.nextElementSibling;
        }

        toolbar.insertItem(id, before);
        toolbar.setAttribute("currentset", toolbar.currentSet);
        document.persist(toolbar.id, "currentset");

        if (toolbarId == "addon-bar")
            toolbar.collapsed = false;
    }
}    