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

/**
 * Ajax.org Platform
 *
 * @author    Ruben Daniels ruben@javeline.com
 * @version   2.0
 * @url       http://www.ajax.org
 *
 * @event domready      Fires when the browsers' dom is ready to be manipulated.
 * @event movefocus         Fires when the focus moves from one element to another.
 *   object:
 *   {AMLElement} toElement the element that will receive the focus.
 * @event exit              Fires when the application wants to exit.
 *   cancellable:  Prevents the application from exiting. The returnValue of the
 *   event object is displayed in a popup which asks the user for permission.
 * @event keyup         Fires when the user stops pressing a key.
 *   cancellable: Prevents the behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event mousescroll   Fires when the user scrolls the mouse
 *   cancellable: Prevents the container to scroll
 *   object:
 *   {Number} delta the scroll impulse.
 * @event hotkey        Fires when the user presses a hotkey
 *   bubbles: yes
 *   cancellable: Prevents the default hotkey behaviour.
 *   object:
 *   {Number}  keyCode   the char code of the pressed key.
 *   {Boolean} ctrlKey   whether the ctrl key was pressed.
 *   {Boolean} shiftKey  whether the shift key was pressed.
 *   {Boolean} altKey    whether the alt key was pressed.
 *   {Object}  htmlEvent the html event object.
 * @event keydown       Fires when the user presses a key
 *   bubbles: yes
 *   cancellable: Prevents the behaviour.
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
 *   cancellable: Prevents the error from being thrown.
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

    //DOM nodeType constants
    /**
     * Constant for a dom element node.
     * @type {Number}
     */
    NODE_ELEMENT                : 1,
    /**
     * Constant for a dom attribute node.
     * @type {Number}
     */
    NODE_ATTRIBUTE              : 2,
    /**
     * Constant for a dom text node.
     * @type {Number}
     */
    NODE_TEXT                   : 3,
    /**
     * Constant for a dom cdata section node.
     * @type {Number}
     */
    NODE_CDATA_SECTION          : 4,
    /**
     * Constant for a dom entity reference node.
     * @type {Number}
     */
    NODE_ENTITY_REFERENCE       : 5,
    /**
     * Constant for a dom entity node.
     * @type {Number}
     */
    NODE_ENTITY                 : 6,
    /**
     * Constant for a dom processing instruction node.
     * @type {Number}
     */
    NODE_PROCESSING_INSTRUCTION : 7,
    /**
     * Constant for a dom comment node.
     * @type {Number}
     */
    NODE_COMMENT                : 8,
    /**
     * Constant for a dom document node.
     * @type {Number}
     */
    NODE_DOCUMENT               : 9,
    /**
     * Constant for a dom document type node.
     * @type {Number}
     */
    NODE_DOCUMENT_TYPE          : 10,
    /**
     * Constant for a dom document fragment node.
     * @type {Number}
     */
    NODE_DOCUMENT_FRAGMENT      : 11,
    /**
     * Constant for a dom notation node.
     * @type {Number}
     */
    NODE_NOTATION               : 12,

    /**
     * Constant for specifying that a widget is using only the keyboard to receive focus.
     * @type {Number}
     * @see baseclass.amlelement.method.focus
     */
    KEYBOARD       : 2,
    /**
     * Constant for specifying that a widget is using the keyboard or the mouse to receive focus.
     * @type {Boolean}
     * @see baseclass.amlelement.method.focus
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
    
    /**
     * Boolean specifying whether apf tries to load a skin from skins.xml when no skin element is specified.
     * @type {Boolean}
     */
    autoLoadSkin  : false,
    /**
     * Namespace for all crypto libraries included with Ajax.org Platform.
     */
    crypto        : {}, //namespace
    _GET          : {},
    
    /**
     * String specifying the basepath for loading apf from seperate files.
     * @type {String}
     */
    basePath      : "./",

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

    /**
     * @private
     */
    browserDetect : function(){
        if (this.$bdetect)
            return;
        this.$bdetect = true;

        var sAgent = navigator.userAgent.toLowerCase();

        //Browser Detection
        /**
         * Specifies whether the application is running in the Opera browser.
         * @type {Boolean}
         */
        this.isOpera = sAgent.indexOf("opera") != -1;
        
        /**
         * Specifies whether the application is running in the Konqueror browser.
         * @type {Boolean}
         */
        this.isKonqueror = sAgent.indexOf("konqueror") != -1;
        
        /**
         * Specifies whether the application is running in the Safari browser.
         * @type {Boolean}
         */
        this.isSafari    = !this.isOpera && ((navigator.vendor
            && navigator.vendor.match(/Apple/) ? true : false)
            || sAgent.indexOf("safari") != -1 || this.isKonqueror);
        
        /**
         * Specifies whether the application is running in the Safari browser version 2.4 or below.
         * @type {Boolean}
         */
        this.isSafariOld = false;

        if (this.isSafari) {
            var matches  = sAgent.match(/applewebkit\/(\d+)/);
            if (matches) {
                this.safariRev   = parseInt(matches[1])
                this.isSafariOld = parseInt(matches[1]) < 420;
            }
        }

        /**
         * Specifies whether the application is running on the Iphone.
         * @type {Boolean}
         */
        this.isIphone = sAgent.indexOf("iphone") != -1 || sAgent.indexOf("aspen simulator") != -1;

        /**
         * Specifies whether the application is running in the Chrome browser.
         * @type {Boolean}
         */
        this.isChrome    = sAgent.indexOf("chrome/") != -1;
        /**
         * Specifies whether the application is running in a Gecko based browser.
         * @type {Boolean}
         */
        this.isGecko     = !this.isOpera && !this.isSafari && sAgent.indexOf("gecko") != -1;
        /**
         * Specifies whether the application is running in the Firefox browser version 3.
         * @type {Boolean}
         */
        this.isGecko3     = this.isGecko && sAgent.indexOf("firefox/3") != -1;
        this.isGecko35    = this.isGecko && sAgent.indexOf("firefox/3.5") != -1;
        this.versionGecko = this.isGecko ? parseFloat(sAgent.match(/firefox\/([\d\.]+)/)[1]) : -1;
        
        var found;
        /**
         * Specifies whether the application is running in the Internet Explorer browser, any version.
         * @type {Boolean}
         */
        this.isIE        = document.all && !this.isOpera && !this.isSafari ? true : false;
        if (this.isIE) this.isIE = parseFloat(sAgent.match(/msie ([\d\.]*)/)[1]);
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 8.
         * @type {Boolean}
         */
        this.isIE8       = this.isIE && sAgent.indexOf("msie 8.") != -1 && (found = true);
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 7.
         * @type {Boolean}
         */
        this.isIE7       = this.isIE && !found && sAgent.indexOf("msie 7.") != -1 && (found = true);
        this.versionIE   = this.isIE ? parseFloat(sAgent.match(/msie ([\d\.]+)/)[1]) : -1;
        
        //Mode detection
        if (this.isIE8 && document.documentMode == 7) {
            apf.isIE7        = true;
            apf.isIE8        = false;
            apf.isIE7Emulate = true;
            this.versionIE   = 7;
        }
        
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 6.
         * @type {Boolean}
         */
        this.isIE6       = this.isIE && !found && sAgent.indexOf("msie 6.") != -1 && (found = true);
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 5.5.
         * @type {Boolean}
         */
        this.isIE55      = this.isIE && !found && sAgent.indexOf("msie 5.5") != -1 && (found = true);
        /**
         * Specifies whether the application is running in the Internet Explorer browser version 5.0.
         * @type {Boolean}
         */
        this.isIE50      = this.isIE && !found && sAgent.indexOf("msie 5.0") != -1 && (found = true);

        /**
         * Specifies whether the application is running on the Windows operating system.
         * @type {Boolean}
         */
        this.isWin       = sAgent.indexOf("win") != -1 || sAgent.indexOf("16bit") != -1;
        /**
         * Specifies whether the application is running in the OSX operating system..
         * @type {Boolean}
         */
        this.isMac       = sAgent.indexOf("mac") != -1;

        /**
         * Specifies whether the application is running in the AIR runtime.
         * @type {Boolean}
         */
        this.isAIR       = sAgent.indexOf("adobeair") != -1;

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
        this.supportVML                = apf.isIE;
        this.hasHtml5XDomain           = apf.versionGecko >= 3.5;
        this.supportCanvas             = !apf.isIE;
        this.supportSVG                = !apf.isIE;
        this.styleSheetRules           = apf.isIE ? "rules" : "cssRules";
        this.brokenHttpAbort           = apf.isIE6;
        this.canUseHtmlAsXml           = apf.isIE;
        this.supportNamespaces         = !apf.isIE;
        this.cannotSizeIframe          = apf.isIE;
        this.supportOverflowComponent  = apf.isIE;
        this.hasEventSrcElement        = apf.isIE;
        this.canHaveHtmlOverSelects    = !apf.isIE6 && !apf.isIE5;
        this.hasInnerText              = apf.isIE;
        this.hasMsRangeObject          = apf.isIE;
        this.descPropJs                = apf.isIE;
        this.hasClickFastBug           = apf.isIE;
        this.hasExecScript             = window.execScript ? true : false;
        this.canDisableKeyCodes        = apf.isIE;
        this.hasTextNodeWhiteSpaceBug  = apf.isIE || apf.versionIE >= 8;
        this.hasCssUpdateScrollbarBug  = apf.isIE;
        this.canUseInnerHtmlWithTables = !apf.isIE;
        this.hasSingleResizeEvent      = !apf.isIE;
        this.hasStyleFilters           = apf.isIE;
        this.supportOpacity            = !apf.isIE;
        this.supportPng24              = !apf.isIE6 && !apf.isIE5;
        this.cantParseXmlDefinition    = apf.isIE50;
        this.hasDynamicItemList        = !apf.isIE || apf.versionIE >= 7;
        this.canImportNode             = apf.isIE;
        this.hasSingleRszEvent         = !apf.isIE;
        this.hasXPathHtmlSupport       = !apf.isIE;
        this.hasFocusBug               = apf.isIE;
        this.hasReadyStateBug          = apf.isIE50;
        this.dateSeparator             = apf.isIE ? "-" : "/";
        this.canCreateStyleNode        = !apf.isIE;
        this.supportFixedPosition      = !apf.isIE || apf.versionIE >= 7;
        this.hasHtmlIdsInJs            = apf.isIE || apf.isSafari;
        this.needsCssPx                = !apf.isIE;
        this.hasCSSChildOfSelector     = !apf.isIE || apf.versionIE >= 8;
        this.hasAutocompleteXulBug     = apf.isGecko;
        this.mouseEventBuffer          = apf.isIE ? 20 : 6;
        this.hasComputedStyle          = typeof document.defaultView != "undefined"
                                           && typeof document.defaultView.getComputedStyle != "undefined";
        this.supportCSSAnim            = apf.isSafari && (apf.safariRev > 525);//apf.isIphone;
        this.locale                    = (apf.isIE
                                            ? navigator.userLanguage
                                            : navigator.language).toLowerCase();
        var t = document.createElement("div");
        this.hasContentEditable        = (typeof t.contentEditable == "string"
                                       || typeof t.contentEditable == "boolean");
        t = null;
        delete t;

        //Other settings
        this.maxHttpRetries = apf.isOpera ? 0 : 3;

        //#ifdef __WITH_PROPERTY_BINDING
        this.dynPropMatch = new RegExp();
        this.dynPropMatch.compile("^[{\\[][\\s\\S]*[}\\]]$");
        //#endif

        //#ifdef __WITH_ANCHORING
        this.percentageMatch = new RegExp();
        this.percentageMatch.compile("([\\-\\d\\.]+)\\%", "g");
        //#endif

        //#ifdef __SUPPORT_GEARS
        apf.isGears      = !!apf.initGears() || 0;
        //#endif

        //#ifdef __DEBUG
        //@todo why is this here?
        if (apf.isOpera) {
            window.console = {};
            ["log", "debug", "info", "warn", "error"].forEach(function(type) {
                window.console[type] = function() {
                    if (typeof arguments === "undefined") return null;
                    if (arguments.length === 1) { // single argument provided
                        opera.postError(type + ": " + arguments[0]);
                        return type + ": " + arguments[0];
                    }
                    var s      = arguments[0],
                        // string substitution patterns of firebug console
                        regexp = /%([sdifo])/g,
                        i      = 0,
                        match  = null;
                    // replace found matches with given arguments
                    while (match = regexp.exec(s)) {
                        s = s.replace(match[0], String(arguments[++i]));
                    }
                    // display log messages
                    var len = arguments.length;
                    while (len > i++) {
                        if (arguments[i]) {
                            s += ' ';
                            s += String(arguments[i]);
                        }
                    }
                    opera.postError(type + ": " + s);
                };
            });
        }
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
        apf.console.warn("This is a debug build of Ajax.org Platform; \
                          beware that execution speed of this build is \
                          <strong>several times</strong> slower than a \
                          release build of Ajax.org Platform.");
        //#endif

        //mozilla root detection
        //try{ISROOT = !window.opener || !window.opener.apf}catch(e){ISROOT = true}

        //Browser Specific Stuff
        this.browserDetect();
        this.setCompatFlags();

        //#ifdef __WITH_DEBUG_WIN
        apf.debugwin.init();
        //#endif

        //Load Browser Specific Code
        // #ifdef __SUPPORT_IE
        if (this.isIE) apf.runIE();
            //this.importClass(apf.runIE, true, self);
        // #endif
        // #ifdef __SUPPORT_SAFARI
        if (this.isSafari) apf.runSafari();
            //this.importClass(apf.runSafari, true, self);
        // #endif
        // #ifdef __SUPPORT_OPERA
        if (this.isOpera) apf.runOpera();
            //this.importClass(apf.runOpera, true, self);
        // #endif
        // #ifdef __SUPPORT_GECKO
        if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
            apf.runGecko();
            //this.importClass(apf.runGecko, true, self);
        // #endif

        //#ifdef __PARSE_GET_VARS
        for (var i, a, m, n, o, v, p = location.href.split(/[?&]/), l = p.length, k = 1; k < l; k++)
            if (m = p[k].match(/(.*?)(\..*?|\[.*?\])?=([^#]*)/)) {
                n = decodeURI(m[1]).toLowerCase(), o = this._GET;
                if (m[2])
                    for (a = decodeURI(m[2]).replace(/\[\s*\]/g, "[-1]").split(/[\.\[\]]/), i = 0; i < a.length; i++)
                        v = a[i], o = o[n]
                            ? o[n]
                            : o[n] = (parseInt(v) == v)
                                ? []
                                : {}, n = v.replace(/^["\'](.*)["\']$/,"$1");
                n != '-1'
                    ? o[n] = decodeURI(m[3])
                    : o[o.length] = decodeURI(m[3]);
            }
        //#endif

        // Start HTTP object
        this.oHttp = new this.http();

        // Load user defined includes
        this.Init.addConditional(this.loadIncludes, apf, ['body', 'xmldb']);
        //@todo, as an experiment I removed 'HTTP' and 'Teleport'

        //IE fix
        try {
            if (apf.isIE)
                document.execCommand("BackgroundImageCache", false, true);
        }
        catch(e) {};

        //#ifdef __WITH_WINDOW
        apf.window.init();
        //#endif

        //try{apf.root = !window.opener || !window.opener.apf;}
        //catch(e){apf.root = false}
        this.root = true;
    },

    // #ifndef __PACKAGED
    /**
     * @private
     */
    startDependencies : function(){
        if (location.protocol != "file:") {
            apf.console.warn("You are serving multiple files from a (local)\
                   webserver - please consider using the file:// protocol to \
                   load your files, because that will make your application \
                   load several times faster.\
                   On a webserver, we recommend using a release or debug build \
                   of Ajax.org Platform.");
        }

        apf.console.info("Loading Dependencies...");

        var i;
        // Load Kernel Modules
        for (i = 0; i < this.KernelModules.length; i++)
            apf.include("core/" + this.KernelModules[i], true);

        // Load TelePort Modules
        for (i = 0; i < this.TelePortModules.length; i++)
            apf.include("elements/teleport/" + this.TelePortModules[i], true);

        // Load Elements
        for (i = 0; i < this.Elements.length; i++) {
            var c = this.Elements[i];
            apf.include("elements/" + c + ".js", true);
        }

        apf.Init.interval = setInterval(
            "if (apf.checkLoadedDeps()) {\
                clearInterval(apf.Init.interval);\
                apf.start();\
            }", 100);
    },

    //#endif

    nsqueue   : {},

    /**
     * Offers a way to load modules into a javascript namespace before the root
     * of that namespace is loaded.
     * @private
     */
    namespace : function(name, oNamespace){
        try{
            eval("apf." + name + " = oNamespace");
            delete this.nsqueue[name];

            for (var ns in this.nsqueue) {
                if (ns.indexOf(name) > -1) {
                    this.namespace(ns, this.nsqueue[ns]);
                }
            }

            return true;
        }catch(e){
            this.nsqueue[name] = oNamespace;

            return false;
        }
    },
    
    //#ifdef __PARSER_AML || __WITH_NS_SUPPORT
    /**
     * @private
     */
    findPrefix : function(xmlNode, xmlns){
        var docEl;
        if (xmlNode.nodeType == 9) {
            if (!xmlNode.documentElement) return false;
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
            for (var i=0; i<docEl.attributes.length; i++) {
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

        //if (!apf.hasExecScript)
            //return ref();//.call(self);

        if (!strip)
            return apf.exec(ref.toString(), win);

        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.replace(/\}\s*$/, "");

        //var q = ref.toString().split("\n");q.shift();q.pop();
        //if(!win.execScript) q.shift();q.pop();

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
    implement : function(classRef){
        for (var i=0; i<arguments.length; i++) {
            //#ifdef __DEBUG
            if (!arguments[i]) {
                throw new Error(apf.formatErrorString(0, this,
                    "Implementing class",
                    "Could not implement from '" + classRef + "'",
                    this.$aml));
            }
            //#endif

            arguments[i].call(this);//classRef
        }

        return this;
    },

    /**
    * This method transforms an object into a apf class based object.
    * @param {Object} oBlank the object which will be transformed
    */
    makeClass : function(oBlank){
        if (oBlank.implement) return;

        oBlank.implement = this.implement;
        oBlank.implement(apf.Class);

        if (!oBlank.uniqueId)
            oBlank.uniqueId = this.all.push(oBlank) - 1;
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
        oHtml.setAttribute("id", "q" + this.uniqueHtmlIds++);
    },

    /**
     * Retrieves a new unique id
     */
    getUniqueId : function(oHtml){
        return this.uniqueHtmlIds++;
    },

    /**
     * @private
     * @todo deprecate this in favor of apf.component
     * @deprecated
     */
    register : function(o, tagName, nodeFunc){
        o.tagName  = tagName;
        o.nodeFunc = nodeFunc || apf.NODE_HIDDEN;

        o.$domHandlers  = {"remove" : [], "insert" : [], "reparent" : [], "removechild" : []};
        o.$propHandlers = {}; //@todo fix this in each component

        if (nodeFunc != apf.NODE_HIDDEN) {
            o.$booleanProperties = {
                "visible"          : true,
                "focussable"       : true,
                //"disabled"         : true,
                "disable-keyboard" : true
            }

            o.$supportedProperties = [
                //#ifdef __WITH_INTERACTIVE
                "draggable", "resizable",
                //#endif
                "focussable", "zindex", "disabled", "tabindex",
                "disable-keyboard", "contextmenu", "visible", "autosize",
                "loadaml", "actiontracker", "alias"];
        }
        else {
            o.$booleanProperties = {}; //@todo fix this in each component
            o.$supportedProperties = []; //@todo fix this in each component
        }

        if (!o.implement) {
            o.implement = this.implement;
            o.implement(apf.Class);
            o.uniqueId = this.all.push(o) - 1;
         }

        //#ifdef __DESKRUN
        if(o.nodeFunc == apf.NODE_MEDIAFLOW)
            DeskRun.register(o);
        //#endif
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

                var p = node.parentNode.parentNode.parentNode;
                var el = node.parentNode.parentNode;
                if(p.scrollTop + p.offsetHeight < el.offsetTop + el.offsetHeight)
                    p.scrollTop = el.offsetTop + el.offsetHeight - p.offsetHeight;
            }
        },

        cache : [],

        /**
         * @private
         * @event debug Fires when a message is sent to the console.
         *   object:
         *      {String} message the content of the message.
         */
        write : function(msg, type, subtype, data, forceWin, nodate){
            //if (!apf.debug) return;
            if (!Number.prototype.toPrettyDigit) {
                Number.prototype.toPrettyDigit = function() {
                    var n = this.toString();
                    return (n.length == 1) ? "0" + n : n;
                }
            }

            var dt   = new Date();
            var ms   = String(dt.getMilliseconds());
            while (ms.length < 3) ms += "0";
            var date = dt.getHours().toPrettyDigit() + ":"
                + dt.getMinutes().toPrettyDigit()    + ":"
                + dt.getSeconds().toPrettyDigit()    + "."
                + ms;

            msg = (!nodate ? "[" + date + "] " : "")
                    + String(msg).replace(/ +/g, " ").replace(/\n/g, "\n<br />")
                         .replace(/\t/g,"&nbsp;&nbsp;&nbsp;");
            var sPath = apf.debugwin
                ? (apf.debugwin.resPath || "{imgpath}")
                : apf.basePath + "core/debug/resources/";

            if (data) {
                msg += "<blockquote style='margin:2px 0 0 0;\
                        background:url(" + sPath + "splus.gif) no-repeat 2px 3px'>\
                        <strong style='width:120px;cursor:default;display:block;padding:0 0 0 17px' \
                        onmousedown='(self.apf || window.opener.apf).console.toggle(this.nextSibling, "
                        + (this.cache.push(data) - 1) + ")'>More information\
                        </strong><div style='display:none;background-color:#EEEEEE;\
                        padding:3px 3px 20px 3px;overflow:auto;max-height:200px'>\
                        </div></blockquote>";
            }

            msg = "<div style='min-height:15px;padding:2px 2px 2px 22px;\
                line-height:15px;border-bottom:1px solid #EEE;background:url("
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
                this.win.document.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                                         <body style="margin:0;font-family:Verdana;font-size:8pt;"></body>');
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
            var file = amlContext.ownerDocument.documentElement.getAttribute("filename");
            if (!file && amlContext.ownerDocument.documentElement.tagName == "html")
                file = location.href;
            file = file
                ? apf.removePathContext(apf.hostPath, file)
                : "Unkown filename";

            //Get serialized version of context
            var amlStr = (amlContext.outerHTML || amlContext.xml || amlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/ajax.org\/2005\/aml" \/\>/g, "")
                .replace(/xmlns:a="[^"]*"\s*/g, "");

            //Determine line number
            var diff, linenr = 0, w = amlContext.previousSibling
                || amlContext.parentNode && amlContext.parentNode.previousSibling;
            while(w && w[apf.TAGNAME] != "body"){
                diff = (w.outerHTML || w.xml || w.serialize()).split("\n").length;
                linenr += diff - 1;
                w = w.previousSibling || w.parentNode
                    && w.parentNode.previousSibling;
            }
            if (w && w[apf.TAGNAME] != "body")
                linenr = "unknown";
            else if(amlContext.ownerDocument.documentElement.tagName == "html")
                linenr += apf.lineBodyStart;

            //Grmbl line numbers are wrong when \n's in attribute space

            //Set file and line number
            str.push("aml file: [line: " + linenr + "] " + file);
        }
        if (control)
            str.push("Control: '"
                + (control.name
                    || (control.$aml ? control.$aml.getAttribute("id") : null)
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
     * Loads javascript from a url.
     * @param {String} sourceFile the url where the javascript is located.
     */
    include : function(sourceFile, doBase, type){
        apf.console.info("including js file: " + sourceFile);

        var sSrc = doBase ? (apf.basePath || "") + sourceFile : sourceFile;
        if (apf.isSafariOld || apf.isSafari && !apf.started) {
            document.write('<script type="text/javascript" src="' + sSrc + '"><\/script>');
        }
        else {
            var head     = document.getElementsByTagName("head")[0];//$("head")[0]
            var elScript = document.createElement("script");
            //elScript.defer = true;
            if (type)
                elScript.setAttribute("_apf_type", type);
            elScript.src   = sSrc;
            head.appendChild(elScript);
        }
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
            for (var i=0; i<this.cond.combined.length; i++) {
                if (!this.cond.combined[i]) continue;

                if (this.checkCombined(this.cond.combined[i][2])) {
                    this.cond.combined[i][0].call(this.cond.combined[i][1])
                    this.cond.combined[i] = null;
                }
            }
        },

        checkCombined : function(arr){
            for (var i=0; i<arr.length; i++) {
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

    /**
     * @todo Build this function into the compressor for faster execution
     * @private
     */
    getAmlDocFromString : function(xmlString, preserveWhiteSpace){
        //replace(/&\w+;/, ""). replace this by something else
        var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "").replace(/&nbsp;/g, " ")
          .replace(/^[\r\n\s]*/, "").replace(/<\s*\/?\s*(?:\w+:\s*)[\w-]*[\s>\/]/g,
            function(m){ return m.toLowerCase(); });

        if (!this.supportNamespaces)
            str = str.replace(/xmlns\=\"[^"]*\"/g, "");

        //#ifdef __WITH_EXPLICIT_LOWERCASE
        var xmlNode = apf.getXmlDom(str, null, preserveWhiteSpace || apf.debug);

        // Case insensitive support
        var nodes = xmlNode.selectNodes("//@*[not(contains(local-name(), '.')) and not(translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = local-name())]");
        for (var i=0; i<nodes.length; i++) {
            (nodes[i].ownerElement || nodes[i].selectSingleNode(".."))
                .setAttribute(nodes[i].nodeName.toLowerCase(), nodes[i].nodeValue);
        }
        /* #else

        var xmlNode = apf.getXmlDom(str);
        if (apf.xmlParseError) apf.xmlParseError(xmlNode);

        #endif */

        return xmlNode;
    },

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
    parsePartialAml : function(docElement){
        //#ifdef __DEBUG
        apf.console.warn("The aml namespace definition wasn't found \
                          on the root node of this document. We're assuming \
                          you want to load a partial piece of aml embedded\
                          in this document. Starting to search for it now.");
        //#endif

        if (apf.isIE) {
            var findAml = function(htmlNode){
                //#ifdef __DEBUG
                if (htmlNode.outerHTML.match(/\/>$/)) {
                    throw new Error("Cannot have self closing elements!\n"
                        + htmlNode.outerHTML);
                }
                //#endif
                
                try {
                    var tags = {"IMG":1,"LINK":1,"META":1,"INPUT":1,"BR":1,"HR":1,"AREA":1,"BASEFONT":1};
                    var strXml = (htmlNode.parentNode.outerHTML.replace(/\n/g, "").match(
                      new RegExp(htmlNode.outerHTML.replace(/([\(\)\|\\\.\^\$\{\}\[\]])/g, "\\$1")
                      + ".*" + htmlNode.tagName))[0] + ">")
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
                        "Could not parse inline aml. This happens when the html\
                         is mangled too much by Internet Explorer. Either you\
                         are using a cdata section or javascript containing\
                         symbols that throw off the browser. Please put this aml\
                         in a seperate file and load it using an include element."));
                    //#endif
                    
                    return;
                }

                var p = prefix.toLowerCase();
                var xmlNode = apf.getAmlDocFromString("<div jid='"
                    + (id++) + "' " + strXmlns + ">"
                    + strXml + "</div>").documentElement;

                while(xmlNode.childNodes.length > 1) {
                    xmlNode.removeChild(xmlNode.lastChild);
                }

                apf.AppNode.appendChild(xmlNode);
            }
        }
        else {
            var findAml = function(htmlNode){
                var strXml = htmlNode.outerHTML
                    .replace(/ _moz-userdefined=""/g, "");

                var p = prefix.toLowerCase();
                var xmlNode = apf.getAmlDocFromString("<div jid='"
                    + (id++) + "' " + strXmlns + ">"
                    + strXml + "</div>").documentElement;

                while(xmlNode.childNodes.length > 1) {
                    xmlNode.removeChild(xmlNode.lastChild);
                }

                if (apf.isSafari)
                    xmlNode = apf.AppNode.ownerDocument.importNode(xmlNode, true);

                apf.AppNode.appendChild(xmlNode);
            }
        }

        var strHtml = document.body.outerHTML;
        var match = strHtml.match(/(\w+)\s*=\s*["']http:\/\/ajax\.org\/2005\/aml["']/);
        if (!match)
            return false;

        var strXmlns = "xmlns:" + match[0];
        var prefix = (RegExp.$1 || "").toUpperCase();
        if (apf.isOpera)
            prefix = prefix.toLowerCase();
        if (!prefix)
            return false;

        prefix += ":";

        apf.AppNode = apf.getAmlDocFromString("<" + prefix.toLowerCase()
            + "application " + strXmlns + " />").documentElement;

        var temp, loop;
        var cnode, isPrefix = false, id = 0, str, x, node = document.body;
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

                    if (apf.isSafari)
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
    loadIncludes : function(docElement){
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
                    apf.Init.interval = setInterval(function(){
                        if (apf.checkLoaded())
                            apf.initialize();
                    }, 20);
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
            apf.console.warn("The aml namespace definition wasn't found \
                              on the root node of this document. We're assuming \
                              you want to load a partial piece of aml embedded\
                              in this document. Starting to search for it now.");
            //#endif

            //Walk tree
            var str, x, node = document.body;
            while (node) {
                if (node.nodeType == 8) {
                    str = node.nodeValue;
                    if  (str.indexOf("[apf]") == 0) {
                        str = str.substr(5);

                        //#ifdef __DEBUG
                        apf.console.info("Found a piece of aml. Assuming \
                                          namespace prefix 'j'. Starting \
                                          parsing now.");
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

                apf.Init.interval = setInterval(function(){
                    if (apf.checkLoaded())
                        apf.initialize();
                }, 20);

                return;
            }
            
            isEmptyDocument = true;
        }
        //#endif

        //#ifdef __WITH_PARSEAMLFROMHTML
        //Load aml without reloading the page, but also fully parse javascript
        //This requires there to be no self closing elements
        if (this.parseStrategy == 2) { //!this.parseStrategy
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
                for (var i=nodes.length-1; i>=0; i--)
                    nodes[i].parentNode.removeChild(nodes[i]);

                /*apf.AppData = $xmlns(docElement, "body", apf.ns.xhtml)[0];
                apf.loadAmlIncludes(apf.AppData);

                if (!self.ERROR_HAS_OCCURRED) {
                    apf.Init.interval = setInterval(function(){
                        if (apf.checkLoaded())
                            apf.initialize();
                    }, 20);
                }

                return;*/
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
        
        if (isEmptyDocument && document.documentElement.outerHTML
          .split(">", 1)[0]
          .indexOf(apf.ns.aml) == -1) {
            //#ifdef __DEBUG
            apf.console.warn("The aml namespace declaration wasn't found. \
                              No aml elements were found in the body. Exiting");
            //#endif
            return false;
        }

        //Load current HTML document as 'second DOM'
        if (this.parseStrategy == 21 || !this.parseStrategy && !docElement) {
            return apf.oHttp.get((apf.alternativeAml 
              || document.body.getAttribute("xmlurl") 
              || location.href).split(/#/)[0],
                function(xmlString, state, extra){
                    if (state != apf.SUCCESS) {
                        var oError = new Error(apf.formatErrorString(0, null,
                            "Loading XML application data", "Could not load \
                            XML from remote source: " + extra.message));

                        if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                            return true;

                        throw oError;
                    }

                    //#ifdef __DEBUG
                    apf.lineBodyStart = (xmlString.replace(/\n/g, "\\n")
                        .match(/(.*)<body/) || [""])[0].split("\\n").length;
                    //#endif

                    var xmlNode = apf.getAmlDocFromString(xmlString);

                    //Clear Body
                    if (apf.isIE)
                        document.body.innerHTML ="";
                    else {
                        var nodes = document.body.childNodes;
                        for (var i=nodes.length-1; i>=0; i--)
                            nodes[i].parentNode.removeChild(nodes[i]);
                    }

                    return apf.loadIncludes(xmlNode);
                }, {ignoreOffline: true});
        }

        //Parse the second DOM (add includes)
        var prefix = apf.findPrefix(docElement, apf.ns.aml);
        //#ifdef __SUPPORT_SAFARI2
        if (apf.isSafariOld)
            prefix = "a";
        //#endif

        //#ifdef __DEBUG
        if (!prefix)
            throw new Error(apf.formatErrorString(0, null,
                "Parsing document",
                "Unable to find Ajax.org Platform namespace definition. \
                 (i.e. xmlns:a=\"" + apf.ns.aml + "\")", docElement));
        //#endif

        apf.AppData = apf.supportNamespaces
            ? docElement.createElementNS(apf.ns.aml, prefix + ":application")
            : docElement.createElement(prefix + ":application");

        var i, nodes;
        //Head support
        var head = $xmlns(docElement, "head", apf.ns.xhtml)[0];
        if (head) {
            nodes = head.childNodes;
            for (i = nodes.length-1; i >= 0; i--)
                if (nodes[i].namespaceURI && nodes[i].namespaceURI != apf.ns.xhtml)
                    apf.AppData.insertBefore(nodes[i], apf.AppData.firstChild);
        }

        //Body support
        var body = (docElement.body
            ? docElement.body
            : $xmlns(docElement, "body", apf.ns.xhtml)[0]);
        for (i = 0; i < body.attributes.length; i++)
            apf.AppData.setAttribute(body.attributes[i].nodeName,
                body.attributes[i].nodeValue);

        nodes = body.childNodes;
        for (i = nodes.length - 1; i >= 0; i--)
            apf.AppData.insertBefore(nodes[i], apf.AppData.firstChild);
        docElement.documentElement.appendChild(apf.AppData); //Firefox fix for selectNode insertion need...

        /* 
        apf.AppData = docElement.body ? docElement.body : $xmlns(docElement.documentElement, "body", apf.ns.xhtml)[0];
        */

        apf.loadAmlIncludes(apf.AppData);

        if ($xmlns(apf.AppData, "loader", apf.ns.aml).length) {
            apf.loadScreen = {
                show : function(){
                    this.oExt.style.display = "block";
                    //this.oExt.style.height = document.body.scrollHeight + "px";
                },

                hide : function(){
                    this.oExt.style.display = "none";
                }
            }

            if (apf.isGecko || apf.isSafari)
                document.body.innerHTML = "";

            //#ifdef __SUPPORT_SAFARI
            if (apf.isSafariOld) {
                var q = apf.getFirstElement(
                    $xmlns(apf.AppData, "loader", apf.ns.aml)[0]).serialize();
                document.body.insertAdjacentHTML("beforeend", q);
                apf.loadScreen.oExt = document.body.lastChild;
            }
            else
            //#endif
            {
                var htmlNode = apf.getFirstElement(
                    $xmlns(apf.AppData, "loader", apf.ns.aml)[0]);

                //if(apf.isSafari) apf.loadScreen = document.body.appendChild(document.importNode(htmlNode, true));
                if (htmlNode.ownerDocument == document)
                    apf.loadScreen.oExt = document.body.appendChild(
                        htmlNode.cloneNode(true));
                else {
                    document.body.insertAdjacentHTML("beforeend", htmlNode.xml
                        || htmlNode.serialize());
                    apf.loadScreen.oExt = document.body.lastChild;
                }
            }
        }

        document.body.style.display = "block"; //might wanna make this variable based on layout loading...

        if (!self.ERROR_HAS_OCCURRED) {
            apf.Init.interval = setInterval(function(){
                if (apf.checkLoaded())
                    apf.initialize()
            }, 20);
        }
    },

    /**
     * @private
     */
    checkForAmlNamespace : function(xmlNode){
        if (!xmlNode.ownerDocument.documentElement)
            return false;

        var nodes = xmlNode.ownerDocument.documentElement.attributes;
        for (var found = false, i=0; i<nodes.length; i++) {
            if (nodes[i].nodeValue == apf.ns.aml) {
                found = true;
                break;
            }
        }

        //#ifdef __DEBUG
        if (!found) {
            throw new Error(apf.formatErrorString(0, null,
                "Checking for the aml namespace",
                "The Ajax.org Platform xml namespace was not found in "
                + (xmlNode.getAttribute("filename")
                    ? "in '" + xmlNode.getAttribute("filename") + "'"
                    : "")));
        }
        //#endif;

        return found;
    },

    /**
     * @private
     */
    loadAmlIncludes : function(xmlNode, doSync){
        // #ifdef __WITH_INCLUDES

        var i, nodes, path;
        // #ifdef __DEBUG
        apf.checkForAmlNamespace(xmlNode);
        // #endif

        var basePath = apf.getDirname(xmlNode.getAttribute("filename")) || apf.hostPath;

        nodes = $xmlns(xmlNode, "include", apf.ns.aml);
        if (nodes.length) {
            xmlNode.setAttribute("loading", "loading");

            for (i = nodes.length - 1; i >= 0; i--) {
                // #ifdef __DEBUG
                if (!nodes[i].getAttribute("src"))
                    throw new Error(apf.formatErrorString(0, null, 
                        "Loading includes", 
                        "Could not load Include file " + nodes[i].xml 
                        + ":\nCould not find the src attribute."))
                // #endif

                path = apf.getAbsolutePath(basePath, nodes[i].getAttribute("src"));

                apf.loadAmlInclude(nodes[i], doSync, path);
            }
        }
        else
            xmlNode.setAttribute("loading", "done");

        nodes = $xmlns(xmlNode, "skin", apf.ns.aml);
        for (i = 0; i < nodes.length; i++) {
            if (!nodes[i].getAttribute("src") && !nodes[i].getAttribute("name")
              || nodes[i].childNodes.length)
                continue;

            path = nodes[i].getAttribute("src")
                ? apf.getAbsolutePath(basePath, nodes[i].getAttribute("src"))
                : apf.getAbsolutePath(basePath, nodes[i].getAttribute("name")) + "/index.xml";

            apf.loadAmlInclude(nodes[i], doSync, path, true);

            //nodes[i].parentNode.removeChild(nodes[i]);
            nodes[i].setAttribute("a_preparsed", "9999")
        }

        //#ifdef __WITH_SKIN_AUTOLOAD
        //XForms and lazy devs support
        if (!nodes.length && !apf.skins.skins["default"] && apf.autoLoadSkin) {
            apf.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            apf.loadAmlInclude(null, doSync, "skins.xml", true);
        }
        //#endif

        //#endif

        return true;
    },

    /**
     * @private
     */
    loadAmlInclude : function(node, doSync, path, isSkin){
        // #ifdef __WITH_INCLUDES

        //#ifdef __DEBUG
        apf.console.info("Loading include file: " + (path || node && node.getAttribute("src")));
        //#endif

        this.oHttp.get(path || apf.getAbsolutePath(apf.hostPath, node.getAttribute("src")),
            function(xmlString, state, extra){
                 if (state != apf.SUCCESS) {
                    var oError = new Error(apf.formatErrorString(1007,
                        null, "Loading Includes", "Could not load Include file '"
                        + (path || extra.userdata[0].getAttribute("src"))
                        + "'\nReason: " + extra.message, node));

                    if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                        return true;

                    //#ifdef __WITH_SKIN_AUTOLOAD
                    //Check if we are autoloading
                    if (!node) {
                        //Fail silently
                        apf.console.warn("Could not autload skin.");
                        apf.includeStack[extra.userdata[1]] = true;
                        return;
                    }
                    //#endif

                    throw oError;
                }

                var xmlNode, isTeleport;
                if (!isSkin) {
                    xmlNode = apf.getAmlDocFromString(xmlString).documentElement;
                    var tagName = xmlNode[apf.TAGNAME];

                    if (tagName == "skin")
                        isSkin = true;
                    else if (tagName == "teleport")
                        isTeleport = true;
                    else if(tagName != "application") {
                        throw new Error(apf.formatErrorString(0, null,
                            "Loading Includes",
                            "Could not find handler to parse include file for '"
                            + xmlNode[apf.TAGNAME]
                            + "' expected 'skin' or 'application'", node));
                    }
                }

                if (isSkin) {
                    if (xmlString.indexOf('xmlns="http://www.w3.org/1999/xhtml"') > -1){
                        //#ifdef __DEBUG
                        apf.console.warn("Found xhtml namespace as global \
                                          namespace of skin file. This is not \
                                          allowed. Please remove this before \
                                          use in production environments.")
                        //#endif
                        xmlString = xmlString.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
                        xmlNode = apf.getAmlDocFromString(xmlString).documentElement;
                    }
                    else if (!xmlNode)
                        xmlNode = apf.getAmlDocFromString(xmlString).documentElement;
                    
                    if (!xmlNode) {
                        throw new Error(apf.formatErrorString(0, null,
                            "Loading skin",
                            "Could not parse skin. Maybe the file does not exist?", node));
                    }
                    
                    apf.skins.Init(xmlNode, node, path);
                    apf.includeStack[extra.userdata[1]] = true;

                    if (apf.isOpera && extra.userdata[0] && extra.userdata[0].parentNode) //for opera...
                        extra.userdata[0].parentNode.removeChild(extra.userdata[0]);
                }
                else if (isTeleport) {
                    apf.teleport.loadAml(xmlNode);
                    apf.includeStack[extra.userdata[1]] = true;
                }
                else {
                    apf.includeStack[extra.userdata[1]] = xmlNode;//extra.userdata[0].parentNode.appendChild(xmlNode, extra.userdata[0]);
                    extra.userdata[0].setAttribute("iid", extra.userdata[1]);
                }

                xmlNode.setAttribute("filename", extra.url);

                // #ifdef __DEBUG
                apf.console.info("Loading of " + xmlNode[apf.TAGNAME].toLowerCase() + " include done from file: " + extra.url);
                // #endif

                apf.loadAmlIncludes(xmlNode); //check for includes in the include (NOT recursive save)

            }, {
                async         : !doSync,
                userdata      : [node, !apf.isTrue(node.getAttribute("defer")) 
                                 && apf.includeStack.push(false) - 1],
                ignoreOffline : true
            });

        // #endif
    },
    //#endif

    /**
     * @private
     */
    checkLoaded : function(){
        for (var i = 0; i < apf.includeStack.length; i++) {
            if (!apf.includeStack[i]) {
                apf.console.info("Waiting for: [" + i + "] " + apf.includeStack[i]);
                return false;
            }
        }

        if (!document.body) return false;

        apf.console.info("Dependencies loaded");

        return true;
    },

    // #ifndef __PACKAGED
    /**
     * @private
     */
    checkLoadedDeps : function(){
        apf.console.info("Loading...");

        apf.Init.addConditional(function(){
            //apf.dispatchEvent("domready");
        }, null, ["body"]);

        var i;
        for (i = 0; i < this.Modules.length; i++) {
            if (!apf[this.Modules[i]]) {
                //#ifdef __DEBUG
                apf.console.info("Waiting for module " + this.Modules[i]);
                //#endif
                return false;
            }
        }

        for (i = 0; i < this.TelePortModules.length; i++) {
            var mod = this.TelePortModules[i].replace(/(^.*\/|^)([^\/]*)\.js$/, "$2");
            if (!apf[mod]) {
                //#ifdef __DEBUG
                apf.console.info("Waiting for TelePort module " + mod);
                //#endif
                return false;
            }
        }

        for (i = 0; i < this.Elements.length; i++) {
            if (this.Elements[i].match(/^_base|\//) || this.Elements[i] == "htmlwrapper")
                continue;

            if (!apf[this.Elements[i]]) {
                //#ifdef __DEBUG
                apf.console.info("Waiting for component " + this.Elements[i]);
                //#endif
                return false;
            }
        }

        for (i in this.nsqueue) {
            if (this.nsqueue[i] && apf.namespace(i, this.nsqueue[i])) {
                //#ifdef __DEBUG
                apf.console.info("Waiting for namespace to come in " + i);
                //#endif
                return false;
            }
        }

        if (!document.body) return false;

        //#ifdef __DEBUG
        apf.console.info("Dependencies loaded");
        //#endif

        return true;
    },
    //#endif

    /**
     * @private
     */
    initialize : function(){
        // #ifdef __DESKRUN
        if (apf.initialized) return;
        apf.initialized = true;
        // #endif

        apf.console.info("Initializing...");
        clearInterval(apf.Init.interval);

        // Run Init
        apf.Init.run(); //Process load dependencies
        
        //#ifdef __WITH_DEFAULT_SKIN
        apf.skins.defaultSkin = '<?xml version="1.0" encoding="utf-8"?><a:skin xmlns:a="http://ajax.org/2005/aml" xmlns="http://www.w3.org/1999/xhtml"><a:bar name="bar"><a:style><![CDATA[#jem.apf_bar {position: relative;color: #4b4b4b;font-family: Tahoma;font-size: 10px;padding: 10px;border: 1px solid #f3f3f3;cursor: default;margin: 0;background: white url(images/resizehandle.gif) no-repeat right bottom;z-index: 10000;}#jem.apf_bar img {position: absolute;bottom: 13px;left: 216px;}#jem.apf_bar .apf_counter {position: absolute;bottom: 5px;left: 40px;}#jem.apf_bar .apf_countdown {position: absolute;bottom: 5px;right: 142px;}#jem.apf_bar .apf_volume {position: absolute;bottom: 5px;right: 119px;left: auto;background: none;width: 16px;height: 16px;margin: 0;padding: 0;cursor: pointer;cursor: hand;}#jem.apf_bar .apf_volume span {margin: 0;padding: 0;width: 16px;height: 16px;}#jem.apf_bar .apf_fullscreen {position: absolute;bottom: 2px;right: 28px;left: auto;width: 14px;background: transparent;cursor: pointer;cursor: hand;}#jem.apf_bar .apf_fullscreen span {height:14px;width:14px;margin:3px auto 0 0;}]]></a:style><a:presentation><a:main container="." resize-corner="17"><div class="apf_bar" id="jem"> </div></a:main></a:presentation></a:bar><a:label name="label"><a:style><![CDATA[#jem .apf_label{font-size: 8pt;font-family: Tahoma;overflow: hidden;cursor: default;line-height : 1.5em;margin : 0;}#jem .apf_labelDisabled{color: #bebebe;}#jem .tiny {font-size : 9px;}#jem .error .apf_label{background : url(images/alert.png) no-repeat 0 0;min-height : 37px;padding : 3px 0 0 45px;}]]></a:style><a:presentation><a:main caption="." for="@for"><div class="apf_label"> </div></a:main></a:presentation></a:label><a:slider name="slider"><a:style><![CDATA[#jem .apf_slider {background: url("images/bar_right.png") no-repeat top right;height: 8px;position: relative;font-family: Tahoma;font-size: 9px;text-align: center;position: absolute;bottom: 9px;right: 53px;margin: 0;}#jem .apf_sliderDisabled {background-position: right -8px;}#jem .apf_slider .apf_left {background: url("images/bar_left.png") no-repeat top left;height: 8px;overflow: hidden;margin: 0;margin-right: 4px;}#jem .apf_sliderDisabled .apf_left {background-position: left -8px;}#jem .apf_sliderDisabled .apf_filledbar {background-position: 0 -8px;}#jem .apf_slider .apf_grabber {background: url("images/slider3.png") no-repeat top left;width: 12px;height: 8px;overflow: hidden;position: absolute;margin: 0;}#jem .apf_sliderDisabled .apf_grabber {background-position: left -8px;}]]></a:style><a:presentation><a:main slider="div[1]" container="." status2="div[2]/text()" markers="." direction="horizontal"><div class="apf_slider"><div class="apf_grabber"> </div><div class="apf_left"> </div></div></a:main><marker><u> </u></marker></a:presentation></a:slider><a:slider name="slider16"><a:style><![CDATA[#jem .apf_slider16 {background: url("images/bar16x_right.png") no-repeat top right;width: 300px;height: 16px;position: relative;padding-right: 7px;font-family: Tahoma;font-size: 9px;text-align: center;position: absolute;bottom: 6px;left: 82px;margin: 0;}#jem .apf_slider16Disabled {background-position: right -16px;}#jem .apf_slider16 .apf_left {background: url("images/bar16x_left.png") no-repeat top left;height: 16px;overflow: hidden;margin: 0;}#jem .apf_slider16Disabled .apf_left {background-position: left -16px;}#jem .apf_slider16 .apf_grabber {background: url("images/rslider16x.png") no-repeat top right;width: 20px;height: 16px;overflow: hidden;position: absolute;margin: 0;}#jem .apf_slider16Disabled .apf_grabber {background-position: left -16px;margin-left: 7px;cursor: normal;}#jem .apf_slider16 .apf_sldprogress {background: #ddd;display: block;overflow: hidden;height: 4px;margin-left: 6px;margin-top: 6px;z-index: 0;}]]></a:style><a:presentation><a:main slider="div[1]" container="." progress="div[2]" status2="div[2]/text()" markers="." direction="horizontal"><div class="apf_slider16"><div class="apf_grabber"> </div><div class="apf_left"> </div></div></a:main><progress><span class="apf_sldprogress"></span></progress><marker><u></u></marker></a:presentation></a:slider><a:button name="button"><a:style><![CDATA[#jem .apf_button {color: #4b4b4b;font-family: Tahoma;font-size: 8pt;height: 21px;width: 34px;overflow: hidden;cursor: default;background: url(images/mediabtn2.png) no-repeat 0 -42px;position: absolute;bottom: 3px;left: 3px;margin: 0;}#jem .apf_buttonOver {background-position: 0 -21px;}#jem .apf_buttonDisabled {background-position: 0 -42px;}#jem .apf_buttonDown {background-position: 0 0px;}#jem .apf_button span {display: block;background: no-repeat 0 0;width: 11px;height: 10px;margin: 4px auto 0 11px;}]]></a:style><a:presentation><a:main background="span" icon="span"><div class="apf_button"><span></span></div></a:main></a:presentation></a:button><a:video name="video"><a:style><![CDATA[#jem .apf_video {line-height:300px;margin:0;padding:0;text-align:center;vertical-align:middle;overflow : hidden;background : black;}#jem .apf_video #qt_event_source{position : absolute;left : 0;top : 0;}]]></a:style><a:presentation><a:main container="."><div class="apf_video"></div></a:main></a:presentation></a:video></a:skin>';
        if (!apf.skins.skins["default"] && apf.skins.defaultSkin) {
            //#ifdef __DEBUG
            apf.console.warn("No skin definition found. Using default skin.");
            //#endif

            //var xmlString = apf.skins.defaultSkin.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
            var xmlNode = apf.getAmlDocFromString(apf.skins.defaultSkin).documentElement; //@todo should get preprocessed
            xmlNode.setAttribute("media-path", apf.CDN + apf.VERSION + "/images/")
            xmlNode.setAttribute("icon-path", apf.CDN + apf.VERSION + "/icons/")
            apf.skins.Init(xmlNode);
        }
        //#endif

        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (apf.isParsingPartial) {
            apf.appsettings.setDefaults();
            apf.hasSingleRszEvent = true;

            var pHtmlNode = document.body;
            var lastChild = pHtmlNode.lastChild;
            apf.AmlParser.parseMoreAml(apf.AppNode, pHtmlNode, null,
                true, false);

            var pNode, firstNode, lastBefore = null, next, info, loop = pHtmlNode.lastChild;
            while (loop && lastChild != loop) {
                info = apf.amlParts[loop.getAttribute("jid")];
                next = loop.previousSibling;
                if (info) {
                    pNode = info[0];
                    if ("P".indexOf(pNode.tagName) > -1) {
                        lastBefore = pNode.parentNode.insertBefore(apf.getNode(loop, [0]),
                            pNode);
                    }
                    else {
                        firstNode = apf.getNode(loop, [0]);
                        while(firstNode){
                            if (firstNode) {
                                lastBefore = pNode.insertBefore(firstNode,
                                    typeof info[1] == "number" ? lastBefore : info[1]);
                            }
                            else {
                                lastBefore = typeof info[1] == "number" ? lastBefore : info[1];
                            }
                            firstNode = apf.getNode(loop, [0]);
                        }
                    }

                    loop.parentNode.removeChild(loop);
                }
                loop = next;
            }

            // #ifdef __WITH_ALIGNMENT || __WITH_ANCHORING || __JTABLE
            setTimeout("apf.layout.forceResize();");
            // #endif
        }
        else
        //#endif
        {
            // Start application
            if (apf.AmlParser && apf.AppData)
                apf.AmlParser.parse(apf.AppData);

            if (apf.loadScreen && apf.appsettings.autoHideLoading)
                apf.loadScreen.hide();
        }
    },

    load_events: [],
    load_timer : null,
    load_done  : false,
    load_init  : null,

    addDomLoadEvent: function(func) {
        if (!this.$bdetect)
            this.browserDetect();

        if (apf.load_done)
            return func();

        // create event function stack
        //apf.done = arguments.callee.done;
        if (!apf.load_init) {
            apf.load_init = function () {
                if (apf.load_done) return;
                // kill the timer
                clearInterval(apf.load_timer);
                apf.load_timer = null;
                apf.load_done  = true;
                // execute each function in the stack in the order they were added
                var len = apf.load_events.length;
                while (len--)
                    (apf.load_events.shift())();
            };
        }

        if (func && !apf.load_events[0]) {
            // for Mozilla/Opera9.
            // Mozilla, Opera (see further below for it) and webkit nightlies currently support this event
            if (document.addEventListener && !apf.isOpera) {
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
                        document.documentElement.doScroll("left");
                    }
                    catch(error) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }
                    // no exceptions anymore, so we can call the init!
                    apf.load_init();
                }, 10);
            }
            else if (apf.isOpera) {
                document.addEventListener( "DOMContentLoaded", function () {
                    apf.load_timer  = setInterval(function() {
                        for (var i = 0; i < document.styleSheets.length; i++) {
                            if (document.styleSheets[i].disabled)
                                return;
                        }
                        // all is fine, so we can call the init!
                        apf.load_init();
                    }, 10);
                }, false);
            }
            else if (apf.isSafari && !apf.isIphone) {
                var aSheets = documents.getElementsByTagName("link");
                for (var i = aSheets.length; i >= 0; i++) {
                    if (!aSheets[i] || aSheets[i].getAttribute("rel") != "stylesheet")
                        aSheets.splice(i, 0);
                }
                var iSheets = aSheets.length;
                apf.load_timer  = setInterval(function() {
                    if (/loaded|complete/.test(document.readyState)
                      && document.styleSheets.length == iSheets)
                        apf.load_init(); // call the onload handler
                }, 10);
            }
            // for other browsers set the window.onload, but also execute the old window.onload
            else {
                var old_onload = window.onload;
                window.onload  = function () {
                    apf.load_init();
                    if (old_onload)
                        old_onload();
                };
            }
        }
        apf.load_events.push(func);
    },
    
    addListener : function(el, type, fn){
        if (el.addEventListener)
            el.addEventListener(type, fn, false);
        else if (el.attachEvent)
            el.attachEvent('on' + type, fn);
        return this;
    },
    
    removeListener : function(el, type, fn){
        if (el.removeEventListener)
            el.removeEventListener(type, fn, false);
        else if (el.detachEvent)
            el.detachEvent('on' + type, fn);
        return this;
    },

    /* Destroy */

    /**
     * Unloads the aml application.
     */
    destroy : function(exclude){
        //#ifdef __DEBUG
        apf.console.info("Initiating self destruct...");
        //#endif

        this.isDestroying = true;

        //#ifdef __WITH_XFORMS
        var i, models = apf.nameserver.getAll("model");
        for (i = 0; i < models.length; i++)
            models[i].dispatchEvent("xforms-model-destruct");
        //#endif

        //#ifdef __WITH_POPUP
        this.popup.destroy();
        //#endif

        for (i = 0; i < this.all.length; i++) {
            if (this.all[i] && this.all[i] != exclude && this.all[i].destroy)
                this.all[i].destroy(false);
        }

        for (i = this.$amlDestroyers.length - 1; i >= 0; i--)
            this.$amlDestroyers[i].call(this);
        this.$amlDestroyers = undefined;

        // #ifdef __WITH_TELEPORT
        apf.teleport.destroy();
        // #endif

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
    else
        return xmlNode.getElementsByTagNameNS(xmlns, tag);
}

document.documentElement.className += " has_apf"; 
apf.Init.run('apf');
