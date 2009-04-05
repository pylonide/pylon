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

// #ifdef __JIMG || __INC_ALL
// #define __JBASESIMPLE 1

/**
 * Element displaying a picture. This element can read databound resources.
 * Example:
 * This example shows a list with pictures. When one is selected its displayed
 * in the img element.
 * <code>
 *  <j:model id="mdlPictures">
 *      <pictures>
 *          <picture title="Landscape" src="http://example.com/landscape.jpg" />
 *          <picture title="Animal" src="http://example.com/animal.jpg" />
 *          <picture title="River" src="http://example.com/river.jpg" />
 *      </pictures>
 *  </j:model>
 *
 *  <j:list id="lstPics" 
 *    traverse = "picture" 
 *    name     = "@title" 
 *    model    = "mdlPictures" />
 *
 *  <j:img ref="@src" model="#lstPics" />
 * </code>
 *
 * @constructor
 * @define img
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits jpf.BaseSimple
 *
 * @author      Ruben Daniels
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
 *  <j:img>
 *      <j:bindings>
 *          <j:value select="@src" />
 *      </j:bindings>
 *  </j:img>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <j:img ref="@src" />
 * </code>
 */

jpf.img = jpf.component(jpf.NODE_VISIBLE, function(){
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"main" : [["image","@src"]]};
    //#endif
    
    var _self = this;
    
    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(value){
        return this.value;
    };
    
    this.$supportedProperties.push("value");
    /**
     * @attribute {String} value the url location of the image displayed.
     */
    this.$propHandlers["value"] = function(value){
        if (this.oImage.nodeType == 1)
            this.oImage.style.backgroundImage = "url(" + value + ")";
        else
            this.oImage.nodeValue = value;
        
        //@todo resize should become a generic thing
        if (this.oImage.nodeType == 2 && !this.$resize.done) {
            this.oImg = this.oInt.getElementsByTagName("img")[0];
            
            jpf.layout.setRules(this.pHtmlNode, this.uniqueId + "_image",
                "jpf.all[" + this.uniqueId + "].$resize()");
            jpf.layout.activateRules(this.pHtmlNode);
            
            this.oImg.onload = function(){
                jpf.layout.forceResize(_self.pHtmlNode);
            }
            
            this.$resize.done = true;
        }
        
        if (this.oImg)
            this.oImg.style.display = value ? "block" : "none";
    };
    
    this.$clear = function(){
        if (this.oImg)
            this.oImg.style.display = "none";
    }
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oInt = this.oExt = this.$getExternal();
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("click", {htmlEvent: e || event});
        };
        this.oImage = this.$getLayoutNode("main", "image", this.oExt);
    };
    
    this.$resize = function(){
        var diff = jpf.getDiff(this.oExt);
        var wratio = 1, hratio = 1;
        
        this.oImg.style.width = "";
        this.oImg.style.height = "";
        
        if (this.oImg.offsetWidth > this.oExt.offsetWidth)
            wratio = this.oImg.offsetWidth / (this.oExt.offsetWidth - diff[0]);
        if (this.oImg.offsetHeight > this.oExt.offsetHeight)
            hratio = this.oImg.offsetHeight / (this.oExt.offsetHeight - diff[1]);

        if (wratio > hratio && wratio > 1)
            this.oImg.style.width = "100%";
        else if (hratio > wratio && hratio > 1)
            this.oImg.style.height = "100%";
        
        this.oImg.style.top = ((this.oExt.offsetHeight - jpf.getHeightDiff(this.oExt) 
            - this.oImg.offsetHeight) / 2) + "px";
    }
    
    this.$loadJml = function(x){
        if(x.getAttribute("src"))
            this.setProperty("value", x.getAttribute("src"));
        
        /* #ifdef __WITH_EDITMODE
        if(this.editable)
        #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
            this.$makeEditable("main", this.oExt, this.$jml);
        // #endif
        
        jpf.JmlParser.parseChildren(x, null, this);
    };
}).implement(
    jpf.BaseSimple
);

// #endif
