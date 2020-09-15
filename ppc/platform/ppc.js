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
 * @class ppc
 * The Pylon Platform Code.
 *
 * @author    Ruben Daniels (ruben AT ajax DOT org)
 * @version   3.0
 * @default_private
 *
 */
/**
 * @event domready      Fires when the browsers' DOM is ready to be manipulated.
 */
/** 
 * @event movefocus         Fires when the focus moves from one element to another.
 * @param {ppc.AmlElement} toElement The element that receives the focus.
 */
/** 
 * @event exit              Fires when the application wants to exit.
 * @cancelable  Prevents the application from exiting. The return value of the event object is displayed in a popup, asking the user for permission.
 */
/** 
 * @event keyup         Fires when the user stops pressing a key (by lifting up)
 * @cancelable Prevents the keypress.
 * @param {Object} e An object containing the following properties:
 *  - keyCode ([[Number]]): The character code of the pressed key.
 *  - ctrlKey ([[Boolean]]): Whether the [[keys: Ctrl]] key was pressed.
 *  - shiftKey ([[Boolean]]): Whether the [[keys: Shift]] key was pressed.
 *  - altKey ([[Boolean]]): Whether the [[keys: Alt]] key was pressed.
 *  - htmlEvent ([[Object]]): The html event object.
 */
/** 
 * @event mousescroll   Fires when the user scrolls the mouse
 * @cancelable Prevents the container from scrolling
 * @param {Object} e An object containing the following properties:
 *  - htmlEvent ([[Object]]): The HTML event object
 *  - amlElement ([[ppc.AmlElement]]): The element which was clicked.
 *  - delta ([[Number]]): The scroll impulse.
 */
/** 
 * @event hotkey        Fires when the user presses a hotkey
 * @bubbles
 * @cancelable Prevents the default hotkey behavior.
 * @param {Object} e An object containing the following properties:
 *  - keyCode ([[Number]]): The character code of the pressed key.
 *  - ctrlKey ([[Boolean]]): Whether the [[keys: Ctrl]] key was pressed.
 *  - shiftKey ([[Boolean]]): Whether the [[keys: Shift]] key was pressed.
 *  - altKey ([[Boolean]]): Whether the [[keys: Alt]] key was pressed.
 *  - htmlEvent ([[Object]]): The html event object.
 */
/** 
 * @event keydown       Fires when the user presses down on a key
 * @bubbles
 * @cancelable Prevents the default hotkey behavior.
 * @param {Object} e An object containing the following properties:
 *  - keyCode ([[Number]]): The character code of the pressed key.
 *  - ctrlKey ([[Boolean]]): Whether the [[keys: Ctrl]] key was pressed.
 *  - shiftKey ([[Boolean]]): Whether the [[keys: Shift]] key was pressed.
 *  - altKey ([[Boolean]]): Whether the [[keys: Alt]] key was pressed.
 *  - htmlEvent ([[Object]]): The html event object.
 */
/** 
 * @event mousedown     Fires when the user presses a mouse button
 * @param {Object} e An object containing the following properties:
 *  - htmlEvent ([[Object]]): The HTML event object
 *  - amlElement ([[ppc.AmlElement]]): The element which was clicked.
 */
/** 
 * @event onbeforeprint Fires before the application prints.
 */
/** 
 * @event onafterprint  Fires after the application prints.
 */
/** 
 * @event load          Fires after the application is loaded.
 */
