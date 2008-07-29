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

// #ifdef __JRICHTEXTEDITOR || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component allowing the user to view and edit text in a rich
 * text format. This allows the user to make certain sections of 
 * the text bold, italic, underlined and apply many other styles.
 *
 * @classDescription		This class creates a new rich text box
 * @return {Richtextbox} Returns a new rich text box
 * @type {Richtextbox}
 * @constructor
 * @allowchild [cdata], {smartbinding}
 * @addnode components:richtextbox
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.richtextbox = function(pHtmlNode){
    jpf.register(this, "richtextbox", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;

    /* ***********************
            Inheritance
    ************************/
    //this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.focussable = true; // This object can get the focus
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif	
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    /* ***************
        API
    ****************/
    
    this.getValue = function(textonly){
        var value = this.router.getActiveEditor().getValue();
        return textonly ? value.replace(/<[^>]+>/, "") : value;
    }
    
    this.setValue = function(value){
        if (!this.router)
            return this.value = value;
        this.router.getActiveEditor().setValue(value);
    }
    
    this.getValueList = function(){
        return this.router.getValue();
    }
    
    this.setValueList = function(){
        this.router.setValue(arguments);
    }
    
    this.setEditorHTML = function(id, html){
        this.router.getEditor(id).setValue(html);
    }
    
    this.getEditor = function(id){
        return this.router.getEditor(id);
    }
    
    this.selectAll = function(){
        this.router.getActiveEditor().selectAll();
    }
    
    this.insertImage = function(path){
        this.router.getActiveEditor().insertImage(path);
    }
    
    /* ***************
        PRIVATE
    ****************/
    
    this.exec = function(value, gui, type){
        var Editor = this.router.getActiveEditor();
        if (!Editor)
            return alert("Please select an area to edit");
        
        //Font Color
        if (value == "ForeColor") {
            var sColor = this.dlgHelper.ChooseColorDlg(
                this.oDoc.queryCommandValue(value));
            sColor = sColor.toString(16);
            if (sColor.length < 6)
                sColor = "000000".substring(0, 6 - sColor.length).concat(sColor);
            this.oDoc.execCommand(value, false, sColor);
        }
        //Execute a standard command
        else
            this.oDoc.selection.createRange().execCommand(value, true, type);
        
        //Check for possible Local Images
        if (value == "InsertImage")
            Editor.fixContent();
        
        //Set Buttons
        this.redoButtons();
        
        this.change(this.getValue());
    }
    
    this.redoButtons = function(){
        if (!this.toolbar) return;

        //Sync Buttons with current selection
        var bar = this.toolbar.bars[0].children;
        for (var i = 0; i < bar.length; i++) {
            if (bar[i].tagName != "Button" || !bar[i].isBoolean)
                continue;
            bar[i].setValue(this.oDoc.queryCommandValue(bar[i].sValue));
        }
    }
    
    /* ***************
        FOCUS
    ****************/
    
    this.keyHandler = function(){}
    
    this.__focus = function(){
        if(this.oExt){
            //this.oExt.contentEditable = true;
            this.oExt.firstChild.contentWindow.focus();
            this.router.focus();
            
            return false;
        }
    }
    
    this.__blur = function(){
        //this.oExt.contentWindow.blur();
        //document.body.click();//focus();
        //this.oDoc.body.focus();
        //this.oExt.contentEditable = false;
    }
    
    this.focussable = true;
    
    /* ***************
        XML Support
    ****************/
    // #ifdef __WITH_DATABINDING
    
    this.__load = function(XMLRoot, id){
        //Add listener to XMLRoot Node
        jpf.XMLDatabase.addNodeListener(XMLRoot, this);
        
        var value = this.applyRuleSetOnNode("value", XMLRoot);
        this.setValue(value || "");
    }
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.xmlNode = this.XMLRoot;
        
        var value = this.applyRuleSetOnNode("value", this.XMLRoot);
        if (value != this.getValue())
            this.setValue(value || "");
    }
    
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* ***************
        INIT
    ****************/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.register = function(o){
        this.router = o;
        this.router.host = this;
        
        if(this.template) this.router.load(this.template);
        else this.router.Init();
        
        if(this.value) this.setValue(this.value);
    }
    
    this.draw = function(clear, parentNode){
        //Setup IFRAME
        this.oExt = this.pHtmlNode.appendChild(document.createElement("DIV"));
        this.oExt.style.width  = "100px";
        this.oExt.style.height = "100px";
        this.oExt.innerHTML    = "<IFRAME id='me" + this.uniqueId 
            + "' src='empty.html' width='100%' height='100%'></IFRAME>";

        //Initialize Iframe
        var win   = this.pHtmlDoc.getElementById("me" + this.uniqueId).contentWindow;//jpf.compat.initializeIframe("me" + this.uniqueId, strInit);
        this.oDoc = win.document;
        
        if(jpf.isIE){
            var strInit = "<html>\
                <head>\
                    <style>\
                    BODY {\
                        background-color: white;\
                        margin: 0px;\
                        overflow: auto;\
                    }\
                    P { margin : 0px; }\
                </style>\
                <script>\
                HOST=" + this.uniqueId + "\
                </script>\
                <script src='" + BASEPATH + "Library/Widgets/RTEHelper.js'></script>\
                <script src='" + BASEPATH + "Library/Widgets/RTETemplateViewer.js'></script>\
                </head>\
                <body></body>";
            
            this.oDoc.open();
            this.oDoc.write(strInit);
            this.oDoc.close();
        }

        this.oDoc.onkeydown   = 
        this.oDoc.onmousedown = 
        this.oDoc.onmouseup   = 
        this.oDoc.onclick     = function(e){};
        
        if (jpf.isIE) {
            document.body.insertAdjacentHTML("beforeend",
                "<OBJECT id=dlgHelper CLASSID='clsid:3050f819-98b5-11cf-bb82-00aa00bdce0b' width='0px' height='0px'></OBJECT>");
            this.dlgHelper = document.getElementById("dlgHelper");
        }

        //this.oDoc.body.
        this.oExt.firstChild.host = 
        this.oExt.host            = this;
        /*
        //Prevent selection from outside elements
        for (var i = 0; i < document.all.length; i++) {
            if(document.all[i].tagName.toLowerCase() != "input" 
              && document.all[i].tagName.toLowerCase() != "select")
                document.all[i].unselectable = "On";
            else
                document.all[i].unselectable = "Off";
        }
        */
    }
    
    this.__loadJML = function(x){
        // XML Options for later: Overflow, Font 
        this.template = x.getAttribute("template") || null;
        this.toolbar = x.getAttribute("toolbar")
            ? self[x.getAttribute("toolbar")] 
            : false;

        if (x.firstChild)
            this.setValue(x.innerHTML || (jpf.isIE ? x.firstChild.xml : x.xml));
    }
    
    this.__destroy = function(){
        this.router.host          = 
        this.oDoc.onkeydown       = 
        this.oDoc.onmousedown     = 
        this.oDoc.onmouseup       = 
        this.oDoc.onclick         =
        this.oExt.firstChild.host = null;
    }
}

// #endif
