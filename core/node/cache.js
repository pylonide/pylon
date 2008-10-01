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
    var cache     = {};
    var subTreeCacheContext;

    this.caching  = true; 
    this.$regbase = this.$regbase | __CACHE__;
    
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
        if (xmlNode && this.hasFeature(__MULTISELECT__)) {
            var cacheItem = this.getCacheItemByHtmlId(
                xmlNode.getAttribute(jpf.xmldb.xmlIdTag) + "|" + this.uniqueId);
            if (cacheItem && !cache[id]) {
                /*
                    Ok so it is, let's borrow it for a while
                    We can't clone it, because the updates will
                    get ambiguous, so we have to put it back later
                */
                //Clear
                this.clear(true);
                
                var htmlNode = this.getNodeFromCache(
                    xmlNode.getAttribute(jpf.xmldb.xmlIdTag) + "|" + this.uniqueId);
                subTreeCacheContext = {
                    htmlNode   : htmlNode,
                    parentNode : htmlNode.parentNode,
                    beforeNode : htmlNode.nextSibling,
                    cacheItem  : cacheItem
                };
                
                this.documentId = jpf.xmldb.getXmlDocId(xmlNode);
                this.cacheID    = id;
                this.XmlRoot    = xmlNode;
                
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
        this.XmlRoot    = fragment.XmlRoot;
        
        this.clearCacheItem(id);

        this.$setCurrentFragment(fragment);

        return true;
    };
    
    /**
     * Sets cache element and it's ID
     *
     * @param  {String}  id            required  String specifying the id of the cache element to be stored.
     * @param  {DocumentFragment}  fragment  required  Object to be stored.
     */
    this.setCache = function(id, fragment){
        if (!this.caching) return;

        cache[id] = fragment;
    };
    
    /**
     * Finds HTML presentation node in cache by ID
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @return  {HTMLNode}  the HTML node found or null when nothing was found
     */
    this.getNodeFromCache = function(id){
        var node = this.$findNode(null, id);
        if (node) return node;
        
        for (prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                var node = this.$findNode(cache[prop], id);
                if (node) return node;
            }
        }
        
        return null;
    };
    
    /**
     * Finds HTML presentation node in cache by xmlNode or xml id
     *
     * @param  {mixed}  id  required  Specifying the xmlNode or id of the xmlNode that 
     *                                is represented by the HTML node which is looked up.
     * @return  {HTMLNode}  the HTML node found or null when nothing was found
     */
    this.getNodeByXml = function(xmlNode){
        return xmlNode 
            ? this.getNodeFromCache((typeof xmlNode == "object"
                ? xmlNode.getAttribute(jpf.xmldb.xmlIdTag)
                : xmlNode) + "|" + this.uniqueId)
            : null;
    };
    
    /**
     * Finds cache element by ID of HTML node in cache
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @return  {DocumentFragement}  the cache element or null when nothing was found
     */
    this.getCacheItemByHtmlId = function(id){
        var node = this.$findNode(null, id);
        if (node) return this.oInt;
        
        for (var prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                var node = this.$findNode(cache[prop], id);
                if (node) return cache[prop];
            }
        }
        
        return null;
    };
    
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
                
                this.documentId = this.XmlRoot = this.cacheID = subTreeCacheContext = null;
            }
            else{
                /* If the current item was loaded whilst offline, we won't cache
                 * anything
                 */
                if (this.loadedWhenOffline) {
                    this.loadedWhenOffline = false;
                }
                else {
                    // Here we cache the current part
                    var fragment = this.$getCurrentFragment();
                    if (!fragment) return;//this.$setClearMessage(this.emptyMsg);
    
                    fragment.documentId = this.documentId;
                    fragment.XmlRoot    = this.XmlRoot;
                }
            }
        }
        else
            this.oInt.innerHTML = "";

        if (!nomsg)
            this.$setClearMessage(this.emptyMsg, "empty");
        else if(this.$removeClearMessage)
            this.$removeClearMessage();
        
        if (this.caching && (this.cacheID || this.XmlRoot)) 
            this.setCache(this.cacheID || this.XmlRoot.getAttribute(jpf.xmldb.xmlIdTag) || "doc"
                + this.XmlRoot.getAttribute(jpf.xmldb.xmlDocTag), fragment);

        this.documentId = this.XmlRoot = this.cacheID = null;
        this.dataset    = {set: {}, seq: []};
    };
    
    /**
     * @private
     */
    this.clearAllTraverse = function(msg, className){
        if (this.clearSelection)
            this.clearSelection(null, true);
            
        this.oInt.innerHTML = "";
        this.$setClearMessage(msg || this.emptyMsg, className || "empty");
        this.dataset = {set: {}, seq: []};
    };
    
    /**
     * Removes an item from the cache.
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @param  {Boolean}  remove optional  Boolean specifying wether to destroy the Fragment.
     * @see DataBinding#clear
     */
    this.clearCacheItem = function(id, remove){
        cache[id].documentId = cache[id].cacheID = cache[id].XmlRoot = null;
        
        if (remove)
            jpf.removeNode(cache[id]);
        
        cache[id] = null;
    };

    /**
     * Removes all items from the cache
     *
     * @see DataBinding#clearCacheItem
     */
    this.clearAllCache = function(){
        for (var prop in cache) {
            if (cache[prop])
                this.clearCacheItem(prop, true);
        }
    };
    
    /**
     * Gets the cache item by it's id
     *
     * @param  {String}  id  required  String specifying the id of the HTML node which is looked up.
     * @see DataBinding#clearCacheItem
     */
    this.getCacheItem = function(id){
        return cache[id];
    };
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /**
     * @attribute  caching 
     */
    this.$supportedProperties.push("caching");
    
    // #ifdef __WITH_MULTISELECT
    if (this.hasFeature(__MULTISELECT__))
        this.inherit(jpf.MultiselectCache); /** @inherits jpf.MultiselectCache */
    // #endif
    
    this.$jmlDestroyers.push(function(){
        //Remove all cached Items
        this.clearAllCache();
    });
};

