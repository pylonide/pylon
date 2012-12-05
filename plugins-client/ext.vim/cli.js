/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var filesystem = require("ext/filesystem/filesystem");
var gotofile = require("ext/gotofile/gotofile");
var editors = require("ext/editors/editors");
var save = require("ext/save/save");
var ide = require("core/ide");

var cliCmds = exports.cliCmds = {
    w: function(editor, data) {
        var page = ide.getActivePage();
        if (!page)
            return;

        var lines = editor.session.getLength();
        if (data.argv.length === 2) {
            var path = (ide.davPrefix + "/" + data.argv[1]).replace(/\/+/, "/");
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
    },
    e: function(editor, data) {
        var path = data.argv[1];
        if (!path) {
            gotofile.toggleDialog(1);
            return false;
        }
        else {
            path = (ide.davPrefix + "/" + path).replace(/\/+/, "/");
            filesystem.exists(path, function(exists){
                if (exists) {
                    editors.gotoDocument({path: path});
                }
                else {
                    var node = filesystem.createFileNodeFromPath(path);
                    node.setAttribute("newfile", "1");
                    node.setAttribute("changed", "1");
                    node.setAttribute("cli", "1"); // blocks Save As dialog

                    var doc = ide.createDocument(node);
                    doc.cachedValue = "";

                    editors.gotoDocument({
                        doc: doc,
                        type: "newfile",
                        origin: "newfile"
                    });
                }
            });
        }
    },
    x: function(editor, data) {
        var page = ide.getActivePage();
        if (!page)
            return;
        if (page.$doc.getNode().getAttribute("changed"))
            cliCmds.w(editor, data);
        cliCmds.q();
    },
    wq: function(editor, data) {
        cliCmds.w(editor, data);
        cliCmds.q();
    },
    q: function(editor, data) {
        var page = ide.getActivePage();
        var corrected = ide.dispatchEvent("beforeclosetab", {
            page: page
        });
        if (corrected)
            page = corrected;
        if (data && data.force) {
            var at = page.$at;
            at.undo_ptr = at.$undostack[at.$undostack.length-1];
            page.$doc.getNode().removeAttribute("changed");
        }
        editors.close(page);
    },
    "q!": function() {
        cliCmds.q(null, {force: true});
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

exports.focusCommandLine = function(val) {
    txtConsoleInput.$editor.setValue(val, 1);
    setTimeout(function() { txtConsoleInput.focus(); });
}

exports.actions = {
    ":": {
        fn: function(editor, range, count, param) {
           exports.focusCommandLine(":");
        }
    },
    "/": {
        fn: function(editor, range, count, param) {
            exports.focusCommandLine("/");
        }
    },
    "?": {
        fn: function(editor, range, count, param) {
            exports.focusCommandLine("?");
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
    var cmd = e.data.command, success;
    var amlEditor = editors.currentEditor.amlEditor;
    if (editors.currentEditor.path == "ext/code/code" && amlEditor && cmd && typeof cmd === "string") {
        var ed = amlEditor.$editor;
        if (cmd[0] === ":") {
            cmd = cmd.substr(1);

            if (cliCmds[cmd]) {
                success = cliCmds[cmd](ed, e.data);
            }
            else if (cmd.match(/^\d+$/)) {
                ed.gotoLine(cmd, 0);
                ed.navigateLineStart();
            }
            else {
                console.log("Vim command '" + cmd + "' not implemented.");
            }

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
            setTimeout(function(){ ed.focus(); });
            e.returnValue = false;
        }
        // something blocks focusing without timeout
        if (success !== false) {
            setTimeout(function(){
                if (apf.activeElement == txtConsoleInput)
                    amlEditor.focus();
            });
        }
    }
};

});
