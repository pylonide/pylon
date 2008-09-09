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
        color : "#000000"
    }
	var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000 };	
	var range    = {x1: null, x2:null, y1 :null, y2: null};	
	var series   = [];
	var timer    = null;
	var _self    = this;
	var persist  = {}, engine, formulaId;

	this.__supportedProperties = ['formula', 'a','b','c','d'];
	this.__handlePropSet = function(prop, value){
	    if (prop == "formula") {
	        this.addFormula('FXY2D',value, {color:"red"}, [[-1,-1],[1,1]]);
	    }
	    else if ("a|b|c|d".indexOf(prop) > -1)
			this.drawChart();
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
	   //alert(x1+" "+x2+" "+y1+" "+y2);
       s.x = (range.x1 !== null ? range.x1 : x1), 
	   s.w = (range.x2 !== null ? range.x2 : x2) - (range.x1 !== null ? range.x1 : x1), 
	   s.y = (range.y1 !== null ? range.y1 : y1), 
	   s.h = (range.y2 !== null ? range.y2 : y2) - (range.y1 !== null ? range.y1 : y1);	   
    }
    	    
    this.drawChart = function(){
        var out = {
            dw : this.oExt.offsetWidth - 45,
            dh : this.oExt.offsetHeight - 30,
            vx : space.x,
            vy : space.y,
            vh : space.h,
            vw : space.w,
            tx : space.x + space.w,
            ty : space.y + space.h,
			rvx : -1.2,
			rvy : 0,
			rvz : 0.3,
			tvx : 0,
			tvy : 0,
			tvz : -3,
			stepx : 30,
			stepy : 30,
			perspx : 400,
			perspy : 400,
			scalez : 0.1,
            sw : (this.oExt.offsetWidth - 45) / space.w,
            sh : (this.oExt.offsetHeight - 30) / space.h
        };
        
        engine.clear(out, persist);
        engine.grid(out, defaultStyle, persist);
        engine.axes(out, defaultStyle, persist);   
		// you can now draw the graphs by doing:		
		for(var i = series.length-1; i >=0; i--){
			engine[series[i].type](out, series[i].data, (series[i].style || defaultStyle), persist,this);		
		}			  
    }
	this.setRange = function(ranges){
		if(ranges.x1){
			range.x1 = ranges.x1;
		}
		if(ranges.x2){
			range.x2 = ranges.x2;
		}
		if(ranges.y1){
			range.y1 = ranges.y1;
		}
		if(ranges.y2){
			range.y2 = ranges.y2;
		}
	}
	
	this.zoom = function(x, y, w, h){
		
		space.x = x;
		space.y = y;
		space.w = w;
		space.h = h;
		
		this.drawChart();
	}
		
	this.addSeries = function(type, style, data){		
		calcSpace2D(data, space);	
		series.push({type:type, style:style, data:data});
		
		/* Chart is drown only one time */
  		clearTimeout(timer);  
  		timer = setTimeout(function(){
      		_self.drawChart();
  		}, 100);   	
	}
    
	this.addFormula = function(type,formula, style, window){
		//this.drawChart();
		var fobj = engine['compileFormula'+type](formula);
		if(fobj){
			calcSpace2D(window, space);	
			// compile math function to a draw function
			if (formulaId)
	            series.removeIndex(formulaId - 1);
			
			formulaId = series.push({type:'formula', style:style, data:fobj});
		}
	}	
	
	this.addFormulaFXY = function(formula, style, window){
		//this.drawChart();
		var fobj = engine.compileFormula(formula);
		if(fobj){
			calcSpace2D(window, space);	
			// compile math function to a draw function
			
			if (formulaId)
	            series.removeIndex(formulaId - 1);
			
			formulaId = series.push({type:'formulaFXY', style:style, data:fobj});
		}
	}		
	
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();				
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
        
        engine.init(this.oInt, persist);
		
		/* Events */
	
		onScroll = function(delta, event){			
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
	            onScroll(delta, event);
	        }
	        if(event.preventDefault) {
	            event.preventDefault();
	        }
	        event.returnValue = false;
	    }
		
		if (engine.canvas.addEventListener){
			engine.canvas.addEventListener('DOMMouseScroll', wheelEvent, false);
		}
    	engine.canvas.onmousewheel = wheelEvent;
    }
}).implement(jpf.Presentation);

