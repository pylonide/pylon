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

// #ifdef __JNOTIFIER || __INC_ALL
/**
 * Notification element, which shows popups when events occur. Similar
 * to growl on the OSX platform.
 * Example:
 * <code>
 * <j:notifier position="bottom-right" margin="10 10">
 *     <j:event 
 *         when    = "{offline.onLine}"
 *         message = "You are currently working offline"
 *         icon    = "icoOffline.gif" />
 *     <j:event 
 *         when    = "{!offline.onLine}"
 *         message = "You are online"
 *         icon    = "icoOnline.gif" />
 *     <j:event 
 *         when    = "{offline.syncing}" 
 *         message = "Your changes are being synced" 
 *         icon    = "icoSyncing.gif" />
 *     <j:event 
 *         when    = "{!offline.syncing}"
 *         message = "Syncing done"
 *         icon    = "icoDone.gif" />
 * </j:notifier>
 * </code>
 * Example:
 * Notifier with 4 notifications which will be appears and stays over the 3 seconds
 * begins to the top right corner and goes to the left. First notification will
 * be displayed when value in textbox will be bigger than 4. In next two cases 
 * notification will be shown when notifier's position or arrange attribute will 
 * be changed. In the last case notification will be shown when date 2008-12-24 
 * will be selected on calendar.
 * <code>
 * <j:notifier id="notiTest" position="top-right" margin="20" timeout="3" arrange="horizontal" columnsize="200">
 *     <j:event when="{txtNumber.value > 4}" message="Incorrect value, please enter a number not bigger than 4." icon="evil.png"></j:event>
 *     <j:event when="{notiTest.position}" message="Notifier display position has been changed"></j:event>
 *     <j:event when="{notiTest.arrange}" message="Notifier display arrange has been changed"></j:event>
 *     <j:event when="{txtDrop.value == '2008-12-24'}" message="Marry christmas !" icon="Reindeer.png" ></j:event>
 * </j:notifier>
 * </code>
 * 
 * @define notifier
 * @attribute   {String}   position     Vertical and horizontal element's start position, it can be changed in any time, default is 'top-right'
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
 * @attribute   {String}   margin       It's a free space around popup element, default is '10 10 10 10' pixels
 * @attribute   {String}   columnsize   Specify element width and col width where element will be displayed, default is 300 pixels
 * @attribute   {String}   arrange      popup elements can be displayed in rows or columns, default is 'vertical'
 *     Possible values:
 *     vertical     element will be displayed in rows
 *     horizontal   element will be displayed in columns
 * @attribute   {String}   timeout      After the timeout has passed the popup will dissapear automatically. When the mouse hovers over the popup it doesn't dissapear, default is 2 seconds
 * $attribute   {String}   onclick      It's an action executed after user click on notifier cloud
 * 
 * @constructor
 *
 * @inherits jpf.Presentation
 * 
 * @author      
 * @version     %I%, %G% 
 * 
 * @allowchild event
 */
