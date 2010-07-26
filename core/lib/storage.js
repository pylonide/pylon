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

// #ifdef __WITH_STORAGE
/**
 * Stores javascript structures based on a name and a namespace. This object
 * is used by {@link element.offline apf offline support} as well as the 
 * {@link core.registry registry} and the {@link teleport.http http object} for 
 * caching. All but the memory storage provider, provide persistent storage. 
 * This means the data is kept between browser sessions. This allows apf to
 * have inter-session communication. For instance offline support uses it to
 * store data that could not be send to the server. When the application does 
 * go online (and this could be several sessions later), the data is send to the
 * server.
 *
 * Remarks:
 * The HTML5 specification advices an interface for local persistent storage.
 * Not all browsers have implemented this yet. There are several plugins and/or
 * browser containers that provide solutions for this. Among them are google 
 * gears and adobe's flash. Storage providers for these and others are available.
 *
 * @default_private
 */
apf.storage = {
    modules : {},

    /**
     * Initializes the main storage engine based on the specified provider.
     * @param {String} name the name of the provider that will provider storage
     *   Possible values:
     *   memory     data is stored in memory and is lost when the application exits.
     *   air        data is stored in the air name/value storage.
     *   air.file   data is stored in the air file based storage.
     *   air.sql    data is stored in the air sqlite storage.
     *   flash      data is stored in a small flash container.
     *   gears      data is stored using the sqlite interface of gears.
     *   html5      data is stored in a local storage object specified by the WHATWG html5 standard.
     */
    init : function(name){
        if (!name || name == "autodetect") name = this.autodetect();
        var provider = this.getProvider(name);

        //Install the provider
        apf.storage = apf.extend(this, provider);
        apf.storage.init = null;
        
        //#ifdef __DEBUG
        apf.console.info("Installed storage provider '" + name + "'");
        //#endif
        
        return provider;
    },
    
    /** 
     * Retrieves a storage provider without installing it as the central storage provider.
     * @param {String} name the name of the storage provider.
     *   Possible values:
     *   memory     data is stored in memory and is lost when the application exits.
     *   air        data is stored in the air name/value storage.
     *   air.file   data is stored in the air file based storage.
     *   air.sql    data is stored in the air sqlite storage.
     *   flash      data is stored in a small flash container.
     *   gears      data is stored using the sqlite interface of gears.
     *   gears      data is stored using the sqlite interface of gears.
     *   html5      data is stored in a local storage object specified by the WHATWG html5 standard.
     */
    getProvider : function(name){
        var provider = apf.storage.modules[name];

        if(!provider || typeof provider != "object") {
            //#ifdef __DEBUG
            apf.console.warn("Could not find storage provider '" + name + "'");
            //#endif
            
            return false;
        }
        
        if (!provider.isAvailable()) {
            //#ifdef __DEBUG
            apf.console.warn(
                "Storage provider '" + name + "' is not available");
            //#endif
            
            return false;
        }

        if(!provider.initialized 
          && (!provider.init || provider.init() === false)) {
            //#ifdef __DEBUG
            apf.console.warn(
                "Could not install storage provider '" + name + "");
            //#endif
            
            return false;
        }
        
        provider.name = name;
        apf.extend(provider, this.base);

        return provider;
    },

    /**
     *  Checks if a provider is available.
     */
    autodetect : function(){
        for (var name in this.modules) {
            if ("memory|cookie".indexOf(name) > -1)
                continue;

            if (this.modules[name].isAvailable()) {
                return name;
            }
        }
        
        return !location.host && this.modules.cookie
            ? "cookie"
            : (this.modules.memory
                ? "memory" 
                : null);
    },

    /**
     * @private
     */
    base : {
        namespace : "default",
        
        isValidKeyArray : function(keys) {
            return (!keys || !keys.join)
                ? false
                : /^[0-9A-Za-z_\.\-]*$/.test(keys.join(""));
        },
        
        isValidKey : function(keyName){
            return (keyName === null || keyName === undefined)
                ? false
                : /^[0-9A-Za-z_\.\-]*$/.test(keyName);
        },
        
        //Optimization for slow API's
        getAllPairs : function(namespace, store){
            var keys   = this.getKeys(namespace);
            
            if (!keys || !keys.length)
                return;
                
            var values = this.getMultiple(keys, namespace);
            for (var i = 0; i < keys.length && values; i++) {
                if (values[i])
                    store[keys[i]] = values[i];
            }

            return keys.length;
        }
    }
    
    // #ifndef __PACKAGED
    //This code is only here for documentation purpose
    ,
    /**
     * Stores a key value pair in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {mixed}  value     the information to store.
     * @param {String} namespace the named context into which to store the key value pair.
     */
    put: function(key, value, namespace){},
    
    /**
     * Retrieves a keys in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {String} namespace the named context of the keys to retrieve.
     * @return {mixed} the value that correspond to the key in the namespace.
     */
    get: function(key, namespace){},
    
    /**
     * Retrieves all the namespaces in use.
     * @return {Array} list of namespaces.
     */
    getNamespaces: function(){},

    /**
     * Retrieves all the keys of a namespace.
     * @param {String} namespace the named context of the keys to retrieve.
     * @return {Array} the list of keys in the namespace.
     */
    getKeys: function(namespace){},

    /** 
     * Removes all keys from a namespace
     */
    clear: function(namespace){},
    
    /**
     * Removes a key in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {String} namespace the named context of the keys to remove.
     */
    remove: function(key, namespace){},
    
    /**
     * Stores a key value pair in a namespace.
     * @param {Array}  keys      a list of keys that identify the information stored.
     * @param {Array}  values    a list of values to store.
     * @param {String} namespace the named context into which to store the key value pair.
     */
    putMultiple: function(keys, values, namespace) {},

    /**
     * Retrieves all the values of several keys in a namespace.
     * @param {Array}  keys      a list of keys that identify the information retrieved.
     * @param {String} namespace the named context into which to store the key value pair.
     * @returns {Array} list of values that have been retrieved.
     */
    getMultiple: function(keys, namespace){},
    
    /**
     * Removes a key in a namespace.
     * @param {Array}  keys      a list of keys that identify the information to be removed.
     * @param {String} namespace the named context of the keys to remove.
     */
    removeMultiple: function(keys, namespace){}
    // #endif
};
//#endif
