#!/bin/bash -e

npm install amd-loader
BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v backup- | grep -v node_modules`; do
  BLACKLISTED=
  echo $F
  for G in $BLACKLIST; do
    if [ "$F" == "$G" ]; then
      BLACKLISTED=1
    fi
  done
  if ! [ $BLACKLISTED ]; then
    echo -------------------------------
    echo $F
    node $F
  fi
done