// #ifdef __WITH_MULTISELECT

/**
 * @constructor
 * @private
 */
jpf.MultiselectCache = function(){
    this.$getCurrentFragment = function(){
        var fragment = document.createDocumentFragment();
        
        while (this.oInt.childNodes.length) {
            fragment.appendChild(this.oInt.childNodes[0]);
        }
        fragment.dataset = this.dataset;

        return fragment;
    };
    
    this.$setCurrentFragment = function(fragment){
        this.oInt.appendChild(fragment);
            
        this.dataset = fragment.dataset;
        
        if (!jpf.window.hasFocus(this))
            this.blur();
    };

    this.$findNode = function(cacheNode, id){
        if (!cacheNode)
            return this.pHtmlDoc.getElementById(id);

        return cacheNode.getElementById(id);
    };
    
    var oEmpty;
    this.$setClearMessage = function(msg, className){
        if (!oEmpty) {
            this.$getNewContext("empty");
            
            var xmlEmpty = this.$getLayoutNode("empty");
            if (!xmlEmpty) return;
            
            oEmpty = jpf.xmldb.htmlImport(xmlEmpty, this.oInt);
        }
        else {
            this.oInt.appendChild(oEmpty);
        }
        
        var empty = this.$getLayoutNode("empty", "caption", oEmpty);
        
        if (empty)
            jpf.xmldb.setNodeValue(empty, msg || "");
            
        oEmpty.setAttribute("id", "empty" + this.uniqueId);
        jpf.setStyleClass(oEmpty, className, ["loading", "empty", "offline"]);
    };
    
    this.$removeClearMessage = function(){
        if (!oEmpty)
            oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty && oEmpty.parentNode)
            oEmpty.parentNode.removeChild(oEmpty);
    };
};
// #endif

// #endif
