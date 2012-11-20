/**
 * Git Blame extension for the Cloud9 IDE client
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext     = require("core/ext");
var ide     = require("core/ide");
var menus   = require("ext/menus/menus");
var editors = require("ext/editors/editors");
var BlameJS = require("ext/gitblame/blamejs");
var util    = require("core/util");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/gitblame/gitblame", {
    name     : "Git Blame",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    nodes    : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    hook : function() {
        var _self = this;
        menus.addItemByPath("Tools/Git/Blame", new apf.item({
            // @TODO: Support more CVSs? Just "Blame this File"
            onclick : function(){
                _self.startBlame();
            },
            isAvailable : function(editor){
                return editor && editor.path === "ext/code/code";
            }
        }), 500);
        
        menus.addItemByPath("File/Git Blame", new apf.item({
            onclick : function() {
                _self.startBlame();
            },
            isAvailable : function(editor){
                return editor && editor.path === "ext/code/code";
            }
        }), 909);
    },

    startBlame : function() {
        ext.initExtension(this);
        this.requestBlame();
    },

    requestBlame : function() {
        var cmd = "gittools";
        var page = tabEditors.getPage();
        if (!page)
            return;
        var path = page.$model.data.getAttribute("path");

        var lastSlash = path.lastIndexOf("/");
        var fileName = path.substr(lastSlash + 1);
        var dirName = path.substring(ide.davPrefix.length + 1, lastSlash);
        if (dirName == "/")
            dirName = ide.workspaceDir;
        else
            dirName = ide.workspaceDir + "/" + dirName;

        var data = {
            command: "git",
            argv: ["git", "blame", "-p", fileName],
            extra: {type: "gitblame", path: path, original_line: ""},
            requireshandling: !commands.commands.git,
            cwd: dirName // needed for nested repositories
        };
        // @todo should we change server side plugin to not require this?
        data.line = data.argv.join(" ");

        if (!this.$onMessage) {
            this.$onMessage = this.onMessage.bind(this);
            ide.addEventListener("socketMessage", this.$onMessage);
            this.blamejs = {};
        }
        this.blamejs[path] = new BlameJS();

        var status = "Loading...";
        ide.dispatchEvent("track_action", {type: "blame", cmd: cmd});
        if (ext.execCommand(cmd, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + cmd, {data: data}) !== false) {
                if (!ide.onLine) {
                    status = "This operation could not be completed because you are offline.";
                }
                else {
                    ide.send(data);
                }
            }
        }
        this.displayGutter([{text: status, title: ""}], path);
    },

    onMessage: function(e) {
        var message = e.message;

        if (!message.extra || message.extra.type != "gitblame")
            return false;
        if (!this.blamejs[message.extra.path])
            return;

        var type = message.type.substr(-5);
        if (type == "-exit") {
            message.code && util.alert(
                "Error", "There was an error returned from the server:",
                message.data
            );
            delete this.blamejs[path];
            return;
        }
        // Is the body coming in piecemeal? Process after this message
        if (type != "-data" || !message.data) {
            return;
        }
        var path = message.extra.path;
        var blamejs = this.blamejs[path];

        if (!blamejs.parseBlame(message.data)) {
            util.alert(
                "Problem Parsing", "Problem Parsing",
                "There was a problem parsing the blame output. Blame us, blame the file, but don't blame blame.\nBlame."
            );
            return false;
        }

        // Now formulate the output
        this.formulateOutput(blamejs, path);
    },

    formulateOutput : function(blamejs, path) {
        var commitData = blamejs.getCommitData();
        var lineData = blamejs.getLineData();
        var textHash = {}, lastHash = "";
        for (var li in lineData) {
            if (lineData[li].numLines != -1 && lineData[li].hash != lastHash) {
                lastHash = lineData[li].hash;
                var tempTime = new Date(parseInt(commitData[lineData[li].hash].authorTime, 10) * 1000);
                textHash[li-1] = {
                    text : commitData[lineData[li].hash].author +
                        " \xBB " +
                        lineData[li].hash.substr(0, 10),
                    title : commitData[lineData[li].hash].summary + "\n" +
                        tempTime.toUTCString()
                };
            }
        }
        this.displayGutter(textHash, path);
    },

    displayGutter : function(textHash, path) {
       if (this.waiting) {
            this.waiting = {textHash: textHash, path: path};
            return;
        }
        var _self = this;
        function addBlameGutter() {
            if (_self.waiting) {
                textHash = _self.waiting.textHash;
                path = _self.waiting.path;
                _self.waiting = null;
            }
            // todo support showing blame for background tabs
            var page = tabEditors.getPage();
            if (!page)
                return;
            var currentPath = page.$model.data.getAttribute("path");
            if (path != currentPath)
                return;

            var ace = editors.currentEditor.amlEditor.$editor;
            if (!ace.blameGutter)
                new _self.BlameGutter(ace);

            ace.blameGutter.setData(textHash);
        }
        
        if (!this.BlameGutter) {
            var extPath = "ext/gitblame/blame_gutter";
            try{
                this.BlameGutter = require("ext/git"+"blame/blame_gutter").BlameGutter;
            } catch(e){}
        }
        
        if (!this.BlameGutter) {
            this.waiting = {textHash: textHash, path: path};
            require(["ext/gitblame/blame_gutter"], function(module) {
                _self.BlameGutter = module.BlameGutter;
                addBlameGutter();
            });
        } else {
            addBlameGutter();
        }
    },

    destroy : function(){
        menus.remove("Tools/Git/Blame");
        this.$destroy();
    }
});

});
