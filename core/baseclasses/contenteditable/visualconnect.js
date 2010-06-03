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
    text-align    : right;\
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
    width        : 15px;\
    background   : url("images/delete.png") no-repeat 0 0;\
    height       : 15px;\
    margin       : 7px 0 0 7px;\
}\
\
.atchart_box .red_button:hover {\
    background-position:0 -15px;\
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
    display: block;\
}\
\
.atchart_box span.section2 {\
    color:#3799ea;\
    padding-right:12px;\
    padding-left:2px;\
    background : url("images/arrow_down.png") no-repeat right 7px;\
    display:block;\
}\
\
.atchart_box span.section2 A {\
    color:#1e7ecd;\
    text-decoration:none;\
}\
\
.atchart_box span.section2:hover {\
    cursor: pointer;\
}\
.atchart_box span.section2:hover A {\
    color:#3799ea;\
    border-bottom:1px dotted #3799ea;\
}\
\
.active span.section2 {\
    background-color:#fcfcfc;\
}\
\
.active span.section2 A {\
    color:#1e7ecd;\
    border-bottom:1px dotted #3799ea;\
}\
\
.atchart_box span.section2:hover,\
.atchart_box label.section5:hover,\
.atchart_box input.section5:hover {\
    background-color:#fcfcfc;\
}\
\
.atchart_box span.section3 {\
    margin:0 2px;\
    display:block;\
}\
\
.atchart_box span.section4 {\
    color:#aaaaaa;\
    display:block;\
}\
\
.atchart_box span.section5 {\
    display:block;\
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
                    if (selection.length) {
                        createConnections(selection);
                        showConnections();
                    }
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
/*
                if (selection.length) {
                    if (createConnections(selection)) {
                        paintGroup.style({v:0});
                        paintGroup.repaint();

                        showConnections();
                    }
                }
*/
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
            //if (!isDrawing)
                //apf.dragMode = false; //prevents selection
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

            var conn = {
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
            }
            
            var fromId, toId
            if (!connections) connections = {};
            if (!connections[(fromId=el1.id)]) {
                // create new connection
                if (!connections[(toId = el2.id)]) {
                    connections[fromId] = {};
                    connections[fromId][toId] = [conn]
                }
                // add connection to element duo
                else {
                    if (!connections[(toId = el2.id)][fromId]) {
                        connections[toId][fromId] = [conn];
                    }
                    // check for duplicates
                    else {
                        for (var dupFound = false, c, i = 0, l = connections[toId][fromId].length; i < l; i++) {
                            if (
                                ((c=connections[toId][fromId][i]).from.el.id == conn.from.el.id) && 
                                (c.from.at == conn.from.at) &&
                                (c.to.el.id == conn.to.el.id) &&
                                (c.to.at == conn.to.at)
                            ) {
                                dupFound = true;
                                break;
                            }
                        }
                        if (!dupFound)
                            connections[toId][fromId].push(conn);
                    }
                }
            }
            else {
                if (!connections[fromId][(toId = el2.id)]) {
                    if (connections[toId] && connections[toId][fromId]) {
                        for (var dupFound = false, c, i = 0, l = connections[toId][fromId].length; i < l; i++) {
                            if (
                                ((c=connections[toId][fromId][i]).from.el.id == conn.from.el.id) && 
                                (c.from.at == conn.from.at) &&
                                (c.to.el.id == conn.to.el.id) &&
                                (c.to.at == conn.to.at)
                            ) {
                                dupFound = true;
                                break;
                            }
                        }
                        if (!dupFound)
                            connections[toId][fromId].push(conn);
                    }
                    else {
                        connections[fromId][toId] = [conn];
                    }
                }
                // check for duplicates
                else {
                    for (var dupFound = false, c, i = 0, l = connections[fromId][toId].length; i < l; i++) {
                        if (
                            ((c=connections[fromId][toId][i]).from.el.id == conn.from.el.id) && 
                            (c.from.at == conn.from.at) &&
                            (c.to.el.id == conn.to.el.id) &&
                            (c.to.at == conn.to.at)
                        ) {
                            dupFound = true;
                            break;
                        }
                    }
                    if (!dupFound)
                        connections[fromId][toId].push(conn);
                }
                
            }
            
/*
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
*/
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
            oDiv.innerHTML = '<div class="left"> </div><div class="red_button"> </div><div class="right"> </div><div class="lbl"><span class="section1">Button.</span><span class="section2"><a href="#">caption</a></span><span class="section3">=</span><span class="section4">&quot;</span><label class="section5">{button2.value}</label><span class="section4">&quot;</span></div>';
            
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
            
            //div.onmousedown = div.onmouseup = function(e) {
                //(e||event).cancelBubble = true;
            //}

            div.style.zIndex = 100000001;
            
            for (var id in connections) {
                for (var id2 in connections[id]) {
                    var curConnections = connections[id][id2];

                    for (var connDivs = [], maxBoxWidth = 0, maxLeftWidth = 0, aDiv, container, containerEls, lblFromEl, ddAtts, delBtn, centerPos, pos1, pos2, i = 0, l = curConnections.length; i < l; i++) {
                        // default positions for lines, start and end
                        pos1 = curConnections[i].from.pos;
                        pos2 = curConnections[i].to.pos;
                        // calculate center of line
                        centerPos = [Math.round((pos1[0]+pos2[0])/2), Math.round((pos1[1]+pos2[1])/2)];
                        
                        // value divs
                        aDiv = cTemplate.cloneNode(true);

                        container = aDiv.getElementsByTagName("div")[3];
                        (lblFromEl=(containerEls = container.getElementsByTagName("span"))[0]).innerHTML = (fromEl = curConnections[i].from.el).id + ".";
                        
                        (ddAtts = containerEls[1]).getElementsByTagName("a")[0].innerHTML = curConnections[i].from.at;
                        ddAtts.setAttribute("el", fromEl.id);
                        (lblVal = container.getElementsByTagName("label")[0]).innerHTML = "{" + curConnections[i].to.el.id + "." + curConnections[i].to.at + "}";
                        lblVal.setAttribute("el", curConnections[i].from.el.id);
                        lblVal.setAttribute("at", curConnections[i].from.at);
                                           
                        // delBtn
                        (delBtn = aDiv.getElementsByTagName("div")[1]).setAttribute("el", curConnections[i].from.el.id);
                        delBtn.setAttribute("at", curConnections[i].from.at);
                        ddAtts.onmousedown = function(e) {
                            (e||event).cancelBubble = true;
                        }
                        ddAtts.onmouseup  = function(e) {
                            var e = e || event;
                            var self = this;
                            
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

                            var x = pos[0]+this.offsetWidth, y = pos[1] + this.offsetHeight;
                            setTimeout(function(){
                                attMenu.display(x, y);
                                
                                //attMenu.display(x-attMenu.$ext.offsetWidth, y);
                                attMenu.$ext.style.left = x-attMenu.$ext.offsetWidth;
                                attMenu.$ext.style.zIndex = 100000002;
                               
                                // select attribute in menu
                                apf.popup.cache[apf.popup.last].content.onmousedown = function(e) {
                                    var oldAt = self.getElementsByTagName("a")[0].innerHTML;
                                    var newAt = attMenu.$selected.caption;
                                    
                                    if (oldAt == newAt) return;
                                    // set new attr
                                    self.getElementsByTagName("a")[0].innerHTML = newAt;
                                    attMenu.setProperty("visible", false);
                                    var val = (self.parentNode.getElementsByTagName("label").length) 
                                        ? self.parentNode.getElementsByTagName("label")[0].innerHTML
                                        : (self.parentNode.getElementsByTagName("input").length)
                                            ? self.parentNode.getElementsByTagName("input")[0].getAttribute("value")
                                            : null;

                                    apf.document.getElementById(self.getAttribute("el")).setAttribute(newAt, val);
                                    apf.document.getElementById(self.getAttribute("el")).setAttribute(oldAt, "");
                                    
                                    // redraw connections?
                                    if (createConnections(selection))
                                        showConnections();
                                    
                                    (e||event).cancelBubble = true;
                                    
                                    div.onmousedown = div.onmouseup = function(e) {
                                        this.onmousedown = this.onmouseup = null;
                                        (e || event).cancelBubble = true;
                                    }
                                    //document.onmouseup = null;
                                }
                                
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
                        
                        centerPos[0] = (centerPos[0] > 0) ? centerPos[0] : 0;
                        centerPos[1] = (centerPos[1] > 0) ? centerPos[1] : 0;

                        // move divs out of screen to get width
                        aDiv.style.top = "-9999px";
                        aDiv.style.left = "-9999px";
                        
                        div.appendChild(aDiv);
                        connDivs.push(aDiv);

                        // calculate width
                        /*
                        if (lblFromEl.offsetWidth > maxLeftWidth) maxLeftWidth = lblFromEl.offsetWidth;
                        if (ddAtts.offsetWidth > maxDdAttsWidth) maxDdAttsWidth = ddAtts.offsetWidth-10;
                        */
                        if (lblFromEl.offsetWidth+ddAtts.offsetWidth > maxLeftWidth) {
                            maxLeftWidth = lblFromEl.offsetWidth+ddAtts.offsetWidth;
                            //debugger;
                        }
                        if (lblFromEl.offsetWidth+ddAtts.offsetWidth+lblVal.offsetWidth > maxBoxWidth) {
                            maxBoxWidth = lblFromEl.offsetWidth+ddAtts.offsetWidth+lblVal.offsetWidth;
                        }
                        
                        aDiv.style.display = "none";
                        aDiv.style.top = centerPos[1] + "px";
                        aDiv.style.left = centerPos[0] + "px";
                        
                        
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
                    
                    // loop through the divs and align children properly 
                    for (var c, container, spans, cDiv, i = 0, l = connDivs.length; i < l; i++) {
                        // make div visible
                        (c=connDivs[i]).style.display = "block";
                        (spans=(container=(c=connDivs[i]).getElementsByTagName("div")[3]).getElementsByTagName("span"))[0].style.width = (maxLeftWidth - spans[1].offsetWidth) + "px";
                        c.style.width = maxBoxWidth + 68 + "px";
                    }
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
        if (div) div.style.display = "none";
        if (div) document.body.removeChild(div);
    };
};


function connectEdit(){

};

(function(){
    this.$getInput = function(){
        apf.Rename.initEditableArea.call(this);
        
        var txt = this.$txt;
        txt.host = this;
        return txt;
    };

    this.startEdit = function(el){
        htmlNode  = this.$value;
        var value = this.value;
        
        var txt = this.$getInput();

        htmlNode.innerHTML = "";
        htmlNode.appendChild(txt);
        
        if (apf.hasContentEditable) {
            txt.innerHTML = value.replace(/</g, "&lt;") 
                || apf.hasContentEditableContainerBug && "<br>" || "";
        }
        else 
            txt.value = value;
        
        txt.unselectable = "Off";

        //this.$txt.focus();
        var f = function(){
            try {
                txt.focus();
                txt.select();
            }
            catch(e) {}
        };
        if (apf.isIE) f() 
        else setTimeout(f);
            
        this.renaming = true;
    },
    
    this.stopRename =
    this.stopEdit   = function(x, success){
        if (!this.renaming)
            return;

        this.renaming = false;

        var htmlNode = this.$value;
        htmlNode.removeChild(this.$txt);
        
        var value = typeof success == "string"
          ? success
          : (apf.hasContentEditable
            ? this.$txt.innerText
            : this.$txt.value)
              .replace(/<.*?nobr>/gi, "").replace(/\n$/, ""); //last replace is for chrome;
        
        if (success && this.value != value) {
            this.setPropValue(value);
        }
        else {
            if (htmlNode.nodeType == 1)
                htmlNode.innerHTML = this.value;
            else
                htmlNode.nodeValue = this.value;
        }
        
        htmlNode.parentNode.scrollLeft = 0;
    }
    
    this.setPropName = function(name){
        this.name = name;
        
        //
    }
    
    this.setPropValue = function(value){
        this.value = value;
        
        //
    }
    
    this.draw = function(name, prop, value){
        
    }
})(connectEdit.prototype = new apf.Class());
//#endif