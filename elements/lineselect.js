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

// #ifdef __AMLLINESELECT || __INC_ALL

/**
 * Element displaying text with each line being selectable. This is especially
 * useful for log messages.
 * 
 * @experimental
 * @todo test this
 */
apf.lineselect = function(struct, tagName){
    this.$init(tagName || "lineselect", apf.NODE_VISIBLE, struct);
};

(function(){
    this.deselect = function(){
        this.value = this.selected = null;
    }
    
    this.select = function(node){
        if(this.selected) this.selected.className = this.skin.clsItem;
        
        node.className = this.skin.clsSelected;
        this.selected = node;

        this.dispatchEvent("afterselect", node.innerHTML);
    }
    
    this.$focus = function(){
        if(this.selected) this.selected.className = this.skin.clsSelected;
    }
    
    this.$blur = function(){
        if(this.selected) this.selected.className = this.skin.clsBlur;
    }
    
    this.$focussable = true;
    
    this.getHTML = function(t){
        t = t.replace(/</g, "&lt;");
        t = t.replace(/>/g, "&gt;");
        t = t.replace(/(^|\n)[^\(]*\(/g, "\n(");
        return t;
    }
    
    this.loadText = function(text){
        //this.parentNode.style.width = this.parentNode.offsetWidth;
        
        var ar = this.getHTML(text).split("\n");
        
        for(var i=0;i<ar.length;i++){
            if(ar[i].match(/error \E/)) var clr = "red";
            else if(ar[i].match(/warning \P/)) var clr = "yellow";
            else var clr = "white";
            
            ar[i] = "<div style='color:" + clr + "' onmousedown='" + 'apf.lookup(' + this.$uniqueId + ').select(this)' + "' ondblclick=\"" + 'apf.lookup(' + this.$uniqueId + ').dispatchEvent(\'onchoose\', this.innerHTML)' + "\" class='" + this.skin.clsItem + "'>" + ar[i] + "</div>";
        }
                
        this.$ext.innerHTML = "<div style='color:white' class='" + this.skin.clsItem + "'>APF Packager</div><div nowrap style='color:white' class='" + this.skin.clsItem + "'>(c) 2001-2003 All Rights Reserved.</div><br>" + ar.join("");
        //this.parentNode.style.width = "100%";
    }
    
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;

        if(this.renaming){
            if(key == 27 || key == 13){
                this.stopRename();
                if(key == 13) this.stopRename();
            }
            
            return;
        }
        
        if(!this.selected) return;

        switch(key){
            case 13:
                this.dispatchEvent("choose");
            break;
            case 38:
            //UP
                if(!this.value) return;
                var node = this.value;

                if(node.previousSibling) node = node.previousSibling;
                if(node && node.nodeType == 1) this.select(document.getElementById(node.getAttribute("id")));
                
                //this.selected.scrollIntoView();
                return false;
            break;
            case 40:
            //DOWN
                if(!this.value) return;
                var node = this.value;

                if(node.nextSibling) node = node.nextSibling;
                if(node && node.nodeType == 1) this.select(document.getElementById(node.getAttribute("id")));
                
                //this.selected.scrollIntoView();
                return false;
            break;
        }
    }, true);
    //#endif
    
    /**** Init ****/
    
    this.$draw = function(clear, parentNode){
        this.$ext = this.$getExternal();
        this.$int = this.$ext;
    }
}).call(apf.lineselect.prototype = new apf.GuiElement());

apf.aml.setElement("lineselect", apf.lineselect);
// #endif
