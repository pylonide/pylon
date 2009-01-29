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

// #ifdef __WITH_ALIGNMENT || __WITH_ANCHORING || __WITH_GRID

/**
 * Takes care of the spatial order of elements withing the display area
 * of the browser. Layouts can be saved to xml and loaded again. Window
 * elements are dockable, which means the user can change the layout as he/she
 * wishes. The state of the layout can be saved as xml at any time.
 *
 * Example:
 * This example shows 5 windows which have a layout defined in layout.xml.
 * <code>
 *  <j:appsettings layout="url:layout.xml:layout[1]" />
 *
 *  <j:window title="Main Window" id="b1" />
 *  <j:window title="Tree Window" id="b2" />
 *  <j:window title="Window of Oppertunity" id="b3" />
 *  <j:window title="Small window" id="b4" />
 *  <j:window title="Some Window" id="b5" />
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
 *  <j:list id="lstLayouts"
 *    model          = "mdlLayouts"
 *    allowdeselect  = "false"
 *    onafterselect  = "
 *      if(!this.selected || jpf.layout.isLoadedXml(this.selected))
 *          return;
 *
 *      jpf.layout.saveXml();
 *      jpf.layout.loadXml(this.selected);
 *    "
 *    onbeforeremove = "return confirm('Do you want to delete this layout?')">
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:icon value="layout.png" />
 *          <j:traverse select="layout" />
 *      </j:bindings>
 *      <j:actions>
 *          <j:rename select="." />
 *          <j:remove select="." />
 *      </j:actions>
 *  </j:list>
 *  <j:button
 *    onclick = "
 *      if (!lstLayouts.selected)
 *          return;
 *
 *      var newLayout = jpf.layout.getXml(document.body);
 *      newLayout.setAttribute("name", "New");
 *      jpf.xmldb.appendChild(lstLayouts.selected.parentNode, newLayout);
 *      lstLayouts.select(newLayout, null, null, null, null, true);
 *      jpf.layout.loadXml(newLayout);
 *      lstLayouts.startRename();
 *    ">
 *      Add Layout
 *  </j:button>
 * </code>
 *
 * @default_private
 * @todo a __WITH_DOM_REPARENTING should be added which can remove many of the functions of this element.
 */
