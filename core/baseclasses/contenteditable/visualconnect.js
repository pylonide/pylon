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
    /* 
     * modes: 
     * draw     : mode to create a new connection
     * element  : mode for displaying connections of selected element
     * all      : mode for displaying connections of all elements
     */
    var lineMode = "draw";  // current lineMode of visualConnect
    
    var active, div;    // visualconnect is active
    var fromEl, toEl;   // selected 'from element' and 'to element' during draw mode
    var fromAtt, toAtt; // selected attribute of 'from' and 'to' element;
    var connections;    // connections that are drawn
    var attMenu;        // menu with attributes of element that appears when creating connection
    var ignoreFromAtts = ["id"];    // attributes for from element to ignore in attMenu
    var ignoreToAtts = ["for"];    // attributes for to elements to ignore in attMenu
    var _self = this;
    var prevSelection;
    
    // init draw api
    var width = document.body.clientWidth;
    //@todo adjust height to browser window height?
    var height = 800;//document.body.clientHeight;
    var paintGroup = apf.vector.group({w:width,h:height,z:1000});
    
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
    
    this.setMode = function(mode) {
        lineMode = mode;
        
        if (this.onchangemode)
            this.onchangemode({mode: mode});
    };
    
    this.activate = function(e, timeout){
        if (active) 
            return;

        active = true
        //document.getElementById("log").innerHTML += "activated<br>";
        var _self = this;
        var drawPath = [], connectionPath = [], hNode, pos, selection = sel.$getNodeList(), lines = [];
        var timer, lastTime;
        var isDrawing = false;
        
        (function draw() {
            apf.plane.show();
            
            div = document.body.appendChild(document.createElement("div"));
            div.style.display = "block";
            div.style.position = "absolute";
            div.style.left = "0px";
            div.style.top = "0px";
            div.style.zIndex = 100000001;
            
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

            switch (lineMode) {
                case "draw":
                    startDraw(e);
                    break;
                case "element":
                    if (selection.length)
                        createConnections(selection)
                        showConnections();
                    break;
                case "all":
                    var all = [];
                    for (var el, i = 0, l = apf.all.length; i < l; i++) {
                        if ((el=apf.all[i]).$ext && el.prefix == "a") all.push(apf.all[i]);
                    }
                    if (createConnections(all))
                        showConnections();
                    break;
            }
        })();
        
        function createConnections(elements) {
            connections = null;
            if (elements.length){
                for (var i = 0, l = elements.length; i < l; i++) {
                    for (var val, targetEl, targetAttr, split, j = 0, jl = elements[i].attributes.length; j < jl; j++) {
                        // @todo regex search of "{"
                        if ((val = elements[i].attributes[j].value).toString().charAt(0) == "{" && val.toString().charAt(val.length-1) == "}") {
                            // check if value is attribute of an element
                            if (targetEl = apf.document.getElementById((split=val.split("."))[0].substr(1))) {
                                targetAttr = split[1].substr(0, split[1].length-1);
                                createConnection(elements[i], targetEl, elements[i].attributes[j].name, targetAttr);
                            }
                        }
                    }
                }
            }
            
            var found = false;
            for (var id in connections) {
                found = true;
            }
            return found;
        }
        
        function showConnections() {
            if (connections) {
                drawConnections();
                paintConnections.style({p: connectionPath.join(" ")});

                apf.plane.show();
                paintGroup.style({v:1});
                paintGroup.repaint();
            }
            else {
                alert("no connections");
//                paintGroup.style({v:0});
//                paintGroup.repaint();
                
                // message "no connections"
                
//                _self.deactivate();
            }
        }
        
        function startDraw(e){
            apf.dragMode = true; //prevents selection
            
            fromEl = null;
            toEl = null;
        }
        
        function stopDraw(e){
            apf.dragMode = true;
            apf.plane.hide();
            
            paintGroup.style({v:0});
            paintGroup.repaint();
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            // target amlNode found, create connection

            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                toEl = amlNode;

                // draw connection line
                var hNode, x, y, w, h, pos;
                var from = {
                    x : (x=(pos=apf.getAbsolutePosition((hNode=fromEl.$ext)))[0]),
                    y : (y=pos[1]),
                    w : (w=hNode.offsetWidth),
                    h : (h=hNode.offsetHeight),
                    c : [Math.round(x+w/2), Math.round(y+h/2)]  // center of element
                }
                var to = {
                    x : (x=(pos=apf.getAbsolutePosition((hNode=toEl.$ext)))[0]),
                    y : (y=pos[1]),
                    w : (w=hNode.offsetWidth),
                    h : (h=hNode.offsetHeight),
                    c : [Math.round(x+w/2), Math.round(y+h/2)]  // center of element
                }
                var pos1 = from.c, pos2 = to.c;
                
                paintGroup.style({v:1});
                paintLine.style({p: [
                    "M",pos1[0],pos1[1],"L",pos2[0],pos2[1],
                    paintGroup.circlePath(pos2[0],pos2[1],1,1)].join(" ")
                });
                paintGroup.repaint();
                
                
                var x = e.clientX, y = e.clientY;
                
                if (!toEl.attributes.length) return;
                for (var name, attList = [], i = 0, l = toEl.attributes.length; i < l; i++) {
                    if (ignoreToAtts.indexOf((name = toEl.attributes[i].name)) > -1) continue;
                    attList.push(new apf.item({
                        caption: name
                    }));
                }

                attMenu = new apf.menu({
                  htmlNode   : div,
                  id         : "attMenu",
                  childNodes : attList
                });

                setTimeout(function(e){
                    attMenu.display(x, y);
                });
                
                attMenu.addEventListener("mousedown", function(e) {
                    //apf.console.info("mousedown on attMenu");
                    (e||event).cancelBubble = true;
                });
                attMenu.addEventListener("mouseup", function(e) {
                    //apf.console.info("mouseup on attMenu");
                    (e||event).cancelBubble = true;
                });
                attMenu.addEventListener("itemclick", function(e) {
                    sel.$selectList(selection = [fromEl]);
                    apf.dragMode = true; //prevents selection
                    toAtt = e.value;
                    attMenu.setProperty("visible", false);
                    fromEl.setAttribute(fromAtt, "{" + toEl.id + "." + toAtt + "}");
                    //_self.setMode("element");
                    
                    paintLine.style({p:""});    // remove drawLine
                    
                    if (createConnections([fromEl]))
                        showConnections();
                    
                    //apf.cancelBubble((e || event), attMenu);
                });
            }
            isDrawing = false;

            //_self.deactivate();
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
            var amlNode;
            
            //clearTimeout(showAllTimer);
            if (lineMode == "element") {
                if (selection.length) {
                    if (createConnections(selection)) {
                        paintGroup.style({v:0});
                        paintGroup.repaint();

                        showConnections();
                    }
                }
            }
            else if (lineMode == "draw" && !fromEl) {
                apf.plane.hide();
                var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
                amlNode = apf.findHost(htmlNode);
                if (amlNode) {
                    //apf.console.info("mousedown in draw mode");
                    fromEl = amlNode;
                    sel.$selectList(selection = [fromEl]);
                    
                    var x = e.clientX, y = e.clientY;
                    
                    if (!fromEl.attributes.length) return;
                    for (var name, attList = [], i = 0, l = fromEl.attributes.length; i < l; i++) {
                        if (ignoreFromAtts.indexOf((name = fromEl.attributes[i].name)) > -1) continue
                        attList.push(new apf.item({
                            caption: name
                        }));
                    }

                    attMenu = new apf.menu({
                      htmlNode   : div,
                      id         : "attMenu",
                      childNodes : attList
                    });
                    
                    setTimeout(function(e){
                        attMenu.display(x, y);
                    });
                    
                    attMenu.addEventListener("itemclick", function(e) {
                        sel.$selectList(selection = [fromEl]);
                        fromAtt = e.value;
                        attMenu.setProperty("visible", false);
                        isDrawing = true;
                    });
                }
               
                _self.setMode("draw-started");
                //debugger;
                apf.plane.show();
                    
                   
            } else {
                if (attMenu.visible)
                    attMenu.setProperty("visible", false);
                if (fromEl) {
                    stopDraw(e);
                }
            }
        };
        
        document.onmouseup = function(e){
            // lets see if we should stop drawing
            if (!isDrawing)
                apf.dragMode = false; //prevents selection
        }
        
        /*document.onkeydown = function(e) {
            e = e || event;
            
            // Esc key
            if (e.keyCode == 27) {
                fromEl = toEl = fromAtt = toAtt = null;
                lineMode = null;
                _self.deactivate();
            }
        }*/
        
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

            if (!connections) connections = {};
            if (!connections[el1.id]) connections[el1.id] = [];
            connections[el1.id].push({
                from : {
                    el      : el1,
                    at      : at1,
                    pos     : from.c
                },
                to : {
                    el      : el2,
                    at      : at2,
                    pos     : to.c
                }
            })
        }
        
        function drawConnections() {
            connectionPath = [];
            
            var oDiv = document.createElement("div");
            oDiv.style.position = "absolute";
            oDiv.style.width = "320px";
            oDiv.style.height = "20px";
            oDiv.style.border = "1px solid black";
            oDiv.style.background = "yellow";
            oDiv.style.fontSize = "12px";
            
            var srcDiv = document.createElement("div");
            srcDiv.style.display = "inline-block";
            srcDiv.style.width = "100px";
            var tgtInput = document.createElement("input");
            tgtInput.type = "text";
            tgtInput.style.display = "inline";
            tgtInput.style.width = "170px";
            tgtInput.style.fontSize = "12px";

            var saveDiv = document.createElement("div");
            saveDiv.style.width = "20px";
            saveDiv.style.height = "20px";
            saveDiv.style.display = "inline";
            saveDiv.style.background = "green";
            saveDiv.style.color = "white";
            saveDiv.innerHTML = "Save";
            
            var delDiv = document.createElement("div");
            delDiv.style.width = "20px";
            delDiv.style.height = "20px";
            delDiv.style.display = "inline";
            delDiv.style.background = "red";
            delDiv.style.color = "white";
            delDiv.innerHTML = "Del";
            
            oDiv.appendChild(srcDiv);
            oDiv.appendChild(tgtInput);
            oDiv.appendChild(saveDiv);
            oDiv.appendChild(delDiv);

            // reset div
            if (div) document.body.removeChild(div);
            div = document.body.appendChild(document.createElement("div"));
            div.style.display = "block";
            div.style.position = "absolute";
            div.style.left = "0px";
            div.style.top = "0px";
            div.style.zIndex = 100000001;
            
            for (var id in connections) {
                for (var aDiv, centerPos, pos1, pos2, i = 0, l = connections[id].length; i < l; i++) {
                    // default positions for lines, start and end
                    pos1 = connections[id][i].from.pos;
                    pos2 = connections[id][i].to.pos;

                    // calculate center of line
                    centerPos = [Math.round((pos1[0]+pos2[0])/2), Math.round((pos1[1]+pos2[1])/2)];
                    
                    // value divs
                    aDiv = oDiv.cloneNode(true);
                    aDiv.getElementsByTagName("div")[0].innerHTML = connections[id][i].from.el.id + "." + connections[id][i].from.at
                    aDiv.getElementsByTagName("input")[0].id = id + "_" + i;
                    aDiv.getElementsByTagName("input")[0].value = "{" + connections[id][i].to.el.id + "." + connections[id][i].to.at + "}";
                    aDiv.getElementsByTagName("input")[0].onmousedown = function(e) {
                        (e || event).cancelBubble = true;
                    }
                    aDiv.getElementsByTagName("input")[0].onmouseup = function(e) {
                        (e || event).cancelBubble = true;
                    }
                    // redraw on property change
                    var at = connections[id][i].from.at;
                    //connections[id][i].from.el.addEventListener("prop." + connections[id][i].from.at, draw);
                    
                    // saveBtn
                    aDiv.getElementsByTagName("div")[1].setAttribute("onmousedown", connections[id][i].from.el.id + ".setAttribute('" + connections[id][i].from.at + "', document.getElementById('" + id + "_" + i + "').value); event.cancelBubble = true;");
                    aDiv.getElementsByTagName("div")[1].setAttribute("onmouseup", "event.cancelBubble = true;");
                    
                    aDiv.getElementsByTagName("div")[2].onmousedown = function(e) {
                        debugger;
                        connections[id][i].from.el.setAttribute(connections[id][i].from.at, '');
                        event.cancelBubble = true;
                    }
                    aDiv.getElementsByTagName("div")[2].onmousedown = function(e) {
                        event.cancelBubble = true;
                    }
                    // delBtn
                    //aDiv.getElementsByTagName("div")[2].setAttribute("onmousedown", connections[id][i].from.el.id + ".setAttribute('" + connections[id][i].from.at + "', ''); event.cancelBubble = true;");
                    //aDiv.getElementsByTagName("div")[2].setAttribute("onmouseup", "event.cancelBubble = true;");
                    
                    // even number of connections
                    var linePadding = 4;
                    if (l % 2 == 0) {
                        pos1 = [pos1[0], pos1[1] - (l/2*linePadding*i) + linePadding/2];
                        pos2 = [pos2[0], pos2[1] - (l/2*linePadding*i) + linePadding/2];
                        centerPos = [centerPos[0] - aDiv.style.width.replace("px", "")/2, centerPos[1] - l/2*aDiv.style.height.replace("px", "")*i];
                    }
                    // odd number of connections                    
                    else {
                        pos1 = [pos1[0], pos1[1] - (l+1)/2*linePadding*(i+0.5) + 3];
                        pos2 = [pos2[0], pos2[1] - (l+1)/2*linePadding*(i+0.5) + 3];
                        centerPos = [centerPos[0] - aDiv.style.width.replace("px", "")/2, centerPos[1] - (l+1)/2*aDiv.style.height.replace("px", "")*(i+0.5)]
                    }
                    
                    aDiv.style.top = centerPos[1] + "px";
                    aDiv.style.left = centerPos[0] + "px";
                    div.appendChild(aDiv);
                    
                    // draw line
                    connectionPath.push(
                        //paintGroup.circlePath(pos1[0],pos1[1],1,1),
                        "M",pos1[0],pos1[1],"L",pos2[0],pos2[1],
                        paintGroup.circlePath(pos2[0],pos2[1],1,1)
                    );
                    
                    /*
                    connectionPath.push(
                        paintGroup.circlePath(centerPos[0],centerPos[1],3,3)
                    )
                    */
                }
            }
        }        
    };

    this.deactivate = function(){
        if (!active) return;
        //if (lineMode) return;
        active = false;
        var selection;
        if (selection = sel.$getNodeList())
            prevSelection = selection;
        
        document.onmousedown = 
        document.onmousemove = 
        document.onmouseup = null;
        //document.onkeydown = null;
        
        apf.dragMode = false;
        
        apf.plane.hide();
        paintLine.style({p:""});
        paintConnections.style({p:""});
        paintRect.style({w:0,h:0});
        paintGroup.style({v:0});
        paintGroup.repaint();
        //if (div) div.style.display = "none";
        if (div) document.body.removeChild(div);
    };
};
//#endif