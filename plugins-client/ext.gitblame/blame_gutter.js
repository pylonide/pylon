/**
 * Git Blame extension for the Cloud9 IDE client
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
"use strict";

var dom = require("ace/lib/dom");
var event = require("ace/lib/event");

dom.importCssString("\
.ace_resizer_v {\
    top: 0px;\
    width: 2px;\
    z-index: 10;\
    height: 100%;\
    cursor: w-resize;\
    position: absolute;\
    border-right: 1px solid black;\
}\
.ace_resizer_v:hover {\
    border-right-color: darkblue;\
}\
.ace_closeButton {\
    top: -5px;\
    left: -3px;\
    width: 11px;\
    height: 11px;\
    cursor: pointer;\
    position: absolute;\
    border-radius: 11px;\
    background: rgba(255, 0, 194, 0.33);\
}\
.ace_closeButton:hover {\
    background: rgba(255, 0, 194, 0.5);\
}\
.ace_blame-gutter-layer {\
    position: absolute !important;\
    text-align: left !important;\
    top: 0;\
    z-index: 5;\
    pointer-events: auto;\
}\
.ace_blame-cell{\
    border-top: solid 1px;\
    word-wrap: break-word;\
    white-space: pre-wrap;\
    box-sizing: border-box;\
    -moz-box-sizing: border-box;\
    overflow: hidden !important;\
    padding: 0 8px;\
}\
.ace_blame-cell.selected{\
    background: rgba(255, 237, 0, 0.31);\
}\
.ace_tooltip{\
    position:fixed;\
    background: #F8F7AC;\
    border: solid 1px rgba(205, 237, 0, 0.81);\
    border-radius:5px;\
    z-index: 1000000;\
    max-width: 500px;\
    white-space: pre-wrap;\
}\
", "blameGutter");

var BlameGutter = function(editor, blameData) {
    if (editor.blameGutter)
        return;

    var gutter = editor.renderer.$gutterLayer;
    editor.blameGutter = this;
    gutter.blameColumn = this;

    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_blame-gutter-layer";
    var parentEl = editor.renderer.$gutter;
    parentEl.appendChild(this.element);

    this.resizer = dom.createElement("div");
    this.resizer.className = "ace_resizer_v";
    parentEl.appendChild(this.resizer);

    this.closeButton = dom.createElement("div");
    this.closeButton.className = "ace_closeButton";
    this.resizer.appendChild(this.closeButton);

    editor.tooltip = dom.createElement("div");
    editor.tooltip.className = "ace_tooltip";
    editor.tooltip.style.display = "none";
    editor.container.appendChild(editor.tooltip);

    this.onMousedown = this.onMousedown.bind(this);
    this.onChangeSession = this.onChangeSession.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMouseout = this.onMouseout.bind(this);

    this.editor = editor;
    if (blameData)
        this.setData(blameData);
    else
        this.removeData(blameData);
};

(function(){
    this.update = function(config) {
        this.$config = config;

        var blameEl = this.blameColumn.element;
        blameEl.style.marginTop = -config.offset + "px";

        var html = [];
        var i = config.firstRow;
        var lastRow = config.lastRow;
        var fold = this.session.getNextFoldLine(i);
        var foldStart = fold ? fold.start.row : Infinity;
        var foldWidgets = this.$showFoldWidgets && this.session.foldWidgets;
        var lineHeight = config.lineHeight;

        var blameData = this.blameData;
        var selectedText = this.selectedText;
        var blameHtml = [];
        var $blameIndex, lastBlameCellIndex = 0;
        var blameCell;

        findBlameCell(i);
        if (blameCell)
            addBlameCell(blameCell.text, blameCell.title);
        else
            addBlameCell("", "");

        // adjust top margin of first cell to always keep it on screen
        if (!blameData[i + 1]) {
            blameHtml[$blameIndex] -= config.offset - 1;
            blameHtml.splice($blameIndex + 1, 0, "px;margin-top:", config.offset - 1);
        }


        while (true) {
            if(i > foldStart) {
                i = fold.end.row + 1;
                fold = this.session.getNextFoldLine(i, fold);
                if (fold) {
                    foldStart = fold.start.row;
                    lastBlameCellIndex = fold.end.row;
                } else {
                    foldStart = Infinity;
                }
            }
            if(i > lastRow)
                break;

            html.push("<div class='ace_gutter-cell",
                "' style='height:", lineHeight, "px;'>", (i+1));

            if (foldWidgets) {
                var c = foldWidgets[i];
                // check if cached value is invalidated and we need to recompute
                if (c == null)
                    c = foldWidgets[i] = this.session.getFoldWidget(i);
                if (c)
                    html.push(
                        "<span class='ace_fold-widget ace_", c,
                        c == "start" && i == foldStart && i < fold.end.row ? " ace_closed" : " ace_open",
                        "' style='height:", lineHeight, "px",
                        "'></span>"
                    );
            }

            var wrappedRowLength = this.session.getRowLength(i) - 1;
            while (wrappedRowLength--) {
                html.push("</div><div class='ace_gutter-cell' style='height:", lineHeight, "px'>\xA6");
            }
            html.push("</div>");

            i++;

            // html for blame column
            findBlameCell(i);
            if (blameCell)
                addBlameCell(blameCell.text, blameCell.title);
            else
                blameHtml[$blameIndex] += this.session.getRowLength(i-1) * lineHeight;
        }

        this.element = dom.setInnerHtml(this.element, html.join(""));
        this.blameColumn.element = dom.setInnerHtml(blameEl, blameHtml.join(""));
        this.element.style.height = config.minHeight + "px";

        var gutterWidth = this.element.parentNode.offsetWidth;
        if (gutterWidth !== this.gutterWidth) {
            this.gutterWidth = gutterWidth;
            this._emit("changeGutterWidth", gutterWidth);
        }

        function addBlameCell(text, title) {
            blameHtml.push(
                "<div class='ace_blame-cell ", text == selectedText ? "selected" : "",
                "' index='", lastBlameCellIndex - 1,"'",
                "style='height:", lineHeight, "px'>",
                text, "  ", title,
                "</div>"
            );
            $blameIndex = blameHtml.length - 6;
        }
        function findBlameCell(i) {
            do {
                blameCell = blameData[i];
            } while (!blameCell && i-- > lastBlameCellIndex);
            lastBlameCellIndex = i + 1;
        }
    };

    this.setData = function(blameData) {
        var gutter = this.editor.renderer.$gutterLayer;
        gutter.blameData = blameData || [];
        gutter.update = this.update;
        this.element.style.display = "";
        this.closeButton.style.display = "";
        this.resizer.style.display = "";
        this.editor.on("guttermousedown", this.onMousedown);
        this.editor.on("changeSession", this.onChangeSession);

        var gutterEl = this.editor.renderer.$gutter;
        event.addListener(gutterEl, "mousemove", this.onMousemove);
        event.addListener(gutterEl, "mouseout", this.onMouseout);

        gutter.element.style.width = "";
        this.resizer.style.right = "40px";
        this.element.style.width = "260px";
        this.element.parentNode.style.width = "300px";

        gutter.update(this.editor.renderer.layerConfig);
    };

    this.removeData = function() {
        var gutter = this.editor.renderer.$gutterLayer;
        delete gutter.update;

        this.editor.removeListener("guttermousedown", this.onMousedown);
        this.editor.removeListener("changeSession", this.onChangeSession);
        var gutterEl = this.editor.renderer.$gutter;
        event.removeListener(gutterEl, "mousemove", this.onMousemove);
        event.removeListener(gutterEl, "mouseout", this.onMouseout);

        this.element.style.display = "none";
        this.closeButton.style.display = "none";
        this.resizer.style.display = "none";

        this.element.parentNode.style.width = "";
        gutter.update(this.editor.renderer.layerConfig);
    };

    this.onMousedown = function(e) {
        var target = e.domEvent.target;

        if (target == this.closeButton) {
            this.removeData();
            return e.stop();
        }

        if (target == this.resizer) {
            var rect = this.editor.blameGutter.element.getBoundingClientRect();
            var mouseHandler = this.editor.$mouseHandler;
            mouseHandler.resizeBlameGutter = function() {
                var gutterWidth = this.x + 40 - rect.left;
                this.editor.renderer.$gutter.style.width = gutterWidth + "px";
                this.editor.blameGutter.element.style.width = gutterWidth - 40 + "px";
                this.editor.renderer.$gutterLayer._emit("changeGutterWidth", gutterWidth);
            };
            mouseHandler.captureMouse(e, "resizeBlameGutter");
            return e.stop();
        }

        if (dom.hasCssClass(target, "ace_blame-cell")) {
            var gutter = this.editor.renderer.$gutterLayer;
            var index = parseInt(target.getAttribute("index"));

            var blameCell = gutter.blameData[index];
            if (!blameCell)
                return e.stop();
            gutter.selectedText = blameCell.text;
            var ch = target.parentNode.children;
            for (var i = ch.length; i--; ) {
                var isSelected = ch[i].innerHTML.indexOf(gutter.selectedText) == 0;
                ch[i].className = "ace_blame-cell" + (isSelected ? " selected" : "");
            }
            return e.stop();
        }
    };

    this.onChangeSession = function() {
        this.removeData();
    };

    this.onMousemove = function(e) {
        var target = e.target;
        var container = e.currentTarget;
        var tooltip = this.editor.tooltip;
        if (this.$highlightedCell != target) {
            if (dom.hasCssClass(target, "ace_blame-cell")) {
                tooltip.style.display = "block";
                this.$highlightedCell = target;
                tooltip.textContent = target.textContent;
            }
        }

        if (this.$highlightedCell) {
            tooltip.style.top = e.clientY + 10 + "px";
            tooltip.style.left = e.clientX + 10 + "px";
        } else {
            this.onMouseout();
            return
        }
    };
    this.onMouseout = function(e) {
        this.editor.tooltip.style.display = "none";
        this.$highlightedCell = null
    };
}).call(BlameGutter.prototype);


exports.BlameGutter = BlameGutter;

});