jpf.chart.canvasDraw = {
    canvas : null,
	init : function(oHtml, persist){
        var canvas = jpf.chart.canvasDraw.canvas = document.createElement("canvas");
        canvas.setAttribute("width", oHtml.offsetWidth - 45); /* -padding */
        canvas.setAttribute("height", oHtml.offsetHeight - 30); /* -padding */
        canvas.className = "canvas";		
		
        oHtml.appendChild(canvas);
        
        persist.ctx = canvas.getContext('2d');
        persist.si   = 0;
    },
    
    clear : function(o, persist){    	
        persist.ctx.clearRect(0, 0, o.dw, o.dh);
    },	
	
	round_pow : function(x){
		return Math.pow(10, Math.round(Math.log(x) / Math.log(10)));
	},
	
    grid : function(o, style, persist){		
		var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sh, c = persist.ctx, gx, gy, x,y, 
			round_pow = jpf.chart.canvasDraw.round_pow; 
        
        c.lineWidth = 1;
        c.strokeStyle = "#ebebeb";
        c.beginPath();
        
        for(gx = round_pow(vw / (dw / 25)), x = Math.round(vx / gx) * gx - vx - gx; x < vw + gx; x += gx){           
		   c.moveTo(x*sw, 0);
           c.lineTo(x*sw, dh);
        }
        
        for(gy = round_pow(vh / (dh / 25)), y = Math.round(vy / gy) * gy - vy - gy; y < vh + gy; y += gy){
           c.moveTo(0, y * sh);
           c.lineTo(dw, y * sh);
        }
        
        c.stroke();
    },
    
    axes : function(o, style, persist){
    	var vw = o.vw, vx = o.vx, vh = o.vh, ty = o.ty, dh = o.dh, dw = o.dw, c = persist.ctx;		
		
		c.beginPath();
		c.strokeStyle = style.color;
		c.lineWidth = style.line;		
		/* X axis */
		c.moveTo(0, Math.floor((ty/vh)*dh));
        c.lineTo(dw, Math.floor((ty/vh)*dh));
		
		/* Y axis */
		c.moveTo(Math.floor(-1*(vx/vw)*dw), 0);
        c.lineTo(Math.floor(-1*(vx/vw)*dw), dh);
		c.stroke();
    },
    
    linear : function(o, series, style, persist){
        //do stuff
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
		
		c.translate(-vx*sw,vy*sh);

        if (len < 10 || series[i + 4][0] > vx && series[len - 5][0] < tx) {
            var i, s = series[0];
            c.moveTo(s[0] * sw, dh - s[1] * sh);
            for(i = 1, s = series[1]; i < len; s = series[++i])       
                c.lineTo(s[0] * sw, dh - s[1] * sh);
            
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
                    
                    c.lineTo((lx = x) * sw, dh - s[1] * sh);
                }
            }
        }
        
        c.stroke();
		c.restore();
	},

	compileFormulaFX2D : function(eq){
		var fstr = eq.toLowerCase().replace(/([a-z][a-z]+)/g,"Math.$1").replace(/([0-9])([a-z)])/g,"$1*$2");
		var c;
		try{
			c="\
			var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, \
				sw = o.sw, sh = o.sh, ctx = persist.ctx, tx = o.tx,ty = o.ty, \
				density = style.density || 3,\
				a=pthis.a||0, b=pthis.b||0, c=pthis.c||0,d=pthis.d||0,\
				t=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
				lx = vw/(dw/density), x = vx;\
			ctx.save();\
			ctx.beginPath();\
			ctx.lineWidth = 1;\
	        ctx.strokeStyle = (style.color || defaultStyle.color);\
			ctx.translate(-vx*sw,vy*sh);\
			try{\
				ctx.moveTo(x * sw, dh - ( "+fstr+" )*sh); x +=lx;\
				for(;x<=tx; x+=lx)\
					ctx.lineTo(x * sw, dh - ( "+fstr+")*sh);\
		        ctx.stroke();\
			} catch(x){}\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			//alert("Error in: "+c);
			return this.compileFormulaFX2D("1");
		}
		return fobj;
	},
	compileFormulaFXY3D : function(eq){
		var fstr = eq.toLowerCase().replace(/([0-9])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1");
		var c;
		try{
			c="\
			var dh2 = o.dh/2,dw2 = o.dw/2, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, \
				ctx = persist.ctx, tx = o.tx,ty = o.ty, \
				a=pthis.a, b=pthis.b, c=pthis.c,d=pthis.d,\
				n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
				ax=o.perspx, ay=o.perspy, sx=o.stepx, sy=o.stepy,\
				dx = vw/sx, dy = vh/sy, \
				ma = Math.cos(o.rvx),mb = Math.sin(o.rvx),\
				mc = Math.cos(o.rvy),md = Math.sin(o.rvy),\
				me = Math.cos(o.rvz),mf = Math.sin(o.rvz),\
				m00=mc*me,m01=-mf*mc,m02=md,m03=o.tvx,\
				m40=(me*mb*md+mf*ma),m41=(-mb*md*mf+ma*me),m42=-mb*mc,m43=o.tvy,\
				m80=(-ma*md*me+mb*mf),m81=(ma*md*mf+me*mb),m82=ma*mc,m83=o.tvz,\
				gx=Array(sx),gy=Array(sy),sz = o.scalez,\
				d, lx, ly, nx, ny, vx,vy, x, y, z, zt; \
			ctx.save();\
			ctx.beginPath();\
			ctx.lineWidth = 1;\
	        ctx.strokeStyle = (style.color || defaultStyle.color);\
			ctx.translate(dw2,dh2);\
			try{\
				for(y = vy,j=0; y<=ty; y += dy, j++){\
					for(x = vx,i=0; x<=tx; x += dx, i++){\
						z = ("+fstr+")*sz;\
						zt = m80*x+m81*y+m82*z+m83;\
						nx=(m00*x+m01*y+m02*z+m03)*ax/zt;\
						ny=(m40*x+m41*y+m42*z+m43)*ay/zt;\
						if(j){\
							if(i){\
								ctx.moveTo(gx[i],gy[i]);\
								ctx.lineTo(nx,ny);\
								ctx.lineTo(lx,ly);\
							}else{\
								ctx.moveTo(gx[0],gy[0]);\
								ctx.lineTo(nx,ny);\
							}\
						}else{\
							if(!i)ctx.moveTo(nx,ny);\
							else ctx.lineTo(nx,ny);\
						}\
						gx[i]=lx=nx, gy[i]=ly = ny;\
					}\
				}\
				ctx.stroke();\
			}catch(x){}\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			return this.compileFormulaFXY3D("0");
			//return this.compileFormulaFXY("1");
			//return 0;
		}
		return fobj;
	},
	compileFormulaFT2D : function(eq){
		var fstr = eq.toLowerCase().replace(/([0-9])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1").split(";");
		var fx = fstr[0], fy = (fstr.length>1)?fstr[1]:fx;
		var c;
		try{
			c="\
			var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw,\
				ts = o.ts, te = o.te, t = ts,lt = (te-ts)/(style.steps||100),\
				sw = o.sw, sh = o.sh, ctx = persist.ctx, tx = o.tx,ty = o.ty, \
				density = style.density || 3,\
				a=pthis.a||0, b=pthis.b||0, c=pthis.c||0,d=pthis.d||0,\
				n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
			ctx.save();\
			ctx.beginPath();\
			ctx.lineWidth = 1;\
	        ctx.strokeStyle = (style.color || defaultStyle.color);\
			ctx.translate(-vx*sw,vy*sh);\
			try{\
				ctx.moveTo(( "+fx+" ) * sw, dh - ( "+fy+" )*sh); x +=lx;\
				for(;t<=te; t+=lt)\
					ctx.lineTo(( "+fx+" ) * sw, dh - ( "+fy+")*sh);\
		        ctx.stroke();\
			} catch(x){}\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			//alert("Error in: "+c);
			return this.compileFormulaFT2D("1");
		}
		return fobj;
	},	
	compileFormulaFT3D : function(eq){
		var fstr = eq.toLowerCase().replace(/([0-9])([a-z)])/g,"$1*$2").replace(/([a-z][a-z]+)/g,"Math.$1").split(";");
		var fx = fstr[0], fy = (fstr.length>1)?fstr[1]:fx, fz = (fstr.length>2)?fstr[1]:fx;
		var c;
		try{
			c="\
			var dh2 = o.dh/2,dw2 = o.dw/2, \
				ts = o.ts, te = o.te, t = ts,lt = (te-ts)/(style.steps||100),\
				ctx = persist.ctx, \
				a=pthis.a, b=pthis.b, c=pthis.c,d=pthis.d,\
				n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
				ax=o.perspx, ay=o.perspy,\
				ma = Math.cos(o.rvx),mb = Math.sin(o.rvx),\
				mc = Math.cos(o.rvy),md = Math.sin(o.rvy),\
				me = Math.cos(o.rvz),mf = Math.sin(o.rvz),\
				m00=mc*me,m01=-mf*mc,m02=md,m03=o.tvx,\
				m40=(me*mb*md+mf*ma),m41=(-mb*md*mf+ma*me),m42=-mb*mc,m43=o.tvy,\
				m80=(-ma*md*me+mb*mf),m81=(ma*md*mf+me*mb),m82=ma*mc,m83=o.tvz,\
				d, x, y, z, zt; \
			ctx.save();\
			ctx.beginPath();\
			ctx.lineWidth = 1;\
	        ctx.strokeStyle = (style.color || defaultStyle.color);\
			ctx.translate(dw2,dh2);\
			try{\
				x = ("+fx+"), y = ("+fy+"), z = ("+fz+");\
				zt = m80*x+m81*y+m82*z+m83; t+=lt;\
				ctx.moveTo( (m00*x+m01*y+m02*z+m03)*ax/zt, \
							(m40*x+m41*y+m42*z+m43)*ay/zt;)\
				for(;t<=te; t+=lt){\
					x = ("+fx+"), y = ("+fy+"), z = ("+fz+");\
					ctx.lineTo( (m00*x+m01*y+m02*z+m03)*ax/zt, \
							(m40*x+m41*y+m42*z+m43)*ay/zt;)\
				}\
			   ctx.stroke();\
			} catch(x){}\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			return this.compileFormulaFXY("0");
			//return this.compileFormulaFXY("1");
			//return 0;
		}
		return fobj;
	},
	compileFormulaFXY2D : function(eq){
		var fstr = eq.toLowerCase().replace(/([a-z][a-z]+)/g,"Math.$1").replace(/([0-9])([a-z)])/g,"$1*$2");
		var c;
		try{
			c="\
			var vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, \
				ctx = persist.ctx, tx = o.tx,ty = o.ty, \
				a=pthis.a, b=pthis.b, c=pthis.c,d=pthis.d,\
				n=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
				sx=o.stepx, sy=o.stepy,\
				dx = vw/sx, dy = vh/sy, rdx = o.dw/sx, rdy = o.dh/sy,\
				hrdx = rdx/2, hrdy = rdy/2, x, y, rx, ry, z;\
			var pal=Array(255);\
			for(var i = 0;i<256;i++)pal[i]='rgb('+i+','+i+','+i+')';\
			ctx.save();\
			ctx.fillStyle = (style.color || defaultStyle.color);\
			try{\
				if(style.block=='1'){\
					for(y = vy, ry = hrdy; y<=ty; y += dy, ry += rdy){\
						for(x = vx, rx = hrdx; x<=tx; x += dx, rx += rdx){\
							z = ("+fstr+");z=z<0?0:(z>1?1:z);\
							ctx.fillRect(rx-hrdx*z,ry-hrdy*z,rdx*z,rdy*z);\
						}\
					}\
				}else{\
					for(y = vy, ry = 0; y<=ty; y += dy, ry += rdy){\
						for(x = vx, rx = 0; x<=tx; x += dx, rx += rdx){\
							z=parseInt(("+fstr+")*255);\
							ctx.fillStyle = pal[(z<0)?0:(z>255?255:z)];\
							ctx.fillRect(rx,ry,rdx,rdy);\
						}\
					}\
				}\
			}catch(x){}\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			//alert("Error in: "+c);
			return this.compileFormulaFXY2D("1");
		}
		return fobj;
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

jpf.chart.vmlDraw = {
    clear : function(opt){},
    
    linear : function(axes,series,opt){}
}

// #endif
 
