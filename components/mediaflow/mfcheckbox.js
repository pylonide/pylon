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
// #ifdef __JMFCHECKBOX || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * @constructor
 */
jpf.MFCheckbox = function(pHtmlNode){
    jpf.register(this, "MFCheckbox", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode);
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.focussable = false; // This object can get the focus
    this.disabled   = false; // Object is enabled
    this.checked    = false;
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        this.check_value = value;
    }
    
    this.getValue = function(){
        return this.checked ? this.check_value : null;
    }
    
    this.check = function(){
        this.oExt.clicked = true;
        this.checked      = true;
    }
    
    this.uncheck = function(){
        this.oExt.clicked = false;
        this.checked      = false;
    }
    
    this.setError = function(value){};
    
    this.clearError = function(value){};
    
    this.enable = function(){
        this.disabled      = false;
        this.oExt.disabled = false;
    }
    
    this.disable = function(){
        this.disabled      = true;
        this.oExt.disabled = true;
    }
    
    /* ***********************
     Actions
     ************************/
    this.Change = function(value){
        var node = this.getNodeFromRule("Value", this.XMLRoot);
        if (!node) {
            if (value == this.values[0]) 
                this.check();
            else 
                this.uncheck();
            
            return this.dispatchEvent("onchange");
        }
        
        var atAction = (node.nodeType == 3 || node.nodeType == 4)
            ? "setTextNode"
            : "setAttribute";
        var args = (node.nodeType == 3 || node.nodeType == 4)
            ? [node.parentNode, value] 
            : [node.selectSingleNode(".."), node.nodeName, value];
        
        //Use Action Tracker
        this.executeAction(atAction, args, "Change", this.XMLRoot);
    }
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.processClick = function(checked){
        this.Change(this.values[checked ? 0 : 1]);
    }
    
    /* ***********************
     Focus
     ************************/
    this.__focus = function(){}
    
    this.__blur = function(){}
    
    /* ***********************
     Keyboard Support
     ************************/
    this.keyHandler = function(key, ctrlKey, shiftKey){};
    
    /* ***********************
     DATABINDING
     ************************/
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.xmlNode = this.XMLRoot;
        
        //Refresh Properties
        if (this.applyRuleSetOnNode("Value", this.XMLRoot) == this.values[0]) 
            this.check();
        else 
            this.uncheck();
    }
    
    this.__load = function(XMLRoot, id){
        //Add listener to XMLRoot Node
        XMLDatabase.addNodeListener(XMLRoot, this);
        
        if (this.applyRuleSetOnNode("Value", XMLRoot) == this.values[0]) 
            this.check();
        else 
            this.uncheck();
    }
    
    /* ***************
     Init
     ****************/
    this.draw = function(){
        this.oExt = jdwin.CreateWidget("button");
    }
    
    this.__loadJML = function(x){
        this.name = x.getAttribute("id");
        this.value = x.getAttribute("value");
        if (x.getAttribute("checked") == "true") 
            this.check();
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.bgoptions = x.getAttribute("bgoptions")
                ? x.getAttribute("bgoptions").split("\|") 
                : ["vertical", 2];
            
            this.oExt.InitButton(0, 0, 1, this.bgoptions[1],
                this.mediaPath.replace(/jav\:\//, "") + x.getAttribute("bgswitch"),
                this.parentNode.offsetHeight ? 1 : 0, "00110");
            // normal, mo, clicked, clickedover, disabled
        }
        
        this.disabled      = x.getAttribute("disabled") || false;
        this.oExt.disabled = this.disabled;
        
        var jmlNode = this;
        this.oExt.onbuttonclick = function(e){
            jmlNode.processClick(e.clicked);
            jmlNode.dispatchEvent("onclick");
        }
        
        this.values = x.getAttribute("values") 
            ? x.getAttribute("values").split("\|") 
            : ["true", "false"];
        
        //Set inline binding
        if (x.getAttribute("bind")) {
            var sNode = jpf.getObject("XMLDOM", "<Type><DataBinding connect='"
                + (this.form ? y.getAttribute("id") : this.getInheritedConnectId(x)) 
                + "' type='select'><Value select=\"" 
                + x.getAttribute("bind").replace(/"/g, "\\\"") 
                + "\"  /></DataBinding></Type>").documentElement;
            var dbnode = sNode.selectSingleNode("DataBinding");
            
            me.stackDB.push([this, sNode, dbnode]);
        }
        
        this.__focus();
    }
    
    DeskRun.register(this);
}

//#endif
