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
//@todo Use default storage provider (in memory)
jpf.storage = {
    modules : {},

    /**
     * Initializes the main storage engine based on the specified provider.
     * @param {String} name the name of the provider that will provider storage
     *   Possible values:
     *   memory     data is stored in memory and is lossed when the application exits.
     *   air        data is stored in the air name/value storage.
     *   air.file   data is stored in the air file based storage.
     *   air.sql    data is stored in the air sqlite storage.
     *   flash      data is stored in a small flash container.
     *   gears      data is stored using the sqlite interface of gears.
     *   html5      data is stored in a local storage object specified by the WHATWG html5 standard.
     */
    init : function(name){
        if(!name) name = this.autodetect();
        var provider = this.getProvider(name);

        //Install the provider
        jpf.storage = jpf.extend(provider, this); /** @inherits jpf.storage.modules.memory */
        jpf.storage.init = null;
        
        //#ifdef __DEBUG
        jpf.console.info("Installed storage provider '" + name + "'");
        //#endif
        
        return provider;
    },
    
    /** 
     * Retrieves a storage provider without installing it as the central storage provider.
     * @param {String} name the name of the storage provider.
     *   Possible values:
     *   memory     data is stored in memory and is lossed when the application exits.
     *   air        data is stored in the air name/value storage.
     *   air.file   data is stored in the air file based storage.
     *   air.sql    data is stored in the air sqlite storage.
     *   flash      data is stored in a small flash container.
     *   gears      data is stored using the sqlite interface of gears.
     *   html5      data is stored in a local storage object specified by the WHATWG html5 standard.
     */
    getProvider : function(name){
        var provider = jpf.storage.modules[name];

        if(!provider || typeof provider != "object") {
            //#ifdef __DEBUG
            jpf.console.warn("Could not find storage provider '" + name + "'");
            //#endif
            
            return false;
        }
        
        if (!provider.isAvailable()) {
            //#ifdef __DEBUG
            jpf.console.warn(
                "Storage provider '" + name + "' is not available");
            //#endif
            
            return false;
        }

        if(!provider.initialized 
          && (!provider.init || provider.init() === false)) {
            //#ifdef __DEBUG
            jpf.console.warn(
                "Could not install storage provider '" + name + "");
            //#endif
            
            return false;
        }
        
        provider.name = name;
        jpf.extend(provider, this.base);

        return provider;
    },

    /**
     *  This should also check if a provider has already been used
     *  in a previous session
     */
    autodetect : function(){
        for (var name in this.modules) {
            if (name == "memory")
                continue;
                
            if (this.modules[name].isAvailable()) {
                return name;
            }
        }
        
        return this.modules.memory
            ? "memory" 
            : null;
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
            
            if (!keys.length)
                return;
                
            var values = this.getMultiple(keys, namespace);
            for (var i = 0; i < keys.length; i++) {
                store[keys[i]] = values[i];
            }

            return keys.length;
        }
    }
};
//#endif
