// #ifdef __WITH_UIRECORDER

/*
    Refactoring capturing:
    - Capture mouse and keyboard events (and touch events later)
    - For each event capture
        - A way to find the context node
            - AmlElement
                - AmlProperty
            - XmlElement
            - HTMLElement
        - Events Called
        - Properties Changed
        - HTTP Calls
        - Socket.io communication
        - XML Data in Models changed (RSB message format)
    - Specific Problems to solve:
        - Maintaining record of causal flow of async calls
            - setTimeout
            - HTTP
            - Socket.io
*/

apf.uirecorder.capture = {
    validKeys      : [ 37, 38, 39, 40,  //arrowkeys
                        27,             // Esc
                        16, 17, 18,     // Shift, Ctrl, Alt
                        13,             // Enter
                        8, 46, 36, 35,  // Backspace, Del, Home, End
                        9               // Tab
                      ],
    
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
    },
    
    // stop capturing, save recorded data in this.outputXml
    stop : function() {
        apf.uirecorder.isRecording = false;

        if (!this.lastStream.name)
            this.actions.length--;
        
        this.lastStream = null;
        
        $setTimeout = apf.uirecorder.setTimeout;
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
        apf.addListener(document, "dblclick", 
            _self.dblclick = function(e) {
                if (!_self.canCapture())
                    return;
                _self.captureHtmlEvent("dblclick", e || event);
            }, true);

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
    },
    
    nextStream : function(eventName){
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
        if (eventName == "dragstop" && !e.success || eventName == "dragdrop") {
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
        
        this.lastStream.events.push({
            name        : eventName,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            event       : this.getCleanCopy(e),
            element     : this.getElementLookupDef(null, target)
        });
    },
    
    capturePropertyChange : function(amlNode, prop, value, oldvalue) {
        var target = amlNode;
        if (!target || this.shouldIgnoreEvent(null, target)) 
            return;
            
        this.lastStream.properties.push({
            name        : prop,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            value       : this.getCleanCopy(value),
            oldvalue    : this.getCleanCopy(oldvalue),
            element     : this.getElementLookupDef(null, target)
        });
    },
    
    captureModelChange : function(params) {
        var target = params.amlNode;
        if (!target) 
            return;

        this.lastStream.data.push({
            name        : params.action,
            async       : this.lastStream.async,
            time        : new Date().getTime() - this.lastStream.abstime,
            xmlNode     : apf.xmlToXpath(params.xmlNode, params.amlNode.data),
            element     : this.getElementLookupDef(null, target)
            //@todo params.UndoObj??
        });
    },
    
    /**** UTIL Functions ****/
    
    shouldIgnoreEvent : function(eventName, amlNode){
        if ((amlNode.root && amlNode.isIE != undefined) 
          || ["html","head","body","script"].indexOf(amlNode.tagName) > -1) 
            return true;
            
        if (eventName && ["hotkey"].indexOf(eventName) > -1) 
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
    }
}
//#endif