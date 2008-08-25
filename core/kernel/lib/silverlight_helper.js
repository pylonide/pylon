/*
 *  Silverlight.js   			version 2.0.30523.6
 *
 *  This file is provided by Microsoft as a helper file for websites that
 *  incorporate Silverlight Objects. This file is provided under the Microsoft
 *  Public License available at 
 *  http://code.msdn.microsoft.com/silverlightjs/Project/License.aspx.  
 *  You may not use or distribute this file or the code in this file except as 
 *  expressly permitted under that license.
 * 
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 */

// #ifdef __WITH_SILVERLIGHT
jpf.silverlight_helper = {
    /**
     * _silverlightCount:
     *
     * Counter of globalized event handlers
     */
    _silverlightCount: 0,
    
    /**
     * fwlinkRoot:
     *
     * Prefix for fwlink URL's
     */
    fwlinkRoot: 'http://go2.microsoft.com/fwlink/?LinkID=',
    
    /**
     * onGetSilverlight:
     *
     * Called by jpf.silverlight_helper.GetSilverlight to notify the page that a user
     * has requested the Silverlight installer
     */
    onGetSilverlight: null,
    
    /**
     * onSilverlightInstalled:
     *
     * Called by jpf.silverlight_helper.WaitForInstallCompletion when the page detects
     * that Silverlight has been installed. The event handler is not called
     * in upgrade scenarios.
     */
    onSilverlightInstalled: function () {
        window.location.reload(false);
    },
    
    /**
     * isInstalled:
     *
     * Checks to see if the correct version is installed
     *
     */
    isInstalled: function(version){
        var isVersionSupported = false;
        var container = null;
        
        try {
            var control = null;
            try {
                control = new ActiveXObject('AgControl.AgControl');
                if (version == null)
                    isVersionSupported = true;
                else if (control.IsVersionSupported(version))
                    isVersionSupported = true;
                control = null;
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
                        var actualVerArray =actualVer.split(".");
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
    },
    
    /**
     * WaitForInstallCompletion:
     *
     * Occasionally checks for Silverlight installation status. If it
     * detects that Silverlight has been installed then it calls
     * jpf.silverlight_helper.onSilverlightInstalled();. This is only supported
     * if Silverlight was not previously installed on this computer.
     */
    WaitForInstallCompletion: function(){
        if (!jpf.silverlight_helper.isBrowserRestartRequired 
          && jpf.silverlight_helper.onSilverlightInstalled) {
            try {
                navigator.plugins.refresh();
            }
            catch(e) {}
            if (jpf.silverlight_helper.isInstalled(null))
                jpf.silverlight_helper.onSilverlightInstalled();
            else
                setTimeout(jpf.silverlight_helper.WaitForInstallCompletion, 3000);
        }
    },
    
    /**
     * __startup:
     *
     * Performs startup tasks
     */
    __startup: function() {
        this.isBrowserRestartRequired = this.isInstalled(null);
        if (!this.isBrowserRestartRequired)
            this.WaitForInstallCompletion();
        if (window.removeEventListener)
            window.removeEventListener('load', this.__startup , false);
        else
            window.detachEvent('onload', this.__startup );
    },
    
    /**
     * createObject:
     *
     * Inserts a Silverlight <object> tag or installation experience into the HTML
     * DOM based on the current installed state of Silverlight. 
     */
    createObject: function(source, parentElement, id, properties, events, initParams, userContext) {
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
    
        if (this.isInstalled(slPluginHelper.version)) {
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
                    var handlerName = this.__getHandlerName(slEvents[name]);
                    if (handlerName != null) {
                        slProperties[name] = handlerName;
                        slEvents[name] = null;
                    }
                    else {
                        throw "typeof events."+name+" must be 'function' or 'string'";
                    }
                }
            }
            slPluginHTML = this.buildHTML(slProperties);
        }
        //The control could not be instantiated. Show the installation prompt
        else {
            slPluginHTML = this.buildPromptHTML(slPluginHelper);
        }
    
        // insert or return the HTML
        if (parentElement)
            parentElement.innerHTML = slPluginHTML;
        else
            return slPluginHTML;
    },
    
    /**
     *  buildHTML:
     *
     *  create HTML that instantiates the control
     */
    buildHTML: function( slProperties) {
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
                htmlBuilder.push('<param name="' 
                  + this.HtmlAttributeEncode(name) + '" value="' 
                  + this.HtmlAttributeEncode(slProperties[name]) 
                  + '" />');
        }
        htmlBuilder.push('<\/object>');
        return htmlBuilder.join('');
    },
    
    /**
     * createObjectEx:
     *
     * takes a single parameter of all createObject 
     * parameters enclosed in {}
     */
    createObjectEx: function(params) {
        var parameters = params;
        var html = this.createObject(parameters.source, 
            parameters.parentElement, parameters.id, parameters.properties, 
            parameters.events, parameters.initParams, parameters.context);
        if (parameters.parentElement == null)
            return html;
    },
    
    /**
     * buildPromptHTML
     *
     * Builds the HTML to prompt the user to download and install Silverlight
     */
    buildPromptHTML: function(slPluginHelper) {
        var slPluginHTML = "";
        var urlRoot  = this.fwlinkRoot;
        var shortVer = slPluginHelper.version ;
        if (slPluginHelper.alt)
            slPluginHTML = slPluginHelper.alt;
        else {
            if (!shortVer)
                shortVer="";
            slPluginHTML = "<a href='javascript:jpf.silverlight_helper.getSilverlight(\"{1}\");' \
                style='text-decoration: none;'><img src='{2}' \
                alt='Get Microsoft Silverlight' style='border-style: none'/></a>";
            slPluginHTML = slPluginHTML.replace('{1}', shortVer );
            slPluginHTML = slPluginHTML.replace('{2}', urlRoot + '108181');
        }
        
        return slPluginHTML;
    },
    
    /**
     * getSilverlight:
     *
     * Navigates the browser to the appropriate Silverlight installer
     */
    getSilverlight: function(version) {
        if (this.onGetSilverlight)
            this.onGetSilverlight();
        
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
        
        this.followFWLink("114576" + verArg);
    },
    
    /**
     * followFWLink:
     *
     * Navigates to a url based on fwlinkid
     */
    followFWLink: function(linkid) {
        top.location = this.fwlinkRoot + String(linkid);
    },
    
    /**
     * HtmlAttributeEncode:
     *
     * Encodes special characters in input strings as charcodes
     */
    HtmlAttributeEncode: function(strInput) {
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
    },
    
    /**
     *  default_error_handler:
     *
     *  Default error handling function 
     */
    default_error_handler: function (sender, args) {
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
        alert(errMsg.join(''));
    },
    
    /**
     * __cleanup:
     *
     * Releases event handler resources when the page is unloaded
     */
    __cleanup: function () {
        for (var i = jpf.silverlight_helper._silverlightCount - 1; i >= 0; i--) {
            window['__slEvent' + i] = null;
        }
        jpf.silverlight_helper._silverlightCount = 0;
        if (window.removeEventListener)
           window.removeEventListener('unload', jpf.silverlight_helper.__cleanup , false);
        else
            window.detachEvent('onunload', jpf.silverlight_helper.__cleanup );
    },
    
    /**
     * __getHandlerName:
     *
     * Generates named event handlers for delegates.
     */
    __getHandlerName: function (handler) {
        var handlerName = "";
        if ( typeof handler == "string")
            handlerName = handler;
        else if ( typeof handler == "function" ) {
            if (this._silverlightCount == 0) {
                if (window.addEventListener) 
                    window.addEventListener('onunload', this.__cleanup , false);
                else 
                    window.attachEvent('onunload', this.__cleanup );
            }
            var count = this._silverlightCount++;
            handlerName = "__slEvent"+count;
            
            window[handlerName]=handler;
        }
        else {
            handlerName = null;
        }
        return handlerName;
    }
};

if (window.addEventListener)
    window.addEventListener('load', jpf.silverlight_helper.__startup , false);
else
    window.attachEvent('onload', jpf.silverlight_helper.__startup );
// #endif
