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

// #ifdef __WITH_SILVERLIGHT
/**
 * Helper class that aids in creating and controlling Microsoft Silverlight
 * elements (XAML stuff).
 * 
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */
jpf.silverlight = (function() {
    /**
     * silverlightCount:
     *
     * Counter of globalized event handlers
     */
    var silverlightCount = 0;
    
    /**
     * fwlinkRoot:
     *
     * Prefix for fwlink URL's
     */
    var fwlinkRoot = 'http://go2.microsoft.com/fwlink/?LinkID=';
    
    /**
     * Called by jpf.silverlight.WaitForInstallCompletion when the page detects
     * that Silverlight has been installed. The event handler is not called
     * in upgrade scenarios.
     * 
     * @type {void}
     */
    function onSilverlightInstalled() {
        window.location.reload(false);
    }
    
    /**
     * Checks to see if the correct version is installed
     * 
     * @param {String} version
     * @type {Boolean}
     */
    function isInstalled(version){
        var isVersionSupported = false;
        var container = null;
        
        try {
            var control = null;
            try {
                if (jpf.ieIE) {
                    control = new ActiveXObject('AgControl.AgControl');
                    if (version == null)
                        isVersionSupported = true;
                    else if (control.IsVersionSupported(version))
                        isVersionSupported = true;
                    control = null;
                }
                else
                    throw new Error('dummy');
            }
            catch (e) {
                var plugin = navigator.plugins["Silverlight Plug-In"] ;
                if (plugin) {
                    if (version === null) {
                        isVersionSupported = true;
                    }
                    else {
                        var actualVer = plugin.description;
                        if (actualVer === "1.0.30226.2")
                            actualVer = "2.0.30226.2";
                        var actualVerArray = actualVer.split(".");
                        while (actualVerArray.length > 3)
                            actualVerArray.pop();
                        while (actualVerArray.length < 4)
                            actualVerArray.push(0);
                        var reqVerArray = version.split(".");
                        while (reqVerArray.length > 4)
                            reqVerArray.pop();
                        
                        var requiredVersionPart;
                        var actualVersionPart
                        var index = 0;
                        do {
                            requiredVersionPart = parseInt(reqVerArray[index]);
                            actualVersionPart   = parseInt(actualVerArray[index]);
                            index++;
                        }
                        while (index < reqVerArray.length 
                          && requiredVersionPart === actualVersionPart);
                        
                        if (requiredVersionPart <= actualVersionPart 
                          && !isNaN(requiredVersionPart))
                            isVersionSupported = true;
                    }
                }
            }
        }
        catch (e) {
            isVersionSupported = false;
        }
        if (container) 
            document.body.removeChild(container);
        
        return isVersionSupported;
    }
    
    /**
     * Occasionally checks for Silverlight installation status. If it
     * detects that Silverlight has been installed then it calls
     * jpf.silverlight.onSilverlightInstalled();. This is only supported
     * if Silverlight was not previously installed on this computer.
     * 
     * @type {void}
     */
    function WaitForInstallCompletion(){
        if (!jpf.silverlight.isBrowserRestartRequired 
          && onSilverlightInstalled) {
            try {
                navigator.plugins.refresh();
            }
            catch(e) {}
            if (isInstalled(null))
                onSilverlightInstalled();
            else
                setTimeout(WaitForInstallCompletion, 3000);
        }
    }
    
    /**
     * Performs startup tasks
     * 
     * @type {void}
     */
    function startup() {
        var o = jpf.silverlight;
        o.isBrowserRestartRequired = isInstalled(null);
        if (!o.isBrowserRestartRequired)
            WaitForInstallCompletion();
        if (window.removeEventListener)
            window.removeEventListener('load', startup , false);
        else
            window.detachEvent('onload', startup);
    }
    
    /**
     * Inserts a Silverlight <object> tag or installation experience into the HTML
     * DOM based on the current installed state of Silverlight.
     * 
     * @param {String} source
     * @param {HTMLDomElement} parentElement
     * @param {String} id
     * @param {Object} properties
     * @param {Object} events
     * @param {Object} initParams
     * @param {mixed} userContext
     * @type {String}
     */
    function createObject(source, parentElement, id, properties, events, initParams, userContext) {
        var slPluginHelper = new Object();
        var slProperties   = properties;
        var slEvents       = events;
        
        slPluginHelper.version = slProperties.version;
        slProperties.source    = source;    
        slPluginHelper.alt     = slProperties.alt;
        
        //rename properties to their tag property names. For bacwards compatibility
        //with Silverlight.js version 1.0
        if (initParams)
            slProperties.initParams = initParams;
        if (slProperties.isWindowless && !slProperties.windowless)
            slProperties.windowless = slProperties.isWindowless;
        if (slProperties.framerate && !slProperties.maxFramerate)
            slProperties.maxFramerate = slProperties.framerate;
        if (id && !slProperties.id)
            slProperties.id = id;
        
        // remove elements which are not to be added to the instantiation tag
        delete slProperties.ignoreBrowserVer;
        delete slProperties.inplaceInstallPrompt;
        delete slProperties.version;
        delete slProperties.isWindowless;
        delete slProperties.framerate;
        delete slProperties.data;
        delete slProperties.src;
        delete slProperties.alt;
    
        // detect that the correct version of Silverlight is installed, else display install
        if (isInstalled(slPluginHelper.version)) {
            //move unknown events to the slProperties array
            for (var name in slEvents) {
                if (slEvents[name]) {
                    if (name == "onLoad" && typeof slEvents[name] == "function" 
                      && slEvents[name].length != 1) {
                        var onLoadHandler = slEvents[name];
                        slEvents[name] = function (sender){
                            return onLoadHandler(document.getElementById(id), userContext, sender);
                        };
                    }
                    var handlerName = getHandlerName(slEvents[name]);
                    if (handlerName != null) {
                        slProperties[name] = handlerName;
                        slEvents[name] = null;
                    }
                    else
                        throw new Error(jpf.formatErrorString(0, this, "typeof events." + name + " must be 'function' or 'string'"));
                }
            }
            slPluginHTML = buildHTML(slProperties);
        }
        //The control could not be instantiated. Show the installation prompt
        else
            slPluginHTML = buildPromptHTML(slPluginHelper);
    
        // insert or return the HTML
        if (parentElement)
            parentElement.innerHTML = slPluginHTML;
        else
            return slPluginHTML;
    }
    
    /**
     *  create HTML that instantiates the control
     *  
     *  @param {Object} slProperties
     *  @type {String}
     */
    function buildHTML(slProperties) {
        var htmlBuilder = [];
    
        htmlBuilder.push('<object type=\"application/x-silverlight\" data="data:application/x-silverlight,"');
        if (slProperties.id != null)
            htmlBuilder.push(' id="' + slProperties.id + '"');
        if (slProperties.width != null)
            htmlBuilder.push(' width="' + slProperties.width+ '"');
        if (slProperties.height != null)
            htmlBuilder.push(' height="' + slProperties.height + '"');
        htmlBuilder.push(' >');
        
        delete slProperties.id;
        delete slProperties.width;
        delete slProperties.height;
        
        for (var name in slProperties) {
            if (slProperties[name])
                htmlBuilder.push('<param name="',
                  HtmlAttributeEncode(name) + '" value="',
                  HtmlAttributeEncode(slProperties[name]),
                  '" />');
        }
        htmlBuilder.push('<\/object>');
        return htmlBuilder.join('');
    }
    
    /**
     * takes a single parameter of all createObject 
     * parameters enclosed in {}
     * 
     * @param {Object} params
     * @type {String}
     */
    function createObjectEx(params) {
        var parameters = params;
        var html = createObject(parameters.source, 
            parameters.parentElement, parameters.id, parameters.properties, 
            parameters.events, parameters.initParams, parameters.context);
        if (parameters.parentElement == null)
            return html;
    }
    
    /**
     * Builds the HTML to prompt the user to download and install Silverlight
     * 
     * @param {Object} slPluginHelper
     * @type {String}
     */
    function buildPromptHTML(slPluginHelper) {
        var slPluginHTML = "";
        var urlRoot  = fwlinkRoot;
        var shortVer = slPluginHelper.version ;
        if (slPluginHelper.alt)
            slPluginHTML = slPluginHelper.alt;
        else {
            if (!shortVer)
                shortVer="";
            slPluginHTML = "<a href='javascript:jpf.silverlight.getSilverlight(\"{1}\");' \
                style='text-decoration: none;'><img src='{2}' \
                alt='Get Microsoft Silverlight' style='border-style: none'/></a>";
            slPluginHTML = slPluginHTML.replace('{1}', shortVer );
            slPluginHTML = slPluginHTML.replace('{2}', urlRoot + '108181');
        }
        
        return slPluginHTML;
    }
    
    /**
     * Navigates the browser to the appropriate Silverlight installer
     * 
     * @param {String} version
     * @type {void}
     */
    function getSilverlight(version) {
        if (jpf.silverlight.onGetSilverlight)
            jpf.silverlight.onGetSilverlight();
        
        var shortVer = "";
        var reqVerArray = String(version).split(".");
        if (reqVerArray.length > 1) {
            var majorNum = parseInt(reqVerArray[0] );
            if (isNaN(majorNum) || majorNum < 2)
                shortVer = "1.0";
            else
                shortVer = reqVerArray[0]+'.'+reqVerArray[1];
        }
        
        var verArg = "";
        if (shortVer.match(/^\d+\056\d+$/) )
            verArg = "&v="+shortVer;
        
        followFWLink("114576" + verArg);
    }
    
    /**
     * Navigates to a url based on fwlinkid
     * 
     * @param {String} linkid
     * @type {void}
     */
    function followFWLink(linkid) {
        top.location = fwlinkRoot + String(linkid);
    }
    
    /**
     * Encodes special characters in input strings as charcodes
     * 
     * @param {String} strInput
     * @type {String}
     */
    function HtmlAttributeEncode(strInput) {
        var c;
        var retVal = '';
    
        if (strInput == null) return null;
          
        for (var cnt = 0; cnt < strInput.length; cnt++) {
            c = strInput.charCodeAt(cnt);

            if (((c > 96) && (c < 123)) || (( c > 64) && (c < 91)) 
              || ((c > 43) && (c < 58) && (c != 47)) || (c == 95))
                retVal = retVal + String.fromCharCode(c);
            else
                retVal = retVal + '&#' + c + ';';
        }
        return retVal;
    }
    
    /**
     *  Default error handling function
     *  
     *  @param {String} sender
     *  @param {Object} args
     *  @type {void}
     */
    function default_error_handler(sender, args) {
        var iErrorCode;
        var errorType = args.ErrorType;
    
        iErrorCode = args.ErrorCode;
    
        var errMsg = ["\nSilverlight error message     \n\
          ErrorCode: ", iErrorCode, "\n\
          ErrorType: ", errorType, "       \n\
          Message: ", args.ErrorMessage, "     \n"];
    
        if (errorType == "ParserError") {
            errMsg.push("XamlFile: ", args.xamlFile, "     \n\
              Line: ", args.lineNumber, "     \n\
              Position: ", args.charPosition, "     \n");
        }
        else if (errorType == "RuntimeError") {
            if (args.lineNumber != 0) {
                errMsg.push("Line: ", args.lineNumber, "     \n\
                    Position: ",  args.charPosition, "     \n");
            }
            errMsg.push("MethodName: ", args.methodName, "     \n");
        }
        throw new Error(jpf.formatErrorString(0, this, errMsg.join('')));
    }
    
    /**
     * Releases event handler resources when the page is unloaded
     * 
     * @type {void}
     */
    function cleanup() {
        for (var i = silverlightCount - 1; i >= 0; i--) {
            window['__slEvent' + i] = null;
        }
        silverlightCount = 0;
        if (window.removeEventListener)
            window.removeEventListener('unload', cleanup, false);
        else
            window.detachEvent('onunload', cleanup);
    }
    
    /**
     * Generates named event handlers for delegates.
     * 
     * @param {Function} handler
     * @type {String}
     */
    function getHandlerName(handler) {
        var handlerName = "";
        if (typeof handler == "string")
            handlerName = handler;
        else if ( typeof handler == "function" ) {
            if (silverlightCount == 0) {
                if (window.addEventListener) 
                    window.addEventListener('unload', cleanup, false);
                else 
                    window.attachEvent('onunload', cleanup);
            }
            var count = silverlightCount++;
            handlerName = "__slEvent" + count;
            
            window[handlerName] = handler;
        }
        else
            handlerName = null;

        return handlerName;
    }
    
    var aIsAvailable = {};
    /**
     * Checks whether a valid version of Silverlight is available on the clients'
     * system. Default version to check for is 1.0.
     * 
     * @param {String} sVersion Optional.
     * @type {Boolean}
     */
    function isAvailable(sVersion) {
        if (typeof sVersion == "undefined")
            sVersion = "1.0";
        if (typeof aIsAvailable[sVersion] == "undefined")
            aIsAvailable[sVersion] = isInstalled(sVersion);
        return aIsAvailable[sVersion];
    }
    
    if (window.addEventListener)
        window.addEventListener('load', startup, false);
    else
        window.attachEvent('onload', startup);
    
    return {
        /**
         * onGetSilverlight:
         *
         * Called by jpf.silverlight.GetSilverlight to notify the page that a user
         * has requested the Silverlight installer
         */
        onGetSilverlight     : null,
        createObject         : createObject,
        createObjectEx       : createObjectEx,
        getSilverlight       : getSilverlight,
        default_error_handler: default_error_handler,
        isAvailable          : isAvailable
    };
})();
// #endif
