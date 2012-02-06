/**
 * Guides the user through features of the IDE
 * 
 * @author Matt Pardee
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
    
var ext = require("core/ext");
var ide = require("core/ide");
var skin = require("text!ext/guidedtour/skin.xml");
var markup = require("text!ext/guidedtour/guidedtour.xml");
var ideConsole = require("ext/console/console");
var zen = require("ext/zen/zen");
var dockpanel = require("ext/dockpanel/dockpanel");
var panels = require("ext/panels/panels");
var settings = require("core/settings");
var helloWorldScript = require("text!ext/guidedtour/hello-world-script.txt");

var save;
var madeNewFile = false;
var wentToZen = false;
var madeDebug = false;
var deletedFile = false;
var hasDeploy = false;

var jsonTourIde = {
    initialText: "This guided tour introduces you to some of the ways<br/> Cloud 9 IDE makes it easy for you to program faster and smarter.\n\nClick the play button below to be taken on the tour automatically. Or, you can click the forward and backward buttons to navigate on your own. Remember that during the tour, you won't be able to interact with any of the editor's features.",
    finalText: "Well, that's everything! Still have questions? Head on over to <a href=\"http://support.cloud9ide.com/forums\" target=\"_blank\">our documentation site</a>.",
    steps: [
    {
        el: navbar,
        desc: "This is the project bar. It controls the behavior of the IDE, as well as the presentation of your code.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            // require("ext/tree/tree").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Project Files"]'),
        desc: "This button shows and hides your project files.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/openfiles/openfiles").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Open Files"]'),
        desc: "This button shows and hides your open files in a list view.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/settings/settings").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Preferences"]'),
        desc: "Here, you can change the behavior of the editor, manipulate the code beautifier, and change the indentation and width of the editor, among other options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: "winFilesViewer",
        desc: "All your project files are listed here. You can rename and delete files, as well as drag in new ones from your computer. You can also right-click to see context options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: plus_tab_button,
        desc: "You can use this button to quickly add new files to the editor. We'll simulate pushing that right now.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            if (madeNewFile == false) {
                madeNewFile = true;
                require("ext/newresource/newresource").newfile();
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabEditors.$ext),
        desc: "Here's a tabbed arrangement of all your active files, including the new one we just created. You can rearrange the tabs however you like and swap through them with keyboard shortcuts.",
        pos: "bottom",
        time: 4
    }, {
        before: function() {
            tabEditors.getPage().$doc.setValue(helloWorldScript);
            if (!save) 
                save = require("ext/save/save");
            var page = tabEditors.getPage();
            var file = page.$model.data;
            save._saveAsNoUI(page, file.getAttribute("path"), ide.davPrefix + "/helloWorld-quideTour.js");
            require("ext/tree/tree").refresh();
        },
        el: undefined,
        div: "ceEditor",
        desc: "We've just typed up a quick code example and saved it as \"helloWorld-quideTour.js.\" We'll work with this file, then delete it when we're done.",
        pos: "left",
        time: 5
    }, {
        before: function(){
            if (wentToZen){
                zen.fadeZenButtonOut();
                wentToZen = false;
            }
        },
        el: undefined,
        div: "DIV[1]",
        desc: "The gutter can do more than show line numbers. It also detects and displays warnings and errors in your code. If you're debugging an application, you can also set breakpoints here.",
        pos: "right",
        time: 5
    }, {
        before: function(){
            wentToZen = true;
            zen.fadeZenButtonIn();
        },
        el: undefined,
        div: undefined,
        desc: "If you hover over this corner, you can activate \"Zen Mode,\" which is a distraction-free environment. We'll simulate pressing that button now.",
        pos: "left",
        time: 5
    }, {
        before: function() {
            var hlElement = require("ext/guidedtour/guidedtour").hlElement;
            hlElement.style.visibility = "hidden";
            winTourText.hide();
            document.getElementsByClassName("tgDialog")[0].style.display = "none";
            zen.fadeZenButtonOut();
            zen.enterIntoZenMode();
            
            setTimeout(function(){
                zen.escapeFromZenMode();
                document.getElementsByClassName("tgDialog")[0].style.display = "";
                require("ext/guidedtour/guidedtour").stepForward();
                hlElement.style.visibility = "visible";
                winTourText.show();
                zen.fadeZenButtonOut();
            }, 2000);
        },
        time: 4,
        desc: "",
        skip: true
    }, {
        before: function(){
            //ideConsole.disable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:bar[1]/a:vbox[1]/a:hbox[1]'),
        desc: "This area down here acts just like a command line for your project in the Cloud9 IDE. You can always type 'help' to get a list of the available commands.",
        pos: "top",
        time: 5
    }, {
        before: function() {
            //ideConsole.enable();
            ideConsole.show();
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "After clicking the expand arrows, you'll be able to get to the full console view. Any output from your program&mdash;like console.log() messages or compilation errors&mdash;appears in the Output tab.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            //winRunCfgNew.hide();
            //ideConsole.disable();
            var doc = require("ext/editors/editors").currentEditor.ceEditor.getSession();
            doc.setBreakpoints([1]);
        },
        el: undefined,
        div: "DIV[1]",
        desc: "We're ready to test our code, so we've inserted a breakpoint on this line by clicking in the gutter. Before debugging, though, we'll need to set up a debugging scenario.",
        pos: "right",
        time: 5
    }, {
        before: function(){
            panels.activate(require("ext/runpanel/runpanel"));
            if (!madeDebug) {
                settings.model.setQueryValue('auto/configurations/@debug', true);
            }
            setTimeout(function(){
                lstRunCfg.select(lstRunCfg.$model.queryNode("//config"), null, null, null, true)
            });
        },
        el: "winRunPanel",
        desc: "Here's where the fun begins! After clicking Debug, then Run Configurations, you'll be able to create or modify a debug configuration. Every configuration needs a name and a file to run, but you can also pass arguments.",
        pos: "right",
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').run(true);
            var bar = dockpanel.layout.$getLastBar();
            if(!bar) {
                dockpanel.showBar(dockpanel.getBars("ext/debugger/debugger", "pgDebugNav")[0]);
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "Whoa! A lot of things just happened. First off, the Output tab opened up to show us that our code is running, and currently being debugged.",
        pos: "top",
        time: 4
    }, {
        before: function() {
        },
        el: function(){
            return dockpanel.layout.$getLastBar();;
        },
        desc: "Next, when you start debugging, you'll instantly get a new debugging toolbar.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "pgDebugNav")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                if(!pgDebugNav.parentNode.parentNode.visible)
                    btnRunCommands.dispatchEvent("mousedown",  {});
            }
        },
        el: function(){
            return pgDebugNav;
        },
        desc: "In this toolbar, the usual start, stop, and step buttons are at the top, to help control the flow of the debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgVariable")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                dbgVariable.parentNode.set(dbgVariable)
            }
        },
        el: function(){
            return dbgVariable;
        },
        desc: "In this section you can view variables in the debug state.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgCallStack")[0];
            if(menuId)
                dockpanel.layout.showMenu(menuId.uniqueId);
            dbgCallStack.parentNode.set(dbgCallStack)
        },
        el: function(){
            return dbgCallStack;
        },
        desc: "Here you can see the call stack of the program you are debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            
            dbgCallStack && dbgCallStack.parentNode && dbgCallStack.parentNode.parentNode.hide();
            dbg.continueScript();
            txtConsoleInput.setValue("git status");
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "We indicated to the debugger that we want to continue. At last, the console.log() message printed out. Now, we're going to simulate typing 'git status' in the command line.",
        pos: "top",
        time: 4
    }, {
        before: function(){
            require(["c9/ext/deploy/deploy"], function(deploy) { 
                hasDeploy = true;
                panels.activate(deploy);
            });
        },
        el: "winDeploy",
        desc: "In this panel you can manage(add/remove) your deploy targets for your application, in different services, like Joyent and Heroku.",
        pos: "right",
        notAvailable: !hasDeploy,
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').stop();
            
            if(trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']")) {
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                txtConsoleInput.setValue("rm helloWorld-quideTour.js");
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "As expected, there's been a new file added to git. We're done testing it, and don't want to keep it around, so let's remove it with 'rm helloWorld-quideTour.js'.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            panels.activate(require("ext/tree/tree"));
            var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
            if(demoFile && !deletedFile) {
                deletedFile = true;
                tabEditors.remove(tabEditors.getPage());
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                trFiles.confirmed = true;
                trFiles.remove(demoFile);
                trFiles.confirmed = false;
                require("ext/tree/tree").refresh();
            }
        },
        el: "winFilesViewer",
        desc: "Voila! Notice that the file is gone from your project.",
        pos: "right",
        time: 4
    }]
};

module.exports = ext.register("ext/guidedtour/guidedtour", {
    name: "Guided Tour",
    dev: "Cloud9 IDE, Inc.",
    alone: true,
    type: ext.GENERAL,
    markup: markup,
    skin    : {
        id   : "guidedtour",
        data : skin,
        "media-path" : "/static/ext/guidedtour/images/"
    },
    currentStep: -1,
    currentEl: null,
    nodes: [],

    hook: function() {
        //this.launchGT();
    },
    
    init: function(amlNode) {     
        this.initTour();
        this.tour = jsonTourIde;
        
        this.overlay   = document.createElement("div");
        this.hlElement = document.createElement("div");
        
        this.overlay.setAttribute("style", "display:none;position:fixed;left: 0px;top: 0px;width:100%;height:100%;opacity:0.3;background:#000;opacity:0");
        document.body.appendChild(this.overlay);

        this.hlElement.setAttribute("style", "z-index:9998;display:none;position:absolute;box-shadow:0px 0px 15px #000;");
        document.body.appendChild(this.hlElement);

        winTourGuide.addEventListener("hide", this.shutdown(this.hlElement));
        tourControlsDialog.addEventListener("hide", this.shutdown(this.hlElement));
    },

    launchGT: function(){        
        ext.initExtension(this);
        this.hideMenus();
        madeNewFile = wentToZen = madeDebug = deletedFile = false;
        this.currentStep = -1;
        winTourDesc.setValue(this.tour.initialText);
        winTourGuide.show();
        winTourButtonStart.show();
        winTourButtonClose.show();
        winTourButtonDone.hide();
    },
    
    hideMenus: function(){
        var buttons = dockpanel.getButtons("ext/debugger/debugger");
        if(!buttons)
            return;
            
        for(var i = 0, button; i < buttons.length; i++) {
            button = buttons[i];
            if(!button.showMenu || !button.cache)
                continue;
            
            self[button.cache.submenu].hide();
        }
    },
    
    initTour: function(){
        this.animateui = settings.model.queryValue('general/@animateui');
        settings.model.setQueryValue('general/@animateui', false);
        
        /*ide.addEventListener("loadsettings", function(e){
            _self.animateui = settings.model.queryValue('general/@animateui');
            settings.model.setQueryValue('general/@animateui', false);
        });*/
        
        !self["winFilesViewer"] && panels.activate(require("ext/tree/tree"));

        var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
        if (demoFile && !deletedFile) {
            txtConsoleInput.setValue("rm helloWorld-quideTour.js");
            deletedFile = true;
            require("ext/console/console").commandTextHandler({
                keyCode: 13,
                currentTarget: txtConsoleInput
            });
            trFiles.confirmed = true;
            trFiles.remove(demoFile);
            trFiles.confirmed = false;
            require("ext/tree/tree").refresh();
        }
    },
    
    /**
     * Play controls
     */
    togglePlay: function(){
        if (this.playing) this.pause();
        else this.play();
    },

    play: function(){
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "-28px 3px";
        btnTourPlay.tooltip = "Play";
        this.playing = true;
        this.stepForwardAuto();
    },

    pause: function(){
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "14px 4px";
        btnTourPlay.tooltip = "Pause";
        this.playing = false;
        clearTimeout(this.$timerForward);
    },

    end: function(){
        this.pause();
        this.hlElement.style.opacity = "0";
    },

    startTour: function(){
        var _self = this;
        
        this.currentStep = -1;
        winTourGuide.hide();
        tourControlsDialog.show();
        this.stepForward();
        
        this.overlay.style = 'block';
        
        settings.model.setQueryValue('general/@animateui', false);
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
        
        apf.addEventListener("keyup", _self.keyUpEvent = function(e){
            if(e.keyCode == 39)
                _self.stepForward();
            else if(e.keyCode == 37)
                _self.stepBack();
        });
        
        // remove the modal overlay, but keep it around to block input
        //var modalBackground = document.getElementsByClassName("bk-window-cover");
        //modalBackground[modalBackground.length - 1].style.opacity = "0";
    },

    stepBack: function(){
        this.currentStep--;

        var step = this.tour.steps[this.currentStep];
        
        if(!step)
            return;
        
        if (step.skip !== undefined) { // we're in the zen mode step, go back one more
            this.currentStep--;
            step = this.tour.steps[this.currentStep];
        }

        if (this.currentStep === 0) {
            btnTourStepBack.disable();
            btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px -21px";
        }

        btnTourStepForward.enable();

        this.commonStepOps(step);
    },

    stepForwardAuto: function(){
        var _self = this;
        var timeout = this.currentStep > -1 ? this.tour.steps[this.currentStep].time : 0;

        this.$timerForward = setTimeout(function() {
            _self.stepForward();
            if (_self.tour.steps[_self.currentStep + 1]) 
                _self.stepForwardAuto();
            else {
                _self.end();
                _self.finalStep();
            }
        }, timeout * 1000);
    },

    stepForward: function(){
        this.currentStep++;
        if (!this.tour.steps[this.currentStep]) 
            this.finalStep();
        else {
            if (this.currentStep > 0){
                btnTourStepBack.enable();
                btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px 5px";
            }
            if(this.currentStep > 22) {
                btnTourStepBack.disable();
                btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px -21px";
            }
            var step = this.tour.steps[this.currentStep];
            this.commonStepOps(step);
        }
    },

    finalStep: function() {
        winTourText.close();
        tourControlsDialog.hide();
        this.closeTG();
        this.hlElement.style.display = "none";

        winTourGuide.show();
        winTourDesc.setValue(this.tour.finalText);
        this.currentStep = -1;
        winTourButtonStart.hide();
        winTourButtonClose.hide();
        winTourButtonDone.show();
    },
    
    // These are common o02022perations we do for step
    // forwards and back, so we DRY
    commonStepOps: function(step){
        function getCurrentEl(){
            if (step.el !== undefined) {
                if(typeof step.el == "string")
                    step.el = self[step.el];
                if(typeof step.el == "function")
                    step.el = step.el();
                _self.currentEl = step.el;
            }
            // AL of these fix issues with elements not being available when this plugin loads
            else if (step.div == "ceEditor"){
                _self.currentEl = ceEditor;
            }
            else if (step.div == "expandedDbg") {
                _self.currentEl = expandedDbg;
            }
            else if (step.div !== undefined) {
                if (step.node !== undefined) {
                    _self.currentEl = (apf.XPath || apf.runXpath() || apf.XPath).selectNodes(step.div, apf.document.selectSingleNode(step.node).$ext);
                }
                else {
                    _self.currentEl = (apf.XPath || apf.runXpath() || apf.XPath).selectNodes(step.div, ceEditor.$ext);
                }
            }
            else {
                // fixes issue with no zen button existing
                _self.currentEl = btnZenFullscreen;
            }
        }
        var _self = this;
        if(step.notAvailable) {
            this.stepForward();
            return;
        }
        if (step.before) 
            step.before();
        
        setTimeout(function(){   
            getCurrentEl();
            if(!_self.currentEl)
                return;
                
            _self.highlightElement();
    
            textTourDesc.setValue(step.desc);
    
            // Reset Position
            winTourText.setAttribute("bottom", "");
            winTourText.setAttribute("top", "");
            winTourText.setAttribute("left", "");
            winTourText.setAttribute("right", "");
    
            var pos = _self.getElementPosition(_self.currentEl);
            
            if(!pos)
                return;
            
            winTourText.setAttribute("class", step.pos);
        
            _self.setPositions(step.pos, pos, winTourText);
            
            if(step.pos)
                winTourText.show();
        });
    },

    setPositions: function(position, posArray, div) {
        if (position == "top"){
            div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 25);
            div.setAttribute("left", (posArray[0] + (posArray[2] / 2)) - (div.getWidth() / 2));
        }
        else if (position == "right"){
            div.setAttribute("left", posArray[0] + posArray[2] + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3] / 2)) - (div.getHeight() / 2));
        }
        else if (position == "bottom"){
            div.setAttribute("top", posArray[3] + 50);
            div.setAttribute("right", (posArray[0] + (posArray[2] / 2)) - (div.getWidth() / 2));
        }
        else if (position == "left"){
            div.setAttribute("right", (window.innerWidth - posArray[0]) + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3] / 2)) - (div.getHeight() / 2));
        }

        return div;
    },

    /**
     * Element methods
     */
    highlightElement: function(){        
        //this.currentEl.addEventListener("resize", this.$celResize = function() {
        //_self.resizeHighlightedEl();
        //});
        this.resizeHighlightedEl();
        
        var hlZindex = this.hlElement.style.zIndex;
        winTourText.$ext.style.zIndex = hlZindex + 1;
        tourControlsDialog.$ext.style.zIndex = hlZindex + 2;
    },

    resizeHighlightedEl: function() {
        var pos = this.getElementPosition(this.currentEl);
        this.hlElement.style.left = pos[0] + "px";
        this.hlElement.style.top = pos[1] + "px";
        this.hlElement.style.width = (pos[2] - 4) + "px";
        this.hlElement.style.height = (pos[3] - 4) + "px";
        this.hlElement.style.display = "block";
        this.hlElement.style.border = "solid 2px #bee82c";

        if (this.currentEl.$ext) {
            var zIndex;
            var pNode = this.currentEl;
            if (pNode) {
                while (pNode && pNode.tagName != "body" && (!zIndex || zIndex <= 9998)) {
                    zIndex = pNode.$ext && pNode.$ext.style && parseInt(pNode.$ext.style.zIndex || 9997) + 1;
                    pNode = pNode.parentNode;
                }
            }
            else {
                zIndex = 9998;
            }
        }
        else {
            zIndex = this.currentEl.style && parseInt(this.currentEl.style.zIndex || 9997) + 1;
        }

        this.hlElement.style.zIndex = zIndex;
    },

    getElementPosition: function(el){
        if(!el)
            return [0, 0, 0, 0];
            
        var elExt = el.$ext;
        if (elExt === undefined) {
            var pos = apf.getAbsolutePosition(el[0]);
            return [pos[0], pos[1], el[0].offsetWidth, el[0].offsetHeight];
        }
        else {
            var pos = apf.getAbsolutePosition(elExt);
            var w = el.getWidth();
            var h = el.getHeight();
            return [pos[0], pos[1], w, h];
        }
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });
    },

    closeTG: function() {
        var _self = this;
        winTourGuide.hide();
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
    },

    shutdown: function(hlElement) {
        var _self = this;
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
        return function() {
            require("ext/guidedtour/guidedtour").pause(); // stop auto-moving
            winTourText.hide();
            tourControlsDialog.hide();
            zen.fadeZenButtonOut(); // in case it's still showing
            (hlElement || _self.hlElement).style.display = "none";
            _self.currentStep = -1;
            _self.overlay.style = 'none';
            
            //set anim settings to what it was before the tour
            settings.model.setQueryValue('general/@animateui', _self.animateui);
        };        
    },

    disable: function() {
        this.nodes.each(function(item) {
            item.disable();
        });
    },

    destroy: function() {
        this.nodes.each(function(item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});