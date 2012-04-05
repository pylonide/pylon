# packages apf
apf:
	../c9node/node-c9-builds/bin/node-darwin-v0.4.12 ../packager/package.js ../packager/projects/apf_cloud9.apr
	cat ../packager/build/apf_release.js | sed 's/\(\/\*FILEHEAD(\).*\/apf\/\(.*\)/\1\2/g' > client/js/apf_release.js

# packages core
core:
	mkdir -p client/build
	node r.js -o core.build.js

# packages ext
ext:
	mkdir -p client/build
	node r.js -o app.build.js

# calls dryice on worker & packages it 
worker:
	mkdir -p client/build/worker
	./Makefile.dryice.js worker
	#cp support/ace/build/src/worker* client/js/worker
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
