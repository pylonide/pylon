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

//#ifdef __WITH_CONTENTEDITABLE
/**
 * @private
 */
apf.visualConnect = function (sel){
    var active, div;
    
    //@linh This should be here, the vector lib keeps state
    // init draw api
    var width = document.body.clientWidth;
    var height = 800;//document.body.clientHeight;
    // create drawing node
    if (div)
        div.style.display = "block";
    else {
        div = document.body.appendChild(document.createElement("div"));
        
        div.style.display = "block";
        div.style.position = "absolute";
        div.style.top = 0;
        div.style.left = 0;
        div.style.zIndex = 100000000;
    }
    
    var ctx = new apf.vector.vml(div,width,height,0,0);
    var p   = ctx.path({
        p: "",
        sw: 2,
        s: "black"
    });
    
    this.activate = function(e){
        if (active) 
            return;
        active = true
        
        apf.plane.show();
        var _self = this;
        
        var path = [], hNode, pos, selection = sel.$getNodeList(), lines = [];
        for (var i = 0, il = selection.length; i < il; i++) {
            hNode = selection[i].$ext;
            pos = apf.getAbsolutePosition(hNode);
            path.push("M", pos.join(" "), "L", (pos[0] + hNode.offsetWidth), (pos[1] + hNode.offsetHeight));
        }
        p.style({p: path.join(" ")});
        ctx.repaint();
        div.style.display = "block";
      
//        apf.dragMode = true; //prevents selection

        document.onmousemove = function(e){
            if (!e) e = event;

            for (var i = 0, il = lines.length; i < il; i++) {
                lines[i].style({
                    p: ["L",e.clientX,e.clientY].join(" ")
                });
            }
            ctx.repaint();
            apf.console.log("mousemove");
        }

        /*
        document.onmouseup = function(e){
            //return;
            apf.plane.hide();
            apf.dragMode = false; //prevents selection
            
            if (!e) e = event;
            var htmlNode = document.elementFromPoint(e.offsetX, e.offsetY);
            var amlNode = apf.findHost(htmlNode);
            
            _self.deactivate();
        };
        */
    };

    this.deactivate = function(){
        active = false;
        apf.plane.hide();
        //debugger;
        div.style.display = "none";
        
    };
};
//#endif