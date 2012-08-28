"use strict";

var util = require("util");
var https = require("https");
var Path = require("path");

var Plugin = require("../cloud9.core/plugin");
//var c9util = require("../cloud9.core/util");

var fsnode = require("vfs-nodefs-adapter");
var fs;

var name = "salesforce";
//var ProcessManager;
//var EventBus;

module.exports = function setup(options, imports, register) {
    //imports.ide.getProjectDir(function(err, projectDir) {
     //   if (err) return register(err);

        fs = fsnode(imports.vfs, './');
        imports.ide.register(name, SalesForce, register);
    //});
    
    
    //ProcessManager = imports["process-manager"];
    //EventBus = imports.eventbus;
    //console.log(imports);
    //imports.ide.register(name, SalesForce, register);
};

var SalesForce = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    //this.pm = ProcessManager;
    //this.eventbus = EventBus;
    //this.workspaceId = workspace.workspaceId;
    //this.channel = this.workspaceId + "::salesforce";

    this.hooks = ["command"];
    this.name = "salesforce";

    //this.processCount = 0;
};

util.inherits(SalesForce, Plugin);

(function() {

    this.init = function() {
        //var self = this;
        
        //TODO DO i need this?
        /*
        this.eventbus.on(this.channel, function(msg) {
            if (msg.type == "shell-start")
                self.processCount += 1;

            if (msg.type == "shell-exit")
                self.processCount -= 1;

            self.ide.broadcast(JSON.stringify(msg), self.name);
        });
        */
    };

    this.command = function (user, message, client) {
        var self = this;
        var cmd = message.command ? message.command.toLowerCase() : "";

        //console.log("Got command", cmd);
        if (cmd !== "salesforce")
            return false;

        var type = message.type ? message.type.toLowerCase() : "";
        
        if (type === 'authenticate') {
            this.authenticateOrganization(message.values);   
        } else if (type === 'query') {
            var options = {
                //TODO I could probably cache these on the server
                access_token : message.token,
                instance_url : message.instance
            };
            
            //this.query('ApexClass', ['Id', 'Name'], null, options, function(records) {
                var folder = this.ide.workspaceDir + "/ApexClasses";
                console.log(folder);

                fs.exists(Path.dirname(folder), function(exists) {
                    console.log("Exists", exists, Path.dirname(folder));
                });
                fs.exists(folder, function(exists) {
                    console.log('ApexClasses exists = ', exists, folder);
                    if (exists) {
                        return;
                    }
                    fs.mkdirP(folder, function(err) {
                        console.log(err);
                        if (!err) {
                            console.log('success');
                            //renameFn();
                        }
                    });
                });
                /*
                self.ide.broadcast(JSON.stringify({
                    type : self.name,
                    subType : 'queryResults',
                    records : records
                }), self.name);
                */
            //});   
        }

        // Only send back to originator of message
        //client.send();
        // Send it to everyone
        /*
        this.ide.broadcast(JSON.stringify({
            type : this.name,
            message : message,
            extra : "extra data"
        }), this.name);
        */
        console.log("MESSAGE FROM CLIENT", message);
        return true;
    };
    
    var createRequest = function(options, callback) {
        /*
        var instance = decodeURIComponent(settings.get('instance_url'));
    
        var options = {
            host: //instance.substring(instance.indexOf('/')+2),
            //port: '80',
            path: path,
            method: method,*/
        options.host = options.instance_url;
        options.headers = {
            'Authorization': 'Bearer ' + options.access_token,//decodeURIComponent(settings.get('access_token')),
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        };
        //};
        
        var req = https.request(options, function(response) {
            var data = '';
            
            response.on('data', function(d) {
                data += d;
            });
    
            response.on('end', function() {
                var results = JSON.parse(data);
    
                if (results[0] && results[0].errorCode) {
                    console.log(results[0].errorCode + ' : ' + results[0].message);
                    return;
                }
                
                if (callback && callback.call) {
                    callback(results);
                }
            });
        });
        req.on('error', function(e) {
            console.log(e);
        });
        return req;
    };
    
    var getRequest = function(options, callback) {
        options.method = 'GET';
        var req = createRequest(options, callback);
        req.end();
    };
    
    this.query = function(entity, fields, where, options, callback) {
        console.log('\n----- Query for entitiy ------');
        
        var query = 'SELECT '+fields.join(',')+' FROM ' + entity + (where ? ' WHERE '+where : '');
        console.log(query);
        
        //TODO When I get the prerel org, I need to change it to version 25, and add "tooling"
        options.path = '/services/data/v25.0/query/?q='+encodeURIComponent(query);
        
        //console.log(encodeURIComponent(query));
        getRequest(options, function(results) {
            var records = results.records ? results.records : [];
            /*
            console.log(results);
    
            for(var r = 0; r < records.length; r++) {
                console.log('Record ' + r + ': ');
                for(var f = 0; f < fields.length; f++) {
                    console.log('     ' + fields[f] + ' = ' + records[r][fields[f]])
                }
            }
            */
            if (callback && callback.call) {
                callback(records);
            }
        });
    };
    
    // Must be in the format <id>=<value>&...
    var parseSettingString = function(data) {
            var resObj = {};
            
            if (data && typeof data === 'string') { 
                var results = data.split('&');
                
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    var id = result.substring(0, result.indexOf('='));
                    resObj[id] = result.substring(id.length + 1);
                }
            }
            return resObj;
    };
    
    this.authenticateOrganization = function(options) {
        
        console.log(options);
        
        if (!options) return;
        
        var redirectUri = 'https://ec2-23-22-63-218.compute-1.amazonaws.com:3131/';

        var urlParams = {
            host: 'test.salesforce.com',
            path: '/services/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Accept' : 'application/x-www-form-urlencoded'
            }
        };
    
        var _self = this;
        
        /*Send it to the client 
        _self.ide.broadcast(JSON.stringify({
            type : this.name,
            values : {
                name : 'sdf',
                token : 'sdfa'
            }
            //message : message,
            //extra : "extra data"
        }), this.name);
        */
        var req = https.request(urlParams, function(response) {
            var data = '';
            //console.log('AUTH-STATUS: ' + response.statusCode);
            //console.log('AUTH-HEADERS: ' + JSON.stringify(response.headers));
    
            // Should only be called once for this request
            response.on('data', function(d) {
                data += d;
            });
    
            response.on('end', function() {
                // The token and instance are in the response data, 
                // so let's add it to the settings and write it
                
                var resObj = parseSettingString(data);
                console.log(resObj);
                
                if (resObj.access_token) {
                    var instance = decodeURIComponent(resObj.instance_url);
                    instance = instance.substring(instance.indexOf('/')+2);
                    
                    //!! This gets logged
                    //console.log(instance);
                    
                    //Send it to the client 
                    _self.ide.broadcast(JSON.stringify({
                        type : _self.name,
                        subType : 'authenticated',
                        values : {
                            name : options.name,
                            token : decodeURIComponent(resObj.access_token),
                            instanceUrl : instance
                        }
                    }), _self.name);
                } else {
                    _self.ide.broadcast(JSON.stringify({
                        type : _self.name,
                        subType : 'authenticated',
                        error : resObj.error
                    }), _self.name);
                
                    console.log('Arg! ' + resObj.error.message);
                }
                
                
            });
            
        });
        
        //We need these POST parameters for the authentication
        req.write(
            'client_id='+options.consumerKey+
            '&client_secret='+options.consumerSecret+
            '&redirect_uri='+redirectUri+
            '&grant_type='+'password'+
            '&username='+options.username+
            '&password='+options.password+options.securityToken
        );
            
        req.on('error', function(e) {
            _self.ide.broadcast(JSON.stringify({
                    type : _self.name,
                    subType : 'authenticated',
                    error : e
                }), _self.name);
            
            console.log('Arg! ' + e.message);
        });
        req.end(); 
    };
    
    
    //If I want to tie into the command line?
