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

// #ifdef __JBASETAB || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Baseclass of a Paged component
 *
 * @constructor
 * @baseclass
 * @allowchild page
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.BaseTab = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    this.activePage = -1;
    this.isPaged    = true;
    this.__focussable = true;
    var lastpages   = [], pages = [], pageLUT = {};

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.setActiveTab = function(active){
        return this.setProperty("activepage", active);	
    }

    //@todo refactor this to support named tab pages
    this.__setActiveTab = function(active, noEvent){
        if (typeof active == "string")
            active = pageLUT[active] || parseInt(active);
        if (!active)
            active = 0;
        
        if (!noEvent && this.dispatchEvent("onbeforeswitch", {
          pageId : active,
          page : pages[active]
        }) === false) {
            if (this.hideLoader)
                this.hideLoader(); 
            return false;
        }
        if (this.switchType == "hide-all" && jpf.isDeskrun)
            DeskRun.hideAll();
        if (!pages[active])
            return false;
        
        // if we have a fake-page structure, only update the tabs visiblity when active==0	
        if (this.activePage > -1)
            pages[this.activePage].__deactivate(pages[active].fake);
        pages[active].__activate();
        
        this.activePage = this.activepage = active; //please fix to to use this.activepage... this is confusing
        
        if (jpf.layoutServer)
            jpf.layoutServer.forceResize(pages[active].oInt);
        
        // #ifdef __DESKRUN
        if (jpf.isDeskrun) {
            if (this.switchType == "hide-all")
                DeskRun.showAll();
            else
                DeskRun.fixShow();
        }
        // #endif
        
        if (this.hideLoader) {
            if (pages[active].isRendered)
                this.hideLoader(); 
            else
                nextpage.addEventListener("onafterrender", function(){
                    this.parentNode.hideLoader();
                });
        }
        
        if (!noEvent) {
            if (pages[active].isRendered)
                this.dispatchEvent("onafterswitch", {
                    pageId : active,
                    page : pages[active]
                });
            else
                pages[active].addEventListener("onafterrender", function(){
                    this.parentNode.dispatchEvent("onafterswitch", {
                        pageId : active,
                        page   : pages[active]
                    });
                });
        }
        
        return true;
    }
    
    this.__supportedProperties.push("activepage");
    this.__propHandlers["activepage"] = function(value){
        return this.__setActiveTab(value);
    }
    
    this.getPages    = function(){
        return pages;
    };
    
    this.getPage     = function(id){
        return pages[id || id === 0 ? id : this.activePage];
    };
    
    this.getPageName = function(id){
        return pages[(id || id === 0)
            ? id 
            : this.activePage].jml.getAttribute("name");
    };
    
    this.getPageId   = function(name){
        return pageLUT[name];
    };
    
    function forpages(feat){
        for (var i = 0; i < pages.length; i++)
            pages[i][feat]();
    }
    
    /* ***********************
        DISABLING
    ************************/
    
    this.__enable = function(){
        forpages("enable");
    }
    
    this.__disable = function(){
        forpages("disable");
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    /**
     * @experimental
     */
    this.add = function(caption){
        var page = jpf.document.createElement("page");
        page.setAttribute("caption", caption);
        this.appendChild(page);
        return page;
    }
    
    /* ***********************
        Keyboard Support
    ************************/
    // #ifdef __WITH_KBSUPPORT
    
    //Handler for a plane list
    this.__keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 9:
                break;
            case 13:
                break;
            case 32:
                break;
            case 37:
            //LEFT
                prevPage = this.activePage-1;
                while (prevPage >= 0 && !pages[prevPage].isVisible())
                    prevPage--;
                if (prevPage >= 0)
                    this.setActiveTab(prevPage);
                break;
            case 39:
            //RIGHT
                nextPage = this.activePage+1;
                while (nextPage < pages.length && !pages[nextPage].isVisible())
                    nextPage++;
                if (nextPage < pages.length)
                    this.setActiveTab(nextPage);	
                break;
            default:
                return;
        }
        //return false;
    }
    
    // #endif

    /* ***********************
      Other Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Button" : [["caption", "@caption"]]};
    // #endif
    
    this.__drawTabs = function(userfunc){
        if (pages.length) {
            lastpages = pages;
            pages     = []; 
        }
        
        var page, i, nodes = this.jml.childNodes;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            var tagName = nodes[i][jpf.TAGNAME];

            if ("page|case".indexOf(tagName) > -1) {
                var page        = new jpf.page(nodes[i], tagName, this);
                page.hasButtons = this.hasButtons;
                page.tabId      = pages.push(page) - 1;
                page.lastPage   = lastpages[id];
                page.loadJML(nodes[i]);
                
                if (userfunc)
                    userfunc.call(page, nodes[i]);
            }
            else if (tagName == "loader")
                this.setLoading(nodes[i]);
            else if (this.addOther)
                this.addOther(tagName, nodes[i]);
        }
        
        lastpages = null;
        
        if (pages.length) {
            pages[0].setFirst();
            if (pages.length > 1)
                pages[pages.length - 1].setLast();
        }

        if (pages.length && this.activepage == 0)
            this.__setActiveTab(0);
        else if (pages.length) {
            this.activepage = 0;
            this.__setActiveTab(0, true);
        } else
            jpf.JmlParser.parseChildren(this.jml, this.oExt, this);
    }
}

/**
 * Object representing a Page in a Paged component.
 *
 * @constructor
 * @define  page  
 * @allowchild  {components}, {anyjml}
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
//htmlNode, tagName, parentNode
jpf.page = jpf.subnode(jpf.NOGUI_NODE, function(){
    this.pHtmlNode  = this.parentNode.oPages;
    this.hasButtons = false;
    
    this.__booleanProperties = {"visible":1}; 
    this.__supportedProperties = ["fake", "caption", "icon", "name", 
                                   "visible", "disabled"]; 
    this.__propHandlers = {
        "caption" : function(value){
            var node = pJmlNode.__getLayoutNode("Button", "caption", this.oButton);
    
            if(node.nodeType == 1) node.innerHTML = caption;
            else node.nodeValue = caption;
        },
        "visible" : function(value){
            if (this.isActive == value)
                return;

            if (value) {
                this.__activate();
                var pages = this.parentNode.getPages();
                for (var i = 0; i < pages.length; i++) {
                    if (pages[i] == this) {
                        pJmlNode.setActiveTab(i);
                        break;
                    }
                }
            }
            else {
                this.__deactivate();
                
                // Try to find a next page, if any.
                var nextPage = this.parentNode.activePage + 1;
                while (nextPage < this.parentNode.getPages().length 
                  && !this.parentNode.getPage(nextPage).isVisible())
                    nextPage++;

                if (nextPage == this.parentNode.getPages().length) {
                    // Try to find a previous page, if any.
                    nextPage = this.parentNode.activePage - 1;
                    while (nextPage >= 0 && this.parentNode.getPages().length
                      && !this.parentNode.getPage(nextPage).isVisible())
                        nextPage--;
                }
                
                if (nextPage >= 0)
                    this.parentNode.getPage(nextPage).__activate();		
            }
        },
        
        /**
         * Unlike other components, this disables all children
         * @todo Please test this is not extremely slow, might be optimized
         * by only hiding components on the active page
         */
        "disabled" : function(value){
            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    node.setProperty("disabled", value);
                    
                    if (node.childNodes.length)
                        loopChildren(node.childNodes);
                }
            }
            loopChildren(this.childNodes);
        }
    }; 
    
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Button" : [["caption", "@caption"]]};
    // #endif
    
    this.setCaption = function(caption){
        this.setProperty("caption", caption);
    }
    
    var position = 0;
    this.setFirst = function(){
        position = 1;
        pJmlNode.__setStyleClass(this.oButton, "firstbtn");
    }
    
    this.setLast = function(){
        position = -1;
        pJmlNode.__setStyleClass(this.oButton, "lastbtn");
    }

    this.__deactivate = function(fakeOther){
        if (this.disabled) 
            return false;

        this.isActive = false
        
        if (this.hasButtons) {
            if (position > 0)  pJmlNode.__setStyleClass(this.oButton, "", ["firstcurbtn"]);
            pJmlNode.__setStyleClass(this.oButton, "", ["curbtn"]);
        }
        if (!this.fake && !fakeOther)
            pJmlNode.__setStyleClass(this.oExt, "", ["curpage"]);
    }
    
    this.__activate = function(){
        if (this.disabled) 
            return false;
        
        if (this.hasButtons) {
            if(position > 0) pJmlNode.__setStyleClass(this.oButton, "firstcurbtn");
            pJmlNode.__setStyleClass(this.oButton, "curbtn");
        }
        if (!this.fake)
            pJmlNode.__setStyleClass(this.oExt, "curpage");
        
        this.isActive = true;
        
        // #ifdef __WITH_DELAYEDRENDER
        this.render();
        // #endif
    }
    
    this.draw = function(){
        this.caption    = this.jml.getAttribute("caption");
        
        if (drawButtons) {
            pJmlNode.__getNewContext("Button");
            var elBtn = pJmlNode.__getLayoutNode("Button");
            elBtn.setAttribute(pJmlNode.__getOption("Main", "select") || "onmousedown",
                'jpf.lookup(' + pJmlNode.uniqueId + ').setActiveTab(' + this.tabId
                 + ');if(!jpf.isSafariOld) this.onmouseout()');
            elBtn.setAttribute("onmouseover", 'var o = jpf.lookup('
                + pJmlNode.uniqueId + ');if(' + this.tabId
                + ' != o.activePage) o.__setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = jpf.lookup(' 
                + pJmlNode.uniqueId + '); o.__setStyleClass(this, "", ["over"]);');
            this.oButton = jpf.xmldb.htmlImport(elBtn, pJmlNode.oButtons);
            
            this.setCaption(this.caption);
            
            /* #ifdef __WITH_EDITMODE
            if(pJmlNode.editable)
            #endif */
            // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
                pJmlNode.__makeEditable("Button", this.oButton, this.jml);
            // #endif
        }
        
        this.oExt = pJmlNode.__getExternal("Page", pJmlNode.oPages, null, this.jml);
        this.oInt = pJmlNode.__getLayoutNode("Page", "container", this.oExt);
        
        if (this.lastPage) {
            jpf.JmlParser.replaceNode(this.oInt, this.lastPage.oInt);
            this.oInt.setAttribute("id", this.lastPage.oInt.getAttribute("id"));
            this.lastPage = null;
        } else
            jpf.JmlParser.parseChildren(this.jml, this.oInt, this, true);
    }
    
    this.__destroy = function(){
        this.oButton = null;
    }
    
    this.__loadJML = function(x){
        
    }
    
    /* ***********************
        OTHER INHERITANCE
    ************************/
    
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    // #endif
    
    //Hack
    this.addEventListener("onbeforerender", function(){
        pJmlNode.dispatchEvent("onbeforerender", {
            page : this
        });
    });
    this.addEventListener("onafterrender",  function(){
        pJmlNode.dispatchEvent("onafterrender", {page : this});
    });
});

// #endif