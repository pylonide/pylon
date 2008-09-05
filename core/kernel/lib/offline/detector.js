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

//Detect if we have network, the detection moments can be manual, auto, error
jpf.offline.detector = {
    //#ifndef __PACKED
    detectUrl : jpf.basePath + "core/kernel/lib/offline/network_check.txt",
    /* #else
    detectUrl : "network_check.txt",
    #endif */
    detection : "manual", //manual|auto|error
    interval  : 5000,
    
    init : function(jml){
        if (jml.nodeType) {
            if (jml.getAttribute("detect-url"))
                this.detectUrl = jml.getAttribute("detect-url");
            
            this.detection = jpf.isTrue(jml.getAttribute("detection")) 
                ? "auto" 
                : jml.getAttribute("detection") || "auto";
            
            if (jml.getAttribute("interval"))
                this.interval = parseInt(jml.getAttribute("interval"));
        }
        
        if ("error|auto".indexOf(this.detection) > -1) {
            jpf.addEventListener("onerror", function(e){
                //Timeout detected.. Network is probably gone
                if (e.state == jpf.TIMEOUT) {
                    //Let's try to go offline and return false to cancel the error
                    return !jpf.offline.goOffline(callback); //@todo callback???
                }
            });
        }
        
        this.oHttp = new jpf.http();
        this.oHttp.timeout = this.interval;
        
        if (this.detection == "auto")
            this.start();
    },

    isSiteAvailable : function(callback){
        this.oHttp.get(jpf.getNoCacheUrl(this.detectUrl), 
            function(data, state, extra){
                if(state != jpf.SUCCESS){
                    jpf.offline.goOffline(callback); //retry here??
                }
                else{
                    jpf.offline.goOnline(callback);
                }
            });
    },

    start : function(){
        clearInterval(this.timer);
        
        var _self = this;
        this.timer = setInterval(function(){
            _self.isSiteAvailable();
        }, this.interval);
    },
    
    stop : function(){
        clearInterval(this.timer);
    }
}

// #endif
