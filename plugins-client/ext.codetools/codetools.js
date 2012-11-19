/**
 * Code Tools Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/codetools/codetools", {
    dev    : "Ajax.org",
    name   : "Code Tools",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    init: function () {},

    register: function(plugin) {
        var _self = this;
        ide.addEventListener("init.ext/code/code", function attachCE() {
            var code = require("ext/code/code");
            if (!code.amlEditor.$codeToolsAttached)
                _self.attachEditorEvents(code.amlEditor);
        });
    },

    attachEditorEvents: function(amlEditor) {
        if (amlEditor.$codeToolsAttached)
            return;
        amlEditor.$codeToolsAttached = true;

        var editor = amlEditor.$editor;
        var prevRow, prevCol, multiClickTimer, cursorTimer;

        editor.addEventListener("mousemove", function(e) {
            var pos = e.getDocumentPosition();
            var row = pos.row;
            var col = pos.column;
            var doc = editor.session.doc;
            var evObj = {
                amlEditor: amlEditor,
                editor: editor,
                target: e.domEvent.target || e.domEvent.srcElement,
                pos: pos,
                doc: doc
            };

            if (prevRow !== row) {
                prevRow = row;
                prevCol = col;
                ide.dispatchEvent("codetools.rowchange", evObj);
                // a row change is also considered a column change.
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
            else if (prevCol !== col) {
                prevCol = col;
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
        });

        editor.addEventListener("click", function(e) {
            clearTimeout(multiClickTimer);
            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;

            multiClickTimer = setTimeout(function() {
                multiClickTimer = null;
                ide.dispatchEvent("codetools.codeclick", {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: pos,
                    doc: doc
                });
            }, 100);
        });

        editor.addEventListener("dblclick", function(e) {
            clearTimeout(multiClickTimer);
            multiClickTimer = null;

            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;

            ide.dispatchEvent("codetools.codedblclick", {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            });
        });

        function cursorChange(e) {
            clearTimeout(cursorTimer);
            cursorTimer = setTimeout(function() {
                var lead = editor.session.selection.getSelectionLead();
                var anchor = editor.session.selection.getSelectionAnchor();

                var eventObj = {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: {
                        start: lead,
                        end: anchor
                    },
                    doc: editor.session.doc
                };

                ide.dispatchEvent("codetools.cursorchange", eventObj);
                if (e.type == "changeSelection")
                    ide.dispatchEvent("codetools.selectionchange", eventObj);
            });
        }

        function sessionChange(e) {
            if (!e.oldsession)
                e.oldsession = e.session;

            e.oldsession.removeEventListener("changeCursor", cursorChange);
            e.oldsession.removeEventListener("changeSelection", cursorChange);
            e.session.selection.addEventListener("changeCursor", cursorChange);
            e.session.selection.addEventListener("changeSelection", cursorChange);
        }

        editor.addEventListener("changeSession", sessionChange);
        sessionChange({
            session: editor.session
        });
    }
});

});