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
 * Component acting as the navigational instrument for any
 * component based on BaseTab. This component displays buttons
 * which can be used to navigate the different pages of for instance
 * a Submitform or Pages component. This component is page validation
 * aware and can display current page progress when connected to
 * a Submitform.
 *
 * @classDescription		This class creates a new toc
 * @return {Toc} Returns a new toc
 * @type {Toc}
 * @constructor
 * @addnode components:toc
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.toc = function(pHtmlNode){
    jpf.register(this, "toc", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    /* ***********************
            Inheritance
    ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.JmlNode);
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Page" : [["caption","@caption"]]};
    // #endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.represent = function(oJmlNode){
        this.oJmlNode = oJmlNode;
        var toc = this;
        
        oJmlNode.addEventListener("onafterswitch", function(e){
            toc.setActivePage(e.pageId);
        });
        
        if (oJmlNode.drawed)
            this.createReflection()
        else //@todo move this to a loadjml listener
            oJmlNode.addEventListener("ondraw", function(){
                toc.createReflection();
            });
    }
    
    this.createReflection = function(){
        var pages = this.oJmlNode.getPages();
        
        for (var l = {}, p = [], i = 0; i < pages.length; i++) {
            this.__getNewContext("page");
            var oCaption = this.__getLayoutNode("page", "caption");
            var oPage    = this.__getLayoutNode("page");
            this.__setStyleClass(oPage, "page" + i);
            
            oPage.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId 
                + ').__setStyleClass(this, "hover", null);');
            oPage.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId 
                + ').__setStyleClass(this, "", ["hover"]);');
            
            if(!pages[i].jml.getAttribute("caption")){
                // #ifdef __DEBUG
                jpf.console.warn("Page element without caption found.");
                // #endif
                //continue;
            }
            else {
                jpf.xmldb.setNodeValue(oCaption, 
                    pages[i].jml.getAttribute("caption") || "");
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
                this.__makeEditable("page", p[i], pages[i].jml);
            //#endif
        }
        
        //xmldb.htmlImport(p, this.oInt);
        this.pages      = p;
        this.pagelookup = l;
        
        this.setActivePage(0);
        
        //#ifdef __SUPPORT_Gecko
        if (jpf.isGecko) {
            var tocNode = this;
            setTimeout(function(){
                tocNode.oExt.style.height = tocNode.oExt.offsetHeight + 1 + "px";
                tocNode.oExt.style.height = tocNode.oExt.offsetHeight - 1 + "px";
            }, 10);
        }
        //#endif
    }
    
    this.gotoPage = function(nr){
        if (this.disabled) return false;

        if (this.oJmlNode.isValid && !this.oJmlNode.testing) {
            var pages      = this.oJmlNode.getPages();
            var activePage = this.oJmlNode.activePage;
            for (var i = activePage; i < nr; i++) {
                pages[i].oExt.style.position = "absolute"; //hack
                pages[i].oExt.style.top      = "-10000px"; //hack
                pages[i].oExt.style.display  = "block"; //hack
                var test = !this.oJmlNode.isValid || this.oJmlNode
                    .isValid(i < activePage, i < activePage, pages[i]);//false, activePage == i, pages[i], true);
                pages[i].oExt.style.display  = ""; //hack
                pages[i].oExt.style.position = ""; //hack
                pages[i].oExt.style.top      = ""; //hack
                pages[i].oExt.style.left     = ""; //hack
                pages[i].oExt.style.width    = "1px";
                pages[i].oExt.style.width    = "";
    
                if (!test)
                    return this.oJmlNode.setActiveTab(i);
            }
        }
        
        if (this.oJmlNode.showLoader)
            this.oJmlNode.showLoader(true, nr); 

        var oJmlNode = this.oJmlNode;
        setTimeout(function(){
            oJmlNode.setActiveTab(nr);
        }, 1);
        //setTimeout("jpf.lookup(" + this.oJmlNode.uniqueId + ").setActiveTab(" + nr + ");", 1);
    }
    
    this.setActivePage = function(active){
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
                this.__setStyleClass(this.pages[i], "present", ["future", "past"]);
                isPast = false;
            }
            else
                if (isPast)
                    this.__setStyleClass(this.pages[i], "past", ["future", "present"]);
            else
                this.__setStyleClass(this.pages[i], "future", ["past", "present"]);
            
            if (i == this.pages.length-1)
                this.__setStyleClass(this.pages[i], "last");
        }
    }
    
    /* *********
        INIT
    **********/
    this.draw = function(){
        //Build Main Skin
        this.oExt     = this.__getExternal(); 
        this.oCaption = this.__getLayoutNode("main", "caption", this.oExt);
        this.oInt     = this.__getLayoutNode("main", "container", this.oExt);
    }
    
    this.__loadJML = function(x){
        //if(!x.getAttribute("represent")) return;
        
        // #ifdef __DEBUG
        if (!x.getAttribute("represent"))
            throw new Error(jpf.formatErrorString(1013, this, "Find representation", "Could not find representation for the Toc: '" + x.getAttribute("represent") + "'"))
        // #endif
        
        var jmlNode = this;
        setTimeout(function(){
            jmlNode.represent(self[jmlNode.jml.getAttribute("represent")]);
        });
    }
}
// #endif