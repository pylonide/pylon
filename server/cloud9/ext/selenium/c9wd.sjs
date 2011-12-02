exports.init = function(webdriver){

var x = 0;
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
                    assert.cmd(cmd);
                
                waitfor(err, res) {
                    var args = Array.prototype.slice.call(arguments);
                    args.push(resume)
                    oldCmd.apply(this, args);
                }
        
                if (err) 
                    callback(err);
        
                return res;
            };
        }
        
        for (var cmd in browser) {
            __replace(cmd); //Inlining above code doesn't work
        }
        
        browser.constructor.prototype.hold = function(ms){
            assert.cmd("hold");
            hold(ms);
        };
        
        browser.constructor.prototype.findApfElement = function (options) {
            this.waitFor("_$elementExists(" + JSON.stringify(options) + ")");
            
            var elId = this.eval("_$findApfElement(" + JSON.stringify(options) + ")");
            if (!elId)
                return;
                
            if (elId.message) {
                assert.error('\n \033[31m%s \x1b[31m%t\x1b[37m'
                    .replace('%s', "[ELEMENT NOT FOUND]")
                    .replace('%t', elId.message), 
                    elId.message);
                return false;
            }
            
            return elId.ELEMENT;
        };
        
        browser.constructor.prototype.assert = function(input, match) {
            var isEqual = this.execute("try{
                return _$equals(" + input + ", " + match + ");
            } catch(e) {
                return {
                    error   : true, 
                    message : e.message
                }
            }");
            
            if (isEqual === false || isEqual.error) {
                var value = isEqual.message || this.eval(input);
            
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

        browser.constructor.prototype.getDecoratedPage = function(url) {
            this.get(url);
            this.setWaitTimeout(options.waitTimeout || 2000);
            this.setAsyncTimeout(5000);
            
            //Wait until APF is loaded
            this.executeAsync("var cb = arguments[arguments.length - 1];
                var _$loadTimer = setInterval(function(){
                    if (self.apf && apf.loaded) {
                        clearInterval(_$loadTimer);
                        cb();
                    }
                }, 10);");
            
            this.execute("_$findApfElement = function (options){
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
                        message : 'Could not find AML Element ' 
                            + (options.eval || options.id || options.xpath)
                            + ' ' + JSON.stringify(options)
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
            }; 
            
            _$elementExists = function(options){
                var elId = _$findApfElement(options);
                return elId && elId.style;
            };
            
            _$equals = function (input, match){
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
        }

        browser.constructor.prototype.decorated = true;
    }

    var jobId = browser.init(options.desired);

    assert.setJobId(jobId, browser);
    
    callback(null, browser, jobId);
}

return wdInit;

}