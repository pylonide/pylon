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
        
        var Runner = require('../../../runner.sjs');
        var utils = require('../../../utils.sjs');
        
        var tests = {
            setUp: function(browser) {
                browser.open('/');
                this.fileName   = 'text.txt';
                this.folderName = 'text';
                this.newFileName   = 'text2.txt';
                this.newFolderName = 'text2';
            }
        }
        tests[name] = new Function('browser', script);
        
        module.exports.tests = tests;
        
        Runner.runTests(Runner.browser, function() {
            Runner.browser.setTimeout(5000);
            Runner.browser.setSpeed(100);
        }, tests);
    }
    
    this.writeTestFile = function(actionList, filename, name) {
        
    }
    
    this.writeTestOnly = function(actionList, filename){
        
    }
    
    function getContext(item, nosel){
        var sel = item.id || item.xpath;
        if (item.selected && !nosel)
            sel += "###" + item.selected.xpath
        return sel;
    }
    
    this.compile = function(actionList){
        var rules = [], stack;
        var context, contexts = {};
        var needsMove;
        
        //actionList = actionList.reverse();
        
        //if (!this.realtime)
            rules.push("browser.setMouseSpeed(1000);");
        
        for (var el, item, temp, i = 0, l = actionList.length; i < l; i++) {
            item    = actionList[i];
            el      = item.dropTarget || item.amlNode || item.htmlElement;
            stack   = [];
            
            //@todo temporary!!
            if (!el) {
                console.log("EL is undefined!");
                continue;
            }
            
            context = getContext(el); //@todo need support for html elements

            //@todo temporary!!
            if (!context) {
                console.log("CONTEXT is undefined!");
                continue;
            }
            
            if (!contexts[context]) {
                contexts[context] = "apf=" + context.replace(/'/g, "\\'"); //I probably dont understand these selectors yet.
                /*(el.id
                    ? "apfid=" + el.id
                    : "apfsinglenode=" + context.replace(/'/g, "\\'"));*/
                
                stack.push("", 
                    "browser.waitForElementPresent('" + contexts[context] + "');",
                    "browser.assertElementPresent('" + contexts[context] + "');",
                    "browser.waitForVisible('" + contexts[context] + "');");
            }
            
            //stack.push("browser.waitForVisible('" + contexts[context] + "');");
            
            var x  = (item.selected ? item.selected.x : item.x);// - el.x;
            var y  = (item.selected ? item.selected.y : item.y);//- el.y;
            
            switch(item.name) {
                case "mousemove":
                    // || !actionList[i + 1] || !actionList[i + 1].name == "mousemove"
                    if (this.realtime)
                        stack.push("browser.mouseMoveAt('apf=" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    else {
                        needsMove = true;
                        continue;
                    }
                        
                    break;
                case "mousedown":
                    if (needsMove) {
                        stack.push("browser.mouseMoveAt('apf=" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                        needsMove = false;
                    }
                    
                    if (item.button == 2) {
                        stack.push("browser.mouseDownRightAt('" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    }
                    //@todo think about moving this to a cleanup.
                    else if (
                        (temp = actionList[i + 1]) && getContext(temp) == context && temp.name == "mouseup" &&
                        (temp = actionList[i + 2]) && getContext(temp) == context && temp.name == "mousedown" &&
                        (temp = actionList[i + 3]) && getContext(temp) == context && temp.name == "mouseup" &&
                        (temp = actionList[i + 4]) && getContext(temp) == context && temp.name == "dblclick"
                    ) {
                        // double click detection
                        i += 3;
                        continue;
                    }
                    else {
                        stack.push("browser.mouseDownAt('" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    }
                    break;
                case "mouseup":
                    if (needsMove) {
                        stack.push("browser.mouseMoveAt('apf=" + (el.id || el.xpath) //contexts[context] 
                            + "', '" + x + "," + y + "');");
                        needsMove = false;
                    }
                    
                    if (item.button == 2) {
                        stack.push("browser.mouseUpRightAt('" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    }
                    else {
                        stack.push("browser.mouseUpAt('" + contexts[context] 
                            + "', '" + x + "," + y + "');");
                    }
                    break;
                case "mousescroll":
                    throw new Error("Selenium doesn't support the mouse wheel");
                    break;
                case "dblclick":
                    stack.push("browser.doubleClickAt('" + contexts[context]
                        + "', '" + x + "," + y + "');");
                    break;
                case "keypress":
                    //@todo !realtime
                    
                    stack.push("browser.typeKeys('apf=" + (el.id || el.xpath) //contexts[context]
                        + "', '" + item.value + "');");
                    break;
            }
            
            function contextToExpression(def, extra){
                var s = def.split("###");
                return (s[0].indexOf("/") > -1
                    ? "apf.document.selectSingleNode(\"" 
                      + s[0].replace(/"/g, "\\\"") + "\")" 
                    : s[0])
                  + (s[1] 
                    ? ".$xmlRoot.selectSingleNode('"
                      + s[1].replace(/"/g, "\\\"") + "')"
                    : "");
            }
            
            function genProp(item, name, value, rules){
                var ident = contextToExpression(getContext(item.amlNode || item.htmlElement, true));
                
                //@todo change this to a compare function
                if ("array|object".indexOf(typeof value) > -1) {
                    var arg = "('apf.isEqual(" + ident
                        + "." + name + ", "
                        + (value.type == "aml"
                            ? contextToExpression(value.value)
                            : value.value).replace(/'/g, "\\'") //expression
                        + "');";
                        
                    rules.push("browser.waitForExpression" + arg,
                               "browser.assertForExpression" + arg);
                }
                else {
                    var args = "('apf=" + ident
                        + "@" + name + "', 'exact:" 
                        + String(value).replace(/'/g, "\\'") + "');";
                        
                    rules.push("browser.waitForAttribute" + args,
                               "browser.assertForAttribute" + args);
                }
            }
            
            //Assertions
            for (var prop in item.properties) {
                genProp(item, prop, item.properties[prop], stack);
            }
            
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
            
            if (this.realtime && actionList[i + 1])
                stack.push("browser.pause(" + 
                    (item.time - actionList[i + 1].time) + ")");
            
            rules = rules.concat(stack);
        }
        
        return rules.join("\n");
    }
}).call(SeleniumPlayer.prototype);
//#endif