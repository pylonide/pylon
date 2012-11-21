#!/bin/bash -e
     
npm install amd-loader

which mocha 2>/dev/null || npm install -g mocha

BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v backup- | grep -v node_modules | grep -v -e "\./\." | sort`; do
  BLACKLISTED=
  for G in $BLACKLIST; do
    if [ "$F" == "$G" ]; then
      BLACKLISTED=1
    fi
  done
  if ! [ $BLACKLISTED ]; then
    echo ---------------------------------------------------------------
    echo $F
    cd `dirname $F` 
    # two cases: either run with mocha or run with node
    if grep -q "mocha" `basename $F`; then
      # mocha test
      echo "[mocha]"
      echo ------------------
      mocha `basename $F` -R tap
    else
      # normal node test 
      echo "[node]"
      echo ------------------
      node `basename $F`
    fi
    echo
    cd - > /dev/null 
  else
    echo $F SKIPPED
  fi
done
