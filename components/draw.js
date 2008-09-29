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

jpf.draw = jpf.component(jpf.GUI_NODE, function() {
    var _self = this;
    engine = null;
    mode = "draw";
    this.properties = {
        shape       : "rect",
        fill        : "green", /* none */
        stroke      : "red",
        strokeWidth : 1
    };

    this.$handlePropSet = function(prop, value) {

    }

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal();
    }
    /* change drawed object */
    this.changeProperties = function(p) {
        for(var id in p){
            this.properties[id] = p[id];
        }
    }

    this.mode = function(m) {
        mode = m;
    }

    this.load = function(data) {
        if(jpf.supportSVG){
            var l = data.childNodes.length;
      
            for(var i = 0; i < l; i++){
                if(data.childNodes[i].nodeType == 1){
                    engine.area.appendChild(data.childNodes[i].cloneNode(true));
                }
            }
        }
    }

    this.$loadJml = function(x) {
        this.chartType = x.getAttribute("type") || "linear2D";

        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        engine = jpf.supportSVG 
                ? jpf.draw.svgDraw
                : jpf.draw.vmlDraw;
                
        engine.init(this, this.oInt);

        /* Events */

        var timer;
        engine.area.onmousedown = function(e) {
            var e = (e || event);

            var abs = jpf.getAbsolutePosition(_self.oInt);
            var sw = 0, sh = 0, sx = 0, sy = 0, cy = e.layerY - abs[1], cx = e.layerX - abs[0], x, y;

            var element = mode == "draw" ? new engine[_self.properties.shape](cx, cy) : engine.selected;

            var ox = parseInt(element.element.getAttribute("x"));
            var oy = parseInt(element.element.getAttribute("y"));

            clearInterval(timer);
            timer = setInterval(function() {
                if(mode == "draw") {
                    element.redraw((sx || cx), (sy || cy), (sw || 1), (sh || 1));
                }
                else if(mode == "move") {
                    element.move(ox + sx, oy + sy);
                }
            }, 10);

            engine.area.onmousemove = function(e) {
                var e = (e || event);
                y = e.layerY - abs[1];
                x = e.layerX - abs[0];

                sh = cy - y;
                sw = cx - x;    
 
                sx = mode == "draw" ? (sw > 0 ? x : cx) : -1 * sw;
                sy = mode == "draw" ? (sh > 0 ? y : cy) : -1 * sh;

                sw = Math.abs(sw);
                sh = Math.abs(sh);
            }

            engine.area.onmouseup = function(e) {
                clearInterval(timer);
                engine.area.onmousemove = null;
                return false;
            }
        }


        engine.area.onclick = function(e) {
            var e = (e || event);
        }
    }
}).implement(jpf.Presentation);

jpf.draw.svgDraw = {
    object    : null,
    area      : null,
    container : null,
    selected  : null,
    ns        : "http://www.w3.org/2000/svg",
    xmlns     : "http://www.w3.org/2000/xmlns/",
    id        : 1,
    elements  : {},

    init : function(object, container) {
        jpf.draw.svgDraw.object = object;
        jpf.draw.svgDraw.container = container;

        var svg = document.createElementNS(jpf.draw.svgDraw.ns, "svg:svg");
            svg.setAttribute("id", "drel"+jpf.draw.svgDraw.id++);

            svg.setAttribute("width", container.offsetWidth);
            svg.setAttribute("height", container.offsetHeight);
            svg.setAttribute("viewBox", "0 0 " + container.offsetWidth + " " + container.offsetHeight);
            svg.setAttributeNS(jpf.draw.svgDraw.xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");

        container.appendChild(svg);

        jpf.draw.svgDraw.area = svg;
    },

    rect : function(x, y) {
        var s = jpf.draw.svgDraw;
        var p = s.object.properties;
        this.element = document.createElementNS(s.ns, "rect");

        this.element.setAttribute("id", "drel" + s.id++);
        this.element.setAttribute("x", x);
        this.element.setAttribute("y", y);
        this.element.setAttribute("width", 1);
        this.element.setAttribute("height", 1);
        this.element.setAttribute("fill", p.fill);
        this.element.setAttribute("stroke", p.stroke);
        this.element.setAttribute("stroke-width", p.strokeWidth);

        s.elements["drel" + s.id - 1] = this;
        s.area.appendChild(this.element);
        s.selected = this;

        this.redraw = function(x, y, w, h){
            this.element.setAttribute("x", x);
            this.element.setAttribute("y", y);
            this.element.setAttribute("width", w);
            this.element.setAttribute("height", h);
        }    

        this.move = function(x, y){
            this.element.setAttribute("x", x);
            this.element.setAttribute("y", y);
        }
    }
}

jpf.draw.vmlDraw = {
    object    : null,
    area      : null,
    container : null,
    selected  : null,
    id        : 1,
    elements  : {},

    init : function(object, container) {
        jpf.draw.vmlDraw.object = object;
        jpf.draw.vmlDraw.area = container;

        jpf.importCssString(document, "v\:* {behavior: url(#default#VML);}");
    },

    rect : function(x, y) {
        var element = '<v:rect style="width:100;height:100" fillcolor="red" strokecolor="blue"/>';
        jpf.draw.vmlDraw.area.innerHTML = element;
    }
}