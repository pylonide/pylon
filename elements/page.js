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

// #ifdef __AMLPAGE || __INC_ALL

/**
 * A page in a pageable element. (i.e. a page in {@link element.tab})
 *
 * @constructor
 * @define  page
 * @allowchild  {elements}, {anyaml}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.page = function(struct, tagName){
    this.$init(tagName || "page", apf.NODE_VISIBLE, struct);
};

(function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    this.buttons         = false;
    this.closebtn        = false;

    //#ifdef __WITH_CONVENIENCE_API
    /**
     * Sets the caption of the button of this element.
     * @param {String} caption the text displayed on the button of this element.
     */
    this.setCaption = function(caption){
        this.setProperty("caption", caption, false, true);
    };

    /**
     * Sets the icon of the button of this element.
     * @param {String} icon the icon displayed on the button of this element.
     */
    this.setIcon = function(icon) {
        this.setProperty("icon", icon, false, true);
    };
    //#endif

    /**** Delayed Render Support ****/

    // #ifdef __WITH_DELAYEDRENDER
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
    this.$booleanProperties["closebtn"] = true;
    this.$supportedProperties.push("fake", "caption", "icon", 
        "type", "buttons", "closebtn");

    this.$propHandlers["buttons"] = function(value){
        this.buttons = value;
    };
    
    this.$propHandlers["closebtn"] = function(value){
        this.closebtn = value;
    };

    /**
     * @attribute {String} caption the text displayed on the button of this element.
     */
    this.$propHandlers["caption"] = function(value){
        if (!this.parentNode)
            return;

        var node = this.parentNode
            .$getLayoutNode("button", "caption", this.$button);

        if (node.nodeType == 1)
            node.innerHTML = value;
        else
            node.nodeValue = value;
    };

    this.$propHandlers["icon"] = function(value) {
        if (!this.parentNode)
            return;

        var node = this.parentNode
            .$getLayoutNode("button", "icon", this.$button);

        if (node && node.nodeType == 1)
            apf.skins.setIcon(node, value, this.parentNode.iconPath);
    };

    this.$propHandlers["visible"] = function(value){
        if (!this.parentNode)
            return;

        if (value) {
            this.$ext.style.display = "";
            if (this.parentNode.$hasButtons)
                this.$button.style.display = "block";

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

            this.$ext.style.display = "none";
            if (this.parentNode.$hasButtons)
                this.$button.style.display = "none";
        }
    };

    /**
     * @attribute {Boolean} fake whether this page actually contains elements or
     * only provides a button in the pageable parent element.
     */
    this.$propHandlers["fake"] = function(value){
        if (this.$ext) {
            apf.destroyHtmlNode(this.$ext);
            this.$int = this.$ext = null;
        }
    };

    this.$propHandlers["type"] = function(value) {
        this.setProperty("fake", true);
        this.relPage = this.parentNode.getPage(value);
        if (this.$active)
            this.$activate();
    };

    /**** DOM Hooks ****/

    this.addEventListener("DOMNodeRemoved", function(e){
        if (e && e.currentTarget != this)
            return;
        
        if (this.$button) {
            if (this.$position & 1)
                this.parentNode.$setStyleClass(this.$button, "", ["firstbtn", "firstcurbtn"]);
            if (this.$position & 2)
                this.parentNode.$setStyleClass(this.$button, "", ["lastbtn"]);
        }

        if (!e.$doOnlyAdmin) {
            if (this.$button)
                this.$button.parentNode.removeChild(this.$button);

            if (this.parentNode.$activepage == this) {
                if (this.$button)
                    this.parentNode.$setStyleClass(this.$button, "", ["curbtn"]);
                this.parentNode.$setStyleClass(this.$ext, "", ["curpage"]);
            }
        }
    });

    //beforeNode, pNode, withinParent
    this.addEventListener("DOMNodeInserted", function(e){
        if (e && e.currentTarget != this || !this.$amlLoaded 
          || !e.$oldParent)
            return;

        if (!e.$moveWithinParent 
          && this.skinName != this.parentNode.skinName) {
            this.$destroy(); //clean up button
        }
        else if (this.$button && e.$oldParent.$hasButtons)
            this.parentNode.$buttons.insertBefore(this.$button,
                e.$beforeNode && e.$beforeNode.$button || null);
    }, true);

    /**** Private state functions ****/

    this.$position = 0;
    this.$first = function(remove){
        if (remove) {
            this.$position -= 1;
            this.parentNode.$setStyleClass(this.$button, "",
                ["firstbtn", "firstcurbtn"]);
        }
        else {
            this.$position = this.$position | 1;
            this.parentNode.$setStyleClass(this.$button, "firstbtn"
                + (this.parentNode.$activepage == this ? " firstcurbtn" : ""));
        }
    };

    this.$last = function(remove){
        if (remove) {
            this.$position -= 2;
            this.parentNode.$setStyleClass(this.$button, "", ["lastbtn"]);
        }
        else {
            this.$position = this.$position | 2;
            this.parentNode.$setStyleClass(this.$button, "lastbtn");
        }
    };

    this.$deactivate = function(fakeOther){
        if (this.disabled)
            return false;

        this.$active = false

        if (this.parentNode.$hasButtons) {
            if (this.$position > 0)
                this.parentNode.$setStyleClass(this.$button, "", ["firstcurbtn"]);
            this.parentNode.$setStyleClass(this.$button, "", ["curbtn"]);
        }

        if ((!this.fake || this.relPage) && !fakeOther) {
            this.parentNode.$setStyleClass(this.fake
                ? this.relPage.$ext
                : this.$ext, "", ["curpage"]);
            
            //#ifdef __WITH_PROPERTY_WATCH
            this.dispatchEvent("prop.visible", {value:false});
            //#endif
        }
    };

    this.$activate = function(){
        if (this.disabled)
            return false;

        this.$active = true;

        if (!this.$drawn) {
            var f;
            this.addEventListener("DOMNodeInsertedIntoDocument", f = function(e){
                this.removeEventListener("DOMNodeInsertedIntoDocument", f);
                if (!this.$active)
                    return;
                    
                this.$activate();
            });
            return;
        }

        if (this.parentNode.$hasButtons) {
            if (this.$position > 0)
                this.parentNode.$setStyleClass(this.$button, "firstcurbtn");
            this.parentNode.$setStyleClass(this.$button, "curbtn");
        }

        if (!this.fake || this.relPage) {
            this.parentNode.$setStyleClass(this.fake
                ? this.relPage.$ext
                : this.$ext, "curpage");
            //#ifdef __WITH_LAYOUT
            if (apf.layout)
                apf.layout.forceResize(this.fake ? this.relPage.$int : this.$int);
            //#endif
        }

        // #ifdef __WITH_DELAYEDRENDER
        if (this.$render)
            this.$render();
        // #endif
        
        if (!this.fake) {
            if (apf.isIE) {
                var cls = this.$ext.className;
                this.$ext.className = "rnd" + Math.random();
                this.$ext.className = cls;
            }
            
            //#ifdef __WITH_PROPERTY_WATCH
            this.dispatchEvent("prop.visible", {value:true});
            //#endif
        }
    };

    this.addEventListener("$skinchange", function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    });

    /**** Init ****/

    this.$canLeechSkin = true;

    this.$draw = function(isSkinSwitch){
        this.skinName = this.parentNode.skinName;

        var sType = this.getAttribute("type")
        if (sType) {
            this.fake = true;
            this.relPage = this.parentNode.getPage(sType) || null;
        }

        if (this.parentNode.$hasButtons) {
            //this.parentNode.$removeEditable(); //@todo multilingual support is broken when using dom

            this.parentNode.$getNewContext("button");
            var elBtn = this.parentNode.$getLayoutNode("button");
            elBtn.setAttribute(this.parentNode.$getOption("main", "select") || "onmousedown",
                'var page = apf.lookup(' + this.$uniqueId + ');\
                 page.parentNode.set(page);\
                 page.canHaveChildren = 2;');
            elBtn.setAttribute("onmouseover", 'var o = apf.lookup('
                + this.parentNode.$uniqueId + ');if(apf.lookup(' + this.$uniqueId
                + ') != o.$activepage) o.$setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = apf.lookup('
                + this.parentNode.$uniqueId + ');\
                  o.$setStyleClass(this, "", ["over"]);\
                  var page = apf.lookup(' + this.$uniqueId + ');\
                  page.canHaveChildren = true;');

            var nameOrId = this.getAttribute("id") || this.getAttribute("name"),
                closebtn = this.getAttribute("closebtn");

            if ((closebtn == "true" || (this.parentNode.buttons == "close" && closebtn == null)) && nameOrId) {
                var btncontainer = this.parentNode.$getLayoutNode("button", "btncontainer");

                this.parentNode.$getNewContext("btnclose");
                var elBtnClose = this.parentNode.$getLayoutNode("btnclose");
                
                if (!elBtnClose)
                    return;
                    
                elBtnClose.setAttribute("onclick",
                    'var page = apf.lookup(' + this.$uniqueId + ');\
                     page.parentNode.remove(' + nameOrId + ');');
                     
                btncontainer.appendChild(elBtnClose);
            }
            
            this.$button = apf.insertHtmlNode(elBtn, this.parentNode.$buttons);

            if (!isSkinSwitch && this.nextSibling && this.nextSibling.$button)
                this.$button.parentNode.insertBefore(this.$button, this.nextSibling.$button);

            this.$button.host = this;
        }

        if (this.fake)
            return;

        if (this.$ext)
            this.$ext.parentNode.removeChild(this.$ext); //@todo mem leaks?

        this.$ext = this.parentNode.$getExternal("page",
            this.parentNode.oPages, null, this);
        this.$ext.host = this;
        
        this.$int = this.parentNode
            .$getLayoutNode("page", "container", this.$ext);
        //if (this.$int)
            //this.$int.setAttribute("id", this.$int.getAttribute("id"));
    };

    this.$loadAml = function(x){
        
    };

    this.$destroy = function(){
        if (this.$button) {
            this.$button.host = null;
            this.$button = null;
        }
    };
}).call(apf.page.prototype = new apf.Presentation());

apf.aml.setElement("page", apf.page);

// #endif