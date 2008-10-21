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
 * Component allowing a user to select a value from a list, which is 
 * displayed when the user clicks a button.
 *
 * @constructor
 * @allowchild item, {smartbinding}
 * @addnode components:dropdown
 *
 * @inherits jpf.BaseList
 * @inherits jpf.JmlNode
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.dropdown = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$animType        = 1;
    this.$animSteps       = 5;
    this.$animSpeed       = 20;
    this.$itemSelectEvent = "onmouseup";
    
    this.dragdrop         = false;
    this.reselectable     = true;
    this.$focussable      = true;
    this.autoselect       = false;
    this.multiselect      = false;
    
    this.setLabel = function(value){
        //#ifdef __SUPPORT_SAFARI
        this.oLabel.innerHTML = value || this.initialMsg || "";
        /* #else
        this.oLabel.nodeValue = value || this.initialMsg || "";//nodeValue
        #endif */
        
        this.$setStyleClass(this.oExt, value ? "" : this.baseCSSname + "Initial",
            [!value ? "" : this.baseCSSname + "Initial"]);
    };

    this.addEventListener("afterselect", function(e){
        if (!e) e = event;
        
        this.slideUp();
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "over"]);
        
        this.setLabel(this.applyRuleSetOnNode("caption", this.selected))
        //return selBindClass.applyRuleSetOnNode(selBindClass.mainBind, selBindClass.xmlRoot, null, true);
        
        //#ifdef __WITH_MULTIBINDING
        this.$updateOtherBindings();
        //#endif
        
        //#ifdef __JSUBMITFORM
        if (this.hasFeature(__VALIDATION__) && this.form) {
            this.validate();
        }
        //#endif
    });
    
    this.addEventListener("afterdeselect", function(){
        this.setLabel("");
    });
    
    function setMaxCount() {
        this.setMaxItems(this.getTraverseNodes().length);
        if (this.isOpen == 2)
            this.slideDown();
    }

    this.addEventListener("afterload", setMaxCount);
    this.addEventListener("xmlupdate", function(){
        setMaxCount.call(this);
        this.setLabel(this.applyRuleSetOnNode("caption", this.selected));
    });
    
    /*this.addEventListener("initselbind", function(bindclass){
        var jmlNode = this;
        bindclass.addEventListener("xmlupdate", function(){
            debugger;
            jmlNode.$showSelection();
        });
    });*/
    
    //#ifdef __WITH_MULTIBINDING
    //For MultiBinding
    this.$showSelection = function(value){
        //Set value in Label
        var bc = this.getSelectionSmartBinding();

        //Only display caption when a value is set
        if (value === undefined) {
            var sValue2, sValue = bc.applyRuleSetOnNode("value", bc.xmlRoot,
                null, true);
            if (sValue)
                sValue2 = bc.applyRuleSetOnNode("caption", bc.xmlRoot, null, true);

            if (!sValue2 && this.xmlRoot && sValue) {
                var rule = this.getBindRule(this.mainBind).getAttribute("select");
                
                //#ifdef __SUPPORT_SAFARI
                xpath = this.traverse + "[" + rule + "='"
                    + sValue.replace(/'/g, "\\'") + "']";
                /*#else
                xpath = "(" + this.traverse + ")[" + rule + "='" + sValue.replace(/'/g, "\\'") + "']";
                #endif */
                
                var xmlNode = this.xmlRoot.selectSingleNode(xpath);// + "/" + this.getBindRule("caption").getAttribute("select")
                value = this.applyRuleSetOnNode("caption", xmlNode);
            } else {
                value = sValue2 || sValue;
            }
        }

        this.setLabel(value || "");
    };
    
    //I might want to move this method to the MultiLevelBinding baseclass
    this.$updateOtherBindings = function(){
        if (!this.multiselect) {
            // Set Caption bind
            var bc = this.getSelectionSmartBinding(), caption;
            if (bc && bc.xmlRoot && (caption = bc.bindingRules["caption"])) {
                var xmlNode = jpf.xmldb.createNodeFromXpath(bc.xmlRoot,
                    bc.bindingRules["caption"][0].getAttribute("select"));
                if (!xmlNode)
                    return;
    
                jpf.xmldb.setNodeValue(xmlNode,
                    this.applyRuleSetOnNode("caption", this.selected));
            }
        }
    };
    //#endif
    
    // Private functions
    this.$blur = function(){
        this.slideUp();
        //this.oExt.dispatchEvent("mouseout")
        if (!this.isOpen)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "over"])
        //if(this.oExt.onmouseout) this.oExt.onmouseout();
        
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };
    
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        if (!this.xmlRoot) return;
        
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
    }, true);
    
    this.$setClearMessage = function(msg){
        this.setLabel(msg);
    };
    
    this.$removeClearMessage = function(){
        this.setLabel("");
    };

    /**
     * Toggles the visibility of the container with the list elements. It opens
     * or closes it using a slide effect.
     */
    this.slideToggle = function(e){
        if (!e) e = event;
        
        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    };

    /**
     * Shows the container with the list elements using a slide effect.
     */
    this.slideDown = function(e){
        if (this.dispatchEvent("slidedown") === false)
            return false;
        
        this.isOpen = true;
        
        this.oSlider.style.display = "block";
        this.oSlider.style[jpf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";
        
        this.oSlider.style.display = "";
        this.$setStyleClass(this.oExt, this.baseCSSname + "Down");
        
        //var pos = jpf.getAbsolutePosition(this.oExt);
        this.oSlider.style.height = (this.sliderHeight - 1)     + "px";
        this.oSlider.style.width  = (this.oExt.offsetWidth - 2) + "px";

        jpf.popup.show(this.uniqueId, {
            x       : 0,
            y       : this.oExt.offsetHeight,
            animate : true,
            ref     : this.oExt,
            width   : this.oExt.offsetWidth,
            height  : this.containerHeight,
            callback: function(container){
                container.style[jpf.supportOverflowComponent 
                    ? "overflowY"
                    : "overflow"] = "auto";
            }
        });
    };

    //#ifdef __JSUBMITFORM
    this.addEventListener("slidedown", function(){
        //THIS SHOULD BE UPDATED TO NEW SMARTBINDINGS
        if (!this.form || !this.form.xmlActions || this.xmlRoot)
            return;
        var loadlist = this.form.xmlActions.selectSingleNode("LoadList[@element='"
            + this.name + "']");
        if (!loadlist) return;
        
        this.isOpen = 2;
        this.form.processLoadRule(loadlist, true, [loadlist]);
        
        return false;
    });
    //#endif	
    
    /**
     * Hides the container with the list elements using a slide effect.
     */
    this.slideUp = function(){
        if (this.isOpen == 2) return false;
        if (this.dispatchEvent("slideup") === false) return false;
        
        this.isOpen = false;
        if (this.selected) {
            var htmlNode = jpf.xmldb.findHTMLNode(this.selected, this);
            if(htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }
        
        this.$setStyleClass(this.oExt, '', [this.baseCSSname + "Down"]);
        jpf.popup.hide();
        return false;
    };

    this.addEventListener("popuphide", this.slideUp);
    
    /**
     * Determines the number of items that are shown at the same time in 
     * the container.
     */
    this.setMaxItems = function(count) {
        this.sliderHeight    = count 
            ? (Math.min(this.maxItems, count) * this.itemHeight)
            : 10;
        this.containerHeight = count
            ? (Math.min(this.maxItems, count) * this.itemHeight)
            : 10;
        if (this.containerHeight > 20)
            this.containerHeight = Math.ceil(this.containerHeight * 0.9);
    };
    
    this.$draw = function(){
        this.$getNewContext("Main");
        this.$getNewContext("Container");
        
        this.$animType  = this.$getOption("Main", "animtype") || 1;
        this.clickOpen = this.$getOption("Main", "clickopen") || "button";

        //Build Main Skin
        this.oExt = this.$getExternal(null, null, function(oExt){
            oExt.setAttribute("onmouseover", 'var o = jpf.lookup(' + this.uniqueId
                + ');o.$setStyleClass(o.oExt, o.baseCSSname + "over");');
            oExt.setAttribute("onmouseout", 'var o = jpf.lookup(' + this.uniqueId
                + ');if(o.isOpen) return;o.$setStyleClass(o.oExt, "", [o.baseCSSname + "over"]);');
            
            //Button
            var oButton = this.$getLayoutNode("main", "button", oExt);
            if (oButton) {
                oButton.setAttribute("onmousedown", 'jpf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
            }
            
            //Label
            var oLabel = this.$getLayoutNode("main", "label", oExt);
            if (this.clickOpen == "both") {
                oLabel.parentNode.setAttribute("onmousedown", 'jpf.lookup('
                    + this.uniqueId + ').slideToggle(event);');
            }
        });
        this.oLabel = this.$getLayoutNode("main", "label", this.oExt);
        
        //#ifdef __SUPPORT_SAFARI
        if (this.oLabel.nodeType == 3)
            this.oLabel = this.oLabel.parentNode;
        //#endif
        
        this.oIcon = this.$getLayoutNode("main", "icon", this.oExt);
        if (this.oButton)
            this.oButton = this.$getLayoutNode("main", "button", this.oExt);
        
        //Slider
        /*var oSlider = this.$getLayoutNode("Container", null, oExt);
        oSlider.setAttribute("onmouseover", "event.cancelBubble = true");
        oSlider.setAttribute("onmouseout", "event.cancelBubble = true");*/
        this.oSlider = jpf.xmldb.htmlImport(this.$getLayoutNode("Container"),
            document.body);
        this.oInt = this.$getLayoutNode("Container", "contents", this.oSlider);
        
        //Set up the popup
        this.pHtmlDoc = jpf.popup.setContent(this.uniqueId, this.oSlider,
            jpf.skins.getCssString(this.skinName));
        
        //Get Options form skin
        this.listtype = parseInt(this.$getLayoutNode("main", "type")) || 1; //Types: 1=One dimensional List, 2=Two dimensional List
        
        if (this.$jml.childNodes.length) 
            this.$loadInlineData(this.$jml);

        if (this.$jml.getAttribute("fill"))
            this.loadFillData(this.$jml.getAttribute("fill"));
    };
    
    this.$loadJml = function(x){
        this.name          = x.getAttribute("id");
        this.maxItems      = x.getAttribute("maxitems") || 5;
        this.disableremove = x.getAttribute("disableremove") != "false";
        
        this.setMaxItems();
        
        if (x.getAttribute("multibinding") == "true" && !x.getAttribute("ref"))
            this.inherit(jpf.MultiLevelBinding); /** @inherits jpf.MultiLevelBinding */
        
        this.initialMsg = x.getAttribute("initial");
        
        this.itemHeight = this.$getOption("Main", "item-height") || 18.5;
    };
    
    this.$destroy = function(){
        jpf.popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oSlider);
        this.oSlider = null;
    };
}).implement(
    jpf.BaseList
);

// #endif
