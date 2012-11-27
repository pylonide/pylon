/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global winUploadFiles,mnuCtxTree,itemCtxTreeNewFile,lstUploadActivity,
         fileUploadSelect,hboxUploadNoFolders,hboxUploadWithFolders,fileUploadSelectBtn,
         folderUploadSelect,vboxTreeContainer,boxUploadActivity,cbToggleUploadQueue,
         trFiles,tabEditors,uplTargetFolder,winNoFolderSupport,btnNoFolderSupportOpenDialog,
         mdlUploadActivity,btnCancelUploads,davProject,winUploadFileExists,btnUploadOverwriteAll,
         btnUploadSkipAll,uploadFileExistsMsg,uploadactivityNumFiles */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var css = require("text!ext/uploadfiles/uploadfiles.css");
var skin = require("text!ext/uploadfiles/skin.xml");
var markup = require("text!ext/uploadfiles/uploadfiles.xml");
var fs   = require("ext/filesystem/filesystem");
var menus = require("ext/menus/menus");
var settings = require("ext/settings/settings");

var MAX_UPLOAD_SIZE_FILE = 52428800; // max size accepted for one file
var MAX_OPENFILE_SIZE = 2097152; // max size of file that is openen in the editor on drop
var MAX_VISIBLE_UPLOADS = 20; // max number of files added to upload activity list
var MAX_OPEN_FILES_EDITOR = 5; // max number of files that can be opened in the editor

