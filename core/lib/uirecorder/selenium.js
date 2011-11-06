/*
    - AmlNodes collected, should be collected during recording not converted afterwards

    - Probably need wait hints for when xmlHttpReq is used or setTimeout / setInterval
    - When clicking on tab button it only registers the page, it should also add the specific html element
    * xml properties need to be converted to xpaths
    * aml properties need to be converted to xpaths
    
    * htmlElements in the action object dont have the xpath property (which is needed)
    * for detailList, the items should have id, not caption
    - The UI should allow the user to select which assertions he wants to use
    
    Bugs during records:
    - Focus is in last event
*/

// #ifdef __ENABLE_SELENIUM_PLAYER
function SeleniumPlayer(browser){
    this.browser = browser;
};

(function(){
    this.realtime = true;
    
    this.play = function(name, actionList){
        var script = this.compile(actionList);
        new Function('browser', script)();
    }
    
    this.writeTestFile = function(actionList, filename, name) {
        
    }
    
    this.writeTestOnly = function(actionList, filename){
        
    }
    
    function getFindQuery(item, extra) {
        var data = item.dropTarget || item.amlNode
        var searchObj = {};
        
        if (data.id)
            searchObj.id = data.id;
        else if (data.xpath)
            searchObj.xpath = data.xpath.toLowerCase().replace(/^html\[1\]\//i, ""); //@todo toLowerCase should be removed when capturing is done in realtime
        else
            debugger;
        
        if (data.selected)
            searchObj.xml = data.selected.xpath;
        
        if (item.htmlElement && typeof item.htmlElement.xpath != "string")
            searchObj.html = item.htmlElement.xpath[1];
        
        if (data.activeElement)
            searchObj.property = data.activeElement.name;
        
        if (extra)
            apf.extend(searchObj, extra);
        
        return JSON.stringify(searchObj);
    }
    
    function findHtmlElement(data, contexts, stack) {
        var elName, xpath = data.htmlElement.xpath;
        if (!contexts[xpath]) {
            elName = contexts[xpath] = "elId" + contexts.length++; 
            stack.push("", 
                'var ' + elName + ' = browser.element("xpath", "'
                + xpath.replace(/"/g, '\\"')
                + '");');
        }
        else
            elName = contexts[xpath];
        
        return elName;
    }
    
    function findElement(data, contexts, stack, extra) {
        if (!data.amlNode)
            return findHtmlElement(data, contexts, stack);
        
        var serialized = getFindQuery(data, extra);
        
        var elName;
        if (!contexts[serialized]) {
            elName = contexts[serialized] = "elId" + contexts.length++; 
            stack.push("", 
                'var ' + elName + ' = browser.findApfElement('
                + serialized
                + ');');
        }
        else
            elName = contexts[serialized];
        
        return elName;
    }
    
    this.compile = function(actionList){
        var rules = [], stack;
        var context, contexts = {length: 0};
        var needsMove;
        
        //actionList = actionList.reverse();
        
        var minLength, elId, el, item, temp;
        for (var i = 0, l = actionList.length; i < l; i++) {
            item    = actionList[i];
            el      = item.dropTarget || item.amlNode || item.htmlElement;
            stack   = [];
            
            elId = findElement(item, contexts, stack);

            var x  = (el.selected ? el.selected.x : item.x) - (el.activeElement ? el.activeElement.x : el.x);
            var y  = (el.selected ? el.selected.y : item.y) - (el.activeElement ? el.activeElement.y : el.y);
            
            switch(item.name) {
                case "mousemove":
                    // || !actionList[i + 1] || !actionList[i + 1].name == "mousemove"
                    if (this.realtime)
                        stack.push("browser.moveTo(" + elId 
                            + ", " + x + ", " + y + ");");
                    break;
                case "mousedown":
                    stack.push("browser.moveTo(" + elId 
                        + ", " + x + ", " + y + ");");
                    
                    if (item.button == 2) {
                        stack.push("browser.click('" + elId 
                            + ", 2);");
                    }
                    //@todo think about moving this to a cleanup.
                    else if (
                        (temp = actionList[i + 1]) && contexts[getFindQuery(temp)] == elId && temp.name == "mouseup" &&
                        (temp = actionList[i + 2]) && contexts[getFindQuery(temp)] == elId && temp.name == "mousedown" &&
                        (temp = actionList[i + 3]) && contexts[getFindQuery(temp)] == elId && temp.name == "mouseup" &&
                        (temp = actionList[i + 4]) && contexts[getFindQuery(temp)] == elid && temp.name == "dblclick"
                    ) {
                        // double click detection
                        i += 3;
                        continue;
                    }
                    else {
                        stack.push("browser.buttonDown();");
                    }
                    break;
                case "mouseup":
                    stack.push("browser.moveTo(" + elId 
                        + ", " + x + ", " + y + ");");
                    
                    if (item.button == 2) {
                        //Ignore
                    }
                    else {
                        stack.push("browser.buttonUp();");
                    }
                    break;
                case "mousescroll":
                    throw new Error("Selenium doesn't support the mouse wheel");
                    break;
                case "dblclick":
                    stack.push("browser.moveTo(" + elId 
                        + ", " + x + ", " + y + ");");
                    
                    stack.push("browser.doubleclick();");
                    break;
                case "keypress":
                    //@todo !realtime
                    //@todo modifier Keys
                    //@todo This should be keydown and keyup
                    
                    var inputId = findElement(item, contexts, stack, {
                        html : ["input", "*[contenteditable]", ""]
                    });

                    stack.push("browser.type(" + inputId
                        + "', ['" + item.value + "']);");
                    break;
            }
            
            function contextToExpression(def, nosel){
                var res;
                if (def.id) 
                    res = def.id;
                else
                    res = "apf.document.selectSingleNode(\"" 
                      + def.xpath
                        .replace(/^html\[1\]\//i, "")
                        .replace(/"/g, "\\\"") + "\")";
                
                if (!nosel && def.selected)
                    res += ".$xmlRoot.selectSingleNode('"
                      + def.selected.xpath.replace(/"/g, "\\\"") + "')";
                
                return res;
            }
            
            function genProp(item, name, value, rules){
                var ident = contextToExpression(item.amlNode || item.htmlElement, true);
                rules.push("browser.assert('" 
                    + ident + "." + name + "', '"
                    + (value.type == "aml"
                        ? contextToExpression(value.value)
                        : value.value || JSON.stringify(value)).replace(/'/g, "\\'")
                    + "');");
            }
            
            //Assertions
//            for (var prop in item.properties) {
//                genProp(item, prop, item.properties[prop], stack);
//            }

            var jProps, detailList = item.detailList;
            for (var j = 0, jl = detailList.length; j < jl; j++) {
                for (var k in detailList[j]) {
                    if ((jProps = detailList[j][k].properties) && jProps.length) {
                        for (var p = 0; p < jProps.length; p++) {
                            genProp(detailList[j][k], jProps[p].name, jProps[p].value, stack);
                        }
                    }
                }
            }
            
//            if (this.realtime && actionList[i + 1])
//                stack.push("browser.pause(" + 
//                    (item.time - actionList[i + 1].time) + ")");
            
            rules = rules.concat(stack);
        }
        
        return rules.join("\n");
    }
}).call(SeleniumPlayer.prototype);
//#endif