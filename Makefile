package:
	node common/packager/package.js apf_release.apr
	cat common/packager/build/apf_release.js | sed 's/\(\/\*FILEHEAD(\).*\/apf\/\(.*\)/\1\2/g' > client/js/apf_release.js
	git add client/js/apf_release.js
	git commit -m "new apf_release.js"