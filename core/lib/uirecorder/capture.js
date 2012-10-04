// #ifdef __WITH_UIRECORDER

/*
    @todo Socket.io support
*/

apf.uirecorder.capture = apf.extend(new apf.Class().$init(), {
    validKeys      : [ 37, 38, 39, 40,  //arrowkeys
                        27,             // Esc
                        16, 17, 18,     // Shift, Ctrl, Alt
                        13,             // Enter
                        8, 46, 36, 35,  // Backspace, Del, Home, End
                        9               // Tab
                      ],
    
    $ignoreRecorder : true,
    
    // start capturing
    record : function() {
        // init capturing
        apf.uirecorder.capture.init();

        this.actions    = [];
        this.startTime  = new Date().getTime();

        // start capturing
        this.createStream();
        
        apf.uirecorder.captureDetails = true;
        apf.uirecorder.isRecording    = true;
        this.setProperty("isRecording", true);
        
        this.dispatchEvent("record");
    },
    
    // stop capturing, save recorded data in this.outputXml
    stop : function() {
        apf.uirecorder.isRecording = false;
        this.setProperty("isRecording", false);

        if (this.lastStream && !this.lastStream.name)
            this.actions.length--;
        
        this.lastStream = null;
        
        $setTimeout = apf.uirecorder.setTimeout;
        
        this.dispatchEvent("stop");
    },
    
    pause : function(){
        if (this.paused)
            return;
            
        this.paused = true;
        this.wasRecording = this.isRecording;
        apf.uirecorder.isRecording = false;
        
        //???
        //$setTimeout = apf.uirecorder.setTimeout;
    },
    
    unpause : function(){
        if (!this.paused)
            return;
        
        apf.uirecorder.isRecording = this.wasRecording;
        this.paused = false;
    },

    canCapture : function(){
        return !(apf.uirecorder.isPaused 
          || !(apf.uirecorder.isPlaying 
          || apf.uirecorder.isRecording 
          || apf.uirecorder.isTesting));
    },
    
    /**
     * init capturing of user interaction
     */
    init : function() {
        if (apf.uirecorder.$inited) return;
        apf.uirecorder.$inited = true;

        var _self = this;

        // listeners for user mouse interaction
        /*apf.addListener(document, "dblclick", 
            _self.dblclick = function(e) {
                if (!_self.canCapture())
                    return;
                _self.captureHtmlEvent("dblclick", e || event);
            }, true);*/

        apf.addListener(document, "mousedown",
            _self.mousedown = function(e) {
                if (!_self.canCapture()) 
                    return;
                _self.captureHtmlEvent("mousedown", e || event);
            }, true);

        apf.addListener(document, "mouseup",
            _self.mouseup = function(e) {
                if (!_self.canCapture()) 
                    return;
                _self.captureHtmlEvent("mouseup", e || event);
            }, true);
        
        apf.addListener(document, "mousemove",
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
                    if (apf.isOpera)
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
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                    
                _self.captureHtmlEvent("mousescroll", e, delta);
            };
        }
        
        // listeners for keyboard interaction
        apf.addListener(document, "keyup",
            _self.keyup = function(e) {
                e = e || event;

                if (!_self.canCapture()) 
                    return;
    
                var keycode = e.keyCode || e.which;
                if (_self.validKeys.indexOf(keycode) == -1)
                    return;
    
                if (apf.document.activeElement.$ignoreRecorder)
                    return;
    
                _self.captureHtmlEvent("keyup", e, 
                    String.fromCharCode(keycode));
            }, true);
        
        apf.addListener(document, "keydown",
            _self.keydown     = function(e) {
                e = e || event;
                
                if (!_self.canCapture()) 
                    return;
    
                var keycode = e.keyCode || e.which;
                if (_self.validKeys.indexOf(keycode) == -1) 
                    return;

                if (apf.document.activeElement.$ignoreRecorder)
                    return;

                _self.captureHtmlEvent("keydown", e, 
                    String.fromCharCode(keycode));
            }, true);
        
        apf.addListener(document, "keypress",
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
        if (this.lastStream.name)
            throw new Error("Stream collission error");

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
        apf.addListener(document, eventName, this.lastCleanUpCallback = function(){
            _self.nextStream(eventName);
        });
        
        this.dispatchEvent("action", {
            stream : stream
        });
    },
    
    nextStream : function(eventName){
        if (!apf.uirecorder.isRecording)
            return;
        
        if (this.lastStream.name)
            this.createStream();

        apf.removeListener(document, eventName, this.lastCleanUpCallback);
    },
    
    replaceTimeout : function(stream) {
        var _self = this;
        
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
            
            var pos = apf.getAbsolutePosition(htmlNode);
            this.lastStream.offsetX = e.htmlEvent.x - pos[0];
            this.lastStream.offsetY = e.htmlEvent.y - pos[1];
        }
        
        var event;
        this.lastStream.events.push(event = {
            name        : eventName,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            event       : this.getCleanCopy(e),
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
            value       : this.getCleanCopy(value),
            oldvalue    : this.getCleanCopy(oldvalue),
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
            xmlNode     : apf.xmlToXpath(params.xmlNode, params.amlNode.data),
            element     : this.getElementLookupDef(null, target)
            //@todo params.UndoObj??
        });
        
        this.dispatchEvent("capture.data", {
            stream : this.lastStream,
            data   : data
        });
    },
    
    // *** UTIL Functions *** //
    
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
            amlNode = apf.findHost(htmlNode);

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
                    apf.xmlToXpath(amlNode, apf.document.documentElement);
            }
            
            if (!htmlNode)
                return searchObj;
            
            if (amlNode.hasFeature(apf.__MULTISELECT__)) {
                xmlNode = apf.xmldb.findXmlNode(htmlNode);
                if (xmlNode) {
                    var xpath = apf.xmlToXpath(xmlNode, amlNode.xmlRoot);
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
            searchObj.htmlXpath = apf.xmlToXpath(htmlNode, context);

        return searchObj;
    },
    
    getCleanCopy : function(obj, recur) {
        var o = {};
        
        if (!obj || "object|array".indexOf(typeof obj) == -1)
            o = obj;
        else if (obj.dataType == apf.ARRAY) {
            o = [];
            for (var i = 0; i < obj.length; i++) {
                o[i] = this.getCleanCopy(obj[i]);
            }
        }
        else if (obj.nodeFunc)
            o = this.getElementLookupDef(null, obj);
        else if (obj.style && typeof obj.style == "object")
            o = this.getElementLookupDef(obj);
        else if (obj.nodeType) {
            try {
                var model = apf.xmldb.findModel(obj);
                o = {
                    eval : model.id + ".queryNode('" 
                        + apf.xmlToXpath(obj, model.data).replace(/'/g, "\\'")
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
                o[prop] = this.getCleanCopy(obj[prop], true);
            }
        }
        
        return o;
    },
    
    // *** UTIL STREAM Functions *** //
    
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
    
    // *** OUTPUT Functions *** //

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
    }
});

