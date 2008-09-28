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
// #ifdef __JREPEAT || __INC_ALL
// #define __WITH_DATABINDING 1

/*
 <j:Repeat traverse="version">
 <j:Label id="lblV1" model="#lstProducts:select:version[1]" skin="default:LabelVersion" dragEnabled="true" dragMoveEnabled="true" bind-attach="root">
 <j:bind select="."><![CDATA[<b>&#8364; {@price}</b>{@title}]]></j:bind>
 </j:Label>
 <j:Button width="100" cssclass="orderButton" onclick="addOrder(1);return false;">Add to order &gt;</j:Button>
 </j:Repeat>
 */
/**
 * Component allowing for a set of JML tags to be repeated based
 * on bound data.
 *
 * @classDescription		This class creates a new repeat construct
 * @return {Repeat} Returns a new repeat construct
 * @type {Repeat}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:repeat
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.repeat = function(pHtmlNode){
    jpf.register(this, "repeat", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    this.$focussable     = false; // This object can get the focus
    this.canHaveChildren = true;

    /* ***********************
     DATABINDING
     ************************/
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    this.caching = true;
    this.nodes   = {};
    
    this.addItem = function(xmlNode, beforeNode, nr){
        var Lid = jpf.xmldb.nodeConnect(this.documentId, xmlNode, null, this);
        var htmlNode = this.oExt.insertBefore(document.createElement("div"), beforeNode || null);
        var oItem = this.nodes[Lid] = {
            childNodes: [],
            hasFeature: function(){
                return 0
            },
            oExt: htmlNode
        };
        
        //Create JML Nodes
        var jmlNode = this.template.cloneNode(true);
        jmlNode.setAttribute("model", "#" + this.name + ":select:(" + this.traverseRule + ")[" + (nr + 1) + "]");
        jpf.JmlParser.parseChildren(jmlNode, htmlNode, oItem);
    }
    
    this.removeItem = function(Lid){
        var oItem = this.nodes[Lid];
        var nodes = oItem.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].destroySelf();
        }
        jpf.removeNode(oItem.oExt);
        delete this.nodes[Lid];
    }
    
    this.clear = function(){
        var Lid;
        for (Lid in this.nodes) {
            this.removeItem(Lid);
        }
    }
    
    this.getCache = function(){
        return false;
    }
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);
        
        var nodes = this.getTraverseNodes();
        for (var i = 0; i < nodes.length; i++) {
            this.addItem(nodes[i], null, i);
        }
        
        jpf.JmlParser.parseLastPass();
    }
    
    /* ******** __XMLUPDATE ***********
     Set properties of control
     INTERFACE:
     this.$xmlUpdate(action, xmlNode [, listenNode [, UndoObj]] );
     ****************************/
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        var Lid = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
        if (!this.isTraverseNode(xmlNode)) 
            return;
        
        var htmlNode = this.nodes[Lid];
        
        //Check Move -- if value node isn't the node that was moved then only perform a normal update
        if (action == "move" && foundNode == startNode) {
            var isInThis = jpf.xmldb.isChildOf(this.XmlRoot, xmlNode.parentNode, true);
            var wasInThis = jpf.xmldb.isChildOf(this.XmlRoot, UndoObj.pNode, true);
            
            //Move if both previous and current position is within this object
            if (isInThis && wasInThis) {
                //xmlNode, htmlNode
                //Not supported right now
            }
            
            //Add if only current position is within this object
            else 
                if (isInThis) 
                    action = "add";
                
                //Remove if only previous position is within this object
                else 
                    if (wasInThis) 
                        action = "remove";
        }
        else 
            if (action == "move-away") {
                var goesToThis = jpf.xmldb.isChildOf(this.XmlRoot, UndoObj.toPnode, true);
                if (!goesToThis) 
                    action = "remove";
            }
        
        if (action == "remove") {
            this.removeItem(Lid);
        }
        else 
            if (action.match(add / insert)) {
                this.addItem(xmlNode, null, 5); //HACK, please determine number by position of xmlnode
                jpf.JmlParser.parseLastPass();
            }
            else 
                if (action == "synchronize") {
                
                }
    }
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
   
    this.draw = function(){
        //Build Main Skin
        this.oExt = pHtmlNode.appendChild(document.createElement("div"));
        this.oInt = this.oExt;
    }
    
    this.$loadJml = function(x){
        this.traverseRule = x.getAttribute("nodeset") || "node()";
        var sNode = new jpf.SmartBinding(null, jpf.getXmlDom("<smartbindings xmlns='" + jpf.ns.jpf + "'><bindings><traverse select='" + this.traverseRule.replace(/'/g, "\\'") + "' /></bindings></smartbindings>").documentElement);
        jpf.JmlParser.addToSbStack(this.uniqueId, sNode);
        
        this.template = x;
    }
    
    this.$destroy = function(){};
}

// #endif
