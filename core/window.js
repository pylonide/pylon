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
 * Object representing the window of the aml application. The semantic is
 * similar to that of a window in the browser, except that this window is not
 * the same as the javascript global object. It handles the focussing within
 * the document and several other events such as exit and the keyboard events.
 *
 * @event blur              Fires when the browser window looses focus.
 * @event focus             Fires when the browser window receives focus.
 *
 * @constructor
 * @inherits apf.Class
 * @default_private
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.window = function(){
    this.$uniqueId = apf.all.push(this);
    this.apf       = apf;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[apf.window]";
    };
    
    /**
     * Retrieves the primary {@link element.actiontracker action tracker} of the application.
     */
    this.getActionTracker = function(){
        return this.$at
    };

    /**
     * @private
     */
    this.loadCodeFile = function(url){
        //if(apf.isWebkit) return;
        if (self[url])
            apf.importClass(self[url], true, this.win);
        else
            apf.include(url);//, this.document);
    };

    //#ifdef __WITH_TASKBAR_FLASHING
    /**
     * Flashes the task bar. This can be useful to signal the user that an
     * important event has occured. Only works in internet explorer under
     * certain conditions.
     */
    this.flash = function(){
        if (apf.window.hasFocus() || apf.isIphone)
            return;

        if (apf.isDeskrun) {
            jdwin.Flash();
        }
        else if (apf.isIE) {
            if (!this.popup)
                this.popup = window.createPopup();

            if (apf.window.stopFlash)
                return;

            state += "x"

            function doFlash(nopopup) {
                if (apf.window.hasFocus())
                    return;

                window.focus();

                function doPopup() {
                    if (apf.window.hasFocus())
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
                        if (!apf.window.popup.isOpen
                          || !apf.window.popup.document.p.isOpen) {
                            clearInterval(apf.window.flashTimer);

                            if (!apf.window.hasFocus()) {
                                apf.window.popup.hide();
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
                        doPopup.call(apf.window)
                    }, 10);
                else
                    doPopup.call(apf.window);
            }

            if ("TEXTAREA|INPUT|SELECT".indexOf(document.activeElement.tagName) > -1) {
                document.activeElement.blur();
                document.body.focus();
                apf.window.stopFlash = true;
                $setTimeout(function(){
                    doFlash.call(apf.window, true);
                    apf.window.stopFlash = false;
                }, 10);
            }
            else {
                doFlash.call(apf.window);
            }
        }
    };
    //#endif

    /**
     * Show the browser window.
     */
    this.show = function(){
        if (apf.isDeskrun)
            jdwin.Show();
    };

    /**
     * Hide the browser window.
     */
    this.hide = function(){
        if (apf.isDeskrun) {
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
        if (apf.isDeskrun)
            jdwin.SetFocus();
        else
            window.focus();
    };

    /**
     * Set the icon of the browser window.
     * @param {String} url the location of the .ico file.
     */
    this.setIcon = function(url){
        if (apf.isDeskrun)
            jdwin.icon = parseInt(url) == url ? parseInt(url) : url;
    };

    /**
     * Set the title of the browser window.
     * @param {String} value the new title of the window.
     */
    this.setTitle = function(value){
        this.title = value || "";

        if (apf.isDeskrun)
            jdwin.caption = value;
        else
            document.title = (value || "");
    };

    /**
     * @private
     */
    this.loadAml = function(x){
        if (x[apf.TAGNAME] == "deskrun")
            this.loadDeskRun(x);
        /*else {

        }*/
    };

    //#ifdef __DESKRUN
    var jdwin   = apf.isDeskrun ? window.external : null,
        jdshell = apf.isDeskrun ? jdwin.shell     : null;

    /**
     * @private
     */
    this.loadDeskRun = function(q){
        jdwin.style = q.getAttribute("style")
            || "ismain|taskbar|btn-close|btn-max|btn-min|resizable";

        apf.config.drRegName = q.getAttribute("record");
        if (q.getAttribute("minwidth"))
            jdwin.setMin(q.getAttribute("minwidth"), q.getAttribute("minheight"));
        if (q.getAttribute("record")
          && jdshell.RegGet(apf.config.drRegName + "/window")) {
            var winpos = jdshell.RegGet(apf.config.drRegName + "/window");
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

        var ct = $xmlns(q, "context", apf.ns.aml);
        if (ct.length) {
            ct = ct[0];
            if (!apf.config.tray)
                apf.config.tray = window.external.CreateWidget("trayicon")
            var tray = apf.config.tray;

            tray.icon = q.getAttribute("tray") || 100;
            tray.tip  = q.getAttribute("tooltip") || "DeskRun";
            tray.PopupClear();
            tray.PopupItemAdd("Exit", 3);
            tray.PopupItemAdd("SEP", function(){});

            var nodes = ct.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].nodeType != 1)
                    continue;

                if (nodes[i][apf.TAGNAME] == "divider") {
                    tray.PopupItemAdd("SEP", function(){});
                }
                else {
                    tray.PopupItemAdd(apf.queryValue(nodes[i], "."),
                        nodes[i].getAttribute("href")
                        ? new Function("window.open('" + nodes[i].getAttribute("href") + "')")
                        : new Function(nodes[i].getAttribute("onclick")));
                }
            }
        }

        jdwin.shell.debug = apf.debug ? 7 : 0;
        jdwin.Show();
        jdwin.SetFocus();
    };
    //#endif

    /**** Focus Internals ****/

    //#ifdef __WITH_VISIBILITYMANAGER
    this.vManager = new apf.visibilitymanager();
    //#endif

    //#ifdef __WITH_ZMANAGER
    this.zManager = new apf.zmanager();
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
            apf.console.warn("Aml node already exist for tabindex " + tabindex
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
        var aEl = this.document.activeElement;
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

        (apf.activeElement = this.document.activeElement = amlNode).focus(true, e);

        this.$settingFocus = null;

        apf.dispatchEvent("movefocus", {
            toElement : amlNode
        });

        //#ifdef __WITH_XFORMS
        amlNode.dispatchEvent("xforms-focus");
        amlNode.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        if (!hadAlreadyFocus)
            apf.console.info("Focus given to " + amlNode.localName +
                " [" + (amlNode.name || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime)
            apf.offline.state.set(this, "focus", amlNode.name || amlNode.$uniqueId);
        //#endif
    };

    this.$blur = function(amlNode){
        var aEl = this.document.activeElement;
        if (aEl != amlNode)
            return false;

        //#ifdef __DEBUG
        apf.console.info(aEl.localName + " ["
            + (aEl.name || "") + "] was blurred.");
        //#endif

        aEl.$focusParent.$lastFocussed = null;
        apf.activeElement = this.document.activeElement = null;

        apf.dispatchEvent("movefocus", {
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
        var docEl = apf.document.documentElement;
        if (this.$focusLast(docEl, e) === false) {
            //docEl.$lastFocussed = null;
            //this.moveNext(null, apf.document.documentElement, true, e);
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
                this.$focus(apf.document.documentElement);//return false;//

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

            this.$focus(apf.document.documentElement);*/
        }
    };

    function trackChildFocus(e){
        if (e.name == "blur") {
            if (e.srcElement != this && this.$blur)
                this.$blur();
            return;
        }
        
        if (e.srcElement != this && this.$focus && (!e || !e.mouse || this.$focussable == apf.KEYBOARD_MOUSE))
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

        return node || apf.document.documentElement;
    }

    //Dom handler
    //@todo make this look at the dom tree insertion point to determine tabindex
    function moveFocus(e){
        if (e && e.currentTarget != this)
            return;
        
        if (this.$isWindowContainer)
            apf.window.$tabList.pushUnique(this);
        else
            apf.window.$addFocus(this, this.tabindex, true)
    }

    //Dom handler
    function removeFocus(e){
        if (e && (e.currentTarget != this || e.$doOnlyAdmin))
            return;

        //@todo apf3.0 this should be fixed by adding domremovenode events to all children
        var list  = this.$focusParent.$tabList;
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            list.remove(nodes[i]); //@todo assuming no windows here
        }

        if (apf.document.activeElement == this)
            apf.window.moveNext();
        
        if (this.$isWindowContainer) {
            apf.window.$tabList.remove(this); //@todo this can't be right
            return;
        }

        if (!this.$focusParent)
            return;

        list.remove(this);
        //this.$focusParent = null; //@experimental to not execute this
    }

    /**** Focus API ****/

    /**
     * Determines whether a given aml element has the focus.
     * @param {AMLElement} the element to check
     * @returns {Boolean} whether the element has focus.
     */
    this.hasFocus = function(amlNode){
        return this.document.activeElement == amlNode;
    };

    /**
     * @private
     */
    this.moveNext = function(shiftKey, relObject, switchWindows, e){
        if (switchWindows && apf.document.activeElement) {
            var p = apf.document.activeElement.$focusParent;
            if (p.visible && p.modal)
                return false;
        }

        var dir, start, next,
            amlNode = relObject || apf.document.activeElement,
            fParent = amlNode
                ? (switchWindows && amlNode.$isWindowContainer 
                  && amlNode.$isWindowContainer != -1
                    ? apf.window
                    : e && e.innerList ? amlNode.$focusParent : amlNode.$focusParent2 || amlNode.$focusParent)
                : apf.document.documentElement,
            list    = fParent.$tabList;

        if (amlNode && (switchWindows || amlNode != apf.document.documentElement)) {
            start   = (list || []).indexOf(amlNode);
            if (start == -1) {
                //#ifdef __DEBUG
                apf.console.warn("Moving focus from element which isn't in the list\
                                  of it's parent. This should never happen.");
                //#endif

                return;
            }
        }
        else {
            start = -1;
        }

        if (this.document.activeElement && this.document.activeElement == amlNode
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
        while (!amlNode
            || amlNode.disabled > 0
            || amlNode == apf.document.activeElement
            || (switchWindows ? !amlNode.visible : amlNode.$ext && !amlNode.$ext.offsetHeight)
            || amlNode.focussable === false
            || switchWindows && !amlNode.$tabList.length);

        if (fParent == apf.window && amlNode.$isWindowContainer != -2) {
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

    /**
     * @private
     */
    this.focusDefault = function(){
        //#ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled) {
            var node, id = apf.offline.state.get(this, "focus");

            if (id == -1)
                return this.$focusRoot();

            if (id)
                node = self[id] || apf.lookup(id);

            if (node) {
                if (!node.$focussable) {
                    //#ifdef __DEBUG
                    apf.console.warn("Invalid offline state detected. The "
                                   + "application was probably changed in "
                                   + "between sessions. Resetting offline state "
                                   + "and rebooting.");
                    //#endif

                    apf.offline.clear();
                    apf.offline.reboot();
                }
                else {
                    this.$focus(node);
                    return;
                }
            }
        }
        //#endif

        if (this.moveNext() === false)
            this.moveNext(null, apf.document.documentElement, true)
    };

    //#endif

    /**** Set Window Events ****/

    apf.addListener(window, "beforeunload", function(){
        return apf.dispatchEvent("exit");
    });

    //@todo apf3.x why is this loaded twice
    apf.addListener(window, "unload", function(){
        if (!apf)
            return;
        
        apf.window.isExiting = true;
        apf.window.destroy();
    });

    //#ifdef __WITH_WINDOW_FOCUS

    var timer, state = "", last = "";
    this.$focusfix = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        // #endif
        state += "a";
        clearTimeout(timer);
        $setTimeout("window.focus();");
        timer = $setTimeout(determineAction);
    };

    this.$focusfix2 = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        // #endif
        state += "b";
        clearTimeout(timer);
        timer = $setTimeout(determineAction);
    };

    this.$blurfix = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        // #endif
        state += "c";
        clearTimeout(timer);
        timer = $setTimeout(determineAction);
    };

    function determineAction(){
        clearTimeout(timer);

        //apf.console.info(state);
        if (state == "e" || state == "c"
          || state.charAt(0) == "x" && !state.match(/eb$/)
          || state == "ce" || state == "de") { //|| state == "ae"
            if (last != "blur") {
                last = "blur";
                apf.window.dispatchEvent("blur");
                //apf.console.warn("blur");
            }
        }
        else {
            if (last != "focus") {
                last = "focus";
                apf.window.dispatchEvent("focus");
                //apf.console.warn("focus");
            }
        }

        state = "";
        timer = null;
    }

    apf.addListener(window, "focus", this.$focusevent = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            return apf.window.dispatchEvent("focus");
        // #endif
        if (apf.hasFocusBug) {
            state += "d";
            clearTimeout(timer);
            timer = $setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "focus";
            //apf.console.warn("win-focus");
            iframeFixTimer = $setTimeout(iframeFix, 10);
        }
    });

    apf.addListener(window, "blur", this.$blurevent = function(){
        if (!apf) return;
        
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            return apf.window.dispatchEvent("blur");
        // #endif
        if (apf.hasFocusBug) {
            state += "e";
            clearTimeout(timer);
            timer = $setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "blur";
            //apf.console.warn("win-blur");
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

        apf.dispatchEvent(last);
        //apf.console.warn(last);
    }

    this.hasFocus = function(){
        return (last == "focus");
    };

    //#endif

    /**** Keyboard and Focus Handling ****/

    apf.addListener(document, "contextmenu", function(e){
        if (!e)
            e = event;

        //#ifdef __AMLCONTEXTMENU
        var pos, ev,
            amlNode = apf.findHost(e.srcElement || e.target)
              || apf.document.activeElement
              || apf.document && apf.document.documentElement;

        if (amlNode && amlNode.localName == "menu") //The menu is already visible
            return false;


        //if (amlNode && amlNode.localName == "menu")
            //amlNode = amlNode.parentNode;

        if (apf.contextMenuKeyboard) {
            if (amlNode) {
                pos = amlNode.selected
                    ? apf.getAbsolutePosition(amlNode.$selected)
                    : apf.getAbsolutePosition(amlNode.$ext || amlNode.$pHtmlNode);
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

        apf.contextMenuKeyboard = null;

        if ((amlNode || apf).dispatchEvent("contextmenu", ev) === false
          || ev.returnValue === false) {
            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
        //#endif

        if (apf.config.disableRightClick) {
            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
    });
    
    apf.addListener(document, "mouseup", function(e){
        if (!e) e = event;
        
        apf.dispatchEvent("mouseup", {
            htmlEvent : e
        });
    });

    var ta = {"INPUT":1, "TEXTAREA":1, "SELECT":1};
    apf.addListener(document, "mousedown", this.$mousedown = function(e){
        if (!e) e = event;
        var p,
            amlNode   = apf.findHost(e.srcElement || e.target);
            /*cEditable = amlNode && amlNode.liveedit
              // #ifdef __WITH_LIVEEDIT
              || (amlNode && amlNode.hasFeature(apf.__LIVEEDIT__))
              // #endif
            ;*/

        // #ifdef __WITH_POPUP
        if (apf.popup.last && (!amlNode || apf.popup.last != amlNode.$uniqueId) 
          && apf.popup.cache[apf.popup.last] 
          && !apf.isChildOf(apf.popup.cache[apf.popup.last].content, e.srcElement || e.target, true))
            apf.popup.forceHide();
        // #endif

        if (amlNode === false) 
            amlNode = apf.document.activeElement;

        //#ifdef __WITH_FOCUS
        //Make sure the user cannot leave a modal window
        if ((!amlNode || ((!amlNode.$focussable || amlNode.focussable === false)
          && amlNode.canHaveChildren != 2 && !amlNode.$focusParent))
          && apf.config.allowBlur) {
            lastFocusParent = null;
            if (apf.document.activeElement)
                apf.document.activeElement.blur();
        }
        else if (amlNode) { //@todo check this for documentElement apf3.0
            if ((p = apf.document.activeElement
              && apf.document.activeElement.$focusParent || lastFocusParent)
              && p.visible && p.modal && amlNode.$focusParent != p
              && amlNode.$isWindowContainer != -1) {
                apf.window.$focusLast(p, {mouse: true, ctrlKey: e.ctrlKey});
            }
            else if (!amlNode && apf.document.activeElement) {
                apf.window.$focusRoot();
            }
            else if (amlNode.$isWindowContainer == -1) {
                if (amlNode.$tabList.length)
                    apf.window.moveNext(null, amlNode.$tabList[0], null, {mouse: true, innerList: true});
                else
                    apf.window.$focus(amlNode);
            }
            else if ((amlNode.disabled == undefined || amlNode.disabled < 1) 
              && amlNode.focussable !== false) {
                if (amlNode.$focussable) { // === apf.KEYBOARD_MOUSE
                    apf.window.$focus(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
                }
                else if (amlNode.canHaveChildren == 2) {
                    if (!apf.config.allowBlur || !apf.document.activeElement 
                      || apf.document.activeElement.$focusParent != amlNode)
                        apf.window.$focusLast(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
                }
                else {
                    if (!apf.config.allowBlur || amlNode != apf.document.documentElement)
                        apf.window.$focusDefault(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
                }
            }
            else {
                apf.window.$focusDefault(amlNode, {mouse: true, ctrlKey: e.ctrlKey});
            }
    
            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug) {
                var isTextInput = (ta[e.srcElement.tagName]
                    || e.srcElement.isContentEditable) && !e.srcElement.disabled
                    || amlNode.$isTextInput
                    && amlNode.$isTextInput(e) && amlNode.disabled < 1;
    
                if (!amlNode || !isTextInput)
                    apf.window.$focusfix();
            }
            else if (!last) {
                apf.window.$focusevent();
            }
            //#endif
        }
        //#endif
        
        apf.dispatchEvent("mousedown", {
            htmlEvent : e,
            amlNode   : amlNode || apf.document.documentElement
        });

        //Non IE/ iPhone selection handling
        if (apf.isIE || apf.isIphone)
            return;

        var canSelect = !((!apf.document
          && (!apf.isParsingPartial || amlNode)
          || apf.dragMode) && !ta[e.target && e.target.tagName]);

        if (canSelect && amlNode) {
            if (!e.target && e.srcElement)
                e.target = {};
            var isTextInput = (ta[e.target.tagName]
                || e.target.contentEditable == "true") && !e.target.disabled  //@todo apf3.0 need to loop here?
                || amlNode.$isTextInput
                && amlNode.$isTextInput(e) && amlNode.disabled < 1;

            //(!amlNode.canHaveChildren || !apf.isChildOf(amlNode.$int, e.srcElement))
            if (!apf.config.allowSelect && !isTextInput
              && amlNode.nodeType != amlNode.NODE_PROCESSING_INSTRUCTION 
              && !amlNode.textselect) //&& (!amlNode.$int || amlNode.$focussable) //getElementsByTagNameNS(apf.ns.xhtml, "*").length
                canSelect = false;
        }
        
        if (!canSelect && e.button != 2) { // && !cEditable
            if (e.preventDefault)
                e.preventDefault();
           
	        try{  
                if (document.activeElement && document.activeElement.contentEditable == "true") //@todo apf3.0 need to loop here?
                    document.activeElement.blur();
    	    }catch(e){}
        }
    });

    //IE selection handling
    apf.addListener(document, "selectstart", function(e){
        if (!e) e = event;

        var amlNode   = apf.findHost(e.srcElement);
        var canSelect = !(!apf.document
          && (!apf.isParsingPartial || amlNode)
          || apf.dragMode);
        
        if (canSelect) {
            //(!amlNode.canHaveChildren || !apf.isChildOf(amlNode.$int, e.srcElement))
            if (!apf.config.allowSelect 
              && (amlNode && amlNode.nodeType != amlNode.NODE_PROCESSING_INSTRUCTION 
              && !amlNode.textselect)) //&& !amlNode.$int // getElementsByTagNameNS(apf.ns.xhtml, "*").length
                canSelect = false;
        }

        if (!canSelect) {
            e.returnValue = false;
            return false;
        }
    });

    // Keyboard forwarding to focussed object
    apf.addListener(document, "keyup", this.$keyup = function(e){
        if (!e) e = event;

        //#ifdef __WITH_KEYBOARD
        var ev = {
            keyCode  : e.keyCode,
            ctrlKey  : e.ctrlKey,
            shiftKey : e.shiftKey,
            altKey   : e.altkey,
            htmlEvent: e,
            bubbles  : true //@todo is this much slower?
        };
        
        var aEl = apf.document && apf.document.activeElement;
        if ((aEl && !aEl.disableKeyboard
          ? aEl.dispatchEvent("keyup", ev)
          : apf.dispatchEvent("keyup", ev)) === false) {
            apf.preventDefault(e);
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
            if (apf.isOpera)
                delta *= -1;
        }
        else if (e.detail) {
            delta = -e.detail / 3;
        }

        if (delta !== null) {
            //Fix for scrolling too much
            if (apf.isIE) {
                var el = e.srcElement || e.target;
                while (el && el.scrollHeight <= el.offsetHeight)
                    el = el.parentNode || el.$parentNode;
                
                if (el && el.nodeType == 9)
                    el = el.documentElement;
                
                if (!el || el.nodeType != 1) return;

                if (el && el.tagName == "BODY" && "auto|scroll".indexOf(apf.getStyle(el, "overflowY")) == -1)
                    el = document.documentElement;

                if (el && "auto|scroll".indexOf(apf.getStyle(el, "overflowY")) > -1) {
                    var max, dist = 0.35 * el.offsetHeight * delta;
                    if (delta < 0) {
                        if (el && el.scrollTop >= (max = el.scrollHeight - el.offsetHeight + apf.getVerBorders(el)) + dist) {
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
                altKey    : e.altKey,
                bubbles   : true,
                htmlEvent : e
            };
            
            var amlNode = apf.findHost(e.srcElement || e.target);
            var res = (amlNode || apf).dispatchEvent("mousescroll", ev);
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
    
    apf.addListener(document, "keyup", function(e){
        e = e || event;

        if (e.ctrlKey && e.keyCode == 9 && apf.document.activeElement) {
            var w = apf.document.activeElement.$focusParent;
            if (w.modal) {
                if (e.preventDefault)
                    e.preventDefault();
                return false;
            }

            apf.window.moveNext(e.shiftKey,
                apf.document.activeElement.$focusParent, true);

            w = apf.document.activeElement.$focusParent;
            if (w && w.bringToFront)
                w.bringToFront();
            
            if (e.preventDefault)
                e.preventDefault();
            return false;    
        }
    });
    
    //@todo optimize this function
    apf.addListener(document, "keydown", this.$keydown = function(e){
        e = e || event;

        //#ifdef __WITH_DEBUG_WIN
        if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
            apf.$debugwin.activate();
        }
        //#endif

        //#ifdef __AMLCONTEXTMENU
        if (e.keyCode == 93)
            apf.contextMenuKeyboard = true;
        // #endif

        var amlNode           = apf.document.activeElement, //apf.findHost(e.srcElement || e.target),
            htmlNode          = (e.explicitOriginalTarget || e.srcElement || e.target),
            isTextInput = (ta[htmlNode.tagName]
              || htmlNode.contentEditable || htmlNode.contentEditable == "true")  //@todo apf3.0 need to loop here?
              && !htmlNode.disabled
              || amlNode && amlNode.$isTextInput
              && amlNode.$isTextInput(e) && amlNode.disabled < 1;

        //#ifdef __WITH_ACTIONTRACKER && __WITH_UNDO_KEYS
        //@todo move this to appsettings and use with_hotkey
        var o,
            ctrlKey = apf.isMac ? e.metaKey : e.ctrlKey;
        if (!isTextInput && apf.config.undokeys && ctrlKey) {
            //Ctrl-Z - Undo
            if (e.keyCode == 90) {
                o = apf.document.activeElement;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = apf.window;
                (o.$at || o.getActionTracker()).undo();
            }
            //Ctrl-Y - Redo
            else if (e.keyCode == 89) {
                o = apf.document.activeElement;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = apf.window;
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
          : apf.dispatchEvent("keydown", eInfo)) === false) {
            apf.stopEvent(e);
            if (apf.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            return false;
        }
        //#ifdef __WITH_FOCUS
        //Focus handling
        else if ((!apf.config.disableTabbing || apf.document.activeElement) && e.keyCode == 9) {
            //Window focus handling
            if (e.ctrlKey && apf.document.activeElement) {
                var w = apf.document.activeElement.$focusParent;
                if (w.modal) {
                    if (e.preventDefault)
                        e.preventDefault();
                    return false;
                }

                apf.window.moveNext(e.shiftKey,
                    apf.document.activeElement.$focusParent, true);

                w = apf.document.activeElement.$focusParent;
                if (w && w.bringToFront)
                    w.bringToFront();
            }
            //Element focus handling
            else if(!apf.document.activeElement || apf.document.activeElement.tagName != "menu") {
                apf.window.moveNext(e.shiftKey);
            }

            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
        //#endif

        //Disable backspace behaviour triggering the backbutton behaviour
        var altKey = apf.isMac ? e.metaKey : e.altKey;
        if (apf.config.disableBackspace
          && e.keyCode == 8// || (altKey && (e.keyCode == 37 || e.keyCode == 39)))
          && !isTextInput) {
            if (apf.canDisableKeyCodes) {
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
        if (apf.config.disableF5 && (e.keyCode == 116 || e.keyCode == 117)) {
            if (apf.canDisableKeyCodes) {
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
        
        
        /*if (browserNavKeys[e.keyCode] && apf.document.activeElement 
          && apf.config.autoDisableNavKeys)
            e.returnValue = false;*/

        if (e.keyCode == 27)
            e.returnValue = false;

        if (!apf.config.allowSelect
          && e.shiftKey && (e.keyCode > 32 && e.keyCode < 41)
          && !isTextInput) {
            e.returnValue = false;
        }

        //apf.dispatchEvent("keydown", null, eInfo);

        if (e.returnValue === false && e.preventDefault)
            e.preventDefault();

        return e.returnValue;
        //#endif
    });
    
    apf.document = {};
    this.init = function(strAml){
        //#ifdef __WITH_ACTIONTRACKER
        if (apf.actiontracker) {
            this.$at      = new apf.actiontracker();
            this.$at.name = "default";
            //#ifdef __WITH_NAMESERVER
            apf.nameserver.register("actiontracker", "default", this.$at);
            //#endif
        }
        
        //#ifdef __WITH_CONTENTEDITABLE || __WITH_LIVEEDIT
        this.undoManager = new apf.actiontracker();
        //#endif
        //#endif

         // #ifdef __DEBUG
        apf.console.info("Start parsing main application");
        // #endif
        // #ifdef __DEBUG
        apf.Latometer.start();
        // #endif
        
        //Put this in callback in between the two phases
        //#ifdef __WITH_SKIN_AUTOLOAD
        /*XForms and lazy devs support
        if (!nodes.length && !apf.skins.skins["default"] && apf.autoLoadSkin) {
            apf.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            apf.loadAmlInclude(null, doSync, "skins.xml", true);
        }*/
        //#endif 

        this.$domParser = new apf.DOMParser();
        this.document = apf.document = this.$domParser.parseFromString(strAml, 
          "text/xml", {
            // #ifndef __SUPPORT_GWT
            timeout   : apf.config.initdelay,
            // #endif
            callback  : function(doc){
                //@todo apf3.0

                //Call the onload event (prevent recursion)
                if (apf.parsed != 2) {
                    //@todo apf3.0 onload is being called too often
                    var inital = apf.parsed;
                    apf.parsed = 2;
                    apf.dispatchEvent("parse", { //@todo apf3.0 document
                        initial : inital
                    });
                    apf.parsed = true;
                }
        
                if (!apf.loaded) {
                    //#ifdef __DESKRUN
                    if (apf.isDeskrun)
                        apf.window.deskrun.Show();
                    //#endif
        
                    //#ifdef __WITH_FOCUS
                    //Set the default selected element
                    if (!apf.document.activeElement && (!apf.config.allowBlur 
                      || apf.document.documentElement 
                      && apf.document.documentElement.editable))
                        apf.window.focusDefault();
                    //#endif

                    apf.loaded = true;
                    $setTimeout(function() {
                        apf.dispatchEvent("load");
                        apf.addEventListener("$event.load", function(cb){
                            cb();
                        });
                    });
                }
        
                //END OF ENTIRE APPLICATION STARTUP
        
                //#ifdef __DEBUG
                apf.console.info("Initialization finished");
                //#endif
                
                // #ifdef __DEBUG
                apf.Latometer.end();
                apf.Latometer.addPoint("Total load time");
                apf.Latometer.start(true);
                // #endif
          }
        }); //async
    };
    
    //#ifdef __WITH_WINDOW_FOCUS
    var lastFocusElement;
    this.addEventListener("focus", function(e){
        if (!apf.document.activeElement && lastFocusParent && !apf.isIphone) {
            lastFocusElement.focus();
            /*
            if (lastFocusParent.$isWindowContainer < 0) {
                if (lastFocusParent.$tabList.length)
                    apf.window.moveNext(null, lastFocusParent.$tabList[0]);
                else
                    apf.window.$focus(lastFocusParent);
            }
            else 
                apf.window.$focusLast(lastFocusParent);*/
        }
    });
    this.addEventListener("blur", function(e){
        if (!apf.document.activeElement || apf.isIphone)
            return;

        apf.document.activeElement.blur(true, {srcElement: this});//, {cancelBubble: true}
        lastFocusParent   = apf.document.activeElement.$focusParent;
        lastFocusElement  = apf.document.activeElement;
        apf.activeElement = apf.document.activeElement = null;
    });
    this.getLastActiveElement = function(){
        return apf.activeElement || lastFocusElement;
    }
    //#endif

    /**
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        apf.unload(this);

        apf           =
        this.win      =
        this.window   =
        this.document = null;

        //@todo this is not needed... maybe use apf.removeListener
        window.onfocus        =
        window.onerror        =
        window.onunload       =
        window.onbeforeunload =
        window.onbeforeprint  =
        window.onafterprint   =
        window.onmousewheel   =
        window.onblur         = null;

        //@todo use apf.removeEvent

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
apf.window.prototype = new apf.Class().$init();
apf.window = new apf.window();

//#ifdef __WITH_WINDOW_FOCUS
/**
 * @private
 */
apf.sanitizeTextbox = function(oTxt){
    if (!apf.hasFocusBug)
        return;
    
    oTxt.onfocus = function(){
        if (apf.window)
            apf.window.$focusfix2();
    };

    oTxt.onblur = function(){
        if (apf.window)
            apf.window.$blurfix();
    };
};
// #endif
// #endif
