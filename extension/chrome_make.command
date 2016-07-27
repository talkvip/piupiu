#!/bin/sh

cd "`dirname "$0"`"
rm chrome.zip
cp -f ../*.js chrome/
cp -f ../*.png chrome/
cp -f ../*.css chrome/
zip -r chrome.zip chrome/ defaults -x "*.DS_Store"
