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
        
        apf.addEventListener("vcpropchange", function(e) {
            if (connections[e.obj.fromEl.id] && connections[e.obj.fromEl.id][e.obj.toEl.id])
                var el1 = e.obj.fromEl.id, el2 = e.obj.toEl.id;
            else
                var el1 = e.obj.toEl.id, el2 = e.obj.fromEl.id;
                
            for (var maxBoxWidth = 0, maxLeftWidth = 0, i = 0, l = connections[el1][el2].length; i < l; i++) {
                if ((c=connections[el1][el2][i].conn).getMaxLeftWidth() > maxLeftWidth)
                    maxLeftWidth = c.getMaxLeftWidth();
                if (c.getMaxBoxWidth() > maxBoxWidth)
                    maxBoxWidth = c.getMaxBoxWidth();
            }

            
            for (i = 0, l = connections[el1][el2].length; i < l; i++) {
                //(c=connections[el1][el2][i].conn).$lblFromEl.style.width = ((maxLeftWidth-4) - c.$lblAttMenu.offsetWidth) + "px";
                
                (c=connections[el1][el2][i].conn).$fromBox.style.width = maxLeftWidth + 20 + "px";
                //c.$lblFromEl.style.width = (maxLeftWidth - c.$lblAttMenu.offsetWidth) + "px";

                c.$ext.style.width = maxBoxWidth + 90 + "px";
            }
                
        });
        apf.addEventListener("vcdelete", function(e) {
            e.el.style.display = "none";
        });
        apf.addEventListener("vcmoveselection", function(e) {
            sel.$selectList(selection = [e.target]);
            createConnections(selection);
            showConnections();
        });
        
        apf.plane.show();
        
        div = document.body.appendChild(document.createElement("div"));
        div.style.display = "block";
        div.style.position = "absolute";
        div.style.left = "0px";
        div.style.top = "0px";
        div.style.zIndex = 100000001;
        
        //@todo use apf.window.zManager.set("drag", this.panel);
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
        
        function createConnections(elements) {
            connections = null;
            if (elements.length){
                // get all elements
                var all = [];
                for (var el, i = 0, l = apf.all.length; i < l; i++) {
                    if ((el=apf.all[i]).$ext && el.prefix == "a") all.push(apf.all[i])
                }

                // element as source element
                //@todo use .$funcHandlers hash table to find the connections .value = "{blah.value + bli.value}"
                for (var al, attrs, el, i = 0, l = elements.length; i < l; i++) {
                    for (var fromAt in (attrs=(el=elements[i]).$funcHandlers)) {
                        for (var at, targetList = [], ai = 0, al = attrs[fromAt].length; ai < al; ai++) {
                            targetList.push({
                                el  : (at=attrs[fromAt][ai]).amlNode,
                                at  : at.prop
                            });
                        }
                        createConnection(el, fromAt, targetList);
                    }
                    /*
                    for (var val, targetEl, targetAttr, split, j = 0, jl = elements[i].attributes.length; j < jl; j++) {
                        // @todo regex search of "{"
                        if ((val = elements[i].attributes[j].value).toString().charAt(0) == "{" && val.toString().charAt(val.length-1) == "}") {
                            // check if value is attribute of an element
                            if (targetEl = apf.document.getElementById((split=val.split("."))[0].substr(1))) {
                                targetAttr = split[1].substr(0, split[1].length-1);
                                createConnection(elements[i], targetEl, elements[i].attributes[j].name, targetAttr, val);
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
                                    createConnection(all[ei], targetEl, all[ei].attributes[ai].name, targetAttr, val);
                                }
                            }
                        }
                    }
                    */
                }
                //debugger;
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
                    attMenu.display(x, y, true);
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
                        attMenu.display(x, y, true);
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
        function createConnection(el1, at1, targetList) {
            if (!(el1.id && at1 && targetList.length)) return;
            
            var pos, x, y, w, h;
            
            // simple connection
            if (targetList.length == 1) {
                var el2 = targetList[0].el;
                var at2 = targetList[0].at;
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
                
                // check
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
                
                // set value
                var val;
                if (val = el2.getAttribute(at2)) {
                    conn.val = val;
                }
                else {
                    conn.val = "{"+el2.id+"."+at2+"}";
                    conn.readonly = true;
                }
                
                var fromId, toId
                if (!connections) connections = {};
                if (!connections[(fromId=el1.id)]) connections[fromId] = {};
                if (!connections[fromId][toId]) 
                    connections[fromId][toId] = [conn];
                else
                    connections[fromId][toId].push(conn);
            }
            // complex connection
            else {
                return;
            }
        }

        function drawConnections() {
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

                    for (var c, cType, connEdit, connDivs = [], maxBoxWidth = 0, maxLeftWidth = 0, centerPos, pos1, pos2, i = 0, l = curConnections.length; i < l; i++) {
                        // default positions for lines, start and end
                        pos1 = (c=curConnections[i]).from.pos;
                        pos2 = c.to.pos;
                        // calculate center of line
                        centerPos = [Math.round((pos1[0]+pos2[0])/2), Math.round((pos1[1]+pos2[1])/2)];
                        
                        // set type of connection: simple, complex or readonly
                        if (c.readonly) 
                            cType = "readonly";

                        connEdit = new connectEdit(div, c.from.el, c.to.el, c.from.at, c.to.at, c.val, cType);
                        div.appendChild(connEdit.$ext);
                        
                        
                        connections[id][id2][i].conn = connEdit;

                        if (connEdit.getMaxLeftWidth() > maxLeftWidth) {
                            maxLeftWidth = connEdit.getMaxLeftWidth();
                            //debugger;
                        }
                        if (connEdit.getMaxBoxWidth() > maxBoxWidth) {
                            maxBoxWidth = connEdit.getMaxBoxWidth();
                        }

                        connDivs.push(connEdit);

                        // even number of connections
                        var linePadding = 4;
                            centerPos = (l % 2 == 0) 
                                ? [centerPos[0] - (connEdit.$box.offsetWidth+10)/2, centerPos[1] - l/2*connEdit.$box.offsetHeight*i]
                                : centerPos = [centerPos[0] - (connEdit.$box.offsetWidth+10)/2, centerPos[1] - (l+1)/2*connEdit.$box.offsetHeight*(i+0.5)]
                        
                        centerPos[0] = (centerPos[0] > 0) ? centerPos[0] : 0;
                        centerPos[1] = (centerPos[1] > 0) ? centerPos[1] : 0;
                        
                        connEdit.$ext.style.display = "none";
                        connEdit.$ext.style.top = centerPos[1] + "px";
                        connEdit.$ext.style.left = centerPos[0] + "px";

                        // draw line
                        connectionPath.push(
                            //paintGroup.circlePath(pos1[0],pos1[1],1,1),
                            "M",pos1[0],pos1[1],"L",pos2[0],pos2[1],
                            paintGroup.circlePath(pos2[0],pos2[1],1,1)
                        );
                    }
                    
                    // loop through the divs and align children properly 
                    for (var c, container, spans, cDiv, i = 0, l = connDivs.length; i < l; i++) {
                        // make div visible
                        (c=connDivs[i]).$ext.style.display = "block";
                        c.$fromBox.style.width = maxLeftWidth + 20 + "px";
                        //c.$lblFromEl.style.width = (maxLeftWidth - c.$lblAttMenu.offsetWidth) + "px";
                        c.$ext.style.width = maxBoxWidth + 90 + "px";
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


function connectEdit(container, fromEl, toEl, fromAt, toAt, val, type){
    this.container  = container;
    this.fromEl     = fromEl;
    this.toEl       = toEl;
    this.fromAt     = fromAt;
    this.toAt       = toAt;
    this.value      = val;
    
    this.type       = type || "simple";
    
    this.draw();
};

(function(){
    this.ignoreFromAtts = ["id"];    // attributes for from element to ignore in attMenu
    this.ignoreToAtts = ["for"];    // attributes for to elements to ignore in attMenu

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
        this.fromAt = name;
        this.$lblAttMenu.innerHTML = this.fromAt;
    }
    
    this.setPropValue = function(value){
        this.value = value;
        this.$lblVal.innerHTML = this.value;
    }
    
    this.draw = function(name, prop, value){
        var _self = this;
        
        this.$ext = document.createElement("div");
        this.$ext.setAttribute("class", "atchart_box");
        this.$ext.setAttribute("style", "width:285px;color:#000000;font-family:Tahoma;font-size:12px;height:29px;min-width:30px;min-height:29px;max-height:29px;overflow:hidden;cursor:default;position:absolute;");
        
        this.$ext.innerHTML = '<div class="left"> </div><div class="red_button"> </div><div class="right"> </div><div class="lbl"><div><span class="section1">Button.</span><span class="section2"><a href="#">caption</a></span></div><span class="section3">=</span><span class="section4">&quot;</span><label class="section5">{button2.value}</label><span class="section4">&quot;</span></div>';
        this.$ext.onmousedown = this.$ext.onmouseup = function(e) {
            (e||event).cancelBubble = true;
        }
        
        var divs, spans;
        // delBtn
        this.$delBtn        = (divs=this.$ext.getElementsByTagName("div"))[1];
        if (this.type == "readonly") this.$delBtn.style.display = "none";
        
        
        this.$box           = divs[3];
        this.$fromBox       = this.$box.getElementsByTagName("div")[0]
        this.$lblFromEl     = (spans=this.$fromBox.getElementsByTagName("span"))[0];
        this.$lblFromEl.innerHTML = this.fromEl.id + ".";

        this.$attMenu       = spans[1];
        this.$lblAttMenu    = this.$attMenu.firstChild;
        this.setPropName(this.fromAt);
        
        if (this.type != "readonly") {
            this.$delBtn.onmousedown = function(e) {
                (e||event).cancelBubble = true;
            }
            this.$delBtn.onmouseup = function(e) {
                _self.fromEl.setAttribute(_self.fromAt, '');
                apf.dispatchEvent("vcdelete", {el:_self.$ext});
                
                (e||event).cancelBubble = true;
            }

            this.$attMenu.onmousedown = function(e) {
                (e||event).cancelBubble = true;
            }
            this.$attMenu.onmouseup  = function(e) {
                var e = e || event;
                //debugger;
                for (var name, attList = [], ai = 0, al = _self.fromEl.attributes.length; ai < al; ai++) {
                    if (_self.ignoreFromAtts.indexOf((name = _self.fromEl.attributes[ai].name)) > -1) continue;
                    attList.push(new apf.item({
                        caption: name
                    }));
                }

                attMenu = new apf.menu({
                  htmlNode   : _self.$ext,
                  id         : "attMenu",
                  childNodes : attList
                });
                
                var pos = apf.getAbsolutePosition(this);

                var x = pos[0], y = pos[1] + this.offsetHeight;
                setTimeout(function(){
                    attMenu.display(x, y, true);
                    
                    //attMenu.display(x-attMenu.$ext.offsetWidth, y);
                    attMenu.$ext.style.left = x;
                    attMenu.$ext.style.zIndex = 100000002;
                   
                    // select attribute in menu
                    apf.popup.cache[apf.popup.last].content.onmousedown = function(e) {
                        var newAt = attMenu.$selected.caption;
                        
                        if (_self.fromAt == newAt) return;
                        // set new attr
                        attMenu.setProperty("visible", false);

                        _self.fromEl.setAttribute(_self.fromAt, "");
                        _self.setPropName(newAt);
                        _self.fromEl.setAttribute(newAt, _self.value);
                        
                        
                        (e||event).cancelBubble = true;
                        
                        _self.container.onmousedown = _self.container.onmouseup = function(e) {
                            _self.container.onmousedown = _self.container.onmouseup = null;
                            apf.dispatchEvent("vcpropchange", {obj:_self});
                            (e || event).cancelBubble = true;
                        }
                        //document.onmouseup = null;
                    }
                    
                });

                (e||event).cancelBubble = true;
            }
        }
        
        this.$lblVal        = this.$box.getElementsByTagName("label")[0];
        this.setPropValue(this.value);
        
        if (this.type != "readonly")
            this.$inputVal      = this.createInput();
        
        if (this.type == "readonly") {
            this.$ext.onmousedown = function(e) {
                apf.dispatchEvent("vcmoveselection", {target: _self.toEl});
                (e||event).cancelBubble = true;
            }
            this.$ext.onmouseup = function(e) {
                (e||event).cancelBubble = true;
            }

        }
    }
    
    this.createInput = function() {
        var inputVal = document.createElement("input");
        inputVal.setAttribute("type", "text");
        inputVal.setAttribute("class", "section5");
        inputVal.setAttribute("value", this.$lblVal.innerHTML);
        inputVal.style.width = (this.$lblVal.offsetWidth-2 > 0 ? this.$lblVal.offsetWidth-2 : 0) + "px";
        inputVal.onkeydown = inputVal.onkeypress = inputVal.onmousedown = inputVal.onmouseup = function(e) {
            (e||event).cancelBubble = true;
        }
        inputVal.onblur = function() {
            this.hasFocus = false;
            this.onkeydown = this.onkeypress = this.onkeyup = null;
            _self.$lblVal.setAttribute("value", this.value);
            _self.$lblVal.getAttribute("el").setAttribute(lblVal.getAttribute("at"), this.value);

            if (createConnections(selection))
                showConnections();
            
            (e||event).cancelBubble = true;
        }
        inputVal.onkeyup = function(e) {
            if ((e||event).keyCode == 13) {
                _self.$lblVal.setAttribute("value", "x"+this.value);
                _self.$lblVal.getAttribute("el").setAttribute(lblVal.getAttribute("at"), this.value);
                //debugger;
                if (createConnections(selection))
                    showConnections();
            }
            (e||event).cancelBubble = true;
        }
        inputVal.onfocus = function(e) {
            this.hasFocus = true;
        }
        inputVal.onmouseout = function(e) {
            if (this.hasFocus) return;
            $this.inputVal.replaceNode(lblVal, inputVal);
        }
        
        return inputVal;
    }
    
    this.getMaxLeftWidth = function() {
        return this.$lblFromEl.offsetWidth + this.$lblAttMenu.offsetWidth;
    }
    this.getMaxBoxWidth = function() {
        return this.$lblFromEl.offsetWidth + this.$lblAttMenu.offsetWidth + this.$lblVal.offsetWidth;
    }
    
}).call(connectEdit.prototype = new apf.Class());
//#endif
