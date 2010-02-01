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
apf.tween = {
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
    scrollLeft: function(oHtml, value, center){
        oHtml.scrollLeft = value;
    },
    "height-rsz": function(oHtml, value, center){
        oHtml.style.height = value + "px";
        if (apf.hasSingleResizeEvent)
            window.onresize();
    },
    mwidth: function(oHtml, value, info) {
        var diff = apf.getDiff(oHtml);
        oHtml.style.width = value + "px";
        oHtml.style.marginLeft = -1 * (value / 2 + (parseInt(apf.getStyle(oHtml,
            "borderLeftWidth")) || diff[0]/2) + (info.margin || 0)) + "px";
    },
    mheight: function(oHtml, value, info) {
        var diff = apf.getDiff(oHtml);
        oHtml.style.height = value + "px";
        oHtml.style.marginTop = (-1 * value / 2 - (parseInt(apf.getStyle(oHtml,
            "borderTopWidth")) || diff[1]/2) + (info.margin || 0)) + "px";
    },
    scrollwidth: function(oHtml, value){
        oHtml.style.width = value + "px";
        oHtml.scrollLeft  = oHtml.scrollWidth;
    },
    scrollheight_old: function(oHtml, value){
        try {
            oHtml.style.height = value + "px";
            oHtml.scrollTop    = oHtml.scrollHeight;
        }
        catch (e) {
            alert(value)
        }
    },
    scrollheight: function(oHtml, value, info){
        var diff = apf.getHeightDiff(oHtml),
            oInt = info.$int || oHtml;
            
        oHtml.style.height = Math.max((value + (info.diff || 0)), 0) + "px";
        oInt.scrollTop     = oInt.scrollHeight - oInt.offsetHeight - diff + (info.diff || 0);
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
        if (apf.hasStyleFilters)
            oHtml.style.filter  = "alpha(opacity=" + parseInt(value * 100) + ")";
        //else if(false && apf.isGecko) oHtml.style.MozOpacity = value-0.000001;
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
        if (apf.hasStyleFilters && obj.type == "filter")
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

    CSSTIMING: ["linear", "ease-in", "ease-out", "ease", "ease-in-out", "cubic-bezier"],
    CSSPROPS : {
        "left"        : "left",
        "right"       : "right",
        "top"         : "top",
        "bottom"      : "bottom",
        "width"       : "width",
        "height"      : "height",
        "scrollTop"   : false,
        "scrollLeft"  : false,
        "mwidth"      : false,
        "mheight"     : false,
        "scrollwidth" : false,
        "scrollheight": false,
        "fade"        : "opacity",
        "bgcolor"     : "background-color",
        "textcolor"   : "color"
    },

    queue : {},

    current: null,

    setQueue : function(oHtml, stepFunction){
        if (!oHtml.getAttribute("id"))
            apf.setUniqueHtmlId(oHtml);

        if (!this.queue[oHtml.getAttribute("id")])
            this.queue[oHtml.getAttribute("id")] = [];

        this.queue[oHtml.getAttribute("id")].push(stepFunction);

        if (this.queue[oHtml.getAttribute("id")].length == 1)
            stepFunction(0);
    },

    nextQueue : function(oHtml){
        var q = this.queue[oHtml.getAttribute("id")];
        if (!q) return;

        q.shift(); //Remove current step function

        if (q.length)
            q[0](0);
    },

    clearQueue : function(oHtml, bStop){
        var q = this.queue[oHtml.getAttribute("id")];
        if (!q) return;

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
        var c = apf.color.colors,
            a = parseInt((c[fromValue]||fromValue).slice(1),16),
            b = parseInt((c[toValue]||toValue).slice(1),16),
            i = 0,
            __round = Math.round,
            out = [], d1;
            
        for (; i < nrOfSteps; i++){
            d1 = i / (nrOfSteps - 1), d2 = 1-d1;
            out[out.length] = "#" + ("000000"+
                ((__round((a&0xff)*d2+(b&0xff)*d1)&0xff)|
                (__round((a&0xff00)*d2+(b&0xff00)*d1)&0xff00)|
                (__round((a&0xff0000)*d2+(b&0xff0000)*d1)&0xff0000)).toString(16)).slice(-6);
        }
        
        return out;
    },

    /**
     * Tweens a single property of a single element or html element from a
     * start to an end value.
     * Example:
     * <code>
     *  apf.tween.single(myDiv, {
     *      type : "left",
     *      from : 10,
     *      to   : 100,
     *      anim : apf.tween.EASEIN
     *  });
     * </code>
     * Example:
     * Multiple animations can be run after eachother
     * by calling this function multiple times.
     * <code>
     *  apf.tween.single(myDiv, options).single(myDiv2, options2);
     * </code>
     * @param {Element}  oHtml the object to animate.
     * @param {Object}   info  the animation settings.
     *   Properties:
     *   {String}   type        the property to be animated. These are predefined property handlers and can be added by adding a method to apf.tween with the name of the property modifier. Default there are several handlers available.
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
        info = apf.extend({steps: 3, interval: 20, anim: apf.tween.NORMAL, control: {}}, info);

        if (oHtml.nodeFunc > 100) {
            info.$int = oHtml.$int;
            oHtml = oHtml.$ext;
        }

        if ("fixed|absolute|relative".indexOf(apf.getStyle(oHtml, "position")) == -1)
            oHtml.style.position = "relative";

        var useCSSAnim = (apf.supportCSSAnim && apf.tween.CSSPROPS[info.type]);
        info.method = useCSSAnim ? info.type : apf.tween[info.type];

        //#ifdef __DEBUG
        if (!info.method)
            throw new Error(apf.formatErrorString(0, this,
                "Single Value Tween",
                "Could not find method for tweening operation '"
                + info.type + "'"));
        //#endif

        if (useCSSAnim) {
            var type = apf.tween.CSSPROPS[info.type];
            if (type === false)
                return this;
            info.type = type || info.type;
            oHtml.style[info.type] = info.from + (apf.tween.needsPix[info.type] ? "px" : "");
            $setTimeout(function() {
                oHtml.style[info.type]       = info.to + (apf.tween.needsPix[info.type] ? "px" : "");
                oHtml.style.webkitTransition = info.type + " " + ((info.steps
                    * info.interval) / 1000) + "s "
                    + apf.tween.CSSTIMING[info.anim || 0];
                var f = function() {
                    if (info.onfinish)
                        info.onfinish(oHtml, info.userdata);
                    oHtml.style.webkitTransition = "";
                    oHtml.removeEventListener('webkitTransitionEnd', f);
                };
                oHtml.addEventListener('webkitTransitionEnd', f);
            });
            return this;
        }

        var timer,
            steps        = info.color
                ? apf.tween.$calcColorSteps(info.anim, info.from, info.to, info.steps)
                : apf.tween.$calcSteps(info.anim, parseFloat(info.from), parseFloat(info.to), info.steps),
            _self        = this,
            stepFunction = function(step){
                _self.current = info;
                if (info.control && info.control.stop) {
                    info.control.stop = false;

                    apf.tween.clearQueue(oHtml);
                    if (info.onstop)
                        info.onstop(oHtml, info.userdata);
                    return;
                }

                if (info.onbeforeeach
                  && info.onbeforeeach(oHtml, info.userdata) === false)
                    return;

                try {
                   info.method(oHtml, steps[step], info);
                }
                catch (e) {}

                if (info.oneach)
                    info.oneach(oHtml, info.userdata);

                if (step < info.steps)
                    timer = $setTimeout(function(){stepFunction(step + 1)}, info.interval);
                else {
                    _self.current = null;
                    if (info.control)
                        info.control.stopped = true;
                    if (info.onfinish)
                        info.onfinish(oHtml, info.userdata);

                    apf.tween.nextQueue(oHtml);
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
     *  apf.tween.multi(myDiv, {
     *      anim   : apf.tween.EASEIN
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
     *  apf.tween.multi(myDiv, options).multi(myDiv2, options2);
     * </code>
     * @param {Element}  oHtml the object to animate.
     * @param {Object} info the settings of the animation.
     *   Properties:
     *   {Number}   [steps]     the number of steps to divide the tween in
     *   {Number}   [interval]  the time between each step
     *   {Number}   [anim]      the distribution of change between the step over the entire animation
     *   {Function} [onfinish]  a function that is called at the end of the animation
     *   {Function} [oneach]    a function that is called at each step of the animation
     *   {HTMLElement} [oHtml]  another html element to animate.
     *   {Object}   [control]   an object that can stop the animation at any point
     *     Properties:
     *     {Boolean} stop       whether the animation should stop.
     *   {Array}    [tweens]    a collection of simple objects specifying the single value animations that are to be executed simultaneously. (for the properties of these single tweens see the single tween method).
     */
    multi : function(oHtml, info){
        info = apf.extend({steps: 3, interval: 20, anim: apf.tween.NORMAL, control: {}}, info);

        if (oHtml.nodeFunc > 100) {
            info.$int = oHtml.$int;
            oHtml = oHtml.$ext;
        }

        var useCSSAnim  = apf.supportCSSAnim,
            hasCSSAnims = false,
            cssDuration = ((info.steps * info.interval) / 1000),
            cssAnim     = apf.tween.CSSTIMING[info.anim || 0];

        for (var steps = [], stepsTo = [], i = 0; i < info.tweens.length; i++) {
            var data = info.tweens[i];
            
            if (data.oHtml && data.oHtml.nodeFunc > 100) {
                data.$int = data.oHtml.$int;
                data.oHtml = data.oHtml.$ext;
            }

            useCSSAnim = (apf.supportCSSAnim && apf.tween.CSSPROPS[data.type]);

            data.method = useCSSAnim
                ? data.type
                : apf.tween[data.type] || apf.tween.htmlcss;

            //#ifdef __DEBUG
            if (!data.method)
                throw new Error(apf.formatErrorString(0, this,
                    "Multi Value Tween",
                    "Could not find method for tweening operation '"
                    + data.type + "'"));
            //#endif

            if (useCSSAnim) {
                var type = apf.tween.CSSPROPS[data.type];
                data.type = type || data.type;

                oHtml.style[data.type] = data.from
                    + (apf.tween.needsPix[data.type] ? "px" : "");
                stepsTo.push([data.type, data.to
                    + (apf.tween.needsPix[data.type] ? "px" : "")]);
                steps.push(data.type + " " + cssDuration + "s " + cssAnim + " 0");

                hasCSSAnims = true;
            }
            else {
                steps.push(data.color
                    ? apf.tween.$calcColorSteps(info.anim, data.from, data.to, info.steps)
                    : apf.tween.$calcSteps(info.anim, parseFloat(data.from), parseFloat(data.to), info.steps));
            }
        }

        if (hasCSSAnims) {
            oHtml.style.webkitTransition = steps.join(',');
            var count = 0,
                f     = function() {
                    count++;
                    if (count == stepsTo.length) {
                        if (info.onfinish)
                            info.onfinish(oHtml, info.userdata);
                        oHtml.style.webkitTransition = "";
                        oHtml.removeEventListener('webkitTransitionEnd', f);
                    }
                };
            oHtml.addEventListener('webkitTransitionEnd', f);
            for (var k = 0, j = stepsTo.length; k < j; k++)
                oHtml.style[stepsTo[k][0]] = stepsTo[k][1];
            // from here on, webkit will do the rest for us...
            return this;
        }

        var timer,
            tweens       = info.tweens,
            _self        = this,
            stepFunction = function(step){
                _self.current = info;
                if (info.control && info.control.stop) {
                    info.control.stop = false;
                    apf.tween.clearQueue(oHtml);
                    if (info.onstop)
                        info.onstop(oHtml, info.userdata);
                    return;
                }

                try {
                    for (var i = 0; i < steps.length; i++) {
                        tweens[i].method(tweens[i].oHtml || oHtml,
                          steps[i][step], tweens[i]);
                    }
                } catch (e) {}

                if (info.oneach)
                    info.oneach(oHtml, info.userdata);

                if (step < info.steps)
                    timer = $setTimeout(function(){stepFunction(step + 1)}, info.interval);
                else {
                    _self.current = null;
                    if (info.control)
                        info.control.stopped = true;
                    if (info.onfinish)
                        info.onfinish(oHtml, info.userdata);

                    apf.tween.nextQueue(oHtml);
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
     *  apf.tween.css(myDiv, 'class1').multi(myDiv2, 'class2');
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
            oHtml = oHtml.$ext;

        if (remove)
            apf.setStyleClass(oHtml, "", [className]);

        var resetAnim = function(remove, callback){
            if (remove)
                apf.setStyleClass(oHtml, "", [className]);
            else
                apf.setStyleClass(oHtml, className);

            //Reset CSS values
            for (var i = 0; i < info.tweens.length; i++){
                if (info.tweens[i].type == "filter")
                    continue;

                oHtml.style[info.tweens[i].type] = "";
            }

            if (callback)
                callback.apply(this, arguments);
        }

        var onfinish  = info.onfinish;
        var onstop    = info.onstop;
        info.onfinish = function(){resetAnim(remove, onfinish);}
        info.onstop   = function(){resetAnim(!remove, onstop);}

        var result, newvalue, curvalue, j, isColor, style, rules, i, tweens = {};
        for (i = 0; i < document.styleSheets.length; i++) {
            rules = document.styleSheets[i][apf.styleSheetRules];
            for (j = rules.length - 1; j >= 0; j--) {
                var rule = rules[j];

                if (!rule.style || !rule.selectorText.match('\.' + className + '$'))
                    continue;

                for (style in rule.style) {
                    if (!rule.style[style] || this.cssProps.indexOf("|" + style + "|") == -1)
                        continue;

                    if (style == "filter") {
                        if (!rule.style[style].match(/opacity\=([\d\.]+)/))
                            continue;
                        newvalue = RegExp.$1;

                        result   = (apf.getStyleRecur(oHtml, style) || "")
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
                        curvalue = apf.getStyleRecur(oHtml, style);
                        isColor = style.match(/color/i) ? true : false;
                    }

                    tweens[style] = {
                        type    : style,
                        from    : (isColor ? String : parseFloat)(remove
                                    ? newvalue
                                    : curvalue),
                        to      : (isColor ? String : parseFloat)(remove
                                    ? curvalue
                                    : newvalue),
                        color   : isColor,
                        needsPx : apf.tween.needsPix[style.toLowerCase()] || false
                    };
                }
            }
        }
        
        for (var prop in tweens)
            info.tweens.push(tweens[prop]);

        if (remove)
            apf.setStyleClass(oHtml, className);

        return this.multi(oHtml, info);
    },
    
    cssRemove : function(oHtml, className, info){
        this.css(oHtml, className, info, true);
    },

    needsPix : {
        "left"       : true,
        "top"        : true,
        "bottom"     : true,
        "right"      : true,
        "width"      : true,
        "height"     : true,
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
