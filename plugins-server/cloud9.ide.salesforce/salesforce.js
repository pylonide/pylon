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
        var _self = this;
        Entity.api.failureHandler = function(error) {
            console.log('\nSend error to the client: '+error);
            _self.sendAction('serverError', { error : error});
        };
    };
    
    this.command = function (user, message, client) {
        var _self = this;
        var cmd = message.command ? message.command.toLowerCase() : "";

        
        if (cmd !== "salesforce")
            return false;
        var type = message.type ? message.type.toLowerCase() : "";
        
        //console.log("Got command: " + cmd + ' with type ' + type);
        
        if (type === 'authenticate') {
            this.authenticateOrganization(message.values);   
        } else if (type === 'query') {

            var folder = this.ide.workspaceDir + "/ApexClasses"; 
            console.log(folder);

            this.onDir(folder, function() {
                _self.syncEntityFolder(folder, Entity.types[0], function() {
                    //Let the client know we finished syncing
                    _self.sendAction('finishedSyncing', { });
                });
            });
        } else if (type === 'downloadlog') {
            Entity.ApexLogs.downloadLog(message.logId, function(logData) {
                //console.log(logData);
            });
        } else if (type === 'compile') {
            var mcName = 'SymbolTableContainer';
            
            //console.log(message.name);
            //console.log(message.body);
            
            _self.getApexClass(message.name, function(apexClass) {
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
            });
            
//            apexClass.
//            this.getSymbolTableOnFirstClassInEntities('ApexClasses', function(symbolTable) {
//                _self.sendAction('compile', { symbolTable : symbolTable });
//            }, function(error) {
//                _self.sendAction('compile', { error : error });
//            });
        } else if (type === 'save') {
            _self.getApexClass(message.name, function(apexClass) {
                apexClass.set('Body', message.body);
                //TODO add this to the entity definition so I just have to say apexClass.compile or apexClass.save
                _self.save(apexClass, function(results) {
                    if (results.symbolTable) {
                        console.log('Save complete for ' + message.name);
                        _self.sendAction('saved', { symbolTable : results.symbolTable });
                    } else if (results.error) {
                        console.log('Save error for ' + message.name); 
                        _self.sendAction('saved', { error : results.error });
                    } else {
                       console.log('Save completed with no error or symbol table!!!'); 
                    }
                });
            });
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
    this.entites = {};
    this.authenticateOrganization = function(options) {
        if (!options) { return; }
        console.log('Authenticating...');
        var _self = this;
        Entity.api.authenticate(options, function(authResponse) {
            
            var instance = decodeURIComponent(authResponse.instance_url);
            instance = instance.substring(instance.indexOf('/')+2);
            console.log('Authenicated\n');
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
    
    
    this.getApexClass = function(name, callback) {
        if (this.entities.ApexClasses && this.entities.ApexClasses[name]) {
            sfdcUtil.cont(callback, this.entities.ApexClasses[name]);
        } else {
            var _self = this;
            //IF we don't already have the classes cached, retrieve all classes from the server
            //TODO I will need to optimize this for larger orgs. Maybe retrieve just the one 
            //class using 'Name = \''+name+'\'', then start a worker to cache the rest
            this.refreshApexClasses(function(classes) {
                if (_self.entities.ApexClasses && _self.entities.ApexClasses[name]) {
                    sfdcUtil.cont(callback, _self.entities.ApexClasses[name]);
                } else {
                    //TODO return this to the client
                    console.log('ERROR: Class '+name+' not found on server');
                }
            });
        }
    };
    
    this.refreshApexClasses = function(callback) {
        if (!this.entities.ApexClasses) {
            this.entities.ApexClasses = {};
        }
        var _self = this;
        Entity.ApexClasses.query(['Id', 'Name', 'Body'], null, function(records) {
            var classes = [];
            for (var i = 0; i < records.length; i++) {
                //TODO I should really have the records returned be instances of the type queried
                var apexClass = new Entity.ApexClass(records[i]);
                classes.push(apexClass);
                //Cache this class for furture use
                _self.entities.ApexClasses[apexClass.get('Name')] = apexClass;
            }
            sfdcUtil.cont(callback, classes);
        });
    };
    
    this.containerCache = {};
    /**
     * Get or create a MetadataContainer with the given name
     */
    this.getContainer = function(/* String */ name, /* function */ callback) {
        if (this.containerCache[name]) {
            console.log('\nUsing container cache');
            sfdcUtil.cont(callback, this.containerCache[name]);
            return;
        }
        var _self = this;
        console.log('\nQuering for MetadataContainer');
        Entity.MetadataContainers.query(['Id', 'Name'], "Name='" + name + "'", function(containers) {
            //console.log(containers);
            var mc;
            if (containers.length === 0) {
                mc = new Entity.MetadataContainer({Name : name});
                console.log('\nCreating MetatdataContainer "' + name + '"');
                mc.create(function(data) {
                    _self.containerCache[name] = mc;
                    sfdcUtil.cont(callback, mc);
                });
            } else {
                mc = new Entity.MetadataContainer(containers[0]);
                console.log('\nUsing MetatdataContainer ' + mc.get('Id'));
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
            console.log('\nUsing member cache');
            mcm = this.memberCache[id];
            mcm.set('Body', entity.get('Body'));
            mcm.update(function() {
                sfdcUtil.cont(callback, mcm);
            });
            return;
        }
        //TODO After we initially do this when setting up the cache, we should need to anymore, because if there isn't one then we already checked or used it and need to create a new one
        var _self = this;
        console.log('\nQuering for MetadataContainerMember');
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
                    console.log('\nCreating new MetatdataContainerMember for ' + entity.get('Name') + ' in MetatdataContainer ' + mc.get('Id'));
                    mcm.create(function(data) {
                        //console.log('Adding entity '+id+' to member cache');
                        _self.memberCache[id] = mcm;
                        sfdcUtil.cont(callback, mcm);
                    });
                } else {
                    mcm = new Entity.MetadataContainerMember(members[0]);
                    //Update the member with the new body
                    //console.log(entity.get('Body'));
                    mcm.set('Body', entity.get('Body'));
                    console.log('\nUpdating MetatdataContainerMember ' + mcm.get('Id') + ' with new body');
                    mcm.update(function() {
                        //console.log('Adding entity '+id+' to member cache');
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
            console.log('\nPolling ContainerAsyncRequest ' + car.get('Id') + ' with state ' + state);
            if (state !== 'Queued' && state !== 'InProgress') {
                sfdcUtil.cont(callback, car);
            } else {
                setTimeout(function() {waitForDeployToFinish(car, callback);}, 1000);
            }
        });
    };
    
    this.deployContainer = function(mc, isCheckOnly, callback) {
        var car = new Entity.ContainerAsyncRequest({
            MetadataContainerId : mc.get('Id'),
            isCheckOnly : isCheckOnly
        });
        car.create(function () {
            var id = car.get('Id');
            console.log('\nDeploying MetatdataContainer '+mc.get('Id')+' in ContainerAsyncRequest '+id);
            //Need to poll to check the results
            waitForDeployToFinish(car, function() {
                //TODO might want to send back the async request?
                sfdcUtil.cont(callback, car);
            });
        });  
    };
    
    this.compile = function(apexClass, callback) {
        this.deployApex(apexClass, false, callback);
    };
    
    this.save = function(apexClass, callback) {
        this.deployApex(apexClass, true, callback);
    };
    
    this.deployApex = function(apexClass, save, callback) {
        var mcName = 'SymbolTableContainer';
        var _self = this;
        _self.getContainer(mcName, function(mc) {
            _self.getMember(mc, apexClass, function(mcm) {
                //Passes in the compile restuls (error or symbol table) to the callback
                _self.deployContainerMember(mc, mcm, !save, callback);
            });
        });
    };
    
    //Deploy container member and handel errors or refresh the member
    this.deployContainerMember = function(mc, mcm, isCheckOnly, callback) {
        var _self = this;
        this.deployContainer(mc, isCheckOnly, function(car) {
            var compileResults = {};
            compileResults.Id = mcm.get('ContentEntityId');
            
            //If we deployed this member, we can no longer use it, so delete it from the cache
            if (_self.memberCache[compileResults.Id]) {
                //console.log('Deleting entity '+compileResults.Id+' from member cache');
                delete _self.memberCache[compileResults.Id];
            }
            
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
        _self.compile(apexClass, function(results) {
            if (results.symbolTable) {
                var path = folder + '/' + apexClass.get('Name') + '.st';
                fs.writeFile(path, JSON.stringify(results.symbolTable, null, 4), emptyCallback);
                sfdcUtil.cont(success, results.symbolTable);
            }
            if (results.error) {
                sfdcUtil.cont(failure, results.error);
            }
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
    this.syncEntityFolder = function(path, typeInfo, callback) {
        var _self = this;
        var pluralName = typeInfo.plural;
        
        Entity[pluralName].describe(function(data) {
            _self.entities[pluralName] = [];
            var fields = data.fields;
            
            fs.writeFile(path + '/' + '_describe.json', JSON.stringify(data, null, 4), emptyCallback);
            
            var fieldNames = sfdcUtil.getNames(fields);
            Entity[pluralName].query(fieldNames, null, function(records) {
                console.log('\nFound ' + records.length + ' ' + pluralName);
                for (var i = 0; i < records.length; i++) {
                    var data = records[i];
                    _self.entities[pluralName][data.Name] = new Entity[typeInfo.name](data);
                    if (typeInfo.fileBodyField && typeInfo.fileExtension) {
                        var fileName = data.Name + '.' + typeInfo.fileExtension;
                        var body = data[typeInfo.fileBodyField];
                        console.log('Writing file '+fileName);
                        fs.writeFile(path + '/' + fileName, body, emptyCallback);
                        //No need to have this in the JSON too. Maybe use delete?
                        data.Body = 'In file ' + fileName;
                    }
                    //console.log(_self.entities[pluralName][data.Name].get('Body'));
                    fs.writeFile(path + '/' + (data.Name ? data.Name : data.Id) + '.json', JSON.stringify(data, null, 4), emptyCallback);
                }
                console.log(' ');
                function finishProgress() {
                    setTimeout(function() {
                        //I have to do this because I stop saving to save it to the server, which I don't want to do when I refresh the server. So wait till the files are finshed being created
                        sfdcUtil.cont(callback);
                    }, 1000);
                }
                //TODO Check this differently than checking the type here
                if (pluralName === 'ApexClasses') {
                    _self.getSymbolTableOnFirstClassInEntities(path, finishProgress);
                } else {
                    finishProgress();
                }
            });
        });
    };
    

    this.canShutdown = function() {
        //TODO what is this for?
        return false;//this.processCount === 0;
    };

}).call(SalesForce.prototype);
