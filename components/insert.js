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
 * Databound component displaying it's textual content directly in the
 * position it's placed without drawing any containing elements.
 *
 * @classDescription		This class creates a new insert
 * @return {Insert} Returns a new insert
 * @type {Insert}
 * @constructor
 * @alias jpf.output
 * @addnode components:output
 * @addnode components:insert
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */

jpf.output =
jpf.insert = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "insert", jpf.NODE_VISIBLE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    this.editableParts = {
        "main": [["caption", "text()"]]
    };
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
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
            UndoObj.xmlNode = this.XmlRoot;
        
        //Refresh Properties
        this.setValue(this.applyRuleSetOnNode("caption", this.XmlRoot) || "");
    };
    
    this.$load = function(node){
        /*
         absolutely weird behaviour when bind="" is set.
         This function is loaded twice. First with some xml,
         dunno why it's selected or called
         */
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(node, this);
        
        var value = this.applyRuleSetOnNode("caption", node);
        this.setValue(value || typeof value == "string" ? value : "");
    };
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.$draw = function(){
        //Build Main Skin
        this.oInt = this.oExt = pHtmlNode;
        this.oTxt = document.createTextNode("");
        pHtmlNode.appendChild(this.oTxt);
    };
    
    
    this.$loadJml = function(x){
        if (x.firstChild) {
            if (x.childNodes.length > 1 || x.firstChild.nodeType == 1) {
                this.setValue("");
                jpf.JmlParser.parseChildren(x, this.oExt, this);
            }
            else 
                this.setValue(x.firstChild.nodeValue);
        }
        
        //this.$makeEditable("main", this.oExt, this.jml);
    };
}

// #endif
