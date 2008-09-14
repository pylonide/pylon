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
// #ifdef __JMENU || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a skinnable list of options which can be selected.
 * Selection of multiple items can be allowed. Items can be renamed
 * individually and deleted individually or in groups.
 *
 * @classDescription        This class creates a new menu
 * @return {Menu} Returns a new menu
 * @type {Menu}
 * @constructor
 * @allowchild item, divider, {smartbinding}
 * @addnode components:menu
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.menu = function(pHtmlNode){
    jpf.register(this, "menu", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = document.body;//pHtmlNode || 
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.__focussable = true; // This object can't get the focus
    /* ********************************************************************
     PRIVATE PROPERTIES
     *********************************************************************/
    this.nodes  = [];
    this.xpaths = [];
    this.groups = {};
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.display = function(x, y, noanim, opener, xmlNode){
        this.opener = opener;
        this.dispatchEvent("ondisplay");
        //debugger;
        
        //Show/Hide Child Nodes Based on XML
        for (var c = 0, last, d = 0, i = 0; i < this.xpaths.length; i++) {
            if (!this.xpaths[i]) {
                jpf.getNode(this.oInt, [i]).style.display = d == 0 && !last ? "none" : "block";
                if (d == 0 && last) 
                    last.style.display = "none";
                last = jpf.getNode(this.oInt, [i]);
                d = 0;
            }
            else {
                var dBlock = (!xmlNode && this.xpaths[i] == "." || xmlNode 
                    && xmlNode.selectSingleNode(this.xpaths[i]));
                jpf.getNode(this.oInt, [i]).style.display = dBlock ? "block" : "none";
                if (dBlock) {
                    d++;
                    c++;
                }
            }
        }
        if (d == 0 && last)
            last.style.display = "none";
        if (!c)
            return;
        
        this.setPos(x, y);
        this.showMenu(noanim);
        
        this.lastFocus = jpf.window.getFocussedObject();
        this.focus();
        if (this.lastFocus) 
            this.lastFocus.__focus();
        
        this.xmlReference = xmlNode;
        
        /*if (event) {
             event.cancelBubble = true;
             event.returnValue  = false;
         }*/
        
    }
    
    this.setDisabled = function(list){
        if (!this.oExt) 
            return (this.todo = list);
        var o = this.oExt.firstChild.firstChild;
        //this.showMenu(true);
        
        for (var i = 0; i < list.length; i++) {
            if (o.childNodes[i].disabled == list[i]) 
                continue;
            o.childNodes[i].disabled = list[i];
            
            var q = o.childNodes[i].lastChild;//.previousSibling
            //fix this
            /*if(list[i] == false) jpf.enable(q);
             else if(list[i] == true) jpf.disable(q);*/
        }
    }
    
    this.getSelectedValue = function(group){
        var values = this.groups[group];
        for (var i = 0; i < values.length; i++) {
            var htmlNode = document.getElementById(group + ":" + values[i] 
                + ":" + this.uniqueId);
            if (htmlNode.className.indexOf("checked") > -1) 
                return values[i];
        }
        
        return false;
    }
    
    this.setSelected = function(group, value){
        var values = this.groups[group];
        for (var i = 0; i < values.length; i++) {
            var htmlNode = document.getElementById(group + ":" + values[i] + ":" + this.uniqueId);
            if (values[i] == value) 
                this.__setStyleClass(htmlNode, "selected");
            else 
                this.__setStyleClass(htmlNode, "", ["selected"]);
        }
    }
    
    this.toggleChecked = function(value){
        var htmlNode = document.getElementById(value + ":" + this.uniqueId);
        if (htmlNode.className.match(/checked/)) 
            this.__setStyleClass(htmlNode, "", ["checked"]);
        else 
            this.__setStyleClass(htmlNode, "checked");
    }
    
    this.setPos = function(x, y){
        /*dh = (this.oExt.offsetHeight+y) - document.body.clientHeight;
         dw = (this.oExt.offsetWidth+x)  - document.body.clientWidth;
         
         var px = x - (dw > 0 ? dw : 0) + document.body.scrollLeft;
         var py = y - (dh > 0 ? dh : 0) + document.body.scrollTop;
         
         if (!this.menuNode) {
             this.oExt.style.display = "block";
             var diffX = (this.oExt.offsetWidth + x + this.parentNode.offsetLeft) - document.body.clientWidth;
             var diffY = (this.oExt.offsetHeight + y + this.parentNode.offsetTop) - document.body.clientHeight;
             this.oExt.style.display = "none";
         }*/
        this.oExt.style.left = (x - (jpf.isGecko ? 3 : 0)) + "px";//px - (diffX > 0 ? diffX : 0);
        this.oExt.style.top  = (y - (jpf.isGecko ? 3 : 0)) + "px";//py - (diffY > 0 ? diffY : 0);
    }
    
    this.showMenu = function(noanim){
        if (noanim) {
            //this.oExt.style.visibility = "visible";
            this.oExt.style.display = "block";
        }
        else {
            //this.oExt.style.visibility = "visible";
            this.oExt.style.display = "block";
            
            jpf.tween.single(this.oExt, {
                type: 'fade',
                from: 0,
                to: 1,
                anim: jpf.tween.NORMAL,
                steps: 7
            });
        }
        
        jpf.currentMenu = this;
    }
    
    this.hideMenu = function(hideOpener, nofocus){
        this.oExt.style.display = "none";
        if (this.lastFocus) {
            if (!nofocus) 
                this.lastFocus.focus();
            else 
                this.lastFocus.__blur();
        }
        //this.oExt.style.visibility = "";
        
        this.hideSubMenu();
        
        jpf.currentMenu = null;
        
        if (hideOpener && this.opener) 
            this.opener.hideMenu(true);
    }
    
    this.normalize = function(){
        this.hideMenu();
        for (var i = 0; i < this.last.length; i++) {
            //this.last[i].style.visibility = "";
            this.last[i].style.filter = "";
        }
    }
    
    this.setValue = function(value, matchCaption){
        var nodes = this.jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            var tagName = nodes[i][jpf.TAGNAME];
            if (tagName == "item" && (matchCaption 
              ? nodes[i].firstChild.nodeValue 
              : nodes[i].getAttribute("value")) == value) 
                this.value = nodes[i];
        }
    }
    
    this.clearSelection = function(){
        this.value = null;
    }
    
    this.select = function(o, id, subctx, e){
        //if(isFading(o)) return;
        
        //if(e) this.evnt = e;
        
        this.setValue(o.firstChild.nodeValue, true);
        
        //if(!this.onselect) 
        this.hideMenu(true);
        
        this.dispatchEvent("onanyclick");
        this.dispatchEvent("onafterselect");
        
        if (o.getAttribute("action")) {
            strfunc = o.getAttribute("action");
            if (jpf.isIE) 
                strfunc = strfunc.split("\n")[2];
            eval(strfunc);
        }
        
        return;
        
        //var method = this.data[id];
        //this.oExt.style.visibility = "hidden";
        //o.style.visibility = "visible";
        //for(var i=0;i<this.oInt.childNodes.length;i++) this.oInt.childNodes[i].style.visibility = "visible";
        //(this.last = this.oInt.childNodes)
        this.last = [o];
        //fadeOut(o, 0.30);
        setTimeout('jpf.lookup(' + this.uniqueId + ').normalize()', 250);
        //if(typeof method == "function") method();
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    // #ifdef __WITH_KBSUPPORT
    
    //Handler for a plane list
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 13:
                break;
            case 37:
            //LEFT
            case 38:
                //UP
                break;
            case 39:
            //RIGHT
            case 40:
                //DOWN
                break;
            default:
                return;
        }
        
        return false;
    }
    
    // #endif
    
    /* ***********************
     DATABINDING
     ************************/
    this.addItem = function(xmlNode){
        this.__getNewContext("Item");
        this.__getLayoutNode("Item", "caption").nodeValue = xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "";
        //var elImage = this.__getLayoutNode("Item", "image");
        var elItem = this.__getLayoutNode("Item");
        
        //xmlNode.getAttribute("icon")
        //xmlNode.getAttribute("disabled")
        
        var submenu  = xmlNode.getAttribute("submenu");
        var value    = xmlNode.getAttribute("value");
        var onclick  = xmlNode.getAttribute("onclick");
        var method   = xmlNode.getAttribute("method")
        var xpath    = xmlNode.getAttribute("select");
        var group    = xmlNode.getAttribute("group");
        var checked  = xmlNode.getAttribute("checked");
        var selected = xmlNode.getAttribute("selected");
        
        var isCheckbox = xmlNode[jpf.TAGNAME] == "check";
        var isRadio = xmlNode[jpf.TAGNAME] == "radio";
        
        if (submenu) 
            this.__setStyleClass(elItem, "submenu");
        if (isRadio && selected) 
            this.__setStyleClass(elItem, "selected");
        if (isCheckbox && checked) 
            this.__setStyleClass(elItem, "checked");
        if (isRadio && group) {
            if (!this.groups[group]) 
                this.groups[group] = [];
            var id = this.groups[group].push(value);
            elItem.setAttribute("id", group + ":" + id + ":" + this.uniqueId);
        }
        else 
            if (isCheckbox) {
                elItem.setAttribute("id", value + ":" + this.uniqueId);
            }
        
        elItem.setAttribute("onmouseup", 'jpf.lookup(' + this.uniqueId 
            + ').select(this, null, null, event)');
        elItem.setAttribute("onmouseover", "var o = jpf.lookup(" + this.uniqueId + ");\
            o.__setStyleClass(this, 'hover');" 
            + (submenu ? "o.showSubMenu(this, '" + submenu + "')" : "o.hideSubMenu();"));
        elItem.setAttribute("onmouseout", "if (jpf.xmldb.isChildOf(this, event.toElement \
            ? event.toElement \
            : event.explicitOriginalTarget)) \
              return;\
            var o = jpf.lookup(" + this.uniqueId + ");\
            o.__setStyleClass(this, '', ['hover']);" 
            + (submenu && false ? "o.hideSubMenu()" : ""));
        if (isRadio) 
            elItem.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId 
                + ').setSelected("' + group + '", "' + value + '");');
        if (isCheckbox) 
            elItem.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId 
                + ').toggleChecked("' + value + '");');
        if (onclick || method) 
            elItem.setAttribute("onclick", onclick || method + "(jpf.lookup(" 
                + this.uniqueId + ").xmlReference)");
        
        this.xpaths.push(xpath || ".");
        this.nodes.push(elItem);
        
        return elItem;
    }
    
    this.hideSubMenu = function(){
        if (!this.showingSubMenu) 
            return;
        self[this.showingSubMenu].oExt.style.display = "none";
        this.showingSubMenu = null;
    }
    
    this.showSubMenu = function(htmlNode, submenu){
        if (this.showingSubMenu == submenu) 
            return;
        
        var pos = jpf.getAbsolutePosition(htmlNode);
        /*self[submenu].oExt.style.left = pos[0] + htmlNode.offsetWidth - 2;
         self[submenu].oExt.style.top = pos[1] - 2;
         self[submenu].oExt.style.display = "block";*/
        self[submenu].display(pos[0] + htmlNode.offsetWidth - 2, pos[1] - 2, false, this);
        
        this.showingSubMenu = submenu;
    }
    
    this.addDivider = function(){
        this.__getNewContext("Divider");
        
        this.xpaths.push(false);
        this.nodes.push(this.__getLayoutNode("Divider"));
    }
    
    /* ***********************
     Other Inheritance
     ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    this.__blur = function(){
        if (!this.oExt) 
            return;
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
        this.hideMenu(null, true);
    }
    
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.oExt.onmousedown = function(e){
            (e || event).cancelBubble = true;
        }
        
        //Build JML defined contents (if any
        var nodes = this.jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            var tagName = nodes[i][jpf.TAGNAME];
            
            if (tagName.match(/^(?:item|radio|check)$/)) 
                this.addItem(nodes[i]);
            else 
                if (tagName == "divider") 
                    this.addDivider();
        }
        
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;
    }
    
    this.__loadJML = function(x){};
}

jpf.currentMenu = null;
// #endif
