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
