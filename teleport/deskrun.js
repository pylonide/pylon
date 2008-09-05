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

// #ifdef 0
// #define __WITH_TELEPORT 1

//var TESTING = false;
JRS = {
    queue  : [],
    
    getXml : function(url, receive, async, userdata, nocache){
        return this.get(url, receive, async, userdata, true, nocache);
    },
    
    getString : function(url, receive, async, userdata, nocache){
        return this.get(url, receive, async, userdata, false, nocache);
    },
    
    get : function(url, receive, async, userdata, isXML, nocache, headers){
        if (!this.oDeploy)
            this.oDeploy = JDeployAX;
        
        var http = document.all
            ? new ActiveXObject("microsoft.XMLHTTP")
            : new XMLHttpRequest();

        var id = this.queue.push([http, receive, null, new Date(), userdata, isXML]) - 1;
        this.queue[id][2] = new Function("var id=\"" + id + "\"\
            var dt = new Date(new Date().getTime() - HTTP.queue[id][3].getTime());\
            diff = parseInt(dt.getSeconds() * 1000 + dt.getMilliseconds());\
            if (diff > HTTP.timeout) {\
                if (HTTP.ontimeout) HTTP.ontimeout();\
                clearInterval(HTTP.queue[id][6]);\
                HTTP.cancel(id);\
                return;\
            };\
            if (HTTP.queue[id][0].readyState == 4) {\
                HTTP.queue[id][0].onreadystatechange = function(){};\
                HTTP.receive(id);\
            }");
        this.queue[id][6] = setInterval('HTTP.queue[' + id + '][2]()', 20);
        
        //Setting HTTP Request Headers
        http.open("GET", url + (nocache
            ? (url.match(/\?/) ? "&" : "?") + Math.random()
            : ""), async);
        http.setRequestHeader("Content-type", "text/xml");
        
        if (headers) {
            for (var i = 0; i < headers.length; i++) {
                //if(self.DEBUG) alert(headers[i]);
                //if(headers[i][1] == "login") alert("login");
                //if(TESTING) alert(headers[i]);
            if (headers[i][0] && headers[i][1])
                http.setRequestHeader(headers[i][0], headers[i][1]);
            }
        }

        //Sending
        http.send("");
        
        if (!async)
            return this.receive(id);
    },
    
    receive : function(id){
        clearInterval(this.queue[id][6]);
        
        var http = this.queue[id][0];
        // Test if HTTP object is ready
        try {
            if (http.status) {}
        }
        catch (e) {
            return setTimeout('HTTP.receive(' + id + ')', 10);
        }

        if (http.status != 200 && http.status != 0) {
            if (self.DEBUG == 2) {
                alert("RECEIVING:\n\n" + http.responseText);
                throw new Error("HTTP Error " + http.status);
            }
            else if(HTTP.onerror)
                HTTP.onerror(http);
        }

        if (this.queue[id][5]) {
            try {
                if (http.responseXML)
                    jpf.xmlParseError(http.responseXML);
            }
            catch(e) {
                if(HTTP.onerror)
                    HTTP.onerror(http, e);
            }
            var xmlNode = (http.responseXML && http.responseXML.documentElement)
                ? http.responseXML.documentElement
                : jpf.getXmlDom(http.responseText).documentElement;
        }
        
        if (this.queue[id][1])
            this.queue[id][1](this.queue[id][5]
                ? xmlNode
                : http.responseText, this.queue[id][4], http);
        this.queue[id] = null;
        
        return xmlNode;
    },
    
    load : function(x){
        var o = new HTTPSource(jpf.parseExpression(x.getAttribute("url")));

        var q = x.childNodes;
        for (var i = 0; i < q.length; i++) {
            if (q[i].nodeType != 1)
                continue;
            
            //Add Method
            o.addMethod(
                q[i].getAttribute("name"), 
                q[i].getAttribute("receive") || x.getAttribute("receive"), 
                q[i], 
                (q[i].getAttribute("async") == "false" ? false : true), 
                q[i].getAttribute("export"), 
                q[i].getAttribute("type") == "global", 
                q[i].getAttribute("variable"), 
                q[i].getAttribute("lookup")
            );
        }
        
        return o;
    },
    
    callHTTPFromNode : function(xmlHTTPNode, xmlNode, receive){
        var q      = xmlHTTPNode.getAttribute("http").split(";");
        var obj    = self[q[0]];
        var method = q[1];
        var arg    = xmlHTTPNode.getAttribute("variables").split(";");
        
        //Set Arguments from xmlNode via xpath statements if needed
        for(var i = 0; i < arg.length; i++) {
            if (arg[i].match(/^xpath\:(.*)$/)) {
                var o  = xmlNode.selectSingleNode(RegExp.$1);
                arg[i] = o ? o.nodeValue : "";
            }
            /*else if(arg[i].match(/^expr\:(.*)$/)){
                arg[i] = eval(RegExp.$1);
            }*/
        }

        if (obj[method].async)
            obj.receive[method] = receive;
        var data = obj.call(method, obj.__convertArgs(arg, obj.names[method]));
        if (data && !obj[method].async)
            return receive(data);
    }
}

