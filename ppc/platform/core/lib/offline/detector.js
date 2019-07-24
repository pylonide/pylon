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

// #ifdef __WITH_OFFLINE_DETECTOR

/**
 * Object detecting if the application has network, the detection moments can
 * be manual, automatic or only when a communication error occurs. In most
 * cases the functionality of this object will be managed from within the
 * offline element in AML.
 * Example:
 * <code>
 *  <a:offline
 *      detect-url  = "netork.txt"
 *      detection   = "auto"
 *      interval    = "2000" />
 * </code>
 *
 * @define offline
 * @attribute {String} [detect-url] a datainstruction for getting a version number of the current application
 * @attribute {String} [detection]  a pipe seperated list of possible providers.
 *   Possible values:
 *   auto   Automatically detect whether the network is available by retrieving the file specified in the detect-url attribute
 *   manual Disable automatic or error based detection
 *   error  Only detect network state when a communication timeout occurs.
 * @attribute {Boolean} [interval]  whether the required plugin is installed when it's not installed yet.
 *
 * @default_private
 */
apf.offline.detector = {
    //#ifndef __PACKED
    detectUrl : apf.basePath + "core/lib/offline/network_check.txt",
    /* #else
    detectUrl : "network_check.txt",
    #endif */
    detection : "auto", //manual|auto|error
    interval  : 5000,

    init : function(aml){
        if (aml.nodeType) {
            if (aml.getAttribute("detect-url"))
                this.detectUrl = aml.getAttribute("detect-url");
            /* #ifdef __PACKAGED
            else
                this.detectUrl = (apf.config.resourcePath || apf.basePath)
                    + "resources/network_check.txt";
            #endif */

            this.detection = apf.isTrue(aml.getAttribute("detection"))
                ? "auto"
                : aml.getAttribute("detection") || "auto";

            if (aml.getAttribute("interval"))
                this.interval = parseInt(aml.getAttribute("interval"));
        }

        if ("error|auto".indexOf(this.detection) > -1) {
            apf.addEventListener("error", function(e){
                //Timeout detected.. Network is probably gone
                if (e.state == apf.TIMEOUT) {
                    //Let's try to go offline and return false to cancel the error
                    return !apf.offline.goOffline();//callback //@todo callback???
                }
            });
        }

        this.oHttp = new apf.http();
        this.oHttp.timeout = this.interval;

        //Check if we have connection right now
        this.isSiteAvailable();

        if (this.detection == "auto")
            this.start();
    },

    isSiteAvailable : function(callback){
        this.oHttp.get(apf.getNoCacheUrl(this.detectUrl), {
            callback: function(data, state, extra){
                if(state != apf.SUCCESS || !window.navigator.onLine){
                    apf.offline.goOffline(callback); //retry here??
                }
                else{
                    apf.offline.goOnline(callback);
                }
            },
            ignoreOffline  : true,
            hideLogMessage : true
        });
    },

    /**
     * Start automatic network availability detection
     */
    start : function(){
        clearInterval(this.timer);

        //#ifdef __DEBUG
        apf.console.info("Automatic detection of network state is activated");
        //#endif

        var _self = this;
        this.timer = setInterval(function(){
            _self.isSiteAvailable();
        }, this.interval);
    },

    /**
     * Stop automatic network availability detection
     */
    stop : function(){
        clearInterval(this.timer);

        //#ifdef __DEBUG
        apf.console.info("Detection of network state is deactivated");
        //#endif
    }
};

// #endif
