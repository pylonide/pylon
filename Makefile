package:
	../c9node/node-c9-builds/bin/node-darwin-v0.4.12 ../packager/package.js ../packager/projects/apf_cloud9.apr
	cat ../packager/build/apf_release.js | sed 's/\(\/\*FILEHEAD(\).*\/apf\/\(.*\)/\1\2/g' > client/build/apf_release.js

pack:
	mkdir -p client/build
	node r.js -o app.build.js

worker:
	mkdir -p client/build/worker
	./Makefile.dryice.js worker
	cp support/ace/build/src/worker* client/build/worker
	#cd ../packager/lib/yuicompressor/build; java -jar yuicompressor-2.4.7.jar --preserve-semi --nomunge --charset utf-8 --line-break 78 ../../../../cloud9/client/js/worker/worker-javascript.js -o ../../../../cloud9/client/build/worker/worker-javascript.js
	#cd ../packager/lib/yuicompressor/build; java -jar yuicompressor-2.4.7.jar --preserve-semi --nomunge --charset utf-8 --line-break 78 ../../../../cloud9/client/js/worker/worker-coffee.js -o ../../../../cloud9/client/build/worker/worker-coffee.js
	#cd ../packager/lib/yuicompressor/build; java -jar yuicompressor-2.4.7.jar --preserve-semi --nomunge --charset utf-8 --line-break 78 ../../../../cloud9/client/js/worker/worker-css.js -o ../../../../cloud9/client/build/worker/worker-css.js
	#cd ../packager/lib/yuicompressor/build; java -jar yuicompressor-2.4.7.jar --preserve-semi --nomunge --charset utf-8 --line-break 78 ../../../../cloud9/client/js/worker/worker-json.js -o ../../../../cloud9/client/build/worker/worker-json.js
	cd ../packager/lib/yuicompressor/build; java -jar yuicompressor-2.4.7.jar --preserve-semi --nomunge --charset utf-8 --line-break 78 ../../../../cloud9/client/js/worker/worker.js -o ../../../../cloud9/client/build/worker/worker.js

ALL_MODES := $(wildcard mode-*.js)
GOOD_MODES := $(filter-out -%.js, $(ALL_MODES))

mode:
	mkdir -p client/build/mode
	cp `find support/ace/build/src | grep -E "mode-[a-zA-Z_]+.js"`  client/build/mode

theme:
	mkdir -p client/build/theme
	cp `find support/ace/build/src | grep -E "theme-[a-zA-Z_]+.js"` client/build/theme

build: pack worker mode theme

all: build package