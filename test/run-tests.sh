#!/bin/bash -e
     
npm install amd-loader
BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v backup- | grep -v node_modules | sort`; do
  BLACKLISTED=
  for G in $BLACKLIST; do
    if [ "$F" == "$G" ]; then
      BLACKLISTED=1
    fi
  done
  if ! [ $BLACKLISTED ]; then
    echo $F
    echo ----
    cd `dirname $F` 
    node `basename $F`
    echo ----
    cd - > /dev/null 
  else
    echo $F SKIPPED
  fi
done
