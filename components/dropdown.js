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

// #ifdef __JDROPDOWN || __INC_ALL
// #define __JBASELIST 1
// #define __WITH_GANIM 1

/**
 * Component allowing a user to select a value from a list 
 * which is only displayed on request by the user.
 *
 * @classDescription		This class creates a new dropdown
 * @return {Dropdown} Returns a new dropdown
 * @type {Dropdown}
 * @constructor
 * @allowchild item, {smartbinding}
 * @addnode components:dropdown
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.dropdown = function(pHtmlNode){
    jpf.register(this, "dropdown", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.BaseList
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.BaseList, jpf.JmlNode);
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    this.animType        = 1;
    this.animSteps       = 5;
    this.animSpeed       = 20;
    this.itemSelectEvent = "onmouseup";
    
    this.dragdrop        = false;
    this.reselectable    = true;
    this.__focussable      = true;
    this.nonSizingHeight = true;

    this.autoselect      = false;
    this.multiselect     = false;
    
    this.setLabel = function(value){
        //#ifdef __SUPPORT_Safari
        this.oLabel.innerHTML = value || this.initialMsg || "";
        /* #else
        this.oLabel.nodeValue = value || this.initialMsg || "";//nodeValue
        #endif */
        
        this.__setStyleClass(this.oExt, value ? "" : this.baseCSSname + "Initial",
            [!value ? "" : this.baseCSSname + "Initial"]);
    }

    this.addEventListener("onafterselect", function(e){
        if (!e) e = event;
        
        this.slideUp();
        if (!this.isOpen)
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "over"]);
        
        this.setLabel(this.applyRuleSetOnNode("caption", this.selected))
        //return selBindClass.applyRuleSetOnNode(selBindClass.mainBind, selBindClass.XMLRoot, null, true);
        
        //#ifdef __WITH_MULTIBINDING
        this.__updateOtherBindings();
        //#endif
        
        //#ifdef __JSUBMITFORM
        if (this.hasFeature(__VALIDATION__) && this.form) {
            this.validate();
        }
        //#endif
    });
    
    this.addEventListener("onafterdeselect", function(){
        this.setLabel("");
    });
    
    function setMaxCount() {
        this.setMaxItems(this.getTraverseNodes().length);
        if (this.isOpen == 2)
            this.slideDown();
    }
    this.addEventListener("onafterload", setMaxCount);
    this.addEventListener("onxmlupdate", function(){
        setMaxCount.call(this);
        this.setLabel(this.applyRuleSetOnNode("caption", this.selected));
    });
    
    /*this.addEventListener("oninitselbind", function(bindclass){
        var jmlNode = this;
        bindclass.addEventListener("onxmlupdate", function(){
            debugger;
            jmlNode.__showSelection();
        });
    });*/
    
    //#ifdef __WITH_MULTIBINDING
    //For MultiBinding
    this.__showSelection = function(value){
        //Set value in Label
        var bc = this.getSelectionSmartBinding();

        //Only display caption when a value is set
        if (value === undefined) {
            var sValue2, sValue = bc.applyRuleSetOnNode("value", bc.XMLRoot,
                null, true);
            if (sValue)
                sValue2 = bc.applyRuleSetOnNode("caption", bc.XMLRoot, null, true);

            if (!sValue2 && this.XMLRoot && sValue) {
                var rule = this.getBindRule(this.mainBind).getAttribute("select");
                
                //#ifdef __SUPPORT_Safari
                xpath = this.ruleTraverse + "[" + rule + "='"
                    + sValue.replace(/'/g, "\\'") + "']";
                /*#else
                xpath = "(" + this.ruleTraverse + ")[" + rule + "='" + sValue.replace(/'/g, "\\'") + "']";
                #endif */
                
                var xmlNode = this.XMLRoot.selectSingleNode(xpath);// + "/" + this.getBindRule("caption").getAttribute("select")
                value = this.applyRuleSetOnNode("caption", xmlNode);
            } else {
                value = sValue2 || sValue;
            }
        }

        this.setLabel(value || "");
    }
    
    //I might want to move this method to the MultiLevelBinding baseclass
    this.__updateOtherBindings = function(){
        if (!this.multiselect) {
            // Set Caption bind
            var bc = this.getSelectionSmartBinding(), caption;
            if (bc && bc.XMLRoot && (caption = bc.bindingRules["caption"])) {
                var xmlNode = jpf.xmldb.createNodeFromXpath(bc.XMLRoot,
                    bc.bindingRules["caption"][0].getAttribute("select"));
                if (!xmlNode)
                    return;
    
                jpf.xmldb.setNodeValue(xmlNode,
                    this.applyRuleSetOnNode("caption", this.selected));
            }
        }
    }
    //#endif
    
    // Private functions
    this.__blur = function(){
        this.slideUp();
        //this.oExt.dispatchEvent("onmouseout")
        if (!this.isOpen)
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "over"])
        //if(this.oExt.onmouseout) this.oExt.onmouseout();
        
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    }
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        //this.__keyHandler(key, ctrlKey, shiftKey, altKey);
        if (!this.XMLRoot) return;
        
        var node;
        
        switch (key) {
            case 38:
                //UP
                if (!this.selected && !this.indicator) return;
                node = this.getNextTraverseSelected(this.indicator
                    || this.selected, false);
                if (node)
                    this.select(node);
                
                break;
            case 40:
                //DOWN
                if (!this.selected && !this.indicator) {
                    node = this.getFirstTraverseNode();
                    if (!node) return;
                } else
                    node = this.getNextTraverseSelected(this.indicator
                        || this.selected, true);
                if (node)
                    this.select(node);
                
                break;
            default:
                if (key == 9) return;	
            
                //if(key > 64 && key < 
                if (!this.lookup || new Date().getTime() - this.lookup.date.getTime() > 1000)
                    this.lookup = {
                        str  : "",
                        date : new Date()
                    };

                this.lookup.str += String.fromCharCode(key);
                
                var nodes = this.getTraverseNodes();
                for (var i = 0; i < nodes.length; i++) {
                    if (this.applyRuleSetOnNode("caption", nodes[i])
                      .indexOf(this.lookup.str) > -1) {
                        this.select(nodes[i]);
                        return;
                    }
                }
            return;
        }

        return false;
    }
    
    this.__setClearMessage = function(msg){
        this.setLabel(msg);
    }
    
    this.__removeClearMessage = function(){
        this.setLabel("");
    }

    this.slideToggle = function(e){
        if (!e) e = event;
        
        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    }

    this.slideDown = function(e){
        if (this.dispatchEvent("onslidedown") === false)
            return false;
        
        this.isOpen = true;
        
        this.oSlider.style.display = "block";
        this.oSlider.style[jpf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";
        
        this.oSlider.style.display = "";
        this.__setStyleClass(this.oExt, this.baseCSSname + "Down");
        
        //var pos = jpf.getAbsolutePosition(this.oExt);
        this.oSlider.style.height = (this.sliderHeight - 1)     + "px";
        this.oSlider.style.width  = (this.oExt.offsetWidth - 2) + "px";

        jpf.Popup.show(this.uniqueId, 0, this.oExt.offsetHeight, true, this.oExt,
            this.oExt.offsetWidth, this.containerHeight,
            function(container){
                container.style[jpf.supportOverflowComponent ? "overflowY" : "overflow"] = "auto";
            });
    }
    //#ifdef __JSUBMITFORM
    this.addEventListener("onslidedown", function(){
        //THIS SHOULD BE UPDATED TO NEW SMARTBINDINGS
        if (!this.form || !this.form.xmlActions || this.XMLRoot)
            return;
        var loadlist = this.form.xmlActions.selectSingleNode("LoadList[@element='"
            + this.name + "']");
        if (!loadlist) return;
        
        this.isOpen = 2;
        this.form.processLoadRule(loadlist, true, [loadlist]);
        
        return false;
    });
    //#endif	
    
    this.slideUp = function(){
        if (this.isOpen == 2) return;
        if (this.dispatchEvent("onslideup") === false) return false;
        
        this.isOpen = false;
        if (this.selected) {
            var htmlNode = jpf.xmldb.findHTMLNode(this.selected, this);
            if(htmlNode) this.__setStyleClass(htmlNode, '', ["hover"]);
        }
        
        this.__setStyleClass(this.oExt, '', [this.baseCSSname + "Down"]);
        jpf.Popup.hide();
    }
    this.addEventListener("onpopuphide", this.slideUp);
    
    this.setMaxItems = function(count) {
        this.sliderHeight    = count 
            ? (Math.min(this.maxItems, count) * this.itemHeight)
            : 10;
        this.containerHeight = count
            ? (Math.min(this.maxItems, count) * this.itemHeight)
            : 10;
        if (this.containerHeight > 20)
            this.containerHeight = Math.ceil(this.containerHeight * 0.9);
    }
    
    this.draw = function(){
        this.__getNewContext("Main");
        this.__getNewContext("Container");
        
        this.animType  = this.__getOption("Main", "animtype") || 1;
        this.clickOpen = this.__getOption("Main", "clickopen") || "button";

        //Build Main Skin
        this.oExt = this.__getExternal(null, null, function(oExt){
            oExt.setAttribute("onmouseover", 'var o = jpf.lookup(' + this.uniqueId
                + ');o.__setStyleClass(o.oExt, o.baseCSSname + "over");');
            oExt.setAttribute("onmouseout", 'var o = jpf.lookup(' + this.uniqueId
                + ');if(o.isOpen) return;o.__setStyleClass(o.oExt, "", [o.baseCSSname + "over"]);');
            
            //Button
            var oButton = this.__getLayoutNode("main", "button", oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown", 'jpf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
                //oButton.setAttribute("onmouseup", 'var o = jpf.lookup(" + this.uniqueId + ");o.__setStyleClass(o.oExt, '', [o.oExt.className.split(' ')[0] + 'down'])");
                //oButton.setAttribute("onmouseout", 'var o = jpf.lookup(" + this.uniqueId + ");o.__setStyleClass(o.oExt, '', [o.oExt.className.split(' ')[0] + 'down'])");
            }
            
            //Label
            var oLabel = this.__getLayoutNode("main", "label", oExt);
            if (this.clickOpen == "both") {
                oLabel.parentNode.setAttribute("onmousedown", 'jpf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
            }
        });
        this.oLabel = this.__getLayoutNode("main", "label", this.oExt);
        
        //#ifdef __SUPPORT_Safari
        if (this.oLabel.nodeType == 3)
            this.oLabel = this.oLabel.parentNode;
        //#endif
        
        this.oIcon = this.__getLayoutNode("main", "icon", this.oExt);
        if (this.oButton)
            this.oButton = this.__getLayoutNode("main", "button", this.oExt);
        
        //Slider
        /*var oSlider = this.__getLayoutNode("Container", null, oExt);
        oSlider.setAttribute("onmouseover", "event.cancelBubble = true");
        oSlider.setAttribute("onmouseout", "event.cancelBubble = true");*/
        this.oSlider = jpf.xmldb.htmlImport(this.__getLayoutNode("Container"),
            document.body);
        this.oInt = this.__getLayoutNode("Container", "contents", this.oSlider);
        
        //Set up the popup
        this.pHtmlDoc = jpf.Popup.setContent(this.uniqueId, this.oSlider,
            jpf.PresentationServer.getCssString(this.skinName));
        
        //Get Options form skin
        this.listtype = parseInt(this.__getLayoutNode("main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        
        if (this.jml.childNodes.length) 
            this.loadInlineData(this.jml);
        if (this.jml.getAttribute("fill"))
            this.loadFillData(this.jml.getAttribute("fill"));
    }
    
    this.__loadJml = function(x){
        this.name          = x.getAttribute("id");
        this.maxItems      = x.getAttribute("maxitems") || 5;
        this.disableremove = x.getAttribute("disableremove") != "false";
        
        this.setMaxItems();
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("ref"))
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
        
        this.initialMsg = x.getAttribute("initial");
        
        this.itemHeight = this.__getOption("Main", "item-height") || 18.5;
    }
    
    this.__destroy = function(){
        jpf.Popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oSlider);
        this.oSlider = null;
    }
}

// #endif
