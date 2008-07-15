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
* @projectDescription 	Javeline Platform
*
* @author	Ruben Daniels ruben@javeline.nl
* @version	1.0
* http://java.sun.com/j2se/javadoc/writingdoccomments/
* http://www.scriptdoc.org/specification.htm
*/

/*#ifdef __JFWVERSION
VERSION        = __JFWVERSION;
#else*/
VERSION        = false;
//#endif

DOC_NODE       = 100;
NOGUI_NODE     = 101;
GUI_NODE       = 102;
KERNEL_MODULE  = 103;
MF_NODE        = 104;

//CGI VARS
var HTTP_GET_VARS={}, vars = location.href.split(/[\?\&\=]/);
for (var k = 1; k < vars.length; k += 2)
    HTTP_GET_VARS[vars[k]] = vars[k + 1] || "";

Array.prototype.dataType    = "array";
Number.prototype.dataType   = "number";
Date.prototype.dataType     = "date";
Boolean.prototype.dataType  = "boolean";
String.prototype.dataType   = "string";
RegExp.prototype.dataType   = "regexp";
Function.prototype.dataType = "function";

//Start of the Javeline PlatForm namespace
jpf = {
    AppData       : null,
    IncludeStack  : [],
    isInitialized : false,
    autoLoadSkin  : false,
    
    //#ifdef __DEBUG
    debug         : true,
    debugType     : "Memory",
    debugFilter   : "!teleport",
    /* #else
    debug : false,
    #endif */
    
    browserDetect : function(){
        var sAgent = navigator.userAgent.toLowerCase();
        
        //Browser Detection
        this.isOpera = sAgent.indexOf("opera") != -1;
        
        this.isKonqueror = sAgent.indexOf("konqueror") != -1;
        this.isSafari    = !this.isOpera && ((navigator.vendor
            && navigator.vendor.match(/Apple/) ? true : false)
            || sAgent.indexOf("safari") != -1 || this.isKonqueror);
        this.isSafariOld = false;
        if (this.isSafari) {
            var matches = navigator.userAgent.match(/AppleWebKit\/(\d+)/);
            if (matches)
                this.isSafariOld = parseInt(matches[1]) < 420;
        }
        
        this.isGecko     = !this.isOpera && !this.isSafari && sAgent.indexOf("gecko") != -1;
        this.isGecko3    = this.isGecko && sAgent.indexOf("firefox/3") != -1;
        this.isIE        = document.all && !this.isOpera && !this.isSafari ? true : false;
        this.isIE50      = this.isIE && sAgent.indexOf("5.0") != -1;
        this.isIE55      = this.isIE && sAgent.indexOf("5.5") != -1;
        this.isIE6       = this.isIE && sAgent.indexOf("6.") != -1;
        this.isIE7       = this.isIE && sAgent.indexOf("7.") != -1;
        
        if(this.onbrowsercheck) this.onbrowsercheck();
    },
    
    setCompatFlags : function(){
        //Set Compatibility
        this.TAGNAME                   = jpf.isIE ? "baseName" : "localName";
        this.hasContentEditable        = jpf.isIE || jpf.isSafari;
        this.styleSheetRules           = jpf.isIE ? "rules" : "cssRules";
        this.brokenHttpAbort           = jpf.isIE6;
        this.canUseHtmlAsXml           = jpf.isIE;
        this.supportNamespaces         = !jpf.isIE;
        this.cannotSizeIframe          = jpf.isIE;
        this.supportOverflowComponent  = jpf.isIE;
        this.hasDocumentFragment       = !jpf.isIE55;
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
        this.canUseInnerHtmlWithTables = !jpf.isIE;
        this.hasSingleResizeEvent      = !jpf.isIE;
        this.hasStyleFilters           = jpf.isIE;
        this.cantParseXmlDefinition    = jpf.isIE50;
        this.hasDynamicItemList        = !jpf.isIE || jpf.isIE7;
        this.canImportNode             = jpf.isIE;
        this.hasSingleRszEvent         = !jpf.isIE;
        this.hasXPathHtmlSupport       = !jpf.isIE;
        this.hasReadyStateBug          = jpf.isIE50;
        this.dateSeparator             = jpf.isIE ? "-" : "/";
        this.canInsertGlobalCode       = !jpf.isSafari && !jpf.isGecko;
        this.canCreateStyleNode        = !jpf.isIE;
        this.supportFixedPosition      = !jpf.isIE || jpf.isIE7;
        this.hasHtmlIdsInJs            = jpf.isIE && jpf.isSafari;
        this.hasComputedStyle          = typeof document.defaultView != "undefined"
                                           && typeof document.defaultView.getComputedStyle != "undefined"
        
        //Other settings
        this.maxHttpRetries = this.isOpera ? 0 : 3;
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.dynPropMatch = new RegExp();
        this.dynPropMatch.compile("^[{\\[].*[}\\]]$");
        //#endif
    },
    
    start : function(){
        sHref = location.href.split("?")[0];
        
        //Set Variables
        this.host     = sHref.replace(/(\/\/[^\/]*)\/.*$/, "$1");
        this.hostPath = sHref.replace(/\/[^\/]*$/, "") + "/";
        this.CWD      = sHref.replace(/^(.*\/)[^\/]*$/, "$1") + "/";
        
        //#ifdef __STATUS
        jpf.status("Starting Javeline PlatForm Application...");
        //#endif

        //mozilla root detection
        //try{ISROOT = !window.opener || !window.opener.jpf}catch(e){ISROOT = true}
        
        //Browser Specific Stuff
        this.browserDetect();
        this.setCompatFlags();
        
        // #ifdef __DESKRUN
        if (this.isIE) {
            try {
                this.hasDeskRun = window.external && window.external.shell
                  && window.external.shell.version && window.external.shell.runtime == 2;
            }
            catch(e) {
                this.hasDeskRun = false;
            }
            try {
                this.hasWebRun = !this.hasDeskRun && jdshell.runtime == 1;
            }
            catch (e) {
                this.hasWebRun = false;
            }
        }
        /* #else
        this.hasDeskRun = this.hasWebRun = false;
        #endif*/
                
        //Load Browser Specific Code
        // #ifdef __SUPPORT_IE
        if (this.isIE)
            this.importClass(runIE, true, self);
        // #endif
        // #ifdef __SUPPORT_Safari
        if (this.isSafari)
            this.importClass(runSafari, true, self);
        // #endif
        // #ifdef __SUPPORT_Opera
        if (this.isOpera)
            this.importClass(runOpera, true, self);
        // #endif
        // #ifdef __SUPPORT_Gecko
        if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
            this.importClass(runGecko, true, self);
        // #endif
        runGecko = runOpera = runSafari = runIE = runXpath
            = runNonIe = runXslt = undefined;
        
        // Start HTTP object
        this.oHttp = new this.http();
        
        // Load user defined includes
        this.Init.addConditional(this.loadIncludes, null,
            ['BODY', 'HTTP', 'XMLDatabase', 'Teleport']);
        
        //IE fix
        try {
            if (jpf.isIE) document.execCommand("BackgroundImageCache", false, true);
        }
        catch(e) {};
        
        //try{jpf.root = !window.opener || !window.opener.jpf;}
        //catch(e){jpf.root = false}
        this.root = true;
        
        //#ifdef __DEBUG
        jpf.debugwin.init();
        //#endif
    },
    
    // #ifndef __PACKAGED
    startDependencies : function(){
        jpf.status("Loading Dependencies...");
        
        // Load Kernel Modules
        for (var i = 0; i < this.KernelModules.length; i++)
            jpf.include("core/" + this.KernelModules[i], true);
        
        // Load TelePort Modules
        for (var i = 0; i < this.TelePortModules.length; i++)
            jpf.include("teleport/" + this.TelePortModules[i], true);
        
        // Load Components
        for (var i = 0; i < this.Components.length; i++)
            jpf.include("components/" + this.Components[i] + ".js", true);
        
        jpf.Init.interval = setInterval(
            "if (jpf.checkLoadedDeps()) {\
                clearInterval(jpf.Init.interval);\
                jpf.start();\
            }", 100);
    },
    //#endif

    //#ifdef __WITH_APP
    ns : {
        jpf    : "http://www.javeline.com/2005/PlatForm",
        xsd    : "http://www.w3.org/2001/XMLSchema",
        xhtml  : "http://www.w3.org/1999/xhtml",
        xslt   : "http://www.w3.org/1999/XSL/Transform",
        xforms : "http://www.w3.org/2002/xforms",
        ev     : "http://www.w3.org/2001/xml-events"
    },
    
    findPrefix : function(xmlNode, xmlns){
        if (xmlNode.nodeType == 9) {
            if (!xmlNode.documentElement) return false;
            if (xmlNode.documentElement.namespaceURI == xmlns)
                return xmlNode.prefix || xmlNode.scopeName;
            var docEl = xmlNode.documentElement;
        }
        else {
            if (xmlNode.namespaceURI == xmlns)
                return xmlNode.prefix || xmlNode.scopeName;
            var docEl = xmlNode.ownerDocument.documentElement;
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
    
    //These should probably be moved to patches
    getWindowWidth : function(){
        return (jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth);
    },
    
    getWindowHeight : function(){
        return (jpf.isIE ? document.documentElement.offsetHeight : window.innerHeight);
    },
    
    getElement : function(parent, nr){
        var nodes = parent.childNodes;
        for (var j=0, i=0; i<nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
            if (j++ == nr)
                return nodes[i];
        }
    },
    
    cancelBubble : function(e, o){
        e.cancelBubble = true;
        if (o.focussable && !o.disabled)
            jpf.window.__focus(o);
    },
    
    /**
    * This method returns a string representation of the object
    * @return {String}	Returns a string representing the object.
    * @method
    */
    toString : function(){
        return "[Javeline (jpf)]";
    },
    
    all : [],
    
    /**
    * This method inherit all properties and methods to this object from another class
    * @param {Function}	classRef	Required Class reference 
    * @method
    */
    inherit : function(classRef){
        for (var i=0; i<arguments.length; i++) {
            //#ifdef __DEBUG
            if (!arguments[i]) {
                throw new Error(0, jpf.formErrorString(0, this, "Inheriting baseclasses", "Could not inherit class; Class is not loaded yet", this.jml));
            }
            //#endif
            
            arguments[i].call(this);//classRef
        }
        
        return this;
    },
    
    /**
    * This method transforms an object into a Javeline Class
    * @param {Object}	oBlank Required Object to be transformed into a Javeline Class
    * @method
    */
    makeClass : function(oBlank){
        if (oBlank.inherit) return;
        
        oBlank.inherit = this.inherit;
        oBlank.inherit(jpf.Class);
        
        oBlank.uniqueId = this.all.push(oBlank) - 1;
    },
    
    /* ******** BROWSER FEATURES ***********
        Compatibility Methods and functions
    **************************************/

    /**
    * This method sets a single CSS rule 
    * @param {String}	name Required CSS name of the rule (i.e. '.cls' or '#id')
    * @param {String}	type Required CSS property to change
    * @param {String}	value Required CSS value of the property
    * @param {String}	stylesheet Optional Name of the stylesheet to change 
    * @method
    */	
    setStyleRule : function(name, type, value, stylesheet){
        var rules = document.styleSheets[stylesheet || 0][jpf.styleSheetRules];
        for (var i = 0; i < rules.length; i++) {
            if (rules.item(i).selectorText == name) {
                rules.item(i).style[type] = value;
                return;
            }
        }
    },
    
    setStyleClass : function(oEl, className, exclusion, special){
        if (!oEl || this.disabled) return;
        if (!exclusion)
            exclusion = [];
        exclusion.push(className);

        //Remove defined classes
        var re = new RegExp("(?:(^| +)" + exclusion.join("|") + "($| +))", "gi");

        //Set new class
        oEl.className != null 
            ? (oEl.className = oEl.className.replace(re, " ") + " " + className)
            : oEl.setAttribute("class", (oEl.getAttribute("class") || "")
                .replace(re, " ") + " " + className);

        return oEl;
    },

    /**
    * This method imports a CSS stylesheet from a string 
    * @param {Object}	doc Required Reference to the document where the CSS is applied on
    * @param {String}	cssString Required String containing the CSS definition 
    * @param {String}	media Optional The media to which this CSS applies (i.e. 'print' or 'screen')
    * @method
    */
    importCssString : function(doc, cssString, media){
        var htmlNode = doc.getElementsByTagName("head")[0];//doc.documentElement.getElementsByTagName("head")[0];

        if (jpf.canCreateStyleNode) {
            var head  = document.getElementsByTagName("head")[0];
            var style = document.createElement("style");
            style.appendChild(document.createTextNode(cssString));
            head.appendChild(style);
        }
        else {
            htmlNode.insertAdjacentHTML("beforeend", ".<style media='"
             + (media || "all") + "'>" + cssString + "</style>");
            
            /*if(document.body){
                document.body.style.height = "100%";
                setTimeout('document.body.style.height = "auto"');
            }*/
        }
    },

    /**
    * This method retrieves the current value of a property on a HTML element
    * @param {HTMLElement}	el Required The element to read the property from
    * @param {String}	prop Required The property to read 
    * @method
    */
    getStyle : function(el, prop) {
        return jpf.hasComputedStyle
            ? document.defaultView.getComputedStyle(el,'').getPropertyValue(prop)
            : el.currentStyle[prop];
    },
    
    getStyleRecur : function(el, prop) {
        var value = jpf.hasComputedStyle
            ? document.defaultView.getComputedStyle(el,'').getPropertyValue(
                prop.replace(/([A-Z])/g, function(m, m1){
                    return "-" + m1.toLowerCase();
                }))
            : el.currentStyle[prop]

        return ((!value || value == "transparent" || value == "inherit")
          && el.parentNode && el.parentNode.nodeType == 1)
            ? this.getStyleRecur(el.parentNode, prop)
            : value;
    },
    
    //Attempt to fix memory leaks
    removeNode : function (element) {
        if (!element) return;
        
        if (!jpf.isIE) {
            if (element.parentNode)
                element.parentNode.removeChild(element);
            return;
        }
        
        var garbageBin = document.getElementById('IELeakGarbageBin');
        if (!garbageBin) {
            garbageBin    = document.createElement('DIV');
            garbageBin.id = 'IELeakGarbageBin';
            garbageBin.style.display = 'none';
            document.body.appendChild(garbageBin);
        }
    
        // move the element to the garbage bin
        garbageBin.appendChild(element);
        garbageBin.innerHTML = '';
    },
    
    uniqueHtmlIds   : 0,
    
    setUniqueHtmlId : function(oHtml){
        oHtml.setAttribute("id", "q" + this.uniqueHtmlIds++);
    },
    
    getUniqueId : function(oHtml){
        return this.uniqueHtmlIds++;
    },

    /* ******** NODE METHODS ***********
        Methods to help Javeline Nodes
    **********************************/

    register : function(o, tagName, nodeType){
        o.tagName  = tagName;
        o.nodeType = nodeType || NOGUI_NODE;
        o.ownerDocument = this.document;
        
        this.makeClass(o);
        
        //#ifdef __DESKRUN
        if(o.nodeType == MF_NODE)
            DeskRun.register(o);
        //#endif
    },
    
    lookup : function(uniqueId){
        return this.all[uniqueId];
    },

    findHost : function(o){
        var node = o;
        while (o && !o.host && o.parentNode)
            o = o.parentNode;
        return (o && o.host && typeof o.host != "string") ? o.host : false;
    },

    /* ******** SETREFERENCE ***********
        Set Reference to an object by name
    
        INTERFACE:
        this.setReference(name, o, global);
    ****************************/
    setReference : function(name, o, global){
        if (self[name] && self[name].hasFeature) return;
        return (self[name] = o);
    },
    
    //#ifdef __WITH_SMARTBINDINGS
    getRules : function(node){
        var rules = {};
        
        for (var w = node.firstChild; w; w = w.nextSibling){
            if (w.nodeType != 1)
                continue;
            else {
                if (!rules[w[jpf.TAGNAME]])
                    rules[w[jpf.TAGNAME]] = [];
                rules[w[jpf.TAGNAME]].push(w);
            }
        }
        
        return rules;
    },
    //#endif

    /* ******** NODE METHODS ***********
        Debug functions
    **********************************/

    status : function(str){
        //#ifdef __DEBUG
        if (!jpf.debug) return;
        
        if (false && jpf.isOpera)
            status = str; //else if(jpf.hasDeskRun || jpf.hasWebRun)	lp.Write("STATUS",str);
        else if (jpf) {
            var dt   = new Date();
            var date = dt.getHours() + ":" + dt.getMinutes() + ":"
                + dt.getSeconds() + ":" + dt.getMilliseconds();	
            jpf.debugMsg("[" + date + "] " + str.replace(/\n/g, "<br />")
                .replace(/\t/g,"&nbsp;&nbsp;&nbsp;") + "<br />", "status");
        }
        else
            document.title = str;
        //#endif
    },
    
    issueWarning : function(nr, msg){
        //#ifdef __DEBUG
        if (!self.jpf.debug) return;
        
        //needs implementation
        if (jpf.warnings[msg]) return;
    
        //var seeAgain = confirm("Javelin Notification\nA warning has been issued\n\nNumber: " + nr + "\nWarning: " + msg + "\n\nPress OK to see this warning again.");
        //if(!seeAgain) jpf.warnings[msg] = true;
        
        jpf.status("[WARNING]:" + msg.replace(/\n/g, "<br />"));
        jpf.warnings[msg] = true;
        //#endif
    },

    //#ifdef __DEBUG
    warnings  : {},
    debugInfo : "",

    debugMsg : function(msg, type, forceWin){
        if (!jpf.debug) return;

        if (jpf.debugFilter.match(new RegExp("!" + type + "(\||$)", "i")))
            return;
        if (jpf.debugType.toLowerCase() == "window" || this.win
          && !this.win.closed || forceWin) {
            this.win = window.open("", "debug");
            if (!this.win) {
                if (!this.haspopupkiller)
                    alert("Could not open debug window, please check your popupkiller");
                this.haspopupkiller = true;
            }
            else
                this.win.document.write(msg);
        }
        
        this.debugInfo += msg;

        if (this.ondebug)
            this.ondebug(msg);
    },

    showDebug : function(){
        this.win = window.open("", "debug");
        this.win.document.write(this.debugInfo);
    },
    
    //#endif
    
    formErrorString : function(number, control, process, message, jmlContext, outputname, output){
        var str = ["---- Javeline Error ----"];
        if (jmlContext) {
            if (jmlContext.nodeType == 9)
                jmlContext = jmlContext.documentElement;
            var c = jmlContext.ownerDocument.outerHTML || (jmlContext.ownerDocument.xml
                || jmlContext.ownerDocument.serialize()) || "";
            var jmlStr = (jmlContext.outerHTML || jmlContext.xml || jmlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/www.javeline.net\/j" \/\>/g, "")
                .replace(/xmlns:j="[^"]*"\s*/g, "");
            var linenr = c.substr(0, c.indexOf(jmlStr)).split("\n").length;
            str.push("jml file: [line: ", linenr, "] ",
                jpf.removePathContext(jpf.hostPath, jmlContext.ownerDocument
                  .documentElement.getAttribute("filename")));
        }
        if (control)
            str.push("Control: '", (control.name||(control.jml
                ? control.jml.getAttribute("id")
                : null) || "{Anonymous}"), "' [", control.tagName, "]");
        if (process)
            str.push("Process: ", process);
        if (message)
            str.push("Message: [", number, "] ", message);
        if (outputname)
            str.push(outputname, ": ", output);
        if (jmlContext)
            str.push("\n===\n", jmlStr);

        return str.join("\n");
    },
    
    //throw new Error(1101, jpf.formErrorString(1101, this, null, "A dropdown with a bind='' attribute needs a smartbinding='' attribute or have <j:Item /> children.", "JML", this.jml.outerHTML));
    
    //#ifdef __WITH_DRAGMODE
    /* ******** DRAGMODE ***********
        Drag Mode - Handles Drag&Drop Methods on Body
    *******************************/
    DragMode : {
        modes : {},

        removeMode : function(mode){
            this.modes[mode] = null;
        },
        
        defineMode : function(mode, struct){
            this.modes[mode] = struct;
        },

        setMode : function(mode){
            for (prop in this.modes[mode])
                if (prop.match(/^on/))
                    document.body[prop] = this.modes[mode][prop];

            this.mode = mode;
        },

        clear : function(){
            for (prop in this.modes[this.mode])
                if (prop.match(/^on/))
                    document.body[prop] = null;
                    
            this.mode = null;
        }
    },
    //#endif

    //#ifdef __WITH_PLANE
    Plane : {
        init : function(){
            if (!this.plane) {
                this.plane                  = document.createElement("DIV");
                this.plane.style.background = "url(spacer.gif)";
                this.plane.style.position   = "absolute";
                this.plane.style.zIndex     = 99999;
                this.plane.style.left       = 0;
                this.plane.style.top        = 0;
            }
        },

        show : function(o){
            this.init();
            
            this.current = o;
            this.lastZ = this.current.style.zIndex;
            this.current.style.zIndex = 100000;

            o.parentNode.appendChild(this.plane);
            var p = (document.body == this.plane.parentNode)
                ? document.documentElement : this.plane.parentNode;

            this.plane.style.display = "block";
            this.plane.style.left    = p.scrollLeft;
            this.plane.style.top     = p.scrollTop;
            
            var diff = jpf.isOpera ? [0,0] : jpf.compat.getDiff(p); //Bug Opera
            this.plane.style.width  = (p.offsetWidth - diff[0]) + "px";
            this.plane.style.height = (p.offsetHeight - diff[1]) + "px";
            
            return this.plane;
        },

        hide : function(){
            this.plane.style.display  = "none";
            this.current.style.zIndex = this.lastZ;
            
            return this.plane;
        }
    },
    //#endif
    
    //#ifdef __WITH_POPUP
    Popup : {
        cache      : {},
        setContent : function(cacheId, content, style, width, height){
            if (!this.popup) this.init();

            this.cache[cacheId] = {
                content : content,
                style   : style,
                width   : width,
                height  : height
            };
            content.style.position = "absolute";
            //if(content.parentNode) content.parentNode.removeChild(content);
            //if(style) jpf.importCssString(this.popup.document, style);
            
            return content.ownerDocument;
        },
        
        removeContent : function(cacheId){
            this.cache[cacheId] = null;
            delete this.cache[cacheId];
        },
        
        init : function(){
            //consider using iframe
            this.popup = {};
        },
        
        show : function(cacheId, x, y, animate, ref, width, height, callback){
            if (!this.popup) this.init();
            if (this.last != cacheId) this.hide();
            
            var o = this.cache[cacheId];
            //if(this.last != cacheId) 
            //this.popup.document.body.innerHTML = o.content.outerHTML;

            var popup = o.content;
            o.content.onmousedown  = function(e) {
                (e || event).cancelBubble = true;
            };
            o.content.style.zIndex = 10000000;
            //o.content.style.display = "block";
            
            var pos    = jpf.compat.getAbsolutePosition(ref);//[ref.offsetLeft+2,ref.offsetTop+4];//
            var top    = y + pos[1];
            var p      = jpf.compat.getOverflowParent(o.content); 
            var moveUp = (top + height + y) > (p.offsetHeight + p.scrollTop);
            
            popup.style.top = top + "px";
            popup.style.left = (x+pos[0]) + "px";
            popup.style.width = ((width || o.width)-3) + "px";

            if (animate) {
                var iVal, steps = 7, i = 0;
                
                iVal = setInterval(function(){
                    var value = ++i * ((height || o.height) / steps);
                    popup.style.height = value + "px";
                    if (moveUp)
                        popup.style.top = (top - value - y) + "px"
                    else
                        popup.scrollTop = -1 * (i - steps - 1) * ((height || o.height) / steps);
                    popup.style.display = "block";
                    if (i > steps) {
                        clearInterval(iVal)
                        callback(popup);
                    }
                }, 10);
            }
            else {
                popup.style.height = (height || o.height) + "px"
            }

            this.last = cacheId;
        },
        
        hide : function(){
            if (this.cache[this.last])
                this.cache[this.last].content.style.display = "none";
            //if(this.popup) this.popup.hide();
        },
        
        forceHide : function(){
            if (this.last) {
                var o = jpf.lookup(this.last);
                if (!o)
                    this.last = null;
                else
                    o.dispatchEvent("onpopuphide");
            }
        },
        destroy : function(){
            if (!this.popup) return;
            //this.popup.document.body.c = null;
            //this.popup.document.body.onmouseover = null;
        }
    },
    //#endif
    
    /* Init */
    
    include : function(sourceFile, doBase){
        jpf.status("including js file: " + sourceFile);
        
        var head     = document.getElementsByTagName("head")[0];
        var elScript = document.createElement("script");
        elScript.defer = true;
        elScript.src   = doBase ? (jpf.basePath || "") + sourceFile : sourceFile;
        head.appendChild(elScript);
    },
    
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
    
    //#ifdef __WITH_PARSER
    
    //case sensitivity... is this too much??
    getJmlDocFromString : function(xmlString){
        //replace(/&\w+;/, ""). replace this by something else
        var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "").replace(/&nbsp;/g, " ")
            .replace(/^[\r\n\s]*/, "").replace(/<\s*\/?\s*\w+:\s*[\w-]*[\s>\/]/g,
            function(m){ return m.toLowerCase(); });

        if (!this.supportNamespaces)
            str = str.replace(/xmlns\=\"[^"]*\"/g, "");
        
        var xmlNode = jpf.getObject("XMLDOM", str);
        if (jpf.xmlParseError) jpf.xmlParseError(xmlNode);
        
        // Case insensitive support
        var nodes = xmlNode.selectNodes("//@*[not(contains(local-name(), '.')) and not(translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = local-name())]");
        for (var i=0; i<nodes.length; i++) {
            (nodes[i].ownerElement || nodes[i].selectSingleNode(".."))
                .setAttribute(nodes[i].nodeName.toLowerCase(), nodes[i].nodeValue);
        }
            
        return xmlNode;
    },
 
    loadIncludes : function(docElement){
        //Load current HTML document as 'second DOM'
        
        /* #ifndef __WITH_APP || __WITH_XMLDATABASE
        jpf.canUseHtmlAsXml = false;
        #endif */
        
        if ((!jpf.canUseHtmlAsXml || document.body.getAttribute("mode") != "html") && !docElement) {
            return new jpf.http().getString((document.body.getAttribute("xmlurl") || location.href).split(/#/)[0],
                function(xmlString, status, extra){
                    if (status != __HTTP_SUCCESS__) {
                        if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries)
                            return extra.tpModule.retry(extra.id);
                        else {
                            var commError = new Error(0, jpf.formErrorString(0, null, "Loading XML application data", "Could not load XML from remote source: " + extra.message));
                            if (jpf.document.dispatchEvent("onerror", jpf.extend({error : commError, state : status}, extra)) !== false)
                                throw commError;
                            return;
                        }
                    }
                    
                    var xmlNode = jpf.getJmlDocFromString(xmlString);
                    
                    //#ifdef __WITH_APP
                    
                    //Clear Body
                    if (jpf.isIE)
                        document.body.innerHTML ="";
                    else {
                        var nodes = document.body.childNodes;
                        for (var i=nodes.length-1; i>=0; i--)
                            nodes[i].parentNode.removeChild(nodes[i]);
                    }
                    
                    //#endif
                    
                    return jpf.loadIncludes(xmlNode);
                }, true);
        }
        else if(!docElement)
            docElement = document;
        
        //Parse the second DOM (add includes)
        
        //#ifdef __WITH_APP
        
        var prefix = jpf.findPrefix(docElement, jpf.ns.jpf);
        if (prefix)
            prefix += ":";
        //#ifdef __SUPPORT_Safari_Old
        if (jpf.isSafariOld)
            prefix = "j";
        //#endif
        
        //#ifdef __DEBUG
        if (!prefix)
            throw new Error(0, jpf.formErrorString(0, null, "Parsing document", "Unable to find Javeline PlatForm namespace definition. (i.e. xmlns:j=\"" + jpf.ns.jpf + "\")", docElement));
        //#endif
        jpf.AppData = jpf.supportNamespaces
            ? docElement.createElementNS(jpf.ns.jpf, prefix + "application")
            : docElement.createElement(prefix + "application");
        
        //Head support
        var head = $xmlns(docElement, "head", jpf.ns.xhtml)[0];
        if (head) {
            var nodes = head.childNodes;
            for (var i = nodes.length-1; i >= 0; i--) 
                if (nodes[i].namespaceURI && nodes[i].namespaceURI != jpf.ns.xhtml) 
                    jpf.AppData.insertBefore(nodes[i], jpf.AppData.firstChild);
        }
        
        //Body support
        var body = (docElement.body
            ? docElement.body
            : $xmlns(docElement, "body", jpf.ns.xhtml)[0]);
        for (var i = 0; i < body.attributes.length; i++)
            jpf.AppData.setAttribute(body.attributes[i].nodeName,
                body.attributes[i].nodeValue);
            
        var nodes = body.childNodes;
        for (var i=nodes.length-1; i>=0; i--)
            jpf.AppData.insertBefore(nodes[i], jpf.AppData.firstChild);
        docElement.documentElement.appendChild(jpf.AppData); //Firefox fix for selectNode insertion need...
        
        /* #else
        jpf.AppData = docElement.body ? docElement.body : docElement.selectSingleNode("/html/body")
        #endif*/	
    
        jpf.loadJMLIncludes(jpf.AppData);
        
        //#ifdef __WITH_APP
        
        if ($xmlns(jpf.AppData, "loader", jpf.ns.jpf).length) {
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
            //#ifdef __SUPPORT_Safari
            if (jpf.isSafariOld) {
                var q = jpf.getElement($xmlns(jpf.AppData, "loader", jpf.ns.jpf)[0], 0).serialize();
                document.body.insertAdjacentHTML("beforeend", q);
                jpf.loadScreen.oExt = document.body.lastChild;
            }
            else {
            //#endif
                var htmlNode = jpf.getElement($xmlns(jpf.AppData, "loader", jpf.ns.jpf)[0], 0);
                
                //if(jpf.isSafari) jpf.loadScreen = document.body.appendChild(document.importNode(htmlNode, true));
                if (htmlNode.ownerDocument == document)
                    jpf.loadScreen.oExt = document.body.appendChild(
                        htmlNode.cloneNode(true));
                else {
                    document.body.insertAdjacentHTML("beforeend", htmlNode.xml
                        || htmlNode.serialize());
                    jpf.loadScreen.oExt = document.body.lastChild;
                }
            //#ifdef __SUPPORT_Safari
            }
            //#endif
        }
        
        document.body.style.display = "block"; //might wanna make this variable based on layout loading...
        
        //#endif
        
        if (!self.ERROR_HAS_OCCURRED)
            jpf.Init.interval = setInterval('if(jpf.checkLoaded()) jpf.initialize()', 20);
    },
    
    loadJMLIncludes : function(xmlNode, doSync){
        // #ifdef __WITH_INCLUDES
        
        // #ifdef __DEBUG
        if (xmlNode.ownerDocument.documentElement && xmlNode.ownerDocument.documentElement[jpf.TAGNAME] == "application") {
            var nodes = xmlNode.ownerDocument.documentElement.attributes;
            for (var found=false, i=0; i<nodes.length; i++) {
                if (nodes[i].nodeValue == jpf.ns.jpf) {
                    found = true;
                    break;
                }
            }
    
            if (!found) {
                //throw new Error(0, jpf.formErrorString(0, null, "Loading includes", (found ? "Invalid namespace found '" + found + "'" : "No namespace definition found") + ". Expecting " + jpf.ns.jpf + "\nFile : " + (xmlNode.ownerDocument.documentElement.getAttribute("filename") || location.href), xmlNode.ownerDocument.documentElement));
                jpf.issueWarning(0, "The Javeline PlatForm xml namespace was not found.");
            }
        }
        // #endif
        
        var nodes = $xmlns(xmlNode, "include", jpf.ns.jpf);
        if (nodes.length) {
            xmlNode.setAttribute("loading", "loading");
        
            for (var i = nodes.length - 1; i >= 0; i--) {
                // #ifdef __DEBUG
                if (!nodes[i].getAttribute("src")) 
                    throw new Error(0, jpf.formErrorString(0, null, "Loading includes", "Could not load Include file " + nodes[i].xml + ":\nCould not find the src attribute."))
                // #endif
                
                jpf.loadJMLInclude(nodes[i], doSync);
            }
        }
        else
            xmlNode.setAttribute("loading", "done");
        
        var nodes = $xmlns(xmlNode, "skin", jpf.ns.jpf);
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].getAttribute("src") && !nodes[i].getAttribute("name")
              || nodes[i].childNodes.length)
                continue;
            
            var path = nodes[i].getAttribute("src")
                ? jpf.getAbsolutePath(jpf.hostPath, nodes[i].getAttribute("src"))
                : jpf.getAbsolutePath(jpf.hostPath, nodes[i].getAttribute("name")) + "/index.xml";
            
            jpf.loadJMLInclude(nodes[i], doSync, path, true);
        }
        // #endif
        
        //#ifdef __WITH_SKIN_AUTOLOAD
        //XForms and lazy programmers support
        if (!jpf.PresentationServer.skins["default"] && jpf.autoLoadSkin) {
            jpf.issueWarning(0, "No skin file found, trying to autoload it named as skins.xml");
            jpf.loadJMLInclude(null, doSync, "skins.xml", true);
        }
        //#endif
        
        return true;
    },

    loadJMLInclude : function(node, doSync, path, isSkin){
        // #ifdef __WITH_INCLUDES
        jpf.status("Loading include file: " + (path || jpf.getAbsolutePath(jpf.hostPath, node.getAttribute("src"))));
        
        this.oHttp.getString(path || jpf.getAbsolutePath(jpf.hostPath, node.getAttribute("src")),
            function(xmlString, state, extra){
                if (state != __HTTP_SUCCESS__) {
                    if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries)
                        return extra.tpModule.retry(extra.id);
                    else {
                        //#ifdef __WITH_SKIN_AUTOLOAD
                        //Check if we are autoloading
                        if (!node) {
                            //Fail silently
                            jpf.issueWarning(0, "Could not autload skin.");
                            jpf.IncludeStack[extra.userdata[1]] = true;
                            return;
                        }
                        //#endif
                        
                        var commError = new Error(1007, jpf.formErrorString(1007, null, "Loading Includes", "Could not load Include file '" + (path || extra.userdata[0].getAttribute("src")) + "'\nReason: " + extra.message, node));
                        if (!jpf.document || jpf.document.dispatchEvent("onerror",
                          jpf.extend({error : commError, state : state}, extra)) !== false)
                            throw commError;
                        return;
                    }
                }
    
                if (!isSkin) {
                    var xmlNode = jpf.getJmlDocFromString(xmlString).documentElement;
                    if (xmlNode[jpf.TAGNAME].toLowerCase() == "skin")
                        isSkin = true;
                    else if(xmlNode[jpf.TAGNAME] != "application")
                        throw new Error(0, jpf.formErrorString(0, null, "Loading Includes", "Could not find handler to parse include file for '" + xmlNode[jpf.TAGNAME] + "' expected 'skin' or 'application'", node));
                }
                
                if (isSkin) {
                    var xmlNode = jpf.XMLDatabase.getXml(xmlString);
                    jpf.PresentationServer.Init(xmlNode, node, path);
                    jpf.IncludeStack[extra.userdata[1]] = true;
                    
                    if (jpf.isOpera && extra.userdata[0] && extra.userdata[0].parentNode) //for opera...
                        extra.userdata[0].parentNode.removeChild(extra.userdata[0]);
                }
                else {
                    jpf.IncludeStack[extra.userdata[1]] = xmlNode;//extra.userdata[0].parentNode.appendChild(xmlNode, extra.userdata[0]);
                    extra.userdata[0].setAttribute("iid", extra.userdata[1]);
                    xmlNode.setAttribute("filename", extra.url);
                }
                
                // #ifdef __STATUS
                jpf.status("Loading of " + xmlNode[jpf.TAGNAME].toLowerCase() + " include done from file: " + extra.url);
                // #endif
                
                jpf.loadJMLIncludes(xmlNode); //check for includes in the include (NOT recursive save)
                
            }, !doSync, [node, jpf.IncludeStack.push(false) - 1]);
        
        // #endif
    },
    //#endif

    checkLoaded : function(){
        for (var i = 0; i < jpf.IncludeStack.length; i++) {
            if (!jpf.IncludeStack[i]) {
                jpf.status("Waiting for: [" + i + "] " + jpf.IncludeStack[i]);
                return false;
            }
        }
        
        if (!document.body) return false;
        
        jpf.status("Dependencies loaded");
        
        return true;
    },
    
    // #ifndef __PACKAGED
    checkLoadedDeps : function(){
        jpf.status("Loading...");

        for (var i = 0; i < this.Modules.length; i++) {
            if (!jpf[this.Modules[i]]) {
                //#ifdef __DEBUG
                jpf.status("Waiting for module " + this.Modules[i]);
                //#endif
                return false;
            }
        }
        
        for (var i = 0; i < this.TelePortModules.length; i++) {
            var mod = this.TelePortModules[i].replace(/(^.*\/|^)([^\/]*)\.js$/, "$2");
            if (!jpf[mod]) {
                //#ifdef __DEBUG
                jpf.status("Waiting for TelePort module " + mod);
                //#endif
                return false;
            }
        }
    
        for (var i = 0; i < this.Components.length; i++) {
            if (this.Components[i].match(/^_base/) || this.Components[i] == "htmlwrapper")
                continue;
            if (!jpf[this.Components[i]]) {
                //#ifdef __DEBUG
                jpf.status("Waiting for component " + this.Components[i]);
                //#endif
                return false;
            }
        }
        
        if (!document.body) return false;
        
        jpf.status("Dependencies loaded");
        
        return true;
    },
    //#endif

    initialize : function(){
        // #ifdef __DESKRUN
        if (jpf.isInitialized) return;
        jpf.isInitialized = true;
        // #endif
        
        jpf.status("Initializing...");
        clearInterval(jpf.Init.interval);
        
        // Run Init
        jpf.Init.run(); //Process load dependencies
    
        // Start application
        if (jpf.JMLParser && jpf.AppData)
            jpf.JMLParser.parse(jpf.AppData);
    
        if (jpf.loadScreen && jpf.appsettings.autoHideLoading)
            jpf.loadScreen.hide();
    },
    
    /* Process Instructions */
    
    //#ifdef __WITH_DSINSTR
    
    //PROCINSTR
    
    /** 
     * Execute a process instruction
     * @todo combine:
     * + jpf.Teleport.callMethodFromNode (except submitform)
     * + ActionTracker.doResponse
     * + MultiSelect.add
     * + rewrite jpf.Model.parse to support load/submission -> rename to loadJML
     * + fix .doUpdate in Tree
     * + fix .extend in Model
     * + add Model.loadFrom(instruction);
     * + add Model.insertFrom(instruction, xmlContext, parentXMLNode, jmlNode);
     * + remove url attribute in insertJML function
     * @see jpf.Teleport#processArguments
     *
     * <j:Bar rpc="" jml="<get_data>" />
     * <j:bindings>
     * 	<j:load select="." get="<get_data>" />
     * 	<j:insert select="." get="<get_data>" />
     * </j:bindings>
     * <j:actions>
     * 	<j:rename set="<save_data>" />
     * 	<j:add get="<same_as_model>" set="<save_data>" />
     * </j:actions>
     * 
     * <j:list model="<model_get_data>" />
     * 
     * <j:model load="<get_data>" submission="<save_data>" />
     * <j:smartbinding model="<model_get_data>" />
     */	
    
    /**
     * save_data : as specified above -> saves data and returns value, optionally in callback
     * @syntax
     * - set="url:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&"
     * - set="url.post:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&"
     * - set="rpc:comm.submit('abc', xpath:/ee)"
     * - set="call:submit('abc', xpath:/ee)"
     * - set="eval:blah=5"
     * - set="cookie:name.subname(xpath:.)"
     */
    saveData : function(instruction, xmlContext, callback, multicall, userdata, arg, isGetRequest){
        if (!instruction) return false;

        var data      = instruction.split(":");
        var instrType = data.shift();

        switch (instrType) {
            case "url":
            case "url.post":
            case "url.eval":
                var oPost = (instrType == "url.post") ? new jpf.post() : new jpf.get();

                //Need checks here
                var xmlNode = xmlContext;
                var x       = (instrType == "url.eval")
                    ? eval(data.join(":")).split("?")
                    : data.join(":").split("?");
                var url     = x.shift();
                
                var cgiData = x.join("?").replace(/\=(xpath|eval)\:([^\&]*)\&/g, function(m, type, content){
                    if (type == "xpath") {
                        var retvalue, o = xmlNode.selectSingleNode(RegExp.$1);
                        if (!o)
                            retvalue = "";
                        else if(o.nodeType >= 2 && o.nodeType <= 4)
                            retvalue = o.nodeValue;
                        else
                            retvalue = o.serialize ? o.serialize() : o.xml;
                    }
                    else if(type == "eval") {
                        try {
                            var retvalue = eval(content);
                        }
                        catch(e){
                            //#ifdef __DEBUG
                            throw new Error(0, jpf.formErrorString(0, null, "Saving/Loading data", "Could not execute javascript code in process instruction '" + content + "' with error " + e.message));
                            //#endif
                        }
                    }
                    
                    return "=" + retvalue + "&";
                });

                if (arg && arg.length) {
                    var arg = arg[0];
                    var pdata = arg.nodeType ? arg.xml || arg.serialize() : jpf.serialize(arg);
                    url += "?" + cgiData;
                }
                else {
                    //Get CGI vars
                    var pdata = cgiData
                }
                
                //Add method and call it
                oPost.urls["saveData"] = url;
                oPost.addMethod("saveData", callback, null, true);
                oPost.callWithString("saveData", pdata, callback)
                break;
            case "rpc":
                var parsed = this.parseInstructionPart(data.join(":"), xmlContext, arg);
                arg        = parsed.arguments;
                
                var q      = parsed.name.split(".");
                var obj    = eval(q[0]);
                var method = q[1];
                
                //#ifdef __DEBUG
                if (!obj)
                    throw new Error(0, jpf.formErrorString(0, null, "Saving/Loading data", "Could not find RPC object by name '" + q[0] + "' in process instruction '" + instruction + "'"));
                //#endif
        
                //force multicall if needed;
                if (multicall)
                    obj.force_multicall = true;
                
                //Set information later neeed
                //#ifdef __DEBUG
                if (!obj[method])
                    throw new Error(0, jpf.formErrorString(0, null, "Saving/Loading data", "Could not find RPC function by name '" + method + "' in process instruction '" + instruction + "'"));
                //#endif
                
                if (userdata)
                    obj[method].userdata = userdata;
                if (!obj.multicall)
                    obj.callbacks[method] = callback; //&& obj[method].async
                
                //Call method
                var retvalue = obj.call(method, arg
                    ? obj.fArgs(arg, obj.names[method], (obj.vartype != "cgi" && obj.vexport == "cgi"))
                    : null);
        
                if (obj.multicall)
                    return obj.purge(callback, "&@^%!@");
                else if (multicall) {
                    obj.force_multicall = false;
                    return obj;
                }
    
                //Call callback for sync calls
                if (!obj.multicall && !obj[method].async && callback)
                    return callback(retvalue);
                break;
            case "call":
                var parsed = this.parseInstructionPart(data.join(":"),
                    xmlContext, arg);
                
                //#ifdef __DEBUG
                if (!self[parsed.name])
                    throw new Error(0, jpf.formErrorString(0, null, "Saving/Loading data", "Could not find Method '" + q[0] + "' in process instruction '" + instruction + "'"));
                //#endif
                
                //Call method
                var retvalue = self[parsed.name].apply(null, parsed.arguments);
                
                //Call callback
                if (callback)
                    callback(retvalue, __HTTP_SUCCESS__, {userdata:userdata});
                break;
            case "eval":
                try {
                    var retvalue = eval(data[1]);
                }
                catch(e) {
                    //#ifdef __DEBUG
                    throw new Error(0, jpf.formErrorString(0, null, "Saving data", "Could not execute javascript code in process instruction '" + instruction + "' with error " + e.message));
                    //#endif
                }
                
                if (callback)
                    callback(retvalue, __HTTP_SUCCESS__, {userdata:userdata});
                break;
            case "cookie":
                var parsed    = this.parseInstructionPart(data.join(":"),
                    xmlContext, arg);
                
                var q         = parsed.name.split(".");
                var cur_value = jpf.getcookie(q[0]);
                cur_value     = cur_value ? jpf.unserialize(cur_value) || {} : {};
                if (!isGetRequest)
                    cur_value[q[1]] = parsed.arguments[0];

                jpf.setcookie(q[0], jpf.serialize(cur_value));
                if (callback)
                    callback(cur_value ? cur_value[q[1]] : null,
                        __HTTP_SUCCESS__, {userdata:userdata});
                break;
            default:
                //Warning?
                return false;
                break;
        }
    },
    
    /**
     * get_data : same as above + #name:select:xpath en name:xpath -> returns data via a callback
     * @syntax
     * - get="id"
     * - get="id:xpath"
     * - get="#component"
     * - get="#component:select"
     * - get="#component:select:xpath"
     * - get="#component"
     * - get="#component:choose"
     * - get="#component:choose:xpath"
     * - get="#component::xpath"
     * ? - get="::xpath"
     * - get="url:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&|ee/blah:1"
     * - get="rpc:comm.submit('abc', xpath:/ee)|ee/blah:1"
     * - get="call:submit('abc', xpath:/ee)|ee/blah:1"
     * - get="eval:10+5"
     */
    getData : function(instruction, xmlContext, callback, multicall, arg){
        var instrParts   = instruction.match(/^([^\|]*)(?:\|([^|]*)){0,1}$/);
        var operators    = (instrParts[2]||"").split(":");
        var get_callback = function(data, state, extra){
            if (state != __HTTP_SUCCESS__)
                return callback(data, state, extra);
            
            operators[2] = data;
            if (operators[0] && data) {
                if (typeof data == "string")
                    data = jpf.XMLDatabase.getXml(data);
                data = data.selectSingleNode(operators[0]);
                
                //Change this to warning?
                if (!data)
                    throw new Error(0, jpf.formErrorString(0, null, "Loading new data", "Could not load data by doing selection on it using xPath: '" + operators[0] + "'."));	
            }
            
            extra.userdata = operators;
            return callback(data, state, extra);
        }
        
        //Get data operates exactly the same as saveData...
        if (this.saveData(instrParts[1], xmlContext, get_callback, multicall,
          operators, arg, true) !== false)
            return;
        
        //...and then some
        var data      = instruction.split(":");
        var instrType = data.shift();
        
        if (instrType.substr(0, 1) == "#") {
            instrType = instrType.substr(1);
            var retvalue, oJmlNode = self[instrType];
            
            //#ifdef __DEBUG
            if (!oJmlNode)
                throw new Error(0, jpf.formErrorString(0, null, "Loading data", "Could not find object '" + instrType + "' referenced in process instruction '" + instruction + "' with error " + e.message));
            //#endif
            
            if (!oJmlNode.value)
                retvalue = null;
            else
                retvalue = data[2]
                    ? oJmlNode.value.selectSingleNode(data[2])
                    : oJmlNode.value;
        }
        else {
            var model = jpf.NameServer.get("model", instrType);
            
            if (!model)
                throw new Error(1068, jpf.formErrorString(1068, jmlNode, "Loading data", "Could not find model by name: " + instrType, x));
            
            if (!model.data)
                retvalue = null;
            else
                retvalue = data[1]
                    ? model.data.selectSingleNode(data[1])
                    : model.data;
        }
        
        if (callback)
            get_callback(retvalue, __HTTP_SUCCESS__, {userdata:operators});
        else {
            jpf.issueWarning(0, "Returning data directly in jpf.getData(). This means that all callback communication ends in void!");
            return retvalue;
        }
    },
    
    //#ifdef __WITH_MODEL
    /**
     * model_get_data : creates a model object (model will use get_data to process instruction) -> returns model + xpath
     * @todo
     * + rename jpf.JMLParser.selectModel to jpf.setModel
     * + change jpf.SmartBinding.loadJML to use jpf.setModel
     * + change function modelHandler to use jpf.setModel
     */
    setModel : function(instruction, jmlNode, isSelection){
        if (!instruction) return;

        var data      = instruction.split(":");
        var instrType = data[0];
        
        //So are we sure we shouldn't also check .dataParent here?
        if(jmlNode.getModel())
            jmlNode.getModel().unregister(jmlNode);

        if (instrType.match(/^(?:url|url.post|rpc|call|eval|cookie|gears)$/)) {
            jmlNode.setModel(new jpf.Model().loadFrom(instruction));
            //x.setAttribute((isSelection ? "select-" : "") + "model", "#" + jmlNode.name + (data.length ? ":" + data.join(":") : ""));
        }
        else if (instrType.substr(0,1) == "#") {
            instrType = instrType.substr(1);
            
            if (isSelection) {
                var sb2 = jmlNode.getSelectionSmartBinding() || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
                if (sb2)
                    sb2.model = new jpf.Model().loadFrom(instruction);
            }
            else if (!self[instrType] || !jpf.JMLParser.inited) {
                jpf.JMLParser.addToModelStack(jmlNode, data)
            }
            else {
                var oConnect = eval(instrType);
                if (oConnect.connect)
                    oConnect.connect(jmlNode, null, data[2], data[1] || "select");
                else
                    jmlNode.setModel(new jpf.Model().loadFrom(instruction));
            }
            
            jmlNode.connectId = instrType;
        }
        else {
            var instrType = data.shift();
            var model = instrType == "@default"
                ? jpf.JMLParser.globalModel
                : jpf.NameServer.get("model", instrType);
            
            if (!model)
                throw new Error(1068, jpf.formErrorString(1068, jmlNode, "Finding model", "Could not find model by name: " + instrType));
            
            if (isSelection) {
                var sb2 = jmlNode.getSelectionSmartBinding()
                    || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
                if (sb2) {
                    sb2.model = model;
                    sb2.modelXpath[jmlNode.uniqueId] = data.join(":");
                }
            } else
                jmlNode.setModel(model, data.join(":"));
        }
    },
    //#endif
    
    parseInstructionPart : function(instrPart, xmlNode, arg){
        var parsed  = {}, s = instrPart.split("(");
        parsed.name = s.shift();
        
        //Get arguments for call
        if (!arg) {
            arg = s.join("(");
            
            //#ifdef __DEBUG
            if (arg.substr(arg.length-1) != ")")
                throw new Error(0, jpf.formErrorString(0, null, "Saving data", "Syntax error in instruction. Missing ) in " + instrPart));
            //#endif
            
            arg = arg.substr(0, arg.length-1);
            arg = arg ? arg.split(",") : []; //(?=\w+:) would help, but makes it more difficult
            
            for (var i = 0; i < arg.length; i++) {
                if (typeof arg[i] == "object") continue;
                
                if (typeof arg[i] == "string") {
                    //this could be optimized if needed
                    if (arg[i].match(/^xpath\:(.*)$/)) {
                        var o = xmlNode ? xmlNode.selectSingleNode(RegExp.$1) : null;
        
                        if (!o)
                            arg[i] = "";
                        else if (o.nodeType >= 2 && o.nodeType <= 4) 
                            arg[i] = o.nodeValue;
                        //else if(o.firstChild) arg[i] = o.firstChild.nodeValue;// && (o.firstChild.nodeType == 3 || o.firstChild.nodeType == 4)
                        //else arg[i] = "";
                        else
                            arg[i] = o.xml || o.serialize();
                    }
                    else if(arg[i].match(/^call\:(.*)$/)) {
                        arg[i] = self[RegExp.$1](xmlNode, instrPart);
                    }
                    else if(arg[i].match(/^\((.*)\)$/)) {
                        arg[i] = this.processArguments(RegExp.$1.split(";"), xmlNode, instrPart);
                    }
                    else { //if(arg[i].match(/^eval\:(.*)$/)){
                        arg[i] = eval(arg[i]);//RegExp.$1);
                    }
                }
                else
                    arg[i] = arg[i] || "";
            }
        }
        
        parsed.arguments = arg;
        
        return parsed;
    },
    
    //#endif
    
    /* Destroy */

    destroy : function(exclude){
        //#ifdef __WITH_XFORMS
        var models = jpf.NameServer.getAll("model");
        for (var i = 0; i < models.length; i++)
            models[i].dispatchEvent("xforms-model-destruct");
        //#endif
        
        //#ifdef __WITH_POPUP
        this.Popup.destroy();
        //#endif
        
        for (var i = 0; i < this.all.length; i++)
            if (this.all[i] && this.all[i] != exclude && this.all[i].destroy)
                this.all[i].destroy();
        
        document.oncontextmenu = document.onmousedown = document.onselectstart
            = document.onkeyup = document.onkeydown = null;
        
        // #ifdef __WITH_TELEPORT
        jpf.Teleport.destroy();
        // #endif
        
        jpf.XMLDatabase.unbind(jpf.window);
    }
};

