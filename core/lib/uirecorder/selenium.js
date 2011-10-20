/*
    - Probably need wait hints for when xmlHttpReq is used or setTimeout / setInterval
    - When clicking on tab button it only registers the page, it should also add the specific html element
    - xml properties need to be converted to xpaths
    - aml properties need to be converted to xpaths
    
    - htmlElements in the action object dont have the xpath property (which is needed)
    - for detailList, the items should have id, not caption
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
    
    this.play = function(actionList){
        var script = this.compile(actionList);
        eval(script);
    }
    
    function getContext(item){
        xpath = item.xpath;
        if (item.selected)
            xpath += "###" + item.selected.xpath
    }
    
    this.compile = function(actionList){
        var lines = [];
        var context, contexts = {};
        
        if (!this.realtime)
            rules.push("browser.setMouseSpeed(1000);");
        
        for (var item, temp, i = 0, l = actionList.length; i < l; i++) {
            item = actionList[i];
            
            context = getContext(item); //@todo need support for html elements
            
            if (!contexts[context]) {
                contexts[context] = (item.amlNode.id
                    ? "apfid=" + item.amlNode.id
                    : "apfsinglenode=" + item.amlNode.xpath.replace(/'/g, "\\'"));
                
                rules.push("\n", 
                    "browser.waitForElementPresent('" + contexts[context] + "');",
                    "browser.assertElementPresent('" + contexts[context] + "');");
            }
            
            rules.push("browser.waitForVisible('" + contexts[context] + "');");
            
            switch(item.name) {
                case "mousemove":
                    if (this.realtime) {
                        var x = 
                        
                        rules.push("browser.mouseMoveAt('" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    }
                    else if (!actionList[i + 1] 
                      || !actionList[i + 1].name == "mousemove") {
                        
                    }
                    break;
                case "mousedown":
                    if (item.button == 2) {
                        
                    }
                    //@todo think about moving this to a cleanup.
                    else if (
                        (temp = actionsList[i + 1]) && getContext(temp) == context && temp.name == "mouseup" &&
                        (temp = actionsList[i + 2]) && getContext(temp) == context && temp.name == "mousedown" &&
                        (temp = actionsList[i + 3]) && getContext(temp) == context && temp.name == "mouseup" &&
                        (temp = actionsList[i + 4]) && getContext(temp) == context && temp.name == "dblclick"
                    ) {
                        // double click detection
                        i += 3;
                        continue;
                    }
                    else {
                        
                    }
                    break;
                case "mouseup":
                    if (item.button == 2) {
                        
                    }
                    else {
                        
                    }
                    break;
                case "mousescroll":
                    throw new Error("Selenium doesn't support the mouse wheel");
                    break;
                case "dblclick":
                    rules.push("this.browser.doubleClick('" + context + "')");
                    break;
                case "keypress":
                    break;
            }
            
            function contextToExpression(def, extra){
                var s = def.split("###");
                return "apf.document.selectSingleNode('" 
                    + s[0].replace(/'/g, "\\'") + "')" 
                    + (s[1] 
                      ? ".$xmlRoot.selectSingleNode('"
                        + s[2].replace(/'/g, "\\'") + "')"
                      : "");
            }
            
            function genProp(item, name, value, rules){
                if ("array|object".indexOf(typeof value)) {
                    var arg = "('" 
                        + contextToExpression(getCaption(item)) + "." + name 
                        + " == "
                        + (value.type == "aml"
                            ? contextToExpression(value.value)
                            : value.value) //expression
                        + "')";
                        
                    rules.push("browser.waitForExpression" + arg,
                               "browser.assertForExpression" + arg);
                }
                else {
                    var args = "('" + name + "', 'exact:" 
                        + value.replace(/'/g, "\\'") + "')";
                        
                    rules.push("browser.waitForAttribute" + args,
                               "browser.assertForAttribute" + args);
                }
            }
            
            //Assertions
            for (var prop in item.properties) {
                genProp(item, prop, item.properties[prop], rules);
            }
            
            var jProps, detailList = item.detailList;
            for (var j = 0, jl = detailList.length; j < jl; j++) {
                if ((jProps = detailList[j].properties).length) {
                    for (var p = 0; p < jProps.length; p++) {
                        genProp(detailList[j], jProps[p].name, jProps[p].value, rules);
                    }
                }
            }
            
            if (this.realtime && actionList[i + 1])
                rules.push("browser.pause(" + 
                    (actionsList[i + 1].time - item.time) + ")");
        }
        
        return rules.join("\n");
    }
}).call(SeleniumPlayer.prototype);
//#endif