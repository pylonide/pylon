/**
 * File history browser for Cloud9 IDE
 * 
 * TODO:
 * 
 * Historical version should show up with the latest committed value
 * Current version should show "uncommited" if changes have been made
 * Implement "Restore" functionality
 * On restore animate history page to current page
 * On restore set ceEditor's content
 * Clear markers on restore
 * When requesting a revision, display a spinner somewhere
 * Refresh (button next to dropdown button?)
 * Match horizontal scrolling
 * ? On hover of meta-data, pop-out to show commit message
 * Use dmp's fuzzy matching method to decide on gray-line placement
 * Get APF-filtered list instead of doing our own filtering
 * Make the history so it floats in from left if after current revision view
 * 
 * Bugs:
 * 
 * Load run.js, see log commits run past most recent commit. Hmm...
 * clicking around clears the syntax highlighting (wtf?)
 * focus() on search after clear doesn't work. Fix APF
 * 
 * Ideal:
 * 
 * Higher performance scroll match - how'd Mike do it?
 * Undo Restore
 * Dialog warning about what Restore does
 *  - But only when we have global settings
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
var Range = require("ace/range").Range;
var Anchor = require('ace/anchor').Anchor;
var editors = require("ext/editors/editors");
var GitLogParser = require("ext/revisions/gitlogparser");

var skin = require("text!ext/revisions/skin.xml");
var markup = require("text!ext/revisions/revisions.xml");

module.exports = ext.register("ext/revisions/revisions", {
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
    gitLogs  : {},

    nodes : [],

    init : function() {
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
                            margin : "20 20 0 30",
                            childNodes : [
                                new apf.vbox({
                                    height : "104",
                                    id : "vbHistoricalHeader",
                                    childNodes : [
                                        new apf.hbox({
                                            childNodes : [
                                                new apf.text({
                                                    id : "versions_label",
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
                                                    skin : "searchbox_textbox",
                                                    "initial-message" : "Filter",
                                                    "class" : "versions_search",
                                                    margin: "0 20 0 0",
                                                    onclear : function() {
                                                        _self.filterTimeline("");
                                                    },
                                                    onkeyup : function() {
                                                        _self.filterTimeline(this.getValue());
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
                                    flex : "1",
                                    onresize : function(e) {
                                        if (_self.historyGraphics)
                                            _self.historyGraphics.style.height = this.getHeight() + "px";
                                    }
                                })
                            ]
                        }),
                        new apf.vbox({
                            flex : "1",
                            margin : "20 20 0 30",
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
                                                    id : "current_doc_label",
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

        this.historicalPlaceholder = new apf.codeeditor({
            id                : "historicalPlaceholder",
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
            style : "z-index : 99998; position: absolute; top: -10000px; background: #fff"
        });

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
            style : "z-index : 99999; position: absolute; background: #fff"
        });

        this.animateEditorClone = new apf.vbox({
            id : "animateEditorClone",
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
                    autohidehorscrollbar  : "[{require('ext/settings/settings').model}::editors/code/@autohidehorscrollbar]",
        
                    "debugger"        : "null",
                    readonly          : "true"
                })
            ]
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
            style : "z-index : 99999; position: absolute; background: #fff"
        });

        setTimeout(function() {
            vbMain.parentNode.appendChild(_self.historicalVersionEditor);
            vbMain.parentNode.appendChild(_self.historicalPlaceholder);
            vbMain.parentNode.appendChild(_self.currentVersionEditor);
            vbMain.parentNode.appendChild(_self.animateEditorClone);

            _self.sliderTooltip = document.createElement("div");
            _self.sliderTooltip.setAttribute("id", "slider_tooltip");
            vbVersions.$ext.appendChild(_self.sliderTooltip);

            _self.historyGraphics = document.createElement("div");
            _self.historyGraphics.setAttribute("id", "history_graphics");

            var smallGHistory = document.createElement("div");
            smallGHistory.setAttribute("id", "small_ghistory");
            smallGHistory.setAttribute("class", "history_graphic");
            _self.historyGraphics.appendChild(smallGHistory);

            var mediumGHistory = document.createElement("div");
            mediumGHistory.setAttribute("id", "medium_ghistory");
            mediumGHistory.setAttribute("class", "history_graphic");
            _self.historyGraphics.appendChild(mediumGHistory);

            var largeGHistory = document.createElement("div");
            largeGHistory.setAttribute("id", "large_ghistory");
            largeGHistory.setAttribute("class", "history_graphic");
            _self.historyGraphics.appendChild(largeGHistory);

            vbVersions.$ext.appendChild(_self.historyGraphics);

            var sliderBg = document.createElement("div");
            sliderBg.setAttribute("id", "versionsSliderBg");
            vbHistoricalHeader.$ext.appendChild(sliderBg);

            _self.sliderEl = document.createElement("div");
            _self.sliderEl.setAttribute("id", "versionsHistoricalSlider");
            vbHistoricalHeader.$ext.appendChild(_self.sliderEl);

            currentVersionEditor.$editor.getSession().setUseWrapMode(false);
            _self.currentScrollbar = currentVersionEditor.$editor.renderer.scrollBar;
            _self.currentScrollbar.addEventListener("scroll", function(e) {
                if (!_self.loadingRevision)
                    historicalVersionEditor.$editor.renderer.scrollBar.setScrollTop(e.data);
            });

            historicalVersionEditor.$editor.getSession().setUseWrapMode(false);
            _self.historicalScrollbar = historicalVersionEditor.$editor.renderer.scrollBar;
            _self.historicalScrollbar.addEventListener("scroll", function(e) {
                if (!_self.loadingRevision)
                    currentVersionEditor.$editor.renderer.scrollBar.setScrollTop(e.data);
            });
        }, 100);

        lstCommits.addEventListener("click", function() {
            _self.loadRevisionFromList();
            menuCommits.hide();
        });
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
        this.gitLogParser = new GitLogParser();

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        window.addEventListener("resize", function() {
            if (_self.isFocused)
                _self.resizeElements();
        });

        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Compare File History",
                onclick : function(){
                    _self.enterVersionMode();
                }
            }))
        );

        ide.addEventListener("editorswitch", function(e) {
            var fileName = _self.getFilePath(e.previousPage.name);
            var fileLog = _self.gitLogs[fileName];
            if (fileLog) {
                _self.removeTimelinePoints(fileLog.logData);
                fileLog.logData = [];
            }
        });

        ext.initExtension(this);
    },

    resizeElements : function() {
        var ph = currentVersionHolder.$ext;
        var cPos = apf.getAbsolutePosition(ph);
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

    formulateRevisionMetaData : function(data, includeMessage) {
        var timestamp = this.formulateVersionsLabelDate(data.author.timestamp);
        var output = ['<table cellspacing="0" cellpadding="0" border="0">',
            '<tr><td class="rev_header">Author:</td><td>', data.author.fullName,
            " ", apf.htmlentities(data.author.email), '</td></tr>',
            '<tr><td class="rev_header">Date:</td><td>', timestamp, '</td></tr>',
            '<tr><td class="rev_header">Commit:</td><td>', data.commit.substr(0, 10),
            '</td></tr>'];
        if (includeMessage)
            output.push('<tr><td class="rev_header">Message:</td><td>',
                data.message.join("<br />"), '</td></tr>');
        output.push('</table>');
        return output.join("");
    },

    loadRevisionFromList : function() {
        this.loadRevision(lstCommits.selected.getAttribute("internal_counter"));
    },

    loadRevision : function(num) {
        this.loadingRevision = true;

        var fileData = this.gitLogs[this.getFilePath()];
        var hash = fileData.logData[num].commit;

        var node = lstCommits.queryNode("commit[@internal_counter='" +num + "']");
        if (node && !lstCommits.isSelected(node))
            lstCommits.select(node);

        if (fileData.logData[fileData.lastLoadedGitLog])
            fileData.logData[fileData.lastLoadedGitLog].dotEl.setAttribute("class", "");
        fileData.logData[num].dotEl.setAttribute("class", "current");
        fileData.lastLoadedGitLog = num;

        var output = this.formulateRevisionMetaData(fileData.logData[num], true);
        versions_label.setValue(output);

        var cveSession = currentVersionEditor.$editor.getSession();
        cveSession.setValue(ceEditor.$editor.getSession().getValue());
        this.removeMarkers(cveSession);

        var _self = this;
        var hveLeftMovement = -1 * (historicalVersionEditor.getWidth() + 300);

        var hvePos = apf.getAbsolutePosition(historicalVersionEditor.$ext);
        historicalPlaceholder.$ext.style.left = hvePos[0] + "px";
        historicalPlaceholder.$ext.style.top = hvePos[1] + "px";
        historicalPlaceholder.$ext.style.width = historicalVersionEditor.getWidth() + "px";
        historicalPlaceholder.$ext.style.height = historicalVersionEditor.getHeight() + "px";

        Firmin.animate(historicalVersionEditor.$ext, {
            translateX: "15px"
        }, 0.3, function() {
            Firmin.animate(historicalVersionEditor.$ext, {
                translateX: hveLeftMovement + "px"
            }, 0.6, function() {
                historicalPlaceholder.$ext.style.zIndex = "99999";
                _self.requestGitShow(hash);
            });
        });
    },

    restoreRevision : function() {
        btnRestore.disable();
    },

    /**
     * Transforms the interface into a side-by-side comparison
     * of the current document and its historical revisions
     */
    enterVersionMode : function() {
        var _self = this;

        var file = this.getFilePath();
        var filename = file.split("/").pop();
        current_doc_label.setValue(filename);

        this.requestGitLog();

        var currentSession = ceEditor.$editor.getSession();
        var cveSession = currentVersionEditor.$editor.getSession();
        var hveSession = historicalVersionEditor.$editor.getSession();

        // Copy the current document to the new ones
        var currentDocText = currentSession.getValue();
        hveSession.setValue(currentDocText);
        cveSession.setValue(currentDocText);

        var cecSession = currentEditorClone.$editor.getSession();
        cecSession.setValue(currentDocText);

        var cePos = apf.getAbsolutePosition(ceEditor.$ext);
        animateEditorClone.$ext.style.left = cePos[0] + "px";
        animateEditorClone.$ext.style.top = cePos[1] + "px";
        animateEditorClone.$ext.style.width = ceEditor.getWidth() + "px";
        animateEditorClone.$ext.style.height = ceEditor.getHeight() + "px";
        animateEditorClone.show();

        var moveToLeft = (window.innerWidth/2 + 30);
        var moveToWidth = ((window.innerWidth - moveToLeft) - 18);
        var moveToHeight = (window.innerHeight - 199);
        
        animateEditorClone.$ext.setAttribute("class", "bounce_into_current");

        Firmin.animate(animateEditorClone.$ext, {
            left : moveToLeft + "px",
            width : moveToWidth + "px",
            height : moveToHeight + "px"
        }, 3.0, function() {
            animateEditorClone.hide();
        });

        // Set the document mode for syntax highlighting
        cveSession.setMode(currentSession.getMode());
        hveSession.setMode(currentSession.getMode());

        vbVersions.show();
        Firmin.animate(vbVersions.$ext, {
            opacity: "1"
        }, 3.0, function() {
            historicalVersionEditor.show();
            currentVersionEditor.show();
            _self.resizeElements();
            apf.layout.forceResize(document.body);
        });

        this.isFocused = true;
    },

    escapeVersionMode : function() {
        var currentSession = ceEditor.$editor.getSession();
        var currentDocText = currentSession.getValue();
        var cecSession = currentEditorClone.$editor.getSession();
        cecSession.setValue(currentDocText);

        var cvePos = apf.getAbsolutePosition(currentVersionEditor.$ext);
        animateEditorClone.$ext.style.left = cvePos[0] + "px";
        animateEditorClone.$ext.style.top = cvePos[1] + "px";
        animateEditorClone.$ext.style.width = ceEditor.getWidth() + "px";
        animateEditorClone.$ext.style.height = ceEditor.getHeight() + "px";
        animateEditorClone.show();

        var cePos = apf.getAbsolutePosition(ceEditor.$ext);
        var moveToLeft = cePos[0];
        var moveToWidth = ceEditor.getWidth();
        var moveToHeight = ceEditor.getHeight();
        
        animateEditorClone.$ext.setAttribute("class", "bounce_outta_current");

        Firmin.animate(animateEditorClone.$ext, {
            left : moveToLeft + "px",
            width : moveToWidth + "px",
            height : moveToHeight + "px"
        }, 2.0, function() {
            animateEditorClone.hide();
        });

        historicalVersionEditor.hide();
        currentVersionEditor.hide();

        Firmin.animate(vbVersions.$ext, {
            opacity: "0"
        }, 2.0, function() {
            vbVersions.hide();
            apf.layout.forceResize(document.body);
        });

        this.isFocused = false;
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

        ide.dispatchEvent("track_action", {
            type: "gittools",
            cmd: this.command,
            subcommand: data.subcommand
        });

        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, {
              data: data
            }) !== false) {
                if (!ide.onLine)
                    util.alert("Currently Offline", "Currently Offline", "This operation could not be completed because you are offline.");
                else
                    ide.socket.send(JSON.stringify(data));
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

        ide.dispatchEvent("track_action", {
            type: "gittools",
            cmd: this.command,
            subcommand: data.subcommand
        });

        if (ext.execCommand(this.command, data) !== false) {

            if (ide.dispatchEvent("consolecommand." + this.command, { data: data}) !== false) {
                if (!ide.onLine) {
                    util.alert("Currently Offline", "Currently Offline", "This operation could not be completed because you are offline.");
                } else {
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
            util.alert("Error",  "There was an error returned from the server:", message.body.err);
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

    arrCommits2Xml : function(arr, elName) {
        var out = ["<", elName, "s>"], attrMessage;

        for (var i = 0, len = arr.length; i < len; i++) {
            // Clean up the comit message
            attrMessage = apf.xmlentities(apf.htmlentities(arr[i].messageJoinedLower));
            attrMessage = attrMessage.replace(/(\r\n|\r|\n)/gm, " ").replace(/"/g, "&quot;");
            out.push("<", elName, " ",
                'hash="', arr[i].commit, '" ',
                'authoremail="', apf.htmlentities(arr[i].author.email), '" ',
                'authorname="', arr[i].author.fullName, '" ',
                'timestamp="', arr[i].author.timestamp, '" ',
                'message="', attrMessage, '" ',
                'internal_counter="', i, '"',
            ' />');
        }

        out.push("</", elName, "s>");
        return out.join("");
    },

    /**
     * The server has sent back the results of a "git log" request
     * 
     * @param {JSON} message Details about the message & output from git log
     */
    onGitLogMessage: function(message) {
        this.gitLogParser.parseLog(message.body.out);

        var logData = this.gitLogParser.getLogData();
        for (var gi = 0, logDataLength = logData.length; gi < logDataLength; gi++) {
            logData[gi].commitLower = logData[gi].commit.toLowerCase();
            logData[gi].parentLower = logData[gi].parent.toLowerCase();
            logData[gi].treeLower = logData[gi].tree.toLowerCase();
            logData[gi].messageJoinedLower = logData[gi].message.join("\n").toLowerCase();
            logData[gi].author.emailLower = logData[gi].author.email.toLowerCase();
            logData[gi].author.fullNameLower = logData[gi].author.fullName.toLowerCase();
            logData[gi].committer.emailLower = logData[gi].committer.email.toLowerCase();
            logData[gi].committer.fullNameLower = logData[gi].committer.fullName.toLowerCase();
        }

        var mdlOut = apf.getXml(this.arrCommits2Xml(logData, "commit"));
        mdlCommits.load(mdlOut);

        var file = message.body.file;
        this.gitLogs[file].logData = logData;
        this.gitLogs[file].lastLoadedGitLog = logDataLength -1;

        var output = this.formulateRevisionMetaData(logData[logDataLength-1], true);
        versions_label.setValue(output);
        current_versions_label.setValue(output);

        this.setupTimeline(this.gitLogs[file].logData);

        this.gitLogs[file].logData[logDataLength-1].dotEl.setAttribute("class", "current");
    },

    /**
     * The server has sent back the results of a "git show" request
     * 
     * @param {JSON} message Details about the message & output from git show
     */
    onGitShowMessage : function(message) {
        this.loadingRevision = false;

        var fileText = message.body.out;
        this.gitLogs[message.body.file].revisions[message.body.hash] =
            fileText;

        var st = currentVersionEditor.$editor.session.getScrollTop();
        var sl = currentVersionEditor.$editor.session.getScrollLeft();

        var hveSession = historicalVersionEditor.$editor.getSession();
        hveSession.setValue(fileText);

        var gLogs = this.gitLogs[message.body.file];
        var logDataLen = gLogs.logData.length;
        if (message.body.hash == gLogs.logData[logDataLen-1].commit)
            btnRestore.disable();
        else
            btnRestore.enable();

        if (!this.dmp)
            this.dmp = new diff_match_patch();

        var diff = this.dmp.diff_main(fileText,
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
                    // @TODO: DMP fuzzy logic to see if nll = numLeftLines-1 or not
                    var nll;
                    nll = numLeftLines;

                    var colEnd = historyDoc.getLine(nll).length;
                    historicalVersionEditor.$editor.moveCursorTo(nll, colEnd);
                    historicalVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    this.addCodeMarker(historicalVersionEditor, "newlines",
                        numLeftLines, 0, numLeftLines+lineDiff, 0);

                    numLeftLines += lineDiff;
                }
                // Add newlines to current
                else {
                    // @TODO: DMP fuzzy logic to see if nll = numLeftLines-1 or not
                    var nrr;
                    nrr = numRightLines;
                    var colEnd = currentDoc.getLine(nrr).length;
                    currentVersionEditor.$editor.moveCursorTo(nrr, colEnd);
                    currentVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    this.addCodeMarker(currentVersionEditor, "newlines",
                        numRightLines, 0, numRightLines+lineDiff, 0);

                    numRightLines += lineDiffAbs;
                }
            }
        }

        Firmin.animate(historicalVersionEditor.$ext, {
            translateX: "0px"
        }, 0, function() {
            historicalVersionEditor.$editor.session.setScrollLeft(sl);
            currentVersionEditor.$editor.session.setScrollLeft(sl);
            historicalVersionEditor.$editor.session.setScrollTop(st);
            currentVersionEditor.$editor.session.setScrollTop(st);

            historicalPlaceholder.$ext.style.zIndex = "99998";
            historicalPlaceholder.$ext.style.top = "-10000px";
        });
    },

    removeMarkers: function(session) {
        if (!session.revisionAnchors)
            return;

        var markers = session.getMarkers(false);
        for (var id in markers) {
            if (markers[id].clazz.indexOf('revision_hl_') === 0) {
                session.removeMarker(id);
            }
        }
        for (var i = 0; i < session.revisionAnchors.length; i++) {
            session.revisionAnchors[i].detach();
        }
        session.revisionAnchors = [];
    },

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
            updateFloat(true);
        });
    },

    formulateVersionsLabelDate : function(ts) {
        var date = new Date(ts*1000);
        var ds = date.toString().split(" ");
        return ds[1] + " " + ds[2] + " " + ds[3] + " " + ds[4];
    },

    removeTimelinePoints : function(logData) {
        for (var i = 0, len = logData.length; i < len; i++) {
            logData[i].dotEl.removeEventListener("mouseover", logData[i].dotElMouseOver);
            logData[i].dotEl.removeEventListener("mouseout", logData[i].dotElMouseOut);
            logData[i].dotEl.removeEventListener("click", logData[i].dotElClick);
            this.sliderEl.removeChild(logData[i].dotEl);
        }
    },

    setupTimeline : function(logData) {
        if (!logData.length)
            return;

        var _self = this;

        var len = logData.length;
        var tsBegin = logData[0].author.timestamp;
        var timeSpan = logData[len-1].author.timestamp - tsBegin;

        // Create all the points in time
        for (var i = 0; i < len; i++) {
            var ts = logData[i].author.timestamp;
            var tsDiff = ts - tsBegin;
            var percentage = (tsDiff / timeSpan) * 100;

            logData[i].dotEl = document.createElement("u");
            logData[i].dotEl.setAttribute("style", "left: " + percentage + "%");
            logData[i].dotEl.setAttribute("rel", i);
            logData[i].dotEl.setAttribute("hash", logData[i].commit);
            logData[i].dotEl.addEventListener("mouseover", logData[i].dotElMouseOver = function() {
                var dotClass = this.getAttribute("class");
                if(dotClass && dotClass.split(" ")[0] == "pop")
                    return;
                var it = this.getAttribute("rel");
                var output = _self.formulateRevisionMetaData(logData[it], false);
                _self.sliderTooltip.innerHTML = output;

                var pos = apf.getAbsolutePosition(this);

                var sttWidth = apf.getHtmlInnerWidth(_self.sliderTooltip);
                var leftPos = pos[0] - (sttWidth/2);
                if (leftPos < 0)
                    leftPos = 5;

                Firmin.animate(_self.sliderTooltip, {
                    left: leftPos+"px"
                }, 0, function() {
                    Firmin.animate(_self.sliderTooltip, {
                        translateY: -30,
                        scale: 1,
                        opacity: 1
                    }, 0.3);
                });
            });

            logData[i].dotEl.addEventListener("mouseout", logData[i].dotElMouseOut = function() {
                Firmin.animate(_self.sliderTooltip, {
                    scale: 0.1,
                    opacity: 0
                }, 0.4);
            });

            logData[i].dotEl.addEventListener("click", logData[i].dotElClick = function() {
                _self.loadRevision(this.getAttribute("rel"));
            });

            this.sliderEl.appendChild(logData[i].dotEl);
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

    filterTimeline : function(filter) {
        var currentFile = this.getFilePath();

        // @TODO Why are we allowing user to search w/out log data?
        // Search should be disabled until the logData is loaded
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
                    logs[i].dotEl.setAttribute("class", "pop current");
                else
                    logs[i].dotEl.setAttribute("class", "pop");
            } else {
                if (isCurrent)
                    logs[i].dotEl.setAttribute("class", "current");
                else
                    logs[i].dotEl.setAttribute("class", "");
            }
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});