var $ = function(tag, doc, prefix, force){
    return (doc || document).getElementsByTagName((prefix
      && (force || jpf.isGecko || jpf.isOpera)
        ? prefix + ":"
        : "") + tag);
}

var $xmlns = function(xmlNode, tag, xmlns, prefix){
    if (!jpf.supportNamespaces) {
        if (!prefix)
            prefix = jpf.findPrefix(xmlNode, xmlns);
        
        if (xmlNode.style)
            return xmlNode.getElementsByTagName(tag)
        else {
            if (prefix)
                (xmlNode.nodeType == 9
                    ? xmlNode
                    : xmlNode.ownerDocument).setProperty("SelectionNamespaces",
                        "xmlns:" + prefix + "='" + xmlns + "'");
            return xmlNode.selectNodes(".//" + (prefix ? prefix + ":" : "") + tag);
        }
    }
    else
        return xmlNode.getElementsByTagNameNS(xmlns, tag);
}

var $j = function(xmlNode, tag){
    return $xmlns(xmlNode, tag, jpf.ns.jpf);
}

// #ifdef __WITH_COOKIE

/* ******** COOKIE METHODS *********
    Cookie Handling Methods
**********************************/

jpf.setcookie = function(name, value, expire, path, domain, secure){
    var ck = name + "=" + escape(value) + ";";
    if (expire) ck += "expires=" + new Date(expire
        + new Date().getTimezoneOffset() * 60).toGMTString() + ";";
    if (path)   ck += "path=" + path + ";";
    if (domain) ck += "domain=" + domain;
    if (secure) ck += "secure";

    document.cookie = ck;
    return true
}

