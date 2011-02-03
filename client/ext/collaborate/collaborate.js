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

        tempChatWindow = new apf.modalwindow({
            htmlNode   : document.body,
            id         : "chatUser" + listItem.getAttribute("user_id"),
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
                    childNodes : [
                        new apf.panel({
                            skin    : "todopanel",
                            'class' : "top_border"
                        })
                    ]
                }),
                new apf.toolbar({
                    'class' : "top_border",
                    childNodes : [
                        new apf.bar({
                            height : 27,
                            childNodes : [
                                new apf.button({
                                    icon    : "debugger/monitorexpression_tsk{this.disabled ? '_disabled' : ''}.gif",
                                    left    : 0
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