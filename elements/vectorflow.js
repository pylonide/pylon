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
};

(function(){
    this.self = this;

    this.nodes = {
        nodes: {}
    };
    
    this.$selectionLayers = ["selection_outline", "selection_resize", "selection_lineConnect"];

    //#ifdef __WITH_DATAACTION
    this.implement(apf.DataAction);
    //#endif
    
    //Options
    this.$focussable   = true; // This object can get the focus.
    this.bufferselect  = true;
    
    /**** Properties and Attributes ****/
    this.$snapping = false;
    this.$viewport = {
        width: 800,             // width for viewport and layers
        height: 800,            // height for viewport and layers
        offset: {x: 0, y: 0},    // offset of viewport
        mode: "select",
        zoom: 1
    };
    this.$grid = {
        cellW: 20,
        cellH: 20
    };

    this.$calculateGrid = function() {
        this.nodes["grid"] = [];
        var width = this.$viewport.width;// + Math.abs(this.$viewport.offset.x);
        var height = this.$viewport.height;// + Math.abs(this.$viewport.offset.y);

        var cellW = this.$grid.cellW * this.$viewport.zoom;
        var cellH = this.$grid.cellH * this.$viewport.zoom;

        var numRows = height/cellH;
        var numCols = width/cellW;
        
        // horizontal lines
        for (var ri = 0, rl = numRows; ri < rl; ri++) {
            this.nodes["grid"].push({
                type: "grid",
                from: {x: 0, y: ri * cellH + this.$viewport.offset.y}, 
                to: {x: width + this.$viewport.offset.x, y: ri * cellH + this.$viewport.offset.y}
            })
        }
        
        // vertical lines
        for (var ci = 0, cl = numCols; ci < cl; ci++) {
            this.nodes["grid"].push({
                type: "grid",
                from: {x: ci * cellW + this.$viewport.offset.x, y: 0}, 
                to: {x: ci * cellW + this.$viewport.offset.x, y: height + this.$viewport.offset.y}
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
                    to      : this.nodes.nodes[connections[i].getAttribute("ref")] ? this.nodes.nodes[connections[i].getAttribute("ref")] : connections[i].getAttribute("ref"),
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
        
        if (this.nodes.nodes[node.id]) {
            apf.console.error("block with id " + node.id + " already exists");
            return;
        }
        this.nodes.nodes[node.id] = node;
        
        if (!this.nodes[node.type]) this.nodes[node.type] = [];
        this.nodes[node.type].push(node);
    };
    
    this.$applyZoom = function() {
        this.$calculateGrid();
        
        for (var name in this.nodes.nodes) {
            node = this.nodes.nodes[name];
            
            
                
            if (node.type != 'line') {
                // save original position and dimensions
                if (!node.original) 
                    node.original = {x: node.x, y: node.y, width: node.width, height: node.height};
                    
                node.x = node.original.x/this.$grid.cellH * (this.$viewport.zoom * this.$grid.cellH);
                node.y = node.original.y/this.$grid.cellW * (this.$viewport.zoom * this.$grid.cellW);
                node.width = node.original.width * this.$viewport.zoom; 
                node.height = node.original.height * this.$viewport.zoom;
                this.$setPositions(node);
            }
        }
        
        for (var node, i = 0, l = this.nodes["line"].length; i < l; i++) {
            node = this.nodes["line"][i];
            // save original position and dimensions
            if (!node.original) {
                node.original = {
                    startPoint: {x: node.startPoint.x, y: node.startPoint.y},
                    endPoint: {x: node.endPoint.x, y: node.endPoint.y}
                };
            }
            node.startPoint = {
                x: node.original.startPoint.x/this.$grid.cellW * (this.$viewport.zoom * this.$grid.cellW), 
                y: node.original.startPoint.y/this.$grid.cellH * (this.$viewport.zoom * this.$grid.cellH)
            };
            node.endPoint = {
                x: node.original.endPoint.x/this.$grid.cellW * (this.$viewport.zoom * this.$grid.cellW), 
                y: node.original.endPoint.y/this.$grid.cellH * (this.$viewport.zoom * this.$grid.cellH)
            };
        }

        for (var i = 0, l = this.$selectedNodes.length; i < l; i++) {
            //if (this.$selectedNodes[i].type == 'line') {
                //alert(this.$selectedNodes[i].original.startPoint.x);
            //}
            this.$setSelection(this.$selectedNodes[i]);
        }
        
        this.$drawLayers();
    }
    
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
            bottom: {x: node.x, y: node.bottom, minLengthX: node.x, minLengthY: node.bottom + this.$minLineLength}
        };
        
        return node;
    }

    this.$initLines = function() {
        this.nodes["line"] = [];
        
        var blockNodes = [];
        if (this.nodes["rect"]) blockNodes = blockNodes.concat(this.nodes["rect"]);
        if (this.nodes["decision"]) blockNodes = blockNodes.concat(this.nodes["decision"]);
        if (this.nodes["circle"]) blockNodes = blockNodes.concat(this.nodes["circle"]);
        //if (this.nodes["selection"]) blockNodes = blockNodes.concat(this.nodes["selection"]);

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
                    lineNode.from   = (typeof connection.from === 'string') ? this.nodes.nodes[connection.from] : connection.from;
                    lineNode.to     = (typeof connection.to === 'string') ? this.nodes.nodes[connection.to] : connection.to;
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
                        if (lineNode.startPoint.y < to.y - this.$minLineLength*2) {
                            nodeLines.push({x: from.minLengthX, y: to.minLengthY});
                        }
                        else {
                            nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: from.minLengthY});
                            nodeLines.push({x: (from.minLengthX + to.minLengthX)/2, y: to.minLengthY});
                        }
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
                 || (lineNode.output == 'bottom' && lineNode.input == 'bottom')
                ) {
                    if (from.y < to.y - this.$minLineLength) {
                        if (from.x < to.x - this.$minLineLength*2) {
                            nodeLines.push({x: to.minLengthX, y: from.minLengthY});
                        }
                        else {
                            nodeLines.push({x: from.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                            nodeLines.push({x: to.minLengthX, y: (from.minLengthY + to.minLengthY)/2});
                        }
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
        
        // end with selection layers
        for (var type, i = 0, l = this.$selectionLayers.length; i < l; i++) {
            type = this.$selectionLayers[i];
            if (!this.nodes[type] || (this.nodes[type] && !this.nodes[type].length)) continue;
            
            var err = {};
            var $style = apf.draw.parseStyle(this.$node_style , "", err );
            apf.draw.initLayer(this.$rootLayers[type], this);
            this.$drawCode = this.$compile( this.$rootLayers[type], $style, type);
            this.$drawCode(this.$rootLayers[type], this);
            apf.draw.resizeLayer(this.$rootLayers[type]);
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

                    "if (type == 'selection_outline' || type == 'selection_resize' || type == 'selection_lineConnect') {", 
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
    
    this.$deleteNodes = function() {
        for (var node, i = 0, l = this.$selectedNodes.length; i < l; i++) {
            node = this.$selectedNodes[i];
            
            delete this.nodes.nodes[node.id];
            
            for (var ni = 0, nl = this.nodes[node.type].length; ni < nl; ni++) {
                if (this.nodes[node.type][ni] == node) {
                    this.nodes[node.type].splice(ni, 1);
                    break;
                }
            }
        }
        
        this.$selectedNodes = [];
        this.$resetSelection();
        
        this.$drawLayers();
    }
    
    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keyup", function(e){
        this.$shiftKey = false;
        this.$ctrlKey = false;
    });
    
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            //selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;
            multiplier = (ctrlKey ? 2 : (shiftKey ? 5 : 1));

        this.$shiftKey = (shiftKey) ? true : false;
        this.$ctrlKey = (ctrlKey) ? true : false;

        if (!this.$selectedNodes || this.$selectedNodes && !this.$selectedNodes.length)
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$ext;

        switch (key) {
            case 27: //ESC
                this.$selectedNodes = [];
                this.$resetSelection();
                this.$drawLayers();
                break;
            case 46: //DEL
                this.$deleteNodes();
                break;
            case 37:
                //LEFT
                this.$resetSelection();
                for (var i = 0, l = this.$selectedNodes.length; i < l; i++) {
                    this.$selectedNodes[i].x -= this.$grid.cellW * multiplier;
                    this.$setPositions(this.$selectedNodes[i]);
                    this.$setSelection(this.$selectedNodes[i], true);
                }
                this.$drawLayers();
                break;
            case 39:
                //RIGHT
                this.$resetSelection();
                for (var i = 0, l = this.$selectedNodes.length; i < l; i++) {
                    this.$selectedNodes[i].x += this.$grid.cellW * multiplier;
                    this.$setPositions(this.$selectedNodes[i]);
                    this.$setSelection(this.$selectedNodes[i], true);
                }
                this.$drawLayers();
                break;
            case 38:
                //UP
                this.$resetSelection();
                for (var i = 0, l = this.$selectedNodes.length; i < l; i++) {
                    this.$selectedNodes[i].y -= this.$grid.cellH * multiplier;
                    this.$setPositions(this.$selectedNodes[i]);
                    this.$setSelection(this.$selectedNodes[i], true);
                }
                this.$drawLayers();
                break;
            case 40:
                //DOWN
                this.$resetSelection();
                for (var i = 0, l = this.$selectedNodes.length; i < l; i++) {
                    this.$selectedNodes[i].y += this.$grid.cellH * multiplier;
                    this.$setPositions(this.$selectedNodes[i]);
                    this.$setSelection(this.$selectedNodes[i], true);
                }
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
//            weight:5,
//            strokeopacity:0.5,
            fill:'red',
        $:1},
        rect : {
            inherit:'shape',
            stroke:'black',
            opacity:0.6,
            fill:'blue',
        $:1},
        decision : {
            inherit:'shape',
            stroke:'black',
            opacity:0.6,
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
        selection_outline : {
            inherit:'shape',
            stroke:'green',
        $:1},
        selection_resize : {
            inherit:'shape',
            fill:'green',
        $:1},
        selection_lineConnect : {
            inherit:'shape',
            fill:'red',
        $:1}
    };

    this.$rootLayers = {
        root: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        grid: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        circle: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        rect: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        decision: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        line: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        text: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        selection_outline: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        selection_resize: {
            left: 0,
            top: 0,
            width: this.$viewport.width,
            height: this.$viewport.height
        },
        selection_lineConnect: {
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

        this.$ext.focus();
        
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
        this.$resetSelection();
        
        // add click listener
        var connectorFound;
        this.$ext.onmousedown = function(e){
            if (!self.$mouse) self.$mouse = {};
            self.$mouse.status = "mousedown";

            if (!e) e = event;

            var resize = false;
            var move = false;
                
            if (typeof e.pageX == "undefined") {
                e.pageX = e.clientX;
                e.pageY = e.clientY;
            }
            
            self.$mouse.cur = {x: e.pageX, y: e.pageY};
            self.$mouse.start = {x: self.$mouse.cur.x, y:self.$mouse.cur.y};

            if (self.$selectedNodes && self.$selectedNodes.length) {
                self.$prevSelectedNodes = self.$selectedNodes;
                
                if (self.$selectedNodes.length == 1) {
                    self.$handlerNode = self.$getHandlerNode();
                }
                
                if (!self.$handlerNode) {
                    // select single node
                    if (!self.$ctrlKey) {
                        self.$selectedNodes = self.$setSelectedNodes();
                        
                        if (self.$selectedNodes.length == 1) {
                            if (self.$prevSelectedNodes.indexOf(self.$selectedNodes[0]) == -1)
                                self.$handlerNode = self.$getHandlerNode();
                            else
                                self.$selectedNodes = self.$prevSelectedNodes;
                        }
                    // select multiple nodes with CTRL + click
                    } else {
                        self.$selectedNodes = self.$setSelectedNodes(true, true);
                    }
                    
                    if (!self.$selectedNodes.length) {
                        //self.$resetSelection();
                    }
                }
            }
            else {
                // select single node
                if (!self.$ctrlKey) {
                    self.$selectedNodes = self.$setSelectedNodes();
                // select multiple nodes with CTRL + click
                } else {
                    self.$selectedNodes = self.$setSelectedNodes(true, true);
                }
            }

            if (self.$selectedNodes.length) {
                for (var i = 0, l = self.$selectedNodes.length; i < l; i++) {
                    self.$selectedNodes[i].diffX = self.$mouse.start.x - self.$selectedNodes[i].x;
                    self.$selectedNodes[i].diffY = self.$mouse.start.y - self.$selectedNodes[i].y;
                }
            }
            else {
                self.$resetSelection();
                self.$viewport.offset.curX = self.$viewport.offset.x;
                self.$viewport.offset.curY = self.$viewport.offset.y;

                // left mouse click
                if (e.button != 2) {
                    self.$viewport.mode = "select";
                }
                // right mouse click
                else {
                    self.$viewport.mode = "move";
                }
            }
            
            // redraw layers based on selection
            self.$drawLayers();
            
            self.$ext.onmousemove = function(e) {
                if (!e) e = event;
                
                if (typeof e.pageX == "undefined") {
                    e.pageX = e.clientX;
                    e.pageY = e.clientY;
                }
                
                self.$mouse.cur = {x: e.pageX, y: e.pageY};
                
                if ("mousedown|mousedrag".indexOf(self.$mouse.status) > -1) {
                    // drag minimum num of pixels to be considered draggin instead of clicking
                    var minDragAmount = 5;
                    if (Math.abs(self.$mouse.cur.x - self.$mouse.start.x) < minDragAmount && Math.abs(self.$mouse.cur.y - self.$mouse.start.y) < minDragAmount) {
                        return;
                    }

                    self.$mouse.status = "mousedrag";
                    
                    if (self.$selectedNodes && self.$selectedNodes.length) {
                        if (self.$selectedNodes.length == 1 && self.$handlerNode) {
                            if (self.$handlerNode.handlerType == "resize") {
                                
                                // calculate width
                                var newWidth = 0;
                                if (self.$handlerNode.id.indexOf('right') > -1) {
                                    newWidth = (self.$snapping) ? Math.round((self.$mouse.cur.x - self.$viewport.offset.x - self.$selectedNodes[0].left)/self.$grid.cellH)*self.$grid.cellH : self.$mouse.cur.x - self.$viewport.offset.x - self.$selectedNodes[0].left;
                                }
                                else if (self.$handlerNode.id.indexOf('left') > -1) {
                                    newWidth = (self.$snapping) ? Math.round((self.$selectedNodes[0].right - self.$selectedNodes[0].left + (self.$selectedNodes[0].left - self.$mouse.cur.x - self.$viewport.offset.x))/self.$grid.cellH)*self.$grid.cellH : self.$selectedNodes[0].right - self.$selectedNodes[0].left + (self.$selectedNodes[0].left - self.$mouse.cur.x - self.$viewport.offset.x);
                                }
        
                                // calculate height
                                var newHeight;
                                if (self.$handlerNode.id.indexOf('bottom') > -1) {
                                    newHeight = (self.$snapping) ? Math.round((self.$mouse.cur.y - self.$viewport.offset.y - self.$selectedNodes[0].top)/self.$grid.cellH)*self.$grid.cellH : self.$mouse.cur.y - self.$viewport.offset.y - self.$selectedNodes[0].top;
                                }
                                else if (self.$handlerNode.id.indexOf('top') > -1) {
                                    newHeight = (self.$snapping) ? Math.round((self.$selectedNodes[0].bottom - self.$selectedNodes[0].top + (self.$selectedNodes[0].top - self.$mouse.cur.y - self.$viewport.offset.y))/self.$grid.cellH)*self.$grid.cellH : self.$selectedNodes[0].bottom - self.$selectedNodes[0].top + (self.$selectedNodes[0].top - self.$mouse.cur.y - self.$viewport.offset.y);
                                }
        
                                // if circle, half width and height
                                if (self.$selectedNodes[0].type === 'circle') { 
                                    newWidth /= 2;
                                    newHeight /= 2;
                                }
        
                                if (self.$shiftKey) {
                                    var ratio;
                                    if (newHeight > newWidth) {
                                        ratio = newHeight / self.$selectedNodes[0].height;
                                        newWidth = Math.round((self.$selectedNodes[0].width * ratio)/self.$grid.cellH)*self.$grid.cellH;
                                    }
                                    else {
                                        ratio = newWidth / self.$selectedNodes[0].width;
                                        newHeight = Math.round((self.$selectedNodes[0].height * ratio)/self.$grid.cellH)*self.$grid.cellH;
                                    }
                                }
       
                                // set width
                                if (newWidth) {
                                    self.$selectedNodes[0].width = newWidth;
                                    if (self.$selectedNodes[0].width < 20)
                                        self.$selectedNodes[0].width = 20;
                                    if (self.$handlerNode.id.indexOf('left') > -1)
                                        self.$selectedNodes[0].left = self.$mouse.cur.x;
                                    self.$selectedNodes[0].right = self.$selectedNodes[0].left + newWidth;
                                }
                                
                                // set height
                                if (newHeight) {
                                    self.$selectedNodes[0].height = newHeight;
                                    if (self.$selectedNodes[0].height < 20)
                                        self.$selectedNodes[0].height = 20;
                                    if (self.$handlerNode.id.indexOf('top') > -1)
                                        self.$selectedNodes[0].top = self.$mouse.cur.y;
                                    self.$selectedNodes[0].bottom = self.$selectedNodes[0].top + newHeight;
                                }
        
                                self.$setPositions(self.$selectedNodes[0]);
                                
                                // redraw selection box based on new size
                                self.$setSelection(self.$selectedNodes[0]);
                            }
                            else if (self.$handlerNode.handlerType == "lineConnect") {
                                var connectorFound = false;
                                if (!this.blockNodes) {
                                    this.blockNodes = [];
                                    if (self.nodes["rect"]) this.blockNodes = this.blockNodes.concat(self.nodes["rect"]);
                                    if (self.nodes["decision"]) this.blockNodes = this.blockNodes.concat(self.nodes["decision"]);
                                    if (self.nodes["circle"]) this.blockNodes = this.blockNodes.concat(self.nodes["circle"]);
                                }

                                for (var node, n = 0, nl = this.blockNodes.length; n < nl; n++) {
                                    node = this.blockNodes[n];
                                    for (var pos in node.connectors) {
                                        connector = node.connectors[pos];
                                        if (self.$mouse.cur.x > connector.x - self.$grid.cellW + self.$viewport.offset.x 
                                        && self.$mouse.cur.x < connector.x + self.$grid.cellW + self.$viewport.offset.x 
                                        && self.$mouse.cur.y > connector.y - self.$grid.cellH + self.$viewport.offset.y 
                                        && self.$mouse.cur.y < connector.y + self.$grid.cellH + self.$viewport.offset.y) {
                                            if (self.$handlerNode.id == 'from') {
                                                self.$selectedNodes[0].startPoint.x = connector.x;
                                                self.$selectedNodes[0].startPoint.y = connector.y;
                                                self.$selectedNodes[0].from = node;
                                                self.$selectedNodes[0].output = pos;
                                            }
                                            else if (self.$handlerNode.id == 'to') {
                                                self.$selectedNodes[0].endPoint.x = connector.x;
                                                self.$selectedNodes[0].endPoint.y = connector.y;
                                                self.$selectedNodes[0].to = node;
                                                self.$selectedNodes[0].input = pos;
                                            }
                                            connectorFound = true;
                                            self.$setSelection(self.$selectedNodes[0]);
                                            self.$selectedNodes[0].status = "connect";
                                        }
                                    }
                                }
                                
                                if (!connectorFound) {
                                    self.$selectedNodes[0].status = "";
                                    var snapX = (self.$snapping) ? Math.round((self.$mouse.cur.x)/self.$grid.cellW)*self.$grid.cellW - self.$viewport.offset.x : self.$mouse.cur.x;
                                    var snapY = (self.$snapping) ? Math.round((self.$mouse.cur.y)/self.$grid.cellH)*self.$grid.cellH - self.$viewport.offset.y : self.$mouse.cur.y;
    
                                    if (self.$handlerNode.id == 'from') {
                                        self.$selectedNodes[0].startPoint.x = snapX;//mouseX;
                                        self.$selectedNodes[0].startPoint.y = snapY;//mouseY;
                                        
                                    }
                                    else if (self.$handlerNode.id == 'to') {
                                        self.$selectedNodes[0].endPoint.x = snapX;//mouseX;
                                        self.$selectedNodes[0].endPoint.y = snapY;//mouseY;
                                    }
                                    self.$setSelection(self.$selectedNodes[0]);
                                }
                            }
                        }
                        else {
                            // move selected nodes
                            self.$resetSelection();
                            for (var node, i = 0, l = self.$selectedNodes.length; i < l; i++) {
                                node = self.$selectedNodes[i];
    
                                var snapX = (self.$snapping) ? Math.round((self.$mouse.cur.x - node.diffX)/self.$grid.cellW)*self.$grid.cellW : self.$mouse.cur.x - node.diffX;
                                var snapY = (self.$snapping) ? Math.round((self.$mouse.cur.y - node.diffY)/self.$grid.cellH)*self.$grid.cellH : self.$mouse.cur.y - node.diffY;

                                node.x = snapX; //self.$mouse.cur.x - diffX
                                node.y = snapY; //self.$mouse.cur.y - diffY
                                
                                self.$setPositions(node);
                                self.$setSelection(node, true);
                            }
                        }
                    }
                    
                    // interaction on viewport
                    else {
                        if (self.$viewport.mode == "select") {
                            // reset selection box, redraw on every mousemove
                            self.$resetSelection();
                            self.$selection = {
                                type: "selection_outline",
                                top: Math.min(self.$mouse.start.y, self.$mouse.cur.y),
                                left: Math.min(self.$mouse.start.x, self.$mouse.cur.x),
                                width: Math.abs(self.$mouse.cur.x - self.$mouse.start.x),
                                height: Math.abs(self.$mouse.cur.y - self.$mouse.start.y) 
                            }
                            // redraw Selection
                            self.nodes['selection_outline'].push(self.$selection);
                        }
                        else if (self.$viewport.mode == "move") {
                            diffX = self.$mouse.cur.x - self.$mouse.start.x; 
                            diffY = self.$mouse.cur.y - self.$mouse.start.y;
                            
                            self.$viewport.offset.x = parseInt(self.$viewport.offset.curX + diffX)
                            self.$viewport.offset.y = parseInt(self.$viewport.offset.curY + diffY);
                            self.$calculateGrid();
                            //self.$drawLayers();
                        }
                    }
                    
                    self.$drawLayers();
                }
            }
        }
        
        
        this.$ext.onmouseup = function(e) {
            if (self.$mouse.status == "mousedrag" && self.$selectedNodes && self.$selectedNodes.length) {
                self.$mouse.status = "mouseup";
                return;
            }

            self.$mouse.status = "mouseup";

            if (self.$selection) {
                self.$resetSelection();
                self.$selectedNodes = self.$setSelectedNodes(true);
                self.$selection = null;
                self.$drawLayers();
            }
        }
        
        this.$ext.onmouseout = function(e) {
            self.$mousedown = false;
        }

        // Mozilla
        if (this.$ext.addEventListener) {
            this.$ext.addEventListener('DOMMouseScroll', 
            function(e) {
                var delta = 0;
                if (!e) e = event;
                
                if (typeof e.pageX == "undefined") {
                    e.pageX = e.clientX;
                    e.pageY = e.clientY;
                }
                // IE/Opera
                if (e.wheelDelta) {
                    delta = e.wheelDelta/120;
        
                    if (window.opera)
                        delta = -delta;
                // Mozilaa
                } else if (e.detail) {
                    delta = -e.detail/3;
                }
        
                if (delta) {
                    // calculate viewport offset based on mouse position
                    var prevZoom = self.$viewport.zoom;
                    self.$viewport.zoom += delta/10;
                    //alert(parseInt(self.$viewport.width*self.$viewport.zoom - self.$viewport.width) + "\n" + parseInt(self.$viewport.height*self.$viewport.zoom - self.$viewport.height));
                    self.$viewport.offset.x -= (e.pageX/self.$grid.cellW * ((self.$grid.cellW * self.$viewport.zoom) - (self.$grid.cellW * prevZoom)));
                    self.$viewport.offset.y -= (e.pageY/self.$grid.cellH * ((self.$grid.cellH * self.$viewport.zoom) - (self.$grid.cellH * prevZoom)));
                    
                    
                    self.$applyZoom();
                }
        
        //        if (e.preventDefault)
        //            e.preventDefault();
        //        e.returnValue = false;
        }, false);
        }
        // IE/Opera
        else {
            //this.$ext.onmousewheel = document.onmousewheel = this.$wheelscroll;
        }
    };

    
    this.$getHandlerNode = function() {
        var nodesToCheck = [];
        
        if (this.nodes["selection_resize"]) nodesToCheck = nodesToCheck.concat(this.nodes["selection_resize"]);
        if (this.nodes["selection_lineConnect"]) nodesToCheck = nodesToCheck.concat(this.nodes["selection_lineConnect"]);
        
        this.$handlerNode = null;
        for (var check, i = 0, l = nodesToCheck.length; i < l; i++) {
            node = nodesToCheck[i];
            if (!node.handlerType) continue;
            
            check = this.$mouse.cur.x > node.left && this.$mouse.cur.x < node.right && this.$mouse.cur.y > node.top && this.$mouse.cur.y < node.bottom; 

            if (check) {
                return node;
            }
        }
    }
    
    this.$setSelectedNodes = function(multi, add) {
        var nodesToCheck = [];
        if (this.nodes["rect"]) nodesToCheck = nodesToCheck.concat(this.nodes["rect"]);
        if (this.nodes["decision"]) nodesToCheck = nodesToCheck.concat(this.nodes["decision"]);
        if (this.nodes["circle"]) nodesToCheck = nodesToCheck.concat(this.nodes["circle"]);
        if (this.nodes["line"]) nodesToCheck = nodesToCheck.concat(this.nodes["line"]);
        
        var selected = [];
        if (add)
            selected = this.$selectedNodes;
        
        for (var check, i = 0, l = nodesToCheck.length; i < l; i++) {
            node = nodesToCheck[i];

            check = (!this.$selection) 
                ? this.$mouse.cur.x > node.left + this.$viewport.offset.x && this.$mouse.cur.x < node.right + this.$viewport.offset.x && this.$mouse.cur.y > node.top + this.$viewport.offset.y && this.$mouse.cur.y < node.bottom + this.$viewport.offset.y 
                : (node.left + this.$viewport.offset.x > this.$selection.left) && (node.top + this.$viewport.offset.y > this.$selection.top) && (node.right + this.$viewport.offset.x < this.$selection.left + this.$selection.width) && (node.bottom + this.$viewport.offset.y < this.$selection.top + this.$selection.height);

            // check all nodes but lines
            if ('line'.indexOf(node.type) == -1) {
                if (check) {
                    this.$setSelection(node, multi);
                    selected.push(node);
                }
            }
            // check lines
            else if (node.type == 'line') {
                for (var checkLine, line, li = 0, ll = node.lines.length; li < ll; li++) {
                    line = node.lines[li]; 
                    if (!line.arrowLine) {
                        checkLine = (!this.$selection) 
                            ? this.$mouse.cur.x > line.left + this.$viewport.offset.x && this.$mouse.cur.x < line.right + this.$viewport.offset.x && this.$mouse.cur.y > line.top + this.$viewport.offset.y && this.$mouse.cur.y < line.bottom + this.$viewport.offset.y 
                            : (line.left + this.$viewport.offset.x > this.$selection.left) && (line.top + this.$viewport.offset.y > this.$selection.top) && (line.right + this.$viewport.offset.x < this.$selection.left + this.$selection.width) && (line.bottom + this.$viewport.offset.y < this.$selection.top + this.$selection.height);
                        if (checkLine) {
                            selected.push(node);
                            this.$setSelection(node, multi);
                            break;
                        }
                    }
                }
            }
        }

        return selected;
    }

    this.$resetSelection = function() {
        for (var i = 0, l = this.$selectionLayers.length; i < l; i++) {
            this.nodes[this.$selectionLayers[i]] = [];
        }
    }
    // @todo calculate selection box based on grid size, should line up with grid lines?
    this.$setSelection = function(node, multi) {
        if (!multi) {
            this.$resetSelection();
        }
        
        /*
        var box = null;
        if ('decision|rect'.indexOf(node.type) > -1) {
            box = {
                type: "outline",
                left: node.left - this.$grid.cellW + this.$viewport.offset.x,
                top: node.top - this.$grid.cellH + this.$viewport.offset.y,
                width: node.width + this.$grid.cellW*2,
                height: node.height + this.$grid.cellH*2
            }
        }
        else if (node.type == 'circle') {
            box = {
                type: "outline",
                left: node.left - this.$grid.cellW + this.$viewport.offset.x,
                top: node.top - this.$grid.cellH + this.$viewport.offset.y,
                width: node.width*2 + this.$grid.cellW*2,
                height: node.height*2 + this.$grid.cellH*2
            }
        }

        if (box) {
            this.nodes["selection"].push(box);
        }
        */
        var hWidth = 10, hHeight = 10;
        
        if (node.type != "selection") {
            var handlers, handlerType;
            
            if (node.type != 'line') {
                var top = node.top - hHeight + this.$viewport.offset.y;
                var left = node.left - hWidth + this.$viewport.offset.x;
                var bottom = node.bottom + this.$viewport.offset.y;
                var right = node.right + this.$viewport.offset.x;
                var hCentre = node.left + node.width/2 + this.$viewport.offset.x;
                var vCentre = node.top + node.height/2 + this.$viewport.offset.y;
                
                if (node.type == 'circle') {
                    hCentre += node.width/2;
                    vCentre += node.height/2;
                }
                handlerType = "selection_resize";
                handlers = [
                    {handlerType: "resize", type: handlerType, id: "topleft", width: hWidth, height: hHeight, top: top, left: left, right: left+hWidth, bottom: top+hHeight },
                    {handlerType: "resize", type: handlerType, id: "top", width: hWidth, height: hHeight, top: top, left: hCentre - hWidth/2, right: hCentre + hWidth/2, bottom: top + hHeight }, 
                    {handlerType: "resize", type: handlerType, id: "topright", width: hWidth, height: hHeight, top: top, left: right, right: right+hWidth, bottom: top+hHeight },
                    {handlerType: "resize", type: handlerType, id: "right", width: hWidth, height: hHeight, top: vCentre - hHeight/2, left: right, right: right+hWidth, bottom: vCentre + hHeight/2 }, 
                    {handlerType: "resize", type: handlerType, id: "bottomright", width: hWidth, height: hHeight, top: bottom, left: right, right: right+hWidth, bottom: bottom+hHeight },
                    {handlerType: "resize", type: handlerType, id: "bottom", width: hWidth, height: hHeight, top: bottom, left: hCentre - hWidth/2, right: hCentre + hWidth/2, bottom: bottom + hHeight }, 
                    {handlerType: "resize", type: handlerType, id: "bottomleft", width: hWidth, height: hHeight, top: bottom, left: left, right: left+hWidth, bottom: bottom+hHeight },
                    {handlerType: "resize", type: handlerType, id: "left", width: hWidth, height: hHeight, top: vCentre - hHeight/2, left: left, right: left-hWidth, bottom: vCentre + hHeight/2 }
                ];
            }
            else {
                handlerType = "selection_lineConnect";
                handlers = [
                    {handlerType: "lineConnect", type: handlerType, id: "from", width: hWidth, height: hHeight, top: node.startPoint.y - hHeight/2 + this.$viewport.offset.y, left: node.startPoint.x - hWidth/2 + this.$viewport.offset.x, right: node.startPoint.x+hWidth/2 + this.$viewport.offset.x, bottom: node.startPoint.y+hHeight/2 + this.$viewport.offset.y }, 
                    {handlerType: "lineConnect", type: handlerType, id: "to", width: hWidth, height: hHeight, top: node.endPoint.y - hHeight/2 + this.$viewport.offset.y, left: node.endPoint.x - hWidth/2 + this.$viewport.offset.x, right: node.endPoint.x+hWidth/2 + this.$viewport.offset.x, bottom: node.endPoint.y+hHeight/2 + this.$viewport.offset.y} 
                ];
            }
            
            if (handlers.length) {
                if (!this.nodes[handlerType]) this.nodes[handlerType] = [];
                for (var h = 0, l = handlers.length; h < l; h++) {
                    this.nodes[handlerType].push(handlers[h]);
                }
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
