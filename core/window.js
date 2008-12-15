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
};

/**
 * Object representing the window of the jml application. The semantic is
 * similar to that of a window in the browser, except that this window is not
 * the same as the javascript global object. It handles the focussing within
 * the document and several other events such as exit and the keyboard events.
 *
 * @for jpf
 * @event movefocus         Fires when the focus moves from one element to another.
 *   object:
 *   {JMLElement} toElement the element that will receive the focus.
 * @event exit              Fires when the application wants to exit.
 *   cancellable:  Prevents the application from exiting. The returnValue of the
 *   event object is displayed in a popup which asks the user for permission.
 *
 * @for window
 * @event blur              Fires when the browser window looses focus.
 * @event focus             Fires when the browser window receives focus.
 *
 * @for jmlNode
 * @event contextmenu       Fires when the user requests a context menu. Either
 * using the keyboard or mouse.
 *   bubbles: yes
 *   cancellable:  Prevents the default contextmenu from appearing.
 *   object:
 *   {Number} x         the x coordinate where the contextmenu is requested on.
 *   {Number} y         the y coordinate where the contextmenu is requested on.
 *   {Object} htmlEvent the html event object.
 * @event keyup                            Fires when the user stops pressing a key.
 *   cancellable: Prevents the behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   wether the ctrl key was pressed.
 *   {Boolean} shiftKey  wether the shift key was pressed.
 *   {Boolean} altKey    wether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event mousescroll                Fires when the user scrolls the mouse
 *   cancellable: Prevents the container to scroll
 *   object:
 *   {Number} delta the scroll impulse.
 * @event hotkey                        Fires when the user presses a hotkey
 *   bubbles: yes
 *   cancellable: Prevents the default hotkey behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   wether the ctrl key was pressed.
 *   {Boolean} shiftKey  wether the shift key was pressed.
 *   {Boolean} altKey    wether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event keydown                        Fires when the user presses a key
 *   bubbles: yes
 *   cancellable: Prevents the behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   wether the ctrl key was pressed.
 *   {Boolean} shiftKey  wether the shift key was pressed.
 *   {Boolean} altKey    wether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.WindowImplementation = function(){
    jpf.register(this, "window", jpf.NODE_HIDDEN);/** @inherits jpf.Class */
    this.jpf = jpf;

    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[Javeline Component : " + (this.name || "") + " (jpf.window)]";
    };

    /**
     * Retrieves the root action tracker of the application.
     */
    this.getActionTracker = function(){
        return this.$at
    };

    /**
     * @private
     */
    this.loadCodeFile = function(url){
        //if(jpf.isSafari) return;
        if (self[url])
            jpf.importClass(self[url], true, this.win);
        else
            jpf.include(url);//, this.document);
    };

    //#ifdef __WITH_TASKBAR_FLASHING
    /**
     * Flashes the task bar. This can be useful to signal the user that an
     * important event has occured. Only works in internet explorer under
     * certain conditions.
     */
    this.flash = function(){
        if (jpf.window.hasFocus())
            return;

        if (jpf.isDeskrun)
            jdwin.Flash();
        else if (jpf.isIE) {
            if (!this.popup)
                this.popup = window.createPopup();

            if (jpf.window.stopFlash)
                return;

            state += "x"

            function doFlash(nopopup) {
                if (jpf.window.hasFocus())
                    return;

                window.focus();

                function doPopup() {
                    if (jpf.window.hasFocus())
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
                        if (!jpf.window.popup.isOpen
                          || !jpf.window.popup.document.p.isOpen) {
                            clearInterval(jpf.window.flashTimer);

                            if (!jpf.window.hasFocus()) {
                                jpf.window.popup.hide();
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
                        doPopup.call(jpf.window)
                    }, 10);
                else
                    doPopup.call(jpf.window);
            }

            if ("TEXTAREA|INPUT".indexOf(document.activeElement.tagName) > -1) {
                document.activeElement.blur();
                document.body.focus();
                jpf.window.stopFlash = true;
                setTimeout(function(){
                    doFlash.call(jpf.window, true);
                    jpf.window.stopFlash = false;
                }, 10);
            }
            else {
                doFlash.call(jpf.window);
            }
        }
    };
    //#endif

    /**
     * Show the browser window.
     */
    this.show = function(){
        if (jpf.isDeskrun)
            jdwin.Show();
    };

    /**
     * Hide the browser window.
     */
    this.hide = function(){
        if (jpf.isDeskrun)
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
        if (jpf.isDeskrun)
            jdwin.SetFocus();
        else
            window.focus();
    };

    /**
     * Set the icon of the browser window.
     * @param {String} url the location of the .ico file.
     */
    this.setIcon = function(url){
        if (jpf.isDeskrun)
            jdwin.icon = parseInt(url) == url ? parseInt(url) : url;
    };

    /**
     * Set the title of the browser window.
     * @param {String} value the new title of the window.
     */
    this.setTitle = function(value){
        this.title = value || "";

        if (jpf.isDeskrun)
            jdwin.caption = value;
        else
            document.title = (value || "");
    };

    /**
     * @private
     */
    this.loadJml = function(x){
        if (x[jpf.TAGNAME] == "deskrun")
            this.loadDeskRun(x);
        else {

        }
    };

    //#ifdef __DESKRUN
    var jdwin   = jpf.isDeskrun ? window.external : null;
    var jdshell = jpf.isDeskrun ? jdwin.shell : null;

    /**
     * @private
     */
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
        }
        else {
            jdwin.left   = q.getAttribute("left")   || 200;
            jdwin.top    = q.getAttribute("top")    || 200;
            jdwin.width  = q.getAttribute("width")  || 800;
            jdwin.height = q.getAttribute("height") || 600;
        }

        jdwin.caption = q.getAttribute("caption") || "Javeline DeskRun";
        jdwin.icon    = q.getAttribute("icon") || 100;

        var ct = $xmlns(q, "context", jpf.ns.jml);
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
            jpf.console.warn("Jml node already exist for tabindex " + tabindex
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

    this.$focus = function(jmlNode, e, force){
        if (this.focussed == jmlNode && !force)
            return; //or maybe when force do $focus

        //#ifdef __DEBUG
        var hadAlreadyFocus = this.focussed == jmlNode;
        //#endif

        this.$settingFocus = jmlNode;

        if (this.focussed && this.focussed != jmlNode) {
            this.focussed.blur(true, e);

            //#ifdef __WITH_XFORMS
            jmlNode.dispatchEvent("DOMFocusOut");
            //#endif
        }

        (this.focussed = jmlNode).focus(true, e);

        this.$settingFocus = null;

        jpf.dispatchEvent("movefocus", {
            toElement : this.focussed
        });

        //#ifdef __WITH_XFORMS
        jmlNode.dispatchEvent("xforms-focus");
        jmlNode.dispatchEvent("DOMFocusIn");
        //#endif

        //#ifdef __DEBUG
        if (!hadAlreadyFocus)
            jpf.console.info("Focus given to " + this.focussed.tagName +
                " [" + (this.focussed.name || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime)
            jpf.offline.state.set(this, "focus", jmlNode.name || jmlNode.uniqueId);
        //#endif
    };

    this.$blur = function(jmlNode){
        if (this.focussed != jmlNode)
            return false;
        
        //#ifdef __DEBUG
        jpf.console.info(this.focussed.tagName + " ["
            + (this.focussed.name || "") + "] was blurred.");
        //#endif

        jpf.window.focussed.$focusParent.$lastFocussed = null;
        this.focussed = null;

        jpf.dispatchEvent("movefocus", {
            fromElement : jmlNode
        });

        //#ifdef __WITH_XFORMS
        jmlNode.dispatchEvent("DOMFocusOut");
        //#endif
    };

    //#ifdef __WITH_WINDOW_FOCUS
    var lastFocusParent;
    this.addEventListener("focus", function(e){
        if (!jpf.window.focussed && lastFocusParent) {
            jpf.window.$focusLast(lastFocusParent);
        }
    });
    this.addEventListener("blur", function(e){
        if (!jpf.window.focussed)
            return;

        jpf.window.focussed.blur(true, {srcElement: this});//, {cancelBubble: true}
        lastFocusParent = jpf.window.focussed.$focusParent;
        jpf.window.focussed = null;
    });
    //#endif

    this.$focusDefault = function(jmlNode, e){
        var fParent = findFocusParent(jmlNode);
        this.$focusLast(fParent, e);
    }

    this.$focusRoot = function(e){
        var docEl = jpf.document.documentElement;
        if (this.$focusLast(docEl, e) === false) {
            //docEl.$lastFocussed = null;
            //this.moveNext(null, jpf.document.documentElement, true, e);
        }
    };

    this.$focusLast = function(jmlNode, e, ignoreVisible){
        var lf = jmlNode.$lastFocussed;
        if (lf && lf.parentNode && lf.$focussable === true
          && (ignoreVisible || lf.oExt.offsetHeight)) {
            this.$focus(lf, e, true);
        }
        else { //Let's find the object to focus first
            var str, x, node = jmlNode;
            while (node) {
                if (node.focussable !== false && node.$focussable === true
                  && (ignoreVisible || node.oExt.offsetHeight)) {
                    this.$focus(node, e, true);
                    break;
                }

                //Walk sub tree
                if (node.firstChild || node.nextSibling) {
                    node = node.firstChild || node.nextSibling;
                }
                else {
                    do {
                        node = node.parentNode;
                    } while (node && !node.nextSibling && node != jmlNode)

                    if (node == jmlNode)
                        return; //do nothing

                    if (node)
                        node = node.nextSibling;
                }
            }

            if (!node)
                this.$focus(jpf.document.documentElement);//return false;//

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

            this.$focus(jpf.document.documentElement);*/
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

        return node || jpf.document.documentElement;
    }

    //Dom handler
    //@todo make this look at the dom tree insertion point to determine tabindex
    function moveFocus(){
        if (this.isWindowContainer)
            jpf.window.$tabIndex.push(this);
        else
            jpf.window.$addFocus(this, this.tabindex, true)
    }

    //Dom handler
    function removeFocus(doOnlyAdmin){
        if (this.isWindowContainer) {
            jpf.window.$tabList.remove(this);
            return;
        }

        if (!this.$focusParent)
            return;

        this.$focusParent.$tabList.remove(this);
        //this.$focusParent = null; //@experimental to not execute this
    }

    /**** Focus API ****/

    /**
     * Determines wether a given jml element has the focus.
     * @param {JMLElement} the element to check
     * @returns {Boolean} wether the element has focus.
     */
    this.hasFocus = function(jmlNode){
        return this.focussed == jmlNode;
    };

    /**
     * @private
     */
    this.moveNext = function(shiftKey, relObject, switchWindows, e){
        var dir, start, next;

        if (switchWindows && jpf.window.focussed) {
            var p = jpf.window.focussed.$focusParent;
            if (p.visible && p.modal)
                return false;
        }

        var jmlNode = relObject || jpf.window.focussed;
        var fParent = jmlNode
            ? (switchWindows && jmlNode.isWindowContainer
                ? jpf.window
                : jmlNode.$focusParent)
            : jpf.document.documentElement;
        var list    = fParent.$tabList;

        if (jmlNode && (switchWindows || jmlNode != jpf.document.documentElement)) {
            start   = (list || []).indexOf(jmlNode);
            if (start == -1) {
                //#ifdef __DEBUG
                jpf.console.warn("Moving focus from element which isn't in the list\
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

            if (start == next)
                return false; //No visible enabled element was found

            jmlNode = list[next];
        }
        while (!jmlNode
            || jmlNode.disabled
            || jmlNode == jpf.window.focussed
            || (switchWindows ? !jmlNode.visible : jmlNode.oExt && !jmlNode.oExt.offsetHeight)
            || jmlNode.focussable === false
            || switchWindows && !jmlNode.$tabList.length);

        if (fParent == jpf.window)
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
        if (jpf.offline.state.enabled) {
            var node, id = jpf.offline.state.get(this, "focus");

            if (id == -1)
                return this.$focusRoot();

            if (id)
                node = self[id] || jpf.lookup(id);

            if (node) {
                if (!node.$focussable) {
                    //#ifdef __DEBUG
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

        if (this.moveNext() === false) {
            this.moveNext(null, jpf.document.documentElement, true)
        }
    };

    //#endif

    /** Set Window Events **/

    window.onbeforeunload = function(){
        return jpf.dispatchEvent("exit");
    };

    //#ifdef __DESKRUN
    if (jpf.isDeskrun)
        window.external.onbeforeunload = window.onbeforeunload;
    //#endif

    window.onunload = function(){
        jpf.window.isExiting = true;
        jpf.window.destroy();
    };

    //#ifdef __WITH_WINDOW_FOCUS

    var timer, state = "", last = "";
    this.$focusfix = function(){
        state += "a";
        clearTimeout(timer);
        setTimeout("window.focus();");
        timer = setTimeout(determineAction);
    }

    this.$focusfix2 = function(){
        state += "b";
        clearTimeout(timer);
        timer = setTimeout(determineAction);
    }

    this.$blurfix = function(){
        state += "c";
        clearTimeout(timer);
        timer = setTimeout(determineAction);
    }

    function determineAction(){
        clearTimeout(timer);

        //jpf.console.info(state);
        if (state == "e" || state == "c"
          || state.charAt(0) == "x" && !state.match(/eb$/)
          || state == "ce" || state == "de") { //|| state == "ae"
            if (last != "blur") {
                last = "blur";
                jpf.window.dispatchEvent("blur");
                //jpf.console.warn("blur");
            }
        }
        else {
            if (last != "focus") {
                last = "focus";
                jpf.window.dispatchEvent("focus");
                //jpf.console.warn("focus");
            }
        }

        state = "";
        timer = null;
    }

    window.onfocus = function(){
        if (jpf.hasFocusBug) {
            state += "d";
            clearTimeout(timer);
            timer = setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "focus";
            //jpf.console.warn("win-focus");
            iframeFixTimer = setTimeout(iframeFix, 10);
        }
    };

    window.onblur = function(){
        if (jpf.hasFocusBug) {
            state += "e";
            clearTimeout(timer);
            timer = setTimeout(determineAction);
        }
        else {
            clearTimeout(iframeFixTimer)
            iframeFix.newState = "blur";
            //jpf.console.warn("win-blur");
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

        jpf.window.dispatchEvent(last);
        //jpf.console.warn(last);
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
        var jmlNode = jpf.findHost(e.srcElement || e.target)
              || jpf.window.focussed
              || jpf.document && jpf.document.documentElement;

        if (jmlNode.tagName == "menu") //The menu is already visible
            return false;

        var pos, ev;

        if (jmlNode && jmlNode.tagName == "menu")
            jmlNode = jmlNode.parentNode;

        if (jpf.contextMenuKeyboard) {
            if (jmlNode) {
                pos = jmlNode.selected
                    ? jpf.getAbsolutePosition(jmlNode.$selected)
                    : jpf.getAbsolutePosition(jmlNode.oExt || jmlNode.pHtmlNode);
            }
            else
                pos = [0, 0];

            var ev = {
                x         : pos[0] + 10 - document.documentElement.scrollLeft,
                y         : pos[1] + 10 - document.documentElement.scrollTop,
                htmlEvent : e
            }
        }
        else {
            if (e.htmlEvent)
                ev = e;
            else
                ev = { //@todo probably have to deduct the border of the window
                    x         : e.clientX - document.documentElement.scrollLeft,
                    y         : e.clientY - document.documentElement.scrollTop,
                    htmlEvent : e
                }
        }

        ev.bubbles = true; //@todo discuss this, are we ok with bubbling?

        jpf.contextMenuKeyboard = null;

        if ((jmlNode || jpf).dispatchEvent("contextmenu", ev) === false
          || ev.returnValue === false)
            return false;
        //#endif

        if (jpf.appsettings.disableRightClick)
            return false;
    };

    //#ifdef __WITH_EVENTRECORDING
    //@experimental highly!
    var actionStack = [], isPlaying = false, isRecording = false;
    document.documentElement.onmousemove = function(e){
        if (isPlaying || !isRecording)
            return;
        if (!e) e = event;

        actionStack.push([new Date().getTime(), "onmousemove",
            e.srcElement || e.target, jpf.extend({}, e)]);
    }

    document.documentElement.onmousedown = function(e){
        if (isPlaying || !isRecording)
            return;
        if (!e) e = event;

        actionStack.push([new Date().getTime(), "onmousedown",
            e.srcElement || e.target, jpf.extend({}, e)]);
    }

    document.documentElement.onmouseup = function(e){
        if (isPlaying || !isRecording)
            return;

        if (!e) e = event;

        actionStack.push([new Date().getTime(), "onmouseup",
            e.srcElement || e.target, jpf.extend({}, e)]);
    }

    jpf.record = function(){
        isRecording = true;
    }

    var playStack, lastTime;
    jpf.play = function(){
        isRecording = false;
        isPlaying = true;
        playStack = actionStack.slice(0);

        playItem();
    }

    function playItem(){
        var item = playStack.shift();
        lastTime = item[0];

        if (jpf.isIE) {
            var e = document.createEventObject();
            for (prop in item[3]) {
                if (item[3][prop])
                    e[prop] = item[3][prop];
            }
            //e.srcElement = item[2];
            e.target = item[2];

            //setTimeout(function(){
            //try{
                item[2].fireEvent(item[1], e);
            /*}
            catch(e){
            }*/
            //});
        }
        else {
            e = document.createEvent("MouseEvents");
            var src = item[3];
            e.initMouseEvent(src.type, src.bubbles, true, window, 1, src.screenX,
              src.screenY, src.clientX, src.clientY, src.ctrlKey, src.altKey,
              src.shiftKey, src.metaKey, src.button, src.target
            );

            item[2].dispatchEvent(e);
        }

        if (playStack.length)
            setTimeout(function(){
                playItem();
            }, playStack[0][0] - lastTime);
    }
    //#endif

    var ta = {"INPUT":1, "TEXTAREA":1};
    document.onmousedown = function(e){
        if (!e) e = event;
        var jmlNode = jpf.findHost(e.srcElement || e.target);

        // #ifdef __WITH_POPUP
        if (jpf.popup.last && jpf.popup.last != jmlNode.uniqueId)
            jpf.popup.forceHide();
        // #endif

        //#ifdef __WITH_FOCUS
        var p;
        //Make sure modal windows cannot be left
        if ((!jmlNode || !jmlNode.$focussable || jmlNode.focussable === false) 
          && jpf.appsettings.allowBlur) {
            lastFocusParent = null;
            if (jpf.window.focussed)
                jpf.window.focussed.blur();
        }
        else if ((p = jpf.window.focussed && jpf.window.focussed.$focusParent || lastFocusParent)
            && p.visible && p.modal && jmlNode.$focusParent != p) {
                jpf.window.$focusLast(p, {mouse: true});
        }
        else if (!jmlNode && jpf.window.focussed) {
            jpf.window.$focusRoot();
        }
        else if (!jmlNode.disabled && jmlNode.focussable !== false) {
            if (jmlNode.$focussable === jpf.KEYBOARD_MOUSE)
                jpf.window.$focus(jmlNode, {mouse: true});
            else if (jmlNode.canHaveChildren == 2)
                jpf.window.$focusLast(jmlNode, {mouse: true});
            else
                jpf.window.$focusDefault(jmlNode, {mouse: true});
        }
        else
            jpf.window.$focusDefault(jmlNode, {mouse: true});

        //#ifdef __WITH_WINDOW_FOCUS
        if (jpf.hasFocusBug) {
            var isContentEditable = ta[(e.srcElement || e.target).tagName]
                && !(e.srcElement || e.target).disabled || jmlNode.$isContentEditable
                && jmlNode.$isContentEditable(e) && !jmlNode.disabled;

            if (!jmlNode || !isContentEditable)
                jpf.window.$focusfix();
        }
        else if (!last) {
            window.onfocus();
        }
        //#endif

        //#endif

        //Non IE selection handling
        if (!jpf.isIE && (jpf.JmlParser && !jpf.appsettings.allowSelect
          && (!jpf.isParsingPartial || jmlNode)
          // #ifdef __WITH_DRAGMODE
          || jpf.dragmode.mode
          // #endif
          ) && !ta[e.target.tagName])
            return false;
    };

    document.onselectstart = function(e){
        if (!e) e = event;

        //IE selection handling
        if (jpf.JmlParser && !jpf.appsettings.allowSelect
          // #ifdef __WITH_DRAGMODE
          || jpf.dragmode.mode
          || jpf.dragmode.isDragging
          // #endif
          )
            return false;
    };

    // Keyboard forwarding to focussed object
    document.onkeyup = function(e){
        if (!e) e = event;

        //#ifdef __WITH_KEYBOARD
        if (jpf.window.focussed
          && !jpf.window.focussed.disableKeyboard
          && jpf.window.focussed.dispatchEvent("keyup", {
                keyCode  : e.keyCode,
                ctrlKey  : e.ctrlKey,
                shiftKey : e.shiftKey,
                altKey   : e.altkey,
                htmlEvent : e
            }) === false) {
            return false;
        }
        //#endif

        jpf.dispatchEvent("keyup", null, e);
    };

    //#ifdef __WITH_MOUSESCROLL
    function wheel(e) {
        if (!e)
            e = event;

        var delta = null;
        if (e.wheelDelta) {
            delta = e.wheelDelta / 120;
            if (jpf.isOpera)
                delta *= -1;
        }
        else if (e.detail)
            delta = -e.detail / 3;

        if (delta !== null) {
            var ev = {delta: delta};
            var res = jpf.dispatchEvent("mousescroll", ev);
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

    //#ifdef __WITH_HOTKEY_PROPERTY
    var keyNames = {
        "32" : "Spacebar",
        "13" : "Enter",
        "9"  : "Tab",
        "27" : "Esc",
        "46" : "Del",
        "36" : "Home",
        "35" : "End",
        "107": "+",
        "37" : "Left Arrow",
        "38" : "Up Arrow",
        "39" : "Right Arrow",
        "40" : "Down Arrow",
        "33" : "Page Up",
        "34" : "Page Down",
        "112": "F1",
        "113": "F2",
        "114": "F3",
        "115": "F4",
        "116": "F5",
        "117": "F6",
        "118": "F7",
        "119": "F8",
        "120": "F9",
        "121": "F10",
        "122": "F11",
        "123": "F12"
    };
    //#endif

    document.onkeydown = function(e){
        if (!e)
            e = event;

        //#ifdef __WITH_CONTEXTMENU
        if (e.keyCode == 93)
            jpf.contextMenuKeyboard = true;
        // #endif

        //#ifdef __WITH_ACTIONTRACKER && __WITH_UNDO_KEYS
        if (jpf.appsettings.useUndoKeys && e.ctrlKey) {
            //Ctrl-Z - Undo
            if (e.keyCode == 90) {
                var o = jpf.window.focussed;
                if (!o || !o.getActionTracker)
                     o = jpf.window;
                o.getActionTracker().undo();
            }
            //Ctrl-Y - Redo
            else if (e.keyCode == 89) {
                var o = jpf.window.focussed;
                if (!o || !o.getActionTracker)
                     o = jpf.window;
                o.getActionTracker().redo();
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
        if (jpf.dispatchEvent("hotkey", eInfo) === false || eInfo.returnValue === false) {
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
        //#endif

        //#ifdef __WITH_HOTKEY_PROPERTY
        var keys = []; //@todo put this in a lut
        if (e.altKey)
            keys.push("Alt");
        if (e.ctrlKey)
            keys.push("Ctrl");
        if (e.shiftKey)
            keys.push("Shift");

        if (keyNames[e.keyCode])
            keys.push(keyNames[e.keyCode]);

        if (keys.length) {
            if (e.keyCode > 46) keys.push(String.fromCharCode(e.keyCode));
            jpf.setProperty("hotkey", keys.join("-"));
        }
        //#endif


        //#ifdef __WITH_KEYBOARD
        //Keyboard forwarding to focussed object
        if (jpf.window.focussed && !jpf.window.focussed.disableKeyboard
          && jpf.window.focussed.dispatchEvent("keydown", eInfo) === false) {
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

        //#ifdef __WITH_FOCUS
        //Focus handling
        else if ((!jpf.appsettings.disableTabbing || jpf.window.focussed) && e.keyCode == 9) {
            //Window focus handling
            if (e.ctrlKey) {
                if (jpf.window.focussed) {
                    jpf.window.moveNext(e.shiftKey,
                        jpf.window.focussed.$focusParent, true);

                    var w = jpf.window.focussed.$focusParent;
                    if (w && w.bringToFront)
                        w.bringToFront();
                }
            }
            //Element focus handling
            else if(!jpf.window.focussed || jpf.window.focussed.tagName != "menu")
                jpf.window.moveNext(e.shiftKey);

            e.returnValue = false;
            return false;
        }
        //#endif

        //Disable backspace behaviour triggering the backbutton behaviour
        if (jpf.appsettings.disableBackspace
          && (e.keyCode == 8 || e.altKey && (e.keyCode == 37 || e.keyCode == 39))
          && !ta[(e.srcElement || e.target).tagName]) {
            if (jpf.canDisableKeyCodes) {
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
        if (jpf.appsettings.disableF5 && (e.keyCode == 116 || e.keyCode == 117)) {
            if (jpf.canDisableKeyCodes) {
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

        if (e.keyCode == 27) { //or up down right left pageup pagedown home end unless body is selected
            e.returnValue = false;
        }

        if (!jpf.appsettings.allowSelect
          && e.shiftKey && (e.keyCode > 32 && e.keyCode < 41)
          && !ta[(e.explicitOriginalTarget || e.srcElement || e.target).tagName]
          && (!e.srcElement || e.srcElement.contentEditable != "true")) {
                e.returnValue = false;
        }

        //jpf.dispatchEvent("keydown", null, eInfo);

        return e.returnValue;
        //#endif
    };

    //#ifdef __WITH_HOTKEY
    //@todo maybe generalize this to pub/sub event system??
    var hotkeys = {}, keyMods = {"ctrl":1, "alt":2, "shift": 4};

    /**
     * Registers a hotkey handler to a key combination.
     * Example:
     * <code>
     *   jpf.registerHotkey('Ctrl-Z', undoHandler);
     * </code>
     * @param {String}   hotkey  the key combination to user. This is a
     * combination of Ctrl, Alt, Shift and a normal key to press. Use + to
     * seperate the keys.
     * @param {Function} handler the code to be executed when the key
     * combination is pressed.
     */
    jpf.registerHotkey = function(hotkey, handler){
        var hashId = 0, key;

        var keys = hotkey.splitSafe("\\-|\\+| ", null, true);
        for (var i = 0; i < keys.length; i++) {
            if (keyMods[keys[i]])
                hashId = hashId | keyMods[keys[i]];
            else
                key = keys[i];
        }

        //#ifdef __DEBUG
        if (!key) {
            throw new Error("missing key for hotkey: " + hotkey);
        }
        //#endif

        (hotkeys[hashId] || (hotkeys[hashId] = {}))[key] = handler;
    };

    /**
     * Removes a registered hotkey.
     * @param {String} hotkey the hotkey combination.
     */
    jpf.removeHotkey = function(hotkey){
        jpf.registerHotkey(hotkey, null);
    };

    jpf.addEventListener("hotkey", function(e){
        var hashId = 0 | (e.ctrlKey ? 1 : 0)
            | (e.shiftKey ? 2 : 0) | (e.shiftKey ? 4 : 0);

        var key = keyNames[e.keyCode];
        if (!hashId && !key) //Hotkeys should always have one of the modifiers
            return;

        var handler = (hotkeys[hashId] || {})[(key
            || String.fromCharCode(e.keyCode)).toLowerCase()];
        if (handler) {
            handler();
            e.returnValue = false;
        }
    });
    //#endif

    this.destroy = function(){
        this.$at = null;

        jpf.destroy(this);
        jpf.windowManager.destroy(this);

        jpf           =
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
 * The jml document. This is the jml node with nodeType 9. It is the root of
 * the application and has a refererence to the documentElement.
 *
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.DocumentImplementation = function(){
    jpf.makeClass(this);

    //#ifdef __WITH_JMLDOM
    this.inherit(jpf.JmlDom); /** @inherits jpf.JmlDom */
    //#endif

    this.nodeType   = jpf.NODE_DOCUMENT;
    this.nodeFunc   = jpf.NODE_HIDDEN;
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

        uniqueId      : jpf.all.push(this) - 1,
        nodeType      :  1,
        nodeFunc      : jpf.NODE_HIDDEN,
        tagName       : "application",
        parentNode    : this,
        ownerDocument : this,
        pHtmlNode     : document.body,
        $jml          : jpf.JmlParser.$jml,
        $tabList      : [], //Prevents documentElement from being focussed
        $jmlLoaded    : true,
        $focussable   : jpf.KEYBOARD,
        focussable    : true,

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

    jpf.inherit.call(this.documentElement, jpf.Class);
    jpf.window.$addFocus(this.documentElement);

    //#ifdef __WITH_JMLDOM
    jpf.inherit.call(this.documentElement, jpf.JmlDom);
    //#endif

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
            x = jpf.getXml(tagName)
        }
        else {
            var prefix = jpf.findPrefix(jpf.JmlParser.$jml, jpf.ns.jml);
            var doc = jpf.JmlParser.$jml.ownerDocument;

            if(jpf.JmlParser.$jml && doc.createElementNS) {
                x = doc.createElementNS(jpf.ns.jml, prefix + ":" + tagName);
            }
            else {
                x = jpf.getXml("<" + prefix + ":" + tagName + " xmlns:"
                               + prefix + "='" + jpf.ns.jml + "' />", true);
            }
        }

        if (jpf.isIE) {
            if (!prefix)
                prefix = x.prefix;

            x.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:" + prefix + "='" + jpf.ns.jml + "'");
        }

        tagName = x[jpf.TAGNAME];
        var initId;

        if (typeof jpf[tagName] != "function") { //Call JMLParser??
            o = new jpf.JmlDom(tagName, null, jpf.NODE_HIDDEN, x);
            if (jpf.JmlParser.handler[tagName]) {
                initId = o.$domHandlers["reparent"].push(function(b, pNode){
                    this.$domHandlers.reparent[initId] = null;

                    if (!pNode.$jmlLoaded)
                        return; //the jmlParser will handle the rest

                    o = jpf.JmlParser.handler[tagName](this.$jml,
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
                    //jpf.layout.activateRules();//@todo maybe use processQueue
                    //#endif

                    jpf.JmlParser.parseLastPass();
                    jpf.isParsing = parsing;
                }) - 1;
            }
        }

        if (o.name)
            jpf.setReference(o.name, o);

        o.$jml = x;

        return o;
    };
    //#endif

    //#ifdef __WITH_JMLDOM_W3C_XPATH
    /**
     * See W3C evaluate
     */
    this.evaluate = function(sExpr, contextNode, nsResolver, type, x){
        var result = jpf.XPath.selectNodes(sExpr,
            contextNode || this.documentElement);

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

// #endif

//#ifdef __WITH_WINDOW_FOCUS
jpf.sanitizeTextbox = function(oTxt){
    oTxt.onfocus = function(){
        jpf.window.$focusfix2();
    };

    oTxt.onblur = function(){
        jpf.window.$blurfix();
    };
}
// #endif
