/*
    TODO:    
    - floating sections or menus
    
    - single page should drag whole tab like button to section does
    - anim should wait x00ms before playing
    
    - tweak tab animations
    - menu should appear onmouseup not down
    
    INTEGRATION
    - add conditional availability of buttons
    - add right click menu to buttons/sections
*/

define(function(require, exports, module) {

var DockableLayout = module.exports = function(parentHBox, cbFindPage, cbStorePage, cbFindOptions, cbChange) {
    this.columnCounter  = 0;
    this.$parentHBox    = parentHBox;
    this.$cbFindPage    = cbFindPage;
    this.$cbStorePage   = cbStorePage;
    this.$cbChange      = cbChange;
    this.$cbFindOptions = cbFindOptions;
    this.buttonEls      = [];
    var indicator = this.indicator = document.body.appendChild(document.createElement("div"));
    indicator.style.position = "absolute";
    indicator.style.display = "none";
    indicator.style.border = "3px solid #5c5c5c";
    indicator.style.zIndex = 1000000;
};

(function(){
    var whiledrag, lastInfo, diffPixel = 3;
    var menuCounter = 100;
    var panelSplittersCount = 0; 
    /**
     * Retrieve the current state of the layout as a JSON object
     * 
     */
    this.getState = function(changed){
        var state = {bars: [], type: "new_type"};
        
        var bar = this.$parentHBox.lastChild;
        while (bar) {
            if (bar.localName == "bar" && bar.dock) {
                var barInfo = {sections: []};
                barInfo.expanded = bar.expanded || bar.vbox && bar.vbox.visible;
                barInfo.width    = bar.vbox && bar.vbox.width 
                    || bar.$dockData && bar.$dockData.width 
                    || 200;
                
                var sections = bar.selectNodes("vbox");
                for (var i = 0; i < sections.length; i++) {
                    var sectionInfo = {buttons: []};
                    var buttons = sections[i].selectNodes("button");
                    sectionInfo.flex = buttons[0].$dockpage.parentNode && buttons[0].$dockpage.parentNode.flex || false;
                    
                    var menu = self[buttons[0].submenu];
                    sectionInfo.width = menu.width;
                    sectionInfo.height = menu.height;
                    sectionInfo.options = sections[i].$dockData.options;
                    sectionInfo.draggable = sections[i].$dockData.draggable;
                    
                    for (var j = 0; j < buttons.length; j++) {
                        var buttonInfo = {};
                        buttonInfo.ext     = buttons[j].$dockData.ext;
                        buttonInfo.caption = buttons[j].$dockpage.caption;
                        buttonInfo.hidden  = buttons[j].$dockData.hidden;
                        buttonInfo.draggable  = buttons[j].$dockData.draggable;
                        
                        if(buttons[j].$dockData["class"])
                            buttonInfo["class"] = buttons[j].$dockData["class"];
                        
                        if(buttons[j].$dockData.id)
                            buttonInfo.id = buttons[j].$dockData.id;
                        
                        sectionInfo.buttons.push(buttonInfo);
                    }
                    barInfo.sections.push(sectionInfo);
                }
                
                state.bars.unshift(barInfo);
            }
            else if (!bar.bar) {
                break;
            }
            
            bar = bar.previousSibling;
        }
        
        if(changed)
            state.changed = true;
        
        return state;
    };
    
    /**
     * Set the current layout via a JSON object
     * @param {Object} obj JSON object with the following structure:
     *  {
     *      bars : [
     *          {
     *              expanded : false,
     *              width : 300,
     *              sections : [
     *                  {
     *                      flex : 1,
     *                      width : 200,
     *                      height : 200,
     *                      buttons : [
     *                          {
     * 
     *                          }
     *                      ]
     *                  }
     *              ]
     *          }
     *      ]
     *  }
     * 
     */
    this.loadState = function(obj, $noClear){
        if (!$noClear)
            this.clearState();

        var bars = obj.bars,
            visSectionsCount = 0,
            visBtnCount,
            sections,
            bar;
            
        for (var i = 0; i < bars.length; i++) {
            if (bars[i].ref)
                bar = bars[i].ref;
            else {
                bar = this.$addBar();
                bar.$dockData = bars[i];
            }
            
            sections = bars[i].sections;
            
            for (var j = 0; j < sections.length; j++) {
                var section = null, 
                    menu, info;
                    
                if(!sections[j].options)
                    sections[j].options = {};
                
                if (sections[j].sectionIdent) {
                    section = this.$getSection(bar, sections[j].sectionIdent);
                    
                    if (section) {
                        menu = section.$menu;
                        info = section.$dockData;
                    }
                }
                
                if (!section) {
                    section = this.$addSection(bar, bar.childNodes[sections[j].options.position], sections[j].sectionIdent, sections[j]);
                    info = sections[j];
                    menu = this.$addMenu(section);
                    section.$menu = menu;
                    menu.firstChild.setAttribute("flex", info.flex);
                    menu.setAttribute("width", info.width || 260);
                    if(info.height)
                        menu.setAttribute("height", info.height);
                }
                
                var buttons = sections[j].buttons;
                visBtnCount = 0;
                for (var k = 0; k < buttons.length; k++) {
                    var button = this.$addButton(section, menu, 
                        this.$addPage(
                            this.$cbFindPage(buttons[k].ext), 
                            menu, 
                            buttons[k].caption, 
                            buttons[k].caption && buttons[k].caption.toLowerCase() || ""
                        ), apf.extend(buttons[k], this.$cbFindOptions(buttons[k].ext) || {})
                    );
                    button.$dockData = buttons[k];
                    
                    this.buttonEls.push(button);
                    
                    if(!button.hidden)
                        visBtnCount++;
                }
                
                if(visBtnCount > 0)
                    visSectionsCount++;
                else
                    section.hide();
            }
            
            if(!visSectionsCount)
                bar.hide();
            
            if (bars[i].expanded)
                this.expandBar(bar);
        }
    };
    
    /**
     * Destroy full state
     */
    this.clearState = function(soft){
        var bar = this.$parentHBox.lastChild;
        while (bar) {
            if (bar.localName == "bar" && bar.dock) {
                var sections = bar.selectNodes("vbox");
                for (var i = 0; i < sections.length; i++) {
                    var section = sections[i];
                    var buttons = section.selectNodes("button");
                    var menu = self[buttons[0].submenu];
                    for (var j = 0; j < buttons.length; j++) {
                        var button = buttons[j];
                        if(soft) {
                            //button.destroy(true, true);
                           // button.parentNode.removeChild(button);
                        }
                        else {
                            //Store pages
                            this.$cbStorePage(button.$dockpage);
                        }
                    }
                    
                    if(soft) {
                        var tabs = menu.selectNodes("tab"),
                            tab, pages, page;
                        for(var j = 0; j < tabs.length; j++){
                            tab   = tabs[j];
//                            pages = tab.selectNodes("a:page");
//                            for(var k = 0; k < pages.length; k++) {
//                                page = pages[k];
//                                page.removeEventListener("beforedrag", arguments.callee);
//                                page.removeEventListener("afterclose", arguments.callee);
//                                page.removeEventListener("prop.visible", arguments.callee);
//                            }
                            tab.destroy(false, true);
                        }
                        menu.destroy(false, true);
//                        section.destroy(true, true);
                        //menu.parentNode.removeChild(menu);
//                        section.parentNode.removeChild(section);
                    }
                    else
                        menu.destroy(true, true);
                }
            }
            else if (!bar.bar) {
                break;
            }
            
            var next = bar.previousSibling;
            if(soft) {
//                bar.destroy(true, true);
                if(bar.vbox)
                    bar.vbox.destroy(true, true);
//                bar.parentNode.removeChild(bar);
            }
//            else
                bar.destroy(true, true);
            bar = next;
        }
    };
    
    /**
     * Add a section or button to the left most bar.
     * @param {Object} def definition of a section or button as used by the
     * loadState method.
     */
    this.addItem = function(def){
        var bar = this.$getLastBar();
        this.loadState({
            bars : [
                {
                    ref : bar,
                    sections : [
                        def.buttons ? def : {
                            buttons : [
                                def
                            ]
                        }
                    ]
                }
            ]
        }, true);
    };
    
    this.showSection = function(idnt, expand){
        var _self = this,
            bar, section,
            barToExp = [];
        
        for(var i = 0, l = this.buttonEls.length; i < l; i++) {
            var button = this.buttonEls[i];
            if(!button.$dockData || !idnt.contains(button.$dockData.ext[0]))
                continue;

            button.show();
            
            section = button.parentNode;
            if(!section.visible)
                section.show();

            bar = section.parentNode;
            if(!bar.visible)
                bar.show();
            
            if(expand) {
                bar.expanded = true;
                barToExp.push(bar);
            }
        }
        
        setTimeout(function(){
            for(var i = 0, l = barToExp.length; i < l; i++)
                _self.expandBar(barToExp[i]);
        });
            
        
    };
    
    this.hideSection = function(idnt){
        var bar, section, dontHide;

        for(var i = 0, l = this.buttonEls.length; i < l; i++) {
            var button = this.buttonEls[i];
            if(!button.$dockData || !idnt.contains(button.$dockData.ext[0]))
                continue;
            
            button.hide();
            
            section = button.parentNode;
            if(section.visible && section.selectNodes('button[@visible="true"]').length == 0)
                section.hide();
            
            bar = section.parentNode;
            
            //for some reason this does not give what is expected bar.selectNodes('vbox[@visible!="false"]') so we loop
            var vboxes = bar.selectNodes('vbox');
            for(var u = 0, l2 = vboxes.length; u < l2; u++) {
                if(vboxes[u].getAttribute('visible') !== false)
                    dontHide = true;
            }

            if(!dontHide && bar.visible)
                bar.hide();

            dontHide = false;
        }

        var expandedVboxes = this.$parentHBox.selectNodes('vbox'),
            childNodes, childNode;
            
        for(var i = 0, l = expandedVboxes.length; i < l; i++) {
            childNodes = expandedVboxes[i].childNodes;
            dontHide = false;
            
            for(var u = 0, l2 = childNodes.length; u < l2; u++) {
                childNode = childNodes[u];
                if(!childNode || !childNode.extId)
                    continue;
                
                if(!idnt.contains(childNode.extId))
                    dontHide = true;
                else
                    childNode.hide();
            }
            
            if(!dontHide) {
                expandedVboxes[i].previousSibling.hide();
                expandedVboxes[i].hide();
                
                var vboxParent = expandedVboxes[i].parentNode;
                vboxParent.removeChild(expandedVboxes[i].previousSibling);
                vboxParent.removeChild(expandedVboxes[i]);
                
                delete expandedVboxes[i].bar.vbox;
            }
        }
    };
    
    /**
     * Expand a bar
     */
    this.expandBar = function (bar){
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        if (!bar.vbox) {
            var _self = this;
            bar.vbox = bar.parentNode.insertBefore(new apf.vbox({
                padding   : 0,
                width     : bar.$dockData && bar.$dockData.width || 260,
                splitters : true,
                vdock     : 1,
                "class"   : "dockcol unselectable expandedpanel",
                childNodes : [
                    new apf.button({
                        dock       : 1,
                        skin       : "dockheader",
                        "class"    : "expanded",
                        nosplitter : true,
                        height     : 12,
                        resizable  : false,
                        margin     : "0 0 0 0",
                        onclick    : function(){
                            _self.collapseBar(bar);
                        }
                    })
                ]
            }), bar);

            //style hack
            //bar.vbox.$ext.style.borderLeft = "1px solid #333";
            
            bar.splitter = bar.parentNode.insertBefore(new apf.splitter({
                scale   : "right",
                "class" : "splitter-editor-right" + " panelsplitter",//+ (panelSplittersCount > 0 ? " panelsplitter" : ""),
                width   : "0"
            }), bar.vbox);
            
            bar.splitter.bar = 
            bar.vbox.bar     = bar;
            panelSplittersCount++;
        }
        else {
            bar.parentNode.insertBefore(bar.vbox, bar);
            bar.parentNode.insertBefore(bar.splitter, bar.vbox);
        }
        
        var vbox = bar.selectNodes("vbox");
        var countVis = 0;
        
        for (var i = 0; i < vbox.length; i++) {
            var button  = vbox[i].selectSingleNode("button"),
                menu    = self[button.submenu],
                childEl = menu.firstChild;

            menu.hide();
            
            if(childEl && button.visible) {
                childEl.extId = button.$dockData.ext[0];
                bar.vbox.appendChild(childEl);
                console.log(childEl)
                if (!childEl.flex && childEl.tagName != "bar" && !childEl.height)
                    childEl.setAttribute("flex", 1);           
                countVis++;
            }
        }
        
        if(countVis > 0 || bar.expanded) {
            bar.hide();
            bar.vbox.show();
            bar.vbox.expanded = true; 
            bar.expanded = true;
            bar.splitter.show();

            //Hack for button
            bar.vbox.firstChild.$ext.onmousemove({});
        }
        else {
            bar.vbox.hide();
            bar.vbox.expanded = false;
            bar.expanded = false;
            bar.splitter.hide();
        }
        this.$cbChange();
    };
    
    /**
     * Collapse a bar
     */
    this.collapseBar = function(bar){
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        var vbox = bar.selectNodes("vbox");
        var tabs = bar.vbox.selectNodes("tab");
        for (var i = 0; i < vbox.length; i++) {
            var menu = self[vbox[i].selectSingleNode("button").submenu];
            menu.appendChild(tabs[i]);
        }
        
        bar.show();
        bar.vbox.hide();
        bar.vbox.expanded = false;
        bar.expanded = false;
        bar.splitter.hide();
        
        bar.parentNode.removeChild(bar.vbox);
        bar.parentNode.removeChild(bar.splitter);
        
        //Hack for button
        bar.firstChild.$ext.onmousemove({});
        this.$cbChange();
    };
    
    /**
     * Show an item
     * @param {Object} amlNode
     */
    this.show = function(amlNode){
        var button = amlNode.$dockbutton || amlNode;
        //button.showMenu();
        button.dispatchEvent("mousedown", {htmlEvent: {}});
    };
    
    this.$isLastBar = function(aml) {
        var last = this.$parentHBox.lastChild;
        while (last && !last.visible)
            last = last.previousSibling;
        
        return aml == last || aml == last.vbox;
    };

    this.$getLastBar = function(){
        var lastBar = this.$parentHBox.lastChild;
        while (lastBar && lastBar.previousSibling 
          && (lastBar.previousSibling.localName == "bar" 
          && lastBar.previousSibling.dock
          && lastBar.previousSibling .visible
          || lastBar.previousSibling.bar))
            lastBar = lastBar.previousSibling;
        if (lastBar.localName != "bar")
            lastBar = lastBar.bar;
           
        if (lastBar && !lastBar.visible)
        	lastBar = lastBar.vbox;
            
        return lastBar;
    };
    
    /**
     * Starts the docking detection during drag&drop
     */
    this.$startDrag = function (dragged, original){
        var last, state = 0, _self = this;

        apf.setOpacity(dragged.$ext, 0.3);
        
        var lastBar   = this.$getLastBar();
        var leftEdge  = apf.getAbsolutePosition(lastBar.$ext)[0];
        var indicator = this.indicator;
        
        //Fix, actually bug is in interactive
        apf.addListener(document, "mouseup", function(e){
            apf.removeListener(document, "mousemove", whiledrag);
            apf.removeListener(document, "mouseup", arguments.callee);
        });
        
        apf.addListener(document, "mousemove", whiledrag = function(e){
            if (last) {
                last.$ext.style.borderBottom = "";
                delete last;
            }
            
            if (!e) return;
            
            var indicatorTop = indicator.style.top;
            dragged.$ext.style.top = "-2000px";
            indicator.style.top = "-2000px";
            apf.plane.hide();
            
            //Adding a column
            if (e.clientX > leftEdge - 40 && e.clientX < leftEdge) {
                var isSameColumn = dragged.localName == "vbox" 
                    && dragged.$dockbar == lastBar
                    && !dragged.$dockbar.selectNodes("vbox").length;

                info = {
                    position : isSameColumn ? "none" : "left_of_column",
                    aml : aml = last = lastBar
                };
            }
            //Rest
            else {
                var info = _self.$calcAction(e, original);
                var aml  = last = info.aml;
            }
            
            if (lastInfo && lastInfo.position == info.position && lastInfo.aml == aml) {
                indicator.style.top = indicatorTop;
                return;
            }
            
            lastInfo = info;
            
            if (!aml || !aml.dock && !aml.bar) {
                if (!state) {
                    state = 1;
                    apf.tween.single(dragged.$ext, {
                        type: "fade",
                        from: 0.3,
                        to  : 1,
                        steps : 20,
                        onfinish : function(){
                            state = 1;
                        }
                    });
                }
                return;
            }
            
            var pos = apf.getAbsolutePosition(aml.$ext);
            indicator.style.left = pos[0] + "px";
            indicator.style.top  = pos[1] + "px";
            indicator.style.display = "block";
            indicator.style.backgroundColor = "";
            indicator.style.marginLeft = "0";
            indicator.innerHTML = "";
            
            if (state) {
                state = 0;
                apf.tween.single(dragged.$ext, {
                    type: "fade",
                    from: 1,
                    to  : 0.3,
                    steps : 20,
                    onfinish : function(){
                        state = 0;
                    }
                });
            }
            
            var width = aml.$ext.offsetWidth;
            var height = aml.$ext.offsetHeight;

            switch(info.position) {
                case "before_button":
                case "after_button":
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "6px 1px 3px 1px";
                    
                    var pos2 = apf.getAbsolutePosition(aml.parentNode.$ext);
                    indicator.style.left = pos2[0] + "px";
                    indicator.style.top  = pos2[1] + "px";
                    width = aml.parentNode.$ext.offsetWidth;
                    height = aml.parentNode.$ext.offsetHeight;
                    
                    var div = indicator.firstChild;
                    if (aml == getOriginal("button", original)) { //@todo Checks needs to include different representations
                        div.style.top = (pos[1] - pos2[1] - 2) + "px";
                        div.style.left = "2px";
                        div.style.right = "3px";
                        div.style.height = (aml.$ext.offsetHeight - 9) + "px";
                        div.style.border = "2px solid #5c5c5c";
                        div.style.webkitBorderRadius = "6px";
                    }
                    else {
                        div.style.top = (pos[1] - pos2[1]
                            + (info.position == "before_button" ? 0 : aml.$ext.offsetHeight) 
                            - 8) + "px";
                        div.style.width = "100%";
                        div.style.borderBottom = "3px solid rgba(122,199,244,0.8)";
                    }
                    
                    break;
                case "in_section":
                    if (getOriginal("section", original) == aml.$dockfor) {//@todo move this
                        indicator.style.borderWidth = "1px 1px 1px 1px";
                        height--;
                    }
                    break;
                case "after_page":
                case "before_page":
                    var pNode = aml.parentNode;
                    var pos2 = apf.getAbsolutePosition(pNode.$ext);
                    indicator.style.left = (pos2[0] + (!lastBar.expanded ? -3 : 0)) + "px";
                    indicator.style.top  = (pos2[1] + (!lastBar.expanded ? -2 : 3)) + "px";
                    width = pNode.$ext.offsetWidth + (!lastBar.expanded ? 6 : 0);
                    height = pNode.$ext.offsetHeight + (!lastBar.expanded ? 11 : 0);
                    indicator.style.borderWidth = "3px 3px 3px 3px";
                    
                    var compareAml = info.position == "before_page" 
                        ? aml.previousSibling 
                        : aml.nextSibling;
                    var originalAml = getOriginal("page", original);
                    var matchAml = originalAml == aml 
                        ? aml 
                        : (originalAml == compareAml ? compareAml : false);
                    var diff = apf.getAbsolutePosition((matchAml || aml).$button, pNode.$ext);
                    if (matchAml) {
                        indicator.innerHTML = "<div style='position:absolute;'></div><div style='position:absolute;'></div><div style='position:absolute;'></div>";
                        var div1 = indicator.firstChild;
                        var div2 = indicator.childNodes[1];
                        var div3 = indicator.childNodes[2];
                        div1.style.left = (diff[0] - (!lastBar.expanded ? 3 : 6)) + "px";
                        div1.style.width = (matchAml.$button.offsetWidth - 1) + "px";
                        div1.style.height = "18px";
                        div1.style.margin = "-21px 0 0 0px";
                        div1.style.border = "3px solid rgba(122,199,244,0.5)";
                        div1.style.borderWidth = "3px 3px 0 3px";
                        
                        div2.style.left = (diff[0] + matchAml.$button.offsetWidth - 4) + "px";
                        div2.style.right = "0px";
                        div3.style.borderBottom =
                        div2.style.borderBottom = "3px solid rgba(122,199,244,0.5)";
                        
                        div3.style.left = "0px";
                        div3.style.right = (width - diff[0] - 4) + "px";
                        
                        indicator.style.borderTop = "0px solid #5c5c5c";
                        indicator.style.borderColor = "rgba(122,199,244,0.5)";
                        indicator.style.top = (pos2[1] + (!lastBar.expanded ? 19 : 24)) + "px";
                        height -= 26 + (!lastBar.expanded ? 1 : 0);
                        width  -= 1;
                    }
                    else {
                        indicator.innerHTML = "<div style='position:absolute;'><div></div></div>";
                        indicator.firstChild.style.height = !lastBar.expanded ? "22px" : "19px";
                        indicator.firstChild.style.width = "5px";
                        indicator.firstChild.style.background = "rgba(122,199,244,0.5)";
                        indicator.firstChild.style.top = "0px";
                        indicator.firstChild.firstChild.style.background = "#5c5c5c";
                        indicator.firstChild.firstChild.style.height = "100%";
                        indicator.firstChild.firstChild.style.margin="0 2px 0 2px";
                        
                        var left = (diff[0] + 
                            (info.position == "before_page" ? 0 : aml.$button.offsetWidth));

                        if (left)
                            left -= 5;
                        else {
                            indicator.firstChild.style.width = "2px";
                            indicator.firstChild.firstChild.style.marginLeft = "0px";
                        }
                        indicator.firstChild.style.left = left + "px";
                        height -= 7;
                        width  -= 1;
                    }
                    break;
                case "before_tab":
                    height = 0;
                case "after_tab":
                    indicator.style.left = pos[0] + "px";
                    indicator.style.top  = (pos[1] + height - (!aml.nextSibling ? 3 : 0)) + "px";
                    indicator.style.height = "3px";
                    indicator.style.width = width + "px";
                    indicator.style.borderWidth = "0 0 0 0";
                    indicator.style.backgroundColor = "rgba(122,199,244," 
                        + (!aml.nextSibling ? 1 : 0.8) + ")";
                    
                    return;
                case "before_section":
                    height = 0;
                case "after_section":
                    indicator.style.left = pos[0] + "px";
                    indicator.style.top  = (pos[1] + height - 3) + "px";
                    indicator.style.height = "5px";
                    indicator.style.width = aml.$ext.offsetWidth + "px";
                    indicator.style.borderWidth = "0 0 0 0";
                    indicator.innerHTML = "<div style='margin:2px 0 2px 0'></div>";
                    indicator.firstChild.style.backgroundColor = "#5c5c5c";
                    indicator.firstChild.style.height = "1px";
                    indicator.style.backgroundColor = "rgba(122,199,244,0.5)";
                    return;
                case "in_column":
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "0 0 0 0";
                    
                    var div = indicator.firstChild;
                    div.style.top = "100%";
                    div.style.borderTop = "3px solid rgba(122,199,244,0.8)"
                    div.style.height = (dragged.localName == "vbox" ? dragged.$ext.offsetHeight : 50) + "px";
                    div.style.background = "rgba(172,172,172,0.5)";
                    div.style.width = "100%";
                    div.style.webkitBorderRadius = "0 0 4px 4px";
                    
                    /*apf.tween.single(div, {
                        type: "height",
                        from: 0,
                        to  : dragged.localName == "vbox" ? dragged.$ext.offsetHeight : 50,
                        anim : apf.tween.EASEOUT,
                        steps : 20
                    });*/
                    
                    break;
                case "left_of_column":
                    if (aml != _self.$getLastBar()) {
                        indicator.style.borderWidth = "0 0 0 3px";
                        indicator.style.marginLeft = "-1px";
                    }
                    else {
                        indicator.innerHTML = "<div style='position:absolute'></div>";
                        indicator.style.borderWidth = "0 0 0 0";
                        
                        var div = indicator.firstChild;
                        div.style.right = "100%";
                        div.style.width = 0;
                        div.style.height = "100%";
                        div.style.borderRight = "3px solid #5c5c5c"
                        div.style.background = "rgba(172,172,172,0.5)";
                        div.style.webkitBorderRadius = "4px 0 0 4px";
                        
                        apf.tween.single(div, {
                            type: "width",
                            from: 0,
                            to  : 40,
                            anim : apf.tween.EASEOUT,
                            steps : 20
                        });
                    }
                    break;
                case "right_of_column":
                    indicator.style.borderWidth = "0 3px 0 0";
                    if (!_self.$isLastBar(aml))
                        indicator.style.marginLeft = "2px";
                    break;
                default:
                    indicator.style.display = "none";
                    apf.setOpacity(dragged.$ext, 1);
                    break;
            }
            
            var diff = apf.getDiff(indicator);
            indicator.style.width  = (width - diff[0]) + "px";
            indicator.style.height = (height - diff[1]) + "px";
        });
        
        whiledrag.dragged  = dragged;
        whiledrag.original = original;
    }
    
    /**
     * Normalize types by converting them to the requested widget type of the
     * conceptual single object
     */
    function getOriginal(type, aml) {
        if (type == "button") {
            if (aml.localName == "page")
                return aml.$dockbutton;
            if (aml.localName == "divider") {
                var buttons = aml.parentNode.selectNodes("button");
                if (buttons.length == 1)
                    return buttons[0];
            }
            return aml;
        }
        else if (type == "page") {
            if (aml.localName == "button")
                return aml.$dockpage;
            if (aml.localName == "divider") {
                var buttons = aml.parentNode.selectNodes("button");
                if (buttons.length == 1)
                    return buttons[0].$dockpage;
            }
            return aml;
        }
        else if (type == "section") {
            if (aml.localName == "page" && aml.parentNode.getPages().length == 1)
                return aml.$dockbutton.parentNode;
            if (aml.localName == "divider")
                return aml.parentNode;
            return aml;
        }
    }
    
    function matchTab(pos, y) {
        return y > pos - diffPixel && y < pos + diffPixel;
    }
    
    /**
     * Calculate what action will be performed based on the relative location
     * of the mouse cursor
     */
    this.$calcAction = function(e, original){
        var position = "none";
    
        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (el == document.body)
            return {};
        
        var aml = apf.findHost(el);
        if (!aml) return {};

		if (!aml.dock || aml.localName == "page" || aml.localName == "tab") {
            var node = aml;
            while (node && !node.vdock)
                node = node.parentNode;
            
            if (node && node.localName == "vbox") {
                var tabs = node.selectNodes("tab");
                var pos = apf.getAbsolutePosition(node.$ext)[1];
                var doTest = original.parentNode.localName == "tab" 
                    && original.parentNode.getPages().length == 1;

                if (matchTab(apf.getAbsolutePosition(tabs[0].$ext, node.$ext)[1] + pos, e.clientY)) {
                    return doTest && original.parentNode == tabs[0] 
                        ? {} : {position: "before_tab", aml: tabs[0]};
                }
                        
                for (var i = 0; i < tabs.length; i++) {
                    if (matchTab(tabs[i].$ext.offsetHeight + 1 
                      + apf.getAbsolutePosition(tabs[i].$ext, node.$ext)[1] + pos - (!aml.nextSibling ? 3 : 0), e.clientY)) {
                        return doTest && (original.parentNode == tabs[i] || original.parentNode == tabs[i+1])
                            ? {} : {position: "after_tab", aml: tabs[i]};
                    }
                }
            }
        }
        
        if (aml.localName == "splitter") {
            aml.$ext.style.display = "none";
            aml = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
            aml.$ext.style.display = "block";
        }
    
        if (!aml.dock && !aml.bar)
            return {};

        var bar = aml;
        while (bar && bar.localName != "bar" && (bar.localName != "vbox" || !bar.dock && !bar.bar))
            bar = bar.parentNode;
    
        if (bar) {
            var pos = apf.getAbsolutePosition(e.target, bar.$ext);
            var l = pos[0] + e.offsetX;
            var r = bar.$ext.offsetWidth - l;
        }
        
        if (bar && l < diffPixel) {
            var isSameColumn = original.localName == "divider" 
                && (original.parentNode.$dockbar == bar
                || original.parentNode.$dockbar == bar.previousSibling)
                && !original.parentNode.$dockbar.selectNodes("vbox").length;
                
            return {
                position : isSameColumn ? "none" : "left_of_column",
                aml : bar
            }
        }
        else {
            var df = (this.$isLastBar(bar)
                ? diffPixel * 2
                : diffPixel);
            var isSameColumn = original.localName == "divider" 
                && (original.parentNode.$dockbar == bar
                || original.parentNode.$dockbar == bar.nextSibling)
                && !original.parentNode.$dockbar.selectNodes("vbox").length;
    
            if (bar && r < df) {
                return {
                    position : isSameColumn ? "none" : "right_of_column",
                    aml : bar
                }
            }
        }
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "before_page";
            if (aml.localName == "page") {
                var pos = apf.getAbsolutePosition(aml.$button);
                var l = e.clientX - pos[0];
    
                if (l > aml.$button.offsetWidth/2)
                    position = "after_page";
            }
            else if (aml.localName == "menu") {
                if(aml.firstChild.getPages) {
                    var pages = aml.firstChild.getPages();
                    aml = pages[pages.length - 1];
                }
                position = "after_page";
            }
            else if (aml.localName == "tab") {
                pages = aml.getPages();
                aml = pages[pages.length - 1];
                position = "after_page";
            }
    
            var pos2 = apf.getAbsolutePosition(aml.parentNode.$ext);
            var t = e.clientY - pos2[1];
            if (t > 18)
                return {};
        }
        else {
            if (aml.localName == "bar" || aml.skin == "dockheader") {
                if (aml.skin == "dockheader") {
                    aml = aml.parentNode.selectNodes("vbox")[0];
                    position = "before_section";
                }
                else {
                    position = original.localName == "divider" 
                      && original.parentNode.$dockbar == aml
                      && aml.lastChild.$dockfor == original.parentNode //!aml.selectNodes("vbox").length
                        ? "in_section"
                        : "in_column";
                    aml = aml.lastChild;/*selectNodes("vbox");
                    aml = vboxs[vboxs.length - 1];*/
                }
            }
            else if (aml.localName == "button") {
                position = "after_button";
                var pos = apf.getAbsolutePosition(aml.$ext);
                var t = e.clientY - pos[1];
                if (t < aml.$ext.offsetHeight/2) {
                    if (aml.previousSibling && aml.previousSibling.localName == "button")
                        aml = aml.previousSibling
                    else {
                        position = "before_button";
                        //aml = aml.parentNode;
                    }
                }
            }
            else if (aml.dock && (aml.localName == "divider" || aml.localName == "vbox")) {
                if (aml.localName == "divider")
                    aml = aml.parentNode;
                
                var buttons = aml.selectNodes("button");
                if (!buttons.length)
                    return {position: "in_section", aml: aml};
                
                var pos = apf.getAbsolutePosition(aml.$ext);
                var t = e.clientY - pos[1];
                var b = aml.$ext.offsetHeight - t;
    
                if (t < diffPixel) {
                    if (original.localName != "divider" 
                      || original.parentNode != (aml.previousSibling 
                      && aml.previousSibling.$dockfor)) {
                        position = "before_section";
                    }
                }
                else if (b < diffPixel && aml.nextSibling) {
                    if (original.localName != "divider" 
                      || original.parentNode != aml.$dockfor) {
                        if (!aml.nextSibling
                          || aml.nextSibling.$dockfor != getOriginal("section", original))
                            position = "after_section";
                    }
                }
                
                if (position == "none") {
                    if (t < aml.$ext.offsetHeight/2) {
                        position = "before_button";
                        aml = buttons[0];
                    }
                    else {
                        position = "after_button";
                        aml = buttons[buttons.length - 1];
                    }
                }
            }
        }
    
        return {
            position : position,
            aml      : aml
        }
    }
    
    /**
     * clearState after dragging (detect dropping)
     */
    this.$stopDrag = function(e){
        whiledrag();
        apf.removeListener(document, "mousemove", whiledrag);
        
        var indicator = this.indicator;
        var info = lastInfo;//calcAction(e);
        var aml  = info && info.aml;
        
        indicator.style.display = "none";
        
        var original = whiledrag.dragged;
        apf.setOpacity(original.$ext, 1);
    
        if (!aml) return;
        switch(info.position) {
            case "before_button":
            case "after_button":
                var submenu = self[aml.submenu];
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, info.position == "before_button" 
                    ? aml 
                    : aml.nextSibling, aml.parentNode, info.position);
                break;
            case "before_tab":
            case "after_tab":
                var bar      = aml.parentNode.bar;
                var childNr  = apf.getChildNumber(aml);
                var sections = bar.selectNodes("vbox");
                var section = this.$addSection(bar, info.position == "before_tab"
                    ? sections[0]
                    : sections[childNr + 1], null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
                
                var tab = aml.parentNode.insertBefore(submenu.firstChild, info.position == "before_tab"
                    ? aml
                    : aml.nextSibling);
                tab.setAttribute("flex", 1);
    
                this.$moveTo(submenu, dragAml, tab, null, section, info.position, tab);//, null, pNode);
                break;
            case "before_section":
            case "in_column":
            case "after_section":
                var section = this.$addSection(aml.parentNode, info.position == "before_section"
                    ? aml
                    : (info.position == "in_column"
                        ? null
                        : aml.nextSibling), null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            case "before_page":
            case "after_page":
                var submenu = self[aml.$dockbutton.submenu];//aml.parentNode.parentNode;
                var dragAml = whiledrag.original;
                
                this.$moveTo(submenu, dragAml, aml.parentNode, info.position == "before_page" 
                    ? aml.$dockbutton
                    : aml.nextSibling && aml.nextSibling.$dockbutton, submenu.ref, 
                        info.position, aml.parentNode);
                break;
            case "left_of_column":
                var bar = this.$addBar(aml);
                //Single Tab Case
                //create new section
                var section = this.$addSection(bar, null, null, original && original.$dockData);
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            case "right_of_column":
                var bar = this.$addBar(aml.nextSibling);
                //Single Tab Case
                //create new section
                var section = this.$addSection(bar, null, null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            default:
                break;
        }
    }
    
    /**
     * Manages the move of a conceptual single element, represented by either
     * a button, page or divider and performs the move from it's current position
     * to it's new position.
     */
    this.$moveTo = function(submenu, dragAml, aml, beforeButton, parentNode, position, tab, pNode, ignoreEvent){
        var beforePage = beforeButton && beforeButton.$dockpage;
        
        if (dragAml.localName == "page" || dragAml.localName == "button" || dragAml.localName == "hbox") {
            if (dragAml.localName == "page" || dragAml.localName == "hbox") {
                var page = dragAml;
                var button = dragAml.$dockbutton;
            }
            else if (dragAml.localName == "button") {
                var page = dragAml.$dockpage;
                var button = dragAml;
            }
            if (!pNode)
                pNode = page.parentNode;
            var btnPNode = button.parentNode;
            
            var oldMenu = self[page.$dockbutton.submenu];
            
            if (beforeButton && beforeButton.previousSibling == button || beforeButton == button
              || !beforeButton && !button.nextSibling && button.parentNode == parentNode)
                return;
    
            button.setAttribute("submenu", submenu.id);

            var newPNode = tab || submenu.firstChild;
            if (newPNode) {
                newPNode.insertBefore(page, beforePage);
                
                if (!newPNode.getPages || newPNode.getPages().length == 1) {
                	var mnu = self[page.$dockbutton.submenu];
                	mnu.setAttribute("width", oldMenu.width);
                	mnu.setAttribute("height", oldMenu.height);
                	
                    var totalFlex = 0, count = 0;
                    if (newPNode.parentNode.localName == "vbox") {
                        newPNode.parentNode.selectNodes("tab").each(function(tab){ 
                            totalFlex += tab.flex || 1;
                            count++;
                        });
                    }
                    else {
                        var vboxes = parentNode.parentNode.selectNodes("vbox");
                        vboxes.each(function(vbox){  
                            var button = vbox.selectSingleNode("button");
                            totalFlex += button && self[button.submenu].firstChild.flex || 1;
                            count++;
                        });
                    }
                    if(!newPNode.height)
                        newPNode.setAttribute("flex", totalFlex/count);
                }
            }
    
            //add button to section
            parentNode.insertBefore(button, beforeButton);
    
            if (!pNode.getPages || !pNode.getPages().length) {
                var barParent = btnPNode.parentNode;
                oldMenu.destroy(true, true);
                if (pNode.parentNode)
                    pNode.destroy(true, true);
                btnPNode.destroy(true, true);
                if (!barParent.selectNodes("vbox").length) {
                    barParent.destroy(true, true);
                    if (barParent.vbox) {
                        barParent.vbox.destroy(true, true);
                        barParent.splitter.destroy(true, true);
                    }
                }
            }
        }
        else if (dragAml.localName == "divider") {
            var buttons = dragAml.parentNode.selectNodes("button");
            for (var i = buttons.length - 1; i >= 0; i--) {
                var button = buttons[i];
                
                this.$moveTo(submenu, button, aml, beforeButton, parentNode, position, tab, pNode, true)
            }
        }
        
        if (!ignoreEvent)
            this.$cbChange();
    }
    
    /**
     * Creates a new menu
     */
    this.$addMenu = function(section){
        if(!section)
            section = {"$dockData":{}};
        
        if(!section.$dockData)
            section["$dockData"] = {};
        
        var _self = this,
            childNodes = [],
            dockOpt = section.$dockData.options || {},
            menuId  = dockOpt.id || "submenu" + menuCounter++;

//        if(!dockOpt.noTab) {
            childNodes = [
                new apf.tab({
                    anchors : dockOpt.noTab ? "1 -7 0 4" : "5 4 4 4", 
                    skin : dockOpt.noTab ? "dockbar" : "docktab",
                    buttons : "scale, close",
                    dock    : 1,
                    height  : section.$dockData.height || "", 
                    activepage : 0,
                    onclose : function(e){
                        var page = e.page;
                        page.lastParent = this;
                    }
                })
            ];
//        }
//        else {
//            childNodes = [
//                new apf.bar({
//                    skin: "basic",
//                    "class": "runbtns",
//                    dock: 1,
//                    anchors : "1 4 4 4"
//                })
//            ]
//        }
        
        var menu = new apf.menu({
            id : menuId,
            width     : section.$dockData.width ? section.$dockData.width : "200",
            height    : section.$dockData.height ? section.$dockData.height : "200",
            ref       : section,
            pinned    : "true",
            animate   : "false",
            skin      : dockOpt.skin ? dockOpt.skin : "dockwindowblack",
            resizable : dockOpt.resizable === false ? false : "left bottom",
            dock      : 1,
            ondisplay : function(){
                if (_self.$currentMenu && _self.$currentMenu != this)
                    _self.$currentMenu.hide();
                _self.$currentMenu = this;
                
//                var menu  = this;
                var pos   = apf.getAbsolutePosition(menu.opener.$ext);
                var width = apf.getWindowWidth();
                var dist  = menu.$ext.offsetWidth > width - pos[0] //Weird bug - chrome only??
                    ? width - pos[0] 
                    : menu.$ext.offsetWidth;

                menu.$ext.style.marginLeft = (-1 * dist - 6) + "px";
                
                setTimeout(function(){
                    menu.$ext.style.marginRight = "0";
                    menu.$ext.style.right = (width - pos[0] + 6) + "px";
                    menu.$ext.style.left = "";
                    menu.$ext.style.zIndex = "9999";
                    if(menu.opener && menu.opener.$dockData && menu.opener.$dockData.caption) {
                        var btnPos = apf.getAbsolutePosition(menu.opener.$ext),
                            arrow;
                        if(typeof menu.$ext.getElementsByClassName == "function" && (arrow = menu.$ext.getElementsByClassName("arrow")[0])) {
                            arrow.style.top = btnPos[1] - apf.getAbsolutePosition(menu.$ext)[1] + 8 + "px"
                        }
                    }
                });
                
            },
            onafterresize : function(){
//                var menu = this;
                setTimeout(function() {
                    var pos = apf.getAbsolutePosition(menu.opener.$ext);
                    var width = apf.getWindowWidth();
                    
                    menu.$ext.style.right = (Math.min((width - pos[0]), menu.$ext.offsetWidth) + 6) + "px";
                    menu.$ext.style.left = "";
                });
            },
            childNodes : childNodes
        });
        
//        if(dockOpt.noTab) {
////            tbDebugNav.show();
//        }
        
        apf.document.body.appendChild(menu);
        menu.show();
        menu.hide();
        
        return menu;
    }
    
    /**
     * Creates a new bar
     */
    this.$addBar = function(before){
        this.columnCounter++;
        
        var _self = this;
        var bar   = this.$parentHBox.insertBefore(new apf.bar({
            skin : "debug-panel",
            dock : 1,
            onDOMNodeRemovedFromDocument : function(){
                _self.columnCounter--;
            },
            childNodes : [
                new apf.button({
                    dock : 1,
                    skin : "dockheader",
                    onclick : function(){
                        _self.expandBar(this.parentNode);
                    }
                }),
            ]
        }), before);
        
        return bar;
    }
    
    /**
     * Creates a new page
     */
    this.$addPage = function(page, menu, caption, name){
        var _self = this;
        if (!page)
            page = menu.firstChild.add(caption, name);
        else
            menu.firstChild.appendChild(page);

        page.oDrag = page.$button;
        page.dock  = 1;
        page.setAttribute("draggable", true);
        
        var beforeDrag;        
        
        if(!page.hasEventListener("beforedrag")) {  
            page.addEventListener("beforedrag", beforeDrag = function (e){ //change this to beforedrag and recompile apf
                var origMenu = self[this.$dockbutton.submenu];
                /*var menu = origMenu.cloneNode(false);
                menu.removeAttribute("id");
                apf.document.body.appendChild(menu);*/

                var tab = this.parentNode.cloneNode(false);
                tab.removeAttribute("id");
                tab.removeAttribute("activepage");
                tab.setAttribute("buttons", "close"); //@todo bug in scale that doesnt resize 
                tab.removeAttribute("anchors");
                apf.document.body.appendChild(tab);
                tab.setWidth(this.parentNode.$ext.offsetWidth);
                tab.setHeight(this.parentNode.$ext.offsetHeight);

                var page = this.cloneNode(true);
                page.removeAttribute("id");
                page.removeAttribute("render");
                tab.appendChild(page);

                /*if (origMenu.$ext.offsetHeight) {
                    var pos = apf.getAbsolutePosition(origMenu.$ext);
                    tab.setLeft(pos[0]);
                    tab.setTop(pos[1]);
                }
                else {*/
                    var pos = apf.getAbsolutePosition(this.parentNode.$ext);
                    tab.setLeft(pos[0] - 1);
                    tab.setTop(pos[1] - 2);
                //}

                tab.$ext.style.border = "1px solid #333";
                //menu.$ext.style.margin = "0 0 0 0"
                tab.addEventListener("afterdrag", function(e){
                    tab.id = tab.name = ""; //@todo fix this bug in apf
                    tab.destroy(true, true);
                    _self.$stopDrag(e.htmlEvent);

                    tab.removeEventListener("afterdrag", arguments.callee);
                });

                //document instead?
                var clientX = e.htmlEvent.clientX;
                var clientY = e.htmlEvent.clientY;
                tab.setAttribute("draggable", true);
                setTimeout(function(){
                    //@todo Collapse menu

                    tab.$dragStart({clientX:clientX,clientY:clientY});
                    tab.$ext.style.zIndex = 1000000;
                });

                _self.$startDrag(tab, this);

                return false;
            });
        }
        
        if(!page.hasEventListener("afterclose")) {        
            page.addEventListener("afterclose", function(e){
                var button = this.$dockbutton;
                var pNode = this.lastParent;
                var btnPNode = button.parentNode;

                button.destroy(true, true);

                this.removeNode();

                if (!pNode.getPages || !pNode.getPages().length) {
                    var barParent = btnPNode.parentNode;
                    if (pNode.parentNode.localName == "menu")
                        pNode.parentNode.destroy(true, true);
                    else {
                        var menu = self[button.submenu];
                        menu.destroy(true, true);
                        pNode.destroy(true, true);
                    }
                    btnPNode.destroy(true, true);
                    if (!barParent.selectNodes("vbox").length) {
                        barParent.destroy(true, true);
                        if (barParent.vbox) {
                            barParent.vbox.destroy(true, true);
                            barParent.splitter.destroy(true, true);
                        }
                    }
                }

                _self.$cbStorePage(this);

                page.removeEventListener("beforedrag", beforeDrag);
                page.removeEventListener("afterclose", arguments.callee);
                return false
            });
        }

        return page;
    };

    /**
     * Retrieves an existing section and its associated menu
     */
    this.$getSection = function(bar, ident) {
        for (var barChild in bar.childNodes) {
            if (bar.childNodes[barChild].value && bar.childNodes[barChild].value == ident) {
                return bar.childNodes[barChild];
            }
        }
        
        return null;
    };

    /**
     * Creates a new section
     */
    this.$addSection = function(bar, before, ident, sectionOpt){
        if(!sectionOpt)
            sectionOpt = {};
        var _self   = this;
        var section = bar.insertBefore(new apf.vbox({
            padding : 0,
            edge : "0 0 3 0",
            "class" : "docksection",
            value : ident,
            dock    : sectionOpt.draggable === false ? "" : 1,
            draggable : sectionOpt.draggable || "true",
            childNodes : [
                new apf.divider({
                    skin      : "divider-debugpanel",
                    margin    : "3 4 2 2",
                    dock      : sectionOpt.draggable === false ? "" : 1,
                    visible   : sectionOpt.draggable || "true",
                    draggable : sectionOpt.draggable || "true"
                })
            ]
        }), before);
        
        if(sectionOpt.draggable !== false) {
            var div = section.firstChild;
            div.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
                var section = this.parentNode;

                //this.hideMenu();

                var pNode = section.$dockbar = section.parentNode;
                var placeHolder = section.cloneNode(false);
                placeHolder.removeAttribute("id");
                placeHolder.$dockfor = section;

                var diff = apf.getDiff(section.$ext);
                var height = section.$ext.offsetHeight;
                var pos = apf.getAbsolutePosition(section.$ext);

                pNode.insertBefore(placeHolder, section);
                placeHolder.$ext.style.background = "#434343";
                placeHolder.$ext.style.borderTop = "1px solid #373737";
                placeHolder.$ext.style.height = (height - diff[1]) + "px";

                section.setWidth(section.$ext.offsetWidth);
                apf.document.body.appendChild(section);
                section.setLeft(pos[0]);
                section.setTop(pos[1]);

                section.addEventListener("afterdrag", function(e){
                    pNode.insertBefore(section, placeHolder);
                    section.setAttribute("draggable", false);

                    setTimeout(function(){
                        section.removeAttribute("left");
                        section.removeAttribute("top");
                        section.removeAttribute("width");
                        section.$ext.style.position = "relative";
                    });

                    var buttons = this.selectNodes("button");
                    if (buttons.length)
                        buttons[0].setValue(false);

                    _self.$stopDrag(e.htmlEvent);

                    placeHolder.destroy(true, true);

                    section.removeEventListener("afterdrag", arguments.callee);
                });

                section.setAttribute("draggable", true);

                var clientX = e.htmlEvent.clientX;
                var clientY = e.htmlEvent.clientY;
                setTimeout(function(){
                    //@todo Collapse menu

                    section.$dragStart({clientX:clientX,clientY:clientY});
                    section.$ext.style.zIndex = 1000000;
                });

                _self.$startDrag(section, this);

                return false;
            });
        }
        
        section.$dockData = sectionOpt;
        return section;
    }
    
    /**
     * Creates a new button
     */
    this.$addButton = function(section, submenu, page, options){
        var _self  = this, btnLock, tmp;
        var drag = true; 
        if(typeof options.draggable != "undefined" )
            drag = false;
        
        var button = section.appendChild(new apf.button({
            skin    : "dockButton",
            submenu : submenu.id,
            dock    : drag ? 1 : "",
            visible : options && options.hidden ? !options.hidden : true, 
            "class" : options["class"] || "",
            draggable : drag,
            onmousedown  : function(){
                btnLock = true;
                
                self[this.submenu].firstChild && self[this.submenu].firstChild.set && self[this.submenu].firstChild.set(page);
                btnLock = false;
                
                if (options && (tmp = options.primary)) {
                    var span = button.$ext.getElementsByTagName("span");
                    span[2].style.backgroundPosition = 
                        tmp.activeState.x + 'px ' 
                        + tmp.activeState.y + 'px';
            
                    if (tmp = options.secondary) {
                        span[1].style.backgroundPosition = 
                            tmp.activeState.x + 'px ' 
                            + tmp.activeState.y + 'px';
                    }
                }
            }
        }));
        
        if(options && options["id"])
            button.setAttribute('id', options["id"]);
        
        if (options && (tmp = options.primary)) {
            var span = button.$ext.getElementsByTagName("span");
            
            button.setAttribute("tooltip", options.menu.split("/").pop());
            
            span[2].style.background = 'url("' 
                + tmp.backgroundImage + '") '
                + tmp.defaultState.x + 'px '
                + tmp.defaultState.y + 'px no-repeat';
            
            if (tmp = options.secondary) {
                span[1].style.background = 'url("' 
                    + tmp.backgroundImage + '") '
                    + tmp.defaultState.x + 'px '
                    + tmp.defaultState.y + 'px no-repeat'
            }
            
            if (tmp = options.tertiary) {
                span[0].style.background =
                    tmp.backgroundColor + ' url("'
                    + tmp.backgroundImage + '") '
                    + tmp.defaultState.x + 'px '
                    + tmp.defaultState.y + 'px no-repeat';
                span[0].style.border = "1px solid #c7c7c7";
            }
        }
        
        // When the page is shown, we can reset the notification count
        page.addEventListener("prop.visible", function(e) {
//            _self.resetNotificationCount(winIdent);

            if (self[button.submenu] && !btnLock && e.value && this.$ext.offsetWidth) // && this.parentNode.parentNode.localName == "menu") // & !_self.expanded
                button.showMenu();
                
            if(e.value == true && options && options.cbOnPageShow)
                options.cbOnPageShow();
                
            else if(e.value == false && options && options.cbOnPageHide)
                options.cbOnPageHide();
        });
        
        button.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
            var originalButton = this;
            
            this.hideMenu();
            this.setValue(true);
            
            //Upgrade to container if only 1 element
            if (this.parentNode.selectNodes("button").length == 1) {
                this.parentNode.firstChild.dispatchEvent("beforedrag", e);
                return false;
            }
            
            var btn = this.cloneNode(true);
            btn.removeAttribute("id");
            apf.document.body.appendChild(btn);
            btn.setValue(true);
        
            var pos = apf.getAbsolutePosition(this.$ext);
            btn.setLeft(pos[0]);
            btn.setTop(pos[1]);
            btn.addEventListener("afterdrag", function(e){
                btn.destroy(true, true);
                originalButton.setValue(false);
                _self.$stopDrag(e.htmlEvent);
                
                btn.removeEventListener("afterdrag", arguments.callee);
            });
            
            //document instead?
            var clientX = e.htmlEvent.clientX;
            var clientY = e.htmlEvent.clientY;
            setTimeout(function(){
                btn.$dragStart({clientX:clientX,clientY:clientY});
                btn.$ext.style.zIndex = 1000000;
                this.removeEventListener("mouseover", arguments.callee);
            });
            
            _self.$startDrag(btn, this);
            
            return false;
        });
    
        page.$dockbutton = button;
        button.$dockpage = page;
        button.hidden = options && options.hidden;
        return button;
    }
}).call(DockableLayout.prototype);

});