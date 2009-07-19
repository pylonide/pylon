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
 * @private
 */
apf.windowManager = {
    destroy: function(frm){
        //Remove All Cross Window References Created on Init by apf.windowManager
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
        this.forms.push(apf.setReference(x.name, x, true));
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
};

/**
 * Object representing the window of the jml application. The semantic is
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
apf.WindowImplementation = function(){
    apf.register(this, "window", apf.NODE_HIDDEN);
    this.apf = apf;

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
    this.loadJml = function(x){
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

        var ct = $xmlns(q, "context", apf.ns.jml);
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
                    tray.PopupItemAdd(apf.getXmlValue(nodes[i], "."),
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

    this.$addFocus = function(jmlNode, tabindex, isAdmin){
        if (!isAdmin) {
            if (jmlNode.$domHandlers) {
                jmlNode.$domHandlers.reparent.push(moveFocus);
                jmlNode.$domHandlers.remove.push(removeFocus);
            }

            if (jmlNode.isWindowContainer > -1) {
                jmlNode.addEventListener("focus", trackChildFocus);

                if (!jmlNode.$tabList) {
                    jmlNode.$tabList = [jmlNode];
                }

                jmlNode.$focusParent = jmlNode;
                this.$tabList.push(jmlNode);

                return;
            }
        }

        var fParent = findFocusParent(jmlNode);
        var list    = fParent.$tabList;

        //#ifdef __DEBUG
        if (list[tabindex]) {
            apf.console.warn("Jml node already exist for tabindex " + tabindex
                             + ". Will insert " + jmlNode.tagName + " ["
                             + (jmlNode.name || "") + "] before existing one");
        }
        //#endif

        jmlNode.$focusParent = fParent;

        if (list[tabindex])
            list.insertIndex(jmlNode, tabindex);
        else
            list.push(jmlNode);
    };

    this.$removeFocus = function(jmlNode){
        if (!jmlNode.$focusParent)
            return;

        jmlNode.$focusParent.$tabList.remove(jmlNode);

        if (!jmlNode.isWindowContainer && jmlNode.$domHandlers) {
            jmlNode.$domHandlers.reparent.remove(moveFocus);
            jmlNode.$domHandlers.remove.remove(removeFocus);
        }

        if (jmlNode.isWindowContainer > -1)
            jmlNode.removeEventListener("focus", trackChildFocus);
    };

    var focusLoopDetect;
    this.$focus = function(jmlNode, e, force){
        if (this.focussed == jmlNode && !force)
            return; //or maybe when force do $focus

        //#ifdef __DEBUG
        var hadAlreadyFocus = this.focussed == jmlNode;
        //#endif

        this.$settingFocus = jmlNode;

        if (this.focussed && this.focussed != jmlNode 
          && focusLoopDetect != this.focussed) {
            focusLoopDetect = this.focussed;
            this.focussed.blur(true, e);

            //#ifdef __WITH_XFORMS
            jmlNode.dispatchEvent("DOMFocusOut");
            //#endif
            
            if (focusLoopDetect != this.focussed)
                return false;
        }

        (this.focussed = jmlNode).focus(true, e);

        this.$settingFocus = null;

        apf.dispatchEvent("movefocus", {
            toElement : this.focussed
        });

        //#ifdef __WITH_XFORMS
        jmlNode.dispatchEvent("xforms-focus");
        jmlNode.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        if (!hadAlreadyFocus)
            apf.console.info("Focus given to " + this.focussed.tagName +
                " [" + (this.focussed.name || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime)
            apf.offline.state.set(this, "focus", jmlNode.name || jmlNode.uniqueId);
        //#endif
    };

    this.$blur = function(jmlNode){
        if (this.focussed != jmlNode)
            return false;

        //#ifdef __DEBUG
        apf.console.info(this.focussed.tagName + " ["
            + (this.focussed.name || "") + "] was blurred.");
        //#endif

        apf.window.focussed.$focusParent.$lastFocussed = null;
        this.focussed = null;

        apf.dispatchEvent("movefocus", {
            fromElement : jmlNode
        });

        //#ifdef __WITH_XFORMS
        jmlNode.dispatchEvent("DOMFocusOut");
        //#endif
    };
    
    var lastFocusParent;
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

    this.$focusDefault = function(jmlNode, e){
        var fParent = findFocusParent(jmlNode);
        this.$focusLast(fParent, e);
    }

    this.$focusRoot = function(e){
        var docEl = apf.document.documentElement;
        if (this.$focusLast(docEl, e) === false) {
            //docEl.$lastFocussed = null;
            //this.moveNext(null, apf.document.documentElement, true, e);
        }
    };

    this.$focusLast = function(jmlNode, e, ignoreVisible){
        var lf = jmlNode.$lastFocussed;

        if (lf && lf.parentNode && lf.$focussable === true
          && (ignoreVisible || lf.oExt.offsetHeight)) {
            this.$focus(lf, e, true);
        }
        else { //Let's find the object to focus first
            var next, str, x, node = jmlNode, skip;
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
                else if (node == jmlNode) {
                    if (node.isWindowContainer)
                        this.$focus(node, e, true);
                    return;
                }
                else {
                    do {
                        node = node.parentNode;
                    } while (node && !node.nextSibling && node != jmlNode 
                      && !node.isWindowContainer)
                    
                    if (node == jmlNode)
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
            var node, list = jmlNode.$tabList;
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

    function findFocusParent(jmlNode){
        var node = jmlNode;
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
     * Determines whether a given jml element has the focus.
     * @param {JMLElement} the element to check
     * @returns {Boolean} whether the element has focus.
     */
    this.hasFocus = function(jmlNode){
        return this.focussed == jmlNode;
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

        var jmlNode = relObject || apf.window.focussed;
        var fParent = jmlNode
            ? (switchWindows && jmlNode.isWindowContainer
                ? apf.window
                : jmlNode.$focusParent)
            : apf.document.documentElement;
        var list    = fParent.$tabList;

        if (jmlNode && (switchWindows || jmlNode != apf.document.documentElement)) {
            start   = (list || []).indexOf(jmlNode);
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

        if (this.focussed && this.focussed == jmlNode
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

            if (start == next && jmlNode)
                return false; //No visible enabled element was found

            jmlNode = list[next];
        }
        while (!jmlNode
            || jmlNode.disabled
            || jmlNode == apf.window.focussed
            || (switchWindows ? !jmlNode.visible : jmlNode.oExt && !jmlNode.oExt.offsetHeight)
            || jmlNode.focussable === false
            || switchWindows && !jmlNode.$tabList.length);

        if (fParent == apf.window)
            this.$focusLast(jmlNode, {mouse:true}, switchWindows);
        else
            this.$focus(jmlNode, e);

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

    window.onbeforeunload = function(){
        return apf.dispatchEvent("exit");
    };

    //#ifdef __DESKRUN
    if (apf.isDeskrun)
        window.external.onbeforeunload = window.onbeforeunload;
    //#endif

    window.onunload = function(){
        apf.window.isExiting = true;
        apf.window.destroy();
    };

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

    window.onfocus = function(){
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
    };

    window.onblur = function(){
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
    };

    var iframeFixTimer;
    function iframeFix(){
        clearTimeout(iframeFixTimer);

        var newState = iframeFix.newState;
        if (last == newState)
            return;

        last = newState;

        apf.window.dispatchEvent(last);
        //apf.console.warn(last);
    }

    this.hasFocus = function(){
        return last == "focus";
    }

    //#endif

    /**** Keyboard and Focus Handling ****/

    document.oncontextmenu = function(e){
        if (!e)
            e = event;

        //#ifdef __WITH_CONTEXTMENU
        var jmlNode = apf.findHost(e.srcElement || e.target)
              || apf.window.focussed
              || apf.document && apf.document.documentElement;

        if (jmlNode.tagName == "menu") //The menu is already visible
            return false;

        var pos, ev;

        if (jmlNode && jmlNode.tagName == "menu")
            jmlNode = jmlNode.parentNode;

        if (apf.contextMenuKeyboard) {
            if (jmlNode) {
                pos = jmlNode.selected
                    ? apf.getAbsolutePosition(jmlNode.$selected)
                    : apf.getAbsolutePosition(jmlNode.oExt || jmlNode.pHtmlNode);
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

        if ((jmlNode || apf).dispatchEvent("contextmenu", ev) === false
          || ev.returnValue === false)
            return false;
        //#endif

        if (apf.appsettings.disableRightClick)
            return false;
    };

    var ta = {"INPUT":1, "TEXTAREA":1, "SELECT":1};
    document.onmousedown = function(e){
        e = e || window.event;

        var jmlNode = apf.findHost(e.srcElement || e.target);
        
        // #ifdef __WITH_POPUP
        if (apf.popup.last && apf.popup.last != jmlNode.uniqueId)
            apf.popup.forceHide();
        // #endif

        //#ifdef __WITH_FOCUS
        var p;
        //Make sure modal windows cannot be left
        if ((!jmlNode || !jmlNode.$focussable || jmlNode.focussable === false)
          && apf.appsettings.allowBlur && jmlNode.canHaveChildren != 2) {
            lastFocusParent = null;
            if (apf.window.focussed)
                apf.window.focussed.blur();
        }
        else if ((p = apf.window.focussed && apf.window.focussed.$focusParent || lastFocusParent)
            && p.visible && p.modal && jmlNode.$focusParent != p) {
                apf.window.$focusLast(p, {mouse: true});
        }
        else if (!jmlNode && apf.window.focussed) {
            apf.window.$focusRoot();
        }
        else if (!jmlNode.disabled && jmlNode.focussable !== false) {
            if (jmlNode.$focussable === apf.KEYBOARD_MOUSE)
                apf.window.$focus(jmlNode, {mouse: true});
            else if (jmlNode.canHaveChildren == 2) {
                if (!apf.appsettings.allowBlur || !apf.window.focussed 
                  || apf.window.focussed.$focusParent != jmlNode)
                    apf.window.$focusLast(jmlNode, {mouse: true});
            }
            else
                apf.window.$focusDefault(jmlNode, {mouse: true});
        }
        else
            apf.window.$focusDefault(jmlNode, {mouse: true});

        //#ifdef __WITH_WINDOW_FOCUS
        if (apf.hasFocusBug) {
            var isContentEditable = ta[(e.srcElement || e.target).tagName]
                && !(e.srcElement || e.target).disabled || jmlNode.$isContentEditable
                && jmlNode.$isContentEditable(e) && !jmlNode.disabled;

            if (!jmlNode || !isContentEditable)
                apf.window.$focusfix();
        }
        else if (!last) {
            window.onfocus();
        }
        //#endif
        //#endif

        apf.dispatchEvent("mousedown", {
            htmlEvent : e,
            jmlNode   : jmlNode
        });

        //Non IE/ iPhone selection handling
        var canSelect = !(!apf.isIphone && !apf.isIE && (apf.JmlParser && !apf.appsettings.allowSelect
          && (!apf.isParsingPartial || jmlNode)
          // #ifdef __WITH_DRAGMODE
          || apf.dragmode.mode
          // #endif
          ) && !ta[e.target.tagName]);

        if (canSelect && !jmlNode.canHaveChildren 
          || !apf.xmldb.isChildOf(jmlNode.oInt, e.target))
            canSelect = false;
        
        if (!canSelect)
            return false;
    };

    //IE selection handling
    document.onselectstart = function(e){
        if (!e) e = event;
        
        var canSelect = !(apf.JmlParser && !apf.appsettings.allowSelect
          // #ifdef __WITH_DRAGMODE
          || apf.dragmode.mode
          || apf.dragmode.isDragging
          // #endif
        );

        if (canSelect) {
            var jmlNode = apf.findHost(e.srcElement);
            if (!jmlNode.canHaveChildren 
              || !apf.xmldb.isChildOf(jmlNode.oInt, e.srcElement))
                canSelect = false;
        }

        if (!canSelect) {
            e.returnValue = false;
            return false;
        }
    };

    // Keyboard forwarding to focussed object
    document.onkeyup = function(e){
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
    };

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
    document.onkeydown = function(e){
        if (!e)
            e = event;

        //#ifdef __WITH_CONTEXTMENU
        if (e.keyCode == 93)
            apf.contextMenuKeyboard = true;
        // #endif

        //#ifdef __WITH_ACTIONTRACKER && __WITH_UNDO_KEYS
        //@todo move this to appsettings and use with_hotkey
        var ctrlKey = apf.isMac ? e.metaKey : e.ctrlKey;
        if (apf.appsettings.undokeys && ctrlKey) {
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
          && !ta[(e.srcElement || e.target).tagName]) {
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
          && !ta[(e.explicitOriginalTarget || e.srcElement || e.target).tagName]
          && (!e.srcElement || e.srcElement.contentEditable != "true")) {
            e.returnValue = false;
        }

        //apf.dispatchEvent("keydown", null, eInfo);

        return e.returnValue;
        //#endif
    };

    /**
     * @private
     */
    this.destroy = function(){
        this.$at = null;

        apf.destroy(this);
        apf.windowManager.destroy(this);

        apf           =
        this.win      =
        this.window   =
        this.document = null;

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
};

/**
 * The jml document, this is the root of the DOM Tree and has a nodeType with 
 * value 9 (apf.NODE_DOCUMENT). 
 *
 * @constructor
 * @inherits apf.JmlDom
 * @inherits apf.Class
 * @default_private 
 * @see baseclass.jmldom
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.DocumentImplementation = function(){
    apf.makeClass(this);

    //#ifdef __WITH_JMLDOM
    this.implement(apf.JmlDom);
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
    this.$jmlLoaded = true;

    /**
     * The root element node of the jml application. This is an element with
     * the tagName 'application'. This is similar to the 'html' element
     */
    this.documentElement = {
        //#ifdef __USE_TOSTRING
        toString : function(){
            return "[Document Element Node, <j:application />]";
        },
        //#endif

        uniqueId      : apf.all.push(this) - 1,
        nodeType      :  1,
        nodeFunc      : apf.NODE_HIDDEN,
        tagName       : "application",
        parentNode    : this,
        ownerDocument : this,
        pHtmlNode     : document.body,
        $jml          : apf.JmlParser.$jml,
        $tabList      : [], //Prevents documentElement from being focussed
        $jmlLoaded    : true,
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

    //#ifdef __WITH_JMLDOM
    apf.implement.call(this.documentElement, apf.JmlDom);
    //#endif

    /**
     * Gets a jml element based on it's id.
     * @param {String} id the id of the jml element to return.
     * @return {JMLElement} the jml element with the id specified.
     */
    this.getElementById = function(id){
        return self[id];
    };

    //#ifdef __WITH_JMLDOM_FULL
    /**
     * Creates a new jml element.
     * @param {mixed} tagName information about the new node to create.
     *   Possible values:
     *   {String}     the tagName of the new element to create
     *   {String}     the jml definition for a single or multiple elements.
     *   {XMLElement} the jml definition for a single or multiple elements.
     * @return {JMLElement} the created jml element.
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
            var prefix = apf.findPrefix(apf.JmlParser.$jml, apf.ns.jml);
            var doc = apf.JmlParser.$jml.ownerDocument;

            if(apf.JmlParser.$jml && doc.createElementNS) {
                x = doc.createElementNS(apf.ns.jml, prefix + ":" + tagName);
            }
            else {
                x = apf.getXml("<" + prefix + ":" + tagName + " xmlns:"
                               + prefix + "='" + apf.ns.jml + "' />", true);
            }
        }

        if (apf.isIE) {
            if (!prefix)
                prefix = x.prefix;

            x.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:" + prefix + "='" + apf.ns.jml + "'");
        }

        tagName = x[apf.TAGNAME];
        var initId;

        if (typeof apf[tagName] != "function") { //Call JMLParser??
            o = new apf.JmlDom(tagName, null, apf.NODE_HIDDEN, x);
            if (apf.JmlParser.handler[tagName]) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$jmlLoaded)
                        return; //the jmlParser will handle the rest

                    o = apf.JmlParser.handler[tagName](this.$jml,
                        pNode, pNode.oInt);

                    if (o) apf.extend(this, o); //ruins prototyped things

                    //Add this component to the nameserver
                    if (o && this.name)
                        apf.nameserver.register(tagName, this.name, o);

                    if (this.name)
                        apf.setReference(name, o);

                    o.$jmlLoaded = true;
                }) - 1;
            }
        }
        else {
            o = new apf[tagName](null, tagName, x);
            if (o.loadJml) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$jmlLoaded) //We're not ready yet
                        return;

                    function loadJml(o, pHtmlNode){
                        if (!o.$jmlLoaded) {
                            //Process JML
                            var length = o.childNodes.length;

                            o.pHtmlNode = pHtmlNode || document.body;
                            o.loadJml(o.$jml);
                            o.$jmlLoaded = false; //small hack

                            if (length) {
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
                        }
                        if (o.$reappendToParent) {
                            o.$reappendToParent();
                        }

                        o.$jmlLoaded = true;
                        o.$reappendToParent = null;
                    }

                    var parsing = apf.isParsing;
                    apf.isParsing = true;
                    apf.JmlParser.parseFirstPass([x]);

                    loadJml(o, pNode && pNode.oInt || document.body);

                    //#ifdef __WITH_ALIGNMENT
                    if (pNode && pNode.pData)
                        apf.layout.compileAlignment(pNode.pData);
                    //#endif

                    //#ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
                    if (pNode.pData)
                        apf.layout.activateRules(pNode.oInt || document.body);
                    //apf.layout.activateRules();//@todo maybe use processQueue
                    //#endif

                    apf.JmlParser.parseLastPass();
                    apf.isParsing = parsing;
                }) - 1;
            }
        }

        if (o.name)
            apf.setReference(o.name, o);

        o.$jml = x;

        return o;
    };
    
    this.createDocumentFragment = function(){
        return new apf.JmlDom(apf.NODE_DOCUMENT_FRAGMENT)
    }
    //#endif

    //#ifdef __WITH_JMLDOM_W3C_XPATH
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
