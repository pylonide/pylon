/**
 * Guides the user through features of the IDE
 * 
 * @author Matt Pardee
 * @contributor Garen J. Torikian
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
var strTour = require("text!ext/guidedtour/tour.js");
var helloWorldScript = require("text!ext/guidedtour/hello-world-script.txt");

var save, hasDeploy = false;
var madeNewFile = false;
var wentToZen = false;
var madeDebug = false;
var deletedFile = false;

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
        eval(strTour);
        
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
        //this.animateui = settings.model.queryValue('general/@animateui');
        //settings.model.setQueryValue('general/@animateui', false);
        
        require("ext/sidebar/sidebar").animateToFullWidth();
        //ext.initExtension();
        require("ext/console/console").showInput();
        /*ide.addEventListener("settings.load", function(e){
            _self.animateui = settings.model.queryValue('general/@animateui');
            settings.model.setQueryValue('general/@animateui', false);
        });*/
        
        !self["winFilesViewer"] && panels.activate(require("ext/tree/tree"));

        var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
        if (demoFile && !deletedFile && false) {
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
    
    // These are common operations we do for each step
    // forwards and back, so we DRY
    commonStepOps: function(step){
        function getCurrentEl(){
            if (step.el !== undefined) {
                if(typeof step.el == "string")
                    step.el = self[step.el];
                else if (typeof step.el == "function")
                    step.el = step.el();
                _self.currentEl = step.el;
            }
            // All of these fix issues with elements not being available when this plugin loads
            else if (step.div == "ceEditor"){
                _self.currentEl = ceEditor;
            }
            else if (step.div == "ceEditorGutter") {
                _self.currentEl = (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[2]/DIV[1]/DIV[2]', ceEditor.$ext) 
            }
            else if (step.div == "expandedDbg") {
                _self.currentEl = expandedDbg;
            }
            else if (step.div == "barIdeStatus") {
                _self.currentEl = barIdeStatus;
            }
            else if (step.div !== undefined) {
                if (step.div.indexOf("navbar") >= 0) {
                    _self.currentEl = eval(step.div);
                }
                else if (step.node !== undefined) {
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
        }, 200);
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
            if (el.parentNode !== undefined)
                elExt = el.parentNode;
            else
                elExt = el[0];
                
            var pos = apf.getAbsolutePosition(elExt);
            return [pos[0], pos[1], elExt.offsetWidth, elExt.offsetHeight];
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
