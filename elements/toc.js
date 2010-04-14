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

// #ifdef __AMLTOC || __INC_ALL

/**
 * Element acting as the navigational instrument for any
 * element based on BaseTab. This element displays buttons
 * which can be used to navigate the different pages of for instance
 * a submitform or pages element. This element is page validation
 * aware and can display current page progress when connected to
 * a submitform.
 *
 * @constructor
 * @define toc
 * @addnode elements
 *
 * @inherits apf.Presentation
 * @todo test if this element still works with the refactored basetab
 *    
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.toc = function(struct, tagName){
    this.$init(tagName || "toc", apf.NODE_VISIBLE, struct);
};

(function(){
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("represent");

    /**
     * @attribute {String} represent the id of the element to display 
     * navigation for.
     */
    this.$propHandlers["represent"] = function(value){
        var _self = this;
        $setTimeout(function(){
            var amlNode = _self.$represent = self[value];

            amlNode.addEventListener("afterswitch", function(e){
                _self.$setActivePage(e.nextId);
            });
            
            if (amlNode.$drawn) {
                _self.$createReflection();
            }
            else {
                amlNode.$amlLoaders.push(function(){
                    toc.$createReflection();
                });
            }
        });
    }
    
    /**** Public methods ****/
    
    /**
     * Navigates to a page of the represented element.
     * @param {Number} nr the child number of the page to activate.
     */
    this.gotoPage = function(nr, userAction){
        if (userAction && this.disabled) return false;

        if (this.$represent.isValid && !this.$represent.testing) {
            var i, test,
                pages        = this.$represent.getPages(),
                activepagenr = this.$represent.activepagenr;
            for (i = activepagenr; i < nr; i++) {
                pages[i].$ext.style.position = "absolute"; //hack
                pages[i].$ext.style.top      = "-10000px"; //hack
                pages[i].$ext.style.display  = "block"; //hack
                test = !this.$represent.isValid || this.$represent
                    .isValid(i < activepagenr, i < activepagenr, pages[i]);
                //false, activepagenr == i, pages[i], true);
                pages[i].$ext.style.display  = ""; //hack
                pages[i].$ext.style.position = ""; //hack
                pages[i].$ext.style.top      = ""; //hack
                pages[i].$ext.style.left     = ""; //hack
                pages[i].$ext.style.width    = "1px";
                pages[i].$ext.style.width    = "";
    
                if (!test)
                    return this.$represent.set(i);
            }
        }
        
        if (this.$represent.showLoader)
            this.$represent.showLoader(true, nr); 

        var _self = this;
        $setTimeout(function(){
            _self.$represent.set(nr);
        }, 1);
        //setTimeout("apf.lookup(" + this.$represent.$uniqueId + ").set(" + nr + ");", 1);
    };
    
    /**** Private Methods ****/
    
    this.$setActivePage = function(active){
        //if (this.disabled) return false;

        //Find previous known index and make sure it has known indexes after
        if (!this.pagelookup[active]) {
            var page, last, is_between;
            for (page in this.pagelookup) {
                if (page < active)
                    last = page;
                if (page > active)
                    is_between = true;
            }
            if (!last || !is_between) return; //exit if there are no known indices
            active = last;
        }

        for (var isPast = true, i = 0; i < this.pages.length; i++) {
            this.$setStyleClass(this.pages[i], "", ["future", "past", "hover", "present"]);
            
            if (this.pagelookup[active] == this.pages[i]) {
                this.$setStyleClass(this.pages[i], "present", []);
                isPast = false;
            }
            else if (isPast) {
                    this.$setStyleClass(this.pages[i], "past", []);
            }
            else {
                this.$setStyleClass(this.pages[i], "future", []);
            }
            
            if (i == this.pages.length - 1)
                this.$setStyleClass(this.pages[i], "last");
        }
    };
    
    this.$createReflection = function(){
        var i, oCaption, oPage,
            l     = {},
            pages = this.$represent.getPages(),
            l2    = pages.length,
            p     = [];
        
        for (i = 0; i < l2; i++) {
            this.$getNewContext("page");
            oCaption = this.$getLayoutNode("page", "caption");
            oPage    = this.$getLayoutNode("page");
            this.$setStyleClass(oPage, "page" + i);
            
            oPage.setAttribute("onmouseover", 'apf.lookup(' + this.$uniqueId 
                + ').$setStyleClass(this, "hover", null, true);');
            oPage.setAttribute("onmouseout", 'apf.lookup(' + this.$uniqueId 
                + ').$setStyleClass(this, "", ["hover"], true);');
            
            if(!pages[i].getAttribute("caption")){
                // #ifdef __DEBUG
                apf.console.warn("Page element without caption found.");
                // #endif
                //continue;
            }
            else {
                apf.setNodeValue(oCaption, 
                    pages[i].getAttribute("caption") || "");
            }

            oPage.setAttribute("onmousedown", "setTimeout(function(){\
                    apf.lookup(" + this.$uniqueId + ").gotoPage(" + i + ", true);\
                });");
            p.push(apf.insertHtmlNode(oPage, this.$int));
            l[i] = p[p.length - 1];
        }
        
        //xmldb.htmlImport(p, this.$int);
        this.pages      = p;
        this.pagelookup = l;
        
        this.$setActivePage(0);
        
        //#ifdef __SUPPORT_GECKO
        if (apf.isGecko) {
            var tocNode = this;
            $setTimeout(function(){
                tocNode.$ext.style.height = tocNode.$ext.offsetHeight + 1 + "px";
                tocNode.$ext.style.height = tocNode.$ext.offsetHeight - 1 + "px";
            }, 10);
        }
        //#endif
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext     = this.$getExternal(); 
        this.oCaption = this.$getLayoutNode("main", "caption", this.$ext);
        this.$int     = this.$getLayoutNode("main", "container", this.$ext);
    };

    // #ifdef __DEBUG
    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        if (!this.represent) {
            throw new Error(apf.formatErrorString(1013, this, 
                "Find representation", 
                "Could not find representation for the Toc: '" 
                + this.name + "'", this));
        }
    });
    // #endif
}).call(apf.toc.prototype = new apf.Presentation());

apf.aml.setElement("toc", apf.toc);
// #endif
