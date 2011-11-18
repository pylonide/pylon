exports.init = function(webdriver){

function wdInit(options, assert, callback) {
    var browser = webdriver.remote(
        options.host, 
        options.port, 
        options.username, 
        options.accessKey);

    // This hijacks the commands in Soda and replaces them with synchronous
    // versions of themselves so we can use conditionals and react to every single
    // command results as we want.
    if (!browser.decorated) {
        function __replace(cmd){
            var oldCmd = browser.constructor.prototype[cmd];
            if (typeof oldCmd != "function")
                return;
        
            browser.constructor.prototype[cmd] = function(){
                if (cmd != "eval") 
                    console.log(cmd);
                
                waitfor(err, res) {
                    var args = Array.prototype.slice.call(arguments);
                    args.push(resume)
                    oldCmd.apply(this, args);
                }
        
                if (err) throw err;
        
                return res;
            };
        }
        
        for (var cmd in browser) {
            __replace(cmd); //Inlining above code doesn't work
        }
    }
    
    browser.constructor.prototype.decorated = true;

    var jobId = browser.init(options.desired);
    browser.get(options.url);
    browser.setWaitTimeout(options.waitTimeout);
    
    //Wait until APF is loaded
    browser.executeAsync("var cb = arguments[arguments.length - 1];
        var _$loadTimer = setInterval(function(){
            if (self.apf && apf.loaded) {
                console.log('test');
                clearInterval(_$loadTimer);
                cb();
            }
        }, 10);");
    
    browser.execute("_$findApfElement = function (options){
        var result;
    
        if (options.eval) {
            result = eval(options.eval);
        }
        else if (options.id) {
            result = self[options.id];
        }
        else if (options.xpath) {
            result = apf.document.selectSingleNode(options.xpath);
        }
    
        if (!result) {
            return {
                message : 'Could not find AML Element ' + (options.id || options.xpath)
            }
        }
    
        if (options.xml) {
            result = apf.xmldb.findHtmlNode(result.queryNode(options.xml), result);
            
            if (!result) {
                return {
                    message : 'Could not find XML Element ' + (options.xml)
                }
            }
        }
        else {
            if (options.property) {
                result = result[options.property];
            }
            else {
                result = result.$ext
            }
        }
        
        if (options.htmlXpath) {
            if (!apf.XPath)
                apf.runXpath();
    
            result = apf.XPath.selectNodes(options.htmlXpath, result)[0];
            
            if (!result) {
                return {
                    message : 'Could not find HTML Element (xpath) ' + (options.htmlXpath)
                }
            }
        }
    
        if (options.html) {
            if (options.html.dataType == apf.ARRAY) {
                var temp, arr = options.html;
                for (var i = 0; i < arr.length; i++) {
                    if (!arr[i]) {
                        break;
                    }
                    else if (temp = result.querySelector(arr[i])) {
                        result = temp;
                        break;
                    }
                }
            }
            else {
                result = result.querySelector(DOMSelector);
                
                if (!result) {
                    return {
                        message : 'Could not find HTML Element ' + (options.html)
                    }
                }
            }
        }
    
        return result;
    }");
    
    browser.findApfElement = function (options) {
        var elId = browser.eval("_$findApfElement(" + JSON.stringify(options) + ")");
        
        if (elId.message) {
            assert.error('\n \033[31m%s \x1b[31m%t\x1b[37m'
                .replace('%s', "[ELEMENT NOT FOUND]")
                .replace('%t', elId.message), 
                elId.message);
            return false;
        }
        
        return elId.ELEMENT;
    };
    
    browser.execute("_$equals = function (input, match){
        if ('array|function|object'.indexOf(typeof input) == -1) {
            return input == match;
        }
        else if (input.equals) {
            return input.equals(match);
        }
        else {
            for (var prop in input) {
                if (!_$equals(input[prop], match[prop])) {
                    return false;
                }
            }
            return true;
        }
    }");
    
    browser.assert = function(input, match) {
        var isEqual = browser.execute("try{
            return _$equals(" + input + ", " + match + ");
        } catch(e) {
            return {
                error   : true, 
                message : e.message
            }
        }");
        
        if (isEqual === false || isEqual.error) {
            var value = isEqual.message || browser.eval(input);
            
            assert.error('\n \033[31m%s \x1b[31m%t\x1b[37m'
                .replace('%s', "[ASSERT FAILED]")
                .replace('%t', "'" 
                    + input + "' expected '" + match + "' but got '"
                    + (value) + "'"), 
                {
                    input: input,
                    match: match,
                    measured: value
                });
            return false;
        }
        else if (isEqual === true) {
            assert.pass('\n \033[32m%s \x1b[32m%t\x1b[37m'
                .replace('%s', "[ASSERT PASSED]")
                .replace('%t', "'" 
                    + input + "' equals '" + match + "'"),
                {
                    input: input,
                    match: match
                });
            return true;
        }
        else
            return isEqual;
    }
    
    callback(null, browser, jobId);
}

return wdInit;

}