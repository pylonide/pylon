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

// #ifdef __WITH_LAYOUT

/**
 * Takes care of the spatial order of elements within the display area
 * of the browser. Layouts can be saved to xml and loaded again. Window
 * elements are dockable, which means the user can change the layout as he/she
 * wishes. The state of the layout can be saved as xml at any time.
 *
 * Example:
 * This example shows 5 windows which have a layout defined in layout.xml.
 * <code>
 *  <a:appsettings layout="[mdlLayouts::layout[1]]" />
 *  <a:model id="mdlLayouts" src="layout.xml" />
 *  
 *  <a:window title="Main Window" id="b1" />
 *  <a:window title="Tree Window" id="b2" />
 *  <a:window title="Window of Oppertunity" id="b3" />
 *  <a:window title="Small window" id="b4" />
 *  <a:window title="Some Window" id="b5" />
 * </code>
 *
 * This is the layout file containing two layouts (layout.xml).
 * <code>
 *  <layouts>
 *      <layout name="Layout 1" margin="2,2,2,2">
 *          <vbox edge="splitter">
 *              <node name="b1" edge="2"/>
 *              <hbox edge="2">
 *                  <vbox weight="1">
 *                      <node name="b2"/>
 *                      <node name="b3"/>
 *                  </vbox>
 *                  <node name="b4" weight="1" />
 *              </hbox>
 *              <node name="b5" height="20" />
 *          </vbox>
 *      </layout>
 *
 *      <layout name="Layout 2">
 *          <vbox edge="splitter">
 *              <node name="b1" edge="2" />
 *              <node name="b2" height="100" />
 *              <hbox edge="2">
 *                  <node name="b3" width="20%" />
 *                  <node name="b4" width="100" />
 *              </hbox>
 *              <node name="b5" height="20" />
 *          </vbox>
 *      </layout>
 *  </layouts>
 * </code>
 *
 * By binding on the layout.xml you can easily create a layout manager.
 * <code>
 *  <a:list id="lstLayouts"
 *    model          = "mdlLayouts"
 *    allowdeselect  = "false"
 *    onafterselect  = "
 *      if(!this.selected || apf.layout.isLoadedXml(this.selected))
 *          return;
 *     
 *      apf.layout.saveXml();
 *      apf.layout.loadXml(this.selected);
 *    "
 *    onbeforeremove = "return confirm('Do you want to delete this layout?')">
 *      <a:bindings>
 *          <a:caption match="[@name]" />
 *          <a:icon value="layout.png" />
 *          <a:each match="[layout]" />
 *      </a:bindings>
 *      <a:actions>
 *          <a:rename match="[.]" />
 *          <a:remove match="[.]" />
 *      </a:actions>
 *  </a:list>
 *  <a:button
 *    onclick = "
 *      if (!lstLayouts.selected)
 *          return;
 *     
 *      var newLayout = apf.layout.getXml(document.body);
 *      newLayout.setAttribute('name', 'New');
 *      apf.xmldb.appendChild(lstLayouts.selected.parentNode, newLayout);
 *      lstLayouts.select(newLayout, null, null, null, null, true);
 *      apf.layout.loadXml(newLayout);
 *      lstLayouts.startRename();
 *    ">
 *    Add Layout
 *  </a:button>
 * </code>
 *
 * @default_private
 * @todo a __WITH_DOM_REPARENTING should be added which can remove many of the functions of this element.
 */
