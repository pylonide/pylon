/**
 * Guides the user through features of the IDE
 * 
 * @author Matt Pardee
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var skin = require("text!ext/guidedtour/skin.xml");
var markup = require("text!ext/guidedtour/guidedtour.xml");

var jsonTourIde = {
    initialText : "Click Play to start the tour of the IDE",
    steps : [
        {
            el : navbar,
            desc : "This is all about your workflow",
            pos : "right",
            time : 5
        },
        {
            el : trFiles,
            desc : "All your project files are listed here. Right-click to see context options.",
            pos : "right",
            time : 6
        },
        {
            el : txtConsoleInput,
            desc : "Treat this like your desktop terminal input. Enter 'help' for more info.",
            pos : "top",
            time : 6
        },
        {
            before : function() {
                require("ext/console/console").enable();
            },
            el : tabConsole,
            desc : "Output is displayed here.",
            pos : "top",
            time : 7
        }
    ]
};

module.exports = ext.register("ext/guidedtour/guidedtour", {
    name     : "Guided Tour",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    tour     : jsonTourIde,
    skin     : skin,
    currentStep : -1,
    currentEl   : null,

    nodes : [],

    init : function(amlNode){
        this.overlay = document.createElement("div");
        this.overlay.setAttribute("style",
            "z-index:999998;display:none;position:absolute;width:100%;height:100%;opacity:0.6;background:#000;");
        document.body.appendChild(this.overlay);

        this.hlElement = document.createElement("div");
        this.hlElement.setAttribute("style",
            "z-index:999999;display:none;position:absolute;box-shadow:0px 0px 15px #000;");
        document.body.appendChild(this.hlElement);
        
        var _self = this;
        winTourGuide.onclose = function() {
            _self.end();
        };
    },

    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.appendChild(new apf.item({
                caption : "Tour Guide",
                onclick : function(){
                    ext.initExtension(_self);
                    winTourGuide.show();
                }
            }))
        );
    },

    /**
     * Play controls
     */
    togglePlay : function() {
        if (this.playing)
            this.pause();
        else
            this.play();
    },

    play : function() {
        btnTourPlay.setCaption("| |");
        this.playing = true;
        this.stepForwardAuto();
    },

    pause : function() {
        btnTourPlay.setCaption("O");
        this.playing = false;
        clearTimeout(this.$timerForward);
    },

    end : function() {
        this.pause();
        this.hlElement.style.display = "none";
    },

    stepBack : function() {
        this.currentStep--;
        if (this.currentStep === 0)
            btnTourStepBack.disable();

        btnTourStepForward.enable();
        var step = this.tour.steps[this.currentStep];
        this.commonStepOps(step);
    },

    stepForwardAuto : function() {
        var _self = this;
        var timeout = this.currentStep > -1 ? 
            this.tour.steps[this.currentStep].time : 0;

        this.$timerForward = setTimeout(function() {
            _self.stepForward();
            if (_self.tour.steps[_self.currentStep+1])
                _self.stepForwardAuto();
            else
                _self.end();
        }, timeout * 1000);
    },

    stepForward : function() {
        this.currentStep++;
        if (!this.tour.steps[this.currentStep+1])
            btnTourStepForward.disable();

        if (this.currentStep > 0)
            btnTourStepBack.enable();

        var step = this.tour.steps[this.currentStep];
        this.commonStepOps(step);
    },

    // These are common operations we do for step
    // forwards and back, so we DRY
    commonStepOps : function(step) {
        if (step.before)
            step.before();
        this.highlightElement(step.el);

        textTourDesc.setValue(step.desc);

        // Reset Position
        winTourText.setAttribute("bottom", "");
        winTourText.setAttribute("top", "");
        winTourText.setAttribute("left", "");
        winTourText.setAttribute("right", "");

        var pos = this.getElementPosition(this.currentEl);
        winTourText.setAttribute("class", step.pos);
        if (step.pos == "right") {
            winTourText.setAttribute("left", pos[0] + pos[2] + 25);
            winTourText.setAttribute("top", (pos[1] + (pos[3]/2)) - (winTourText.getHeight()/2));
        }

        else if (step.pos == "top") {
            winTourText.setAttribute("bottom", (window.innerHeight - pos[1]) + 25);
            winTourText.setAttribute("left", (pos[0] + (pos[2]/2)) - (winTourText.getWidth()/2));
        }

        winTourText.show();
    },

    /**
     * Element methods
     */
    highlightElement : function(el) {
        if (this.currentEl)
            this.currentEl.removeEventListener("resize", this.$celResize);

        this.currentEl = el;

        var _self = this;
        this.currentEl.addEventListener("resize", this.$celResize = function() {
            //_self.resizeHighlightedEl();
        });

        //this.resizeHighlightedEl();
    },

    resizeHighlightedEl : function() {
        var pos = this.getElementPosition(this.currentEl);
        this.hlElement.style.left = pos[0] + "px";
        this.hlElement.style.top = pos[1] + "px";
        this.hlElement.style.width = pos[2] + "px";
        this.hlElement.style.height = pos[3] + "px";
        this.hlElement.style.display = "block";
    },

    getElementPosition : function(el) {
        var pos = apf.getAbsolutePosition(el.$ext);
        var w = el.getWidth();
        var h = el.getHeight();
        return [ pos[0], pos[1], w, h ];
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});