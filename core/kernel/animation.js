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
        oHtml.style.right = value + "px";
    },
    top: function(oHtml, value){
        oHtml.style.top = value + "px";
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
            if (animtype == 0 && !value) 
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
        
        info.method = jpf.tween[info.type];
        
        //#ifdef __DEBUG
        if(!info.method)
            throw new Error(0, jpf.formErrorString(0, this, "Single Value Tween", "Could not find method for tweening operation '" + info.type + "'"));
        //#endif
        
        var steps = info.color
            ? jpf.tween.calcColorSteps(info.anim, info.from, info.to, info.steps)
            : jpf.tween.calcSteps(info.anim, info.from, info.to, info.steps);

        var stepFunction = function(step){
            //try {
               info.method(oHtml, steps[step]);
            //} catch (e) {}
            
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
        
        for (var steps = [], i = 0; i < info.tweens.length; i++) {
            var data = info.tweens[i];
            
            data.method = jpf.tween[data.type] || jpf.tween.htmlcss;
            
            //#ifdef __DEBUG
            if(!data.method)
                throw new Error(0, jpf.formErrorString(0, this, "Single Value Tween", "Could not find method for tweening operation '" + data.type + "'"));
            //#endif
            
            steps.push(data.color
                ? jpf.tween.calcColorSteps(info.anim, data.from, data.to, info.steps)
                : jpf.tween.calcSteps(info.anim, data.from, data.to, info.steps));
        }

        var stepFunction = function(step){
            try {
                for (var i = 0; i < steps.length; i++) {
                    info.tweens[i].method(oHtml, steps[i][step], info.tweens[i]);
                }
            } catch (e) {}
            
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
        
        if(remove)
            jpf.setStyleClass(oHtml, "", [className]);
        
        info.onfinish = function(){
            if(remove)
                jpf.setStyleClass(oHtml, "", [className]);
            
            //Reset CSS values
            for(var i=0;i<info.tweens.length;i++){
                oHtml.style[info.tweens[i].type] = "";
            }
        }
        
        for(var i=0;i<document.styleSheets.length;i++){
            var rules = document.styleSheets[i][jpf.styleSheetRules];
            for (var j = 0; j < rules.length; j++) {
                var rule = rules[j];
                
                if (!rule.style || !rule.selectorText.match('\.' + className + '$')) 
                    continue;

                for(var style in rule.style){
                    if(!rule.style[style] || this.cssProps.indexOf("|" + style + "|") == -1)
                        continue;

                    info.tweens.push({
                        type:    style,
                        from:    remove ? rule.style[style] : jpf.getStyleRecur(oHtml, style), //convert to hex when rgb for colors
                        to:      remove ? jpf.getStyleRecur(oHtml, style) : rule.style[style], //convert to hex when rgb for colors
                        color:   style.match(/color/i) ? true : false,
                        needsPx: style.match(/left|top|bottom|right|fontSize|lineHeight|textIndent/i) ? true : false
                    });
                }
            }
        }
        
        if(remove)
            jpf.setStyleClass(oHtml, className);

        return this.multi(oHtml, info);
    },
    
    cssProps : "|backgroundColor|backgroundPosition|color|width\
                |height|left|top|bottom|right|fontSize\
                |letterSpacing|lineHeight|textIndent|opacity\
                |paddingLeft|paddingTop|paddingRight|paddingBottom\
                |borderLeftWidth|borderTopWidth|borderRightWidth|borderBottomWidth\
                |borderLeftColor|borderTopColor|borderRightColor|borderBottomColor\
                |marginLeft|marginTop|marginRight|marginBottom|"
}

// #endif
