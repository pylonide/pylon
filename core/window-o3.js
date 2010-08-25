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
 * @inherits apf.Class
 * @default_private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.window = function(){
    this.$uniqueId = apf.all.push(this);
    this.apf       = apf;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[APF Component : " + (this.name || "") + " (apf.window)]";
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
        //if(apf.isWebkit) return;
        if (self[url])
            apf.importClass(self[url], true, this.win);
        else
            apf.include(url);//, this.document);
    };

    /**** Set Window Events ****/

    /*apf.addListener(window, "beforeunload", function(){
        return apf.dispatchEvent("exit");
    });

    //@todo apf3.x why is this loaded twice
    apf.addListener(window, "unload", function(){
        if (!apf)
            return;
        
        apf.window.isExiting = true;
        apf.window.destroy();
    });*/
    
    apf.document = {};
    this.init = function(strAml){
        //#ifdef __WITH_ACTIONTRACKER
        if (apf.actiontracker) {
            this.$at      = new apf.actiontracker();
            this.$at.name = "default";
            //#ifdef __WITH_NAMESERVER
            apf.nameserver.register("actiontracker", "default", this.$at);
            //#endif
        }
        //#endif

         // #ifdef __DEBUG
        apf.console.info("Start parsing main application");
        // #endif
        // #ifdef __DEBUG
        //apf.Latometer.start();
        // #endif
        
        //Put this in callback in between the two phases
        //#ifdef __WITH_SKIN_AUTOLOAD
        /*XForms and lazy devs support
        if (!nodes.length && !apf.skins.skins["default"] && apf.autoLoadSkin) {
            apf.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            apf.loadAmlInclude(null, doSync, "skins.xml", true);
        }*/
        //#endif 

        this.$domParser = new apf.DOMParser();
        this.document = apf.document = this.$domParser.parseFromString(strAml, 
          "text/xml", {
            timeout   : apf.config.initdelay,
            callback  : function(doc){
                //@todo apf3.0

                //Call the onload event (prevent recursion)
                if (apf.parsed != 2) {
                    //@todo apf3.0 onload is being called too often
                    var inital = apf.parsed;
                    apf.parsed = 2;
                    apf.dispatchEvent("parse", { //@todo apf3.0 document
                        initial : inital
                    });
                    apf.parsed = true;
                }
        
                if (!apf.loaded) {
                    apf.loaded = true;
                    apf.dispatchEvent("load");
                }
        
                //END OF ENTIRE APPLICATION STARTUP
        
                //#ifdef __DEBUG
                //apf.console.info("Initialization finished");
                //#endif
                
                // #ifdef __DEBUG
                //apf.Latometer.end();
                //apf.Latometer.addPoint("Total load time");
                //apf.Latometer.start(true);
                // #endif
          }
        }); //async
    };

    /**
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        apf.unload(this);

        apf           =
        this.win      =
        this.window   =
        this.document = null;
    };
};
apf.window.prototype = new apf.Class().$init();
apf.window = new apf.window();

// #endif
