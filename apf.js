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

//#ifndef __WITH_O3

/**
 * Ajax.org Platform
 *
 * @author    Ruben Daniels (ruben AT javeline DOT com)
 * @version   3.0
 * @url       http://www.ajax.org
 *
 * @event domready      Fires when the browsers' dom is ready to be manipulated.
 * @event movefocus         Fires when the focus moves from one element to another.
 *   object:
 *   {AMLElement} toElement the element that will receive the focus.
 * @event exit              Fires when the application wants to exit.
 *   cancelable:  Prevents the application from exiting. The returnValue of the
 *   event object is displayed in a popup which asks the user for permission.
 * @event keyup         Fires when the user stops pressing a key.
 *   cancelable: Prevents the behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event mousescroll   Fires when the user scrolls the mouse
 *   cancelable: Prevents the container to scroll
 *   object:
 *   {Number} delta the scroll impulse.
 * @event hotkey        Fires when the user presses a hotkey
 *   bubbles: yes
 *   cancelable: Prevents the default hotkey behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event keydown       Fires when the user presses a key
 *   bubbles: yes
 *   cancelable: Prevents the behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event mousedown     Fires when the user presses a mouse button
 *   object:
 *   {Event}      htmlEvent the char code of the pressed key.
 *   {AMLElement} amlNode   the element on which is clicked.
 * @event onbeforeprint Fires before the application will print.
 * @event onafterprint  Fires after the application has printed.
 * @event load          Fires after the application is loaded.
 * @event error         Fires when a communication error has occured while making a request for this element.
 *   cancelable: Prevents the error from being thrown.
 *   bubbles:
 *   object:
 *   {Error}          error     the error object that is thrown when the event callback doesn't return false.
 *   {Number}         state     the state of the call
 *     Possible values:
 *     apf.SUCCESS  the request was successfull
 *     apf.TIMEOUT  the request has timed out.
 *     apf.ERROR    an error has occurred while making the request.
 *     apf.OFFLINE  the request was made while the application was offline.
 *   {mixed}          userdata  data that the caller wanted to be available in the callback of the http request.
 *   {XMLHttpRequest} http      the object that executed the actual http request.
 *   {String}         url       the url that was requested.
 *   {Http}           tpModule  the teleport module that is making the request.
 *   {Number}         id        the id of the request.
 *   {String}         message   the error message.
 * @default_private
 */
