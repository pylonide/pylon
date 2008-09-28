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

// #ifdef __WITH_APP

jpf.windowManager = {
    destroy: function(frm){
        //Remove All Cross Window References Created on Init by jpf.windowManager
        // for (var i = 0; i < this.globals.length; i++)
        //     frm.win[this.globals[i]] = null;
    },
    
    //root    : self,
    userdata: [],
    
    /* ********************************************************************
     FORMS
     *********************************************************************/
    forms   : new Array(),
    
    addForm: function(xmlFormNode){
        var x = {
            jml: xmlFormNode,
            show: function(){
                alert("not implemented");
            }
        };
        this.forms.push(jpf.setReference(x.name, x, true));
        return x;
    },
    
    getForm: function(value){
        for (var i = 0; i < this.forms.length; i++) 
            if (this.forms[i].name == value) 
                return this.forms[i];
        
        return this.forms.length ? this.forms[0] : false;
    },
    
    closeAll: function(){
        for (var i = 0; i < this.forms.length; i++) 
            if (this.forms[i].name != "main" && this.forms[i].type != "modal") 
                this.forms[i].hide();
    }
}

/* ****************
 FORM CLASS
 *****************/
/**
 * Object representing the window of the JML application
 *
 * @classDescription		This class creates a new window
 * @return {Window} Returns a new window
 * @type {Window}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.WindowImplementation = function(){
    jpf.register(this, "window", jpf.NOGUI_NODE);/** @inherits jpf.Class */
    this.jpf = jpf;
    
    this.toString = function(){
        return "[Javeline Component : " + (this.name || "") + " (jpf.window)]";
    }
    
    this.getActionTracker = function(){
        return this.$at
    }
    
    /* ***********************
     API
     ************************/
    this.loadCodeFile = function(url){
        //if(jpf.isSafari) return;
        if (self[url]) 
            jpf.importClass(self[url], true, this.win);
        else 
            jpf.include(url);//, this.document);
    }
    
    /*
     this.loadCodeFile = function(url){
     jpf.include(url, this.document);
     }*/
    this.flash = function(){
        if (jpf.isDeskrun) 
            jdwin.Flash();
    }
    
    this.show = function(){
        if (jpf.isDeskrun) 
            jdwin.Show();
    }
    
    this.hide = function(){
        if (jpf.isDeskrun) 
            jdwin.Hide();
        else {
            this.loaded = false;
            if (this.win) 
                this.win.close();
        }
    }
    
    this.focus = function(){
        if (jpf.isDeskrun) 
            jdwin.SetFocus();
        else 
            this.win.focus();
    }
    
    this.setIcon = function(url){
        if (jpf.isDeskrun) 
            jdwin.icon = parseInt(url) == url ? parseInt(url) : url;
    }
    
    this.setTitle = function(value){
        this.title = value || "";
        
        if (jpf.isDeskrun) 
            jdwin.caption = value;
        else 
            if (this.win && this.win.document) 
                this.win.document.title = (value || "");
    }
    
    /* ***********************
     Init
     ************************/
    this.loadJml = function(x){
        if (x[jpf.TAGNAME] == "deskrun") 
            this.loadDeskRun(x);
        else {
        
        }
    }
    
    //#ifdef __DESKRUN
    var jdwin   = jpf.isDeskrun ? window.external : null;
    var jdshell = jpf.isDeskrun ? jdwin.shell : null;

    this.loadDeskRun = function(q){
        jdwin.style = q.getAttribute("style") || "ismain|taskbar|btn-close|btn-max|btn-min|resizable";
        
        jpf.appsettings.drRegName = q.getAttribute("record");
        if (q.getAttribute("minwidth")) 
            jdwin.setMin(q.getAttribute("minwidth"), q.getAttribute("minheight"));
        if (q.getAttribute("record")
          && jdshell.RegGet(jpf.appsettings.drRegName + "/window")) {
            var winpos = jdshell.RegGet(jpf.appsettings.drRegName + "/window");
            if (winpos) {
                winpos = winpos.split(",");
                window.external.width  = Math.max(q.getAttribute("minwidth"),
                    Math.min(parseInt(winpos[2]),
                    window.external.shell.GetSysValue("deskwidth")));
                window.external.height = Math.max(q.getAttribute("minheight"),
                    Math.min(parseInt(winpos[3]),
                    window.external.shell.GetSysValue("deskheight")));
                window.external.left   = Math.max(0, Math.min(parseInt(winpos[0]),
                    screen.width - window.external.width));
                window.external.top    = Math.max(0, Math.min(parseInt(winpos[1]),
                    screen.height - window.external.height));
            }
        } else {
            jdwin.left   = q.getAttribute("left")   || 200;
            jdwin.top    = q.getAttribute("top")    || 200;
            jdwin.width  = q.getAttribute("width")  || 800;
            jdwin.height = q.getAttribute("height") || 600;
        }
        
        jdwin.caption = q.getAttribute("caption") || "Javeline DeskRun";
        jdwin.icon    = q.getAttribute("icon") || 100;
        
        var ct = $xmlns(q, "context", jpf.ns.jpf);
        if (ct.length) {
            ct = ct[0];
            if (!jpf.appsettings.tray) 
                jpf.appsettings.tray = window.external.CreateWidget("trayicon")
            var tray = jpf.appsettings.tray;
            
            tray.icon = q.getAttribute("tray") || 100;
            tray.tip  = q.getAttribute("tooltip") || "Javeline DeskRun";
            tray.PopupClear();
            tray.PopupItemAdd("Exit", 3);
            tray.PopupItemAdd("SEP", function(){});
            
            var nodes = ct.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType != 1) 
                    continue;
                
                if (nodes[i][jpf.TAGNAME] == "divider") {
                    tray.PopupItemAdd("SEP", function(){});
                }
                else {
                    tray.PopupItemAdd(jpf.getXmlValue(nodes[i], "."),
                        nodes[i].getAttribute("href")
                        ? new Function("window.open('" + nodes[i].getAttribute("href") + "')")
                        : new Function(nodes[i].getAttribute("onclick")));
                }
            }
        }
        
        jdwin.shell.debug = jpf.debug ? 7 : 0;
        jdwin.Show();
        jdwin.SetFocus();
    }
    //#endif
    
    /* ******** FOCUS METHODS *********
     Methods handling focus in
     the form object.
     *********************************/
    this.$f = Array();
    
    //@todo change this to use scoped variables
    
    this.$focus = function(o, norun){
        if (this.$fObject == o) 
            return;
            
        if (this.$fObject) 
            this.$fObject.blur(true);

        (this.$fObject = o).focus(true);
        
        if (this.onmovefocus) 
            this.onmovefocus(this.$fObject);
        
        //#ifdef __WITH_XFORMS
        o.dispatchEvent("xforms-focus");
        o.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        jpf.console.info("Focus given to " + this.$fObject.tagName + 
            " [" + (this.$fObject.name || "") + "]");
        //#endif
            
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime)
            jpf.offline.state.set(this, "focus", o.name || o.uniqueId);
        //#endif
    }
    
    this.$clearFocus = function(){
        if (!jpf.window.$fObject)
            return;
        
        //Especially for focussing elements
        jpf.window.$fObject.blur(true);
        //me.$fObject.focus(true);
        jpf.window.$fObject = null;
        
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime)
            jpf.offline.state.set(this, "focus", -1);
        //#endif
    }
    
    this.$blur = function(o){
        //NOT A GOOD SOLUTION
        if (this.$fObject == o) 
            this.$fObject = null;
        if (this.onmovefocus) 
            this.onmovefocus(this.$fObject);
        
        //#ifdef __WITH_XFORMS
        o.dispatchEvent("DOMFocusOut");
        //#endif
    }
    
    this.isFocussed = function(o){
        return this.$fObject == o;
    }
    this.getFocussedObject = function(){
        return this.$fObject;
    }
    
    this.$focusLast = function(o){
        if (o.$lastFocussed)
            jpf.window.$focus(o.$lastFocussed);
    }
    
    function trackChildFocus(e){
        if (e.srcElement == this)
            return;

        this.$lastFocussed = e.srcElement;
    }
    
    this.$addFocus = function(o, tabIndex){
        if (o.$FID == null) 
            o.$FID = tabIndex !== null ? tabIndex : this.$f.length;
        
        var cComp = this.$f[o.$FID];
        if (cComp && cComp.jml && !cComp.jml.getAttribute("tabseq")) {
            //cComp.setTabIndex(this.$f.length);
            this.$f[o.$FID] = null;
            cComp.$FID = this.$f.push(cComp) - 1;
        }
        
        //#ifdef __DEBUG
        if (this.$f[o.$FID] && this.$f[o.$FID] != o) {
            throw new Error(jpf.formatErrorString(1027, null, 
                "Tab switching", 
                "TabIndex Already in use: '" + o.$FID + "' for " 
                + o.toString() + ".\n It's in use by " + cComp.toString()));
        }
        //#endif
        
        this.$f[o.$FID] = o;
        o.tabIndex = tabIndex;

        if (o.canHaveChildren)
            o.addEventListener("focus", trackChildFocus);
    }
    
    this.$removeFocus = function(o){
        this.$f[o.tabIndex] = null;
        delete this.$f[o.tabIndex];
        
        if (o.canHaveChildren)
            o.removeEventListener("focus", trackChildFocus);
    }
    
    this.moveNext = function(shiftKey, relObject){
        var next = null, o = relObject || jpf.window.$fObject, start = o ? o.$FID : jpf.window.$f.length;
        
        if (jpf.window.$fObject && jpf.window.$f.length < 2) 
            return;
        
        do {
            next = (o ? parseInt(o.$FID) + (shiftKey ? -1 : 1) : (next != null ? next + (shiftKey ? -1 : 1) : 0));
            
            if (start == next) 
                return; //No visible enabled element was found
            if (next >= jpf.window.$f.length) 
                next = 0;
            else 
                if (next < 0) 
                    next = jpf.window.$f.length - 1;
            
            o = jpf.window.$f[next];
            
        }
        while (!o || o.disabled || o == jpf.window.$fObject
          || (o.oExt && !o.oExt.offsetHeight) || !o.$focussable);
        
        jpf.window.$focus(o);
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (shiftKey ? "previous" : "next"));
        //#endif
    }
    
    this.focusDefault = function(){
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled) {
            var node, id = jpf.offline.state.get(this, "focus");
            
            if (id == -1)
                return this.$clearFocus();
            
            if (id)
                node = self[id] || jpf.lookup(id);
            
            if (node) {
                if (!node.$focussable) {
                    //#idef __DEBUG
                    jpf.console.warn("Invalid offline state detected. The \
                                      application was probably changed in \
                                      between sessions. Resetting offline state\
                                      and rebooting.");
                    //#endif
                    
                    jpf.offline.clear();
                    jpf.offline.reboot();
                }
                else {
                    this.$focus(node);
                    return;
                }
            }
        }
        //#endif
        
        this.moveNext();
    }
    
    /** Set Events **/
    
    /* ***********************
        Set Window events
    ************************/
    
    window.onbeforeunload = function(){
        if (!jpf.window) return;
        
        //#ifdef __DESKRUN
        if (jpf.isDeskrun) {
            window.external.shell.RegSet(jpf.appsettings.drRegName + "/window", 
                window.external.left + "," + window.external.top + ","
                + window.external.width + "," + window.external.height);
        }
        //#endif
        
        var returnValue = jpf.dispatchEvent("exit");
        //if(jpf.window.isActive()) jpf.getRoot().activeWindow = null;
        
        return returnValue;
    }
    
    if (jpf.isDeskrun)
        window.external.onbeforeunload = window.onbeforeunload;
    
    window.onunload = function(){
        if (!jpf.window) return;
    
        jpf.window.isExiting = true;
        jpf.window.destroy();
    
        //if(jpf.isDeskrun)
            //window.external.shell.RegSet(jpf.appsettings.drRegName + "/window",window.external.left + "," + window.external.top + "," + window.external.width + "," + window.external.height);
    }
    
    window.onfocus = function(){
        if (!jpf.window) return;
    
        /*var k = jpf.getRoot();
        //if(k.wtimer) clearTimeout(k.wtimer);
        k.activeWindow = self;*/
    
        if (jpf.window.onfocus)
            jpf.window.onfocus();
    }
    
    window.onblur = function(){
        if (!jpf.window) return;
    
        //if(document.activeElement != document.body)
            //jpf.getRoot().wtimer = setTimeout("jpf.getRoot().activeWindow = null;", 100);
        
        if (jpf.window.onblur)
            jpf.window.onblur();
    }
    
    
    /* *****************************
    
        KEYBOARD & FOCUS HANDLING
        
    ******************************/
    
    document.oncontextmenu = function(e){
        if (jpf.dispatchEvent("contextmenu", e || event) === false)
            return false;
    
        if (jpf.appsettings.disableRightClick)
            return false;
    }
    
    document.onmousedown = function(e){
        if (!e) e = event;
        var o = jpf.findHost(jpf.hasEventSrcElement ? e.srcElement : e.target);

        if (!o && jpf.window && jpf.window.$fObject) {
            jpf.window.$clearFocus();
        }
        //jpf.window.$f.contains(o)
        else if (jpf.window && !o.disabled && o.focussable !== false) {
            if (o.$focussable === jpf.KEYBOARD_MOUSE)
                jpf.window.$focus(o);
            else if (o.canHaveChildren)
                jpf.window.$focusLast(o);
        }
        
        //Contextmenu
        if (e.button == 2 && o)
            o.dispatchEvent("contextmenu", {htmlEvent : e});
        
        if (self.jpf.JmlParser && !self.jpf.appsettings.allowSelect 
          /* #ifdef __WITH_DRAGMODE */
          || jpf.dragmode.mode
          /* #endif */
          ) //Non IE
            return false;
    }
    
    document.onselectstart = function(){
        if (self.jpf.JmlParser && !self.jpf.appsettings.allowSelect
          /* #ifdef __WITH_DRAGMODE */
          || jpf.dragmode.mode
          /* #endif */
          ) //IE
            return false;
    }
    
    // Keyboard forwarding to focussed object
    document.onkeyup = function(e){
        if (!e) e = event;
        
        if (jpf.window && jpf.window.$fObject 
          && !jpf.window.$fObject.disableKeyboard
          && jpf.window.$fObject.dispatchEvent("keyup", {
                keyCode  : e.keyCode, 
                ctrlKey  : e.ctrlKey, 
                shiftKey : e.shiftKey, 
                altKey   : e.altkey, 
                htmlEvent : e
            }) === false) {
            return false;
        }

        jpf.dispatchEvent("keyup", null, e);
    }
    

    // #ifdef __WITH_APP || __DEBUG
    
    document.onkeydown = function(e){
        if (!e)
            e = event;
    
        //#ifdef __WITH_CONTEXTMENU
        //Contextmenu handling
        if (e.keyCode == 93 && jpf.window.getFocussedObject()) {
            var o   = jpf.window.getFocussedObject();
            var pos = o.value
                ? jpf.getAbsolutePosition(o.selected)
                : jpf.getAbsolutePosition(o.oExt);
                
            o.dispatchEvent("contextmenu", {
                htmlEvent: {
                    clientX : pos[0] + 10 - document.documentElement.scrollLeft,
                    clientY : pos[1] + 10 - document.documentElement.scrollTop
                }
            });
        }
        // #endif
        
        //#ifdef __WITH_ACTIONTRACKER
        if (jpf.appsettings.useUndoKeys) {
            //Ctrl-Z - Undo
            if (e.keyCode == 90 && e.ctrlKey) {
                (jpf.window.$fObject || jpf.window).getActionTracker().undo();
            }
            //Ctrl-Z - Redo
            else if (e.keyCode == 89 && e.ctrlKey) {
                (jpf.window.$fObject || jpf.window).getActionTracker().redo();
            }
        }
        //#endif
    
        //Hotkey
        if (jpf.dispatchEvent("hotkey", e) === false) {
            e.returnValue = false;
            e.cancelBubble = true;
            if (jpf.canDisableKeyCodes)
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            return false;
        }
        
        //#ifdef __WITH_APP
        if (!jpf.window) 
            return;
        
        //Keyboard forwarding to focussed object
        if (jpf.window.$fObject && !jpf.window.$fObject.disableKeyboard
          && jpf.window.$fObject.dispatchEvent("keydown", e) === false) {
            e.returnValue  = false;
            e.cancelBubble = true;
            
            if (jpf.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            
            return false;
        } 
        
        //Focus handling
        else if (e.keyCode == 9 && jpf.window.$f.length > 1) {
            if (!jpf.currentMenu)
                jpf.window.moveNext(e.shiftKey);
            
            e.returnValue = false;
            return false;
        }
        
        //Disable backspace behaviour triggering the backbutton behaviour
        if (jpf.appsettings.disableBackspace && e.keyCode == 8) {
            e.keyCode = 0;
        }
        
        //Disable space behaviour of scrolling down the page
        /*if(Application.disableSpace && e.keyCode == 32 && e.srcElement.tagName.toLowerCase() != "input"){
            e.keyCode = 0;
            e.returnValue = false;
        }*/
        
        //Disable F5 refresh behaviour
        if (jpf.appsettings.disableF5 && e.keyCode == 116) {
            e.keyCode = 0;
            //return false;
        }
        
        if (e.keyCode == 27) { //or up down right left pageup pagedown home end unless body is selected
            e.returnValue = false;
        }
        
        jpf.dispatchEvent("keydown", null, e);
        
        //#endif
    }
    
    // #endif

    
    /* ********************************
     Destroy
     *********************************/
    this.destroy = function(){
        this.$at = null;
        
        jpf.destroy(this);
        jpf.windowManager.destroy(this);
        jpf = this.win = this.window = this.document = null;
        
        window.onfocus = window.onerror = window.onunload
            = window.onbeforeunload = window.onblur = null;
        
        document.body.innerHTML = "";
    }
}

