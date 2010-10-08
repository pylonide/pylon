/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/run/run",
    ["core/ide",
     "core/ext",
     "ext/noderunner/noderunner",
     "text!ext/run/run.xml"], function(ide, ext, noderunner, markup) {

return ext.register("ext/run/run", {
    name   : "Run Toolbar",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [noderunner],

    nodes : [],

    init : function(amlNode){
        while(tbRun.childNodes.length) {
            var button = tbRun.firstChild;
            ide.barTools.appendChild(button);
            this.nodes.push(button);
        }
    },

    debugChrome : function() {
        noderunner.chromeDebug();
    },

    debug : function() {
        noderunner.debug();
    },

    run : function() {
        noderunner.run();
    },

    stop : function() {
        noderunner.stop();
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
    }
});

});