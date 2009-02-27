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
// #ifdef __JFILEUPLOADBOX || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element allowing the user to upload a file to a server. When the file is
 * being uploaded this element shows a virtual progressbar. The element
 * can also provides a visual representation of the uploaded file depending on
 * the skin.
 * Example:
 * This example shows an upload element that pushes an image to the server. The
 * asp script returns an xml string which is added to the list of images on a
 * successfull upload.
 * <code>
 *  <j:list id="lstImages" smartbinding="..." model="..." />
 *
 *  <j:upload id="flLogoUpload"
 *    target    = "../api/UploadPicture.asp"
 *    ontimeout = "alert('It seems the server went away')"
 *    oncancel  = "alert('Could not upload logo')"
 *    onreceive = "lstImages.add(arguments[0])" />
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
 * @inherits jpf.DataBinding
 * @inherits jpf.Presentation
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @todo get server side information to update the progressbar.
 */

jpf.upload = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable = false;
    var _self = this;

    /**** Properties and attributes ****/

    this.timeout = 100000;

    /**
     * @attribute {String}  value      the path of the file to uploaded, or the online path after upload.
     * @attribute {Number}  !progress  the position of the progressbar indicating the position in the upload process.
     * @attribute {Boolean} !uploading whether this upload element is uploading.
     * Example:
     * When the skin doesn't have a progressbar you can use property binding to
     * update a seperate or central progressbar.
     * <code>
     *  <j:upload id="upExample" />
     *  <j:progressbar value="{upExample.progress}" />
     * </code>
     */
    this.$supportedProperties.push("value", "target", "progress", "uploading");

    this.$propHandlers["value"] = function(value){
        if (!this.value)
            this.old_value = value;
        this.value = value;
        
        /*
        if (this.oLabel.nodeType == 1)
            this.oLabel.innerHTML = value;
        else
            this.oLabel.nodeValue = value;
        */
    };

    this.$propHandlers["target"] = function(value){
        if (this.form)
            this.form.setAttribute("action", value);
    }

    /**** Public methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the icon of the button
     * @param {String} url the location of the image to be used as an icon
     */
    this.setIcon = function(url){
        this.setProperty("icon", url);
    };

    /**
     * Sets the caption of the button
     * @param {String} value the text displayed on the button
     */
    this.setCaption = function(value){
        this.setProperty("caption", value);
    };

    //#endif

    /**
     * @ref global#getValue
     * @todo set these global descriptions
     */
    this.getValue = function(){
        return this.value;
    };

    /**
     * @ref global#setValue
     * @todo set these global descriptions
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };

    /**
     * Opens the browse window which allows the user to choose a file to upload.
     */
    this.browse = function(){
        if (this.disabled)
            return;

        this.inpFile.click();
        //this.$startUpload();
        
        if (this.inpFile.value != this.value) {
            this.setProperty("value", this.inpFile.value);
            this.dispatchEvent("afterbrowse", {value: this.value});
        }
    };

    this.upload = function(){
        if (this.value != this.inpFile.value || !this.inpFile.value)
            return;

        this.old_value = this.value;
        this.value = this.inpFile.value;
        this.setValue(this.value);

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
        this.target = target;
        this.$initForm();
    };

    /**** Private state handling methods ****/

    this.$updateProgress = function(){
        //@todo use getDiff here
        /*this.setProperty("progress",
            this.oSlider.offsetWidth / this.oSlider.parentNode.offsetWith);*/
    };

    this.$upload = function(){
        this.$uploading = true;

        //this.$disableEvents();
        //this.oCaption.nodeValue = "Uploading...";
        this.setProperty("uploading", true);

        //@todo ass possibility for real progress indication
        this.timer = setInterval('jpf.lookup(' + this.uniqueId + ').$updateProgress()', 800);
        this.timeout_timer = setTimeout('jpf.lookup(' + this.uniqueId + ').$timeout()', this.timeout);
        this.form.submit();
    };

    /**
     * @event receive Fires when the upload succeeded
     */
    this.$done = function(data){
        window.clearInterval(this.timer);
        window.clearInterval(this.timeout_timer);
        window.setTimeout('jpf.lookup(' + this.uniqueId + ').$clearProgress()', 300);

        //if (value)
        //    this.setValue(value);
        this.old_value = null;

        //if(caption)
        //this.setCaption(this.lastCaption);

        this.data = data;

        this.dispatchEvent("receive", {
            data: data
        });

        this.$initForm();
        this.$uploading = false;
    };

    /**
     * @event receive Fires when the upload was cancelled or failed.
     */
    this.$cancel = function(value, caption){
        window.clearInterval(this.timer);
        window.clearInterval(this.timeout_timer);
        this.$clearProgress();

        //this.setCaption(this.lastCaption);
        if (this.old_value)
            this.setValue(this.old_value);
        this.old_value = null;

        this.dispatchEvent("cancel", {
            returnValue: value
        });

        this.$initForm();
        this.$uploading = false;
    };

    /**
     * @event timeout Fires when the upload timed out.
     */
    this.$timeout = function(){
        clearInterval(this.timer);
        clearInterval(this.timeout_timer);

        /*this.oCaption.nodeValue = this.$jml.firstChild
            ? this.$jml.firstChild.nodeValue
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
        if (jpf.isIE) {
            this.oFrame.contentWindow.document.write("<body></body>");
            this.form = jpf.xmldb.htmlImport(this.$getLayoutNode("form"),
                this.oFrame.contentWindow.document.body);
        }

        //this.form = this.$getLayoutNode("main", "form", this.oExt);
        this.form.setAttribute("action", this.target);
        this.form.setAttribute("target", "upload" + this.uniqueId);
        this.$getLayoutNode("form", "inp_uid", this.form)
            .setAttribute("value", this.uniqueId);
        this.inpFile = this.$getLayoutNode("form", "inp_file", this.form);

        var jmlNode = this;
        this.inpFile.onchange = function(){
            //jmlNode.$startUpload();
        }

        if (jpf.debug == 2) {
            this.oFrame.style.visibility = "visible";
            this.oFrame.style.width      = "100px";
            this.oFrame.style.height     = "100px";
        }
    };

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal("main", null, function(oExt){
            oExt.appendChild(oExt.ownerDocument.createElement("iframe"))
                .setAttribute("name", "upload" + this.uniqueId);
        });

        if (!jpf.isIE)
            this.form = jpf.xmldb.htmlImport(
                this.$getLayoutNode("form"), this.oExt);

        this.oFrame = this.oExt.getElementsByTagName("iframe")[0];
        jpf.AbstractEvent.addListener(this.oFrame, "load", function(){
            if (!_self.uploading)
                return;

            var data = "";
            try{
                data = jpf.html_entity_decode(_self.oFrame.contentWindow.document.body.innerHTML.replace(/<PRE>|<\/PRE>/g, ""));
            }
            catch(e){}

            var hasFailed = _self.dispatchEvent("beforereceive", {
                data  : data,
                frame : _self.oFrame
            } === false);

            if (hasFailed)
                _self.$cancel();
            else
                _self.$done(data);
        });

        jpf.AbstractEvent.addListener(this.oFrame, "error", function(){
            if (!_self.uploading)
                return;

            _self.$cancel();
        });
    };

    this.$loadJml = function(x){
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.$getLayoutNode("main", "background", this.oExt)
                .style.backgroundImage = "url(" + this.mediaPath
                + x.getAttribute("bgswitch") + ")";
            this.$getLayoutNode("main", "background", this.oExt)
                .style.backgroundRepeat = "no-repeat";
        }

        this.$initForm();
    };

    this.$destroy = function(){
        this.oFrame.onload = null;
    };
}).implement(
    //#ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    jpf.Presentation
);
// #endif
