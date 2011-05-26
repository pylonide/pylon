/*
    TODO:
    - expanded state tab dragging
    
    - state serialization / deserialization
    
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

var bar = addBar();
var section = addSection(bar);
var menu1 = createMenu(section);
addButton(section, menu1, addPage(menu1, "Test4", "test4"));

var section = addSection(bar);
var menu2 = createMenu(section);
addButton(section, menu2, addPage(menu2, "Test3", "test3"));

var section = addSection(bar);
var menu = createMenu(section);
addButton(section, menu, addPage(menu, "Test1", "test1"));
addButton(section, menu, addPage(menu, "Test2", "test2"));

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
        pNode.parentNode.destroy(true, true);
        btnPNode.destroy(true, true);
        if (!barParent.selectNodes("vbox").length)
            barParent.destroy(true, true);
    }
}

function dragPage(e){ //change this to beforedrag and recompile apf
    var menu = this.parentNode.parentNode.cloneNode(false);
    menu.removeAttribute("id");
    apf.document.body.appendChild(menu);
    
    var tab = this.parentNode.cloneNode(false);
    tab.removeAttribute("id");
    tab.setAttribute("buttons", "close"); //@todo bug in scale that doesnt resize 
    menu.appendChild(tab);
    
    var page = this.cloneNode(true);
    page.removeAttribute("id");
    tab.appendChild(page);
    
    var pos = apf.getAbsolutePosition(this.parentNode.parentNode.$ext);
    menu.setLeft(pos[0]);
    menu.setTop(pos[1]);
    menu.$ext.style.margin = "0 0 0 0"
    menu.addEventListener("afterdrag", function(e){
        menu.id = menu.name = ""; //@todo fix this bug in apf
        menu.destroy(true, true);
        stopDrag(e.htmlEvent);
    });
    
    //document instead?
    var clientX = e.htmlEvent.clientX;
    var clientY = e.htmlEvent.clientY;
    menu.setAttribute("draggable", true);
    setTimeout(function(){
        //@todo Collapse menu
        
        menu.$dragStart({clientX:clientX,clientY:clientY});
        menu.$ext.style.zIndex = 1000000;
    });

    startDrag(menu, this);

    return false;
};

var whiledrag, lastInfo;
function startDrag(dragged, original){
    var last, state = 0;
    
    apf.setOpacity(dragged.$ext, 0.3);
    
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
        if (e.clientX > apf.getWindowWidth() - ((columnCounter+1) * 40)
          && e.clientX < apf.getWindowWidth() - ((columnCounter) * 40)) {
            var lastBar = hboxMain.lastChild;
            while (lastBar && lastBar.previousSibling && lastBar.previousSibling.localName == "bar")
                lastBar = lastBar.previousSibling;

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
            case "after_tab":
            case "before_tab":
                var pNode = aml.parentNode;
                var pos2 = apf.getAbsolutePosition(pNode.$ext);
                indicator.style.left = pos2[0] + "px";
                indicator.style.top  = pos2[1] + "px";
                width = pNode.$ext.offsetWidth;
                height = pNode.$ext.offsetWidth - 2;
                
                indicator.style.borderWidth = "3px 3px 3px 3px";
                
                var compareAml = info.position == "before_tab" 
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
                        (info.position == "before_tab" ? 0 : aml.$button.offsetWidth));
                    if (left)
                        left -= 5;
                    else {
                        indicator.firstChild.style.width = "2px";
                        indicator.firstChild.firstChild.style.marginLeft = "0px";
                    }
                    indicator.firstChild.style.left = left + "px";
                }
                break;
            case "before_section":
                height = 0;
            case "after_section":
                indicator.style.left = pos[0] + "px";
                indicator.style.top  = (pos[1] + height - 3) + "px";
                indicator.style.height = "5px";
                indicator.style.width = "100%";
                indicator.style.borderWidth = "0 0 0 0";
                indicator.innerHTML = "<div style='margin:2px 0 2px 0'></div>";
                indicator.firstChild.style.backgroundColor = "#7ac7f4";
                indicator.style.backgroundColor = "rgba(122,199,244,0.5)";
                return;
            case "in_column":
                indicator.innerHTML = "<div style='position:absolute'></div>";
                indicator.style.borderWidth = "0 0 0 0";
                
                var div = indicator.firstChild;
                div.style.top = "100%";
                div.style.borderTop = "3px solid #7ac7f4"
                div.style.height = 0;
                div.style.background = "rgba(172,172,172,0.5)";
                div.style.width = "100%";
                div.style.webkitBorderRadius = "0 0 4px 4px";
                
                apf.tween.single(div, {
                    type: "height",
                    from: 0,
                    to  : dragged.localName == "vbox" ? dragged.$ext.offsetHeight : 50,
                    anim : apf.tween.EASEOUT,
                    steps : 20
                });
                
                break;
            case "left_of_column":
                if (aml.previousSibling && aml.previousSibling.localName == "bar") {
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
function calcAction(e, original){
    var position = "none";

    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el != document.body) {
        var aml = apf.findHost(el);
        if (!aml) return {};
        if (!aml.dock) return {};
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "before_tab";
            if (aml.localName == "page") {
                var pos = apf.getAbsolutePosition(aml.$button);
                var l = e.clientX - pos[0];
    
                if (l > aml.$button.offsetWidth/2)
                    position = "after_tab";
            }
            else if (aml.localName == "menu") {
                var pages = aml.firstChild.getPages();
                aml = pages[pages.length - 1];
                position = "after_tab";
            }
            else if (aml.localName == "tab") {
                pages = aml.getPages();
                aml = pages[pages.length - 1];
                position = "after_tab";
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
        case "before_tab":
        case "after_tab":
            var submenu = aml.parentNode.parentNode;
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml.parentNode, info.position == "before_tab" 
                ? aml.$dockbutton
                : aml.nextSibling && aml.nextSibling.$dockbutton, submenu.ref, info.position);
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

function moveTo(submenu, dragAml, aml, beforeButton, parentNode, position){
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
        var pNode = page.parentNode;
        var btnPNode = button.parentNode;
        
        if (beforeButton && beforeButton.previousSibling == button || beforeButton == button
          || !beforeButton && !button.nextSibling && button.parentNode == parentNode)
            return;
            
        submenu.firstChild.insertBefore(page, beforePage);
        button.setAttribute("submenu", submenu.id);
        
        //add button to section
        parentNode.insertBefore(button, beforeButton);
        
        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            pNode.parentNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length)
                barParent.destroy(true, true);
        }
    }
    else if (dragAml.localName == "divider") {
        var buttons = dragAml.parentNode.selectNodes("button");
        for (var i = buttons.length - 1; i >= 0; i--) {
            var button = buttons[i];
            var page = button.$dockpage;
            var pNode = page.parentNode;
            var btnPNode = button.parentNode;
            
            submenu.firstChild.insertBefore(page, beforePage);
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            parentNode.insertBefore(button, beforeButton);
        }
        
        //Test is not needed;
        if (!pNode.getPages().length) {
            var barParent = btnPNode.parentNode;
            pNode.parentNode.destroy(true, true);
            btnPNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length)
                barParent.destroy(true, true);
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
            this.$ext.style.marginLeft = 
                ((-1 * Math.round((width - pos[0])/43) * 43) + 1) + "px";
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
        bar.vbox = bar.parentNode.appendChild(new apf.vbox({
            padding : 3,
            width : 260,
            splitters : true,
            "class" : "dockcol unselectable",
            childNodes : [
                new apf.button({
                    dock : 1,
                    skin : "dockheader",
                    "class" : "expanded",
                    nosplitter : true,
                    height : 11,
                    margin : "0 0 -3 0",
                    onclick : function(){
                        collapseBar(bar);
                    }
                })
            ]
        }));
        
        //style hack
        bar.vbox.$ext.style.borderLeft = "1px solid #333";
        
        bar.splitter = bar.parentNode.insertBefore(new apf.splitter({
            width : "0"
        }), bar.vbox);
    }
    
    var vbox = bar.selectNodes("vbox");
    for (var i = 0; i < vbox.length; i++) {
        var tab = self[vbox[i].selectSingleNode("button").submenu].firstChild;
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