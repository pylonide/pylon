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

// #ifdef __WITH_O3WINDOW

/**
 * Object representing the window of the aml application. The semantic is
 * similar to that of a window in the browser, except that this window is not
 * the same as the javascript global object. It handles the focussing within
 * the document and several other events such as exit and the keyboard events.
 *
 * @event blur              Fires when the browser window looses focus.
 * @event focus             Fires when the browser window receives focus.
 *
 * @constructor
 * @inherits ppc.Class
 * @default_private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
ppc.window = function(){
    this.$uniqueId = ppc.all.push(this);
    this.ppc       = ppc;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[PPC Component : " + (this.name || "") + " (ppc.window)]";
    };

    /**
     * Retrieves the primary {@link element.actiontracker action tracker} of the application.
     */
    this.getActionTracker = function(){
        return this.$at
    };

    /**
     * @private
     */
    this.loadCodeFile = function(url){
        //if(ppc.isWebkit) return;
        if (self[url])
            ppc.importClass(self[url], true, this.win);
        else
            ppc.include(url);//, this.document);
    };

    // *** Set Window Events *** //

    /*ppc.addListener(window, "beforeunload", function(){
        return ppc.dispatchEvent("exit");
    });

    //@todo ppc3.x why is this loaded twice
    ppc.addListener(window, "unload", function(){
        if (!ppc)
            return;
        
        ppc.window.isExiting = true;
        ppc.window.destroy();
    });*/
    
    ppc.document = {};
    this.init = function(strAml){
        //#ifdef __WITH_ACTIONTRACKER
        if (ppc.actiontracker) {
            this.$at      = new ppc.actiontracker();
            this.$at.name = "default";
            //#ifdef __WITH_NAMESERVER
            ppc.nameserver.register("actiontracker", "default", this.$at);
            //#endif
        }
        //#endif

         // #ifdef __DEBUG
        ppc.console.info("Start parsing main application");
        // #endif
        // #ifdef __DEBUG
        //ppc.Latometer.start();
        // #endif
        
        //Put this in callback in between the two phases
        //#ifdef __WITH_SKIN_AUTOLOAD
        /*XForms and lazy devs support
        if (!nodes.length && !ppc.skins.skins["default"] && ppc.autoLoadSkin) {
            ppc.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            ppc.loadAmlInclude(null, doSync, "skins.xml", true);
        }*/
        //#endif 

        this.$domParser = new ppc.DOMParser();
        this.document = ppc.document = this.$domParser.parseFromString(strAml, 
          "text/xml", {
            timeout   : ppc.config.initdelay,
            callback  : function(doc){
                //@todo ppc3.0

                //Call the onload event (prevent recursion)
                if (ppc.parsed != 2) {
                    //@todo ppc3.0 onload is being called too often
                    var inital = ppc.parsed;
                    ppc.parsed = 2;
                    ppc.dispatchEvent("parse", { //@todo ppc3.0 document
                        initial : inital
                    });
                    ppc.parsed = true;
                }
        
                if (!ppc.loaded) {
                    ppc.loaded = true;
                    ppc.dispatchEvent("load");
                }
        
                //END OF ENTIRE APPLICATION STARTUP
        
                //#ifdef __DEBUG
                //ppc.console.info("Initialization finished");
                //#endif
                
                // #ifdef __DEBUG
                //ppc.Latometer.end();
                //ppc.Latometer.addPoint("Total load time");
                //ppc.Latometer.start(true);
                // #endif
          }
        }); //async
    };

    /**
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        ppc.unload(this);

        ppc           =
        this.win      =
        this.window   =
        this.document = null;
    };
};
ppc.window.prototype = new ppc.Class().$init();
ppc.window = new ppc.window();

// #endif
