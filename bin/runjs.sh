#!/bin/sh

CMD="$0"
CMD_DIR=`dirname "$CMD"`
cd "$CMD_DIR/.."

sudo bin/run.js panic
make update

case `uname -a` in
Linux*x86_64*)  echo "Linux 64 bit"
    bin/run.js start -t:c9 server.js "$@" -a x-www-browser
    ;;

Linux*i686*)  echo "Linux 32 bit"
    bin/run.js start -t:c9 server.js "$@" -a x-www-browser
    ;;

Linux*arm*)  echo "Linux ARM"
    bin/run.js start -t:c9 server.js "$@" -a x-www-browser
    ;;

Darwin*)  echo  "OSX"
    bin/run.js start -t:c9 server.js "$@" -a open
    ;;

FreeBSD*64*) echo "FreeBSD 64 bit"
    bin/run.js start -t:c9 server.js "$@" -a open
    ;;

CYGWIN*)  echo  "Cygwin"
    bin/run.js start -t:c9 server.js "$@" -a "cmd /c start"
    ;;

MING*)  echo  "MingW"
    bin/run.js start -t:c9 server.js "$@" -a "cmd /c start"
    ;;

SunOS*)  echo  "Solaris"
    bin/run.js start -t:c9 server.js "$@"
    ;;


*) echo "Unknown OS"
   ;;
esac
