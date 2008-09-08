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
jpf.supportCanvas = jpf.isGecko; //@todo move this to jpf
jpf.chart = jpf.component(GUI_NODE, function(){
    
    // Background axis 
        // window, axis draw stuff
    // Graph series (data + method)
    
    // navigation:
    // zoom / move
    
    // width and hieght should be from xml
    
    this.convertSeries2D_Array = function(s_array){
        return s_array;
        //return series.push(s_array);
    }
    this.convertSeries2D_XML = function(s_array){
        //return series.push(s_array);
    }
    
    // calculate n-dimensional array  min/maxes
    this.calculateSeriesSpace(series,dims){
        var di, d, vi, v, space = Array(dims);
        
        for(di = 0; di < dims; di++){
            d = space[di] = {min:100000000000, max=-1000000000000};
            for(vi = s.length; vi >= 0; vi--){
                v = s[i][di];
                
                if( v < d.min)
                    d.min=v; 
                    
                if( v > d.max)
                    d.max=v; 
            }
        }
        return space;
    }
    
    var persist = {}, engine;
    this.drawChart(){
        var out = {
            dw : this.oExt.offsetWidth(),
            dh : this.oExt.offsetHeight(),
            vx : axes.x, 
            vy : axes.vy, 
            vh : axes.vh, 
            vw : axes.vw, 
            tx : vx+vw, 
            ty : vy+vh,
            sw : dw / vw, 
            sh : dh / vh
        };
        
        engine.clear(out, persist);
        engine.grid(out, null, persist);
        engine.axes(out, persist);
        // you can now draw the graphs by doing:
        engine.graph[this.chartType](o, series, persist);
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.oInt = this.__getExternal();
        
        engine = jpf.supportCanvas 
                ? jpf.chart.canvasDraw
                : jpf.chart.vmlDraw;
        
        engine.init(this.oExt, persist);
    }
    
    this.__loadJML = function(x){
        this.chartType = x.getAttribute("type") || "linear2D";
        
        this.oInt = this.oInt
            ? jpf.JMLParser.replaceNode(oInt, this.oInt)
            : jpf.JMLParser.parseChildren(x, oInt, this);
    }
}).implement(jpf.Presentation);

jpf.chart.canvasDraw = {
    init : function(oHtml, persist){
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("width", oHtml.offsetWidth);
        this.canvas.setAttribute("height", oHtml.offsetHeight);
        this.canvas.className = "canvas";
        this.canvas.id = "chart-canvas";
        oHtml.appendChild(canvas);
        
        persist.cctx = canvas.getContext('2d');
        persist.si   = 0;
    },
    
    clear : function(style, persist){
    
    },
    
    grid : function(o, style, persist){
        var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sw, c = persist.cctx, gx, gy; 
        
        c.setLineWidth(1);
        c.setLineColor("#ebebeb");
        c.beginPath();
        
        for(var gx = round_pow(vw/(dw/25)), 
                 x = Math.round(vx / gx) * gx - vx - gx; x < vw + gx; x += gx){
           c.changeStartPoint(x*sw, 0);
           canvas.createLine(x*sw, dh);
        }
        
        for(gy = round_pow(vh / (dh / 25)), 
             y = Math.round(vy / gy) * gy - vy - gy; y < vh + gy; y += gy){
           c.changeStartPoint(0, y * sh);
           canvas.createLine(dw, y * sh);
        }
        
        c.stroke();
    },
    
    axes : function(o, style, persist){){
    
    },
    
    linear2D : function(o, series, style, persist){
        var dh = o.dh,dw = o.dw, vx = o.vx, vy = o.vy, vh = o.vh, vw = o.vw, 
            sw = o.sw, sh = o.sw, c = o.c, tx = o.tx,ty = o.ty,
            len = series.length, i, si = persist.si, s, lx, d; 
    
        if (len < 2) 
            return;

        c.beginPath();
        c.setLineColor(style.color);

        if (len < 10 || series[i + 4][0] > vx && series[len - 5][0] < tx) {
            var i, s = series[0];
            c.changeStartPoint((s[0] - vx) * sw, dh - (s[1] - vy)*sh);
            
            for(i = 1, s = series[i]; i < len; s = series[++i])       
                c.createLine((s[0] - vx) * sw, dh - (s[1] - vy) * sh);
            
            c.stroke();
        } 
        else {
            for(;si >= 0 && series[si][0] >= vx; si--);
            
            for(i = si + 1, s = series[i], lx = series[si][0], d = 0; 
              i < len && lx <= tx; s = series[++i]){
                if ((x = s[0]) >= vx){
                    if (!d) {
                        d++; 
                        area.changeStartPoint((lx - vx) * sw,
                            dh - (series[persist.si = (i - 1)][1] - vy) * sh);
                    }
                    
                    c.createLine(((lx = x) - vx) * sw, dh - (s[1] - vy) * sh);
                }
            }
        }
        
        c.stroke();
    }
}

jpf.chart.vmlDraw = {
    clear : function(opt){){},
    
    linear : function(axes,series,opt){){}
}

// #endif
 