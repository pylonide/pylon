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

    fileData : {},

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

        tabEditors.addEventListener("afterswitch", function (e) {
            _self.currentFile = _self.getFilePath(e.previous);
            if (_self.fileData[_self.currentFile] && _self.fileData[_self.currentFile].gitLog.currentLogData.length === 0) {
                _self.fileData[_self.currentFile].gitLog.currentLogData = _self.fileData[_self.currentFile].gitLog.logData;
            } else {
                tboxGitToolsFilter.setValue(
                    _self.fileData[_self.currentFile] ?
                    _self.fileData[_self.currentFile].gitLog.lastFilterValue :
                    ""
                );
            }
            _self.setGitLogState(_self.currentFile);
            if (!_self.fileData[_self.currentFile])
                _self.gitLog();
            if (editors.currentEditor)
                _self.resetAceGutter();
        });
    },
    
    resetAceGutter : function() {
        if (editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationText)
            editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationText([]);
        if (this.originalGutterWidth)
            editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth(this.originalGutterWidth + "px");
    },

    getFilePath : function(filePath) {
        if (typeof filePath === "undefined")
            filePath = tabEditors.getPage().$model.data.getAttribute("path");
        if (filePath.indexOf("/workspace/") === 0)
            filePath = filePath.substr(11);

        return filePath;
    },

    onGitLogSliderChange : function() {
        if (this.fileData[this.currentFile]) {
            this.fileData[this.currentFile].gitLog.lastSliderValue = sliderGitLog.value;
            this.gitLogSliderChange(sliderGitLog.value);
        }
    },

    gitLogSliderChange : function(value) {
        //if (!this.fileData[this.currentFile])
        //    return;

        this.formulateGitLogOut(value);
        lblGitRevisions.setAttribute("caption", "Revision " +
            value + "/" + this.fileData[this.currentFile].gitLog.currentLogData.length);
        //if (value != this.fileData[this.currentFile].gitLog.lastLoadedGitLog) {
        if (!this.fileData[this.currentFile].gitLog.currentLogData[value] &&
                this.fileData[this.currentFile].gitLog.lastLoadedLogHash !== "") {
            btnViewRevision.enable();
            btnGitBlame.disable();
        }
        else if (this.fileData[this.currentFile].gitLog.currentLogData[value] &&
              this.fileData[this.currentFile].gitLog.currentLogData[value].commit !=
              this.fileData[this.currentFile].gitLog.lastLoadedLogHash) {
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
                    if (!this.fileData[data.file]) {
                        this.fileData[data.file] = {
                            gitLog : {
                                lastFilterValue : "",
                                logData : [],
                                currentLogData : [],
                                lastLoadedLogHash : "",
                                lastSliderValue : 0,
                                currentRevision : editors.currentEditor ? editors.currentEditor.ceEditor.getSession().getValue() : "",
                                revisions : {}
                            }
                        };
                    }
                    ide.socket.send(JSON.stringify(data));
                }
            }
        }
    },

    /**
     * @TODO REFACTOR
     */
    gitBlame : function() {
        var data = {
            command : this.command,
            subcommand : "blame",
            file : this.currentFile
        };

        if (this.fileData[data.file]) {
            if (this.fileData[data.file] && this.fileData[data.file].gitLog.lastLoadedLogHash)
                data.hash = this.fileData[data.file].gitLog.lastLoadedLogHash;
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
                    editors.currentEditor.ceEditor.$editor.renderer.setGutterWidth("265px");
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
        this.fileData[message.body.file].gitLog.revisions[message.body.hash] =
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
    
    onGitLogMessage: function(message) {
        this.gitLogParser.parseLog(message.body.out);

        this.fileData[message.body.file].gitLog.logData = this.gitLogParser.getLogData();
        var logDataLength = this.fileData[message.body.file].gitLog.logData.length;

        //this.fileData[message.body.file].gitLog.lastLoadedGitLog = 
            this.fileData[message.body.file].gitLog.lastSliderValue = logDataLength;

        // Lowercase all the searchable properties to speed up filtering
        var logData = this.fileData[message.body.file].gitLog.logData;
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
        
        this.fileData[message.body.file].gitLog.currentLogData = this.fileData[message.body.file].gitLog.logData;
        this.setGitLogState(message.body.file);
    },

    setGitLogState : function(file) {
        var fileName = file.substr(file.lastIndexOf("/") + 1);
        if (this.fileData[file]) {
            var logDataLength = this.fileData[file].gitLog.currentLogData.length;
            lblGitLog.setAttribute("caption", fileName);
            lblGitRevisions.setAttribute("caption", "Revision " +
                 this.fileData[file].gitLog.lastSliderValue + "/" + logDataLength);
            sliderGitLog.setAttribute("max", logDataLength);
            sliderGitLog.setAttribute("markers", "false");
            sliderGitLog.setAttribute("markers", "true");
            sliderGitLog.enable();
            sliderGitLog.setValue(this.fileData[file].gitLog.lastSliderValue);
            this.formulateGitLogOut(this.fileData[file].gitLog.lastSliderValue);
            if (this.fileData[file].gitLog.lastLoadedLogHash !== "") {
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

    formulateGitLogOut: function(index) {
        var gitLogOut = "";
        var file = this.getFilePath();
        if (!this.fileData[file])
            return;

        if (!this.fileData[file].gitLog.currentLogData[index]) {
            gitLogOut = '<div style="color: #333"><strong>* Current</strong><br /><br /><em>Any uncommitted changes</em></div>';
        }
        else {
            var logData = this.fileData[file].gitLog.currentLogData[index];
            var tDate = new Date(parseInt(logData.author.timestamp, 10) * 1000);
            gitLogOut = '<div style="color: #333"><span class="header">Commit</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            logData.commit + //.substr(0, 10)
                            '<br /><span class="header">Tree</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            logData.tree + //.substr(0, 10)
                            '<br /><span class="header">Parent</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            logData.parent + //.substr(0, 10)
                            '<br /><span class="header">Author</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            logData.author.fullName + ' ' +
                            logData.author.email.replace("<", "&lt;").replace(">", "&gt;") +
                            '<br /><span class="header">Time</span><br />&nbsp;&nbsp;&nbsp;&nbsp;' +
                            tDate.toLocaleDateString().split(" ").slice(1).join(" ") +
                            " " + tDate.toLocaleTimeString() +
                            '<br /><br /><span class="header">Commit Summary</span><br /><br />' +
                            logData.message.join("<br />") +
                            '</div>';
        }

        txtGitLog.setValue(gitLogOut);
    },

    loadFileRevision : function() {
        var file = this.getFilePath();
        this.resetAceGutter();

        // If the slider value is out of the bounds of the current commit data, then we know
        // the user is loading the most recent (possibly uncommitted) revision of the file
        if (!this.fileData[file].gitLog.currentLogData[sliderGitLog.value]) {
            editors.currentEditor.ceEditor.getSession().setValue(
                this.fileData[file].gitLog.currentRevision
            );
            editors.currentEditor.ceEditor.$editor.setReadOnly(false);
        }
        // Otherwise the user is attempting to load one of the previously committed revisions
        else {
            // Save the latest version of the file
            //if (this.fileData[file].gitLog.lastLoadedGitLog == this.fileData[file].gitLog.currentLogData.length)
            if (this.fileData[file].gitLog.lastLoadedLogHash === "")
                this.fileData[file].gitLog.currentRevision = editors.currentEditor.ceEditor.getSession().getValue();

            this.gitShow(this.fileData[file].gitLog.currentLogData[sliderGitLog.value].commit);
        }

        //this.fileData[file].gitLog.lastLoadedGitLog = sliderGitLog.value;
        this.fileData[file].gitLog.lastLoadedLogHash = this.fileData[file].gitLog.currentLogData[sliderGitLog.value] ?
            this.fileData[file].gitLog.currentLogData[sliderGitLog.value].commit : "";
        btnViewRevision.disable();
        btnGitBlame.enable();
    },

    /**
     * @TODO REFACTOR
     */
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

        editors.currentEditor.ceEditor.$editor.renderer.$gutterLayer.setExtendedAnnotationText(textHash);
        editors.currentEditor.ceEditor.$editor.renderer.updateFull();
    },

    searchFilter : function(value) {
        if (!this.fileData[this.currentFile] || !this.fileData[this.currentFile].gitLog.currentLogData)
            return;

        if (value != this.fileData[this.currentFile].gitLog.lastFilterValue) {
            // Clear the search
            if (value.length === 0) {
                this.fileData[this.currentFile].gitLog.lastFilterValue = "";
                this.fileData[this.currentFile].gitLog.currentLogData = this.fileData[this.currentFile].gitLog.logData;
                this.setGitLogState(this.currentFile);
            }
            else if (value.length >= 3) {
                this.applyFilter(value);
                this.fileData[this.currentFile].gitLog.lastFilterValue = value;
            }
        }
    },
    
    applyFilter : function(filter) {
        var logs = this.fileData[this.currentFile].gitLog.logData;
        if (!logs)
            return;

        filter = filter.toLowerCase();

        this.fileData[this.currentFile].gitLog.currentLogData = [];
        for (var gi = 0; gi < logs.length; gi++) {
            if (logs[gi].commitLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs.logData[gi]);
                continue;
            }
            if (logs[gi].parentLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].treeLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].messageJoinedLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.emailLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.fullNameLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.emailLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.fullNameLower.indexOf(filter) >= 0) {
                this.fileData[this.currentFile].gitLog.currentLogData.push(logs[gi]);
                continue;
            }
        }

        this.setGitLogState(this.currentFile);
        this.gitLogSliderChange(this.fileData[this.currentFile].gitLog.currentLogData.length);
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