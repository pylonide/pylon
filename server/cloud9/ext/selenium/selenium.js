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
            wdInit({
                /*host: "ondemand.saucelabs.com",
                port: 80,
                username: username,
                accessKey: "4681d68d-46eb-4d17-b09b-1cb4575796ad",*/
                desired: { 
                    name: 'cloud9',
                    browserName: "chrome", //firefox
                    version: '',
                    platform: 'VISTA'
                },
                url: "http://127.0.0.1:5000/workspace/support/apf/tabs.html",
                waitTimeout: 2000
            }, {
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
                log : function(data){
                    _self.sendResult(0, message.command, {
                        code: 3,
                        argv: message.argv,
                        err: null,
                        out: data
                    });
                }
            }, function(err, browser, jobId){
                if (err) {
                    _self.sendResult(0, message.command, {
                        code: 0,
                        argv: message.argv,
                        err: err,
                        out: null
                    });
                }
                else {
//var args = ["var elId0 = browser.findApfElement({'id':'list1','xml':'item[1]','htmlXpath':'SPAN[1]/U[1]'});browser.moveTo(elId0, 27, 8);browser.buttonDown();var elId1 = browser.findApfElement({'id':'list2'});browser.moveTo(elId1, 117, 0);browser.buttonUp();browser.assert('list1.length', '3');browser.assert('list2.length', '2');hold(63);browser.assert('list1.selection', '[model24.queryNode(\"item[1]\")]');browser.assert('list1.value', '\"Item 2\"');hold(6);browser.assert('list2.selection', '[model26.queryNode(\"item[1]\")]');"];

                    var code = args.join(" ") 
                        + ";browser.close();browser.quit();callback();";
                        
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
                        
                        var js = __oni_rt.c1.compile("browser.close();browser.quit()");//, {filename: filename});
                    }
                    
                    //@todo How can I pass a callback???
                    (new Function('browser', 'callback', js))(browser, function(){
                        _self.sendResult(0, message.command, {
                            code: 4,
                            argv: message.argv,
                            err: null,
                            out: "https://saucelabs.com/rest/" + username 
                                + "/jobs/" + jobId + "/results/video.flv"
                        });
                    });
                }
            });
        }
        /*
        <object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="640" height="375" id="FlvPlayer" align="middle">
<param name="allowScriptAccess" value="sameDomain" />
<param name="allowFullScreen" value="true" />
<param name="movie" value="http://flvplayer.com/free-flv-player/FlvPlayer.swf" />
<param name="quality" value="high" />
<param name="bgcolor" value="FFFFFF" />
<param name="FlashVars" value="flvpFolderLocation=http://flvplayer.com/free-flv-player/flvplayer/&flvpVideoSource=https://saucelabs.com/rest/cloudnine_partner/jobs/b2f0a6ba20e9c5bc0c6adbbbbb81a103/results/video.flv&flvpWidth=640&flvpHeight=375&flvpInitVolume=50&flvpTurnOnCorners=true&flvpBgColor=FFFFFF"
<embed src="http://flvplayer.com/free-flv-player/FlvPlayer.swf" flashvars="flvpFolderLocation=http://flvplayer.com/free-flv-player/flvplayer/&flvpVideoSource=https://saucelabs.com/rest/cloudnine_partner/jobs/b2f0a6ba20e9c5bc0c6adbbbbb81a103/results/video.flv&flvpWidth=640&flvpHeight=375&flvpInitVolume=50&flvpTurnOnCorners=true&flvpBgColor=FFFFFF" quality="high" bgcolor="FFFFFF" width="640" height="375" name="FlvPlayer" align="middle" allowScriptAccess="sameDomain" allowFullScreen="true" type="application/x-shockwave-flash" pluginspage="http://www.adobe.com/go/getflashplayer" />
</object>*/

        return true;
    };
    
    this.dispose = function(callback) {
        // TODO kill all running processes!
        callback();
    };
    
}).call(ShellSeleniumPlugin.prototype);
