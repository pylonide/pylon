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

__CACHE__ = 1 << 2;

// #ifdef __WITH_CACHE

/**
 * Baseclass adding Caching features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.Cache = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    var cache      = {};
    var subTreeCacheContext;

    this.caching   = true; 
    this.__regbase = this.__regbase|__CACHE__;
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    /**
     * Checks the cache for a cached item by ID. If the ID is found the 
     * representation is loaded from cache and set active.
     *
     * @param  {String}  id  required  String specifying the id of the cache element which is looked up.
     * @return  {Boolean}  true   the cache element is found and set active
     *                   false  otherwise
     * @see    DataBinding#load
     */
    this.getCache = function(id, xmlNode){
        //Checking Current
        if (id == this.cacheID) return false;
        /*
            Let's check if the requested source is actually 
            a sub tree of an already rendered part
        */
        if(xmlNode && this.hasFeature(__MULTISELECT__)){
            var cacheItem = this.getCacheItemByHtmlId(
                xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId);
            if (cacheItem && !cache[id]) {
                /*
                    Ok so it is, let's borrow it for a while
                    We can't clone it, because the updates will
                    get ambiguous, so we have to put it back later
                */
                //Clear
                this.clear(true);
                
                var htmlNode = this.getNodeFromCache(
                    xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId);
                subTreeCacheContext = {
                    htmlNode   : htmlNode,
                    parentNode : htmlNode.parentNode,
                    beforeNode : htmlNode.nextSibling,
                    cacheItem  : cacheItem
                }
                
                this.documentId = jpf.XMLDatabase.getXmlDocId(xmlNode);
                this.cacheID    = id;
                this.XMLRoot    = xmlNode;
                
                //Load html
                if (this.renderRoot)
                    this.oInt.appendChild(htmlNode);
                else {
                    while (htmlNode.childNodes.length)
                        this.oInt.appendChild(htmlNode.childNodes[0]);
                }
                
                return true;
            }
        }

        //Checking Cache...
        if (!cache[id]) return false;

        //Removing previous
        if (this.cacheID)
            this.clear(true);
            
        //Get Fragment and clear Cache Item
        var fragment    = cache[id];
        
        this.documentId = fragment.documentId;
        this.cacheID    = id;
        this.XMLRoot    = fragment.XMLRoot;
        
        this.clearCacheItem(id);

        this.__setCurrentFragment(fragment);

        return true;
    }
    
    /**
     * Sets cache element and it's ID
     *
     * @param  {String}  id            required  String specifying the id of the cache element to be stored.
     * @param  {DocumentFragment}  fragment  required  Object to be stored.
     */
    this.setCache = function(id, fragment){
        if (!this.caching) return;

        cache[id] = fragment;
    }
    
    /**
     * Finds HTML presentation node in cache by ID
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @return  {HTMLNode}  the HTML node found or null when nothing was found
     */
    this.getNodeFromCache = function(id){
        var node = this.__findNode(null, id);
        if (node) return node;
        
        for (prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                var node = this.__findNode(cache[prop], id);
                if (node) return node;
            }
        }
        
        return null;
    }
    
    /**
     * Finds cache element by ID of HTML node in cache
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @return  {DocumentFragement}  the cache element or null when nothing was found
     */
    this.getCacheItemByHtmlId = function(id){
        var node = this.__findNode(null, id);
        if (node) return this.oInt;
        
        for (prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                var node = this.__findNode(cache[prop], id);
                if (node) return cache[prop];
            }
        }
        
        return null;
    }
    
    /**
     * Unloads data from this component and resets state displaying an empty message.
     * Empty message is set on the {@link JmlNode#msg} property.
     *
     * @param  {Boolean}  nomsg  optional  Boolean specifying wether to display the empty message.
     * @param  {Boolean}  do_event  optional  Boolean specifying wether to sent select events.
     * @see DataBinding#load
     */
    this.clear = function(nomsg, do_event){
        if (this.clearSelection)
            this.clearSelection(null, !do_event);

        if (this.caching) {
            /*
                Check if we borrowed an html node
                We should return it where it came from
                
                note: There is a potential that we can't find the exact location
                to put it back. We should then look at it's position in the xml.
                (but since I'm lazy it's not doing this right now)
                There might also be problems when removing the xmlroot 
            */
            if (this.hasFeature(__MULTISELECT__)
                && subTreeCacheContext && subTreeCacheContext.htmlNode) {
                if (this.renderRoot)
                    subTreeCacheContext.parentNode.insertBefore(subTreeCacheContext.htmlNode, subTreeCacheContext.beforeNode);
                else {
                    while (this.oInt.childNodes.length)
                        subTreeCacheContext.htmlNode.appendChild(this.oInt.childNodes[0]);
                }
                
                this.documentId = this.XMLRoot = this.cacheID = subTreeCacheContext = null;
            }
            else{
                /*
                    Or we check to see if there's a fragment to reinstall
                */
            
                var fragment        = this.__getCurrentFragment();
                if (!fragment) return;//this.__setClearMessage(this.msg);

                fragment.documentId = this.documentId;
                fragment.XMLRoot    = this.XMLRoot;
            }
        } else
            this.oInt.innerHTML = "";

        if (!nomsg)
            this.__setClearMessage(this.msg);
        else if(this.__removeClearMessage)
            this.__removeClearMessage();
        
        if (this.caching && (this.cacheID || this.XMLRoot)) 
            this.setCache(this.cacheID || this.XMLRoot.getAttribute(jpf.XMLDatabase.xmlIdTag) || "doc"
                + this.XMLRoot.getAttribute(jpf.XMLDatabase.xmlDocTag), fragment);

        this.documentId = this.XMLRoot = this.cacheID = null;
        this.dataset    = {set: {}, seq: []};
    }
    
    /**
     * @private
     */
    this.clearAllTraverse = function(){
        if (this.clearSelection)
            this.clearSelection(null, true);
            
        this.oInt.innerHTML = "";
        this.__setClearMessage(this.msg);
        this.dataset = {set: {}, seq: []};
    }
    
    /**
     * Removes an item from the cache.
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @param  {Boolean}  remove optional  Boolean specifying wether to destroy the Fragment.
     * @see DataBinding#clear
     */
    this.clearCacheItem = function(id, remove){
        cache[id].documentId = cache[id].cacheID = cache[id].XMLRoot = null;
        
        if (remove)
            jpf.removeNode(cache[id]);
        
        cache[id] = null;
    }

    /**
     * Removes all items from the cache
     *
     * @see DataBinding#clearCacheItem
     */
    this.clearAllCache = function(){
        for (prop in cache) {
            if (cache[prop])
                this.clearCacheItem(prop, true);
        }
    }
    
    /**
     * Gets the cache item by it's id
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @see DataBinding#clearCacheItem
     */
    this.getCacheItem = function(id){
        return cache[id];
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /**
     * @attribute  caching 
     */
    this.__addJmlLoader(function(x){
        this.caching = (x.getAttribute("caching") != "false");
    });
    
    // #ifdef __WITH_MULTISELECT
    if (this.hasFeature(__MULTISELECT__))
        this.inherit(jpf.MultiselectCache); /** @inherits jpf.MultiselectCache */
    // #endif
}

