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
* @projectDescription     Javeline Platform
*
* @author    Ruben Daniels ruben@javeline.nl
* @version    1.0
* http://java.sun.com/j2se/javadoc/writingdoccomments/
* http://www.scriptdoc.org/specification.htm
*/

/*#ifdef __JFWVERSION
VERSION        = __JFWVERSION;
#else*/
VERSION        = false;
//#endif

//@todo move these global vars to jpf. rename http_get_vars to jpf._GET
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
    crypto        : {}, //namespace
    offline       : {isOnline:true}, //please remove after testing
    
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
            var matches  = navigator.userAgent.match(/AppleWebKit\/(\d+)/);
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
        
        this.isWin       = sAgent.indexOf("win") != -1 || sAgent.indexOf("16bit") != -1;
        this.isMac       = sAgent.indexOf("mac") != -1;
        
        this.isAIR       = navigator.userAgent.indexOf("AdobeAIR") != -1;
        
        //#ifdef __SUPPORT_GEARS
        jpf.isGears      = !!jpf.initGears() || 0;
        //#endif
        
        //#ifdef __DESKRUN
        try {
            this.isDeskrun = window.external.shell.runtime == 2;
        }
        catch(e) {
            this.isDeskrun = false;
        }
        //#endif
        
        this.dispatchEvent("onbrowsercheck"); //@todo Is this one needed?
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
                                           && typeof document.defaultView.getComputedStyle != "undefined";
        this.locale                    = (this.isIE 
                                            ? navigator.userLanguage 
                                            : navigator.language).toLowerCase();
        
        //Other settings
        this.maxHttpRetries = this.isOpera ? 0 : 3;
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.dynPropMatch = new RegExp();
        this.dynPropMatch.compile("^[{\\[].*[}\\]]$"); //@todo, is this the way to do use compile?
        //#endif
    },
    
    start : function(){
        var sHref = location.href.split("?")[0];
        
        //Set Variables
        this.host     = location.hostname;//sHref.replace(/(\/\/[^\/]*)\/.*$/, "$1");
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
        this.Init.addConditional(this.loadIncludes, null, ['body', 'xmldb']); 
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
        for (var i = 0; i < this.Components.length; i++) {
            var c = this.Components[i];
            jpf.include("components/" + c + ".js", true);
        }
        
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
    
    importClass : function(ref, strip, win){
        if (!ref)
            throw new Error(1018, jpf.formatErrorString(1018, null, "importing class", "Could not load reference. Reference is null"));
    
        if (!jpf.hasExecScript)
            return ref();//.call(self);
    
        if (!strip)
            return jpf.exec(ref.toString());
        
        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.replace(/\}\s*$/, "");
            
        //var q = ref.toString().split("\n");q.shift();q.pop();
        //if(!win.execScript) q.shift();q.pop();
    
        return jpf.exec(q);
    },
    
    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    * @method
    */
    toString : function(){
        return "[Javeline (jpf)]";
    },
    
    all : [],
    
    /**
    * This method inherit all properties and methods to this object from another class
    * @param {Function}    classRef    Required Class reference 
    * @method
    */
    inherit : function(classRef){
        for (var i=0; i<arguments.length; i++) {
            //#ifdef __DEBUG
            if (!arguments[i]) {
                throw new Error(0, jpf.formatErrorString(0, this, 
                    "Inheriting baseclasses", 
                    "Could not inherit class; Class is not loaded yet", 
                    this.jml));
            }
            //#endif
            
            arguments[i].call(this);//classRef
        }
        
        return this;
    },
    
    /**
    * This method transforms an object into a Javeline Class
    * @param {Object}    oBlank Required Object to be transformed into a Javeline Class
    * @method
    */
    makeClass : function(oBlank){
        if (oBlank.inherit) return;
        
        oBlank.inherit = this.inherit;
        oBlank.inherit(jpf.Class);
        
        oBlank.uniqueId = this.all.push(oBlank) - 1;
    },
    
    uniqueHtmlIds : 0,
    
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
    
    /* ******** NODE METHODS ***********
        Debug functions
    **********************************/

    status : function(str){
        //#ifdef __STATUS
        if (!jpf.debug) return;

        if (false && jpf.isOpera)
            status = str; //else if(jpf.isDeskrun || jpf.hasWebRun)    lp.Write("STATUS",str);
        else if (jpf.debugwin) {
            var dt   = new Date();
            var date = dt.getHours() + ":" + dt.getMinutes() + ":"
                + dt.getSeconds() + ":" + dt.getMilliseconds();    
            jpf.debugMsg("[" + date + "] " + str.replace(/\n/g, "<br />")
                .replace(/\t/g,"&nbsp;&nbsp;&nbsp;") + "<br />", "status");
        }
        //else
        //    document.title = str;
        //#endif
    },
    
    issueWarning : function(nr, msg){
        //#ifdef __DEBUG
        if (!self.jpf.debug) return;
        
        //needs implementation
        if (jpf.warnings[msg]) return;
    
        //var seeAgain = confirm("Javelin Notification\nA warning has been issued\n\nNumber: " + nr + "\nWarning: " + msg + "\n\nPress OK to see this warning again.");
        //if(!seeAgain) jpf.warnings[msg] = true;
        
        jpf.status("[WARNING]:" + msg.replace(/ +/g, " ").replace(/\n/g, "<br />"));
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

        if (this.dispatchEvent)
            this.dispatchEvent("ondebug", {message: msg});
    },

    showDebug : function(){
        this.win = window.open("", "debug");
        this.win.document.write(this.debugInfo);
    },
    
    //#endif
    
    formatErrorString : function(number, control, process, message, jmlContext, outputname, output){
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
            str.push("jml file: [line: " + linenr + "] " +
                jpf.removePathContext(jpf.hostPath, jmlContext.ownerDocument
                  .documentElement.getAttribute("filename")));
        }
        if (control)
            str.push("Control: '" 
                + (control.name 
                    || (control.jml ? control.jml.getAttribute("id") : null) 
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

        return str.join("\n");
    },
    
    //throw new Error(1101, jpf.formatErrorString(1101, this, null, "A dropdown with a bind='' attribute needs a smartbinding='' attribute or have <j:Item /> children.", "JML", this.jml.outerHTML));
    
    /* Init */
    
    include : function(sourceFile, doBase){
        jpf.status("including js file: " + sourceFile);
        
        var head     = document.getElementsByTagName("head")[0];//$("head")[0]
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
    
    /*
     * @todo Build this function into the compressor for faster execution
     */
    getJmlDocFromString : function(xmlString){
        //#ifdef __WITH_EXPLICIT_LOWERCASE
        
        //replace(/&\w+;/, ""). replace this by something else
        var str = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "").replace(/&nbsp;/g, " ")
            .replace(/^[\r\n\s]*/, "").replace(/<\s*\/?\s*\w+:\s*[\w-]*[\s>\/]/g,
            function(m){ return m.toLowerCase(); });

        if (!this.supportNamespaces)
            str = str.replace(/xmlns\=\"[^"]*\"/g, "");
        
        var xmlNode = jpf.getXmlDom(str);
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
 
    loadIncludes : function(docElement){
        //Load current HTML document as 'second DOM'
        
        /* #ifndef __WITH_APP || __WITH_XMLDATABASE
        jpf.canUseHtmlAsXml = false;
        #endif */
        
        if ((!jpf.canUseHtmlAsXml || document.body.getAttribute("mode") != "html") && !docElement) {
            return jpf.oHttp.getString((document.body.getAttribute("xmlurl") || location.href).split(/#/)[0],
                function(xmlString, state, extra){
                    if (state != jpf.SUCCESS) {
                        var oError;
                        //#ifdef __DEBUG
                        oError = new Error(0, jpf.formatErrorString(0, null, 
                            "Loading XML application data", "Could not load \
                            XML from remote source: " + extra.message));
                        //#endif
                        
                        if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                            return true;
                        
                        throw oError;
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
                }, {ignoreOffline: true});
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
            throw new Error(0, jpf.formatErrorString(0, null, "Parsing document", "Unable to find Javeline PlatForm namespace definition. (i.e. xmlns:j=\"" + jpf.ns.jpf + "\")", docElement));
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
        // && xmlNode.ownerDocument.documentElement[jpf.TAGNAME] == "application"
        if (xmlNode.ownerDocument.documentElement) {
            var nodes = xmlNode.ownerDocument.documentElement.attributes;
            for (var found=false, i=0; i<nodes.length; i++) {
                if (nodes[i].nodeValue == jpf.ns.jpf) {
                    found = true;
                    break;
                }
            }
    
            if (!found) {
                //throw new Error(0, jpf.formatErrorString(0, null, "Loading includes", (found ? "Invalid namespace found '" + found + "'" : "No namespace definition found") + ". Expecting " + jpf.ns.jpf + "\nFile : " + (xmlNode.ownerDocument.documentElement.getAttribute("filename") || location.href), xmlNode.ownerDocument.documentElement));
                jpf.issueWarning(0, "The Javeline PlatForm xml namespace was not found.");
            }
        }
        // #endif

        var basePath = jpf.getDirname(xmlNode.getAttribute("filename")) || jpf.hostPath;
        
        var nodes = $xmlns(xmlNode, "include", jpf.ns.jpf);
        if (nodes.length) {
            xmlNode.setAttribute("loading", "loading");
        
            for (var i = nodes.length - 1; i >= 0; i--) {
                // #ifdef __DEBUG
                if (!nodes[i].getAttribute("src")) 
                    throw new Error(0, jpf.formatErrorString(0, null, "Loading includes", "Could not load Include file " + nodes[i].xml + ":\nCould not find the src attribute."))
                // #endif
                
                var path = jpf.getAbsolutePath(basePath, nodes[i].getAttribute("src"));
                
                jpf.loadJMLInclude(nodes[i], doSync, path);
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
                ? jpf.getAbsolutePath(basePath, nodes[i].getAttribute("src"))
                : jpf.getAbsolutePath(basePath, nodes[i].getAttribute("name")) + "/index.xml";
            
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
                 if (state != jpf.SUCCESS) {
                    var oError;
                    //#ifdef __DEBUG
                    oError = new Error(1007, jpf.formatErrorString(1007, 
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
                        jpf.issueWarning(0, "Could not autload skin.");
                        jpf.IncludeStack[extra.userdata[1]] = true;
                        return;
                    }
                    //#endif
                    
                    throw oError;
                }
                
                if (!isSkin) {
                    var xmlNode = jpf.getJmlDocFromString(xmlString).documentElement;
                    if (xmlNode[jpf.TAGNAME].toLowerCase() == "skin")
                        isSkin = true;
                    else if(xmlNode[jpf.TAGNAME] != "application")
                        throw new Error(0, jpf.formatErrorString(0, null, "Loading Includes", "Could not find handler to parse include file for '" + xmlNode[jpf.TAGNAME] + "' expected 'skin' or 'application'", node));
                }
                
                if (isSkin) {
                    //#ifdef __DEBUG
                    if (xmlString.indexOf('xmlns="http://www.w3.org/1999/xhtml"') > -1){
                        jpf.issueWarning(0, "Found xhtml namespace as global namespace of skin file. This is not allowed. Please remove this for production purposes.")
                        xmlString = xmlString.replace('xmlns="http://www.w3.org/1999/xhtml"', '');
                    }
                    //#endif
                    
                    var xmlNode = jpf.getJmlDocFromString(xmlString).documentElement;
                    jpf.PresentationServer.Init(xmlNode, node, path);
                    jpf.IncludeStack[extra.userdata[1]] = true;
                    
                    if (jpf.isOpera && extra.userdata[0] && extra.userdata[0].parentNode) //for opera...
                        extra.userdata[0].parentNode.removeChild(extra.userdata[0]);
                }
                else {
                    jpf.IncludeStack[extra.userdata[1]] = xmlNode;//extra.userdata[0].parentNode.appendChild(xmlNode, extra.userdata[0]);
                    extra.userdata[0].setAttribute("iid", extra.userdata[1]);
                }
 
                xmlNode.setAttribute("filename", extra.url);
                                
                // #ifdef __STATUS
                jpf.status("Loading of " + xmlNode[jpf.TAGNAME].toLowerCase() + " include done from file: " + extra.url);
                // #endif
                
                jpf.loadJMLIncludes(xmlNode); //check for includes in the include (NOT recursive save)
                
            }, {
                async         : !doSync, 
                userdata      : [node, jpf.IncludeStack.push(false) - 1],
                ignoreOffline : true
            });
        
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

        if (jpf.Class)
            this.inherit(jpf.Class);
        
        jpf.Init.addConditional(function(){
            jpf.dispatchEvent("ondomready");
        }, null, ["body"]);

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
            if (this.Components[i].match(/^_base|\//) || this.Components[i] == "htmlwrapper")
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
    
    /* Destroy */

    destroy : function(exclude){
        //#ifdef __WITH_XFORMS
        var models = jpf.nameserver.getAll("model");
        for (var i = 0; i < models.length; i++)
            models[i].dispatchEvent("xforms-model-destruct");
        //#endif
        
        //#ifdef __WITH_POPUP
        this.Popup.destroy();
        //#endif
        
        for (var i = 0; i < this.all.length; i++) {
            if (this.all[i] && this.all[i] != exclude && this.all[i].destroy)
                this.all[i].destroy();
        }
        
        document.oncontextmenu = 
        document.onmousedown   = 
        document.onselectstart = 
        document.onkeyup       = 
        document.onkeydown     = null;
        
        for (var i = this.__jmlDestroyers.length - 1; i >= 0; i--)
			this.__jmlDestroyers[i].call(this);
		this.__jmlDestroyers = undefined;
        
        // #ifdef __WITH_TELEPORT
        jpf.teleport.destroy();
        // #endif
        
        // #ifdef __WITH_OFFLINE
        jpf.offline.destroy();
        // #endif
        
        jpf.xmldb.unbind(jpf.window);
    }
};

/* #ifdef __PACKAGED
jpf.inherit(jpf.Class);
*/

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
                (xmlNode.nodeType == 9 ? xmlNode : xmlNode.ownerDocument)
                    .setProperty("SelectionNamespaces",
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

jpf.Init.run('jpf');