#!/usr/bin/env sh
echo "Node version: "
node -v
echo "Mocha version: "
mocha -V || :

cd `dirname $0`/..

npm install amd-loader
which mocha 2>/dev/null || npm install -g mocha

# continue on error
set +e

BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v tools/static | grep -v backup- | grep -v node_modules | grep -v -e "\./\." | sort`; do
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

    # run some tests as root
    if grep -q "^[\"']use root" `basename $F`; then
        SUDO="sudo"
    else
        SUDO=""
    fi

    # run some tests on non-osx systems only
    if grep -q "^[\"']use non-osx" `basename $F`; then
        if [ `uname` == Darwin ]; then
          echo "SKIPPED (non-osx)"
          cd -
          continue
        fi
    fi

    # two cases: either run with mocha or run with node
    # (determined by presence of a string "use mocha"; at the start of the line)
    if grep -q "^[\"']use mocha" `basename $F`; then
      # mocha test
      echo "[mocha]"
      echo ------------------
      $SUDO mocha `basename $F` -R tap
    else
      # normal node test
      echo "[node]"
      echo ------------------
      $SUDO node `basename $F`
    fi
    echo
    cd - > /dev/null
  else
    echo $F SKIPPED
  fi
done
