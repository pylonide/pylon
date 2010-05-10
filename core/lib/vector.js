apf.vector =  new (function(){

    var pe = apf.lm.parseExpression||parse_expression, pf = parseFloat, c = {}
    function parse_expression(x){
        x.slice(1,-1);
    }
    
    var dbglut = [
        'sx','sy','ox','oy','cx','cy',
        'x','y','w','h','vx','vy','vw','vh','r',
        'f','s','o','fo','so','sw'
    ];
    
    function dbgstr(s){
        for(var a = s.split(' '),m = 0, i = 0;i<a.length;i++)for(j = 0;j<dbglut.length;j++)
            if(dbglut[j] == a[i]){m = m|(1<<j);break;}
        return m.toString(16);
    }
    
    function dbgmsk(n){
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
        'stroke-cap':'sc',
        'stroke-pattern':'sp','pattern':'sp',
        'path':'p','curve':'p','points':'p',
        f:0x1,s:0x2,sc:0x4,sp:0x8,
        o:0x10,fo:0x20,so:0x40,sw:0x80,
        vx:0x100,vy:0x200,vw:0x400,vh:0x800,
        x:0x1000,y:0x2000,w:0x4000,h:0x8000,
        sx:0x10000,sy:0x20000,ox:0x40000,oy:0x80000,
        cx:0x100000,cy:0x200000,r:0x400000,p:0x800000        
    };
    var sd_s, sd_d, sd_c= {};
    function diffGroup(g,st,s,d,c){
        var t,m = 0;
        if(c&0xf00){// viewport
            if(c&0x100 && g.$vx!=(((t=st.vx)==null)?(s=s&0x7ffffeff,t=0):(s=s|0x100,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffeff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x100,g.$vx=t;
            if(c&0x200 && g.$vy!=(((t=st.vy)==null)?(s=s&0x7ffffdff,t=0):(s=s|0x200,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffdff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x200,g.$vy=t;
            if(c&0x400 && g.$vw!=(((t=st.vw)==null)?(s=s&0x7ffffbff,t=100):(s=s|0x400,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffbff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x400,g.$vw=t;
            if(c&0x800 && g.$vh!=(((t=st.vh)==null)?(s=s&0x7ffff7ff,t=100):(s=s|0x800,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x800,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffff7ff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x800,g.$vh=t;
        }
        if(c&0xf000){// basic xywh
            if(c&0x1000 && g.$x !=(((t=st.x)==null)?(s=s&0x7fffefff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffefff,pf(t))):(d=d&0x7fffefff,t))))m=m|0x1000,g.$x=t;
            if(c&0x2000 && g.$y !=(((t=st.y)==null)?(s=s&0x7fffdfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffdfff,pf(t))):(d=d&0x7fffdfff,t))))m=m|0x2000,g.$y=t;
            if(c&0x4000 && g.$w !=(((t=st.w)==null)?(s=s&0x7fffbfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffbfff,pf(t))):(d=d&0x7fffbfff,t))))m=m|0x4000,g.$w=t;
            if(c&0x8000 && g.$h !=(((t=st.h)==null)?(s=s&0x7fff7fff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fff7fff,pf(t))):(d=d&0x7fff7fff,t))))m=m|0x8000,g.$h=t;
        }
        if(c&0xf0000){// xywh transform
            if(c&0x10000 && g.$sx!=(((t=st.sx)==1||t==null)?(s=s&0x7ffeffff,t=1):(s=s|0x10000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffeffff,pf(t))):(d=d&0x7ffeffff,t))))m=m|0x10000,g.$sx=t;
            if(c&0x20000 && g.$sy!=(((t=st.sy)==1||t==null)?(s=s&0x7ffdffff,t=1):(s=s|0x20000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x20000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffdffff,pf(t))):(d=d&0x7ffdffff,t))))m=m|0x20000,g.$sy=t;
            if(c&0x40000 && g.$ox!=(((t=st.ox)==0||t==null)?(s=s&0x7ffbffff,t=0):(s=s|0x40000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x40000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffbffff,pf(t))):(d=d&0x7ffbffff,t))))m=m|0x40000,g.$ox=t;
            if(c&0x80000 && g.$oy!=(((t=st.oy)==0||t==null)?(s=s&0x7ff7ffff,t=0):(s=s|0x80000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x80000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ff7ffff,pf(t))):(d=d&0x7ff7ffff,t))))m=m|0x80000,g.$oy=t;
       }
       if(c&0xf00000){// xywh transform part 2
            if(c&0x100000 && g.$cx!=(((t=st.cx)==0||t==null)?(s=s&0x7fefffff,t=0):(s=s|0x100000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fefffff,pf(t))):(d=d&0x7fefffff,t))))m=m|0x100000,g.$cx=t;
            if(c&0x200000 && g.$cy!=(((t=st.cy)==0||t==null)?(s=s&0x7fdfffff,t=0):(s=s|0x200000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fdfffff,pf(t))):(d=d&0x7fdfffff,t))))m=m|0x200000,g.$cy=t;
            if(c&0x400000 && g.$r !=(((t=st.r)==0||t==null)?(s=s&0x7fbfffff,t=0):(s=s|0x400000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fbfffff,pf(t))):(d=d&0x7fbfffff,t))))m=m|0x400000,g.$r=t;
        }
        sd_s = s, sd_d = d;
        return m;
    }
    
    function diffShape(g,st,s,d,c){
        var t,m = 0;        
        if(c&0xf000){// basic xywh
            if(c&0x1000 && g.$x !=(((t=st.x)==null)?(s=s&0x7fffefff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffefff,pf(t))):(d=d&0x7fffefff,t))))m=m|0x1000,g.$x=t;
            if(c&0x2000 && g.$y !=(((t=st.y)==null)?(s=s&0x7fffdfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffdfff,pf(t))):(d=d&0x7fffdfff,t))))m=m|0x2000,g.$y=t;
            if(c&0x4000 && g.$w !=(((t=st.w)==null)?(s=s&0x7fffbfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffbfff,pf(t))):(d=d&0x7fffbfff,t))))m=m|0x4000,g.$w=t;
            if(c&0x8000 && g.$h !=(((t=st.h)==null)?(s=s&0x7fff7fff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fff7fff,pf(t))):(d=d&0x7fff7fff,t))))m=m|0x8000,g.$h=t;
        }
        if(c&0xf0000){// xywh transform
            if(c&0x10000 && g.$sx!=(((t=st.sx)==1||t==null)?(s=s&0x7ffeffff,t=1):(s=s|0x10000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffeffff,pf(t))):(d=d&0x7ffeffff,t))))m=m|0x10000,g.$sx=t;
            if(c&0x20000 && g.$sy!=(((t=st.sy)==1||t==null)?(s=s&0x7ffdffff,t=1):(s=s|0x20000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x20000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffdffff,pf(t))):(d=d&0x7ffdffff,t))))m=m|0x20000,g.$sy=t;
            if(c&0x40000 && g.$ox!=(((t=st.ox)==0||t==null)?(s=s&0x7ffbffff,t=0):(s=s|0x40000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x40000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffbffff,pf(t))):(d=d&0x7ffbffff,t))))m=m|0x40000,g.$ox=t;
            if(c&0x80000 && g.$oy!=(((t=st.oy)==0||t==null)?(s=s&0x7ff7ffff,t=0):(s=s|0x80000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x80000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ff7ffff,pf(t))):(d=d&0x7ff7ffff,t))))m=m|0x80000,g.$oy=t;
        }
        if(c&0xf00000){// xywh transform part 2
            if(c&0x100000 && g.$cx!=(((t=st.cx)==0||t==null)?(s=s&0x7fefffff,t=0):(s=s|0x100000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fefffff,pf(t))):(d=d&0x7fefffff,t))))m=m|0x100000,g.$cx=t;
            if(c&0x200000 && g.$cy!=(((t=st.cy)==0||t==null)?(s=s&0x7fdfffff,t=0):(s=s|0x200000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fdfffff,pf(t))):(d=d&0x7fdfffff,t))))m=m|0x200000,g.$cy=t;
            if(c&0x400000 && g.$r !=(((t=st.r)==0||t==null)?(s=s&0x7fbfffff,t=0):(s=s|0x400000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fbfffff,pf(t))):(d=d&0x7fbfffff,t))))m=m|0x400000,g.$r=t;
            if(c&0x800000 && g.$p !=(((t=st.p)==null)?(s=s&0x7f7fffff,t=""):(s=s|0x800000,t=t.charAt && t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7f7fffff,t))))m=m|0x800000,g.$p=t;
        }
        sd_s = s, sd_d = d;
        return m;
    }

    function diffVisual(g,st,s,d,c){
        var t,m = 0;
        if(c&0xf){
            if(c&0x1 && g.$f!=(((t=st.f)==null)?(s=s&0x7ffffffe,t=null):(s=s|0x1,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x1,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffe,t))))m=m|0x1,g.$f=t;
            if(c&0x2 && g.$s!=(((t=st.s)==null)?(s=s&0x7ffffffd,t=null):(s=s|0x2,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x2,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffd,t))))m=m|0x2,g.$s=t;
            if(c&0x4 && g.$sc!=(((t=st.sc)==null)?(s=s&0x7ffffffb,t=null):(s=s|0x4,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x4,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffb,t))))m=m|0x4,g.$sc=t;
            if(c&0x8 && g.$sp!=(((t=st.sp)==null)?(s=s&0x7ffffff7,t=null):(s=s|0x8,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x8,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffff7,t))))m=m|0x8,g.$sp=t;
        }
        if(c&0xf0){
            if(c&0x10 && g.$o!=(((t=st.o)==null)?(s=s&0x7fffffef,t=1):(s=s|0x10,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffffef,pf(t))):(d=d&0x7fffffef,t))))m=m|0x10,g.$o=t;
            if(c&0x20 && g.$fo!=(((t=st.fo)==null)?(s=s&0x7fffffdf,t=1):(s=s|0x20,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x20,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffffdf,pf(t))):(d=d&0x7fffffdf,t))))m=m|0x20,g.$fo=t;
            if(c&0x40 && g.$so!=(((t=st.so)==null)?(s=s&0x7fffffbf,t=1):(s=s|0x40,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x40,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffffbf,pf(t))):(d=d&0x7fffffbf,t))))m=m|0x40,g.$so=t;
            if(c&0x80 && g.$sw!=(((t=st.sw)==null)?(s=s&0x7fffff7f,t=1):(s=s|0x80,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x80,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffff7f,pf(t))):(d=d&0x7fffff7f,t))))m=m|0x80,g.$sw=t;
        }
        sd_s = s, sd_d = d;
        return m;
    }
    
    var vml = this.vml = function(dom_parent,w,h,x,y,color){
        if(!(this instanceof vml)){
            alert("please new the apf.vector.vml object");
            return;
        }
        if (typeof(dom_parent) == 'string')
            dom_parent = document.getElementById(dom_parent);
        this.$dom_parent = dom_parent || document.body;

        var pos = "left:"+x+"px;top:"+y+"px;width:"+w+"px;height:"+h+"px;";
        var css = "av\\:fill {behavior: url(#default#VML);} av\\:stroke {behavior: url(#default#VML);} av\\:shape {behavior: url(#default#VML);} av\\:group {behavior: url(#default#VML);} av\\:path {behavior: url(#default#VML);}"
        var img = "";//"<img class='apfdrawSS' src='images/spacer.gif' style='z-index:10000;position:absolute;background:url(images/spacer.gif);"+pos+"'/>";
        var ns = "<xml:namespace ns='urn:schemas-microsoft-com:vml' prefix='av'/> ";
        if(color)color = "background-color:"+color+";";
        else color = "background:transparent;";
        
        //if(!apf.isIE8){
            apf.importCssString(css);
            this.$dom_parent.innerHTML += img +
                "<div class='apfdrawClipper' style='margin:0;padding:0;"+color+
                    pos+"overflow:hidden;position:relative;'>"+ns+
                "</div>";
            this.$vmlroot = this.$dom_parent.lastChild;
            this.$vmlss	  = this.$vmlroot.previousSibling;
            /*
        } else {
            this.$dom_parent.innerHTML += img +
                "<iframe style='margin:0;padding:0;border:0px;overflow:hidden;"+color+
                    "position2:absolute;display:inline-block;"+pos+"'>"+
                "</iframe>";
            this.$vmlframe = this.$dom_parent.lastChild;
            this.$vmlframe.allowTransparency = true;
            var doc = r.$vmlframe.contentWindow.document;
            doc.open();
            doc.writeln("<head><meta http-equiv='X-UA-Compatible' content='IE=EmulateIE7'/></head><style>"+
                        css+"</style><html><body style='margin:0;padding:0;border:0px;background:transparent;'>\
                        <div style='position:absolute;display:inline-block;'></div></body></html>");
            doc.close();
            this.$vmlroot = doc.body.firstChild;
        }
        */
        this.root = this.group({x:0,y:0,w:w,h:h});
        this.root.$ctx = this;
    };

    (function(){
        this.$isvml = true;
    
        this.repaint = function(){
            this.root.repaint();
        };

        //-----------------------------------------------------------------------
        // Group
        //------------------------------------------------------------------------

        this.group = function(st,parent){
            return new group(st,parent||this.root);
        };
        
        function group(st,parent){
            if(parent){
                parent.$groups.push(this); // need this for repaint
                parent.$vmlnodes.push(this); // need this for init-vml-join
                this.$paint  = parent.$updatevml;// 
                this.$uid    = parent.$guid++;
                this.$parent = parent;
            }
            this.$shapes	= []; // childshapes
            this.$groups    = []; // childgroups
            this.$updateshape= {}; // all modified or animating paths indexed by UID
            this.$updatevml  = {}; // all modified or animating vmlnode holding things
            this.$pathjoin  = {};
            
            this.$vmlnodes    = []; // list of vml nodes in z-order
            this.$cache     = {}; // style indexed node cache
            this.$trash     = {}; // trashed nodes (usage = 0)

            if(st) this.style(st);
        };

        (function(){
            this.$isgroup   = true;
            this.$guid      = 0; // child uid counter.
            this.$vmlnode   = null;

            this.pos = function(x,y,w,h){
                this.$x = x, this.$y = y, this.$w = w, this.$h = h;
                this.$paint[this.$uid] = this;
            };
            
            this.$vmlvoid = {style:{}};
            this.$c_trans = "if( x!=this.$_x )v.style.left = this.$_x = x;\nif( y!=this.$_y )v.style.top = this.$_y = y;\nif( (w<0?(w=0):w)!=this.$_w )v.style.width = this.$_w = w;\nif( (h<0?(h=0):h)!=this.$_h )v.style.height = this.$_h = h;\n";
            this.$c_xyhw  = "var x = this.$x, y = this.$, w = this.$h, h = this.$w;\n";
            this.$c_vxy   = "";
            this.$c_vwh   = "if((_t=this.$_w+' '+this.$_h)!=this.$_vwh)v.coordsize = this.$_vwh = _t;\n";
            this.$c_r     = "if((_t=this.$r%360)!=this.$_r)v.style.rotation = this.$_r = _t;\n";	 // codeblocks for dynamic code
            
            this.$_x = 0, this.$_y = 0, this.$_w = 1, this.$_h = 1;
            this.$_vx = 0,this.$_vy = 0,this.$_vw = 1,this.$_vh = 1;
            this.$_r  = 0;
            this.$nodeupdate = 0;
            
            this.$update = function(){
            }
            
            this.repaint = function(){
                if(!this.$vmlnode){ // init the root node
                    if(this.$parent) return false; // faulty setup
                    var r = this.$ctx.$vmlroot;
                    r.insertAdjacentHTML("beforeend", this.toString());
                    this.$vmlnode = r.firstChild;
                }
                var d,h,i,j,k,l; 
                if(this.$viastring){ // our parent created our children
                    // update our vmlnode refs
                    for(d = this.$vmlnodes,k = this.$vmlnode.childNodes,l=d.length,i=0;i<l;i++)
                        d[i].$vmlnode = k[i];
                    
                    this.$viastring = 0;
                    this.$nodeupdate = 0;
                } else if(this.$nodeupdate){
                    // dynamically update childranges
                    for( i = 0, d = this.$vmlnodes, l = d.length;i<l;i++) if(!d[i].$vmlnode){
                        // we now have to find the last one in our scan
                        for(h = i;h<l && !d[h].$vmlnode;h++);
                        
                        if(i==0) // we need to insert at the head
                            this.$vmlnode.insertAdjacentHTML("afterBegin",t=d.slice(i,h).join(''));
                        else  // insert after a node
                            d[i-1].$vmlnode.insertAdjacentHTML("afterEnd",t=d.slice(i,h).join(''));
                            
                        for(k = this.$vmlnode.childNodes,j = i;j<h;j++)
                            d[j].$vmlnode = k[j];                        
                        i = k;
                    }
                    this.$nodeupdate = 0;
                }
               
                for(i in (d=this.$updateshape)) // update all shapes
                    d[i].$update();

                for(i in (d=this.$updatevml))   // update all vmlnodes that ar;)e animating/need update
                    d[i].$update();

                for(i in (d=this.$pathjoin))   // update all vmlnodes that ar;)e animating/need update
                    d[i].$join();
                
                
                for(i = 0, d = this.$groups,l = d.length;i<l;i++)// repaint all childgroups
                    d[i].repaint();                    
            }
            var codecache = {};
            this.style = function(st){
                // run the stylediff
                var ss = style_short, c = 0, i, t;
                for(i in st)if(i.length>2){if(t=ss[i])st[t]=st[i],c|=ss[i];}else c|=ss[i];
                
                var m = diffGroup(this,st,this.$isset,this.$isdyn,c), s = sd_s, d = sd_d;

                if(m){
                    // any of our xywh values modified? ifso any dynamic? no?
                    if( m&0xf000 ){
                        if( d&0xf000 ) // any xywh is dynamic
                            this.$c_xywh = [
                                "var x = (",d&0x1000?this.$x:"this.$x",
                                "),y = (",d&0x2000?this.$y:"this.$y",
                                "),w = (",d&0x4000?this.$w:"this.$w",
                                "),h = (",d&0x8000?this.$h:"this.$h",");\n"
                            ].join('');
                        else 
                            delete this.$c_xywh; // default xywh
                    }
                    if(m&0x3f0000){ // any of our transform values modified?
                        if(s&0x3f0000){ // any of our transform values set?
                            if( (d|this.$isdyn)&0x3f0000 ) // we only need to recompute this thing when dynamics modified
                                this.$c_trans = [
                                    "if((_t=",(s&0x110000)==0x110000?"x*(_u="+(d&0x10000?this.$sx:"this.$sx")+")+(1-_u)*(x+("+(d&0x100000?this.$cx:"this.$cx")+")*w)":"x",s&0x40000?"+("+(d&0x40000?this.$ox:"this.$ox")+")":"",")!= this.$_x )v.style.left=this.$_x=_t;\n",
                                    "if((_t=",(s&0x220000)==0x220000?"y*(_v="+(d&0x20000?this.$sy:"this.$sy")+")+(1-_v)*(y+("+(d&0x200000?this.$cy:"this.$cy")+")*h)":"y",s&0x80000?"+("+(d&0x80000?this.$oy:"this.$oy")+")":"",")!= this.$_y )v.style.top=this.$_y=_t;\n",
                                    "if(((_t=",s&0x10000?(s&0x100000?"w*_u":"w*("+(d&0x10000?this.$sx:"this.$sx")+")"):"w",")<0?0:_t)!=this.$_w)v.style.width=this.$_w=_t;\n",
                                    "if(((_t=",s&0x20000?(s&0x200000?"h*_v":"h*("+(d&0x20000?this.$sy:"this.$sy")+")"):"h",")<0?0:_t)!=this.$_h)v.style.height=this.$_h=_t;\n"
                                ].join('');
                        } else   
                            delete this.$c_trans; // default transform
                    }
                    
                    if(m&0x300) // check if vx or vy is modified
                        this.$c_vxy = "if((_u=("+(d&0x200?this.$vy:"this.$vy")+"),_t=("+(d&0x100?this.$vx:"this.$vx")+"))!=this.$_vx||_u!=this.$vy)v.coordorigin = (this.$vx=_t)+' '+(this.$_vy=_u);\n";
                    
                    if(!(s&0xc00) && (m&0xc000)) // when we dont have vwh set but we do have wh modified:
                        this.$c_vwh = "if((_u=this.$_h,_t=this.$_w)!=this.$_vw||_u!=this.$_vh)v.coordsiz=(this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    else if(m&0xc00)  // vw or vh is modified
                        this.$c_vwh = "if((_u=("+(d&0x800?this.$vh:"this.$vh")+"),_t=("+(d&0x400?this.$vw:"this.$vw")+"))!=this.$_vw||_u!=this.$_vh)v.coordsize = (this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    
                    if(m&0x400000)// rotate modfied
                        this.$c_r = "if((_t=("+(d&0x400000?this.$r:"this.$r")+")%360)!=this.$_r)v.style.rotation=this.$_r=_t;\n";
                    
                    var code = ["function _f(t){var v = this.$vmlnode || this.$vmlvoid,_t,_u,_v;\n",
                                this.$c_xyhw,
                                this.$c_trans,
                                this.$c_vxy,
                                this.$c_vwh,
                                this.$c_r,
                                "}"].join('');     
                    
                    this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                    
                    if(this.$vmlnode){ // if we have a vmlnode, put ourself on the update list
                        this.$parent.$updatevml[this.$uid] = this;
                    }
                    else {// else we are in init, update now to get our initial values set
                        // optimization: for trivial nondynamic cases of xywh vwvh and r
                        // just inline assign the _ versions here
                        this.$update(0);
                    }
                    this.$isset = s, this.$isdyn = d;
                }
            }
            
            this.toString = function(){
                this.$viastring = true;
                this.$_y = 0;
                return ["<av:group coordorigin='",this.$_vx,"px ",this.$_vy,"px' coordsize='",this.$_vw," ",this.$_vh,
                        "' style='position:absolute;",this.$_r?"rotation:"+this.$_r:"",
                        ";left:",this.$_x,"px;top:",this.$_y,"px;width:",this.$_w,"px;height:",this.$_h,"px;'>",
                            this.$vmlnodes.join(''), 
                         "</av:group>"].join('');
            }        
        }).call(group.prototype);
        

        //-----------------------------------------------------------------------
        // vmlshape 
        //-----------------------------------------------------------------------
        
        function vmlshape(parent, styleid){
            this.$styleid = styleid;
            this.$path = [];
            this.$parent = parent;
            this.$uid = parent.$guid++;
            parent.$vmlnodes.push(this);// add ourself
            parent.$nodeupdate = 1;
        };

        (function(){
            this.$isvmlshape = true;

            this.$vmlnode = null;
            this.$vmlvoid = {style:{},firstChild:{},lastChild:{}};
            this.$uid       = 0; // prototype anim UID counter

            this.$nodes = 
            this.$free = 
            this.$_f  = 
            this.$_s  = 
            this.$_fo  = 
            this.$_so  = 0;

            var codecache = {};

            this.$styleVisual = function(m,s,d){
                if(m&0x1)
                    this.$c_f  = "if( (_t = ("+(d&0x1?this.$f:"this.$f")+"))!=this.$_f)_t==null?(v.firstChild.on='f'):((this.$_f==null?v.firstChild.on='t':0),v.firstChild.color = this.$_f = _t);\n";
                if(m&0x2)// stroke
                    this.$c_s  = "if( (_t = ("+(d&0x2?this.$s:"this.$s")+"))!=this.$_s)_t==null?(v.lastChild.on='f'):((this.$_s==null?v.lastChild.on='t':0),v.lastChild.color = this.$_s = _t);\n";
                if(m&0x80)// stroke weight
                    this.$c_sw = "if( (_t = ("+(d&0x80?this.$sw:"this.$sw")+"))!=this.$_sw)v.lastChild.weight = this.$_sw = _t;\n";
                
                if( m&0x10 || (this.$isset^s)&0x60 ){ //o modified or fo/so had they set status changed
                    if(!(_t=s&0x60)) // fo/so both not set
                        this.$c_fo = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_fo)v.firstChild.opacity = v.lastChild.opacity = this.$_fo = _t;\n",
                        this.$c_so = "";
                    else if(_t == 0x20)// fo set, so assign o to so
                        this.$c_so = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_so)v.lastChild.opacity = this.$_so =_t;\n";                    
                    else if(_t == 0x40)// so set so assign o to fo
                        this.$c_fo = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_fo)v.firstChild.opacity = this.$_fo =_t;\n";
                }
                if( m&s&0x20) // fill opacity got set
                    this.$c_fo = "if( (_t = ("+(d&0x20?this.$fo:"this.$fo")+"))!=this.$_fo)v.firstChild.opacity = this.$_fo =_t;\n";
                if( m&s&0x40) // stroke opacity got set
                    this.$c_so = "if( (_t = ("+(d&0x40?this.$so:"this.$so")+"))!=this.$_so)v.lastChild.opacity = this.$_so =_t;\n";
                    
                var code = [
                    "function _f(t){var v = this.$vmlnode || this.$vmlvoid;\n",
                    this.$c_fo,
                    this.$c_so,
                    this.$c_s,
                    this.$c_sw,
                    this.$c_f,
                    "}"
                ].join('');
                this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                if(this.$vmlnode){ // if we have a vmlnode, put ourself on the update list
                    this.$parent.$updatevml[this.$uid] = this;
                }else {// else we are in init, update now to get our initial values set
                    // optimization: for trivial nondynamic cases of f,s,o,fo and inline assign here
                    this.$update(0);
                }
            };
                        
            this.$join = function(){
                if(!this.$vmlnode){
                }
                else{
                    this.$vmlnode.path = this.$path.join('')||" ";
                    delete this.$parent.$pathjoin[this.$uid];
                }
            }
            
            this.toString = function(){
                var s = this.$isset, d = this.$isdyn;
                var t = ["<av:shape fill='f' path='",this.$path.join(''),"' style='position:absolute;left:0;top:0;width:100%;height:100%;'>",
                            // inject gradient support here
                            "<av:fill on='",s&0x1?"t":"f","' color='",this.$_f,"' opacity='",
                                s&0x30?this.$_fo:1,"' />",
                            "<av:stroke on='",s&0x2?"t":"f","' color='",this.$_s,"' opacity='",
                                s&0x40?this.$_so:(s&0x30?this.$_fo:1),"' weight='",
                                s&0x80?this.$_sw:1,"'/>",
                         "</av:shape>"].join('');
                return t ;
            };        
        }).call(vmlshape.prototype);

        //------------------------------------------------------------------------
        // Generic shape
        //------------------------------------------------------------------------

        function shape(st, parent, styleShape){
            this.$parent = parent;
            parent.$shapes.push(this);
            this.$styleShape = styleShape;
            this.$uid = parent.$uid++;
            this.style(st);
        };
        var i = 0;
        (function(){
            this.$isshape = true;
            // lets create the style function based on a code-gen            
            this.style = function(st){
                var c = 0, m, s, d, t, i, j, k, 
                    isnew,styleid, parent = this.$parent, ss = style_short, oldpath; 
                
                for(i in st)if(i.length>2){if(t=ss[i])st[i]=st[i],c|=ss[i];}else c|=ss[i];            

                if(c&0xff){ // we have a visual style change
                    styleid = [st.f,st.s,st.o,st.fo,st.so,st.sw,st.z,st.a].join(',');
                    if(!(vs = this.$vmlshape) || vs.$styleid!=styleid){
                        if(vs){ // drop our current node
                            oldpath = vs.$path[t = this.$pathslot];
                            vs.$path[t = this.$pathslot] = null;
                            if(--vs.$nodes == 0){ // trash it
                                delete parent.$cache[vs.$styleid];
                                parent.$trash[vs.$styleid] = vs;
                                parent.$pathjoin[vs.$uid] = vs;
                            }
                            if(vs.$free>t)vs.$free = t;
                        }
                        if(!(vs = parent.$cache[styleid])){   // no cache available
                            if(vs = parent.$trash[styleid]){ // found one in the trash
                                delete parent.$trash[styleid];
                            } else {
                                i = null;
                                for(i in parent.$trash)break; // find one in trash
                                if(i){
                                    vs = parent.$trash[i];
                                    delete parent.$trash[i];
                                } else {
                                    isnew = 1;
                                    vs = new vmlshape(parent,styleid);
                                }
                            }
                            parent.$cache[vs.$styleid=styleid] = vs;
                        };
                        vs.$nodes++;
                        for(i = vs.$free,j = vs.$path, k = j.length;i<k && j[i]!=null;i++);
                        vs.$free = (this.$pathslot = i)+1;
                        if(oldpath){ // old shape
                            vs.$path[i] = oldpath;
                            if(!isnew)parent.$pathjoin[vs.$uid] = vs;
                        }
                        this.$vmlshape = vs
                    }
                    m = diffVisual(vs, st, vs.$isset, vs.$isdyn, c);
                    if(m)vs.$styleVisual(m, sd_s, sd_d);
                    vs.$isset = sd_s, vs.$isdyn = sd_d;  
                }
                if(c&0x7fffff00){ // we have path style changes
                    this.$styleShape(diffShape(this,st,this.$isset, this.$isdyn, c), sd_s, sd_d);
                    this.$isset = sd_s, this.$isdyn = sd_d;
                }
            }
        }).call(shape.prototype);
        
        //------------------------------------------------------------------------
        // Rect constructor
        //------------------------------------------------------------------------
        
        function styleRect(m,s,d){
            // someone needs us to update the rect shiz based on our modified stuff
            var w, vs = this.$vmlshape;
            var round = Math.round;
            vs.$path[this.$pathslot] =  ["m",round(this.$x),round(this.$y),
                    "r",w=round(this.$w),0,0,round(this.$h),
                    -w,0,"xe "].join(' ');
            this.$parent.$pathjoin[vs.$uid] = vs;
        }
        
        this.rect = function(st, parent){
            var t = new shape(st, parent || this.root, styleRect);
            return t;
        };

        function stylePath(m,s,d){
            // someone needs us to update the rect shiz based on our modified stuff
            var w, vs = this.$vmlshape, ps, pt, p;
            if( (pt = vs.$path)[ps = this.$pathslot] !=  (p = this.$p)){
                pt[ps] = p;
                this.$parent.$pathjoin[vs.$uid] = vs;
            }
        }
        
        this.path = function(st, parent){
            var t = new shape(st, parent || this.root, stylePath);
            return t;
        };
    }).call(vml.prototype);
});

