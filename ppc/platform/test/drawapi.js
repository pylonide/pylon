apf.drawctx = function(){
};

(function(drawctx){
	this.constructor = drawctx;

    this.node = function(){};
    
	(function(node){
		this.constructor = node;
		// code cache and expression parser 
		var pe = parse_expression||apf.lm.parseExpression, pf = parseFloat, c = {}
        
        function parse_expression(x){
            x.slice(1,-1);
        }
		
		var dbglut = [
			'sx','sy','ox','oy','cx','cy',
			'x','y','w','h','vx','vy','vw','vh','r',
            'f','s','o','fo','so','sw'
		];
		this.dbgstr = function(s){
			for(var a = s.split(' '),m = 0, i = 0;i<a.length;i++)for(j = 0;j<dbglut.length;j++)
				if(dbglut[j] == a[i]){m = m|(1<<j);break;}
			return m.toString(16);
		}
		this.dbgmsk = function(n){
			var s= '', values = [
				this.$sx,this.$sy,this.$ox,this.$oy,this.$cx,this.$cx,
				this.$x,this.$y,this.$w,this.$h,this.$vx,this.$vy,this.$vw,this.$vh,this.$r,
                this.$f,this.$s,this.$o,this.$fo,this.$so,this.$sw
			];
			for(var x =1, i=0;i<31;i++,x=x<<1)
				if(n&x) s+= (s?'   ':'')+dbglut[i]+'=('+values[i]+')';
			return s;
		}
        
        var style_short = {
            'scale-x':'sx','scale-width':'sx','scalex':'sx','scalewidth':'sx',
            'scale-y':'sy','scale-height':'sy','scaley':'sy','scaleheight':'sy',
            'offset-x':'ox','offset-left':'ox', 'offsetx':'ox','offsetleft':'ox',
            'offset-y':'oy','offset-top':'oy','offsety':'oy','offsettop':'oy',
            'center-x':'cx','center-left':'cx', 'centerx':'cx','centerleft':'cx',
            'center-y':'cy','center-top':'cy','centery':'cy', 'centertop':'cy',
            'left':'x', 'top':'y', 'width':'w','height':'h',
            'view-x':'vx','view-left':'vx','viewx':'vx','viewleft':'vx',
            'view-y':'vy','view-top':'vy','viewy':'vy','viewtop':'vy',
            'view-w':'vw','view-width':'vw','vieww':'vw','viewwidth':'vw',
            'view-h':'vh','view-height':'vh','viewh':'vh','viewheight':'vh',
            'rot':'r','rotate':'r','rotation':'r',
            'color':'f','fill':'f','fill-color':'f','fillcolor':'f',
            'stroke':'s','stroke-color':'s','strokecolor':'s',
            'alpha':'o','transparency':'o','opacity':'o',
            'fill-alpha':'fo','fill-transparency':'fo','fill-opacity':'fo',
            'fillalpha':'fo','filltransparency':'fo','fillopacity':'fo',
            'stroke-alpha':'fo','stroke-transparency':'fo','stroke-opacity':'so',
            'strokealpha':'fo','stroketransparency':'fo','strokeopacity':'so',
            'stroke-width':'sw','stroke-weight':'sw',
            'path':'p','curve':'p','points':'p'
        };
        
		// style is 'incremental' replace of style params by dynamic or static values
		this.style = function(st){
			var t, m = 0, s = this.$isset||0, d = this.$isdyn||0;
            // find long-hand styles
			for(p in st)if(p.length>2 && (t=style_short[p])){if(t in st)alert("warning style overwrite "+t+" with "+p);st[t]=st[p];}
            
			if((t=st.sx)!=undefined && this.$sx!=((t==1||t==null)?(s=s&0xffffffe,t=1):   (s=s|0x0000001,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000001,c[t]||(c[t]=pe(t))):(d=d&0xffffffe,pf(t)))))m=m|0x0000001,this.$sx=t;
			if((t=st.sy)!=undefined && this.$sy!=((t==1||t==null)?(s=s&0xffffffd,t=1):   (s=s|0x0000002,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000002,c[t]||(c[t]=pe(t))):(d=d&0xffffffd,pf(t)))))m=m|0x0000002,this.$sy=t;
			if((t=st.ox)!=undefined && this.$ox!=((t==0||t==null)?(s=s&0xffffffb,t=0):   (s=s|0x0000004,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000004,c[t]||(c[t]=pe(t))):(d=d&0xffffffb,pf(t)))))m=m|0x0000004,this.$ox=t;
			if((t=st.oy)!=undefined && this.$oy!=((t==0||t==null)?(s=s&0xffffff7,t=0):   (s=s|0x0000008,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000008,c[t]||(c[t]=pe(t))):(d=d&0xffffff7,pf(t)))))m=m|0x0000008,this.$oy=t;
			if((t=st.cx)!=undefined && this.$cx!=((t==0||t==null)?(s=s&0xfffffef,t=0):   (s=s|0x0000010,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000010,c[t]||(c[t]=pe(t))):(d=d&0xfffffef,pf(t)))))m=m|0x0000010,this.$cx=t;
			if((t=st.cy)!=undefined && this.$cy!=((t==0||t==null)?(s=s&0xfffffdf,t=0):   (s=s|0x0000020,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000020,c[t]||(c[t]=pe(t))):(d=d&0xfffffdf,pf(t)))))m=m|0x0000020,this.$cy=t;
			if((t=st.x)!=undefined  && this.$x !=((t==0||t==null)?(s=s&0xfffffbf,t=0):   (s=s|0x0000040,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000040,c[t]||(c[t]=pe(t))):(d=d&0xfffffbf,pf(t)))))m=m|0x0000040,this.$x=t;
			if((t=st.y)!=undefined  && this.$y !=((t==0||t==null)?(s=s&0xfffff7f,t=0):   (s=s|0x0000080,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000080,c[t]||(c[t]=pe(t))):(d=d&0xfffff7f,pf(t)))))m=m|0x0000080,this.$y=t;
			if((t=st.w)!=undefined  && this.$w !=((t==0||t==null)?(s=s&0xffffeff,t=0):   (s=s|0x0000100,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000100,c[t]||(c[t]=pe(t))):(d=d&0xffffeff,pf(t)))))m=m|0x0000100,this.$w=t;
			if((t=st.h)!=undefined  && this.$h !=((t==0||t==null)?(s=s&0xffffdff,t=0):   (s=s|0x0000200,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000200,c[t]||(c[t]=pe(t))):(d=d&0xffffdff,pf(t)))))m=m|0x0000200,this.$h=t;
			if((t=st.vx)!=undefined && this.$vx!=((t==0||t==null)?(s=s&0xffffbff,t=0):   (s=s|0x0000400,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000400,c[t]||(c[t]=pe(t))):(d=d&0xffffbff,pf(t)))))m=m|0x0000400,this.$vx=t;
			if((t=st.vy)!=undefined && this.$vy!=((t==0||t==null)?(s=s&0xffff7ff,t=0):   (s=s|0x0000800,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0000800,c[t]||(c[t]=pe(t))):(d=d&0xffff7ff,pf(t)))))m=m|0x0000800,this.$vy=t;
			if((t=st.vw)!=undefined && this.$vw!=((t==null)?      (s=s&0xfffefff,t=100): (s=s|0x0001000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0001000,c[t]||(c[t]=pe(t))):(d=d&0xfffefff,pf(t)))))m=m|0x0001000,this.$vw=t;
			if((t=st.vh)!=undefined && this.$vh!=((t==null)?      (s=s&0xfffdfff,t=100): (s=s|0x0002000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0002000,c[t]||(c[t]=pe(t))):(d=d&0xfffdfff,pf(t)))))m=m|0x0002000,this.$vh=t;
			if((t=st.r)!=undefined  && this.$r !=((t==0||t==null)?(s=s&0xfffbfff,t=0):   (s=s|0x0004000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0004000,c[t]||(c[t]=pe(t))):(d=d&0xfffbfff,pf(t)))))m=m|0x0004000,this.$r=t;
			if((t=st.f)!=undefined  && this.$f !=((t==null)?      (s=s&0xfff7fff,t=null):(s=s|0x0008000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0008000,c[t]||(c[t]=pe(t))):(d=d&0xfff7fff,t    ))))m=m|0x0008000,this.$f=t;
			if((t=st.s)!=undefined  && this.$s !=((t==null)?      (s=s&0xffeffff,t=null):(s=s|0x0010000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0010000,c[t]||(c[t]=pe(t))):(d=d&0xffeffff,t    ))))m=m|0x0010000,this.$s=t;
			if((t=st.o)!=undefined  && this.$o !=((t==null)?       (s=s&0xffdffff,t=1):   (s=s|0x0020000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0020000,c[t]||(c[t]=pe(t))):(d=d&0xffdffff,pf(t)))))m=m|0x0020000,this.$o=t;
			if((t=st.fo)!=undefined && this.$fo!=((t==null)?       (s=s&0xffbffff,t=1):   (s=s|0x0040000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0040000,c[t]||(c[t]=pe(t))):(d=d&0xffbffff,pf(t)))))m=m|0x0040000,this.$fo=t;
			if((t=st.so)!=undefined && this.$so!=((t==null)?       (s=s&0xff7ffff,t=1):   (s=s|0x0080000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0080000,c[t]||(c[t]=pe(t))):(d=d&0xff7ffff,pf(t)))))m=m|0x0080000,this.$so=t;
			if((t=st.sw)!=undefined && this.$sw!=((t==1||t==null)?(s=s&0xfefffff,t=1):   (s=s|0x0100000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0100000,c[t]||(c[t]=pe(t))):(d=d&0xfefffff,pf(t)))))m=m|0x0100000,this.$sw=t;
			if((t=st.p)!=undefined  && this.$f !=((t==null)?      (s=s&0xfdfffff,t=null):(s=s|0x0200000,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x0200000,c[t]||(c[t]=pe(t))):(d=d&0xfdfffff,t    ))))m=m|0x0200000,this.$p=t;
			if((t=st.a)!=undefined  && this.$a !=((t==null)?      (s=s&0xfbfffff,t=null):(s=s|0x0400000)                                                                                         ))m=m|0x0400000,this.$a=t;
	
            this._style(m,s,d);
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
			if(this.$_w != w) v.style.width = this.$_w = w<0?0:w;
			if(this.$_h != h) v.style.height = this.$_h = h<0?0:h;
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
		this.$c_f= "";		
		this.$c_s= "";		
		this.$c_fo= "";		
		this.$c_so= "";		
        
		this.$_x = 0; // default calculated values for vml node gen
		this.$_y = 0;
		this.$_w = 1;
		this.$_h = 1;
		this.$_vxy = '0 0';
		this.$_vwh = '100 100';
		this.$_r  = 0;
		this.$_f  = 0;
		this.$_s  = 0;
		this.$_fo  = 0;
		this.$_so  = 0;
        
        this.$vml_void = {style:{},firstChild:{},lastChild:{}};

        // do the position part of the styling
        this._style = function(m,s,d){
            var v = this.$vml_node || this.$vml_void, _t;
			// now generate/set variables based on modify masks
			if( m&0x000003f ){ // any of our transform values modified?
				if(((s^this.$isset)|((d|this.$isdyn)&m))&0x000003f){ // refresh only if isset changed or any of our dynamics have changed
					if(s&0x000003f){// any of our transform values set?
						this.$c_trans = 
								["var _t",(s&0x0000001?",_sx":""),(s&0x0000002?",_sy":""),";\n",
								"if( (_t=",((s&0x0000011)==0x11?"x*(_sx="+(d&0x0000001?this.$sx:"this.$sx")+")+(1-_sx)*(x+("+(d&0x0000010?this.$cx:"this.$cx")+")*w)":"x"),(s&0x0000004?"+("+(d&0x0000004?this.$cx:"this.$ox")+")":""),") != this.$_x )v.style.left = this.$_x = _t;\n",
								"if( (_t=",((s&0x0000022)==0x22?"y*(_sy="+(d&0x0000002?this.$sy:"this.$sy")+")+(1-_sy)*(y+("+(d&0x0000020?this.$cy:"this.$cy")+")*h)":"y"),(s&0x0000008?"+("+(d&0x0000008?this.$cx:"this.$oy")+")":""),") != this.$_y )v.style.top = this.$_y = _t;\n",
								"if( (_t=",(s&0x0000001?(s&0x0000010?"w*_sx":"w*("+(d&0x0000001?this.$sx:"this.$sx")+")"):"w"),") != this.$_w )v.style.width = this.$_w = _t<0?0:_t;\n",
								"if( (_t=",(s&0x0000002?(s&0x0000020?"h*_sy":"h*("+(d&0x0000002?this.$sy:"this.$sy")+")"):"h"),") != this.$_h )v.style.height = this.$_h = _t<0?0:_t;\n"].join('');
						if(!(d&0x000003f)){ // none of the transform props or are dynamic
							// create a setPos function with immediate set
							var code = "var v = this.$vml_node || this.$vml_void;\n" + this.$c_trans; 
							this.setPos = c[code] || (c[code] = new Function("x","y","h","w",code));
						} else this.setPos = this.pos_defer; 
					} else this.setPos = this.pos_immediate;
				}
			}
			if(m&0x0000c00)this.$c_vxy = (d&0x0000c00)?"if((_t=("+this.$vx+")+' '+("+this.$vy+"))!=this.$_vxy)v.coordorigin = this.$_vxy = _t;\n":(v.coordorigin=this.$_vxy = this.$vx+' '+this.$vy, "");

			// if we dont have vwh defined, we need to update it with wh if they changed
			//if(m&0x0004000)this.$c_r = (d&0x0004000)?"if((_t=("+this.$r+"))!=this.$_r)v.rotate = this.$_r = _t%360;\n":(v.rotation = this.$_r = parseFloat(this.$r)%360,"");
			if(m&0x00003ff)this.$c_xyhw = d&0x00003c0?"var x = "+(d&0x0000040?"("+this.$x+")":"this.$_x")+", y = "+(d&0x0000080?"("+this.$y+")":"this.$_y")+
											   ", w = "+(d&0x0000100?"("+this.$h+")":"this.$_h")+", h = "+(d&0x0000200?"("+this.$w+")":"this.$_w")+";\n":
											(this.setPos(this.$x,this.$y,this.$w,this.$h),"var x = this.$_x, y = this.$_y, w = this.$_w, h = this.$_h;\n");

			if(!(s&0x0003000) && (m&0x0000300)){ // when we dont have vwh set but we do have wh modified:
				this.$c_vwh = d&0x0000300?"if((_t=(this.$_w)+' '+(this.$_h))!=this.$_vwh)v.coordsize = this.$_vwh = _t;\n":(v.coordsize = this.$_vwh = this.$_w+' '+this.$_h, "");
			} // else if we have vwh set
            else if(m&0x0003000) this.$c_vwh = d&0x0003000?"if((_t=("+this.$vw+")+' '+("+this.$vh+"))!=this.$_vwh)v.coordsize = this.$_vwh = _t;\n":(v.coordsize=this.$_vwh = this.$vw+' '+this.$vh, "");
			
            // rotate modfied
            if(m&0x0004000)
                this.$c_r = d&0x0004000?"if( (_t = ("+this.$r+")%360)!=this.$_r)v.style.rotation = this.$_r = _t%360;":(v.style.rotation = this.$_r = this.$r%360,"");
            
            // any fill/opacity/stroke modified
            if(m&0x01f8000){
                // also we need to turn fill on/off based on what it is
                if(m&0x0010000) this.$c_s  = d&0x0010000?"if( (_t = ("+this.$s+"))!=this.$_s)(_t==null?(this.lastChild.on='f'):(this.$_s==null?this.lastChild.on='t':0),v.lastChild.color = this.$_s = _t;":
                                                         (this.$s==null?(this.lastChild.on='f'):(this.$_s==null?(this.lastChild.on='t'):0),v.lastChild.color = this.$_s = this.$s,"");
                if(m&0x0100000) this.$c_sw = d&0x0010000?"if( (_t = ("+this.$sw+"))!=this.$_sw)v.lastChild.weight = this.$_s = _t;":(v.lastChild.weight = this.$_sw = this.$sw,"");
                if(m&0x0008000) this.$c_f  = d&0x0008000?"if( (_t = ("+this.$f+"))!=this.$_f)(_t==null?(this.firstChild.on='f'):(this.$_f==null?this.firstChild.on='t':0),v.firstChild.color = this.$_f = _t;":
                                                        (this.$s==null?(this.firstChild.on='f'):(this.$_s==null?(this.firstChild.on='t'):0),v.firstChild.color = this.$_f = this.$f,"");
                // else stroke opacity set opacity sets fill

        
                if( m&0x0020000 || (this.$isset^s)&0x00c0000 ){ //o modified or fo/so had they set status changed
                    //apf.logw(this.dbgmsk(s));
                    if(!(_t=s&0x00c0000)) // fo/so both not set
                        this.$c_fo = d&0x0020000?"if( (_t = ("+this.$o+"))!=this.$_fo)v.firstChild.opacity = v.lastChild.opacity = this.$_fo = _t":(v.firstChild.opacity = v.lastChild.opacity = this.$o,""),
                        this.$c_so = "";
                    else if(_t == 0x0040000)// fo set, so assign o to so
                        this.$c_so = d&0x0020000?"if( (_t = ("+this.$o+"))!=this.$_so)v.lastChild.opacity = this.$_so =_t":((_t = this.$o)!=this.$_so?(v.lastChild.opacity = this.$_so = _t):0,"");                    
                    else if(_t == 0x0080000)// so set so assign o to fo
                        this.$c_fo = d&0x0020000?"if( (_t = ("+this.$o+"))!=this.$_fo)v.firstChild.opacity = this.$_fo =_t":((_t = this.$o)!=this.$_fo?(v.firstChild.opacity = this.$_fo = _t):0,"");
                }
                if( m&s&0x0040000) // fill opacity got set
                    this.$c_fo = d&0x0040000?"if( (_t = ("+this.$fo+"))!=this.$_fo)v.firstChild.opacity = this.$_fo =_t":(v.firstChild.opacity = this.$fo,"");
                if( m&s&0x0080000) // stroke opacity got set
                    this.$c_so = d&0x0080000?"if( (_t = ("+this.$so+"))!=this.$_so)v.lastChild.opacity = this.$_so =_t":(v.lastChild.opacity = this.$so,"");
            }
                
			if(d&m){
				var code = ["var v = this.$vml_node || this.$vml_void;\n",
						    this.$c_xyhw,
						    this.$c_trans,
						    this.$c_vxy,
						    this.$c_vwh,
						    this.$c_r,
                            this.$c_fo,
                            this.$c_so].join('');                           
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
					k[i].$vml_node = d[i], k[i].$style = d[i].style;
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
			return ["<av:group coordorigin='",
					this.$_vxy,"' coordsize='",this.$_vwh,"' style='display:block;",this.$_r?"rotation:"+this.$_r:"",
					";left:",this.$_x,";top:",this.$_y,";width:",this.$_w,";height:",this.$_h,";'>",
						this.$children.join(''), 
					 "</av:group>"].join('');
		}        
	}).call(this.group_node.prototype = new this.node_vml, this.group_node);
	//------------------------------------------------------------------------
	// Rect constructor
	//------------------------------------------------------------------------
	this.rect = function(x, y, w, h, s, parent){
		if(!s) s = {};
		s.x = x, s.y = y, s.w = w, s.h = h,
		s.vx = 0, s.vy = 0, s.vw = 100, s.vh = 100;
		s.p = "m0 0l100 0 100 100 0 100x";
		// check if we want a new packed or unpacked shape. we cannot change packed to unpacked 
		var t = new this.shape_node(s, parent || this.root);
		return t;
	};

	//------------------------------------------------------------------------
	// Generic shape
	//------------------------------------------------------------------------

	this.shape_node = function(s, parent){
		this.$parent = parent;
		this.style( s );
		this.$idx = parent.$children.push( this );
		parent.$child_new.push(this);
	};
	var i = 0;
	(function(shape_node){
		this.constructor = shape_node;
        
		this.toString = function(){
            var s = this.$isset, d = this.$isdyn;
 			if(this.$vml_node) return "[object]";
            var t = ["<av:shape fill='f' coordorigin='", this.$_vxy,"' path='",this.$p,"' coordsize='",this.$_vwh,"' style='",
                    this.$_r?"rotation:"+this.$_r:"",
					";left:",this.$_x,"px;top:",this.$_y,"px;width:",this.$_w,"px;height:",this.$_h,
					"px;'>",
                        // inject gradient support here
                        "<av:fill on='",s&0x0008000?"t":"f","' color='",d&0x0008000?'gray':this.$f,"' opacity='",
                            s&0x0040000?(d&0x0040000?0:this.$fo):(s&0x0020000?(d&0x0020000?1:this.$o):1),"' />",
                        "<av:stroke on='",s&0x0010000?"t":"f","' color='",d&0x0010000?'gray':this.$s,"' opacity='",
                            s&0x0080000?(d&0x0080000?0:this.$so):(s&0x0020000?(d&0x0020000?1:this.$o):1),"' weight='",
                            s&0x0100000?(d&0x0100000?1:this.$sw):1,"'/>",
                     "</av:shape>"].join('');
            return t;
					/*
					(this.$fill?"<av:fill color='"+this.$fill+"'/>":""), // gradient fill is of course different
					(this.$stroke?"<av:stroke color='"+this.$stroke+"'/>":""),*/
		};
	}).call(this.shape_node.prototype = new this.node_vml, this.shape_node);
}).call(apf.drawctx_vml.prototype = new apf.drawctx, apf.drawctx_vml);

function draw(){
	var ctx = new apf.drawctx_vml('drawnode',800,600,0,0,'white');
    var a = ['red','green','blue'], t = 0;
    self.t = 
	var r=[];
	apf.profile_loop(1,function(){
		for(var i = 0;i<15;i++)
			r[i] = ctx.rect(i*32,20,160,160,{f:"{lin(t,'red','green','blue')}"}));
		ctx.repaint();
	});
    
    
    // we have a style to animate 'to' or we have animate 'between'
    // alright so lets say we want to animate to this over time X
    // what would that do?
    r[0].anim( {w:200},  
    /*
    var rt = (new Date()).getTime();
    setInterval(function(){
        var t = (((new Date()).getTime()-rt)/1000)
        for(var i = 0;i<15;i++)
            r[i].style({fill:a[i%3],r:360*t,sw:32*(Math.sin((i/15+t)*4)*0.5+0.5),o:Math.sin((i/15+t)*4)*0.5+0.5});
    },10)
    */
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
