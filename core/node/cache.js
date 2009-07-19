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

var __CACHE__ = 1 << 2;

// #ifdef __WITH_CACHE

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have caching features. It takes care of
 * storing, retrieving and updating rendered data (in html form)
 * to overcome the waiting time while rendering the contents every time the
 * data is loaded.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.Cache = function(){
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
     * @param  {String} id  the id of the cache element which is looked up.
     * @param  {Object} xmlNode
     * @return {Boolean}
     *   Possible values:
     *   true   the cache element is found and set active
     *   false  otherwise
     * @see    baseclass.databinding.method.load
     * @private
     */
    this.getCache = function(id, xmlNode){
        //Checking Current
        if (id == this.cacheID) return -1;
        /*
            Let's check if the requested source is actually
            a sub tree of an already rendered part
        */
        //#ifdef __WITH_MULTISELECT
        if (xmlNode && this.hasFeature(__MULTISELECT__) && this.isTreeArch) {
            var cacheItem = this.getCacheItemByHtmlId(
                xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.uniqueId);
            if (cacheItem && !cache[id]) {
                /*
                    Ok so it is, let's borrow it for a while
                    We can't clone it, because the updates will
                    get ambiguous, so we have to put it back later
                */
                
                this.clear(true);

                var oHtml = this.getNodeFromCache(
                    xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.uniqueId);
                /**
                 * @private
                 */
                subTreeCacheContext = {
                    oHtml      : oHtml,
                    parentNode : oHtml.parentNode,
                    beforeNode : oHtml.nextSibling,
                    cacheItem  : cacheItem
                };

                this.documentId = apf.xmldb.getXmlDocId(xmlNode);
                this.cacheID    = id;
                this.xmlRoot    = xmlNode;

                //Load html
                if (this.renderRoot)
                    this.oInt.appendChild(oHtml);
                else {
                    while (oHtml.childNodes.length)
                        this.oInt.appendChild(oHtml.childNodes[0]);
                }

                return true;
            }
        }
        //#endif

        //Checking Cache...
        if (!cache[id]) return false;

        //Removing previous
        if (this.cacheID)
            this.clear(true);

        //Get Fragment and clear Cache Item
        var fragment    = cache[id];

        this.documentId = fragment.documentId;
        this.cacheID    = id;
        this.xmlRoot    = fragment.xmlRoot;

        this.clearCacheItem(id);

        this.$setCurrentFragment(fragment);

        return true;
    };

    /**
     * Sets cache element and it's ID
     *
     * @param {String}           id        the id of the cache element to be stored.
     * @param {DocumentFragment} fragment  the data to be stored.
     * @private
     */
    this.setCache = function(id, fragment){
        if (!this.caching) return;

        cache[id] = fragment;
    };

    /**
     * Finds HTML presentation node in cache by ID
     *
     * @param  {String} id  the id of the HTMLElement which is looked up.
     * @return {HTMLElement} the HTMLElement found. When no element is found, null is returned.
     */
    this.getNodeFromCache = function(id){
        var node = this.$findNode(null, id);
        if (node) return node;

        for (var prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                node = this.$findNode(cache[prop], id);
                if (node) return node;
            }
        }

        return null;
    };

    this.$findNode = function(cacheNode, id){
        if (!cacheNode)
            return this.pHtmlDoc.getElementById(id);

        return cacheNode.getElementById(id);
    };

    /**
     * Finds HTML presentation element in cache by xmlNode or xml id
     *
     * @param {mixed} xmlNode the xmlNode or id of the xmlNode that is represented by the HTMLElement which is looked up.
     * @return {HTMLElement} the HTMLElement found. When no element is found, null is returned.
     */
    this.getNodeByXml = function(xmlNode){
        return xmlNode
            ? (this.getNodeFromCache((typeof xmlNode == "object"
                ? xmlNode.getAttribute(apf.xmldb.xmlIdTag)
                : xmlNode) + "|" + this.uniqueId))
            : null;
    };

    /**
     * Finds cache element by ID of HTMLElement in cache
     *
     * @param {String} id  the id of the HTMLElement which is looked up.
     * @return {DocumentFragment} the cached element. When no object is found, null is returned.
     * @private
     */
    this.getCacheItemByHtmlId = function(id, getId){
        var node = this.$findNode(null, id);
        if (node) return getId ? false : this.oInt;

        for (var prop in cache) {
            if (cache[prop] && cache[prop].nodeType) {
                node = this.$findNode(cache[prop], id);
                if (node) return getId ? prop : cache[prop];
            }
        }

        return null;
    };

    /**
     * Unloads data from this element and resets state displaying an empty message.
     * Empty message is set on the {@link baseclass.amlelement.property.msg}.
     *
     * @param {Boolean} [nomsg]   whether to display the empty message.
     * @param {Boolean} [doEvent] whether to sent select events.
     * @see baseclass.databinding.method.load
     * @private
     */
    this.clear = function(nomsg, doEvent){
        if (this.clearSelection)
            this.clearSelection(null, !doEvent);

        if (this.caching) {
            /*
                Check if we borrowed an HTMLElement
                We should return it where it came from

                note: There is a potential that we can't find the exact location
                to put it back. We should then look at it's position in the xml.
                (but since I'm lazy it's not doing this right now)
                There might also be problems when removing the xmlroot
            */
            if (this.hasFeature(__MULTISELECT__)
                && subTreeCacheContext && subTreeCacheContext.oHtml) {
                if (this.renderRoot)
                    subTreeCacheContext.parentNode.insertBefore(subTreeCacheContext.oHtml, subTreeCacheContext.beforeNode);
                else {
                    while (this.oInt.childNodes.length)
                        subTreeCacheContext.oHtml.appendChild(this.oInt.childNodes[0]);
                }

                this.documentId = this.xmlRoot = this.cacheID = subTreeCacheContext = null;
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
                    if (!fragment) return;//this.$setClearMessage(this["empty-message"]);

                    fragment.documentId = this.documentId;
                    fragment.xmlRoot    = this.xmlRoot;
                }
            }
        }
        else if (this.$clear)
            this.$clear();
        else
            this.oInt.innerHTML = "";

        if (typeof nomsg == "string") {
            var msgType = nomsg;
            nomsg = false;
            
            if (!this[msgType + "-message"])
                this.$propHandlers[msgType + "-message"].call(this);
        }
        this.$lastClearType = msgType || null;

        if (!nomsg) {
            this.$setClearMessage(msgType 
              ? this[msgType + "-message"] 
              : this["empty-message"], msgType || "empty");

            var c = this.$getConnections();
            for (var i = c.length - 1; i >= 0; i--)
                c[i].o.clear(msgType, doEvent);
        }
        else if(this.$removeClearMessage)
            this.$removeClearMessage();

        if (this.caching && (this.cacheID || this.xmlRoot))
            this.setCache(this.cacheID || this.xmlRoot.getAttribute(apf.xmldb.xmlIdTag) || "doc"
                + this.xmlRoot.getAttribute(apf.xmldb.xmlDocTag), fragment);

        this.documentId = this.xmlRoot = this.cacheID = null;

        //#ifdef __WITH_PROPERTY_BINDING
        if (!nomsg && this.hasFeature(__MULTISELECT__)) //@todo this is all wrong
            this.setProperty("length", 0);
        //#endif
    };

    /**
     * @private
     */
    this.clearAllTraverse = function(msg, className){
        if (this.clearSelection)
            this.clearSelection(null, true);

        this.oInt.innerHTML = "";
        this.$setClearMessage(msg || this["empty-message"], className || "empty");
        this.setConnections();
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("length", 0);
        //#endif
    };

    /**
     * Removes an item from the cache.
     *
     * @param {String}  id       the id of the HTMLElement which is looked up.
     * @param {Boolean} [remove] whether to destroy the Fragment.
     * @see baseclass.databinding.method.clear
     * @private
     */
    this.clearCacheItem = function(id, remove){
        cache[id].documentId = cache[id].cacheID = cache[id].xmlRoot = null;

        if (remove)
            apf.removeNode(cache[id]);

        cache[id] = null;
    };

    /**
     * Removes all items from the cache
     *
     * @see baseclass.databinding.method.clearCacheItem
     * @private
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
     * @param {String} id  the id of the HTMLElement which is looked up.
     * @see baseclass.databinding.method.clearCacheItem
     * @private
     */
    this.getCacheItem = function(id){
        return cache[id];
    };

    /**
     * Checks whether a cache item exists by the specified id
     *
     * @param {String} id  the id of the cache item to check.
     * @see baseclass.databinding.method.clearCacheItem
     * @private
     */
    this.isCached = function(id){
        return cache[id] || this.cacheID == id ? true : false;
    }

    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    /**
     * @attribute {Boolean} caching whether caching is enabled for this element.
     */
    this.$booleanProperties["caching"] = true;
    this.$supportedProperties.push("caching");

    // #ifdef __WITH_MULTISELECT
    if (this.hasFeature(__MULTISELECT__))
        this.implement(apf.MultiselectCache);
    // #endif

    this.$amlDestroyers.push(function(){
        //Remove all cached Items
        this.clearAllCache();
    });
};

