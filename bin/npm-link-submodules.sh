#!/bin/sh

cd `dirname $0`/..

git submodule update --init --recursive

cd support/architect
npm link
cd ../..

cd support/ace
npm link
cd ../..

cd support/jsdav
npm link
cd ../..

npm link architect
npm link ace
npm link jsDAV

npm install