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
 * Element displaying a HTML4 uploader
 *
 * @classDescription This class creates a new HTML4 uploader
 * @return {html4} Returns a new HTML4 uploader
 * @type {html4}
 * @constructor
 * @addnode elements:upload
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 */

apf.upload.html4 = function(oUpload) {
    this.oUpload = oUpload;
    this.$files  = {};
};

apf.upload.html4.isSupported = function() {
    return true;
};

(function() {
    function addSelectedFiles(element) {
        var file, id, name,
            uid   = this.oUpload.$uniqueId,
            files = [];

        name = element.value.replace(/\\/g, '/');
        name = name.substring(name.length, name.lastIndexOf('/') + 1);

        id = uid + "_html4_".appendRandomNumber(5);

        this.$files[id] = file = {id: id, name: name};

        file.input = element;
        files.push(file);

        if (files.length)
            this.oUpload.$queue(files);
    }

    this.draw = function() {
        var inputContainer, type, node,
            mimes    = [],
            uid      = this.oUpload.$uniqueId,
            filter   = this.oUpload.$filter,
            i        = 0,
            l        = filter.length,
            _self    = this;
        this.$cont = this.oUpload.$ext;

        // Convert extensions to mime types list
        for (; i < l; ++i) {
            if (type = this.oUpload.mimeTypes[filter[i]])
                mimes.push(type);
        }
        
        $setTimeout(function() {
            // If no form set, create a new one
            // Create a form and set it as inline so it doesn't mess up any layout
            _self.$form = document.createElement("form");
            _self.$form.style.display = "inline";

            // Wrap browse button in empty form
            node = _self.oUpload.$button.$ext;
            node.parentNode.insertBefore(_self.$form, node);
            _self.$form.appendChild(node);

            // Force the form into post and multipart
            _self.$form.setAttribute("method", "post");
            _self.$form.setAttribute("enctype", "multipart/form-data");

            _self.$iframe = document.createElement("iframe");
            _self.$iframe.setAttribute("src",  'javascript:""'); // javascript:"" for HTTPS issue on IE6
            _self.$iframe.setAttribute("name", uid + "_iframe");
            _self.$iframe.setAttribute("id",   uid + "_iframe");
            _self.$iframe.style.display = "none";

            // Add IFrame onload event
            apf.addListener(_self.$iframe, "load", function(e){
                e = e || window.event;
                var el,
                    n    = e.srcElement || e.target,
                    file = _self.currentfile;

                try {
                    el = n.contentWindow.document || n.contentDocument || window.frames[n.id].document;
                }
                catch (ex) {
                    // Probably a permission denied error
                    _self.dispatchEvent("error", {
                        code    : apf.upload.ERROR_CODES.SECURITY_ERROR,
                        message : "Security error.",
                        file    : file
                    });

                    return;
                }

                // Return on first load
                if (el.location.href == "about:blank" || !file)
                    return;

                // Get result
                var result = el.documentElement.innerText || el.documentElement.textContent;

                // Assume no error
                if (result != "") {
                    file.status  = apf.upload.DONE;
                    file.loaded  = 1025;
                    file.percent = 100;

                    // Remove input element
                    if (file.input)
                        file.input.removeAttribute("name");

                    _self.oUpload.$progress(file);
                    _self.oUpload.$fileDone(file, {
                        response : result
                    });

                    // Reset action and target
                    if (_self.$form.tmpAction)
                        _self.$form.setAttribute("action", _self.$form.tmpAction);
                    if (_self.$form.tmpTarget)
                        _self.$form.setAttribute("target", _self.$form.tmpTarget);
                }
            });

            // append iframe to form
            _self.$form.appendChild(_self.$iframe);

            // Change iframe name
            //if (apf.isIE)
                //window.frames[_self.$iframe.id].name = _self.$iframe.name;

            // Create container for iframe
            _self.$inputContainer = inputContainer = document.createElement("div");
            inputContainer.id = uid + "_iframe_container";

            // Set container styles
            with (inputContainer.style) {
                position   = "absolute",
                background = "transparent",
                width      = "100px",
                height     = "100px",
                overflow   = "hidden",
                zIndex     = 99999,
                opacity    = 0;
            }

            // Append to form
            _self.$form.appendChild(inputContainer);

            // Create an input element
            function createInput() {
                // Create element and set attributes
                var input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", mimes.join(","));
                input.setAttribute("size", 1);

                // set input styles
                input.style.width  = "100%",
                input.style.height = "100%",
                apf.setOpacity(input, 0);

                // add change event
                input.onchange = function(e) {
                    e = e || window.event;
                    var n = e.srcElement || e.target;
                    if (n.value) {
                        // Create next input
                        createInput();
                        n.style.display = "none";
                        addSelectedFiles.call(_self, n);
                    }
                };
                // append to container
                inputContainer.appendChild(input);
                return true;
            }

            // Create input element
            createInput();
            _self.refresh();
        });
    };

    this.refresh = function() {
        if (this.$inputContainer) {
            var oBtn = this.oUpload.$button.$ext,
                pos  = apf.getAbsolutePosition(oBtn, this.$inputContainer.offsetParent);
            
            //#ifdef __DEBUG
            if (apf.isIE && oBtn.offsetWidth > 81) {
                apf.console.warn("Button found for upload element with a width "
                               + "greater than 81 pixels. This sadly will not work: "
                               + this.oUpload.$button.serialize());
            }
            //#endif
            
            this.$inputContainer.style.left   = pos[0] + "px",
            this.$inputContainer.style.top    = pos[1] + "px",
            this.$inputContainer.style.width  = (apf.isIE ? "81px" : oBtn.offsetWidth  + "px"),
            this.$inputContainer.style.height = oBtn.offsetHeight + "px";
        }
    };

    this.upload = function(file) {
        var u = apf.upload;
        // File upload finished
        if (file.status & u.DONE || file.status & u.FAILED || this.oUpload.state & u.STOPPED)
            return;

        // No input element so set error
        if (!file.input) {
            file.status = u.ERROR;
            return;
        }

        // Set input element name attribute which allows it to be submitted
        file.input.setAttribute("name", this.oUpload.filedataname);

        // Store action
        this.$form.tmpAction = this.$form.getAttribute("action");
        this.$form.setAttribute("action", this.oUpload.$buildUrl(this.oUpload.target,
            {name : file.target_name || file.name}));

        // Store Target
        this.$form.tmpTarget = this.$form.getAttribute("target");
        this.$form.setAttribute("target", this.$iframe.name);

        // set current file
        this.currentfile = file;
        
        this.$form.appendChild(file.input);
        this.$form.submit();
    };

    this.removeFile = function(file) {
        if (file.input)
            file.input.parentNode.removeChild(file.input);
    };
}).call(apf.upload.html4.prototype = new apf.Class());
// #endif