apf.layout = {
    // #ifdef __WITH_ALIGNMENT
    layouts : {},

    addParent : function(oHtml, pMargin){
        var id;
        if (!(id = oHtml.getAttribute("id")))
            id = apf.setUniqueHtmlId(oHtml);

        return this.layouts[id] = {
            layout   : new apf.layoutParser(oHtml, pMargin),
            controls : []
        };
    },

    // #endif

    // #ifdef __WITH_SPLITTERS
    splitters     : {},
    freesplitters : [],
    vars          : {},

    getSplitter : function(layout){
        if (!this.splitters[this.getHtmlId(layout.parentNode)])
            this.splitters[this.getHtmlId(layout.parentNode)] = [];

        if (this.freesplitters.length){
            var splitter = this.freesplitters.pop();
        }
        else {
            var splitter = new apf.splitter();//this.parentNode
            var o = apf.findHost(layout.parentNode) || apf.document.documentElement;
            splitter.parentNode = o;
            splitter.skinset = apf.getInheritedAttribute(o, "skinset"); //@todo use skinset here. Has to be set in presentation
            splitter.dispatchEvent("DOMNodeInsertedIntoDocument");//{relatedParent : nodes[j].parentNode}
        }

        this.splitters[this.getHtmlId(layout.parentNode)].push(splitter);

        return splitter;
    },

    clearSplitters : function(layout){
        var ar = this.splitters[this.getHtmlId(layout.parentNode)];
        if (!ar) return;

        for (var i = 0; i < ar.length; i++) {
            this.freesplitters.push(ar[i]);
            if (!ar[i].$ext.parentNode) continue;

            ar[i].$ext.parentNode.removeChild(ar[i].$ext);
        }
        ar.length = 0;
    },
    // #endif

    // #ifdef __WITH_ALIGNMENT

    get : function(oHtml, pMargin){
        var layout = this.layouts[oHtml.getAttribute("id")];
        if (!layout)
            layout = this.addParent(oHtml, pMargin);
        return layout;
    },

    /**
     * Determines whether an xmlNode is of the layout that's currently loaded
     * @param {XMLElement} xmlNode the xml layout description node.
     */
    isLoadedXml : function(xmlNode){
        var nodes   = xmlNode.childNodes;
        var node    = xmlNode.selectSingleNode(".//node[@name]");//was node()
        var amlNode = node ? self[node.getAttribute("name")] : null;

        //#ifdef __DEBUG
        if (!amlNode) {
            throw new Error(apf.formatErrorString(0, null,
                "Loading Alignment from XML",
                "Could not find AML node" + (node ? " by name '"
                + node.getAttribute("name") + "'" : ""), xmlNode));
        }
        //#endif

        var pNode = amlNode.$ext.parentNode;
        var pId   = this.getHtmlId(pNode);

        return (this.loadedXml[pId] == xmlNode);
    },

    /**
     * Loads a layout using a data instruction.
     * Example:
     * <code>
     *  apf.layout.$loadFrom(%[mdlLayout::layout[1]]);
     * </code>
     * Remarks:
     * The aml elements referenced in the layout definition should exist when
     * this function is called.
     * @param {String} instruction the {@link term.datainstruction data instruction} specifying where to load the data from.
     */
    $loadFrom : function(instruction){
        apf.getData(instruction, {callback: function(xmlNode){
            if (!xmlNode) return;

            //#ifdef __DEBUG
            if (!xmlNode) {
                throw new Error(apf.formatErrorString(0, null,
                    "Loading default layout",
                    "Could not find default layout using processing \
                     instruction: '" + instruction + "'"));

                return;
            }
            //#endif

            apf.layout.loadXml(xmlNode);
        }});
    },

    loadedXml : {},
    cacheXml  : {},
    /**
     * Loads a layout from an xml element.
     * Remarks:
     * The aml elements referenced in the layout definition should exist when
     * this function is called.
     * @param {XMLElement} xmlNode the xml element containing the layout description.
     */
    loadXml   : function(xmlNode){
        var nodes   = xmlNode.childNodes;
        var node    = xmlNode.selectSingleNode(".//node[@name]");//was node()
        var amlNode = node ? self[node.getAttribute("name")] : null;

        //#ifdef __DEBUG
        if(!amlNode) {
            throw new Error(apf.formatErrorString(0, null,
                "Loading Alignment from XML",
                "Could not find AML node" + (node ? " by name '"
                + node.getAttribute("name") + "'" : ""), xmlNode));
        }
        //#endif

        var pNode   = amlNode.$ext.parentNode;
        var layout  = this.get(pNode, apf.getBox(xmlNode.getAttribute("margin") || ""));
        var pId     = this.getHtmlId(pNode);

        this.metadata = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            layout.root = this.parseXml(nodes[i], layout);
            break;
        }

        this.compile(pNode);
        if (apf.window.inited)
            this.activateRules(pNode);

        this.loadedXml[pId] = xmlNode;
    },

    metadata : [],
    getData  : function(type, layout){
        return {
            vbox        : (type == "vbox"),
            hbox        : (type == "hbox"),
            node        : "vbox|hbox".indexOf(type) == -1,
            children    : [],
            isRight     : false,
            isBottom    : false,
            edgeMargin  : 0,
            splitter    : null,
            minwidth    : 0,
            minheight   : 0,
            weight      : 1,
            pHtml       : layout.parentNode,
            size        : [300,200],
            position    : [0,0],
            last        : {},

            //#ifdef __DEBUG
            toString    : function(){
                var me = apf.vardump(this, null, false);
                for (var i = 0; i < this.children.length; i++) {
                    me += "\n{Child " + i + "\n===========\n"
                          + this.children[i].toString() + "}";
                }

                return me;
            },
            //#endif

            copy : function(){
                var copy = apf.extend({}, this);
                //#ifdef __DEBUG
                copy.toString = this.toString;
                //#endif

                if (!this.node) {
                    copy.children = [];
                    for (var i = 0; i < this.children.length; i++) {
                        copy.children[i] = this.children[i].copy();
                        copy.children[i].parent = copy;
                    }
                }
                return copy;
            },

            // #ifdef __WITH_DOCKING

            setPosition : function(x, y){
                this.oHtml.style.left = x + "px";
                this.oHtml.style.top  = y + "px";

                this.position = [x, y];
            },

            setFloat : function(){
                var diff = apf.getDiff(this.oHtml);

                this.oHtml.style.width = (this.size[0]-diff[0]) + "px";
                if (this.state < 0)
                    this.oHtml.style.height = (this.size[1] - diff[1]) + "px";

                this.prehide();
                this.hidden = 3;

                if (this.hid) {
                    var amlNode = apf.lookup(this.hid);
                    if (amlNode.syncAlignment)
                        amlNode.syncAlignment(this);
                }
            },

            unfloat : function(){
                if (this.hidden != 3) return;

                this.show();
            },

            state    : -1,
            minimize : function(height){
                if (this.state < 0) {
                    this.lastfheight  = this.fheight;
                    this.fheight      = "" + height;
                    this.lastsplitter = this.splitter;
                    if (this.parent.vbox)
                        this.splitter = -1;
                    this.state        = 1;
                }
            },

            restore : function(){
                if (this.state > 0) {
                    this.fheight  = this.lastfheight;
                    this.splitter = this.lastsplitter;
                    this.state    = -1;
                }
            },
            //#endif

            hidden         : false,
            hiddenChildren : [],
            prehide        : function(adminOnly){
                if (this.hidden == 3) {
                    this.hidden = true;
                    if (this.hid)
                        apf.lookup(this.hid).visible = false;
                    if (this.oHtml)
                        this.oHtml.style.display = "none";
                    return;
                }

                if (this.hidden && !adminOnly)
                    return;

                if (!this.parent)
                    return; //I think we're done here...

                //Record current position
                this.hidepos = {
                    prev : this.parent.children[this.stackId - 1],
                    next : this.parent.children[this.stackId + 1]
                }

                this.hidden = true;

                //Check if parent is empty
                var nodes, child, c = 0, i, l, sets = ["children", "hiddenChildren"];
                while(sets.length) {
                    nodes = this.parent[sets.pop()];
                    for (i = 0, l = nodes.length; i < l; i++) {
                        child = nodes[i];
                        if (child != this && !child.hidden) { // || apf.layout.dlist.contains(child)
                            c = 1;
                            break;
                        }
                    }
                }
                if (!c)
                    this.parent.prehide(adminOnly);

                if (adminOnly)
                    return this.hide(true);
                
                if (apf.layout.dlist.contains(this)) {
                    apf.layout.dlist.remove(this);
                    return false;
                }
                else
                    apf.layout.dlist.pushUnique(this);
            },
            preshow : function(adminOnly){
                if (!this.hidden)
                    return;

                this.hidden = false;

                if (adminOnly)
                    return this.show(true);

                //Check if parent is shown
                if (this.parent.hidden) // || apf.layout.dlist.contains(this.parent) @todo please make hidden a 4 state property
                    this.parent.preshow();

                if (apf.layout.dlist.contains(this)) {
                    apf.layout.dlist.remove(this);
                    return false;
                }
                else
                    apf.layout.dlist.pushUnique(this);
            },

            hide : function(adminOnly){
                //Remove from parent
                var nodes = this.parent.children;
                nodes.removeIndex(this.stackId);
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].stackId = i;

                //Add to hidden
                this.parent.hiddenChildren.push(this);

                if (adminOnly)
                    return;

                if (this.hidden != 3) {
                    if (this.hid)
                        apf.lookup(this.hid).visible = false;
                    if (this.oHtml)
                        this.oHtml.style.display = "none";
                }
            },

            show : function(adminOnly){
                //Check if position is still available
                var nodes = this.parent.children;
                if (this.hidepos.prev && this.hidepos.prev.parent == this.parent
                  && !this.hidepos.prev.hidden && !apf.layout.dlist.contains(this.hidepos.prev)) { //@todo please make hidden a 4 state property
                    if (nodes.length < this.hidepos.prev.stackId+ 1 )
                        nodes.push(this);
                    else
                        nodes.insertIndex(this, this.hidepos.prev.stackId + 1);
                }
                else if (this.hidepos.next && this.hidepos.next.parent == this.parent
                  && !this.hidepos.next.hidden && !apf.layout.dlist.contains(this.hidepos.next)) { //@todo please make hidden a 4 state property
                    if (this.hidepos.next.stackId == 0)
                        nodes.unshift(this);
                    else if (nodes.length < this.hidepos.next.stackId - 1)
                        nodes.push(this);
                    else
                        nodes.insertIndex(this, this.hidepos.next.stackId - 1);
                }
                else if (!this.hidepos.prev) {
                    nodes.unshift(this);
                }
                else if(!this.hidepos.next) {
                    nodes.push(this);
                }
                else {
                    if (this.stackId < nodes.length)
                        nodes.insertIndex(this, this.stackId);
                    else
                        nodes.push(this);
                }

                for (var i = 0; i < nodes.length; i++)
                    if (nodes[i])
                        nodes[i].stackId = i;

                //Remove from hidden
                this.parent.hiddenChildren.remove(this);

                if (!adminOnly) {
                    if (this.hidden != 3) {
                        if (this.hid)
                            apf.lookup(this.hid).visible = true;
                        if (this.oHtml)
                            this.oHtml.style.display = "block";
                    }
                }

                this.hidden  = false;
                this.hidepos = null;
            },

            remove : function(){
                var p = this.parent;
                if (!p)
                    return;

                if (this.hidden || p.hiddenChildren.contains(this)) {
                    p.hiddenChildren.remove(this);
                    apf.layout.dlist.remove(this);
                }
                else {
                    var nodes = p.children;
                    nodes.remove(this);

                    for (var i = 0; i < nodes.length; i++)
                        nodes[i].stackId = i;
                }

                for (var prop in this.last) {
                    if (prop == "splitter") {
                        if (p.originalMargin) {
                            if (p.parent.pOriginalMargin) {
                                p.parent.splitter       = null;
                                p.parent.edgeMargin     = p.parent.pOriginalMargin[0];
                                p.parent.pOriginalMargin = null;
                                delete p.last.splitter;
                            }

                            p.splitter       = null;
                            p.edgeMargin     = p.originalMargin[0];
                            p.originalMargin = null;
                        }
                    }

                    this[prop] = p[prop] || this.last[prop];
                }
                this.last = {};

                if (!p.children.length && !p.hiddenChildren.length)
                    p.remove();

                this.parent = null;
            },

            add : function(parent){
                this.parent = parent;

                if (this.hidden) {
                    var nodes = parent.hiddenChildren;
                    nodes.push(this);
                    //clear stack id?
                }
                else {
                    var nodes = parent.children;
                    nodes.push(this);

                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i])
                            nodes[i].stackId = i;
                    }
                }
            }
        };
    },

    //@todo rewrite this. Layout seperate from markup should not be stored in xml but in CSS.
    parseXml : function(x, layout, amlNode, norecur){
        var aData = this.getData(typeof amlNode == "string"
            ? amlNode
            : x.localName || x[apf.TAGNAME], layout.layout);

        if (aData.node) {
            if (!amlNode) {
                amlNode = self[x.getAttribute("name")];
                //#ifdef __DEBUG
                if (!amlNode) {
                    throw new Error(apf.formatErrorString(0, null,
                        "Parsing Alignment from XML",
                        "Could not find AML node" + x.getAttribute("name"), x));
                }
                //#endif
            }

            //if (!amlNode.visible)
                //amlNode.show(true);//amlNode.setProperty("visible", true);//not the most optimal position

            aData.oHtml   = amlNode.$ext;
            amlNode.aData = aData;

            //if (!amlNode.hasFeature(apf.__ALIGNMENT__)) {
                /*amlNode.implement(apf.Alignment);
                if (amlNode.hasFeature(apf.__ANCHORING__))
                    amlNode.$disableAnchoring();*/
                
                //amlNode.align = -1;
                amlNode.$setLayout("alignment");
            //}

            var aml = amlNode;
            if (aml.getAttribute("width"))
                aData.fwidth = aml.getAttribute("width");
            if (aml.getAttribute("height"))
                aData.fheight = aml.getAttribute("height");
            /*if (amlNode.minwidth)
                aData.minwidth = amlNode.minwidth;
            if (amlNode.minheight)
                aData.minheight = amlNode.minheight;*/

            if (!this.getHtmlId(aData.oHtml))
                apf.setUniqueHtmlId(aData.oHtml);
            aData.id = this.getHtmlId(aData.oHtml);
            if (aData.oHtml.style)
                aData.oHtml.style.position = "absolute";
            aData.hid = amlNode.$uniqueId;
        }
        else {
            aData.id = this.metadata.push(aData) - 1;
        }

        if (x.getAttribute("align"))
            aData.template = x.getAttribute("align");
        if (x.getAttribute("lean"))
            aData.isBottom = x.getAttribute("lean").match(/bottom/);
        if (x.getAttribute("lean"))
            aData.isRight = x.getAttribute("lean").match(/right/);
        if (x.getAttribute("edge") && x.getAttribute("edge") != "splitter")
            aData.edgeMargin = x.getAttribute("edge");
        if (x.getAttribute("weight"))
            aData.weight = parseFloat(x.getAttribute("weight"));
        if (x.getAttribute("splitter") || x.getAttribute("edge") == "splitter")
            aData.splitter = x.getAttribute("splitter")
                || (x.getAttribute("edge") == "splitter" ? 4 : false);
        if (x.getAttribute("width"))
            aData.fwidth = String(apf.parseExpression(x.getAttribute("width")));
        if (x.getAttribute("height"))
            aData.fheight = String(apf.parseExpression(x.getAttribute("height")));
        //@todo calculate inner minheight en minwidth
        /*if (x.getAttribute("minwidth"))
            aData.minwidth = x.getAttribute("minwidth");*/
        /*if (x.getAttribute("minheight"))
            aData.minheight = x.getAttribute("minheight");
        if (x.getAttribute("lastheight"))
            aData.lastfheight = x.getAttribute("lastheight");*/
        if (x.getAttribute("lastsplitter"))
            aData.lastsplitter = x.getAttribute("lastsplitter");
        if (x.getAttribute("hidden"))
            aData.hidden = (x.getAttribute("hidden") == 3)
                ? x.getAttribute("hidden")
                : apf.isTrue(x.getAttribute("hidden"));
        else if (x.getAttribute("visible") == "false")
            aData.hidden = true;
        if (x.getAttribute("state"))
            aData.state = x.getAttribute("state");
        if (x.getAttribute("stack"))
            aData.stackId = parseInt(x.getAttribute("stack"));
        if (x.getAttribute("position"))
            aData.position = x.getAttribute("position").split(",");
        if (x.getAttribute("size"))
            aData.size = x.getAttribute("size").split(",");

        //@todo Amazing hackery, can we please try to be consistent across all layout methods
        if (aData.fwidth && aData.fwidth.indexOf("/") > -1) {//match(/[\(\)\+\-=\/\*]/)){
            aData.fwidth = eval(aData.fwidth);
            if (aData.fwidth <= 1)
                aData.fwidth = (aData.fwidth * 100) + "%";
        }
        if (aData.fheight && aData.fheight.indexOf("/") > -1) {//.match(/[\(\)\+\-=\/\*]/)){
            aData.fheight = eval(aData.fheight);
            if (aData.fheight <= 1)
                aData.fheight = (aData.fheight * 100) + "%";
        }

        aData.edgeMargin = Math.max(aData.splitter || 0, aData.edgeMargin || 0);

        //guessing this is docking... unsure
        // #ifdef __WITH_DOCKING
        if (aData.node && amlNode.syncAlignment)
            amlNode.syncAlignment(aData);

        if (!norecur && !aData.node) {
            var nodes = x.childNodes;
            for (var last, a, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) continue;

                a = this.parseXml(nodes[i], layout);

                if (last && last.hidden)
                    last.hidepos.next = a;

                if (a.hidden) {
                    if (a.hid) {
                        var j = apf.lookup(a.hid);
                        if (a.hidden === true && j.visible) {
                            j.visible = false;
                            a.oHtml.style.display = "none";
                        }
                        if (a.hidden == 3) {
                            var diff = apf.getDiff(a.oHtml);
                            a.oHtml.style.left   = a.position[0] + "px";
                            a.oHtml.style.top    = a.position[1] + "px";
                            a.oHtml.style.width  = (a.size[0] - diff[0]) + "px";
                            a.oHtml.style.height = ((!this.state || this.state < 0
                                ? a.size[1]
                                : a.fheight)-diff[1]) + "px";
                        }
                    }

                    aData.hiddenChildren.push(a);
                    a.hidepos = {
                        prev : aData.children[aData.children.length-1]
                    };
                }
                else {
                    if (a.hid) {
                        var j = apf.lookup(a.hid);
                        if (!j.visible) {
                            j.visible = true;
                            a.oHtml.style.display = "block";
                        }
                    }
                    a.stackId = aData.children.push(a) - 1;
                }

                a.parent = aData;
                last     = a;
            }
        }
        //#endif

        aData.xml = x;

        return aData;
    },

    // #ifdef __WITH_ALIGNXML

    /**
     * Makes a copy of the current state of the layout and encodes it in xml.
     * @param {HTMLElement} pNode the html parent for which the layout is expressed in xml.
     * @returns {XMLElement} the xml representation of the layout.
     */
    getXml : function(pNode){
        var l = apf.layout.get(pNode);
        var xmlNode = l.root.xml
            ? l.root.xml.ownerDocument.createElement("layout")
            : apf.xmldb.getXml("<layout />");
        apf.layout.parseToXml(l.root, xmlNode);
        return xmlNode;
    },

    /**
     * Updates the current state of the layout to the xml from which the
     * original state was loaded from.
     */
    saveXml : function(){
        for (var pId in this.loadedXml) {
            var xmlNode = this.loadedXml[pId];
            var l       = this.layouts[pId];
            var root    = l.root;

            for (var i = xmlNode.childNodes.length - 1; i >= 0; i--)
                xmlNode.removeChild(xmlNode.childNodes[i]);

            //xmlNode.removeChild(root.xml);
            this.parseToXml(root, xmlNode);
        }
    },

    parseToXml : function(oItem, parentNode){
        var xmlNode = oItem.xml
            ? oItem.xml.cloneNode(false)
            : parentNode.ownerDocument.createElement(oItem.vbox
                ? "vbox"
                : (oItem.hbox ? "hbox" : "node"));

        parentNode.appendChild(xmlNode);

        if (oItem.template)
            xmlNode.setAttribute("align", oItem.template);
        if (oItem.edgeMargin)
            xmlNode.setAttribute("edge", oItem.edgeMargin);
        if (oItem.weight)
            xmlNode.setAttribute("weight", oItem.weight);
        if (oItem.splitter)
            xmlNode.setAttribute("splitter", oItem.splitter === false
                ? -1
                : oItem.splitter);
        if (oItem.fwidth)
            xmlNode.setAttribute("width", oItem.fwidth);
        if (oItem.fheight)
            xmlNode.setAttribute("height", oItem.fheight);
        if (oItem.minwidth)
            xmlNode.setAttribute("minwidth", oItem.minwidth);
        if (oItem.minheight)
            xmlNode.setAttribute("minheight", oItem.minheight);
        if (oItem.lastfheight)
            xmlNode.setAttribute("lastheight", oItem.lastfheight);
        if (oItem.lastsplitter)
            xmlNode.setAttribute("lastsplitter", oItem.lastsplitter);
        if (oItem.hidden)
            xmlNode.setAttribute("hidden", (oItem.hidden == 3) ? '3' : 'true');
        else if (xmlNode.getAttribute("hidden"))
            xmlNode.removeAttribute("hidden");
        if (oItem.stackId)
            xmlNode.setAttribute("stack", oItem.stackId);
        if (oItem.state > 0)
            xmlNode.setAttribute("state", oItem.state);
        else if (xmlNode.getAttribute("state"))
            xmlNode.removeAttribute("state");
        if (oItem.position)
            xmlNode.setAttribute("position", oItem.position.join(","));
        if (oItem.size)
            xmlNode.setAttribute("size", oItem.size.join(","));
        //if(oItem.isBottom || oItem.isRight) xmlNode.setAttribute("lean", oItem.minheight);

        var list = oItem.children.copy();
        for (var i = 0; i < oItem.hiddenChildren.length; i++) {
            var hidepos = oItem.hiddenChildren[i].hidepos;
            if (hidepos.prev) {
                var index = list.indexOf(hidepos.prev);
                if (index < 0)
                    list.unshift(oItem.hiddenChildren[i]);
                else
                    list.insertIndex(oItem.hiddenChildren[i], index);
            }
            else if(hidepos.next) {
                var index = list.indexOf(hidepos.next);
                if (index-1 < 0)
                    list.unshift(oItem.hiddenChildren[i]);
                else
                    list.insertIndex(oItem.hiddenChildren[i], index-1);
            }
            else {
                list.push(oItem.hiddenChildren[i]);
            }
        }

        for (var i = 0; i < list.length; i++) {
            this.parseToXml(list[i], xmlNode);
        }
    },

    //#endif

    checkInheritance : function(node){
        //#ifdef __WITH_SPLITTERS
        var lastNode = node.children[node.children.length - 1];
        if (node.originalMargin) {
            if (node.parent.pOriginalMargin) {
                node.parent.splitter       = null;
                node.parent.edgeMargin     = node.parent.pOriginalMargin[0];
                node.parent.pOriginalMargin = null;
                node.splitter              = node.last.splitter;
                delete node.last.splitter;
            }

            node.splitter       = null;
            var lNode           = node.originalMargin[1];
            node.edgeMargin     = node.originalMargin[0];
            lNode.splitter      = lNode.splitter === false
                                    ? false
                                    : lNode.last.splitter;
            node.originalMargin = null;
            delete lNode.last.splitter;
        }

        if (lastNode && lastNode.template
          && (lastNode.splitter || lastNode.splitter === null
          && node.originalMargin) && node.parent) {
            if (!node.splitter) {
                lastNode.last.splitter =
                node.splitter          = lastNode.splitter;
                node.originalMargin    = [node.edgeMargin, lastNode];
                node.edgeMargin        = Math.max(node.edgeMargin, node.splitter);
            }
            lastNode.splitter = null;

            if (node.parent && node.stackId == node.parent.children.length - 1
              && (node.parent.parent && node.parent.parent.children.length > 1)) {
                if (!node.parent.splitter) {
                    node.last.splitter         =
                    node.parent.splitter       = node.splitter;
                    node.parent.last.splitter  = null;
                    node.parent.edgeMargin     = Math.max(
                        node.parent.edgeMargin, node.parent.splitter);
                    node.parent.pOriginalMargin = [node.parent.edgeMargin];
                }
                node.splitter = null;
            }
            else if (node.parent.pOriginalMargin) {
                node.parent.splitter       = null;
                node.parent.edgeMargin     = node.parent.pOriginalMargin[0];
                node.parent.pOriginalMargin = null;
                node.splitter              = node.last.splitter;
                delete node.last.splitter;
            }
        }
        //#endif

        for (var i = 0; i < node.children.length; i++) {
            if (!node.children[i].node)
                this.checkInheritance(node.children[i]);
        }

        var firstNode = node.children[0];
        if (firstNode && node.parent) {
            if (node.vbox) {
                /*
                    Width is inherited when parent doesn't have width or it
                    already inherited it and wasn't set later (and is thus
                    different from cached version (in .last)
                */
                if (!node.fwidth && firstNode.fwidth
                  || firstNode.last.fwidth && firstNode.fwidth !== null
                  && firstNode.last.fwidth == node.fwidth) {
                    firstNode.last.fwidth =
                    node.fwidth           = firstNode.fwidth;
                    firstNode.fwidth      = null;
                }

                //@todo test this with reparenting
                var pNode = node.parent;
                if ((pNode && !pNode.fheight && firstNode.fheight
                  || firstNode.last.fheight && firstNode.fheight !== null
                  && firstNode.last.fheight == pNode.fheight) && node.children.length == 1) {
                    firstNode.last.fheight =
                    pNode.fheight           = firstNode.fheight;
                    firstNode.fheight      = null;
                }
            }
            else {
                /*
                    Height is inherited when parent doesn't have height or it
                    already inherited it and wasn't set later (and is thus
                    different from cached version (in .last)
                */
                if ((!node.fheight && firstNode.fheight
                  || firstNode.last.fheight && firstNode.fheight !== null
                  && firstNode.last.fheight == node.fheight) && node.children.length == 1) {
                    firstNode.last.fheight =
                    node.fheight           = firstNode.fheight;
                    firstNode.fheight      = null;
                }
            }

            //@todo oops parent is always overriden... :(
            if (firstNode.weight || firstNode.last.weight
              && firstNode.last.weight == node.weight) {
                firstNode.last.weight =
                node.weight           = firstNode.weight;
            }
        }
    },

    compileAlignment : function(aData){
        if (!aData.children.length) {
            //All children were removed, we're removing the layout rule
            this.removeRule(aData.pHtml, "layout");

            var l = this.layouts[aData.pHtml.getAttribute("id")];
            // #ifdef __WITH_SPLITTERS
            if (l)
                apf.layout.clearSplitters(l.layout);
            //#endif
            return;
        }

        //#ifdef __WITH_ALIGN_TEMPLATES
        var n = aData.children;
        for (var f = false, i = 0; i < n.length; i++) {
            if (n[i].template == "bottom") {
                if (n[i].splitter) {
                    n[i - 1].splitter = n[i].splitter;
                    n[i].splitter = null;
                }

                n[i - 1].edgeMargin = Math.max(n[i].edgeMargin,
                    n[i - 1].edgeMargin || 0, n[i - 1].splitter || 0);
                n[i].edgeMargin = null;
            }
            
            if (n[i].hidden)
                n[i].prehide(true);
        }

        //#ifdef __WITH_SPLITTERS
        this.checkInheritance(aData);
        //#endif

        //#endif

        //this.compile(aData.pHtml); //oHtml
        var l = this.layouts[aData.pHtml.getAttribute("id")];
        l.layout.compile(aData.copy());
        l.layout.reset();
    },

    //#ifdef __WITH_ALIGN_TEMPLATES
    addAlignNode : function(amlNode, pData){
        var align = (typeof amlNode.align == "undefined"
            ? amlNode.getAttribute("align")
            : amlNode.align).split("-");
        var s = pData.children;
        var a = amlNode.aData;

        if (typeof amlNode.splitter == "undefined") {
            if (align[1] == "splitter")
                a.splitter = align[2] || 4
            else
                a.splitter = false;
        }

        a.edgeMargin = Math.max(a.edgeMargin, a.splitter || 0);
        align = align[0];
        a.template = align;

        if (align == "top") {
            for (var p = s.length, i = 0; i < s.length; i++) {
                if (s[i].template != "top") {
                    p = i;
                    break;
                }
            }
            for (var i = s.length - 1; i >= p; i--) {
                s[i + 1] = s[i];
                s[i].stackId = i + 1;
            }

            s[p] = a;
            s[p].stackId = p;
            a.parent = pData;
        }
        else if (align == "bottom") {
            a.stackId = s.push(a) - 1;
            a.parent = pData;
        }
        else {
            //find hbox
            var hbox = null;
            for (var p = -1, i = 0; i < s.length; i++) {
                if (s[i].hbox) {
                    hbox = s[i];
                    break;
                }
                else if (s[i].node && s[i].template == "top")
                    p = i;
            }

            //create hbox
            if (!hbox) {
                var l = apf.layout.get(pData.pHtml);
                hbox = apf.layout.parseXml(apf.xmldb.getXml("<hbox />"), l, null, true);
                hbox.parent = pData;
                if (p > -1) {
                    for (var i = s.length - 1; i > p; i--) {
                        s[i + 1] = s[i];
                        s[i].stackId++;
                    }
                    s[p + 1] = hbox;
                    hbox.stackId = p + 1;
                }
                else
                    hbox.stackId = s.unshift(hbox) - 1;
            }

            //find col
            var col, n = hbox.children.concat(hbox.hiddenChildren);
            for (var i = 0; i < n.length; i++) {
                if (n[i].template == align) {
                    col = n[i];
                    break;
                }
            }

            n = hbox.children;
            //create col
            if (!col) {
                var l = apf.layout.get(pData.pHtml);
                col = apf.layout.parseXml(apf.xmldb.getXml("<vbox />"), l, null, true);
                col.parent = hbox;
                col.template = align;

                if (align == "left") {
                    if (!a.fwidth) {
                        var ncol;
                        for (var found = false, i = 0; i < n.length; i++) {
                            if (n[i].template == "middle") {
                                found = n[i];
                                break;
                            }
                        }

                        if (found && !found.children.length) {
                            n.remove(found);
                            for(var i = 0; i < n.length; i++)
                                n[i].stackId = i;
                        }
                    }

                    n.unshift(col);
                    for (var i = 0; i < n.length; i++)
                        n[i].stackId = i;
                }
                else if (align == "right") {
                    if (a.fwidth) {
                        var ncol;
                        for (var found = false, i = 0; i < n.length; i++) {
                            if (n[i].template == "middle" || n[i].template == "left" && !n[i].fwidth) {
                                found = true;
                                break;
                            }
                        }

                        //create middle layer if none is specified
                        if (!found) {
                            ncol = apf.layout.parseXml(apf.xmldb.getXml("<vbox />"), l, null, true);
                            ncol.parent = hbox;
                            ncol.template = "middle";

                            ncol.stackId = n.push(ncol) - 1;
                        }
                    }

                    col.stackId = n.push(col) - 1;
                }
                else if (align == "middle") {
                    for (var f, i = 0; i < n.length; i++)
                        if (n[i].template == "right")
                            f = i;
                    var rcol = n[f];
                    if (rcol) {
                        n[f] = col;
                        col.stackId = f;
                        rcol.stackId = n.push(rcol) - 1;
                    }
                    else {
                        col.stackId = n.push(col) - 1;
                    }
                }
            }

            a.stackId = col.children.push(a) - 1;
            a.parent = col;

            if (col.hidden) {
                col.preshow(true);
            }
        }
    },
    //#endif

    compile : function(oHtml){
        var l = this.layouts[oHtml.getAttribute("id")];
        if (!l) return false;

        var root = l.root.copy();//is there a point to copying?
        
        l.layout.compile(root);
        l.layout.reset();
    },

    removeAll : function(aData) {
        aData.children.length = null
        this.compileAlignment(aData);

        var htmlId = this.getHtmlId(aData.pHtml);
        if (!this.rules[htmlId])
            delete this.qlist[htmlId];
    },

    // #endif
    
    // #ifdef __WITH_ALIGNMENT || __WITH_ANCHORING 

    timer : null,
    qlist : {},
    dlist : [],
    $hasQueue : false,
    
    queue : function(oHtml, obj, compile){
        this.$hasQueue = true;
        
        var id;
        if (!(id = this.getHtmlId(oHtml)))
            id = apf.setUniqueHtmlId(oHtml);
            
        if (this.qlist[id]) {
            if (obj)
                this.qlist[id][2].push(obj);
            if (compile)
                this.qlist[id][1] = compile;
            return;
        }

        this.qlist[id] = [oHtml, compile, [obj]];

        if (!this.timer)
            this.timer = $setTimeout("apf.layout.processQueue()");
    },

    processQueue : function(){
        clearTimeout(this.timer);
        this.timer = null;
        this.$hasQueue = false;

        var i, id, l, qItem, list;

        for (i = 0; i < this.dlist.length; i++) {
            if (this.dlist[i].hidden)
                this.dlist[i].hide();
            else
                this.dlist[i].show();
        }

        for (id in this.qlist) {
            qItem = this.qlist[id];

            if (qItem[1])
                apf.layout.compileAlignment(qItem[1]);

            list = qItem[2];
            for (i = 0, l = list.length; i < l; i++) {
                if (list[i])
                    list[i].$updateLayout();
            }

            apf.layout.activateRules(qItem[0]);
        }

        if (apf.hasSingleRszEvent)
            apf.layout.forceResize();

        this.qlist = {};
        this.dlist = [];
    },
    
    //#endif

    rules     : {},
    onresize  : {},

    getHtmlId : function(oHtml){
        //if(apf.hasSingleRszEvent) return 1;
        //else
        return oHtml.getAttribute ? oHtml.getAttribute("id") : 1;
    },

    /**
     * Adds layout rules to the resize event of the browser. Use this instead
     * of onresize events to add rules that specify determine the layout.
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element. Use this to easily update or remove the rules added.
     * @param {String}      rules       the javascript code that is executed when the html element resizes.
     * @param {Boolean}     [overwrite] whether the rules are added to the resize function or overwrite the previous set rules with the specified id.
     */
    setRules : function(oHtml, id, rules, overwrite){
        if (!this.getHtmlId(oHtml))
            apf.setUniqueHtmlId(oHtml);
        if (!this.rules[this.getHtmlId(oHtml)])
            this.rules[this.getHtmlId(oHtml)] = {};

        var ruleset = this.rules[this.getHtmlId(oHtml)][id];
        if (!overwrite && ruleset) {
            this.rules[this.getHtmlId(oHtml)][id] = rules + "\n" + ruleset;
        }
        else
            this.rules[this.getHtmlId(oHtml)][id] = rules;
    },

    /**
     * Retrieves the rules set for the resize event of an html element specified by an identifier
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element.
     */
    getRules : function(oHtml, id){
        return id
            ? this.rules[this.getHtmlId(oHtml)][id]
            : this.rules[this.getHtmlId(oHtml)];
    },

    /**
     * Removes the rules set for the resize event of an html element specified by an identifier
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element.
     */
    removeRule : function(oHtml, id){
        var htmlId = this.getHtmlId(oHtml);
        if (!this.rules[htmlId])
            return;

        var ret = this.rules[htmlId][id] ||  false;
        delete this.rules[htmlId][id];

        var prop;
        for (prop in this.rules[htmlId]) {

        }
        if (!prop)
            delete this.rules[htmlId]

        if (apf.hasSingleRszEvent) {
            if (this.onresize[htmlId])
                this.onresize[htmlId] = null;
            else {
                var p = oHtml.parentNode;
                while (p && p.nodeType == 1 && !this.onresize[p.getAttribute("id")]) {
                    p = p.parentNode;
                }
    
                if (p && p.nodeType == 1) {
                    var x = this.onresize[p.getAttribute("id")];
                    if (x.children)
                        delete x.children[htmlId]
                }
            }
        }
        
        return ret;
    },

    /**
     * Activates the rules set for an html element
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     */
    activateRules : function(oHtml, no_exec){
        if (!oHtml) { //!apf.hasSingleRszEvent &&
            var prop, obj;
            for(prop in this.rules) {
                obj = document.getElementById(prop);
                if (!obj || obj.onresize) // || this.onresize[prop]
                    continue;
                this.activateRules(obj);
            }

             if (apf.hasSingleRszEvent && window.onresize)
                window.onresize();
            return;
        }

        var rsz, id, rule, rules, strRules = [];
        if (!apf.hasSingleRszEvent) {
            rules = this.rules[this.getHtmlId(oHtml)];
            if (!rules){
                oHtml.onresize = null;
                return false;
            }

            for (id in rules) { //might need optimization using join()
                if (typeof rules[id] != "string")
                    continue;
                strRules.push(rules[id]);
            }

            //apf.console.info(strRules.join("\n"));
            rsz = apf.needsCssPx
                ? new Function(strRules.join("\n"))
                : new Function(strRules.join("\n").replace(/ \+ 'px'|try\{\}catch\(e\)\{\}\n/g,""))

            oHtml.onresize = rsz;
            if (!no_exec)
                rsz();
        }
        else {
            var htmlId = this.getHtmlId(oHtml);
            rules = this.rules[htmlId];
            if (!rules){
                //@todo keep .children
                //delete this.onresize[htmlId];
                return false;
            }

            for (id in rules) { //might need optimization using join()
                if (typeof rules[id] != "string")
                    continue;
                strRules.push(rules[id]);
            }
            
            var p = oHtml.parentNode;
            while (p && p.nodeType == 1 && !this.onresize[p.getAttribute("id")]) {
                p = p.parentNode;
            }

            var f = new Function(strRules.join("\n"));//.replace(/try\{/g, "").replace(/}catch\(e\)\{\s*\}/g, "\n")
            if (this.onresize[htmlId])
                f.children = this.onresize[htmlId].children;
                
            if (p && p.nodeType == 1) {
                var x = this.onresize[p.getAttribute("id")];
                (x.children || (x.children = {}))[htmlId] = f;
            }
            else this.onresize[htmlId] = f;
            if (!no_exec)
                f();

            if (!window.onresize) {
                /*var f = apf.layout.onresize;
                window.onresize = function(){
                    var s = [];
                    for (var name in f)
                        s.unshift(f[name]);
                    for (var i = 0; i < s.length; i++)
                        s[i]();
                }*/
                
                var rsz = function(f){
                    //@todo fix this
                    try{
                        var c = [];
                        for (var name in f)
                            c.unshift(f[name]);
                        for (var i = 0; i < c.length; i++){
                            c[i]();
                            if (c[i].children) {
                                rsz(c[i].children);
                            }
                        }
                    }
                    catch(e){
                        
                    }
                }
                
                window.onresize = function(){
                    rsz(apf.layout.onresize);
                }
            }
        }
    },

    /**
     * Forces calling the resize rules for an html element
     * @param {HTMLElement} oHtml  the element for which the rules are executed.
     */
    forceResize : function(oHtml){
        if (apf.hasSingleRszEvent)
            return window.onresize && window.onresize();

        /* @todo this should be done recursive, old way for now
        apf.hasSingleRszEvent
            ? this.onresize[this.getHtmlId(oHtml)]
            :
        */

        var rsz = oHtml.onresize;
        if (rsz)
            rsz();

        var els = oHtml.getElementsByTagName("*");
        for (var i = 0, l = els.length; i < l; i++) {
            if (els[i].onresize)
                els[i].onresize();
        }
    },

    paused : {},

    /**
     * Disables the resize rules for the html element temporarily.
     * @param {HTMLElement} oHtml  the element for which the rules are paused.
     * @param {Function}    func   the resize code that is used temporarily for resize of the html element.
     */
    pause  : function(oHtml, replaceFunc){
        if (apf.hasSingleRszEvent) {
            var htmlId = this.getHtmlId(oHtml);
            this.paused[htmlId] = this.onresize[htmlId] || true;

            if (replaceFunc) {
                this.onresize[htmlId] = replaceFunc;
                this.onresize[htmlId].children = this.paused[htmlId].children;
                replaceFunc();
            }
            else
                delete this.onresize[htmlId];
        }
        else {
            this.paused[this.getHtmlId(oHtml)] = oHtml.onresize || true;

            if (replaceFunc) {
                oHtml.onresize = replaceFunc;
                replaceFunc();
            }
            else
                oHtml.onresize = null;
        }
    },

    /**
     * Enables paused resize rules for the html element
     * @param {HTMLElement} oHtml  the element for which the rules have been paused.
     */
    play : function(oHtml){
        if (!this.paused[this.getHtmlId(oHtml)])
            return;

        if (apf.hasSingleRszEvent) {
            var htmlId = this.getHtmlId(oHtml);
            var oldFunc = this.paused[htmlId];
            if (typeof oldFunc == "function") {
                this.onresize[htmlId] = oldFunc;
                //oldFunc();
            }
            else
                delete this.onresize[htmlId];

            if (window.onresize)
                window.onresize();

            this.paused[this.getHtmlId(oHtml)] = null;
        }
        else {
            var oldFunc = this.paused[this.getHtmlId(oHtml)];
            if (typeof oldFunc == "function") {
                oHtml.onresize = oldFunc;
                oldFunc();
            }
            else
                oHtml.onresize = null;

            this.paused[this.getHtmlId(oHtml)] = null;
        }
    }
};
apf.layout.load = apf.layout.loadXml;//@todo temp need to rename
// #endif

