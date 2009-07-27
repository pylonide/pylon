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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.window = new (function(){
    this.uniqueId = apf.all.push(this);
    this.apf      = apf;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[APF Component : " + (this.name || "") + " (apf.window)]";
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
        //if(apf.isSafari) return;
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

        if (apf.isDeskrun)
            jdwin.Flash();
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
                    setTimeout(function(){
                        doPopup.call(apf.window)
                    }, 10);
                else
                    doPopup.call(apf.window);
            }

            if ("TEXTAREA|INPUT|SELECT".indexOf(document.activeElement.tagName) > -1) {
                document.activeElement.blur();
                document.body.focus();
                apf.window.stopFlash = true;
                setTimeout(function(){
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
        if (apf.isDeskrun)
            jdwin.Hide();
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
        else {

        }
    };

    //#ifdef __DESKRUN
    var jdwin   = apf.isDeskrun ? window.external : null;
    var jdshell = apf.isDeskrun ? jdwin.shell : null;

    /**
     * @private
     */
    this.loadDeskRun = function(q){
        jdwin.style = q.getAttribute("style") || "ismain|taskbar|btn-close|btn-max|btn-min|resizable";

        apf.appsettings.drRegName = q.getAttribute("record");
        if (q.getAttribute("minwidth"))
            jdwin.setMin(q.getAttribute("minwidth"), q.getAttribute("minheight"));
        if (q.getAttribute("record")
          && jdshell.RegGet(apf.appsettings.drRegName + "/window")) {
            var winpos = jdshell.RegGet(apf.appsettings.drRegName + "/window");
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
            if (!apf.appsettings.tray)
                apf.appsettings.tray = window.external.CreateWidget("trayicon")
            var tray = apf.appsettings.tray;

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

    //#ifdef __WITH_FOCUS

    this.$tabList = [];

    this.$addFocus = function(amlNode, tabindex, isAdmin){
        if (!isAdmin) {
            if (amlNode.$domHandlers) {
                amlNode.$domHandlers.reparent.push(moveFocus);
                amlNode.$domHandlers.remove.push(removeFocus);
            }

            if (amlNode.isWindowContainer > -1) {
                amlNode.addEventListener("focus", trackChildFocus);

                if (!amlNode.$tabList) {
                    amlNode.$tabList = [amlNode];
                }

                amlNode.$focusParent = amlNode;
                this.$tabList.push(amlNode);

                return;
            }
        }

        var fParent = findFocusParent(amlNode);
        var list    = fParent.$tabList;

        //#ifdef __DEBUG
        if (list[tabindex]) {
            apf.console.warn("Aml node already exist for tabindex " + tabindex
                             + ". Will insert " + amlNode.tagName + " ["
                             + (amlNode.name || "") + "] before existing one");
        }
        //#endif

        amlNode.$focusParent = fParent;

        if (list[tabindex])
            list.insertIndex(amlNode, tabindex);
        else
            list.push(amlNode);
    };

    this.$removeFocus = function(amlNode){
        if (!amlNode.$focusParent)
            return;

        amlNode.$focusParent.$tabList.remove(amlNode);

        if (!amlNode.isWindowContainer && amlNode.$domHandlers) {
            amlNode.$domHandlers.reparent.remove(moveFocus);
            amlNode.$domHandlers.remove.remove(removeFocus);
        }

        if (amlNode.isWindowContainer > -1)
            amlNode.removeEventListener("focus", trackChildFocus);
    };

    var focusLoopDetect;
    this.$focus = function(amlNode, e, force){
        if (this.focussed == amlNode && !force)
            return; //or maybe when force do $focus

        //#ifdef __DEBUG
        var hadAlreadyFocus = this.focussed == amlNode;
        //#endif

        this.$settingFocus = amlNode;

        if (!e) e = {};

        if (this.focussed && this.focussed != amlNode 
          && focusLoopDetect != this.focussed) {
            focusLoopDetect = this.focussed;
            e.toElement   = amlNode;
            e.fromElement = this.focussed;
            this.focussed.blur(true, e);

            //#ifdef __WITH_XFORMS
            amlNode.dispatchEvent("DOMFocusOut");
            //#endif
            
            if (focusLoopDetect != this.focussed)
                return false;
        }

        (this.focussed = amlNode).focus(true, e);

        this.$settingFocus = null;

        apf.dispatchEvent("movefocus", {
            toElement : this.focussed
        });

        //#ifdef __WITH_XFORMS
        amlNode.dispatchEvent("xforms-focus");
        amlNode.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        if (!hadAlreadyFocus)
            apf.console.info("Focus given to " + this.focussed.tagName +
                " [" + (this.focussed.name || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime)
            apf.offline.state.set(this, "focus", amlNode.name || amlNode.uniqueId);
        //#endif
    };

    this.$blur = function(amlNode){
        if (this.focussed != amlNode)
            return false;

        //#ifdef __DEBUG
        apf.console.info(this.focussed.tagName + " ["
            + (this.focussed.name || "") + "] was blurred.");
        //#endif

        apf.window.focussed.$focusParent.$lastFocussed = null;
        this.focussed = null;

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
    }

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
          && (ignoreVisible || lf.oExt.offsetHeight)) {
            this.$focus(lf, e, true);
        }
        else { //Let's find the object to focus first
            var next, str, x, node = amlNode, skip;
            while (node) {
                if (!skip && node.focussable !== false && node.$focussable === true
                  && (ignoreVisible || node.oExt.offsetHeight)) {
                    this.$focus(node, e, true);
                    break;
                }
                
                //Walk sub tree
                if ((next = !skip && node.firstChild || !(skip = false) && node.nextSibling)) {
                    node = next;
                    if (node.isWindowContainer)
                        skip = true;
                }
                else if (node == amlNode) {
                    if (node.isWindowContainer)
                        this.$focus(node, e, true);
                    return;
                }
                else {
                    do {
                        node = node.parentNode;
                    } while (node && !node.nextSibling && node != amlNode 
                      && !node.isWindowContainer)
                    
                    if (node == amlNode)
                        return; //do nothing
                    
                    if (node) {
                        if (node.isWindowContainer) {
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
                  && (ignoreVisible || node.oExt.offsetHeight)) {
                    this.$focus(node, e, true);
                    return;
                }
            }

            this.$focus(apf.document.documentElement);*/
        }
    };

    function trackChildFocus(e){
        if (e.srcElement == this || e.trackedChild) {
            e.trackedChild = true;
            return;
        }

        this.$lastFocussed = e.srcElement;

        if (this.tagName.indexOf("window") > -1)
            e.trackedChild = true;
    }

    function findFocusParent(amlNode){
        var node = amlNode;
        do {
            node = node.parentNode;
        } while(node && !node.isWindowContainer);
        //(!node.$focussable || node.focussable === false)

        return node || apf.document.documentElement;
    }

    //Dom handler
    //@todo make this look at the dom tree insertion point to determine tabindex
    function moveFocus(){
        if (this.isWindowContainer)
            apf.window.$tabIndex.push(this);
        else
            apf.window.$addFocus(this, this.tabindex, true)
    }

    //Dom handler
    function removeFocus(doOnlyAdmin){
        if (this.isWindowContainer) {
            apf.window.$tabList.remove(this);
            return;
        }

        if (!this.$focusParent)
            return;

        this.$focusParent.$tabList.remove(this);
        //this.$focusParent = null; //@experimental to not execute this
    }

    /**** Focus API ****/

    /**
     * Determines whether a given aml element has the focus.
     * @param {AMLElement} the element to check
     * @returns {Boolean} whether the element has focus.
     */
    this.hasFocus = function(amlNode){
        return this.focussed == amlNode;
    };

    /**
     * @private
     */
    this.moveNext = function(shiftKey, relObject, switchWindows, e){
        var dir, start, next;

        if (switchWindows && apf.window.focussed) {
            var p = apf.window.focussed.$focusParent;
            if (p.visible && p.modal)
                return false;
        }

        var amlNode = relObject || apf.window.focussed;
        var fParent = amlNode
            ? (switchWindows && amlNode.isWindowContainer
                ? apf.window
                : amlNode.$focusParent)
            : apf.document.documentElement;
        var list    = fParent.$tabList;

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
        else
            start = -1;

        if (this.focussed && this.focussed == amlNode
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

            if (start == next && amlNode)
                return false; //No visible enabled element was found

            amlNode = list[next];
        }
        while (!amlNode
            || amlNode.disabled
            || amlNode == apf.window.focussed
            || (switchWindows ? !amlNode.visible : amlNode.oExt && !amlNode.oExt.offsetHeight)
            || amlNode.focussable === false
            || switchWindows && !amlNode.$tabList.length);

        if (fParent == apf.window)
            this.$focusLast(amlNode, {mouse:true}, switchWindows);
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
                    apf.console.warn("Invalid offline state detected. The \
                                      application was probably changed in \
                                      between sessions. Resetting offline state\
                                      and rebooting.");
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

        if (this.moveNext() === false) {
            this.moveNext(null, apf.document.documentElement, true)
        }
    };

    //#endif

    /**** Set Window Events ****/

    apf.addListener(window, "beforeunload", function(){
        return apf.dispatchEvent("exit");
    });

    apf.addListener(window, "unload", function(){
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
        setTimeout("window.focus();");
        timer = setTimeout(determineAction);
    }

    this.$focusfix2 = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        // #endif
        state += "b";
        clearTimeout(timer);
        timer = setTimeout(determineAction);
    }

    this.$blurfix = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        // #endif
        state += "c";
        clearTimeout(timer);
        timer = setTimeout(determineAction);
    }

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

    apf.addListener(window, "focus", function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            return apf.window.dispatchEvent("focus");
        // #endif
        if (apf.hasFocusBug) {
            state += "d";
            clearTimeout(timer);
            timer = setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "focus";
            //apf.console.warn("win-focus");
            iframeFixTimer = setTimeout(iframeFix, 10);
        }
    });

    apf.addListener(window, "blur", function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone)
            return apf.window.dispatchEvent("blur");
        // #endif
        if (apf.hasFocusBug) {
            state += "e";
            clearTimeout(timer);
            timer = setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "blur";
            //apf.console.warn("win-blur");
            iframeFixTimer = setTimeout(iframeFix, 10);
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
        return last == "focus";
    }

    //#endif

    /**** Keyboard and Focus Handling ****/

    apf.addListener(document, "contextmenu", function(e){
        if (!e)
            e = event;

        //#ifdef __WITH_CONTEXTMENU
        var amlNode = apf.findHost(e.srcElement || e.target)
              || apf.window.focussed
              || apf.document && apf.document.documentElement;

        if (amlNode.tagName == "menu") //The menu is already visible
            return false;

        var pos, ev;

        if (amlNode && amlNode.tagName == "menu")
            amlNode = amlNode.parentNode;

        if (apf.contextMenuKeyboard) {
            if (amlNode) {
                pos = amlNode.selected
                    ? apf.getAbsolutePosition(amlNode.$selected)
                    : apf.getAbsolutePosition(amlNode.oExt || amlNode.pHtmlNode);
            }
            else
                pos = [0, 0];

            var ev = {
                x         : pos[0] + 10 + document.documentElement.scrollLeft,
                y         : pos[1] + 10 + document.documentElement.scrollTop,
                htmlEvent : e
            }
        }
        else {
            if (e.htmlEvent)
                ev = e;
            else
                ev = { //@todo probably have to deduct the border of the window
                    x         : e.clientX + document.documentElement.scrollLeft,
                    y         : e.clientY + document.documentElement.scrollTop,
                    htmlEvent : e
                }
        }

        ev.bubbles = true; //@todo discuss this, are we ok with bubbling?

        apf.contextMenuKeyboard = null;

        if ((amlNode || apf).dispatchEvent("contextmenu", ev) === false
          || ev.returnValue === false)
            return false;
        //#endif

        if (apf.appsettings.disableRightClick)
            return false;
    });

    var ta = {"INPUT":1, "TEXTAREA":1, "SELECT":1};
    apf.addListener(document, "mousedown", this.$mousedown = function(e){
        e = e || window.event;

        var amlNode = apf.findHost(e.srcElement || e.target);
        
        // #ifdef __WITH_POPUP
        if (apf.popup.last && apf.popup.last != amlNode.uniqueId)
            apf.popup.forceHide();
        // #endif

        //#ifdef __WITH_FOCUS
        var p;
        //Make sure modal windows cannot be left
        if ((!amlNode || !amlNode.$focussable || amlNode.focussable === false)
          && apf.appsettings.allowBlur && amlNode.canHaveChildren != 2) {
            lastFocusParent = null;
            if (apf.window.focussed)
                apf.window.focussed.blur();
        }
        else if ((p = apf.window.focussed && apf.window.focussed.$focusParent || lastFocusParent)
            && p.visible && p.modal && amlNode.$focusParent != p) {
                apf.window.$focusLast(p, {mouse: true});
        }
        else if (!amlNode && apf.window.focussed) {
            apf.window.$focusRoot();
        }
        else if (!amlNode.disabled && amlNode.focussable !== false) {
            if (amlNode.$focussable === apf.KEYBOARD_MOUSE)
                apf.window.$focus(amlNode, {mouse: true});
            else if (amlNode.canHaveChildren == 2) {
                if (!apf.appsettings.allowBlur || !apf.window.focussed 
                  || apf.window.focussed.$focusParent != amlNode)
                    apf.window.$focusLast(amlNode, {mouse: true});
            }
            else
                apf.window.$focusDefault(amlNode, {mouse: true});
        }
        else
            apf.window.$focusDefault(amlNode, {mouse: true});

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            var isContentEditable = ta[(e.srcElement || e.target).tagName]
                && !(e.srcElement || e.target).disabled
                || (e.srcElement && e.srcElement.isContentEditable)
                || amlNode.$isContentEditable
                && amlNode.$isContentEditable(e) && !amlNode.disabled;

            if (!amlNode || !isContentEditable)
                apf.window.$focusfix();
        }
        else if (!last) {
            window.onfocus();
        }
        //#endif
        //#endif

        apf.dispatchEvent("mousedown", {
            htmlEvent : e,
            amlNode   : amlNode
        });

        //Non IE/ iPhone selection handling
        var canSelect = !(!apf.isIphone && !apf.isIE && (apf.AmlParser && !apf.appsettings.allowSelect
          && (!apf.isParsingPartial || amlNode)
          // #ifdef __WITH_DRAGMODE
          || apf.dragmode.mode
          // #endif
          ) && !ta[e.target.tagName]);

        if (canSelect && !amlNode.$allowSelect && (!amlNode.canHaveChildren 
          || !apf.isChildOf(amlNode.oInt, e.target)))
            canSelect = false;
        
        if (!canSelect)
            return false;
    });

    //IE selection handling
    apf.addListener(document, "selectstart", function(e){
        if (!e) e = event;
        
        var canSelect = !(apf.AmlParser && !apf.appsettings.allowSelect
          // #ifdef __WITH_DRAGMODE
          || apf.dragmode.mode
          || apf.dragmode.isDragging
          // #endif
        );

        if (canSelect) {
            var amlNode = apf.findHost(e.srcElement);
            if (!amlNode.$allowSelect && (!amlNode.canHaveChildren 
              || !apf.isChildOf(amlNode.oInt, e.srcElement)))
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
        if (apf.window.focussed
          && !apf.window.focussed.disableKeyboard
          && apf.window.focussed.dispatchEvent("keyup", {
                keyCode  : e.keyCode,
                ctrlKey  : e.ctrlKey,
                shiftKey : e.shiftKey,
                altKey   : e.altkey,
                htmlEvent: e
            }) === false) {
            e.returnValue = false;
            return false;
        }
        //#endif

        apf.dispatchEvent("keyup", null, e);
    });

    //#ifdef __WITH_MOUSESCROLL
    function wheel(e) {
        if (!e)
            e = event;

        var delta = null;
        if (e.wheelDelta) {
            delta = e.wheelDelta / 120;
            if (apf.isOpera)
                delta *= -1;
        }
        else if (e.detail)
            delta = -e.detail / 3;

        if (delta !== null) {
            var ev = {delta: delta, target: e.target || e.srcElement};
            var res = apf.dispatchEvent("mousescroll", ev);
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
    
    //@todo optimize this function
    apf.addListener(document, "keydown", this.$keydown = function(e){
        if (!e)
            e = event;

        //#ifdef __WITH_DEBUG_WIN
        if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
            if (!apf.debugwin.resPath)
                apf.debugwin.init();
            apf.debugwin.activate();
        }
        //#endif

        //#ifdef __WITH_CONTEXTMENU
        if (e.keyCode == 93)
            apf.contextMenuKeyboard = true;
        // #endif
        
        var isContentEditable = ta[(e.explicitOriginalTarget || e.srcElement || e.target).tagName]
          || (e.srcElement && e.srcElement.isContentEditable);

        //#ifdef __WITH_ACTIONTRACKER && __WITH_UNDO_KEYS
        //@todo move this to appsettings and use with_hotkey
        var ctrlKey = apf.isMac ? e.metaKey : e.ctrlKey;
        if (!isContentEditable && apf.appsettings.undokeys && ctrlKey) {
            //Ctrl-Z - Undo
            if (e.keyCode == 90) {
                var o = apf.window.focussed;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = apf.window;
                (o.$at || o.getActionTracker()).undo();
            }
            //Ctrl-Y - Redo
            else if (e.keyCode == 89) {
                var o = apf.window.focussed;
                while (o && !o.getActionTracker && !o.$at)
                    o = o.parentNode;
                if (!o) o = apf.window;
                (o.$at || o.getActionTracker()).redo();
            }
        }
        //#endif

        var eInfo = {
            ctrlKey   : e.ctrlKey,
            shiftKey  : e.shiftKey,
            altKey    : e.altKey,
            keyCode   : e.keyCode,
            htmlEvent : e,
            bubbles   : true
        };

        //#ifdef __WITH_HOTKEY
        //Hotkey
        if (apf.dispatchEvent("hotkey", eInfo) === false || eInfo.returnValue === false) {
            e.returnValue  = false;
            e.cancelBubble = true;
            if (apf.canDisableKeyCodes) {
                try {
                    e.keyCode = 0;
                }
                catch(e) {}
            }
            e.returnValue = false;
            return false;
        }
        //#endif

        //#ifdef __WITH_HOTKEY_PROPERTY
        var keys = []; //@todo put this in a lut
        if (e.altKey)
            keys.push("Alt");
        if (e.ctrlKey)
            keys.push("Ctrl");
        if (e.shiftKey)
            keys.push("Shift");
        if (e.metaKey)
            keys.push("Meta");

        if (apf.keyNames[e.keyCode])
            keys.push(apf.keyNames[e.keyCode]);

        if (keys.length) {
            if (e.keyCode > 46)
                keys.push(String.fromCharCode(e.keyCode));
            apf.setProperty("hotkey", keys.join("-"));
        }
        //#endif

        //#ifdef __WITH_KEYBOARD
        //Keyboard forwarding to focussed object
        if (apf.window.focussed && !apf.window.focussed.disableKeyboard
          && apf.window.focussed.dispatchEvent("keydown", eInfo) === false) {
            e.returnValue  = false;
            e.cancelBubble = true;
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
        else if ((!apf.appsettings.disableTabbing || apf.window.focussed) && e.keyCode == 9) {
            //Window focus handling
            if (e.ctrlKey && apf.window.focussed) {
                var w = apf.window.focussed.$focusParent;
                if (w.modal) {
                    e.returnValue = false;
                    return false;
                }

                apf.window.moveNext(e.shiftKey,
                    apf.window.focussed.$focusParent, true);

                var w = apf.window.focussed.$focusParent;
                if (w && w.bringToFront)
                    w.bringToFront();
            }
            //Element focus handling
            else if(!apf.window.focussed || apf.window.focussed.tagName != "menu")
                apf.window.moveNext(e.shiftKey);

            e.returnValue = false;
            return false;
        }
        //#endif

        //Disable backspace behaviour triggering the backbutton behaviour
        var altKey = apf.isMac ? e.metaKey : e.altKey;
        if (apf.appsettings.disableBackspace
          && (e.keyCode == 8 || altKey && (e.keyCode == 37 || e.keyCode == 39))
          && !isContentEditable) {
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
        if (apf.appsettings.disableF5 && (e.keyCode == 116 || e.keyCode == 117)) {
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
        
        
        /*if (browserNavKeys[e.keyCode] && apf.window.focussed 
          && apf.appsettings.autoDisableNavKeys)
            e.returnValue = false;*/

        if (e.keyCode == 27)
            e.returnValue = false;

        if (!apf.appsettings.allowSelect
          && e.shiftKey && (e.keyCode > 32 && e.keyCode < 41)
          && !isContentEditable) {
            e.returnValue = false;
        }

        //apf.dispatchEvent("keydown", null, eInfo);

        return e.returnValue;
        //#endif
    });
    
    this.init = function(){
        apf.makeClass(this);
        this.document = apf.document = new apf.AmlDocument();
        
        //#ifdef __WITH_ACTIONTRACKER
        this.$at      = new apf.actiontracker();
        this.$at.name = "default";
        apf.nameserver.register("actiontracker", "default", this.$at);
        //#endif
        
        //#ifdef __WITH_WINDOW_FOCUS
        this.addEventListener("focus", function(e){
            if (!apf.window.focussed && lastFocusParent && !apf.isIphone) {
                apf.window.$focusLast(lastFocusParent);
            }
        });
        this.addEventListener("blur", function(e){
            if (!apf.window.focussed || apf.isIphone)
                return;
    
            apf.window.focussed.blur(true, {srcElement: this});//, {cancelBubble: true}
            lastFocusParent = apf.window.focussed.$focusParent;
            apf.window.focussed = null;
        });
        //#endif
    }

    /**
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        apf.destroy(this);

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

        document.oncontextmenu =
        document.onmousedown   =
        document.onmousemove   =
        document.onmouseup     =
        document.onselectstart =
        document.onmousewheel  =
        document.onkeyup       =
        document.onkeydown     = null

        document.body.onmousedown =
        document.body.onmousemove =
        document.body.onmouseup   = null;

        document.body.innerHTML = "";
    };
})();

/**
 * The aml document, this is the root of the DOM Tree and has a nodeType with 
 * value 9 (apf.NODE_DOCUMENT). 
 *
 * @constructor
 * @inherits apf.AmlDom
 * @inherits apf.Class
 * @default_private 
 * @see baseclass.amldom
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.AmlDocument = function(){
    apf.makeClass(this);
    
    //#ifdef __WITH_AMLDOM
    this.implement(apf.AmlDom);
    //#endif

    /**
     * The type of node within the document.
     *   Possible values:
     *   apf.NODE_ELEMENT
     *   apf.NODE_ATTRIBUTE
     *   apf.NODE_TEXT
     *   apf.NODE_CDATA_SECTION
     *   apf.NODE_ENTITY_REFERENCE
     *   apf.NODE_ENTITY
     *   apf.NODE_PROCESSING_INSTRUCTION
     *   apf.NODE_COMMENT
     *   apf.NODE_DOCUMENT
     *   apf.NODE_DOCUMENT_TYPE
     *   apf.NODE_DOCUMENT_FRAGMENT
     *   apf.NODE_NOTATION
     */
    this.nodeType   = apf.NODE_DOCUMENT;
    this.nodeFunc   = apf.NODE_HIDDEN;
    this.$amlLoaded = true;

    /**
     * The root element node of the aml application. This is an element with
     * the tagName 'application'. This is similar to the 'html' element
     */
    this.documentElement = {
        //#ifdef __USE_TOSTRING
        toString : function(){
            return "[Document Element Node, <a:application />]";
        },
        //#endif

        uniqueId      : apf.all.push(this) - 1,
        nodeType      :  1,
        nodeFunc      : apf.NODE_HIDDEN,
        tagName       : "application",
        parentNode    : this,
        ownerDocument : this,
        pHtmlNode     : document.body,
        $aml          : apf.AmlParser.$aml,
        $tabList      : [], //Prevents documentElement from being focussed
        $amlLoaded    : true,
        $focussable   : apf.KEYBOARD,
        focussable    : true,
        visible       : true,

        isWindowContainer : true,
        canHaveChildren   : true,

        focus : function(){
            this.dispatchEvent("focus");
        },

        blur  : function(){
            this.dispatchEvent("blur");
        }
    };

    this.appendChild  =
    this.insertBefore = function(){
        this.documentElement.insertBefore.apply(this.documentElement, arguments);
    };

    apf.implement.call(this.documentElement, apf.Class);
    //#ifdef __WITH_FOCUS
    apf.window.$addFocus(this.documentElement);
    //#endif

    //#ifdef __WITH_AMLDOM
    apf.implement.call(this.documentElement, apf.AmlDom);
    //#endif

    /**
     * Gets a aml element based on it's id.
     * @param {String} id the id of the aml element to return.
     * @return {AMLElement} the aml element with the id specified.
     */
    this.getElementById = function(id){
        return self[id];
    };

    //#ifdef __WITH_AMLDOM_FULL
    /**
     * Creates a new aml element.
     * @param {mixed} tagName information about the new node to create.
     *   Possible values:
     *   {String}     the tagName of the new element to create
     *   {String}     the aml definition for a single or multiple elements.
     *   {XMLElement} the aml definition for a single or multiple elements.
     * @return {AMLElement} the created aml element.
     */
    this.createElement = function(tagName){
        var x, o;

        //We're supporting the nice IE hack
        if (tagName.nodeType) {
            x = tagName;
        }
        else if (tagName.indexOf("<") > -1) {
            x = apf.getXml(tagName)
        }
        else {
            var prefix = apf.findPrefix(apf.AmlParser.$aml, apf.ns.aml);
            var doc = apf.AmlParser.$aml.ownerDocument;

            if(apf.AmlParser.$aml && doc.createElementNS) {
                x = doc.createElementNS(apf.ns.aml, prefix + ":" + tagName);
            }
            else {
                x = apf.getXml("<" + prefix + ":" + tagName + " xmlns:"
                               + prefix + "='" + apf.ns.aml + "' />", true);
            }
        }

        if (apf.isIE) {
            if (!prefix)
                prefix = x.prefix;

            x.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:" + prefix + "='" + apf.ns.aml + "'");
        }

        tagName = x[apf.TAGNAME];
        var initId;

        if (typeof apf[tagName] != "function") { //Call AMLParser??
            o = new apf.AmlDom(tagName, null, apf.NODE_HIDDEN, x);
            if (apf.AmlParser.handler[tagName]) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$amlLoaded)
                        return; //the amlParser will handle the rest

                    o = apf.AmlParser.handler[tagName](this.$aml,
                        pNode, pNode.oInt);

                    if (o) apf.extend(this, o); //ruins prototyped things

                    //Add this component to the nameserver
                    if (o && this.name)
                        apf.nameserver.register(tagName, this.name, o);

                    if (this.name)
                        apf.setReference(name, o);

                    o.$amlLoaded = true;
                }) - 1;
            }
        }
        else {
            o = new apf[tagName](null, tagName, x);
            if (o.loadAml) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$amlLoaded) //We're not ready yet
                        return;

                    function loadAml(o, pHtmlNode){
                        if (!o.$amlLoaded) {
                            //Process AML
                            var length = o.childNodes.length;

                            o.pHtmlNode = pHtmlNode || document.body;
                            o.loadAml(o.$aml);
                            o.$amlLoaded = false; //small hack

                            if (length) {
                                for (var i = 0, l = o.childNodes.length; i < l; i++) {
                                    if (o.childNodes[i].loadAml) {
                                        loadAml(o.childNodes[i], o.canHaveChildren
                                            ? o.oInt
                                            : document.body);
                                    }
                                    else
                                        o.childNodes[i].$amlLoaded = true;
                                }
                            }
                        }
                        if (o.$reappendToParent) {
                            o.$reappendToParent();
                        }

                        o.$amlLoaded = true;
                        o.$reappendToParent = null;
                    }

                    var parsing = apf.isParsing;
                    apf.isParsing = true;
                    apf.AmlParser.parseFirstPass([x]);

                    loadAml(o, pNode && pNode.oInt || document.body);

                    //#ifdef __WITH_ALIGNMENT
                    if (pNode && pNode.pData)
                        apf.layout.compileAlignment(pNode.pData);
                    //#endif

                    //#ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __JTABLE
                    if (pNode.pData)
                        apf.layout.activateRules(pNode.oInt || document.body);
                    //apf.layout.activateRules();//@todo maybe use processQueue
                    //#endif

                    apf.AmlParser.parseLastPass();
                    apf.isParsing = parsing;
                }) - 1;
            }
        }

        if (o.name)
            apf.setReference(o.name, o);

        o.$aml = x;

        return o;
    };
    
    this.createDocumentFragment = function(){
        return new apf.AmlDom(apf.NODE_DOCUMENT_FRAGMENT)
    }
    //#endif

    //#ifdef __WITH_AMLDOM_W3C_XPATH
    /**
     * See W3C evaluate
     */
    this.evaluate = function(sExpr, contextNode, nsResolver, type, x){
        var result = apf.XPath.selectNodes(sExpr,
            contextNode || this.documentElement);

        /**
         * @private
         */
        return {
            snapshotLength : result.length,
            snapshotItem   : function(i){
                return result[i];
            }
        }
    };

    /**
     * See W3C createNSResolver
     */
    this.createNSResolver = function(contextNode){
        return {};
    };
    //#endif
};

//#endif

//#ifdef __WITH_WINDOW_FOCUS
/**
 * @private
 */
apf.sanitizeTextbox = function(oTxt){
    oTxt.onfocus = function(){
        if (apf.window)
            apf.window.$focusfix2();
    };

    oTxt.onblur = function(){
        if (apf.window)
            apf.window.$blurfix();
    };
}
// #endif
