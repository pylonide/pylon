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
// #ifdef __JMFDISPLAY || __INC_ALL

/**
 * @constructor
 */
jpf.MFDisplay = function(pHtmlNode){
    jpf.register(this, "MFDisplay", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.DataBinding, jpf.JmlNode);
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.focussable = true; // This object can get the focuse
    this.disabled   = false; // Object is enabled
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        this.value = value;
        
        this.oGroup.SetFlowValue('value', parseFloat(value));
        this.oExt.Redraw();
    }
    
    this.setNamedValue = function(name, value){
        this.oGroup.SetFlowValue(name, value);
        this.oExt.Redraw();
    }
    
    this.getValue = function(){
        return this.value;
    }
    
    /* ***********************
     Actions
     ************************/
    this.Change = function(value){
        var node = this.getNodeFromRule("Value", this.XMLRoot);
        if (!node) {
            this.setValue(value);
            return;
        }
        
        if (!this.errBox && this.form) 
            this.errBox = this.form.getErrorBox(this.name);
        if (this.errBox && this.errBox.isVisible() && this.isValid()) {
            this.clearError();
            this.errBox.hide();
        }
        
        var atAction = (node.nodeType == 1 || node.nodeType == 3
            || node.nodeType == 4) ? "setTextNode" : "setAttribute";
        var args = node.nodeType == 1
            ? [node, value] 
            : (node.nodeType == 3 || node.nodeType == 4 
                ? [node.parentNode, value] 
                : [node.selectSingleNode(".."), node.nodeName, value]);
        
        //Use Action Tracker
        this.executeAction(atAction, args, "Change", this.XMLRoot);
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    //Handler for a plane list
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 37:
                //LEFT
                break;
            case 38:
                //UP
                break;
            case 39:
                //RIGHT
                break;
            case 40:
                //DOWN
                break;
            default:
                return;        }
        
        return false;
    }
    
    /* ***********************
     Databinding
     ************************/
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Action Tracker Support
        if (UndoObj) 
            UndoObj.xmlNode = this.XMLRoot;
        
        //Refresh Properties
        //var value = this.applyRuleSetOnNode("Value", this.XMLRoot);
        //if(value != this.getValue()) this.setValue(value || "");
        
        var value = this.applyRuleSetOnNode("Value", this.XMLRoot);
        if ((value || typeof value == "string")) {
            if (value != this.getValue()) 
                this.setValue(value);
        } else 
            this.setValue("");
    }
    
    this.__load = function(XMLRoot, id){
        //Add listener to XMLRoot Node
        XMLDatabase.addNodeListener(XMLRoot, this);
        
        var value = (this.rules
            ? this.applyRuleSetOnNode("Value", XMLRoot) 
            : (this.jml.firstChild ? this.jml.firstChild.nodeValue : false));
        if ((value || typeof value == "string")) {
            if (value != this.getValue()) 
                this.setValue(value);
        } else 
            this.setValue("");
    }
    
    /* ***********************
     INIT
     ************************/
    this.changeSlider = function(value, userdata){
        this.Change(value);
    }
    
    this.draw = function(){
        this.oFlow = jdshell.CreateComponent("flow");
        this.oFlow.InitFlowRenderDevice("software", 3);
        
        this.oExt   = jdwin.CreateWidget("display");
        this.oGroup = this.oFlow.CreateFlowNode(this.__getLayoutNode("Main"), "dial");
        var x       = this.jml;
        
        this.oExt.InitDisplay(this.oFlow, parseInt(x.getAttribute("left")) + 2,
            parseInt(x.getAttribute("top")) + 40 + 2,
            parseInt(x.getAttribute("width")),
            parseInt(x.getAttribute("height")), "over", "", 100, 25);
        this.oExt.flowdraw  = this.oGroup.GetFlowNode("final");
        this.oExt.flowmouse = this.oGroup.GetFlowNode("mouse");
        this.oExt.SetMaskImage(this.mediaPath.replace(/jav\:\//, "") + x.getAttribute("mask"));
    }
    
    this.__loadJML = function(x){
        if (x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
    }
    
    DeskRun.register(this);
}

//#endif
