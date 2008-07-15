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

// #ifdef __JTOOLBAR || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a bar containing Buttons and other JML components.
 * This component is usually positioned in the top of an application allowing
 * the user to choose from grouped tool buttons.
 *
 * @classDescription		This class creates a new toolbar
 * @return {Toolbar} Returns a new toolbar
 * @type {Toolbar}
 * @constructor
 * @allowchild bar
 * @define bar
 * @allowchild divider
 * @define divider
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.toolbar = function(pHtmlNode){
    jpf.register(this, "toolbar", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;

    var lastbars = null, bars = [];

    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.addDivider = function(elBar){
        elBar.children.push({
            tagName : "Divider",
            oExt : jpf.XMLDatabase.htmlImport(this.__getLayoutNode("Divider"), elBar.oInt),
            hide : function(){this.oExt.style.display = "none";},
            show : function(){this.oExt.style.display = "block";},
            getElementsByTagName : function(){return [];}
        });
    }
    
    this.addBar = function(xmlNode){
        this.__getNewContext("Bar");
        var p = this.__getLayoutNode("Bar");
        if(xmlNode.getAttribute("css")) p.setAttribute("style", xmlNode.getAttribute("css"));
        
        var elBar = jpf.XMLDatabase.htmlImport(p, this.oInt);
        var elBarInt = this.__getLayoutNode("Bar", "container", elBar);
        var isMenu = xmlNode.getAttribute("type") == "menu";
        if(isMenu) this.__setStyleClass(elBar, "menubar");

        var oBar = {
            jml : xmlNode,
            oExt : elBar,
            oInt : elBarInt,
            isMenu : isMenu,
            children : []
        };
        oBar.inherit = jpf.inherit;
        oBar.inherit(jpf.JmlDomAPI);
        oBar.childNodes = oBar.children;
        this.childNodes.push(oBar);
        
        if(xmlNode.getAttribute("height")) oBar.oExt.style.height = xmlNode.getAttribute("height") + "px";
        var id = bars.push(oBar) - 1;
        
        //parse children
        if(lastbars){
            var childs = lastbars[id].children;
            for(var i=0;i<childs.length;i++){
                if(childs[i].tagName == "divider") this.addDivider(oBar);
                else{
                    childs[i].parentNode = oBar;
                    elBarInt.appendChild(childs[i].oExt);
                    oBar.children.push(childs[i]);
                }
            }
            oBar.childNodes = lastbars[id].childNodes;
        }
        else{
            var nodes = xmlNode.childNodes;
            for(var i=0;i<nodes.length;i++){
                if(nodes[i].nodeType != 1) continue;
                var tagName = nodes[i][jpf.TAGNAME];
                
                if(tagName == "divider") this.addDivider(oBar);
                else{
                    var o = jpf.document.createElement(null, nodes[i], elBarInt, oBar);
                    //oBar.childNodes.push(o);
                    this.__setStyleClass(o.oExt, "toolbar_item");
                    
                    if(tagName == "button"){
                        if(nodes[i].getAttribute("submenu")) this.setMenuButton(o, nodes[i], xmlNode, oBar);
                        o.focussable = false;
                    }
                    
                    o.barId = oBar.children.push(o) - 1;
                    //o.focussable = false;
                    
                    //if(!o.onclick){
                        var toolbar = this;
                        o.addEventListener("onclick", function(){toolbar.dispatchEvent("onitemclick", {value : this.sValue});});
                    //}
                }
            }
        }

        return oBar;
    }
    
    this.setMenuButton = function(o, node, xmlNode, oBar){
        o.submenu = node.getAttribute("submenu");
        o.bar = this;
        o.subbar = oBar;
        o.__setStateBehaviour();
        o.__blurhook = function(){if(this.value){this.__setState("Down", {}, "onmousedown");this.hideMenu()}}
        
        o.addEventListener("onmousedown", function(e){
            if(!e) e = event;
            
            if(this.value){
                self[this.submenu].hideMenu();
                this.__setState("Over", {}, "ontbover");
                if(this.bar.hasMoved) this.value = false;
                this.bar.menuIsPressed = false;
                return;
            }

            this.bar.menuIsPressed = this;
            
            var pos = jpf.compat.getAbsolutePosition(this.oExt, self[this.submenu].oExt.offsetParent || self[this.submenu].oExt.parentNode);
            self[this.submenu].oExt.style.left = pos[0] + "px";
            self[this.submenu].oExt.style.top = (pos[1]+this.oExt.offsetHeight) + "px";
            //self[this.submenu].oExt.style.visibility = "visible";
            //self[this.submenu].oExt.style.display = "block";
            self[this.submenu].showMenu();
            e.cancelBubble = true;
            //self[this.submenu].display(pos[0], pos[1]+this.oExt.offsetHeight, false, this);
            
            this.bar.hasMoved = false;
        });
        
        o.addEventListener("onmouseover", function(){
            if(this.bar.menuIsPressed && this.bar.menuIsPressed != this){
                this.bar.menuIsPressed.setValue(false);
                self[this.bar.menuIsPressed.submenu].hideMenu();
                
                this.setValue(true);
                
                this.bar.menuIsPressed = this;
                var pos = jpf.compat.getAbsolutePosition(this.oExt, self[this.submenu].oExt.offsetParent || self[this.submenu].oExt.parentNode);
                self[this.submenu].display(pos[0], pos[1]+this.oExt.offsetHeight, true, this);
                
                jpf.window.__focus(this);
                
                this.bar.hasMoved = true;
            }
        });
            
        //keyboard hook
        o.addEventListener("onkeydown", function(key){
            switch(key){
                case 37:
                    //left
                    var id = this.barId == 0 ? this.subbar.children.length-1 : this.barId-1;
                    this.subbar.children[id].dispatchEvent("onmouseover");
                break;
                case 39:
                    //right
                    var id = this.barId >= this.subbar.children.length-1 ? 0 : this.barId+1;
                    this.subbar.children[id].dispatchEvent("onmouseover");
                break;
            }
        });
        
        o.hideMenu = function(){
            this.setValue(false);
            //this.oExt.onmouseout({});
            this.__setState("Out", {}, "onmouseout");
            this.bar.menuIsPressed = false;
        }
    }
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
    }
    
    this.__loadJML = function(x){
        if(bars.length){
            lastbars = bars;
            bars = []; 
            this.childNodes = [];
        }
        
        lastpages = null;

        var nodes = this.jml.childNodes;
        for(var i=0;i<nodes.length;i++){
            if(nodes[i].nodeType != 1) continue;
            var tagName = nodes[i][jpf.TAGNAME];

            if(tagName == "bar"){
                var p = this.addBar(nodes[i]);
                if(i == 0) this.__setStyleClass(p.oExt, "first");
                if(i == nodes.length-2) this.__setStyleClass(p.oExt, "last");
            }
        }

        lastbars = null;

        /* // Rich Text Editor
        
        var nodes = this.oExt.getElementsByTagName("*");
        for(var i=0;i<nodes.length;i++){
            if(nodes[i].tagName.toLowerCase() != "input" && nodes[i].tagName.toLowerCase() != "select") nodes[i].unselectable = "On";
            else nodes[i].unselectable = "Off";
        }*/
    }
}

// #endif