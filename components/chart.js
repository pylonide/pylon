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
 * Component displaying a skinnable rectangle which can contain other JML components.
 *
 * @classDescription This class creates a new chart
 * @return {Chart} Returns a new chart
 * @type {Chart}
 * @constructor
 * @allowchild {components}, {anyjml}
 * @addnode components:bar
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.chart = jpf.component(jpf.GUI_NODE, function(){
  
	//var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};	
	var timer    = null;
	var _self    = this;
	var engine;

    this.drawLayers = function(){
		for(var i = 0;i<this.childNodes.length;i++){
			this.childNodes[i].drawAxis();
		}
   	}
	
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
    }

	
    this.__loadJml = function(x){
        var oInt = this.__getLayoutNode("main", "container", this.oExt);
        this.oInt = oInt;/*
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(x, oInt, this);*/
        
		//this.engine = jpf.chart.canvasDraw.init(this);
		this.engine = (jpf.supportVML
			? jpf.chart.vmlDraw : 
			jpf.chart.canvasDraw).init(this);
		
		//var dt = new Date().getTime();
		for (var o, i = 0, j = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			
			if (x.childNodes[i][jpf.TAGNAME] == "axis") {
				o = new jpf.chart.axis(this.oExt, "axis");
				o.parentNode = this;
				o.engine = this.engine;
				o.loadJml(x.childNodes[i], this, j++);
				this.childNodes.push(o);
				//alert(this.childNodes.length);
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
		},20);
    }
}).implement(jpf.Presentation);

