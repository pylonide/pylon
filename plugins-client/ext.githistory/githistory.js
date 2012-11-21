/**
 * File history browser & comparison tool for Cloud9 IDE
 * 
 * TODO:
 *
 * Remove ceEditor (see http://100procentjan.nl/c9/3rlzgl.jpeg)
 *
 * Implement "Restore" functionality
 *  - Popup about what just happened ("Changes have not been committed")
 *  - Set ceEditor's content
 *  - Animate history page to current page
 *  - Clear markers
 *  - Undo
 * Refresh (button next to dropdown button?)
 * Store and Re-set the state of each file upon entry
 * Skip line numbers in gutter where gray areas exist
 * Clean up the elements fading in & out upon entry and exit
 *  - If history pages stay on left, have them shift out one by one
 * Beginning and end date below the timeline
 * Page turning on history
 * 
 * Bugs:
 * 
 * clicking around clears the syntax highlighting (wtf?)
 *  - This happen only the first time for each file, subsequent
 *    re-entries and clicking around keeps the highlighting
 * focus() on search after clear doesn't work. Fix APF
 *  - Or get rid of X
 * Hover on timeline dots don't register when focus is in search box
 * UI and animations are totally messed up in FF
 * Server is sending data back to all clients
 *  - (fixed in githubissues)
 * 
 * Ideal:
 * 
 * Highlight which attribute the filtering was successful against when the user
 *  either shows the dropdown or tooltip
 * In between the two editors, put a "minimap" of areas with diffs
 * Hover over history dots has OS X dock magnification effect
 * Searching "zooms" in on timeline so earliest and latest results
 *  show up on left and right side of timeline
 * 
 * @author Matt Pardee
 * 
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var rutil = require("ext/githistory/util");
var timeline = require("ext/githistory/timeline");
var Range = require("ace/range").Range;
var Anchor = require('ace/anchor').Anchor;
var GitLogParser = require("ext/githistory/gitlogparser");
var RState = require("ext/githistory/rstate");

var skin = require("text!ext/githistory/skin.xml");
var markup = require("text!ext/githistory/githistory.xml");

module.exports = ext.register("ext/githistory/githistory", {
    name     : "Version History",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "skin_revisions",
        data : skin
    },
    command  : "gittools",

    nodes : [],

    hook : function(){
        var _self = this;

        document.body.appendChild(
            rutil.createElement("script", {
                "type" : "text/javascript",
                "src" : ide.staticPrefix + "/ext/githistory/diff_match_patch.js"
            })
        );

        this.revisionState = new RState();
        this.gitLogParser = new GitLogParser();

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        window.addEventListener("resize", function() {
            if (_self.isFocused)
                _self.resizeElements();
        });

        ide.addEventListener("loadrevision", function(e) {
            _self.loadRevision(e.num);
        });

        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Compare File History",
                onclick : function(){
                    _self.enterRevisionMode();
                }
            }))
        );

        ext.initExtension(this);
    },

    init : function() {
        var _self = this;
        vbMain.parentNode.appendChild(new apf.vbox({
            anchors: "0 0 0 0",
            id: "vbVersions",
            "class": "vbZen vbVersions",
            visible: false,
            childNodes : [
                new apf.hbox({
                    flex : "1",
                    childNodes : [
                        new apf.vbox({
                            flex : "1",
                            margin : "20 20 0 30",
                            childNodes : [
                                new apf.vbox({
                                    height : "104",
                                    id : "vbHistoricalHeader",
                                    childNodes : [
                                        new apf.hbox({
                                            childNodes : [
                                                new apf.text({
                                                    id : "versionsLabel",
                                                    "class" : "versions_label",
                                                    value : "",
                                                    flex : "1",
                                                    height : "46",
                                                    margin : "0 10 0 0"
                                                }),
                                                new apf.textbox({
                                                    width : "100",
                                                    height : "25",
                                                    id : "tbRevisionsSearch",
                                                    disabled : true,
                                                    skin : "searchbox_textbox",
                                                    "initial-message" : "Filter",
                                                    "class" : "versions_search",
                                                    margin: "0 20 0 0",
                                                    onclear : function() {
                                                        timeline.filterTimeline(
                                                            "",
                                                            _self.revisionState
                                                        );
                                                    },
                                                    onkeyup : function() {
                                                        timeline.filterTimeline(
                                                            this.getValue(),
                                                            _self.revisionState
                                                        );
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
                                                }),
                                                new apf.button({
                                                    width : 17,
                                                    height : 17,
                                                    skin : "btn_icon_only",
                                                    submenu : "menuCommits",
                                                    "class" : "tabmenubtn",
                                                    background : "tabdropdown.png|horizontal|3|17",
                                                    style : "position:relative;top:66px;right:-3px;"
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new apf.vbox({
                                    id : "historicalVersionHolder",
                                    flex : "1"
                                })
                            ]
                        }),
                        new apf.vbox({
                            flex : "1",
                            margin : "20 20 0 30",
                            childNodes : [
                                new apf.vbox({
                                    height : "104",
                                    childNodes : [
                                        new apf.hbox({
                                            childNodes : [
                                                new apf.text({
                                                    "class" : "versions_label",
                                                    id : "currentVersionsLabel",
                                                    value : "",
                                                    flex : "1",
                                                    margin : "0 10 0 0",
                                                    height : "80"
                                                }),
                                                new apf.text({
                                                    id : "currentDocLabel",
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
                            height : "45",
                            padding : "4",
                            margin : "0 0 0 10",
                            align : "center",
                            pack : "center",
                            "class" : "current_label black",
                            childNodes : [
                                new apf.button({
                                    id : "btnRestore",
                                    caption : "Restore",
                                    skinset : "skin_revisions",
                                    skin : "revisionsbutton",
                                    "class" : "ui-btn-red",
                                    disabled : true,
                                    margin : "0 10 0 10",
                                    width : "125",
                                    onclick : function() {
                                        _self.restoreRevision();
                                    }
                                }),
                                new apf.button({
                                    caption : "Done",
                                    skinset : "skin_revisions",
                                    skin : "revisionsbutton",
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

        var animateEditorClone = new apf.vbox({
            id : "animateEditorClone",
            "class" : "animate_editor_clone",
            style : "z-index : 99999; position: absolute; background: #fff; overflow: hidden",
            childNodes: [
                new apf.codeeditor({
                    flex : "1",
                    id                : "currentEditorClone",
                    visible           : "true",
                    syntax            : "{require('ext/code/code').getSyntax(%[.])}",
                    theme             : "[{require('ext/settings/settings').model}::editors/code/@theme]",
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
                    autohidehorscrollbar  : "true",
                    "debugger"        : "null",
                    readonly          : "true"
                })
            ]
        });

        // Wait for the elements to get loaded in...
        setTimeout(function() {
            vbMain.appendChild(animateEditorClone);

            _self.historyGraphics = rutil.createElement("div", {
                "id" : "history_graphics"
            });
            var smallGHistory = rutil.createElement("div",  {
                "id" : "small_ghistory", 
                "class" : "history_graphic"
            });
            var mediumGHistory = rutil.createElement("div", {
                "id" : "medium_ghistory",
                "class" : "history_graphic"
            });
            var largeGHistory = rutil.createElement("div", {
                "id" : "large_ghistory",
                "class" : "history_graphic"
            });

            _self.historyGraphics.appendChild(smallGHistory);
            _self.historyGraphics.appendChild(mediumGHistory);
            _self.historyGraphics.appendChild(largeGHistory);
            vbVersions.$ext.appendChild(_self.historyGraphics);

            _self.loading_div = rutil.createElement("div", {
                "id" : "revisions_loading"
            });
            vbVersions.$ext.appendChild(_self.loading_div);
            
            var pgTurner = rutil.createElement("div", { "id" : "page_turner" });
            hveContainer.$ext.appendChild(pgTurner);
        }, 100);

        currentVersionEditor.$editor.getSession().setUseWrapMode(false);
        historicalVersionEditor.$editor.getSession().setUseWrapMode(false);

        var cveRenderer = currentVersionEditor.$editor.renderer;
        var hveRenderer = historicalVersionEditor.$editor.renderer;

        cveRenderer.scrollBar.element.addEventListener("scroll", function(e) {
            if (!_self.loadingRevision)
                hveRenderer.scrollBar.element.scrollTop = e.srcElement.scrollTop;
        });
        cveRenderer.scroller.addEventListener("scroll", function(e) {
            if (!_self.loadingRevision)
                hveRenderer.scroller.scrollLeft = e.srcElement.scrollLeft;
        });

        hveRenderer.scrollBar.element.addEventListener("scroll", function(e) {
            if (!_self.loadingRevision)
                cveRenderer.scrollBar.element.scrollTop = e.srcElement.scrollTop;
        });
        hveRenderer.scroller.addEventListener("scroll", function(e) {
            if (!_self.loadingRevision)
                cveRenderer.scroller.scrollLeft = e.srcElement.scrollLeft;
        });

        lstCommits.addEventListener("click", function() {
            _self.loadRevisionFromList();
            menuCommits.hide();
        });
    },

    /**
     * Transforms the interface into a side-by-side comparison
     * of the historical revisions and the current document
     */
    enterRevisionMode : function() {
        var _self = this;

        var file = rutil.getFilePath();
        this.revisionState.setCurrentFile(file);

        var filename = file.split("/").pop();
        currentDocLabel.setValue(filename);

        this.requestGitLog();

        var currentSession = ceEditor.$editor.getSession();
        var currentDocText = currentSession.getValue();
        var cveSession = currentVersionEditor.$editor.getSession();
        var hveSession = historicalVersionEditor.$editor.getSession();

        var cecSession = currentEditorClone.$editor.getSession();
        cecSession.setValue(currentDocText);

        var st = currentSession.getScrollTop();
        var sl = currentSession.getScrollLeft();
        hveSession.setScrollLeft(sl);
        hveSession.setScrollTop(st);
        cveSession.setScrollLeft(sl);
        cveSession.setScrollTop(st);
        cecSession.setScrollLeft(sl);
        cecSession.setScrollTop(st);

        var cePos = apf.getAbsolutePosition(ceEditor.$ext);
        animateEditorClone.$ext.style.left = cePos[0] + "px";
        animateEditorClone.$ext.style.top = "124px";//cePos[1] + "px";
        animateEditorClone.$ext.style.width = ceEditor.getWidth() + "px";
        animateEditorClone.$ext.style.height = ceEditor.getHeight() + "px";
        animateEditorClone.$ext.style.opacity = "1";
        animateEditorClone.show();

        ceEditor.hide();

        var moveToLeft = (window.innerWidth/2 + 30);
        var moveToWidth = ((window.innerWidth - moveToLeft) - 18);
        var moveToHeight = (window.innerHeight - 199);

        animateEditorClone.$ext.setAttribute("class", "animate_editor_clone bounce_into_current");

        Firmin.animate(animateEditorClone.$ext, {
            left : moveToLeft + "px",
            width : moveToWidth + "px",
            height : moveToHeight + "px",
            scale : 1.05
        }, 1.3, function() {
            Firmin.animate(animateEditorClone.$ext, {
                scale : 1
            }, 0.7, function() {
                Firmin.animate(animateEditorClone.$ext, {
                    opacity: 0
                }, 0.3, function() {
                    animateEditorClone.hide();
                });
            });
        });

        // Set the document mode for syntax highlighting
        cveSession.setMode(currentSession.getMode());
        hveSession.setMode(currentSession.getMode());

        vbVersions.show();
        Firmin.animate(vbVersions.$ext, {
            opacity: "1"
        }, 2.0, function() {
            historicalVersionEditor.show();
            currentVersionEditor.show();
            _self.resizeElements();
        });

        this.isFocused = true;
    },

    /**
     * Returns the IDE back to the default state
     * Puts the "drop-in" animation in motion
     */
    escapeVersionMode : function() {
        ceEditor.show();

        var currentSession = ceEditor.$editor.getSession();
        var currentDocText = currentSession.getValue();
        var cecSession = currentEditorClone.$editor.getSession();
        var cveSession = currentVersionEditor.$editor.getSession();
        cecSession.setValue(currentDocText);

        var st = cveSession.getScrollTop();
        var sl = cveSession.getScrollLeft();
        cecSession.setScrollLeft(sl);
        cecSession.setScrollTop(st);
        currentSession.setScrollLeft(sl);
        currentSession.setScrollTop(st);

        var cePos = apf.getAbsolutePosition(ceEditor.$ext);
        var cvePos = apf.getAbsolutePosition(currentVersionEditor.$ext);
        animateEditorClone.$ext.style.left = cvePos[0] + "px";
        animateEditorClone.$ext.style.top = cePos[1] + "px";
        animateEditorClone.$ext.style.width = currentVersionEditor.getWidth() + "px";
        animateEditorClone.$ext.style.height = currentVersionEditor.getHeight() + "px";
        animateEditorClone.$ext.style.opacity = "1";
        animateEditorClone.show();

        var moveToLeft = cePos[0];
        var moveToWidth = ceEditor.getWidth();
        var moveToHeight = ceEditor.getHeight();

        animateEditorClone.$ext.setAttribute("class", "animate_editor_clone bounce_outta_current");

        ceEditor.hide();
        Firmin.animate(animateEditorClone.$ext, {
            left : moveToLeft + "px",
            width : moveToWidth + "px",
            height : moveToHeight + "px",
            scale : 1.05
        }, 1.3, function() {
            Firmin.animate(animateEditorClone.$ext, {
                scale : 1
            }, 0.7, function() {
                ceEditor.show();
                Firmin.animate(animateEditorClone.$ext, {
                    opacity: 0
                }, 0.3, function() {
                    animateEditorClone.hide();
                });
            });
        });

        historicalVersionEditor.hide();
        historicalPlaceholder.hide();
        currentVersionEditor.hide();

        Firmin.animate(vbVersions.$ext, {
            opacity: "0"
        }, 1.3, function() {
            vbVersions.hide();
        });
        
        this.isFocused = false;
    },

    /**
     * Resizes the absolutely-positioned code editors
     */
    resizeElements : function() {
        var ph = currentVersionHolder.$ext;
        var pos = apf.getAbsolutePosition(ph);
        currentVersionEditor.$ext.style.left = pos[0] + "px";
        currentVersionEditor.$ext.style.top  = pos[1] + "px";

        currentVersionEditor.$ext.style.width  = (ph.offsetWidth + 2) + "px";
        currentVersionEditor.$ext.style.height = ph.offsetHeight + "px";

        ph = historicalVersionHolder.$ext;
        pos = apf.getAbsolutePosition(ph);
        /*historicalVersionEditor.$ext.style.left = pos[0] + "px";
        historicalVersionEditor.$ext.style.top  = pos[1] + "px";

        historicalVersionEditor.$ext.style.width  = (ph.offsetWidth + 2) + "px";
        historicalVersionEditor.$ext.style.height = ph.offsetHeight + "px";*/

        hveContainer.$ext.style.left = pos[0] + "px";
        hveContainer.$ext.style.top  = pos[1] + "px";

        hveContainer.$ext.style.width  = (ph.offsetWidth + 2) + "px";
        hveContainer.$ext.style.height = ph.offsetHeight + "px";

        this.historyGraphics.style.height = historicalVersionHolder.getHeight() + "px";
    },

    /**
     * Loads the revision from the currently selected item in the dropdown
     */
    loadRevisionFromList : function() {
        this.loadRevision(lstCommits.selected.getAttribute("internal_counter"));
    },

    /**
     * Loads a revision of the file
     * 
     * @param {number} num 0-based index of the revision requested
     */
    loadRevision : function(num) {
        this.loadingRevision = true;

        var session = this.revisionState.getSession();
        var logData = session.getGitLog();
        var hash = logData[num].commit;

        // Select the corresponding item in the dropdown list
        var node = lstCommits.queryNode("commit[@internal_counter='" + num + "']");
        if (node && !lstCommits.isSelected(node))
            lstCommits.select(node);

        var lastLog = session.getLastLoadedGitLog();
        if (logData[lastLog])
            logData[lastLog].dotEl.setAttribute("class", "");

        logData[num].dotEl.setAttribute("class", "current");
        session.setLastLoadedGitLog(num);

        var output = rutil.formulateRevisionMetaData(logData[num], true);
        versionsLabel.setValue(output);
        apf.tween.single(versionsLabel.$ext, {
            type : "scrollTop",
            from : 0,
            to   : 16,
            anim : apf.tween.EASEIN,
            steps : 50,
            onfinish : function() {
                setTimeout(function() {
                    apf.tween.single(versionsLabel.$ext, {
                        type : "scrollTop",
                        from : 16,
                        to   : 0,
                        anim : apf.tween.EASEOUT,
                        steps : 50
                    });
                }, 1000);
            }
        });

        var cveSession = currentVersionEditor.$editor.getSession();
        cveSession.setValue(ceEditor.$editor.getSession().getValue());
        this.removeMarkers(cveSession);

        this.requestGitShow(hash);
        /*var hvePos = apf.getAbsolutePosition(historicalVersionEditor.$ext);
        Firmin.animate(historicalPlaceholder.$ext, {
            opacity : 0,
            zIndex  : 99999,
            left    : hvePos[0] + "px",
            top     : (hvePos[1]-40) + "px",
            width   : historicalVersionEditor.getWidth() + "px",
            height  : historicalVersionEditor.getHeight() + "px"
        }, 0, function() {
            Firmin.animate(historicalPlaceholder.$ext, {
                top: hvePos[1] + "px",
                opacity: 1
            }, 0.3, function() {
                
            });
        });*/
    },

    restoreRevision : function() {
        btnRestore.disable();
        this.animateRevisionToCurrent();
    },

    animateRevisionToCurrent : function() {
        var hvePos = rutil.getAbsolutePositionDimension(historicalVersionEditor.$ext);
        var cvePos = rutil.getAbsolutePositionDimension(currentVersionEditor.$ext);

        historicalPlaceholder.show();

        Firmin.animate(historicalPlaceholder.$ext, {
            zIndex  : 99999,
            left    : hvePos.x + "px",
            top     : hvePos.y + "px",
            width   : hvePos.width + "px",
            height  : hvePos.height + "px"
        }, 0, function() {
            historicalPlaceholder.$ext.setAttribute("class", "restore_revision");
            Firmin.animate(historicalPlaceholder.$ext, {
                left: cvePos.x + "px"
            }, 1.5, function() {
                historicalPlaceholder.$ext.setAttribute("class", "");
                Firmin.animate(historicalPlaceholder.$ext, {
                    opacity : 0
                }, 0.7, function() {
                    historicalPlaceholder.hide();
                });
            });
        });
    },

    setLoadingHtml : function(html, initialShow) {
        this.loading_div.innerHTML = html;
        if (initialShow)
            this.loading_div.style.top = "-2000px";

        var iw = apf.getHtmlInnerWidth(this.loading_div);
        var ih = apf.getHtmlInnerHeight(this.loading_div);
        this.loading_div.style.left = (window.innerWidth/2 - iw/2) + "px";
        if (initialShow)
            this.loading_div.style.top = (window.innerHeight/2 - ih/2) + "px";
    },

    /**
     * Generic server request sender
     * 
     * @param {string} subcommand What git operation we want to do
     * @param {hash} extra Extra details to provide to the server-side ext
     * @return {boolean} true if request sent, false otherwise
     */
    sendServerRequest : function(subcommand, extra) {
        var data = {
            command : this.command,
            subcommand : subcommand,
            file : this.revisionState.getCurrentFile()
        };

        apf.extend(data, extra);

        ide.dispatchEvent("track_action", {
            type: "gittools",
            cmd: this.command,
            subcommand: data.subcommand
        });

        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, { data: data}) !== false) {
                ide.send(data);
            }
        }

        return false;
    },

    /**
     * Requests git show data from the server, based on the current file + hash
     * 
     * @param {string} hash The commit hash
     */
    requestGitShow : function(hash) {
        var sentSuccess = this.sendServerRequest("show", { hash : hash });
        if (sentSuccess)
            this.setLoadingHtml("<p>Loading...</p>", true);
    },

    /**
     * Requests git log data on the current file
     */
    requestGitLog : function() {
        var file = this.revisionState.getCurrentFile();
        var session = this.revisionState.getSession(file);

        var lastFile = this.revisionState.getLastFileLoaded();
        if (lastFile.length) {
            var lastSession = this.revisionState.getSession(lastFile);
            timeline.removeTimelinePoints(lastSession.getGitLog());
        }

        if (session) {
            this.revisionState.restoreState(session);
        } else {
            session = this.revisionState.addSession(file);

            var currentDocText = ceEditor.$editor.getSession().getValue();
            var cveSession = currentVersionEditor.$editor.getSession();
            cveSession.setValue(currentDocText);

            session.setCurrentText(currentDocText);

            // Disable search until git log loads
            tbRevisionsSearch.disable();
            this.sendServerRequest("log");
        }

        this.revisionState.setLastFileLoaded(file);
    },

    /**
     * Catches incoming messages from the server
     * 
     * @param {JSON} e Incoming data
     */
    onMessage: function(e) {
        var message = e.message;

        if (message.type != "result" && message.subtype != "gittools")
            return;

        if (message.body.err) {
            util.alert("Error",  "There was an error returned from the server:",
                message.body.err);
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
     * Process the results of a "git log" reply from the server
     * 
     * @param {JSON} message Details about the message & output from git log
     */
    onGitLogMessage: function(message) {
        var file = message.body.file;
        var session = this.revisionState.getSession(file);
        var logData = session.parseGitLog(message.body.out);

        if (session.getLastLoadedGitLog() === -1) {
            session.setFirstGitShow(true);
            this.requestGitShow(logData[logData.length-1].commit);
        }

        session.setLastLoadedGitLog(logData.length - 1);
        this.revisionState.restoreState(session);
    },

    /**
     * Process the results of a "git show" reply from the server
     * 
     * @TODO separate the marker functionality
     * 
     * @param {JSON} message Details about the message & output from git show
     */
    onGitShowMessage : function(message) {
        this.loadingRevision = false;

        var file = message.body.file, hash = message.body.hash;
        var fileText = message.body.out;

        var session = this.revisionState.getSession(file);
        var logData = session.getGitLog();
        session.setRevisionText(hash, fileText);

        if (session.isFirstGitShow()) {
            var metaDataOutput;
            if (fileText !== session.getCurrentText()) {
                // Show "uncommitted" message
                metaDataOutput = rutil.formulateRevisionMetaData(null, false);
            } else {
                // Show commit data
                var lastGitLog = logData[session.getLastLoadedGitLog()];
                metaDataOutput = rutil.formulateRevisionMetaData(lastGitLog, true);
            }

            currentVersionsLabel.setValue(metaDataOutput);
            session.setMetaDataOutput(metaDataOutput);
            session.setFirstGitShow(false);
        }

        var hveSession = historicalVersionEditor.getSession();
        hveSession.setValue(fileText);

        var logDataLen = logData.length;
        if (message.body.hash == logData[logDataLen-1].commit)
            btnRestore.disable();
        else
            btnRestore.enable();

        this.setLoadingHtml("<p>Diffing files...</p>", false);
        this.diffFiles();
    },

    /*
    computeLevenshtein : function(text1, text2) {
        return this.dmp.diff_levenshtein(this.dmp.diff_main(text1, text2));
    },
    
    getBestMatch : function(levArr, lenArr) {//l1, l2, l3, len1, len2, len3
        if (levArr[0] === 0)
            return 0;
        if (levArr[1] === 0)
            return 1;
        if (levArr[2] === 0)
            return 2;

        if (levArr[0] === -1 && levArr[1] === -1 && levArr[2] === -1)
            return 0;

        var bestMatch = 0;
        if (levArr[1] !== -1 && levArr[1] != lenArr[1] && levArr[1] < levArr[bestMatch])
            bestMatch = 1;
        if (levArr[2] !== -1 && levArr[2] != lenArr[2] && levArr[2] < levArr[bestMatch])
            bestMatch = 2;

        return bestMatch;
    },
    */

    diffFiles : function() {
        if (!this.dmp)
            this.dmp = new diff_match_patch();

        var diff = this.dmp.diff_main(historicalVersionEditor.$editor.getSession().getValue(),
            currentVersionEditor.$editor.getSession().getValue());
        this.dmp.diff_cleanupSemantic(diff);

        var historyDoc = historicalVersionEditor.$editor.session.getDocument();
        var currentDoc = currentVersionEditor.$editor.session.getDocument();

        var numLeftLines = 0, numRightLines = 0,
            d, tLines, ll, lastLeftLine = "", lastRightLine = "";
        for (var i = 0; i < diff.length; i++) {
            d = diff[i];
            ll = d[1].split("\n");
            tLines = ll.length - 1;
            if (d[0] != 1) {
                // Removed
                if (d[0] == -1) {
                    this.addCodeMarker(historicalVersionEditor, "remove",
                        numLeftLines, lastLeftLine.length, numLeftLines+tLines,
                        ll[ll.length-1].length+lastLeftLine.length);
                    if (tLines == 0)
                        lastLeftLine += ll.pop();
                    else
                        lastLeftLine = ll.pop();
                }

                // Stayed the same
                else {
                    numRightLines += tLines;
                    var llPop = ll.pop();
                    if (tLines == 0) {
                        lastLeftLine += llPop;
                        lastRightLine += llPop;
                    }
                    else {
                        lastLeftLine = llPop;
                        lastRightLine = llPop;
                    }
                }
                numLeftLines += tLines;
            }

            // Added
            else {
                this.addCodeMarker(currentVersionEditor, "add",
                    numRightLines, lastRightLine.length, numRightLines + tLines,
                    ll[tLines].length + lastRightLine.length);
                numRightLines += tLines;
                if (tLines == 0)
                    lastRightLine += ll.pop();
                else
                    lastRightLine = ll.pop();
            }

            var lineDiff = numRightLines - numLeftLines;
            var lineDiffAbs = Math.abs(lineDiff);

            if (lineDiff != 0) {
                var newlines = "";
                for (var j = 0; j < lineDiffAbs; j++)
                    newlines += "\r\n";

                // Add newlines to history
                if (lineDiff > 0) {
                    var nll = numLeftLines;// - lineDiff;
                    /*var hdl1 = historyDoc.getLine(numLeftLines);

                    var cdl1 = currentDoc.getLine(numRightLines - lineDiff - 1);
                    var cdl2 = currentDoc.getLine(numRightLines - lineDiff);
                    var cdl3 = currentDoc.getLine(numRightLines - lineDiff + 1);

                    var diffOne   = this.computeLevenshtein(hdl1, cdl1);
                    var diffTwo   = this.computeLevenshtein(hdl1, cdl2);
                    var diffThree = this.computeLevenshtein(hdl1, cdl3);

                    var cdl1len = cdl1.length > hdl1.length ? cdl1.length : hdl1.length;
                    var cdl2len = cdl2.length > hdl1.length ? cdl2.length : hdl1.length;
                    var cdl3len = cdl3.length > hdl1.length ? cdl3.length : hdl1.length;

                    var bestMatch = this.getBestMatch(
                        [diffOne, diffTwo, diffThree],
                        [cdl1len, cdl2len, cdl3len]
                    );

                    console.log("START");
                    console.log(hdl1);
                    console.log(cdl1);
                    console.log(cdl2);
                    console.log(cdl3);
                    console.log("BEST MATCH", bestMatch, diffOne, diffTwo, diffThree, numLeftLines, numRightLines);
                    console.log("END");
                    // I'm thinking if bestMatch === 1 then we shouldn't be
                    // putting any gray lines in at all.
                    if (bestMatch === 0)
                        nll++;
                    else if (bestMatch === 2)
                        nll--;*/

                    var colEnd = historyDoc.getLine(nll - 1).length;
                    historicalVersionEditor.$editor.moveCursorTo(nll - 1, colEnd);
                    historicalVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    //this.addCodeMarker(historicalVersionEditor, "newlines",
                    //    numLeftLines, lastLeftLine.length, numLeftLines+lineDiff, 0);
                    
                    this.addCodeMarker(historicalVersionEditor, "newlines",
                        nll, lastLeftLine.length, nll+lineDiff, 0);

                    numLeftLines += lineDiff;
                }
                // Add newlines to current
                else {
                    var nrr = numRightLines;// -1;
                    /*var cdl1 = currentDoc.getLine(numRightLines);
                    var hdl1 = historyDoc.getLine(numLeftLines - lineDiffAbs - 1);
                    var hdl2 = historyDoc.getLine(numLeftLines - lineDiffAbs);
                    var hdl3 = historyDoc.getLine(numLeftLines - lineDiffAbs + 1)

                    var diffOne   = this.computeLevenshtein(cdl1, hdl1);
                    var diffTwo   = this.computeLevenshtein(cdl1, hdl2);
                    var diffThree = this.computeLevenshtein(cdl1, hdl3);

                    var hdl1len = hdl1.length > cdl1.length ? hdl1.length : cdl1.length;
                    var hdl2len = hdl2.length > cdl1.length ? hdl2.length : cdl1.length;
                    var hdl3len = hdl3.length > cdl1.length ? hdl3.length : cdl1.length;

                    var bestMatch = this.getBestMatch(
                        [diffOne, diffTwo, diffThree],
                        [hdl1len, hdl2len, hdl3len]
                    );

                    console.log("START");
                    console.log(cdl1);
                    console.log(hdl1);
                    console.log(hdl2);
                    console.log(hdl3);
                    console.log("BEST MATCH", bestMatch);
                    console.log("END");
                    
                    if (bestMatch === 0)
                        nrr++;
                    else(bestMatch === 2)
                        nrr--;*/

                    var colEnd = currentDoc.getLine(nrr - 1).length;
                    currentVersionEditor.$editor.moveCursorTo(nrr - 1, colEnd);
                    currentVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    /*this.addCodeMarker(currentVersionEditor, "newlines",
                        numRightLines, lastRightLine.length,
                        numRightLines+lineDiffAbs, 0);*/
                        
                    this.addCodeMarker(currentVersionEditor, "newlines",
                        nrr, lastRightLine.length, nrr+lineDiffAbs, 0);
                    numRightLines += lineDiffAbs;
                }
            }
        }

        setTimeout(function() {
            //historicalPlaceholder.$ext.style.opacity = 0;
            //historicalPlaceholder.$ext.style.zIndex = "99998";
        });

        this.loading_div.style.top = "-2000px";
    },

    /**
     * Removes all markers from a code editor
     * 
     * @param {apf.codeeditor.session} Code editor session
     */
    removeMarkers: function(session) {
        if (!session.revisionAnchors)
            return;

        var markers = session.getMarkers(false);
        for (var id in markers)
            if (markers[id].clazz.indexOf('revision_hl_') === 0)
                session.removeMarker(id);

        for (var i = 0; i < session.revisionAnchors.length; i++)
            session.revisionAnchors[i].detach();

        session.revisionAnchors = [];
    },

    /**
     * Adds code highlighting to emphasize differences from diff_match_patch
     * 
     * @param {apf.codeeditor} editor The code editor
     * @param {string} type The CSS class suffix to apply (ex. "remove", "add")
     * @param {number} fromRow Which row to start from
     * @param {number} fromColumn Which column to start from
     * @param {number} toRow Row to end on
     * @param {number} toColumn Column to end on
     */
    addCodeMarker : function(editor, type, fromRow, fromColumn, toRow, toColumn) {
        if (fromRow == toRow && fromColumn == toColumn)
            return;

        var markerId;
        var mySession = editor.$editor.session;

        if (!mySession.revisionAnchors) mySession.revisionAnchors = [];

        var colDiff = toColumn - fromColumn;
        var rowDiff = toRow - fromRow;
        var anchor = new Anchor(mySession.getDocument(), fromRow, fromColumn);
        mySession.revisionAnchors.push(anchor);

        function updateFloat() {
            if (markerId)
                mySession.removeMarker(markerId);
            var range = Range.fromPoints(anchor.getPosition(), {
                row: anchor.row + rowDiff,
                column: anchor.column + colDiff
            });

            markerId = mySession.addMarker(range, "revision_hl_" + type);
        }

        updateFloat();
        anchor.on("change", function() {
            updateFloat();
        });
    }
});

});