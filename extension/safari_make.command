#!/bin/sh

cd "`dirname "$0"`"
cp -p -f ../*.js safari/piupiu.safariextension/
cp -p -f ../*.png safari/piupiu.safariextension/
cp -p -f ../*.css safari/piupiu.safariextension/
#zip -r chrome.zip chrome/ defaults -x "*.DS_Store"
