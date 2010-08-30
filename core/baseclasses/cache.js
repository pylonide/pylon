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

apf.__CACHE__ = 1 << 2;

// #ifdef __WITH_CACHE

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have caching features. It takes care of
 * storing, retrieving and updating rendered data (in html form)
 * to overcome the waiting time while rendering the contents every time the
 * data is loaded.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.Cache = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    this.cache               = {};
    this.$subTreeCacheContext = null;

    this.caching  = true;
    this.$regbase = this.$regbase | apf.__CACHE__;

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/

    this.addEventListener("$load", function(e){
        if (!this.caching || e.forceNoCache)
            return;

        // retrieve the cacheId
        if (!this.cacheId) {
            this.cacheId = this.$generateCacheId && this.$generateCacheId(e.xmlNode) 
                || e.xmlNode.getAttribute(apf.xmldb.xmlIdTag) 
                || apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(e.xmlNode), e.xmlNode);//e.xmlNode
        }

        // Retrieve cached version of document if available
        var fromCache = getCache.call(this, this.cacheId, e.xmlNode);
        if (fromCache) {
            if (fromCache == -1 || !this.getTraverseNodes)
                return (e.returnValue = false);

            var nodes = this.getTraverseNodes();

            //Information needs to be passed to the followers... even when cached...
            if (nodes.length && this.autoselect)
                this.select(nodes[0], null, null, null, true);
            else if (this.clearSelection)
                this.clearSelection(); //@todo apf3.0 was setProperty("selected", null

            if (!nodes.length) {
                // Remove message notifying user the control is without data
                this.$removeClearMessage();
                this.$setClearMessage(this["empty-message"], "empty");
            }
                
            //#ifdef __WITH_PROPERTY_BINDING
            //@todo move this to getCache??
            if (nodes.length != this.length)
                this.setProperty("length", nodes.length);
            //#endif

            return false;
        }
    });
    
    this.addEventListener("$clear", function(){
        if (!this.caching)
            return;

        /*
            Check if we borrowed an HTMLElement
            We should return it where it came from

            note: There is a potential that we can't find the exact location
            to put it back. We should then look at it's position in the xml.
            (but since I'm lazy it's not doing this right now)
            There might also be problems when removing the xmlroot
        */
        if (this.hasFeature(apf.__MULTISELECT__)
          && this.$subTreeCacheContext && this.$subTreeCacheContext.oHtml) {
            if (this.renderRoot) {
                this.$subTreeCacheContext.parentNode.insertBefore(
                    this.$subTreeCacheContext.oHtml, this.$subTreeCacheContext.beforeNode);
            }
            else {
                var container = this.$subTreeCacheContext.container || this.$container;
                while (container.childNodes.length)
                    this.$subTreeCacheContext.oHtml.appendChild(container.childNodes[0]);
            }

            this.documentId = this.xmlRoot = this.cacheId = this.$subTreeCacheContext = null;
        }
        else {
            /* If the current item was loaded whilst offline, we won't cache
             * anything
             */
            if (this.$loadedWhenOffline) {
                this.$loadedWhenOffline = false;
            }
            else {
                // Here we cache the current part
                var fragment = this.$getCurrentFragment();
                if (!fragment) return;//this.$setClearMessage(this["empty-message"]);

                fragment.documentId = this.documentId;
                fragment.xmlRoot    = this.xmlRoot;
                
                if (this.cacheId || this.xmlRoot)
                    setCache.call(this, this.cacheId ||
                        this.xmlRoot.getAttribute(apf.xmldb.xmlIdTag) || "doc"
                        + this.xmlRoot.getAttribute(apf.xmldb.xmlDocTag), fragment);
            }
        }
    });

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
    function getCache(id, xmlNode){
        /*
            Let's check if the requested source is actually
            a sub tree of an already rendered part
        */
        //#ifdef __WITH_MULTISELECT
        if (xmlNode && this.hasFeature(apf.__MULTISELECT__) && this.$isTreeArch) {
            var cacheItem,
                htmlId = xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId,
                node   = this.$pHtmlDoc.getElementById(htmlId);
            if (node) 
                cacheItem = id ? false : this.$container; //@todo what is the purpose of this statement?
            else {
                for (var prop in this.cache) {
                    if (this.cache[prop] && this.cache[prop].nodeType) {
                        node = this.cache[prop].getElementById(htmlId);
                        if (node) {
                            cacheItem = id ? prop : this.cache[prop]; //@todo what is the purpose of this statement?
                            break;
                        }
                    }
                }
            }
            
            if (cacheItem && !this.cache[id]) {
                /*
                    Ok so it is, let's borrow it for a while
                    We can't clone it, because the updates will
                    get ambiguous, so we have to put it back later
                */
                var oHtml = this.$findHtmlNode(
                    xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
                this.$subTreeCacheContext = {
                    oHtml      : oHtml,
                    parentNode : oHtml.parentNode,
                    beforeNode : oHtml.nextSibling,
                    cacheItem  : cacheItem
                };

                this.documentId = apf.xmldb.getXmlDocId(xmlNode);
                this.cacheId    = id;
                this.xmlRoot    = xmlNode;

                //Load html
                if (this.renderRoot)
                    this.$container.appendChild(oHtml);
                else {
                    while (oHtml.childNodes.length)
                        this.$container.appendChild(oHtml.childNodes[0]);
                }

                return true;
            }
        }
        //#endif

        //Checking Cache...
        if (!this.cache[id]) return false;

        //Get Fragment and clear Cache Item
        var fragment    = this.cache[id];

        this.documentId = fragment.documentId;
        this.cacheId    = id;
        this.xmlRoot    = xmlNode;//fragment.xmlRoot;
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("root", this.xmlRoot);
        //#endif

        this.clearCacheItem(id);

        this.$setCurrentFragment(fragment);

        return true;
    }

    /**
     * Sets cache element and it's ID
     *
     * @param {String}           id        the id of the cache element to be stored.
     * @param {DocumentFragment} fragment  the data to be stored.
     * @private
     */
    function setCache(id, fragment){
        if (!this.caching) return;

        this.cache[id] = fragment;
    }

    /**
     * Finds HTML presentation node in cache by ID
     *
     * @param  {String} id  the id of the HTMLElement which is looked up.
     * @return {HTMLElement} the HTMLElement found. When no element is found, null is returned.
     */
    this.$findHtmlNode = function(id){
        var node = this.$pHtmlDoc.getElementById(id);
        if (node) return node;

        for (var prop in this.cache) {
            if (this.cache[prop] && this.cache[prop].nodeType) {
                node = this.cache[prop].getElementById(id);
                if (node) return node;
            }
        }

        return null;
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
        this.cache[id].documentId = 
        this.cache[id].cacheId    =
        this.cache[id].xmlRoot    = null;

        if (remove)
            apf.destroyHtmlNode(this.cache[id]);

        this.cache[id] = null;
    };

    /**
     * Removes all items from the cache
     *
     * @see baseclass.databinding.method.clearCacheItem
     * @private
     */
    this.clearAllCache = function(){
        for (var prop in this.cache) {
            if (this.cache[prop])
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
        return this.cache[id];
    };

    /**
     * Checks whether a cache item exists by the specified id
     *
     * @param {String} id  the id of the cache item to check.
     * @see baseclass.databinding.method.clearCacheItem
     * @private
     */
    this.$isCached = function(id){
        return this.cache[id] || this.cacheId == id ? true : false;
    };
    
    if (!this.$getCurrentFragment) {
        this.$getCurrentFragment = function(){
            var fragment = this.$container.ownerDocument.createDocumentFragment();
    
            while (this.$container.childNodes.length) {
                fragment.appendChild(this.$container.childNodes[0]);
            }
    
            return fragment;
        };
    
        this.$setCurrentFragment = function(fragment){
            this.$container.appendChild(fragment);
    
            if (!apf.window.hasFocus(this) && this.blur)
                this.blur();
        };
    }
    
    /**
     * @attribute {Boolean} caching whether caching is enabled for this element.
     */
    this.$booleanProperties["caching"] = true;
    this.$supportedProperties.push("caching");

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        //Remove all cached Items
        this.clearAllCache();
    });
};

apf.GuiElement.propHandlers["caching"] = function(value) {
    if (!apf.isTrue(value)) return;
    
    if (!this.hasFeature(apf.__CACHE__))
        this.implement(apf.Cache);
};

// #endif
