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

    init : function(name){
        if(!name) name = this.autodetect();
        var provider = this.getProvider(name);

        //Install the provider
        jpf.storage = jpf.extend(provider, this);
        
        //#ifdef __DEBUG
        jpf.console.info("Installed storage provider '" + name + "'");
        //#endif
        
        return provider;
    },
    
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
                "Storage providers '" + name + "' is not available");
            //#endif
            
            return false;
        }

        if(!provider.initialized && provider.init() === false) {
            //#ifdef __DEBUG
            jpf.console.warn(
                "Could not install storage provider '" + name + "");
            //#endif
            
            return false;
        }
        
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

    base : {
        namespace : "default",
        
        isValidKeyArray : function(keys) {
            return (keys === null || keys === undefined || !jpf.isArray(keys))
                ? false
                : /^[0-9A-Za-z_\.\-]*$/.test(keys.join(""));
        },
        
        isValidKey : function(keyName){
            return (keyName === null || keyName === undefined)
                ? false
                : /^[0-9A-Za-z_\.\-]*$/.test(keyName);
        }
    }
}
//#endif