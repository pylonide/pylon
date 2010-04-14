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

// #ifdef __AMLCHART || __INC_ALL

/**
 * Element displays a chart.
 *
 * @classDescription This class creates a new chart
 * @return {Chart} Returns a new chart
 * @type {Chart}
 * @constructor
 * @allowchild {elements}, {anyaml}
 * @addnode elements:chart
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       0.4
 */

apf.Chart     = function(struct, tagName){
    this.$init(tagName || "chart", apf.NODE_VISIBLE, struct);
};

apf.aml.setElement("chart", apf.Chart);
 
(function(){
     //var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};    
    this.$timer    = null;
    this.$animTimer = null;
	this.$doinit   = true;
	this.$doresize = false;
    this.drawtime = 10;
    this.anim = 0;
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.d = 0;
    this.$supportedProperties = ["anim","a","b","c","d"];
    
    this.$redraw = function(now,resize){
        if(resize)this.$doresize = true;
        if(now){
            if(this.$timer)window.clearTimeout(this.$timer);
            this.$timer = null
            this.$drawChart();
        }else{
			var _self = this;
            if(!this.$timer) this.$timer = window.setTimeout(function(){
                _self.$timer = null;
                _self.$drawChart();
            },this.drawtime);
        }
    }
	
    this.$drawChart = function(){
        if (!this.childNodes) //We're being destroyed
            return;

        if (!this.$ext.offsetHeight && (apf.isIE || !this.$ext.offsetWidth)) //We're not visible, so let's not bother
            return;
        
		// check if we need to initialize or resize
		if(this.$doinit){
			this.$doinit = false;
			this.$doresize = false;
            this.$copyPos();
			apf.draw.initRoot(this);
		}else if (this.$doresize){
            this.$copyPos();
            apf.draw.resizeRoot(this);
		}
        for(var n, i = 0;i<this.childNodes.length;i++){
            if((n=this.childNodes[i]).$drawAxis){
				n.$drawAxis(this.$doresize);
			}
        }
		this.$doresize = false;
    }

    this.$copyPos = function(t, m){
        //@todo apf3.x @rik the height is resetted to 0 here. I don't know why.
        
		this.left = 0, this.top = 0; 
        var w,h,
            rw = this.width  != (w=this.$ext.offsetWidth),
            rh = this.height != (h=this.$ext.offsetHeight);
        //this.width  = w,this.height = h; //@todo @rik commented out for now
        if(t){
            if(m){
                t.left  = this.left + m.left,t.top   = this.top + m.top;
                t.width = this.width - (m.left+m.right),t.height=  this.height - (m.top+m.bottom);
            }else{
                t.left   = this.left,  t.top    = this.top;
                t.width  = this.width, t.height = this.height;
            }
        }
        return rw||rh;
    }
    
    this.$resize = function(){
		// lets set the width/height
        // lets check if we differ
		// call repaint
        if(this.$copyPos()){
            this.$redraw(true,true);
        }
	}
	
	this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$getLayoutNode("main", "container", this.$ext);
        
        var ox, oy, lx, ly, bt, stack = [], interact = false;
        var iebt = [0,1,2,3,3], ffbt = [1,3,2,0,0];

		var _self = this;
        this.$ext.onmousedown = function(e){
			if(this.$doinit)return;
            if (!e) e = event;
            if(e.button>4 || e.button<0)return;
            bt = (_self.canvas)?ffbt[e.button]:iebt[e.button];
            if(!bt)return;
            var keys = e.shiftKey?1:0 + e.ctrlKey?2:0 + e.altKey?4:0;
            //interact = true;
            var pos = apf.getAbsolutePosition(_self.$ext,document.documentElement);
                lx = e.clientX-pos[0] + document.documentElement.scrollLeft, 
                ly = e.clientY-pos[1] + document.documentElement.scrollTop;
            ox = lx , oy = ly;
            // we need to check if our mousedown was in the axis, ifso send it a mousedown and keep it on our eventstack
            for(var t, i = _self.childNodes.length-1;i>=0;i--){
                t = _self.childNodes[i];
				// check child name before pushing up
                if( ox >= t.left && ox <= t.left+t.width &&
                    oy >= t.top && oy <= t.top+t.height )
					if(t.$mouseDown){
                    t.$mouseDown(ox - t.left,oy - t.top, bt, keys);
                    stack.push( t );
                }
                //logw("init "+ox+" "+oy+" "+t.left+" "+t.width+" "+t.top+" "+t.height);
            }
            hasMoved = false;
        }
                
        this.$ext.oncontextmenu = function(){
            return false;   
        }

        this.$ext.onselectstart = function(){
            return false;
        }

        var hasMoved;
        this.addEventListener("contextmenu", function(e){
            if (hasMoved)
                e.cancelBubble = true;
        });

        this.$ext.onmouseup = function(e){
			if(this.$doinit)return;
            if (!e) e = event;
            bt = 0;
            var pos = apf.getAbsolutePosition(_self.$ext,document.documentElement);
            var x = e.clientX - pos[0] + document.documentElement.scrollLeft,
                y = e.clientY - pos[1] + document.documentElement.scrollTop;
            for(var t, i = stack.length-1;i>=0;i--)
                (t=stack[i]).$mouseUp(x - t.left, y - t.top);
            stack.length = 0;
        }

        this.$ext.onmousemove = function(e){
			if(this.$doinit)return;
            //if (!interact) return;
            if (!e) e = event;
            var pos = apf.getAbsolutePosition(_self.$ext,document.documentElement);
            var dx = (-lx + (lx=e.clientX-pos[0] + document.documentElement.scrollLeft)),
                dy = (-ly + (ly=e.clientY-pos[1] + document.documentElement.scrollTop));
            var keys = e.shiftKey?1:0 + e.ctrlKey?2:0 + e.altKey?4:0;

            if (bt) {
                if (bt == 2) 
                    hasMoved = true;

                for(var t, i = stack.length-1;i>=0;i--)
                    (t = stack[i]).$mouseMove(dx,dy,bt,ox-t.left,oy-t.top,lx-t.left,ly-t.top,keys);
            }
            else {
                for(var t, i = _self.childNodes.length-1;i>=0;i--)
                    if((t = _self.childNodes[i]).$mouseMove)
						t.$mouseMove(dx,dy,bt,ox-t.left,
							oy-t.top,lx-t.left,ly-t.top,keys);
            }
        }

        //@todo should use apf's abstraction for scrollwheel
		var wheelEvent = function(e) {
			if(this.$doinit)return;
            if(!e) e = window.event;
            
            var d = e.wheelDelta? 
                (window.opera ?-1:1) * e.wheelDelta / 120 :  
                (e.detail ? -e.detail / 3 : 0);
            var keys = e.shiftKey?1:0 + e.ctrlKey?2:0 + e.altKey?4:0;
            if(d){
                var pos = apf.getAbsolutePosition(_self.$ext,document.documentElement);
                // lets find if we are over a graph
                var x = e.clientX - pos[0] + document.documentElement.scrollLeft,
                    y = e.clientY - pos[1] + document.documentElement.scrollTop;
                for(var t, i = 0;i<_self.childNodes.length;i++){
                    t = _self.childNodes[i];
                    if( x >= t.left && x <= t.left+t.width &&
                        y >= t.top && y <= t.top+t.height ){
                        t.$mouseWheel(x - t.left,y - t.top,d,keys);
                    }
                }
            }
            if(e.preventDefault) e.preventDefault();
            e.returnValue = false;
        }
        if (!apf.supportVML && this.$ext.addEventListener){
            this.$ext.addEventListener('DOMMouseScroll', wheelEvent, false);
        }
        this.$ext.onmousewheel = wheelEvent;

        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(this.$ext, "resize", "var o = apf.all[" + this.$uniqueId + "];\
            if (o) o.$resize()", true);
        apf.layout.queue(this.$ext);
        //#endif
    }
	
    this.$loadAml = function(x){
        apf.draw.initDriver();
		
        if (this.anim > 0){
			var _self = this;
            this.$animTimer = window.setInterval(function(){
                _self.$redraw();
            }, this.anim);
        }
    }
    
    this.$destroy = function() {
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$ext, "resize");
        //#endif
        
        this.$ext.onmousedown   = 
        this.$ext.oncontextmenu = 
        this.$ext.onselectstart = 
        this.$ext.onmouseup     = 
        this.$ext.onmousemove   = 
        this.$ext.onmousewheel  = null;
        
        window.clearTimeout(this.$timer);
        window.clearInterval(this.$animTimer);
    };
}).call(apf.Chart.prototype = new apf.Presentation());

// #endif