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

jpf.chart = jpf.component(jpf.NODE_VISIBLE, function(){

     //var space    = { x:1000000, w:-2000000, y:1000000, h:-2000000};    
    var timer    = null;
    var _self    = this;
    var engine;

    this.drawLayers = function(){
        for(var i = 0;i<this.childNodes.length;i++){
            this.childNodes[i].drawAxis();
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
            
            if (x.childNodes[i][jpf.TAGNAME] == "axis") {
                o = new jpf.chart.axis(this.oExt, "axis");
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
            //interact = true;
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
            bt = 0;
            var x = e.clientX - _self.oExt.offsetLeft,
                y = e.clientY - _self.oExt.offsetTop;
            for(var i = stack.length-1;i>=0;i--)
                (t=stack[i]).mouseUp(x - t.left, y - t.top);
            stack.length = 0;
        }
      
        this.oExt.onmousemove = function(e){
            //if (!interact) return;
            if (!e) e = event;
            var dx = (-lx + (lx=e.clientX)),dy = (-ly + (ly=e.clientY));
            if(bt){
                for(var t, i = stack.length-1;i>=0;i--)
                    (t = stack[i]).mouseMove(dx,dy,bt,ox-t.left,oy-t.top,lx-t.left,ly-t.top);
            }else{
                for(var t, i = _self.childNodes.length-1;i>=0;i--)
                    (t = _self.childNodes[i]).mouseMove(dx,dy,bt,ox-t.left,
                        oy-t.top,lx-t.left,ly-t.top);
            }
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

     
jpf.chart.axis = jpf.subnode(jpf.NODE_HIDDEN, function(){
    this.$supportedProperties = [
        "left","top","width","height","type","viewport",
        "zoom","zoomx", "zoomy","movex", "movey",  
        "orbitx", "orbity", "distance",
    ];
    
    this.$draw  = 0;
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
    this.mousex = 0;
    this.mousey = 0;
    this.tilex = 0;
    this.tiley = 0;
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
    
    this.mouseMove = function(dx,dy,bt,ox,oy,lx,ly){
        // we need to 
        dx = dx / this.cwidth, dy = dy / this.cheight; 
        var zx = this.zoomx, zy = this.zoomy;
        this.mousex=lx/this.cwidth;
        this.mousey=ly/this.cheight;
        if(bt == 1){
            if(ox<this.cleft)dx = 0;
            if(oy>this.ctop+this.cheight)dy = 0;
            this.tilex-=dx*this.cwidth;
            this.tiley-=dy*this.cheight;
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

    this.$handlePropSet = function(prop, value, force) {
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

        //var dt=(new Date()).getTime();
        //for(var j = 0;j<100;j++)
            l.griddraw( l, l );
        //document.title = ((new Date()).getTime()-dt)/100;

        for(var i = 0, d = this.childNodes, len = d.length, n;i<len;){
            (n = d[i++]);n.tilex=this.tilex;n.tiley=this.tiley;
            n.$draw(n, l);
        }
    }

    this.$loadJml = function(x, obj, order){
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
        this.left      = (this.left || 0) * this.parentNode.oExt.offsetWidth;
        this.top      = (this.top || 0)  * this.parentNode.oExt.offsetHeight;
        this.width      = (this.width || 1) * (this.parentNode.oExt.offsetWidth);
        this.height  = (this.height || 1) * (this.parentNode.oExt.offsetHeight);
        // our grid is styled with margins, we need to setup our childlayers to be clipped to it
        this.type = this.type || "2D";
        this.is3d = this.type.match( "3D" );

        this.engine.initLayer(this);
        this.style        = jpf.draw.parseStyle( jpf.chart.axis.draw['_grid'+this.type], this.stylestr );

        this.cleft   = this.left+(this.style.margin?
            this.style.margin.left:0);
        this.ctop     = this.top+(this.style.margin?
            this.style.margin.top:0);
        this.cwidth  = this.width - (this.style.margin?
            (this.style.margin.right+this.style.margin.left):0);
        this.cheight = this.height - (this.style.margin?
            (this.style.margin.bottom+this.style.margin.top):0);
        // initialize drawing function
        var dt = (new Date()).getTime();
        this.griddraw  = jpf.chart.axis.draw['grid'+this.type]( this, this.engine, this.style );
        
        // init graph layers with proper drawing viewport
        // after each draw, we should have the lines x and y positions in an array ready to be drawn in text, or looked up to text.
        
        for (var o, i = 0; i < x.childNodes.length; i++){
            if (x.childNodes[i].nodeType != 1)
                continue;
            var n = x.childNodes[i][jpf.TAGNAME];
            if(n=="layer" || n=="graph"){
                o = new jpf.chart[n](this.oExt, n);
                
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
    
        // Actual visualization functions:

});

jpf.chart.axis.draw = {
    // #ifdef __ENABLE_CHART_GRID2D
    _grid2D: {
        pow : 10,
        step : 4,
        margin : {
            left : 0,
            top : 0,
            right : 0,
            bottom :0
        },
        plane :{
            inherit : 'shape',
            line : '#cfcfcf'
            },
        plane2 :{
            inherit : 'shape'
            },            
        label : {
            inherit : 'font',
            join : 'label',
            left : 0,
            top : 0,
            format : "fixed(t,1)"
        },
        xlabel : {
            inherit : 'label', 
            width: 40,
            top : 5,
            side: 0, 
            axis: 0, 
            align:'center'
        },
        ylabel : {
            inherit : 'label', 
            left : -110,
            width: 100,
            side:1, 
            axis:0,
            align:1?'right':'left'
        },
        grid : { 
            inherit : 'shape',
            join : 'grid',
            line : '#cfcfcf',
            weight : 1,
            alpha: 0.3,
            extend : 0
        },
        xgrid : {inherit : 'grid'},
        ygrid : {inherit : 'grid'},
        tiles : {
            inherit : 'shape',
            join : 'tiles'
        }, 
        bar : {
            inherit : 'shape',
            join : 'bar'
        },    
        xbar : {
            inherit : 'bar',
           // fill : '#dfe7f5',
            outx: 0,
            outy: 0
        },
        ybar : {
            inherit : 'bar'
            //line : '#cfcfcf'
        },
        axis :{
            inherit : 'shape',
            join : 'grid',
            line : null,//'black',
            weight: 2,
            extend: 2
        },
        xaxis :{inherit : 'axis'},
        yaxis :{inherit : 'axis'},
        tick : {
            inherit : 'shape',
            join : 'grid',
            steps : 5,
            left: 0,
            top : 0,
            size : 4,
            line : '#000000'
        },
        xtick : {inherit : 'tick'},
        ytick : {inherit : 'tick'},
        xtickg : {inherit : 'tick',weight:2,size:6},
        ytickg : {inherit : 'tick',weight:2,size:6}
    },
    grid2D : function(l,e){
        var s = l.style, g = jpf.visualize;
        var ml = s.margin.left*l.ds, mr = s.margin.right*l.ds,
            mt = s.margin.top*l.ds, mb = s.margin.bottom*l.ds, sh = 0,t;
        var c = g.optimize([
        g.begin2D(l,e),
        "dw -= ",ml+mr,", dh -= ",mt+mb,",dtx += ",ml,",dty += ",mt,
        ", sw = dw / vw, sh = dh / vh;",
        "var dx = __pow(",s.pow,", __round(__log(vw/",s.pow,
                        ")/__log(",s.pow,")))*",s.step,",\
             dy = __pow(",s.pow,", __round(__log(vh/",s.pow,
                        ")/__log(",s.pow,")))*",s.step,",\
             bx = __round(vx1 / dx) * dx - vx1,\
             by = __round(vy1 / dy) * dy - vy1,\
             ex = vw, ey = vh, tx, ty,t,u,h,q,r;\
        if(by>0)by -= dy;if(bx>0)bx -= dx;\n\
        var ddx = dx*sw, ddy = dy*sh, dbx = bx*sw+",ml,", dby = by*sh+",mt,",\
             dex = ex*sw+",ml,", dey = ey*sh+",mt,", mdex = dex-ddx, mdey = dey-ddy,\
             hdx = 0.5*dx, hdy = 0.5*dy,hddx = 0.5*ddx, hddy = 0.5*ddy,\n\
             axisx = -vx1*sw+",ml,", axisy = -vy1*sh+",mt,",\n\
             sx = parseInt(2*dex/ddx)+3,sy = parseInt(2*dey/ddy)+3,\n\
             hdbx = dbx, hdby = dby, hbx = bx+vx1, hby = by+vy1;\n",
        "while(hdbx<",mt,")hdbx+=hddx, hbx+=hdx;\n",
        "while(hdby<",ml,")hdby+=hddy, hby+=hdy;\n",
        s.plane.active?[ e.shape(s.plane),
            e.rect(ml,mt,"dw","dh")
        ]:"",
        s.plane2.active?[ e.shape(s.plane2),
            e.rect(ml,mt,"dw","dh")
        ]:"",
        s.tiles.active?[ 
            e.rectInv?[
                e.shape(s.tiles),
                "if(dby-",mt,">-hddy){",
                    e.rectInv(ml,mt,"dw","dby-"+mt+"+hddy"),
                "}",
                "for( y = dby+ddy; y < mdey; y += ddy){",
                    e.rectInv(ml,"y","dw","hddy"),
                "};",
                e.rectInv(ml,"y","dw","__min(hddy,dh-y+"+mt+")"),
                "if(dbx-",ml,">-hddx){",
                    e.rectInv(ml,mt,"dbx-"+ml+"+hddx","dh"),
                "}",
                "for( x = dbx+ddx; x < mdex; x += ddx){",
                    e.rectInv("x",mt,"hddx","dh"),
                "};",
                e.rectInv("x",mt,"__min(hddx,dw-x+"+ml+")","dh")
            ]:[
                e.shape(s.tiles,ml,mt,mr,mb),
                "for( y = dby; y < dey; y += ddy){",
                "for( x = dbx; x < dex; x += ddx){",
                    e.rect("x+hddx","y","hddx","hddy"),
                    e.rect("x","y+hddy","hddx","hddy"),
                "};",
            "}"]
        ]:"",
        s.xbar.active?[ e.shape(s.xbar),
            "if(dbx-",ml,">-hddx){",
                e.rect(ml,mt,"dbx-"+ml+"+hddx","dh"),
            "}",
            "for( x = dbx+ddx; x < mdex; x += ddx){",
                e.rect("x",mt,"hddx","dh"),
            "};",
            e.rect("x",mt,"__min(hddx,dw-x+"+ml+")","dh")
        ]:"",
        s.ybar.active?[ e.shape(s.ybar),
            "if(dby-",mt,">-hddy){",
                e.rect(ml,mt,"dw","dby-"+mt+"+hddy"),
            "}",
            "for( y = dby+ddy; y < mdey; y += ddy){",
                e.rect(ml,"y","dw","hddy"),
            "};",
            e.rect(ml,"y","dw","__min(hddy,dh-y)")
        ]:"",
        s.xtick.active?[ e.shape(s.xtick),
            "u = ",s.xlabel.axis?("axisy+"+(s.xtick.top*l.ds)):
                  (s.xlabel.side?s.xtick.size*-l.ds+ml:("dh+"+ml)),";",
            "t = hddx/",s.xtick.steps,";",
            "h = ",s.xtick.size*l.ds,";",
            s.xlabel.axis?[
            "if(u+h>",mt," && u<dh+",mb,"){",
                "if(u<",mt,")h=h-(",mt,"-u),u=",mt,";",
                "if(u+h>dh+",mb,")h=(dh+",mb,")-u;"]:"",
                "x = dbx;while(x<",ml,")x+=t;",
                "for(; x < dex; x += t){",
                    e.vline("x","u","h"),
                "};",        
            s.xlabel.axis?"}":"",
        ]:"",
        s.ytick.active?[ e.shape(s.ytick),
            "t = hddy/",s.ytick.steps,";",
            "u = ",s.ylabel.axis?("axisx+"+s.ytick.left*l.ds):
                  (s.ylabel.side?s.ytick.size*-l.ds+mt:"dw+"+ml),";",
            "h = ",s.ytick.size*l.ds,";",
            s.ylabel.axis?[
            "if(u+h>",ml," && u<dw+",mr,"){",
                "if(u<",ml,")h=h-(",ml,"-u),u=",ml,";",
                "if(u+h>dw+",mr,")h=(dw+",mr,")-u;"]:"",            
                "y = dby;while(y<",mt,")y+=t;",
                "for(; y < dey; y += t){",
                    e.hline("u","y","h"),
                "};",    
            s.ylabel.axis?"}":"",
        ]:"",
        s.xgrid.active?[ e.shape(s.xgrid),
            "t=dw+",s.xgrid.extend*l.ds,";",
            "u=",(s.xgrid.extend*l.ds*-s.ylabel.side)+ml,";",
            "for(y = hdby; y < dey; y += hddy){",
                e.hline("u","y","t"),
            "};"
        ]:"",
        s.ygrid.active?[ e.shape(s.ygrid),
            "t=dh+",s.ygrid.extend*l.ds,";",
            "u=",(s.ygrid.extend*l.ds*-s.xlabel.side)+mt,";",
            "for(x = hdbx; x < dex; x += hddx){",
                e.vline("x","u","t"),
            "};"
        ]:"",    
        s.xtickg.active?[ e.shape(s.xtickg),
            "u = ",s.xlabel.axis?("axisy+"+s.xtickg.top*l.ds):
                  (s.xlabel.side?s.xtickg.size*-l.ds+ml:("dh+"+ml)),";",
            "h = ",s.xtickg.size*l.ds,";",
            s.xlabel.axis?[
            "if(u+h>",mt," && u<dh+",mb,"){",
                "if(u<",mt,")h=h-(",mt,"-u),u=",mt,";",
                "if(u+h>dh+",mb,")h=(dh+",mb,")-u;"]:"",
                "for(x=hdbx; x < dex; x += hddx){",
                    e.vline("x","u","h"),
                "};",
            s.xlabel.axis?"}":"",
        ]:"",                            
        s.ytickg.active?[ e.shape(s.ytickg),
            "u = ",s.ylabel.axis?("axisx+"+s.ytickg.left*l.ds):
                  (s.ylabel.side?s.ytickg.size*-l.ds+mt:"dw+"+ml),";",
            "h = ",s.ytickg.size*l.ds,";",
            s.ylabel.axis?[
            "if(u+h>",ml," && u<dw+",mr,"){",
                "if(u<",ml,")h=h-(",ml,"-u),u=",ml,";",
                "if(u+h>dw+",mr,")h=(dw+",mr,")-u;"]:"",    
                "for(y=hdby; y < dey; y += hddy){",
                    e.hline("u","y","h"),
                "};",
            s.ylabel.axis?"}":"",
        ]:"",        
        s.xaxis.active?[ e.shape(s.xaxis),
            "if(axisy>",mt," && axisy<dh+",mt,"){",
                "t=dw+",s.xaxis.extend*l.ds,";",
                "u=",(s.xaxis.extend*l.ds*-s.ylabel.side)+ml,";",
                e.hline("u","axisy","t"),
            "}"
        ]:"",
        s.yaxis.active?[ e.shape(s.yaxis),
            "if(axisx>",ml," && axisx<dw+",ml,"){",
                "t=dh+",s.yaxis.extend*l.ds,";",
                "u=",(s.yaxis.extend*l.ds*-s.xlabel.side)+mt,";",    
                e.vline("axisx","u","t"),
            "}"
        ]:"",
        s.xlabel.active?[ e.text(s.xlabel, "sx"),
            s.xlabel.axis?
                e.text(s.xlabel, "sy", ml/l.ds,mt/l.ds,mr/l.ds,mb/l.ds):
                e.text(s.xlabel, "sy", ml/l.ds,0,mr/l.ds,0),
            "for(u=ex+vx1+hdx,t=hbx-hdx, x=-hddx+hdbx+",
                (-0.5*s.xlabel.width+s.xlabel.left)*l.ds,
                 "; t < u; x += hddx, t += hdx){\n",
                e.print("x",s.xlabel.axis?"axisy+"+(s.xlabel.top*l.ds):
                            (s.xlabel.side?(mt-s.xlabel.height*l.ds-s.xlabel.top*l.ds):
                                "dh+"+(mt+s.xlabel.top*l.ds)),
                    s.xlabel.format), 
            "}"
        ]:"",
        s.ylabel.active?[ 
            s.ylabel.axis?
                e.text(s.ylabel, "sy", ml/l.ds,mt/l.ds,mr/l.ds,mb/l.ds):
                e.text(s.ylabel, "sy", 0,mt/l.ds,0,mb/l.ds),
            "for( u=-ey-vy1-hdy,t=-hby+hdy, y = -hddy+hdby+",
                (-0.5*s.ylabel.height+s.ylabel.top)*l.ds,
                  "; t > u; y += hddy, t -= hdy){\n",
                e.print(s.ylabel.axis?"axisx+"+(s.ylabel.left*l.ds):
                        (s.ylabel.side?s.ylabel.left*l.ds+ml:
                         "dw+"+(ml-(s.ylabel.left*l.ds)-s.ylabel.width*l.ds)),
                         "y",s.xlabel.format), 
            "}"
        ]:"",
        g.end2D()
        ]);
        return new Function('l','v',c);
    },
    //#endif
    // #ifdef __ENABLE_CHART_GRID3D
  
    _grid3D: {
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
            g.end3D()]);
        return new Function('l','v',c);
    },
    //#endif
$:0};



jpf.chart.graph = jpf.subnode(jpf.NODE_HIDDEN, function(){

    this.$supportedProperties = ["type","series","formula"];
    
    this.data = 0;
    this.style = {};
    this.tilex = 0;
    this.tiley = 0;
    this.$handlePropSet = function(prop, value, force) {
        this[prop] = value;
    }
    
    this.$loadJml = function(x,obj){
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
            p = (this.series.getAt(" ") != -1) ? this.series.split(" ") : 
                this.series.split(",");
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
//    alert(this.type);
        // create render layer
        this.engine.initLayer(this);
        this.style      = jpf.draw.parseStyle(jpf.chart.graph.draw['_'+this.type], this.stylestr );
        this.datasource = jpf.chart.graph.datasources[this.source]( this );
        this.$draw      = jpf.chart.graph.draw[this.type](this, this.engine, this.datasource);
    }
});

jpf.chart.graph.draw = {
   
    // #ifdef __ENABLE_CHART_LINE2D
   _line2D: {
        steps : 100,
        graph : {
            inherit : 'shape',
            line : '#000000',
            weight: 1
        }
    },
    line2D : function( l, e, d ){

        var g = jpf.visualize, s = l.style, wrap = s.graph.weight*8;
        if(!s.graph.active) return new Function('');
        var c = g.optimize([
            g.begin2D(l,e),
           // e.beginTranslate("-vx1*sw","-vy1*sh"),
            e.shape(s.graph),
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,
            ",x = x1,xw=x2-x1,idx=xw/xs;",d.begin||"",
            "var xfirst = x,dx=-vx1*sw,dy=-vy1*sh;",
            e.moveTo(d.x+"*sw+dx",jpf.draw.macros.max(d.y+"*-sh+dy",s.graph.fill.sort?-wrap:null)),
            "for(x+=idx;x<x2",d.for_||"",";x+=idx",d.inc_||"",")",d.if_||"","{",
                e.lineTo(d.x+"*sw+dx",jpf.draw.macros.max(d.y+"*-sh+dy",s.graph.fill.sort?-wrap:null)),
            "}", 
            s.graph.fill===undefined? "" :[
                "x-=idx;",e.lineTo(d.x+"*sw+dx+"+wrap, 
                    (s.graph.fillout==1?d.y2+"*-sh+dy+":"vy1*sh+dh+dy+")+wrap),
                "x=xfirst;",e.lineTo(d.x+"*sw+dx-"+wrap, 
                    (s.graph.fillout==1?d.y2+"*-sh+":"vy1*sh+dh+dy+")+wrap)]
             ,
           // e.endTranslate(),
            g.end2D()]);
        try{        
            return new Function('l','v',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    },
    // #endif
  
    // #ifdef __ENABLE_CHART_LINE3D
    _line3D: {
        steps : 50,
        zpos : 0,
        depth : 0.2,
        persp : 1,
        graph : {
            line: '#000000',
            weight : 1,
            fill : 'red'
        }
    },
    line3D : function( l, e, d ){
        var g = jpf.visualize, s = l.style, wrap = s.graph.weight*4; 
        e.allocShape(l, s.graph);
        e.allocDone(l);
        var c = g.optimize([
            g.begin3D(e,l),
            e.beginShape(0,"dw2","dh2"),
            "var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
            ",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
            "var ixfirst = ix, k = 0, xa, ya, xb, yb, xc, yc, xd, yd;",
            (s.fake==1) ?[
                g.cacheArray('gx',"ixs"),
                g.cacheArray('gy',"ixs"),
                g.moveTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
                "for(k=1,ix+=idx;ix<ix2",d.for_||"",";ix+=idx,k++",d.inc_||"",")",
                d.if_||"","{",
                    g.lineTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
                "}", 
                "for(k--;k>=0;k--){",
                    g.lineTo3D("gx[k]",s.zpos+s.depth,"gy[k]"),
                "}"
            ].join('') : [
                g.moveTo3D("xb="+d.x,s.zpos,"yb="+d.y),
                "for(ix+=idx,i=0;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",
                d.if_||"","{",
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
    //#endif
    // #ifdef __ENABLE_CHART_BAR2D
    bar2D : function(l,e,d){
        var s = l.style;
        var func = this.mathParse(l.formula);
        var c = [
            e.begin2D(l,e),
            e.beginLayer(l),
            
            e.shape(s.bar),
            "var ix1=",d.ix1,",ix2=",d.ix2,"ixs=",d.ixs,
            ",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
            "for(;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
                e.rect( d.x+"*sw", d.y+"*-sh", d.style.bar.sizex+"*idx", 0),
            "}",
            
            e.endLayer()].join('');
        try{        
            return new Function('l',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    },
    // #endif
    
    // #ifdef __ENABLE_CHART_BAR3D
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
    //#endif
    
    // #ifdef __ENABLE_CHART_BAR3D    
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
    },
    //#endif
    shapes2D : function( l, e ){
        var g = this, s = l.style;
        if(!s.graph.active) return new Function('');
        
        var c = g.optimize([
            g.begin2D(e,l),
            e.shape(s.shape),
            e.moveTo(d.x+"*sw",d.y+"*-sh"),
            "for(ix+=idx;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
                e.lineTo(d.x+"*sw",d.y+"*-sh"),
            "}", 
            e.translate(),
            this.end()]);
        try{        
            return new Function('l','v',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    },
 
$:0};

jpf.chart.graph.datasources = {
    mathX : function(l) {
        return {
            type : 'mathX',
            vx1 : 0, vx2 : 1, vy1 : 0, vy2 : 1,
            x1 : "vx1", 
            x2 : "vx2+(vx2-vx1)/l.style.steps", 
            xs : "l.style.steps",
            x : "x",
            y : "("+jpf.visualize.mathParse(l.formula)+")"
        };
    },
    mathXY : function(l){
        var part = l.formula.split(";");
        return {
            type : 'mathXY',
            vx1 : -1, vx2 : 1, vy1 : -1, vy2 : 1,
            x1 : 0, 
            x2 : "Math.PI*2+(Math.PI*2/(l.style.steps-1))", 
            xs : "l.style.steps",
            x : "("+jpf.visualize.mathParse(part[0])+")",
            y : "("+jpf.visualize.mathParse(part[1]===undefined?
                part[0]:part[1])+")"
        };
    },
    mathPR : function(l){
        var part = l.formula.split(";");
        return {
            type : 'mathPR',
            vx1 : -1, vx2 : 1, vy1 : -1, vy2 : 1,
            x1 : 0, 
            x2 : "Math.PI*2+(Math.PI*2/(l.style.steps-1))", 
            xs : "l.style.steps",
            x : "__sin(_p="+jpf.visualize.mathParse(part[0])+
                ")*(_r="+jpf.visualize.mathParse(part[1])+")",
            y : "__cos(_p)*_r"
        };
    },    
    
    seriesX : function(l) {
        var    len = l.yvalue.length;
        return {
            type : 'seriesX',
            vx1 : 0, vx2 : len, vy1 : -1, vy2 : 1,
            head : "var _yv = l.yvalue;",
            x1 : "__max(__floor(vx1),0)", 
            x2 : "__min(__ceil(vx2)+1,_yv.length)", 
            xs : "x2-x1",
            x : "x",
            y : "_yv[x]"
        };
    },
    seriesX2 : function(l) {
        var    len = l.yvalue.length;
        return {
            type : 'seriesX2',
            head : 'var _xv = l.xvalue, _yv = l.yvalue, _len = _yv.length;',
            vx1 : 0, vx2 : len, vy1 : -1, vy2 : 1,
            x1 : 0, 
            x2 : "_len", 
            xs : "_len", 
            begin : "var _lx = vx1, _sf=0;\
                     for(x=l.xfirst||0;x > 0 && _xv[x]>=vx1 ;x--);",
            for_ : " && _lx<=vx2",
            if_  : "if( (!_sf && (x==_len-1 || _xv[x+1]>=vx1) && ++_sf && (xfirst=l.xfirst=x || 1)) || _sf)",
            x      : "(_lx=_xv[x])",
            y      : "_yv[x]"
        };
    },
    seriesXY : function(l) {
        var    len = l.yvalue.length;
        return {
            type : 'seriesXY',
            vx1 : 0, vx2 : len, vy1 : -1, vy2 : 1,
            head : "var _vx = l.xvalue, _vy = l.yvalue, _len = _vy.length;",
            x1 : 0, 
            x2 : "_len", 
            xs : "_len",
            x : "_vx[x]",
            y : "_vy[x]"
        };
    },
$:0};

jpf.chart.layer = jpf.subnode(jpf.NODE_HIDDEN, function(){

    this.$supportedProperties = ["type","formula"];
    
    this.data = 0;
    this.style = {};

    this.$handlePropSet = function(prop, value, force) {
        this[prop] = value;
    }
    
    this.$loadJml = function(x,obj){
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
        this.type += this.parentNode.type;
        this.engine.initLayer(this);
        this.style      = jpf.draw.parseStyle(jpf.chart.layer.draw['_'+this.type], this.stylestr );
        this.$draw      = jpf.chart.layer.draw[this.type](this, this.engine, this.datasource);
    }
});

jpf.chart.layer.draw = {
   
    // #ifdef __ENABLE_CHART_LINE2D
   _particle2D: {
        emit : 100,
        init : 0,
        rate : 10,
        kill : 10,
        part : {
            fill : 'white',
            inherit : 'shape'
        }
    },
    particle2D : function( l, e ){
        var g = jpf.visualize, s = l.style;
        var emit = jpf.visualize.mathParse(l.emit,3);
        var proc = jpf.visualize.mathParse(l.proc,3);
        var size = jpf.visualize.mathParse(l.size,2);
        var w = l.window?jpf.visualize.mathParse(l.window,4):[0,0,1,1];
        var c = g.optimize([
            g.begin2D(l,e),
            e.shape(s.part),
            "var part = l.part,lx=dw/",w[0],",ly=dh/",w[1],",lw=dw/",w[2],",lh=dh/",w[3],";",
            "if(!part){\n",
                "part = l.part = new Array(",s.emit,"),l.emit=0;\n",
                "for(i=part.length-1;i>=0;i--)part[i]={a:0,g:0};\n",
            "}",
            "var t, xs, ys, dr,em = __floor(l.emit+=dt*",s.rate,");l.emit -= em;\n",
            "for(i=part.length-1;i>=0;i--){\n",
                "if(!(dr=(t=part[i]).a) && em){\n",
                    "t.x=",emit[0],",t.y=",emit[1],",t.v=",emit[2],",t.a=1,t.g=0;\n",
                    "em--,dr=1;\n",
                "}\n",
                "if(dr)with(t){\n",
                    "if( (t.g+=dt)>",s.kill,"){t.a=0;continue;}\n", // check age
                    "t.v=",proc[2],",xs=("+size[0]+")*",l.ds,", ys=("+size[1]+")*",l.ds,";",
                    e.rect("((t.x="+proc[0]+"))*lw-xs",
                           "((t.y="+proc[1]+"))*lh-ys",
                           "(2*xs)","(2*ys)"),
                "}\n",
            "}\n",
            g.end2D()]);
            alert(c);
        try{        
            return new Function('l','v',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    },
$:0};


// #endif
 

