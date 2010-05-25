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
    var allElements = [];
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
    var paintConnections = paintGroup.shape({
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
        var drawPath = [], connectionPath = [], hNode, pos, selection = sel.$getNodeList(), lines = [];
        if (!div) div = document.body.appendChild(document.createElement("div"));
        div.style.display = "block";
        
        apf.plane.show();
/*
        var showAllTimer = setTimeout(function(){
            // lets show the drawing till someone clicks and then its gone
            // lets create some random lines
            var n = [];
            path = [];
            for(var i = 0;i<100;i++){
                var sx = ~~(Math.random()*600), sy = ~~(Math.random()*600), ex = ~~(Math.random()*600), ey = ~~(Math.random()*600);
                path.push(paintGroup.circlePath(sx,sy,3,3),"M",sx,sy,"L",ex,ey,paintGroup.circlePath(ex,ey,3,3));
            }

            paintLine.style({p: path.join(" ")});
            paintGroup.style({v:1});
            paintGroup.repaint();
        }, timeout);
*/
        var timer, lastTime;
        var isDrawing = false;
        var isFar = false;
        if(selection.length){
            connections = [];
            for (var i = 0, l = selection.length; i < l; i++) {
                for (var val, targetEl, targetAttr, split, j = 0, jl = selection[i].attributes.length; j < jl; j++) {
                    if ((val = selection[i].attributes[j].value).charAt(0) == "{") {
                        targetEl = apf.document.getElementById((split=val.split("."))[0].substr(1));
                        targetAttr = split[1].substr(0, split[1].length-1);
                        //drawConnection(selection[0], targetEl);
                        createConnection(selection[0], targetEl, selection[i].attributes[j].name, targetAttr);
                    }
                }
            }
            
            if (connections.length) {
                drawConnections();
                paintConnections.style({p: connectionPath.join(" ")});

                apf.plane.show();
                paintGroup.style({v:1});
                paintGroup.repaint();
            }
            
            startDraw(e);
        }

        function startDraw(e){
            apf.dragMode = true; //prevents selection
            paintLine.style({p: drawPath.join(" ")});
            paintGroup.style({v:1});
            paintGroup.repaint();
            isDrawing = true;
            
            updateDraw(e);
        }
        
        function stopDraw(e){
            apf.plane.hide();
            
            paintGroup.style({v:0});
            paintGroup.repaint();
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            // target amlNode found, create connection
            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                for (var s, attributes = [], dd, i = 0, l = selection.length; i < l; i++) {
                    //drawConnection((s=selection[i]), amlNode);
                }
                // show connections
                if (connectionPath.length) {
                    paintConnections.style({p: connectionPath.join(" ")});
                    // hide drawLine
                    paintLine.style({p:""});

                    apf.plane.show();
                    paintGroup.style({v:1});
                    paintGroup.repaint();
                }
                
                // we are going to make a connection between nodes
                
                /*
                var x = e.clientX;
                var y = e.clientY;
                
                setTimeout(function(){
                    mnuContentEditable.display(x, y);
                });
                */
                
            }
            //_self.deactivate();
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
            
            var drawPath = [];
            for (var i = 0, il = selection.length; i < il; i++) {
                hNode = selection[i].$ext;
                pos = apf.getAbsolutePosition(hNode);
                var sx =  ~~(pos[0] + (hNode.offsetWidth/2)), sy = ~~(pos[1] + (hNode.offsetHeight/2)), ex = e.clientX, ey = e.clientY;
                drawPath.push("M",sx,sy,"L",ex,ey,paintGroup.circlePath(sx,sy,3,3),paintGroup.circlePath(ex,ey,3,3));
            }
            paintLine.style({p: drawPath.join(" ")});

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

            //clearTimeout(showAllTimer);
            
            if(!isDrawing){
                if (!selection.length) {
                    apf.plane.hide();
                    var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
                    var amlNode = apf.findHost(htmlNode);
                    sel.$selectList(selection = [amlNode]);
                    apf.plane.show();
                }
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
        
        // create new connection
        function createConnection(el1, el2, at1, at2) {
            if (!(el1.id && el2.id && at1 && at2)) return;
            
            var pos, x, y, w, h;
            var pos1, pos2;
            var from = {
                x : (x=(pos=apf.getAbsolutePosition((hNode=el1.$ext)))[0]),
                y : (y=pos[1]),
                w : (w=hNode.offsetWidth),
                h : (h=hNode.offsetHeight),
                t : [Math.round(x+w/2), y],
                b : [Math.round(x+w/2), y+h],
                l : [x, Math.round(y+h/2)],
                r : [x+w, Math.round(y+h/2)],
                c : [Math.round(x+w/2), Math.round(y+h/2)]  // center of element
            }
            var to = {
                x : (x=(pos=apf.getAbsolutePosition((hNode=el2.$ext)))[0]),
                y : (y=pos[1]),
                w : (w=hNode.offsetWidth),
                h : (h=hNode.offsetHeight),
                t : [Math.round(x+w/2), y],
                b : [Math.round(x+w/2), y+h],
                l : [x, Math.round(y+h/2)],
                r : [x+w, Math.round(y+h/2)],
                c : [Math.round(x+w/2), Math.round(y+h/2)]  // center of element
            }

            // @todo more detailed calculation of line positions based on element positions
            if (from.r[0] < to.l[0] && from.b[1] < to.t[1] && from.b[0] < to.l[0]) {
                pos1 = "b";
                pos2 = "l";
            }
            else if (to.r[0] < from.l[0] && to.b[1] < from.b[1] && to.b[0] < from.l[0]) {
                pos1 = "l";
                pos2 = "b";
            }
            else if (to.r[0] < from.l[0] && to.b[1] < from.b[1] && to.b[0] < from.l[0]) {
                pos1 = "r";
                pos2 = "b";
            }
            else {
                pos1 = "c";
                pos2 = "c";
            }
            
            // add connection
            connections.push({
                from : {
                    el      : el1,
                    at      : at1,
                    pos     : pos1,
                    coords  : from
                },
                to : {
                    el      : el2,
                    at      : at2,
                    pos     : pos2,
                    coords  : to
                }
            });
        }
        
        function drawConnections() {
            // check for overlapping lines
            var numLines = {};
            for (var from, to, id1, id2, c, i = 0, l = connections.length; i < l; i++) {
                // from elemenet
                if (!numLines[(id1=(from=connections[i].from).el.id)]) numLines[id1] = {};
                if (!numLines[id1][(pos1=from.pos)])
                    numLines[id1][pos1] = 1;
                else
                    numLines[id1][pos1]++;
                    
                // to element
                if (!numLines[(id2=(to=connections[i].to).el.id)]) numLines[id2] = {};
                if (!numLines[id2][(pos2=to.pos)])
                    numLines[id2][pos2] = 1;
                else
                    numLines[id2][pos2]++;
            }

            // 
            // actually draw the lines
            for (pos1, pos2, i = 0, l = connections.length; i < l; i++) {
                pos1 = (from=(c=connections[i]).from).coords[from.pos];
                pos2 = (to=c.to).coords[to.pos];

                if ((from.pos == "b" && to.pos == "l") || (from.pos == "l" && to.pos == "b")) {
                    if (from.pos == "l" && to.pos == "b") {
                        var tmp = pos1;
                        pos1 = pos2;
                        pos2 = tmp;
                    }
                    connectionPath.push(
                        paintGroup.circlePath(pos1[0],pos1[1],3,3),
                        "M",pos1[0],pos1[1],"L",pos1[0],pos2[1],
                        "M",pos1[0],pos2[1],"L",pos2[0],pos2[1],
                        paintGroup.circlePath(pos2[0],pos2[1],3,3)
                    );
                }
                else {
                    if (!(pos1 && pos2)) {
                        pos1 = from.coords.c;
                        pos2 = to.coords.c;
                    }
                    connectionPath.push(
                        paintGroup.circlePath(pos1[0],pos1[1],3,3),
                        "M",pos1[0],pos1[1],"L",pos2[0],pos2[1],
                        paintGroup.circlePath(pos2[0],pos2[1],3,3)
                    );
                }
            }
        }
        
        /*
        function drawConnection(el1, el2) {
            hNode = el1.$ext;
            var hNode2 = el2.$ext;
            var pos1 = apf.getAbsolutePosition(hNode);
            var pos2 = apf.getAbsolutePosition(hNode2);

            // @todo calculate line position and direction
            var dx = Math.abs((x1=pos1[0]) - (x2=pos2[0]));
            var dy = Math.abs((y1=pos1[1]) - (y2=pos2[1]));
            
            var l1 = [x1+hNode.offsetWidth/2, y1+hNode.offsetHeight, x1+hNode.offsetWidth/2, y1+dy/2];
            var l2 = [x1+hNode.offsetWidth/2, y1+dy/2, x2+hNode2.offsetWidth/2, y1+dy/2];
            var l3 = [x2+hNode2.offsetWidth/2, y1+dy/2, x2+hNode2.offsetWidth/2, y2];
            
            connectionPath.push(
                paintGroup.circlePath(l1[0],l1[1],3,3),
                "M",l1[0],l1[1],"L",l1[2],l1[3],
                "M",l2[0],l2[1],"L",l2[2],l2[3],
                "M",l3[0],l3[1],"L",l3[2],l3[3],
                paintGroup.circlePath(l3[2],l3[3],3,3)
            );
            
//            var sx =  ~~(pos1[0] + (hNode.offsetWidth/2)), sy = ~~(pos1[1] + (hNode.offsetHeight/2)), ex = ~~(pos2[0] + (hNode2.offsetWidth/2)), ey = ~~(pos2[1] + (hNode2.offsetHeight/2));
//            connectionPath.push(paintGroup.circlePath(sx,sy,3,3),"M",sx,sy,"L",ex,ey,paintGroup.circlePath(ex,ey,3,3));
return;            
            // display dropdowns with attributes
            // @todo display dropdowns with properties, default value
            // @todo should change property value
            var dd1 = new apf.dropdown({
                htmlNode          : div
            });
            for (var ai = 0, al = el1.attributes.length; ai < al; ai++) {
                dd1.childNodes.push(new apf.item({
                  data : el1.attributes[ai].name
                }));
            }
            
            // @todo position dropdown depends on connection position
            dd1.$ext.style.position = "absolute";
            dd1.setProperty("left", el1.$ext.offsetLeft);
            dd1.setProperty("top", el1.$ext.offsetTop);
            
            if (el1.getValue())
                el1.value = "{" + el2.id + ".value}";
            else (el1.caption)
                el1.caption = "{" + el2.id + ".caption}";
        }
        */
    };

    this.deactivate = function(){
        //document.getElementById("log").innerHTML += "deactivated<br>";
        active = false;
        
        document.onmousedown = 
        document.onmousemove = null;
        
        apf.plane.hide();
        //debugger;
        paintLine.style({p:""});
        paintConnections.style({p:""});
        paintRect.style({w:0,h:0});
        paintGroup.style({v:0});
        paintGroup.repaint();
        div.style.display = "none";
    };
        
    this.enableLineMode = function() {
        lineMode = true;

        // collect all visible elements
        for (var el, i = 0, l = apf.all.length; i < l; i++) {
            if ((el=apf.all[i]).$ext && el.prefix == "a") allElements.push(apf.all[i]);
        }

    };
};
//#endif