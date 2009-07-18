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

// #ifdef __JCHART || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element displays a chart.
 *
 * @classDescription This class creates a new chart
 * @return {Chart} Returns a new chart
 * @type {Chart}
 * @constructor
 * @allowchild {elements}, {anyjml}
 * @addnode elements:chart
 *
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.chart = jpf.component(jpf.NODE_VISIBLE, function(){

     //var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};    
    var _self    = this;
    var timer    = null;
    var animTimer = null;
	var doinit   = true;
	var doresize = false;
    this.drawtime = 10;
    this.anim = 0;
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.d = 0;
    this.$supportedProperties = ["anim","a","b","c","d"];    
    
    this.$redraw = function(now,resize){
        if(resize)doresize = true;
        if(now){
            if(timer)window.clearTimeout(timer);
            timer = null
            this.$drawChart();
        }else{
            if(!timer) timer = window.setTimeout(function(){
                timer = null;
                _self.$drawChart();
            },this.drawtime);
        }
    }

    this.$drawChart = function(){
        if (!this.childNodes) //We're being destroyed
            return;
            
        if (!this.oExt.offsetHeight) //We're not visible, so let's not bother
            return;
        
		// check if we need to initialize or resize
		if(doinit){
			doinit = false;
			doresize = false;
            this.$copyPos();
			jpf.draw.initRoot(this);
		}else if (doresize){
            this.$copyPos();
            jpf.draw.resizeRoot(this);
		}
        for(var n, i = 0;i<this.childNodes.length;i++){
            if((n=this.childNodes[i]).$drawAxis){
				n.$drawAxis(doresize);
			}
        }
		doresize = false;
    }

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
    }
    
    this.$copyPos = function(t, m){
		this.left = 0, this.top = 0; 
        var w,h,
            rw = this.width  != (w=this.oExt.offsetWidth),
            rh = this.height != (h=this.oExt.offsetHeight);
        this.width  = w,this.height = h;
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
	    
    this.$loadJml = function(x){
        var oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.oInt = oInt;

        jpf.draw.initDriver();

        jpf.JmlParser.parseChildren(x, this.oExt, this);
       
        var ox, oy, lx, ly, bt, stack = [], interact = false;
        var iebt = [0,1,2,3,3], ffbt = [1,3,2,0,0];

        this.oExt.onmousedown = function(e){
			if(doinit)return;
            if (!e) e = event;
            if(e.button>4 || e.button<0)return;
            bt = (_self.canvas)?ffbt[e.button]:iebt[e.button];
            if(!bt)return;
            var keys = e.shiftKey?1:0 + e.ctrlKey?2:0 + e.altKey?4:0;
            //interact = true;
            var pos = jpf.getAbsolutePosition(_self.oExt,document.documentElement);
                lx = e.clientX-pos[0] + document.documentElement.scrollLeft, 
                ly = e.clientY-pos[1] + document.documentElement.scrollTop;
            ox = lx , oy = ly;
            // we need to check if our mousedown was in the axis, ifso send it a mousedown and keep it on our eventstack
            for(var t, i = _self.childNodes.length-1;i>=0;i--){
                t = _self.childNodes[i];
                if( ox >= t.left && ox <= t.left+t.width &&
                    oy >= t.top && oy <= t.top+t.height ){
                    t.$mouseDown(ox - t.left,oy - t.top, bt, keys);
                    stack.push( t );
                }
                //logw("init "+ox+" "+oy+" "+t.left+" "+t.width+" "+t.top+" "+t.height);
                
            }
            hasMoved = false;
        }
                
        this.oExt.oncontextmenu = function(){
            return false;   
        }

        this.oExt.onselectstart = function(){
            return false;
        }

        var hasMoved;
        this.addEventListener("contextmenu", function(e){
            if (hasMoved)
                e.cancelBubble = true;
        });

        this.oExt.onmouseup  = function(e){
			if(doinit)return;
            if (!e) e = event;
            bt = 0;
            var pos = jpf.getAbsolutePosition(_self.oExt,document.documentElement);
            var x = e.clientX - pos[0] + document.documentElement.scrollLeft,
                y = e.clientY - pos[1] + document.documentElement.scrollTop;
            for(var i = stack.length-1;i>=0;i--)
                (t=stack[i]).$mouseUp(x - t.left, y - t.top);
            stack.length = 0;
        }

        this.oExt.onmousemove = function(e){
			if(doinit)return;
            //if (!interact) return;
            if (!e) e = event;
            var pos = jpf.getAbsolutePosition(_self.oExt,document.documentElement);
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
                    (t = _self.childNodes[i]).$mouseMove(dx,dy,bt,ox-t.left,
                        oy-t.top,lx-t.left,ly-t.top,keys);
            }
        }
    
        wheelEvent = function(e) {
			if(doinit)return;
            if(!e) e = window.event;
            
            var d = e.wheelDelta? 
                (window.opera ?-1:1) * e.wheelDelta / 120 :  
                (e.detail ? -e.detail / 3 : 0);
            var keys = e.shiftKey?1:0 + e.ctrlKey?2:0 + e.altKey?4:0;
            if(d){
                var pos = jpf.getAbsolutePosition(_self.oExt,document.documentElement);
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
        if (!jpf.supportVML && this.oExt.addEventListener){
            this.oExt.addEventListener('DOMMouseScroll', wheelEvent, false);
        }
        this.oExt.onmousewheel = wheelEvent;

        //#ifdef __WITH_LAYOUT
        jpf.layout.setRules(this.oExt, "resize", "var o = jpf.all[" + this.uniqueId + "];\
            if (o) o.$resize()", true);
        //#endif
        
        if (this.anim > 0){
            animTimer = window.setInterval(function(){
                _self.$redraw();
            }, this.anim);
        }
    }
    
    this.$destroy = function() {
        //#ifdef __WITH_LAYOUT
        jpf.layout.removeRule(this.oExt, "resize");
        //#endif
        
        window.clearTimeout(timer);
        window.clearInterval(animTimer);
    };
}).implement(jpf.Presentation);

     
jpf.axis = jpf.component(jpf.NODE_HIDDEN, function(){
    this.$supportedProperties = [
        "left","top","width","height","mode",
        "zoom","zoomx", "zoomy","movex", "movey",  
        "orbitx", "orbity", "distance",
        "x1","x2","y1","y2","z1","z2","t1","t2",
        "x3d","y3d","z3d","p3d",
        "orbitxanim","orbityanim","orbitzanim"
    ];
    
    this.$drawCode  = 0;
    var _style = null;
    var docompile = true;
	var doinit = true;
    
    var _self  = this;
    var timer;
    var subpos = {left:0,right:0,width:1,height:1};
    
    this.zoomx = 1,  this.zoomy = 1,   this.zoomz = 1;
    this.movex = 0,  this.movey  = 0,  this.movez  = 0;
    this.mousex = 0, this.mousey = 0;
    this.$tilex = 0,  this.$tiley = 0;
    this.orbitx   = 0,this.orbity = 0, this.orbitz   = 0;
	this.distance = 4; 
    this.rotate = 0;
    // anim crap
    this.orbitxanim = 0;
    this.orbityanim = 0;
    this.orbitzanim = 0;

    // domains
    this.x1 = -2, this.x2 = 2;
    this.y1 = -1, this.y2 = 2;
    this.z1 = -0.7, this.z2 = 1;
    this.t1 = 0, this.t2 = 1;
    // 3D rendering styles
	this.x3d= 2,this.y3d = 2,this.z3d = 2;
    this.p3d = 1; // perspective
    //this.animreset = 1;

    this.mode = '2D';
    this.left = 0,this.top = 0, this.width = 0,this.height = 0;
    this.resetView = function(){
        if(!this.animreset){
            _self.setProperty("movex", 0 ); _self.setProperty("movey", 0 );_self.setProperty("movez", 0 );
            _self.setProperty("zoomx", 1 ); _self.setProperty("zoomy", 1 );_self.setProperty("zoomz", 1 );
            _self.setProperty("orbitx", 0 ); _self.setProperty("orbity", 0 );_self.setProperty("orbitz", 0 );
            _self.setProperty("distance", 4 );
        }
        var step = 0;
        var iid = window.setInterval(function(){
            var s1 = 0.7, s2 = 1 - s1;
            if( step++ > 20 ) window.clearInterval( iid ), iid = 0;
            _self.setProperty("movex", !iid?0:s1*_self.movex ); 
            _self.setProperty("movey", !iid?0:s1*_self.movey ); 
            _self.setProperty("zoomx", !iid?1:s2+s1*_self.zoomx ); 
            _self.setProperty("zoomy", !iid?1:s2+s1*_self.zoomy ); 
            _self.setProperty("orbitx", !iid?0:s2*0+s1*_self.orbitx ); 
            _self.setProperty("orbity", !iid?0:s2*0+s1*_self.orbity ); 
            _self.setProperty("distance", !iid?4:s2*4+s1*_self.distance); 
        },20);
    }

    this.$copySubPos = function(t){
		t.left   = subpos.left,  t.top    = subpos.top;
		t.width  = subpos.width, t.height = subpos.height;
    }

    this.$mouseDown = function(x,y,bt,keys){
        if(bt == 3) this.resetView();
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
            (n = d[i++]).$mouseDown(x,y,bt,keys);
        }
    }
    
    this.$mouseUp = function(x,y){
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
            (n = d[i++]).$mouseUp(x,y);
        }
    }
    
    this.$mouseMove = function(dx,dy,bt,ox,oy,lx,ly,keys){
        // send mouseMove to charts
        //document.title = lx+' '+ly+this.left;
        var cx = subpos.left, cy = subpos.top;
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
            (n = d[i++]).$mouseMove(dx,dy, bt, ox-cx, oy-cy, lx-cx, ly-cy,keys);
        }
        dx = dx / subpos.width, dy = dy / subpos.height; 
        var zx = this.zoomx, zy = this.zoomy, zz = this.zoomz, v;
        this.mousex=lx/subpos.width;
        this.mousey=ly/subpos.height;
        if(ox<subpos.left)dx = 0;
        if(oy>subpos.top+subpos.height)dy = 0;

        //2D interaction mode
        if( this.mode=='2D' ) {
            if( bt == 1 ) {
                this.$tilex-=dx*subpos.width;
                this.$tiley-=dy*subpos.height;
                
                this.setProperty("movex",  this.movex + dx * this.zoomx );
                this.setProperty("movey",this.movey + dy * this.zoomy );
                
            } else if(bt==2) {
                var tx = (ox - subpos.left)/subpos.width, 
                    ty = 1-((oy - subpos.top)/subpos.height);
                this.setProperty("zoomx", (v=this.zoomx * (1 - 4*dx))<0.001?0.001:(v>10000?10000:v)  );
                this.setProperty("zoomy", (v=this.zoomy * (1 - 4*dy))<0.001?0.001:(v>10000?10000:v) );
                this.setProperty("movex", this.movex - (zx-this.zoomx)*tx );
                this.setProperty("movey", this.movey + (zy-this.zoomy)*ty );
            }
        } else {
            if(bt == 1){
            
                if(keys&1){
                // lets project the camera on the floor and 
                    this.setProperty("movex", this.movex + dx * this.zoomx * 1.5 );
                    this.setProperty("movey", this.movey + dy * this.zoomy * 1.5 );
                }else if(keys&2){
                    this.setProperty("movex", this.movex + dx * this.zoomx * 1.5 );
                    this.setProperty("movez", this.movez - dy * this.zoomz * 1.5 );
                }else{
                    this.setProperty("orbitx", this.orbitx - 4*dx );
                    this.setProperty("orbity", this.orbity + 4*dy );
                }
            } else if(bt == 2){
                if(keys&1){
                    this.setProperty("zoomx", (v=this.zoomx * (1 - 4*dx))<0.001?0.001:(v>10000?10000:v)  );
                    this.setProperty("zoomy", (v=this.zoomy * (1 - 4*dy))<0.001?0.001:(v>10000?10000:v) );
                    this.setProperty("movex", this.movex - (zx-this.zoomx)*0.5 );
                    this.setProperty("movey", this.movey + (zy-this.zoomy)*0.5);
                }else if(keys&2){
                    this.setProperty("zoomx", (v=this.zoomx * (1 - 4*dx))<0.001?0.001:(v>10000?10000:v)  );
                    this.setProperty("zoomz", (v=this.zoomz * (1 - 4*dy))<0.001?0.001:(v>10000?10000:v) );
                    this.setProperty("movex", this.movex - (zx-this.zoomx)*0.5 );
                    this.setProperty("movez", this.movez + (zz-this.zoomz)*0.5 );
               
                }else{
                    this.setProperty("distance", Math.min(Math.max( this.distance* (1 - 4*dy), 1 ),100) );
                }
            }
        }
        //this.drawAxis();
    }
    
    this.$mouseWheel = function(x,y,d,keys){
        var zx = this.zoomx, zy = this.zoomy, zz = this.zoomz,v,
            tx = (x - subpos.left)/subpos.width, 
            ty = 1-((y - subpos.top)/subpos.height);
        
        if(this.mode=='2D'){
            
            if(!this.lockxzoom)this.setProperty("zoomx", (v=this.zoomx * (1 - 0.1*d))<0.001?0.001:(v>10000?10000:v)  );
            if(!this.lockyzoom)this.setProperty("zoomy", (v=this.zoomy * (1 - 0.1*d))<0.001?0.001:(v>10000?10000:v) );
            this.setProperty("movex", this.movex - (zx-this.zoomx)*tx );
            this.setProperty("movey", this.movey + (zy-this.zoomy)*ty );
        } else {
            if(keys&1){
                if(!this.lockxzoom)this.setProperty("zoomx", (v=this.zoomx * (1 - 0.1*d))<0.001?0.001:(v>10000?10000:v) );
                if(!this.lockyzoom)this.setProperty("zoomy", (v=this.zoomy * (1 - 0.1*d))<0.001?0.001:(v>10000?10000:v) );
                this.setProperty("movex", this.movex - (zx-this.zoomx)*0.5 );
                this.setProperty("movey", this.movey + (zy-this.zoomy)*0.5 );
            }else if(keys&2){
                if(!this.lockzzoom)this.setProperty("zoomz", (v=this.zoomz * (1 - 0.1*d))<0.001?0.001:(v>10000?10000:v) );
                this.setProperty("movez", this.movez + (zz-this.zoomz)*0.5 );
            }else {
                this.setProperty("distance", Math.min(Math.max( this.distance * (1 - 0.1*d), 3 ),100) );
            }
        }
        this.$redraw();
    }

    this.$propHandlers["left"] = 
    this.$propHandlers["top"] =
    this.$propHandlers["width"] =
    this.$propHandlers["height"] =function(value){ }
    this.$propHandlers["mode"] =  function(value){
        // also all our child charts should recompile
        _style = null;
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)if((n = d[i++]).$drawGraph){
           n.$regenerate();
        }        
        docompile = true;
        this.$redraw(false,true);
    }
    this.$propHandlers["style"] = function(value){
        // lets reparse our style
        _style = null;
        docompile = true;
        this.$redraw(false,true);
    }

    this.$propHandlers["x1"] =
    this.$propHandlers["x2"] =
    this.$propHandlers["y1"] =
    this.$propHandlers["y2"] = 
    this.$propHandlers["z1"] =
    this.$propHandlers["z2"] = 
    this.$propHandlers["t1"] =
    this.$propHandlers["t2"] = 
    this.$propHandlers["x3d"] =
    this.$propHandlers["y3d"] = 
    this.$propHandlers["z3d"] = 
    this.$propHandlers["p3d"] = 
    this.$propHandlers["orbitxanim"]=
    this.$propHandlers["orbityanim"]=
    this.$propHandlers["orbitzanim"]=
    function(value,name){
        this[name] = parseFloat(value);
        this.$redraw();
    }

    this.$propHandlers["movex"] =
    this.$propHandlers["movey"] =
    this.$propHandlers["movez"] =
    this.$propHandlers["zoomx"] =
    this.$propHandlers["zoomy"] =
    this.$propHandlers["zoomz"] =
    this.$propHandlers["distance"] =
    this.$propHandlers["orbitx"] =
    this.$propHandlers["orbity"] =
    this.$propHandlers["orbitz"] =
    function(value,name){
        this[name] = parseFloat(value);
        this.$redraw();
    }
    
    this.$redraw = function(now,resize){
        // call parent to repaint
        if(this.$parentChart)
            this.$parentChart.$redraw(now,resize);
    }
    
	this.$calcViewport = function() {
		var x1 = this.x1, 
            y1 = this.y1, 
            z1 = this.z1,
            w = this.x2 - x1, 
            h = this.y2 - y1, 
            d = this.z2 - z1;
        this.orbitx += this.orbitxanim;
        this.orbity += this.orbityanim;
        this.orbitz += this.orbitzanim;
        this.a = this.$parentChart.a;
        this.b = this.$parentChart.b;
        this.c = this.$parentChart.c;
        this.d = this.$parentChart.d;
        this.rx = this.orbity, this.ry =  this.orbitx, this.rz = this.orbitz+3.141516;
        this.tx  = 0, this.ty = 0, this.tz = -this.distance;
        this.vx2 = (this.vx1 = x1 + this.movex * -w) + this.zoomx * w,
        this.vy2 = (this.vy1 = y1 + this.movey * h) + this.zoomy * h;
        this.vz2 = (this.vz1 = z1 + this.movez * d) + this.zoomz * d;
	}
    
    this.$drawAxis = function (doresize) {
		this.$calcViewport();
		if(doinit){
            doinit = false;
            this.$parentChart.$copyPos(this);
			jpf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentChart.$copyPos(this);
            if(_style)this.$parentChart.$copyPos(subpos, _style.margin);
 			jpf.draw.resizeLayer(this, this.$parentChart);
		}
		
        // check if we need to recompile
        
        if(docompile){
            docompile = false;
            var err = {};
			var mode = 'axis'+this.mode;
            
            // go and reparse style
            if(!_style) _style = 
                jpf.draw.parseStyle( jpf.chart_draw['_'+mode], this.style, err );
            
            if(_style)this.$parentChart.$copyPos(subpos, _style.margin);
            else this.$parentChart.$copyPos(subpos);
            // recompile drawing code
            this.$drawCode  = jpf.chart_draw[mode]( this, _style );
            
        }
        if(this.$drawCode){
            this.$drawCode( this, this );
        }
    
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)if((n = d[i++]).$drawGraph){
            n.$tilex=this.$tilex, n.$tiley=this.$tiley,
            n.zoomx = this.zoomx,n.zoomy = this.zoomy,n.zoomz = this.zoomz;
			n.p3d = this.p3d;
            n.a = this.a;n.b=this.b;n.c=this.c;n.d=this.d;
            n.$drawGraph( this, doresize );
        }
    }

    this.$loadJml = function(x, obj){
        this.$parentChart = this.parentNode;

        jpf.JmlParser.parseChildren(x, this.$parentChart.oExt, this);

        this.$redraw();
     }
});


