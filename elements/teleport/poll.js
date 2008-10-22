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

// #ifdef __TP_POLL
// #define __WITH_TELEPORT 1

jpf.poll = function(server){
    this.uniqueId = jpf.all.push(this) - 1;
    
    //Options
    this.server         = "";
    this.connectRetries = 4;
    this.lastTime       = "";
    this.mplexmode      = 0;
    this.mplexdata      = "";
    this.interval       = 10;
    
    this.TelePortModule = true;
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.start = function(interval){
        clearInterval(this.timer);
        
        if (interval) 
            this.interval = interval;
        this.timer = setTimeout('jpf.lookup(' + this.uniqueId + ').poll()',
            this.interval * 1000);
        
        this.isPolling = true;
    }
    
    this.stop = function(){
        clearInterval(this.timer);
        this.isPolling = false;
    }
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    // NOT NEEDED
    /*this.doubleCheckPoll = function(){
     if(this.isPolling && (this.lastPoll - new Date().getTime()) > this.interval * 1000) this.poll();
     }
     setInterval('jpf.lookup(' + this.uniqueId + ').doubleCheckPoll()', 10000);
     */
    /* ***********************
     RECEIVE
     ************************/
    this.rfunc = new Function('data', 'status', 'extra', 'jpf.lookup(' + this.uniqueId + ').receive(data, status, extra)');
    
    this.poll  = function(){
        this.lastPoll = new Date().getTime();
        
        if (this.connect == 0) 
            HTTP.getXml(this.url + "&time=" + this.lastTime, this.rfunc,
                true, null, true);
        else 
            if (this.connect == 1) 
                this.oRPC[this.oMethod]();
    }
    
    this.isPotentialDisconnect = 0;
    this.isInited = false;
    this.receive = function(xmlData, status, extra){
        var id;
        
        if (extra.http.status == 200 && extra.http.responseText.replace(/\n/g, "") == '') 
            return this.start();
        
        if (status != jpf.SUCCESS) {
            if (extra.retries < this.connectRetries) 
                return HTTP.retry(extra.id);
            else 
                if (this.doConnectError(extra.http)) 
                    this.start();
            
            return;
        }
        
        // Check for custom errors
        if (this.onerrorcheck) 
            this.onerrorcheck(xmlData, status, extra);
        
        // #ifdef __DEBUG
        jpf.console.info("<strong>Polling received " + (xmlData.xml
            ? xmlData.xml
            : xmlData).replace(/</g, "&lt;") + "</strong>");
        // #endif
        
        // Multiplexing modes
        if (this.mplexmode == 0) 
            id = 0;
        else 
            if (this.mplexmode == 1) 
                id = xmlData.getAttribute(this.mplexdata);
            else 
                if (this.mplexmode == 2) 
                    id = self[this.mplexdata]();
        
        // Call Method
        var success = this.process[id](xmlData);
        
        success ? this.poll() : this.start();
    }
    
    this.doConnectError = function(http, force){
        setStatus("message didn't arrive (" + chatlist.isPotentialDisconnect + ") ");
        this.stop();
    }
    
    this.process    = [];
    this.addProcess = function(func, id){
        if (!id) 
            id = this.process.length;
        this.process[id] = func;
    }
    
    this.load = function(x){
        this.mplexmode = x.getAttribute("mplexmode");
        this.interval = x.getAttribute("interval");
        
        if (this.mplexmode == 1) 
            this.mplexdata = x.getAttribute("xml-attr");
        if (this.mplexmode == 2) 
            this.mplexdata = x.getAttribute("method");
        
        if (x.getAttribute("url")) {
            this.connect = 0;
            this.oURL = x.getAttribute("url");
        }
        else 
            if (x.getAttribute("rpc")) {
                this.connect = 1;
                this.oRPC = self[this.connect[0]];
                this.oMethod = this.connect[1];
                this.oRPC.setCallback(this.oMethod, this.rfunc);
            }
        
        return this;
    }
}
// #endif
