apf.drawctx = function(){
};

(function(drawctx){
	this.constructor = drawctx;

    this.node = function(){};
    
	(function(node){
		this.constructor = node;
		// code cache and expression parser 
		var pe = parse_expression||apf.lm.parseExpression, pf = parseFloat;
        var c = {}
        function parse_expression(x){
            // pull off outer {}
            x.slice(1,-1);
        }

		// style is 'incremental' replace of style params by dynamic or static values
		this.style = function(st){
			var t, m = 0, s = this.$isset||0, d = this.$isdyn||0;
			
			// please do NOT multiline this code, compact variable change bitmask/default/compile code
			if((t=st.sx||st['scale-x'])	   !=undefined && this.$sx!=((t==1||t==null)?(s=s&0xffffffe,t=1):(s=s|0x0000001,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000001,c[t]||(c[t]=pe(t))):(d=d&0xffffffe,pf(t)))))m=m|0x0000001,this.$sx=t;
			if((t=st.sy||st['scale-y'])	   !=undefined && this.$sy!=((t==1||t==null)?(s=s&0xffffffd,t=1):(s=s|0x0000002,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000002,c[t]||(c[t]=pe(t))):(d=d&0xffffffd,pf(t)))))m=m|0x0000002,this.$sy=t;
			if((t=st.ox||st['offset-x'])   !=undefined && this.$ox!=((t==0||t==null)?(s=s&0xffffffb,t=0):(s=s|0x0000004,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000004,c[t]||(c[t]=pe(t))):(d=d&0xffffffb,pf(t)))))m=m|0x0000004,this.$ox=t;
			if((t=st.oy||st['offset-y'])   !=undefined && this.$oy!=((t==0||t==null)?(s=s&0xffffff7,t=0):(s=s|0x0000008,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000008,c[t]||(c[t]=pe(t))):(d=d&0xffffff7,pf(t)))))m=m|0x0000008,this.$oy=t;
			if((t=st.cx||st['center-x'])   !=undefined && this.$cx!=((t==0||t==null)?(s=s&0xfffffef,t=0):(s=s|0x0000010,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000010,c[t]||(c[t]=pe(t))):(d=d&0xfffffef,pf(t)))))m=m|0x0000010,this.$cx=t;
			if((t=st.cy||st['center-y'])   !=undefined && this.$cy!=((t==0||t==null)?(s=s&0xfffffdf,t=0):(s=s|0x0000020,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000020,c[t]||(c[t]=pe(t))):(d=d&0xfffffdf,pf(t)))))m=m|0x0000020,this.$cy=t;
			if((t=st.x||st.left)           !=undefined && this.$x !=((t==1||t==null)?(s=s&0xfffffbf,t=1):(s=s|0x0000040,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000040,c[t]||(c[t]=pe(t))):(d=d&0xfffffbf,pf(t)))))m=m|0x0000040,this.$x=t;
			if((t=st.y||st.top)            !=undefined && this.$y !=((t==1||t==null)?(s=s&0xfffff7f,t=1):(s=s|0x0000080,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000080,c[t]||(c[t]=pe(t))):(d=d&0xfffff7f,pf(t)))))m=m|0x0000080,this.$y=t;
			if((t=st.w||st.width)          !=undefined && this.$w !=((t==0||t==null)?(s=s&0xffffeff,t=0):(s=s|0x0000100,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000100,c[t]||(c[t]=pe(t))):(d=d&0xffffeff,pf(t)))))m=m|0x0000100,this.$w=t;
			if((t=st.h||st.height)         !=undefined && this.$h !=((t==0||t==null)?(s=s&0xffffdff,t=0):(s=s|0x0000200,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000200,c[t]||(c[t]=pe(t))):(d=d&0xffffdff,pf(t)))))m=m|0x0000200,this.$h=t;
			if((t=st.vx||st['view-left'])  !=undefined && this.$vx!=((t==0||t==null)?(s=s&0xffffbff,t=0):(s=s|0x0000400,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000400,c[t]||(c[t]=pe(t))):(d=d&0xffffbff,pf(t)))))m=m|0x0000400,this.$vx=t;
			if((t=st.vy||st['view-top'])   !=undefined && this.$vy!=((t==0||t==null)?(s=s&0xffff7ff,t=0):(s=s|0x0000800,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000800,c[t]||(c[t]=pe(t))):(d=d&0xffff7ff,pf(t)))))m=m|0x0000800,this.$vy=t;
			if((t=st.vw||st['view-width']) !=undefined && this.$vw!=(      (t==null)?(s=s&0xfffefff,t=100):(s=s|0x0001000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0001000,c[t]||(c[t]=pe(t))):(d=d&0xfffefff,pf(t)))))m=m|0x0001000,this.$vw=t;
			if((t=st.vh||st['view-height'])!=undefined && this.$vh!=(      (t==null)?(s=s&0xfffdfff,t=100):(s=s|0x0002000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0002000,c[t]||(c[t]=pe(t))):(d=d&0xfffdfff,pf(t)))))m=m|0x0002000,this.$vh=t;
			if((t=st.r||st.rotation)       !=undefined && this.$r !=((t==0||t==null)?(s=s&0xfffbfff,t=0):(s=s|0x0004000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0004000,c[t]||(c[t]=pe(t))):(d=d&0xfffbfff,pf(t)))))m=m|0x0004000,this.$r=t;
            
			this.$f = st.$f;
			this.$p = st.p;
            this.style_pos(m,s,d);
			this.$isdyn = d, this.$isset = s;
        }
        
		this.animate = function(a, b, i, v){
			// animate the style with tween expression and value expression
			// generates something that will be stuffed into style()
			// {t*0 + (1-t)*10}
		};
	}).call(this.node.prototype, this.node);
    
}).call(apf.drawctx.prototype, apf.drawctx);
 
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
	this.root = new this.group_node(this,{x:0,y:0,w:w,h:h});
};

