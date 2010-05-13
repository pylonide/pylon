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
    var connections = [];
    var lineMode;
    var connectionIdx = 0;
    //@linh the interaction with shift is flawed. It should be :
    //  shift-click at start - click at end
    //  it shouldnt matter when shift is unpressed
    //  when pressing escape line mode should dissapear
    
    // init draw api
    var width = document.body.clientWidth;
    var height = 800;//document.body.clientHeight;
    var paintGroup = apf.vector.group({w:width,h:height,z:1000000});
    var paintRect = paintGroup.rect({
        sw: 1,
        s: "#24a3f4",
        f: "#24a3f4",
        o: 0.2
    });
    var paintLine   = paintGroup.shape({
        p: "",
        sw: 1.5,
        s: "#24a3f4",
        f: "#24a3f4"
    });
    
    this.activate = function(e, timeout){
        
        if (active) 
            return;
        active = true
        //document.getElementById("log").innerHTML += "activated<br>";
        var _self = this;
        var path = [], hNode, pos, selection = sel.$getNodeList(), lines = [];

        apf.plane.show();

        var showAllTimer = setTimeout(function(){
        }, timeout);
        
        var timer, lastTime;
        var isDrawing = false;
        var isFar = false;
        if(selection.length>1){
            startDraw(e);
        }
        
        function startDraw(e){
            apf.dragMode = true; //prevents selection
            paintLine.style({p: path.join(" ")});
            paintGroup.style({v:1});
            paintGroup.repaint();
            isDrawing = true;
            
            updateDraw(e);
            /*
            for (var i = 0, il = selection.length; i < il; i++) {
                hNode = selection[i].$ext;
                pos = apf.getAbsolutePosition(hNode);
                var sx = ~~(pos[0] + (hNode.offsetWidth/2)), sy = ~~(pos[1] + (hNode.offsetHeight/2)), ex = e.clientX, ey = e.clientY;
                path.push(paintGroup.circlePath(sx,sy,5,5),"M",sx,sy,"L",ex,ey,paintGroup.circlePath(ex,ey,3,3));
            }
            */
        }
        
        function stopDraw(e){
            apf.plane.hide();
            
            paintGroup.style({v:0});
            paintGroup.repaint();
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                // we are going to make a connection between nodes
                
                /*
                var x = e.clientX;
                var y = e.clientY;
                
                setTimeout(function(){
                    mnuContentEditable.display(x, y);
                });
                */
            }
            _self.deactivate();
            isDrawing = false;
        }
        
        function updateDraw(e){
            apf.plane.hide();
            paintGroup.style({v:0});
            paintGroup.repaint();
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                htmlNode = amlNode.$ext;
                var pos = apf.getAbsolutePosition(htmlNode);
                paintRect.style({
                    x: pos[0], 
                    y: pos[1],
                    w: htmlNode.offsetWidth,
                    h: htmlNode.offsetHeight
                });
            }
            else {
                paintRect.style({
                    w: 0, h: 0
                });
            }
            
            var path = [];
            for (var i = 0, il = selection.length; i < il; i++) {
                hNode = selection[i].$ext;
                pos = apf.getAbsolutePosition(hNode);
                var sx =  ~~(pos[0] + (hNode.offsetWidth/2)), sy = ~~(pos[1] + (hNode.offsetHeight/2)), ex = e.clientX, ey = e.clientY;
                path.push("M",sx,sy,"L",ex,ey,paintGroup.circlePath(sx,sy,4,4),paintGroup.circlePath(ex,ey,3,3));
            }
            paintLine.style({p: path.join(" ")});

            apf.plane.show();
            paintGroup.style({v:1});
            paintGroup.repaint();
        }
        
        document.onmousemove = function(e){
            if (!e) e = event;
            
            clearTimeout(timer);
            if (lastTime && new Date().getTime() 
              - lastTime < apf.mouseEventBuffer) {
                var z = {
                    clientX: e.clientX,
                    clientY: e.clientY
                }
                timer = setTimeout(function(){
                    //@todo
                }, 10);
                return;
            }
            lastTime = new Date().getTime();
            
            if(isDrawing)
                updateDraw(e);
           
        }
        
        document.onmousedown = function(e){
            if (!e) e = event;

            clearTimeout(showAllTimer);
            
            if(!isDrawing){
                apf.plane.hide();
                var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
                var amlNode = apf.findHost(htmlNode);
                sel.$selectList(selection = [amlNode]);
                apf.plane.show();
                // lets get the selection we clicked on to draw a line
                startDraw(e);
            } else {
                stopDraw(e);
            }
        };
        
        document.onmouseup = function(e){
            // lets see if we should stop drawing
            if(!isDrawing)
                apf.dragMode = false; //prevents selection
        }
    };

    this.deactivate = function(){
        //document.getElementById("log").innerHTML += "deactivated<br>";
        active = false;
        
        document.onmousedown = 
        document.onmousemove = null;
        
        apf.plane.hide();
        //debugger;
        paintLine.style({p:""});
        paintRect.style({w:0,h:0});
        paintGroup.style({v:0});
        paintGroup.repaint();
    };
        
    this.enableLineMode = function() {
        lineMode = true;
    };
};
//#endif