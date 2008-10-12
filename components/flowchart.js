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

jpf.flowchart = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode = document.body;

    this.$supportedProperties.push();
    this.objCanvas;
    this.nodes = [];
    
    xmlBlocks = {};
    objBlocks = {};
    xmlConnections = {};

    var _self = this;

    this.addEventListener("afterselect", function(e) {
        if (this.hasFeature(__VALIDATION__)) 
            this.validate();
    });

    this.$select = function(o) {
        if (!o || !o.style) {
            return;
        }
        else {
            return this.$setStyleClass(o, "selected");
        }
    };

    this.$deselect = function(o) {
        if (!o) {
            return;
        }
        else {
            return this.$setStyleClass(o, "", ["selected", "indicate"]);
        }
    };

    this.addEventListener("afterselect", function() {
        
    });

    this.addEventListener("afterdeselect", function() {
        
    });

    this.MoveTo = function(xmlNode, x, y) {
        //Use Action Tracker
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

        //Use Action Tracker
        this.executeAction(atAction, args, "setzindex", xmlNode);
    };

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/

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
        htmlNode.style.left   = (this.applyRuleSetOnNode("left", xmlNode)   || 10) + "px";
        htmlNode.style.top    = (this.applyRuleSetOnNode("top", xmlNode)    || 10) + "px";
        htmlNode.style.width  = (this.applyRuleSetOnNode("width", xmlNode)  || 56) + "px";
        htmlNode.style.height = (this.applyRuleSetOnNode("height", xmlNode) || 56) + "px";
        
        objBlock = objBlocks[this.applyRuleSetOnNode("id", xmlNode)];
        objBlock.draggable  = this.applyRuleSetOnNode("move", xmlNode) ? true : false;
        
        objBlock.changeRotation(
            this.applyRuleSetOnNode("rotation", xmlNode),
            this.applyRuleSetOnNode("fliph", xmlNode),
            this.applyRuleSetOnNode("flipv", xmlNode));
        
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
        
        /* Creating Connection */
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
    }

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
                        inputList[this.applyRuleSetOnNode("name", inputs[i])] = {
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
                scaleratio: type ? this.applyRuleSetOnNode("scaleratio", elTemplate) || false : true
            }

            var objBlock = jpf.flow.addBlock(htmlElement, _self.objCanvas, other);
                objBlock.draggable = this.applyRuleSetOnNode("move", xmlBlock) ? true : false;
                objBlock.changeRotation(other.rotation, other.fliph, other.flipv);

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
        //var nodes = x.childNodes;
        //jpf.JmlParser.parseChildren(x, null, this);
        
        if (this.$jml.childNodes.length)
            this.loadInlineData(this.$jml);

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
    };

    this.loadTemplate = function(data) {
        this.template = jpf.xmldb.getBindXmlNode(data);
        this.$checkLoadQueue();
    };

    this.canLoadData = function() {
        return this.template ? true : false;
    };

    var oEmpty;
    this.$setClearMessage = function(msg, className){
        /*var ww = jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth;
        var bp = parseInt(jpf.getStyle(_self.otPrevious, "width"));
        var bn = parseInt(jpf.getStyle(_self.otNext, "width"));
        var ew = parseInt(jpf.getStyle(_self.oEmpty, "width"));
        
        oEmpty = this.otBody.appendChild(this.oEmpty.cloneNode(true));

        jpf.xmldb.setNodeValue(oEmpty, msg || "");

        oEmpty.setAttribute("id", "empty" + this.uniqueId);
        oEmpty.style.display = "block";
        oEmpty.style.left = ((ww - ew)/2 - bp - bn) + "px";
        jpf.setStyleClass(oEmpty, className, ["loading", "empty", "offline"]);*/
    };

    this.$removeClearMessage = function() {
        /*if (!oEmpty)
            oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty && oEmpty.parentNode)
            oEmpty.parentNode.removeChild(oEmpty);*/
    };

    this.$setCurrentFragment = function(fragment){
        /*this.otBody.appendChild(fragment);

        this.dataset = fragment.dataset;

        if (!jpf.window.hasFocus(this))
            this.blur();*/
    };

    this.$getCurrentFragment = function() {
        var fragment = document.createDocumentFragment();

        /*while (this.otBody.childNodes.length) {
            fragment.appendChild(this.otBody.childNodes[0]);
        }
        fragment.dataset = this.dataset;*/

        return fragment;
    };
}).implement(jpf.Presentation, jpf.DataBinding, jpf.Cache, jpf.MultiselectBinding, jpf.BaseList);

//#endif