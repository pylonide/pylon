/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/debugger/debugger",
    ["core/ide", "core/ext", "text!ext/debugger/debugger.xml"],
    function(ide, ext, markup) {
        return {
            name   : "Debug",
            dev    : "Ajax.org",
            type   : ext.LAYOUT,
            markup : markup,
            
            nodes : [],
            
            init : function(amlNode){
                this.nodes.push(
                    /*dbg, dbgNode,*/
                    
                    //Append the debug toolbar to the main toolbar
                    ide.tbMain.appendChild(tbDebug),
                    
                    //Append the watch window on the left below the file tree
                    ide.vbMain.selectSingleNode("a:hbox/a:vbox[1]").appendChild(winDbgWatch),
                    
                    //Append the console window at the bottom below the tab
                    ide.vbMain.selectSingleNode("a:hbox/a:vbox[2]").appendChild(winDbgConsole),
                    
                    //Append the stack window at the right
                    ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDbgStack)
                );
            },
            
            enable : function(){
                this.nodes.each(function(item){
                    if (item.show)
                        item.show();
                });
            },
            
            disable : function(){
                this.nodes.each(function(item){
                    if (item.hide)
                        item.hide();
                });
            },
            
            destroy : function(){
                this.nodes.each(function(item){
                    item.destroy(true, true);
                });
                winV8.destroy(true, true);
                barEditor.destroy(true, true);
                
                this.nodes = [];
            }
        }
    }
);