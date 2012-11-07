#!/bin/sh

CMD="$0"
CMD_DIR=`dirname "$CMD"`
cd "$CMD_DIR/.."

make update

case `uname -a` in
Linux*x86_64*)  echo "Linux 64 bit"
    node server.js "$@" -a x-www-browser
    ;;

Linux*i686*)  echo "Linux 32 bit"
    node server.js "$@" -a x-www-browser
    ;;

Linux*arm*)  echo "Linux ARM"
    node server.js "$@" -a x-www-browser
    ;;

Darwin*)  echo  "OSX"
    node server.js "$@" -a open
    ;;

FreeBSD*64*) echo "FreeBSD 64 bit"
    node server.js "$@" -a open
    ;;

CYGWIN*)  echo  "Cygwin"
    node server.js "$@" -a "cmd /c start"
    ;;

MING*)  echo  "MingW"
    node server.js "$@" -a "cmd /c start"
    ;;

SunOS*)  echo  "Solaris"
    node server.js "$@"
    ;;


*) echo "Unknown OS"
   ;;
esac
