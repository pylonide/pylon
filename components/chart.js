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

	this.tmin = 0;
	this.tmax = Math.PI;

    this.stepx = 20;
    this.stepy = 20;
    this.stepv = 4;
    this.stepg = 10;
	this.stept = 100;
    this.mode3D = 0;
    
    this.perspx = 1;
    this.perspy = 1.4;
    
    this.scalez = 0.1;
    this.scalet = 1;
    
	this.vara   = 0;
	this.varb 	= 0;
	this.varc	= 0;
	this.vard	= 0;
	
    this.rvx = -1.2;
    this.rvy = 0;
    this.rvz = 0.3;
    this.tvx = 0;
    this.tvy = 0;
    this.tvz = -3;

	this.layer   = [];
	this.vmlscale = 2;
    this.createLayer = function( zindex, type, style, data ){
        // use the engine to initialize this layer
        if(this.layer[zindex]){
            engine.destroyLayer(this.layer[zindex]);
        }
        this.layer[zindex] = engine.createLayer( this, zindex, type, style, data) 
    }
 
    this.drawLayers = function(){
		
		this.rvz=0.3+0.0005*((new Date()).getTime());
		for(var i = 0;i<this.layer.length;i++){
			this.layer[i].draw( this );
		}
   	 }
	
	this.__supportedProperties = ['formula', 'a','b','c','d', 'zoomfactor'];
	this.__handlePropSet = function(prop, value){
/*	    if (prop == "formula") {
	        this.addFormula('FXY3D',value, {color:"red",block:1,lines:0}, [[-1,-1],[1,1]]);
	    }
	    else*/ 
	if (prop == "zoomfactor") {
	        if (value < 0) {
    	        value = 0;
    	        this.zoomfactor = 0;
    	    }

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
	
    this.convertSeries2D_Array = function(s_array){
        return s_array;
        //return series.push(s_array);
    }
    this.convertSeries2D_XML = function(s_array){
        //return series.push(s_array);
    }	

    /* s - last space */
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

	
	this.zoom = function(factor){
        this.setProperty("zoomfactor", factor);
	}
	
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
		this.draww = this.oExt.offsetWidth;
		this.drawh = this.oExt.offsetHeight;
        var start, interact = false;
        this.oExt.onmousedown = function(e){
            if (!e) e = event;
            interact = true;
            start    = {
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
           
            var dx = (e.clientX - start.x), 
                dy = (e.clientY - start.y);
			
			start.x = e.clientX;
			
			if (start.button != 2)
			    start.y = e.clientY;
			
			if(pthis.mode3D){
			    pthis.rvz -= 4*(dx/pthis.draww);
			    if (start.button == 2)
                    _self.setProperty("zoomfactor", start.zoomfactor + (dy/10));
                else
                    pthis.rvx += 4*(dy/pthis.drawh);
			} else {
			    pthis.viewx -= (dx/pthis.draww)*pthis.vieww;
			    if (start.button == 2)
                    _self.setProperty("zoomfactor", start.zoomfactor + (dy/10));
                else
    				pthis.viewy -= (dy/pthis.drawh)*pthis.viewh;
			}
		}
    }
    
    this.__loadJML = function(x){
        this.chartType = x.getAttribute("type") || "linear2D";
        
        var oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.oInt = this.oInt
            ? jpf.JMLParser.replaceNode(oInt, this.oInt)
            : jpf.JMLParser.parseChildren(x, oInt, this);
        
        engine = jpf.supportCanvas 
                ? jpf.chart.canvasDraw
                : jpf.chart.vmlDraw;
        
        engine.init(this, this.oInt);
		
		/* Events */
	
		onScroll = function(delta, event){
			return _self.setProperty("zoomfactor", (_self.zoomfactor || 0) - delta/3);
		    
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
    }
}).implement(jpf.Presentation);


jpf.chart.generic = {
	head3D : function(e){
		return "\
		var  dw = o.draww, dh = o.drawh, dh2 = dh/2,dw2 = dw/2, canvas=o.canvas,\n\
			 vx = o.viewx, vy = o.viewy, vh = o.viewh, vw = o.vieww,\n\
		 	 tx = vx+vw,ty = vy+vh,\n\
			 a=o.vara||0, b=o.varb||0, c=o.varc||0,d=o.vard||0,\n\
			 n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\n\
			 ax = dw*o.perspx, ay = dh * o.perspy,\n\
			 ma = Math.cos(o.rvx),mb = Math.sin(o.rvx),\n\
			 mc = Math.cos(o.rvy),md = Math.sin(o.rvy),\n\
			 me = Math.cos(o.rvz),mf = Math.sin(o.rvz),\n\
			 m00=mc*me,m01=-mf*mc,m02=md,m03=o.tvx,\n\
			 m10=(me*mb*md+mf*ma),m11=(-mb*md*mf+ma*me),m12=-mb*mc,m13=o.tvy,\n\
			 m20=(-ma*md*me+mb*mf),m21=(ma*md*mf+me*mb),m22=ma*mc,m23=o.tvz,\n\
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
		var dh = o.drawh,dw = o.draww, canvas=o.canvas,\n\
			vx = o.viewx, vy = o.viewy, vh = o.viewh, vw = o.vieww,\n\
			tx = vx+vw, ty = vy+vh, sw = dw / vw, sh = dh / vh,\n\
			a=o.a||0, b=o.b||0, c=o.c||0,d=o.d||0,\n\
			n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\n\
			x, y, i, j, k;\n";
	},
	
	mathParse : function(s){
		return s.toLowerCase().replace(/([0-9\)])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1");
	},
	
	// args: oChart, layer, engine
    grid2D : function(o,l,e){
		
		e.allocPath(l,2);
		e.allocDone(l);
		
		var c = this.head2D(e)+
		e.beginLayer()+
		e.clear()+
		e.beginPath()+
		"for(gx = Math.pow(5, Math.round(Math.log(vw/5)/ Math.log(5))),\
			x = Math.round(vx / gx) * gx - vx - gx; x < vw + gx; x += gx){"+
			e.moveTo("x*sw","0")+
			e.lineTo("x*sw","dh")+
		"};\
		for(gy = Math.pow(5, Math.round(Math.log(vh/5)/ Math.log(5))),\
			y = Math.round(vy / gy) * gy - vy - gy; y < vh + gy; y += gy){"+
			e.moveTo("0","y*sh")+
			e.lineTo("dw","y*sh")+
		"};"+
		e.endPath()+
		e.beginPath()+
		e.moveTo("0", "-vy*sh")+e.lineTo("dw","-vy*sh")+
		e.moveTo("-vx*sw", "0")+e.lineTo("-vx*sw","dh")+
		e.endPath()+
		e.endLayer();
		return new Function('o',c);
    },
	
	gridStore : function(pref){
		return "\
		if(!o."+pref+"x || o."+pref+"x.length<sx*sy)o."+pref+"x = new Array(sx*sy);\
		if(!o."+pref+"y || o."+pref+"y.length<sx*sy)o."+pref+"y = new Array(sx*sy);"
	},
	
    grid3D : function(o,l,e){
		e.allocPath(l,2);
		e.allocDone(l);
		
		var c = this.head3D(e)+";\
		var sx = o.stepg, sy = o.stepg, dx = (o.gridw)/(sx-1), dy = (o.gridh)/(sy-1);\
		vx = o.gridx, vy = o.gridy, tx=vx+o.gridw, ty=vy+o.gridh;"+
		this.gridStore('gta')+
		"var gx=o.gtax, gy=o.gtay;"+
		e.beginLayer()+
		e.clear()+
		e.beginPath()+
		"for(y = vy,j = 0,k = 0; j < sy; y += dy,j++){\
			for(x = vx, i = 0; i < sx; x += dx,i++,k++){\
				zt = m20*x+m21*y+m23;\
				if(i) "+e.lineTo('gx[k]=(m00*x+m01*y+m03)*ax/zt+dw2',
							 'gy[k]=(m10*x+m11*y+m13)*ay/zt+dh2')+
				"else "+e.moveTo('gx[k]=(m00*x+m01*y+m03)*ax/zt+dw2',
							 'gy[k]=(m10*x+m11*y+m13)*ay/zt+dh2')+
			"}\
		}\
		for(i=0;i<sx;i++)for(j=0; j<sy; j++, z=i+j*sx){\
			if(j)"+e.lineTo('gx[z]','gy[z]')+"else "+e.moveTo("gx[i]","gy[i]")+
		"}"+
		e.endPath()+
		((l.style && l.style.axis==0)?"":
			(e.beginPath('dw2','dh2')+
			"zt=vx*m20+m23;"+e.moveTo( '(vx*m00+m03)*ax/zt','(vx*m10+m13)*ay/zt' )+
			"zt=tx*m20+m23;"+e.lineTo( '(tx*m00+m03)*ax/zt','(tx*m10+m13)*ay/zt' )+
			"zt=vy*m21+m23;"+e.moveTo( '(vy*m01+m03)*ax/zt','(vx*m11+m13)*ay/zt' )+
			"zt=ty*m21+m23;"+e.lineTo( '(ty*m01+m03)*ax/zt','(ty*m11+m13)*ay/zt' )+
			((l.style && l.style.nozaxis)?"":
				("zt=-m22+m23;"+e.moveTo( '(-m02+m03)*ax/zt','(-m12+m13)*ay/zt' )+
				 "zt= m22+m23;"+e.lineTo( '( m02+m03)*ax/zt','( m12+m13)*ay/zt' ) ) )+
			e.endPath() ) ) +
		e.endLayer();
		
		return new Function('o',c);
	},
	
	formulaFX2D : function(o,l,e){
	
		e.allocPath(l,1);
		e.allocDone(l);
		var func = this.mathParse(l.data);
		var c = this.head2D(e)+
			e.beginLayer()+
			e.beginPath("-vx*sw","-vy*sh")+
			"var lx = vw/(dw/o.stepv); x = vx;"+
			e.moveTo("vx*sw", func+"*-sh")+
			"for(x+=lx; x<=tx; x+=lx)"+e.lineTo("x*sw",func+"*-sh")+
			e.endPath()+
			e.endLayer();
		try{		
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},

	formulaFXY3D : function(o,l,e){
	
		e.allocPath(l,1);
		e.allocDone(l);
		var func = this.mathParse(l.data);
		var c = this.head3D(e)+
			"var sx = o.stepx, sy = o.stepy,dx = vw/(sx-1), dy = vh/(sy-1);"+
			this.gridStore('ta')+
			"var gx=o.tax, gy=o.tay;"+
			e.beginLayer()+
			e.beginPath()+
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
			e.endPath()+
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
		
		e.allocPath(l,1);
		e.allocDone(l);
		
		var c=this.head2D(e)+
			e.beginLayer()+
			e.beginPath("-vx*sw","-vy*sh")+
			"var ts = o.tmin, te = o.tmax, t = ts, lt = (te-ts)/(o.stept||100);\
			try{"+
				e.moveTo(fx+"*sw",fy+"*-sh")+
				"for(t+=lt;t<=te; t+=lt)"+e.lineTo(fx+"*sw", fy+"*-sh")+
			"}catch(x){};"+
			e.endPath()+
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

		e.allocPath(l,1);
		e.allocDone(l);
		
		var c = this.head3D(e)+
			e.beginLayer()+
			e.beginPath("dw2","dh2")+
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
			e.endPath()+
			e.endLayer();

		try{
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},

	formulaFXY2D : function(o,l,e){
		var func = this.mathParse(l.data);
		
		e.allocPath(l,1);
		e.allocDone(l);
		
		var c = this.head2D(e)+
			e.beginLayer()+
			e.beginRects()+
			"var sx = o.stepx, sy = o.stepy, dx = vw/(sx-1), dy = vh/(sy-1),\
				rdx = dw/(sx-1), rdy = dh/(sy-1),\
				hrdx = rdx/2, hrdy = rdy/2, rx, ry, z;\
			var pal=Array(255);\
			for(i = 0;i<256;i++)pal[i]='rgb('+i+','+i+','+i+')';\
			try{\
				for(y = vy, ry = 0; y<=ty; y += dy, ry += rdy){\
					for(x = vx, rx = 0; x<=tx; x += dx, rx += rdx){\
						z = ("+func+");z=z<0?0:(z>1?1:z);\
						"+e.rect("rx-hrdx*z","ry-hrdy*z","rdx*z","rdy*z")+
					"}\
				}\
			}catch(x){};"+
			e.endRects()+
			e.endLayer();
				/*
				}else{\
					for(y = vy, ry = 0; y<=ty; y += dy, ry += rdy){\
						for(x = vx, rx = 0; x<=tx; x += dx, rx += rdx){\
							z=parseInt(("+fstr+")*255);\
							ctx.fillStyle = pal[(z<0)?0:(z>255?255:z)];\
							ctx.fillRect(rx,ry,rdx,rdy);\
						}\
					}\
				}\*/
		try{
			return new Function('o',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	}/*,		
	

    linear : function(o, series, style, persist){
        //do stuff
    },
    
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
    
    linear2D : function(o, series, style, persist){
        var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sh, c = persist.ctx, tx = o.tx,ty = o.ty,
            len = series.length, i, si = persist.si, s, lx, d; 
    
        if (len < 2) 
            return;

		c.save();
        c.beginPath();
		c.lineWidth = 1;
	
        c.strokeStyle = (style.color || defaultStyle.color);
		
		c.translate(-vx*sw,-vy*sh);

        if (len < 10 || series[i + 4][0] > vx && series[len - 5][0] < tx) {
            var i, s = series[0];
            c.moveTo(s[0] * sw, dh - s[1] * sh);
            for(i = 1, s = series[1]; i < len; s = series[++i])       
                c.lineTo(s[0] * sw, -s[1] * sh);
            
        } 
        else {
            for(;si >= 0 && series[si][0] >= vx; si--);
            
            for(i = si + 1, s = series[i], lx = series[si][0], d = 0; 
              i < len && lx <= tx; s = series[++i]){
                if ((x = s[0]) >= vx){
                    if (!d) {
                        d++; 
                        area.moveTo(lx * sw,
                            dh - series[persist.si = (i - 1)][1] * sh);
                    }
                    
                    c.lineTo((lx = x) * sw, - s[1] * sh);
                }
            }
        }
        
        c.stroke();
		c.restore();
	},

	formula : function(o, eq, style, persist,pthis){
		eq(o,style,persist,pthis);
    },
	callback : function(o,callback,style,persist){
		var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sh, c = persist.ctx, tx = o.tx,ty = o.ty,
			density = style.density || 1, lx = vw/(dw/density), x = vx; 			
		c.save();
        c.beginPath();
		c.lineWidth = 1;
		c.translate(-vx*sw,vy*sh);
        c.strokeStyle = (style.color || defaultStyle.color);
		c.moveTo(x * sw, dh - callback(x)*sh); x +=lx;
		for(;x<=tx; x += lx)
			c.lineTo(x * sw, dh - callback(x) * sh);
        c.stroke();
		c.restore();
	}
}
	
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

	clear : function() {
		return "canvas.clearRect(0, 0, dw, dh);";
	},

    createLayer : function(o, zindex, type, style, data){ 
        var l = {
            style : style,
            data : data,
            zindex : zindex,
			draw : 0
        };
        // generate function
        l.draw = jpf.chart.generic[type](o, l, this);
        return l;
    },
    
    destroyLayer : function(l){
        // we should remove the layer from the output group.
        l.draw = null;
        l.data = null;        
    },

    beginLayer : function(l){
		return "";
    },

    endLayer : function(l){
		return "";
    },

	// require functions alloc
    allocPath : function(l, max, style){},
    allocRect : function() {},
    allocDone : function(){},
    
    // modify the style for the next shape we will draw
	strokeWidth : function(w){
	},
	
	strokeColor : function(c){
	},
	
    fillColor : function(c){
    },

	beginPath : function(x,y) {
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
	},
	lineTo : function(x, y){
		return "canvas.lineTo("+x+","+y+");";
	},
	endPath : function(n) {
		var d = this.d; this.d = 0;
		return (d?"canvas.restore();":"")+"canvas.stroke();";
	},
   
	rect : function( x,y,w,h ){
		return "canvas.fillRect("+x+","+y+","+w+","+h+");";
	}	
}

var __vmltag = 0;
jpf.chart.vmlDraw = {
	
    init : function(o, oHtml){
        jpf.importCssString(document, "v\:* {behavior: url(#default#VML);}");
		
		var tag = 'style="position:absolute;top:0;left:0;width:'+o.draww+';height:'+
		o.drawh+';overflow:hidden;display:none;" coordorigin="0,0" coordsize="'+
		(o.draww*=o.vmlscale)+','+(o.drawh*=o.vmlscale)+'"'; 
        
		o.oInt.onselectstart = function(){
			return false;
		}
		
		o.oInt.innerHTML = "<v:group "+tag+"></v:group>";
		o.vmlroot = o.oInt.lastChild;
		o.vmlroot.style.display = "block";
		
        o.vmltag = 'style="position:absolute;top:0;left:0;width:'+o.draww*o.vmlscale+
		';height:'+o.drawh*o.vmlscale+';display:none;" coordorigin="0,0" coordsize=="'+
		o.draww*o.vmlscale+','+o.drawh*o.vmlscale+'"';
		},
    
 	vml : 1,
	
    createLayer : function(o, zindex, type, style, data){ 
        
        var vmlroot = o.vmlroot;
        vmlroot.insertAdjacentHTML("beforeend", "<v:group "+o.vmltag+" />");
        var vmlgroup = o.vmlroot.lastChild;
        if (vmlroot.childNodes[zindex] != vmlgroup)
            vmlroot.insertBefore(vmlgroup, vmlroot.childNodes[zindex]);
   		vmlgroup.style.display = "block";
        var l = {
            style : style,
            data : data,
            zindex : zindex,
			draw : 0,
            vmlgroup : vmlgroup,
            vmltag : o.vmltag,
			// shape caches
            cshape : [],
            cjoin : [],
            cpatho : 0,
            cpathn : 0,
            crecto : 0,
            crectn : 0
        };
        
        // generate function
        l.draw = jpf.chart.generic[type](o, l, this);

        return l;
    },
    
    destroyLayer : function(l){
        // we should remove the layer from the output group.
        l.vmlgroup.removeNode();
        l.vmlgroup = null;
        l.cshapes = null;
        l.draw = null;
        l.data = null;        
    },

    beginLayer : function(l){
        return "var _t,_s, _dx,_dy, _x1,_y1,_x2,_y2,_cshape = this.cshape, _cpatho=this.cpatho,\n\
                _crecto=this.crecto, _cpathn = _cpatho, _crectn = _crecto;\n";
    },

    endLayer : function(l){
        // we might want to put display="none" on the last used set of caches
        return "for(i = this.cpathn-1;i>=_cpathn;i--)_cshape[i].style.display='none';this.cpathn = _cpathn;\n\
				for(i = this.crectn-1;i>=_crectn;i--)_cshape[i].style.display='none';this.crectn = _crectn;\n";
    },

	// require functions alloc
    allocPath : function(l, max, style){
		var s = l.cjoin, i;
        l.cpatho = s.length;
        for(i=0;i<max;i++)
            s.push("<v:shape "+l.vmltag+" fill='f' fillcolor='red' strokeweight='1px' path=''><v:path fillok='t'/><v:fill color2='blue' type='gradient' angle='180'></v:shape>");
    },

    allocRect : function(l, max, style) {
        var s = l.cjoin, i;
        l.crecto = s.length;
        for(i=0;i<max;i++)
            s.push("<v:rect style='display:none'/>");
    },

    allocDone : function(l){
        var s = l.cjoin, i, t;
		l.vmlgroup.innerHTML = l.cjoin.join('');
        thiscjoin = 0;
        for(i=0;i<s.length;i++)
            l.cshape[i] = l.vmlgroup.childNodes[i];
    },
	
	clear : function() {
		return "";
	},
    
    // modify the style for the next shape we will draw
	strokeWidth : function(w){
	},
	
	strokeColor : function(c){
	},
	
    fillColor : function(c){
    },

	beginPath : function(x,y) {
		this.d = (x||y) ? 1 : 0;
		return "_s=[]"+(this.d?",_dx = ("+x+"),_dy=("+y+")":"")+";\n";
	},
	moveTo : function(x,y){
		return this.d?
			"_s.push('m'+"+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+",'l');\n":
			"_s.push('m'+"+(parseInt(x)==x ? x : "("+x+").toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? y : "("+y+").toFixed(0)" )+",'l');\n";
	},
	lineTo : function(x, y){
		return this.d?
			"_s.push("+(parseInt(x)==x ? "("+x+"+_dx)" : "(("+x+")+_dx).toFixed(0)" )+
			",' ',"+(parseInt(y)==y ? "("+y+"+_dy)" : "(("+y+")+_dy).toFixed(0)" )+",'l');\n":
			"_s.push("+(parseInt(x)==x ? x : "("+x+").toFixed(0)")+
			",' ',"+(parseInt(y)==y ? y : "("+y+").toFixed(0)")+");\n";
	},
	endPath : function(n) {
		this.d = 0;
		return "_t=_cshape[_cpathn++],_t.path=_s.join(' '),_t.style.display='block';\n";
	},
   
   beginRects : function(x,y) {
		this.d = (x||y) ? 1 : 0;
		return "_s=[]"+(this.d?",_dx = ("+x+"),_dy=("+y+")":"")+";\n";
	},
   
	rect : function( x,y,w,h ){
	    //lets push out some optimal drawing paths
		return "_t=("+w+").toFixed(0);\
				if(_t>0)_s.push('m',("+x+").toFixed(0),' ',("+y+").toFixed(0),\
				'r',_t,' 0r0 ',("+h+").toFixed(0),'r-'+_t,' 0x');";
	},
	
	endRects : function() {
		this.d = 0;
		return "_t=_cshape[_cpathn++],_t.path=_s.join(' '),_t.style.display='block';\n";
	}
}

// #endif
 
