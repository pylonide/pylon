apf.drawctx_vml = function(dom_parent,w,h,x,y,color){
	if( typeof(dom_parent) == 'string' )
		dom_parent = document.getElementById(dom_parent);
	this.$dom_parent = dom_parent || document.body;

	var pos = "left:"+x+"px;top:"+y+"px;width:"+w+"px;height:"+h+"px;";
	var css = "av\\:fill {behavior: url(#default#VML);} av\\:stroke {behavior: url(#default#VML);} av\\:shape {behavior: url(#default#VML);} av\\:group {behavior: url(#default#VML);} av\\:path {behavior: url(#default#VML);}"
	var img = "<img class='apfdrawSS' src='images/spacer.gif' style='z-index:10000;position:absolute;background:url(images/spacer.gif);"+pos+"'/>";
	var ns = "<xml:namespace ns='urn:schemas-microsoft-com:vml' prefix='av'/> ";
	if(color)color = "background-color:"+color+";";
	else color = "background:transparent;";
	
	if(!apf.isIE8){
		apf.importCssString(css);
		this.$dom_parent.innerHTML += img +
			"<div class='apfdrawClipper' style='margin:0;padding:0;position2:absolute;display:inline-block;"+color+
				pos+"overflow:hidden;'>"+ns+
			"</div>";
 		this.$vml_root = this.$dom_parent.lastChild;
		this.$vml_ss	  = this.$vml_root.previousSibling;
    } else {
		this.$dom_parent.innerHTML += img +
			"<iframe style='margin:0;padding:0;border:0px;overflow:hidden;"+color+
				"position2:absolute;display:inline-block;"+pos+"'>"+
			"</iframe>";
		this.$vml_iframe = this.$dom_parent.lastChild;
		this.$vml_iframe.allowTransparency = true;
		var doc = r.$vml_iframe.contentWindow.document;
		doc.open();
		doc.writeln("<head><meta http-equiv='X-UA-Compatible' content='IE=EmulateIE7'/></head><style>"+
					css+"</style><html><body style='margin:0;padding:0;border:0px;background:transparent;'>\
					<div style='position:absolute;display:inline-block;'></div></body></html>");
		doc.close();
		this.$vml_root = doc.body.firstChild;
	}	
	this.root = new this.group_node(this);
};

