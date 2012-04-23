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

# packages core
core:
	mkdir -p client/build
	node r.js -o core.build.js

# packages ext
ext: core
	mkdir -p client/build
	node r.js -o app.build.js
	#gzip client/build/packed.js

# calls dryice on worker & packages it 
worker:
	mkdir -p client/js/worker
	./Makefile.dryice.js worker
	cp support/ace/build/src/worker* client/js/worker/
	node r.js -o name=./client/js/worker/worker.js out=./client/js/worker.js baseUrl=.

# copies built ace modes
mode:
	mkdir -p client/js/mode
	cp `find support/ace/build/src | grep -E "mode-[a-zA-Z_]+.js"`  client/js/mode

# copies built ace themes
theme:
	mkdir -p client/js/theme
	cp `find support/ace/build/src | grep -E "theme-[a-zA-Z_]+.js"` client/js/theme

package: apf ext worker mode theme

test:
	$(MAKE) -C test
