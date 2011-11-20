// #ifdef __ENABLE_SELENIUM_PLAYER
function SeleniumPlayer(browser){
    this.browser = browser;
};

(function(){
    this.realtime = true;
    
    this.play = function(name, actions){
        var script = this.compile(actions);
        new Function('browser', script)();
    }
    
    this.writeTestFile = function(actions, filename, name) {
        
    }
    
    this.writeTestOnly = function(actions, filename){
        
    }
    
    function findElement(element, contexts, stack, extra) {
        var elName;
        var obj = extra ? apf.extend({}, element, extra) : element;
        var serialized = JSON.stringify(obj);
        
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
    
    var keys = [
        {name: "ctrlKey",  char: "\uE009", state: false}, 
        {name: "metaKey",  char: "\uE03E", state: false},
        {name: "shiftKey", char: "\uE008", state: false},
        {name: "altKey",   char: "\uE00A", state: false}
    ];
    
    this.compile = function(actions){
        var rules = [], stack;
        var context, contexts = {length: 0};
        var needsMove;
        
        var minLength, elId, el, item, temp, lastMouseDown, lastCoords;
        for (var i = 0, l = actions.length; i < l; i++) {
            item    = actions[i];
            el      = item.element;
            stack   = [];

            if (!el) {
                console.log("Found item without any element");
                continue;
            }
            
            if (!this.realtime && item.name == "mousemove")
                continue;

            elId = findElement(item.element, contexts, stack);

            var x  = item.offsetX;
            var y  = item.offsetY;
            
            if (!item.name.indexOf("key")) {
                keys.each(function(info){
                    if (item[info.name] != info.state) {
                        info.state = !info.state;
                        stack.push("browser.keyToggle('" + info.char + "');")
                    }
                });
            }
            
            switch(item.name) {
                case "mousemove":
                    // || !actions[i + 1] || !actions[i + 1].name == "mousemove"
                    stack.push("browser.moveTo(" + elId 
                        + ", " + x + ", " + y + ");"); //@todo make these absolute
                        
                    break;
                case "mousedown":
                    lastMouseDown = [elId, item.x, item.y];
                    
                    stack.push("browser.moveTo(" + elId 
                        + ", " + x + ", " + y + ");");
                    
                    if (item.button == 2) {
                        stack.push("browser.click('" + elId + ", 2);");
                    }
                    //@todo think about moving this to a cleanup.
                    else if (
                        (temp = actions[i + 1]) && contexts[temp.element] == elId 
                            && temp.name == "mouseup" &&
                        (temp = actions[i + 2]) && contexts[temp.element] == elId
                            && temp.name == "mousedown" &&
                        (temp = actions[i + 3]) && contexts[temp.element] == elId
                            && temp.name == "mouseup" &&
                        (temp = actions[i + 4]) && contexts[temp.element] == elid
                            && temp.name == "dblclick"
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
                    if (lastMouseDown && lastMouseDown[0] == elId) {
                        if (lastMouseDown[1] != item.x || lastMouseDown[2] != item.y) {
                            x += item.x - lastMouseDown[1];
                            y += item.y - lastMouseDown[2];
                            lastMouseDown = null;
                            
                            stack.push("browser.moveTo(" + elId 
                                + ", " + x + ", " + y + ");");
                        }
                    }
                    else {
                        stack.push("browser.moveTo(" + elId 
                            + ", " + x + ", " + y + ");");
                    }
                    
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
                    
                    //stack.push("browser.doubleclick();");
                    stack.push("browser.buttonDown();");
                    stack.push("browser.buttonUp();");
                    stack.push("browser.buttonDown();");
                    stack.push("browser.buttonUp();");
                    break;
                case "keydown":
                    break;
                case "keyup":
                    break;
                case "keypress":
                    //@todo !realtime
                    //@todo modifier Keys
                    //@todo This should be keydown and keyup
                    
                    var inputId = findElement(item.element, contexts, stack, {
                        html : ["input", "*[contenteditable]", ""]
                    });

                    stack.push("browser.type(" + inputId
                        + "', ['" + item.value + "']);");
                    break;
            }
            
            /**** Assertions ****/
            
            function contextToExpression(def, nosel){
                var res;
                if (def.id) 
                    res = def.id;
                else
                    res = "apf.document.selectSingleNode(\"" 
                      + def.xpath
                        .replace(/^html\[1\]\//i, "")
                        .replace(/"/g, "\\\"") + "\")";
                
                if (def.xml)
                    res += ".$xmlRoot.selectSingleNode('"
                      + def.xml.replace(/"/g, "\\\"") + "')";
                
                return res;
            }
            
            //@todo this function can be expanded to cover all cases
            //      but I haven't seen them occur yet
            function serializeValue(value) {
                if (value && (value.id || value.xpath 
                  || value.htmlXpath || value.xml || value.eval))
                    return contextToExpression(prop.value);
                else if (value.dataType == apf.ARRAY) {
                    var o = [];
                    for (var i = 0; i < value.length; i++) {
                        o.push(value[i] && value[i].eval
                            ? value[i].eval
                            : JSON.stringify(value[i]));
                    }
                    return "[" + o.toString() + "]";
                }
//                else if (typeof value == "object") {
//                    
//                }
                else
                    return JSON.stringify(value);
            }
            
            // Properties
            var time = 0;
            for (var prop, j = 0; j < item.properties.length; j++) {
                prop = item.properties[j];
                var ident = contextToExpression(prop.element);
                
                if (prop.async && prop.time > time) {
                    stack.push("hold(" + ((prop.time - time) * 3) + ")");
                    time = prop.time;
                }

                stack.push("browser.assert('" 
                    + ident + "." + prop.name + "', '"
                    + serializeValue(prop.value).replace(/'/g, "\\'")
                    + "');");
                
                if (stack[stack.length - 1].indexOf("Could not serialize") > -1)
                    stack.pop();
            }
            
            // HTTP
            //@todo
            
            // Data
            //@todo
            
            if (this.realtime && actions[i + 1])
                stack.push("hold(10);");
            
            rules = rules.concat(stack);
        }
        
        return rules.join("\n");
    }
}).call(SeleniumPlayer.prototype);
//#endif