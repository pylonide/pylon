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

__JMLDOM__ = 1 << 14;

// #ifdef __WITH_JMLDOM

/**
 * Baseclass adding the Document Object Model (DOM) API to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.JmlDomAPI = function(){
    this.__regbase  = this.__regbase | __JMLDOM__;
    this.childNodes = [];
    
    /**
     * Adds a component to the end of the list of children of a specified parent component.
     * If the component already exists it is removed from current parent component, then added
     * to new parent component.
     *
     * @param  {JmlNode}  jmlNode  required  the component to insert as child of this component
     * @param  {Boolean}  noAlignUpdate  optional  true  Alignment rules are not updated
     *                                           false  default  Alignment rules are updated
     * @return  {JmlNode}  the appended node
     */
    this.appendChild = function(jmlNode, noAlignUpdate){
        jmlNode.removeNode(true);
        
        // #ifdef __WITH_ALIGNMENT
        if (jmlNode.hasFeature(__ALIGNMENT__)) {
            var isDisabled = jmlNode.disableAlignment();
            if (isDisabled && !noAlignUpdate) 
                jmlNode.purgeAlignment();
        }
        // #endif
        
        // #ifdef __WITH_ANCHORING
        if (jmlNode.hasFeature(__ANCHORING__)) 
            jmlNode.moveAnchoringRules(this.oInt, !noAlignUpdate);
        // #endif
        
        this.childNodes.push(jmlNode);
        jmlNode.parentNode = this;
        
        if (!this.oInt) 
            return; //throw exception??
        this.oInt.appendChild(jmlNode.oExt);
        jmlNode.pHtmlNode = this.oInt;
        
        // #ifdef __WITH_ALIGNMENT
        if (jmlNode.hasFeature(__ALIGNMENT__) && isDisabled) {
            jmlNode.enableAlignment();
            if (!noAlignUpdate) 
                jmlNode.purgeAlignment();
        }
        // #endif
        
        return jmlNode;
    }
    
    /**
     * Inserts a component before another component in a list of children of a specified parent component.
     * If the component already exists it is removed from current parent component, then added
     * to new parent component.
     *
     * @param  {JmlNode}  jmlNode  required  the component to insert as child of this component
     * @param  {JmlNode}  beforeNode  required  the component before which <code>jmlNode</code> is inserted
     * @param  {Boolean}  noAlignUpdate  optional  true  Alignment rules are not updated
     *                                           false  default  Alignment rules are updated
     * @return  {JmlNode}  the appended node
     */
    this.insertBefore = function(jmlNode, beforeNode, noAlignUpdate){
        jmlNode.removeNode(true);
        
        // #ifdef __WITH_ALIGNMENT
        if (jmlNode.hasFeature(__ALIGNMENT__)) {
            var isDisabled = jmlNode.disableAlignment();
            if (isDisabled && !noAlignUpdate) 
                jmlNode.purgeAlignment();
        }
        // #endif
        
        var index = this.childNodes.indexOf(beforeNode);
        if (index < 0) 
            throw new Error(jpf.formatErrorString(1072, this, "Insert before DOM operation", "could not insert jmlNode, beforeNode could not be found"));
        
        // #ifdef __WITH_ANCHORING
        if (jmlNode.hasFeature(__ANCHORING__)) 
            this.moveAnchoringRules(this.oInt, !noAlignUpdate);
        // #endif
        
        this.childNodes    = this.childNodes.slice(0, index).concat(jmlNode,
            this.childNodes.slice(index));
        jmlNode.parentNode = this;
        
        if (!this.oInt) 
            return;
        this.oInt.insertBefore(jmlNode.oExt, beforeNode.oExt);
        jmlNode.pHtmlNode = this.oInt;
        
        // #ifdef __WITH_ALIGNMENT
        if (jmlNode.hasFeature(__ALIGNMENT__) && isDisabled) {
            jmlNode.enableAlignment();
            if (!noAlignUpdate) 
                jmlNode.purgeAlignment();
        }
        // #endif
    }
    
    /**
     * Removes this component from the document hierarchy.
     *
     */
    this.removeNode = function(isAdmin){
        if (!this.parentNode) 
            return;
        
        this.parentNode.childNodes.remove(this);
        this.oExt.parentNode.removeChild(this.oExt);
        
        if (isAdmin) 
            return;
        
        this.destroy();
        
        // #ifdef __WITH_ANCHORING
        if (this.hasFeature(__ANCHORING__)) 
            this.disableAnchoring(this.oInt);
        // #endif
    }
    
    /**
     * Returns a list of elements with the given tag name.
     * The subtree underneath the specified element is searched, excluding the element itself.
     *
     * @param  {String}  tagName  required  the tag name to look for. The special string "*" represents all elements.
     * @return  {Array}  containing any node matching the search string
     */
    this.getElementsByTagName = function(tagName, norecur){
        tagName = tagName.toLowerCase();
        for (var result = [], i = 0; i < this.childNodes.length; i++) {
            if (this.childNodes[i].tagName == tagName) 
                result.push(this.childNodes[i]);
            if (!norecur) 
                result = result.concat(this.childNodes[i].getElementsByTagName(tagName));
        }
        return result;
    }
    
    //properties
    this.attributes = {
        length: function(){},
        item  : function(){}
    }
    //this.nodeType = 1;
    this.nodeValue    = "";
    this.firstChild   = this.lastChild = this.nextSibling = this.previousSibling = null;
    this.namespaceURI = jpf.ns.jpf;
    
    //Clone itself same skin, data, bindings connections etc
    /**
     * @notimplemented
     */
    this.cloneNode = function(deep){};
    this.serialize = function(){};
    
    /**
     * @notimplemented
     */
    this.setAttribute = function(attrName, attrValue){};
    
    /**
     * @notimplemented
     */
    this.getAttribute = function(attrName){
        return this.jml.getAttribute(attrName);
    };
    
    if (this.parentNode && this.parentNode.hasFeature
      && this.parentNode.hasFeature(__JMLNODE__)) {
        this.parentNode.childNodes.push(this);
    };
}
// #endif
