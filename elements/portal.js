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
// #ifdef __AMLPORTAL || __INC_ALL

/**
 * Element displaying a rectangle consisting of one or more columns
 * which contain zero or more windows. Each window is loaded with specific
 * content described in aml. Each of these so-called 'docklets'
 * can have specific data loaded from a datasource and can
 * be instantiated more than once.
 * Example:
 * <code>
 *  <a:portal columns="60%,40%">
 *      <a:bindings>
 *          <a:src match="[@src]" />
 *          <a:collapsed match="[@collapsed]" value="0" />
 *          <a:icon value="icoDocklet.png" />
 *          <a:column match="[@column]" />
 *          <a:caption match="[@name]" />
 *          <a:each match="[docklet]" />
 *      </a:bindings>
 *      <a:model>
 *          <docklets>
 *              <docklet name="Usage"    src="usage.xml"    column="0" />
 *              <docklet name="Billing"  src="history.xml"  column="0" />
 *              <docklet name="Orders"   src="orders.xml"   column="1" />
 *              <docklet name="Features" src="features.xml" column="1" />
 *          </docklets>
 *      </a:model>
 *  </a:portal>
 * </code>
 * Remarks:
 * A docklet xml is a piece of aml that should be in the following form:
 * <code>
 *  <a:docklet xmlns:a="http://ajax.org/2005/aml" 
 *    caption="Billing History" icon="icoBilling.gif" name="BillHistory">
 *      <a:script><![CDATA[
 *          function BillHistory(){
 *              this.$init();
 *
 *              this.$create = function(xmlSettings, oDocklet){
 *                  //Process xml settings
 *              }
 *          }
 *          BillHistory.prototype = new apf.portal.Docklet();
 *      ]]></a:script>
 *
 *      <!-- the edit panel of the window -->
 *      <a:config>
 *          ...
 *      </a:config>
 *
 *      <!-- the body of the window -->
 *      <a:body>
 *          ...
 *      </a:body>
 *  </a:docklet>
 * </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:portal
 *
 * @inherits apf.MultiSelect
 * @inherits apf.DataAction
 * @inherits apf.Cache
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding src       Determines the data instruction that loads the docklet from it's datasource.
 * @binding collapsed Determines whether the docklet is collapsed after init.
 * @binding icon      Determines the icon of the docklet.
 * @binding column    Determines the column in which the docklet is created.
 * @binding caption   Determines the caption of the docklet.
 */
apf.portal = function(struct, tagName){
    this.$init(tagName || "portal", apf.NODE_VISIBLE, struct);
    
    this.$columns   = [];
};

