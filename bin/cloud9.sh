#!/bin/sh -e
# lets check if we have the submodules initialized
cd `dirname $0`
cd ..
if [ ! -e support/ace/LICENSE ]; then
    echo "--------------------------- Please wait, initializing submodules for first launch ------------------------"
    git submodule update --init --recursive
    echo "--------------------------- Submodules installed ------------------------"
fi
./bin/install_npm_dependencies.sh

case `uname -a` in
Linux*x86_64*)  echo "Linux 64 bit"   
    support/node-builds-v4/node-linux64 bin/cloud9.js "$@" -a x-www-browser
    ;;

Linux*i686*)  echo "Linux 32 bit"   
    support/node-builds-v4/node-linux32 bin/cloud9.js "$@" -a x-www-browser
    ;;
    
Darwin*)  echo  "OSX"
    support/node-builds-v4/node-darwin bin/cloud9.js "$@" -a open
    ;;

CYGWIN*)  echo  "Cygwin"
    support/node-builds-v4/node-cygwin.exe bin/cloud9.js "$@" -a "cmd /c start"
    ;;

MING*)  echo  "MingW"
    support/node-builds-v4/node-cygwin.exe bin/cloud9.js "$@" -a "cmd /c start"
    ;;    

SunOS*)  echo  "Solaris"
    support/node-builds-v4/node-sunos bin/cloud9.js "$@"
    ;;


*) echo "Unknown OS"
   ;;
esac
