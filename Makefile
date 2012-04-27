.PHONY:	apf ext worker mode theme package test

UNAME := $(shell uname)

# don't know what the uname values are for other platforms 
ifeq ($(UNAME), Darwin)
	nodeToUse := "node-darwin"
endif
ifeq ($(UNAME), SunOS)
	nodeToUse := "node-sunos"
endif

# packages apf
apf:
	cd support/packager; ../node-builds-v4/$(nodeToUse) package.js projects/apf_cloud9.apr
	cd support/packager; cat build/apf_release.js | sed 's/\(\/\*FILEHEAD(\).*\/apf\/\(.*\)/\1\2/g' > ../../client/js/apf_release.js

# package debug version of apf
apfdebug:
	cd support/packager/projects; cat apf_cloud9.apr | sed 's/<p:define name=\"__DEBUG\" value=\"0\" \/>/<p:define name=\"__DEBUG\" value=\"1\" \/>/g' > apf_cloud9_debug2.apr
	cd support/packager/projects; cat apf_cloud9_debug2.apr | sed 's/apf_release/apf_debug/g' > apf_cloud9_debug.apr; rm apf_cloud9_debug2.apr
	cd support/packager; ../node-builds-v4/$(nodeToUse) package.js projects/apf_cloud9_debug.apr
	cd support/packager; cat build/apf_debug.js | sed 's/\(\/\*FILEHEAD(\).*\/apf\/\(.*\)/\1\2/g' > ../../client/js/apf_debug.js

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
