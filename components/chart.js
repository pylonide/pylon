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
    
    // Background axis 
        // window, axis draw stuff
    // Graph series (data + method)
    
    // navigation:
    // zoom / move
    
    // width and height should be from xml
    
    var defaultStyle = {
        line : 1.4,
        color : "#000000",
		axis : 1,
		nozaxis : 1
  	}
	  
	var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};	
	var timer    = null;
	var _self    = this;
	var engine;
	
	// view properties for the chart
/*
    this.draww = 0;
    this.drawh = 0;

    this.viewx = -1;
    this.viewy = -1;
    this.viewh = 2;
    this.vieww = 2;

    this.gridx = -2;
    this.gridy = -2;
    this.gridh = 4;
    this.gridw = 4;

    this.stepv = 4;
    this.stepg = 10;
	this.stept = 100;
    this.mode3D = 0;
    
    this.perspx = 1;
    this.perspy = 1.4;

    
	this.vara   = 0;
	this.varb 	= 0;
	this.varc	= 0;
	this.vard	= 0;

	this.layer   = [];
	this.vmlscale = 4;
*/
	/*
    this.createLayer = function( zindex, type, style, data ){
        var l = {
			view : {},
			style : [],
			
			init : function(){
				//jpf.makeClass(this);
				l = engine.createLayer( this, zindex, x, y, w, h);
			},
			loadJML : function(x){
			
			}
		}
		l.init();
		
		/*
		// use the engine to initialize this layer
        var l;
		if(l = this.layer[zindex]){
            engine.destroyLayer(l);
			l.style = 0, l.data = 0, l.draw = 0;
        }
		
		var x = style.x !== undefined ? style.x : 0,
			y = style.y !== undefined ? style.y : 0,
			w = style.w !== undefined ? style.w : 1,
			h = style.h !== undefined ? style.h : 1,
		// create new layer and compile drawing function with engine
		l = engine.createLayer( this, zindex, x, y, w, h);
		l.style = style, l.data  = data;
		l.draw  = jpf.chart.generic[type](this, l, engine);
		this.layer[zindex] = l;
    }*/
	/*
    this.drawLayers = function(){
		this.rvz=0.3+0.0005*((new Date()).getTime());
		//this.viewx+=0.0005*(dt2-dt);dt=dt2;

		for(var i = 0;i<this.layer.length;i++){
			this.layer[i].draw( this );
		}
   	 }
*/
	
	// 2D mouse interaction
	this.zoom = 1;
	this.zoomx = 1;
	this.zoomy = 1;
	this.movex = 1;
	this.movey  = 1;
	// 3D mouse interaction
	this.orbitx   = 0;
	this.orbity   = 0;
	this.distance = -4;
	// domains
	this.x1 = -1;
	this.y1 = -1;
	this.x2 = 1;
	this.y2 = 1;
	this.t1 = 0;
	this.t2 = 1;
	
	this.__supportedProperties.push(
	"zoom","zoomx", "zoomy","movex", "movey",  
	"orbitx", "orbity", "distance",
	"x1","y1","x2","y2","t1","t2"
	);
