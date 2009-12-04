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

// #ifdef __AMLVECTORFLOW 
// || __INC_ALL

/**
 * 
 * 
 * @constructor
 * @define vectorflow
 * @addnode elements
 *
 * @author      Linh Nguyen (linh AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.MultiSelect
 * @inherits apf.DataAction
 */
apf.vectorflow = function(struct, tagName){
    this.$init(tagName || "vectorflow", apf.NODE_VISIBLE, struct);
    
    this.nodes = [];
};

(function(){
    //#ifdef __WITH_DATAACTION
    this.implement(apf.DataAction);
    //#endif
    
    //Options
    this.$focussable   = true; // This object can get the focus.
    this.bufferselect  = true;
    
    /**** Properties and Attributes ****/
    this.$nodeIdIndex = 1;
    this.$minLineLength = 30;
    
    /**** Public Methods ****/
    

    /**** Databinding Support ****/

    //Here each xml node from the data is rendered
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        var node = {
            id              : this.$applyBindRule("id", xmlNode) || "n" + this.$nodeIdIndex++,
            caption         : this.$applyBindRule("caption", xmlNode) || "",
            type            : this.$applyBindRule("type", xmlNode) || "rect",
            x               : parseInt(this.$applyBindRule("left", xmlNode)) || 0,
            y               : parseInt(this.$applyBindRule("top", xmlNode)) || 0,
            top             : parseInt(this.$applyBindRule("top", xmlNode)) || 0,
            left            : parseInt(this.$applyBindRule("left", xmlNode)) || 0,
            width           : parseInt(this.$applyBindRule("width", xmlNode)) || 0,
            height          : parseInt(this.$applyBindRule("height", xmlNode)) || 0,
            fill            : xmlNode.getAttribute("fill"),
            selected        : false
        };

        // loop through connections
        var connections = xmlNode.getElementsByTagName("connection");
        if (connections.length) {
            if (!this.nodes.line) this.nodes.line = [];
            node.connections = [];

            for (var connection, i = 0, l = connections.length; i < l; i++) {
                connection = {
                    ref     : connections[i].getAttribute("ref"),
                    input   : connections[i].getAttribute("input"),
                    output  : connections[i].getAttribute("output"),
                    type    : 'line',
                    from    : node,
                    to      : this.nodes[connections[i].getAttribute("ref")] ? this.nodes[connections[i].getAttribute("ref")] : connections[i].getAttribute("ref"),
                    top     : 0,
                    left    : 0,
                    width   : 100,
                    height  : 100
                };
                
                this.nodes.line.push(connection);
                //node.connections.push(connection);
            }
        }
        
        // check if node is used as reference in other node
        if (this.nodes.line && this.nodes.line.length) {
            for (var i = 0, l = this.nodes.line.length; i < l; i++) {
                if (this.nodes.line[i].to == node.id) {
                    this.nodes.line[i].to = node;
                }
                else if (this.nodes.line[i].from == node.id) {
                    this.nodes.line[i].from = node;
                }
            }
        }
        
        if ("circle".indexOf(node.type) > -1) {
            node.width /= 2;
            node.height /= 2;
        }

        node = this.$setPositions(node);
        
        if (this.nodes[node.id]) {
            apf.console.error("block with id " + node.id + " already exists");
            return;
        }
        this.nodes[node.id] = node;
        
        if (!this.nodes[node.type]) this.nodes[node.type] = [];
        this.nodes[node.type].push(node);
    };
    
    this.$setPositions = function(node) {
        // set default line attach positions
        
        node.connectors = {
            top:    {x: node.x, y: node.y - node.height/2, minLengthX: node.x, minLengthY: node.y - node.height/2 - this.$minLineLength},
            left:   {x: node.x - node.width/2, y: node.y, minLengthX: node.x - node.width/2 - this.$minLineLength, minLengthY: node.y},
            right:  {x: node.x + node.width/2, y: node.y, minLengthX: node.x + node.width/2 + this.$minLineLength, minLengthY: node.y},
            bottom: {x: node.x, y: node.y + node.height/2, minLengthX: node.x, minLengthY: node.y + node.height/2 + this.$minLineLength},
        }

        if ("rect|decision".indexOf(node.type) > -1) {
            node.top    = node.y - node.height/2;
            node.left   = node.x - node.width/2;
            node.bottom = node.y + node.height/2;
            node.right  = node.x + node.width/2;
        }
        else if ("circle".indexOf(node.type) > -1) {
            node.top    = node.y - node.height;
            node.left   = node.x - node.width;
            node.bottom = node.y + node.height;
            node.right  = node.x + node.width;
        }
        
        return node;
    }
    
    this.$drawLayers = function() {
        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers["root"], this);
        this.$drawCode = this.$compile( this.$rootLayers["root"], $style, "root");
        this.$drawCode(this.$rootLayers["root"], this);
        apf.draw.resizeLayer(this.$rootLayers["root"]);

        for (var type in this.nodes) {
            if (this.$rootLayers[type]) {
                var err = {};
                var $style = apf.draw.parseStyle(this.$node_style , "", err );
                apf.draw.initLayer(this.$rootLayers[type], this);
                this.$drawCode = this.$compile( this.$rootLayers[type], $style, type);
                this.$drawCode(this.$rootLayers[type], this);
                apf.draw.resizeLayer(this.$rootLayers[type]);
            }
        }
        
        /*
         * start compile text
         * todo after Rik fixed this
         */
        /*
        type = "text";
        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers[type], this);
        this.$drawCode = this.$compileText( this.$rootLayers[type], $style, type);
        this.$drawCode(this.$rootLayers[type], this);
        apf.draw.resizeLayer(this.$rootLayers[type]);
        */
        /*
         * end compile text
         */
    }

