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

// #ifdef __JPICTURE || __INC_ALL
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
 */

jpf.img = jpf.component(jpf.NODE_VISIBLE, function(){
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"main" : [["image","@src"]]};
    //#endif
    
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
        var imgNode = this.$getLayoutNode("main", "image", this.oExt);
        if (imgNode.nodeType == 1)
            imgNode.style.backgroundImage = "url("+ value+")";
        else
            imgNode.nodeValue = value;
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oInt = this.oExt = this.$getExternal();
        this.oExt.onclick = function(e){
            this.host.dispatchEvent("click", {htmlEvent: e || event});
        };
    };
    
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