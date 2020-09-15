/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

//#ifdef __WITH_DATABINDING

/*
 * @todo docs
 */
ppc.BindingQuicksandRule = function(struct, tagName){
    this.$init(tagName, ppc.NODE_HIDDEN, struct);
};

(function(){
    function getFilteredNodes(pNode) {
        pNode = pNode || this.$parent;
        var attr, tmp,
            res      = [],
            dataIDs  = [],
            xmlNodes = pNode.$getDataNode("quicksand", pNode.xmlRoot, false, null, true),
            domNodes = pNode.$ext.childNodes,
            i        = 0,
            l        = xmlNodes.length;
        if (!domNodes.length || !l)
            return res;

        for (; i < l; ++i)
            dataIDs.push(xmlNodes[i].getAttribute("a_id"));

        for (i = 0, l = domNodes.length; i < l; ++i) {
            if (!domNodes[i] || !(attr = domNodes[i].getAttribute("id")))
                continue;
            tmp = attr.split("|");
            tmp.pop();
            if (dataIDs.indexOf(tmp.join("|")) > -1)
                res.push(domNodes[i]);
        }

        return res;
    }

    function nodeInFilter(node, filtered) {
        var i = 0,
            l = filtered.length,
            s = node.getAttribute("id");
        for (; i < l; ++i) {
            if (filtered[i].getAttribute("id") == s)
                return filtered[i];
        }
        return null;
    }

    function quicksand(parent, customOptions) {
        parent = this.$parent.$ext;

        var i, l, dest, src, offset,
            _self            = this,
            coll             = getFilteredNodes.call(this), // destination (target) collection
            //sourceHeight = ppc.getStyle(parent, "height"), // used to keep height and document flow during the animation
            parentOffset     = ppc.getAbsolutePosition(parent), // offset of visible container, used in animation calculations
            offsets          = [], // coordinates of every source collection item
            callbackFunction = typeof(arguments[1]) == "function"
                ? arguments[1]
                : typeof arguments[2] == "function" ? arguments[2] : ppc.K,
            // Gets called when any animation is finished
            //var postCallbackPerformed = 0; // prevents the function from being called more than one time
            postCallback     = function() {
                _self.dispatchEvent("afterquicksand");
                callbackFunction.call(_self);
                /*if (!postCallbackPerformed) {
                    parent.innerHTML = $dest.innerHTML; // put target HTML into visible source container
                    $("[data-quicksand-owner=" + cssPath(parent) + "]").remove(); // remove all temporary containers
                    if (typeof callbackFunction == "function")
                        callbackFunction.call(this);
                    postCallbackPerformed = 1;
                }*/
            },
            options = {
                steps: 60,
                anim: ppc.tween.easeInOutQuad,
                onfinish: postCallback,
                // put false if you don't want the plugin to adjust height of container to fit all the items
                adjustHeight: true
            };
        ppc.extend(options, customOptions);;

        // Replace the collection and quit if IE6
        if (ppc.isIE && ppc.isIE < 7) {
            parent.innerHTML = "";
            for (i = 0, l = coll.length; i < l; i++)
                parent.appendChild(coll[i]);
            return;
        }

        var $source = parent.childNodes; // source collection items

        // Position: relative situations
        var correctionOffset = [0, 0];
        /*var $correctionParent = parent.offsetParent();
        var correctionOffset = ppc.getAbsolutePosition($correctionParent);
        if (ppc.getStyle($correctionParent, "position") == "relative") {
            if ($correctionParent.get(0).nodeName.toLowerCase() == "body") {

            }
            else {
                correctionOffset[0] += parseFloat($correctionParent.css("border-top-width"));
                correctionOffset[1] += parseFloat($correctionParent.css("border-left-width"));
            }
        } else {
            correctionOffset[0] -= parseFloat($correctionParent.css("border-top-width"));
            correctionOffset[1] -= parseFloat($correctionParent.css("border-left-width"));
            correctionOffset[0] -= parseFloat($correctionParent.css("margin-top"));
            correctionOffset[1] -= parseFloat($correctionParent.css("margin-left"));
        }*/


        // keeps nodes after source container, holding their position
        parent.style.height = parent.offsetHeight + "px";

        // stops previous animations on source container
        ppc.tween.clearQueue(parent, true);//$(this).stop();

        // get positions of source collections
        for (i = 0, l = $source.length; i < l; ++i) {
            src = $source[i];
            offsets[i] = ppc.getAbsolutePosition(src, parent, false);
        }
        for (i = 0, l = $source.length; i < l; ++i) {
            src = $source[i];
            // This doesn"t move any element at all, just sets position to absolute
            // and adjusts top & left to make them compatible with position: absolute
            with (src.style) {
                position = "absolute";
                margin   = "0";
                top      = (offsets[i][1] - parentOffset[1]) + "px";// - parseFloat(ppc.getStyle(src, "margin-top"))  + "px";
                left     = (offsets[i][0] - parentOffset[0]) + "px";// - parseFloat(ppc.getStyle(src, "margin-left")) + "px";
            }
        }

        // create temporary container with destination collection
        var $dest = parent.cloneNode(false);
        $dest.setAttribute("id", "");
        //$dest.setAttribute("data-quicksand-owner", parent.selector);
        //$dest.style.height = "auto";
        //$dest.style.width  = parent.offsetWidth + "px";

        for (i = 0, l = coll.length; i < l; ++i) {
            $dest.appendChild(coll[i].cloneNode(true));
            coll[i].$offset = ppc.getAbsolutePosition(coll[i]);
        }
        // insert node into HTML
        // Note that the node is under visible source container in the exactly same position
        // The browser render all the items without showing them (opacity: 0.0)
        // No offset calculations are needed, the browser just extracts position from underlayered destination items
        // and sets animation to destination positions.
        parent.parentNode.insertBefore($dest, parent);
        //$dest.setAttribute("data-quicksand-owner", cssPath(parent));
        with ($dest.style) {
            zIndex   = 1;
            opacity  = 0;
            margin   = 0;
            position = "absolute";
            top      = parentOffset[1] - correctionOffset[1] + "px";
            left     = parentOffset[0] - correctionOffset[0] + "px";
        }

        // If destination container has different height than source container
        // the height can be animated, adjusting it to destination height
        if (false) {//options.adjustHeight) {
            ppc.tween.single(parent, {
                steps: options.steps,
                anim : options.anim,
                type : "height",
                from : parent.offsetHeight,
                to   : $dest.offsetHeight
            });//parent.animate({height: $dest.height()}, options.duration, options.easing);
        }

        // Now it's time to do shuffling animation
        // First of all, we need to identify same elements within source and destination collections
        var insets = [];
        for (i = 0, l = $source.length; i < l; ++i) {
            src = $source[i];
            //var destElement = coll.filter("[" + options.attribute + "=" + src.getAttribute(options.attribute) + "]");
            if (dest = nodeInFilter(src, coll)) {//destElement.length) {
                // The item is both in source and destination collections
                // If it's under different position, let's move it
                offset = insets.shift() || offsets[i];
                options.tweens = [{
                    type: "top",
                    from: dest.$offset[1] - parentOffset[1],
                    to  : offset[1] - parentOffset[1]
                }, {
                    type: "left",
                    from: dest.$offset[0] - parentOffset[0],
                    to  : offset[0] - parentOffset[0]
                }, {
                    type: "opacity",
                    from: ppc.getStyle(src, "opacity"),
                    to  : 1
                }];
                if (ppc.supportCSSAnim) {
                    options.tweens.push({
                        type: "transform",
                        subType: "scale",
                        from: 0,
                        to: 1.0
                    });
                }
                ppc.tween.multi(src, options);
            }
            else {
                // The item from source collection is not present in destination collections
                // Let's remove it
                options.tweens = [{
                    type: "opacity",
                    from: ppc.getStyle(src, "opacity"),
                    to  : 0
                }];
                if (ppc.supportCSSAnim) {
                    options.tweens.push({
                        type: "transform",
                        subType: "scale",
                        from: 1.0,
                        to: 0
                    });
                }
                insets.push(offsets[i]);
                ppc.tween.multi(src, options);
            }
        }

        for (i = 0, l = coll.length; i < l; ++i) {
            var item = coll[i];
            // Grab all items from target collection not present in visible source collection
            if (!nodeInFilter(item, $source)) {
                // No such element in source collection...
                dest = nodeInFilter(item, coll);
                
                options.tweens = [{
                    type: "opacity",
                    from: 0,
                    to  : 1
                }];
                if (!ppc.isIE) {
                    // @todo add scaleTo animation (CSS3) to 0.0
                }
                
                // Let's create it
                offset = ppc.getAbsolutePosition(dest);
                dest   = dest.cloneNode(true);

                with (dest.style) {
                    position  = "absolute";
                    margin    = "0";
                    top       = (offset[1] - parentOffset[1]) + "px";
                    left      = (offset[0] - parentOffset[0]) + "px";
                    opacity   = "0";
                    transform = "scale(.0)";
                }
                parent.appendChild(dest);
                ppc.tween.multi(dest, options);
            }
        }
    }

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //Find parent that this rule works on
        var pNode = this;
        while (pNode && pNode.$bindingRule)
            pNode = pNode.parentNode;
        this.$parent = pNode;

        if (!pNode)
            return;

        var _self = this;
        setTimeout(function() {
            quicksand.call(_self);
        });
    });
}).call(ppc.BindingQuicksandRule.prototype = new ppc.BindingRule());

ppc.aml.setElement("quicksand", ppc.BindingQuicksandRule);
// #endif