// #ifdef __WITH_MULTISELECT

/**
 * @constructor
 * @private
 */
apf.MultiselectCache = function(){
    this.$getCurrentFragment = function(){
        var fragment = this.oInt.ownerDocument.createDocumentFragment();

        while (this.oInt.childNodes.length) {
            fragment.appendChild(this.oInt.childNodes[0]);
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

    var oEmpty;
    this.$setClearMessage = function(msg, className){
        if (!oEmpty) {
            this.$getNewContext("empty");

            var xmlEmpty = this.$getLayoutNode("empty");
            if (!xmlEmpty) return;

            oEmpty = apf.xmldb.htmlImport(xmlEmpty, this.oInt);
        }
        else {
            this.oInt.appendChild(oEmpty);
        }

        var empty = this.$getLayoutNode("empty", "caption", oEmpty);

        if (empty)
            apf.setNodeValue(empty, msg || "");

        oEmpty.setAttribute("id", "empty" + this.uniqueId);
        apf.setStyleClass(oEmpty, className, ["loading", "empty", "offline"]);
    };

    this.$updateClearMessage = function(msg, className) {
        if (!oEmpty || oEmpty.parentNode != this.oInt
          || oEmpty.className.indexOf(className) == -1)
            return;

        var empty = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty)
            apf.setNodeValue(empty, msg || "");
    }

    this.$removeClearMessage = function(){
        if (!oEmpty)
            oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty && oEmpty.parentNode)
            oEmpty.parentNode.removeChild(oEmpty);
    };
};
// #endif

// #endif