/*
    this.$compileText = function(l,s,t){
        var e = apf.draw;

        var c = e.optimize([
            e.beginLayer(l),
            e.vars(),
            e.clear(),
            e.beginShape(s[t]),
            e.beginFont(s[t], "t", 0, 0, 0, 0),
            e.text(0, 0, "t"),
            e.endLayer()
        ].join(''));

        try{
            return new Function('l','v','m',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    }
*/    
    //This function is called to do the final render pass
    this.$fill = function(){
        this.$drawLayers();
    };

    this.$compile = function(l,s,t){
        var e = apf.draw;

        // draw root layer
        if (t === "root") {
            var c = e.optimize([
                e.beginLayer(l),
                e.vars(),
                e.clear(),
                e.beginShape(s[t]),
                e.rect(0, 0, l.width, l.height),
                e.endLayer()
            ].join(''));
        } else {
            // draw shape layer
            var c = e.optimize([
                e.beginLayer(l),
                e.vars(),
                e.beginShape(s[t]),
                "for (var node, type, i = 0, l = this.nodes['",t,"'].length; i < l; i++) {",
                    "node=this.nodes['",t,"'][i];",
                    "type=node.type;",

                    "if (type === 'selection') {", 
                        e.rect(
                            "node.left",
                            "node.top",
                            "node.width",
                            "node.height"
                        ),
                    "}",
                    "else if (type === 'rect') {", 
                        e.rect(
                            "node.left",
                            "node.top",
                            "node.width",
                            "node.height"
                        ),
                    "}",
                    "else if (type === 'decision') {", 
                        e.moveTo("node.connectors.top.x", "node.connectors.top.y"),
                        e.lineTo("node.connectors.right.x", "node.connectors.right.y"),
                        e.lineTo("node.connectors.bottom.x", "node.connectors.bottom.y"),
                        e.lineTo("node.connectors.left.x", "node.connectors.left.y"),
                        e.lineTo("node.connectors.top.x", "node.connectors.top.y"),
                    "}",
                    "else if (type === 'circle') {", e.ellipse("node.x","node.y","node.width","node.height"), "}",
                    "else if (type === 'line') {",
                        "var from, to, prop, nodeLines = [], xPos;",
                        
                        "from = node.from.connectors[node.output];",
                        "to = node.to.connectors[node.input];",
                        
                        "if (node.output == 'right' && node.input == 'left' || node.output == 'right' && node.input == 'left') {",
                            "if (node.output == 'right') {",
                                "from = node.from.connectors[node.output];",
                                "to = node.to.connectors[node.input];",
                            "}",
                            "else if (node.output == 'left') {",
                                "to = node.from.connectors[node.output];",
                                "from = node.to.connectors[node.input];",
                            "}",

                            "if (from.x < to.x - this.$minLineLength*2) {",
                                "nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: from.minLengthY});",
                                "nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: to.minLengthY});",
                            "}",
                            "else {",
                                "nodeLines.push({x: from.minLengthX, y: (from.minLengthY + to.minLengthY)/2});",
                                "nodeLines.push({x: to.minLengthX, y: (from.minLengthY + to.minLengthY)/2});",
                            "}",
                        "}",
                        "if (node.output == 'bottom' && node.input == 'top' || node.output == 'top' && node.input == 'bottom') {",
                            "if (node.output == 'bottom') {",
                                "from = node.from.connectors[node.output];",
                                "to = node.to.connectors[node.input];",
                            "}",
                            "else if (node.output == 'top') {",
                                "to = node.from.connectors[node.output];",
                                "from = node.to.connectors[node.input];",
                            "}",
                            
                            "if (from.y < to.y - this.$minLineLength*2) {",
                                "nodeLines.push({x: from.minLengthX, y: (from.minLengthY + to.minLengthY)/2});",
                                "nodeLines.push({x: to.minLengthX, y: (from.minLengthY + to.minLengthY)/2});",
                            "}",
                            "else {",
                                "nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: from.minLengthY});",
                                "nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: to.minLengthY});",
                            "}",
                        "}",
                        
                        
                        e.moveTo(
                            "from.x",
                            "from.y"
                        ),
                        e.lineTo(
                            "from.minLengthX",
                            "from.minLengthY"
                        ),

                        "for (var n = 0, nl = nodeLines.length; n < nl; n++) {",
                            e.lineTo(
                                "nodeLines[n].x",
                                "nodeLines[n].y"
                            ),
                            e.moveTo(
                                "nodeLines[n].x",
                                "nodeLines[n].y"
                            ),
                        "}",
                        e.lineTo(
                            "to.minLengthX",
                            "to.minLengthY"
                        ),
                        e.moveTo(
                            "to.minLengthX",
                            "to.minLengthY"
                        ),
                        e.lineTo(
                            "to.x",
                            "to.y"
                        ),
                        e.moveTo(
                            "to.x",
                            "to.y"
                        ),
                        
                    "}",
                    e.close(),
                "}",
                e.endLayer()
            ].join(''));
            
        }
        try{
            return new Function('l','v','m',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    }
    
    //This is called to unrender a node
    this.$deInitNode = function(xmlNode, htmlNode){
        
    };
    
    //This is called to move a node within this element (position)
    this.$moveNode = function(xmlNode, htmlNode){
        
    };
    
    //This is called to update the representation of a node (position, caption, connections, etc)
    this.$updateNode = function(xmlNode, htmlNode){
        //This is how to apply a bindrule on a data node
        //this.$applyBindRule("caption", xmlNode)
        
    };
    
    this.$deleteNode = function() {
        delete this.nodes[this.$selectedNode.id];
        for (var i = 0, l = this.nodes[this.$selectedNode.type].length; i < l; i++) {
            if (this.nodes[this.$selectedNode.type][i] == this.$selectedNode) {
                this.nodes[this.$selectedNode.type].splice(i, 1);
                break;
            }
        }

        for (var i = 0, l = this.nodes.line.length; i < l; i++) {
            if (this.nodes.line[i].to == this.$selectedNode || this.nodes.line[i].from == this.$selectedNode) {
                this.nodes.line.splice(i, 1);
            }
        }

        this.$selectedNode = null;
        this.nodes["selection"] = [];
        
        this.$drawLayers();
    }
    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;
            value = (ctrlKey ? 10 : (shiftKey ? 20 : 1));

        if (!this.$selectedNode)
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$ext;

        switch (key) {
            case 27: //ESC
                this.$selectedNode = null;
                this.nodes["selection"] = [];
                this.$drawLayers();
                break;
            case 46: //DEL
                this.$deleteNode();
                break;
            case 37:
                //LEFT
                this.$selectedNode.x -= value;
                this.$setPositions(this.$selectedNode);
                this.$setSelection(this.$selectedNode, true);
                this.$drawLayers();
                break;
            case 39:
                //RIGHT
                this.$selectedNode.x += value;
                this.$setPositions(this.$selectedNode);
                this.$setSelection(this.$selectedNode, true);
                this.$drawLayers();
                break;
            case 38:
                //UP
                this.$selectedNode.y -= value;
                this.$setPositions(this.$selectedNode);
                this.$setSelection(this.$selectedNode, true);
                this.$drawLayers();
                break;
            case 40:
                //DOWN
                this.$selectedNode.y += value;
                this.$setPositions(this.$selectedNode);
                this.$setSelection(this.$selectedNode, true);
                this.$drawLayers();
                break;
            default:
                break;
        }
    }, true);
    // #endif
    
    /**** Selection Support ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r     = [],
            nodes = this.hasFeature(apf.__VIRTUALVIEWPORT__)
                ? this.xmlRoot.selectNodes(this.each)
                : this.getTraverseNodes(),
            f, i;
        for(f = false, i = 0; i < nodes.length; i++) {
            if (nodes[i] == xmlStartNode)
                f = true;
            if (f)
                r.push(nodes[i]);
            if (nodes[i] == xmlEndNode)
                f = false;
        }
        
        if (!r.length || f) {
            r = [];
            for (f = false, i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i] == xmlStartNode)
                    f = true;
                if (f)
                    r.push(nodes[i]);
                if (nodes[i] == xmlEndNode)
                    f = false;
            }
        }
        
        return r;
    };
   
    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode), null, null, null, true)) {
            return true;
        }
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for (var i = 0; i < nodes.length; i++) {
                if (this.$selectDefault(nodes[i]))
                    return true;
            }
        }
    };
    
    //@todo make it consistent to have second argument be an xml node.
    //Visually show selection
    this.$select = function(o, xmlNode){
        
    };

    //Visually show deselection
    this.$deselect = function(o, xmlNode){
        
    };

    //Visually show caret
    this.$indicate = function(o, xmlNode){
        
    };

    //Visually show unsetting the caret
    this.$deindicate = function(o, xmlNode){
        
    };
    
    /**** Init ****/
    this.$node_style = {
        root : {
            inherit:'shape',
            stroke:'blue',
            fill:'white',
        $:1},
        circle : {
            inherit:'shape',
            stroke:'black',
            fill:'red',
        $:1},
        rect : {
            inherit:'shape',
            stroke:'black',
            fill:'blue',
            opacity:.5,
        $:1},
        selection : {
            inherit:'shape',
            stroke:'green',
            fill:'null',
        $:1},
        decision : {
            inherit:'shape',
            stroke:'black',
            fill:'yellow',
        $:1},
        line : {
            inherit:'shape',
            stroke:'black',
            fill: 'white',
        $:1},
        label : {
            inherit : 'font',
            join : 'label',
            width: 40,
            height: 40,
            left: -20,
            top: "fontz(-5,200)",
            size: "fontz(10,200)",
            scale: 0.2,
            stroke: null,
            angle : 'ang(180)',
            format : "fixed(v,1)",
        $:0},
        text : {
            inherit : 'label', 
            angle:'ang(90+f1*90)',
            align:'center',
        $:1},
    };
    this.$rootLayers = {
        root: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        circle: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        rect: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        decision: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        line: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        text: {
            left: 0,
            top: 0,
            width: 800,
            height: 800,
        },
        selection: {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        }
    };
            
    this.addEventListener("$clear", function(){
        return false;
    })
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal(); 
        this.$int = this.$getLayoutNode("main", "container", this.$ext);

        this.top = 0, this.left = 0,
        this.width = 800, this.height = 800;
        //Any initialization code comes here
        apf.draw.initDriver();
        apf.draw.initRoot(this);
        apf.draw.resizeRoot(this);
        
        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers["root"], this);
        this.$drawCode = this.$compile( this.$rootLayers["root"], $style, "root");
        this.$drawCode(this.$rootLayers["root"], this);
        apf.draw.resizeLayer(this.$rootLayers["root"]);

        var self = this;
        this.nodes["selection"] = [];
        
        // add click listener
        
        this.$int.onmousedown = function(e){
            self.$mousedown = true;
            if (!e) e = event;
            var resize = false;
                
            if (typeof e.pageX == "undefined") {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }
            var mouseX = e.pageX, mouseY = e.pageY;

            
            var blockNodes = [];
            if (self.nodes["rect"]) blockNodes = blockNodes.concat(self.nodes["rect"]);
            if (self.nodes["decision"]) blockNodes = blockNodes.concat(self.nodes["decision"]);
            if (self.nodes["circle"]) blockNodes = blockNodes.concat(self.nodes["circle"]);
            if (self.nodes["line"]) blockNodes = blockNodes.concat(self.nodes["line"]);
            if (self.nodes["selection"]) blockNodes = blockNodes.concat(self.nodes["selection"]);
            
            var selectedNode = false;
            for (var node, i = 0, l = blockNodes.length; i < l; i++) {
                node = blockNodes[i];

                if ('rect|decision|circle|selection'.indexOf(node.type) > -1) {
                    if (mouseX > node.left && mouseX < node.right &&
                        mouseY > node.top && mouseY < node.bottom) {
                            if (node.type != "selection") {
                                self.$selectedNode = node;
                                node.selected = true;
    
                                // add node to selection layer
                                self.$setSelection(node, true);
                            
                            // resize handlers
                            } else {
                                self.$handlerNode = node;
                                resize = true;
                            }
                            selectedNode = true;
                    } else {
                        node.selected = false;
                    }
                }
            }

            if (!selectedNode) {
                self.$selectedNode = null;
                self.nodes["selection"] = [];
            }
                        
            if (self.$selectedNode) {
                var diffX = mouseX - self.$selectedNode.x;
                var diffY = mouseY - self.$selectedNode.y;
            }
            if (!self.$selectedNode) {
                self.nodes["selection"] = [];
            }
            
            self.$drawLayers();
            
            self.$int.onmousemove = function(e) {
                if (!e) e = event;
                
                if (typeof e.pageX == "undefined") {
                    e.pageX = e.clientX;
                    e.pageY = e.clientY;
                }
                var mouseX = e.pageX, mouseY = e.pageY;
                
                if (self.$mousedown && self.$selectedNode) {
                    if (resize) {
                        // resize width
                        if ('bottomright|topright'.indexOf(self.$handlerNode.id) > -1) {
                            self.$selectedNode.width = mouseX - self.$selectedNode.left - 20;
                            if (self.$selectedNode.width < 10)
                                self.$selectedNode.width = 10;
                            self.$selectedNode.right = self.$selectedNode.left + self.$selectedNode.width;
                        }
                        else if ('bottomleft|topleft'.indexOf(self.$handlerNode.id) > -1) {
                            self.$selectedNode.width = self.$selectedNode.right - self.$selectedNode.left + (self.$selectedNode.left - mouseX);
                            if (self.$selectedNode.width < 10)
                                self.$selectedNode.width = 10;
                            self.$selectedNode.left = mouseX;
                            self.$selectedNode.right = self.$selectedNode.left + self.$selectedNode.width;
                        }

                        // resize height
                        if ('bottomleft|bottomright'.indexOf(self.$handlerNode.id) > -1) {
                            self.$selectedNode.height = mouseY - self.$selectedNode.top - 20;
                            if (self.$selectedNode.height < 10)
                                self.$selectedNode.height = 10;
                            self.$selectedNode.bottom = self.$selectedNode.top + self.$selectedNode.height;
                        }
                        else if ('topleft|topright'.indexOf(self.$handlerNode.id) > -1) {
                            self.$selectedNode.height = self.$selectedNode.bottom - self.$selectedNode.top + (self.$selectedNode.top - mouseY);
                            if (self.$selectedNode.height < 10)
                                self.$selectedNode.height = 10;
                            self.$selectedNode.top = mouseY;
                            self.$selectedNode.bottom = self.$selectedNode.top + self.$selectedNode.height;
                        }
                        
                        self.$setPositions(self.$selectedNode);
                        
                        // redraw selection box based on new size
                        self.nodes["selection"] = [];
                        self.$setSelection(self.$selectedNode, true);
                    } 
                    else {
                        // set new node position
                        self.$selectedNode.x = mouseX - diffX;
                        self.$selectedNode.y = mouseY - diffY;
                        self.$setPositions(self.$selectedNode);
                        
                        // reset current selection
                        self.nodes["selection"] = [];
                        
                        // set new selection
                        self.$setSelection(self.$selectedNode, true);
                    }
                    
                    // refresh canvas
                    self.$drawLayers();
                }
            }
        }
        
        this.$int.onmouseup = function(e) {
            self.$mousedown = false;
            if (self.$selectedNode) {
                //self.$setPositions(self.$selectedNode);
                self.$drawLayers();
            }
        }
    };
    
    this.$setSelection = function(node, resize) {
        this.nodes["selection"] = [];
        var margin = 5;
        if ('decision|rect'.indexOf(node.type) > -1) {
            box = {
                type: "selection",
                left: node.left-margin,
                top: node.top-margin,
                width: node.width+margin*2,
                height: node.height+margin*2
            }
        }
        else {
            box = {
                type: "selection",
                left: node.left-margin,
                top: node.top-margin,
                width: node.width*2+margin*2,
                height: node.height*2+margin*2
            }
        }

        this.nodes["selection"].push(box);
        
        if (resize) {
            var hWidth = 20, hHeight = 20;
            var top = node.top - hHeight;
            var left = node.left - hWidth;
            var bottom = node.bottom;
            var right = node.right;
            
            var handlers = [
                {type: "selection", id: "topleft", width: hWidth, height: hHeight, top: top, left: left, right: left+hWidth, bottom: top+hHeight }, //topleft 
//                {type: "selection", id: "top", width: hWidth, height: hHeight, top: top, left: left + node.width/2 + hWidth/2, right: left + node.width/2 + hWidth/2 + hWidth, bottom: top+hHeight  }, //top
                {type: "selection", id: "topright", width: hWidth, height: hHeight, top: top, left: right, right: right+hWidth, bottom: top+hHeight }, //topright
//                {type: "selection", id: "right", width: hWidth, height: hHeight, top: top + node.height/2 + hWidth/2, left: right, right: right+hWidth, bottom: top + node.height/2 + hHeight}, //right
                {type: "selection", id: "bottomright", width: hWidth, height: hHeight, top: bottom, left: right, right: right+hWidth, bottom: bottom+hHeight }, //bottomright
//                {type: "selection", id: "bottom", width: hWidth, height: hHeight, top: top, left: left + hWidth/2 }, //bottom
                {type: "selection", id: "bottomleft", width: hWidth, height: hHeight, top: bottom, left: left, right: left+hWidth, bottom: bottom+hHeight }, //bottomleft
//                {type: "selection", id: "left", width: hWidth, height: hHeight, top: top + node.height/2, left: left }  //left
            ];
            
            for (var h = 0, l = handlers.length; h < l; h++) {
                this.nodes["selection"].push(handlers[h]);
            }
        }
        
    }
    
    this.$loadAml = function(){
        //Any init code that needs attributes set comes here
    }
    
    this.$destroy = function(){
        //Any deinitialization code comes here
    };
// #ifdef __WITH_MULTISELECT
}).call(apf.vectorflow.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.vectorflow.prototype = new apf.MultiselectBinding());
   #else
}).call(apf.vectorflow.prototype = new apf.Presentation());
#endif*/

apf.aml.setElement("vectorflow", apf.vectorflow);
// #endif
