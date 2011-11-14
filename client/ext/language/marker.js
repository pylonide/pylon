define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var tree = require('treehugger/tree');
var dom = require('ace/lib/dom');

module.exports = {
    currentMarkerIds: [],
    //currentMarkers: [],
    
    removeMarkers: function(editor) {
        var session = editor.session;
        var markers = session.getMarkers();
        for(var id in markers) {
            if(markers[id].clazz === 'language_highlight') {
                session.removeMarker(id);
            }
        }
        /*for (var i = 0; i < this.currentMarkerIds.length; i++) {
            session.removeMarker(this.currentMarkerIds[i]);
        }
        this.currentMarkerIds = [];*/
    },
    
    markers: function(event, editor) {
        var annos = event.data;
        var session = editor.session;
        var _self = this;
        
        this.removeMarkers(editor);

        annos.forEach(function(anno) { 
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
            //_self.currentMarkerIds.push(
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
});
