define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var dom = require('ace/lib/dom');
var Anchor = require('ace/anchor').Anchor;

var JavaScriptMode = require('ace/mode/javascript').Mode;

module.exports = {
    disableMarkerType: {},
    
    removeMarkers: function(session) {
        var markers = session.getMarkers(false);
        for(var id in markers) {
            if(markers[id].clazz.indexOf('language_highlight_') === 0) {
                session.removeMarker(id);
            }
        }
        for (var i = 0; i < session.markerAnchors.length; i++) {
            session.markerAnchors[i].detach();
        }
        session.markerAnchors = [];
    },
    
    markers: function(event, editor) {
        var _self = this;
        var annos = event.data;
        var mySession = editor.session;
        if(!mySession.markerAnchors)
            mySession.markerAnchors = [];
        
        this.removeMarkers(editor.session);
        mySession.languageAnnos = [];

        annos.forEach(function(anno) { 
            if(_self.disableMarkerType[anno.type]) return;
            var anchor = new Anchor(mySession.getDocument(), anno.pos.sl, anno.pos.sc || 0);
            mySession.markerAnchors.push(anchor);
            var markerId;
            var colDiff = anno.pos.ec - anno.pos.sc;
            var rowDiff = anno.pos.el - anno.pos.sl;
            var gutterAnno = {
                guttertext: anno.message,
                type: anno.type === 'error' ? 'error' : 'warning',
                text: anno.message,
                onclick: anno.onclick,
                ondblclick: anno.ondblclick
                // row will be filled in updateFloat()
            };
            function updateFloat(single) {
                if(markerId)
                    mySession.removeMarker(markerId);
                gutterAnno.row = anchor.row;
                if(anno.pos.sc !== undefined && anno.pos.ec !== undefined) {
                    var range = Range.fromPoints(anchor.getPosition(), {
                        row: anchor.row + rowDiff,
                        column: anchor.column + colDiff
                    });
    
                    markerId = mySession.addMarker(range, "language_highlight_" + (anno.type ? anno.type : "default"));
                }
                if(single)
                    mySession.setAnnotations(mySession.languageAnnos);
            }
            updateFloat();
            anchor.on("change", function() { updateFloat(true); });
            if(anno.message)
                mySession.languageAnnos.push(gutterAnno);
        });
        mySession.setAnnotations(mySession.languageAnnos);
    },
    
    enableMarkerType: function(type) {
        this.disableMarkerType[type] = false;
    },
    
    disableMarkerType: function(type) {
        this.disableMarkerType[type] = true;
    },
    
    hideHint: function() {
        barLanguageHint.setAttribute('visible', false);
    },
    
    showHint: function(hint) {
        // Switched off for now
        txtLanguageHint.$ext.innerHTML = hint;
        return;
        var style = dom.computedStyle(editors.currentEditor.ceEditor.$ext);
        var containerHeight = parseInt(style.height, 10);
        var containerWidth = parseInt(style.width, 10);
        
        var barHeight = 35;

        apf.popup.setContent("languageAnnotationTooltip", barLanguageHint.$ext);
        apf.popup.show("languageAnnotationTooltip", {
            x: 20,
            y: containerHeight - barHeight + 1,
            //y: 0,
            //ref      : cursorLayer.cursor,
            ref: editors.currentEditor.ceEditor.$ext,
            callback : function() {
                console.log("YEAH");
                barLanguageHint.setAttribute('visible', true);
                barLanguageHint.setWidth(containerWidth-40);
                barLanguageHint.setHeight(barHeight);
                sbLanguageHint.$resize();
            }
        });
    },
    
    onChange: function(session, event) {
        var range = event.data.range;
        if(event.data.action.substring(0, 6) === "remove") {
            var markers = session.getMarkers(false);
            // Run through markers
            var foundOne = false;
            for(var id in markers) {
                var marker = markers[id];
                if(marker.clazz.indexOf('language_highlight_') === 0) {
                    if(range.contains(marker.range.start.row, marker.range.start.column)) {
                        session.removeMarker(id);
                        foundOne = true;
                    }
                }
            }
            if(!foundOne) {
                // Didn't find any markers, therefore there will not be any anchors or annotations either
                return;
            }
            // Run through anchors
            for (var i = 0; i < session.markerAnchors.length; i++) {
                var anchor = session.markerAnchors[i];
                if(range.contains(anchor.row, anchor.column)) {
                    anchor.detach();
                }
            }
            // Run through annotations
            for (var i = 0; i < session.languageAnnos.length; i++) {
                var anno = session.languageAnnos[i];
                if(range.contains(anno.row, 1)) {
                    session.languageAnnos.splice(i, 1);
                    i--;
                }
            }
            session.setAnnotations(session.languageAnnos);
        }
    },
    
    ignoreUndeclaredVariable: function(name) {
        console.log("Going to ignore this var: ", name);
        return;
        var settings = require("ext/settings/settings").model.data;
        var node = settings.ownerDocument.createElement("breakpoints");
        var breakpoints = e.currentTarget.data.selectNodes("//breakpoint");
        for (var ix = 0; ix < breakpoints.length; ix++) {
            node.appendChild(cln);
        }
        var bpInSettingsFile = settings.selectSingleNode("//breakpoints");
        if (bpInSettingsFile) {
            bpInSettingsFile.parentNode.removeChild(bpInSettingsFile);
        }
        settings.appendChild(node);
    }
};

// Monkeypatching ACE's JS mode to disable worker
JavaScriptMode.prototype.createWorker = function() {
    return null;
};

});