/**
 * Object representing the document of the JML application.
 *
 * @classDescription		This class creates a new document
 * @return {Document} Returns a new document
 * @type {Document}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.DocumentImplementation = function(){
    jpf.makeClass(this);
    
    //#ifdef __WITH_JMLDOM
    this.inherit(jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
    //#endif
    
    this.nodeType    = jpf.DOC_NODE;
    this.$jmlLoaded = true;
    this.jml         = jpf.JmlParser.jml; //@todo Move this to the documentElement
    
    this.getElementById = function(id){
        return self[id];
    }
    
    //#ifdef __WITH_DOM_COMPLETE
    /**
     * Creates a new JML Node
     */
    this.createElement = function(tagName){
        var x, o;

        //We're supporting the nice IE hack
        if (tagName.nodeType) {
            x = tagName;
        }
        else if (tagName.indexOf("<") > -1) {
            x = jpf.getXml(tagName)
        }
        else {
            var prefix = jpf.findPrefix(jpf.JmlParser.jml, jpf.ns.jpf);
            var doc = jpf.JmlParser.jml.ownerDocument;
            
            if(jpf.JmlParser.jml && doc.createElementNS) {
                x = doc.createElementNS(jpf.ns.jpf, prefix + ":" + tagName);
            }
            else {
                x = jpf.getXml("<" + prefix + ":" + tagName + " xmlns:" 
                               + prefix + "='" + jpf.ns.jpf + "' />", true);
                x.ownerDocument.setProperty("SelectionNamespaces",
                        "xmlns:" + prefix + "='" + jpf.ns.jpf + "'");
            }
        }
        
        tagName = x[jpf.TAGNAME];
        var initId;
        
        if (typeof jpf[tagName] != "function") { //Call JMLParser??
            o = new jpf.JmlDomApi(tagName, null, jpf.NOGUI_NODE, x);
            if (jpf.JmlParser.handler[tagName]) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$jmlLoaded)
                        return; //the jmlParser will handle the rest
                    
                    o = jpf.JmlParser.handler[tagName](this.jml, 
                        pNode, pNode.oInt);
                    
                    if (o) jpf.extend(this, o); //ruins prototyped things
                    
                    //Add this component to the nameserver
                    if (o && this.name)
                        jpf.nameserver.register(tagName, this.name, o);
                    
                    if (this.name)
                        jpf.setReference(name, o);
                    
                    o.$jmlLoaded = true;
                }) - 1;
            }
        }
        else {
            o = new jpf[tagName](null, tagName, x);
            if (o.loadJml) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;
                    
                    if (!pNode.$jmlLoaded) //We're not ready yet
                        return; 
                    
                    function loadJml(o, pHtmlNode){
                        if (!o.$jmlLoaded) {
                            //Process JML
                            o.pHtmlNode = pHtmlNode || document.body;
                            o.loadJml(o.jml);
                            o.$jmlLoaded = false; //small hack
        
                            for (var i = 0, l = o.childNodes.length; i < l; i++) {
                                if (o.childNodes[i].loadJml) {
                                    loadJml(o.childNodes[i], o.canHaveChildren 
                                        ? o.oInt 
                                        : document.body);
                                }
                                else
                                    o.childNodes[i].$jmlLoaded = true;
                            }
                        }
                        if (o.$reappendToParent) {
                            o.$reappendToParent();
                        }
                        
                        o.$jmlLoaded = true;
                        o.$reappendToParent = null;
                    }

                    var parsing = jpf.isParsing;
                    jpf.isParsing = true;
                    jpf.JmlParser.parseFirstPass([x]);
                
                    loadJml(o, pNode && pNode.oInt || document.body);
                    
                    //#ifdef __WITH_ALIGNMENT
                    if (pNode && pNode.pData)
                        jpf.layout.compileAlignment(pNode.pData);
                    //#endif

                    //#ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
                    if (pNode.pData)
                        jpf.layout.activateRules(pNode.oInt || document.body);
                    jpf.layout.activateRules();//@todo maybe use processQueue
                    //#endif
                    
                    jpf.JmlParser.parseLastPass();
                    jpf.isParsing = parsing;
                }) - 1;
            }
        }
        
        if (o.name)
            jpf.setReference(o.name, o);
        
        o.jml = x;
        
        return o;
    }
    //#endif
}

// #endif
