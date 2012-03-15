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
    
    startUpload : function(files){
        var _self = this;
        winUploadFiles.hide();
        
        // @todo open upload queue panel
        
        
        apf.asyncForEach(files, function(file, next) {
            if (apf.hasFileApi) {
                /** Processing ... */
                var reader = new FileReader();
                /** Init the reader event handlers */
                reader.onloadend = _self.onLoad.bind(_self, file, next);
                /** Begin the read operation */
                reader.readAsBinaryString(file);
            }
            else {
                /** Safari >= 5.0.2 and Safari < 6.0 */
                _self.onLoad(file, next, _self.getFormData(file));
                /**
                 * @fixme Safari for Mac is buggy when sending XHR using FormData
                 * Problem in their source code causing sometimes `WebKitFormBoundary`
                 * to be added to the request body, making it imposible to construct
                 * a multipart message manually and to construct headers.
                 * 
                 * @see http://www.google.es/url?sa=t&source=web&cd=2&ved=0CCgQFjAB&url=https%3A%2F%2Fdiscussions.apple.com%2Fthread%2F2412523%3Fstart%3D0%26tstart%3D0&ei=GFWITr2BM4SEOt7doNUB&usg=AFQjCNF6WSGeTkrpaqioUyEswi9K2xhZ8g
                 * @todo For safari 6.0 seems like FileReader will be present
                 */
            }
        }, console.log("done"));
    },
    
    onLoad : function(file, next, e){
        var targetfolder = this.getTargetFolder();
        var path     = targetfolder.getAttribute("path");
        var filename = file.name;
        var index    = 0;
        var _self    = this;

        function check(exists) {
            if (exists) {
                filename = file.name + "." + index++;
                fs.exists(path + "/" + filename, check);
            } else
                upload();
        }
        
        function upload() {
            var data = e instanceof FormData ? e : e.target.result;
            var oBinary = {
                filename: file.name,
                filesize: file.size,
                blob: file
            };
            /*if (data instanceof FormData) {
                oBinary.filedataname = file.name;
                oBinary.multipart = true;
            }*/
            
            fs.webdav.write(path + "/" + file.name, data, false, oBinary, complete);
            //_self.StatusBar.upload(file);
        }
        
        function complete(data, state, extra) {
            if (state != apf.SUCCESS) {
                return util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message),
                    next);
            }
            
            /** Request successful */
            fs.webdav.exec("readdir", [path], function(data) {
                if (data instanceof Error) {
                    // @todo: in case of error, show nice alert dialog.
                    return next();
                }
                
                var strXml = data.match(new RegExp(("(<file path='" + path +
                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")));
                
                if(!strXml)
                    next();
                    
                strXml = strXml[1]
                var oXml = apf.xmldb.appendChild(targetfolder, apf.getXml(strXml));

                trFiles.select(oXml);
                if (file.size < MAX_OPENFILE_SIZE)
                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
                
                next();
            });
        }
        
        /** Check if path already exists, otherwise continue with upload() */
        fs.exists(path + "/" + file.name, check);
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
