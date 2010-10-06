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

/**
 * Element displaying a Flash uploader
 *
 * @classDescription This class creates a new Flash uploader
 * @return {flash} Returns a new Flash uploader
 * @type {flash}
 * @constructor
 * @addnode elements:upload
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 */

apf.upload.flash = function(oUpload) {
    this.oUpload = oUpload;
    // #ifndef __PACKAGED
    this.DEFAULT_SWF_PATH = (apf.config.resourcePath || apf.basePath)
        + "elements/upload/Swiff.Uploader.swf?noCache=".appendRandomNumber(5);
    /* #else
    this.DEFAULT_SWF_PATH = (apf.config.resourcePath || apf.basePath)
        + "resources/Swiff.Uploader.swf?noCache=".appendRandomNumber(5);
    #endif */
    this.$playerId = apf.flash.addPlayer(this);
};

apf.upload.flash.isSupported = function() {
    return !apf.isIE && apf.flash.isAvailable("9.0.0");
};

(function() {
    var oCont;
 
    this.event = function(name, o) {
        var file,
            files = this.oUpload.$files;
        if (o && o.id)
            file = files.get(o.id);
        switch (name) {
            case "load":
                var filter  = this.oUpload.$filter,
                    oFilter = null;
                // get filter to look like: 'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'
                if (filter.length) {
                    oFilter = {};
                    oFilter["*." + filter.join(", *.")] = "*." + filter.join("; *.");
                }

                apf.flash.remote(this.$player, "initialize", {
                    typeFilter     : oFilter,
                    multiple       : this.oUpload.multiple,
                    queued         : 1,
                    url            : this.oUpload.target,
                    method         : "post",
                    data           : null,
                    mergeData      : true,
                    fieldName      : this.oUpload.filedataname,
                    // #ifdef __DEBUG
                    verbose        : true,
                    /* #else
                    verbose         : false,
                    #endif */
                    fileSizeMin    : 1,
                    fileSizeMax    : this.oUpload.maxfilesize,
                    allowDuplicates: false,
                    timeLimit      : apf.isLinux ? 0 : 30,
                    policyFile     : null
                });
            break;
            case "buttonEnter":
            case "buttonLeave":
            case "buttonDown":
            case "buttonDisable":
                this.oUpload.$setButtonState(name);
            break;
            case "browse":
                //Function to execute when the browse-dialog opens.
            case "disabledBrowse":
                //Function to execute when the user tries to open the browse-dialog,
                //but the uploader is disabled.
                this.oUpload.$setButtonState("buttonDisable");
            break;
            //case "select": <-- deprecated
            case "selectSuccess":
                //Function to execute when files were selected and validated successfully.
                //param: successFiles
                this.oUpload.$queue(o);
            break;
            case "selectFail":
                //Function to execute when files were selected and failed validation.
                //param: failFiles
                //validation error values: duplicate, sizeLimitMin, sizeLimitMax
                this.$files.removeMany(o);
            break;
            case "fileProgress":
                //Function to execute when the upload reports progress.
                file.loaded = o.progress.bytesLoaded;
                this.oUpload.$progress(file);
            break;
            case "fileComplete":
                //Function to execute when a file is uploaded or failed with an error.
                var httpStatus = o.response && o.response.error ? 500 : 200;

                file.status = httpStatus == 500 ? apf.upload.FAILED : apf.upload.DONE;
                file.loaded = httpStatus == 500 ? 0 : file.size;
                this.oUpload.$progress(file);
                this.oUpload.$fileDone(file, {
                    response: o.response ? o.response.text : "",
                    status  : httpStatus
                });
                
                // Is error status
                if (httpStatus >= 400) {
                    this.oUpload.dispatchEvent("error", {
                        code    : apf.upload.ERROR_CODES.HTTP_ERROR,
                        message : "HTTP Error: " + o.response.error + ", " + o.response.text,
                        file    : file,
                        status  : httpStatus
                    });
                }
            break;
            case "complete":
                //Function to execute when all files are uploaded (or stopped).
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
            case "queue":
            case "cancel":
                //Function to execute when the user closes the browse-dialog without a selection.
            case "fileStart":
                //Function to execute when flash initialised the upload for a file.
            case "fileStop":
                //Function to execute when a file got stopped manually.
            case "fileRequeue":
                //Function to execute when a file got added back to the queue after
                //being stopped or completed.
            case "fileOpen":
                //Function to execute when the file is accessed before for upload.
            case "fileRemove":
                //Function to execute when a file got removed.
            default:
            break;
        }
    };

    this.draw = function() {
        var uid   = this.oUpload.$uniqueId + "_swfupload",
            _self = this;
        oCont = this.oUpload.$ext;
        document.body.appendChild(oCont);
        oCont.style.position   = "absolute",
        oCont.style.background = "transparent",
        oCont.style.width      = "100px",
        oCont.style.height     = "100px",
        oCont.style.zIndex     = 99999;
        apf.flash.embed({
            // apf.flash#embed properties
            context          : this,
            htmlNode         : oCont,
            onError          : function(e) {
                _self.oUpload.dispatchEvent("error", e);
            },
            // movie properties
            src              : this.DEFAULT_SWF_PATH,
            width            : "100%",
            height           : "100%",
            id               : uid,
            quality          : "high",
            //bgcolor          : "#000000",
            //allowFullScreen  : "true",
            name             : uid,
            flashvars        : "playerID=" + this.$playerId,
            allowScriptAccess: "always",
            wMode            : "transparent",
            swLiveConnect    : "true",
            type             : "application/x-shockwave-flash",
            pluginspage      : "http://www.adobe.com/go/getflashplayer",
            menu             : "false"
        });
    };

    this.refresh = function() {
        var oBtn    = this.oUpload.$button.$ext;
        if (!oBtn) return;
        var btnPos  = apf.getAbsolutePosition(oBtn),
            btnDims = [oBtn.offsetWidth, oBtn.offsetHeight],
            contPos = apf.getAbsolutePosition(oCont);

        if (btnPos[0] != contPos[0])
            oCont.style.left   = btnPos[0] + "px";
        if (btnPos[1] != contPos[1])
            oCont.style.top    = btnPos[1] + "px";
        if (btnDims[0] != oCont.offsetWidth)
            oCont.style.width  = btnDims[0] + "px";
        if (btnDims[1] != oCont.offsetHeight)
            oCont.style.height = btnDims[1] + "px";
    };

    this.upload = function(file) {
        apf.flash.remote(this.$player, "fileStart", file.id);
    };

    this.removeFile = function(file) {
        apf.flash.remote(this.$player, "fileRemove", file.id);
    };
}).call(apf.upload.flash.prototype = new apf.Class());
// #endif
