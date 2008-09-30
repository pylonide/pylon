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

// #ifdef __WITH_VISUALIZE
jpf.visualize = {
	
    defaultstyles : {
	
		style : {
			isstyle : 1,
			line : null,
			fill : null
		},
		font : {
			isfont : 1,
			family : "verdana",
			weight : "normal",
			color : "#00000",
			size : "10pt"
		},		

		grid2D: {
			pow : 10,
			step : 4,
			margin : {
				left : 50,
				top : 50,
				right : 50,
				bottom :50
			},
			plane :{
				inherit : 'style',
				line : '#cfcfcf'
			},
			label : {
				inherit : 'font',
				join : 'label'
			},
			xlabel : {inherit : 'label', side:0, axis:0},
			ylabel : {inherit : 'label', side:1, axis:0},
			grid : { 
				inherit : 'style',
				join : 'grid',
				line : '#cfcfcf',
				weight : 1,
				extend : 0
			},
			xgrid : {inherit : 'grid'},
			ygrid : {inherit : 'grid'},
			bar : {
				inherit : 'style',
				join : 'bar'
			},	
			xbar : {
				inherit : 'bar',
				fill : '#dfe7f5',
				outx: 0,
				outy: 0
			},
			ybar : {
				inherit : 'bar'
				//line : '#cfcfcf'
			},
			axis :{
				inherit : 'style',
				join : 'axis',
				line : '#000000',
				weight: 2,
				extend: 2
			},
			xaxis :{inherit : 'axis'},
			yaxis :{inherit : 'axis'},
			tick : {
				inherit : 'style',
				join : 'grid',
				steps : 5,
				shift: 0,
				size : 2,
				line : '#000000'
			},
			xtick : {inherit : 'tick'},
			ytick : {inherit : 'tick'}
		},
		grid3D: {
			left : 0,
			top : 0,
			right : 0,
			bottom :0,
			xsteps : 15,
			ysteps : 15,
			persp : 1,
			grid : null,
			axis : null
		},
		line2D: {
			steps : 100,
			graph : {
				inherit : 'style',
				line : '#000000',
				weight: 1
			}
		},
		line3D: {
			steps : 50,
			zpos : 0,
			depth : 0.2,
			persp : 1,
			graph : {
				line: '#000000',
				weight : 1,
				fill : 'red'
			}
		}
	},
	
	datasource : {
		mathX : function(l) {
			return {
				type : 'mathX',
				x1 : 0, x2 : 1, y1 : 0, y2 : 1,
				ix1 : "vx1", 
				ix2 : "vx2+(vx2-vx1)/l.style.steps", 
				ixs : "l.style.steps",
				x : "ix",
				y : jpf.visualize.mathParse(l.formula)
			};
		},
		mathXY : function(l){
			var part = l.formula.split(";");
			return {
				type : 'mathXY',
				x1 : -1, x2 : 1, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : "Math.PI*2+(Math.PI*2/(l.style.steps-1))", 
				ixs : "l.style.steps",
				x : jpf.visualize.mathParse(part[0]),
				y : jpf.visualize.mathParse(part[1]===undefined?
					part[0]:part[1])
			};
		},
		seriesX : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesX',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				head : "var _yv = l.yvalue;",
				ix1 : "__max(__floor(vx1),0)", 
				ix2 : "__min(__ceil(vx2)+1,_yv.length)", 
				ixs : "ix2-ix1",
				x : "ix",
				y : "_yv[ix]"
			};
		},
		seriesX2 : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesX2',
				head : 'var _xv = l.xvalue, _yv = l.yvalue, _len = _yv.length;',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				ix1 : 0, 
				ix2 : "_len", 
				ixs : "_len", 
				begin : "var _lx = vx1, _sf=0;\
						 for(ix=l.ixfirst||0;ix > 0 && _xv[ix]>=vx1 ;ix--);",
				for_ : " && _lx<=vx2",
				if_  : "if( (!_sf && (ix==_len-1 || _xv[ix+1]>=vx1) && ++_sf && (ixfirst=l.ixfirst=ix || 1)) || _sf)",
				x 	 : "(_lx=_xv[ix])",
				y 	 : "_yv[ix]"
			};
		},
		seriesXY : function(l) {
			var	len = l.yvalue.length;
			return {
				type : 'seriesXY',
				x1 : 0, x2 : len, y1 : -1, y2 : 1,
				head : "var _vx = l.xvalue, _vy = l.yvalue, _len = _vy.length;",
				ix1 : 0, 
				ix2 : "_len", 
				ixs : "_len",
				x : "_vx[ix]",
				y : "_vy[ix]"
			};
		}
	},
	
	head : "\
		var  _math_,vx1 = v.vx1, vy1 = v.vy1,\n\
		 	 vx2 = v.vx2, vy2 = v.vy2, vw =  vx2-vx1, vh = vy2-vy1,\n\
			 dw = l.dw, dh = l.dh, sw = dw/vw, sh = dh/vh,\n\
			 a=l.a||0, b=l.b||0, c=l.c||0,d=l.d||0,\n\
			 n=(new Date()).getTime()*0.001, e=Math.E, p=Math.PI;",

	begin2D : function(e,l){
		this.e = e, this.l = l;
		return [
			this.head,
			"var x, y, i, j, k;\n",
			e.beginLayer(l)
		].join('');
	},
	
	begin3D : function(e,l){
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
	
	end : function(){
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
			d = indices[i];	if(d>=0) cc[d]++;
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
	mathParse : function(s){
		return "("+s.toLowerCase().replace(/([0-9\)])([a-z)])/g,"$1*$2").
		replace(/([a-z][a-z]+)/g,"__$1").replace(/([^a-z]?)(x|y)([^a-z]?)/g,"$1i$2$3").
		replace(/(^|[^a-z])t($|[^a-z])/g,"$1ix$3")+")";
	},
		
	cacheArray : function(name, pref, size){
		return "if(!l."+pref+name+" || l."+pref+name+".length<"+size+")l."+
		pref+name+" = new Array("+size+");var "+name+"=l."+pref+name+";";
	},
	
	optimize : function( code ){
		// we should find all constant * matrix operations and optimize them out.
		if(typeof(code) == 'object'){
			for(var i = code.length-1;i>=0;i--)
				if(typeof(code[i]) == 'object')code[i] = code[i].join('');
			code = code.join('');
		}
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
		// find used math functions and create local var
		s=[];cnt={};
		code.replace(/\_\_(\w+)/g,function(m,a){
			if(!cnt[a]) s.push("__"+a+"=Math."+a), cnt[a]=1;
		});
		// optimize out const parseInt and const math-operations
		code = code.replace(/(__(\w+)|parseInt)\((\-?\d+\.?\d*)\)/g,
			function(m,a,b,c){
			if(a=='parseInt')return parseInt(c);
			return Math[b](c);
		});
		code = code.replace(/\(\(?0\)?\+/g,"("); 
		code = code.replace(/parseInt\((_d[xy])\)/g,"$1"); 

		//code = code.replace(/\(([a-z0-9\_]+)\)/g,"$1");
		return s.length ? code.replace(/\_math\_/,s.join(',')): code;
	},

	
	// Actual visualization functions:
	
	
    grid2D : function(l,e){
		var s = l.style, g = this;
		var ml = s.margin.left*l.ds, mr = s.margin.right*l.ds,
			mt = s.margin.top*l.ds, mb = s.margin.bottom*l.ds, sh = 0;
		var c = g.optimize([
		g.begin2D(e,l),
		"dw -= ",ml+mr,", dh -= ",mt+mb,
		", sw = dw / vw, sh = dh / vh;",
		"var dgridx = [], dgridy = [],\
			 dx = __pow(",s.pow,", __round(__log(vw/",s.pow,
						")/__log(",s.pow,")))*",s.step,",\
			 dy = __pow(",s.pow,", __round(__log(vh/",s.pow,
						")/__log(",s.pow,")))*",s.step,",\
			 bx = __round(vx1 / dx) * dx - vx1,\
			 by = __round(vy1 / dy) * dy - vy1,\
			 ex = vw, ey = vh, tx, ty,t,u,q,r;\
		if(by>0)by -= dy;if(bx>0)bx -= dx;\
		var ddx = dx*sw, ddy = dy*sh, dbx = bx*sw, dby = by*sh,\
			 dex = ex*sw, dey = ey*sh, mdex = dex-ddx, mdey = dey-ddy,\
			 hdx = 0.5*dx, hdy = 0.5*dy,hddx = 0.5*ddx, hddy = 0.5*ddy,\
			 axisx = -vx1*sw, axisy = -vy1*sh,\
			 sx = parseInt(2*dex/ddx)+3,sy = parseInt(2*dey/ddy)+3;",
		e.translate(ml,mt),
		s.plane.active?[ e.shape(s.plane),
			e.rect(0,0,"dw","dh")
		]:"",
		s.xbar.active?[ e.shape(s.xbar),
			"if(dbx>-hddx){",
				e.rect(0,0,"dbx+hddx","dh"),
			"}",
			"for( x = dbx+ddx; x < mdex; x += ddx){",
				e.rect("x",0,"hddx","dh"),
			"};",
			e.rect("x",0,"__min(hddx,dw-x)","dh")
		]:"",
		s.ybar.active?[ e.shape(s.ybar),
			"if(dby>-hddy){",
				e.rect(0,0,"dw","dby+hddy"),
			"}",
			"for( y = dby+ddy; y < mdey; y += ddy){",
				e.rect(0,"y","dw","hddy"),
			"};",
			e.rect(0,"y","dw","__min(hddy,dh-y)")
		]:"",
		s.xgrid.active?[ e.shape(s.xgrid),
			"y = dby;while(y<0)y+=hddy;",
			"t=dw+",s.xgrid.extend*l.ds,";",
			"u=",s.xgrid.extend*l.ds*-s.ylabel.side,";",
			"for(; y < dey; y += hddy){",
				e.hline("u","y","t"),
			"};"
		]:"",
		s.ygrid.active?[ e.shape(s.ygrid),
			"x = dbx;while(x<0)x+=hddx;",
			"t=dh+",s.ygrid.extend*l.ds,";",
			"u=",s.ygrid.extend*l.ds*-s.xlabel.side,";",
			"for(; x < dex; x += hddx){",
				e.vline("x","u","t"),
			"};"
		]:"",	
		s.xaxis.active?[ e.shape(s.xaxis),
			"if(axisy>0 && axisy<dh){",
				"t=dw+",s.xaxis.extend*l.ds,";",
				"u=",s.xaxis.extend*l.ds*-s.ylabel.side,";",
				e.hline("u","axisy","t"),
			"}"
		]:"",
		s.yaxis.active?[ e.shape(s.yaxis),
			"if(axisx>0 && axisx<dw){",
				"t=dh+",s.yaxis.extend*l.ds,";",
				"u=",s.yaxis.extend*l.ds*-s.xlabel.side,";",	
				e.vline("axisx","u","t"),
			"}"
		]:"",
		s.xtick.active?[ e.shape(s.xtick),
			"t = hddx/",s.xtick.steps,";",
			"u = ",s.xlabel.axis?("axisy-"+s.xtick.shift*l.ds):
				  (s.xlabel.side?s.xtick.size*-l.ds:"dh"),";",
			"x = dbx;while(x<0)x+=t;",
			"for(; x < dex; x += t){",
				e.vline("x","u",s.xtick.size*l.ds),
			"};"		
		]:"",
		s.ytick.active?[ e.shape(s.ytick),
			"t = hddy/",s.ytick.steps,";",
			"u = ",s.xlabel.axis?("axisx-"+s.ytick.shift*l.ds):
				  (s.ylabel.side?s.ytick.size*-l.ds:"dw"),";",
			"y = dby;while(y<0)y+=t;",
			"for(; y < dey; y += t){",
				e.hline("u","y",s.xtick.size*l.ds),
			"};"	
		]:"",		
		s.xlabel.active?[ e.text(s.xlabel, "sx"),
			"for( tx = bx+vx1, x = dbx; x < dex; x += hddx, tx += hdx){\n",
				e.print("x",(l.style.onaxis?"axisy":"dh"),
					"tx.toFixed(2)"), 
			"}"
		]:"",
		s.ylabel.active?[ e.text(s.ylabel, "sy"),
			"for( ty = by+vy1, y = dby; y < dey; y += hddy, ty += hdy){\n",
				e.print(l.style.onaxis?"axisx":-40*l.ds,"y",
					"ty.toFixed(2)"), 
			"}"
		]:"",
		e.translate(),
		g.end()
		]);
//		alert(c);
		return new Function('l','v',c);
    },

    grid3D : function(l,e){
		e.allocShape(l,l.style.grid);
		e.allocShape(l,l.style.axis);
		e.allocDone(l);
		var g = this,sx = l.style.xsteps, sy = l.style.ysteps;
		var c = g.optimize([
			g.begin3D(e,l),
			"var dx = (vw)/(",sx,"-1), dy = (vh)/(",sy,"-1);",
			e.beginShape(0,'dw2','dh2'),
			"for(x = vx1, i = 0; i < ",sx,"; x += dx,i++){",
				g.moveTo3D("x",'vy1',0),
				g.lineTo3D('x','vy2',0),
			"}\
			for(y = vy1,j = 0,k = 0; j < ",sy,"; y += dy,j++){",
				g.moveTo3D("vx1","y",0),
				g.lineTo3D('vx2',"y",0),
			"}",
			e.endShape(),
			!e.getValue('showxy',1)?"":(
				e.beginShape(1,'dw2','dh2')+
				g.moveTo3D('vx1',0,0)+g.lineTo3D('vx2',0,0)+
				g.moveTo3D(0,'vy1',0)+g.lineTo3D(0,'vy2',0)+
				(!e.getValue('showz',0)?"":(
					g.moveTo3D(0,0,-1)+g.lineTo3D(0,0,1)) 
				)+
				e.endShape() 
			),
			g.end()]);
		return new Function('l','v',c);
	},
	
	line2D : function( l, e, d ){
		var g = this, s = l.style, wrap = s.graph.weight*4;
		if(!s.graph.active) return new Function('');
		
		var c = g.optimize([
			g.begin2D(e,l),
			e.translate("-vx1*sw","-vy1*sh"),
			e.shape(s.graph),
			"var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"var ixfirst = ix;",
			e.moveTo(d.x+"*sw",d.y+"*-sh"),
			"for(ix+=idx;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
				e.lineTo(d.x+"*sw",d.y+"*-sh"),
			"}", 
			(s.fill===undefined? "" :(
				"ix-=idx;"+e.lineTo(d.x+"*sw+"+wrap, 
					(s.fillout==1?d.y2+"*-sh+":"vy1*sh+dh+")+wrap)+
				"ix=ixfirst;"+e.lineTo(d.x+"*sw-"+wrap, 
					(s.fillout==1?d.y2+"*-sh+":"vy1*sh+dh+")+wrap)
			)),
			e.translate(),
			this.end()]);
		try{		
			return new Function('l','v',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	line3D : function( l, e, d ){
		var g = this, s = l.style, wrap = s.graph.weight*4; 
		e.allocShape(l, s.graph);
		e.allocDone(l);
		var c = g.optimize([
			g.begin3D(e,l),
			e.beginShape(0,"dw2","dh2"),
			"var ix1=",d.ix1,",ix2=",d.ix2,",ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"var ixfirst = ix, k = 0, xa, ya, xb, yb, xc, yc, xd, yd;",
			(s.fake==1) ?[
				g.cacheArray('gx','line3D',"ixs"),
				g.cacheArray('gy','line3D',"ixs"),
				g.moveTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"for(k=1,ix+=idx;ix<ix2",d.for_||"",";ix+=idx,k++",d.inc_||"",")",
				d.if_||"","{",
					g.lineTo3D("gx[k]="+d.x,s.zpos,"gy[k]="+d.y),
				"}", 
				"for(k--;k>=0;k--){",
					g.lineTo3D("gx[k]",s.zpos+s.depth,"gy[k]"),
				"}"
			].join('') : [
				g.moveTo3D("xb="+d.x,s.zpos,"yb="+d.y),
				"for(ix+=idx,i=0;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",
				d.if_||"","{",
					"xa = ",d.x,",ya=",d.y,";",
					g.lineTo3D("xa",s.zpos,"ya","x=","y="),
					g.lineTo3D("xa",s.zpos+s.depth,"ya", "xc=","yc="),
					"if(!i){i++;",
						g.lineTo3D("xb",s.zpos+s.depth,"yb"),
					"} else {",
						e.lineTo("xd","yd"), 
					"}",
					e.close(),
					e.moveTo("x","y"),
					"xd=xc, yd=yc, xb = xa, yb = ya;",
				"}",
			].join(''),
			";",
			e.endShape(),
			g.end()]);
		try{		
			return new Function('l','v',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	bar2D : function(l,e,d){
		e.allocShape(l, l.style.bar);
		e.allocDone(l);
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head2D,
			e.beginLayer(l),
			e.beginShape(0,"-vx1*sw","-vy1*sh"),
			"var ix1=",d.ix1,",ix2=",d.ix2,"ixs=",d.ixs,
			",ix = ix1,ixw=ix2-ix1,idx=ixw/ixs;",d.begin||"",
			"for(;ix<ix2",d.for_||"",";ix+=idx",d.inc_||"",")",d.if_||"","{",
				e.rect( d.x+"*sw", d.y+"*-sh", d.style.bar.sizex+"*idx", 0),
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},	
	
	bar3D : function(l,e){

		e.allocShape(l, l.style.bar );
		e.allocDone(l);
		var vz = l.style.bar.zpos;
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head3D,
			e.beginLayer(l),
			this.poly3DHead(8),
			e.beginShape(0),
			"var lx = vw/",l.style.bar.stepx,",xw, w = lx*",l.style.bar.sizex,
			",d=lx*",l.style.bar.sizey,"+",vz,";",
			// we need the viewing angle, and create a switch with the 8 angles
			"for(x = vx1; x<=vx2; x+=lx){",
				"xw = x+w, z = ",func,";",
				this.poly3DIndex(e,[ 0,1,5,6,7,3,-1,3,2,6,7],
					[["x",vz,0],["xw",vz,0],["xw",vz,"z"],["x",vz,"z"],
					["x","d",0],["xw","d",0],["xw","d","z"],["x","d","z"]]),
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	},
		
	bar3DXY : function(l,e){
		// we should allocate as many shapes as we have datasets,
		// with different colors
		e.allocShape(l, l.style.bar );
		e.allocDone(l);
		var vz = l.style.bar.zpos;
		var func = this.mathParse(l.formula);
		var c = [
			this.head,
			this.head3D,
			e.beginLayer(l),
			this.poly3DHead(8),
			e.beginShape(0),
			"var tx,ty,xw,yw,",
			"lx = vw/",l.style.bar.stepx,",hxwv = 0.5*lx*",l.style.bar.sizex,",",
			"ly = vh/",l.style.bar.stepy,",hywv = 0.5*ly*",l.style.bar.sizey,";",
			// we need the viewing angle, and create a switch with the 8 angles
			"for(y = vy1; y<=vy2; y+=ly){",
				"for(x = vx1; x<=vx2; x+=lx){",
					"tx = x-hxwv, ty = y-hywv, xw = x+hxwv, yw = y+hywv, z = ",func,";",
					this.poly3DIndex(e,[ 0,1,5,6,7,3,-1,3,2,6,7],
						[["tx","ty",0],["xw","ty",0],["xw","ty","z"],["tx","ty","z"],
						["tx","yw",0],["xw","yw",0],["xw","yw","z"],["tx","yw","z"]]),
				"}",
			"}",
			e.endShape(),
			e.endLayer()].join('');
		try{		
			return new Function('l',c);
		}catch(x){
			alert("Failed to compile:\n"+c);return 0;
		}
	}
}

//#endif