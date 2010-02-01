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
// #ifdef __AMLUPLOAD || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element allowing the user to upload a file to a server. This element does 
 * not have a visual representation. By adding buttons, a progressbar and other
 * elements you can fully customize your upload component. Use
 * {@link term.propertybinding property binding} to update those elements with
 * the state of the upload element.
 * 
 * Example:
 * This example shows an upload element that pushes an image to the server. The
 * asp script returns an xml string which is added to the list of images on a
 * successfull upload.
 * <code>
 *  <a:list id="lstImages" smartbinding="..." model="..." />
 *
 *  <a:upload id="uplMain"
 *    target    = "../api/UploadPicture.asp"
 *    ontimeout = "alert('It seems the server went away')"
 *    oncancel  = "alert('Could not upload logo')"
 *    onuploaded = "lstImages.add(arguments[0])" />
 *
 *  <a:button caption="Browse file..." onclick="uplMain.browse()" 
 *    disabled="{uplMain.uploading}" />
 *  <a:button caption="{uplMain.uploading ? 'Cancel' : 'Send'}" 
 *    disabled="{!uplMain.value}" onclick="
 *      if (uplMain.uploading)
 *          uplMain.cancel();
 *      else
 *          uplMain.upload();
 *    " />
 * </code>
 *
 * @event afterbrowse Fires after the user has made a selection.
 *   object:
 *   {String} value the path of the file selected
 *
 * @constructor
 * @alias upload
 * @addnode elements
 *
 * @inherits apf.StandardBinding
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the value based on data loaded into this component.
 * <code>
 *  <a:upload>
 *      <a:bindings>
 *          <a:value match="[@filename]" />
 *      </a:bindings>
 *  </a:upload>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:upload value="[@filename]" />
 * </code>
 *
 * @todo get server side information to update the progressbar.
 */

