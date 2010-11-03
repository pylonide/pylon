#!/bin/sh -e
# lets check if we have the submodules initialized
cd `dirname $0`
cd ..
if [ ! -e support/ace/LICENSE ]; then
	echo "--------------------------- Please wait, initializing submodules for first launch ------------------------"
    git submodule update --init --recursive
	echo "--------------------------- Submodules installed ------------------------"
fi

case `uname -a` in
Linux*x86_64*)  echo "Linux 64 bit"   
	support/node-builds/lin64/node bin/cloud9.js "$@" -a x-www-browser
	;;

Linux*i686*)  echo "Linux 32 bit"   
	support/node-builds/lin32/node bin/cloud9.js "$@" -a x-www-browser
	;;
    
Darwin*)  echo  "OSX"
    support/node-builds/osx64/node bin/cloud9.js "$@" -a open
    ;;

CYGWIN*)  echo  "Cygwin"
    support/node-builds/win32/node.exe bin/cloud9.js "$@" -a "cmd /c start"
    ;;

MING*)  echo  "MingW"
    support/node-builds/win32/node.exe bin/cloud9.js "$@" -a "cmd /c start"
    ;;    

*) echo "Unknown OS"
   ;;
esac



