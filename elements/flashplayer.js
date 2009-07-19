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
// #ifdef __JFLASHPLAYER || __INC_ALL
// #define __JBASESIMPLE 1

/**
 * Element displaying the contents of a .swf (adobe flash) file.
 *
 * @constructor
 * @define flashplayer
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits apf.BaseSimple
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the flash source text based on data loaded into this component.
 * <code>
 *  <j:flashplayer>
 *      <j:bindings>
 *          <j:value select="@src" />
 *      </j:bindings>
 *  </j:flashplayer>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <j:flashplayer ref="@src" />
 * </code>
 */
apf.flashplayer = apf.component(apf.NODE_VISIBLE, function(){
    // #ifdef __WITH_EDITMODE
    //this.editableParts = {"main" : [["image","@src"]]};
    //#endif
    
    /**** Public methods ****/
    
    /**
     * @ref global#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**** Properties and attributes ****/
    
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        this.setSource(value);
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        //this.oInt = this.oExt = this.$getExternal();
        //this.oExt.onclick = function(){this.host.dispatchEvent("click");}
        
        var src = this.$aml.getAttribute("src") || "";
        document.body.insertAdjacentHTML("beforeend", 
            '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" \
              codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" \
              width="1" \
              height="1" \
              align="middle">\
                <param name="allowScriptAccess" value="sameDomain" />\
                <param name="allowFullScreen" value="false" />\
                <param name="movie" value="' + src + '" />\
                <param name="play" value="false" />\
                <param name="menu" value="false" />\
                <param name="quality" value="high" />\
                <param name="wmode" value="transparent" />\
                <param name="bgcolor" value="#ffffff" />\
                <embed src="' + src + '" play="false" menu="false" \
                  quality="high" wmode="transparent" bgcolor="#ffffff" width="1" \
                  height="1" align="middle" allowScriptAccess="sameDomain" \
                  allowFullScreen="false" type="application/x-shockwave-flash" \
                  pluginspage="http://www.macromedia.com/go/getflashplayer" />\
            </object>')
        this.oExt = document.body.lastChild;
        pHtmlNode.appendChild(this.oExt);
    };
    
    this.$loadAml = function(x){
        apf.AmlParser.parseChildren(x, null, this);
    };
}).implement(
    apf.BaseSimple
);

// #endif
