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
    var r   = ctx.rect({
        sw: 1,
        s: "#24a3f4",
        f: "#24a3f4",
        o: 0.2
    });
    var p   = ctx.path({
        p: "",
        sw: 1.5,
        s: "#24a3f4"
    });
    
    this.activate = function(e){
        
        if (active) 
            return;
        active = true
        //document.getElementById("log").innerHTML += "activated<br>";
        
        apf.plane.show();
        var _self = this;
        
        var path = [], hNode, pos, selection = sel.$getNodeList(), lines = [];
        for (var i = 0, il = selection.length; i < il; i++) {
            hNode = selection[i].$ext;
            pos = apf.getAbsolutePosition(hNode);

            path.push("M", Math.round(pos[0] + (hNode.offsetWidth/2)), Math.round(pos[1] + (hNode.offsetHeight/2)), "L", e.clientX, e.clientY);
        }
        
        var conns = [];
        //this.hideConnections();
        this.drawConnections(_self.getConnections(selection));
        
        p.style({p: path.join(" ")});
        ctx.repaint();
        div.style.display = "block";
      
//        apf.dragMode = true; //prevents selection

        var timer, lastTime
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
            
            apf.plane.hide();
            div.style.display = "none";
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                htmlNode = amlNode.$ext;
                var pos = apf.getAbsolutePosition(htmlNode);
                r.style({
                    x: pos[0], 
                    y: pos[1],
                    w: htmlNode.offsetWidth,
                    h: htmlNode.offsetHeight
                });
            }
            else {
                r.style({
                    w: 0, h: 0
                });
            }
            
            var path = [];
            for (var i = 0, il = selection.length; i < il; i++) {
                hNode = selection[i].$ext;
                pos = apf.getAbsolutePosition(hNode);
                path.push("M", Math.round(pos[0] + (hNode.offsetWidth/2)), Math.round(pos[1] + (hNode.offsetHeight/2)), "L", e.clientX, e.clientY);
            }
            p.style({p: path.join(" ")});

            /*for (var i = 0, il = lines.length; i < il; i++) {
                lines[i].style({
                    p: ["L",e.clientX,e.clientY].join(" ")
                });
            }*/
            
            apf.plane.show();
            div.style.display = "block";
            ctx.repaint();
        }

        document.onmousedown = function(e){
            if (!e) e = event;
            
            apf.plane.hide();
            apf.dragMode = false; //prevents selection
            
            div.style.display = "none";
            
            var htmlNode = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(htmlNode);
            if (amlNode && amlNode.editable && selection.indexOf(amlNode) == -1) {
                // create connection
                for (var connection, i = 0, il = selection.length; i < il; i++) {
                    connection = {
                        id       : connectionIdx,
                        elements : [selection[i], amlNode]
                    };
                    connectionIdx++;
                    
                    connections.push(connection)
                    _self.drawConnections([connection]);
                }
                
                /*
                var x = e.clientX;
                var y = e.clientY;
                
                setTimeout(function(){
                    mnuContentEditable.display(x, y);
                });
                */
            }
            
            _self.deactivate();
        };
    };

    this.deactivate = function(){
        //document.getElementById("log").innerHTML += "deactivated<br>";
        active = false;
        
        document.onmousedown = 
        document.onmousemove = null;
        
        apf.plane.hide();
        //debugger;
        p.style({p:""});
        r.style({w:0,h:0});
        ctx.repaint();
        div.style.display = "none";
    };
    
    this.drawConnections = function(conns) {
        for (var i = 0, il = connections.length; i < il; i++) {
            if (!conns.length) {
                if (connections[i].shape)
                    connections[i].shape.style({so: 0});
            }
            else {
                for (var found = false, ci = 0, cl = conns.length; ci < cl; ci++) {
                    if (connections[i].id == conns[ci].id) {
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    if (connections[i].shape)
                        connections[i].shape.style({so: 0});
                }
                else {
                    if (connections[i].shape)
                        connections[i].shape.style({so: 0});
                    else {
                        var hNode1 = (c = conns[ci]).elements[0].$ext;
                        var hNode2 = c.elements[1].$ext;
                        var pos1 = apf.getAbsolutePosition(hNode1);
                        var pos2 = apf.getAbsolutePosition(hNode2);
                        
                        // @todo draw connection line based on element positions
                        // @todo add check for multiple connection lines with same source/target
                        var path = [];
                        path.push("M", Math.round(pos1[0] + (hNode1.offsetWidth/2)), Math.round(pos1[1] + (hNode1.offsetHeight/2)), "L", Math.round(pos2[0] + (hNode2.offsetWidth/2)), Math.round(pos2[1] + (hNode2.offsetHeight/2)));
                        c.shape = ctx.path({
                            p   : path.join(" "),
                            sw  : 1.5,
                            s   : "red"
                        });
                    }
                }

            }
        }
        
        ctx.repaint();
    };
    
    this.hideConnections = function() {
        for (var i = 0, il = connections.length; i < il; i++) {
            connections[i].shape.style({so: 0});
        }
        //ctx.repaint();
    }
    
    this.getConnections = function(elements) {
        var results = [];
        for (var i = 0, il = elements.length; i < il; i++) {
            for (var c, ci = 0, cl = connections.length; ci < cl; ci++) {
                if ((c = connections[ci]).elements.indexOf(elements[i]) > -1)
                    results.push(c);
            }
        }

        return results;
    };
    
    this.enableLineMode = function() {
        lineMode = true;
    };
};
//#endif