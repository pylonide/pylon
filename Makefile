package:
	node support/packager/package.js apf_cloud9.apr
	#git add client/js/apf_release.js
	#git commit -m "new apf_release.js"

worker:
	mkdir -p plugins-client/cloud9.core/www/js/worker
	rm -rf /tmp/c9_worker_build
	mkdir -p /tmp/c9_worker_build/ext
	ln -s `pwd`/plugins-client/ext.language /tmp/c9_worker_build/ext/language
	ln -s `pwd`/plugins-client/ext.codecomplete /tmp/c9_worker_build/ext/codecomplete
	ln -s `pwd`/plugins-client/ext.jslanguage /tmp/c9_worker_build/ext/jslanguage
	./Makefile.dryice.js worker
	cp support/ace/build/src/worker* plugins-client/cloud9.core/www/js/worker