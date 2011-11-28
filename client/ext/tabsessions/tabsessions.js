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

module.exports = ext.register("ext/tabsessions/tabsessions", {
    name       : "Tab Sessions",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    markup     : markup,
    css         : css,
    nodes      : [],
    
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
                name = sessionnames[i];
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
                ide.mnuFile.appendChild(new apf.item({
                    id      : "mnuFileLoadSession",
                    caption : "Load Session",
                    submenu : "mnuTabLoadSessions",
                    disabled: !sessions.length
                })),
    
                ide.mnuFile.appendChild(new apf.item({
                    caption : "Save Session",
                    onclick : function(){
                        winSaveSessionAs.show();
                    },
                    disabled : "{!!!tabEditors.activepage}"
                })),
                
                ide.mnuFile.appendChild(new apf.item({
                    id      : "mnuFileDeleteSession",
                    caption : "Delete Session",
                    submenu : "mnuTabDeleteSessions",
                    disabled: !sessions.length
                }))
            );
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
            return util.confirm("Overwrite Session", "Overwrite Session",
                "You're about to overwrite the session named " + name + ". Are you sure you want to do this?",
                function() {
                    require("ext/tabsessions/tabsessions").saveSession(name, true);
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
                type    : "radio",
                value   : name
            }));
            mnuTabDeleteSessions.appendChild(new apf.item({
                caption : name,
                type    : "radio",
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
    
    loadSession : function(name, ignoreChanges) {
        // check for unsaved files
        var pages = tabEditors.getPages();
        var page;
        for (var i = 0, l = pages.length; i < l; i++) {
            page = pages[i];
            if (page.$doc.getNode().getAttribute("changed") == 1) {
                if (!ignoreChanges) {
                    return util.confirm("Unsaved changes", "Unsaved changes",
                        "Your unsaved changes will be lost. Are you sure you want to continue?",
                        function() {
                            return require("ext/tabsessions/tabsessions").loadSession(name, true);
                        }
                    );
                }
                else {
                    page.$doc.getNode().setAttribute("changed", 0);
                }
            }
        }
        
        var sessionfiles = settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]/files");
        if (!sessionfiles)
            return; // or display error
            
        // close open tabs
        pages = tabEditors.getPages();
        pages.forEach(function(page) {
            tabbehaviors.removeItem(page);
            page.removeNode();
        });

        // open session files
        var active = settings.model.queryValue("auto/sessions/session[@name=\"" + name + "\"]/files/@active");
        var nodes  = settings.model.queryNodes("auto/sessions/session[@name=\"" + name + "\"]/files/file");
        
        for (var doc, i = 0, l = nodes.length; i < l; i++) {
            doc = ide.createDocument(nodes[i]);
            
            var state = nodes[i].getAttribute("state");
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
                    ? active == nodes[i].getAttribute("path")
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
            if (item.value == name) {
                mnuTabLoadSessions.removeChild(item);
            }
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
