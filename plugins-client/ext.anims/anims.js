/**
 * Animations for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("ext/anims/firmin-all-min");

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");

module.exports = ext.register("ext/anims/anims", {
    name    : "Animations",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,

    animateMultiple : function(tweens, finish) {
        var shouldAnimate = apf.isTrue(settings.model.queryValue("general/@animateui"));

        if (shouldAnimate) {
            var duration = 0;
            tweens.forEach(function(options) {
                var node = options.node;
                Firmin.animate(node.$ext || node, options, options.duration || 0.2, function() {
                    (node.$ext || node).style[apf.CSSPREFIX + "TransitionDuration"] = "";
                    //apf.layout.forceResize();
                });
                duration = Math.max(duration, options.duration || 0.2);
            });

            setTimeout(function(){
                finish && finish();
            }, (duration * 1000) + 50);
        }
        else {
            //@todo set value

            finish && finish();
        }
    },

    animate : function(aNode, options, finish){
        var shouldAnimate = apf.isTrue(settings.model.queryValue("general/@animateui"));

        if (shouldAnimate) {
            Firmin.animate(aNode.$ext || aNode, options, options && options.duration || 0.2, function() {
                (aNode.$ext || aNode).style[apf.CSSPREFIX + "TransitionDuration"] = "";
                finish && finish(); //setTimeout(finish, 30);
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
        var firstChild = pNode.getFirstChild();
        var lastChild = pNode.getSecondChild();
        var isFirst, oNode = (isFirst = aNode == firstChild) ? lastChild : firstChild;
        if (oNode == aNode || !oNode.visible)
            throw new Error("animating object that has no partner");

        var to2;
        if (pNode.$vbox) {
            to2 = { timingFunction : options.timingFunction };
            if (isFirst)
                to2.top = (parseInt(options.height, 10) + pNode.$edge[0] + pNode.padding) + "px";
            else
                to2.bottom = (parseInt(options.height, 10) + pNode.$edge[2] + pNode.padding) + "px";
        }
        else {
            to2 = { timingFunction : options.timingFunction };
            if (isFirst)
                to2.left = (parseInt(options.width, 10) + pNode.$edge[3] + pNode.padding) + "px";
            else
                to2.right = (parseInt(options.width, 10) + pNode.$edge[1] + pNode.padding) + "px";
        }

        if (shouldAnimate && !options.immediate) {
            ide.dispatchEvent("animate", {
                type: "splitbox",
                which: aNode,
                other: oNode,
                options: options,
                options2: to2
            });

            Firmin.animate(aNode.$ext, options, options.duration || 0.2, function() {
                aNode.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
            });
            Firmin.animate(oNode.$ext, to2, options.duration || 0.2, function() {
                oNode.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";

                if (aNode.parentNode) {
                    if (pNode.$vbox)
                        aNode.setHeight(parseInt(options.height, 10));
                    else
                        aNode.setWidth(parseInt(options.width, 10));
                }

                finish && finish(); //setTimeout(finish, 30);
            });
        }
        else {
            if (pNode.$vbox) {
                aNode.setHeight(options.height);
                var dir = isFirst ? "top" : "bottom";
            }
            else {
                aNode.setWidth(options.width);
                var dir = isFirst ? "left" : "right";
            }
            oNode.$ext.style[dir] = to2[dir];

            finish && finish();
        }
    }
});

});
