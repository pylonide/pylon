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
		
	// 2D mouse interaction
	this.zoom = 1;
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
	
    this.style = {
		grid : {
			line : '#1f1f1f',
			weight: 1,
			stepx : 5,
			stepy : 5
		},
		axis : {
			line : '#000000',
			weight: 1
		},
		persp : {
			x : 1,
			y : 1.4
		},
		bar : {
			sizex: 0.8,
			sizey: 0.8,
			stepx : 5,
			stepy : 5,
			line : '#000000',
			weight : 1,
			fill : 'red'
		},
		graph : {
			line : '#000000',
			weight: 1,
			steps : 100
		}
	};
		
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
		
	this.__supportedProperties.push(
		"zoom","zoomx", "zoomy","movex", "movey",  
		"orbitx", "orbity", "distance",
		"x1","y1","x2","y2","t1","t2"
	);

    this.drawLayers = function(){
		for(var i = 0;i<this.childNodes.length;i++){
			
			var l = this.childNodes[i],
				x1 = l.x1 !== undefined ? l.x1 : this.x1,
				y1 = l.y1 !== undefined ? l.y1 : this.y1,
				x2 = l.x2 !== undefined ? l.x2 : this.x2,
				y2 = l.y2 !== undefined ? l.y2 : this.y2,
				w = x2 - x1, h = y2 - y1, tx ,ty;
			
			if(l.is3d){
				// lets put in the orbit and distance
				l.rx = this.orbity, l.ry = 0, l.rz = this.orbitx;
				l.tx = 0, l.ty = 0, l.tz = -this.distance;
			}else{
				// lets calculate the new x1/y1 from our zoom and move
				tx = this.movex * -w;
				ty = this.movey * -h;
				x1 = x1 + tx, x2 = x1 + w*this.zoomx,
				y1 = y1 + ty, y2 = y1 + h*this.zoomy;
			}
			l.vx1 = x1, l.vy1 = y1, l.vx2 = x2, l.vy2 = y2;
			l.draw( l );
		}
   	}
	
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
    }
	
    this.__loadJml = function(x){
        var oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.oInt = oInt;/*
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(x, oInt, this);*/
        
		engine = (jpf.supportCanvas 
			? jpf.chart.canvasDraw
			: jpf.chart.vmlDraw).init(this);
		
		function parseStyle( str, obj ) {
			if(str)str.replace(/([\w\-]+)\:([^;]+);?/g, function(m,n,v){
				if(v=='null' || v=='undefined')delete obj[n];
				else if( parseFloat(v) == v) obj[n] = parseFloat(v);
				else obj[n] = v;
			});
			return obj;
		}
		
		function setupStyle( s ){
			s.alpha = s.alpha!==undefined ? s.alpha : 1;
			s.fillalpha = s.fillalpha!==undefined ? s.fillalpha:s.alpha;
			s.gradalpha = s.gradalpha!==undefined ? s.gradalpha:s.fillalpha;
			s.linealpha = s.linealpha!==undefined ? s.linealpha:s.alpha;
			s.angle = s.angle!==undefined ?	s.angle : 0;
			s.weight = s.weight!==undefined ? s.weight : 1
			return s;
		}
		
		
		for(var k in this.style){
			parseStyle( x.getAttribute(k), this.style[k] );
		}
		//var dt = new Date().getTime();
		for (var o, i = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			
			o = {
				__supportedProperties : ["left","top","width","height",
										 "x1", "y1", "x2", "y2", "t1", "t2",
										 "type", "zindex", "source","series","formula"],
				
				init : function(engine){
					this.engine = engine;
					//jpf.makeClass(this);
					engine.initLayer(this);
					// lets fetch a datasource
					if(this.series !== undefined){
						if(this.series.indexOf(' ')!=-1){
							var a = this.seriesarray = this.series.split(' ');
							for(var i = a.length-1;i >= 0; i--) a[i] = a[i].split(',');
						} else {
							this.seriesarray = this.series.split(',');
						}
					}
					// datasources take an object with either a .formula or a .seriesarray
					if(this.source)
						this.datasource = jpf.chart.generic.datasource[this.source]( this );
					
					this.draw  = jpf.chart.generic[this.type](this, engine, this.datasource);
					this.is3d = this.type.match("3D");
				},
				
				data : 0,
				
				style : {},

				loadJml : function(x){
					var value, name, type, l, a, i, attr = x.attributes;
					
					for(var k in this.parentNode.style ){
						var s1 = this.style[k] = {},
							s2 = this.parentNode.style[k];
						for(var j in s2)
							s1[j] = s2[j];
					}
					
			        for (i = attr.length-1; i>=0; i--) {
			            a     = attr[i];
			            value = a.nodeValue;
			            name  = a.nodeName;
			            if (this.style[name])
							parseStyle( value, this.style[name] );
						else 
							this[name] = value;
							
			        }
					for(var k in this.style ){
						setupStyle(this.style[k]);
					}
					
					if(this.x1 !== undefined)this.x1 = parseInt(this.x1);
					if(this.x2 !== undefined)this.x2 = parseInt(this.x2);
					if(this.y1 !== undefined)this.y1 = parseInt(this.y1);
					if(this.y2 !== undefined)this.y2 = parseInt(this.y2);
					this.left = this.left || 0;
					this.top = this.top || 0;
					this.width = this.width || 1;
					this.height = this.height || 1;
					this.type = this.type || "grid2D";
				}
			}	
			
			o.parentNode = this;
			o.loadJml(x.childNodes[i]);
			o.init(engine);
			this.childNodes.push(o);
		}
		//lert( (new Date()).getTime() - dt);

        var origx, origy, lastx, lasty, button, interact = false;
        this.oExt.onmousedown = function(e){
            if (!e) e = event;
			if(e.button == 3 || e.button == 4) _self.resetView();
            interact = true;
            lastx = e.clientX, lasty = e.clientY;
			origx = (e.clientX - _self.oExt.offsetLeft)/ _self.oExt.offsetWidth;
			origy = (e.clientY - _self.oExt.offsetTop) / _self.oExt.offsetHeight;
			button = e.button;
		}
        		
        this.oExt.oncontextmenu = function(){
            return false;   
        }
        
        this.oExt.onmouseup  = 
        function(){
            interact = false;
        }
      
        this.oExt.onmousemove = function(e){
            if (!interact) return;
            if (!e) e = event;
           
            var dx = (e.clientX - lastx) / _self.oExt.offsetWidth,
				dy = (e.clientY - lasty) / _self.oExt.offsetHeight;
				zx = _self.zoomx, zy = _self.zoomy;
			lastx = e.clientX, lasty = e.clientY;
			if(button == 1 || button == 0){
				_self.setProperty("orbitx", _self.orbitx - 2*dx  );
				_self.setProperty("orbity", _self.orbity + 2*dy  );
				_self.setProperty("movex", _self.movex + dx * _self.zoomx );
				_self.setProperty("movey", _self.movey + dy * _self.zoomy );
			}else{
			// we need to zoom around the point we have picked in movex
				_self.setProperty("distance", Math.min(Math.max( _self.distance * 
						(1 - 4*dy), 3 ),100) );
				_self.setProperty("zoomx", _self.zoomx * (1 - 4*dx)  );
				_self.setProperty("zoomy", _self.zoomy * (1 - 4*dy) );
				_self.setProperty("movex", _self.movex - (zx-_self.zoomx)*origx );
				_self.setProperty("movey", _self.movey - (zy-_self.zoomy)*origy );
			}
		}
	
		wheelEvent = function(e) {
	        if(!e) e = window.event;
			
			var d = e.wheelDelta? 
				(window.opera ?-1:1) * e.wheelDelta / 120 :  
				(event.detail ? -e.detail / 3 : 0);
				
	        if(d){
				_self.setProperty("distance", Math.min(Math.max( _self.distance * 
						(1 - 0.1*d), 3 ),100) );
				_self.setProperty("zoomx", _self.zoomx * (1 - 0.1*d)  );
				_self.setProperty("zoomy", _self.zoomy * (1 - 0.1*d) );
			}
			
	        if(event.preventDefault) event.preventDefault();
	        event.returnValue = false;
	    }
		if (engine.canvas && engine.canvas.addEventListener)
			engine.canvas.addEventListener('DOMMouseScroll', wheelEvent, false);
    	this.oExt.onmousewheel = wheelEvent;
		
		// animation stuff for now
		window.setInterval(function(){
			_self.drawLayers();
		},20);
    }
}).implement(jpf.Presentation);


