#!/bin/sh -e
# lets check if we have the submodules initialized
cd `dirname $0`
cd ..
if [ ! -e common/ace/LICENSE ]; then
	echo "--------------------------- Please wait, initializing submodules for first launch ------------------------"
    git submodule update --init --recursive
	echo "--------------------------- Submodules installed ------------------------"
fi

case `uname` in
Linux)  echo "Linux"   
	common/nodebuilds/lin32/node bin/cloud9.js "$@" -ax-www-browser
	;;
    
Darwin)  echo  "OSX"
    common/nodebuilds/osx64/node bin/cloud9.js "$@" -aopen
    ;;
    
*) echo "Unknown OS"
   ;;
esac



