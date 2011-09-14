/**
 * Ace Bugs extension for Cloud9. Displays a window in the dock panel
 * showing warnings and errors retrieved from Ace
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext     = require("core/ext");
var ide     = require("core/ide");
var dock    = require("ext/dockpanel/dockpanel");
var editors = require("ext/editors/editors");
var markup  = require("text!ext/acebugs/acebugs.xml");

module.exports = ext.register("ext/acebugs/acebugs", {
    name: "Ace Bugs",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,
    markup: markup,

    nodes: [],

    init: function(amlNode) {
        var currEditor = editors.currentEditor;
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
        this.lastAnnotations = "";
        this.annotationWorker.onmessage = function(e) {
            if (e.data.outXml == _self.lastAnnotations)
                return;

            if (e.data.errors > 0)
                dock.increaseNotificationCount("aceAnnotations", e.data.errors);
            mdlAceAnnotations.load(apf.getXml(e.data.outXml.replace(/&/g, "&amp;")));
        };

        this.annotationWorker.onerror = function(e) {

        };

        ide.addEventListener("afteropenfile", function(e) {
            _self.updateAnnotations();
        });

        tabEditors.addEventListener("afterswitch", function(e){
            var ce = editors.currentEditor;
            if (ce) {
                _self.editorSession = ce.ceEditor.getSession();
                _self.editorSession.on("changeAnnotation", function(e) {
                    _self.updateAnnotations();
                });

                _self.updateAnnotations();
            }
        });

        this.section = dock.getSection(this.name, {
            width  : 260,
            height : 360
        });

        dock.registerPage(this.section, null, function() {
            ext.initExtension(_self);
            return aceAnnotations;
        }, {
            ident   : "aceAnnotations",
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -6, y: -391 },
                activeState: { x: -6, y: -391 }
            }
        });

        ext.initExtension(this);
    },

    updateAnnotations : function() {
        var ce = editors.currentEditor;
        if (!ce || typeof mdlAceAnnotations === "undefined")
            return;

        this.ceEditor = ce.ceEditor;
        var editorSession = this.ceEditor.getSession();
        dock.resetNotificationCount("aceAnnotations");
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