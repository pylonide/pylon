/**
 * Tab Sessions for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("ext/settings/settings");
var tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/tabsessions/tabsessions.xml");
var tabbeh = require("ext/tabbehaviors/tabbehaviors");

tabbeh.menuOffset = 8;

module.exports = ext.register("ext/tabsessions/tabsessions", {
    name       : "Tab Sessions",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    markup     : markup,
    css         : css,
    nodes      : [],
    commands   : {
        "savetabsession": {hint: "save the current tab state as a new session", msg: "Save tab session."},
    },
    hotitems   : [],
    init : function(amlNode){
        apf.importCssString((this.css || ""));
        
        var _self = this;
        ide.addEventListener("loadsettings", function(e) {            
            var model = e && e.model || settings.model;
        
            _self.nodes.push(
                apf.document.body.appendChild(new apf.menu({
                    id : "mnuTabLoadSessions",
                    onitemclick : function(e){
                        _self.loadSession(e.relatedNode.value);
                    }
                })),
                apf.document.body.appendChild(new apf.menu({
                    id : "mnuTabDeleteSessions",
                    onitemclick : function(e){
                        _self.removeSession(e.relatedNode.value);
                    }
                }))
            );
            
            var sessions = model.queryNodes("auto/sessions/session");
            
            // get sessionnames to order alfabetically
            var sessionnames = [];
            for (var i = 0, l = sessions.length; i < l; i++){ 
                sessionnames.push(sessions[i].getAttribute("name"));
            }
            sessionnames.sort();
            
            var name;
            sessionnames.forEach(function(name) {
                mnuTabLoadSessions.appendChild(new apf.item({
                    caption : name,
                    //type    : "radio",
                    value   : name
                }));
                mnuTabDeleteSessions.appendChild(new apf.item({
                    caption : name,
                    //type    : "radio",
                    value   : name
                }));
            });
    
            _self.nodes.push(
                mnuTabs.appendChild(new apf.divider()),
                mnuTabs.appendChild(new apf.item({
                    id      : "mnuFileLoadSession",
                    caption : "Load Tab Session",
                    submenu : "mnuTabLoadSessions",
                    disabled: !sessions.length
                })),
    
                mnuTabs.appendChild(new apf.item({
                    caption : "Save Tab Session",
                    onclick : function(){
                        winSaveSessionAs.show();
                    },
                    disabled : "{!!!tabEditors.activepage}"
                })),
                
                mnuTabs.appendChild(new apf.item({
                    id      : "mnuFileDeleteSession",
                    caption : "Delete Tab Session",
                    submenu : "mnuTabDeleteSessions",
                    disabled: !sessions.length
                }))
            );
            _self.hotitems["savetabsession"] = [_self.nodes[4]];
        });
    },
    
    saveSession : function(name, overwrite) {
        if (!name) {
            if (!txtSaveSessionAs.getValue() && trSaveSessionAs.selected)
                name = trSaveSessionAs.selected.getAttribute("name");
            else
                name = txtSaveSessionAs.getValue();
        }
        
        // check if session with given name already exists
        var session = settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]");
        if (session && !overwrite) {
            var _self = this;
            return util.confirm("Overwrite Session", "Overwrite Session",
                "You're about to overwrite the session named " + name + ". Are you sure you want to do this?",
                function() {
                    _self.saveSession(name, true);
                    winSaveSessionAs.hide();
                    return;
                }
            );
        }
        
        if (!settings.model.queryNode("auto/sessions"))
            settings.model.appendXml("<sessions />", "auto");
        
        var files = settings.model.queryNode("auto/files");
        if (!files)
            return;
            
        // if session with given name already exist remove it
        if (session)
            settings.model.removeXml(session);
        else {
            mnuTabLoadSessions.appendChild(new apf.item({
                caption : name,
                //type    : "radio",
                value   : name
            }));
            mnuTabDeleteSessions.appendChild(new apf.item({
                caption : name,
                //type    : "radio",
                value   : name
            }));
        }
        
        session = apf.getXml("<session name=\"" + name + "\" />");
        session.appendChild(files);
        settings.model.appendXml(session, "auto/sessions");
        
        mnuFileLoadSession.enable();
        mnuFileDeleteSession.enable();
        
        settings.save();
        winSaveSessionAs.hide();
    },
    
    loadSession : function(name) {
        var _self = this;
        tabbehaviors.closealltabs(function() {
            _self.openSessionFiles(name);
        });
    },
    
    openSessionFiles : function(name) {
        var active = settings.model.queryValue("auto/sessions/session[@name=\"" + name + "\"]/files/@active");
        var nodes  = settings.model.queryNodes("auto/sessions/session[@name=\"" + name + "\"]/files/file");
        
        var sessionfiles = settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]/files");
        if (!sessionfiles)
            return; // or display error
            
        for (var doc, i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            if (node.getAttribute("newfile") != "1")
                node.removeAttribute("changed");
            doc = ide.createDocument(node);
            doc.parentNode = {};
            
            var state = node.getAttribute("state");
            if (state) {
                try {
                    doc.state = JSON.parse(state);
                }
                catch(e) {}
            }
            
            ide.dispatchEvent("openfile", {
                doc    : doc,
                init   : true,
                active : active 
                    ? active == node.getAttribute("path")
                    : i == l - 1
            });
        }
  
        var oldfiles = settings.model.queryNode("auto/files");
        if (oldfiles)
            settings.model.removeXml("auto/files");
        
        settings.model.appendXml(sessionfiles.cloneNode(true), "auto");
        settings.save();
    },
    
    removeSession : function(name) {
        if (!settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]"))
            return;
        
        settings.model.removeXml("auto/sessions/session[@name=\"" + name + "\"]");
        
        settings.save();
        var menuitems = mnuTabLoadSessions.childNodes.concat(mnuTabDeleteSessions.childNodes);
        for (var i = 0, l = menuitems.length; i < l; i++) {
            item = menuitems[i];
            if (item.value == name)
                mnuTabLoadSessions.removeChild(item);
        }
        
        if (menuitems.length == 2) {
            mnuFileLoadSession.disable();
            mnuFileDeleteSession.disable();
        }
        
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
