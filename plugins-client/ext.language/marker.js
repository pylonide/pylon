/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var Range = require("ace/range").Range;
var Anchor = require('ace/anchor').Anchor;
var tooltip = require('ext/language/tooltip');
var Editors = require("ext/editors/editors");
var Code = require("ext/code/code");

module.exports = {

    disabledMarkerTypes: {},

    hook: function(ext, worker) {
        var _self = this;
        this.ext = ext;
        worker.on("markers", function(event) {
            if(ext.disabled) return;
            _self.addMarkers(event, ext.editor);
        });
        worker.on("hint", function(event) {
            _self.onHint(event);
        });
    },

    onHint: function(event) {
        var message = event.data.message;
        var pos = event.data.pos;
        var cursorPos = Code.amlEditor.$editor.getCursorPosition();
        var displayPos = event.data.displayPos || cursorPos;
        if(cursorPos.column === pos.column && cursorPos.row === pos.row && message)
            tooltip.show(displayPos.row, displayPos.column, message);
        else
            tooltip.hide();
    },
    
    hideToolTip: function() {
        tooltip.hide();
    },

    removeMarkers: function(session) {
        var markers = session.getMarkers(false);
        for (var id in markers) {
            // All language analysis' markers are prefixed with language_highlight
            if (markers[id].clazz.indexOf('language_highlight_') === 0) {
                session.removeMarker(id);
            }
        }
        for (var i = 0; i < session.markerAnchors.length; i++) {
            session.markerAnchors[i].detach();
        }
        session.markerAnchors = [];
    },

    addMarkers: function(event, editor) {
        var _self = this;
        var annos = event.data;
        if(!editor)
            return;
        
        var mySession = editor.session;
        if (!mySession.markerAnchors) mySession.markerAnchors = [];
        this.removeMarkers(editor.session);
        mySession.languageAnnos = [];
        annos.forEach(function(anno) {
            // Certain annotations can temporarily be disabled
            if (_self.disabledMarkerTypes[anno.type])
                return;
            // Multi-line markers are not supported, and typically are a result from a bad error recover, ignore
            if(anno.pos.el && anno.pos.sl !== anno.pos.el)
                return;
            // Using anchors here, to automaticaly move markers as text around the marker is updated
            var anchor = new Anchor(mySession.getDocument(), anno.pos.sl, anno.pos.sc || 0);
            mySession.markerAnchors.push(anchor);
            var markerId;
            var colDiff = anno.pos.ec - anno.pos.sc;
            var rowDiff = anno.pos.el - anno.pos.sl;
            var gutterAnno = {
                guttertext: anno.message,
                type: anno.level || "warning",
                text: anno.message,
                pos: anno.pos,
                resolutions: anno.resolutions
                // row will be filled in updateFloat()
            };

            function updateFloat(single) {
                if (markerId)
                    mySession.removeMarker(markerId);
                gutterAnno.row = anchor.row;
                if (anno.pos.sc !== undefined && anno.pos.ec !== undefined) {
                    var range = Range.fromPoints(anchor.getPosition(), {
                        row: anchor.row + rowDiff,
                        column: anchor.column + colDiff
                    });
                    markerId = mySession.addMarker(range, "language_highlight_" + (anno.type ? anno.type : "default"));
                }
                if (single) mySession.setAnnotations(mySession.languageAnnos);
            }
            updateFloat();
            anchor.on("change", function() {
                updateFloat(true);
            });
            if (anno.message) mySession.languageAnnos.push(gutterAnno);
        });
        mySession.setAnnotations(mySession.languageAnnos);
    },

    /**
     * Temporarily disable certain types of markers (e.g. when refactoring)
     */
    disableMarkerType: function(type) {
        this.disabledMarkerTypes[type] = true;
        var session = Editors.currentEditor.amlEditor.$editor.session;
        var markers = session.getMarkers(false);
        for (var id in markers) {
            // All language analysis' markers are prefixed with language_highlight
            if (markers[id].clazz === 'language_highlight_' + type)
                session.removeMarker(id);
        }
    },

    enableMarkerType: function(type) {
        this.disabledMarkerTypes[type] = false;
    },

    /**
     * Called when text in editor is updated
     * This attempts to predict how the worker is going to adapt markers based on the given edit
     * it does so instanteously, rather than with a 500ms delay, thereby avoid ugly box bouncing etc.
     */
    onChange: function(session, event) {
        if(this.ext.disabled) return;
        var range = event.data.range;
        var isInserting = event.data.action.substring(0, 6) !== "remove";
        var text = event.data.text;
        var adaptingId = text && text.search(/[^a-zA-Z0-9\$_]/) === -1;
        if (!isInserting) { // Removing some text
            var markers = session.getMarkers(false);
            // Run through markers
            var foundOne = false;
            for (var id in markers) {
                var marker = markers[id];
                if (marker.clazz.indexOf('language_highlight_') === 0) {
                    if (range.contains(marker.range.start.row, marker.range.start.column)) {
                        session.removeMarker(id);
                        foundOne = true;
                    }
                    else if (adaptingId && marker.range.contains(range.start.row, range.start.column)) {
                        foundOne = true;
                        var deltaLength = text.length;
                        marker.range.end.column -= deltaLength;
                    }
                }
            }
            if (!foundOne) {
                // Didn't find any markers, therefore there will not be any anchors or annotations either
                return;
            }
            // Run through anchors
            for (var i = 0; i < session.markerAnchors.length; i++) {
                var anchor = session.markerAnchors[i];
                if (range.contains(anchor.row, anchor.column)) {
                    anchor.detach();
                }
            }
            // Run through annotations
            for (var i = 0; i < session.languageAnnos.length; i++) {
                var anno = session.languageAnnos[i];
                if (range.contains(anno.row, 1)) {
                    session.languageAnnos.splice(i, 1);
                    i--;
                }
            }
            session.setAnnotations(session.languageAnnos);
        }
        else { // Inserting some text
            var markers = session.getMarkers(false);
            // Only if inserting an identifier
            if (!adaptingId) return;
            // Run through markers
            var foundOne = false;
            for (var id in markers) {
                var marker = markers[id];
                if (marker.clazz.indexOf('language_highlight_') === 0) {
                    if (marker.range.contains(range.start.row, range.start.column)) {
                        foundOne = true;
                        var deltaLength = text.length;
                        marker.range.end.column += deltaLength;
                    }
                }
            }
        }
        if (foundOne)
            session._dispatchEvent("changeBackMarker");
    },
    
    destroy : function(){
    }
};

});