//#ifdef __ENABLE_UIRECORDER_XML
apf.uirecorder.capture.addEventListener("record", function(e){
    if (!this.model) {
        this.model = new apf.model();
        this.model.$ignoreRecorder = true;
        this.model.load("<tests><test name='Test recording 1' /></tests>");
    }
    else {
        var nr = this.model.queryNodes("test").length + 1;
        this.model.appendXml("<test name='Test recording " + nr + "' />");
    }
});
apf.uirecorder.capture.addEventListener("stop", function(e){
    var nodes = this.model.queryNodes("test[last()]/action");
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].setAttribute("json", 
            JSON.stringify(this.actions[nodes[i].getAttribute("index")]));
    }
});
apf.uirecorder.capture.addEventListener("action", function(e){
    if (e.stream.name == "mousemove")
        return;
    
    var doc = this.model.data.ownerDocument;
    
    var actionNode = doc.createElement("action");
    actionNode.setAttribute("name", e.stream.name);
    actionNode.setAttribute("element", JSON.stringify(e.stream.element));
    actionNode.setAttribute("index", this.actions.indexOf(e.stream));
    actionNode.setAttribute("value", e.stream.value || "");
    
    this.model.appendXml(actionNode, "test[last()]");
});
apf.uirecorder.capture.addEventListener("capture.http", function(e){
    
});
apf.uirecorder.capture.addEventListener("capture.prop", function(e){
    if (!e.stream.name || e.stream.name == "mousemove")
        return;

    if (JSON.stringify(e.prop.value).indexOf("Could not serialize") > -1)
        return;

    var doc         = this.model.data.ownerDocument;
    var index       = this.actions.indexOf(e.stream);
    
    var assertNode  = doc.createElement("assert");
    assertNode.setAttribute("element", JSON.stringify(e.prop.element));
    assertNode.setAttribute("name", e.prop.name);
    assertNode.setAttribute("value", JSON.stringify(e.prop.value));
    assertNode.setAttribute("json", JSON.stringify(e.prop));
    
    this.model.appendXml(assertNode, "test[last()]/action[@index=" + index + "]");
});
apf.uirecorder.capture.addEventListener("capture.event", function(e){
    if ("dragstop|dragdrop".indexOf(e.event.name) > -1) {
        this.model.setQueryValue("test[last()]/action[@index=" 
          + this.actions.indexOf(e.stream) + "]/@element", 
            JSON.stringify(e.stream.element));
    }
});
apf.uirecorder.capture.addEventListener("capture.data", function(e){
    
});
//#endif


//#endif