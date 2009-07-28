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
// #ifdef __JPORTAL || __INC_ALL
// #define __JMODALWINDOW 1

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
 *          <a:src select="@src" />
 *          <a:collapsed select="@collapsed" default="0" />
 *          <a:icon value="icoDocklet.png" />
 *          <a:column select="@column" />
 *          <a:caption select="@name" />
 *          <a:traverse select="docklet" />
 *      </a:bindings>
 *      <a:model>
 *          <docklets>
 *              <docklet name="Usage"    src="url:usage.xml"    column="0" />
 *              <docklet name="Billing"  src="url:history.xml"  column="0" />
 *              <docklet name="Orders"   src="url:orders.xml"   column="1" />
 *              <docklet name="Features" src="url:features.xml" column="1" />
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
 *              //Create a Ajax.org Class
 *              apf.makeClass(this);
 *
 *              //Implement the portal.docklet baseclass
 *              this.implement(apf.portal.docklet);
 *
 *              this.$init = function(xmlSettings, oDocklet){
 *                  //Process xml settings
 *              }
 *          }
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
 * @inherits apf.Presentation
 * @inherits apf.MultiSelect
 * @inherits apf.DataBinding
 * @inherits apf.AmlElement
 * @inherits apf.Cache
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding src       Determines the data instruction that loads the docklet from it's datasource.
 * @binding collapsed Determines whether the docklet is collapsed after init.
 * @binding icon      Determines the icon of the docklet.
 * @binding column    Determines the column in which the docklet is created.
 * @binding caption   Determines the caption of the docklet.
 */
