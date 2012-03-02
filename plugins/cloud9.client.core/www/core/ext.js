/**
 * Extension manager for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var util = require("core/util");

var ext;
module.exports = ext = {
    //Extension types
    GENERAL       : 1,
    defLength     : 1,

    extHandlers   : {
        1 : {
            register : function(oExtension){
                if (!oExtension.hook)
                    ext.initExtension(oExtension);
            },
            unregister : function(oExtension) {}
        }
    },
    extensions    : [],
    extLut        : {},
    commandsLut   : {},
    typeLut       : {
        1 : "General"
    },

    currentLayoutMode : null,

    addType : function(defName, regHandler, unregHandler){
        this[defName.toUpperCase()] = ++this.defLength;
        this.extHandlers[this.defLength] = {
            register : regHandler,
            unregister : unregHandler
        };
        this.typeLut[this.defLength] = defName;
    },

    register : function(path, oExtension, force){
        if (oExtension.registered)
            return oExtension;

        if (!mdlExt.queryNode("plugin[@path='" + path + "']"))
            mdlExt.appendXml('<plugin type="' + this.typeLut[oExtension.type]
                + '" name="' + (oExtension.name || "") + '" path="' + path
                + '" dev="' + (oExtension.dev || "") + '" enabled="1" userext="0" />');
        else
            mdlExt.setQueryValue("plugin[@path='" + path + "']/@enabled", 1);

        if (oExtension.commands) {
            for (var cmd in oExtension.commands)
                oExtension.commands[cmd].ext = path;
            apf.extend(this.commandsLut, oExtension.commands);
        }

        //Don't init general extensions that cannot live alone
        if (!force && oExtension.type == this.GENERAL && !oExtension.alone) {
            oExtension.path = path;
            return oExtension;
        }

        oExtension.registered = true;
        oExtension.path = path;

        this.extHandlers[oExtension.type].register(oExtension);

        this.extLut[path] = oExtension;
        this.extensions.push(oExtension);

        if (oExtension.hook) {
            oExtension.hook();
            
            ide.dispatchEvent("hook." + oExtension.path, {
                ext : oExtension
            });
            ide.addEventListener("$event.hook." + oExtension.path, function(callback){
                callback.call(this, {ext : oExtension});
            });
        }
        
        ide.dispatchEvent("ext.register", {ext: oExtension});

        return oExtension;
    },

    unregister : function(oExtension, silent){
        //Check exts that depend on oExtension
        var using = oExtension.using;
        if (using) {
            var inUseBy = [];
            for (var use, i = 0, l = using.length; i < l; i++) {
                if ((use = using[i]).registered)
                    inUseBy.push(use.path);
            }

            if (inUseBy.length) {
                //@todo move this to outside this function
                if (!silent)
                    util.alert(
                        "Could not disable extension",
                        "Extension is still in use",
                        "This extension cannot be disabled, because it is still in use by the following extensions:<br /><br />"
                        + " - " + inUseBy.join("<br /> - ")
                        + "<br /><br /> Please disable those extensions first.");
                return false;
            }
        }

        delete oExtension.registered;
        this.extensions.remove(oExtension);
        delete this.extLut[oExtension.path];

        //Check commands to clean up
        var commands = oExtension.commands;
        if (commands) {
            for (var cmd in commands) {
                if (this.commandsLut[cmd])
                    delete this.commandsLut[cmd];
            }
        }

        //Check deps to clean up
        var deps = oExtension.deps;
        if (deps) {
            for (var dep, ii = 0, ll = deps.length; ii < ll; ii++) {
                dep = deps[ii];
                if (dep.registered && dep.type == this.GENERAL && !oExtension.alone)
                    this.unregister(dep, true);
            }
        }

        this.extHandlers[oExtension.type].unregister(oExtension);

        mdlExt.setQueryValue("plugin[@path='" + oExtension.path + "']/@enabled", 0);

        if (oExtension.inited) {
            oExtension.destroy();
            delete oExtension.inited;
        }

        return true;
    },

    initExtension : function(oExtension, amlParent) {
        if (oExtension.inited)
            return;

        var skin = oExtension.skin;
        if (skin && typeof skin == "object") {
            var data = oExtension.skin.data;
            oExtension.skinNode = new apf.skin(apf.extend({}, oExtension.skin, {data: null}));
            oExtension.skinNode.setProperty("src", data);
            apf.document.body.appendChild(oExtension.skinNode);
        }

        //Load markup
        var markup = oExtension.markup;
        if (markup) 
            apf.document.body.insertMarkup(markup);

        var deps = oExtension.deps;
        if (deps) {
            deps.each(function(dep){
                if (!dep.registered)
                    ext.register(dep.path, dep, true);

                (dep.using || (dep.using = [])).pushUnique(oExtension);
            });
        }

        if (this.currentKeybindings) {
            var name = oExtension.path.substr(oExtension.path.lastIndexOf("/") + 1);
            var keyBindings = this.currentKeybindings[name];

            if (keyBindings)
                oExtension.currentKeybindings = keyBindings;
        }

        oExtension.init(amlParent);
        oExtension.inited = true;
        
        ide.dispatchEvent("init." + oExtension.path, {
            ext : oExtension
        });
        ide.addEventListener("$event.init." + oExtension.path, function(callback){
            callback.call(this, {ext : oExtension});
        });
    },

    execCommand: function(cmd, data) {
        if (cmd)
            cmd = cmd.trim();
        else
            cmd = "";

        var oCmd = this.commandsLut[cmd];
        if (!oCmd || !oCmd.ext) {
            return;
        }

        var oExt = require(oCmd.ext);
        if (oExt && typeof oExt[cmd] === "function") {
            require(["ext/console/console"], function(consoleExt) {
                if (oExt.commands[cmd].msg)
                    consoleExt.write(oExt.commands[cmd].msg);
            });
            return oExt[cmd](data);
        }
    }
};

});