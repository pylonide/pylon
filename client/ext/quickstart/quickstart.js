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
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Project Files"]'),
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
            pos: "left",
            visible: function(){
                return hboxDockPanel.childNodes[0];
            }
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
    skin    : {
        id   : "quickstart",
        data : skin,
        "media-path" : "/static/ext/quickstart/images/"
    },
    nodes : [],

    init : function(amlNode){   
        this.overlay = document.createElement("div");
        this.overlay.setAttribute("style",
            "z-index:9016;display:none;position:fixed;left: 0px;top: 0px;width:100%;height:100%;opacity:0.3;background:#000;");
        document.body.appendChild(this.overlay);
    },
    
    hook : function(){
        var _self = this;
                
        ide.addEventListener("loadsettings", function(e) {
            var showQS = require("ext/settings/settings").model.queryValue("auto/help/@show");
            if(showQS === "" || showQS == "true") {
                if(apf.getcookie("show-quick-start") == "false") {
                    require("ext/settings/settings").model.setQueryValue("auto/help/@show", "false");   
                }
                else {
                    require("ext/settings/settings").model.setQueryValue("auto/help/@show", "true");
                    apf.xmldb.setAttribute(require("ext/settings/settings").model.queryNode("auto/help"), "show", "true");
                    _self.launchQS();
                }
             }
         });
    },
    
    launchQS : function() {
        var _self = this;
        ext.initExtension(this);
        this.hideMenus();
         //debugPanelCompact.show();
        setTimeout(function(){
            _self.overlay.style.display = "block";
            _self.arrangeQSImages();
            quickStartDialog.show();
        })
    },
    
    setState: function(state){
        apf.setcookie("show-quick-start", state, new Date().getTime() + 1000*3600*24*365*2);
    },
    
    hideMenus: function(){
        var buttons = require("ext/dockpanel/dockpanel").getButtons("ext/debugger/debugger");
        if(!buttons)
            return;
        for(var i = 0, button; i < buttons.length; i++) {
            button = buttons[i];
            if(!button.showMenu || !button.cache)
                continue;
            
            self[button.cache.submenu].hide();
        }
    },
    
    /**
    * Arrange the images pointing out the locations
    */
    arrangeQSImages : function() {
        var divToId, position, imgDiv;
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++) {
            if(jsonQuickStart.identifiers[i].visible && !jsonQuickStart.identifiers[i].visible())
                continue;            
            
            divToId = require("ext/guidedtour/guidedtour").getElementPosition(jsonQuickStart.identifiers[i].el);
            position = jsonQuickStart.identifiers[i].pos;
            imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            
            imgDiv.setAttribute("bottom", "");
            imgDiv.setAttribute("top", "");
            imgDiv.setAttribute("left", "");
            imgDiv.setAttribute("right", "");
        
            this.setPositions(position, divToId, imgDiv);     
            
            imgDiv.show();
        }
    },
    
    setPositions : function(position, posArray, div) {
        if (position == "top") {
             div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 100);
             div.setAttribute("left", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "right"){
            div.setAttribute("left", posArray[0] + posArray[2] - 2);
            div.setAttribute("top", (posArray[1] + (posArray[3]/2)) - (div.getHeight()/2));            
        }
        else if (position == "bottom"){
            div.setAttribute("top", posArray[3]);
            div.setAttribute("right", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "left"){
            div.setAttribute("top", 125);
            div.setAttribute("right", 0);
        }  
        
        return div;
    },
    
    closeStart : function() {
        //debugPanelCompact.hide();
        quickStartDialog.hide();
        this.overlay.style.display = "none";
        
        var imgDiv;
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++) {
            imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            imgDiv.hide();
        }
    },
    
    shutdownQSStartGT : function() {
        this.closeStart();
        require('ext/guidedtour/guidedtour').launchGT();
    }
});

});