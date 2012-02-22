package:
	node support/packager/package.js apf_cloud9.apr
	#git add client/js/apf_release.js
	#git commit -m "new apf_release.js"

worker:
	mkdir -p client/js/worker
	./Makefile.dryice.js worker
	cp support/ace/build/src/worker* client/js/worker
