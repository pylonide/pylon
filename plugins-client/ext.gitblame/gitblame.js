/**
 * Git Blame extension for the Cloud9 IDE client
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext     = require("core/ext");
var ide     = require("core/ide");
var menus = require("ext/menus/menus");
var editors = require("ext/editors/editors");
var BlameJS = require("ext/gitblame/blamejs");
var util    = require("core/util");

module.exports = ext.register("ext/gitblame/gitblame", {
    name     : "Git Blame",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    nodes    : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    init : function(amlNode){
        this.blamejs = new BlameJS();
    },

    hook : function(){
        var _self = this;        
        menus.addItemByPath("Tools/Git/Blame", new apf.item({
            // @TODO: Support more CVSs? Just "Blame this File"
            onclick : function(){
                _self.startBlame();
            },
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            }
        }), 500);
        
        menus.addItemByPath("File/Git Blame", new apf.item({
            onclick : function() {
                _self.startBlame();
            },
            isAvailable : function(editor){
                return editor && editor.ceEditor;
            }
        }), 909);
        
        menus.addItemByPath("File/Git Blame", new apf.item({
            onclick : function() {
                _self.startBlame();
            }
        }), 909);
    },

    startBlame : function() {
        var _self = this;
        
        ext.initExtension(_self);
        _self.requestBlame();
    },

    requestBlame : function() {
        var cmd = "gittools";

        var data = {
            command : cmd,
            subcommand : "blame",
            file    : tabEditors.getPage().$model.data.getAttribute("path")
        };

        ide.addEventListener("socketMessage", this.$onMessage = this.onMessage.bind(this));
        ide.dispatchEvent("track_action", {type: "blame", cmd: cmd});
        if (ext.execCommand(cmd, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + cmd, {
              data: data
            }) !== false) {
                if (!ide.onLine) {
                    util.alert(
                        "Currently Offline",
                        "Currently Offline",
                        "This operation could not be completed because you are offline."
                    );
                }
                else {
                    ide.send(data);
                }
            }
        }
    },

    onMessage: function(e) {
        var message = e.message;

        if (message.type != "result" && message.subtype != "blame")
            return;

        // Is the body coming in piecemeal? Process after this message
        if (!message.body.out && !message.body.err)
            return;

        ide.removeEventListener("socketMessage", this.$onMessage = this.onMessage.bind(this));

        //console.log(message);
        if (message.body.err) {
            util.alert(
                "Error",
                "There was an error returned from the server:",
                message.body.err
            );

            return;
        }

        if (!this.blamejs.parseBlame(message.body.out)) {
            util.alert(
                "Problem Parsing",
                "Problem Parsing",
                "There was a problem parsing the blame output. Blame us, blame the file, but don't blame blame. Blame."
            );
            return false;
        }

        // Now formulate the output
        this.formulateOutput(this.blamejs.getCommitData(), this.blamejs.getLineData());
    },

    formulateOutput : function(commit_data, line_data) {
        var textHash = {}, lastHash = "";
        for (var li in line_data) {
            if (line_data[li].numLines != -1 && line_data[li].hash != lastHash) {
                lastHash = line_data[li].hash;
                var tempTime = new Date(parseInt(commit_data[line_data[li].hash].authorTime, 10) * 1000);
                textHash[li-1] = {
                    text : commit_data[line_data[li].hash].author +
                        " \xBB " +
                        line_data[li].hash.substr(0, 10),
                    title : commit_data[line_data[li].hash].summary + "\n" +
                        tempTime.toUTCString()
                };
            }
        }
        
        if (!this.BlameGutter) {
            require(["ext/gitblame/blame_gutter"], function(module) {
                this.BlameGutter = module.BlameGutter;
                addBlameGutter()
            });
        } else {
            addBlameGutter()
        }
            
        function addBlameGutter() {
            var ace = editors.currentEditor.amlEditor.$editor
            if (!ace.blameGutter)
                new this.BlameGutter(ace);
            
            ace.blameGutter.setData(textHash);
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
        menus.remove("Tools/Git/Blame");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);
