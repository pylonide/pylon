/**
 * Git Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Plugin = require("cloud9/plugin");
var sys = require("sys");
var util = require("cloud9/util");
var apollo = require("apollo/oni-apollo-node.js");
var webdriver = require("wd/lib/main");

require.extensions['.sjs'] = function(module, filename) {
    var content = require('fs').readFileSync(filename, 'utf8');
    var js = __oni_rt.c1.compile(content, {filename: filename});
    module._compile(js, filename);
};
var wdInit = require("./c9wd.sjs").init(webdriver);

//var content = require('fs').readFileSync("/Users/rubendaniels/Development/cloud9/server/cloud9/ext/selenium/c9wd.sjs", 'utf8');
//var js = __oni_rt.c1.compile(content);
//var wdInit  = (new Function('webdriver', js + ";return wdInit;"))(webdriver);

var ShellSeleniumPlugin = module.exports = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = "selenium";
    this.jobs = [];
};

sys.inherits(ShellSeleniumPlugin, Plugin);

(function() {
    var username = "cloudnine_partner";
    
    this.$commandHints = function(commands, message, callback) {
        util.extend(commands, {"git": {
            "hint": "the stupid content tracker",
            "commands": {}
        }});
        callback();
    };

    this.command = function(user, message, client) {
        if (message.command != "selenium")
            return false;
            
        var _self = this;

        if (message.destroy) {
            var browser = this.jobs[message.job];
            if (!browser)
                return;

            for (var prop in browser) {
                if (typeof browser[prop] == "function" 
                  && prop != "close" && prop != "quit" && prop != "getOpts")
                    browser[prop] = function(){
                        arguments[arguments.length - 1]({message: "cancelled"});
                    };
            }

            var js = __oni_rt.c1.compile("browser.close();browser.quit();callback();");
            (new Function('browser', 'callback', js))(browser, function(){
                _self.sendResult(0, message.command, {
                    code: 0,
                    argv: message.argv,
                    err: "Test Cancelled",
                    out: '\n \033[31m%s \x1b[31m%t\x1b[37m'
                        .replace('%s', "Test Cancelled")
                        .replace('%t', "by user")
                });
                
                _self.jobs[message.job] = null;
            });
            
            return;
        }

        var argv = message.argv || [];
        var args = argv.slice(1);
        
        if (!args.length) {
            //Display help message
            
            _self.sendResult(0, message.command, {
                code: code,
                argv: message.argv,
                err: null,
                out: null
            });
            
            return;
        }
        else {
            function runTest(err, browser, jobId){
                if (err) {
                    _self.sendResult(0, message.command, {
                        code: 0,
                        argv: message.argv,
                        err: err.message,
                        out: null
                    });
                }
                else {
                    if (browser.settings.where == "sauce")
                        message.quit = true;
                    
                    var code = args.join(" ") 
                        + (message.close && message.quit 
                            ? ";browser.close();browser.quit()"
                            : "") + ";callback();";

                    try {
                        var js = __oni_rt.c1.compile(code);//, {filename: filename});
                    }
                    catch(e){
                        console.log(args.join(" "), "\n\n", e.message, e.stack);
                        
                        _self.sendResult(0, message.command, {
                            code: 0,
                            argv: message.argv,
                            err: e,
                            out: '\n \033[31m%s \x1b[31m%t\x1b[37m'
                                .replace('%s', e.message)
                                .replace('%t', e.stack)
                        });
                        
                        var js = __oni_rt.c1.compile((message.close && message.quit 
                            ? "browser.close();browser.quit()"
                            : "") + ";callback();");
                    }
                    
                    if (message.close)
                        _self.jobs[jobId] = null;
                    
                    //@todo How can I pass a callback???
                    (new Function('browser', 'callback', js))(browser, function(){
                        _self.sendResult(0, message.command, {
                            code: 4,
                            argv: message.argv,
                            err: null,
                            video: browser.settings.where == "sauce"
                                ? "https://saucelabs.com/rest/" + username 
                                    + "/jobs/" + jobId + "/results/video.flv"
                                : "",
                            out: ""
                        });
                    });
                }
            }
            
            var browser;
            if (message.job)
                browser = _self.jobs[message.job];
            
            if (browser)
                runTest(null, browser, message.job);
            else {
                var options = {
                    desired: { 
                        name: 'cloud9',
                        browserName: message.browser,
                        version: message.version,
                        platform: message.os
                    }
                    //waitTimeout: 2000,
                };
                if (message.where == "sauce") {
                    options.where     = "sauce";
                    options.host      = "ondemand.saucelabs.com";
                    options.port      = 80;
                    options.username  = username;
                    options.accessKey = "4681d68d-46eb-4d17-b09b-1cb4575796ad";
                }
                
                wdInit(options, {
                    pass : function(msg, data){
                        _self.sendResult(0, message.command, {
                            code: 1,
                            argv: message.argv,
                            err: null,
                            out: msg,
                            data: data
                        });
                    },
                    error : function(msg, data){
                        _self.sendResult(0, message.command, {
                            code: 2,
                            argv: message.argv,
                            err: null,
                            out: msg,
                            data: data
                        });
                    },
                    cmd : function(data){
                        console.log("cmd:" + data);
                        _self.sendResult(0, message.command, {
                            code: 6,
                            argv: message.argv,
                            err: null,
                            out: "",
                            cmd: data
                        });
                    },
                    log : function(data){
                        _self.sendResult(0, message.command, {
                            code: 3,
                            argv: message.argv,
                            err: null,
                            out: data
                        });
                    },
                    setJobId : function(jobId, browser){
                        _self.sendResult(0, message.command, {
                            code: 5,
                            argv: message.argv,
                            err: null,
                            out: "",
                            job: jobId
                        });
                        
                        _self.jobs[jobId] = browser;
                        
                        if (!browser.settings)
                            browser.settings = options;
                    }
                }, runTest);
            }
        }
        
        return true;
    };
    
    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };
    
}).call(ShellSeleniumPlugin.prototype);
