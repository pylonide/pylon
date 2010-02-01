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

// #ifdef __AMLBASETAB || __INC_ALL
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
 *   cancelable: Prevents the page to become active.
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
    this.$init(true);
};

(function() {
    this.isPaged     = true;
    this.$focussable = apf.KEYBOARD;
    this.length      = 0;
    this.isLoading   = {};
    this.inited      =
    this.ready       = false;

    /**
     * Sets the current page of this element.
     * @param {mixed}    page     the name of numer of the page which is made active.
     * @param {Function} callback the function called after setting the page. Especially handy when using the src attribute.
     */
    this.set = function(page, callback, noEvent){
        if (noEvent || this.src && !this.$findPage(page, {})) {
            return this.$propHandlers["activepage"].call(
                this, page, null, null, callback, noEvent);
        }
        
        if (callback && this.activepage == page)
            return callback();

        this.$lastCallback = callback;
        this.setProperty("activepage", page);
    };

    /**** Properties and Attributes ****/

    this.$supportedProperties.push("activepage", "activepagenr", "length",
        "src", "loading");

    /**
     * @attribute {Number} activepagenr the child number of the active page.
     * Example:
     * This example uses property binding to maintain consistency between a
     * dropdown which is used as a menu, and a pages element
     * <code>
     *  <a:dropdown id="ddMenu" value="0">
     *      <a:item value="0">Home</a:item>
     *      <a:item value="1">General</a:item>
     *      <a:item value="2">Advanced</a:item>
     *  </a:dropdown>
     * 
     *  <a:pages activepagenr="{ddMenu.value}">
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
    this.$propHandlers["activepage"]   = function(next, prop, force, callback, noEvent){
        if (!this.inited || apf.isNot(next)) return;

        if (!callback) {
            callback = this.$lastCallback;
            delete this.$lastCallback;
        }

        var page, info = {};
        page = this.$findPage(next, info);

        if (!page) {
            if (this.src) {
                if (this.isLoading[next])
                    return;
                
                if (this.$findPage("loading", {}))
                    this.$propHandlers["activepage"].call(this, "loading");
                
                this.setProperty("loading", true);
                this.isLoading[next] = true;

                page = this.ownerDocument.createElementNS(apf.ns.apf, "page");
                page.setAttribute("id", next);
                this.appendChild(page);

                var _self = this;
                page.insertMarkup(this.src, {
                    page     : next,
                    //@todo apf3.0 change callback arguments in xinclude
                    callback : function(options){
                        if (!options.xmlNode) {
                            var oError = new Error(apf.formatErrorString(0, null,
                                "Loading new page", "Could not load new page: "
                                + _self.src));
                                
                            _self.setProperty("loading", false);
                            
                            if (this.dispatchEvent("error", apf.extend({
                                error   : oError,
                                bubbles : true
                            }, options)) === false)
                                return true;
                            
                            throw oError;
                        }
                        else {
                            //for success
                            _self.setProperty("activepage", next);
    
                            if (callback)
                                callback();
    
                            _self.setProperty("loading", false);
                        }
                    }
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
            if (page.$rendered !== false) {
                this.hideLoader();
            }
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){
                    this.parentNode.hideLoader();
                 });
            }
        }

        if (!noEvent) {
            if (page.$rendered !== false)
                this.dispatchEvent("afterswitch", oEvent);
            else {
                //Delayed rendering support
                page.addEventListener("afterrender", function(){ 
                    this.parentNode.dispatchEvent("afterswitch", oEvent);
                });
             }
        }
        
        if (typeof callback == "function") 
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
            if ("page|case".indexOf(nodes[i].localName) > -1)
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
        if (apf.isNot(nameOrId))
            return this.$activepage;
        else
            return this.$findPage(nameOrId);
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
        
        page.removeNode();

        // #ifdef __ENABLE_TABSCROLL
        this.setScrollerState();
        // #endif
        return page;
    };

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
        var cId = "cache_" + this.$buttons.childNodes.length;
        if (SCROLLANIM[cId])
            return SCROLLANIM[cId];

        var iWidth = 0;
        for (var i = 0, l = this.$buttons.childNodes.length; i < l; i++) {
            if (typeof this.$buttons.childNodes[i].offsetWidth != "undefined")
                iWidth += this.$buttons.childNodes[i].offsetWidth;
        }

        return SCROLLANIM[cId] = iWidth;
    }

    function setButtonState(dir, state) {
        var bBoth = dir & SCROLL_BOTH;
        if (bBoth)
            dir = SCROLL_LEFT;
        var oBtn = this[dir & SCROLL_LEFT ? "oLeftScroll" : "oRightScroll"];
        if (!(state & SCROLL_DIS)) {
            if (dir & SCROLL_LEFT)
                SCROLL_L_STATE = state;
            else
                SCROLL_R_STATE = state;
        }
        
        if (state & SCROLL_OFF)
            apf.setStyleClass(oBtn,  "", ["disabled", "hover", "down"]);
        else if (state & SCROLL_HOVER)
            apf.setStyleClass(oBtn,  "hover", ["disabled", "down"]);
        else if (state & SCROLL_DOWN)
            apf.setStyleClass(oBtn,  "down", ["disabled", "hover"]);
        else if (state & SCROLL_DIS)
            apf.setStyleClass(oBtn,  "disabled", ["hover", "down"]);

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
        if (!this.ready || !this.$hasButtons || !this.oScroller) return;

        if (typeof bOn == "undefined") {
            var scrollerWidth = this.oScroller.offsetWidth
                || parseInt(apf.getStyle(this.oScroller, "width").replace(/(px|em|%)/, ""));
            bOn   = ((getButtonsWidth.call(this) + scrollerWidth) > this.$ext.offsetWidth);
            iBtns = SCROLL_BOTH;
        }

        if (iBtns & SCROLL_BOTH && bOn !== SCROLLANIM.scrollOn) {
            // in case of HIDING the scroller: check if the anim stuff has reverted
            SCROLLANIM.scrollOn = bOn;
            if (!bOn) {
                this.$buttons.style.left = SCROLLANIM.left + "px";
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
                setButtonState.call(this, SCROLL_LEFT, SCROLL_DIS);
            if ((iBtns & SCROLL_RIGHT) || (iBtns & SCROLL_BOTH))
                setButtonState.call(this, SCROLL_RIGHT, SCROLL_DIS);
        }
    };

    /**
     * Corrects the state of the scroller buttons when the state of external
     * components change, like on a resize event of a window.
     *
     * @type {void}
     */
    this.correctScrollState = function() {
        if (!this.ready || !this.$hasButtons || !this.oScroller) return;
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
            SCROLLANIM.left = this.$buttons.offsetLeft;
            SCROLLANIM.size = Math.round(this.firstChild.$button.offsetWidth);
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
            var oNode = this.$buttons.childNodes[this.$buttons.childNodes.length - 1];

            return this.$ext.offsetWidth - (oNode.offsetLeft + oNode.offsetWidth
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
        if (!this.ready || !this.$hasButtons || !this.oScroller) return;
        if (!e)
            e = window.event;
        if (typeof e["type"] == "unknown") //scope expired (prolly GC'ed)
            e = {type: "click"};
        if (bAnimating && e.type != "dblclick") return;
        bAnimating = true;

        if (typeof dir == "undefined")
            dir = SCROLL_LEFT;

        //apf.tween.clearQueue(this.$buttons, true);
        var iCurrentLeft = this.$buttons.offsetLeft,
            size         = e["delta"] ? Math.round(e.delta * 36) : SCROLLANIM.size,
            //get maximum left offset for either direction
            iBoundary = getAnimationBoundary.call(this, dir),
            _self     = this;
        if (dir & SCROLL_LEFT) {
            setButtonState(SCROLL_LEFT,  SCROLL_DOWN);
            setButtonState(SCROLL_RIGHT, SCROLL_OFF);
            if (iCurrentLeft === iBoundary) {
                this.setScrollerState(false, SCROLL_LEFT);
                return apf.tween.single(this.$buttons, {
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
            apf.tween.single(this.$buttons, {
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
                this.setScrollerState(false, SCROLL_RIGHT);
                return apf.tween.single(this.$buttons, {
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
            apf.tween.single(this.$buttons, {
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
        if (!this.ready || !this.$hasButtons || !this.oScroller || !oPage.$drawn)
            return;
        bAnimating = true;
        if (this.$buttons.offsetWidth < this.$ext.offsetWidth)
            return this.setScrollerState(false);

        var iTabLeft     = oPage.$button.offsetLeft,
            iTabWidth    = oPage.$button.offsetWidth,
            iCurrentLeft = this.$buttons.offsetLeft;

        if (SCROLLANIM.size <= 0) {
            SCROLLANIM.left = this.$buttons.offsetLeft;
            var p = this.firstChild;
            while (!p.$button)
                p = p.nextSibling;
            SCROLLANIM.size = Math.round(p.$button.offsetWidth);
        }
        this.$buttons.style.left = iCurrentLeft;

        var iRealWidth  = this.$ext.offsetWidth,
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
            apf.tween.clearQueue(this.$buttons, true);

            apf.tween.single(this.$buttons, {
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

    this.addEventListener("DOMNodeRemoved", function(e){
        var amlNode = e.currentTarget;
        if (e.$doOnlyAdmin || e.relatedNode != this 
          || amlNode.localName != "page")
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

    this.addEventListener("DOMNodeInserted",function(e){
        var amlNode = e.currentTarget;
        
        if (amlNode.localName != "page" || e.relatedNode != this)
            return;

        if (!e.$beforeNode) {
            var lastChild;
            if (lastChild = this.lastChild) {
                if (lastChild.nodeType != 1)
                    lastChild = lastChild.previousSibling;
                if (lastChild)
                    lastChild.$last(true);
            }
            amlNode.$last();
        }

        if (!this.firstChild || e.$beforeNode == this.firstChild) {
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
            if ("page|case".indexOf(node.localName) > -1 && (t++ == nameOrId
              || (nameOrId.localName && node || node.name) == nameOrId)) {
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

        var page,
            key = e.keyCode;

        switch (key) {
            case 9:
                break;
            case 13:
                break;
            case 32:
                break;
            case 37: //LEFT
                page = this.getPage().previousSibling;
                while(page && (page.nodeType != 1
                  || "page|case".indexOf(page.localName) == -1 || !page.visible)) {
                    page = page.previousSibling;
                }

                if (page)
                    this.setProperty("activepage", page);
                break;
            case 39: //RIGHT
                page = this.getPage().nextSibling;
                while(page && (page.nodeType != 1 
                  || "page|case".indexOf(page.localName) == -1 || !page.visible)) {
                    page = page.nextSibling;
                }

                if (page)
                    this.setProperty("activepage", page);
                break;
            default:
                return;
        }
        //return false;
    }, true);

    // #endif

    /**** Init ****/

    this.$loadChildren = function(callback){
        var page  = false,
            _self = this,
            i, j, l, node, nodes;

        this.inited = true;

        if (this.$hasButtons) {
            this.$buttons = this.$getLayoutNode("main", "buttons", this.$ext);
            this.$buttons.setAttribute("id", this.$uniqueId + "_buttons");
        }

        this.oPages = this.$getLayoutNode("main", "pages", this.$ext);
        
        // #ifdef __ENABLE_TABSCROLL
        // add scroller node(s)
        this.oScroller = this.$getLayoutNode("main", "scroller", this.oPages);
        if (this.oScroller) {
            function startTimer(e, dir) {
                clearTimeout(scrollTimer);
                globalDir   = dir;
                scrollTimer = $setTimeout(function() {
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
                var found = (e.target == _self.$buttons);
                while (!found && e.target != document.body) {
                    e.target = e.target.offsetParent;
                    found = (e.target == _self.$buttons);
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

        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(this.$ext, this.$uniqueId + "_tabscroller",
            "var o = apf.all[" + this.$uniqueId + "]; o && o.correctScrollState()");
        apf.layout.queue(this.$ext);
        //#endif
        // #endif

        //Skin changing support
        if (this.$int) {
            //apf.AmlParser.replaceNode(this.oPages, oPages);
            this.$int = this.oPages;
            page      = true;

            //@todo apf3.0 skin change?
            nodes = this.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                if(node.nodeType != 1)
                    continue;
                node.$draw(true);
                if(node.$skinchange)
                    node.$skinchange();
                node.$loadAml();
            }
        }
        else {
            this.$int = this.oPages;

            //Build children
            nodes = this.childNodes;
            for (j = 0, i = 0, l = nodes.length; i < l; i++) {
                if ("page|case".indexOf((node = nodes[i]).localName) > -1) {
                    //Set first page marker
                    if (j++ == 0)
                        node.$first();
                    if (j == l)
                        node.$last();
                }
            }
        }

        //Set active page
        if (node) {
            this.activepage = (typeof this.activepage != "undefined"
                ? this.activepage
                : this.activepagenr) || 0;
            page = this.getPage(this.activepage);
            if (page.render != "runtime" || page.$rendered)
                this.$propHandlers.activepage.call(this, this.activepage);
        }
        else {
            this.isPages = false;
        }

        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("length", j);
        //#endif

        this.ready = true;
        // #ifdef __ENABLE_TABSCROLL
        window.setTimeout(function() {
            _self.setScrollerState();
        }, 0);
        // #endif


        if (!this.activepage && this.getAttribute("src")) {
            this.src = this.getAttribute("src");
            this.$propHandlers["activepage"].call(this);
        }
    };
    
    this.$destroy = function(bSkinChange) {
        if (bSkinChange || !this.oScroller)
            return;
        // #ifdef __ENABLE_TABSCROLL
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$ext, this.$uniqueId + "_tabscroller");
        //#endif
        [this.oLeftScroll, this.oRightScroll].forEach(function(oBtn) {
            oBtn.onmousedown = oBtn.ondblclick = oBtn.onmouseover = 
            oBtn.onmouseout  = oBtn.onmouseup  = null;
        });
        // #endif
    };
}).call(apf.BaseTab.prototype = new apf.Presentation());

// #endif
