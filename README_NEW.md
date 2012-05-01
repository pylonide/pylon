Cloud9 IDE
==========

The open source Cloud 9 IDE.


Development Setup & Workflow
============================

Requirements:

  * NodeJS >= 0.6.15
  * Sourcemint: `npm install -g sm`

Setup:

    sm clone --dev https://github.com/ajaxorg/cloud9/tree/plugins2 cloud9
    cd cloud9

Workflow:

    # Update dependencies:
    
    sm update
    
    # Setup dependency for editing:
    
    sm status
    sm edit <dependency>
    
    # Start IDE:
    
    npm start
    
    # To commit:
    
    sm fix
    
    # All clean?:
    
    sm status

Run it:

```bash
$ node server.js
```

Options:

* `-w /path/to/project` Open a different workspace (broken)
* `-p 1234` Listen on a different port, default is 3131