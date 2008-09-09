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
	var space = { x:1000000, w:-2000000, y:1000000, h:-2000000 };		
	var series = [];

	this.__supportedProperties = ['a','b','c','d'];
	this.__handlePropSet = function(prop, value){
		if ("a|b|c|d".indexOf(prop) > -1)
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
       s.x = x1, s.w = x2-x1, s.y = y1, s.h = y2-y1;
    }
    
    var persist = {}, engine;
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
            sw : (this.oExt.offsetWidth - 45) / space.w, 
            sh : (this.oExt.offsetHeight - 30) / space.h
        };
        
        engine.clear(out, persist);
        engine.grid(out, defaultStyle, persist);
        engine.axes(out, defaultStyle, persist);   
		// you can now draw the graphs by doing:
		var i = series.length-1;
		for(i; i >=0; i--){
			engine[series[i].type](out, series[i].data, (series[i].style || defaultStyle), persist,this);		
		}			  
    }
		
	this.addSeries = function(type, style, data){		
		calcSpace2D(data, space);	
		series.push({type:type, style:style, data:data});
		//this.drawChart();				
	}
    
	this.addEquation = function(equation, style, window){		
		//this.drawChart();
		var fobj = engine.compileEquation(equation);
		if(fobj){
			calcSpace2D(window, space);	
			// compile math function to a draw function
			f = series.push({type:'equation', style:style, data:fobj});
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
    }
}).implement(jpf.Presentation);

jpf.chart.canvasDraw = {
    init : function(oHtml, persist){
        var canvas = document.createElement("canvas");
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
    	var ty = o.ty, vx = o.vx, dh = o.dh, dw = o.dw, sh = o.sh,sw = o.sw, c = persist.ctx;		
		
		c.beginPath();
		c.strokeStyle = style.color;
		c.lineWidth = style.line;
		
		c.moveTo(0, ty*sh);
        c.lineTo(dw, ty*sh);
		
		c.moveTo(Math.abs(vx*sw), 0);
        c.lineTo(Math.abs(vx*sw), dh);
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

	compileEquation : function(eq){
		var fstr = eq.toLowerCase().replace(/([a-z][a-z]+)/g,"Math.$1").replace(/([0-9])([a-z)])/g,"$1*$2");
		var c;
		try{
			c="\
			var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, \
				sw = o.sw, sh = o.sh, ctx = persist.ctx, tx = o.tx,ty = o.ty, \
				density = style.density || 3,\
				a=pthis.a, b=pthis.b, c=pthis.c,d=pthis.d,\
				t=(new Date()).getTime() / 1000, e=Math.E, p=Math.PI,\
				lx = vw/(dw/density), x = vx;\
			ctx.save();\
			ctx.beginPath();\
			ctx.lineWidth = 1;\
	        ctx.strokeStyle = (style.color || defaultStyle.color);\
			ctx.translate(-vx*sw,vy*sh);\
			ctx.moveTo(x * sw, dh - ( "+fstr+" )*sh); x +=lx;\
			for(;x<=tx; x+=lx)\
				ctx.lineTo(x * sw, dh - ( "+fstr+")*sh);\
	        ctx.stroke();\
			ctx.restore();";
			var fobj = new Function('o','style', 'persist','pthis',c);
		}catch(x){
			alert("Error in: "+c);
			return 0;
		}
		return fobj;
	},
	
	equation : function(o, eq, style, persist,pthis){
		eq(o,style,persist,pthis);
    },
	
	callback : function(o,callback,style,persist){
		var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sh, c = persist.ctx, tx = o.tx,ty = o.ty, x,lx; 
		c.save();
        c.beginPath();
		c.lineWidth = 1;
		ctx.translate(-vx*sw,vy*sh);
        c.strokeStyle = (style.color || defaultStyle.color);
		var density = style.density || 1;
		lx = vw/(dw/density);
		x = vx; 
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
 