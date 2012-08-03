#!/bin/bash

rm test/blacklist.txt

for F in `find . -name '*_test.js' | 
       grep -v backup-`; do 

  echo -- $F >&2
  if echo "$F" | 
       grep 'redis|routing-table|joyent|expresso/test/http.test.js|_test|express/node_modules/connect/test.js|express/test|node_modules/connect/test.js|jsftp_test|http.test|multi_select|publiccloud|ftpParser_test' >/dev/null \
   ||  ! node "$F"
  then
    echo $F | tee -a test/blacklist.txt
  fi
done
