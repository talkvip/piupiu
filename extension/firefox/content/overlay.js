var PIUPIU = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefService)
         .getBranch("extensions.piupiu.");
    prefs.addObserver("", this, false);
    if (!prefs.getBoolPref("firstRunDone")) {
      prefs.setBoolPref("firstRunDone", true);
      installButton("nav-bar", "piupiu-button");
      // The "addon-bar" is available since Firefox 4
      installButton("addon-bar", "piupiu-button");    }    
  },

  popup: function(event) {
    //window.open("chrome://piupiu/content/popup.xul", "", "chrome");
    document.getElementById('piupiu-popup').openPopup(document.getElementById('piupiu-button'), 'after_start', 0, 0, false, false);
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