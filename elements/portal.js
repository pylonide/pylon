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
 * content described in jml. Each of these so-called 'docklets'
 * can have specific data loaded from a datasource and can
 * be instantiated more than once.
 * Example:
 * <code>
 *  <j:portal columns="60%,40%">
 *      <j:bindings>
 *          <j:src select="@src" />
 *          <j:collapsed select="@collapsed" default="0" />
 *          <j:icon value="icoDocklet.png" />
 *          <j:column select="@column" />
 *          <j:caption select="@name" />
 *          <j:traverse select="docklet" />
 *      </j:bindings>
 *      <j:model>
 *          <docklets>
 *              <docklet name="Current Usage"   src="url:usage.xml"    column="0" />
 *              <docklet name="Billing History" src="url:history.xml"  column="0" />
 *              <docklet name="Orders"          src="url:orders.xml"   column="1" />
 *              <docklet name="Features"        src="url:features.xml" column="1" />
 *          </docklets>
 *      </j:model>
 *  </j:portal>
 * </code>
 * Remarks:
 * A docklet xml is a piece of jml that should be in the following form:
 * <code>
 *  <j:docklet xmlns:j="http://www.javeline.com/2005/jml" caption="Billing History" icon="icoBilling.gif" name="BillHistory">
 *      <j:script><![CDATA[
 *          function BillHistory(){
 *              //Create a Javeline class
 *              jpf.makeClass(this);
 *
 *              //Inherit from the portal.docklet baseclass
 *              this.inherit(jpf.portal.docklet);
 *
 *              this.$init = function(xmlSettings, oDocklet){
 *                  //Process xml settings
 *              }
 *          }
 *      ]]></j:script>
 *
 *      <!-- the edit panel of the window -->
 *      <j:config>
 *          ...
 *      </j:config>
 *
 *      <!-- the body of the window -->
 *      <j:body>
 *          ...
 *      </j:body>
 *  </j:docklet>
 * </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:portal
 *
 * @inherits jpf.Presentation
 * @inherits jpf.MultiSelect
 * @inherits jpf.DataBinding
 * @inherits jpf.JmlElement
 * @inherits jpf.Cache
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding src       Determines the data instruction that loads the docklet from it's datasource.
 * @binding collapsed Determines wether the docklet is collapsed after init.
 * @binding icon      Determines the icon of the docklet.
 * @binding column    Determines the column in which the docklet is created.
 * @binding caption   Determines the caption of the docklet.
 */
