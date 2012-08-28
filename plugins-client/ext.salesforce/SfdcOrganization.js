var ide = require("core/ide");
var settings = require("ext/settings/settings");

/**
 * 
 * @author Thomas Dvornik
 */
define(function(require, exports, module) {
    //Anything private here
    
    var organizations = new apf.model();
    var shouldSave = false;
    
    module.exports = {
        
        init : function() {
            ide.addEventListener("settings.save", function(e){
                if (!shouldSave) { return; }
                
                //Removing old settings
                var eNode = e.model.data.selectSingleNode("sfdc/organizations");
                if (eNode) {
                    eNode.parentNode.removeChild(eNode);
                    eNode = null;
                }
    
                eNode = apf.createNodeFromXpath(e.model.data, "sfdc/organizations");
                var orgs = organizations.queryNodes("org");
                
                if (orgs.length > 1) {
                    //TODO This should be an error until I implement multiple orgs   
                }
                
                for (var u = 0; u < orgs.length; u++) {
                    var copy = apf.xmldb.cleanNode(orgs[u].cloneNode(false));
                    eNode.appendChild(copy);
                    console.log('Saving' + copy.getAttribute('name'));
                }
                
                shouldSave = false;
            });   
        },
        
        hook : function() {
             //Not sure if I need this, but I'm pretty sure I do
            if (!organizations.data) {
                console.log('Initializing organization data');
                organizations.load("<org />");
            }
            
            var _self = this;
            // Load organization settings
            ide.addEventListener("settings.load", function(e){
                console.log('--------- Loading Settings -----------');
                var nodes = e.model.queryNodes("sfdc/organizations/org");
                
                for (var n = 0; n < nodes.length; n++) {
                    //The model starts off blank, so let's create them from the settings
                    _self.create(nodes[n]);
                }
            });  
        },
        
        get : function(name) {
            console.log('--------- Get organization ' + name + ' -----------');
            var org = organizations.queryNode("org[@name='" + name + "']");
            console.log(org);
            return org;
        },
        
        getAll : function() {
            return organizations.queryNodes("org");
        },
        
        has : function(name) {
            console.log('--------- Has organization ' + name + ' -----------');
            var hasOrg = !!organizations.queryNode("org[@name='" + name + "']");
            console.log(hasOrg);
            return hasOrg;
        },
        
        create : function(values) {
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
            
            organizations.appendXml('<org ' +
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
        save : function(values) {
            console.log('--------- Save organization ' + values.name + ' -----------');
            console.log(values);
            
            //Keeping this because it's an interesting way to set the values on the model and I want to remember it
            //    this.model.setQueryValue("plugin[@path='" + path + "']/@enabled", 1);
            
            var org = this.get(values.name);
            if (values.username) {org.setAttribute('username', values.username);}
            if (values.password) {org.setAttribute('password', values.password);}
            if (values.securityToken) {org.setAttribute('securityToken', values.securityToken);}
            if (values.consumerKey) {org.setAttribute('consumerKey', values.consumerKey);}
            if (values.userconsumerSecretname) {org.setAttribute('consumerSecret', values.consumerSecret);}
            if (values.instanceUrl) {org.setAttribute('instanceUrl', values.instanceUrl);}
            if (values.token) {org.setAttribute('token', values.token);}
            
            //The settings get saved ever 2 seconds, but I only want to save
            //them when the user the user presses the save button, which is now.
            shouldSave = true;
            settings.save();
            return org;
        }
    };
});
//});