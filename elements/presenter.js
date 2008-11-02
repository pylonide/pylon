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

//info mouse wheel function is from http://adomas.org/javascript-mouse-wheel/

// #ifdef __JCHART || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element displaying a skinnable rectangle which can contain other JML elements.
 *
 * @classDescription This class creates a new presenter
 * @return {Presenter} Returns a new  presenter
 * @type {Presenter}
 * @constructor
 * @allowchild {elements}, {anyjml}
 * @addnode elements:bar
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.presenter = jpf.component(jpf.NODE_VISIBLE, function(){
  
	//var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};	
	var timer    = null;
	var _self    = this;
	var engine;

    this.drawSheets = function(){
		for(var i = 0;i<this.childNodes.length;i++){
			this.childNodes[i].drawSheet();
		}
   	}
	
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
    }

	
    this.$loadJml = function(x){
        var oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.oInt = oInt;/*
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(x, oInt, this);*/
			//this.engine = jpf.chart.canvasDraw.init(this);
		this.engine = (jpf.supportVML?jpf.draw.vml:jpf.draw.canvas).init(this);
		
		//var dt = new Date().getTime();
		for (var o, i = 0, j = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			
			if (x.childNodes[i][jpf.TAGNAME] == "sheet") {
				o = new jpf.presenter.sheet(this.oExt, "sheet");
				o.parentNode = this;
				o.engine = this.engine;
				o.$loadJml(x.childNodes[i], this, j++);
				this.childNodes.push(o);
			}
		}
		//lert( (new Date()).getTime() - dt);
        var ox, oy, lx, ly, bt, stack = [], interact = false;
			iebt = [0,1,2,3,3], ffbt = [1,3,2,0,0];

        this.oExt.onmousedown = function(e){
			if (!e) e = event;
			if(e.button>4 || e.button<0)return;
			bt = (_self.canvas)?ffbt[e.button]:iebt[e.button];
			if(!bt)return;
            interact = true;
              lx = e.clientX, ly = e.clientY;
			ox = lx - _self.oExt.offsetLeft, oy = ly - _self.oExt.offsetTop;
			// we need to check if our mousedown was in the axis, ifso send it a mousedown and keep it on our eventstack
			for(var t, i = _self.childNodes.length-1;i>=0;i--){
				t = _self.childNodes[i];
				if( ox >= t.left && ox <= t.left+t.width &&
					oy >= t.top && oy <= t.top+t.height ){
					t.mouseDown(ox - t.left,oy - t.top,bt);
					stack.push( t );
				}
			}
		}
        		
        this.oExt.oncontextmenu = function(){
            return false;   
        }
        
        this.oExt.onmouseup  = 
        function(e){
			if (!e) e = event;
            interact = false;
			var x = e.clientX - _self.oExt.offsetLeft,
				y = e.clientY - _self.oExt.offsetTop;
			for(var i = stack.length-1;i>=0;i--)
				(t=stack[i]).mouseUp(x - t.left, y - t.top);
			stack.length = 0;
        }
      
        this.oExt.onmousemove = function(e){
            if (!interact) return;
            if (!e) e = event;
            var dx = (-lx + (lx=e.clientX)),dy = (-ly + (ly=e.clientY));
			for(var t, i = stack.length-1;i>=0;i--)
				(t = stack[i]).mouseMove(dx,dy,bt,ox-t.left,oy-t.top);
		}
	
		wheelEvent = function(e) {
	        if(!e) e = window.event;
			
			var d = e.wheelDelta? 
				(window.opera ?-1:1) * e.wheelDelta / 120 :  
				(e.detail ? -e.detail / 3 : 0);
			
	        if(d){
				// lets find if we are over a graph
				var x = e.clientX - _self.oExt.offsetLeft,
					y = e.clientY - _self.oExt.offsetTop;
				for(var t, i = 0;i<_self.childNodes.length;i++){
					t = _self.childNodes[i];
					if( x >= t.left && x <= t.left+t.width &&
						y >= t.top && y <= t.top+t.height ){
						t.mouseWheel(x - t.left,y - t.top,d);
					}
				}
			}
	        if(event.preventDefault) event.preventDefault();
	        event.returnValue = false;
	    }
		if (this.canvas && this.oExt.addEventListener){
			this.oExt.addEventListener('DOMMouseScroll', wheelEvent, false);
		}
		this.oExt.onmousewheel = wheelEvent;
		
		// animation stuff for now
		window.setInterval(function(){
			_self.drawLayers();
			//alert((new Date()).getTime()-dt);
		},20);
    }
}).implement(jpf.Presentation);

