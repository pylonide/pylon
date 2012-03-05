/**
 * Git Blame extension for the Cloud9 IDE client
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext     = require("core/ext");
var ide     = require("core/ide");
var editors = require("ext/editors/editors");
var BlameJS = require("ext/gitblame/blamejs");
var util    = require("core/util");

module.exports = ext.register("ext/gitblame/gitblame", {
    name     : "Git Blame",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    nodes    : [],

    init : function(amlNode){
        this.blamejs = new BlameJS();
        this.originalGutterWidth = editors.currentEditor.ceEditor.$editor.renderer.getGutterWidth();
    },

    hook : function(){
        var _self = this;

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        tabEditors.addEventListener("beforeswitch", function(e){
            if (editors.currentEditor) {
                editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationTextArr([]);
                editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth(_self.originalGutterWidth + "px");
            }
        });

        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                // @TODO: Support more CVSs? Just "Blame this File"
                caption : "Git Blame this File",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.requestBlame();
                }
            }))
        );
    },

    requestBlame : function() {
        var cmd = "gittools";

        var data = {
            command : cmd,
            subcommand : "blame",
            file    : tabEditors.getPage().$model.data.getAttribute("path")
        };

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
                    // Set gutter width
                    editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth("300px");
                }
            }
        }
    },

    onMessage: function(e) {
        var message = e.message;

        if (message.type != "result" && message.subtype != "blame")
            return;

        //console.log(message);
        if (message.body.err) {
            util.alert(
                "Error",
                "There was an error returned from the server:",
                message.body.err
            );

            return;
        }

        // Is the body coming in piecemeal? Process after this message
        if (!message.body.out)
            return;

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
                        " &raquo; " +
                        line_data[li].hash.substr(0, 10),
                    title : commit_data[line_data[li].hash].summary + "\n" +
                        tempTime.toUTCString()
                };
            }
        }
        editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationTextArr(textHash);
        editors.currentEditor.ceEditor.$editor.renderer.updateFull();
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

    }
);