(function(drawctx_vml){
	this.constructor = drawctx_vml;

	this.repaint = function(){
		this.root.repaint();
	};
	
	//-----------------------------------------------------------------------
	// Group
	//------------------------------------------------------------------------
	this.group = function(parent,style){
		return new this.group_node(parent,style);
	};
	
	this.group_node = function(parent, style){ 
		if(parent instanceof apf.drawctx_vml)
			this.$ctx = parent, parent = null;
		else
			this.$ctx = parent.$ctx;
			
		this.$parent	    = parent;
		this.$children	    = [];
		this.$repainter		= [];
		this.$style 	    = style;
		this.$vml_node      = null;
		this.$child_new     = [];
	};

	(function(group_node){
		this.constructor = group_node;
		
		this.toString = function(){
			// join all our children in a string
			this.$to_string_inited = true;
			this.$child_new.length = 0;
			return "<av:group coordorigin='0 0' coordsize='400 300' style='display:block;border:1px solid red;width:400px;height:300px;' >"+
					this.$children.join('') + 
					 "</av:group>";
		},
		
		this.repaint = function(){
			if(!this.$vml_node){ // init the root node
				if(this.$parent) return false; // faulty setup
				var r = this.$ctx.$vml_root;
				r.innerHTML = this.toString();
				this.$vml_node = r.firstChild;
			}
			var d,i,j,k,l; 
			if(this.$to_string_inited) { // our parent created our children
				// update our vmlnode refs
				for(k = this.$children,d = this.$vml_node.childNodes,l=d.length,i=0;i<l;i++)
					k[i].$vml_node = d[i];
			} else {
				// dynamically update childranges
				if ((l = (d = this.$child_new).length)>1){
					for(i=0; i<l; i++){
						for(k = d[i].$idx, j = i+1; j<l && d[j].$idx == ++k; j++){}
						// lets join our range into a string for insertion into our DOM tree
						(i==0&&j==l)?d.join(''):d.slice(i,j-1).join('');
						// lets insert this stuff into our vmlnode
						if(i==0){ // insert child
							
						} else { // insert after
							d[i].$idx
						}
					}
					d.length = 0;
				}
			}
			// lets call our repaint list
			for( i=0, l=(d=this.$repainter).length;i<l;i++ )
				d[i].repaint();
		}
	}).call(this.group_node.prototype, this.group_node);

	//------------------------------------------------------------------------
	// Rect constructor
	//------------------------------------------------------------------------
	this.rect = function(x, y, w, h, s, parent){
		if(!s) s = {};
		s.x = x, s.y = y, s.w = w, s.h = h,
		s.vx = 0, s.vy = 0, s.vw = 100, s.vh = 100;
		s.path = "m0 0l100 0 100 100 0 100 0 0e";
		// check if we want a new packed or unpacked shape. we cannot change packed to unpacked 
		var t = new this.shape_node(s, parent || this.root);
		return t;
	};

	//------------------------------------------------------------------------
	// Generic shape
	//------------------------------------------------------------------------

	this.shape_node = function(s, parent){
		this.$parent = parent;
		// set style, store dynamic ones in sd
		this.style( s, 1 );
		this.$idx = parent.$children.push( this );
		parent.$child_new.push(this);
	};
	
	(function(shape_node){
		this.constructor = shape_node;
		// code cache and expression parser 
		var c = {}, pe = apf.lm.parseExpression, pf = parseFloat;
		
		this.pos_immediate = function(x,y,w,h){
			var v = this.$vml_node || this.$vml_void;;
			if(this.$_x != x) v.style.left = this.$_x = x;
			if(this.$_t != y) v.style.top = this.$_y = y;
			if(this.$_w != w) v.style.width = this.$_w = w;
			if(this.$_h != h) v.style.height = this.$_h = h;
		}

		this.pos_defer = function(x,y,w,h){
			this.$_x = x;
			this.$_y = y;
			this.$_w = w;
			this.$_h = h;
		}
		
		// style is 'incremental' replace of style params by dynamic or static values
		this.style = function(s, init){
			var t, m = 0, s = this.$isset||0, d = this.$isdyn||0, v = this.$vml_node || this.$vml_void;
			
			// please do NOT multiline this code.
			if((t=s.sx)!=undefined && this.$sx!=(t==1||t==null)?(s=s&0xffffffe,t=1):(s=s|0x0000001,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000001,c[t]||c[t]=pe(t)):(d=d&0xffffffe,pf(t))))m=m|0x0000001,this.$sx=t;
			if((t=s.sy)!=undefined && this.$sy!=(t==1||t==null)?(s=s&0xffffffd,t=1):(s=s|0x0000002,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000002,c[t]||c[t]=pe(t)):(d=d&0xffffffd,pf(t))))m=m|0x0000002,this.$sy=t;
			if((t=s.ox)!=undefined && this.$ox!=(t==0||t==null)?(s=s&0xffffffb,t=0):(s=s|0x0000004,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000004,c[t]||c[t]=pe(t)):(d=d&0xffffffb,pf(t))))m=m|0x0000004,this.$ox=t;
			if((t=s.oy)!=undefined && this.$oy!=(t==0||t==null)?(s=s&0xffffff7,t=0):(s=s|0x0000008,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000008,c[t]||c[t]=pe(t)):(d=d&0xffffff7,pf(t))))m=m|0x0000008,this.$oy=t;
			if((t=s.cx)!=undefined && this.$cx!=(t==0||t==null)?(s=s&0xfffffef,t=0):(s=s|0x0000010,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000010,c[t]||c[t]=pe(t)):(d=d&0xfffffef,pf(t))))m=m|0x0000010,this.$cx=t;
			if((t=s.cy)!=undefined && this.$cy!=(t==0||t==null)?(s=s&0xfffffdf,t=0):(s=s|0x0000020,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000020,c[t]||c[t]=pe(t)):(d=d&0xfffffdf,pf(t))))m=m|0x0000020,this.$cy=t;
			// fetch xyhw
			if((t=s.x) !=undefined && this.$x !=(t==1||t==null)?(s=s&0xfffffbf,t=1):(s=s|0x0000040,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000040,c[t]||c[t]=pe(t)):(d=d&0xfffffbf,pf(t))))m=m|0x0000040,this.$x=t;
			if((t=s.y) !=undefined && this.$y !=(t==1||t==null)?(s=s&0xfffff7f,t=1):(s=s|0x0000080,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000080,c[t]||c[t]=pe(t)):(d=d&0xfffff7f,pf(t))))m=m|0x0000080,this.$y=t;
			if((t=s.h) !=undefined && this.$h !=(t==0||t==null)?(s=s&0xffffeff,t=0):(s=s|0x0000100,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000100,c[t]||c[t]=pe(t)):(d=d&0xffffeff,pf(t))))m=m|0x0000100,this.$w=t;
			if((t=s.w) !=undefined && this.$w !=(t==0||t==null)?(s=s&0xffffdff,t=0):(s=s|0x0000200,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000200,c[t]||c[t]=pe(t)):(d=d&0xffffdff,pf(t))))m=m|0x0000200,this.$h=t;
			if((t=s.vx)!=undefined && this.$vx!=(t==1||t==null)?(s=s&0xffffbff,t=1):(s=s|0x0000400,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000400,c[t]||c[t]=pe(t)):(d=d&0xffffbff,pf(t))))m=m|0x0000400,this.$vx=t;
			if((t=s.vy)!=undefined && this.$vy!=(t==1||t==null)?(s=s&0xffff7ff,t=1):(s=s|0x0000800,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000800,c[t]||c[t]=pe(t)):(d=d&0xffff7ff,pf(t))))m=m|0x0000800,this.$vy=t;
			if((t=s.vh)!=undefined && this.$vh!=(t==0||t==null)?(s=s&0xfffefff,t=0):(s=s|0x0001000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0001000,c[t]||c[t]=pe(t)):(d=d&0xfffefff,pf(t))))m=m|0x0001000,this.$vw=t;
			if((t=s.vw)!=undefined && this.$vw!=(t==0||t==null)?(s=s&0xfffdfff,t=0):(s=s|0x0002000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0002000,c[t]||c[t]=pe(t)):(d=d&0xfffdfff,pf(t))))m=m|0x0002000,this.$vh=t;
			if((t=s.r) !=undefined && this.$r !=(t==0||t==null)?(s=s&0xfffbfff,t=0):(s=s|0x0004000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0004000,c[t]||c[t]=pe(t)):(d=d&0xfffbfff,pf(t))))m=m|0x0004000,this.$r=t;

			if( m&0x000003f ){ // any of our transform values modified?
				if(s&0x000003f){// any of our transform values set?
					// generate transform code
					this.$tx = s&0x0000001?("x*(_sx="+this.$sx+")+(1-_sx)*(x+"+(s&0x0000010?"("+this.$cx+")*w)")):"x")+(s&0x0000004?+"("+this.$ox+")":""),
					this.$ty = s&0x0000002?("y*(_sy="+this.$sy+")+(1-_sy)*(y+"+(s&0x0000020?"("+this.$cy+")*h)")):"y")+(s&0x0000008?+"("+this.$oy+")":""),
					this.$tw = s&0x0000001?("w*_sx"):"w",
					this.$th = s&0x0000002?("h*_sy"):"h";
					
					if(!d&0x000003f){ // none of the transform props are dynamic
						// create a setPos function with immediate set
						this.setPos = c[t = ix+iy+iw+ih] || 
						   (setpos_cache[t] = new Function("x","y","h","w",
						"var _sx,_sy,_t,v = this.$vml_node || this.$vml_void;\n"+
						"if( (_t="+this.$tx+") != this.$_x )v.style.left = this.$_x = _t;"+
						"if( (_t="+this.$ty+") != this.$_y )v.style.top = this.$_y = _t;"+
						"if( (_t="+this.$tw+") != this.$_w )v.style.width = this.$_w = _t;"+
						"if( (_t="+this.$th+") != this.$_h )v.style.height = this.$_h = _t;"));
					} else this.setPos = this.pos_defer; // real pos will be set in repaint()
				} else this.setPos = this.pos_immediate;
				// if we have nondynamic xyhw we should set the position
			} 
			
			if(m&0x0000c00 && !d&0x0000c00) // we have vx/vy modified and are not dynamic
				v.coordorigin = this.$vx+' '+this.vy;
			if(m&0x0003000 && !d&0x0003000) // we have vw/vh modified and are not dynamic
				v.coordsize = this.$vw+' '+this.vh;
			
			if(m&0x03ff && !d&0x03c0) // any of transform-impacting things modified, and xyhw is nondynamic
				this.setPos(this.$x,this.$y,this.$h,this.$w);
			
			// alllright so now we have set, dynamic AND modified! joy be the slowness.
			// so what do we do now with the repaint code-gen?
			// and what do we do with 'default' values for dynamic stuff? we keep a this.$_x around?
			
			// if xyhw is not dynamic (bitmask) we call setPos now.
			if(sn&0x3c0 && (dn|dp)&0x03c0){ // we shouldjj
				this.setPos(this.$x,this.$y,this.$w,this.$h);
			}else if(d){ // we have some dynamic shizzlecadizzle, and our code changed so we need to regenerate it
				// lets generate some code for redraw.
				// what would this look like hmm?
				function repaint(){
					var _sx,_sy,_t,v = this.$vml_node;
					
				}
				
			}
			
			// lets do vx vy vw vh and rotate props if they are code they go in repaint, else inline assign if not init.
					
			
			// fetch/calc style stuff (only if we are a shape)
			
			
			// see if we have a dynamic or static path
			
			
			
			if(c && !d)
				this.setPos(x,y,h,w);
			else if(d){
				// dynamic expressions. we need to generate a block of code for our repaint function
				
			}
			this.$isset = s, this.$isdyn = d;
			
			if(vx!=undefined && (vx != this.$vx || vy != this.$vy)) v.coordorigin = (this.$vx = vx)+' '+(this.$vy=vy), cg[4]= null;
			if(vw!=undefined && (vw != this.$vw || vh != this.$vh)) v.coordsize = (this.$vw = vw)+' '+(this.$vh=vh), cg[5] = null;
			if(rotation!=undefined && rotation != this.$rotation) v.style.rotation = this.$rotation = rotation, cg[6] = null;
		}
		this.$vml_void = {style:{}},
		
		this.animate = function(a, b, i, v){
			// animate the style with tween expression and value expression
			// generates something that will be stuffed into style()
		},
		
		this.toString = function(){
			// return our VML string
			if(this.$vml_node) return "[object]";
			return "<av:shape "+coordorigin='"+
					this.$vx+" "+this.$vy+"' coordsize='"+
					this.$vw+" "+this.$vw+"' style='"+
					this.$rotation+";left:"+this.$_x+";top"+
					this.$_y+";width:"+this.$_w+";height:"+this.$_h+";' fill='t' stroke='t'>"+
					(this.$fill?"<av:fill color='"+this.$fill+"'/>":"")+ // gradient fill is of course different
					(this.$stroke?"<av:stroke color='"+this.$stroke+"'/>"+"")+
					"<av:path v='"+this.$path+"'
					"</av:shape>";
		};
	}).call(this.shape_node.prototype, this.shape_node);
}).call(apf.drawctx_vml.prototype, apf.drawctx_vml);

function draw(){
	var ctx = new apf.drawctx_vml('drawnode',400,300,0,0,'white');

	var r = ctx.rect(10,10,10,10,{fill:'red',ox:'{sin(t)}']});
	
	ctx.repaint();
	var x = 0;
	window.setInterval(function(){
		x+=1;
		r.$vml_node.style.rotation = x%360;
	},10);
	
	/*
	style = {
		// pack or not pack
		pack:
		// the main shape container is placed by the API, now we can do different shape-styling easily
		// this means setting the vml node pos
		x
		y
		w
		h
		
		sx 
		sy
		ox
		oy
		cx
		cy
		
		r
		
		// modify the viewport through various properties
		vx 		0
		vy		0
		vw		parent.width
		vh		parent.height
		
		// shape can be param skinned for interp
		path:
		
		// styling
		fill
		fill-opacity
		stroke
		stroke-width
		stroke-opacity
	}
	*/
	// what objects do we have?
	// image 
	// text 
	// rect
	// circle (and parts)
	// ellipse 
 	// path
}
