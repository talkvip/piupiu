#!/bin/sh

cd "`dirname "$0"`"
rm piupiu.xpi
cd firefox
zip -r chrome/piupiu.jar content locale skin -x "*.DS_Store"
zip -r ../piupiu.xpi chrome.manifest install.rdf chrome/piupiu.jar defaults -x "*.DS_Store"
rm chrome/piupiu.jar
