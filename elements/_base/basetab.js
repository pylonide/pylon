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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 * 
 * @event beforeswitch  Fires before this element switches to another page.
 *   cancellable: Prevents the page to become active.
 *   object:
 *   {Mixed}    previous     the name or number of the current page.
 *   {Number}   previousId   the number of the current page.
 *   {apf.page} previousPage the current page.
 *   {Mixed}    next         the name or number of the page the will become active.
 *   {Number}   nextId       the number of the page the will become active.
 *   {apf.page} nextpage     the page the will become active.
 * @event afterswitch   Fires after this element has switched to another page.
 *   object:
 *   {Mixed}    previous     the name or number of the previous page.
 *   {Number}   previousId   the number of the previous page.
 *   {apf.page} previousPage the previous page.
 *   {Mixed}    next         the name or number of the current page.
 *   {Number}   nextId       the number of the the current page.
 *   {apf.page} nextpage     the the current page.   
 */
apf.BaseTab = function(){
    this.isPaged         = true;
    this.$focussable     = apf.KEYBOARD;
    this.canHaveChildren = true;
    this.length          = 0;

    /**
     * Sets the current page of this element.
     * @param {mixed}    page     the name of numer of the page which is made active.
     * @param {Function} callback the function called after setting the page. Especially handy when using the load attribute.
     */
    var curCallback;
    this.set = function(page, callback, noEvent){
        if (noEvent || this.load && !this.$findPage(page, {}))
            return this.$propHandlers["activepage"].call(
                this, page, callback, null, noEvent);
        
        if (callback && this.activepage == page)
            return callback();

        curCallback = callback;
        this.setProperty("activepage", page);
    }

    var isLoading = {},
        inited = false,
        ready  = false,
        _self  = this;

    /**** Properties and Attributes ****/

    this.$supportedProperties.push("activepage", "activepagenr", 
        "length", "loading");

    /**
     * @attribute {Number} activepagenr the child number of the active page.
     * Example
     * This example uses property binding to maintain consistency between a
     * dropdown which is used as a menu, and a pages element
     * <code>
     *  <a:dropdown id="ddMenu" value="0">
     *      <a:item value="0">Home</a:item>
     *      <a:item value="1">General</a:item>
     *      <a:item value="2">Advanced</a:item>
     *  </a:dropdown>
     *
     *  <a:pages activepagenr="[ddMenu.value]">
     *      <a:page>
     *          <h1>Home Page</h1>
     *      </a:page>
     *      <a:page>
     *          <h1>General Page</h1>
     *      </a:page>
     *      <a:page>
     *          <h1>Advanced Page</h1>
     *      </a:page>
     *  </a:pages>
     * </code>
     */
    this.$propHandlers["activepagenr"] =

    /**
     * @attribute {String} activepage the name of the active page.
     * Example:
     * <code>
     *  <a:tab activepage="general">
     *      <a:page id="home">
     *          ...
     *      </a:page>
     *      <a:page id="advanced">
     *          ...
     *      </a:page>
     *      <a:page id="general">
     *          ...
     *      </a:page>
     *  </a:tab>
     * </code>
     */
    this.$propHandlers["activepage"]   = function(next, callback, prop, noEvent){
        if (!inited) return;
        
        if (!callback) {
            callback = curCallback;
            curCallback = null;
        }

        var page, info = {};
        page = this.$findPage(next, info);

        if (!page) {
            if (this.load) {
                if (isLoading[next])
                    return;
                
                if (this.$findPage("loading", {}))
                    this.$propHandlers["activepage"].call(this, "loading");
                
                this.setProperty("loading", true);
                
                isLoading[next] = true;
                apf.getData(this.load, null, {
                    page : next
                }, function(data, state, extra){
                    if (state != apf.SUCCESS) {
                        var oError = new Error(apf.formatErrorString(0, null,
                            "Loading new page", "Could not load \
                            new page: " + extra.message));

                        if (extra.tpModule.retryTimeout(extra, state, 
                          _self, oError) === true)
                            return true;
                        
                        if (next == "404")
                            throw oError;
                        
                        _self.set("404", callback);
                        _self.setProperty("loading", false);
                    }
                    
                    var jml = apf.getAmlDocFromString("<a:page xmlns:a='" + apf.ns.apf 
                        + "' id='" + next + "'>" + data + "</a:page>").documentElement;
                    _self.add(null, null, jml);
                    _self.setProperty("activepage", next);
                    
                    if (callback) 
                        callback();
                    
                    _self.setProperty("loading", false);
                });
                return;
            }
            
            //#ifdef __DEBUG
            apf.console.warn("Setting tab page which doesn't exist, \
                              referenced by name: '" + next + "'");
            //#endif

            return false;
        }

        if (page.parentNode != this) {
            //#ifdef __DEBUG
            apf.console.warn("Setting active page on page component which \
                              isn't a child of this tab component. Cancelling.");
            //#endif

            return false;
        }
        
        if (!page.visible || page.disabled) {
            //#ifdef __DEBUG
            apf.console.warn("Setting active page on page component which \
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
        
        if (callback) 
            callback();

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
        return apf.isNot(nameOrId) && this.$activepage || this.$findPage(nameOrId);
    };

    /**
     * Add a new page element
     * @param {String} [caption] the text displayed on the button of the page.
     * @param {String} [name]    the name of the page which is can be referenced by.
     * @return {page} the created page element.
     */
    this.add = function(caption, name, jml){
        var page = apf.document.createElement(jml || "page");
        if (name)
            page.setAttribute("id", name);
        if (caption)
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

        var pages = this.getPages();
        if (pages.length == 1) {
            this.$removeTabFooter();
        }
        
        page.removeNode();

        // #ifdef __ENABLE_TABSCROLL
        this.setScrollerState();
        // #endif
        return page;
    };
    
    this.$removeTabFooter = function() {
        var nodes = this.oExt.childNodes, l = nodes.length;
        
        for (var i = 0; i < l; i++) {
            if ((nodes[i].className || "").indexOf("tabFooter") > -1) {
                nodes[i].parentNode.removeChild(nodes[i]);
                return true;
            }
        }
        
        return false;
    }

    // #ifdef __ENABLE_TABSCROLL
    
    var SCROLLANIM = {
            scrollOn  : false,
            steps     : 15,
            interval  : 10,
            size      : 0,
            left      : 0,
            control   : {
                stop  : false
            },
            stopHandle: function() {
                bAnimating = false;
            }
        },
        SCROLL_OFF     = 0x0001,
        SCROLL_HOVER   = 0x0002,
        SCROLL_DOWN    = 0x0004,
        SCROLL_DIS     = 0x0008,
        SCROLL_L_STATE = SCROLL_OFF,
        SCROLL_R_STATE = SCROLL_OFF,
        SCROLL_LEFT    = 0x0001,
        SCROLL_RIGHT   = 0x0002,
        SCROLL_BOTH    = 0x0004,
        bAnimating     = false,
        scrollTimer    = null,
        keepScrolling  = false,
        globalDir      = SCROLL_LEFT;

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

    function setButtonState(dir, state) {
        var bBoth = dir & SCROLL_BOTH;
        if (bBoth)
            dir = SCROLL_LEFT;
        var oBtn = _self[dir & SCROLL_LEFT ? "oLeftScroll" : "oRightScroll"];
        if (!(state & SCROLL_DIS)) {
            if (dir & SCROLL_LEFT)
                SCROLL_L_STATE = state;
            else
                SCROLL_R_STATE = state;
        }
        
        if (state & SCROLL_OFF)
            _self.$setStyleClass(oBtn,  "", ["disabled", "hover", "down"]);
        else if (state & SCROLL_HOVER)
            _self.$setStyleClass(oBtn,  "hover", ["disabled", "down"]);
        else if (state & SCROLL_DOWN)
            _self.$setStyleClass(oBtn,  "down", ["disabled", "hover"]);
        else if (state & SCROLL_DIS)
            _self.$setStyleClass(oBtn,  "disabled", ["hover", "down"]);

        if (bBoth)
            setButtonState(SCROLL_RIGHT, state);
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
                || parseInt(apf.getStyle(this.oScroller, "width").replace(/(px|em|%)/, ""));
            bOn   = ((getButtonsWidth.call(this) + scrollerWidth) > this.oExt.offsetWidth);
            iBtns = SCROLL_BOTH;
        }

        if (iBtns & SCROLL_BOTH && bOn !== SCROLLANIM.scrollOn) {
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

        this.oScroller.style.display = (iBtns & SCROLL_BOTH && !bOn)
            ? "none"
            : "";
        if (typeof iBtns == "undefined")
            iBtns = SCROLL_BOTH;
        if (!bOn) {
            if ((iBtns & SCROLL_LEFT) || (iBtns & SCROLL_BOTH))
                setButtonState(SCROLL_LEFT, SCROLL_DIS);
            if ((iBtns & SCROLL_RIGHT) || (iBtns & SCROLL_BOTH))
                setButtonState(SCROLL_RIGHT, SCROLL_DIS);
        }
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
        if (dir & SCROLL_LEFT) {
            return SCROLLANIM.left;
        }
        else if (dir & SCROLL_RIGHT) {
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
            dir = SCROLL_LEFT;

        //apf.tween.clearQueue(this.oButtons, true);
        var iCurrentLeft = this.oButtons.offsetLeft,
            size         = e["delta"] ? Math.round(e.delta * 36) : SCROLLANIM.size;

        //get maximum left offset for either direction
        var iBoundary = getAnimationBoundary.call(this, dir);
        if (dir & SCROLL_LEFT) {
            setButtonState(SCROLL_LEFT,  SCROLL_DOWN);
            setButtonState(SCROLL_RIGHT, SCROLL_OFF);
            if (iCurrentLeft === iBoundary) {
                this.setScrollerState(false, SCROLL_LEFT);
                return apf.tween.single(this.oButtons, {
                    steps   : SCROLLANIM.steps,
                    interval: 20,
                    from    : iCurrentLeft,
                    to      : iCurrentLeft + 12,
                    type    : "left",
                    anim    : apf.tween.EASEOUT,
                    onstop  : SCROLLANIM.stopHandle,
                    onfinish: function(oNode) {
                        apf.tween.single(oNode, {
                            steps   : SCROLLANIM.steps,
                            interval: SCROLLANIM.interval,
                            from    : iCurrentLeft + 12,
                            to      : iCurrentLeft,
                            type    : "left",
                            anim    : apf.tween.EASEIN,
                            onstop  : SCROLLANIM.stopHandle,
                            onfinish: function() {
                                bAnimating = false;
                                if (e.name == "mousescroll")
                                    setButtonState(SCROLL_LEFT, SCROLL_OFF);
                            }
                        });
                    }
                });
            }
            //one scroll animation scrolls by a SCROLLANIM.size px.
            var iTargetLeft = iCurrentLeft + (e.type == "dblclick" ? size * 3 : size);
            if (iTargetLeft > iBoundary)
                iTargetLeft = iBoundary;

            if (iTargetLeft === iBoundary)
                this.setScrollerState(false, SCROLL_LEFT);
            this.setScrollerState(true, SCROLL_RIGHT);

            //start animated scroll to the left
            apf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                control : SCROLLANIM.control,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : apf.tween.NORMAL,
                onstop  : SCROLLANIM.stopHandle,
                onfinish: function() {
                    bAnimating = false;
                    if (e.name == "mousescroll")
                        setButtonState(SCROLL_LEFT, SCROLL_OFF);
                    if (keepScrolling)
                        _self.scroll(e, globalDir);
                }
            });
        }
        else if (dir & SCROLL_RIGHT) {
            this.setScrollerState(true);
            setButtonState(SCROLL_RIGHT, SCROLL_DOWN);
            setButtonState(SCROLL_LEFT,  SCROLL_OFF);
            if (iCurrentLeft === iBoundary) {
                _self.setScrollerState(false, SCROLL_RIGHT);
                return apf.tween.single(this.oButtons, {
                    steps   : SCROLLANIM.steps,
                    interval: 20,
                    from    : iCurrentLeft,
                    to      : iCurrentLeft - 24,
                    type    : "left",
                    anim    : apf.tween.EASEOUT,
                    onstop  : SCROLLANIM.stopHandle,
                    onfinish: function(oNode, options) {
                        apf.tween.single(oNode, {
                            steps   : SCROLLANIM.steps,
                            interval: SCROLLANIM.interval,
                            from    : iCurrentLeft - 24,
                            to      : iCurrentLeft,
                            type    : "left",
                            anim    : apf.tween.EASEIN,
                            onstop  : SCROLLANIM.stopHandle,
                            onfinish: function() {
                                bAnimating = false;
                                if (e.name == "mousescroll")
                                    setButtonState(SCROLL_RIGHT, SCROLL_OFF);
                            }
                        });
                    }
                });
            }
            //one scroll animation scrolls by a SCROLLANIM.size px.
            var iTargetLeft = iCurrentLeft - (e.type == "dblclick" ? size * 3 : size);
            //make sure we don't scroll more to the right than the
            //maximum left:
            if (iTargetLeft < iBoundary)
                iTargetLeft = iBoundary;
            //start animated scroll to the right
            apf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                control : SCROLLANIM.control,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : apf.tween.NORMAL,
                onstop  : SCROLLANIM.stopHandle,
                onfinish: function() {
                    bAnimating = false;
                    if (e.name == "mousescroll")
                        setButtonState(SCROLL_RIGHT, SCROLL_OFF);
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
     * @param {page} oPage The page to scroll into view
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
            iTargetLeft = null,
            dir;

        if ((iTabLeft + iTabWidth) > ((iRealWidth - iScrollCorr) - iCurrentLeft)) { //scroll to the right
            iTargetLeft = (-(iTabLeft - SCROLLANIM.left)
                + (iRealWidth - iTabWidth - iScrollCorr));
            dir         = SCROLL_RIGHT;
        }
        else if ((iCurrentLeft + iTabLeft) < SCROLLANIM.left) { //sroll to the left
            iTargetLeft = SCROLLANIM.left - iTabLeft;
            dir         = SCROLL_LEFT;
        }

        if (iTargetLeft !== null) {
            this.setScrollerState(true);
            setButtonState(SCROLL_RIGHT, dir & SCROLL_RIGHT ? SCROLL_DOWN : SCROLL_OFF);
            setButtonState(SCROLL_LEFT,  dir & SCROLL_LEFT  ? SCROLL_DOWN : SCROLL_OFF);
            apf.tween.clearQueue(this.oButtons, true);

            apf.tween.single(this.oButtons, {
                steps   : SCROLLANIM.steps,
                interval: SCROLLANIM.interval,
                from    : iCurrentLeft,
                to      : iTargetLeft,
                type    : "left",
                anim    : apf.tween.NORMAL,
                onstop  : SCROLLANIM.stopHandle,
                onfinish: function() {
                    bAnimating = false;
                    setButtonState(SCROLL_RIGHT, SCROLL_OFF);
                    setButtonState(SCROLL_LEFT,  SCROLL_OFF);
                }
            });
        }
        else
            bAnimating = false;
    };

    // #endif

    /**** DOM Hooks ****/

    this.$domHandlers["removechild"].push(function(amlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;

        if (this.firstChild == amlNode && amlNode.nextSibling)
            amlNode.nextSibling.$first();
        if (this.lastChild == amlNode && amlNode.previousSibling)
            amlNode.previousSibling.$last();

        if (this.$activepage == amlNode) {
            if (amlNode.nextSibling || amlNode.previousSibling)
                this.set(amlNode.nextSibling || amlNode.previousSibling);
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

    this.$domHandlers["insert"].push(function(amlNode, beforeNode, withinParent){
        if (amlNode.tagName != "page")
            return;

        if (!beforeNode) {
            if (this.lastChild)
                this.lastChild.$last(true);
            amlNode.$last();
        }

        if(!this.firstChild || beforeNode == this.firstChild) {
            if (this.firstChild)
                this.firstChild.$first(true);
            amlNode.$first();
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
            this.set(amlNode);
        
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

    this.implement(apf.Presentation); /** @inherits apf.Presentation */

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
                clearTimeout(scrollTimer);
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
                SCROLLANIM.control.stop = true;
                setButtonState(SCROLL_BOTH, SCROLL_OFF);
            };

            // #ifdef __WITH_MOUSESCROLL
            /*apf.addEventListener("mousescroll", function(e) {
                var found = (e.target == _self.oButtons);
                while (!found && e.target != document.body) {
                    e.target = e.target.offsetParent;
                    found = (e.target == _self.oButtons);
                }
                if (!found) return;
                var dir = e.delta > 0 ? SCROLL_LEFT : SCROLL_RIGHT;
                e.delta = Math.abs(e.delta);
                _self.scroll(e, dir);
            });*/
            //#endif

            this.oLeftScroll  = apf.getNode(this.oScroller, [0]);
            this.oRightScroll = apf.getNode(this.oScroller, [1]);
            
            ["oLeftScroll", "oRightScroll"].forEach(function(sBtn) {
                var dir    = sBtn == "oLeftScroll" ? SCROLL_LEFT  : SCROLL_RIGHT,
                    revDir = sBtn == "oLeftScroll" ? SCROLL_RIGHT : SCROLL_LEFT;

                _self[sBtn].ondbclick   =
                _self[sBtn].onmousedown = function(e) {
                    SCROLLANIM.control.stop = false;
                    var state = dir & SCROLL_LEFT ? SCROLL_L_STATE : SCROLL_R_STATE;
                    if (this.className.indexOf("disabled") != -1
                      || state & SCROLL_DOWN) return;
                    e = e || event;
                    _self.scroll(e, dir);
                    startTimer(e, dir);
                    if (!apf.isSafariOld)
                        this.onmouseout();
                };
                _self[sBtn].onmouseover = function() {
                    SCROLLANIM.control.stop = false;
                    var state = dir & SCROLL_LEFT ? SCROLL_L_STATE : SCROLL_R_STATE;
                    if (this.className.indexOf("disabled") != -1
                      || state & SCROLL_DOWN) return;
                    setButtonState(dir, SCROLL_HOVER);
                    setButtonState(revDir, SCROLL_OFF);
                    globalDir = dir;
                };
                _self[sBtn].onmouseout = function() {
                    var state = dir & SCROLL_LEFT ? SCROLL_L_STATE : SCROLL_R_STATE;
                    if (this.className.indexOf("disabled") != -1
                      || state & SCROLL_DOWN) return;
                    setButtonState(dir, SCROLL_OFF);
                };
                _self[sBtn].onmouseup = function() {
                    if (this.className.indexOf("disabled") == -1) {
                        setButtonState(dir, SCROLL_OFF);
                    }
                    stopTimer();
                    SCROLLANIM.control.stop = true;
                };
            });
        }
        
        apf.layout.setRules(this.oExt, this.uniqueId + "_tabscroller",
            "apf.all[" + this.uniqueId + "].correctScrollState()");
        // #endif

        //Skin changing support
        if (this.oInt) {
            //apf.AmlParser.replaceNode(oPages, this.oPages);
            this.oInt = this.oPages;
            page      = true;

            var node, nodes = this.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                node.$draw(true);
                node.$skinchange();
                node.$loadAml();
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
            var node, nodes = this.$aml.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                if (node.nodeType != 1) continue;

                var tagName = node[apf.TAGNAME];
                if ("page|case".indexOf(tagName) > -1) {
                    page = new apf.page(this.oPages, tagName).loadAml(node, this);

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
                    throw new Error(apf.formatErrorString(0, this,
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
            this.activepage = (typeof this.activepage != "undefined"
                ? this.activepage
                : this.activepagenr) || 0;
            if (this.getPage(this.activepage).$rendered)
                this.$propHandlers.activepage.call(this, this.activepage);
        }
        else {
            apf.AmlParser.parseChildren(this.$aml, this.oExt, this);
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
        apf.layout.removeRule(this.oExt, this.uniqueId + "_tabscroller");
        
        [this.oLeftScroll, this.oRightScroll].forEach(function(oBtn) {
            oBtn.onmousedown = oBtn.ondblclick = oBtn.onmouseover = 
            oBtn.onmouseout  = oBtn.onmouseup  = null;
        });
        // #endif
    };
};

/**
 * A page in a pageable element. (i.e. a page in {@link element.tab})
 *
 * @constructor
 * @define  page
 * @allowchild  {elements}, {anyaml}
 * @addnode elements
 *
 * @inherits apf.DelayedRender
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.page = apf.component(apf.NODE_HIDDEN, function(){
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
            apf.skins.setIcon(node, value, this.parentNode.iconPath);
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
            apf.destroyHtmlNode(this.oExt);
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
        if (!this.$amlLoaded)
            return;

        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.$draw();
            this.$skinchange();
            this.$loadAml();
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

            if (apf.layout)
                apf.layout.forceResize(this.fake ? this.relPage.oInt : this.oInt);
        }

        this.$active = true;

        // #ifdef __WITH_DELAYEDRENDER
        this.$render();
        // #endif
        
        if (!this.fake) {
            if (apf.isIE) {
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

        var sType = this.$aml.getAttribute("type")
        if (sType) {
            this.fake = true;
            this.relPage = this.parentNode.getPage(sType) || null;
        }

        if (this.parentNode.$hasButtons) {
            //this.parentNode.$removeEditable(); //@todo multilingual support is broken when using dom

            this.parentNode.$getNewContext("button");
            var elBtn = this.parentNode.$getLayoutNode("button");
            elBtn.setAttribute(this.parentNode.$getOption("main", "select") || "onmousedown",
                'var page = apf.lookup(' + this.uniqueId + ');\
                 page.parentNode.set(page);\
                 page.canHaveChildren = 2;');
            elBtn.setAttribute("onmouseover", 'var o = apf.lookup('
                + this.parentNode.uniqueId + ');if(apf.lookup(' + this.uniqueId
                + ') != o.$activepage) o.$setStyleClass(this, "over");');
            elBtn.setAttribute("onmouseout", 'var o = apf.lookup('
                + this.parentNode.uniqueId + ');\
                  o.$setStyleClass(this, "", ["over"]);\
                  var page = apf.lookup(' + this.uniqueId + ');\
                  page.canHaveChildren = true;');
            
            var nameOrId = this.$aml.getAttribute("id") || this.$aml.getAttribute("name");
            var elBtnClose = this.parentNode.$getLayoutNode("button", "btnClose");
            elBtnClose.setAttribute("onclick",
                'var page = apf.lookup(' + this.uniqueId + ');\
                 page.parentNode.remove(' + nameOrId + ');');

            this.oButton = apf.xmldb.htmlImport(elBtn, this.parentNode.oButtons);

            if (!isSkinSwitch && this.nextSibling && this.nextSibling.oButton)
                this.oButton.parentNode.insertBefore(this.oButton, this.nextSibling.oButton);

            this.oButton.host = this;
        }

        if (this.fake)
            return;

        if (this.oExt)
            this.oExt.parentNode.removeChild(this.oExt); //@todo mem leaks?

        this.oExt = this.parentNode.$getExternal("page",
            this.parentNode.oPages, null, this.$aml);
        this.oExt.host = this;
    };

    this.$loadAml = function(x){
        if (this.fake)
            return;

        if (this.oInt) {
            var oInt = this.parentNode
                .$getLayoutNode("page", "container", this.oExt);
            oInt.setAttribute("id", this.oInt.getAttribute("id"));
            this.oInt = apf.AmlParser.replaceNode(oInt, this.oInt);
        }
        else {
            this.oInt = this.parentNode
                .$getLayoutNode("page", "container", this.oExt);
            apf.AmlParser.parseChildren(this.$aml, this.oInt, this, true);
        }
    };

    this.$destroy = function(){
        if (this.oButton) {
            this.oButton.host = null;
            this.oButton = null;
            this.$first();
        }
    };
}).implement(
    // #ifdef __WITH_DELAYEDRENDER
    apf.DelayedRender
    // #endif
);

// #endif
