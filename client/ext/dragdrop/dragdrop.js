/**
 * Native drag 'n drop upload for Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide  = require("core/ide");
var ext  = require("core/ext");
var util = require("core/util");
var fs   = require("ext/filesystem/filesystem");

var MAX_UPLOAD_SIZE = 52428800;
var MAX_OPENFILE_SIZE = 2097152;
var MAX_CONCURRENT_FILES = 10;

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    
    nodes       : [],
    
    uploadQueue : [],
    
    init: function() {
        var _self  = this;

        var dropbox = document.createElement("div");
        apf.setStyleClass(dropbox, "draganddrop");
        
        var label = document.createElement("span");
        label.textContent = "Drop files here to upload";
        dropbox.appendChild(label);
        
        function decorateNode(holder) {
            dropbox = holder.dropbox = dropbox.cloneNode(true);
            holder.appendChild(dropbox);
            
            holder.addEventListener("dragenter", dragEnter, false);
            dropbox.addEventListener("dragleave", dragLeave, false);
            dropbox.addEventListener("drop", dragDrop, false);
            
            ["dragexit", "dragover"].forEach(function(e) {
                dropbox.addEventListener(e, noopHandler, false);
            });
        }
        
        ide.addEventListener("init.ext/editors/editors", function(){
            _self.nodes.push(tabEditors.$ext);
            decorateNode(tabEditors.$ext);
        });

        ide.addEventListener("init.ext/tree/tree", function(){
            _self.nodes.push(trFiles.$ext);
            decorateNode(trFiles.$ext);
        });

        ide.addEventListener("init.ext/uploadfiles/uploadfiles", function(){
            _self.nodes.push(uploadDropArea.$ext);
            decorateNode(uploadDropArea.$ext);
        });

        this.dragStateEvent = {"dragenter": dragEnter};
        
        function dragLeave(e) {
            apf.stopEvent(e);
            apf.setStyleClass(this, null, ["over"]);
        }
        
        function dragEnter(e) {
            apf.stopEvent(e);
            apf.setStyleClass(this.dropbox, "over");
        }
        
        function dragDrop(e) {
            dragLeave.call(this, e);
            return _self.onBeforeDrop(e);
        }
        
        function noopHandler(e) {
            apf.stopEvent(e);
        }
        /*
        this.StatusBar = {
            $init: function() {
                if (!sbMain)
                    return;
                
                sbMain.firstChild.appendChild(
                    new apf.progressbar({
                        id: "pbMain",
                        anchors: "0 0 0 5",
                        //autohide: true
                    })
                );
            },
            start: function() {
                if (!sbMain.visible)
                    sbMain.show();
            },
            end: function() {
                sbMain.hide();
                
                if (sbMain.childNodes)
                    sbMain.childNodes[0].setAttribute("caption", "");
            },
            upload: function(file) {
                if (sbMain.childNodes) {
                    var caption = "Uploading file " + (file.name || "") + "(" + (file.type || "") + ")";
                    sbMain.childNodes[0].setAttribute("caption", caption);
                }
                pbMain.clear();
                pbMain.start();
                
            },
            progress: function(value) {
                pbMain.setValue(value);
            }
        };
            
        this.StatusBar.$init();
        */
        apf.addEventListener("http.uploadprogress", this.onProgress.bind(this));
    },
    
    onBeforeDrop: function(e) {
        // @see Please, go to line 176 for clarification.
        if (!(window.File && window.FileReader/* && window.FormData*/)) {
            util.alert(
                "Could not upload file(s)", "An error occurred while dropping this file(s)",
                "Your browser does not offer support for drag and drop for file uploads. " +
                "Please try with a recent version of Chrome or Firefox browsers."
            );
            return false;
        }
        /** Check the number of dropped files exceeds the limit */
        if (e.dataTransfer.files.length > MAX_CONCURRENT_FILES) {
            util.alert(
                "Could not upload file(s)", "An error occurred while dropping this file(s)",
                "You can only drop " + MAX_CONCURRENT_FILES + " files to upload at the same time. " + 
                "Please try again with " + MAX_CONCURRENT_FILES + " or a lesser number of files."
            );
            return false;
        }
        /** Check total filesize of dropped files */
        for (var size = 0, i = 0, l = e.dataTransfer.files.length; i < l; ++i)
            size += e.dataTransfer.files[i].size;

        if (size > MAX_UPLOAD_SIZE) {
            util.alert(
                "Could not save document", "An error occurred while saving this document",
                "The file(s) you dropped exceeds the maximum of 50MB and could therefore not be uploaded."
            );
            return false;
        }
        
        if (e.dataTransfer.files.length < 1)
            return false;
        
        this.onDrop(e);
        
        return true;
    },
    
    onDrop: function(e) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
            
        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;
        
        var dt = e.dataTransfer;
        var files = dt.files;
        
        // hide upload window if visible
        if (winUploadFiles.visible)
            winUploadFiles.hide();
            
        // show upload activity list
        boxUploadActivity.show();
        
        var file;
        var sXml = "";
        for (var i = 0, l = files.length; i < l; i++) {
            file = files[i];
            file.targetFolder = node;
            
            sXml = '<file name="' + file.name + '" />';
            mdlUploadActivity.appendXml(sXml);
            this.addToQueue(file);
        }
        
        if (!this.uploadInProgress)
            this.uploadNextFile();
    },
    
    addToQueue: function(file) {
        // add files in dirty state
        var parent = file.targetFolder;
        var path = parent.getAttribute("path");
        var xmlNode = "<file type='fileupload'" +
            " name='" + file.name + "'" +
            " path='" + path + "/" + file.name + "'" +
        "/>";
        var treeNode = trFiles.add(xmlNode, parent);
        
        file.treeNode = treeNode;
        
        this.uploadQueue.push(file);
    },
    
    removeFromQueue: function(name) {
        var file;
        for (var i = 0, l = this.uploadQueue.length; i < l; i++) {
            file = this.uploadQueue[i];
            if (file.name == name) {
                this.uploadQueue.splice(i, 1);
                apf.xmldb.removeNode(mdlUploadActivity.queryNode("file[@name='" + name + "']"));
                apf.xmldb.removeNode(trFiles.getModel().data.selectSingleNode("//file[@name='" + name + "'][@type='fileupload']"));
                break;
            }
        }
    },
    
    uploadNextFile: function() {
        var _self = this;
        
        this.currentFile = this.uploadQueue.shift();
        
        // check if there is a file to upload
        if (this.currentFile) {
            this.uploadInProgress = true;
            if (this.hideUploadActivityTimeout) {
                clearTimeout(this.hideUploadActivityTimeout);
                this.hideUploadActivityTimeout = null;
            }
            
            //_self.StatusBar.start();
            /** Chrome, Firefox */
            if (apf.hasFileApi) {
                /** Processing ... */
                var reader = new FileReader();
                /** Init the reader event handlers */
                reader.onloadend = this.onLoad.bind(this, this.currentFile);
                /** Begin the read operation */
                reader.readAsBinaryString(this.currentFile);
            }
            else {
                /** Safari >= 5.0.2 and Safari < 6.0 */
                this.onLoad(this.currentFile, this.getFormData(this.currentFile));
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
        }
        // no files in queue, upload completed
        else {
            _self.uploadInProgress = false;
            this.hideUploadActivityTimeout = setTimeout(function() {
                mdlUploadActivity.load("<data />");
                boxUploadActivity.hide();
            }, 5000);
        }
    },
    
    onLoad: function(file, e) {
        var node     = file.targetFolder;
        var path     = node.getAttribute("path");
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
            _self.currentFile = file;
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
                    _self.uploadNextFile);
            }
            
            /** Request successful */
            fs.webdav.exec("readdir", [path], function(data) {
                if (data instanceof Error) {
                    // @todo: in case of error, show nice alert dialog.
                    return _self.uploadNextFile();
                }
                
                var strXml = data.match(new RegExp(("(<file path='" + path +
                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")));
                
                if(!strXml)
                    _self.uploadNextFile();
 
                //strXml = strXml[1];
                //var oXml = apf.xmldb.appendChild(node, apf.getXml(strXml));

                // change file from uploading to file to regular file in tree
                apf.xmldb.setAttribute(file.treeNode, "type", "file");
                
                //apf.xmldb.appendChild(node, apf.getXml(strXml));
//                trFiles.select(oXml);
                
/* when open file?
                if (file.size < MAX_OPENFILE_SIZE)
                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
*/

//                apf.xmldb.setAttribute(node, "progress", "100");
                setTimeout(function() {
                    _self.uploadNextFile();
                }, 3000);
            });
        }
        
        /** Check if path already exists, otherwise continue with upload() */
        fs.exists(path + "/" + file.name, check);
    },
    
    onProgress: function(o) {
        var e = o.extra;
        var total = (e.loaded / e.total) * 100;
        
        var node = mdlUploadActivity.queryNode("file[@name='" + this.currentFile.name + "']");
        apf.xmldb.setAttribute(node, "progress", total);
        //_self.StatusBar.progress(total.toFixed());
    },
    
    getFormData: function(file) {
        var form = new FormData();
        form.append("upload", file);
        
        return form;
    },
    
    enable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.addEventListener(e, _self.dragStateEvent[e], false);
        });
        apf.addEventListener("http.uploadprogress", this.onProgress);
    },
    
    disable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    },
    
    destroy: function() {
        var _self = this;
        this.nodes.each(function(item){
            item.removeChild(item.dropbox);
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        this.nodes = [];
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    }
});

});