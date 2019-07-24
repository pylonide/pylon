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

// #ifdef __AMLNOTIFIER || __INC_ALL
/**
 * 
 * A notification element, which shows popups when events occur. Similar in concept
 * to [growl](http://growl.info/) on the OSX platform.
 * 
 * @class apf.notifier
 * @define notifier
 * @media
 * @inherits apf.Presentation
 * 
 * @version     %I%, %G% 
 * 
 * @allowchild event
 *
 */
/**
 * @attribute   {String}   position     Sets or gets the vertical and horizontal element's start
 *                                      position. The possible values include:
 *     - `"top-right"`:       the element is placed in top-right corner of browser window (this is the default)
 *     - `"top-left"`:        the element is placed in top-left corner of browser window
 *     - `"bottom-right"`:    the element is placed in bottom-right corner of browser window
 *     - `"bottom-left"`:     the element is placed in bottom-left corner of browser window
 *     - `"center-center"`:   the element is placed in the middle of browser window
 *     - `"right-top"`:       the element is placed in top-right corner of browser window
 *     - `"left-top"`:        the element is placed in top-left corner of browser window
 *     - `"right-bottom"`:    the element is placed in bottom-right corner of browser window
 *     - `"left-bottom"`:     the element is placed in bottom-left corner of browser window
 *     - `"center-center"`:   the element is placed in the middle of browser window
 */
/**
 * @attribute   {String}   margin       Defines the free space around a popup element.
 *                                      Defaults to '10 10 10 10' pixels
 */
/**
 * @attribute   {String|Number}   columnsize   Specifies the element's width and col width, where the
 *                                      element will be displayed. Defaults to 300px.
 */
/**
 * @attribute   {String}   [arrange="vertical"]      Sets or gets the how the popup elements are displayed, either rows (`"vertical"`)
 *                                      or columns (`"horizontal"`).
 */
/**
 * @attribute   {String}   [timeout=2]     After the timeout has passed, the popup
 *                                      disappears automatically. When the
 *                                      mouse is hovering over the popup, it doesn't
 *                                      disappears.
 */
/**
 * @attribute   {String}   onclick      An action executed after a user clicks
 *                                      on the notifier.
 * 
 */
apf.notifier = function(struct, tagName){
    this.$init(tagName || "notifier", apf.NODE_VISIBLE, struct);
};

