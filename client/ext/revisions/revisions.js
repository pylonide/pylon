/**
 * File history browser & comparison tool for Cloud9 IDE
 * 
 * TODO:
 * 
 * Implement "Restore" functionality
 *  - Set ceEditor's content
 *  - Animate history page to current page
 *  - Clear markers
 *  - Undo
 * Refresh (button next to dropdown button?)
 * ? On hover of meta-data, pop-out to show commit message
 * Get APF-filtered list instead of doing our own filtering
 * Implement a Git Log State class, move everything over
 * Skip line numbers in gutter where gray areas exist
 * Clean up the elements fading in & out upon entry and exit
 * 
 * Bugs:
 * 
 * Diff state isn't kept on re-entry
 * clicking around clears the syntax highlighting (wtf?)
 * focus() on search after clear doesn't work. Fix APF
 *  - Or get rid of X
 * UI and animations are totally messed up in FF
 * Server is sending data back to all clients
 *  - (fixed in githubissues)
 * 
 * Ideal:
 * 
 * In between the two editors, put a "minimap" of areas with diffs
 * Unobstrusive popup warning about what Restore does
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
var rutil = require("ext/revisions/util");
var timeline = require("ext/revisions/timeline");
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
    currentFile : "",

    nodes : [],

    hook : function(){
        var _self = this;

        document.body.appendChild(
            rutil.createElement("script", {
                "type" : "text/javascript",
                "src" : ide.staticPrefix + "/ext/revisions/diff_match_patch.js"
            })
        );

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
                                                    disabled : true,
                                                    skin : "searchbox_textbox",
                                                    "initial-message" : "Filter",
                                                    "class" : "versions_search",
                                                    margin: "0 20 0 0",
                                                    onclear : function() {
                                                        timeline.filterTimeline("", _self.gitLogs, _self.currentFile);
                                                    },
                                                    onkeyup : function() {
                                                        timeline.filterTimeline(this.getValue(), _self.gitLogs, _self.currentFile);
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
            style             : "z-index : 99998; position: absolute; top: -10000px; background: #fff"
        });

        this.historicalVersionEditor = new apf.codeeditor({
            id                : "historicalVersionEditor",
            visible           : "true",
            syntax            : "",//{require('ext/code/code').getSyntax(%[.])}",
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
            style             : "z-index : 99999; position: absolute; background: #fff"
        });

        this.animateEditorClone = new apf.vbox({
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
            style             : "z-index : 99999; position: absolute; background: #fff"
        });

        // Wait for the elements to get loaded in...
        setTimeout(function() {
            /*vbMain.parentNode.appendChild(_self.historicalVersionEditor);
            vbMain.parentNode.appendChild(_self.historicalPlaceholder);
            vbMain.parentNode.appendChild(_self.currentVersionEditor);
            vbMain.parentNode.appendChild(_self.animateEditorClone);*/
            
            vbVersions.appendChild(_self.historicalVersionEditor);
            vbVersions.appendChild(_self.historicalPlaceholder);
            vbVersions.appendChild(_self.currentVersionEditor);
            vbMain.appendChild(_self.animateEditorClone);

            _self.historyGraphics = rutil.createElement("div", { "id" : "history_graphics" });

            var smallGHistory = rutil.createElement("div",  { "id" : "small_ghistory",  "class" : "history_graphic" });
            _self.historyGraphics.appendChild(smallGHistory);
            var mediumGHistory = rutil.createElement("div", { "id" : "medium_ghistory", "class" : "history_graphic" });
            _self.historyGraphics.appendChild(mediumGHistory);
            var largeGHistory = rutil.createElement("div",  { "id" : "large_ghistory",  "class" : "history_graphic" });
            _self.historyGraphics.appendChild(largeGHistory);
            vbVersions.$ext.appendChild(_self.historyGraphics);

            _self.loading_div = rutil.createElement("div", { "id" : "revisions_loading" });
            vbVersions.$ext.appendChild(_self.loading_div);

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
        }, 100);

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

        this.currentFile = rutil.getFilePath();

        var filename = this.currentFile.split("/").pop();
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
        historicalVersionEditor.$ext.style.left = pos[0] + "px";
        historicalVersionEditor.$ext.style.top  = pos[1] + "px";

        historicalVersionEditor.$ext.style.width  = (ph.offsetWidth + 2) + "px";
        historicalVersionEditor.$ext.style.height = ph.offsetHeight + "px";
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

        var fileData = this.gitLogs[this.currentFile];
        var hash = fileData.logData[num].commit;

        var node = lstCommits.queryNode("commit[@internal_counter='" +num + "']");
        if (node && !lstCommits.isSelected(node))
            lstCommits.select(node);

        if (fileData.logData[fileData.lastLoadedGitLog])
            fileData.logData[fileData.lastLoadedGitLog].dotEl.setAttribute("class", "");
        fileData.logData[num].dotEl.setAttribute("class", "current");
        fileData.lastLoadedGitLog = num;

        var output = rutil.formulateRevisionMetaData(fileData.logData[num], true);
        versions_label.setValue(output);

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
    },

    setLoadingHtml : function(html, initialShow) {
        this.loading_div.innerHTML = html;
        if (initialShow)
            this.loading_div.style.top = "-2000px";
        var iw = apf.getHtmlInnerWidth(this.loading_div);
        var ih = apf.getHtmlInnerHeight(this.loading_div);
        if (initialShow)
            this.loading_div.style.top = (window.innerHeight/2 - ih/2) + "px";
        this.loading_div.style.left = (window.innerWidth/2 - iw/2) + "px";
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
            file : this.currentFile
        };

        apf.extend(data, extra);

        ide.dispatchEvent("track_action", {
            type: "gittools",
            cmd: this.command,
            subcommand: data.subcommand
        });

        if (ext.execCommand(this.command, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + this.command, { data: data}) !== false) {
                if (!ide.onLine) {
                    util.alert("Currently Offline", "Currently Offline", "This operation could not be completed because you are offline.");
                    return false;
                } else {
                    ide.socket.send(JSON.stringify(data));
                    return true;
                }
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
     * Requests git log data from the server, about the current file
     */
    requestGitLog : function() {
        var file = this.currentFile;

        if (this.lastFileLoaded)
            timeline.removeTimelinePoints(this.gitLogs[this.lastFileLoaded].logData);

        if (!this.gitLogs[file]) {
            this.gitLogs[file] = {
                logData : [],
                lastLoadedGitLog : -1,
                firstGitShow : true,
                currentRevision : editors.currentEditor ?
                    editors.currentEditor.ceEditor.getSession().getValue() : "",
                revisions : {}
            };

            tbRevisionsSearch.disable();
            this.sendServerRequest("log");
        } else {
            this.restoreGitLogState(this.gitLogs[file].logData, file);
        }

        this.lastFileLoaded = file;
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

    /**
     * Process the results of a "git log" reply from the server
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

        var file = message.body.file;
        if (this.gitLogs[file].lastLoadedGitLog == -1) {
            // We've never loaded this before, so get the most recent
            // commit from git show
            this.gitLogs[file].firstGitShow = true;
            this.requestGitShow(logData[logDataLength-1].commit);
        }

        this.gitLogs[file].logData = logData;
        this.gitLogs[file].lastLoadedGitLog = logDataLength - 1;

        this.restoreGitLogState(logData, file);
    },

    restoreGitLogState : function(logData, file) {
        var mdlOut = apf.getXml(rutil.arrCommits2Xml(logData, "commit"));
        mdlCommits.load(mdlOut);

        var output = rutil.formulateRevisionMetaData(logData[this.gitLogs[file].lastLoadedGitLog], true);
        versions_label.setValue(output);

        if (!this.gitLogs[file].firstGitShow)
            current_versions_label.setValue(this.gitLogs[file].metaDataOutput);

        timeline.setupTimeline(logData);
        tbRevisionsSearch.enable();

        this.gitLogs[file].logData[this.gitLogs[file].lastLoadedGitLog].dotEl.setAttribute("class", "current");
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
        var gLogs = this.gitLogs[file];

        gLogs.revisions[hash] = fileText;

        if (gLogs.firstGitShow) {
            var metaDataOutput;
            if (fileText !== gLogs.currentRevision) {
                // Show "uncommitted" message
                metaDataOutput = rutil.formulateRevisionMetaData(null, false);
            } else {
                // Show commit data
                var lastGitLog = this.gitLogs[file].logData[this.gitLogs[file].lastLoadedGitLog];
                metaDataOutput = rutil.formulateRevisionMetaData(lastGitLog, true);
            }

            current_versions_label.setValue(metaDataOutput);
            gLogs.metaDataOutput = metaDataOutput;
            gLogs.firstGitShow = false;
        }

        var hveSession = historicalVersionEditor.$editor.getSession();
        hveSession.setValue(fileText);

        var logDataLen = gLogs.logData.length;
        if (message.body.hash == gLogs.logData[logDataLen-1].commit)
            btnRestore.disable();
        else
            btnRestore.enable();

        this.setLoadingHtml("<p>Diffing files...</p>", false);
        this.diffFiles();
    },
    
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
                    // @TODO: Do we need DMP fuzzy logic?
                    var nll = numLeftLines;
                    if(historyDoc.getLine(nll) != currentDoc.getLine(numRightLines-lineDiff))
                        nll--;

                    var colEnd = historyDoc.getLine(nll).length;
                    historicalVersionEditor.$editor.moveCursorTo(nll, colEnd);
                    historicalVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    this.addCodeMarker(historicalVersionEditor, "newlines",
                        numLeftLines, lastLeftLine.length, numLeftLines+lineDiff, 0);

                    numLeftLines += lineDiff;
                }
                // Add newlines to current
                else {
                    var nrr = numRightLines;
                    if(currentDoc.getLine(nrr) != historyDoc.getLine(numLeftLines-lineDiffAbs))
                        nrr--;

                    var colEnd = currentDoc.getLine(nrr).length;
                    currentVersionEditor.$editor.moveCursorTo(nrr, colEnd);
                    currentVersionEditor.$editor.insert(newlines);

                    // Now insert grayspace
                    this.addCodeMarker(currentVersionEditor, "newlines",
                        numRightLines, lastRightLine.length, numRightLines+lineDiffAbs, 0);

                    numRightLines += lineDiffAbs;
                }
            }
        }

        setTimeout(function() {
            historicalPlaceholder.$ext.style.opacity = 0;
            historicalPlaceholder.$ext.style.zIndex = "99998";
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
     * @param {string} type Essentially the CSS class suffix to apply (ex. "remove", "add")
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