apf.upload = function(struct, tagName){
    this.$init(tagName || "upload", apf.NODE_VISIBLE, struct);
    // #ifndef __PACKAGED
    this.DEFAULT_SWF_PATH = (apf.config.resourcePath || apf.basePath)
        + "elements/upload/Swiff.Uploader.swf?noCache=".appendRandomNumber(5);
    /* #else
    this.DEFAULT_SWF_PATH = (apf.config.resourcePath || apf.basePath)
        + "resources/Swiff.Uploader.swf?noCache=".appendRandomNumber(5);
    #endif */

    this.$playerId     = apf.flash.addPlayer(this);
    this.$useFlash     = apf.flash.isAvailable("9.0.0");
    // might be overridden later by the 'model' prophandler:
    this.$files        = new apf.upload.files();
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );

    this.width               = 300;
    this.height              = 20;
    this.method              = "post";
    this.progress            = 0;
    this.uploading           = false;
    this["type-filter"]      = null;
    this.multiple            = true;
    this.queued              = 1;
    this.policyfile          = null;
    this.data                = null;
    this["merge-data"]       = true;
    this.fieldname           = "Filedata";
    this["filesize-min"]     = 1;
    this["filesize-max"]     = 0;
    this["allow-duplicates"] = false;
    this["time-limit"]       = apf.isLinux ? 0 : 30;
    this.noflash             = false;
    this.timeout             = 100000;
    this.$player             = null;
    this.$playerInited       = false;
    this.$focussable         = false;

    /**** Properties and attributes ****/

    this.$booleanProperties["uploading"]        = true;
    this.$booleanProperties["multiple"]         = true;
    this.$booleanProperties["merge-data"]       = true;
    this.$booleanProperties["allow-duplicates"] = true;
    this.$booleanProperties["noflash"]          = true;

    /**
     * @attribute {String}  value              the path of the file to uploaded,
     *                                         or the online path after upload.
     * @attribute {String}  target             URL to the server-side script
     *                                         (relative URLs are changed automatically
     *                                         to absolute paths).
     * @attribute {String}  [method]           if the method is ‘get’, data is
     *                                         appended as query-string to the URL.
     *                                         The upload will always be a POST request.
     *                                         Defaults to 'post'.
     * @attribute {Number}  !progress          the position of the progressbar
     *                                         indicating the position in the
     *                                         upload process, i.e. the realtive
     *                                         overall loaded size of running and
     *                                         completed files in the list in
     *                                         % / 100 (0..1).
     * @attribute {Boolean} !uploading         whether this upload element is
     *                                         uploading.
     * @attribute {Number}  !size              the overall size of all files in
     *                                         the list in byte.
     * @attribute {Number}  !bytes-loaded      the overall loaded size of running
     *                                         and completed files in the list in bytes.
     * @attribute {Number}  !bytes-total       the total size of files in the
     *                                         uploader queue in bytes.
     * @attribute {Number}  !rate              the overall rate of running files
     *                                         in the list in bytes/second.
     * @attribute {String}  [rel]              the AML element the file input should
     *                                         retrieve its dimensions from
     * @attribute {String}  [type-filter]      key/value pairs are used as filters
     *                                         for the dialog.
     *                                         Defaults to NULL.
     * Example:
     * <code>
     *  <a:upload type-filter="'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'" />
     * </code>
     * @attribute {Boolean} [multiple]         If true, the browse-dialog allows
     *                                         multiple-file selection.
     *                                         Defaults to TRUE.
     * @attribute {Number}  [queued]           maximum of currently running files.
     *                                         If this is false, all files are uploaded
     *                                         at once. Defaults to '1'.
     * @attribute {String}  [policyfile]       location the cross-domain policy file.
     * {@link http://livedocs.adobe.com/flash/9.0/ActionScriptLangRefV3/flash/system/Security.html#loadPolicyFile%28%29 Flash Security.loadPolicyFile}
     * @attribute {String}  [data]             key/data values that are sent with
     *                                         the upload requests.
     * @attribute {Boolean} [merge-data]       If true, the data option from uploader
     *                                         and file is merged (prioritised file
     *                                         data). Defaults to TRUE.
     * @attribute {String}  [fieldname]        the key of the uploaded file on your
     *                                         server, similar to name in a file-input.
     *                                         Linux Flash ignores it, better avoid it.
     *                                         Defaults to 'Filedata'.
     * @attribute {Number}  [filesize-min]     validates the minimal size of a
     *                                         selected file byte.
     *                                         Defaults to '1'.
     * @attribute {Number}  [filesize-max]     validates the maximal size of a
     *                                         selected file
     *                                         (official limit is 100 MB for
     *                                         FileReference, I tested up to 2 GB)
     *                                         Defaults to '0'.
     * @attribute {Boolean} [allow-duplicates] validates that no duplicate files
     *                                         are added.
     *                                         Defaults to FALSE.
     * @attribute {Number}  [time-limit]       timeout in seconds. If the upload
     *                                         is without progress, it is cancelled
     *                                         and event complete gets fired (with
     *                                         error string timeout).
     *                                         Occurs usually when the server sends
     *                                         an empty response (also on redirects).
     *                                         Defaults to '30', '0' for linux.
     * @attribute {Boolean} [noflash]          whether to use flash, or fallback
     *                                         immediately to the 'old-fashioned'
     *                                         HTML uploader.
     *
     * Example:
     * When the skin doesn't have a progressbar you can use property binding to
     * update a seperate or central progressbar.
     * <code>
     *  <a:upload id="upExample" />
     *  <a:progressbar value="{upExample.progress}" />
     * </code>
     */
    this.$supportedProperties.push("value", "target", "method", "progress", "uploading",
        "rel", "bgswitch", "file-type", "multiple", "queued", "policyfile",
        "data", "merge-data", "fieldname", "filesize-min", "filesize-max",
        "allow-duplicates", "time-limit", "model");

    this.$propHandlers["value"] = function(value){
        if (!this.value)
            this.old_value = value;
        this.value = value;
    };

    this.$propHandlers["target"] = function(value){
        this.target = value = this.$qualifyPath(value);
        if (this.form)
            this.form.setAttribute("action", value);
    };

    this.$propHandlers["bgswitch"] = function(value) {
        if (!value) return;
        
        this.$getLayoutNode("main", "background", this.$ext)
            .style.backgroundImage = "url(" + this.mediaPath + value + ")";
        this.$getLayoutNode("main", "background", this.$ext)
            .style.backgroundRepeat = "no-repeat";
    };

    this.$propHandlers["rel"] = function(value) {
        var _self = this;
        window.setTimeout(function() {
            _self.rel = eval(value);
            if (_self.rel)
                _self.$reposition();
        });
    };


    var propModelHandler = this.$propHandlers["model"];
    this.$propHandlers["model"] = function(value) {
        if (!value) return;
        this.$files = new apf.upload.files(value);
        propModelHandler.call(this, value);
    };

    this.$propHandlers["noflash"] = function(value) {
        this.$useFlash = !value;
    };

    /**** Public methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the icon of the button
     * @param {String} url the location of the image to be used as an icon
     */
    this.setIcon = function(url){
        this.setProperty("icon", url, false, true);
    };

    /**
     * Sets the caption of the button
     * @param {String} value the text displayed on the button
     */
    this.setCaption = function(value){
        this.setProperty("caption", value, false, true);
    };

    //#endif

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.value;
    };

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };

    /**
     * Opens the browse window which allows the user to choose a file to upload.
     */
    this.browse = function(){
        // 'browse' action not available when the control is disabled, or when
        // using Flash Uploader:
        if (this.disabled || this.$useFlash || !this.$ext.parentNode.offsetHeight) //@todo apf3.0
            return;

        this.inpFile.click();
        
        if (this.inpFile.value != this.value) {
            this.setProperty("value", this.inpFile.value, false, true);
            this.dispatchEvent("afterbrowse", {value: this.value});
        }
    };

    /**
     * Starts uploading the selected file.
     */
    this.upload = function(){
        if (!this.$useFlash) {
            if (this.value != this.inpFile.value || !this.inpFile.value)
                return;

            this.old_value = this.value;
            this.value = this.inpFile.value;
            this.setValue(this.value);
        }

        this.$upload();
    };

    /**
     * Cancels the upload process
     * @param {String} msg the reason why the process was cancelled.
     */
    this.cancel = function(msg){
        return this.$cancel(msg);
    }

    /**
     * Sets the target frame to which the form is posted
     * @param {String} target the name of the frame receiving the form post.
     */
    this.setTarget = function(target){
        if (this.$useFlash) return;

        this.target = target;
        this.$initForm();
    };

    this.event = function(eventName, eventObj) {
        switch (eventName) {
            case "load":
                this.$initUploader();
                break;
            case "fail":
                /*
                 * flash   - Flash is not installed or the Flash version did not
                 *           meet the requirements.
                 * blocked - The user has to enable the movie manually because
                 *           of Flashblock, no refresh required.
                 * empty   - The Flash movie failed to load, check if the file
                 *           exists and the path is correct.
                 * hidden  - Adblock Plus blocks hides the movie, the user has
                 *           enable it and refresh.
                 */
                break;
            case "queue":
                //Function to execute when the queue statistics are updated.
                this.setProperty("bytes-loaded", eventObj.bytesLoaded);
                this.setProperty("bytes-total",  eventObj.size);
                this.setProperty("progress",     eventObj.percentLoaded / 100);
                this.setProperty("rate",         eventObj.rate);
                break;
            case "complete":
                //Function to execute when all files are uploaded (or stopped).
                this.setProperty("uploading", false);
                break;
            case "buttonEnter":
            case "buttonLeave":
            case "buttonDown":
            case "buttonDisable":
                this.$setState(eventName);
                break;
            case "browse":
                //Function to execute when the browse-dialog opens.
            case "disabledBrowse":
                //Function to execute when the user tries to open the browse-dialog,
                //but the uploader is disabled.
                if (this.rel && !this.rel.disabled)
                    this.rel.setProperty("disabled", true);
                break;
            case "cancel":
                //Function to execute when the user closes the browse-dialog without a selection.
                this.setProperty("uploading", false);
                break;
            //case "select": <-- deprecated
            case "selectSuccess":
                //Function to execute when files were selected and validated successfully.
                //param: successFiles
                this.$files.createMany(eventObj);
                break;
            case "selectFail":
                //Function to execute when files were selected and failed validation.
                //param: failFiles
                //validation error values: duplicate, sizeLimitMin, sizeLimitMax
                this.$files.removeMany(eventObj);
                break;
            case "fileStart":
                //Function to execute when flash initialised the upload for a file.
            case "fileStop":
                //Function to execute when a file got stopped manually.
            case "fileRequeue":
                //Function to execute when a file got added back to the queue after
                //being stopped or completed.
            case "fileOpen":
                //Function to execute when the file is accessed before for upload.
            case "fileProgress":
                //Function to execute when the upload reports progress.
            case "fileComplete":
                //Function to execute when a file is uploaded or failed with an error.
            case "fileRemove":
                //Function to execute when a file got removed.
                this.$files.update(eventObj);
                break;
            default:
                break;
        }

        this.setAttribute("value", this.$files.getValue());
    };

    /**** Private state handling methods ****/

    this.$initUploader = function() {
        this.$playerInited = true;
        apf.flash.remote(this.$player, "initialize", {
            width          : this.width,
            height         : this.height,
            typeFilter     : this["type-filter"],
            multiple       : this.multiple,
            queued         : this.queued,
            url            : this.target,
            method         : this.method,
            data           : this.data,
            mergeData      : this["merge-data"],
            fieldName      : this["fieldname"],
            // #ifdef __DEBUG
            verbose        : true,
            /* #else
            verbose         : false,
            #endif */
            fileSizeMin    : this["filesize-min"],
            fileSizeMax    : this["filesize-max"],
            allowDuplicates: this["allow-duplicates"],
            timeLimit      : this["time-limit"],
            policyFile     : this["policyfile"]
        });
    };

    var states = {
        "buttonEnter": "Over",
        "buttonLeave": "Out",
        "buttonDown":  "Down"
    };

    this.$setState = function(state) {
        if (!this.rel) return null; // @todo this will go when this class inherits from button

        if (state == "buttonDisabled")
            return this.rel.setProperty("disabled", true);
        else if (this.rel.disabled)
            this.rel.setProperty("disabled", false);

        return this.rel.$setState(states[state]);
    };

    this.$reposition = function() {
        if (!this.rel) return; // @todo this will go when this class inherits from button

        var o   = this.rel.$ext,
            pos = apf.getAbsolutePosition(o);
        this.$ext.style.top    = pos[1] + "px";
        this.$ext.style.left   = pos[0] + "px";
        this.$ext.style.width  = o.offsetWidth + "px";
        this.$ext.style.height = o.offsetHeight + "px";
    };

    var anchor;
    this.$qualifyPath = function(path) {
        (anchor || (anchor = document.createElement("a"))).href = path;
        return anchor.href;
    };

    this.$updateProgress = function(){
        this.setProperty("progress", Math.min(1, (this.progress || 0) + (1/800)));
    };

    this.$upload = function(){
        this.$uploading = true;

        this.setProperty("uploading", true);

        if (this.$useFlash) {
            apf.flash.remote(this.$player, "start");
        }
        else {
            this.timer = setInterval('apf.lookup(' + this.$uniqueId + ').$updateProgress()', 800);
            this.timeout_timer = $setTimeout('apf.lookup(' + this.$uniqueId + ').$timeout()', this.timeout);
            this.form.submit();
        }
    };

    /**
     * @event uploaded Fires when the upload succeeded, was cancelled or failed.
     *   object:
     *   {String} data the data that was returned by the upload post.
     */
    this.$done = function(data){
        window.clearInterval(this.timer);
        window.clearInterval(this.timeout_timer);
        window.setTimeout('apf.lookup(' + this.$uniqueId + ').$clearProgress()', 300);

        //if (value)
        //    this.setValue(value);
        this.old_value = null;

        //if(caption)
        //this.setCaption(this.lastCaption);

        this.data = data;

        this.dispatchEvent("uploaded", {
            data: data
        });

        this.$initForm();
        this.$uploading = false;
    };

    this.$cancel = function(value){
        if (this.$useFlash) {
            apf.flash.remote(this.$player, "stop");
        }
        else {
            window.clearInterval(this.timer);
            window.clearInterval(this.timeout_timer);

            if (this.old_value)
                this.setValue(this.old_value);
            this.old_value = null;

            this.$initForm();
        }

        this.dispatchEvent("cancel", {
            returnValue: value
        });
        this.$uploading = false;

        this.$clearProgress();
    };

    /**
     * @event timeout Fires when the upload timed out.
     */
    this.$timeout = function(){
        clearInterval(this.timer);
        clearInterval(this.timeout_timer);

        /*this.oCaption.nodeValue = this.$aml.firstChild
            ? this.$aml.firstChild.nodeValue
            : "";*/
        this.$clearProgress();

        if (this.old_value)
            this.setValue(this.old_value);
        this.old_value = null;

        this.dispatchEvent("timeout");

        this.$initForm();
        this.$uploading = false;
    };

    this.$clearProgress = function(){
        this.setProperty("progress", 0);
        this.setProperty("uploading", false);
    };

    /**** Event handling ****/

    this.$initForm = function(){
        if (apf.isIE) {
            this.oFrame.contentWindow.document.write("<body></body>");
            this.form = apf.insertHtmlNode(this.$getLayoutNode("form"),
                this.oFrame.contentWindow.document.body);
        }

        //this.form = this.$getLayoutNode("main", "form", this.$ext);
        this.form.setAttribute("action", this.target);
        this.form.setAttribute("target", "upload" + this.$uniqueId);
        this.$getLayoutNode("form", "inp_uid", this.form)
            .setAttribute("value", this.$uniqueId);
        this.inpFile = this.$getLayoutNode("form", "inp_file", this.form);

        var _self = this;
        if (!apf.isIE) {
            this.inpFile.setAttribute("size", "0");
            this.inpFile.onchange = function(){
                //amlNode.$startUpload();
                _self.setProperty("value", this.value);
            }
        }

        if (apf.debug == 2) {
            this.oFrame.style.visibility = "visible";
            this.oFrame.style.width      = "100px";
            this.oFrame.style.height     = "100px";
        }

        if (apf.isIE) return;
        
        var timer = setInterval(function() {
            var oNode = _self.rel ? _self.rel : null;

            _self.inpFile.onchange = function() {_self.browse();};

            if (oNode && oNode.$ext && oNode.$ext.offsetHeight) {
                if (oNode.$ext.offsetWidth == 0 || oNode.$ext.offsetHeight == 0)
                    return;
                var z = parseInt(oNode.$ext.style.zIndex) || 1;
                oNode.$ext.style.zIndex      = z;
                _self.inpFile.style.zIndex   = ++z;
                _self.inpFile.style.margin   = "0";
                _self.inpFile.style.position = oNode.$ext.style.position;
                _self.inpFile.style.width    = oNode.$ext.offsetWidth  + "px";
                _self.inpFile.style.height   = oNode.$ext.offsetHeight + "px";
                _self.inpFile.style.top      = (oNode.$ext.offsetTop - 20)    + "px";
                _self.inpFile.style.left     = (oNode.$ext.offsetLeft - 8)   + "px";
                // @todo: resize/ move on browser resize
                
                clearInterval(timer);
            }
        }, 500);
    };

    /**
     * @event beforeuploaded Fires before data is uploaded.
     *   cancelable: Prevents the data from being uploaded.
     *   object:
     *   {String} data the data that was returned by the upload post.
     *   {HTMLFrameElement} frame the iframe serving as the target to the form post.
     */
    this.$draw = function(){
        this.$name = "upload" + this.$uniqueId;
        var _self = this;
        // first we try the Flash method:
        this.$useFlash = !this.getAttribute("noflash");
        if (this.$useFlash && !this["noflash"]) {
            this.$ext = this.$getExternal("main");//, null, function(oExt) {
            //console.dir(oExt);
            this.$ext.style.position = "absolute";
            this.$ext.style.zIndex   = "9999";
            this.$ext.style.width    = this.width;
            this.$ext.style.height   = this.height;
            apf.flash.embed({
                // apf.flash#embed properties
                context          : this,
                htmlNode         : this.$ext,
                // movie properties
                src              : this.DEFAULT_SWF_PATH,
                width            : "100%",
                height           : "100%",
                id               : this.$name,
                quality          : "high",
                //bgcolor          : "#000000",
                //allowFullScreen  : "true",
                name             : this.$name,
                flashvars        : "playerID=" + this.$playerId,
                allowScriptAccess: "always",
                wMode            : "transparent",
                swLiveConnect    : "true",
                type             : "application/x-shockwave-flash",
                pluginspage      : "http://www.adobe.com/go/getflashplayer",
                menu             : "false"
            });
        }
        else {
            this.width  = 'auto';
            this.height = 'auto';
            //Build Main Skin
            this.$ext = this.$getExternal("main", null, function(oExt){
                oExt.appendChild(oExt.ownerDocument.createElement("iframe"))
                    .setAttribute("name", "upload" + this.$uniqueId);
            });

            if (!apf.isIE)
                this.form = apf.insertHtmlNode(this.$getLayoutNode("form"), this.$ext);

            this.oFrame = this.$ext.getElementsByTagName("iframe")[0];
            apf.AbstractEvent.addListener(this.oFrame, "load", function(){
                if (!_self.uploading)
                    return;

                var data = "";
                try {
                    data = apf.html_entity_decode(_self.oFrame.contentWindow
                        .document.body.innerHTML.replace(/<PRE>|<\/PRE>/ig, ""));
                }
                catch(e){}

                var hasFailed = _self.dispatchEvent("beforeuploaded", {
                    data  : data,
                    frame : _self.oFrame
                }) === false;

                if (hasFailed)
                    _self.$cancel();
                else
                    _self.$done(data);
            });

            apf.AbstractEvent.addListener(this.oFrame, "error", function(){
                if (!_self.uploading)
                    return;

                _self.$cancel();
            });

            this.$initForm();
        }
    };

    this.addEventListener("DOMNodeRemovedFromDocument", function() {
        if (this.oFrame)
            this.oFrame.onload = null;
    });
