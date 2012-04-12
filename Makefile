# packages apf
apf:
	cd ../packager; ../cloud9/support/node-builds-v4/node-darwin package.js projects/apf_cloud9.apr
	cd ../packager; cp build/apf_release.js ../cloud9/client/js/apf_release.js

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

package: apf core ext worker mode theme
