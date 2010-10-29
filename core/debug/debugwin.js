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
        return Math.round(size/102.4)/10 + " KB";
    else if (size < 1024*1024*1024)
        return Math.round(size/(1024*102.4))/10 + " MB";
}

apf.$debugwin = {
    showtime    : true,
    nativedebug : apf.debug ? true : false,
    highlighthover : true,
    selecteditable : true,
    
    cache : (function(){
        apf.isDebugWindow = self.frameElement 
            && self.frameElement.isDebugWin > -1;

        return apf.isDebugWindow ? self.parent.apf.$debugwin.cache : [];
    })(),
    
    apf  : (function(){
        if (apf.isDebugWindow) {//assuming we are the debug window
            var upapf = self.parent.apf;

            apf.xmldb.$xmlDocLut = upapf.xmldb.$xmlDocLut;
            apf.xmldb.$listeners = upapf.xmldb.$listeners;
            apf.xmldb.$nodeCount = upapf.xmldb.$nodeCount;
            
            (apf.$asyncObjects || (apf.$asyncObjects = {}))["$apf_ide_mdlProps"] = 1;
            
            return upapf;
        }
        
        return apf;
    })(),
    
    init : function(){
        this.updateLog();
        this.apf.addEventListener("debug", this.debugHandler);
        
        apf.importCssString(".console_date{display:inline}");
        
        //#ifdef __WITH_STORAGE
        apf.storage.init();

        this.showtime       = apf.storage.get("apfdebug_console_date") !== false;
        this.nativedebug    = apf.storage.get("apfdebug_debugger") == true;
        this.highlighthover = apf.storage.get("apfdebug_highlight_hover") !== false;
        this.selecteditable = apf.storage.get("apfdebug_select_editable") !== false;
        
        txtCode.setValue(apf.storage.get("jsexec") || "");
        codetype.setProperty("value", apf.storage.get("scriptype") || "Javascript");
        txtModel.setValue(apf.storage.get("mdlvalue") || "");
        
        this.setNativeDebug(this.nativedebug);
        //#endif
        
        itmShowtime.setAttribute("checked", this.showtime);
        itmDebug.setAttribute("checked", this.nativedebug);
        cbHighlightHover.setAttribute("checked", this.highlighthover);
        cbSelectEditable.setAttribute("checked", this.selecteditable);
        
        $apf_ide_mdl.load(this.apf.document.documentElement);//"debugwin.html");//

        var _self = this, excl = {"DIV":1,"BLOCKQUOTE":1,"SPAN":1,"I":1};
        this.$mmouseover = function(e){
            if (!cbHighlightHover.checked || mnuData.visible)
                return;
            
            var oHtml = e.htmlEvent.srcElement || e.htmlEvent.target;
            var xmlNode = excl[oHtml.tagName] 
                ? null
                : apf.xmldb.findXmlNode(oHtml);
            
            _self.apf.$debugwin.highlightAmlNode(xmlNode, !xmlNode);
            //e.cancelBubble = true;
        }
        
        this.$mmouseout = function(e){
            _self.apf.$debugwin.highlightAmlNode(null, true);
            //(e || event).cancelBubble = true;
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
        
        tabDebug.$ext.onmousemove = function(e){
            if (!e) e = event;
            document.body.style.cursor = e.clientY < 5 ? "s-resize" : "";
        }
        
        tabDebug.$ext.onmousedown = function(e){
            if (!e) e = event;
            if (e.clientY < 5)
                apf.$debugwin.apf.$debugwin.$startResize(e.clientY, apf);
        }
        
        //@todo dirty hack! need to fix layout engine
        browse.addEventListener("afterrender", function(){
            trTools.hide();
        });
        
        mnuData.onitemclick = function(e){
            if (this.$lastObj) {
                switch(e.value){
                    case "doc":
                        apf.$debugwin.showDocs(this.$lastObj);
                        break;
                    case "remove":
                        mrkAml.remove(this.$lastObj);
                        break;
                    case "aml":
                        apf.$debugwin.showAmlNode(this.$lastObj);
                        break;
                    case "data":
                        apf.$debugwin.showXmlNode(this.$lastObj);
                        break;
                    case "obj":
                        apf.$debugwin.showObject(this.$lastObj);
                        break;
                    case "model-data":
                        apf.$debugwin.showXmlNode(this.$lastObj.data);
                        break;
                    case "root-data":
                        apf.$debugwin.showXmlNode(this.$lastObj.xmlRoot);
                        break;
                    case "sel-data":
                        apf.$debugwin.showXmlNode(this.$lastObj.selected);
                        break;
                }
                return;
            };
            
            switch(e.value){
                case "doc":
                    eval(mnuData.$lastCl.replace(/showObject|showXmlNode|showAmlNode/, "showDocs"));
                    break;
                case "remove":
                    eval(mnuData.$lastCl.replace(/showObject|showXmlNode|showAmlNode/, "$removeNode"));
                    break;
                case "aml":
                    eval(mnuData.$lastCl.replace(/showObject|showXmlNode|showAmlNode/, "showAmlNode"));
                    break;
                case "data":
                    eval(mnuData.$lastCl.replace(/showObject|showXmlNode|showAmlNode/, "showXmlNode"));
                    break;
                case "obj":
                    eval(mnuData.$lastCl.replace(/showObject|showXmlNode|showAmlNode/, "showObject"));    
                    break;
                case "model-data":
                    var hasData = eval(mnuData.$lastCl.replace(/showAmlNode/, "$hasAmlData"));
                    apf.$debugwin.showXmlNode(hasData[3]);
                    break;
                case "root-data":
                    var hasData = eval(mnuData.$lastCl.replace(/showAmlNode/, "$hasAmlData"));
                    apf.$debugwin.showXmlNode(hasData[0]);
                    break;
                case "sel-data":
                    var hasData = eval(mnuData.$lastCl.replace(/showAmlNode/, "$hasAmlData"));
                    apf.$debugwin.showXmlNode(hasData[1]);
                    break;
            }
        }
    },
    
    start : function(){
        if (!apf.isDebugWindow)
            window.onerror = this.nativedebug ? null : this.errorHandler;
    },
    
    errorHandler : function(message, filename, linenr, isForced){
        if (!message) message = "";

        if (!isForced) {
            apf.$debugwin.apf.console.error(
              (apf.$debugwin.apf != apf ? "[Debug Window Error]: " : "") 
                + "Error on line " + linenr + " of " 
                + apf.removePathContext(apf.hostPath, filename) + "\n" + message);
                //.replace(/</g, "&lt;")
                //.replace(/\n/g, "\n<br />")
        }
        
        if (apf.$debugwin.apf == apf) 
            apf.$debugwin.show();

        return true;
    },
    
    updateLog : function(){
        apf_console.clear();
        apf_console.setValue(this.apf.console.getAll(
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
            apf_console.setValue(e.message);
        
        if (e.type == "error" && tabDebug.activepagenr != 0) {
            errBox.setMessage(";<a href='javascript:void(0)' onclick='tabDebug.set(0);errBox.hide()'>" + e.message + "</a>");
            errBox.show();
        }
    },
    
    showDocs : function(node) {
        tabDebug.set("docs");
        //debugger;
        //node.$regbase
    },
    
    showAmlNode : function(node){
        tabDebug.set(1);
        pgBrowse.set(0);
        
        if (!mrkAml.xmlRoot) {
            mrkAml.addEventListener("afterload", function(){
                apf.$debugwin.showAmlNode(node);
                mrkAml.removeEventListener("afterload", arguments.callee);
            });
        }
        else {   
            //find in markupeditor, if not there, show in showObject
            mrkAml.expandAndSelect(node);
    
            if (mrkAml.selected != node)
                this.showObject(node, node.getAttribute("id") || "");
        }
    },
    
    toggleHighlight : function(debugwin, btn, options){
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
                if (options.value == "markup")
                    debugwin.showAmlNode(amlNode);
                else if (options.value == "data") {
                    if (amlNode.xmlRoot)
                        debugwin.showXmlNode(amlNode.xmlRoot);
                    else
                        debugwin.showAmlNode(amlNode);
                }
                else if (options.value == "prop")
                    debugwin.showObject(amlNode);

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
    
    showObject : function(obj, id, name){
        tabDebug.set(1);
        pgBrowse.set(2);

        if (!name && obj && obj.$regbase) {
            name = obj.getAttribute("id") || "Aml Node";
            id   = this.apf.$debugwin.cache.push(obj) - 1;
        }

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
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
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
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);
        
        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },
    
    analyze : function(pNode, ref, displayName){
        var item, prop, o, obj;

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
    
        var n;
        if (!pNode) {
            /*var xml = apf.getXml("<obj><item " + (ref ? "name='" + ref + "'" : "") 
                + (displayName ? " display=\"" + displayName.replace(/"/g, "&quot;") + "\"" : "")
                + " expand='true' /></obj>").firstChild;*/
            var xml = apf.getXml("<obj />");
            n = {};
            n[displayName] = o;
            if (typeof o == "object" || typeof o == "function" || o && o.dataType == apf.ARRAY)
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
            
            if (typeof obj == "function" && (!n || obj != n[displayName]) && (o.dataType != apf.ARRAY || prop != parseInt(prop))) {
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
                    if (obj.length > 10000) 
                        item.setAttribute("value", "String of " + obj.length + " bytes (too large to display)");
                    else 
                        item.setAttribute("value", '"' + obj
                          .replace(/"/g, "\\\"")
                          .replace(/</g, "&lt;")
                          .replace(/\n/g, "\\n")
                          .replace(/\r/g, "\\r") + '"');
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
            xml.firstChild.setAttribute("name", ref);
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
        if (!id) 
            id = apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(xml), xml);
        var docId = id.split("\|")[0];
        
        if (!lut[docId]) {
            lut[docId] = doc;
        }
        else if (lut[docId] != doc) {
            //#ifdef __WITH_NAMESERVER
            var model1 = this.apf.nameserver.get("model", docId);
            lut[docId] = doc;

            var model2 = apf.nameserver.get("model", docId);
            apf.xmldb.getXmlDocId(doc, model2);
            
            if (model1)
                apf.nameserver.register("model", docId, model1);
            //#endif
        }
        
        mrkData.load(xml);
    },
    
    $handleDataContext : function(ev, obj){
        if (obj) {
            this.apf.$debugwin.highlightAmlNode(null, true);
            
            if (obj.$regbase) {
                itInspAml.hide();
                itInspData.hide();
                itInspObj.show();
                itRemove.show();
                
                var hasData = [obj.xmlRoot, obj.selected, obj.localName == "model" && obj.data];
                itInspRoot.setProperty("visible", hasData[0] ? 1 : 0);
                itInspSel.setProperty("visible", hasData[1] ? 1 : 0);
                div2.setProperty("visible", hasData[0] || hasData[1] || hasData[2] ? 1 : 0);
                itInspModel.setProperty("visible", hasData[2] ? 1 : 0);
            }
            else {
                itInspAml.hide();
                itInspData.hide();
                itInspModel.hide();
                itInspObj.show();
                
                itInspRoot.hide();
                itInspSel.hide();
                div2.hide();
            }
            
            mnuData.$lastObj = obj;
            mnuData.display(ev.x, ev.y);
            return false;
        }
        
        e = ev && ev.htmlEvent;
        if (!e) return;
        
        var el = e.srcElement || e.target;
        while (el.tagName != "A" && el.tagName != "DIV")
            el = el.parentNode;

        if (el.tagName == "A") {
            var cl = el.getAttribute("onclick");
            if (cl.indexOf("showObject") > -1) {
                itInspAml.hide();
                itInspData.hide();
                itInspObj.show();
                itRemove.hide();
                itInspModel.hide();
                
                itInspRoot.hide();
                itInspSel.hide();
                div2.hide();
            }
            else if (cl.indexOf("showXmlNode") > -1) {
                itInspAml.hide();
                itInspData.show();
                itInspObj.show();
                itRemove.hide();
                itInspModel.hide();
                
                itInspRoot.hide();
                itInspSel.hide();
                div2.hide();
            }
            else if (cl.indexOf("showAmlNode") > -1) {
                itInspAml.show();
                itInspData.hide();
                itInspObj.show();
                itRemove.show();
                
                var hasData = eval(cl.replace(/showAmlNode/, "$hasAmlData"));
                itInspRoot.setProperty("visible", hasData[0] ? 1 : 0);
                itInspSel.setProperty("visible", hasData[1] ? 1 : 0);
                div2.setProperty("visible", hasData[0] || hasData[1] || hasData[2] ? 1 : 0);
                itInspModel.setProperty("visible", hasData[2] ? 1 : 0);
            }
            
            mnuData.$lastCl = cl;
            mnuData.display(ev.x, ev.y);
            return false;
        }
    },
    
    $removeNode : function(amlNode){
        mrkAml.remove(this.$lastObj);
    },
    
    $hasAmlData : function(amlNode){
        return [amlNode.xmlRoot, amlNode.selected
            , amlNode.localName == "model" && amlNode.data];
    },
    
    jRunCode : function(code, scripttype,  model){
        //#ifdef __WITH_STORAGE
        apf.storage.put("jsexec", code);
        apf.storage.put("scriptype", scripttype);
        apf.storage.put("mdlvalue", model);
        //#endif
        var islm = scripttype == 'Live Markup';

        this.apf.console.write("<span style='color:blue'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 30px'>"
            + code.replace(/ /g, "&nbsp;")
                  .replace(/\t/g, "&nbsp;&nbsp;&nbsp;")
                  .replace(/</g, "&lt;")
                  .replace(/\n/g, "\n<br />") 
            + "</div></span>", "custom", null, null, null, true);

        var _self = this;
        var doIt  = function(data, loaded){
            if (islm) {
                var func = apf.$debugwin.apf.lm.compile(code, {parsecode : true});
                if (model && !loaded) {
                    //#ifdef __WITH_NAMESERVER
                    if (data = apf.$debugwin.apf.nameserver.get("model", model))
                        data = data.data;
                    //#endif
                    if (!data) {
                        var data = _self.apf.getData(model, {
                            useXML   : true,
                            callback : function(data, state, extra){
                                if (state == apf.SUCCESS) {
                                     doIt(data, true);
                                }
                                else {
                                    _self.apf.console.error("Could not find resource '" + model + "'\nMessage:" + extra.message);
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

            var s = _self.$serializeObject(x, code);
            if (typeof s == "string") {
                _self.apf.console.write(s, "custom", null, null, null, true);
            }
            else {
                _self.apf.console.write(x
                    ? "Could not serialize object: " + s.message
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
    
    $serializeObject : function(x, code){
        if (x === null)
            x = "null";
        else if (x === undefined)
            x = "undefined";

        //try {
            var str;
            if (x.nodeType && !x.style && (!x.$regbase || x.nodeType == 1 || x.nodeType == 7)) {
                if (x.nodeType == 1 || x.nodeType == 7) {
                    if (x.serialize) //aml
                        str = "<a class='xmlhl' href='javascript:void(0)' \
                          onmouseout='if (cbHighlightHover.checked) apf.$debugwin.apf.$debugwin.highlightAmlNode(null, true)' \
                          onmouseover='if(!mnuData.visible &amp;&amp; cbHighlightHover.checked) apf.$debugwin.apf.$debugwin.highlightAmlNode(apf.$debugwin.apf.all[" 
                            + x.$uniqueId + "])' onclick='apf.$debugwin.showAmlNode(apf.$debugwin.apf.all[" 
                            + x.$uniqueId + "])'>" + apf.highlightXml(x.serialize().split(">")[0] + ">").replace(/<\/?a(?:>| [^>]*>)/g, "")  + "</a>";
                    //else if (x.style) //html
                        //str = x.outerHTML.replace(/</g, "&lt;").replace(/\n/g, "\n<br />")
                    else
                        str = "<a class='xmlhl' href='javascript:void(0)' onclick='apf.$debugwin.showXmlNode(apf.$debugwin.cache[" 
                            + (apf.$debugwin.cache.push(x) - 1) + "])'>" 
                            + apf.highlightXml(apf.getCleanCopy(x).xml.split(">")[0] + ">") + "</a>";
                }
                else
                    str = x.xml || x.serialize();

                return str;
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

                return "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='apf.$debugwin.showObject(null, " 
                        + (this.apf.$debugwin.cache.push(x) - 1) + ", \"" + (code || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>" 
                        + out.join(" ") + " }</a>";
            }
            else {
                str = x.toString();
            
                return str
                    .replace(/</g, "&lt;")
                    .replace(/\n/g, "\n<br />");
            }
        /*}catch(e){
            return e;
        }*/
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
        //#ifdef __WITH_STORAGE
        apf.storage.put("apfdebug_console_date", c);
        //#endif
        apf.setStyleRule('.console_date', 'display', c ? 'inline' : 'none');
        this.showtime = c;
    },
    
    setNativeDebug : function(c, admin){
        if (!admin) {
            //#ifdef __WITH_STORAGE
            apf.storage.put("apfdebug_debugger", c);
            //#endif

            this.apf.$debugwin.setNativeDebug(c, true);
        }
        else
            window.onerror = c ? null : this.errorHandler;

        this.nativedebug = c;
    },
    
    setHighlightHover : function(c){
        //#ifdef __WITH_STORAGE
        apf.storage.put("apfdebug_highlight_hover", c);
        //#endif
        this.highlighthover = c;
    },
    
    setSelectEditable : function(c){
        //#ifdef __WITH_STORAGE
        apf.storage.put("apfdebug_select_editable", c);
        //#endif
        this.selecteditable = c;
    },
    
    firstEdit : true,
    $setEditable : function(value){
        if (value) {
            apf.document.documentElement
                .setAttribute("editable", "true");
        }
        else {
            apf.document.documentElement
                .removeAttribute("editable");
        }
    },
    
    setEditable : function(value){
        this.apf.$debugwin.$setEditable(value);
        //if (!self.pgBrowse) return;
        
        if (value){
            tabDebug.set(1);
            pgBrowse.set(0);
            
            pgBrowse.setAttribute("anchors", "61 0 0 0");
            mrkAml.setAttribute("border", "1 1 0 1");
            tbEdit.show();
            trTools.show();
        }
        else if (self.pgBrowse) {
            pgBrowse.setAttribute("anchors", "25 0 0 0");
            mrkAml.setAttribute("border", "1 1 0 0");
            tbEdit.hide();
            trTools.hide();
        }
    },
    
    first : true,
    show : function(){
        if (apf.isDebugWindow)
            return;
        
        if (apf.loadScreen)
            apf.loadScreen.hide();

        //Initialize css for showing debugwindow
        if (this.first) {
            var p, m, o;
            if (apf.isIE) {
                apf.setStyleRule("BODY", "overflow", "", 0);
    
                p = apf.getBox(apf.getStyle(document.body, "padding"));
                m = apf.getBox(apf.getStyle(document.body, "margin"));
                o = [apf.getStyle(document.documentElement, "overflow"),
                         apf.getStyle(document.documentElement, "overflowX"),
                         apf.getStyle(document.documentElement, "overflowY")];
            }
            else {
                p = [parseInt(apf.getStyle(document.body, "paddingTop")),
                     parseInt(apf.getStyle(document.body, "paddingRight")),
                     parseInt(apf.getStyle(document.body, "paddingBottom")),
                     parseInt(apf.getStyle(document.body, "paddingLeft"))];
                m = [parseInt(apf.getStyle(document.body, "marginTop")),
                     parseInt(apf.getStyle(document.body, "marginRight")),
                     parseInt(apf.getStyle(document.body, "marginBottom")),
                     parseInt(apf.getStyle(document.body, "marginLeft"))];
                o = [apf.getStyleRule("html", "overflow") || "auto",
                         apf.getStyleRule("html", "overflowX") || "auto",
                         apf.getStyleRule("html", "overflowY") || "auto"];
            }
    
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
                    bottom : 350px;\
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
                    height: 350px;\
                    width : 100%;\
                    left: 0px;\
                    z-index: 100000000;\
                }\
            ");
            document.documentElement.style.overflow = "hidden";
            this.first = false;
            
            //src='debugwin.html' 
            document.body.insertAdjacentHTML("beforeend", "<div id='apf_debugwin'><iframe frameborder='0' width='100%' height='100%' /></div>");
            this.$iframe = (this.$ext = document.getElementById("apf_debugwin")).firstChild;
            this.$iframe.isDebugWin = true;

            apf.getWindowWidth = function(){
                return document.body.offsetWidth;
            }
            apf.getWindowHeight = function(){
                return document.body.offsetHeight;
            }
            
            setTimeout(function(){
                apf.$debugwin.$iframe.src = apf.basePath + "debugwin/debugwin.html";
            });
        };

        this.$ext.style.display = "block";
        document.body.style.bottom = this.$ext.offsetHeight + "px";
    },
    
    hide : function(){
        this.$ext.style.display = "none";
        document.body.style.bottom = "0";
        document.body.focus();
        
        /*if (apf.isIE8) {
            document.body.style.overflow = "";
            document.body.style.position = "";
        }*/
    },
    
    $startResize : function(offset, oApf){
        var $ext = this.$ext;
        apf.plane.show(null, null, null, true);
        apf.dragMode = true;
        oApf.dragMode = true;

        document.body.style.cursor = "s-resize";
        
        var lastTime, timer,
            body  = document.body,
            start = $ext.offsetHeight,
            sY    = document.documentElement.offsetHeight - start + ((apf.isIE ? 0 : 1) * offset);
        document.onmousemove = f = function(e){
            if (!e) e = event;
            
            var offsetY = e.offsetY || e.pageY;
            clearTimeout(timer);
            if (lastTime && new Date().getTime() 
              - lastTime < apf.mouseEventBuffer) {
                var z = {
                    clientX: e.clientX,
                    clientY: e.clientY
                }
                timer = setTimeout(function(){
                    $ext.style.height = (start + (sY - offsetY)) + "px";
                    body.style.bottom = $ext.offsetHeight + "px";
                }, 10);
                return;
            }
            lastTime = new Date().getTime();
            
            $ext.style.height = (start + (sY - offsetY)) + "px";
            body.style.bottom = $ext.offsetHeight + "px";
        }
        document.onmouseup = function(e){
            if (!e) e = event;
            
            document.body.style.cursor = "";
            
            document.onmousemove = 
            document.onmouseup   = null;
            
            apf.dragMode = false;
            oApf.dragMode = false;
            
            apf.plane.hide();
        }
    },
    
    activate : function(){
        //Show me
        //this.show();
    }
}

// #endif