// #ifdef __WITH_DATABINDING
}).call(apf.upload.prototype = new apf.StandardBinding());
/* #else
}).call(apf.upload.prototype = new apf.Presentation());
#endif*/

apf.upload.files = function(model) {
    if (typeof model == "string")
        model = apf.nameserver.get("model", model);

    if (model)
        model.load("<files/>");

    var files = {},
        userProps = {"addDate":1, "creationDate":1, "extension":1, "id":1,
                     "modificationDate":1, "name":1, "size":1, "status":1,
                     "validationError":1
        };

    this.create = function(file) {
        if (!file || !file.id || files[file.id]) return null;

        files[file.id] = file;
        if (model) {
            file.xml = model.data.ownerDocument.createElement("file");
            apf.xmldb.appendChild(model.data, file.xml);
        }

        return this.update(file);
    };

    this.createMany = function(arr) {
        if (!arr || !arr.length) return;

        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i])
                this.create(arr[i]);
        }
    };

    this.read = function(filename) {

    };

    this.update = function(file) {
        if (!file || !file.id) return null;

        var i;
        if (!file.xml) {
            var t = file;
            file = files[file.id];
            for (i in userProps)
                file[i] = t[i];
        }
        if (!model || !file.xml) return null;

        for (i in userProps) {
            if (typeof file[i] == "undefined") continue;
            if (i.indexOf("Date") != -1 && typeof file[i] == "number")
                file[i] = new Date(file[i]);

            file.xml.setAttribute(i, (i == "status")
                ? apf.upload.STATUS_MAP[file[i]]
                : file[i]);
        }

        apf.xmldb.applyChanges("synchronize", file.xml);

        return file;
    };

    this.remove = function(file) {
        if (!file || !file.id || !files[file.id]) return;

        file = files[file.id];
        if (model && file.xml)
            apf.xmldb.removeChild(model.data, file.xml);
        delete files[file.id];
    };

    this.removeMany = function(arr) {
        if (!arr || !arr.length) return;

        for (var i = 0, l = arr.length; i < l; i++) {
            if (arr[i])
                this.remove(arr[i]);
        }
    };

    this.getValue = function() {
        var i,
            a = [];
        for (i in files)
            a.push(files[i].name);
        return a.join("|");
    };
};

apf.upload.STATUS_QUEUED   = 0;
apf.upload.STATUS_RUNNING  = 1;
apf.upload.STATUS_ERROR    = 2;
apf.upload.STATUS_COMPLETE = 3;
apf.upload.STATUS_STOPPED  = 4;
apf.upload.STATUS_MAP = ["queued", "running", "error", "complete", "stopped"];


apf.aml.setElement("upload", apf.upload);
// #endif
