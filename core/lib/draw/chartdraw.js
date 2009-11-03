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
 
// #ifdef __AMLCHART || __INC_ALL

apf.chart_draw = {
    // #ifdef __ENABLE_CHART_AXIS2D
    _axis2D: {
        margin : {
            left : 30,
            top : 30,
            right : 30,
            bottom :30,
        $:1},
        layout : {
            pow : 10,
            step : 4,
            onsidex : 0,
            onaxisx : 0,
            onsidey : 1,
            onaxisy : 0,
        $:1},
        plane :{
            inherit : 'shape',
            stroke : '#cfcfcf',
            fill : '#e6f1f8',
        $:1},
        plane2 :{
            inherit : 'shape',
        $:1},            
        label : {
            inherit : 'font',
            join : 'label',
            left : 0,
            top : 0,
            format : "fixed(v,1)",
        $:0},
        labelx : {
            inherit : 'label', 
            width: 40,
            top : 5,
            left: -19,
            side: 0, 
            axis: 0, 
            edgeclip : 2,
            align:'center',
        $:1},
        labely : {
            inherit : 'label', 
            left : -110,
            top : -6,
            width: 100,
            side:1, 
            edgeclip : 0,
            align:1?'right':'left',
        $:1},
        grid : {
            inherit : 'shape',
            join : 'grid',
            extend : 0,
            /*stroke : '#cfcfcf',
            weight : 1,
            opacity: 0.3,
            extend : 0,*/
        $:0},
        hgrid : {inherit : 'grid',$:1},
        vgrid : {inherit : 'grid',$:1},
        tiles : {
            inherit : 'shape',
            join : 'tiles',
            fill : '#dfe7f5',
        $:1}, 
        bar : {
			inherit : 'shape',
            join : 'bar',
        $:0},    
        hbar : {
            inherit : 'bar',
        $:1},
        vbar : {
            inherit : 'bar',
            //stroke : '#cfcfcf',
            //fill : 'green',
        $:1},
        axis :{
            inherit : 'shape',
            join : 'grid',
            stroke : 'black',
            weight: 1,
            extend: 2,
        $:0},
        axisx :{inherit : 'axis',$:1},
        axisy :{inherit : 'axis',$:1},
        tick : {
            inherit : 'shape',
            join : 'grid',
            steps : 5,
            left: 0,
            top : 0,
            size : 4,
            stroke : '#000000',
        $:0},
        tickx : {inherit : 'tick',$:1},
        ticky : {inherit : 'tick',$:1},
        tickgx : {inherit : 'tick',weight:2,size:6,$:1},
        tickgy : {inherit : 'tick',weight:2,size:6,$:1}
    },
    axis2D : function(l,s){
        var e = apf.draw;
        if(!s.margin || !s.layout) return new Function('');
        var ml = s.margin.left*l.ds, mt = s.margin.top*l.ds,
            mr = s.margin.right*l.ds, mb = s.margin.bottom*l.ds;
        var c = e.optimize([
        e.beginLayer(l),
        e.vars(ml,mt,mr,mb),
        e.clear(),
        "var v,d,u,h,",
             "vcx = 0.5*__pow(",s.layout.pow,", __round(__log(__abs(vw)/",s.layout.pow,
                        ")/__log(",s.layout.pow,")))*",s.layout.step,",",
             "vcy = 0.5*__pow(",s.layout.pow,", __round(__log(__abs(vh)/",s.layout.pow,
                        ")/__log(",s.layout.pow,")))*",s.layout.step,",",
             "vbx = __ceil(vx1/vcx) * vcx,", 
             "vby = __ceil(vy1/vcy) * vcy,",
             "vex = __floor(vx2/vcx) * vcx,",
             "vey = __floor(vy2/vcy) * vcy,",
             "dcx = vcx*tw, dcy = vcy*th,",
             "dbx = vbx*tw+tx, dby = vby*th+ty,",
             "dex = vex*tw+tx, dey = vey*th+ty,",
             "dcx2 = dcx*2, dcy2 = dcy*2,",
             "dbx2 = __ceil(vx1/(2*vcx))*2*vcx*tw+tx,", 
             "dex2 = __floor(vx2/(2*vcx))*2*vcx*tw+tx,", 
             "dby2 = __floor(vy1/(2*vcy))*2*vcy*th+ty,", 
             "dey2 = __floor(vy2/(2*vcy))*2*vcy*th+ty;", 
         "var xmaxstep = __ceil( (dex-dbx)/dcx )+4,",
             "ymaxstep = __ceil( (dey-dby)/dcy )+4;",
			 
        s.plane?[ e.beginShape(s.plane),
            e.rect(ml,mt,"dw","dh")
        ].join(''):"",
        s.tiles?[ 
            e.rectInv?[
                e.beginShape(s.tiles),
                 "if((u=dbx2-dcx-",ml,")>0){",
                    e.rectInv(ml,mt,"u","dh"),
                "}",
                "for( v = dbx2, u  = dex-dcx; v < u; v += dcx2){",
                    e.rectInv("v",mt,"dcx","dh"),
                "};",
                "if((u=dr-v)>0){",
                    e.rectInv("v",mt,"__min(dcx,u)","dh"),
                "}",
                "if((u=dey2+dcy-",mt,")>0){",
                    e.rectInv(ml,mt,"dw","u"),
                "}",
                "for( v = dey2,u = dby+dcy; v < u; v -= dcy2){",
                    e.rectInv(ml,"v","dw","-dcy"),
                "};",
                "if((u=db-v)>0){",
                    e.rectInv(ml,"v","dw","__min(-dcy,u)"),
                "}"              
            ].join(''):[
                e.beginShape(s.tiles,ml,mt,mr,mb),
                "for( u = dey2+dcy2, t = dby2-dcy2; u <= t; u -= dcy2){",
                "for( v = dbx2-dcx2, d = dex2+dcx2; v <= d; v += dcx2){",
                    e.rect("v+dcx","u","dcx","-dcy"),
                    e.rect("v","u-dcy","dcx","-dcy"),
                "};",
            "}"].join('')
        ].join(''):"",
        s.vbar?[ e.beginShape(s.vbar),
            "if((u=dbx2-dcx-",ml,")>0){",
                e.rect(ml,mt,"u","dh"),
            "}",
            "for( v = dbx2, u  = dex-dcx; v < u; v += dcx2){",
                e.rect("v",mt,"dcx","dh"),
            "};",
            "if((u=dr-v)>0){",
                e.rect("v",mt,"__min(dcx,u)","dh"),
            "}"
        ].join(''):"",
        s.hbar?[ e.beginShape(s.hbar),
            "if((u=dey2+dcy-",mt,")>0){",
                e.rect(ml,mt,"dw","u"),
            "}",
            "for( v = dey2, u = dby+dcy; v < u; v -= dcy2){",
                e.rect(ml,"v","dw","-dcy"),
            "};",
            "if((u=db-v)>0){",
                e.rect(ml,"v","dw","__min(-dcy,u)"),
            "}"
        ].join(''):"",
        s.tickx?[ e.beginShape(s.tickx),
            "u = ",s.layout.onaxisx?("ty+"+(s.tickx.top*l.ds)):
                  (s.layout.onsidex?s.tickx.size*-l.ds+ml:("db")),";",
            "t = dcx/",s.tickx.steps,";",
            "h = ",s.tickx.size*l.ds,";",
            s.layout.onaxisx?[
            "if(u+h>",mt," && u<dh+",mb,"){",
                "if(u<dy)h=h-(dy-u),u=dy;",
                "if(u+h>db)h=db-u;"].join(''):"",
                "x = dbx-dcx;while(x<dx)x+=t;",
                "for(; x < dr; x += t){",
                    e.lineV("x","u","h"),
                "};",        
            s.layout.onaxisx?"}":"",
        ].join(''):"",
        s.ticky?[ e.beginShape(s.ticky),
            "t = dcy/",s.ticky.steps,";",
            "u = ",s.layout.onaxisy?("tx+"+s.ticky.left*l.ds):
                  (s.layout.onsidey?s.ticky.size*-l.ds+mt:"dr"),";",
            "h = ",s.ticky.size*l.ds,";",
            s.layout.onaxisy?[
            "if(u+h>dx && u<dr){",
                "if(u<dx)h=h-(dx-u),u=dx;",
                "if(u+h>dr)h=dr-u;"].join(''):"",            
                "y = dey+dcy;while(y<dy)y-=t;",
                "for(; y < db; y -= t){", // Y INVERTED
                    e.lineH("u","y","h"),
                "};",    
            s.layout.onaxisy?"}":"",
        ].join(''):"",
        s.hgrid?[ e.beginShape(s.hgrid),
            "t=dw+",s.hgrid.extend*l.ds,";",
            "u=",(s.hgrid.extend*l.ds*-s.layout.onsidey)+ml,";",
            "for(y = dby; y >= dy; y += dcy){", // Y INVERTED
                e.lineH("u","y","t"),
            "};"
        ].join(''):"",
        s.vgrid?[ e.beginShape(s.vgrid),
            "t=dh+",s.vgrid.extend*l.ds,";",
            "u=",(s.vgrid.extend*l.ds*-s.layout.onsidex)+mt,";",
            "for(x = dbx; x <= dr; x += dcx){",
                e.lineV("x","u","t"),
            "};"
        ].join(''):"",    
        s.tickgx?[ e.beginShape(s.tickgx),
            "u = ",s.layout.onaxisx?("ty+"+s.tickgx.top*l.ds):
                  (s.layout.onsidex?s.tickgx.size*-l.ds+ml:("db")),";",
            "h = ",s.tickgx.size*l.ds,";",
            s.layout.onaxisx?[
            "if(u+h>dy && u<db){",
                "if(u<dy)h=h-(dy-u),u=dy;",
                "if(u+h>db)h=db-u;"].join(''):"",
                "for(v=dbx; v <= dr; v += dcx){",
                    e.lineV("v","u","h"),
                "};",
            s.layout.onaxisx?"}":"",
        ].join(''):"",                            
        s.tickgy?[ e.beginShape(s.tickgy),
            "u = ",s.layout.onaxisy?("tx+"+s.tickgy.left*l.ds):
                  (s.layout.onsidey?s.tickgy.size*-l.ds+mt:"dr"),";",
            "h = ",s.tickgy.size*l.ds,";",
            s.layout.onaxisy?[
            "if(u+h>dx && u<dr){",
                "if(u<dx)h=h-(dx-u),u=dx;",
                "if(u+h>dr)h=dr-u;"].join(''):"",    
                "for(v=dby; v >= dy; v += dcy){", // Y INVERTED
                    e.lineH("u","v","h"),
                "};",
            s.layout.onaxisy?"}":"",
        ].join(''):"",   
        s.axisx?[ e.beginShape(s.axisx),
            "if(ty>=dy && ty<=dy+dh){",
                "t=dw+",s.axisx.extend*l.ds,";",
                "u=dx+",(s.axisx.extend*l.ds*-s.layout.onsidey),";",
                e.lineH("u","ty","t"),
            "}"
        ].join(''):"",
        s.axisy?[ e.beginShape(s.axisy),
            "if(tx>=dx && tx<=dx+dw){",
                "t=dh+",s.axisy.extend*l.ds,";",
                "u=dy+",(s.axisy.extend*l.ds*-s.layout.onsidex),";",    
                e.lineV("tx","u","t"),
            "}"
        ].join(''):"",
        s.plane2?[ e.beginShape(s.plane2),
            e.rect(ml,mt,"dw","dh")
        ].join(''):"",
        s.labelx?[
            s.layout.onaxisx?
                e.beginFont(s.labelx, "xmaxstep", ml,mt,mr,mb):
                e.beginFont(s.labelx, "xmaxstep", ml-s.labelx.edgeclip*l.ds,0,
                                                  mr-s.labelx.edgeclip*l.ds,0),
            "for( v = vbx, u = vex,d = dbx; v <= u; v+= vcx, d+= dcx ){",
                e.text("d",s.layout.onaxisx?"ty":(s.layout.onsidex?"dy":"db"),
                        s.labelx.format),
            "}"
        ].join(''):"",
        s.labely?[
            s.layout.onaxisy?
                e.beginFont(s.labely, "ymaxstep", ml,mt,mr,mb):
                e.beginFont(s.labely, "ymaxstep",0,mt-s.labely.edgeclip*l.ds,
                                                 0,mb-s.labely.edgeclip*l.ds),
            "for( v = vby, u = vey,d = dby;v<= u; v+= vcy, d+= dcy ){;",
                e.text(s.layout.onaxisy?"tx":(s.layout.onsidey?"dx":"dr"),"d",s.labelx.format),
            "}"
        ].join(''):"",
        e.endLayer()
        ]);
        try{
            //logw(apf.highlightCode2(apf.formatJS(c)));
			return new Function('l','v','m',c);
        }catch(x){
            //return new Function('l','v','m',c);
            //c = apf.formatJS(c);
            //window.open().document.write("<script>" + c + "</script>");
            alert("Failed to compile:\n"+x.message+'\n'+c);return 0;
        }		
    },
    //#endif
    // #ifdef __ENABLE_CHART_AXIS3D
  
    _axis3D: {
		layout :{
		    pow : 10,
			step : 4,
		$:1},
        plane :{
            inherit : 'shape',
            side: 1,
            oneside : 0,            
            fill : '#e6f1f8',
        $:0},
        plane2 :{
            inherit : 'shape',
        $:1}, 
        planexy :{
            inherit: 'plane',
        $:1}, 
        planexz :{
            inherit: 'plane',
        $:1}, 
        planeyz :{
            inherit: 'plane',
            //fill: '#e6f1f8',
        $:1}, 

        /*
        grid : {
            inherit : 'shape',
            join : 'grid',
            stroke : '#cfcfcf',
            weight : 1,
            opacity: 0.3,
            extend : 0,
        $:0},
        xgrid : {inherit : 'grid'},
        ygrid : {inherit : 'grid'},*/

        bar : {
            inherit : 'shape',
            join : 'bar',
             oneside : 0,         
        $:0},    
        hbar : {
            side: 1,
            inherit : 'bar',
			stroke : '#cfcfcf',
            //opacity: 1,
        $:0},
        vbar : {
            side: 1,
            inherit : 'bar',
            stroke : '#cfcfcf',
            fill: 'blue',
			opacity: 0.25,
            //stroke : '#cfcfcf',
        $:0},
        hbarxy :{
            inherit: 'hbar',
        $:1}, 
        vbarxy :{
            inherit: 'vbar',
        $:1}, 
        hbarxz :{
            inherit: 'hbar',
            stroke: 'black',
            opacity:0.25,
        $:1}, 
        vbarxz :{
            inherit: 'vbar',
            fill: '#e6f1f8',
            stroke: 'black',
        //     opacity:0.5,
        $:1}, 
        hbaryz :{
            inherit: 'hbar',
             fill: '#blue',
            opacity:0.25,
        //    fill: null,
         //   opacity:0.5,
        $:1}, 
        vbaryz :{
            inherit: 'vbar',
            stroke: 'black',
            opacity:0.25,            
            fill: null,
        $:1}, 
        
        axis :{
            inherit : 'shape',
            join : 'grid',
            stroke : 'black',
            opacity: 0.5,
            weight: 3,
        $:0},
        axisx :{inherit : 'axis',$:1},
        axisy :{inherit : 'axis',$:1},
        axisz :{inherit : 'axis',$:1},

        tick : {
            inherit : 'shape',
            join : 'grid',
            steps : 5,
            size : 4, 
            scale : 0.1,
            angle : 'ang(180)',
            stroke : '#000000',
        $:0},
        tickx : {inherit : 'tick',angle:'ang(90+f1*90)',$:1},
        ticky : {inherit : 'tick',angle:'ang(90+f2*90)',$:1},
        tickz : {inherit : 'tick',$:1},
        
        label : {
            inherit : 'font',
            join : 'label',
            width: 40,
            height: 40,
            left: -20,
            top: "fontz(-5,200)",
            size: "fontz(10,200)",
            scale: 0.2,
            stroke: null,
            angle : 'ang(180)',
            format : "fixed(v,1)",
        $:0},
        labelx : {
            inherit : 'label', 
            angle:'ang(90+f1*90)',
            align:'center',
        $:1},
        labely : {
            inherit : 'label', 
            angle:'ang(90+f2*90)',
            align:'center',
        $:1},
        labelz : {
            inherit : 'label', 
            align:'center',
        $:1},        
        
        /*
        tickxg : {inherit : 'tick',weight:2,size:6},
        tickyg : {inherit : 'tick',weight:2,size:6}*/
    $:0},
     
    chartView3D : function(l,e){
        return [
		"var s3x=v.x3d/vw,s3xi=1/s3x,s3y=v.y3d/vh,s3yi=1/s3y,s3z=v.z3d/vd,s3zi=1/s3z;",
        e.sincos3('_m','v.rx','v.ry','v.rz'),
        e.setMatrix3D(
            e.matrixMul(
                e.matrix4T('(-0.5*vx1-0.5*vx2)','(-0.5*vy1-0.5*vy2)','(-0.5*vz1-0.5*vz2)'),
                e.matrix4S('s3x','s3y','s3z'),
                e.matrix4RP('_m'),
                e.matrix4T('v.tx','v.ty','v.tz'))
        )].join('');
    },
    
    axis3D : function(l,s){
        if(!s.layout) return new Function('');
        var e = apf.draw;
        var dt = (new Date()).getTime();
        var zclip = -0.01;
        function drawPlane(pr,fl,z1,z2,side,
                            vx1,vx2,vbx,vex,vbx2,vex2,vcx,vcx2,
                            vy1,vy2,vby,vey,vby2,vey2,vcy,vcy2 ){
            function plane(z){
                return e.poly3DClip([0,1,2,3],[[vx1,vy1,z],[vx1,vy2,z],[vx2,vy2,z],[vx2,vy1,z]],fl,zclip);
            }
            function hbar(z){
                return [
                "if((u=(",vbx2,"-",vcx,")-",vx1,")<",vcx," && u>0){",
                    e.poly3DClip([0,1,2,3],[[vx1,vy1,z],["("+vx1+"+u)",vy1,z],["("+vx1+"+u)",vy2,z],[vx1,vy2,z]],fl,zclip),
                "}",
                "for( v = ",vbx2,", u  = ",vex2,"-0.000001; v < u; v += ",vcx2,"){",
                    e.poly3DClip([0,1,2,3],[["v",vy1,z],["(v+"+vcx+")",vy1,z],["(v+"+vcx+")",vy2,z],["v",vy2,z]],fl,zclip),
                "};",
                "if( v<",vx2," ){",
                    e.poly3DClip([0,1,2,3],[["v",vy1,z],["(u="+e.min("v+"+vcx,vx2)+")",vy1,z],["u",vy2,z],["v",vy2,z]],fl,zclip),
                "}"].join('');
            }
            function vbar(z){
                return [
                "if((u=(",vby2,"-",vcy,")-",vy1,")<",vcy," && u>0){",
                    e.poly3DClip([0,1,2,3],[[vx1,vy1,z],[vx1,"("+vy1+"+u)",z],[vx2,"("+vy1+"+u)",z],[vx2,vy1,z]],fl,zclip),
                "}",
                "for( v = ",vby2,", u  = ",vey2,"-0.000001; v < u; v += ",vcy2,"){",
                    e.poly3DClip([0,1,2,3],[[vx1,"v",z],[vx1,"(v+"+vcy+")",z],[vx2,"(v+"+vcy+")",z],[vx2,"v",z]],fl,zclip),
                "};",
                "if( v<",vy2," ){",
                    e.poly3DClip([0,1,2,3],[[vx1,"v",z],[vx1,"(u="+e.min("v+"+vcy,vy2)+")",z],[vx2,"u",z],[vx2,"v",z]],fl,zclip),
                "}"].join('');
            }
            return [
                "s1=-(",e.backface3D([[vx1,vy1,z1],[vx1,vy2,z1],[vx2,vy1,z1]],fl),");",
                "s2=",e.backface3D([[vx1,vy1,z2],[vx1,vy2,z2],[vx2,vy1,z2]],fl),";",
                "s",pr,"=s1*",side,">=s2*",side,";",
                // if we have to pick a side, (instead of both) we should pick the side which has the biggest visible angle
                s['plane'+pr]?[ e.beginShape(s['plane'+pr]),
                   "sa = s1*",e.style.side*side,";","sb = s2*",e.style.side*side,";",e.style.oneside?"if(sa>=sb)sb = -1;if(sb>=sa)sa = -1;":"",
                   "for(i=1;i>=0;i--){if((i?sa:sb)>=0){z=i?",z1,":",z2,";", plane("z"),"}};",
                ].join(''):"",
                s['hbar'+pr]?[ e.beginShape(s['hbar'+pr]),
                   "sa = s1*",e.style.side*side,";","sb = s2*",e.style.side*side,";",e.style.oneside?"if(sa>=sb)sb = -1;if(sb>=sa)sa = -1;":"",
                   "for(i=1;i>=0;i--){if((i?sa:sb)>=0){z=i?",z1,":",z2,";",hbar("z"),"}};"
                ].join(''):"",
                s['vbar'+pr]?[ e.beginShape(s['vbar'+pr]),
                   "sa = s1*",e.style.side*side,";","sb = s2*",e.style.side*side,";",e.style.oneside?"if(sa>=sb)sb = -1;if(sb>=sa)sa = -1;":"",
                   "for(i=1;i>=0;i--){if((i?sa:sb)>=0){z=i?",z1,":",z2,";",vbar("z"),"}};"
                ].join(''):"",
                s['plane2'+pr]?[ e.beginShape(s['plane2'+pr]),
                   e.poly3DClip([0,1,2,3],[[vx1,vy1,z1],[vx2,vy1,z1],[vx2,vy2,z1],[vx1,vy2,z1]],fl,zclip),
                ].join(''):""
            ].join('');
        }
        
        function drawAxis(pr,fl,z1,z2,side1,side2,us,ws,wind,
                            vx1,vx2,vbx,vex,vbx2,vex2,vcx,vcx2,
                            vy1,vy2,vby,vey,vby2,vey2,vcy,vcy2 ){
            // pick a side, then draw a poly3DClip from vx1,vy1 to vx2, vy1
            var zclip = -1, sider, sd;
            if(s['axis'+pr]){
                if((sd = s['axis'+pr].side1) !== undefined )side1 = sd;
                if((sd = s['axis'+pr].side2) !== undefined )side2 = sd;
            }
            var sideloop = [
                "for(i=0;i<4;i++)if((i&2?(",side2,"?((f1=0,c=1,y=",vy1,"),1):0):(",side2,"?0:((f1=1,c=-1,y=",vy2,"),1)))&&",
                                   "(i&1?(",side1,"?((f2=0,d=1,z=",z1,"),1):0):(",side1,"?0:((f2=1,d=-1,z=",z2,"),1))))"
            ].join('');
            return [
                s['axis'+pr]?[e.beginShape(s['axis'+pr]),
                // "if(s//figure out side"
                sideloop,"{",
                    e.poly3DClip([0,1],[[vx1,"y","z"],[vx2,"y","z"]],fl,zclip,true),
                "};"].join(''):"",
                // lets draw the ticks
                s['tick'+pr]?[e.beginShape(s['tick'+pr]),
                sideloop,"{",
                    ";u=y+",us,"*__sin(f=(",e.style.angle,")*",wind,")*(",e.style.scale,")*c;w=z+",ws,"*__cos(f)*(",e.style.scale,")*d;",
                    "for(v=",vbx,";v<=",vex,";v+=",vcx,"){",
                        e.poly3DClip([0,1],[["v","y","z"],["v","u","w"]],fl,zclip,true),
                    "};",
                "};"].join(''):"",/*
                ";u=",vy1,"+",us,"*__sin(n);w=",z1,"+",ws,"*__cos(n);",
                "for(v=",vbx,";v<=",vex,";v+=",vcx,"/10){",
                    e.poly3DClip([0,1],[["v",vy1,z1],["v","u","w"]],fl,zclip,true),
                "};"
                */
                // lets draw some textitems
                s['label'+pr]?[e.beginFont(s['label'+pr], ["__ceil(((",vex,")-(",vbx,"))/(",vcx,"))*2"].join('')),
                sideloop,"{",
                    ";u=y+",us,"*__sin(f=(",e.style.angle,")*",wind,")*(",e.style.scale,")*c;w=z+",ws,"*__cos(f)*(",e.style.scale,")*d;",
                    "for(v=",vbx,";v<=",vex,";v+=",vcx,"){",
                        e.text3D(["v","u","w"],fl,zclip,e.style.format), 
                    "}",
                "}"].join(''):"",
                
            ].join('')
        }
        var c = e.optimize([
            e.beginLayer(l),
            e.vars(),
            this.chartView3D(l,e),
            e.defCamVec(),
            e.clear(),
            "var v,d,c,u,h,w,f1,f2,",
                "vcx = 0.5*__pow(",s.layout.pow,", __round(__log(__abs(vw)/",s.layout.pow,
                    ")/__log(",s.layout.pow,")))*",s.layout.step,",",
                "vcy = 0.5*__pow(",s.layout.pow,", __round(__log(__abs(vh)/",s.layout.pow,
                    ")/__log(",s.layout.pow,")))*",s.layout.step,",",
                "vcz = 0.5*__pow(",s.layout.pow,", __round(__log(__abs(vd)/",s.layout.pow,
                    ")/__log(",s.layout.pow,")))*",s.layout.step,",",
                "vbx = __ceil(vx1/vcx) * vcx,", 
                "vby = __ceil(vy1/vcy) * vcy,",
                "vbz = __ceil(vz1/vcz) * vcz,",
                "vex = __floor(vx2/vcx) * vcx,",
                "vey = __floor(vy2/vcy) * vcy,",
                "vez = __floor(vz2/vcz) * vcz,",
                "vcx2 = vcx*2, vcy2 = vcy*2, vcz2 = vcz*2,",
                "vbx2 = __ceil(vx1/vcx2)*vcx2,", 
                "vex2 = __floor(vx2/vcx2)*vcx2,", 
                "vby2 = __ceil(vy1/vcy2)*vcy2,", 
                "vey2 = __floor(vy2/vcy2)*vcy2,", 
                "vbz2 = __ceil(vz1/vcz2)*vcz2,", 
                "vez2 = __floor(vz2/vcz2)*vcz2,",
                "s1, s2, sa, sb, sxy, sxz, syz;", 
            "var xmaxstep = __ceil( (vex-vbx)/vcx )+4,",
                "ymaxstep = __ceil( (vey-vby)/vcy )+4,",
                "zmaxstep = __ceil( (vez-vbz)/vcz )+4;",
            //e.beginShape(s.test),
            //e.poly3DClip([0,1,2,3],[["-1","-1","1"],["1","-1","0"],["1","1","0"],["-1","1","1"]],null,-4),
            
            drawPlane('xy',[0,1,2],"vz1","vz2",1,
                        "vx1","vx2","vbx","vex","vbx2","vex2","vcx","vcx2",
                        "vy1","vy2","vby","vey","vby2","vey2","vcy","vcy2"),
            drawPlane('xz',[0,2,1],"vy1","vy2",-1,
                        "vx1","vx2","vbx","vex","vbx2","vex2","vcx","vcx2",
                        "vz1","vz2","vbz","vez","vbz2","vez2","vcz","vcz2"),
            drawPlane('yz',[2,0,1],"vx1","vx2",1,
                        "vy1","vy2","vby","vey","vby2","vey2","vcy","vcy2",
                        "vz1","vz2","vbz","vez","vbz2","vez2","vcz","vcz2"),
            // this axis can be drawn on 4 sides. which side it draws is styled + dynamic
            drawAxis('x',[0,1,2],"vz1","vz2","sxy","sxz","s3yi","s3zi",1,
                        "vx1","vx2","vbx","vex","vbx2","vex2","vcx","vcx2",
                        "vy1","vy2","vby","vey","vby2","vey2","vcy","vcy2"),
            drawAxis('y',[1,0,2],"vz1","vz2","sxy","syz","s3xi","s3zi",-1,
                        "vy1","vy2","vby","vey","vby2","vey2","vcy","vcy2",
                        "vx1","vx2","vbx","vex","vbx2","vex2","vcx","vcx2"),
            drawAxis('z',[2,1,0],"vx1","vx2","syz","sxz","s3yi","s3xi",1,
                        "vz1","vz2","vbz","vez","vbz2","vez2","vcz","vcz2",
                        "vy1","vy2","vby","vey","vby2","vey2","vcy","vcy2"),
			e.endLayer()
        ]);
        try{
          //c = apf.formatJS(c);
          //logw(apf.highlightCode2(c));        
          var f = new Function('l','v','m',c);
          //document.title = (new Date()).getTime() - dt;
          return f;
        }catch(x){
            //window.open().document.write("<script>" + c + "</script>");
            alert("Failed to compile:\n"+x.message+'\n'+c);return 0;
        }		
    },
    //#endif
    // #ifdef __ENABLE_CHART_LINE2D
    _line2D: {
        graph : {
            inherit : 'shape',
            stroke : '#000000',
            weight: 1,
        $:1}
    },
    line2D : function( l, d, s ){
        if(!s.graph) return new Function('');
        var wrap = s.graph.weight*8, e = apf.draw;
        var clipy = s.graph.fillout?"db":"ty";
        var c = e.optimize([
            e.vars(),
            "if(m){",
                "return -1;",
            "}",
            e.beginLayer(l),
            d.vars,d.stats,
            e.beginShape(s.graph),
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,
            ",x = x1,xw=x2-x1,idx=xw/xs;",d.begin,
            "var xfirst = x,dx=-vx1*tw,dy=-vy1*th;",
            d.seek,
            //"logw(",d.y,");",
            d.ifdraw,"{",
            s.graph.fill?[
                e.moveTo(d.x+"*tw+tx",clipy),
                e.lineTo(d.x+"*tw+tx",d.y+"*th+ty"),
            ].join(''):e.moveTo(d.x+"*tw+tx",d.y+"*th+ty"),
            
            "for(x+=idx;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                e.lineTo(d.x+"*tw+tx",d.y+"*th+ty"),
            "}",
            s.graph.fill?["x-=idx;",e.lineTo(d.x+"*tw+tx",clipy)].join(''):"",
            "}",
            e.endLayer()
            ].join(''));
        try{
           // c = apf.formatJS(c);
			return new Function('l','v','m',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    },
    // #endif
  
    // #ifdef __ENABLE_CHART_LINE3D
    _line3D: {
		graph : {
            inherit : 'shape',
			steps : 50,
			zpos : 0,
            depth : 0.5,
            stroke: 'black',
            fill: 'red',
            opacity: 0.3,
        $:1}
    },
    
    line3D : function( l, d, s ){
        if(!s.graph) return new Function('');
        var e = apf.draw, wrap = s.graph.weight*4; 

        var c = e.optimize([
            e.vars(),
            "if(m){",
                "return -1;",
            "}",
            e.beginLayer(l),
            this.chartView3D(l,e),
//e.poly3D([0,1,2,3,-1],[["vx1","vy1",0],["vx1","vy2",0],["vx2","vy2",0],["vx2","vy1",-1]]),
            d.vars,d.stats,
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,",x=x1,xw=x2-x1,idx=xw/xs,",
                "k = 0, xi, yi, xa, ya, xb, yb, xc, yc, xd, yd;",
            d.seek,
            e.beginShape(s.graph),
            d.ifdraw,"{",
            
            e.moveTo3D("xb="+d.x,"yb="+d.y,s.graph.zpos),
            "for(x+=idx,i=0;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                "xa = ",d.x,",ya=",d.y,";",
                e.lineTo3D("xa","ya",s.graph.zpos,"xi=","yi="),
                e.lineTo3D("xa","ya",s.graph.zpos+"+"+s.graph.depth, "xc=","yc="),
                "if(!i){i++;",
                    e.lineTo3D("xb","yb",s.graph.zpos+"+"+s.graph.depth),
                "} else {",
                    e.lineTo("xd","yd"), 
                "}",
                e.close(),
                e.moveTo("xi","yi"),
                "xd=xc, yd=yc, xb = xa, yb = ya;",
            "}",
            "}",
            e.endLayer()]);
        try{        
            //c = apf.formatJS(c);
            //logw(apf.highlightCode2(c));
            return new Function('l','v','m',c);
        }catch(x){
//            window.open().document.write("<script>function(){" + apf.formatJS(c) + "}</script>");
            alert("Failed to compile:\n"+c);return 0;
        }
    },
    //#endif
    
    // #ifdef __ENABLE_CHART_BAR3D
    _bar3D: {
        graph : {
            inherit : 'shape',
            stroke: '#000000',
            weight : 1,
            fill : 'red',
        $:1}
    },    
    
    bar3D : function(l,d,s){
        if(!s.graph) return new Function('');
        var e = apf.draw, g = apf.visualize;
         
        var c = e.optimize([
            "if(m){return -1;}",
            e.beginLayer(l),
            e.vars(),
            this.chartView3D(l,e),
            e.defCamVec(),
            d.vars,
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,",x,xw=x2-x1,idx=xw/xs,",
                "wx = idx*tw,wy,cx1,cx2,cy1,cy2;",
            d.seek,
            e.beginState(s.graph, e, e.shapedRect, 4),
            d.ifdraw,"{",
            "for(x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                "cx1=",d.x,",cy1=",d.y,",cx2=cx1+idx,cy2=0;",
                e.poly3DClip([0,1,2,3],[["cx1","cy1",0],["cx2","cy1",0],["cx2","cy2",0],["cx1","cy2",0]],[0,1,2],-1),
            "};",
            "}",
            e.endLayer()]);
        // lets return a mouse tracking function too.
        try{
            return new Function('l','v','m',c);
        }catch(x){
            alert(x.message+"\nFailed to compile:\n"+c);return 0;
        }
    },
     //#endif
    
    // #ifdef __ENABLE_CHART_HEIGHT3D    
    _height3D: {
		graph : {
            inherit : 'shape',
			steps : 50,
			zpos : 0,
            depth : 0.5,
            stroke: 'black',
            fill: 'red',
            opacity: 0.3,
        $:1}
    },
    
    height3D : function( l, d, s ){
        if(!s.graph) return new Function('');
        var e = apf.draw;
        var c = e.optimize([
            e.vars(),
            "if(m){",
                "return -1;",
            "}",
            e.beginLayer(l),
            this.chartView3D(l,e),
            d.vars,d.stats,
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,",x=x1,xw=x2-x1,idx=xw/xs,",
                "z1=",d.z1,",z2=",d.z2,",zs=",d.zs,",z=z1,zw=z2-z1,idz=zw/zs,",
                "k = 0, xi, yi, xa, ya, xb, yb, xc, yc, xd, yd;",
            d.seek,
            e.beginShape(s.graph),
            d.ifdraw,"{",
            (s.graph.fill)?[
            "var ar1=[], ar2=[];",
            "for(x=x1,i=0;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                e.store3D(d.x,d.y,d.z,"ar1[i++]=","ar1[i++]="),
            "};",
            "for(z+=idz;z<z2",d.forz,";z+=idz",d.incz,")",d.ifz,"{",
                "x=x1, i=0, j=0;",
                // lets move to first pixel
                e.store3D(d.x,d.y,d.z,"ar2[i++]=","ar2[i++]="),
                "for(x+=idx;x<x2",d.forx,";x+=idx,j+=2",d.incx,")",d.ifx,"{",
                    e.moveTo("ar1[j]","ar1[j+1]"),
                    e.lineTo("ar1[j+2]","ar1[j+3]"),
                    e.lineTo3D(d.x,d.y,d.z,"ar2[i++]=","ar2[i++]="),
                    e.lineTo("ar2[j]","ar2[j+1]"),
                    e.close(),
                "}",
                "ar1=ar2,ar2=[];",
                // lets draw all the 3d shapes between the two arrays
                // then we switch arrays
            "}"].join(''):[
                 "for(;z<z2",d.forz,";z+=idz",d.incz,")",d.ifz,"{",
                    // lets move to first pixel
                    "x=x1;",
                    e.moveTo3D(d.x,d.y,d.z),
                    "for(x+=idx;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                        e.lineTo3D(d.x,d.y,d.z),
                    "}",
                 "}",
                 (s.graph.single>0)?"":[
                 "for(x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                    "z=z1;",
                    e.moveTo3D(d.x,d.y,d.z),
                    "for(z+=idz;z<z2",d.forz,";z+=idz",d.incz,")",d.ifz,"{",
                        e.lineTo3D(d.x,d.y,d.z),
                    "}",
                 "}"].join(''),
            ].join(''),
            /*
            e.moveTo3D("xb="+d.x,"yb="+d.y,s.graph.zpos),
            "for(x+=idx,i=0;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                "xa = ",d.x,",ya=",d.y,";",
                e.lineTo3D("xa","ya",s.graph.zpos,"xi=","yi="),
                e.lineTo3D("xa","ya",s.graph.zpos+s.graph.depth, "xc=","yc="),
                "if(!i){i++;",
                    e.lineTo3D("xb","yb",s.graph.zpos+s.graph.depth),
                "} else {",
                    e.lineTo("xd","yd"), 
                "}",
                e.close(),
                e.moveTo("xi","yi"),
                "xd=xc, yd=yc, xb = xa, yb = ya;",
            "}",*/
            "}",
            e.endLayer()]);
        try{        
            //c = apf.formatJS(c);
            //logw(apf.highlightCode2(c));
            return new Function('l','v','m',c);
        }catch(x){
            //window.open().document.write("<script>" + c + "</script>");
            alert("Failed to compile:\n"+c);return 0;
        }
    },
    // #endif
    
    /* bar3D : function(l,e){

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
    },*/
    
    
    
    /*bar3DXY : function(l,e){
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
    },*/
    
    
    // #ifdef __ENABLE_CHART_BAR2D
    _bar2D: {
        graph : {
            inherit : 'shape',
            shape: 'rect',
            stroke: '#000000',
            weight : 1,
            fill : 'red',
        $:1}
    },
    bar2D : function(l,d,s){
        var e = apf.draw, g = apf.visualize;
        if(!s.graph) return new Function('');
            
        var c = e.optimize([
            e.vars(),
            d.vars,
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,",x,xw=x2-x1,idx=xw/xs,",
                "wx = idx*tw,wy;",
            d.seek,
            "\n\n/*------ bar2D Mousecode ------ */\n",
            "if(m){",
                e.beginMouseState(s.graph,e,e.shapedRect,4),
                "for(x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                    e.checkMouseState(d.state,d.time,"("+d.x+")*tw+tx","wy=("+d.y+")*th+ty",
                                "wx","ty-wy"),
                "};",                
                "return -1;",
            "}",
            "\n\n/*------ bar2D Drawcode ------ */\n",
            e.beginLayer(l),
            e.beginState(s.graph, e, e.shapedRect, 4),
            d.ifdraw,"{",
            "for(x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                e.drawState(d.state,d.time,"("+d.x+")*tw+tx","wy=("+d.y+")*th+ty",
                            "wx","ty-wy"),
            "};",
            "}",
            e.endLayer()]);
        // lets return a mouse tracking function too.
        try{
            //logw(apf.highlightCode2(c=apf.formatJS(c)));
            return new Function('l','v','m',c);
        }catch(x){
            //window.open().document.write("<script>" +apf.formatJS(c)+ "</script>");
            alert(x.message+"\nFailed to compile:\n"+c);return 0;
        }
    },
    // #endif
    
    // #ifdef __ENABLE_CHART_SHAPE2D
   _shape2D: {
        graph: {
            inherit : 'shape',
            stroke: '#000000',
            weight : 1,
            left: -1.5,
            top : -1.5,
            height: 3,
            width: 4,
            fill : 'red',
        $:1}
    },
    shape2D : function(l,d,s){
        if(!s.graph) return new Function('');
        var e = apf.draw, g = apf.visualize;
         
        var c = e.optimize([
            "if(m){return -1;}",
            e.beginLayer(l),
            e.vars(),
            d.vars,
            "var x1=",d.x1,",x2=",d.x2,",xs=",d.xs,",x,xw=x2-x1,idx=xw/xs,",
                "wx = idx*tw,wy;",
            "tx += ",s.graph.left*l.ds,";",
            "ty += ",s.graph.top*l.ds,";",
            d.seek,
            e.beginState(s.graph, e, e.draw2D, 4),
            d.ifdraw,"{",
            "for(x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                e.drawState(d.state,d.time,"("+d.x+")*tw+tx","wy=("+d.y+")*th+ty",
                            s.graph.width*l.ds,s.graph.height*l.ds),
            "};",
            "}",
            e.endLayer()]);
        // lets return a mouse tracking function too.
        try{
            return new Function('l','v','m',c);
        }catch(x){
            alert(x.message+"\nFailed to compile:\n"+c);return 0;
        }
    },    
    
    // #endif
    
    // #ifdef __ENABLE_CHART_PIE2D
    _pie2D: {
        margin : {
            left: 0,
            top: 0,
            width: 1,
            height: 1,
        $:1},
        graph : {
            inherit : 'shape',
            stroke: '#000000',
            weight : 1,
            fill : 'red',
        $:1}
    },
    pie2D : function(l,d,s){
        if(!s.graph) return new Function('');
       
        var e = apf.draw, g = apf.visualize;
        var c = e.optimize([
            "/*------ pie2D Init ------*/\n",
            e.vars(),
            
            d.vars,d.stats,
           "var x1=",d.vx1,",x2=",d.vx2,",xw=x2-x1,",
                "idx=1,sum=1/(",d.sum,"),rx=0,",
                "xp=(",s.margin.left,")*tw+tx,",
                "yp=(",s.margin.top,")*th+ty,",
                "wp=(",s.margin.width,")*tw,",
                "hp=(",s.margin.height,")*th,",
                "wq=0.5*wp, hq = 0.5*hp,",
                "xc=xp+wq, yc=yp+hq, piesize;",
            d.seek,
            "\n\n/*------ pie2D Mousecode ------ */\n",
            "if(m){",
                e.beginMouseState(s.graph,e,e.shapedPart,6,['piesize']),
                "for(rx=0,x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
                    e.checkMouseState(d.state,d.time,"xc","yc","wq","hq",
                                "rx","-rx+(rx+=("+d.y+")*sum)"),
                "};",
                "return -1;",
            "}",
            "\n\n/*------ pie2D Drawcode ------ */\n",
            e.beginLayer(l),
            e.beginState(s.graph,e,e.shapedPart,6,['piesize']),
            "for(rx=0,x=x1;x<x2",d.forx,";x+=idx",d.incx,")",d.ifx,"{",
/*                e.drawState(d.state,d.time,"xc","yc","wq","hq",
                            "rx","-rx+(rx+=("+d.y+")*sum)"),*/
                "piesize = ("+d.y+")*sum;",
                e.drawState(d.state,d.time,"xc","yc","wq","hq","rx","-rx+(rx+=piesize)"),
            "};",
            "\n\n/*------ pie2D End ------ */\n",
            e.endLayer()]);
            //alert(c);
        // lets return a mouse tracking function too.
        try{
            //;
//            logw(apf.highlightCode2(apf.formatJS(c)));
            return new Function('l','v','m',c);
        }catch(x){
            alert(x.message+"\nFailed to compile:\n"+c);return 0;
        }
    },
    // #endif
    dt_math1X : function(l) {
        return {
            type : 'math1X',
            vars : "var _stp= l.step&&(vx2-vx1)/l.step<l.steps?l.step:(vx2-vx1)/l.steps;",
            vx1 : 0, vx2 : 1, vy1 : 0, vy2 : 1, vz1 : 0, vz2 : 1,
            x1 : "__floor(vx1/_stp)*_stp",
            x2 : "__ceil(vx2/_stp+1)*_stp",
            xs : "(x2-x1)/_stp",
            stats : "", seek : "",
            forx : "",  ifx : "", incx : "",ifdraw : "",
            x : "x",
            y : "("+apf.draw.getXYWH(l.pformula,'x')+")"
        };
    },
    
    dt_math2X : function(l){
        return {
            type : 'math2X',
            vars : "var _stp= l.step&&(vx2-vx1)/l.step<l.steps?l.step:(vx2-vx1)/l.steps;",
            vx1 : -1, vx2 : 1, vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            x1 : "__floor(vx1/_stp)*_stp",
            x2 : "__ceil(vx2/_stp+1)*_stp",
            xs : "(x2-x1)/_stp",
            stats : "", seek : "",
            forx : "",  ifx : "", incx : "",ifdraw : "",
            x : "("+apf.draw.getXYWH(l.pformula,'x')+")",
            y : "("+apf.draw.getXYWH(l.pformula,'y')+")"
        };
    },
    dt_math1XZ : function(l){
        return {
            type : 'math1XY',
            vars : "var _stpx= l.step&&(vx2-vx1)/l.step<l.steps?l.step:(vx2-vx1)/l.steps,"+
                       "_stpz=l.step&&(vz2-vz1)/l.step<l.steps?l.step:(vz2-vz1)/l.steps;",
            vx1 : -1, vx2 : 1, vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            /*
            x1 : "__floor(vx1/_stp)*_stp",
            x2 : "__ceil(vx2/_stp+1)*_stp",
            xs : "(x2-x1)/_stp",
            z1 : "__floor(vz1/_stp)*_stp",
            z2 : "__ceil(vz2/_stp+1)*_stp",
            zs : "(z2-z1)/_stp",
            */
            x1 : "vx1",
            x2 : "vx2",
            xs : "(x2-x1)/_stpx",
            z1 : "vz1",
            z2 : "vz2",
            zs : "(z2-z1)/_stpz",

            
            stats : "", seek : "",
            forx : "",  ifx : "", incx : "",ifdraw : "",
            forz : "",  ifz : "", incz : "",ifdraw : "",            
            x : "x",
            z : "z",
            y : "("+apf.draw.getXYWH(l.pformula,'x')+")"
        };
    },
    
    dt_math1R : function(l){
        var part = l.formula.split(";");
        return {
            type : 'math1R',
            vx1 : -1, vx2 : 1, vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            x1 : 0, 
            x2 : "Math.PI*2+(Math.PI*2/(l.style.steps-1))", 
            xs : "l.style.steps",
            x : "__sin(_p="+apf.visualize.mathParse(part[0])+
                ")*(_r="+apf.visualize.mathParse(part[1])+")",
            y : "__cos(_p)*_r"
        };
    },    
    dt_series1XM : function(l) {
        return {
            type : 'series1XM',
            vars : 
            "var _mf = __min(__ceil(vx2)+1,l.v_yvalmip[0].length)-__max(__floor(vx1),0);"+ 
            "var _ms = l.mipstep, _mt = 1;"+
            "while(_mf>l.mipthres && _mt<l.v_yvalmip.length){"+
                "_mf = _mf / _ms;_mt++;"+
            "}"+
            "var _div = __pow(_ms,_mt-1);"+
            "var _off = _mt>1?__pow(_ms,_mt-2):0;"+
            "var _yv = l.v_yvalmip[_mt-1],_i;",
            
            vx1 : 0, vx2 : "_yv.length", vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            state : "0",
            time : "0",

            sum : "l.v_sum",
            min : "l.v_min",
            max : "l.v_max",
            avg : "l.v_avg",
            
            seek : "",stats:"",
            ifdraw : "if((!l.mipmin || _mt>l.mipmin) && (!l.mipmax || _mt<l.mipmax))",
            forx : "",  ifx : "",
            incx : "",
            x1 : "__max(__floor(vx1/_div-1),0)", 
            x2 : "__min((__ceil(vx2/_div)+1),_yv.length)", 
            xs : "x2-x1",
            x : "(x*_div+_off)",
            y : "_yv[x]"
        };
    },    
    dt_series1X : function(l) {
        return {
            type : 'series1X',
            vars : "var _yv = l.v_yval,_sv = l.v_state, _tv = l.v_time,_i,_mi,_ma;",
            vx1 : 0, vx2 : "_yv.length", vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            state : "_sv[x]",
            time : "_tv[x]",
            sum : "l.v_sum",
            min : "l.v_min",
            max : "l.v_max",
            avg : "l.v_avg",
            forx : "",  ifx : "", incx : "",
            stats : 
"if(!l.v_sum){for(i=_yv.length-1,j=0,_mi=10000000,_ma=-10000000;i>=0;--i)j+=((m=_yv[i])<_mi?_mi=m:m)>_ma?_ma=m:m;l.v_avg=(l.v_sum=j)/_yv.length;l.v_min=_mi;l.v_max=_ma;}",
            x1 : "__max(__floor(vx1),0)", 
            x2 : "__min(__ceil(vx2)+1,_yv.length)", 
            x1c : "__max(__floor(vx1),0)", 
            x2c : "__min(__ceil(vx2)+1,_yv.length)", 
            xs : "x2-x1",
            x : "x",
            y : "_yv[x]"
        };
    },
    dt_series2X : function(l) {
        var    len = l.yvalue.length;
        return {
            type : 'series2X',
            vx1 : 0, vx2 : len, vy1 : -1, vy2 : 1, vz1 : 0, vz2 : 1,
            vars : "var _vx = l.xvalue, _vy = l.yvalue, _len = _vy.length;",
            x1 : 0, 
            x2 : "_len", 
            xs : "_len",
            x : "_vx[x]",
            y : "_vy[x]"
        };
    },
$:0};
apf.chart_draw.height2D = apf.chart_draw.line2D;
apf.chart_draw._height2D = apf.chart_draw._line2D;

//#endif