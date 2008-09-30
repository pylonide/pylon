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
		return (a.line === b.line &&
		   a.join === b.join &&
		   a.family === b.family &&
		   a.color === b.color &&
		   a.size === b.size &&
		   a.weight == b.weight &&
		   a.style == b.style &&
		   a.fill === b.fill &&
		   a.fillalpha === b.fillalpha &&
		   a.linealpha === b.linealpha &&
		   a.gradalpha === b.gradalpha &&
		   a.gradient === b.gradient &&
		   a.angle === b.angle);
	},
	
	parseStyle : function( root, style, str ) {
		//  parse and generate a proper style object
		var o = {}, k1, v1, k2, v2, t, s;
		function inherit(a,b,dst,src){
			var k,i;
			for(k in src)
				if(dst[k] === undefined) dst[k]=src[k];
			if(i=src.inherit)inherit(a,b,dst,a[i]||b[i]);
		}
		for(k1 in style){
			if( ( v1 = style[k1] ) === null) v1 = style[k1] = {active:false};
			if( typeof( v1 ) == 'object' ){
				t = o[k1] = {};
				inherit( style, root, t, v1 );
			}else o[k1] = v1; 
		}
		// lets overload our newfangled object structure with css-from-string
		s = [o];
		str.replace(/([\w\-]+)\s*\{\s*|(\s*\}\s*)|([\w\-]+)\:([^;\}]+);?/g, 
			function( m, no, nc, n, v ){
			// lets see if we have an nc or an no, which should move us up and down the object stack
			if(no) s.push( o = (typeof(o[no]) == 'object') ? o[no] : o[no]={} );
			else if(nc){
				if(s.length<2) alert("FAIL2");
				s.pop(); o = s[s.length-1];
			} else {
				if( v=='null' || v=='undefined' ) o[n] = null;
				else if( parseFloat(v) == v ) o[n] = parseFloat(v);
				else o[n] = v;
			}
		});
		// lets initialize all style objects to contain all needed variables for the drawing abstraction
		for(k1 in o){
			if( typeof(t = o[k1]) == 'object'){
				if(t.line === null) delete t.line;
				if(t.fill === null) delete t.fill;

				if( t.isstyle && (t.fill !== undefined || 
							t.line !== undefined) || 
							t.isfont && (t.family !== undefined) ) 
					t.active = true;
				if(t.isstyle){
					t.alpha = t.alpha!==undefined ? t.alpha : 1;
					t.fillalpha = t.fillalpha!==undefined ? t.fillalpha:t.alpha;
					t.gradalpha = t.gradalpha!==undefined ? t.gradalpha:t.fillalpha;
					t.linealpha = t.linealpha!==undefined ? t.linealpha:t.alpha;
					t.angle = t.angle!==undefined ?	t.angle : 0;
					t.weight = t.weight!==undefined ? t.weight : 1
				}
			}
		}
		return o;
	},

	// generic htmlText
	text : function(style, rqd) {
		if(!style.active || rqd===undefined)return -1;
		var l = this.l, html = l._htmljoin, s=[this.$endDraw()];
		this.style = style;
		style._id = l._styles.push(style)-1;
		
		// find a suitable same-styled other text so we minimize the textdivs
		for(i = l._styles.length-2;i>=0;i--){
			if(!l._styles[i]._prev && 
				jpf.draw.equalStyle( l._styles[i], style )){
				style._prev = i;
				break;
			}
		}
		if(style._prev===undefined){
			style._txtdiv = ["<div style='",
					(style.vertical)?
					"filter: flipv() fliph(); writing-mode: tb-rl;":"",
					"position:absolute;left:0;top:0;display:none;font-family:",
					style.family, ";color:",style.color,";font-weight:",
					style.weight,";",";font-size:",style.size,";",
					(style.style!==undefined)?"font-style:"+style.style+";" : "",
					"'>-</div>"].join('');
			html.push("<div "+l.vmltag+"></div>");
			s.push( "_s=_styles[",style._id,"],_tn=_s._txtnodes,_tc = 0;\n");
		} else {
			if(this.last !== style._prev) 
				s.push("_s=_styles[",style._prev,
					   "],_tn=_s._txtnodes,_tc = _s._txtcount;\n");
		}
		// insert dynamic resizing check for text
		s.push( 
			"if((_l = (",rqd,")-((_t=_s._txtnodes.length)-_tc)) >0 ){",
				"if(!_t)_s._txtnode.innerHTML=Array(_l+1).join(_s._txtdiv);", 
				"else _s._txtnode.insertAdjacentHTML('beforeend',",
							"Array(_l+1).join(_s._txtdiv));",
				"while(_l-->0){",
					"_t=_s._txtnode.childNodes[_s._txtnodes.length];",
					"_s._txtnodes.push({ n: _t, v: _t.firstChild,",
						"x: 0, y: 0, s : null});",
				"}",
			"};\n"
		);
		return s.join('');
	},
	
	print : function( x, y, text) {
		var t = ((this.l.ds>1)?"/"+this.l.ds:"");
		return ["if( (_t=_tn[_tc++]).s!=(_v=",text,") )_t.v.nodeValue=_t.s=_v;",
				"if(_t.x!=(_v=parseInt(",x,")",this.tx,"))_t.n.style.left=_t.x=_v",t,
				";if(_t.y!=(_v=parseInt(",y,")",this.ty,"))_t.n.style.top=_t.y=_v",t,";\n"
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

    initLayer : function(l, v){ 
		l.texttag = "style='position:absolute;overflow:hidden;left:"+v.left+"px;top:"+
					 v.top+"px;width:"+(v.width)+"px;height:"+(v.height)+"px'";
		l.canvas = l.parentNode.canvas?l.parentNode.canvas:l.parentNode.parentNode.canvas;
		l.textroot = l.parentNode.oInt?l.parentNode.oInt:l.parentNode.parentNode.oInt;
		l.dx = v.left;
		l.dy = v.top;
		l.dw = v.width;
		l.dh = v.height;
		l.ds = 1;
		
		l._styles = [];

		return this;
    },
    
    destroyLayer : function(l){
    },

    beginLayer : function(l){
		this.l = l, this.sh = 0, this.tx = 0;
		// lets setup a clipping rect if we need to
		var s=["var _c=l.parentNode.canvas,_styles=l._styles,_s,_dx,_dy,_td,_lc,_tc,_x1,_x2,_y1,_y2,_cv;"];
		s.push("if(l.firstlayer)_c.clearRect(",l.dx,",",l.dy,",",l.dw,",",l.dh,");");
		if( l.dx != 0 )
		   s.push("_c.save();_c.beginPath();\
		    _c.translate(",l.dx+0.5,",",l.dy+0.5,");\
		    _c.moveTo(-1,-1);\
			_c.lineTo(",l.dw+1,",-1);\
			_c.lineTo(",l.dw+1,",",l.dh+1,");\
			_c.lineTo(-1,",l.dh+1,");\
			_c.closePath();\
			_c.clip();");
		else s.push("_c.translate(0.5,0.5);");
		return s.join('');
    },

    endLayer : function(){
		if( this.l.dx != 0) return "_c.restore();";
		this.l = null;
		return "_c.translate(-0.5,-0.5);";
    },

    allocShape : function( l, style, nomerge ){
		
	},
	
    allocDone : function(l){
		if(!l.tjoin.length) return;
		var html = l.textroot;
		html.insertAdjacentHTML( 'beforeend', l.tjoin.join('') );

	},
    
	
	beginTranslate : function(x,y){
		this.translate = 1;
		return "_c.save();_c.translate("+x+","+y+");var _dx = parseInt("+x+"),_dy=parseInt("+y+");";
	},
	endTranslate : function (){
		this.translate = 0;
		return "_c.restore();";
	},
	
 	beginShape : function(id) {
	
	var s = [], a ,g, i, m = 0,_cv={};
		l.cstyles.push(style);
		l.cstylevalues.push(_cv);
		// store the ID on the style
		style.id = l.cstyles.length - 1;
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
				s.push("_c.fillStyle=_cv.gradient;");_cv.gradient = g;
			} else {
				s.push("_c.fillStyle=_cv.fill;");_cv.fill = this.rgb(style.fill);
			}
		}
		if(style.line!== undefined){
			m |= 2;
			s.push("_c.strokeStyle=_cv.stroke;");_cv.stroke = this.rgb(style.line,style.linealpha)
			s.push("_c.lineWidth=_cv.width;");_cv.width = style.weight;
		}
		_cv.fillalpha = style.fillalpha;
		_cv.linealpha = style.linealpha;
		switch(m){
			case 3:// check if our fillalpha != stroke alpha, ifso we create switches between filling and stroking
			if(style.fillalpha != style.strokealpha ){
				l.calpha.push("");
				l.cfillalpha.push("_c.globalAlpha=_cv.fillalpha;");
				l.cstrokealpha.push("_c.globalAlpha=_cv.linealpha;");
			}else{
				l.calpha.push("_c.globalAlpha=_cv.fillalpha;");		
			}
			break;
			case 2:
				l.calpha.push("_c.globalAlpha=_cv.linealpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");
			case 1:
				l.calpha.push("_c.globalAlpha=_cv.fillalpha;");
				l.cfillalpha.push("");l.cstrokealpha.push("");			
		}
		l.cshapemode.push( m );
		l.cshapestyle.push( s.join('') );
		return style.id;
		/*
		if(id === undefined)id = this.sh++;
		this.id = id;
		this.m = this.l.cshapemode[id];
		var s = this.l.cstyles[this.id];
		if(s.outx)this.outx=1,this.ox = s.weight*s.outx;
		if(s.outy)this.outy=1,this.oy=s.weight*s.outy;
		return "_c.beginPath();_cv = l.cstylevalues["+this.id+"];"+
				this.l.cshapestyle[id]+this.l.calpha[id];*/
	},
		
	moveTo : function(x,y){
		// check our mode. if its 3 we need to cache it
		return "_c.moveTo("+x+","+y+");";
	},
	lineTo : function(x, y){
		this.h = 1;
		return "_c.lineTo("+x+","+y+");";
	},
	rect : function( x,y,w,h ){
		if(this.outx){
			x=(parseFloat(x)==x)?(parseFloat(x)-this.ox):"("+x+"-"+this.ox+")";
			w=(parseFloat(w)==w)?(parseFloat(w)+2*this.ox):"("+w+"+"+2*this.ox+")";
		}
		if(this.outy){
			y=(parseFloat(y)==y)?(parseFloat(y)-this.oy):"("+y+"-"+this.oy+")";
			h=(parseFloat(h)==h)?(parseFloat(h)+2*this.oy):"("+h+"+"+2*this.oy+")";
		}	
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
						    "_c.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");"+
							this.l.cstrokealpha[this.id]+
					   	   "_c.strokeRect(_x1,_y1,_x2,_y2);";
			case 2: return "_c.strokeRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
			case 1: return "_c.fillRect(_x1="+x+",_y1="+y+",_x2="+w+",_y2="+h+");";
		}
	},	
	close : function (){
		this.h = 0;
		switch(this.m){ 
			case 3: return this.l.cfillalpha[this.id]+
							"_c.fill();_c.closePath();"+
							this.l.cstrokealpha[this.id]+
							"_c.stroke();_c.beginPath();";
			case 2: return "_c.stroke();_c.beginPath();";
			case 1: return "_c.fill();_c.beginPath();";
		}	
	},
	endShape : function() {
		return (this.h?this.close():"");
	},
	
	text : jpf.draw.text,
	print : jpf.draw.print,
	$finalizeText : jpf.draw.$finalizeText
}


