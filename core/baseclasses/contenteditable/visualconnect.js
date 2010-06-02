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
    
    var active, div, cTemplate;    // visualconnect is active
    var fromEl, toEl;   // selected 'from element' and 'to element' during draw mode
    var fromAtt, toAtt; // selected attribute of 'from' and 'to' element;
    var connections;    // connections that are drawn
    var attMenu;        // menu with attributes of element that appears when creating connection
    var ignoreFromAtts = ["id"];    // attributes for from element to ignore in attMenu
    var ignoreToAtts = ["for"];    // attributes for to elements to ignore in attMenu
    var _self = this;
    var prevSelection;
    
    var css = '.atchart_box {\
    color       : #333333;\
    font-family : Tahoma;\
    font-size   : 120px;\
    height      : 29px;\
    min-width   : 30px;\
    min-height  : 29px;\
    max-height  : 29px;\
    overflow    : hidden;\
    cursor      : default;\
    position    : absolute;\
}\
\
.atchart_box .left {\
    float         : left;\
    width         : 5px;\
    height        : 29px;\
}\
\
.atchart_box .lbl {\
    height        : 24px;\
    padding-top   : 5px;\
    text-align    : center;\
    margin        : 0 5px;\
    white-space   : nowrap;\
    overflow      : hidden;\
    text-overflow : ellipsis;\
}\
\
.atchart_box .right {\
    float        : right;\
    width        : 5px;\
    height       : 29px;\
}\
\
.atchart_box .red_button {\
    float        : right;\
    margin-left  : 2px;\
    width        : 20px;\
    background   : url("images/delete.png") no-repeat 50% 50%;\
    height       : 29px;\
}\
\
.atchart_box .left {\
    background : url("images/backg_left.png") no-repeat 0 0;\
}\
\
.atchart_box .lbl {\
    background : url("images/backg_middle.png") repeat-x 0 0;\
}\
\
.atchart_box .right {\
    background : url("images/backg_right.png") no-repeat 0 0;\
}\
\
.atchart_box span,\
.atchart_box label,\
.atchart_box input {\
    padding  : 1px 0;\
    border   : 1px solid transparent;\
    position : relative;\
    overflow : hidden;\
    float:left;\
    font-weight:bold;\
}\
\
.atchart_box span.section1 {\
}\
\
.atchart_box span.section2 {\
    color:#3799ea;\
    text-decoration:underline;\
    padding-right:10px;\
    background : url("images/arrow_down.png") no-repeat right 7px;\
}\
\
.atchart_box span.section2:hover,\
.atchart_box input.section5:hover {\
    background-color:#fcfcfc;\
}\
\
.atchart_box span.section3 {\
    margin:0 2px;\
}\
\
.atchart_box span.section4 {\
    color:#aaaaaa;\
}\
\
INPUT {\
    border:0;\
    width:105px;\
    background-color:#fcfcfc;\
    color       : #333333;\
    font-family : Tahoma;\
    font-size   : 12px;\
}';
    apf.importCssString(css);
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
                        createConnections(selection);
                        showConnections();
                    break;
                case "all":
                    var all = [];
                    for (var el, i = 0, l = apf.all.length; i < l; i++) {
                        if ((el=apf.all[i]).$ext && el.prefix == "a") all.push(apf.all[i]);
                    }
                    if (createConnections(all))
                        selection = all;
                        showConnections();
                    break;
            }
        })();
        
        function createConnections(elements) {
            connections = null;
            if (elements.length){
                // get all elements
                var all = [];
                for (var el, i = 0, l = apf.all.length; i < l; i++) {
                    if ((el=apf.all[i]).$ext && el.prefix == "a") all.push(apf.all[i])
                }

                // element as source element
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
                    
                    // check all elements if attribute of any element points to attribute of selected element
                    for (var ei = 0, el = all.length; ei < el; ei++) {
                        if (all[ei] == elements[i]) continue;
                        for (var ai = 0, al = all[ei].attributes.length; ai < al; ai++) {
                            // check for value with string {...}
                            if ((val = all[ei].attributes[ai].value).toString().charAt(0) == "{" && val.toString().charAt(val.length-1) == "}") {
                                if ((targetEl = apf.document.getElementById((split=val.split("."))[0].substr(1))) == elements[i]) {
                                    targetAttr = split[1].substr(0, split[1].length-1);
                                    createConnection(all[ei], targetEl, all[ei].attributes[ai].name, targetAttr);
                                }
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

            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1 && amlNode.tagName != "html") {
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

        function getTemplate() {
        /*
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
        */

            var oDiv = document.createElement("div");
            oDiv.setAttribute("class", "atchart_box");
            oDiv.setAttribute("style", "width:285px;color:#000000;font-family:Tahoma;font-size:12px;height:29px;min-width:30px;min-height:29px;max-height:29px;overflow:hidden;cursor:default;position:absolute;");
            oDiv.innerHTML = '<div class="left"> </div><div class="red_button"> </div><div class="right"> </div><div class="lbl"><span class="section1">Button.</span><span class="section2">caption</span><span class="section3">=</span><span class="section4">&quot;</span><label class="section5">{button2.value}</label><span class="section4">&quot;</span></div>';
            
            return oDiv;
        }
        
        function drawConnections() {
            if (!cTemplate)
                cTemplate = getTemplate();
            connectionPath = [];
            
            // reset div
            if (div) document.body.removeChild(div);
            div = document.body.appendChild(document.createElement("div"));
            div.style.display = "block";
            div.style.position = "absolute";
            div.style.left = "0px";
            div.style.top = "0px";
            div.style.width = width + "px";
            div.style.height = height + "px";
            
            div.onmousedown = div.onmouseup = function(e) {
                (e||event).cancelBubble = true;
            }

            div.style.zIndex = 100000001;
            
            for (var id in connections) {
                var curConnections = connections[id];
                for (var toId, toConns, i = 0, l = connections[id].length; i < l; i++) {
                    if (toConns = connections[(toId = connections[id][i].to.el.id)]) {
                        for (var ji = 0, jl = toConns.length; ji < jl; ji++) {
                            if (toConns[ji].to.el.id == id) {
                                moveConn = toConns.splice(ji, 1)[0];
                                curConnections.push(moveConn);
                            }
                        }
                    }
                    //if (connections[id][i]
                }
                
                for (var aDiv, container, containerEls, ddAtts, delBtn, centerPos, pos1, pos2, i = 0, l = curConnections.length; i < l; i++) {
                    // default positions for lines, start and end
                    pos1 = curConnections[i].from.pos;
                    pos2 = curConnections[i].to.pos;
                    // calculate center of line
                    centerPos = [Math.round((pos1[0]+pos2[0])/2), Math.round((pos1[1]+pos2[1])/2)];
                    
                    
                    // value divs
                    aDiv = cTemplate.cloneNode(true);
                    //aDiv.getElementsByTagName("div")[0].innerHTML = curConnections[i].from.el.id + "." + curConnections[i].from.at
                    
                    container = aDiv.getElementsByTagName("div")[3];
                    (containerEls = container.getElementsByTagName("span"))[0].innerHTML = (fromEl = curConnections[i].from.el).id + ".";
                    (ddAtts = containerEls[1]).innerHTML = curConnections[i].from.at;
                    ddAtts.setAttribute("el", fromEl.id);
                    (lblVal = container.getElementsByTagName("label")[0]).innerHTML = "{" + curConnections[i].to.el.id + "." + curConnections[i].to.at + "}";
                    lblVal.setAttribute("el", curConnections[i].from.el.id);
                    lblVal.setAttribute("at", curConnections[i].from.at);
                    /* @todo add interaction to value (make editable)
                    aDiv.getElementsByTagName("input")[0].id = id + "_" + i;
                    aDiv.getElementsByTagName("input")[0].value = "{" + curConnections[i].to.el.id + "." + curConnections[i].to.at + "}";
                    aDiv.getElementsByTagName("input")[0].onmousedown = function(e) {
                        (e || event).cancelBubble = true;
                    }
                    aDiv.getElementsByTagName("input")[0].onmouseup = function(e) {
                        (e || event).cancelBubble = true;
                    }
                    */
                    
                    // saveBtn
                    /*
                    aDiv.getElementsByTagName("div")[1].setAttribute("onmousedown", curConnections[i].from.el.id + ".setAttribute('" + curConnections[i].from.at + "', document.getElementById('" + id + "_" + i + "').value); event.cancelBubble = true;");
                    aDiv.getElementsByTagName("div")[1].setAttribute("onmouseup", "event.cancelBubble = true;");
                    */
                    
                    // delBtn
                    (delBtn = aDiv.getElementsByTagName("div")[1]).setAttribute("el", curConnections[i].from.el.id);
                    delBtn.setAttribute("at", curConnections[i].from.at);
                    ddAtts.onmousedown = function(e) {
                        (e||event).cancelBubble = true;
                    }
                    ddAtts.onmouseup  = function(e) {
                        var e = e || event;
                        if (!this.getAttribute("el")) return;;
                        var fromEl = apf.document.getElementById(this.getAttribute("el"));
                        if (!fromEl) return;
                        for (var name, attList = [], ai = 0, al = fromEl.attributes.length; ai < al; ai++) {
                            if (ignoreFromAtts.indexOf((name = fromEl.attributes[ai].name)) > -1) continue;
                            attList.push(new apf.item({
                                caption: name
                            }));
                        }

                        attMenu = new apf.menu({
                          htmlNode   : div,
                          id         : "attMenu",
                          childNodes : attList
                        });
                        
                        var pos = apf.getAbsolutePosition(this);

                        var x = pos[0], y = pos[1] + this.offsetHeight;
                        setTimeout(function(){
                            attMenu.display(x, y);
                            attMenu.$ext.style.zIndex = 100000002;
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
                            this.innerHTML = e.value;
                            attMenu.setProperty("visible", false);
                            showConnections();
                            //fromEl.setAttribute(e.value, inputVal.value);
                            (e||event).cancelBubble = true;
                        });                        
                        
                        (e||event).cancelBubble = true;
                    }
                    lblVal.onmousedown = function(e) {
                        (e||event).cancelBubble = true;
                    }
                    lblVal.onmouseover = function(e) {
                        var lblVal = this;
                        var inputVal = document.createElement("input");
                        inputVal.setAttribute("type", "text");
                        inputVal.setAttribute("class", "section5");
                        inputVal.setAttribute("value", lblVal.innerHTML);
                        inputVal.onkeydown = inputVal.onkeypress = inputVal.onmousedown = inputVal.onmouseup = function(e) {
                            (e||event).cancelBubble = true;
                        }
                        inputVal.onblur = function() {
                            this.onkeydown = this.onkeypress = this.onkeyup = null;
                            lblVal.setAttribute("value", this.value);
                            apf.document.getElementById(lblVal.getAttribute("el")).setAttribute(lblVal.getAttribute("at"), this.value);
                            this.replaceNode(lblVal, this);
                            
                            (e||event).cancelBubble = true;
                        }
                        inputVal.onkeyup = function(e) {
                            if ((e||event).keyCode == 13) {
                                lblVal.setAttribute("value", "x"+this.value);
                                apf.document.getElementById(lblVal.getAttribute("el")).setAttribute(lblVal.getAttribute("at"), this.value);
                                //this.replaceNode(lblVal, this);
                            }
                            (e||event).cancelBubble = true;
                        }
                        lblVal.replaceNode(inputVal, lblVal);
                        
                        (e||event).cancelBubble = true;
                    }
                    delBtn.onmousedown = function(e) {
                        (e||event).cancelBubble = true;
                    }
                    delBtn.onmouseup = function(e) {
                        apf.document.getElementById(this.getAttribute("el")).setAttribute(this.getAttribute("at"), '');
                        if (createConnections(selection))
                            showConnections();
                        else {
                            paintGroup.style({v:0});
                            paintGroup.repaint();
                            div.style.display = "none";
                        }
                        (e||event).cancelBubble = true;
                    }
                    
                    // delBtn
                    //aDiv.getElementsByTagName("div")[2].setAttribute("onmousedown", curConnections[i].from.el.id + ".setAttribute('" + curConnections[i].from.at + "', ''); event.cancelBubble = true;");
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