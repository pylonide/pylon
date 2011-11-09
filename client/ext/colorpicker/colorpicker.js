/**
 * Code Tools Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

var Code = require("ext/code/code");
var Range = require("ace/range").Range;
var UndoManager = require("ace/undomanager").UndoManager;

var Colors = {};
var colorsRe = /(#([0-9A-Fa-f]{3,6})\b)|(rgba?\(\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*,\s*\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\b\s*(:?\s*,\s*(?:1|0|0?\.[0-9]{1,2})\s*)?\))|(rgba?\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*(:?\s*,\s*(?:1|0|0?\.[0-9]{1,2})\s*)?\))/gi;
var RGBRe = /(?:rgba?\(\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*(:?\s*,\s*(?:1|0|0?\.[0-9]{1,2})\s*)?\))|(rgba?\(\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*,\s*(\d?\d%|100%)+\s*(:?\s*,\s*(?:1|0|0?\.[0-9]{1,2})\s*)?\))/;
var css = require("text!ext/colorpicker/colorpicker.css");
var markup = require("text!ext/colorpicker/colorpicker.xml");
var skin = require("text!ext/colorpicker/skin.xml");

function createColorRange(row, line, color) {
    var col = line.indexOf(color);
    return Range.fromPoints({
        row: row,
        column: col
    }, {
        row: row,
        column: col + color.length
    });
}

module.exports = ext.register("ext/colorpicker/colorpicker", {
    dev    : "Ajax.org",
    name   : "Colorpicker Code Tool",
    alone  : true,
    type   : ext.GENERAL,
    skin   : skin,

    nodes : [],
    
    init: function(amlNode) {
        apf.document.body.insertMarkup(markup);
        cp = this.colorpicker = clrCodeTools;
        var _self = this;
        this.colorpicker.addEventListener("prop.hex", function(e) {
            _self.onColorPicked(e.oldvalue, e.value);
        });
        this.colorpicker.addEventListener("prop.visible", function(e) {
            // when the the colorpicker hides, hide all tooltip markers
            if (!e.value) {
                var a = _self.$activeColor;
                if (a) {
                    apf.removeEventListener("keydown", a.listeners.onKeyDown);
                    a.editor.removeEventListener("mousewheel", a.listeners.onScroll);
                    delete _self.$activeColor;
                    _self.hideColorTooltips(a.editor);
                }
            }
        });
    },
    
    hook: function() {
        apf.importCssString(css || "");

        function detectColors(pos, line) {
            var colors = line.match(colorsRe);
            if (!colors || !colors.length)
                return [];
            var start, end;
            var col = pos.column;
            for (var i = 0, l = colors.length; i < l; ++i) {
                start = line.indexOf(colors[i]);
                end = start + colors[i].length;
                if (col >= start && col <= end)
                    return [colors, colors[i]];
            }
            return [colors];
        }
        
        var _self = this;
        
        ide.addEventListener("codetools.rowchange", function(e) {
            var doc = e.doc;
            var pos = e.pos;
            var editor = e.editor;
            
            var line = doc.getLine(1);
            if (!(e.amlEditor.syntax == "css" || e.amlEditor.syntax == "svg" || (line && line.indexOf("<a:skin") > -1)))
                return;

            line = doc.getLine(pos.row);
            var colors = detectColors(pos, line);
            if (colors[0] && colors[0].length)
                _self.showColorTooltip(pos, editor, line, colors[0]);
            else
                _self.hideColorTooltips(editor);
        });
        
        ide.addEventListener("codetools.codeclick", function(e) {
            var doc = e.doc;
            var pos = e.pos;
            var editor = e.editor;

            var line = doc.getLine(1);
            if (!(e.amlEditor.syntax == "css" || e.amlEditor.syntax == "svg" || (line && line.indexOf("<a:skin") > -1)))
                return;
            //do not show anything when a selection is made...
            var range = editor.selection.getRange();
            if (range.start.row !== range.end.row || range.start.column !== range.end.column)
                return;

            var line = doc.getLine(pos.row);
            var colors = detectColors(pos, line);
            if (colors[1]) {
                _self.toggleColorPicker(pos, editor, line, colors[1]);
            }
            else if (_self.colorpicker && _self.colorpicker.visible) {
                _self.colorpicker.hide();
            }
        });
    },
    
    showColorTooltip: function(pos, editor, line, colors, markerId) {
        if (this.colorpicker && this.colorpicker.visible && !markerId)
            return;

        var markers = [];
        colors.forEach(function(color) {
            var id = markerId || color + pos.row;
            var marker = Colors[id];
            // the tooltip DOM node is stored in the third element of the selection array
            if (!marker) {
                var range = createColorRange(pos.row, line, color);
                var marker = editor.session.addMarker(range, "codetools_colorpicker", function(stringBuilder, range, left, top, viewport) {
                    stringBuilder.push(
                        "<span class='codetools_colorpicker' style='",
                        "left:", left - 3, "px;",
                        "top:", top - 1, "px;",
                        "height:", viewport.lineHeight, "px;",
                        "' onclick='require(\'ext/codetools/codetools\').toggleColorPicker({row:",
                        pos.row, ",column:", pos.column, ",color:\'", color, "\'});'", (markerId ? " id='" + markerId + "'" : ""), ">", color, "</span>"
                    );
                }, true);
                Colors[id] = [range, marker];
            }
            markers.push(marker);
        });
        
        this.hideColorTooltips(editor, markers);
    },
    
    hideColorTooltips: function(editor, exceptions) {
        if (this.$activeColor)
            return;
        if (!exceptions && this.colorpicker && this.colorpicker.visible)
            this.colorpicker.hide();
        if (exceptions && !apf.isArray(exceptions))
            exceptions = [exceptions];
        var marker;
        for (var mid in Colors) {
            marker = Colors[mid][1];
            if (exceptions && exceptions.indexOf(marker) > -1)
                continue;
            editor.session.removeMarker(marker);
            delete Colors[mid];
        }
    },
    
    toggleColorPicker: function(pos, editor, line, color) {
        ext.initExtension(this);
        var cp = this.colorpicker;
        
        var type = "hex";
        var orig = color;// = color.replace("#", "");
        var rgb = color.match(RGBRe);
        if (rgb && rgb.length >= 3) {
            rgb = {
                r: rgb[1], 
                g: rgb[2], 
                b: rgb[3]
            };
            color = apf.color.RGBToHex(rgb);
            type = "rgb";
        }
        else
            color = "#" + apf.color.fixHex(color.replace("#", ""));
        
        if (cp.visible && color == this.$activeColor.color && pos.row == this.$activeColor.row)
            return cp.hide();
        
        // set appropriate event listeners, that will be removed when the colorpicker
        // hides.
        var onKeyDown, onScroll, _self = this;
        apf.addEventListener("keydown", onKeyDown = function(e) {
            var a = _self.$activeColor;
            
            if (!cp || !a || !cp.visible) 
                return;
                
            cp.hide();
            // when ESC is pressed, undo all changes made by the colorpicker
            if (e.keyCode === 27) {
                clearTimeout(_self.$colorPickTimer);
                var at = editor.session.$undoManager;
                if (at.undolength > a.start)
                    at.undo(at.undolength - a.start);
            }
        });
        
        editor.addEventListener("mousewheel", onScroll = function(e) {
            var a = _self.$activeColor;
            
            if (!cp || !a || !cp.visible) 
                return;
                
            cp.hide();
        });

        var id = "colorpicker" + color + pos.row;
        this.hideColorTooltips(editor);
        this.showColorTooltip(pos, editor, line, [orig], id);
        cp.show();
        this.$activeColor = {
            color: color,
            markerNode: id,
            orig: orig,
            current: orig,
            type: type,
            pos: pos,
            marker: Colors[id],
            editor: editor,
            start: editor.session.$undoManager.undolength,
            listeners: {
                onKeyDown: onKeyDown,
                onScroll: onScroll
            }
        };
        cp.setProperty("value", color);
        
        // calculate the x and y (top and left) position of the colorpicker
        var coords = ceEditor.$editor.renderer.textToScreenCoordinates(pos.row, line.indexOf(orig) + orig.length);
        var y = coords.pageY;
        var x = coords.pageX;
        var pOverflow = apf.getOverflowParent(cp.$ext);
        var height = cp.$ext.offsetHeight;
        var width = cp.$ext.offsetWidth;
        var edgeY = (pOverflow == document.documentElement
            ? (apf.isIE 
                ? pOverflow.offsetHeight 
                : (window.innerHeight + window.pageYOffset)) + pOverflow.scrollTop
            : pOverflow.offsetHeight + pOverflow.scrollTop);
        var edgeX = (pOverflow == document.documentElement
            ? (apf.isIE 
                ? pOverflow.offsetWidth
                : (window.innerWidth + window.pageXOffset)) + pOverflow.scrollLeft
            : pOverflow.offsetWidth + pOverflow.scrollLeft);
        
        if (y + height > edgeY) {
            y = edgeY - height;
            if (y < 0)
                y = 0;
        }
        if (x + width > edgeX) {
            x = edgeX - width;
            if (x < 0)
                x = 0;
        }
        cp.$ext.style.top = (y - 15) + "px";
        cp.$ext.style.left = (x + 15) + "px";
    },
    
    onColorPicked: function(old, color) {
        var a = this.$activeColor;
        if (!a)
            return;
        
        clearTimeout(this.$colorPickTimer);

        var doc = a.editor.session.doc;
        var line = doc.getLine(a.pos.row);
        if (typeof a.markerNode == "string") {
            var node = document.getElementById(a.markerNode);
            if (node)
                a.markerNode = node;
            else
                return;
        }
        var newLine, newColor;
        if (a.type == "hex") {
            newColor = "#" + color;
        }
        else if (a.type == "rgb") {
            var m = a.current.match(RGBRe);
            var regex = new RegExp("(rgba?)\\(\\s*" + m[1] + "\\s*,\\s*" + m[2] + "\\s*,\\s*" + m[3] + "(\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)", "i");
            if (!line.match(regex))
                return;
            var RGB = apf.color.hexToRGB(color);
            newLine = line.replace(regex, function(m, prefix, suffix) {
                return (newColor = prefix + "(" + RGB.r + ", " + RGB.g + ", " + RGB.b + (suffix || "") + ")");
            });
        }
        a.color = color;
        
        a.markerNode.innerHTML = newColor;
        
        var _self = this;
        this.$colorPickTimer = setTimeout(function() {
            a.marker[0] = createColorRange(a.pos.row, line, a.current);
            doc.replace(a.marker[0], newColor);
            a.current = newColor;
        }, 200);
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