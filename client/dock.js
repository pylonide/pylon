var menuCounter = 100;

var bar = addBar();
var section = addSection(bar);
var menu1 = createMenu(section);
var div1 = section.firstChild;
var page1 = menu1.firstChild.add("Test4", "test4");
var btn1 = addButton(section, menu1, page1);

var section = addSection(bar);
var menu2 = createMenu(section);
var div1 = section.firstChild;
var page1 = menu2.firstChild.add("Test3", "test3");
var btn1 = addButton(section, menu2, page1);

var section = addSection(bar);
var menu = createMenu(section);
var div1 = section.firstChild;
var page1 = menu.firstChild.add("Test", "test");
var page2 = menu.firstChild.add("Test2", "test2");
var btn1 = addButton(section, menu, page1);
var btn2 = addButton(section, menu, page2);

page1.oDrag = page1.$button;
page2.oDrag = page2.$button;
page1.setAttribute("draggable", true);
page2.setAttribute("draggable", true);
//@todo when cloning id shouldn't be set
page1.addEventListener("beforedragstart", dragPage);
page2.addEventListener("beforedragstart", dragPage);

function dragPage(e){ //change this to beforedrag and recompile apf
    var menu = this.parentNode.parentNode.cloneNode(false);
    menu.removeAttribute("id");
    apf.document.body.appendChild(menu);
    
    var tab = this.parentNode.cloneNode(false);
    tab.removeAttribute("id");
    menu.appendChild(tab);
    
    var page = this.cloneNode(true);
    page.removeAttribute("id");
    tab.appendChild(page);
    
    apf.setOpacity(menu.$ext, 0.8);

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
    var last;
    
    apf.addListener(document, "mousemove", whiledrag = function(e){
        if (last) {
            last.$ext.style.borderBottom = "";
            delete last;
        }
        
        if (!e) return;
        
        dragged.$ext.style.top = "-2000px";
        indicator.style.top = "-2000px";
        apf.plane.hide();
        
        var info = lastInfo = calcAction(e);
        var aml  = last = info.aml;

        if (!aml) return;
        
        //if (!aml.dock) return;
        /*if (aml == original) { //@todo Checks needs to include different representations
            return;
        }*/
        
        var pos = apf.getAbsolutePosition(aml.$ext);
        indicator.style.left = pos[0] + "px";
        indicator.style.top  = pos[1] + "px";
        indicator.style.display = "block";
        indicator.innerHTML = "";
        
        switch(info.position) {
            case "after_button":
                indicator.style.borderWidth = "0 0 3px 0";
                break;
            case "before_tab":
                break;
            case "in_tab":
                indicator.style.borderWidth = "20px 3px 3px 3px";
                break;
            case "in_section":
                indicator.style.borderWidth = "6px 1px 3px 1px";
                break;
            case "after_section":
                
                break;
            case "before_section":
            
                break;
            case "in_column":
                indicator.innerHTML = "<div style='position:absolute'></div>";
                indicator.style.borderWidth = "0 0 0 0";
                
                var div = indicator.firstChild;
                div.style.top = "100%";
                div.style.marginBottom = "-29px";
                div.style.borderBottom = "30px solid gray";
                div.style.width = "100%";
                apf.setOpacity(div, 0.5);
                
                break;
            case "left_of_column":
                indicator.style.borderWidth = "0 0 0 3px";
                break;
            case "right_of_column":
                indicator.style.borderWidth = "0 3px 0 0";
                break;
            default:
                indicator.style.display = "none";
                break;
        }
        
        var diff = apf.getDiff(indicator);
        indicator.style.width  = (aml.$ext.offsetWidth - diff[0]) + "px";
        indicator.style.height = (aml.$ext.offsetHeight - diff[1]) + "px";
    });
    
    whiledrag.dragged  = dragged;
    whiledrag.original = original;
}

var indicator = document.body.appendChild(document.createElement("div"));
indicator.style.position = "absolute";
indicator.style.display = "none";
indicator.style.border = "3px solid blue";
indicator.style.zIndex = 1000000;

