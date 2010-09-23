@echo off

IF EXIST common\ace\LICENSE goto skip

echo ----- Please wait, initializing submodules for first launch -----

git submodule update --init --recursive
	
echo ------ Submodules installed ----

:skip
PATH=%PATH%:common\nodebuilds\win32\node;
common\nodebuilds\win32\node bin/cloud9.js -a"cmd /c start"
