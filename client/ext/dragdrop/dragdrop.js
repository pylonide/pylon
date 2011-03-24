/**
 * Native drag 'n drop handling for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs  = require("ext/filesystem/filesystem");

return ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [],
    
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
        var file   = e.dataTransfer.files[0],
            reader = new FileReader();
        reader.onload = function(e) {
            console.log(e.target.result);

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
                    fs.saveFile(path + "/" + file.name, e.target.result, function(data, state, extra){
                        if (state != apf.SUCCESS) {
                            util.alert(
                                "Could not save document",
                                "An error occurred while saving this document",
                                "Please see if your internet connection is available and try again. "
                                    + (state == apf.TIMEOUT
                                        ? "The connection timed out."
                                        : "The error reported was " + extra.message));
                        }
                        
                        fs.webdav.exec("readdir", [path], function(data) {
                            // @todo: in case of error, show nice alert dialog
                            if (data instanceof Error)
                                throw Error;
                            
                            var strXml = data.match(new RegExp(("(<file path='" + path +
                                "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];
        
                            var file = apf.xmldb.appendChild(node, apf.getXml(strXml));
                            
                            trFiles.select(file);
                            ide.dispatchEvent("openfile", {doc: ide.createDocument(file)});
                        });
                    });
                }
            };
            
            fs.exists(path + "/" + file.name, test);
        };
        reader.readAsText(file);
        
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