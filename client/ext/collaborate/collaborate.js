/**
 * Collaboration extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide    = require("core/ide");
var ext    = require("core/ext");
var util   = require("core/util");
var dock   = require("ext/dockpanel/dockpanel");
var markup = require("text!ext/collaborate/collaborate.xml");

return ext.register("ext/collaborate/collaborate", {
    name            : "Collaboration",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    commands        : {},
    hotitems        : {},
    
    nodes : [],

    openChat : function(listItem) {

        var chatUserID = listItem.getAttribute("user_id");
        var chatIdent  = this.name + chatUserID;
        
        // Check to see if window exists already. If so, select it
        if(dock.windowExists(chatIdent, true)) {
            return false;   
        }
        
        tempChatWindow = new apf.modalwindow({
            htmlNode   : document.body,
            id         : "chatUser" + chatUserID,
            title      : listItem.getAttribute("user_name"),
            visible    : false,
            right      : "42",
            width      : "250",
            height     : "350",
            modal      : false,
            draggable  : false,
            skin       : "todowin",
            childNodes : [
                new apf.toolbar({
                  childNodes : [
                    new apf.bar({
                      height     : 36,
                      childNodes : [
                        new apf.hbox({
                          edge : 5
                        })
                      ]
                    })
                  ]
                }),
                new apf.panel({
                    skin    : "todopanel",
                    visible : "true",
                    flex    : "1",
                    childNodes : [
                        new apf.hbox({
                            height     : "230",
                            childNodes : [
                                new apf.text({
                                    id         : "txtChat" + chatUserID,
                                    margin     : "3 0 0 0",
                                    height     : "*",
                                    flex       : "1",
                                    scrolldown : "true",
                                    textselect : "true",
                                    focussable : "true",
                                    'class'    : "chat_text"
                                }),
                                
                                new apf.scrollbar({
                                    'for'     : "txtChat" + chatUserID,
                                    height    : "*",
                                    margin    : "0",
                                    skin      : "sbcollaborators",
                                    width     : "9"
                                })
                            ]
                        }),
                        new apf.hbox({
                            height     : "54",
                            edge       : "8 7 7 7",
                            'class'    : "hboxchatinput",
                            childNodes : [
                                new apf.textbox({
                                    flex   : "1",
                                    height : "37"
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        dock.registerWindow(tempChatWindow, {
                dockPosition: "bottom",
                backgroundImage: "/static/style/images/collaboration_panel_sprite.png",
                defaultState: { x: 0, y: -360 },
                activeState: { x: 0, y: -400 }
            },
            
            chatIdent, // Window identifer
            true    // Force this chat window to show right away
        );
    },
    
    init : function(amlNode){
        this.panel = winCollaborators;
        dock.registerWindow(winCollaborators, {
            dockPosition: "top",
            backgroundImage: "/static/style/images/collaboration_panel_sprite.png",
            defaultState: { x: 0, y: -243 },
            activeState: { x: 0, y: -281 }
        });
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
        dock.unregister(this);
        this.winTodo.destroy(true, true);
    }
});

    }
);