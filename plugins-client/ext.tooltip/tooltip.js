/**
 * Adds tooltips to elements
 *
 * @author Ruben Daniels
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function (require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");

module.exports = ext.register("ext/tooltip/tooltip", {
    name: "Tooltip",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    nodes: [],

    init: function () {},

    create : function(options, oHtml){
        var div = document.body.appendChild(document.createElement("div"));
        div.className = "menu-bk downward menu-bkFocus c9-tooltip";
        div.style.width = (options.width || "250px");
        div.style.position = "absolute";
        
        var arrow = div.appendChild(document.createElement("div"));
        arrow.className = "arrow revisionsInfoArrow";
        
        div.addEventListener("mouseover", this.$ttmouseover);
        div.addEventListener("mouseout", this.$ttmouseout);
        
        div.companion = oHtml;
        
        return div;
    },

    add : function(oHtml, options){
        if (oHtml.nodeFunc)
            oHtml = oHtml.$ext;
        
        oHtml.addEventListener("mouseover", this.$mouseover);
        oHtml.addEventListener("mouseout", this.$mouseout);
        oHtml.addEventListener("mousedown", this.$mousedown);
        
        if (options.timeout == undefined)
            options.timeout = 500;
        
        oHtml.$c9tooltipOptions = options;
    },
    
    destroy : function(oHtml){
        var options = oHtml.$c9tooltipOptions;
        var tooltip = options.tooltip;
        
        if (!tooltip)
            return;
            
        this.nodes.remove(tooltip);
        tooltip.parentNode.removeChild(tooltip);
        tooltip.htmlNodes.forEach(function(oHtml){
            oHtml.removeEventListener("mouseover", this.$mouseover);
            oHtml.removeEventListener("mouseout", this.$mouseout);
            oHtml.removeEventListener("mousedown", this.$mousedown);
        }, this);
    },
    
    $ttmouseover : function(){
        var oHtml = this.companion;
        var options = oHtml.$c9tooltipOptions;
        
        clearTimeout(options.timer);
        if (options.control)
            options.control.stop();
        
        apf.setOpacity(this, 1);
    },
    
    $ttmouseout : function(){
        var tooltip = require("ext/tooltip/tooltip");
        tooltip.$mouseout.call(this.companion);
    },
    
    $mouseover : function(e){
        var tooltip = require("ext/tooltip/tooltip");
        var options = this.$c9tooltipOptions;
        
        clearTimeout(options.timer);
        if (options.tooltip)
            clearTimeout(options.tooltip.timer);
        
        var _self = this;
        options.timer = setTimeout(function(){
            if (options.control)
                options.control.stop();
            
            if (!options.tooltip)
                options.tooltip = tooltip.create(options, _self);

            options.tooltip.style.display = "block";
            
            var pos;
            if (options.getPosition)
                pos = options.getPosition();
            else {
                var p = apf.getAbsolutePosition(_self);
                pos = [(p[0] - ((options.tooltip.offsetWidth - _self.offsetWidth)/2)),
                       (p[1])];
            }
            options.tooltip.style.left = pos[0] + "px";
            options.tooltip.style.top = pos[1] + "px";
            
            options.tooltip.innerHTML = options.message;
            
            if (options.animate !== false) {
                apf.tween.single(options.tooltip, 
                    {type: "fade", from: 0, to : 1, steps: 10, interval: 0, 
                     control: options.control = {}});
            }
        }, options.timeout);
    },
    
    $mouseout : function(e){
        var tooltip = require("ext/tooltip/tooltip");
        var options = this.$c9tooltipOptions;
        
        clearTimeout(options.timer);
        
        if (!options.tooltip || options.tooltip.style.display != "block")
            return;
            
        var _self = this;
        options.timer = options.tooltip.timer = setTimeout(function(){
            if (options.control)
                options.control.stop();

            if (options.animate !== false) {
                apf.tween.single(options.tooltip, {
                     type: "fade", from: 1, to : 0, steps: 10, interval: 0,
                     control: options.control = {}, 
                     onfinish: function(){ options.tooltip.style.display = "none";}
                });
            }
            else {
                options.tooltip.style.display = "none";
            }
        }, 200);
    },
    
    $mousedown : function(e){
        var tooltip = require("ext/tooltip/tooltip");
        var options = this.$c9tooltipOptions;
        
        clearTimeout(options.timer);
        if (options.tooltip) {
            if (options.control)
                options.control.stop();
            
            options.tooltip.style.display = "none";
        }
    },

    enable: function () {
        this.nodes.each(function(item) {
            item.enable();
        });
    },

    disable: function () {
        this.nodes.each(function(item) {
            item.disable();
        });
    },

    destroy: function () {
        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
