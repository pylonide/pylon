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

var jsonTourIde = {
    initialText : "This guided tour introduces you to some of the ways Cloud 9 IDE makes it easy for you to program faster and smarter.\n\nClick the play button below to be taken on the tour automatically. Or, you can click the forward and backward buttons to navigate on your own.",
    finalText : "Well, that's everything! Still have questions? Head on over to <a href=\"http://support.cloud9ide.com/forums\" target=\"_blank\">our documentation site</a>.",
    steps : [
        {
            el : navbar,
            desc : "This is the project bar. It controls the behavior of the IDE, as well as the presentation of your code.",
            pos : "right",
            time : 5
        },
        {
            before : function() {
              // require("ext/tree/tree").enable();
            },
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[1]'),
            desc : "This button shows and hides your project files.",
            pos : "right",
            time : 5
        },
        {
           before : function() {
                //require("ext/openfiles/openfiles").enable();
            },
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[2]'),
            desc : "This button shows and hides your open files in a list view.",
            pos : "right",
            time : 5
        },
        {
             before : function() {
               //require("ext/settings/settings").enable();
            },
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[3]'),
            desc : "You can change the behavior of the editor, manipulate the code beautifier, and change the indentation and width of the editor, among other options.",
            pos : "right",
            time : 7
        },
        {
            before : function() {
               //require("ext/tree/tree").enable();
            },
            el : winFilesViewer,
            desc : "All your project files are listed here. You can rename and delete files, as well as drag in new ones from your computer. You can also right-click to see context options.",
            pos : "right",
            time : 6
        },
        { 
            el : (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabEditors.$ext),
            desc : "There's a tabbed arrangement of all your active files here. You can rearrange the tabs however you like and swap through them with keyboard shortcuts. You can also preview XML and HTML files.",
            pos : "bottom",
            time : 5
        },
        {
            el : splitterPanelLeft,
            desc : "The gutter can do more than just show line numbers. It also detects and displays warnings and errors in your code. If you're debugging an application, you can also set your breakpoints here.",
            pos : "right",
            time : 5
        },
       /* { There's a bug here...
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[4]/a:hbox[1]/bar[1]'),
            desc : "These buttons control all aspects of the debugger. You can identify breakpoints, view the call stack, and inspect the values of variables.",
            pos : "left",
            time : 5
        },*/
        {
            before : function() {
                require("ext/console/console").disable();
            },
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:bar[1]/a:vbox[1]/a:hbox[1]'),
            desc : "This area down here acts just like a command line for your project in the Cloud9 IDE. You can always type 'help' to get a list of the available commands.",
            pos : "top",
            time : 6
        },
        {
            before : function() {
                require("ext/console/console").enable();
            },
            el : txtConsoleInput,
            desc : "After clicking the expand arrows, you'll be able to get to the full console view. Any output from your program&mdash;like console.log() messages or compilation errors&mdash;appears here.",
            pos : "top",
            time : 6
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
    overlay : document.createElement("div"),
    hlElement : document.createElement("div"),
    nodes : [],

    init : function(amlNode){
        this.overlay.setAttribute("style",
            "z-index:998;display:none;position:absolute;width:100%;height:100%;opacity:0.3;background:#000;");
        document.body.appendChild(this.overlay);
        
        this.hlElement.setAttribute("style",
            "z-index:999999;display:none;position:absolute;box-shadow:0px 0px 15px #000;");
        document.body.appendChild(this.hlElement);
        
        winTourGuide.addEventListener("hide", this.shutdown(this.hlElement)); 
        tourControlsDialog.addEventListener("hide", this.shutdown(this.hlElement)); 
    },
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.appendChild(new apf.item({
                caption : "Take a Guided Tour",
                onclick : function(){
                    ext.initExtension(_self);
                    require("ext/guidedtour/guidedtour").launchGT();
                    
                },
                onclose : function(e){
                        _self.close(e.page);
                    }
            }))
        );
    },
    
    launchGT : function() {
        ext.initExtension(this);
        
        this.currentStep = -1;
        winTourDesc.setValue(this.tour.initialText);
        winTourGuide.show();
        winTourButtonStart.show();
        winTourButtonClose.hide();
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
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "-22px 5px";
        btnTourPlay.tooltip = "Play";
        this.playing = true;
        this.stepForwardAuto();
    },

    pause : function() {
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "20px 5px";
        btnTourPlay.tooltip = "Pause";
        this.playing = false;
        clearTimeout(this.$timerForward);
    },

    end : function() {
        this.pause();
        this.hlElement.style.display = "none";
    },

    startTour : function() {
        this.currentStep = -1;
        winTourGuide.hide();
        tourControlsDialog.show();
        this.stepForward();
    },
    
    stepBack : function() {
        this.currentStep--;
        if (this.currentStep === 0) {
            btnTourStepBack.disable();
            btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "25px -20px";
        }

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
        if (!this.tour.steps[this.currentStep])
            this.finalStep();
        else
        {
            if (this.currentStep > 0) {
                btnTourStepBack.enable();
                btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "25px 5px";
            }
    
            var step = this.tour.steps[this.currentStep];
            this.commonStepOps(step);
        }
    },
    
    finalStep : function() {
        require("ext/console/console").disable();
        winTourText.close();
        tourControlsDialog.hide();
        this.hlElement.style.display = "none";
        
        winTourGuide.show();
        winTourDesc.setValue(this.tour.finalText);
        this.currentStep = -1;
        winTourButtonStart.hide();
        winTourButtonClose.show();
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

        var pos = this.getElementPosition(step.el);
        winTourText.setAttribute("class", step.pos);
        
        this.setPositions(step.pos, pos, winTourText);     

        winTourText.show();
    },

    setPositions : function(position, posArray, div)
    {
        if (position == "top")
        {
             div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 25);
             div.setAttribute("left", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "right")
        {
            div.setAttribute("left", posArray[0] + posArray[2] + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3]/2)) - (div.getHeight()/2));            
        }
        else if (position == "bottom")
        {
             div.setAttribute("top", posArray[3] + 50);
            div.setAttribute("right", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "left")
        {
            div.setAttribute("bottom", posArray[3] - 125);
            div.setAttribute("right", (posArray[2]) - 25);
        }  
        
        return div;
    },
    
    /**
     * Element methods
     */
    highlightElement : function(el) {
        //if (this.currentEl)
        //    this.currentEl.removeEventListener("resize", this.$celResize);

        this.currentEl = el;
        
        var _self = this;
        //this.currentEl.addEventListener("resize", this.$celResize = function() {
            //_self.resizeHighlightedEl();
        //});

        this.resizeHighlightedEl();
    },

    resizeHighlightedEl : function() {
        var pos = this.getElementPosition(this.currentEl);
        this.hlElement.style.left = pos[0] + "px";
        this.hlElement.style.top = pos[1] + "px";
        this.hlElement.style.width = pos[2] + "px";
        this.hlElement.style.height = pos[3] + "px";
        this.hlElement.style.display = "block";
        this.hlElement.style.border = "solid 2px #bee82c";
    },
    
    getElementPosition : function(el) {
        var elExt = el.$ext;
        if (elExt === undefined)
        {
            var pos = apf.getAbsolutePosition(el[0]);
            return [pos[0], pos[1], el[0].offsetWidth - 10, el[0].offsetHeight];
        }
        else
        {
            var pos = apf.getAbsolutePosition(elExt);
            var w = el.getWidth();
            var h = el.getHeight();
            return [ pos[0], pos[1], w, h ];
        }
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    closeTG : function() {
        winTourGuide.hide();    
    },
    
    shutdown : function(hlElement) {
        return function() {
            require("ext/guidedtour/guidedtour").pause();
            winTourText.hide();
            tourControlsDialog.hide();
            hlElement.style.display = "none";
            this.currentStep = -1;
        };
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