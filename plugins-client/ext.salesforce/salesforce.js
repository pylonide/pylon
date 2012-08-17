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

console.log(organization);

var settings = require("ext/settings/settings");

module.exports = ext.register("ext/salesforce/salesforce", {
    name    : "SalesForce",
    dev     : "SalesForce",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    visible : true,
    nodes   : [],

    
    shouldSave : false,
    
    init: function(amlNode) {
        //innerSalesForce.$ext.innerHTML = sfhtml;
        console.log('In Init');
        // Save the organization properties
        var _self = this;
        ide.addEventListener("settings.save", function(e){
            if (!_self.shouldSave) { return; }
            
            //Removing old settings
            var eNode = e.model.data.selectSingleNode("sfdc/organizations");
            if (eNode) {
                eNode.parentNode.removeChild(eNode);
                eNode = null;
            }

            eNode = apf.createNodeFromXpath(e.model.data, "sfdc/organizations");
            var orgs = _self.organizations.queryNodes("org");
            
            if (orgs.length > 1) {
                //TODO This should be an error until I implement multiple orgs   
            }
            
            for (var u = 0; u < orgs.length; u++) {
                var copy = apf.xmldb.cleanNode(orgs[u].cloneNode(false));
                eNode.appendChild(copy);
                console.log('Saving' + copy.getAttribute('name'));
            }
            
            _self.shouldSave = false;
        });
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

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        //ide.addEventListener("salesforce", this.onMessage.bind(this));

        //Not sure if I need this, but I'm pretty sure I do
        if (!this.organizations.data) {
            console.log('Initializing organization data');
            this.organizations.load("<org />");
        }
        
        menus.addItemByPath("Tools/~", new apf.divider(), 1000000);
        menus.addItemByPath("Tools/SalesForce", new apf.item({
            onclick: function() {
                winSalesForce.show();
                _self.loadOrganization();
            }
        }), 2000000);

        // Load organization settings
        ide.addEventListener("settings.load", function(e){
            console.log('--------- Loading Settings -----------');
            var nodes = e.model.queryNodes("sfdc/organizations/org");
            
            for (var n = 0; n < nodes.length; n++) {
                //The model starts off blank, so let's create them from the settings
                _self.createOrganization(nodes[n]);
            }
        });
        
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
        //TODO Need to change this to load any org settings into the given tab or row
        console.log('--------- Load into UI -----------');
        //console.log(this.organizations);
        //console.log(this.organizations.data);
        
        //If I have the name of the row or tab, I can just get it from the orgSettings
        var orgs = this.organizations.queryNodes("org");
        console.log(orgs);
        if (orgs.length == 1) {
            var org = orgs[0];
            sfdcProjectName.setProperty('value', org.getAttribute('name'));
            console.log(sfdcProjectName.value);
            sfdcUserName.setProperty('value', org.getAttribute('username'));
            sfdcPassword.setProperty('value', org.getAttribute('password'));
            sfdcSecurityToken.setProperty('value', org.getAttribute('securityToken'));
            sfdcConsumerKey.setProperty('value', org.getAttribute('consumerKey'));
            sfdcConsumerSecret.setProperty('value', org.getAttribute('consumerSecret'));
            
            sfdcInstanceUrl.setProperty('value', org.getAttribute('instanceUrl'));
            sfdcToken.setProperty('value', org.getAttribute('token'));
            //console.log(org);
        }
        
        //console.log('Finished loading orgs into UI');
    },
    
    saveOrganization : function() {
        console.log('--------- Save Org -----------');
        var values = {
            name : sfdcProjectName.value,
            username : sfdcUserName.value,
            password : sfdcPassword.value,
            securityToken : sfdcSecurityToken.value,
            consumerKey : sfdcConsumerKey.value,
            consumerSecret : sfdcConsumerSecret.value,
            instanceUrl : sfdcInstanceUrl.value,
            token : sfdcToken.value};
        
        //TODO I need to:
        // 1) Add a project tab or row to the UI - right now I just have one org settings
        
        // 2) Save that in the settings
        if (this.hasOrganization(values.name)) {
            //TODO need to change ths name of these, or actually I should add the below method in a closure
            this.saveOrganizationSettings(values);
        } else {
            this.createOrganization(values);
        }
        //The settings get saved ever 2 seconds, but I only want to save
        //them when the user the user presses the save button, which is now.
        this.shouldSave = true;
        settings.save();
        
        this.authenticateOrganization(values);
        
        
        //Keeping this because it's an interesting way to set the values on the model and I want to remember it
        //    this.model.setQueryValue("plugin[@path='" + path + "']/@enabled", 1);
    },

    // ------ Organization settings - TODO put in a closure

    organizations : new apf.model(),
    
    getOrganization : function(name) {
        console.log('--------- Get organization ' + name + ' -----------');
        var org = this.organizations.queryNode("org[@name='" + name + "']");
        console.log(org);
        return org;
    },
    
    hasOrganization : function(name) {
        console.log('--------- Has organization ' + name + ' -----------');
        var hasOrg = !!this.organizations.queryNode("org[@name='" + name + "']");
        console.log(hasOrg);
        return hasOrg;
    },
    
    createOrganization : function(values) {
        console.log('--------- Create organization -----------');
        console.log(values);
        var isNode = values.getAttribute &&  values.getAttribute.call;
        
        var name = isNode ? values.getAttribute('name') : values.name;
        var username = isNode ? values.getAttribute('username') : values.username;
        var password = isNode ? values.getAttribute('password') : values.password;
        var securityToken = isNode ? values.getAttribute('securityToken') : values.securityToken;
        var consumerKey = isNode ? values.getAttribute('consumerKey') : values.consumerKey;
        var consumerSecret = isNode ? values.getAttribute('consumerSecret') : values.consumerSecret;
        var instanceUrl = isNode ? values.getAttribute('instanceUrl') : values.instanceUrl;
        var token = isNode ? values.getAttribute('token') : values.token;
        
        this.organizations.appendXml('<org ' +
            'name="' + name + '" ' +
            'username="' + username + '" ' +
            'password="' + password + '" ' +
            'securityToken="' + securityToken + '" ' +
            'consumerKey="' + consumerKey+'" ' +
            'consumerSecret="' + consumerSecret + '" ' +
            'instanceUrl="' + instanceUrl + '" ' +
            'token="' + token + '" ' +
            '/>');
    },
    
    /** The org must exist to save it **/
    saveOrganizationSettings : function(values) {
        console.log('--------- Save organization ' + values.name + ' -----------');
        console.log(values);
        var org = this.getOrganization(values.name);
        if (values.username) {org.setAttribute('username', values.username);}
        if (values.password) {org.setAttribute('password', values.password);}
        if (values.securityToken) {org.setAttribute('securityToken', values.securityToken);}
        if (values.consumerKey) {org.setAttribute('consumerKey', values.consumerKey);}
        if (values.userconsumerSecretname) {org.setAttribute('consumerSecret', values.consumerSecret);}
        if (values.instanceUrl) {org.setAttribute('instanceUrl', values.instanceUrl);}
        if (values.token) {org.setAttribute('token', values.token);}
        return org;
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