/*
	this.__propHandlers["zoom"] = 
	this.__propHandlers["zoomx"] = 
	this.__propHandlers["zoomy"] = 
	this.__propHandlers["translatex"] = 
	this.__propHandlers["translatey"] = 

	this.__propHandlers["orbitx"] = 
	this.__propHandlers["orbity"] = 
	this.__propHandlers["orbitz"] = 
	this.__propHandlers["distance"] = function(value, force, prop){
		//if (!this.isOnInterval)
		//	this.redrawAllLayers();
    }*/
	/*this.__handlePropSet = function(prop, value){
	    if (prop == "formula") {
	        this.addFormula('FXY3D',value, {color:"red",block:1,lines:0}, [[-1,-1],[1,1]]);
	    }
	    else
		if (prop == "zoomfactor") {
	        if (value < 0) {
    	        value = 0;
    	        this.zoomfactor = 0;
    	    }
			this.zoomfactor = value;
	
    	    if(this.mode3D){
    	        this.tvz = (-1 * value) - 3;
    	    }
    	    else {
    	        if (!this.lastZoom)
    	            this.lastZoom = 0;
    	        
    	        //@todo calc these
        		this.viewx -= 0.5 * (value - this.lastZoom);
        		this.viewy -= 0.5 * (value - this.lastZoom);
        		this.vieww += (value - this.lastZoom);
        		this.viewh += (value - this.lastZoom);
        		
        		this.lastZoom = value;
        	}
       		//this.drawLayers();
	    }
	    else if ("a|b|c|d".indexOf(prop) > -1) {
			//this.drawChart();
		}
	
	}
*/
    this.drawLayers = function(){
		//this.rvz=0.3+0.0005*((new Date()).getTime());
		//this.viewx+=0.0005*(dt2-dt);dt=dt2;
		//var 
		for(var i = 0;i<this.childNodes.length;i++){
			var l = this.childNodes[i];
			// lets go and calculate our new viewport based on parent 
			var x1 = l.x1 !== undefined ? l.x1 : this.x1;
			var y1 = l.y1 !== undefined ? l.y1 : this.y1;
			var x2 = l.x2 !== undefined ? l.x2 : this.x2;
			var y2 = l.y2 !== undefined ? l.y2 : this.y2;
			l.vx1 = x1, l.vy1 = y1, l.vx2 = x2, l.vy2 = y2;
			l.rx = -1.2, l.ry = 0, l.rz = 0.3+0.0005*((new Date()).getTime());
			l.tx = 0, l.ty  =0, l.tz = -5;
			l.draw( l );
		}
   	}
	
	this.zoom = function(factor){
        this.setProperty("zoomfactor", factor);
	}
	
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
		/*this.draww = this.oExt.offsetWidth;
		this.drawh = this.oExt.offsetHeight;*/

    }


    this.style = {
		grid : {
			line : '#cfcfcf',
			weight: 1,
			stepx : 20,
			stepy : 20
		},
		axis : {
			line : '#000000',
			weight: 1
		},
		persp : {
			x : 1,
			y : 1.4
		},
		side1 : {
			line : '#000000',
			weight : 1,
			fill : 'red'
		},
		side2 : {
			line : '#000000',
			weight : 1,
			fill : 'green'
		},
		side3 : {
			line : '#000000',
			weight : 1,
			fill : 'green'
		},		
		graph : {
			line : '#000000',
			weight: 1,
			steps : 100
		}
	};
	
	
    this.__loadJML = function(x){
        this.chartType = x.getAttribute("type") || "linear2D";
        
        var oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.oInt = oInt;/*
            ? jpf.JMLParser.replaceNode(oInt, this.oInt)
            : jpf.JMLParser.parseChildren(x, oInt, this);*/
        
		engine = (jpf.supportCanvas 
			? jpf.chart.canvasDraw
			: jpf.chart.vmlDraw).init(this);
		
		function parseStyle( str, obj ) {
			if(str)str.replace(/([\w\-]+)\:([^;]+);?/g, function(m,n,v){obj[n] = v});
			return obj;
		}
		
		function overloadStyle( s ){
			s.alpha = s.alpha !== undefined ? s.alpha : 1
			s.fillalpha = s.fillalpha!==undefined ? 
							  s.fillalpha:s.alpha;
			s.gradalpha = s.gradalpha!==undefined ?
							   s.gradalpha:s.fillalpha
			s.linealpha = s.linealpha!==undefined ?
								s.strokealpha:s.alpha
			s.angle = s.angle!==undefined ?	s.angle : 0;
			s.weight = s.weight!==undefined ? s.weight : 1
			return s;
		}
		
		
		for(var k in this.style){
			parseStyle( x.getAttribute(k), this.style[k] );
		}
		
		for (var o, i = 0; i < x.childNodes.length; i++){
			if (x.childNodes[i].nodeType != 1)
				continue;
			
			o = {
				__supportedProperties : ["left","top","width","height",
										 "x1", "y1", "x2", "y2", "t1", "t2",
										 "type", "zindex", "formula"],
				
				init : function(engine){
					this.engine = engine;
					//jpf.makeClass(this);
					engine.initLayer(this);
					this.draw  = jpf.chart.generic[this.type](this, engine);
				},
				
				data : 0,
				
				style : {},

				loadJML : function(x){
					var value, name, type, l, a, i, attr = x.attributes;

					// lets copy styles
					for(var k in this.parentNode.style ){
						this.style[k] = {};
						jpf.extend( this.style[k], this.parentNode.style[k] );
						overloadStyle(this.style[k]);
					}
					
			        for (i = 0, l = attr.length; i < l; i++) {
			            a     = attr[i];
			            value = a.nodeValue;
			            name  = a.nodeName;
			            if (this.style[name]) {
							overloadStyle(parseStyle( value, this.style[name] ));
						}
						else
							this[name] = value;
			        }
					/*
					if (this.zindex === undefined)
						this.zindex = i;
					for (var i =  this.__supportedProperties.length-1; i >= 0; i--) {
						var v = this.__supportedProperties[i];
						if (!this[v])
							this[v] = this.parentNode[v];// || this.parentNode.__defaults[v];
					}*/
					
					this.left = this.left || 0;
					this.top = this.top || 0;
					this.width = this.width || 1;
					this.height = this.height || 1;
				}
			}	
			
			o.parentNode = this;
			o.loadJML(x.childNodes[i]);
			o.init(engine);
			this.childNodes.push(o);
			//this.createLayer(0, "grid2D");
		}
		
		
		/* Events */
		
        var last, interact = false;
        this.oExt.onmousedown = function(e){
            if (!e) e = event;
            interact = true;
            last = {
                x : e.clientX,
                y : e.clientY,
                button : e.button,
                zoomfactor : _self.zoomfactor || 0
            };
        }
        		
        this.oExt.oncontextmenu = function(){
            return false;   
        }
        
        this.oExt.onmouseup  = 
        function(){
            interact = false;
        }
        var pthis = this;
        this.oExt.onmousemove = function(e){
            if (!interact) return;
            if (!e) e = event;
           
            var dx = (e.clientX - last.x), 
                dy = (e.clientY - last.y);
			last.x = e.clientX;
			last.y = e.clientY;
			
			if (start.button != 2)
			    start.y = e.clientY;
				
			// lets modify our translate and orbit values

			_self.setProperty("translatex",
				_self.translatex + dx * _self.zoomx );
			_self.setProperty("translatey",
				_self.translatey + dy * _self.zoomy );
		}
			
/*
			var dw = pthis.draww/pthis.vmlscale,
				dh = pthis.drawh/pthis.vmlscale;
		
			if(pthis.mode3D){
			    pthis.rvz -= 4*(dx/dw);
			    if (start.button == 2)
                    _self.setProperty("zoomfactor", start.zoomfactor + (dy/10));
                else
                    pthis.rvx += 4*(dy/dh);
			} else {
			    pthis.viewx -= (dx/dw)*pthis.vieww;
			    if (start.button == 2)
                    _self.setProperty("zoomfactor", start.zoomfactor + (dy/10));
                else
    				pthis.viewy -= (dy/dh)*pthis.viewh;
			}
			*/

	/*
		onScroll = function(delta, event){
			return _self.__handlePropSet("zoomfactor", (_self.zoomfactor || 0) - delta/3);
		    
			var d = 0.05 //5%			
			
			if (delta < 0){	
				_self.zoom(space.x*(1+d), space.y*(1+d), space.w*(1-2*d), space.h*(1-2*d));				
			}
			else{
				_self.zoom(space.x*(1-d), space.y*(1-d), space.w*(1+2*d), space.h*(1+2*d));				
			}
		}
		
		wheelEvent = function(event) {
	        var delta = 0;
	        if(!event) {
	            event = window.event;
	        } 
	        if(event.wheelDelta) {
	            delta = event.wheelDelta/120; 
	            if (window.opera) {
	                delta = -delta;
	            } 
	        } 
	        else if(event.detail) {
	            delta = -event.detail/3;
	        }
	        if(delta) {
				// lets go and 
	            onScroll(delta, event);
	        }
	        if(event.preventDefault) {
	            event.preventDefault();
	        }
	        event.returnValue = false;
	    }
		
		
		if (engine.canvas && engine.canvas.addEventListener){
			engine.canvas.addEventListener('DOMMouseScroll', wheelEvent, false);
		}
    	this.oExt.onmousewheel = wheelEvent;
		*/
		window.setInterval(function(){
			_self.drawLayers();
		},10);
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
			 x, y, z, zt, i, j, k;\n";
	},
	scale3D : function(s){
		return "\
			m00=m00*"+s+",m01=m01*"+s+",m02=m02*"+s+",\
			m10=m10*"+s+",m11=m11*"+s+",m12=m12*"+s+",\
			m20=m20*"+s+",m21=m21*"+s+",m22=m22*"+s+";";
	},
	head2D : function(e){
		return "\
		var dh = l.dh,dw = l.dw,\n\
			vx1 = l.vx1, vy1 = l.vy1,\n\
			vx2 = l.vx2, vy2 = l.vy2, vh =  vx2-vx1, vw = vy2-vy1,\n\
			sw = dw / vw, sh = dh / vh,\n\
			a = l.a||0, b = l.b||0, c = l.c||0, d = l.d||0,\n\
			n = (new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\n\
			x, y, i, j, k;\n";
	},
	
	mathParse : function(s){
		return s.toLowerCase().replace(/([0-9\)])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1");
	},
	/*
	defstyle : function( layer, name ){
		var s = layer.style && layer.style[name] || this.defaults[name];

		s.alpha = s.alpha !== undefined ? s.alpha : 1
		s.fillalpha = s.fillalpha!==undefined ? 
						  s.fillalpha:s.alpha;
		s.gradalpha = s.gradalpha!==undefined ?
						   s.gradalpha:s.fillalpha
		s.linealpha = s.linealpha!==undefined ?
							s.strokealpha:s.alpha
		s.angle = s.angle!==undefined ?	s.angle : 0;
		s.weight = s.weight!==undefined ? s.weight : 1
		return s;
	},

	defval : function(layer, name, value ){
		return (layer.style && layer.style[name]!==undefined && 
				layer.style[name][value]!==undefined) ?  
			layer.style[name][value] : 
			this.defaults[name][value];
	},*/
	
	// args: oChart, layer, engine
    grid2D : function(l,e){
		e.allocShape(l, l.style.grid);
		e.allocShape(l, l.style.axis);
		e.allocDone(l);
		
		var c = [
		this.head2D( e ),
		e.beginLayer(),
		e.clear(),
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
		e.endLayer()];
		return new Function('l',c.join(''));
    },
	
	gridStore : function(pref){
		return "\
		if(!l."+pref+"x || l."+pref+"x.length<sx*sy)l."+pref+"x = new Array(sx*sy);\
		if(!l."+pref+"y || l."+pref+"y.length<sx*sy)l."+pref+"y = new Array(sx*sy);"
	},
	
    grid3D : function(l,e){
		e.allocShape(l,l.style.grid);
		e.allocShape(l,l.style.axis);
		e.allocDone(l);
		
		var c = [
		this.head3D(e),
		"var sx = ",l.style.grid.stepx,", sy = ",l.style.grid.stepy,", dx = (vw)/(sx-1), dy = (vh)/(sy-1);",
		this.gridStore('gta'),
		"var gx=l.gtax, gy=l.gtay;",
		e.beginLayer(l),
		e.clear(),
		e.beginShape(0),
		"for(y = vy1,j = 0,k = 0; j < sy; y += dy,j++){\
			for(x = vx1, i = 0; i < sx; x += dx,i++,k++){\
				zt = m20*x+m21*y+m23;\
				if(i) ",e.lineTo('gx[k]=(m00*x+m01*y+m03)*ax/zt+dw2',
							 'gy[k]=(m10*x+m11*y+m13)*ay/zt+dh2'),
				"else ",e.moveTo('gx[k]=(m00*x+m01*y+m03)*ax/zt+dw2',
							 'gy[k]=(m10*x+m11*y+m13)*ay/zt+dh2'),
			"}\
		}\
		for(i=0;i<sx;i++)for(j=0; j<sy; j++, z=i+j*sx){\
			if(j)",e.lineTo('gx[z]','gy[z]'),"else ",e.moveTo("gx[i]","gy[i]"),
		"}",
		e.endShape(),
		((!e.getValue('showxy',1))?"":
			(e.beginShape(1,'dw2','dh2')+
			"zt=vx1*m20+m23;"+e.moveTo( '(vx1*m00+m03)*ax/zt','(vx1*m10+m13)*ay/zt' )+
			"zt=vx2*m20+m23;"+e.lineTo( '(vx2*m00+m03)*ax/zt','(vx2*m10+m13)*ay/zt' )+
			"zt=vy1*m21+m23;"+e.moveTo( '(vy1*m01+m03)*ax/zt','(vx1*m11+m13)*ay/zt' )+
			"zt=vy2*m21+m23;"+e.lineTo( '(vy2*m01+m03)*ax/zt','(vy2*m11+m13)*ay/zt' )+
			((!e.getValue('showz',1))?"":
				("zt=-m22+m23;"+e.moveTo( '(-m02+m03)*ax/zt','(-m12+m13)*ay/zt' )+
				 "zt= m22+m23;"+e.lineTo( '( m02+m03)*ax/zt','( m12+m13)*ay/zt' ) ) )+
			e.endShape() ) ) ,
		e.endLayer()].join('');
		return new Function('l',c);
	},

	formulaFX2D : function(l,e){
		e.allocShape(l, l.style.graph);
		e.allocDone(l);
		var func = this.mathParse(l.formula);
		var c = [
			this.head2D(e),
			e.beginLayer(l),
			e.beginShape(0,"-vx1*sw","-vy1*sh"),
			"var lx = vw/",l.style.graph.steps,"; x = vx1, vx2+=lx;",
			e.moveTo("vx1*sw", func+"*-sh")+
			"for(x+=lx; x<=vx2; x+=lx)"+e.lineTo("x*sw",func+"*-sh"),
			(!e.getValue('fill') ? "" :
			 e.lineTo("vx1*sw+dw+"+e.getValue('weight',1)*4,
					  "vy1*sh+dh+"+e.getValue('weight',1)*4)+
			 e.lineTo("vx1*sw-"+e.getValue('weight',1)*4,
					  "vy1*sh+dh+"+e.getValue('weight',1)*4)
			),
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
	
	quad3D : function( e,p){
		return [
				 "zt = m20*",p[0][0],"+m21*",p[0][1],"+m22*",p[0][2],"+m23;",
			e.moveTo("(m00*"+p[0][0]+"+m01*"+p[0][1]+"+m02*"+p[0][2]+"+m03)*ax/zt+dw2",
					 "(m10*"+p[0][0]+"+m11*"+p[0][1]+"+m12*"+p[0][2]+"+m13)*ay/zt+dh2"),
				 "zt = m20*",p[1][0],"+m21*",p[1][1],"+m22*",p[1][2],"+m23;",
			e.lineTo("(m00*"+p[1][0]+"+m01*"+p[1][1]+"+m02*"+p[1][2]+"+m03)*ax/zt+dw2",
					 "(m10*"+p[1][0]+"+m11*"+p[1][1]+"+m12*"+p[1][2]+"+m13)*ay/zt+dh2"),
				 "zt = m20*",p[2][0],"+m21*",p[2][1],"+m22*",p[2][2],"+m23;",
			e.lineTo("(m00*"+p[2][0]+"+m01*"+p[2][1]+"+m02*"+p[2][2]+"+m03)*ax/zt+dw2",
					 "(m10*"+p[2][0]+"+m11*"+p[2][1]+"+m12*"+p[2][2]+"+m13)*ay/zt+dh2"),
				 "zt = m20*",p[3][0],"+m21*",p[3][1],"+m22*",p[3][2],"+m23;",
			e.lineTo("(m00*"+p[3][0]+"+m01*"+p[3][1]+"+m02*"+p[3][2]+"+m03)*ax/zt+dw2",
					 "(m10*"+p[3][0]+"+m11*"+p[3][1]+"+m12*"+p[3][2]+"+m13)*ay/zt+dh2"),
			e.close()
		].join('').replace(/m\d\d\*0\+/g,"");
	},
	
	cubeStore : function(pref,len){
		return "\
		if(!l."+pref+"x || l."+pref+"x.length<"+len+"*8)l."+pref+"x = new Array("+len+"*8);\
		if(!l."+pref+"y || l."+pref+"y.length<"+len+"*8)l."+pref+"y = new Array("+len+"*8);\
		var _ci = 0, _cx = l."+pref+"x, _cy = l."+pref+"y;";
	},	
	
	cubeStore3D : function(p){
		var s = [];
		for(var j = 0;j<8; j++){
			var pt = p[j];
			s.push("zt = m20*",pt[0],"+m21*",pt[1],"+m22*",pt[2],"+m23;",
				   "_cx[_ci]=(m00*",pt[0],"+m01*",pt[1],"+m02*",pt[2],"+m03)*ax/zt+dw2;",
				   "_cy[_ci++]=(m10*",pt[0],"+m11*",pt[1],"+m12*",pt[2],"+m13)*ay/zt+dh2;");
		}
		return s.join('').replace(/m\d\d\*0\+/g,"");
	},

	cube3D : function(p){
		var s = [];
		for(var j = 0;j<8; j++){
			var pt = p[j];
			s.push("zt = m20*",pt[0],"+m21*",pt[1],"+m22*",pt[2],"+m23;",
				   "_cx[_ci]=(m00*",pt[0],"+m01*",pt[1],"+m02*",pt[2],"+m03)*ax/zt+dw2;",
				   "_cy[_ci++]=(m10*",pt[0],"+m11*",pt[1],"+m12*",pt[2],"+m13)*ay/zt+dh2;");
		}
		return s.join('').replace(/m\d\d\*0\+/g,"");
	},
	
	barFX3D : function(l,e){
	// we should allocate 3 shapes. s1,s2 and s3
		e.allocShape(l, l.style.side1 );
		e.allocShape(l, l.style.side2 );
		e.allocShape(l, l.style.side3 );

		e.allocDone(l);
		var func = this.mathParse(l.formula);
		var c = [
			this.head3D(e),
			e.beginLayer(l),
			this.cubeStore('bfx3',20),
			e.beginShape(0),
			"var lx = vw/15, xw, w = vw/20, d = 0.2;",
			// now we need to draw a graph 'func' high and x in width
			"for(x = vx1; x<=vx2; x+=lx){",
				"xw = x+w, z = ",func,";",
				this.cubeStore3D([
					["x",0,0],["xw",0,0],["xw",0,"z"],["x",0,"z"],
					["x","d",0],["xw","d",0],["xw","d","z"],["x","d","z"]]),
				"i = _ci-4;",
				e.moveTo( "_cx[i]","_cy[i++]"),e.lineTo("_cx[i]","_cy[i++]"),
				e.lineTo("_cx[i]","_cy[i++]"),e.lineTo("_cx[i]","_cy[i++]"),
				e.closeend(),
			"}",
			e.endShape(),
			e.beginShape(1),
			"for(i = 0;i<_ci;i+=8){",
				e.moveTo( "_cx[i+1]","_cy[i+1]"),e.lineTo("_cx[i+5]","_cy[i+5]"),
				e.lineTo("_cx[i+6]","_cy[i+6]"),e.lineTo("_cx[i+2]","_cy[i+2]"),
				e.closeend(),
			"}",
			e.endShape(),
			e.beginShape(2),
			"for(i = 0;i<_ci;i+=8){",
				e.moveTo( "_cx[i+3]","_cy[i+3]"),e.lineTo("_cx[i+2]","_cy[i+2]"),
				e.lineTo("_cx[i+6]","_cy[i+6]"),e.lineTo("_cx[i+7]","_cy[i+7]"),
				e.closeend(),
			"}",
			e.endShape(),			
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	}	
	
	
	/*
	
    function calcSpace2D(data, s){
       var vi, x, y, x1 = s.x, x2 = s.x + s.w,
       y1 = s.y, y2 = s.y + s.h;
       
	   for(vi = data.length-1; vi >= 0; vi--){
           x = data[vi][0], y = data[vi][1];
           if( x < x1) x1=x; 
           if( x > x2) x2=x; 
           if( y < y1) y1=y; 
           if( y > y2) y2=y; 
       }
    }

	formulaFXY3D : function(o,l,e){
	
		e.allocShape(l,1);
		e.allocDone(l);
		var func = this.mathParse(l.data);
		var c = this.head3D(e)+
			"var sx = o.stepx, sy = o.stepy,dx = vw/(sx-1), dy = vh/(sy-1);"+
			this.gridStore('ta')+
			"var gx=o.tax, gy=o.tay;"+
			e.beginLayer()+
			e.beginShape()+
			"try{\
				for(y = vy,j = 0,k = 0; j < sy; y += dy,j++){\
					for(x = vx, i = 0; i < sx; x += dx,i++,k++){\
						z = ("+func+")*0.2;\
						zt = m20*x+m21*y+m22*z+m23;\
						if(i)"+e.lineTo("gx[k]=(m00*x+m01*y+m02*z+m03)*ax/zt+dw2",
									 "gy[k]=(m10*x+m11*y+m12*z+m13)*ay/zt+dh2")+
						"else "+e.moveTo("gx[k]=(m00*x+m01*y+m02*z+m03)*ax/zt+dw2",
									 "gy[k]=(m10*x+m11*y+m12*z+m13)*ay/zt+dh2")+
					"}\
				}"+
				(l.style.lines?"":
					("for(i=0;i<sx;i++)for(j=0; j<sy; j++, z=i+j*sx){\
						if(j)"+e.lineTo("gx[z]","gy[z]")+
						"else "+e.moveTo("gx[i]","gy[i]")+
					"}")
				)+
			"}catch(x){}"+
			e.endShape()+
			e.endLayer();
		try{		
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
	
	formulaFT2D : function(o,l,e){
		
		var farr = this.mathParse(l.data).split(";");
		var fx = farr[0], fy = (farr.length>1)?farr[1]:fx;
		
		e.allocShape(l,1);
		e.allocDone(l);
		
		var c=this.head2D(e)+
			e.beginLayer()+
			e.beginShape("-vx*sw","-vy*sh")+
			"var ts = o.tmin, te = o.tmax, t = ts, lt = (te-ts)/(o.stept||100);\
			try{"+
				e.moveTo(fx+"*sw",fy+"*-sh")+
				"for(t+=lt;t<=te; t+=lt)"+e.lineTo(fx+"*sw", fy+"*-sh")+
			"}catch(x){};"+
			e.endShape()+
			e.endLayer();
		
		try{
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
	
	formulaFT3D :  function(o,l,e){
	    
		var farr = this.mathParse(l.data).split(";");
		var fx = farr[0], fy = (farr.length>1)?farr[1]:fx, fz = (farr.length>2)?farr[2]:fx;

		e.allocShape(l,1);
		e.allocDone(l);
		
		var c = this.head3D(e)+
			e.beginLayer()+
			e.beginShape("dw2","dh2")+
			"var st = 1,ts = o.tmin, te = o.tmax, t = ts, lt = (te-ts)/(o.stept||100);\
			try{\
				x = ("+fx+")*st, y = ("+fy+")*st, z = ("+fz+")*st;\
				zt = m20*x+m21*y+m22*z+m23; t+=lt;"+
				e.moveTo( "(m00*x+m01*y+m02*z+m03)*ax/zt", 
							"(m10*x+m11*y+m12*z+m13)*ay/zt")+
				"for(t+=lt ;t<=te; t+=lt){\
					x = ("+fx+")*st, y = ("+fy+")*st, z = ("+fz+")*st;\
					zt = m20*x+m21*y+m22*z+m23;"+
					e.lineTo("(m00*x+m01*y+m02*z+m03)*ax/zt",
								"(m10*x+m11*y+m12*z+m13)*ay/zt")+
				"}\
			} catch(x){}"+
			e.endShape()+
			e.endLayer();

		try{
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},

	formulaFXY2D : function(o,l,e){
		var func = this.mathParse(l.data);
		
		e.allocShape(l,1);
		e.allocDone(l);
		
		var c = this.head2D(e)+
			e.beginLayer()+
			e.beginShape()+
			"var sx = o.stepx, sy = o.stepy, dx = vw/(sx-1), dy = vh/(sy-1),\
				rdx = dw/(sx-1), rdy = dh/(sy-1),\
				hrdx = rdx/2, hrdy = rdy/2, rx, ry, z;\
			var pal=Array(255);\
			for(i = 0;i<256;i++)pal[i]='rgb('+i+','+i+','+i+')';\
			try{\
				for(y = vy, ry = 0; y<=ty; y += dy, ry += rdy){\
					for(x = vx, rx = 0; x<=tx; x += dx, rx += rdx){\
						z = ("+func+");z=z<0?0:(z>1?1:z);\
						"+e.pathRect("rx-hrdx*z","ry-hrdy*z","rdx*z","rdy*z")+
					"}\
				}\
			}catch(x){};"+
			e.endShape()+
			e.endLayer();
		try{
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
	
	series2D : function(o,l,e){
		e.allocShape(l,1);
		e.allocDone(l);
		//len < 10 || series[i + 4][0] > vx && series[len - 5][0] < tx) {\
		var c = this.head2D(e)+
			e.beginLayer()+
			e.beginShape("-vx*sw","-vy*sh")+
			"var series=this.data, len = series.length,lx,d,s,si=o.si||0; i = 0;\
			if (false){\
				s = series[0];"+
				e.moveTo("s[0]*sw", "s[1]*-sh")+
				"for(i = 1, s = series[1]; i < len; s = series[++i]){"+
					e.lineTo("s[0] * sw", "s[1] *-sh")+
				"}\
        	}else{\
				for(;si > 0 && series[si][0] >= vx; si--);\
	            for(i = si + 1, s = series[i], lx = series[si][0], d = 0;\
	              i < len && lx <= tx; s = series[++i]){\
	                if ((x = s[0]) >= vx){\
	                    if (!d) {\
	                        d++;"+
	                        e.moveTo("lx*sw","vy*sh+dh")+
	                        e.lineTo("lx*sw","series[o.si=(i-1)][1]*-sh")+
	                    "}"+
	                    e.lineTo("(lx = x) * sw", "s[1] * -sh")+
	                "}\
	            }"+
				e.lineTo("lx*sw", "vy*sh+dh")+
			"}"+
			e.endShape()+
			e.endLayer();
		//try{		
			return new Function('o',c);
		//}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		//}
	}

	
    pie2D : function(o, series, style, persist){
		var c = persist.ctx, radius = 150/(o.vw/2), startY = -1*o.vy*(o.dh/o.vh), startX = -1*o.vx*(o.dw/o.vw), TwoPI = Math.PI*2,
        startAngle = stopAngle = 0, colorFactor = o.colorFactor, selected = o.selected, distance = o.distance;  
		var colors = [
			{r: 109, g: 207, b: 246}, 
			{r: 0, g: 191, b: 243}, 
			{r: 0, g: 174, b: 239}, 
			{r: 0, g: 118, b: 163}, 
			{r: 0, g: 91, b: 127}];
        var i;
        
        //Move this to outside draw
        for(var i = 0, l = series.length, sum = 0; i < l; i++){
            if(series[i] > 0)
                sum += series[i];
        }
			
        c.lineWidth = 0.8;
        c.strokeStyle = "white";
        
        var rx, ry;
        for(var g, b, i = 0, l = series.length; i < l; i++){
            c.beginPath();
			g = (o.piece == i ? colors[i].g-colorFactor : colors[i].g);
			b = (o.piece == i ? colors[i].b-colorFactor : colors[i].b);
			c.fillStyle = "rgb("+colors[i].r+", "+g+", "+b+")";			
			
            stopAngle += (series[i] / sum) * TwoPI;
            
            rx = startX + (i == selected ? Math.cos(startAngle + (stopAngle - startAngle) / 2) * distance * radius : 0);
            ry = startY + (i == selected ? Math.sin(startAngle + (stopAngle - startAngle) / 2) * distance * radius : 0);
			            
            c.arc(rx, ry, radius, startAngle, stopAngle, false);
            
            startAngle = stopAngle;
            
            c.lineTo(rx, ry);
            c.closePath();
            c.fill();
            c.stroke();
            
        }
		
		//Move this to outside draw
		c.canvas.onclick = function(e){
		    if (!e)
		        e = event;
			
			var x = e.layerX - 43 - startX; //What is 43???
			var y = e.layerY - 13 - startY; //What is 13???
			
			var searchAngle = (Math.atan2(y,x) / Math.PI);
			if (searchAngle < 0)
			    searchAngle += 2;

			for(var i = 0, l = series.length, totalAngle = 0; i < l; i++){
				totalAngle += 2 * series[i] / sum;
				if (totalAngle > searchAngle) {
				    foundPiece = i;
				    break;
				}
			}
			
			if (o.selected == i)
			    return;
			
			o.selected = i;
			o.distance = 0;
			
			var timer = setInterval(function(){
			    o.distance += 0.05;
			    if (o.distance >= 0.2)
			        clearInterval(timer);
			}, 3);
		}	
    },
    
	
	*/
}

jpf.chart.canvasDraw = {
    canvas : null,
	init : function(o, oHtml){
	              
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", oHtml.offsetWidth);
        canvas.setAttribute("height", oHtml.offsetHeight);
        canvas.className = "canvas";		
        oHtml.appendChild(canvas);
        o.canvas = canvas.getContext('2d');
    },
   
	vml : 0,
	
	unit : function() { return 1; },
	
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
	
	rgb : function(c, a){
		c = c.toLowerCase();
		if(this.colors[c]!==undefined)	c = this.colors[c];
		if(a===undefined || a==1) return c;
		a *= 255; a > 255 ? 255 : ( a < 0 ? 0  :a );
		var x = parseInt(c.replace('#','0x'),16);
		return 'rgba('+((x>>16)&0xff)+','+((x>>8)&&0xff)+','+(x&0xff)+','+a+')';
	},
	
	clear : function() {
		return "canvas.clearRect(0, 0, dw, dh);";
	},

    createLayer : function(o, zindex, x, y, h, w){ 
		
		return { 
			canvas : o.canvas, 
			width : o.draww,
			height : o.drawh,
			zindex : zindex,
			gradients : []
		};
    },
    
    destroyLayer : function(l){
    },

    beginLayer : function(l){
		this.l = l;
		return "var _x1,_x2,_y1,_y2;";
    },

    endLayer : function(l){
		this.l = null;
		return "";
    },

    allocShape : function( l, style ){
		var s = [];
		if(style.fill !== undefined){
			if(style.gradient !== undefined){
				//lets make a gradient object
				var a = style.angle;
				(sin(a)/2+1)
				(cos(a)/2+1)
				(sin(a+Math.PI*0.5)/2+1)
				(cos(a+Math.PI*0.5)/2+1)
				
				var g = l.canvas.createLinearGradient(
					x1,y1,
					x2,y2
				);
				// we have an angle and we need to calculate the gradient
			//	g.
			} else {
				s.push("ctx.fillStyle='"+this.rgb(style.fill,af)+"';");
			}
		}
		/*
		// lets generate the style-setting code for what we have been given into an object
		alpha: null
		line  : black
		weight: 1
		fill  : null
		gradient  : null
		angle : null
		linealpha
		fillalpha
		gradalpha

		var s = l.cjoin, i, shape=[], path=[], child=[], opacity="";
		l.cstyles.push(style);
		// lets check the style object. what different values do we have?
		if(style.fill !== undefined){
			var of=(style.fillalpha!==undefined)?
			style.fillalpha:(style.alpha!==undefined?style.alpha:'1');
			if(style.gradient !== undefined){
				var og=(style.gradalpha!==undefined)?
				style.gradalpha:(style.fillalpha!==undefined?style.fillalpha:
					(style.alpha!==undefined?style.alpha:'1'));
				child.push("<v:fill opacity='",of,"' o:opacity2='",
					og,"' color='"+style.fill+"' color2='",
				style.gradient,"' type='gradient' angle='",
				(style.angle!==undefined?style.angle:0),"'/>");
			}else{
				child.push("<v:fill opacity='",of,"' color='",style.fill,"' type='fill'/>");
			}
			shape.push("fill='t'"),path.push("fillok='t'");
		}
		else
			shape.push("fill='f'"),path.push("fillok='f'");
		
		if(style.line !== undefined){	
			var ol=style.linealpha!==undefined?
			style.linealpha:(style.alpha!==undefined?style.alpha:'1');
			child.push("<v:stroke opacity='",ol,"' weight='",
			(style.weight!==undefined)?style.weight:1,"' color='",style.line,"'/>");
		}
		else
			shape.push("stroke='f'"), path.push("strokeok='f'");
	
        s.push("<v:shape "+l.vmltag+" path='' "+shape.join(' ')+"><v:path opacity='25%' "+
				path.join(' ')+"/>"+child.join(' ')+"</v:shape>");
		return s.length-1;
		*/
	},
    allocDone : function(){},
    
 	beginShape : function(x,y) {
/*				var gr = canvas.createLinearGradient(0,0,700,900);\
				gr.addColorStop(0,'red');\
				gr.addColorStop(1,'blue');\
				canvas.fillStyle=gr;\
*/
		this.d = (x||y) ? 1 : 0;
		return (this.d?
				"canvas.save();\
				canvas.translate("+x+","+y+");":"")+
				"canvas.beginPath();\
				canvas.lineWidth = 1;\
				canvas.strokeStyle = 'rgb(0,0,0)';";
	},
	moveTo : function(x,y){
		return "canvas.moveTo("+x+","+y+");";
		//return "cx[i]=null,cy[i++]=null,canvas.moveTo(cx[i]="+x+",cy[i++]="+y+");";
		//because we need to recreate the path for stroking, really quickly draw the path again
		//for(i=cx.length-1;i>=0;){c=cx[i];(c===null)?canvas.moveTo(cx[--i],cy[i--):canvas.lineTo(c,cy[i--]);}
	},
	lineTo : function(x, y){
		return "canvas.lineTo("+x+","+y+");";
	},
	rect : function( x,y,w,h ){
		//"canvas.fillRect("+x+","+y+","+w+","+h+");"
		return "_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+";\
			   canvas.fillRect(_x1,_y1,_x2,_y2);";

		//   canvas.fillRect(_x1,_y1,_x2,_y2);\
	},	
	endShape : function(n) {
		var d = this.d; this.d = 0;
		return (d?"canvas.restore();":"")+"canvas.stroke();";
	},
   
	rect : function( x,y,w,h ){
		return "canvas.fillRect("+x+","+y+","+w+","+h+");";
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
		
		o.oInt.innerHTML = "<v:group style='position:absolute;left:0;top:0;width:"+o.oExt.offsetWidth+';height:'+o.oExt.offsetHeight+
							";overflow:hidden;' coordorigin='0,0' coordsize='"+
							o.vmlwidth+","+o.vmlheight+"'></v:group>";
		o.vmlroot = o.oInt.lastChild;
		
		return this;
	},
    
 	vml : 1,
	
    initLayer : function(l){ 

		var p = l.parentNode;
        var vmlroot = p.vmlroot;

		l.dx = l.left * p.vmlwidth; 
		l.dy = l.top * p.vmlheight;
		l.dw = l.width * p.vmlwidth; 
		l.dh = l.height * p.vmlheight;
	
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
			child.push("<v:stroke opacity='",style.linealpha,"' weight='",
			style.weight,"' color='",style.line,"'/>");
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
			"_s.push('m'+"+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+",'l');\n":
			"_s.push('m'+"+(parseInt(x)==x ? x : "("+x+").toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? y : "("+y+").toFixed(0)" )+",'l');\n";
	},
	lineTo : function(x, y){
		return this.delta?
			"_s.push("+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+",'l');\n":
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
 

