/*
    TODO:
    - expanded state tab dragging
        - insertbefore tab reorder doesnt create a new splitter bar
        - multiple columns: splitter bars don't function as expected: should be non-symmetrical
        - cannot add a bar after an expanded bar
        - add a bar after collapsed bar in set where 1 bar is expanded doesnt work either
        - cannot drag 'other' widget to expanded bar (js error)
        - dragging forelasttab out of expanded column leaves splitter
        - after_tab/before_tab lacks splitter and tab page doesnt animate
        - new tabs need to get a better flex rate (same ballpark)
        - left_of_column detection for expanded state doesnt work
    - add section as last when dragging last shouldn't animate
    
    - single page should drag whole tab like button to section does
    - anim should wait x00ms before playing
    
    - fix same column detection
    - tab page button while dragged isn't displayed correctly
    - tweak tab animations
    - menu should appear onmouseup not down
    - floating sections or menus
    
    INTEGRATION
    - refactor into seperate class
    - closing a window should set the state in the windows menu
    - debugger plugin doesnt need to be visible at the start anymore
    - add right click menu to buttons/sections
    - maintain state of sections/buttons even when closed
    - save serialized state in settings.xml
*/

var menuCounter = 100;
var columnCounter = 0;

var testState = {
    bars : [
        {
            expanded : false,
            width : 300,
            sections : [
                {
                    flex : 1,
                    width : 300,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test4",
                            ext    : ""
                        },
                        {
                            caption: "Test3",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 300,
                    buttons : [
                        {
                            caption: "Test2",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        },
        {
            expanded : true,
            width : 200,
            sections : [
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test2",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        }
    ]
};

loadState(testState);
loadState(getState());

function getState(){
    var state = {bars: []};
    
    var bar = hboxMain.lastChild;
    while (bar) {
        if (bar.localName == "bar") {
            var barInfo = {sections: []};
            barInfo.expanded = bar.vbox && bar.vbox.visible;
            barInfo.width    = bar.vbox && bar.vbox.width 
                || bar.$dockData && bar.$dockData.width 
                || 200;
            
            var sections = bar.selectNodes("vbox");
            for (var i = 0; i < sections.length; i++) {
                var sectionInfo = {buttons: []};
                var buttons = sections[i].selectNodes("button");
                sectionInfo.flex = buttons[0].$dockpage.parentNode.flex || 1;
                
                var menu = self[buttons[0].submenu];
                sectionInfo.width = menu.width;
                sectionInfo.height = menu.height;
                
                for (var j = 0; j < buttons.length; j++) {
                    var buttonInfo = {};
                    buttonInfo.ext = "";
                    buttonInfo.caption = buttons[j].$dockpage.caption;
                    
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
    
    return state;
}

function cleanup(){
    var bar = hboxMain.lastChild;
    while (bar) {
        if (bar.localName == "bar") {
            var sections = bar.selectNodes("vbox");
            for (var i = 0; i < sections.length; i++) {
                var buttons = sections[i].selectNodes("button");
                var menu = self[buttons[0].submenu];
                
                for (var j = 0; j < buttons.length; j++) {
                    //Store pages
                    //buttons[j].$dockpage;
                }
                
                menu.destroy(true, true);
            }
        }
        else if (!bar.bar) {
            break;
        }
        
        var next = bar.previousSibling;
        bar.destroy(true, true);
        bar = next;
    }
}

function loadState(obj){
    cleanup();
    
    var bars = obj.bars;
    for (var i = 0; i < bars.length; i++) {
        var bar = addBar();
        bar.$dockData = bars[i];
        
        var sections = bars[i].sections;
        for (var j = 0; j < sections.length; j++) {
            var section = addSection(bar);
            var menu = createMenu(section);
            var info = section.$dockData = sections[j];
            menu.firstChild.setAttribute("flex", info.flex);
            menu.setAttribute("width", info.width);
            menu.setAttribute("height", info.height);
            
            var buttons = sections[j].buttons
            for (var k = 0; k < buttons.length; k++) {
                var button = addButton(section, menu, addPage(menu, buttons[k].caption, buttons[k].caption.toLowerCase()));
                button.$dockData = buttons[k];
            }
        }
        
        if (bars[i].expanded)
            expandBar(bar);
    }
}

function addPage(menu, caption, name){
    var page = menu.firstChild.add(caption, name);
    page.oDrag = page.$button;
    page.dock  = 1;
    page.setAttribute("draggable", true);
    page.addEventListener("beforedrag", dragPage);
    page.addEventListener("afterclose", closePage);
    return page;
}

function closePage(e){
    var button = this.$dockbutton;
    var pNode = this.lastParent;
    var btnPNode = button.parentNode;

    button.destroy(true, true);
    
    if (!pNode.getPages().length) {
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
            barParent.vbox.destroy(true, true);
            barParent.splitter.destroy(true, true);
        }
    }
}

function dragPage(e){ //change this to beforedrag and recompile apf
    var origMenu = self[this.$dockbutton.submenu];
    /*var menu = origMenu.cloneNode(false);
    menu.removeAttribute("id");
    apf.document.body.appendChild(menu);*/
    
    var tab = this.parentNode.cloneNode(false);
    tab.removeAttribute("id");
    tab.setAttribute("buttons", "close"); //@todo bug in scale that doesnt resize 
    tab.removeAttribute("anchors");
    apf.document.body.appendChild(tab);
    tab.setWidth(this.parentNode.$ext.offsetWidth);
    tab.setHeight(this.parentNode.$ext.offsetHeight);
    
    var page = this.cloneNode(true);
    page.removeAttribute("id");
    tab.appendChild(page);
    
    if (origMenu.$ext.offsetHeight) {
        var pos = apf.getAbsolutePosition(origMenu.$ext);
        tab.setLeft(pos[0]);
        tab.setTop(pos[1]);
    }
    else {
        var pos = apf.getAbsolutePosition(this.parentNode.$ext);
        tab.setLeft(pos[0] - 1);
        tab.setTop(pos[1] - 2);
    }
    tab.$ext.style.border = "1px solid #333";
    //menu.$ext.style.margin = "0 0 0 0"
    tab.addEventListener("afterdrag", function(e){
        tab.id = tab.name = ""; //@todo fix this bug in apf
        tab.destroy(true, true);
        stopDrag(e.htmlEvent);
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

    startDrag(tab, this);

    return false;
};

var whiledrag, lastInfo;
function startDrag(dragged, original){
    var last, state = 0;
    
    apf.setOpacity(dragged.$ext, 0.3);
    
    function getLastBar(){
        var lastBar = hboxMain.lastChild;
        while (lastBar && lastBar.previousSibling 
          && (lastBar.previousSibling.localName == "bar"
          || lastBar.previousSibling.bar))
            lastBar = lastBar.previousSibling;
        if (lastBar.localName != "bar")
            lastBar = lastBar.bar;
            
        return lastBar;
    }
    
    var lastBar = getLastBar();
    var leftEdge = apf.getAbsolutePosition(lastBar.$ext)[0];
    
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
            info = {
                position : "left_of_column",
                aml : aml = last = lastBar
            }
        }
        //Rest
        else {
            var info = calcAction(e, original);
            var aml  = last = info.aml;
        }
        
        if (lastInfo && lastInfo.position == info.position && lastInfo.aml == aml) {
            indicator.style.top = indicatorTop;
            return;
        }
        
        lastInfo = info;
        
        if (!aml || !aml.dock) {
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
                    div.style.border = "2px solid #7ac7f4";
                    div.style.webkitBorderRadius = "6px";
                }
                else {
                    div.style.top = (pos[1] - pos2[1]
                        + (info.position == "before_button" ? 0 : aml.$ext.offsetHeight) 
                        - 8) + "px";
                    div.style.width = "100%";
                    div.style.borderBottom = "3px solid #7ac7f4";
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
                indicator.style.left = pos2[0] + "px";
                indicator.style.top  = pos2[1] + "px";
                width = pNode.$ext.offsetWidth;
                height = pNode.$ext.offsetHeight;
                
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
                    div1.style.left = diff[0] + "px";
                    div1.style.width = (matchAml.$button.offsetWidth - 5) + "px";
                    div1.style.height = "18px";
                    div1.style.margin = "-18px 0 0 -3px";
                    div1.style.border = "3px solid #7ac7f4";
                    div1.style.borderWidth = "3px 3px 0 3px";
                    
                    div2.style.left = (diff[0] + matchAml.$button.offsetWidth - 3) + "px";
                    div2.style.right = "0px";
                    div3.style.borderBottom =
                    div2.style.borderBottom = "3px solid #7ac7f4";
                    
                    div3.style.left = "0px";
                    div3.style.right = (width - diff[0] - 3) + "px";
                    
                    indicator.style.borderTop = "0px solid #7ac7f4";
                    indicator.style.top = (pos2[1] + 18) + "px";
                    height -= 18;
                }
                else {
                    indicator.innerHTML = "<div style='position:absolute;'><div></div></div>";
                    indicator.firstChild.style.height = "16px";
                    indicator.firstChild.style.width = "5px";
                    indicator.firstChild.style.background = "rgba(122,199,244,0.5)";
                    indicator.firstChild.style.top = "0px";
                    indicator.firstChild.firstChild.style.background = "#7ac7f4";
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
                }
                break;
            case "before_tab":
                height = 0;
            case "after_tab":
                indicator.style.left = pos[0] + "px";
                indicator.style.top  = (pos[1] + height) + "px";
                indicator.style.height = "3px";
                indicator.style.width = width + "px";
                indicator.style.borderWidth = "0 0 0 0";
                indicator.style.backgroundColor = "rgba(122,199,244,0.8)";
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
                indicator.firstChild.style.backgroundColor = "#7ac7f4";
                indicator.firstChild.style.height = "1px";
                indicator.style.backgroundColor = "rgba(122,199,244,0.5)";
                return;
            case "in_column":
                indicator.innerHTML = "<div style='position:absolute'></div>";
                indicator.style.borderWidth = "0 0 0 0";
                
                var div = indicator.firstChild;
                div.style.top = "100%";
                div.style.borderTop = "3px solid #7ac7f4"
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
                if (aml != getLastBar()) {
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
                    div.style.borderRight = "3px solid #7ac7f4"
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

var indicator = document.body.appendChild(document.createElement("div"));
indicator.style.position = "absolute";
indicator.style.display = "none";
indicator.style.border = "3px solid #7ac7f4";
indicator.style.zIndex = 1000000;

var diffPixel = 3;

function matchTab(pos, y) {
    return y > pos - diffPixel && y < pos + diffPixel;
}

function calcAction(e, original){
    var position = "none";

    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el != document.body) {
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
                if (matchTab(tabs[0].$ext.offsetTop + pos, e.clientY))
                    return doTest && original.parentNode == tabs[0] 
                        ? {} : {position: "before_tab", aml: tabs[0]};
                for (var i = 0; i < tabs.length; i++) {
                    if (matchTab(tabs[i].$ext.offsetHeight + 1 
                      + tabs[i].$ext.offsetTop + pos, e.clientY))
                        return doTest && (original.parentNode == tabs[i] || original.parentNode == tabs[i+1])
                            ? {} : {position: "after_tab", aml: tabs[i]};
                }
            }
        }
        
        if (!aml.dock)
            return {};
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "before_page";
            if (aml.localName == "page") {
                var pos = apf.getAbsolutePosition(aml.$button);
                var l = e.clientX - pos[0];
    
                if (l > aml.$button.offsetWidth/2)
                    position = "after_page";
            }
            else if (aml.localName == "menu") {
                var pages = aml.firstChild.getPages();
                aml = pages[pages.length - 1];
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
            var bar = aml;
            while (bar && bar.localName != "bar")
                bar = bar.parentNode;
            
            if (bar) {
                var pos = apf.getAbsolutePosition(e.target, bar.$ext);
                var l = pos[0] + e.offsetX;
                var r = bar.$ext.offsetWidth - l;
            }
            
            if (bar && l < diffPixel) {
                position = "left_of_column";
                aml = bar;
            }
            else if (bar && r < diffPixel) {
                position = "right_of_column";
                aml = bar;
            }
            else if (aml.localName == "bar" || aml.skin == "dockheader") {
                if (aml.skin == "dockheader") {
                    aml = aml.parentNode.selectNodes("vbox")[0];
                    position = "before_section";
                }
                else {
                    position = "in_column";
                    var vboxs = aml.selectNodes("vbox");
                    aml = vboxs[vboxs.length - 1];
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
            else if (aml.localName == "divider" || aml.localName == "vbox") {
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
    }    

    return {
        position : position,
        aml      : aml
    }
}

function stopDrag(e){
    whiledrag();
    apf.removeListener(document, "mousemove", whiledrag);
    
    indicator.style.display = "none";
    
    var info = lastInfo;//calcAction(e);
    var aml  = info && info.aml;
    
    var original = whiledrag.dragged;
    apf.setOpacity(original.$ext, 1);

    if (!aml) return;
    switch(info.position) {
        case "before_button":
        case "after_button":
            var submenu = self[aml.submenu];
            var dragAml = whiledrag.original;

            moveTo(submenu, dragAml, aml, info.position == "before_button" 
                ? aml 
                : aml.nextSibling, aml.parentNode, info.position);
            break;
        case "before_tab":
        case "after_tab":
            var bar      = aml.parentNode.bar;
            var childNr  = apf.getChildNumber(aml);
            var sections = bar.selectNodes("vbox");
            var section = addSection(bar, info.position == "before_tab"
                ? sections[0]
                : sections[childNr + 1]);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            //This block of code should move to inside moveTo somehow... - perhaps mimic before_page
//            var pNode = dragAml.parentNode;
//            submenu.firstChild.appendChild(dragAml);
            var tab = aml.parentNode.insertBefore(submenu.firstChild, info.position == "before_tab"
                ? aml
                : aml.nextSibling);
            tab.setAttribute("flex", 1);

            moveTo(submenu, dragAml, tab, null, section, info.position, tab);//, null, pNode);
            break;
        case "before_section":
        case "in_column":
        case "after_section":
            var section = addSection(aml.parentNode, info.position == "before_section"
                ? aml
                : (info.position == "in_column"
                    ? null
                    : aml.nextSibling));
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;

            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        case "before_page":
        case "after_page":
            var submenu = self[aml.$dockbutton.submenu];//aml.parentNode.parentNode;
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml.parentNode, info.position == "before_page" 
                ? aml.$dockbutton
                : aml.nextSibling && aml.nextSibling.$dockbutton, submenu.ref, 
                    info.position, aml.parentNode);
            break;
        case "left_of_column":
            var bar = addBar(aml);
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        case "right_of_column":
            var bar = addBar();
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, null, section, info.position);
            break;
        default:
            break;
    }
}

function moveTo(submenu, dragAml, aml, beforeButton, parentNode, position, tab, pNode){
    var beforePage = beforeButton && beforeButton.$dockpage;
    
    if (dragAml.localName == "page" || dragAml.localName == "button") {
        if (dragAml.localName == "page") {
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

        if (tab || submenu.firstChild)
            (tab || submenu.firstChild).insertBefore(page, beforePage);
        button.setAttribute("submenu", submenu.id);

        //add button to section
        parentNode.insertBefore(button, beforeButton);

        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            oldMenu.destroy(true, true);
            if (pNode.parentNode)
                pNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length) {
                barParent.destroy(true, true);
                barParent.vbox.destroy(true, true);
                barParent.splitter.destroy(true, true);
            }
        }
    }
    else if (dragAml.localName == "divider") {
        var buttons = dragAml.parentNode.selectNodes("button");
        for (var i = buttons.length - 1; i >= 0; i--) {
            var button = buttons[i];
            var page = button.$dockpage;
            var pNode = page.parentNode;
            var btnPNode = button.parentNode;
            
            if (tab || submenu.firstChild)
                (tab || submenu.firstChild).insertBefore(page, beforePage);
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            parentNode.insertBefore(button, beforeButton);
        }
        
        //Test is not needed;
        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            if (pNode.parentNode)
                pNode.parentNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length) {
                barParent.destroy(true, true);
                barParent.vbox.destroy(true, true);
                barParent.splitter.destroy(true, true);
            }
        }
    }
}

function createMenu(section){
    var menu = new apf.menu({
        id : "submenu" + menuCounter++,
        width : "200",
        height : "200",
        ref        : section,
        pinned     : "true",
        animate    : "false",
        skin       : "dockwindowbasic",
        dock       : 1,
        ondisplay  : function(){
            var pos = apf.getAbsolutePosition(this.opener.$ext);
            var width = apf.getWindowWidth();
            this.$ext.style.marginLeft = (-1 * Math.min((width - pos[0]), this.$ext.offsetWidth)) + "px";
        },
        childNodes : [
            new apf.tab({
                anchors : "0 0 0 0", 
                skin : "docktab",
                buttons : "scale,close",
                dock    : 1,
                onclose : function(e){
                    var page = e.page;
                    page.lastParent = this;
                }

            })
        ]
    });
    
    apf.document.body.appendChild(menu);
    menu.show();
    menu.hide();
    
    return menu;
}

function addBar(before){
    columnCounter++;
    
    var bar = hboxMain.insertBefore(new apf.bar({
        skin : "debug-panel",
        dock : 1,
        onDOMNodeRemovedFromDocument : function(){
            columnCounter--;
        },
        childNodes : [
            new apf.button({
                dock : 1,
                skin : "dockheader",
                onclick : function(){
                    expandBar(this.parentNode);
                }
            })
        ]
    }), before);
    
    return bar;
}

function expandBar(bar){
    if (!bar.vbox) {
        bar.vbox = bar.parentNode.insertBefore(new apf.vbox({
            padding   : 3,
            width     : bar.$dockData && bar.$dockData.width || 260,
            splitters : true,
            vdock     : 1,
            "class"   : "dockcol unselectable",
            childNodes : [
                new apf.button({
                    dock       : 1,
                    skin       : "dockheader",
                    "class"    : "expanded",
                    nosplitter : true,
                    height     : 11,
                    margin     : "0 0 -3 0",
                    onclick    : function(){
                        collapseBar(bar);
                    }
                })
            ]
        }), bar);
        
        //style hack
        bar.vbox.$ext.style.borderLeft = "1px solid #333";
        
        bar.splitter = bar.parentNode.insertBefore(new apf.splitter({
            width : "0"
        }), bar.vbox);
        
        bar.splitter.bar = 
        bar.vbox.bar     = bar;
    }
    else {
        bar.parentNode.insertBefore(bar.vbox, bar);
        bar.parentNode.insertBefore(bar.splitter, bar.vbox);
    }
    
    var vbox = bar.selectNodes("vbox");
    for (var i = 0; i < vbox.length; i++) {
        var menu = self[vbox[i].selectSingleNode("button").submenu]
        menu.hide();
        var tab = menu.firstChild;
        bar.vbox.appendChild(tab);
        if (!tab.flex)
            tab.setAttribute("flex", 1);
    }
    
    bar.hide();
    bar.vbox.show();
    bar.splitter.show();
    
    //Hack for button
    bar.vbox.firstChild.$ext.onmousemove({});
}

function collapseBar(bar){
    var vbox = bar.selectNodes("vbox");
    var tabs = bar.vbox.selectNodes("tab");
    for (var i = 0; i < vbox.length; i++) {
        var menu = self[vbox[i].selectSingleNode("button").submenu];
        menu.appendChild(tabs[i]);
    }
    
    bar.show();
    bar.vbox.hide();
    bar.splitter.hide();
    
    //Hack for button
    bar.firstChild.$ext.onmousemove({});
}

function addSection(bar, before){
    var section = bar.insertBefore(new apf.vbox({
        padding : 0,
        edge : "0 0 3 0",
        "class" : "docksection",
        dock    : 1,
        childNodes : [
            new apf.divider({
                skin : "divider-debugpanel",
                margin : "3 5 2 5",
                dock    : 1,
                draggable : "true"
            })
        ]
    }), before);
    
    var div = section.firstChild;
    div.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
        var section = this.parentNode;
        
        //this.hideMenu();
    
        var pNode = section.parentNode;
        var placeHolder = section.cloneNode(false);
        placeHolder.removeAttribute("id");
        placeHolder.$dockfor = section;
    
        var diff = apf.getDiff(section.$ext);
        var height = section.$ext.offsetHeight;
        var pos = apf.getAbsolutePosition(section.$ext);
        
        pNode.insertBefore(placeHolder, section);
        placeHolder.$ext.style.background = "#acacac";
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
            if (!buttons.length) debugger;
            buttons[0].setValue(false);
            
            stopDrag(e.htmlEvent);
            placeHolder.destroy(true, true);
        });
    
        section.setAttribute("draggable", true);
        
        var clientX = e.htmlEvent.clientX;
        var clientY = e.htmlEvent.clientY;
        setTimeout(function(){
            //@todo Collapse menu
            
            section.$dragStart({clientX:clientX,clientY:clientY});
            section.$ext.style.zIndex = 1000000;
        });
        
        startDrag(section, this);
        
        return false;
    });
    
    return section;
}

function addButton(section, submenu, page){
    var button = section.appendChild(new apf.button({
        "class" : "dockButtonID",
        skin    : "dockButton",
        submenu : submenu.id,
        dock    : 1,
        draggable : "true"
    }));
    
    button.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
        var _self = this;
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
            _self.setValue(false);
            stopDrag(e.htmlEvent);
        });
        
        //document instead?
        var clientX = e.htmlEvent.clientX;
        var clientY = e.htmlEvent.clientY;
        setTimeout(function(){
            btn.$dragStart({clientX:clientX,clientY:clientY});
            btn.$ext.style.zIndex = 1000000;
            this.removeEventListener("mouseover", arguments.callee);
        });
        
        startDrag(btn, this);
        
        return false;
    });

    page.$dockbutton = button;
    button.$dockpage = page;

    return button;
}