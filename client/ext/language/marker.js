define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var dom = require('ace/lib/dom');

var JavaScriptMode = require('ace/mode/javascript').Mode;

module.exports = {
    currentMarkerIds: [],
    
    removeMarkers: function(session) {
        var markers = session.getMarkers(false);
        for(var id in markers) {
            if(markers[id].clazz === 'language_highlight') {
                session.removeMarker(id);
            }
        }
    },
    
    markers: function(event, editor) {
        var annos = event.data;
        var session = editor.session;
        
        this.removeMarkers(editor.session);
        var annotations = session.getAnnotations();
        var newAnnos = [];
        for(var p in annotations) {
            var annoArray = annotations[p];
            for (var i = 0; i < annoArray.length; i++) {
                if(!annoArray[i].langAnno) {
                    newAnnos.push(annoArray[i]);
                }
            }
        }

        annos.forEach(function(anno) { 
            if(!anno.pos.sc && !anno.pos.ec) {
                newAnnos.push({
                    row: anno.pos.sl,
                    text: anno.message,
                    type: anno.type,
                    langAnno: true
                });
                return;
            }
            var range = Range.fromPoints({
                row: anno.pos.sl,
                column: anno.pos.sc
            }, {
                row: anno.pos.el,
                column: anno.pos.ec
            });
            var text = session.getTextRange(range);
            var spaces = '';
            for (var i = 0; i < text.length; i++) {
                spaces += '&nbsp;';
            }
            if(anno.type === 'note' || anno.type === 'error' || anno.type === 'warning') {
                newAnnos.push({
                    row: anno.pos.sl,
                    text: anno.message,
                    type: anno.type,
                    langAnno: true
                });
            }
            session.addMarker(range, "language_highlight", function(stringBuilder, range, left, top, viewport) {
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
