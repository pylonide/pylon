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

// #ifdef __WITH_VISUALIZER
// visualization helpers built on draw

jpf.visualize = {
        
    head : "\
        var  _math_,vx1 = v.vx1, vy1 = v.vy1,_rseed=1,\n\
              vx2 = v.vx2, vy2 = v.vy2, vw =  vx2-vx1, vh = vy2-vy1,\n\
             dw = l.dw, dh = l.dh, dtx = 0, dty = 0, sw = dw/vw, sh = dh/vh,\n\
             a=l.a||0, b=l.b||0, c=l.c||0,d=l.d||0,\n\
             n=(new Date()).getTime()*0.001, dt=-(l.n?l.n:n)+(l.n=n), e=Math.E, p=Math.PI;",

    begin2D : function(l,e){
        this.e = e, this.l = l;
        return [
            this.head,
            "var x, y, i, j, k;\n",
            e.beginLayer(l)
        ].join('');
    },
    
    begin3D : function(l,e){
        this.e = e, this.l = l;
        if(this.l.style.persp<0){ // we have ortho perspective
            this.ortho = 1;
            this.persp = "var persp = __max(dw,dh) / l.style.persp/-v.tz;";
        } else {
            this.ortho = 0;
            this.persp = "var persp = __max(dw,dh) / l.style.persp;";
        }
        return [
            this.head,
            "var  dw2 = l.dw*0.5, dh2 = l.dh*0.5,\n\
             _ma = __cos(v.rx),_mb = __sin(v.rx),\n\
             _mc = __cos(v.ry),_md = __sin(v.ry),\n\
             _me = __cos(v.rz),_mf = __sin(v.rz),\n\
             m00=_mc*_me,m01=-_mf*_mc,m02=_md,m03=v.tx,\n\
             m10=(_me*_mb*_md+_mf*_ma),m11=(-_mb*_md*_mf+_ma*_me),m12=-_mb*_mc,m13=v.ty,\n\
             m20=(-_ma*_md*_me+_mb*_mf),m21=(_ma*_md*_mf+_me*_mb),m22=_ma*_mc,m23=v.tz,\n\
             x, y, z, _x,_y,_z, zt, i, j, k, _opt_;\n",
            this.persp,
            e.beginLayer(l)
        ].join('');
    },
    
    end2D : function(){
        var r = this.e.endLayer();
        this.e = 0, this.l = 0;
        return r;
    },
    
    end3D : function(){
        var r = this.e.endLayer();
        this.e = 0, this.l = 0;
        return r;
    },
    
    poly3DAlloc : function(maxoverlap){
        var s=['var '];
        for(var i = 0;i<maxoverlap;i++)
            s.push((i?",":""),"_tx",i,",_ty"+i);
        s.push(";");
        return s.join('');
    },
    poly3DIndex : function(indices,pts){
        // we want rects between:
        // first we count the doubles
        var v,f=1,i,j = 0,d,pt,q,s = [],
            cc = new Array(pts.length),
            cf = new Array(pts.length);
            
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
                    "zt = persp / (m20*"+pt[0]+"+m21*"+pt[1]+"+m22*"+pt[2]+"+m23);",
                    "(m00*"+pt[0]+"+m01*"+pt[1]+"+m02*"+pt[2]+"+m03)*"+
                        (this.ortho?"persp":"zt"),
                    "(m10*"+pt[0]+"+m11*"+pt[1]+"+m12*"+pt[2]+"+m13)*"+
                        (this.ortho?"persp":"zt")];
                d = f?0:i;
                if(cc[d])q[1]= "_tx"+cc[d]+(cf[d]?"":"="+q[1]), 
                         q[2]= "_ty"+cc[d]+(cf[d]++?"":"="+q[2]);
            }; 
            switch(d){
                case -1: f=1;s.push( this.e.close() );break;
                case 0: f=0;s.push( q[0], this.e.moveTo(q[1],q[2]) ); break;
                case indices.length-1: s.push( q[0], this.e.lineTo(q[1],q[2]), 
                    this.e.close() );break;
                default: s.push( q[0], this.e.lineTo(q[1],q[2]) ); break;
            }
        }
        return s.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
    },
    do3D : function(f,x,y,z,sx,sy){
        var _x,_y,_z;
        if(typeof x == 'string' && x.match(/[\[\]\*\+\-\/]/))x="(_x="+x+")",_x="_x";
        else x="("+x+")",_x=x;
        if(typeof y == 'string' && y.match(/[\[\]\*\+\-\/]/))y="(_y="+y+")",_y="_y";
        else y="("+y+")",_y=y;
        if(typeof z == 'string' && z.match(/[\[\]\*\+\-\/]/))z="(_z="+z+")",_z="_z";
        else z="("+z+")",_z=z;
        
        var r = [];
        if(!this.ortho)r.push("zt = persp/(m20*"+x+"+m21*"+y+"+m22*"+z+"+m23);");
        r.push(this.e[f]( (sx===undefined?"":sx)+
              "(m00*"+_x+"+m01*"+_y+"+m02*"+_z+"+m03)*"+(this.ortho?"persp":"zt"),
              (sy===undefined?"":sy)+
              "(m10*"+_x+"+m11*"+_y+"+m12*"+_z+"+m13)*"+(this.ortho?"persp":"zt") ) );
        return r.join('').replace(/m\d\d\*\(?0\)?\+/g,"");
    },
    lineTo3D : function(x,y,z,sx,sy){
        return this.do3D("lineTo",x,y,z,sx,sy);
    },
    moveTo3D : function(x,y,z,sx,sy){
        return this.do3D("moveTo",x,y,z,sx,sy);
    },
    
    cacheArray : function(name, size){
        return "if(!l.__"+name+" || l.__"+name+".length<"+size+")l.__"+
        name+" = new Array("+size+");var "+name+"=l.__"+name+";";
    },
    
    mathParse : function(s, arraysize){
        if( (s===undefined || s=="") && arraysize){
            var r=[];
            while(arraysize>r.length)r.push("0");
            return r;
        }
        var r = jpf.draw.parseMacro(s, arraysize );
        if(!arraysize) return r;
        if(arraysize>r.length){
            r[0] = "(__x=("+r[0]+"))";
            while(arraysize>r.length)
                r.push("__x");
        }
        return r;
    },   

    optimize : function(code){
        // first do the jpf.draw optimizations, then the local optimization
        code = jpf.draw.optimize(code);
        var cnt = {},n = 0, s=[];
        code = code.replace(/(m\d\d\*)\(?(\-?\d+(?:\.\d+))?\)/g,function(m,a,b){
            var t = a+b;
            if(cnt[t] === undefined){
                s.push("_mo"+n+"="+t);
                return cnt[t]="_mo"+(n++);
            }
            return cnt[t];
        });
        code = s.length ? code.replace(/\_opt\_/,s.join(',')): code;
        code = code.replace(/__round\((d[wh])\)/g,"$1"); 
        return code;
    }
}

//#endif