jpf.chart.generic = {
	head3D : function(e){
		return "\
		var  dw = l.dw, dh = l.dh, dh2 = dh/2,dw2 = dw/2,\n\
			 vx1 = l.vx1, vy1 = l.vy1,\n\
		 	 vx2 = l.vx2, vy2 = l.vy2, vh =  vx2-vx1, vw = vy2-vy1,\n\
			 a=l.a||0, b=l.b||0, c=l.c||0,d=l.d||0,\n\
			 n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\n\
			 ax = dw*l.style.persp.x, ay = dh * l.style.persp.y,\n\
			 _ma = Math.cos(l.rx),_mb = Math.sin(l.rx),\n\
			 _mc = Math.cos(l.ry),_md = Math.sin(l.ry),\n\
			 _me = Math.cos(l.rz),_mf = Math.sin(l.rz),\n\
			 m00=_mc*_me,m01=-_mf*_mc,m02=_md,m03=l.tx,\n\
			 m10=(_me*_mb*_md+_mf*_ma),m11=(-_mb*_md*_mf+_ma*_me),m12=-_mb*_mc,m13=l.ty,\n\
			 m20=(-_ma*_md*_me+_mb*_mf),m21=(_ma*_md*_mf+_me*_mb),m22=_ma*_mc,m23=l.tz,\n\
			 x, y, z, _x,_y,_z, zt, i, j, k, optimizeConst;\n";
	},
	head2D : function(e){
		return "\
		var dh = l.dh,dw = l.dw,\n\
			vx1 = l.vx1, vy1 = l.vy1,\n\
			vx2 = l.vx2, vy2 = l.vy2, vw =  vx2-vx1, vh = vy2-vy1,\n\
			sw = dw / vw, sh = dh / vh,\n\
			a = l.a||0, b = l.b||0, c = l.c||0, d = l.d||0,\n\
			n = (new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\n\
			x, y, i, j, k;\n";
	},
	poly3DHead : function(maxoverlap){
		var s=['var '];
		for(var i = 0;i<maxoverlap;i++)
			s.push((i?",":""),"_tx",i,",_ty"+i);
		s.push(";");
		return s.join('');
	},
	poly3DIndex : function(e,indices,pts){
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
				q=["zt = m20*"+pt[0]+"+m21*"+pt[1]+"+m22*"+pt[2]+"+m23;",
					"(m00*"+pt[0]+"+m01*"+pt[1]+"+m02*"+pt[2]+"+m03)*ax/zt+dw2",
					"(m10*"+pt[0]+"+m11*"+pt[1]+"+m12*"+pt[2]+"+m13)*ay/zt+dh2"];
				d = f?0:i;
				if(cc[d])q[1]= "_tx"+cc[d]+(cf[d]?"":"="+q[1]), q[2]= "_ty"+cc[d]+(cf[d]++?"":"="+q[2]);
			}; 
			switch(d){
				case -1: f=1;s.push( e.closeend() );break;
				case 0: f=0;s.push( q[0], e.moveTo(q[1],q[2]) ); break;
				case indices.length-1: s.push( q[0], e.lineTo(q[1],q[2]), e.closeend() );break;
				default: s.push( q[0], e.lineTo(q[1],q[2]) ); break;
			}
		}
		return s.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
	},
	doSome3D : function(e,f,x,y,z,sx,sy){
		var _x,_y,_z;
		if(typeof x == 'string' && x.match(/[\[\]\*\+\-\/]/))x="(_x="+x+")",_x="_x";
		else x="("+x+")",_x=x;
		if(typeof y == 'string' && y.match(/[\[\]\*\+\-\/]/))y="(_y="+y+")",_y="_y";
		else y="("+y+")",_y=y;
		if(typeof z == 'string' && z.match(/[\[\]\*\+\-\/]/))z="(_z="+z+")",_z="_z";
		else z="("+z+")",_z=z;
		var r = "zt = m20*"+x+"+m21*"+y+"+m22*"+z+"+m23;"+
				e[f]( (sx===undefined?"":sx)+
					  "(m00*"+_x+"+m01*"+_y+"+m02*"+_z+"+m03)*ax/zt",
					  (sy===undefined?"":sy)+
					  "(m10*"+_x+"+m11*"+_y+"+m12*"+_z+"+m13)*ay/zt");
		return r.replace(/m\d\d\*\(?0\)?\+/g,"");
	},
	lineTo3D : function(e,x,y,z,sx,sy){
		return this.doSome3D(e,"lineTo",x,y,z,sx,sy)
	},
	moveTo3D : function(e,x,y,z,sx,sy){
		return this.doSome3D(e,"moveTo",x,y,z,sx,sy)
	},
	mathParse : function(s){
		return s.toLowerCase().replace(/([0-9\)])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1").
		replace(/([^a-z]?)(x|y)([^a-z]?)/g,"$1i$2$3").replace(/(^|[^a-z])t($|[^a-z])/g,"$1ix$3");
	},
		
	cacheArray : function(name, pref, size){
		return "\
		if(!l."+pref+name+" || l."+pref+name+".length<"+size+")l."+pref+name+" = new Array("+size+");\
		var "+name+"=l."+pref+name+";";
	},
	
	optimizeConst : function( code ){
		// we should find all constant * matrix operations and optimize them out.
		var cnt = {},n = 0, s=[];
		code = code.replace(/(m\d\d\*)\(?(\-?\d+(?:\.\d+))?\)/g,function(m,a,b){
			var t = a+b;
			if(cnt[t] === undefined){
				s.push("_mo"+n+"="+t);
				return cnt[t]="_mo"+(n++);
			}
			return cnt[t];
		});
		return s.length ? code.replace(/optimizeConst/,s.join(',')): code;
	},
	
	datasource : {
		mathX : function(l) {
			return {
				type : 'mathX',
				x1 : -3, x2 : 3, y1 : -1, y2 : -1,
				ix1 : "vx1", 
				ix2 : "vx2+(vx2-vx1)/100", 
				ixs : 20,
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
				ix2 : Math.PI*2+(Math.PI*2/20), 
				ixs : 21,
				x : jpf.chart.generic.mathParse(part[0]),
				y : jpf.chart.generic.mathParse(part[1]===undefined?part[0]:part[1])
			};
		},
		seriesX : function(l) {
			var	len = l.seriesarray.length;
			return {
				type : 'seriesX',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				ix1 : "Math.max(Math.floor(vx1),0)", 
				ix2 : "Math.min(Math.ceil(vx2)+1,l.seriesarray.length)", 
				ixs : "ix2-ix1",
				begin : "var _sd = l.seriesarray, _sc;",
				x : "ix",
				y : "_sd[ix]"
			};
		},
		seriesX2 : function(l) {
			var	len = l.seriesarray.length;
			return {
				type : 'seriesX2',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : len, 
				ixs : len, 
				begin : "var _sd = l.seriesarray, _len = l.seriesarray.length, _sc, _lx=vx1, _sf=0;\
						 for(ix=l.ixfirst||0;ix > 0 && _sd[ix][0]>=vx1 ;ix--);",
				for_ : " && _lx<=vx2",
				if_  : "if( (!_sf && (ix==_len-1 || _sd[ix+1][0]>=vx1) && ++_sf && (ixfirst=l.ixfirst=ix || 1)) || _sf)",
				x 	 : "(_lx=(_sc=_sd[ix])[0])",
				y 	 : "_sc[1]"
			};
		},
		seriesXY : function(l) {
			var	len = l.seriesarray.length;
			return {
				type : 'seriesXY',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : len, 
				ixs : len,
				begin : "var _sd = l.seriesarray, _sc;",
				x : "((_sc=_sd[ix])[0])",
				y : "_sc[1]"
			};
		}
	},
				
