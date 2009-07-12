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
 * Baseclass of a paged element. 
 *
 * @constructor
 * @baseclass
 * @allowchild page
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 * 
 * @event beforeswitch  Fires before this element switches to another page.
 *   cancellable: Prevents the page to become active.
 *   object:
 *   {Mixed}    previous     the name or number of the current page.
 *   {Number}   previousId   the number of the current page.
 *   {jpf.page} previousPage the current page.
 *   {Mixed}    next         the name or number of the page the will become active.
 *   {Number}   nextId       the number of the page the will become active.
 *   {jpf.page} nextpage     the page the will become active.
 * @event afterswitch   Fires after this element has switched to another page.
 *   object:
 *   {Mixed}    previous     the name or number of the previous page.
 *   {Number}   previousId   the number of the previous page.
 *   {jpf.page} previousPage the previous page.
 *   {Mixed}    next         the name or number of the current page.
 *   {Number}   nextId       the number of the the current page.
 *   {jpf.page} nextpage     the the current page.   
 */
jpf.BaseTab = function(){
    this.isPaged         = true;
    this.$focussable     = jpf.KEYBOARD;
    this.canHaveChildren = true;
    this.length          = 0;

    /**
     * Sets the current page of this element.
     * @param {mixed} page the name of numer of the page which is made active.
     */
    this.set = function(page, noEvent){
        if (noEvent)
            return this.$propHandlers["activepage"].call(this, page, noEvent);
            
        return this.setProperty("activepage", page);
    }

    var inited = false,
        ready  = false,
        _self  = this;;

    /**** Properties and Attributes ****/

    this.$supportedProperties.push("activepage", "activepagenr", "length");

    /**
     * @attribute {Number} activepagenr the child number of the active page.
     * Example
     * This example uses property binding to maintain consistency between a
     * dropdown which is used as a menu, and a pages element
     * <code>
     *  <j:dropdown id="ddMenu" value="0">
     *      <j:item value="0">Home</j:item>
     *      <j:item value="1">General</j:item>
     *      <j:item value="2">Advanced</j:item>
     *  </j:dropdown>
     *
     *  <j:pages activepagenr="[ddMenu.value]">
     *      <j:page>
     *          <h1>Home Page</h1>
     *      </j:page>
     *      <j:page>
     *          <h1>General Page</h1>
     *      </j:page>
     *      <j:page>
     *          <h1>Advanced Page</h1>
     *      </j:page>
     *  </j:pages>
     * </code>
     */
    this.$propHandlers["activepagenr"] =

    /**
     * @attribute {String} activepage the name of the active page.
     * Example:
     * <code>
     *  <j:tab activepage="general">
     *      <j:page id="home">
     *          ...
     *      </j:page>
     *      <j:page id="advanced">
     *          ...
     *      </j:page>
     *      <j:page id="general">
     *          ...
     *      </j:page>
     *  </j:tab>
     * </code>
     */
    this.$propHandlers["activepage"]   = function(next, noEvent){
        if (!inited) return;

        var page, info = {};
        page = this.$findPage(next, info);

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
        
        if (!page.visible || page.disabled) {
            //#ifdef __DEBUG
            jpf.console.warn("Setting active page on page component which \
                              is not visible or disabled. Cancelling.");
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
        //#ifdef __ENABLE_TABSCROLL
        this.scrollIntoView(page);
        //#endif

        //Loader support
        if (this.hideLoader) {
            if (page.$rendered)
                this.hideLoader();
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){
                    this.parentNode.hideLoader();
                });
            }
        }

        if (!noEvent) {
            if (page.$rendered)
                this.dispatchEvent("afterswitch", oEvent);
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){
                    this.parentNode.dispatchEvent("afterswitch", oEvent);
                });
             }
        }

        return true;
    };

    /**** Public methods ****/

    /**
     * Retrieves an array of all the page elements of this element.
     */
    this.getPages = function(){
        var r = [], nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].tagName == "page")
                r.push(nodes[i]);
        }
        return r;
    };

    /**
     * Retrieves a page element by it's name or child number
     * @param {mixed} nameOrId the name or child number of the page element to retrieve.
     * @return {Page} the found page element.
     */
    this.getPage = function(nameOrId){
        return jpf.isNot(nameOrId) && this.$activepage || this.$findPage(nameOrId);
    };

    /**
     * Add a new page element
     * @param {String} [caption] the text displayed on the button of the page.
     * @param {String} [name]    the name of the page which is can be referenced by.
     * @return {page} the created page element.
     */
    this.add = function(caption, name){
        var page = jpf.document.createElement("page");
        if (name)
            page.setAttribute("id", name);
        page.setAttribute("caption", caption);
        this.appendChild(page);
        
        // #ifdef __ENABLE_TABSCROLL
        this.scrollIntoView(page);
        // #endif
        return page;
    };

    /**
     * Removes a page element from this element.
     * @param {mixed} nameOrId the name or child number of the page element to remove.
     * @return {Page} the removed page element.
     */
    this.remove = function(nameOrId){
        var page = this.$findPage(nameOrId);
        if (!page)
            return false;

        page.removeNode();
        
        // #ifdef __ENABLE_TABSCROLL
        this.setScrollerState();
        // #endif
        return page;
    };

    // #ifdef __ENABLE_TABSCROLL
    
    var SCROLLANIM = {
            scrollOn: false,
            steps   : 15,
            interval: 10,
            size    : 0,
            left    : 0
        },
        bAnimating    = false,
        scrollTimer   = null,
        keepScrolling = false,
        globalDir     = jpf.BaseTab.SCROLL_LEFT;

    function getButtonsWidth() {
        var cId = "cache_" + this.oButtons.childNodes.length;
        if (SCROLLANIM[cId])
            return SCROLLANIM[cId];

        var iWidth = 0;
        for (var i = 0, l = this.oButtons.childNodes.length; i < l; i++) {
            if (typeof this.oButtons.childNodes[i].offsetWidth != "undefined")
                iWidth += this.oButtons.childNodes[i].offsetWidth;
        }

        return SCROLLANIM[cId] = iWidth;
    }

    /**
     * Set the state scroller buttons: enabled, disabled or completely hidden,
     * depending on the state of the tab buttons
     *
     * @param {Boolean} [bOn]   Indicates whether to turn the scroll buttons on or off
     * @param {Number}  [iBtns] Specifies the buttons to set the state of. Can be SCROLL_LEFT, SCROLL_RIGHT or SCROLL_BOTH
     * @type  {void}
     */
    this.setScrollerState = function(bOn, iBtns) {
        if (!ready || !this.$hasButtons || !this.oScroller) return;

        if (typeof bOn == "undefined") {
            var scrollerWidth = this.oScroller.offsetWidth
                || parseInt(jpf.getStyle(this.oScroller, "width").replace(/(px|em|%)/, ""));
            bOn   = ((getButtonsWidth.call(this) + scrollerWidth) > this.oExt.offsetWidth);
            iBtns = jpf.BaseTab.SCROLL_BOTH;
        }

        if (iBtns & jpf.BaseTab.SCROLL_BOTH && bOn !== SCROLLANIM.scrollOn) {
            // in case of HIDING the scroller: check if the anim stuff has reverted
            SCROLLANIM.scrollOn = bOn;
            if (!bOn) {
                this.oButtons.style.left = SCROLLANIM.left + "px";
                this.oScroller.style.display = "none";
            }
            //else
            //    TODO: scroll active tab into view if it becomes hidden beneath scroller node(s)
        }
        else {
            this.oScroller.style.display = "";
        }

        this.oScroller.style.display = (iBtns & jpf.BaseTab.SCROLL_BOTH && !bOn)
            ? "none"
            : "";
        if (typeof iBtns == "undefined")
            iBtns = jpf.BaseTab.SCROLL_BOTH;
        if ((iBtns & jpf.BaseTab.SCROLL_LEFT) || (iBtns & jpf.BaseTab.SCROLL_BOTH))
            this.$setStyleClass(this.oLeftScroll, bOn ? "" : "disabled",
                bOn ? ["disabled"] : null);
        if ((iBtns & jpf.BaseTab.SCROLL_RIGHT) || (iBtns & jpf.BaseTab.SCROLL_BOTH))
            this.$setStyleClass(this.oRightScroll, bOn ? "" : "disabled",
                bOn ? ["disabled"] : null);
    };

    /**
     * Corrects the state of the scroller buttons when the state of external
     * components change, like on a resize event of a window.
     *
     * @type {void}
     */
    this.correctScrollState = function() {
        if (!ready || !this.$hasButtons || !this.oScroller) return;
        this.setScrollerState();
    };

    /**
     * Retrieves the utmost left or right boundaries of the tab buttons strip that
     * can be scrolled to. The tabs cannot scroll any further than these boundaries
     *
     * @param {Number} dir        Determines which boundary side to look at; SCROLL_LEFT or SCROLL_RIGHT
     * @param {Boolan} [useCache] Used only when tabs are draggable. Not implemented.
     * @type  {Number}
     */
    function getAnimationBoundary(dir, useCache) {
        if (SCROLLANIM.size <= 0) {
            SCROLLANIM.left = this.oButtons.offsetLeft;
            SCROLLANIM.size = Math.round(this.firstChild.oButton.offsetWidth);
        }
        if (dir & jpf.BaseTab.SCROLL_LEFT) {
            return SCROLLANIM.left;
        }
        else if (dir & jpf.BaseTab.SCROLL_RIGHT) {
            // TODO: support Drag n Drop of tabs...
            //if (typeof useCache == "undefined") useCache = false;
            //if (!tabcontrol.drag) tabcontrol.drag = {};
            //if (useCache && tabcontrol.drag.boundCache)
            //    return tabcontrol.drag.boundCache;
            var oNode = this.oButtons.childNodes[this.oButtons.childNodes.length - 1];

            return this.oExt.offsetWidth - (oNode.offsetLeft + oNode.offsetWidth
                + (this.oScroller.offsetWidth + 4));// used to be tabcontrol.drag.boundCache;
        }
    }

    /**
     * Event handler; executed when the user pressed one of the two scroll buttons
     * (left or right one). If the tab-buttons strip may/ can be scrolled, the
     * respective behavior is called.
     *
     * @param {Event}  e   Event object, usually a mousedown event from a scroller-button
     * @param {Number} dir Direction to scroll; SCROLL_LEFT or SCROLL_RIGHT
     * @type  {void}
     */
    this.scroll = function(e, dir) {
        if (!ready || !this.$hasButtons || !this.oScroller) return;
        if (!e)
            e = window.event;
        if (typeof e["type"] == "unknown") //scope expired (prolly GC'ed)
            e = {type: "click"};
        if (bAnimating && e.type != "dblclick") return;
        bAnimating = true;

        if (typeof dir == "undefined")
            dir = jpf.BaseTab.SCROLL_LEFT;

        jpf.tween.clearQueue(this.oButtons, true);
        var iCurrentLeft = this.oButtons.offsetLeft;

        //get maximum left offset for either direction
        var iBoundary = getAnimationBoundary.call(this, dir);
        if (dir & jpf.BaseTab.SCROLL_LEFT) {
            if (iCurrentLeft === iBoundary) {
                this.setScrollerState(bAnimating = false, jpf.BaseTab.SCROLL_LEFT);
                return jpf.tween.single(this.oButtons, {
                    steps   : SCROLLANIM.steps,
                    interval: 20,
                    from    : iCurrentLeft,
                    to      : iCurrentLeft + 12,
                    type    : "left",
                    anim    : jpf.tween.EASEOUT,
                    onfinish: function(oNode) {
                        jpf.tween.single(oNode, {
                            steps   : SCROLLANIM.steps,
                            interval: SCROLLANIM.interval,
                            from    : iCurrentLeft + 12,
                            to      : iCurrentLeft,
                            type    : "left",
                            anim    : jpf.tween.EASEIN
                        });
                    }
                });
            }
            //one scroll animation scrolls by a SCROLLANIM.size px.
            var iTargetLeft = iCurrentLeft + (e.type == "dblclick"
                ? SCROLLANIM.size * 3
                : SCROLLANIM.size);
            if (iTargetLeft > iBoundary)
                iTargetLeft = iBoundary;

            if (iTargetLeft === iBoundary)
                this.setScrollerState(false, jpf.BaseTab.SCROLL_LEFT);
            this.setScrollerState(true, jpf.BaseTab.SCROLL_RIGHT);

            //start animated scroll to the left
            jpf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : jpf.tween.NORMAL,
                onfinish: function() {
                    bAnimating = false;
                    if (keepScrolling)
                        _self.scroll(e, globalDir);
                }
            });
        }
        else if (dir & jpf.BaseTab.SCROLL_RIGHT) {
            this.setScrollerState(true);
            if (iCurrentLeft === iBoundary) {
                _self.setScrollerState(bAnimating = false, jpf.BaseTab.SCROLL_RIGHT);
                return jpf.tween.single(this.oButtons, {
                    steps   : SCROLLANIM.steps,
                    interval: 20,
                    from    : iCurrentLeft,
                    to      : iCurrentLeft - 24,
                    type: "left",
                    anim: jpf.tween.EASEOUT,
                    onfinish: function(oNode, options) {
                        jpf.tween.single(oNode, {
                            steps   : SCROLLANIM.steps,
                            interval: SCROLLANIM.interval,
                            from    : iCurrentLeft - 24,
                            to      : iCurrentLeft,
                            type    : "left",
                            anim    : jpf.tween.EASEIN
                        });
                    }
                });
            }
            //one scroll animation scrolls by a SCROLLANIM.size px.
            var iTargetLeft = iCurrentLeft - (e.type == "dblclick"
                ? SCROLLANIM.size * 3
                : SCROLLANIM.size);
            //make sure we don't scroll more to the right than the
            //maximum left:
            if (iTargetLeft < iBoundary)
                iTargetLeft = iBoundary;
            //start animated scroll to the right
            jpf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : jpf.tween.NORMAL,
                onfinish: function() {
                    bAnimating = false;
                    if (keepScrolling)
                        _self.scroll(e, globalDir);
                }
            });
        }
    };

    /**
     * If a tabpage is outside of the users' view, this function scrolls that
     * tabpage into view smoothly.
     *
     * @param {j:page} oPage The page to scroll into view
     * @type  {void}
     */
    this.scrollIntoView = function(oPage) {
        bAnimating = false;
        if (!ready || !this.$hasButtons || !this.oScroller)
            return;
        bAnimating = true;
        if (this.oButtons.offsetWidth < this.oExt.offsetWidth)
            return this.setScrollerState(false);

        var iTabLeft     = oPage.oButton.offsetLeft,
            iTabWidth    = oPage.oButton.offsetWidth,
            iCurrentLeft = this.oButtons.offsetLeft;

        if (SCROLLANIM.size <= 0) {
            SCROLLANIM.left = this.oButtons.offsetLeft;
            SCROLLANIM.size = Math.round(this.firstChild.oButton.offsetWidth);
        }
        this.oButtons.style.left = iCurrentLeft;

        var iRealWidth  = this.oExt.offsetWidth,
            iScrollCorr = this.oScroller.offsetWidth + 4,
            iTargetLeft = null;

        if ((iTabLeft + iTabWidth) > ((iRealWidth - iScrollCorr) - iCurrentLeft)) //scroll to the right
            iTargetLeft = (-(iTabLeft - SCROLLANIM.left)
                + (iRealWidth - iTabWidth - iScrollCorr));
        else if ((iCurrentLeft + iTabLeft) < SCROLLANIM.left) //sroll to the left
            iTargetLeft = SCROLLANIM.left - iTabLeft;

        if (iTargetLeft !== null) {
            this.setScrollerState(true);
            jpf.tween.clearQueue(this.oButtons, true);

            jpf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : jpf.tween.NORMAL,
                onfinish: function() { bAnimating = false; }
            });
        }
        else
            bAnimating = false;
    };

    // #endif

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
                // #ifdef __ENABLE_TABSCROLL
                this.setScrollerState();
                // #endif
                this.$activepage  =
                this.activepage   =
                this.activepagenr = null;
            }
        }
        // #ifdef __ENABLE_TABSCROLL
        else
            this.setScrollerState();
        // #endif
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("length", this.childNodes.length);
        //#endif
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
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("length", this.childNodes.length);
        //#endif
    });

    /**** Private state handling functions ****/

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
    };

    this.$enable = function(){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].enable)
                nodes[i].enable();
        }
    };

    this.$disable = function(){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (nodes[i].disable)
                nodes[i].disable();
        }
    };

    /**** Keyboard support ****/

    // #ifdef __WITH_KEYBOARD

    this.addEventListener("keydown", function(e){
        if (!this.$hasButtons)
            return;

        var key = e.keyCode,
            pages, prevPage, nextPage;

        switch (key) {
            case 9:
                break;
            case 13:
                break;
            case 32:
                break;
            case 37: //LEFT
                pages = this.getPages();
                prevPage = this.activepagenr - 1;
                while (prevPage >= 0 && !pages[prevPage].visible)
                    prevPage--;

                if (prevPage >= 0)
                    this.setProperty("activepage", prevPage);
                break;
            case 39: //RIGHT
                pages = this.getPages();
                nextPage = this.activepagenr + 1;
                while (nextPage < pages.length && !pages[nextPage].visible)
                    nextPage++;

                if (nextPage < pages.length)
                    this.setProperty("activepage", nextPage);
                break;
            default:
                return;
        }
        //return false;
    }, true);

    // #endif

    /**** Init ****/

    this.implement(jpf.Presentation); /** @inherits jpf.Presentation */

    // #ifdef __WITH_EDITMODE
    this.editableParts = {"button" : [["caption", "@caption"]]};
    // #endif

    this.$loadChildren = function(callback){
        var page = false, f = false, i;

        inited = true;

        if (this.$hasButtons) {
            this.oButtons = this.$getLayoutNode("main", "buttons", this.oExt);
            this.oButtons.setAttribute("id", this.uniqueId + "_buttons");
        }

        this.oPages = this.$getLayoutNode("main", "pages", this.oExt);
        
        // #ifdef __ENABLE_TABSCROLL
        // add scroller node(s)
        this.oScroller = this.$getLayoutNode("main", "scroller", this.oPages);
        if (this.oScroller) {
            function startTimer(e, dir) {
                stopTimer();
                globalDir   = dir;
                scrollTimer = setTimeout(function() {
                    keepScrolling = true;
                    _self.scroll(e, dir);
                }, 500);
            }
            function stopTimer() {
                clearTimeout(scrollTimer);
                keepScrolling = false;
            }

            this.oScroller.onmouseout = function(e) {
                e = e || window.event;
                var el = e.target || e.srcElement;
                if (el == _self.oLeftScroll || el == _self.oRightScroll)
                    return;
                stopTimer();
            };

            this.oLeftScroll  = jpf.getNode(this.oScroller, [0]);
            this.oRightScroll = jpf.getNode(this.oScroller, [1]);
            
            ["oLeftScroll", "oRightScroll"].forEach(function(sBtn) {
                var dir = jpf.BaseTab[sBtn == "oLeftScroll" 
                    ? "SCROLL_LEFT"
                    : "SCROLL_RIGHT"];
                _self[sBtn].onmousedown =
                _self[sBtn].ondblclick  = function(e) {
                    if (this.className.indexOf("disabled") == -1) {
                        e = e || event;
                        _self.$setStyleClass(this, "down");
                        _self.scroll(e, dir);
                        startTimer(e, dir);
                    }
                    if (!jpf.isSafariOld)
                        this.onmouseout();
                };
                _self[sBtn].onmouseover = function() {
                    if (!this.disabled) {
                        globalDir = dir;
                        _self.$setStyleClass(this, "hover");
                    }
                };
                _self[sBtn].onmouseout = function() {
                    if (!this.disabled)
                        _self.$setStyleClass(this, "", ["hover"]);
                };
                _self[sBtn].onmouseup = function() {
                    _self.$setStyleClass(this, "", ["down"]);
                    stopTimer();
                };
            });
        }
        
        jpf.layout.setRules(this.oExt, this.uniqueId + "_tabscroller",
            "jpf.all[" + this.uniqueId + "].correctScrollState()");
        // #endif

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
            if (this.childNodes.length) {
                ready = true;
                // #ifdef __ENABLE_TABSCROLL
                this.setScrollerState();
                // #endif
                return;
            }

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
                else if(tagName == "comment"){
                    //ignore
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

        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("length", this.childNodes.length);
        //#endif

        ready = true;
        // #ifdef __ENABLE_TABSCROLL
        window.setTimeout(function() {
            _self.setScrollerState();
        }, 0);
        // #endif
    };
    
    this.$destroy = function(bSkinChange) {
        if (bSkinChange || !this.oScroller)
            return;
        // #ifdef __ENABLE_TABSCROLL
        jpf.layout.removeRule(this.oExt, this.uniqueId + "_tabscroller");
        
        [this.oLeftScroll, this.oRightScroll].forEach(function(oBtn) {
            oBtn.onmousedown = oBtn.ondblclick = oBtn.onmouseover = 
            oBtn.onmouseout  = oBtn.onmouseup  = null;
        });
        // #endif
    };
};

