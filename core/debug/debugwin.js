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

//#ifdef __WITH_DEBUG_WIN

function prettySize(size) {
    if (size < 1024)
        return size + " Bytes";
    else if (size < 1024*1024)
        return Math.round(size/1024) + " KB";
    else if (size < 1024*1024*1024)
        return Math.round(size/(1024*1024)) + " MB";
}

apf.$debugwin = {
    resPath     : "", //@todo
    showtime    : apf.getcookie("apfdebug_console_date") !== "false",
    nativedebug : apf.getcookie("apfdebug_debugger") == "true",
    highlighthover : apf.getcookie("apfdebug_highlight_hover") != "false",
    
    cache : [],
    
    apf  : (function(){
        if (self.parent) {
            var upapf = self.parent.apf;

            apf.xmldb.$xmlDocLut = upapf.xmldb.$xmlDocLut;
            apf.xmldb.$listeners = upapf.xmldb.$listeners;
            
            return upapf;
        }
    })(),
    
    init : function(){
        this.updateLog();
        this.apf.addEventListener("debug", this.debugHandler);
        
        apf.importCssString(".console_date{display:inline}");
        
        txtCode.setValue(apf.getcookie("jsexec") || "");
        codetype.setProperty("value", apf.getcookie("scriptype") || "Javascript");
        txtModel.setValue(apf.getcookie("mdlvalue") || "");
        
        itmShowtime.setAttribute("checked", this.showtime);
        itmDebug.setAttribute("checked", this.nativedebug);
        cbHighlightHover.setAttribute("checked", this.highlighthover);
        
        $apf_ide_mdl.load(this.apf.document.documentElement);//"debugwin.html");//
        
        var _self = this;
        this.$mmouseover = function(e){
            var oHtml = e.htmlEvent.srcElement || e.htmlEvent.target;
            var xmlNode = oHtml.tagName == "DIV" || oHtml.tagName == "SPAN" 
                ? null
                : apf.xmldb.findXmlNode(oHtml);
            
            if (cbHighlightHover.checked)
                _self.apf.$debugwin.highlightAmlNode(xmlNode, !xmlNode);
            e.cancelBubble = true;
        }
        
        this.$mmouseout = function(e){
            self.apf.$debugwin.highlightAmlNode(null, true);
            e.cancelBubble = true;
        }
        
        $apf_ide_mdlProps.exec = function(method, args, callback, options){
            if (method == "getProperty" && args[0]) {
                var xml, tag = args[0];
                if (xml = $apf_ide_mdlProps.queryNode(tag))
                    return callback(xml, apf.SUCCESS);

                if (!options)
                    options = {};
                if (!options.callback)
                    options.callback = function(data, state, extra){
                        if (state != apf.SUCCESS) {
                            $apf_ide_mdlProps.exec(method, ["empty"], callback, options);
                            tag = "empty";
                            return false;
                        }
                        else
                            callback($apf_ide_mdlProps.queryNode(tag), state, extra);
                    }
                this.insert("props/" + tag + ".xml", options);
            }
        };
        
        apf.addEventListener("mousedown", function(){
            errBox.hide();
        });
    },
    
    start : function(){
        window.onerror = this.nativedebug ? null : this.errorHandler;
        
        (apf.$asyncObjects || (apf.$asyncObjects = {}))["$apf_ide_mdlProps"] = 1;
    },
    
    errorHandler : function(message, filename, linenr, isForced){
        if (!message) message = "";

        var e = message 
            ? {
                message : message.indexOf("aml file") > -1
                    ? message
                    : "js file: [line: " + linenr + "] "
                        + apf.removePathContext(apf.hostPath, filename) + "\n" + message
            }
            : null;

        if (!isForced) {
            apf.$debugwin.apf.console.error((apf.$debugwin.apf != apf ? "[Debug Window Error]: " : "") 
              + "Error on line " + linenr + "\n" + message
                .split(/\n\n===\n/)[0].replace(/</g, "&lt;")
                .replace(/\n/g, "\n<br />"));
        }
        
        if (apf.$debugwin.apf == apf) 
            apf.$debugwin.show();

        return true;
    },
    
    updateLog : function(){
        console.clear();
        console.setValue(this.apf.console.getAll(
            btnError.value,
            btnWarn.value,
            btnLog.value
        ))
    },
    
    updateTeleportFilter : function(btn){
        var each = tlist.each.split("|");
        if (btn.value)
            each.push(btn.firstChild.nodeValue.toLowerCase());
        else
            each = each.remove(btn.firstChild.nodeValue.toLowerCase());
        
        tlist.setAttribute("each", each.join("|") || "none");
    },
    
    debugHandler : function(e){
        if ((self["btn" + e.type.uCaseFirst()] || btnLog).value || e.type == "custom")
            console.setValue(e.message);
        
        if (e.type == "error" && tabDebug.activepagenr != 0) {
            errBox.setMessage(";<a href='javascript:void(0)' onclick='tabDebug.set(0);errBox.hide()'>" + e.message + "</a>");
            errBox.show();
        }
    },
    
    showAmlNode : function(node){
        tabDebug.set(1);
        pgBrowse.set(0);
        
        //find in markupeditor, if not there, show in showObject
        mrkAml.expandAndSelect(node);
    },
    
    toggleHighlight : function(debugwin, btn){
        if (document.onmousemove) {
            document.onmousemove = 
            document.onmousedown = null;
            return;
        }
        
        var lastAmlNode;
        document.onmousemove = function(e){
            if (apf.$debugwin.$hdiv)
                apf.$debugwin.$hdiv.style.top = "10000px";
            
            var x = (e || (e = event)).clientX;
            var y = e.clientY;
            var htmlNode = document.elementFromPoint(x, y);

            var amlNode  = apf.findHost(htmlNode);
            if (lastAmlNode != amlNode)
                apf.$debugwin.highlightAmlNode(null, true);
            
            if (lastAmlNode = amlNode)
                apf.$debugwin.highlightAmlNode(amlNode, false, true);
        }
        
        document.onmousedown = function(e){
            var amlNode = lastAmlNode || apf.findHost((e || (e = event)).srcElement || e.target);
            if (amlNode) {
                debugwin.showAmlNode(amlNode);
                apf.$debugwin.highlightAmlNode(null, true);
                btn.setValue(false);
                
                document.onmousemove = 
                document.onmousedown = null;
            }
        }
    },
    
    highlightAmlNode : function(node, remove, border) {
        if (remove) {
            if (this.$hdiv)
                this.$hdiv.style.display = "none";
            return;
        }
        
        if (!node)
            return;
        
        if (!this.$hdiv) {
            apf.importCssString(
                ".apf_highlight_div{\
                    background : #004eff;\
                    position   : absolute;\
                    z-index    : 1000000;\
                    opacity    : 0.3;\
                }\
                .apf_border_div{\
                    background : url(images/spacer.gif);\
                    position   : absolute;\
                    z-index    : 1000000;\
                    border     : 1px solid blue;\
                }");
            
            this.$hdiv = document.body.appendChild(document.createElement("div"));
            this.$hdiv.style.display = "none";
            //apf.setStyleClass(this.$hdiv, "apf_highlight_div");
        }
        
        apf.setStyleClass(this.$hdiv, border 
            ? "apf_border_div" 
            : "apf_highlight_div", ["apf_border_div", "apf_highlight_div"]);
        
        if (false && node.tagName == "html") {
            this.$hdiv.style.left = "0px";
            this.$hdiv.style.top  = "0px";
            this.$hdiv.style.width  = "100%";
            this.$hdiv.style.height = "100%";
            this.$hdiv.style.display = "block";
        }
        else if (node.$ext && (node.$ext.offsetHeight || node.$ext.offsetWidth)) {
            var pos = apf.getAbsolutePosition(node.$ext);
            this.$hdiv.style.left  = pos[0] + "px";
            this.$hdiv.style.top   = pos[1] + "px";
            var diff = apf.getDiff(this.$hdiv);
            this.$hdiv.style.width = (node.$ext.offsetWidth - diff[0]) + "px";
            this.$hdiv.style.height = (node.$ext.offsetHeight - diff[1]) + "px";
            this.$hdiv.style.display = "block";
        }
        else {
            this.$hdiv.style.display = "none";
        }
    },
    
    showObject : function(id, name, obj){
        tabDebug.set(1);
        pgBrowse.set(2);

        txtCurObject.setValue(name);
        trObject.clear("loading");
        
        var _self = this;
        setTimeout(function(){
            if (!id && id !== 0)
                $apf_ide_mdlObject.load(_self.analyze(obj, name, name));
            else
                $apf_ide_mdlObject.load(_self.analyze(_self.apf.$debugwin.cache[id], 
                    "apf.$debugwin.cache[" + id + "]", name));
        }, 10);
    },
    
    types : ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"],
    domtypes : [null, "Element", "Attr", "Text", "CDataSection", 
                "EntityReference", "Entity", "ProcessingInstruction", "Comment", 
                "Document", "DocumentType", "DocumentFragment", "Notation"],
    
    calcName : function(xmlNode, useDisplay){
        var name, loopNode = xmlNode.tagName == "method" ? xmlNode.parentNode : xmlNode, path = [];
        do {
            name = useDisplay 
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name") 
                : loopNode.getAttribute("name");
            
            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
        }
        while (loopNode && loopNode.nodeType == 1);
        
        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },
    
    analyze : function(pNode, ref, displayName){
        var item, prop;

        //if (!pNode) return pNode + "";
        
        if (pNode && !pNode.dataType && pNode.nodeType && "item|method".indexOf(pNode.tagName) > -1) {
            var name, loopNode = pNode.tagName == "method" ? pNode.parentNode : pNode, path = [];
            do {
                name = loopNode.getAttribute("name");
                if (!name) break;
                path.unshift("['" + name.replace(/'/g, "\\'") + "']");
                loopNode = loopNode.parentNode;
            }
            while (loopNode && loopNode.nodeType == 1);
            
            path[0] = path[0].substr(2, path[0].length - 4);
            o = self.parent.eval(path.join(""));
        }
        else {
            o = pNode;
            pNode = null;
        }
            
        if (pNode && pNode.tagName == "method") {
            var xml = apf.getXml("<method />");
            var doc = xml.ownerDocument;
            for (prop in o) {
                if (typeof o[prop] == "function" && prop.charAt(0) != "$") {
                    item = xml.appendChild(doc.createElement("method"));
                    item.setAttribute("name", prop);
                    item.setAttribute("type", "Function");
                    item.setAttribute("value", prop + o[prop].toString().match(/function\s*[\w-]*(\([\s\S]*?\))/)[1]);
                }
            }
            return xml;
        }
    
        if (!pNode) {
            /*var xml = apf.getXml("<obj><item " + (ref ? "name='" + ref + "'" : "") 
                + (displayName ? " display=\"" + displayName.replace(/"/g, "&quot;") + "\"" : "")
                + " expand='true' /></obj>").firstChild;*/
            var xml = apf.getXml("<obj />");
            var n = {};
            n[displayName] = o;
            if (typeof o == "object" || o.dataType == apf.ARRAY)
                n.$isSingleValue = true;
            o = n;
        }
        else {
            var xml = apf.getXml("<item " + (ref ? "name='" + ref + "'" : "") 
                + (displayName ? " display=\"" + displayName.replace(/"/g, "&quot;") + "\"" : "")
                + " expand='true' />");
        }
        var doc = xml.ownerDocument;
        
        //Special case for IE XML elements
        try {prop in o}catch(e){
            //@todo
            return xml;
        }
        
        for (prop in o) {
            obj = o[prop];
            
            if (prop.charAt(0) == "$" || prop.substr(0, 2) == "a_") //@todo this could be a setting
                continue;
            
            if (typeof obj == "function" && (o.dataType != apf.ARRAY || prop != parseInt(prop))) {
                hasMethods = true;
                continue;
            }
            
            item = xml.appendChild(doc.createElement("item"));
            item.setAttribute("name", prop);
            
            if (typeof obj == "undefined" || obj == null) {
                item.setAttribute("value", String(obj));
                item.setAttribute("type", String(obj));
                item.setAttribute("numtype", 0);
                continue;
            }
            
            if (this.types[obj.dataType])
                item.setAttribute("type", this.types[obj.dataType]);
            
            var hasProperties = null;
            try{for (hasProperties in obj) break;}
            catch(e){hasProperties = true;}
            item.setAttribute("numtype", obj.dataType || (hasProperties ? 8 : 0));
        
            var str, hasMethods;
            switch (obj.dataType) {
                case apf.STRING:
                    item.setAttribute("value", '"' + obj
                        .replace(/"/, "\\\"")
                        .replace(/\n/g, "\\\\n")
                        .replace(/\r/g, "\\\\r") + '"');
                break;
                case apf.NUMBER:
                    item.setAttribute("value", obj);
                break;
                case apf.BOOLEAN:
                    item.setAttribute("value", obj ? "true" : "false");
                break;
                case apf.DATE:
                    item.setAttribute("value", "[" + obj.toString() + "]");
                break;
                case apf.FUNCTION:
                    item.setAttribute("value", prop + o[prop].toString().match(/function\s*[\w-]*(\([\s\S]*?\))/)[1]);
                break;
                case apf.ARRAY:
                    item.setAttribute("value", "(" + obj.length + " items)");
                break;
                default:
                    item.setAttribute("value", "{" + (obj.nodeType == 2 
                        ? "@" + obj.nodeName 
                        : (obj.nodeType != 1 && obj.nodeName 
                            ? obj.nodeName + " Node" 
                            : (obj.tagName ? obj.tagName + " Element" : "..."))) + "}");
                    
                    if (obj.nodeType !== undefined && typeof obj.style == "object")
                        item.setAttribute("type", obj.nodeType == 1 
                            ? "HTML" + obj.tagName.toLowerCase().uCaseFirst() + "Element"
                            : "HTML" + this.domtypes[obj.nodeType]);
                    else if (obj.nodeType !== undefined) {
                        var s;
                        if (obj.$regbase & apf.__AMLNODE__) {
                            if (obj.nodeType == 1) {
                                if (obj.namespaceURI == apf.ns.xhtml) {
                                    item.setAttribute("type", "apf.Xhtml" + obj.localName.uCaseFirst() + "Element");
                                    break;
                                }
                                else if (obj.namespaceURI == apf.ns.xsd) {
                                    item.setAttribute("type", "apf.Xsd" + obj.localName.uCaseFirst() + "Element");
                                    break;
                                }
                            }

                            item.setAttribute("type", obj.nodeType == 1 
                                ? "apf." + obj.localName
                                : "apf.Aml" + this.domtypes[obj.nodeType]);
                            break;
                        }
                        
                        item.setAttribute("type", "XML" + this.domtypes[obj.nodeType]);
                    }
                    else {
                        item.setAttribute("type", "Object");
                    } 
                        
                break;
            }
        }
        
        if (!pNode && displayName) {
            xml.firstChild.setAttribute("display", displayName);
            xml.firstChild.setAttribute("expand", "true");
            if (o.$isSingleValue)
                apf.mergeXml(this.analyze(xml.firstChild, name), xml.firstChild);
        }
        
        if (hasMethods) {
            xml.insertBefore(doc.createElement("method"), xml.firstChild)
                .setAttribute("name", "[Methods]");
        }

        return doc.documentElement;
    },
    
    checkChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
            return false;
    },
    
    applyChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        var name = this.calcName(xmlNode);
        try{
            if (name.indexOf(".") > -1) {
                var prop, obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
                if (obj && obj.$supportedProperties && obj.$supportedProperties.contains(prop = RegExp.$1)) {
                    obj.setProperty(prop, self.parent.eval(value));
                    return;
                }
            }
            
            self.parent.eval(name + " = " + value);
            
            //@todo determine new type
        }
        catch(e) {
            trObject.getActionTracker().undo();
            alert("Invalid Action: " + e.message);
            //@todo undo
        }
    },
    
    showXmlNode : function(xml){
        tabDebug.set(1);
        pgBrowse.set(1);
        
        var lut = apf.xmldb.$xmlDocLut;
        var doc = xml.ownerDocument.documentElement;
        var id = xml.getAttribute(apf.xmldb.xmlIdTag);
        if (!id) debugger;
        var docId = id.split("\|")[0];
        
        if (!lut[docId]) {
            lut[docId] = doc;
        }
        else if (lut[docId] != doc) {
            var model1 = this.apf.nameserver.get("model", docId);
            lut[docId] = doc;

            var model2 = apf.nameserver.get("model", docId);
            apf.xmldb.getXmlDocId(doc, model2);
            
            if (model1)
                apf.nameserver.register("model", docId, model1);
        }
        
        mrkData.load(xml);
    },
    
    jRunCode : function(code, scripttype,  model){
        apf.setcookie("jsexec", code);
        apf.setcookie("scriptype", scripttype);
        apf.setcookie("mdlvalue", model);
        var islm = scripttype == 'Live Markup';

        this.apf.console.write("<span style='color:blue'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 30px'>"
            + code.replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;").replace(/</g, "&lt;").replace(/\n/g, "\n<br />") + "</div></span>", "custom", null, null, null, true);

        var _self = this;
        var doIt  = function(data){
            if (islm) {
                var func = apf.lm.compile(code, {parsecode : true});
                if (model) {
                    if (data = apf.$debugwin.apf.nameserver.get("model", model))
                        data = data.data;
                    if (!data) {
                        var data = apf.getData(model, {
                            callback : function(data, state, extra){
                                if (state == apf.SUCCESS) {
                                    doIt(data);
                                }
                                else {
                                    throw new Error();
                                }
                            }
                        })
                        return;
                    }
                }
                var x = func(data);
            }
            else {
                var x = self.parent.eval(code);
            }

            if (x === null)
                x = "null";
            else if (x === undefined)
                x = "undefined";

            try {
                var str;
                if (x.nodeType && (x.nodeType == 1 || x.nodeType == 7)) {
                    if (x.serialize) //aml
                        str = "<a class='xmlhl' href='javascript:void(0)' onmouseout='if (cbHighlightHover.checked) apf.$debugwin.apf.$debugwin.highlightAmlNode(null, true)' onmouseover='apf.$debugwin.apf.$debugwin.highlightAmlNode(apf.$debugwin.apf.all[" 
                            + x.$uniqueId + "])' onclick='apf.$debugwin.showAmlNode(self.parent.apf.$debugwin.apf.all[" 
                            + x.$uniqueId + "])'>" + apf.highlightXml(x.serialize().split(">")[0] + ">").replace(/<\/?a(?:>| [^>]*>)/g, "")  + "</a>";
                    else if (x.style) //html
                        str = x.outerHTML.replace(/</g, "&lt;").replace(/\n/g, "\n<br />")
                    else
                        str = "<a class='xmlhl' href='javascript:void(0)' onclick='apf.$debugwin.showXmlNode(apf.$debugwin.cache[" 
                            + (apf.$debugwin.cache.push(x) - 1) + "])'>" 
                            + apf.highlightXml(apf.getCleanCopy(x).xml.split(">")[0] + ">") + "</a>";

                    _self.apf.console.write(str, "custom", null, null, null, true);
                }
                else if (typeof x == "object") {
                    if (x.dataType == apf.ARRAY) {
                        var out = ["Array { length: " + x.length];
                    }
                    else {
                        var out = [x.toString(), "{"];
                        for (prop in x) {
                            if (out.length == 5) {
                                out.push("more...");
                                break;
                            }
                            if (typeof x[prop] != "function" && typeof x[prop] != "object" && x[prop] && prop.substr(0,1) != "$")
                                out.push(prop + "=" + x[prop] + ", ");
                        }
                    }

                    _self.apf.console.write("<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='apf.$debugwin.showObject(" 
                            + (_self.apf.$debugwin.cache.push(x) - 1) + ", \"" + code.split(";").pop() + "\")'>" 
                            + out.join(" ") + " }</a>", "custom", null, null, null, true);
                }
                else {
                    str = x.toString();
                
                    _self.apf.console.write(str
                        .replace(/</g, "&lt;")
                        .replace(/\n/g, "\n<br />"), "custom", null, null, null, true);
                }
            }catch(e){
                _self.apf.console.write(x
                    ? "Could not serialize object: " + e.message
                    : x, "error", null, null, null, true);
            }
        }

        if (apf.$debugwin.nativedebug)
            doIt();
        else {
            try{
                doIt();
            }
            catch(e) {
                this.apf.console.write(e.message, "error", null, null, null, true);
            }
        }
    },

    consoleTextHandler: function(e) {
        if (e.keyCode == 9 && e.currentTarget == txtCode) {
            txtCode.focus();
            e.cancelBubble = true;
            return false;
        }
        else if(e.keyCode == 13 && e.ctrlKey) {
            apf.$debugwin.jRunCode(txtCode.value, codetype.value, txtModel.value);
            return false;
        }
    },
    
    setShowTime : function(c){
        apf.setcookie("apfdebug_console_date", c);
        apf.setStyleRule('.console_date', 'display', c ? 'inline' : 'none');
        this.showtime = c;
    },
    
    setNativeDebug : function(c){
        apf.setcookie("apfdebug_debugger", c);
        this.nativedebug = c;
        window.onerror = this.nativedebug ? null : this.errorHandler;
    },
    
    setHighlightHover : function(c){
        apf.setcookie("apfdebug_highlight_hover", c);
        this.highlighthover = c;
    },
    
    first : true,
    show : function(){
        if (apf.loadScreen)
            apf.loadScreen.hide();
        
        //Initialize css for showing debugwindow
        if (this.first) {
            if (apf.isIE) {
                apf.setStyleRule("BODY", "overflow", "", 0);
    
                p = apf.getBox(apf.getStyle(document.body, "padding"));
                m = apf.getBox(apf.getStyle(document.body, "margin"));
                o = [apf.getStyle(document.documentElement, "overflow"),
                         apf.getStyle(document.documentElement, "overflowX"),
                         apf.getStyle(document.documentElement, "overflowY")];
            }
            else {
                p = [parseInt(apf.getStyle(document.body, "padding-top")),
                     parseInt(apf.getStyle(document.body, "padding-right")),
                     parseInt(apf.getStyle(document.body, "padding-bottom")),
                     parseInt(apf.getStyle(document.body, "padding-left"))];
                m = [parseInt(apf.getStyle(document.body, "margin-top")),
                     parseInt(apf.getStyle(document.body, "margin-right")),
                     parseInt(apf.getStyle(document.body, "margin-bottom")),
                     parseInt(apf.getStyle(document.body, "margin-left"))];
                o = [apf.getStyleRule("html", "overflow") || "auto",
                         apf.getStyleRule("html", "overflow-x") || "auto",
                         apf.getStyleRule("html", "overflow-y") || "auto"];
            }
    
            // #ifndef __PACKAGED
            this.resPath = (apf.config.resourcePath || apf.basePath) + "core/debug/resources/";
            /* #else
            this.resPath = (apf.config.resourcePath || apf.basePath) + "resources/";
            #endif */
            /* #ifdef __WITH_CDN
            this.resPath = apf.CDN + apf.VERSION + "/resources/";
            #endif */

            apf.importCssString("\
                html{\
                    height : 100%;\
                    overflow : hidden;\
                    overflow-x : hidden;\
                    overflow-y : hidden;\
                    margin-bottom : " + (p[0] + m[0] + p[2] + m[2]) + "px;\
                }\
                body{\
                    position : absolute;\
                    left : 0;\
                    top : 0;\
                    right : 0;\
                    bottom : 300px;\
                    margin:0;\
                    overflow  : " + o[0] + ";\
                    overflow-x : " + o[1] + ";\
                    overflow-y : " + o[2] + ";\
                    padding : " + (p[0] + m[0]) + "px " +
                                  (p[1] + m[1]) + "px " +
                                  (p[2] + m[2]) + "px " +
                                  (p[3] + m[3]) + "px;\
                    width : auto;\
                }\
                #apf_debugwin {\
                    position: fixed;\
                    bottom: 0px;\
                    text-align: left;\
                    height: 300px;\
                    background: #fff url(" + this.resPath + "splitter_handle_vertical.gif) no-repeat 1px 50%;\
                    width : 100%;\
                    left: 0px;\
                    z-index: 100000000;\
                }\
            ");
            this.first = false;
            
            //src='debugwin.html' 
            document.body.insertAdjacentHTML("beforeend", "<div id='apf_debugwin'><iframe frameborder='0' width='100%' height='100%' /></div>");
            this.$iframe = (this.$ext = document.getElementById("apf_debugwin")).firstChild;

            apf.getWindowWidth = function(){
                return document.body.offsetWidth;
            }
            apf.getWindowHeight = function(){
                return document.body.offsetHeight;
            }
            
            setTimeout(function(){
                apf.$debugwin.$iframe.src = apf.basePath + "test/debugwin.html";
            });
        };

        this.$ext.style.display = "block";
        document.body.style.bottom = "300px";
    },
    
    hide : function(){
        this.$ext.style.display = "none";
        document.body.style.bottom = "0";
        
        /*if (apf.isIE8) {
            document.body.style.overflow = "";
            document.body.style.position = "";
        }*/
    },
    
    activate : function(){
        //Show me
        this.show();
    }
}

// #endif