(function(drawctx_vml){
	this.constructor = drawctx_vml;

	this.repaint = function(){
		this.root.repaint();
	};

	//-----------------------------------------------------------------------
	// Node baseclass
	//------------------------------------------------------------------------
    this.node_vml = function(){};
    
	(function(node_vml){
		this.constructor = node_vml;
		var c = {};
        this.setPos = 
		this.pos_immediate = function(x,y,w,h){
			var v = this.$vml_node || this.$vml_void;;
			if(this.$_x != x) v.style.left = this.$_x = x;
			if(this.$_t != y) v.style.top = this.$_y = y;
			if(this.$_w != w) v.style.width = this.$_w = w;
			if(this.$_h != h) v.style.height = this.$_h = h;
		};

		this.pos_defer = function(x,y,w,h){
			this.$_x = x;
			this.$_y = y;
			this.$_w = w;
			this.$_h = h;
		};

		this.$c_xyhw = ""; // codeblocks for dynamic code
		this.$c_trans= "";
		this.$c_vxy= "";
		this.$c_vwh= "";
		this.$c_r= "";		
		this.$_x = 0; // default calculated values for vml node gen
		this.$_y = 0;
		this.$_w = 1;
		this.$_h = 1;
		this.$_vxy = '0 0';
		this.$_vwh = '100 100';
		this.$_r  = 0;
        this.$vml_void = {style:{}};

        // do the position part of the styling
        this.style_pos = function(m,s,d){
            var v = this.$vml_node || this.$vml_void
			// now generate/set variables based on modify masks
			if( m&0x000003f ){ // any of our transform values modified?
				if(((s^this.$isset)|((d|this.$isdyn)&m))&0x000003f){ // refresh only if isset changed or any of our dynamics have changed
					if(s&0x000003f){// any of our transform values set?
						this.$c_trans = 
								["var _t",(s&0x0000001?",_sx":""),(s&0x0000002?",_sy":""),";\n",
								"if( (_t=",((s&0x0000011)==0x11?"x*(_sx="+(d&0x0000001?this.$sx:"this.$sx")+")+(1-_sx)*(x+("+(d&0x0000010?this.$cx:"this.$cx")+")*w)":"x"),(s&0x0000004?"+("+(d&0x0000004?this.$cx:"this.$ox")+")":""),") != this.$_x )v.style.left = this.$_x = _t;\n",
								"if( (_t=",((s&0x0000022)==0x22?"y*(_sy="+(d&0x0000002?this.$sy:"this.$sy")+")+(1-_sy)*(y+("+(d&0x0000020?this.$cy:"this.$cy")+")*h)":"y"),(s&0x0000008?"+("+(d&0x0000008?this.$cx:"this.$oy")+")":""),") != this.$_y )v.style.top = this.$_y = _t;\n",
								"if( (_t=",(s&0x0000001?(s&0x0000010?"w*_sx":"w*("+(d&0x0000001?this.$sx:"this.$sx")+")"):"w"),") != this.$_w )v.style.width = this.$_w = _t;\n",
								"if( (_t=",(s&0x0000002?(s&0x0000020?"h*_sy":"h*("+(d&0x0000002?this.$sy:"this.$sy")+")"):"h"),") != this.$_h )v.style.height = this.$_h = _t;\n"].join('');
						if(!d&0x000003f){ // none of the transform props or are dynamic
							// create a setPos function with immediate set
							var code = "var v = this.$vml_node || this.$vml_void;\n"+this.$c_trans;
							apf.logw(code);
							
							this.setPos = c[code] || (c[code] = new Function("x","y","h","w",code));
						} else this.setPos = this.pos_defer; 
					} else this.setPos = this.pos_immediate;
				}
			}
			if(m&0x0000c00)this.$c_vxy = (d&0x0000c00)?"if((_t=("+this.$vx+")+' '+("+this.$vy+"))!=this.$_vxy)v.coordorigin = this.$_vxy = _t;\n":(v.coordorigin=this.$_vxy = this.$vx+' '+this.$vy, "");
			if(m&0x0003000)this.$c_xwh = (d&0x0003000)?"if((_t=("+this.$vw+")+' '+("+this.$vh+"))!=this.$_vwh)v.coordsize = this.$_vwh = _t;\n":(v.coordsize=this.$_vwh = this.$vw+' '+this.$vh, "");
			if(m&0x0004000)this.$c_r = (d&0x0004000)?"if((_t=("+this.$r+"))!=this.$_r)v.rotate = this.$_r = _t%360;\n":(v.rotation = this.$_r = this.$r%360,"");
			if(m&0x00003ff)this.$c_xyhw = (d&0x00003c0)?"var x = "+(d&0x0000040?"("+this.$x+")":"this.$_x")+", y = "+(d&0x0000080?"("+this.$y+")":"this.$_y")+
											   ", w = "+(d&0x0000100?"("+this.$h+")":"this.$_h")+", h = "+(d&0x0000200?"("+this.$w+")":"this.$_w")+";\n":
											(this.setPos(this.$x,this.$y,this.$h,this.$w),"var x = this.$_x, y = this.$_y, w = this.$_w, h = this.$_h;\n");
		
			// generate repaint function
			// TODO: add dynamic style and dynamic path
			if(d&m){
				// lets generate repaint cause we have modified dynamics
				var code = "var v = this.$vml_node || this.$vml_void;\n"+
						   this.$c_xyhw+
						   this.$c_trans+
						   this.$c_vxy+
						   this.$c_vwh+
						   this.$c_r;
				this.repaint = c[code] || (c[code] = new Function(code));
				// store ourselves in the parent repaint cycle
			}else if(this.$isdyn){ // we used to be dynamic
				this.repaint = null;// set repaint to nothing, and remove from parent repaint queue
			}
		};
	}).call(this.node_vml.prototype = new this.node, this.node_vml);

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
		
        if(style) this.style(style);
        
		this.$parent	    = parent;
		this.$children	    = [];
		this.$repainter		= [];
		this.$vml_node      = null;
		this.$child_new     = [];
	};

	(function(group_node){
		this.constructor = group_node;
        
		this.repaint = function(){
			if(!this.$vml_node){ // init the root node
				if(this.$parent) return false; // faulty setup
				var r = this.$ctx.$vml_root;
				r.insertAdjacentHTML("beforeend", this.toString());
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
        
		this.toString = function(){
			// join all our children in a string
			this.$to_string_inited = true;
			this.$child_new.length = 0;
			return "<av:group coordorigin='0 0' coordsize='400 300' style='margin:0;padding:0;display:block;width:400px;height:300px;' >"+
					this.$children.join('') + 
					 "</av:group>";
		}        
	}).call(this.group_node.prototype = new this.node_vml, this.group_node);
	//------------------------------------------------------------------------
	// Rect constructor
	//------------------------------------------------------------------------
	this.rect = function(x, y, w, h, s, parent){
		if(!s) s = {};
		s.x = x, s.y = y, s.w = w, s.h = h,
		s.vx = 0, s.vy = 0, s.vw = 100, s.vh = 100;
		s.p = "m0 0l100 0 100 10 10 20 30 100 0 100 0 50 10 20 30 40 10 20 30 50x";
		// check if we want a new packed or unpacked shape. we cannot change packed to unpacked 
		var t = new this.shape_node(s, parent || this.root);
		return t;
	};

	//------------------------------------------------------------------------
	// Generic shape
	//------------------------------------------------------------------------

	this.shape_node = function(s, parent){
		this.$parent = parent;
		// set style 
		this.style( s );
		this.$idx = parent.$children.push( this );
		parent.$child_new.push(this);
	};
	
	(function(shape_node){
		this.constructor = shape_node;
		
		this.toString = function(){
			if(this.$vml_node) return "[object]";
			return ["<av:shape coordorigin='",
					this.$_vxy,"' coordsize='",this.$_vwh,"' style='rotation:",this.$_r,
					";left:",this.$_x,";top:",this.$_y,";width:",this.$_w,";height:",this.$_h,
					";' fill='t' stroke='t'>",
					"<av:fill color='"+this.$f+"' opacity='0.5'/>", // gradient fill is of course different
					"<av:stroke color='blue' weight='1'/>",/*
					(this.$fill?"<av:fill color='"+this.$fill+"'/>":""), // gradient fill is of course different
					(this.$stroke?"<av:stroke color='"+this.$stroke+"'/>":""),*/
					"<av:path v='",this.$p,"'/></av:shape>"].join('');
			//apf.logw(t);
		};
	}).call(this.shape_node.prototype = new this.node_vml, this.shape_node);
}).call(apf.drawctx_vml.prototype = new apf.drawctx, apf.drawctx_vml);

function draw(){
	var ctx = new apf.drawctx_vml('drawnode',800,600,0,0,'white');

	var r=[];
	apf.profile_loop(1,function(){
		for(var i = 0;i<40;i++)
			r[i] = ctx.rect(10,10,60,60,{p:1,f:'{anim(t,"red","green","blue"}',cx:0.5,cy:0.5,r:"{t}"});
		ctx.repaint();
	});
	var x = 0;
	window.setInterval(function(){
		for(i = 0;i<40;i++){
			var y = x+33*(i+1), z= x+45*(i+1);
			r[i].style({r:2*y,x:y%400,y:y%300,sx2:0.5*Math.sin(0.1*y)+0.5,sy2:0.5*Math.sin(0.1*y)+0.5,ox:10});
		}
		x +=1;
	},20);
	
	/*
	style = {
		// pack or not pack
		pack:
		// the main shape container is placed by the API, now we can do different shape-styling easily
		// this means setting the vml node pos
		x
		y		w
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
		f 	fill
		fo	fill-opacity
		s	stroke
		so	stroke-opacity
		sw	stroke-weight
		a	anim
		
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
