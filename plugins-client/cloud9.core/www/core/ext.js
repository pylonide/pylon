/**
 * Extension manager for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var util = require("core/util");

//Prevent the introduction of globals
//apf.AmlElement.prototype.$propHandlers.id = function(value){
//    if (this.name == value)
//        return;
//
//    if (this.name) {
//        //#ifdef __WITH_NAMESERVER
//        apf.nameserver.remove(this.localName, this);
//        apf.nameserver.remove("all", this);
//        //#endif
//    }
//
//    if (apf.nameserver.get("all", value))
//        console.warn("ID collision of APF element: '" + value + "'");
//
//    //#ifdef __WITH_NAMESERVER
//    apf.nameserver.register(this.localName, value, this);
//    apf.nameserver.register("all", value, this);
//    //#endif
//
//    this.name = value;
//};

// used for local
const OFFLINE = 1 << 2;
const LOCAL = 1 << 4;
const ONLINE = 1 << 6;

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

    model : new apf.model(),

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

        var dt = new Date();

        if (!this.model.data)
            this.model.load("<plugins />");

        if (!this.model.queryNode("plugin[@path=" + util.escapeXpathString(path) + "]"))
            this.model.appendXml(apf.n("<plugin/>")
                .attr("type", this.typeLut[oExtension.type])
                .attr("name", oExtension.name || "")
                .attr("path", path)
                .attr("dev", oExtension.dev || "")
                .attr("enabled", "1")
                .attr("userext", "0").node());
        else
            this.model.setQueryValue("plugin[@path=" + util.escapeXpathString(path) + "]/@enabled", 1);

        //Don't init general extensions that cannot live alone
        if (!force && oExtension.type == this.GENERAL && !oExtension.alone) {
            oExtension.path = path;
            return oExtension;
        }

        oExtension.registered = true;
        oExtension.path = path;
        var defaultEnable = this.defaultEnable;
        var defaultDisable = this.defaultDisable;
        var defaultDestroy = this.defaultDestroy;
        oExtension.enable = oExtension.enable || defaultEnable;
        oExtension.disable = oExtension.disable || defaultDisable;
        oExtension.destroy = oExtension.destroy || defaultDestroy;
        oExtension.$enable = defaultEnable;
        oExtension.$disable = defaultDisable;
        oExtension.$destroy = defaultDestroy;

        this.extHandlers[oExtension.type].register(oExtension);

        this.extLut[path] = oExtension;
        this.extensions.push(oExtension);

        if (oExtension.hook) {
            oExtension.hook();

            ide.addEventListener("$event.hook." + oExtension.path, function(callback){
                callback.call(this, {ext : oExtension});
            });
            ide.dispatchEvent("hook." + oExtension.path, {
                ext : oExtension
            });
        }

        var escapedPath = util.escapeXpathString(path);
        var initTime = parseInt(this.model.queryValue("plugin[@path=" + escapedPath + "]/@init") || 0);
        this.model.queryNode("plugin[@path=" + escapedPath + "]").setAttribute("hook", Number(new Date() - dt) - initTime);

        return oExtension;
    },

    unregister : function(oExtension, silent) {
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

        this.model.setQueryValue("plugin[@path=" + util.escapeXpathString(oExtension.path) + "]/@enabled", 0);

        if (oExtension.inited)
            this.destroyExt(oExtension);

        return true;
    },

    getExtension : function(extension) {
        return this.extLut[extension];
    },

    initExtension : function(oExtension, amlParent) {
        if (oExtension.inited)
            return;

        var dt = new Date();

        oExtension.inited = true; // Prevent Re-entry

        var skin = oExtension.skin;
        if (skin && typeof skin == "object") {
            var data = oExtension.skin.data;
            oExtension.skinNode = new apf.skin(apf.extend({}, oExtension.skin, {data: null}));
            oExtension.skinNode.setProperty("src", data);
            apf.document.documentElement.appendChild(oExtension.skinNode);
        }

        //Load markup
        var markup = oExtension.markup;
        if (markup)
            (oExtension.markupInsertionPoint || amlParent || apf.document.documentElement).insertMarkup(markup);

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

        oExtension.init && oExtension.init(amlParent);

        ide.addEventListener("$event.init." + oExtension.path, function(callback){
            callback.call(this, {ext : oExtension});
        });
        ide.dispatchEvent("init." + oExtension.path, {
            ext : oExtension
        });

        this.model.queryNode("plugin[@path=" + util.escapeXpathString(oExtension.path) + "]").setAttribute("init", Number(new Date() - dt));
    },

    defaultEnable: function () {
        (this.nodes || []).each(function(item){
            item.enable && item.enable();
        });
        this.disabled = false;
        this.enabled = true;
    },

    defaultDisable: function () {
        (this.nodes || []).each(function(item) {
            item.disable && item.disable();
        });
        this.disabled = true;
        this.enabled = false;
    },

    defaultDestroy: function () {
        (this.nodes || []).each(function(item) {
            item.destroy && item.destroy(true, true);
        });
        this.nodes = [];
        this.disabled = true;
        this.enabled = false;
        delete this.inited;
    },

    enableExt : function(path) {
        var ext = require(path);
        ext.enable();
        this.model.setQueryValue("plugin[@path=" + util.escapeXpathString(path) + "]/@enabled", 1);
    },

    disableExt : function(path) {
        var ext = require(path);
        ext.disable();
        this.model.setQueryValue("plugin[@path=" + util.escapeXpathString(path) + "]/@enabled", 0);
    },

    destroyExt : function(ext) {
        ext.destroy();
    },

    execCommand: function(cmd, data) {
        if (cmd)
            cmd = cmd.trim();
        else
            cmd = "";

        var commands = self["req"+"uire"]("ext/commands/commands");
        var c9console = self["requ"+"ire"]("ext/console/console");

        var command = commands.commands[cmd];
        if (!command || !command.exec)
            return;

        if (cmd !== "clear" && cmd !== "newtab") {
            if (command.msg)
                c9console.write([command.msg], data);
            else
                c9console.write('"' + cmd + '" command executed', data);
        }

        var res = commands.exec(cmd, null, data);
        return res === undefined ? false : res;
    }
};

});
