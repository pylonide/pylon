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

// #ifdef __JFLOWCHART || __INC_ALL
/** 
 * Element is implementing adding and removing block elements.
 * Every block could be rotated, fliped, resized, renamed, locked and moved.
 * It's possible to add connections between them.
 * 
 * Example:
 * Flowchart element:
 * <code>
 *     <j:flowchart id="WF" template="url:template.xml" model="modelName">
 *         <j:css default="red" />
 *         <j:bindings>
 *             <j:move       select = "self::node()[not(@move='0') and not(@lock='1')]" />
 *             <j:resize     select = "self::node()[@resize='1' and not(@lock='1')]" />
 *             <j:css        select = "self::node()[@lock='1']" default="locked"/>
 *             <j:left       select = "@left" />
 *             <j:top        select = "@top" />
 *             <j:id         select = "@id" />
 *             <j:width      select = "@width" />
 *             <j:height     select = "@height" />
 *             <j:flipv      select = "@flipv" />
 *             <j:fliph      select = "@fliph" />
 *             <j:rotation   select = "@rotation" />
 *             <j:lock       select = "@lock" />
 *             <j:type       select = "@type" />
 *             <j:type       value  = "" />
 *             <j:zindex     select = "@zindex" />
 *             <j:image      select = "@src" />
 *             <j:traverse select="block" />
 *             
 *             <!-- Connection Binding Rules -->
 *             <j:connection select = "connection" />
 *             <j:ref        select = "@ref" />
 *             <j:input      select = "@input" />
 *             <j:output     select = "@output" />
 *             <j:ttype      select = "@type" />
 *         </j:bindings>
 *     </j:flowchart>
 * </code>
 * 
 * Example:
 * Flowchat model
 * <code>
 *     <j:model id="modelName" save-original="true">
 *         <flowchart>
 *             <block id="b1" type="current_source_cc" left="500" top="520" width="56" height="56" lock="false" flipv="true" fliph="false"></block>
 *             <block id="b5" type="mosfet_p" left="800" top="400" width="56" height="56" lock="0">
 *                 <connection ref="b1" output="3" input="3" />
 *             </block>
 *         </flowchart>
 *     </j:model>
 * </code>
 *
 * @define flowchart
 * @attribute {String}   template   the data instruction to load the xml for the 
 * template that defines all the elements which are available in the flowchart.
 * Example:
 * A template describing a single transistor element
 * <code>
 *  <template>
 *      <element type="capacitor"
 *        picture     = "elements/capacitor.png"
 *        dwidth      = "56"
 *        dheight     = "56"
 *        scaley      = "false"
 *        scalex      = "false"
 *        scaleration = "true">
 *          <input x="28" y="0" position="top" name="1" />
 *          <input x="28" y="56" position="bottom" name="2" />
 *      </element>
 *  </template>
 * </code>
 * 
 * @binding lock    prohibit block move, default is false.
 *     Possible values:
 *     false   block element is unlocled
 *     true    block element is locked
 * @binding fliph   wether to mirror the block over the horizontal axis, default is false
 *     Possible values:
 *     true    block element is fliped
 *     false   block element is not fliped
 * @binding flipv   wether to mirror the block over the vertical axis, default is false
 *     Possible values:
 *     true    block element is fliped
 *     false   block element is not fliped
 * @binding rotation   the rotation in degrees clockwise, default is 0
 *     Possible values:
 *     0     0   degrees rotation
 *     90    90  degrees rotation
 *     180   180 degrees rotation
 *     270   270 degrees rotation
 * @binding id          unique block element name
 * @binding image       path to block image file
 * @binding width       block element horizontal size
 * @binding height      block element vertical size
 * @binding type        name of block with special abilities, which could be set in template file
 * @binding ttype       relation to block with special abilities defined in template file
 * @binding zindex      block's z-index number
 * @binding left        horizontal position of block element
 * @binding top         vertical position of block element
 * @binding connection  xml representation of connection element
 * @binding ref         unique name of destination block which will be connected with source block
 * @binding input       source block input number
 * @binding output      destination block input number
 * 
 * @constructor
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Cache
 * @inherits jpf.MultiSelect
 * @inherits jpf.BaseList
 * @inherits jpf.Rename
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G% 
 */
