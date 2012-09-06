"use strict";

var util = require("util");
//var https = require("https");
var path = require("path");

var Plugin = require("../cloud9.core/plugin");
//var c9util = require("../cloud9.core/util");

var fsnode = require("vfs-nodefs-adapter");
var fs;

var sfdcUtil = require('./SfdcToolingApi/Util');
var Entity = require('./SfdcToolingApi/ToolingEntities');


var name = "salesforce";
//var ProcessManager;
//var EventBus;

module.exports = function setup(options, imports, register) {
    imports.sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);

        fs = fsnode(imports.vfs, projectDir);
        imports.ide.register(name, SalesForce, register);
    });
    
    
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
        var _self = this;
        var cmd = message.command ? message.command.toLowerCase() : "";

        
        if (cmd !== "salesforce")
            return false;
        var type = message.type ? message.type.toLowerCase() : "";
        
        console.log("Got command: " + cmd + ' with type ' + type);
        
        if (type === 'authenticate') {
            this.authenticateOrganization(message.values);   
        } else if (type === 'query') {

            var folder = this.ide.workspaceDir + "/ApexClasses"; 
            console.log(folder);

            this.onDir(folder, function() {
                _self.syncEntityFolder(folder, Entity.types[0]);
            });
        } else if (type === 'downloadlog') {
            Entity.ApexLogs.downloadLog(message.logId, function(logData) {
                //console.log(logData);
            });
        } else if (type === 'compile') {
            var mcName = 'SymbolTableContainer';
            //Replace the name with message.name;
            
            //var apexClass = this.entities['ApexClasses']['MonitorAPIRequest'];
            //console.log(message.name);
            //console.log(message.body);
            Entity.ApexClasses.query(['Id', 'Name', 'Body'], 'Name = \''+message.name+'\'', function(records) {
                if (records.length > 0) {
                    //TODO I should really have the records returned be instances of the type queried
                    var apexClass = new Entity.ApexClass(records[0]);
                    apexClass.set('Body', message.body);
                    
                    _self.getContainer(mcName, function(mc) {
                        _self.getMember(mc, apexClass, function(mcm) {
                            _self.compile(mc, mcm, function(results) {
                                console.log('Compile results');
                                console.log(results);
                                if (results.symbolTable) {
                                    _self.sendAction('compile', { symbolTable : results.symbolTable });
                                    //var path = folder + '/' + apexClass.get('Name') + '.st';
                                    //fs.writeFile(path, JSON.stringify(results.symbolTable, null, 4), emptyCallback);
                                    //results.cont(success, results.symbolTable);
                                }
                                if (results.error) {
                                    _self.sendAction('compile', { error : results.error });
                                    //sfdcUtil.cont(failure, results.error);
                                }
                            });
                        });
                    });
                }
            });
            
//            
//            apexClass.
//            this.getSymbolTableOnFirstClassInEntities('ApexClasses', function(symbolTable) {
//                _self.sendAction('compile', { symbolTable : symbolTable });
//            }, function(error) {
//                _self.sendAction('compile', { error : error });
//            });
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
        //console.log("MESSAGE FROM CLIENT", message);
        return true;
    };
    
    /**
     * Run a task on a directory. If the directory doesn't exist, it will be created.
     */
    this.onDir = function(dir, task) {
        path.exists(dir, function(exists) {
            if (!exists) {
                console.log('Making dir ' + dir);
                fs.mkdir(dir, task);
            } else {
                console.log('Found dir ' + dir);
                sfdcUtil.cont(task);
            }
        });   
    };
    
    this.authenticateOrganization = function(options) {
        if (!options) { return; }
        
        var _self = this;
        Entity.api.authenticate(options, function(authResponse) {
            
            var instance = decodeURIComponent(authResponse.instance_url);
            instance = instance.substring(instance.indexOf('/')+2);

            //Send it to the client
            _self.sendAction('authenticated', { values : {
                name : options.name,
                token : decodeURIComponent(authResponse.access_token),
                instanceUrl : instance
            }});
        }, function(err) {
            var error = '';
            if (err && err.error) {
                error += decodeURIComponent(err.error) + ': ' + decodeURIComponent(err.error_description);
            } else if (err instanceof 'object') {
                error = JSON.stringify(err);
            } else {
                error = err;
            }
            
            _self.sendAction('authenticated', {error : error});
        }); 
    };
    
    this.sendAction = function(action, values) {
        var actionRequest = sfdcUtil.union(values, {
            type : this.name,
            subType : action
        });
        
        this.ide.broadcast(JSON.stringify(actionRequest), this.name);
    };
    
    var emptyCallback = function() {};
    this.entities = {};
    //Should generate entities based on project structure too
    
    
    this.containerCache = {};
    /**
     * Get or create a MetadataContainer with the given name
     */
    this.getContainer = function(/* String */ name, /* function */ callback) {
        if (this.containerCache[name]) {
            console.log('Using container cache');
            sfdcUtil.cont(callback, this.containerCache[name]);
            return;
        }
        var _self = this;
        Entity.MetadataContainers.query(['Id', 'Name'], "Name='" + name + "'", function(containers) {
            //console.log(containers);
            var mc;
            if (containers.length === 0) {
                mc = new Entity.MetadataContainer({Name : name});
                mc.create(function(data) {
                    _self.containerCache[name] = mc;
                    sfdcUtil.cont(callback, mc);
                });
            } else {
                mc = new Entity.MetadataContainer(containers[0]);
                _self.containerCache[name] = mc;
                sfdcUtil.cont(callback, mc);
            }
        });
    };
    
    this.memberCache = {};
    this.getMember = function(mc, entity, callback) {
        var id = entity.get('Id');
        var mcm;
        if (this.memberCache[id]) {
            console.log('Using member cache');
            mcm = this.memberCache[id];
            mcm.set('Body', entity.get('Body'));
            mcm.update(function() {
                sfdcUtil.cont(callback, mcm);
            });
            return;
        }
        var _self = this;
        Entity.MetadataContainerMembers.query(
            ['Id', 'MetadataContainerId', 'ContentEntityId', 'Body', 'SymbolTable'], 
            "MetadataContainerId='" + mc.get('Id') + "' AND ContentEntityId='" + entity.get('Id') + "'", 
            function(members) {
                
                if (members.length === 0) {
                    mcm = new Entity.MetadataContainerMember({
                        MetadataContainerId : mc.get('Id'),
                        ContentEntityId : entity.get('Id'),
                        Body : entity.get('Body')
                    });
                    mcm.create(function(data) {
                        _self.memberCache[id] = mcm;
                        sfdcUtil.cont(callback, mcm);
                    });
                } else {
                    mcm = new Entity.MetadataContainerMember(members[0]);
                    //Update the member with the new body
                    //console.log(entity.get('Body'));
                    mcm.set('Body', entity.get('Body'));
                    mcm.update(function() {
                        _self.memberCache[id] = mcm;
                        sfdcUtil.cont(callback, mcm);
                    });
                }
            }
        );
    };
    
    var waitForDeployToFinish = function(car, callback) {
        car.refresh(function() {
            var state = car.get('State');
            console.log(state);
            if (state !== 'Queued' && state !== 'InProgress') {
                sfdcUtil.cont(callback, car);
            } else {
                setTimeout(function() {waitForDeployToFinish(car, callback);}, 1000);
            }
        });
    };
    
    this.deployContainer = function(mc, save, callback) {
        var car = new Entity.ContainerAsyncRequest({
            MetadataContainerId : mc.get('Id'),
            isCheckOnly : !save//true
        });
        car.create(function () {
            var id = car.get('Id');
            console.log(id);
            //Need to poll to check the results
            waitForDeployToFinish(car, function() {
                //TODO might want to send back the async request?
                sfdcUtil.cont(callback, car);
            });
        });  
    };
    
    this.compile = function(mc, mcm, callback) {
        var _self = this;
        this.deployContainer(mc, false, function(car) {
            var compileResults = {};
            compileResults.Id = mc.get('ContentEntityId');
            if (car.get('State') === 'Error') {
                //console.log(car);
                var error;
                
                try {
                    error = JSON.parse(car.get('CompilerErrors'));
                    //TODO this will only work for compiling one class at a time. Need to change it to handel multiple saves
                    if (error && error.length > 0) {
                        error = error[0];
                    }
                } catch(e) {}
                if (!error) {
                    error = car.get('ErrorMsg');
                }
                compileResults.error = error;
                //console.log(compileResults.error);
                //_self.sendAction('compileFinished', compileResults);
                sfdcUtil.cont(callback, compileResults);
            } else {
                //TODO also send something to the client to update something?
            
                //Refresh the member to get the latest symbol table
                mcm.refresh(function() {
                    //console.log(JSON.stringify(mcm, null, 4));
                    compileResults.symbolTable = JSON.parse(mcm.get('SymbolTable'));
                    _self.sendAction('compileFinished', compileResults);
                    sfdcUtil.cont(callback, compileResults);
                });
            }
        });
    };
    
    this.getSymbolTable = function(folder, apexClass, success, failure) {
        var _self = this;
        var mcName = 'SymbolTableContainer';
        _self.getContainer(mcName, function(mc) {
            _self.getMember(mc, apexClass, function(mcm) {
                _self.compile(mc, mcm, function(results) {
                    if (results.symbolTable) {
                        var path = folder + '/' + apexClass.get('Name') + '.st';
                        fs.writeFile(path, JSON.stringify(results.symbolTable, null, 4), emptyCallback);
                        results.cont(success, results.symbolTable);
                    }
                    if (results.error) {
                        sfdcUtil.cont(failure, results.error);
                    }
                });
            });
        });
    };
    
    this.getSymbolTableOnFirstClassInEntities = function(folder, success, failure) {
        for (var className in this.entities.ApexClasses) {
            //console.log(this.entities.ApexClasses[className]);
            //TODO When I change this to iterate over all classes and triggers, I need to change the success and failure to happen on each one and at the end
            this.getSymbolTable(folder, this.entities.ApexClasses[className], success, failure);
            //TODO Only get one symbol table because I haven't build in the logic to attach muliple members on the same container
            break;
        }
    };
    
    //new Entity.ContainerAsyncRequest({Id : '1drD000000000LfIAI'}).refresh();
    /*
    Entity.ApexClasses.query(['Id', 'Name', 'Body'], null, function(classes) {
        getSymbolTable(new Entity.ApexClass(classes[0]));
    });
    */
    this.syncEntityFolder = function(path, typeInfo) {
        var _self = this;
        var pluralName = typeInfo.plural;
        Entity[pluralName].describe(function(data) {
            _self.entities[pluralName] = [];
            var fields = data.fields;
            
            fs.writeFile(path + '/' + '_describe.json', JSON.stringify(data, null, 4), emptyCallback);
            
            var fieldNames = sfdcUtil.getNames(fields);
            Entity[pluralName].query(fieldNames, null, function(records) {
                console.log('Found ' + records.length + ' ' + pluralName);
                for (var i = 0; i < records.length; i++) {
                    var data = records[i];
                    _self.entities[pluralName][data.Name] = new Entity[typeInfo.name](data);
                    if (typeInfo.fileBodyField && typeInfo.fileExtension) {
                        var fileName = data.Name + '.' + typeInfo.fileExtension;
                        var body = data[typeInfo.fileBodyField];
                        fs.writeFile(path + '/' + fileName, body, emptyCallback);
                        //No need to have this in the JSON too. Maybe use delete?
                        data.Body = 'In file ' + fileName;
                    }
                    //console.log(_self.entities[pluralName][data.Name].get('Body'));
                    fs.writeFile(path + '/' + (data.Name ? data.Name : data.Id) + '.json', JSON.stringify(data, null, 4), emptyCallback);
                }
                //TODO Check this differently than checking the type here
                if (pluralName === 'ApexClasses') {
                    _self.getSymbolTableOnFirstClassInEntities(path);
                }
            });
        });
    };
    

    this.canShutdown = function() {
        //TODO what is this for?
        return false;//this.processCount === 0;
    };

}).call(SalesForce.prototype);
