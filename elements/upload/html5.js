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
 * Element displaying a HTML5 uploader
 *
 * @classDescription This class creates a new HTML5 uploader
 * @return {html5} Returns a new HTML5 uploader
 * @type {html5}
 * @constructor
 * @addnode elements:upload
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 */

apf.upload.html5 = function(oUpload) {
    this.oUpload = oUpload;
};

apf.upload.html5.isSupported = function() {
    return apf.hasXhrBinary;
};

(function() {
    var oCont, oInput,
        html5files = {};

    function addSelectedFiles(native_files) {
        var file, id,
            uid   = this.oUpload.$uniqueId,
            i     = 0,
            l     = native_files.length,
            files = [];

        // Add the selected files to the file queue
        for (i = 0; i < native_files.length; i++) {
            file = native_files[i];

            id = uid + "_html5_".appendRandomNumber(5);
            html5files[id] = file;

            // Expose id, name and size
            files.push({
                id:   id,
                name: file.fileName,
                size: file.fileSize
            });
        }

        // Fire $queue if we added any
        if (files.length)
            this.oUpload.$queue(files);
    }

    this.draw = function() {
        var type,
            mimes     = [],
            uid       = this.oUpload.$uniqueId,
            filter    = this.oUpload.$filter,
            i         = 0,
            l         = filter.length;
        oCont = this.oUpload.$ext;

        // Convert extensions to mime types list
        for (; i < l; ++i) {
            if (type = this.oUpload.mimeTypes[filter[i]])
                mimes.push(type);
        }

        // cleanup first
        if (oInput && oInput.parentNode && oCont && oCont.parentNode) {
            try {
                oCont.removeChild(oInput);
            }
            catch(ex) {}
            oInput = null;
        }

        oCont.style.position   = "absolute",
        oCont.style.background = "transparent",
        oCont.style.width      = "100px",
        oCont.style.height     = "100px",
        oCont.style.overflow   = "hidden",
        oCont.style.zIndex     = 99999,
        oCont.style.cursor     = "default",
        oCont.style.opacity    = "0"; // Force transparent

        // Insert the input inide the input container
        oCont.innerHTML = '<input id="' + uid + '_html5" ' +
            'style="width:100%;" type="file" accept="' + mimes.join(",") + '" ' +
            (this.oUpload.multiple ? 'multiple="multiple"' : '') + ' />';
        oInput = document.getElementById(uid + "_html5");

        var _self = this;
        oInput.onchange = function() {
            // Add the selected files from file input
            addSelectedFiles.call(_self, this.files);
            // Clearing the value enables the user to select the same file again if they want to
            this.value = "";
        };
        oInput.onmouseover = function() {
            _self.oUpload.$setButtonState("mouseEnter");
        };
        oInput.onmouseout  = function () {
            _self.oUpload.$setButtonState("mouseLeave");
        };
        oInput.onmousedown = function() {
            _self.oUpload.$setButtonState("buttonDown");
        };
    };

    this.refresh = function() {
        var oBtn = this.oUpload.$button.$ext,
            pos  = apf.getAbsolutePosition(oBtn, oCont.offsetParent);

        oCont.style.left   = pos[0] + "px",
        oCont.style.top    = pos[1] + "px",
        oCont.style.width  = oBtn.offsetWidth  + "px",
        oCont.style.height = oBtn.offsetHeight + "px";
    };

    this.upload = function(file) {
        var nativeFile,
            xhr           = new XMLHttpRequest(),
            upload        = xhr.upload,
            multipartSize = 0,
            _self         = this;

        // Sends the binary blob to server and multipart encodes it if needed this code will
        // only be executed on Gecko since it's currently the only browser that supports direct file access
        function sendBinaryBlob(blob) {
            var boundary      = "----apfbound".appendRandomNumber(5),
                dashdash      = "--",
                crlf          = "\r\n",
                multipartBlob = "";

            // Build multipart request
            if (_self.oUpload.multipart) {
                xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
                // Build RFC2388 blob
                multipartBlob += dashdash + boundary + crlf +
                    'Content-Disposition: form-data; name="' + _self.oUpload.filedataname
                        + '"; filename="' + file.name + '"' + crlf +
                    'Content-Type: application/octet-stream' + crlf + crlf +
                    blob + crlf +
                    dashdash + boundary + dashdash + crlf;

                multipartSize = multipartBlob.length - blob.length;
                blob = multipartBlob;
            }
            // Send blob or multipart blob depending on config
            try {
                xhr.sendAsBinary(blob);
            }
            catch (ex) {
                _self.oUpload.dispatchEvent("error", {
                    code    : apf.upload.ERROR_CODES.HTTP_ERROR,
                    message : ex.message,
                    file    : file
                });
            }
        }

        // File upload finished
        if (file.status & apf.upload.DONE || file.status & apf.upload.FAILED
          || this.oUpload.state & apf.upload.STOPPED) {
            return;
        }

        // yay, upload progress support
        if (upload) {
            upload.onprogress = function(e) {
                file.loaded = e.loaded - multipartSize;
                _self.oUpload.$progress(file);
            };
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;
            var httpStatus;
            // Gecko workaround
            try {
                httpStatus = xhr.status;
            }
            catch (ex) {
                httpStatus = 0;
            }
            var bError = (httpStatus >= 400 || httpStatus == 0);

            file.status = bError ? apf.upload.FAILED : apf.upload.DONE;
            file.loaded = bError ? 0 : file.size;
            _self.oUpload.$progress(file);
            _self.oUpload.$fileDone(file, {
                response: xhr.responseText,
                status  : httpStatus
            });

            // Is error status
            if (bError) {
                apf.console.error("File upload failed " + httpStatus + " with message " + xhr.responseText);

                _self.oUpload.dispatchEvent("error", {
                    code    : apf.upload.ERROR_CODES.HTTP_ERROR,
                    message : "HTTP Error: " + xhr.responseText,
                    file    : file,
                    status  : httpStatus
                });
            }
            else if (apf.isGecko) {
                // workaround for gecko bug that deletes input after a successful upload... or is it a feature?
                _self.draw();
                $setTimeout(function() {_self.refresh();});
            }
        };

        nativeFile = html5files[file.id];

        xhr.open("post", this.oUpload.$buildUrl(this.oUpload.target,
            {name : file.target_name || file.name}), true);
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.setRequestHeader("X-File-Name", nativeFile.fileName);
        xhr.setRequestHeader("X-File-Size", nativeFile.fileSize);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        //@todo set custom headers

        if (xhr.sendAsBinary)
            sendBinaryBlob(nativeFile.getAsBinary());
        else
            xhr.send(nativeFile);
    };
}).call(apf.upload.html5.prototype = new apf.Class());
// #endif
