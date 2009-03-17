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

// #ifdef __JTOC || __INC_ALL
// #define __WITH_PRESENTATION 1

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
 * @inherits jpf.Presentation
 * @todo test if this element still works with the refactored basetab
 *    
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.toc = jpf.component(jpf.NODE_VISIBLE, function(){
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Page" : [["caption","@caption"]]};
    // #endif
    
    var _self = this;
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("represent");

    /**
     * @attribute {String} represent the id of the element to display 
     * navigation for.
     */
    this.$propHandlers["represent"] = function(value){
        setTimeout(function(){
            var jmlNode = _self.$represent = self[value];
            
            jmlNode.addEventListener("afterswitch", function(e){
                _self.$setActivePage(e.pageId);
            });
            
            if (jmlNode.$drawn) {
                _self.$createReflection();
            }
            else {
                jmlNode.$jmlLoaders.push(function(){
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
    this.gotoPage = function(nr){
        if (this.disabled) return false;

        if (this.$represent.isValid && !this.$represent.testing) {
            var pages      = this.$represent.getPages();
            var activepagenr = this.$represent.activepagenr;
            for (var i = activepagenr; i < nr; i++) {
                pages[i].oExt.style.position = "absolute"; //hack
                pages[i].oExt.style.top      = "-10000px"; //hack
                pages[i].oExt.style.display  = "block"; //hack
                var test = !this.$represent.isValid || this.$represent
                    .isValid(i < activepagenr, i < activepagenr, pages[i]);//false, activepagenr == i, pages[i], true);
                pages[i].oExt.style.display  = ""; //hack
                pages[i].oExt.style.position = ""; //hack
                pages[i].oExt.style.top      = ""; //hack
                pages[i].oExt.style.left     = ""; //hack
                pages[i].oExt.style.width    = "1px";
                pages[i].oExt.style.width    = "";
    
                if (!test)
                    return this.$represent.set(i);
            }
        }
        
        if (this.$represent.showLoader)
            this.$represent.showLoader(true, nr); 

        setTimeout(function(){
            _self.$represent.set(nr);
        }, 1);
        //setTimeout("jpf.lookup(" + this.$represent.uniqueId + ").set(" + nr + ");", 1);
    };
    
    /**** Private Methods ****/
    
    this.$setActivePage = function(active){
        if (this.disabled) return false;
        
        //Find previous known index and make sure it has known indexes after
        if (!this.pagelookup[active]) {
            var page, last, is_between;
            for (page in this.pagelookup) {
                if (page < active)
                    last = page;
                if (page > active)
                    is_between = true;
            }
            if (!last || !is_between) return; //exit if there are no known indexes
            active = last;
        }

        for (var isPast = true, i = 0; i < this.pages.length; i++) {
            if (this.pagelookup[active] == this.pages[i]) {
                this.$setStyleClass(this.pages[i], "present", ["future", "past"]);
                isPast = false;
            }
            else
                if (isPast)
                    this.$setStyleClass(this.pages[i], "past", ["future", "present"]);
            else
                this.$setStyleClass(this.pages[i], "future", ["past", "present"]);
            
            if (i == this.pages.length-1)
                this.$setStyleClass(this.pages[i], "last");
        }
    };
    
    this.$createReflection = function(){
        var pages = this.$represent.getPages();
        
        for (var l = {}, p = [], i = 0; i < pages.length; i++) {
            this.$getNewContext("page");
            var oCaption = this.$getLayoutNode("page", "caption");
            var oPage    = this.$getLayoutNode("page");
            this.$setStyleClass(oPage, "page" + i);
            
            oPage.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId 
                + ').$setStyleClass(this, "hover", null);');
            oPage.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId 
                + ').$setStyleClass(this, "", ["hover"]);');
            
            if(!pages[i].$jml.getAttribute("caption")){
                // #ifdef __DEBUG
                jpf.console.warn("Page element without caption found.");
                // #endif
                //continue;
            }
            else {
                jpf.xmldb.setNodeValue(oCaption, 
                    pages[i].$jml.getAttribute("caption") || "");
            }

            oPage.setAttribute("onmousedown", "setTimeout(function(){\
                    jpf.lookup(" + this.uniqueId + ").gotoPage(" + i + ");\
                });");
            p.push(jpf.xmldb.htmlImport(oPage, this.oInt));
            l[i] = p[p.length - 1];
            
            /* #ifdef __WITH_EDITMODE
            if(this.editable)
            #endif */
            // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
                this.$makeEditable("page", p[i], pages[i].$jml);
            //#endif
        }
        
        //xmldb.htmlImport(p, this.oInt);
        this.pages      = p;
        this.pagelookup = l;
        
        this.$setActivePage(0);
        
        //#ifdef __SUPPORT_GECKO
        if (jpf.isGecko) {
            var tocNode = this;
            setTimeout(function(){
                tocNode.oExt.style.height = tocNode.oExt.offsetHeight + 1 + "px";
                tocNode.oExt.style.height = tocNode.oExt.offsetHeight - 1 + "px";
            }, 10);
        }
        //#endif
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt     = this.$getExternal(); 
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
        this.oInt     = this.$getLayoutNode("main", "container", this.oExt);
    };
    
    this.$loadJml = function(x){
        // #ifdef __DEBUG
        if (!this.represent)
            throw new Error(jpf.formatErrorString(1013, this, 
                "Find representation", 
                "Could not find representation for the Toc: '" 
                + this.name + "'", x))
        // #endif
    };
}).implement(
    jpf.Presentation
);
// #endif
