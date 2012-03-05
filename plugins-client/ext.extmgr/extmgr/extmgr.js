/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var markup = require("text!ext/extmgr/extmgr.xml");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/extmgr/extmgr", {
    name   : "Extension Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    desp   : [panels],
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        var reloadDgExt = true;
        this.nodes.push(
            mnuWindows.insertBefore(new apf.divider(), mnuWindows.firstChild),

            mnuWindows.insertBefore(new apf.item({
                caption : "Extension Manager...",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();

                    // Hackity hackathon
                    // @TODO the problem is apparently that APF does not
                    // like to show the datagrid records when two datagrids are
                    // bound to the same model && that one of the xpath selectors
                    // used to filter the model, has no results
                    setTimeout(function() {
                        if (reloadDgExt) {
                            dgExt.reload();
                            reloadDgExt = false;
                        }
                    });
                }
            }), mnuWindows.firstChild)
        );

        // Load up extensions the user added manually
        ide.addEventListener("loadsettings", function(e){
            ide.addEventListener("extload", function(){
                var nodes = e.model.queryNodes("auto/extensions/plugin");
                for (var n = 0; n < nodes.length; n++)
                    _self.loadExtension(nodes[n].getAttribute("path"));
            });
        });

        // Save the manually-loaded extensions
        ide.addEventListener("savesettings", function(e){
            var eNode = e.model.data.selectSingleNode("auto/extensions");
            if (eNode) {
                eNode.parentNode.removeChild(eNode);
                eNode = null;
            }

            eNode = apf.createNodeFromXpath(e.model.data, "auto/extensions");
            var userExtensions = mdlExt.queryNodes("plugin[@userext='1']");
            for (var u = 0; u < userExtensions.length; u++) {
                var copy = apf.xmldb.cleanNode(userExtensions[u].cloneNode(false));
                eNode.appendChild(copy);
            }

            return true;
        });
    },

    init : function(amlNode){},

    loadExtension : function(path) {
        if (path || tbModuleName.validate()) {
            if (!path) {
                path = tbModuleName.value;
                tbModuleName.clear();
            }
            require([path], function() {
                var extNode = mdlExt.queryNode("plugin[@path='" + path + "']");
                if (extNode)
                    apf.xmldb.setAttribute(extNode, "userext", "1");
                settings.save();
            });
        } else {
            util.alert("Error", "Validation Error",
                "There was a problem validating your input: '" + 
                tbModuleName.value + "'");
        }
    },

    removeExtension : function() {
        var extPath = dgExtUser.selected.getAttribute("path");
        var extension = require(extPath);

        if(ext.unregister(extension)) {
            mdlExt.removeXml(mdlExt.queryNode("plugin[@path='" + extPath + "']"));
            settings.save();
        }
    },

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },
    
    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);