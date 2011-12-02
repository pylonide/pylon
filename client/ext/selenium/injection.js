if (!self.apf)
    Array.prototype.dataType = 4;

var unloading = false;
window.addEventListener("beforeunload", function(e) {
    unloading = true;
    capture.stop();
});

window.addEventListener("message", function(e) {
//    if (e.origin !== window.parent.location.origin || unloading)
//        return;
    try {
        var json = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
    } catch (e) {
        return;
    }
    
    //Receive from Parent
    if (json.to == capture.parentUniqueId) {
        if (!json.command)
            return;
    
        switch (json.command) {
            case "ping":
                e.source.postMessage(JSON.stringify({ 
                    to   : capture.parentUniqueId,
                    type : "pong" 
                }), "*");
                capture.source = window.parent;//e.source;
                //capture.origin = e.origin;
                break;
            default:
                capture[json.command].apply(capture, json.args);
                break;
        }
    }
}, false);

var t = location.href.match(/c9proxyid=(.*?)(?:$|\&)/);
var capture = {
    uniqueId       : Math.random(),
    parentUniqueId : t && t[1] || -1,
    
    validKeys      : [ 37, 38, 39, 40,  //arrowkeys
                        27,             // Esc
                        16, 17, 18,     // Shift, Ctrl, Alt
                        13,             // Enter
                        8, 46, 36, 35,  // Backspace, Del, Home, End
                        9               // Tab
                      ],
    
    xmlToXpath : function(xmlNode, xmlContext, useAID){
        if (!xmlNode) //@todo apf3.0
            return "";
    
        if (useAID === true && xmlNode.nodeType == 1 && xmlNode.getAttribute(apf.xmldb.xmlIdTag)) {
            return "//node()[@" + apf.xmldb.xmlIdTag + "='"
                + xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "']";
        }
    
        if (xmlNode == xmlContext)
            return ".";
    
        if (xmlNode.nodeType != 2 && !xmlNode.parentNode && !xmlNode.ownerElement) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null,
                "Converting XML to Xpath",
                "Error xml node without parent and non matching context cannot\
                 be converted to xml.", xmlNode));
            //#endif
    
            return false;
        }
    
        var str = [], lNode = xmlNode;
        if (lNode.nodeType == 2) {
            str.push("@" + lNode.nodeName);
            lNode = lNode.ownerElement || xmlNode.selectSingleNode("..");
        }
    
        var id;//, pfx = "";
        while(lNode && lNode.nodeType == 1) {
            if (lNode == xmlContext) {
                //str.unshift("/");//pfx = "//";
                break;
            }
            str.unshift((lNode.nodeType == 1 ? lNode.tagName : "text()")
                + "[" + (useAID && (id = lNode.nodeType == 1 && lNode.getAttribute(apf.xmldb.xmlIdTag))
                    ? "@" + apf.xmldb.xmlIdTag + "='" + id + "'"
                    : (this.getChildNumber(lNode) + 1))
                 + "]");
            lNode = lNode.parentNode;
        };
    
        return (str[0] == "/" || xmlContext && xmlContext.nodeType == 1 ? "" : "/") + str.join("/"); //pfx +
    },

    //@todo support for text()
    getChildNumber : function(node){
        var tagName = node.tagName;
        var nodes = node.parentNode.childNodes;
        for (var j = 0, i = 0; i < nodes.length; i++) {
            if (nodes[i].tagName == tagName) {
                if (nodes[i] == node)
                    return j;
                j++;
            }
        }
        
        return -1;
    },
    
    getStyle : function(el, prop) {
        try{
            return (window.getComputedStyle(el, "") || {})[prop] || "";
        }catch(e){}
    },
    
    getAbsolutePosition : function(o, refParent, inclSelf){
        if (this.mCheck == undefined) {
            var bodyMarginTop = parseFloat(apf.getStyle(document.body, "marginTop"));
            this.mCheck = (document.body.offsetTop !== bodyMarginTop);
        }
        
        if (this.mCheck && o == document.body) {
            return [
                o.offsetLeft + (parseFloat(this.getStyle(o, "marginLeft")) || 0),
                  + (o.scrollLeft || 0),
                o.offsetTop  + (parseFloat(this.getStyle(o, "marginTop")) || 0)
                  + (o.scrollTop || 0)
            ];
        }
        
        var box  = o.getBoundingClientRect(), 
            top  = box.top,
            left = box.left,
            corr = (apf.isIE && apf.isIE < 8);

        if (refParent && refParent != document.body) {
            var pos = this.getAbsolutePosition(refParent, null, true);
            top -= pos[1];
            left -= pos[0];
        }
        
        if (!(apf.isIE && o == document.documentElement)) {
            left += (refParent || document.body).scrollLeft || document.documentElement.scrollLeft || 0;
            top  += (refParent || document.body).scrollTop  || document.documentElement.scrollTop  || 0;
        }
        
        if (inclSelf && !refParent) {
            left += parseInt(this.getStyle(o, "borderLeftWidth")) || 0
            top  += parseInt(this.getStyle(o, "borderTopWidth")) || 0;
        }

        return [left - (corr ? 2 : 0), top - (corr ? 2 : 0)];
    },
    
    $ignoreRecorder : true,
    
    dispatchEvent : function(name, e){
        if (e && e.stream)
            e.streamIndex = this.actions.indexOf(e.stream);
        
        if (this.source)
            this.source.postMessage(JSON.stringify({
                to    : this.parentUniqueId,
                type  : "event",
                name  : name,
                event : e
            }), "*");
    },
    
    setProperty : function(prop, value){
        this[prop] = value;
    },
    
    addListener : function (el, type, fn, capture){
        if (el.addEventListener)
            el.addEventListener(type, fn, capture || false);
        else if (el.attachEvent)
            el.attachEvent("on" + type, fn);
        return this;
    },
    
    removeListener : function (el, type, fn, capture){
        if (el.removeEventListener)
            el.removeEventListener(type, fn, capture || false);
        else if (el.detachEvent)
            el.detachEvent("on" + type, fn);
        return this;
    },
    
    // start capturing
    record : function() {
        // init capturing
        capture.init();

        this.actions    = [];
        this.startTime  = new Date().getTime();

        // start capturing
        this.createStream();
        
        if (self.apf) {
            apf.uirecorder.captureDetails = true;
            apf.uirecorder.isRecording    = true;
        }
        this.setProperty("isRecording", true);
        
        this.dispatchEvent("record");
    },
    
    // stop capturing, save recorded data in this.outputXml
    stop : function() {
        if (self.apf)
            apf.uirecorder.isRecording = false;
        this.setProperty("isRecording", false);

        if (this.lastStream && !this.lastStream.name)
            this.actions.length--;
        
        this.lastStream = null;
        
        if (self.apf)
            $setTimeout = apf.uirecorder.setTimeout;
        
        this.dispatchEvent("stop", {
            actions : this.actions
        });
    },
    
    pause : function(){
        if (this.paused)
            return;
            
        this.paused = true;
        this.wasRecording = this.isRecording;
        if (self.apf)
            apf.uirecorder.isRecording = false;
        
        //???
        //$setTimeout = apf.uirecorder.setTimeout;
    },
    
    unpause : function(){
        if (!this.paused)
            return;
        
        if (self.apf)
            apf.uirecorder.isRecording = this.wasRecording;
        this.paused = false;
    },

    canCapture : function(){
        if (!self.apf)
            return true;
            
        return !(apf.uirecorder.isPaused 
          || !(apf.uirecorder.isPlaying 
          || apf.uirecorder.isRecording 
          || apf.uirecorder.isTesting));
    },
    
    /**
     * init capturing of user interaction
     */
    init : function() {
        if (this.$inited) return;
        this.$inited = true;

        var _self = this;

        // listeners for user mouse interaction
        this.addListener(document, "dblclick", 
            _self.dblclick = function(e) {
                if (!_self.canCapture())
                    return;
                _self.captureHtmlEvent("dblclick", e || event);
            }, true);

        this.addListener(document, "mousedown",
            _self.mousedown = function(e) {
                if (!_self.canCapture()) 
                    return;
                _self.captureHtmlEvent("mousedown", e || event);
            }, true);

        this.addListener(document, "mouseup",
            _self.mouseup = function(e) {
                if (!_self.canCapture()) 
                    return;
                _self.captureHtmlEvent("mouseup", e || event);
            }, true);
        
        this.addListener(document, "mousemove",
            _self.mousemove = function(e) {
                if (!_self.canCapture()) 
                    return;
                _self.captureHtmlEvent("mousemove", e || event);
            }, true);
        
        // Support for Mouse Scroll event
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (!_self.canCapture()) 
                    return;
                
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (self.apf && apf.isOpera) //@todo
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                
                _self.captureHtmlEvent("mousescroll", e, delta);
            }, true);
        }
        else {
            /* IE */
            document.onmousewheel             = 
            _self.mousewheel = function(e) {
                if (!_self.canCapture()) return;
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (self.apf && apf.isOpera) //@todo
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                    
                _self.captureHtmlEvent("mousescroll", e, delta);
            };
        }
        
        // listeners for keyboard interaction
        this.addListener(document, "keyup",
            _self.keyup = function(e) {
                e = e || event;

                if (!_self.canCapture()) 
                    return;
    
                var keycode = e.keyCode || e.which;
                if (_self.validKeys.indexOf(keycode) == -1)
                    return;
    
                if (self.apf && apf.document.activeElement.$ignoreRecorder)
                    return;
    
                _self.captureHtmlEvent("keyup", e, 
                    String.fromCharCode(keycode));
            }, true);
        
        this.addListener(document, "keydown",
            _self.keydown     = function(e) {
                e = e || event;
                
                if (!_self.canCapture()) 
                    return;
    
                var keycode = e.keyCode || e.which;
                if (_self.validKeys.indexOf(keycode) == -1) 
                    return;

                if (self.apf && apf.document.activeElement.$ignoreRecorder)
                    return;

                _self.captureHtmlEvent("keydown", e, 
                    String.fromCharCode(keycode));
            }, true);
        
        this.addListener(document, "keypress",
            _self.keypress = function(e) {
                e = e || event;
                
                if (!_self.canCapture()) 
                    return;
    
                //if (_self.validKeys.indexOf(e.keyCode) > -1) return;
                var character = "";
                if (e.keyCode) { // Internet Explorer
                    character = String.fromCharCode(e.keyCode);
                } 
                else if (e.which) { // W3C
                    character = String.fromCharCode(e.which);
                }
                else {
                    character = e.keyCode
                }
                
                // ignore when no character is outputted, 
                // like the Enter key, except for space character
                if (character.trim() == "" && character != " ") 
                    return;
    
                _self.captureHtmlEvent("keypress", e, character);
            }, true);
        
        // @todo fix problem with onkeyup in apf
    },
    
    captureHtmlEvent : function(eventName, e, value) {
        if (!this.lastStream || this.lastStream.name) {
            /*console.warn("Stream collission error. Probably cancelBubble "
                + "preventing proper cleanup. Trying to recover. " 
                + (!this.lastStream ? "Missing stream" : ""));*/
            
            if (this.lastCleanUpCallback) {
                this.nextStream(this.lastCleanUpCallback.eventName);
            }
            else {
                throw new Error("Could not recover from collission error.");
            }
        }

        // Set action object
        
        var stream = this.lastStream;
        
        // elapsed time since start of recording/playback
        stream.abstime = new Date().getTime();
        stream.time    = parseInt(stream.abstime - this.startTime);
        stream.name    = eventName;
        
        // Determine Context
        
        stream.element = this.getElementLookupDef(null, null, e);
        
        if (!stream.element) {
            this.actions.pop();
            this.createStream();
            return;
        }
        
        // Set mouse properties
        
        if (e) {
            stream.x = parseInt(e.clientX) || undefined;
            stream.y = parseInt(e.clientY) || undefined;
            stream.offsetX = e.offsetX;
            stream.offsetY = e.offsetY;
            
            if (e.button || e.which)
                stream.button = e.button || e.which;

            if (value)
                stream.value = value;
            
            // Set keyboard properties
            
            stream.keyCode  = e.keyCode;
            stream.altKey   = e.altKey;
            stream.shiftKey = e.shiftKey;
            stream.ctrlKey  = e.ctrlKey;
            stream.metaKey  = e.metaKey;
        }
        
        // Forward stream to async areas
        
        this.replaceTimeout(stream); //Make sure timeouts follow this stream
        
        // Create the stream for the next event after all sync execution
        
        var _self = this;
        this.addListener(document, eventName, this.lastCleanUpCallback = function(){
            _self.nextStream(eventName);
        });
        this.lastCleanUpCallback.eventName = eventName;
        
        this.dispatchEvent("action", {
            stream : stream
        });
    },
    
    nextStream : function(eventName){
        if (!this.isRecording)
            return;
        
        if (this.lastStream.name)
            this.createStream();

        this.removeListener(document, eventName, this.lastCleanUpCallback);
        delete this.lastCleanUpCallback;
    },
    
    replaceTimeout : function(stream) {
        var _self = this;
        
        if (!self.apf)
            return;
        
        $setTimeout = function(f, ms){
            //Record current mouseEvent
            if (!ms) ms = null;
            
            return apf.uirecorder.setTimeout.call(window, function(){
                var lastStream   = _self.lastStream; //Later in time, so potentially a different stream;
                _self.lastStream = stream;
                stream.async = true;
                
                if (typeof f == "string")
                    apf.jsexec(f)
                else if (f)
                    f();
                
                if (_self.lastStream != stream)
                    throw new Error("Stream corruption occured");
                
                _self.lastStream = lastStream;
            }, ms);
        }
    },
    
    trackHttpCall : function(http, url, options){
        var _self = this, stream = this.lastStream, callback = options.callback;
        
        options.callback = function(data, state, extra){
            var lastStream   = _self.lastStream; //Later in time, so potentially a different stream;
            _self.lastStream = stream;
            stream.async = true;
            
            stream.http.push({
                url      : url,
                request  : options,
                response : {
                    data    : data,
                    state   : state,
                    status  : extra.status,
                    message : extra.message
                    //@todo headers?
                }
            });
            
            _self.dispatchEvent("capture.http", {
                stream : stream
            });
            
            _self.replaceTimeout(stream); //Make sure timeouts follow this stream
            
            if (callback)
                callback.apply(this, arguments);
            
            if (_self.lastStream != stream)
                throw new Error("Stream corruption occured");
            
            _self.lastStream = lastStream;
            _self.replaceTimeout(lastStream); //Restore previous stream
        }
    },
    
    captureEvent : function(eventName, e) {
        if (["DOMNodeRemovedFromDocument"].indexOf(eventName) > -1) 
            return;
        var target = this.getTargetNode(eventName, e);
        if (!target || this.shouldIgnoreEvent(eventName, target)) 
            return;

        // Special case for drag&drop
        if ((eventName == "dragstop" && !e.success || eventName == "dragdrop")
          && e.htmlEvent) {
            this.lastStream.dragIndicator = this.lastStream.element;
            
            e.indicator.style.top = "-2000px";
            
            var htmlNode = 
                document.elementFromPoint(e.htmlEvent.x, e.htmlEvent.y);
            this.lastStream.element = 
                this.getElementLookupDef(htmlNode);
            
            var pos = this.getAbsolutePosition(htmlNode);
            this.lastStream.offsetX = e.htmlEvent.x - pos[0];
            this.lastStream.offsetY = e.htmlEvent.y - pos[1];
        }
        
        var event;
        this.lastStream.events.push(event = {
            name        : eventName,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            event       : this.getCleanCopy(e, target),
            element     : this.getElementLookupDef(null, target)
        });
        
        this.dispatchEvent("capture.event", {
            stream : this.lastStream,
            event  : event
        });
    },
    
    capturePropertyChange : function(amlNode, prop, value, oldvalue) {
        var target = amlNode;
        if (!target || this.shouldIgnoreEvent(null, target)) 
            return;

        var prop;
        this.lastStream.properties.push(prop = {
            name        : prop,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            value       : this.getCleanCopy(value, target),
            oldvalue    : this.getCleanCopy(oldvalue, target),
            element     : this.getElementLookupDef(null, target)
        });
        
        this.dispatchEvent("capture.prop", {
            stream : this.lastStream,
            prop   : prop
        });
    },
    
    captureModelChange : function(params) {
        var target = params.amlNode;
        if (!target) 
            return;

        var data;
        this.lastStream.data.push(data = {
            name        : params.action,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            xmlNode     : this.xmlToXpath(params.xmlNode, params.amlNode.data),
            element     : this.getElementLookupDef(null, target)
            //@todo params.UndoObj??
        });
        
        this.dispatchEvent("capture.data", {
            stream : this.lastStream,
            data   : data
        });
    },
    
    /**** UTIL Functions ****/
    
    shouldIgnoreEvent : function(eventName, amlNode){
        if ((amlNode.root && amlNode.isIE != undefined) 
          || ["html","head","body","script"].indexOf(amlNode.tagName) > -1) 
            return true;
            
        if (eventName && ["hotkey"].indexOf(eventName) > -1) 
            return true;
        
        if (amlNode.$ignoreRecorder)
            return true;
        
        return false;
    },
    
    getTargetNode : function(eventName, e) {
        var amlNode;
        
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode; //Why??
        else
            amlNode = e.amlNode || e.currentTarget;
        
        return amlNode;
    },
    
    getElementLookupDef : function(htmlNode, amlNode, e){
        if (!htmlNode && e) 
            htmlNode = e.srcElement || e.target;
        
        if (!amlNode)
            amlNode = self.apf && apf.findHost(htmlNode);
        
        if (e && !amlNode) {
            var top = htmlNode.style.top;
            htmlNode.style.top = "-2000px";
            var tempNode = document.elementFromPoint(e.x, e.y);
            amlNode = apf.findHost(tempNode);
            htmlNode.style.top = top;
            
            if (amlNode)
                htmlNode = tempNode;
        }

        if (amlNode && amlNode.$ignoreRecorder)
            return false;

        var context, searchObj = {};
        
        if (amlNode && amlNode.nodeType == 1) {
            if (amlNode.id) {
                searchObj.id = amlNode.id;
            }
            else if (!amlNode.parentNode) {
                if (amlNode == apf.window.getActionTracker())
                    searchObj.eval = "apf.window.getActionTracker()";
                else
                    return false;
            }
            else {
                searchObj.xpath = 
                    this.xmlToXpath(amlNode, apf.document.documentElement);
            }
            
            if (!htmlNode)
                return searchObj;
            
            if (amlNode.hasFeature(apf.__MULTISELECT__) && htmlNode) {
                var xmlNode = apf.xmldb.findXmlNode(htmlNode);
                if (xmlNode) {
                    var xpath = this.xmlToXpath(xmlNode, amlNode.xmlRoot);
                    if (xpath != ".") {
                        searchObj.xml = xpath
                        context       = apf.xmldb.getHtmlNode(xmlNode, amlNode);
                    }
                }
            }
            
            if (!context) {
                if (amlNode.$getActiveElements) {
                    var activeElements = amlNode.$getActiveElements();
                    for (var name in activeElements) {
                        if (apf.isChildOf(activeElements[name], htmlNode, true)) {
                            searchObj.property = name;
                            context            = activeElements[name];
                            break;
                        }
                    }
                }
                
                if (context) {}
                else if (apf.isChildOf(amlNode.$ext, htmlNode, true))
                    context = amlNode.$ext;
                else {
                    throw new Error ("Could not determine context for " 
                        + amlNode.serialize(true));
                }
            }
        }

        if (context != htmlNode)
            searchObj.htmlXpath = this.xmlToXpath(htmlNode, context);

        return searchObj;
    },
    
    getCleanCopy : function(obj, target, recur) {
        var o = {};
        
        if (!obj || "object|array".indexOf(typeof obj) == -1)
            o = obj;
        else if (obj.dataType == (self.apf && apf.ARRAY || 4)) {
            o = [];
            for (var i = 0; i < obj.length; i++) {
                o[i] = this.getCleanCopy(obj[i], target);
            }
        }
        else if (obj.nodeFunc)
            o = this.getElementLookupDef(null, obj);
        else if (obj.style && typeof obj.style == "object")
            o = this.getElementLookupDef(obj);
        else if (obj.nodeType) {
            try {
                var id, model = apf.xmldb.findModel(obj);
                if (target && target.getModel() == model) {
                    var amlDef = this.getElementLookupDef(null, target);
                    id = (amlDef.id 
                        ? amlDef.id 
                        : "apf.document.selectSingleNode('" 
                            + amlDef.xpath.replace(/'/g, "\\'") + "')")
                        + ".getModel()";
                }
                else
                    id = model.id;
                o = {
                    eval : id + ".queryNode('" 
                        + this.xmlToXpath(obj, model.data).replace(/'/g, "\\'")
                        + "')",
                }
            }
            catch (e) {
                o = {message : "Could not serialize"}
            }
        }
        else if (recur)
            o = {message : "Could not serialize"}
        else {
            for (var prop in obj) {
                if (typeof obj[prop] == "function")
                    continue;
                o[prop] = this.getCleanCopy(obj[prop], target, true);
            }
        }
        
        return o;
    },
    
    /**** UTIL STREAM Functions ****/
    
    createStream : function(){
        var stream = {
            properties : [],
            events     : [],
            data       : [],
            http       : []
        };
        
        this.actions.push(stream);
        
        return (this.lastStream = stream);
    },
    
    /**** OUTPUT Functions ****/

    toXml : function(){
        var xml = apf.getXml("<recording />");
        var doc = xml.ownerDocument;
        
        var action, item;
        for (var i = 0; i < this.actions.length; i++) {
            item = this.actions[i];
            
            action = xml.appendChild(doc.createElement("action"));
            action.setAttribute("name", item.name);
            action.appendChild(doc.createTextNode(JSON.stringify(item)));
        }
        
        return xml.xml;
    },
    
    /**** UI Functions ****/
    
    startAddAssert : function(){
        this.pickingAssertion = true;
        
        this.initHighlights();
        
        this.addListener(document, "mousemove", this.assertHandlers[0], true);
        this.addListener(document, "mousedown", this.assertHandlers[1], true);
        this.addListener(document, "mouseout", this.assertHandlers[2], true);

        this.pause();
    },
    
    assertHandlers : [
        function(e){
            if (!e) e = event;
            
            var div = capture.divs[0];
            div.style.top = "-20000px";

            var htmlNode = document.elementFromPoint(e.x, e.y);
            var amlNode = self.apf && apf.findHost(htmlNode);
            
            if (amlNode && amlNode.$ignoreRecorder)
                return;
            
            if (amlNode 
              && (amlNode.$ext.offsetWidth || amlNode.$ext.offsetHeight)) {
                div.style.display = "block";
                var pos = lastPos = apf.getAbsolutePosition(amlNode.$ext);
                div.style.left = pos[0] + "px";
                div.style.top = pos[1] + "px";
                div.style.width = (amlNode.$ext.offsetWidth - 6) + "px";
                div.style.height = (amlNode.$ext.offsetHeight - 6) + "px";
                
                div.innerHTML = "<div style='position:absolute;right:0;bottom:0;padding:2px 3px 2px 4px;background:black;color:white;font-family:Arial;font-size:10px;'>"
                    + (amlNode.id || apf.xmlToXpath(amlNode, apf.document.documentElement)) 
                    + "</div>";
            }
            else {
                div.style.display = "none";
            }
        },
        function(e){
            if (!e) e = event;

            var div = capture.divs[0];
            var lastTop = div.style.top;
            div.style.top = "-20000px";

            var htmlNode = document.elementFromPoint(e.x, e.y);
            var amlNode = self.apf && apf.findHost(htmlNode);

            if (!amlNode || amlNode.$ignoreRecorder)
                return;
            
            var ui = capture;
            if (ui.selected) {
                apf.addListener(document, "mousemove", ui.assertHandlers[0], true);
                apf.addListener(document, "mousedown", ui.assertHandlers[1], true);
                apf.addListener(document, "mouseout", ui.assertHandlers[2], true);
                
                //hide
                capture.dispatchEvent("hidemenu");
                
                ui.selected = false;
            }
            else {
                apf.removeListener(document, "mousemove", ui.assertHandlers[0], true);
                apf.removeListener(document, "mousedown", ui.assertHandlers[1], true);
                apf.removeListener(document, "mouseout", ui.assertHandlers[2], true);
                
                var props = amlNode.$supportedProperties;
                
                var xml = apf.getXml("<properties />");
                
                div.style.top = lastTop;
                
                //show
                var obj = [];
                for (var i = 0; i < props.length; i++) {
                    if (amlNode[props[i]] != undefined) {
                        obj.push({
                            caption : props[i], 
                            value   : capture.getCleanCopy(amlNode[props[i]], amlNode)
                        });
                    }
                }

                capture.dispatchEvent("showmenu", {
                    props : obj,
                    element : ui.getElementLookupDef(null, amlNode),
                    x : e.clientX,
                    y : e.clientY
                });
                
                apf.stopEvent(e);
                
                ui.selected = true;
            }
        },
        function(e){
            capture.divs[0].style.display = "none";
        }
    ],
    
    stopAddAssert : function(){
        this.removeListener(document, "mousemove", this.assertHandlers[0], true);
        this.removeListener(document, "mousedown", this.assertHandlers[1], true);
        this.removeListener(document, "mouseout", this.assertHandlers[2], true);
        
        this.pickingAssertion = false;
        
        this.unpause();
        
        this.selected = false;
    },
    
    findElement : function (options){
        var amlNode, htmlPropNode, resHtml;
    
        //@todo fix this for html-only support
        if (!self.apf)
            return false;
    
        if (options.eval)
            amlNode = eval(options.eval);
        else if (options.id)
            amlNode = self[options.id];
        else if (options.xpath)
            amlNode = apf.document.selectSingleNode(options.xpath);
    
        if (!amlNode)
            return false;
    
        if (options.xml) {
            var xmlNode = amlNode.queryNode(options.xml);
            resHtml = xmlNode && apf.xmldb.findHtmlNode(xmlNode, amlNode);
            
            if (!resHtml)
                return false;
        }
        else {
            if (options.property)
                htmlPropNode = resHtml = amlNode[options.property];
            else
                resHtml = amlNode.$ext
        }
        
        if (options.htmlXpath) {
            if (!apf.XPath)
                apf.runXpath();
    
            resHtml = apf.XPath.selectNodes(options.htmlXpath, resHtml)[0];
            
            if (!resHtml)
                return false;
        }
    
        if (options.html) {
            if (options.html.dataType == apf.ARRAY) {
                var temp, arr = options.html;
                for (var i = 0; i < arr.length; i++) {
                    if (!arr[i]) {
                        break;
                    }
                    else if (temp = resHtml.querySelector(arr[i])) {
                        resHtml = temp;
                        break;
                    }
                }
            }
            else {
                resHtml = resHtml.querySelector(DOMSelector);
                
                if (!resHtml)
                    return false;
            }
        }
    
        return {
            aml : amlNode,
            prop : htmlPropNode,
            html : resHtml
        }
    },
    
    hideHighlightElements : function(){
        if (!this.divs) return;
        
        this.divs.forEach(function(div){
            div.style.display = "none";
        });
    },
    
    initHighlights : function(){
        if (!this.divs) {
            this.divs = [
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div"))
            ];
            
            var div = this.divs[0];
            div.style.border = "3px solid blue";
            div.style.position = "absolute";
            self.apf && apf.window.zManager.set("plane", div);
            div.style.display = "none";
            div.style.cursor = "default";
            self.apf && apf.setOpacity(div, "0.5");
            
            var div = this.divs[1];
            div.style.border = "2px solid purple";
            div.style.position = "absolute";
            self.apf && apf.window.zManager.set("plane", div);
            div.style.display = "none";
            self.apf && apf.setOpacity(div, "0.5");
            
            var div = this.divs[2];
            div.style.border = "1px solid red";
            div.style.position = "absolute";
            self.apf && apf.window.zManager.set("plane", div);
            div.style.display = "none";
            self.apf && apf.setOpacity(div, "0.5");
            
            var div = this.divs[3];
            div.style.border = "2px solid red";
            div.style.width = "1px";
            div.style.height = "1px";
            div.style.backgroundColor = "white";
            div.style.borderRadius = "3px";
            div.style.position = "absolute";
            div.style.display = "none";
            self.apf && apf.window.zManager.set("plane", div);
        }
    },
    
    highlightElement : function(elObj){
        if (this.isRecording || this.pickingAssertion)
            return;
        
        this.initHighlights();
        
        var lastPos  = [0, 0];
        var nodeInfo = this.findElement(elObj);
        
        //Aml Element
        var div = this.divs[0];
        if (nodeInfo.aml && nodeInfo.aml.$ext
          && (nodeInfo.aml.$ext.offsetHeight || nodeInfo.aml.$ext.offsetWidth)) {
            div.style.display = "block";
            var pos = lastPos = capture.getAbsolutePosition(nodeInfo.aml.$ext);
            div.style.left = pos[0] + "px";
            div.style.top = pos[1] + "px";
            div.style.width = (nodeInfo.aml.$ext.offsetWidth - 6) + "px";
            div.style.height = (nodeInfo.aml.$ext.offsetHeight - 6) + "px";
            div.innerHTML = "<div style='position:absolute;right:0;bottom:0;padding:2px 3px 2px 4px;background:black;color:white;font-family:Arial;font-size:10px;'>"
                + (nodeInfo.aml.id || apf.xmlToXpath(nodeInfo.aml, apf.document.documentElement)) 
                + "</div>";
        }
        else
            div.style.display = "none";
        
        //HTML Element Property ??
        var div = this.divs[1];
        if (nodeInfo.prop
          && (nodeInfo.prop.offsetWidth || nodeInfo.prop.offsetHeight)) {
            div.style.display = "block";
            
            var pos = lastPos = capture.getAbsolutePosition(nodeInfo.prop);
            div.style.left = pos[0] + "px";
            div.style.top = pos[1] + "px";
            div.style.width = (nodeInfo.prop.offsetWidth - 4) + "px";
            div.style.height = (nodeInfo.prop.offsetHeight - 4) + "px";
        }
        else
            div.style.display = "none";
        
        //HTML Element
        var div = this.divs[2];
        if (nodeInfo.html
          && (nodeInfo.html.offsetWidth || nodeInfo.html.offsetHeight)) {
            div.style.display = "block";
            
            var pos = lastPos = capture.getAbsolutePosition(nodeInfo.html);
            div.style.left = pos[0] + "px";
            div.style.top = pos[1] + "px";
            div.style.width = (nodeInfo.html.offsetWidth - 2) + "px";
            div.style.height = (nodeInfo.html.offsetHeight - 2) + "px";
        }
        else
            div.style.display = "none";
        
        
        var div = this.divs[3];
        if (elObj.json && elObj.json.offsetX) {
            div.style.display = "block";
            
            div.style.left = (lastPos[0] + elObj.json.offsetX) + "px";
            div.style.top = (lastPos[1] + elObj.json.offsetY) + "px";
        }
        else
            div.style.display = "none";
    }
};

if (self.apf)
    (apf.uirecorder || (apf.uirecorder = {})).capture = capture;