// #ifdef __WITH_MULTISELECT

/**
 * @constructor
 * @private
 */
jpf.MultiselectCache = function(){
    this.__getCurrentFragment = function(){
        var fragment = jpf.hasDocumentFragment
            ? document.createDocumentFragment()
            : new DocumentFragment(); //IE55
        
        while (this.oInt.childNodes.length) {
            fragment.appendChild(this.oInt.childNodes[0]);
        }
        fragment.dataset = this.dataset;

        return fragment;
    }
    
    this.__setCurrentFragment = function(fragment){
        jpf.hasDocumentFragment
            ? this.oInt.appendChild(fragment)
            : fragment.reinsert(this.oInt); //IE55
            
        this.dataset = fragment.dataset;
        
        if (!jpf.window.isFocussed(this))
            this.blur();
    }

    this.__findNode = function(cacheNode, id){
        if (!cacheNode)
            return this.pHtmlDoc.getElementById(id);

        return cacheNode.getElementById(id);
    }
    
    this.__setClearMessage = function(msg){
        var xmlEmpty = this.__getLayoutNode("Empty");
        if (!xmlEmpty) return;
        
        var oEmpty   = jpf.XMLDatabase.htmlImport(xmlEmpty, this.oInt);
        var empty    = this.__getLayoutNode("Empty", "caption", oEmpty);
        
        if (empty)
            jpf.XMLDatabase.setNodeValue(empty, msg || "");
            
        if (oEmpty)
            oEmpty.setAttribute("id", "empty" + this.uniqueId);
    }
    
    this.__removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty)
            oEmpty.parentNode.removeChild(oEmpty);
        //else this.oInt.innerHTML = ""; //clear if no empty message is supported
    }
}
// #endif

// #endif
