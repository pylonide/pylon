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
 * @namespace apf
 * @private
 */
apf.silverlight = (function() {
    /**
     * {Number} silverlightCount:
     *
     * Counter of globalized event handlers
     */
    var silverlightCount = 0;
    
    /**
     * {Boolean} __onSilverlightInstalledCalled:
     *
     * Prevents onSilverlightInstalled from being called multiple times
     */
    var __onSilverlightInstalledCalled = false;
    
    /**
     * {String} fwlinkRoot:
     *
     * Prefix for fwlink URL's
     */
    var fwlinkRoot = 'http://go2.microsoft.com/fwlink/?LinkID=';
    
    /**
     * {Boolean} __installationEventFired:
     *
     * Ensures that only one Installation State event is fired.
     */
    var __installationEventFired = false;

    /**
     * {Function} onGetSilverlight
     *
     * Called by Silverlight.GetSilverlight to notify the page that a user
     * has requested the Silverlight installer
     */
    var onGetSilverlight = null;
    
    /**
     * Called by apf.silverlight.WaitForInstallCompletion when the page detects
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
        if (version == undefined)
        version = null;
            
        var isVersionSupported = false;
        var container = null;

        try {
            var control = null;
            var tryNS = false;

            if (window.ActiveXObject) {
                try {
                    control = new ActiveXObject('AgControl.AgControl');
                    if (version === null) {
                        isVersionSupported = true;
                    }
                    else if (control.IsVersionSupported(version)) {
                        isVersionSupported = true;
                    }
                    control = null;
                }
                catch (e) {
                    tryNS = true;
                }
            }
            else {
                tryNS = true;
            }
            if (tryNS) {
                var plugin = navigator.plugins["Silverlight Plug-In"];
                if (plugin) {
                    if (version === null) {
                        isVersionSupported = true;
                    }
                    else {
                        var actualVer = plugin.description;
                        if (actualVer === "1.0.30226.2")
                            actualVer = "2.0.30226.2";
                        var actualVerArray = actualVer.split(".");
                        while (actualVerArray.length > 3) {
                            actualVerArray.pop();
                        }
                        while (actualVerArray.length < 4) {
                            actualVerArray.push(0);
                        }
                        var reqVerArray = version.split(".");
                        while (reqVerArray.length > 4) {
                            reqVerArray.pop();
                        }

                        var requiredVersionPart;
                        var actualVersionPart;
                        var index = 0;
                        do {
                            requiredVersionPart = parseInt(reqVerArray[index]);
                            actualVersionPart = parseInt(actualVerArray[index]);
                            index++;
                        }
                        while (index < reqVerArray.length && requiredVersionPart === actualVersionPart);

                        if (requiredVersionPart <= actualVersionPart && !isNaN(requiredVersionPart)) {
                            isVersionSupported = true;
                        }
                    }
                }
            }
        }
        catch (e) {
            isVersionSupported = false;
        }
        
        return isVersionSupported;
    }
    
    /**
     * Occasionally checks for Silverlight installation status. If it
     * detects that Silverlight has been installed then it calls
     * apf.silverlight.onSilverlightInstalled();. This is only supported
     * if Silverlight was not previously installed on this computer.
     * 
     * @type {void}
     */
    function WaitForInstallCompletion(){
        if (!apf.silverlight.isBrowserRestartRequired && onSilverlightInstalled) {
            try {
                navigator.plugins.refresh();
            }
            catch(e) {}
            if (isInstalled(null) && !__onSilverlightInstalledCalled) {
                onSilverlightInstalled();
                __onSilverlightInstalledCalled = true;
            }
            else {
                $setTimeout(WaitForInstallCompletion, 3000);
            }    
        }
    }
    
    /**
     * Performs startup tasks
     * 
     * @type {void}
     */
    function startup() {
        navigator.plugins.refresh();
        apf.silverlight.isBrowserRestartRequired = isInstalled(null);
        if (!apf.silverlight.isBrowserRestartRequired) {
            WaitForInstallCompletion();
            if (!__installationEventFired) {
                onInstallRequired();
                __installationEventFired = true;
            }
        }
        else if (window.navigator.mimeTypes) {
            var mimeSL2 =   navigator.mimeTypes["application/x-silverlight-2"];
            var mimeSL2b2 = navigator.mimeTypes["application/x-silverlight-2-b2"];
            var mimeSL2b1 = navigator.mimeTypes["application/x-silverlight-2-b1"];
            var mimeHighestBeta = mimeSL2b1;
            if (mimeSL2b2)
                mimeHighestBeta = mimeSL2b2;
                
            if (!mimeSL2 && (mimeSL2b1 || mimeSL2b2)) {
                if (!__installationEventFired) {
                    onUpgradeRequired();
                    __installationEventFired = true;
                }
            }
            else if (mimeSL2 && mimeHighestBeta) {
                if (mimeSL2.enabledPlugin &&
                    mimeHighestBeta.enabledPlugin) {
                    if (mimeSL2.enabledPlugin.description !=
                        mimeHighestBeta.enabledPlugin.description) {
                        if (!__installationEventFired) {
                            onRestartRequired();
                            __installationEventFired = true;
                        }
                    }
                }
            }
        }
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
        var slPluginHelper = {},
            slProperties   = properties,
            slEvents       = events;
        
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
        var slPluginHTML;
        if (isInstalled(slPluginHelper.version)) {
            //move unknown events to the slProperties array
            for (var name in slEvents) {
                if (slEvents[name]) {
                    if (name == "onLoad" && typeof slEvents[name] == "function" 
                      && slEvents[name].length != 1 ) {
                        var onLoadHandler = slEvents[name];
                        slEvents[name] = function (sender) {
                            return onLoadHandler(document.getElementById(id), 
                                userContext, sender)
                        };
                    }
                    var handlerName = __getHandlerName(slEvents[name]);
                    if (handlerName != null) {
                        slProperties[name] = handlerName;
                        slEvents[name] = null;
                    }
                    else {
                        throw "typeof events."+name+" must be 'function' or 'string'";
                    }
                }
            }
            slPluginHTML = buildHTML(slProperties);
        }
        //The control could not be instantiated. Show the installation prompt
        else {
            slPluginHTML = buildPromptHTML(slPluginHelper);
        }

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
            htmlBuilder.push(' id="' + HtmlAttributeEncode(slProperties.id) + '"');
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
                htmlBuilder.push('<param name="' + HtmlAttributeEncode(name) 
                    + '" value="' + HtmlAttributeEncode(slProperties[name]) + '" />');
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
        var html = createObject(parameters.source, parameters.parentElement, 
            parameters.id, parameters.properties, parameters.events, 
            parameters.initParams, parameters.context);
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
        var urlRoot = fwlinkRoot;
        var version = slPluginHelper.version ;
        if (slPluginHelper.alt) {
            slPluginHTML = slPluginHelper.alt;
        }
        else {
            if (!version)
                version="";
            slPluginHTML = "<a href='javascript:Silverlight.getSilverlight(\"{1}\");' style='text-decoration: none;'><img src='{2}' alt='Get Microsoft Silverlight' style='border-style: none'/></a>";
            slPluginHTML = slPluginHTML.replace('{1}', version);
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
        if (onGetSilverlight )
            onGetSilverlight();
        
        var shortVer = "";
        var reqVerArray = String(version).split(".");
        if (reqVerArray.length > 1) {
            var majorNum = parseInt(reqVerArray[0]);
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
        throw new Error(apf.formatErrorString(0, this, errMsg.join('')));
    }
    
    /**
     * Releases event handler resources when the page is unloaded
     * 
     * @type {void}
     */
    function __cleanup() {
        for (var i = silverlightCount - 1; i >= 0; i--)
            window['__slEvent' + i] = null;
            
        silverlightCount = 0;
        if (window.removeEventListener)
            window.removeEventListener('unload', __cleanup , false);
        else 
            window.detachEvent('onunload', __cleanup );
    }
    
    /**
     * Generates named event handlers for delegates.
     * 
     * @param {Function} handler
     * @type {String}
     */
    function __getHandlerName(handler) {
        var handlerName = "";
        if (typeof handler == "string") {
            handlerName = handler;
        }
        else if (typeof handler == "function" ) {
            if (silverlightCount == 0) {
                if (window.addEventListener) 
                    window.addEventListener('onunload', __cleanup , false);
                else 
                    window.attachEvent('onunload', __cleanup);
            }
            var count = silverlightCount++;
            handlerName = "__slEvent"+count;
            
            window[handlerName]=handler;
        }
        else {
            handlerName = null;
        }
        return handlerName;
    }
    
    /**
     * onRequiredVersionAvailable:
     *
     * Called by version  verification control to notify the page that
     * an appropriate build of Silverlight is available. The page 
     * should respond by injecting the appropriate Silverlight control
     */
    function onRequiredVersionAvailable() {};
    
    /**
     * onRestartRequired:
     *
     * Called by version verification control to notify the page that
     * an appropriate build of Silverlight is installed but not loaded. 
     * The page should respond by injecting a clear and visible 
     * "Thanks for installing. Please restart your browser and return
     * to mysite.com" or equivalent into the browser DOM
     */
    function onRestartRequired() {};
    
    /**
     * onUpgradeRequired:
     *
     * Called by version verification control to notify the page that
     * Silverlight must be upgraded. The page should respond by 
     * injecting a clear, visible, and actionable upgrade message into
     * the DOM. The message must inform the user that they need to 
     * upgrade Silverlight to use the page. They are already somewhat
     * familiar with the Silverlight product when they encounter this.
     * Silverlight should be mentioned so the user expects to see that
     * string in the installer UI. However, the Silverlight-powered
     * application should be the focus of the solicitation. The user
     * wants the app. Silverlight is a means to the app.
     * 
     * The upgrade solicitation will have a button that directs 
     * the user to the Silverlight installer. Upon click the button
     * should both kick off a download of the installer URL and replace
     * the Upgrade text with "Thanks for downloading. When the upgarde
     * is complete please restart your browser and return to 
     * mysite.com" or equivalent.
     *
     * Note: For a more interesting upgrade UX we can use Silverlight
     * 1.0-style XAML for this upgrade experience. Contact PiotrP for
     * details.
     */
    function onUpgradeRequired() {};
    
    /**
     * onInstallRequired:
     *
     * Called by Silverlight.checkInstallStatus to notify the page
     * that Silverlight has not been installed by this user.
     * The page should respond by 
     * injecting a clear, visible, and actionable upgrade message into
     * the DOM. The message must inform the user that they need to 
     * download and install components needed to use the page. 
     * Silverlight should be mentioned so the user expects to see that
     * string in the installer UI. However, the Silverlight-powered
     * application should be the focus of the solicitation. The user
     * wants the app. Silverlight is a means to the app.
     * 
     * The installation solicitation will have a button that directs 
     * the user to the Silverlight installer. Upon click the button
     * should both kick off a download of the installer URL and replace
     * the Upgrade text with "Thanks for downloading. When installation
     * is complete you may need to refresh the page to view this 
     * content" or equivalent.
     */
    function onInstallRequired() {};

    /**
     * IsVersionAvailableOnError:
     *
     * This function should be called at the beginning of a web page's
     * Silverlight error handler. It will determine if the required 
     * version of Silverlight is installed and available in the 
     * current process.
     *
     * During its execution the function will trigger one of the 
     * Silverlight installation state events, if appropriate.
     *
     * Sender and Args should be passed through from  the calling
     * onError handler's parameters. 
     *
     * The associated Sivlerlight <object> tag must have
     * minRuntimeVersion set and should have autoUpgrade set to false.
     */
    function IsVersionAvailableOnError(sender, args) {
        var retVal = false;
        try {
            if (args.ErrorCode == 8001 && !__installationEventFired) {
                onUpgradeRequired();
                __installationEventFired = true;
            }
            else if (args.ErrorCode == 8002 && !__installationEventFired) {
                onRestartRequired();
                __installationEventFired = true;
            }
            // this handles upgrades from 1.0. That control did not
            // understand the minRuntimeVerison parameter. It also
            // did not know how to parse XAP files, so would throw
            // Parse Error (5014). A Beta 2 control may throw 2106
            else if (args.ErrorCode == 5014 || args.ErrorCode == 2106) {
                if (__verifySilverlight2UpgradeSuccess(args.getHost()))
                    retVal = true;
            }
            else {
                retVal = true;
            }
        }
        catch (e) { }
        return retVal;
    };
    
    /**
     * IsVersionAvailableOnLoad:
     *
     * This function should be called at the beginning of a web page's
     * Silverlight onLoad handler. It will determine if the required 
     * version of Silverlight is installed and available in the 
     * current process.
     *
     * During its execution the function will trigger one of the 
     * Silverlight installation state events, if appropriate.
     *
     * Sender should be passed through from  the calling
     * onError handler's parameters. 
     *
     * The associated Sivlerlight <object> tag must have
     * minRuntimeVersion set and should have autoUpgrade set to false.
     */
    function IsVersionAvailableOnLoad(sender) {
        var retVal = false;
        try {
            if (__verifySilverlight2UpgradeSuccess(sender.getHost()))
                retVal = true;
        }
        catch (e) {}
        return retVal;
    };
    
    /**
     * __verifySilverlight2UpgradeSuccess:
     *
     * This internal function helps identify installation state by
     * taking advantage of behavioral differences between the
     * 1.0 and 2.0 releases of Silverlight. 
     *
     */
    function __verifySilverlight2UpgradeSuccess(host) {
        var retVal = false,
            version = "2.0.31005",
            installationEvent = null;

        try {
            if (host.IsVersionSupported(version + ".99")) {
                installationEvent = onRequiredVersionAvailable;
                retVal = true;
            }
            else if (host.IsVersionSupported(version + ".0")) {
                installationEvent = onRestartRequired;
            }
            else {
                installationEvent = onUpgradeRequired;
            }

            if (installationEvent && !__installationEventFired) {
                installationEvent();
                __installationEventFired = true;
            }
        }
        catch (e) {}
        return retVal;
    };
    
    var aIsAvailable = {};
    /*
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
    
    return {
        /**
         * onGetSilverlight:
         *
         * Called by apf.silverlight.GetSilverlight to notify the page that a user
         * has requested the Silverlight installer
         */
        onGetSilverlight        : null,
        isBrowserRestartRequired: false,
        startup                 : startup,
        createObject            : createObject,
        createObjectEx          : createObjectEx,
        getSilverlight          : getSilverlight,
        default_error_handler   : default_error_handler,
        isAvailable             : isAvailable
    };
})();
// #endif
