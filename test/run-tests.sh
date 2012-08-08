#!/bin/bash -e

npm install amd-loader
BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v backup- | grep -v node_modules`; do
  BLACKLISTED=
  for G in $BLACKLIST; do
    if [ "$F" == "$G" ]; then
      BLACKLISTED=1
    fi
  done
  if ! [ $BLACKLISTED ]; then
    echo $F
    echo ----
    node $F
    echo ----
  else
    echo $F SKIPPED
  fi
done