var apf = {
    // Content Distribution Network URL:
    // #ifndef __WITH_CDN
    /**
     * The url to the content delivery network.
     * @type {String}
     */
    CDN            : "",
    /* #else
    CDN            : "http://cdn.ajax.org/platform/",
    #endif */

    /**
     * Boolean specifying whether apf is ready for dom operations.
     * @type {Boolean}
     */
    READY          : false,

    //AML nodeFunc constants
    /**
     * Constant for a hidden aml element.
     * @type {Number}
     */
    NODE_HIDDEN    : 101,
    /**
     * Constant for a visible aml element.
     * @type {Number}
     */
    NODE_VISIBLE   : 102,
    /**
     * Constant for an o3 widget.
     * @type {Number}
     */
    NODE_O3 : 103,

    /**
     * Constant for specifying that a widget is using only the keyboard to receive focus.
     * @type {Number}
     * @see baseclass.guielement.method.focus
     */
    KEYBOARD       : 2,
    /**
     * Constant for specifying that a widget is using the keyboard or the mouse to receive focus.
     * @type {Boolean}
     * @see baseclass.guielement.method.focus
     */
    KEYBOARD_MOUSE : true,

    /**
     * Constant for specifying success.
     * @type {Number}
     * @see element.teleport
     */
    SUCCESS : 1,
    /**
     * Constant for specifying a timeout.
     * @type {Number}
     * @see element.teleport
     */
    TIMEOUT : 2,
    /**
     * Constant for specifying an error.
     * @type {Number}
     * @see element.teleport
     */
    ERROR   : 3,
    /**
     * Constant for specifying the application is offline.
     * @type {Number}
     * @see element.teleport
     */
    OFFLINE : 4,

    //#ifdef __DEBUG
    debug         : true,
    debugType     : "Memory",
    debugFilter   : "!teleport",
    /* #else
    debug         : false,
    #endif */

    includeStack  : [],
    initialized   : false,
    AppModules    : [],
    
    /**
     * Boolean specifying whether apf tries to load a skin from skins.xml when no skin element is specified.
     * @type {Boolean}
     */
    autoLoadSkin  : false,
    /**
     * Boolean specifying whether apf has started loading scripts and started the init process.
     * @type {Boolean}
     */
    started       : false,
    /**
     * Namespace for all crypto libraries included with Ajax.org Platform.
     */
    crypto        : {}, //namespace
    config        : {},
    _GET          : {},
    $asyncObjects : {"apf.oHttp" : 1},
    
    /**
     * String specifying the basepath for loading apf from seperate files.
     * @type {String}
     */
    /*#ifdef __PACKAGED
    basePath      : "./",
    #endif*/

    //#ifdef __PARSER_AML
    /**
     * {Object} contains several known and often used namespace URI's.
     * @private
     */
    ns : {
        apf    : "http://ajax.org/2005/aml",
        aml    : "http://ajax.org/2005/aml",
        xsd    : "http://www.w3.org/2001/XMLSchema",
        xhtml  : "http://www.w3.org/1999/xhtml",
        xslt   : "http://www.w3.org/1999/XSL/Transform",
        xforms : "http://www.w3.org/2002/xforms",
        ev     : "http://www.w3.org/2001/xml-events"
    },
    //#endif
    
    availHTTP  : [],
    /**
     * @private
     */
    releaseHTTP: function(http){
        if (apf.brokenHttpAbort) 
            return;
        if (self.XMLHttpRequestUnSafe && http.constructor == XMLHttpRequestUnSafe) 
            return;
        
        http.onreadystatechange = function(){};
        http.abort();
        this.availHTTP.push(http);
    },

    /**
     * @private
     */
    browserDetect : function(){
        if (this.$bdetect)
            return;
        this.$bdetect = true;

        var sAgent = navigator.userAgent.toLowerCase() || "";

        // Browser Detection, using feature inference methods where possible:
        // http://www.thespanner.co.uk/2009/01/29/detecting-browsers-javascript-hacks/
        // http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
        
        /**
         * Specifies whether the application is running in the Opera browser.
         * @type {Boolean}
         */
        this.isOpera      = (self.opera && Object.prototype.toString.call(self.opera) == "[object Opera]");
        
        /**
         * Specifies whether the application is running in the Konqueror browser.
         * @type {Boolean}
         */
        this.isKonqueror  = sAgent.indexOf("konqueror") != -1;
        
        /**
         * Specifies whether the application is running in the Safari browser.
         * @type {Boolean}
         */
        this.isSafari     = /a/.__proto__ == "//";
        
        /**
         * Specifies whether the application is running in the Safari browser version 2.4 or below.
         * @type {Boolean}
         */
        this.isSafariOld  = false;

        /**
         * Specifies whether the application is running on the Iphone.
         * @type {Boolean}
         */
        this.isIphone     = sAgent.indexOf("iphone") != -1 || sAgent.indexOf("aspen simulator") != -1;

        /**
         * Specifies whether the application is running in the Chrome browser.
         * @type {Boolean}
         */
        this.isChrome     = Boolean(/source/.test((/a/.toString + ""))) || sAgent.indexOf("chrome") != -1;
        
        /**
         * Specifies whether the application is running in a Webkit-based browser
         * @type {Boolean}
         */
        this.isWebkit     = this.isSafari || this.isChrome || this.isKonquerer;

        if (this.isWebkit) {
            var matches   = sAgent.match(/applewebkit\/(\d+)/);
            if (matches) {
                this.webkitRev   = parseInt(matches[1])
                this.isSafariOld = parseInt(matches[1]) < 420;
            }
        }

        /**
         * Specifies whether the application is running in a Gecko based browser.
         * @type {Boolean}
         */
        this.isGecko      = (function(o) { o[o] = o + ""; return o[o] != o + ""; })(new String("__count__"));

        /**
         * Specifies whether the application is running in the Firefox browser version 3.
         * @type {Boolean}
         */
        this.isGecko3     = this.isGecko && (function x(){})[-5] == "x";
        this.isGecko35    = this.isGecko && (/a/[-1] && Object.getPrototypeOf) ? true : false;
        this.versionGecko = this.isGecko ? parseFloat(sAgent.match(/(?:firefox|gecko)\/([\d\.]+)/i)[1]) : -1;
        
        var found;
        /**
         * Specifies whether the application is running in the Internet Explorer browser, any version.
         * @type {Boolean}
         */
        this.isIE         = ! + "\v1";
        if (this.isIE)
            this.isIE = parseFloat(sAgent.match(/msie ([\d\.]*)/)[1]);
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 8.
         * @type {Boolean}
         */
        this.isIE8        = this.isIE == 8 && (found = true);
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 7.
         * @type {Boolean}
         */
        this.isIE7        = !found && this.isIE == 7 && (found = true);
        
        //Mode detection
        if (this.isIE == 8 && document.documentMode == 7) {
            apf.isIE7        = true;
            apf.isIE8        = false;
            apf.isIE7Emulate = true;
            apf.isIE         = 7;
        }
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 6.
         * @type {Boolean}
         */
        this.isIE6       = !found && this.isIE == 6 && (found = true);

        var os           = (navigator.platform.match(/mac|win|linux/i) || ["other"])[0].toLowerCase();
        /**
         * Specifies whether the application is running on the Windows operating system.
         * @type {Boolean}
         */
        this.isWin       = (os == "win");
        /**
         * Specifies whether the application is running in the OSX operating system..
         * @type {Boolean}
         */
        this.isMac       = (os == "mac");
        /**
         * Specifies whether the application is running in the OSX operating system..
         * @type {Boolean}
         */
        this.isLinux     = (os == "linux");

        /**
         * Specifies whether the application is running in the AIR runtime.
         * @type {Boolean}
         */
        this.isAIR       = sAgent.indexOf("adobeair") != -1;

        /*#ifdef __SUPPORT_GWT
        this.isGWT       = true;
        #endif*/

        //#ifdef __DESKRUN
        try {
            //this.isDeskrun = window.external.shell.runtime == 2;
        }
        catch(e) {
            /**
             * Specifies whether the application is running in the Deskrun runtime.
             * @type {Boolean}
             */
            this.isDeskrun = false;
        }
        //#endif
    },

    /**
     * @private
     */
    setCompatFlags : function(){
        //Set Compatibility
        this.TAGNAME                   = apf.isIE ? "baseName" : "localName";
        this.styleSheetRules           = apf.isIE ? "rules" : "cssRules";
        this.brokenHttpAbort           = apf.isIE6;
        this.canUseHtmlAsXml           = apf.isIE;
        this.supportNamespaces         = !apf.isIE;
        this.cannotSizeIframe          = apf.isIE;
        this.hasConditionCompilation   = apf.isIE;
        this.supportOverflowComponent  = apf.isIE;
        this.hasEventSrcElement        = apf.isIE;
        this.canHaveHtmlOverSelects    = !apf.isIE6 && !apf.isIE5;
        this.hasInnerText              = apf.isIE;
        this.hasMsRangeObject          = apf.isIE;
        this.descPropJs                = apf.isIE;
        this.hasClickFastBug           = apf.isIE;
        this.hasExecScript             = window.execScript ? true : false;
        this.canDisableKeyCodes        = apf.isIE;
        this.hasTextNodeWhiteSpaceBug  = apf.isIE || apf.isIE >= 8;
        this.hasCssUpdateScrollbarBug  = apf.isIE;
        this.canUseInnerHtmlWithTables = !apf.isIE;
        this.hasSingleResizeEvent      = !apf.isIE;
        this.hasStyleFilters           = apf.isIE;
        this.supportOpacity            = !apf.isIE;
        this.supportPng24              = !apf.isIE6 && !apf.isIE5;
        this.cantParseXmlDefinition    = apf.isIE50;
        this.hasDynamicItemList        = !apf.isIE || apf.isIE >= 7;
        this.canImportNode             = apf.isIE;
        this.hasSingleRszEvent         = !apf.isIE;
        this.hasXPathHtmlSupport       = !apf.isIE;
        this.hasFocusBug               = apf.isIE;
        this.hasReadyStateBug          = apf.isIE50;
        this.dateSeparator             = apf.isIE ? "-" : "/";
        this.canCreateStyleNode        = !apf.isIE;
        this.supportFixedPosition      = !apf.isIE || apf.isIE >= 7;
        this.hasHtmlIdsInJs            = apf.isIE && apf.isIE < 8 || apf.isWebkit;
        this.needsCssPx                = !apf.isIE;
        this.hasCSSChildOfSelector     = !apf.isIE || apf.isIE >= 8;
        this.styleAttrIsObj            = apf.isIE < 8;
        this.hasAutocompleteXulBug     = apf.isGecko;
        this.loadsLocalFilesSync       = apf.isIE || apf.isGecko;
        this.mouseEventBuffer          = apf.isIE ? 20 : 6;
        this.hasComputedStyle          = typeof document.defaultView != "undefined"
                                           && typeof document.defaultView.getComputedStyle != "undefined";
        this.supportCSSAnim            = apf.isWebkit && (apf.webkitRev > 525);//apf.isIphone;
        this.w3cRange                  = Boolean(window["getSelection"]);
        this.locale                    = (apf.isIE
                                            ? navigator.userLanguage
                                            : navigator.language).toLowerCase();
        this.characterSet              = document.characterSet || document.defaultCharset || "utf-8";
        var t = document.createElement("div");
        this.hasContentEditable        = (typeof t.contentEditable == "string"
                                       || typeof t.contentEditable == "boolean");
        t = null;
        delete t;

        this.supportVML                = apf.isIE;
        this.supportSVG                = !apf.isIE;
        this.hasHtml5XDomain           = apf.versionGecko >= 3.5;
        this.supportCanvas             = !!document.createElement("canvas").getContext;
        this.supportCanvasText         = !!(this.supportCanvas
            && typeof document.createElement("canvas").getContext("2d").fillText == "function")

        this.hasVideo                  = !!document.createElement("video")["canPlayType"];
        this.hasAudio                  = !!document.createElement("audio")["canPlayType"];
        this.hasGeolocation            = !!navigator.geolocation;
        this.supportHashChange         = ("onhashchange" in self) && !apf.isIE7Emulate || apf.isIE8;
        
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an array
        //   containing properties that represent the 'supported' input types.
        t = document.createElement("input");
        var _self = this;
        (function(props) {
            for (var i in props) {
                t.setAttribute("type", i);
                _self["hasInput" + i.charAt(0).toUpperCase()
                    + i.substr(1).replace("-l", "L")] = !!(t.type !== "text");
            }
        })({"search":1, "tel":1, "url":1, "email":1, "datetime":1, "date":1,
            "month":1, "week":1, "time":1, "datetime-local":1, "number":1,
            "range":1, "color":1});
        t = null;
        delete t;

        //Other settings
        this.maxHttpRetries = apf.isOpera ? 0 : 3;

        //#ifdef __WITH_ANCHORING
        this.percentageMatch = new RegExp();
        this.percentageMatch.compile("([\\-\\d\\.]+)\\%", "g");
        //#endif
        
        this.reMatchXpath = new RegExp();
        this.reMatchXpath.compile("(^|\\|)(?!\\@|[\\w-]+::)", "g");

        //#ifdef __SUPPORT_GEARS
        apf.isGears      = !!apf.initGears() || 0;
        //#endif
    },

    //#ifdef __DEBUG
    /**
     * Restarts the application.
     */
    reboot : function(){
        apf.console.info("Restarting application...");

        location.href = location.href;
    },
    //#endif

    /**
     * Extends an object with one or more other objects by copying all their
     * properties.
     * @param {Object} dest the destination object.
     * @param {Object} src the object that is copies from.
     * @return {Object} the destination object.
     */
    extend : function(dest, src){
        var prop, i, x = !dest.notNull;
        if (arguments.length == 2) {
            for (prop in src) {
                if (x || src[prop])
                    dest[prop] = src[prop];
            }
            return dest;
        }

        for (i = 1; i < arguments.length; i++) {
            src = arguments[i];
            for (prop in src) {
                if (x || src[prop])
                    dest[prop] = src[prop];
            }
        }
        return dest;
    },
    
    $extend : function(dest, src){
        for (var prop in src) {
            dest[prop] = src[prop];
        }
        return dest;
    },
    
    // #ifdef __TP_HTTP
    /**
     * Sends and retrieves data from remote locations over http.
     * Example:
     * <code>
     *  var content = apf.ajax("http://www.ajax.org", {
     *      method   : "POST",
     *      data     : "<data />",
     *      async    : false,
     *      callback : function( data, state ) {
     *          if (state == apf.SUCCESS)
     *              alert("Success");
     *          else
     *              alert("Failure")
     *      }
     *  });
     *  alert(content);
     * </code>
     *
     * @param {String}   url       the url that is accessed.
     * @param {Object}   options   the options for the http request
     *   Properties:
     *   {Boolean} async          whether the request is sent asynchronously. Defaults to true.
     *   {mixed}   userdata       custom data that is available to the callback function.
     *   {String}  method         the request method (POST|GET|PUT|DELETE). Defaults to GET.
     *   {Boolean} nocache        whether browser caching is prevented.
     *   {String}  data           the data sent in the body of the message.
     *   {Boolean} useXML         whether the result should be interpreted as xml.
     *   {Boolean} autoroute      whether the request can fallback to a server proxy.
     *   {Boolean} caching        whether the request should use internal caching.
     *   {Boolean} ignoreOffline  whether to ignore offline catching.
     *   {Function} callback      the handler that gets called whenever the
     *                            request completes succesfully or with an error,
     *                            or when the request times out.
     */
    ajax : function(){
        return this.oHttp.get.apply(this.oHttp, arguments);
    },
    // #endif

    /**
     * Starts the application.
     * @private
     */
    start : function(){
        this.started = true;
        var sHref = location.href.split("#")[0].split("?")[0];

        //Set Variables
        this.host     = location.hostname && sHref.replace(/(\/\/[^\/]*)\/.*$/, "$1");
        this.hostPath = sHref.replace(/\/[^\/]*$/, "") + "/";

        //#ifdef __DEBUG
        apf.console.info("Starting Ajax.org Platform Application...");
        apf.console.warn("This is a debug build of Ajax.org Platform; be aware "
            + "that\nexecution speed of this build is <strong>several times</strong> "
            + "slower than a release build\nof Ajax.org Platform.");
        //#endif

        //mozilla root detection
        //try{ISROOT = !window.opener || !window.opener.apf}catch(e){ISROOT = true}

        //Browser Specific Stuff
        //this.browserDetect();
        this.setCompatFlags();

        //#ifdef __WITH_DEBUG_WIN
        apf.debugwin.init();
        //#endif

        //Load Browser Specific Code
        // #ifdef __SUPPORT_IE
        if (this.isIE) apf.runIE();
            //this.importClass(apf.runIE, true, self);
        // #endif
        // #ifdef __SUPPORT_WEBKIT
        if (apf.isWebkit) apf.runWebkit();
            //this.importClass(apf.runSafari, true, self);
        // #endif
        // #ifdef __SUPPORT_OPERA
        if (this.isOpera) apf.runOpera();
            //this.importClass(apf.runOpera, true, self);
        // #endif
        // #ifdef __SUPPORT_GECKO
        if (this.isGecko || !this.isIE && !apf.isWebkit && !this.isOpera)
            apf.runGecko();
            //this.importClass(apf.runGecko, true, self);
        // #endif

        //#ifdef __PARSE_GET_VARS
        for (var i, l2, a, m, n, o, v, p = location.href.split(/[?&]/), l = p.length, k = 1; k < l; k++) {
            if (m = p[k].match(/(.*?)(\..*?|\[.*?\])?=([^#]*)/)) {
                n = decodeURI(m[1]).toLowerCase(), o = this._GET;
                if (m[2]) {
                    for (a = decodeURI(m[2]).replace(/\[\s*\]/g, "[-1]").split(/[\.\[\]]/), i = 0, l2 = a.length; i < l2; i++) {
                        v = a[i],
                        o = o[n]
                            ? o[n]
                            : o[n] = (parseInt(v) == v)
                                ? []
                                : {},
                        n = v.replace(/^["\'](.*)["\']$/, "$1");
                    }
                }
                o[n != "-1" ? n : o.length] = unescape(decodeURI(m[3]));
            }
        }
        //#endif

        // #ifdef __TP_HTTP
        // Start HTTP object
        this.oHttp = new this.http();
        //#endif

        // #ifndef __SUPPORT_GWT
        // Load user defined includes
        this.Init.addConditional(this.parseAppMarkup, apf, ["body"]);
        //@todo, as an experiment I removed 'HTTP' and 'Teleport'
        // #endif

        //IE fix
        try {
            if (apf.isIE)
                document.execCommand("BackgroundImageCache", false, true);
        }
        catch(e) {}

        //#ifdef __WITH_WINDOW
        //apf.window.init();
        //#endif

        this.started = true;
        
        // #ifndef __SUPPORT_GWT
        // DOMReady already fired, so plz continue the loading and parsing
        if (this.load_done)
            this.execDeferred();
        // #endif

        //try{apf.root = !window.opener || !window.opener.apf;}
        //catch(e){apf.root = false}
        this.root = true;
        
        /* #ifdef __PACKAGED
        for (var i = 0; i < apf.$required.length; i++) {
            apf.include(apf.$required[i]);
        }
        apf.require = apf.include;
        #endif*/
        
        /*#ifdef __SUPPORT_GWT
        // Load user defined includes
        //this.parseAppMarkup();
        
        //GWT
        apf.initialize("<html xmlns:a='" + apf.ns.aml + "' xmlns='" + apf.ns.xhtml + "'><head /><body /></html>");
        #endif*/

    },

    nsqueue   : {},

    //#ifdef __PARSER_AML || __WITH_NS_SUPPORT
    /**
     * @private
     */
    findPrefix : function(xmlNode, xmlns){
        var docEl;
        if (xmlNode.nodeType == 9) {
            if (!xmlNode.documentElement)
                return false;
            if (xmlNode.documentElement.namespaceURI == xmlns)
                return xmlNode.prefix || xmlNode.scopeName;
            docEl = xmlNode.documentElement;
        }
        else {
            if (xmlNode.namespaceURI == xmlns)
                return xmlNode.prefix || xmlNode.scopeName;
            docEl = xmlNode.ownerDocument.documentElement;
            if (docEl && docEl.namespaceURI == xmlns)
                return xmlNode.prefix || xmlNode.scopeName;

            while (xmlNode.parentNode) {
                xmlNode = xmlNode.parentNode;
                if (xmlNode.namespaceURI == xmlns)
                    return xmlNode.prefix || xmlNode.scopeName;
            }
        }

        if (docEl) {
            for (var i = 0; i < docEl.attributes.length; i++) {
                if (docEl.attributes[i].nodeValue == xmlns)
                    return docEl.attributes[i][apf.TAGNAME]
            }
        }

        return false;
    },
    //#endif

    /**
     * @private
     */
    importClass : function(ref, strip, win){
        if (!ref)
            throw new Error(apf.formatErrorString(1018, null,
                "importing class",
                "Could not load reference. Reference is null"));

        if (!strip)
            return apf.exec(ref.toString(), win);

        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "")
                              .replace(/\}\s*$/, "");

        return apf.exec(q, win);
    },

    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    */
    toString : function(){
        return "[Ajax.org Platform (apf)]";
    },

    all : [],

    /**
    * This method implements all properties and methods to this object from another class
    * @param {Function}    classRef    Class reference
    * @private
    */
    implement : function(classRef) {
        // for speed, we check for the most common  case first
        if (arguments.length == 1) {
            //#ifdef __DEBUG
            if (!classRef) {
                throw new Error(apf.formatErrorString(0, this,
                    "Implementing class",
                    "Could not implement from '" + classRef[i] + "'", this));
            }
            //#endif
            classRef.call(this);//classRef
        }
        else {
            for (var a, i = 0, l = arguments.length; i < l; i++) {
                a = arguments[i];
                //#ifdef __DEBUG
                if (!a) {
                    throw new Error(apf.formatErrorString(0, this,
                        "Implementing class",
                        "Could not implement from '" + arguments[i] + "'", this));
                }
                //#endif
                arguments[i].call(this);//classRef
            }
        }

        return this;
    },

    /**
     * @private
     */
    uniqueHtmlIds : 0,

    /**
     * Adds a unique id attribute to an html element.
     * @param {HTMLElement} oHtml the object getting the attribute.
     */
    setUniqueHtmlId : function(oHtml){
        var id;
        oHtml.setAttribute("id", id = "q" + this.uniqueHtmlIds++);
        return id;
    },

    /**
     * Retrieves a new unique id
     */
    getUniqueId : function(){
        return this.uniqueHtmlIds++;
    },

    /**
     * Finds a aml element based on it's uniqueId
     */
    lookup : function(uniqueId){
        return this.all[uniqueId];
    },

    /**
     * Searches in the html tree from a certain point to find the
     * aml element that is responsible for rendering the specified html
     * element.
     * @param {HTMLElement} oHtml the html context to start the search from.
     */
    findHost : function(o){
        while (o && o.parentNode) { //!o.host && 
            try {
                if (o.host)
                    break;
            }
            catch(e){}
            
            o = o.parentNode;
        }
        return (o && o.host && typeof o.host != "string") ? o.host : false;
    },

    /**
     * Sets a reference to an object by name in the global javascript space.
     * @param {String} name the name of the reference.
     * @param {mixed}  o    the reference to the object subject to the reference.
     */
    setReference : function(name, o){
        return self[name] && self[name].hasFeature
            ? 0
            : (self[name] = o);
    },

    /**
     * The console outputs to the debug screen and offers differents ways to do
     * this.
     */
    console : {
        //#ifdef __DEBUG
        /**
         * @private
         */
        data : {
            time  : {
                icon     : "time.png",
                color    : "black",
                messages : {}
            },

            info  : {
                icon     : "bullet_green.png",
                color    : "black",
                messages : {}
            },

            warn  : {
                icon     : "error.png",
                color    : "green",
                messages : {}
            },

            error : {
                icon     : "exclamation.png",
                color    : "red",
                messages : {}
            },
            
            repeat : {
                icon     : "bullet_green.png",
                color    : "#AAA",
                messages : {}
            }
        },

        /**
         * @private
         */
        toggle : function(node, id){
            var sPath = apf.debugwin ? apf.debugwin.resPath : apf.basePath + "core/debug/resources/";
            if (node.style.display == "block") {
                node.style.display = "none";
                node.parentNode.style.backgroundImage = "url(" + sPath + "splus.gif)";
                node.innerHTML = "";
            }
            else {
                node.style.display = "block";
                node.parentNode.style.backgroundImage = "url(" + sPath + "smin.gif)";
                node.innerHTML = this.cache[id]
                    .replace(/\&/g, "&amp;")
                    .replace(/\t/g,"&nbsp;&nbsp;&nbsp;")
                    .replace(/ /g,"&nbsp;")
                    .replace(/\</g, "&lt;")
                    .replace(/\n/g, "<br />");

                var p  = node.parentNode.parentNode.parentNode,
                    el = node.parentNode.parentNode;
                if(p.scrollTop + p.offsetHeight < el.offsetTop + el.offsetHeight)
                    p.scrollTop = el.offsetTop + el.offsetHeight - p.offsetHeight;
            }
        },

        cache : [],
        $lastmsg : "",
        $lastmsgcount : 0,

        $detectSameMessage : function(){
            apf.console.$lastmsg = "";
            if (apf.console.$lastmsgcount) {
                var msg = apf.console.$lastmsgcount + " times the same message";
                apf.console.$lastmsgcount = 0;
                apf.console.write(msg, "repeat");
                clearTimeout(apf.console.$timer);
            }
        },

        /**
         * @private
         * @event debug Fires when a message is sent to the console.
         *   object:
         *      {String} message the content of the message.
         */
        write : function(msg, type, subtype, data, forceWin, nodate){
            clearTimeout(this.$timer);
            if (msg == this.$lastmsg) {
                this.$lastmsgcount++;
                this.$timer = $setTimeout(this.$detectSameMessage, 1000);
                return;
            }

            this.$detectSameMessage();
            this.$lastmsg = msg;
            this.$timer = $setTimeout(this.$detectSameMessage, 1000);
            
            //if (!apf.debug) return;
            if (!Number.prototype.toPrettyDigit) {
                Number.prototype.toPrettyDigit = function() {
                    var n = this.toString();
                    return (n.length == 1) ? "0" + n : n;
                }
            }

            var dt   = new Date(),
                ms   = String(dt.getMilliseconds());
            while (ms.length < 3)
                ms += "0";
            var date = dt.getHours().toPrettyDigit()   + ":"
                     + dt.getMinutes().toPrettyDigit() + ":"
                     + dt.getSeconds().toPrettyDigit() + "." + ms;

            msg = (!nodate ? "[" + date + "] " : "")
                    + String(msg)
                        .replace(/ /g, "&nbsp;")
                        .replace(/\n/g, "\n<br />")
                        .replace(/\t/g,"&nbsp;&nbsp;&nbsp;");
            var sPath = apf.debugwin
                ? (apf.debugwin.resPath || "{imgpath}")
                : apf.basePath + "core/debug/resources/";

            if (data) {
                msg += "<blockquote style='margin:2px 0 0 0;"
                    +  "background:url(" + sPath + "splus.gif) no-repeat 2px 3px'>"
                    +  "<strong style='width:120px;cursor:default;display:block;padding:0 0 0 17px' "
                    +  "onmousedown='(self.apf || window.opener.apf).console.toggle(this.nextSibling, "
                    +  (this.cache.push(data) - 1) + ")'>More information"
                    +  "</strong><div style='display:none;background-color:#EEEEEE;"
                    +  "padding:3px 3px 20px 3px;overflow:auto;max-height:200px'>"
                    +  "</div></blockquote>";
            }

            msg = "<div style='min-height:15px;padding:2px 2px 2px 22px;"
                + "line-height:15px;border-bottom:1px solid #EEE;background:url("
                + sPath + this.data[type].icon + ") no-repeat 2px 2px;color:"
                + this.data[type].color + "'>" + msg + "\n<br style='line-height:0'/></div>";

            if (!subtype)
                subtype = "default";

            if (!this.data[type].messages[subtype])
                this.data[type].messages[subtype] = [];

            this.data[type].messages[subtype].push(msg);

            if (this.win && !this.win.closed)
                this.showWindow(msg);

            //if (apf.debugFilter.match(new RegExp("!" + subtype + "(\||$)", "i")))
            //    return;

            this.debugInfo.push(msg);

            if (apf.dispatchEvent)
                apf.dispatchEvent("debug", {message: msg});
        },
        //#endif

        /**
         * Writes a message to the console.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        debug : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "time", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the time icon next to it.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        time : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "time", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        log : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.info(msg, subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "info" icon and color
         * coding.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        info : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "info", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "warning" icon and
         * color coding.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        warn : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "warn", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "error" icon and
         * color coding.
         * @param {String} msg      the message to display in the console.
         * @param {String} subtype  the category for this message. This is used for filtering the messages.
         * @param {String} data     extra data that might help in debugging.
         */
        error : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "error", subtype, data);
            //#endif
        },

        /**
         * Prints a listing of all properties of the object.
         * @param {mixed} obj the object for which the properties are displayed.
         */
        dir : function(obj){
            this.info(apf.vardump(obj, null, false).replace(/ /g, "&nbsp;").replace(/</g, "&lt;"));
        }

        //#ifdef __DEBUG
        ,
        debugInfo : [],
        debugType : "",

        /**
         * Shows a browser window with the contents of the console.
         * @param {String} msg a new message to add to the new window.
         */
        showWindow : function(msg){
            if (!this.win || this.win.closed) {
                this.win = window.open("", "debug");
                this.win.document.write(
                    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
                  + '<body style="margin:0;font-family:Verdana;font-size:8pt;"></body>');
            }
            if (!this.win) {
                if (!this.haspopupkiller)
                    alert("Could not open debug window, please check your popupkiller");
                this.haspopupkiller = true;
            }
            else {
                this.win.document.write((msg || this.debugInfo.join(""))
                    .replace(/\{imgpath\}/g, apf.debugwin
                        ? apf.debugwin.resPath
                        : apf.basePath + "core/debug/resources/"));
            }
        }

        //#endif
    },

    /**
     * Formats a Ajax.org Platform error message.
     * @param {Number}      number      the number of the error. This can be used to look up more information about the error.
     * @param {AMLElement}  control     the aml element that will throw the error.
     * @param {String}      process     the action that was being executed.
     * @param {String}      message     the actual error message.
     * @param {XMLElement}  amlContext  the xml relevant to the error. For instance a piece of Ajax.org Markup Language xml.
     */
    formatErrorString : function(number, control, process, message, amlContext, outputname, output){
        //#ifdef __DEBUG
        var str = ["---- APF Error ----"];
        if (amlContext) {
            if (amlContext.nodeType == 9)
                amlContext = amlContext.documentElement;

            //Determine file context
            if (amlContext.ownerDocument.documentElement) {
                var file = amlContext.ownerDocument.documentElement.getAttribute("filename");
                if (!file && amlContext.ownerDocument.documentElement.tagName == "html")
                    file = location.href;
                file = file
                    ? apf.removePathContext(apf.hostPath, file)
                    : "Unkown filename";
            }
            else file = "Unknown filename";

            //Get serialized version of context
            var amlStr = (amlContext.outerHTML || amlContext.xml || amlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/ajax.org\/2005\/aml" \/\>/g, "")
                .replace(/xmlns:a="[^"]*"\s*/g, "");

            //Determine line number
            var diff, linenr = 0, w = amlContext.previousSibling
                || amlContext.parentNode && amlContext.parentNode.previousSibling;
            while (w && w[apf.TAGNAME] != "body") {
                diff    = (w.outerHTML || w.xml || w.serialize()).split("\n").length;
                linenr += diff - 1;
                w       = w.previousSibling || w.parentNode && w.parentNode.previousSibling;
            }
            if (w && w[apf.TAGNAME] != "body")
                linenr = "unknown";
            else if(amlContext.ownerDocument 
              && amlContext.ownerDocument.documentElement.tagName == "html")
                linenr += apf.lineBodyStart;

            //Grmbl line numbers are wrong when \n's in attribute space

            //Set file and line number
            str.push("aml file: [line: " + linenr + "] " + file);
        }
        if (control)
            str.push("Control: '"
                + (control.name
                    || (control.$aml ? control.getAttribute("id") : null)
                    || "{Anonymous}")
                + "' [" + control.tagName + "]");
        if (process)
            str.push("Process: " + process.replace(/ +/g, " "));
        if (message)
            str.push("Message: [" + number + "] " + message.replace(/ +/g, " "));
        if (outputname)
            str.push(outputname + ": " + output);
        if (amlContext)
            str.push("\n===\n" + amlStr);
        
        return (apf.lastErrorMessage = str.join("\n"));
        /*#else
        apf.lastErrorMessage = message;
        return message;
        #endif */
    },

    /* Init */

    /**
     * Returns the directory portion of a url
     * @param {String} url the url to retrieve from.
     * @return {String} the directory portion of a url.
     */
    getDirname : function(url){
        return ((url || "").match(/^([^#]*\/)[^\/]*(?:$|\#)/) || {})[1]; //Mike will check out how to optimize this line
    },
    
    /**
     * Returns the file portion of a url
     * @param {String} url the url to retrieve from.
     * @return {String} the file portion of a url.
     */
    getFilename : function(url){
        return ((url || "").split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
    },
    
    /**
     * Returns an absolute url based on url.
     * @param {String} base the start of the url to which relative url's work.
     * @param {String} url  the url to transform.
     * @return {String} the absolute url.
     */
    getAbsolutePath : function(base, url){
        return !url || !base || url.match(/^\w+\:\/\//) ? url : base.replace(/\/$/, "") + "/" + url;
    },

    /**
     * Loads javascript from a url.
     * 
     * @param {String}  sourceFile the url where the javascript is located.
     * @param {Boolean} [doBase]   check for basePath, otherwise prepend it
     * @param {String}  [type]     set the type of a script tag, for later use
     * @type  {void}
     */
    include : function(sourceFile, doBase, type){
        apf.console.info("including js file: " + sourceFile);

        var sSrc = doBase ? apf.getAbsolutePath(apf.basePath || "", sourceFile) : sourceFile;
        if (apf.isSafariOld && !apf.started) {
            document.write('<script type="text/javascript" src="' + sSrc + '"><\/script>');
        }
        else {
            var head     = document.getElementsByTagName("head")[0],//$("head")[0]
                elScript = document.createElement("script");
            //elScript.defer = true;
            if (type)
                elScript.setAttribute("_apf_type", type);
            elScript.src   = sSrc;
            head.appendChild(elScript);
        }
    },
    
    $required : [],
    require : function(){
        var dir = apf.getDirname(location.href),
            i   = 0,
            l   = arguments.length;
        for (; i < l; i++)
            this.$required.push(apf.getAbsolutePath(dir, arguments[i]));
    },

    /**
     * @private
     */
    Init : {
        queue : [],
        cond  : {
            combined : []
        },
        done  : {},

        add   : function(func, o){
            if (this.inited)
                func.call(o);
            else if (func)
                this.queue.push([func, o]);
        },

        addConditional : function(func, o, strObj){
            if (typeof strObj != "string") {
                if (this.checkCombined(strObj))
                    return func.call(o);
                this.cond.combined.push([func, o, strObj]);
            }
            else if (self[strObj]) {
                func.call(o);
            }
            else {
                if (!this.cond[strObj])
                    this.cond[strObj] = [];
                this.cond[strObj].push([func, o]);

                this.checkAllCombined();
            }
        },

        checkAllCombined : function(){
            for (var i = 0; i < this.cond.combined.length; i++) {
                if (!this.cond.combined[i]) continue;

                if (this.checkCombined(this.cond.combined[i][2])) {
                    this.cond.combined[i][0].call(this.cond.combined[i][1])
                    this.cond.combined[i] = null;
                }
            }
        },

        checkCombined : function(arr){
            for (var i = 0; i < arr.length; i++) {
                if (!this.done[arr[i]])
                    return false;
            }

            return true;
        },

        run : function(strObj){
            this.inited = this.done[strObj] = true;

            this.checkAllCombined();

            var data = strObj ? this.cond[strObj] : this.queue;
            if (!data) return;
            for (var i = 0; i < data.length; i++)
                data[i][0].call(data[i][1]);
        }
    },

    //#ifdef __PARSER_AML
    //#endif
    //#ifdef __WITH_PARTIAL_AML_LOADING
    /**
     * @private
     */
    amlParts : [],
    //#endif

    /**
     * Determines the way apf tries to render this application. Set this value
     * before apf is starts parsing.
     *   Possible values:
     *   0    auto
     *   1    partial
     *   11   partial from a comment
     *   2    full from serialized document or file fallback
     *   21   full from file
     * @type {Number}
     */
    parseStrategy : 0,

    //#ifdef __WITH_PARTIAL_AML_LOADING
    /**
     * @private
     */
    parsePartialAml : function(docElement){
        //#ifdef __DEBUG
        apf.console.warn("The aml namespace definition wasn't found "
                       + "on the root node of this document. We're assuming "
                       + "you want to load a partial piece of aml embedded "
                       + "in this document. Starting to search for it now.");
        //#endif

        var findAml;
        if (apf.isIE) {
            findAml = function(htmlNode){
                //#ifdef __DEBUG
                if (htmlNode.outerHTML.match(/\/>$/)) {
                    throw new Error("Cannot have self closing elements!\n"
                        + htmlNode.outerHTML);
                }
                //#endif
                
                try {
                    var tags   = {"IMG":1,"LINK":1,"META":1,"INPUT":1,"BR":1,"HR":1,"AREA":1,"BASEFONT":1},
                        regex  = new RegExp(htmlNode.outerHTML.replace(/([\(\)\|\\\.\^\$\{\}\[\]])/g, "\\$1")
                               + ".*" + htmlNode.tagName),
                        match  = htmlNode.parentNode.outerHTML.replace(/\n/g, "").match(regex),
                        strXml = match[0] + ">"
                            .replace(/(\w+)\s*=\s*([^\>="'\s ]+)( |\s|\>|\/\>)/g, "$1=\"$2\"$3")
                            .replace(/ disabled /g, " disabled='true' ")
                            .replace(/\]\]\&gt;/g, "]]>")
                            .replace(/<(\w+)(\s[^>]*[^\/])?>/g, function(m, tag, c){
                                if (tags[tag]) {
                                    return "<" + tag + (c||"") + "/>";
                                }
                                else {
                                    return m;
                                }
                            });
                } 
                catch(e) {
                    //#ifdef __DEBUG
                    throw new Error(apf.formatErrorString(0, null,
                        "Parsing inline aml (without xmlns on root node)",
                        "Could not parse inline aml. This happens when the html"
                      + "is mangled too much by Internet Explorer. Either you "
                      + "are using a cdata section or javascript containing "
                      + "symbols that throw off the browser. Please put this aml "
                      + "in a seperate file and load it using an include element."));
                    //#endif
                    
                    return;
                }

                var xmlNode = apf.getAmlDocFromString("<div jid='"
                            + (id++) + "' " + strXmlns + ">"
                            + strXml + "</div>").documentElement;

                while (xmlNode.childNodes.length > 1)
                    xmlNode.removeChild(xmlNode.lastChild);

                apf.AppNode.appendChild(xmlNode);
            }
        }
        else {
            findAml = function(htmlNode){
                var strXml  = htmlNode.outerHTML.replace(/ _moz-userdefined=""/g, ""),
                    xmlNode = apf.getAmlDocFromString("<div jid='"
                            + (id++) + "' " + strXmlns + ">"
                            + strXml + "</div>").documentElement;

                while (xmlNode.childNodes.length > 1)
                    xmlNode.removeChild(xmlNode.lastChild);

                if (apf.isWebkit)
                    xmlNode = apf.AppNode.ownerDocument.importNode(xmlNode, true);

                apf.AppNode.appendChild(xmlNode);
            }
        }

        var match = document.body.outerHTML
                    .match(/(\w+)\s*=\s*["']http:\/\/ajax\.org\/2005\/aml["']/);
        if (!match)
            return false;

        var strXmlns = "xmlns:" + match[0],
            prefix = (RegExp.$1 || "").toUpperCase();
        if (apf.isOpera)
            prefix = prefix.toLowerCase();
        if (!prefix)
            return false;

        prefix += ":";

        apf.AppNode = apf.getAmlDocFromString("<" + prefix.toLowerCase()
            + "application " + strXmlns + " />").documentElement;

        var temp, loop, cnode,
            isPrefix = false,
            id       = 0,
            node     = document.body;
        while (node) {
            isPrefix = node.nodeType == 1
                && node.tagName.substr(0,2) == prefix;

            if (isPrefix) {
                findAml(cnode = node);

                if (apf.isIE) {
                    loop = node;
                    var count = 1, next = loop.nextSibling;
                    if (next) {
                        loop.parentNode.removeChild(loop);

                        while (next && (next.nodeType != 1 || next.tagName.indexOf(prefix) > -1)){
                            if (next.nodeType == 1)
                                count += next.tagName.charAt(0) == "/" ? -1 : 1;

                            if (count == 0) {
                                if (temp)
                                    temp.parentNode.removeChild(temp);
                                temp = next;
                                break;
                            }

                            next = (loop = next).nextSibling;
                            if (!next) {
                                next = loop;
                                break;
                            }
                            if (loop.nodeType == 1) {
                                loop.parentNode.removeChild(loop);
                                if (temp) {
                                    temp.parentNode.removeChild(temp);
                                    temp = null;
                                }
                            }
                            else {
                                if (temp)
                                    temp.parentNode.removeChild(temp);

                                temp = loop;
                            }
                        }

                        node = next; //@todo item should be deleted
                        //check here for one too far
                    }
                    else {
                        if (temp)
                            temp.parentNode.removeChild(temp);
                        temp = loop;
                    }
                }
                else {
                    if (temp)
                        temp.parentNode.removeChild(temp);

                    temp = node;
                    //node = node.nextSibling;
                }

                if (apf.amlParts.length
                  && apf.amlParts[apf.amlParts.length-1][1] == cnode)
                    apf.amlParts[apf.amlParts.length-1][1] = -1;

                apf.amlParts.push([node.parentNode, apf.isIE
                    ? node.nextSibling : node.nextSibling]);
            }
            else if (node.tagName == "SCRIPT" && node.getAttribute("src")
              && (node.getAttribute("src").indexOf("ajax.org") > -1)) {
                var strXml = node.outerHTML
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&amp;/g, "&")
                    .replace(/<SCRIPT[^>]*\>\s*<\!\[CDATA\[>?/i, "")
                    .replace(/<SCRIPT[^>]*\>(?:<\!\-\-)?/i, "")
                    .replace(/(\/\/)?\s*\&\#8211;>\s*<\/SCRIPT>/i, "")
                    .replace(/\-\->\s*<\/SCRIPT>/i, "")
                    .replace(/\]\](?:\&gt\;|>)\s*<\/SCRIPT>/i, "")
                    .replace(/<\/SCRIPT>$/mi, "")
                    .replace(/<\/?\s*(?:p|br)\s*\/?>/ig, "")
                    .replace(/<\!--\s*.*?\s*-->\s*<script.*/ig, "")
                    .replace(/\\+(['"])/g, "$1");

                if (strXml.trim()) {
                    var xmlNode = apf.getAmlDocFromString("<div jid='"
                        + (id++) + "' " + strXmlns + ">"
                        + strXml + "</div>").documentElement;

                    if (apf.isWebkit)
                        xmlNode = apf.AppNode.ownerDocument.importNode(xmlNode, true);

                    apf.AppNode.appendChild(xmlNode);

                    apf.amlParts.push([node.parentNode, node.nextSibling]);
                }
            }

            //Walk entire html tree
            if (!isPrefix && node.firstChild
              || node.nextSibling) {
                if (!isPrefix && node.firstChild) {
                    node = node.firstChild;
                }
                else {
                    node = node.nextSibling;
                }
            }
            else {
                do {
                    node = node.parentNode;

                    if (node.tagName == "BODY")
                        node = null;

                } while (node && !node.nextSibling)

                if (node) {
                    node = node.nextSibling;
                }
            }
        }

        if (temp)
            temp.parentNode.removeChild(temp);
    },
    //#endif

    /**
     * @private
     */
    parseAppMarkup : function(docElement){
        var isEmptyDocument = false;
        
        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (this.parseStrategy == 1 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(apf.ns.aml) == -1) {
            this.parsePartialAml(docElement);

            if (this.parseStrategy == 1 || apf.amlParts.length) {
                //#ifdef __DEBUG
                if (apf.amlParts.length)
                    apf.console.warn("Aml found, parsing...");
                //#endif

                apf.isParsingPartial = true;

                apf.loadAmlIncludes(apf.AppNode);

                if (!self.ERROR_HAS_OCCURRED) {
                    apf.initialize();
                }

                return;
            }
            else {
                //#ifdef __DEBUG
                apf.console.warn("No aml found.");
                //#endif
                isEmptyDocument = true;
            }
        }
        //#endif

        //#ifdef __WITH_PARTIAL_AML_LOADING_FROM_COMMENT
        //@todo this strategy needs some updating
        if (this.parseStrategy == 11 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(apf.ns.aml) == -1) {
            //#ifdef __DEBUG
            apf.console.warn("The aml namespace definition wasn't found "
                           + "on the root node of this document. We're assuming "
                           + "you want to load a partial piece of aml embedded "
                           + "in this document. Starting to search for it now.");
            //#endif

            //Walk tree
            var str, x, node = document.body;
            while (node) {
                if (node.nodeType == 8) {
                    str = node.nodeValue;
                    if  (str.indexOf("[apf]") == 0) {
                        str = str.substr(5);

                        //#ifdef __DEBUG
                        apf.console.info("Found a piece of aml. Assuming "
                                       + "namespace prefix 'a'. Starting "
                                       + "parsing now.");
                        //#endif

                        x = apf.getXml("<a:applicaton xmlns:j='"
                            + apf.ns.aml + "'>" + str + "</a:applicaton>", true);

                        if (apf.isIE) { //@todo generalize this
                            x.ownerDocument.setProperty("SelectionNamespaces",
                                "xmlns:a='" + apf.ns.aml + "'");
                        }

                        apf.loadAmlIncludes(x);
                        apf.amlParts.push([x, node]);
                    }
                }

                //Walk entire html tree
                if (node.firstChild || node.nextSibling) {
                    node = node.firstChild || node.nextSibling;
                }
                else {
                    do {
                        node = node.parentNode;
                    } while (node && !node.nextSibling)

                    if (node)
                        node = node.nextSibling;
                }
            }

            if (!self.ERROR_HAS_OCCURRED
              && (apf.amlParts.length || this.parseStrategy == 11)) {
                apf.isParsingPartial = true;

                apf.initialize();

                return;
            }
            
            isEmptyDocument = true;
        }
        //#endif

        //#ifdef __WITH_PARSE_AML_FROM_HTML
        //Load aml without reloading the page, but also fully parse javascript
        //This requires there to be no self closing elements
        if (this.parseStrategy == 2) { //!this.parseStrategy
            var xmlStr;
            if (apf.isIE) {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<SCRIPT.*SCRIPT>(?:[\r\n]+)?/g, "")
                    .replace(/^<HTM./, "<a:application")//xmlns:a='" + apf.ns.aml + "'
                    .replace(/HTML>$/, "a:application>")
                    .replace(/(\w+)\s*=\s*([^"'\s]+)\s/g, "$1=\"$2\" ");
            }
            else {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<script.*\/>/g, "") //@todo for debug only
                    .replace(/ _moz-userdefined=""/g, "")
                    .replace(/^<HTM./, "<a:application xmlns='" + apf.ns.xhtml + "'")
                    .replace(/HTML>$/, "a:application>")
            }

            try {
                docElement = apf.getAmlDocFromString(xmlStr);

                //Clear Body
                var nodes = document.body.childNodes;
                for (var i = nodes.length - 1; i >= 0; i--)
                    nodes[i].parentNode.removeChild(nodes[i]);
            }
            catch(e) {
                //Parsing went wrong, if we're on auto strategy we'll try loading from file
                if (this.parseStrategy)
                    throw e; //Else we'll throw an error
            }
            //Maybe for IE8??
            //else if (apf.isIE)
            //    apf.TAGNAME = "tagName";
            
            isEmptyDocument = true;
        }
        //#endif

        //#ifdef  __WITH_PARSE_DOC_BY_RELOADING
        if (isEmptyDocument && document.documentElement.outerHTML
          .split(">", 1)[0]
          .indexOf(apf.ns.aml) == -1) {
            //#ifdef __DEBUG
            apf.console.warn("The aml namespace declaration wasn't found. "
                           + "No aml elements were found in the body. Exiting");
            //#endif
            return false;
        }

        //Load current HTML document as 'second DOM'
        if (this.parseStrategy == 21 || !this.parseStrategy && !docElement) {
            return apf.oHttp.get((apf.alternativeAml 
              || document.body && document.body.getAttribute("xmlurl") 
              || location.href).split(/#/)[0], {
                callback: function(xmlString, state, extra){
                    if (state != apf.SUCCESS) {
                        var oError = new Error(apf.formatErrorString(0, null,
                            "Loading XML application data", "Could not load "
                          + "XML from remote source: " + extra.message));

                        if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                            return true;

                        throw oError;
                    }

                    //#ifdef __DEBUG
                    apf.lineBodyStart = (xmlString.replace(/\n/g, "\\n")
                        .match(/(.*)<body/) || [""])[0].split("\\n").length;
                    //#endif

                    //@todo apf3.0 rewrite this flow
                    var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "")
                      .replace(/&nbsp;/g, " ").replace(/^[\r\n\s]*/, "");
                    if (!apf.supportNamespaces)
                        str = str.replace(/xmlns\=\"[^"]*\"/g, "");
                    //var xmlNode = apf.getXmlDom(str);//apf.getAmlDocFromString(xmlString);

                    if (self.ERROR_HAS_OCCURRED)
                        return;

                    //Clear Body
                    if (apf.isIE)
                        document.body.innerHTML ="";
                    else {
                        var nodes = document.body.childNodes;
                        for (var i = nodes.length - 1; i >= 0; i--)
                            nodes[i].parentNode.removeChild(nodes[i]);
                    }

                    // #ifndef __SUPPORT_GWT
                    document.body.style.display = "block"; //might wanna make this variable based on layout loading...
                    // #endif

                    apf.initialize(str);

                }, ignoreOffline: true});
        }
        else {
            // #ifndef __SUPPORT_GWT
            //might wanna make this variable based on layout loading...
            document.body.style.display = "block";
            // #endif

            if (!self.ERROR_HAS_OCCURRED)
                apf.initialize(docElement.outerHTML || docElement.xml);
        }
        //#endif
    },
    
    namespaces : {},
    setNamespace : function(namespaceURI, oNamespace){
        this.namespaces[namespaceURI] = oNamespace;
        oNamespace.namespaceURI = namespaceURI;
    },

    /**
     * @private
     */
    initialize : function(xmlStr){
        // #ifdef __DESKRUN
        if (apf.initialized) return;
        apf.initialized = true;
        // #endif

        /*#ifdef __SUPPORT_GWT
        document.body.style.display = "block"; //might wanna make this variable based on layout loading...
        #endif*/

        apf.console.info("Initializing...");
        clearInterval(apf.Init.interval);

        // Run Init
        apf.Init.run(); //Process load dependencies
        
        //#ifdef __WITH_DEFAULT_SKIN
        apf.skins.defaultSkin = '<?xml version="1.0" encoding="utf-8"?>'
            + '<a:skin xmlns:a="http://ajax.org/2005/aml" xmlns="http://www.w3.org/1999/xhtml">'
            + '<a:checkbox name="checkbox"><a:style><![CDATA[.cbcontainer{padding: 2px 2px 2px 18px;'
            + '_padding: 2px; /* IE6 fix */position: relative;min-height: 13px;'
            + 'color: #4b4b4b;background: url(images/spacer.gif);_clear: both; /* IE6 fix */}'
            + '.cbcontainer span{font-family: Tahoma;font-size: 11px;cursor: default;padding: 1px 3px 2px 3px;'
            + 'margin : -1px 0 0 0;overflow: hidden;display: block;float: left;line-height: 13px;}'
            + '.cbcontainerFocus span{padding: 0px 2px 1px 2px;border: 1px dotted #BBB;}'
            + '.cbcontainerChecked.cbcontainerDown.cbcontainerFocus .checkbox {background-position: 0 -48px;}'
            + '.cbcontainer .checkbox{width: 12px;height: 12px;overflow: hidden;position: absolute;'
            + 'left: 2px;top: 2px;_position: relative; /* IE6 fix */_float: left; /* IE6 fix */_margin: -2px 4px 0 0; /* IE6 fix */'
            + 'background: url("images/checkbox.png") no-repeat 0 -12px;}.cbcontainerDown .checkbox{background-position: 0 -36px;}'
            + '.cbcontainerChecked .checkbox{background-position: 0 -24px;}.cbcontainerError span{background-color : #ffb500;color: #fbfbfb;}'
            + '.cbcontainerDisabled .checkbox{background-position: 0 -0px;}.cbcontainerDisabled span{color: #bebebe;}'
            + '.cbcontainer br{display: none;}]]></a:style><a:style condition="!apf.isIE">'
            + '<![CDATA[.cbcontainer br{line-height: 0;display: block;}]]></a:style>'
            + '<a:presentation><a:main label="span/text()"><div class="cbcontainer"><div class="checkbox"> </div>'
            + '<span>-</span><br clear="left" /></div></a:main>'
            + '</a:presentation></a:checkbox>'
            + '<a:bar name="bar"><a:style><![CDATA[#jem.apf_bar {position: relative;color: #4b4b4b;font-family: Tahoma;'
            + 'font-size: 10px;padding: 10px;border: 1px solid #f3f3f3;cursor: default;margin: 0;'
            + 'background: white url(images/resizehandle.gif) no-repeat right bottom;z-index: 10000;}'
            + '#jem.apf_bar img {position: absolute;bottom: 13px;left: 216px;}#jem.apf_bar .apf_counter {'
            + 'position: absolute;bottom: 5px;left: 40px;}#jem.apf_bar .apf_countdown {position: absolute;'
            + 'bottom: 5px;right: 142px;}#jem.apf_bar .apf_volume {position: absolute;'
            + 'bottom: 5px;right: 119px;left: auto;background: none;width: 16px;height: 16px;'
            + 'margin: 0;padding: 0;cursor: pointer;cursor: hand;}#jem.apf_bar .apf_volume span {'
            + 'margin: 0;padding: 0;width: 16px;height: 16px;}#jem.apf_bar .apf_fullscreen {'
            + 'position: absolute;bottom: 2px;right: 28px;left: auto;width: 14px;background: transparent;'
            + 'cursor: pointer;cursor: hand;}#jem.apf_bar .apf_fullscreen span {height:14px;width:14px;'
            + 'margin:3px auto 0 0;}]]></a:style><a:presentation><a:main container="." resize-corner="17">'
            + '<div class="apf_bar" id="jem"> </div></a:main></a:presentation></a:bar>'
            + '<a:label name="label"><a:style><![CDATA[#jem .apf_label{font-size: 8pt;font-family: Tahoma;'
            + 'overflow: hidden;cursor: default;line-height : 1.5em;margin : 0;}#jem .apf_labelDisabled{'
            + 'color: #bebebe;}#jem .tiny {font-size : 9px;}#jem .error .apf_label{background : url(images/alert.png) no-repeat 0 0;'
            + 'min-height : 37px;padding : 3px 0 0 45px;}]]></a:style><a:presentation>'
            + '<a:main caption="." for="@for"><div class="apf_label"> </div></a:main></a:presentation></a:label>'
            + '<a:slider name="slider"><a:style><![CDATA[#jem .apf_slider {background: url("images/bar_right.png") no-repeat top right;'
            + 'height: 8px;position: relative;font-family: Tahoma;font-size: 9px;text-align: center;'
            + 'position: absolute;bottom: 9px;right: 53px;margin: 0;}#jem .apf_sliderDisabled {'
            + 'background-position: right -8px;}#jem .apf_slider .apf_left {background: url("images/bar_left.png") no-repeat top left;'
            + 'height: 8px;overflow: hidden;margin: 0;margin-right: 4px;}#jem .apf_sliderDisabled .apf_left {'
            + 'background-position: left -8px;}#jem .apf_sliderDisabled .apf_filledbar {background-position: 0 -8px;}'
            + '#jem .apf_slider .apf_grabber {background: url("images/slider3.png") no-repeat top left;'
            + 'width: 12px;height: 8px;overflow: hidden;position: absolute;margin: 0;}#jem .apf_sliderDisabled .apf_grabber {'
            + 'background-position: left -8px;}]]></a:style><a:presentation>'
            + '<a:main slider="div[1]" container="." status2="div[2]/text()" markers="." direction="horizontal">'
            + '<div class="apf_slider"><div class="apf_grabber"> </div><div class="apf_left"> </div></div></a:main>'
            + '<marker><u> </u></marker></a:presentation></a:slider>'
            + '<a:slider name="slider16"><a:style><![CDATA[#jem .apf_slider16 {background: url("images/bar16x_right.png") no-repeat top right;'
            + 'width: 300px;height: 16px;position: relative;padding-right: 7px;font-family: Tahoma;font-size: 9px;'
            + 'text-align: center;position: absolute;bottom: 6px;left: 82px;margin: 0;}#jem .apf_slider16Disabled {background-position: right -16px;}'
            + '#jem .apf_slider16 .apf_left {background: url("images/bar16x_left.png") no-repeat top left;'
            + 'height: 16px;overflow: hidden;margin: 0;}#jem .apf_slider16Disabled .apf_left {background-position: left -16px;}'
            + '#jem .apf_slider16 .apf_grabber {background: url("images/rslider16x.png") no-repeat top right;'
            + 'width: 20px;height: 16px;overflow: hidden;position: absolute;margin: 0;}#jem .apf_slider16Disabled .apf_grabber {'
            + 'background-position: left -16px;margin-left: 7px;cursor: normal;}#jem .apf_slider16 .apf_sldprogress {'
            + 'background: #ddd;display: block;overflow: hidden;height: 4px;margin-left: 6px;margin-top: 6px;z-index: 0;}]]>'
            + '</a:style><a:presentation><a:main slider="div[1]" container="." progress="div[2]" status2="div[2]/text()" markers="." '
            + 'direction="horizontal"><div class="apf_slider16"><div class="apf_grabber"> </div><div class="apf_left"> </div></div></a:main>'
            + '<progress><span class="apf_sldprogress"></span></progress><marker><u></u></marker>'
            + '</a:presentation></a:slider>'
            + '<a:button name="button"><a:style><![CDATA[#jem .apf_button {color: #4b4b4b;font-family: Tahoma;'
            + 'font-size: 8pt;height: 21px;width: 34px;overflow: hidden;cursor: default;background: url(images/mediabtn2.png) no-repeat 0 -42px;'
            + 'position: absolute;bottom: 3px;left: 3px;margin: 0;}#jem .apf_buttonOver {background-position: 0 -21px;}'
            + '#jem .apf_buttonDisabled {background-position: 0 -42px;}#jem .apf_buttonDown {background-position: 0 0px;}'
            + '#jem .apf_button span {display: block;background: no-repeat 0 0;width: 11px;height: 10px;margin: 4px auto 0 11px;}]]>'
            + '</a:style><a:presentation><a:main background="span" icon="span"><div class="apf_button"><span></span></div>'
            + '</a:main></a:presentation></a:button>'
            + '<a:video name="video"><a:style><![CDATA[#jem .apf_video {line-height:300px;margin:0;'
            + 'padding:0;text-align:center;vertical-align:middle;overflow : hidden;background : black;}'
            + '#jem .apf_video #qt_event_source{position : absolute;left : 0;top : 0;}]]></a:style>'
            + '<a:presentation><a:main container="."><div class="apf_video"></div></a:main></a:presentation>'
            + '</a:video></a:skin>';
        if (false && !apf.skins.skins["default"] && apf.skins.defaultSkin) {
            //#ifdef __DEBUG
            apf.console.warn("No skin definition found. Using default skin.");
            //#endif

            //var xmlString = apf.skins.defaultSkin.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
            //var xmlNode = apf.getAmlDocFromString(apf.skins.defaultSkin).documentElement; //@todo should get preprocessed
            //@todo apf3.0 rewrite this flow
            var str = apf.skins.defaultSkin.replace(/\<\!DOCTYPE[^>]*>/, "")
              .replace(/&nbsp;/g, " ").replace(/^[\r\n\s]*/, "");
            if (!apf.supportNamespaces)
                str = str.replace(/xmlns\=\"[^"]*\"/g, "");
            var xmlNode = apf.getXml(str);//apf.getAmlDocFromString(xmlString);
              
            xmlNode.setAttribute("media-path", apf.CDN + apf.VERSION + "/images/")
            xmlNode.setAttribute("icon-path", apf.CDN + apf.VERSION + "/icons/")
            
            apf.skins.Init(xmlNode);
        }
        //#endif
        
        var bodyMarginTop = parseFloat(apf.getStyle(document.body, "marginTop"));
        apf.doesNotIncludeMarginInBodyOffset = (document.body.offsetTop !== bodyMarginTop);

        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (apf.isParsingPartial) {
            apf.config.setDefaults();
            apf.hasSingleRszEvent = true;

            var pHtmlNode = document.body;
            var lastChild = pHtmlNode.lastChild;
            apf.AmlParser.parseMoreAml(apf.AppNode, pHtmlNode, null,
                true, false);

            var pNode, firstNode, next, info,
                lastBefore = null,
                loop       = pHtmlNode.lastChild;
            while (loop && lastChild != loop) {
                info = apf.amlParts[loop.getAttribute("jid")];
                next = loop.previousSibling;
                if (info) {
                    pNode = info[0];
                    if ("P".indexOf(pNode.tagName) > -1) {
                        lastBefore = pNode.parentNode.insertBefore(
                            apf.getNode(loop, [0]), pNode);
                    }
                    else {
                        firstNode = apf.getNode(loop, [0]);
                        while(firstNode){
                            if (firstNode) {
                                lastBefore = pNode.insertBefore(firstNode,
                                    typeof info[1] == "number" ? lastBefore : info[1]);
                            }
                            else {
                                lastBefore = typeof info[1] == "number" 
                                    ? lastBefore
                                    : info[1];
                            }
                            firstNode = apf.getNode(loop, [0]);
                        }
                    }

                    loop.parentNode.removeChild(loop);
                }
                loop = next;
            }

            //#ifdef __WITH_LAYOUT
            $setTimeout("apf.layout.forceResize();");
            // #endif
        }
        else
        //#endif
        {
            apf.window.init(xmlStr);
        }
    },

    // #ifndef __SUPPORT_GWT
    /**
     * @private
     */
    execDeferred: function() {
        // execute each function in the stack in the order they were added
        var len = apf.load_events.length;
        while (len--)
            (apf.load_events.shift())();
    },

    load_events: [],
    load_timer : null,
    load_done  : false,
    load_init  : null,

    /**
     * @private
     */
    addDomLoadEvent: function(func) {
        if (!this.$bdetect)
            this.browserDetect();

        if (apf.load_done)
            return func();

        // create event function stack
        //apf.done = arguments.callee.done;
        if (!apf.load_init) {
            apf.load_init = function() {
                if (apf.load_done) return;
                // kill the timer
                clearInterval(apf.load_timer);
                apf.load_timer = null;
                apf.load_done  = true;
                if (apf.started)
                    apf.execDeferred();
            };
        }

        apf.load_events.push(func);

        if (func && apf.load_events.length == 1) {
            // Catch cases where addDomLoadEvent() is called after the browser
            // event has already occurred.
            var doc = document, UNDEF = "undefined";
            if ((typeof doc.readyState != UNDEF && doc.readyState == "complete")
              || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body)))
                return apf.load_init();

            // for Mozilla/Opera9.
            // Mozilla, Opera (see further below for it) and webkit nightlies
            // currently support this event
            if (doc.addEventListener && !apf.isOpera) {
                // We're using "window" and not "document" here, because it results
                // in a memory leak, especially in FF 1.5:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=241518
                // See also:
                // http://bitstructures.com/2007/11/javascript-method-callbacks
                // http://www-128.ibm.com/developerworks/web/library/wa-memleak/
                window.addEventListener("DOMContentLoaded", apf.load_init, false);
            }
            // If IE is used and is not in a frame
            else if (apf.isIE && window == top) {
                apf.load_timer = setInterval(function() {
                    try {
                        // If IE is used, use the trick by Diego Perini
                        // http://javascript.nwbox.com/IEContentLoaded/
                        doc.documentElement.doScroll("left");
                    }
                    catch(ex) {
                        $setTimeout(arguments.callee, 0);
                        return;
                    }
                    // no exceptions anymore, so we can call the init!
                    apf.load_init();
                }, 10);
            }
            else if (apf.isOpera) {
                doc.addEventListener("DOMContentLoaded", function() {
                    apf.load_timer = setInterval(function() {
                        for (var i = 0, l = doc.styleSheets.length; i < l; i++) {
                            if (doc.styleSheets[i].disabled)
                                return;
                        }
                        // all is fine, so we can call the init!
                        apf.load_init();
                    }, 10);
                }, false);
            }
            else if (apf.isWebkit && !apf.isIphone) {
                var aSheets = doc.getElementsByTagName("link"),
                    i       = aSheets.length,
                    iSheets;
                for (; i >= 0; i++) {
                    if (!aSheets[i] || aSheets[i].getAttribute("rel") != "stylesheet")
                        aSheets.splice(i, 0);
                }
                iSheets = aSheets.length;
                apf.load_timer  = setInterval(function() {
                    if (/loaded|complete/.test(doc.readyState)
                      && doc.styleSheets.length == iSheets)
                        apf.load_init(); // call the onload handler
                }, 10);
            }
            // for other browsers set the window.onload, but also execute the
            // old window.onload
            else {
                var old_onload = window.onload;
                window.onload  = function () {
                    apf.load_init();
                    if (old_onload)
                        old_onload();
                };
            }
        }
    },
    // #endif
    
    /**
     * @private
     */
    addListener : function(el, type, fn){
        if (el.addEventListener)
            el.addEventListener(type, fn, false);
        else if (el.attachEvent)
            el.attachEvent("on" + type, fn);
        return this;
    },
    
    /**
     * @private
     */
    removeListener : function(el, type, fn){
        if (el.removeEventListener)
            el.removeEventListener(type, fn, false);
        else if (el.detachEvent)
            el.detachEvent("on" + type, fn);
        return this;
    },

    /* Destroy */

    /**
     * Unloads the aml application.
     */
    unload : function(exclude){
        //#ifdef __DEBUG
        apf.console.info("Initiating self destruct...");
        //#endif

        this.isDestroying = true;

        //#ifdef __WITH_POPUP
        this.popup.destroy();
        //#endif

        var node,
            i = 0,
            l = this.all.length;
        for (; i < l; i++) {
            node = this.all[i];
            if (node && node != exclude && node.destroy && !node.apf)
                node.destroy(false);
        }

        //this.dispatchEvent("DOMNodeRemovedFromDocument", {});//@todo apf3.0
        
        for (i = 0, l = this.availHTTP.length; i < l; i++)
            this.availHTTP[i] = null;
        
        this.availHTTP.length = 0;

        //#ifdef __WITH_XMLDATABASE
        if (apf.xmldb)
            apf.xmldb.unbind(apf.window);
        //#endif

        this.isDestroying = false;
    }
};

/*
 * Replacement for getElementsByTagNameNS because some browsers don't support
 * this call yet.
 */
var $xmlns = function(xmlNode, tag, xmlns, prefix){
    if (!apf.supportNamespaces) {
        if (!prefix)
            prefix = apf.findPrefix(xmlNode, xmlns);

        if (xmlNode.style || xmlNode == document)
            return xmlNode.getElementsByTagName(tag)
        else {
            if (prefix)
                (xmlNode.nodeType == 9 ? xmlNode : xmlNode.ownerDocument)
                    .setProperty("SelectionNamespaces",
                        "xmlns:" + prefix + "='" + xmlns + "'");

            return xmlNode.selectNodes(".//" + (prefix ? prefix + ":" : "") + tag);
        }
    }
    
    return xmlNode.getElementsByTagNameNS(xmlns, tag);
};

var $setTimeout  = setTimeout;
var $setInterval = setInterval;

document.documentElement.className += " has_apf";
apf.browserDetect();
apf.Init.run("apf");

//#ifndef __PACKAGED
if (!apf.basePath) {
    var snodes = document.getElementsByTagName("script");
    for (var src, i = 0; i < snodes.length; i++) {
        src = snodes[i].getAttribute("src");
        if (src && src.match(/^(.*)apf\.js$/)) {
            apf.basePath = RegExp.$1;
            break;
        }
    }

    if (apf.basePath) {
        var s = apf.basePath.split("/");
        var l = apf.getDirname(location.href).split("/"); l.pop();
        for (var i = 0; i < s.length; i++) {
            if (s[0] == "..") {
                l.pop();
                s.shift();
            }
            else break;
        }
        apf.basePath = l.join("/") + "/" + s.join("/");
    }

    if (!apf.basePath)
        apf.basePath = "./";
}

if (location.protocol == "file:" && !apf.isGecko && !apf.isWebkit) {
    (function(global){
        // constants used for compression optimization
        var sUNDEF                = "undefined",
            sSTRING               = "string",
            sOBJECT               = "object",
            sHEAD                 = "head",
            sBODY                 = "body",
            sFUNCTION             = "function",
            sSCRIPT               = "script",
            sSRCURI               = "srcuri",
            sDONE                 = "done",
            sWHICH                = "which",
            sREADYSTATE           = "readyState",
            bTRUE                 = true,
            bFALSE                = false,
            oDOC                  = global.document,
            oDOCLOC               = oDOC.location,
            fSETTIMEOUT           = global.setTimeout,
            fGETELEMENTSBYTAGNAME = function(tn){return oDOC.getElementsByTagName(tn);},
            fOBJTOSTRING          = Object.prototype.toString,
            fNOOP                 = function(){},
            append_to             = {},
            all_scripts           = {},
            PAGEROOT              = /^[^?#]*\//.exec(oDOCLOC.href)[0], // TODO: FIX THESE FOR file:/// type URIs
            DOCROOT               = /^\w+\:\/\/\/?[^\/]+/.exec(PAGEROOT)[0],
            docScripts            = fGETELEMENTSBYTAGNAME(sSCRIPT),
            global_defs           = {
                dupe : bFALSE, // allow duplicate scripts?
                base : "",     // base path to prepend to all non-absolute-path scripts
                which: sHEAD   // which DOM object ("head" or "body") to append scripts to
            }
        ;

        append_to[sHEAD] = fGETELEMENTSBYTAGNAME(sHEAD);
        append_to[sBODY] = fGETELEMENTSBYTAGNAME(sBODY);

        function canonicalScriptURI(src, base_path) {
            if (typeof src !== sSTRING)
                src = "";
            if (typeof base_path !== sSTRING)
                base_path = "";
            var ret = (/^\w+\:\/\//.test(src) ? "" : base_path) + src;
            return ((/^\w+\:\/\//.test(ret)
                ? ""
                : (ret.charAt(0) === "/" ? DOCROOT : PAGEROOT)) + ret);
        }
        function sameDomain(src) {
            return (canonicalScriptURI(src).indexOf(DOCROOT) === 0);
        }
        function scriptTagExists(uri) { // checks if a script uri has ever been loaded into this page's DOM
            var i = 0, script;
            while (script = docScripts[i++]) {
                if (typeof script.src === sSTRING && uri === canonicalScriptURI(script.src))
                    return bTRUE;
            }
            return bFALSE;
        }
        function engine(queueExec,opts) {
            queueExec = !(!queueExec);
            if (typeof opts === sUNDEF)
                opts = global_defs;

            var publicAPI,
                ready           = bFALSE,
                _which          = opts.which,
                _base_path      = opts.base,
                waitFunc        = fNOOP,
                scripts_loading = bFALSE,
                scripts         = {},
                exec            = [];

            function isScriptLoaded(elem,scriptentry) {
                if ((elem[sREADYSTATE] && elem[sREADYSTATE] !== "complete"
                  && elem[sREADYSTATE] !== "loaded") || scriptentry[sDONE])
                    return bFALSE;
                elem.onload = elem.onreadystatechange = null; // prevent memory leak
                return bTRUE;
            }
            function handleScriptLoad(elem,scriptentry) {
                if (!(isScriptLoaded(elem,scriptentry))) return;
                scriptentry[sDONE] = bTRUE;

                for (var key in scripts) {
                    if (scripts.hasOwnProperty(key) && !(scripts[key][sDONE]))
                        return;
                }
                ready = bTRUE;
                if (ready)
                    waitFunc();
            }
            function createScriptTag(scriptentry,src,type,charset) {
                if (append_to[scriptentry[sWHICH]][0] === null) { // append_to object not yet ready
                    fSETTIMEOUT(arguments.callee,25);
                    return;
                }
                var scriptElem = oDOC.createElement(sSCRIPT),
                    fSETATTRIBUTE = function(attr, val){
                        scriptElem.setAttribute(attr,val);
                    };
                fSETATTRIBUTE("type", type);
                if (typeof charset === sSTRING)
                    fSETATTRIBUTE("charset", charset);
                scriptElem.onload = scriptElem.onreadystatechange = function(){
                    handleScriptLoad(scriptElem, scriptentry);
                };
                fSETATTRIBUTE("src", src);
                append_to[scriptentry[sWHICH]][0].appendChild(scriptElem);
            }
            function loadScript(o) {
                if (typeof o.allowDup === sUNDEF)
                    o.allowDup = opts.dupe;
                var scriptentry,
                    src      = o.src,
                    type     = o.type,
                    charset  = o.charset,
                    allowDup = o.allowDup,
                    src_uri  = canonicalScriptURI(src,_base_path);
                if (typeof type !== sSTRING)
                    type = "text/javascript";
                if (typeof charset !== sSTRING)
                    charset = null;
                allowDup = !(!allowDup);

                if (!allowDup &&
                    (
                        (typeof all_scripts[src_uri] !== sUNDEF && all_scripts[src_uri] !== null) ||
                        scriptTagExists(src_uri)
                    )
                ) {
                    return;
                }
                if (typeof scripts[src_uri] === sUNDEF)
                    scripts[src_uri] = {};
                scriptentry = scripts[src_uri];
                if (typeof scriptentry[sWHICH] === sUNDEF)
                    scriptentry[sWHICH] = _which;
                scriptentry[sDONE]   = bFALSE;
                scriptentry[sSRCURI] = src_uri;
                scripts_loading      = bTRUE;

                all_scripts[scriptentry[sSRCURI]] = bTRUE;
                createScriptTag(scriptentry, src_uri, type, charset);
            }
            function onlyQueue(execBody) {
                exec.push(execBody);
            }
            function queueOrExecute(execBody) { // helper for publicAPI functions below
                if (queueExec)
                    onlyQueue(execBody);
                else
                    execBody();
            }
            function serializeArgs(args) {
                var sargs = [],
                    i     = 0,
                    l     = args.length;
                for (; i < l; i++) {
                    if (fOBJTOSTRING.call(args[i]) === "[object Array]")
                        sargs = sargs.concat(serializeArgs(args[i]));
                    else
                        sargs[sargs.length] = args[i];
                }
                return sargs;
            }

            publicAPI = {
                script:function() {
                    var args = serializeArgs(arguments),
                        i    = 0,
                        l    = args.length;
                    for (; i < l; i++) {
                        var arg = (typeof args[i] === sOBJECT)
                            ? args[i]
                            : {src: args[i]};
                        loadScript(arg);
                    }
                    return publicAPI;
                },
                wait:function(func) {
                    if (typeof func !== sFUNCTION)
                        func = fNOOP;
                    // On this current chain's waitFunc function, tack on call to trigger the queue for the *next* engine
                    // in the chain, which will be executed when the current chain finishes loading
                    // 'bTRUE' tells the engine to be in queueing mode
                    var e                = engine(bTRUE, opts),
                        // store ref to e's trigger function for use by 'wfunc'
                        triggerNextChain = e.trigger,
                        wfunc = function(){
                            try {
                                func();
                            } catch(err) {}
                            triggerNextChain();
                        };
                    delete e.trigger; // remove the 'trigger' property from e's public API, since only used internally
                    var fn = function(){
                        if (scripts_loading && !ready)
                            waitFunc = wfunc;
                        else
                            fSETTIMEOUT(wfunc,0);
                    };

                    if (queueExec && !scripts_loading)
                        onlyQueue(fn)
                    else
                        queueOrExecute(fn);
                    return e;
                }
            };
            // alias "block" to "wait" -- "block" is now deprecated
            publicAPI.block = publicAPI.wait;
            if (queueExec) {
                // if queueing, return a function that the previous chain's
                // waitFunc function can use to trigger this engine's queue.
                // NOTE: this trigger function is captured and removed from the public chain API before return
                publicAPI.trigger = function() {
                    var i = 0, fn;
                    while (fn = exec[i++])
                        fn();
                    exec = [];
                }
            }
            return publicAPI;
        }
        function extendOpts(opts) {
            var k,
                newOpts     = {},
                optMappings = {"AppendTo":"which","AllowDuplicates":"dupe",
                    "BasePath":"base"};
            newOpts.order = !(!global_defs.order);
            for (k in optMappings) {
                if (typeof global_defs[optMappings[k]] !== sUNDEF) {
                    newOpts[optMappings[k]] = (typeof opts[k] !== sUNDEF)
                        ? opts[k]
                        : global_defs[optMappings[k]];
                }
            }
            newOpts.preserve = !(!newOpts.preserve);
            newOpts.dupe     = !(!newOpts.dupe);
            newOpts.base     = (typeof newOpts.base === sSTRING) ? newOpts.base : "";
            newOpts.which    = (newOpts.which === sHEAD || newOpts.which === sBODY)
                ? newOpts.which
                : sHEAD;
            return newOpts;
        }

        apf.$loader = {
            // intentionally does not return an "engine" instance -- must call
            // as stand-alone function call on $fLAB
            setGlobalDefaults:function(gdefs) {
                global_defs = extendOpts(gdefs);
            },
            // set options per chain
            setOptions:function(opts){
                return engine(bFALSE,extendOpts(opts));
            },
            // will load one or more scripts
            script:function(){
                return engine().script.apply(null,arguments);
            },
            // will ensure that the chain's previous scripts are executed before
            // sexecution of scripts in subsequent chain links
            wait:function(){
                return engine().wait.apply(null,arguments);
            }
        };
        // alias "block" to "wait" -- "block" is now deprecated
        apf.$loader.block = apf.$loader.wait;
    })(window);
}
else {
    // LAB.js (LABjs :: Loading And Blocking JavaScript)
    // v1.0.2rc1 (c) Kyle Simpson
    // MIT License
    
    (function(global){
    	var sSTRING = "string",				// constants used for compression optimization
    		sHEAD = "head",
    		sBODY = "body",
    		sSCRIPT = "script",
    		sREADYSTATE = "readyState",
    		sPRELOADDONE = "preloaddone",
    		sLOADTRIGGER = "loadtrigger",
    		sSRCURI = "srcuri",
    		sPRELOAD = "preload",
    		sCOMPLETE = "complete",
    		sDONE = "done",
    		sWHICH = "which",
    		sPRESERVE = "preserve",
    		sONREADYSTATECHANGE = "onreadystatechange",
    		sONLOAD = "onload",
    		sHASOWNPROPERTY = "hasOwnProperty",
    		sSCRIPTCACHE = "script/cache",
    		sTYPEOBJ = "[object ",
    		sTYPEFUNC = sTYPEOBJ+"Function]",
    		sTYPEARRAY = sTYPEOBJ+"Array]",
    		nNULL = null,
    		bTRUE = true,
    		bFALSE = false,
    		oDOC = global.document,
    		oWINLOC = global.location,
    		oACTIVEX = global.ActiveXObject,
    		fSETTIMEOUT = global.setTimeout,
    		fCLEARTIMEOUT = global.clearTimeout,
    		fGETELEMENTSBYTAGNAME = function(tn){return oDOC.getElementsByTagName(tn);},
    		fOBJTOSTRING = Object.prototype.toString,
    		fNOOP = function(){},
    		append_to = {},
    		all_scripts = {},
    		PAGEROOT = /^[^?#]*\//.exec(oWINLOC.href)[0], // these ROOTs do not support file:/// usage, only http:// type usage
    		DOCROOT = /^\w+\:\/\/\/?[^\/]+/.exec(PAGEROOT)[0], // optional third / in the protocol portion of this regex so that LABjs doesn't blow up when used in file:/// usage
    		docScripts = fGETELEMENTSBYTAGNAME(sSCRIPT),
    
    		// Ah-ha hush that fuss, feature inference is used to detect specific browsers
    		// because the techniques used in LABjs have no known feature detection. If
    		// you know of a feature test please contact me ASAP. Feature inference is used
    		// instead of user agent sniffing because the UA string can be easily
    		// spoofed and is not adequate for such a mission critical part of the code.
    		is_opera = global.opera && fOBJTOSTRING.call(global.opera) == sTYPEOBJ+"Opera]",
    		is_gecko = (function(o) { o[o] = o+""; return o[o] != o+""; })(new String("__count__")),
    
    		global_defs = {
    			cache:!(is_gecko||is_opera), // browsers like IE/Safari/Chrome can use the "cache" trick to preload
    			order:is_gecko||is_opera, // FF/Opera preserve execution order with script tags automatically, so just add all scripts as fast as possible
    			xhr:bTRUE, // use XHR trick to preload local scripts
    			dupe:bTRUE, // allow duplicate scripts? defaults to true now 'cause is slightly more performant that way (less checks)
    			base:"", // base path to prepend to all non-absolute-path scripts
    			which:sHEAD // which DOM object ("head" or "body") to append scripts to
    		}
    	;
    	global_defs[sPRESERVE] = bFALSE; // force preserve execution order of all loaded scripts (regardless of preloading)
    	global_defs[sPRELOAD] = bTRUE; // use various tricks for "preloading" scripts
    	
    	append_to[sHEAD] = fGETELEMENTSBYTAGNAME(sHEAD);
    	append_to[sBODY] = fGETELEMENTSBYTAGNAME(sBODY);
    	
    	function isFunc(func) { return fOBJTOSTRING.call(func) === sTYPEFUNC; }
    	function canonicalScriptURI(src,base_path) {
    		var regex = /^\w+\:\/\//, ret; 
    		if (typeof src !== sSTRING) src = "";
    		if (typeof base_path !== sSTRING) base_path = "";
    		ret = (regex.test(src) ? "" : base_path) + src;
    		return ((regex.test(ret) ? "" : (ret.charAt(0) === "/" ? DOCROOT : PAGEROOT)) + ret);
    	}
    	function sameDomain(src) { return (canonicalScriptURI(src).indexOf(DOCROOT) === 0); }
    	function scriptTagExists(uri) { // checks if a script uri has ever been loaded into this page's DOM
    		var script, idx=-1;
    		while (script = docScripts[++idx]) {
    			if (typeof script.src === sSTRING && uri === canonicalScriptURI(script.src) && script.type !== sSCRIPTCACHE) return bTRUE;
    		}
    		return bFALSE;
    	}
    	function engine(queueExec,opts) {
    		queueExec = !(!queueExec);
    		if (opts == nNULL) opts = global_defs;
    		
    		var ready = bFALSE,
    			_use_preload = queueExec && opts[sPRELOAD],
    			_use_cache_preload = _use_preload && opts.cache,
    			_use_script_order = _use_preload && opts.order,
    			_use_xhr_preload = _use_preload && opts.xhr,
    			_auto_wait = opts[sPRESERVE],
    			_which = opts.which,
    			_base_path = opts.base,
    			waitFunc = fNOOP,
    			scripts_loading = bFALSE,
    			publicAPI,
    
    			first_pass = bTRUE,
    			scripts = {},
    			exec = [],
    			end_of_chain_check_interval = nNULL
    		;
    		
    		_use_preload = _use_cache_preload || _use_xhr_preload || _use_script_order; // if all flags are turned off, preload is moot so disable it
    		
    		function isScriptLoaded(elem,scriptentry) {
    			if ((elem[sREADYSTATE] && elem[sREADYSTATE]!==sCOMPLETE && elem[sREADYSTATE]!=="loaded") || scriptentry[sDONE]) { return bFALSE; }
    			elem[sONLOAD] = elem[sONREADYSTATECHANGE] = nNULL; // prevent memory leak
    			return bTRUE;
    		}
    		function handleScriptLoad(elem,scriptentry,skipReadyCheck) {
    			skipReadyCheck = !(!skipReadyCheck); // used to override ready check when script text was injected from XHR preload
    			if (!skipReadyCheck && !(isScriptLoaded(elem,scriptentry))) return;
    			scriptentry[sDONE] = bTRUE;
    
    			for (var key in scripts) {
    				if (scripts[sHASOWNPROPERTY](key) && !(scripts[key][sDONE])) return;
    			}
    			ready = bTRUE;
    			waitFunc();
    		}
    		function loadTriggerExecute(scriptentry) {
    			if (isFunc(scriptentry[sLOADTRIGGER])) {
    				scriptentry[sLOADTRIGGER]();
    				scriptentry[sLOADTRIGGER] = nNULL; // prevent memory leak
    			}
    		}
    		function handleScriptPreload(elem,scriptentry) {
    			if (!isScriptLoaded(elem,scriptentry)) return;
    			scriptentry[sPRELOADDONE] = bTRUE;
    			fSETTIMEOUT(function(){
    				append_to[scriptentry[sWHICH]].removeChild(elem); // remove preload script node
    				loadTriggerExecute(scriptentry);
    			},0);
    		}
    		function handleXHRPreload(xhr,scriptentry) {
    			if (xhr[sREADYSTATE] === 4) {
    				xhr[sONREADYSTATECHANGE] = fNOOP; // fix a memory leak in IE
    				scriptentry[sPRELOADDONE] = bTRUE;
    				fSETTIMEOUT(function(){ loadTriggerExecute(scriptentry); },0);
    			}
    		}
    		function createScriptTag(scriptentry,src,type,charset,onload,scriptText) {
    			var _script_which = scriptentry[sWHICH];
    			fSETTIMEOUT(function() { // this $setTimeout waiting "hack" prevents a nasty race condition browser hang (IE) when the document.write("<script defer=true>") type dom-ready hack is present in the page
    				if ("item" in append_to[_script_which]) { // check if ref is still a live node list
    					if (!append_to[_script_which][0]) { // append_to node not yet ready
    						fSETTIMEOUT(arguments.callee,25); // try again in a little bit -- note, will recall the anonymous functoin in the outer $setTimeout, not the parent createScriptTag()
    						return;
    					}
    					append_to[_script_which] = append_to[_script_which][0]; // reassign from live node list ref to pure node ref -- avoids nasty IE bug where changes to DOM invalidate live node lists
    				}
    				var scriptElem = oDOC.createElement(sSCRIPT);
    				scriptElem.type = type;
    				if (typeof charset === sSTRING) scriptElem.charset = charset;
    				if (isFunc(onload)) { // load script via 'src' attribute, set onload/onreadystatechange listeners
    					scriptElem[sONLOAD] = scriptElem[sONREADYSTATECHANGE] = function(){onload(scriptElem,scriptentry);};
    					scriptElem.src = src;
    				}
    				// only for appending to <head>, fix a bug in IE6 if <base> tag is present -- otherwise, insertBefore(...,null) acts just like appendChild()
    				append_to[_script_which].insertBefore(scriptElem,(_script_which===sHEAD?append_to[_script_which].firstChild:nNULL));
    				if (typeof scriptText === sSTRING) { // script text already avaiable from XHR preload, so just inject it
    					scriptElem.text = scriptText;
    					handleScriptLoad(scriptElem,scriptentry,bTRUE); // manually call 'load' callback function, skipReadyCheck=true
    				}
    			},0);
    		}
    		function loadScriptElem(scriptentry,src,type,charset) {
    			all_scripts[scriptentry[sSRCURI]] = bTRUE;
    			createScriptTag(scriptentry,src,type,charset,handleScriptLoad);
    		}
    		function loadScriptCache(scriptentry,src,type,charset) {
    			var args = arguments;
    			if (first_pass && scriptentry[sPRELOADDONE] == nNULL) { // need to preload into cache
    				scriptentry[sPRELOADDONE] = bFALSE;
    				createScriptTag(scriptentry,src,sSCRIPTCACHE,charset,handleScriptPreload); // fake mimetype causes a fetch into cache, but no execution
    			}
    			else if (!first_pass && scriptentry[sPRELOADDONE] != nNULL && !scriptentry[sPRELOADDONE]) { // preload still in progress, make sure trigger is set for execution later
    				scriptentry[sLOADTRIGGER] = function(){loadScriptCache.apply(nNULL,args);};
    			}
    			else if (!first_pass) { // preload done, so reload (from cache, hopefully!) as regular script element
    				loadScriptElem.apply(nNULL,args);
    			}
    		}
    		function loadScriptXHR(scriptentry,src,type,charset) {
    			var args = arguments, xhr;
    			if (first_pass && scriptentry[sPRELOADDONE] == nNULL) { // need to preload
    				scriptentry[sPRELOADDONE] = bFALSE;
    				xhr = scriptentry.xhr = (oACTIVEX ? new oACTIVEX("Microsoft.XMLHTTP") : new global.XMLHttpRequest());
    				xhr[sONREADYSTATECHANGE] = function(){handleXHRPreload(xhr,scriptentry);};
    				xhr.open("GET",src);
    				xhr.send("");
    			}
    			else if (!first_pass && scriptentry[sPRELOADDONE] != nNULL && !scriptentry[sPRELOADDONE]) {	// preload XHR still in progress, make sure trigger is set for execution later
    				scriptentry[sLOADTRIGGER] = function(){loadScriptXHR.apply(nNULL,args);};
    			}
    			else if (!first_pass) { // preload done, so "execute" script via injection
    				all_scripts[scriptentry[sSRCURI]] = bTRUE;
    				createScriptTag(scriptentry,src,type,charset,nNULL,scriptentry.xhr.responseText);
    				scriptentry.xhr = nNULL;
    			}
    		}
    		function loadScript(o) {
    			if (o.allowDup == nNULL) o.allowDup = opts.dupe;
    			var src = o.src, type = o.type, charset = o.charset, allowDup = o.allowDup, 
    				src_uri = canonicalScriptURI(src,_base_path), scriptentry, same_domain = sameDomain(src_uri);
    			if (typeof type !== sSTRING) type = "text/javascript";
    			if (typeof charset !== sSTRING) charset = nNULL;
    			allowDup = !(!allowDup);
    			if (!allowDup && 
    				(
    					(all_scripts[src_uri] != nNULL) || (first_pass && scripts[src_uri]) || scriptTagExists(src_uri)
    				)
    			) {
    				if (scripts[src_uri] != nNULL && scripts[src_uri][sPRELOADDONE] && !scripts[src_uri][sDONE] && same_domain) {
    					// this script was preloaded via XHR, but is a duplicate, and dupes are not allowed
    					handleScriptLoad(nNULL,scripts[src_uri],bTRUE); // mark the entry as done and check if chain group is done
    				}
    				return;
    			}
    			if (scripts[src_uri] == nNULL) scripts[src_uri] = {};
    			scriptentry = scripts[src_uri];
    			if (scriptentry[sWHICH] == nNULL) scriptentry[sWHICH] = _which;
    			scriptentry[sDONE] = bFALSE;
    			scriptentry[sSRCURI] = src_uri;
    			scripts_loading = bTRUE;
    			
    			if (!_use_script_order && _use_xhr_preload && same_domain) loadScriptXHR(scriptentry,src_uri,type,charset);
    			else if (!_use_script_order && _use_cache_preload) loadScriptCache(scriptentry,src_uri,type,charset);
    			else loadScriptElem(scriptentry,src_uri,type,charset);
    		}
    		function onlyQueue(execBody) {
    			exec.push(execBody);
    		}
    		function queueAndExecute(execBody) { // helper for publicAPI functions below
    			if (queueExec && !_use_script_order) onlyQueue(execBody);
    			if (!queueExec || _use_preload) execBody(); // if engine is either not queueing, or is queuing in preload mode, go ahead and execute
    		}
    		function serializeArgs(args) {
    			var sargs = [], idx;
    			for (idx=-1; ++idx<args.length;) {
    				if (fOBJTOSTRING.call(args[idx]) === sTYPEARRAY) sargs = sargs.concat(serializeArgs(args[idx]));
    				else sargs[sargs.length] = args[idx];
    			}
    			return sargs;
    		}
    				
    		publicAPI = {
    			script:function() {
    				fCLEARTIMEOUT(end_of_chain_check_interval);
    				var args = serializeArgs(arguments), use_engine = publicAPI, idx;
    				if (_auto_wait) {
    					for (idx=-1; ++idx<args.length;) {
    						if (idx===0) {
    							queueAndExecute(function(){
    								loadScript((typeof args[0] === sSTRING) ? {src:args[0]} : args[0]);
    							});
    						}
    						else use_engine = use_engine.script(args[idx]);
    						use_engine = use_engine.wait();
    					}
    				}
    				else {
    					queueAndExecute(function(){
    						for (idx=-1; ++idx<args.length;) {
    							loadScript((typeof args[idx] === sSTRING) ? {src:args[idx]} : args[idx]);
    						}
    					});
    				}
    				end_of_chain_check_interval = fSETTIMEOUT(function(){first_pass = bFALSE;},5); // hack to "detect" the end of the chain if a wait() is not the last call
    				return use_engine;
    			},
    			wait:function(func) {
    				fCLEARTIMEOUT(end_of_chain_check_interval);
    				first_pass = bFALSE;
    				if (!isFunc(func)) func = fNOOP;
    				// On this current chain's waitFunc function, tack on call to trigger the queue for the *next* engine 
    				// in the chain, which will be executed when the current chain finishes loading
    				var e = engine(bTRUE,opts),	// 'bTRUE' tells the engine to be in queueing mode
    					triggerNextChain = e.trigger, // store ref to e's trigger function for use by 'wfunc'
    					wfunc = function(){ try { func(); } catch(err) {} triggerNextChain(); };
    				delete e.trigger; // remove the 'trigger' property from e's public API, since only used internally
    				var fn = function(){
    					if (scripts_loading && !ready) waitFunc = wfunc;
    					else wfunc();
    				};
    
    				if (queueExec && !scripts_loading) onlyQueue(fn);
    				else queueAndExecute(fn);
    				return e;
    			}
    		};
    		publicAPI.block = publicAPI.wait;	// alias "block" to "wait" -- "block" is now deprecated
    		if (queueExec) {
    			// if queueing, return a function that the previous chain's waitFunc function can use to trigger this 
    			// engine's queue. NOTE: this trigger function is captured and removed from the public chain API before return
    			publicAPI.trigger = function() {
    				var fn, idx=-1;
    				while (fn = exec[++idx]) fn();
    				exec = []; 
    			};
    		}
    		return publicAPI;
    	}
    	function processOpts(opts) {
    		var k, newOpts = {}, 
    			boolOpts = {"UseCachePreload":"cache","UseLocalXHR":"xhr","UsePreloading":sPRELOAD,"AlwaysPreserveOrder":sPRESERVE,"AllowDuplicates":"dupe"},
    			allOpts = {"AppendTo":sWHICH,"BasePath":"base"}
    		;
    		for (k in boolOpts) allOpts[k] = boolOpts[k];
    		newOpts.order = !(!global_defs.order);
    		for (k in allOpts) {
    			if (allOpts[sHASOWNPROPERTY](k) && global_defs[allOpts[k]] != nNULL) newOpts[allOpts[k]] = (opts[k] != nNULL) ? opts[k] : global_defs[allOpts[k]];
    		}
    		for (k in boolOpts) { // normalize bool props to actual boolean values if not already
    			if (boolOpts[sHASOWNPROPERTY](k)) newOpts[boolOpts[k]] = !(!newOpts[boolOpts[k]]);
    		}
    		if (!newOpts[sPRELOAD]) newOpts.cache = newOpts.order = newOpts.xhr = bFALSE; // turn off all flags if preloading is disabled
    		newOpts.which = (newOpts.which === sHEAD || newOpts.which === sBODY) ? newOpts.which : sHEAD;
    		return newOpts;
    	}
    	
    	apf.$loader = {
    		setGlobalDefaults:function(gdefs) { // intentionally does not return an "engine" instance -- must call as stand-alone function call on $LAB
    			global_defs = processOpts(gdefs);
    		},
    		setOptions:function(opts){ // set options per chain
    			return engine(bFALSE,processOpts(opts));
    		},
    		script:function(){ // will load one or more scripts
    			return engine().script.apply(nNULL,arguments);
    		},
    		wait:function(){ // will ensure that the chain's previous scripts are executed before execution of scripts in subsequent chain links
    			return engine().wait.apply(nNULL,arguments);
    		}
    	};
    	apf.$loader.block = apf.$loader.wait;	// alias "block" to "wait" -- "block" is now deprecated
    	
    	/* The following "hack" was suggested by Andrea Giammarchi and adapted from: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    	   NOTE: this hack only operates in FF and then only in versions where document.readyState is not present (FF < 3.6?).
    	   
    	   The hack essentially "patches" the **page** that LABjs is loaded onto so that it has a proper conforming document.readyState, so that if a script which does 
    	   proper and safe dom-ready detection is loaded onto a page, after dom-ready has passed, it will still be able to detect this state, by inspecting the now hacked 
    	   document.readyState property. The loaded script in question can then immediately trigger any queued code executions that were waiting for the DOM to be ready. 
    	   For instance, jQuery > 1.3.2 has been patched to take advantage of document.readyState, which is enabled by this hack. But 1.3.2 and before are **not** safe or 
    	   affected by this hack, and should therefore **not** be lazy-loaded by script loader tools such as LABjs.
    	*/ 
    	(function(addEvent,domLoaded,handler){
    		if (oDOC[sREADYSTATE] == nNULL && oDOC[addEvent]){
    			oDOC[sREADYSTATE] = "loading";
    			oDOC[addEvent](domLoaded,handler = function(){
    				oDOC.removeEventListener(domLoaded,handler,bFALSE);
    				oDOC[sREADYSTATE] = sCOMPLETE;
    			},bFALSE);
    		}
    	})("addEventListener","DOMContentLoaded");
    	
    })(window);
}

apf.$loader.script(apf.basePath + "loader.js");

//#endif
//#endif
