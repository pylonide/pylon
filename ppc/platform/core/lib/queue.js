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
ppc.setZeroTimeout = !window.postMessage
  ? (function() {
        function setZeroTimeout() {
            return $setTimeout.apply(null, arguments);
        }
        setZeroTimeout.clearTimeout = function() {
             return clearTimeout.apply(null, arguments);
        };
        return setZeroTimeout;
    })()
  : (function() {
        var timeouts = [];
        var messageName = "zero-timeout-message";

        // Like setTimeout, but only takes a function argument.  There's
        // no time argument (always zero) and no arguments (you have to
        // use a closure).
        function setZeroTimeout(fn) {
            var id = timeouts.push(fn);
            window.postMessage(messageName, "*");
            return id;
        }
        
        setZeroTimeout.clearTimeout = function(id){
            timeouts[id] = null;
        }

        function handleMessage(e) {
            if (!e) e = event;
            if (e.source == window && e.data == messageName) {
                ppc.stopPropagation(e);
                if (timeouts.length > 0 && (t = timeouts.shift()))
                    t();
            }
        }

        ppc.addListener(window, "message", handleMessage, true);

        // Add the one thing we want added to the window object.
        return setZeroTimeout;
    })();
/* #else
ppc.setZeroTimeout = setTimeout;
#endif */

// #ifdef __WITH_QUEUE

/*
 *
 */
ppc.queue = {
    //@todo ppc3.0
    q : {},

    timer : null,
    add : function(id, f){
        this.q[id] = f;
        if (!this.timer)
            //#ifdef __WITH_ZERO_TIMEOUT
            this.timer = ppc.setZeroTimeout(function(){
                ppc.queue.empty();
            });
            /* #else
            this.timer = ppc.setTimeout(function(){
                ppc.queue.empty();
            });
            #endif */
    },

    remove : function(id){
        delete this.q[id];
    },

    empty : function(prop){
        //#ifdef __WITH_ZERO_TIMEOUT
        ppc.setZeroTimeout.clearTimeout(this.timer);
        /* #else
        clearTimeout(this.timer);
        #endif */
        this.timer = null;

        //#ifdef __WITH_LAYOUT
        if (ppc.layout && ppc.layout.$hasQueue)
            ppc.layout.processQueue();
        //#endif
        //#ifdef __WITH_XMLDATABASE
        if (ppc.xmldb && ppc.xmldb.$hasQueue)
            ppc.xmldb.notifyQueued();
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
