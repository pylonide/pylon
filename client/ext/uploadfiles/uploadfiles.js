/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var css = require("text!ext/uploadfiles/uploadfiles.css");
var markup = require("text!ext/uploadfiles/uploadfiles.xml");
var fs   = require("ext/filesystem/filesystem");

var MAX_UPLOAD_SIZE = 52428800;
var MAX_OPENFILE_SIZE = 2097152;
var MAX_CONCURRENT_FILES = 2000;

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
    
    uploadQueue : [], // list of all files that are queued for upload
    lockHideQueueItems: [], // list of completed downloads that still needs to be removed from the upload queue
    
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
        this.filebrowser.addEventListener("mouseover", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3Over");
        });
        
        this.filebrowser.addEventListener("mouseout", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, null, ["btn-default-css3Over"]);
        });
        
        this.filebrowser.addEventListener("mousedown", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, "btn-default-css3Down");
        });
        
        this.filebrowser.addEventListener("mouseup", function() {
            apf.setStyleClass(fileUploadSelectBtn.$ext, null, ["btn-default-css3Down"]);
        });
        
        function handleFileSelect(e){
            var files = e.target.files;
            
            _self.startUpload(files);
        };
        
        setTimeout(function() {
            vboxTreeContainer.appendChild(boxUploadActivity);
        }, 200);
        //trFiles.setAttribute("anchors", "0 0 " + lstUploadActivity.$ext.offsetHeight + " 0");
        
        apf.addEventListener("http.uploadprogress", this.onProgress.bind(this));
        
        lstUploadActivity.$ext.addEventListener("mouseover", function(e) {
            _self.lockHideQueue = true;
            if (!apf.isChildOf(this, e.relatedTarget)) {
                _self.lockHideQueue = true;
            }
        });
        
        lstUploadActivity.$ext.addEventListener("mouseout", function(e) {
            if (apf.isChildOf(this, e.relatedTarget))
                return;
                
            _self.lockHideQueue = false;
            _self.clearCompletedUploads();

        });
    },

    onShow : function(){
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert('The File APIs are not fully supported in this browser.');
            return winUploadFiles.hide();
        }
        
        this.setTargetFolder();
        
        // disable tabEditors dropzone for upload
        tabEditors.$ext.disableDropbox = true;
        
        trFiles.addEventListener("afterselect", this.setTargetFolder);
    },
    
    onClose : function() {
        tabEditors.$ext.disableDropbox = false;
        trFiles.removeEventListener("afterselect", this.setTargetFolder);
    },
    
    getTargetFolder : function(){
        var target = trFiles.selected 
            ? trFiles.selected.nodeName == "file"
                ? trFiles.selected.parentElement
                : trFiles.selected
            : trFiles.root.firstChild;
        
        return target;
    },
    
    setTargetFolder: function() {
        uplTargetFolder.$ext.innerHTML = require("ext/uploadfiles/uploadfiles").getTargetFolder().getAttribute("name");
    },
    
    /* upload functionality */
    onBeforeDrop: function(e) {
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
/* this checks the maximum upload size of all files combined
        if (size > MAX_UPLOAD_SIZE) {
            util.alert(
                "Could not save document", "An error occurred while saving this document",
                "The file(s) you dropped exceeds the maximum of 50MB and could therefore not be uploaded."
            );
            return false;
        }
*/
        if (e.dataTransfer.files.length < 1)
            return false;
        
        this.onDrop(e);
        
        return true;
    },
    
    onDrop: function(e) {
        var dt = e.dataTransfer;
        var files = dt.files;

        this.startUpload(files);
    },

    startUpload: function(files) {
        var _self = this;
        this.numFilesUploaded = files.length;
        
        trFiles.addEventListener("beforeselect", this.checkSelectableFile);
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
            
        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;
        
        // hide upload window if visible
        if (winUploadFiles.visible)
            winUploadFiles.hide();
            
        // show upload activity list
        boxUploadActivity.show();
        
        
        // loop through all files to create the upload queue and create subfolders
        apf.asyncForEach(files, function(file, next) {
            file.targetFolder = node;
            
            var folders = file.webkitRelativePath && file.webkitRelativePath.split("/");
            
            if (!folders.length) {
                addFile(file);
                return next();
            }
            
            // a folder is uploaded
            else {
                folders.pop(); // remove filename from path
                
                var targetPath = folders.join("/");
                var nodePath = node.getAttribute("path");
                var targetFolder = trFiles.getModel().data.selectSingleNode("//folder[@path='" + nodePath + "/" + targetPath + "']");
                
                // check if folder with specified path already exists
                if (targetFolder) {
                    // this is a folder, no need to add to upload queue
                    if (file.name == ".")
                        return next();

                    addFile(file, targetFolder);
                    return next();
                }
                // target folder not created yet, create first
                else {
                    var subfolder;
                    var currentPath = nodePath;
                    apf.asyncForEach(folders, function(folder, next2) {
                        currentPath += "/" + folder;
                        subfolder = trFiles.getModel().data.selectSingleNode("//folder[@path='" + currentPath + "']");
                        
                        // subfolder is already created
                        if (subfolder) {
                            trFiles.select(subfolder);
                            next2();
                        }
                        // subfolder does not exists, create first
                        else {
                            fs.createFolder(folder, trFiles, true, function(folder) {
                                // check if there are subfolders to be created
                                trFiles.select(folder);
                                subfolder = folder;
                                next2();
                            });
                        }
                    }, function() {
                        // this is a folder, no need to add to upload queue
                        if (file.name == ".")
                            return next();
                            
                        addFile(file, subfolder);
                        next();
                    });
                }
            }
        }, function() {
            if (!_self.uploadInProgress)
            _self.uploadNextFile();
        });
        
        // add a file to the upload queue 
        function addFile(file, targetFolder) {
            if (targetFolder)
                file.targetFolder = targetFolder;
            _self.addToQueue(file);
        }
    },
    
    checkSelectableFile: function(event) {
        if (event.selected && event.selected.getAttribute("type") == "fileupload") 
            return false;
    },
    
    addToQueue: function(file) {
        // add files in dirty state
        var parent = file.targetFolder;
        var path = parent.getAttribute("path");
        
        // expand target folder in tree
        trFiles.slideOpen(null, parent, true);
        
        // add node to file tree
        var filepath = path + "/" + file.name;
        var xmlNode = "<file type='fileupload'" +
            " name='" + file.name + "'" +
            " path='" + filepath + "'" +
        "/>";
        
        trFiles.add(xmlNode, parent);
        file.path = filepath;
        // add file to upload activity list
        var queueNode = '<file name="' + file.name + '" />';
        
        file.queueNode = mdlUploadActivity.appendXml(queueNode);
        
        this.uploadQueue.push(file);
    },
    
    removeFromQueue: function(name) {
        var file;
        for (var i = 0, l = this.uploadQueue.length; i < l; i++) {
            file = this.uploadQueue[i];
            if (file.name == name) {
                this.uploadQueue.splice(i, 1);
                this.removeCurrentUploadFile(name);
                break;
            }
        }
    },
    
    removeCurrentUploadFile: function(name) {
        apf.xmldb.removeNode(mdlUploadActivity.queryNode("file[@name='" + name + "']"));
        apf.xmldb.removeNode(trFiles.getModel().data.selectSingleNode("//file[@name='" + name + "'][@type='fileupload']"));
        if (!mdlUploadActivity.data.childNodes.length) {
            boxUploadActivity.hide();
        }
    },
    
    // remove queued items from upload activity list that are completed uploading but were not removed yet
    // because user had his mousecursor on the list.
    clearCompletedUploads: function() {
        var _self = this;
        var completedUploads = mdlUploadActivity.queryNodes("file[@progress='100']");
        apf.asyncForEach(completedUploads, function(item, next) {
            if (_self.lockHideQueue)
                return;
            setTimeout(function() {    
                apf.xmldb.removeNode(item);
                next();
            }, 200);
        }, function() {
            
        });
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
            _self.existingOverwriteAll = false;
            _self.existingSkipAll = false;
            this.hideUploadActivityTimeout = setTimeout(function() {
                mdlUploadActivity.load("<data />");
                boxUploadActivity.hide();
                trFiles.removeEventListener("beforeselect", _self.checkSelectableFile);
            }, 5000);
        }
    },
    
    onLoad: function(file, e) {
        var node     = file.targetFolder;
        this.currentFile = file;
        this.currentFile.e = e;
        
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        
        while (node.getAttribute("type") != "folder" && node.tagName != "folder") {
            node = node.parentNode;
        }
            
        var path     = node.getAttribute("path");
        var filename = file.name;
        var _self    = this;
        apf.xmldb.setAttribute(file.queueNode, "progress", "0");
        
        function check(exists) {
            if (exists) {
                if (_self.existingOverwriteAll) {
                    _self.overwrite();
                }
                else if (_self.existingSkipAll) {
                    _self.removeCurrentUploadFile(filename);
                    _self.uploadNextFile();
                }
                else {
                    winUploadFileExists.show();
                    if (_self.uploadQueue.length) {
                        btnUploadOverwriteAll.show();
                        btnUploadSkipAll.show();
                    }
                    else {
                        btnUploadOverwriteAll.hide();
                        btnUploadSkipAll.hide();
                    }
                    uploadFileExistsMsg.$ext.innerHTML = "\"" + filename + "\" already exists, do you want to replace it?. Replacing it will overwrite it's current contents.";
                }
            }
            else {
                upload(file, e);
            }
        }
        
        function upload(file, e) {
            file = file || _self.currentFile;
            e = e instanceof ProgressEvent ? e : _self.currentFile.e;
            
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
        }
        _self.upload = upload;
        
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
 
                // change file from uploading to file to regular file in tree
                apf.xmldb.setAttribute(trFiles.getModel().queryNode("//file[@path='" + file.path + "']"), "type", "file");
                
                // remove file from upload activity lilst
                setTimeout(function() {
                    if (!_self.lockHideQueue)
                        apf.xmldb.removeNode(file.queueNode);
                    else
                        _self.lockHideQueueItems.push(file);
                }, 2000);
                
                /*
                // open file functionality
                if (_self.numFilesUploaded == 1) {
                    trFiles.select(file.treeNode);
                
                    if (file.size < MAX_OPENFILE_SIZE)
                        ide.dispatchEvent("openfile", {doc: ide.createDocument(file.treeNode)});
                }
                */
                
                //setTimeout(function() {
                    _self.uploadNextFile();
                //}, 2000);
            });
        }
        
        /** Check if path already exists, otherwise continue with upload() */
        fs.exists(path + "/" + file.name, check);
    },
    
    skip: function() {
        this.removeCurrentUploadFile(this.currentFile.name);
        this.uploadNextFile();
    },
    
    skipAll: function() {
        this.existingSkipAll = true;
        this.skip();
    },
    
    overwrite: function() {
        var node = this.currentFile.targetFolder;
        var path     = node.getAttribute("path");
        var filename = this.currentFile.name;
        
        apf.xmldb.removeNode(trFiles.queryNode('//file[@path="' + path + "/" + filename + '"]'));
        fs.remove(path + "/" + filename, this.upload);
    },
    
    overwriteAll: function() {
        this.existingOverwriteAll = true;
        this.overwrite();
    },
    
    onProgress: function(o) {
        if(!this.currentFile) return;    
        var e = o.extra;
        var total = (e.loaded / e.total) * 100;
        var node = this.currentFile.queueNode;
        apf.xmldb.setAttribute(node, "progress", total);
    },
    
    getFormData: function(file) {
        var form = new FormData();
        form.append("upload", file);
        
        return form;
    },
    
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
        
        apf.addEventListener("http.uploadprogress", this.onProgress);
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
        
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    }
});

});
