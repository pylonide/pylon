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

// #ifdef __JSTATUSBAR || __INC_ALL

/**
 * Component displaying a bar consisting of panels containing text and icons.
 * This component is usually placed in the bottom of the screen to display 
 * context sensitive and global information about the state of the application.
 *
 * @classDescription		This class creates a new statusbar
 * @return {Statusbar} Returns a new statusbar
 * @type {Statusbar}
 * @constructor
 * @allowchild panel
 * @addnode components:statusbar
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.statusbar = function(pHtmlNode){
    jpf.register(this, "statusbar", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;

    var rest;
    this.panels = [];

    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.getPanel = function(id){
        return this.panels[id];
    }
    
    this.addPanel = function(xmlNode){
        this.__getNewContext("Panel");
        var p = this.__getLayoutNode("Panel");
        if(xmlNode.getAttribute("css")) p.setAttribute("style", xmlNode.getAttribute("css"));
        
        var elPanel = jpf.XMLDatabase.htmlImport(p, this.oInt, this.oInt.firstChild);
        var elPanelInt = this.__getLayoutNode("Panel", "container", elPanel);
        
        var oPanel = {
            host : this,
            oExt : elPanel,
            oInt : elPanelInt,
            oIcon : this.__getLayoutNode("Panel", "icon", elPanel),
            oCaption : this.__getLayoutNode("Panel", "caption", elPanel),
            
            setCaption : function(caption){
                this.oInt.innerHTML = caption;
            },
            
            setIcon : function(iconURL){
                if(this.oIcon.tagName && this.oIcon.tagName.match(/^img$/i)) elIcon.src = this.host.iconPath + iconURL;
                else this.oIcon.style.backgroundImage = "url(" + this.host.iconPath + iconURL + ")";
            },
            
            setStatus : function(iconURL, caption){
                this.setIcon(iconURL);
                this.setCaption(caption);
            }
        };
        
        if(xmlNode.getAttribute("icon")){
            oPanel.setIcon(xmlNode.getAttribute("icon"));
            this.__setStyleClass(oPanel.oExt, "win_panel_icon");
        }
        
        var wt = xmlNode.getAttribute("width");
        if(wt == "rest" || wt == "*"){
            this.__setStyleClass(oPanel.oExt, "rest");
            rest = oPanel;
        }
        else if(wt) oPanel.oExt.style.width = wt + "px";
        
        if(xmlNode.getAttribute("height")) oPanel.oExt.style.height = xmlNode.getAttribute("height") + "px";
        if(oPanel.oCaption) oPanel.setCaption(xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "");
        if(xmlNode.getAttribute("id")) this.panels[xmlNode.getAttribute("id")] = oPanel
        this.panels.push(oPanel);
        
        //parse children
        if(this.lastpages){
            var childs = this.lastpages[id].childNodes;
            for(var i=childs.length-1;i>=0;i--) elPanelInt.insertBefore(childs[i], elPanelInt.firstChild);
        }
        else if(elPanelInt && !oPanel.oCaption) jpf.JMLParser.parseChildren(xmlNode, elPanelInt, this);
        
        return oPanel;
    }
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.oCorner = this.__getLayoutNode("Main", "corner", this.oExt)
        
        rest = null;
        var nodes = this.jml.childNodes;
        for(var p,i=0;i<nodes.length;i++){
            if(nodes[i].nodeType != 1) continue;
            var tagName = nodes[i][jpf.TAGNAME];

            if(tagName == "panel"){
                p = this.addPanel(nodes[i]);
                if(this.panels.length == 1) this.__setStyleClass(p.oExt, "first");
            }
        }
        
        if(p) this.__setStyleClass(p.oExt, "last");
        //if(rest) this.oInt.appendChild(rest.oExt);
    }
}

// #endif