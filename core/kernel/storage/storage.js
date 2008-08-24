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
jpf.storage = {
    get : function(name){
        if(!name) name = this.current || jpf.appsettings.storage || this.autodetect();
        
        var provider = jpf.storage[name];
        
        //#ifdef __DEBUG
        if(!provider || typeof provider != "object")
            throw new Error(0, jpf.formatErrorString(0, null, "Retrieving Storage Provider", "Could not find storage provider '" + name + "'"));
        //#endif
        
        if(!provider.isAvailable()) //warning here?
            return false;
        
        if(!provider.initialized || provider.init() === false) //warning here?
            return false;
        
        if(!provider.isValidKey)
            jpf.extend(provider, jpf.provider.base);
        
        return provider;
    },
    
    set : function(name){
        this.current = name;
    },
    
    autodetect : function(){
        /*
            This should also check if a provider has already been used
            in a previous session
        */
    },
    
    base : {
        DEFAULT_NAMESPACE: "default",
        
        isValidKeyArray: function( keys) {
            if(keys === null || keys === undefined || !dojo.isArray(keys)){
                return false;
            }
    
            //    JAC: This could be optimized by running the key validity test 
            //  directly over a joined string
            return !dojo.some(keys, function(key){
                return !this.isValidKey(key);
            }); // Boolean
        },
        
        isValidKey: function(/*string*/ keyName){ /*Boolean*/
            // summary:
            //        Subclasses can call this to ensure that the key given is valid
            //        in a consistent way across different storage providers. We use
            //        the lowest common denominator for key values allowed: only
            //        letters, numbers, and underscores are allowed. No spaces. 
            if(keyName === null || keyName === undefined){
                return false;
            }
                
            return /^[0-9A-Za-z_]*$/.test(keyName);
        }
    }
}
//#endif