jpf.layout = {
    // #ifdef __WITH_ALIGNMENT
    layouts : {},

    addParent : function(oHtml, pMargin){
        if (!oHtml.getAttribute("id"))
            jpf.setUniqueHtmlId(oHtml);

        return this.layouts[oHtml.getAttribute("id")] = {
            layout   : new jpf.layoutParser(oHtml, pMargin),
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
            var splitter = new jpf.splitter(this.parentNode);
            splitter.$loadSkin();
            splitter.$draw();
        }

        this.splitters[this.getHtmlId(layout.parentNode)].push(splitter);

        return splitter;
    },

    clearSplitters : function(layout){
        var ar = this.splitters[this.getHtmlId(layout.parentNode)];
        if (!ar) return;

        for (var i = 0; i < ar.length; i++) {
            this.freesplitters.push(ar[i]);
            if (!ar[i].oExt.parentNode) continue;

            ar[i].oExt.parentNode.removeChild(ar[i].oExt);
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
        var jmlNode = node ? self[node.getAttribute("name")] : null;

        //#ifdef __DEBUG
        if (!jmlNode) {
            throw new Error(jpf.formatErrorString(0, null,
                "Loading Alignment from XML",
                "Could not find JML node" + (node ? " by name '"
                + node.getAttribute("name") + "'" : ""), xmlNode));
        }
        //#endif

        var pNode = jmlNode.oExt.parentNode;
        var pId   = this.getHtmlId(pNode);

        return (this.loadedXml[pId] == xmlNode);
    },

    /**
     * Loads a layout using a data instruction.
     * @param {String} instruction the data instruction specifying where to load the data from.
     * Example:
     * <code>
     *  jpf.layout.loadFrom("mdlLayout:layout[1]");
     * </code>
     * Remarks:
     * The jml elements referenced in the layout definition should exist when
     * this function is called.
     */
    loadFrom : function(instruction){
        jpf.setModel(instruction, {
            load: function(xmlNode){
                if (!xmlNode || this.isLoaded) return;

                //#ifdef __DEBUG
                if (!xmlNode) {
                    throw new Error(jpf.formatErrorString(0, null,
                        "Loading default layout",
                        "Could not find default layout using processing \
                         instruction: '" + instruction + "'"));

                    return;
                }
                //#endif

                jpf.layout.loadXml(xmlNode);
                this.isLoaded = true;
            },

            setModel: function(model, xpath){
                if (typeof model == "string")
                    model = jpf.nameserver.get("model", model);
                model.register(this, xpath);
            }
        });
    },

    loadedXml : {},
    cacheXml  : {},
    /**
     * Loads a layout from an xml element.
     * @param {XMLElement} xmlNode the xml element containing the layout description.
     * Remarks:
     * The jml elements referenced in the layout definition should exist when
     * this function is called.
     */
    loadXml   : function(xmlNode){
        var nodes   = xmlNode.childNodes;
        var node    = xmlNode.selectSingleNode(".//node[@name]");//was node()
        var jmlNode = node ? self[node.getAttribute("name")] : null;

        //#ifdef __DEBUG
        if(!jmlNode) {
            throw new Error(jpf.formatErrorString(0, null,
                "Loading Alignment from XML",
                "Could not find JML node" + (node ? " by name '"
                + node.getAttribute("name") + "'" : ""), xmlNode));
        }
        //#endif

        var pNode   = jmlNode.oExt.parentNode;
        var layout  = this.get(pNode, jpf.getBox(xmlNode.getAttribute("margin") || ""));
        var pId     = this.getHtmlId(pNode);

        this.metadata = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            layout.root = this.parseXml(nodes[i], layout);
            break;
        }

        this.compile(pNode);
        if (jpf.JmlParser.inited)
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
                var me = jpf.vardump(this, null, false);
                for (var i = 0; i < this.children.length; i++) {
                    me += "\n{Child " + i + "\n===========\n"
                          + this.children[i].toString() + "}";
                }

                return me;
            },
            //#endif

            copy : function(){
                var copy = jpf.extend({}, this);
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
                var diff = jpf.getDiff(this.oHtml);

                this.oHtml.style.width = (this.size[0]-diff[0]) + "px";
                if (this.state < 0)
                    this.oHtml.style.height = (this.size[1] - diff[1]) + "px";

                this.prehide();
                this.hidden = 3;

                if (this.hid) {
                    var jmlNode = jpf.lookup(this.hid);
                    if (jmlNode.syncAlignment)
                        jmlNode.syncAlignment(this);
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
                        jpf.lookup(this.hid).visible = false;
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
                        if (child != this && !child.hidden) { // || jpf.layout.dlist.contains(child)
                            c = 1;
                            break;
                        }
                    }
                }
                if (!c)
                    this.parent.prehide(adminOnly);
                
                if (adminOnly)
                    return this.hide(true);
                
                if (jpf.layout.dlist.contains(this)) {
                    jpf.layout.dlist.remove(this);
                    return false;
                }
                else
                    jpf.layout.dlist.pushUnique(this);
            },
            preshow : function(adminOnly){
                if (!this.hidden)
                    return;

                this.hidden = false;

                if (adminOnly)
                    return this.show(true);

                //Check if parent is shown
                if (this.parent.hidden) // || jpf.layout.dlist.contains(this.parent) @todo please make hidden a 4 state property
                    this.parent.preshow();

                if (jpf.layout.dlist.contains(this)) {
                    jpf.layout.dlist.remove(this);
                    return false;
                }
                else
                    jpf.layout.dlist.pushUnique(this);
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
                        jpf.lookup(this.hid).visible = false;
                    if (this.oHtml)
                        this.oHtml.style.display = "none";
                }
            },

            show : function(adminOnly){
                //Check if position is still available
                var nodes = this.parent.children;
                if (this.hidepos.prev && this.hidepos.prev.parent == this.parent
                  && !this.hidepos.prev.hidden && !jpf.layout.dlist.contains(this.hidepos.prev)) { //@todo please make hidden a 4 state property
                    if (nodes.length < this.hidepos.prev.stackId+ 1 )
                        nodes.push(this);
                    else
                        nodes.insertIndex(this, this.hidepos.prev.stackId + 1);
                }
                else if (this.hidepos.next && this.hidepos.next.parent == this.parent
                  && !this.hidepos.next.hidden && !jpf.layout.dlist.contains(this.hidepos.next)) { //@todo please make hidden a 4 state property
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
                            jpf.lookup(this.hid).visible = true;
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
                    jpf.layout.dlist.remove(this);
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

    // #ifdef __WITH_ALIGNXML

    parseXml : function(x, layout, jmlNode, norecur){
        var aData = this.getData(typeof jmlNode == "string"
            ? jmlNode
            : x[jpf.TAGNAME], layout.layout);

        if (aData.node) {
            if (!jmlNode) {
                jmlNode = self[x.getAttribute("name")];
                //#ifdef __DEBUG
                if (!jmlNode) {
                    throw new Error(jpf.formatErrorString(0, null,
                        "Parsing Alignment from XML",
                        "Could not find JML node" + x.getAttribute("name"), x));
                }
                //#endif
            }

            //if (!jmlNode.visible)
                //jmlNode.show(true);//jmlNode.setProperty("visible", true);//not the most optimal position

            aData.oHtml   = jmlNode.oExt;
            jmlNode.aData = aData;

            if (!jmlNode.hasFeature(__ALIGNMENT__)) {
                jmlNode.inherit(jpf.Alignment);
                if (jmlNode.hasFeature(__ANCHORING__))
                    jmlNode.disableAnchoring();
            }

            var jml = jmlNode.$jml;
            if (jml.getAttribute("width"))
                aData.fwidth = jml.getAttribute("width");
            if (jml.getAttribute("height"))
                aData.fheight = jml.getAttribute("height");
            /*if (jmlNode.minwidth)
                aData.minwidth = jmlNode.minwidth;
            if (jmlNode.minheight)
                aData.minheight = jmlNode.minheight;*/

            if (!this.getHtmlId(aData.oHtml))
                jpf.setUniqueHtmlId(aData.oHtml);
            aData.id = this.getHtmlId(aData.oHtml);
            if (aData.oHtml.style)
                aData.oHtml.style.position = "absolute";
            aData.hid = jmlNode.uniqueId;
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
                || (x.getAttribute("edge") == "splitter" ? 5 : false);
        if (x.getAttribute("width"))
            aData.fwidth = String(jpf.parseExpression(x.getAttribute("width")));
        if (x.getAttribute("height"))
            aData.fheight = String(jpf.parseExpression(x.getAttribute("height")));
        if (x.getAttribute("minwidth"))
            aData.minwidth = x.getAttribute("minwidth");
        //@todo calculate inner minheight en minwidth
        /*if (x.getAttribute("minheight"))
            aData.minheight = x.getAttribute("minheight");
        if (x.getAttribute("lastheight"))
            aData.lastfheight = x.getAttribute("lastheight");*/
        if (x.getAttribute("lastsplitter"))
            aData.lastsplitter = x.getAttribute("lastsplitter");
        if (x.getAttribute("hidden"))
            aData.hidden = (x.getAttribute("hidden") == 3)
                ? x.getAttribute("hidden")
                : jpf.isTrue(x.getAttribute("hidden"));
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
        if (aData.node && jmlNode.syncAlignment)
            jmlNode.syncAlignment(aData);

        if (!norecur && !aData.node) {
            var nodes = x.childNodes;
            for (var last, a, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) continue;

                a = this.parseXml(nodes[i], layout);

                if (last && last.hidden)
                    last.hidepos.next = a;

                if (a.hidden) {
                    if (a.hid) {
                        var j = jpf.lookup(a.hid);
                        if (a.hidden === true && j.visible) {
                            j.visible = false;
                            a.oHtml.style.display = "none";
                        }
                        if (a.hidden == 3) {
                            var diff = jpf.getDiff(a.oHtml);
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
                        var j = jpf.lookup(a.hid);
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

    /**
     * Makes a copy of the current state of the layout and encodes it in xml.
     * @param {HTMLElement} pNode the html parent for which the layout is expressed in xml.
     * @returns {XMLElement} the xml representation of the layout.
     */
    getXml : function(pNode){
        var l = jpf.layout.get(pNode);
        var xmlNode = l.root.xml
            ? l.root.xml.ownerDocument.createElement("layout")
            : jpf.xmldb.getXml("<layout />");
        jpf.layout.parseToXml(l.root, xmlNode);
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
            if (l)
                jpf.layout.clearSplitters(l.layout);

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
    addAlignNode : function(jmlNode, pData){
        var align = (typeof jmlNode.align == "undefined"
            ? jmlNode.$jml.getAttribute("align")
            : jmlNode.align).split("-");
        var s = pData.children;
        var a = jmlNode.aData;

        if (typeof jmlNode.splitter == "undefined") {
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
                var l = jpf.layout.get(pData.pHtml);
                hbox = jpf.layout.parseXml(jpf.xmldb.getXml("<hbox />"), l, null, true);
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
                var l = jpf.layout.get(pData.pHtml);
                col = jpf.layout.parseXml(jpf.xmldb.getXml("<vbox />"), l, null, true);
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
                            ncol = jpf.layout.parseXml(jpf.xmldb.getXml("<vbox />"), l, null, true);
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

    timer : null,
    qlist : {},
    //@todo incorrect assumption that its only for docking
    //#ifdef __WITH_DOCKING
    dlist : [],
    //#endif

    removeAll : function(aData) {
        aData.children.length = null
        this.compileAlignment(aData);

        var htmlId = this.getHtmlId(aData.pHtml);
        if (!this.rules[htmlId])
            delete this.qlist[htmlId];
    },

    queue : function(oHtml, obj, compile){
        if (this.qlist[oHtml.getAttribute("id")]) {
            if (obj)
                this.qlist[oHtml.getAttribute("id")][2].push(obj);
            return;
        }

        this.qlist[oHtml.getAttribute("id")] = [oHtml, compile, [obj]];

        if(!this.timer)
            this.timer = setTimeout("jpf.layout.processQueue()");
    },

    processQueue : function(){
        clearTimeout(this.timer);
        this.timer = null;

        var i, id, l, qItem, list;

        //#ifdef __WITH_DOCKING
        for (i = 0; i < this.dlist.length; i++) {
            if (this.dlist[i].hidden)
                this.dlist[i].hide();
            else
                this.dlist[i].show();
        }
        //#endif

        for (id in this.qlist) {
            qItem = this.qlist[id];

            if (qItem[1])
                jpf.layout.compileAlignment(qItem[1]);

            list = qItem[2];
            for (i = 0, l = list.length; i < l; i++) {
                if (list[i])
                    list[i].$updateLayout();
            }

            jpf.layout.activateRules(qItem[0]);
        }

        //if (jpf.hasSingleRszEvent)
            //jpf.layout.activateRules();

        this.qlist = {};
        //#ifdef __WITH_DOCKING
        this.dlist = [];
        //#endif
    },

    // #endif

    rules     : {},
    onresize  : {},

    getHtmlId : function(oHtml){
        //if(jpf.hasSingleRszEvent) return 1;
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
            jpf.setUniqueHtmlId(oHtml);
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
        if (!this.rules[this.getHtmlId(oHtml)])
            return;

        var ret = this.rules[this.getHtmlId(oHtml)][id] ||  false;
        delete this.rules[this.getHtmlId(oHtml)][id];

        var prop;
        for (prop in this.rules[this.getHtmlId(oHtml)]) {

        }
        if (!prop)
            delete this.rules[this.getHtmlId(oHtml)]

        return ret;
    },

    /**
     * Activates the rules set for an html element
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     */
    activateRules : function(oHtml, no_exec){
        if (!oHtml) { //!jpf.hasSingleRszEvent &&
            var prop, obj;
            for(prop in this.rules) {
                obj = document.getElementById(prop);
                if (!obj || obj.onresize) // || this.onresize[prop]
                    continue;
                this.activateRules(obj);
            }

             if (jpf.hasSingleRszEvent && window.onresize)
                window.onresize();
            return;
        }

        var rsz, id, rule, rules, strRules = [];
        if (!jpf.hasSingleRszEvent) {
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

            //jpf.console.info(strRules.join("\n"));
            rsz = jpf.needsCssPx
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
                delete this.onresize[htmlId];
                return false;
            }

            for (id in rules) { //might need optimization using join()
                if (typeof rules[id] != "string")
                    continue;
                strRules.push(rules[id]);
            }

            this.onresize[htmlId] = new Function(strRules.join("\n"));//.replace(/try\{/g, "").replace(/}catch\(e\)\{\s*\}/g, "\n")
            if (!no_exec)
                this.onresize[htmlId]();

            /*for (rule in this.rules) {
                rules = this.rules[rule];
                for (id in rules) { //might need optimization using join()
                    if (typeof rules[id] != "string" || rules[id] == "number")
                        continue;
                    strRules.push(rules[id]);
                }
            }*/

            if (!window.onresize) {
                var f = jpf.layout.onresize;
                window.onresize = function(){
                    var s = [];
                    for (var name in f)
                        s.unshift(f[name]);
                    for (var i = 0; i < s.length; i++)
                        s[i]();
                        //f[name]();
                }
            }
            /*
            //A hack.. should build a dep tree, but actually FF should just implement onresize on any HTML element.
            window.onresize = new Function(strRules.reverse().join("\n") + "\n"
                + strRules.join("\n"));
            try {
                if (!no_exec)
                    window.onresize();
            }
            catch (e) {}
            */
        }
    },

    /**
     * Forces calling the resize rules for an html element
     * @param {HTMLElement} oHtml  the element for which the rules are executed.
     */
    forceResize : function(oHtml){
        if (jpf.hasSingleRszEvent)
            return window.onresize && window.onresize();

        /* @todo this should be done recursive, old way for now
        jpf.hasSingleRszEvent
            ? this.onresize[this.getHtmlId(oHtml)]
            :
        */

        var rsz = oHtml.onresize;
        if (rsz)
            rsz();
    },

    paused : {},

    /**
     * Disables the resize rules for the html element temporarily.
     * @param {HTMLElement} oHtml  the element for which the rules are paused.
     * @param {Function}    func   the resize code that is used temporarily for resize of the html element.
     */
    pause  : function(oHtml, replaceFunc){
        if (jpf.hasSingleRszEvent) {
            var htmlId = this.getHtmlId(oHtml);
            this.paused[htmlId] = this.onresize[htmlId] || true;

            if (replaceFunc) {
                this.onresize[htmlId] = replaceFunc;
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

        if (jpf.hasSingleRszEvent) {
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

// #endif

// #ifdef __WITH_ALIGNMENT

/**
 * @constructor
 * @private
 */
jpf.layoutParser = function(parentNode, pMargin){
    pMargin  = (pMargin && pMargin.length == 4) ? pMargin : [0, 0, 0, 0];
    this.pMargin = pMargin;
    this.RULES   = [];

    this.parentNode = parentNode;
    if (!this.parentNode.getAttribute("id"))
        jpf.setUniqueHtmlId(this.parentNode);

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
        this.addRule("var v = jpf.layout.vars");

        this.globalSplitter = root.splitter;
        this.globalEdge     = root.edgeMargin;

        if (this.globalSplitter || this.globalEdge)
            this.setglobals(root);

        this.preparse(root);
        this.parserules(root);

        if (this.createSplitters) {
            jpf.layout.clearSplitters(this);
            this.parsesplitters(root);
        }

        //Sort by checking dependency structure
        this.RULES = new DepTree().calc(this.RULES);
        var str = ("try{" + this.RULES.join("}catch(e){}\ntry{") + "}catch(e){}\n")
            .replace(/([^=]+\.style[^=]+) = (.*?)\}/g, "$1 = ($2) + 'px'}");

        if (!jpf.hasHtmlIdsInJs) //@todo speed?
            str = str.replace(/q([\w|]+)\.(offset|style)/g, 'document.getElementById("q$1").$2');

        //optimization
        //if(this.parentNode != document.body)
            //"if(document.getElementById('" + this.parentNode.id + "').offsetHeight){" + str + "};";

        this.lastRoot = root;

        if (!noapply)
            jpf.layout.setRules(this.parentNode, "layout", str, true);
        else
            return str;

        return false;
    };

    this.addRule = function(rule){
        this.RULES.push(rule);
    };

    this.setglobals = function(node){
        if (this.globalEdge && !node.edgeMargin) {
            if (!node.splitter)
                node.splitter = this.globalSplitter;
            node.edgeMargin = Math.max(this.globalSplitter, this.globalEdge);
        }

        if (node.node) return;

        for (var i = 0; i < node.children.length; i++) {
            this.setglobals(node.children[i]);
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

                if (nodes[i].node)
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
                    var diff    = jpf.getDiff(this.parentNode);
                    verdiff = diff[0];
                    hordiff = diff[1];
                }

                var strParentNodeWidth  = (this.parentNode.tagName.toLowerCase() == "body"
                    ? (jpf.isIE ? "document.documentElement['offsetWidth']" : "window.innerWidth")
                    : "document.getElementById('" + this.parentNode.id + "').offsetWidth");
                var strParentNodeHeight = (this.parentNode.tagName.toLowerCase() == "body"
                    ? (jpf.isIE ? "document.documentElement['offsetHeight']" : "window.innerHeight")
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

            var aData = jpf.layout.metadata[oItem.id];
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
                var aData = jpf.lookup(oItem.hid).aData;
                aData.calcData = oItem;
                oItem.original = aData;
            }

            var oEl     = oItem.oHtml;//document.getElementById(oItem.id);
            var diff    = jpf.getDiff(oEl);
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
                if (!oNextSame)
                    vleft.push("v.left_", oItem.parent.id, " + v.width_",
                        oItem.parent.id, " - ", oItem.id, ".offsetWidth", null);
                else {
                    if (oNextSame.node)
                        vleft.push(oNextSame.id, ".offsetLeft - ",
                            oNextSame.edgeMargin, " - ", oItem.id, ".offsetWidth");
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
            jpf.layout.getSplitter(this).init(oItem.splitter, oItem.hid, oItem);
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

        this.parseRule = function(rule){
            var aRule        = rule.split(" = ");
            var id           = aRule[0].replace(/^([_\w\d\|]+)\.style\.(\w)/, this.maskText);
            var vname        = "a" + aRule[0].replace(/[\.\|]/g, "_");
            knownVars[vname] = true;

            var depsearch    = aRule[1].split(/[ \(\)]/);// " "
            var deps         = [];
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
                ruleb      : ruleB,
                deps      : deps,
                processed : false
            };
        }

        //@todo test safari
        this.calc = function(aRules){
            var str = "";
            for (var i = 0; i < aRules.length; i++) {
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
