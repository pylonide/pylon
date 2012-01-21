/**
 * Version history browser extension for Cloud9 IDE
 * 
 * @author Matt Pardee
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var GitLogParser = require("ext/revisions/gitlogparser");
var markup = require("text!ext/revisions/revisions.xml");

module.exports = ext.register("ext/revisions/revisions", {
    name     : "Version History",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    command  : "gittools",
    gitLogs  : {},

    nodes : [],

    init : function(amlNode) {
        var _self = this;
        vbMain.parentNode.appendChild(new apf.vbox({
            anchors: "0 0 0 0",
            id: "vbVersions",
            "class": "vbZen",
            visible: false,
            childNodes : [
                new apf.hbox({
                    flex : "1",
                    childNodes : [
                        new apf.vbox({
                            flex : "1",
                            margin : "20 30 0 30",
                            childNodes : [
                                new apf.vbox({
                                    height : "104",
                                    //align : "center",
                                    id : "vbHistoricalHeader",
                                    childNodes : [
                                        new apf.hbox({
                                            childNodes : [
                                                /*new apf.button({
                                                    id : "versions_nav_back",
                                                    "class" : "versions_navigate nav_backward",
                                                    onclick : function() {
                                                        _self.loadPreviousRevision();
                                                    }
                                                }),*/
                                                new apf.text({
                                                    id : "versions_label",
                                                    "class" : "versions_label",
                                                    value : "",
                                                    flex : "1",
                                                    height : "50",
                                                    margin : "0 10 0 0"
                                                }),
                                                /*new apf.button({
                                                    id : "versions_nav_fwd",
                                                    "class" : "versions_navigate nav_forward",
                                                    onclick : function() {
                                                        _self.loadNextRevision();
                                                    }
                                                }),*/
                                                new apf.textbox({
                                                    width : "100",
                                                    height : "25",
                                                    skin : "searchbox_textbox",
                                                    "initial-message" : "Filter",
                                                    "class" : "versions_search",
                                                    margin: "0 30 0 0",
                                                    onkeyup : function() {
                                                        _self.applyFilter(this.getValue());
                                                    },
                                                    onfocus : function() {
                                                        apf.tween.single(this.$ext, {
                                                            type: "width",
                                                            from: 100,
                                                            to  : 140,
                                                            anim : apf.tween.EASEOUT,
                                                            steps : 20
                                                        });
                                                    },
                                                    onblur : function() {
                                                        apf.tween.single(this.$ext, {
                                                            type: "width",
                                                            from: 140,
                                                            to  : 100,
                                                            anim : apf.tween.EASEOUT,
                                                            steps : 20
                                                        });
                                                    }
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*new apf.vbox({
                                    align : "center",
                                    childNodes : [
                                        new apf.bar({
                                            width : "75%",
                                            height : "6",
                                            "class" : "historical_pages"
                                        }),
                                        new apf.bar({
                                            width : "85%",
                                            height : "8",
                                            "class" : "historical_pages"
                                        }),
                                        new apf.bar({
                                            width : "95%",
                                            height : "10",
                                            "class" : "historical_pages"
                                        })
                                    ]
                                }),*/
                                new apf.vbox({
                                    id : "historicalVersionHolder",
                                    flex : "1"
                                })
                            ]
                        }),
                        new apf.vbox({
                            flex : "1",
                            margin : "20 30 0 30",
                            childNodes : [
                                new apf.vbox({
                                    height : "104", // 80 + 24 (24 == height of right-side zoom effect)
                                    childNodes : [
                                        new apf.hbox({
                                            childNodes : [
                                                new apf.text({
                                                    "class" : "versions_label",
                                                    id : "current_versions_label",
                                                    value : "",
                                                    flex : "1",
                                                    margin : "0 10 0 0",
                                                    height : "80"
                                                }),
                                                new apf.text({
                                                    "class" : "current_label rounded",
                                                    value : "Current Document",
                                                    height : "30"
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new apf.vbox({
                                    id : "currentVersionHolder",
                                    flex : "1"
                                })
                            ]
                        })
                    ]
                }),
                new apf.hbox({
                    height : "75",
                    align : "center",
                    pack : "center",
                    childNodes : [
                        new apf.hbox({
                            //width : "225",
                            height : "45",
                            padding : "4",
                            align : "center",
                            pack : "center",
                            "class" : "current_label black",
                            childNodes : [
                                new apf.button({
                                    caption : "Restore",
                                    "class" : "ui-btn-red",
                                    margin : "0 10 0 10",
                                    width : "125",
                                    onclick : function() {
                                        
                                    }
                                }),
                                new apf.button({
                                    caption : "Done",
                                    "class" : "",
                                    margin : "0 10 0 10",
                                    width : "125",
                                    onclick : function() {
                                        _self.escapeVersionMode();
                                    }
                                })
                            ]
                        })
                    ]
                })
            ]
        }));
        
        this.historicalVersionEditor = new apf.codeeditor({
            id                : "historicalVersionEditor",
            visible           : "true",
            syntax            : "{require('ext/code/code').getSyntax(%[.])}",
            theme             : "ace/theme/textmate",
            folding           : "false",
            overwrite         : "[{require('ext/settings/settings').model}::editors/code/@overwrite]",
            behaviors         : "[{require('ext/settings/settings').model}::editors/code/@behaviors]",
            selectstyle       : "[{require('ext/settings/settings').model}::editors/code/@selectstyle]",
            activeline        : "false",
            showinvisibles    : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]",
            showprintmargin   : "false",
            printmargincolumn : "[{require('ext/settings/settings').model}::editors/code/@printmargincolumn]",
            softtabs          : "[{require('ext/settings/settings').model}::editors/code/@softtabs]",
            tabsize           : "[{require('ext/settings/settings').model}::editors/code/@tabsize]",
            scrollspeed       : "[{require('ext/settings/settings').model}::editors/code/@scrollspeed]",

            fontsize          : "[{require('ext/settings/settings').model}::editors/code/@fontsize]",
            wrapmode          : "false",
            wraplimitmin      : "80",
            wraplimitmax      : "80",
            gutter            : "[{require('ext/settings/settings').model}::editors/code/@gutter]",
            highlightselectedword : "false",
            autohidehorscrollbar  : "[{require('ext/settings/settings').model}::editors/code/@autohidehorscrollbar]",

            "debugger"        : "null",
            readonly          : "true",
            style : "z-index : 99999; position: absolute"
            //style : "-webkit-box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.75); -moz-box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.75)"
        });

        this.currentVersionEditor = new apf.codeeditor({
            id                : "currentVersionEditor",
            visible           : "true",
            syntax            : "{require('ext/code/code').getSyntax(%[.])}",
            theme             : "ace/theme/textmate",
            folding           : "false",
            overwrite         : "[{require('ext/settings/settings').model}::editors/code/@overwrite]",
            behaviors         : "[{require('ext/settings/settings').model}::editors/code/@behaviors]",
            selectstyle       : "[{require('ext/settings/settings').model}::editors/code/@selectstyle]",
            activeline        : "false",
            showinvisibles    : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]",
            showprintmargin   : "false",
            printmargincolumn : "[{require('ext/settings/settings').model}::editors/code/@printmargincolumn]",
            softtabs          : "[{require('ext/settings/settings').model}::editors/code/@softtabs]",
            tabsize           : "[{require('ext/settings/settings').model}::editors/code/@tabsize]",
            scrollspeed       : "[{require('ext/settings/settings').model}::editors/code/@scrollspeed]",

            fontsize          : "[{require('ext/settings/settings').model}::editors/code/@fontsize]",
            wrapmode          : "false",
            wraplimitmin      : "80",
            wraplimitmax      : "80",
            gutter            : "[{require('ext/settings/settings').model}::editors/code/@gutter]",
            highlightselectedword : "false",
            autohidehorscrollbar  : "[{require('ext/settings/settings').model}::editors/code/@autohidehorscrollbar]",

            "debugger"        : "null",
            readonly          : "true",
            style : "z-index : 99999; position: absolute"
            //style : "-webkit-box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.75); -moz-box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.75)"
        })

        setTimeout(function() {
            vbMain.parentNode.appendChild(_self.historicalVersionEditor);
            vbMain.parentNode.appendChild(_self.currentVersionEditor);

            var sliderBg = document.createElement("div");
            sliderBg.setAttribute("id", "versionsSliderBg");
            vbHistoricalHeader.$ext.appendChild(sliderBg);
            
            _self.sliderEl = document.createElement("div");
            _self.sliderEl.setAttribute("id", "versionsHistoricalSlider");
            vbHistoricalHeader.$ext.appendChild(_self.sliderEl);

            currentVersionEditor.$editor.getSession().setUseWrapMode(false);
            _self.currentScrollbar = currentVersionEditor.$editor.renderer.scrollBar;
            _self.currentScrollbar.addEventListener("scroll", function(e) {
                historicalVersionEditor.$editor.renderer.scrollBar.setScrollTop(e.data);
                //_self.setRaphaelScroll(e.data);
            });

            historicalVersionEditor.$editor.getSession().setUseWrapMode(false);
            _self.historicalScrollbar = historicalVersionEditor.$editor.renderer.scrollBar;
            _self.historicalScrollbar.addEventListener("scroll", function(e) {
                currentVersionEditor.$editor.renderer.scrollBar.setScrollTop(e.data);
            });
        }, 100);
    },

    loadScript : function(src) {
        var dmp = document.createElement("script");
        dmp.setAttribute("type", "text/javascript");
        dmp.setAttribute("src", src);
        document.body.appendChild(dmp);
    },

    hook : function(){
        var _self = this;
        this.loadScript("/static/ext/revisions/diff_match_patch.js");

        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "View File History",
                onclick : function(){
                    _self.enterVersionMode();
                }
            }))
        );

        this.gitLogParser = new GitLogParser();

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        
        window.addEventListener("resize", function() {
            if (_self.isFocused)
                _self.resizeElements();
        });

        ext.initExtension(this);
    },
    
    resizeElements : function() {
        var height = (window.innerHeight - 195) + "px";
        var width = (window.innerWidth - 60) + "px";

        var ph;
        var cPos = apf.getAbsolutePosition(ph = currentVersionHolder.$ext);
        currentVersionEditor.$ext.style.left = cPos[0] + "px";
        currentVersionEditor.$ext.style.top = cPos[1] + "px";
        var d = apf.getDiff(ext);
        currentVersionEditor.$ext.style.width = (ph.offsetWidth + 2 - d[0]) + "px";
        currentVersionEditor.$ext.style.height = (ph.offsetHeight - d[1]) + "px";

        var pos = apf.getAbsolutePosition(ph = historicalVersionHolder.$ext);
        historicalVersionEditor.$ext.style.left = pos[0] + "px";
        historicalVersionEditor.$ext.style.top = pos[1] + "px";
        var d = apf.getDiff(ext);
        var hLeftWidth = ph.offsetWidth + 2 - d[0];
        historicalVersionEditor.$ext.style.width = hLeftWidth + "px";
        historicalVersionEditor.$ext.style.height = (ph.offsetHeight - d[1]) + "px";
    },

    loadPreviousRevision : function() {
        var fileData = this.gitLogs[this.getFilePath()];
        var lastLog = fileData.lastLoadedGitLog;
        this.loadRevision(lastLog-1);
    },

    loadNextRevision : function() {
        var fileData = this.gitLogs[this.getFilePath()];
        var lastLog = fileData.lastLoadedGitLog;
        this.loadRevision(lastLog+1);
    },
    
    formulateRevisionMetaData : function(data) {
        var timestamp = this.formulateVersionsLabelDate(data.author.timestamp);
        var output = '<table cellspacing="0" cellpadding="0" border="0"><tr>';
        output += '<tr><td class="rev_header">Author:</td><td>' + data.author.fullName
            + " " + apf.htmlentities(data.author.email) + '</td></tr>'
            + '<tr><td class="rev_header">Date:</td><td>' + timestamp + '</td></tr>'
            + '<tr><td class="rev_header">Commit:</td><td>' + data.commit.substr(0, 10) + '</td></tr>'
            + '<tr><td class="rev_header">Message:</td><td>' + data.message.join("<br />") + '</td></tr>';
        output += '</table>';
        return output;
    },

    loadRevision : function(num) {
        var fileData = this.gitLogs[this.getFilePath()];
        var hash = fileData.logData[num].commit;

        if (fileData.logData[fileData.lastLoadedGitLog])
            fileData.logData[fileData.lastLoadedGitLog].dotEl.setAttribute("class", "");
        fileData.logData[num].dotEl.setAttribute("class", "current");
        fileData.lastLoadedGitLog = num;
        //fileData.lastTimeString = this.formulateVersionsLabelDate(fileData.logData[num].author.timestamp);

        var output = this.formulateRevisionMetaData(fileData.logData[num]);
        versions_label.setValue(output);

        /*if (num == 0) {
            versions_nav_back.disable();
            versions_nav_fwd.enable();
        } else if (num == (fileData.logData.length-1)) {
            versions_nav_fwd.disable();
            versions_nav_back.enable();
        } else {
            versions_nav_back.enable();
            versions_nav_fwd.enable();
        }*/

        this.requestGitShow(hash);
    },
    
    animatePage : function() {
        
    },

    /**
     * Transforms the interface into a side-by-side comparison
     * of the current document and its historical revisions
     */
    enterVersionMode : function() {
        var _self = this;
        this.requestGitLog();

        var currentSession = ceEditor.$editor.getSession();
        var cveSession = currentVersionEditor.$editor.getSession();
        var hveSession = historicalVersionEditor.$editor.getSession();

        // Copy the current document to the new ones
        var currentDocText = currentSession.getValue();
        hveSession.setValue(currentDocText);
        cveSession.setValue(currentDocText);

        // Set the document mode for syntax highlighting
        cveSession.setMode(currentSession.getMode());
        hveSession.setMode(currentSession.getMode());

        vbVersions.show();
        Firmin.animate(vbVersions.$ext, {
            opacity: "1"
        }, 0.5, function() {
            _self.resizeElements();
            apf.layout.forceResize(document.body);
        });

        this.isFocused = true;
    },
    
    escapeVersionMode : function() {
        vbVersions.hide();
        this.isFocused = false;
        Firmin.animate(vbVersions.$ext, {
            opacity: "0"
        }, 0.5, function() {
            historicalVersionEditor.hide();
            currentVersionEditor.hide();
            apf.layout.forceResize(document.body);
        });
    },

    /**
     * Requests git show data from the server, based on the current file + hash
     * 
     * @param {string} hash The commit hash
     */
    requestGitShow : function(hash) {
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

    /**
     * Requests git log data from the server, about the current file
     */
    requestGitLog : function() {
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

    /**
     * Catches incoming messages from the server
     * 
     * @param {JSON} e Incoming data
     */
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

    /**
     * The server has sent back the results of a "git log" request
     * 
     * @param {JSON} message Details about the message & output from git log
     */
    onGitLogMessage: function(message) {
        this.gitLogParser.parseLog(message.body.out);

        var logData = this.gitLogParser.getLogData();

        var logDataLength = logData.length;
        for (var gi = 0; gi < logDataLength; gi++) {
            logData[gi].commitLower = logData[gi].commit.toLowerCase();
            logData[gi].parentLower = logData[gi].parent.toLowerCase();
            logData[gi].treeLower = logData[gi].tree.toLowerCase();
            logData[gi].messageJoinedLower = logData[gi].message.join("\n").toLowerCase();
            logData[gi].author.emailLower = logData[gi].author.email.toLowerCase();
            logData[gi].author.fullNameLower = logData[gi].author.fullName.toLowerCase();
            logData[gi].committer.emailLower = logData[gi].committer.email.toLowerCase();
            logData[gi].committer.fullNameLower = logData[gi].committer.fullName.toLowerCase();
        }

        this.gitLogs[message.body.file].logData = logData;

        this.gitLogs[message.body.file].lastLoadedGitLog = logDataLength -1;
            //this.gitLogs[message.body.file].lastSliderValue = logDataLength;

        /*this.gitLogs[message.body.file].lastTimeString =
            this.formulateVersionsLabelDate(logData[logDataLength-1].author.timestamp);
        versions_label.setValue(this.gitLogs[message.body.file].lastTimeString);*/
        
        var output = this.formulateRevisionMetaData(logData[logDataLength-1]);
        versions_label.setValue(output);
        current_versions_label.setValue(output);

        this.setupSliderEl(this.gitLogs[message.body.file].logData);

        this.gitLogs[message.body.file].logData[logDataLength-1].dotEl.setAttribute("class", "current");
    },

    /**
     * The server has sent back the results of a "git show" request
     * 
     * @param {JSON} message Details about the message & output from git show
     */
    onGitShowMessage : function(message) {
        this.gitLogs[message.body.file].revisions[message.body.hash] =
            message.body.out;

        var hveSession = historicalVersionEditor.$editor.getSession();
        hveSession.setValue(message.body.out);

        if (!this.dmp)
            this.dmp = new diff_match_patch();

        // set the raphael svg container to the height of the tallest doc
        var lines = this.getTallestDocumentLines();
        var lineHeight = currentVersionEditor.$editor.renderer.lineHeight;
        var height = lines * lineHeight;

        this.resizeElements();

        // diff_match_patch
        var diff = this.dmp.diff_main(message.body.out, currentVersionEditor.$editor.getSession().getValue());
        // @TODO remove this and only use regular diff
        this.dmp.diff_cleanupSemantic(diff);
        console.log(this.dmp.diff_prettyHtml(diff));
        //console.log(diff);

        var numLeftLines = 0, numRightLines = 0;
        var leftLinesAdded = 0;
        var d, tLines;
        /*for (var i = 0; i < diff.length; i++) {
            d = diff[i];
            tLines = d[1].split("\n").length;
            if (d[0] != 1) {
                if (d[0] == -1) {
                    //console.log(numLeftLines, numRightLines);
                    console.log("this was REMOVED: ", d[1]);
                    //var removedLines = this.raphaelPaper.rect(50, (numLeftLines*lineHeight)+2, 450, (tLines*lineHeight)+1);
                    //removedLines.attr("fill", "rgba(255, 77, 64, 0.5)");
                    //removedLines.attr("stroke-width", "0");
                }
                else {
                    console.log("this stayed the SAME: ", d[1]);
                    numRightLines += (tLines-1);
                }
                numLeftLines += (tLines-1);
            }

            else {
                console.log("this was ADDED: ", d[1]);
                //var addedLines = this.raphaelPaper.rect(611, (numRightLines*lineHeight)+2, 450, (tLines*lineHeight)+1);
                //addedLines.attr("fill", "rgba(80, 140, 60, 0.5)");
                //addedLines.attr("stroke-width", "0");
                numRightLines += (tLines-1);
            }
            if ((numLeftLines + leftLinesAdded) < numRightLines) {
                var numAddLines = numRightLines - (numLeftLines+leftLinesAdded);
                historicalVersionEditor.$editor.moveCursorTo((numLeftLines+leftLinesAdded), 0);
                historicalVersionEditor.$editor.insert("\r\n\r\n");
                leftLinesAdded += numAddLines;
            }
            //console.log(diff[i][1]);
            console.log(numLeftLines, numRightLines);
            //console.log(diff[i][1].split("\n"));
        }*/
        //console.log(diff);
    },

    getTallestDocumentLines : function() {
        var hLength = historicalVersionEditor.$editor.getSession().getLength();
        var cLength = currentVersionEditor.$editor.getSession().getLength();
        return hLength > cLength ? hLength : cLength;
    },
    
    formulateVersionsLabelDate : function(ts) {
        var date = new Date(ts*1000);
        var ds = date.toString().split(" ");
        return ds[1] + " " + ds[2] + " " + ds[3] + " " + ds[4];
    },

    setupSliderEl : function(logData) {
        if (!logData.length)
            return;

        var _self = this;

        var len = logData.length;
        var tsBegin = logData[0].author.timestamp;
        var timeSpan = logData[len-1].author.timestamp - tsBegin;

        // Create all the child elements along the timeline
        for (var i = 0; i < len; i++) {
            var ts = logData[i].author.timestamp;
            var tsDiff = ts - tsBegin;
            var percentage = (tsDiff / timeSpan) * 100;
            var dotEl = document.createElement("u");
            dotEl.setAttribute("style", "left: " + percentage + "%");
            dotEl.setAttribute("rel", i);
            dotEl.setAttribute("hash", logData[i].commit);
            dotEl.addEventListener("mouseover", function() {
                var it = this.getAttribute("rel");
                var ts = logData[it].author.timestamp;
                //var dateStr = _self.formulateVersionsLabelDate(ts);
                var output = _self.formulateRevisionMetaData(logData[it]);
                versions_label.setValue(output);
                //versions_label.setValue(dateStr);
            });
            dotEl.addEventListener("mouseout", function() {
                //versions_label.setValue(_self.gitLogs[_self.getFilePath()].lastTimeString);
            });
            dotEl.addEventListener("click", function() {
                _self.loadRevision(this.getAttribute("rel"));
            });
            this.sliderEl.appendChild(dotEl);
            logData[i].dotEl = dotEl;
        }
    },

    /**
     * Retrieves the file path for the currently selected file tab
     * 
     * @param {string} filePath If we already have it and want to normalize it
     */
    getFilePath : function(filePath) {
        if (typeof filePath === "undefined")
            filePath = tabEditors.getPage().$model.data.getAttribute("path");
        if (filePath.indexOf("/workspace/") === 0)
            filePath = filePath.substr(11);

        return filePath;
    },

    applyFilter : function(filter) {
        var currentFile = this.getFilePath();

        var logs = this.gitLogs[currentFile].logData;
        if (!logs)
            return;

        filter = filter.toLowerCase();

        this.gitLogs[currentFile].currentLogData = [];
        this.gitLogs[currentFile].explodedPoints = {};
        for (var gi = 0; gi < logs.length; gi++) {
            if (logs[gi].commitLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].parentLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].treeLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].messageJoinedLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.emailLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.fullNameLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.emailLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.fullNameLower.indexOf(filter) >= 0) {
                this.gitLogs[currentFile].currentLogData.push(logs[gi]);
                continue;
            }

            this.gitLogs[currentFile].explodedPoints[gi] = true;
        }

        var isCurrent = false;
        for(var i = 0; i < logs.length; i++) {
            var currClass = logs[i].dotEl.getAttribute("class");
            if (currClass && currClass.length && currClass.indexOf("current") != -1)
                isCurrent = true;
            else
                isCurrent = false;

            if (this.gitLogs[currentFile].explodedPoints[i]) {
                if (isCurrent)
                    logs[i].dotEl.setAttribute("class", "current pop");
                else
                    logs[i].dotEl.setAttribute("class", "pop");
            } else {
                if (isCurrent)
                    logs[i].dotEl.setAttribute("class", "current");
                else
                    logs[i].dotEl.setAttribute("class", "");
            }
        }

        //console.log(this.gitLogs[currentFile].currentLogData);

        //this.setGitLogState(currentFile);
        //this.gitLogSliderChange(this.gitLogs[currentFile].currentLogData.length);
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

});