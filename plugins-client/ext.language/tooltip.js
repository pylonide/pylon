define(function(require, exports, module) {

var dom = require("ace/lib/dom");
var code = require("ext/code/code");

var tooltipEl = dom.createElement("div");
tooltipEl.className = "language_tooltip";

module.exports = {
    show: function(row, column, html) {
        var editor = code.amlEditor.$editor;
        if(!this.isVisible) {
            this.isVisible = true;
            
            editor.renderer.scroller.appendChild(tooltipEl);
            //editor.selection.on("changeCursor", this.hide);
            editor.session.on("changeScrollTop", this.hide);
            editor.session.on("changeScrollLeft", this.hide);
        }
        tooltipEl.innerHTML = html;
        setTimeout(function() {
            var offset = editor.renderer.scroller.getBoundingClientRect();
            var position = editor.renderer.textToScreenCoordinates(row, column);
            var cursorConfig = editor.renderer.$cursorLayer.config;
            var labelWidth = dom.getInnerWidth(tooltipEl);
            var labelHeight = dom.getInnerHeight(tooltipEl);
            position.pageX -= offset.left;
            position.pageY -= offset.top;
            var onTop = true;
            if(onTop && position.pageY < labelHeight)
                onTop = false;
            else if(!onTop && position.pageY > labelHeight - cursorConfig.lineHeight - 20)
                onTop = true;
            var shiftLeft = Math.round(labelWidth / 2) - 3;
            tooltipEl.style.left = Math.max(position.pageX - shiftLeft, 0) + "px";
            if(onTop)
                tooltipEl.style.top = (position.pageY - labelHeight + 3) + "px";
            else
                tooltipEl.style.top = (position.pageY + cursorConfig.lineHeight + 2) + "px";
        });
    },
    
    hide: function() {
        var tooltip = module.exports;
        if(tooltip.isVisible) {
            var editor = code.amlEditor.$editor;
            editor.renderer.scroller.removeChild(tooltipEl);
            //editor.selection.removeListener("changeCursor", this.hide);
            editor.session.removeListener("changeScrollTop", this.hide);
            editor.session.removeListener("changeScrollLeft", this.hide);
            tooltip.isVisible = false;
        }
    }
};

});
