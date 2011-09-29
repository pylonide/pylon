/**
 * Native drag 'n drop handling for Cloud9
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

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [tree],
    
    nodes: [],
    
    init: function() {
        if (typeof window.FileReader == "undefined")
            return;

        var _self  = this;
        var holders = [trFiles.$ext, tabEditors.$ext];
        var dropbox = document.createElement("div");
        
        apf.setStyleClass(dropbox, "draganddrop");
        dropbox.innerHtml = "Drop files here to upload";
        
        holders.forEach(function(holder) {
            dropbox = holder.dropbox = dropbox.cloneNode(false);
            holder.insertBefore(dropbox);
            
            holder.addEventListener("dragenter", dragEnter, false);
            dropbox.addEventListener("dragleave", dragLeave, false);
            dropbox.addEventListener("drop", dragDrop, false);
            
            ["dragexit", "dragover"].forEach(function(e) {
                dropbox.addEventListener(e, noopHandler, false);
            });
        });
        
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
            _self.onDrop(e);
        }
        
        function noopHandler(e) {
            apf.stopEvent(e);
        }
    },
    
    onDrop: function(e) {
        /** Check total filesize of dropped files */
        for (var size = 0, i = 0, l = e.dataTransfer.files.length; i < l; ++i)
            size += e.dataTransfer.files[i].size;

        if (size > MAX_UPLOAD_SIZE) {
            return util.alert(
                "Could not save document", "An error occurred while saving this document",
                "The file(s) you dropped exceeds the maximum of 50MB and could therefore not be uploaded."
            );
        }
        
        var files = e.dataTransfer.files;
        if (files.length < 1)
            return false;

        var _self = this;
        
        apf.asyncForEach(files, function(file, next) {
            /** Processing ... */
            var reader = new FileReader();
            /** Init the reader event handlers */
            reader.onloadend = _self.onLoadEnd.bind(_self, file, next);
            /** Begin the read operation */
            reader.readAsBinaryString(file);
        }, function() {});
    },
    
    onLoadEnd: function(file, next, e) {
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
            // lock == false, binary = [object]
            fs.webdav.write(path + "/" + file.name, e.target.result, false, {
                filename: file.name,
                filedataname: file.name,
                filesize: file.size,
                multipart: true
            }, complete);
        }
        
        function complete(data, state, extra) {
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
                return next();
            }
            
            fs.webdav.exec("readdir", [path], function(data) {
                if (data instanceof Error) {
                    // @todo: in case of error, show nice alert dialog
                    return next();
                }
                
                var strXml = data.match(new RegExp(("(<file path='" + path +
                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];

                var oXml = apf.xmldb.appendChild(node, apf.getXml(strXml));

                trFiles.select(oXml);
                if (file.size < MAX_OPENFILE_SIZE)
                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
                
                return next();
            });
        }
        
        fs.exists(path + "/" + file.name, check);
    },
    
    enable : function(){
    },
    
    disable : function(){
    },
    
    destroy : function(){
        //@todo Remove all events
    }
});

});