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

// #ifdef __AMLIMG || __INC_ALL

/**
 * Element displaying a picture. This element can read databound resources.
 * Example:
 * This example shows a list with pictures. When one is selected its displayed
 * in the img element.
 * <code>
 *  <a:model id="mdlPictures"> 
 *      <pictures> 
 *          <picture title="Landscape" src="img1.jpg" />
 *          <picture title="Animal" src="img2.jpg" />
 *          <picture title="River" src="img3.jpg" />
 *      </pictures> 
 *  </a:model>
 *  <a:list 
 *    id     = "lstPics" 
 *    skin   = "thumbnail" 
 *    height = "200" 
 *    width  = "400" 
 *    model  = "mdlPictures">
 *      <a:each match = "[picture]" >
 *          <a:name match="[@title]" />
 *          <a:image match="[@src]">path/to/image/[@src]</a:image>
 *      </a:each>
 *  </a:list>
 *  <a:img 
 *    model  = "{lstPics.selected}" 
 *    value  = "path/to/image/[@src]" 
 *    width  = "200" 
 *    height = "200" />
 * </code>
 *
 * @constructor
 * @define img
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits apf.BaseSimple
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @event click Fires when a user presses a mouse button while over this element.
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the image source based on data loaded into this component.
 * <code>
 *  <a:model id="mdlPictures"> 
 *      <data src="path/to/image.jpg" /> 
 *  </a:model>
 *  <a:img 
 *    model  = "mdlPictures" 
 *    value  = "[@src]" 
 *    width  = "300" 
 *    height = "300" />
 * </code>
 */
apf.img = function(struct, tagName){
    this.$init(tagName || "img", apf.NODE_VISIBLE, struct);
};

apf.preview = function(struct, tagName){
    this.$init(tagName || "preview", apf.NODE_VISIBLE, struct);
};

(function(){
    //#ifdef __WITH_CONVENIENCE_API
    
    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };
    
    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(value){
        return this.value;
    };
    
    //#endif
    
    this.$supportedProperties.push("value", "src");
    /**
     * @attribute {String} value the url location of the image displayed.
     */
    this.$propHandlers["src"] = 
    this.$propHandlers["value"] = function(value){
        if (this.oImage.nodeType == 1)
            this.oImage.style.backgroundImage = "url(" + value + ")";
        else
            this.oImage.nodeValue = value;
        
        //@todo resize should become a generic thing
        if (this.oImage.nodeType == 2 && !this.$resize.done) {
            if (this.oImg) {
                //#ifdef __WITH_LAYOUT
                //@todo add this to $destroy
                var pNode = apf.hasSingleRszEvent ? this.$pHtmlNode : this.$ext;
                apf.layout.setRules(pNode, this.$uniqueId + "_image",
                    "var o = apf.all[" + this.$uniqueId + "];\
                     if (o) o.$resize()");
                apf.layout.queue(pNode);
                
                this.oImg.onload = function(){
                    apf.layout.forceResize(pNode);
                }
                //#endif
            }
            
            this.$resize.done = true;
        }

        if (this.oImg) {
            this.oImg.style.display = value ? "block" : "none";
            
            //RLD: disabled lines below for the preview element. the image is probably not loaded yet.
            //if (value)
                //this.$resize();
        }
    };

    this.refetch = function(){
	this.$propHandlers["value"].call(this, "")
	this.$propHandlers["value"].call(this, this.value || this.src)
    }
    
    this.addEventListener("$clear", function(){
        this.value = "";
        
        if (this.oImg)
            this.oImg.style.display = "none";
    });
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$ext.onclick = function(e){
            this.host.dispatchEvent("click", {htmlEvent: e || event});
        };
        this.oImage = this.$getLayoutNode("main", "image", this.$ext);
        if (this.oImage.nodeType == 1)
            this.oImg   = this.oImage.getElementsByTagName("img")[0];
        if (this.localName == "preview") {
            var _self = this;
            this.$ext.onclick = function() {
                if (!_self.sPreview) return;
                _self.$ext.innerHTML = _self.sPreview;
                this.onclick = null;
            };
        }
        
        var _self = this;
        apf.addListener(this.$ext, "mouseover", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseover", {htmlEvent: e});
        });
        
        apf.addListener(this.$ext, "mouseout", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseout", {htmlEvent: e});
        });
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        var node,
            val   = "",
            i     = this.childNodes.length;

        for (; i >= 0; --i) {
            if ((node = this.childNodes[i]) && node.nodeName
              && node.nodeName == "#cdata-section") {
                val = node.nodeValue;
                node.removeNode();
            }
        }

        this.sPreview = val;
    });
    
    this.$resize = function(){
        var diff = apf.getDiff(this.$ext);
        var wratio = 1, hratio = 1;

        this.oImg.style.width = "";
        this.oImg.style.height = "";
        
        if (this.oImg.offsetWidth > this.$ext.offsetWidth)
            wratio = this.oImg.offsetWidth / (this.$ext.offsetWidth - diff[0]);
        if (this.oImg.offsetHeight > this.$ext.offsetHeight)
            hratio = this.oImg.offsetHeight / (this.$ext.offsetHeight - diff[1]);

        if (wratio > hratio && wratio > 1)
            this.oImg.style.width = "100%";
        else if (hratio > wratio && hratio > 1)
            this.oImg.style.height = "100%";
        
        this.oImg.style.top = ((this.$ext.offsetHeight - apf.getHeightDiff(this.$ext) 
            - this.oImg.offsetHeight) / 2) + "px";
    }
}).call(apf.img.prototype = new apf.BaseSimple());

apf.preview.prototype = apf.img.prototype;

apf.aml.setElement("img", apf.img);
apf.aml.setElement("preview", apf.preview);

apf.aml.setElement("name", apf.BindingRule);
apf.aml.setElement("image", apf.BindingRule);
// #endif