jpf.getcookie = function (name){
  var aCookie = document.cookie.split("; ");
  for (var i=0; i < aCookie.length; i++) {
      var aCrumb = aCookie[i].split("=");
      if (name == aCrumb[0])
          return unescape(aCrumb[1]);
  }

  return "";
}

jpf.delcookie = function (name,domain){
    document.cookie = name + "=blah; expires=Fri, 31 Dec 1999 23:59:59 GMT;"
        + (domain ? 'domain='+domain : '');
}

//#endif
/* ******** HELPER FUNCTIONS *********
**********************************/
// #ifdef __WITH_APP || __WITH_XMLDATABASE

jpf.getXmlValue = function (xmlNode, xpath){
    if (!xmlNode) return "";
    xmlNode = xmlNode.selectSingleNode(xpath);
    if (xmlNode && xmlNode.nodeType == 1)
        xmlNode = xmlNode.firstChild;
    return xmlNode ? xmlNode.nodeValue : "";
}

jpf.getXmlValues = function(xmlNode, xpath){
    var out = [];
    if (!xmlNode) return out;
    
    var nodes = xmlNode.selectNodes(xpath);
    if (!nodes.length) return out;
    
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (n.nodeType == 1)
            n = n.firstChild;
        out.push(n.nodeValue || "");
    }
    return out;
}

//#endif

jpf.removeParts = function(str){
    q = str.replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
    q = q.replace(/\}\s*$/, "");
    return q;
}

jpf.importClass = function(ref, strip, win){
    if (!ref)
        throw new Error(1018, jpf.formErrorString(1018, null, "importing class", "Could not load reference. Reference is null"));

    if (!jpf.hasExecScript)
        return ref();//.call(self);

    if (!strip)
        return (win.execScript
            ? win.execScript(ref.toString())
            : eval(ref.toString()));
    var q = jpf.removeParts(ref.toString());

    //var q = ref.toString().split("\n");q.shift();q.pop();
    //if(!win.execScript) q.shift();q.pop();

    return win.execScript ? win.execScript(q) : eval(q);
}

jpf.Init.run('jpf');
