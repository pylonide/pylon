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

    this.getStartPosition = function(x, wh, ww, nh, nw) {
         var bodyStyle = jpf.isIE ? document.body.currentStyle : document.body.style;
         var ver = (x[0] == "top" ? parseInt(bodyStyle.marginTop) : (x[0] == "bottom" ? wh - nh - parseInt(bodyStyle.marginBottom) : wh/2 - nh/2));
         var hor = (x[1] == "left" ? parseInt(bodyStyle.marginLeft) : (x[1] == "right" ? ww - nw - parseInt(bodyStyle.marginRight) : ww/2 - nw/2));
         sign = 1;

         return lastPos = [ver, hor];
    }

    this.popup = function(message, icon, ev) {
        this.oExt.style.width = this.columnsize + "px";
        var oNoti = this.pHtmlNode.appendChild(this.oExt.cloneNode(true));
        var ww = jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth;
        var wh = jpf.isIE ? document.documentElement.offsetHeight : window.innerHeight;
        var removed = false;

		
        

        var oIcon = this.__getLayoutNode("notification", "icon", oNoti); 
        var oBody = this.__getLayoutNode("notification", "body", oNoti);

        showing++;

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
            lastPos = this.getStartPosition(x, wh, ww, nh, nw);
        }

        if((showing !==1 && x[0] == "bottom" && sign == 1) || (x[0] == "top" && sign == -1)) {
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

        /* Start from begining if You fill entire screen */
        if(lastPos){
            if((lastPos[0] > wh -nh || lastPos[0] < 0) && this.arrange == "horizontal") {
                lastPos = this.getStartPosition(x, wh, ww, nh, nw);
            }
            if((lastPos[1] > ww -nw || lastPos[1] < 0) && this.arrange == "vertical") {
                lastPos = this.getStartPosition(x, wh, ww, nh, nw);
            }
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

        var isMouseOver = false;

        jpf.tween.css(oNoti, "notifier_shown", {
            anim: jpf.tween.NORMAL,
            steps: 15,
            interval: 10,
            onfinish: function(container) {
                setTimeout(hideWindow, _self.timeout)
            }
        });

        //setTimeout(hideWindow, _self.timeout + 300);

        function hideWindow() {
            if (isMouseOver)
                return;

            jpf.tween.css(oNoti, "notifier_hidden", {
                anim    : jpf.tween.NORMAL,
                steps   : 15,
                interval: 10,
                onfinish: function(container) {
                    _self.__setStyleClass(oNoti, "", ["notifier_hover"]);
                    if (isMouseOver)
                        return;
                    if(oNoti.parentNode) {
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
            var e = (e || event);
            var tEl = e.explicitOriginalTarget || e.toElement;
            if(isMouseOver)
                return;
            if(tEl == oNoti || jpf.xmldb.isChildOf(oNoti, tEl)) {
                jpf.tween.css(oNoti, "notifier_hover", {
                    anim    : jpf.tween.NORMAL,
                    steps   : 10,
                    interval: 10,
                    onfinish: function(container) {
                        _self.__setStyleClass(oNoti, "", ["notifier_shown"]);
                    }
                });

                isMouseOver = true;
            }
        }

        oNoti.onmouseout = function(e) {
            var e = (e || event);
            var tEl = e.explicitOriginalTarget || e.toElement;

            if(!isMouseOver)
                return;

            if(jpf.xmldb.isChildOf(tEl, oNoti) || (!jpf.xmldb.isChildOf(oNoti, tEl) && oNoti !== tEl )) {

                isMouseOver = false;
                hideWindow();
            }
        }
    
	    if (ev) {
	        oNoti.onclick = function(){
	            ev.dispatchEvent("onclick");
	        }
	    }
   
    }


    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal("notification");
        this.oExt.style.display = "none";
        this.oExt.style.position = "absolute";
    }

    this.__loadJml = function(x) {
        var nodes = x.childNodes;

        for (var l = nodes.length-1, i = 0; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1)
                continue;

            if (node[jpf.TAGNAME] == "event") {
                ev = new jpf.event(this.pHtmlNode, "event", this);
                //jpf.JmlNode(node);				

            }
        }
	}
	
	this.addEventListener("onclick", function(e){
	
	});
}).implement(jpf.Presentation);

jpf.event = jpf.component(jpf.NOGUI_NODE, function() {
    this.__supportedProperties.push("when", "message", "icon");

    var hasInitedWhen = false;
    
    this.__propHandlers["when"] = function(value) {
        
		if (hasInitedWhen && value && this.parentNode && this.parentNode.popup) {             
			 this.parentNode.popup(this.message, this.icon, this);
        }
        
        hasInitedWhen = true;
    }

    this.__loadJml = function(x) {    	
	}
});