apf.portal = apf.component(apf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;

    this.$deInitNode = function(xmlNode, htmlNode){
        if (!htmlNode)
            return;

        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    };

    this.$updateNode = function(xmlNode, htmlNode){
        this.applyRuleSetOnNode("icon", xmlNode);
    };

    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode)
            return;
    };
    this.select = function(){}
    
    this.columns = "33.33%,33.33%,33.33%";
    var columns  = this.columns.splitSafe(",");
    var _self    = this;
    
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
        columns = value.splitSafe(",");
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

    this.$getCurrentFragment = function(){
        //if(!this.value) return false;

        var fragment = document.createDocumentFragment();
        while (this.$columns[0].childNodes.length) {
            fragment.appendChild(this.$columns[0].childNodes[0]);
        }

        return fragment;
    };

    this.$setCurrentFragment = function(fragment){
        this.oInt.appendChild(fragment);

        if (!apf.window.hasFocus(this))
            this.blur();
    };

    this.$findNode = function(cacheNode, id){
        if (!cacheNode)
            return this.pHtmlDoc.getElementById(id);
        return cacheNode.getElementById(id);
    };

    this.$setClearMessage = function(msg){
        var oEmpty = apf.xmldb.htmlImport(this.$getLayoutNode("empty"), this.oInt);
        var empty  = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty)
            apf.setNodeValue(empty, msg || "");
        if (oEmpty)
            oEmpty.setAttribute("id", "empty" + this.uniqueId);
    };

    this.$removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty)
            oEmpty.parentNode.removeChild(oEmpty);
        //else this.oInt.innerHTML = ""; //clear if no empty message is supported
    };

    var portalNode = this;
    function createDocklet(strXml, docklet, dataNode){
        var uId = apf.all.length;
        var col = [];
        strXml = strXml.replace(/\bid="([^"]*)"|id='([^']*)'/g, 
          function(m, id1, id2){
            var id = id1 || id2;
            col.push(id);
            if (id1) return 'id="' + id + "_" + uId + '"';
            if (id2) return "id='" + id + "_" + uId + "'";
          });
        //@todo make the id's regexp safe
        if (col.length) {
            strXml = strXml.replace(new RegExp("\\b(" + col.join("|") + ")\\b", "g"), 
              function(m, id){
                return id + "_" + uId;
              });
        }
        
        var xmlNode = apf.getAmlDocFromString(strXml).documentElement;
        
        /* Model replacement - needs to be build
         var models = xmlNode.selectNodes("//model/@id");
         for (var i = 0; i < models.lenth; i++) {
             xmlNode.selectNodes("//node()[@model='" + models[i]
         }
         */
        //also replace docklet id's
        var name = xmlNode.getAttribute("name");

        //Load docklet
        docklet.$aml      = xmlNode;
        docklet.skinset   = apf.getInheritedAttribute(_self.$aml.parentNode, "skinset"); //@todo use skinset here. Has to be set in presentation
        xmlNode.setAttribute("skinset", docklet.skinset);
        docklet.skin      = "docklet";
        docklet.skinName  = null;
        docklet.$loadSkin();
        docklet.draggable = false;

        docklet.$draw();//name
        
        //docklet.setProperty("buttons", "edit|min|close");
        docklet.setProperty("buttons", portalNode.applyRuleSetOnNode("buttons", dataNode) || "edit|min|close");
        docklet.setProperty("title", portalNode.applyRuleSetOnNode("caption", dataNode));
        docklet.setProperty("icon", portalNode.applyRuleSetOnNode("icon", dataNode));
        
        docklet.$loadAml(xmlNode, name);
        apf.AmlParser.parseLastPass();

        if (xmlNode.getAttribute("width"))
            docklet.setProperty("width", xmlNode.getAttribute("width"));
        else
            docklet.oExt.style.width = "auto";
        //if(xmlNode.getAttribute("height")) docklet.setHeight(xmlNode.getAttribute("height"));
        //else docklet.oExt.style.height = "auto";

        docklet.show();

        //Create dockletClass
        if (!self[name]) {
            alert("could not find class '" + name + "'");
        }

        //instantiate class
        var dockletClass = new self[name]();
        portalNode.docklets.push(dockletClass);
        dockletClass.init(dataNode, docklet);
        
        docklet.addEventListener("beforestatechange", function(e){
            if (e.to.maximized)
                docklet.oExt.parentNode.style.zIndex = 100000;
            
            return dockletClass.dispatchEvent("beforestatechange", e);
        });
        docklet.addEventListener("afterstatechange", function(e){
            if (e.from.maximized)
                docklet.oExt.parentNode.style.zIndex = 1;
            
            return dockletClass.dispatchEvent("afterstatechange", e);
        });
        
        docklet.$refParent = _self.oInt;
    }

    this.docklets     = [];
    var docklet_cache = {}
    this.$add = function(dataNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build window
        var pHtmlNode = this.$columns[this.applyRuleSetOnNode("column", dataNode) || 0];
        var docklet   = new apf.modalwindow(pHtmlNode, "window");
        docklet.implement(apf.modalwindow.widget);

        docklet.parentNode = this;
        docklet.implement(apf.AmlDom);
        //this.applyRuleSetOnNode("border", xmlNode);

        var srcUrl = this.applyRuleSetOnNode("src", dataNode) || "file:"
            + this.applyRuleSetOnNode("url", dataNode);

        if (docklet_cache[srcUrl]) {
            var strXml = docklet_cache[srcUrl];
            //if (apf.isSafariOld)
                //xmlNode = apf.getAmlDocFromString(xmlNode).documentElement;
            createDocklet(strXml, docklet, dataNode);
        }
        else {
            apf.setModel(srcUrl, {
                load: function(xmlNode){
                    if (!xmlNode || this.isLoaded)
                        return;

                    //hmmm this is not as optimized as I'd like (going throught the xml parser twice)
                    var strXml = xmlNode.xml || xmlNode.serialize();

                    //#ifdef __SUPPORT_SAFARI2
                    if (apf.isSafariOld) {
                        strXml = strXml.replace(/name/, "name='"
                            + xmlNode.getAttribute("name") + "'");
                        docklet_cache[srcUrl] = strXml;
                    }
                    else 
                    //#endif
                    {
                        docklet_cache[srcUrl] = strXml;//xmlNode.cloneNode(true);
                    }

                    createDocklet(strXml, docklet, dataNode);
                    this.isLoaded = true;
                },

                setModel: function(model, xpath){
                    model.register(this, xpath);
                }
            });
        }
    };

    this.$fill = function(){
        
    };

    this.addEventListener("xmlupdate", function(e){
        if (e.action.match(/add|insert|move/)) {
            apf.AmlParser.parseLastPass();
        }
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

    var totalWidth = 0;
    this.$columns   = [];
    this.addColumn = function(size){
        this.$getNewContext("column");
        var col = apf.xmldb.htmlImport(this.$getLayoutNode("column"), this.oInt);
        var id = this.$columns.push(col) - 1;

        //col.style.left = totalWidth + (size.match(/%/) ? "%" : "px");
        totalWidth += parseFloat(size);

        col.style.width = size + (size.match(/%|px|pt/) ? "" : "px");//"33.33%";
        col.isColumn = true;
        col.host = this;
    };

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
    };

    this.$loadAml = function(x){
        for (var i = 0; i < columns.length; i++) {
            this.addColumn(columns[i]);
        }

        //if(this.$aml.childNodes.length) this.$loadInlineData(this.$aml);
        apf.AmlParser.parseChildren(x, null, this);

        if (document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);
    };
}).implement(
    apf.Cache,
    apf.Presentation,
    apf.MultiSelect,
    apf.DataBinding
);

/**
 * @constructor
 */
apf.portal.docklet = function(){
    this.init = function(xmlSettings, oWidget){
        this.xmlSettings = xmlSettings
        this.oWidget = oWidget;

        if (this.$init)
            this.$init(xmlSettings, oWidget);
    };
};

// #endif
