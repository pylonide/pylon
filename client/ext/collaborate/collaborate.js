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
    
    // Array of objects for holding user information
    chatUsers: [],

    openChat : function(listItem) {

        var chatUserID = listItem.getAttribute("user_id");
        var chatIdent  = this.name + chatUserID;
        
        // Check to see if window exists already. If so, select it (2nd arg)
        if(dock.windowExists(chatIdent, true)) {
            return false;   
        }

        tempChatWindow = new apf.modalwindow({
            htmlNode   : document.body,
            id         : "chatUser" + chatUserID,
            onhide     : "require('ext/collaborate/collaborate').onChatHide("
                            + chatUserID + ")",
            onshow     : "require('ext/collaborate/collaborate').onChatShow("
                            + chatUserID + ")",
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
                    height  : "5"
                }),
                new apf.panel({
                    skin    : "todopanel",
                    visible : "true",
                    flex    : "1",
                    childNodes : [
                        new apf.hbox({
                            height     : "273",
                            edge       : "3 0 5 7",
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
                                    id        : "sbChat" + chatUserID,
                                    height    : "*",
                                    margin    : "0",
                                    skin      : "sbcollaborators",
                                    width     : "9"
                                })
                            ]
                        }),
                        new apf.hbox({
                            height     : "41",
                            edge       : "8 7 7 7",
                            'class'    : "hboxchatinput",
                            childNodes : [
                                new apf.textarea({
                                    flex      : "1",
                                    height    : "24"
                                })
                            ]
                        })
                    ]
                })
            ]
        });

        // Add new chat to our chatUsers object
        this.chatUsers[chatUserID] = {
            win           : eval("chatUser" + chatUserID),
            textOutput    : tempChatWindow.selectSingleNode("panel/hbox[1]/text"),
            textInput     : tempChatWindow.selectSingleNode("panel/hbox[2]/textarea"),
            sbChat        : tempChatWindow.selectSingleNode("panel/hbox[1]/scrollbar"),
            
            sbPos         : 0,

            messages      : [],
            msgFirstDate  : -1,
            msgLastFromMe : false
        };
        
        var _self = this;

        this.chatUsers[chatUserID].textOutput.setValue(
                '<div class="chat_history_overview">\
                <img src="/static/style/images/chat_history.png" />\
                1 Day - 1 Week - 2 Weeks - 1 Month\
               - 3 Months - 6 Months - 1 year - All</div>'
        );

        dock.registerWindow(tempChatWindow, {
                dockPosition: "bottom",
                backgroundImage: "/static/style/images/collaboration_panel_sprite.png",
                defaultState: { x: 0, y: -360 },
                activeState: { x: 0, y: -400 }
            },
            
            chatIdent, // Window identifer
            true    // Force this chat window to show right away
        );
        
        this.chatUsers[chatUserID].textInput.onkeydown = function(event) {
            if(event.keyCode == 13) {
                event.preventDefault();

                var chatInput = event.currentTarget.getValue();
                if(chatInput != "") {
                    _self.appendToChatWin(chatUserID, 'chatmessage',
                                            {
                                                message: chatInput,
                                                fromUserID: -1
                                            }
                                        );
                    _self.chatUsers[chatUserID].sbChat.setPosition(1);
                    
                    // Reset heights of elements if they have been modified
                    if(this.getHeight() > 24) {
                        this.setHeight(24);
                        _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[1]").setHeight(273);
                        _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[2]").setHeight(41);
                    }
                }
                
                event.currentTarget.clear();
                return false;
            }
        };
        
        this.chatUsers[chatUserID].textInput.onkeyup = function(event) {
            
            // For every keypress besides [enter] and [tab], we will process
            // the height of the input area to see if we should expand its 
            // height, to a limit
            
            if(event.keyCode != 9 && event.keyCode != 13){
                if(event.htmlEvent) {
                    if(event.htmlEvent.target.clientHeight < 
                            event.htmlEvent.target.scrollHeight) {
                        if(this.getHeight() < 65) {
                            this.setHeight(this.getHeight() + 15);
                            
                            _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[1]").setHeight(
                                _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[1]").getHeight()
                                    - 15
                            );
                            
                            _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[2]").setHeight(
                                _self.chatUsers[chatUserID].win.selectSingleNode("panel/hbox[2]").getHeight()
                                    + 15
                            );
                        }
                    }
                }
            }
        };
        
        this.chatUsers[chatUserID].textInput.focus();
    },
    
    closeChat: function(ev, anchorEl){
        ev.preventDefault();
    },
    
    /**
     * Get the scrollbar position when the window hides so we can reset it
     * when it is re-shown. For WebKit-based browsers.
     */
    onChatHide: function(userID){
        if(apf.isWebkit) {
            this.chatUsers[userID].sbPos = 
                this.chatUsers[userID].sbChat.getPosition();
        }
    },
    
    onChatShow: function(userID){
        if(apf.isWebkit) {
            this.chatUsers[userID].sbChat.setPosition(
                this.chatUsers[userID].sbPos
            );
        }
        
        this.chatUsers[userID].textInput.focus();
    },

    appendToChatWin: function(userID, type, messageDetails){

        messageDetails.timestamp = new Date();

        switch(type){
            case 'chatmessage':
                var outStr = '<div class="chat_message_block';
                                
                // Compare this message with the last message;
                // If there is more than 5 minutes difference and the message
                // was from the same user, then place a timestamp break
                
                var bTimeStampOut = true;
                var bOutputUser = true;
                
                var numMessages = this.chatUsers[userID].messages.length;
                
                if(numMessages > 0) {
                    if(messageDetails.fromUserID == 
                            this.chatUsers[userID].messages[numMessages - 1].fromUserID) {

                        tsDiff = messageDetails.timestamp - 
                                    this.chatUsers[userID].messages[numMessages-1].timestamp;
                        if(tsDiff > 300000) {
                            
                            outStr += '"><div class="chat_header">';
                            
                            // Last message was over 5 minutes ago, append
                            // timestamp divider
                            outStr += '<div class="timestamp_divider"></div>\
                                 <span class="chat_msg_timestamp cmt_divider">'
                                 + '12:02' + '</span>';
                            bTimeStampOut = false;
                        }
                        
                        else {
                            outStr += ' same_user"><div class="chat_header">';
                        }
                        
                        bOutputUser = false;
                    }
                }
                
                // Message not from same user, output name
                if(bOutputUser == true) {
                    outStr += '"><div class="chat_header">';
                    outStr += '<span class="chat_msg_name"';
                    
                    if(messageDetails.fromUserID == -1) {
                        outStr += ' style="color: #ababab">You';
                    }

                    // Look up name from collaborator list
                    else {
                        
                    }
                    
                    outStr += '</span>';
                    
                    if(bTimeStampOut) {
                        outStr += '</span><span class="chat_msg_timestamp">'
                                   +  '12:01 AM</span>';
                    }
                }

                outStr += '</div><div class="chat_message">'
                              + messageDetails.message + '</div></div>';
                
                this.chatUsers[userID].textOutput.addValue(outStr);
                break;
        }
        
        this.chatUsers[userID].messages.push(messageDetails);
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