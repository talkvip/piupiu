#!/bin/sh

cd "`dirname "$0"`"
cp -p -f ../*.js firefox/content/
cp -p -f ../*.png firefox/content/
cp -p -f ../*.css firefox/content/

rm piupiu.xpi
cd firefox
echo Make JAR...
zip -r chrome/piupiu.jar content locale skin -x "*.DS_Store" -x "content/JSON-js/.git"
echo Make XPI...
zip -r ../piupiu.xpi chrome.manifest install.rdf chrome/piupiu.jar defaults -x "*.DS_Store" 
rm chrome/piupiu.jar
