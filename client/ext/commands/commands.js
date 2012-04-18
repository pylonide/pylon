/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var CommandManager = require("support/ace/lib/ace/commands/command_manager").CommandManager;

var commandManager = new CommandManager(apf.isMac ? "mac" : "win");
var exec           = commandManager.exec;
var addCommand     = commandManager.addCommand;
var removeCommand  = commandManager.removeCommand;

ide.commandManager = commandManager;

module.exports = ext.register("ext/commands/commands", apf.extend(
    commandManager,
    new apf.Class().$init(), 
    {
        name    : "Keyboard Commands",
        dev     : "Ajax.org",
        alone   : true,
        type    : ext.GENERAL,
    
        init : function(){},
    
        getHotkey : function(command){
            return this.commands[command].bindKey[this.platform];
        },
        
        exec : function(command, editor, args, e){
            if (!editor) {
                //@todo this needs a better abstraction
                var page = self.tabEditors && tabEditors.getPage();
                editor = page && page.$editor;
                if (editor.ceEditor)
                    editor = editor.ceEditor.$editor;
            }
            
            if (exec.apply(this, [command, editor, args]) !== false && e) {
                e.returnValue = false;
                e.preventDefault();
                apf.queue.empty();
            }
        },
        
        addCommand : function(command){
            this[command.name] = "";
            
            addCommand.apply(this, arguments);
            
            if (command.bindKey)
                this.setProperty(command.name, command.bindKey[this.platform]);
        },
        
        removeCommand : function(command){
            if (this[command.name])
                this.setProperty(command.name, "");
            removeCommand.apply(this, arguments);
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
