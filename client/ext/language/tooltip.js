define(function(require, exports, module) {

var dom = require("ace/lib/dom");

var tooltipEl = dom.createElement("div");
tooltipEl.className = "language_tooltip";

module.exports = {
    show: function(html) {
        if(!this.isVisible) {
            var editor = ceEditor.$editor;
            editor.renderer.scroller.appendChild(tooltipEl);
            editor.selection.on("changeCursor", this.hide);
            tooltipEl.innerHTML = html;
            this.isVisible = true;
            var cursorLayer = editor.renderer.$cursorLayer;
            var cursorConfig = cursorLayer.config;
            var cursorPixelPos = cursorLayer.pixelPos;
            var onTop = true;
            var labelWidth = dom.getInnerWidth(tooltipEl);
            var labelHeight = dom.getInnerHeight(tooltipEl);
            if(onTop && cursorPixelPos.top < labelHeight)
                onTop = false;
            else if(!onTop && cursorPixelPos.top > labelHeight - cursorConfig.lineHeight - 20)
                onTop = true;
            var shiftLeft = Math.round(labelWidth / 2) - 3;
            tooltipEl.style.left = Math.max(cursorPixelPos.left - shiftLeft, 0) + "px";
            if(onTop)
                tooltipEl.style.top = (cursorPixelPos.top - labelHeight + 3) + "px";
            else
                tooltipEl.style.top = (cursorPixelPos.top + cursorConfig.lineHeight + 2) + "px";
        }
    },
    
    hide: function() {
        if(this.isVisible) {
            var editor = ceEditor.$editor;
            editor.renderer.scroller.removeChild(tooltipEl);
            editor.selection.removeEventListener("changeCursor", this.updatePosition);
            this.isVisible = false;
        }
    }
};

});
