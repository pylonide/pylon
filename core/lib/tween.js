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
apf.tween = (function(apf) {

var modules = {
        //Animation Modules
    left: function(oHtml, value){
        oHtml.style.left = value + PX;
    },
    right: function(oHtml, value){
        oHtml.style.left  = "";
        oHtml.style.right = value + PX;
    },
    top: function(oHtml, value){
        oHtml.style.top = value + PX;
    },
    bottom: function(oHtml, value){
        oHtml.style.top    = "";
        oHtml.style.bottom = value + PX;
    },
    width: function(oHtml, value, center){
        oHtml.style.width = value + PX;
    },
    height: function(oHtml, value, center){
        oHtml.style.height = value + PX;
    },
    scrollTop: function(oHtml, value, center){
        oHtml.scrollTop = value;
    },
    scrollLeft: function(oHtml, value, center){
        oHtml.scrollLeft = value;
    },
    "height-rsz": function(oHtml, value, center){
        oHtml.style.height = value + PX;
        if (apf.hasSingleResizeEvent && apf.layout.$onresize)
            apf.layout.$onresize();
    },
    mwidth: function(oHtml, value, info) {
        var diff = apf.getDiff(oHtml);
        oHtml.style.width = value + PX;
        oHtml.style.marginLeft = -1 * (value / 2 + (parseInt(apf.getStyle(oHtml,
            "borderLeftWidth")) || diff[0]/2) + (info.margin || 0)) + PX;
    },
    mheight: function(oHtml, value, info) {
        var diff = apf.getDiff(oHtml);
        oHtml.style.height = value + PX;
        oHtml.style.marginTop = (-1 * value / 2 - (parseInt(apf.getStyle(oHtml,
            "borderTopWidth")) || diff[1]/2) + (info.margin || 0)) + PX;
    },
    scrollwidth: function(oHtml, value){
        oHtml.style.width = value + PX;
        oHtml.scrollLeft  = oHtml.scrollWidth;
    },
    scrollheight_old: function(oHtml, value){
        try {
            oHtml.style.height = value + PX;
            oHtml.scrollTop    = oHtml.scrollHeight;
        }
        catch (e) {
            alert(value)
        }
    },
    scrollheight: function(oHtml, value, info){
        var diff = apf.getHeightDiff(oHtml),
            oInt = info.$int || oHtml;

        oHtml.style.height = Math.max((value + (info.diff || 0)), 0) + PX;
        oInt.scrollTop     = oInt.scrollHeight - oInt.offsetHeight - diff 
            + (info.diff || 0) - (apf.isGecko ? 16 : 0); //@todo where does this 16 come from??
    },
    scrolltop: function(oHtml, value){
        oHtml.style.height = value + PX;
        oHtml.style.top    = (-1 * value - 2) + PX;
        oHtml.scrollTop    = 0;//oHtml.scrollHeight - oHtml.offsetHeight;
    },
    clipright: function(oHtml, value, center){
        oHtml.style.clip       = "rect(auto, auto, auto, " + value + "px)";
        oHtml.style.marginLeft = (-1 * value) + PX;
    },
    fade: function(oHtml, value){
        if (!apf.supportOpacity && apf.hasStyleFilters)
            oHtml.style.filter  = value == 1 ? "" : "alpha(opacity=" + parseInt(value * 100) + ")";
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
            oHtml.style.filter = value == 1 ? "" : "progid:DXImageTransform.Microsoft.Alpha(opacity=" + value + ")";
        else
            oHtml.style[obj.type] = value + (obj.needsPx ? PX : "");
    },
    transformscale: function(oHtml, value, obj) {
        oHtml.style[obj.type] = SCALEA + parseFloat(value) + SCALEB;
    },
    transformrotate: function(oHtml, value, obj) {
        oHtml.style[obj.type] = ROTATEA + parseFloat(value) + ROTATEB;
    },
    transformvalscale: function(value) {
        return SCALEA + parseFloat(value) + SCALEB;
    },
    transformvalrotate: function(value) {
        return ROTATEA + parseFloat(value) + ROTATEB;
    }
};

var ID        = "id",
    PX        = "px",
    NUM       = "number",
    TRANSVAL  = "transformval",
    TRANSFORM = "transform",
    SCALE     = "scale",
    SCALEA    = "scale(",
    ROTATEA   = "rotate(",
    SCALEB    = ")",
    ROTATEB   = "deg)",
    CSSTIMING = ["linear", "ease-in", "ease-out", "ease", "ease-in-out", "cubic-bezier"],
    CSSPROPS  = {
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
        "opacity"     : "opacity",
        "bgcolor"     : "background-color",
        "textcolor"   : "color",
        "transform"   : "transform"
    },
    __pow   = Math.pow,
    __round = Math.round,

    queue = {},

    current= null,

    setQueue = function(oHtml, stepFunction){
        var id = oHtml.getAttribute(ID);
        if (!id) {
            apf.setUniqueHtmlId(oHtml);
            id = oHtml.getAttribute(ID);
        }

        if (!queue[id])
            queue[id] = [];

        queue[id].push(stepFunction);
        if (queue[id].length == 1)
            stepFunction(0);
    },

    nextQueue = function(oHtml){
        var q = queue[oHtml.getAttribute(ID)];
        if (!q) return;

        q.shift(); //Remove current step function

        if (q.length)
            q[0](0);
    },

    clearQueue = function(oHtml, bStop){
        var q = queue[oHtml.getAttribute(ID)];
        if (!q) return;

        if (bStop && current && current.control)
            current.control.stop = true;
        q.length = 0;
    },

    purgeQueue = function(oHtml) {
        var id = oHtml.getAttribute(ID);
        if (!id) {
            apf.setUniqueHtmlId(oHtml);
            id = oHtml.getAttribute(ID);
        }

        for (var i in queue) {
            if (i == id)
                queue[i] = [];
        }
    },

    /**
     * Calculates all the steps of an animation between a
     * begin and end value based on 3 tween strategies
     */
    calcSteps = function(func, fromValue, toValue, nrOfSteps){
        var i     = 0,
            l     = nrOfSteps - 1,
            steps = [fromValue];

        // backward compatibility...
        if (typeof func == NUM) {
            if (!func)
                func = apf.tween.linear;
            else if (func == 1)
                func = apf.tween.easeInCubic;
            else if (func == 2)
                func = apf.tween.easeOutCubic;
        }

        /*
        func should have the following signature:
        func(t, x_min, dx)
        where 0 <= t <= 1, dx = x_max - x_min

        easeInCubic: function(t, x_min, dx) {
            return dx * pow(t, 3) + x_min;
        }
        */
        for (i = 0; i < l; ++i)
            steps.push(func(i / nrOfSteps, fromValue, toValue - fromValue));
        steps.push(toValue);
        
        return steps;
    },

    /**
     * Calculates all the steps of an animation between a
     * begin and end value for colors
     */
    calcColorSteps = function(animtype, fromValue, toValue, nrOfSteps){
        var d2, d1,
            c   = apf.color.colorshex,
            a   = parseInt((c[fromValue] || fromValue).slice(1), 16),
            b   = parseInt((c[toValue] || toValue).slice(1), 16),
            i   = 0,
            out = [];

        for (; i < nrOfSteps; i++){
            d1 = i / (nrOfSteps - 1), d2 = 1 - d1;
            out[out.length] = "#" + ("000000" +
                ((__round((a & 0xff) * d2 + (b & 0xff) * d1) & 0xff) |
                (__round((a & 0xff00) * d2 + (b & 0xff00) * d1) & 0xff00) |
                (__round((a & 0xff0000) * d2 + (b & 0xff0000) * d1) & 0xff0000)).toString(16)).slice(-6);
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
     *   {String}   type        the property to be animated. These are predefined
     *                          property handlers and can be added by adding a
     *                          method to apf.tween with the name of the property
     *                          modifier. Default there are several handlers available.
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
     *     Methods:
     *     stop                 set on the object passed .
     */
    single = function(oHtml, info){
        info = apf.extend({steps: 10, interval: 5, anim: apf.tween.linear, control: {}}, info);
        info.steps    = Math.ceil(info.steps * apf.animSteps);
        info.interval = Math.ceil(info.interval * apf.animInterval);

        if (oHtml.nodeFunc > 100) {
            info.$int = oHtml.$int;
            oHtml     = oHtml.$ext;
        }
        try { //@TODO hack where currentStyle is still undefined
            if ("fixed|absolute|relative".indexOf(apf.getStyle(oHtml, "position")) == -1)
                oHtml.style.position = "relative";
        } catch(e){}
        
        var useCSSAnim  = (apf.supportCSSAnim && apf.supportCSSTransition && CSSPROPS[info.type]),
            isTransform = (info.type == TRANSFORM);

        info.method = useCSSAnim ? info.type : isTransform
            ? modules[TRANSFORM + (info.subType || SCALE)]
            : modules[info.type]
                ? modules[info.type]
                : (info.needsPx = needsPix[info.type] || false)
                    ? modules.htmlcss
                    : modules.htmlcss;

        //#ifdef __DEBUG
        if (!info.method)
            throw new Error(apf.formatErrorString(0, this,
                "Single Value Tween",
                "Could not find method for tweening operation '"
                + info.type + "'"));
        //#endif

        if (useCSSAnim) {
            var type = CSSPROPS[info.type];
            if (type === false)
                return apf.tween;
            info.type = type || info.type;
            if (isTransform) {
                if (!info.subType)
                    info.subType = SCALE;
                info.type = apf.supportCSSAnim;
            }

            var transform = (isTransform)
                ? modules[TRANSVAL + (info.subType || SCALE)]
                : null;

            oHtml.style[info.type] = isTransform
                ? transform(info.from)
                : info.from + (needsPix[info.type] ? PX : "");
            $setTimeout(function() {
                oHtml.style[info.type] = isTransform
                    ? transform(info.to)
                    : info.to + (needsPix[info.type] ? PX : "");
                oHtml.offsetTop; //force style recalc
                oHtml.style[apf.cssPrefix + "Transition"] = info.type + " " + ((info.steps
                    * info.interval) / 1000) + "s "
                    + CSSTIMING[info.anim || 0];
                var f = function() {
                    if (info.onfinish)
                        info.onfinish(oHtml, info.userdata);
                    oHtml.style[apf.cssPrefix + "Transition"] = "";
                    oHtml.removeEventListener(apf.cssAnimEvent, f);
                };
                oHtml.addEventListener(apf.cssAnimEvent, f);
            });
            return apf.tween;
        }

        if (info.control) {
            info.control.state = apf.tween.RUNNING;
            info.control.stop = function(){
                info.control.state = apf.tween.STOPPING;
                clearQueue(oHtml);
                if (info.onstop)
                    info.onstop(oHtml, info.userdata);
            }
        }

        var steps = info.color
                ? calcColorSteps(info.anim, info.from, info.to, info.steps)
                : calcSteps(info.anim, parseFloat(info.from), parseFloat(info.to), info.steps),
            stepFunction = function(step){
                if (info.control && info.control.state) {
                    info.control.state = apf.tween.STOPPED;
                    return;
                }
                
                current = info;

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
                    return $setTimeout(function(){stepFunction(step + 1)}, info.interval);

                current = null;
                if (info.control)
                    info.control.state = apf.tween.STOPPED;
                if (info.onfinish)
                    info.onfinish(oHtml, info.userdata);

                nextQueue(oHtml);
            };

        if (info.type.indexOf("scroll") > -1)
            purgeQueue(oHtml);
        setQueue(oHtml, stepFunction);

        return apf.tween;
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
     *   {Number}   [anim]      the distribution of change between the step over
     *                          the entire animation
     *   {Function} [onfinish]  a function that is called at the end of the animation
     *   {Function} [oneach]    a function that is called at each step of the animation
     *   {HTMLElement} [oHtml]  another html element to animate.
     *   {Object}   [control]   an object that can stop the animation at any point
     *     Properties:
     *     {Boolean} stop       whether the animation should stop.
     *   {Array}    [tweens]    a collection of simple objects specifying the single
     *                          value animations that are to be executed simultaneously.
     *                          (for the properties of these single tweens see the
     *                          single tween method).
     */
    multi = function(oHtml, info){
        info = apf.extend({steps: 10, interval: 5, anim: apf.tween.linear, control: {}}, info);
        info.steps    = Math.ceil(info.steps * apf.animSteps);
        info.interval = Math.ceil(info.interval * apf.animInterval);

        if (oHtml.nodeFunc > 100) {
            info.$int = oHtml.$int;
            oHtml = oHtml.$ext;
        }

        var animCSS, isTransform,
            useCSSAnim  = apf.supportCSSAnim && apf.supportCSSTransition,
            hasCSSAnims = false,
            cssDuration = ((info.steps * info.interval) / 1000),
            cssAnim     = CSSTIMING[info.anim || 0],
            steps       = [],
            stepsTo     = [],
            i           = 0,
            l           = info.tweens.length;

        for (; i < l; i++) {
            var data = info.tweens[i];

            if (data.oHtml && data.oHtml.nodeFunc > 100) {
                data.$int  = data.oHtml.$int;
                data.oHtml = data.oHtml.$ext;
            }

            animCSS     = (useCSSAnim && CSSPROPS[data.type]);
            isTransform = (data.type == TRANSFORM);
            if (isTransform) {
                if (!data.subType)
                    data.subType = SCALE;
                data.type = apf.supportCSSAnim;
            }

            data.method = animCSS
                ? data.type
                : isTransform
                    ? modules[TRANSFORM + (data.subType)]
                    : modules[data.type]
                        ? modules[data.type]
                        : (data.needsPx = needsPix[data.type] || false)
                            ? modules.htmlcss
                            : modules.htmlcss;


            //#ifdef __DEBUG
            if (!data.method)
                throw new Error(apf.formatErrorString(0, this,
                    "Multi Value Tween",
                    "Could not find method for tweening operation '"
                    + data.type + "'"));
            //#endif

            if (animCSS) {
                var type = isTransform ? data.type : CSSPROPS[data.type];
                data.type = type || data.type;
                var transform = modules[TRANSVAL + (data.subType)]

                oHtml.style[data.type] = isTransform
                    ? transform(data.from)
                    : data.from + (needsPix[data.type] ? PX : "");
                stepsTo.push([data.type, isTransform
                    ? transform(data.to)
                    : data.to + (needsPix[data.type] ? PX : "")]);
                steps.push(data.type + " " + cssDuration + "s " + cssAnim + " 0");

                hasCSSAnims = true;
            }
            else {
                steps.push(data.color
                    ? calcColorSteps(info.anim, data.from, data.to, info.steps)
                    : calcSteps(info.anim, parseFloat(data.from), parseFloat(data.to), info.steps));
            }
        }

        if (hasCSSAnims) {
            oHtml.style[apf.cssPrefix + "Transition"] = steps.join(",");
            oHtml.offsetTop; //force style recalc
            var count = 0,
                func  = function() {
                    count++;
                    if (count == stepsTo.length) {
                        if (info.onfinish)
                            info.onfinish(oHtml, info.userdata);
                        oHtml.style[apf.cssPrefix + "Transition"] = "";
                        oHtml.removeEventListener(apf.cssAnimEvent, func);
                    }
                };
            oHtml.addEventListener(apf.cssAnimEvent, func, false);
            for (var k = 0, j = stepsTo.length; k < j; k++)
                oHtml.style[stepsTo[k][0]] = stepsTo[k][1];
            return apf.tween;
        }
        
        if (info.control) {
            info.control.state = apf.tween.RUNNING;
            info.control.stop = function(){
                info.control.state = apf.tween.STOPPING;
                clearQueue(oHtml);
                if (info.onstop)
                    info.onstop(oHtml, info.userdata);
            }
        }

        var tweens       = info.tweens,
            stepFunction = function(step){
                if (info.control && info.control.state) {
                    info.control.state = apf.tween.STOPPED;
                    return;
                }
                
                current = info;

                try {
                    for (var i = 0; i < steps.length; i++) {
                        tweens[i].method(tweens[i].oHtml || oHtml,
                          steps[i][step], tweens[i]);
                    }
                } catch (e) {}

                if (info.oneach)
                    info.oneach(oHtml, info.userdata);

                if (step < info.steps)
                    return $setTimeout(function(){stepFunction(step + 1)}, info.interval);

                current = null;
                if (info.control)
                    info.control.state = apf.tween.STOPPED;
                if (info.onfinish)
                    info.onfinish(oHtml, info.userdata);

                nextQueue(oHtml);
            };

        setQueue(oHtml, stepFunction);

        return apf.tween;
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
    css = function(oHtml, className, info, remove){
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

        var onfinish  = info.onfinish,
            onstop    = info.onstop;
        info.onfinish = function(){resetAnim(remove, onfinish);}
        info.onstop   = function(){resetAnim(!remove, onstop);}

        var result, newvalue, curvalue, j, isColor, style, rules, i,
            tweens = {};
        for (i = 0; i < document.styleSheets.length; i++) {
            rules = document.styleSheets[i][apf.styleSheetRules];
            for (j = rules.length - 1; j >= 0; j--) {
                var rule = rules[j];

                if (!rule.style || !rule.selectorText.match("\." + className + "$"))
                    continue;

                for (style in rule.style) {
                    if (!rule.style[style] || cssProps.indexOf("|" + style + "|") == -1)
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
                        needsPx : needsPix[style.toLowerCase()] || false
                    };
                }
            }
        }

        for (var prop in tweens)
            info.tweens.push(tweens[prop]);

        if (remove)
            apf.setStyleClass(oHtml, className);

        return multi(oHtml, info);
    },

    cssRemove = function(oHtml, className, info){
        css(oHtml, className, info, true);
    },

    needsPix = {
        "left"        : true,
        "top"         : true,
        "bottom"      : true,
        "right"       : true,
        "width"       : true,
        "height"      : true,
        "fontSize"    : true,
        "lineHeight"  : true,
        "textIndent"  : true,
        "marginLeft"  : true,
        "marginTop"   : true,
        "marginRight" : true,
        "marginBottom": true
    },

    cssProps = "|backgroundColor|backgroundPosition|color|width|filter"
             + "|height|left|top|bottom|right|fontSize"
             + "|letterSpacing|lineHeight|textIndent|opacity"
             + "|paddingLeft|paddingTop|paddingRight|paddingBottom"
             + "|borderLeftWidth|borderTopWidth|borderRightWidth|borderBottomWidth"
             + "|borderLeftColor|borderTopColor|borderRightColor|borderBottomColor"
             + "|marginLeft|marginTop|marginRight|marginBottom"
             + "|transform|", // transforms are special and get special treatment
    cssTransforms = "|scale|rotate|";

return {
    single: single,
    multi: multi,
    css: css,
    cssRemove: cssRemove,
    clearQueue: clearQueue,
    addModule: function(name, func, force) {
        if (typeof name != "string" || typeof func != "function" || (modules[name] && !force))
            return this;
        modules[name] = func;
        return this;
    },
    /** Linear tweening method */
    NORMAL: 0,
    /** Ease-in tweening method */
    EASEIN: 1,
    /** Ease-out tweening method */
    EASEOUT: 2,
    
    RUNNING: 0,
    STOPPING: 1,
    STOPPED: 2,
    
    calcColorSteps: calcColorSteps,

    linear: function(t, x_min, dx) {
        return dx * t + x_min;
    },
    easeInQuad: function(t, x_min, dx) {
        return dx * __pow(t, 2) + x_min;
    },
    easeOutQuad: function(t, x_min, dx) {
        return -dx * t * (t - 2) + x_min;
    },
    easeInOutQuad: function(t, x_min, dx) {
        if ((t /= .5) < 1)
            return dx / 2 * t * t + x_min;
        return -dx / 2 * ((--t) * (t - 2) - 1) + x_min;
    },
    easeInCubic: function(t, x_min, dx) {
        return dx * __pow(t, 3) + x_min;
    },
    easeOutCubic: function(t, x_min, dx) {
        return dx * (__pow(t - 1, 3) + 1) + x_min;
    },
    easeInOutCubic: function(t, x_min, dx) {
        if ((t /= .5) < 1)
            return dx / 2 * __pow(t, 3) + x_min;
        return dx / 2 * (__pow(t - 2, 3) + 2) + x_min;
    },
    easeInQuart: function(t, x_min, dx) {
        return dx * __pow(t, 4) + x_min;
    },
    easeOutQuart: function(t, x_min, dx) {
        return -dx * (__pow(t - 1, 4) - 1) + x_min;
    },
    easeInOutQuart: function(t, x_min, dx) {
        if ((t /= .5) < 1)
            return dx / 2 * __pow(t, 4) + x_min;
        return -dx / 2 * (__pow(t - 2, 4) - 2) + x_min;
    },
    easeInQuint: function(t, x_min, dx) {
        return dx * __pow(t, 5) + x_min;
    },
    easeOutQuint: function(t, x_min, dx) {
        return dx * (__pow(t - 1, 5) + 1) + x_min;
    },
    easeInOutQuint: function(t, x_min, dx) {
        if ((t /= .5) < 1)
            return dx / 2 * __pow(t, 5) + x_min;
        return dx / 2 * (__pow(t - 2, 5) + 2) + x_min;
    },
    easeInSine: function(t, x_min, dx) {
        return -dx * Math.cos(t * (Math.PI / 2)) + dx + x_min;
    },
    easeOutSine: function(t, x_min, dx) {
        return dx * Math.sin(t * (Math.PI / 2)) + x_min;
    },
    easeInOutSine: function(t, x_min, dx) {
        return -dx / 2 * (Math.cos(Math.PI * t) - 1) + x_min;
    },
    easeInExpo: function(t, x_min, dx) {
        return (t == 0) ? x_min : dx * __pow(2, 10 * (t - 1)) + x_min;
    },
    easeOutExpo: function(t, x_min, dx) {
        return (t == 1) ? x_min + dx : dx * (-__pow(2, -10 * t) + 1) + x_min;
    },
    easeInOutExpo: function(t, x_min, dx) {
        if (t == 0)
            return x_min;
        if (t == 1)
            return x_min + dx;
        if ((t /= .5) < 1)
            return dx / 2 * __pow(2, 10 * (t - 1)) + x_min;
        return dx / 2 * (-__pow(2, -10 * --t) + 2) + x_min;
    },
    easeInCirc: function(t, x_min, dx) {
        return -dx * (Math.sqrt(1 - t * t) - 1) + x_min;
    },
    easeOutCirc: function(t, x_min, dx) {
        return dx * Math.sqrt(1 - (t -= 1) * t) + x_min;
    },
    easeInOutCirc: function(t, x_min, dx) {
        if ((t /= .5) < 1)
            return -dx / 2 * (Math.sqrt(1 - t * t) - 1) + x_min;
        return dx / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + x_min;
    },
    easeInElastic: function(t, x_min, dx) {
        var s = 1.70158,
            p = .3,
            a = dx;
        if (t == 0)
            return x_min;
        if (t == 1)
            return x_min + dx;
        if (!a || a < Math.abs(dx)) {
            a = dx;
            s = p / 4;
        }
        else
            s = p / (2 * Math.PI) * Math.asin (dx / a);
        return -(a * __pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p)) + x_min;
    },
    easeOutElastic: function(t, x_min, dx) {
        var s = 1.70158,
            p = .3,
            a = dx;
        if (t == 0)
            return x_min;
        if (t == 1)
            return x_min + dx;
        if (a < Math.abs(dx)) {
            a = dx;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(dx / a);
        }
        return a * __pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + dx + x_min;
    },
    easeInOutElastic: function(t, x_min, dx) {
        var s = 1.70158,
            p = 0,
            a = dx;
        if (t == 0)
            return x_min;
        if ((t / 2) == 2)
            return x_min + dx;
        if (!p)
            p = .3 * 1.5;
        if (a < Math.abs(dx)) {
            a = dx;
            s = p / 4;
        }
        else {
            s = p / (2 * Math.PI) * Math.asin(dx / a);
        }
        if (t < 1)
            return -.5 * (a * __pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p)) + x_min;
        return a * __pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * .5 + dx + x_min;
    },
    easeInBack: function(t, x_min, dx) {
        var s = 1.70158;
        return dx * __pow(t, 2) * ((s + 1) * t - s) + x_min;
    },
    easeOutBack: function(t, x_min, dx) {
        var s = 1.70158;
        return dx * ((t -= 1) * t * ((s + 1) * t + s) + 1) + x_min;
    },
    easeInOutBack: function(t, x_min, dx) {
        var s = 1.70158;
        if ((t / 2) < 1)
            return dx / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + x_min;
        return dx / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + x_min;
    },
    easeInBounce: function(t, x_min, dx) {
        return dx - apf.tween.easeOutBounce(1 - t, 0, dx) + x_min;
    },
    easeOutBounce: function(t, x_min, dx) {
        if (t < (1 / 2.75))
            return dx * (7.5625 * t * t) + x_min;
        else if (t < (2 / 2.75))
            return dx * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + x_min;
        else if (t < (2.5 / 2.75))
            return dx * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + x_min;
        else
            return dx * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + x_min;
    },
    easeInOutBounce: function(t, x_min, dx) {
        if (t < 1 / 2)
            return apf.tween.easeInBounce(t * 2, 0, dx) * .5 + x_min;
        return apf.tween.easeOutBounce(t * 2 - 1, 0, dx) * .5 + dx * .5 + x_min;
    }
};

})(apf);

// #endif
