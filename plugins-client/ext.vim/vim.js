/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var code = require("ext/code/code");
var cliCmds = require("ext/vim/cli");
var menus = require("ext/menus/menus");
var settings = require("ext/settings/settings");
var markupSettings =  require("text!ext/vim/settings.xml");
//var commands = require("ext/commands/commands");

var VIM_ENABLED = false;
var isLoading = false;
var vimHandler = null;
var cliAutoOpened = null;

var _loadKeyboardHandler = function(path, callback) {
    var _self = this;
    var module;
    try {
        module = require(path);
    } catch (e) {};
    if (module)
        return callback(module);


    fetch(function() {
        require([path], callback);
    });

    function fetch(callback) {
        if (!ace.config.get("packaged"))
            return callback();

        var base = path.split("/").pop();
        var filename = ide.staticPrefix + "/ace/build/keybinding-" + base + ".js";
        var aceNetModule = "ace/lib/net";
        require(aceNetModule).loadScript(filename, callback);
    }
};

var enableVim = function enableVim() {
    ext.initExtension(this);

    ide.addEventListener("init.ext/code/code", function(e){
        var editor = e.ext.amlEditor.$editor;
        VIM_ENABLED = true;

        if (vimHandler) {
            editor.setKeyboardHandler(vimHandler);
            editor.on("vimMode", vimHandler.$statusListener);
            ide.dispatchEvent("track_action", {type: "vim", action: "enable", mode: "normal"});
            require("ext/console/console").showInput();
        } else {
            if (isLoading)
                return;
            isLoading = true;
            _loadKeyboardHandler("ace/keyboard/vim", function(module) {
                vimHandler = module.handler;
                vimHandler.$statusListener = function(mode) {
                    ide.dispatchEvent("vim.changeMode", { mode : "mode" });
                };
                editor.setKeyboardHandler(vimHandler);
                editor.on("vimMode", vimHandler.$statusListener);
                ide.dispatchEvent("track_action", {type: "vim", action: "enable", mode: "normal"});
                var cli = require("ext/console/console");
                if (cli.hiddenInput) {
                    cli.showInput();
                    cliAutoOpened = true;
                }
                cliCmds.addCommands(vimHandler);
            })
        }
    });
};

var disableVim = function() {
    var editor = code.amlEditor.$editor;
    if (editor) {
        editor.keyBinding.removeKeyboardHandler(vimHandler);
        editor.removeEventListener("vimMode", vimHandler.$statusListener);
    }
    ide.dispatchEvent("track_action", { type: "vim", action: "disable" });
    VIM_ENABLED = false;
    
    var cli = require("ext/console/console");
    if (!cli.hiddenInput && cliAutoOpened) {
        cli.hideInput();
        cliAutoOpened = false;
    }
};

module.exports = ext.register("ext/vim/vim", {
    name  : "Vim mode",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    deps  : [editors, code, settings],
    nodes : [],
    alone : true,

    hook : function() {
        var self = this;
        var menuItem = new apf.item({
            type: "check",
            checked: "[{require('core/settings').model}::editors/code/@vimmode]",
            onclick: function() { self.toggle(); }
        });

        menus.addItemByPath("View/Vim Mode", menuItem, 150000);

        ide.addEventListener("settings.load", function(){
            settings.setDefaults("editors/code", [
                ["vimmode", "false"]
            ]);
        });

        settings.addSettings("Code Editor", markupSettings);

        var tryEnabling = function () {
            if (settings.model) {
                var sholdEnable = apf.isTrue(settings.model.queryNode("editors/code").getAttribute("vimmode"));
                if (VIM_ENABLED == sholdEnable)
                    return;
                self.enable(sholdEnable === true);
            }
        };
        ide.addEventListener("init.ext/code/code", tryEnabling);
        ide.addEventListener("code.ext:defaultbindingsrestored", tryEnabling);
    },

    toggle: function() {
        this.enable(VIM_ENABLED === false);
        if (code.amlEditor) {
            code.amlEditor.focus();
        }
    },

    init: function() {
        // require("ext/console/console").showInput();
    },

    // Enable accepts a `doEnable` argument which executes `disable` if false.
    enable: function(doEnable) {
        if (doEnable !== false) {
            ide.removeEventListener("consolecommand", cliCmds.onConsoleCommand);
            ide.addEventListener("consolecommand", cliCmds.onConsoleCommand);
            enableVim.call(this);
        }
        else {
            this.disable();
        }
    },

    disable: function() {
        ide.removeEventListener("consolecommand", cliCmds.onConsoleCommand);
        disableVim();
    },

    destroy: function() {
        menus.remove("Tools/Vim mode");
        this.$destroy();
    }
});
});



