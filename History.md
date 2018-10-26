v2.3.0
======
* Renaming the project to Pylon IDE - Minimum set of changes #48
* Publishing to NPM as global "pln" package

v2.2.2
======
* Fix to be able to close tabs with image view #46
* Should compile now also on Ubuntu 16.04 and Node 10 by removing indirect dependency to gnu-tools #49
* Last release from exsilium/cloud9 repo as explained in issue #48

v2.2.1
======
* Improvements to UndoManager and APF ActionTracker usage (File editing status is correctly shown) #40 
* Fix for possible server crash when refreshing browser with terminals open #42 
* Dependency updates
* Gemnasium badge removal
* Includes ACE v1.3.3

v2.2.0
======
* Drop support for legacy node version v0.10, v0.11, v0.12, io.js
* Engine.io stack upgraded to v3.x
* Terminal now uses xterm project in favour of term.js
* new jsDAV
* Basic iPad Pro support with hw keyboard and touch controls
* Basic Microsoft Edge support
* Overall fixes and dependency updates
* Includes ACE 1.3.1

v2.1.6
======
* Dependency updates: async, engine.io, body-parser, connect, qs, serve-favicon
* TTY reconnects automatically when disconnection occurs
* Ace editor has webkit based scrollbars also for Firefox & Chrome
* Final release known to work with legacy unsupported Node.js versions:
    * v0.10 (End-of-Life: 2016-10-31)
    * v0.11 (Experimental development branch not supported)
    * v0.12 (End-of-Life: 2016-12-31)
    * io.js
* Going forward the above mentioned version support will be dropped. Cloud9v2 
  project will try to align with the [nodejs/LTS](https://github.com/nodejs/LTS)
  calendar. Minor version bump will occur whenever any node versions are being dropped.

v2.1.5
======
* Now works with Node.js v6.x branch
* Dependency updates: async 2.x, ace 1.2.x, engine.io 2.0
* User extensions are now loadable during run time
* Terminal works with 3rd level characters in international layout keyboards without country specific mapping
* PuTTY style mouse copy-paste feature implemented in terminal
    * Selecting text with left click copies content to clipboard
    * Right mouse click acts as paste in terminal input
* Terminal **allows remote connections** by default whenever Cloud9 is started with a non-localhost specific `-l <ip>`
* Reverse proxy is now supported. It is possible to configure Cloud9 to work behind a proxy (ie. nginx and https). Closes #13 

v2.1.4
======
* A surprise! The previous upstream author (c9) did some spring cleaning and broke
  some dependencies in the process
* Engine.io as well as other external dependencies received a version bump

v2.1.3
======
* The Connect middleware once again received a huge upgrade, this time to v3.4.1.
  Due to middleware architecture changes, many new additional packages were
  added as dependency:
    * cookie-parser
    * body-parser
    * serve-static
    * csurf
    * qs
    * parseurl
    * passport
    * passport-http
  connect.query() was backported from Connect v2
* Other dependencies were pumped to their newest and greatest versions
* Fix for Stream error: Upload timed out when uploading files
* Minor UI change
* Travis-CI improvements
* Repository is now detached from the original upstreadm

v2.1.2
======
* Connect is upgraded from v1.8.7 to more modern version of v2.29.1 this closes
  the Cross-Site scripting with connect.methodOverride() security alert
* Many dependencies were upgraded to newer versions

v2.1.1
======
* Travis-CI integration and small fixes

v2.1.0
======
* Node.JS Version 0.10 compatibility
* Terminal added (bash) that works in *x environments, sorry Windows, for now.

v2.0.94-final
=============
* Final official release with the state of upstream ajaxorg/cloud9
