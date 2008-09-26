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
        return this.__at
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
    this.__f = Array();
    
    //@todo change this to use scoped variables
    
    this.__focus = function(o, norun){
        //CHANGE THIS FUNCTION TO DETECT IF OBJECT IS VISIBLE
        if (this.__fObject == o) 
            return;
        if (this.__fObject) 
            this.__fObject.blur(true);
        //if(this.__fObject) this.__fObject.oExt.style.border = "2px solid black";
        (this.__fObject = o).focus(true);
        //if(o.oExt) o.oExt.style.border = "2px solid red";
        
        if (this.onmovefocus) 
            this.onmovefocus(this.__fObject);
        
        //#ifdef __WITH_XFORMS
        o.dispatchEvent("xforms-focus");
        o.dispatchEvent("DOMFocusIn");
        //#endif

        jpf.console.info("Focus given to " + this.__fObject.tagName + 
            " [" + (this.__fObject.name || "") + "]");
            
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime)
            jpf.offline.state.set(this, "focus", o.name || o.uniqueId);
        //#endif
    }
    
    this.__clearFocus = function(){
        if (!jpf.window.__fObject)
            return;
        
        //Especially for focussing elements
        jpf.window.__fObject.blur(true);
        //me.__fObject.focus(true);
        jpf.window.__fObject = null;
        
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime)
            jpf.offline.state.set(this, "focus", -1);
        //#endif
    }
    
    this.__blur = function(o){
        //NOT A GOOD SOLUTION
        if (this.__fObject == o) 
            this.__fObject = null;
        if (this.onmovefocus) 
            this.onmovefocus(this.__fObject);
        
        //#ifdef __WITH_XFORMS
        o.dispatchEvent("DOMFocusOut");
        //#endif
    }
    
    this.isFocussed = function(o){
        return this.__fObject == o;
    }
    this.getFocussedObject = function(){
        return this.__fObject;
    }
    
    this.__removeFocus = function(o){
        this.__f[o.tabIndex] = null;
        delete this.__f[o.tabIndex];
    }
    
    this.__addFocus = function(o, tabIndex){
        if (o.__FID == null) 
            o.__FID = tabIndex !== null ? tabIndex : this.__f.length;
        
        var cComp = this.__f[o.__FID];
        if (cComp && cComp.jml && !cComp.jml.getAttribute("tabseq")) {
            //cComp.setTabIndex(this.__f.length);
            this.__f[o.__FID] = null;
            cComp.__FID = this.__f.push(cComp) - 1;
            
        }
        
        if (this.__f[o.__FID] && this.__f[o.__FID] != o) 
            throw new Error(jpf.formatErrorString(1027, null, "Tab switching", "TabIndex Already in use: '" + o.__FID + "' for " + o.toString() + ".\n It's in use by " + cComp.toString()));
        
        this.__f[o.__FID] = o;
        o.tabIndex = tabIndex;
    }
    
    this.moveNext = function(shiftKey, relObject){
        var next = null, o = relObject || jpf.window.__fObject, start = o ? o.__FID : jpf.window.__f.length;
        
        if (jpf.window.__fObject && jpf.window.__f.length < 2) 
            return;
        
        do {
            next = (o ? parseInt(o.__FID) + (shiftKey ? -1 : 1) : (next != null ? next + (shiftKey ? -1 : 1) : 0));
            
            if (start == next) 
                return; //No visible enabled element was found
            if (next >= jpf.window.__f.length) 
                next = 0;
            else 
                if (next < 0) 
                    next = jpf.window.__f.length - 1;
            
            o = jpf.window.__f[next];
            
        }
        while (!o || o.disabled || o == jpf.window.__fObject
          || (o.oExt && !o.oExt.offsetHeight) || !o.__focussable);
        
        jpf.window.__focus(o);
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (shiftKey ? "previous" : "next"));
        //#endif
    }
    
    this.focusDefault = function(){
        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled) {
            var node, id = jpf.offline.state.get(this, "focus");
            
            if (id == -1)
                return this.__clearFocus();
            
            if (id)
                node = self[id] || jpf.lookup(id);
            
            if (node) {
                if (!node.__focussable) {
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
                    this.__focus(node);
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
        
        var returnValue = jpf.dispatchEvent("onexit");
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
        if (jpf.dispatchEvent("oncontextmenu", e || event) === false)
            return false;
    
        if (jpf.appsettings.disableRightClick)
            return false;
    }
    
    document.onmousedown = function(e){
        if (!e) e = event;
        var o = jpf.findHost(jpf.hasEventSrcElement ? e.srcElement : e.target);
    
        if (jpf.window && jpf.window.__f.contains(o) && !o.disabled && o.__focussable)
            jpf.window.__focus(o);
        else if (jpf.window && jpf.window.__fObject) {
            jpf.window.__clearFocus();
        }
        
        //Hide current menu
        //if(self.jpf.currentMenu) jpf.currentMenu.hideMenu(true)
        
        //Contextmenu
        if (e.button == 2 && o) //jpf.window.getFocussedObject())
            o.dispatchEvent("oncontextmenu", {htmlEvent : e});
        
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
    
    document.onkeyup = function(e){
        if (!e) e = event;
        
        //KEYBOARD FORWARDING TO FOCUSSED OBJECT
        if (jpf.window && jpf.window.__fObject && !jpf.window.__fObject.disableKeyboard
          && jpf.window.__fObject.keyUpHandler
          && jpf.window.__fObject.keyUpHandler(e.keyCode, e.ctrlKey, e.shiftKey, e.altkey, e) == false) {
            return false;
        }
    }
    

    // #ifdef __WITH_APP || __DEBUG
    
    document.onkeydown = function(e){
        if (!e) e = event;
    
        //#ifdef __WITH_APP
    
        if (jpf.currentMenu && e.keyCode == "27") 
            jpf.currentMenu.hideMenu(true);
            
        //Contextmenu handling
        if (e.keyCode == 93 && jpf.window.getFocussedObject()) {
            var pos, o = jpf.window.getFocussedObject();
            if (o.value)
                pos = jpf.getAbsolutePosition(o.selected);
            else
                pos = jpf.getAbsolutePosition(o.oExt);
                
            o.dispatchEvent("oncontextmenu", {
                htmlEvent: {
                    clientX: pos[0] + 10 - document.documentElement.scrollLeft,
                    clientY: pos[1] + 10 - document.documentElement.scrollTop
                }
            });
        }
    
        // #endif
    
        //HOTKEY
        if (jpf.dispatchEvent("onhotkey", e) === false) {
            e.returnValue = false;
            e.cancelBubble = true;
            if (jpf.canDisableKeyCodes)
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            return false;
        }
        
        //#ifdef __DEBUG
        if (jpf.dispatchEvent("ondebugkey", e) === false) {
            e.returnValue = false;
            e.cancelBubble = true;
            if (jpf.canDisableKeyCodes)
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            return false;
        }
        //#endif
        
        //#ifdef __WITH_APP
        
        if (!jpf.window) return;
        
        //DRAG & DROP
        if (jpf.window.dragging && e.keyCode == 27) {
            if (document.body.lastHost && document.body.lastHost.dragOut)
                document.body.lastHost.dragOut(jpf.dragHost); 
            return jpf.DragServer.stopdrag();
        }
        
        //KEYBOARD FORWARDING TO FOCUSSED OBJECT
        if (jpf.window && jpf.window.__fObject && !jpf.window.__fObject.disableKeyboard
          && jpf.window.__fObject.keyHandler
          && jpf.window.__fObject.keyHandler(e.keyCode, e.ctrlKey, e.shiftKey, e.altkey, e) === false) {
            e.returnValue  = false;
            e.cancelBubble = true;
            
            if (jpf.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            
            return false;
        } else if (e.keyCode == 9 && jpf.window.__f.length > 1) { //FOCUS HANDLING
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
        
        //#endif
    }
    
    // #endif

    
    /* ********************************
     Destroy
     *********************************/
    this.destroy = function(){
        this.__at = null;
        
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
    this.__jmlLoaded = true;
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
                               + prefix + "='" + jpf.ns.jpf + "' />");
                x.ownerDocument.setProperty("SelectionNamespaces",
                        "xmlns:" + prefix + "='" + jpf.ns.jpf + "'");
            }
        }
        
        tagName = x[jpf.TAGNAME];
        var initId;
        
        if (typeof jpf[tagName] != "function") { //Call JMLParser??
            o = new jpf.JmlDomApi(tagName, null, jpf.NOGUI_NODE, x);
            if (jpf.JmlParser.handler[tagName]) {
                initId = o.__domHandlers["reparent"].push(function(b, pNode){
                    this.__domHandlers.reparent[initId] = null;

                    if (!pNode.__jmlLoaded)
                        return; //the jmlParser will handle the rest
                    
                    o = jpf.JmlParser.handler[tagName](this.jml, 
                        pNode, pNode.oInt);
                    
                    if (o) jpf.extend(this, o); //ruins prototyped things
                    
                    //Add this component to the nameserver
                    if (o && this.name)
                        jpf.nameserver.register(tagName, this.name, o);
                    
                    if (this.name)
                        jpf.setReference(name, o);
                    
                    o.__jmlLoaded = true;
                }) - 1;
            }
        }
        else {
            o = new jpf[tagName](null, tagName, x);
            if (o.loadJml) {
                initId = o.__domHandlers["reparent"].push(function(b, pNode){
                    this.__domHandlers.reparent[initId] = null;
                    
                    if (!pNode.__jmlLoaded) //We're not ready yet
                        return; 
                    
                    function loadJml(o, pHtmlNode){
                        if (!o.__jmlLoaded) {
                            //Process JML
                            o.pHtmlNode = pHtmlNode || document.body;
                            o.loadJml(o.jml);
                            o.__jmlLoaded = false; //small hack
        
                            for (var i = 0, l = o.childNodes.length; i < l; i++) {
                                if (o.childNodes[i].loadJml) {
                                    loadJml(o.childNodes[i], o.canHaveChildren 
                                        ? o.oInt 
                                        : document.body);
                                }
                                else
                                    o.childNodes[i].__jmlLoaded = true;
                            }
                        }
                        if (o.__reappendToParent) {
                            o.__reappendToParent();
                        }
                        
                        o.__jmlLoaded = true;
                        o.__reappendToParent = null;
                    }

                    var parsing = jpf.isParsing;
                    jpf.isParsing = true;
                    jpf.JmlParser.parseFirstPass([x]);
                
                    loadJml(o);
                    
                    jpf.layout.processQueue();//activateRules();//@todo experimental!
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
