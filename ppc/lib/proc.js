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

// #ifdef __WITH_PROCESSOR
var Fs = require("fs");
/**
 * @parser
 */
ppc.ProcParser = {
    processNodes : [],
    
    parse : function(x){
        ppc.console.info("Start parsing");
        // ppc.Latometer.start();

        if (typeof x == "string")
            x = ppc.getXml(x);

        this.$pml = x;
        
        ppc.isParsing = true;
        
        // #ifdef __DEBUG
        //Check for children in Jml node
        if (!x.childNodes.length)
            throw new Error(ppc.formatErrorString(1014, null,
                "Process parser", 
                "JML Parser got Markup without any children"));
        // #endif
        
        //Loop through Nodes
        this.parseChildren(x);
        
        if (this.processNodes.length) {
            for (var o, i = 0, l = this.processNodes.length; i < l; i++) {
                ppc.console.info("Processing process node " + i);

                o = new ppc.process();
                o.loadPml(this.processNodes[i]);
            }
        }
        //#ifdef __DEBUG
        else {
            ppc.console.error("Missing processnode, won't execute anything");
        }
        //#endif
        
        //Set init flag for subparsers
        this.inited = true;
        
        // #ifdef __DEBUG
        ppc.Latometer.end();
        ppc.Latometer.addPoint("Total load time");
        ppc.Latometer.start(true);
        // #endif
    },
    
    parseChildren : function(x, handler){
        if (!handler)
            handler = this.handler;
        
        var oHandler, tagName, oNode, i, l, o;
        for (i = 0, l = x.childNodes.length; i < l; i++) {
            oNode = x.childNodes[i];
            if (oNode.nodeType != 1)
                continue;

            tagName = oNode.localName;

            if (tagName != "process")
                ppc.console.info("Parsing " + tagName);
            
            if (tagName == "process"){
                this.processNodes.push(oNode);
            }
            else if (oHandler = ppc[tagName]) {
                oHandler.loadPml(oNode);
            }
            else if (handler[tagName]) {
                o = new handler[tagName](oNode);
                if (o.loadPml)
                    o.loadPml(oNode);
            }
            else
                ppc.console.warn("Missing handler for:" + tagName);
        }
    },
    
    handler : {
        "include" : function(q){
            var fd  = o3.fs.get(q.getAttribute("src")),
                xml = ppc.getXml(fd.data);
            ppc.ProcParser.parseChildren(xml);
        },
        
        "script" : function(q){
            if (q.firstChild) {
                var scode = q.firstChild.nodeValue;
                ppc.exec(scode);
            }
        },
        
        "comment" : function (q){
            //do nothing
        }
    }
};

ppc.ProjectBase = function(){
    this.$init(true);
};
(function() {
    this.loadPml = function(x){
        var value, name, l, a, i,
            attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            a = attr[i];
            value = a.nodeValue;
            name  = a.nodeName;            
            this[name] = ppc.settings.parseAttribute(value);
        }
        if (this.$loadPml)
            this.$loadPml(x);
    }
}).call(ppc.ProjectBase.prototype = new ppc.Class());

ppc.process = function() {
    this.$init(true);
};
(function(){
    this.$loadPml = function(x){
        ppc.ProcParser.parseChildren(x, ppc.process.handler);
    };
}).call(ppc.process.prototype = new ppc.ProjectBase());
ppc.process.handler = {};

ppc.settingsCls = function() {
    this.$init();
};
(function() {
    this.NS = "http://ajax.org/2008/project";

    this.parseAttribute = function(value){
        if (!value)
            return;

        var _self = this;
        return value.replace(/\\\{|\{(|.*?[^\\])\}/g, function(m, m1){
            with (_self) {
                try {
                    return eval(m1);
                }
                catch(ex){
                    console.log("error while exec: " + m1);
                    throw ex;
                }
            }
        });
    };
}).call(ppc.settingsCls.prototype = new ppc.ProjectBase());

ppc.settings = new ppc.settingsCls();

ppc.existOrExit = function(){
    for (var file, i = 0, l = arguments.length; i < l; i++) {
        file = arguments[i];
        if (!file.exists) {
            ppc.console.error("File not found: " + file.path);
            exit();
        }
    }
};

ppc.getXmlSafe = function(file){
    return ppc.getXml(file.data.replace(/<\?xml.*$/m,""));
};

ppc.shell_exec = function(command, func, path){
    var result = "", proc;
    var auto = jdshell.CreateComponent("automate");
    if(!(proc = auto.CreateProcess(command, "conredir"))){
        return -1;
    }
    else {
        while (typeof(x = proc.WaitComplete()) == "string") {
            /*x is line output*/
            if (func)
                func(x);
            result += x;
            jdshell.Update();
            jdshell.Sleep(10);
        }
    }

    return result;
};

//#endif