jpf.chart.axis = jpf.subnode(jpf.NOGUI_NODE, function(){
	this.__supportedProperties = [
		"left","top","width","height","type","viewport",
		"zoom","zoomx", "zoomy","movex", "movey",  
		"orbitx", "orbity", "distance",
	];
	
	this.draw  = 0;
	this.style = {};
	var _self  = this;
	var timer;
	
	/*"id": function(value){
        if (this.name == value)
            return;

        if (self[this.name] == this)
            self[this.name] = null;

        jpf.setReference(value, this);
        this.name = value;
    },*/
	
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
			if(ox<this.style.left)dx = 0;
			if(oy>this.style.top+this.cheight)dy = 0;
			this.setProperty("orbitx", this.orbitx - 2*dx  );
			this.setProperty("orbity", this.orbity + 2*dy  );
			this.setProperty("movex", this.movex + dx * this.zoomx );
			this.setProperty("movey", this.movey + dy * this.zoomy );
		}else if(bt==2){
			var tx = (ox - this.style.left)/this.cwidth, 
				ty = (oy - this.style.top)/this.cheight;
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
			tx = (x - this.style.left)/this.cwidth, 
			ty = (y - this.style.top)/this.cheight;
		
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
		
	this.drawAxis = function () {
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
		// draw our own axis / grid
//		jpf.alert_r(l.drawgrid);
//		var dt = (new Date()).getTime();
//		for(j = 0;j<100;j++)
		l.griddraw( l, l );
//		document.title = (new Date()).getTime() - dt;
		for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
			(n = d[i++]).draw(n, l);
		}
		// we now have the numbers in l.gridx and l.gridy.
		
		// then lets draw the child layers
		//l.textdraw();
				
		// now lets draw axis-labels and edges
	}

	this.loadJml = function(x, obj, order){
		this.jml     = x;
		
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
		this.style 	   = jpf.chart.generic.style.parse( 'grid'+this.type, this.stylestr );

		this.cleft   = this.left+this.style.left;
		this.ctop	 = this.top+this.style.top;
		this.cwidth  = this.width - (this.style.right+this.style.left);
		this.cheight = this.height - (this.style.bottom+this.style.top)
		
		// initialize drawing function
		this.griddraw  = jpf.chart.generic['grid'+this.type]( this, this.engine, this.style );

		this.x1 = this.y1 = 1000000;
		this.y2 = this.x2 = -1000000;
		
		// init graph layers with proper drawing viewport
		// after each draw, we should have the lines x and y positions in an array ready to be drawn in text, or looked up to text.
		
		for (var o, i = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			if (x.childNodes[i][jpf.TAGNAME] == "graph") {
				o = new jpf.chart.graph(this.oExt, "graph");
				o.parentNode = this;
				o.engine = this.engine;
				// add some margins for the childnodes
				o.left = this.cleft,  o.top = this.ctop,
				o.width = this.cwidth,o.height = this.cheight;
				o.loadJml(x.childNodes[i]);
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

jpf.chart.graph = jpf.subnode(jpf.NOGUI_NODE, function(){

	this.__supportedProperties = ["type","series","formula"];
	
	this.data = 0;
	this.style = {};

    this.handlePropSet = function(prop, value, force) {
        this[prop] = value;
    }

	
	this.loadJml = function(x,obj){
        this.jml     = x;
		
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

		// this.info = [];
		// this.ylabel = {};hoeveel 
		this.xvalue = [];
		this.yvalue = [];
		this.info = [];
		// x / y value array
		var p,v,k,l;
		if(this.series){
			p = (this.series.getAt(" ") != -1) ? this.series.split(" ") : this.series.split(",");
			for( v = 0; v < p.length; v++ ){
				k = p[v].split(",");
				if( l = k.length > 0 ){
					this.xvalue[v] = k[0];
					if( l > 1 ){
						this.yvalue[v] = k[1];
						if( l > 2 ) this.info[v] = k[2];
					}
				}
			}
		}

		this.source='mathX';
		this.type += this.parentNode.type;
		//this.type = 'line2D';
//	alert(this.type);
		// create render layer
		this.engine.initLayer(this, this);
		this.style 		= jpf.chart.generic.style.parse( this.type, this.stylestr );
		this.datasource = jpf.chart.generic.datasource[this.source]( this );
		this.draw  		= jpf.chart.generic[this.type](this, this.engine, this.datasource);
	}
});


// properties need to be present on a layer:
// style 
// vx1, vx2, vy1, vy2
// yvalue, xvalue
// ylabel, xlabel

jpf.chart.generic = {
	datasource : {
		mathX : function(l) {
			return {
				type : 'mathX',
				x1 : 0, x2 : 1, y1 : 0, y2 : 1,
				ix1 : "vx1", 
				ix2 : "vx2+(vx2-vx1)/l.style.steps", 
				ixs : "l.style.steps",
				x : "ix",
				y : jpf.chart.generic.mathParse(l.formula)
			};
		},
		mathXY : function(l){
			var part = l.formula.split(";");
			return {
				type : 'mathXY',
				x1 : -1, x2 : 1, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : "Math.PI*2+(Math.PI*2/(l.style.steps-1))", 
				ixs : "l.style.steps",
				x : jpf.chart.generic.mathParse(part[0]),
				y : jpf.chart.generic.mathParse(part[1]===undefined?part[0]:part[1])
			};
		},
		seriesX : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesX',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				head : "var _yv = l.yvalue;",
				ix1 : "__max(__floor(vx1),0)", 
				ix2 : "__min(__ceil(vx2)+1,_yv.length)", 
				ixs : "ix2-ix1",
				x : "ix",
				y : "_yv[ix]"
			};
		},
		seriesX2 : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesX2',
				head : 'var _xv = l.xvalue, _yv = l.yvalue, _len = _yv.length;',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : "_len", 
				ixs : "_len", 
				begin : "var _lx = vx1, _sf=0;\
						 for(ix=l.ixfirst||0;ix > 0 && _xv[ix]>=vx1 ;ix--);",
				for_ : " && _lx<=vx2",
				if_  : "if( (!_sf && (ix==_len-1 || _xv[ix+1]>=vx1) && ++_sf && (ixfirst=l.ixfirst=ix || 1)) || _sf)",
				x 	 : "(_lx=_xv[ix])",
				y 	 : "_yv[ix]"
			};
		},
		seriesXY : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesXY',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				head : "var _vx = l.xvalue, _vy = l.yvalue, _len = _vy.length;",
				ix1 : 0, 
				ix2 : "_len", 
				ixs : "_len",
				x : "_vx[ix]",
				y : "_vy[ix]"
			};
		}
	},
    style : {
		parse : function( type, str ) {
			// we should return a new object of type 'type'
			var o = {}, style = this[type], k1, v1, k2, v2, t, s;

			for(k1 in style){
				if( ( v1 = style[k1] ) === null) 
					v1 = style[k1] = this[k1]?this[k1]:{};
				if( typeof( v1 ) == 'object' ){
					t = o[k1] = {};
					for(k2 in v1) t[k2] = v1[k2];
				}else o[k1] = v1; 
			}
			// lets overload them with our css-style string
			s = [o];
			str.replace(/([\w\-]+)\s*\{\s*|(\s*\}\s*)|([\w\-]+)\:([^;\}]+);?/g, function( m, no, nc, n, v ){
				// lets see if we have an nc or an no, which should move us up and down the object stack
				if(no) s.push( o = (typeof(o[no]) == 'object') ? o[no] : o[no]={} );
				else if(nc){
					if(s.length<2) alert("FAIL2");
					s.pop(); o = s[s.length-1];
				} else {
					if( v=='null' || v=='undefined' ) o[n] = null;
					else if( parseFloat(v) == v ) o[n] = parseFloat(v);
					else o[n] = v;
				}
			});
			// lets initialize all subobjects of o.
			for(k1 in o){
				if( typeof(t = o[k1]) == 'object'){
					if(t.line === null) delete t.line;
					if(t.fill === null) delete t.fill;
					t.active = (t.fill !== undefined || t.line !== undefined ||
								t.family !== undefined)?1:0;
					t.alpha = t.alpha!==undefined ? t.alpha : 1;
					t.fillalpha = t.fillalpha!==undefined ? t.fillalpha:t.alpha;
					t.gradalpha = t.gradalpha!==undefined ? t.gradalpha:t.fillalpha;
					t.linealpha = t.linealpha!==undefined ? t.linealpha:t.alpha;
					t.angle = t.angle!==undefined ?	t.angle : 0;
					t.weight = t.weight!==undefined ? t.weight : 1
				}
			}
			return o;
		}, 
		plane : {
			line : '#cfcfcf',
			fill : '#e6f1f8',
			weight: 1
		},		
		axis : {
			line : '#000000',
			weight: 1
		},
		hgrid : {
			line : '#cfcfcf',
			fill : '#dfe7f5'
		},
		vgrid : {
			line : '#cfcfcf'
		},		
		bar : {
			sizex: 0.8,
			sizey: 0.8,
			line : '#000000',
			weight : 1,
			fill : 'red'
		},
		font : {
			family : "verdana",
			weight : "normal",
			color : "#00000",
			size : "10pt"
		},
		graph : {
			line : '#000000',
			weight: 1
		},
		grid2D: {
			left : 40,
			top : 50,
			right : 40,
			bottom :50,
			steps : 1,
			plane : null,
			hgrid : null,
			vgrid : null,
			axis : null,
			font : null
		},
		grid3D: {
			left : 0,
			top : 0,
			right : 0,
			bottom :0,
			xsteps : 15,
			ysteps : 15,
			persp : 1,
			grid : null,
			axis : null
		},
		line2D: {
			steps : 100,
			graph : null
		},
		line3D: {
			steps : 50,
			zpos : 0,
			depth : 0.2,
			persp : 1,
			graph : {
				line: '#000000',
				weight : 1,
				fill : 'red'
			}
		}		
	},

	head : "\
		var  _math_,vx1 = v.vx1, vy1 = v.vy1,\n\
		 	 vx2 = v.vx2, vy2 = v.vy2, vw =  vx2-vx1, vh = vy2-vy1,\n\
			 dw = l.dw, dh = l.dh, sw = dw/vw, sh = dh/vh,\n\
			 a=l.a||0, b=l.b||0, c=l.c||0,d=l.d||0,\n\
			 n=(new Date()).getTime()*0.001, e=Math.E, p=Math.PI;",

	begin2D : function(e,l){
		this.e = e, this.l = l;
		return [
			this.head,
			"var x, y, i, j, k;\n",
			e.beginLayer(l)
		].join('');
	},
	
	begin3D : function(e,l){
		this.e = e, this.l = l;
		if(this.l.style.persp<0){ // we have ortho perspective
			this.ortho = 1;
			this.persp = "var persp = __max(dw,dh) / l.style.persp/-v.tz;";
		} else {
			this.ortho = 0;
			this.persp = "var persp = __max(dw,dh) / l.style.persp;";
		}
		return [
			this.head,
			"var  dw2 = l.dw*0.5, dh2 = l.dh*0.5,\n\
			 _ma = __cos(v.rx),_mb = __sin(v.rx),\n\
			 _mc = __cos(v.ry),_md = __sin(v.ry),\n\
			 _me = __cos(v.rz),_mf = __sin(v.rz),\n\
			 m00=_mc*_me,m01=-_mf*_mc,m02=_md,m03=v.tx,\n\
			 m10=(_me*_mb*_md+_mf*_ma),m11=(-_mb*_md*_mf+_ma*_me),m12=-_mb*_mc,m13=v.ty,\n\
			 m20=(-_ma*_md*_me+_mb*_mf),m21=(_ma*_md*_mf+_me*_mb),m22=_ma*_mc,m23=v.tz,\n\
			 x, y, z, _x,_y,_z, zt, i, j, k, _opt_;\n",
			this.persp,
			e.beginLayer(l)
		].join('');
	},
	
	end : function(){
		var r = this.e.endLayer();
		this.e = 0, this.l = 0;
		return r;
	},
	
	poly3DAlloc : function(maxoverlap){
		var s=['var '];
		for(var i = 0;i<maxoverlap;i++)
			s.push((i?",":""),"_tx",i,",_ty"+i);
		s.push(";");
		return s.join('');
	},
	poly3DIndex : function(indices,pts){
		// we want rects between:
		// first we count the doubles
		var v,f=1,i,j = 0,d,pt,q,s = [],
			cc = new Array(pts.length),
			cf = new Array(pts.length);
			
		// calculate which values are used more than once to cache them
		for( i = 0;i<indices.length;i++){
			d = indices[i];	if(d>=0) cc[d]++;
		}
		for( i = 0;i<pts.length;i++){
			if(cc[i]>1)cc[i] = j++;
			else cc[i]=0;
		}
		for(var i = 0;i<indices.length;i++){
			d = indices[i];
			if(d>=0){
				pt = pts[d];
				q=[this.ortho?"":"zt = persp / (m20*"+pt[0]+"+m21*"+pt[1]+"+m22*"+pt[2]+"+m23);",
					"(m00*"+pt[0]+"+m01*"+pt[1]+"+m02*"+pt[2]+"+m03)*"+(this.ortho?"persp":"zt"),
					"(m10*"+pt[0]+"+m11*"+pt[1]+"+m12*"+pt[2]+"+m13)*"+(this.ortho?"persp":"zt")];
				d = f?0:i;
				if(cc[d])q[1]= "_tx"+cc[d]+(cf[d]?"":"="+q[1]), q[2]= "_ty"+cc[d]+(cf[d]++?"":"="+q[2]);
			}; 
			switch(d){
				case -1: f=1;s.push( this.e.close() );break;
				case 0: f=0;s.push( q[0], this.e.moveTo(q[1],q[2]) ); break;
				case indices.length-1: s.push( q[0], this.e.lineTo(q[1],q[2]), this.e.close() );break;
				default: s.push( q[0], this.e.lineTo(q[1],q[2]) ); break;
			}
		}
		return s.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
	},
	do3D : function(f,x,y,z,sx,sy){
		var _x,_y,_z;
		if(typeof x == 'string' && x.match(/[\[\]\*\+\-\/]/))x="(_x="+x+")",_x="_x";
		else x="("+x+")",_x=x;
		if(typeof y == 'string' && y.match(/[\[\]\*\+\-\/]/))y="(_y="+y+")",_y="_y";
		else y="("+y+")",_y=y;
		if(typeof z == 'string' && z.match(/[\[\]\*\+\-\/]/))z="(_z="+z+")",_z="_z";
		else z="("+z+")",_z=z;
		
		var r = [];
		if(!this.ortho)r.push("zt = persp/(m20*"+x+"+m21*"+y+"+m22*"+z+"+m23);");
		r.push(this.e[f]( (sx===undefined?"":sx)+
					  "(m00*"+_x+"+m01*"+_y+"+m02*"+_z+"+m03)*"+(this.ortho?"persp":"zt"),
					  (sy===undefined?"":sy)+
					  "(m10*"+_x+"+m11*"+_y+"+m12*"+_z+"+m13)*"+(this.ortho?"persp":"zt") ) );
		return r.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
	},
	lineTo3D : function(x,y,z,sx,sy){
		return this.do3D("lineTo",x,y,z,sx,sy);
	},
	moveTo3D : function(x,y,z,sx,sy){
		return this.do3D("moveTo",x,y,z,sx,sy);
	},
	mathParse : function(s){
		return s.toLowerCase().replace(/([0-9\)])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"__$1").
		replace(/([^a-z]?)(x|y)([^a-z]?)/g,"$1i$2$3").replace(/(^|[^a-z])t($|[^a-z])/g,"$1ix$3");
	},
		
	cacheArray : function(name, pref, size){
		return "if(!l."+pref+name+" || l."+pref+name+".length<"+size+")l."+
		pref+name+" = new Array("+size+");var "+name+"=l."+pref+name+";";
	},
	
	optimize : function( code ){
		// we should find all constant * matrix operations and optimize them out.
		if(typeof(code) == 'object'){
			for(var i = code.length-1;i>=0;i--)
				if(typeof(code[i]) == 'object')code[i] = code[i].join('');
			code = code.join('');
		}
		var cnt = {},n = 0, s=[];
		code = code.replace(/(m\d\d\*)\(?(\-?\d+(?:\.\d+))?\)/g,function(m,a,b){
			var t = a+b;
			if(cnt[t] === undefined){
				s.push("_mo"+n+"="+t);
				return cnt[t]="_mo"+(n++);
			}
			return cnt[t];
		});
		code = s.length ? code.replace(/\_opt\_/,s.join(',')): code;
		// find used math functions and create local var
		s=[];cnt={};
		code.replace(/\_\_(\w+)/g,function(m,a){
			if(!cnt[a]) s.push("__"+a+"=Math."+a), cnt[a]=1;
		});
		// optimize out const parseInt and const math-operations
		code = code.replace(/(__(\w+)|parseInt)\((\d+\.?\d*)\)/g,function(m,a,b,c){
			if(a=='parseInt')return parseInt(c);
			return Math[b](c);
		});
		code = code.replace(/\(\(?0\)?\+/g,"("); 
		//code = code.replace(/\(([a-z0-9\_]+)\)/g,"$1");
		return s.length ? code.replace(/\_math\_/,s.join(',')): code;
	},
	
	active : function( style, code ){
		return (style.active||style.family)?code.join(""):"";
	},
	
    grid2D : function(l,e){
		var s = l.style, g = this;
		e.allocShape(l, s.plane);
		e.allocShape(l, s.hgrid);
		e.allocShape(l, s.vgrid);
		e.allocShape(l, s.axis);
		e.allocText(l, s.font, 30);
		e.allocDone(l);
	
		var ml = s.left*l.ds, mr = s.right*l.ds,
			mt = s.top*l.ds, mb = s.bottom*l.ds, sh = 0;
		var c = g.optimize([
		g.begin2D(e,l),
		"dw -= ",ml+mr,", dh -= ",mt+mb,
		", sw = dw / vw, sh = dh / vh;",
		"var gridx = [], gridy = [],\
			 gx = __pow(5, __round(__log(vw/5)/__log(5))),\
			 gy = __pow(5, __round(__log(vh/5)/__log(5)));\
		 x = __round(vx1 / gx) * gx - vx1;\
		 y = __round(vy1 / gy) * gy - vy1;\
		if(x<0)gridx.push( x*sw,x+vx1 ),x += gx;\
		for(; x < vw; x += gx){",
			"gridx.push(x*sw,x+vx1 );",
		"};\
		if(y<0)gridy.push(y*sh, y+vy1),y += gy;\
		for(; y < vh; y += gy){",
			"gridy.push(y*sh, y+vy1);",
		"};",
		e.beginTranslate(ml,mt),
		s.plane.active?[ 
			e.beginShape(),
			e.rect(0,0,"dw","dh"),
			e.endShape()
		]:"",
		s.hgrid.active?[ 
			e.beginShape(),
			"for(i = gridy.length-2;i>=2;i-=4){",
				e.rect(0,"gridy[i-2]","dw","gridy[i]-gridy[i-2]")+
			"}",
			e.endShape()
		]:"",
		s.vgrid.active?[ 
			e.beginShape(),
			"for(i = gridx.length-2;i>=2;i-=4){",
				e.rect("gridx[i-2]",0,"gridx[i]-gridx[i-2]","dh")+
			"}",
			e.endShape()
		]:"",
		s.axis.active?[ 
			e.beginShape(),
			"if((i=-vy1*sh)>0 && i<dh){",
				e.moveTo("0","i"),e.lineTo("dw","i"),
			"}",
			"if((i=-vx1*sw)>0 && i<dw){",
				e.moveTo("i","0"),e.lineTo("i","dh"),
			"}",
			e.endShape()
		]:"",
		s.font.active?[
			e.beginText(),
			"for(i = gridx.length-2;i>=0;i-=2){",
				e.drawText("gridx[i]",(l.style.xy?"-vy1*sh":"dh"),
					"gridx[i+1].toFixed(2)"), 
			"}",
			"for(i = gridy.length-2;i>=0;i-=2){",
				e.drawText(l.style.xy?"-vx1*sw":-40*l.ds,"gridy[i]",
					"gridy[i+1].toFixed(2)"), 
			"}",
			e.endText()
		]:"",
		e.endTranslate(),
		g.end()]);
		return new Function('l','v',c);
    },

    grid3D : function(l,e){
		e.allocShape(l,l.style.grid);
		e.allocShape(l,l.style.axis);
		e.allocDone(l);
		var g = this,sx = l.style.xsteps, sy = l.style.ysteps;
		var c = g.optimize([
			g.begin3D(e,l),
			"var dx = (vw)/(",sx,"-1), dy = (vh)/(",sy,"-1);",
			e.beginShape(0,'dw2','dh2'),
			"for(x = vx1, i = 0; i < ",sx,"; x += dx,i++){",
				g.moveTo3D("x",'vy1',0),
				g.lineTo3D('x','vy2',0),
			"}\
			for(y = vy1,j = 0,k = 0; j < ",sy,"; y += dy,j++){",
				g.moveTo3D("vx1","y",0),
				g.lineTo3D('vx2',"y",0),
			"}",
			e.endShape(),
			!e.getValue('showxy',1)?"":(
				e.beginShape(1,'dw2','dh2')+
				g.moveTo3D('vx1',0,0)+g.lineTo3D('vx2',0,0)+
				g.moveTo3D(0,'vy1',0)+g.lineTo3D(0,'vy2',0)+
				(!e.getValue('showz',0)?"":(
					g.moveTo3D(0,0,-1)+g.lineTo3D(0,0,1)) 
				)+
				e.endShape() 
			),
			g.end()]);
		return new Function('l','v',c);
	},
	
	line2D : function( l, e, d ){
		e.allocShape(l, l.style.graph);
		e.allocDone(l);
		var g = this, s = l.style.graph, wrap = s.weight*4;
		var c = g.optimize([
			g.begin2D(e,l),
			e.beginTranslate("-vx1*sw","-vy1*sh"),
			e.beginShape(0),
			"var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"var ixfirst = ix;",
			e.moveTo(d.x+"*sw",d.y+"*-sh"),
			"for(ix+=idx;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
				e.lineTo(d.x+"*sw",d.y+"*-sh"),
			"}", 
			(s.fill===undefined? "" :(
				"ix-=idx;"+e.lineTo(d.x+"*sw+"+wrap, (s.fillout==1?d.y2+"*-sh+":"vy1*sh+dh+")+wrap)+
				"ix=ixfirst;"+e.lineTo(d.x+"*sw-"+wrap, (s.fillout==1?d.y2+"*-sh+":"vy1*sh+dh+")+wrap)
			)),
			e.endShape(),
			e.endTranslate(),
			this.end()]);
		try{		
			return new Function('l','v',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	line3D : function( l, e, d ){
		var g = this, s = l.style, wrap = s.graph.weight*4; 
		e.allocShape(l, s.graph);
		e.allocDone(l);
		var c = g.optimize([
			g.begin3D(e,l),
			e.beginShape(0,"dw2","dh2"),
			"var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"var ixfirst = ix, k = 0, xa, ya, xb, yb, xc, yc, xd, yd;",
			(s.fake==1) ?[
				g.cacheArray('gx','line3D',"ixs"),
				g.cacheArray('gy','line3D',"ixs"),
				g.moveTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"for(k=1,ix+=idx;ix<ix2",d.for_||"",";ix+=idx,k++",d.inc_||"",")",d.if_||"","{",
					g.lineTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"}", 
				"for(k--;k>=0;k--){",
					g.lineTo3D("gx[k]",s.zpos+s.depth,"gy[k]"),
				"}"
			].join('') : [
				g.moveTo3D("xb="+d.x,s.zpos,"yb="+d.y),
				"for(ix+=idx,i=0;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
					"xa = ",d.x,",ya=",d.y,";",
					g.lineTo3D("xa",s.zpos,"ya","x=","y="),
					g.lineTo3D("xa",s.zpos+s.depth,"ya", "xc=","yc="),
					"if(!i){i++;",
						g.lineTo3D("xb",s.zpos+s.depth,"yb"),
					"} else {",
						e.lineTo("xd","yd"), 
					"}",
					e.close(),
					e.moveTo("x","y"),
					"xd=xc, yd=yc, xb = xa, yb = ya;",
				"}",
			].join(''),
			";",
			e.endShape(),
			g.end()]);
		try{		
			return new Function('l','v',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	bar2D : function(l,e,d){
		e.allocShape(l, l.style.bar);
		e.allocDone(l);
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head2D,
			e.beginLayer(l),
			e.beginShape(0,"-vx1*sw","-vy1*sh"),
			"var ix1=",d.ix1,",ix2=",d.ix2,"ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"for(;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
				e.rect( d.x+"*sw", d.y+"*-sh", d.style.bar.sizex+"*idx", 0),
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	
	bar3D : function(l,e){

		e.allocShape(l, l.style.bar );
		e.allocDone(l);
		var vz = l.style.bar.zpos;
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head3D,
			e.beginLayer(l),
			this.poly3DHead(8),
			e.beginShape(0),
			"var lx = vw/",l.style.bar.stepx,",xw, w = lx*",l.style.bar.sizex,
			",d=lx*",l.style.bar.sizey,"+",vz,";",
			// we need the viewing angle, and create a switch with the 8 angles
			"for(x = vx1; x<=vx2; x+=lx){",
				"xw = x+w, z = ",func,";",
				this.poly3DIndex(e,[ 0,1,5,6,7,3,-1,3,2,6,7],
					[["x",vz,0],["xw",vz,0],["xw",vz,"z"],["x",vz,"z"],
					["x","d",0],["xw","d",0],["xw","d","z"],["x","d","z"]]),
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
		
	bar3DXY : function(l,e){
		// we should allocate as many shapes as we have datasets,
		// with different colors
		e.allocShape(l, l.style.bar );
		e.allocDone(l);
		var vz = l.style.bar.zpos;
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head3D,
			e.beginLayer(l),
			this.poly3DHead(8),
			e.beginShape(0),
			"var tx,ty,xw,yw,",
			"lx = vw/",l.style.bar.stepx,",hxwv = 0.5*lx*",l.style.bar.sizex,",",
			"ly = vh/",l.style.bar.stepy,",hywv = 0.5*ly*",l.style.bar.sizey,";",
			// we need the viewing angle, and create a switch with the 8 angles
			"for(y = vy1; y<=vy2; y+=ly){",
				"for(x = vx1; x<=vx2; x+=lx){",
					"tx = x-hxwv, ty = y-hywv, xw = x+hxwv, yw = y+hywv, z = ",func,";",
					this.poly3DIndex(e,[ 0,1,5,6,7,3,-1,3,2,6,7],
						[["tx","ty",0],["xw","ty",0],["xw","ty","z"],["tx","ty","z"],
						["tx","yw",0],["xw","yw",0],["xw","yw","z"],["tx","yw","z"]]),
				"}",
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	}
}

jpf.chart.canvasDraw = {
    canvas : null,
	init : function(o){
	              
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", o.canvaswidth = o.oInt.offsetWidth);
        canvas.setAttribute("height", o.canvasheight = o.oInt.offsetHeight);
        canvas.className = "canvas";		
        o.oInt.appendChild(canvas);
        o.canvas = canvas.getContext('2d');
		return this;
    },
   	
	colors : {
		aliceblue:'#f0f8ff',antiquewhite:'#faebd7',aqua:'#00ffff',
		aquamarine:'#7fffd4',azure:'#f0ffff',beige:'#f5f5dc',bisque:'#ffe4c4',
		black:'#000000',blanchedalmond:'#ffebcd',blue:'#0000ff',
		blueviolet:'#8a2be2',brown:'#a52a2a',burlywood:'#deb887',
		cadetblue:'#5f9ea0',chartreuse:'#7fff00',chocolate:'#d2691e',
		coral:'#ff7f50',cornflowerblue:'#6495ed',cornsilk:'#fff8dc',
		crimson:'#dc143c',cyan:'#00ffff',darkblue:'#00008b',darkcyan:'#008b8b',
		darkgoldenrod:'#b8860b',darkgray:'#a9a9a9',darkgrey:'#a9a9a9',
		darkgreen:'#006400',darkkhaki:'#bdb76b',darkmagenta:'#8b008b',
		darkolivegreen:'#556b2f',darkorange:'#ff8c00',darkorchid:'#9932cc',
		darkred:'#8b0000',darksalmon:'#e9967a',darkseagreen:'#8fbc8f',
		darkslateblue:'#483d8b',darkslategray:'#2f4f4f',
		darkslategrey:'#2f4f4f',darkturquoise:'#00ced1',darkviolet:'#9400d3',
		deeppink:'#ff1493',deepskyblue:'#00bfff',dimgray:'#696969',
		dimgrey:'#696969',dodgerblue:'#1e90ff',firebrick:'#b22222',
		floralwhite:'#fffaf0',forestgreen:'#228b22',fuchsia:'#ff00ff',
		gainsboro:'#dcdcdc',ghostwhite:'#f8f8ff',gold:'#ffd700',
		goldenrod:'#daa520',gray:'#808080',grey:'#808080',green:'#008000',
		greenyellow:'#adff2f',honeydew:'#f0fff0',hotpink:'#ff69b4',
		indianred:'#cd5c5c',indigo:'#4b0082',ivory:'#fffff0',khaki:'#f0e68c',
		lavender:'#e6e6fa',lavenderblush:'#fff0f5',lawngreen:'#7cfc00',
		lemonchiffon:'#fffacd',lightblue:'#add8e6',lightcoral:'#f08080',
		lightcyan:'#e0ffff',lightgoldenrodyellow:'#fafad2',lightgray:'#d3d3d3',
		lightgrey:'#d3d3d3',lightgreen:'#90ee90',lightpink:'#ffb6c1',
		lightsalmon:'#ffa07a',lightseagreen:'#20b2aa',lightskyblue:'#87cefa',
		lightslategray:'#778899',lightslategrey:'#778899',
		lightsteelblue:'#b0c4de',lightyellow:'#ffffe0',lime:'#00ff00',
		limegreen:'#32cd32',linen:'#faf0e6',magenta:'#ff00ff',maroon:'#800000',
		mediumaquamarine:'#66cdaa',mediumblue:'#0000cd',
		mediumorchid:'#ba55d3',mediumpurple:'#9370d8',mediumseagreen:'#3cb371',
		mediumslateblue:'#7b68ee',mediumspringgreen:'#00fa9a',
		mediumturquoise:'#48d1cc',mediumvioletred:'#c71585',
		midnightblue:'#191970',mintcream:'#f5fffa',mistyrose:'#ffe4e1',
		moccasin:'#ffe4b5',navajowhite:'#ffdead',navy:'#000080',
		oldlace:'#fdf5e6',olive:'#808000',olivedrab:'#6b8e23',orange:'#ffa500',
		orangered:'#ff4500',orchid:'#da70d6',palegoldenrod:'#eee8aa',
		palegreen:'#98fb98',paleturquoise:'#afeeee',palevioletred:'#d87093',
		papayawhip:'#ffefd5',peachpuff:'#ffdab9',peru:'#cd853f',pink:'#ffc0cb',
		plum:'#dda0dd',powderblue:'#b0e0e6',purple:'#800080',red:'#ff0000',
		rosybrown:'#bc8f8f',royalblue:'#4169e1',saddlebrown:'#8b4513',
		salmon:'#fa8072',sandybrown:'#f4a460',seagreen:'#2e8b57',
		seashell:'#fff5ee',sienna:'#a0522d',silver:'#c0c0c0',skyblue:'#87ceeb',
		slateblue:'#6a5acd',slategray:'#708090',slategrey:'#708090',
		snow:'#fffafa',springgreen:'#00ff7f',steelblue:'#4682b4',tan:'#d2b48c',
		teal:'#008080',thistle:'#d8bfd8',tomato:'#ff6347',turquoise:'#40e0d0',
		violet:'#ee82ee',wheat:'#f5deb3',white:'#ffffff',whitesmoke:'#f5f5f5',
		yellow:'#ffff00',yellowgreen:'#9acd32'
	},
	
	rgba : function(c, a){
		c = c.toLowerCase();
		if(this.colors[c]!==undefined)	c = this.colors[c];
		if(a===undefined || a==1) return c;
		//a *= 255; a > 255 ? 255 : ( a < 0 ? 0  :a );
		var x = parseInt(c.replace('#','0x'),16);
		return 'rgba('+((x>>16)&0xff)+','+((x>>8)&&0xff)+','+(x&0xff)+','+a+')';
	},
	rgb : function(c){
		c = c.toLowerCase();
		if(this.colors[c]!==undefined)	return this.colors[c];
		return c;
	},

    initLayer : function(l, v){ 
		l.texttag = "style='position:absolute;overflow:hidden;left:"+v.left+"px;top:"+
					 v.top+"px;width:"+(v.width)+"px;height:"+(v.height)+"px'";
		l.canvas = l.parentNode.canvas?l.parentNode.canvas:l.parentNode.parentNode.canvas;
		l.textroot = l.parentNode.oInt?l.parentNode.oInt:l.parentNode.parentNode.oInt;
		l.dx = v.left;
		l.dy = v.top;
		l.dw = v.width;
		l.dh = v.height;
		l.ds = 1;
		l.cstylevalues = [];
		l.cshapestyle = [];
		l.cshapemode = []; // 1 2 or 3 (fill,stroke or both)
		l.cstyles = [];
		l.tjoin = [];
		l.ctextd = [];
		l.ctextc = [];
		// fucked up alpha hack because mozilla people are idiots
		l.calpha = [];
		l.cfillalpha = [];
		l.cstrokealpha = [];
		return this;
    },
    
    destroyLayer : function(l){
    },

    beginLayer : function(l){
		this.l = l, this.sh = 0, this.tx = 0;
		// lets setup a clipping rect if we need to
		var s=["var _c=l.parentNode.canvas,_dx,_dy,_td,_lc,_tc,_x1,_x2,_y1,_y2,_cv;"];
		s.push("if(l.firstlayer)_c.clearRect(",l.dx,",",l.dy,",",l.dw,",",l.dh,");");
		if( l.dx != 0 )
		   s.push("_c.save();_c.beginPath();\
		    _c.translate(",l.dx+0.5,",",l.dy+0.5,");\
		    _c.moveTo(-1,-1);\
			_c.lineTo(",l.dw+1,",-1);\
			_c.lineTo(",l.dw+1,",",l.dh+1,");\
			_c.lineTo(-1,",l.dh+1,");\
			_c.closePath();\
			_c.clip();");
		else s.push("_c.translate(0.5,0.5);");
		return s.join('');
    },

    endLayer : function(){
		if( this.l.dx != 0) return "_c.restore();";
		this.l = null;
		return "_c.translate(-0.5,-0.5);";
    },

    allocShape : function( l, style ){
		var s = [], a ,g, i, m = 0,_cv={};
		l.cstyles.push(style);
		l.cstylevalues.push(_cv);
		if(style.fill !== undefined){
			m |= 1;
			if(style.gradient !== undefined){
				//lets make a gradient object
				a = style.angle * (Math.PI/360);
				g = l.parentNode.canvas.createLinearGradient(
					(Math.cos(-a+Math.PI*1.25)/2+0.5) * l.dw,
					(Math.sin(-a+Math.PI*1.25)/2+0.5) * l.dh,
					(Math.cos(-a+Math.PI*0.75)/2+0.5) * l.dw,
					(Math.sin(-a+Math.PI*0.75)/2+0.5) * l.dh );

				//style.fillalpha
				g.addColorStop(1, this.rgba(style.fill,style.fillalpha));
				g.addColorStop(0, this.rgba(style.gradient,style.gradalpha));
				//style.gradalpha
				s.push("_c.fillStyle=_cv.gradient;");_cv.gradient = g;
			} else {
				s.push("_c.fillStyle=_cv.fill;");_cv.fill = this.rgb(style.fill);
			}
		}
		if(style.line!== undefined){
			m |= 2;
			s.push("_c.strokeStyle=_cv.stroke;");_cv.stroke = this.rgb(style.line,style.linealpha)
			s.push("_c.lineWidth=_cv.width;");_cv.width = style.weight;
		}
		_cv.fillalpha = style.fillalpha;
		_cv.linealpha = style.linealpha;
		switch(m){
			case 3:// check if our fillalpha != stroke alpha, ifso we create switches between filling and stroking
			if(style.fillalpha != style.strokealpha ){
				l.calpha.push("");
				l.cfillalpha.push("_c.globalAlpha=_cv.fillalpha;");
				l.cstrokealpha.push("_c.globalAlpha=_cv.linealpha;");
			}else{
				l.calpha.push("_c.globalAlpha=_cv.fillalpha;");		
			}
			break;
			case 2:
				l.calpha.push("_c.globalAlpha=_cv.linealpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");
			case 1:
				l.calpha.push("_c.globalAlpha=_cv.fillalpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");			
		}
		l.cshapemode.push( m );
		return l.cshapestyle.push( s.join('') ) -1;
	},

	allocText : function(l, style, items ){
		var s = l.tjoin;
		var k = ["<div "+l.texttag+">"];
		for( ;items >= 0; items-- ){
			k.push("<div style='","position:absolute;left:0;top:0;display:none;font-family:",
				style.family, ";color:",style.color,";font-weight:",
				style.weight,";",";font-size:",style.size,";",
				(style.style!==undefined)?"font-style:"+style.style+";" : "", 
				"'>-</div>");
		}
		k.push("</div>");
		s.push(k.join(''));
		return s.length-1;
	},
	
    allocDone : function(l){
		if(!l.tjoin.length) return;
		var html = l.textroot;
		html.insertAdjacentHTML( 'beforeend', l.tjoin.join('') );
		// calculate offset
		var off = html.childNodes.length - l.tjoin.length;
		for(i = l.tjoin.length-1;i>=0;i--){
			var n = html.childNodes[i+off];
			l.ctextc[i] = 0;
			var td = l.ctextd[i] = [], t;
			for( k = n.childNodes.length-1;k>=0;k--){
				t = n.childNodes[k];
				td[k] = { n: t, v: t.firstChild, x: 0, y: 0, s : null};
			}
		}
	},
    
	beginText : function(id) {
		if(id === undefined)id = this.tx++;
		this.id = id;
		return "_td = l.ctextd["+id+"], _tc = 0, _lc = l.ctextc["+id+"];";
	},
	
	drawText : function( x, y, text) {
		var t = (this.l.ds>1?"/"+this.l.ds:"");
		return this.translate?
				"if( (_t=_td[_tc++]).s!=(_v="+text+") )_t.v.nodeValue=_t.s=_v;\
				if(_t.x!=(_v=parseInt("+x+")+_dx))_t.n.style.left=(_t.x=_v)+'px'"+t+
				";if(_t.y!=(_v=parseInt("+y+")+_dy))_t.n.style.top=(_t.y=_v)+'px'"+t+";"
				:
				"if( (_t=_td[_tc++]).s!=(_v="+text+") )_t.v.nodeValue=_t.s=_v;\
				if(_t.x!=(_v=parseInt("+x+")))_t.n.style.left=(_t.x=_v)+'px'"+t+
				";if(_t.y!=(_v=parseInt("+y+")))_t.n.style.top=(_t.y=_v)+'px'"+t+";";
	},
	
	endText : function() {
		// make sure we show/hide all textlabels that werent visible before
		return "if(_lc>_tc){\
			for(;_lc>_tc;)_td[--_lc].n.style.display='none';\
			l.ctextc[" + this.id + "]=_lc;\
		} else if(_lc<_tc) {\
			for(;_lc<_tc;)_td[_lc++].n.style.display='block';\
			l.ctextc[" + this.id + "]=_lc;\
		}";
	},
	
	beginTranslate : function(x,y){
		this.translate = 1;
		return "_c.save();_c.translate("+x+","+y+");var _dx = parseInt("+x+"),_dy=parseInt("+y+");";
	},
	endTranslate : function (){
		this.translate = 0;
		return "_c.restore();";
	},
	
 	beginShape : function(id) {
		if(id === undefined)id = this.sh++;
		this.id = id;
		this.m = this.l.cshapemode[id];
		return "_c.beginPath();_cv = l.cstylevalues["+this.id+"];"+
				this.l.cshapestyle[id]+this.l.calpha[id];
	},
	
	// shape style  DO NOT USE in loops where id is generated at runtime
	getStyle : function() {
		return this.l.cstyles[this.id];
	},
	
	getValue : function(name,defvalue) {
		var x = this.l.cstyles[this.id]; 
		return (x && x[name] !== undefined )?
				x[name] : defvalue;
	},
		
	moveTo : function(x,y){
		// check our mode. if its 3 we need to cache it
		return "_c.moveTo("+x+","+y+");";
	},
	lineTo : function(x, y){
		this.h = 1;
		return "_c.lineTo("+x+","+y+");";
	},
	rect : function( x,y,w,h ){
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
						    "_c.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");"+
							this.l.cstrokealpha[this.id]+
					   	   "_c.strokeRect(_x1,_y1,_x2,_y2);";
			case 2: return "_c.strokeRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
			case 1: return "_c.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
		}
	},	
	close : function (){
		this.h = 0;
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
							"_c.fill();_c.closePath();"+
							this.l.cstrokealpha[this.id]+
							"_c.stroke();_c.beginPath();";
			case 2: return "_c.stroke();_c.beginPath();";
			case 1: return "_c.fill();_c.beginPath();";
		}	
	},/*
	closeend : function (){
		return this.close();
	},	*/
	endShape : function() {
		return (this.h?this.close():"");
	}
}

jpf.chart.vmlDraw = {
	// @Todo test resize init charting, z-index based on sequence

    init : function(o, scale){
		
		//o.vmlscale = scale || 4;
        jpf.importCssString(document, "v\\:* {behavior: url(#default#VML);}");
		
		o.oExt.onselectstart = function(){
			return false;
		}
		//o.vmlwidth   = o.oExt.offsetWidth * o.vmlscale;
		//o.vmlheight  = o.oExt.offsetHeight * o.vmlscale;
		
		o.oInt.innerHTML = "\
			<div style='z-index:10000;position:absolute;left:0px;width:0px;background:url(images/spacer.gif);width:"+
				o.oExt.offsetWidth+"px;height:"+o.oExt.offsetHeight+"px;'>\
			</div>\
			<div style='margin: 0 0 0 0;padding: 0px 0px 0px 0px; position:absolute;left:0;top:0;width:"+
							o.oExt.offsetWidth+';height:'+o.oExt.offsetHeight+
							";overflow:hidden;'>\
			</div>";
		o.vmlroot = o.oInt.lastChild;
		return this;
	},
    	
    initLayer : function(l, v){ 

		var p = l.parentNode.vmlroot?l.parentNode:l.parentNode.parentNode;
        var vmlroot = p.vmlroot;
//		l.left = 0;l.top = 0;
//		l.dx = l.left * p.vmlwidth, l.dy = l.top * p.vmlheight;
//		l.dw = l.width * p.vmlwidth,l.dh = l.height * p.vmlheight;
		
		var tag = "<div style='position:absolute;left:"+v.left+";top:"+v.top+";width:"+v.width+";height:"+v.height+
		";overflow:hidden;'/>";
		
		l.ds = 1;
		l.dw = parseFloat(v.width)*l.ds;
		l.dh = parseFloat(v.height)*l.ds;
		
		l.vmltag = "style='position:absolute;left:0;top:0;width:"+(v.width)+";height:"+(v.height)+
		";overflow:hidden;' coordorigin='0,0' coordsize='"+(l.dw+1)+","+(l.dh+1)+"'";
        vmlroot.insertAdjacentHTML("beforeend", tag);
        var vmlgroup = vmlroot.lastChild;
//        if (vmlroot.childNodes[l.zindex] != vmlgroup)
  //          vmlroot.insertBefore(vmlgroup, vmlroot.childNodes[l.zindex]);

		l.cstyles = [];
		l.cshape = [];
		l.ctextd = [];
		l.ctextc = [];
		l.cjoin = [];
		l.tjoin = [];
		l.vmlgroup = vmlgroup;
    },
     
	updateLayer : function(l){
		// update layer position, and perhaps z-order?
	},
	 
    deinitLayer : function(l){
        // we should remove the layer from the output group.
        l.vmlgroup.removeNode();
		l.vmlgroup = 0;
		l.cshape = 0;
    },

    beginLayer : function(l){
        this.l = l, this.sh = 0, this.tx = 0;
		return "var _t,_s, _dx,_dy,_tv,_td,_tc,_lc,_cshape = this.cshape;";
    },

    endLayer : function(){
		this.l = null;
		return "";
    },
	
    allocShape : function( l, style ){
		if(!style.active)return -1;
		var s = l.cjoin, i, shape=[], path=[], child=[], opacity="";
		l.cstyles.push(style);
		// lets check the style object. what different values do we have?
		if(style.fill !== undefined){
			if(style.gradient !== undefined){
				child.push("<v:fill opacity='",style.fillalpha,"' o:opacity2='",
					style.gradalpha,"' color='"+style.fill+"' color2='",
				style.gradient,"' type='gradient' angle='",style.angle,"'/>");
			} else {
				child.push("<v:fill opacity='",style.fillalpha,"' color='",style.fill,"' type='fill'/>");
			}
			shape.push("fill='t'"),path.push("fillok='t'");
		} else {
			shape.push("fill='f'"),path.push("fillok='f'");
		}
		if(style.line !== undefined){	
			var a = style.linealpha, w = style.weight;
			if(w<1) a = style.linealpha<style.weight?style.linealpha:style.weight, w = 1;
			child.push("<v:stroke opacity='",a,"' weight='",w,"' color='",
				style.line,"'/>");
		} else {
			shape.push("stroke='f'"), path.push("strokeok='f'");
		}
        s.push(["<v:shape ",l.vmltag," path='' ",shape.join(' '),"><v:path ",
				path.join(' '),"/>",child.join(' '),"</v:shape>"].join(''));
		return l.cstyles.length-1;
	},
	
	// DOM nodecaching
	allocText : function(l, style, items ){
		if(!style.active)return -1;
		var s = l.tjoin;
		var k = ["<div "+l.vmltag+">"];
		for( ;items >= 0; items-- ){
			k.push("<div style='",
				(style.vertical)?"filter: flipv() fliph(); writing-mode: tb-rl;":"",
				"position:absolute;left:0;top:0;display:none;font-family:",
				style.family, ";color:",style.color,";font-weight:",
				style.weight,";",";font-size:",style.size,";",
				(style.style!==undefined)?"font-style:"+style.style+";" : "", 
				"'>-</div>");
		}
		k.push("</div>");
		s.push(k.join(''));
		return s.length-1;
	},
	
    allocDone : function(l){
		l.vmlgroup.innerHTML = l.cjoin.join('')+l.tjoin.join('');
        var i, len=l.cjoin.length, n;
		for(i = len-1;i>=0;i--)
            l.cshape[i] = l.vmlgroup.childNodes[i];
		for(i = l.tjoin.length-1;i>=0;i--){
			var n = l.vmlgroup.childNodes[i+len];
			l.ctextc[i] = 0;
			var td = l.ctextd[i] = [], t;
			for( k = n.childNodes.length-1;k>=0;k--){
				t = n.childNodes[k];
				td[k] = { n: t, v: t.firstChild, x: 0, y: 0, s : null};
			}
		}
    },
	beginTranslate : function(x,y){
		this.translate = 1;
		return "var _dx = parseInt("+x+"),_dy=parseInt("+y+");";
	},
	endTranslate : function (){
		this.translate = 0;
		return "";
	},
	beginText : function(id) {
		if(id === undefined)id = this.tx++;
		this.id = id;
		return "_td = l.ctextd["+id+"], _tc = 0, _lc = l.ctextc["+id+"];";
	},
	
	drawText : function( x, y, text) {
		var t = (this.l.ds>1?"/"+this.l.ds:"");
		return this.translate?
				"if( (_t=_td[_tc++]).s!=(_v="+text+") )_t.v.nodeValue=_t.s=_v;\
				if(_t.x!=(_v=parseInt("+x+")+_dx))_t.n.style.left=_t.x=_v"+t+
				";if(_t.y!=(_v=parseInt("+y+")+_dy))_t.n.style.top=_t.y=_v"+t+";"
				:
				"if( (_t=_td[_tc++]).s!=(_v="+text+") )_t.v.nodeValue=_t.s=_v;\
				if(_t.x!=(_v=parseInt("+x+")))_t.n.style.left=_t.x=_v"+t+
				";if(_t.y!=(_v=parseInt("+y+")))_t.n.style.top=_t.y=_v"+t+";";
	},
	
	endText : function() {
		// make sure we show/hide all textlabels that werent visible before
		return "if(_lc>_tc){\
			for(;_lc>_tc;)_td[--_lc].n.style.display='none';\
			l.ctextc[" + this.id + "]=_lc;\
		} else if(_lc<_tc) {\
			for(;_lc<_tc;)_td[_lc++].n.style.display='block';\
			l.ctextc[" + this.id + "]=_lc;\
		}";
	},
	beginShape : function(id) {
		if(id === undefined)id = this.sh++;
		this.id = id;
		return "_s=[];\n";
	},
	// shape style  DO NOT USE in loops where id is generated at runtime
	getStyle : function() {
		return this.l.cstyles[this.id];
	},
	getValue : function(name,defvalue) {
		var x = this.l.cstyles[this.id]; 
		return (x && x[name] !== undefined )?
				x[name] : defvalue;
	},
	
	// drawing command
	moveTo : function(x,y){
		return this.translate?
			"_s.push('m',"+(parseInt(x)==x ? "("+x+"+_dx)" : "parseInt(("+x+")+_dx)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "parseInt(("+y+")+_dy)" )+",'l');\n":
			"_s.push('m',"+(parseInt(x)==x ? x : "parseInt("+x+")" )+
			",' ',"+(parseInt(y)==y ? y : "parseInt("+y+")" )+",'l');\n";
	},
	lineTo : function(x, y){
		return this.translate?
			"_s.push("+(parseInt(x)==x ? "("+x+"+_dx)" : "parseInt(("+x+")+_dx)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "parseInt(("+y+")+_dy)" )+");\n":
			"_s.push("+(parseInt(x)==x ? x : "parseInt("+x+")")+
			",' ',"+(parseInt(y)==y ? y : "parseInt("+y+")")+");\n";
	},
	rect : function( x,y,w,h ){
	    //lets push out some optimal drawing paths
		return this.translate?
		";\
		if((_t=parseInt("+w+"))>0)_s.push('m',parseInt(("+x+")+_dx),' ',parseInt(("+y+")+_dy),\
		'r',_t,' 0r0 ',parseInt("+h+"),'r-'+_t,' 0x');":
		";\
		if((_t=parseInt("+w+"))>0)_s.push('m',parseInt("+x+"),' ',parseInt("+y+"),\
		'r',_t,' 0r0 ',parseInt("+h+"),'r-'+_t,' 0x');";
	},
	close : function (){
		return "_s.push('xe');";
	},/*
	closeend : function (){
		return "_s.push('xe');";
	},*/
	endShape : function(n) {
		this.delta = 0;
		return "_cshape["+this.id+"].path=_s.length?_s.join(' '):'m';\n";
	}
}
// #endif
 

