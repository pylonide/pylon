/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");

module.exports = ext.register("ext/anims/anims", {
    name    : "Animations",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    
    animate : function(aNode, options, finish){
        var shouldAnimate = apf.isTrue(settings.model.queryValue("general/@animateui"));
        
        if (shouldAnimate) {
            Firmin.animate(aNode.$ext, options, options.duration || 0.2, function() {
                aNode.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                //apf.layout.forceResize();
                
                finish && finish();
            });
        }
        else {
            //@todo set value
            
            finish && finish();
        }
    },
    
    animateSplitBoxNode : function(aNode, options, finish){
        var shouldAnimate = apf.isTrue(settings.model.queryValue("general/@animateui"));
        
        var pNode = aNode.parentNode;
        var oNode = aNode == pNode.firstChild ? pNode.lastChild : pNode.firstChild;
        if (oNode == aNode || !oNode.visible)
            throw new Error("animating object that has no partner");
        
        if (shouldAnimate) {
            var to2;
            if (pNode.$vbox)
                to2 = { 
                    top: (parseInt(options.height) + pNode.$edge[0] + pNode.padding) + "px",
                    timingFunction : options.timingFunction
                }
            else
                to2 = { 
                    left: (parseInt(options.width) + pNode.$edge[3] + pNode.padding) + "px",
                    timingFunction : options.timingFunction
                }
            
            Firmin.animate(aNode.$ext, options, options.duration || 0.2, function() {
                aNode.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                //apf.layout.forceResize();
            });
            Firmin.animate(oNode.$ext, to2, options.duration || 0.2, function() {
                oNode.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                //apf.layout.forceResize();
                
                if (pNode.$vbox)
                    aNode.setHeight(options.height);
                else
                    aNode.setWidth(options.width);
                    
                finish && finish();
            });
        }
        else {
            //@todo set value
            
            finish && finish();
        }
    },
    
    init : function(){
        
    },
    
    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
