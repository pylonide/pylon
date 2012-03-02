@echo off
cd %~dp0..
IF EXIST support\ace\LICENSE goto skip

echo --- Initializing submodules for first launch, this can take a few minutes ---

start cmd /c git submodule update --init --recursive

IF %ERRORLEVEL% NEQ 0 goto exit

echo ------ Submodules installed ----

:skip
echo ------ Starting Cloud9 server ------

start support\node-builds\win32\node bin/cloud9.js -a "cmd /c start"

IF %ERRORLEVEL% NEQ 0 goto exit

:error
echo "Something failed unfortunately, please try a clean clone"
pause

:exit