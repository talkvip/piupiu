#!/bin/sh

cd "`dirname "$0"`"
cp -p -f ../*.js firefox/content/
cp -p -f ../*.png firefox/content/
cp -p -f ../*.css firefox/content/

rm piupiu.xpi
cd firefox
echo Make JAR...
zip -r chrome/piupiu.jar content locale skin -x "*/*.DS_Store"
echo Make XPI...
zip -r ../piupiu.xpi chrome.manifest install.rdf chrome/piupiu.jar -x "*/*.DS_Store" 
rm chrome/piupiu.jar
cd ..
cd firefox_signed
rm -f -R ./*
unzip ../piupiu.xpi
rm .DS_Store
cd ..
nss-signtool -d . -k piupiu firefox_signed
cd firefox_signed
rm ../piupiu_signed.xpi
zip -r ../piupiu_signed.xpi META-INF/zigbert.rsa -x "*/*.DS_Store" 
zip -r -D ../piupiu_signed.xpi * -x META-INF/zigbert.rsa -x "*/*.DS_Store" 
