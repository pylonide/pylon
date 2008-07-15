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

// #ifdef __JMFMENU || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * @constructor
 */
jpf.MFMenu = function(pHtmlNode){
    jpf.register(this, "MFMenu", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     * @inherits jpf.Cache
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode, jpf.Cache);
    
    //Options
    this.focussable = false; // This object can't get the focus
    
    this.display = function(x, y, noanim, opener){
        //TEMP SPEED enhancement
        //noanim = true;
        
        this.opener = opener;
        if (this.ondisplay)
            this.ondisplay();
        
        //this.draw(null, null, true);
        this.setPos(x, y);
        this.showMenu();
        
        /*if(event){
            event.cancelBubble = true;
           event.returnValue  = false;
        }*/
    }
    
    this.setDisabled = function(list){
        if(!this.oExt)
            return (this.todo = list);

        var o = this.oExt.firstChild.firstChild;
        //this.showMenu(true);
        
        for (var i = 0; i < list.length; i++) {
            if (o.childNodes[i].disabled == list[i])
                continue;
            o.childNodes[i].disabled = list[i];
            
            var q = o.childNodes[i].lastChild;//.previousSibling
            o.childNodes[i].className = this.skin.clsItemOut;

            if (list[i] == false)
                enable(q);
            else if(list[i] == true)
                disable(q);
        }
    }
    
    this.setPos = function(x, y){
        var ht, curht = y;
        
        for (var i = 0; i < this.nodes.length; i++) {
            ht = this.nodes[i].GetHeight();
            this.nodes[i].Move(x, ht);
            curht += ht;
        }
    }
    
    this.showMenu = function(){
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Show();
        }
    }
    
    this.hideMenu = function(hideOpener){
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Hide();
        }
        
        currentMenu = null;
    }
    
    this.normalize = function(){
        this.hideMenu();
        for (var i = 0; i < this.last.length; i++) {
            this.last[i].style.visibility = "";
            this.last[i].style.filter     = "";
        }
    }
    
    this.setValue = function(value, matchCaption){
        var nodes = this.jml.childNodes;
        for(var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
            var tagName = nodes[i].tagName.replace(/^j\:/, "");
            if (tagName == "Item"
              && (matchCaption ? nodes[i].firstChild.nodeValue : nodes[i].getAttribute("value")) == value)
                this.value = nodes[i];
        }
    }
    
    this.clearSelection = function(){
        this.value = null;
    }
    
    this.select = function(data){
        if (!this.onselect)
            this.hideMenu(true);
        
        if (this.onAnyClick)
            this.onAnyClick();
        if (this.onselect)
            this.onselect(data);
        
        return;
    }
    
    /* ***********************
                Skin
    ************************/

    this.deInitNode = function(xmlNode, htmlNode){
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.updateNode = function(xmlNode, htmlNode){
        //Update Identity (Look)
        if(this.__getLayoutNode("Item", "icon", htmlNode)) 
            this.__getLayoutNode("Item", "icon", htmlNode).style.backgroundImage
              = "url(" + this.iconPath + this.applyRuleSetOnNode("Icon", xmlNode) + ")";
        else
            this.__getLayoutNode("Item", "Image", htmlNode).style.backgroundImage
              = "url(" + this.applyRuleSetOnNode("Image", xmlNode) + ")";
            
        this.__getLayoutNode("Item", "caption", htmlNode).nodeValue
          = this.applyRuleSetOnNode("Caption", xmlNode);
    }
    
    /* ***********************
        Keyboard Support
    ************************/
    
    //Handler for a plane list
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.selected) return;
        //error after delete...

        switch (key) {
            case 13:
                this.select(this.selected);
                if (this.onchoose)
                    this.onchoose();
                break;
            case 37:
                //LEFT
            case 38:
                //UP
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
                
                if (!this.value)
                    return;
                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.selected.offsetWidth
                    + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.value, false, items);
                if (node)
                    this.select(node);
                
                if (this.selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.selected.offsetTop - margin[0];
                break;
            case 39:
                //RIGHT
            case 40:
                //DOWN
                var margin = jpf.compat.getBox(jpf.getStyle(this.selected, "margin"));
                
                if (!this.value) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.selected.offsetWidth
                    + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.value, true, items);
                if (node)
                    this.select(node);
                
                if (this.selected.offsetTop + this.selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.selected.offsetTop
                        - this.oExt.offsetHeight + this.selected.offsetHeight + 10;
                
                break;
            default: 
                return;
        }
        
        return false;
    }
    
    /* ***********************
              CACHING
    ************************/
    
    this.__getCurrentFragment = function(){
        //if(!this.value) return false;

        var fragment = jpf.isIE55 ? new DocFrag() : document.createDocumentFragment(); //IE55
        while (this.oExt.childNodes.length) {
            fragment.appendChild(this.oExt.childNodes[0]);
        }
        
        return fragment;
    }
    
    this.__setCurrentFragment = function(fragment){
        jpf.isIE55 ? fragment.reinsert(this.oExt) : this.oExt.appendChild(fragment); //IE55
        
        //Select First Node....
        if (this.oExt.firstChild){
            this.select(this.oExt.firstChild);
            if (!me.isFocussed(this))
                this.blur();
        }
    }

    this.__findNode = function(cacheNode, id){
        if (!cacheNode)
            return document.getElementById(id);
        return cacheNode.getElementById(id);
    }
    
    this.__setClearMessage = function(msg){
        //this.oExt.innerHTML = "";//<div style='text-align:center;font-family:MS Sans Serif;font-size:8pt;padding:3px;cursor:default'>" + msg + "</div>";
    }
    
    /* ***********************
            DATABINDING
    ************************/
    
    this.nodes = [];
    
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        var item = this.addItem(
            this.applyRuleSetOnNode("Caption",  xmlNode),
            this.applyRuleSetOnNode("Icon",     xmlNode),
            this.applyRuleSetOnNode("Disabled", xmlNode),
            this.applyRuleSetOnNode("Submenu",  xmlNode),
            this.applyRuleSetOnNode("Value",    xmlNode)
        );
        
        item.setAttribute("id", Lid);
    }
    
    this.doItemClick = function(data, state){
        this.select(data[0]);
        this.hideMenu();
    }
    
    this.addItem = function(caption, icon, disabled, submenu, value, onclick){
        var elItem = JDeploy.CreateComponent("button");
        elItem.SetOnButtonChange(this, "doItemClick", [value, btn]);
        elItem.SetWidgetActive(1);
        elItem.InitButton(0, 0, 0, 3, icon, 0);

        this.nodes.push(elItem);
        
        return elItem;
    }
    
    this.hideSubMenu = function(){
        if (!this.showingSubMenu) return;

        self[this.showingSubMenu].oExt.style.display = "none";
        this.showingSubMenu = null;
    }
    
    this.showSubMenu = function(htmlNode, submenu){
        if (this.showingSubMenu == submenu) return;
        
        var pos = jpf.compat.getAbsolutePosition(htmlNode);
        /*self[submenu].oExt.style.left = pos[0] + htmlNode.offsetWidth - 2;
        self[submenu].oExt.style.top = pos[1] - 2;
        self[submenu].oExt.style.display = "block";*/
        self[submenu].display(pos[0] + htmlNode.offsetWidth - 2,
            pos[1] - 2, false, this);
        
        this.showingSubMenu = submenu;
    }
    
    this.addDivider = function(){
        //this.nodes.push();
    }
    
    this.__fill = function(){};
    
    this.draw = function(){
        //Build JML defined contents (if any
        var nodes = this.jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            var tagName = nodes[i].tagName.replace(/^j\:/, "");

            if (tagName == "Item")
                this.addItem(nodes[i].firstChild.nodeValue,
                    nodes[i].getAttribute("icon"),
                    nodes[i].getAttribute("disabled"),
                    nodes[i].getAttribute("submenu"),
                    nodes[i].getAttribute("value"),
                    nodes[i].getAttribute("onclick"));
            else if (tagName == "Divider")
                this.addDivider();
        }
        
        if (this.nodes.length)
            this.__fill();
    }
    
    this.__loadJML = function(x){}
    
    /* ***********************
        Deskrun Support
    ************************/
    DeskRun.register(this);
    
    this.show = function(){};
    
    this.hide = function(){};
}

jpf.currentMenu = null;

//#endif