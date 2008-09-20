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
    this.isPaged      = true;
    this.__focussable = true;

    this.set = function(active){
        return this.setProperty("activepage", active);	
    }
    
    var inited = false;
    
    /**** Properties ****/
    
    this.__supportedProperties.push("activepage", "activepagenr");
    
    this.__propHandlers["activepagenr"] = 
    this.__propHandlers["activepage"] = function(next, noEvent){
        if (!inited) return;

        var page, info = {};
        var page = this.__findPage(next, info);
        
        if (!page) {
            //#ifdef __DEBUG
            jpf.console.warn("Setting tab page which doesn't exist, \
                              referenced by name: '" + next + "'");
            //#endif
            
            return false;
        }
        
        if (page.parentNode != this) {
            //#ifdef __DEBUG
            jpf.console.warn("Setting active page on page component which \
                              isn't a child of this tab component. Cancelling.");
            //#endif
            
            return false;
        }
        
        //If page is given as first argument, let's use its position
        if (next.tagName) {
            next = info.position;
            this.activepage = page.name || next;
        }
        
        //Call the onbeforeswitch event;
        if (!noEvent) {
            var oEvent = {
                previous     : this.activepage,
                previousId   : this.activepageid,
                previousPage : this.__activepage,
                next         : next,
                nextId       : info.position,
                nextpage     : page
            };
            
            if (this.dispatchEvent("onbeforeswitch", oEvent) === false) {
                //Loader support
                if (this.hideLoader)
                    this.hideLoader(); 

                return false;
            }
        }
        
        //Maintain an activepagenr property (not reentrant)
        this.activepagenr = info.position;
        this.setProperty("activepagenr", info.position);
        
        //Deactivate the current page, if any,  and activate the new one
        if (this.__activepage)
            this.__activepage.__deactivate();
        page.__activate();
        this.__activepage = page; 
        
        //Loader support
        if (this.hideLoader) {
            if (page.isRendered)
                this.hideLoader(); 
            else {
                //Delayed rendering support
                page.addEventListener("onafterrender", function(){
                    this.parentNode.hideLoader();
                });
            }
        }
        
        if (!noEvent) {
            if (page.isRendered)
                this.dispatchEvent("onafterswitch", oEvent);
            else {
                //Delayed rendering support
                page.addEventListener("onafterrender", function(){
                    this.parentNode.dispatchEvent("onafterswitch", oEvent);
                });
             }
        }
        
        return true;
    }
    
    this.getPages = function(){
        var r = [], nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].tagName == "page")
                r.push(nodes[i]);
        }
        return r;
    };
    
    this.__findPage = function(nameOrId, info){
        var node, nodes = this.childNodes;
        for (var t = 0, i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.tagName == "page" && (t++ == nameOrId 
              || (nameOrId.tagName && node || node.name) == nameOrId)) {
                if (info)
                    info.position = t - 1;
                return node;
            }
        }

        return null;
    }
    
    this.getPage = function(nameOrId){
        return !jpf.isNot(nameOrId)
            && this.__findPage(nameOrId) || this.__activepage;
    };
    
    /* ***********************
        DISABLING
    ************************/
    
    this.__enable = function(){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].enable)
                nodes[i].enable();
        }
    }
    
    this.__disable = function(){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].disable)
                nodes[i].disable();
        }
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    /**
     * @experimental
     */
    this.add = function(caption, name){
        var page = jpf.document.createElement("page");
        page.setAttribute("id", name);
        page.setAttribute("caption", caption);
        this.appendChild(page);
        return page;
    }
    
    this.remove = function(nameOrId){
        var page = this.__findPage(nameOrId);
        page.removeNode();
        return page;
    }
    
    /**** Keyboard support ****/
    
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
                var pages = this.getPages();
                prevPage = this.activepagenr - 1;
                while (prevPage >= 0 && !pages[prevPage].visible)
                    prevPage--;

                if (prevPage >= 0)
                    this.set(prevPage);
                break;
            case 39:
            //RIGHT
                var pages = this.getPages();
                nextPage = this.activepagenr + 1;
                while (nextPage < pages.length && !pages[nextPage].visible)
                    nextPage++;

                if (nextPage < pages.length)
                    this.set(nextPage);	
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
    
    this.__loadChildren = function(callback){
        var page, f = false, i, node, nodes = this.jml.childNodes;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.nodeType != 1) continue;

            var tagName = node[jpf.TAGNAME];
            if ("page|case".indexOf(tagName) > -1) {
                page = new jpf.page(this.oPages, tagName).loadJml(node, this);
                
                //Set first page marker
                if (!f) page.__first(f = page);
                
                //Call callback
                if (callback)
                    callback.call(page, node);
            }
            else if (callback) {
                callback(tagName, node);
            }
            //#ifdef __DEBUG
            else {
                throw new Error(jpf.formatErrorString(0, this, 
                    "Parsing children of tab component",
                    "Unknown component found as child of tab", node));
            }
            //#endif
        }
        
        //Set last page marker
        if (page !== f)
            page.__last();

        inited = true; //We're done

        //Set active page
        if (page) {
            this.__propHandlers.activepage.call(this, 
                (this.activepage !== undefined 
                    ? this.activepage 
                    : this.activepagenr) || 0);
        }
        else {
            jpf.JmlParser.parseChildren(this.jml, this.oExt, this);
            this.isPages = false;
        }
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
jpf.page = jpf.component(jpf.NOGUI_NODE, function(){
    this.visible = true;
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Button" : [["caption", "@caption"]]};
    // #endif
    
    this.setCaption = function(caption){
        this.setProperty("caption", caption);
    }
    
    /**** Delayed Render Support ****/
    
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    
    //Hack
    this.addEventListener("onbeforerender", function(){
        this.parentNode.dispatchEvent("onbeforerender", {
            page : this
        });
    });
    this.addEventListener("onafterrender",  function(){
        this.parentNode.dispatchEvent("onafterrender", {
            page : this
        });
    });
     // #endif
    
    /**** Properties ****/
    
    this.__booleanProperties["visible"]  = true;
    this.__booleanProperties["disabled"] = true;
    this.__booleanProperties["fake"]     = true;
    this.__supportedProperties.push("fake", "caption", "icon", "visible", 
                                    "disabled");

    this.__propHandlers["caption"] = function(value){
        if (!this.parentNode)
            return;
        
        var node = this.parentNode
            .__getLayoutNode("Button", "caption", this.oButton);

        if(node.nodeType == 1) node.innerHTML = value;
        else node.nodeValue = value;
    }
    this.__propHandlers["visible"] = function(value){
        if (!this.parentNode)
            return;
        
        if (value) {
            this.oExt.style.display = "";
            if (this.parentNode.__hasButtons)
                this.oButton.style.display = "block";
             
            if (!this.parentNode.__activepage) {
                this.parentNode.set(this);
            }
        }
        else {
            if (this.__active) {
                this.__deactivate();
            
                // Try to find a next page, if any.
                var nextPage = this.parentNode.activepagenr + 1;
                var pages = this.parentNode.getPages()
                var len = pages.length
                while (nextPage < len && !pages[nextPage].visible)
                    nextPage++;
    
                if (nextPage == len) {
                    // Try to find a previous page, if any.
                    nextPage = this.parentNode.activepagenr - 1;
                    while (nextPage >= 0 && len && !pages[nextPage].visible)
                        nextPage--;
                }
                
                if (nextPage >= 0)
                    this.parentNode.set(nextPage);
                else {
                    this.parentNode.activepage   = 
                    this.parentNode.activepagenr = 
                    this.parentNode.__activepage = null;
                }
            }
            
            this.oExt.style.display = "none";
            if (this.parentNode.__hasButtons)
                this.oButton.style.display = "none";
        }
    }
    /**
     * Unlike other components, this disables all children
     * @todo Please test this is not extremely slow, might be optimized
     * by only hiding components on the active page
     */
    this.__propHandlers["disabled"] = function(value){
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
    this.__propHandlers["fake"] = function(value){
        if (this.oExt) {
            jpf.removeNode(this.oExt);
            this.oInt = this.oExt = null;
        }
    }
    
    var position = 0;
    this.__first = function(){
        position = 1;
        this.parentNode.__setStyleClass(this.oButton, "firstbtn");
    }
    
    this.__last = function(){
        position = -1;
        this.parentNode.__setStyleClass(this.oButton, "lastbtn");
    }

    this.__deactivate = function(fakeOther){
        if (this.disabled) 
            return false;

        this.__active = false
        
        if (this.parentNode.__hasButtons) {
            if (position > 0)  
                this.parentNode.__setStyleClass(this.oButton, "", ["firstcurbtn"]);
            this.parentNode.__setStyleClass(this.oButton, "", ["curbtn"]);
        }

        if (!this.fake && !fakeOther)
            this.parentNode.__setStyleClass(this.oExt, "", ["curpage"]);
    }
    
    this.__activate = function(){
        if (this.disabled) 
            return false;
        
        if (this.parentNode.__hasButtons) {
            if(position > 0) 
                this.parentNode.__setStyleClass(this.oButton, "firstcurbtn");
            this.parentNode.__setStyleClass(this.oButton, "curbtn");
        }

        if (!this.fake) {
            this.parentNode.__setStyleClass(this.oExt, "curpage");
            
            if (jpf.layoutServer)
                jpf.layoutServer.forceResize(this.oInt);
        }
        
        this.__active = true;
        
        // #ifdef __WITH_DELAYEDRENDER
        this.render();
        // #endif
    }
    
    /**** Init ****/
    
    this.draw = function(x){
        if (this.parentNode.__hasButtons) {
            this.parentNode.__getNewContext("button");
            var elBtn = this.parentNode.__getLayoutNode("button");
            elBtn.setAttribute(this.parentNode.__getOption("Main", "select") || "onmousedown",
                'jpf.lookup(' + this.parentNode.uniqueId + ').set(jpf.lookup(' 
                + this.uniqueId + '));if(!jpf.isSafariOld) this.onmouseout()');
            elBtn.setAttribute("onmouseover", 'var o = jpf.lookup('
                + this.parentNode.uniqueId + ');if(jpf.lookup(' + this.uniqueId
                + ') != o.__activepage) o.__setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = jpf.lookup(' 
                + this.parentNode.uniqueId + '); o.__setStyleClass(this, "", ["over"]);');
            this.oButton = jpf.xmldb.htmlImport(elBtn, this.parentNode.oButtons);
            
            /* #ifdef __WITH_EDITMODE
            if(this.parentNode.editable)
            #endif */
            // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
                this.parentNode.__makeEditable("Button", this.oButton, this.jml);
            // #endif
        }
        
        if (this.fake)
            return;
        
        this.oExt = this.parentNode.__getExternal("Page", 
            this.parentNode.oPages, null, this.jml);
    }
    
    this.__loadJml = function(x){
        if (this.fake)
            return;
        
        if (this.oInt) {
            var oInt = this.parentNode
                .__getLayoutNode("Page", "container", this.oExt);
            oInt.setAttribute("id", this.oInt.getAttribute("id"));
            this.oInt = jpf.JmlParser.replaceNode(oInt, this.oInt);
        }
        else {
            this.oInt = this.parentNode
                .__getLayoutNode("Page", "container", this.oExt);
            jpf.JmlParser.parseChildren(this.jml, this.oInt, this, true);
        }
    }
    
    this.__destroy = function(){
        this.oButton = null;
    }
});

// #endif