jpf.presenter.sheet = jpf.subnode(jpf.NODE_HIDDEN, function(){
	this.$supportedProperties = [
		"left","top","width","height","type","viewport",
		"zoom","zoomx", "zoomy","movex", "movey",  
		"orbitx", "orbity", "distance",
	];
	
	this.$draw  = 0;
	this.style = {};
	var _self  = this;
	var timer;
		
	// 2D mouse interaction
	this.zoomx = 1;
	this.zoomy = 1;
	this.movex = 0;
	this.movey  = 0;
	// 3D mouse interaction
	this.orbitx   = -1.2;
	this.orbity   = -1.2;
	this.distance = 4;
	
	// domains
	this.x1 = -1;
	this.y1 = -1;
	this.x2 = 1;
	this.y2 = 1;
	this.t1 = 0;
	this.t2 = 1;
	this.animreset = 1;
	
	this.resetView = function(){
		if(!this.animreset){
			_self.setProperty("movex", 0 ); _self.setProperty("movey", 0 );
			_self.setProperty("zoomx", 1 ); _self.setProperty("zoomy", 1 );
			_self.setProperty("orbitx", 0 ); _self.setProperty("orbity", -1.2 );
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
			_self.setProperty("orbitx", !iid?-1.2:s2*-1.2+s1*_self.orbitx ); 
			_self.setProperty("orbity", !iid?-1.2:s2*-1.2+s1*_self.orbity ); 
			_self.setProperty("distance", !iid?4:s2*4+s1*_self.distance); 
		},20);
	}
	
	this.mouseDown = function(x,y,bt){
		if(bt == 3) this.resetView();
	}
	
	this.mouseUp = function(x,y){
	}
	
	this.mouseMove = function(dx,dy,bt,ox,oy){
		// we need to 
		dx = dx / this.cwidth, dy = dy / this.cheight; 
		var zx = this.zoomx, zy = this.zoomy;
//		document.title = dx+" "+this.movex+" "+this.zoomx;
		if(bt == 1){
			if(ox<this.cleft)dx = 0;
			if(oy>this.ctop+this.cheight)dy = 0;
			this.setProperty("orbitx", this.orbitx - 2*dx  );
			this.setProperty("orbity", this.orbity + 2*dy  );
			this.setProperty("movex", this.movex + dx * this.zoomx );
			this.setProperty("movey", this.movey + dy * this.zoomy );
		}else if(bt==2){
			var tx = (ox - this.cleft)/this.cwidth, 
				ty = (oy - this.ctop)/this.cheight;
			this.setProperty("distance", Math.min(Math.max( this.distance * 
					(1 - 4*dy), 3 ),100) );
			this.setProperty("zoomx", this.zoomx * (1 - 4*dx)  );
			this.setProperty("zoomy", this.zoomy * (1 - 4*dy) );
			this.setProperty("movex", this.movex - (zx-this.zoomx)*tx );
			this.setProperty("movey", this.movey - (zy-this.zoomy)*ty );
		}
		//this.drawAxis();
	}
	
	this.mouseWheel = function(x,y,d){
		var zx = this.zoomx, zy = this.zoomy,
			tx = (x - this.cleft)/this.cwidth, 
			ty = (y - this.ctop)/this.cheight;
		
		this.setProperty("distance", Math.min(Math.max( this.distance * 
			(1 - 0.1*d), 3 ),100) );
		this.setProperty("zoomx", this.zoomx * (1 - 0.1*d)  );
		this.setProperty("zoomy", this.zoomy * (1 - 0.1*d) );
		this.setProperty("movex", this.movex - (zx-this.zoomx)*tx );
		this.setProperty("movey", this.movey - (zy-this.zoomy)*ty );
	}

    this.handlePropSet = function(prop, value, force) {
		switch(prop){
			case "top":
			case "height":
			case "left":
			case "width":
				if (!timer) {
					timer = setTimeout(function(){
						_self.resize();
						timer = null;
					});
				}
			break;
		}
		this[prop] = value;
    }
	
	this.resize = function(){
		//this.width this.left
	}
		
	this.drawSheet = function () {
		var p = this,
			l = this,
			x1 = l.x1, y1 = l.y1,
			x2 = l.x2, y2 = l.y2,
			w = x2 - x1, h = y2 - y1, tx ,ty;
		
		if( l.is3d ) {
			// lets put in the orbit and distance
			l.rx = p.orbity, l.ry = 0, l.rz = p.orbitx;
			l.tx = 0, l.ty = 0, l.tz = -p.distance;
		} else {
			// lets calculate the new x1/y1 from our zoom and move
			tx = p.movex * -w, ty = p.movey * -h;
			x1 = x1 + tx, x2 = x1 + w*p.zoomx;
			y1 = y1 + ty, y2 = y1 + h*p.zoomy;
		}
		l.vx1 = x1, l.vy1 = y1, l.vx2 = x2, l.vy2 = y2;

		//var dt=(new Date()).getTime();
		//for(var j = 0;j<100;j++)
			l.griddraw( l, l );
		//document.title = ((new Date()).getTime()-dt)/100;

		for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
			(n = d[i++]).$draw(n, l);
		}
	}

	this.$loadJml = function(x, obj, order){
		this.$jml     = x;
		
		if (x.getAttribute("id"))
			jpf.setReference(x.getAttribute("id"), this);
		
		// just stuff attributes in properties
		for (var attr = x.attributes, i = attr.length-1, a; i>=0; i--){
			a = attr[i]; this[a.nodeName] = a.nodeValue;
		}

		if(order==0)this.firstlayer = 1; 
		// overload /joinparent style string
		this.stylestr = (this.parentNode.style || "")+" "+ this.style;
		
		// coordinates scaled to parent for now
		this.left 	 = (this.left || 0) * this.parentNode.oExt.offsetWidth;
		this.top 	 = (this.top || 0)  * this.parentNode.oExt.offsetHeight;
		this.width 	 = (this.width || 1) * (this.parentNode.oExt.offsetWidth);
		this.height  = (this.height || 1) * (this.parentNode.oExt.offsetHeight);
		// our grid is styled with margins, we need to setup our childlayers to be clipped to it
		this.type = this.type || "2D";
		this.is3d = this.type.match( "3D" );

		this.engine.initLayer(this, this);
		this.style 	   = jpf.draw.parseStyle( (a=jpf.visualize.defaultstyles),
											  a['grid'+this.type], this.stylestr );

		this.cleft   = this.left+(this.style.margin?
			this.style.margin.left:0);
		this.ctop	 = this.top+(this.style.margin?
			this.style.margin.top:0);
		this.cwidth  = this.width - (this.style.margin?
			(this.style.margin.right+this.style.margin.left):0);
		this.cheight = this.height - (this.style.margin?
			(this.style.margin.bottom+this.style.margin.top):0);
		// initialize drawing function
		var dt = (new Date()).getTime();
		this.griddraw  = jpf.visualize['grid'+this.type]( this, 
			this.engine, this.style );
		
		// init graph layers with proper drawing viewport
		// after each draw, we should have the lines x and y positions in an array ready to be drawn in text, or looked up to text.
		
		for (var o, i = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			if (x.childNodes[i][jpf.TAGNAME] == "layer") {
				o = new jpf.presenter.layer(this.oExt, "layer");
				o.parentNode = this;
				o.engine = this.engine;
				// add some margins for the childnodes
				o.left = this.cleft,  o.top = this.ctop,
				o.width = this.cwidth,o.height = this.cheight;
				o.$loadJml(x.childNodes[i]);
				// expand our viewport
				if( o.x1 !== undefined && o.x1 < this.x1 ) this.x1 = o.x1; 
				if( o.y1 !== undefined && o.y1 < this.y1 ) this.y1 = o.y1;
				if( o.x2 !== undefined && o.x2 > this.x2 ) this.x2 = o.x2; 
				if( o.y2 !== undefined && o.y2 > this.y2 ) this.y2 = o.y2;
				this.childNodes.push(o);
			}
		}
		// lets calculate the viewport, if none given
		if(this.viewport || this.x2<this.x1){
			this.viewport = this.viewport || "-1,-1,1,1";
			i = this.viewport.split(",");
			this.x1 = parseFloat(i[0]), this.y1 = parseFloat(i[1]), 
			this.x2 = parseFloat(i[2]), this.y2 = parseFloat(i[3]);
		}
	}
});

