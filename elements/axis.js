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

 apf.Axis     = function(struct, tagName){
    this.$init(tagName || "axis", apf.NODE_VISIBLE, struct);
    this.$subpos = {left:0,right:0,width:1,height:1};
};

apf.aml.setElement("axis", apf.Axis);
 
(function(){
    this.$supportedProperties = [
        "left","top","width","height","mode",
        "zoom","zoomx", "zoomy","movex", "movey",  
        "orbitx", "orbity", "distance",
        "x1","x2","y1","y2","z1","z2","t1","t2",
        "x3d","y3d","z3d","p3d",
        "orbitxanim","orbityanim","orbitzanim"
    ];

    //this.$attrExcludePropBind = apf.extend({
    //���style : 1
    //}, this.$attrExcludePropBind);
 
    this.$drawCode  = 0;
    this.$_style = null;
    this.$docompile = true;
	this.$doinit = true;
    
    this.$timer;
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
	this.$styletag = '';
	this.style = '';
    this.mode = '2D';
    this.left = 0,this.top = 0, this.width = 0,this.height = 0;
    this.resetView = function(){
        if(!this.animreset){
            this.setProperty("movex", 0 ); this.setProperty("movey", 0 );this.setProperty("movez", 0 );
            this.setProperty("zoomx", 1 ); this.setProperty("zoomy", 1 );this.setProperty("zoomz", 1 );
            this.setProperty("orbitx", 0 ); this.setProperty("orbity", 0 );this.setProperty("orbitz", 0 );
            this.setProperty("distance", 4 );
        }
        var step = 0;
		var _self = this;
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
		t.left   = this.$subpos.left,  t.top    = this.$subpos.top;
		t.width  = this.$subpos.width, t.height = this.$subpos.height;
    }

    this.$mouseDown = function(x,y,bt,keys){
        if(bt == 3) this.resetView();
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)
			if((n = d[i++]).$mouseDown)
				n.$mouseDown(x,y,bt,keys);
    }
    
    this.$mouseUp = function(x,y){
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)
			if((n = d[i++]).$mouseUp)
				n.$mouseUp(x,y);
    }
    
    this.$mouseMove = function(dx,dy,bt,ox,oy,lx,ly,keys){
        // send mouseMove to charts
        //document.title = lx+' '+ly+this.left;
        var cx = this.$subpos.left, cy = this.$subpos.top;
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)
			if((n = d[i++]).$mouseMove)
				n.$mouseMove(dx,dy, bt, ox-cx, oy-cy, lx-cx, ly-cy,keys);

		dx = dx / this.$subpos.width, dy = dy / this.$subpos.height; 
        var zx = this.zoomx, zy = this.zoomy, zz = this.zoomz, v;
        this.mousex=lx/this.$subpos.width;
        this.mousey=ly/this.$subpos.height;
        if(ox<this.$subpos.left)dx = 0;
        if(oy>this.$subpos.top+this.$subpos.height)dy = 0;

        //2D interaction mode
        if( this.mode=='2D' ) {
            if( bt == 1 ) {
                this.$tilex-=dx*this.$subpos.width;
                this.$tiley-=dy*this.$subpos.height;
                
                this.setProperty("movex",  this.movex + dx * this.zoomx );
                this.setProperty("movey",this.movey + dy * this.zoomy );
                
            } else if(bt==2) {
                var tx = (ox - this.$subpos.left)/this.$subpos.width, 
                    ty = 1-((oy - this.$subpos.top)/this.$subpos.height);
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
            tx = (x - this.$subpos.left)/this.$subpos.width, 
            ty = 1-((y - this.$subpos.top)/this.$subpos.height);
         
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
        this.$_style = null;
        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;)if((n = d[i++]).$drawGraph){
           n.$regenerate();
        }        
        this.$docompile = true;
        this.$redraw(false,true);
    }
    this.$propHandlers["style"] = function(value){
        // lets reparse our style
        this.$_style = null;
        this.$docompile = true;
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
		if(this.$doinit){
            this.$doinit = false;
            this.$parentChart.$copyPos(this);
			apf.draw.initLayer(this, this.$parentChart);
		}else if(doresize){
			// resize layer
            this.$parentChart.$copyPos(this);
            if(this.$_style)this.$parentChart.$copyPos(this.$subpos, this.$_style.margin);
 			apf.draw.resizeLayer(this, this.$parentChart);
		}
		
        // check if we need to recompile
        
        if(this.$docompile){
            this.$docompile = false;
            var err = {};
			var mode = 'axis'+this.mode;
            
            if(!this.$_style) this.$_style = 
                apf.draw.parseStyle( apf.chart_draw['_'+mode], this.style+this.$styletag, err );
            
            if(this.$_style)this.$parentChart.$copyPos(this.$subpos, this.$_style.margin);
            else this.$parentChart.$copyPos(this.$subpos);
            // recompile drawing code
            this.$drawCode  = apf.chart_draw[mode]( this, this.$_style );
            
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

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$parentChart = this.parentNode;
		var n = this.getElementsByTagNameNS(apf.ns.apf, "style");
		if(n.length>0)
			this.$styletag = n[0].firstChild.nodeValue.trim().replace(/\t/g,' ');
		
        this.$redraw();
     });
}).call(apf.Axis.prototype = new apf.AmlElement());
// #endif