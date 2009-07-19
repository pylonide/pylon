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
// #ifdef __JINSERT || __INC_ALL

/**
 * Databound element displaying it's textual content directly in the
 * position it's placed without drawing any containing elements.
 *
 * @constructor
 * @define output, insert
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */

apf.output =
apf.insert = function(pHtmlNode, tagName){
    apf.register(this, tagName || "insert", apf.NODE_VISIBLE);/** @inherits apf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    this.editableParts = {
        "main": [["caption", "text()"]]
    };
    this.implement(apf.DataBinding); /** @inherits apf.DataBinding */
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.getValue = function(){
        return this.value;
    };
    
    this.setValue = function(value){
        this.value = value;
        //pHtmlNode.innerHTML = value;
        this.oTxt.nodeValue = value;
    };
    
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        this.oTxt.nodeValue = value;
    };
    
    /* ***************
     DATABINDING
     ****************/
    this.mainBind = "caption";
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.xmlNode = this.xmlRoot;
        
        //Refresh Properties
        this.setValue(this.applyRuleSetOnNode("caption", this.xmlRoot) || "");
    };
    
    this.$load = function(node){
        /*
         absolutely weird behaviour when bind="" is set.
         This function is loaded twice. First with some xml,
         dunno why it's selected or called
         */
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(node, this);
        
        var value = this.applyRuleSetOnNode("caption", node);
        this.setValue(value || typeof value == "string" ? value : "");
    };
    
    /* *********
     INIT
     **********/
    this.implement(apf.AmlElement); /** @inherits apf.AmlElement */
    this.$draw = function(){
        //Build Main Skin
        this.oInt = this.oExt = pHtmlNode;
        this.oTxt = document.createTextNode("");
        pHtmlNode.appendChild(this.oTxt);
    };
    
    
    this.$loadAml = function(x){
        if (x.firstChild) {
            if (x.childNodes.length > 1 || x.firstChild.nodeType == 1) {
                this.setValue("");
                apf.AmlParser.parseChildren(x, this.oExt, this);
            }
            else 
                this.setValue(x.firstChild.nodeValue);
        }
    };
}

// #endif
