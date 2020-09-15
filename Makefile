.PHONY:    ext worker mode theme package test

default: worker

update: worker

# makes ace; at the moment, requires dryice@0.4.2
ace:
	cd node_modules/ace; make clean pre_build; ./Makefile.dryice.js minimal


# packages core
core: ace
	mkdir -p build/src
	node build/r.js -o build/core.build.js

# generates packed template
helper: 
	node build/packed_helper.js

helper_clean:
	mkdir -p build/src
	node build/packed_helper.js 1
	
# packages ext
ext: 
	node build/r.js -o build/app.build.js

# calls dryice on worker & packages it
worker: plugins-client/lib.ace/www/worker/worker-language.js

plugins-client/lib.ace/www/worker/worker-language.js plugins-client/lib.ace/www/worker/worker-javascript.js : \
        $(wildcard node_modules/ace/*) $(wildcard node_modules/ace/*/*) $(wildcard node_modules/ace/*/*/mode/*) \
        $(wildcard plugins-client/ext.language/*) \
        $(wildcard plugins-client/ext.language/*/*) \
        $(wildcard plugins-client/ext.linereport/*) \
        $(wildcard plugins-client/ext.codecomplete/*) \
        $(wildcard plugins-client/ext.codecomplete/*/*) \
        $(wildcard plugins-client/ext.jslanguage/*) \
        $(wildcard plugins-client/ext.jslanguage/*/*) \
        $(wildcard plugins-client/ext.csslanguage/*) \
        $(wildcard plugins-client/ext.csslanguage/*/*) \
        $(wildcard plugins-client/ext.htmllanguage/*) \
        $(wildcard plugins-client/ext.htmllanguage/*/*) \
        $(wildcard plugins-client/ext.jsinfer/*) \
        $(wildcard plugins-client/ext.jsinfer/*/*) \
        $(wildcard node_modules/treehugger/lib/*) \
        $(wildcard node_modules/treehugger/lib/*/*) \
        $(wildcard node_modules/ace/lib/*) \
        $(wildcard node_modules/ace/*/*) \
        Makefile.dryice.js
	mkdir -p plugins-client/lib.ace/www/worker
	rm -rf /tmp/pln_worker_build
	mkdir -p /tmp/pln_worker_build/ext
	ln -s `pwd`/plugins-client/ext.language /tmp/pln_worker_build/ext/language
	ln -s `pwd`/plugins-client/ext.codecomplete /tmp/pln_worker_build/ext/codecomplete
	ln -s `pwd`/plugins-client/ext.jslanguage /tmp/pln_worker_build/ext/jslanguage
	ln -s `pwd`/plugins-client/ext.csslanguage /tmp/pln_worker_build/ext/csslanguage
	ln -s `pwd`/plugins-client/ext.htmllanguage /tmp/pln_worker_build/ext/htmllanguage
	ln -s `pwd`/plugins-client/ext.linereport /tmp/pln_worker_build/ext/linereport
	ln -s `pwd`/plugins-client/ext.linereport_php /tmp/pln_worker_build/ext/linereport_php
	ln -s `pwd`/plugins-client/ext.linereport_python /tmp/pln_worker_build/ext/linereport_python
	node Makefile.dryice.js worker
	cp node_modules/ace/build/src/worker* plugins-client/lib.ace/www/worker

# copies built ace modes
mode:
	mkdir -p plugins-client/lib.ace/www/mode
	cp `find node_modules/ace/build/src | grep -E "mode-[a-zA-Z_0-9]+.js"`  plugins-client/lib.ace/www/mode

# copies built ace themes
theme:
	mkdir -p plugins-client/lib.ace/www/theme
	cp `find node_modules/ace/build/src | grep -E "theme-[a-zA-Z_0-9]+.js"` plugins-client/lib.ace/www/theme

gzip_safe:
	for i in `ls ./plugins-client/lib.packed/www/*.js`; do \
		gzip -9 -v -c -q -f $$i > $$i.gz ; \
	done

gzip:
	for i in `ls ./plugins-client/lib.packed/www/*.js`; do \
		gzip -9 -v -q -f $$i ; \
	done

core: ace core worker mode theme
    
package_clean: helper_clean core ext

package: helper core ext

test check:
	test/run-tests.sh	
