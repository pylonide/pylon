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
// #ifdef __JMFSLIDER || __INC_ALL

/**
 * @constructor
 */
jpf.MFSlider = function(pHtmlNode){
    jpf.register(this, "MFSlider", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode);
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.focussable = false; // This object cant get the focus
    this.disabled   = false; // Object is enabled
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        if (value == "") 
            return;
        this.value = value;
        
        if (Math.abs(this.oExt.pos - value) > 0.00000001) 
            this.oExt.pos = value;
    }
    
    this.getValue = function(){
        return this.oExt.pos;
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
        //alert(node.ownerDocument.selectSingleNode("//node()[@v='" + node.nodeValue + "']").parentNode.parentNode.parentNode.parentNode.parentNode.xml);
        //alert(this.XMLRoot.xml);
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
                return;
        }
        
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
        }
        else 
            this.setValue("");
    }
    
    this.__load = function(XMLRoot, id){
        //Add listener to XMLRoot Node
        XMLDatabase.addNodeListener(XMLRoot, this);
        
        var value = (this.bindingRules
            ? this.applyRuleSetOnNode("Value", XMLRoot)
            : (this.jml.firstChild ? this.jml.firstChild.nodeValue : false));
        if ((value || typeof value == "string")) {
            if (value != this.getValue()) 
                this.setValue(value);
        } else 
            this.setValue("");
    }
    
    this.changeSlider = function(e){
        this.Change(e.pos);
    }
    
    this.draw = function(){
        this.oExt = jdwin.CreateWidget("slider");
        
        /*var img = document.body.appendChild(document.createElement("IMG"));
         img.src = this.mediaPath + this.jml.getAttribute("slider");
         img.style.position = "absolute";
         img.style.left = "10px";
         img.style.top = "10px";
         img.style.width = "200px";
         img.style.height = "200px";
         img.style.zIndex = 10000;*/
        var il = this.jml.getAttribute("in_left");
        var it = this.jml.getAttribute("in_top");
        var ib = this.jml.getAttribute("in_bottom");
        var ir = this.jml.getAttribute("in_right");
        
        this.oExt.InitSlider(0, 0, (il ? il : 0), (it ? it : 0), (ir ? ir : 0),
            (ib ? ib : 0), (this.jml.getAttribute("direction") == "vertical" ? 1 : 0),
            this.mediaPath.replace(/jav\:\//, "") + this.jml.getAttribute("bgimage"),
            this.mediaPath.replace(/jav\:\//, "") + this.jml.getAttribute("sliderimage"), 0);
        // this.parentNode.offsetHeight ? 1 : 0); //horizontal 0, vertical 1
        
        var jmlNode = this;
        this.oExt.SetOnSliderChange(1, 0, function(e){
            jmlNode.Change(e.pos);
        });
    }
    
    this.__loadJML = function(x){
        if (x.getAttribute("value")) 
            this.setValue(x.getAttribute("value"));
    }
    
    DeskRun.register(this);
}
//#endif
