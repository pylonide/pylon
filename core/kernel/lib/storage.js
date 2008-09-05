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
        var provider = this.get(name);
        
        jpf.extend(provider, this.base);
        
        //Install the provider
        jpf.storage = jpf.extend(provider, this);
        
        return provider;
    },
    
    get : function(name){
        var provider = jpf.storage.modules[name];
        
        //#ifdef __DEBUG
        if(!provider || typeof provider != "object")
            throw new Error(0, jpf.formatErrorString(0, null, 
                "Retrieving Storage Provider", 
                "Could not find storage provider '" + name + "'"));
        //#endif
        
        if (!provider.isAvailable()) {
            //#ifdef __DEBUG
            jpf.issueWarning(0, 
                "Storage providers '" + name + "' is not available");
            //#endif
            
            return false;
        }

        if(!provider.initialized || provider.init() === false) {
            //#ifdef __DEBUG
            jpf.issueWarning(0, 
                "Could not install storage provider '" + name + "");
            //#endif
            
            return false;
        }

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
                : /^[0-9A-Za-z_\.]*$/.test(keys.join(""));
        },
        
        isValidKey : function(keyName){
            return (keyName === null || keyName === undefined)
                ? false
                : /^[0-9A-Za-z_\.]*$/.test(keyName);
        }
    }
}
//#endif