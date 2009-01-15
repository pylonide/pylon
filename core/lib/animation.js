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

// #ifdef __WITH_TWEEN

/**
 * The animation library that is used for the animations inside elements
 * @default_private
 */
jpf.tween = {
    //Animation Modules
    left: function(oHtml, value){
        oHtml.style.left = value + "px";
    },
    right: function(oHtml, value){
        oHtml.style.left  = "";
        oHtml.style.right = value + "px";
    },
    top: function(oHtml, value){
        oHtml.style.top = value + "px";
    },
    bottom: function(oHtml, value){
        oHtml.style.top    = "";
        oHtml.style.bottom = value + "px";
    },
    width: function(oHtml, value, center){
        oHtml.style.width = value + "px";
    },
    height: function(oHtml, value, center){
        oHtml.style.height = value + "px";
    },
    scrollTop: function(oHtml, value, center){
        oHtml.scrollTop = value;
    },
    "height-rsz": function(oHtml, value, center){
        oHtml.style.height = value + "px";
        if (jpf.hasSingleResizeEvent)
            window.onresize();
    },
    mwidth: function(oHtml, value, info) {
        var diff = jpf.getDiff(oHtml);
        oHtml.style.width = value + "px";
        oHtml.style.marginLeft = -1*(value/2 + (parseInt(jpf.getStyle(oHtml, "borderLeftWidth")) || diff[0]/2) +
            (info.margin || 0)) + "px";
    },
    mheight: function(oHtml, value, info) {
        var diff = jpf.getDiff(oHtml);
        oHtml.style.height = value + "px";
        oHtml.style.marginTop = (-1*value/2 - (parseInt(jpf.getStyle(oHtml, "borderTopWidth")) || diff[1]/2) +
            (info.margin || 0)) + "px";
    },
    scrollwidth: function(oHtml, value){
        oHtml.style.width = value + "px";
        oHtml.scrollLeft  = oHtml.scrollWidth;
    },
    scrollheight_old: function(oHtml, value){
        try {
            oHtml.style.height = value + "px";
            oHtml.scrollTop    = oHtml.scrollHeight;
        } catch (e) {
            alert(value)
        }
    },
    scrollheight: function(oHtml, value, info){
        var diff = jpf.getHeightDiff(oHtml);
        oHtml.style.height = value + "px";
        var oInt = info.oInt || oHtml;
        oInt.scrollTop     = oInt.scrollHeight - oInt.offsetHeight - diff;
    },
    scrolltop: function(oHtml, value){
        oHtml.style.height = value + "px";
        oHtml.style.top    = (-1 * value - 2) + "px";
        oHtml.scrollTop    = 0;//oHtml.scrollHeight - oHtml.offsetHeight;
    },
    clipright: function(oHtml, value, center){
        oHtml.style.clip       = "rect(auto, auto, auto, " + value + "px)";
        oHtml.style.marginLeft = (-1 * value) + "px";
    },
    fade: function(oHtml, value){
        if (jpf.hasStyleFilters)
            oHtml.style.filter  = "alpha(opacity=" + parseInt(value * 100) + ")";
        //else if(false && jpf.isGecko) oHtml.style.MozOpacity = value-0.000001;
        else
            oHtml.style.opacity = value;
    },
    bgcolor: function(oHtml, value){
        oHtml.style.backgroundColor = value;
    },
    textcolor: function(oHtml, value){
        oHtml.style.color = value;
    },
    htmlcss : function(oHtml, value, obj){
        if (jpf.hasStyleFilters && obj.type == "filter")
            oHtml.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + value + ")";
        else
            oHtml.style[obj.type] = value + (obj.needsPx ? "px" : "");
    },

    /** Linear tweening method */
    NORMAL: 0,
    /** Ease-in tweening method */
    EASEIN: 1,
    /** Ease-out tweening method */
    EASEOUT: 2,

    queue : {},

    current: null,

    setQueue : function(oHtml, stepFunction){
        if(!oHtml.getAttribute("id"))
            jpf.setUniqueHtmlId(oHtml);

        if(!this.queue[oHtml.getAttribute("id")])
            this.queue[oHtml.getAttribute("id")] = [];

        this.queue[oHtml.getAttribute("id")].push(stepFunction);

        if(this.queue[oHtml.getAttribute("id")].length == 1)
            stepFunction(0);
    },

    nextQueue : function(oHtml){
        var q = this.queue[oHtml.getAttribute("id")];
        if(!q) return;

        q.shift(); //Remove current step function

        if(q.length)
            q[0](0);
    },

    clearQueue : function(oHtml, bStop){
        var q = this.queue[oHtml.getAttribute("id")];
        if(!q) return;

        if (bStop && this.current && this.current.control)
            this.current.control.stop = true;
        q.length = 0;
    },

    /**
     * Calculates all the steps of an animation between a
     * begin and end value based on 3 tween strategies
     */
    $calcSteps : function(animtype, fromValue, toValue, nrOfSteps){
        var i, value;
        var steps     = [fromValue]; //Compile steps
        var step      = 0;
        var scalex    = (toValue - fromValue) / ((Math.pow(nrOfSteps, 2)
            + 2 * nrOfSteps + 1) / (4 * nrOfSteps));

        for (i = 0; i < nrOfSteps; i++) {
            if (!animtype && !value)
                value = (toValue - fromValue) / nrOfSteps;
            else if (animtype == 1)
                value = scalex * Math.pow(((nrOfSteps - i)) / nrOfSteps, 3);
            else if (animtype == 2)
                value = scalex * Math.pow(i / nrOfSteps, 3);

            steps.push(steps[steps.length - 1]
                + value);// - (i == 0 ? 1 : 0));//Math.max(0, )
        }
        steps[steps.length - 1] = toValue;// - 1;//Math.max(1, );

        return steps;
    },

    /**
     * Calculates all the steps of an animation between a
     * begin and end value for colors
     */
    $calcColorSteps : function(animtype, fromValue, toValue, nrOfSteps){
        var beginEnd = [fromValue, toValue];
        for (var i = 0; i < 2; i++) {
            if(beginEnd[i].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)){
                beginEnd[i] = [parseInt(RegExp.$1), parseInt(RegExp.$2), parseInt(RegExp.$3)];
                continue;
            }

            beginEnd[i] = beginEnd[i].replace(/^#/, "");
            if(beginEnd[i].length == 3) beginEnd[i] += beginEnd[i];

            beginEnd[i] = [
                Math.hexToDec(beginEnd[i].substr(0,2)),
                Math.hexToDec(beginEnd[i].substr(2,2)),
                Math.hexToDec(beginEnd[i].substr(4,2))
            ];
        }

        var stepParts = [
            jpf.tween.$calcSteps(animtype, beginEnd[0][0], beginEnd[1][0], nrOfSteps),
            jpf.tween.$calcSteps(animtype, beginEnd[0][1], beginEnd[1][1], nrOfSteps),
            jpf.tween.$calcSteps(animtype, beginEnd[0][2], beginEnd[1][2], nrOfSteps)
        ];

        for (var steps = [], i = 0; i < stepParts[0].length; i++) {
            steps.push("#" + Math.decToHex(stepParts[0][i])
                           + Math.decToHex(stepParts[1][i])
                           + Math.decToHex(stepParts[2][i]));
        }

        return steps;
    },

    /**
     * Tweens a single property of a single element or html element from a
     * start to an end value.
     * Example:
     * <code>
     * jpf.tween.single(myDiv, {
     *     type : "left",
     *     from : 10,
     *     to   : 100,
     *     anim : jpf.tween.EASEIN
     * });
     * </code>
     * Example:
     * Multiple animations can be run after eachother
     * by calling this function multiple times.
     * <code>
     *  jpf.tween.single(myDiv, options).single(myDiv2, options2);
     * </code>
     * @param {Element}  oHtml the object to animate.
     * @param {Object}   info  the animation settings.
     *   Properties:
     *   {String}   type        the property to be animated. These are predefined property handlers and can be added by adding a method to jpf.tween with the name of the property modifier. Default there are several handlers available.
     *      Possible values:
     *      left            Sets the left position
     *      right           Sets the right position
     *      top             Sets the top position
     *      bottom          Sets the bottom position
     *      width           Sets the horizontal size
     *      height          Sets the vertical size
     *      scrollTop       Sets the scoll position
     *      mwidth          Sets the width and the margin-left to width/2
     *      mheight         Sets the height ant the margin-top to height/2
     *      scrollwidth     Sets the width an sets the scroll to the maximum size
     *      scrollheight    Sets the height an sets the scroll to the maximum size
     *      scrolltop       Sets the height and the top as the negative height value
     *      fade            Sets the opacity property
     *      bgcolor         Sets the background color
     *      textcolor       Sets the text color
     *   {Number, String} from  the start value of the animation
     *   {Number, String} to    the end value of the animation
     *   {Number}   [steps]     the number of steps to divide the tween in
     *   {Number}   [interval]  the time between each step
     *   {Number}   [anim]      the distribution of change between the step over the entire animation
     *   {Boolean}  [color]     whether the specified values are colors
     *   {Mixed}    [userdata]  any data you would like to have available in your callback methods
     *   {Function} [onfinish]  a function that is called at the end of the animation
     *   {Function} [oneach]    a function that is called at each step of the animation
     *   {Object}   [control]   an object that can stop the animation at any point
     *     Properties:
     *     {Boolean} stop       whether the animation should stop.
     */
    single : function(oHtml, info){
        info = jpf.extend({steps: 3, interval: 20, anim: jpf.tween.NORMAL, control: {}}, info);

        if (oHtml.nodeFunc > 100) {
            info.oInt = oHtml.oInt;
            oHtml = oHtml.oExt;
        }

        if ("fixed|absolute|relative".indexOf(jpf.getStyle(oHtml, "position")) == -1)
            oHtml.style.position = "relative";

        info.method = jpf.tween[info.type];

        //#ifdef __DEBUG
        if(!info.method)
            throw new Error(jpf.formatErrorString(0, this,
                "Single Value Tween",
                "Could not find method for tweening operation '"
                + info.type + "'"));
        //#endif

        var steps = info.color
            ? jpf.tween.$calcColorSteps(info.anim, info.from, info.to, info.steps)
            : jpf.tween.$calcSteps(info.anim, parseFloat(info.from), parseFloat(info.to), info.steps);

        var _self = this;
        var stepFunction = function(step){
            _self.current = info;
            if (info.control && info.control.stop) {
                info.control.stop = false;
                jpf.tween.clearQueue(oHtml);
                return;
            }

            //try {
               info.method(oHtml, steps[step], info);
            //} catch (e) {}

            if (info.oneach)
                info.oneach(oHtml, info.userdata);

            if (step < info.steps)
                timer = setTimeout(function(){stepFunction(step + 1)}, info.interval);
            else {
                _self.current = null;
                if (info.control)
                    info.control.stopped = true;
                if (info.onfinish)
                    info.onfinish(oHtml, info.userdata);

                jpf.tween.nextQueue(oHtml);
            }
        };

        this.setQueue(oHtml, stepFunction);

        return this;
    },

    /**
     * Tweens multiple properties of a single element or html element from a
     * start to an end value.
     * Example:
     * Animating both the left and width at the same time.
     * <code>
     *  jpf.tween.multi(myDiv, {
     *      anim   : jpf.tween.EASEIN
     *      tweens : [{
     *          type : "left",
     *          from : 10,
     *          to   : 100,
     *      },
     *      {
     *          type : "width",
     *          from : 100,
     *          to   : 400,
     *      }]
     *  });
     * </code>
     * Example:
     * Multiple animations can be run after eachother
     * by calling this function multiple times.
     * <code>
     *  jpf.tween.multi(myDiv, options).multi(myDiv2, options2);
     * </code>
     * @param {Element}  oHtml the object to animate.
     * @param {Object} info the settings of the animation.
     *   Properties:
     *   {Number}   [steps]     the number of steps to divide the tween in
     *   {Number}   [interval]  the time between each step
     *   {Number}   [anim]      the distribution of change between the step over the entire animation
     *   {Function} [onfinish]  a function that is called at the end of the animation
     *   {Function} [oneach]    a function that is called at each step of the animation
     *   {Object}   [control]   an object that can stop the animation at any point
     *     Properties:
     *     {Boolean} stop       whether the animation should stop.
     *   {Array}    [tweens]    a collection of simple objects specifying the single value animations that are to be executed simultaneously. (for the properties of these single tweens see the single tween method).
     */
    multi : function(oHtml, info){
        info = jpf.extend({steps: 3, interval: 20, anim: jpf.tween.NORMAL, control: {}}, info);

        if (oHtml.nodeFunc > 100) {
            info.oInt = oHtml.oInt;
            oHtml = oHtml.oExt;
        }

        for (var steps = [], i = 0; i < info.tweens.length; i++) {
            var data = info.tweens[i];

            data.method = jpf.tween[data.type] || jpf.tween.htmlcss;

            //#ifdef __DEBUG
            if (!data.method)
                throw new Error(jpf.formatErrorString(0, this,
                    "Multi Value Tween",
                    "Could not find method for tweening operation '"
                    + data.type + "'"));
            //#endif

            steps.push(data.color
                ? jpf.tween.$calcColorSteps(info.anim, data.from, data.to, info.steps)
                : jpf.tween.$calcSteps(info.anim, parseFloat(data.from), parseFloat(data.to), info.steps));
        }

        var tweens = info.tweens;
        var _self  = this;
        var stepFunction = function(step){
            _self.current = info;
            if (info.control && info.control.stop) {
                info.control.stop = false;
                return;
            }

            try {
                for (var i = 0; i < steps.length; i++) {
                    tweens[i].method(oHtml, steps[i][step], tweens[i]);
                }
            } catch (e) {}

            if (info.oneach)
                info.oneach(oHtml, info.userdata);

            if (step < info.steps)
                timer = setTimeout(function(){stepFunction(step + 1)}, info.interval);
            else {
                _self.current = null;
                if (info.control)
                    info.control.stopped = true;
                if (info.onfinish)
                    info.onfinish(oHtml, info.userdata);

                jpf.tween.nextQueue(oHtml);
            }
        };

        this.setQueue(oHtml, stepFunction);

        return this;
    },

    /**
     * Tweens an element or html element from it's current state to a css class.
     * Example:
     * Multiple animations can be run after eachother by calling this function
     * multiple times.
     * <code>
     *  jpf.tween.css(myDiv, 'class1').multi(myDiv2, 'class2');
     * </code>
     * @param {Element}  oHtml the object to animate.
     * @param {String} className the classname that defines the css properties to be set or removed.
     * @param {Object} info the settings of the animation.
     *   Properties:
     *   {Number}   [steps]     the number of steps to divide the tween in
     *   {Number}   [interval]  the time between each step
     *   {Number}   [anim]      the distribution of change between the step over the entire animation
     *   {Function} [onfinish]  a function that is called at the end of the animation
     *   {Function} [oneach]    a function that is called at each step of the animation
     *   {Object}   [control]   an object that can stop the animation at any point
     *     Properties:
     *     {Boolean} stop       whether the animation should stop.
     * @param {Boolean} remove whether the class is set or removed from the element or html element
     */
    css : function(oHtml, className, info, remove){
        (info = info || {}).tweens = [];

        if (oHtml.nodeFunc > 100)
            oHtml = oHtml.oExt;

        if(remove)
            jpf.setStyleClass(oHtml, "", [className]);

        var callback = info.onfinish;
        info.onfinish = function(){
            if(remove)
                jpf.setStyleClass(oHtml, "", [className]);
            else
                jpf.setStyleClass(oHtml, className);

            //Reset CSS values
            for(var i=0;i<info.tweens.length;i++){
                if (info.tweens[i].type == "filter")
                    continue;

                oHtml.style[info.tweens[i].type] = "";
            }

            if (callback)
                callback.apply(this, arguments);
        }

        var result, newvalue, curvalue, j, isColor, style, rules, i;
        for(i = 0; i < document.styleSheets.length; i++){
            rules = document.styleSheets[i][jpf.styleSheetRules];
            for (j = 0; j < rules.length; j++) {
                var rule = rules[j];

                if (!rule.style || !rule.selectorText.match('\.' + className + '$'))
                    continue;

                for(style in rule.style){
                    if(!rule.style[style] || this.cssProps.indexOf("|" + style + "|") == -1)
                        continue;

                    if (style == "filter") {
                        if (!rule.style[style].match(/opacity\=([\d\.]+)/))
                            continue;
                        newvalue = RegExp.$1;

                        result   = (jpf.getStyleRecur(oHtml, style) || "")
                            .match(/opacity\=([\d\.]+)/);
                        curvalue = result ? RegExp.$1 : 100;
                        isColor  = false;

                        if (newvalue == curvalue) {
                            if (remove) curvalue = 100;
                            else newvalue = 100;
                        }
                    }
                    else {
                        newvalue = remove && oHtml.style[style] || rule.style[style];
                        if (remove) oHtml.style[style] = "";
                        curvalue = jpf.getStyleRecur(oHtml, style);
                        isColor = style.match(/color/i) ? true : false;
                    }

                    info.tweens.push({
                        type    : style,
                        from    : (isColor ? String : parseFloat)(remove
                                    ? newvalue
                                    : curvalue),
                        to      : (isColor ? String : parseFloat)(remove
                                    ? curvalue
                                    : newvalue),
                        color   : isColor,
                        needsPx : jpf.tween.needsPix[style.toLowerCase()] || false
                    });
                }
            }
        }

        if(remove)
            jpf.setStyleClass(oHtml, className);

        return this.multi(oHtml, info);
    },

    needsPix : {
        "left"       : true,
        "top"        : true,
        "bottom"     : true,
        "right"      : true,
        "fontSize"   : true,
        "lineHeight" : true,
        "textIndent" : true
    },

    cssProps : "|backgroundColor|backgroundPosition|color|width|filter|\
                |height|left|top|bottom|right|fontSize|\
                |letterSpacing|lineHeight|textIndent|opacity|\
                |paddingLeft|paddingTop|paddingRight|paddingBottom|\
                |borderLeftWidth|borderTopWidth|borderRightWidth|borderBottomWidth|\
                |borderLeftColor|borderTopColor|borderRightColor|borderBottomColor|\
                |marginLeft|marginTop|marginRight|marginBottom|"
};

// #endif
