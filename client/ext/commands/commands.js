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
var exec           = commandManager.exec;
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
            
            ide.addEventListener("loadsettings", function(e){
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
            if (!editor || editor.fake) {
                //@todo focus handling for splitview
                var page = self.tabEditors && tabEditors.$activepage;
                editor = page && page.$editor;
            }
            
            if (command.isAvailable && !command.isAvailable(editor))
                return; //Disable commands for other contexts

            if (exec.apply(this, [command, editor, args]) !== false && e) {
//                e.returnValue = false;
//                e.preventDefault();
                apf.queue.empty();
                return true;
            }
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
        
        removeCommand : function(command){
            if (ide.commandManager[command.name])
                ide.commandManager.setProperty(command.name, "");
            removeCommand.apply(this, arguments);
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
        },
    
        enable : function(){
            
        },
    
        disable : function(){
            
        },
    
        destroy : function(){
            
        }
    })
);

});
