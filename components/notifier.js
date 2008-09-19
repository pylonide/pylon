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

/**
 * Notification componenet, which shows popups when new events happen. Similar
 * to growl on the OSX platform.
 * Example:
 * <pre class="code">
 * <j:notifier position="bottom-right" margin="10,10">
 *     <j:event when="{offline.isOnline}" message="You are currently working offline" icon="icoOffline.gif" />
 *     <j:event when="{!offline.isOnline}" message="You are online" icon="icoOnline.gif" />
 *     <j:event when="{offline.syncing}" message="Your changes are being synced" icon="icoSyncing.gif" />
 *     <j:event when="{!offline.syncing}" message="Syncing done" icon="icoDone.gif" />
 * </j:notifier>
 * </pre>
 */
jpf.notifier = jpf.component(jpf.GUI_NODE, function() {
    this.pHtmlNode = document.body;
    this.timeout   = 2000;//in milliseconds
    this.position  = "top-right";

    this.__supportedProperties.push("margin", "position", "width", "timeout", "columnsize");

    var lastPos = null;
    var showing = 0;
    var _self   = this;
    var sign    = 1;
    var howmany = 0;

    this.popup = function(message, icon) {
        this.oExt.style.width = this.columnsize + "px";
        var oNoti = this.pHtmlNode.appendChild(this.oExt.cloneNode(true));
        var ww = jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth;
        var wh = jpf.isIE ? document.documentElement.offsetHeight : window.innerHeight;
        howmany++;

        var oIcon = this.__getLayoutNode("notification", "icon", oNoti); 
        var oBody = this.__getLayoutNode("notification", "body", oNoti);

        if(icon) {
            if (oIcon) {
                if (oIcon.nodeType == 1) {
                    oIcon.style.backgroundImage = "url(" + this.iconPath + icon + ")";
                }
                else
                    oIcon.nodeType = this.iconPath + icon;
            }  
            
            this.__setStyleClass(oBody, "hasico");

            oBody.insertAdjacentHTML("beforeend", message);
        }
        else{
            oBody.innerHTML = message;
        }


        oNoti.style.display = "block";

        var margin = jpf.getBox(this.margin || "0");

        var nh = oNoti.offsetHeight;
        var nw = oNoti.offsetWidth;
        
        var x = this.position.split("-");

        /* start positions */
        if (!lastPos) {
            var bodyStyle = jpf.isIE ? document.body.currentStyle : document.body.style;
            var ver = (x[0] == "top" ? parseInt(bodyStyle.marginTop) : (bodyStyle.marginTop == "bottom" ? wh - nh - parseInt(bodyStyle.marginBottom) : wh/2 - nh/2));
            var hor = (x[1] == "left" ? parseInt(bodyStyle.marginLeft) : (x[1] == "right" ? ww - nw - parseInt(bodyStyle.marginRight) : ww/2 - nw/2));
            sign = 1;

            lastPos = [ver, hor];
        }

        if((howmany !==1 && x[0] == "bottom" && sign == 1) || (x[0] == "top" && sign == -1)) {
            if(this.arrange == "vertical"){
                lastPos[0] += x[1] == "center" ? 0 : sign*(x[0] == "top" ? margin[0] + nh : (x[0] == "bottom" ? - margin[2] - nh : 0));
            }
            else{
                lastPos[1] += x[0] == "center" ? 0 : sign*(x[1] == "left" ? margin[3] + nw : (x[1] == "right" ? - margin[1] - nw : 0));
            }
        }

        /* reset to next line, first for vertical, second horizontal */
        if(lastPos[0] > wh - nh || lastPos[0] < 0) {
            lastPos[1] += (x[1] == "left" ? nw + margin[3] : (x[1] == "right" ? - nw - margin[3] : 0));
            sign *= -1;
            lastPos[0] += sign*(x[0] == "top" ? margin[0] + nh : (x[0] == "bottom" ? - margin[2] - nh : 0));
        }
        else if(lastPos[1] > ww - nw || lastPos[1] < 0) {
            lastPos[0] += (x[0] == "top" ? nh + margin[0] : (x[0] == "bottom" ? - nh - margin[0] : 0));
            sign *= -1;
            lastPos[1] += x[0] == "center" ? 0 : sign*(x[1] == "left" ? margin[3] + nw : (x[1] == "right" ? - margin[1] - nw : 0));
        }

        oNoti.style.left = lastPos[1] + "px";
        oNoti.style.top  = lastPos[0] + "px";

        if((x[0] == "top" && sign == 1) || (x[0] == "bottom" && sign == -1)) {
            if(this.arrange == "vertical"){
                lastPos[0] += x[1] == "center" ? 0 : sign*(x[0] == "top" ? margin[0] + nh : (x[0] == "bottom" ? - margin[2] - nh : 0));
            }
            else{
                lastPos[1] += x[0] == "center" ? 0 : sign*(x[1] == "left" ? margin[3] + nw : (x[1] == "right" ? - margin[1] - nw : 0));
            }
        }

        showing++;

        var isMouseOver = false;
        jpf.tween.single(oNoti, {
            type    : 'fade',
            from    : 0,
            to      : 0.8,
            anim    : jpf.tween.NORMAL,
            steps   : 10,
            interval: 10,
            onfinish: function(container){
                setTimeout(hideWindow, _self.timeout);
            }
        });

        function hideWindow() {
            if (isMouseOver)
                return;

            jpf.tween.single(oNoti, {
                type    : 'fade', 
                from    : 0.8, 
                to      : 0, 
                anim    : jpf.tween.NORMAL, 
                steps   : 10,
                interval: 10,
                onfinish: function(){
                    showing--;
                    howmany--;
                    if (!showing){
                        lastPos = null;
                    }
                    if(oNoti.parentNode){
                        oNoti.parentNode.removeChild(oNoti);
                    }
                }
            });
        }

        /* Events */
        oNoti.onmouseover = function(e){
            isMouseOver = true;
            jpf.tween.fade(oNoti, 1);
        }

        oNoti.onmouseout = function(e){
            jpf.tween.fade(oNoti, 0.8);
            isMouseOver = false;
            setTimeout(hideWindow, _self.timeout);
        }
    }

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal("notification");
        this.oExt.style.display = "none";
        this.oExt.style.position = "absolute";
    }

    this.__loadJML = function(x) {
        var nodes = x.childNodes;

        for (var l = nodes.length-1, i = 0; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1)
                continue;

            if (node[jpf.TAGNAME] == "event") {
                var ev = new jpf.notifier.event(this.pHtmlNode, "event", this);
                ev.loadJML(node);

                if (!node.getAttribute("when"))
                    continue;

                if (jpf.isParsing) {
                    jpf.JmlParser.stateStack.push({
                        node  : ev,
                        name  : "when",
                        value : node.getAttribute("when")
                    });
                }
                else {
                    ev.setDynamicProperty("when", node.getAttribute("when"));
                }
            }
        }
    }
}).implement(jpf.Presentation);

jpf.notifier.event = jpf.subnode(jpf.NOGUI_NODE, function() {
    this.__supportedProperties = ["when", "message", "icon"];

    var hasInitedWhen = false;
    this.handlePropSet = function(prop, value, force) {
        this[prop] = value;

        if (hasInitedWhen && prop == "when" && value
          && this.parentNode && this.parentNode.popup) {
            this.parentNode.popup(this.message, this.icon);
        }

        hasInitedWhen = true;
    }

    this.loadJML = function(x) {
        this.jml     = x;
        this.message = x.getAttribute("message") || "[Empty]";
        this.icon = x.getAttribute("icon");
    }
});