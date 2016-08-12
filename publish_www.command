#!/bin/sh

cd "`dirname "$0"`"
cd extension
cd chrome
rsync --progress -u -r ./* /Volumes/webdav.alwaysdata.com/www/app/
cd ..
cd ..
rsync --progress -u JSON-js/json2.js /Volumes/webdav.alwaysdata.com/www/json2.js
rsync --progress -u base32.js /Volumes/webdav.alwaysdata.com/www/base32.js
rsync --progress -u reedsolomon.js/reedsolomon.js /Volumes/webdav.alwaysdata.com/www/reedsolomon.js/reedsolomon.js
rsync --progress -u audio.js /Volumes/webdav.alwaysdata.com/www/audio.js
rsync --progress -u microphone.js /Volumes/webdav.alwaysdata.com/www/microphone.js
rsync --progress -u chirp.js /Volumes/webdav.alwaysdata.com/www/audio.js
rsync --progress -u piupiu.js /Volumes/webdav.alwaysdata.com/www/audio.js
rsync --progress -u -r games/* /Volumes/webdav.alwaysdata.com/www/games/
#cp -R * /Volumes/webdav.alwaysdata.com/www/app/
