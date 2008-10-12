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
    this.isPaged         = true;
    this.$focussable     = jpf.KEYBOARD;
    this.canHaveChildren = true;

    this.set = function(active){
        return this.setProperty("activepage", active);	
    }
    
    var inited = false;
    
    /**** Properties ****/
    
    this.$supportedProperties.push("activepage", "activepagenr");
    
    this.$propHandlers["activepagenr"] = 
    this.$propHandlers["activepage"]   = function(next, noEvent){
        if (!inited) return;

        var page, info = {};
        var page = this.$findPage(next, info);
        
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
                previousId   : this.activepagenr,
                previousPage : this.$activepage,
                next         : next,
                nextId       : info.position,
                nextpage     : page
            };
            
            if (this.dispatchEvent("beforeswitch", oEvent) === false) {
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
        if (this.$activepage)
            this.$activepage.$deactivate();
        
        page.$activate();
        this.$activepage = page; 
        
        //Loader support
        if (this.hideLoader) {
            if (page.isRendered)
                this.hideLoader(); 
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){
                    this.parentNode.hideLoader();
                });
            }
        }
        
        if (!noEvent) {
            if (page.isRendered)
                this.dispatchEvent("afterswitch", oEvent);
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){
                    this.parentNode.dispatchEvent("afterswitch", oEvent);
                });
             }
        }
        
        return true;
    }
    
    /**** DOM Hooks ****/
    
    this.$domHandlers["removechild"].push(function(jmlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;

        if (this.firstChild == jmlNode && jmlNode.nextSibling)
            jmlNode.nextSibling.$first();
        if (this.lastChild == jmlNode && jmlNode.previousSibling)
            jmlNode.previousSibling.$last();

        if (this.$activepage == jmlNode) {
            if (jmlNode.nextSibling || jmlNode.previousSibling)
                this.set(jmlNode.nextSibling || jmlNode.previousSibling);
            else {
                this.$activepage = 
                this.activepage   = 
                this.activepagenr = null;
            }
        }
    });
    
    this.$domHandlers["insert"].push(function(jmlNode, beforeNode, withinParent){
        if (jmlNode.tagName != "page")
            return;

        if (!beforeNode) {
            if (this.lastChild)
                this.lastChild.$last(true);
            jmlNode.$last();
        }
        
        if(!this.firstChild || beforeNode == this.firstChild) {
            if (this.firstChild)
                this.firstChild.$first(true);
            jmlNode.$first();
        }

        if (this.$activepage) {
            var info = {};
            this.$findPage(this.$activepage, info);

            if (this.activepagenr != info.position) {
                if (parseInt(this.activepage) == this.activepage) {
                    this.activepage = info.position;
                    this.setProperty("activepage", info.position);
                }
                this.activepagenr = info.position;
                this.setProperty("activepagenr", info.position);
            }
        }
        else if (!this.$activepage)
            this.set(jmlNode);
    });
    
    this.getPages = function(){
        var r = [], nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].tagName == "page")
                r.push(nodes[i]);
        }
        return r;
    };
    
    this.$findPage = function(nameOrId, info){
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
            && this.$findPage(nameOrId) || this.$activepage;
    };
    
    /* ***********************
        DISABLING
    ************************/
    
    this.$enable = function(){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].enable)
                nodes[i].enable();
        }
    }
    
    this.$disable = function(){
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
        if (name)
            page.setAttribute("id", name);
        page.setAttribute("caption", caption);
        this.appendChild(page);
        return page;
    }
    
    this.remove = function(nameOrId){
        var page = this.$findPage(nameOrId);
        if (!page)
            return false;

        page.removeNode();
        return page;
    }
    
    /**** Keyboard support ****/
    
    // #ifdef __WITH_KEYBOARD
    
    this.addEventListener("keydown", function(e){
        if (!this.$hasButtons)
            return;
        
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
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
                    this.setProperty("activepage", prevPage)
                break;
            case 39:
            //RIGHT
                var pages = this.getPages();
                nextPage = this.activepagenr + 1;
                while (nextPage < pages.length && !pages[nextPage].visible)
                    nextPage++;

                if (nextPage < pages.length)
                    this.setProperty("activepage", nextPage)
                break;
            default:
                return;
        }
        //return false;
    }, true);
    
    // #endif

    /* ***********************
      Other Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"button" : [["caption", "@caption"]]};
    // #endif
    
    this.$loadChildren = function(callback){
        var page = false, f = false, i;

        inited = true; 

        if (this.$hasButtons)
            this.oButtons = this.$getLayoutNode("main", "buttons", this.oExt);

        this.oPages = this.$getLayoutNode("main", "pages", this.oExt);
        
        //Skin changing support
        if (this.oInt) {
            //jpf.JmlParser.replaceNode(oPages, this.oPages);
            this.oInt = this.oPages;
            page      = true;
            
            var node, nodes = this.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                node.$draw(true);
                node.$skinchange();
                node.$loadJml();
            }
        }
        else {
            this.oInt = this.oPages;
    
            //Let's not parse our children, when we've already have them
            if (this.childNodes.length) 
                return;

            //Build children
            var node, nodes = this.$jml.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                if (node.nodeType != 1) continue;
    
                var tagName = node[jpf.TAGNAME];
                if ("page|case".indexOf(tagName) > -1) {
                    page = new jpf.page(this.oPages, tagName).loadJml(node, this);
                    
                    //Set first page marker
                    if (!f) page.$first(f = page);
                    
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
                page.$last();
        }
        
        //Set active page
        if (page) {
            this.activepage = (this.activepage !== undefined 
                ? this.activepage 
                : this.activepagenr) || 0;
            this.$propHandlers.activepage.call(this, this.activepage);
        }
        else {
            jpf.JmlParser.parseChildren(this.$jml, this.oExt, this);
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
jpf.page = jpf.component(jpf.NODE_HIDDEN, function(){
    this.visible         = true;
    this.canHaveChildren = 2;
    this.$focussable     = false;
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"button" : [["caption", "@caption"]]};
    // #endif
    
    this.setCaption = function(caption){
        this.setProperty("caption", caption);
    }
    
    /**** Delayed Render Support ****/
    
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    
    //Hack
    this.addEventListener("beforerender", function(){
        this.parentNode.dispatchEvent("beforerender", {
            page : this
        });
    });
    this.addEventListener("afterrender",  function(){
        this.parentNode.dispatchEvent("afterrender", {
            page : this
        });
    });
     // #endif
    
    /**** Properties ****/
    
    this.$booleanProperties["visible"]  = true;
    this.$booleanProperties["fake"]     = true;
    this.$supportedProperties.push("fake", "caption", "icon");

    this.$propHandlers["caption"] = function(value){
        if (!this.parentNode)
            return;
        
        var node = this.parentNode
            .$getLayoutNode("button", "caption", this.oButton);

        if(node.nodeType == 1) node.innerHTML = value;
        else node.nodeValue = value;
    }
    this.$propHandlers["visible"] = function(value){
        if (!this.parentNode)
            return;
        
        if (value) {
            this.oExt.style.display = "";
            if (this.parentNode.$hasButtons)
                this.oButton.style.display = "block";
             
            if (!this.parentNode.$activepage) {
                this.parentNode.set(this);
            }
        }
        else {
            if (this.$active) {
                this.$deactivate();
            
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
                    this.parentNode.$activepage = null;
                }
            }
            
            this.oExt.style.display = "none";
            if (this.parentNode.$hasButtons)
                this.oButton.style.display = "none";
        }
    }
    this.$propHandlers["fake"] = function(value){
        if (this.oExt) {
            jpf.removeNode(this.oExt);
            this.oInt = this.oExt = null;
        }
    }
    
    /**** DOM Hooks ****/
    
    this.$domHandlers["remove"].push(function(doOnlyAdmin){
        if (this.oButton) {
            if (position & 1)
                this.parentNode.$setStyleClass(this.oButton, "", ["firstbtn", "firstcurbtn"]);
            if (position & 2)
                this.parentNode.$setStyleClass(this.oButton, "", ["lastbtn"]);
        }
        
        if (!doOnlyAdmin) {
            if (this.oButton)
                this.oButton.parentNode.removeChild(this.oButton);
            
            if (this.parentNode.$activepage == this) {
                if (this.oButton)
                    this.parentNode.$setStyleClass(this.oButton, "", ["curbtn"]);
                this.parentNode.$setStyleClass(this.oExt, "", ["curpage"]);
            }
        }
    });
    
    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$jmlLoaded)
            return;
        
        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.$draw();
            this.$skinchange();
            this.$loadJml();
        }
        else if (this.oButton && pNode.$hasButtons)
            pNode.oButtons.insertBefore(this.oButton, 
                beforeNode && beforeNode.oButton || null);
    });
    
    /**** Private state functions ****/
    
    var position = 0;
    this.$first = function(remove){
        if (remove) {
            position -= 1;
            this.parentNode.$setStyleClass(this.oButton, "", 
                ["firstbtn", "firstcurbtn"]);
        }
        else {
            position = position | 1;
            this.parentNode.$setStyleClass(this.oButton, "firstbtn" 
                + (this.parentNode.$activepage == this ? " firstcurbtn" : ""));
        }
    }
    
    this.$last = function(remove){
        if (remove) {
            position -= 2;
            this.parentNode.$setStyleClass(this.oButton, "", ["lastbtn"]);
        }
        else {
            position = position | 2;
            this.parentNode.$setStyleClass(this.oButton, "lastbtn");
        }
    }
    
    this.$deactivate = function(fakeOther){
        if (this.disabled) 
            return false;

        this.$active = false
        
        if (this.parentNode.$hasButtons) {
            if (position > 0)  
                this.parentNode.$setStyleClass(this.oButton, "", ["firstcurbtn"]);
            this.parentNode.$setStyleClass(this.oButton, "", ["curbtn"]);
        }

        if (!this.fake && !fakeOther)
            this.parentNode.$setStyleClass(this.oExt, "", ["curpage"]);
    }
    
    this.$activate = function(){
        if (this.disabled) 
            return false;
        
        if (this.parentNode.$hasButtons) {
            if(position > 0) 
                this.parentNode.$setStyleClass(this.oButton, "firstcurbtn");
            this.parentNode.$setStyleClass(this.oButton, "curbtn");
        }

        if (!this.fake) {
            this.parentNode.$setStyleClass(this.oExt, "curpage");
            
            if (jpf.layout)
                jpf.layout.forceResize(this.oInt);
        }
        
        this.$active = true;
        
        // #ifdef __WITH_DELAYEDRENDER
        this.render();
        // #endif
    }
    
    this.$skinchange = function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);
            
        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    }
    
    /**** Init ****/
    
    this.$draw = function(isSkinSwitch){
        this.skinName = this.parentNode.skinName;
        
        if (this.parentNode.$hasButtons) {
            //this.parentNode.$removeEditable(); //@todo multilingual support is broken when using dom
            
            this.parentNode.$getNewContext("button");
            var elBtn = this.parentNode.$getLayoutNode("button");
            elBtn.setAttribute(this.parentNode.$getOption("Main", "select") || "onmousedown",
                'jpf.lookup(' + this.parentNode.uniqueId + ').set(jpf.lookup(' 
                + this.uniqueId + '));if(!jpf.isSafariOld) this.onmouseout()');
            elBtn.setAttribute("onmouseover", 'var o = jpf.lookup('
                + this.parentNode.uniqueId + ');if(jpf.lookup(' + this.uniqueId
                + ') != o.$activepage) o.$setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = jpf.lookup(' 
                + this.parentNode.uniqueId + '); o.$setStyleClass(this, "", ["over"]);');
            this.oButton = jpf.xmldb.htmlImport(elBtn, this.parentNode.oButtons);
            
            /* #ifdef __WITH_EDITMODE
            if(this.parentNode.editable)
            #endif */
            // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
            this.parentNode.$makeEditable("button", this.oButton, this.$jml);
            // #endif

            if (!isSkinSwitch && this.nextSibling && this.nextSibling.oButton)
                this.oButton.parentNode.insertBefore(this.oButton, this.nextSibling.oButton);
            
            this.oButton.host = this;
        }
        
        if (this.fake)
            return;
        
        if (this.oExt)
            this.oExt.parentNode.removeChild(this.oExt); //@todo mem leaks?
        
        this.oExt = this.parentNode.$getExternal("Page", 
            this.parentNode.oPages, null, this.$jml);
        this.oExt.host = this;
    }
    
    this.$loadJml = function(x){
        if (this.fake)
            return;
        
        if (this.oInt) {
            var oInt = this.parentNode
                .$getLayoutNode("page", "container", this.oExt);
            oInt.setAttribute("id", this.oInt.getAttribute("id"));
            this.oInt = jpf.JmlParser.replaceNode(oInt, this.oInt);
        }
        else {
            this.oInt = this.parentNode
                .$getLayoutNode("page", "container", this.oExt);
            jpf.JmlParser.parseChildren(this.$jml, this.oInt, this, true);
        }
    }
    
    this.$destroy = function(){
        this.oButton.host = null;
        this.oButton = null;
    }
});

// #endif