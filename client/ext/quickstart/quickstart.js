/**
 * Identifies some "hot spots" in the IDE that users should be aware of
 * 
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var skin = require("text!ext/quickstart/skin.xml");
var markup = require("text!ext/quickstart/quickstart.xml");

var jsonQuickStart = {
    identifiers: [
        {
            el : navbar,
            name : "qsProjectBar",
            pos: "right"
        },
        {
            el : logobar,
            name : "qsMenuBar",
            pos: "bottom"
        },
       {
            el : tabEditors,
            name : "qsToolbar",
            pos: "left"
        },
        {
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:bar[1]/a:vbox[1]/a:hbox[1]'),
            name : "qsCLI",
            pos: "top"
        }
    ]
};

// require("ext/settings/settings").model.queryValue("auto/help/@show") == "false"
//ide.addEventListener("loadsettings", function(){

module.exports = ext.register("ext/quickstart/quickstart", {
    name     : "Quick Start",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : skin,
    overlay : document.createElement("div"),
    nodes : [],

    init : function(amlNode){   
   
          this.overlay.setAttribute("style",
          "z-index:9016;display:none;position:absolute;width:100%;height:100%;opacity:0.3;background:#000;");
         document.body.appendChild(this.overlay);

    },
    
    hook : function(){
        var _self = this;

        ide.addEventListener("loadsettings", function(e) {
        var showQS = require("ext/settings/settings").model.queryValue("auto/help/@show");
             if (showQS == "true")
             {
                 ext.initExtension(_self);
                 require("ext/quickstart/quickstart").launchQS();
             }
                 
         }); 
         
        this.nodes.push(
            ide.mnuFile.appendChild(new apf.item({
                caption : "Quick Start",
                onclick : function(){
                    ext.initExtension(_self);
                    require("ext/quickstart/quickstart").launchQS();
                },
                onclose : function(e){
                        _self.close(e.page);
                    }
            }))
        );
        

    },
    
    launchQS : function()
    {
         debugPanelCompact.show();
                    quickStartDialog.show();
                    this.overlay.style.display = "block";
                    this.arrangeQSImages();
    },
    
    /**
    * Arrange the images pointing out the locations
    */
    arrangeQSImages : function()
    {
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++)
        {
            var divToId = require("ext/guidedtour/guidedtour").getElementPosition(jsonQuickStart.identifiers[i].el);
            var position = jsonQuickStart.identifiers[i].pos;
            var imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            
            imgDiv.setAttribute("bottom", "");
            imgDiv.setAttribute("top", "");
            imgDiv.setAttribute("left", "");
            imgDiv.setAttribute("right", "");
        
            this.setPositions(position, divToId, imgDiv);     
            
            imgDiv.show();
        }
    },
    
    setPositions : function(position, posArray, div)
    {
        if (position == "top")
        {
             div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 100);
             div.setAttribute("left", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "right")
        {
            div.setAttribute("left", posArray[0] + posArray[2] + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3]/2)) - (div.getHeight()/2));            
        }
        else if (position == "bottom")
        {
            div.setAttribute("top", posArray[3]);
            div.setAttribute("right", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "left")
        {
            div.setAttribute("top", 125);
            div.setAttribute("right", 25);
        }  
        
        return div;
    },
    
    closeStart : function() {
         debugPanelCompact.hide();
        quickStartDialog.hide();
        this.overlay.style.display = "none";
        
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++)
        {
            var imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            
            imgDiv.hide();
        }
    },
    
    shutdownQSStartGT : function() {
        this.closeStart();
        require('ext/guidedtour/guidedtour').launchGT();
    }
});

});