/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var save;
var cliCmds = exports.cliCmds = {
    w: function(editor, data) {
        if (!save)
            save = require("ext/save/save");

        var page = tabEditors.getPage();
        if (!page)
            return;

        var lines = editor.session.getLength();
        if (data.argv.length === 2) {
            var path = ("/workspace/" + data.argv[1]).replace(/\/+/, "/");
            page.$model.data.setAttribute("path", path);

            save.saveas(page, function() {
                console.log(path + " [New] " + lines + "L, ##C written");
            });
        }
        else {
            save.quicksave(null, function() {
                console.log(page.name + " " + lines +"L, ##C written");
            });
        }
    }
};

// aliases
cliCmds.write = cliCmds.w;

exports.searchStore = {
    current: "",
    options: {
        needle: "",
        backwards: false,
        wrap: true,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    }
};


exports.actions = {
    ":": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue(":");
        }
    },
    "/": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue("/");
        }
    },
    "?": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue("?");
        }
    }
};

exports.addCommands = function(handler) {
    var actions = handler.actions;
    Object.keys(exports.actions).forEach(function(i){
        actions[i] = exports.actions[i];
    })
}

exports.onConsoleCommand = function(e) {
    var cmd = e.data.command;
    if ((typeof ceEditor !== "undefined") && cmd && typeof cmd === "string") {
        var ed = ceEditor.$editor;
        if (cmd[0] === ":") {
            cmd = cmd.substr(1);

            if (cliCmds[cmd]) {
                cliCmds[cmd](ed, e.data);
            }
            else if (cmd.match(/^\d+$/)) {
                ed.gotoLine(cmd, 0);
                ed.navigateLineStart();
            }
            else {
                console.log("Vim command '" + cmd + "' not implemented.");
            }

            ceEditor.focus();
            e.returnValue = false;
        }
        else if (cmd[0] === "/" || cmd[0] === "?") {
            var options = exports.searchStore.options;
            options.backwards = cmd[0] === "?";
            cmd = cmd.substr(1);
            if (cmd)
                exports.searchStore.current = cmd;
            else
                cmd = exports.searchStore.current;
            ed.find(cmd, options);
            ceEditor.focus();
            e.returnValue = false;
        }
    }
};

});
