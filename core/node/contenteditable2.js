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
var __CONTENTEDITABLE__  = 1 << 24;

// #ifdef __WITH_CONTENTEDITABLE

apf.ContentEditable2 = function() {
    this.$regbase = this.$regbase | __DRAGDROP__;

    var _self = this;
    
    if (!apf.ContentEditable2.resize)
        apf.ContentEditable2.resize = new apf.Resize();
    
    this.$propHandlers["editable"] = function(value, prop){
        apf.ContentEditable2.resize.initElement(this);
        this.isEditable = true;
    }
    
    this.$addAmlLoader(function(x){
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (typeof nodes[i].editable == "undefined") {
                if (nodes[i].nodeFunc == apf.NODE_VISIBLE)
                    nodes[i].setProperty("editable", true);
                else {
                    nodes[i].isEditable = true;
                    arguments.callee.apply(nodes[i], arguments);
                }
            }
        }
        
        if (!this.parentNode.isEditable) {
            //@todo Use new property events in apf3.0
            setTimeout(function(){
                apf.ContentEditable2.resize.grab(_self);
            });
        }
    });
    
    this.$amlDestroyers.push(function(){
        
    });
};

apf.Resize = function(){
    apf.makeClass(this);

    this.$propHandlers = [];
    this.implement(apf.Interactive);
    
    this.draggable = true;
    this.resizable = true;
    this.dragOutline = true;
    this.dragSelection = true;
    
    var _self = this;
    var div, nodes = [], pos = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    while (nodes.length != 8) {
        div = document.body.appendChild(document.createElement("div"));
        div.className = "grabber";
        div.style.display = "none";
        div.onmousedown = mousedown;
        
        nodes.push(div);
        nodes[(div.type = pos.pop())] = div;
    }
    
    this.initElement = function(el){
        el.oExt.onmousedown = function(e){
            _self.grab(el);
            (e || event).cancelBubble = true;
        }
        this.$propHandlers["draggable"].call({oExt: el.oExt}, true);
    }
    
    var selected, size = 8, margin = 1, anchors;
    this.grab = function(oEl, options) {
        if (this.oExt) {
            apf.layout.removeRule(this.oExt, "contenteditable");
            apf.layout.activateRules(oEl);
        }
        
        if (oEl.nodeFunc) {
            selected = oEl;
            anchors = oEl.$anchors && oEl.$anchors.length 
                ? oEl.$anchors
                : [oEl.top, oEl.right, oEl.bottom, oEl.left];
            oEl = oEl.oExt;
            this.oExt = oEl;
        }
        
        this.regrab();
        
        //Show
        for (var i = 0; i < 8; i++) {
            nodes[i].style.display = "block";
        }

        if (anchors) {
            apf.setStyleClass(nodes.n, anchors[0] ? "grabber_selected" : "", ["grabber_selected"]);
            apf.setStyleClass(nodes.e, anchors[1] ? "grabber_selected" : "", ["grabber_selected"]);
            apf.setStyleClass(nodes.s, anchors[2] ? "grabber_selected" : "", ["grabber_selected"]);
            apf.setStyleClass(nodes.w, anchors[3] ? "grabber_selected" : "", ["grabber_selected"]);
        }

        //This should all be removed on ungrab
        apf.layout.setRules(oEl, "contenteditable", "apf.all[" + this.uniqueId + "].regrab()", true);
        apf.layout.activateRules(oEl);
        
        _self.onresize = function(){
            var pHtmlNode = selected.oExt.offsetParent;
            if (pHtmlNode.tagName == "BODY")
                pHtmlNode = document.documentElement;

            if (selected.right)
                selected.setProperty("right", pHtmlNode.offsetWidth - selected.oExt.offsetLeft - selected.oExt.offsetWidth);
            
            if (selected.bottom)
                selected.setProperty("bottom", pHtmlNode.offsetHeight - selected.oExt.offsetTop - selected.oExt.offsetHeight);
        }
        
        _self.ondrag = function(){
            //@todo Moving an anchored element is broken
            setTimeout(function(){
                _self.regrab();
            });
        }
    }
    this.regrab = function(){
        //Position
        var oEl = this.oExt;
        var pos = apf.getAbsolutePosition(oEl);
        pos.push(oEl.offsetWidth, oEl.offsetHeight);

        //Middle ones (hor)
        nodes.s.style.left = 
        nodes.n.style.left = (pos[0] + (pos[2] - size)/2) + "px";
        
        //Middle ones (ver)
        nodes.e.style.top = 
        nodes.w.style.top = (pos[1] + (pos[3] - size)/2) + "px";
        
        //Top
        nodes.nw.style.top = 
        nodes.ne.style.top = 
        nodes.n.style.top  = (pos[1] - size - margin) + "px";
        
        //Left
        nodes.sw.style.left = 
        nodes.nw.style.left = 
        nodes.w.style.left  = (pos[0] - size - margin) + "px";
        
        //Right
        nodes.ne.style.left = 
        nodes.se.style.left = 
        nodes.e.style.left  = (pos[0] + pos[2] + margin) + "px";
        
        //Bottom
        nodes.se.style.top = 
        nodes.sw.style.top = 
        nodes.s.style.top  = (pos[1] + pos[3] + margin) + "px";
    }
    
    this.show = function(){
        for (var i = 0; i < 8; i++) {
            nodes[i].style.display = "block";
        }
    }
    
    this.hide = function(){
        for (var i = 0; i < 8; i++) {
            nodes[i].style.display = "none";
        }
    }
    
    this.setProperty = function(){
        selected.setProperty.apply(selected, arguments);
    }
    
    var map = {"e":"right","w":"left","n":"top","s":"bottom"}
    function mousedown(e){
        if (!e) e = event;
        if (e.ctrlKey && this.type.length == 1) {
            if (selected.$anchors && selected.$anchors.length) {
                var anchors = selected.$anchors;
                selected.setProperty("anchors", null);
                selected.setProperty("top", anchors[0]);
                selected.setProperty("right", anchors[1]);
                selected.setProperty("bottom", anchors[2]);
                selected.setProperty("left", anchors[3]);
            }
            
            apf.setStyleClass(this, !selected[map[this.type]] 
                ? "grabber_selected" : "", ["grabber_selected"]);

            var prop = map[this.type];
            if (selected[prop]) {
                if (prop == "right" && !this.left)
                    selected.setProperty("left", selected.oExt.offsetLeft);
                else if (prop == "bottom" && !this.top)
                    selected.setProperty("top", selected.oExt.offsetTop);

                selected.setProperty(prop, null);
            }
            else {
                var pHtmlNode = selected.oExt.offsetParent;
                if (pHtmlNode.tagName == "BODY")
                    pHtmlNode = document.documentElement;
                    
                switch(this.type) {
                    case "e":
                        selected.setProperty("right", pHtmlNode.offsetWidth - selected.oExt.offsetLeft - selected.oExt.offsetWidth);
                        break;
                    case "w":
                        selected.setProperty("left", selected.oExt.offsetLeft);
                        break;
                    case "n":
                        selected.setProperty("top", selected.oExt.offsetTop);
                        break;
                    case "s":
                        selected.setProperty("bottom", pHtmlNode.offsetHeight - selected.oExt.offsetTop - selected.oExt.offsetHeight);
                        break;
                }
            }

            selected.setProperty("width", !this.left || !this.right
                ? selected.oExt.offsetWidth
                : null);
            selected.setProperty("height", !this.top || !this.bottom
                ? selected.oExt.offsetHeight
                : null);
            
            apf.layout.processQueue();
        }
        else {
            _self.$resizeStart(e || event, {
                resizeType : this.type,
                nocursor   : true
            });
        }
    }
}

apf.Selection = function(){
    
}