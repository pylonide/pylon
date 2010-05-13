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
 
//#ifdef __WITH_VECTOR

apf.vector =  new (function(){

    var pe = apf.lm.parseExpression, pf = parseFloat, c = {}, style_short = {
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
        'color':'f','fill':'f','fill-color':'f','fillcolor':'f','background':'f','background-color':'f',
        'stroke':'s','stroke-color':'s','strokecolor':'s',
        'alpha':'o','transparency':'o','opacity':'o',
        'fill-alpha':'fo','fill-transparency':'fo','fill-opacity':'fo',
        'fillalpha':'fo','filltransparency':'fo','fillopacity':'fo',
        'stroke-alpha':'fo','stroke-transparency':'fo','stroke-opacity':'so',
        'strokealpha':'fo','stroketransparency':'fo','strokeopacity':'so',
        'stroke-width':'sw','stroke-weight':'sw',
        'path':'p','curve':'p','points':'p',
        'visible':'v','visibility':'v','show':'v','display':'v',
        'name':'id','z-index':'z','zindex':'z','z-offset':'z',
        f:0x1,s:0x2,z:0x8,
        o:0x10,fo:0x20,so:0x40,sw:0x80,
        vx:0x100,vy:0x200,vw:0x400,vh:0x800,
        x:0x1000,y:0x2000,w:0x4000,h:0x8000,
        sx:0x10000,sy:0x20000,ox:0x40000,oy:0x80000,
        cx:0x100000,cy:0x200000,r:0x400000,p:0x800000,
        v:0x10000000,id:0x20000000
    };
    var sd_s, sd_d, sd_c= {};
    
    function diffGroup(g,st,s,d,c){
        var t,m = 0;
        if(c&0xf0f){// styling
            if(c&0x1 && g.$f!=(((t=st.f)==null)?(s=s&0x7ffffffe,t=null):(s=s|0x1,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x1,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffe,t))))m=m|0x1,g.$f=t;
            if(c&0x2 && g.$s!=(((t=st.s)==null)?(s=s&0x7ffffffd,t=null):(s=s|0x2,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x2,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffd,t))))m=m|0x2,g.$s=t;
            if(c&0x8 && g.$z!=(((t=st.z)==null)?(s=s&0x7ffffff7,t=null):(s=s|0x8,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x8,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffff7,t))))m=m|0x8,g.$z=t;
        }
        if(c&0xf0f){// viewport
            if(c&0x100 && g.$vx!=(((t=st.vx)==null)?(s=s&0x7ffffeff,t=0):(s=s|0x100,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffeff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x100,g.$vx=t;
            if(c&0x200 && g.$vy!=(((t=st.vy)==null)?(s=s&0x7ffffdff,t=0):(s=s|0x200,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffdff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x200,g.$vy=t;
            if(c&0x400 && g.$vw!=(((t=st.vw)==null)?(s=s&0x7ffffbff,t=100):(s=s|0x400,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffbff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x400,g.$vw=t;
            if(c&0x800 && g.$vh!=(((t=st.vh)==null)?(s=s&0x7ffff7ff,t=100):(s=s|0x800,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x800,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffff7ff,pf(t))):(d=d&0x7ffffeff,t))))m=m|0x800,g.$vh=t;
        }
        if(c&0xf000){// basic xywh
            if(c&0x1000 && g.$x !=(((t=st.x)==null)?(s=s&0x7fffefff,t=0):(s=s|0x1000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x1000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffefff,pf(t))):(d=d&0x7fffefff,t))))m=m|0x1000,g.$x=t;
            if(c&0x2000 && g.$y !=(((t=st.y)==null)?(s=s&0x7fffdfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffdfff,pf(t))):(d=d&0x7fffdfff,t))))m=m|0x2000,g.$y=t;
            if(c&0x4000 && g.$w !=(((t=st.w)==null)?(s=s&0x7fffbfff,t=0):(s=s|0x4000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x4000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffbfff,pf(t))):(d=d&0x7fffbfff,t))))m=m|0x4000,g.$w=t;
            if(c&0x8000 && g.$h !=(((t=st.h)==null)?(s=s&0x7fff7fff,t=0):(s=s|0x8000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x8000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fff7fff,pf(t))):(d=d&0x7fff7fff,t))))m=m|0x8000,g.$h=t;
        }
        if(c&0xf0000){// xywh transform
            if(c&0x10000 && g.$sx!=(((t=st.sx)==1||t==null)?(s=s&0x7ffeffff,t=1):(s=s|0x10000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffeffff,pf(t))):(d=d&0x7ffeffff,t))))m=m|0x10000,g.$sx=t;
            if(c&0x20000 && g.$sy!=(((t=st.sy)==1||t==null)?(s=s&0x7ffdffff,t=1):(s=s|0x20000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x20000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffdffff,pf(t))):(d=d&0x7ffdffff,t))))m=m|0x20000,g.$sy=t;
            if(c&0x40000 && g.$ox!=(((t=st.ox)==0||t==null)?(s=s&0x7ffbffff,t=0):(s=s|0x40000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x40000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffbffff,pf(t))):(d=d&0x7ffbffff,t))))m=m|0x40000,g.$ox=t;
            if(c&0x80000 && g.$oy!=(((t=st.oy)==0||t==null)?(s=s&0x7ff7ffff,t=0):(s=s|0x80000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x80000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ff7ffff,pf(t))):(d=d&0x7ff7ffff,t))))m=m|0x80000,g.$oy=t;
       }
       if(c&0x70f00000){// xywh transform part 2
            if(c&0x100000 && g.$cx!=(((t=st.cx)==0||t==null)?(s=s&0x7fefffff,t=0):(s=s|0x100000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fefffff,pf(t))):(d=d&0x7fefffff,t))))m=m|0x100000,g.$cx=t;
            if(c&0x200000 && g.$cy!=(((t=st.cy)==0||t==null)?(s=s&0x7fdfffff,t=0):(s=s|0x200000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fdfffff,pf(t))):(d=d&0x7fdfffff,t))))m=m|0x200000,g.$cy=t;
            if(c&0x400000 && g.$r !=(((t=st.r)==0||t==null)?(s=s&0x7fbfffff,t=0):(s=s|0x400000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fbfffff,pf(t))):(d=d&0x7fbfffff,t))))m=m|0x400000,g.$r=t;
            if(c&0x10000000 && g.$v !=(((t=st.v)==null)?(s=s&0x6fffffff,t=true):(s=s|0x10000000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x6fffffff,pf(t))):(d=d&0x6fffffff,t))))m=m|0x10000000,g.$v=t;
        }
        sd_s = s, sd_d = d;
        return m;
    }
    
    function diffShape(g,st,s,d,c){
        var t,m = 0;        
        if(c&0xf000){// basic xywh
            if(c&0x1000 && g.$x !=(((t=st.x)==null)?(s=s&0x7fffefff,t=0):(s=s|0x1000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x1000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffefff,pf(t))):(d=d&0x7fffefff,t))))m=m|0x1000,g.$x=t;
            if(c&0x2000 && g.$y !=(((t=st.y)==null)?(s=s&0x7fffdfff,t=0):(s=s|0x2000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x2000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffdfff,pf(t))):(d=d&0x7fffdfff,t))))m=m|0x2000,g.$y=t;
            if(c&0x4000 && g.$w !=(((t=st.w)==null)?(s=s&0x7fffbfff,t=0):(s=s|0x4000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x4000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fffbfff,pf(t))):(d=d&0x7fffbfff,t))))m=m|0x4000,g.$w=t;
            if(c&0x8000 && g.$h !=(((t=st.h)==null)?(s=s&0x7fff7fff,t=0):(s=s|0x8000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x8000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fff7fff,pf(t))):(d=d&0x7fff7fff,t))))m=m|0x8000,g.$h=t;
        }
        if(c&0xf0000){// xywh transform
            if(c&0x10000 && g.$sx!=(((t=st.sx)==1||t==null)?(s=s&0x7ffeffff,t=1):(s=s|0x10000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffeffff,pf(t))):(d=d&0x7ffeffff,t))))m=m|0x10000,g.$sx=t;
            if(c&0x20000 && g.$sy!=(((t=st.sy)==1||t==null)?(s=s&0x7ffdffff,t=1):(s=s|0x20000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x20000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffdffff,pf(t))):(d=d&0x7ffdffff,t))))m=m|0x20000,g.$sy=t;
            if(c&0x40000 && g.$ox!=(((t=st.ox)==0||t==null)?(s=s&0x7ffbffff,t=0):(s=s|0x40000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x40000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffbffff,pf(t))):(d=d&0x7ffbffff,t))))m=m|0x40000,g.$ox=t;
            if(c&0x80000 && g.$oy!=(((t=st.oy)==0||t==null)?(s=s&0x7ff7ffff,t=0):(s=s|0x80000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x80000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ff7ffff,pf(t))):(d=d&0x7ff7ffff,t))))m=m|0x80000,g.$oy=t;
        }
        if(c&0x70f00000){// xywh transform part 2
            if(c&0x100000 && g.$cx!=(((t=st.cx)==0||t==null)?(s=s&0x7fefffff,t=0):(s=s|0x100000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x100000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fefffff,pf(t))):(d=d&0x7fefffff,t))))m=m|0x100000,g.$cx=t;
            if(c&0x200000 && g.$cy!=(((t=st.cy)==0||t==null)?(s=s&0x7fdfffff,t=0):(s=s|0x200000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x200000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fdfffff,pf(t))):(d=d&0x7fdfffff,t))))m=m|0x200000,g.$cy=t;
            if(c&0x400000 && g.$r !=(((t=st.r)==0||t==null)?(s=s&0x7fbfffff,t=0):(s=s|0x400000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7fbfffff,pf(t))):(d=d&0x7fbfffff,t))))m=m|0x400000,g.$r=t;
            if(c&0x800000 && g.$p !=(((t=st.p)==null)?(s=s&0x7f7fffff,t=""):(s=s|0x800000,t=t.charAt && t.indexOf('{')!=-1?(d=d|0x400000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7f7fffff,t))))m=m|0x800000,g.$p=t;
            if(c&0x10000000 && g.$v !=(((t=st.v)==null)?(s=s&0x6fffffff,t=true):(s=s|0x10000000,t=t.indexOf?(t.indexOf('{')!=-1?(d=d|0x10000000,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x6fffffff,pf(t))):(d=d&0x6fffffff,t))))m=m|0x10000000,g.$v=t;
        }
        sd_s = s, sd_d = d;
        return m;
    }

    function diffVisual(g,st,s,d,c){
        var t,m = 0;
        if(c&0xf){
            if(c&0x1 && g.$f!=(((t=st.f)==null)?(s=s&0x7ffffffe,t=null):(s=s|0x1,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x1,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffe,t))))m=m|0x1,g.$f=t;
            if(c&0x2 && g.$s!=(((t=st.s)==null)?(s=s&0x7ffffffd,t=null):(s=s|0x2,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x2,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffffd,t))))m=m|0x2,g.$s=t;
            if(c&0x8 && g.$z!=(((t=st.z)==null)?(s=s&0x7ffffff7,t=null):(s=s|0x8,t=t.indexOf&&t.indexOf('{')!=-1?(d=d|0x8,sd_c[t]||(sd_c[t]=pe(t))):(d=d&0x7ffffff7,t))))m=m|0x8,g.$z=t;
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
    
    // create the root group
    this.group = function(st,htmlroot){
        htmlroot = typeof(htmlroot)=='string'?document.getElementById(htmlroot):(htmlroot||document.body);
        // pick renderer to use SVG or VML
        if(apf.supportVML)
            return this.vml.group(st,htmlroot);
        else if(apf.supportSVG)
            return this.svg.group(st,htmlroot);
    }
    
    // style function used by both svg and vml shapes as their merge-allocator
    function shapeMergeStyle(st){
        var c = 0, m, s, d, t, i, j, k, 
            isnew,styleid, parent = this.$parent, ss = style_short, oldpath; 
        
        for(i in st)if(i.length>2){if(t=ss[i])st[i]=st[i],c|=ss[i];}else c|=ss[i];            

        if(c&0xff){ // we have a visual style change
            styleid = [st.f,st.s,st.o,st.fo,st.so,st.sw,st.z,st.a].join(',');
            if(!(sm = this.$shapemerge) || sm.$styleid!=styleid){
                if(sm){ // drop our current node
                    oldpath = sm.$path[t = this.$pathslot];
                    sm.$path[t = this.$pathslot] = null;
                    if(--sm.$nodes == 0){ // trash it
                        delete parent.$cache[sm.$styleid];
                        parent.$trash[sm.$styleid] = sm;
                        parent.$pathdirty[sm.$uid] = sm;
                    }
                    if(sm.$free>t)sm.$free = t;
                }
                if(!(sm = parent.$cache[styleid])){   // no cache available
                    if(sm = parent.$trash[styleid]){ // found one in the trash
                        delete parent.$trash[styleid];
                    } else {
                        i = null;
                        for(i in parent.$trash)break; // find one in trash
                        if(i){
                            sm = parent.$trash[i];
                            delete parent.$trash[i];
                        } else {
                            isnew = 1;
                            sm = new this.shapemerge(parent,styleid);
                        }
                    }
                    parent.$cache[sm.$styleid=styleid] = sm;
                };
                sm.$nodes++;
                for(i = sm.$free,j = sm.$path, k = j.length;i<k && j[i]!=null;i++);
                sm.$free = (this.$pathslot = i)+1;
                if(oldpath){ // old shape
                    sm.$path[i] = oldpath;
                    if(!isnew)parent.$pathdirty[sm.$uid] = sm;
                }
                this.$shapemerge = sm
            }
            m = diffVisual(sm, st, sm.$isset, sm.$isdyn, c);
            if(m)sm.$styleVisual(m, sd_s, sd_d);
            sm.$isset = sd_s, sm.$isdyn = sd_d;  
        }
        if(c&0x7fffff00){ // we have path style changes
            this.$styleShape(diffShape(this,st,this.$isset, this.$isdyn, c), sd_s, sd_d);
            this.$isset = sd_s, this.$isdyn = sd_d;
        }
    }
    
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    // VML Vector implementation
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    //------------------------------------------------------------------------
    
    this.vml = new (function(){

        function shapemerge(parent, styleid){
            this.$styleid = styleid;
            this.$path = [];
            this.$parent = parent;
            this.$uid = parent.$guid++;
        };

        (function(){
            this.$nodes = this.$free = this.$_f  = this.$_s  = 
            this.$_z   = this.$uid = this.$domnode = 0;
            this.$_fo  =  this.$_so  = 1;
            
            var codecache = {};
            
            this.$styleVisual = function(m,s,d){
                if(m&0x1)
                    this.$c_f  = "if( (_t = ("+(d&0x1?this.$f:"this.$f")+"))!=this.$_f)_t==null?(v.firstChild.on='f'):((this.$_f==null?v.firstChild.on='t':0),v.firstChild.color = this.$_f = _t);\n";
                if(m&0x2)// stroke
                    this.$c_s  = "if( (_t = ("+(d&0x2?this.$s:"this.$s")+"))!=this.$_s)_t==null?(v.lastChild.on='f'):((this.$_s==null?v.lastChild.on='t':0),v.lastChild.color = this.$_s = _t);\n";
                if(m&0x8)// z-index
                    this.$c_z  = "if((_t=("+(d&0x8?this.$z:"this.$z")+"))!=this.$_z)v.style.zIndex = this.$_z = _t;\n";
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
                    "function _f(t){var v = this.$domnode;\n",
                        this.$c_fo,
                        this.$c_so,
                        this.$c_s,
                        this.$c_sw,
                        this.$c_f,
                        this.$c_z,
                    "}"
                ].join('');
                this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                
                if(this.$domnode){ // if we have a vmlnode, put ourself on the update list
                    this.$parent.$dirtynodes[this.$uid] = this;
                } else {
                    var vs,s;
                    (s=(this.$domnode=vs=document.createElement("av:shape")).style).position = 'absolute';
                    s.left = s.top = '0px';
                    s.width = s.height = '100%';
                    vs.appendChild(document.createElement("av:fill"));
                    vs.appendChild(document.createElement("av:stroke"));
                    this.$parent.$insertnodes.push(vs);
                    this.$update(0);
                }
            };
                        
            this.$join = function(){
                if(this.$domnode){
                    this.$domnode.path = this.$path.join('')||" ";
                    delete this.$parent.$dirtypaths[this.$uid];
                }
            }
        }).call(shapemerge.prototype);

        //------------------------------------------------------------------------
        // shape
        //------------------------------------------------------------------------

        function shape(st, parent, styleShape){
            this.$parent = parent;
            this.$styleShape = styleShape;
            this.$uid = parent.$uid++;
            this.style(st);
        };
        var i = 0;
        (function(){
            this.$_v = true;
            this.$x = this.$y = this.$w = this.$h = 0;
            this.shapemerge = shapemerge;
            this.style = shapeMergeStyle;
        }).call(shape.prototype);
        
        //-----------------------------------------------------------------------
        // Group
        //------------------------------------------------------------------------

        this.group = function(st, htmlroot){
            if(!this.$vmlInited){
                var css = "av\\:vmlframe {behavior: url(#default#VML);} av\\:fill {behavior: url(#default#VML);} av\\:stroke {behavior: url(#default#VML);} av\\:shape {behavior: url(#default#VML);} av\\:group {behavior: url(#default#VML);} av\\:path {behavior: url(#default#VML);}";
                apf.importCssString(css);
                document.namespaces.add("av","urn:schemas-microsoft-com:vml");
                this.$vmlInited = true;
            }
            return new group(st, null, htmlroot);
        };
        
        function group(st, parent, htmlroot){
            if(parent){
                parent.$groups.push(this); // need this for repaint
                parent.$insertnodes.push(this); // need this for init-vml-join
                this.$uid    = parent.$guid++;
                this.$parent = parent;
            } else {// we are rootnode.
                this.$uid = 0;
                this.$parent = this;
                this.$htmlroot = htmlroot;
            }
            this.$groups = [], this.$dirtynodes  = {}, this.$dirtypaths  = {};
            this.$insertnodes  = [], this.$cache = {}, this.$trash = {}; 
            if(st) this.style(st);
        };

        (function(){
            this.$guid = 1; 
            this.$domnode = null;
            this.$insert = false;
                   
            this.$x = this.$y = this.$w = this.$h = this.$r = 0;
            this.$v = true;
            
            this.repaint = function(){
                var d,i,l,v; 
                
                for(i in (d=this.$dirtynodes))
                    d[i].$update();

                for(i in (d=this.$dirtypaths))  
                    d[i].$join();
                
                for(i = 0, d = this.$groups,l = d.length;i<l;i++)
                    d[i].repaint();
                    
                if(this.$insertnodes.length){
                    v = this.$htmlroot?this.$domnode.firstChild:this.$domnode;
                    for(i = 0, d = this.$insertnodes, l = d.length;i<l;i++)
                        v.appendChild( d[i] );
                    d.length = 0;
                }

                if(this.$insert){
                    this.$insert = false;
                    this.$htmlroot.appendChild(this.$domnode);
                }
            }
            
            var codecache = {};
            this.$c_trans = "if( x!=this.$_x )v.style.left = this.$_x = x;\nif( y!=this.$_y )v.style.top = this.$_y = y;\nif( (w<0?(w=0):w)!=this.$_w )v.style.width = this.$_w = w;\nif( (h<0?(h=0):h)!=this.$_h )v.style.height = this.$_h = h;\n";
            this.$c_xywh  = "var x = this.$x, y = this.$y, w = this.$w, h = this.$h;\n";
            this.$c_vwh   = "if((_u=this.$_h,_t=this.$_w)!=this.$_vw||_u!=this.$_vh)v.coordsize=(this.$_vw=_t)+' '+(this.$_vh=_u);\n";
            this.$c_r     = "if((_t=this.$r%360)!=this.$_r)v.style.rotation = this.$_r = _t;\n";
            this.$c_z     = "";
            this.$c_vxy   = "";
              
            this.style = function(st){
                // run the stylediff
                var ss = style_short, c = 0, i, t;
                for(i in st)if(i.length>2){if(t=ss[i])st[t]=st[i],c|=ss[i];}else c|=ss[i];
                
                var m = diffGroup(this,st,this.$isset,this.$isdyn,c), s = sd_s, d = sd_d;

                if(m){
                    if(m&0x8)// z-index
                        this.$c_z  = "if((_t=("+(d&0x8?this.$z:"this.$z")+"))!=this.$_z)v.style.zIndex = this.$_z = _t;\n";

                    if(m&0x1)// fill
                        this.$c_f  = "if((_t=("+(d&0x8?this.$f:"this.$f")+"))!=this.$_f)v.style.backgroundColor = (this.$_f = _t)==null?'transparent':_t;\n";
                        
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
                        this.$c_vwh = "if((_u=this.$_h,_t=this.$_w)!=this.$_vw||_u!=this.$_vh)v.coordsize=(this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    else if(m&0xc00)  // vw or vh is modified
                        this.$c_vwh = "if((_u=("+(d&0x800?this.$vh:"this.$vh")+"),_t=("+(d&0x400?this.$vw:"this.$vw")+"))!=this.$_vw||_u!=this.$_vh)v.coordsize = (this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    
                    if(m&0x400000)// rotate modfied
                        this.$c_r = "if((_t=("+(d&0x400000?this.$r:"this.$r")+")%360)!=this.$_r)v.style.rotation=this.$_r=_t;\n";

                    if(m&0x20000000)// z-index modfied
                        this.$c_z = "if((_t=this.$z)!=this.$_z)v.style.zIndex=this.$_z=_t;\n";
                        
                    if(m&0x10000000){//visible modfied
                        this.$c_v = "if((_t=this.$v)!=this.$_v)v.style.display=(this.$_v=_t)?'block':'none';\n";
                    }
                    var code = [
                                "function _f(t){var v = this.$domnode,_t,_u,_v;\n",
                                this.$c_xywh,
                                this.$c_trans,
                                this.$c_z,
                                this.$c_v,
                                this.$c_f,
                                this.$htmlroot?"v = this.$domnode.firstChild;\n":"",    
                                this.$c_vxy,
                                this.$c_vwh,
                                this.$c_r,
                                "}"].join('');     
                    
                    this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                    
                    if(this.$domnode){ // if we have a vmlnode, put ourself on the update list
                        this.$parent.$dirtynodes[this.$uid] = this; 
                    }
                    else {// init
                        var vg,vd,s;
                        if(this.$htmlroot){
                            (s=(this.$domnode=vd=document.createElement("div")).style).position = 'absolute'
                            s.overflow = 'hidden';
                            (s=(vg=document.createElement("av:group")).style).position = this.$htmlroot==document.body?'absolute':'relative';
                            s.left = s.top = '0px';
                            s.width = this.$w;
                            s.height = this.$h;
                            vd.appendChild(vg);
                            this.$insert = true;
                        } else {
                            (this.$domnode=vg=document.createElement("av:group")).style.position = 'absolute';
                            this.$parent.$insertnodes.push(vg);
                        }
                        this.$update(0);
                    }
                    this.$isset = s, this.$isdyn = d;
                }
            }

            this.group = function(st){
                return new group(st,this);
            };  
        
            function styleRect(m,s,d){
                var w, vm = this.$shapemerge;
                vm.$path[this.$pathslot] = this.$_v?
                    ["M",~~this.$x,~~this.$y,
                        "R",w=~~this.$w,0,0,~~this.$h,
                        -w,0,"XE "].join(' ') : "";
                this.$parent.$dirtypaths[vm.$uid] = vm;
            }
        
            this.rect = function(st){
                var t = new shape(st, this, styleRect);
                return t;
            }
            
            function styleShape(m,s,d){
                var t;
                if((t=this.$_v?this.$p:"")!=this.$_p){
                    this.$shapemerge.$path[this.$pathslot] = this.$_p = t;
                    this.$parent.$dirtypaths[sm.$uid] = sm;
                }
            }            
            
            this.shape = function(st){
                var t = new shape(st, this, styleShape);
                return t;
            }
            
            this.circlePath = function(x,y,rx,ry){
                var u,v;
                return [
                    "AR",u=~~(x-rx),~~(y-ry),
                    ~~(x+rx),~~(y+ry),
                    u,~~y,u,~~y,
                    'XE'
                ].join(' ');
            }
        }).call(group.prototype);
                
    })();
    
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    // SVG vector lib implementation 
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    //-----------------------------------------------------------------------
    
    this.svg = new (function(){
        var svgns = "http://www.w3.org/2000/svg";
        
        function shapemerge(parent, styleid){
            this.$styleid = styleid;
            this.$path = [];
            this.$parent = parent;
            this.$uid = parent.$guid++;
        };

        (function(){
            this.$nodes = this.$free = this.$_f  = this.$_s  = 
            this.$_z   = this.$uid = this.$domnode = 0;
            this.$_fo  =  this.$_so = 1;
            var codecache = {};
            
            this.$styleVisual = function(m,s,d){
                if(m&0x1)
                    this.$c_f  = "if( (_t = ("+(d&0x1?this.$f:"this.$f")+"))!=this.$_f)v.setAttribute('fill', this.$_f = _t);\n";
                if(m&0x2)// stroke
                    this.$c_s  = "if( (_t = ("+(d&0x2?this.$s:"this.$s")+"))!=this.$_s)v.setAttribute('stroke', this.$_s = _t);\n";
//                if(m&0x8)// z-index
 //                   this.$c_z  = "if((_t=("+(d&0x8?this.$z:"this.$z")+"))!=this.$_z)v.style.zIndex = this.$_z = _t;\n";
                if(m&0x80)// stroke weight
                    this.$c_sw = "if( (_t = ("+(d&0x80?this.$sw:"this.$sw")+"))!=this.$_sw)v.setAttribute('stroke-width', this.$_sw = _t);\n";
                
                if( m&0x10 || (this.$isset^s)&0x60 ){ //o modified or fo/so had they set status changed
                    if(!(_t=s&0x60)) // fo/so both not set
                        this.$c_fo = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_fo)v.setAttribute('fill-opacity',this.$_fo = _t), v.setAttribute('stroke-opacity',_t);\n",
                        this.$c_so = "";
                    else if(_t == 0x20)// fo set, so assign o to so
                        this.$c_so = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_so)v.setAttribute('stroke-opacity',this.$_so =_t);\n";                    
                    else if(_t == 0x40)// so set so assign o to fo
                        this.$c_fo = "if( (_t = ("+(d&0x10?this.$o:"this.$o")+"))!=this.$_fo)v.setAttribute('fill-opacity',this.$_fo =_t);\n";
                }
                if( m&s&0x20) // fill opacity got set
                    this.$c_fo = "if( (_t = ("+(d&0x20?this.$fo:"this.$fo")+"))!=this.$_fo)v.setAttribute('fill-opacity',this.$_fo =_t);\n";
                if( m&s&0x40) // stroke opacity got set
                    this.$c_so = "if( (_t = ("+(d&0x40?this.$so:"this.$so")+"))!=this.$_so)v.setAttribute('stroke-opacity',this.$_so =_t);\n";
                    
                var code = [
                    "function _f(t){var v = this.$domnode;\n",
                        this.$c_fo,
                        this.$c_so,
                        this.$c_s,
                        this.$c_sw,
                        this.$c_f,
                        this.$c_z,
                    "}"
                ].join('');
                this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                
                if(this.$domnode){ // if we have a vmlnode, put ourself on the update list
                    this.$parent.$dirtynodes[this.$uid] = this;
                } else {
                    var vs = (this.$domnode=document.createElementNS(svgns,"path"));
                    this.$parent.$insertnodes.push(vs);
                    this.$update(0);
                }
            };
                        
            this.$join = function(){
                if(this.$domnode){
                    this.$domnode.setAttribute('d', this.$path.join('')||" ");
                    delete this.$parent.$dirtypaths[this.$uid];
                }
            }
        }).call(shapemerge.prototype);

        //------------------------------------------------------------------------
        // shape
        //------------------------------------------------------------------------

        function shape(st, parent, styleShape){
            this.$parent = parent;
            this.$styleShape = styleShape;
            this.$uid = parent.$uid++;
            this.style(st);
        };
        var i = 0;
        (function(){
            this.$_v = true;
            this.$x = this.$y = this.$w = this.$h = 0;
            this.shapemerge = shapemerge;
            this.style = shapeMergeStyle;
        }).call(shape.prototype);
        
        //-----------------------------------------------------------------------
        // Group
        //------------------------------------------------------------------------

        this.group = function(st, htmlroot){
            return new group(st, null, htmlroot);
        };
        
        function group(st, parent, htmlroot){
            if(parent){
                parent.$groups.push(this); // need this for repaint
                parent.$insertnodes.push(this); // need this for init-vml-join
                this.$uid    = parent.$guid++;
                this.$parent = parent;
            } else {// we are rootnode.
                this.$uid = 0;
                this.$parent = this;
                this.$htmlroot = htmlroot;
            }
            this.$groups = [], this.$dirtynodes  = {}, this.$dirtypaths  = {};
            this.$insertnodes  = [], this.$cache = {}, this.$trash = {}; 
            if(st) this.style(st);
        };

        (function(){
            this.$guid = 1; 
            this.$domnode = null;
            this.$insert = false;
                   
            this.$x = this.$y = this.$w = this.$h = this.$r = 0;
            this.$v = true;
            
            this.repaint = function(){
                var d,i,l,v; 
                
                for(i in (d=this.$dirtynodes))
                    d[i].$update();

                for(i in (d=this.$dirtypaths))
                    d[i].$join();
                
                for(i = 0, d = this.$groups,l = d.length;i<l;i++)
                    d[i].repaint();
                    
                if(this.$insertnodes.length){
                    v = this.$domnode;
                    for(i = 0, d = this.$insertnodes, l = d.length;i<l;i++)
                        v.appendChild( d[i] );
                    d.length = 0;
                }

                if(this.$insert){
                    this.$insert = false;
                    this.$htmlroot.appendChild(this.$domnode);
                }
            }
            
            var codecache = {};
            this.$c_trans = "if( x!=this.$_x )v.style.left = this.$_x = x;\nif( y!=this.$_y )v.style.top = this.$_y = y;\nif( (w<0?(w=0):w)!=this.$_w )v.setAttribute('width',this.$_w = w);\nif( (h<0?(h=0):h)!=this.$_h )v.setAttribute('height', this.$_h = h);\n";
            this.$c_xywh  = "var x = this.$x, y = this.$y, w = this.$w, h = this.$h;\n";
            this.$c_r     = "if((_t=this.$r%360)!=this.$_r)this.$_r = _t;\n";
            this.$c_z     = "";

            this.style = function(st){
                // run the stylediff
                var ss = style_short, c = 0, i, t;
                for(i in st)if(i.length>2){if(t=ss[i])st[t]=st[i],c|=ss[i];}else c|=ss[i];
                
                var m = diffGroup(this,st,this.$isset,this.$isdyn,c), s = sd_s, d = sd_d;

                if(m){
                    if(m&0x8)// z-index
                        this.$c_z  = "if((_t=("+(d&0x8?this.$z:"this.$z")+"))!=this.$_z)v.style.zIndex = this.$_z = _t;\n";

                 if(m&0x1)// fill
                      this.$c_f  = "if((_t=("+(d&0x8?this.$f:"this.$f")+"))!=this.$_f)v.style.backgroundColor = (this.$_f = _t)==null?'transparent':_t;\n";
                        
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
                                    "if((_t=",(s&0x110000)==0x110000?"x*(_u="+(d&0x10000?this.$sx:"this.$sx")+")+(1-_u)*(x+("+(d&0x100000?this.$cx:"this.$cx")+")*w)":"x",s&0x40000?"+("+(d&0x40000?this.$ox:"this.$ox")+")":"",")!= this.$_x )v.setAttribute('x',this.$_x=_t);\n",
                                    "if((_t=",(s&0x220000)==0x220000?"y*(_v="+(d&0x20000?this.$sy:"this.$sy")+")+(1-_v)*(y+("+(d&0x200000?this.$cy:"this.$cy")+")*h)":"y",s&0x80000?"+("+(d&0x80000?this.$oy:"this.$oy")+")":"",")!= this.$_y )v.setAttribute('y',this.$_y=_t);\n",
                                    "if(((_t=",s&0x10000?(s&0x100000?"w*_u":"w*("+(d&0x10000?this.$sx:"this.$sx")+")"):"w",")<0?0:_t)!=this.$_w)v.setAttribute('width',this.$_w=_t);\n",
                                    "if(((_t=",s&0x20000?(s&0x200000?"h*_v":"h*("+(d&0x20000?this.$sy:"this.$sy")+")"):"h",")<0?0:_t)!=this.$_h)v.setAttribute('height',this.$_h=_t);\n"
                                ].join('');
                        } else   
                            delete this.$c_trans; // default transform
                    }
                    /*
                    if(m&0x300) // check if vx or vy is modified
                        this.$c_vxy = "if((_u=("+(d&0x200?this.$vy:"this.$vy")+"),_t=("+(d&0x100?this.$vx:"this.$vx")+"))!=this.$_vx||_u!=this.$vy)(this.$vx=_t)+' '+(this.$_vy=_u);\n";
                    
                    if(!(s&0xc00) && (m&0xc000)) // when we dont have vwh set but we do have wh modified:
                        this.$c_vwh = "if((_u=this.$_h,_t=this.$_w)!=this.$_vw||_u!=this.$_vh)v.viewBox='0 0'+(this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    else if(m&0xc00)  // vw or vh is modified
                        this.$c_vwh = "if((_u=("+(d&0x800?this.$vh:"this.$vh")+"),_t=("+(d&0x400?this.$vw:"this.$vw")+"))!=this.$_vw||_u!=this.$_vh)v.viewBox = '0 0'+(this.$_vw=_t)+' '+(this.$_vh=_u);\n";
                    
                    if(m&0x400000)// rotate modfied
                        this.$c_r = "if((_t=("+(d&0x400000?this.$r:"this.$r")+")%360)!=this.$_r)v.style.rotation=this.$_r=_t;\n";
*/
                    if(m&0x20000000)// z-index modfied
                        this.$c_z = "if((_t=this.$z)!=this.$_z)v.style.zIndex=this.$_z=_t;\n";
                        
                    if(m&0x10000000){//visible modfied
                        this.$c_v = "if((_t=this.$v)!=this.$_v)v.style.display=(this.$_v=_t)?'block':'none';\n";
                    }
                    var code = [
                        "function _f(t){var v = this.$domnode,_t,_u,_v;\n",
                            this.$c_xywh,
                            this.$c_trans,
                            this.$c_z,
                            this.$c_v,
                            this.$c_f,
                            this.$c_vxyw,
                            this.$c_r,
                        "}"
                    ].join('');     
                    this.$update = codecache[code] || (codecache[code] = apf.lm_exec.compile(code));
                    if(this.$domnode){ // if we have a vmlnode, put ourself on the update list
                        this.$parent.$dirtynodes[this.$uid] = this;
                    }
                    else {// init
                        var vg = this.$domnode = document.createElementNS(svgns,"svg");
                        if(this.$htmlroot == document.body)
                            vg.style.position = 'absolute'
                        if(this.$htmlroot)
                            this.$insert = true;
                        else 
                            this.$parent.$insertnodes.push(vg);
                        this.$update(0);
                    }
                    this.$isset = s, this.$isdyn = d;
                }
            }

            this.group = function(st){
                return new group(st,this);
            };  
        
            function styleRect(m,s,d){
                var w, vm = this.$shapemerge;
                vm.$path[this.$pathslot] = this.$_v?
                    ["M",~~this.$x,~~this.$y,
                        "l",w=~~this.$w,0,0,~~this.$h,
                        -w,0,"Z "].join(' ') : "";
                this.$parent.$dirtypaths[vm.$uid] = vm;
            }
        
            this.rect = function(st){
                var t = new shape(st, this, styleRect);
                return t;
            }
            
            function styleShape(m,s,d){
                var t, sm = this.$shapemerge;
                if((t=this.$_v?this.$p:"")!=this.$_p){
                    sm.$path[this.$pathslot] = this.$_p = t;
                    this.$parent.$dirtypaths[sm.$uid] = sm;
                }
            }            
            
            this.shape = function(st){
                var t = new shape(st, this, styleShape);
                return t;
            }
            
            this.circlePath = function(x,y,rx,ry){
                var u,v;
                return [
                    "M",u=~~(x+rx),~~y,
                    "A",~~rx,~~ry,0,1,0,u,~~(y+1),"Z"
                ].join(' ');
            }
            
        }).call(group.prototype);
                
    })();
 });

 //#endif 
