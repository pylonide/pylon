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

// #ifdef __JBROWSER || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Element displaying the rendered contents of an URL.
 *
 * @constructor
 * @addnode elements:browser
 * @define browser
 *
 * @inherits apf.AmlElement
 * @inherits apf.Validation
 * @inherits apf.XForms
 * @inherits apf.DataBinding
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the url based on data loaded into this component.
 * <code>
 *  <a:browser>
 *      <a:bindings>
 *          <a:value select="@url" />
 *      </a:bindings>
 *  </a:browser>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:colorpicker ref="@url" />
 * </code>
 */
apf.browser = apf.component(apf.NODE_VISIBLE, function(){
    /**
     * Retrieves the current url that is displayed.
     */
    this.getURL = function(){
        return this.oInt.src;
    };

    /**
     * Browses to the previous page
     */
    this.back = function(){
        this.oInt.contentWindow.history.back();
    };

    /**
     * Browses to the next page
     */
    this.forward = function(){
        this.oInt.contentWindow.history.forward();
    };

    /**
     * Reload the current page
     */
    this.reload = function(){
        this.oInt.src = this.oInt.src;
    };

    /**
     * Print the currently displayed page
     */
    this.print = function(){
        this.oInt.contentWindow.print();
    };

    /**
     * Execute a string of javascript on the page. This is subject to browser
     * security and will most likely only work when the browsed page is loaded
     * from the same domain.
     * @param {String}  str     javascript string to be executed.
     * @param {Boolean} noError whether the execution can throw an exception. Defaults to false.
     */
    this.runCode = function(str, noError){
        if (noError)
            try {
                this.oInt.contentWindow.eval(str);
            } catch(e) {}
        else
            this.oInt.contentWindow.eval(str);
    };

    /**
     * @attribute {String} src   the url to be displayed in this element
     */
    this.$supportedProperties.push("value", "src");
    this.$propHandlers["src"]   =
    this.$propHandlers["value"] = function(value, force){
        try {
            this.oInt.src = value || "about:blank";
        }
        catch(e) {
            this.oInt.src = "about:blank";
        }
    };

    this.getValue = function() {
        return this.value || this.src;
    };

    this.$draw = function(parentNode){
        if (!parentNode)
            parentNode = this.pHtmlNode;

        //Build Main Skin
        if (apf.cannotSizeIframe) {
            this.oExt = parentNode.appendChild(document.createElement("DIV"))
                .appendChild(document.createElement("<iframe frameborder='0'></iframe>")).parentNode;//parentNode.appendChild(document.createElement("iframe"));//
            this.oExt.style.width  = "100px";
            this.oExt.style.height = "100px";
            this.oInt = this.oExt.firstChild;
            //this.oInt = this.oExt;
            this.oInt.style.width  = "100%";
            this.oInt.style.height = "100%";
            this.oInt.frameBorder = 0;
        }
        else {
            this.oExt = parentNode.appendChild(document.createElement("iframe"));
            this.oExt.style.width  = "100px";
            this.oExt.style.height = "100px";
            this.oInt              = this.oExt;
            //this.oExt.style.border = "2px inset white";
        }

        //this.oInt = this.oExt.contentWindow.document.body;
        this.oExt.host = this;
        //this.oInt.host = this;
    };

    this.$loadAml = function(x){};
}).implement(
    // #ifdef __WITH_VALIDATION || __WITH_XFORMS
    apf.Validation,
    // #endif
    // #ifdef __WITH_XFORMS
    apf.XForms,
    // #endif
    // #ifdef __WITH_DATABINDING
    apf.DataBinding
    // #endif
);
// #endif
