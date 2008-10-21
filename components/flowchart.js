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

/** 
 * Component implementing adding and removing new objects (blocks).
 * Every block could be rotated, fliped, resized, locked and moved. It's possible to add
 * connections between them.
 * 
 * Flowchart component example:
 * 
 * <j:flowchart id="WF" loadtemplate="url:template.xml" model="modelName" onbeforeremove="return confirm('are you sure')" >
 *     <j:css default="red" />
 *     <j:bindings>
 *         <j:move       select = "self::node()[not(@move='0') and not(@lock='1')]" />
 *         <j:resize     select = "self::node()[@resize='1' and not(@lock='1')]" />
 *         <j:css        select = "self::node()[@lock='1']" default="locked"/>
 *         <j:left       select = "@left" />
 *         <j:top        select = "@top" />
 *         <j:id         select = "@id" />
 *         <j:width      select = "@width" />
 *         <j:width      value  = "56" />
 *         <j:height     select = "@height" />
 *         <j:height     value  = "56" />
 *         <j:flipv      select = "@flipv" />
 *         <j:fliph      select = "@fliph" />
 *         <j:rotation   select = "@rotation" />
 *         <j:lock       select = "@lock" />
 *         <j:type       select = "@type" />
 *         <j:type       value  = "" />
 *         <j:zindex     select = "@zindex" />
 *         <j:image      select = "@src" />
 *         <j:title      select = "text()" />
 *
 *         <!-- TEMPLATE -->
 *         <j:x          select = "@x" />
 *         <j:y          select = "@y" />
 *         <j:position   select = "@position" />
 *         <j:name       select = "@name" />
 *         <j:picture    select = "@picture" />
 *         <j:dwidth     select = "@dwidth" />
 *         <j:dheight    select = "@dheight" />
 *         <j:scalex     select = "@scalex" />
 *         <j:scaley     select = "@scaley" />
 *         <j:scaleratio select = "@scaleratio" />
 *         <!-- TEMPLATE-END -->
 *
 *         <j:traverse select="block" />
 *         <!-- Connection Binding Rules -->
 *         <j:connection select = "connection" />
 *         <j:ref        select = "@ref" />
 *         <j:input      select = "@input" />
 *         <j:output     select = "@output" />
 *         <j:template   select = "@type" />
 *     </j:bindings>
 * </j:flowchart>
 * 
 * Model Example:
 * <j:model id="modelName" save-original="true">
 *     <flowchart>
 *         <block id="b1" type="current_source_cc" left="500" top="520" width="56" height="56" lock="0"></block>
 *         <block id="b5" type="mosfet_p" left="800" top="400" width="56" height="56" lock="0">
 *             <connection ref="b1" output="3" input="3" />
 *         </block>
 *     </flowchart>
 * </j:model>
 * 
 * Flowchart properties:
 *     id             = "WF"                               Flowchart id
 *     loadtemplate   = "url:template.xml"                 Path to template file
 *     model          = "modelName"                        Model name
 *     onbeforeremove = "return confirm('are you sure')"   Action before remove
 * 
 * Block properties:
 *     id             = "b1"             Block id
 *     type           = "capacitor"      Block type, it's possible to define block type, his outputs, background image and other
 *     left           = "300"            position X [px]
 *     top            = "220"            position Y [px]
 *     width          = "200"            Block size [px]
 *     height         = "100"            Block size [px]
 *     flipv          = "1"              Flip vertical (1 is fliped, 0 not), background image is fliped automaticly
 *     fliph          = "1"              Flip horizontal (1 is fliped, 0 not), background image is fliped automaticly
 *     rotation       = "90"             Block rotation (0, 90, 180, 270) [degrees], background image is rotated automaticly
 *     lock           = "1"              prohibit block moving (1 is locked, 0 not)
 * 
 * Connection properties:
 *     ref            = "b5"             Destination Block id 
 *     output         = "2"              Source block input number
 *     input          = "2"              Destination block input number
 * 
 * 
 * 
 * @classDescription        This class creates a new flowchart
 * @return {Flowchart}      Returns a new flowchart
 *
 * @author      Łukasz Lipiński
 * @version     %I%, %G% 
 */


// #ifdef __JFLOWCHART || __INC_ALL

