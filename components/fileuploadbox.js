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
 * Component allowing the user to upload a file to a server. Whilst
 * uploading this component shows a virtual progressbar. The component
 * also provides a visual representation of the uploaded file.
 *
 * @classDescription		This class creates a new fileuploadbox
 * @return {Fileuploadbox} Returns a new fileuploadbox
 * @type {Fileuploadbox}
 * @constructor
 * @alias upload
 * @addnode components:fileuploadbox, components:upload
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.upload        = 
jpf.fileuploadbox = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "fileuploadbox", jpf.NODE_VISIBLE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.$focussable = true; // This object can get the focus
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setIcon = function(url){
        jpf.skins.setIcon(this.oIcon, url, this.iconPath);
    };
    
    this.SetCaption = function(value){
        this.oCaption.nodeValue = value;
        //this.change(value, true);
    };
    
    /* ***************
     API
     ****************/
    this.getValue = function(){
        return this.value;
    };
    
    this.setValue = function(value){
        if (!this.value) 
            this.old_value = value;
        this.value = value;
        
        if (this.oInt.nodeType == 1) 
            this.oInt.innerHTML = value;
        else 
            this.oInt.nodeValue = value;
        //this.Change(value);
    };
    
    this.setCaption = function(value){
        if (!value) 
            value = "";
        //this.oInt.innerHTML = value;
        //this.SetCaption(value);
        this.lastCaption = value;
        this.oCaption.nodeValue = value;
    };
    
    this.$enable = function(){
        enable(this.oBtn);
    };
    
    this.$disable = function(){
        disable(this.oBtn);
    };
    
    this.showBrowseWindow = function(){
        if (this.disabled) 
            return;
        
        this.inpFile.click();
        //this.$startUpload();
    };
    
    this.$startUpload = function(){
        if (this.value == this.inpFile.value || !this.inpFile.value) 
            return;
        
        this.old_value = this.value;
        this.value = this.inpFile.value;
        this.setValue(this.value);
        
        this.upload();
    };
    
    this.updateProgress = function(){
        this.oSlider.style.width = this.oSlider.offsetWidth + 1;
    };
    
    this.upload = function(){
        this.uploading = true;
        
        this.disableEvents();
        this.oCaption.nodeValue       = "Uploading...";
        this.oSliderExt.style.display = "block";
        //this.oSlider.style.display = "block";
        this.oSlider.style.width      = 1;
        this.timer = setInterval('jpf.lookup(' + this.uniqueId + ').updateProgress()', 800);
        this.timeout_timer = setTimeout('jpf.lookup(' + this.uniqueId + ').doTimeout()', this.timeout);
        this.form.submit();
    };
    
    this.done = function(value, caption){
        window.clearInterval(this.timer);
        window.clearInterval(this.timeout_timer);
        this.oSlider.style.width = "100%";
        window.setTimeout('jpf.lookup(' + this.uniqueId + ').clearProgress()', 300);
        
        if (value) 
            this.setValue(value);
        this.old_value = null;
        
        //if(caption) 
        this.setCaption(this.lastCaption);
        
        this.dispatchEvent("receive", {
            returnValue: value
        });
        
        this.initForm();
        this.uploading = false;
        this.setEvents();
    };
    
    this.cancel = function(value, caption){
        window.clearInterval(this.timer);
        window.clearInterval(this.timeout_timer);
        this.clearProgress();
        
        this.setCaption(this.lastCaption);
        if (this.old_value) 
            this.setValue(this.old_value);
        this.old_value = null;
        
        this.dispatchEvent("cancel", {
            returnValue: value
        });
        
        this.initForm();
        this.uploading = false;
        this.setEvents();
    };
    
    this.doTimeout = function(){
        clearInterval(this.timer);
        
        this.setEvents();
        this.oCaption.nodeValue = this.$jml.firstChild 
            ? this.$jml.firstChild.nodeValue 
            : "";
        this.clearProgress();
        
        if (this.old_value) 
            this.setValue(this.old_value);
        this.old_value = null;
        
        this.initForm();
        this.uploading = false;
        
        this.dispatchEvent("timeout");
    };
    
    this.clearProgress = function(){
        //this.oInt.style.display = "block";
        this.oSliderExt.style.display = "none";
    };
    
    /* ***************
     DATABINDING
     ****************/
    //#ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* ***********************
     Other Inheritance
     ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    /* ***********************
     Events
     ************************/
    this.disableEvents = function(){
        this.oBtn.onclick = this.oBtn.onmouseover = this.oBtn.onmouseout = 
          this.oBtn.onmouseup = this.oBtn.onmousedown = null;
    };
    
    this.setEvents = function(){
        this.oBtn.onmousedown = function(e){
            this.host.$setStyleClass(this, this.host.baseCSSname + "down", 
                [this.host.baseCSSname + "over"]);
            if (this.host.onmousedown) 
                this.host.onmousedown();
            (e || event).cancelBubble = true;
        };
        
        this.oBtn.onmouseover = function(e){
            this.host.$setStyleClass(this, this.host.baseCSSname + "over", 
                [this.host.baseCSSname + "down"]);
            if (this.host.bgswitch) 
                this.host.$getLayoutNode("main", "background", 
                    this.host.oBtn).style.backgroundPosition = "-" 
                    + jpf.getStyle(this.host.oBtn, "width") + " 0";
            if (this.host.onmouseover) 
                this.host.onmouseover();
            (e || event).cancelBubble = true;
        };
        
        this.oBtn.onmouseout = function(e){
            this.host.$setStyleClass(this, "", [this.host.baseCSSname + "down", 
                this.host.baseCSSname + "over"]);
            if (this.host.bgswitch) 
                this.host.$getLayoutNode("main", "background", 
                    this.host.oBtn).style.backgroundPosition = "0 0";
            if (this.host.onmouseout) 
                this.host.onmouseout();
            (e || event).cancelBubble = true;
        };
        
        this.oBtn.onmouseup = function(e){
            this.host.$setStyleClass(this, this.host.baseCSSname + "over", 
                [this.host.baseCSSname + "down"]);
            if (this.host.bgswitch) 
                this.host.$getLayoutNode("main", "background", 
                    this.host.oBtn).style.backgroundPosition = "-" 
                    + jpf.getStyle(this.host.oBtn, "width") + " 0";
            if (this.host.onmouseup) 
                this.host.onmouseup();
            (e || event).cancelBubble = true;
        };
        
        this.oBtn.onclick = function(e){
            if (this.host.onclick) 
                this.host.onclick();
            (e || event).cancelBubble = true;
            
            this.host.showBrowseWindow();
        }
    };
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.setTarget = function(target){
        this.target = target;
        this.initForm();
    };
    
    this.initForm = function(){
        if (jpf.isIE) {
            this.oFrame.contentWindow.document.write("<body></body>");
            this.form = jpf.xmldb.htmlImport(this.$getLayoutNode("Form"), 
                this.oFrame.contentWindow.document.body);
        }
        
        //this.form = this.$getLayoutNode("main", "form", this.oExt);
        this.form.setAttribute("action", this.target);
        this.form.setAttribute("target", "upload" + this.uniqueId);
        this.$getLayoutNode("Form", "inp_uid", this.form)
            .setAttribute("value", this.uniqueId);
        this.inpFile = this.$getLayoutNode("Form", "inp_file", this.form);
        
        var jmlNode = this;
        this.inpFile.onchange = function(){
            jmlNode.$startUpload();
        }
        
        if (jpf.isGecko) {
            this.inpFile.onmouseover = function(e){
                if (jmlNode.oBtn.onmouseover) 
                    jmlNode.oBtn.onmouseover(e);
            }
            this.inpFile.onmouseout = function(e){
                if (jmlNode.oBtn.onmouseout) 
                    jmlNode.oBtn.onmouseout(e);
            }
        }
        
        if (jpf.debug == 2) {
            this.oFrame.style.visibility = "visible";
            this.oFrame.style.width      = "100px";
            this.oFrame.style.height     = "100px";
        }
    };
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal("Main", null, function(oExt){
            oExt.appendChild(oExt.ownerDocument.createElement("iframe"))
                .setAttribute("name", "upload" + this.uniqueId);
        });
        
        this.oInt       = this.$getLayoutNode("main", "value",     this.oExt);
        this.oBtn       = this.$getLayoutNode("main", "button",    this.oExt);
        this.oIcon      = this.$getLayoutNode("main", "icon",      this.oExt);
        this.oCaption   = this.$getLayoutNode("main", "caption",   this.oExt);
        this.oSliderExt = this.$getLayoutNode("main", "slider",    this.oExt);
        this.oSlider    = this.$getLayoutNode("main", "slidemove", this.oExt);
        
        this.oFrame = this.oExt.getElementsByTagName("iframe")[0];
        if (!jpf.isIE) 
            this.form = jpf.xmldb.htmlImport(this.$getLayoutNode("Form"), 
                this.oExt);
        
        this.oBtn.host = this;
        
        this.setEvents();
    };
    
    this.$loadJml = function(x){
        this.target = x.getAttribute("target");
        if (x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
        
        this.setCaption(x.firstChild ? x.firstChild.nodeValue : "");
        if (x.getAttribute("icon")) 
            this.setIcon(x.getAttribute("icon"));
        if (x.getAttribute("onclick")) 
            this.onclick = x.getAttribute("onclick");
        this.timeout = x.getAttribute("timeout") || 100000;
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.$getLayoutNode("main", "background", this.oExt)
                .style.backgroundImage = "url(" + this.mediaPath 
                + x.getAttribute("bgswitch") + ")";
            this.$getLayoutNode("main", "background", this.oExt)
                .style.backgroundRepeat = "no-repeat";
        }
        
        this.initForm();
    };
    
    this.$destroy = function(){
        this.oBtn.host = null;
    };
}
// #endif
