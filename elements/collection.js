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

// #ifdef __AMLCOLLECTION || __INC_ALL

/**
 * Virtual element acting as a parent for a set of child elements 
 * but only draws it's children. It doesn't have any representation itself.
 *
 * @constructor
 * @allowchild {elements}, {anyaml}
 *
 * @define collection
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.collection = function(struct, tagName){
    this.$init(tagName || "collection", apf.NODE_HIDDEN, struct);
};

apf.docklet = function(struct, tagName){
    this.$init(tagName || "docklet", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$focussable = false;
    
    this.$propHandlers["visible"] = function(value){
        alert(value);
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode && this.parentNode.$int != this.$pHtmlNode)
            this.$pHtmlNode = this.parentNode.$int; //@todo apf3.0 change this in the mutation events

        //this.$ext = this.$pHtmlNode;
        this.$int = this.$pHtmlNode;
        
        this.$originalNodes = this.parentNode.$originalNodes;

        this.skinName = this.parentNode.skinName;
    });
}).call(apf.collection.prototype = new apf.AmlElement());

apf.docklet.prototype = apf.collection.prototype;

apf.aml.setElement("collection", apf.collection);
apf.aml.setElement("docklet", apf.docklet);

// #endif