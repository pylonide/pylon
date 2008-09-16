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
    
    this.__supportedProperties.push("margin", "position", "width", "timeout");

    var lastPos = null;
    var showing = 0;
    var _self   = this;

    this.popupEvent = function(ev){       
        var oNoti = this.pHtmlNode.appendChild(this.oExt.cloneNode(true));        
        
        this.__getLayoutNode("notification", "message", oNoti).innerHTML = ev.message;
        var oIcon = this.__getLayoutNode("notification", "icon", this.oExt);
        if (oIcon) {
            if (oIcon.nodeType == 1)
                oIcon.style.backgroundImage = "url(" + this.iconPath + ev.icon + ")";
            else
                oIcon.nodeType = this.iconPath + ev.icon;
        }
        oNoti.style.display = "block";
        
        /*
            I have added an example here which does it from left-top, you 
            should expand this to all positions
        */
        var margin = jpf.getBox(this.margin || "0");
        if (!lastPos) {
            //if (this.position == "left-top")
            lastPos = [margin[3], margin[0]];
        }
        
        //if (this.position == "left-top") {
        
        oNoti.style.left = lastPos[0] + "px";
        lastPos[1] += oNoti.offsetHeight + 20; //this margin will later be read from css
        oNoti.style.top  = lastPos[1] + "px";
        //}
        
        showing++;
        
        jpf.tween.single(oNoti, {
            type    : 'fade', 
            from    : 0, 
            to      : 1, 
            anim    : jpf.NORMAL, 
            onfinish: function(container){
                setTimeout(function(){
                    jpf.tween.single(oNoti, {
                        type    : 'fade', 
                        from    : 1, 
                        to      : 0, 
                        anim    : jpf.NORMAL, 
                        onfinish: function(){
                            showing--;
                            oNoti.parentNode.removeChild(oNoti);
                            if (!showing)
                                lastPos = null;
                        }
                    });
                }, _self.timeout);
            }
        });
    }

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal("notification");
        this.oExt.style.display = "none";
    }
    
    this.__loadJML = function(x) {
        var i, l, nodes = x.childNodes;
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1)
                continue;
            
            if (node[jpf.TAGNAME] == "event") {
                var ev = new jpf.notifier.event(this.pHtmlNode, "event", this);
                
                ev.handlePropSet("when", node.getAttribute("when"), false);
                ev.loadJML(node);
                this.childNodes.push(ev);                
            }
        }
    }
}).implement(jpf.Presentation);

//@todo You might want to add icons to the event as well
jpf.notifier.event = jpf.subnode(jpf.NOGUI_NODE, function(){
    this.__supportedProperties = ["when", "message", "icon"];
    
    this.handlePropSet = function(prop, value, force){
        this[prop] = value;
        
        if (prop == "when" && this.parentNode && this.parentNode.popupEvent)
            this.parentNode.popupEvent(this);
    }
    
    this.loadJML = function(x){
        this.message = x.getAttribute("message") || "[Empty]";
    }
});