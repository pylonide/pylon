define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var dom = require('ace/lib/dom');
var Anchor = require('ace/anchor').Anchor;

var JavaScriptMode = require('ace/mode/javascript').Mode;

module.exports = {
    anchors : [],
    
    removeMarkers: function(session) {
        var markers = session.getMarkers(false);
        for(var id in markers) {
            if(markers[id].clazz === 'language_highlight') {
                session.removeMarker(id);
            }
        }
        for (var i = 0; i < this.anchors.length; i++) {
            this.anchors[i].detach();
        }
        this.anchors = [];
    },
    
    markers: function(event, editor) {
        var annos = event.data;
        var session = editor.session;
        var anchors = this.anchors;
        
        this.removeMarkers(editor.session);
        var newAnnos = [];

        annos.forEach(function(anno) { 
            var anchor = new Anchor(session.getDocument(), anno.pos.sl, anno.pos.sc);
            anchors.push(anchor);
            var markerId;
            var colDiff = anno.pos.ec - anno.pos.sc;
            var rowDiff = anno.pos.el - anno.pos.sl;
            var gutterAnno = {
                guttertext: anno.message,
                type: anno.type,
                text: anno.message
                // row will be filled in updateFloat()
            };
            function updateFloat(single) {
                if(markerId)
                    session.removeMarker(markerId);
                if(!anno.pos.sc && !anno.pos.ec) {
                    return;
                }
                var range = Range.fromPoints(anchor.getPosition(), {
                    row: anchor.row + rowDiff,
                    column: anchor.column + colDiff
                });
                gutterAnno.row = anchor.row;

                var text = session.getTextRange(range);
                var spaces = '';
                for (var i = 0; i < text.length; i++) {
                    spaces += '&nbsp;';
                }
                markerId = session.addMarker(range, "language_highlight", function(stringBuilder, range, left, top, viewport) {
                    var style = anno.style;
                    if(!style && anno.type === 'error') {
                        style = 'border-bottom: solid 1px red;';
                    } else if(!style) {
                        style = 'border-bottom: solid 1px #C9B534;';
                    }
                    stringBuilder.push(
                        "<span class='language_highlight' style='" + style,
                        " left:", left, "px;",
                        "top:", top, "px;",
                        "height:", viewport.lineHeight, "px;",
                        "'>", spaces, "</span>"
                    );
                });
                if(single)
                    session.setAnnotations(newAnnos);
            }
            updateFloat();
            anchor.on("change", function() { updateFloat(true); });
            if(anno.type === 'note' || anno.type === 'error' || anno.type === 'warning')
                newAnnos.push(gutterAnno);
        });
        session.setAnnotations(newAnnos);
    },
    
    hideHint: function() {
        barLanguageHint.setAttribute('visible', false);
    },
    
    showHint: function(hint) {
        barLanguageHint.setAttribute('visible', true);
        txtLanguageHint.$ext.innerHTML = hint;
        var style = dom.computedStyle(editors.currentEditor.ceEditor.$ext);
        var containerHeight = parseInt(style.height, 10);
        var containerWidth = parseInt(style.width, 10);
        
        var barHeight = 35;

        apf.popup.setContent("languageAnnotationTooltip", barLanguageHint.$ext);
        apf.popup.show("languageAnnotationTooltip", {
            x: 20,
            y: containerHeight - barHeight + 1,
            ref: editors.currentEditor.ceEditor.$ext,
            callback : function() {
                barLanguageHint.setHeight(barHeight);
                barLanguageHint.setWidth(containerWidth-40);
                sbLanguageHint.$resize();
            }
        });
    }
};

// Monkeypatching ACE's JS mode to disable worker
JavaScriptMode.prototype.createWorker = function() {
    return null;
};

});