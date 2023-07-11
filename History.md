v2.10.0
=======
- Overall dependency updates (chore)
- Ace upgrade to `v.1.23.2` #347
- Slow initial session creation fix #350

v2.9.0
======
* Includes integration with ACE `v1.13.1` #279 
* Cutting out of maintenance Node.JS support, new minimum node requirement `v14.21.1`
* Addresses moderate vulnerability in Passport `< v0.6.0` concerning Session Fixation (session regeneration when a users logs in or out)
    * Weakness: [CWE-384](https://cwe.mitre.org/data/definitions/384.html)
    * Vulnerability: [CVE-2022-25896](https://www.cve.org/CVERecord?id=CVE-2022-25896)
* xterm.js `v5.0.0` upgrade
* Other dependency updates

v2.8.0
======
* Remediates security vulnerabilities reported in 3rd party packages.
* Notable upgrades to: passport, engine.io, xterm, yargs, jsdav, vfs, ace, xmldom
* iOS: Preferences page is not scrollable #41

v2.7.0
======
* Cutting the support for Node.js v10 #192
* Minimum node.js version set to v12.22.1
* Deprecate the use of optimist #157 #194
* Removal of nodeunit dependency #195
* New scoped packages instead of direct github linking
    * @pylonide/architect-build
    * @pylonide/smith
    * @pylonide/treehugger
    * @pylonide/v8debug
* Notable dependency upgrades:
    * Engine.io v5.1.1
    * xterm v4.13.0
* form-auth promoted to default authentication plugin 

v2.6.0
======
* APF usage deprecated #93
* Cutting the support of the following old Node.js versions #122:
    * v4, v5, v6, v7, v8, v9)
* Node.JS v10 required going forward
* Upgrade to ACE v1.4.12
* Notable dependency upgrades:
    * Engine.io v4.0.0
    * xterm v4.9.0
* New @pylonide scoped dependencies:
    * @pylonide/vfs-architect
    * @pylonide/vfs-nodefs-adapter

v2.5.0
======
* Dark themed file browser, ui enhancements
* Further namespace changes to Pylon #48
* APF Merged into Pylon IDE as PPC #66
* Connect middleware gets redirect() support #67
* Support for Forms authentication #69
* Removal of apf-packager and apf dependencies #87
* cozy-jsdav-fork dependency changed to @pylonide/jsdav for enhanced security
* dryice dependency changed to @pylonide/dryice for enhanced security
* Pylon namespace changes
* Upgrade to ACE v1.4.5
* Dependency upgrades and security enhancements
* One of the last releases to remain compatible with End-of-Life Releases of Node.js:
    * v4
    * v5
    * v6
    * v7

v2.4.0
======
* Further namespace changes to Pylon
* appCache capability check #57
  * appCache has been disabled on non-secure connections in modern browsers
* Fix for startup directory creation #59
* Fix for memory leak and improvements to file upload cancellation #61
* Support upload of large files (< 1.5GB) #63
* Upgrade to ACE v1.4.2
* Drop Firefox Quantum starting from v64.0 due to broken experience #65

v2.3.1
======
* Make it possible to install Pylon via NPM (intended for further testing)

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
