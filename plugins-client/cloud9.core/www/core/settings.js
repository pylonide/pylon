/**
 * Extension manager for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var template = "<settings />";

var INTERVAL = 2000; //I would like this at 60000, but save on exit is broken

module.exports = {
    model : new apf.model(),

    $checkSave : function() {
        if (this.dirty)
            this.saveToFile();
    },

    startTimer : function(){
        var _self = this;

        clearInterval(this.$timer);

        var checkSave = function(){
            _self.$checkSave();
        };
        this.$timer = setInterval(checkSave, INTERVAL);
    },

    save : function(force){
        this.dirty = true;

        if (force) {
            this.saveToFile();
            this.startTimer();
        }
    },

    saveToFile : function() {
        if (cloud9config.debug)
            console.log("Saving Settings...");

        ide.dispatchEvent("settings.save", { model : this.model });

        this.model.data.setAttribute("time", new Date().getTime());
        var data = this.model.data && apf.xmldb.cleanXml(this.model.data.xml) || "";

        if (ide.onLine) {
            this.dirty = false;

            ide.send({
                command: "settings",
                action: "set",
                settings: data
            });
            ide.dispatchEvent("track_action", {
                type: "save settings",
                settings: data
            });
        }
    },

    load : function(xml){
        try {
            this.model.load(xml);
        } catch(e) {
            this.model.load(template);
        }

        if (!cloud9config.debug) {
            try {
                ide.dispatchEvent("settings.load", {
                    model : this.model,
                    ext   : this
                });
            } catch(e) {
                self["requ"+"ire"]("ext/filesystem/filesystem")
                  .saveFile("/workspace/.c9.brokensettings.xml", xml.xml || xml);

                this.model.load(template);

                ide.dispatchEvent("settings.load", {
                    model : this.model,
                    ext   : this
                });
            }
        }
        else {
            ide.dispatchEvent("settings.load", {
                model : this.model,
                ext   : this
            });
        }

        ide.addEventListener("$event.settings.load", this.$loadsettings);

        this.loaded = true;
    },

    $loadsettings : function(cb){
        var _self = require("core/settings");

        if (cloud9config.debug) {
            cb({model : _self.model, ext : _self});
        }
        else {
            try {
                cb({model : _self.model, ext : _self});
            }
            catch(e){
                console.log(e.message, e.stack);
            }
        }
    },

    setDefaults : function(path, attr){
        var node = this.model.queryNode(path);
        if (!node)
            node = apf.createNodeFromXpath(this.model.data, path);

        for (var i = 0, l = attr.length; i < l; i++) {
            if (!node.getAttributeNode(attr[i][0]))
                apf.xmldb.setAttribute(node, attr[i][0], attr[i][1]);
        }

        apf.xmldb.applyChanges("synchronize", node);
    },

    /**
     * Initializes the settings. The settings can come from different sources:
     * - Template (used for when no settings have been stored previously)
     * - Parsed into the index file (by the backend - cloud9config.settings)
     * - LocalStorage (saved for use when starting in offline mode only)
     */
    init : function(){
        var xml;
        var resetSettings = location.href.indexOf("reset=1") > -1;
        var sIdent = this.sIdent = "cloud9.settings." + ide.workspaceId;
        var _self = this;

        this.model.setProperty("create-model", false);

        if (resetSettings)
            xml = template;
        // Load from local storage
        else if (localStorage[sIdent])
            xml = localStorage[sIdent];
        // Load from template
        else if (!cloud9config.settings || cloud9config.settings == "defaults")
            xml = template;
        // Load from parsed settings in the index file
        else if (cloud9config.settings)
            xml = cloud9config.settings;

        if (!xml) {
            ide.addEventListener("socketMessage", function(e){
                if (e.message.type == "settings") {
                    var settings = e.message.settings;
                    if (!settings || settings == "defaults")
                        settings = template;

                    _self.load(settings);
                    initEvents();

                    ide.removeEventListener("socketMessage", arguments.callee);
                }
            });

            if (ide.onLine === true) {
                ide.send({command: "settings", action: "get"});
            }
            else {
                ide.addEventListener("afteronline", function() {
                    ide.send({command: "settings", action: "get"});
                });
            }
            return;
        }

        this.load(xml);
        initEvents();

        /**** Events ****/
        function initEvents() {
            _self.startTimer();

            apf.addEventListener("exit", function(){
                _self.$checkSave();
            });

            ide.addEventListener("afteronline", function(){
                _self.saveToFile(); //Save to file

                localStorage[sIdent] = null;
                delete localStorage[sIdent];
            });

            ide.addEventListener("afteroffline", function(){
                if (_self.loaded)
                    _self.saveToFile(); //Save in local storage
            });

            _self.model.addEventListener("update", function(){
                _self.save();
            });
        }
    }
};

module.exports.init();

});
