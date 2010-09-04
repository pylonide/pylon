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
    
    function destroy(){
        //@todo
    }
    
    function remove(){
        //@todo
    }
    
    function add(){
        //@todo
    }
    
    this.check = function(amlNode, type, callback) {
        if (amlNode.$ext.offsetHeight || amlNode.$ext.offsetWidth)
            return true;

        if (amlNode.$visibleCheck) {
            if (amlNode.$visibleCheck[type])
                return;
        }
        else
            amlNode.$visibleCheck = {};
        amlNode.$visibleCheck[type] = true;

        function check(e){
            //apf.isTrue(e.value)
            if (!amlNode.$ext.offsetHeight && !amlNode.$ext.offsetWidth)
                return;
                
            callback.call(amlNode);
            
            p = amlNode;
            while (p) {
                p.removeEventListener("prop.visible", check);
                p = p.parentNode || p.$parentNode;
            }
            
            delete amlNode.$visibleCheck[type];
        }

        //Set events on the parent tree
        amlNode.addEventListener("prop.visible", check);
        //amlNode.addEventListener("DOMNodeRemovedFromDocument", destroy); 
        
        var p = amlNode.parentNode || amlNode.$parentNode;
        while (p) {
            p.addEventListener("prop.visible", check);
            p = p.parentNode || p.$parentNode;
        }
    
        /*if (!inited) {
            apf.document.addEventListener("DOMNodeRemoved", remove); 
            apf.document.addEventListener("DOMNodeInserted", add); 
            
            inited = true;
        }*/
        
        return false;
    }
    
    this.permanent = function(amlNode, show, hide){
        var state = amlNode.$ext.offsetHeight && amlNode.$ext.offsetWidth;
        function check(e){
            var newState = amlNode.$ext.offsetHeight && amlNode.$ext.offsetWidth;
            if (newState == state)
                return;
            
            if (newState) show();
            else hide();
            
            state = newState;
        }

        //Set events on the parent tree
        amlNode.addEventListener("prop.visible", check);
        //amlNode.addEventListener("DOMNodeRemovedFromDocument", destroy); 
        
        var p = amlNode.parentNode || amlNode.$parentNode;
        while (p) {
            p.addEventListener("prop.visible", check);
            p = p.parentNode || p.$parentNode;
        }

        return state;
    }
};
//#endif
