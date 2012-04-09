/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : false,
    commands : {
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    dirty   : true,
    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }), mnuFile.firstChild),

            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                icon    : "open.png",
                width   : 29,
                tooltip : "Open...",
                skin    : "c9-toolbarbutton",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
                
        ide.addEventListener("init.ext/editors/editors", function(){
            _self.markupInsertionPoint = tabEditors;
            //tabEditors.appendChild(winGoToFile);
        });

        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        var _self = this;
        
        txtGoToFile.addEventListener("prop.visible", function(e){
            if (e.value) {
                txtGoToFile.select();
                txtGoToFile.focus();
                _self.dirty = true;
            }
        });
        
        txtGoToFile.addEventListener("keydown", function(e){
            if (txtGoToFile.value == "") {
                return;
            }

            if (e.keyCode == 13){
                _self.searchFor(txtGoToFile.value);

                ide.dispatchEvent("track_action", {type: "gotofile"});
                return false;
            }
            else if (e.keyCode == 27) {
                winGoToFile.hide();
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38 && !e.shiftKey) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (e.keyCode == 13) {
                _self.openFile();
                return false;
            }
            else if (apf.isCharacter(e.keyCode)) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            _self.openFile();
        });
        
        this.fetchAllFiles();

        this.nodes.push(winGoToFile);
    },
    
    fetchAllFiles : function(){
        var _self = this;

        //@todo create an allfiles plugin that plugins like gotofile can depend on
        //@todo soon this protocol needs to be turned into a json protocol
        davProject.report(ide.davPrefix, 'filesearch', {query: ""}, //@todo filelist needs some fixing
          function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return;
                }

                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return; //@todo

            var re = new RegExp("^\.|\\.bzr|\\.cdv|\\.dep|\\.dot|\\.nib|\\.plst|\\.git|\\.hg|\\.pc|\\.svn|blib|CVS|RCS|SCCS|_darcs|_sgbak|autom4te\\.cache|cover_db|_build|\\.tmp");
            var nodes = data.firstChild.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--) {
                if (re.test(nodes[i].firstChild.nodeValue))
                    nodes[i].parentNode.removeChild(nodes[i]);
            }

            _self.cachedFileList = data;

            if (winGoToFile.visible)
                _self.updateSearchResults();
            
            mdlGoToFile.load(data);
        });
    },
    
    updateSearchResults : function(){
        var data = this.cachedFileList;
        
        /*var nodes = data.selectNodes("//d:href");
        for (var node, i = 0; i < nodes.length; i++) {
            node = nodes[i];

            //@todo support for submodules
            if (node.firstChild.nodeValue.match(/_test\.js$/)) {
                var file = apf.getXml("<file />");
                var path = ide.davPrefix + "/" + node.firstChild.nodeValue;
                file.setAttribute("name", path.split("/").pop());
                file.setAttribute("path", path);
                file.setAttribute("type", "nodeunit");
                apf.xmldb.appendChild(testpanel.findParent(path), file);
            }
        }*/
    },
    
    searchFor : function(keyword){
        this.lastSearch = keyword;
                
//        mdlGoToFile.load("{davProject.report('" + ide.davPrefix 
//            + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");

        
    },
    
    openFile: function(){
        var nodes = dgGoToFile.getSelection();
        
        if (nodes.length == 0)
            return false;
            
        winGoToFile.hide();
        for (var i = 0; i < nodes.length; i++) {
            var path = ide.davPrefix.replace(/[\/]+$/, "") + "/" 
                + apf.getTextNode(nodes[i]).nodeValue.replace(/^[\/]+/, "");
            editors.showFile(path, 0, 0);
            ide.dispatchEvent("track_action", {type: "fileopen"});
        }
    },

    gotofile : function(){
        this.toggleDialog(true);
        return false;
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);

        if (!winGoToFile.visible || forceShow)
            winGoToFile.show();
        else
            winGoToFile.hide();
        return false;
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
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});