/*global aceAnnotations mdlAceAnnotations dgAceAnnotations */
/**
 * Ace Bugs extension for Cloud9. Displays a window in the dock panel
 * showing warnings and errors retrieved from Ace
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var dock = require("ext/dockpanel/dockpanel");
var editors = require("ext/editors/editors");
var markup = require("text!ext/acebugs/acebugs.xml");

module.exports = ext.register("ext/acebugs/acebugs", {
    name: "Bug Panel",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,
    markup: markup,
    nodes: [],
    _name: "ext/acebugs/acebugs",

    lastAnnotations: null,

    _getDockButton: function() {
        return dock.getButtons(this._name)[0].cache;
    },

    _getEditor: function(callback) {
        var editor = editors.currentEditor && editors.currentEditor.amlEditor;
        if (editor)
            callback.call(this, editor);
    },

    _updateSession: function() {
        this._getEditor(function(editor) {
            this.editorSession = editor.getSession();

            var _self = this;
            this.editorSession.on("changeAnnotation", function(e) {
                _self.updateAnnotations();
            });
        });
    },

    init: function(amlNode) {
        this._updateSession();
    },

    hook: function() {
        ide.addEventListener("afteropenfile", this.updateAnnotations.bind(this));
        ide.addEventListener("tab.afterswitch", this._updateSession.bind(this));

        dock.addDockable({
            expanded : -1,
            width : 300,
            "min-width" : 300,
            barNum: 1,
            sections : [{
                width : 260,
                height: 300,
                buttons : [{
                    caption: "Bugs",
                    ext : [this._name, "aceAnnotations"],
                    hidden : true
                }]
            }]
        });

        dock.register(this._name, "aceAnnotations", {
            menu : "Bug Panel",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/acebugs/images/main_icon.png",
                defaultState: { x: -6, y: 0 },
                activeState:  { x: -6, y: -40 }
            }
        }, function() {
            return aceAnnotations;
        });

        ext.initExtension(this);
    },

    process: function(annotations) {
        var annotationsString = JSON.stringify(annotations);
        if (annotations !== null && (annotationsString === this.lastAnnotations))
            return;

        this.lastAnnotations = annotationsString;

        var aceerrors = 0;
        var outXml = "";

        for (var key in annotations) {
            annotations[key].forEach(function(a) {
                if (a.type === "error") {
                    aceerrors += 1;
                }

                outXml += '<annotation line="' + (a.row + 1) +
                        '" text="' + a.text +
                        '" type="' + a.type + '" />';
            });
        }

        outXml = "<annotations>" + outXml + "</annotations>";

        dock.updateNotificationElement(this._getDockButton(), aceerrors);

        mdlAceAnnotations.load(apf.getXml(outXml.replace(/&/g, "&amp;")));
    },

    updateAnnotations : function() {
        if (aceAnnotations.visible === false)
            return;

        this._getEditor(function(editor) {
            if (typeof mdlAceAnnotations === "undefined")
                return;

            this.amlEditor = editor;
            dock.resetNotificationCount("aceAnnotations");

            setTimeout(function(self) {
                self.process.call(self, editor.getSession().getAnnotations());
            }, 0, this);
        });
    },

    goToAnnotation : function() {
        this.amlEditor.$editor.gotoLine(
            dgAceAnnotations.selected.getAttribute("line"));
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