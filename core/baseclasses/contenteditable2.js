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
apf.__CONTENTEDITABLE__  = 1 << 24;

// #ifdef __WITH_CONTENTEDITABLE2

apf.addEventListener("load", function(){
    apf.window.undoManager.addEventListener("afterchange", function(){
        //regrab here
    });
    
    var sel = apf.document.getSelection();
    sel.addEventListener("update", function(){
        
    });
    
    //Init visual selection 
    //apf.document.$getVisualSelect();
    
    //@todo only for editable elements
    apf.addEventListener("keydown", function(e){
        var key = e.keyCode;

        if (apf.document.queryCommandState("rename")) {
            if (key == 27 || key == 13) {
                apf.document.execCommand("rename", false, key == 13);
                
                window.focus(); //@todo don't know why this is needed...
                e.cancelBubble = true;
                return false;
            }

            return;
        }

        //F2
        switch(key) {
            case 27: //ESC
                if (apf.dragMode) {
                    var sel = apf.document.$getVisualSelect().getLastSelection();
                    (apf.document.activeElement || sel[0]).$cancelInteractive();
                }
                break;
            case 113: //F2
                //_self.startRename(selected[0]);
                apf.document.execCommand("rename", true);
                return false;
            case 16:
                if (!this.dragMode)
                    apf.document.execCommand("mode", null, "select");
                break;
            /*case 36: //HOME
                return false;
            case 35: //END
                return false;
            case 107: //+
            case 187: //+
            case 109:
            case 189: //-
                break;
            case 38: //UP
                return false;
            case 40: //DOWN
                return false;
            case 39: //RIGHT
                return false;
            case 37: //LEFT
                return false;
            case 33: //PGUP
            case 34: //PGDN
                break;*/
        }
    });

    apf.addEventListener("keyup", function(e){
        if (e.keyCode == 16 && !this.dragMode)
            apf.document.execCommand("mode", null, "arrow");
    });

    var recursion, $focus, lastFocussed;
    apf.document.addEventListener("focus", $focus = function(e){
        if (recursion)
            return;

        recursion = true;
        var node = e.currentTarget, isSelected;
        if (node.editable) {
            if (sel.rangeCount) {
                isSelected = sel.$getNodeList().indexOf(node) > -1; //@todo use visualSelect cache here?

                if (!e.ctrlKey) {
                    if (isSelected) {
                        recursion = false;
                        return;
                    }

                    sel.removeAllRanges();
                }
                else {
                    //Only allow selection with nodes of the same parent
                    if (sel.getRangeAt(0).startContainer != node.parentNode) {
                        delete e.currentTarget;
                        e.fromElement && e.fromElement.focus(null, e); //@todo we should look into sel
                        recursion = false;
                        return;
                    }
                    
                    if (isSelected) {
                        recursion = false;
                        return;
                    }
                }
            }
            
            //Add element to the selection
            sel.addRange(this.createRange()).selectNode(node);
            lastFocussed = node;
        }
        recursion = false;
    });
    if (apf.document.activeElement && apf.document.activeElement.editable)
        sel.addRange(apf.document.createRange()).selectNode(apf.document.activeElement);
    
    var lastPos = [-1000, -1000];
    apf.addEventListener("mousedown", function(e){
        lastPos = [e.htmlEvent.clientX, e.htmlEvent.clientY];
    });
    
    //Focus isn't set when the node already has the focus
    apf.addEventListener("mouseup", function(e){
        if (Math.abs(lastPos[0] - e.htmlEvent.clientX) > 2 
          || Math.abs(lastPos[1] - e.htmlEvent.clientY) > 2)
            return;
        
        apf.plane.hide();
        var o = apf.document.$getVisualSelect().$getOutline();
        if (!o) return;
        var lastTop = o.style.top;
        o.style.top = 
        document.getElementById("apf_outline").style.top = "-10000px";
        
        var node = apf.findHost(
            document.elementFromPoint(e.htmlEvent.clientX, e.htmlEvent.clientY));

        o.style.top = lastTop;

        if (lastFocussed == node) {
            lastFocussed = null;
            return;
        }
        
        if (!node.editable) return;
        
        //apf.activeElement == node && 
        if (sel.rangeCount > 1) {
            //Deselect a node when its already selected
            var idx, list = sel.$getNodeList(); //@todo use visualSelect cache here?
            if (e.htmlEvent.ctrlKey && (idx = list.indexOf(node)) > -1) {
                sel.removeRange(sel.getRangeAt(idx));
                delete e.currentTarget;
                var r = sel.getRangeAt(sel.rangeCount - 1);
                recursion = true;
                r.startContainer.childNodes[r.startOffset].focus();
                recursion = false;
                return;
            }
            else { //@todo this could be optimized by checking whether the object is already the only selected
                sel.removeAllRanges();
                sel.addRange(apf.document.createRange()).selectNode(node);
            }
        }
    });
    
    /*apf.addEventListener("contextmenu", function(e){
        if (e.currentTarget.namespaceURI == apf.ns.xhtml) {
            e.currentTarget.ownerDocument.execCommand("contextmenu", true, {
                amlNode   : e.currentTarget,
                htmlEvent : e
            });
            
            return false;
        }
    });*/
});

