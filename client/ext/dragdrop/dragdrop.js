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
var tree = require("ext/tree/tree");

var MAX_UPLOAD_SIZE = 52428800;
var MAX_OPENFILE_SIZE = 2097152;
var MAX_CONCURRENT_FILES = 10;

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [tree],
    
    nodes: [],
        
    init: function() {
        if (!apf.hasDragAndDrop)
            return;

        this.nodes.push(trFiles.$ext, tabEditors.$ext);
        var dropbox = document.createElement("div");
        
        apf.setStyleClass(dropbox, "draganddrop");
        dropbox.innerHtml = "Drop files here to upload";
        
        this.nodes.forEach(function(holder) {
            dropbox = holder.dropbox = dropbox.cloneNode(false);
            holder.appendChild(dropbox);
            
            holder.addEventListener("dragenter", dragEnter, false);
            dropbox.addEventListener("dragleave", dragLeave, false);
            dropbox.addEventListener("drop", dragDrop, false);
            
            ["dragexit", "dragover"].forEach(function(e) {
                dropbox.addEventListener(e, noopHandler, false);
            });
        });
        
        var _self  = this;
        
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
    },
    
    onBeforeDrop: function(e) {
        if (!(window.File && window.FileReader)) {
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
        var _self = this;
        var files = e.dataTransfer.files;
        
        apf.asyncForEach(files, function(file, next) {
            /** Processing ... */
            var reader = new FileReader();
            /** Init the reader event handlers */
            reader.onloadend = _self.onLoad.bind(_self, file, next);
            /** Begin the read operation */
            reader.readAsBinaryString(file);
        }, function() {});
    },
    
    onLoad: function(file, next, e) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
            
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;
            
        var path     = node.getAttribute("path");
        var filename = file.name;
        var index    = 0;

        function check(exists) {
            if (exists) {
                filename = file.name + "." + index++;
                fs.exists(path + "/" + filename, check);
            } else
                send();
        }
        
        function send() {
            oBinary = {filename: file.name, filesize: file.size/*, filedataname: file.name, multipart: true*/};
            /**
             * jsDav still does not implement multipart content parsing.
             * Also _only_ Firefox 3.6+ implements XHR.sendAsBinary() so far,
             * therefore we are forced to send data encoded as base64 to make this work
             */
            fs.webdav.write(path + "/" + file.name, e.target.result, false, oBinary, complete);
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
                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];

                var oXml = apf.xmldb.appendChild(node, apf.getXml(strXml));

                trFiles.select(oXml);
                if (file.size < MAX_OPENFILE_SIZE)
                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
                
                next();
            });
        }
        
        /** Check if path already exists, otherwise continue with send() */
        fs.exists(path + "/" + file.name, check);
    },
    
    enable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.addEventListener(e, _self.dragStateEvent[e], false);
        });
    },
    
    disable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
    },
    
    destroy: function() {
        var _self = this;
        this.nodes.each(function(item){
            item.removeChild(item.dropbox);
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        this.nodes = [];
    }
});

});