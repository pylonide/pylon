#!/usr/bin/env sh
#
# Runs every *_test.js in the project, except those listed in test/blacklist.txt.
#
# Uses the project-local mocha from node_modules/.bin, so the suite requires no
# global package installs and no elevated privileges -- everything it touches stays
# inside this project. Run `npm install` first.

cd `dirname $0`/..
ROOT=`pwd`
MOCHA="$ROOT/node_modules/.bin/mocha"

echo "Node version: "
node -v

if [ ! -x "$MOCHA" ]; then
  echo "Local mocha not found at $MOCHA" >&2
  echo "Run 'npm install' before running the test suite." >&2
  exit 1
fi

echo "Mocha version: "
"$MOCHA" --version

# Keep going after a failing file so the whole suite is reported in one run, but
# remember that something failed and exit non-zero at the end -- otherwise CI reports
# success no matter what the tests did.
set +e
FAILED=0

BLACKLIST=`cat test/blacklist.txt`
for F in `find . -name '*_test.js' | grep -v tools/static | grep -v backup- | grep -v node_modules | grep -v -e "\./\." | sort`; do
  BLACKLISTED=
  for G in $BLACKLIST; do
    # POSIX string equality: `==` is a bashism and errors under dash (/bin/sh on
    # Debian/Ubuntu, i.e. CI), which silently defeated the blacklist there.
    if [ "$F" = "$G" ]; then
      BLACKLISTED=1
    fi
  done
  if ! [ $BLACKLISTED ]; then
    echo ---------------------------------------------------------------
    echo $F
    cd `dirname $F`

    # run some tests on non-osx systems only
    if grep -q "^[\"']use non-osx" `basename $F`; then
        if [ `uname` = Darwin ]; then
          echo "SKIPPED (non-osx)"
          cd - > /dev/null
          continue
        fi
    fi

    # two cases: either run with mocha or run with node
    # (determined by presence of a string "use mocha"; at the start of the line)
    if grep -q "^[\"']use mocha" `basename $F`; then
      # mocha test
      echo "[mocha]"
      echo ------------------
      "$MOCHA" `basename $F` -R tap
      # $? must be read immediately: the echo/cd below would overwrite it.
      [ $? -eq 0 ] || FAILED=1
    else
      # normal node test
      echo "[node]"
      echo ------------------
      node `basename $F`
      [ $? -eq 0 ] || FAILED=1
    fi
    echo
    cd - > /dev/null
  else
    echo $F SKIPPED
  fi
done

if [ $FAILED -ne 0 ]; then
  echo "---------------------------------------------------------------"
  echo "One or more test files failed. See [mocha]/[node] sections above." >&2
fi

exit $FAILED