/*
    var githelp     = null;
    var commandsMap = {
            "default": {
                "commands": {
                    "[PATH]": {"hint": "path pointing to a folder or file. Autocomplete with [TAB]"}
                }
            }
        };

    this.$commandHints = function(commands, message, callback) {
        var self = this;

        if (!githelp) {
            githelp = {};
            this.pm.exec("shell", {
                command: "git",
                args: [],
                cwd: message.cwd,
                env: this.gitEnv
            }, function(code, out, err) {
                if (!out && err)
                    out = err;

                if (!out)
                    return callback();

                githelp = {"git": {
                    "hint": "the stupid content tracker",
                    "commands": {}
                }};
                out.replace(/[\s]{3,4}([\w]+)[\s]+(.*)\n/gi, function(m, sub, hint) {
                    githelp.git.commands[sub] = self.augmentCommand(sub, {"hint": hint});
                });
                onfinish();
            }, null, null);
        }
        else {
            onfinish();
        }

        function onfinish() {
            c9util.extend(commands, githelp);
            callback();
        }
    };

    this.augmentCommand = function(cmd, struct) {
        var map = commandsMap[cmd] || commandsMap["default"];
        return c9util.extend(struct, map || {});
    };
*/
    this.canShutdown = function() {
        //TODO what is this for?
        return false;//this.processCount === 0;
    };

}).call(SalesForce.prototype);