jpf.flowchart = jpf.component(jpf.NODE_VISIBLE, function() {
    //this.$supportedProperties.push("onbeforeremove");
    this.objCanvas;
    this.nodes = [];
    //this.onbeforeremove = null;

    lastBlockId = 0;

    template      = null;
    torename      = null;
    resizeManager = null;

    xmlBlocks      = {};
    objBlocks      = {};
    xmlConnections = {};
    connToPaint    = [];

    var _self = this;

    var onkeydown_ = function(e) {
        e = (e || event);
        //e.preventDefault();
        //e.returnValue = false;
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            sel = this.getSelection(),
            value = (ctrlKey ? 10 : (shiftKey ? 100 : 1));
        var disabled = _self.objCanvas.disableremove;

        if (!sel || disabled)
            return;

        switch (key) {
            case 37:
                //Left Arrow
                this.moveTo(sel, - value, 0);
                return false;
            case 38:
                //Top Arrow
                this.moveTo(sel, 0, - value);
                return false;
            case 39:
                //Right Arrow
                this.moveTo(sel, value, 0);
                return false;
            case 40:
                //Bottom Arrow
                this.moveTo(sel, 0, value);
                return false;
            case 46:
                //Delete
                resizeManager.hide();
                
                /*if (this.onbeforeremove)
                    eval(this.onbeforeremove);*/

                switch (_self.objCanvas.mode) {
                    case "normal":
                        //Removing Blocks
                        this.removeBlocks(sel);
                        break;
                    case "connection-change":
                        //Removing Connections
                        var connectionsToDelete = [],
                            connectors = _self.objCanvas.htmlConnectors;
                        for (var id in connectors) {
                            if (connectors[id].selected) {
                                connectionsToDelete.push(connectors[id].other.xmlNode);
                                connectors[id].destroy();
                            }
                        }
                        _self.removeConnectors(connectionsToDelete);
                        _self.objCanvas.mode = "normal";
                        break;
                }
                break;
        }
    }

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("onkeydown", onkeydown_, true);
    
    jpf.addEventListener("contextmenu", function(){return false;});
    //#endif

    /*this.$propHandlers["onbeforeremove"] = function(value) {
        alert("On beforeremove alert");
        this.onbeforeremove = value;
    };*/

    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        var objBlock = objBlocks[this.applyRuleSetOnNode("id", this.selected)];
        if (!objBlock) 
            return;
        return objBlock.caption;
    };
    // #endif

    this.$beforeRename = function(e) {
        e = e || event;
        var target = e.srcElement || e.target;

        _self.$selectCaption(target);

        if(target !== torename) {
            torename = target;
            return false;
        }

        _self.objCanvas.disableremove = true;
        _self.$deselectCaption(target);
        _self.startRename();
        torename = null;
        return false;
    }

    function $afterRenameMode() {
       _self.objCanvas.disableremove = false;
    }
    this.addEventListener("afterrename", $afterRenameMode);

    this.$selectCaption = function(o) {
        this.$setStyleClass(o, "selected");
    }

    this.$deselectCaption = function(o) {
        this.$setStyleClass(o, "", ["selected"]);
    }

    this.$select = function(o) {
        if (!o)
            return;

        var objBlock = jpf.flow.isBlock(o);

        if (objBlock) {
            if (resizeManager) {
                var prop = objBlock.other;
                if (prop.lock == 1)
                    return;

                _self.$selectCaption(objBlock.caption);

                var scales = {
                    scalex     : prop.scalex,
                    scaley     : prop.scaley,
                    scaleratio : prop.scaleratio,
                    dwidth     : prop.dwidth,
                    dheight    : prop.dheight
                }
                resizeManager.grab(o, scales);
            }
        this.$setStyleClass(o, "selected");
        }
    };

    this.$deselect = function(o) {
        if (!o)
            return;
        this.$setStyleClass(o, "", ["selected"]);

        var objBlock = jpf.flow.isBlock(o);
        this.$deselectCaption(objBlock.caption);
        resizeManager.hide();
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    /**
     * Moves block to new x, y position and update his xmlNode. This is an
     * action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {Object}       xmlNodeArray   xml representations of blocks elements list
     * @param {Number}       dl             New horizontal coordinate
     * @param {Number}       dt             New vertical coordinate
     */
    this.moveTo = function(xmlNodeArray, dl, dt) {
        /*var l = parseInt(this.applyRuleSetOnNode("left", xmlNode)) || 0;
        var t = parseInt(this.applyRuleSetOnNode("top", xmlNode)) || 0;

        this.executeMulticallAction(
            "moveTo", ["top", "left"], xmlNode, [t + dt, l + dl]);*/
        /* If only one block is selected */
        if(!xmlNodeArray.length) {
            xmlNodeArray = [xmlNodeArray];
        }

        var props = changes = [];
        var setNames = ["top", "left"];

        for (var i = 0, l = xmlNodeArray.length; i < l; i++) {
            for (var j = 0; j < setNames.length; j++) {
                var node = this.getNodeFromRule(setNames[j], xmlNodeArray[i], false, false, this.createModel),
                    value = (setNames[j] == "left" ? dl : dt) + parseInt(this.applyRuleSetOnNode(setNames[j], xmlNodeArray[i])) || 0;
    
                if (node) {
                    var atAction = node.nodeType == 1 || node.nodeType == 3
                                || node.nodeType == 4
                        ? "setTextNode"
                        : "setAttribute";
                    var args = node.nodeType == 1
                        ? [node, value] 
                        : (node.nodeType == 3 || node.nodeType == 4
                            ? [node.parentNode, value] 
                            : [node.ownerElement || node.selectSingleNode(".."),
                               node.nodeName, value]);
                    changes.push({
                        func: atAction,
                        args: args
                    });
                }
            }
        }

        this.executeAction("multicall", changes, "moveTo", xmlNodeArray);
    };

    /**
     * Set to block xmlNode new z-index propertie. This is an action. It's
     * possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Number}       value     new z-index number
     */
    this.setZindex = function(xmlNode, value) {
        this.executeActionByRuleSet("setzindex", "zindex", xmlNode, value);
    };

    /**
     * Sets mode to canvas object. Modes adds new features. For example,
     * if connection-change mode is active, possible is deleting connections
     * between blocks. All operations from "normal" mode are allowed in other
     * modes.
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
    
    this.getMode = function() {
        return _self.objCanvas.getMode();
    };

    /**
     * Immobilise block element on flowchart element. This is an action.
     * It's possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Boolean}      value     prohibit block move, default is false.
     *     Possible values:
     *     true  block is locked
     *     false block is unlocked
     */
    this.setLock = function(xmlNode, value) {
        this.executeActionByRuleSet("setlock", "lock", xmlNode, String(value));
    };

    /**
     * Rotate block element. This is an action. It's possible to return to
     * previous state with Undo/Redo
     * 
     * @param {XMLElement}   xmlNode       xml representation of block element
     * @param {Number}       newRotation   the rotation in degrees clockwise, default is 0
     *     Possible values:
     *     0     0 degrees rotation
     *     90    90 degrees rotation
     *     180   180 degrees rotation
     *     270   270 degrees rotation
     * @param {Number}       start
     */
    this.rotate = function(xmlNode, newRotation, start) {
        var prevFlipV = this.applyRuleSetOnNode("flipv", xmlNode) == "true"
                ? true
                : false,
            prevFlipH = this.applyRuleSetOnNode("fliph", xmlNode) == "true"
                ? true
                : false,
            prevRotation = start
                ? 0
                : parseInt(this.applyRuleSetOnNode("rotation", xmlNode)) || 0,
            names = ["fliph", "flipv", "rotation"],
            values;

        if (prevFlipV && prevFlipH) {
            values = ["false", "false", (newRotation + 180) % 360];
        }
        else {
            values = [String(prevFlipH), String(prevFlipV), newRotation];

            if (Math.abs(newRotation - prevRotation) % 180 !== 0) {
                var
                w = parseInt(this.applyRuleSetOnNode("width", xmlNode)) || 0,
                h = parseInt(this.applyRuleSetOnNode("height", xmlNode)) || 0;

                names.push("width", "height");
                values.push(h, w);
            }
        }

        this.executeMulticallAction(
            "rotate", names, xmlNode, values);
    };

    /**
     * Wether to mirror the block over the vertical axis. This is an action.
     * It's possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Number}       newFlipV  new flip value, default is false
     *     Possible values:
     *     true    block element is fliped
     *     false   block element is not fliped
     */
    this.flipVertical = function(xmlNode, newFlipV) {
        var prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode) == "true"
                ? true
                : false,
            prevRotate = this.applyRuleSetOnNode("rotation", xmlNode)
                ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode))
                : 0;

        var values = prevFlipH && newFlipV 
            ? ["false", "false", (prevRotate + 180) % 360]
            : [String(prevFlipH), String(newFlipV), prevRotate];

        this.executeMulticallAction(
            "verticalFlip", ["fliph", "flipv", "rotation"], xmlNode, values);
    };

    /**
     * Wether to mirror the block over the horizontal axis. This is an action.
     * It's possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Number}       newFlipV  new flip value, default is false
     *     Possible values:
     *     true    block element is fliped
     *     false   block element is not fliped
     */
    this.flipHorizontal = function(xmlNode, newFlipH) {
        var prevFlipV  = this.applyRuleSetOnNode("flipv", xmlNode) == "true"
                ? true
                : false,
            prevFlipH  = this.applyRuleSetOnNode("fliph", xmlNode) == "true"
                ? true
                : false,
            prevRotate = this.applyRuleSetOnNode("rotation", xmlNode)
                ? parseInt(this.applyRuleSetOnNode("rotation", xmlNode))
                : 0;

        var values = prevFlipV && newFlipH
            ? ["false", "false", (prevRotate + 180) % 360]
            : [String(newFlipH), String(prevFlipV), prevRotate];

        this.executeMulticallAction(
            "horizontalFlip", ["fliph", "flipv", "rotation"], xmlNode, values);
    };

    /**
     * Resize block element in vertical and horiznontal plane. This is an
     * action. It's possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   xmlNode     xml representation of block element
     * @param {Number}       newWidth    block element horizontal size
     * @param {Number}       newHeight   block element vertical size
     * @param {Number}       newTop      vertical position of block element
     * @param {Number}       newLeft     horizontal position of block element
     */
    this.resize = function(xmlNode, newWidth, newHeight, newTop, newLeft) {
            this.executeMulticallAction(
                "resize",
                ["top", "left", "width", "height"],
                xmlNode,
                [newTop, newLeft, newWidth, newHeight]);
    };

    /**
     * Executes an actions based on the set names and the new values
     * 
     * @param {String}      atName     the name of action rule defined in j:actions for this element.
     * @param {Object}      setNames   the names list of the binding rule defined in j:bindings for this element.
     * @type {String}
     * @param {XMLElement}  xmlNode    the xml representation of element to which rules are applied
     * @param {Object}      values     the new values list of the node
     * @type {String}
     */
    this.executeMulticallAction = function(atName, setNames, xmlNode, values) {
        var props = changes = [], l = setNames.length;
        for (var i = 0; i < l; i++) {
            var node = this.getNodeFromRule(setNames[i], xmlNode, false, false,
                                            this.createModel),
                value = values[i];

            if (node) {
                var atAction = node.nodeType == 1 || node.nodeType == 3
                            || node.nodeType == 4
                    ? "setTextNode"
                    : "setAttribute";
                var args = node.nodeType == 1
                    ? [node, value] 
                    : (node.nodeType == 3 || node.nodeType == 4
                        ? [node.parentNode, value] 
                        : [node.ownerElement || node.selectSingleNode(".."),
                           node.nodeName, value]);
                changes.push({
                    func: atAction,
                    args: args
                });
            }
        }
        this.executeAction("multicall", changes, atName, xmlNode);
    }

    /**
     * Creates new connection between two blocks. This is an action. It's
     * possible to return to previous state with Undo/Redo.
     * 
     * @param {XMLElement}   sXmlNode   xml representation of source block element
     * @param {Number}       sInput     source block input number
     * @param {XMLElement}   dXmlNode   xml representation of destination block element
     * @param {Number}       dInput     destination block output number
     */
    this.addConnector = function(sXmlNode, sInput, dXmlNode, dInput) {
        var nXmlNode = _self.xmlRoot.ownerDocument.createElement("connection");

        nXmlNode.setAttribute("ref", _self.applyRuleSetOnNode("id", dXmlNode));
        nXmlNode.setAttribute("output", sInput);
        nXmlNode.setAttribute("input", dInput);

        this.executeAction("appendChild", [sXmlNode, nXmlNode],
                           "addConnector", sXmlNode);
    };

    /**
     * Removes connections between blocks. It's possible to remove more
     * connections in one call. This is an action. It's possible to return
     * to previous state with Undo/Redo.
     * 
     * @param {Object} xmlNodeArray   xml representations of connections elements
     */
    this.removeConnectors = function(xmlNodeArray) {
        var changes = [];

        for (var i = 0, l = xmlNodeArray.length; i < l; i++) {
            changes.push({
                func : "removeNode",
                args : [xmlNodeArray[i]]
            });
        }

        this.executeAction("multicall", changes,
                           "removeConnectors", xmlNodeArray[0]);
    };

    /**
     * Creates new xml representation of block element
     * 
     * @param {XMLElement}   parentXmlNode   xml representation of block parent node
     * @param {Number}       left            horizontal position of block element
     * @param {Number}       top             vertical position of block element
     * @param {String}       type            name of block with special abilities, which could be set in template file
     * @param {Number}       width           block element horizontal size
     * @param {Number}       height          block element vertical size
     * @param {String}       id              unique block element name
     */
    this.addBlock = function(type, left, top, caption) {
        if (!type)
            return;

        var elTemplate = template.selectSingleNode("//element[@type='" + type + "']");

        if (!elTemplate)
            return;

        var nXmlNode = this.xmlRoot.ownerDocument.createElement("block");

        nXmlNode.setAttribute("id", "b"+(lastBlockId + 1));
        nXmlNode.setAttribute("left", left || 20);
        nXmlNode.setAttribute("top", top || 20);
        nXmlNode.setAttribute("width", elTemplate.getAttribute("dwidth"));
        nXmlNode.setAttribute("height", elTemplate.getAttribute("dheight"));
        nXmlNode.setAttribute("type", type);
        nXmlNode.setAttribute("caption", caption);

        this.executeAction("appendChild", [this.xmlRoot, nXmlNode],
                           "addBlock", this.xmlRoot);
    };

    /**
     * Removes xml representation of block. It's possible to remove more
     * xmlNodes in one call. This is an action. It's possible to return to
     * previous state with Undo/Redo.
     * 
     * @param {Object}   xmlNodeArray   xml representations of blocks elements
     */
    this.removeBlocks = function(xmlNodeArray) {
        var changes = [];
        var ids     = [];

        for (var i = 0, l = xmlNodeArray.length; i < l; i++) {
            var id = this.applyRuleSetOnNode("id", xmlNodeArray[i]);
            ids.push(id);
            //objBlocks[id].destroy();

            changes.push({
                func : "removeNode",
                args : [xmlNodeArray[i]]
            });

            //delete objBlocks[id];
            //delete xmlBlocks[id];

            //delete xmlConnections[id];
        }

        /* Removing connections from other blocks */
        for (var id2 in xmlConnections) {
            for(var j = xmlConnections[id2].length - 1; j >= 0 ; j--) {
                for (var k = 0; k < ids.length; k++) {
                    if (xmlConnections[id2][j].ref == ids[k]) {
                        changes.push({
                            func : "removeNode",
                            args : [xmlConnections[id2][j].xmlNode]
                        });
                        
                    }
                }
            //xmlConnections[id2].removeIndex(j);
            }
        }

        this.executeAction("multicall", changes,
                           "removeBlocksWithConnections", xmlNodeArray);
    };

    this.$draw = function() {
        //Build Main Skin
        this.oExt        = this.$getExternal();
        this.oInt        = this.$getLayoutNode("main", "container", this.oExt);

        /*this.oInt.onmousedown =
        this.oInt.onclick = function(e) {
            e = e || event;
            var t = e.target || e.srcElement;
            if (t.className) {
                var id = _self.selected.getAttribute("id");
                var objBlock = objBlocks[id];
                _self.$deselect(objBlock.htmlElement);
            }
        }*/

        _self.objCanvas = new jpf.flow.getCanvas(this.oInt);
        jpf.flow.init();

        /* Set top/left to xmlNode (automaticly call to _updateModifier function ) */
        /*_self.objCanvas.onblockmove = function(htmlBlock) {
            var xmlNode = jpf.xmldb.getNode(htmlBlock);
            _self.moveTo(xmlNode, 0, 0);
        }*/
    };

    this.$deInitNode = function(xmlNode, htmlNode) {
        var id = this.applyRuleSetOnNode("id", xmlNode);

        objBlocks[id].destroy();

        delete objBlocks[id];
        delete xmlBlocks[id];
        htmlNode.parentNode.removeChild(htmlNode);
        resizeManager.hide();
    }

    this.$updateModifier = function(xmlNode, htmlNode) {
        var blockId = this.applyRuleSetOnNode("id", xmlNode);
//alert("update")
        //htmlNode.style.zIndex = (this.applyRuleSetOnNode("zindex", xmlNode) || 1001);

        objBlock = objBlocks[blockId];

        var t = parseInt(this.applyRuleSetOnNode("top", xmlNode))
                ? this.applyRuleSetOnNode("top", xmlNode)
                : parseInt(objBlock.htmlElement.style.top),
            l = parseInt(this.applyRuleSetOnNode("left", xmlNode))
                ? this.applyRuleSetOnNode("left", xmlNode)
                : parseInt(objBlock.htmlElement.style.left);

        objBlock.moveTo(t, l);

        var w = parseInt(this.applyRuleSetOnNode("width", xmlNode))
                ? this.applyRuleSetOnNode("width", xmlNode)
                : objBlock.other.dwidth,
            h = parseInt(this.applyRuleSetOnNode("height", xmlNode))
                ? this.applyRuleSetOnNode("height", xmlNode)
                : objBlock.other.dheight;
        objBlock.resize(w, h);

        /* Rename */
       objBlock.setCaption(this.applyRuleSetOnNode("caption", xmlNode));

        /* Lock */
        var lock = this.applyRuleSetOnNode("lock", xmlNode) == "true"
            ? true
            : false;

        objBlock.setLock(lock);
        if (lock) {
            this.$setStyleClass(htmlNode, "locked", ["selected"]);
        }
        else {
            this.$setStyleClass(htmlNode, "selected", ["locked"]);
        }

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
                        var ConToDel = jpf.flow.findConnector(
                            objBlocks[blockId], cCurrent[i].output,
                            objBlocks[cCurrent[i].ref], cCurrent[i].input);
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
                    r.push({
                        ref : ref,
                        output : output,
                        input : input,
                        xmlNode : cNew[i]
                    });

                    new jpf.flow.addConnector(_self.objCanvas,
                        objBlocks[blockId], objBlocks[ref], {
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

        if (resizeManager && xmlNode == this.selected && !lock) {
            resizeManager.show();
        }
        else {
            resizeManager.hide();
        }

    }

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode) {
        /* Creating Block */
        lastBlockId++;
//alert("add")

        this.$getNewContext("block");
        var block            = this.$getLayoutNode("block");
        var elSelect         = this.$getLayoutNode("block", "select");
        var elImage          = this.$getLayoutNode("block", "image");
        var elimageContainer = this.$getLayoutNode("block", "imagecontainer");
        var elCaption        = this.$getLayoutNode("block", "caption");

        elCaption.setAttribute("onmouseup", 'jpf.lookup(' + this.uniqueId
            + ').$beforeRename(event); return false;');

        this.nodes.push(block);

        /* Set Css style */
        var style = [], style2 = [];
        var left = this.applyRuleSetOnNode("left", xmlNode) || 10;
        var top = this.applyRuleSetOnNode("top", xmlNode) || 10;
        var zindex = this.applyRuleSetOnNode("zindex", xmlNode) || 1001;

        style.push("z-index:" + zindex);
        style.push("left:" + left + "px");
        style.push("top:" + top + "px");

        if (template) {
            var elTemplate = template.selectSingleNode("//element[@type='"
                           + this.applyRuleSetOnNode("ttype", xmlNode)
                           + "']");
            if (elTemplate) {
                var stylesFromTemplate = elTemplate.getAttribute("css");

                if(stylesFromTemplate) {
                    stylesFromTemplate = stylesFromTemplate.split(";");
                    for (var k = 0; k < stylesFromTemplate.length; k++) {
                        if (stylesFromTemplate[k].trim() !== "") {
                            style.push(stylesFromTemplate[k].trim());
                        }
                    }
                }
                var w = elTemplate.getAttribute("dwidth");
                var h = elTemplate.getAttribute("dheight");
            }
        }

        if (this.applyRuleSetOnNode("id", xmlNode)) {
            var _id = this.applyRuleSetOnNode("id", xmlNode).substr(1);
            if (_id > lastBlockId) {
                lastBlockId = _id;
            }
        }

        var id = this.applyRuleSetOnNode("id", xmlNode) || "b"+lastBlockId;
        var width = this.applyRuleSetOnNode("width", xmlNode) || w || 56;
        var height = this.applyRuleSetOnNode("height", xmlNode) || h || 56;
        var lock = this.applyRuleSetOnNode("lock", xmlNode) || "false";
        
        style.push("width:" + width + "px");
        style.push("height:" + height + "px");

        /* Set styles to block */
        block.setAttribute("style", style.join(";"));

        style2.push("width:" + width + "px");
        style2.push("height:" + height + "px");

        /* Set styles to image container */
        elImage.setAttribute("style", style2.join(";"));
        elimageContainer.setAttribute("style", style2.join(";"));
        /* End - Set Css style */


        xmlNode.setAttribute("id", id);
        xmlNode.setAttribute("width", width);
        xmlNode.setAttribute("height", height);
        xmlNode.setAttribute("lock", lock);
        xmlNode.setAttribute("left", left);
        xmlNode.setAttribute("top", top);
        xmlNode.setAttribute("zindex", zindex);

        elSelect.setAttribute(this.itemSelectEvent || 
            "onmousedown", 'var o = jpf.lookup('
            + this.uniqueId 
            + '); o.select(this, event.ctrlKey, event.shiftKey)');

        jpf.xmldb.nodeConnect(this.documentId, xmlNode, block, this);
        xmlBlocks[id] = xmlNode;

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
            xmlConnections[id] = r;
        }

    };

    this.$fill = function() {
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
//alert("fill")
        for (var id in xmlBlocks) {
            var xmlBlock = xmlBlocks[id],
                htmlElement = jpf.xmldb.findHTMLNode(xmlBlock, this),
                type = xmlBlocks[id].getAttribute("type") || null,
                inputList = {};

//jpf.flow.alert_r(xmlBlock.getAttribute("id"));
//jpf.flow.alert_r(htmlElement);

            if (type) {
                if (template) {
                    var elTemplate = template.selectSingleNode("//element[@type='"
                                   + this.applyRuleSetOnNode("ttype", xmlBlock)
                                   + "']");

                    var inputs = elTemplate.selectNodes("input");
                    for (var i = 0, l = inputs.length; i < l; i++) {
                        inputList[parseInt(inputs[i].getAttribute("name"))] = {
                            x        : parseInt(inputs[i].getAttribute("x")),
                            y        : parseInt(inputs[i].getAttribute("y")),
                            position : inputs[i].getAttribute("position")
                        };
                    }
                }
            }

            var lock = this.applyRuleSetOnNode("lock", xmlBlock) == "true"
                ? true
                : false;
            var other = {
                lock : lock,
                flipv : this.applyRuleSetOnNode("flipv", xmlBlock) == "true"
                    ? true
                    : false,
                fliph : this.applyRuleSetOnNode("fliph", xmlBlock) == "true"
                    ? true
                    : false,
                rotation : parseInt(this.applyRuleSetOnNode("rotation", xmlBlock))
                           || 0,
                inputList : inputList,
                type : type,
                picture : type && template
                    ? elTemplate.getAttribute("picture")
                    : null,
                dwidth : type && template
                    ? parseInt(elTemplate.getAttribute("dwidth"))
                    : 56,
                dheight : type && template
                    ? parseInt(elTemplate.getAttribute("dheight"))
                    : 56,
                scalex : type && template
                    ? (elTemplate.getAttribute("scalex") == "true"
                        ? true
                        : false)
                    : true,
                scaley : type && template
                    ? (elTemplate.getAttribute("scaley") == "true"
                        ? true
                        : false)
                    : true,
                scaleratio : type && template
                    ? (elTemplate.getAttribute("scaleratio") == "true"
                        ? true
                        : false)
                    : false,
                xmlNode : xmlBlock,
                caption : this.applyRuleSetOnNode("caption", xmlBlock)
            }
            
            var objBlock = jpf.flow.isBlock(htmlElement);
            
            if (objBlock) {
                this.$setStyleClass(htmlElement, "", ["empty"]);
                objBlock.other = other;
                objBlock.initBlock();
            }
            else {
                var objBlock = jpf.flow.addBlock(htmlElement, _self.objCanvas, other);
                if (objBlock) {
                    objBlock.setLock(lock);
                    objBlock.oncreateconnection = function(sXmlNode, sInput,
                                                           dXmlNode, dInput) {
                        _self.addConnector(sXmlNode, sInput, dXmlNode, dInput);
                    };
                    objBlock.onremoveconnection = function(xmlNodeArray) {
                        _self.removeConnectors(xmlNodeArray);
                    };
                    
                    if (lock) {
                        this.$setStyleClass(htmlElement, "locked");
                    }
                    objBlocks[id] = objBlock;
                }
            }
        }

        for (var id in xmlBlocks) {
            var c = xmlConnections[id] || [];
            //alert(id)
            //jpf.flow.alert_r(c)
            for (var i = 0, l = c.length; i < l; i++) {
                var con = jpf.flow.findConnector(objBlocks[id], c[i].output,
                                                 objBlocks[c[i].ref], c[i].input);

                if (!con) {
                    //jpf.flow.alert_r(objBlocks[id]);
                    //jpf.flow.alert_r(objBlocks[c[i].ref]);
                    //alert(id +" "+c[i].ref)

                    if (objBlocks[id] && objBlocks[c[i].ref]) {
                        new jpf.flow.addConnector(_self.objCanvas, objBlocks[id],
                                                  objBlocks[c[i].ref], {
                            output  : c[i].output,
                            input   : c[i].input,
                            xmlNode : c[i].xmlNode
                        });
                    }
                    else {
                        connToPaint.push({
                            id : id,
                            id2 : c[i].ref,
                            output : c[i].output,
                            input : c[i].input,
                            xmlNode : c[i].xmlNode
                        });
                    }
                }
                else {
                    con.connector.other = {
                        output  : c[i].output,
                        input   : c[i].input,
                        xmlNode : c[i].xmlNode
                    };
                    con.connector.activateInputs();
                    con.connector.draw();
                }
            }
        }

        /* Try to draw rest of connections */
        for (var i = connToPaint.length-1; i >= 0 ; i--) {
            if (objBlocks[connToPaint[i].id] && objBlocks[connToPaint[i].id2]) {
                new jpf.flow.addConnector(_self.objCanvas,
                                          objBlocks[connToPaint[i].id],
                                          objBlocks[connToPaint[i].id2], {
                    output  : connToPaint[i].output,
                    input   : connToPaint[i].input,
                    xmlNode : connToPaint[i].xmlNode
                    });
                connToPaint.removeIndex(i);
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
        jpf.getData(this.$jml.getAttribute("template"), null, null,
                    function(data, state, extra) {
            if (state == jpf.SUCCESS){
                _self.loadTemplate(data);
            }
            else {
                jpf.console.info("An error has occurred: " + extra.message, 2);
                return;
            }
        });

        /* Resize */
        resizeManager = new jpf.resize();

        resizeManager.onresizedone = function(w, h, t , l) {
            _self.resize(_self.selected, w, h, t, l);
            objBlock.updateOutputs();
            objBlock.onMove();
            //jpf.flow.isdraged = false;
        };

        resizeManager.onresize = function(htmlElement) {
            if(!htmlElement)
                return;
            var objBlock = jpf.flow.isBlock(htmlElement);            
            objBlock.updateOutputs();
            objBlock.onMove();
        };

        /*resizeManager.onbeforeresize = function(htmlElement) {
            jpf.flow.isdraged = true;
            var objBlock = jpf.flow.isBlock(htmlElement);
            objBlock.onbeforeresize();
        };*/

        /*jpf.flow.onbeforemove = function() {
            resizeManager.hide();
        };*/

        jpf.flow.onaftermove = function(dt, dl) {
            _self.moveTo(_self.selected, dl, dt);
            /*resizeManager.show();*/
        };
        
        jpf.flow.onblockmove = function() {
            resizeManager.show();
        };
    };

    this.loadTemplate = function(data) {
        template = jpf.xmldb.getBindXmlNode(data);
        this.$checkLoadQueue();
    };

    this.$canLoadData = function() {
        return template ? true : false;
    };

}).implement(
    jpf.Presentation,
    jpf.DataBinding,
    jpf.Cache,
    jpf.MultiSelect,
    jpf.BaseList,
    jpf.Rename,
    jpf.DragDrop
);
//#endif