// #ifdef __WITH_ALIGNMENT

/**
 * @private
 */
apf.getWindowWidth = function(){
    return apf.isIE ? document.documentElement.offsetWidth - (apf.isIE8 ? 4 : 0) : window.innerWidth;
}
/**
 * @private
 */
apf.getWindowHeight = function(){
    return apf.isIE ? document.documentElement.offsetHeight - (apf.isIE8 ? 4 : 0) : window.innerHeight;
}

/**
 * @constructor
 * @private
 */
apf.layoutParser = function(parentNode, pMargin){
    pMargin  = (pMargin && pMargin.length == 4) ? pMargin : [0, 0, 0, 0];
    this.pMargin = pMargin;
    this.RULES   = [];

    this.parentNode = parentNode;
    if (!this.parentNode.getAttribute("id"))
        apf.setUniqueHtmlId(this.parentNode);

    var knownVars        = {};
    var minWidth         = 0;
    var minHeight        = 0;
    this.createSplitters = true;

    this.setMargin = function(sMargin){
        pMargin = sMargin;
    };

    this.reset = function(){
        this.RULES = [];
        knownVars  = {};
        this.lastType = this.globalEdge = this.globalSplitter = null;
    };

    this.compile = function(root, noapply){
        this.addRule("var v = apf.layout.vars");

        this.globalSplitter = root.splitter;
        this.globalEdge     = root.edgeMargin;

        if (this.globalSplitter || this.globalEdge)
            this.setglobals(root);

        this.preparse(root);
        this.parserules(root);
        // #ifdef __WITH_SPLITTERS
        if (this.createSplitters) {
            apf.layout.clearSplitters(this);
            this.parsesplitters(root);
        }
        // #endif
        //Sort by checking dependency structure
        this.RULES = new DepTree().calc(this.RULES);
        var str = ("try{" + this.RULES.join("}catch(e){}\ntry{") + "}catch(e){}\n")
            .replace(/([^=]+\.style[^=]+) = (.*?)\}/g, "$1 = ($2) + 'px'}");

        if (!apf.hasHtmlIdsInJs) //@todo speed?
            str = str.replace(/q([\w|]+)\.(offset|style)/g, 'document.getElementById("q$1").$2');

        //optimization
        //if(this.parentNode != document.body)
            //"if(document.getElementById('" + this.parentNode.id + "').offsetHeight){" + str + "};";

        this.lastRoot = root;

        if (!noapply) {
            apf.layout.setRules(this.parentNode, "layout", str, true);
            apf.layout.queue(this.parentNode);
        }
        else
            return str;

        return false;
    };

    this.addRule = function(rule){
        this.RULES.push(rule);
    };

    this.setglobals = function(node, isLast){
        if (!isLast && this.globalEdge && !node.edgeMargin 
          && (!node.xml || !node.xml.getAttribute("edge"))) {
            if (!node.splitter)
                node.splitter = this.globalSplitter;
            node.edgeMargin = Math.max(this.globalSplitter, this.globalEdge);
        }

        if (node.node) return;

        for (var i = 0; i < node.children.length; i++) {
            this.setglobals(node.children[i], i == node.children.length - 1);
        }
    };

    this.preparse = function(node){
        /*
            Define:
            - minwidth
            - minheight
            - calcheight
            - calcwidth
            - restspace
            - innerspace
        */

        if (node.node) {
            return;
        }
        else {
            var type            = node.vbox ? "height" : "width";
            var cmhwp           = 0;
            var cmwwp           = 0;
            var ctph            = 0;
            //Calculate resultSpace
            node.childweight    = 0;
            node.childminwidth  = 0;
            node.childminheight = 0;
            var rules           = ["v." + type + "_" + node.id], extra = [];
            var nodes           = node.children;

            for (var i = 0; i < nodes.length; i++) {
                if (i < nodes.length-1)
                    rules.push(" - " + nodes[i].edgeMargin);
                var f = nodes[i]["f" + type];
                if (f) {
                    //if(f.indexOf("%") > -1) ctph += parseFloat(f);

                    extra.push(
                        (f.indexOf("%") > -1)
                            ? " - (" + (nodes[i]["calc" + type] = "v.innerspace_"
                                + node.id + " * " + parseFloat(f)/100) + ")"
                            : " - (" + f + ")"
                    );
                }
                else {
                    node.childweight += nodes[i].weight;
                    nodes[i]["calc" + type] = "Math." + (i%2 == 0 ? "ceil" : "floor")
                        + "(v.restspace_" + node.id + " * (" + nodes[i].weight
                        + "/v.weight_" + node.id + "))";
                }

                var g = (node.vbox ? "width" : "height");
                var v = nodes[i]["f" + g];
                if (!v)
                    nodes[i]["calc" + g] = (node.vbox ? "v.width_" : "v.height_")
                        + node.id;
                else
                    nodes[i]["calc" + g] = v.indexOf("%") > -1 ? "v.innerspace_"
                        + node.id + " * " + parseFloat(v)/100 : v

                if (nodes[i].node && nodes[i].xml.visible !== false)
                    nodes[i].oHtml.style.display = "block";
                else
                    this.preparse(nodes[i]);

                if (node.vbox) {
                    /*if(!nodes[i].fheight){
                        cmhwp = Math.max(cmhwp, Math.max(nodes[i].childminheight || 0, nodes[i].minheight || 0, 10)/nodes[i].weight);
                        node.childminheight += nodes[i].edgeMargin;
                    }
                    else */
                    node.childminheight += Math.max(nodes[i].childminheight || 0,
                        nodes[i].minheight || 0, 10) + nodes[i].edgeMargin;
                    node.childminwidth   = Math.max(node.childminwidth,
                        nodes[i].minwidth || nodes[i].childminwidth || 10);
                }
                else {
                    /*if(!nodes[i].fwidth){
                        cmwwp = Math.max(cmwwp, Math.max(nodes[i].childminwidth || 0, nodes[i].minwidth || 0, 10)/nodes[i].weight);
                        node.childminwidth += nodes[i].edgeMargin;
                    }
                    else */
                    node.childminwidth += Math.max(nodes[i].minwidth || 0,
                        nodes[i].childminwidth || 0, 10) + nodes[i].edgeMargin;
                    node.childminheight = Math.max(node.childminheight,
                        nodes[i].minheight || nodes[i].childminheight || 10);
                }
            }

            /*if (node.vbox) {
                if (cmhwp) {
                    if (ctph)
                        node.childminheight += (cmhwp * node.childweight / (100 - ctph)) * ctph;
                    node.childminheight += cmhwp * node.childweight;
                }
            } else {
                if (cmwwp) {
                    if (ctph)
                        node.childminwidth += (cmwwp * node.childweight / (100 - ctph)) * ctph;
                    node.childminwidth += cmwwp * node.childweight;
                }
            }*/

            node.innerspace = rules.join("");
            node.restspace  = node.innerspace + " " + extra.join("");

            if (!node.parent) {
                var hordiff = 0, verdiff = 0;
                if (this.parentNode.tagName.toLowerCase() != "body") {
                    var diff    = apf.getDiff(this.parentNode);
                    verdiff = diff[0];
                    hordiff = diff[1];
                }

                var strParentNodeWidth  = (this.parentNode.tagName.toLowerCase() == "body"
                    ? "apf.getWindowWidth()"
                    : "document.getElementById('" + this.parentNode.id + "').offsetWidth");
                var strParentNodeHeight = (this.parentNode.tagName.toLowerCase() == "body"
                    ? "apf.getWindowHeight()"
                    : "document.getElementById('" + this.parentNode.id + "').offsetHeight");
                node.calcwidth  = "Math.max(" + minWidth + ", " + strParentNodeWidth
                    + " - " + (pMargin[1]) + " - " + pMargin[3] + " - " + hordiff + ")";
                node.calcheight = "Math.max(" + minHeight + ", " + strParentNodeHeight
                    + " - " + (pMargin[2]) + " - " + pMargin[0] + " - " + verdiff + ")";
            }
        }
    };

    this.parserules = function(oItem){
        if (!oItem.node) {
            this.addRule("v.width_" + oItem.id + " = Math.max(" + oItem.childminwidth
                + "," + oItem.minwidth + "," + (oItem.calcwidth || oItem.fwidth) + ")");
            this.addRule("v.height_" + oItem.id + " = Math.max(" + oItem.childminheight
                + "," + oItem.minheight + "," + (oItem.calcheight || oItem.fheight) + ")");
            this.addRule("v.weight_" + oItem.id + " = " + oItem.childweight);
            this.addRule("v.innerspace_" + oItem.id + " = " + oItem.innerspace);
            this.addRule("v.restspace_" + oItem.id + " = " + oItem.restspace);

            var aData = apf.layout.metadata[oItem.id];
            aData.calcData = oItem;
            oItem.original = aData;

            if (!oItem.parent) {
                this.addRule("v.left_" + oItem.id + " = " + pMargin[3]);
                this.addRule("v.top_"  + oItem.id + " = " + pMargin[0]);

                for (var i = 0; i < oItem.children.length; i++)
                    this.parserules(oItem.children[i]);

                return;
            }
            else {
                var vtop  = ["v.top_"  + oItem.id, " = "];
                var vleft = ["v.left_" + oItem.id, " = "];
            }
        }
        else {
            var vtop  = [oItem.id, ".style.top = "];
            var vleft = [oItem.id, ".style.left = "];

            if (oItem.hid) {
                var aData = apf.lookup(oItem.hid).aData;
                aData.calcData = oItem;
                oItem.original = aData;
            }

            var oEl     = oItem.oHtml;//document.getElementById(oItem.id);
            var diff    = apf.getDiff(oEl);
            var verdiff = diff[1];
            var hordiff = diff[0];

            if (oItem.calcwidth)
                this.addRule(oItem.id + ".style.width = -" + hordiff
                    + " + Math.max( " + oItem.calcwidth + ", " + oItem.minwidth + ")");
            else
                oEl.style.width = Math.max(0, oItem.fwidth - hordiff) + "px";

            if (oItem.calcheight)
                this.addRule(oItem.id + ".style.height = -" + verdiff
                    + " + Math.max( " + oItem.calcheight + ", " + oItem.minheight + ")");
            else
                oEl.style.height = Math.max(0, oItem.fheight - verdiff) + "px";
        }

        var oLastSame = oItem.parent.children[oItem.stackId - 1];
        var oNextSame = oItem.parent.children[oItem.stackId + 1];

        //TOP
        if (oItem.parent.vbox) {
            if (oItem.parent.isBottom) {
                if (!oNextSame)
                    vtop.push("v.top_", oItem.parent.id, " + v.height_",
                        oItem.parent.id, " - ", oItem.id, ".offsetHeight");
                else {
                    if (oNextSame.node)
                        vtop.push(oNextSame.id, ".offsetTop - ", oNextSame.edgeMargin,
                            " - ", oItem.id, ".offsetHeight");
                    else
                        vtop.push("v.top_" + oNextSame.id, " - ", oNextSame.edgeMargin,
                            " - ", (oItem.node ? oItem.id + ".offsetHeight" : "v.height_" + oItem.id));
                }
            }
            else if (!oItem.stackId)
                vtop.push("v.top_" + oItem.parent.id);
            else if (oLastSame) {
                if (oLastSame.node)
                    vtop.push(oLastSame.id, ".offsetTop + ", oLastSame.id,
                        ".offsetHeight + ", oLastSame.edgeMargin);
                else
                    vtop.push("v.top_", oLastSame.id, " + v.height_",
                        oLastSame.id, " + ", oLastSame.edgeMargin);
            }
        }
        else
            vtop.push("v.top_" + oItem.parent.id);

        //LEFT
        if (oItem.parent.hbox) {
            if (oItem.parent.isRight) {
                if (!oNextSame) {
                    vleft.push("v.left_", oItem.parent.id, " + v.width_",
                        oItem.parent.id, " - ", (oItem.node ? oItem.id + ".offsetWidth" : "v.width_" + oItem.id), null);
                }
                else {
                    if (oNextSame.node)
                        vleft.push(oNextSame.id, ".offsetLeft - ",
                            oNextSame.edgeMargin, " - ", (oItem.node ? oItem.id + ".offsetWidth" : "v.width_" + oItem.id));
                    else
                        vleft.push("v.left_" + oNextSame.id, " - ", oNextSame.edgeMargin,
                            " - ", (oItem.node ? oItem.id + ".offsetWidth" : "v.width_" + oItem.id));
                }
            }
            else if (!oItem.stackId)
                vleft.push("v.left_" + oItem.parent.id);
            else if (oLastSame) {
                if (oLastSame.node)
                    vleft.push(oLastSame.id, ".offsetLeft + ", oLastSame.id,
                        ".offsetWidth + ", oLastSame.edgeMargin);
                else
                    vleft.push("v.left_", oLastSame.id, " + v.width_",
                        oLastSame.id, " + ", oLastSame.edgeMargin);
            }
        }
        else
            vleft.push("v.left_" + oItem.parent.id);

        if (vleft.length > 2)
            this.addRule(vleft.join(""));
        if (vtop.length > 2)
            this.addRule(vtop.join(""));

        if (!oItem.node) {
            for (var i = 0; i < oItem.children.length; i++)
                this.parserules(oItem.children[i]);
        }
    };

    this.parsesplitters = function(oItem){
        //&& oItem.stackId != oItem.parent.children.length - 1
        if (oItem.parent && oItem.splitter > 0) {
            apf.layout.getSplitter(this).init(oItem.splitter, oItem.hid, oItem);
        }

        if (!oItem.node) {
            for (var i = 0; i < oItem.children.length; i++)
                this.parsesplitters(oItem.children[i]);
        }
    };

    function DepTree(){
        this.parselookup = {};
        this.nRules      = [];
        this.doneRules   = {};

        this.maskText = function(str, m1, m2, m3){
            return m1 + ".offset" + m2.toUpperCase();
        }

        this.handleVar = function(match, m1, m2, m3){
            var vname = "a" + m1.replace(/\|/g, "_") + "_style_" + m2.toLowerCase();
            return knownVars[vname] ? vname : match;
        }

        //@todo this function needs some serious optimization (according to the profiler)
        this.parseRule = function(rule){
            var aRule        = rule.split(" = "),
                id           = aRule[0].replace(/^([_\w\d\|]+)\.style\.(\w)/, this.maskText),
                vname        = "a" + aRule[0].replace(/[\.\|]/g, "_");
            knownVars[vname] = true;

            var depsearch    = aRule[1].split(/[ \(\)]/),// " "
                deps         = [],
                ruleB;
            for (var i = 0; i < depsearch.length; i++) {
                if (depsearch[i].match(/^([_\w\d\|]+)\.offset(\w+)$/) && !depsearch[i].match(/PNODE/)) {
                    deps.push(depsearch[i]);
                }
            }

            if (vname.match(/width|height/i)) {
                aRule[1] = aRule[1].replace(/^(\s*[\-\d]+[\s\-\+]+)/, "");
                ruleB    = aRule[0] + " = " + RegExp.$1 + vname;
            }
            else
                ruleB = aRule[0] + " = " + vname;

            if (rule.match(/^v\./)) {
                return {
                    id        : id,
                    rule_p1   : aRule[0] + " = ",
                    rule_p2   : aRule[1],
                    ruleb      : null,
                    deps      : deps,
                    processed : false
                };
            }

            return {
                id        : id,
                rule_p1   : "var " + vname + " = ",
                rule_p2   : aRule[1],
                ruleb     : ruleB,
                deps      : deps,
                processed : false
            };
        }

        //@todo test safari
        this.calc = function(aRules){
            var i, prop, str = "";
            for (i = 0; i < aRules.length; i++) {
                if (aRules[i].match(/^var/)) {
                    this.nRules.push(aRules[i]);
                    continue;
                }
                var o = this.parseRule(aRules[i], i);
                this.parselookup[o.id] = o;
            }

            //build referential tree (graph)
            for (prop in this.parselookup) {
                this.processNode(this.parselookup[prop]);
            }

            //Walk Tree
            for (prop in this.parselookup) {
                var root = this.parselookup[prop];
                //if(root.processed) continue;
                this.walkRules(root);
            }

            //Set last rules
            for (prop in this.parselookup) {
                this.nRules.push(this.parselookup[prop].ruleb);
            }

            return this.nRules;
        }

        this.walkRules = function(root){
            if (this.doneRules[root.id]) return;

            for (var i = 0; i < root.deps.length; i++) {
                if (root.deps[i] && !root.deps[i].walked && !this.doneRules[root.deps[i].id]) {
                    root.deps[i].walked = true;
                    this.walkRules(root.deps[i]);
                }
            }

            this.doneRules[root.id] = true;
            this.nRules.push(root.rule_p1 + root.rule_p2
                .replace(/([_\w\d\|]+)\.offset(\w+)/g, this.handleVar));
        }

        this.processNode = function(o){
            for (var i = 0; i < o.deps.length; i++) {
                var l = typeof o.deps[i] == "string"
                    ? this.parselookup[o.deps[i]]
                    : o.deps[i];
                if (!l) {
                    o.deps[i] = null;
                    continue;
                }

                o.deps[i] = l;//.copy();
                if (!l.processed) {
                    l.processed = true;
                    this.processNode(l);
                }
            }
        }
    }
};
//#endif