jpf.portal = jpf.component(jpf.NODE_VISIBLE, function(){
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
        while (this.columns[0].childNodes.length) {
            fragment.appendChild(this.columns[0].childNodes[0]);
        }

        return fragment;
    };

    this.$setCurrentFragment = function(fragment){
        this.oInt.appendChild(fragment);

        if (!jpf.window.hasFocus(this))
            this.blur();
    };

    this.$findNode = function(cacheNode, id){
        if (!cacheNode)
            return this.pHtmlDoc.getElementById(id);
        return cacheNode.getElementById(id);
    };

    this.$setClearMessage = function(msg){
        var oEmpty = jpf.xmldb.htmlImport(this.$getLayoutNode("empty"), this.oInt);
        var empty  = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty)
            jpf.xmldb.setNodeValue(empty, msg || "");
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
    function createDocklet(xmlNode, docklet, dataNode){
        /* Model replacement - needs to be build
         var models = xmlNode.selectNodes("//model/@id");
         for (var i = 0; i < models.lenth; i++) {
             xmlNode.selectNodes("//node()[@model='" + models[i]
         }
         */
        //also replace docklet id's
        var name = xmlNode.getAttribute("name");

        //Load docklet
        docklet.$jml      = xmlNode;
        docklet.$loadSkin("default:docklet");
        docklet.btnedit  = true;
        docklet.btnmin   = true;
        docklet.btnclose = true;

        docklet.$draw();//name
        docklet.$loadJml(xmlNode, name);
        docklet.setCaption(portalNode.applyRuleSetOnNode("caption", dataNode));
        docklet.setIcon(portalNode.applyRuleSetOnNode("icon", dataNode));

        if (xmlNode.getAttribute("width"))
            docklet.setWidth(xmlNode.getAttribute("width"));
        else
            docklet.oExt.style.width = "auto";
        //if(xmlNode.getAttribute("height")) docklet.setHeight(xmlNode.getAttribute("height"));
        //else docklet.oExt.style.height = "auto";

        docklet.display(0, 0);

        //Create dockletClass
        if (!self[name]) {
            alert("could not find class '" + name + "'");
        }

        //instantiate class
        var dockletClass = new self[name]();
        portalNode.docklets.push(dockletClass);
        dockletClass.init(dataNode, docklet);
    }

    this.docklets     = [];
    var docklet_cache = {}
    this.$add = function(dataNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build window
        var pHtmlNode = this.columns[this.applyRuleSetOnNode("column", dataNode) || 0];
        var docklet   = new jpf.modalwindow(pHtmlNode);
        docklet.inherit(jpf.modalwindow.widget);

        docklet.parentNode = this;
        docklet.inherit(jpf.JmlDom);
        //this.applyRuleSetOnNode("border", xmlNode);

        var srcUrl = this.applyRuleSetOnNode("src", dataNode) || "file:"
            + this.applyRuleSetOnNode("url", dataNode);

        if (docklet_cache[srcUrl]) {
            var xmlNode = docklet_cache[srcUrl];
            if (jpf.isSafariOld)
                xmlNode = jpf.getJmlDocFromString(xmlNode).documentElement;
            createDocklet(xmlNode, docklet, dataNode);
        }
        else {
            jpf.setModel(srcUrl, {
                load: function(xmlNode){
                    if (!xmlNode || this.isLoaded)
                        return;

                    //hmmm this is not as optimized as I'd like (going throught the xml parser twice)
                    var strXml = xmlNode.xml || xmlNode.serialize();

                    if (jpf.isSafariOld) {
                        strXml = strXml.replace(/name/, "name='"
                            + xmlNode.getAttribute("name") + "'");
                        docklet_cache[srcUrl] = strXml;
                    }
                    else {
                        xmlNode = jpf.getJmlDocFromString(strXml).documentElement;
                        docklet_cache[srcUrl] = xmlNode.cloneNode(true);
                    }

                    createDocklet(xmlNode, docklet, dataNode);
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
            jpf.JmlParser.parseLastPass();
        }
    });

    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode)))
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
    this.columns   = [];
    this.addColumn = function(size){
        this.$getNewContext("column");
        var col = jpf.xmldb.htmlImport(this.$getLayoutNode("column"), this.oInt);
        var id = this.columns.push(col) - 1;

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

        /**
         * @attribute {String} columns a comma seperated list of column sizes.
         * A column size can be specified in a number (size in pixels) or using
         * a number and a % sign to indicate a percentage.
         * Defaults to "33%, 33%, 33%".
         * Example:
         * <code>
         *  <j:portal columns="25%, 50%, 25%">
         *      ...
         *  </j:portal>
         * </code>
         */
        var cols = (this.$jml.getAttribute("columns") || "33.33%,33.33%,33.33%").split(",");
        for (var i = 0; i < cols.length; i++) {
            this.addColumn(cols[i]);
        }

        //if(this.$jml.childNodes.length) this.$loadInlineData(this.$jml);
        jpf.JmlParser.parseChildren(this.$jml, null, this);

        if (document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);
    };

    this.$loadJml = function(x){

    };
}).implement(
    jpf.Cache,
    jpf.Presentation,
    jpf.MultiSelect,
    jpf.DataBinding
);

/**
 * @constructor
 */
jpf.portal.docklet = function(){
    this.init = function(xmlSettings, oWidget){
        this.xmlSettings = xmlSettings
        this.oWidget = oWidget;

        if (this.$init)
            this.$init(xmlSettings, oWidget);
    };
};

// #endif
