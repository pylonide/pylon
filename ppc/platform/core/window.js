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

// #ifdef __WITH_WINDOW

/**
 * Object representing the window of the AML application. The semantic is
 * similar to that of a window in the browser, except that this window is not
 * the same as the JavaScript global object. It handles the focussing within
 * the document and several other events such as exit and the keyboard events.
 *
 * @class ppc.window
 * @inherits ppc.Class
 * @default_private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
/**
 * @event blur              Fires when the browser window loses focus.
 */
/**
 * @event focus             Fires when the browser window receives focus.
 *
 *
 */
ppc.window = function(){
    this.$uniqueId = ppc.all.push(this);
    this.ppc       = ppc;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[ppc.window]";
    };
    
    /**
     * Retrieves the primary {@link ppc.actiontracker action tracker} of the application.
     */
    this.getActionTracker = function(){
        return this.$at
    };

    /*
     * @private
     */
    this.loadCodeFile = function(url){
        //if(ppc.isWebkit) return;
        if (self[url])
            ppc.importClass(self[url], true, this.win);
        else
            ppc.include(url);//, this.document);
    };

    //#ifdef __WITH_TASKBAR_FLASHING
    /**
     * Flashes the task bar. This can be useful to signal the user that an
     * important event has occured. Only works in internet explorer under
     * certain conditions.
     */
    this.flash = function(){
        if (ppc.window.hasFocus() || ppc.isIphone)
            return;

        if (ppc.isDeskrun) {
            jdwin.Flash();
        }
        else if (ppc.isIE) {
            if (!this.popup)
                this.popup = window.createPopup();

            if (ppc.window.stopFlash)
                return;

            state += "x"

            function doFlash(nopopup) {
                if (ppc.window.hasFocus())
                    return;

                window.focus();

                function doPopup() {
                    if (ppc.window.hasFocus())
                        return;

                    this.popup.hide();
                    this.popup.show(0, 0, 0, 0, document.body);
                    this.popup.document.write("<body><script>\
                        document.p = window.createPopup();\
                        document.p.show(0, 0, 0, 0, document.body);\
                        </script></body>");
                    this.popup.document.focus();

                    clearInterval(this.flashTimer);
                    this.flashTimer = setInterval(function(){
                        if (!ppc.window.popup.isOpen
                          || !ppc.window.popup.document.p.isOpen) {
                            clearInterval(ppc.window.flashTimer);

                            if (!ppc.window.hasFocus()) {
                                ppc.window.popup.hide();
                                document.body.focus();
                                state = "d";
                                determineAction();
                            }
                            //when faster might have timing error
                        }
                    }, 10);
                }

                if (nopopup)
                    $setTimeout(function(){
                        doPopup.call(ppc.window)
                    }, 10);
                else
                    doPopup.call(ppc.window);
            }

            if ("TEXTAREA|INPUT|SELECT".indexOf(document.activeElement.tagName) > -1) {
                document.activeElement.blur();
                document.body.focus();
                ppc.window.stopFlash = true;
                $setTimeout(function(){
                    doFlash.call(ppc.window, true);
                    ppc.window.stopFlash = false;
                }, 10);
            }
            else {
                doFlash.call(ppc.window);
            }
        }
    };
    //#endif

    /**
     * Show the browser window.
     */
    this.show = function(){
        if (ppc.isDeskrun)
            jdwin.Show();
    };

    /**
     * Hide the browser window.
     */
    this.hide = function(){
        if (ppc.isDeskrun) {
            jdwin.Hide();
        }
        else {
            this.loaded = false;
            if (this.win)
                this.win.close();
        }
    };

    /**
     * Focus the browser window.
     */
    this.focus = function(){
        if (ppc.isDeskrun)
            jdwin.SetFocus();
        else
            window.focus();
    };

    /**
     * Set the icon of the browser window.
     * @param {String} url The location of the _.ico_ file.
     */
    this.setIcon = function(url){
        if (ppc.isDeskrun)
            jdwin.icon = parseInt(url) == url ? parseInt(url) : url;
    };

    /**
     * Set the title of the browser window.
     * @param {String} value The new title of the window.
     */
    this.setTitle = function(value){
        this.title = value || "";

        if (ppc.isDeskrun)
            jdwin.caption = value;
        else
            document.title = (value || "");
    };

    /*
     * @private
     */
    this.loadAml = function(x){
        if (x[ppc.TAGNAME] == "deskrun")
            this.loadDeskRun(x);
        /*else {

        }*/
    };

    //#ifdef __DESKRUN
    var jdwin   = ppc.isDeskrun ? window.external : null,
        jdshell = ppc.isDeskrun ? jdwin.shell     : null;

    /*
     * @private
     */
    this.loadDeskRun = function(q){
        jdwin.style = q.getAttribute("style")
            || "ismain|taskbar|btn-close|btn-max|btn-min|resizable";

        ppc.config.drRegName = q.getAttribute("record");
        if (q.getAttribute("minwidth"))
            jdwin.setMin(q.getAttribute("minwidth"), q.getAttribute("minheight"));
        if (q.getAttribute("record")
          && jdshell.RegGet(ppc.config.drRegName + "/window")) {
            var winpos = jdshell.RegGet(ppc.config.drRegName + "/window");
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
        }
        else {
            jdwin.left   = q.getAttribute("left")   || 200;
            jdwin.top    = q.getAttribute("top")    || 200;
            jdwin.width  = q.getAttribute("width")  || 800;
            jdwin.height = q.getAttribute("height") || 600;
        }

        jdwin.caption = q.getAttribute("caption") || "DeskRun";
        jdwin.icon    = q.getAttribute("icon") || 100;

        var ct = $xmlns(q, "context", ppc.ns.aml);
        if (ct.length) {
            ct = ct[0];
            if (!ppc.config.tray)
                ppc.config.tray = window.external.CreateWidget("trayicon")
            var tray = ppc.config.tray;

            tray.icon = q.getAttribute("tray") || 100;
            tray.tip  = q.getAttribute("tooltip") || "DeskRun";
            tray.PopupClear();
            tray.PopupItemAdd("Exit", 3);
            tray.PopupItemAdd("SEP", function(){});

            var nodes = ct.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType != 1)
                    continue;

                if (nodes[i][ppc.TAGNAME] == "divider") {
                    tray.PopupItemAdd("SEP", function(){});
                }
                else {
                    tray.PopupItemAdd(ppc.queryValue(nodes[i], "."),
                        nodes[i].getAttribute("href")
                        ? new Function("window.open('" + nodes[i].getAttribute("href") + "')")
                        : new Function(nodes[i].getAttribute("onclick")));
                }
            }
        }

        jdwin.shell.debug = ppc.debug ? 7 : 0;
        jdwin.Show();
        jdwin.SetFocus();
    };
    //#endif

    // *** Focus Internals *** //

    //#ifdef __WITH_VISIBILITYMANAGER
    this.vManager = new ppc.visibilitymanager();
    //#endif

    //#ifdef __WITH_ZMANAGER
    this.zManager = new ppc.zmanager();
    //#endif

    //#ifdef __WITH_FOCUS

    this.$tabList = [];

    this.$addFocus = function(amlNode, tabindex, isAdmin){
        if (!isAdmin) {
            amlNode.addEventListener("DOMNodeInserted", moveFocus);
            amlNode.addEventListener("DOMNodeRemoved", removeFocus);

            if (amlNode.$isWindowContainer > -2) {
                amlNode.addEventListener("focus", trackChildFocus);
                amlNode.addEventListener("blur", trackChildFocus);

                amlNode.$focusParent = amlNode;

                if (amlNode.$isWindowContainer > -1) {
                    if (!amlNode.$tabList)
                        amlNode.$tabList = [amlNode];
                    
                    this.$tabList.push(amlNode);
                    return;
                }
                else {
                    amlNode.$tabList = [amlNode];
                }
            }
        }

        var fParent = findFocusParent(amlNode),
            list    = fParent.$tabList;

        //#ifdef __DEBUG
        if (list[tabindex]) {
            ppc.console.warn("Aml node already exist for tabindex " + tabindex
                             + ". Will insert " + amlNode.tagName + " ["
                             + (amlNode.name || "") + "] before existing one");
        }
        //#endif

        if (!amlNode.$isWindowContainer)
            amlNode.$focusParent = fParent;
        else
            amlNode.$focusParent2 = fParent;

        if (list[tabindex])
            list.insertIndex(amlNode, tabindex);
        else if (tabindex || parseInt(tabindex) === 0)
            list[tabindex] = amlNode;
        else
            list.push(amlNode);
    };

    this.$removeFocus = function(amlNode){
        if (!amlNode.$focusParent)
            return;

        amlNode.$focusParent.$tabList.remove(amlNode);

        if (!amlNode.$isWindowContainer) {
            amlNode.removeEventListener("DOMNodeInserted", moveFocus);
            amlNode.removeEventListener("DOMNodeRemoved", removeFocus);
        }

        if (amlNode.$isWindowContainer > -2) {
            amlNode.removeEventListener("focus", trackChildFocus); 
            amlNode.removeEventListener("blur", trackChildFocus);
        }
    };

    var focusLoopDetect;
    this.$focus = function(amlNode, e, force){
        var aEl = this.activeElement;
        if (aEl == amlNode && !force)
            return; //or maybe when force do $focus

        //#ifdef __DEBUG
        var hadAlreadyFocus = aEl == amlNode;
        //#endif

        this.$settingFocus = amlNode;

        if (!e)
            e = {};

        e.toElement   = amlNode;
        e.fromElement = aEl;

        if (aEl && aEl != amlNode && focusLoopDetect != aEl) {
            focusLoopDetect = aEl;

            aEl.blur(true, e);

            //#ifdef __WITH_XFORMS
            amlNode.dispatchEvent("DOMFocusOut");
            //#endif
            
            if (focusLoopDetect != aEl)
                return false;
        }

        if (amlNode.$focussable != ppc.MENU || !ppc.activeElement) {
            ppc.activeElement = 
            this.document.activeElement = 
            this.document.documentElement.$lastFocussed = amlNode;
        }

        (ppc.window.activeElement = amlNode).focus(true, e);

        this.$settingFocus = null;

        ppc.dispatchEvent("movefocus", {
            toElement : amlNode
        });

        //#ifdef __WITH_XFORMS
        amlNode.dispatchEvent("xforms-focus");
        amlNode.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        if (!hadAlreadyFocus)
            ppc.console.info("Focus given to " + amlNode.localName +
                " [" + (amlNode.name || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (typeof ppc.offline != "undefined" && ppc.offline.state.enabled
          && ppc.offline.state.realtime)
            ppc.offline.state.set(this, "focus", amlNode.name || amlNode.$uniqueId);
        //#endif
    };

    this.$blur = function(amlNode){
        var aEl = this.activeElement;
        if (aEl != amlNode)
            return false;

        //#ifdef __DEBUG
        ppc.console.info(aEl.localName + " ["
            + (aEl.name || "") + "] was blurred.");
        //#endif

        aEl.$focusParent.$lastFocussed = null;
        
        if (aEl.$focussable != ppc.MENU) {
            ppc.activeElement = 
            this.document.activeElement = null;
        }

        ppc.window.activeElement = null;
        
        ppc.dispatchEvent("movefocus", {
            fromElement : amlNode
        });

        //#ifdef __WITH_XFORMS
        amlNode.dispatchEvent("DOMFocusOut");
        //#endif
    };
    
    var lastFocusParent;

    this.$focusDefault = function(amlNode, e){
        var fParent = findFocusParent(amlNode);
        this.$focusLast(fParent, e);
    };

    this.$focusRoot = function(e){
        var docEl = ppc.document.documentElement;
        if (this.$focusLast(docEl, e) === false) {
            //docEl.$lastFocussed = null;
            //this.moveNext(null, ppc.document.documentElement, true, e);
        }
    };

    this.$focusLast = function(amlNode, e, ignoreVisible){
        var lf = amlNode.$lastFocussed;

        if (lf && lf.parentNode && lf.$focussable === true
          && (ignoreVisible || lf.$ext.offsetHeight)) {
            this.$focus(lf, e, true);
        }
        else { //Let's find the object to focus first
            var next, node = amlNode, skip;
            while (node) {
                if (!skip && node.focussable !== false && node.$focussable === true && !node.$tabList
                  && (ignoreVisible || node.$ext && node.$ext.offsetHeight) && node.disabled < 1) {
                    this.$focus(node, e, true);
                    break;
                }
                
                //Walk sub tree
                if ((next = !skip && node.firstChild || !(skip = false) && node.nextSibling)) {
                    node = next;
                    if (node.$isWindowContainer > 0)
                        skip = true;
                }
                else if (node == amlNode) {
                    if (node.$isWindowContainer)
                        this.$focus(node, e, true);
                    return;
                }
                else {
                    do {
                        node = node.parentNode;
                    } while (node && !node.nextSibling && node != amlNode 
                      && !node.$isWindowContainer)
                    
                    if (node == amlNode) {
                        if (node.$isWindowContainer)
                            this.$focus(node, e, true);
                        return; //do nothing
                    }
                    
                    if (node) {
                        if (node.$isWindowContainer) {
                            this.$focus(node, e, true);
                            break;
                        }
                        
                        node = node.nextSibling;
                    }
                }
            }

            if (!node)
                this.$focus(ppc.document.documentElement);//return false;//

            /*@todo get this back from SVN
            var node, list = amlNode.$tabList;
            for (var i = 0; i < list.length; i++) {
                node = list[i];
                if (node.focussable !== false && node.$focussable === true
                  && (ignoreVisible || node.$ext.offsetHeight)) {
                    this.$focus(node, e, true);
                    return;
                }
            }

            this.$focus(ppc.document.documentElement);*/
        }
    };

    function trackChildFocus(e){
        if (e.name == "blur") {
            if (e.srcElement != this && this.$blur)
                this.$blur();
            return;
        }
        
        if (e.srcElement != this && this.$focus && (!e || !e.mouse || this.$focussable == ppc.KEYBOARD_MOUSE))
            this.$focus();
        
        if (e.srcElement == this || e.trackedChild) {
            e.trackedChild = true;
            return;
        }

        this.$lastFocussed = e.srcElement;

        if (this.localName && this.localName.indexOf("window") > -1)
            e.trackedChild = true;
    }

    function findFocusParent(amlNode){
        var node = amlNode;
        do {
            node = node.parentNode;
        } while(node && !node.$isWindowContainer);
        //(!node.$focussable || node.focussable === false)

        return node || ppc.document.documentElement;
    }

    //Dom handler
    //@todo make this look at the dom tree insertion point to determine tabindex
    function moveFocus(e){
        if (e && e.currentTarget != this)
            return;
        
        if (this.$isWindowContainer)
            ppc.window.$tabList.pushUnique(this);
        else
            ppc.window.$addFocus(this, this.tabindex, true)
    }

    //Dom handler
    function removeFocus(e){
        if (e && (e.currentTarget != this || e.$doOnlyAdmin))
            return;

        //@todo ppc3.0 this should be fixed by adding domremovenode events to all children
        var list  = this.$focusParent.$tabList;
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            list.remove(nodes[i]); //@todo assuming no windows here
        }

        if (ppc.window.activeElement == this)
            ppc.window.moveNext();
        
        if (this.$isWindowContainer) {
            ppc.window.$tabList.remove(this); //@todo this can't be right
            return;
        }

        if (!this.$focusParent)
            return;

        list.remove(this);
        //this.$focusParent = null; //@experimental to not execute this
    }

    // *** Focus API *** //

    /**
     * Determines whether a given AML element has the focus.
     * @param {ppc.AmlElement} The element to check
     * @returns {Boolean} Indicates whether the element has focus.
     */
    this.hasFocus = function(amlNode){
        return this.activeElement == amlNode;
    };

    /*
     * @private
     */
    this.moveNext = function(shiftKey, relObject, switchWindows, e){
        if (switchWindows && ppc.window.activeElement) {
            var p = ppc.window.activeElement.$focusParent;
            if (p.visible && p.modal)
                return false;
        }

        var dir, start, next,
            amlNode = relObject || ppc.window.activeElement,
            fParent = amlNode
                ? (switchWindows && amlNode.$isWindowContainer 
                  && amlNode.$isWindowContainer != -1
                    ? ppc.window
                    : e && e.innerList ? amlNode.$focusParent : amlNode.$focusParent2 || amlNode.$focusParent)
                : ppc.document.documentElement,
            list    = fParent.$tabList;

        if (amlNode && (switchWindows || amlNode != ppc.document.documentElement)) {
            start   = (list || []).indexOf(amlNode);
            if (start == -1) {
                //#ifdef __DEBUG
                ppc.console.warn("Moving focus from element which isn't in the list\
                                  of it's parent. This should never happen.");
                //#endif

                return;
            }
        }
        else {
            start = -1;
        }

        if (this.activeElement == amlNode
          && list.length == 1 || list.length == 0)
            return false;

        dir  = (shiftKey ? -1 : 1);
        next = start;
        if (start < 0)
            start = 0;
        do {
            next += dir;

            if (next >= list.length)
                next = 0;
            else if (next < 0)
                next = list.length - 1;

            if (start == next && amlNode) {
                if (list[0].$isWindowContainer)
                    this.$focus(list[0], e);
                
                return false; //No visible enabled element was found
            }

            amlNode = list[next];
        }
        while (amlNode && (
               amlNode.disabled > 0
            || amlNode == ppc.window.activeElement
            || (switchWindows ? !amlNode.visible : amlNode.$ext && !amlNode.$ext.offsetHeight)
            || amlNode.focussable === false
            || switchWindows && !amlNode.$tabList.length
        ));
        
        if (!amlNode)
            return;

        if (fParent == ppc.window && amlNode.$isWindowContainer != -2) {
            this.$focusLast(amlNode, {mouse:true}, switchWindows);
        }
        else {
            (e || (e = {})).shiftKey = shiftKey;
            this.$focus(amlNode, e);
        }

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-" + (shiftKey ? "previous" : "next"));
        //#endif
    };

    /*
     * @private
     */
    this.focusDefault = function(){
        //#ifdef __WITH_OFFLINE_STATE
        if (typeof ppc.offline != "undefined" && ppc.offline.state.enabled) {
            var node, id = ppc.offline.state.get(this, "focus");

            if (id == -1)
                return this.$focusRoot();

            if (id)
                node = self[id] || ppc.lookup(id);

            if (node) {
                if (!node.$focussable) {
                    //#ifdef __DEBUG
                    ppc.console.warn("Invalid offline state detected. The "
                                   + "application was probably changed in "
                                   + "between sessions. Resetting offline state "
                                   + "and rebooting.");
                    //#endif

                    ppc.offline.clear();
                    ppc.offline.reboot();
                }
                else {
                    this.$focus(node);
                    return;
                }
            }
        }
        //#endif

        if (this.moveNext() === false)
            this.moveNext(null, ppc.document.documentElement, true)
    };

    //#endif

    // *** Set Window Events *** //

    ppc.addListener(window, "beforeunload", function(){
        return ppc.dispatchEvent("exit");
    });

    //@todo ppc3.x why is this loaded twice
    ppc.addListener(window, "unload", function(){
        if (!ppc)
            return;
        
        ppc.window.isExiting = true;
        ppc.window.destroy();
    });

    //#ifdef __WITH_WINDOW_FOCUS

    var timer, state = "", last = "";
    this.$focusfix = function(){
        // #ifdef __SUPPORT_IPHONE
        if (ppc.isIphone) return;
        // #endif
        state += "a";
        clearTimeout(timer);
        $setTimeout("window.focus();");
        timer = $setTimeout(determineAction);
    };

    this.$focusfix2 = function(){
        // #ifdef __SUPPORT_IPHONE
        if (ppc.isIphone) return;
        // #endif
        state += "b";
        clearTimeout(timer);
        timer = $setTimeout(determineAction);
    };

    this.$blurfix = function(){
        // #ifdef __SUPPORT_IPHONE
        if (ppc.isIphone) return;
        // #endif
        state += "c";
        clearTimeout(timer);
        timer = $setTimeout(determineAction);
    };

    function determineAction(){
        clearTimeout(timer);

        //ppc.console.info(state);
        if (state == "e" || state == "c"
          || state.charAt(0) == "x" && !state.match(/eb$/)
          || state == "ce" || state == "de") { //|| state == "ae"
            if (last != "blur") {
                last = "blur";
                ppc.window.dispatchEvent("blur");
                //ppc.console.warn("blur");
            }
        }
        else {
            if (last != "focus") {
                last = "focus";
                ppc.window.dispatchEvent("focus");
                //ppc.console.warn("focus");
            }
        }

        state = "";
        timer = null;
    }

    ppc.addListener(window, "focus", this.$focusevent = function(){
        // #ifdef __SUPPORT_IPHONE
        if (ppc.isIphone)
            return ppc.window.dispatchEvent("focus");
        // #endif
        if (ppc.hasFocusBug) {
            state += "d";
            clearTimeout(timer);
            timer = $setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "focus";
            //ppc.console.warn("win-focus");
            iframeFixTimer = $setTimeout(iframeFix, 10);
        }
    });

    ppc.addListener(window, "blur", this.$blurevent = function(){
        if (!ppc) return;
        
        // #ifdef __SUPPORT_IPHONE
        if (ppc.isIphone)
            return ppc.window.dispatchEvent("blur");
        // #endif
        if (ppc.hasFocusBug) {
            state += "e";
            clearTimeout(timer);
            timer = $setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "blur";
            //ppc.console.warn("win-blur");
            iframeFixTimer = $setTimeout(iframeFix, 10);
        }
    });

    var iframeFixTimer;
    function iframeFix(){
        clearTimeout(iframeFixTimer);

        var newState = iframeFix.newState;
        if (last == newState)
            return;

        last = newState;

        ppc.dispatchEvent(last);
        //ppc.console.warn(last);
    }

    this.hasFocus = function(){
        return (last == "focus");
    };

    //#endif

    // *** Keyboard and Focus Handling *** //

    ppc.addListener(document, "contextmenu", function(e){
        if (!e)
            e = event;

        //#ifdef __AMLCONTEXTMENU
        var pos, ev,
            amlNode = ppc.findHost(e.srcElement || e.target)
              || ppc.window.activeElement
              || ppc.document && ppc.document.documentElement;

        if (amlNode && amlNode.localName == "menu") //The menu is already visible
            return false;


        //if (amlNode && amlNode.localName == "menu")
            //amlNode = amlNode.parentNode;

        if (ppc.contextMenuKeyboard) {
            if (amlNode) {
                pos = amlNode.selected
                    ? ppc.getAbsolutePosition(amlNode.$selected)
                    : ppc.getAbsolutePosition(amlNode.$ext || amlNode.$pHtmlNode);
            }
            else {
                pos = [0, 0];
            }

            ev = {
                x         : pos[0] + 10 + document.documentElement.scrollLeft,
                y         : pos[1] + 10 + document.documentElement.scrollTop,
                amlNode   : amlNode,
                htmlEvent : e
            }
        }
        else {
            if (e.htmlEvent) {
                ev = e;
            }
            else {
                ev = { //@todo probably have to deduct the border of the window
                    x         : e.clientX + document.documentElement.scrollLeft,
                    y         : e.clientY + document.documentElement.scrollTop,
                    htmlEvent : e
                }
            }
        }

        ev.bubbles = true; //@todo discuss this, are we ok with bubbling?

        ppc.contextMenuKeyboard = null;

        if ((amlNode || ppc).dispatchEvent("contextmenu", ev) === false
          || ev.returnValue === false) {
            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
        //#endif

        if (ppc.config.disableRightClick) {
            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
    });
    
    ppc.addListener(document, "mouseup", function(e){
        if (!e) e = event;
        
        ppc.dispatchEvent("mouseup", {
            htmlEvent : e
        });
    });

    var ta = {"INPUT":1, "TEXTAREA":1, "SELECT":1, "EMBED":1, "OBJECT":1};
    ppc.addListener(document, "mousedown", this.$mousedown = function(e){

        if (!e) e = event;
        var p,
            amlNode   = ppc.findHost(e.srcElement || e.target);
            /*cEditable = amlNode && amlNode.liveedit
              // #ifdef __WITH_LIVEEDIT
              || (amlNode && amlNode.hasFeature(ppc.__LIVEEDIT__))
              // #endif
            ;*/
        // #ifdef __WITH_POPUP
        ppc.popup.$mousedownHandler(amlNode, e);
        // #endif

        if (amlNode === false) 
            amlNode = ppc.window.activeElement;

        //#ifdef __WITH_FOCUS
        //Make sure the user cannot leave a modal window
        if ((!amlNode || ((!amlNode.$focussable || amlNode.focussable === false)
          && amlNode.canHaveChildren != 2 && !amlNode.$focusParent))
          && ppc.config.allowBlur) {
            lastFocusParent = null;
            if (ppc.window.activeElement)
                ppc.window.activeElement.blur();
        }
        else if (amlNode) { //@todo check this for documentElement ppc3.0
            if ((p = ppc.window.activeElement
              && ppc.window.activeElement.$focusParent || lastFocusParent)
              && p.visible && p.modal && amlNode.$focusParent != p
              && amlNode.$isWindowContainer != -1) {
                ppc.window.$focusLast(p, {mouse: true, ctrlKey: e.ctrlKey});
            }
            else if (!amlNode && ppc.window.activeElement) {
                ppc.window.$focusRoot();
            }
            else if (amlNode.$isWindowContainer == -1) {
                if (amlNode.$tabList.length)
                    ppc.window.moveNext(null, amlNode.$tabList[0], null, {mouse: true, innerList: true});
                else
                    ppc.window.$focus(amlNode);
            }
            else if ((amlNode.disabled == undefined || amlNode.disabled < 1) 
              && amlNode.focussable !== false) {
                if (amlNode.$focussable) { // === ppc.KEYBOARD_MOUSE
                    ppc.window.$focus(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
                }
                else if (amlNode.canHaveChildren == 2) {
                    if (!ppc.config.allowBlur || !ppc.window.activeElement 
                      || ppc.window.activeElement.$focusParent != amlNode)
                        ppc.window.$focusLast(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
                }
//                else {
//                    if (!ppc.config.allowBlur || amlNode != ppc.document.documentElement)
//                        ppc.window.$focusDefault(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
//                }
            }
            else {
                ppc.window.$focusDefault(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
            }
    
            //#ifdef __WITH_WINDOW_FOCUS
            if (ppc.hasFocusBug) {
                var isTextInput = (ta[e.srcElement.tagName]
                    || e.srcElement.isContentEditable) && !e.srcElement.disabled
                    || amlNode.$isTextInput
                    && amlNode.$isTextInput(e) && amlNode.disabled < 1;
    
                if (!amlNode || !isTextInput)
                    ppc.window.$focusfix();
            }
            else if (!last) {
                ppc.window.$focusevent();
            }
            //#endif
        }
        //#endif
        
        ppc.dispatchEvent("mousedown", {
            htmlEvent : e,
            amlNode   : amlNode || ppc.document.documentElement
        });

        //Non IE/ iPhone selection handling or overruled
        if (ppc.isIE || ppc.isIphone || amlNode.getAttribute("canSelect"))
            return;

        var canSelect = !((!ppc.document
          && (!ppc.isParsingPartial || amlNode)
          || ppc.dragMode) && !ta[e.target && e.target.tagName]);

        if (canSelect && amlNode) {
            if (!e.target && e.srcElement)
                e.target = {};
            var isTextInput = (ta[e.target.tagName]
                || e.target.contentEditable == "true") && !e.target.disabled  //@todo ppc3.0 need to loop here?
                || amlNode.$isTextInput
                && amlNode.$isTextInput(e) && amlNode.disabled < 1;

            //(!amlNode.canHaveChildren || !ppc.isChildOf(amlNode.$int, e.srcElement))
            if (!ppc.config.allowSelect && !isTextInput
              && amlNode.nodeType != amlNode.NODE_PROCESSING_INSTRUCTION 
              && !amlNode.textselect) //&& (!amlNode.$int || amlNode.$focussable) //getElementsByTagNameNS(ppc.ns.xhtml, "*").length
                canSelect = false;
        }
        
        if (!canSelect && e.button != 2) { // && !cEditable
            if (e.preventDefault)
                e.preventDefault();
           
	        try{  
                if (document.activeElement && document.activeElement.contentEditable == "true") //@todo ppc3.0 need to loop here?
                    document.activeElement.blur();
    	    }catch(e){}
        }
    });

    //IE selection handling
    ppc.addListener(document, "selectstart", function(e){
        if (!ppc.isIE || amlNode.getAttribute("canSelect"))
            return;
        
        if (!e) e = event;

        var amlNode   = ppc.findHost(e.srcElement);
        var canSelect = !(!ppc.document
          && (!ppc.isParsingPartial || amlNode)
          || ppc.dragMode);
        
        if (canSelect) {
            //(!amlNode.canHaveChildren || !ppc.isChildOf(amlNode.$int, e.srcElement))
            if (!ppc.config.allowSelect 
              && (amlNode && amlNode.nodeType != amlNode.NODE_PROCESSING_INSTRUCTION 
              && !amlNode.textselect)) //&& !amlNode.$int // getElementsByTagNameNS(ppc.ns.xhtml, "*").length
                canSelect = false;
        }

        if (!canSelect) {
            e.returnValue = false;
            return false;
        }
    });

    // Keyboard forwarding to focussed object
    ppc.addListener(document, "keyup", this.$keyup = function(e){
        if (!e) e = event;

        //#ifdef __WITH_KEYBOARD
        var ev = {
            keyCode  : e.keyCode,
            ctrlKey  : e.ctrlKey,
            shiftKey : e.shiftKey,
            metaKey  : e.metaKey,
            altKey   : e.altkey,
            htmlEvent: e,
            bubbles  : true //@todo is this much slower?
        };
        
        var aEl = ppc.document && ppc.window.activeElement;
        if ((aEl && !aEl.disableKeyboard
          ? aEl.dispatchEvent("keyup", ev)
          : ppc.dispatchEvent("keyup", ev)) === false) {
            ppc.preventDefault(e);
            return false;
        }
        //#endif
    });

    //#ifdef __WITH_MOUSESCROLL
    var wheel = this.$mousewheel = function wheel(e) {
        if (!e)
            e = event;

        var delta = null;
        if (e.wheelDelta) {
            delta = e.wheelDelta / 120;
            if (ppc.isOpera)
                delta *= -1;
        }
        else if (e.detail) {
            delta = -e.detail / 3;
        }

        if (delta !== null) {
            //Fix for scrolling too much
            if (ppc.isIE) {
                var el = e.srcElement || e.target;
                while (el && el.scrollHeight <= el.offsetHeight)
                    el = el.parentNode || el.$parentNode;
                
                if (el && el.nodeType == 9)
                    el = el.documentElement;
                
                if (!el || el.nodeType != 1) return;

                if (el && el.tagName == "BODY" && "auto|scroll".indexOf(ppc.getStyle(el, "overflowY")) == -1)
                    el = document.documentElement;

                if (el && "auto|scroll".indexOf(ppc.getStyle(el, "overflowY")) > -1) {
                    var max, dist = 0.35 * el.offsetHeight * delta;
                    if (delta < 0) {
                        if (el && el.scrollTop >= (max = el.scrollHeight - el.offsetHeight + ppc.getVerBorders(el)) + dist) {
                            el.scrollTop = max;
                            e.returnValue = false;
                        }
                    }
                    else {
                        if (el && el.scrollTop <= dist) {
                            el.scrollTop = 0;
                            e.returnValue = false;
                        }
                    }
                }
            }
            
            var ev  = {
                delta     : delta, 
                target    : e.target || e.srcElement, 
                button    : e.button, 
                ctrlKey   : e.ctrlKey, 
                shiftKey  : e.shiftKey, 
                metaKey   : e.metaKey,
                altKey    : e.altKey,
                bubbles   : true,
                htmlEvent : e
            };
            
            var amlNode = ppc.findHost(e.srcElement || e.target);
            var res = (amlNode || ppc).dispatchEvent("mousescroll", ev);
            if (res === false || ev.returnValue === false) {
                if (e.preventDefault)
                    e.preventDefault();

                e.returnValue = false;
            }
        }
    }

    if (document.addEventListener)
        document.addEventListener('DOMMouseScroll', wheel, false);

    window.onmousewheel   =
    document.onmousewheel = wheel; //@todo 2 keer events??
    //#endif

    //var browserNavKeys = {32:1,33:1,34:1,35:1,36:1,37:1,38:1,39:1,40:1}
    
    ppc.addListener(document, "keyup", function(e){
        e = e || event;

        if (e.ctrlKey && e.keyCode == 9 && ppc.window.activeElement) {
            var w = ppc.window.activeElement.$focusParent;
            if (w.modal) {
                if (e.preventDefault)
                    e.preventDefault();
                return false;
            }

            ppc.window.moveNext(e.shiftKey,
                ppc.window.activeElement.$focusParent, true);

            w = ppc.window.activeElement.$focusParent;
            if (w && w.bringToFront)
                w.bringToFront();
            
            if (e.preventDefault)
                e.preventDefault();
            return false;    
        }
    });
    
    //@todo optimize this function
    ppc.addListener(document, "keydown", this.$keydown = function(e){
        e = e || event;

        //#ifdef __WITH_DEBUG_WIN
        if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
            ppc.$debugwin.activate();
        }
        //#endif

        //#ifdef __AMLCONTEXTMENU
        if (e.keyCode == 93)
            ppc.contextMenuKeyboard = true;
        // #endif

        var amlNode           = ppc.window.activeElement, //ppc.findHost(e.srcElement || e.target),
            htmlNode          = (e.explicitOriginalTarget || e.srcElement || e.target),
            isTextInput = (ta[htmlNode.tagName]
              || htmlNode.contentEditable || htmlNode.contentEditable == "true")  //@todo ppc3.0 need to loop here?
              && !htmlNode.disabled
              || amlNode && amlNode.$isTextInput
              && amlNode.$isTextInput(e) && amlNode.disabled < 1;

        //#ifdef __WITH_ACTIONTRACKER && __WITH_UNDO_KEYS
        //@todo move this to appsettings and use with_hotkey
        var o,
            ctrlKey = ppc.isMac ? e.metaKey : e.ctrlKey;
        if (!isTextInput && ppc.config.undokeys && ctrlKey) {
            //Ctrl-Z - Undo
            if (e.keyCode == 90) {
                o = ppc.window.activeElement;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = ppc.window;
                (o.$at || o.getActionTracker()).undo();
            }
            //Ctrl-Y - Redo
            else if (e.keyCode == 89) {
                o = ppc.window.activeElement;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = ppc.window;
                (o.$at || o.getActionTracker()).redo();
            }
        }
        //#endif

        var eInfo = {
            ctrlKey    : e.ctrlKey,
            metaKey    : e.metaKey,
            shiftKey   : e.shiftKey,
            altKey     : e.altKey,
            keyCode    : e.keyCode,
            htmlEvent  : e,
            isTextInput: isTextInput,
            bubbles    : true
        };
        
        delete eInfo.currentTarget;
        //#ifdef __WITH_KEYBOARD
        //Keyboard forwarding to focussed object
        var aEl = amlNode; //isTextInput ? amlNode :
        if ((aEl && !aEl.disableKeyboard && !aEl.editable
          ? aEl.dispatchEvent("keydown", eInfo) 
          : ppc.dispatchEvent("keydown", eInfo)) === false) {
            ppc.stopEvent(e);
            if (ppc.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            return false;
        }
        //#ifdef __WITH_FOCUS
        //Focus handling
        else if ((!ppc.config.disableTabbing || ppc.window.activeElement) && e.keyCode == 9) {
            //Window focus handling
            if (e.ctrlKey && ppc.window.activeElement) {
                var w = ppc.window.activeElement.$focusParent;
                if (w.modal) {
                    if (e.preventDefault)
                        e.preventDefault();
                    return false;
                }

                ppc.window.moveNext(e.shiftKey,
                    ppc.window.activeElement.$focusParent, true);

                w = ppc.window.activeElement.$focusParent;
                if (w && w.bringToFront)
                    w.bringToFront();
            }
            //Element focus handling
            else if(!ppc.window.activeElement || ppc.window.activeElement.tagName != "menu") {
                ppc.window.moveNext(e.shiftKey);
            }

            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
        //#endif

        //Disable backspace behaviour triggering the backbutton behaviour
        var altKey = ppc.isMac ? e.metaKey : e.altKey;
        if (ppc.config.disableBackspace
          && e.keyCode == 8// || (altKey && (e.keyCode == 37 || e.keyCode == 39)))
          && !isTextInput) {
            if (ppc.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            e.returnValue = false;
        }

        //Disable space behaviour of scrolling down the page
        /*if(Application.disableSpace && e.keyCode == 32 && e.srcElement.tagName.toLowerCase() != "input"){
            e.keyCode = 0;
            e.returnValue = false;
        }*/

        //Disable F5 refresh behaviour
        if (ppc.config.disableF5 && (e.keyCode == 116 || e.keyCode == 117)) {
            if (ppc.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            else {
                e.preventDefault();
                e.stopPropagation();
            }
            //return false;
        }
        
        
        /*if (browserNavKeys[e.keyCode] && ppc.window.activeElement 
          && ppc.config.autoDisableNavKeys)
            e.returnValue = false;*/

        if (e.keyCode == 27)
            e.returnValue = false;

        if (!ppc.config.allowSelect
          && e.shiftKey && (e.keyCode > 32 && e.keyCode < 41)
          && !isTextInput) {
            e.returnValue = false;
        }

        //ppc.dispatchEvent("keydown", null, eInfo);

        if (e.returnValue === false && e.preventDefault)
            e.preventDefault();

        return e.returnValue;
        //#endif
    });
    
    ppc.document = {};
    this.init = function(strAml){
        //#ifdef __WITH_ACTIONTRACKER
        if (ppc.actiontracker) {
            this.$at      = new ppc.actiontracker();
            this.$at.name = "default";
            //#ifdef __WITH_NAMESERVER
            ppc.nameserver.register("actiontracker", "default", this.$at);
            //#endif
        }
        
        //#ifdef __WITH_CONTENTEDITABLE || __WITH_LIVEEDIT
        this.undoManager = new ppc.actiontracker();
        //#endif
        //#endif

         // #ifdef __DEBUG
        ppc.console.info("Start parsing main application");
        // #endif
        // #ifdef __DEBUG
        ppc.Latometer.start();
        // #endif
        
        //Put this in callback in between the two phases
        //#ifdef __WITH_SKIN_AUTOLOAD
        /*XForms and lazy devs support
        if (!nodes.length && !ppc.skins.skins["default"] && ppc.autoLoadSkin) {
            ppc.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            ppc.loadAmlInclude(null, doSync, "skins.xml", true);
        }*/
        //#endif 

        this.$domParser = new ppc.DOMParser();
        this.document = ppc.document = this.$domParser.parseFromString(strAml, 
          "text/xml", {
            // #ifndef __SUPPORT_GWT
            timeout   : ppc.config.initdelay,
            // #endif
            callback  : function(doc){
                //@todo ppc3.0

                //Call the onload event (prevent recursion)
                if (ppc.parsed != 2) {
                    //@todo ppc3.0 onload is being called too often
                    var inital = ppc.parsed;
                    ppc.parsed = 2;
                    ppc.dispatchEvent("parse", { //@todo ppc3.0 document
                        initial : inital
                    });
                    ppc.parsed = true;
                }
        
                if (!ppc.loaded) {
                    //#ifdef __DESKRUN
                    if (ppc.isDeskrun)
                        ppc.window.deskrun.Show();
                    //#endif
        
                    //#ifdef __WITH_FOCUS
                    //Set the default selected element
                    if (!ppc.window.activeElement && (!ppc.config.allowBlur 
                      || ppc.document.documentElement 
                      && ppc.document.documentElement.editable))
                        ppc.window.focusDefault();
                    //#endif

                    ppc.loaded = true;
                    $setTimeout(function() {
                        ppc.dispatchEvent("load");
                        ppc.addEventListener("$event.load", function(cb){
                            cb();
                        });
                    });
                }
        
                //END OF ENTIRE APPLICATION STARTUP
        
                //#ifdef __DEBUG
                ppc.console.info("Initialization finished");
                //#endif
                
                // #ifdef __DEBUG
                ppc.Latometer.end();
                ppc.Latometer.addPoint("Total load time");
                ppc.Latometer.start(true);
                // #endif
          }
        }); //async
    };
    
    //#ifdef __WITH_WINDOW_FOCUS
    var lastFocusElement;
    this.addEventListener("focus", function(e){
        if (!ppc.window.activeElement && lastFocusParent && !ppc.isIphone) {
            lastFocusElement.focus();
            /*
            if (lastFocusParent.$isWindowContainer < 0) {
                if (lastFocusParent.$tabList.length)
                    ppc.window.moveNext(null, lastFocusParent.$tabList[0]);
                else
                    ppc.window.$focus(lastFocusParent);
            }
            else 
                ppc.window.$focusLast(lastFocusParent);*/
        }
    });
    this.addEventListener("blur", function(e){
        if (!ppc.window.activeElement || ppc.isIphone)
            return;

        ppc.window.activeElement.blur(true, {srcElement: this});//, {cancelBubble: true}
        lastFocusParent   = ppc.window.activeElement.$focusParent;
        lastFocusElement  = ppc.window.activeElement;
        
        ppc.activeElement = 
        ppc.window.activeElement = 
        ppc.document.activeElement = null;
    });
    this.getLastActiveElement = function(){
        return ppc.activeElement || lastFocusElement;
    }
    //#endif

    /*
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        ppc.unload(this);

        ppc           =
        this.win      =
        this.window   =
        this.document = null;

        //@todo this is not needed... maybe use ppc.removeListener
        window.onfocus        =
        window.onerror        =
        window.onunload       =
        window.onbeforeunload =
        window.onbeforeprint  =
        window.onafterprint   =
        window.onmousewheel   =
        window.onblur         = null;

        //@todo use ppc.removeEvent

        document.oncontextmenu =
        document.onmousedown   =
        document.onmousemove   =
        document.onmouseup     =
        document.onmousewheel  =
        document.onkeyup       =
        document.onkeydown     = null

        if (document.body) {
            document.body.onmousedown =
            document.body.onmousemove =
            document.body.onmouseup   = null;

            document.body.innerHTML = "";
        }
    };
};
ppc.window.prototype = new ppc.Class().$init();
ppc.window = new ppc.window();

//#ifdef __WITH_WINDOW_FOCUS
/*
 * @private
 */
ppc.sanitizeTextbox = function(oTxt){
    if (!ppc.hasFocusBug)
        return;
    
    oTxt.onfocus = function(){
        if (ppc.window)
            ppc.window.$focusfix2();
    };

    oTxt.onblur = function(){
        if (ppc.window)
            ppc.window.$blurfix();
    };
};
// #endif
// #endif