// #ifdef __ENABLE_TABSCROLL
jpf.BaseTab.SCROLL_LEFT  = 0x0001;
jpf.BaseTab.SCROLL_RIGHT = 0x0002;
jpf.BaseTab.SCROLL_BOTH  = 0x0004;
// #endif

/**
 * A page in a pageable element. (i.e. a page in {@link element.tab})
 *
 * @constructor
 * @define  page
 * @allowchild  {elements}, {anyjml}
 * @addnode elements
 *
 * @inherits jpf.DelayedRender
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.page = jpf.component(jpf.NODE_HIDDEN, function(){
    this.visible         = true;
    this.canHaveChildren = true;
    this.$focussable     = false;

    // #ifdef __WITH_EDITMODE
    this.editableParts = {"button" : [["caption", "@caption"]]};
    // #endif

    //#ifdef __WITH_CONVENIENCE_API
    /**
     * Sets the caption of the button of this element.
     * @param {String} caption the text displayed on the button of this element.
     */
    this.setCaption = function(caption){
        this.setProperty("caption", caption);
    };

    /**
     * Sets the icon of the button of this element.
     * @param {String} icon the icon displayed on the button of this element.
     */
    this.setIcon = function(icon) {
        this.setProperty("icon", icon);
    }
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
    this.$supportedProperties.push("fake", "caption", "icon", "type");

    /**
     * @attribute {String} caption the text displayed on the button of this element.
     */
    this.$propHandlers["caption"] = function(value){
        if (!this.parentNode)
            return;

        var node = this.parentNode
            .$getLayoutNode("button", "caption", this.oButton);

        if (node.nodeType == 1)
            node.innerHTML = value;
        else
            node.nodeValue = value;
    };

    this.$propHandlers["icon"] = function(value) {
        if (!this.parentNode)
            return;

        var node = this.parentNode
            .$getLayoutNode("button", "icon", this.oButton);

        if (node && node.nodeType == 1)
            jpf.skins.setIcon(node, value, this.parentNode.iconPath);
    };

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
    };

    /**
     * @attribute {Boolean} fake whether this page actually contains elements or
     * only provides a button in the pageable parent element.
     */
    this.$propHandlers["fake"] = function(value){
        if (this.oExt) {
            jpf.removeNode(this.oExt);
            this.oInt = this.oExt = null;
        }
    };

    this.$propHandlers["type"] = function(value) {
        this.setProperty("fake", true);
        this.relPage = this.parentNode.getPage(value);
        if (this.$active)
            this.$activate();
    };

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
    };

    this.$last = function(remove){
        if (remove) {
            position -= 2;
            this.parentNode.$setStyleClass(this.oButton, "", ["lastbtn"]);
        }
        else {
            position = position | 2;
            this.parentNode.$setStyleClass(this.oButton, "lastbtn");
        }
    };

    this.$deactivate = function(fakeOther){
        if (this.disabled)
            return false;

        this.$active = false

        if (this.parentNode.$hasButtons) {
            if (position > 0)
                this.parentNode.$setStyleClass(this.oButton, "", ["firstcurbtn"]);
            this.parentNode.$setStyleClass(this.oButton, "", ["curbtn"]);
        }

        if ((!this.fake || this.relPage) && !fakeOther) {
            this.parentNode.$setStyleClass(this.fake
                ? this.relPage.oExt
                : this.oExt, "", ["curpage"]);
            
            //#ifdef __WITH_PROPERTY_WATCH
            this.dispatchWatch("visible", false);
            //#endif
        }
    };

    this.$activate = function(){
        if (this.disabled)
            return false;

        if (this.parentNode.$hasButtons) {
            if (position > 0)
                this.parentNode.$setStyleClass(this.oButton, "firstcurbtn");
            this.parentNode.$setStyleClass(this.oButton, "curbtn");
        }

        if (!this.fake || this.relPage) {
            this.parentNode.$setStyleClass(this.fake
                ? this.relPage.oExt
                : this.oExt, "curpage");

            if (jpf.layout)
                jpf.layout.forceResize(this.fake ? this.relPage.oInt : this.oInt);
        }

        this.$active = true;

        // #ifdef __WITH_DELAYEDRENDER
        this.$render();
        // #endif
        
        if (!this.fake) {
            if (jpf.isIE) {
                var cls = this.oExt.className;
                this.oExt.className = "rnd" + Math.random();
                this.oExt.className = cls;
            }
            
            //#ifdef __WITH_PROPERTY_WATCH
            this.dispatchWatch("visible", true);
            //#endif
        }
    };

    this.$skinchange = function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    };

    /**** Init ****/

    this.$draw = function(isSkinSwitch){
        this.skinName = this.parentNode.skinName;

        var sType = this.$jml.getAttribute("type")
        if (sType) {
            this.fake = true;
            this.relPage = this.parentNode.getPage(sType) || null;
        }

        if (this.parentNode.$hasButtons) {
            //this.parentNode.$removeEditable(); //@todo multilingual support is broken when using dom

            this.parentNode.$getNewContext("button");
            var elBtn = this.parentNode.$getLayoutNode("button");
            elBtn.setAttribute(this.parentNode.$getOption("main", "select") || "onmousedown",
                'var page = jpf.lookup(' + this.uniqueId + ');\
                 jpf.lookup(' + this.parentNode.uniqueId + ').set(page);\
                 page.canHaveChildren = 2;');
            elBtn.setAttribute("onmouseover", 'var o = jpf.lookup('
                + this.parentNode.uniqueId + ');if(jpf.lookup(' + this.uniqueId
                + ') != o.$activepage) o.$setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = jpf.lookup('
                + this.parentNode.uniqueId + ');\
                  o.$setStyleClass(this, "", ["over"]);\
                  var page = jpf.lookup(' + this.uniqueId + ');\
                  page.canHaveChildren = true;');
            this.oButton = jpf.xmldb.htmlImport(elBtn, this.parentNode.oButtons);

            if (!isSkinSwitch && this.nextSibling && this.nextSibling.oButton)
                this.oButton.parentNode.insertBefore(this.oButton, this.nextSibling.oButton);

            this.oButton.host = this;
        }

        if (this.fake)
            return;

        if (this.oExt)
            this.oExt.parentNode.removeChild(this.oExt); //@todo mem leaks?

        this.oExt = this.parentNode.$getExternal("page",
            this.parentNode.oPages, null, this.$jml);
        this.oExt.host = this;
    };

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
    };

    this.$destroy = function(){
        if (this.oButton) {
            this.oButton.host = null;
            this.oButton = null;
        }
    };
}).implement(
    // #ifdef __WITH_DELAYEDRENDER
    jpf.DelayedRender
    // #endif
);

// #endif
