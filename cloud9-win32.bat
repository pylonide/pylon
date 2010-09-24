@echo off

IF EXIST common\ace\LICENSE goto skip

echo ----- Please wait, initializing submodules for first launch -----

git submodule update --init --recursive

IF %ERRORLEVEL% NEQ 0 goto error

echo ------ Submodules installed ----

:skip
PATH=%PATH%:common\nodebuilds\win32\node;
common\nodebuilds\win32\node bin/cloud9.js -a"cmd /c start"
IF %ERRORLEVEL% EQ 0 goto exit

:error
echo "Something failed unfortunately, please try a clean clone"
pause

:exit