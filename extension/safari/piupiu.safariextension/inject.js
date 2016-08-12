function contextMenuHandler(event) {
  var obj = {title: document.title, url: location, nodeName: event.target.nodeName, image: false};
  if(obj.nodeName == 'IMG') {
    if(event.target.hasAttribute('title')) obj.title = event.target.title;
    obj.url = event.target.src;
    obj.image = true;
  }
  if(obj.nodeName == 'A') {
    obj.title = event.target.innerText;
    obj.url = event.target.href;
  }
  if(obj.nodeName == 'FRAME' || obj.nodeName == 'IFRAME') obj.url = event.target.src;
  if(obj.title == '') obj.title = document.title;
  safari.self.tab.setContextMenuEventUserInfo(event, obj);
}

document.body.addEventListener('contextmenu', contextMenuHandler, false);