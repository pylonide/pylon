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
var menus = require("ext/menus/menus");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/tabsessions/tabsessions.xml");
var tabbeh = require("ext/tabbehaviors/tabbehaviors");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");

tabbeh.menuOffset += 3;

module.exports = ext.register("ext/tabsessions/tabsessions", {
    name       : "Tab Sessions",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    markup     : markup,
    css         : css,
    nodes      : [],

    hook : function(){
        var _self = this;

        commands.addCommand({
            name: "savetabsession",
            hint: "save the current tab state as a new session",
            msg: "Save tab session.",
            bindKey: {mac: "Ctrl-Shift-S", win: "Alt-Shift-S"},
            exec: function () {
                ext.initExtension(_self);
                winSaveSessionAs.show();
            }
        });

        ide.addEventListener("settings.load", function(e) {
            var model = e && e.model || settings.model;

            var sessions = model.queryNodes("auto/sessions/session");

            menus.addItemByPath("View/Tabs/~", new apf.divider(), 700);

            menus.addItemByPath("View/Tabs/Load Tab Session", {
                menu : _self.mnuTabLoadSessions = new apf.menu({
                    onitemclick : function(e){
                        _self.loadSession(e.relatedNode.value);
                    }
                }),
                item : _self.mnuFileLoadSession = new apf.item({
                    disabled: !sessions.length
                })
            }, 800);

            menus.addItemByPath("View/Tabs/Save Tab Session", new apf.item({
                caption : "Save Tab Session",
                command : "savetabsession",
                disabled : "{!!!tabEditors.activepage}"
            }), 900);

            menus.addItemByPath("View/Tabs/Delete Tab Session", {
                menu : _self.mnuTabDeleteSessions = new apf.menu({
                    onitemclick : function(e){
                        _self.removeSession(e.relatedNode.value);
                    }
                }),
                item : _self.mnuFileDeleteSession = new apf.item({
                    disabled: !sessions.length
                })
            }, 1000);

            // get sessionnames to order alfabetically
            var sessionnames = [];
            for (var i = 0, l = sessions.length; i < l; i++){
                sessionnames.push(sessions[i].getAttribute("name"));
            }
            sessionnames.sort();

            sessionnames.forEach(function(name) {
                _self.mnuTabLoadSessions.appendChild(new apf.item({
                    caption : name,
                    value   : name
                }));
                _self.mnuTabDeleteSessions.appendChild(new apf.item({
                    caption : name,
                    value   : name
                }));
            });
        });
    },

    init : function(amlNode){
        apf.importCssString((this.css || ""));
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
            this.mnuTabLoadSessions.appendChild(new apf.item({
                caption : name,
                value   : name
            }));
            this.mnuTabDeleteSessions.appendChild(new apf.item({
                caption : name,
                value   : name
            }));
        }

        session = apf.n("<session />").attr("name", name).node();
        session.appendChild(files);
        settings.model.appendXml(session, "auto/sessions");

        this.mnuFileLoadSession.enable();
        this.mnuFileDeleteSession.enable();

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
            editors.gotoDocument({
                doc    : doc,
                init   : true,
                active : active
                    ? active == node.getAttribute("path")
                    : i == l - 1,
                origin: "tabsessions"
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
        var menuitems = this.mnuTabLoadSessions.childNodes.concat(this.mnuTabDeleteSessions.childNodes);
        for (var item, i = 0, l = menuitems.length; i < l; i++) {
            item = menuitems[i];
            if (item.value == name)
                this.mnuTabLoadSessions.removeChild(item);
        }

        if (menuitems.length == 2) {
            this.mnuFileLoadSession.disable();
            this.mnuFileDeleteSession.disable();
        }

    },

    enable : function(){
        menus.enable("View/Tabs/~", 400);
        menus.enable("View/Tabs/Load Tab Session");
        menus.enable("View/Tabs/Save Tab Session");
        menus.enable("View/Tabs/Delete Tab Session");
        this.$enable();
    },

    disable : function(){
        menus.disable("View/Tabs/~", 400);
        menus.disable("View/Tabs/Load Tab Session");
        menus.disable("View/Tabs/Save Tab Session");
        menus.disable("View/Tabs/Delete Tab Session");
        this.$disable();
    },

    destroy : function(){
        menus.remove("View/Tabs/~", 400);
        menus.remove("View/Tabs/Load Tab Session");
        menus.remove("View/Tabs/Save Tab Session");
        menus.remove("View/Tabs/Delete Tab Session");
        this.$destroy();
    }
});

});
