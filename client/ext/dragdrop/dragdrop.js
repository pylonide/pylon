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

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [tree],
    
    init : function(){
        if (typeof window.FileReader == "undefined")
            return;

        var holders = [trFiles.$ext, tabEditors.$ext],
            _self   = this;
        holders.forEach(function(holder) {
            holder.ondragover = function() {
                apf.setStyleClass(this, "dragdrop_hover");
                return false;
            };
            holder.ondragend = function() {
                apf.setStyleClass(this, null, ["dragdrop_hover"]);
                return false;
            };
            holder.ondrop = function(e) {
                apf.setStyleClass(this, null, ["dragdrop_hover"]);
                e.preventDefault();
                _self.onDrop(e);
                return false;
            };
        });
    },
    
    onDrop: function(e) {
        // check total filesize of dropped files
        for (var size = 0, i = 0, l = e.dataTransfer.files.length; i < l; ++i)
            size += e.dataTransfer.files[i].size;

        var m50 = 52428800,
            m2  = 2097152;
        if (size > m50) {
            return util.alert("Could not save document", "An error occurred while saving this document",
                "The file(s) you dropped exceeds the maximum of 50MB and could therefore not be uploaded.");
        }

        apf.asyncForEach(e.dataTransfer.files, function(file, nextFile) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var node = trFiles.selected;
                if (!node)
                    node = trFiles.xmlRoot.selectSingleNode("folder");
                if (node.getAttribute("type") != "folder")
                    node = node.parentNode;
                var path     = node.getAttribute("path"),
                    filename = file.name,
                    index    = 0;
    
                var test = function(exists) {
                    if (exists) {
                        filename = file.name + "." + index++;
                        fs.exists(path + "/" + filename, test);
                    }
                    else {
                        // lock == false, binary = [object]
                        fs.webdav.write(path + "/" + file.name, e.target.result, false, {
                            filename    : file.name,
                            filedataname: file.name,
                            filesize    : file.size,
                            multipart   : true
                        }, function(data, state, extra){
                            if (state != apf.SUCCESS) {
                                util.alert(
                                    "Could not save document",
                                    "An error occurred while saving this document",
                                    "Please see if your internet connection is available and try again. "
                                        + (state == apf.TIMEOUT
                                            ? "The connection timed out."
                                            : "The error reported was " + extra.message));
                                return nextFile();
                            }
                            
                            fs.webdav.exec("readdir", [path], function(data) {
                                // @todo: in case of error, show nice alert dialog
                                if (data instanceof Error)
                                    return nextFile();
                                
                                var strXml = data.match(new RegExp(("(<file path='" + path +
                                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];

                                var oXml = apf.xmldb.appendChild(node, apf.getXml(strXml));

                                trFiles.select(oXml);
                                if (file.size < m2)
                                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
                                return nextFile();
                            });
                        });
                    }
                };
                
                fs.exists(path + "/" + file.name, test);
            };
            reader.readAsBinaryString(file);
        }, function() {});

        return false;
    },
    
    enable : function(){
    },
    
    disable : function(){
    },
    
    destroy : function(){
        //Remove all events
    }
});

});