jpf.flowchart = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode = document.body;

    this.$supportedProperties.push("onbeforeremove");
    this.objCanvas;
    this.nodes = [];

    resizeManager = null;

    xmlBlocks = {};
    objBlocks = {};
    xmlConnections = {};

    var _self = this;

    var onkeydown_ = function(e) {

        e = (e || event);
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

        if (!this.selected)
            return;

        var value = (ctrlKey ? 10 : (shiftKey ? 100 : 1));

        switch (key) {
            case 37:
                this.MoveTo(
                    this.selected,
                    parseInt(this.applyRuleSetOnNode("left", this.selected)) - value,
                    this.applyRuleSetOnNode("top", this.selected)
                );
                return false;
            case 38:
                this.MoveTo(
                    this.selected,
                    this.applyRuleSetOnNode("left", this.selected),
                    parseInt(this.applyRuleSetOnNode("top", this.selected)) - value
                );
                return false;
            case 39:
                this.MoveTo(
                    this.selected,
                    parseInt(this.applyRuleSetOnNode("left", this.selected)) + value,
                    this.applyRuleSetOnNode("top", this.selected)
                );
                return false;
            case 40:
                this.MoveTo(
                    this.selected,
                    this.applyRuleSetOnNode("left", this.selected),
                    parseInt(this.applyRuleSetOnNode("top", this.selected)) + value
                );
                return false;
            case 46:
                //DELETE
                if (_self.objCanvas.disableremove)
                    return;
                resizeManager.hide();

                switch (_self.objCanvas.mode) {
                    case "normal":
                        break;
                    case "connection-change":
                        var connectionsToDelete = [];

                        var connectors = _self.objCanvas.htmlConnectors;
                        for (var id in connectors) {
                            if (connectors[id].selected) {
                                connectionsToDelete.push(connectors[id].other.xmlNode);
                                connectors[id].destroy();
                            }
                        }
                        _self.removeConnector(connectionsToDelete);
                        _self.objCanvas.mode = "normal";
                        break;
                }
                break;
        }
    }

    this.addEventListener("onkeydown", onkeydown_);

    this.$propHandlers["onbeforeremove"] = function(value) {
        alert("lol");
    };

    this.$select = function(o) {
        if (!o)
            return;

        this.$setStyleClass(o, "selected");

        var objBlock = jpf.flow.isBlock(o);

        if (objBlock) {
            if (resizeManager) {
                var prop = objBlock.other;
                var scales = {
                    scalex     : prop.scalex,
                    scaley     : prop.scaley,
                    scaleratio : prop.scaleratio,
                    dwidth     : prop.dwidth,
                    dheight    : prop.dheight
                }
                resizeManager.grab(o, scales);
            }
        }
    };

    this.$deselect = function(o) {
        if (!o)
            return;
        this.$setStyleClass(o, "", ["selected"]);
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    /**
     * Moves block to new x, y position and update his xmlNode.
     * htmlNode is updated in this.$updateModifier function.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode   Block xmlNode
     * @param {Number}    x         New left position
     * @param {Number}    y         New top position
     */

    this.MoveTo = function(xmlNode, x, y) {
        var lnode = this.getNodeFromRule("left", xmlNode, null, null, true);
        var tnode = this.getNodeFromRule("top", xmlNode, null, null, true);

        var attrs = {};
        attrs[lnode.nodeName] = x;
        attrs[tnode.nodeName] = y;

        var exec = this.executeAction("setAttributes", [xmlNode, attrs], "moveto", xmlNode);
        if (exec !== false)
            return xmlNode;

        this.dispatchEvent("moveitem", {
            xmlNode : xmlNode,
            x       : x,
            y       : y
        });
    };

    /**
     * Set to block xmlNode new z-index propertie.
     * htmlNode is updated in this.$updateModifier function.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode   Block xmlNode
     * @param {Number}    value     New z-index number
     */

    /* Actually not used */
    this.SetZindex = function(xmlNode, value) {
        var node = this.getNodeFromRule("zindex", xmlNode, null, null, true);
        if (!node)
            return;

        var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                ? "setTextNode"
                : "setAttribute";
        var args = node.nodeType == 1
            ? [node, value]
            : (node.nodeType == 3 || node.nodeType == 4
                ? [node.parentNode, value]
                : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);

        this.executeAction(atAction, args, "setzindex", xmlNode);
    };

    /**
     * Set mode to Canvas object. Modes adds new features.
     * For example, if connection-add mode is active, possible is adding new connections between blocks.
     * All operations from "normal" mode are allowed in other modes
     * 
     * Modes:
     *     normal             - all operations are allowed except operations from different modes
     *     connection-add     - it's possible to add new connection between blocks
     *     connection-change  - it's possible to change existing connection
     * 
     * @param {String}   mode   Operations mode
     */

    this.setMode = function(mode) {
        _self.objCanvas.setMode(mode);
    };

    /**
     * Immobilise Block element on flowchart component.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode   Block xmlNode
     * @param {Number}    value     Lock value (1 - locked, 0 - unlocked).
     */

    this.lock = function(xmlNode, value) {
        var node = this.getNodeFromRule("lock", xmlNode, null, null, true);
        if (!node)
            return;

        var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                ? "setTextNode"
                : "setAttribute";
        var args = node.nodeType == 1
            ? [node, value]
            : (node.nodeType == 3 || node.nodeType == 4
                ? [node.parentNode, value]
                : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                

        this.executeAction(atAction, args, "lock", xmlNode);
    };

    /**
     * Rotate block element.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode       Block xmlNode
     * @param {Number}    newRotation   Rotation angle [degree]
     * @param {Number}    start         
     */

    this.rotate = function(xmlNode, newRotation, start) {
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

        for (var i = 0, l = props.length; i < l; i++) {
            var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
            var value = props[i][1];

            if (node) {
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                        ? "setTextNode"
                        : "setAttribute";
                var args = node.nodeType == 1
                    ? [node, value]
                    : (node.nodeType == 3 || node.nodeType == 4
                        ? [node.parentNode, value]
                        : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                changes.push({func : atAction, args : args});
            }
        }
        this.executeAction("multicall", changes, "rotation", xmlNode);
    };

    /**
     * Flip Block vertical. Block background-image will be fliped too.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode   Block xmlNode
     * @param {Number}    newFlipV  Flip vertical value (1 is fliped, 0 not)
     */

    this.flipVertical = function(xmlNode, newFlipV) {
        var prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode)
            ? parseInt(this.applyRuleSetOnNode("fliph", xmlNode))
            : 0;
        var prevRotate = this.applyRuleSetOnNode("rotation", xmlNode)
            ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode))
            : 0;

        var props   = [];
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
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                        ? "setTextNode"
                        : "setAttribute";
                var args = node.nodeType == 1
                    ? [node, value]
                    : (node.nodeType == 3 || node.nodeType == 4
                        ? [node.parentNode, value]
                        : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                changes.push({func : atAction, args : args});
            }
        }
        this.executeAction("multicall", changes, "flipv", xmlNode);
    };

    /**
     * Flip Block horizontal. Block background-image will be fliped too.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   xmlNode   Block xmlNode
     * @param {Number}    newFlipV  Flip horizontal value (1 is fliped, 0 not)
     */

    this.flipHorizontal = function(xmlNode, newFlipH) {
        var prevFlipV  = this.applyRuleSetOnNode("flipv", xmlNode)
            ? parseInt(this.applyRuleSetOnNode("flipv", xmlNode))
            : 0;
        var prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode)
            ? parseInt(this.applyRuleSetOnNode("fliph", xmlNode))
            : 0;
        var prevRotate = this.applyRuleSetOnNode("rotation", xmlNode)
            ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode))
            : 0;

        var props   = [];
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
                var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                        ? "setTextNode"
                        : "setAttribute";
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
        this.executeAction("multicall", changes, "fliph", xmlNode);
    };

    /**
     * Creates new connection between two blocks.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {xmlNode}   sXmlNode   Source Block xmlNode
     * @param {Number}    sInput     Source Block input number
     * @param {xmlNode}   dXmlNode   Destination Block xmlNode
     * @param {Number}    dInput     Destination Block output number
     */

    this.addConnector = function(sXmlNode, sInput, dXmlNode, dInput) {
        var nXmlNode = _self.xmlRoot.ownerDocument.createElement("connection");
        
        nXmlNode.setAttribute("ref", _self.applyRuleSetOnNode("id", dXmlNode));
        nXmlNode.setAttribute("output", sInput);
        nXmlNode.setAttribute("input", dInput);
        
        this.executeAction("appendChild", [sXmlNode, nXmlNode], "addConnector", sXmlNode );
    };


    /**
     * Removes connections between blocks. It's possible to remove more connections in one call.
     * This is an action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {Array} xmlNodeArray   Array with connections xmlNodes
     */

    this.removeConnector = function(xmlNodeArray) {
        var changes = [];

        for (var i = 0, l = xmlNodeArray.length; i < l; i++) {
            changes.push({
                func : "removeNode",
                args : [xmlNodeArray[i]]
            });
        }

        this.executeAction("multicall", changes, "removeConnectors", xmlNodeArray[0]);
    };

    /**
     * Resize block element in vertical and horiznontal plane. 
     * 
     * @param {xmlNode}   xmlNode     Block xmlNode to resize
     * @param {Number}    newWidth    Block's new width
     * @param {Number}    newHeight   Block's new height
     * @param {Number}    newTop      Block's new top position
     * @param {Number}    newLeft     Block's new left position
     */
    
    this.resize = function(xmlNode, newWidth, newHeight, newTop, newLeft) {
        var lock = parseInt(this.applyRuleSetOnNode("lock", xmlNode)) || 0;
        if (lock == 0) {
            var props = [];
            var changes = [];

            props.push(["top", newTop], ["left", newLeft], ["width", newWidth],  ["height", newHeight]);

            for(var i = 0, l = props.length; i < l; i++){
                var node = this.getNodeFromRule(props[i][0], xmlNode, false, false, this.createModel);
                var value = props[i][1];

                if(node){
                    var atAction = node.nodeType == 1 || node.nodeType == 3 || node.nodeType == 4
                        ? "setTextNode"
                        : "setAttribute";
                    var args = node.nodeType == 1
                        ? [node, value]
                        : (node.nodeType == 3 || node.nodeType == 4
                            ? [node.parentNode, value]
                            : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
                    changes.push({func : atAction, args : args});
                }
            }
            this.executeAction("multicall", changes, "resize", xmlNode);
        }
    };

    this.$draw = function() {
        //Build Main Skin
        this.oExt        = this.$getExternal();
        this.oInt        = this.$getLayoutNode("main", "container", this.oExt);

        _self.objCanvas = new jpf.flow.getCanvas(this.oInt);
        jpf.flow.init();

        /* Set top/left to xmlNode (automaticly call to _updateModifier function ) */
        _self.objCanvas.onblockmove = function(htmlBlock) {
            var xmlNode = jpf.xmldb.getNode(htmlBlock);
            _self.MoveTo(xmlNode, parseInt(htmlBlock.style.left), parseInt(htmlBlock.style.top));
        }
    };

    this.$updateModifier = function(xmlNode, htmlNode) {
        var blockId = this.applyRuleSetOnNode("id", xmlNode);

        htmlNode.style.left   = (this.applyRuleSetOnNode("left", xmlNode)   || 10) + "px";
        htmlNode.style.top    = (this.applyRuleSetOnNode("top", xmlNode)    || 10) + "px";
        htmlNode.style.width  = (this.applyRuleSetOnNode("width", xmlNode)  || 56) + "px";
        htmlNode.style.height = (this.applyRuleSetOnNode("height", xmlNode) || 56) + "px";

        objBlock = objBlocks[blockId];

        /* Lock */
        var lock = parseInt(this.applyRuleSetOnNode("lock", xmlNode)) || 0;
        objBlock.lock(lock);

        objBlock.changeRotation(
            this.applyRuleSetOnNode("rotation", xmlNode),
            this.applyRuleSetOnNode("fliph", xmlNode),
            this.applyRuleSetOnNode("flipv", xmlNode));

        /* Checking for changes in connections */
        var xpath    = this.getSelectFromRule("connection", xmlNode)[0];
        var cNew     = xmlNode.selectNodes(xpath);
        var cCurrent = xmlConnections[blockId] || [];

        //Checking for removed connections
        if (cCurrent.length) {
            for (var i = 0; i < cCurrent.length; i++) {
                for (var j = 0, found = false; j < cNew.length; j++) {
                    if (cCurrent[i].xmlNode == cNew[j]) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    if (objBlocks[blockId] && objBlocks[cCurrent[i].ref]) {
                        var ConToDel = jpf.flow.findConnector(objBlocks[blockId], 
                            cCurrent[i].output, objBlocks[cCurrent[i].ref], cCurrent[i].input);
                        if (ConToDel) {
                            jpf.flow.removeConnector(ConToDel.connector.htmlElement);
                        }
                        xmlConnections[blockId].removeIndex(i);
                    }
                }
            }
        }
        else{
            delete xmlConnections[blockId];
        }

        //Checking for new connections
        for (var i = 0; i < cNew.length; i++) {
            var found = false;
            if (cCurrent) {
                for (var j = 0; j < cCurrent.length; j++) {
                    if (cCurrent[j].xmlNode == cNew[i]) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                var ref    = this.applyRuleSetOnNode("ref", cNew[i]);
                var output = this.applyRuleSetOnNode("output", cNew[i]);
                var input  = this.applyRuleSetOnNode("input", cNew[i]);

                if (xmlBlocks[ref]) {
                    var r = xmlConnections[blockId] || [];
                    r.push({ref : ref, output : output, input : input, xmlNode : cNew[i]});

                    new jpf.flow.addConnector(_self.objCanvas, objBlocks[blockId], objBlocks[ref], {
                            output : output,
                            input  : input,
                            xmlNode: cNew[i]
                        }
                    );
                    xmlConnections[blockId] = r;
                }
                else {
                    jpf.console.info("Destination block don't exist.");
                }
            }
        }

        /* Refresh block */
        objBlock.onMove();

        if (resizeManager && xmlNode == this.selected && lock == 0) {
            resizeManager.show();
        }
        else {
            resizeManager.hide();
        }
    }

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode) {
        /* Creating Block */
        this.$getNewContext("block");
        var block = this.$getLayoutNode("block");
        var elSelect  = this.$getLayoutNode("block", "select");
        var elImage   = this.$getLayoutNode("block", "image");

        this.nodes.push(block);

        var style = [];
        style.push("left:"    + (this.applyRuleSetOnNode("left", xmlNode)   || 10) + "px");
        style.push("top:"     + (this.applyRuleSetOnNode("top", xmlNode)    || 10) + "px");
        style.push("width:"   + (this.applyRuleSetOnNode("width", xmlNode)  || 56) + "px");
        style.push("height:"  + (this.applyRuleSetOnNode("height", xmlNode) || 56) + "px");
        style.push("z-index:" + (this.applyRuleSetOnNode("zindex", xmlNode) || this.oExt.childNodes.length + 1));
        block.setAttribute("style", style.join(";"));

        elSelect.setAttribute(this.itemSelectEvent || "onmousedown", 'var o = jpf.lookup(' + this.uniqueId +
            '); o.select(this, event.ctrlKey, event.shiftKey)');

        jpf.xmldb.nodeConnect(this.documentId, xmlNode, block, this);
        xmlBlocks[this.applyRuleSetOnNode("id", xmlNode)] = xmlNode;

        /* Creating Connections */
        var r = [];
        var xpath = this.getSelectFromRule("connection", xmlNode)[0];
        var connections = xmlNode.selectNodes(xpath);

        for (var i = 0, l = connections.length; i < l; i++) {
            r.push({
                ref     : this.applyRuleSetOnNode("ref", connections[i]),
                output  : this.applyRuleSetOnNode("output", connections[i]),
                input   : this.applyRuleSetOnNode("input", connections[i]),
                xmlNode : connections[i]
            });
        }
        if (r.length > 0) {
            xmlConnections[this.applyRuleSetOnNode("id", xmlNode)] = r;
        }
    };

    this.$fill = function() {
        jpf.xmldb.htmlImport(this.nodes, this.oInt);

        for (var id in xmlBlocks) {
            var xmlBlock = xmlBlocks[id];
            var htmlElement = jpf.xmldb.findHTMLNode(xmlBlock, this);
            var type = xmlBlocks[id].getAttribute("type");
            var inputList = {};

            if (type) {
                if (this.template) {
                    var elTemplate = this.template.selectSingleNode("//element[@type='"
                                   + this.applyRuleSetOnNode("template", xmlBlock) + "']");

                    var inputs = elTemplate.selectNodes("input");
                    for (var i = 0, l = inputs.length; i < l; i++) {
                        inputList[parseInt(this.applyRuleSetOnNode("name", inputs[i]))] = {
                            x        : parseInt(this.applyRuleSetOnNode("x", inputs[i])),
                            y        : parseInt(this.applyRuleSetOnNode("y", inputs[i])),
                            position : this.applyRuleSetOnNode("position", inputs[i])
                        };
                    }
                }
            }

            var other = {
                lock      : this.applyRuleSetOnNode("lock", xmlBlock) || 0,
                flipv     : this.applyRuleSetOnNode("flipv", xmlBlock) || 0,
                fliph     : this.applyRuleSetOnNode("fliph", xmlBlock) || 0,
                rotation  : this.applyRuleSetOnNode("rotation", xmlBlock) || 0,
                inputList : inputList,
                type      : type,
                picture   : type ? this.applyRuleSetOnNode("picture", elTemplate) : null,
                dwidth    : type ? this.applyRuleSetOnNode("dwidth", elTemplate) : 56,
                dheight   : type ? this.applyRuleSetOnNode("dheight", elTemplate) : 56,
                scalex    : type ? this.applyRuleSetOnNode("scalex", elTemplate) || false : true,
                scaley    : type ? this.applyRuleSetOnNode("scaley", elTemplate) || false : true,
                scaleratio: type ? this.applyRuleSetOnNode("scaleratio", elTemplate) || false : true,
                xmlNode   : xmlBlock
            }

            var objBlock = jpf.flow.addBlock(htmlElement, _self.objCanvas, other);
                objBlock.lock(this.applyRuleSetOnNode("lock", xmlBlock) || 0);
                objBlock.oncreateconnection = function(sXmlNode, sInput, dXmlNode, dInput) {
                    _self.addConnector(sXmlNode, sInput, dXmlNode, dInput);
                };
                objBlock.onremoveconnection = function(xmlNodeArray) {
                    _self.removeConnector(xmlNodeArray);
                };

            objBlocks[id] = objBlock;
        }

        for (var id in xmlBlocks) {
            var c = xmlConnections[id] || [];
            for (var i = 0, l = c.length; i < l; i++) {
                //var con = blockId[id].getConnection(blockId[c[i].ref].htmlElement, c[i].output, c[i].input);
                var con = false;
                if (!con) {
                    new jpf.flow.addConnector(_self.objCanvas, objBlocks[id], objBlocks[c[i].ref], {
                        output  : c[i].output,
                        input   : c[i].input,
                        xmlNode : c[i].xmlNode
                    });
                }
            }
        }

        this.nodes = [];
    }

    this.$destroy = function() {
        /*this.oPrevious.onclick = null;

        this.removeEventListener("onkeydown", onkeydown_);
        this.removeEventListener("mousescroll", onmousescroll_);

        this.x = null;*/
    }

    this.$loadJml = function(x) {
        if (this.$jml.childNodes.length)
            this.$loadInlineData(this.$jml);

        if (this.hasFeature(__MULTIBINDING__) && x.getAttribute("value"))
            this.setValue(x.getAttribute("value"));

        /* Loading template */
        jpf.getData(this.$jml.getAttribute("loadtemplate"), null, null, function(data, state, extra) {
            if (state != jpf.SUCCESS) {
                jpf.console.info("An error has occurred: " + extra.message, 2);
                return;
            }
            _self.loadTemplate(data);
        });

        /* Resize */
        resizeManager = new jpf.resize();
        resizeManager.onresizedone = function(w, h, t , l) {
            _self.resize(_self.selected, w, h, t, l);
        };
        resizeManager.onresize = function(htmlElement) {
            if(!htmlElement)
                return;

            var objBlock = jpf.flow.isBlock(htmlElement);
            objBlock.onMove();
        };

        jpf.flow.onbeforemove = function() {
            resizeManager.hide();
        };

        jpf.flow.onaftermove = function(t, l) {
            _self.MoveTo(_self.selected, l, t);
            resizeManager.show();
        };
    };

    this.loadTemplate = function(data) {
        this.template = jpf.xmldb.getBindXmlNode(data);
        this.$checkLoadQueue();
    };

    this.canLoadData = function() {
        return this.template ? true : false;
    };

}).implement(jpf.Presentation, jpf.DataBinding, jpf.Cache, jpf.MultiSelect, jpf.BaseList);
//#endif