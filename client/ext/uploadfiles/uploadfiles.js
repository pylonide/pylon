/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var css = require("text!ext/uploadfiles/uploadfiles.css");
var markup = require("text!ext/uploadfiles/uploadfiles.xml");
var fs   = require("ext/filesystem/filesystem");

module.exports = ext.register("ext/uploadfiles/uploadfiles", {
    dev         : "Ajax.org",
    name        : "Upload Files",
    alone       : true,
    type        : ext.GENERAL,
    css         : css,
    markup      : markup,
    deps        : [],
    offline     : false,

    currentSettings : [],
    nodes       : [],

    init : function(){
        var _self = this;
        apf.importCssString(_self.css);
        
        this.nodes.push(
            ide.mnuFile.appendChild(new apf.item({
                caption : "Upload Files",
                onclick : function(){
                    winUploadFiles.show();
                }
            })),
            ide.mnuFile.appendChild(new apf.divider())
        );
        
        this.filebrowser = fileUploadSelect.$ext;
        this.filebrowser.addEventListener('change', handleFileSelect, false);
        
        function handleFileSelect(e){
            //var filenames = [];
            var files = e.target.files;
            /*for (var i = 0, l = files.length; i < l; i++) {
                filenames.push(files[i].fileName);
            }*/
            _self.startUpload(files);
        };
        
        vboxTreeContainer.appendChild(boxUploadActivity);
        //trFiles.setAttribute("anchors", "0 0 " + lstUploadActivity.$ext.offsetHeight + " 0");
        
    },

    onShow : function(){
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert('The File APIs are not fully supported in this browser.');
            return winUploadFiles.hide();
        }
        
        uplTargetFolder.$ext.innerHTML = this.getTargetFolder().getAttribute("name");
    },
    
    getTargetFolder : function(){
        var target = trFiles.selected 
            ? trFiles.selected.nodeName == "file"
                ? trFiles.selected.parentElement
                : trFiles.selected
            : trFiles.root.firstChild;
        
        return target;
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
