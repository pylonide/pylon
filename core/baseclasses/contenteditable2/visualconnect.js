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
    var active, ctx, g, div;
    
    this.activate = function(e){
        if (active) return;
        active = true
        apf.plane.show();
        var _self = this;
        
        // init draw api
        var width = document.body.clientWidth;
        var height = 800;//document.body.clientHeight;
        // create drawing node
        if (div)
            div.style.display = "block";
        else {
            div = document.body.appendChild(document.createElement("div"));
            
            div.id = "drawnode";
            div.style.display = "block";
            div.style.position = "absolute";
            div.style.top = 0;
            div.style.left = 0;
            div.style.border = "1px solid black";
            div.style.background = "red";
        }

        if (!ctx)
            ctx = new apf.vector.vml('drawnode',width,height,0,0);
        g = ctx.group({x:0,y:0,w:width,h:height});

        //debugger;
        var hNode, pos, selection = sel.$getNodeList(), lines = [];
        for (var i = 0, il = selection.length; i < il; i++) {
            hNode = selection[i].$ext;
            pos = apf.getAbsolutePosition(hNode);
            pos.push(hNode.offsetWidth, hNode.offsetHeight);
            
            //draw the line
            ctx.path({
//                p: ["M",pos[0],pos[1],"L",e.clientX,e.clientY].join(" "),
                p: "M 0 0 L 500 500",
                s: "black"
            });
        }
        ctx.repaint();
      
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
return;

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