// #ifdef __WITH_UIRECORDER
/*
    Ideas:
        * Hover over the datagrid highlights the element it pertains
        * Easily remove and add assertions/actions
            * add assertion by picking element
            * then present datagrid of properties in context menu style
            * check one or more properties
            * allow to change the value in assertion datagrid
        * drag&drop assertions and actions
        * instead of dividers, make them headings and allow for rename to set test name
            * parent element instead of divider
            * default the name "Recorded Test 1"
        * hide and show advanced view
        * load previous tests
        * Allow to easily play tests locally or on saucelabs
            * The latter should show a movie
            * and make assertions green/red - also should scroll dg
        - Locally play test to return to state
        - Context Menu
            - Play until here
            - Play this test
            - 
        * Run should be disabled until a test is loaded/recorded
        * Datagrid needs drag indicators (seemed to have some before)
        - Datagrid should automatically scroll down during recording, unless
          the user scrolled it up manually
        * Multiselect drag&drop
        
    Bug:
        - Datagrid + textbox editing doesnt work (2nd time broken, skin bad)
        * Update element of action after drag&drop
        - After drag&drop the datagrid isnt expanded
        - After assertion (disabling all children) the dynamic props are gone
        - double clicking also registers the mouseup and down

*/
ppc.uirecorder.ui = {
    created : false,
    
    show : function(){
        if (!this.created)
            this.create();
        else
            winUiRecorder.show();
    },
    
    hide : function(){
        if (!this.created)
            return;
        
        winUiRecorder.show();
    },
    
    start : function(){
        ppc.uirecorder.capture.record();
        
        btnUiRecordStart.disable();
        btnUiRecordStop.enable();
        
        dgUiRecorder.setModel(ppc.uirecorder.capture.model);
        
        ppc.addListener(winUiRecorder.$ext, "mouseover", this.$winHover);
        ppc.addListener(winUiRecorder.$ext, "mouseout", this.$winOut);
        
    },
    
    stop : function(){
        ppc.uirecorder.capture.stop();
        
        btnUiRecordStart.enable();
        btnUiRecordStop.disable();
        
        btnUiRecordRun.setAttribute("disabled", 
            !ppc.uirecorder.capture.actions.length);
        
        ppc.setOpacity(winUiRecorder.$ext, 1);
        ppc.removeListener(winUiRecorder.$ext, "mouseover", this.$winHover);
        ppc.removeListener(winUiRecorder.$ext, "mouseout", this.$winOut);
    },
    
    startAddAssert : function(){
        this.pickingAssertion = true;
        
        this.initHighlights();
        
        ppc.addListener(document, "mousemove", this.assertHandlers[0], true);
        ppc.addListener(document, "mousedown", this.assertHandlers[1], true);
        ppc.addListener(document, "mouseout", this.assertHandlers[2], true);

        barUiRecorder.disable();
        
        ppc.uirecorder.capture.pause();
    },
    
    assertHandlers : [
        function(e){
            if (!e) e = event;
            
            var div = ppc.uirecorder.ui.divs[0];
            div.style.top = "-20000px";

            var htmlNode = document.elementFromPoint(e.x, e.y);
            var amlNode = ppc.findHost(htmlNode);
            
            if (amlNode && amlNode.$ignoreRecorder)
                return;
            
            if (amlNode 
              && (amlNode.$ext.offsetWidth || amlNode.$ext.offsetHeight)) {
                div.style.display = "block";
                var pos = lastPos = ppc.getAbsolutePosition(amlNode.$ext);
                div.style.left = pos[0] + "px";
                div.style.top = pos[1] + "px";
                div.style.width = (amlNode.$ext.offsetWidth - 6) + "px";
                div.style.height = (amlNode.$ext.offsetHeight - 6) + "px";
                
                div.innerHTML = "<div style='position:absolute;right:0;bottom:0;padding:2px 3px 2px 4px;background:black;color:white;font-family:Arial;font-size:10px;'>"
                    + (amlNode.id || ppc.xmlToXpath(amlNode, ppc.document.documentElement)) 
                    + "</div>";
            }
            else {
                div.style.display = "none";
            }
        },
        function(e){
            if (!e) e = event;

            var div = ppc.uirecorder.ui.divs[0];
            var lastTop = div.style.top;
            div.style.top = "-20000px";

            var htmlNode = document.elementFromPoint(e.x, e.y);
            var amlNode = ppc.findHost(htmlNode);

            if (!amlNode || amlNode.$ignoreRecorder)
                return;
            
            var ui = ppc.uirecorder.ui;
            if (ui.selected) {
                ppc.addListener(document, "mousemove", ui.assertHandlers[0], true);
                ppc.addListener(document, "mousedown", ui.assertHandlers[1], true);
                ppc.addListener(document, "mouseout", ui.assertHandlers[2], true);
                
                if (this.menu)
                    this.menu.destroy(true, true);
                
                ui.selected = false;
            }
            else {
                ppc.removeListener(document, "mousemove", ui.assertHandlers[0], true);
                ppc.removeListener(document, "mousedown", ui.assertHandlers[1], true);
                ppc.removeListener(document, "mouseout", ui.assertHandlers[2], true);
                
                var props = amlNode.$supportedProperties;
                
                var xml = ppc.getXml("<properties />");
                var doc = xml.ownerDocument;
                
                div.style.top = lastTop;
                
                this.menu = ppc.document.body.appendChild(new ppc.menu());
                this.menu.$ignoreRecorder = true;
                this.menu.addEventListener("itemclick", function(e){
                    ppc.addListener(document, "mousemove", ui.assertHandlers[0], true);
                    ppc.addListener(document, "mouseout", ui.assertHandlers[2], true);
                    ppc.addListener(document, "mouseout", ui.assertHandlers[2], true);
                    
                    if (dgUiRecorder.selected) {
                        var node = dgUiRecorder.selected;
                        if (node.localName == "assert")
                            node = node.parentNode;
                        
                        var doc = node.ownerDocument;
                        var assert = doc.createElement("assert");
                        assert.setAttribute("name", e.relatedNode.caption);
                        assert.setAttribute("value", JSON.stringify(e.relatedNode.value));
                        assert.setAttribute("element",  
                            JSON.stringify(ppc.uirecorder.capture.getElementLookupDef(null, amlNode)));
                        
                        ppc.xmldb.appendChild(node, assert);
                        
                        dgUiRecorder.select(assert);
                    }
                    
                    ui.selected = false;
                    
                    ui.stopAddAssert();
                });
                
                for (var prop, i = 0; i < props.length; i++) {
                    if (amlNode[props[i]] != undefined) {
                        this.menu.appendChild(new ppc.item({
                            caption : props[i],
                            value   : ppc.uirecorder.capture.getCleanCopy(amlNode[props[i]])
                        })).$ignoreRecorder = true;
                    }
                }
                
                this.menu.display(e.clientX, e.clientY);
                
                /*for (var prop, i = 0; i < props.length; i++) {
                    prop = xml.appendChild(doc.createElement("prop"));
                    prop.setAttribute("name", amlNode[props[i]]);
                    prop.setAttribute("value", 
                        JSON.stringify(ppc.uirecorder.capture.getCleanCopy(amlNode[props[i]])));
                }
                
                dgUiProps.getModel().load(xml);
                
                mnuUiProps.display(e.x, e.y);*/
                
                ppc.stopEvent(e);
                
                ui.selected = true;
            }
        },
        function(e){
            ppc.uirecorder.ui.divs[0].style.display = "none";
        }
    ],
    
    stopAddAssert : function(){
        ppc.removeListener(document, "mousemove", this.assertHandlers[0], true);
        ppc.removeListener(document, "mousedown", this.assertHandlers[1], true);
        ppc.removeListener(document, "mouseout", this.assertHandlers[2], true);
        
        barUiRecorder.enable();
        this.pickingAssertion = false;
        
        ppc.uirecorder.capture.unpause();
    },
    
    findElement : function (options){
        var amlNode, htmlPropNode, resHtml;
    
        if (options.eval)
            amlNode = eval(options.eval);
        else if (options.id)
            amlNode = self[options.id];
        else if (options.xpath)
            amlNode = ppc.document.selectSingleNode(options.xpath);
    
        if (!amlNode)
            return false;
    
        if (options.xml) {
            resHtml = ppc.xmldb.findHtmlNode(amlNode.queryNode(options.xml), amlNode);
            
            if (!resHtml)
                return false;
        }
        else {
            if (options.property)
                htmlPropNode = resHtml = amlNode[options.property];
            else
                resHtml = amlNode.$ext
        }
        
        if (options.htmlXpath) {
            if (!ppc.XPath)
                ppc.runXpath();
    
            resHtml = ppc.XPath.selectNodes(options.htmlXpath, resHtml)[0];
            
            if (!resHtml)
                return false;
        }
    
        if (options.html) {
            if (options.html.dataType == ppc.ARRAY) {
                var temp, arr = options.html;
                for (var i = 0; i < arr.length; i++) {
                    if (!arr[i]) {
                        break;
                    }
                    else if (temp = resHtml.querySelector(arr[i])) {
                        resHtml = temp;
                        break;
                    }
                }
            }
            else {
                resHtml = resHtml.querySelector(DOMSelector);
                
                if (!resHtml)
                    return false;
            }
        }
    
        return {
            aml : amlNode,
            prop : htmlPropNode,
            html : resHtml
        }
    },
    
    hideHighlightElements : function(){
        if (!this.divs) return;
        
        this.divs.each(function(div){
            div.style.display = "none";
        });
    },
    
    initHighlights : function(){
        if (!this.divs) {
            this.divs = [
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div")),
                document.body.appendChild(document.createElement("div"))
            ];
            
            var div = this.divs[0];
            div.style.border = "3px solid blue";
            div.style.position = "absolute";
            ppc.window.zManager.set("plane", div);
            div.style.display = "none";
            div.style.cursor = "default";
            ppc.setOpacity(div, "0.5");
            
            var div = this.divs[1];
            div.style.border = "2px solid purple";
            div.style.position = "absolute";
            ppc.window.zManager.set("plane", div);
            div.style.display = "none";
            ppc.setOpacity(div, "0.5");
            
            var div = this.divs[2];
            div.style.border = "1px solid red";
            div.style.position = "absolute";
            ppc.window.zManager.set("plane", div);
            div.style.display = "none";
            ppc.setOpacity(div, "0.5");
            
            var div = this.divs[3];
            div.style.border = "2px solid red";
            div.style.width = "1px";
            div.style.height = "1px";
            div.style.backgroundColor = "white";
            div.style.borderRadius = "3px";
            div.style.position = "absolute";
            div.style.display = "none";
            ppc.window.zManager.set("plane", div);
        }
    },
    
    highlightElement : function(e){
        if (ppc.uirecorder.isRecording || this.pickingAssertion)
            return;
        
        this.initHighlights();
        
        var xmlNode = ppc.xmldb.findXmlNode(e.htmlEvent.srcElement || e.htmlEvent.target);
        if (!xmlNode)
            return;
        
        if (xmlNode.getAttribute("element")) {
            var elObj = JSON.parse(xmlNode.getAttribute("element"));
            if (!elObj)
                return;
            
            var lastPos  = [0, 0];
            var nodeInfo = this.findElement(elObj);
            
            //Aml Element
            var div = this.divs[0];
            if (nodeInfo.aml 
              && (nodeInfo.aml.$ext.offsetHeight || nodeInfo.aml.$ext.offsetWidth)) {
                div.style.display = "block";
                var pos = lastPos = ppc.getAbsolutePosition(nodeInfo.aml.$ext);
                div.style.left = pos[0] + "px";
                div.style.top = pos[1] + "px";
                div.style.width = (nodeInfo.aml.$ext.offsetWidth - 6) + "px";
                div.style.height = (nodeInfo.aml.$ext.offsetHeight - 6) + "px";
                div.innerHTML = "<div style='position:absolute;right:0;bottom:0;padding:2px 3px 2px 4px;background:black;color:white;font-family:Arial;font-size:10px;'>"
                    + (nodeInfo.aml.id || ppc.xmlToXpath(nodeInfo.aml, ppc.document.documentElement)) 
                    + "</div>";
            }
            else
                div.style.display = "none";
            
            //HTML Element Property ??
            var div = this.divs[1];
            if (nodeInfo.prop
              && (nodeInfo.prop.offsetWidth || nodeInfo.prop.offsetHeight)) {
                div.style.display = "block";
                
                var pos = lastPos = ppc.getAbsolutePosition(nodeInfo.prop);
                div.style.left = pos[0] + "px";
                div.style.top = pos[1] + "px";
                div.style.width = (nodeInfo.prop.offsetWidth - 4) + "px";
                div.style.height = (nodeInfo.prop.offsetHeight - 4) + "px";
            }
            else
                div.style.display = "none";
            
            //HTML Element
            var div = this.divs[2];
            if (nodeInfo.html
              && (nodeInfo.html.offsetWidth || nodeInfo.html.offsetHeight)) {
                div.style.display = "block";
                
                var pos = lastPos = ppc.getAbsolutePosition(nodeInfo.html);
                div.style.left = pos[0] + "px";
                div.style.top = pos[1] + "px";
                div.style.width = (nodeInfo.html.offsetWidth - 2) + "px";
                div.style.height = (nodeInfo.html.offsetHeight - 2) + "px";
            }
            else
                div.style.display = "none";
            
            var json = xmlNode.getAttribute("json");
            var div = this.divs[3];
            if (json && (json = JSON.parse(json)) && json.offsetX) {
                div.style.display = "block";
                
                div.style.left = (lastPos[0] + json.offsetX) + "px";
                div.style.top = (lastPos[1] + json.offsetY) + "px";
            }
            else
                div.style.display = "none";
        }
    },
    
    $winHover : function(){
        ppc.setOpacity(winUiRecorder.$ext, 1);
    },
    
    $winOut : function(){
        ppc.setOpacity(winUiRecorder.$ext, 0.5);
    },
    
    write : function(){
        var tests = this.getTests();
        
        //Write to server
        
        console.dir(tests);
    },
    
    getTests : function(compiled){
        var model = ppc.uirecorder.capture.model;
        var nodes = model.queryNodes("test");
        
        var sp = new SeleniumPlayer();
        sp.realtime = false;
        
        var test, tests = {}, actions, action, asserts, assert;
        for (var i = 0; i < nodes.length; i++) {
            actions = ppc.queryNodes(nodes[i], "action");
            
            test = [];
            for (var j = 0; j < actions.length; j++) {
                action = JSON.parse(actions[j].getAttribute("json"));
                action.properties = [];
                
                asserts = ppc.queryNodes(actions[j], "assert");
                for (var k = 0; k < asserts.length; k++) {
                    assert = JSON.parse(asserts[k].getAttribute("json")) || {};
                    
                    assert.element = JSON.parse(asserts[k].getAttribute("element"))
                    assert.value   = JSON.parse(asserts[k].getAttribute("value")) //@todo potential problem with newlines in content
                    assert.name    = asserts[k].getAttribute("name"); 
                    
                    action.properties.push(assert);
                }
                
                test.push(action);
            }
            
            tests[nodes[i].getAttribute("name")] = !compiled ? test : sp.compile(test);
        }
        
        return tests;
    },
    
    create : function(){
        var include = ppc.document.createElementNS(ppc.ns.aml, "include");
        include.setAttribute("src", "/static/support/ppc/core/lib/uirecorder/ui.xml");
        
        ppc.document.body.appendChild(include);
        
        include.callback = function(){
            var nodes = winUiRecorder.getElementsByTagName("*");
            nodes.push(winUiRecorder);
            nodes.each(function(node){
                node.$ignoreRecorder = true;
            });
            
            winUiRecorder.show();
        }
    }
}

ppc.registerHotkey("Command-F10", function(){
    ppc.uirecorder.ui.show();
});
// #endif
