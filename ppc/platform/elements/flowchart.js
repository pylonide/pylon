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

// #ifdef __AMLFLOWCHART || __INC_ALL
/**
 * Element with which you can add and remove graphical blocks and create 
 * connections between them. Block could be rotated, flipped, resized, 
 * renamed, locked and moved.
 *
 * Example:
 * Flowchart component
 * <code>
 *  <a:model id="modelName">
 *      <flowchart>
 *          <block
 *            id     = "b1"
 *            type   = "current_source_cc"
 *            left   = "500"
 *            top    = "520" 
 *            width  = "56"
 *            height = "56"
 *            lock   = "false"
 *            flipv  = "true"
 *            fliph  = "false">
 *          </block>
 *          <block
 *            id     = "b5" 
 *            type   = "mosfet_p" 
 *            left   = "800" 
 *            top    = "400" 
 *            width  = "56" 
 *            height = "56" 
 *            lock   = "0">
 *              <connection value="b1" output="3" input="3" />
 *          </block>
 *      </flowchart>
 *  </a:model>
 *  <a:flowchart id="WF" template="template.xml" model="modelName">
 *      <a:each match="[block]">
 *          <a:move match="[@move] != false &amp;&amp; [@lock] != true"></a:move>
 *          <a:resize match="[@resize] == true &amp;&amp; [@lock] != true"></a:resize>
 *          <a:css match="{true}" default="locked"></a:css>
 *          <a:left match="[@left]"></a:left>
 *          <a:top match="[@top]"></a:top>
 *          <a:id match="[@id]"></a:id>
 *          <a:width match="[@width]"></a:width>
 *          <a:height match="[@height]"></a:height>
 *          <a:flipv match="[@flipv]"></a:flipv>
 *          <a:fliph match="[@fliph]"></a:fliph>
 *          <a:rotation match="[@rotation]"></a:rotation>
 *          <a:lock match="[@lock]"></a:lock>
 *          <a:type match="[@type]"></a:type>
 *          <a:caption match="[@caption]" default="Untitled block"></a:caption>
 *          <a:cap-pos match="[@cap-pos]"></a:cap-pos>
 *          <a:zindex match="[@zindex]"></a:zindex>
 *          <a:image match="[@src]"></a:image>
 *
 *          <!-- Connection Binding Rules -->
 *          <a:connection match="[block/connection]"></a:connection>
 *          <a:ref match="[@ref]"></a:ref>
 *          <a:blockinput match="[@input]"></a:blockinput>
 *          <a:blockoutput match="[@output]"></a:blockoutput>
 *          <a:blocklabel match="[@label]"></a:blocklabel>
 *      </a:each>
 *  </a:flowchart>
 * </code>
 *
 * @define flowchart
 * @attribute {String} template   the data instruction to load the xml for the
 * template that defines all the elements which are available on the flowchart.
 * 
 * @attribute {String} snap   snap block to grid; Default is false
 * Possible values:
 *     true       Block is snap to grid; @see grid-width, @see grid-height
 *     false      Block is not snap to grid;
 *     {Number}   Block is snap to grid; Grid size is equal to this value
 * 
 * @attribute {Number} grid-width    horizontal grid size, Default is 48px
 * @attribute {Number} grid-height   vertical grid size, Default is 48px
 * 
 * Example:
 * A template describing a single capacitor element
 * <code>
 *  <template>
 *      <element type = "capacitor"
 *        picture     = "elements/capacitor.png"
 *        dwidth      = "56"
 *        dheight     = "56"
 *        scaley      = "false"
 *        scalex      = "false"
 *        scaleratio  = "true">
 *          <input
 *            x        = "28"
 *            y        = "0"
 *            position = "top"
 *            name     = "1" />
 *          <input 
 *            x        = "28"
 *            y        = "56"
 *            position = "bottom"
 *            name     = "2" />
 *      </element>
 *  </template>
 * </code>
 *
 * @binding lock    immobilize block element on workarea, default is false.
 * Possible values:
 *     false   block element is not immobilized
 *     true    block element is immobilized
 * @binding fliph   Determines whether to mirror the block over the horizontal axis, default is false
 * Possible values:
 *     true    block element is flipped
 *     false   block element is not flipped
 * @binding flipv   Determines whether to mirror the block over the vertical axis, default is false
 * Possible values:
 *     true    block element is flipped
 *     false   block element is not flipped
 * @binding rotation   the rotation in degrees clockwise, default is 0
 * Possible values:
 *     0       0   degrees rotation
 *     90     90   degrees rotation
 *     180   180   degrees rotation
 *     270   270   degrees rotation
 * @binding id          Determines unique name
 * @binding image       Determines path to background image file 
 * @binding width       Determines horizontal size
 * @binding height      Determines vertical size
 * @binding type        Determines name of block with special abilities, which can be defined in separate file
 * @binding zindex      Determines z-index number
 * @binding left        Determines horizontal position
 * @binding top         Determines vertical position
 * 
 * @binding connection  Determines xml representation of connection element
 * @binding ref         Determines unique name of destination block which will be connected with source block
 * @binding blockinput  Determines input number of source block 
 * @binding blockoutput Determines input number of destination block
 * @binding blocklabel  Specifies a description of the block
 *
 * @constructor
 *
 * @inherits apf.DataAction
 * @inherits apf.Cache
 * @inherits apf.BaseList
 * @inherits apf.Rename
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 */
apf.flowchart = function(struct, tagName){
    this.$init(tagName || "flowchart", apf.NODE_VISIBLE, struct);
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction,
        //#endif
        //#ifdef __WITH_CACHE
        apf.Cache,
        //#endif
        apf.Rename
    );

    this.objCanvas    = null;
    this.nodes        = [];
    this.snap         = false;
    this.gridW        = 48;
    this.gridH        = 48;

    this.$flowVars     = {
        lastBlockId   : 0,
        template      : null,
        //torename      = null,
        resizeManager : null,

        xmlBlocks     : {},
        objBlocks     : {},
        xmlConnections: {},
        connToPaint   : []
    };

    this.$init(function() {
        var _self = this;
        var onkeydown_ = function(e) {
            e = (e || event);

            var key      = e.keyCode,
                ctrlKey  = e.ctrlKey,
                shiftKey = e.shiftKey,
                sel      = this.getSelection(),
                value    = this.snap 
                    ? ((key == 37 || key == 39 
                        ? this.gridW 
                        : (key == 38 || key == 40 
                            ? this.gridH 
                            : 0)) * (ctrlKey 
                                         ? 2 
                                         : (shiftKey 
                                             ? 3 
                                             : 1)))
                    : (ctrlKey 
                        ? 10 
                        : (shiftKey 
                            ? 100 
                            : 1)),
                disabled = _self.objCanvas.disableremove;

            if (!sel || disabled)
                return;

            switch (key) {
                case 37:
                    //Left Arrow
                    this.moveTo(sel, - value, 0);
                    break;
                case 38:
                    //Top Arrow
                    this.moveTo(sel, 0, - value);
                    break;
                case 39:
                    //Right Arrow
                    this.moveTo(sel, value, 0);
                    break;
                case 40:
                    //Bottom Arrow
                    this.moveTo(sel, 0, value);
                    break;
                case 46:
                    //Delete
                    _self.$flowVars.resizeManager.hide();

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

            return false;
        }

        //#ifdef __WITH_KEYBOARD
        this.addEventListener("keydown", onkeydown_, true);

        apf.addEventListener("contextmenu", function() {return false;});
        //#endif

        function $afterRenameMode() {
           _self.objCanvas.disableremove = false;
        }
        this.addEventListener("afterrename", $afterRenameMode);
        this.addEventListener("stoprename", $afterRenameMode);
    });
    
    this.$propHandlers["snap"] = function(value) {
        var isNumber = parseInt(value) > 0 ? true : false
        
        this.snap = this.objCanvas.snap = value == "true" || isNumber 
            ? true 
            : false;

        if (isNumber) {
            this.gridW = this.objCanvas.gridW = parseInt(value);
            this.gridH = this.objCanvas.gridH = parseInt(value);
        }
    }
    
    this.$propHandlers["grid-width"] = function(value) {
        this.gridW = this.objCanvas.gridW = parseInt(value);
    }
    
    this.$propHandlers["grid-height"] = function(value) {
        this.gridH = this.objCanvas.gridH = parseInt(value);
    }

    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function() {
        var objBlock = this.$flowVars.objBlocks[this.$applyBindRule("id", this.selected)];
        if (!objBlock)
            return;
        return objBlock.caption;
    };
    // #endif

    this.$beforeRename = function(e, userAction) {
        if (userAction && this.disabled)
            return;
        
        e = e || event;
        var target = e.srcElement || e.target;
        this.$selectCaption(target);

        this.objCanvas.disableremove = true;
        this.$deselectCaption(target);
        this.startRename();

        var rename_input = this.$pHtmlDoc.getElementById("txt_rename");
        this.$setStyleClass(rename_input, target.className);

        var c = rename_input;
        if ((target.className || "").indexOf("inside") != -1) {
            if (c.offsetHeight !== 0) {

                c.style.marginTop =
                    "-" + (Math.ceil(c.offsetHeight / 2)) + "px";
            }
        }

        return false;
    };


    this.$selectCaption = function(o) {
        if (!o || o.nodeType != 1) return;
        this.$setStyleClass(o, "selected");
    };

    this.$deselectCaption = function(o) {
        if (!o || o.nodeType != 1) return;
        this.$setStyleClass(o, "", ["selected"]);
    };

    this.$select = function(o) {
        if (!o)
            return;

        var objBlock = apf.flow.isBlock(o);

        if (objBlock) {
            if (this.$flowVars.resizeManager) {
                var prop = objBlock.other;

                if (prop.lock == 1)
                    return;

                this.$flowVars.resizeManager.grab(o, {
                    scalex     : prop.scalex,
                    scaley     : prop.scaley,
                    scaleratio : prop.scaleratio,
                    dwidth     : prop.dwidth,
                    dheight    : prop.dheight,
                    ratio      : prop.ratio,
                    snap       : this.snap,
                    gridH      : this.gridH,
                    gridW      : this.gridW
                });
            }
            this.$setStyleClass(o, "selected");

            if (objBlock.other.capPos !== "inside")
                this.$selectCaption(objBlock.caption);
        }
    };

    this.$deselect = function(o) {
        if (!o)
            return;
        this.$setStyleClass(o, "", ["selected"]);

        var objBlock = apf.flow.isBlock(o);
        if (!objBlock) return; //it might have been deleted recently...
        this.$deselectCaption(objBlock.caption);

        this.$flowVars.resizeManager.hide();
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

    /**
     * Updates the position of a block to vector [x, y] and the XML it is bound 
     * to. It's possible to back to previous state with Undo/Redo.
     * 
     * @param {Object} xmlNodeArray   array with xml representations of blocks elements
     * @param {Number} dl             horizontal alteration
     * @param {Number} dt             vertical alteration
     */
    this.moveTo = function(xmlNodeArray, dl, dt) {
        if(!xmlNodeArray) return;

        if (!xmlNodeArray.length)
            xmlNodeArray = [xmlNodeArray];

        var changes = [],
            setNames = ["top", "left"],
            node, value, i, l, j;
        for (i = 0, l = xmlNodeArray.length; i < l; i++) {
            for (j = 0; j < setNames.length; j++) {
                node = this.$getDataNode(
                  setNames[j], xmlNodeArray[i], this.$createModel);
                value = (setNames[j] == "left" ? dl : dt) 
                  + (parseInt(this.$applyBindRule(setNames[j], xmlNodeArray[i])) || 0);

                if (this.snap) {
                    var gridSize = setNames[j] == "top" ? this.gridH : this.gridW;
                    value = Math.round(value / gridSize) * gridSize;
                }

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
                        action: atAction,
                        args  : args
                    });
                }
            }
        }

        this.$executeAction("multicall", changes, "moveTo", xmlNodeArray);
    };

    /**
     * Set a new z-index of a block and the XML it is bound to. It's
     * possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement} xmlNode   xml representation of block element
     * @param {Number}     value     new z-index number
     */
    this.setZindex = function(xmlNode, value) {
        this.$executeSingleValue("setzindex", "zindex", xmlNode, value);
    };

    /**
     * Sets mode to canvas object. Modes adds new features. For example,
     * if connection-change mode is active, deleting connections
     * between blocks is possible. 
     * 
     * @private
     * @param {String} mode   Operations mode
     * 
     * Possible values:
     *     normal              all operations are allowed except operations from different modes
     *     connection-add      it's possible to add new connection between blocks, all operations from "normal" mode its allowed
     *     connection-change   it's possible to change existing connection, all operations from "normal" mode its allowed
     */
    this.setMode = function(mode) {
        this.objCanvas.setMode(mode);
    };

    /**
     * Returns current mode type. Modes adds new features. For example,
     * if connection-change mode is active, possible is deleting connections
     * between blocks. 
     * 
     * @private
     * @return {String} Operation mode
     * 
     * Possible values:
     *     normal             all operations are allowed except operations from different modes
     *     connection-add     it's possible to add new connection between blocks, all operations from "normal" mode its allowed
     *     connection-change  it's possible to change existing connection, all operations from "normal" mode its allowed
     *
     * 
     */
    this.getMode = function() {
        return this.objCanvas.getMode();
    };

    /**
     * Immobilise block element on workarea. This is an action.
     * It's possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement} xmlNode   xml representation of block element
     * @param {Boolean}    value     prohibit block move, default is false.
     * Possible values:
     *     true    block is locked
     *     false   block is unlocked
     */
    this.setLock = function(xmlNode, value) {
        this.$executeSingleValue("setlock", "lock", xmlNode, String(value));
    };

    /**
     * Rotate block element. This is an action. It's possible to back to
     * previous state with Undo/Redo
     *
     * @param {XMLElement}   xmlNode       xml representation of block element
     * @param {Number}       newRotation   the rotation in degrees clockwise, default is 0
     * Possible values:
     *     0       0 degrees rotation
     *     90     90 degrees rotation
     *     180   180 degrees rotation
     *     270   270 degrees rotation
     */
    this.rotate = function(xmlNode, newRotation/*, start*/) {
        var prevFlipV = this.$applyBindRule("flipv", xmlNode) == "true"
                ? true
                : false,
            prevFlipH = this.$applyBindRule("fliph", xmlNode) == "true"
                ? true
                : false,
            prevRotation = parseInt(this.$applyBindRule("rotation", xmlNode)) || 0,

            names = ["fliph", "flipv", "rotation"],
            values;

        if (prevFlipV && prevFlipH) {
            values = ["false", "false", (newRotation + 180) % 360];
        }
        else {
            values = [String(prevFlipH), String(prevFlipV), newRotation];

            if (Math.abs(newRotation - prevRotation) % 180 !== 0) {
                var
                w = parseInt(this.$applyBindRule("width", xmlNode)) || 0,
                h = parseInt(this.$applyBindRule("height", xmlNode)) || 0;

                names.push("width", "height");
                values.push(h, w);
            }
        }

        this.$executeMulticallAction("rotate", names, xmlNode, values);
    };

    /**
     * Mirrors the block over the vertical axis. This is an action.
     * It's possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Number}       newFlipV  new flip value, default is false
     * Possible values:
     *     true    block element is flipped
     *     false   block element is not flipped
     */
    this.flipVertical = function(xmlNode, newFlipV) {
        var prevFlipH  = this.$applyBindRule("fliph", xmlNode) == "true"
                ? true
                : false,
            prevRotate = this.$applyBindRule("rotation", xmlNode)
                ? parseInt(this.$applyBindRule("rotation", xmlNode))
                : 0;

        var values = prevFlipH && newFlipV
            ? ["false", "false", (prevRotate + 180) % 360]
            : [String(prevFlipH), String(newFlipV), prevRotate];

        this.$executeMulticallAction(
            "verticalFlip", ["fliph", "flipv", "rotation"], xmlNode, values);
    };

    /**
     * Mirrors the block over the horizontal axis. This is an action.
     * It's possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement}   xmlNode   xml representation of block element
     * @param {Number}       newFlipH  new flip value, default is false
     * Possible values:
     *     true    block element is flipped
     *     false   block element is not flipped
     */
    this.flipHorizontal = function(xmlNode, newFlipH) {
        var prevFlipV  = this.$applyBindRule("flipv", xmlNode) == "true"
                ? true
                : false,

            prevRotate = this.$applyBindRule("rotation", xmlNode)
                ? parseInt(this.$applyBindRule("rotation", xmlNode))
                : 0;

        var values = prevFlipV && newFlipH
            ? ["false", "false", (prevRotate + 180) % 360]
            : [String(newFlipH), String(prevFlipV), prevRotate];

        this.$executeMulticallAction(
            "horizontalFlip", ["fliph", "flipv", "rotation"], xmlNode, values);
    };

    /**
     * Resize block element in vertical and horizontal plane. This is an
     * action. It's possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement}   xmlNode     xml representation of block element
     * @param {Number}       newWidth    block element horizontal size
     * @param {Number}       newHeight   block element vertical size
     * @param {Number}       newTop      vertical position of block element
     * @param {Number}       newLeft     horizontal position of block element
     */
    this.resize = function(xmlNode, newWidth, newHeight, newTop, newLeft) {
        this.$executeMulticallAction(
            "resize",
            ["top", "left", "width", "height"],
            xmlNode,
            [newTop, newLeft, newWidth, newHeight]);
    };

    /**
     * Executes multi actions on one element in one call
     *
     * @param {String}      atName     the name of action rule defined in actions for this element.
     * @param {Object}      setNames   the names list of the binding rule defined in bindings for this element.
     * @type {String}
     * @param {XMLElement}  xmlNode    the xml representation of element to which rules are applied
     * @param {Object}      values     the new values list of the node
     * @type {String}
     */
    this.$executeMulticallAction = function(atName, setNames, xmlNode, values) {
        var i, node, value, atAction, args,
            changes = [],
            l       = setNames.length;
        for (i = 0; i < l; i++) {
            node = this.$getDataNode(
              setNames[i], xmlNode, this.$createModel);
            value = values[i];

            if (node) {
                atAction = node.nodeType == 1 || node.nodeType == 3
                            || node.nodeType == 4
                    ? "setTextNode"
                    : "setAttribute";
                args = node.nodeType == 1
                    ? [node, value]
                    : (node.nodeType == 3 || node.nodeType == 4
                        ? [node.parentNode, value]
                        : [node.ownerElement || node.selectSingleNode(".."),
                           node.nodeName, value]);
                changes.push({
                    action: atAction,
                    args  : args
                });
            }
        }
        this.$executeAction("multicall", changes, atName, xmlNode);
    };

    /**
     * Creates new connection between two blocks. This is an action. It's
     * possible to back to previous state with Undo/Redo.
     *
     * @param {XMLElement}   sXmlNode   xml representation of source block element
     * @param {Number}       sInput     source block input number
     * @param {XMLElement}   dXmlNode   xml representation of destination block element
     * @param {Number}       dInput     destination block output number
     */
    this.addConnector = function(sXmlNode, sInput, dXmlNode, dInput) {
        var nXmlNode = this.xmlRoot.ownerDocument.createElement("connection");

        nXmlNode.setAttribute("ref", this.$applyBindRule("id", dXmlNode));
        nXmlNode.setAttribute("output", sInput);
        nXmlNode.setAttribute("input", dInput);

        this.$executeAction("appendChild", [sXmlNode, nXmlNode],
                           "addConnector", sXmlNode);
    };

    /**
     * Removes connections between blocks. It's possible to remove more
     * connections in one call. This is an action. It's possible to back
     * to previous state with Undo/Redo.
     *
     * @param {Object} xmlNodeArray   xml representations of connections elements
     */
    this.removeConnectors = function(xmlNodeArray) {
        var changes = [],
            i       = 0,
            l       = xmlNodeArray.length;

        for (; i < l; i++) {
            changes.push({
                action : "removeNode",
                args   : [xmlNodeArray[i]]
            });
        }

        this.$executeAction("multicall", changes,
                           "removeConnectors", xmlNodeArray[0]);
    };

    /**
     * Creates new xml representation of block element
     *
     * @param {XMLElement}   parentXmlNode   xml representation of block parent node
     * @param {Number}       left            horizontal position
     * @param {Number}       top             vertical position
     * @param {String}       type            determines name of block with special abilities, which can be defined in separate file
     * @param {Number}       width           horizontal size
     * @param {Number}       height          vertical size
     * @param {String}       id              unique name
     */
    this.addBlock = function(type, left, top, caption) {
        if (!type)
            return;

        var elTemplate = this.$flowVars.template
            .selectSingleNode("//element[@type='" + type + "']");

        if (!elTemplate)
            return;

        var nXmlNode = this.xmlRoot.ownerDocument.createElement("block");

        nXmlNode.setAttribute("id",      "b" + (this.$flowVars.lastBlockId + 1));
        nXmlNode.setAttribute("left",    left || 20);
        nXmlNode.setAttribute("top",     top || 20);
        nXmlNode.setAttribute("width",   elTemplate.getAttribute("dwidth"));
        nXmlNode.setAttribute("height",  elTemplate.getAttribute("dheight"));
        nXmlNode.setAttribute("type",    type);
        nXmlNode.setAttribute("caption", caption);

        this.$executeAction("appendChild", [this.xmlRoot, nXmlNode],
                            "addBlock", this.xmlRoot);
    };

    /**
     * Removes xml representation of block. It's possible to remove more
     * xmlNodes in one call. This is an action. It's possible to back to
     * previous state with Undo/Redo.
     *
     * @param {Object}   xmlNodeArray   xml representations of blocks elements
     */
    this.removeBlocks = function(xmlNodeArray) {
        var id, id2, j, k,
            changes = [],
            ids     = [],
            i       = 0,
            l       = xmlNodeArray.length;

        for (; i < l; i++) {
            id = this.$applyBindRule("id", xmlNodeArray[i]);
            ids.push(id);

            changes.push({
                action : "removeNode",
                args   : [xmlNodeArray[i]]
            });
        }

        /* Removing connections from other blocks */
        for (id2 in this.$flowVars.xmlConnections) {
            for (j = this.$flowVars.xmlConnections[id2].length - 1; j >= 0 ; j--) {
                for (k = 0, l = ids.length; k < l; k++) {
                    if (this.$flowVars.xmlConnections[id2][j].ref == ids[k]) {
                        changes.push({
                            action : "removeNode",
                            args   : [this.$flowVars.xmlConnections[id2][j].xmlNode]
                        });
                    }
                }
            }
        }

        this.$executeAction("multicall", changes,
                            "removeBlocksWithConnections", xmlNodeArray);
    };

    this.$draw = function() {
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$int = this.$getLayoutNode("main", "container", this.$ext);

        this.objCanvas = new apf.flow.getCanvas(this.$int);
        apf.flow.init();
        /*apf.flow.onconnectionrename = function(e) {
            _self.$beforeRename(e);
        }*/
    };

    /* Action when block is removed  */
    this.$deInitNode = function(xmlNode, htmlNode) {
        var id = this.$applyBindRule("id", xmlNode);

        this.$flowVars.objBlocks[id].destroy();

        delete this.$flowVars.objBlocks[id];
        delete this.$flowVars.xmlBlocks[id];
        htmlNode.parentNode.removeChild(htmlNode);
        this.$flowVars.resizeManager.hide();
    }

    //this.$dragdrop = function(el, dragdata, candrop) {
    this.addEventListener("dragdrop", function(e){
        var blockPos  = apf.getAbsolutePosition(e.indicator),
            canvasPos = apf.getAbsolutePosition(this.objCanvas.htmlElement);

        apf.setNodeValue(this.$getDataNode("top",  e.data[0], true), parseInt(e.top) - canvasPos[1]);
        apf.setNodeValue(this.$getDataNode("left", e.data[0], true), blockPos[0] - canvasPos[0]);
    });

    this.$updateModifier = function(xmlNode, htmlNode) {
        apf.console.info("UPDATE")
        
        var fv       = this.$flowVars,
            blockId  = this.$applyBindRule("id", xmlNode),
            objBlock = fv.objBlocks[blockId],

            t = parseInt(this.$applyBindRule("top", xmlNode))
                ? this.$applyBindRule("top", xmlNode)
                : parseInt(objBlock.htmlElement.style.top),
            l = parseInt(this.$applyBindRule("left", xmlNode))
                ? this.$applyBindRule("left", xmlNode)
                : parseInt(objBlock.htmlElement.style.left);

        objBlock.moveTo(t, l);

        var w = parseInt(this.$applyBindRule("width", xmlNode))
                ? this.$applyBindRule("width", xmlNode)
                : objBlock.other.dwidth,
            h = parseInt(this.$applyBindRule("height", xmlNode))
                ? this.$applyBindRule("height", xmlNode)
                : objBlock.other.dheight;
        objBlock.resize(w, h);

        /* Rename */
        objBlock.setCaption(this.$applyBindRule("caption", xmlNode));

        /* Lock */
        var lock = this.$applyBindRule("lock", xmlNode) == "true"
            ? true
            : false;

        objBlock.setLock(lock);

        objBlock.changeRotation(
            this.$applyBindRule("rotation", xmlNode),
            this.$applyBindRule("fliph", xmlNode),
            this.$applyBindRule("flipv", xmlNode)
        );

        /* Checking for changes in connections */
        var j, l2, found, ref, output, input, label, type,
            cNew     = this.$getDataNode("connection", xmlNode, null, null, true),
            cCurrent = fv.xmlConnections[blockId] || [],
            i        = 0;
        l = cCurrent.length;

        //Checking for removed connections
        if (cCurrent.length) {
            for (; i < l; i++) {
                for (j = 0, found = false, l2 = cNew.length; j < l2; j++) {
                    if (cCurrent[i].xmlNode == cNew[j]) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    if (fv.objBlocks[blockId] && fv.objBlocks[cCurrent[i].ref]) {
                        var ConToDel = apf.flow.findConnector(
                            fv.objBlocks[blockId], cCurrent[i].output,
                            fv.objBlocks[cCurrent[i].ref], cCurrent[i].input);
                        if (ConToDel)
                            apf.flow.removeConnector(ConToDel.connector.htmlElement);
                        fv.xmlConnections[blockId].removeIndex(i);
                    }
                }
            }
        }
        else {
            delete fv.xmlConnections[blockId];
        }

        //Checking for new connections
        for (i = 0, l = cNew.length; i < l; i++) {
            found = false;
            if (cCurrent) {
                for (j = 0, l2 = cCurrent.length; j < l2; j++) {
                    if (cCurrent[j].xmlNode == cNew[i]) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                ref    = this.$applyBindRule("ref", cNew[i]),
                output = this.$applyBindRule("blockoutput", cNew[i]),
                input  = this.$applyBindRule("blockinput", cNew[i]),
                label  = this.$applyBindRule("blocklabel", cNew[i]),
                type   = this.$applyBindRule("type", cNew[i]);

                if (fv.xmlBlocks[ref]) {
                    var r = fv.xmlConnections[blockId] || [];
                    r.push({
                        ref     : ref,
                        output  : output,
                        input   : input,
                        label   : label,
                        type    : type,
                        xmlNode : cNew[i]
                    });

                    new apf.flow.addConnector(this.objCanvas,
                        fv.objBlocks[blockId], fv.objBlocks[ref], {
                            output : output,
                            input  : input,
                            label  : label,
                            type   : type,
                            xmlNode: cNew[i]
                        }
                    );
                    fv.xmlConnections[blockId] = r;
                }
                else {
                    apf.console.info("Destination block doesn't exist.");
                }
            }
        }

        if (fv.resizeManager && xmlNode == this.selected && !lock)
            fv.resizeManager.show();
        else
            fv.resizeManager.hide();

        objBlock.updateOutputs();
        objBlock.onMove();
    };

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode) {
        /* Creating Block */
        this.$flowVars.lastBlockId++;
        
        apf.console.info("ADD");
        this.$getNewContext("item");
        var block            = this.$getLayoutNode("item"),
            elSelect         = this.$getLayoutNode("item", "select"),
            elImage          = this.$getLayoutNode("item", "image"),
            elimageContainer = this.$getLayoutNode("item", "imagecontainer"),
            elCaption        = this.$getLayoutNode("item", "caption");

        if (elCaption)
            elCaption.setAttribute("ondblclick", 'apf.lookup(' + this.$uniqueId
                + ').$beforeRename(event, true); return false;');

        this.nodes.push(block);

        /* Set Css style */
        var style  = [], style2 = [], _style, k, l,
            left   = this.$applyBindRule("left", xmlNode) || 0,
            top    = this.$applyBindRule("top", xmlNode) || 0,
            zindex = this.$applyBindRule("zindex", xmlNode) || 1001;
        if (this.snap) {
            left = Math.round(left / this.gridW) * this.gridW;
            top  = Math.round(top  / this.gridH) * this.gridH;
        }
        
        style.push("z-index:" + zindex);
        style.push("left:" + left + "px");
        style.push("top:" + top + "px");

        if (this.$flowVars.template) {
            var elTemplate = this.$flowVars.template.selectSingleNode("//element[@type='"
                           + this.$applyBindRule("type", xmlNode) + "']");
            if (elTemplate) {
                var stylesFromTemplate = elTemplate.getAttribute("css");

                if (stylesFromTemplate) {
                    stylesFromTemplate = stylesFromTemplate.split(";");

                    for (k = 0, l = stylesFromTemplate.length; k < l; k++) {
                        _style = stylesFromTemplate[k].trim();
                        if (_style !== "") {
                            if (_style.substr(0, 5) == "color" && elCaption)
                                elCaption.setAttribute("style", [_style].join(";"));
                            else
                                style.push(_style);
                        }
                    }
                }
                var w = elTemplate.getAttribute("dwidth"),
                    h = elTemplate.getAttribute("dheight");
            }
        }

        if (this.$applyBindRule("id", xmlNode)) {
            var _id = this.$applyBindRule("id", xmlNode).substr(1);
            if (_id > this.$flowVars.lastBlockId)
                this.$flowVars.lastBlockId = _id;
        }

        var id     = this.$applyBindRule("id", xmlNode) || "b" + this.$flowVars.lastBlockId,
            width  = this.$applyBindRule("width", xmlNode) || w || 56,
            height = this.$applyBindRule("height", xmlNode) || h || 56,
            lock   = this.$applyBindRule("lock", xmlNode) || "false",
            capPos = this.$applyBindRule("cap-pos", xmlNode) || "outside";

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
        xmlNode.setAttribute("cap-pos", capPos);

        if (elCaption)
            this.$setStyleClass(elCaption, capPos);

        elSelect.setAttribute(this.itemSelectEvent ||
            "onmousedown", 'var o = apf.lookup('
            + this.$uniqueId
            + '); o.select(this, event.ctrlKey, event.shiftKey)');

        apf.xmldb.nodeConnect(this.documentId, xmlNode, block, this);
        this.$flowVars.xmlBlocks[id] = xmlNode;

        /* Creating Connections */
        var r = [], i,
            connections = this.$getDataNode("connection", xmlNode, null, null, true);

        for (i = 0, l = connections.length; i < l; i++) {
            r.push({
                ref     : this.$applyBindRule("ref", connections[i]),
                output  : this.$applyBindRule("blockoutput", connections[i]),
                input   : this.$applyBindRule("blockinput", connections[i]),
                label   : this.$applyBindRule("blocklabel", connections[i]),
                type    : this.$applyBindRule("type", connections[i]),
                xmlNode : connections[i]
            });

        }

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(block, cssClass);
            if (cssClass)
                this.$dynCssClasses.push(cssClass);
        }
        // #endif
        
        if (r.length > 0)
            this.$flowVars.xmlConnections[id] = r;
    };

    this.$fill = function() {
        apf.insertHtmlNodes(this.nodes, this.$int);
        apf.console.info("FILL");
        var id, i, l,
            fv = this.$flowVars;
        for (id in fv.xmlBlocks) {
            var xmlBlock    = fv.xmlBlocks[id],
                htmlElement = apf.xmldb.findHtmlNode(xmlBlock, this),
                type        = this.$flowVars.xmlBlocks[id].getAttribute("type") || null,
                inputList   = {};

            if (type) {
                if (fv.template) {
                    var elTemplate = fv.template.selectSingleNode("element[@type='"
                        + this.$applyBindRule("type", xmlBlock) + "']");

                    if (elTemplate) {
                        var inputs = elTemplate.selectNodes("input");
                        
                        if (inputs) {
                            for (i = 0, l = inputs.length; i < l; i++) {
                                inputList[parseInt(inputs[i].getAttribute("name"))] = {
                                    x        : parseInt(inputs[i].getAttribute("x")),
                                    y        : parseInt(inputs[i].getAttribute("y")),
                                    position : inputs[i].getAttribute("position")
                                };
                            }
                        }
                    }
                }
            }

            var lock = this.$applyBindRule("lock", xmlBlock) == "true"
                    ? true
                    : false;
            var other = {};
            other['lock'] = lock;
            other['flipv'] = this.$applyBindRule("flipv", xmlBlock) == "true"
                ? true
                : false;
            other['fliph'] = this.$applyBindRule("fliph", xmlBlock) == "true"
                ? true
                : false;
            other['rotation'] = parseInt(this.$applyBindRule("rotation", xmlBlock)) || 0;
            other['inputList'] = inputList;
            other['type'] = type;
            other['picture'] = type && fv.template && elTemplate
                ? elTemplate.getAttribute("picture")
                : null;
            other['dwidth'] = type && fv.template && elTemplate
                ? parseInt(elTemplate.getAttribute("dwidth"))
                : 56;
            other['dheight'] = type && fv.template && elTemplate
                ? parseInt(elTemplate.getAttribute("dheight"))
                : 56;
            other['scalex'] = type && fv.template && elTemplate
                ? (elTemplate.getAttribute("scalex") == "true"
                    ? true
                    : false)
                : true;
            other['scaley'] = type && fv.template && elTemplate
                ? (elTemplate.getAttribute("scaley") == "true"
                    ? true
                    : false)
                : true;
            other['scaleratio'] = type && fv.template && elTemplate
                ? (elTemplate.getAttribute("scaleratio") == "true"
                    ? true
                    : false)
                : false;
            other['xmlNode'] = xmlBlock;
            other['caption'] = this.$applyBindRule("caption", xmlBlock);
            other['capPos'] = this.$applyBindRule("cap-pos", xmlBlock);

            var objBlock = apf.flow.isBlock(htmlElement);
            var _self    = this;

            if (objBlock) {
                this.$setStyleClass(htmlElement, "", ["empty"]);
                objBlock.other = other;
                objBlock.initBlock();
            }
            else {
                objBlock = apf.flow.addBlock(htmlElement, this.objCanvas, other);

                if (objBlock) {
                    objBlock.oncreateconnection = function(sXmlNode, sInput, dXmlNode, dInput) {
                        _self.addConnector(sXmlNode, sInput, dXmlNode, dInput);
                    };
                    objBlock.onremoveconnection = function(xmlNodeArray) {
                        _self.removeConnectors(xmlNodeArray);
                    };
                    fv.objBlocks[id] = objBlock;
                }
            }
        }

        for (id in fv.xmlBlocks) {
            var c = fv.xmlConnections[id] || [];

            for (i = 0, l = c.length; i < l; i++) {
                var con = apf.flow.findConnector(fv.objBlocks[id], c[i].output,
                                                 fv.objBlocks[c[i].ref], c[i].input);
                if (!con) {
                    if (fv.objBlocks[id] && fv.objBlocks[c[i].ref]) {
                        //it's called because connection labels must be aligned
                        fv.objBlocks[id].onMove();
                        
                        new apf.flow.addConnector(this.objCanvas, fv.objBlocks[id],
                                                  fv.objBlocks[c[i].ref], {
                            output  : c[i].output,
                            input   : c[i].input,
                            label   : c[i].label,
                            type    : c[i].type,
                            xmlNode : c[i].xmlNode
                        });
                    }
                    else {
                        fv.connToPaint.push({
                            id      : id,
                            id2     : c[i].ref,
                            output  : c[i].output,
                            input   : c[i].input,
                            label   : c[i].label,
                            type    : c[i].type,
                            xmlNode : c[i].xmlNode
                        });
                    }
                }
                else {
                    con.connector.other = {
                        output  : c[i].output,
                        input   : c[i].input,
                        label   : c[i].label,
                        type    : c[i].type,
                        xmlNode : c[i].xmlNode
                    };
                    con.connector.activateInputs();
                    con.connector.draw();
                }
            }
        }

        /* Try to draw rest of connections */
        for (i = fv.connToPaint.length - 1; i >= 0 ; i--) {
            if (fv.objBlocks[fv.connToPaint[i].id] && fv.objBlocks[fv.connToPaint[i].id2]) {
                new apf.flow.addConnector(this.objCanvas,
                                          fv.objBlocks[fv.connToPaint[i].id],
                                          fv.objBlocks[fv.connToPaint[i].id2], {
                    output  : fv.connToPaint[i].output,
                    input   : fv.connToPaint[i].input,
                    label   : fv.connToPaint[i].label,
                    type    : fv.connToPaint[i].type,
                    xmlNode : fv.connToPaint[i].xmlNode
                    });
                fv.connToPaint.removeIndex(i);
            }
        }

        this.nodes = [];

        if (!this.objCanvas.scrollPointer)
            this.objCanvas.addScrollPointer();
    };

    this.$destroy = function() {
        /*this.oPrevious.onclick = null;

        this.removeEventListener("onkeydown", onkeydown_);
        this.removeEventListener("mousescroll", onmousescroll_);

        this.x = null;*/
    };

    this.$loadAml = function(x) {
        /* Loading template */
        apf.getData(this.getAttribute("template"), {callback: 
            function(data, state, extra) {
                if (state == apf.SUCCESS) {
                    _self.loadTemplate(data);
                }
                else {
                    apf.console.info("An error has occurred: " + extra.message, 2);
                    return;
                }
            }
        });

        var _self = this,
            fv    = this.$flowVars;

        /* Resize */
        fv.resizeManager = new apf.resize();

        fv.resizeManager.onresizedone = function(w, h, t , l) {
            _self.resize(_self.selected, w, h, t, l);
        };

        fv.resizeManager.onresize = function(htmlElement, t, l, w, h) {
            if (!htmlElement)
                return;
            var objBlock = apf.flow.isBlock(htmlElement);
            objBlock.moveTo(t, l);
            objBlock.resize(w, h);
            objBlock.updateOutputs();
            objBlock.onMove();
        };

        apf.flow.onaftermove = function(dt, dl) {
            _self.moveTo(_self.selected, dl, dt);
        };

        apf.flow.onblockmove = function() {
            fv.resizeManager.show();
        };
    };

    /**
     * Loads a template for elements, which defines the type, size and other 
     * properties of blocks.
     * 
     * @see Template attribute
     * 
     * @param {XMLElement}   data   xml representation of template
     */
    this.loadTemplate = function(xmlRootNode) {
        if (typeof xmlRootNode != "object")
            xmlRootNode = apf.getXmlDom(xmlRootNode);
        if (xmlRootNode.nodeType == 9)
            xmlRootNode = xmlRootNode.documentElement;
        if (xmlRootNode.nodeType == 3 || xmlRootNode.nodeType == 4)
            xmlRootNode = xmlRootNode.parentNode;
        if (xmlRootNode.nodeType == 2)
            xmlRootNode = xmlRootNode.ownerElement 
                || xmlRootNode.parentNode 
                || xmlRootNode.selectSingleNode("..");
        
        this.$flowVars.template = xmlRootNode;
        this.$checkLoadQueue();
    };

    this.$canLoadData = function() {
        return this.$flowVars.template ? true : false;
    };

}).call(apf.flowchart.prototype = new apf.BaseList());

apf.aml.setElement("flowchart",   apf.flowchart);
apf.aml.setElement("resize",      apf.BindingRule);
apf.aml.setElement("left",        apf.BindingRule);
apf.aml.setElement("top",         apf.BindingRule);
apf.aml.setElement("id",          apf.BindingRule);
apf.aml.setElement("width",       apf.BindingRule);
apf.aml.setElement("height",      apf.BindingRule);
apf.aml.setElement("flipv",       apf.BindingRule);
apf.aml.setElement("fliph",       apf.BindingRule);
apf.aml.setElement("rotation",    apf.BindingRule);
apf.aml.setElement("lock",        apf.BindingRule);
apf.aml.setElement("type",        apf.BindingRule);
apf.aml.setElement("cap-pos",     apf.BindingRule);
apf.aml.setElement("zindex",      apf.BindingRule);
apf.aml.setElement("connection",  apf.BindingRule);
apf.aml.setElement("ref",         apf.BindingRule);
apf.aml.setElement("blockoutput", apf.BindingRule);
apf.aml.setElement("blockinput",  apf.BindingRule);
apf.aml.setElement("blocklabel",  apf.BindingRule);
//#endif
