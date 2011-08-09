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

return ext.register("ext/gittools/gittools", {
    name     : "Git Tools",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    command  : "gittools",

    nodes : [],
    gitLogs : {},
    currentGitLogs : {},
    filteredLogData : {},
    lastFilterValue : "",

    init : function(amlNode) {
        var _self = this;

        this.blamejs = new BlameJS();
        this.gitLogParser = new GitLogParser();

        dock.register(this.name, "Git Tools", {
            menu : "Tools/Git Tools",
            primary : {
                backgroundImage: "/static/style/images/git-tools.png",
                defaultState: { x: 1, y: 2 },
                activeState: { x: 1, y: 2 }
            }
        }, function(type) {
            return tabGitTools.firstChild;
        });

        dock.addDockable({
            width : 330,
            height : 410,
            buttons : [
                { caption: "Git Tools", ext : [this.name, "Git Tools"] }
            ]
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        tabEditors.addEventListener("afterswitch", function(e){
            _self.currentFile = _self.getFilePath(e.previous);
            _self.currentGitLogs = _self.gitLogs;
            _self.setupGitLogElements(_self.currentFile);
            if (!_self.gitLogs[_self.currentFile])
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

        this.currentGitLogs[file].lastSliderValue = sliderGitLog.value;
        this.formulateGitLogOut(sliderGitLog.value);
        lblGitRevisions.setAttribute("caption", "Revision " +
            sliderGitLog.value + "/" + this.currentGitLogs[file].logData.length);
        if (sliderGitLog.value != this.currentGitLogs[file].lastLoadedGitLog) {
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
                    ide.socket.send(JSON.stringify(data));
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
                    ide.socket.send(JSON.stringify(data));
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
                    ide.socket.send(JSON.stringify(data));
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

    setupGitLogElements: function(file) {
        var fileName = file.substr(file.lastIndexOf("/") + 1);
        if (this.currentGitLogs[file]) {
            var logDataLength = this.currentGitLogs[file].logData.length;
            lblGitLog.setAttribute("caption", fileName);
            lblGitRevisions.setAttribute("caption", "Revision " +
                 logDataLength + "/" + logDataLength);
            sliderGitLog.setAttribute("max", logDataLength);
            sliderGitLog.setAttribute("markers", "false");
            sliderGitLog.setAttribute("markers", "true");
            sliderGitLog.enable();
            sliderGitLog.setValue(this.currentGitLogs[file].lastSliderValue);
            this.formulateGitLogOut(this.currentGitLogs[file].lastSliderValue);
            if (this.currentGitLogs[file].lastLoadedGitLog != logDataLength) {
                editors.currentEditor.ceEditor.$editor.setReadOnly(true);
            } else {
                editors.currentEditor.ceEditor.$editor.setReadOnly(false);
            }
        } else {
            lblGitLog.setAttribute("caption", fileName);
            lblGitRevisions.setAttribute("caption", "No Revisions");
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

        // Lowercase all the searchable properties to speed up filtering
        var logData = this.gitLogs[message.body.file].logData;
        for (var gi = 0; gi < logDataLength; gi++) {
            logData[gi].commitLower = logData[gi].commit.toLowerCase();
            logData[gi].parentLower = logData[gi].parent.toLowerCase();
            logData[gi].treeLower = logData[gi].tree.toLowerCase();
            logData[gi].messageJoinedLower = logData[gi].messageJoined.toLowerCase();
            logData[gi].author.emailLower = logData[gi].author.email.toLowerCase();
            logData[gi].author.fullNameLower = logData[gi].author.fullName.toLowerCase();
            logData[gi].committer.emailLower = logData[gi].committer.email.toLowerCase();
            logData[gi].committer.fullNameLower = logData[gi].committer.fullName.toLowerCase();
        }
        this.setupGitLogElements(message.body.file);
    },

    formulateGitLogOut: function(index) {
        var gitLogOut = "";
        var file = this.getFilePath();
        if (!this.gitLogs[file])
            return;

        if (!this.currentGitLogs[file].logData[index]) {
            gitLogOut = '<div style="color: #333"><strong>* Current</strong><br /><br /><em>Any uncommitted changes</em></div>';
        }
        else {
            var tDate = new Date(parseInt(this.currentGitLogs[file].logData[index].author.timestamp, 10) * 1000);
            gitLogOut = '<div style="color: #333"><span class="header">Commit</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            this.currentGitLogs[file].logData[index].commit + //.substr(0, 10)
                            '<br /><span class="header">Tree</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            this.currentGitLogs[file].logData[index].tree + //.substr(0, 10)
                            '<br /><span class="header">Parent</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            this.currentGitLogs[file].logData[index].parent + //.substr(0, 10)
                            '<br /><span class="header">Author</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            this.currentGitLogs[file].logData[index].author.fullName + ' ' +
                            this.currentGitLogs[file].logData[index].author.email.replace("<", "&lt;").replace(">", "&gt;") +
                            '<br /><span class="header">Time</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            tDate.toLocaleDateString().split(" ").slice(1).join(" ") +
                            " " + tDate.toLocaleTimeString() +
                            '<br /><br /><span class="header">Commit Summary</span><br /><br />' +
                            this.currentGitLogs[file].logData[index].message.join("<br />") +
                            '</div>';
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

            this.gitShow(this.currentGitLogs[file].logData[sliderGitLog.value].commit);
        }

        this.currentGitLogs[file].lastLoadedGitLog = sliderGitLog.value;
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

    searchFilter : function(value) {
        if (value != this.lastFilterValue) {
            // Clear the search
            if (value.length === 0) {
                this.lastFilterValue = value;
                this.currentGitLogs = this.gitLogs;
                this.setupGitLogElements(this.currentFile);
            }
            else if (value.length >= 3) {
                this.applyFilter(value);
                this.lastFilterValue = value;
            }
        }
    },
    
    applyFilter : function(filter) {
        var logs = this.gitLogs[this.currentFile];
        if (!logs)
            return;

        filter = filter.toLowerCase();
        this.filteredLogData[this.currentFile] = {};
        this.filteredLogData[this.currentFile].logData = [];

        //console.log(logs.logData);
        for (var gi = 0; gi < logs.logData.length; gi++) {
            if (logs.logData[gi].commitLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].parentLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].treeLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].messageJoinedLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].author.emailLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].author.fullNameLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].committer.emailLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
            if (logs.logData[gi].committer.fullNameLower.indexOf(filter) >= 0) {
                this.filteredLogData[this.currentFile].logData.push(logs.logData[gi]);
                continue;
            }
        }

        //console.log(this.filteredLogData[this.currentFile]);
        this.currentGitLogs = this.filteredLogData;
        this.setupGitLogElements(this.currentFile);
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