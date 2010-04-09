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
    apf.document.$getVisualSelect();
    
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
            case 113: //F2
                //_self.startRename(selected[0]);
                apf.document.execCommand("rename", true);
                return false;
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
    
    apf.document.addEventListener("focus", function(e){
        var node = e.currentTarget;
        if (node.editable) {
            if (!e.ctrlKey && sel.rangeCount)
                sel.removeAllRanges();
                
            sel.addRange(this.createRange()).selectNode(node);
        }
    });
});

apf.ContentEditable2 = function() {
    this.$regbase = this.$regbase | apf.__CONTENTEDITABLE__;

    this.editable = false;
    this.$canEdit = true;
    this.$init(function(tagName, nodeFunc, struct){
         this.$inheritProperties["editable"] = 2;
    });
    
    this.$booleanProperties["editable"] = true;
    this.$propHandlers["editable"] = function(value, prop){
        if (value) {
            if (this.$canEdit) {
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
                
                apf.ContentEditable2.addInteraction(this);
            }
            this.isContentEditable = true;
            
            //@todo select the first element??
            
            apf.setStyleClass(this.$ext, "editable");
        }
        else {
            if (this.$canEdit) {
                //@todo
                //apf.ContentEditable2.resize.deInitElement(this);
            }
            this.isContentEditable = false;
            
            apf.ContentEditable2.removeInteraction(this);
            
            //@todo hack!
            apf.ContentEditable2.resize.hide();
            
            apf.setStyleClass(this.$ext, "", ["editable"]);
        }
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        /*if (!this.editable)
            return;
        
        var x     = this.$aml;
        var nodes = this.childNodes;
        
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (typeof nodes[i].editable == "undefined") { //@todo inheritance?
                if (nodes[i].nodeFunc == apf.NODE_VISIBLE && nodes[i].localName != "page") {
                    nodes[i].setAttribute("editable", true);
                }
                else {
                    nodes[i].isContentEditable = true;
                    arguments.callee.apply(nodes[i], arguments);
                }
            }
        }*/
        if (!this.editable) {
            this.editable = apf.getInheritedAttribute(this, "editable");
            if (this.editable)
                this.$propHandlers["editable"].call(this, true);
        }
    });
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        
    });
};

apf.config.$inheritProperties["editable"] = 1;
// #endif
