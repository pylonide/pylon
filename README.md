**Issues on c9.io** If you have questions regarding the hosted service at [c9.io](http://c9.io)
including issues with accounts or payments,
please file them at [support.c9.io](http://support.cloud9ide.com/home) rather than as a
GitHub issue in this repository.

# Cloud9 IDE

Cloud9 is an open source IDE built with [Node.JS] on the back-end and JavaScript/HTML5 on the client.
It is very actively maintained by about 20 developers in both Amsterdam and San Francisco and is one
component of the hosted service at [c9.io](http://c9.io). The version available here runs on your local system.

Cloud9 balances the power of traditional desktop IDEs with the simplicity and elegance of editors
like TextMate and Sublime.

Cloud9 is built entirely on a web stack, making it the most hacker-friendly IDE today.
Fork it, hack it, and if you think others would benefit, issue a pull request on this repo
and we'll take a look. If you have any questions, meet us in #cloud9ide on irc.freenode.net
or ask us on Twitter [@Cloud9IDE](http://twitter.com/#!/Cloud9IDE).

Happy Coding!

## Features

  * High performance ACE text editor with bundled syntax highlighting support for JS, HTML, CSS and mixed modes.
  * Integrated debugger for [Node.JS] applications with views of the call stack, variables, live code execution and live inspector
  * Advanced Javascript language analysis marking unused variables, globals, syntax errors and allowing for variable rename
  * Local filesystem is exposed through [WebDAV](http://en.wikipedia.org/wiki/WebDAV) to the IDE, which makes it possible to connect to remote workspaces as well
  * Highly extensible through both client-side and server-side plugins
  * Sophisticated process management on the server with evented messaging

## Browser Support

We support the newer versions of Chrome, Firefox and Safari.

## Installation and Usage

If installing on Windows, please refer to [Installation on Windows](#installation-on-windows-experimental).

Requirements:

  * NodeJS `>= 0.6.16`
  * NPM `>= 1.1.16`
  * libxml2-dev

Install:

    git clone https://github.com/ajaxorg/cloud9.git
    cd cloud9
    npm install

The above install steps create a `cloud9` directory with a `bin/cloud9.sh`
script that can be used to start Cloud9:

    bin/cloud9.sh

Optionally, you may specify the directory you'd like to edit:

    bin/cloud9.sh -w ~/git/myproject

Cloud9 will be started as a web server on port `-p 3131`, you can access it by
pointing your browser to: [http://localhost:3131](http://localhost:3131)

By default Cloud9 will only listen to localhost.
To listen to a different IP or hostname, use the `-l HOSTNAME` flag.
If you want to listen to all IP's:

    bin/cloud9.sh -l 0.0.0.0

If you are listening to all IPs it is adviced to add authentication to the IDE.
You can either do this by adding a reverse proxy in front of Cloud9,
or use the built in basic authentication through the `--username` and `--password` flags.

    bin/cloud9.sh --username leuser --password c9isawesome

Cloud9 is compatible with all connect authentication layers,
to implement your own, please see the `plugins-server/cloud9.connect.basic-auth` plugin
on how we added basic authentication.

## Installation on Windows (experimental)

If you're running Cloud9 on Windows you'll have to follow these steps as well:

  * Install [Grep for Windows](http://gnuwin32.sourceforge.net/downlinks/grep.php)
  * Add `C:\Program Files (x86)\GnuWin32\bin` to your [PATH](http://www.computerhope.com/issues/ch000549.htm)
  * Open a new instance of `cmd` with elevated rights (right click 'Run as adminstrator')
  * Now follow the steps under 'Install'
  * *Please note that the `npm install` fails due to a libxml error, but you can ignore that for now.*

To start Cloud9, please don't start through `bin/cloud9.sh` but rather via:

    node server.js [args]

Please note that there will be errors displayed regarding the `find` command,
and that some features might not work.
Feel free to improve the Windows experience and open a pull request.

## Updating

To update to the latest version (if this doesn't work, just make a fresh clone):

    git pull
    npm update

`npm update` does not currently install missing dependencies. To do so use:

    npm install

## Open Source Projects Used

The Cloud9 IDE couldn't be this cool if it weren't for the wildly productive
[Node.JS] community producing so many high quality software.
Main projects that we use as building blocks:

  * [async.js] by [fjakobs]
  * [jsDAV] by [mikedeboer]
  * [connect] by [senchalabs](http://github.com/senchalabs)
  * [engine.io] by [LearnBoost](http://github.com/LearnBoost)
  * [smith.io](http://github.com/c9/smith.io) by [creationix](http://github.com/creationix) & [cadorn](http://github.com/cadorn)
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
[engine.io]: http://github.com/LearnBoost/engine.io
[requireJS]: http://requirejs.org/
[Node.JS]: http://nodejs.org/

## License

The GPL version 3, read it at [http://www.gnu.org/licenses/gpl.txt](http://www.gnu.org/licenses/gpl.txt)

## Contributing

Cloud9 wouldn't be where it is now without contributions. Feel free to fork and improve/enhance Cloud9 in any way your want. If you feel that the Cloud9 community will benefit from your changes, please open a pull request. To protect the interests of the Cloud9 contributors and users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is the simplest of agreements, requiring that the contributions you make to an ajax.org project are only those you're allowed to make. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes ten minutes, and only needs to be completed once.  There are two versions of the agreement:

1. [The Individual CLA](https://github.com/ajaxorg/cloud9/raw/master/doc/Contributor_License_Agreement-v2.pdf): use this version if you're working on an ajax.org project in your spare time, or can clearly claim ownership of copyright in what you'll be submitting.
2. [The Corporate CLA](https://github.com/ajaxorg/cloud9/raw/master/doc/Corporate_Contributor_License_Agreement-v2.pdf): have your corporate lawyer review and submit this if your company is going to be contributing to ajax.org projects

If you want to contribute to an ajax.org project please print the CLA and fill it out and sign it. Then either send it by snail mail or fax us or send it back scanned (or as a photo) by email. Please indicate a contact person or pull request your CLA relates to so we can quickly process and handle your agreement. Once you've submitted it, you no longer need to send one for subsequent submissions.

Email: CLA@c9.io

Fax: +31 (0) 206388953

Address: Cloud9 IDE
  Keizersgracht 241
  1016 EA, Amsterdam
  the Netherlands
