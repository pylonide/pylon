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

// #ifdef __AMLVECTORFLOW || __INC_ALL

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
    this.nodeIdIndex = 1;

    /**** Public Methods ****/
    

    /**** Databinding Support ****/

    //Here each xml node from the data is rendered
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        var node = {
            id              : this.$applyBindRule("id", xmlNode) || "n" + this.nodeIdIndex++,
            caption         : this.$applyBindRule("caption", xmlNode) || "",
            type            : this.$applyBindRule("type", xmlNode) || "rect",
            x               : parseInt(this.$applyBindRule("left", xmlNode)) || 0,
            y               : parseInt(this.$applyBindRule("top", xmlNode)) || 0,
            top             : parseInt(this.$applyBindRule("top", xmlNode)) || 0,
            left            : parseInt(this.$applyBindRule("left", xmlNode)) || 0,
            width           : parseInt(this.$applyBindRule("width", xmlNode)) || 0,
            height          : parseInt(this.$applyBindRule("height", xmlNode)) || 0,
            fill            : xmlNode.getAttribute("fill")
        };

        // set default line attach positions
        node.lines = {
            top:    {x: node.x, y: node.y - node.height/2},
            left:   {x: node.x - node.width/2, y: node.y},
            right:  {x: node.x + node.width/2, y: node.y},
            bottom: {x: node.x, y: node.y + node.height/2},
        }
        
        if ("line".indexOf(node.type) > -1) {
            node.from       = xmlNode.getAttribute("from");
            node.to         = xmlNode.getAttribute("to");
        }
        else if ("circle|rect|decision".indexOf(node.type) > -1) {
            node.top    -= node.height/2;
            node.left   -= node.width/2;
            node.bottom = node.y + node.height/2;
            node.right  = node.x + node.width/2;
        }
        if ("circle".indexOf(node.type) > -1) {
            node.width /= 2;
            node.height /= 2;
        }
        
        if (this.nodes[node.id]) {
            apf.console.error("block with id " + node.id + " already exists");
            return;
        }
        this.nodes[node.id] = node;
    };
    
    //This function is called to do the final render pass
    this.$fill = function(){
        var err = {};
        this.$style = apf.draw.parseStyle(this.$node_style , "", err );

        apf.draw.initLayer(this.$rootLayer, this);
        this.$drawCode = this.$compile( this.$rootLayer, this.$style );    
        this.$drawCode(this.$rootLayer, this);
        apf.draw.resizeLayer(this.$rootLayer);
    };

    this.$compile = function(l,s){
        var e = apf.draw;

        var c = e.optimize([
            e.beginLayer(l),
            e.vars(),
            e.clear(),
            e.beginShape(s.node),
            "var type;",
            "for (var name in this.nodes) {",
                "type=this.nodes[name].type;",
                "if (type === 'rect') {", 
                    e.rect(
                        "this.nodes[name].left",
                        "this.nodes[name].top",
                        "this.nodes[name].width",
                        "this.nodes[name].height"
                    ),
//e.beginFont(s.label,  0, 0, 0, 0),
//e.text(0, 0, "Label"), 
                "}",
                "else if (type === 'decision') {", 
                    e.moveTo("this.nodes[name].lines.top.x", "this.nodes[name].lines.top.y"),
                    e.lineTo("this.nodes[name].lines.right.x", "this.nodes[name].lines.right.y"),
                    e.lineTo("this.nodes[name].lines.bottom.x", "this.nodes[name].lines.bottom.y"),
                    e.lineTo("this.nodes[name].lines.left.x", "this.nodes[name].lines.left.y"),
                    e.lineTo("this.nodes[name].lines.top.x", "this.nodes[name].lines.top.y"),
                "}",
                "else if (type === 'circle') {", e.ellipse("this.nodes[name].x","this.nodes[name].y","this.nodes[name].width","this.nodes[name].height"), "}",
                "else if (type === 'line') {",
                    "if (this.nodes[name].from && this.nodes[name].to) {",
                        "var fromPos, toPos;",
                        "if (this.nodes[this.nodes[name].from].y == this.nodes[this.nodes[name].to].y) {",
                            "if (this.nodes[this.nodes[name].from].right < this.nodes[this.nodes[name].to].left) {",
                                "fromPos = 'right';", 
                                "toPos = 'left';",
                            "}",
                            "else {",
                                "fromPos = 'left';", 
                                "toPos = 'right';",
                            "}",
                        "}",
                        "else if (this.nodes[this.nodes[name].from].x == this.nodes[this.nodes[name].to].x) {",
                            "if (this.nodes[this.nodes[name].from].bottom > this.nodes[this.nodes[name].to].top) {",
                                "fromPos = 'top';", 
                                "toPos = 'bottom';",
                            "}",
                            "else {",
                                "fromPos = 'bottom';", 
                                "toPos = 'top';",
                            "}",
                        "}",

                        "else if (this.nodes[this.nodes[name].from].right < this.nodes[this.nodes[name].to].left) {",
                            "fromPos = 'right';", 
                            "toPos = 'left';",
                        "}",
                        "else if (this.nodes[this.nodes[name].from].left > this.nodes[this.nodes[name].to].right) {",
                            "fromPos = 'left';", 
                            "toPos = 'right';",
                        "}",
                        "else {",
                            "if (this.nodes[this.nodes[name].from].bottom > this.nodes[this.nodes[name].to].top) {",
                                "fromPos = 'top';", 
                                "toPos = 'bottom';",
                            "}",
                            "else {",
                                "fromPos = 'bottom';", 
                                "toPos = 'top';",
                            "}",
                        "}",
                        e.moveTo(
                            "this.nodes[this.nodes[name].from].lines[fromPos].x",
                            "this.nodes[this.nodes[name].from].lines[fromPos].y"
                        ),
                        e.lineTo(
                            "this.nodes[this.nodes[name].to].lines[toPos].x",
                            "this.nodes[this.nodes[name].to].lines[toPos].y"
                        ),
                    "}",
                "}",
                e.close(),
            "}",
            e.endLayer()
        ].join(''));

        try{
            return new Function('l','v','m',c);
        }catch(x){
            alert("Failed to compile:\n"+c);return 0;
        }
    }
    
    this.$createShape = function(l, e) {
        if (l.type == "line") {
            return [
                
            ].join('');
        }
        else if (l.type == "rect") {
            return [
                e.rect(0,0,l.width,l.height)
            ].join('');
        }
        else if ("decision|conditional".indexOf(l.type) > -1) {
            var top = 0, left = 0, 
            bottom = top + l.height, right = left + l.width, 
            hCenter = left + l.width/2, vCenter = top + l.height/2;
            return [
                e.moveTo(hCenter, top),
                e.lineTo(right, vCenter),
                e.lineTo(hCenter, bottom),
                e.lineTo(left, vCenter),
                e.lineTo(hCenter, top),
            ].join('');
        }
    }
    
    // draw block
    this.$drawShape = function(l){
        l.err = {};
        l.style = apf.draw.parseStyle(this.$node_style , "", l.err );;
        apf.draw.initLayer( l, this );
        
        this.$drawCode = this.$compile( l, l.style);    
        this.$drawCode(l, this);
        apf.draw.resizeLayer(l);
    }
    
    
    //This is called to unrender a node
    this.$deInitNode = function(xmlNode, htmlNode){
        
    };
    
    //This is called to move a nove within this element (position)
    this.$moveNode = function(xmlNode, htmlNode){
        
    };
    
    //This is called to update the representation of a node (position, caption, connections, etc)
    this.$updateNode = function(xmlNode, htmlNode){
        //This is how to apply a bindrule on a data node
        //this.$applyBindRule("caption", xmlNode)
        
    };
    
    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;

        if (!selHtml || this.renaming) 
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$ext;

        switch (key) {
            case 13: //Enter
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.ctrlselect == "enter")
                    this.select(this.caret, true);
            
                this.choose(selHtml);
                break;
            case 32: //Spatie
                if (this.$tempsel)
                    this.$selectTemp();

                if (this.$mode && !ctrlKey) {
                    var sel = this.getSelection();
                    if (!sel.length || !this.multiselect)
                        this.checkToggle(this.caret);
                    else
                        this.checkList(sel, this.isChecked(this.selected), true);
                }
                else if (ctrlKey || !this.isSelected(this.caret))
                    this.select(this.caret, true);
                return false;
            case 46: //DEL
                if (this.$tempsel)
                    this.$selectTemp();
            
                //DELETE
                //this.remove();
                this.remove(this.caret); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.$setTempSelected (this.getFirstTraverseNode(), false, shiftKey);
                oExt.scrollTop = 0;
                return false;
            case 35:
                //END
                var lastNode = this.getLastTraverseNode();
                while (!this.isCollapsed(lastNode))
                    lastNode = this.getLastTraverseNode(lastNode);
                
                this.$setTempSelected (lastNode, false, shiftKey);    
                oExt.scrollTop = oExt.scrollHeight;
                return false;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.caret.selectSingleNode(this.each) 
                  && !this.isCollapsed(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 2)
                else if (pNode = this.getTraverseParent(this.caret))
                    this.select(pNode)
                return false;
            case 107: //+
            case 187: //+
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.$hasLoadStatus(this.caret, "potential") 
                  || this.getFirstTraverseNode(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 1)
                break;
            case 109:
            case 189:
                //-
                if (this.getFirstTraverseNode(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 2)
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return;
                
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    nodes = this.getTraverseNodes(sNode);
                    
                    do {
                        container = this.$getLayoutNode("item", "container",
                            this.$findHtmlNode(apf.xmldb.getID(sNode, this)));
                        if (container && apf.getStyle(container, "display") == "block" 
                          && nodes.length) {
                                sNode = nodes[nodes.length-1];
                        }
                        else {
                            break;
                        }
                    }
                    while (sNode && (nodes = this.getTraverseNodes(sNode)).length);
                }
                else if (this.getTraverseParent(node) == this.xmlRoot) {
                    this.dispatchEvent("selecttop");
                    return;
                }
                else
                    sNode = this.getTraverseParent(node);

                if (sNode && sNode.nodeType == 1)
                   this.$setTempSelected (sNode, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                     - (selHtml.offsetHeight/2);
                if (top <= oExt.scrollTop)
                    oExt.scrollTop = top;
                
                return false;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;

                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;
                
                sNode = this.getFirstTraverseNode(node);
                if (sNode) {
                    container = this.$getLayoutNode("item", "container",
                        this.$findHtmlNode(apf.xmldb.getID(node, this)));
                    if (container && apf.getStyle(container, "display") != "block")
                        sNode = null;
                }
                
                while (!sNode) {
                    pNode = this.getTraverseParent(node);
                    if (!pNode) break;
                    
                    var i = 0;
                    nodes = this.getTraverseNodes(pNode);
                    while (nodes[i] && nodes[i] != node)
                        i++;
                    sNode = nodes[i+1];
                    node  = pNode;
                }

                if (sNode && sNode.nodeType == 1)
                   this.$setTempSelected (sNode, ctrlKey, shiftKey);
                else
                    return false;
                    
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                    + (selHtml.offsetHeight/2);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                
                return false;
            case 33: //@todo
                //PGUP
                pos   = apf.getAbsolutePosition(this.$int);
                el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                      - 2, pos[1] + 2);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop -= oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                          - 2, pos[1] + 2);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                     - (selHtml.offsetHeight / 2);
                if (top <= oExt.scrollTop)
                    oExt.scrollTop = top;
                break;
            case 34: //@todo
                //PGDN
                pos   = apf.getAbsolutePosition(this.$int);
                el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                      - 2, pos[1] + this.$ext.offsetHeight - 4);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop += oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                          - 2, pos[1] + this.$ext.offsetHeight - 4);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                    + (selHtml.offsetHeight/2);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                break;
            default:
                if (key == 65 && ctrlKey)
                    this.selectAll();
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
        node : {
            inherit:'shape',
            fill:'white',
            stroke:'black',
        $:1},
        label : {
            inherit : 'font', 
            width: 40,
            top : 5,
            left: 0,
            side: 0, 
            axis: 0, 
            edgeclip : 2,
            align:'center',
        $:1},
    },
    this.$rootLayer = {
        type: "rect",
        left: 0,
        top: 0,
        width: 800,
        height: 800,
        fill: "yellow"
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
    };
    
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
