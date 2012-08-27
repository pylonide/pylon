/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var util = require("core/util");
var markup = require("text!ext/extmgr/extmgr.xml");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");

/*global dgExt dgExtUser tbModuleName tabExtMgr btnUserExtEnable
  btnDefaultExtEnable winExt btnAdd*/

var LOAD_TIMEOUT_REMOTE = 30 * 1000;
var LOAD_TIMEOUT_LOCAL = 5 * 1000;

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
        
        menus.addItemByPath("Tools/~", new apf.divider(), 1000000);
        menus.addItemByPath("Tools/Extension Manager...", new apf.item({
            onclick : function(){
                _self.show();
            }
        }), 2000000);
        
        // Load up extensions the user added manually
        ide.addEventListener("settings.load", function(e){
            _self.loadedSettings = false;
            
            ide.addEventListener("extload", function(){
                var nodes = e.model.queryNodes("auto/extensions/plugin");
                for (var n = 0; n < nodes.length; n++)
                    _self.loadExtension(nodes[n].getAttribute("path"));
                
                _self.loadedSettings = true;
            });
        });
    },

    init : function(amlNode){
        // Save the manually-loaded extensions
        var _self = this;
        ide.addEventListener("settings.save", function(e){
            if (!_self.loadedSettings)
                return;

            var eNode = e.model.data.selectSingleNode("auto/extensions");
            if (eNode) {
                eNode.parentNode.removeChild(eNode);
                eNode = null;
            }

            eNode = apf.createNodeFromXpath(e.model.data, "auto/extensions");
            var userExtensions = ext.model.queryNodes("plugin[@userext='1']");
            for (var u = 0; u < userExtensions.length; u++) {
                var copy = apf.xmldb.cleanNode(userExtensions[u].cloneNode(false));
                eNode.appendChild(copy);
            }
        });
        
        // Hackity hackathon
        // @TODO the problem is apparently that APF does not
        // like to show the datagrid records when two datagrids are
        // bound to the same model && that one of the xpath selectors
        // used to filter the model, has no results
        // @todo I believe this is only with the debug version of apf
        setTimeout(function() {
            dgExt.reload();
        });

        var nodes = ext.model.queryNodes("plugin");
        for (var i = 0; i < nodes.length; i++) {
            apf.xmldb.setAttribute(nodes[i], "total", 
                parseInt(nodes[i].getAttribute("hook"), 10) + parseInt(nodes[i].getAttribute("init") || 0, 10));
        }
    },

    addExtension : function() {
        var _self = this;
        if (tbModuleName.validate()) {
            var timer = setTimeout(function() {
                _self.$reportBadInput();
                tbModuleName.enable();
                btnAdd.enable();
            }, tbModuleName.value.match("://") ? LOAD_TIMEOUT_REMOTE : LOAD_TIMEOUT_LOCAL);
            tbModuleName.disable();
            btnAdd.disable();
            this.loadExtension(tbModuleName.value, timer);
        }
        else {
            this.$reportBadInput();
        }
    },
    
    $reportBadInput: function() {
        util.alert("Error", "Validation Error",
                "There was a problem validating your input: '" + 
                tbModuleName.value + "'");
    },
    
    loadExtension : function(path, timer) {
        if (!path) {
            tbModuleName.clear();
        }
        if (path.substr(-3) === ".js")
            path = path.substr(0, path.length - 3);
        require([path], function() {
            var extNode = ext.model.queryNode("plugin[@path='" + path + "']");
            if (extNode)
                apf.xmldb.setAttribute(extNode, "userext", "1");
            settings.save();
            if (timer) {
                clearTimeout(timer);
                tbModuleName.enable();
                btnAdd.enable();
            }
        });
    },

    removeExtension : function() {
        var extPath = dgExtUser.selected.getAttribute("path");
        var extension = require(extPath);

        if (ext.unregister(extension)) {
            ext.model.removeXml(ext.model.queryNode("plugin[@path='" + extPath + "']"));
            settings.save();
        }
    },

    enableExt : function(path) {
        ext.enableExt(path);

        if (tabExtMgr.activepage === 0)
            btnUserExtEnable.setAttribute("caption", "Disable");
        else
            btnDefaultExtEnable.setAttribute("caption", "Disable");
    },

    disableExt : function(path) {
        ext.disableExt(path);

        if (tabExtMgr.activepage === 0)
            btnUserExtEnable.setAttribute("caption", "Enable");
        else
            btnDefaultExtEnable.setAttribute("caption", "Enable");
    },

    updateEnableBtnState : function() {
        if (tabExtMgr.activepage === 0) {
            if (dgExtUser.selected.getAttribute("enabled") === "1")
                btnUserExtEnable.setAttribute("caption", "Disable");
            else
                btnUserExtEnable.setAttribute("caption", "Enable");
        }
        else {
            if (dgExt.selected.getAttribute("enabled") === "1")
                btnDefaultExtEnable.setAttribute("caption", "Disable");
            else
                btnDefaultExtEnable.setAttribute("caption", "Enable");
        }
    },
    
    show : function(){
        ext.initExtension(this);
        winExt.show();
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
        menus.remove("Tools/~", 1000000);
        menus.remove("Tools/Extension Manager...");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
