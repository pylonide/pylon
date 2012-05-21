cd node_modules/ace; make clean build; cd ../..
cd node_modules/packager && rm -rf node_modules && sm install && cd ../..

make

node ./node_modules/mappings/scripts/postinstall-notice.js