(function() {
    var _self = this;
    this.timeout      = 2000;
    this.position     = "top-right";
    this.columnsize   = 300;
    this.arrange      = "vertical";
    this.margin       = "10 10 10 10";
    this.startPadding = 0;
    
    this.lastPos      = null;
    this.showing      = 0;
    this.sign         = 1;

    this.$supportedProperties.push("margin", "position", "timeout",
        "columnsize", "arrange", "start-padding");

    this.$propHandlers["position"] = function(value) {
        this.lastPos = null;
    };
    
    this.$propHandlers["margin"] = function(value) {
        this.margin = value;
    };
    
    this.$propHandlers["start-padding"] = function(value) {
        this.startPadding = parseInt(value);
    };
    
    this.$propHandlers["timeout"] = function(value) {
        this.timeout = parseInt(value) * 1000;
    };
    
    function getPageScroll() {
        return [
            document.documentElement.scrollTop || document.body.scrollTop,
            document.documentElement.scrollLeft || document.body.scrollLeft
        ];
    }

    function getStartPosition(x, wh, ww, nh, nw, margin, startPadding) {
        var scrolled = getPageScroll();

        return [
             (x[0] == "top"
                 ? margin[0]
                 : (x[0] == "bottom"
                     ? wh - nh - margin[2]
                     : wh / 2 - nh / 2)) + scrolled[0] + startPadding,
             (x[1] == "left"
                 ? margin[3]
                 : (x[1] == "right"
                     ? ww - nw - margin[1]
                     : ww / 2 - nw / 2)) + scrolled[1]
        ];
    }

    /**
     * Creates a new notification popup.
     * 
     * @param {String}  [message=""]  The message content displayed in the popup element
     * @param {String}  [icon]     The path to the icon file ,relative to "icon-path" which
     *                           is set in the skin declaration
     * 
     */
    this.popup = function(message, icon, ev) {
        if (!this.$ext)
            return;

        this.$ext.style.width = this.columnsize + "px";

        var _self = this,
            oNoti = this.$pHtmlNode.appendChild(this.$ext.cloneNode(true)),
            ww    = apf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth,
            wh    = apf.isIE
                ? document.documentElement.offsetHeight
                : window.innerHeight,
        
            removed = false,

            oIcon = this.$getLayoutNode("notification", "icon", oNoti),
            oBody = this.$getLayoutNode("notification", "body", oNoti);

        this.showing++;

        if (oIcon && icon) {
            if (oIcon.nodeType == 1) {
                oIcon.style.backgroundImage = "url("
                + this.iconPath + icon + ")";
            }
            else {
                oIcon.nodeValue = this.iconPath + icon;
            }

            this.$setStyleClass(oNoti, this.$baseCSSname + "ShowIcon");
        }

        oBody.insertAdjacentHTML("beforeend", message || "[No message]");
        oNoti.style.display = "block";

        var margin = apf.getBox(this.margin || "0"),
            nh     = oNoti.offsetHeight,
            nw     = oNoti.offsetWidth,
            /* It's possible to set for example: position: top-right or right-top */
            x      = this.position.split("-"),
            _reset = false;

        if (x[1] == "top" || x[1] == "bottom" || x[0] == "left" || x[0] == "right")
            x = [x[1], x[0]];
        /* center-X and X-center are disabled */
        if ((x[0] == "center" && x[1] !== "center") || (x[0] !== "center" && x[1] == "center"))
            x = ["top", "right"];

        /* start positions */
        if (!this.lastPos) {
            this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin, this.startPadding);
            this.sign = 1;
            _reset = true;
        }

        if ((!_reset && x[0] == "bottom" && this.sign == 1) ||
           (x[0] == "top" && this.sign == -1)) {
            if (this.arrange == "vertical") {
                this.lastPos[0] += x[1] == "center"
                    ? 0
                    : this.sign * (x[0] == "top"
                        ? margin[0] + nh
                        : (x[0] == "bottom"
                            ? - margin[2] - nh
                            : 0));
            }
            else {
                this.lastPos[1] += x[0] == "center"
                    ? 0
                    : this.sign * (x[1] == "left"
                        ? margin[3] + nw
                        : (x[1] == "right"
                            ? - margin[1] - nw
                            : 0));
            }
        }

        /* reset to next line, first for vertical, second horizontal */
        var scrolled = getPageScroll();
        
        if (this.lastPos[0] > wh + scrolled[0] - nh || this.lastPos[0] < scrolled[0]) {
            this.lastPos[1] += (x[1] == "left"
                ? nw + margin[3]
                : (x[1] == "right"
                    ? - nw - margin[3]
                    : 0));
            this.sign *= -1;
            this.lastPos[0] += this.sign*(x[0] == "top"
                ? margin[0] + nh
                : (x[0] == "bottom"
                    ? - margin[2] - nh
                    : 0));
        }
        else if (this.lastPos[1] > ww + scrolled[1] - nw || this.lastPos[1] < scrolled[1]) {
            this.lastPos[0] += (x[0] == "top"
                ? nh + margin[0]
                : (x[0] == "bottom"
                    ? - nh - margin[0]
                    : 0));
            this.sign *= -1;
            this.lastPos[1] += x[0] == "center"
                ? 0
                : this.sign * (x[1] == "left"
                    ? margin[3] + nw
                    : (x[1] == "right"
                        ? - margin[1] - nw
                        : 0));
        }

        /* Start from begining if entire screen is filled */
        if (this.lastPos) {
            if ((this.lastPos[0] > wh + scrolled[0] - nh || this.lastPos[0] < scrolled[1])
              && this.arrange == "horizontal") {
                this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin, this.startPadding);
                this.sign = 1;
            }
            if ((this.lastPos[1] > ww + scrolled[1] - nw || this.lastPos[1] < scrolled[1])
              && this.arrange == "vertical") {
                this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin, this.startPadding);
                this.sign = 1;
            }
        }  

        oNoti.style.left = this.lastPos[1] + "px";
        oNoti.style.top  = this.lastPos[0] + "px";

        if ((x[0] == "top" && this.sign == 1) || (x[0] == "bottom" && this.sign == -1)) {
            if (this.arrange == "vertical") {
                this.lastPos[0] += x[1] == "center"
                    ? 0
                    : this.sign * (x[0] == "top"
                        ? margin[0] + nh
                        : (x[0] == "bottom"
                            ? - margin[2] - nh
                            : 0));
            }
            else {
                this.lastPos[1] += x[0] == "center"
                    ? 0
                    : this.sign * (x[1] == "left"
                        ? margin[3] + nw
                        : (x[1] == "right"
                            ? - margin[1] - nw
                            : 0));
            }
        };

        var isMouseOver = false;

        apf.tween.css(oNoti, "fade", {
            anim     : apf.tween.NORMAL,
            steps    : 10,
            interval : 10,
            onfinish : function(container) {
                oNoti.style.filter = "";
                $setTimeout(hideWindow, _self.timeout)
            }
        });

        function hideWindow() {
            if (isMouseOver)
                return;

            apf.tween.css(oNoti, "notifier_hidden", {
                anim    : apf.tween.NORMAL,
                steps   : 10,
                interval: 20,
                onfinish: function(container) {
                    apf.setStyleClass(oNoti, "", ["notifier_hover"]);
                    if (isMouseOver)
                        return;

                    if (oNoti.parentNode) {
                        if (oNoti.parentNode.removeChild(oNoti) && !removed) {
                            _self.showing--;
                            removed = true;
                        }
                    }

                    if (_self.showing == 0)
                        _self.lastPos = null;
                }
            });
        }

        /* Events */
        oNoti.onmouseover = function(e) {
            e = (e || event);
            var tEl = e.explicitOriginalTarget || e.toElement;
            if (isMouseOver)
                return;
            if (tEl == oNoti || apf.isChildOf(oNoti, tEl)) {
                apf.tween.css(oNoti, "notifier_hover", {
                    anim    : apf.tween.NORMAL,
                    steps   : 10,
                    interval: 20,
                    onfinish: function(container) {
                        apf.setStyleClass(oNoti, "", ["notifier_shown"]);
                    }
                });
                
                isMouseOver = true;
            }
        };

        oNoti.onmouseout = function(e) {
            e = (e || event);
            var tEl = e.explicitOriginalTarget || e.toElement;

            if (!isMouseOver)
                return;

            if (apf.isChildOf(tEl, oNoti) ||
               (!apf.isChildOf(oNoti, tEl) && oNoti !== tEl )) {
                isMouseOver = false;
                hideWindow();
            }
        };

        if (ev) {
            oNoti.onclick = function() {
                ev.dispatchEvent("click");
            };
        }
    };

    // *** Init *** //

    this.$draw = function() {
        //Build Main Skin
        this.$pHtmlNode = document.body;
        
        this.$ext = this.$getExternal("notification");
        this.$ext.style.display  = "none";
        this.$ext.style.position = "absolute";
        apf.window.zManager.set("notifier", this.$ext);
    };
}).call(apf.notifier.prototype = new apf.Presentation());

apf.aml.setElement("notifier", apf.notifier);
apf.aml.setElement("event", apf.event);
// #endif
