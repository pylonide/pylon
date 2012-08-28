define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var menus = require("ext/menus/menus");
var fs = require("ext/filesystem/filesystem");
var markup = require("text!ext/salesforce/salesforce.xml");

//var sfhtml = require("text!ext/salesforce/salesforce.html");

//Is there a library I can use to make http calls?
//var http = require('http');

var organization = require('ext/salesforce/SfdcOrganization');



module.exports = ext.register("ext/salesforce/salesforce", {
    name    : "SalesForce",
    dev     : "SalesForce",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    visible : true,
    nodes   : [],

    init: function(amlNode) {
        //innerSalesForce.$ext.innerHTML = sfhtml;

        organization.init();
        
    },
    
    sendMessage : function(message) {
        var data = {
            command: "salesforce",
            msg: message
        };
        ide.send(data);
    },

    onMessage : function(e) {
        if (!e.message.type || e.message.type !== 'salesforce')
            return;

        console.log('------ Got a message from the server -----');
        console.log(e.message);
        if (e.message.subType && e.message.subType === 'authenticated') {
               var values = e.message.values;
               
               if (values) {
                   console.log(values);
                   this.saveOrganizationSettings(values);
                   sfdcStatus.$ext.innerHTML = "Authenticated";
               } else {
                   values = { token : '', instanceUrl : '' };
                   var error = e.message.error;
                   console.log(error);
                   sfdcStatus.$ext.innerHTML = "Error authenticating: "+error;
               }
               sfdcInstanceUrl.setProperty('value', values.instanceUrl);
               sfdcToken.setProperty('value', values.token);
               this.shouldSave = true;
               settings.save();
        } else if (e.message.subType && e.message.subType === 'queryResults') {
            sfdcStatus.$ext.innerHTML = e.message.records;
            //I shouldn't get it from the UI element every time. I should get it fomr SfdcOrganizations
            this.createOrUpdateProjectDirectory(sfdcProjectName.value, e.message.records);
        }
        
        
    },

    createOrUpdateProjectDirectory : function(name, classes) {
        console.log('Creating classes structure for '+name);
        fs.exists('cloud9/test', function(doesExist) {
            console.log(doesExist);
            /*
            fs.createFolder(name, null, false, function() {
                //console.log(classes);
                for (var i = 0; i < classes.length; i++) {
                    //console.log(classes[i]);
                    //var path = name+'/'+classes[i].Name;
                    //console.log(path);
                    fs.createFile(classes[i].Name);   
                }
            });
            */
        });
        fs.exists('test', function(doesExist) {
            console.log(doesExist);
        });
    },

    hook: function() {
        var _self = this;
        console.log('--------- Hook -----------');
        organization.hook();
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        
        
        menus.addItemByPath("Tools/~", new apf.divider(), 1000000);
        menus.addItemByPath("Tools/SalesForce", new apf.item({
            onclick: function() {
                winSalesForce.show();
                _self.loadOrganization();
            }
        }), 2000000);

        ext.initExtension(this);
    },
    
    authenticateOrganization : function(values) {
        console.log('--------- Authenticate Organization -----------');
        sfdcStatus.$ext.innerHTML = "Authenticating...";
        
        /** TODO Call a server plugin to contact salesforce with the
         *      - ClientId
         *      - ClientSecret
         *      - RedirectUri //Need to surface this to the user
         *      - grant_type='password' (I can set this on the server side
         *      - username
         *      - password
         * 
         *  On call back, show auth token and instance url in the client code
        */
        
        var data = {
            command: "salesforce",
            type: 'authenticate',
            values : values
        };
        ide.send(data);
        

        
    },

    queryClasses : function() {
         var data = {
            command: "salesforce",
            type: 'query',
            instance : sfdcInstanceUrl.value,
            token : sfdcToken.value//,
            
            //values : values
        };
        ide.send(data);
    },

    loadOrganization : function() {
        console.log('--------- Load into UI -----------');
        
        //TODO Need to change this to load any org settings into the given tab or row
        var orgs = organization.getAll();
        console.log(orgs);
        if (orgs.length == 1) {
            this.setOrgInUI([0]);
        }
    },
    
    /** Called from UI */
    saveOrganization : function() {
        var values = this.getOrgInUI();
        
        //If an org doesn't exist, create it. I should have a button to add an org and save an org...
        if (organization.has(values.name)) {
            organization.save(values);
        } else {
            organization.create(values);
        }
        
        //Authenticate when they save changes, but I could also add another button for it
        this.authenticateOrganization(values);
    },
    
    setOrgInUI : function(org) {
        sfdcProjectName.setProperty('value', org.getAttribute('name'));
        sfdcUserName.setProperty('value', org.getAttribute('username'));
        sfdcPassword.setProperty('value', org.getAttribute('password'));
        sfdcSecurityToken.setProperty('value', org.getAttribute('securityToken'));
        sfdcConsumerKey.setProperty('value', org.getAttribute('consumerKey'));
        sfdcConsumerSecret.setProperty('value', org.getAttribute('consumerSecret'));
        sfdcInstanceUrl.setProperty('value', org.getAttribute('instanceUrl'));
        sfdcToken.setProperty('value', org.getAttribute('token'));
    },
    
    getOrgInUI : function() {
        return {
            name : sfdcProjectName.value,
            username : sfdcUserName.value,
            password : sfdcPassword.value,
            securityToken : sfdcSecurityToken.value,
            consumerKey : sfdcConsumerKey.value,
            consumerSecret : sfdcConsumerSecret.value,
            instanceUrl : sfdcInstanceUrl.value,
            token : sfdcToken.value
        };
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });
    },

    disable: function() {
        this.nodes.each(function(item) {
            item.disable();
        });
    },

    destroy: function() {
        this.nodes.each(function(item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});