(function(){
    this.implement(
        //apf.Cache,
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );

    this.$focussable     = false;
    this.buttons         = "edit|min|close";

    this.$deInitNode = function(xmlNode, htmlNode){
        cacheDocklet.call(this, apf.findHost(htmlNode));
    };

    this.$updateNode = function(xmlNode, htmlNode){
        var docklet = apf.findHost(htmlNode);
        docklet.setProperty("buttons", this.$applyBindRule("buttons", xmlNode) || "");
        docklet.draggable = this.$applyBindRule("draggable", xmlNode);
    };

    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode)
            return;
    };
    this.select = function(){}
    
    this.findColumnNr = function(x, y){
        var el = document.elementFromPoint(x, y);

        //search for element
        while (!el.isColumn && el.parentNode) {
            el = el.parentNode;
        }

        return el.isColumn && this.$columns.indexOf(el) || 0;
    }
    
    this.$moveDocklet = function(docklet) {
        var colNr = this.$columns.indexOf(docklet.$ext.parentNode) || 0;
        
        var dataNode = docklet.dataNode;
        
        //@todo hacky, should be via executeAction
        dataNode.setAttribute("column", colNr);
        
        //more hack stuff
        //determine docklet xml position by the html position
        var nr = apf.xmldb.getChildNumber(docklet.oExt), 
        	  nodes = dataNode.selectNodes("../node()[@column='" + colNr + "']");
        if (nodes[nr] != dataNode) {
        		var jmlNode = apf.findHost(docklet.oExt.nextSibling);
        		dataNode.parentNode.insertBefore(dataNode, jmlNode && jmlNode.dataNode || null);
        }
        
        this.dispatchEvent("widgetmove");
    }
    
    this.columns = "33.33%,33.33%,33.33%";
    this.$columnWidths  = this.columns.splitSafe(",");
    
     /**
     * @attribute {String} columns a comma seperated list of column sizes.
     * A column size can be specified in a number (size in pixels) or using
     * a number and a % sign to indicate a percentage.
     * Defaults to "33%, 33%, 33%".
     * Example:
     * <code>
     *  <a:portal columns="25%, 50%, 25%">
     *      ...
     *  </a:portal>
     * </code>
     *
     * @todo make this dynamic
     */
    this.$propHandlers["columns"] = function(value){
        if (!value) return;
        this.$columnWidths = value.splitSafe(",");

        var col, nodes, pHtmlNode, amlNode, node;
        while (this.$columns.length > this.$columnWidths.length) {
            col = this.$columns.pop();
            col.host = null;
            
            nodes = col.childNodes
            pHtmlNode = this.$columns[0];
            for (var i = nodes.length - 1; i >= 0; i--) {
                if ((node = nodes[i]).nodeType != 1)
                    continue;
                    
                pHtmlNode.appendChild(node);
                amlNode = apf.findHost(node);
                amlNode.$pHtmlNode = pHtmlNode;
                amlNode.dataNode.setAttribute("column", 0); //@todo wrong!! apf3.0
            }

            apf.destroyHtmlNode(col);
        }
        
        for (var last, col, size, i = 0; i < this.$columnWidths.length; i++) {
            size = this.$columnWidths[i];
            if (!this.$columns[i]) {
                this.$getNewContext("column");
                col = apf.insertHtmlNode(this.$getLayoutNode("column"), this.$int, this.$int.lastChild);
                this.$columns.push(col);
        
                col.isColumn = true;
                col.host = this;
            }
            else {
                col = this.$columns[i];
                this.oInt.insertBefore(col, this.oInt.lastChild);
            }
            
            this.$setStyleClass(col, (last = (i == this.$columnWidths.length - 1)) 
                ? "collast" : "", ["collast"]);

            size.match(/(%|px|pt)/);
            var unit = RegExp.$1 || "px";
            col.style.width = (parseInt(size) - (apf.isIE && apf.isIE < 8 && last ? 1 : 0)) + unit;
        }
    }

    /**** Keyboard support ****/

    //Handler for a plane list
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var altKey   = e.altKey;

        if (!this.selected)
            return;

        switch (key) {
            default:
                break;
        }
    }, true);
    //#endif

    /**** Databinding and Caching ****/

    function cacheDocklet(docklet){
        var srcUrl = docklet.$srcUrl;
        if (!srcUrl)
            throw new Error("Something went terribly wrong"); //@todo

        if (docklet.$dockletClass.$unload)
            docklet.$dockletClass.$unload();

        //Cache settings panel
        var amlNodes = [], amlNode, widget = docklet_cache[srcUrl];
        if (docklet.oSettings) {
            var nodes = docklet.oSettings.childNodes;
            while(nodes.length) {
                amlNode = apf.findHost(widget.fragSettings.appendChild(nodes[0]));
                if (amlNode)
                    amlNodes.push(amlNode.removeNode(null, true));
            }
        }
        
        //Cache oInt
        var nodes = docklet.$int.childNodes;
        while(nodes.length) {
            amlNode = apf.findHost(widget.fragInt.appendChild(nodes[0]));
            if (amlNode) 
                amlNodes.push(amlNode.removeNode(null, true));
        }
        var nodes = docklet.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--)
            amlNodes.push(nodes[i].removeNode(null, true));
        
        widget.amlNodes = amlNodes;
        docklet.oSettings = docklet.$int = null;
        docklet.childNodes = [];//@todo hack!! apf3.0 - the childNodes array isnt cleaned correctly. The parsing sees this as that all the children are already rendered
        dockwin_cache.push(docklet);
        
        //Remove from document
        docklet.parentNode = null;
        docklet.$ext.parentNode.removeChild(docklet.$ext);
        
        return srcUrl;
    }

    this.$getCurrentFragment = function(){
        var fr, col, fragment = [];
        for (var i = 0, l = this.$columns.length; i < l; i++) {
            col = this.$columns[i];
            for (var j = col.childNodes.length -1; j >= 0; j--) {
                if (col.childNodes[j].nodeType != 1)
                    continue;
                
                fragment.push(cacheDocklet.call(this, apf.findHost(col.childNodes[j])));
            }
        }

        return fragment;
    };

    this.$setCurrentFragment = function(fragment){
        var dataNode, pHtmlNode, srcUrl, docklet, nodes = this.getTraverseNodes();
        for (var i = 0, l = nodes.length; i < l; i++) {
            dataNode  = nodes[i];
            pHtmlNode = this.$columns[this.$applyBindRule("column", dataNode) || 0];
            srcUrl    = this.$applyBindRule("src", dataNode) || "file:"
                        + this.$applyBindRule("url", dataNode);
            docklet   = getDockwin.call(this, dataNode, pHtmlNode);
            createWidget.call(this, srcUrl, null, docklet, dataNode); //assuming cache
        }
    };

    var oEmpty;
    this.$setClearMessage = function(msg){
         if (!oEmpty) {
            if (!this.$hasLayoutNode("empty"))
                return;
            
            this.$getNewContext("empty");

            var xmlEmpty = this.$getLayoutNode("empty");
            if (!xmlEmpty) return;

            oEmpty = apf.insertHtmlNode(xmlEmpty, this.$int);
        }
        else {
            if(!this.oInt.lastChild)
                this.oInt.appendChild(oEmpty);
            else
                this.oInt.insertBefore(oEmpty, this.oInt.lastChild);
        }
        
        var empty  = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty)
            apf.setNodeValue(empty, msg || "");
        if (oEmpty)
            oEmpty.setAttribute("id", "empty" + this.$uniqueId);
    };

    this.$removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.$uniqueId);
        if (oEmpty)
            oEmpty.parentNode.removeChild(oEmpty);
        //else this.$int.innerHTML = ""; //clear if no empty message is supported
    };

    var docklet_cache = {};
    function createWidget(srcUrl, strXml, docklet, dataNode){
        var widget;
        //Caching
        while(widget = docklet_cache[srcUrl]) {
            if (!widget.fragInt.childNodes.length)
                srcUrl += "_";
            else break;
        }
        
        if (!widget && !strXml) {
            srcUrl = "error";
            widget = docklet_cache["error"];
        }

        docklet.$getLayoutNode("main", "container", docklet.$ext)
            .innerHTML = "";
        docklet.$srcUrl = srcUrl;

        if (widget) {
            var xmlNode = widget.xmlNode;
            
            if (xmlNode.getAttribute("width"))
                docklet.setProperty("width", xmlNode.getAttribute("width"));
            else
                docklet.$ext.style.width = "auto";
            
            docklet.oSettings = docklet.$getLayoutNode("main", "settings_content", docklet.$ext);
            docklet.$int = docklet.$getLayoutNode("main", "container", docklet.$ext);
            
            docklet.$int.appendChild(widget.fragInt);
            if (docklet.oSettings)
                docklet.oSettings.appendChild(widget.fragSettings);
            
            var amlNodes = widget.amlNodes || [];//@todo temp workaround apf3.0
            for (var i = 0, l = amlNodes.length; i < l; i++)
                if (amlNodes[i].hasFeature)
                    docklet.appendChild(amlNodes[i], null, true);
            
            docklet.$dockletClass = widget.dockletClass;
            
            if (widget.dockletClass.load)
                widget.dockletClass.load(dataNode, docklet);
        }
        else {
            var uId = apf.all.length;
            var col = [];
            strXml = strXml.replace(/\b(id|actiontracker|group)="([^"]*)"|\b(id|actiontracker|group)='([^']*)''/g, 
              function(m, n1, id1, n2, id2){
                var id = id1 || id2;
                col.push(id);
                if (id1) return n1 + '="' + id + "_" + uId + '"';
                if (id2) return n2 + "='" + id + "_" + uId + "'";
              });
            //@todo make the id's regexp safe
            if (col.length) {
                strXml = strXml.replace(new RegExp("\\b(" + col.join("|") + ")\\b", "g"), 
                  function(m, id){
                    return id + "_" + uId;
                  });
            }
            
            var dockletWidget = this.ownerDocument.$domParser.parseFromString(strXml, "text/xml", {
                //nodelay  : true,
                docFrag  : docklet,
                doc      : docklet.ownerDocument,
                htmlNode : docklet.$int
            }).firstChild;
            
            var name = dockletWidget.name;
    
            if (dockletWidget.width)
                docklet.setProperty("width", dockletWidget.width);
            else
                docklet.$ext.style.width = "auto";
    
            //Create dockletClass
            if (!self[name])
                throw new Error("could not find docklet class '" + name + "'"); //@todo proper error apf3.0
    
            //instantiate class
            var dockletClass = new self[name]().$init();
            this.docklets.push(dockletClass);
            dockletClass.create(dataNode, docklet, this);
            if (dockletClass.load)
                dockletClass.load(dataNode, docklet);
            
            docklet.$dockletClass = dockletClass;
            
            docklet_cache[srcUrl] = {
                srcUrl       : srcUrl,
                xmlNode      : dockletWidget.$aml,
                fragInt      : document.createDocumentFragment(),
                fragSettings : document.createDocumentFragment(),
                dockletClass : dockletClass
            };
        }

        docklet.$refParent = this.$int;
    }
    
    var dockwin_cache = [];
    function getDockwin(dataNode, pHtmlNode){
        var docklet;
        
        var columns = this.$applyBindRule("columns", this.xmlRoot);
        if (columns != this.columns) {
            this.setProperty("columns", columns);
            pHtmlNode = this.$columns[this.$applyBindRule("column", dataNode) || 0];
        }
        
        if (docklet = dockwin_cache.pop() && (typeof dockwin_cache.pop() == 'function' && dockwin_cache.pop().dataNode == dataNode)) {
            docklet.parentNode = this;
            pHtmlNode.appendChild(docklet.$ext);
            docklet.$pHtmlNode = pHtmlNode;
            //docklet.setProperty("skin", this.$applyBindRule("skin", dataNode) || "docklet"); //@todo (apf3.0) or something like that
            
            var skin = this.$applyBindRule("dockskin", dataNode) || "docklet";
            if (docklet.skin != skin)
                docklet.$forceSkinChange(docklet.skin = skin);
            docklet.show();
        }
        //Creating
        else {
            //, null, true
            docklet = new apf.modalwindow({
                htmlNode  : pHtmlNode,
                skinset   : apf.getInheritedAttribute(this.parentNode, "skinset"),
                skin      : this.$applyBindRule("dockskin", dataNode) || "docklet",
                draggable : true,
                visible   : true
            });
            docklet.implement(apf.modalwindow.widget);
            docklet.parentNode = this;
            
            docklet.$create();
            
            docklet.addEventListener("beforestatechange", function(e){
                if (e.to.maximized)
                    docklet.$ext.parentNode.style.zIndex = 100000;
                
                return this.$dockletClass.dispatchEvent("beforestatechange", e);
            });
            docklet.addEventListener("afterstatechange", function(e){
                if (e.from.maximized)
                    docklet.$ext.parentNode.style.zIndex = 1;
                
                this.$dockletClass.dispatchEvent("afterstatechange", e);

                if (e.to.closed)
                    this.remove(this.dataNode);
            });
        }
        
        docklet.dataNode = dataNode;
        apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(dataNode), dataNode, docklet.$ext, this)
        
        if (this.$hasBindRule("buttons"))
            docklet.setProperty("buttons", this.$applyBindRule("buttons", dataNode) || this.buttons);
        docklet.setProperty("state", this.$applyBindRule("state", dataNode) || "normal");
        docklet.setProperty("title", this.$applyBindRule("caption", dataNode));
        docklet.setProperty("icon", this.$applyBindRule("icon", dataNode));
        
        docklet.show();
        
        return docklet;
    }
    
    //@todo hack to prevent oInt.innerHTML to be cleared
    this.$clear = function(){}

    this.docklets     = [];
    var xml_cache     = {};
    this.$add = function(dataNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build window
        var pHtmlNode = this.$columns[this.$applyBindRule("column", dataNode) || 0];
        var srcUrl = this.$applyBindRule("src", dataNode) || "file:"
            + this.$applyBindRule("url", dataNode);

        //@todo this should be much nicer
        if (!pHtmlNode) {
            var cols = this.$applyBindRule("columns", this.xmlRoot)
            if (cols && cols != this.columns)
                this.setProperty("columns", cols);
            pHtmlNode = this.$columns[this.$applyBindRule("column", dataNode) || 0];
            
            if (!pHtmlNode) //@todo
                throw new Error(apf.formatErrorString(0, this, "Building docklet",
                    "Cannot find column to hook docklet on. Seems like a timing error"));
        }

        var docklet = getDockwin.call(this, dataNode, pHtmlNode);

        if (xml_cache[srcUrl]) {
            var strXml = xml_cache[srcUrl];
            createWidget.call(this, srcUrl, strXml, docklet, dataNode);
        }
        else {
            //@todo add loading to window
            docklet.$getLayoutNode("main", "container", docklet.$ext)
                .innerHTML = "<div class='loading'>Loading...</div>";
            
            //@todo this should be getData (apf3.0)
            var model = new apf.model(), _self = this;
            model.$loadFrom(srcUrl, {callback: function(data, state, extra){
                //if (this.isLoaded)
                    //return true;

                //@todo retry
                if (!data || state != apf.SUCCESS) {
                    createWidget.call(_self, "error", "<a:docklet xmlns:a='" + apf.ns.apf + "' name='dockerror'>\
                        <a:script><![CDATA[\
                            function dockerror(){\
                                this.init = this.load = function(x,d){\
                                    d.setAttribute('buttons', '');\
                                    d.setAttribute('icon', '');\
                                    d.setAttribute('title', 'Error')\
                                }\
                            }\
                        ]]></a:script>\
                        <a:body>\
                            <a:label style='margin:0 auto 0 auto'>Error loading this widget</a:label>\
                        </a:body>\
                    </a:docklet>", docklet, dataNode);
                    
                    return true;
                }

                //hmmm this is not as optimized as I'd like (going through the xml parser twice)
                var strXml = data;//xmlNode.xml || xmlNode.serialize();

                //#ifdef __SUPPORT_SAFARI2
                if (apf.isSafariOld) {
                    strXml = strXml.replace(/name/, "name='"
                        + xmlNode.getAttribute("name") + "'");
                    xml_cache[srcUrl] = strXml;
                }
                else 
                //#endif
                {
                    xml_cache[srcUrl] = strXml;//xmlNode.cloneNode(true);
                }

                createWidget.call(_self, srcUrl, strXml, docklet, dataNode);
                this.isLoaded = true;
            }});
        }
    };

    this.$fill = function(){
        
    };
    
    this.addEventListener("beforeload", function(e){
        if (!this.$columns.length) {
            var cols = this.$applyBindRule("columns", e.xmlNode)
            if (cols && cols != this.columns)
                this.setProperty("columns", cols);
        }
    });
    
    this.addEventListener("xmlupdate", function(e){
        //if (e.action.match(/add|insert|move/))
            //apf.AmlParser.parseLastPass();
        
        var cols = this.$applyBindRule("columns", this.xmlRoot)
        if (cols && cols != this.columns)
            this.setProperty("columns", cols);
    });

    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode), null, null, null, true))
            return true;
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for(var i = 0; i < nodes.length; i++) {
                if (this.$selectDefault(nodes[i]))
                    return true;
            }
        }
    };

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$int = this.$getLayoutNode("main", "container", this.$ext);
    };

    this.$loadAml = function(x){
        if (document.elementFromPointAdd)
            document.elementFromPointAdd(this.$ext);
    };
// #ifdef __WITH_MULTISELECT
}).call(apf.portal.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.portal.prototype = new apf.MultiselectBinding());
   #else
}).call(apf.portal.prototype = new apf.Presentation());
#endif*/

apf.aml.setElement("portal",    apf.portal);
apf.aml.setElement("src",       apf.BindingRule);
apf.aml.setElement("column",    apf.BindingRule);
//apf.aml.setElement("state",     apf.BindingRule);
apf.aml.setElement("draggable", apf.BindingRule);
apf.aml.setElement("dockskin",  apf.BindingRule);
apf.aml.setElement("buttons",   apf.BindingRule);
apf.aml.setElement("caption",   apf.BindingRule);
apf.aml.setElement("traverse",  apf.BindingRule);

/**
 * @constructor
 */
apf.portal.Docklet = function(){}
apf.portal.Docklet.prototype = new apf.Class();
apf.portal.Docklet.prototype.create = function(xmlSettings, oWidget, oPortal){
    this.xmlSettings = xmlSettings
    this.oWidget = oWidget;

    if (this.$create)
        this.$create(xmlSettings, oWidget, oPortal);
};

// #endif
