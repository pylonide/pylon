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

// #ifdef __WITH_ANIM

NORMAL   = 0;
EASE_IN  = 1;
EASE_OUT = 2;

//Browser Detection & Global Variables
var Timer, CURRENT;
var isIE55up  = navigator.appVersion.indexOf("MSIE 5.5") != -1 || navigator.appVersion.indexOf("MSIE 6.") != -1;
;
var isIE50    = navigator.appVersion.indexOf("MSIE 5.0") != -1;
var isIE50up  = isIE50 || isIE55up;
var isIE5x    = navigator.appVersion.indexOf("MSIE 5.") != -1;
var isMozilla = !document.layers && !document.all && navigator.userAgent.indexOf("Gecko/") != -1;
var isOpera   = 0;

Animate = {
    sequences: [],
    register : function(o){
        return this.sequences.push(o) - 1;
    },
    
    findSeq: function(id){
        return this.sequences[id];
    },
    
    //Animation Modules
    left: function(oHTML, value){
        oHTML.style.left = value + "px";
    },
    right: function(oHTML, value){
        oHTML.style.right = value + "px";
    },
    
    top: function(oHTML, value){
        oHTML.style.top = value + "px";
    },
    
    width: function(oHTML, value, center){
        if (!oHTML.hordiff) 
            oHTML.hordiff = Math.max(0, oHTML.offsetWidth
                - parseInt(getStyle(oHTML, "width")) || 0);
        oHTML.style.width = Math.max(0, (value - oHTML.hordiff)) + "px";
    },
    
    height: function(oHTML, value, center){
        if (!oHTML.verdiff) 
            oHTML.verdiff = Math.max(0, oHTML.offsetHeight
                - parseInt(getStyle(oHTML, "height")) || 0);
        oHTML.style.height = Math.max(0, (value - oHTML.verdiff)) + "px";
    },
    
    scrollTop: function(oHTML, value, center){
        oHTML.scrollTop = value;
    },
    
    font: function(oHTML, value){
        oHTML.style.fontSize = value + "%";
    },
    
    mleft: function(oHTML, value){
        oHTML.style.marginLeft = value + "px";
    },
    
    scrollwidth: function(oHTML, value){
        oHTML.style.width = value + "px";
        oHTML.scrollLeft = oHTML.scrollWidth;
    },
    
    scrollheight: function(oHTML, value){
        oHTML.style.height = value + "px";
        oHTML.scrollTop = oHTML.scrollHeight;
    },
    
    scrollheight2: function(oHTML, value){
        oHTML.style.height = value + "px";
        oHTML.scrollTop = value == 119 ? 0 : value;
    },
    
    clipright: function(oHTML, value, center){
        oHTML.style.clip = "rect(auto, auto, auto, " + value + "px)";
        oHTML.style.marginLeft = (-1 * value) + "px";
    },
    
    fade: function(oHTML, value){
        if (isIE50up) 
            oHTML.style.filter = "alpha(opacity=" + parseInt(value * 100) + ")";
        else 
            if (isMozilla) 
                oHTML.style.MozOpacity = value - 0.000001;
            else 
                oHTML.style.opacity = value;
    }
}

//Object container several AnimationSequences combining to a full Animation
function Animation(frameperiod){
    this.uniqueId = Animate.register(this);
    
    this.frames = [];
    //this.sequence = [];
    //this.framerate = framerate;
    this.interval = frameperiod;//parseInt(1000/framerate);
    this.addScript = this.addSequence = function(framenr, animseq){
        if (!this.frames[framenr]) 
            this.frames[framenr] = [];
        this.frames[framenr].push(animseq);
        
        return this;
    }
    
    this.changeType = function(framenr, src, dest){
        var arr = this.frames[framenr];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].type == src) 
                arr[i].type = dest;
        }
    }
    
    this.stripFunction = function(str){
        q = str.replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.substr(0, q.length - 1);//q.replace(/\}$/m, "");
        return q;
    }
    
    this.compile = function(){
        var lastHTML;
        var f = this.frames;
        var q = this.sequence = [];
        
        this.step = 0;
        for (var i = 0; i < f.length; i++) {
            if (f[i]) {
                for (var k = 0; k < f[i].length; k++) {
                    //Sequence
                    if (f[i][k].compile) {
                        //if(!f[i][k].compiled)
                        f[i][k].compile();
                        
                        var lastHTML;
                        for (var j = 0; j < f[i][k].steps.length; j++) {
                            if (!q[i + j]) 
                                q[i + j] = [];//"oHTML = " + f[i][k].oHTMLName + ";"
                            /*if(!lastHTML) lastHTML = f[i][k].oHTMLName;
                             if(lastHTML != f[i][k].oHTMLName){
                             lastHTML = f[i][k].oHTMLName;
                             }*/
                            q[i + j].push("oHTML = " + f[i][k].oHTMLName + ";");
                            q[i + j].push(this.stripFunction(f[i][k].method.toString()).replace(/value/g, f[i][k].steps[j]));
                        }
                    } else { //Script
                        if (!q[i]) 
                            q[i] = [];//"oHTML = " + f[i][k].oHTMLName + ";"
                        //if(!lastHTML) lastHTML = f[i][k].oHTMLName;
                        //if(lastHTML != f[i][k].oHTMLName) q[i].push("oHTML = " + f[i][k].oHTMLName);
                        
                        //q[i].push("oHTML = " + f[i][k].oHTMLName + ";");
                        q[i].push(this.stripFunction(f[i][k].toString()));
                    }
                }
            }
        }
        
        //Finalize Sequence
        for (var i = 0; i < q.length; i++) {
            q[i] = new Function(q[i] ? q[i].join("\n") : "");
        }
    }
    
    this.timer = null;
    this.play = function(){
        if (this.onstart) 
            this.onstart();
        clearInterval(this.timer);
        this.timer = setInterval("var o = Animate.findSeq(" + this.uniqueId
            + ");if(o.step < o.sequence.length){o.sequence[o.step++]()}else{;o.stop();if(o.onfinish) o.onfinish()}", this.interval);
    }
    
    this.playreverse = function(){
        if (!this.step) 
            this.step = this.sequence.length - 1;
        clearInterval(this.timer);
        this.timer = setInterval("var o = Animate.findSeq(" + this.uniqueId
            + ");if(o.step >= 0){o.sequence[o.step--]()}else{if(o.onfinishreverse) o.onfinishreverse();o.stop()}", this.interval);
    }
    
    this.start = function(){
        this.stop();
        this.compile();
        this.play();
        
        return this;
    }
    
    this.stop = function(){
        clearInterval(this.timer);
        this.timer = null;
        this.step = 0;
    }
    
    this.isPlaying = function(){
        return this.timer ? true : false;
    }
}

