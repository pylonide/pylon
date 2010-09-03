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
 * Notification element, which shows popups when events occur. Similar
 * to growl on the OSX platform.
 * Example:
 * <code>
 *  <a:notifier position="bottom-right" margin="10 10">
 *      <a:event 
 *        when    = "{offline.onLine}"
 *        message = "You are currently working offline"
 *        icon    = "icoOffline.gif" />
 *      <a:event 
 *        when    = "{!offline.onLine}"
 *        message = "You are online"
 *        icon    = "icoOnline.gif" />
 *      <a:event 
 *        when    = "{offline.syncing}" 
 *        message = "Your changes are being synced" 
 *        icon    = "icoSyncing.gif" />
 *      <a:event 
 *        when    = "{!offline.syncing}"
 *        message = "Syncing done"
 *        icon    = "icoDone.gif" />
 *  </a:notifier>
 * </code>
 * Example:
 * Notifier with 4 notifications which appears and stays over the 3 seconds
 * begins to the top right corner and goes to the left. First notification will
 * be displayed when value in textbox will be bigger than 4. In next two cases 
 * notification will be shown when notifier's position or arrange attribute will 
 * be changed. In the last case notification will be shown when date 2008-12-24 
 * will be selected on calendar.
 * <code>
 *  <a:notifier id="notiTest" position="top-right" margin="20" timeout="3" arrange="horizontal" columnsize="200">
 *      <a:event when="{txtNumber.value > 4}" message="Incorrect value, please enter a number not bigger than 4." icon="evil.png"></a:event>
 *      <a:event when="{notiTest.position}" message="Notifier display position has been changed"></a:event>
 *      <a:event when="{notiTest.arrange}" message="Notifier display arrange has been changed"></a:event>
 *      <a:event when="{txtDrop.value == '2008-12-24'}" message="Marry christmas !" icon="Reindeer.png" ></a:event>
 *  </a:notifier>
 * </code>
 * 
 * @define notifier
 * @attribute   {String}   position     Vertical and horizontal element's start
 *                                      position, it can be changed in any time,
 *                                      default is 'top-right'
 *     Possible values:
 *     top-right       element is placed in top-right corner of browser window
 *     top-left        element is placed in top-left corner of browser window
 *     bottom-right    element is placed in bottom-right corner of browser window
 *     bottom-left     element is placed in bottom-left corner of browser window
 *     center-center   element is placed in the middle of browser window
 *     right-top       element is placed in top-right corner of browser window
 *     left-top        element is placed in top-left corner of browser window
 *     right-bottom    element is placed in bottom-right corner of browser window
 *     left-bottom     element is placed in bottom-left corner of browser window
 *     center-center   element is placed in the middle of browser window
 * @attribute   {String}   margin       It's a free space around popup element,
 *                                      default is '10 10 10 10' pixels
 * @attribute   {String}   columnsize   Specify element width and col width where
 *                                      element will be displayed, default is 300 pixels
 * @attribute   {String}   arrange      popup elements can be displayed in rows
 *                                      or columns, default is 'vertical'
 *     Possible values:
 *     vertical     element will be displayed in rows
 *     horizontal   element will be displayed in columns
 * @attribute   {String}   timeout      After the timeout has passed the popup
 *                                      will dissapear automatically. When the
 *                                      mouse hovers over the popup it doesn't
 *                                      dissapear, default is 2 seconds
 * $attribute   {String}   onclick      It's an action executed after user click
 *                                      on notifier cloud
 * 
 * @constructor
 *
 * @inherits apf.Presentation
 * 
 * @author      
 * @version     %I%, %G% 
 * 
 * @allowchild event
 */
apf.notifier = function(struct, tagName){
    this.$init(tagName || "notifier", apf.NODE_VISIBLE, struct);
};

(function() {
    this.timeout    = 2000;
    this.position   = "top-right";
    this.columnsize = 300;
    this.arrange    = "vertical";
    this.margin     = "10 10 10 10";

    this.lastPos    = null;
    this.showing    = 0;
    this.sign       = 1;

    this.$supportedProperties.push("margin", "position", "timeout",
        "columnsize", "arrange");

    this.$propHandlers["position"] = function(value) {
        this.lastPos = null;
    };
    
    this.$propHandlers["margin"] = function(value) {
        this.margin = value;
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

    function getStartPosition(x, wh, ww, nh, nw, margin) {
        var scrolled = getPageScroll();

        return [
             (x[0] == "top"
                 ? margin[0]
                 : (x[0] == "bottom"
                     ? wh - nh - margin[2]
                     : wh / 2 - nh / 2)) + scrolled[0],
             (x[1] == "left"
                 ? margin[3]
                 : (x[1] == "right"
                     ? ww - nw - margin[1]
                     : ww / 2 - nw / 2)) + scrolled[1]
        ];
    }

    /**
     * Function creates new notifie popup element
     * 
     * @param {String}  message  Message content displaing in popup element,
     *                           default is [No message]
     * @param {String}  icon     Path to icon file relative to "icon-path" which
     *                           is set in skin declaration
     * @param {Object}  ev       object representation of event
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
            this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin);
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
                this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin);
                this.sign = 1;
            }
            if ((this.lastPos[1] > ww + scrolled[1] - nw || this.lastPos[1] < scrolled[1])
              && this.arrange == "vertical") {
                this.lastPos = getStartPosition(x, wh, ww, nh, nw, margin);
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
                        this.lastPos = null;
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

    /**** Init ****/

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
