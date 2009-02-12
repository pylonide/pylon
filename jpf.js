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
 * Javeline Platform
 *
 * @author    Ruben Daniels ruben@javeline.com
 * @version   2.0
 * @url       http://www.ajax.org
 */
var jpf = {
    // Content Distribution Network URL:
    // #ifndef __WITH_CDN
    CDN            : "",
    /* #else
    CDN            : "http://cdn.ajax.org/platform/",
    #endif */

    READY          : false,

    //JML nodeFunc constants
    NODE_HIDDEN    : 101,
    NODE_VISIBLE   : 102,
    NODE_MEDIAFLOW : 103,

    //DOM nodeType constants
    NODE_ELEMENT                : 1,
    NODE_ATTRIBUTE              : 2,
    NODE_TEXT                   : 3,
    NODE_CDATA_SECTION          : 4,
    NODE_ENTITY_REFERENCE       : 5,
    NODE_ENTITY                 : 6,
    NODE_PROCESSING_INSTRUCTION : 7,
    NODE_COMMENT                : 8,
    NODE_DOCUMENT               : 9,
    NODE_DOCUMENT_TYPE          : 10,
    NODE_DOCUMENT_FRAGMENT      : 11,
    NODE_NOTATION               : 12,

    KEYBOARD       : 2,
    KEYBOARD_MOUSE : true,

    SUCCESS : 1,
    TIMEOUT : 2,
    ERROR   : 3,
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
    autoLoadSkin  : false,
    crypto        : {}, //namespace
    _GET          : {},
    basePath      : "./",

    //#ifdef __PARSER_JML
    /**
     * {Object} contains several known and often used namespace URI's.
         * @private
     */
    ns : {
        jpf    : "http://www.javeline.com/2005/jml",
        jml    : "http://www.javeline.com/2005/jml",
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
        this.isOpera = sAgent.indexOf("opera") != -1;

        this.isKonqueror = sAgent.indexOf("konqueror") != -1;
        this.isSafari    = !this.isOpera && ((navigator.vendor
            && navigator.vendor.match(/Apple/) ? true : false)
            || sAgent.indexOf("safari") != -1 || this.isKonqueror);
        this.isSafariOld = false;

        if (this.isSafari) {
            var matches  = sAgent.match(/applewebkit\/(\d+)/);
            if (matches)
                this.isSafariOld = parseInt(matches[1]) < 420;
        }

        this.isChrome    = sAgent.indexOf("chrome/") != -1;
        this.isGecko     = !this.isOpera && !this.isSafari && sAgent.indexOf("gecko") != -1;
        this.isGecko3    = this.isGecko && sAgent.indexOf("firefox/3") != -1;
        this.isIE        = document.all && !this.isOpera && !this.isSafari ? true : false;
        this.isIE50      = this.isIE && sAgent.indexOf("msie 5.0") != -1;
        this.isIE55      = this.isIE && sAgent.indexOf("msie 5.5") != -1;
        this.isIE6       = this.isIE && sAgent.indexOf("msie 6.") != -1;
        this.isIE7       = this.isIE && sAgent.indexOf("msie 7.") != -1;
        this.isIE8       = this.isIE && sAgent.indexOf("msie 8.") != -1;

        this.isWin       = sAgent.indexOf("win") != -1 || sAgent.indexOf("16bit") != -1;
        this.isMac       = sAgent.indexOf("mac") != -1;

        this.isAIR       = sAgent.indexOf("adobeair") != -1;

        //#ifdef __DESKRUN
        try {
            //this.isDeskrun = window.external.shell.runtime == 2;
        }
        catch(e) {
            this.isDeskrun = false;
        }
        //#endif
    },

    /**
     * @private
     */
    setCompatFlags : function(){
        //Set Compatibility
        this.TAGNAME                   = jpf.isIE ? "baseName" : "localName";
        this.supportVML                = jpf.isIE;
        this.supportCanvas             = !jpf.isIE;
        this.supportSVG                = !jpf.isIE;
        this.styleSheetRules           = jpf.isIE ? "rules" : "cssRules";
        this.brokenHttpAbort           = jpf.isIE6;
        this.canUseHtmlAsXml           = jpf.isIE;
        this.supportNamespaces         = !jpf.isIE;
        this.cannotSizeIframe          = jpf.isIE;
        this.supportOverflowComponent  = jpf.isIE;
        this.hasEventSrcElement        = jpf.isIE;
        this.canHaveHtmlOverSelects    = !jpf.isIE6 && !jpf.isIE5;
        this.hasInnerText              = jpf.isIE;
        this.hasMsRangeObject          = jpf.isIE;
        this.hasContentEditable        = jpf.isIE || jpf.isOpera;
        this.descPropJs                = jpf.isIE;
        this.hasClickFastBug           = jpf.isIE;
        this.hasExecScript             = window.execScript ? true : false;
        this.canDisableKeyCodes        = jpf.isIE;
        this.hasTextNodeWhiteSpaceBug  = jpf.isIE;
        this.hasCssUpdateScrollbarBug  = jpf.isIE;
        this.canUseInnerHtmlWithTables = !jpf.isIE;
        this.hasSingleResizeEvent      = !jpf.isIE;
        this.hasStyleFilters           = jpf.isIE;
        this.supportOpacity            = !jpf.isIE;
        this.supportPng24              = !jpf.isIE6 && !jpf.isIE5;
        this.cantParseXmlDefinition    = jpf.isIE50;
        this.hasDynamicItemList        = !jpf.isIE || jpf.isIE7;
        this.canImportNode             = jpf.isIE;
        this.hasSingleRszEvent         = !jpf.isIE;
        this.hasXPathHtmlSupport       = !jpf.isIE;
        this.hasFocusBug               = jpf.isIE;
        this.hasReadyStateBug          = jpf.isIE50;
        this.dateSeparator             = jpf.isIE ? "-" : "/";
        this.canCreateStyleNode        = !jpf.isIE;
        this.supportFixedPosition      = !jpf.isIE || jpf.isIE7;
        this.hasHtmlIdsInJs            = jpf.isIE || jpf.isSafari;
        this.needsCssPx                = !jpf.isIE;
        this.hasAutocompleteXulBug     = jpf.isGecko;
        this.mouseEventBuffer          = jpf.isIE ? 20 : 6;
        this.hasComputedStyle          = typeof document.defaultView != "undefined"
                                           && typeof document.defaultView.getComputedStyle != "undefined";
        this.locale                    = (this.isIE
                                            ? navigator.userLanguage
                                            : navigator.language).toLowerCase();

        //Other settings
        this.maxHttpRetries = this.isOpera ? 0 : 3;

        //#ifdef __WITH_PROPERTY_BINDING
        this.dynPropMatch = new RegExp();
        this.dynPropMatch.compile("^[{\\[].*[}\\]]$");
        //#endif

        //#ifdef __WITH_ANCHORING
        this.percentageMatch = new RegExp();
        this.percentageMatch.compile("([\\-\\d\\.]+)\\%", "g");
        //#endif

        //#ifdef __SUPPORT_GEARS
        jpf.isGears      = !!jpf.initGears() || 0;
        //#endif
    },

    //#ifdef __DEBUG
    /**
     * Restarts the application.
     */
    reboot : function(){
        jpf.console.info("Restarting application...");

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
     */
    start : function(){
        this.started = true;
        var sHref = location.href.split("?")[0];

        //Set Variables
        this.host     = location.hostname;//sHref.replace(/(\/\/[^\/]*)\/.*$/, "$1");
        this.hostPath = sHref.replace(/\/[^\/]*$/, "") + "/";
        this.CWD      = sHref.replace(/^(.*\/)[^\/]*$/, "$1") + "/";

        //#ifdef __DEBUG
        jpf.console.info("Starting Javeline PlatForm Application...");
        jpf.console.warn("This is a debug build of Javeline PlatForm; \
                          beware that execution speed of this build is \
                          <strong>several times</strong> slower than a \
                          release build of Javeline PlatForm.");
        //#endif

        //mozilla root detection
        //try{ISROOT = !window.opener || !window.opener.jpf}catch(e){ISROOT = true}

        //Browser Specific Stuff
        this.browserDetect();
        this.setCompatFlags();

        //#ifdef __DEBUG
        jpf.debugwin.init();
        //#endif

        //Load Browser Specific Code
        // #ifdef __SUPPORT_IE
        if (this.isIE) jpf.runIE();
            //this.importClass(jpf.runIE, true, self);
        // #endif
        // #ifdef __SUPPORT_SAFARI
        if (this.isSafari) jpf.runSafari();
            //this.importClass(jpf.runSafari, true, self);
        // #endif
        // #ifdef __SUPPORT_OPERA
        if (this.isOpera) jpf.runOpera();
            //this.importClass(jpf.runOpera, true, self);
        // #endif
        // #ifdef __SUPPORT_GECKO
        if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
            jpf.runGecko();
            //this.importClass(jpf.runGecko, true, self);
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
        this.Init.addConditional(this.loadIncludes, jpf, ['body', 'xmldb']);
        //@todo, as an experiment I removed 'HTTP' and 'Teleport'

        //IE fix
        try {
            if (jpf.isIE)
                document.execCommand("BackgroundImageCache", false, true);
        }
        catch(e) {};

        //try{jpf.root = !window.opener || !window.opener.jpf;}
        //catch(e){jpf.root = false}
        this.root = true;
    },

    // # ifndef __PACKAGED
    /**
     * @private
     */
    startDependencies : function(){
        if (location.protocol != "file:") {
            jpf.console.warn("You are serving multiple files from a (local)\
                   webserver - please consider using the file:// protocol to \
                   load your files, because that will make your application \
                   load several times faster.\
                   On a webserver, we recommend using a release or debug build \
                   of Javeline Platform.");
        }

        jpf.console.info("Loading Dependencies...");

        var i;
        // Load Kernel Modules
        for (i = 0; i < this.KernelModules.length; i++)
            jpf.include("core/" + this.KernelModules[i], true);

        // Load TelePort Modules
        for (i = 0; i < this.TelePortModules.length; i++)
            jpf.include("elements/teleport/" + this.TelePortModules[i], true);

        // Load Elements
        for (i = 0; i < this.Elements.length; i++) {
            var c = this.Elements[i];
            jpf.include("elements/" + c + ".js", true);
        }

        jpf.Init.interval = setInterval(
            "if (jpf.checkLoadedDeps()) {\
                clearInterval(jpf.Init.interval);\
                jpf.start();\
            }", 100);
    },

    /**
     * @private
     */
    nsqueue   : {},

    /**
     * Offers a way to load modules into a javascript namespace before the root
     * of that namespace is loaded.
     * @private
     */
    namespace : function(name, oNamespace){
        try{
            eval("jpf." + name + " = oNamespace");
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
    //# endif

    //#ifdef __PARSER_JML || __WITH_NS_SUPPORT
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
                    return docEl.attributes[i][jpf.TAGNAME]
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
            throw new Error(jpf.formatErrorString(1018, null,
                "importing class",
                "Could not load reference. Reference is null"));

        //if (!jpf.hasExecScript)
            //return ref();//.call(self);

        if (!strip)
            return jpf.exec(ref.toString(), win);

        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.replace(/\}\s*$/, "");

        //var q = ref.toString().split("\n");q.shift();q.pop();
        //if(!win.execScript) q.shift();q.pop();

        return jpf.exec(q, win);
    },

    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    */
    toString : function(){
        return "[Javeline (jpf)]";
    },

    all : [],

    /**
    * This method inherit all properties and methods to this object from another class
    * @param {Function}    classRef    Class reference
    */
    inherit : function(classRef){
        for (var i=0; i<arguments.length; i++) {
            //#ifdef __DEBUG
            if (!arguments[i]) {
                throw new Error(jpf.formatErrorString(0, this,
                    "Inheriting class",
                    "Could not inherit from '" + classRef + "'",
                    this.$jml));
            }
            //#endif

            arguments[i].call(this);//classRef
        }

        return this;
    },

    /**
    * This method transforms an object into a jpf class based object.
    * @param {Object} oBlank the object which will be transformed
    */
    makeClass : function(oBlank){
        if (oBlank.inherit) return;

        oBlank.inherit = this.inherit;
        oBlank.inherit(jpf.Class);

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
     * @todo deprecate this in favor of jpf.component
     * @deprecated
     */
    register : function(o, tagName, nodeFunc){
        o.tagName  = tagName;
        o.nodeFunc = nodeFunc || jpf.NODE_HIDDEN;

        o.$domHandlers  = {"remove" : [], "insert" : [], "reparent" : [], "removechild" : []};
        o.$propHandlers = {}; //@todo fix this in each component

        if (nodeFunc != jpf.NODE_HIDDEN) {
            o.$booleanProperties = {
                "visible"          : true,
                "focussable"       : true,
                "disabled"         : true,
                "disable-keyboard" : true
            }

            o.$supportedProperties = [
                //#ifdef __WITH_INTERACTIVE
                "draggable", "resizable",
                //#endif
                "focussable", "zindex", "disabled", "tabindex",
                "disable-keyboard", "contextmenu", "visible", "autosize",
                "loadjml", "actiontracker", "alias"];
        }
        else {
            o.$booleanProperties = {}; //@todo fix this in each component
            o.$supportedProperties = []; //@todo fix this in each component
        }

        if (!o.inherit) {
            o.inherit = this.inherit;
            o.inherit(jpf.Class);
            o.uniqueId = this.all.push(o) - 1;
         }

        //#ifdef __DESKRUN
        if(o.nodeFunc == jpf.NODE_MEDIAFLOW)
            DeskRun.register(o);
        //#endif
    },

    /**
     * Finds a jml element based on it's uniqueId
     */
    lookup : function(uniqueId){
        return this.all[uniqueId];
    },

    /**
     * Searches in the html tree from a certain point to find the
     * jml element that is responsible for rendering the specified html
     * element.
     * @param {HTMLElement} oHtml the html context to start the search from.
     */
    findHost : function(o){
        while (o && !o.host && o.parentNode)
            o = o.parentNode;
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
            var sPath = jpf.debugwin ? jpf.debugwin.resPath : jpf.basePath + "core/debug/resources/";
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

        /**
         * @private
         */
        cache : [],

        /**
         * @private
         * @event debug Fires when a message is sent to the console.
         *   object:
         *      {String} message the content of the message.
         */
        write : function(msg, type, subtype, data, forceWin, nodate){
            //if (!jpf.debug) return;
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
            var sPath = jpf.debugwin
                ? jpf.debugwin.resPath
                : jpf.basePath + "core/debug/resources/";

            if (data) {
                msg += "<blockquote style='margin:2px 0 0 0;\
                        background:url(" + sPath + "splus.gif) no-repeat 2px 3px'>\
                        <strong style='width:120px;cursor:default;display:block;padding:0 0 0 17px' \
                        onmousedown='(self.jpf || window.opener.jpf).console.toggle(this.nextSibling, "
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

            if (this.debugType == "window" || this.win && !this.win.closed || forceWin) {
                this.showWindow(msg);
            }

            //if (jpf.debugFilter.match(new RegExp("!" + subtype + "(\||$)", "i")))
            //    return;

            this.debugInfo.push(msg);

            if (jpf.dispatchEvent)
                jpf.dispatchEvent("debug", {message: msg});
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
            this.info(jpf.vardump(obj, null, false).replace(/ /g, "&nbsp;").replace(/</g, "&lt;"));
        }

        //#ifdef __DEBUG
        ,
        /**
         * @private
         */
        debugInfo : [],

        /**
         * @private
         */
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
                this.win.document.write(msg || this.debugInfo.join(""));
            }
        }

        //#endif
    },

    /**
     * Formats a Javeline PlatForm error message.
     * @param {Number}      number      the number of the error. This can be used to look up more information about the error.
     * @param {JMLElement}  control     the jml element that will throw the error.
     * @param {String}      process     the action that was being executed.
     * @param {String}      message     the actual error message.
     * @param {XMLElement}  jmlContext  the xml relevant to the error. For instance a piece of javeline markup language xml.
     */
    formatErrorString : function(number, control, process, message, jmlContext, outputname, output){
        //#ifdef __DEBUG
        var str = ["---- Javeline Error ----"];
        if (jmlContext) {
            if (jmlContext.nodeType == 9)
                jmlContext = jmlContext.documentElement;

            //Determine file context
            var file = jmlContext.ownerDocument.documentElement.getAttribute("filename");
            if (!file && jmlContext.ownerDocument.documentElement.tagName == "html")
                file = location.href;
            file = file
                ? jpf.removePathContext(jpf.hostPath, file)
                : "Unkown filename";

            //Get serialized version of context
            var jmlStr = (jmlContext.outerHTML || jmlContext.xml || jmlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/www.javeline.com\/2005\/jml" \/\>/g, "")
                .replace(/xmlns:j="[^"]*"\s*/g, "");

            //Determine line number
            var diff, linenr = 0, w = jmlContext.previousSibling
                || jmlContext.parentNode && jmlContext.parentNode.previousSibling;
            while(w && w[jpf.TAGNAME] != "body"){
                diff = (w.outerHTML || w.xml || w.serialize()).split("\n").length;
                linenr += diff - 1;
                w = w.previousSibling || w.parentNode
                    && w.parentNode.previousSibling;
            }
            if (w && w[jpf.TAGNAME] != "body")
                linenr = "unknown";
            else if(jmlContext.ownerDocument.documentElement.tagName == "html")
                linenr += jpf.lineBodyStart;

            //Grmbl line numbers are wrong when \n's in attribute space

            //Set file and line number
            str.push("jml file: [line: " + linenr + "] " + file);
        }
        if (control)
            str.push("Control: '"
                + (control.name
                    || (control.$jml ? control.$jml.getAttribute("id") : null)
                    || "{Anonymous}")
                + "' [" + control.tagName + "]");
        if (process)
            str.push("Process: " + process.replace(/ +/g, " "));
        if (message)
            str.push("Message: [" + number + "] " + message.replace(/ +/g, " "));
        if (outputname)
            str.push(outputname + ": " + output);
        if (jmlContext)
            str.push("\n===\n" + jmlStr);
        
        return (jpf.lastErrorMessage = str.join("\n"));
        /*#else
        jpf.lastErrorMessage = message;
        #endif */
    },

    /* Init */

    /**
     * Loads javascript from a url.
     * @param {String} sourceFile the url where the javascript is located.
     */
    include : function(sourceFile, doBase){
        jpf.console.info("including js file: " + sourceFile);

        var sSrc = doBase ? (jpf.basePath || "") + sourceFile : sourceFile;
        if (jpf.isSafariOld || !jpf.started) {
            document.write('<script type="text/javascript" src="' + sSrc + '"><\/script>');
        }
        else {
            var head     = document.getElementsByTagName("head")[0];//$("head")[0]
            var elScript = document.createElement("script");
            elScript.defer = true;
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

    //#ifdef __PARSER_JML

    /**
     * @todo Build this function into the compressor for faster execution
     * @private
     */
    getJmlDocFromString : function(xmlString){
        //replace(/&\w+;/, ""). replace this by something else
        var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "").replace(/&nbsp;/g, " ")
            .replace(/^[\r\n\s]*/, "").replace(/<\s*\/?\s*(?:\w+:\s*)?[\w-]*[\s>\/]/g,
            function(m){ return m.toLowerCase(); });

        if (!this.supportNamespaces)
            str = str.replace(/xmlns\=\"[^"]*\"/g, "");

        //#ifdef __WITH_EXPLICIT_LOWERCASE

        var xmlNode = jpf.getXmlDom(str, null, jpf.debug);
        //if (jpf.xmlParseError) jpf.xmlParseError(xmlNode); //@todo this seems redundant

        // Case insensitive support
        var nodes = xmlNode.selectNodes("//@*[not(contains(local-name(), '.')) and not(translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = local-name())]");
        for (var i=0; i<nodes.length; i++) {
            (nodes[i].ownerElement || nodes[i].selectSingleNode(".."))
                .setAttribute(nodes[i].nodeName.toLowerCase(), nodes[i].nodeValue);
        }
        /* #else

        var xmlNode = jpf.getXmlDom(str);
        if (jpf.xmlParseError) jpf.xmlParseError(xmlNode);

        #endif */

        return xmlNode;
    },

    //#ifdef __WITH_PARTIAL_JML_LOADING
    /**
     * @private
     */
    jmlParts : [],
    //#endif

    /**
     * {Number} parseStrategy
     *   Possible values:
     *   0    auto
     *   1    partial
     *   11   partial from a comment
     *   2    full from serialized document or file fallback
     *   21   full from file
     */
    parseStrategy : 0,

    //#ifdef __WITH_PARTIAL_JML_LOADING
    parsePartialJml : function(docElement){
        //#ifdef __DEBUG
        jpf.console.warn("The jml namespace definition wasn't found \
                          on the root node of this document. We're assuming \
                          you want to load a partial piece of jml embedded\
                          in this document. Starting to search for it now.");
        //#endif

        if (jpf.isIE) {
            var findJml = function(htmlNode){
                //#ifdef __DEBUG
                if (htmlNode.outerHTML.match(/\/>$/)) {
                    throw new Error("Cannot have self closing elements!\n"
                        + htmlNode.outerHTML);
                }
                //#endif

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

                var p = prefix.toLowerCase();
                var xmlNode = jpf.getJmlDocFromString("<div jid='"
                    + (id++) + "' " + strXmlns + ">"
                    + strXml + "</div>").documentElement;

                while(xmlNode.childNodes.length > 1) {
                    xmlNode.removeChild(xmlNode.lastChild);
                }

                jpf.AppNode.appendChild(xmlNode);
            }
        }
        else {
            var findJml = function(htmlNode){
                var strXml = htmlNode.outerHTML
                    .replace(/ _moz-userdefined=""/g, "");

                var p = prefix.toLowerCase();
                var xmlNode = jpf.getJmlDocFromString("<div jid='"
                    + (id++) + "' " + strXmlns + ">"
                    + strXml + "</div>").documentElement;

                while(xmlNode.childNodes.length > 1) {
                    xmlNode.removeChild(xmlNode.lastChild);
                }

                if (jpf.isSafari)
                    xmlNode = jpf.AppNode.ownerDocument.importNode(xmlNode, true);

                jpf.AppNode.appendChild(xmlNode);
            }
        }

        var strHtml = document.body.outerHTML;
        var match = strHtml.match(/(\w+)\s*=\s*["']http:\/\/www\.javeline\.com\/2005\/jml["']/);
        if (!match)
            return false;

        var strXmlns = "xmlns:" + match[0];
        var prefix = (RegExp.$1 || "").toUpperCase();
        if (jpf.isOpera)
            prefix = prefix.toLowerCase();
        if (!prefix)
            return false;

        prefix += ":";

        jpf.AppNode = jpf.getJmlDocFromString("<" + prefix.toLowerCase()
            + "application " + strXmlns + " />").documentElement;

        var temp;
        var cnode, isPrefix = false, id = 0, str, x, node = document.body;
        while (node) {
            isPrefix = node.nodeType == 1
                && node.tagName.substr(0,2) == prefix;

            if (isPrefix) {
                findJml(cnode = node);

                if (jpf.isIE) {
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

                if (jpf.jmlParts.length
                  && jpf.jmlParts[jpf.jmlParts.length-1][1] == cnode)
                    jpf.jmlParts[jpf.jmlParts.length-1][1] = -1;

                jpf.jmlParts.push([node.parentNode, jpf.isIE
                    ? node.nextSibling : node.nextSibling]);
            }
            else if (node.tagName == "SCRIPT" && node.getAttribute("src")
              && (node.getAttribute("src").indexOf("ajax.org") > -1
              || node.getAttribute("src").indexOf("javeline.com") > -1)) {
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
                    var xmlNode = jpf.getJmlDocFromString("<div jid='"
                        + (id++) + "' " + strXmlns + ">"
                        + strXml + "</div>").documentElement;

                    if (jpf.isSafari)
                        xmlNode = jpf.AppNode.ownerDocument.importNode(xmlNode, true);

                    jpf.AppNode.appendChild(xmlNode);

                    jpf.jmlParts.push([node.parentNode, node.nextSibling]);
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
        //#ifdef __WITH_PARTIAL_JML_LOADING
        if (this.parseStrategy == 1 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(jpf.ns.jml) == -1) {
            this.parsePartialJml(docElement);

            if (this.parseStrategy == 1 || jpf.jmlParts.length) {
                //#ifdef __DEBUG
                if (jpf.jmlParts.length)
                    jpf.console.warn("Jml found, parsing...");
                //#endif

                jpf.isParsingPartial = true;

                jpf.loadJmlIncludes(jpf.AppNode);

                if (!self.ERROR_HAS_OCCURRED) {
                    jpf.Init.interval = setInterval(function(){
                        if (jpf.checkLoaded())
                            jpf.initialize();
                    }, 20);
                }

                return;
            }
            else {
                //#ifdef __DEBUG
                    jpf.console.warn("No jml found.");
                //#endif
            }
        }
        //#endif

        //#ifdef __WITH_PARTIAL_JML_LOADING_FROM_COMMENT
        //@todo this strategy needs some updating
        if (this.parseStrategy == 11 || !this.parseStrategy && !docElement
          && document.documentElement.outerHTML.split(">", 1)[0]
             .indexOf(jpf.ns.jml) == -1) {
            //#ifdef __DEBUG
            jpf.console.warn("The jml namespace definition wasn't found \
                              on the root node of this document. We're assuming \
                              you want to load a partial piece of jml embedded\
                              in this document. Starting to search for it now.");
            //#endif

            //Walk tree
            var str, x, node = document.body;
            while (node) {
                if (node.nodeType == 8) {
                    str = node.nodeValue;
                    if  (str.indexOf("[jpf]") == 0) {
                        str = str.substr(5);

                        //#ifdef __DEBUG
                        jpf.console.info("Found a piece of jml. Assuming \
                                          namespace prefix 'j'. Starting \
                                          parsing now.");
                        //#endif

                        x = jpf.getXml("<j:applicaton xmlns:j='"
                            + jpf.ns.jml + "'>" + str + "</j:applicaton>", true);

                        if (jpf.isIE) { //@todo generalize this
                            x.ownerDocument.setProperty("SelectionNamespaces",
                                "xmlns:j='" + jpf.ns.jml + "'");
                        }

                        jpf.loadJmlIncludes(x);
                        jpf.jmlParts.push([x, node]);
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
              && (jpf.jmlParts.length || this.parseStrategy == 11)) {
                jpf.isParsingPartial = true;

                jpf.Init.interval = setInterval(function(){
                    if (jpf.checkLoaded())
                        jpf.initialize();
                }, 20);

                return;
            }
        }
        //#endif

        //#ifdef __WITH_PARSEJMLFROMHTML
        //Load jml without reloading the page, but also fully parse javascript
        //This requires there to be no self closing elements
        if (this.parseStrategy == 2) { //!this.parseStrategy
            if (jpf.isIE) {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<SCRIPT.*SCRIPT>(?:[\r\n]+)?/g, "")
                    .replace(/^<HTM./, "<j:application")//xmlns:j='" + jpf.ns.jml + "'
                    .replace(/HTML>$/, "j:application>")
                    .replace(/(\w+)\s*=\s*([^"'\s]+)\s/g, "$1=\"$2\" ");
            }
            else {
                xmlStr = document.documentElement.outerHTML
                    .replace(/<script.*\/>/g, "") //@todo for debug only
                    .replace(/ _moz-userdefined=""/g, "")
                    .replace(/^<HTM./, "<j:application xmlns='" + jpf.ns.xhtml + "'")
                    .replace(/HTML>$/, "j:application>")
            }

            try {
                docElement = jpf.getJmlDocFromString(xmlStr);

                //Clear Body
                var nodes = document.body.childNodes;
                for (var i=nodes.length-1; i>=0; i--)
                    nodes[i].parentNode.removeChild(nodes[i]);

                /*jpf.AppData = $xmlns(docElement, "body", jpf.ns.xhtml)[0];
                jpf.loadJmlIncludes(jpf.AppData);

                if (!self.ERROR_HAS_OCCURRED) {
                    jpf.Init.interval = setInterval(function(){
                        if (jpf.checkLoaded())
                            jpf.initialize();
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
            //else if (jpf.isIE)
            //    jpf.TAGNAME = "tagName";
        }
        //#endif

        //Load current HTML document as 'second DOM'
        if (this.parseStrategy == 21 || !this.parseStrategy && !docElement) {
            return jpf.oHttp.get((document.body.getAttribute("xmlurl") || location.href).split(/#/)[0],
                function(xmlString, state, extra){
                    if (state != jpf.SUCCESS) {
                        var oError;
                        //#ifdef __DEBUG
                        oError = new Error(jpf.formatErrorString(0, null,
                            "Loading XML application data", "Could not load \
                            XML from remote source: " + extra.message));
                        //#endif

                        if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                            return true;

                        throw oError;
                    }

                    //#ifdef __DEBUG
                    jpf.lineBodyStart = (xmlString.replace(/\n/g, "\\n")
                        .match(/(.*)<body/) || [""])[0].split("\\n").length;
                    //#endif

                    var xmlNode = jpf.getJmlDocFromString(xmlString);

                    //Clear Body
                    if (jpf.isIE)
                        document.body.innerHTML ="";
                    else {
                        var nodes = document.body.childNodes;
                        for (var i=nodes.length-1; i>=0; i--)
                            nodes[i].parentNode.removeChild(nodes[i]);
                    }

                    return jpf.loadIncludes(xmlNode);
                }, {ignoreOffline: true});
        }

        //Parse the second DOM (add includes)

        var prefix = jpf.findPrefix(docElement, jpf.ns.jml);
        if (prefix)
            prefix += ":";
        //#ifdef __SUPPORT_SAFARI2
        if (jpf.isSafariOld || true)
            prefix = "j";

        //#ifdef __DEBUG
        if (!prefix)
            throw new Error(jpf.formatErrorString(0, null,
                "Parsing document",
                "Unable to find Javeline PlatForm namespace definition. \
                 (i.e. xmlns:j=\"" + jpf.ns.jml + "\")", docElement));
        //#endif

        jpf.AppData = jpf.supportNamespaces
            ? docElement.createElementNS(jpf.ns.jml, prefix + ":application")
            : docElement.createElement(prefix + ":application");

        var i, nodes;
        //Head support
        var head = $xmlns(docElement, "head", jpf.ns.xhtml)[0];
        if (head) {
            nodes = head.childNodes;
            for (i = nodes.length-1; i >= 0; i--)
                if (nodes[i].namespaceURI && nodes[i].namespaceURI != jpf.ns.xhtml)
                    jpf.AppData.insertBefore(nodes[i], jpf.AppData.firstChild);
        }

        //Body support
        var body = (docElement.body
            ? docElement.body
            : $xmlns(docElement, "body", jpf.ns.xhtml)[0]);
        for (i = 0; i < body.attributes.length; i++)
            jpf.AppData.setAttribute(body.attributes[i].nodeName,
                body.attributes[i].nodeValue);

        nodes = body.childNodes;
        for (i = nodes.length - 1; i >= 0; i--)
            jpf.AppData.insertBefore(nodes[i], jpf.AppData.firstChild);
        docElement.documentElement.appendChild(jpf.AppData); //Firefox fix for selectNode insertion need...

        /* #else
        jpf.AppData = docElement.body ? docElement.body : docElement.selectSingleNode("/html/body")
        #endif*/

        jpf.loadJmlIncludes(jpf.AppData);

        if ($xmlns(jpf.AppData, "loader", jpf.ns.jml).length) {
            jpf.loadScreen = {
                show : function(){
                    this.oExt.style.display = "block";
                    //this.oExt.style.height = document.body.scrollHeight + "px";
                },

                hide : function(){
                    this.oExt.style.display = "none";
                }
            }

            if (jpf.isGecko || jpf.isSafari)
                document.body.innerHTML = "";

            //#ifdef __SUPPORT_SAFARI
            if (jpf.isSafariOld) {
                var q = jpf.getFirstElement(
                    $xmlns(jpf.AppData, "loader", jpf.ns.jml)[0]).serialize();
                document.body.insertAdjacentHTML("beforeend", q);
                jpf.loadScreen.oExt = document.body.lastChild;
            }
            else
            //#endif
            {
                var htmlNode = jpf.getFirstElement(
                    $xmlns(jpf.AppData, "loader", jpf.ns.jml)[0]);

                //if(jpf.isSafari) jpf.loadScreen = document.body.appendChild(document.importNode(htmlNode, true));
                if (htmlNode.ownerDocument == document)
                    jpf.loadScreen.oExt = document.body.appendChild(
                        htmlNode.cloneNode(true));
                else {
                    document.body.insertAdjacentHTML("beforeend", htmlNode.xml
                        || htmlNode.serialize());
                    jpf.loadScreen.oExt = document.body.lastChild;
                }
            }
        }

        document.body.style.display = "block"; //might wanna make this variable based on layout loading...

        if (!self.ERROR_HAS_OCCURRED) {
            jpf.Init.interval = setInterval(function(){
                if (jpf.checkLoaded())
                    jpf.initialize()
            }, 20);
        }
    },

    /**
     * @private
     */
    checkForJmlNamespace : function(xmlNode){
        if (!xmlNode.ownerDocument.documentElement)
            return false;

        var nodes = xmlNode.ownerDocument.documentElement.attributes;
        for (var found = false, i=0; i<nodes.length; i++) {
            if (nodes[i].nodeValue == jpf.ns.jml) {
                found = true;
                break;
            }
        }

        //#ifdef __DEBUG
        if (!found) {
            throw new Error(jpf.formatErrorString(0, null,
                "Checking for the jml namespace",
                "The Javeline PlatForm xml namespace was not found in "
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
    loadJmlIncludes : function(xmlNode, doSync){
        // #ifdef __WITH_INCLUDES

        var i, nodes, path;
        // #ifdef __DEBUG
        jpf.checkForJmlNamespace(xmlNode);
        // #endif

        var basePath = jpf.getDirname(xmlNode.getAttribute("filename")) || jpf.hostPath;

        nodes = $xmlns(xmlNode, "include", jpf.ns.jml);
        if (nodes.length) {
            xmlNode.setAttribute("loading", "loading");

            for (i = nodes.length - 1; i >= 0; i--) {
                // #ifdef __DEBUG
                if (!nodes[i].getAttribute("src"))
                    throw new Error(jpf.formatErrorString(0, null, "Loading includes", "Could not load Include file " + nodes[i].xml + ":\nCould not find the src attribute."))
                // #endif

                path = jpf.getAbsolutePath(basePath, nodes[i].getAttribute("src"));

                jpf.loadJmlInclude(nodes[i], doSync, path);
            }
        }
        else
            xmlNode.setAttribute("loading", "done");

        nodes = $xmlns(xmlNode, "skin", jpf.ns.jml);
        for (i = 0; i < nodes.length; i++) {
            if (!nodes[i].getAttribute("src") && !nodes[i].getAttribute("name")
              || nodes[i].childNodes.length)
                continue;

            path = nodes[i].getAttribute("src")
                ? jpf.getAbsolutePath(basePath, nodes[i].getAttribute("src"))
                : jpf.getAbsolutePath(basePath, nodes[i].getAttribute("name")) + "/index.xml";

            jpf.loadJmlInclude(nodes[i], doSync, path, true);

            //nodes[i].parentNode.removeChild(nodes[i]);
            nodes[i].setAttribute("j_preparsed", "9999")
        }

        //#ifdef __WITH_SKIN_AUTOLOAD
        //XForms and lazy devs support
        if (!nodes.length && !jpf.skins.skins["default"] && jpf.autoLoadSkin) {
            jpf.console.warn("No skin file found, attempting to autoload the \
                              default skin file: skins.xml");
            jpf.loadJmlInclude(null, doSync, "skins.xml", true);
        }
        //#endif

        //#endif

        return true;
    },

    /**
     * @private
     */
    loadJmlInclude : function(node, doSync, path, isSkin){
        // #ifdef __WITH_INCLUDES

        //#ifdef __DEBUG
        jpf.console.info("Loading include file: " + (path || node && node.getAttribute("src")));
        //#endif

        this.oHttp.get(path || jpf.getAbsolutePath(jpf.hostPath, node.getAttribute("src")),
            function(xmlString, state, extra){
                 if (state != jpf.SUCCESS) {
                    var oError;
                    //#ifdef __DEBUG
                    oError = new Error(jpf.formatErrorString(1007,
                        null, "Loading Includes", "Could not load Include file '"
                        + (path || extra.userdata[0].getAttribute("src"))
                        + "'\nReason: " + extra.message, node));
                    //#endif

                    if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                        return true;

                    //#ifdef __WITH_SKIN_AUTOLOAD
                    //Check if we are autoloading
                    if (!node) {
                        //Fail silently
                        jpf.console.warn("Could not autload skin.");
                        jpf.includeStack[extra.userdata[1]] = true;
                        return;
                    }
                    //#endif

                    throw oError;
                }

                var xmlNode, isTeleport;
                if (!isSkin) {
                    xmlNode = jpf.getJmlDocFromString(xmlString).documentElement;
                    var tagName = xmlNode[jpf.TAGNAME];

                    if (tagName == "skin")
                        isSkin = true;
                    else if (tagName == "teleport")
                        isTeleport = true;
                    else if(tagName != "application") {
                        throw new Error(jpf.formatErrorString(0, null,
                            "Loading Includes",
                            "Could not find handler to parse include file for '"
                            + xmlNode[jpf.TAGNAME]
                            + "' expected 'skin' or 'application'", node));
                    }
                }

                if (isSkin) {
                    //#ifdef __DEBUG
                    if (xmlString.indexOf('xmlns="http://www.w3.org/1999/xhtml"') > -1){
                        jpf.console.warn("Found xhtml namespace as global \
                                          namespace of skin file. This is not \
                                          allowed. Please remove this before \
                                          use in production environments.")
                        xmlString = xmlString.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
                    }
                    //#endif

                    xmlNode = jpf.getJmlDocFromString(xmlString).documentElement;
                    jpf.skins.Init(xmlNode, node, path);
                    jpf.includeStack[extra.userdata[1]] = true;

                    if (jpf.isOpera && extra.userdata[0] && extra.userdata[0].parentNode) //for opera...
                        extra.userdata[0].parentNode.removeChild(extra.userdata[0]);
                }
                else if (isTeleport) {
                    jpf.teleport.loadJml(xmlNode);
                    jpf.includeStack[extra.userdata[1]] = true;
                }
                else {
                    jpf.includeStack[extra.userdata[1]] = xmlNode;//extra.userdata[0].parentNode.appendChild(xmlNode, extra.userdata[0]);
                    extra.userdata[0].setAttribute("iid", extra.userdata[1]);
                }

                xmlNode.setAttribute("filename", extra.url);

                // #ifdef __DEBUG
                jpf.console.info("Loading of " + xmlNode[jpf.TAGNAME].toLowerCase() + " include done from file: " + extra.url);
                // #endif

                jpf.loadJmlIncludes(xmlNode); //check for includes in the include (NOT recursive save)

            }, {
                async         : !doSync,
                userdata      : [node, jpf.includeStack.push(false) - 1],
                ignoreOffline : true
            });

        // #endif
    },
    //#endif

    /**
     * @private
     */
    checkLoaded : function(){
        for (var i = 0; i < jpf.includeStack.length; i++) {
            if (!jpf.includeStack[i]) {
                jpf.console.info("Waiting for: [" + i + "] " + jpf.includeStack[i]);
                return false;
            }
        }

        if (!document.body) return false;

        jpf.console.info("Dependencies loaded");

        return true;
    },

    // #ifndef __PACKAGED
    /**
     * @private
     */
    checkLoadedDeps : function(){
        jpf.console.info("Loading...");

        jpf.Init.addConditional(function(){
            //jpf.dispatchEvent("domready");
        }, null, ["body"]);

        var i;
        for (i = 0; i < this.Modules.length; i++) {
            if (!jpf[this.Modules[i]]) {
                //#ifdef __DEBUG
                jpf.console.info("Waiting for module " + this.Modules[i]);
                //#endif
                return false;
            }
        }

        for (i = 0; i < this.TelePortModules.length; i++) {
            var mod = this.TelePortModules[i].replace(/(^.*\/|^)([^\/]*)\.js$/, "$2");
            if (!jpf[mod]) {
                //#ifdef __DEBUG
                jpf.console.info("Waiting for TelePort module " + mod);
                //#endif
                return false;
            }
        }

        for (i = 0; i < this.Elements.length; i++) {
            if (this.Elements[i].match(/^_base|\//) || this.Elements[i] == "htmlwrapper")
                continue;

            if (!jpf[this.Elements[i]]) {
                //#ifdef __DEBUG
                jpf.console.info("Waiting for component " + this.Elements[i]);
                //#endif
                return false;
            }
        }

        for (i in this.nsqueue) {
            if (this.nsqueue[i] && jpf.namespace(i, this.nsqueue[i])) {
                //#ifdef __DEBUG
                jpf.console.info("Waiting for namespace to come in " + i);
                //#endif
                return false;
            }
        }

        if (!document.body) return false;

        //#ifdef __DEBUG
        jpf.console.info("Dependencies loaded");
        //#endif

        return true;
    },
    //#endif

    /**
     * @private
     */
    initialize : function(){
        // #ifdef __DESKRUN
        if (jpf.initialized) return;
        jpf.initialized = true;
        // #endif

        jpf.console.info("Initializing...");
        clearInterval(jpf.Init.interval);

        // Run Init
        jpf.Init.run(); //Process load dependencies
        
        //#ifdef __WITH_DEFAULT_SKIN
        jpf.skins.defaultSkin = '<?xml version="1.0" encoding="utf-8"?><j:skin xmlns:j="http://www.javeline.com/2005/jml" xmlns="http://www.w3.org/1999/xhtml"><j:bar name="bar"><j:style><![CDATA[#jem.jpf_bar {position: relative;color: #4b4b4b;font-family: Tahoma;font-size: 10px;padding: 10px;border: 1px solid #f3f3f3;cursor: default;margin: 0;background: white url(images/resizehandle.gif) no-repeat right bottom;z-index: 10000;}#jem.jpf_bar img {position: absolute;bottom: 13px;left: 216px;}#jem.jpf_bar .jpf_counter {position: absolute;bottom: 5px;left: 40px;}#jem.jpf_bar .jpf_countdown {position: absolute;bottom: 5px;right: 142px;}#jem.jpf_bar .jpf_volume {position: absolute;bottom: 5px;right: 119px;left: auto;background: none;width: 16px;height: 16px;margin: 0;padding: 0;cursor: pointer;cursor: hand;}#jem.jpf_bar .jpf_volume span {margin: 0;padding: 0;width: 16px;height: 16px;}#jem.jpf_bar .jpf_fullscreen {position: absolute;bottom: 2px;right: 28px;left: auto;width: 14px;background: transparent;cursor: pointer;cursor: hand;}#jem.jpf_bar .jpf_fullscreen span {height:14px;width:14px;margin:3px auto 0 0;}]]></j:style><j:presentation><j:main container="." resize-corner="17"><div class="jpf_bar" id="jem"> </div></j:main></j:presentation></j:bar><j:label name="label"><j:style><![CDATA[#jem .jpf_label{font-size: 8pt;font-family: Tahoma;overflow: hidden;cursor: default;line-height : 1.5em;margin : 0;}#jem .jpf_labelDisabled{color: #bebebe;}#jem .tiny {font-size : 9px;}#jem .error .jpf_label{background : url(images/alert.png) no-repeat 0 0;min-height : 37px;padding : 3px 0 0 45px;}]]></j:style><j:presentation><j:main caption="." for="@for"><div class="jpf_label"> </div></j:main></j:presentation></j:label><j:slider name="slider"><j:style><![CDATA[#jem .jpf_slider {background: url("images/bar_right.png") no-repeat top right;height: 8px;position: relative;font-family: Tahoma;font-size: 9px;text-align: center;position: absolute;bottom: 9px;right: 53px;margin: 0;}#jem .jpf_sliderDisabled {background-position: right -8px;}#jem .jpf_slider .jpf_left {background: url("images/bar_left.png") no-repeat top left;height: 8px;overflow: hidden;margin: 0;margin-right: 4px;}#jem .jpf_sliderDisabled .jpf_left {background-position: left -8px;}#jem .jpf_sliderDisabled .jpf_filledbar {background-position: 0 -8px;}#jem .jpf_slider .jpf_grabber {background: url("images/slider3.png") no-repeat top left;width: 12px;height: 8px;overflow: hidden;position: absolute;margin: 0;}#jem .jpf_sliderDisabled .jpf_grabber {background-position: left -8px;}]]></j:style><j:presentation><j:main slider="div[1]" container="." status2="div[2]/text()" markers="." direction="horizontal"><div class="jpf_slider"><div class="jpf_grabber"> </div><div class="jpf_left"> </div></div></j:main><marker><u> </u></marker></j:presentation></j:slider><j:slider name="slider16"><j:style><![CDATA[#jem .jpf_slider16 {background: url("images/bar16x_right.png") no-repeat top right;width: 300px;height: 16px;position: relative;padding-right: 7px;font-family: Tahoma;font-size: 9px;text-align: center;position: absolute;bottom: 6px;left: 82px;margin: 0;}#jem .jpf_slider16Disabled {background-position: right -16px;}#jem .jpf_slider16 .jpf_left {background: url("images/bar16x_left.png") no-repeat top left;height: 16px;overflow: hidden;margin: 0;}#jem .jpf_slider16Disabled .jpf_left {background-position: left -16px;}#jem .jpf_slider16 .jpf_grabber {background: url("images/rslider16x.png") no-repeat top right;width: 20px;height: 16px;overflow: hidden;position: absolute;margin: 0;}#jem .jpf_slider16Disabled .jpf_grabber {background-position: left -16px;margin-left: 7px;cursor: normal;}#jem .jpf_slider16 .jpf_sldprogress {background: #ddd;display: block;overflow: hidden;height: 4px;margin-left: 6px;margin-top: 6px;z-index: 0;}]]></j:style><j:presentation><j:main slider="div[1]" container="." progress="div[2]" status2="div[2]/text()" markers="." direction="horizontal"><div class="jpf_slider16"><div class="jpf_grabber"> </div><div class="jpf_left"> </div></div></j:main><progress><span class="jpf_sldprogress"></span></progress><marker><u></u></marker></j:presentation></j:slider><j:button name="button"><j:style><![CDATA[#jem .jpf_button {color: #4b4b4b;font-family: Tahoma;font-size: 8pt;height: 21px;width: 34px;overflow: hidden;cursor: default;background: url(images/mediabtn2.png) no-repeat 0 -42px;position: absolute;bottom: 3px;left: 3px;margin: 0;}#jem .jpf_buttonOver {background-position: 0 -21px;}#jem .jpf_buttonDisabled {background-position: 0 -42px;}#jem .jpf_buttonDown {background-position: 0 0px;}#jem .jpf_button span {display: block;background: no-repeat 0 0;width: 11px;height: 10px;margin: 4px auto 0 11px;}]]></j:style><j:presentation><j:main background="span" icon="span"><div class="jpf_button"><span></span></div></j:main></j:presentation></j:button><j:video name="video"><j:style><![CDATA[#jem .jpf_video {line-height:300px;margin:0;padding:0;text-align:center;vertical-align:middle;overflow : hidden;background : black;}#jem .jpf_video #qt_event_source{position : absolute;left : 0;top : 0;}]]></j:style><j:presentation><j:main container="."><div class="jpf_video"></div></j:main></j:presentation></j:video></j:skin>';
        if (!jpf.skins.skins["default"] && jpf.skins.defaultSkin) {
            //#ifdef __DEBUG
            jpf.console.warn("No skin definition found. Using default skin.");
            //#endif

            //var xmlString = jpf.skins.defaultSkin.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
            var xmlNode = jpf.getJmlDocFromString(jpf.skins.defaultSkin).documentElement; //@todo should get preprocessed
            xmlNode.setAttribute("media-path", jpf.CDN + jpf.VERSION + "/images/")
            xmlNode.setAttribute("icon-path", jpf.CDN + jpf.VERSION + "/icons/")
            jpf.skins.Init(xmlNode);
        }
        //#endif

        //#ifdef __WITH_PARTIAL_JML_LOADING
        if (jpf.isParsingPartial) {
            //Form jml parser
            if (!jpf.window) {
                jpf.window          = new jpf.WindowImplementation();
                jpf.document        = new jpf.DocumentImplementation();
                // #ifdef __WITH_ACTIONTRACKER
                jpf.window.document = jpf.document;
                jpf.window.$at      = new jpf.actiontracker();
                jpf.nameserver.register("actiontracker", "default", jpf.window.$at);
                //#endif
            }

            jpf.appsettings.init();
            jpf.hasSingleRszEvent = true;

            var pHtmlNode = document.body;
            var lastChild = pHtmlNode.lastChild;
            jpf.JmlParser.parseMoreJml(jpf.AppNode, pHtmlNode, null,
                true, false);

            var pNode, firstNode, lastBefore = null, next, info, loop = pHtmlNode.lastChild;
            while (loop && lastChild != loop) {
                info = jpf.jmlParts[loop.getAttribute("jid")];
                next = loop.previousSibling;
                if (info) {
                    pNode = info[0];
                    if ("P".indexOf(pNode.tagName) > -1) {
                        lastBefore = pNode.parentNode.insertBefore(jpf.getNode(loop, [0]),
                            pNode);
                    }
                    else {
                        firstNode = jpf.getNode(loop, [0]);
                        while(firstNode){
                            if (firstNode) {
                                lastBefore = pNode.insertBefore(firstNode,
                                    typeof info[1] == "number" ? lastBefore : info[1]);
                            }
                            else {
                                lastBefore = typeof info[1] == "number" ? lastBefore : info[1];
                            }
                            firstNode = jpf.getNode(loop, [0]);
                        }
                    }

                    loop.parentNode.removeChild(loop);
                }
                loop = next;
            }

            // #ifdef __WITH_ALIGNMENT || __WITH_ANCHORING || __WITH_GRID
            setTimeout("jpf.layout.forceResize();");
            // #endif
        }
        else
        //#endif
        {
            // Start application
            if (jpf.JmlParser && jpf.AppData)
                jpf.JmlParser.parse(jpf.AppData);

            if (jpf.loadScreen && jpf.appsettings.autoHideLoading)
                jpf.loadScreen.hide();
        }
    },

    addDomLoadEvent: function(func) {
        if (!this.$bdetect)
            this.browserDetect();

        // create event function stack
        var load_events = [],
            load_timer,
            done   = arguments.callee.done,
            exec,
            init   = function () {
                if (done) return;
                // kill the timer
                clearInterval(load_timer);
                load_timer = null;
                done       = true;
                // execute each function in the stack in the order they were added
                var len = load_events.length;
                while (len--) {
                    (load_events.shift())();
                }
            };

        if (func && !load_events[0]) {
            // for Mozilla/Opera9.
            // Mozilla, Opera (see further below for it) and webkit nightlies currently support this event
            if (document.addEventListener && !jpf.isOpera) {
                // We're using "window" and not "document" here, because it results
                // in a memory leak, especially in FF 1.5:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=241518
                // See also:
                // http://bitstructures.com/2007/11/javascript-method-callbacks
                // http://www-128.ibm.com/developerworks/web/library/wa-memleak/
                window.addEventListener("DOMContentLoaded", init, false);
            }
            // If IE is used and is not in a frame
            else if (jpf.isIE && window == top) {
                load_timer = setInterval(function() {
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
                    init();
                }, 10);
            }
            else if (jpf.isOpera) {
                document.addEventListener( "DOMContentLoaded", function () {
                    load_timer  = setInterval(function() {
                        for (var i = 0; i < document.styleSheets.length; i++) {
                            if (document.styleSheets[i].disabled)
                                return;
                        }
                        // all is fine, so we can call the init!
                        init();
                    }, 10);
                }, false);
            }
            else if (jpf.isSafari) {
                var aSheets = documents.getElementsByTagName("link");
                for (var i = aSheets.length; i >= 0; i++) {
                    if (!aSheets[i] || aSheets[i].getAttribute("rel") != "stylesheet")
                        aSheets.splice(i, 0);
                }
                var iSheets = aSheets.length;
                load_timer  = setInterval(function() {
                    if (/loaded|complete/.test(document.readyState)
                      && document.styleSheets.length == iSheets)
                        init(); // call the onload handler
                }, 10);
            }
            // for other browsers set the window.onload, but also execute the old window.onload
            else {
                var old_onload = window.onload;
                window.onload  = function () {
                    init();
                    if (old_onload)
                        old_onload();
                };
            }
        }
        load_events.push(func);
    },

    /* Destroy */

    /**
     * Unloads the jml application.
     */
    destroy : function(exclude){
        //#ifdef __DEBUG
        jpf.console.info("Initiating self destruct...");
        //#endif

        this.isDestroying = true;

        //#ifdef __WITH_XFORMS
        var i, models = jpf.nameserver.getAll("model");
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

        for (i = this.$jmlDestroyers.length - 1; i >= 0; i--)
            this.$jmlDestroyers[i].call(this);
        this.$jmlDestroyers = undefined;

        // #ifdef __WITH_TELEPORT
        jpf.teleport.destroy();
        // #endif

        //#ifdef __WITH_XMLDATABASE
        if (jpf.xmldb)
            jpf.xmldb.unbind(jpf.window);
        //#endif

        this.isDestroying = false;
    }
};

/*
 * Replacement for getElementsByTagNameNS because some browsers don't support
 * this call yet.
 */
var $xmlns = function(xmlNode, tag, xmlns, prefix){
    if (!jpf.supportNamespaces) {
        if (!prefix)
            prefix = jpf.findPrefix(xmlNode, xmlns);

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

jpf.Init.run('jpf');
