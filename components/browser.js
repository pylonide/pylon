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
 * Component displaying the rendered contents of an URL.
 *
 * @classDescription		This class creates a new browser
 * @return {Browser} Returns a new browser
 * @type {Browser}
 * @constructor
 * @addnode components:browser
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.browser = function(pHtmlNode){
    jpf.register(this, "browser", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.JmlNode
     * @inherits jpf.Validation
     * @inherits jpf.XForms
     * @inherits jpf.DataBinding
     */
    this.inherit(jpf.JmlNode);
    //Options
    //this.__focussable = true; // This object can get the focus
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation);
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms);
    //#endif
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding);
    
    //DATABINDING
    this.mainBind = "source";
    
    // #endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.loadURL = function(src){
        try {
            this.oInt.src = src;
        } catch(e) {
            this.oInt.src = "about:blank";
        }
    }
    
    this.getURL = function(){
        return this.oInt.src;
    }
    
    this.back = function(){
        this.oInt.contentWindow.history.back();
    }
    
    this.forward = function(){
        this.oInt.contentWindow.history.forward();
    }
    
    this.reload = function(){
        this.oInt.src = this.oInt.src;	
    }
    
    this.print = function(){
        this.oInt.contentWindow.print();
    }
    
    this.runCode = function(str, no_error){
        if (no_error)
            try {
                this.oInt.contentWindow.eval(str);
            } catch(e) {}
        else
            this.oInt.contentWindow.eval(str);
    }
    
    this.__supportedProperties.push("value", "src");
    this.__propHandlers["src"]   = 
    this.__propHandlers["value"] = function(value, force){
        this.loadURL(value);
    }
    
    this.draw = function(parentNode){
        if(!parentNode) parentNode = this.pHtmlNode;
        
        //Build Main Skin 
        if (jpf.cannotSizeIframe){
            this.oExt = parentNode.appendChild(document.createElement("DIV"))
                .appendChild(document.createElement("iframe")).parentNode;//parentNode.appendChild(document.createElement("iframe"));//
            this.oExt.style.width  = "100px";
            this.oExt.style.height = "100px";
            this.oInt = this.oExt.firstChild;
            //this.oInt = this.oExt;
            this.oInt.style.width  = "100%";
            this.oInt.style.height = "100%";
        } else {
            this.oExt = parentNode.appendChild(document.createElement("iframe"));
            this.oExt.style.width  = "100px";
            this.oExt.style.height = "100px";
            this.oInt              = this.oExt;
            //this.oExt.style.border = "2px inset white";
        }
        
        //this.oInt = this.oExt.contentWindow.document.body;
        this.oExt.host = this;
        //this.oInt.host = this;
    }
    
    this.__loadJML = function(x){};
}
// #endif
