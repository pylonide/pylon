/**
 * Code Editor for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/debugger/debugger",
    ["core/ide",
     "core/ext",
     "ext/console/console",
     "ext/filesystem/filesystem",
     "ext/noderunner/noderunner",
     "text!ext/debugger/debugger.xml"],
    function(ide, ext, log, fs, noderunner, markup) {

return ext.register("ext/debugger/debugger", {
    name   : "Debug",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log, fs],

    nodes : [],

    hook : function(){
        this.$layoutItem = ddModes.appendChild(new apf.item({
            value   : "ext/debugger/debugger",
            caption : this.name
        }));
    },

    init : function(amlNode){
        this.rightPane = ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]");
        this.nodes.push(
            //Append the debug toolbar to the main toolbar
            ide.tbMain.appendChild(tbDebug),

            //Append the stack window at the right
            this.rightPane.appendChild(winDbgStack),

            //Append the watch window on the left below the file tree
            this.rightPane.appendChild(winDbgWatch),

            // Append the sources list below the file tree
            ide.vbMain.selectSingleNode("a:hbox/a:vbox[1]").appendChild(winDbgSources)
        );

        this.paths = {};
        var _self = this;
        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (_self.inSync || e.action != "add")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });
        fs.model.addEventListener("update", function(e) {
            if (_self.inSync || e.action != "insert")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });

        log.enable(true);
    },

    $syncTree : function() {
        this.inSync = true;
        var dbgFiles = mdlDbgSources.data.childNodes;

        var workspaceDir = noderunner.workspaceDir;
        for (var i=0,l=dbgFiles.length; i<l; i++) {
            var dbgFile = dbgFiles[i];
            var name = dbgFile.getAttribute("scriptname");
            if (name.indexOf(workspaceDir) != 0)
                continue;
            var path = name.slice(workspaceDir.length+1);
            this.paths[path] = dbgFile;
        }
        var files = fs.model.data.getElementsByTagName("file");

        for (var i=0,l=files.length; i<l; i++) {
            var file = files[i];
            var path = file.getAttribute("path")

            var dbgFile = this.paths[path];
            if (dbgFile) {
                file.setAttribute("scriptid", dbgFile.getAttribute("scriptid"));
                file.setAttribute("scriptname", dbgFile.getAttribute("scriptname"));
                file.setAttribute("lineoffset", "0");
            }
        }
        this.inSync = false;
    },

    enable : function(){
        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
        this.rightPane.setProperty("visible", true);
        log.enable(true);
    },

    disable : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
        this.rightPane.setProperty("visible", false);
        log.disable(true);
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winV8.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
    }
});

});