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
//#ifdef __ENABLE_DRAW_VML
apf.draw.vml = {
   //----------------------------------------------------------------------
    
    // initialization
    
    //----------------------------------------------------------------------
     
    initRoot : function(r){
        // Note to microsoft: !@#$&(@#*& you destroyed VML performance on purpose didnt you. Get people to go silverlight. 
        if(!apf.isIE8){
            apf.importCssString("v\\:fill {behavior: url(#default#VML);display:inline-block} v\\:stroke {behavior: url(#default#VML);} v\\:shape {behavior: url(#default#VML);} v\\:path {behavior: url(#default#VML);}");
            r.$ext.innerHTML = "\
                <div style='z-index:10000;position:absolute;left:0px;width:0px;\
                            background:url(images/spacer.gif);width:"+
                            r.width+"px;height:"+r.height+"px;'>\
                </div>\
                <div style='margin: 0 0 0 0;padding: 0px 0px 0px 0px; \
                            position:absolute;display:inline-block;left:0;top:0;width:"+
                            r.width+'px;height:'+r.height+
                            "px;overflow:hidden;'>\
                </div>";
            r.vmlroot = r.$ext.lastChild;
       } else {
            r.$ext.innerHTML = "\
                <div style='z-index:10000;position:absolute;left:0px;width:0px;\
                            background:url(images/spacer.gif);width:"+
                            r.width+"px;height:"+r.height+"px;'>\
                </div>\
                <iframe style='margin:0 0 0 0;padding:0 0 0 0;background:transparent; \
                            position:absolute;border:0px;display:inline-block;left:0;top:0;width:"+
                            r.width+'px;height:'+r.height+
                            "px;overflow:hidden;'>\
                </iframe>";
            r.vmliframe = r.$ext.lastChild;
            r.vmliframe.allowTransparency=true;
            var doc = r.vmliframe.contentWindow.document;
            doc.open();
            doc.writeln("<head><meta http-equiv='X-UA-Compatible' content='IE=EmulateIE7' /></head>\
                        <style>v\\:fill {behavior: url(#default#VML);display:inline-block} v\\:stroke {behavior: url(#default#VML);}\
                        v\\:shape {behavior: url(#default#VML);} v\\:path {behavior: url(#default#VML);}</style>\
                        <html><body style='margin: 0 0 0 0;padding: 0 0 0 0;border: 0px;background:transparent;'>\
                        <div style='position:absolute;display:inline-block;'></div></body></html>");
            doc.close();
            r.vmlroot = doc.body.firstChild;
      }
      //  var div = r.vmlroot.document.createElement("div");
      //  div.innerHTML = "EHLLO";
      //  r.vmlroot.document.body.appendChild(div);
//        var doc = r.vmlroot.contentWindow.document.innerHTML="<body style='background:red'>WHEEE</body>";
//        alert();
        return this;
    },
    resizeRoot : function(r){
        var t = r.vmliframe || r.vmlroot;
        t.style.width = r.width;
        t.style.height = r.height;
        t = t.previousSibling;
        t.style.width = r.width,
        t.style.height = r.height;
        if(r.vmliframe){
            t = r.vmlroot;
            t.style.width = r.width;
            t.style.height = r.height;
        }
	},
    initLayer : function(l , r){
  //      var vmlroot = r.vmlroot;
        l.ds = 1;
        l.dx = 0,l.dy = 0;
        l.dw = parseFloat(l.width)*l.ds;
        l.dh = parseFloat(l.height)*l.ds;

        l._styles       = [];
        l._htmljoin     = [];
        l._vmlroot     = r.vmlroot;
//        l._vmlgroup    = vmlgroup;
    },

    resizeLayer : function(l, r){
        // update layer position, and perhaps z-order or all items in a _vmlgroup.
        var lx,ly,lw,lh,t;
        l.dx = 0, l.dy = 0;
        l.dw = parseFloat(lw=l.width)*l.ds;
        l.dh = parseFloat(lh=l.height)*l.ds;
        var coord = (l.dw+1)+","+(l.dh+1);
        if(l._vmlgroup){
            (t=l._vmlgroup).style.left=lx=l.left,t.style.top=ly=l.top,t.style.width=lw,t.style.height=lh;
            for(var n = l._vmlgroup.childNodes, l = n.length, i = 0;i<l;i++){
                (t=n[i]).style.width = lw, t.style.height = lh;
                if(t.coordsize){
                    t.coordsize = coord;
                }
            }
        }
    },

    deinitLayer : function(l){
        // we should remove the layer from the output group.
        if(l._vmlgroup){
            l._vmlgroup.removeNode();
            l._vmlgroup = 0;
        }
    },

    beginLayer : function(l){
		// if we already had a layer, we need to clean that shit up
		if(l._styles.length){
            if(l._vmlgroup)l._vmlgroup.innerHTML="";
            l._styles = [];
            l._htmljoin = [];
		}
		
        this.l = l,this.mx="",this.my="",this.last=null;
        return [ this.jssVars,
                "if(!l._styles)_initStyles();",
                "var _s1,_s2,_s3,_s4,_s5,_s6,_s7,_s8,_s9,_st,_su,_sv,",
                "_x1,_x2,_x3,_x4,_x5,_x6,_x7,_x8,_x9,_x10,",
                "_y1,_y2,_y3,_y4,_y5,_y6,_y7,_y8,_y9,_y10,",
                    "_t,_u,_l,_dx,_dy,_tn,_tc,_lc,_s,_p,",
                   "_styles = l._styles;"
        ].join('');
    },

    clear : function(){
        return '';
    },
    
    // create layer init code in output 
    endLayer : function(){
        var l = this.l;
        var s = [this.$endDraw()], k, h, v, f;
        var p = [];
        var i = 0, j = 0,style,len = l._styles.length;
        for(;i<len;i++){
            style = l._styles[i];
            if(style._prev===undefined){ // original style
                p.push("_styles[",i,"]={",
                       "_domnode:_n=l._vmlgroup.childNodes[",j,"]");
                if(style.$stylelist){
                    p.push(",",apf.draw.serializeStyleState(style))
                }
                if(style.isshape){
                    s.push(this.$finalizeShape(style));
                    p.push(",_vmlfill:_n.lastChild?_n.lastChild.previousSibling:0,_vmlstroke:_n.lastChild");
                }else{
                    p.push(",_txtused:0,_txtcount:0,_txtnodes:[],_txtdiv:\"",style._txtdiv,"\"");
                    s.push(this.$finalizeFont(style));
                 }
               p.push("};");  j++;
            }
        }
       
        s.push( [
            "l._anim = _anim;",
            "function _initStyles(){",
                "l._vmlroot.insertAdjacentHTML('beforeend',[",
                "\"<div style='position:absolute;display:inline-block;left:\",l.left,\"",
                              "px;top:\",l.top,\"px;width:\",l.width,\"px;height:\",l.height,\"",
                              "px;overflow:hidden;'>\",",
                "\"",l._htmljoin.join(''),"\",",
                "\"</div>\"].join(''));",
                "l._vmlgroup = l._vmlroot.lastChild;",
                "var _n, _styles = l._styles = [];",
                p.join(''),
            "};"
        ].join(''));
        l._styles = null;
        this.l = null;
        return s.join('');
//       alert(l._htmljoin.join(''));
    },
    
    //----------------------------------------------------------------------
    
    // Shape rendering
    
    //----------------------------------------------------------------------

    beginShape : function(style) {
        if(!style)return "document.title='beginShape Failed';";
        var l=this.l, html = l._htmljoin, i, t,
            shape=[], path=[], child=[], opacity="", s=[this.$endDraw()];
        style._path = [];
        if(style._id === undefined){
            style._id = l._styles.push(style)-1;
        }
        this.style = style;

        // find a suitable same-styled other shape so we minimize the VML nodes
        for(i = l._styles.length-2;i>=0;i--){
            if(!l._styles[i]._prev && 
                this.$canJoin( t=l._styles[i], style )){
                style._prev = (t._prev !== undefined)?t._prev:i;
                break;
            }
        }       

        if(style._prev === undefined) {
            s.push("_p=(_s=_styles[",style._id,"])._path=[];");
            // lets check the style object. what different values do we have?
            if(typeof style.tile != 'undefined'){
                var fillopacity = style.fillopacity;
                if( this.isDynamic(fillopacity) ){
                    fillopacity = '1';
                    s.push("_s._vmlfill.opacity=",style.fillopacity,";");
                };
                if(this.isDynamic(style.tile)){
                    s.push("if(_s._vmlimg!=(_t=",style.tile,"))_s._vmlfill.src=_t;");
                    child.push("<v:fill origin='0,0' position='0,0' opacity='",fillopacity,
                                "' src='' type='tile'/>"); 
                }else{
                    child.push("<v:fill origin='0,0' position='0,0' opacity='",fillopacity,
                         "'  src='",style.tile,"' type='tile'/>"); 
                    if(style.tilex || style.tiley){
                        style._img = new Image(); style._img.src = style.tile;
                        if(style.tilex)
                            s.push("_s._vmlfill.origin.x=((_t=((",
                                style.tilex,")/(_s._img.width))%1)<0?1+_t:_t);");
                        if(style.tiley)
                            s.push("_s._vmlfill.origin.y=((_t=((",
                                style.tiley,")/_s._img.height)%1)<0?1+_t:_t);");
                    }
                }
                s.push("_p.push('m',_dx=-_s._img.width*100,' ',_dy=-_s._img.height*100,",
                       "',l',_dx,' ',_dy);");
            }else
            if(style.fill !== undefined){
                // check if our fill is dynamic. 
                var fill = style.fill, fillopacity = style.fillopacity,
                    angle = style.angle, gradopacity = style.gradopacity;
                if(!fill.sort)fill=[fill];
                var len = fill.length;
                var color='black', colors, color2, getColorors;
                // precalc the colors value, we might need it later
                if(len>2){
                    for(i=1;i<len-1&&!this.isDynamic(fill[i]);i++);
                    if(i!=len-1){ // its dynamic
                        for(t=[],i=1;i<len-1;i++)
                            t.push(i>1?'+",':'"',Math.round((i/(len-1))*100),'% "+',
                              this.getColor(fill[i]));
                        colors = t.join('');
                        getColorors = 1;
                    }else{
                        for(t=[],i=1;i<len-1;i++)
                            t.push(i>1?',':'',Math.round((i/(len-1))*100),'% ',fill[i]);
                        colors = t.join(''); 
                    }
                }
                if(len>1){
                    // we have a gradient
                    if( this.isDynamic(gradopacity) || this.isDynamic(fillopacity)){
                        // hack to allow animated opacitys for gradients. There is no o:opacity2 property unfortunately
                        if(gradopacity == fillopacity)fillopacity='_t='+fillopacity,gradopacity='_t';
                        if(len>2)t=gradopacity,gradopacity=fillopacity,fillopacity=t;
                        s.push(
                          "if(_s._vmldata!=(_t=", 
                           "[\"<v:fill opacity='\",(",fillopacity,"),\"' method='none' ",
                           "o:opacity2='\",",gradopacity,",\"' color='\",",
                           this.getColor(fill[0]),",\"' color2='\",",
                           this.getColor(fill[len-1]),",\"' type='gradient' angle='\",parseInt(((",
                           angle,")*360+180)%360),\"' ", colors?(getColorors?"colors='\","+
                           colors+",\"'":"colors='"+colors+"'"):"",
                           "/>\"].join(''))){",
                           "_s._domnode.removeChild(_s._vmlfill);",
                           "_s._domnode.insertAdjacentHTML( 'beforeend',_s._vmldata=_t);",
                           "_s._vmlfill = _s._domnode.lastChild;};");
                        child.push("<v:fill opacity='0' color='black' type='fill'/>");
                    }else{
                        if(len>2)t=gradopacity,gradopacity=fillopacity,fillopacity=t;
                        if( this.isDynamic(fill[0]) )
                            s.push("_s._vmlfill.color=",this.getColor(fill[0]),";");
                        else color = fill[0];

                        if(this.isDynamic(fill[len-1]))
                            s.push("_s._vmlfill.color2=",
                                this.getColor(fill[len-1]),";");
                        else color2 = fill[len-1];
                        
                        if(getColorors){
                          s.push("_s._vmlfill.colors.value=",colors,";");
                        }
                        if( this.isDynamic(angle) ){
                            angle = '0';
                            s.push("_s._vmlfill.angle=(((",style.angle,")+180)*360)%360;");
                        };
                        if( this.isDynamic(fillopacity) ){
                            fillopacity = '1';
                            s.push("_s._vmlfill.opacity=",style.fillopacity,";");
                        };
                        child.push("<v:fill opacity='",
                            fillopacity,"' method='none' o:opacity2='",
                            gradopacity,colors?"' colors='"+colors+"'":"",
                            "' color='",color,"' color2='",color2,
                            "' type='gradient' angle='",(angle*360+180)%360,"'/>");
                    }
                }else{
                    if( this.isDynamic(fillopacity) ){
                            fillopacity = '1';
                            s.push("_s._vmlfill.opacity=",style.fillopacity,";");
                    };
                    if( this.isDynamic(fill[0]) ){
                        s.push("_s._vmlfill.color=",this.getColor(fill[0]),";");
                    }else color = fill[0];
                
                    child.push("<v:fill opacity='",fillopacity,
                        "' color=",this.getColor(color)," type='fill'/>");
                }
                shape.push("fill='t'"),path.push("fillok='t'");
            } else {
                shape.push("fill='f'"),path.push("fillok='f'");
            }
            if(style.stroke !== undefined){
                var weight = style.weight,
                    opacity = style.strokeopacity,
                    stroke = style.stroke;
                if( this.isDynamic(opacity) ){
                        opacity = '1';
                        s.push("_s._vmlstroke.opacity=",style.opacity,";");
                }
                if( this.isDynamic(weight) ){
                        weight = '1';
                        s.push("_t=",style.weight,
                            ";_s._vmlstroke.weight=_t;if(_t<",opacity,
                            ")_s._vmlstroke.opacity=_t;");
                }
                if( this.isDynamic(stroke) ){
                        stroke = 'black';
                        s.push("_s._vmlstroke.color=",this.getColor(style.stroke),";");
                }
                    
                //@todo @rik please check this I changed getColor(stroke) to getColor(stroke.dataType == apf.ARRAY ? stroke[0] : stroke)
                child.push("<v:stroke opacity='",
                    weight<1?(opacity<weight?opacity:weight):opacity,
                    "' weight='",weight,"' color=",this.getColor(stroke.dataType == apf.ARRAY ? stroke[0] : stroke),"/>");
            } else {
                shape.push("stroke='f'"), path.push("strokeok='f'");
            }
                    
            html.push(["<v:shape alignshape='f' ",
                      "style='position:absolute;display:inline-block;left:0;top:0;width:",
                      "\",l.width,\"px;height:\",l.height,\"px;overflow:hidden;' ",
                      "coordorigin='0,0' coordsize='\",(l.dw+1),\",\",(l.dh+1),\"'",
                      "path='' ",shape.join(' '),"><v:path ",
                    path.join(' '),"/>",child.join(' '),"</v:shape>"].join(''));
        }else{
            if(style._prev !== undefined){
                if(this.last !== style._prev)
                    s.push("_p=(_s=_styles[",style._prev,"])._path;");
            }    
        }
        //alert(html.join(''));
        return s.join('');
    },
       
    // drawing command
    moveTo : function(x, y){
        return ["_p.push('m',__round(",x,")",
               ",' ',__round(",y+"),'l');\n"].join('');
    },
    
    lineTo : function(x, y){
        return ["_p.push(__round(",x,")",
               ",' ',__round("+y+"));\n"].join('');
    },
    
    lineH : function(x,y,w){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r',__round(",w,"),' 0');"].join('');
    },
    
    lineV : function(x,y,h){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r0 ',__round(",h,"));"].join('');
    },
    
    dot : function(x,y){
        return ["_p.push('m',__round(",x,")",
                ",' ',__round(",y,")",
                ",'r0 0');"].join('');
    },
    
    rect : function( x,y,w,h,inv ){
        return ["_u=",x,";if((_t=__round(",w,"))>0)_p.push('m',__round(_u),' ',__round(",y,")",
                ",'r',_t,' 0r0 ',__round(",h,
                inv?"),'r-'+_t,' 0x');":"),'r-'+_t,' 0xe');"].join('');
    },

    ellipse : function( x,y,w,h,s,e,c){
       if(!s){
        return ["_p.push('at ',(_x1=__round(",x,"))-(_x2=__round(",w,
                ")),' ',(_y1=__round(",y,"))-(_y2=__round(",h,")),' ',",
                "_x1+_x2,' ',_y1+_y2,' 0 0 0 0');"].join('');
       }else{ // generate heaps of crap
        return ["if( (_t=",s,")+0.000001<(_u=",e,")){",
                "_p.push('",c?"wa":"at"," ',(_x1=__round(",x,
                "))-(_x2=__round(",w,")),' ',(_y1=__round(",y,
                "))-(_y2=__round(",h,")),' ',_x1+_x2,' ',_y1+_y2,' ',",
                "__round(_x1+__sin(_t)*_x2*4000),' ',",
                "__round(_y1+__cos(_t)*_y2*4000),' ',",
                "__round(_x1+__sin(_u)*_x2*4000),' ',",
                "__round(_y1+__cos(_u)*_y2*4000),'x');}else{",
                "_p.push('l',__round((",x,")+__sin(_t)*(",w,
                ")),' ',__round((",y,")+__cos(_t)*(",h,")),'x');",
                "}",
                ].join('');
       }
       /*
       
       return ["_p.push('al ',_x1=__round(",x,"),' ',_y1=__round(",y,"),' ',",
               "_x1+__round(",w,"),' ',_y1+__round(",h,"),' 90 1024');"].join('');*/
    },

    
    rectInv : function( x,y,w,h ){
        return this.rect(x,y,w,h,1);
    },
    
    close : function (){
        return "_p.push('xe');";
    },
      
    $endShape : function(){
        this.mx="",this.my="";
        this.last = this.style._id;
        this.style = 0;    
        return '';
    },
      
    $finalizeShape : function(style){
        return ["if((_s=_styles[",style._id,"])._pathstr!=(_t=",
            "(_p=_s._path).length?_p.join(' '):'m'))_s._domnode.path=_t;\n"].join('');
    }
           
};
//#endif
//#endif