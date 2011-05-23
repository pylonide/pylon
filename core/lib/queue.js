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

//#ifdef __WITH_ZERO_TIMEOUT

// Only add setZeroTimeout to the window object, and hide everything
// else in a closure.
apf.setZeroTimeout = !window.postMessage
  ? function() { setTimeout.apply(null, arguments); }
  : (function() {
        var timeouts = [];
        var messageName = "zero-timeout-message";

        // Like setTimeout, but only takes a function argument.  There's
        // no time argument (always zero) and no arguments (you have to
        // use a closure).
        function setZeroTimeout(fn) {
            timeouts.push(fn);
            window.postMessage(messageName, "*");
        }

        function handleMessage(e) {
            if (!e) e = event;
            if (e.source == window && e.data == messageName) {
                apf.stopPropagation(e);
                if (timeouts.length > 0)
                    timeouts.shift()();
            }
        }

        apf.addListener(window, "message", handleMessage, true);

        // Add the one thing we want added to the window object.
        return setZeroTimeout;
    })();
/* #else
apf.setZeroTimeout = setTimeout;
#endif */

// #ifdef __WITH_QUEUE

/**
 *
 */
apf.queue = {
    //@todo apf3.0
    q : {},

    timer : null,
    add : function(id, f){
        this.q[id] = f;
        if (!this.timer)
            this.timer = apf.setZeroTimeout(function(){
                apf.queue.empty();
            });
    },

    remove : function(id){
        delete this.q[id];
    },

    empty : function(prop){
        clearTimeout(this.timer);
        this.timer = null;

        //#ifdef __WITH_LAYOUT
        if (apf.layout && apf.layout.$hasQueue)
            apf.layout.processQueue();
        //#endif
        //#ifdef __WITH_XMLDATABASE
        if (apf.xmldb && apf.xmldb.$hasQueue)
            apf.xmldb.notifyQueued();
        //#endif

        var q  = this.q;
        this.q = {};
        for (var prop in q){
            var f = q[prop];
            if (f) {
                delete q[prop];
                f();
            }
        }
    }
};

// #endif