//Object containing the information of a single movement
function AnimationSequence(oHTML, type, fromValue, toValue, animtype, frames, interval){
    this.uniqueId = Animate.register(this);
    
    this.setObject = function(oHTML){
        if (typeof oHTML == "string") {
            this.oHTMLName = oHTML;
            this.oHTML     = eval(oHTML);
            return;
        }
        
        if (this.oHTML && this.oHTML.id == "o" + this.uniqueId) 
            this.oHTML.id = "";
        this.oHTML = oHTML;
        if (!this.oHTML.id) 
            this.oHTML.id = "o" + this.uniqueId;
        this.oHTMLName = "document.getElementById('" + this.oHTML.id + "')";
    }
    
    this.type     = type;
    this.animtype = animtype || 0;
    this.method   = Animate[type];
    if (oHTML) 
        this.setObject(oHTML);
    this.frames   = isMozilla ? parseInt(frames) : frames;// /3
    this.interval = interval;
    
    this.step     = 0;
    this.timer    = null;
    this.compiled = false;
    
    this.compile = function(ease){
        this.compiled  = true;
        this.toValue   = eval(toValue);
        this.fromValue = eval(fromValue);
        this.steps     = [this.fromValue];
        this.step      = 0;
        
        var steps      = this.frames;
        var scalex     = (this.toValue - this.fromValue) / ((Math.pow(steps, 2)
            + 2 * steps + 1) / (4 * steps));
        for (var i = 0; i < this.frames; i++) {
            switch (this.animtype) {
                case 0:
                    var value = (this.toValue - this.fromValue) / this.frames;
                    break;
                case 1:
                    var value = scalex * Math.pow(((steps - i)) / steps, 3);
                    break;
                case 2:
                    var value = scalex * Math.pow(i / this.frames, 3);
                    break;
            }
            this.steps.push(this.steps[this.steps.length - 1] + value);
            //if(Math.abs(this.steps[this.steps.length-1]) > 1) this.steps[this.steps.length-1] -= (i==0?1:0);
        }
        this.steps[this.steps.length - 1] = this.toValue;//this.toValue > 1 ? this.toValue-1 : this.toValue;//Math.max(0, this.toValue-1);
        return this;
    }
    
    this.execute = function(step){
        this.method(this.steps[step]);
    }
    
    this.start = function(){
        this.compile();
        this.play();
        
        return this;
    }
    
    this.play = function(step, oHTML){
        this.stop();
        if (oHTML) 
            this.setObject(oHTML);
        
        if (this.step >= this.steps.length || this.step < 0) 
            this.step = 0;
        this.timer = setInterval("var o = Animate.findSeq(" + this.uniqueId
            + ");if(o.step < o.steps.length){o.method(o.oHTML, o.steps[o.step++])}else{if(o.onfinish) o.onfinish(o.oHTML);o.stop();}",
            this.interval);
    }
    
    this.reverseplay = function(oHTML){
        this.stop();
        if (oHTML) 
            this.setObject(oHTML);
        
        if (this.step >= this.steps.length) 
            this.step = this.steps.length - 1;
        this.timer = setInterval("var o = Animate.findSeq(" + this.uniqueId
            + ");if(o.step >= 0 && o.step < o.steps.length){o.method(o.oHTML, o.steps[o.step--])}else{if(o.onfinishreverse) o.onfinishreverse(o.oHTML);o.stop();}",
            this.interval);
    }
    
    this.stop = function(){
        clearInterval(this.timer);
        this.timer = null;
    }
    
    this.reset = function(){
        this.stop();
        this.step = 0;
    }
    
    this.isPlaying = function(){
        return this.timer ? true : false;
    }
}

// #endif