jpf.notifier = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode  = document.body;
    this.timeout    = 2000;
    this.position   = "top-right";
    this.columnsize = 300;
    this.arrange    = "vertical";
    this.margin     = "10 10 10 10";

    var lastPos = null;
    var showing = 0;
    var _self   = this;
    var sign    = 1;


    this.$supportedProperties.push("margin", "position", "timeout",
        "columnsize", "arrange");

    this.$propHandlers["position"] = function(value) {
        lastPos = null;
    }
    
    this.$propHandlers["timeout"] = function(value) {
        this.timeout = parseInt(value) * 1000;
    }

    function getStartPosition(x, wh, ww, nh, nw) {
         var margin = jpf.getBox(document.body.style.margin || "10");

         var ver = (x[0] == "top"
             ? margin[0]
             : (x[0] == "bottom"
                 ? wh - nh - margin[2]
                 : wh/2 - nh/2)) + document.documentElement.scrollTop;
         var hor = (x[1] == "left" 
             ? margin[3]
             : (x[1] == "right"
                 ? ww - nw - margin[1]
                 : ww/2 - nw/2)) + document.documentElement.scrollLeft;
         sign = 1;

         return lastPos = [ver, hor];
    }

    /**
     * Function creates new notifie popup element
     * 
     * @param {String}  message  Message content displaing in popup element, default is [No message]
     * @param {String}  icon     Path to icon file relative to "icon-path" which is set in skin declaration
     * @param {Object}  ev       object representation of event
     * 
     */
    this.popup = function(message, icon, ev) {
        if (!this.oExt)
            return;

        this.oExt.style.width = this.columnsize + "px";
        var oNoti = this.pHtmlNode.appendChild(this.oExt.cloneNode(true));
        var ww = jpf.isIE
            ? document.documentElement.offsetWidth
            : window.innerWidth;
        var wh = jpf.isIE 
            ? document.documentElement.offsetHeight
            : window.innerHeight;
        var removed = false;

        var oIcon = this.$getLayoutNode("notification", "icon", oNoti);
        var oBody = this.$getLayoutNode("notification", "body", oNoti);

        showing++;

        if (oIcon && icon) {
            if (oIcon.nodeType == 1)
                oIcon.style.backgroundImage = "url("
                + this.iconPath + icon + ")";
            else
                oIcon.nodeValue = this.iconPath + icon;

            this.$setStyleClass(oNoti, this.baseCSSname + "ShowIcon");
        }

        oBody.insertAdjacentHTML("beforeend", message || "[No message]");
        oNoti.style.display = "block";

        var margin = jpf.getBox(this.margin || "0");
        var nh     = oNoti.offsetHeight;
        var nw     = oNoti.offsetWidth;

        /* It's possible to set for example: position: top-right or right-top */
        var x = this.position.split("-");
        if(x[1] == "top" || x[1] == "bottom" ||
           x[0] == "left" || x[0] == "right") {
            var tmp = x[1];
            x[1] = x[0];
            x[0] = tmp;
        }
        /* center-X and X-center are disabled */
        if((x[0] == "center" && x[1] !== "center") ||
           (x[0] !== "center" && x[1] == "center")) {
            x = ["top", "right"];
        }

        var _reset = false;
        /* start positions */
        if (!lastPos) {
            lastPos = getStartPosition(x, wh, ww, nh, nw);
            _reset = true;
        }

        if ((!_reset && x[0] == "bottom" && sign == 1) ||
           (x[0] == "top" && sign == -1)) {
            if (this.arrange == "vertical") {
                lastPos[0] += x[1] == "center"
                    ? 0
                    : sign*(x[0] == "top"
                        ? margin[0] + nh
                        : (x[0] == "bottom"
                            ? - margin[2] - nh
                            : 0));
            }
            else {
                lastPos[1] += x[0] == "center"
                    ? 0
                    : sign*(x[1] == "left"
                        ? margin[3] + nw
                        : (x[1] == "right"
                            ? - margin[1] - nw
                            : 0));
            }
        }

        /* reset to next line, first for vertical, second horizontal */
        if (lastPos[0] > wh - nh || lastPos[0] < 0) {
            lastPos[1] += (x[1] == "left"
                ? nw + margin[3]
                : (x[1] == "right"
                    ? - nw - margin[3]
                    : 0));
            sign *= -1;
            lastPos[0] += sign*(x[0] == "top"
                ? margin[0] + nh
                : (x[0] == "bottom"
                    ? - margin[2] - nh
                    : 0));
        }
        else if (lastPos[1] > ww - nw || lastPos[1] < 0) {
            lastPos[0] += (x[0] == "top"
                ? nh + margin[0]
                : (x[0] == "bottom"
                    ? - nh - margin[0]
                    : 0));
            sign *= -1;
            lastPos[1] += x[0] == "center"
                ? 0
                : sign*(x[1] == "left"
                    ? margin[3] + nw
                    : (x[1] == "right"
                        ? - margin[1] - nw
                        : 0));
        }

        /* Start from begining if entire screen is filled */
        if (lastPos) {
            if ((lastPos[0] > wh -nh || lastPos[0] < 0) && 
                this.arrange == "horizontal") {
                lastPos = getStartPosition(x, wh, ww, nh, nw);
            }
            if ((lastPos[1] > ww -nw || lastPos[1] < 0) && 
                this.arrange == "vertical") {
                lastPos = getStartPosition(x, wh, ww, nh, nw);
            }
        }  

        oNoti.style.left = lastPos[1] + "px";
        oNoti.style.top  = lastPos[0] + "px";

        if ((x[0] == "top" && sign == 1) || (x[0] == "bottom" && sign == -1)) {
            if (this.arrange == "vertical") {
                lastPos[0] += x[1] == "center"
                    ? 0
                    : sign*(x[0] == "top"
                        ? margin[0] + nh
                        : (x[0] == "bottom"
                            ? - margin[2] - nh
                            : 0));
            }
            else {
                lastPos[1] += x[0] == "center"
                    ? 0
                    : sign*(x[1] == "left"
                        ? margin[3] + nw
                        : (x[1] == "right"
                            ? - margin[1] - nw
                            : 0));
            }
        };

        var isMouseOver = false;

        jpf.tween.css(oNoti, "notifier_shown", {
            anim     : jpf.tween.NORMAL,
            steps    : 10,
            interval : 10,
            onfinish : function(container) {
                setTimeout(hideWindow, _self.timeout)
            }
        });

        function hideWindow() {
            if (isMouseOver)
                return;

            jpf.tween.css(oNoti, "notifier_hidden", {
                anim    : jpf.tween.NORMAL,
                steps   : 10,
                interval: 20,
                onfinish: function(container) {
                    _self.$setStyleClass(oNoti, "", ["notifier_hover"]);
                    if (isMouseOver)
                        return;
                    if (oNoti.parentNode) {
                        if(oNoti.parentNode.removeChild(oNoti) && !removed) {
                            showing--;
                            removed = true;
                        }
                    }
                    if (!showing) {
                        lastPos = null;
                    }
                }
            });
        }

        /* Events */
        oNoti.onmouseover = function(e) {
            e = (e || event);
            var tEl = e.explicitOriginalTarget || e.toElement;
            if (isMouseOver)
                return;
            if (tEl == oNoti || jpf.xmldb.isChildOf(oNoti, tEl)) {
                jpf.tween.css(oNoti, "notifier_hover", {
                    anim    : jpf.tween.NORMAL,
                    steps   : 10,
                    interval: 20,
                    onfinish: function(container) {
                        _self.$setStyleClass(oNoti, "", ["notifier_shown"]);
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

            if (jpf.xmldb.isChildOf(tEl, oNoti) ||
               (!jpf.xmldb.isChildOf(oNoti, tEl) && oNoti !== tEl )) {
                isMouseOver = false;
                hideWindow();
            }
        };

        if (ev) {
            oNoti.onclick = function() {
                ev.dispatchEvent("click");
            }
        }
    };

    /**** Init ****/

    this.$draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal("notification");
        this.oExt.style.display = "none";
        this.oExt.style.position = "absolute";
        this.oExt.style.zIndex = 100000;
    };

    this.$loadJml = function(x) {
        var ev, node, nodes = x.childNodes;

        for (var l = nodes.length-1, i = 0; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1)
                continue;

            if (node[jpf.TAGNAME] == "event")
                ev = new jpf.event(this.pHtmlNode, "event").loadJml(node, this)
        }
    };
}).implement(jpf.Presentation);

/**
 * Displays a popup element with a message with optionally an icon at the
 * position specified by the position attribute. After the timeout has passed
 * the popup will dissapear automatically. When the mouse hovers over the popup
 * it doesn't dissapear.
 *
 * @event click Fires when the user clicks on the representation of this event.
 */
jpf.event = jpf.component(jpf.NODE_HIDDEN, function() {
    var _self         = this;
    var hasInitedWhen = false;

    this.$booleanProperties["repeat"] = true;
    this.$supportedProperties.push("when", "message", "icon", "repeat");

    this.$propHandlers["when"] = function(value) {
        if (hasInitedWhen && value && this.parentNode && this.parentNode.popup) {
            setTimeout(function() {
                _self.parentNode.popup(_self.message, _self.icon, _self);
            });
        }
        hasInitedWhen = true;

        if (this.repeat)
            delete this.when;
    };

    this.$loadJml = function(x) {
    };
});

// #endif
