#!/bin/sh

cd "`dirname "$0"`"
rm chrome.zip
cp -p -f ../*.js chrome/
cp -p -f ../*.png chrome/
cp -p -f ../*.css chrome/
zip -r chrome.zip chrome/ defaults -x "*.DS_Store"
