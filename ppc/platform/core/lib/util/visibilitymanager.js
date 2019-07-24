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

//#ifdef __WITH_VISIBILITYMANAGER
/**
 * Manages visibility hooks for elements that need to be visible to set their
 * layout.
 *
 * @private
 */
apf.visibilitymanager = function(){
    var tree  = {};
    var _self  = this;
    var inited = false;
    
    this.check = function(amlNode, type, callback) {
        if (amlNode.$ext.offsetHeight || amlNode.$ext.offsetWidth)
            return true;

        if (amlNode.$visibleCheck) {
            if (amlNode.$visibleCheck[type])
                return;
        }
        else
            amlNode.$visibleCheck = {};

        function cleanup(setInsertion){
            var p = amlNode;
            while (p) {
                p.removeEventListener("prop.visible", check);
                p.removeEventListener("DOMNodeRemoved", remove); 
                p.removeEventListener("DOMNodeRemovedFromDocument", remove); 
                if (setInsertion)
                    p.addEventListener("DOMNodeInserted", add);
                p = p.parentNode || p.$parentNode;
            }
            
            delete amlNode.$visibleCheck[type];
        }

        function check(e){
            //apf.isTrue(e.value)
            if (!amlNode.$ext.offsetHeight && !amlNode.$ext.offsetWidth)
                return;
                
            callback.call(amlNode);
            cleanup();
        }
        
        function remove(e){
            if (e.currentTarget != this)
                return;
            
            cleanup(e.name == "DOMNodeRemoved");
        }

        function add(){
            //Set events on the parent tree
            var p = amlNode;
            while (p) {
                p.addEventListener("prop.visible", check);
                p.addEventListener("DOMNodeRemoved", remove); 
                p.addEventListener("DOMNodeRemovedFromDocument", remove); 
                p.removeEventListener("DOMNodeInserted", add);
                p = p.parentNode || p.$parentNode;
            }
            
            amlNode.$visibleCheck[type] = true;
        }
        
        add();
        
        return false;
    }
    
    this.permanent = function(amlNode, show, hide){
        var state = amlNode.$ext && (amlNode.$ext.offsetHeight || amlNode.$ext.offsetWidth);
        function check(e){
            var newState = amlNode.$ext && (amlNode.$ext.offsetHeight || amlNode.$ext.offsetWidth);
            if (newState == state)
                return;
            
            if (newState) show();
            else hide();
            
            state = newState;
        }

        //Set events on the parent tree
        /*var p = amlNode;
        while (p) {
            p.addEventListener("prop.visible", check);
            p = p.parentNode || p.$parentNode;
        }*/
        
        function cleanup(setInsertion){
            var p = amlNode;
            while (p) {
                p.removeEventListener("prop.visible", check);
                p.removeEventListener("DOMNodeRemoved", remove); 
                p.removeEventListener("DOMNodeRemovedFromDocument", remove); 
                if (setInsertion)
                    p.addEventListener("DOMNodeInserted", add);
                p = p.parentNode || p.$parentNode;
            }
            
            check();
        }

        function remove(e){
            if (e.currentTarget != this)
                return;
            
            cleanup(e.name == "DOMNodeRemoved");
        }

        function add(){
            //Set events on the parent tree
            var p = amlNode;
            while (p) {
                p.addEventListener("prop.visible", check);
                p.addEventListener("DOMNodeRemoved", remove); 
                p.addEventListener("DOMNodeRemovedFromDocument", remove); 
                p.removeEventListener("DOMNodeInserted", add);
                p = p.parentNode || p.$parentNode;
            }
            
            check();
        }
        
        add();

        return state;
    }
    
    this.removePermanent = function(amlNode){
        
    }
};
//#endif