/** 
 * @event error         Fires when a communication error has occured while making a request for this element.
 * @cancelable Prevents the error from being thrown.
 * @bubbles
 * @param {Object} e An object containing the following properties:
 *   - error ([[Error]]): The error object that is thrown when the event's callback doesn't return `false`.
 *   - state ([[Number]]): The state of the call. Possible values include:
 *     - `ppc.SUCCESS` : The request was successful
 *     - `ppc.TIMEOUT`:  The request timed out
 *     - `ppc.ERROR`:    An error occurred while making the request
 *     - `ppc.OFFLINE`:  The request was made while the application was offline.
 *   - userdata (`Mixed`): Data that the caller made available in the callback of the HTTP request.
 *   - http ([[XMLHttpRequest]]): The object that executed the actual http request
 *   - url ([[String]]): The url that was requested
 *   - tpModule ([[ppc.http]]): The teleport module that is making the request
 *   - id ([[Number]]): The id of the request
 *   - message ([[String]]): The error message
 * 
 */
 ppc = {
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
     * Specifies whether ppc is ready for DOM operations.
     * @type {Boolean}
     */
    READY          : false,

    //AML nodeFunc constants
    /**
     * A constant for the hidden AML element.
     * @type {Number}
     */
    NODE_HIDDEN    : 101,
    /**
     * A constant for a visible AML element.
     * @type {Number}
     */
    NODE_VISIBLE   : 102,
    /**
     * A constant for an o3 widget.
     * @type {Number}
     */
    NODE_O3 : 103,

    /**
     * A constant for specifying that a widget is using only the keyboard to receive focus.
     * @type {Number}
     * @see ppc.GuiElement@focus
     */
    KEYBOARD       : 2,
    /**
     * A constant for specifying that a widget is using the keyboard or the mouse to receive focus.
     * @type {Boolean}
     * @see ppc.GuiElement@focus
     */
    KEYBOARD_MOUSE : true,
    /**
     * A constant for specifying that a widget is a menu
     * @type {Number}
     */
    MENU           : 3,

    /**
     * A constant for specifying success.
     * @type {Number}
     */
    SUCCESS : 1,
    /**
     * A constant for specifying a timeout.
     * @type {Number}
     */
    TIMEOUT : 2,
    /**
     * A constant for specifying an error.
     * @type {Number}
     */
    ERROR   : 3,
    /**
     * A constant for specifying the application is offline.
     * @type {Number}
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
     * Specifies whether PPC tries to load a skin from skins.xml when no skin element is specified.
     * @type {Boolean}
     */
    autoLoadSkin  : false,
    /**
     * Specifies whether PPC has started loading scripts and started the init process.
     * @type {Boolean}
     */
    started       : false,
    /**
     * The namespace for all crypto libraries included with Pylon Platform Code.
     * @type {Object}
     */
    crypto        : {}, //namespace
    config        : {},
    _GET          : {},
    $asyncObjects : {"ppc.oHttp" : 1, "ppc.ajax": 1},
    
    /**
     * A string specifying the basepath for loading PPC from seperate files.
     * @type {String}
     */
    basePath      : "",

    //#ifdef __PARSER_AML
    /**
     * Contains several known and often used namespace URI's.
     * @type {Object}
     * @private
     */
    ns : {
        ppc    : "https://github.com/pylonide/pylon",
        aml    : "https://github.com/pylonide/pylon",
        xsd    : "http://www.w3.org/2001/XMLSchema",
        xhtml  : "http://www.w3.org/1999/xhtml",
        xslt   : "http://www.w3.org/1999/XSL/Transform",
        xforms : "http://www.w3.org/2002/xforms",
        ev     : "http://www.w3.org/2001/xml-events"
    },
    //#endif
    
    xPathAxis  : {"self":1, "following-sibling":1, "ancestor":1}, //@todo finish list
    
    hasRequireJS : typeof requirejs !== "undefined",

    availHTTP  : [],
    /**
     * @private
     */
    releaseHTTP: function(http){
        if (ppc.brokenHttpAbort) 
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
        
        /* Browser -  platform and feature detection, based on prototype's and mootools 1.6.
         *
         * Major browser/engines flags
         *
         * 'Browser.name' reports the name of the Browser as string, identical to the property names of the following Boolean values:
         *  - Browser.ie - (boolean) True if the current browser is Internet Explorer.
         *  - Browser.firefox - (boolean) True if the current browser is Firefox.
         *  - Browser.safari - (boolean) True if the current browser is Safari.
         *  - Browser.chrome - (boolean) True if the current browser is Chrome.
         *  - Browser.opera - (boolean) True if the current browser is Opera.
         *
         * In addition to one of the above properties a second property consisting of the name
         * and the major version is provided ('Browser.ie6', 'Browser.chrome15', ...).
         * If 'Browser.chrome' is True, all other possible properties, like 'Browser.firefox', 'Browser.ie', ... , will be undefined.
         *
         * 'Browser.version' reports the version of the Browser as number.
         *
         * 'Browser.Plaform' reports the platform name:
         *  - Browser.Platform.mac - (boolean) True if the platform is Mac.
         *  - Browser.Platform.win - (boolean) True if the platform is Windows.
         *  - Browser.Platform.linux - (boolean) True if the platform is Linux.
         *  - Browser.Platform.ios - (boolean) True if the platform is iOS.
         *  - Browser.Platform.android - (boolean) True if the platform is Android
         *  - Browser.Platform.webos - (boolean) True if the platform is WebOS
         *  - Browser.Platform.other - (boolean) True if the platform is neither Mac, Windows, Linux, Android, WebOS nor iOS.
         *  - Browser.Platform.name - (string) The name of the platform.
         */
        var Browser = this.$bdetect = (function() {
            
            var ua       = navigator.userAgent.toLowerCase(),
                platform = navigator.platform.toLowerCase();
                
            // chrome is included in the edge UA, so need to check for edge first,
            // before checking if it's chrome.
            var UA = ua.match(/(edge)[\s\/:]([\w\d\.]+)/);

            if (!UA) {
              UA = ua.match(/(opera|ie|firefox|chrome|trident|crios|version)[\s\/:]([\w\d\.]+)?.*?(safari|(?:rv[\s\/:]|version[\s\/:])([\w\d\.]+)|$)/) || [null, 'unknown', 0];
            }

            if (UA[1] == 'trident') {
              UA[1] = 'ie';
              if (UA[4]) UA[2] = UA[4];
            }
            else if (UA[1] == 'crios') {
              UA[1] = 'chrome';
            }

            var mode = UA[1] == 'ie' && document.documentMode;

            var b = {

                name: (UA[1] == 'version') ? UA[3] : UA[1],

                version: mode || parseFloat((UA[1] == 'opera' && UA[4]) ? UA[4] : UA[2]),

                Platform: {
                    name: ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform.match(/mac|win|linux/) || ['other'])[0]
                },

                Features: {
                    xpath: !!(document.evaluate),
                    air:   !!(window.runtime),
                    query: !!(document.querySelector),
                    json:  !!(window.JSON)
                },

                Plugins: {}
            };

            b[b.name] = true;
            b[b.name + parseInt(b.version, 10)] = true;
            b.Platform[b.Platform.name] = true;
            
            return b;
            
        })();

        var UA = navigator.userAgent.toLowerCase();
        
        this.isGecko       = !!Browser.firefox;
        this.isChrome      = !!Browser.chrome;
        this.isSafari      = !!Browser.safari;
        this.isSafariOld   = Browser.safari && Browser.version === 2.4;
        this.isEdge        = !!Browser.edge;
        this.isWebkit      = this.isSafari || this.isChrome || UA.indexOf("konqueror") != -1;
        this.isOpera       = !!Browser.opera;
        this.isIE          = !!Browser.ie;
        
        this.isWin         = Browser.Platform.win;
        this.isMac         = Browser.Platform.mac;
        this.isLinux       = Browser.Platform.linux;
        this.isIphone      = Browser.Platform.ios || UA.indexOf("aspen simulator") != -1;
        this.isAIR         = Browser.Features.air;
        
        // @deprecated, cleanup in ppc modules 
        this.versionWebkit = this.isWebkit ? Browser.version : null;
        this.versionGecko  = this.isGecko ? Browser.version : null;
        // @deprecated, cleanup in ppc modules 
        this.isGecko3      = Browser.firefox3;
        this.isGecko35     = this.isGecko3 && Browser.version >= 3.5;
        // @deprecated, cleanup in ppc modules 
        this.versionFF     = this.isGecko ? Browser.version : null;
        this.versionSafari = this.isSafari ? Browser.version : null;
        this.versionChrome = this.isChrome ? Browser.version : null;
        this.versionOpera  = this.isOpera ? Browser.version : null;
        // bad logic, needs review among ppc modules 
        this.isIE6         = this.isIE && Browser.ie6;
        this.isIE7         = this.isIE && Browser.ie7;
        this.isIE8         = this.isIE && Browser.ie8;
        this.isIE7Emulate  = this.isIE && document.documentMode && Browser.ie7;
        this.isIE          = this.isIE ? Browser.version : null;

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
        this.TAGNAME                   = ppc.isIE ? "baseName" : "localName";
        this.styleSheetRules           = ppc.isIE ? "rules" : "cssRules";
        this.brokenHttpAbort           = ppc.isIE6;
        this.canUseHtmlAsXml           = ppc.isIE;
        this.supportNamespaces         = !ppc.isIE;
        this.cannotSizeIframe          = ppc.isIE;
        this.hasConditionCompilation   = ppc.isIE;
        this.supportOverflowComponent  = ppc.isIE;
        // http://robertnyman.com/2010/12/02/css3-flexible-box-layout-module-aka-flex-box-introduction-and-demostest-cases/
        this.hasFlexibleBox            = ppc.versionGecko >= 3 || (ppc.isWebkit && ppc.versionWebkit >= 3.2);
        this.hasFileApi                = !!(window["File"] && window["FileReader"] && window["Blob"] && window["FileError"]);
        this.hasEventSrcElement        = ppc.isIE;
        this.canHaveHtmlOverSelects    = !ppc.isIE6 && !ppc.isIE5;
        this.hasInnerText              = ppc.isIE;
        this.hasMsRangeObject          = ppc.isIE;
        this.descPropJs                = ppc.isIE;
        this.hasClickFastBug           = ppc.isIE;
        this.hasExecScript             = window.execScript ? true : false;
        this.canDisableKeyCodes        = ppc.isIE;
        this.hasTextNodeWhiteSpaceBug  = ppc.isIE || ppc.isIE >= 8;
        this.hasCssUpdateScrollbarBug  = ppc.isIE;
        this.canUseInnerHtmlWithTables = !ppc.isIE;
        this.hasSingleResizeEvent      = !ppc.isIE;
        this.hasStyleFilters           = ppc.isIE;
        this.supportOpacity            = !ppc.isIE || ppc.isIE >= 9;
        this.supportPng24              = !ppc.isIE6 && !ppc.isIE5;
        this.cantParseXmlDefinition    = ppc.isIE50;
        this.hasDynamicItemList        = !ppc.isIE || ppc.isIE >= 7;
        this.canImportNode             = ppc.isIE;
        this.hasSingleRszEvent         = !ppc.isIE;
        this.hasXPathHtmlSupport       = !ppc.isIE;
        this.hasFocusBug               = ppc.isIE;
        this.hasHeightAutoDrawBug      = ppc.isIE && ppc.isIE < 8;
        //this.hasIndexOfNodeList        = !ppc.isIE;
        this.hasReadyStateBug          = ppc.isIE50;
        this.dateSeparator             = ppc.isIE ? "-" : "/";
        this.canCreateStyleNode        = !ppc.isIE;
        this.supportFixedPosition      = !ppc.isIE || ppc.isIE >= 7;
        this.hasHtmlIdsInJs            = ppc.isIE && ppc.isIE < 8 || ppc.isWebkit;
        this.needsCssPx                = !ppc.isIE;
        this.hasCSSChildOfSelector     = !ppc.isIE || ppc.isIE >= 8;
        this.hasStyleAnchors           = !ppc.isIE || ppc.isIE >= 8;
        this.styleAttrIsObj            = ppc.isIE < 8;
        this.hasAutocompleteXulBug     = ppc.isGecko;
        this.loadsLocalFilesSync       = ppc.isIE || ppc.isGecko;
        this.mouseEventBuffer          = ppc.isIE ? 20 : 6;
        this.hasComputedStyle          = typeof document.defaultView != "undefined"
                                           && typeof document.defaultView.getComputedStyle != "undefined";
        this.w3cRange                  = Boolean(window["getSelection"]);
        this.locale                    = (ppc.isIE
                                            ? navigator.userLanguage
                                            : navigator.language).toLowerCase();
        this.characterSet              = document.characterSet || document.defaultCharset || "utf-8";
        var t = document.createElement("div");
        this.hasContentEditable        = (typeof t.contentEditable == "string"
                                       || typeof t.contentEditable == "boolean");
        ppc.hasContentEditableContainerBug = ppc.isWebkit;
        // Try transform first for forward compatibility
        var props   = ["transform", "OTransform", "KhtmlTransform", "MozTransform", "WebkitTransform"],
            props2  = ["transition", "OTransition", "KhtmlTransition", "MozTransition", "WebkitTransition"],
            prefixR = ["", "O", "Khtml", "Moz", "Webkit"],
            prefixC = ["", "o-", "khtml-", "moz-", "webkit-"],
            events  = ["transitionend", "transitionend", "transitionend", "transitionend", "webkitTransitionEnd"],
            i       = 0,
            l       = 5;
        this.supportCSSAnim            = false;
        this.supportCSSTransition      = false;
        for (; i < l && !this.supportCSSAnim; ++i) {
            if (typeof t.style[props[i]] == "undefined") continue;
            this.supportCSSAnim     = props[i];
            this.supportCSSTransition = props2[i];
            this.runtimeStylePrefix = prefixR[i];
            this.classNamePrefix    = prefixC[i];
            this.cssAnimEvent       = events[i];
        }
        t = null;
        delete t;

        this.supportVML                = ppc.isIE;
        this.supportSVG                = !ppc.isIE || ppc.isIE > 8;
        this.supportCanvas             = !!document.createElement("canvas").getContext;
        this.supportCanvasText         = !!(this.supportCanvas
            && typeof document.createElement("canvas").getContext("2d").fillText == "function")

        this.hasVideo                  = !!document.createElement("video")["canPlayType"];
        this.hasAudio                  = !!document.createElement("audio")["canPlayType"];
        this.supportHashChange         = ("onhashchange" in self) && (!ppc.isIE || ppc.isIE >= 8);

        if (self.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
            this.hasXhrProgress = !!xhr.upload;
            if (this.hasXhrBinary = !!(xhr.sendAsBinary || xhr.upload)) {
                this.hasHtml5File      = !!(File && File.prototype.getAsDataURL);
                this.hasHtml5FileSlice = !!(File && File.prototype.slice);
            }
        }
        else {
            this.hasXhrProgress = this.hasXhrBinary = this.hasHtml5File 
                = this.hasHtml5FileSlice = false;
        }

        this.windowHorBorder           = 
        this.windowVerBorder           = ppc.isIE8 && (!self.frameElement 
            || parseInt(self.frameElement.frameBorder)) ? 4 : 0;
        
        //#ifdef __WITH_HTML5_TEST
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
        //#endif

        this.enableAnim   = !ppc.isIE || ppc.isIE > 8;
        this.animSteps    = ppc.isIE ? 0.3 : 1;
        this.animInterval = ppc.isIE ? 7 : 1;

        this.CSSFLOAT    = ppc.isIE ? "styleFloat" : "cssFloat";
        this.CSSPREFIX   = ppc.isGecko ? "Moz" : (ppc.isWebkit ? "webkit" : "");
        this.CSSPREFIX2  = ppc.isGecko ? "-moz" : (ppc.isWebkit ? "-webkit" : "");
        this.INLINE      = ppc.isIE && ppc.isIE < 8 ? "inline" : "inline-block";
        this.needZoomForLayout = ppc.isIE && ppc.isIE < 8;

        //Other settings
        this.maxHttpRetries = ppc.isOpera ? 0 : 3;

        //#ifdef __WITH_ANCHORING
        this.percentageMatch = new RegExp();
        this.percentageMatch.compile("([\\-\\d\\.]+)\\%", "g");
        //#endif
        
        this.reMatchXpath = new RegExp();
        this.reMatchXpath.compile("(^|\\|)(?!\\@|[\\w-]+::)", "g");

        //#ifdef __SUPPORT_GEARS
        ppc.isGears      = !!ppc.initGears() || 0;
        //#endif
    },

    hasGeoLocation: function() {
        //#ifdef __WITH_GEOLOCATION
        return typeof ppc.geolocation != "undefined" && ppc.geolocation.init();
        /*#else
        return false;
        #endif*/
    },

    //#ifdef __DEBUG
    /**
     * Restarts the application.
     */
    reboot : function(){
        ppc.console.info("Restarting application...");
    
        location.href = location.href;
    },
    //#endif

    /**
     * Extends an object with one or more other objects by copying all of its
     * properties.
     * @param {Object} dest The destination object
     * @param {Object} src The object that is copied from
     * @return {Object} The destination object
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
     * 
     * #### Example
     * 
     * ```javascript
     *  var content = ppc.ajax("http://www.ajax.org", {
     *      method   : "POST",
     *      data     : "<data />",
     *      async    : false,
     *      callback : function( data, state ) {
     *          if (state == ppc.SUCCESS)
     *              alert("Success");
     *          else
     *              alert("Failure")
     *      }
     *  });
     *  alert(content);
     * ```
     *
     * @param {String}   url       The url that is accessed.
     * @param {Object}   options   The options for the HTTP request. It has the following properties:
     *   - async ([[Boolean]]): Whether the request is sent asynchronously. Defaults to true.
     *   - userdata (`Mixed`): Custom data that is available to the callback function.
     *   - method ([[String]]): The request method (`POST`|`GET`|`PUT`|`DELETE`). Defaults to `GET`.
     *   - nocache ([[Boolean]]): Specifies whether browser caching is prevented.
     *   - data ([[String]]): The data sent in the body of the message.
     *   - useXML ([[Boolean]]): Specifies whether the result should be interpreted as xml.
     *   - autoroute ([[Boolean]]): Specifies whether the request can fallback to a server proxy.
     *   - caching ([[Boolean]]): Specifies whether the request should use internal caching.
     *   - ignoreOffline ([[Boolean]]): Specifies whether to ignore offline catching.
     *   - contentType ([[String]]): The MIME type of the message
     *   - callback ([[Function]]): The handler that gets called whenever the
     *                            request completes succesfully, with an error, or times out.
     */
    ajax : (function(){
        var f = function(){
            return this.oHttp.get.apply(this.oHttp, arguments);
        };
        
        f.exec = function(method, args, callback, options){
            if (method == "ajax" && args[0]) {
                var opt = args[1] || {};
                return this.oHttp.exec(opt.method || "GET", [args[0]], 
                    opt.callback, ppc.extend(options || {}, opt));
            }
        };

        return f;
    })(),
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
        ppc.console.info("Starting Pylon Platform Code Application...");
        ppc.console.warn("Debug build of Pylon Platform " + (ppc.VERSION ? "version " + ppc.VERSION : ""));
        //#endif

        //mozilla root detection
        //try{ISROOT = !window.opener || !window.opener.ppc}catch(e){ISROOT = true}

        //Browser Specific Stuff
        //this.browserDetect();
        this.setCompatFlags();

        if (ppc.onstart && ppc.onstart() === false)
            return false;

        //#ifdef __WITH_DEBUG_WIN
        ppc.$debugwin.start();
        //#endif

        //Load Browser Specific Code
        // #ifdef __SUPPORT_IE
        if (this.isIE) ppc.runIE();
            //this.importClass(ppc.runIE, true, self);
        // #endif
        // #ifdef __SUPPORT_WEBKIT
        if (ppc.isWebkit) ppc.runWebkit();
            //this.importClass(ppc.runSafari, true, self);
        // #endif
        // #ifdef __SUPPORT_OPERA
        if (this.isOpera) ppc.runOpera();
            //this.importClass(ppc.runOpera, true, self);
        // #endif
        // #ifdef __SUPPORT_GECKO
        if (this.isGecko || !this.isIE && !ppc.isWebkit && !this.isOpera)
            ppc.runGecko();
            //this.importClass(ppc.runGecko, true, self);
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
        this.Init.addConditional(this.parseAppMarkup, ppc, ["body"]);
        //@todo, as an experiment I removed 'HTTP' and 'Teleport'
        // #endif

        //IE fix
        try {
            if (ppc.isIE)
                document.execCommand("BackgroundImageCache", false, true);
        }
        catch(e) {}

        //#ifdef __WITH_WINDOW
        //ppc.window.init();
        //#endif

        this.started = true;
        
        // #ifndef __SUPPORT_GWT
        // DOMReady already fired, so plz continue the loading and parsing
        if (this.load_done)
            this.execDeferred();
        // #endif

        //try{ppc.root = !window.opener || !window.opener.ppc;}
        //catch(e){ppc.root = false}
        this.root = true;
        
        /* #ifdef __PACKAGED
        for (var i = 0; i < ppc.$required.length; i++) {
            ppc.include(ppc.$required[i]);
        }
        ppc.require = ppc.include;
        #endif*/
        
        /*#ifdef __SUPPORT_GWT
        // Load user defined includes
        //this.parseAppMarkup();
        
        //GWT
        ppc.initialize("<html xmlns:a='" + ppc.ns.aml + "' xmlns='" + ppc.ns.xhtml + "'><head /><body /></html>");
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
                    return docEl.attributes[i][ppc.TAGNAME]
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
            throw new Error(ppc.formatErrorString(1018, null,
                "importing class",
                "Could not load reference. Reference is null"));

        if (!strip)
            return ppc.jsexec(ref.toString(), win);

        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "")
                              .replace(/\}\s*$/, "");

        return ppc.jsexec(q, win);
    },

    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    */
    toString : function(){
        return "[Pylon Platform Code (ppc)]";
    },

    all : [],

    /**
    * This method implements all the properties and methods to this object from another class
    * @param {Function}    classRef    The class reference to implement
    * @private
    */
    implement : function(classRef) {
        // for speed, we check for the most common  case first
        if (arguments.length == 1) {
            //#ifdef __DEBUG
            if (!classRef) {
                throw new Error(ppc.formatErrorString(0, this,
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
                    throw new Error(ppc.formatErrorString(0, this,
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
     * Adds a unique id attribute to an HTML element.
     * @param {HTMLElement} oHtml the object getting the attribute.
     */
    setUniqueHtmlId : function(oHtml){
        var id;
        oHtml.setAttribute("id", id = "q" + this.uniqueHtmlIds++);
        return id;
    },

    /**
     * Retrieves a new unique id
     * @returns {Number} A number representing the new ID.
     */
    getUniqueId : function(){
        return this.uniqueHtmlIds++;
    },

    /**
     * Finds an AML element based on its unique id.
     * @param {Number} uniqueId The unique id to search on.
     * @returns {ppc.AmlElement} The returned element.
     */
    lookup : function(uniqueId){
        return this.all[uniqueId];
    },

    /**
     * Searches in the HTML tree from a certain point to find the
     * AML element that is responsible for rendering a specific html
     * element.
     * @param {HTMLElement} oHtml The html context to start the search from.
     * @returns {ppc.AmlElement} The parent HTML element
     */
    findHost : function(o){
        while (o && o.parentNode) { //!o.host && 
            try {
                if ((o.host || o.host === false) && typeof o.host != "string")
                    return o.host;
            }
            catch(e){}
            
            o = o.parentNode;
        }
        
        return null;
    },

    /**
     * Sets a reference to an object (by name) in the global JavaScript space.
     * @param {String} name The name of the reference.
     * @param {Mixed}  o    The reference to the object subject to the reference.
     */
    setReference : function(name, o){
        return self[name] && self[name].hasFeature
            ? 0
            : (self[name] = o);
    },

    /*
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
                messages : {}
            },
        
            log   : {
                messages : {}
            },
            
            custom   : {
                messages : {}
            },

            warn  : {
                messages : {}
            },

            error : {
                messages : {}
            },
            
            repeat : {
                messages : {}
            }
        },

        /**
         * @private
         */
        toggle : function(node, id){
            var sPath = ppc.$debugwin ? ppc.$debugwin.resPath : ppc.basePath + "core/debug/resources/";
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
        history : [],
        typeLut : {time: "log", repeat: "log"},
        $lastmsg : "",
        $lastmsgcount : 0,

        $detectSameMessage : function(){
            ppc.console.$lastmsg = "";
            if (ppc.console.$lastmsgcount) {
                var msg = ppc.console.$lastmsgcount + " times the same message";
                ppc.console.$lastmsgcount = 0;
                ppc.console.write(msg, "repeat");
                clearTimeout(ppc.console.$timer);
            }
        },
        
        teleportList : [],
        teleport : function(log){
            if (this.teleportModel)
                log.setXml(this.teleportModel.data);
            
            this.teleportList.push(log);
        },
        setTeleportModel : function(mdl){
            if (this.teleportModel == mdl)
                return;
            
            this.teleportModel = mdl;
            var xml = ppc.getXml("<teleport />");
            for (var i = 0; i < this.teleportList.length; i++) {
                this.teleportList[i].setXml(xml);
            }
            
            mdl.load(xml);
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
            
            //if (!ppc.debug) return;
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

            msg = (!nodate ? "<span class='console_date'>[" + date + "]</span> " : "")
                    + String(msg)
                        .replace(/(<[^>]+>)| /g, function(m, tag, sp){
                            if (tag) return tag;
                            return "&nbsp;";
                        })
                        //.replace(/\n/g, "\n<br />")
                        .replace(/\t/g,"&nbsp;&nbsp;&nbsp;");
            var sPath = ppc.$debugwin && ppc.$debugwin.resPath
                ? ppc.$debugwin.resPath
                : ppc.basePath + "core/debug/resources/";

            if (data) {
                msg += "<blockquote style='margin:2px 0 0 0;"
                    +  "background:url(" + sPath + "splus.gif) no-repeat 2px 3px'>"
                    +  "<strong style='width:120px;cursor:default;display:block;padding:0 0 0 17px' "
                    +  "onmousedown='(self.ppc || window.opener.ppc).console.toggle(this.nextSibling, "
                    +  (this.cache.push(data) - 1) + ")'>"
                    +  "</strong><div style='display:none;background-color:#EEEEEE;"
                    +  "padding:3px 3px 20px 3px;overflow:auto;max-height:200px'>"
                    +  "</div></blockquote>";
            }

            msg = "<div class='console_line console_" 
                + type + "' >" + msg + "</div>"; //\n<br style='line-height:0'/>

            //deprecated
            if (!subtype)
                subtype = "default";

            this.history.push([this.typeLut[type] || type, msg]);

            if (this.win && !this.win.closed)
                this.showWindow(msg);

            //if (ppc.debugFilter.match(new RegExp("!" + subtype + "(\||$)", "i")))
            //    return;

            this.debugInfo.push(msg);

            if (self.console && (!document.all || ppc.config.debug)) {
                console[type == "warn" ? "warn" : 
                    (type == "error" ? "error" : "log")]
                        (ppc.html_entity_decode(msg.replace(/<[^>]*>/g, "")));
            }

            if (ppc.dispatchEvent)
                ppc.dispatchEvent("debug", {message: msg, type: type});
        },
        
        clear : function(){
            this.history = [];
        },
        
        getAll : function(err, wrn, log) {
            var hash = {"error": err, "warn": wrn, "log": log, "custom": 1};
            var out = [];
            for (var i = 0, l = this.history.length; i < l; i++) {
                if (hash[this.history[i][0]])
                    out.push(this.history[i][1]);
            }
            return out.join("");
        },
        //#endif

        /**
         * Writes a message to the console.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        debug : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "time", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the time icon next to it.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        time : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "time", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        log : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(ppc.htmlentities(msg).replace(/\n/g, "<br />"), "log", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "info" icon and color
         * coding.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        info : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.log(ppc.htmlentities(msg).replace(/\n/g, "<br />"), subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "warning" icon and
         * color coding.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        warn : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(ppc.htmlentities(msg).replace(/\n/g, "<br />"), "warn", subtype, data);
            //#endif
        },

        /**
         * Writes a message to the console with the visual "error" icon and
         * color coding.
         * @param {String} msg      The message to display in the console.
         * @param {String} subtype  The category for this message. This is used for filtering the messages.
         * @param {String} data     Extra data that might help in debugging.
         */
        error : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg.replace(/\n/g, "<br />"), "error", subtype, data);
            //#endif
        },

        /**
         * Prints a listing of all properties of the object.
         * @param {Mixed} obj The object whose properties you want displayed.
         */
        dir : function(obj){
            var s = ppc.$debugwin.$serializeObject(obj, "Inspected via ppc.console.dir");
            if (typeof s == "string") {
                this.write(s, "custom", null, null, null, true);
            }
            else {
                this.write(obj
                    ? "Could not serialize object: " + s.message
                    : obj, "error", null, null, null, true);
            }
            
            //this.info(ppc.vardump(obj, null, false).replace(/ /g, "&nbsp;").replace(/</g, "&lt;"));
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
                    .replace(/\{imgpath\}/g, ppc.debugwin
                        ? ppc.debugwin.resPath
                        : ppc.basePath + "core/debug/resources/"));
            }
        }
        
        //#endif
    },

    html_entity_decode : function(s){return s},
    htmlentities : function(s){return s},

    /**
     * Formats an Pylon Platform Code error message.
     * @param {Number}      number      The number of the error. This can be used to look up more information about the error.
     * @param {ppc.AmlElement}  control     The aml element that will throw the error.
     * @param {String}      process     The action that was being executed.
     * @param {String}      message     The actual error message.
     * @param {XMLElement}  amlContext  The XML relevant to the error. For instance, this could be a piece of Ajax.org Markup Language XML.
     */
    formatErrorString : function(number, control, process, message, amlContext, outputname, output){
        //#ifdef __DEBUG
        var str = [];
        if (amlContext && amlContext.ownerDocument) {
            if (amlContext.nodeType == 9)
                amlContext = amlContext.documentElement;

            //Determine file context
            if (amlContext.ownerDocument.documentElement) {
                var file = amlContext.ownerDocument.documentElement.getAttribute("filename");
                if (!file && amlContext.ownerDocument.documentElement.tagName == "html")
                    file = location.href;
                file = file
                    ? ppc.removePathContext(ppc.hostPath, file)
                    : "Unkown filename";
            }
            else file = "Unknown filename";

            //Get serialized version of context
            if (ppc.$debugwin)
                var amlStr = ppc.$debugwin.$serializeObject(amlContext);
            else
                var amlStr = (amlContext.outerHTML || amlContext.xml || amlContext.serialize())
                    .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/ajax.org\/2005\/aml" \/\>/g, "")
                    .replace(/xmlns:a="[^"]*"\s*/g, "");

            //Determine line number
            var diff, linenr = 0, w = amlContext.previousSibling
                || amlContext.parentNode && amlContext.parentNode.previousSibling;
            while (w && w[ppc.TAGNAME] != "body") {
                diff    = (w.outerHTML || w.xml || w.serialize()).split("\n").length;
                linenr += diff - 1;
                w       = w.previousSibling || w.parentNode && w.parentNode.previousSibling;
            }
            if (w && w[ppc.TAGNAME] != "body")
                linenr = "unknown";
            else if(amlContext.ownerDocument 
              && amlContext.ownerDocument.documentElement.tagName == "html")
                linenr += ppc.lineBodyStart;
        
            //Grmbl line numbers are wrong when \n's in attribute space

            //Set file and line number
            str.push("aml file: [line: " + linenr + "] " + file);
        }

        if (control)
            str.push("Element: "
              + (ppc.$debugwin && !ppc.isDebugWindow
                ? ppc.$debugwin.$serializeObject(control)
                : "'" + (control.name
                    || (control.$aml ? control.getAttribute("id") : null)
                    || "{Anonymous}")
                    + "' [" + control.tagName + "]"));
        if (process)
            str.push("Process: " + process.replace(/ +/g, " "));
        if (message)
            str.push("Message: [" + number + "] " + message.replace(/ +/g, " "));
        if (outputname)
            str.push(outputname + ": " + output);
        if (amlContext && amlStr)
            str.push("Related Markup: " + amlStr);

        return (ppc.lastErrorMessage = str.join("\n"));
        /*#else
        ppc.lastErrorMessage = message;
        return message;
        #endif */
    },

    /* Init */

    /**
     * Returns the directory portion of a URL.
     * @param {String} url The URL to retrieve from
     * @returns {String} The directory portion of a URL
     */
    getDirname : function(url){
        //(?:\w+\:\/\/)?
        return ((url || "").match(/^([^#]*\/)[^\/]*(?:$|\#)/) || {})[1]; //Mike will check out how to optimize this line
    },
    
    /**
     * Returns the file portion of a URL.
     * @param {String} url The URL to retrieve from.
     * @return {String} The file portion of a URL.
     */
    getFilename : function(url){
        return ((url || "").split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
    },
    
    /**
     * Returns an absolute url based on url.
     * @param {String} base The start of the URL where relative URLs work.
     * @param {String} url  The URL to transform.
     * @return {String} The absolute URL.
     */
    getAbsolutePath : function(base, url){
        return url && url.charAt(0) == "/"
            ? url
            : (!url || !base || url.match(/^\w+\:\/\//) ? url : base.replace(/\/$/, "") + "/" + url.replace(/^\//, ""));
    },
    
    getCtrlKey : function(event){
        return ppc.isMac ? event.metaKey : event.ctrlKey;
    },

    /**
     * Loads Javascript from a specific URL.
     * 
     * @param {String}    sourceFile The URL where the JavaScript is located.
     * @param {Boolean}   [doBase]   Checks for a base path via [[ppc.getAbsolutePath]]
     * @param {String}    [type]     Sets the type of a script tag, for later use
     * @param {String}    [text]     
     * @param {Function}  [callback] Calls this function after the script is loaded
     * @returns {String} The constructed script tag    
     */
    include : function(sourceFile, doBase, type, text, callback){
        //#ifdef __DEBUG
        if (ppc.started)
            ppc.console.info("including js file: " + sourceFile);
        //#endif
        
        var sSrc = doBase ? ppc.getAbsolutePath(ppc.basePath || "", sourceFile) : sourceFile;
        var head     = document.getElementsByTagName("head")[0],//$("head")[0]
            elScript = document.createElement("script");
        //elScript.defer = true;
        if (type)
            elScript.setAttribute("_ppc_type", type);
        if (text) {
            if (ppc.isIE)
                window.execScript(text);
            else
                elScript.text = text;
        }
        else 
            elScript.src   = sSrc;
        head.appendChild(elScript);

        if (callback)
            elScript[ppc.isIE ? "onreadystatechange" : "onload"] = callback;
        
        return elScript;
    },
    
    $required : [],
    require : function(){
        var dir = ppc.getDirname(location.href),
            i   = 0,
            l   = arguments.length;
        for (; i < l; i++)
            this.$required.push(ppc.getAbsolutePath(dir, arguments[i]));
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
     * Determines the way ppc tries to render this application. Set this value
     * before ppc is starts parsing.
     *   
     * Possible values include:
     *   - 0    Auto (The default)
     *   - 1    Partial
     *   - 11   Partial from a comment
     *   - 2    Full from serialized document or file fallback
     *   - 21   Full from file
     * @type {Number}
     */
    parseStrategy : 0,

    //#ifdef __WITH_PARTIAL_AML_LOADING
    /**
     * @private
     */
    parsePartialAml : function(docElement){
        //#ifdef __DEBUG
        ppc.console.warn("The aml namespace definition wasn't found "
                       + "on the root node of this document. We're assuming "
                       + "you want to load a partial piece of aml embedded "
                       + "in this document. Starting to search for it now.");
        //#endif

        var findAml;
        if (ppc.isIE) {
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
                    throw new Error(ppc.formatErrorString(0, null,
                        "Parsing inline aml (without xmlns on root node)",
                        "Could not parse inline aml. This happens when the html"
                      + "is mangled too much by Internet Explorer. Either you "
                      + "are using a cdata section or javascript containing "
                      + "symbols that throw off the browser. Please put this aml "
                      + "in a seperate file and load it using an include element."));
                    //#endif
                    
                    return;
                }

                var xmlNode = ppc.getAmlDocFromString("<div jid='"
                            + (id++) + "' " + strXmlns + ">"
                            + strXml + "</div>").documentElement;

                while (xmlNode.childNodes.length > 1)
                    xmlNode.removeChild(xmlNode.lastChild);

                ppc.AppNode.appendChild(xmlNode);
            }
        }
        else {
            findAml = function(htmlNode){
                var strXml  = htmlNode.outerHTML.replace(/ _moz-userdefined=""/g, ""),
                    xmlNode = ppc.getAmlDocFromString("<div jid='"
                            + (id++) + "' " + strXmlns + ">"
                            + strXml + "</div>").documentElement;

                while (xmlNode.childNodes.length > 1)
                    xmlNode.removeChild(xmlNode.lastChild);

                if (ppc.isWebkit)
                    xmlNode = ppc.AppNode.ownerDocument.importNode(xmlNode, true);

                ppc.AppNode.appendChild(xmlNode);
            }
        }

        var match = document.body.outerHTML
                    .match(/(\w+)\s*=\s*["']http:\/\/ajax\.org\/2005\/aml["']/);
        if (!match)
            return false;

        var strXmlns = "xmlns:" + match[0],
            prefix = (RegExp.$1 || "").toUpperCase();
        if (ppc.isOpera)
            prefix = prefix.toLowerCase();
        if (!prefix)
            return false;

        prefix += ":";

        ppc.AppNode = ppc.getAmlDocFromString("<" + prefix.toLowerCase()
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

                if (ppc.isIE) {
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

                if (ppc.amlParts.length
                  && ppc.amlParts[ppc.amlParts.length-1][1] == cnode)
                    ppc.amlParts[ppc.amlParts.length-1][1] = -1;

                ppc.amlParts.push([node.parentNode, ppc.isIE
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
                    var xmlNode = ppc.getAmlDocFromString("<div jid='"
                        + (id++) + "' " + strXmlns + ">"
                        + strXml + "</div>").documentElement;

                    if (ppc.isWebkit)
                        xmlNode = ppc.AppNode.ownerDocument.importNode(xmlNode, true);

                    ppc.AppNode.appendChild(xmlNode);

                    ppc.amlParts.push([node.parentNode, node.nextSibling]);
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
        
        if (document.documentElement.getAttribute("skipParse") == "true") {
            return;
        }
        
        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (this.parseStrategy == 1 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(ppc.ns.aml) == -1) {
            this.parsePartialAml(docElement);

            if (this.parseStrategy == 1 || ppc.amlParts.length) {
                //#ifdef __DEBUG
                if (ppc.amlParts.length)
                    ppc.console.warn("Aml found, parsing...");
                //#endif

                ppc.isParsingPartial = true;

                ppc.loadAmlIncludes(ppc.AppNode);

                if (!self.ERROR_HAS_OCCURRED) {
                    ppc.initialize();
                }

                return;
            }
            else {
                //#ifdef __DEBUG
                ppc.console.warn("No aml found.");
                //#endif
                isEmptyDocument = true;
            }
        }
        //#endif

        //#ifdef __WITH_PARTIAL_AML_LOADING_FROM_COMMENT
        //@todo this strategy needs some updating
        if (this.parseStrategy == 11 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(ppc.ns.aml) == -1) {
            //#ifdef __DEBUG
            ppc.console.warn("The aml namespace definition wasn't found "
                           + "on the root node of this document. We're assuming "
                           + "you want to load a partial piece of aml embedded "
                           + "in this document. Starting to search for it now.");
            //#endif

            //Walk tree
            var str, x, node = document.body;
            while (node) {
                if (node.nodeType == 8) {
                    str = node.nodeValue;
                    if  (str.indexOf("[ppc]") == 0) {
                        str = str.substr(5);

                        //#ifdef __DEBUG
                        ppc.console.info("Found a piece of aml. Assuming "
                                       + "namespace prefix 'a'. Starting "
                                       + "parsing now.");
                        //#endif

                        x = ppc.getXml("<a:applicaton xmlns:a='"
                            + ppc.ns.aml + "'>" + str + "</a:applicaton>", true);

                        if (ppc.isIE) { //@todo generalize this
                            x.ownerDocument.setProperty("SelectionNamespaces",
                                "xmlns:a='" + ppc.ns.aml + "'");
                        }

                        ppc.loadAmlIncludes(x);
                        ppc.amlParts.push([x, node]);
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
              && (ppc.amlParts.length || this.parseStrategy == 11)) {
                ppc.isParsingPartial = true;

                ppc.initialize();

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
            if (ppc.isIE) {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<SCRIPT.*SCRIPT>(?:[\r\n]+)?/g, "")
                    .replace(/^<HTM./, "<a:application")//xmlns:a='" + ppc.ns.aml + "'
                    .replace(/HTML>$/, "a:application>")
                    .replace(/(\w+)\s*=\s*([^"'\s]+)\s/g, "$1=\"$2\" ");
            }
            else {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<script.*\/>/g, "") //@todo for debug only
                    .replace(/ _moz-userdefined=""/g, "")
                    .replace(/^<HTM./, "<a:application xmlns='" + ppc.ns.xhtml + "'")
                    .replace(/HTML>$/, "a:application>")
            }

            try {
                docElement = ppc.getAmlDocFromString(xmlStr);

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
            //else if (ppc.isIE)
            //    ppc.TAGNAME = "tagName";
            
            isEmptyDocument = true;
        }
        //#endif

        //#ifdef  __WITH_PARSE_DOC_BY_RELOADING
        if (isEmptyDocument && document.documentElement.outerHTML
          .split(">", 1)[0]
          .indexOf(ppc.ns.aml) == -1) {
            //#ifdef __DEBUG
            ppc.console.warn("The aml namespace declaration wasn't found. "
                           + "No aml elements were found in the body. Exiting");
            //#endif
            return false;
        }

        //Load current HTML document as 'second DOM'
        if (this.parseStrategy == 21 || !this.parseStrategy && !docElement) {
            return ppc.oHttp.get((ppc.alternativeAml 
              || document.body && document.body.getAttribute("xmlurl") 
              || location.href).split(/#/)[0], {
                //#ifdef __DEBUG
                type : "markup",
                //#endif
                callback: function(xmlString, state, extra){
                    if (state != ppc.SUCCESS) {
                        var oError = new Error(ppc.formatErrorString(0, null,
                            "Loading XML application data", "Could not load "
                          + "XML from remote source: " + extra.message));

                        if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                            return true;

                        throw oError;
                    }

                    //#ifdef __DEBUG
                    ppc.lineBodyStart = (xmlString.replace(/\n/g, "\\n")
                        .match(/(.*)<body/) || [""])[0].split("\\n").length;
                    //#endif
        
                    //@todo ppc3.0 rewrite this flow
                    var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "")
                      .replace(/^[\r\n\s]*/, ""); //.replace(/&nbsp;/g, " ") //should be html2xmlentity conversion
                    if (!ppc.supportNamespaces)
                        str = str.replace(/xmlns\=\"[^"]*\"/g, "");
                    //var xmlNode = ppc.getXmlDom(str);//ppc.getAmlDocFromString(xmlString);

                    if (self.ERROR_HAS_OCCURRED)
                        return;
        
                    //Clear Body
                    if (ppc.isIE)
                        document.body.innerHTML ="";
                    else {
                        var nodes = document.body.childNodes;
                        for (var i = nodes.length - 1; i >= 0; i--)
                            nodes[i].parentNode.removeChild(nodes[i]);
                    }

                    // #ifndef __SUPPORT_GWT
                    document.documentElement.style.display = "block";
                    document.body.style.display = "block"; //might wanna make this variable based on layout loading...
                    // #endif
        
                    ppc.initialize(str);

                }, ignoreOffline: true});
        }
        else {
            // #ifndef __SUPPORT_GWT
            //might wanna make this variable based on layout loading...
            document.body.style.display = "block";
            // #endif
        
            if (!self.ERROR_HAS_OCCURRED)
                ppc.initialize(docElement.outerHTML || docElement.xml);
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
        if (ppc.initialized) return;
        ppc.initialized = true;
        // #endif
        
        /*#ifdef __SUPPORT_GWT
        document.body.style.display = "block"; //might wanna make this variable based on layout loading...
        #endif*/

        ppc.console.info("Initializing...");
        clearInterval(ppc.Init.interval);

        // Run Init
        ppc.Init.run(); //Process load dependencies
        
        //#ifdef __WITH_DEFAULT_SKIN
        ppc.skins.defaultSkin = '<?xml version="1.0" encoding="utf-8"?>'
            + '<a:skin xmlns:a="https://github.com/pylonide/pylon" xmlns="http://www.w3.org/1999/xhtml">'
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
            + '.cbcontainer br{display: none;}]]></a:style><a:style condition="!ppc.isIE">'
            + '<![CDATA[.cbcontainer br{line-height: 0;display: block;}]]></a:style>'
            + '<a:presentation><a:main label="span/text()"><div class="cbcontainer"><div class="checkbox"> </div>'
            + '<span>-</span><br clear="left" /></div></a:main>'
            + '</a:presentation></a:checkbox>'
            + '<a:bar name="bar"><a:style><![CDATA[#jem.ppc_bar {position: relative;color: #4b4b4b;font-family: Tahoma;'
            + 'font-size: 10px;padding: 10px;border: 1px solid #f3f3f3;cursor: default;margin: 0;'
            + 'background: white url(images/resizehandle.gif) no-repeat right bottom;z-index: 10000;}'
            + '#jem.ppc_bar img {position: absolute;bottom: 13px;left: 216px;}#jem.ppc_bar .ppc_counter {'
            + 'position: absolute;bottom: 5px;left: 40px;}#jem.ppc_bar .ppc_countdown {position: absolute;'
            + 'bottom: 5px;right: 142px;}#jem.ppc_bar .ppc_volume {position: absolute;'
            + 'bottom: 5px;right: 119px;left: auto;background: none;width: 16px;height: 16px;'
            + 'margin: 0;padding: 0;cursor: pointer;cursor: hand;}#jem.ppc_bar .ppc_volume span {'
            + 'margin: 0;padding: 0;width: 16px;height: 16px;}#jem.ppc_bar .ppc_fullscreen {'
            + 'position: absolute;bottom: 2px;right: 28px;left: auto;width: 14px;background: transparent;'
            + 'cursor: pointer;cursor: hand;}#jem.ppc_bar .ppc_fullscreen span {height:14px;width:14px;'
            + 'margin:3px auto 0 0;}]]></a:style><a:presentation><a:main container="." resize-corner="17">'
            + '<div class="ppc_bar" id="jem"> </div></a:main></a:presentation></a:bar>'
            + '<a:label name="label"><a:style><![CDATA[#jem .ppc_label{font-size: 8pt;font-family: Tahoma;'
            + 'overflow: hidden;cursor: default;line-height : 1.5em;margin : 0;}#jem .ppc_labelDisabled{'
            + 'color: #bebebe;}#jem .tiny {font-size : 9px;}#jem .error .ppc_label{background : url(images/alert.png) no-repeat 0 0;'
            + 'min-height : 37px;padding : 3px 0 0 45px;}]]></a:style><a:presentation>'
            + '<a:main caption="." for="@for"><div class="ppc_label"> </div></a:main></a:presentation></a:label>'
            + '<a:slider name="slider"><a:style><![CDATA[#jem .ppc_slider {background: url("images/bar_right.png") no-repeat top right;'
            + 'height: 8px;position: relative;font-family: Tahoma;font-size: 9px;text-align: center;'
            + 'position: absolute;bottom: 9px;right: 53px;margin: 0;}#jem .ppc_sliderDisabled {'
            + 'background-position: right -8px;}#jem .ppc_slider .ppc_left {background: url("images/bar_left.png") no-repeat top left;'
            + 'height: 8px;overflow: hidden;margin: 0;margin-right: 4px;}#jem .ppc_sliderDisabled .ppc_left {'
            + 'background-position: left -8px;}#jem .ppc_sliderDisabled .ppc_filledbar {background-position: 0 -8px;}'
            + '#jem .ppc_slider .ppc_grabber {background: url("images/slider3.png") no-repeat top left;'
            + 'width: 12px;height: 8px;overflow: hidden;position: absolute;margin: 0;}#jem .ppc_sliderDisabled .ppc_grabber {'
            + 'background-position: left -8px;}]]></a:style><a:presentation>'
            + '<a:main slider="div[1]" container="." status2="div[2]/text()" markers="." direction="horizontal">'
            + '<div class="ppc_slider"><div class="ppc_grabber"> </div><div class="ppc_left"> </div></div></a:main>'
            + '<marker><u> </u></marker></a:presentation></a:slider>'
            + '<a:slider name="slider16"><a:style><![CDATA[#jem .ppc_slider16 {background: url("images/bar16x_right.png") no-repeat top right;'
            + 'width: 300px;height: 16px;position: relative;padding-right: 7px;font-family: Tahoma;font-size: 9px;'
            + 'text-align: center;position: absolute;bottom: 6px;left: 82px;margin: 0;}#jem .ppc_slider16Disabled {background-position: right -16px;}'
            + '#jem .ppc_slider16 .ppc_left {background: url("images/bar16x_left.png") no-repeat top left;'
            + 'height: 16px;overflow: hidden;margin: 0;}#jem .ppc_slider16Disabled .ppc_left {background-position: left -16px;}'
            + '#jem .ppc_slider16 .ppc_grabber {background: url("images/rslider16x.png") no-repeat top right;'
            + 'width: 20px;height: 16px;overflow: hidden;position: absolute;margin: 0;}#jem .ppc_slider16Disabled .ppc_grabber {'
            + 'background-position: left -16px;margin-left: 7px;cursor: normal;}#jem .ppc_slider16 .ppc_sldprogress {'
            + 'background: #ddd;display: block;overflow: hidden;height: 4px;margin-left: 6px;margin-top: 6px;z-index: 0;}]]>'
            + '</a:style><a:presentation><a:main slider="div[1]" container="." progress="div[2]" status2="div[2]/text()" markers="." '
            + 'direction="horizontal"><div class="ppc_slider16"><div class="ppc_grabber"> </div><div class="ppc_left"> </div></div></a:main>'
            + '<progress><span class="ppc_sldprogress"></span></progress><marker><u></u></marker>'
            + '</a:presentation></a:slider>'
            + '<a:button name="button"><a:style><![CDATA[#jem .ppc_button {color: #4b4b4b;font-family: Tahoma;'
            + 'font-size: 8pt;height: 21px;width: 34px;overflow: hidden;cursor: default;background: url(images/mediabtn2.png) no-repeat 0 -42px;'
            + 'position: absolute;bottom: 3px;left: 3px;margin: 0;}#jem .ppc_buttonOver {background-position: 0 -21px;}'
            + '#jem .ppc_buttonDisabled {background-position: 0 -42px;}#jem .ppc_buttonDown {background-position: 0 0px;}'
            + '#jem .ppc_button span {display: block;background: no-repeat 0 0;width: 11px;height: 10px;margin: 4px auto 0 11px;}]]>'
            + '</a:style><a:presentation><a:main background="span" icon="span"><div class="ppc_button"><span></span></div>'
            + '</a:main></a:presentation></a:button>'
            + '<a:video name="video"><a:style><![CDATA[#jem .ppc_video {line-height:300px;margin:0;'
            + 'padding:0;text-align:center;vertical-align:middle;overflow : hidden;background : black;}'
            + '#jem .ppc_video #qt_event_source{position : absolute;left : 0;top : 0;}]]></a:style>'
            + '<a:presentation><a:main container="."><div class="ppc_video"></div></a:main></a:presentation>'
            + '</a:video></a:skin>';
        if (false && !ppc.skins.skins["default"] && ppc.skins.defaultSkin) {
            //#ifdef __DEBUG
            ppc.console.warn("No skin definition found. Using default skin.");
            //#endif

            //var xmlString = ppc.skins.defaultSkin.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
            //var xmlNode = ppc.getAmlDocFromString(ppc.skins.defaultSkin).documentElement; //@todo should get preprocessed
            //@todo ppc3.0 rewrite this flow
            var str = ppc.skins.defaultSkin.replace(/\<\!DOCTYPE[^>]*>/, "")
              .replace(/&nbsp;/g, " ").replace(/^[\r\n\s]*/, "");
            if (!ppc.supportNamespaces)
                str = str.replace(/xmlns\=\"[^"]*\"/g, "");
            var xmlNode = ppc.getXml(str);//ppc.getAmlDocFromString(xmlString);
              
            xmlNode.setAttribute("media-path", ppc.CDN + ppc.VERSION + "/images/")
            xmlNode.setAttribute("icon-path", ppc.CDN + ppc.VERSION + "/icons/")
        
            ppc.skins.Init(xmlNode);
        }
        //#endif
        
        var bodyMarginTop = parseFloat(ppc.getStyle(document.body, "marginTop"));
        ppc.doesNotIncludeMarginInBodyOffset = (document.body.offsetTop !== bodyMarginTop);

        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (ppc.isParsingPartial) {
            ppc.config.setDefaults();
            ppc.hasSingleRszEvent = true;

            var pHtmlNode = document.body;
            var lastChild = pHtmlNode.lastChild;
            ppc.AmlParser.parseMoreAml(ppc.AppNode, pHtmlNode, null,
                true, false);

            var pNode, firstNode, next, info,
                lastBefore = null,
                loop       = pHtmlNode.lastChild;
            while (loop && lastChild != loop) {
                info = ppc.amlParts[loop.getAttribute("jid")];
                next = loop.previousSibling;
                if (info) {
                    pNode = info[0];
                    if ("P".indexOf(pNode.tagName) > -1) {
                        lastBefore = pNode.parentNode.insertBefore(
                            ppc.getNode(loop, [0]), pNode);
                    }
                    else {
                        firstNode = ppc.getNode(loop, [0]);
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
                            firstNode = ppc.getNode(loop, [0]);
                        }
                    }

                    loop.parentNode.removeChild(loop);
                }
                loop = next;
            }
        
            //#ifdef __WITH_LAYOUT
            $setTimeout("ppc.layout.forceResize();");
            // #endif
        }
        else
        //#endif
        {
            ppc.window.init(xmlStr);
        }
    },

    // #ifndef __SUPPORT_GWT
    /**
     * @private
     */
    execDeferred: function() {
        // execute each function in the stack in the order they were added
        var len = ppc.load_events.length;
        while (len--)
            (ppc.load_events.shift())();
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

        if (ppc.load_done)
            return func();

        // create event function stack
        //ppc.done = arguments.callee.done;
        if (!ppc.load_init) {
            ppc.load_init = function() {
                if (ppc.load_done) return;
                // kill the timer
                clearInterval(ppc.load_timer);
                ppc.load_timer = null;
                ppc.load_done  = true;
                if (ppc.started)
                    ppc.execDeferred();
            };
        }

        ppc.load_events.push(func);

        if (func && ppc.load_events.length == 1) {
            // Catch cases where addDomLoadEvent() is called after the browser
            // event has already occurred.
            var doc = document, UNDEF = "undefined";
            if ((typeof doc.readyState != UNDEF && doc.readyState == "complete")
              || (doc.getElementsByTagName("body")[0] || doc.body))
                return ppc.load_init();

            // for Mozilla/Opera9.
            // Mozilla, Opera (see further below for it) and webkit nightlies
            // currently support this event
            if (doc.addEventListener && !ppc.isOpera) {
                // We're using "window" and not "document" here, because it results
                // in a memory leak, especially in FF 1.5:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=241518
                // See also:
                // http://bitstructures.com/2007/11/javascript-method-callbacks
                // http://www-128.ibm.com/developerworks/web/library/wa-memleak/
                window.addEventListener("DOMContentLoaded", ppc.load_init, false);
            }
            // If IE is used and is not in a frame
            else if (ppc.isIE && window == top) {
                ppc.load_timer = setInterval(function() {
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
                    ppc.load_init();
                }, 10);
            }
            else if (ppc.isOpera) {
                doc.addEventListener("DOMContentLoaded", function() {
                    ppc.load_timer = setInterval(function() {
                        for (var i = 0, l = doc.styleSheets.length; i < l; i++) {
                            if (doc.styleSheets[i].disabled)
                                return;
                        }
                        // all is fine, so we can call the init!
                        ppc.load_init();
                    }, 10);
                }, false);
            }
            else if (ppc.isWebkit && !ppc.isIphone) {
                var aSheets = doc.getElementsByTagName("link"),
                    i       = aSheets.length,
                    iSheets;
                for (; i >= 0; i++) {
                    if (!aSheets[i] || aSheets[i].getAttribute("rel") != "stylesheet")
                        aSheets.splice(i, 0);
                }
                iSheets = aSheets.length;
                ppc.load_timer  = setInterval(function() {
                    if (/loaded|complete/.test(doc.readyState)
                      && doc.styleSheets.length == iSheets)
                        ppc.load_init(); // call the onload handler
                }, 10);
            }
            // for other browsers set the window.onload, but also execute the
            // old window.onload
            else {
                var old_onload = window.onload;
                window.onload  = function () {
                    ppc.load_init();
                    if (old_onload)
                        old_onload();
                };
            }
        }
    },
    // #endif
    
    fireEvent : function(el, type, e, capture){
        if (el.dispatchEvent)
            el.dispatchEvent(type, e, capture);
        else
            el.fireEvent("on" + type, e);
    },
    
    addListener : function(el, type, fn, capture){
        if (el.addEventListener)
            el.addEventListener(type, fn, capture || false);
        else if (el.attachEvent)
            el.attachEvent("on" + type, fn);
        return this;
    },
    
    removeListener : function(el, type, fn, capture){
        if (el.removeEventListener)
            el.removeEventListener(type, fn, capture || false);
        else if (el.detachEvent)
            el.detachEvent("on" + type, fn);
        return this;
    },

    stopEvent: function(e){
        this.stopPropagation(e).preventDefault(e);
        return false;
    },

    stopPropagation: function(e){
        if (e.stopPropagation)
            e.stopPropagation();
        else
            e.cancelBubble = true;
        return this;
    },

    preventDefault: function(e){
        if (e.preventDefault)
            e.preventDefault();
        else
            e.returnValue = false;
        return this;
    },

    /* Destroy */

    /**
     * Unloads the aml application.
     */
    unload : function(exclude){
        //#ifdef __DEBUG
        ppc.console.info("Initiating self destruct...");
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
            if (node && node != exclude && node.destroy && !node.ppc)
                node.destroy(false);
        }

        //this.dispatchEvent("DOMNodeRemovedFromDocument", {});//@todo ppc3.0
        
        for (i = 0, l = this.availHTTP.length; i < l; i++)
            this.availHTTP[i] = null;
        
        this.availHTTP.length = 0;

        //#ifdef __WITH_XMLDATABASE
        if (ppc.xmldb)
            ppc.xmldb.unbind(ppc.window);
        //#endif

        this.isDestroying = false;
    }
};

/*
 * Replacement for getElementsByTagNameNS because some browsers don't support
 * this call yet.
 */
var $xmlns = function(xmlNode, tag, xmlns, prefix){
    if (!ppc.supportNamespaces) {
        if (!prefix)
            prefix = ppc.findPrefix(xmlNode, xmlns);

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

ppc.setTimeout = function(f, t){
    ppc.$eventDepth++;
    return $setTimeout(function(){
        f();
        
        if (--ppc.$eventDepth == 0)
            ppc.queue.empty();
    }, t);
}

/*$setTimeout = function(f, ms){
    setTimeout(function(){
        console.log(f.toString());
        if (typeof f == "string") eval(f)
        else f();
    }, ms);
}*/

document.documentElement.className += " has_ppc";
document.body && (document.body.style.display = "none");

ppc.browserDetect();
ppc.Init.run("ppc");


//#ifdef !__PACKAGED || __WITH_DEBUG_WIN
ppc.getShortestPath = function(p1, p2) {
    if (p1.charAt(0) == "/")
        return p1;
    
    var s = p1.split("/");
    var l = p2.split("/"); l.pop();
    
    for (var i = 0; i < s.length; i++) {
        if (s[0] == "..") {
            l.pop();
            s.shift();
        }
        else break;
    }
    
    return l.join("/") + "/" + s.join("/");
}
if (!ppc.basePath) {
    var snodes = document.getElementsByTagName("script");
    for (var src, i = 0; i < snodes.length; i++) {
        src = snodes[i].getAttribute("src");
        if (src && src.match(/^(.*)ppc(?:_debug|_release)?\.js$/)) {
            ppc.basePath = RegExp.$1;
            break;
        }
    }

    ppc.basePath = ppc.basePath
      ? ppc.getShortestPath(ppc.basePath, ppc.getDirname(location.href))
      : "./";
}
//#endif

//#ifndef __PACKAGED
ppc.$loader = {
    queue : [[]],
    state : 0,
    parallel : !(ppc.isChrome && ppc.isMac || ppc.isIE && !location.host),
    ignorewait : ppc.isIE && !location.host,
    xhr : ppc.isWebkit && !ppc.isMac || ppc.isIE && location.host,
    
    setGlobalDefaults : function(options){
        this.basePath = options.BasePath;
        
        return this;
    },
    
    script : function(){
        if (this.parallel) {
            var item = this.queue[this.queue.length - 1];
    	    if (!item) {
        		item = this.wait();
        		item = this.queue[this.queue.length - 1];
    	    }
    	    
            for (var i = 0, l = arguments.length; i < l; i++) {
                item.push({src: arguments[i]});
            }
        }
        else {
            for (var i = 0, l = arguments.length; i < l; i++) {
                this.queue.push([{src: arguments[i]}]);
            }
        }
        
        if (!this.state || this.ignorewait)
            this.next();
        
        return this;
    },
    
    wait : function(f){
        var item = [];
        item.f = f;
        this.queue.push(item);
        
        return this;
    },
    
    include : function(oScr, item){
        if (this.basePath)
            oScr.src = ppc.getAbsolutePath(this.basePath, oScr.src);

        var _self = this;
        function done(){
            //#ifdef __DEBUG
            //console.log("Finished loading " + oScr.src);
            //#endif

            if (!item.downloaded)
                item.downloaded = 0;
            if (++item.downloaded != item.length)
                return;

            if (_self.xhr) {
                for (var i = 0, l = item.length; i < l; i++) {
                    ppc.include(null, null, null, item[i].text);
                }
            }

            if (item.f)
                item.f.call(self);
            _self.state = 0;
            _self.next();
        }
        
        if (this.xhr) {
            var xhr = (self.ActiveXObject ? new self.ActiveXObject("Microsoft.XMLHTTP") : new self.XMLHttpRequest());
    		xhr.onreadystatechange = function() {
    			if (xhr.readyState === 4) {
    				//xhr.onreadystatechange = null; // fix a memory leak in IE
    				oScr.text = xhr.responseText + "\r\n//@sourceURL=" + oScr.src;
  				    done();
    			}
    		}
    		xhr.open("GET", oScr.src);
    		xhr.send("");
    	}
    	else {
    	    var scr = ppc.include(oScr.src, null, null, null, done);
        }
    },
    
    next : function(){
        this.state = 1;
        
        var item = this.queue.shift();
        while (item && !item.length) {
            if (item.f)
                item.f.call(self);
            item = this.queue.shift();
        }
        
        if (item) {
            for (var i = 0, l = item.length; i < l; i++) {
                this.include(item[i], item);
            }
        }
	else
	    this.state = 0;
        
        if (!this.queue.length)
            this.wait();
    }
}

ppc.$loader.script(ppc.basePath + (self.loader2 ? "loader2.js" : "loader.js"));
//#endif
//#endif
