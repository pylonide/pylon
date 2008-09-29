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

// #ifdef __JCONTAINER || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component containing other components that are hidden by default.
 *
 * @classDescription		This class creates a new container
 * @return {Container} Returns a new container
 * @type {Container}
 * @constructor
 * @allowchild {components}, {anyjml}
 * @addnode components:container
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.container = function(pHtmlNode){
    jpf.register(this, "container", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    /** 
     * @inherits jpf.JmlNode
     * @inherits jpf.Presentation
     */
    this.inherit(jpf.Presentation, jpf.JmlNode);
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    // #endif
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    // PUBLIC METHODS
    this.setActive = function(){
        this.setProperty("active", true);
    }
    
    this.setInactive = function(){
        this.setProperty("active", false);
    }
    
    this.$supportedProperties.push("active");
    this.$propHandlers["active"] = function(value){
        if (jpf.isTrue(value)) {
            // #ifdef __WITH_DELAYEDRENDER
            this.render();
            // #endif 
            
            this.$setStyleClass(this.oExt, this.baseCSSname + "Active",
                [this.baseCSSname + "Inactive"]);
            this.dispatchEvent("activate");
        }
        else {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Inactive",
                [this.baseCSSname + "Active"]);
            this.dispatchEvent("inactivate");
        }
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        
        //#ifndef __WITH_EDITMODE
        this.setInactive();
        //#endif
    }
    
    this.$loadJml = function(x){
        //Set Form
        var y = x;
        do {
            y = y.parentNode;
        }
        while (!y.tagName.match(/submitform|xforms$/) && y.parentNode
            && y.parentNode.nodeType != 9);
        
        if (y.tagName.match(/submitform|xforms$/)) {
            //if(!y.tagName.match(/submitform|xforms$/)) throw new Error(jpf.formatErrorString(1004, this, "Loading JML", "Could not find Form element whilst trying to bind to it's Data."));
            //#ifdef __DEBUG
            if (!y.getAttribute("id")) 
                throw new Error(jpf.formatErrorString(1005, this, "Loading JML", "Found Form element but the id attribute is empty or missing."));
            //#endif
            
            this.form           = eval(y.getAttribute("id"));
            this.condition      = x.getAttribute("condition") 
                || x.getAttribute("jscondition");
            this.onlyWhenActive = x.getAttribute("activeonly") == "show";
        }
        
        //parse children
        var oInt  = this.$getLayoutNode("main", "container", this.oExt) || this.oExt;
        this.oInt = this.oInt
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(this.jml, oInt, this, true);
        
        if (this.condition) 
            this.form.registerCondition(this, this.condition,
                x.getAttribute("jscondition") ? true : false);
    }
}

// #endif