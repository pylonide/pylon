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
//#ifdef __WITH_DRAW
//#ifdef __ENABLE_DRAW_CANVAS
apf.draw.canvas = {
   
   //----------------------------------------------------------------------
    
    // initialization
    
    //----------------------------------------------------------------------
     
    initRoot : function(r){
                  
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width",r.canvaswidth = r.width);
        canvas.setAttribute("height",r.canvasheight = r.height);
        canvas.className = "canvas";        
        r.$int.appendChild(canvas);
        r.canvaselem = canvas;
		r.canvas = canvas.getContext('2d');
        r.canvas.translate(0.5,0.5);
        r.imgcache = {};
        return this;
    },
     
    resizeRoot : function(r){
	   r.canvaselem.setAttribute("width",r.width);
	   r.canvaselem.setAttribute("height",r.height);
	   for(var n = r.canvaselem.nextSibling;n != null;n = n.nextSibling){
           n.style.width = r.width+'px', n.style.height = r.height+'px';
       }
	},
	
    initLayer : function(l, r){ 
        l.imgcache 	= r.imgcache;
        l.canvas 	= r.canvas;
        l.textroot  = r.$int;
        l.dx = l.left;
        l.dy = l.top;
        l.dw = l.width;
        l.dh = l.height;
        l.ds = 1;
       
        l._styles = [];
        l._htmljoin = [];
        return this;
    },
    
    resizeLayer : function(l, r){
        // update layer position, and perhaps z-order or all items in a _vmlgroup.
        l.dx = l.left; 
		l.dy = l.top;
        l.dw = l.width;
        l.dh = l.height;
    },

    destroyLayer : function(l){
        // lets clear our shite up
    },

    beginLayer : function(l){
        this.l = l,this.mx="",this.my="",this.last=null; this.tiletrans = 0;
        this.dodraw = 0;
        // check if we have styles.. ifso clean that shit up
        if(l._styles.length){
            for(var j = l._styles.length,i=0;i<j;i++){
                var s = l._styles[i];
                if(s._txtnode)s._txtnode.removeNode();
            }
            l._styles = [];
            l._htmljoin = [];
        }
        var s =  [ "if(!l._styles)_initStyles();",
                 "var _c=l.canvas,_styles=l._styles,",
                "_s1,_s2,_s3,_s4,_s5,_s6,_s7,_s8,_s9,",
                "_x1,_x2,_x3,_x4,_x5,_x6,_x7,_x8,_x9,_x10,",
                "_y1,_y2,_y3,_y4,_y5,_y6,_y7,_y8,_y9,_y10,",
                "_s,_sh,_sp,_sl,_sv,_su,_st,_dx,_dy,_td,_l,_lc,",
                "_tc,_cv,_t,_u,_r,_q,_o,_m,_sr,_cr;"];
        if ( l.dx != 0 )s.push(
            "_c.save();_c.beginPath();_c.translate(l.dx,l.dy);",
            "_c.moveTo(0,0);_c.lineTo(l.dw,0);_c.lineTo(l.dw,l.dh);",
            "_c.lineTo(0,l.dh);_c.closePath();_c.clip();\n");
        return s.join('');
    },    
    clear : function(){
        var l = this.l;
        var s = ["_c.clearRect(l.dx,l.dy,l.dw,l.dh);\n"];
/*        if ( l.dx != 0 )s.push(
            "_c.save();_c.beginPath();_c.translate(",l.dx,",",l.dy,");",
            "_c.moveTo(0,0);_c.lineTo(",l.dw,",0);_c.lineTo(",l.dw,",",l.dh,");",
            "_c.lineTo(0,",l.dh,");_c.closePath();_c.clip();\n");*/
        return s.join('');
    },

    endLayer : function(){
        var l = this.l;
        var s = [this.$endDraw()];
        var p = [];
        var i = 0, j = 0,style,len = l._styles.length;
        for(;i<len;i++){
            style = l._styles[i];
            if(style._prev===undefined && style.isfont){ // original style
                p.push("_styles[",i,"]={",
                    "_domnode:_n=l.textroot.childNodes[b+",j,"]",
                    ",_txtused:0,_txtcount:0,_txtnodes:[],_txtdiv:\"",style._txtdiv,"\"");
                s.push(this.$finalizeFont(style));
                p.push("};");  j++;
            }else {
                p.push("_styles[",i,"]={");
                if(style.$stylelist){
                    p.push(apf.draw.serializeStyleState(style));
                }
                p.push("};");
            }    
        }
        s.push( [
            "l._anim = _anim;",
            "function _initStyles(){",
                "var _n, _styles = l._styles = [], b=l.textroot.childNodes.length;",
                "l.textroot.insertAdjacentHTML('beforeend', \"",l._htmljoin.join(''),"\");",
                p.join(''),
            "}"
        ].join(''));
        if( l.dx != 0)s.push("_c.restore();");
        l._styles = null;
        this.l = null;
        return s.join('');
        /*
        var s = [this.$endDraw()], 
            html = l.textroot, j = html.childNodes.length,
            i = 0, len = l._styles.length;

        html.insertAdjacentHTML( 'beforeend', l._htmljoin.join('') );

        for(;i<len;i++){
            var style = l._styles[i];
            if(style._prev===undefined && style.isfont){
                style._txtnode =  html.childNodes[j++];
                s.push(this.$finalizeFont(style));
            }
        }
         s.push("l._anim = _anim;");
        if( l.dx != 0)s.push("_c.restore();");
        this.l = null;
        return s.join('');
        */
    },
    
    //----------------------------------------------------------------------
    
    // Shape rendering
    
    //----------------------------------------------------------------------

    beginShape : function( style, ml,mt,mr,mb){
        //aight lets set the style, if we have a previous style we should diff
        var pstyle = (this.style && this.style.isshape)?this.style:
                           {fill:"-",gradient:"-",angle:"-",stroke:"-",
                            fillopacity:"-",strokeopacity:"-",weight:"-"}; 
                            
        var s = [this.$endDraw(),"_c.beginPath();"], l = this.l;
        // if we have an ml,mt,mr and mb we need to insert a clipping path.
        this.style = style;
        if(style._id === undefined){
            style._id = l._styles.push(style)-1;
        }
        
        s.push("_s=_styles[",style._id,"];");
        
        if(ml !== undefined && ml!=''){
            this._clip = 1;
            s.push("_c.save();_c.moveTo(",ml,",",mt,");_c.lineTo(l.dw-",mr,
                    ",",mt,");_c.lineTo(l.dw-",mr,",l.dh-",mb,");",
                    "_c.lineTo(",mt,",l.dh-",mb,");_c.closePath();_c.clip();",
                    "_c.beginPath();\n");
        }else this._clip = 0;
        
        var a ,g, i, fillmode=0, fill = style.fill;
        if( style.tile!== undefined ) {
            var tilemove="";
            if(style.tilex || style.tiley){
                tilemove=["_dx=__round(",(style.tilex||'0'),
                    ")%((_s._img&&_s._img.width)?_s._img.width:1),",
                    "_dy=__round(",(style.tiley||'0'),
                    ")%((_s._img&&_s._img.height)?_s._img.height:1);",
                     "_c.save();_c.translate(-_dx,-_dy);"].join('');
                this.tiletrans =1,this.mx="+_dx",this.my="+_dy";
            }
            
            fillmode |= 1;
            // lets do a nice inline tile image cachin
            if(this.isDynamic(style.tile)){
                if(apf.isGecko && style.fillopacity != 1){
                    if(this.isDynamic(style.fillopacity)){
                         s.push(
                        "if(!(_u=l.imgcache[_t=",style.tile,"])){",
                            "l.imgcache[_t]=_u=new Image();",
                            "_u.onload=function(){",
                               "_u._canvas = document.createElement('canvas');",
                               "_u._canvas.setAttribute('width', _u.width);",
                               "_u._canvas.setAttribute('height', _u.height);",
                               "_u._ctx = _u._canvas.getContext('2d');",
                               "_u.onload=null;",
                            "};",
                            "_u.src=_t;",
                         "}",
                         "if(_u && !_u.onload && _u._opacity !== (_q=",style.fillopacity,")){",
                            "_u._ctx.clearRect(0,0,_u.width,_u.height);",
                            "_u._ctx.globalAlpha=_u._opacity=_q;",
                            "_u._ctx.drawImage(_u,0,0);",   
                            "_s._pattern=l.canvas.createPattern(_u._canvas,",
                                                                  "'repeat');",
                         "}",
                         "if(_t=_s._pattern)_c.fillStyle=_t;\n",tilemove);
                    }else{
                        s.push(
                        "if(!(_u=l.imgcache[_t=",style.tile,"])){",
                            "l.imgcache[_t]=_u=new Image();",
                            "_u.onload=function(){",
                               "_u._canvas = document.createElement('canvas');",
                               "_u._canvas.setAttribute('width', _u.width);",
                               "_u._canvas.setAttribute('height', _u.height);",
                               "_u._ctx = _s._canvas.getContext('2d');",
                               "_u._ctx.globalAlpha="+style.fillopacity+";"+
                               "_u._ctx.drawImage(_u,0,0);",
                               "_u._pattern=l.canvas.createPattern(_u._canvas,'repeat');",
                               "_u.onload=null;",
                            "};",
                            "_u.src=_t;",
                         "}",
                         "if(_u && !_u.onload && _u!=_s._img){",
                             "_s._img=_u,_s.pattern=_u._pattern;",
                         "}",
                         "if(_t=_s._pattern)_c.fillStyle=_t;\n",tilemove);
                    }
                }else{
                    s.push(
                    "if(!(_u=l.imgcache[_t=",style.tile,"])){",
                        "l.imgcache[_t]=_u=new Image();",
                        "_u.onload=function(){",
                           "_u.onload=null;",
                           "_u._pattern=l.canvas.createPattern(_u,'repeat');",
                        "};",
                        "_u.src=_t;",
                     "}",
                     "if(_u && !_u.onload && _u!=_s._img){",
                       "_s._img=_u,_s.pattern=_u._pattern;",
                     "}",
                     "if(_t=_s._pattern)_c.fillStyle=_t;\n",tilemove);
                }
            }
            else{
                if(l.imgcache[style.tile]){
                    style._pattern = l.canvas.createPattern(l.imgcache[style.tile],
                                "repeat");
                }else{
                    var img = new Image();
                    img.onload = function(){
                        // we should use a canvas object to do some transparency
                        style._img = img;

                        // Dirty hack to make gecko support transparent tiling
                        if(apf.isGecko && style.fillopacity != 1){
                            style._canvas = document.createElement("canvas");
                            style._canvas.setAttribute("width", img.width);
                            style._canvas.setAttribute("height", img.height);
                            style._ctx = style._canvas.getContext('2d');
                            // check if we have dynamic opacity
                            if(!apf.draw.isDynamic(style.fillopacity)){
                                style._ctx.globalAlpha=style.fillopacity;
                                style._ctx.drawImage(img,0,0);
                            }
                            style._pattern = l.canvas.createPattern(style._canvas,
                                "repeat");
                        }else{
                            style._pattern = l.canvas.createPattern(style._img=this,
                                "repeat");
                        }
                    }
                    
                    // Dirty hack to make gecko support transparent tiling                    
                    if(apf.isGecko && this.isDynamic(style.fillopacity)){
                        s.push("if(_s._ctx){",
                               "_s._ctx.clearRect(0,0,_s._img.width,_s._img.height);",
                               "_s._ctx.globalAlpha=",style.fillopacity,";",
                               "_s._ctx.drawImage(_s._img,0,0);",
                               "_s._pattern=l.canvas.createPattern(_s._canvas,",
                                            "'repeat');}\n");
                    }
                    img.src = style.tile;
               }
                s.push("if(_t=(_s._pattern))_c.fillStyle=_t;",tilemove);
            }
        }else
        if( fill !== undefined ){
            fillmode |= 1;
            if(fill.sort && fill.length<=1)
                fill = fill.length&&fill[0]?fill[0]:'black';
            if( fill.sort ){
                var f = fill, len = f.length;
                for(i=0; i<len && !this.isDynamic(fill[i]);i++);
                if(i!=len || this.isDynamic(style.angle)|| this.isDynamic(style.fillopacity)){
                    s.push("_o=",style.fillopacity,",_r=",style.gradopacity,",_t=_s._colors,_m=0;");
                    for(i=0;i<len;i++){
                        // calculate fillopacity and gradopacity and then interpolate over them through the colorstops
                        if(this.isDynamic(fill[len-i-1])){
                            s.push("if(_t[",i,"]!=(_l=[",
                                "'rgba(',(((_q=parseInt((",this.getColor(fill[len-i-1]),
                                ").slice(1),16))>>16)&0xff),",
                                "',',((_q>>8)&0xff),',',(_q&0xff),',',",
                                "(",i/(len-1),"*_o+",1-(i/(len-1)),"*_r)",
                                ",')'].join(''))",")_t[",i,"]=_l,_m=1;");
                        }else{
                            var t = parseInt((this.colors[fill[len-i-1].toLowerCase()] ||
                                    fill[len-i-1]).slice(1),16);
                            s.push("if(_t[",i,"]!=(_l=",
                                "['rgba(",(t>>16)&0xff,
                                ",",(t>>8)&0xff,",",t&0xff,",',","(",i/(len-1),"*_o+",
                                1-(i/(len-1)),"*_r),')'].join(''))",
                                ")_t[",i,"]=_l,_m=1;");
                        }
                    }
                    s.push("if(_s._angle!=(_u=(",style.angle,")*2*p) || _m){",
                            "_s._grad=_q=_c.createLinearGradient(",
                           "dtx+(__sin(_s._angle=_u)*0.5+0.5)*dw,",
                           "dty+(__cos(_u)*0.5+0.5)*dh,",
                           "dtx+(__sin(p+_u)*0.5+0.5)*dw,",
                           "dty+(__cos(p+_u)*0.5+0.5)*dh);");
                    for(i=0;i<len;i++)
                        s.push("_q.addColorStop(",i/(len-1),",_t[",i,"]);");
                    s.push("_c.fillStyle=_q;}else _c.fillStyle=_s._grad;\n");
                    style._colors=[];
                }else{
                    var g = l.canvas.createLinearGradient(
                        (Math.sin(style.angle)*0.5+0.5)*l.dw,
                        (Math.cos(style.angle)*0.5+0.5)*l.dh,
                        (Math.sin(Math.PI+style.angle)*0.5+0.5)*l.dw,
                        (Math.cos(Math.PI+style.angle)*0.5+0.5)*l.dh 
                    );
                    var u,o = style.fillopacity, r = style.gradopacity;
                    for(i=0;i<len;i++){
                        a = this.colors[a=fill[len-i-1].toLowerCase()] ||
                            fill[len-i-1];
                        g.addColorStop(u=i/(len-1), 
                        'rgba('+(((a=parseInt(a.slice(1),16))>>16)&0xff)+
                        ','+((a>>8)&0xff)+','+((a)&0xff)+','+(u*o+(1-u)*r)+')');
                    }
                    style._gradient = g;
                    s.push("_c.fillStyle=_styles[",style._id,"]._gradient;");
                }
            } else {
                if(this.isDynamic(fill) || pstyle.fill != fill)
                    s.push("_c.fillStyle=",this.getColor(fill),";");
            }
        }
        if(style.stroke!== undefined){
            fillmode |= 2;
            if(this.isDynamic(style.stroke) || pstyle.stroke != style.stroke)
                s.push("_c.strokeStyle=",this.getColor(style.stroke),";");
            
            if(this.isDynamic(style.weight) || pstyle.weight != style.weight)
                s.push("_c.lineWidth=",style.weight,";");
        }
        this.fillopacity = "";
        this.strokeopacity = "";
        this.fillmode = fillmode;
        switch(fillmode){
            case 3:// check if our fillopacity != stroke opacity, ifso we create switches between filling and stroking
            if(style.fillopacity != style.strokeopacity ){
                this.fillopacity ="_c.globalAlpha="+style.fillopacity+";";
                this.strokeopacity ="_c.globalAlpha="+style.strokeopacity+";";
            }else{
                if(this.isDynamic(style.fillopacity) || style.fillopacity != pstyle.fillopacity)
                    s.push("_c.globalAlpha=",style.fillopacity,";");
            }
            break;
            case 2: 
                if(this.isDynamic(style.strokeopacity) || style.strokeopacity != pstyle.strokeopacity)
                    s.push("_c.globalAlpha=",style.strokeopacity,";"); 
               break;
            case 1: 
                if(this.isDynamic(style.fillopacity) || style.fillopacity != pstyle.fillopacity)
                    s.push("_c.globalAlpha=",style.fillopacity,";"); 
                break;
        }
        return s.join('');
    },
    

    
    moveTo : function(x,y){
        // check our mode. if its 3 we need to cache it
        return "_c.moveTo("+x+this.mx+","+y+this.my+");\n";
    },
    lineTo : function(x, y){
        this.dodraw= 1;
        return "_c.lineTo("+x+this.mx+","+y+this.my+");\n";
    },
    lineH : function(x,y,w){
        this.dodraw = 1;
        return ["_c.moveTo(",x,this.mx,",",y,this.my,");",
                "_c.lineTo(",x,this.mx,"+",w,",",y,this.my,");\n"].join('');
    },
    lineV : function(x,y,h){
        this.dodraw = 1;
        return ["_c.moveTo(",x,this.mx,",",y,this.my,");",
                "_c.lineTo(",x,this.mx,",",y,this.my,"+",h,");\n"].join('');
    },    
    dot : function(x,y){
        this.dodraw = 1;
        return ["_c.moveTo(",x,this.mx,",",y,this.my,");",
                "_c.lineTo(",x,this.mx,",",y,this.my,");\n"].join('');
    },
    circle : function( x,y,r,s,e,c ){
        this.dodraw = 1;
        if(!s)s='0'; if(!e)e='p';c=c?1:0;
        return["_c.arc(",x,",",y,",",r,",",s,",",e,",",c,");"].join('');
    },
    ellipse : function(x,y,w,h,s,e,c){
        this.dodraw = 1;
        if(!s) s = '0'; if(!e) e = 'p2';c=c?1:0;
        return["if((_x2=(",w,"))!=0 && (_y2=-(",h,"))!=0){_c.translate(_x1=(",x,"),_y1=(",y,"));_c.scale(_x2,_y2);",
               "_c.arc(0,0,1,(",s,")-1.5707965,(",e,")-1.5707965,",!c,");_c.scale(1/_x2,1/_y2);_c.translate(-_x1,-_y1);}"].join('');
    },
    rect : function( x,y,w,h){
       /*
         if(this.style.outx){
            x=(parseFloat(x)==x)?(parseFloat(x)-this.ox):"("+x+"-"+this.ox+")";
            w=(parseFloat(w)==w)?(parseFloat(w)+2*this.ox):"("+w+"+"+2*this.ox+")";
        }
        if(this.style.outy){
            y=(parseFloat(y)==y)?(parseFloat(y)-this.oy):"("+y+"-"+this.oy+")";
            h=(parseFloat(h)==h)?(parseFloat(h)+2*this.oy):"("+h+"+"+2*this.oy+")";
        }
        */
        switch(this.fillmode){
            case 3: return this.fillopacity+
                            "_c.fillRect(_x1="+x+this.mx+",_y1="+y+this.my+
                            ",_x2="+w+",_y2="+h+");"+
                           this.strokeopacity+
                              "_c.strokeRect(_x1,_y1,_x2,_y2);";
            case 2: return "_c.strokeRect("+x+this.mx+","+y+this.my+","+w+","+h+");\n";
            case 1: return "_c.fillRect("+x+this.mx+","+y+this.my+","+w+","+h+");\n";
        }
    },    
    close : function (){
        return ["_c.closePath();",this.$dodraw()].join('');
    },
    $dodraw : function (){
        this.dodraw = 0;
        switch(this.fillmode){ 
            case 3: return this.fillopacity+"_c.fill();"+
                           this.strokeopacity+"_c.stroke();_c.beginPath();\n";
            case 2: return "_c.stroke();_c.beginPath();\n";
            case 1: return "_c.fill();_c.beginPath();\n";
        }    
    },
    
    $endShape : function(){
        var s = this.dodraw?[this.$dodraw()]:[];
        
        this.mx="",this.my="";
        this.last = this.style._id;
        this.style = 0;
        
        if(this.tiletrans)s.push("_c.restore();");
        this.tiletrans=0;
        if(this._clip)s.push("_c.restore();");
        this._clip = 0;
        return s.join('');
    },
    
    $finalizeShape : function(){
        return '';
    }
        
};
//#endif
//#endif