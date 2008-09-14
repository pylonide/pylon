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

// #ifdef __JSOURCEEDIT || __INC_ALL

//IDEAS:
// Ctrl-E delete line
// Ctrl-R replace function.. regexp support

/**
 * @constructor
 */
jpf.sourceedit = function(pHtmlNode){
    jpf.register(this, "sourceedit", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.__focussable = true; // This object can get the focus
    this.disabled   = false; // Object is enabled
    this.value      = null;
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
    this.toolbars = [];
    this.buttons  = [];
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    //API
    
    this.WordWrap = function(){
        this.oTxt.style.width = "100%";	
    }
    
    this.setValue = function(value){
        if (jpf.hasInnerText)
            this.oTxt.innerText = value;
        else
            this.oTxt.value = value;	
    }
    
    this.getValue = function(){
        return this.oTxt.innerText;
    }
    
    this.find = function(text, noshow){
        /*
            scope
            
            0 Default. Match partial words. 
            1 Match backwards. 
            2 Match whole words only. 
            4 Match case. 
            131072 Match bytes. 
            536870912 Match diacritical marks. 
            1073741824 Match Kashida character. 
            2147483648 Match AlefHamza character. 

        */

        var o = this.oTxt;
        o.focus();
        var r = document.selection.createRange();//o.createTextRange();
        r.collapse(false);
        var found = r.findText(text, 100000);
        
        if (found)
            r.select();
        else {
            //eigenlijk mooier om bovenaan te beginnen.. maar later...
            var r = document.selection.createRange();
            r.select();
            if (!noshow)
                this.showSearch(true);
        }
    }
    
    this.gotoLineNumber = function(ln, selectLine){
        var o = this.oTxt;
        o.focus();
        
        var r = o.createTextRange();//document.selection.createRange();
        r.moveEnd("character", 1);
        
        var ar = o.innerText.split("\n");
        var rs = ar.slice(0, ln);
        for (var i = 0;i<rs.length;i++) r.findText(rs[i]);
        if(!selectLine) r.collapse();
        r.select();
        
        if(this.onshowlinenr) this.onshowlinenr(this.getLineNumber());
    }
    
    this.getLineNumber = function(){
        var o = this.oTxt;

        var r = document.selection.createRange();
        r.moveEnd("character", 1);
        var q = r.duplicate();//o.createTextRange();
        q.moveToElementText(o);
        //q.collapse();
        q.setEndPoint("EndToEnd", r);

        var str = q.text;
        return str.split("\n").length + (r.text == "" ? 1 : 0);
    }
    
    this.selectAll = function(){
        this.oTxt.select();
    }
    
    /* ***********************
                FOCUS
    ************************/
    
    this.__focus = function(){
        if (document.activeElement == this.oTxt) return;
        //return; //TEMP SOLUTION
        try {
            this.oTxt.focus();
        }
        catch(e) {}
    }
    
    this.__blur = function(){
        this.oTxt.blur();
    }
    
    this.__focussable = true;
    
    /* ***********************
            Databinding
    ************************/
    // #ifdef __WITH_DATABINDING
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj) UndoObj.xmlNode = this.XMLRoot;
        
        //Refresh Properties
        //var value = this.applyRuleSetOnNode("value", this.XMLRoot);
        //if(value != this.getValue()) this.setValue(value || "");
        
        var value = this.applyRuleSetOnNode("value", this.XMLRoot);
        if ((value || typeof value == "string")) {
            if(value != this.getValue())
                this.setValue(value);
        }
        else
            this.setValue("");
    }
    
    this.__load = function(XMLRoot, id){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);
        
        var value = (this.bindingRules 
            ? this.applyRuleSetOnNode("value", XMLRoot) 
            : (this.jml.firstChild ? this.jml.firstChild.nodeValue : false));

        if ((value || typeof value == "string")) {
            if(value != this.getValue())
                this.setValue(value);
        }
        else
            this.setValue("");
    }
    // #endif
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /* ***********************
        SEARCH|GOTO|KEYBOARD
    ************************/
    
    this.lastSearch = "";
    this.lastGoto   = "";
    
    this.showSearch = function(noclear){
        this.oFind.className = this.baseCSSname + "_find";
        if (!noclear)
            this.oFindInput.value = this.lastSearch;
        this.oFindLabel.nodeValue = "Search";
        
        //setting function
        this.oFindInput.onkeydown = new Function('e', "if (!e) e = event;\
            if (e.keyCode==13) {\
                jpf.lookup(" + this.uniqueId + ").find(this.value);\
                return false;\
            }");
        
        this.showBox();
    }
    
    this.showGoto = function(){
        this.oFind.className      = this.baseCSSname + "_goto";
        this.oFindInput.value     = this.lastGoto;
        this.oFindLabel.nodeValue = "Goto Line:";
        
        //setting function
        this.oFindInput.onkeydown = new Function('e', "if (!e) e = event;\
            if (e.keyCode==13) {\
                jpf.lookup(" + this.uniqueId + ").gotoLineNumber(this.value);\
                return false;\
            }");
        
        this.showBox();
    }
    
    this.showBox = function(){
        this.oFind.style.top = this.oExt.scrollTop + 15;
        
        this.oFind.style.display = "block";
        this.oFindInput.select();
        this.oFindInput.focus();
    }
    
    this.hideBox = function(){
        this.oFind.style.display = "none";
        
        if (this.oFindLabel.innerHTML == "Search")
            this.lastSearch = this.oFindInput.value;
        else
            this.lastGoto = this.oFindInput.value;
    }
    
    this.keyHandler = function(key, ctrlKey){
        if (key == 114 && this.lastSearch) {
            this.find(this.lastSearch, true);
            return false;
        }
        else if (ctrlKey && key == 70) {
            if(!document.selection) return false;
            
            //Find
            this.showSearch();
            return false;
        }
        else if (ctrlKey && key == 71) {
            if(!document.selection) return false;
            
            //Goto Line
            this.showGoto();
            return false;
        }
        else if (key == 27) {
            this.hideBox();
            return false;
        }
        else if (key == 9) {
            if(!jpf.hasMsRangeObject) return;
            var r = document.selection.createRange();
            r.text = "	";
            return false;
        }
    }
    
    /* ***************
        Init
    ****************/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oTxt = this.__getLayoutNode("Main", "input", this.oExt);
        this.oTxt.host = this;
        
        this.oFind      = jpf.xmldb.htmlImport(
            this.__getLayoutNode("FindPopup"), this.oExt);
        this.oFindLabel = this.__getLayoutNode("FindPopup", "label", this.oFind);
        this.oFindInput = this.__getLayoutNode("FindPopup", "input", this.oFind);

        //this.oExt.onmousedown = 
        this.oExt.onfocus = function(e){
            if(!e) e = event;
            
            if (e.offsetX < this.offsetWidth - 23 
              && e.offsetY < this.offsetHeight - 23) {
                setTimeout('jpf.lookup(' + this.host.uniqueId + ').focus()', 100);
                e.cancelBubble = true;
            }
        }
        
        this.oTxt.onselectstart = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        };
        this.oTxt.onmousemove   = 
        this.oTxt.onmouseover   = function(e){
            if (!e) e = event;
            e.cancelBubble = true;
        };
        
        this.oTxt.onmousedown = function(e){
            if (!e) e = event;
            
            jpf.window.__focus(this.host);
            e.cancelBubble = true;	
        }
        
        this.oTxt.onmouseup = 
        this.oTxt.onkeydown = 
        this.oTxt.onkeyup   = function(e){
            if (!e) e = event;
            
            if (this.host.onshowlinenr)
                this.host.onshowlinenr(this.host.getLineNumber());
            if (e.keyCode == 9)
                return false;
        }
    }
    
    this.__loadJML = function(x){
        this.setValue(x.firstChild ? x.firstChild.nodeValue : "");
        
        this.__focus();
    }
}

// #endif
