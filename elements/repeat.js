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
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:repeat
 *
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */

jpf.repeat = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable     = false; // This object can get the focus
    this.canHaveChildren = true;

    this.caching = true;
    
    var nodes   = {};
    this.addItem = function(xmlNode, beforeNode, nr){
        var Lid = jpf.xmldb.nodeConnect(this.documentId, xmlNode, null, this);
        var htmlNode = this.oExt.insertBefore(document.createElement("div"), beforeNode || null);
        var oItem = nodes[Lid] = {
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
    };
    
    this.removeItem = function(Lid){
        var oItem = nodes[Lid];
        var nodes = oItem.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].destroy(true);
        }
        delete nodes[Lid];
    };
    
    this.clear = function(){
        var Lid;
        for (Lid in nodes) {
            this.removeItem(Lid);
        }
    };
    
    this.getCache = function(){
        return false;
    };
    
    /**** Databinding ****/
    
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);
        
        var nodes = XMLRoot.selectNodes(this.traverse);
        for (var i = 0; i < nodes.length; i++) {
            this.addItem(nodes[i], null, i);
        }
        
        jpf.JmlParser.parseLastPass();
    };
    
    this.isTraverseNode = function(xmlNode){
        var nodes = this.xmlRoot.selectNodes(this.traverse);
        for (var i = 0; i < nodes.length; i++)
            if (nodes[i] == xmlNode)
                return true;
        
        return false;
    }
    
    // @todo: check this code... looks disfunctional and/ or out-of-date
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        var Lid = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
        if (!this.isTraverseNode(xmlNode)) 
            return;
        
        var htmlNode = nodes[Lid];
        
        //Check Move -- if value node isn't the node that was moved then only perform a normal update
        if (action == "move" && foundNode == startNode) {
            var isInThis = jpf.xmldb.isChildOf(this.xmlRoot, xmlNode.parentNode, true);
            var wasInThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.pNode, true);
            
            //Move if both previous and current position is within this object
            if (isInThis && wasInThis) {
                //xmlNode, htmlNode
                //Not supported right now
            }
            
            //Add if only current position is within this object
            else if (isInThis) 
                action = "add";
            
            //Remove if only previous position is within this object
            else if (wasInThis) 
                action = "remove";
        }
        else if (action == "move-away") {
            var goesToThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.toPnode, true);
            if (!goesToThis) 
                action = "remove";
        }
        
        if (action == "remove") {
            this.removeItem(Lid);
        }
        else if (action.match(add / insert)) {
            this.addItem(xmlNode, null, 5); //HACK, please determine number by position of xmlnode
            jpf.JmlParser.parseLastPass();
        }
        else if (action == "synchronize") {
        
        }
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        this.oExt = this.pHtmlNode.appendChild(this.oExt 
            || document.createElement("div"));
        this.oInt = this.oExt;
    };
    
    this.$loadJml = function(x){
        this.traverse = x.getAttribute("nodeset") || "node()";
        this.template = x;
    };
    
    this.$destroy = function(){};
}).implement(
    jpf.DataBinding
);

// #endif
