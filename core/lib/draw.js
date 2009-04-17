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

/**
 * @private
 */
jpf.namespace("draw", {
    
    initDriver : function(){
        // initialize by copying either canvas of VML into my object.
        if(!this.initLayer){
            var k,o=jpf.supportVML?jpf.draw.vml:jpf.draw.canvas;
            for(k in o){
                this[k]=o[k];
            } 
        }
    },

    //----------------------------------------------------------------------
    
    // vars
    
    //----------------------------------------------------------------------
     
    vars : function(ml,mt,mr,mb){
        return ["var  _math_,vx1 = v.vx1, vy1 = v.vy1,_rseed=1",
                ",vx2 = v.vx2, vy2 = v.vy2, vw = vx2-vx1, vh = vy1-vy2",
                ",vz2 = v.vz2, vz1 = v.vz1, vd = vz2-vz1",
                ",zoom = 1/v.zoom",
                ",dw = l.dw",ml?"-"+(ml+mr):"",
                ",dh = l.dh",mt?"-"+(mt+mb):"",
                ",dw12 = dw*0.5, dh12 = dh*0.5",
                ",dx = ",ml?ml:0,
                ",dy = ",mt?mt:0,
                ",mx = m&&m.x, my = m&&m.y",
                ",db = dy+dh, dr = dx+dw",
                ",tw = dw/vw, th = dh/vh, ty = -vy2*th+dy, tx = -vx1*tw+dx",
                ",v,t=0,n=(new Date()).getTime()*0.001, dt=-(l._n?l._n:n)+(l._n=n), z = 1/l.zoom",
                ",e=Math.E, p=Math.PI, p2=2*p, p12=0.5*p",
                ",x, y, z, _x,_y,_z, zt, i, j, k, _opt_;"].join('');
    },
    defCamVec : function(){
        // lets do a proper 3x3 inverse and mul it with our camera pos
        return  "var inv=1/m00*(m11*m22-m12*m21)-m01*(m10*m22-m12*m20)+m02*(m10*m21-m11*m20);"+
                "var mcx = inv*(m11*m22-m12*m21)*m03 + inv*(m02*m21-m01*m22)*m13 + inv*(m01*m12-m02*m11)*m23,"+
                "    mcy = inv*(m12*m20-m10*m22)*m03 + inv*(m00*m22-m02*m20)*m13 + inv*(m02*m10-m00*m12)*m23,"+
                "    mcz = inv*(m10*m21-m11*m20)*m03 + inv*(m01*m20-m00*m21)*m13 + inv*(m00*m11-m01*m10)*m23;"
            //        "    mcz         m10*m13+m20*m23,mcy=m01*m03+m11*m13+m21*m23,mcz=m02*m03+m12*m13+m22*m23;";
    },
    setMatrix3D : function(m){
        var l = this.l;
        var s = ["var m00=",m[0],",m01=",m[1],",m02=",m[2], ",m03=",m[3],
                    ",m10=",m[4],",m11=",m[5],",m12=",m[6], ",m13=",m[7],
                    ",m20=",m[8],",m21=",m[9],",m22=",m[10],",m23=",m[11],";"];
        if(l.style.persp<0){ // we have ortho perspective
            this.ortho = 1;
            s.push("var persp = __max(dw,dh) / l.style.persp/-v.tz, perspd = persp / ",l.ds,";");
        } else {
            this.ortho = 0;
            s.push("var persp = __max(dw,dh) / l.style.persp, perspd = persp / ",l.ds,";");
        }
        return s.join('');
    },

    sincos3 : function(pre,rx,ry,rz){
      return[ "var ",pre,"cx = __cos(",rx,"),",pre,"sx = __sin(",rx,"),",
                     pre,"cy = __cos(",ry,"),",pre,"sy = __sin(",ry,"),",
                     pre,"cz = __cos(",rz,"),",pre,"sz = __sin(",rz,");" ].join('');
    },
    matrix4S : function(sx,sy,sz){
      return [ sx,0,0,0,
               0,sy,0,0,
               0,0,sz,0, 
               0,0,0,1 ];
    },
    matrix4T : function(tx,ty,tz){
      return [ 1,0,0,tx,
               0,1,0,ty,
               0,0,1,tz, 
               0,0,0,1 ];
    },
    matrix4RP : function(pre){
        return this.matrix4R(pre+'cx',pre+'sx',pre+'cy',pre+'sy',pre+'cz',pre+'sz');
    },
    matrix4R : function(cx,sx,cy,sy,cz,sz){
        return [ [cy,'*',cz].join(''), 
                 ['(-',sz,'*',cy,')'].join(''), 
                 sy,  
                 0,
                 ['(',cz,'*',sx,'*',sy,'+',sz,'*',cx,')'].join(''),
                 ['(-',sx,'*',sy,'*',sz,'+',cx,'*',cz,')'].join(''),
                 ['(-',sx,'*',cy,')'].join(''), 
                 0,
                 ['(-',cx,'*',sy,'*',cz,'+',sx,'*',sz,')'].join(''),
                 ['(',cx,'*',sy,'*',sz,'+',cz,'*',sx,')'].join(''),
                 ['(',cx,'*',cy,')'].join(''), 
                 0,
                 0,0,0,1];
    },
    matrixMul : function(){
        // lets multiply matrices on our arglist with conceptually ordered transform
        var m = arguments[arguments.length-1];
        for(var i = arguments.length-2;i>=0;i--)
            m = this.matrixAB(m,arguments[i]);
        return m;
    },
    matrixAB : function(a,b){
        var out = [], x, y, i, j, t, v;
        for(y = 0;y<16;y+=4){
            for(x = 0;x<4;x++){
                v = [];
                if((i=a[y])  &&(j=b[x])   ) v[v.length] = i==1?j:(j==1?i:(i+'*'+j));
                if((i=a[y+1])&&(j=b[x+4]) ) v[v.length] = i==1?j:(j==1?i:(i+'*'+j));
                if((i=a[y+2])&&(j=b[x+8]) ) v[v.length] = i==1?j:(j==1?i:(i+'*'+j));
                if((i=a[y+3])&&(j=b[x+12])) v[v.length] = i==1?j:(j==1?i:(i+'*'+j));
                out[out.length] = v.length?((v.length>1)?'('+v.join('+')+')':v[0]):0;
            }
        }
        return out;
    },

    // check for backface for a certain plane
    backface3D : function(pts,cm,zmode){
        var a = pts[0], b = pts[1], c = pts[2], x = 0, y = 1, z = 2;
        if(cm) x = cm[0], y = cm[1], z = cm[2];
        return this.ortho?[
            "-((m00*",b[x],"+m01*",b[y],"+m02*",b[z],"+m03)-(__ax=m00*",a[x],"+m01*",a[y],"+m02*",a[z],"+m03))*",
        "((m10*",c[x],"+m11*",c[y],"+m12*",c[z],"+m13)-(__ay=m10*",a[x],"+m11*",a[y],"+m12*",a[z],"+m13))+",
        "((m10*",b[x],"+m11*",b[y],"+m12*",b[z],"+m13)-__ay)*((m00*",c[x],"+m01*",c[y],"+m02*",c[z],"+m03)-__ax)"].join(''):
        [
        "(((__by=m10*",b[x],"+m11*",b[y],"+m12*",b[z],"+m13) - (__ay=m10*",a[x],"+m11*",a[y],"+m12*",a[z],"+m13)) *",
        "((__cz=m20*",c[x],"+m21*",c[y],"+m22*",c[z],"+m23) - (__az=m20*",a[x],"+m21*",a[y],"+m22*",a[z],"+m23)) -",
        "((__bz=m20*",b[x],"+m21*",b[y],"+m22*",b[z],"+m23) - __az) * ((__cy=m10*",c[x],"+m11*",c[y],"+m12*",c[z],"+m13) - __ay) ) * ",
        "(__ax=m00*",a[x],"+m01*",a[y],"+m02*",a[z],"+m03) + ",
        "((__bz - __az) * ((__cx=m00*",c[x],"+m01*",c[y],"+m02*",c[z],"+m03) - __ax) -",
        "((__bx=m00*",b[x],"+m01*",b[y],"+m02*",b[z],"+m03) - __ax) * (__cz - __az) ) * __ay + ",
        "((__bx - __ax) * (__cy - __ay) - (__by - __ay) * (__cx - __ax) ) * __az "].join('');
    },

    //----------------------------------------------------------------------
        
    text3D : function( p, cm, zc, text) {
        var i = 0, d, pt, q, s = ["__n=0;"], x = 0, y = 1, z = 2, sx, sy, vx, vy, vxi, vyi;
        if(cm) x = cm[0], y = cm[1], z = cm[2];        

        // lets project, clip and print
        return [
            "if((__z = m20*",p[x],"+m21*",p[y],"+m22*",p[z],"+m23) < ",zc,"){",
               this.text(["dw12+(m00*",p[x],"+m01*",p[y],"+m02*",p[z],"+m03)*",this.ortho?"persp":"(persp/__z)"].join(''),
                       ["dh12+(m10*",p[x],"+m11*",p[y],"+m12*",p[z],"+m13)*",this.ortho?"persp":"(persp/__z)"].join(''),text),
            "}"
        ].join('');
   },
    
    // 3D API
    // draw a 3D polygon clipped against a z-plane
    poly3DClip : function(idx,pt,cm,zc,open){
        var i = 0, d, pt, q, s = ["__n=0;"], x = 0, y = 1, z = 2, sx, sy, vx, vy, vxi, vyi;
        if(cm) x = cm[0], y = cm[1], z = cm[2];            

        //calculate z-clipping info for each vertex
        for(var i = 0;i<idx.length;i++){    
            p = pt[idx[i]];
            s.push(["if(__n",i,"=(__z",i," = m20*",p[x],"+m21*",p[y],"+m22*",p[z],"+m23) < ",zc,")__n++;"].join(''))
        }
         s.push("if(__n){",
                "if(__n==",idx.length,"){");
        // the nonclipped draw
        for(var i = 0;i<idx.length;i++){    
            p = pt[idx[i]];
            vx = ["dw12+(m00*",p[x],"+m01*",p[y],"+m02*",p[z],"+m03)*",this.ortho?"persp":"(persp/__z"+i+")"].join('');
            vy = ["dh12+(m10*",p[x],"+m11*",p[y],"+m12*",p[z],"+m13)*",this.ortho?"persp":"(persp/__z"+i+")"].join('');
            if(i==0)s.push(this.moveTo(vx,vy));
            else s.push(this.lineTo(vx,vy));
        }
        if(!open)s.push(this.close());
        s.push("}else{");
        
        // the clipped draw
        for(var i = 0;i<idx.length;i++){
            p = pt[idx[i]];
            // if we are number index 0 we only move to 
            if(i==0){ // first vertex
              s.push([
                "__x0=m00*",p[x],"+m01*",p[y],"+m02*",p[z],"+m03;",
                "__y0=m10*",p[x],"+m11*",p[y],"+m12*",p[z],"+m13;",
                "if( __o=__n0){",
                    this.moveTo("dw12+__x0*"+(this.ortho?"persp":"(persp/__z0)"),"dh12+__y0*"+(this.ortho?"persp":"(persp/__z0)")),
                "}"].join(''));
            } else { // all other vertices
                s.push([
                "__xn=dw12+(__x",i,"=m00*",p[x],"+m01*",p[y],"+m02*",p[z],"+m03)*",(this.ortho?"persp;":"(persp/__z"+i+");"),
                "__yn=dh12+(__y",i,"=m10*",p[x],"+m11*",p[y],"+m12*",p[z],"+m13)*",(this.ortho?"persp;":"(persp/__z"+i+");"),
                "if( __n",i," && !__n",i-1," || !__n",i,"&& __n",i-1,"){", // we visible and prev not or prev inv and we not
                    "__z=(__zc=(",zc,"-__z",i-1,")/(__z",i,"-__z",i-1,")) * __z",i,"+(__ze=1-__zc)* __z",i-1,";",
                    "__xi=dw12+(__zc*__x",i,"+__ze* __x",i-1,")*",(this.ortho?"persp":"(persp/__z)"),";",
                    "__yi=dh12+(__zc*__y",i,"+__ze* __y",i-1,")*",(this.ortho?"persp":"(persp/__z)"),";",
                    "if(!__o){__o=true;",
                        this.moveTo("__xi","__yi"),
                    "}else{",
                        this.lineTo("__xi","__yi"),
                    "}",
                "}",
                "if( __n",i,"){",
                    this.lineTo("__xn","__yn"),
                "}"].join(''));
            }
            if(i==idx.length-1){
                s.push([ // termination step
                    "if(!__n0 && __n",i," || __n0 && ! __n",i,"){",
                        // do a lineto to the interp pos between last element and us
                        "__z=(__zc=(",zc,"-__z",i,")/(__z0-__z",i,")) * __z0+(__ze=1-__zc)* __z",i,";",
                        this.lineTo(["dw12+(__zc*__x0+__ze* __x",i,")*",(this.ortho?"persp":"(persp/__z)")].join(''),
                                    ["dh12+(__zc*__y0+__ze* __y",i,")*",(this.ortho?"persp":"(persp/__z)") ].join('')),
                    "}",
                open?"":this.close()].join(''));
            } 
        }
        s.push("}};");
        return s.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
    },
    // draw a 3D polygon
    poly3D : function(indices,pts,fl){
        // we want rects between:
        // first we count the doubles
        var v,f=1,i,j = 0,d,pt,q,s = [],
            cc = new Array(pts.length),
            cf = new Array(pts.length), 
            f0, f1, f2;
        if(fl) f0 = fl[0], f1 = fl[1], f2 = fl[2];
        else f0 = 0, f1 = 1, f2 = 2;
        // calculate which values are used more than once to cache them
        for( i = 0;i<indices.length;i++){
            d = indices[i];    if(d>=0) cc[d]++;
        }
        for( i = 0;i<pts.length;i++){
            if(cc[i]>1)cc[i] = j++;
            else cc[i]=0;
        }
        for(var i = 0;i<indices.length;i++){
            d = indices[i];
            if(d>=0){
                pt = pts[d];
                q=[this.ortho?"":
                    "zt = persp / (m20*"+pt[f0]+"+m21*"+pt[f1]+"+m22*"+pt[f2]+"+m23);",
                    "dw12+(m00*"+pt[f0]+"+m01*"+pt[f1]+"+m02*"+pt[f2]+"+m03)*"+
                        (this.ortho?"persp":"zt"),
                    "dh12+(m10*"+pt[f0]+"+m11*"+pt[f1]+"+m12*"+pt[f2]+"+m13)*"+
                        (this.ortho?"persp":"zt")];
                d = f?0:i;
                if(cc[d])q[1]= "__t"+cc[d]+(cf[d]?"":"="+q[1]), 
                         q[2]= "__t"+cc[d]+(cf[d]++?"":"="+q[2]);
            }; 
            switch(d){
                case -1: f=1;s.push( this.close() );break;
                case 0: f=0;s.push( q[0], this.moveTo(q[1],q[2]) ); break;
                case indices.length-1: s.push( q[0], this.lineTo(q[1],q[2]), 
                    this.close() );break;
                default: s.push( q[0], this.lineTo(q[1],q[2]) ); break;
            }
        }
        return s.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
    },
    lineTo3D : function(x,y,z,sx,sy,fl){
        return this.$do3D("lineTo",x,y,z,sx,sy,fl);
    },
    moveTo3D : function(x,y,z,sx,sy,fl){
        return this.$do3D("moveTo",x,y,z,sx,sy,fl);
    },
    
    $store3D : function(x,y){
      return x+";"+y+";";
    },
    store3D : function(x,y,z,sx,sy,fl){
        return this.$do3D("$store3D",x,y,z,sx,sy,fl);
    },
    $do3D : function(f,x,y,z,sx,sy,fl){
        var _x,_y,_z;
        if(typeof x == 'string' && x.match(/[\[\]\*\+\-\/]/))x="(_x="+x+")",_x="_x";
        else x="("+x+")",_x=x;
        if(typeof y == 'string' && y.match(/[\[\]\*\+\-\/]/))y="(_y="+y+")",_y="_y";
        else y="("+y+")",_y=y;
        if(typeof z == 'string' && z.match(/[\[\]\*\+\-\/]/))z="(_z="+z+")",_z="_z";
        else z="("+z+")",_z=z;
        if(fl){
            var v = [x,y,z], _v = [_x,_y,_z];
            x = v[_x=fl[0]], y = v[_y=fl[1]], z = v[_z=fl[2]];
            _x = _v[_x], _y = _v[_y], _z = _v[_z];
        }        
        var r = [];
        if(!this.ortho)r.push("zt =persp/(m20*"+x+"+m21*"+y+"+m22*"+z+"+m23);");
        r.push(this[f]( (sx===undefined?"":sx)+
              "dw12+(m00*"+_x+"+m01*"+_y+"+m02*"+_z+"+m03)*"+(this.ortho?"persp":"zt"),
              (sy===undefined?"":sy)+
              "dh12+(m10*"+_x+"+m11*"+_y+"+m12*"+_z+"+m13)*"+(this.ortho?"persp":"zt") ) );
        return r.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
    },
    
    //----------------------------------------------------------------------
    // Style parsing
    //----------------------------------------------------------------------
     
    parseStyle : function( style, str, err ) {
        var o = {}, k1, v1, k2, v2, t, s, i, len, _self = this;
        // first we parse our style string
        if ( (o = this.parseJSS(str,err)) === null ) return null;
        jpf.alert_r(o.axis);
        var _self = this;
        if(!(t=_self.stateTransition)[0x40001]){
            s = {};
            for(v1 in t)for(i = 0;i<64;i++)s[v1|i]=t[v1]|i;
            _self.stateTransition = s;
            // alert( (n[p]|i).toString(16) );
        }
        
        function styleinit(d){
            if(d.line === null || d.line=='null') delete d.line;
            if(d.fill === null || d.fill=='null') delete d.fill;
            if(d.family === null || d.family=='null') delete d.family;

            if( (d.isshape && d.fill === undefined && 
                d.line === undefined && d.tile === undefined) || 
                (d.isfont && d.family === undefined) ) return false; 
            if(d.isshape){
                d.alpha = d.alpha!==undefined ? d.alpha : 1;
                d.fillalpha = d.fillalpha!==undefined ? d.fillalpha:d.alpha;
                d.gradalpha = d.gradalpha!==undefined ? d.gradalpha:d.fillalpha;
                d.linealpha = d.linealpha!==undefined ? d.linealpha:d.alpha;
                d.angle = d.angle!==undefined ? d.angle : 0;
                d.weight = d.weight!==undefined ? d.weight : 1
            }
            return true;
        }
        
        function objtohash(a){
            // this spits out an object as a comparable hash
           var k,v,n=[],s=[],i;
           for(k in a)if(k.indexOf('$')==-1)n[n.length]=k;
           n.sort();
           for(i = n.length-1;i>=0;i--){
              s[s.length] = k = n[i];
              if( (k=typeof(v = a[k])) == 'object') s[s.length] = objtohash(v);
              else if(k=='array') s[s.length] = v.join('');
              else s[s.length] = v;//String(v);
           }
           return s.join('');
        }
        
        function objinherit(d, s){
            var k,v,n;
            for(k in s)if(k.indexOf('$')==-1){
                if( typeof(v=s[k]) == 'object' && v!==null ){
                    if(typeof(n=d[k]) !='object') n = d[k] = {};
                    objinherit(n, v);
                }else if(d[k] === undefined)d[k] = v;
            }
        }
        
        function stylecopy(root, d, s, noinit){
            if(!s)return;
            var k,v,t,n,m,w,p,h,q,u,o,x,y,z,r,g;
            for(k in s){
                if( typeof(v=s[k]) == 'object' && v!==null ){
                    if(typeof(n=d[k]) !='object') n = d[k] = {};
                    stylecopy(root, n, v);
                }else if(d[k] === undefined)
                    d[k] = _self.isDynamic(v)?_self.parseJSS(v):v;
            }
            if(t=s.inherit){
                stylecopy( root, d, root['$'+t]||root[t]||_self['$'+t], 1);
            }

            if(!( d.isshape || d.isfont) ){
               
                // inventory classes and states we have styles for
                p=[];
                for(k in d)if( typeof(v=d[k])=='object' && 
                    !(n=null) && ( (m=k.split(':')).length>1 || (n=k.split('.')).length>1 ) ){
                    if(n && typeof(t=d[n[0]])=='object'){
                        v.$base=n[0],v.$class=n[1];
                        if(!(w=t.$classmap))w=t.$classmap=[],t.$base=v.$base,t.$isbase=1;
                        w[w.length] = (n[1].split(':'))[0];
                    }else if(m && typeof(t=d[m[0]])=='object' && m[0].indexOf('.')==-1){
                        v.$base=m[0],v.$state=m[1];
                        if(!(w=t.$statemap))w=t.$statemap=[],p[p.length]=t,t.$base=v.$base,t.$isbase=1;
                        w[w.length] = m[1];                    
                    }
                }
                // copy base states to class states
                for(k=p.length-1;k>=0;--k){
                    if( (v = p[k]).$classmap  && !v.nocopy) {
                        // lets copy our states to the other classes
                        m = v.$statemap, n = v.$classmap, w=v.$base;
                        for(t=m.length-1;t>=0;--t){
                            for(u=n.length-1;u>=0;--u){
                                if(!d[o = w+'.'+n[u]+':'+m[t]]){
                                    objinherit( o=d[o]={}, d[w+':'+m[t]] ); 
                                    o.$base = w, o.$class = n[u], o.$state = m[t];
                                }
                            }
                        }
                    }
                }
                // do all inheritance of classes and states
                for(k in d)if( typeof(v=d[k])=='object' && v && (o=v.$base) ){
                    m = v.$state,n = v.$class;
                    if(!v.nobase){
                        while(m=_self.$stateInherit[m]){
                            if( (n && (t=d[o+'.'+n+(m==1?'':':'+m)])) || 
                                (t=d[o+(m==1?'':':'+m)]))
                                objinherit(v, t);
                        }
                    }
                    if((t = d[o]) && n)objinherit(v,t);
                    // lets see if we are pointless
                    if(!t.nomerge){
                        if(!(n=t.$merge))n=t.$merge={};
                        if(!n[m=objtohash(v)])n[m] = v;
                        else v.$merged = n[m];
                    }
                    // 
                }
                // hurrah now lets go and create the hashmaps CODECOMPLEXITY++
                n = _self.stateBit, q = _self.$stateFallback;
                for(k in d)if( typeof(v=d[k])=='object' && v && (v.isshape||v.isfont) ){
                    
                    var shadow = d[k+'.shadow'];
                    if(v.$isbase){
                        w = v.$statehash = {}, y = v.$statelist = [],
                        r = v.$storelist = [], h = v.$speedhash={};
                        delete v.$merge;delete v.$merged;
                        
                        m = v.$classmap || [], u = v.$base;
                        m.unshift(null); // add 'normal' state
                        for(i=m.length-1;i>=0;--i){
                            t=u+((t=m[i])?'.'+t:'');
                            for(p in n){
                                o = p;
                                while(!(x = d[ g=(o!=0?t+':'+o:t) ]))
                                    if(!(o=q[o]))break;
                                    
                                if(x && (x.$class!='shadow' || x.$state)){ // it has a special rendertarget
                                    while(x.$merged) x = x.$merged;
                                    if(!x.$isbase){
                                        if(!x.$inlist){
                                            g = x.$store = [];
                                            x.$inlist = 1;
                                            x.join = o!=0?t+':'+o:t;
                                            if(x.$class) y.unshift(x),r.unshift(g) ;
                                            else y[y.length]=x, r[r.length]=g;
                                        }
                                        if(!(o = w[z=(n[p]|i)] = x.$store).base &&
                                            x.overlay)o.base = (m[i]?d[t]:0) || {};
                                        if(z&0x36EC0000)o.trans=x.trans=1;
                                        h[z] = x.speed || 1;
                                    }else if(shadow)w[n[p]|i] = {};
                                }
                            }
                        }
                        if(shadow){// if we have a shadow class so we need to shuffle some stuff around
                            g = v.$store = [];
                            // add our shadow to all the classes to be a baseclass
                            for(x = 0, p = r.length; x<p; x++)
                                r[x].base = ((m=y[x].$state)?((m=d[k+'.shadow:'+m])?m.$store:0):0)||{} 
                            for(x in w)if(!w[x].sort)w[x] = g;

                            r.unshift(g),y.unshift(v),g.base = {},w[0] = g;
                            v.$shadow = shadow;
                            shadow.$statelist = v.$statelist,shadow.$statehash = v.$statehash;
                            shadow.$storelist = v.$storelist,shadow.$speedhash = v.$speedhash;
                        }
                        // lets dump this shite
                        
                    }
                    // remove if we aint active
                    if( !styleinit(v) ) delete d[k];
                    
                }
            }
        }
        stylecopy( style, o, style, 1 );
        
        // for each base object, we need to create the subobject maps and state luts
        // _statelut[state]->arrays
        // _statelist[] all states except the base in order of layering
        // _basemap[..name..] -> baseID a map from name to ID
        // _transition[..state..] -> transitory map including baseID's
        
        
        //jpf.alert_r(o);
        return o;
    },
    /*
    stateBit : {
        0                  : 0,
        'hidden'           : 0x40000000,
        'init'             : 0x20000000,
        'deinit'           : 0x10000000,
        'hover'            : 0x08000000,
        'hover-in'         : 0x04000000,
        'hover-out'        : 0x02000000,
        'select'           : 0x01000000,
        'select-in'        : 0x00800000,
        'select-out'       : 0x00400000,
        'select-hover'     : 0x00200000,
        'select-hover-in'  : 0x00100000,
        'select-hover-out' : 0x00080000,
        'animating'        : 0x00040000
    },*/
    stateBit : {
        0                   : 0,
        'init'              : 0x01000000, // 0xff0000 == statetype
        'hidden'            : 0x00010000, // 0x0f000000 == dynamic type 0 = no dyn, 1 = in, 2 = out, 3 = inout
        'deinit'            : 0x02000000, // 0xf0000000 == automated-return-type
        'hover'             : 0x00020000,
        'hover-in'          : 0x01020000,
        'hover-inout'       : 0x11020000,
        'hover-out'         : 0x02020000,
        'select'            : 0x00030000,
        'select-in'         : 0x01030000,
        'select-inout'      : 0x11030000,
        'select-out'        : 0x02030000,
        'select-hover'      : 0x00040000,
        'select-hover-in'   : 0x01040000,
        'select-hover-inout': 0x11040000,
        'select-hover-out'  : 0x02040000,
        'animating'         : 0x10050000
    },

    stateTransition : {
        0x01000000 : 0,
        0x02000000 : 0x00010000,
        0x01020000 : 0x00020000,
        0x11020000 : 0x02020000,
        0x02020000 : 0,
        0x01030000 : 0x00030000,
        0x11030000 : 0x02030000,
        0x02030000 : 0,
        0x01040000 : 0x00040000,
        0x11040000 : 0x02040000,
        0x02040000 : 0x00030000,
        0x01050000 : 0x01050000
    },
    
    stateMask : {
        'selected' : 0x01000000|0x00800000|0x00200000|0x00100000|0x00080000,
        'normal'   : 0x20000000|0x08000000|0x04000000|0x02000000|0x00040000,
        'dynamic'  : 0x20000000|0x10000000|0x04000000|0x02000000|0x00800000|
                     0x00400000|0x00100000|0x00080000|0x00040000,
        'hover'    : 0x08000000|0x04000000|0x00200000|0x00100000
    },
    
    
    $stateInherit : {
        'hidden'           : 1,       
        'init'             : 1,
        'deinit'           : 1,
        'hover'            : 1,
        'hover-in'         : 'hover',
        'hover-out'        : 'hover',
        'select'           : 1,
        'select-in'        : 'select',
        'select-out'       : 'select',
        'select-hover'     : 'hover',
        'select-hover-in'  : 'select-hover',
        'select-hover-out' : 'select-hover',
        'animating'        : 1
    },

    $stateFallback : {
        'init'              : 1,
        'hover'             : 1,
        'hover-in'          : 'hover',
        'hover-inout'       : 'hover-in',
        'hover-out'         : 1,
        'select'            : 1,
        'select-in'         : 'select',
        'select-inout'      : 'select-in',
        'select-out'        : 1,
        'select-hover'      : 'hover',
        'select-hover-in'   : 'select-hover',
        'select-hover-inout': 'select-hover-in',
        'select-hover-out'  : 'select',
        'hidden'            : 1
    },
    
    getXYWH : function( m, p, noflatten ){
        var t;
        if(!( (t=this.$getXYWH_NT[p]) || (p=this.$getXYWH_TN[t=p]) ))return '0';
        if(m==null)return '0';
        if(typeof(m)=='object'){
            if(m.sort) return --p>=m.length?'0':( (t=m[p]) && t.sort && !noflatten ? t.join(''): t);
            return (t=m[t])===undefined||p>1?'0':(t && t.sort && !noflatten ? t.join('') : t);
        }
        return p==1?m:'0';
    },
    $getXYWH_NT : {1:'x',2:'y',3:'z',4:'w'},
    $getXYWH_TN : {'x':1,'y':2,'z':3,'w':4},

    getTRBL : function( m, p, noflatten ){
        var t;
        if(!( (t=this.$getTRBL_NT[p]) || (p=this.$getTRBL_TN[t=p]) ))return '0';
        if(m==null)return '0';
        if(typeof(m)=='object'){
            if(m.sort) return --p>=m.length?'0':( (t=m[p]) && t.sort && !noflatten ? t.join(''): t);
            return (t=m[t])===undefined||p>1?'0':(t && t.sort && !noflatten ? t.join('') : t);
        }
        return p==1?m:'0';
    },
    $getTRBL_NT : {1:'t',2:'r',3:'b',4:'l'},
    $getTRBL_TN : {'t':1,'y1':1,'r':2,'x2':2,'b':3,'y2':3,'l':4,'x1':4},
    
    getFlat : function( m ){
        if(typeof(m)=='object' && m.sort) return m.join('');
        return m;
    },
    
    getColor : function (a) {
        if(a.match(/\(/)) return a;
        if(a.match(/^#/)) return "'"+a+"'";
        var b = a.toLowerCase();
        return (this.colors[b])?"'"+this.colors[b]+"'":a;
    },
    getX : function( s, pre, val, post, def){    
        var v; return (typeof(v=s[val+'-x'])=='undefined' && 
               (typeof(v=s[val])!='object' || typeof(v=v[0])=='undefined'))?
               (typeof(def)!='undefined'?def:''):(pre+v+post);
    },
    getY : function( s, pre, val, post, def, ovl){    
        var v; return (typeof(v=s[val+'-y'])=='undefined' && 
               (typeof(v=s[val])!='object' || typeof(v=v[1])=='undefined'))?
               (typeof(def)!='undefined'?def:''):(pre+v+post);
    },
   checkX : function( s, val, ovl, no){    
        var v; return (typeof(v=s[val+'-x'])=='undefined' && 
               (typeof(v=s[val])!='object' || typeof(v=v[0])=='undefined'))?
               (typeof(no)=='undefined'?'':no):ovl;
    },
   checkY : function( s, val, ovl, no){    
        var v; return (typeof(v=s[val+'-y'])=='undefined' && 
               (typeof(v=s[val])!='object' || typeof(v=v[1])=='undefined'))?
               (typeof(no)=='undefined'?'':no):ovl;
    },

    isDynamic : function( a ) {
        // check if we have a dynamic property.. how?
        return a && typeof(a)=='string' && 
              !(a.indexOf('.')!=-1 && a.match(/^[\s:a-zA-Z0-9\/\\\._-]+$/)) && 
               a.match(/[\(+*\/-]/)!=null;
    },
    
    optimize : function( code ){
        var c2,c3,s=[],cnt={},n=0;
        // first we need to join all nested arrays to depth 2
        if(typeof(code) == 'object'){
            code = code.join('');
        /*     for(var i = code.length-1;i>=0;i--)
                if(typeof(c2=code[i]) == 'object'){
                    for(var j=c2.length-1;j>=0;j--)
                        if(typeof(c3=c2[j]) == 'object')
                            c2[j] = c3.join('');
                    code[i] = c2.join('');
                }*/
        }
        // find used math functions and create local var
        code.replace(/\_\_(\w+)/g,function(m,a){
            if(!cnt[a]) {
                if(a.length<=2)s.push("__"+a);
                else s.push("__"+a+"=Math."+a);
                cnt[a]=1;
            }
        });
       
        // optimize out const parseInt and const math-operations
        code = code.replace(/(__(\w+))\((\-?\d+\.?\d*)\)/g,
            function(m,a,b,c){
            if(a=='__round')return Math.round(c);
            return Math[b](c);
        });
        
        
        //code = code.replace(/__round\((_d[xy])\)/g,"$1"); 
        //code = code.replace(/\(0\)\+/g,""); 
        
        //TODO pull out 0 multiplication
        //code = code.replace(/\+0\s*([\;\,\)])/g,"$1"); 
        
        if(code.match('_rndtab'))s.push('_rndtab=jpf.draw.$rndtab');
        //code = code.replace(/\(([a-z0-9\_]+)\)/g,"$1");
         
        code = s.length ? code.replace(/\_math\_/,s.join(',')): code;
       
        cnt = {},n = 0, s=[];
        /*
        code = code.replace(/(m\d\d\*)\(?(\-?\d+(?:\.\d+))?\)/g,function(m,a,b){
            var t = a+b;
            if(cnt[t] === undefined){
                s.push("_mo"+n+"="+t);
                return cnt[t]="_mo"+(n++);
            }
            return cnt[t];
        });
        */
        code = s.length ? code.replace(/\_opt\_/,s.join(',')): code;
        code = code.replace(/__round\((d[wh])\)/g,"$1"); 
        
        return code;
    },
    
    parseJSS : function(s,err){
        if(!s)return{};
        var lp = 0, sm = 0, t, i, len, fn = 0, sfn  = [],  arg = [], sarg = [], 
            ac = [], sac = [], sn=[], obj = {}, prop = 0, sobj = [],
             _self = this, mn={1:'}',2:')',3:']',4:')',5:'}'}, rn={'{':1,'(':2,'[':3}, ln=6;
        try{
                s=s.replace(/\/\*[\S\s]*?\*\/|\/\/.*?;/g,'');
                s.replace(/(["'])|([\w\.\_-]+\:?[\w\_-]*)\s*\{\s*|([\w\_-]+)\s*[:]+\s*|([\w\_-]+)\s*\(\s*|([({\[])|([)}\]])|(\\["'{}\[\](),;\:]|\s*[\<\>\=*+\%@&\/]\s*|\s*\-\s+)|([,\s]+)|(;)|$/g, 
                    function(m,str,openobj,openval,openmac,open,close,skip,sep,split,pos){
                    /*log( ln+' - '+(str?' str:'+str:'')+(word?' word:'+word:'')+(openw?' openw:'+openw:'')+
                    (open?' open'+open:'')+(close?' close:'+close:'')+(sep?' sep:##'+sep+'#':'')+
                    (split?' split:'+split:'')+(end?' end:'+end:'')+'  pos:'+pos+'\n');*/
                if(skip)return m;
                if(sm || str) {
                    if(str && !sm)sm = str;
                    else if(sm==str)sm = 0;
                    return m;
                }
                if( sep ){
                    ac.push(s.slice(lp,pos));arg.push(ac.join(''));lp=pos+sep.length,ac=[]; 
                    return m;
                }
                if( openval ){
                    if(ln>=5){
                        ln = 6, prop = openval, lp = pos+m.length;arg=[],ac=[];
                    }
                    return m;
                }
                if( openmac){
                    sn.push(ln=4);
                    if(pos>lp)ac.push( s.slice(lp,pos) );
                    sac.push(ac); sarg.push(arg);
                    sfn.push(fn); fn = openmac;
                    arg = [], ac = [], lp = pos+m.length;
                    return m;
                }
                if(openobj){
                    if(ln<5)throw({t:"JSS Error - object scope found inside macro",p:pos});
                    lp = pos+m.length; sn.push(ln=5);
                    sobj.push(obj); obj = obj[openobj] = {};
                    return m;
                }
                if( open ){ 
                    sn.push(ln=rn[open]);
                    if(ln==1 && prop){
                        sn.pop();
                        lp = pos+m.length; sn.push(ln=5);
                        sobj.push(obj); obj = obj[prop] = {};
                    }else if(ln==3){
                        if(pos>lp)ac.push( s.slice(lp,pos) );
                        sac.push(ac); sarg.push(arg);
                        arg = [], ac = [], lp = pos+open.length;
                    } 
                    return m;
                }
                if( close ){
                    if( !sn.length || mn[ln=sn.pop()] != close){
                        throw({t:"JSS Error - closed "+ln+" with "+close,p:pos});
                        log();
                    }
                    switch(ln){
                        case 3: // closed an array
                            ac.push(s.slice(lp,pos));arg.push(ac.join(''));
                            if(sarg.length!=1){ // append as string
                                (ac=sac.pop()).push( '[',arg.join(','),']' );
                                arg = sarg.pop();
                            }
                            else { // append as array
                                sac.pop();t = sarg.pop();ac=[];
                                for(i = 0,len=arg.length;i<len;i++)t.push(arg[i]);
                                arg = t;
                            }
                            lp = pos+close.length;
                            break;
                        case 4: // closed a macro
                            ac.push(s.slice(lp,pos));arg.push(ac.join(''));
                            (ac=sac.pop()).push( (t=_self[fn])?t.apply( _self, 
                            arg ) : arg.join(',') );
                            arg = sarg.pop(), fn = sfn.pop(), lp = pos+1;
                            break;
                         case 5: // closed an object
                            ac.push(s.slice(lp,pos));arg.push(ac.join(''));lp = pos+close.length, ac = []; 
                            if(prop)obj[prop] = arg.length>1?arg:arg[0];
                            arg=[], prop=null, obj = sobj.pop();
                            break;
                    }
                    if(!sarg.length)ln=6;
                    return m;
                }
                if( ln>=5 ){
                    ac.push(s.slice(lp,pos));
                    if((t=ac.join('')).length)arg.push(t);
                    lp = pos+m.length, ac = [];
                    if(prop)obj[prop] = arg.length>1?arg:arg[0];
                    else if(t && sn.length==0)obj = arg.length>1?arg:arg[0];
                    arg=[],prop=null;
                }
                return m;
            });
            if(sm)throw({t:"JSS Error - Unclosed string found "+sm,p:lp});
            if(sn.length>0)throw({t:"JSS Error - Unclosed object found "+sn[sn.length-1],p:lp});
        }catch(e){
            jpf.alert_r(e);
            if(err)err.v = e.p>=0 ? e.t+" at: "+e.p+" ->"+s.slice((t=e.p-4)<0?0:t,7)+"<-" : e.t;
            return null;
        }
        return obj;
    },
     
	sin : function(a){return "__sin("+a+")";},
	cos : function(a){return "__cos("+a+")";},
	tan : function(a){return "__tan("+a+")";},
	asin : function(a){return "__asin("+a+")";},
	acos : function(a){return "__acos("+a+")";},
	atan : function(a){return "__atan("+a+")";},
	atan2 : function(a){return "__atan2("+a+")";},
	floor : function(a){return "__floor("+a+")";},
	exp : function(a){return "__exp("+a+")";},
	log : function(a){return "__log("+a+")";},
	pow : function(a,b){return "__pow("+a+","+b+")";},
	random : function(a){return "__random("+a+")";},
	round : function(a){return "__round("+a+")";},
	sqrt : function(a){return "__sqrt("+a+")";},
	$pal : function(imode,n){
		// alright this is a color interpolation function, we got n arguments 
		// which are string colors, hexcolors or otherwise and we need to write an interpolator
		var s=[
		"'#'+('000000'+(__round(",
		"((__a=parseInt((__t=["];
		for(var i = 2, len=arguments.length;i<len;i++){
			var t = arguments[i];
			// check what t is and insert
			s.push(i>2?",":"");
			if(jpf.draw.colors[t])
				s.push( "'", jpf.draw.colors[t], "'" );
			else if(t.match(/\(/))
				s.push(t);
			else if(t.match(/^#/))
				s.push( "'", t, "'" );
			else
				s.push(t);
		}
		s.push(
			"])[ __floor( __c=(__f=(",n,")",imode?"*"+(len-3):"",
			")<0?-__f:__f)%",len-2,"].slice(1),16))&0xff)",
			"*(__d=1-(__c-__floor(__c)))",
			"+((__b=parseInt(__t[ __ceil(__c)%",len-2,
			"].slice(1),16))&0xff)*(__e=1-__d) )",
			"+(__round(__d*(__a&0xff00)+__e*(__b&0xff00))&0xff00)",
			"+(__round(__d*(__a&0xff0000)+__e*(__b&0xff0000))&0xff0000)",
			").toString(16)).slice(-6)");
		return s.join('');
	},

	$lut : function(imode,n){
		var s=["(["],a, i = 2, len = arguments.length;
		for(;i<len;i++){
			a = arguments[i];s.push(i>2?",":"");
			if(typeof(a)=='string' && a.match(/\(/) || a.match(/^['"]/))
				s.push(a);
			else s.push("'",a,"'");
		}
		s.push("])[__floor((__b=((",n,")",imode?"*"+(len-3):"",
			")%",len-2,")<0?-__b:__b)]");
		return s.join('');
	},
	
	$lin : function(imode,n){
		var s=["((__t=["],a, i = 2,len=arguments.length;
		for(;i<len;i++){
			a = arguments[i]; s.push(i>2?",":"");
			if(typeof(a)=='string' && a.match(/\(/) || a.match(/^['"]/))
				s.push(a);
			else s.push("'",a,"'");
		}
		s.push("])[__floor( __c=(__f=(",n,")",imode?"*"+(len-3):"",
			")<0?-__f:__f)%",len-2,"]",
			"*(__d=1-(__c-__floor(__c)))",
			"+__t[ __ceil(__c)%",len-2,
			"]*(__e=1-__d) )");
		return s.join('');
	},

	fixed : function(a,v,nz){
		v = "parseFloat(("+a+").toFixed("+v+"))";
		return parseInt(nz)?this.nozero(a,v):v;
	},
	padded : function(a,v,nz){
		v = "("+a+").toFixed("+v+")";
		return parseInt(nz)?this.nozero(a,v):v;
	},
	abs : function(a){
		if(parseFloat(a)==a)return Math.abs(a);
		if(typeof(a) == 'number' || a.match(/$[a-z0-9_]+^/))
			return "("+a+"<0?-"+a+":"+a+")";
		return "((__t="+a+")<0?-__t:__t)";
	},
	min : function(a,b){
		if(b===null)return a; 
		if(parseFloat(a)==a && parseFloat(b)==b)return Math.min(a,b);
		var a1=a,b1=b,a2=a,b2=b;
		if(typeof(a) == 'string' && !a.match(/$-?[a-z0-9\_]+^/))a1="(__a="+a+")", a2="__a";
		if(typeof(b) == 'string' && !b.match(/$-?[a-z0-9\_]+^/))b1="(__b="+b+")", b2="__b";
		return "(("+a1+")<("+b1+")?"+a2+":"+b2+")";
	},
	max : function(a,b){
		if(b===null)return a; 
		if(parseFloat(a)==a && parseFloat(b)==b)return Math.max(a,b);
		var a1=a,b1=b,a2=a,b2=b;
		if(typeof(a) == 'string' && !a.match(/$-?[a-z0-9\_]+^/))a1="(__c="+a+")", a2="__c";
		if(typeof(b) == 'string' && !b.match(/$-?[a-z0-9\_]+^/))b1="(__d="+b+")", b2="__d";
		return "(("+a1+")>("+b1+")?"+a2+":"+b2+")";
	},
	clamp : function(a,b,c){
		if(b===null||c==null)return a; 
		return this.max(this.min(a,c),b);
	},  
	pal : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(1);
		return this.$pal.apply(this,arg);
	},
	pali : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(0);
		return this.$pal.apply(this,arg);
	},
	lin : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(1);
		return this.$lin.apply(this,arg);
	},
	lini : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(0);
		return this.$lin.apply(this,arg);
	},
	lut : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(1);
		return this.$lut.apply(this,arg);
	},
	luti : function(){
		var arg = Array.prototype.slice.call(arguments,0);arg.unshift(0);
		return this.$lut.apply(this,arg);
	},
	$rgbpack : function( r,g,b){
		return ('#'+('000000'+(((r<0?0:(r>255?255:parseInt(r)))<<16)+
				((g<0?0:(g>255?255:parseInt(g)))<<8)+
				((b<0?0:(b>255?255:parseInt(b))))).toString(16)).slice(-6));
	},
	rgb : function(r,g,b){
		if(parseFloat(r)==r && parseFloat(g)==g && parseFloat(b)==b)
			return this.$rgbpack(r,g,b);
		return ["('#'+('000000'+(",
				   (parseFloat(r)==r?((r<0?0:(r>255?255:parseInt(r)))<<16):
				   "(((__t="+r+")<0?0:(__t>255?255:parseInt(__t)))<<16)"),"+",
				   (parseFloat(g)==g?((g<0?0:(g>255?255:parseInt(g)))<<8):
				   "(((__t="+g+")<0?0:(__t>255?255:parseInt(__t)))<<8)+"),"+",
				   (parseFloat(b)==b?((b<0?0:(b>255?255:parseInt(b)))):
				   "(((__t="+b+")<0?0:(__t>255?255:parseInt(__t))))"),
				   ").toString(16)).slice(-6))"].join('');
	},
	$hsvpack : function(h,s,v){
		 var i, m=v*(1-s), 
			 n=v*(1-s*((i=Math.floor(((h<0?-h:h)%1)*6))?h-i:1-(h-i)));  
		 
		 switch (i) 
		 {  
		  case 6:  
		  case 0: return this.$rgbpack(v, n, m);  
		  case 1: return this.$rgbpack(n, v, m);  
		  case 2: return this.$rgbpack(m, v, n);
		  case 3: return this.$rgbpack(m, n, v);  
		  case 4: return this.$rgbpack(n, m, v);  
		  default:
		  case 5: return this.$rgbpack.rgb(v, m, n);  
		}
	},
	hsv : function(h,s,v){
		if(parseFloat(r)==r && parseFloat(g)==g && parseFloat(b)==b)
			return this.$hsvpack(r,g,b);
		return "jpf.draw.$hsvpack("+h+","+s+","+v+");";
	},
	rgbf : function(r,g,b){
		return this.rgb(parseFloat(r)==r?r*255:"255*("+r+")",
						parseFloat(g)==g?g*255:"255*("+g+")",
						parseFloat(b)==b?b*255:"255*("+b+")");
	},
	nozero : function(a,v,z){
		return "(("+a+")>-0.0000000001 && ("+a+")<0.0000000001)?"+
			(z!==undefined?z:"''")+":("+(v!==undefined?v:a)+")";
	},    
	$rndtab : null,
	rnd : function(a){
		if(a){
			if( !this.$rndtab ){
				var i, t = this.$rndtab = Array( 256 );
				for(i = -256;i<256;i++)t[i] = Math.random();
			}
			return "_rndtab[__round(("+a+")*255)%255]";
		}
		return "((_rseed=(_rseed * 16807)%2147483647)/2147483647)"
	},
    ang : function(a){
        if(a == parseFloat(a))return a * (Math.PI / 180);
        //alert("("+a+"(p/180))");
        return "(("+a+")*p/180)";
    },
	snap : function(a,b){
		return "(__round(("+a+")/(__t=("+b+")))*__t)";
	},
	rnds : function(a,b){
		return this.rnd(this.snap(a,b));
	},
	tsin : function(a){
		return "(0.5+0.5*__sin("+a+"))"; 
	},
	tcos : function(a){
		return "(0.5+0.5*__cos("+a+"))"; 
	},
	usin : function(a){
		return "(0.5-0.5*__sin("+a+"))"; 
	},
	ucos : function(a){
		return "(0.5-0.5*__cos("+a+"))"; 
	},        
	two : function(a){
		return "(0.5+0.5*("+a+"))"; 
	},
    fontz : function(a,b) {
        // we multiply b*l.ds and then 
        return (-a/b)+(this.ortho?"*perspd":"*(perspd/__z)");
    },

    $equalStyle : function( a, b){
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

    $shape : {
        isshape : true,
        line : null,
        fill : null,
        tilex:'(this.tilex)',
        tiley:'(this.tiley)'
    },

    $font : {
        isfont : true,
        height : 12,
        family : "verdana",
        weight : "normal",
        color : "#00000",
        size : 10
    },    

    //----------------------------------------------------------------------
    
    // Generic rendering
    
    //----------------------------------------------------------------------
    
    draw3D : function(x,y,z,w,h,d){
        return '';
    },

    //----------------------------------------------------------------------
    
    beginMouseState : function( style, sthis, func, nargs ){
        var s = [], l = this.l;

        this.mousestyle = style;
        this.mousethis = sthis;
        this.mousefunc = func;
        this.mousestates = [];
        var v = style.$statelist, i, j, t, u;
        if(!v || !v.length) return '';
        
        v = this.mousestates = v.slice(0);
        if(v[0]!=style)
            v.unshift(style);

        if(!l._mousestyles)l._mousestyles = [];
        for(i = 0, j = v.length;i<j;i++){
           u = (t=v[i])._mid = l._mousestyles.push(t)-1;
           if(t.$store)t.$store._mid = u;
        }
        
        s.push("_s = l._mousestyles[",style._mid,"], _sh = _s.$statehash, _sp = _s.$speedhash;");
        
        return s.join('');
    },
    
    checkMouseState:function(state,time) {
        var a=[],t,i,j,v = this.mousestates, s;

        if(!v || !v.length){
            for(i = 2, j = arguments.length;i<j;i++)a.push(arguments[i]);
            a.push(true);
            this.style = this.mousestyle;
            s = this.mousefunc.apply(this.mousethis,a);
            this.style = 0;
            return s;
        }
        s = ["t=(n-",time,")*(_sp[_t=_sh[",state,"]]||100000);"];
        for(i = 2, j = arguments.length;i<j;i++){
            a.push( t = "_s"+(i-1) );
            s.push( t,"=",arguments[i],(i!=j-1)?",":";");
        }
        a.push(true);
        
        s.push("switch(_t?_t._mid:0){" );
        for(i = 0, j = v.length;i<j;i++){
            style = v[i]; 
            //alert(jpf.vardump(style).replace(/\t/g,'@').replace(/\n/g,'#'));
            this.style = style;
            if(v[i])
                s[s.length]=[
                "case ",style._mid,":{","/*"+jpf.vardump(style,0,1)+"*/\n",
                     this.mousefunc.apply(this.mousethis,a),
                "}break;"].join('');
        }
        s.push("};");
        this.style = 0;
        return s.join('');
    },
    
    $endMouseState : function(){
        this.mousestyle = 0;
        return '';
    },
    
    //----------------------------------------------------------------------
    
    drawPart : function(x,y,w,h,rs,rw,m){
        var t = this.style;
        var ds = '0', dw = '1';
        var gx = this.getX, gy = this.getY, cx = this.checkX, cy = this.checkY;
        switch(t.shape){
            default:
            case 'pie':
                if(gx(t,'','scale','','1')!='1'){
                    rs=['_x5=(',gx(t,'(','offset',')+'),'(',rs,')','+',
                        gx(t,'(','center',')','0.5'),'*(_x3=',rw,')',
                        gx(t,'*(1-(_x4=','scale','))'),')*p2'].join('');
                    rw='_x5+(_x3*_x4)*p2';
                }else{
                    rs = ['_x5=(',gx(t,'(','offset',')+'),'(',rs,')',')*p2'].join('');
                    rw = '_x5+('+rw+')*p2';
                }   
                if(gy(t,'','scale','','1')!='1'){
                    ds=[gy(t,'(','offset',')+'),gy(t,'(','center',')','0.5'),
                       gy(t,'*(1-(_y4=','scale','))')].join('');
                    dw='_y4';
                }else{
                    ds = [gy(t,'(','offset',')','0')].join('');
                    dw = '1';
                }
                // lets draw an ellipse with rs and rw phases
                // now we have an offset y and a size y how do we deal with that?
                if(ds!='0'){
                    x = "_x6=__sin(_y8=((_x9="+rs+")+(_y9="+rw+"))*0.5)*(_x8="+
                                    ds+")*(_x7="+w+")+("+x+")"+gx(t,'+_x7*(','move',')');
                    y = "_y6=__cos(_y8)*_x8*(_y7="+h+")+("+y+")"+gy(t,'+_y7*(','move',')');
                    w = '_x7*(_x3='+dw+')';
                    h = '_y7*_x3';
                    rs = '_x9';
                    rw = '_y9';
                }else{
                    x = "_x6=("+x+")";
                    y = "_y6=("+y+")";
                    w = dw=='1'?'('+w+')':'('+w+')*(_x3='+dw+')';
                    h = dw=='1'?'('+h+')':'('+h+')*_x3';
                }
                if(m){
                    return [
                        "if( ((_x1=((",x,")-mx)/(",w,"))*_x1+(_y1=((",y,")-my)/(",h,"))*_y1) < 1 ){",
                            "_x1=(p+__atan2(_x1,_y1));",
                            "if( ((_x2=(",rs,")%p2)<0?(_x2=p2-_x2):_x2) >",
                                "((_y2=(",rw,")%p2)<0?(_y2=p2-_y2):_y2) ){",
                                "if(_x1 >= _x2 || _x1<=_y2 )return x;",
                            "}else{",
                                "if(_x1 >= _x2 && _x1<=_y2 )return x;",
                            "}",
                        "}"
                    ].join('');
                }else{
                    return [
                        this.moveTo(x,y),
                        this.ellipse('_x6','_y6',w,h,rs,rw,1),
                        this.close()].join('');
                }
                /*
                if(gx(t,'','scale','','1')!='1'){
                    rs=['_x5=(',gx(t,'(','offset',')+'),'(',rs,')','+',
                        gx(t,'(','center',')','0.5'),'*(_x3=',rw,')',
                        gx(t,'*(1-(_x4=','scale','))'),
                        gx(t,'+_x3*(','move',')'),')*p2'].join('');
                    rw='_x5+(_x3*_x4)*p2';
                }else{
                    rs = ['_x5=(',gx(t,'(','offset',')+'),'(',rs,')',
                          gx(t,'+(_x3='+rw+')*(','move',')'),')*p2'].join('');
                    rw = '_x5+('+cx(t,'move','_x3',rw)+')*p2';
                }   
                if(gy(t,'','scale','','1')!='1'){
                    ds=[gy(t,'(','offset',')+'),gy(t,'(','center',')','0.5'),
                       gy(t,'*(1-(_y4=','scale','))'),gy(t,'+(','move',')')].join('');
                    dw='_y4';
                }else{
                    ds = [gy(t,'(','offset',')','0'),gy(t,'+(','move',')')].join('');
                    dw = '1';
                }
                // lets draw an ellipse with rs and rw phases
                // now we have an offset y and a size y how do we deal with that?
                if(ds!='0'){
                    return [
this.moveTo("_x6=__cos(_y8=((_x9="+rs+")+(_y9="+rw+"))*0.5)*(_x8="+ds+")*(_x7="+w+")+("+x+")",
                                    "_y6=__sin(_y8)*_x8*(_y7="+h+")+("+y+")"),
                        this.ellipse( '_x6','_y6','_x7*(_x3='+dw+')','_y7*_x3','_x9','_y9',1),
                        this.close()].join('');
                }else{
                    return [
                        this.moveTo("_x6=("+x+")","_y6=("+y+")"),
                        this.ellipse( '_x6','_y6',dw=='1'?'('+w+')':'('+w+')*(_x3='+dw+')',
                                     dw=='1'?'('+h+')':'('+h+')*_x3',rs,rw,1),
                        this.close()].join('');
                }*/
        }
    },
    
    //----------------------------------------------------------------------
    
    draw2D : function(x,y,w,h,m){
        // css stylable drawing
        var t = this.style;
        var gx = this.getX, gy = this.getY, cx = this.checkX, cy = this.checkY;
        function rect(){
            if(gx(t,'','scale','','1')!='1'){
                x=[gx(t,'(','offset',')+'),'(',x,')','+',gx(t,'(','center',')','0.5'),'*(_x3=',w,')',
                   gx(t,'*(1-(_x4=','scale','))'),gx(t,'+_x3*(','move',')')].join('');
                w='_x3*_x4';
            }else{
                x = [gx(t,'(','offset',')+'),'(',x,')',gx(t,'+(_x3='+w+')*(','move',')')].join('');
                w = cx(t,'move','_x3',w);
            }   
            if(gy(t,'','scale','','1')!='1'){
                y=[gy(t,'(','offset',')+'),'(',y,')','+',gy(t,'(','center',')','0.5'),'*(_y3=',h,')',
                   gy(t,'*(1-(_y4=','scale','))'),gy(t,'+_y3*(','move',')')].join('');
                h='_y3*_y4';
            }else{
                y = [gy(t,'(','offset',')+'),'(',y,')',gy(t,'+(_y3='+h+')*(','move',')')].join('');
                h = cy(t,'move','_y3',h);
            }   
        }
        switch(t.shape){
            case 'rect':
            default:
                if(!t.rotate){
                    rect();
                    return this.rect(x,y,w,h);
                }else{
                    return  [
                     '_x9=(_x8=(_x6=',gx(t,'(','center',')','0.5'),'*(_x3=',w,'))*(',gx(t,
                          '(1-(_x4=','scale','))','0'),'-1))+_x3',cx(t,'scale','*_x4'),';',
                     '_y9=(_y8=(_y6=',gy(t,'(','center',')','0.5'),'*(_y3=',h,'))*(',gy(t,
                          '(1-(_y4=','scale','))','0'),'-1))+_y3',cy(t,'scale','*_y4'),';',
                     this.moveTo('(_cr=__cos(_t='+t.rotate+'))*_x8-(_sr=__sin(_t))*_y8+(_x5='+
                                 gx(t,'(','offset',')+')+x+'+_x6)','_sr*_x8+_cr*_y8+(_y5='+
                                 gy(t,'(','offset',')+')+y+'+_y6)'),
                     this.lineTo('_cr*_x9-_sr*_y8+_x5','_sr*_x9+_cr*_y8+_y5'),
                     this.lineTo('_cr*_x9-_sr*_y9+_x5','_sr*_x9+_cr*_y9+_y5'),
                     this.lineTo('_cr*_x8-_sr*_y9+_x5','_sr*_x8+_cr*_y9+_y5'),
                     this.close()
                    ].join('');
            }
            case 'circle':{
                rect();
                return t.pie?[
                    this.moveTo('_x6='+x+'+'+'(_x5=0.5*('+w+'))','_y6='+y+'+'+'(_y5=0.5*('+h+'))'),
                    this.ellipse('_x6','_y6','_x5','_y5',gx(t,'','range','' ),gy(t,'','range','' ) ),
                    this.close()].join(''):[
                    this.ellipse(x+'+'+'(_x5=0.5*('+w+'))',y+'+'+'(_y5=0.5*('+h+'))',
                                 '_x5','_y5',gx(t,'','range','' ),gy(t,'','range','' ) ),
                    this.close()].join('');
            }break;
             case 'polygon':{
                if(t.frames){
                    
                }else{
                    return [
                        "_x3=((_x2=",gy(t,"","range","","2*p"),
                        ")-(_x1=",gx(t,'','range','','0'),"))/(",t.steps||10,");v=_x1;",
                        this.moveTo("(_x4="+x+")+__sin(_x1)*(_x5="+w+")",
                                    "(_y4="+y+")+__cos(_x1)*(_y5="+h+")"),
                        "for(v=_x1+_x3;v<_x2;v+=_x3){",
                            this.lineTo("_x4+__sin(_x1)*_x5",
                                        "_y4+__cos(_x1)*_y5"),
                        "}",
                        this.close()
                    ].join('');
                }
            }break;
            case 'math':{
                if(t.frames){
                    // expand shape
                }else{
                    rect();
                    return [
                        "_x7=((_x6=",gy(t,"","range","","2*p"),
                        ")-(_x5=",gx(t,'','range','','0'),"))/(",t.steps||10,");v=_x5;",
                        this.moveTo("(_x8="+x+")+"+gx(t,"(","path",")","0")+"*(_x9="+w+")",
                                    "(_y8="+y+")+"+gy(t,"(","path",")","0")+"*(_y9="+h+")"),
                        "for(v=_x5+_x7;v<_x6;v+=_x7){",
                            this.lineTo("_x8"+gx(t,"+(","path",")*_x9"),
                                        "_y8"+gy(t,"+(","path",")*_y9")),
                        "}",
                        this.close()
                    ].join('');
                }
            }break;
        }
        return '';
    },
    
    $endDraw : function() {
        if(this.mousemode){
            return this.$endMouse();
        }
        if(this.statemode){
            return this.$endState();
        }
        var t = this.style;
        if(t){
            if(t.isshape)
                return this.$endShape();
            if(t.isfont)
                return this.$endFont();
        }
        return '';
    },
    
    //----------------------------------------------------------------------
    
    // HTML Text output
    
    //----------------------------------------------------------------------
         
    
    // generic htmlText
    beginFont: function( style, needed, ml,mt,mr,mb ) {
        if(!style || needed===undefined)return "document.title='beginFont Failed';";
        var l = this.l, html = l._htmljoin, s=[this.$endDraw()];
        this.style = style;
        style._id = l._styles.push(style)-1;

        ml = ml!==undefined?ml/l.ds:0;
        mt = mt!==undefined?mt/l.ds:0;
        mr = mr!==undefined?mr/l.ds:0;
        mb = mb!==undefined?mb/l.ds:0;
       
       
        if(parseInt(style.left)!=style.left) this.mx = "+("+style.left+")"+(ml?"-"+ml:"");
        else this.mx = "+"+(style.left-ml);
        if(parseInt(style.top)!=style.top) this.my = "+("+style.top+")"+(mt?"-"+mt:"");
        else this.my = "+"+(style.top-mt);
        // find a suitable same-styled other text so we minimize the textdivs
        /*
        for(i = l._styles.length-2;i>=0;i--){
            if(!l._styles[i]._prev && 
                jpf.draw.equalStyle( l._styles[i], style )){
                style._prev = i;
                break;
            }
        }
        s
        if(style._prev===undefined){*/
        this.dynsize = (parseInt(style.size)!=style.size);
        style._txtdiv = ["<div style='",
                (style.vertical)?
                "filter: flipv() fliph(); writing-mode: tb-rl;":"",
    "position:absolute;cursor:default;overflow:hidden;left:0;top:0;display:none;font-family:",
                style.family, ";color:",style.color,";font-weight:",
                style.weight,";",";font-size:",this.dynsize?10:style.size,"px;",
                (style.line!==undefined)?"border:1px solid "+style.line+";" : "",
                (style.fill!==undefined)?"background:"+style.fill+";" : "",

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
               ")) > _tn.length-_tc)jpf.draw.$allocText(_s,_l);");
        return s.join('');
    },
    
    text : function( x, y, text) {
        var t = ((this.l.ds>1)?"/"+this.l.ds:"");
        return ["if( (_t=_tn[_tc++]).s!=(_v=",text,") )_t.v.nodeValue=_t.s=_v;",
                "if(_t.x!=(_v=__round(",x,")))_t.n.style.left=_t.x=(_v",t,this.mx,")+'px';",
                "if(_t.y!=(_v=__round(",y,")))_t.n.style.top=_t.y=(_v",t,this.my,")+'px';",
                this.dynsize?[
                    "if(_t.sz!=(_v=__round(",this.style.size,"))&&_v>0)_t.n.style.fontSize=_t.sz=_v+'px';"
                ].join(''):""].join('');
    
    },

    
    
    $allocText : function(style, needed){
        var t, tn = style._txtnode, ts = style._txtnodes;
        if(!ts.length)tn.innerHTML = Array(needed+1).join(style._txtdiv); 
        else tn.insertAdjacentHTML('beforeend',Array(needed+1).
                                    join(style._txtdiv));
        while(needed-->0){
            t=tn.childNodes[ts.length];
            ts.push({ x:-10000000000,y:-10000000000, n: t, v: t.firstChild,sz:-1,s:null});
        }
    },
    
    $endFont : function(){
        this.last = this.style._id;
        this.style = 0;
        this.mx="",this.my="";
        return "_s._txtcount = _tc;";
    },
    
    $finalizeFont : function(style) {
        var s=["if((_lc=(_s=_styles[",style._id,"])._txtused)>",
            "(_tc=_s._txtcount)){_tn=_s._txtnodes;",
            "for(;_lc>_tc;)_tn[--_lc].n.style.display='none';",
            "_s._txtused=_tc;",
        "} else if(_lc<_tc) {_tn=_s._txtnodes;",
            "for(;_lc<_tc;)_tn[_lc++].n.style.display='block';",
            "_s._txtused=_tc;",
        "}\n"];
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
});
//#endif