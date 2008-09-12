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
// #ifdef __JWORKFLOW || __INC_ALL
// #define __JBASELIST 1

/**
 * Component displaying an area containing elements which can be freely
 * placed and moved in the two dimensional plane. Individual elements
 * can be locked, resized, their z-indexes can be changed. Elements could be 
 * connected by lines. This component allows for alignment of multiple elements.
 *
 * @classDescription        This class creates a new workarea
 * @return {workflow}       Returns a new workflow
 * @type {workflow}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:workarea
 *
 * @author      Łukasz Lipiński
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.workflow = function(pHtmlNode){
    jpf.register(this, "workflow", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    this.objCanvas       = null;
    var connectors       = {};
    var xmlBlocks        = {};
    var blockId          = {};
    var translateBlockId = {};
    
    this.template = null;
    
    var resize;
    var input;
    var _self = this;
    
    //Code for before move
    //if(resize) resize.hide();
    
    //Code for after move
    //if(resize) resize.show();
    
    
    /* ***********************
     RENAME
     ************************/
    this.__getCaptionElement = function(){
        var x = this.__getLayoutNode("Item", "caption", this.__selected);
        return x.nodeType == 1 ? x : x.parentNode;
    }
    
    this.addEventListener("onafterselect", function(e){
        if (this.hasFeature(__VALIDATION__)) 
            this.validate();
    });
    
    /* ***********************
     Other Inheritance
     ************************/
    this.inherit(jpf.BaseList); /** @inherits jpf.BaseList */
    this.__select = function(o){
        if (!o || !o.style) {
            return;
        }
        else {
            return this.__setStyleClass(o, "selected");
        }
        
    }
    
    this.__deselect = function(o){
        if (!o) {
            return;
        }
        else {
            return this.__setStyleClass(o, "", ["selected", "indicate"]);
        }
        
    }
    
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.selected) 
            return;
        var value = (ctrlKey ? 10 : (shiftKey ? 100 : 1));
        
        switch (key) {
            case 37:
                this.MoveTo(this.selected, parseInt(this.applyRuleSetOnNode("left", this.selected)) - value, this.applyRuleSetOnNode("top", this.selected));
                return false;
            case 38:
                this.MoveTo(this.selected, this.applyRuleSetOnNode("left", this.selected), parseInt(this.applyRuleSetOnNode("top", this.selected)) - value);
                return false;
            case 39:
                this.MoveTo(this.selected, parseInt(this.applyRuleSetOnNode("left", this.selected)) + value, this.applyRuleSetOnNode("top", this.selected));
                return false;
            case 40:
                this.MoveTo(this.selected, this.applyRuleSetOnNode("left", this.selected), parseInt(this.applyRuleSetOnNode("top", this.selected)) + value);
                return false;
                
            case 46:
                //DELETE
                if (_self.objCanvas.disableremove) 
                    return;
                
                switch (_self.objCanvas.mode) {
                    case "normal":
                        resize.hide();
                        _self.remove(null, true);
                        break;
                        
                    case "connection-change":
                        var connectionsToDelete = [];
                        
                        for (var id in _self.objCanvas.htmlConnectors) {
                            if (_self.objCanvas.htmlConnectors[id].todelete) {
                                connectionsToDelete.push(_self.objCanvas.htmlConnectors[id].other.xmlNode);
                            }
                        }
                        
                        _self.removeConnector(connectionsToDelete);
                        _self.objCanvas.mode = "normal";
                        break;
                }
                
                break;
        }
    }
    
    /*this.inherit(jpf.Rename); */
    /** @inherits jpf.Rename */
    
    /* ***********************
     DRAGDROP
     ************************/
    this.addEventListener("onafterselect", function(){
        if (this.__selected) {            
            var objBlock = jpf.flow.isBlock(this.__selected);
            var scales = {
                scalex: objBlock.other.scalex,
                scaley: objBlock.other.scaley,
                scaleratio: objBlock.other.scaleratio,
                dwidth: objBlock.other.dwidth,
                dheight: objBlock.other.dheight
            }
        }
        
        if (objBlock) {
            if (resize && objBlock.other.lock == 0) {
                resize.grab(this.__selected, scales);
            }
        }
    });
    
    
    this.addEventListener("onafterdeselect", function(){
        if (resize) 
            resize.hide();
    });
    
    this.__showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;
        
        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.__selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.__selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.__updateNode(this.selected, this.oDrag, true);
        
        return this.oDrag;
    }
    
    this.__hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.__moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top = (e.clientY - this.oDrag.startY) + "px";
    }
    
    this.__initDragDrop = function(){
        if (!this.__hasLayoutNode("DragIndicator")) 
            return;
        this.oDrag = jpf.xmldb.htmlImport(this.__getLayoutNode("DragIndicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    }
    
    this.__dragout = function(el, dragdata){
        var htmlNode = jpf.xmldb.findHTMLNode(dragdata.data, this);
        if (htmlNode) 
            htmlNode.style.display = "block";
    }
    this.__dragover = function(el, dragdata, candrop){
        var htmlNode = jpf.xmldb.findHTMLNode(dragdata.data, this);
        if (htmlNode) {
            htmlNode.style.display = candrop[0] && jpf.xmldb.isChildOf(this.XMLRoot, candrop[0], true) ? "none" : "block";
        }
    }
    this.__dragstart = function(el, dragdata){
        var htmlNode = jpf.xmldb.findHTMLNode(dragdata.data, this);
        if (htmlNode) 
            htmlNode.style.display = "none";
    }
    this.__dragdrop = function(el, dragdata, candrop){
        //if(!dragdata.resultNode.        
    }
    
    this.addEventListener("ondragstart", function(e){
        return this.applyRuleSetOnNode("move", e.data) ? true : false;
    });
    
    this.addEventListener("ondragdrop", function(e){
        if (e.candrop && e.host == this) {
            var pos = jpf.getAbsolutePosition(this.oInt, null, true);
            this.MoveTo(e.data, (e.x - pos[0] - e.indicator.startX), (e.y - pos[1] - e.indicator.startY));
            
            return false;
        }
    });
    
    this.MoveTo = function(xmlNode, x, y){
        //Use Action Tracker        
        
        var lnode = this.getNodeFromRule("left", xmlNode, null, null, true);
        var tnode = this.getNodeFromRule("top", xmlNode, null, null, true);
        
        var attrs = {};
        attrs[lnode.nodeName] = x;
        attrs[tnode.nodeName] = y;
        //alert(lnode.nodeName+" "+tnode.nodeName+" "+x+" "+y)
        
        var exec = this.executeAction("setAttributes", [xmlNode, attrs], "moveto", xmlNode);
        if (exec !== false) 
            return xmlNode;
        
        this.dispatchEvent("onmoveitem", {
            xmlNode: xmlNode,
            x: x,
            y: y
        });
    }
    
    this.SetZindex = function(xmlNode, value){
        var node = this.getNodeFromRule("zindex", xmlNode, null, null, true);
        if (!node) 
            return;
        
        var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
        var args = node.nodeType == 1 ? [node, value] : (node.nodeType == 3 || node.nodeType == 4 ? [node.parentNode, value] : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
        
        //Use Action Tracker
        this.executeAction(atAction, args, "setzindex", xmlNode);
    }
    
    this.inherit(jpf.DragDrop); /** @inherits jpf.DragDrop */
    this.flipV = function(xmlNode, newFlipV){
        var prevFlipV  = this.applyRuleSetOnNode("flipv", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("flipv", xmlNode)) 
            : 0;//delete
        var prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("fliph", xmlNode)) 
            : 0;
        var prevRotate = this.applyRuleSetOnNode("rotation", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode)) 
            : 0;
        
        var props = [];
        var changes = [];
        
        if (prevFlipH == 1 && newFlipV == 1) {
            props.push(["fliph", 0], ["flipv", 0], ["rotation", (prevRotate + 180) % 360]);
        }
        else {
            props.push(["fliph", prevFlipH], ["flipv", newFlipV], ["rotation", prevRotate]);
        }
        
        for (var i = 0; i < props.length; i++) {
            var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
            var value = props[i][1];
            
            if (node) {
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
                var args = node.nodeType == 1 ? [node, value] : (node.nodeType == 3 || node.nodeType == 4 ? [node.parentNode, value] : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                changes.push({
                    func: atAction,
                    args: args
                });
            }
        }
        
        //Use Action Tracker
        this.executeAction("multicall", changes, "flipv", xmlNode);
    }
    
    
    this.flipH = function(xmlNode, newFlipH){
        var prevFlipV  = this.applyRuleSetOnNode("flipv", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("flipv", xmlNode)) 
            : 0;//delete
        var prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("fliph", xmlNode)) 
            : 0;
        var prevRotate = this.applyRuleSetOnNode("rotation", xmlNode) 
            ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode)) 
            : 0;
        
        var props = [];
        var changes = [];
        
        if (prevFlipV == 1 && newFlipH == 1) {
            props.push(["fliph", 0], ["flipv", 0], ["rotation", (prevRotate + 180) % 360]);
        }
        else {
            props.push(["fliph", newFlipH], ["flipv", prevFlipV], ["rotation", prevRotate]);
        }
        
        for (var i = 0; i < props.length; i++) {
            var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
            var value = props[i][1];
            
            if (node) {
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
                var args = node.nodeType == 1 
                    ? [node, value] 
                    : (node.nodeType == 3 || node.nodeType == 4 
                        ? [node.parentNode, value] 
                        : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                changes.push({
                    func: atAction,
                    args: args
                });
            }
        }
        
        //Use Action Tracker
        this.executeAction("multicall", changes, "fliph", xmlNode);
    }
    
    
    this.rotate = function(xmlNode, newRotation, start){
    
        var prevFlipV    = parseInt(this.applyRuleSetOnNode("flipv", xmlNode)) || 0;
        var prevFlipH    = parseInt(this.applyRuleSetOnNode("fliph", xmlNode)) || 0;
        var prevRotation = start ? 0 : parseInt(this.applyRuleSetOnNode("rotation", xmlNode)) || 0;
        
        var props   = [];
        var changes = [];
        
        if (prevFlipV == 1 && prevFlipH == 1) {
            props.push(["fliph", 0], ["flipv", 0], ["rotation", (newRotation + 180) % 360]);
        }
        else {
            props.push(["fliph", prevFlipH], ["flipv", prevFlipV], ["rotation", newRotation]);
            
            if (Math.abs(newRotation - prevRotation) % 180 !== 0) {
                var width = parseInt(this.applyRuleSetOnNode("width", xmlNode)) || 0;
                var height = parseInt(this.applyRuleSetOnNode("height", xmlNode)) || 0;
                
                props.push(["width", height], ["height", width]);
            }
        }
        
        
        for (var i = 0; i < props.length; i++) {
            var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
            var value = props[i][1];
            
            if (node) {
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
                var args = node.nodeType == 1 ? [node, value] : (node.nodeType == 3 || node.nodeType == 4 ? [node.parentNode, value] : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                changes.push({
                    func: atAction,
                    args: args
                });
            }
        }
        
        //Use Action Tracker
        this.executeAction("multicall", changes, "rotation", xmlNode);
    }
    
    
    this.resize = function(xmlNode, newWidth, newHeight, newLeft, newTop){
        var lock = parseInt(this.applyRuleSetOnNode("lock", xmlNode)) || 0;
        if (lock == 0) {
            var props = [];
            var changes = [];
            
            props.push(["top", newTop], ["left", newLeft], ["width", newWidth], ["height", newHeight]);
            
            for (var i = 0; i < props.length; i++) {
                var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
                var value = props[i][1];
                
                if (node) {
                    var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4 ? "setTextNode" : "setAttribute";
                    var args = node.nodeType == 1 
                        ? [node, value] 
                        : (node.nodeType == 3 || node.nodeType == 4 
                            ? [node.parentNode, value] 
                            : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                    changes.push({
                        func: atAction,
                        args: args
                    });
                }
            }
            
            this.executeAction("multicall", changes, "resize", xmlNode);
        }
    }
    
    this.addConnector = function(sourceXmlNode, source_input, destinationXmlNode, destination_input){
    
        var cXmlNode = _self.XMLRoot.ownerDocument.createElement("connection");
        
        cXmlNode.setAttribute("ref", _self.applyRuleSetOnNode("id", destinationXmlNode));
        cXmlNode.setAttribute("output", source_input);
        cXmlNode.setAttribute("input", destination_input);
        
        this.executeAction("appendChild", [sourceXmlNode, cXmlNode], "addConnector", sourceXmlNode);
    }
    
    
    this.removeConnector = function(xmlNodeArray){
        var changes = [];
        
        for (var i = 0; i < xmlNodeArray.length; i++) {
            changes.push({
                func: "removeNode",
                args: [xmlNodeArray[i]]
            });
        }
        
        this.executeAction("multicall", changes, "removeConnectors", xmlNodeArray[0]);
    }
    
    /* *********
     Item creation
     **********/
    this.__updateModifier = function(xmlNode, htmlNode){
        //alert("update");            
        
        htmlNode.style.left = (this.applyRuleSetOnNode("left", xmlNode) || 10) + "px";
        htmlNode.style.top  = (this.applyRuleSetOnNode("top", xmlNode) || 10) + "px";
        
        htmlNode.style.width  = (this.applyRuleSetOnNode("width", xmlNode) || 100) + "px";
        htmlNode.style.height = (this.applyRuleSetOnNode("height", xmlNode) || 100) + "px";
        
        var objBlock = jpf.flow.isBlock(htmlNode);
        objBlock.draggable  = this.applyRuleSetOnNode("move", xmlNode) ? true : false;
        objBlock.xmlNode    = xmlNode;
        objBlock.other.lock = parseInt(this.applyRuleSetOnNode("lock", xmlNode)) || 0;
        
        if (this.applyRuleSetOnNode("type", xmlNode)) {
            objBlock.changeRotation(this.applyRuleSetOnNode("rotation", xmlNode), 
                this.applyRuleSetOnNode("fliph", xmlNode),
                this.applyRuleSetOnNode("flipv", xmlNode));
        }
        
        if (resize && htmlNode == this.selected && objBlock.other.lock == 0) {
            resize.show();
        }
        else {
            resize.hide();
        }
        
        objBlock.onMove();
        
        var zindex = parseInt(this.applyRuleSetOnNode("zindex", xmlNode));
        var curzindex = parseInt(jpf.getStyle(htmlNode, jpf.descPropJs ? "zIndex" : "z-index")) || 1;
        if (curzindex != zindex) {
            var nodes = this.getTraverseNodes();
            for (var res = [], i = 0; i < nodes.length; i++) {
                if (nodes[i] == xmlNode) 
                    continue;
                res[nodes[i].getAttribute("zindex")] = nodes[i];
            }
            res[curzindex] = xmlNode;
            
            if (curzindex < zindex) {
                for (var k = curzindex; k < zindex; k++) {
                    if (!res[k + 1]) 
                        continue;
                    res[k + 1].setAttribute("zindex", k);
                    jpf.xmldb.findHTMLNode(res[k + 1], this).style.zIndex = k;
                }
            }
            else {
                for (var k = zindex; k < curzindex; k++) {
                    if (!res[k]) 
                        continue;
                    res[k].setAttribute("zindex", k + 1);
                    jpf.xmldb.findHTMLNode(res[k], this).style.zIndex = k + 1;
                }
            }
            
            htmlNode.style.zIndex = zindex;
        }
        
        var xpath    = this.getSelectFromRule("connection", xmlNode)[0];
        var cNew     = xmlNode.selectNodes(xpath);
        var cCurrent = connectors[this.applyRuleSetOnNode("id", xmlNode)];
        
        //jpf.alert_r(cCurrent);
        //jpf.alert_r(cNew);
        
        //Check Removing
        if (cCurrent) {
            for (var i = 0; i < cCurrent.length; i++) {
                var found = false
                for (j = 0; j < cNew.length; j++) {
                    if ((cCurrent[i].ref == this.applyRuleSetOnNode("ref", cNew[j])) &&
                    (cCurrent[i].output == this.applyRuleSetOnNode("output", cNew[j])) &&
                    (cCurrent[i].input == this.applyRuleSetOnNode("input", cNew[j])) &&
                    (cCurrent[i].xmlNode == cNew[j])) {
                        found = true;
                        break;
                    }
                }
                
                //If this item doesn't exist, we remove the connection
                if (!found) {
                    //alert("Connection not found, removing...")
                    if (blockId[this.applyRuleSetOnNode("id", xmlNode)] && blockId[cCurrent[i].ref]) {
                    
                        var ConToDel = blockId[this.applyRuleSetOnNode("id", xmlNode)].getConnection(blockId[cCurrent[i].ref].htmlElement, cCurrent[i].output, cCurrent[i].input);
                        jpf.flow.removeConnector(ConToDel.htmlElement);
                        cCurrent.removeIndex(i);
                    }
                }
            }
        }
        
        //Check Adding            
        for (var i = 0; i < cNew.length; i++) {
            var found = false;
            for (j = 0; j < cCurrent.length; j++) {
                if ((cCurrent[j].ref == this.applyRuleSetOnNode("ref", cNew[i])) &&
                (cCurrent[j].output == this.applyRuleSetOnNode("output", cNew[i])) &&
                (cCurrent[j].input == this.applyRuleSetOnNode("input", cNew[i])) &&
                (cCurrent[j].xmlNode == cNew[i])) {
                    found = true;
                    break;
                }
            }
            
            //If this item doesn't exist, we add the connection
            if (!found) {
                var ref = this.applyRuleSetOnNode("ref", cNew[i]);
                var output = this.applyRuleSetOnNode("output", cNew[i]);
                var input = this.applyRuleSetOnNode("input", cNew[i]);
                
                if (!blockId[ref]) {
                    //return alert("Here should go code to create some queuing to fix the async creating of blocks/connections");
                }
                
                var r = connectors[this.applyRuleSetOnNode("id", xmlNode)];
                //if(!r) var r = connectors[this.applyRuleSetOnNode("id", xmlNode)] = [];            
                
                r.push({
                    ref    : ref,
                    output : output,
                    input  : input,
                    xmlNode: cNew[i]
                });
                
                new jpf.flow.addConnector(_self.objCanvas, blockId[this.applyRuleSetOnNode("id", xmlNode)], blockId[ref], {
                    output : output,
                    input  : input,
                    xmlNode: cNew[i]
                });
            }
        }
        
        
    }
    
    this.findSourceBlocks = function(DestinationXmlID){
        var sources = [];
        for (var id in connectors) {
            if (connectors[id] == DestinationXmlID) {
                sources.push(id);
            }
        }
        return sources;
    }
    
    this.__deInitNode = function(xmlNode, htmlNode){
        if (!htmlNode) 
            return;
        
        jpf.flow.removeBlock(htmlNode);
        var id = this.applyRuleSetOnNode("id", xmlNode);
        
        if (xmlBlocks[id]) {
            delete xmlBlocks[id];
            delete connectors[id];
            /* maybe delete it in this function ? */
            var sourceXmlIds = this.findSourceBlocks(id);
            for (var i = 0; i < sourceXmlIds.length; i++) {
                delete connectors[sourceXmlIds[i]];
            }
            
            delete blockId[id];
        }
        
        //Remove htmlNodes from tree
        //htmlNode.parentNode.removeChild(htmlNode);
        
        
        this.selected = null;
    }
    
    
    this.__addModifier = function(xmlNode, htmlNode){
    
    }
    
    this.nodes = [];
    
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //alert("add");
        //Build Row        
        this.__getNewContext("Block");
        var Item = this.__getLayoutNode("Block");
        
        var elSelect   = this.__getLayoutNode("Block", "select");
        var elIcon     = this.__getLayoutNode("Block", "icon");
        var elImage    = this.__getLayoutNode("Block", "image");
        var elCheckbox = this.__getLayoutNode("Block", "checkbox");
        var elCaption  = this.__getLayoutNode("Block", "caption");
        
        Item.setAttribute("id", Lid);
        
        var htmlImage = this.__getLayoutNode("Block", "image");
        htmlImage.setAttribute("id", "i" + Lid);
        
        if (this.applyRuleSetOnNode("type", xmlNode) !== " ") {
            htmlImage.setAttribute("src", "elements/" + this.applyRuleSetOnNode("type", xmlNode) + ".png");
        }
        else {
            Item.setAttribute("class", "block empty");
        }
        
        //elSelect.setAttribute("oncontextmenu", 'jpf.lookup(' + this.uniqueId + ').dispatchEvent("oncontextmenu", event);');
        
        elSelect.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId + ').__setStyleClass(this, "hover");');
        elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId + ').__setStyleClass(this, "", ["hover"]);');
        
        if (this.hasFeature(__RENAME__)) {
            elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + '); ' +
            'o.cancelRename();' +
            ' o.choose()');
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');if(!o.renaming && o.isFocussed() && jpf.xmldb.isChildOf(o.selected, this, true) && o.value) this.dorename = true;o.select(this, event.ctrlKey, event.shiftKey)');
            elSelect.setAttribute("onmouseup", 'if(this.dorename) jpf.lookup(' + this.uniqueId + ').startDelayedRename(event); this.dorename = false;');
        }
        else {
            elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + '); o.choose()');
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown", 'var o = jpf.lookup(' + this.uniqueId + '); o.select(this, event.ctrlKey, event.shiftKey)');
        }
        
        //Setup Nodes Identity (Look)
        
        if (elIcon) {
            if (elIcon.nodeType == 1) 
                elIcon.setAttribute("style", "background-image:url(" + this.iconPath + this.applyRuleSetOnNode("icon", xmlNode) + ")");
            else 
                elIcon.nodeValue = this.iconPath + this.applyRuleSetOnNode("icon", xmlNode);
        }
        else if (elImage) {
            if (elImage.nodeType == 1) 
                elImage.setAttribute("style", "background-image:url(" + this.mediaPath + this.applyRuleSetOnNode("image", xmlNode) + ")");
            else {
                if (jpf.isSafariOld) { //HAAAAACCCCKKKKKK!!! this should be changed... blrgh..
                    var p = elImage.ownerElement.parentNode;
                    var img = p.appendChild(p.ownerDocument.createElement("img"));
                    img.setAttribute("src", this.mediaPath + this.applyRuleSetOnNode("image", xmlNode));
                }
                else {
                    elImage.nodeValue = this.mediaPath + this.applyRuleSetOnNode("image", xmlNode);
                }
            }
        }
        
        if (elCaption) {
            jpf.xmldb.setNodeValue(elCaption, this.applyRuleSetOnNode("caption", xmlNode));
        }
        
        Item.setAttribute("tooltip", this.applyRuleSetOnNode("tooltip", xmlNode) || "");
        
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.__setStyleClass(Item, cssClass);
            if (cssClass) 
                this.dynCssClasses.push(cssClass);
        }
        
        this.nodes.push(Item);
        
        var x, y;
        if (jpf.DragServer.dragdata) {
            var pos = jpf.getAbsolutePosition(this.oInt, null, true);
            if (!xmlNode.getAttribute("left")) 
                xmlNode.setAttribute("left", (jpf.DragServer.dragdata.x - pos[0] - jpf.DragServer.dragdata.indicator.startX));
            if (!xmlNode.getAttribute("top")) 
                xmlNode.setAttribute("top", (jpf.DragServer.dragdata.y - pos[1] - jpf.DragServer.dragdata.indicator.startY));
        }
        
        var style = [];
        style.push("left:" + (this.applyRuleSetOnNode("left", xmlNode) || 10) + "px");
        style.push("top:" + (this.applyRuleSetOnNode("top", xmlNode) || 10) + "px");
        style.push("width:" + (this.applyRuleSetOnNode("width", xmlNode) || 100) + "px");
        style.push("height:" + (this.applyRuleSetOnNode("height", xmlNode) || 100) + "px");
        style.push("z-index:" + (this.applyRuleSetOnNode("zindex", xmlNode) || this.oExt.childNodes.length + 1));
        
        Item.setAttribute("style", style.join(";"));
        
        xmlBlocks[this.applyRuleSetOnNode("id", xmlNode)] = xmlNode;
        
        var r = [];
        var xpath = this.getSelectFromRule("connection", xmlNode)[0];
        var connections = xmlNode.selectNodes(xpath);
        
        if (connections) {
            for (var i = 0; i < connections.length; i++) {
                r.push({
                    ref    : this.applyRuleSetOnNode("ref", connections[i]),
                    output : this.applyRuleSetOnNode("output", connections[i]),
                    input  : this.applyRuleSetOnNode("input", connections[i]),
                    xmlNode: connections[i]
                });
            }
            connectors[this.applyRuleSetOnNode("id", xmlNode)] = r;
        }
        
        
    }
    
    
    this.__fill = function(){
        //alert("fill");
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
        
        for (var id in xmlBlocks) {
        
            var htmlElement = jpf.xmldb.findHTMLNode(xmlBlocks[id], this);
            
            if (!jpf.flow.isBlock(htmlElement)) {
                var inputList = [];
                
                if (xmlBlocks[id].getAttribute("type")) {
                    if (this.template) {
                        var elTemplate = this.template.selectSingleNode("//element[@type='" + this.applyRuleSetOnNode("template", xmlBlocks[id]) + "']");
                        
                        var picture    = this.applyRuleSetOnNode("picture", elTemplate);
                        var dwidth     = this.applyRuleSetOnNode("dwidth", elTemplate);
                        var dheight    = this.applyRuleSetOnNode("dheight", elTemplate);
                        var scalex     = this.applyRuleSetOnNode("scalex", elTemplate);
                        var scaley     = this.applyRuleSetOnNode("scaley", elTemplate);
                        var scaleratio = this.applyRuleSetOnNode("scaleratio", elTemplate);
                        //alert(scalex+" "+scaley+" "+scaleratio);                        
                        var inputs = elTemplate.selectNodes("input");
                        
                        for (var i = 0; i < inputs.length; i++) {
                            inputList.push({
                                x       : this.applyRuleSetOnNode("x", inputs[i]),
                                y       : this.applyRuleSetOnNode("y", inputs[i]),
                                position: this.applyRuleSetOnNode("position", inputs[i]),
                                name    : this.applyRuleSetOnNode("name", inputs[i])
                            });
                        }
                    }
                }
                
                var other = {
                    lock      : this.applyRuleSetOnNode("lock", xmlBlocks[id]) ? this.applyRuleSetOnNode("lock", xmlBlocks[id]) : 0,
                    flipv     : this.applyRuleSetOnNode("flipv", xmlBlocks[id]) ? this.applyRuleSetOnNode("flipv", xmlBlocks[id]) : 0,
                    fliph     : this.applyRuleSetOnNode("fliph", xmlBlocks[id]) ? this.applyRuleSetOnNode("fliph", xmlBlocks[id]) : 0,
                    rotation  : this.applyRuleSetOnNode("rotation", xmlBlocks[id]) ? this.applyRuleSetOnNode("rotation", xmlBlocks[id]) : 0,
                    inputList : inputList,
                    type      : this.applyRuleSetOnNode("type", xmlBlocks[id]),
                    picture   : picture,
                    dwidth    : dwidth,
                    dheight   : dheight,
                    scalex    : scalex,
                    scaley    : scaley,
                    scaleratio: scaleratio
                }
                
                var objBlock = jpf.flow.addBlock(htmlElement, _self.objCanvas, other);
                objBlock.draggable = this.applyRuleSetOnNode("move", xmlBlocks[id]) ? true : false;
                objBlock.xmlNode   = xmlBlocks[id];
                
                objBlock.oncreateconnection = function(sourceXmlNode, source_input, destinationXmlNode, destination_input){
                    _self.addConnector(sourceXmlNode, source_input, destinationXmlNode, destination_input);
                }
                
                objBlock.onremoveconnection = function(sourceXmlNode, source_input, destinationXmlNode, destination_input){
                    _self.removeConnector(sourceXmlNode, source_input, destinationXmlNode, destination_input);
                }
                
                
                for (var i = 0; i < htmlElement.childNodes.length; i++) {
                    if (htmlElement.childNodes[i].nodeName.toLowerCase() == "img") {
                        objBlock.image = htmlElement.childNodes[i];
                        
                        if (jpf.isIE) {
                            objBlock.image.height = htmlElement.childNodes[i].offsetHeight;
                            objBlock.image.width = htmlElement.childNodes[i].offsetWidth;
                        }
                        
                        break;
                    }
                }
                //this.rotate(xmlBlocks[id], other.rotation, true);    
                objBlock.changeRotation(other.rotation, other.fliph, other.flipv);
                
                blockId[xmlBlocks[id].getAttribute("id")] = objBlock;
                translateBlockId[htmlElement.getAttribute("id")] = id;
            }
        }
        
        for (var id in xmlBlocks) {
            if (connectors[id]) {
            
                var c = connectors[id];
                
                for (var i = 0; i < c.length; i++) {
                    var Con = blockId[id].getConnection(blockId[c[i].ref].htmlElement, c[i].output, c[i].input);
                    
                    if (!Con) {
                        new jpf.flow.addConnector(_self.objCanvas, blockId[id], blockId[c[i].ref], {
                            output : c[i].output,
                            input  : c[i].input,
                            xmlNode: c[i].xmlNode
                        });
                    }
                }
            }
        }
        
        this.nodes = [];
    }
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
    
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        
        /*this.oExt.onmousedown = function(e){
         if(!e) e = event;
         if(e.ctrlKey || e.shiftKey) return;
         
         var srcElement = IS_IE ? e.srcElement : e.target;
         debugger;
         if(this.host.allowDeselect && (srcElement == this || srcElement.getAttribute(jpf.xmldb.htmlIdTag)))
         this.host.clearSelection(); //hacky
         }*/
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("onclick", {
                htmlEvent: e || event
            });
        }
        
        //Get Options form skin
        this.listtype = parseInt(this.__getLayoutNode("Main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        this.behaviour = parseInt(this.__getLayoutNode("Main", "behaviour")) || 1; //Types: 1=Check on click, 2=Check independent
        jpf.flow.init();
        
        jpf.flow.onbeforemove = function(){
            resize.hide();
        }
        
        
        _self.objCanvas = new jpf.flow.getCanvas(this.oInt);
        
        var jmlNode = this;
        
        _self.objCanvas.onblockmove = function(htmlBlock){
            var xmlNode = jmlNode.XMLRoot.selectSingleNode("//block[@id='" + translateBlockId[htmlBlock.id] + "']");
            jmlNode.MoveTo(xmlNode, parseInt(htmlBlock.style.left), parseInt(htmlBlock.style.top));
            //jmlNode.MoveTo(xmlNode, htmlBlock.offsetLeft, htmlBlock.offsetTop);                
        }
    }
    
    
    this.__loadJML = function(x){
        if (this.jml.childNodes.length) 
            this.loadInlineData(this.jml);
        
        if (this.hasFeature(__MULTIBINDING__) && x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
        
        // this.doOptimize(true);
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("ref")) 
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
        var jmlNode = this;
        
        jpf.getData(this.jml.getAttribute("loadtemplate"), null, null, 
            function(data, state, extra){
                if (state != jpf.SUCCESS) {
                    jpf.console.info("An error has occurred: " + extra.message, 2);
                    return;
                }
                //jpf.alert_r(data);                                        
                jmlNode.loadTemplate(data);
            });
        
        
        if (!jpf.isFalse(x.getAttribute("resize"))) {
        
            resize = new jpf.resize();
            
            resize.onresizedone = function(){
            
                var w = parseInt(_self.applyRuleSetOnNode("width", _self.value));
                var h = parseInt(_self.applyRuleSetOnNode("height", _self.value));
                var l = parseInt(_self.applyRuleSetOnNode("left", _self.value));
                var t = parseInt(_self.applyRuleSetOnNode("top", _self.value));
                
                var nw = parseInt(_self.selected.offsetWidth);
                var nh = parseInt(_self.selected.offsetHeight);
                var nl = parseInt(_self.selected.offsetLeft) + jpf.resize.getXBorder(_self.selected.parentNode, "left");
                var nt = parseInt(_self.selected.offsetTop) + jpf.resize.getXBorder(_self.selected.parentNode, "top");
                
                if ((l - nl !== 0 || t - nt !== 0) && (w - nw == 0 && h - nh == 0)) {
                    _self.MoveTo(_self.value, nl, nt);
                }
                else if (w - nw !== 0 || h - nh !== 0) {
                    _self.resize(_self.value, nw, nh, nl, nt);
                }
            }
            
            resize.onresize = function(){
                var objBlock = jpf.flow.isBlock(_self.selected);
                jpf.flow.clearConnectionInputs();
                objBlock.onMove();
            }
        }
    }
    
    
    this.loadTemplate = function(data){
        this.template = jpf.xmldb.getBindXmlNode(data);
        this.__checkLoadQueue();
    }
    
    this.__canLoadData = function(){
        return this.template ? true : false;
    }
    
    
    this.__destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    }
    
    
}

//#endif
