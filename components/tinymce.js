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

// #ifdef __JTINYMCE || __INC_ALL

/**
 * Component displaying the tinyMCE rich text editor. This
 * component functions as a wrapper to this popular editor
 * allowing full integration in Javeline PlatForm including
 * databinding and markup support.
 *
 * @classDescription		This class creates a new tinymce instance
 * @return {TinyMCE} Returns a new tinymce instance
 * @type {TinyMCE}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:tinymce
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.tinymce = function(pHtmlNode){
    jpf.register(this, "tinymce", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    //#ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    //#endif
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.__focussable = true; // This object can't get the focus
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.getValue = function(){
        this.oExt.contentWindow.getEditorHtml();
    }
    
    this.keyHandler = function(key,ctrlKey,shiftKey,altKey){
        switch (key) {
            default:
            return;
        }
        
        return false;
    }
    
    this.setValue = 
    this.loadHTML = function(strHTML){
        if (this.oExt.contentWindow.setEditorHtml 
          && this.oExt.contentWindow.getEditorHtml() != strHTML)
            this.oExt.contentWindow.setEditorHtml(strHTML);
    }
    
    this.__clear = function(){
        if (this.oExt.contentWindow.setEditorHtml)
            this.oExt.contentWindow.setEditorHtml("");
    }
    
    this.__focus = function(){
        try {
            this.oExt.contentWindow.document.getElementsByTagName("IFRAME")[0]
                .contentWindow.document.body.focus();
        }
        catch(e){}
    }
    
    this.__blur = function(){};
    
    /* ***************
        DATABINDING
    ****************/
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj)
            UndoObj.xmlNode = this.XMLRoot;//(contents ? contents.XMLRoot : this.XMLRoot);
        
        //Refresh Properties
        this.loadHTML(this.applyRuleSetOnNode("contents", this.XMLRoot) || "");
    }
    
    this.__load = function(node){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(node, this);
        this.loadHTML(this.applyRuleSetOnNode("contents", node) || "");
    }
    
    /* *********
        INIT
    **********/
    this.initFrame = function(win){
        if(this.XMLRoot) this.reload();
    }
    
    this.draw = function(){
        pHtmlNode.insertAdjacentHTML("beforeend", "<iframe id='iframe_" 
            + this.uniqueId + "' width='100%' height='100%' src='tinymce/HTMLEditor.htm?" 
            + this.uniqueId + "'></iframe>");
        this.oExt = this.oInt = document.getElementById("iframe_" + this.uniqueId);
        this.oExt.contentWindow.uniqueId = this.uniqueId;
        this.oExt.contentWindow.host     = this;
        
        this.oExt.host   = this;
        this.oExt.onblur = function(){
            if(this.host.XMLRoot)
                this.host.change(this.contentWindow.getEditorHtml());	
        }
    }

    this.__loadJML = function(x){
        if (x.childNodes.length == 1 && x.firstChild.nodeType != 1)
            this.loadHTML(x.firstChild.nodeValue)
        else if (x.childNodes)
            jpf.JMLParser.parseChildren(x, this.oInt, this);
    }
    
    this.__destroy = function(){
        this.oExt.onblur = null;
    }
}

//#endif