Init.run('JRS');

function HTTPSource(servername, vartype){
    this.uniqueId = jpf.all.push(this) - 1;
    
    this.vartype   = vartype || "cgi";
    this.url       = servername;
    this.server    = servername.replace(/^(.*\/\/[^\/]*)\/.*$/, "$1") + "/";
    this.onerror   = null;
    this.ontimeout = null;
    this.receive   = {};
    
    this.names     = new Array();
    this.setName   = function(name, names){
        /*this.names[name] = [];
        var s = names.split(",");
        for(var i=0;i<s.length;i++) this.names[name].push(s[i]);*/
        this.names[name] = names;
    }
    
    this.__convertArgs = function(a, names, no_globals){
        var args = [];

        var nodes = names.selectNodes("variable");
        for (var j = 0,i = 0; i < nodes.length; i++) {
            var value = nodes[i].getAttribute("value")
                || a[j++] || nodes[i].getAttribute("default");
            args.push([nodes[i].getAttribute("name"),
                nodes[i].getAttribute("encoded") == "true" ? encodeURIComponent(value) : value]);
        }
        if (!no_globals)
            for(var i = 0; i < this.globals.length; i++)
                args.push([this.globals[i][0], this.globals[i][1]]);

        return args;
    }
    
    this.add = 
    this.addMethod = function(name, receive, names, async, vexport, is_global, global_name, global_lookup){
        if (is_global)
            this.receive[name] = new Function('data', 'userdata', 'http',
              'jpf.lookup(' + this.uniqueId + ').setGlobalVar("' + global_name
                  + '"' + ', data, http, "' + global_lookup + '", "'
                  + receive + '")');
        else if (receive)
            this.receive[name] = receive;
        
        this.setName(name, names);
        if (vexport)
            this.vexport = vexport;
        this[name] = new Function('return this.call("' + name + '"' 
            + ', this.__convertArgs(arguments, this.names["' + name + '"], ' 
            + (this.vartype != "cgi" && this.vexport == "cgi") + '));');
        this[name].async = async;
        
        return true;
    }
    
    this.globals      = new Array();
    this.setGlobalVar = function(name, data, http, lookup, receive){
        if (this.vartype == "header" && lookup)
            data = http.getResponseHeader(lookup);
        for(var found = false, i = 0; i < this.globals.length; i++) {
            if (this.globals[i][0] == name) {
                this.globals[i][1] = data;
                found = true;
            }
        }
        if (!found)
            this.globals.push([name, data]);
        
        if (receive)
            self[receive](data, http);
    }
    
    this.call = function(name, args){
        // #ifdef __DEBUG
        if (!this[name]) {
            throw new Error(jpf.formatErrorString(1078, null, "Calling RPC method", "Method is not declared: '" + name + "'"));
        }
        // #endif
        
        var receive = typeof this.receive[name] == "string"
            ? eval(this.receive[name])
            : this.receive[name];

        var URL = this.url;
        if (this.vartype == "cgi" || this.vexport == "cgi") {
            var cgiargs = this.vartype == "cgi" ? args : this.globals;
            
            for(i = 0; i < cgiargs.length; i++)
                URL += (i==0 ? "?" : "&") + cgiargs[i][0] + "=" + cgiargs[i][1];
        }

        var info = HTTP.get(URL, receive, this[name].async, this[name].userdata,
            false, true, this.vartype == "header" ? args : null);

        return info;
    }
}

// #endif