jpf.presenter.layer = jpf.subnode(jpf.NODE_HIDDEN, function(){

	this.$supportedProperties = ["type","series","formula"];
	
	this.data = 0;
	this.style = {};

    this.handlePropSet = function(prop, value, force) {
        this[prop] = value;
    }
	
	this.$loadJml = function(x,obj){
        this.$jml     = x;
		
		if (x.getAttribute("id"))
			jpf.setReference(x.getAttribute("id"), this);
		
		this.engine = this.parentNode.engine;
		this.perspective = this.parentNode.perspective;
		
		// just stuff attributes in properties
		for (var attr = x.attributes, i = attr.length-1, a; i>=0; i--){
			a = attr[i]; this[ a.nodeName ] = a.nodeValue;
		}

		// overload /joinparent style string
		this.stylestr = (this.parentNode.parentNode.style || "")+" "+ this.style;
		// check the sourcetype
		this.source='mathX';
		this.type += this.parentNode.type;

		this.engine.initLayer(this, this);
		this.style 	   = jpf.draw.parseStyle((a=jpf.visualize.defaultstyles), 
											 a[this.type], this.stylestr );
		this.datasource = jpf.visualize.datasource[this.source]( this );
		this.$draw  	= jpf.visualize[this.type](this, 
								this.engine, this.datasource);
	}
});

// #endif
 

