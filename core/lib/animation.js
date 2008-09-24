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

// #ifdef __WITH_GANIM

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
    mwidth: function(oHtml, value){
        oHtml.style.width = value + "px";
        oHtml.style.marginLeft = (-1*value/2) + "px";
    },
    mheight: function(oHtml, value){
        oHtml.style.height = value + "px";
        oHtml.style.marginTop = (-1*value/2) + "px";
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
    scrollheight: function(oHtml, value){
        oHtml.style.height = value + "px";
        oHtml.scrollTop    = oHtml.scrollHeight - oHtml.offsetHeight;
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
    
    NORMAL: 0,
    EASEIN: 1,
    EASEOUT: 2,
    
    queue : {},
    
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
    
    /**
     * Calculates all the steps of an animation between a 
     * begin and end value based on 3 tween strategies
     */
    calcSteps : function(animtype, fromValue, toValue, nrOfSteps){
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
    calcColorSteps : function(animtype, fromValue, toValue, nrOfSteps){
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
            jpf.tween.calcSteps(animtype, beginEnd[0][0], beginEnd[1][0], nrOfSteps),
            jpf.tween.calcSteps(animtype, beginEnd[0][1], beginEnd[1][1], nrOfSteps),
            jpf.tween.calcSteps(animtype, beginEnd[0][2], beginEnd[1][2], nrOfSteps)
        ];
        
        for (var steps = [], i = 0; i < stepParts[0].length; i++) {
            steps.push("#" + Math.decToHex(stepParts[0][i])
                           + Math.decToHex(stepParts[1][i])
                           + Math.decToHex(stepParts[2][i]));
        }

        return steps;
    },
    
    /**
     * Single Value Tweening
     */
    single : function(oHtml, info){
        var info = jpf.extend({steps: 3, interval: 20, anim: jpf.tween.NORMAL}, info);
        var timer; 
        
        if (oHtml.nodeType > 100)
            oHtml = oHtml.oExt;
        
        info.method = jpf.tween[info.type];
        
        //#ifdef __DEBUG
        if(!info.method)
            throw new Error(jpf.formatErrorString(0, this, 
                "Single Value Tween", 
                "Could not find method for tweening operation '" 
                + info.type + "'"));
        //#endif

        var steps = info.color
            ? jpf.tween.calcColorSteps(info.anim, info.from, info.to, info.steps)
            : jpf.tween.calcSteps(info.anim, info.from, info.to, info.steps);

        var stepFunction = function(step){
            //try {
               info.method(oHtml, steps[step]);
            //} catch (e) {}
            
            if (info.oneach)
                info.oneach(oHtml, info.userdata);
            
            if (step < info.steps) 
                timer = setTimeout(function(){stepFunction(step + 1)}, info.interval);
            else{
                if (info.onfinish) 
                    info.onfinish(oHtml, info.userdata);
                
                jpf.tween.nextQueue(oHtml);
            }
        };
        
        this.setQueue(oHtml, stepFunction);
        
        return this;
    },
    
    /**
     * Multi Value Tweening
     */
    multi : function(oHtml, info){
        var timer, info = jpf.extend({steps: 3, interval: 20, anim: jpf.tween.NORMAL}, info);
        
        if (oHtml.nodeType > 100)
            oHtml = oHtml.oExt;
        
        for (var steps = [], i = 0; i < info.tweens.length; i++) {
            var data = info.tweens[i];
            
            data.method = jpf.tween[data.type] || jpf.tween.htmlcss;
            
            //#ifdef __DEBUG
            if(!data.method)
                throw new Error(jpf.formatErrorString(0, this, 
                    "Multi Value Tween", 
                    "Could not find method for tweening operation '" 
                    + data.type + "'"));
            //#endif
            
            steps.push(data.color
                ? jpf.tween.calcColorSteps(info.anim, data.from, data.to, info.steps)
                : jpf.tween.calcSteps(info.anim, parseFloat(data.from), parseFloat(data.to), info.steps));
        }

        var tweens = info.tweens;
        var stepFunction = function(step){
            try {
                for (var i = 0; i < steps.length; i++) {
                    tweens[i].method(oHtml, steps[i][step], tweens[i]);
                }
            } catch (e) {}
            
            if (info.oneach)
                info.oneach(oHtml, info.userdata);

            if (step < info.steps)
                timer = setTimeout(function(){stepFunction(step + 1)}, info.interval);
            else{
                if (info.onfinish) 
                    info.onfinish(oHtml, info.userdata);
                
                jpf.tween.nextQueue(oHtml);
            }
        };
        
        this.setQueue(oHtml, stepFunction);
        
        return this;
    },
    
    /**
     * Class Transition
     */
    css : function(oHtml, className, info, remove){
        (info = info || {}).tweens = [];
        
        if (oHtml.nodeType > 100)
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
}

// #endif
