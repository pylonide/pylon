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

/**
 * @constructor
 */
jpf.MFDropdown = function(pHtmlNode){
    jpf.register(this, "MFDropdown", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.BaseList
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.BaseList, jpf.JmlNode);
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    this.animType  = 1;
    this.animSteps = document.all ? 5 : 8;
    this.animSpeed = document.all ? 20 : 10;
    this.itemSelectEvent = "onmouseup";
    
    this.hasCheckbox  = false;
    this.dragdrop     = false;
    this.reselectable = true;
    this.focussable   = true;

    this.autoselect   = false;
    this.multiselect  = false;

    this.addEventListener("onafterselect", function(e){
        if (IS_IE) e = event;
        
        this.slideUp();
        //this.oExt.onmouseout(e);
        //this.oExt.onmouseout(e);
        this.oExt.caption = this.applyRuleSetOnNode("Caption", this.value);
        this.oExt.Redraw();
        //return selBindClass.applyRuleSetOnNode(selBindClass.mainBind, selBindClass.XMLRoot, null, true);
        
        this.__updateOtherBindings();
        
    });
    
    this.addEventListener("onafterdeselect", function(){
        //this.oLabel.nodeValue = "";
        this.oExt.caption = "";
        this.oExt.Redraw();
    });
    
    function setMaxCount(){
        if (!this.XMLRoot) return;

        this.setMaxItems(this.getTraverseNodes().length);
        if (this.isOpen == 2)
            this.slideDown();
    }
    this.addEventListener("onafterload", setMaxCount);
    this.addEventListener("onxmlupdate", setMaxCount);
    
    /*this.addEventListener("oninitselbind", function(bindclass){
        var jmlNode = this;
        bindclass.addEventListener("onxmlupdate", function(){
            debugger;
            jmlNode.__showSelection();
        });
    });*/
    
    //For MultiBinding
    this.__showSelection = function(value){
        //Set value in Label
        var bc = this.getSelectionBindClass();

        //Only display caption when a value is set
        if (value === undefined) {
            var value = bc.applyRuleSetOnNode("Value", bc.XMLRoot, null, true);
            value = value ? bc.applyRuleSetOnNode("Caption", bc.XMLRoot, null, true) : "";
        }

        //this.oExt.caption = value || "";
        //this.oExt.Redraw();
    }
    
    //I might want to move this method to the MultiLevelBinding baseclass
    this.__updateOtherBindings = function(){
        if (!this.multiselect) {
            // Set Caption bind
            var bc = this.getSelectionBindClass(), caption;
            if (bc && (caption = bc.bindingRules["Caption"])) {
                var xmlNode = XMLDatabase.createNodeFromXpath(bc.XMLRoot,
                    bc.bindingRules["Caption"][0].getAttribute("select"));
                if (!xmlNode) return;
    
                XMLDatabase.setNodeValue(xmlNode,
                    this.applyRuleSetOnNode("Caption", this.value));
            }
        }
    }
    
    /* ***********************
      Private functions
    ************************/
    
    this.__blur = function(){
        this.slideUp();
        //this.oExt.dispatchEvent("onmouseout")
        //if(this.oExt.onmouseout) this.oExt.onmouseout();
        
        //this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    }
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        //this.__keyHandler(key, ctrlKey, shiftKey, altKey);
        if (!this.XMLRoot) return;
        
        switch (key) {
            case 38:
                //UP
                if (!this.value && !this.indicator) return;

                var node = this.getNextTraverseSelected(this.indicator
                    || this.value, false);
                if (node)
                    this.select(node);
                
                break;
            case 40:
                //DOWN
                var node;
                
                if (!this.value && !this.indicator) {
                    node = this.getFirstTraverseNode();
                    if (!node) return;
                } else
                    node = this.getNextTraverseSelected(this.indicator || this.value, true);
                if (node)
                    this.select(node);
                
                break;
        }
    }
    
    this.slideToggle = function(e){
        if (!e) e = event;
        
        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    }

    this.slideDown = function(e){
        if (this.dispatchEvent("onslidedown") === false) return false;
        
        this.isOpen = true;
        
        this.oSlider.style.display = "block";
        this.oSlider.style[IS_IE ? "overflowY" : "overflow"] = "hidden";
        
        this.oSlider.style.display = "";
        //this.__setStyleClass(this.oExt, this.baseCSSname + "Down");
        
        /*var HT = this.sliderHeight;
        new GuiAnimation(this.oSlider, this.direction == "up" ? 'scrolltop' : 'scrollheight', 0, HT, this.animType, this.animSteps, this.animSpeed, 
            function(container){
                container.style[IS_IE ? "overflowY" : "overflow"] = "auto";
            });*/

        //var pos = jpf.compat.getAbsolutePosition(this.oExt);
        this.oSlider.style.height = (this.sliderHeight - 1) + "px";
        this.oSlider.style.width  = (this.jml.getAttribute("width") - 2) + "px";
        jpf.Popup.show(this.uniqueId, 0, this.jml.getAttribute("height"), true,
            this.oLoc, this.jml.getAttribute("width"), this.containerHeight,
                function(container){
                    container.style[IS_IE ? "overflowY" : "overflow"] = "auto";
                });
    }
    
    this.slideUp = function(){
        if (this.isOpen == 2) return;
        if (this.dispatchEvent("onslideup") === false) return false;
        
        this.isOpen = false;
        if (this.value) {
            var htmlNode = XMLDatabase.findHTMLNode(this.value, this);
            if (htmlNode)
                this.__setStyleClass(htmlNode, '', ["hover"]);
        }
        
        //this.__setStyleClass(this.oExt, '', [this.baseCSSname + "Down"]);
        jpf.Popup.hide();
    }
    this.addEventListener("onpopuphide", this.slideUp);
    
    this.setMaxItems = function(count){
        this.sliderHeight    = count ? (Math.min(this.maxItems, count) * 18) + 1 : 10;
        this.containerHeight = count ? (Math.min(this.maxItems, count) * 18) + 1 : 10;
        if (this.containerHeight > 20)
            this.containerHeight = Math.ceil(this.containerHeight*0.9);
    }
    
    this.disable = this.enable = function(){};
    
    this.__removeClearMessage = function(){
        //var oEmpty = this.oSlider.ownerDocument.getElementById("empty" + this.uniqueId);
        //if(oEmpty) oEmpty.parentNode.removeChild(oEmpty);
        //else this.oInt.innerHTML = ""; //clear if no empty message is supported
        var nodes = this.oSlider.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if(nodes[i].getAttribute("id").match(/empty/))
                this.oSlider.removeChild(nodes[i]);
        }
    }
    
    this.draw = function(){
        this.animType  = this.__getOption("Main", "animtype") || 1;
        this.clickOpen = this.__getOption("Main", "clickopen") || "button";

        this.oExt = jdwin.CreateWidget("button");
        
        this.oLoc                = this.pHtmlNode.appendChild(document.createElement("div"));
        this.oLoc.style.position = "absolute";
        this.oLoc.style.left     = this.jml.getAttribute("left");
        this.oLoc.style.top      = this.jml.getAttribute("top");
        
        //Build Main Skin
        /*this.oExt = this.__getExternal(null, null, function(oExt){
            oExt.setAttribute("onmouseover", 'var o = jpf.lookup(' + this.uniqueId + ');o.__setStyleClass(o.oExt, o.baseCSSname + "over");');
            oExt.setAttribute("onmouseout", 'var o = jpf.lookup(' + this.uniqueId + ');if(o.isOpen) return;o.__setStyleClass(o.oExt, "", [o.baseCSSname + "over"]);');
            
            //Button
            var oButton = this.__getLayoutNode("Main", "button", oExt);
            if(oButton){
                oButton.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId + ').slideToggle(event);');
                //oButton.setAttribute("onmouseup", 'var o = jpf.lookup(" + this.uniqueId + ");o.__setStyleClass(o.oExt, '', [o.oExt.className.split(' ')[0] + 'down'])");
                //oButton.setAttribute("onmouseout", 'var o = jpf.lookup(" + this.uniqueId + ");o.__setStyleClass(o.oExt, '', [o.oExt.className.split(' ')[0] + 'down'])");
            }
            
            //Label
            var oLabel = this.__getLayoutNode("Main", "label", oExt);
            if(this.clickOpen == "both"){
                oLabel.parentNode.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId + ').slideToggle(event);');
            }
        });
        this.oLabel = this.__getLayoutNode("Main", "label", this.oExt);
        this.oIcon = this.__getLayoutNode("Main", "icon", this.oExt);
        if(this.oButton) this.oButton = this.__getLayoutNode("Main", "button", this.oExt);*/
        
        //Slider
        /*var oSlider = this.__getLayoutNode("Container", null, oExt);
        oSlider.setAttribute("onmouseover", "event.cancelBubble = true");
        oSlider.setAttribute("onmouseout", "event.cancelBubble = true");*/
        this.oSlider = XMLDatabase.htmlImport(this.__getLayoutNode("Container"),
             document.body);
        this.oInt = this.__getLayoutNode("Container", "contents", this.oSlider);
        
        //Set up the popup
        this.pHtmlDoc = jpf.Popup.setContent(this.uniqueId, this.oSlider,
            jpf.PresentationServer.getTemplate(this.skinName)
            .selectSingleNode("style").firstChild.nodeValue);
        
        //Get Options form skin
        this.listtype = parseInt(this.__getLayoutNode("Main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
    }
    
    this.__loadJML = function(x){
        this.name               = x.getAttribute("id");
        this.maxItems           = x.getAttribute("max-items") || 5;
        this.disableremove      = x.getAttribute("disableremove") != "false";
        this.direction          = x.getAttribute("direction") || "down";
        this.clearOnNoSelection = x.getAttribute("clearonnoselection") == "true";
        
        //deskrun
        this.bgswitch           = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.bgoptions = x.getAttribute("bgoptions")
                ? x.getAttribute("bgoptions").split("\|") 
                : ["vertical", 2];
            
            this.oExt.InitButton(0, 0, 0, this.bgoptions[1],
                this.mediaPath.replace(/jav\:\//, "") + x.getAttribute("bgswitch"),
                this.parentNode.offsetHeight ? 1 : 0);
            
            this.oExt.locked   = false;
            this.oExt.clicked  = false;
            this.oExt.disabled = false;
            //this.setCaption("");
            //if(x.getAttribute("color")) this.setColor(x.getAttribute("color"));
            
            var clr = "0x000000";//eval(color.replace(/#/, "0x"));
            
            var il = this.jml.getAttribute("in_left");
            var it = this.jml.getAttribute("in_top");
            var ib = this.jml.getAttribute("in_bottom");
            var ir = this.jml.getAttribute("in_right");
            var s  = this.jml.getAttribute("center");
            this.oExt.SetFont(0, "Arial", 10, 0, clr, (il ? il : 4),
                (it ? it : 4), (ir ? ir : 18), (ib ? ib : 0), s);
            this.oExt.SetFont(1, "Arial", 10, 0, clr, (il ? il : 4),
                (it ? it : 4), (ir ? ir : 18), (ib ? ib : 0), s);
            this.oExt.SetFont(2, "Arial", 10, 0, clr, (il ? il : 4),
                (it ? it : 4), (ir ? ir : 18), (ib ? ib : 0), s);
        }
        
        var jmlNode = this;
        this.oExt.onbuttonclick = function(){
            jmlNode.slideToggle({});
        }
        //deskrun
        
        if (x.childNodes.length)
            this.loadInlineData(x);
        
        this.setMaxItems();
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("bind"))
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
    }
    
    this.__destroy = function(){
        jpf.Popup.removeContent(this.uniqueId);
    }
}
