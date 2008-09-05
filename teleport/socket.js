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

// #ifdef __TP_SOCKET
// #define __WITH_TELEPORT 1

//Depends on implementation of Javeline HTTP Socket on Server Side
/**
 * @constructor
 */
jpf.socket = function(){
    this.uniqueId = jpf.all.push(this) - 1;
    this.server   = null;
    this.timeout  = 10000;
    
    this.TelePortModule = true;
    
    /* ************************************************************
     Receiving - Permanent Connection (HTTP-PUSH)
     *************************************************************/
    this.init = function(){
        this.iframe = document.createElement("IFRAME");
        document.body.appendChild(this.iframe);
        this.iframe.style.position = "absolute";
        
        //if(!jpf.isIE) jpf.importClass(MozillaCompat, true, this.iframe.contentWindow);
        
        /*if(self.jpf.debug){
         this.iframe.style.left = "0px";
         this.iframe.style.top = "0px";
         this.iframe.style.zIndex = 100;
         }
         else */
        this.iframe.style.display = "none";
        this.timer = setInterval("var o = jpf.lookup(" + this.uniqueId
            + ");if(o.iframe.contentWindow.document.readyState == 'complete') o.reconnect()",
            1000);
        
        this.inited = true;
    }
    
    this.socketConnect = function(vars){
        if (!this.inited) 
            this.init();
        
        if (!vars) 
            vars = [["date", new Date().getTime()]];
        else 
            vars.push(["date", new Date().getTime()]);
        
        for (var str = "", i = 0; i < vars.length; i++) 
            vars[i] = vars[i][0] + "=" + escape(vars[i][1])
        
        this.iframe.src = this.server + "?connection_id="
            + this.uniqueId + "&" + vars.join("&");
        return this;
    }
    
    this.reconnect = function(){
        this.iframe.contentWindow.location.reload();
    }
    
    this.socketDisconnect = function(){
        clearInterval(this.timer);
        this.iframe.src = "blank.html";
        this.iframe.src = "blank.html";
    }
    
    this.setConnectionId = function(listenId){
        this.connectionId = listenId;
    }
    
    this.receive = function(module, strdata){
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>HTTP Socket RCV: [" + module + "] - " + strdata.replace(/</g, "&lt;") + "</strong><hr />", "teleport");
        // #endif
        
        if (module == "LISTENER_ID") 
            this.listenerId = strdata;
        else {
            var o = eval(strdata.replace(/\]-\]-\]/g, "]]")
                .replace(/\|\|\|/g, "\\n"));
            //if(this.onreceive) this.onreceive(module, o);
            if (this.onreceive) 
                self[this.onreceive](module, o);
        }
    }
    
    /* ************************************************************
     Forward Communication (RPC)
     *************************************************************/
    this.send = function(module, data){
        // #ifdef __DEBUG
        jpf.debugMsg("<strong>HTTP Socket SND: [" + module + "] - " + data.toString().replace(/</g, "&lt;") + "</strong><hr />", "teleport");
        // #endif
        
        this.forward.send(this.connectionId, module, data);
    }
    
    this.purge = function(){
        this.forward.purge();
    }
    
    this.load = function(x){
        this.server = jpf.parseExpression(x.getAttribute("url"));
        
        var fName = x.getAttribute("f-type") || "JPHP";
        
        this.forward = new self[fName]();
        this.forward.addMethod("send", null, null, true)
        
        this.forward.timeout = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.forward.url = this.server;
        this.forward.server = this.server.replace(/^(.*\/\/[^\/]*)\/.*$/, "$1") + "/";
        if (x.getAttribute("var-type")) 
            this.forward.vartype = x.getAttribute("var-type");
        this.forward.multicall = x.getAttribute("multicall") == "true";
        
        if (x.getAttribute("mode") != "manual") 
            this.socketConnect();
        if (x.getAttribute("receive")) 
            this.onreceive = x.getAttribute("receive");
    }
}

// #endif
