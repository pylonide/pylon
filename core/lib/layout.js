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

/*
    align="{align:left,edge:splitter,edge-margin:10,splitter-size:3,exec:single}"
    
    align='bottom'
    align-position='0-0';
    align-edge='sizer'
    align-margin='10'
    align-sizer='3'
    width='x'
    height='y'
    minheight='x'
    minwidth='y'
    
    align-exec='single'
*/

// #ifdef __WITH_ALIGNMENT || __WITH_ANCHORING || __WITH_GRID

jpf.layoutServer = {
    // #ifdef __WITH_ALIGNMENT
    layouts : {},
    
    addParent : function(oHtml, pMargin){
        if (!oHtml.getAttribute("id"))
            jpf.setUniqueHtmlId(oHtml);

        return this.layouts[oHtml.getAttribute("id")] = {
            layout   : new jpf.Layout(oHtml, pMargin),
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
            splitter.loadSkin();
            splitter.draw();
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
    
    // #ifdef __WITH_GRID
    G       : [],
    
    addGrid : function(str, pHtmlNode){
        this.G.push([str, pHtmlNode]);
    },
    
    activateGrid : function(){
        if (!this.G.length) return;

        //var rsz = this.G.join("\n");
        //jpf.layoutServer.setRules(document.body, "grid", rsz, true);
        //jpf.layoutServer.activateRules(document.body);
        for (var i = 0; i < this.G.length; i++) {
            jpf.layoutServer.setRules(this.G[i][1], "grid", this.G[i][0]);//, true);
            if (!jpf.hasSingleRszEvent)
                jpf.layoutServer.activateRules(this.G[i][1]);
        }
        
        if (jpf.hasSingleRszEvent)
            jpf.layoutServer.activateRules();
    },
    // #endif
    
    // #ifdef __WITH_ALIGNMENT
    
    get : function(oHtml, pMargin){
        var layout = this.layouts[oHtml.getAttribute("id")];
        if (!layout)
            layout = this.addParent(oHtml, pMargin);
        return layout;
    },
    
    isLoadedXml : function(xmlNode){
        var nodes   = xmlNode.childNodes;
        var node    = xmlNode.selectSingleNode(".//node[@name]");//was node()
        var jmlNode = node ? self[node.getAttribute("name")] : null;
        if (!jmlNode)
            throw new Error(jpf.formatErrorString(0, null, "Loading Alignment from XML", "Could not find JML node" + (node ? " by name '" + node.getAttribute("name") + "'" : ""), xmlNode));

        var pNode   = jmlNode.oExt.parentNode;
        var pId     = this.getHtmlId(pNode);
        
        return (this.loadedXml[pId] == xmlNode);
    },
    
    //Jml Nodes should exist
    loadFrom : function(from){
        jpf.setModel(from, {
            load: function(xmlNode){
                if (!xmlNode || this.isLoaded) return;
                
                //#ifdef __DEBUG
                if (!xmlNode) {
                    throw new Error(jpf.formatErrorString(0, null, 
                        "Loading default layout", 
                        "Could not find default layout using processing \
                         instruction: '" + jpf.appsettings.layout + "'"));
    
                    return;
                }
                //#endif
                
                jpf.layoutServer.loadXml(xmlNode);
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
        var layout  = this.get(pNode, (xmlNode.getAttribute("margin") || "").split(/,\s*/));
        var pId     = this.getHtmlId(pNode);

        //Caching - still under development
        /*var xmlId = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
        if(!xmlId){
            jpf.xmldb.nodeConnect(jpf.xmldb.getXmlDocId(xmlNode), xmlNode)
            xmlId = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
        }
        
        if(this.cacheXml[xmlId]){
            var o = this.cacheXml[xmlId];
            this.metadata = o.metadata;
            this.rules[pId].layout = o.layout;
            layout.root = o.root;
            o.xmlNode.appendChild(o.root.xml);
            this.activateRules(pNode);
            this.clearSplitters(layout.layout);
            this.splitters[pId] = o.splitters.copy();
            this.freesplitters = o.freesplitters.copy();
            this.vars = jpf.extend({}, o.vars);
            for(var i=0;i<this.splitters[pId].length;i++)
                pNode.appendChild(this.splitters[pId][i].oExt);
            this.loadedXml[pId] = o.xmlNode;
            return;
        }*/
        
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
        
        /* caching - still under development
        this.cacheXml[xmlId] = {
            xmlNode       : xmlNode,
            root          : layout.root,
            layout        : this.rules[pId].layout,
            metadata      : this.metadata,
            splitters     : this.splitters[pId].copy(),
            freesplitters : this.freesplitters.copy(),
            vars          : jpf.extend({}, this.vars)
        };*/
    },
    
    /**
     * @todo Put well defined ifdef's here
     */
    metadata : [],
    getData  : function(type, layout){
        return {
            vbox        : (type == "vbox"),
            hbox        : (type == "hbox"),
            node        : !type.match(/^(?:hbox|vbox)$/),
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
            
            copy : function(){
                var copy = jpf.extend({}, this);
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
            
            hidden         : false,
            hiddenChildren : [],
            prehide        : function(){
                if (this.hidden == 3) {
                    this.hidden = true;
                    if (this.hid)
                        jpf.lookup(this.hid).visible = false;
                    if (this.oHtml)
                        this.oHtml.style.display = "none";
                    return;
                }
                
                if (!this.parent) return; //I think my business is done here...
                
                //Record current position
                this.hidepos = {
                    prev : this.parent.children[this.stackId - 1],
                    next : this.parent.children[this.stackId + 1]
                }
                
                this.hidden = true;
                jpf.layoutServer.dlist.push(this);
                
                //Check if parent is empty
                
                for (var c = 0, i = 0; i < this.parent.children.length; i++) {
                    if (!this.parent.children[i].hidden) {
                        c = 1;
                        break;
                    }
                }
                if (!c)
                    this.parent.prehide();
            },
            preshow : function(){
                if (!this.hidden) return;

                this.hidden = false;

                //Check if parent is shown
                if (this.parent.hidden)
                    this.parent.preshow();
                
                jpf.layoutServer.dlist.push(this);
            },
            
            hide : function(){
                //Remove from parent
                var nodes = this.parent.children;
                nodes.removeIndex(this.stackId);
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].stackId = i;
                
                //Add to hidden
                this.parent.hiddenChildren.push(this);
                
                if (this.hidden != 3) {
                    if (this.hid)
                        jpf.lookup(this.hid).visible = false;
                    if (this.oHtml)
                        this.oHtml.style.display = "none";
                }
            },
            
            show : function(){
                //if(!this.hidden) return;

                //Check if position is still available
                var nodes = this.parent.children;
                if (this.hidepos.prev && this.hidepos.prev.parent == this.parent
                  && !this.hidepos.prev.hidden) {
                    if (nodes.length < this.hidepos.prev.stackId+ 1 )
                        nodes.push(this);
                    else
                        nodes.insertIndex(this, this.hidepos.prev.stackId + 1);
                }
                else if (this.hidepos.next && this.hidepos.next.parent == this.parent
                  && !this.hidepos.next.hidden) {
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

                if (this.hidden != 3) {
                    if (this.hid)
                        jpf.lookup(this.hid).visible = true;
                    if (this.oHtml)
                        this.oHtml.style.display = "block";
                }
                
                this.hidden  = false;
                this.hidepos = null;
            }
            
            //#endif
        };
    },
    
    // #ifdef __WITH_ALIGNXML
    
    parseXml : function(x, layout, jmlNode, norecur){
        var aData = this.getData(x[jpf.TAGNAME], layout.layout);
        
        if (aData.node) {
            if (!jmlNode) {
                var jmlNode = self[x.getAttribute("name")];
                //#ifdef __DEBUG
                if (!jmlNode) {
                    throw new Error(jpf.formatErrorString(0, null, 
                        "Parsing Alignment from XML", 
                        "Could not find JML node" + x.getAttribute("name"), x));
                }
                //#endif
            }
            
            if (!jmlNode.visible)
                jmlNode.show(true);//jmlNode.setProperty("visible", true);//not the most optimal position

            aData.oHtml   = jmlNode.oExt;
            jmlNode.aData = aData;

            if (!jmlNode.hasFeature(__ALIGNMENT__)) {
                jmlNode.inherit(jpf.Alignment);
                if (jmlNode.hasFeature(__ANCHORING__))
                    jmlNode.disableAnchoring();
            }
            
            var jml = jmlNode.jml;
            if (jml.getAttribute("width"))
                aData.fwidth = jml.getAttribute("width");
            if (jml.getAttribute("height"))
                aData.fheight = jml.getAttribute("height");
            if (jmlNode.minwidth)
                aData.minwidth = jmlNode.minwidth;
            if (jmlNode.minheight)
                aData.minheight = jmlNode.minheight;
            
            if (!this.getHtmlId(aData.oHtml))
                jpf.setUniqueHtmlId(aData.oHtml);
            aData.id = this.getHtmlId(aData.oHtml);
            if (aData.oHtml.style)
                aData.oHtml.style.position = "absolute";
            aData.hid = jmlNode.uniqueId;
        } else {
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
            aData.fwidth = x.getAttribute("width");
        if (x.getAttribute("height"))
            aData.fheight = x.getAttribute("height");
        if (x.getAttribute("minwidth"))
            aData.minwidth = x.getAttribute("minwidth");
        if (x.getAttribute("minheight"))
            aData.minheight = x.getAttribute("minheight");
        if (x.getAttribute("lastheight"))
            aData.lastfheight = x.getAttribute("lastheight");
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
    
    getXml : function(pNode){
        var l = jpf.layoutServer.get(pNode);
        var xmlNode = l.root.xml
            ? l.root.xml.ownerDocument.createElement("layout")
            : jpf.xmldb.getXml("<layout />");
        jpf.layoutServer.parseToXml(l.root, xmlNode);
        return xmlNode;
    },
    
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
            xmlNode.setAttribute("margin", oItem.edgeMargin);
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
    
    compile : function(oHtml){
        var l = this.layouts[oHtml.getAttribute("id")];
        if (!l) return false;

        var root = l.root.copy();//is there a point to copying?
        l.layout.compile(root);
        l.layout.reset();
    },
    
    timer : null,
    qlist : {},
    //#ifdef __WITH_DOCKING
    dlist : [],
    //#endif

    queue : function(oHtml, obj, compile){
        if (this.qlist[oHtml.getAttribute("id")]) {
            if (obj)
                this.qlist[oHtml.getAttribute("id")][2].push(obj);
            return;
        }

        this.qlist[oHtml.getAttribute("id")] = [oHtml, compile, [obj]];
        
        if(!this.timer)
            this.timer = setTimeout("jpf.layoutServer.processQueue()");
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
                jpf.layoutServer.compile(qItem[0]);
            
            list = qItem[2];
            for (i = 0, l = list.length; i < l; i++) {
                if (list[i])
                    list[i].__updateLayout();
            }
            
            if (!jpf.hasSingleRszEvent)
                jpf.layoutServer.activateRules(qItem[0]);
        }
        
        if (jpf.hasSingleRszEvent)
            jpf.layoutServer.activateRules();
            
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
    
    getRules : function(oHtml, id){
        return id
            ? this.rules[this.getHtmlId(oHtml)][id]
            : this.rules[this.getHtmlId(oHtml)];
    },
    
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
    
    activateRules : function(oHtml, no_exec){
        if (!jpf.hasSingleRszEvent && !oHtml) {
            var prop;
            for( prop in this.rules) {
                if (document.getElementById(prop).onresize)
                    continue;
                this.activateRules(document.getElementById(prop));
            }
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
                : new Function(strRules.join("\n").replace(/ \+ 'px'/g,""))
            oHtml.onresize = rsz;
            if (!no_exec)
                rsz();
        }
        else {
            for (rule in this.rules) {
                rules = this.rules[rule];
                for (id in rules) { //might need optimization using join()
                    if (typeof rules[id] != "string" || rules[id] == "number")
                        continue;
                    strRules.push(rules[id]);
                }
            }
        
            //A hack.. should build a dep tree, but actually FF should just implement onresize on any HTML element.
            window.onresize = new Function(strRules.reverse().join("\n") + "\n" 
                + strRules.join("\n"));
            try {
                if (!no_exec)
                    window.onresize();
            }
            catch (e) {}
        }
    },
    
    forceResize : function(oHtml){
        var rsz = (!jpf.hasSingleRszEvent ? oHtml : window).onresize;
        if (rsz) rsz();
    }
    
    // #ifdef __WITH_DOCKING
    ,paused : {},
    
    pause  : function(oHtml, replaceFunc){
        if (jpf.hasSingleRszEvent)
            oHtml = window;
        this.paused[this.getHtmlId(oHtml)] = oHtml.onresize;
        
        if (replaceFunc) {
            oHtml.onresize = replaceFunc;
            replaceFunc();
        }
        else
            oHtml.onresize = null;
    },
    
    play : function(oHtml){
        if (!this.paused[this.getHtmlId(oHtml)])
            return;
        
        if (jpf.hasSingleRszEvent)
            oHtml = window;
        
        var oldFunc = this.paused[this.getHtmlId(oHtml)];
        oHtml.onresize = oldFunc;
        if (oldFunc)
            oldFunc();
        
        this.paused[this.getHtmlId(oHtml)] = null;
    }
    // #endif
};

// #endif

// #ifdef __WITH_ALIGNMENT

/**
 * @constructor
 */
jpf.Layout = function(parentNode, pMargin){
    var pMargin  = (pMargin && pMargin.length == 4) ? pMargin : [0, 0, 0, 0];
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
    }
    
    this.reset = function(){
        this.RULES = [];
        knownVars  = {};
        this.lastType = this.globalEdge = this.globalSplitter = null;
    }
    
    this.compile = function(root, noapply){
        this.addRule("var v = jpf.layoutServer.vars");

        this.globalSplitter = root.splitter;
        this.globalEdge     = root.edgeMargin;

        if (this.globalSplitter || this.globalEdge)
            this.setglobals(root);

        this.preparse(root);
        this.parserules(root);

        if (this.createSplitters) {
            jpf.layoutServer.clearSplitters(this);
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
            jpf.layoutServer.setRules(this.parentNode, "layout", str, true);
        else
            return str;

        return false;
    }
    
    this.addRule = function(rule){
        this.RULES.push(rule);
    }
    
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
    }
    
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
        
        if (node.node)
            return;
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
                
                if (!nodes[i].node)
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
                    var verdiff = diff[0];
                    var hordiff = diff[1];
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
    }
    
    this.parserules = function(oItem){
        if (!oItem.node) {
            this.addRule("v.width_" + oItem.id + " = Math.max(" + oItem.childminwidth
                + "," + oItem.minwidth + "," + (oItem.calcwidth || oItem.fwidth) + ")");
            this.addRule("v.height_" + oItem.id + " = Math.max(" + oItem.childminheight
                + "," + oItem.minheight + "," + (oItem.calcheight || oItem.fheight) + ")");
            this.addRule("v.weight_" + oItem.id + " = " + oItem.childweight);
            this.addRule("v.innerspace_" + oItem.id + " = " + oItem.innerspace);
            this.addRule("v.restspace_" + oItem.id + " = " + oItem.restspace);
            
            var aData = jpf.layoutServer.metadata[oItem.id];
            aData.calcData = oItem;
            oItem.original = aData;
            
            if (!oItem.parent) {
                this.addRule("v.left_" + oItem.id + " = " + pMargin[0]);
                this.addRule("v.top_"  + oItem.id + " = " + pMargin[3]);
                
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
    }
    
    this.parsesplitters = function(oItem){
        if (oItem.parent && oItem.splitter > 0 && oItem.stackId != oItem.parent.children.length - 1)
            jpf.layoutServer.getSplitter(this).init(oItem.splitter, oItem.hid, oItem);
        
        if (!oItem.node) {
            for (var i = 0; i < oItem.children.length; i++)
                this.parsesplitters(oItem.children[i]);
        }
    }
    
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
                    ruleb	  : null,
                    deps      : deps,
                    processed : false
                };
            }

            return {
                id        : id,
                rule_p1   : "var " + vname + " = ",
                rule_p2   : aRule[1],
                ruleb	  : ruleB,
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
}
//#endif
