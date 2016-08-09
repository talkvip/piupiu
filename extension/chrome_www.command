#!/bin/sh

cd "`dirname "$0"`"
./chrome_make.command
cd chrome
rsync --progress -r -u ./* /Volumes/webdav.alwaysdata.com/www/app/
rsync --progress -u JSON-js/json2.js /Volumes/webdav.alwaysdata.com/www/json2.js
rsync --progress -u audio.js /Volumes/webdav.alwaysdata.com/www/audio.js
rsync --progress -u chirp.js /Volumes/webdav.alwaysdata.com/www/audio.js
rsync --progress -u piupiu.js /Volumes/webdav.alwaysdata.com/www/audio.js
#cp -R * /Volumes/webdav.alwaysdata.com/www/app/
