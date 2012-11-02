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
 * A page in a pageable element (_i.e._ a page in {@link apf.tab}).
 *
 * #### Example
 * 
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 *  <!-- startcontent -->
 *  <a:window 
 *    visible = "true" 
 *    width   = "400" 
 *    height  = "150" 
 *    title   = "Simple Tab" >
 *      <a:tab anchors="10 10 10 10"> 
 *          <a:page caption="General"> 
 *              <a:checkbox>Example</a:checkbox> 
 *              <a:button>Example</a:button> 
 *          </a:page> 
 *          <a:page caption="Advanced"> 
 *              <a:checkbox>Test checkbox</a:checkbox> 
 *              <a:checkbox>Test checkbox</a:checkbox> 
 *              <a:checkbox>Test checkbox</a:checkbox> 
 *          </a:page> 
 *          <a:page caption="Ajax.org"> 
 *              <a:checkbox>This ok?</a:checkbox> 
 *              <a:checkbox>This better?</a:checkbox> 
 *          </a:page> 
 *      </a:tab> 
 *  </a:window>
 *  <!-- endcontent -->
 * </a:application>
 * ```
 * 
 * @class apf.page
 * @define  page
 * @container
 * @inherits apf.Presentation
 * @allowchild  {elements}, {anyaml}
 *
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.page = function(struct, tagName){
    this.$init(tagName || "page", apf.NODE_VISIBLE, struct);
};

(function(){
    this.canHaveChildren = true;
    //#ifdef __WITH_CONTENTEDITABLE
    //this.$canEdit        = false;
    //#endif
    this.$focussable     = false;
    this.closebtn        = false;
    this.autofocus       = true;

    //#ifdef __WITH_CONTENTEDITABLE
    this.$getEditableCaption = function(){
        if (!this.parentNode.$hasButtons)
            return false;

        return [this.parentNode.$getLayoutNode("button", "caption", this.$button), "caption"];
    };
    //#endif

    //#ifdef __WITH_CONVENIENCE_API
    /**
     * Sets the caption of the button of this element.
     * @param {String} caption The text displayed on the button of this element.
     */
    this.setCaption = function(caption){
        this.setProperty("caption", caption, false, true);
    };

    /**
     * Sets the icon of the button of this element.
     * @param {String} icon The icon displayed on the button of this element.
     */
    this.setIcon = function(icon) {
        this.setProperty("icon", icon, false, true);
    };
    //#endif

    // *** Delayed Render Support *** //

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

    // *** Properties *** //

    this.$booleanProperties["visible"]  = true;
    this.$booleanProperties["fake"]     = true;
    this.$booleanProperties["closebtn"] = true;
    this.$booleanProperties["autofocus"] = true;
    this.$supportedProperties.push("fake", "caption", "icon", "tooltip",
        "type", "buttons", "closebtn", "trans-in", "trans-out", "autofocus");

    //#ifdef __ENABLE_TAB_CLOSEBTN
    /**
     * @attribute {Boolean} closebtn Sets or gets whether this page's button shows a close button inside it.
     */
    this.$propHandlers["closebtn"] = function(value){
        //if (!this.$amlLoaded || !this.parentNode.$hasButtons)
          //  return;
        var _self = this;
        
        if (value) {
            var btncontainer = this.parentNode.$getLayoutNode("button", "container", this.$button);
            
            this.parentNode.$getNewContext("btnclose");
            var elBtnClose = this.parentNode.$getLayoutNode("btnclose");

            if (elBtnClose) {
               // if(elBtnClose.nodeType == 1) {
                apf.setStyleClass(this.$button, "btnclose");
                
                elBtnClose.addEventListener("mousedown", function(e){
                    apf.cancelBubble(e, apf.lookup(_self.$uniqueId));
                }, false);
                
                elBtnClose.addEventListener("click", function(e){
                    var page = apf.lookup(_self.$uniqueId);
                     page.parentNode.remove(page, e);
                }, false);

                btncontainer.appendChild(elBtnClose);
            }
            //#ifdef __DEBUG
            else {
                apf.console.warn("Missing close button in tab skin");
            }
            //#endif
        }
    };
    //#endif

    /**
     * @attribute {String} caption Sets or gets the text displayed on the button of this element.
     */
    this.$propHandlers["tooltip"] = function(value){
        if (!this.parentNode)
            return;

        var node = this.parentNode
            .$getLayoutNode("button", "caption", this.$button);

        (node.nodeType == 1 ? node : node.parentNode).setAttribute("title", value || "");
    }

    /**
     * @attribute {String} caption Sets or gets the text displayed on the button of this element.
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
            if (this.$fake) {
                this.parentNode.set(this.$fake); 
                this.visible = false;
                return;
            }
            
            this.$ext.style.display = "";
            if (this.parentNode.$hasButtons)
                this.$button.style.display = "block";

            if (!this.parentNode.$activepage)
                this.parentNode.set(this);
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
     * @attribute {Boolean} fake Sets or gets whether this page actually contains elements or
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
        
        if (this.relPage && this.$active)
            this.relPage.$deactivate();
        
        this.relPage = this.parentNode.getPage(value);
        if (this.$active)
            this.$activate();
    };

    // *** DOM Hooks *** //

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

            if (this.parentNode && this.parentNode.$activepage == this) {
                if (this.$button)
                    this.parentNode.$setStyleClass(this.$button, "", ["curbtn"]);
                this.parentNode.$setStyleClass(this.$ext, "", ["curpage"]);
            }
        }
    });
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        if (this.fake && this.parentNode.$activepage == this)
            this.$deactivate();
    });

    this.addEventListener("DOMNodeInserted", function(e){
        if (e && e.currentTarget != this || !this.$amlLoaded) //|| !e.$oldParent
            return;
            
        if (!e.$isMoveWithinParent 
          && this.skinName != this.parentNode.skinName) {
            this.$destroy(); //clean up button
        }
        else if (this.$button && (!e.$oldParent || e.$oldParent.$hasButtons) && this.parentNode.$buttons)
            this.parentNode.$buttons.insertBefore(this.$button,
                e.$beforeNode && e.$beforeNode.$button || null);
    }, true);

    // *** Private state functions *** //

    this.$position = 0;
    this.$first = function(remove){
        if (remove) {
            this.$isFirst  = false;
            this.$position -= 1;
            this.parentNode.$setStyleClass(this.$button, "",
                ["firstbtn", "firstcurbtn"]);
        }
        else {
            this.$isFirst  = true;
            this.$position = this.$position | 1;
            this.parentNode.$setStyleClass(this.$button, "firstbtn"
                + (this.parentNode.$activepage == this ? " firstcurbtn" : ""));
        }
    };

    this.$last = function(remove){
        if (remove) {
            this.$isLast   = false;
            this.$position -= 2;
            this.parentNode.$setStyleClass(this.$button, "", ["lastbtn"]);
        }
        else {
            this.$isLast   = true;
            this.$position = this.$position | 2;
            this.parentNode.$setStyleClass(this.$button, "lastbtn");
        }
    };

    this.$deactivate = function(fakeOther){
        this.$active = false;

        if (!this.parentNode)
            return;

        if (this.parentNode.$hasButtons) {
            if (this.$position > 0)
                this.parentNode.$setStyleClass(this.$button, "", ["firstcurbtn"]);
            this.parentNode.$setStyleClass(this.$button, "", ["curbtn"]);
        }

        if ((!this.fake || this.relPage) && !fakeOther) {
            this.parentNode.$setStyleClass(this.fake
                ? this.relPage.$ext
                : this.$ext, "", ["curpage"]);
            
            if (this.fake) {
                if (!this.relPage.visible)
                    this.relPage.$ext.style.display = "none";
                    
                this.relPage.dispatchEvent("prop.visible", {value:false});
            }
            
            this.dispatchEvent("prop.visible", {value:false});
        }
    };
    
    this.$deactivateButton = function() {
        if (this.parentNode && this.parentNode.$hasButtons) {
            if (this.$position > 0)
                this.parentNode.$setStyleClass(this.$button, "", ["firstcurbtn"]);
            this.parentNode.$setStyleClass(this.$button, "", ["curbtn"]);
        }
    };

    this.$activate = function(){
        //if (this.disabled)
            //return false;

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
            if (this.$isFirst)
                this.parentNode.$setStyleClass(this.$button, "firstcurbtn");
            this.parentNode.$setStyleClass(this.$button, "curbtn");
        }

        if (!this.fake || this.relPage) {
            if (this.fake) {
                if (this.relPage) {
                    this.relPage.$ext.style.display = "";
                    this.parentNode.$setStyleClass(this.relPage.$ext, "curpage");
                    this.relPage.$fake = this;

                    // #ifdef __WITH_DELAYEDRENDER
                    if (this.relPage.$render)
                        this.relPage.$render();
                    // #endif
                    
                    this.relPage.dispatchEvent("prop.visible", {value:true});
                }
            }
            else {
                this.parentNode.$setStyleClass(this.$ext, "curpage");
            }
            
            //#ifdef __WITH_LAYOUT
            if (apf.layout && this.relPage)
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
            
            this.dispatchEvent("prop.visible", {value:true});
        }
    };
    
    this.$activateButton = function() {
        if (this.$active)
            return;

        if (!this.$drawn) {
            var f;
            this.addEventListener("DOMNodeInsertedIntoDocument", f = function(e){
                this.removeEventListener("DOMNodeInsertedIntoDocument", f);
                this.$activateButton();
            });
            return;
        }
        
        if (this.parentNode && this.parentNode.$hasButtons) {
            if (this.$isFirst)
                this.parentNode.$setStyleClass(this.$button, "firstcurbtn");
            this.parentNode.$setStyleClass(this.$button, "curbtn");
        }
        
        // #ifdef __WITH_DELAYEDRENDER
        if (this.$render)
            this.$render();
        // #endif
    };

    this.addEventListener("$skinchange", function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    });

    this.$enable = function(){
        if (this.$button)
            this.$setStyleClass(this.$button, null, ["btnDisabled"]);//@todo this.$baseCSSname + 
    };

    this.$disable = function(){
        if (this.$button)
            this.$setStyleClass(this.$button, "btnDisabled");//@todo this.$baseCSSname + 
    };
    
    function $btnSet(oHtml){
        this.parentNode.set(this);
        if (this.autofocus)
            this.canHaveChildren = 2;
        this.$setStyleClass(oHtml, "down", null, true);
    }
    
    this.$btnControl = {};
    this.$btnDown = function(oHtml, htmlEvent){
        if (this.disabled) 
            return;
            
        if (htmlEvent.button == 2 && this.parentNode.contextmenu) {
            this.parentNode.contextPage = this;
            return;
        }
        
        if (this.parentNode.dispatchEvent("tabselectclick", {
            page: this,
            htmlEvent: htmlEvent
        }) === false)
            return;
        
        this.$btnPressed = true;
        
        //if (!this.parentNode.$order)
            $btnSet.call(this, oHtml);
        //#ifdef __ENABLE_TAB_ORDER
        //@todo vertically stacked buttons
        //else
        if (this.parentNode.$order && this.parentNode.getPages().length > 1) {
            if (this.$btnControl[this.$uniqueId])
                return;
            
            this.$dragging = true;
            
            var pos = apf.getAbsolutePosition(this.$button, this.parentNode.$ext);
            var start = htmlEvent.clientX;
            var x = start - pos[0];
            var t = apf.getAbsolutePosition(this.$button)[1];
            
            var div = oHtml.cloneNode(true);
            div.style.opacity = 0;
            
            oHtml.style.left = (oHtml.offsetLeft) + "px";
            oHtml.style.top = (oHtml.offsetTop) + "px";
            oHtml.style.width = (oHtml.offsetWidth - apf.getWidthDiff(oHtml)) + "px";
            oHtml.style.position = "absolute";
            
            this.$button.parentNode.insertBefore(div, this.$button);
            
            var marginWidth = Math.abs(apf.getMargin(div)[0]);
            
            var mUp, mMove, _self = this, started;
            apf.addListener(document, "mousemove", mMove = function(e){
                if (!e) e = event;
                
                if (!started) {
                    if (Math.abs(start - e.clientX) < 3)
                        return;
                    started = true;
                    
                    oHtml.style.zIndex = 1;
                }
                
                oHtml.style.left = "-2000px";
                
                var el = document.elementFromPoint(e.clientX, t + 1);
                var aml = el && apf.findHost(el);
                
                oHtml.style.left = (e.clientX - x) + "px";
                
                if (aml && aml.localName == "page") {
                    aml.$button.style.position = "relative";

                    var obj, onRight = div.offsetLeft > aml.$button.offsetLeft;
                    
                    var pos = apf.getAbsolutePosition(aml.$button);
                    if (onRight && aml.$button.offsetWidth - e.clientX + pos[0] < marginWidth)
                        return;
                        
                    if (obj = _self.$btnControl[aml.$uniqueId]) {
                        if (obj.onRight != onRight)
                            obj.stop();
                        else 
                            return;
                    }
                    
                    _self.$btnControl[aml.$uniqueId] = {onRight: onRight};
                    
                    var newPosition = _self.$lastPosition = onRight
                        ? aml.$button
                        : aml.$button.nextSibling;
                    _self.$lastLeft = aml.$button.offsetLeft;
                    
                    apf.tween.single(aml.$button, {
                        steps   : 20,
                        interval: 10,
                        from    : 0,
                        to      : onRight
                            ? aml.$button.offsetWidth - marginWidth
                            : -1 * (aml.$button.offsetWidth - marginWidth),
                        type    : "left",
                        anim    : apf.tween.easeInOutCubic,
                        control : _self.$btnControl[aml.$uniqueId],
                        onstop  : function(){
                            
                        },
                        onfinish : function(){
                            aml.$button.style.left     = 
                            aml.$button.style.position = "";
                            
                            delete _self.$btnControl[aml.$uniqueId];
                            
                            if (div && div.parentNode)
                                div.parentNode.insertBefore(div, newPosition);
                            
                            _self.$lastPosition =
                            _self.$lastLeft     = undefined;
                        }
                    });
                }
            });

            apf.addListener(document, "mouseup", mUp = function(e){
                if (!e) e = event;
                
                var aml = _self.$lastPosition !== null
                    ? apf.findHost(_self.$lastPosition || div.nextSibling)
                    : null;
                if (started && aml != _self.nextSibling) {
                    apf.tween.single(_self.$button, {
                        steps   : 20,
                        interval: 10,
                        from    : _self.$button.offsetLeft,
                        to      : _self.$lastLeft || div.offsetLeft,
                        type    : "left",
                        control : _self.$btnControl[_self.$uniqueId] = {},
                        anim    : apf.tween.easeInOutCubic,
                        onstop  : function(){
                            
                        },
                        onfinish : function(){
                            oHtml.style.position = 
                            oHtml.style.zIndex   = 
                            oHtml.style.top      = 
                            oHtml.style.width    =
                            oHtml.style.left     = "";
                            
                            var reorder = _self.nextSibling != aml;
                            var lastNode;
                            if (!(lastNode = apf.findHost(_self.$button.nextSibling)) || lastNode === _self.parentNode.lastChild)
                                _self.parentNode.appendChild(_self);
                            else
                                _self.parentNode.insertBefore(_self, aml);
                            div.parentNode.removeChild(div);
                            if (reorder) {
                                _self.parentNode.dispatchEvent("reorder", {
                                    page: _self.localName != "page"
                                        ? _self.parentNode.$activepage
                                        : _self
                                });
                            }
                            
                            delete _self.$btnControl[_self.$uniqueId];
                        }
                    });
                }
                else {
                    oHtml.style.position = 
                    oHtml.style.zIndex   = 
                    oHtml.style.top      = 
                    oHtml.style.width    =
                    oHtml.style.left     = "";
                    
                    div.parentNode.removeChild(div);
                }
                
                apf.removeListener(document, "mouseup", mUp);
                apf.removeListener(document, "mousemove", mMove);
            });
        }
        //#endif
    }
    
    this.$btnUp = function(oHtml){
        this.parentNode.$setStyleClass(oHtml, "", ["down"], true);
        
        if (this.disabled) 
            return;
        
        if (false && this.parentNode.$order && this.$btnPressed) {
            this.$dragging = false;
            
            $btnSet.call(this, oHtml);
        }
        
        this.$btnPressed = false;
        
        this.parentNode.dispatchEvent("tabselectmouseup");
    }
    
    this.$btnOut = function(oHtml){
        this.parentNode.$setStyleClass(oHtml, "", ["over"], true);
        
        this.canHaveChildren = true;
        this.$dragging       = false;
        this.$btnPressed     = false;
    }

    // *** Init *** //

    this.$canLeechSkin = true;
    
    this.addEventListener("prop.class", function(e){
        apf.setStyleClass(this.$button, e.value, this.$lastClassValueBtn ? [this.$lastClassValueBtn] : null);
        this.$lastClassValueBtn = e.value;
    });
    
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
                'apf.lookup(' + this.$uniqueId + ').$btnDown(this, event);');
            elBtn.setAttribute("onmouseup", 
                'apf.lookup(' + this.$uniqueId + ').$btnUp(this)');
            elBtn.setAttribute("onmouseover", 'var o = apf.lookup('
                + this.$uniqueId + ').parentNode;if(apf.lookup(' + this.$uniqueId
                + ') != o.$activepage'  + (this.parentNode.overactivetab ? " || true" : "")  + ') o.$setStyleClass(this, "over", null, true);');
            elBtn.setAttribute("onmouseout", 'var o = apf.lookup('
                + this.$uniqueId + ');o&&o.$btnOut(this, event);');

            //var cssClass = this.getAttribute("class");
            //if (cssClass) {
            //    apf.setStyleClass(elBtn, cssClass);
            //    this.$lastClassValueBtn = cssClass;
            //}

            this.$button = apf.insertHtmlNode(elBtn, this.parentNode.$buttons);
            
            var closebtn = this.closebtn = this.getAttribute("closebtn");
            if ((apf.isTrue(closebtn) || ((this.parentNode.buttons || "").indexOf("close") > -1 && !apf.isFalse(closebtn))))
                this.$propHandlers["closebtn"].call(this, true);
            
            //#ifdef __ENABLE_TAB_SCALE
//            if (this.parentNode.$scale) {
//                var w = apf.getHtmlInnerWidth(this.parentNode.$buttons);
//                var l = this.parentNode.getPages().length;
//                this.$button.style.width = Math.round(Math.min(w/l, this.parentNode.$maxBtnWidth)) + "px";
//            }
            //#endif

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

        //@todo this doesnt support hidden nodes.
        if (this.$isLast)
            this.$last();
        if (this.$isFirst)
            this.$first();
    };

    this.$destroy = function(){
        if (this.$button) {
            if (this.parentNode && !this.parentNode.$amlDestroyed
              && this.$button.parentNode)
                this.$button.parentNode.removeChild(this.$button);
            
            this.$button.host = null;
            this.$button = null;
        }
    };
    
    // #ifdef __ENABLE_UIRECORDER_HOOK
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $button : this.$button
            }
        }

        return this.$activeElements;
    }
    //#endif
}).call(apf.page.prototype = new apf.Presentation());

apf.aml.setElement("page", apf.page);

// #endif