apf.ContentEditable2 = function() {
    this.$regbase = this.$regbase | apf.__CONTENTEDITABLE__;

    this.editable = false;
    this.$canEdit = true;
    /*this.$init(function(tagName, nodeFunc, struct){
         //this.$inheritProperties["editable"] = 2;
    });*/
    
    this.$booleanProperties["editable"] = true;
    this.$propHandlers["editable"] = function(value, prop){
        if (this.nomk) { //A way to have UI elements excluded from editing
            this.editable = false;
            return false;
        }
        
        if (value) {
            //#ifdef __WITH_DEBUG_WIN
            if (!apf.ContentEditable2.inited && this.parentNode.nodeType == 9) {
                apf.getData(apf.basePath + "/debugwin/editable.css", {
                    callback: function(data){
                        apf.importCssString(data);
                    }
                });

                if (!apf.loaded)
                    apf.addEventListener("load", function(){
                        apf.document.documentElement.insertMarkup(apf.basePath 
                            + "/debugwin/editable.inc");
                    });
                else
                    apf.document.documentElement.insertMarkup(apf.basePath 
                        + "/debugwin/editable.inc");
                
                apf.ContentEditable2.inited = true;
            }
            //#endif
            
            if (this.$canEdit && this.$ext && !this.$coreHtml) {
                this.dragOutline = true; //@todo via config setting??

                //Make this element draggable
                (this.$propHandlers["draggable"]
                  || apf.GuiElement.propHandlers["draggable"]).call(this, true);
                
                //Make this element resizable
                (this.$propHandlers["resizable"]
                  || apf.GuiElement.propHandlers["resizable"]).call(this, true);
                
                //Make this element focussable
                if (!this.$focussable || !this.focussable)
                    apf.GuiElement.propHandlers.focussable.call(this, true);
                
                //Handle invisible elements
                if (this.$propHandlers.visible)
                    this.$propHandlers.visible_original = this.$propHandlers.visible;
                this.$propHandlers.visible = function(value){
                    apf.setOpacity(this.$ext, value ? 1 : 0.5);
                    this.$ext.onmouseover = function(){
                        apf.setOpacity(this, 1);
                    }
                    this.$ext.onmouseout = function(e){
                        if (!e) e = event;
                        if (!e.toElement || e.toElement.host !== false)
                            apf.setOpacity(this, 0.5);
                    }
                }
                if (this.visible === false) {
                    if (this.$propHandlers.visible_original)
                        this.$propHandlers.visible_original.call(this, true);
                    this.$propHandlers.visible.call(this, false);
                }
                
                //Focus
                this.$lastFocussable = [this.$focussable, this.focussable];
                this.$focussable = 
                this.focussable  = true;
                
                //If an element is editable and its parent element is not, or if an element is editable and it has no parent element, then the element is an editing host
                //if this is the editing host, this value should be set to refrain it from being entered by tabbing
                if (this.$isWindowContainer)
                    this.$isWindowContainer = -2; //@todo bug in window.js causes child to be selected at window focus change
                
                //If this element supports rename, enable it via dblclick
                if (this.ownerDocument.queryCommandEnabled("rename", false, this)) {
                    var _self = this;
                    this.$ext.ondblclick = function(e){
                        if (!e) e = event;

                        _self.ownerDocument.execCommand("rename", true);
                        e.cancelBubble = true;
                    }
                }
                
                //Contextmenu
                this.addEventListener("contextmenu", function(e){
                    this.ownerDocument.execCommand("contextmenu", true, {
                        amlNode: this,
                        htmlEvent: e
                    });
        
                    e.returnValue  = false;
                    e.cancelBubble = true;
                    return false;
                });
                
                //Drag & Resize
                apf.ContentEditable2.addInteraction(this);
            }
            this.isContentEditable = true;
            
            //@todo select the first element??
            var vsel, lsel = (vsel = this.ownerDocument.$getVisualSelect()).getLastSelection();
            if (!this.parentNode.editable && lsel && lsel.length)
                vsel.show();
            
            apf.setStyleClass(this.$ext, "editable");
        }
        else {
            if (this.$canEdit && this.$ext && !this.$coreHtml) {
                var n;
                
                //Unset draggable
                if (n = this.getAttributeNode("draggable"))
                    n.$triggerUpdate();
                else
                    (this.$propHandlers["draggable"]
                      || apf.GuiElement.propHandlers["draggable"]).call(this, this.localName == "window" || false); //@todo hack!
                
                delete this.dragOutline; //@todo hack!
                delete this.$showDrag;
                delete this.$showResize;
                delete this.realtime; //@todo this should be renamed to something else
                
                //Unset resizable
                if (n = this.getAttributeNode("resizable"))
                    n.$triggerUpdate();
                else
                    (this.$propHandlers["resizable"]
                      || apf.GuiElement.propHandlers["resizable"]).call(this, false);
                
                //Unset focussable
                this.$focussable = this.$lastFocussable[0];
                this.focussable  = this.$lastFocussable[1];
                if (!this.focussable)
                    apf.GuiElement.propHandlers.focussable.call(this, this.focussable);
                
                //Hide invisible elements
                if (this.visible === false) {
                    if (this.$propHandlers.visible_original)
                        this.$propHandlers.visible_original.call(this, false);
                    this.$propHandlers.visible.call(this, true);
                }
                if (this.$propHandlers.visible_original) {
                    this.$propHandlers.visible = this.$propHandlers.visible_original;
                    delete this.$propHandlers.visible_original;
                }
                
                delete this.$isWindowContainer; //Should fall back to value from prototype
                
                if (this.ownerDocument.queryCommandEnabled("rename", false, this)) {
                    this.$ext.ondblclick = null;
                }
                
                apf.ContentEditable2.removeInteraction(this);
                
                var sel = this.ownerDocument.getSelection().$getNodeList();
                if (sel.indexOf(this) > -1)
                    this.ownerDocument.$getVisualSelect().hide()
            }
            this.isContentEditable = false;
            
            //@todo hack!
            //apf.ContentEditable2.resize.hide();
            
            apf.setStyleClass(this.$ext, "", ["editable"]);
        }
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //@todo shouldn't this only be set when editable is enabled
        try{
            if (this.$ext && !this.$ext.host)
                this.$ext.host = this;
        }catch(e){}
        
        if (!this.editable) {
            this.editable = apf.isTrue(apf.getInheritedAttribute(this, "editable"));
            if (this.editable) {
                this.$propHandlers["editable"].call(this, true);
                this.dispatchEvent("prop.editable", {value: true});
                this.$inheritProperties["editable"] = 2;
            }
        }
    });
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        
    });
};

apf.XhtmlElement.prototype.implement(apf.ContentEditable2);

apf.config.$inheritProperties["editable"] = 2;
// #endif
