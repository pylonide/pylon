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

// #ifdef __WITH_STORAGE_HTML5

/**
 *        Storage provider that uses WHAT Working Group features in Firefox 2 
 *        to achieve permanent storage.
 *        The WHAT WG storage API is documented at 
 *        http://www.whatwg.org/specs/web-apps/current-work/#scs-client-side
 */
apf.storage.modules.html5 = {
    domain     : (location.hostname == "localhost")
                    ? "localhost.localdomain"
                    : location.hostname,
    initialized: true,
    storage : apf.isIE
                ? self.localStorage
                : self.globalStorage,
    
    isAvailable: function(){
        try {
            // see: https://bugzilla.mozilla.org/show_bug.cgi?id=357323
            var myStorage = this.storage[location.href];
        }
        catch(e){
            return false;
        }

        return true;
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid key given: " + key));
        //#endif

        // get our full key name, which is namespace + key
        key = this.getFullKey(key, namespace);
        
        // serialize the value;
        value = apf.serialize(value);
        
        // try to store the value
        try {
            var myStorage = this.storage[this.domain];
            myStorage.setItem(key, value);
        }
        catch(e) {
            // indicate we failed
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null, "Setting name/value pair",
                "Could not set name/value pair"));
        //#endif
        }
    },

    get: function(key, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid key given: " + key));
        //#endif

        // get our full key name, which is namespace + key
        key = this.getFullKey(key, namespace);
        
        // sometimes, even if a key doesn't exist, Firefox
        // will return a blank string instead of a null --
        // this _might_ be due to having underscores in the
        // keyname, but I am not sure.
        
        // @fixme: Simplify this bug into a testcase and
        // submit it to Firefox
        var myStorage = this.storage[this.domain];
        var results = myStorage.getItem(key);
        
        if (results == null || results == "")
            return null;
        
        return apf.unserialize(results);
    },
    
    getNamespaces: function(){
        var results = [ this.namespace ];
        
        // simply enumerate through our array and save any string
        // that starts with __
        var found = {};
        var myStorage = this.storage[this.domain];
        var tester = /^__([^_]*)_/;
        for (var i = 0; i < myStorage.length; i++) {
            var currentKey = myStorage.key(i);
            if (tester.test(currentKey) == true){
                var currentNS = currentKey.match(tester)[1];
                // have we seen this namespace before?
                if (typeof found[currentNS] == "undefined") {
                    found[currentNS] = true;
                    results.push(currentNS);
                }
            }
        }
        
        return results;
    },

    getKeys: function(namespace){
        if(!namespace)
            namespace = this.namespace;
		    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Getting keys",
                "Invalid namespace given: " + namespace));
        //#endif
        
        // create a regular expression to test the beginning
        // of our key names to see if they match our namespace;
        // if it is the default namespace then test for the presence
        // of no namespace for compatibility with older versions
        // of dojox.storage
        var namespaceTester = new RegExp(namespace == this.namespace
            ? "^([^_]{2}.*)$"
            : "^__" + namespace + "_(.*)$");
        
        var myStorage = this.storage[this.domain];
        var keysArray = [];
        for (var i = 0; i < myStorage.length; i++) {
            var currentKey = myStorage.key(i);
            if (namespaceTester.test(currentKey) == true) {
                // strip off the namespace portion
                currentKey = currentKey.match(namespaceTester)[1];
                keysArray.push(currentKey);
            }
        }
        
        return keysArray;
    },

    clear: function(namespace){
        if (!namespace)
            namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
        
        // create a regular expression to test the beginning
        // of our key names to see if they match our namespace;
        // if it is the default namespace then test for the presence
        // of no namespace for compatibility with older versions
        // of dojox.storage
        var namespaceTester = new RegExp(namespace == this.namespace
            ? "^[^_]{2}"
            : "^__" + namespace + "_");
        
        var myStorage = this.storage[this.domain];
        for (var i = myStorage.length-1; i >= 0; i--) {
            if (namespaceTester.test(myStorage.key(i)) == true)
                myStorage.removeItem(myStorage.key(i));
        }
    },
    
    remove: function(key, namespace){
        // get our full key name, which is namespace + key
        key = this.getFullKey(key, namespace);
        
        var myStorage = this.storage[this.domain];
        myStorage.removeItem(key);
    },
    
    isPermanent: function(){
        return true;
    },

    getMaximumSize: function(){
        return 0;
    },

    hasSettingsUI: function(){
        return false;
    },
    
    showSettingsUI: function(){
        throw new Error(apf.formatErrorString(0, null, this.declaredClass
            + " does not support a storage settings user-interface"));
    },
    
    hideSettingsUI: function(){
        throw new Error(apf.formatErrorString(0, null, this.declaredClass
            + " does not support a storage settings user-interface"));
    },
    
    getFullKey: function(key, namespace){
        if (!namespace)
            namespace = this.namespace;
        
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif
        
        // don't append a namespace string for the default namespace,
        // for compatibility with older versions of dojox.storage
        return namespace == this.namespace
            ? key
            : "__" + namespace + "_" + key;
    }
};
// #endif
