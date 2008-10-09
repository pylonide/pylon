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
// #ifdef __WITH_DRAW
jpf.draw = {

    equalStyle : function( a, b){
        if(a.isfont && b.isfont)
            return  a.family === b.family &&
                    a.join === b.join &&
                    a.height == b.height &&
                    a.width == b.width &&
                    a.align === b.align &&
                    a.color === b.color &&
                    a.size === b.size &&
                    a.style === b.style
        if(a.isshape && b.isshape)
            return a.line === b.line &&
                   a.join === b.join &&
                   a.weight == b.weight &&
                   a.fill === b.fill &&
                   a.fillalpha === b.fillalpha &&
                   a.linealpha === b.linealpha &&
                   a.angle === b.angle;
        return false;
    },
    
    parseStyle : function( root, style, str, macro ) {
        //  parse and generate a proper style object
        var o = {}, k1, v1, k2, v2, t, s, i, len;
        function inherit(a,b,dst,src){
            var k,i;
            for(k in src)
                if(dst[k] === undefined) dst[k]=src[k];
            if(i=src.inherit)inherit(a,b,dst,a[i]||b[i]);
        }
        for(k1 in style){
            if( ( v1 = style[k1] ) === null) v1 = style[k1] = {active:false};
            if( (t=typeof( v1 )) == 'object' ){
                t = o[k1] = {};
                inherit( style, root, t, v1 );
            }else o[k1] = v1; 
        }
        // lets overload our newfangled object structure with css-from-string
        s = [o];
        str.replace(/([\w\-]+)\s*\{\s*|(\s*\}\s*)|([\w\-]+)\:?([^;]+)?;?/g, 
            function( m, no, nc, n, v ){
            // lets see if we have an nc or an no, which should move us up and down the object stack
            if(no) s.push( o = (typeof(o[no]) == 'object') ? o[no] : o[no]={} );
            else if(nc){
                if(s.length<2) alert("FAIL2");
                s.pop(); o = s[s.length-1];
            } else {
                if( v=='null' || v=='undefined' ) o[n] = null;
                else if( parseFloat(v) == v ) o[n] = parseFloat(v);
                else {
                    if(m=v.match(/^\s*\'\s*(.*)\s*\'\s*$/)) v = m[1];
                    if(m=v.match(/^\s*\"\s*(.*)\s*\"\s*$/)) v = m[1];
                    if(m=v.match(/^\s*\[\s*(.*)\s*\]\s*$/)){
                        v = macro( m[1], true );
                    }
                    // check 
                    o[n] = v;
                }
            }
        });
        
        function expandMacro(v){
            var i,t;
            if( v && v.sort ){ // we are dealing with an array
                for(i = 0, len = v.length;i<len;i++){
                     if(typeof(t=v[i])=='string' && t.match(/\(/))
                        v[i]=macro(t);
                }
            }else if( typeof(v)=='string' && v.match(/\(/)){
                return macro( v );
            }
            return v;
        }
        
        // lets initialize all style objects to contain all needed variables for the drawing abstraction
        for(k1 in o){
            if( (v1=typeof(t = o[k1])) == 'object'){
                if(t.line === null) delete t.line;
                if(t.fill === null) delete t.fill;

                if( t.isshape && (t.fill !== undefined || 
                            t.line !== undefined) || 
                            t.isfont && (t.family !== undefined) ) 
                    t.active = true;
                if(t.isshape){
                    t.alpha = t.alpha!==undefined ? t.alpha : 1;
                    t.fillalpha = t.fillalpha!==undefined ? t.fillalpha:t.alpha;
                    t.gradalpha = t.gradalpha!==undefined ? t.gradalpha:t.fillalpha;
                    t.linealpha = t.linealpha!==undefined ? t.linealpha:t.alpha;
                    t.angle = t.angle!==undefined ?    t.angle : 0;
                    t.weight = t.weight!==undefined ? t.weight : 1
                }
                if(macro)for(k2 in t)t[k2] = expandMacro(t[k2])
            }
            if(macro)o[k1] = expandMacro(o[k1]);
        }
        return o;
    },
    isDyn : function( a ) {
        // check if we have a dynamic property.. how?
        return a && typeof(a)=='string' && a.match(/\(/)!=null;
    },
    dynCol : function (a) {
        if(a.match(/\(/)) return a;
        if(a.match(/^#/)) return "'"+a+"'";
        var b = a.toLowerCase();
        return (jpf.draw.colors[b])?"'"+jpf.draw.colors[b]+"'":a;
    },
    // generic htmlText
    text : function( style, needed, ml,mt,mr,mb ) {
        if(!style.active || needed===undefined)return -1;
        var l = this.l, html = l._htmljoin, s=[this.$endDraw()];
        this.style = style;
        style._id = l._styles.push(style)-1;

        ml = ml!==undefined?ml:0;
        mt = mt!==undefined?mt:0;
        mr = mr!==undefined?mr:0;
        mb = mb!==undefined?mb:0;
        this.mx = ml?"-"+(ml*l.ds):"";
        this.my = mt?"-"+(mt*l.ds):"";    
        // find a suitable same-styled other text so we minimize the textdivs
        /*
        for(i = l._styles.length-2;i>=0;i--){
            if(!l._styles[i]._prev && 
                jpf.draw.equalStyle( l._styles[i], style )){
                style._prev = i;
                break;
            }
        }
        if(style._prev===undefined){*/
        style._txtdiv = ["<div style='",
                (style.vertical)?
                "filter: flipv() fliph(); writing-mode: tb-rl;":"",
    "position:absolute;cursor:default;overflow:hidden;left:0;top:0;display:none;font-family:",
                style.family, ";color:",style.color,";font-weight:",
                style.weight,";",";font-size:",style.size,"px;",
                (style.width!==undefined)?"width:"+style.width+"px;" : "",
                (style.height!==undefined)?"height:"+style.height+"px;" : "",
                (style.style!==undefined)?"font-style:"+style.style+";" : "",
                (style.align!==undefined)?"text-align:"+style.align+";" : "",
                "'>-</div>"].join('');
        html.push("<div onmousedown='return false' style='cursor:default;position:absolute;left:",ml,"px;top:",mt,
                  "px;width:",l.width-(mr+ml),"px;height:",l.height-(mb+mt),
                  "px;overflow:hidden;'></div>");

        s.push( "_s=_styles[",style._id,"],_tn=_s._txtnodes,_tc = 0;\n");
        /*} else {
            if(this.last !== style._prev) 
                s.push("_s=_styles[",style._prev,
                       "],_tn=_s._txtnodes,_tc = _s._txtcount;\n");
        }*/
        s.push("if((_l=(",needed,
               ")) > _tn.length-_tc)l.engine.allocText(_s,_l);");
        return s.join('');
    },
    
    allocText : function(style, needed){
        var t, tn = style._txtnode, ts = style._txtnodes;
        if(!ts.length)tn.innerHTML = Array(needed+1).join(style._txtdiv); 
        else tn.insertAdjacentHTML('beforeend',Array(needed+1).
                                    join(style._txtdiv));
        while(needed-->0){
            t=tn.childNodes[ts.length];
            ts.push({ n: t, v: t.firstChild,x:0,y:0,s:null});
        }
    },
    
    print : function( x, y, text) {
        var t = ((this.l.ds>1)?"/"+this.l.ds:"");
        return ["if( (_t=_tn[_tc++]).s!=(_v=",text,") )_t.v.nodeValue=_t.s=_v;",
                "if(_t.x!=(_v=__round(",x,")))_t.n.style.left=_t.x=((_v",
                this.tx,this.mx,")",t,")+'px'",
                ";if(_t.y!=(_v=__round(",y,")))_t.n.style.top=_t.y=((_v",
                this.ty,this.my,")",t,")+'px';\n"
                ].join('');
    
    },
    
    $finalizeText : function(style) {
        var s=["if((_lc=(_s=_styles[",style._id,"])._txtused)>",
            "(_tc=_s._txtcount)){_tn=_s._txtnodes;",
            "for(;_lc>_tc;)_tn[--_lc].n.style.display='none';",
            "_s._txtused=_tc;",
        "} else if(_lc<_tc) {_tn=_s._txtnodes;",
            "for(;_lc<_tc;)_tn[_lc++].n.style.display='block';",
            "_s._txtused=_tc;",
        "}"];
        var v = style._txtnodes = [];
        style._txtused = 0;
        style._txtcount = 0;
        return s.join('');
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
    }
};

jpf.draw.canvas = {
    canvas : null,
    init : function(o){
                  
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", o.canvaswidth = o.oInt.offsetWidth);
        canvas.setAttribute("height", o.canvasheight = o.oInt.offsetHeight);
        canvas.className = "canvas";        
        o.oInt.appendChild(canvas);
        o.canvas = canvas.getContext('2d');
        o.canvas.translate(0.5,0.5);
        return this;
    },
     

    initLayer : function(l){ 
        l.canvas = l.parentNode.canvas?l.parentNode.canvas:l.parentNode.parentNode.canvas;
        l.textroot = l.parentNode.oInt?l.parentNode.oInt:l.parentNode.parentNode.oInt;
        l.dx = l.left;
        l.dy = l.top;
        l.dw = l.width;
        l.dh = l.height;
        l.ds = 1;
        
        l._styles = [];
        l._htmljoin = [];
        return this;
    },
    
    destroyLayer : function(l){
    },

    beginLayer : function(l){
        this.l = l,this.tx = "",this.ty = "",this.mx="",this.my="",this.last=null;
        this.doclose = 0; 
        var s=["var _c=l.canvas,_styles=l._styles,",
                "_s,_dx,_dy,_td,_l,_lc,_tc,_x1,_x2,_y1,_y2,_cv,_t,_u;",
                "if(l.firstlayer)_c.clearRect(",l.dx,",",l.dy,",",l.dw,",",l.dh,");"];

        if( l.dx != 0 )
           s.push("_c.save();_c.beginPath();_c.translate(",l.dx,",",l.dy,");",
            "_c.moveTo(0,0);_c.lineTo(",l.dw,",0);_c.lineTo(",l.dw,",",l.dh,");",
            "_c.lineTo(0,",l.dh,");_c.closePath();_c.clip();");
        return s.join('');
    },

    endLayer : function(){
        var l = this.l; 
        var s = [this.$endDraw()], 
            html = l.textroot, j = html.childNodes.length,
            i = 0, len = l._styles.length;

        html.insertAdjacentHTML( 'beforeend', l._htmljoin.join('') );

        for(;i<len;i++){
            var style = l._styles[i];
            if(style._prev===undefined && style.isfont){
                style._txtnode =  html.childNodes[j++];
                s.push(this.$finalizeText(style));
            }
        }
        if( l.dx != 0)s.push("_c.restore();");
        this.l = null;
        return s.join('');
    },

    beginTranslate : function(x,y){
        this.translate = 1;
        this.dx = x, this.dy=y;
        this.tx = "+_dx",this.ty = "+_dy";
        return "_c.save();_c.translate("+x+","+y+
               ");var _dx = __round("+x+"),_dy=__round("+y+");";
    },
    endTranslate : function(){
        this.translate = 0;
        this.tx="", this.ty="";
        return this.$endDraw()+"_c.restore();";
    },
    
    allocGradient : function( l, fill, gradient, angle ){
        var a = angle * ( Math.PI / 360 );
        var g = l.canvas.createLinearGradient(
            (Math.cos(-a+Math.PI*1.25)/2+0.5)*l.dw,
            (Math.sin(-a+Math.PI*1.25)/2+0.5)*l.dh,
            (Math.cos(-a+Math.PI*0.75)/2+0.5)*l.dw,
            (Math.sin(-a+Math.PI*0.75)/2+0.5)*l.dh 
        );
        g.addColorStop(1, fill);
        g.addColorStop(0, gradient);
        return g;
    },
       
    shape : function(style) {
        //aight lets set the style, if we have a previous style we should diff
        var pstyle = (this.style && this.style.isshape)?this.style:
                           {fill:"-",gradient:"-",angle:"-",line:"-",
                            fillalpha:"-",linealpha:"-",weight:"-"}; 
        var s = [this.$endDraw(),"_c.beginPath();"], l = this.l;
       
        this.style = style;
        style._id = l._styles.push(style) - 1;
        
        var a ,g, i, fillmode=0, fill = style.fill;
        
        if( fill !== undefined ){
            fillmode |= 1;
            if(fill.sort && fill.length<=1)
                fill = fill.length?fill[0]:'black';
            if( fill.sort ){
                var f = fill, len = f.length;
                for(i=0; i<len && !this.isDyn(fill[i]);i++);
                if(i!=len || this.isDyn(style.angle)|| this.isDyn(style.fillalpha)){
                    s.push("_t=l.canvas.createLinearGradient(",
                           "(__sin(_u=(",style.angle,")*2*p)*0.5+0.5)*l.dw,",
                           "(__cos(_u)*0.5+0.5)*l.dh,",
                           "(__sin(p+_u)*0.5+0.5)*l.dw,",
                           "(__cos(p+_u)*0.5+0.5)*l.dh);");
                    for(i=0;i<len;i++){
                        s.push("_t.addColorStop(",i/(len-1),",",
                            "'rgba('+(((__q=parseInt((",this.dynCol(fill[i]),
                            ").slice(1),16))>>16)&0xff)+",
                            "','+((__q>>8)&0xff)+','+(__q&0xff)+','+",
                            style.fillalpha,"+')'",");");
                }
                    s.push("_c.fillStyle=_t;");
                }else{
                    var g = l.canvas.createLinearGradient(
                        (Math.sin(style.angle)*0.5+0.5)*l.dw,
                        (-Math.cos(style.angle)*0.5+0.5)*l.dh,
                        (Math.sin(Math.PI+style.angle)*0.5+0.5)*l.dw,
                        (-Math.cos(Math.PI+style.angle)*0.5+0.5)*l.dh 
                    );
                    for(i=0;i<len;i++){
                        a = jpf.draw.colors[a=fill[i].toLowerCase()]?
                            jpf.draw.colors[a]:fill[i];
                        
                        g.addColorStop(i/(len-1), 
                        'rgba('+(((a=parseInt(a.slice(1),16))>>16)&0xff)+
                        ','+((a>>8)&0xff)+','+((a)&0xff)+','+style.fillalpha+')');
                    }
                    style._gradient = g;
                    s.push("_c.fillStyle=_styles[",style._id,"]._gradient;");
                }
            } else {
                if(this.isDyn(fill) || pstyle.fill != fill)
                    s.push("_c.fillStyle=",this.dynCol(fill),";");
            }
        }
        if(style.line!== undefined){
            fillmode |= 2;
            if(this.isDyn(style.line) || pstyle.line != style.line)
                s.push("_c.strokeStyle=",this.dynCol(style.line),";");
            
            if(this.isDyn(style.weight) || pstyle.weight != style.weight)
                s.push("_c.lineWidth=",style.weight,";");
        }
        this.fillalpha = "";
        this.linealpha = "";
        this.fillmode = fillmode;
        switch(fillmode){
            case 3:// check if our fillalpha != stroke alpha, ifso we create switches between filling and stroking
            if(style.fillalpha != style.linealpha ){
                this.fillalpha ="_c.globalAlpha="+style.fillalpha+";";
                this.linealpha ="_c.globalAlpha="+style.linealpha+";";
            }else{
                if(this.isDyn(style.fillalpha) || style.fillalpha != pstyle.fillalpha)
                    s.push("_c.globalAlpha=",style.fillalpha,";");
            }
            break;
            case 2: 
                if(this.isDyn(style.linealpha) || style.linealpha != pstyle.linealpha)
                    s.push("_c.globalAlpha=",style.linealpha,";"); 
               break;
            case 1: 
                if(this.isDyn(style.fillalpha) || style.fillalpha != pstyle.fillalpha)
                    s.push("_c.globalAlpha=",style.fillalpha,";"); 
                break;
        }
        return s.join('');
    },
        
    moveTo : function(x,y){
        // check our mode. if its 3 we need to cache it
        return "_c.moveTo("+x+","+y+");";
    },
    lineTo : function(x, y){
        this.doclose= 1;
        return "_c.lineTo("+x+","+y+");";
    },
    hline : function(x,y,w){
        this.doclose = 1;
        return ["_c.moveTo(",x,",",y,");",
                "_c.lineTo(",x,"+",w,",",y,");"].join('');
    },
    vline : function(x,y,h){
        this.doclose = 1;
        return ["_c.moveTo(",x,",",y,");",
                "_c.lineTo(",x,",",y,"+",h,");"].join('');
    },    
    rect : function( x,y,w,h ){
        if(this.style.outx){
            x=(parseFloat(x)==x)?(parseFloat(x)-this.ox):"("+x+"-"+this.ox+")";
            w=(parseFloat(w)==w)?(parseFloat(w)+2*this.ox):"("+w+"+"+2*this.ox+")";
        }
        if(this.style.outy){
            y=(parseFloat(y)==y)?(parseFloat(y)-this.oy):"("+y+"-"+this.oy+")";
            h=(parseFloat(h)==h)?(parseFloat(h)+2*this.oy):"("+h+"+"+2*this.oy+")";
        }    
        switch(this.fillmode){ 
            case 3: return this.fillalpha+
                            "_c.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");"+
                           this.linealpha+
                              "_c.strokeRect(_x1,_y1,_x2,_y2);";
            case 2: return "_c.strokeRect("+x+","+y+","+w+","+h+");";
            case 1: return "_c.fillRect("+x+","+y+","+w+","+h+");";
        }
    },    
    close : function (){
        this.doclose = 0;
        switch(this.fillmode){ 
            case 3: return this.fillalpha+"_c.closePath();_c.fill();"+
                           this.linealpha+"_c.stroke();_c.beginPath();";
            case 2: return "_c.stroke();_c.beginPath();";
            case 1: return "_c.fill();_c.beginPath();";
        }    
    },
    $endDraw : function() {
        var s = this.doclose?[this.close()]:[];
        if(this.style){
            var style = this.style, id = style._id, t;
            this.last = id;
            this.style = 0;
            if(style.isfont)s.push("_s._txtcount = _tc;");
        }
        return s.join('');
    },
    
    
    text : jpf.draw.text,
    allocText : jpf.draw.allocText,
    print : jpf.draw.print,
    $finalizeText : jpf.draw.$finalizeText,
    isDyn : jpf.draw.isDyn,
    dynCol : jpf.draw.dynCol
}


jpf.draw.vml = {
    // @Todo test resize init charting, z-index based on sequence

    init : function(o){
        
        jpf.importCssString(document, "v\\:* {behavior: url(#default#VML);}");
        
        o.oExt.onselectstart = function(){
            return false;
        }
        o.oInt.innerHTML = "\
            <div style='z-index:10000;position:absolute;left:0px;width:0px;\
                        background:url(images/spacer.gif);width:"+
                        o.oExt.offsetWidth+"px;height:"+o.oExt.offsetHeight+"px;'>\
            </div>\
            <div style='margin: 0 0 0 0;padding: 0px 0px 0px 0px; \
                        position:absolute;left:0;top:0;width:"+
                        o.oExt.offsetWidth+';height:'+o.oExt.offsetHeight+
                        ";overflow:hidden;'>\
            </div>";
        o.vmlroot = o.oInt.lastChild;
        return this;
    },
        
    initLayer : function(l){ 

        var p = l.parentNode.vmlroot?l.parentNode:l.parentNode.parentNode;
        var vmlroot = p.vmlroot;
        
        var tag = "<div style='position:absolute;left:"+l.left+
                  ";top:"+l.top+";width:"+l.width+";height:"+l.height+
                  ";overflow:hidden;'/>";
 
        l.ds = 4;
        l.dw = parseFloat(l.width)*l.ds;
        l.dh = parseFloat(l.height)*l.ds;
        
        l.vmltag = "style='position:absolute;left:0;top:0;width:"+
                   (l.width)+";height:"+(l.height)+
        ";overflow:hidden;' coordorigin='0,0' coordsize='"+(l.dw+1)+","+(l.dh+1)+"'";
        vmlroot.insertAdjacentHTML("beforeend", tag);
        var vmlgroup = vmlroot.lastChild;

        l._styles       = [];
        l._htmljoin     = [];
        l._vmlgroup = vmlgroup;
    },

    updateLayer : function(l){
        // update layer position, and perhaps z-order?
    },
     
    deinitLayer : function(l){
        // we should remove the layer from the output group.
        l._vmlgroup.removeNode();
        l._vmlgroup = 0;
    },

    beginLayer : function(l){
        this.l = l,this.tx = "",this.ty = "",this.mx="",this.my="",this.last=null;
        return "var _t,_u,_l,_dx,_dy,_tv,_tn,_tc,_lc,_s,_p,_styles = this._styles;";
    },

    endLayer : function(){
        var l = this.l;
        var s = [this.$endDraw()];

        l._vmlgroup.innerHTML = l._htmljoin.join('');
        var j = 0,i = 0, t, k, v, len = this.l._styles.length;
        for(;i<len;i++){
            var style = this.l._styles[i];
            if(style._prev===undefined){ // original style
                var n = l._vmlgroup.childNodes[j++];
                if(style.isshape){
                    style._vmlnode = n;
                    style._vmlfill = n.firstChild.nextSibling;
                    style._vmlstroke = n.lastChild;
                    s.push(this.$finalizeShape(style));
                }
                else{
                    style._txtnode = n;
                    s.push(this.$finalizeText(style));
                }
            }
        }
        this.l = null;
        return s.join('');
    },

    beginTranslate : function(x,y){
        this.tx = "+_dx",this.ty = "+_dy";
        return "_dx = __round("+x+"),_dy=__round("+y+");";
    },

    endTranslate : function(){
        this.tx="", this.ty="";
        return "";
    },
    createGradient : function(){
        // create a gradient string from our arguments
        
    },
    shape : function(style) {
        if(!style.active)return -1;
        var l=this.l, html = l._htmljoin, i, t,
            shape=[], path=[], child=[], opacity="", s=[this.$endDraw()];

        style._id = l._styles.push(style)-1;
        this.style = style;

        // find a suitable same-styled other shape so we minimize the VML nodes
        for(i = l._styles.length-2;i>=0;i--){
            if(!l._styles[i]._prev && 
                jpf.draw.equalStyle( l._styles[i], style )){
                style._prev = i;
                break;
            }
        }

        // check if we are joined
        if(style._prev === undefined) {
            s.push("_p=(_s=_styles[",style._id,"])._path=[];");
            // lets check the style object. what different values do we have?
            if(style.fill !== undefined){
                // check if our fill is dynamic. 
                var fill = style.fill, fillalpha = style.fillalpha,
                    angle = style.angle,len = fill.length;
                if(!fill.sort)fill=[fill];
                var color='black', colors, color2;
                // ok so the first color goes in the color tag, the last in color2
                if(len>0){
                    if( this.isDyn(fill[0]) )
                        s.push("_s._vmlfill.color=",this.dynCol(fill[0]),";");
                    else color = fill[0];
                };
                if(len>1){
                    if(this.isDyn(fill[len-1]))
                        s.push("_s._vmlfill.color2=",
                            this.dynCol(fill[len-1]),";");
                    else color2 = fill[len-1];
                    if(len>2){
                        for(i=1;i<len-1&&!this.isDyn(fill[i]);i++);
                        if(i!=len-1){ // its dynamic
                            s.push("_s._vmlfill.colors.value=");
                            for(i=1;i<len-1;i++)
                                s.push(i>1?'+",':'"',Math.round((i/(len-1))*100),'% "+',
                                  this.dynCol(fill[i]));
                            s.push(";");
                        }else{
                            for(t=[],i=1;i<len-1;i++)
                                t.push(i>1?',':'',Math.round((i/(len-1))*100),'% ',fill[i]);
                            colors = t.join(''); 
                        }
                    }
                    // all in between in colors go in 'colors'
                    if( this.isDyn(fillalpha) ){
                        fillalpha = '1';
                        s.push("_s._vmlfill.opacity2=_s._vmlfill.opacity=",
                            style.fillalpha,";");
                    };
                    if( this.isDyn(angle) ){
                        angle = '0';
                        s.push("_s._vmlfill.angle=(((",style.angle,")+180)*360)%360;");
                    };
                }else{
                    if( this.isDyn(fillalpha) ){
                        fillalpha = '1';
                        s.push("_s._vmlfill.opacity=",style.fillalpha,";");
                    };
                }
                // if we have a color2, we have a gradient
                if(color2!==undefined){
                    child.push("<v:fill alignshape='f' opacity='",
                        fillalpha,"' method='none' o:opacity2='",
                        fillalpha,colors?"' colors='"+colors+"'":"",
                        "' color='",color,"' color2='",color2,
                        "' type='gradient' angle='",angle+180,"'/>");
                }else{
                    child.push("<v:fill opacity='",fillalpha,
                        "' color='",fill,"' type='fill'/>");
                }
                shape.push("fill='t'"),path.push("fillok='t'");
            } else {
                shape.push("fill='f'"),path.push("fillok='f'");
            }
            if(style.line !== undefined){    
                var weight = style.weight,
                    alpha = style.linealpha;
                    line = style.line;
                if( this.isDyn(alpha) ){
                        alpha = '1';
                        s.push("_s._vmlstroke.alpha=",style.alpha,";");
                }
                if( this.isDyn(weight) ){
                        weight = '1';
                        s.push("_t=",style.weight,
                            ";_s._vmlstroke.weight=_t;if(_t<",alpha,
                            ")_s._vmlstroke.opacity=_t;");
                }
                if( this.isDyn(line) ){
                        line = 'black';
                        s.push("_s._vmlstroke.color=",this.dynCol(line),";");
                }
                    
                child.push("<v:stroke opacity='",
                    weight<1?(alpha<weight?alpha:weight):alpha,
                    "' weight='",weight,"' color='",line,"'/>");
            } else {
                shape.push("stroke='f'"), path.push("strokeok='f'");
            }
            html.push(["<v:shape ",l.vmltag," path='' ",shape.join(' '),"><v:path ",
                    path.join(' '),"/>",child.join(' '),"</v:shape>"].join(''));
        }  
        
        if(style._prev !== undefined){
            if(this.last !== style._prev)
                s.push("_p=(_s=_styles[",style._prev,"])._path;");
        }    
        return s.join('');
    },
    
    // drawing command
    moveTo : function(x, y){
        return ["_p.push('m',__round(",x,")",this.tx,
               ",' ',__round(",y+")",this.ty,",'l');\n"].join('');
    },
    lineTo : function(x, y){
        return ["_p.push(__round(",x,")",this.tx,
               ",' ',__round("+y+")",this.ty,");\n"].join('');
    },
    hline : function(x,y,w){
        return ["_p.push('m',__round(",x,")",this.tx,
                ",' ',__round(",y,")",this.ty,
                ",'r',__round(",w,"),' 0');"].join('');
    },
    vline : function(x,y,h){
        return ["_p.push('m',__round(",x,")",this.tx,
                ",' ',__round(",y,")",this.ty,
                ",'r0 ',__round(",h,"));"].join('');
    },
    rect : function( x,y,w,h ){
        if(this.style.outx){
            var ox = this.style.weight*this.style.outx;
            x=((parseFloat(x)==x)?(parseFloat(x)-ox):"("+x+"-"+ox+")");
            w=((parseFloat(w)==w)?(parseFloat(w)+2*ox):"("+w+"+"+2*ox+")");
        }
        if(this.style.outy){
            var oy = this.style.weight*this.style.outy;
            y=((parseFloat(y)==y)?(parseFloat(y)-oy):"("+y+"-"+oy+")");
            h=((parseFloat(h)==h)?(parseFloat(h)+2*oy):"("+h+"+"+2*oy+")");
        }
        return ["if((_t=__round(",w,"))>0)_p.push('m',__round(",x,
                ")",this.tx,",' ',__round(",y,")",this.ty,
                ",'r',_t,' 0r0 ',__round(",h,"),'r-'+_t,' 0x');"].join('');
    },
    
    close : function (){
        return "_p.push('xe');";
    },
        
    $finalizeShape : function(style){
        return ["(_s=_styles[",style._id,"])._vmlnode.path=",
            "(_p=_s._path).length?_p.join(' '):'m';\n"].join('');
    },
    
    $endDraw : function() {
        if(this.style){
            var style = this.style, id = style._id, t;
            this.last = id;
            this.style = 0;
            if(style.isfont) return "_s._txtcount = _tc;\n";
        }
        return "\n";
    },

    text : jpf.draw.text,
    allocText : jpf.draw.allocText,
    print : jpf.draw.print,
    isDyn : jpf.draw.isDyn,
    dynCol : jpf.draw.dynCol,
    $finalizeText : jpf.draw.$finalizeText
}

//#endif