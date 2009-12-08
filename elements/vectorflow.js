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
    this.$viewport = {
        width: 800,             // width for viewport and layers
        height: 800,            // height for viewport and layers
        offset: {x: 0, y: 0},    // offset of viewport
        mode: "move"
    };
    this.$grid = {
        cellW: 20,
        cellH: 20,
    }
    
    this.$calculateGrid = function() {
        this.nodes["grid"] = [];
        var width = this.$viewport.width + Math.abs(this.$viewport.offset.x);
        var height = this.$viewport.height + Math.abs(this.$viewport.offset.y);
        var numRows = height/this.$grid.cellH;
        var numCols = width/this.$grid.cellW;
        
        // horizontal lines
        for (var ri = 0, rl = numRows; ri < rl; ri++) {
            this.nodes["grid"].push({
                type: "grid",
                from: {x: 0, y: ri * this.$grid.cellH - Math.abs(this.$viewport.offset.y)}, 
                to: {x: width - this.$viewport.offset.x, y: ri * this.$grid.cellH - Math.abs(this.$viewport.offset.y)}
            })
        }
        
        // vertical lines
        for (var ci = 0, cl = numCols; ci < cl; ci++) {
            
            this.nodes["grid"].push({
                type: "grid",
                from: {x: ci * this.$grid.cellW - Math.abs(this.$viewport.offset.x), y: 0}, 
                to: {x: ci * this.$grid.cellW - Math.abs(this.$viewport.offset.x), y: height - this.$viewport.offset.y}
            })
        }
    }
    
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
            //if (!this.nodes.line) this.nodes.line = [];
            node.connections = [];

            for (var connection, i = 0, l = connections.length; i < l; i++) {
                connection = {
                    ref     : connections[i].getAttribute("ref"),
                    input   : connections[i].getAttribute("input"),
                    output  : connections[i].getAttribute("output"),
                    type    : 'line',
                    arrow   : (connections[i].getAttribute("type")) ? connections[i].getAttribute("type") : 'none-arrow',
                    from    : node,
                    to      : this.nodes[connections[i].getAttribute("ref")] ? this.nodes[connections[i].getAttribute("ref")] : connections[i].getAttribute("ref"),
                    top     : 0,
                    left    : 0,
                    width   : 100,
                    height  : 100
                };
                
                //this.nodes.line.push(connection);
                node.connections.push(connection);
            }
        }
       
        /*
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
        */
       
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

        node.connectors = {
            top:    {x: node.x, y: node.top, minLengthX: node.x, minLengthY: node.top - this.$minLineLength},
            left:   {x: node.left, y: node.y, minLengthX: node.left - this.$minLineLength, minLengthY: node.y},
            right:  {x: node.right, y: node.y, minLengthX: node.right + this.$minLineLength, minLengthY: node.y},
            bottom: {x: node.x, y: node.bottom, minLengthX: node.x, minLengthY: node.bottom + this.$minLineLength},
        }
        
        return node;
    }

    this.$initLines = function() {
        this.nodes["line"] = [];
        
        var blockNodes = [];
        if (this.nodes["rect"]) blockNodes = blockNodes.concat(this.nodes["rect"]);
        if (this.nodes["decision"]) blockNodes = blockNodes.concat(this.nodes["decision"]);
        if (this.nodes["circle"]) blockNodes = blockNodes.concat(this.nodes["circle"]);
        if (this.nodes["selection"]) blockNodes = blockNodes.concat(this.nodes["selection"]);

        for (var node, i = 0, l = blockNodes.length; i < l; i++) {
            node = blockNodes[i];
            if (node.connections && node.connections.length) {
                for (var lineNode, lines = [], connection, c = 0, cl = node.connections.length; c < cl; c++) {
                    lineNode = {};
                    connection  = node.connections[c];
                    
                    lineNode.output = connection.output;
                    lineNode.input = connection.input;
                    lineNode.arrow = connection.arrow;
                    
                    lineNode.type   = 'line';
                    lineNode.from   = (typeof connection.from === 'string') ? this.nodes[connection.from] : connection.from;
                    lineNode.to     = (typeof connection.to === 'string') ? this.nodes[connection.to] : connection.to;
                    lineNode.status = "connect";
                    
                    this.nodes["line"].push(lineNode);
                }
            }
        }
    }
    
    this.$calculateLines = function() {
        for (var lineNode, i = 0, l = this.nodes["line"].length; i < l; i++) {
            lineNode = this.nodes["line"][i];
            
// calculate line
            nodeLines = [];
            if (lineNode.status == "connect") {
                if ('right|bottom'.indexOf(lineNode.output) > -1) {
                    from = lineNode.from.connectors[lineNode.output];
                    to = lineNode.to.connectors[lineNode.input];
                }
                else if ('top|left'.indexOf(lineNode.output) > -1) {
                    from = lineNode.from.connectors[lineNode.output];
                    to = lineNode.to.connectors[lineNode.input];
                }
                lineNode.startPoint = {x: from.x, y: from.y}
                lineNode.endPoint = {x: to.x, y: to.y}
            }
          
            // start of line
            nodeLines.push({x: lineNode.startPoint.x, y: lineNode.startPoint.y});
            
            if (lineNode.status == "connect") {
                nodeLines.push({x: from.minLengthX, y: from.minLengthY});
                if ((lineNode.output == 'right' && lineNode.input == 'left')
                 || (lineNode.output == 'right' && lineNode.input == 'left')
                 || (lineNode.output == 'bottom' && lineNode.input == 'left')
                 || (lineNode.output == 'top' && lineNode.input == 'top')
                ) {
                    if (lineNode.startPoint.x < to.x - this.$minLineLength*2) {
                        nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: from.minLengthY});
                        nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: to.minLengthY});
                    }
                    else {
                        nodeLines.push({x: from.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                        nodeLines.push({x: to.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                    }
                }
                else if ((lineNode.output == 'bottom' && lineNode.input == 'top')
                 || (lineNode.output == 'top' && lineNode.input == 'bottom')
                 || (lineNode.output == 'right' && lineNode.input == 'top')
                 || (lineNode.output == 'right' && lineNode.input == 'bottom')
                 || (lineNode.output == 'bottom' && lineNode.input == 'right')
                 || (lineNode.output == 'left' && lineNode.input == 'right')
                 || (lineNode.output == 'left' && lineNode.input == 'top')
                ) {
                    if (from.y < to.y - this.$minLineLength*2) {
                        nodeLines.push({x: from.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                        nodeLines.push({x: to.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                    }
                    else {
                        nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: from.minLengthY});
                        nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: to.minLengthY});
                    }
                }
                /*
                else if ((lineNode.output == 'right' && lineNode.input == 'right')
                    
                ) {
                }
                */  
                var arrowHeight = 20;
                var arrowWidth = 20;
                nodeLines.push({x: to.minLengthX, y: to.minLengthY});
                if (lineNode.arrow == 'arrow') {
                    // flip arrow
                    if (lineNode.input == 'left') {
                        arrowWidth *= -1;
                    }
                    else if (lineNode.input == 'top') {
                        arrowHeight *= -1;
                    }
                    
                    if ('left|right'.indexOf(lineNode.input) > -1) {
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x + arrowWidth, y: lineNode.endPoint.y});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x + arrowWidth, y: lineNode.endPoint.y - arrowHeight/2});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x, y: lineNode.endPoint.y});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x + arrowWidth, y: lineNode.endPoint.y + arrowHeight/2});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x + arrowWidth, y: lineNode.endPoint.y});
                    }
                    else if ('top|bottom'.indexOf(lineNode.input) > -1) {
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x, y: lineNode.endPoint.y + arrowHeight});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x - arrowWidth/2, y: lineNode.endPoint.y + arrowHeight});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x, y: lineNode.endPoint.y});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x + arrowWidth/2, y: lineNode.endPoint.y + arrowHeight});
                        nodeLines.push({arrowLine: true, x: lineNode.endPoint.x, y: lineNode.endPoint.y + arrowHeight});
                    }
                }
                else {
                    nodeLines.push({x: lineNode.endPoint.x, y: lineNode.endPoint.y});
                }
            }
            else if (lineNode.status == "moved") {
                nodeLines.push({x: lineNode.endPoint.x, y: lineNode.endPoint.y});
            }
            else {
                nodeLines.push({x: lineNode.endPoint.x, y: lineNode.endPoint.y});
            }

            lineNode.lines = nodeLines;
            
            // set values for selections
            for (var curLine, li = 0, ll = lineNode.lines.length; li < ll; li++) {
                curPoint = lineNode.lines[li];
                nextPoint = lineNode.lines[li+1];
                if (nextPoint) {
                    lineNode.lines[li].left = (curPoint.x < nextPoint.x) ? curPoint.x : nextPoint.x;
                    lineNode.lines[li].right = (curPoint.x > nextPoint.x) ? curPoint.x : nextPoint.x;
                    lineNode.lines[li].top = (curPoint.y < nextPoint.y) ? curPoint.y : nextPoint.y;
                    lineNode.lines[li].bottom = (curPoint.y > nextPoint.y) ? curPoint.y : nextPoint.y;
                    if (lineNode.lines[li].left == lineNode.lines[li].right) {
                        lineNode.lines[li].left -= 10;
                        lineNode.lines[li].right += 10;
                    }
                    if (lineNode.lines[li].top == lineNode.lines[li].bottom) {
                        lineNode.lines[li].top -= 10;
                        lineNode.lines[li].bottom += 10;
                    }
                }
            }
        }
    }    
    
    this.$drawLayers = function() {
        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers["root"], this);
        this.$drawCode = this.$compile( this.$rootLayers["root"], $style, "root");
        this.$drawCode(this.$rootLayers["root"], this);
        apf.draw.resizeLayer(this.$rootLayers["root"]);

        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers["grid"], this);
        this.$drawCode = this.$compile( this.$rootLayers["grid"], $style, "grid");
        this.$drawCode(this.$rootLayers["grid"], this);
        apf.draw.resizeLayer(this.$rootLayers["grid"]);

        this.$calculateLines();
        
        for (var type in this.nodes) {
            if ("root|grid|selection".indexOf(type) > -1) continue;
            if (this.$rootLayers[type]) {
                var err = {};
                var $style = apf.draw.parseStyle(this.$node_style , "", err );
                apf.draw.initLayer(this.$rootLayers[type], this);
                this.$drawCode = this.$compile( this.$rootLayers[type], $style, type);
                this.$drawCode(this.$rootLayers[type], this);
                apf.draw.resizeLayer(this.$rootLayers[type]);
            }
        }
        
        // end with selection layer
        type = 'selection';
        var err = {};
        var $style = apf.draw.parseStyle(this.$node_style , "", err );
        apf.draw.initLayer(this.$rootLayers[type], this);
        this.$drawCode = this.$compile( this.$rootLayers[type], $style, type);
        this.$drawCode(this.$rootLayers[type], this);
        apf.draw.resizeLayer(this.$rootLayers[type]);

        
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
        this.$calculateGrid();
        this.$initLines();
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

                    "if (type == 'selection') {", 
                        e.rect(
                            "node.left",
                            "node.top",
                            "node.width",
                            "node.height"
                        ),
                    "}",
                    "else if (type === 'rect') {", 
                        e.rect(
                            "node.left + this.$viewport.offset.x",
                            "node.top + this.$viewport.offset.y",
                            "node.width",
                            "node.height"
                        ),
                    "}",
                    "else if (type === 'decision') {", 
                        e.moveTo("node.connectors.top.x + this.$viewport.offset.x", "node.connectors.top.y + this.$viewport.offset.y"),
                        e.lineTo("node.connectors.right.x + this.$viewport.offset.x", "node.connectors.right.y + this.$viewport.offset.y"),
                        e.lineTo("node.connectors.bottom.x + this.$viewport.offset.x", "node.connectors.bottom.y + this.$viewport.offset.y"),
                        e.lineTo("node.connectors.left.x + this.$viewport.offset.x", "node.connectors.left.y + this.$viewport.offset.y"),
                        e.lineTo("node.connectors.top.x + this.$viewport.offset.x", "node.connectors.top.y + this.$viewport.offset.y"),
                    "}",
                    "else if (type === 'circle') {", 
                        e.ellipse("node.x + this.$viewport.offset.x","node.y + this.$viewport.offset.y","node.width","node.height"), 
                    "}",
                    "else if (type === 'line') {",
                        "if (node.lines && node.lines.length) {",
                            // draw lines
                            "var nodeLines = node.lines;",
                            e.moveTo(
                                "node.startPoint.x + this.$viewport.offset.x",
                                "node.startPoint.y + this.$viewport.offset.y"
                            ),
                            "for (var n = 0, nl = nodeLines.length; n < nl; n++) {",
                                e.lineTo(
                                    "nodeLines[n].x + this.$viewport.offset.x",
                                    "nodeLines[n].y + this.$viewport.offset.y"
                                ),
                                e.moveTo(
                                    "nodeLines[n].x + this.$viewport.offset.x",
                                    "nodeLines[n].y + this.$viewport.offset.y"
                                ),
                            "}",
                            e.moveTo(
                                "node.endPoint.x + this.$viewport.offset.x",
                                "node.endPoint.y + this.$viewport.offset.y"
                            ),
                            e.lineTo(
                                "node.endPoint.x + this.$viewport.offset.x",
                                "node.endPoint.y + this.$viewport.offset.y"
                            ),
                        "}",
                    "}",
                    "else if (type === 'grid') {",
                        e.moveTo(
                            "node.from.x",
                            "node.from.y"
                        ),
                        e.lineTo(
                            "node.to.x",
                            "node.to.y"
                        ),
                        e.moveTo(
                            "node.to.x",
                            "node.to.y"
                        ),
                        e.lineTo(
                            "node.to.x",
                            "node.to.y"
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

        this.$selectedNode = null;
        this.nodes["selection"] = [];
        
        this.$drawLayers();
    }
    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keyup", function(e){
        this.$shiftKey = false;
    });
    
    this.$shiftKey = false;
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            //selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;
            value = (ctrlKey ? 10 : (shiftKey ? 20 : 1));

        this.$shiftKey = (shiftKey) ? true : false;

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
        grid : {
            inherit:'shape',
            stroke:'black',
            fill: 'black',
            weight: .1,
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
        $:1},
        selection : {
            inherit:'shape',
            stroke:'green',
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
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        grid: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        circle: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        rect: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        decision: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        line: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        text: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height,
        },
        selection: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
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
        var connectorFound;
        this.$ext.onmousedown = function(e){
            self.$mousedown = true;
            
            if (!e) e = event;
            var resize = false;
            var move = false;
                
            if (typeof e.pageX == "undefined") {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }
            var mouseX = e.pageX, mouseY = e.pageY;
            self.$startMousePos = {x: mouseX, y:mouseY};

            var blockNodes = [];
            if (self.nodes["rect"]) blockNodes = blockNodes.concat(self.nodes["rect"]);
            if (self.nodes["decision"]) blockNodes = blockNodes.concat(self.nodes["decision"]);
            if (self.nodes["circle"]) blockNodes = blockNodes.concat(self.nodes["circle"]);
            if (self.nodes["line"]) blockNodes = blockNodes.concat(self.nodes["line"]);
            if (self.nodes["selection"]) blockNodes = blockNodes.concat(self.nodes["selection"]);
            
            var selectedNode = false;
            for (var node, i = 0, l = blockNodes.length; i < l; i++) {
                node = blockNodes[i];

                if ('rect|decision|circle|line|selection'.indexOf(node.type) > -1) {
                    if (node.type == 'line') {
                        for (var line, li = 0, ll = node.lines.length; li < ll; li++) {
                            line = node.lines[li]; 
                            if (!line.arrowLine) {
                                if (mouseX > line.left + self.$viewport.offset.x && mouseX < line.right + self.$viewport.offset.x &&
                                mouseY > line.top + self.$viewport.offset.y && mouseY < line.bottom + self.$viewport.offset.y) {
                                    self.$selectedNode = node;
                                    node.selected = true;
                                    // add node to selection layer
                                    self.$setSelection(node);
                                    selectedNode = true;
                                }
                            }
                        }
                    }
                    else if (mouseX > node.left + self.$viewport.offset.x && mouseX < node.right + self.$viewport.offset.x &&
                        mouseY > node.top + self.$viewport.offset.y && mouseY < node.bottom + self.$viewport.offset.y) {
                            if (node.type != "selection") {
                                self.$selectedNode = node;
                                node.selected = true;
    
                                // add node to selection layer
                                self.$setSelection(node, true);
                            }
                            
                            // resize handlers
                            else {
                                self.$handlerNode = node;
                                
                                if (self.$handlerNode.id != "from" && self.$handlerNode.id != "to") {
                                    resize = true;
                                    move = false;
                                }
                                else {
                                    resize = false;
                                    move = true;
                                }
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
                self.$viewport.offset.curX = self.$viewport.offset.x;
                self.$viewport.offset.curY = self.$viewport.offset.y;
            }

            if (self.$selectedNode) {
                var diffX = mouseX - self.$selectedNode.x;
                var diffY = mouseY - self.$selectedNode.y;
            }
            if (!self.$selectedNode) {
                self.nodes["selection"] = [];
            }
            
            self.$drawLayers();
            self.$ext.onmousemove = function(e) {
                if (!e) e = event;
                
                if (typeof e.pageX == "undefined") {
                    e.pageX = e.clientX;
                    e.pageY = e.clientY;
                }
                var mouseX = e.pageX, mouseY = e.pageY;
                
                if (self.$mousedown && self.$selectedNode) {
                    if (resize) {
                        // calculate width
                        var newHeight;
                        if ('bottomright|topright'.indexOf(self.$handlerNode.id) > -1) {
                            newWidth = mouseX - self.$selectedNode.left - 20;
                        }
                        else if ('bottomleft|topleft'.indexOf(self.$handlerNode.id) > -1) {
                            newWidth = self.$selectedNode.right - self.$selectedNode.left + (self.$selectedNode.left - mouseX);
                        }

                        // calculate height
                        var newHeight;
                        if ('bottomleft|bottomright'.indexOf(self.$handlerNode.id) > -1) {
                            newHeight = mouseY - self.$selectedNode.top - 20;
                        }
                        else if ('topleft|topright'.indexOf(self.$handlerNode.id) > -1) {
                            newHeight = self.$selectedNode.bottom - self.$selectedNode.top + (self.$selectedNode.top - mouseY);
                        }

                        // if circle, half width and height
                        if (self.$selectedNode.type === 'circle') { 
                            newWidth /= 2;
                            newHeight /= 2;
                        }

                        if (self.$shiftKey) {
                            var ratio;
                            if (newHeight > newWidth) {
                                ratio = newHeight / self.$selectedNode.height;
                                newWidth = self.$selectedNode.width * ratio;
                            }
                            else {
                                ratio = newWidth / self.$selectedNode.width;
                                newHeight = self.$selectedNode.height * ratio;
                            }
                        }


                        // set width
                        self.$selectedNode.width = newWidth;
                        //if (self.$selectedNode.width < 10)
                            //self.$selectedNode.width = 10;
                        if (self.$handlerNode.id.indexOf('left') > -1)
                            self.$selectedNode.left = mouseX;
                        self.$selectedNode.right = self.$selectedNode.left + newWidth;
                        
                        // set height
                        self.$selectedNode.height = newHeight;
                        //if (self.$selectedNode.height < 10)
                            //self.$selectedNode.height = 10;
                        if (self.$handlerNode.id.indexOf('top') > -1)
                            self.$selectedNode.top = mouseY;
                        self.$selectedNode.bottom = self.$selectedNode.top + newHeight;


                        self.$setPositions(self.$selectedNode);
                        
                        // redraw selection box based on new size
                        self.nodes["selection"] = [];
                        self.$setSelection(self.$selectedNode, true);
                    }
                    else if (move) {
                        if ('from|to'.indexOf(self.$handlerNode.id) > -1) {
                            connectorFound = false;
                            for (var node, n = 0, nl = blockNodes.length; n < nl; n++) {
                                node = blockNodes[n];
                                for (var pos in node.connectors) {
                                    connector = node.connectors[pos];
                                    if (mouseX > connector.x - self.$grid.cellW && mouseX < connector.x + self.$grid.cellW 
                                     && mouseY > connector.y - self.$grid.cellH && mouseY < connector.y + self.$grid.cellH) {
                                        if (self.$handlerNode.id == 'from') {
                                            self.$selectedNode.startPoint.x = connector.x;
                                            self.$selectedNode.startPoint.y = connector.y;
                                            self.$selectedNode.from = node;
                                            self.$selectedNode.output = pos;
                                        }
                                        else if (self.$handlerNode.id == 'to') {
                                            self.$selectedNode.endPoint.x = connector.x;
                                            self.$selectedNode.endPoint.y = connector.y;
                                            self.$selectedNode.to = node;
                                            self.$selectedNode.input = pos;
                                        }
                                        connectorFound = true;
                                        self.$setSelection(self.$selectedNode, true);
                                        self.$selectedNode.status = "connect";
                                    }
                                }
                            }
                            
                            if (!connectorFound) {
                                self.$selectedNode.status = "";
                                var snapX = Math.round((mouseX)/self.$grid.cellW)*self.$grid.cellW;
                                var snapY = Math.round((mouseY)/self.$grid.cellH)*self.$grid.cellH;

                                if (self.$handlerNode.id == 'from') {
                                    self.$selectedNode.startPoint.x = snapX;//mouseX;
                                    self.$selectedNode.startPoint.y = snapY;//mouseY;
                                    
                                }
                                else if (self.$handlerNode.id == 'to') {
                                    self.$selectedNode.endPoint.x = snapX;//mouseX;
                                    self.$selectedNode.endPoint.y = snapY;//mouseY;
                                }
                                self.nodes["selection"] = [];
                                self.$setSelection(self.$selectedNode);
                            }
                        }
                    }
                    else {
                        if (self.$selectedNode.type != 'line') {
                            // set new node position
                            var snapX = Math.round((mouseX - diffX)/self.$grid.cellW)*self.$grid.cellW;
                            var snapY = Math.round((mouseY - diffY)/self.$grid.cellH)*self.$grid.cellH;
                            self.$selectedNode.x = snapX; //mouseX - diffX
                            self.$selectedNode.y = snapY; //mouseY - diffY
                            self.$setPositions(self.$selectedNode);
                        }
                        else {
                            //
                            diffX = self.$startMousePos.x - mouseX; 
                            diffY = self.$startMousePos.y - mouseY;
                            for (var li = 0, ll = self.$selectedNode.lines.length; li < ll; li++) {
                                self.$selectedNode.lines[li].x += diffX;
                                self.$selectedNode.lines[li].y += diffY;
                            }
                            //self.$selectedNode.status = "moved";
                        }
                        // reset current selection
                        self.nodes["selection"] = [];
                        
                        // set new selection
                        self.$setSelection(self.$selectedNode, true);
                    }
                    
                    // refresh canvas
                    self.$drawLayers();
                
                // interaction on viewport
                } else if (self.$mousedown) {
                    if (self.$viewport.mode == "move") {
                        diffX = mouseX - self.$startMousePos.x; 
                        diffY = mouseY - self.$startMousePos.y;
                        
                        self.$viewport.offset.x = parseInt(self.$viewport.offset.curX + diffX)
                        self.$viewport.offset.y = parseInt(self.$viewport.offset.curY + diffY);
                        self.$calculateGrid();
                        self.$drawLayers();
                    }
                    else if (self.$viewport.mode == "select") {
                        self.nodes['selection'] = [];
                        document.getElementById("status").value = self.$viewport.offset.curX;
                        self.$selection = {
                            type: "selection",
                            top: self.$startMousePos.y,
                            left: self.$startMousePos.x ,
                            width: mouseX - self.$startMousePos.x,
                            height: mouseY - self.$startMousePos.y 
                        }
                        self.nodes['selection'].push(self.$selection);
                        self.$drawLayers();
                    }
                }
            }
        }
        
        this.$ext.onmouseup = function(e) {
            self.$mousedown = false;
            
            if (self.$selection) {
                
                self.$selection = null;
                self.nodes['selection'] = [];
                self.$drawLayers();
            }
            if (self.$selectedNode) {
                //self.$setPositions(self.$selectedNode);
                self.$drawLayers();
            }
        }
        this.$ext.onmouseout = function(e) {
            self.$mousedown = false;
        }
    };
    
    // @todo calculate selection box based on grid size, should line up with grid lines
    this.$setSelection = function(node, resize) {
        this.nodes["selection"] = [];
        
        var box = null;
        if ('decision|rect'.indexOf(node.type) > -1) {
            box = {
                type: "selection",
                left: node.left - this.$grid.cellW + this.$viewport.offset.x,
                top: node.top - this.$grid.cellH + this.$viewport.offset.y,
                width: node.width + this.$grid.cellW*2,
                height: node.height + this.$grid.cellH*2
            }
        }
        else if (node.type == 'circle') {
            box = {
                type: "selection",
                left: node.left - this.$grid.cellW + this.$viewport.offset.x,
                top: node.top - this.$grid.cellH + this.$viewport.offset.y,
                width: node.width*2 + this.$grid.cellW*2,
                height: node.height*2 + this.$grid.cellH*2
            }
        }

        if (box) {
            this.nodes["selection"].push(box);
        }
        if (resize || node.type == 'line') {
            var hWidth = this.$grid.cellW, hHeight = this.$grid.cellH;
            
            var handlers;
            if (node.type != 'line') {
                var top = node.top - hHeight + this.$viewport.offset.y;
                var left = node.left - hWidth + this.$viewport.offset.x;
                var bottom = node.bottom + this.$viewport.offset.y;
                var right = node.right + this.$viewport.offset.x;

                handlers = [
                    {type: "selection", id: "topleft", width: hWidth, height: hHeight, top: top, left: left, right: left+hWidth, bottom: top+hHeight }, //topleft 
    //                {type: "selection", id: "top", width: hWidth, height: hHeight, top: top, left: left + node.width/2 + hWidth/2, right: left + node.width/2 + hWidth/2 + hWidth, bottom: top+hHeight  }, //top
                    {type: "selection", id: "topright", width: hWidth, height: hHeight, top: top, left: right, right: right+hWidth, bottom: top+hHeight }, //topright
    //                {type: "selection", id: "right", width: hWidth, height: hHeight, top: top + node.height/2 + hWidth/2, left: right, right: right+hWidth, bottom: top + node.height/2 + hHeight}, //right
                    {type: "selection", id: "bottomright", width: hWidth, height: hHeight, top: bottom, left: right, right: right+hWidth, bottom: bottom+hHeight }, //bottomright
    //                {type: "selection", id: "bottom", width: hWidth, height: hHeight, top: top, left: left + hWidth/2 }, //bottom
                    {type: "selection", id: "bottomleft", width: hWidth, height: hHeight, top: bottom, left: left, right: left+hWidth, bottom: bottom+hHeight } //bottomleft
    //                {type: "selection", id: "left", width: hWidth, height: hHeight, top: top + node.height/2, left: left }  //left
                ];
            }
            else {
                handlers = [
                    {type: "selection", id: "from", width: hWidth, height: hHeight, top: node.startPoint.y - hHeight/2 + this.$viewport.offset.y, left: node.startPoint.x - hWidth/2 + this.$viewport.offset.x, right: node.startPoint.x+hWidth/2, bottom: node.startPoint.y+hHeight/2 }, 
                    {type: "selection", id: "to", width: hWidth, height: hHeight, top: node.endPoint.y - hHeight/2 + this.$viewport.offset.y, left: node.endPoint.x - hWidth/2 + this.$viewport.offset.x, right: node.endPoint.x+hWidth/2 + this.$viewport.offset.x, bottom: node.endPoint.y+hHeight/2 + this.$viewport.offset.y} 
                ];
            }
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
