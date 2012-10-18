#!/bin/bash -e
if [ $# == 0 ]; then
  echo No files specified
  exit 1
fi
for F in $*; do
  WRAPPED=`echo "$F" | sed -E 's/\.js$/_wrapped/'`.js
  echo -n '// Wrapped in JavaScript, to avoid cross-origin restrictions, created using wrap-in-js.sh
define(function() {
return ' > "$WRAPPED"
  cat "$F" | sed 's/\\/\\\\/g;'" s/'/\\\\'/g; s/^/'/g; s/$/\\\\n' +/g" >> "$WRAPPED"
  echo "'';});" >> "$WRAPPED"
done

