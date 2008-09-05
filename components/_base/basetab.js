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
    this.focussable = true;
    var lastpages   = [], pages = [], pageLUT = {};

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.setActiveTab = function(active){
        return this.setProperty("activepage", active);	
    }

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
            pages[this.activePage].deactivate(pages[active].fake);
        pages[active].activate();
        
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
    
    this.__supportedProperties = ["activepage"];
    this.__handlePropSet = function(prop, value, reqValue){
        if (prop == "activepage")
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

    this.addPage = function(xmlNode, userfunc){
        var id = pages.push(new jpf.TabPage(xmlNode, this)) - 1;
        if (pages[id].jml.getAttribute("name"))
            pageLUT[pages[id].jml.getAttribute("name")] = id;
        pages[id].draw(this.hasButtons, id, lastpages[id]);
        if (userfunc)
            userfunc.call(pages[id], xmlNode);
        return pages[id];
    }
    
    /**
     * @experimental
     */
    this.add = function(caption){
        var xmlNode = jpf.xmldb.getXml('<j:Page caption="'
            + caption + '" xmlns:j="http://www.javeline.net/j" />');
        var id = pages.push(new TabPage(xmlNode, this)) - 1;
        if (pages[id].jml.getAttribute("name"))
            pageLUT[pages[id].jml.getAttribute("name")] = id;
        pages[id].draw(this.hasButtons, id);
        return pages[id];
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
        
        var nodes = this.jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            var tagName = nodes[i][jpf.TAGNAME];

            if (tagName == "page")
                this.addPage(nodes[i], userfunc);
            //#ifdef __WITH_XFORMS
            else if (tagName == "case" && nodes[i].getAttribute("id")) //or should this give an error?
                jpf.nameserver.register("case", nodes[i].getAttribute("id"),
                    this.addPage(nodes[i], userfunc));
            //#endif
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
            jpf.JMLParser.parseChildren(this.jml, this.oExt, this);
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
jpf.TabPage = function(JML, pJmlNode){
    jpf.register(this, "tabPage", GUI_NODE);/** @inherits jpf.Class */

    this.jml  = JML;
    this.name = this.jml.getAttribute("name");
    this.fake = (this.jml.getAttribute("fake") == 'true');
    
    if (this.name) jpf.setReference(this.name, this);
    this.hasButtons = false;
    this.pHtmlNode  = pJmlNode.oPages;
    
    // #ifdef __WITH_JMLDOM
    this.parentNode = pJmlNode;
    // #endif
    
    //Hack!!! somehow loadJml parts should be done here...
    if (this.jml.getAttribute("actiontracker")) {
        this.__ActionTracker = self[this.jml.getAttribute("actiontracker")]
            ? jpf.JMLParser.getActionTracker(this.jml.getAttribute("actiontracker"))
            : jpf.setReference(this.jml.getAttribute("actiontracker"),
                jpf.nameserver.register("actiontracker",
                this.jml.getAttribute("actiontracker"),
                new jpf.ActionTracker(this)));
    }
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Button" : [["caption", "@caption"]]};
    // #endif
    
    this.setCaption = function(caption){
        this.caption = caption;
        var node = pJmlNode.__getLayoutNode("Button", "caption", this.oButton);

        if(node.nodeType == 1) node.innerHTML = caption;
        else node.nodeValue = caption;
        //jpf.xmldb.setNodeValue(, caption);
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

    /*this.getCaption = function(caption){
        return jpf.xmldb.getNodeValue(pJmlNode.__getLayoutNode("Button", "caption", this.oButton));
    }*/
    
    // Actually, these two should be clearly marked as internals as they allow for total 
    // loss of any active tab, or activating more than one.	
    this.deactivate = function(fakeOther){
        if (this.disabled) return false;

        this.isActive = false
        
        if (this.hasButtons) {
            if (position > 0)  pJmlNode.__setStyleClass(this.oButton, "", ["firstcurbtn"]);
            pJmlNode.__setStyleClass(this.oButton, "", ["curbtn"]);
        }
        if (!this.fake && !fakeOther)
            pJmlNode.__setStyleClass(this.oExt, "", ["curpage"]);
    }
    
    this.activate = function(){
        if (this.disabled) return false;
        
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
    
    this.hide = function(){
        //if(this.oButton) this.oButton.style.display = "none";
        //this.oExt.style.display = "none";
        
        if (this.isActive) {
            this.deactivate();
            
            // Try to find a next page, if any.
            var nextPage = this.parentNode.activePage + 1;
            while (nextPage < this.parentNode.getPages().length && !this.parentNode.getPage(nextPage).isVisible())
                nextPage++;
            if (nextPage == this.parentNode.getPages().length) {
                // Try to find a previous page, if any.
                nextPage = this.parentNode.activePage - 1;
                while (nextPage >= 0 && this.parentNode.getPages().length
                  && !this.parentNode.getPage(nextPage).isVisible())
                    nextPage--;
            }
            
            if (nextPage >= 0)
                this.parentNode.getPage(nextPage).activate();		
        }
    }
    
    this.show = function(){
        //if(this.oButton) this.oButton.style.display = "block";
        //this.oExt.style.display = "block";
        
        if (!this.isActive) {
            this.activate();
            var pages = this.parentNode.getPages();
            for (var i = 0; i < pages.length; i++) {
                if (pages[i] == this) {
                    pJmlNode.setActiveTab(i);
                    break;
                }
            }
        }
    }
    
    this.draw = function(drawButtons, id, lastPage){
        this.hasButtons = drawButtons;
        this.caption    = this.jml.getAttribute("caption");
        
        if (drawButtons) {
            pJmlNode.__getNewContext("Button");
            var elBtn = pJmlNode.__getLayoutNode("Button");
            elBtn.setAttribute(pJmlNode.__getOption("Main", "select") || "onmousedown",
                'jpf.lookup(' + pJmlNode.uniqueId + ').setActiveTab(' + id
                 + ');if(!jpf.isSafariOld) this.onmouseout()');
            elBtn.setAttribute("onmouseover", 'var o = jpf.lookup('
                + pJmlNode.uniqueId + ');if(' + id
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
        
        if (lastPage) {
            jpf.JMLParser.replaceNode(this.oInt, lastPage.oInt);
            this.oInt.setAttribute("id", lastPage.oInt.getAttribute("id"));
        } else
            jpf.JMLParser.parseChildren(this.jml, this.oInt, this, true);
    }
    
    this.__destroy = function(){
        this.oButton = null;
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
    
    //this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    // #ifdef __WITH_JMLDOM
    this.inherit(jpf.JmlDomAPI); /** @inherits jpf.JmlDomAPI */
    // #endif
}

// #endif