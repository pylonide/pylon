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

// #ifdef __WITH_AMLEVENT
/**
 * Implementation of W3C event object. An instance of this class is passed as
 * the first argument of any event handler. Per event it will contain different
 * properties giving context based information about the event.
 * @constructor
 * @default_private
 */
apf.AmlEvent = function(name, data){
    this.name = name;
    
    var prop;
    for (prop in data)
        this[prop] = data[prop];
};

apf.AmlEvent.prototype = {
    // #ifdef __WITH_EVENT_BUBBLING
    bubbles : false,
    cancelBubble : false,
    // #endif

    /**
     * Cancels the event if it is cancelable, without stopping further 
     * propagation of the event. 
     */
    preventDefault : function(){
        this.returnValue = false;
    },

    // #ifdef __WITH_EVENT_BUBBLING
    /**
     * Prevents further propagation of the current event. 
     */
    stopPropagation : function(){
        this.cancelBubble = true;
    },
    // #endif

    stop : function() {
        this.returnValue = false;
        // #ifdef __WITH_EVENT_BUBBLING
        this.cancelBubble = true;
        // #endif
    }
};
// #endif