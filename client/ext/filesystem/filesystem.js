/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/filesystem/filesystem",
    ["core/ide", "core/ext"], function(ide, ext) {

return ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],

    readFile : function (path, callback){
        if (this.webdav)
            this.webdav.read(path, callback);
    },

    saveFile : function(path, data, callback) {
        if (this.webdav)
            this.webdav.write(path, data, null, callback);
    },

    createFolder: function(name) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            if (!name)
                name = "New Folder";
            var path = node.getAttribute("path");
            if (!path) {
                path = require("ext/noderunner/noderunner").davPrefix;
                node.setAttribute("path", path);
            }
            trFiles.focus();
            this.webdav.exec("mkdir", [path, name], function(data) {
                // @todo: in case of error, show nice alert dialog
                if (data instanceof Error)
                    throw Error;
                if (data.indexOf("<folder") > -1) {
                    trFiles.insert(data, {
                        insertPoint: node,
                        clearContents: true
                    });
                }
                trFiles.select(node.selectSingleNode("folder[@name='" + name + "']"));
                trFiles.startRename();
            });
        }
    },

    createFile: function(filename) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            if (!filename)
                filename = "Untitled.txt";

            trFiles.focus();
            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = require("ext/noderunner/noderunner").davPrefix;
                node.setAttribute("path", path);
            }
            this.webdav.exec("create", [path, filename], function(data) {
                _self.webdav.exec("readdir", [path], function(data) {
                    if (data.indexOf("<file") > -1) {
                        trFiles.insert(data, {
                            insertPoint: node,
                            clearContents: true
                        });
                    }
                    trFiles.select(node.selectSingleNode("file[@name='" + filename + "']"));
                    trFiles.startRename();
                });
            });
        }
    },

    afterRename: function(data, state, extra) {
        if (state !== apf.SUCCESS)
            return;
        var node = trFiles.xmlRoot.selectSingleNode("//node()[@path='" + extra.originalArgs[1] + "']"),
            base = extra.originalArgs[1].substr(0, extra.originalArgs[1].lastIndexOf("/") + 1),
            page = tabEditors.getPage(extra.originalArgs[1]);
        apf.xmldb.setAttribute(node, "path", base + extra.originalArgs[0]);
        if (page) {
            page.setAttribute("caption", node.getAttribute("name"));
            page.setAttribute("id", base + extra.originalArgs[0]);
        }
    },

    afterMove: function(data, state, extra) {
        var selected = trFiles.selected ? trFiles.selected.getAttribute("path") : null;
        if (state == apf.SUCCESS) {
            var node = trFiles.xmlRoot.selectSingleNode("//folder[@path='" + extra.originalArgs[1] + "']"),
                page = tabEditors.getPage(extra.originalArgs[0]);
            if (page) {
                page.setAttribute("caption", node.getAttribute("name"));
                page.setAttribute("id", extra.originalArgs[1]);
            }
        }
        else {
            node = trFiles.xmlRoot.selectSingleNode("//folder[@path='" + extra.originalArgs[0] + "']");
        }
        if (!node)
            return;
        this.webdav.exec("readdir", [node.getAttribute("path")], function(data) {
            if (data.indexOf("<folder") > -1) {
                trFiles.insert(data, {
                    insertPoint: node,
                    clearContents: true
                });
            }
            if (selected)
                trFiles.select(node.selectSingleNode("//node()[@path='" + selected + "']"));
        });
    },

    remove: function(path) {
        var page = tabEditors.getPage(page);
        if (page)
            tabEditors.remove(page);

        davProject.remove(path, false, function() {
            console.log("deleted", path);
        });
    },

    /**** Init ****/

    init : function(amlNode){
        this.model = new apf.model();
        this.model.load("<data><folder type='folder' name='Project' path='/workspace' /></data>");

        var url;
        if (location.host) {
            this.webdav = new apf.webdav({
                id  : "davProject",
                url : location.protocol + "//" + location.host + "/workspace"
            });
            url = "{davProject.getroot()}";
        }
        else {
            url = "ext/filesystem/files.xml";
            this.readFile = this.saveFile = apf.K;
        }

        this.model.insert(url, {
            insertPoint : this.model.queryNode("folder[@name='Project']")
        });

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var node = e.node;

            if (node.selectSingleNode("data")) {
                ide.dispatchEvent("afteropenfile", {node: node});
                return;
            }

            var path = node.getAttribute("path");
            fs.readFile(path, function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    if (extra.status == 404) {
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                    }
                }
                else {
                    var match = data.match(/^.*?(\r?\n)/m);
                    if (match && match[1] == "\r\n")
                        var nl = "windows";
                    else
                        nl = "unix";

                    var doc = node.ownerDocument;
                    var xml = doc.createElement("data");
                    xml.appendChild(doc.createTextNode(data));
                    xml.setAttribute("newline", nl);
                    apf.b(node).append(xml);

                    ide.dispatchEvent("afteropenfile", {node: node});
                }
            });
        });
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        this.webdav.destroy(true, true);
        this.model.destroy(true, true);
    }
});

});