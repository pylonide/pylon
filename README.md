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

Requirements:

  * NodeJS `>= 0.6.16`
  * NPM `>= 1.1.16`
  * libxml-dev

Install:
```sh
# Be sure you have sourcemint installed:
npm install -g sm

# Then:
sm clone --dev https://github.com/ajaxorg/cloud9/tree/master cloud9

# or
git clone https://github.com/ajaxorg/cloud9.git cloud9
cd cloud9
sm install
```


The above install steps create a `cloud9` directory in your current directory. Just `cd` into it
and run `bin/cloud9.sh` to start:

    cd cloud9
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

## Updating

To update to the latest version (if this doesn't work, just make a fresh clone):

    git pull
    sm update

`sm update` does not currently install missing npm dependencies. To do so use:

    sm install

## Development

To work on a subcomponent that is copied into node_modules, you can use `sm edit`.
For instance, to work on ACE, run the following from the checkout root:

    sm edit ace

This is somewhat equivalent to `npm link` but instead of linking to a system wide
shared package it clones the source into the node_modules/<name> directory.
The idea is to only "edit" when you need to make changes and when done issue
"sm save <name>" (not yet implemented) which will pull up sourcetree to commit,
push code and switch package back to read mode (frozen). The status page

    sm status

shows problematic and improvement oriented action steps to improve the state of
the program. These relate to git status and dependency changes that need to be
made to bring the dependencies up to date and ready to publish which leads to deployment.

The line on the status page will have a (W) if it is setup for editing.

To launch Sourcetree for all dirty/ahead repositories in the dependency
tree use (need to have Sourcetree command-line tools installed (`stree`)):

    sm fix

The sourcemint package manager works alongside NPM so to link in a
(system-wide shared) NPM package use:

    rm -R node_modules/architect
    npm link architect

`sm` always works on your program sub-tree other than pulling things in
from the cache.

To view help info for cloud9 use:

    sm help

To view usage info for `sm` use:

    sm -h

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
