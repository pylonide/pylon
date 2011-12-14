Oni Apollo - Multi-Platform StratifiedJS Implementation
=======================================================

Oni Apollo is a [StratifiedJS](http://stratifiedjs.org) implementation
+ a supporting set of modules. It runs server-side (based on NodeJS)
as well as client-side (cross-browser).

For an overview see [onilabs.com/apollo](http://onilabs.com/apollo).

Please post questions to the [Apollo Google Group](http://groups.google.com/group/oni-apollo/topics).

oni-apollo.js
-------------

 - Client-side cross-browser StratifiedJS runtime.
 - ~15kB gzipped, MIT-licensed.
 - For more information please read the docs at [onilabs.com/apollo](http://onilabs.com/apollo).

oni-apollo-node.js, 'apollo' executable
---------------------------------------

 - Server-side StratifiedJS runtime for NodeJS.
 - If you've got NodeJS installed, just run `apollo` to get a serverside SJS REPL.
 - See also this [Apollo Google Group post](https://groups.google.com/forum/#!topic/oni-apollo/ZDkxczAZcgw)

rocket, rocket-modules/
-----------------------

 - A simple web server

modules/
--------

 - 'Oni Apollo Standard Module Library'
 - All MIT-licensed. 
 - Runs server-side or client-side.
 - Documentation at [onilabs.com/modules](http://onilabs.com/modules).

src/
----

 - build tools and source code from which oni-apollo.js and
   oni-apollo-node.js are assembled.


How to build
------------

Everything is already pre-built. 

No need to compile anything unless you change something in the src/
directory. In that case, you can use the src/build/make-apollo tool to
reassemble oni-apollo.js and oni-apollo-node.js. The build process
should work on most unixy environments out of the box (in particular
it requires CPP - the C preprocessor).


How to run/install
------------------

No need to install anything.

For server-side use, you can just execute the `apollo` executable
(provided you have nodejs installed).

Alternatively you can install with npm (see the package.json script).

For client-side use, just include the oni-apollo.js file in your html,
as described at [onilabs.com/apollo](http://onilabs.com/apollo).


Considerations for client-side use
----------------------------------

Note that, by default, if you load standard library modules using code
such as

    var http = require('apollo:http');

the module will be requested from 

    LOCATION_WHERE_ONI_APOLLO_JS_WAS_LOADED_FROM/modules

This location can only be inferred if you load oni-apollo.js in the
'normal' way. If you rename oni-apollo.js to something else, or you
don't load it through a &lt;script> tag, you'll need to manually
configure the 'apollo' hub before you can make calls such as
`require('apollo:http')`.

To (re-)configure the 'apollo hub', you can use code such as this:

    require.hubs.unshift( 
      ["apollo:", 
       "http://code.mydomain.com/apollo-mirror/modules/"] 
      ]);
    // all modules addressed as 'apollo:' will now be loaded from the
    // location above.

Note that many browsers cannot load modules over the `file:`
protocol. You can use `rocket` to serve up the apollo directory
locally. Alternatively, you can serve oni-apollo.js and the modules/
directory with a different web server, or load oni-apollo.js &
modules/ from http://code.onilabs.com/ as described at
[onilabs.com/apollo](http://onilabs.com/apollo).

