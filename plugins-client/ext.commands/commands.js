/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

var event = require("ace/lib/event");
var KeyBinding = require("ace/keyboard/keybinding").KeyBinding;
var CommandManager = require("ace/commands/command_manager").CommandManager;
var markupSettings = require("text!ext/commands/settings.xml");

var commandManager = new CommandManager(apf.isMac ? "mac" : "win");
var addCommand     = commandManager.addCommand;
var removeCommand  = commandManager.removeCommand;

var kb = new KeyBinding({
    commands : commandManager,
    fake : true
});
event.addCommandKeyListener(document.documentElement, kb.onCommandKey.bind(kb));

ide.commandManager = new apf.Class().$init();

module.exports = ext.register("ext/commands/commands", apf.extend(
    commandManager,
    {
        name    : "Keyboard Commands",
        dev     : "Ajax.org",
        alone   : true,
        type    : ext.GENERAL,
    
        init : function(){
            var _self = this;
            
            ide.addEventListener("settings.load", function(e){
                e.ext.setDefaults("general/keybindings", [["preset", "auto"]]);
                
                var preset = e.model.queryValue("general/keybindings/@preset");
                if (preset && preset != "auto")
                    _self.changePlatform(preset);
            });
            
            ide.addEventListener("init.ext/settings/settings", function(e){
                e.ext.addSettings("General", markupSettings, function(){
                    ddKeyBind.addEventListener("afterchange", function(){
                        _self.changePlatform(this.selected.getAttribute("value"));
                    });
                });
            });
        },
        
        changePlatform : function(value){
            this.platform = value == "auto"
                ? (apf.isMac ? "mac" : "win")
                : value;
            this.addCommands(this.commands);
        },
    
        getHotkey : function(command){
            return this.commands[command].bindKey[this.platform];
        },
        
        exec : function(command, editor, args, e){
            if (typeof command === 'string')
                command = this.commands[command];
            
            if (!command)
                return false;
        
            if (!editor || editor.fake) {
                //@todo focus handling for splitview
                var page = self.tabEditors && tabEditors.$activepage;
                editor = page && page.$editor;
            }
            
            if (Array.isArray(command)) {
                for (var i = command.length; i--; ) {
                    var cmd = command[i];
                    if (!cmd.isAvailable || cmd.isAvailable(editor, e))
                        break;
                    else
                        cmd = null;
                }
                if (!cmd)
                    return;
                command = cmd;
            } else if (command.isAvailable && !command.isAvailable(editor, e))
                return; //Disable commands for other contexts

            if (command.findEditor)
                editor = command.findEditor(editor);
            
            if (editor && editor.$readOnly && !command.readOnly)
                return false;

            var execEvent = {
                editor: editor,
                command: command,
                args: args
            };
            
            if (cloud9config.debug) {
                var retvalue = this._emit("exec", execEvent);
            } else try {
                var retvalue = this._emit("exec", execEvent);
            } catch (e) {}
            

            if (retvalue !== false && e) {
//                e.returnValue = false;
//                e.preventDefault();
                apf.queue.empty();
            }
            return retvalue !== false;
        },
        
        addCommand : function(command){
            ide.commandManager[command.name] = "";
            
            if (command.readOnly == undefined)
                command.readOnly = true;
            
            addCommand.apply(this, arguments);
            
            if (command.bindKey)
                ide.commandManager
                    .setProperty(command.name, command.bindKey[this.platform]);
        },
        
        addCommands : function(commands, asDefault){
            var _self = this;
            commands && Object.keys(commands).forEach(function(name) {
                var command = commands[name];
                if (typeof command === "string")
                    return this.bindKey(command, name);
    
                if (typeof command === "function")
                    command = { exec: command };
    
                if (!command.name)
                    command.name = name;
                    
                if (asDefault && _self.commands[command.name])
                    return;
    
                this.addCommand(command);
            }, this);
        },
        
        removeCommands : function(commands){
            Object.keys(commands).forEach(function(name) {
                this.removeCommand(commands[name]);
            }, this);
        },
        
        removeCommand : function(command, context){
            var name = (typeof command === 'string' ? command : command.name);

            if (ide.commandManager[name])
                ide.commandManager.setProperty(name, "");

            command = this.commands[name];
            delete this.commands[name];

        
            var ckb = this.commmandKeyBinding;
            for (var hashId in ckb) {
                for (var key in ckb[hashId]) {
                    var cl = ckb[hashId][key];
                    if (cl == command) {
                        delete ckb[hashId][key];
                    } else if (cl && cl.indexOf && cl.splice) {
                        var i = cl.indexOf(command);
                        if (i != -1)
                            cl.splice(i, 1);
                    }
                }
            };
        },
        
        bindKey: function(key, command) {
            if(!key)
                return;

            var ckb = this.commmandKeyBinding;
            var self = this;
            key.split("|").forEach(function(keyPart) {
                var binding = self.parseKeys(keyPart, command);
                var hashId = binding.hashId;
                var hash = (ckb[hashId] || (ckb[hashId] = {}))
                
                if (!hash[binding.key])
                    hash[binding.key] = command;
                else if (Array.isArray(hash[binding.key]))
                    hash[binding.key].push(command);
                else
                    hash[binding.key] = [hash[binding.key], command];
            });
        },
         
        removeCommandByName : function(name){
            var cmd = this.commands[name];
            if (cmd)
                this.removeCommand(cmd);
        },
        
        removeCommandsByName : function(list){
            var _self = this;
            list.forEach(function(name){
                var cmd = _self.commands[name];
                if (cmd)
                    _self.removeCommand(cmd);
            });
        }
    })
);

});
