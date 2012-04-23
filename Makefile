.PHONY:	apf ext worker mode theme package test

UNAME := $(shell uname)

# don't know what the uname values are for other platforms 
ifeq ($(UNAME), Darwin)
	nodeToUse := "node-darwin"
endif

# packages apf
apf:
	cd support/packager; ../node-builds-v4/$(nodeToUse) package.js projects/apf_cloud9.apr
	cd support/packager; cp build/apf_release.js ../../client/js/apf_release.js

# packages core, then ext
ext:
	mkdir -p client/build
	node r.js -o core.build.js
	mkdir -p client/build
	node r.js -o app.build.js
	#gzip client/build/packed.js

# calls dryice on worker & packages it 
worker:
	mkdir -p client/build/worker
	./Makefile.dryice.js worker
	cp support/ace/build/src/worker* client/build/worker/
	node r.js -o name=./client/js/worker/worker.js out=./client/build/worker/worker.js baseUrl=. optimize=none

# copies built ace modes
mode:
	mkdir -p client/build/mode
	cp `find support/ace/build/src | grep -E "mode-[a-zA-Z_]+.js"`  client/build/mode

# copies built ace themes
theme:
	mkdir -p client/build/theme
	cp `find support/ace/build/src | grep -E "theme-[a-zA-Z_]+.js"` client/build/theme

package: apf ext worker mode theme

test:
	$(MAKE) -C test