// args: oChart, layer, engine
    grid2D : function(l,e){
		e.allocShape(l, l.style.grid);
		e.allocShape(l, l.style.axis);
		e.allocDone(l);
		
		var c = [
		this.head2D( e ),
		e.beginLayer(l),
		e.clear(0,0,"dw","dh"),
		e.beginShape(0),
		"for(gx = Math.pow(5, Math.round(Math.log(vw/5)/ Math.log(5))),\
			x = Math.round(vx1 / gx) * gx - vx1 - gx; x < vw + gx; x += gx){",
			e.moveTo("x*sw","0"),
			e.lineTo("x*sw","dh"),
		"};\
		for(gy = Math.pow(5, Math.round(Math.log(vh/5)/ Math.log(5))),\
			y = Math.round(vy1 / gy) * gy - vy1 - gy; y < vh + gy; y += gy){",
			e.moveTo("0","y*sh"),
			e.lineTo("dw","y*sh"),
		"};",
		e.endShape(),
		e.beginShape(1),
		e.moveTo("0", "-vy1*sh"),e.lineTo("dw","-vy1*sh"),
		e.moveTo("-vx1*sw", "0"),e.lineTo("-vx1*sw","dh"),
		e.endShape(),
		e.endLayer()].join('');
		return new Function('l',c);
    },				
				
    grid3D : function(l,e){
		e.allocShape(l,l.style.grid);
		e.allocShape(l,l.style.axis);
		e.allocDone(l);
		
		var c = [
			this.head3D(e),
			"var sx = ",l.style.grid.stepx,", sy = ",l.style.grid.stepy,
				", dx = (vw)/(sx-1), dy = (vh)/(sy-1);",
			this.cacheArray('gx','grid3D',"sx*sy"),
			this.cacheArray('gy','grid3D',"sx*sy"),
			e.beginLayer(l),
			e.clear(0,0,"dw","dh"),
			e.beginShape(0,'dw2','dh2'),
			"for(y = vy1,j = 0,k = 0; j < sy; y += dy,j++){\n\
				for(x = vx1, i = 0; i < sx; x += dx,i++,k++){\n\
					if(i){",
						this.lineTo3D(e,'x','y',0,'gx[k]=','gy[k]='),
					"} else {",
						this.moveTo3D(e,'x','y',0,'gx[k]=','gy[k]='),
					"}\
				}\
			}\
			for(i=0;i<sx;i++)for(j=0; j<sy; j++, z=i+j*sx){\n\
				if(j){",e.lineTo('gx[z]','gy[z]'),"}else {",e.moveTo("gx[i]","gy[i]"),"}",
			"}",
			e.endShape(),
			!e.getValue('showxy',1)?"":(
				e.beginShape(1,'dw2','dh2')+
				this.moveTo3D(e,'vx1',0,0)+this.lineTo3D(e,'vx2',0,0)+
				this.moveTo3D(e,0,'vy1',0)+this.lineTo3D(e,0,'vy2',0)+
				(!e.getValue('showz',0)?"":(
					this.moveTo3D(e,0,0,-1)+this.lineTo3D(e,0,0,1)) 
				)+
				e.endShape() 
			),
			e.endLayer()].join('');
		return new Function('l',c);
	},
					
	line2D : function( l, e, d ){
		e.allocShape(l, l.style.graph);
		e.allocDone(l);
		var s = l.style.graph, wrap = s.weight*4;
		var c = [
			this.head2D(e),
			e.beginLayer(l),
			e.beginShape(0,"-vx1*sw","-vy1*sh"),
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
			e.endLayer()].join('');
		
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	line3D : function( l, e, d ){
		e.allocShape(l, l.style.graph);
		e.allocDone(l);
		var s = l.style.graph, wrap = s.weight*4;
		var c = [
			this.head3D(e),
			e.beginLayer(l),
			e.beginShape(0,"dw2","dh2"),
			"var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"var ixfirst = ix; var k = 0, xn, yn, xv, yv, xt = null, yt;",
			(s.fake==1) ?[
				this.cacheArray('gx','line3D',"ixs"),
				this.cacheArray('gy','line3D',"ixs"),
				this.moveTo3D(e,"gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"for(k=1,ix+=idx;ix<ix2",d.for_||"",";ix+=idx,k++",d.inc_||"",")",d.if_||"","{",
					this.lineTo3D(e,"gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"}", 
				"for(k--;k>=0;k--){",
					this.lineTo3D(e,"gx[k]",s.zpos+s.depth,"gy[k]"),
				"}"
			].join('') : [
				this.moveTo3D(e,"xv="+d.x,s.zpos,"yv="+d.y),
				"for(ix+=idx;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
					"xn = ",d.x,",yn=",d.y,";",
					this.lineTo3D(e,"xn",s.zpos,"yn","x=","y="),
					this.lineTo3D(e,"xn",s.zpos+s.depth,"yn", "xt=","yt="),
					"if(xt!==null){",
						this.lineTo3D(e,"xv",s.zpos+s.depth,"yv"),
					"} else {",
						e.lineTo("xt","yt"), 
					"}",
					e.closeend(),
					e.moveTo("x","y"),
					"xv=xn, yv = yn",
				"}",
			].join(''),
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',this.optimizeConst(c));
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	bar2D : function(l,e,d){
		e.allocShape(l, l.style.bar);
		e.allocDone(l);
		var func = this.mathParse(l.formula);
		var c = [
			this.head2D(e),
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
			this.head3D(e),
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
			this.head3D(e),
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
	clear : function(x,y,h,w) {
		return "canvas.clearRect("+x+","+y+","+h+","+w+");";
	},

    initLayer : function(l){ 
		l.dx = l.left*l.parentNode.canvaswidth;
		l.dy = l.top*l.parentNode.canvasheight;
		l.dw = l.width*l.parentNode.canvaswidth;
		l.dh = l.height*l.parentNode.canvasheight;
		l.cstylevalues = [];
		l.cshapestyle = [];
		l.cshapemode = []; // 1 2 or 3 (fill,stroke or both)
		l.cstyles = [];
		// fucked up alpha hack because mozilla people are idiots
		l.calpha = [];
		l.cfillalpha = [];
		l.cstrokealpha = [];
		return this;
    },
    
    destroyLayer : function(l){
    },

    beginLayer : function(l){
		this.l = l;
		return "var canvas=l.parentNode.canvas,_x1,_x2,_y1,_y2,_cv;";
    },

    endLayer : function(l){
		this.l = null;
		return "";
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
				s.push("canvas.fillStyle=_cv.gradient;");_cv.gradient = g;
			} else {
				s.push("canvas.fillStyle=_cv.fill;");_cv.fill = this.rgb(style.fill);
			}
		}
		if(style.line!== undefined){
			m |= 2;
			s.push("canvas.strokeStyle=_cv.stroke;");_cv.stroke = this.rgb(style.line,style.linealpha)
			s.push("canvas.lineWidth=_cv.width;");_cv.width = style.weight;
		}
		_cv.fillalpha = style.fillalpha;
		_cv.linealpha = style.linealpha;
		switch(m){
			case 3:// check if our fillalpha != stroke alpha, ifso we create switches between filling and stroking
			if(style.fillalpha != style.strokealpha ){
				l.calpha.push("");
				l.cfillalpha.push("canvas.globalAlpha=_cv.fillalpha;");
				l.cstrokealpha.push("canvas.globalAlpha=_cv.linealpha;");
			}else{
				l.calpha.push("canvas.globalAlpha=_cv.fillalpha;");		
			}
			break;
			case 2:
				l.calpha.push("canvas.globalAlpha=_cv.linealpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");
			case 1:
				l.calpha.push("canvas.globalAlpha=_cv.fillalpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");			
		}
		l.cshapemode.push( m );
		return l.cshapestyle.push( s.join('') ) -1;
	},

    allocDone : function(){
	},
    
 	beginShape : function(id,x,y) {
		this.d = (x||y) ? 1 : 0;
		this.id = id;
		this.m = this.l.cshapemode[id];
		
		return (!this.d?"":"canvas.save();canvas.translate("+x+","+y+");")+
				"canvas.beginPath();_cv = l.cstylevalues["+this.id+"];"+
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
		return "canvas.moveTo("+x+","+y+");";
	},
	lineTo : function(x, y){
		this.h = 1;
		return "canvas.lineTo("+x+","+y+");";
	},
	rect : function( x,y,w,h ){
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
						    "canvas.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");"+
							this.l.cstrokealpha[this.id]+
					   	   "canvas.strokeRect(_x1,_y1,_x2,_y2);";
			case 2: return "canvas.strokeRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
			case 1: return "canvas.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
		}
	},	
	close : function (){
		this.h = 0;
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
							"canvas.fill();canvas.closePath();"+
							this.l.cstrokealpha[this.id]+
							"canvas.stroke();canvas.beginPath();";
			case 2: return "canvas.stroke();canvas.beginPath();";
			case 1: return "canvas.fill();canvas.beginPath();";
		}	
		return "_s.push('x');";
	},
	closeend : function (){
		return this.close();
	},	
	endShape : function() {
		var d = this.d; this.d = 0;
		return (this.h?this.close():"")+(d?"canvas.restore();":"");
	}
}

jpf.chart.vmlDraw = {
	// @Todo test resize init charting, z-index based on sequence

    init : function(o, scale){
		
		o.vmlscale = scale || 4;
        jpf.importCssString(document, "v\:* {behavior: url(#default#VML);}");
		
		o.oInt.onselectstart = function(){
			return false;
		}
		o.vmlwidth   = o.oExt.offsetWidth * o.vmlscale;
		o.vmlheight  = o.oExt.offsetHeight * o.vmlscale;
		
		o.oInt.innerHTML = "\
			<div style='z-index:10000;position:absolute;left:0px;width:0px;background:url(images/spacer.gif);width:"+
				o.oExt.offsetWidth+"px;height:"+o.oExt.offsetHeight+"px;'>\
			</div>\
			<v:group style='position:absolute;left:0;top:0;width:"+
							o.oExt.offsetWidth+';height:'+o.oExt.offsetHeight+
							";overflow:hidden;' coordorigin='0,0' coordsize='"+
							o.vmlwidth+","+o.vmlheight+"'>\
			</v:group>";
		o.vmlroot = o.oInt.lastChild;
		
		return this;
	},
    	
    initLayer : function(l){ 

		var p = l.parentNode;
        var vmlroot = p.vmlroot;

		l.dx = l.left * p.vmlwidth, l.dy = l.top * p.vmlheight;
		l.dw = l.width * p.vmlwidth,l.dh = l.height * p.vmlheight;
	
		l.vmltag = "style='position:absolute;left:"+l.dx+";top:"+l.dy+";width:"+l.dw+";height:"+l.dh+
		";overflow:hidden;' coordorigin='0,0' coordsize='"+l.dw+","+l.dh+"'";
		var tag = "<v:group "+l.vmltag+" />";
	
        vmlroot.insertAdjacentHTML("beforeend", tag);
        var vmlgroup = vmlroot.lastChild;
//        if (vmlroot.childNodes[l.zindex] != vmlgroup)
  //          vmlroot.insertBefore(vmlgroup, vmlroot.childNodes[l.zindex]);

		l.cstyles = [];
		l.cshape = [];
		l.cjoin = [];
		l.vmlgroup = vmlgroup;
    },
    
    deinitLayer : function(l){
        // we should remove the layer from the output group.
        l.vmlgroup.removeNode();
		l.vmlgroup = 0;
		l.cshape = 0;
    },

    beginLayer : function(l){
        this.l = l;
		return "var _t,_s, _dx,_dy,_cshape = this.cshape;";
    },

    endLayer : function(){
		this.l = null;
		return "";
    },

	// require functions alloc
    allocShape : function( l, style ){
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
			if(w<1) a = Math.min(style.linealpha,style.weight), w = 1;
			child.push("<v:stroke opacity='",a,"' weight='",w,"' color='",
				style.line,"'/>");
		} else {
			shape.push("stroke='f'"), path.push("strokeok='f'");
		}
        s.push("<v:shape "+l.vmltag+" path='' "+shape.join(' ')+"><v:path "+
				path.join(' ')+"/>"+child.join(' ')+"</v:shape>");
		return s.length-1;
	},

    allocDone : function(l){
	
		l.vmlgroup.innerHTML = l.cjoin.join('');
        for(var i=l.cjoin.length-1;i>=0;i--)
            l.cshape[i] = l.vmlgroup.childNodes[i];
    },
	
	clear : function() {
		return "";
	},
    
	beginShape : function(id, x,y) {
		this.delta = (x||y) ? 1 : 0;
		this.id = id;
		return "_s=[]"+(this.delta?",_dx = ("+x+"),_dy=("+y+")":"")+";\n";
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
		return this.delta?
			"_s.push('m',"+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+",'l');\n":
			"_s.push('m',"+(parseInt(x)==x ? x : "("+x+").toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? y : "("+y+").toFixed(0)" )+",'l');\n";
	},
	lineTo : function(x, y){
		return this.delta?
			"_s.push("+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+");\n":
			"_s.push("+(parseInt(x)==x ? x : "("+x+").toFixed(0)")+
			",' ',"+(parseInt(y)==y ? y : "("+y+").toFixed(0)")+");\n";
	},
	rect : function( x,y,w,h ){
	    //lets push out some optimal drawing paths
		return this.delta?
		"_t=("+w+").toFixed(0);\
		if(_t>0)_s.push('m',(("+x+")+_dx).toFixed(0),' ',(("+y+")+_dy).toFixed(0),\
		'r',_t,' 0r0 ',("+h+").toFixed(0),'r-'+_t,' 0x');":
		"_t=("+w+").toFixed(0);\
		if(_t>0)_s.push('m',("+x+").toFixed(0),' ',("+y+").toFixed(0),\
		'r',_t,' 0r0 ',("+h+").toFixed(0),'r-'+_t,' 0x');";
	},
	close : function (){
		return "_s.push('x');";
	},
	closeend : function (){
		return "_s.push('xe');";
	},	
	endShape : function(n) {
		this.delta = 0;
		return "_t=_cshape["+this.id+"],_t.path=_s.join(' ');\n";
	}
}
// #endif
 