jpf.graph = jpf.component(jpf.NODE_VISIBLE, function(){
    //this.$supportedProperties = ["type","series","formula"];
    this.$focussable = false;

    this.$drawCode = 0;
    var _style = null;
	var docompile = true;
	var doinit = true;
	
	var _self  = this;
    var microtime = 0;
	this.$datasource = null;
    this.$datamode = null;
	this.$datatype = null;
    this.dataslice = '1X';
    this.steps = 100;
    this.$data = null;
    this.$tilex = 0;
    this.$tiley = 0;
    this.m={x:0,y:0};
    this.nc = 0;
    this.$propHandlers["left"] = 
    this.$propHandlers["top"] =
    this.$propHandlers["width"] =
    this.$propHandlers["height"] =function(value){
    }
    
    this.$propHandlers["series"] = function(value){
        var v_yval = this.v_yval  = [];
        var v_xval = this.v_xval  = [];
        var v_zval = this.v_zval  = [];
        var v_time = this.v_time  = [];
        var v_caption = this.v_caption  = []; // mouseover title
        var v_class = this.v_class = []; // class
        var v_state = this.v_state = []; // class
        this.v_stateresolve = false;
        // x / y value array
        var p,v,n,k,l,t = (new Date()).getTime()*0.001;
        var series, split, delim, caption, cls, formula, length, mip;
        if (typeof value == "string") {
            series  = value;
            split   = ",";
            delim   = " ";
            css     = "#";
            caption = null;
        }
        else {
            series   = value.series;
            split    = value.split;
            caption  = value.caption;
            delim    = value.delim;
            css      = value.css;
            formula  = value.formula;
            length   = value.length;
        }
        
        if (!series)
            return;
        if(formula){
            //alert(formula);
            var mdl = this.getModel();
            if(!mdl.v_yval){
                var f = new Function('length','v_yval',jpf.draw.baseMacro(
                        ["for(v = 0;v<length;v++){",
                            "v_yval[v] = ",[formula],";",
                        "}"]));
                f(length,v_yval);
                mdl.v_yval = v_yval;
            } else v_yval = mdl.v_yval;
            // now we need to generate the v_yval mipmapping array
            if(this.mipstep>1){
                var step = this.mipstep;
                // lets switch mipdiv type
                var v_yvalmip = this.v_yvalmip = [v_yval];
                var newd = [], oldd = v_yval,i, j, v, n, m, c;

                switch(this.mipset){
                    case 'avg':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v / step;
                                    v = oldd[n];
                                }else v += oldd[n];
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'add':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else v += oldd[n];
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'min':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else if( v > (c=oldd[n])) v = c;
                            }
                            oldd= newd, newd = [];
                        }
                    break;
                    case 'max':
                        while(oldd.length>10){
                            v_yvalmip.push(newd);
                            for(j=0,n=0,m=oldd.length;n<m;n++){
                                if(!(n%step)){
                                    if(n) newd[j++] = v;
                                    v = oldd[n];
                                }else if( v < (c=oldd[n])) v = c;
                            }
                            oldd= newd, newd = [];
                        }
                    break;                
                }
                this.$datamode = 'series';
            }   
        }else{
            p = series.split(delim);
            for( v = 0; v < p.length; v++ ){
                
                this.v_time[v] = t;
                n = p[v].split(css);
                // todo, add support for procedural class selection
                this.v_state[v] = 0;
                if(n.length>1){// we have a clsname
                    this.v_class[v] = n[1];
                }
                
                if(caption){
                    k = n[0].split(caption);
                    if(k.length>1)
                        v_caption[v] = k[1];
                    k=k[0].split(split);
                }else k = n[0].split(split);
                var dim = 1;
                if ((l = k.length) > 0){
                    if (l == 1)
                        v_yval[v] = parseFloat(k[0]);
                    else if (l >= 2){
                        v_xval[v] = parseFloat(k[0]);
                        v_yval[v] = parseFloat(k[1]);
                        if(l>=3)
                            v_zval[v] = parseFloat(k[2]);
                    }
                }
            }
            // lets pick a series type
            this.$datamode = 'series';
            
        }
        // set source type
    }
    
    this.$propHandlers["formula"] = function(value){
        this.pformula = jpf.draw.parseJSS(value);
        // set source type
        this.$datamode = 'math';
        this.docompile = true;
    }
    
    this.$propHandlers["mode"] = function(value){
        this.$regenerate();
    }

    this.$propHandlers["style"] = function(value){
        this.$regenerate();
    }
    
    this.$propHandlers["a"] = 
    this.$propHandlers["b"] =
    this.$propHandlers["c"] = 
    this.$propHandlers["d"] = function(value){
        this.$redraw();
    }
    
    this.$redraw = function(now,resize){
        // call parent to repaint
        if(this.$parentChart)
            this.$parentChart.$redraw(now,resize);
    }
    
    this.$regenerate = function(){
        _style = null;
        docompile = true;
    }
    
    this.$drawGraph = function( v, doresize ){
		if(doinit){
            doinit = false;
            this.$parentAxis.$copySubPos(this);
			jpf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentAxis.$copySubPos(this);
 			jpf.draw.resizeLayer(this, this.$parentChart);
		}
	    
		if(docompile){
			// if we dont have a sourcetype, the data is not ready yet
			if(!this.$datamode) return this.$redraw();
		
            docompile = false;
            var err = {};
			var mode = this.mode+this.$parentAxis.mode;
            // go and reparse style
           if(!_style)_style = 
                    jpf.draw.parseStyle( jpf.chart_draw['_'+mode], this.style, err );
            if(_style.graph && _style.graph.$clslist && this.v_class){
                for(var t,c = this.v_class,s = this.v_state,i=0,j=c.length;i<j;i++){
                    if(t=c[i]){
                        s[i] = _style.graph.$clslist[t];
                    }
                }
            }
            //alert(this.$datatype);
			this.$datatype = jpf.chart_draw['dt_'+this.$datamode+this.dataslice](this);
			this.$drawCode  = jpf.chart_draw[mode]( this, this.$datatype, _style );
            // we'll also have to compile the balloon and knob code.
        }
	
        if (this.$drawCode){
            this.$drawCode( this, v);
            if(this._anim){
                this.$redraw();
            }
        }
    }
    
    this.$drawBalloons = function(v, doresize){
        if(doinit){
            doinit = false;
			jpf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentAxis.$copySubPos(this);
 			jpf.draw.resizeLayer(this, this.$parentChart);
		}
	    
		if(docompile){
			// if we dont have a sourcetype, the data is not ready yet
			if(!this.$datamode) return this.$redraw();
		
            docompile = false;
            var err = {};
			var mode = this.mode+this.$parentAxis.mode;
            // go and reparse style
           if(!_style)_style = 
                    jpf.draw.parseStyle( jpf.chart_draw['_'+mode], this.style, err );
            if(_style.graph.$clslist && this.v_class){
                for(var t,c = this.v_class,s = this.v_state,i=0,j=c.length;i<j;i++){
                    if(t=c[i]){
                        s[i] = _style.graph.$clslist[t];
                    }
                }
            }
            //alert(this.$datatype);
			this.$datatype = jpf.chart_draw['dt_'+this.$datamode+this.dataslice](this);
			this.$drawCode  = jpf.chart_draw[mode]( this, this.$datatype, _style );
            // lets get some ballooons.
            //this.$balloonCode = jpf.chart_draw[
            // we'll also have to compile the balloon and knob code.
        }
	
        if (this.$drawCode){
            this.$drawCode( this, v);
            if(this._anim){
                this.$redraw();
            }
        }
    }
    
    this.$mouseDown = function(x,y,bt){

    }
    
    this.$mouseUp = function(x,y){

    }
    
    this.lastOver = -1;
    this.$mouseMove = function(dx,dy,bt,ox,oy,lx,ly){
        if (!this.$drawCode) //@todo en zo verder
            return;
        var m = this.m;m.x = lx*this.ds, m.y = ly*this.ds;
        var o = this.$drawCode( this, this.parentNode, this.m), l, nlt;
        var t = (new Date()).getTime()*0.001;
        
        function switchState(i, newstate, oldstate){
            var s,c,ht,v,vn;
            s = (v=_self.v_state[i])&0xffff0000, c = v&0xffff;
            ht = Math.min(1,(t-_self.v_time[i])*(_style.graph.$speedlut?(_style.graph.$speedlut[v]||1):1));
            _self.v_state[i] = vn = c | newstate;
            if(_style.graph.notransit==1 || _style.graph.nogap==1) ht = 1;
            _self.v_time[i]  = s==oldstate?(t-(1-ht)/(_style.graph.$speedlut?(_style.graph.$speedlut[vn]||1):1)):t;
        }
        
        function setState(i, newstate, t, lt){
            var s,c,v,vn;
            s = (v=_self.v_state[i])&0xffff0000, c = v&0xffff;
            _self.v_state[i] = vn = c | newstate, 
            _self.v_time[i]  = (t-(1-lt)/(_style.graph.$speedlut?(_style.graph.$speedlut[vn]||1):1));
        }
        
        if(o!=(l=this.lastOver)){
            var sb = jpf.draw.stateBit;
            // we should remove the over-state from the last
            if(l>=0){
                switchState(l, sb.hoverout, sb.hoverin );
                
                if( _style.graph.nogap==1 &&  t - this.lasttime<0.3 ){
                    if(t-this.lasttime==0){
                        //logw( microtime - this.lastMicro);
                    }
                    var s = this.lastOut, e = l;
                    if( s > e )
                        for(var i = s;i>e;i--)
                            setState(i, sb.hoverout, t - (t-this.lasttime)*(1-(s-i)/(s-e)), 1);
                   else
                        for(var i = s;i<e;i++)
                            setState(i, sb.hoverout, t - (t-this.lasttime)*((e-i)/(e-s)), 1);
                }
                this.lasttime = t, this.lastOut = l, this.lastMicro = microtime;
            }
            if(o>=0){
                switchState(o, sb.hoverin, sb.hoverout );
            }
  
            this.lastOver = o;
			this.$redraw();
        }
    }
    /**** Databinding ****/
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);

        var v_yval = this.v_yval  = [];
        var v_xval = this.v_xval  = [];
        var v_zval = this.v_zval  = [];
        var v_time = this.v_time  = [];
        var v_caption = this.v_caption  = []; // mouseover title
        var v_state = this.v_state = []; // class

        if (this.bindingRules.series) {
            var rule   = this.getNodeFromRule("series", XMLRoot, false, true);
            this.setProperty("series", {
                series  : this.applyRuleSetOnNode("series", XMLRoot),
                split   : rule.getAttribute("split") || ",",
                datatype   : rule.getAttribute("datatype") || "1X",
                caption : rule.getAttribute("caption") || null,
                cls : rule.getAttribute("class") || null,
                delim   : rule.getAttribute("delimeter") || " ",
                formula : rule.getAttribute("formula") || null,
                length :  rule.getAttribute("length") || null,
                mip :  rule.getAttribute("mip") || null
                
            });
        }
        else if (this.bindingRules.formula) {
            this.setProperty("formula", this.applyRuleSetOnNode("formula", XMLRoot));
        }
        else {
            // this.info = [];
            // this.ylabel = {};hoeveel 
            var v_nodes = this.v_nodes  = this.getTraverseNodes(XMLRoot);
            // x / y value array
            var n,p,v,k,length,t = (new Date()).getTime()*0.001;
            if (!this.bindingRules.y){
                jpf.console.warn("No y binding rule found for graph "
                                 + this.name + " [" + this.tagName + "]");
            }
            else {
                var bz = this.bindingRules.z ? true : false, 
                    bx = this.bindingRules.x ? true : false;
                for (v = 0, length = v_nodes.length; v < length; v++) {
                    n = v_nodes[v];
                    //caching
                    //v_cacheid[jpf.xmldb.nodeConnect(this.documentId, n, null, this)] = v;
                
                    this.v_time[v] = t;
                    v_yval[v] = parseFloat(this.applyRuleSetOnNode("y", n));
                    if (bx) {
                        v_xval[v] = parseFloat(this.applyRuleSetOnNode("x", n));
                        if (bz)
                            v_zval[v] = parseFloat(this.applyRuleSetOnNode("z", n));
                    }
                    var cls = this.applyRuleSetOnNode("css", n);
                    v_caption[v] = this.applyRuleSetOnNode("caption", n);
                    //// TODO write code that looks up class
                    v_state[v] = 0;
                }
                this.$sourcetype = 'seriesX';
            }
            //#ifdef __WITH_PROPERTY_BINDING
            if (length != this.length)
                this.setProperty("length", length);
            //#endif
        }
    };
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Clear this component if some ancestor has been detached
        if (action == "redo-remove") {
            var retreatToListenMode = false, model = this.getModel(true);
            if (model) {
                var xpath = model.getXpathByJmlNode(this);
                if (xpath) {
                    var xmlNode = model.data.selectSingleNode(xpath);
                    if (xmlNode != this.xmlRoot)
                        retreatToListenMode = true;
                }
            }
            
            if (retreatToListenMode || this.xmlRoot == xmlNode) {
                //Set Component in listening state untill data becomes available again.
                return model.loadInJmlNode(this, xpath);
            }
        }
    
        if (this.bindingRules.series ||  this.bindingRules.formula) { 
            //Action Tracker Support
            if (UndoObj && !UndoObj.xmlNode)
                UndoObj.xmlNode = this.xmlRoot;
                
            //#ifdef __WITH_PROPERTY_BINDING
            var lrule, rule;
            for (rule in this.bindingRules) {
                lrule = rule.toLowerCase();
                if (this.$supportedProperties.contains(lrule)) {
                    var value = this.applyRuleSetOnNode(rule, this.xmlRoot) || "";

                    if (this[lrule] != value)
                        this.setProperty(lrule, value, null, true);
                }
            }
            // #endif
        }
        else {
            //this should be made more optimal
            var v_yval = this.v_yval  = [];
            var v_xval = this.v_xval  = [];
            var v_zval = this.v_zval  = [];
            var v_time = this.v_time  = [];
            var v_caption = this.v_caption  = []; // mouseover title
            var v_state = this.v_state = []; // class
        
            //cacheid = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
            // this.info = [];
            // this.ylabel = {};hoeveel 
            var v_nodes = this.v_nodes  = this.getTraverseNodes(this.xmlRoot);
            // x / y value array
            var n,p,v,k,length,t = (new Date()).getTime()*0.001;
            if (!this.bindingRules.y){
                jpf.console.warn("No y binding rule found for graph "
                                 + this.name + " [" + this.tagName + "]");
            }
            else {
                var bz = this.bindingRules.z ? true : false, 
                    bx = this.bindingRules.x ? true : false;
                for (v = 0, length = v_nodes.length; v < length; v++) {
                    n = v_nodes[v];
                    //caching
                    //v_cacheid[jpf.xmldb.nodeConnect(this.documentId, n, null, this)] = v;
                
                    this.v_time[v] = t;
                    v_yval[v] = parseFloat(this.applyRuleSetOnNode("y", n));
                    if (bx) {
                        v_xval[v] = parseFloat(this.applyRuleSetOnNode("x", n));
                        if (bz)
                            v_zval[v] = parseFloat(this.applyRuleSetOnNode("z", n));
                    }
                    var cls = this.applyRuleSetOnNode("css", n);
                    v_caption[v] = this.applyRuleSetOnNode("caption", n);
                    //// TODO write code that looks up class
                    v_state[v] = 0;
                }
                this.$sourcetype = 'seriesX';
            }
            //if (this.focussable)
                //jpf.window.focussed == this ? this.$focus() : this.$blur();

            //#ifdef __WITH_PROPERTY_BINDING
            if (length != this.length)
                this.setProperty("length", length);
            //#endif
			this.$redraw();
        }
    }
    
    /**** Selection ****/
    this.$loadJml = function(x,obj){
        this.$parentAxis = this.parentNode;
        this.$parentChart = this.$parentAxis.parentNode;
        
        jpf.JmlParser.parseChildren(x, this.$parentChart.oExt, this);
    }
}).implement(
    jpf.MultiSelect,
    jpf.DataBinding
);
// #endif
 

