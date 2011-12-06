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
    
    var indicator = this.indicator = document.body.appendChild(document.createElement("div"));
    indicator.style.position = "absolute";
    indicator.style.display = "none";
    indicator.style.border = "3px solid #5c5c5c";
    indicator.style.zIndex = 1000000;
};

(function(){
    var whiledrag, lastInfo, diffPixel = 3;
    var menuCounter = 100;
    var state, lookup; //@todo wrong use of scope. 
    
    function findParentState(data){
        var uniqueId = data.uniqueId;
        var node = lookup[uniqueId].node;
        
        if (node && node.parentNode)
            return node.parentNode.$dockData;
        else {
            var found;
            state.bars.each(function(bar){
                if (found) return;
                    
                bar.sections.each(function(section){
                    if (found) return;

                    if (section.uniqueId == uniqueId)
                        found = bar;
                    
                    section.buttons.each(function(button){
                        if (found) return;
                        
                        if (button.uniqueId == uniqueId)
                            found = section;
                    });
                    
                });
            });
            
            return found;
        }
    }
    
    function hasVisibleChildren(list){
        for (var i = 0; i < list.length; i++) {
            var l2 = list[i].buttons || list[i].sections;
            if (l2) {
                if (hasVisibleChildren(l2))
                    return true;
            }
            else if (list[i].hidden != true)
                return true;
        }
        return false;
    }
    
    function findNextKnownNode(list, index){
        for (var i = index; i < list.length; i++) {
            if (list[i].uniqueId && lookup[list[i].uniqueId].node)
                return lookup[list[i].uniqueId].node;
        }
    }
    
    function tableCleanup(pNode, btnPNode, oldMenu, b){
        if (!pNode.getPages || !pNode.getPages().length) { //@todo move this to addPage
            if (b) {
                var buttons = btnPNode.$dockData.buttons;
                for (i = 0; i < buttons.length; i++) {
                    b.insertIndex(buttons[i].$dockData, i);
                }
            }
            
            var barParent = btnPNode.parentNode;
            oldMenu.destroy(true, true);
            
            if (pNode.parentNode)
                pNode.destroy(true, true);
            
            btnPNode.destroy(true, true);
            lookup[btnPNode.$dockData.uniqueId].node = undefined;
            
            if (!barParent.selectNodes("vbox").length) {
                barParent.destroy(true, true);
                lookup[barParent.$dockData.uniqueId].node = undefined;
                
                if (barParent.vbox) {
                    barParent.vbox.destroy(true, true);
                    barParent.splitter.destroy(true, true);
                }
            }
            else {
                barParent.$dockData.sections.remove(btnPNode.$dockData);
            }
        }
    }
    
    function registerLookup(node){
        if (!node.$dockData.uniqueId)
            node.$dockData.uniqueId 
                = lookup.push({node: node, data: node.$dockData}) - 1;
        else
            lookup[node.$dockData.uniqueId] 
                = {node: node, data: node.$dockData};
    }
    
    /**
     * Retrieve the current state of the layout as a JSON object
     * 
     */
    this.getState = function(){
        return JSON.parse(JSON.stringify(state));
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
    this.loadState = function(data){
        this.clearState();
        
        state  = JSON.parse(JSON.stringify(data));
        lookup = [];

        state.bars.each(function(bar){
            bar.uniqueId = lookup.push({data: bar}) - 1;
            
            bar.sections.each(function(section){
                section.uniqueId = lookup.push({data: section}) - 1;
                
                section.buttons.each(function(button){
                    button.uniqueId = lookup.push({data: button}) - 1;
                });
            });
        });

        var bars = state.bars;
        for (var i = 0; i < bars.length; i++) {
            addBarState.call(this, bars[i]);
        }
    };
    
    /**
     * Experimental and probably useless
     *
    this.updateState = function(data, section){
        var before;
        
        if (data.bars) {
            var bars = data.bars;
            for (var i = 0; i < bars.length; i++) {
                if (!bars[i].uniqueId) {
                    var before = findNextKnownNode(bars, i);
                    addBarState(bars[i], before);
                }
                else
                    this.updateState(bars[i]);
            }
        }
        else if (data.sections) {
            var bar = this.lookup[data.uniqueId];
            
            var sections = data.sections;
            for (var i = 0; i < sections.length; i++) {
                if (!sections[i].uniqueId) {
                    var before = findNextKnownNode(sections, i);
                    addSectionState(sections[i], before, bar);
                }
                else
                    this.updateState(sections[i]);
            }
            
            //@todo update other states here
        }
        else if (data.buttons) {
            var section = this.lookup[data.uniqueId];
            
            var buttons = data.buttons;
            for (var i = 0; i < buttons.length; i++) {
                if (!buttons[i].uniqueId) {
                    var before = findNextKnownNode(buttons, i);
                    addButtonState(buttons[i], section);
                }
                else {
                    this.updateState(buttons[i], section);
                }
            }
            
            //@todo update other states here
        }
        else {
            var button = this.lookup[data.uniqueId];
            
            var hidden = state.$dockData.hidden;
            if (button.$dockData.hidden != hidden) {
                if (hidden)
                    buttons[j].$dockpage.parentNode.remove(buttons[j].$dockpage);
                else {
                    return true;
                }
            }
            
            //@todo update other states here
        }
    }*/
    
    this.show = function(uniqueId){
        var item  = lookup[uniqueId].data;
        var _self = this;
        var before;
        
        if (!item.bars && !item.sections) {
            var section = findParentState(lookup[uniqueId].data);
            if (!hasVisibleChildren(section.buttons)) {
                
                var bar = findParentState(section);
                if (!hasVisibleChildren(bar.sections)) {
                    section.buttons.each(function(button){
                        if (button.hidden != 2)
                            button.hidden = false;
                    });
                    
                    before = findNextKnownNode(state.bars, state.bars.indexOf(bar) + 1);
                    addBarState.call(this, bar, before)
                }
                else {
                    section.buttons.each(function(button){
                        if (button.hidden != 2)
                            button.hidden = false;
                    });
                    
                    before = findNextKnownNode(bar.sections, bar.sections.indexOf(section) + 1);
                    addSectionState.call(this, section, before, lookup[bar.uniqueId].node);
                }
            }
            else {
                if (item.hidden) {
                    item.hidden = false;
                    before = findNextKnownNode(section.buttons, section.buttons.indexOf(item) + 1);
                    addButtonState.call(this, item, before, lookup[section.uniqueId].node);
                }
            }
        }
        else {
            (item.bars || [item]).each(function(bar){
                (bar.sections || [bar]).each(function(section){
                    (section.buttons || [section]).each(function(button){
                        var page = _self.lookup[button.uniqueId].node.$dockpage;
                        page.parentNode.remove(page);
                    });
                });
            });
        }
    }
    
    this.hide = function(uniqueId){
        var item  = lookup[uniqueId].data;

        (item.bars || [item]).each(function(bar){
            (bar.sections || [bar]).each(function(section){
                (section.buttons || [section]).each(function(button){
                    var page = lookup[button.uniqueId].node.$dockpage;
                    page.parentNode.remove(page);
                });
            });
        });
    }
    
    this.isExpanded = function(uniqueId){
        var button = lookup[uniqueId].node;
        if (!button) {
            this.show(uniqueId);
            button = lookup[uniqueId].node;
        }
        
        var bar = findParentState(findParentState(lookup[uniqueId].data));
        return lookup[bar.uniqueId].data.expanded
    }
    
    this.showMenu = function(uniqueId){
        var button = lookup[uniqueId].node;
        if (!button) {
            this.show(uniqueId);
            button = lookup[uniqueId].node;
        }
        
        button.showMenu();
    }
    
    this.findBar = function(uniqueId){
        var button = lookup[uniqueId].node;
        return button && button.parentNode.parentNode;
    }
    
    function addBarState(state, beforeBar){
        var sections = state.sections;

        if (!hasVisibleChildren(sections))
            return;
        
        var bar = this.$addBar(beforeBar, state);
            
        for (var j = 0; j < sections.length; j++) {
            addSectionState.call(this, sections[j], 
              sections[j].options && sections[j].options.position 
                ? bar.childNodes[sections[j].options.position]
                : null, bar);
        }
        
        if (state.expanded)
            this.expandBar(bar);
    }
    
    function addSectionState(state, beforeState, bar){
        var buttons = state.buttons
        if (!hasVisibleChildren(buttons))
            return;
        
        if (!state.options)
            state.options = {};
        
        var section = this.$addSection(bar, 
            beforeState, 
            null /*sections[j].sectionIdent*/, state);
        
        var menu = this.$addMenu(section);
        section.$menu = menu;
        menu.firstChild.setAttribute("flex", state.flex);
        menu.setAttribute("width", state.width || 260);
        
        if (state.height)
            menu.setAttribute("height", state.height);
        
        for (var k = 0; k < buttons.length; k++) {
            addButtonState.call(this, buttons[k], null, section);
        }
    }
    
    function addButtonState(state, before, section){
        if (state.hidden)
            return;
        
        var bar = section.parentNode;
        this.$addButton(section, before, section.$menu, 
            this.$addPage(
                this.$cbFindPage(state.ext), 
                before && before.$dockpage,
                section.$menu, 
                state.caption, 
                state.caption && state.caption.toLowerCase() || "",
                section
            ), apf.extend(state, this.$cbFindOptions(state.ext) || {}) //@todo options don't need to be late anymore
        );
    }
    
    /**
     * Destroy full state
     */
    this.clearState = function(){
        var bar = this.$parentHBox.lastChild;
        while (bar) {
            if (bar.localName == "bar" && bar.dock) {
                bar.hide();
                if (bar.vbox)
                    bar.vbox.hide();
                var sections = bar.selectNodes("vbox");
                for (var i = 0; i < sections.length; i++) {
                    var buttons = sections[i].selectNodes("button");
                    if (buttons && buttons.length && buttons[0]) {
                        for (var j = 0; j < buttons.length; j++) {
                            buttons[j].hideMenu();
                            buttons[j].$dockpage.parentNode.remove(buttons[j].$dockpage);
                        }
                    }
                }
            }
            else if (!bar.bar) {
                break;
            }
            
            bar = bar.previousSibling;
        }
    };
    
    /**
     * Expand a bar
     */
    this.expandBar = function (bar){
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        var pNode = bar.parentNode || this.$parentHBox;

        if (!bar.vbox) {
            var _self = this;
            bar.vbox = pNode.insertBefore(new apf.vbox({
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
                        height     : 11,
                        resizable  : false,
                        margin     : "0 0 0 0",
                        onclick    : function(){
                            _self.collapseBar(bar);
                        }
                    })
                ]
            }), bar);

            if (!bar.vbox)
                return;

            var ps = bar.vbox.previousSibling;

            bar.splitter = pNode.insertBefore(new apf.splitter({
                scale   : "right",
                "class" : "splitter-editor-right" + " panelsplitter",//+ (panelSplittersCount > 0 ? " panelsplitter" : ""),
                width   : "0"
            }), bar.vbox);
            
            if (!ps)
                bar.splitter.setAttribute("parent", bar.parentNode.parentNode.parentNode);
            
            bar.splitter.bar = 
            bar.vbox.bar     = bar;
            //panelSplittersCount++;
        }
        else {
            pNode.insertBefore(bar.vbox, bar);
            pNode.insertBefore(bar.splitter, bar.vbox);
        }
        
        var vbox = bar.selectNodes("vbox");
        //var countVis = 0;
        
        for (var i = 0; i < vbox.length; i++) {
            var button  = vbox[i].selectSingleNode("button"),
                menu    = self[button.submenu],
                childEl = menu && menu.firstChild;
            
            //@todo why? currentMenu is already hidden
            //menu && menu.hide();
            
            //@todo why would a button ever be not visible
            // && button.visible 
            if (childEl) {
                childEl.extId = button.$dockData.ext[0];
                bar.vbox.appendChild(childEl);
                if (childEl.skin == "dockbar")
                    childEl.setAttribute("height", 34);
                if (!childEl.flex && childEl.tagName != "bar" && !childEl.noflex)
                    childEl.setAttribute("flex", 1);
                //countVis++;
            }
        }
        
        //if (countVis > 0 || bar.expanded) {
            bar.hide();
            if (bar.vbox) {
                bar.vbox.show();
                bar.vbox.expanded = true; 
                bar.vbox.firstChild.$ext.onmousemove({});
            }
            bar.expanded = true;
            bar.splitter.show();
            bar.$dockData.expanded = true;

            //Hack for button
        /*}
        else {
            bar.vbox.hide();
            bar.vbox.expanded = false;
            bar.expanded = false;
            bar.splitter.hide();
        }*/
        this.$cbChange();
    };
    
    /**
     * Collapse a bar
     */
    this.collapseBar = function(bar){
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        //var skip = 0;
        var vboxes = bar.selectNodes("vbox");
        var tabs = bar.vbox.selectNodes("tab");
        for (var i = 0; i < vboxes.length; i++) {
            //What is all this?
            /*if (!vboxes[i].getAttribute("visible")) {
                skip++;
                continue;
            }*/

            var menu = self[vboxes[i].selectSingleNode("button").submenu];
            menu.appendChild(tabs[i]); //-skip
        }
        
        bar.show();
        bar.vbox.hide();
        bar.vbox.expanded = false;
        bar.$dockData.expanded = false;
        bar.expanded = false;
        bar.splitter.hide();
        
        bar.parentNode.removeChild(bar.vbox);
        bar.parentNode.removeChild(bar.splitter);
        
        //Hack for button
        bar.firstChild.$ext.onmousemove({});
        
        this.$cbChange();
    };
    
    this.$isLastBar = function(aml) {
        var last = this.$parentHBox.lastChild;
        while (last && !last.visible)
            last = last.previousSibling;
        
        return aml == last || aml == last.vbox;
    };

    this.$getLastBar = function(){
        var lastBar = this.$parentHBox.lastChild;
        if (!lastBar)
            return;
        
        while (lastBar.previousSibling 
          && (lastBar.previousSibling.localName == "bar" 
          && lastBar.previousSibling.dock
          && lastBar.previousSibling .visible
          || lastBar.previousSibling.bar)) {
            lastBar = lastBar.previousSibling;
        }
          
        if (lastBar.localName != "bar")
            lastBar = lastBar.bar;
           
        //if (lastBar && !lastBar.visible)
        	//lastBar = lastBar.vbox;
            
        return lastBar;
    };
    
    /**
     * Starts the docking detection during drag&drop
     */
    this.$startDrag = function (dragged, original){
        var last, state = 0, _self = this;

        apf.setOpacity(dragged.$ext, 0.3);
        
        apf.setStyleClass(dragged.$ext, 'dragging');
        
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
                        div.style.borderBottom = "3px solid rgba(92,92,92,0.8)";
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
                        div1.style.border = "3px solid rgba(92,92,92,0.5)";
                        div1.style.borderWidth = "3px 3px 0 3px";
                        
                        div2.style.left = (diff[0] + matchAml.$button.offsetWidth - 4) + "px";
                        div2.style.right = "0px";
                        div3.style.borderBottom =
                        div2.style.borderBottom = "3px solid rgba(92,92,92,0.5)";
                        
                        div3.style.left = "0px";
                        div3.style.right = (width - diff[0] - 4) + "px";
                        
                        indicator.style.borderTop = "0px solid #5c5c5c";
                        indicator.style.borderColor = "rgba(92,92,92,0.5)";
                        indicator.style.top = (pos2[1] + (!lastBar.expanded ? 19 : 24)) + "px";
                        height -= 26 + (!lastBar.expanded ? 1 : 0);
                        width  -= 1;
                    }
                    else {
                        indicator.innerHTML = "<div style='position:absolute;'><div></div></div>";
                        indicator.firstChild.style.height = !lastBar.expanded ? "22px" : "19px";
                        indicator.firstChild.style.width = "5px";
                        indicator.firstChild.style.background = "rgba(92,92,92,0.5)";
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
                    indicator.style.backgroundColor = "rgba(92,92,92," 
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
                    indicator.style.backgroundColor = "rgba(92,92,92,0.5)";
                    return;
                case "in_column":
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "0 0 0 0";
                    
                    var div = indicator.firstChild;
                    div.style.top = "100%";
                    div.style.borderTop = "3px solid rgba(92,92,92,0.8)"
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
                    apf.setStyleClass(dragged.$ext, '', ['dragging']);
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
            if (!bar)
                return {};
            
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
                if (aml.firstChild.getPages) {
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
        apf.setStyleClass(original.$ext, '', ['dragging']);
        
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
            if ((submenu.skin == "dockwin_runbtns" && dragAml.id != "btnRunCommands")  //@giannis tsss
              || (submenu.skin != "dockwin_runbtns" && dragAml.id == "btnRunCommands"))
                return;

            if (dragAml.localName == "page" || dragAml.localName == "hbox") {
                var page = dragAml;
                var button = dragAml.$dockbutton;
            }
            else if (dragAml.localName == "button") {
                page = dragAml.$dockpage;
                button = dragAml;
            }
            
            if (!pNode)
                pNode = page.parentNode;
            
            var btnPNode = button.parentNode;
            var oldMenu  = self[page.$dockbutton.submenu];
            var newPNode = tab || submenu.firstChild;
            
            if (beforeButton && beforeButton.previousSibling == button || beforeButton == button
              || !beforeButton && !button.nextSibling && button.parentNode == parentNode)
                return;
    
            button.setAttribute("submenu", submenu.id);

            if (newPNode) {
                newPNode.insertBefore(page, beforePage);
                if (!self[page.id])
                    self[page.id] = page;
                
                if (!newPNode.getPages || newPNode.getPages().length == 1) {
                	var mnu = self[page.$dockbutton.submenu];
                    if (mnu) {
                        mnu.setAttribute("width", oldMenu.width);
                        mnu.setAttribute("height", oldMenu.height);
                	}
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
                    if (!newPNode.height)
                        newPNode.setAttribute("flex", totalFlex/count);
                }
            }

            //add button to section
            parentNode.insertBefore(button, beforeButton);
            
            //correct state
            var i, b = parentNode.$dockData.buttons;
            if (beforeButton)
                b.insertIndex(button.$dockData, b.indexOf(beforeButton.$dockData));
            else
                i = b.push(button.$dockData);
            
            btnPNode.$dockData.buttons.remove(button.$dockData);
            
            tableCleanup(pNode, btnPNode, oldMenu, b);
        }
        else if (dragAml.localName == "divider") {
            var buttons = dragAml.parentNode && dragAml.parentNode.selectNodes("button");
            for (var i = buttons.length - 1; i >= 0; i--) {
                var button = buttons[i];
//                if (button.visible)
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
        var _self = this,
            childNodes = [],
            dockOpt = section.$dockData.options || {},
            menuId  = dockOpt.id || "submenu" + menuCounter++;

            //@todo @giannis the noTab implementation is a real hack....
//        if (!dockOpt.noTab) {
            childNodes = [
                new apf.tab({
                    anchors : dockOpt.noTab ? "1 -7 0 4" : "5 4 4 4", 
                    skin : dockOpt.noTab ? "dockbar" : "docktab",
                    buttons : "scale, close",
                    dock    : 1,
                    height  : section.$dockData.height || "", 
                    activepage : 0,
                    noflex  : section.$dockData.noflex,
                    onafterswitch : function(e){
                        if (e.previousPage)
                            e.previousPage.$dockbutton.$dockData.active = false;
                        if (e.nextPage && e.nextPage.$dockbutton) {
                            e.nextPage.$dockbutton.$dockData.active = true;
                            _self.$cbChange();
                        }
                    },
                    onclose : function(e){
                        var page = e.page;
                        page.lastParent = this;
                        
                        _self.$cbChange();
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
            id        : menuId,
            width     : section.$dockData.width || "350",
            height    : section.$dockData.height || "200",
            ref       : section,
            pinned    : "true",
            animate   : "false",
            skin      : dockOpt.skin ? dockOpt.skin : "dockwindowblack",
            resizable : dockOpt.resizable === false ? false : "left bottom",
            dock      : 1,
            onhide    : function(e){
                //var mnuItem = e.opener && e.opener.$dockData && self["mnu" + e.opener.$dockData.ext[1]];
                //if (mnuItem)
                    //mnuItem.uncheck();
                if (this.firstChild && this.firstChild.getPage())
                    this.firstChild.getPage().$dockbutton.$dockData.showMenu = false;
            },
            ondisplay : function(e){
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
                    if (menu.opener && menu.opener.$dockData && menu.opener.$dockData.caption) {
                        var btnPos = apf.getAbsolutePosition(menu.opener.$ext),
                            arrow;
                        if (typeof menu.$ext.getElementsByClassName == "function" && (arrow = menu.$ext.getElementsByClassName("arrow")[0])) {
                            arrow.style.top = btnPos[1] - apf.getAbsolutePosition(menu.$ext)[1] + 8 + "px"
                        }
                    }
                });
                
                //var mnuItem = menu.opener && menu.opener.$dockData && self["mnu" + menu.opener.$dockData.ext[1]];
                //if (mnuItem)
                    //mnuItem.check();
                if (this.firstChild.getPage())
                    this.firstChild.getPage().$dockbutton.$dockData.showMenu = true;
            },
            onafterresize : function(){
//                var menu = this;
                setTimeout(function() {
                    var pos = apf.getAbsolutePosition(menu.opener.$ext);
                    var width = apf.getWindowWidth();
                    
                    menu.$ext.style.right = (Math.min((width - pos[0]), menu.$ext.offsetWidth) + 6) + "px";
                    menu.$ext.style.left = "";
                });
                
                section.$dockData.width  = this.getWidth();
                section.$dockData.height = this.getHeight();
                
                _self.$cbChange();
            },
            childNodes : childNodes
        });
        
//        if (dockOpt.noTab) {
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
    this.$addBar = function(before, dockData){
        this.columnCounter++;
        if (before && before.previousSibling 
          && before.previousSibling.tagName == 'splitter' )
            before = before.previousSibling;

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
        
        bar.$dockData = dockData || {sections: []};
        registerLookup.call(this, bar);
        
        if (state.bars.indexOf(bar.$dockData) == -1)
            state.bars.insertIndex(bar.$dockData, 
              before ? state.bars.indexOf(before.$dockData) : state.bars.length);
        
        return bar;
    }
    
    /**
     * Creates a new page
     */
    this.$addPage = function(page, before, menu, caption, name, section){
        var _self = this;

        if (!page)
            page = menu.firstChild.add(caption, name);
        else if (section && section.parentNode.expanded) {
            var bar = section.parentNode;
            if (menu.firstChild) {
                menu.firstChild.insertBefore(page, before);

                bar.vbox.insertBefore(menu.firstChild, 
                    section.nextSibling && section.nextSibling.lastChild
                      && section.nextSibling.lastChild.$dockpage.parentNode);
            }
            else {
                var index = apf.getArrayFromNodelist(bar.selectNodes("vbox")).indexOf(section);
                var tab = bar.vbox.selectNodes("tab")[index];
                
                tab.insertBefore(page, before);
            }
        }
        else 
            menu.firstChild.insertBefore(page, before);

        page.oDrag = page.$button;
        page.dock  = 1;
        page.setAttribute("draggable", true);
        
        var beforeDrag;        
        
        if (!page.hasEventListener("beforedrag")) {  
            page.addEventListener("beforedrag", beforeDrag = function (e){ //change this to beforedrag and recompile apf
                var origMenu = self[this.$dockbutton.submenu];
                /*var menu = origMenu.cloneNode(false);
                menu.removeAttribute("id");
                apf.document.body.appendChild(menu);*/
                
                this.$ext.style.zIndex = "";

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
        
        if (!page.hasEventListener("afterclose")) {        
            page.addEventListener("afterclose", function(e){
                var button = this.$dockbutton;
                var pNode = this.lastParent;
                var btnPNode = button.parentNode;

                button.destroy(true, true);

                this.removeNode();

                button.$dockData.hidden = true;

                tableCleanup(pNode, btnPNode, pNode.parentNode.localName == "menu" 
                    ? pNode.parentNode 
                    : self[button.submenu]);
                    
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
        if (!sectionOpt)
            sectionOpt = {buttons: []};
        
        if (!bar)
            bar = this.$parentHBox.lastChild;
        
        var _self   = this;
        var section = bar.insertBefore(new apf.vbox({
            padding : 0,
            edge    : "0 0 3 0",
            "class" : "docksection",
            value   : ident,
            dock    : sectionOpt.draggable === false ? 0 : 1,
            draggable : sectionOpt.draggable === false ? false : true,
            childNodes : [
                new apf.divider({
                    skin      : "divider-debugpanel",
                    margin    : "3 4 0 2",
                    dock      : 1,
                    visible   : sectionOpt.draggable === false ? false : true,
                    draggable : true
                })
            ]
        }), before);
        
        if (sectionOpt.draggable !== false) {
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
        registerLookup.call(this, section);
        
        var sections = bar.$dockData.sections;
        if (sections.indexOf(section.$dockData) == -1)
            sections.insertIndex(section.$dockData, 
              before ? sections.indexOf(before.$dockData) : sections.length);
        
        return section;
    }
    
    /**
     * Creates a new button
     */
    this.$addButton = function(section, before, submenu, page, options){
        var _self  = this, btnLock, tmp;
        var drag = true; 
        if (typeof options.draggable != "undefined" )
            drag = false;

        var button = section.insertBefore(new apf.button({
            skin    : "dockButton",
            submenu : submenu.id,
            dock    : drag ? 1 : "",
            visible : options && options.hidden ? !options.hidden : true, 
            "class" : options["class"] || "",
            draggable : drag,
            onmousedown  : function(){
                btnLock = true;

                self[this.submenu] && self[this.submenu].firstChild 
                  && self[this.submenu].firstChild.set 
                  && self[this.submenu].firstChild.set(page);
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
                
                setTimeout(function(){
                    _self.$cbChange();
                });
            }
        }), before);
        
        if (options && options["id"])
            button.setAttribute('id', options["id"]);
        
        function _setBtnIco(_btn){
            if (options && (tmp = options.primary)) {
                var span = _btn.$ext.getElementsByTagName("span");
                
                _btn.setAttribute("tooltip", options.menu.split("/").pop());
                
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
        };
        
        _setBtnIco(button);
        
        // When the page is shown, we can reset the notification count
        page.addEventListener("prop.visible", function(e) {
//            _self.resetNotificationCount(winIdent);

            //if (self[button.submenu] && !btnLock && e.value && this.$ext.offsetWidth && button.parentNode) // && this.parentNode.parentNode.localName == "menu") // & !_self.expanded
                //button.showMenu();
                
            if (e.value == true && options && options.cbOnPageShow)
                options.cbOnPageShow();
                
            else if (e.value == false && options && options.cbOnPageHide)
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
            _setBtnIco(btn);
            
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
        
        button.$dockData = options;
        registerLookup.call(this, button);
        
        var buttons = section.$dockData.buttons;
        if (buttons.indexOf(button.$dockData) == -1)
            buttons.insertIndex(button.$dockData, 
              before ? buttons.indexOf(before.$dockData) : buttons.length);
        
        if (options) {
            //button.hidden = options.hidden !== false;
            
            if (options.showMenu) {
                if (options.active) {
                    submenu.firstChild && submenu.firstChild.set 
                      && submenu.firstChild.set(page);
                }
                
                button.showMenu();
            }
            else if (options.active) {
                //Set proper event to delay rendering
                apf.window.vManager.check(page.parentNode, "page", function(){
                    page.parentNode.set(page);
                });
            }
        }
        
        return button;
    }
}).call(DockableLayout.prototype);

});