var diffPixel = 3;
function calcAction(e){
    var position = "none";
    
    var el = document.elementFromPoint(e.x, e.y);
    if (el != document.body) {
        var aml = apf.findHost(el);
        if (!aml) return {};
        //if (!aml.dock) return {};
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "in_tab";
            if (aml.localName == "page")
                aml = aml.parentNode;
        }
        else {
            var bar = aml;
            while (bar && bar.localName != "bar")
                bar = bar.parentNode;
            
            if (bar) {
                var pos = apf.getAbsolutePosition(e.target, bar.$ext);
                var l = pos[0] + event.offsetX;
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
            else if (aml.localName == "button") {
                position = "after_button";
            }
            else if (aml.localName == "bar") {
                position = "in_column";
                var vboxs = aml.selectNodes("vbox");
                aml = vboxs[vboxs.length - 1];
            }
            else if (aml.localName == "divider" || aml.localName == "vbox") {
                position = "in_section";
                if (aml.localName == "divider")
                    aml = aml.parentNode;
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
    var aml  = info.aml;

    if (!aml) return;
    
    switch(info.position) {
        case "in_section":
            aml = aml.selectNodes("button")[0];
        case "after_button":
            var submenu = self[aml.submenu];
            var dragAml = whiledrag.original;

            moveTo(submenu, dragAml, aml, info.position == "in_section" 
                ? aml 
                : aml.nextSibling, info.position);
            break;
        case "before_section":
            aml = aml.selectNodes("button")[0];
        case "in_column":
        case "after_section":
            var section = addSection(aml.parentNode, info.position == "before_section"
                ? aml
                : null);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            moveTo(submenu, dragAml, aml, null, info.position);
            
//            if (dragAml.localName == "page") {
//                var pNode = dragAml.parentNode;
//                submenu.firstChild.appendChild(dragAml);
//                var button = dragAml.$dockbutton;
//                if (!pNode.getPages().length) {
//                    var barParent = button.parentNode.parentNode;
//                    pNode.parentNode.destroy(true, true);
//                    button.parentNode.destroy(true, true);
//                    if (!barParent.selectNodes("vbox").length)
//                        barParent.destroy(true, true);
//                }
//            }
//            button.setAttribute("submenu", submenu.id);
//            
//            //add button to section
//            section.appendChild(button);
            break;
        case "before_tab":
            break;
        case "in_tab":
            var submenu = aml.parentNode;
            var dragAml = whiledrag.original;
            
            if (dragAml.localName == "page") {
                var pNode = dragAml.parentNode;
                aml.insertBefore(dragAml, info.position == "in_tab" ? null : aml);
                var button = dragAml.$dockbutton;
                if (!pNode.getPages().length) {
                    var barParent = button.parentNode.parentNode;
                    pNode.parentNode.destroy(true, true);
                    button.parentNode.destroy(true, true);
                    if (!barParent.selectNodes("vbox").length)
                        barParent.destroy(true, true);
                }
            }
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            submenu.ref.insertBefore(button, info.position == "in_tab" 
                ? null
                : aml.$dockbutton);
            break;
        case "left_of_column":
            var bar = addBar(aml);
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            var dragAml = whiledrag.original;
            
            //reconstruct menu
            var submenu = createMenu(section);
            if (dragAml.localName == "page") {
                var pNode = dragAml.parentNode;
                submenu.firstChild.appendChild(dragAml);
                var button = dragAml.$dockbutton;
                if (!pNode.getPages().length) {
                    var barParent = button.parentNode.parentNode;
                    pNode.parentNode.destroy(true, true);
                    button.parentNode.destroy(true, true);
                    if (!barParent.selectNodes("vbox").length)
                        barParent.destroy(true, true);
                }
            }
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            section.appendChild(button);
            break;
        case "right_of_column":
            var bar = addBar();
            //Single Tab Case
            //create new section
            var section = addSection(bar);
            
            //reconstruct menu
            var submenu = createMenu(section);
            var dragAml = whiledrag.original;
            
            if (dragAml.localName == "page") {
                var pNode = dragAml.parentNode;
                submenu.firstChild.appendChild(dragAml);
                var button = dragAml.$dockbutton;
                if (!pNode.getPages().length) {
                    var barParent = button.parentNode.parentNode;
                    pNode.parentNode.destroy(true, true);
                    button.parentNode.destroy(true, true);
                    if (!barParent.selectNodes("vbox").length)
                        barParent.destroy(true, true);
                }
            }
            button.setAttribute("submenu", submenu.id);
            
            //add button to section
            section.appendChild(button);//addButton(section, submenu);
            break;
        default:
            break;
    }
}

function moveTo(submenu, dragAml, aml, beforeButton, position){
    var beforePage = beforeButton && beforeButton.$dockpage;
    
    if (dragAml.localName == "page" || dragAml.localName == "button") {
        if (dragAml.localName == "page") {
            var page = dragAml;
            var pNode = page.parentNode;
            var button = dragAml.$dockbutton;
        }
        else if (dragAml.localName == "button") {
            var page = dragAml.$dockpage;
            var pNode = page.parentNode;
            var button = dragAml;
        }
        
        submenu.firstChild.insertBefore(dragAml, beforePage);
        if (!pNode.getPages().length) {
            var barParent = button.parentNode.parentNode;
            pNode.parentNode.destroy(true, true);
            button.parentNode.destroy(true, true);
            if (!barParent.selectNodes("vbox").length)
                barParent.destroy(true, true);
        }
        button.setAttribute("submenu", submenu.id);
        
        //add button to section
        aml.parentNode.insertBefore(button, beforeButton);
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
            aml.parentNode.insertBefore(button, beforeButton);
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
        childNodes : [
            new apf.tab({
                anchors : "0 0 0 0", 
                skin : "docktab",
                buttons : "scale"
            })
        ]
    });
    
    apf.document.body.appendChild(menu);
    
    return menu;
}

function addBar(before){
    var bar = hboxMain.insertBefore(new apf.bar({
        skin : "debug-panel",
        childNodes : [
            new apf.button({
                skin : "dockheader"
            })
        ]
    }), before);
    
    return bar;
}

function addSection(bar, before){
    var section = bar.insertBefore(new apf.vbox({
        padding : 0,
        edge : "0 0 3 0",
        "class" : "docksection",
        childNodes : [
            new apf.divider({
                skin : "divider-debugpanel",
                margin : "3 5 2 5",
                draggable : "true"
            })
        ]
    }), before);
    
    var div = section.firstChild;
    div.addEventListener("beforedragstart", function(e){ //change this to beforedrag and recompile apf
        var section = this.parentNode;
    
        var pNode = section.parentNode;
        var placeHolder = section.cloneNode(false);
        placeHolder.removeAttribute("id");
    
        var diff = apf.getDiff(section.$ext);
        var height = section.$ext.offsetHeight;
        var pos = apf.getAbsolutePosition(section.$ext);
        
        pNode.insertBefore(placeHolder, section);
        placeHolder.$ext.style.background = "gray";
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
                //section.$ext.style.position = "relative";
            });
            
            stopDrag(e.htmlEvent);
            placeHolder.destroy(true, true);
        });
    
        section.setAttribute("draggable", true);
        setTimeout(function(){
            //@todo Collapse menu
            
            section.$dragStart({});
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
        draggable : "true"
    }));
    
    button.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
        var btn = this.cloneNode(true);
        btn.removeAttribute("id");
        apf.document.body.appendChild(btn);
        btn.setValue(true);
    
        var pos = apf.getAbsolutePosition(this.$ext);
        btn.setLeft(pos[0]);
        btn.setTop(pos[1]);
        btn.addEventListener("afterdrag", function(e){
            btn.destroy(true, true);
            stopDrag(e.htmlEvent);
        });
        
        //document instead?
        btn.addEventListener("mouseover", function(e){
            //@todo Collapse menu
            
            btn.$dragStart();
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