jpf.draw.vml = {
	// @Todo test resize init charting, z-index based on sequence

    init : function(o, scale){
		
		//o.vmlscale = scale || 4;
        jpf.importCssString(document, "v\\:* {behavior: url(#default#VML);}");
		
		o.oExt.onselectstart = function(){
			return false;
		}
		//o.vmlwidth   = o.oExt.offsetWidth * o.vmlscale;
		//o.vmlheight  = o.oExt.offsetHeight * o.vmlscale;
		
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
    	
    initLayer : function(l, v){ 

		var p = l.parentNode.vmlroot?l.parentNode:l.parentNode.parentNode;
        var vmlroot = p.vmlroot;
		
		var tag = "<div style='position:absolute;left:"+v.left+
				  ";top:"+v.top+";width:"+v.width+";height:"+v.height+
				  ";overflow:hidden;'/>";
		
		l.ds = 4;
		l.dw = parseFloat(v.width)*l.ds;
		l.dh = parseFloat(v.height)*l.ds;
		
		l.vmltag = "style='position:absolute;left:0;top:0;width:"+
				   (v.width)+";height:"+(v.height)+
		";overflow:hidden;' coordorigin='0,0' coordsize='"+(l.dw+1)+","+(l.dh+1)+"'";
        vmlroot.insertAdjacentHTML("beforeend", tag);
        var vmlgroup = vmlroot.lastChild;

		l._styles 	= [];
		l._htmljoin = [];
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
        this.l = l;this.tx = "",this.ty = "";this.last=null;
		return "var _t,_l,_dx,_dy,_tv,_tn,_tc,_lc,_s,_styles = this._styles;";
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
				if(style.isstyle){
					style._vmlnode = n;
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

	translate : function(x,y){
		if(x===undefined){
			this.tx="", this.ty="";
			return "";
		}
		this.tx = "+_dx",this.ty = "+_dy";
		return "_dx = parseInt("+x+"),_dy=parseInt("+y+");";
	},
	
	shape : function(style) {
		if(!style.active)return -1;
		var l=this.l, html = l._htmljoin, i, 
			shape=[], path=[], child=[], opacity="", s=[];

		s.push(this.$endDraw());
		
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
			// lets check the style object. what different values do we have?
			if(style.fill !== undefined){
				if(style.gradient !== undefined){
					child.push("<v:fill opacity='",style.fillalpha,"' o:opacity2='",
						style.gradalpha,"' color='"+style.fill+"' color2='",
					style.gradient,"' type='gradient' angle='",style.angle,"'/>");
				} else {
					child.push("<v:fill opacity='",style.fillalpha,
						"' color='",style.fill,"' type='fill'/>");
				}
				shape.push("fill='t'"),path.push("fillok='t'");
			} else {
				shape.push("fill='f'"),path.push("fillok='f'");
			}
			if(style.line !== undefined){	
				var w = style.weight,
					a =	w<1?(style.linealpha<w?style.linealpha:w):style.linealpha;
				child.push("<v:stroke opacity='",a,"' weight='",w,"' color='",
					style.line,"'/>");
			} else {
				shape.push("stroke='f'"), path.push("strokeok='f'");
			}
	        html.push(["<v:shape ",l.vmltag," path='' ",shape.join(' '),"><v:path ",
					path.join(' '),"/>",child.join(' '),"</v:shape>"].join(''));
		}  
		
		if(style._prev !== undefined){
			if(this.last !== style._prev)
				s.push("_p=(_s=_styles[",style._prev,"])._path;");
		}else	
			s.push("_p=(_s=_styles[",style._id,"])._path=[];");
		return s.join('');
	},
	
	// drawing command
	moveTo : function(x, y){
		return ["_p.push('m',parseInt(",x,")",this.tx,
			   ",' ',parseInt(",y+")",this.ty,",'l');\n"].join('');
	},
	lineTo : function(x, y){
		return ["_p.push(parseInt(",x,")",this.tx,
			   ",' ',parseInt("+y+")",this.ty,");\n"].join('');
	},
	hline : function(x,y,w){
		return ["_p.push('m',parseInt(",x,")",this.tx,
				",' ',parseInt(",y,")",this.ty,
				",'r',parseInt(",w,"),' 0');"].join('');
	},
	vline : function(x,y,h){
		return ["_p.push('m',parseInt(",x,")",this.tx,
				",' ',parseInt(",y,")",this.ty,
				",'r0 ',parseInt(",h,"));"].join('');
	},
	rect : function( x,y,w,h ){
	    //lets push out some optimal drawing paths
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
		return ["if((_t=parseInt(",w,"))>0)_p.push('m',parseInt(",x,
				")",this.tx,",' ',parseInt(",y,")",this.ty,
				",'r',_t,' 0r0 ',parseInt(",h,"),'r-'+_t,' 0x');"].join('');
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
			if(style.isfont) return "_s._txtcount = _tc;";
		}
		return "";
	},

	text : jpf.draw.text,
	print : jpf.draw.print,
	$finalizeText : jpf.draw.$finalizeText
}

//#endif