module.exports = ext.register("ext/uploadfiles/uploadfiles", {
    dev         : "Ajax.org",
    name        : "Upload Files",
    alone       : true,
    skin    : {
        id  : "uploadfiles",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/uploadfiles/style/images/"
    },
    type        : ext.GENERAL,
    css         : util.replaceStaticPrefix(css),
    markup      : markup,
    deps        : [],
    offline     : false,
    autodisable     : ext.ONLINE | ext.LOCAL,
    worker      : null,

    currentSettings : [],
    nodes       : [],

    uploadFiles: [], // list of all files that are queued for upload
    uploadQueue : [], // shortlist of files next in queue for upload
    lockHideQueueItems: [], // list of completed downloads that still needs to be removed from the upload queue

    ignoreFiles: [".", ".DS_Store"],

    hook : function(){
        var _self = this;
        ide.addEventListener("init.ext/tree/tree", function(){
            _self.nodes.push(
                menus.addItemByPath("File/~", new apf.divider(), 350),
                menus.addItemByPath("File/Upload Files", new apf.item({
                    onclick : function(){
                        ext.initExtension(_self);
                        winUploadFiles.show();
                    }
                }), 370)
            );

            mnuCtxTree.addEventListener("afterrender", function(){
                _self.nodes.push(
                    mnuCtxTree.insertBefore(new apf.item({
                        id : "mnuCtxTreeUpload",
                        match : "[folder]",
                        visible : "{trFiles.selected.getAttribute('type')=='folder'}",
                        caption : "Upload to this folder",
                        onclick : function(){
                            ext.initExtension(_self);

                            winUploadFiles.show();
                        }
                    }), itemCtxTreeNewFile),
                    mnuCtxTree.insertBefore(new apf.divider({
                        visible : "{mnuCtxTreeUpload.visible}"
                    }), itemCtxTreeNewFile)
                );
            });

            if (window.cloud9config.hosted) {
                _self.nodes.push(
                    menus.addItemByPath("File/Download Project", new apf.item({
                        onclick : function(){
                            window.open(ide.apiPrefix + "/project/download");
                        }
                    }), 390)
                );
            }
        });
    },

    init : function(){
        var _self = this;
        apf.importCssString(_self.css);

        // disabled download project since it doesn't work anymore due to runvm changes

        winUploadFiles.addEventListener("afterrender", function(){
            this.filebrowser = fileUploadSelect.$ext;
            this.filebrowser.addEventListener("change", handleFileSelect, false);

            // enable webkit folder upload
            if (apf.isWebkit) {
                hboxUploadNoFolders.hide();
                hboxUploadWithFolders.show();

                apf.setStyleClass(fileUploadSelectBtn.$ext, "uploadWithFolders");

                this.folderbrowser = folderUploadSelect.$ext;
                this.folderbrowser.style.display = "block";
                this.folderbrowser.addEventListener("change", handleFileSelect, false);
            }
        });

        function handleFileSelect(e){
            var files = Array.prototype.slice.call(e.target.files);
            _self.startUpload(files);
            e.target.value = "";
        };

        ide.addEventListener("init.ext/tree/tree", function(){
            vboxTreeContainer.appendChild(boxUploadActivity);
        });

        var list = lstUploadActivity;
        list.$ext.addEventListener("mouseover", function(e) {
            _self.lockHideQueue = true;
            if (!apf.isChildOf(this, e.relatedTarget)) {
                _self.lockHideQueue = true;
            }
        });

        list.$ext.addEventListener("mouseout", function(e) {
            if (apf.isChildOf(this, e.relatedTarget))
                return;

            _self.lockHideQueue = false;
            _self.clearCompletedUploads();
        });

        cbToggleUploadQueue.addEventListener("click", function(e) {
            if (!e.currentTarget.checked)
                list.hide();
            else
                list.show();
        });
    },

    initWorker: function() {
        var _self = this;

        this.worker = new Worker(ide.workerPrefix + "/ext/uploadfiles/uploadworker.js");
        this.worker.onmessage = function(e) {
            var data = e.data;
            if (!data.type) {
                //console.log(data);
                return;
            }
            switch(data.type) {
                case "complete":
                    _self.onComplete();
                    break;
                case "progress":
                    _self.onProgress(data.value);
                    break;
                case "paused":
                    if (!ide.onLine || data.error === 500) {
                        ide.addEventListener("afteronline", function(e) {
                            // upload current file again
                            _self.upload();
                        });
                    }
                    // so when we have 404's or something, we'll show this to the users
                    else {
                        util.alert("Upload failed", "Uploading " + data.filepath + " failed",
                            "The server responded with error code " + data.error);

                        _self.removeCurrentUploadFile();
                    }
                    break;
                case "debug":
                    console.log(JSON.stringify(data));
                    break;
                case "canceled":
                    this.cancelAllUploads = false;
                    break;
                default:
                    console.log("unknown message from uploadworker: ", data.type);
            }
        };
    },

    onShow : function(){
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            alert("The File APIs are not fully supported in this browser.");
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
        var targetfolder = require("ext/uploadfiles/uploadfiles").getTargetFolder();
        if (!targetfolder)
            trFiles.root.firstChild;

        uplTargetFolder.$ext.innerHTML = targetfolder.getAttribute("name");
    },

    /* upload functionality */
    onBeforeDrop: function(e) {
        if (!(window.File && window.FileReader)) {
            util.alert(
                "Could not upload file(s)", "An error occurred while dropping this file(s)",
                "Your browser does not offer support for drag and drop for file uploads. " +
                "Please try with a recent version of Chrome or Firefox."
            );
            return false;
        }

        var files = e.dataTransfer.files;
        // Dropped item is a folder, second condition is for FireFox
        if (!files.length || !files[0].size ||
                // because this isnt a super check it also triggers on a file that the
                // browser doesn't recognize (no mime-type), so... let's check on file name
                // containing a . as well, it will only change behavior in Chrome a.t.m.
                // and as of Chrome 21 folder upload is available there
                (files.length == 1 && files[0].type == "" &&
                    files[0].name.indexOf(".") === -1)) {

            ext.initExtension(this);

            winNoFolderSupport.show();

            // only in Chrome display button to upload dialog with select folder
            if (!apf.isWebkit)
                btnNoFolderSupportOpenDialog.hide();

            return false;
        }

        var filesLength = files.length;
        if (filesLength < 1)
            return false;

        // if dropped on editor open file
        if (e.currentTarget.id == "tabEditorsDropArea") {
            if (filesLength <= MAX_OPEN_FILES_EDITOR)
                this.openOnUpload = true;
            else {
                return util.alert(
                    "Maximum files exceeded", "The number of files dropped in the editor exceeds the limit.",
                    "Please update your selection to " + MAX_OPEN_FILES_EDITOR + " files to continue."
                );
            }
        }

        this.onDrop(e);

        return true;
    },

    onDrop: function(e) {
        ext.initExtension(this);

        var files = Array.prototype.slice.call(e.dataTransfer.files);
        this.startUpload(files);
    },

    startUpload: function(files) {
        this.numFilesUploaded = files.length;

        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");

        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;

        // hide upload window if visible
        if (winUploadFiles.visible)
            winUploadFiles.hide();

        // set hidden files to true to support hidden files and folders
        (davProject.realWebdav || davProject).setAttribute("showhidden", true);

        var filesToAddToQueue = [];
        var files_too_big = [];
        var filename;
        this.uploadIndex = -1;
        if (!this.totalNumUploads)
            this.totalNumUploads = 0;
        var fileIndex = -1;
        var filesInQueue = this.uploadInProgress ? (mdlUploadActivity.data && mdlUploadActivity.data.childNodes.length) : 0;

        var file;
        for (var i = 0, l = files.length; i < l; i++) {
            file = files[i];
            fileIndex++;

            filename = file.name;
            if (this.ignoreFiles.indexOf(filename) == -1) {
                if (file.size > MAX_UPLOAD_SIZE_FILE)
                    files_too_big.push(filename);

                // if more then one file is too big there is no need to check any further
                if (files_too_big.length > 1)
                    return this.showFilesTooBigDialog(files_too_big);

                this.totalNumUploads++;
                if (filesInQueue < MAX_VISIBLE_UPLOADS) {
                    this.uploadIndex = fileIndex;
                    filesInQueue++;
                    filesToAddToQueue.push(file);
                }
            }
        }

        if (files_too_big.length)
            return this.showFilesTooBigDialog(files_too_big);

        this.uploadFiles.push({
            targetFolder: node,
            queue: files
        });
        if ((l=filesToAddToQueue.length)) {
            for (i = 0; i < l; i++) {
                this.addToQueue(filesToAddToQueue[i], node);
            }
        }
        if (!this.uploadInProgress) {
            // show upload activity list
            boxUploadActivity.show();
            btnCancelUploads.show();

            this.uploadNextFile();
        }
    },

    showFilesTooBigDialog: function(files) {
        if (files.length == 1) {
            util.alert(
                "Maximum file-size exceeded", "A file exceeds our upload limit of 50MB per file.",
                "Please remove the file '" + files[0] + "' from the list to continue."
            );
        }
        else {
            util.alert(
                "Maximum file-size exceeded", "Some files exceed our upload limit of 50MB per file.",
                "Please remove all files larger than 50MB from the list to continue."
            );
        }
    },

    checkSelectableFile: function(event) {
        if (event.selected && event.selected.getAttribute("type") == "fileupload")
            return false;
    },

    addToQueue: function(file, targetFolder, callback) {
        // add files in dirty state
        file.targetFolder = targetFolder;
        var path = file.targetFolder.getAttribute("path");

        var filepath;
        if (file.webkitRelativePath) {
            filepath = file.webkitRelativePath && file.webkitRelativePath.split("/");
            filepath.pop(); // remove filename from path
            filepath = filepath.join("/");
        }

        if (!filepath)
            file.path = path;
        else
            file.path = path + "/" + filepath;

        // add file to upload activity list
        this.addToQueueList(file);
        this.uploadQueue.push(file);

        callback && callback();
    },

    // add file to file tree
    addToFileTree: function(file) {
        var filename = apf.escapeXML(file.name);
        var path = apf.escapeXML(file.path) + "/" + filename;

        var treeNode = trFiles.getModel().queryNode("//file[@path=" + util.escapeXpathString(path) + "]");
        if (treeNode)
            apf.xmldb.removeNode(treeNode);

        var xmlNode = apf.n("<file />")
            .attr("type", "fileupload")
            .attr("name", filename)
            .attr("path", path)
            .node();

        file.treeNode = apf.xmldb.appendChild(file.targetFolder, xmlNode);
    },

    //add file to upload activity list
    addToQueueList: function(file) {
        file.queueNode = mdlUploadActivity.appendXml(apf.n("<file />").attr("name", file.name).node());
    },

    removeFromQueue: function(name) {
        var file;
        for (var i = this.uploadQueue.length - 1; i >= 0; --i) {
            file = this.uploadQueue[i];
            if (file.name == name) {
                this.uploadQueue.splice(i, 1);
                apf.xmldb.removeNode(file.queueNode);
                uploadactivityNumFiles.$ext.innerHTML = "(" + --this.totalNumUploads + ")";
                break;
            }
        }
    },

    removeCurrentUploadFile: function() {
        var file = this.currentFile;
        apf.xmldb.removeNode(file.queueNode);
        //apf.xmldb.removeNode(file.treeNode);
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
        if (this.cancelAllUploads)
            return this.uploadCanceled();

        var _self = this;
        uploadactivityNumFiles.$ext.innerHTML = "(" + this.totalNumUploads + ")";
        var file = this.currentFile = this.uploadQueue.shift();

        // check if there is a file to upload
        if (file) {
            var targetPath = file.targetFolder.getAttribute("path");
            var filepath;
            if (file.webkitRelativePath) {
                filepath = file.webkitRelativePath && file.webkitRelativePath.split("/");
                filepath.pop(); // remove filename from path
                filepath = filepath.join("/");
            }
            this.uploadInProgress = true;

            if (this.hideUploadActivityTimeout) {
                clearTimeout(this.hideUploadActivityTimeout);
                this.hideUploadActivityTimeout = null;
            }

            /** Chrome, Firefox */
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                function checkFileExists(exists) {
                    if (exists) {
                        if (_self.existingOverwriteAll) {
                            _self.overwrite();
                        }
                        else if (_self.existingSkipAll) {
                            _self.removeCurrentUploadFile();
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
                            uploadFileExistsMsg.$ext.innerHTML = "\"" + apf.escapeXML(file.name) +
                                "\" already exists, do you want to replace it? Replacing it will overwrite its current contents.";
                        }
                    }
                    else {
                        upload();
                    }
                }

                function upload() {
                    var file = _self.currentFile;

                    var targetFolder;
                    if (filepath) {
                        targetFolder = trFiles.getModel().data.selectSingleNode("//folder[@path=" +
                            util.escapeXpathString(targetPath + "/" + filepath) + "]");

                        // folder not exist yet, create first
                        if (!targetFolder) {
                            var subfolder;
                            var currentPath = targetPath;

                            var folders = filepath.split("/");
                            apf.asyncForEach(folders, function(folder, next) {
                                currentPath += "/" + folder;
                                subfolder = trFiles.getModel().data.selectSingleNode("//folder[@path=" + util.escapeXpathString(currentPath) + "]");

                                // subfolder is already created
                                if (subfolder) {
                                    trFiles.select(subfolder);
                                    next();
                                }
                                // subfolder does not exists, create first
                                else {
                                    fs.createFolder(folder, trFiles, true, function(folder) {
                                        if (!folder) {
                                            _self.removeFromQueue(file.name);
                                            _self.uploadNextFile();
                                        }
                                        // check if there are subfolders to be created
                                        subfolder = folder;
                                        next();
                                    });
                                }
                            }, function() {
                                if (_self.ignoreFiles.indexOf(file.name) > -1)
                                    return _self.uploadNextFile();

                                uploadNext(subfolder);
                            });
                        }
                        else {
                            uploadNext(targetFolder);
                        }
                    }
                    else {
                        uploadNext();
                    }

                    function uploadNext(targetFolder) {
                        if (_self.cancelAllUploads)
                            return _self.uploadCanceled();

                        if (targetFolder)
                            file.targetFolder = targetFolder;

                        _self.addToFileTree(file);

                        var node = file.queueNode;
                        apf.xmldb.setAttribute(node, "progress", 0);

                        if (!_self.worker)
                            _self.initWorker();

                        _self.worker.postMessage({
                            cmd: "connect",
                            id: file.name,
                            file: file,
                            path: file.targetFolder.getAttribute("path"),
                            _csrf: apf.config["csrf-token"]
                        });
                    }
                }
                _self.upload = upload;

                // check if file already exists in gotofile arraySearchResults
                /*
                var rootPath = trFiles.root.firstChild.getAttribute("path");
                var checkFilepath = (targetPath + (filepath ? "/" + filepath : "")).replace(rootPath, "") || "/";
                if (require("ext/gotofile/gotofile").arraySearchResults.indexOf(checkFilepath + file.name) > -1)
                    checkFileExists(true);
                else
                    upload();
                */

                fs.exists(apf.escapeXML(targetPath + (filepath ? "/" + filepath : "")) + "/" + file.name, checkFileExists);
            }
        }
        // no files in queue, upload completed
        else {
            uploadDone();
        }

        function uploadDone() {
            _self.uploadInProgress = false;
            _self.existingOverwriteAll = false;
            _self.existingSkipAll = false;
            btnCancelUploads.hide();
            (davProject.realWebdav || davProject).setAttribute("showhidden", settings.model.queryValue("auto/projecttree/@showhidden"));
            require("ext/tree/tree").refresh();
            _self.hideUploadActivityTimeout = setTimeout(function() {
                mdlUploadActivity.load("<data />");
                boxUploadActivity.hide();
            }, 5000);
        }
    },

    skip: function() {
        this.removeCurrentUploadFile();
        this.uploadNextFile();
    },

    skipAll: function() {
        this.existingSkipAll = true;
        this.skip();
    },

    overwrite: function() {
        var file = this.currentFile;
        var node = file.targetFolder;
        var path     = node.getAttribute("path");
        var filename = file.name;
        var treeNode = trFiles.getModel().queryNode("//file[@path=" + util.escapeXpathString(path + "/" + filename) + "]");
        if (treeNode)
            apf.xmldb.removeNode(treeNode);

        fs.remove(treeNode, this.upload);
    },

    overwriteAll: function() {
        this.existingOverwriteAll = true;
        this.overwrite();
    },

    onProgress: function(perc) {
        if (this.cancelAllUploads)
            return this.uploadCanceled();

        if(!this.currentFile) return;
        var total = Math.floor(perc * 100);
        var node = this.currentFile.queueNode;
        var curPerc = node.getAttribute("progress");
        apf.xmldb.setAttribute(node, "progress", Math.max(total, curPerc));
    },

    onComplete: function() {
        if (this.cancelAllUploads)
            return this.uploadCanceled();

        var _self = this;
        var file = this.currentFile;
        //var path = file.targetFolder.getAttribute("path");
        this.totalNumUploads--;
        apf.xmldb.setAttribute(file.queueNode, "progress", "100");

        apf.xmldb.setAttribute(file.treeNode, "type", "file");

        if (_self.openOnUpload) {
            if (file.size < MAX_OPENFILE_SIZE)
                ide.dispatchEvent("openfile", {doc: ide.createDocument(file.treeNode), origin: "upload"});
        }

        setTimeout(function() {
            if (!_self.lockHideQueue && file.queueNode)
                apf.xmldb.removeNode(file.queueNode);
            else
                _self.lockHideQueueItems.push(file);
        }, 1000);

        this.addNextFileToQueue();

        return _self.uploadNextFile();
    },

    addNextFileToQueue: function() {
        if (!this.uploadFiles[0] || !this.uploadFiles[0].queue[this.uploadIndex])
            this.uploadFiles.shift();

        if (!this.uploadFiles.length)
            return;

        // add next file to queue
        var nextfile;
        if (nextfile = this.uploadFiles[0].queue[++this.uploadIndex]) {
            if (this.ignoreFiles.indexOf(nextfile.name) > -1)
                return this.addNextFileToQueue();

            this.addToQueue(nextfile, this.uploadFiles[0].targetFolder);
        }
        else {
            this.uploadFiles.shift();
            this.uploadIndex = 0;
            return this.addNextFileToQueue();
        }
    },

    cancelAll: function() {
        this.cancelAllUploads = true;
        if (this.worker) // worker might not be initialized yet when canceling before first upload
            this.worker.postMessage({cmd: "cancelall"});
        this.uploadFiles = [];
        this.uploadQueue = [];

        mdlUploadActivity.load("<data />");
        boxUploadActivity.hide();

        (davProject.realWebdav || davProject).setAttribute("showhidden", settings.model.queryValue("auto/projecttree/@showhidden"));
        if (this.currentFile.treeNode)
            apf.xmldb.removeNode(this.currentFile.treeNode);
    },

    uploadCanceled: function() {
        this.uploadInProgress = false;
        this.cancelAllUploads = false;
        this.existingOverwriteAll = false;
        this.existingSkipAll = false;
        this.totalNumUploads = 0;
        (davProject.realWebdav || davProject).setAttribute("showhidden", settings.model.queryValue("auto/projecttree/@showhidden"));
        require("ext/tree/tree").refresh();
    },

    getFormData: function(file) {
        var form = new FormData();
        form.append("upload", file);

        return form;
    }
});

});
