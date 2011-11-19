/**
 * Ace Bugs extension for Cloud9 IDE
 * 
 * @copyright 2011, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext     = require("core/ext");
var ide     = require("core/ide");
var editors = require("ext/editors/editors");
var markup  = require("text!ext/acebugs/acebugs.xml");

module.exports = ext.register("ext/acebugs/acebugs", {
    name: "Ace Bugs",
    dev: "Cloud9 IDE, Inc.",
    alone: true,
    type: ext.GENERAL,
    markup: markup,

    nodes: [],
    
    fileAnnoData : {},
    currentAnnoData : null,

    init: function(amlNode) {
        var currEditor = editors.currentEditor;
        var _self = this;
        if (currEditor) {
            this.editorSession = currEditor.ceEditor.getSession();

            this.editorSession.on("changeAnnotation", function(e) {
                _self.updateAnnotations();
            });
        }
    },

    hook: function() {
        var _self = this;
        this.annotationWorker = new Worker("/static/ext/acebugs/annotation_worker.js");
        this.annotationWorker.onmessage = function(e) {
            var fileName = editors.getFilePath();

            if (!_self.fileAnnoData[fileName] || _self.fileAnnoData[fileName].xml != e.data.outXml) {
                _self.fileAnnoData[fileName] = {
                    xml : e.data.outXml,
                    lines : e.data.lineNums,
                    lastPos : -1,
                    numLines : e.data.lineNums.length
                };
            }

            acebugsNumber.setAttribute("caption", e.data.errors + e.data.warnings);
            if (e.data.errors)
                btnAceBugs.setAttribute("class", "editor_warning error");
            else if (e.data.warnings)
                btnAceBugs.setAttribute("class", "editor_warning warning");
            else
                btnAceBugs.setAttribute("class", "editor_warning");

            _self.currentAnnoData = _self.fileAnnoData[fileName];
            _self.restoreState();

            //mdlAceAnnotations.load(apf.getXml(e.data.outXml.replace(/&/g, "&amp;")));
        };

        this.annotationWorker.onerror = function(e) {};

        ide.addEventListener("afteropenfile", function(e) {
            _self.updateAnnotations();
        });

        ide.addEventListener("changeAceSession", function(e){
            var ce = editors.currentEditor;
            if (ce) {
                _self.editorSession = ce.ceEditor.getSession();
                _self.editorSession.removeEventListener("changeAnnotation", _self.$listenChangeAnno);
                _self.editorSession.addEventListener("changeAnnotation", _self.$listenChangeAnno = function(e) {
                    _self.updateAnnotations();
                });

                _self.updateAnnotations();
            }
        });

        this.setupUI();
    },

    restoreState : function() {
        if (this.currentAnnoData.numLines === 0) {
            acebugsNavBack.disable();
            acebugsNavFwd.disable();
        }
        else {
            acebugsNavBack.enable();
            acebugsNavFwd.enable();
        }
    },

    goToNext : function() {
        this.currentAnnoData.lastPos++;
        if (this.currentAnnoData.lastPos >= this.currentAnnoData.numLines)
            this.currentAnnoData.lastPos = 0;
        var lineNum = this.currentAnnoData.lines[this.currentAnnoData.lastPos];
        this.ceEditor.$editor.gotoLine(lineNum);
    },

    goToPrevious : function() {
        this.currentAnnoData.lastPos--;
        if (this.currentAnnoData.lastPos < 0)
            this.currentAnnoData.lastPos = (this.currentAnnoData.numLines-1);
        var lineNum = this.currentAnnoData.lines[this.currentAnnoData.lastPos];
        this.ceEditor.$editor.gotoLine(lineNum);
    },

    // Put btnAceBugs outside the hbox and animate the hbox from 0 to full width
    setupUI : function() {
        var _self = this;
        editors.addBarButton(
            new apf.hbox({
                id : "acebugsContainer",
                height : "22",
                width : "29",
                childNodes : [
                    new apf.hbox({
                        width : "0",
                        id : "acebugsLeftHidden",
                        "class" : "acebugsLeftHidden",
                        childNodes : [
                            new apf.button({
                                id : "acebugsNavBack",
                                skin : "btn-bug-nav",
                                "class" : "left",
                                margin : "4 0 0 5",
                                width : "18",
                                height : "14",
                                onclick : function(e) {
                                    _self.goToPrevious();
                                }
                            }),
                            new apf.button({
                                id : "acebugsNavFwd",
                                skin : "btn-bug-nav",
                                "class" : "right",
                                margin : "4 0 0 0",
                                width : "18",
                                height : "14",
                                onclick : function(e) {
                                    _self.goToNext();
                                }
                            }),
                            new apf.label({
                                id : "acebugsNumber",
                                "class" : "editor_label",
                                caption : "0",
                                width : "16",
                                style : "text-align: center",
                                margin : "2 5 0 5"
                            })
                        ]
                    }),
                    new apf.button({
                        id : "btnAceBugs",
                        skin : "editor-bar-btn",
                        "class" : "editor_warning",
                        width : "29",
                        onclick : function() {
                            if (acebugsLeftHidden.getWidth() > 50) {
                                apf.tween.single(acebugsLeftHidden.$ext, {
                                    type: "width",
                                    from: 66,
                                    to  : 0,
                                    anim : apf.tween.linear,
                                    steps : 5
                                });

                                apf.tween.single(acebugsContainer.$ext, {
                                    type: "width",
                                    from: 95,
                                    to  : 29,
                                    anim : apf.tween.linear,
                                    steps : 5
                                });
                            }
                            else {
                                apf.tween.single(acebugsLeftHidden.$ext, {
                                    type: "width",
                                    from: 0,
                                    to  : 66,
                                    anim : apf.tween.linear,
                                    steps : 5
                                });
                                apf.tween.single(acebugsContainer.$ext, {
                                    type: "width",
                                    from: 29,
                                    to  : 95,
                                    anim : apf.tween.linear,
                                    steps : 5
                                });
                            }
                        }
                    })
                ]
            }), 20
        );

        ext.initExtension(this);
    },

    updateAnnotations : function() {
        var ce = editors.currentEditor;
        if (!ce || typeof mdlAceAnnotations === "undefined")
            return;

        this.ceEditor = ce.ceEditor;
        var editorSession = this.ceEditor.getSession();
        this.annotationWorker.postMessage(editorSession.getAnnotations());
    },

    goToAnnotation : function() {
        line_num = dgAceAnnotations.selected.getAttribute("line");
        this.ceEditor.$editor.gotoLine(line_num);
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });
    },

    disable: function() {
        this.nodes.each(function(item) {
            item.disable();
        });
    },

    destroy: function() {
        this.nodes.each(function(item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});