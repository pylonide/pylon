# Cloud9 IDE

The Cloud9 IDE is an open source project started by [ajax.org], built on top of [Node.JS].

This Integrated Development Environment aims to bring all great features from other existing IDE's and source code editors like Eclipse, Netbeans, Textmate, and many others together, bundled as plugins.
Cloud9's main focus is on Javascript development, it is able to set a new standard for client and server development integration.

And if you find that functionality is missing? Just write a plugin and patch it yourself!

Written in Javascript, for Javascripters.

## Features

  * High performance text editor with bundled syntax highlighting support for JS, HTML, CSS and mixed modes.
  * Integrated debugger for [Node.JS] applications which can be started, paused and stopped from within the IDE
  * Local filesystem is exposed through [WebDAV](http://en.wikipedia.org/wiki/WebDAV) to the IDE, which makes it possible to connect to remote workspaces as well
  * Highly extensible through the plugin system
  * Bundled plugins: browser, clipboard, code (editor), console, debugger, docs, editors, filesystem, html, keybindings, newresource, noderunner, panels, refactor, richtext, save, searchreplace, settings, tree, undo

## Browser Support
We are developing on firefox and chrome and this is a development repo, other browsers might be less stable until a proper release.

## Usage

After a Git checkout of the project or download (see Installation section), the command you need to run the IDE locally is the following:

To start cloud9 and install all submodules you can use the quickstart options for your platform on the console or from your explorer/finder and opens it in your default browser:

Linux and OSX:

    $ bin/cloud9.sh

Windows:

    > bin\cloud9-win32.bat

Note you'll need a git version 1.7 or higher to use the stock shell script provided.

If you want to start it manually try:

    $ node bin/cloud9.js

This runs the IDE with itself set as the workspace. When you open the url 

    http://localhost:3000
    
in your browser, it will show the directory structure of the current workspace in a tree. Since none is provided by the startup command above, it will show the IDE directory contents as a default workspace.

You can specify your own workspace as follows:

    $ node bin/cloud9.js -w /path/to/your/awesome/workspace

And as a result the tree will display the contents of that directory.

You can specify the ip cloud9 is listening to using:

    $ node bin/cloud9.js -l 192.168.2.1

Or specify to listen to all ip's

    $ node bin/cloud9.js -l all

To see more usage information and additional command line options use.

    $ node bin/cloud9.js -h

## Installation

Via git (or downloaded tarball):

    $ git clone git://github.com/ajaxorg/cloud9.git

Via [npm](http://github.com/isaacs/npm):

    $ npm install cloud9

## Startup errors: Binaries and node.js

Starting Cloud9 using cloud9.sh or .bat uses nodejs and node-o3-xml binaries that are distributed with Cloud9.
We have included binaries for OSX 64 bit Intel (10.5/10.6), 32 and 64 bit Ubuntu and Windows 32 bit.
All binaries are based on node 0.2.x latest stable.
If you get an error about unable to load o3-xml or an architecture error, you will need to compile nodejs and node-o3-xml yourself and put it in the right directory of cloud9. For information how to compile node, please check www.nodejs.org. You will need to compile and install nodejs before you can compile node-o3-xml.

    $ git clone http://github.com/ajaxorg/o3
    $ cd o3
    $ ./tools/node_modules_build
    $ cp build/default/o3.node cloud9dir/support/jsdav/support/node-o3-xml-v4/lib/o3-xml/

after this you can start cloud9 manually using node bin/cloud9.js

## How to compile a custom node.js binary

There is a known V8 bug in the 0.2.x banch of node, which prevents the debugger from working under Linux. To work around this bug the node binary has to be compiled with gcc 4.4:

    $ export GCC_VERSION=44
    $ configure
    $ make

## Documentation

Documentation is in the making. 

## Open Source Projects Used

The Cloud9 IDE couldn't be this cool if it weren't for the wildly productive [Node.JS] community producing so many high quality software.
Main projects that we use as building blocks:

  * [async.js] by [fjakobs]
  * [jsDAV] by [mikedeboer]
  * [connect] by [senchalabs](http://github,com/senchalabs)
  * [socket.io] by [LearnBoost](http://github.com/LearnBoost)
  * [ace](http://github.com/ajaxorg/ace) by [fjakobs]
  * [apf](http://www.ajax.org) by [ajax.org]
  * and of course [Node.JS]!
  
Thanks to all developers and contributors of these projects! 

[fjakobs]: http://github.com/fjakobs
[javruben]: http://github.com/javruben
[mikedeboer]: http://github.com/mikedeboer
[ajax.org]: http://www.ajax.org/
[async.js]: http://github.com/fjakobs/async.js
[jsDAV]: http://github.com/mikedeboer/jsdav
[connect]: http://github.com/senchalabs/connect
[socket.io]: http://github.com/LearnBoost/Socket.IO-node.git
[requireJS]: http://requirejs.org/
[Node.JS]: http://nodejs.org/

## License

The GPL version 3, read it at [http://www.gnu.org/licenses/gpl.txt](http://www.gnu.org/licenses/gpl.txt)

##Contributing

Cloud9 wouldn't be where it is now without contributions. Feel free to fork and improve/enhance Cloud9 in any way your want. If you feel that the Cloud9 community will benefit from your changes, please open a pull request. To protect the interests of the Cloud9 contributors and users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is the simplest of agreements, requiring that the contributions you make to an ajax.org project are only those you're allowed to make. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes ten minutes, and only needs to be completed once.  There are two versions of the agreement:

1. [The Individual CLA](https://github.com/ajaxorg/cloud9/raw/master/doc/Contributor_License_Agreement-v2.pdf): use this version if you're working on an ajax.org project in your spare time, or can clearly claim ownership of copyright in what you'll be submitting.
2. [The Corporate CLA](https://github.com/ajaxorg/cloud9/raw/master/doc/Corporate_Contributor_License_Agreement-v2.pdf): have your corporate lawyer review and submit this if your company is going to be contributing to ajax.org projects

If you want to contribute to an ajax.org project please print the CLA and fill it out and sign it. Then either send it by snail mail or fax us or send it back scanned (or as a photo) by email.

Email: info@ajax.org

Fax: +31 (0) 206388953

Address: Ajax.org B.V.
  Keizersgracht 241
  1016 EA, Amsterdam
  the Netherlands
