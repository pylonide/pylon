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
var dragdrop   = require("ext/dragdrop/dragdrop");

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
        
        if(ide.infraEnv) {
            this.nodes.push(
                ide.mnuFile.appendChild(new apf.item({
                    caption : "Download Project",
                    onclick : function(){
                        window.open("/api/project/download/zip/" + ide.projectName);
                    }
                })),
                winFilesViewer.insertBefore(new apf.button({
                    top: "-22",
                    skin: "header-btn",
                    right: "56",
                    icon: "download-ico.png",
                    onclick : function(){
                        window.open("/api/project/download/zip/" + require("core/ide").projectName);
                    }
                }), btnTreeRefresh)
            );
            btnUploadFiles.setProperty("right", "81");
        }
        
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
        /*
        this.folderbrowser = folderUploadSelect.$ext;
        this.folderbrowser.addEventListener('change', handleFileSelect, false);
        */
        fileUploadSelect.$ext.addEventListener("mouseover", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3Over");
        });
        
        fileUploadSelect.$ext.addEventListener("mouseout", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3", ["btn-default-css3Over"]);
        });
        
        fileUploadSelect.$ext.addEventListener("mousedown", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3Down");
        });
        
        fileUploadSelect.$ext.addEventListener("mouseup", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3", ["btn-default-css3Down"]);
        });
        
        function handleFileSelect(e){
            //var filenames = [];
            var files = e.target.files;
            /*for (var i = 0, l = files.length; i < l; i++) {
                filenames.push(files[i].fileName);
            }*/
            dragdrop.startUpload(files);
        };
        
        setTimeout(function() {
            vboxTreeContainer.appendChild(boxUploadActivity);
        }, 200);
        //trFiles.setAttribute("anchors", "0 0 " + lstUploadActivity.$ext.offsetHeight + " 0");
        
    },

    onShow : function(){
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert('The File APIs are not fully supported in this browser.');
            return winUploadFiles.hide();
        }
        
        uplTargetFolder.$ext.innerHTML = this.getTargetFolder().getAttribute("name");
        
        // disable tabEditors dropzone for upload
        tabEditors.$ext.disableDropbox = true;
    },
    
    onClose : function() {
        tabEditors.$ext.disableDropbox = false;
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
