/**
 * Git Tools for the Cloud9 IDE client
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var dock = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/gittools/gittools.xml");
var editors = require("ext/editors/editors");
var BlameJS = require("ext/gittools/blamejs");
var GitLogParser = require("ext/gittools/gitlogparser");

module.exports = ext.register("ext/gittools/gittools", {
    name     : "Git Tools",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    command  : "gittools",

    nodes : [],
    gitLogs : {},

    init : function(amlNode) {
        var _self = this;

        this.blamejs = new BlameJS();
        this.gitLogParser = new GitLogParser();

        dock.register(this.name, "Git Tools", {
            menu : "Tools/Git Tools",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -6, y: -217 },
                activeState: { x: -6, y: -217 }
            }
        }, function(type) {
            return tabGitTools.firstChild;
        });

        dock.addDockable({
            width : 260,
            height : 340,
            buttons : [
                { caption: "Git Tools", ext : [this.name, "Git Tools"] }
            ]
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        tabEditors.addEventListener("afterswitch", function(e){
            var file = _self.getFilePath(e.previous);
            _self.setupGitLogElements(file);
            if (!_self.gitLogs[file])
                _self.gitLog();
            /*if (editors.currentEditor) {
                editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationTextArr([]);
                if (_self.originalGutterWidth)
                    editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth(_self.originalGutterWidth + "px");
            }*/
        });
    },

    getFilePath : function(filePath) {
        if (typeof filePath === "undefined")
            filePath = tabEditors.getPage().$model.data.getAttribute("path");
        if (filePath.indexOf("/workspace/") === 0)
            filePath = filePath.substr(11);

        return filePath;
    },

    gitLogSliderMouseUp : function() {
        //console.log("mouseup");
    },

    gitLogSliderChange : function() {
        var file = this.getFilePath();
        if (!this.gitLogs[file])
            return;

        this.gitLogs[file].lastSliderValue = sliderGitLog.value;
        this.formulateGitLogOut(sliderGitLog.value);
        if (sliderGitLog.value != this.gitLogs[file].lastLoadedGitLog) {
            btnViewRevision.enable();
            btnGitBlame.disable();
        } else {
            btnViewRevision.disable();
            btnGitBlame.enable();
        }
    },

    gitLog : function() {
        var data = {
            command : this.command,
            subcommand : "log",
            file : this.getFilePath()
        };

        ide.dispatchEvent("track_action", {type: "gittools", cmd: this.command, subcommand: data.subcommand});
        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, {
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
                    if (!this.gitLogs[data.file]) {
                        this.gitLogs[data.file] = {
                            logData : [],
                            lastLoadedGitLog : 0,
                            lastSliderValue : 0,
                            currentRevision : editors.currentEditor ? editors.currentEditor.ceEditor.getSession().getValue() : "",
                            revisions : {}
                        };
                    }
                    ide.send(data);
                }
            }
        }
    },

    gitBlame : function() {
        var data = {
            command : this.command,
            subcommand : "blame",
            file : this.getFilePath()
        };

        if (this.gitLogs[data.file]) {
            var lastLoadedGitLog = this.gitLogs[data.file].lastLoadedGitLog;
            if (this.gitLogs[data.file] && this.gitLogs[data.file].logData[lastLoadedGitLog])
                data.hash = this.gitLogs[data.file].logData[lastLoadedGitLog].commit;
        }

        ide.dispatchEvent("track_action", {type: "gittools", cmd: this.command, subcommand: data.subcommand});
        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, {
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
                    if (!this.originalGutterWidth)
                        this.originalGutterWidth = editors.currentEditor.ceEditor.$editor.renderer.getGutterWidth();

                    // Set gutter width, arbitrary number based on 12/13px font
                    editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth("300px");
                }
            }
        }
    },

    gitShow : function(hash) {
        var data = {
            command : this.command,
            subcommand : "show",
            file : this.getFilePath(),
            hash : hash
        };

        ide.dispatchEvent("track_action", {type: "gittools", cmd: this.command, subcommand: data.subcommand});
        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, {
              data: data
            }) !== false) {
                if (!ide.onLine) {
                    util.alert(
                        "Currently Offline",
                        "Currently Offline",
                        "This operation could not be completed because you are offline."
                    );
                } else {
                    ide.send(data);
                }
            }
        }
    },

    onMessage: function(e) {
        var message = e.message;
        //console.log(message);

        if (message.type != "result" && message.subtype != "gittools")
            return;

        if (message.body.err) {
            util.alert(
                "Error",
                "There was an error returned from the server:",
                message.body.err
            );

            return;
        }

        switch(message.body.gitcommand) {
            case "blame":
                this.onGitBlameMessage(message);
                break;
            case "log":
                this.onGitLogMessage(message);
                break;
            case "show":
                this.onGitShowMessage(message);
                break;
            default:
                return;
        }
    },

    onGitShowMessage : function(message) {
        this.gitLogs[message.body.file].revisions[message.body.hash] =
            message.body.out;
        editors.currentEditor.ceEditor.getSession().setValue(message.body.out);
        editors.currentEditor.ceEditor.$editor.setReadOnly(true);
    },

    onGitBlameMessage: function(message) {
        if (!this.blamejs.parseBlame(message.body.out)) {
            util.alert(
                "Problem Parsing",
                "Problem Parsing",
                "There was a problem parsing the blame output."
            );

            return false;
        }

        this.outputGitBlame(this.blamejs.getCommitData(), this.blamejs.getLineData());
    },

    // Very bad slider hack below in setAttr("markers"
    // Slider element should have a function to set
    // attributes like min, max, step, etc which will
    // then redraw the element
    setupGitLogElements: function(file) {
        var fileName = file.substr(file.lastIndexOf("/") + 1);
        if (this.gitLogs[file]) {
            lblGitLog.setAttribute("caption", fileName + " revisions (" +
                this.gitLogs[file].logData.length + ")");
            sliderGitLog.setAttribute("max", this.gitLogs[file].logData.length);
            sliderGitLog.setAttribute("markers", "false");
            sliderGitLog.setAttribute("markers", "true");
            sliderGitLog.enable();
            sliderGitLog.setValue(this.gitLogs[file].lastSliderValue);
            this.formulateGitLogOut(this.gitLogs[file].lastSliderValue);
            if (this.gitLogs[file].lastLoadedGitLog != this.gitLogs[file].logData.length) {
                editors.currentEditor.ceEditor.$editor.setReadOnly(true);
            } else {
                editors.currentEditor.ceEditor.$editor.setReadOnly(false);
            }
        } else {
            lblGitLog.setAttribute("caption", fileName + " revisions (0)");
            sliderGitLog.setAttribute("max", 1);
            sliderGitLog.setValue(1);
            sliderGitLog.setAttribute("markers", "false");
            sliderGitLog.setAttribute("markers", "true");
            sliderGitLog.disable();
            btnViewRevision.disable();
            btnGitBlame.enable();
            txtGitLog.setValue("");
            if (editors.currentEditor)
                editors.currentEditor.ceEditor.$editor.setReadOnly(false);
        }
    },

    onGitLogMessage: function(message) {
        this.gitLogParser.parseLog(message.body.out);

        this.gitLogs[message.body.file].logData = this.gitLogParser.getLogData();

        var logDataLength = this.gitLogs[message.body.file].logData.length;
        this.gitLogs[message.body.file].lastLoadedGitLog =
            this.gitLogs[message.body.file].lastSliderValue = logDataLength;
        this.setupGitLogElements(message.body.file);
    },

    formulateGitLogOut: function(index) {
        var gitLogOut = "";
        var file = this.getFilePath();
        if (!this.gitLogs[file])
            return;

        if (!this.gitLogs[file].logData[index]) {
            gitLogOut = '<div style="font-weight: bold; color: #333">* Current</div>';
        }
        else {
            var tDate = new Date(parseInt(this.gitLogs[file].logData[index].author.timestamp, 10) * 1000);
            gitLogOut = '<div style="color: #333"><span class="header">Commit:</span> '
                            + this.gitLogs[file].logData[index].commit //.substr(0, 10)
                            + '<br /><span class="header">Tree:</span> '
                            + this.gitLogs[file].logData[index].tree //.substr(0, 10)
                            + '<br /><span class="header">Parent:</span> '
                            + this.gitLogs[file].logData[index].parent //.substr(0, 10)
                            + '<br /><span class="header">Author:</span> '
                            + this.gitLogs[file].logData[index].author.fullName + ' '
                            + this.gitLogs[file].logData[index].author.email.replace("<", "&lt;").replace(">", "&gt;")
                            + '<br /><span class="header">Time:</span> '
                            + tDate.toLocaleDateString().split(" ").slice(1).join(" ")
                            + " " + tDate.toLocaleTimeString()
                            + '<br /><br /><span class="header">Commit Summary:</span><br /><br />'
                            + this.gitLogs[file].logData[index].message.join("<br />")
                            + '</div>';
        }

        txtGitLog.setValue(gitLogOut);
    },

    loadFileRevision : function() {
        var file = this.getFilePath();
        if (sliderGitLog.value == this.gitLogs[file].logData.length) {
            editors.currentEditor.ceEditor.getSession().setValue(
                this.gitLogs[file].currentRevision
            );
            editors.currentEditor.ceEditor.$editor.setReadOnly(false);
        } else {
            // Save the latest version of the file
            if (this.gitLogs[file].lastLoadedGitLog == this.gitLogs[file].logData.length)
                this.gitLogs[file].currentRevision = editors.currentEditor.ceEditor.getSession().getValue();

            this.gitShow(this.gitLogs[file].logData[sliderGitLog.value].commit);
        }

        this.gitLogs[file].lastLoadedGitLog = sliderGitLog.value;
        btnViewRevision.disable();
        btnGitBlame.enable();
    },

    outputGitBlame : function(commit_data, line_data) {
        var textHash = {}, lastHash = "";
        for (var li in line_data) {
            if (line_data[li].numLines != -1 && line_data[li].hash != lastHash) {
                lastHash = line_data[li].hash;
                var tempTime = new Date(parseInt(commit_data[line_data[li].hash].authorTime, 10) * 1000);
                textHash[li-1] = {
                    text : commit_data[line_data[li].hash].author + " &raquo; " +
                        tempTime.getDate() + "/" + (tempTime.getMonth()+1) + "/" + tempTime.getFullYear(),
                        //+ line_data[li].hash.substr(0, 10)
                    title : "Commit Hash: " + line_data[li].hash.substr(0, 10) +
                        "\n" + commit_data[line_data[li].hash].summary +
                        "\n" + tempTime.toUTCString()
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