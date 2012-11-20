/**
 * File System Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");

require("ext/main/main"); //Make sure apf is inited.

module.exports = ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    autodisable : ext.ONLINE | ext.LOCAL,
    
    createFileNodeFromPath : function (path, attributes) {
        var name = path.split("/").pop();
        var node = apf.n("<file />")
            .attr("name", name)
            .attr("contenttype", util.getContentType(name))
            .attr("type", "file")
            .attr("path", path);

        if (attributes !== undefined) {
            for (var a in attributes) {
                if (a.indexOf("date") >= 0)
                    attributes[a] = new Date(attributes[a]);
                node.attr(a, attributes[a]);
            }
        }

        return node.node();
    },

    createFolderNodeFromPath : function (path, attributes) {
        var name = path.split("/").pop();
        var node = apf.n("<folder />")
            .attr("name", name)
            .attr("path", path)
            .attr("type", "folder");

        if (attributes !== undefined) {
            for (var a in attributes) {
                if (a.indexOf("date") >= 0)
                    attributes[a] = new Date(attributes[a]);
                node.attr(a, attributes[a]);
            }
        }

        return node.node();
    },

    readFile : function (path, callback){
        if (!this.webdav) return;

        var self = this;

        // in webdav.read, if ide.onLine === 0, it is calling callback immediately without content
        // if we're not online, we'll add an event handler that listens to the socket connecting (or the ping or so)
        if (!ide.onLine) {
            var afterOnlineHandler = function () {
                self.webdav.read(path, callback);
                ide.removeEventListener("afteronline", afterOnlineHandler);
            };
            ide.addEventListener("afteronline", afterOnlineHandler);
        }
        else {
            // otherwise just redirect it
            this.webdav.read(path, callback);
        }
    },

    saveFile : function(path, data, callback) {
        if (!this.webdav)
            return;
        
        this.webdav.write(path, data, null, function(data, state, extra) {
            if ((state == apf.ERROR && extra.status == 400 && extra.retries < 3) || state == apf.TIMEOUT)
                return extra.tpModule.retry(extra.id);
                
            callback(data, state, extra);
        });
    },

    list : function(path, callback) {
        if (this.webdav)
            this.webdav.list(path, callback);
    },

    exists : function(path, callback) {
        if (this.webdav)
            this.webdav.exists(path, callback);
    },

    createFolder: function(name, tree, noRename, callback) {
        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;
        }

        var node = tree.selected;
        if (!node && tree.xmlRoot)
            node = tree.xmlRoot.selectSingleNode("folder");
        if (!node)
            return callback && callback();

        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = name ? name : "New Folder";
            var path = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }

            var _self = this,
                index = 0;

            function test(exists) {
                if (exists) {
                    name = prefix + "." + index++;
                    _self.exists(path + "/" + name, test);
                }
                else {
                    tree.focus();
                    _self.webdav.exec("mkdir", [path, name], function(data) {
                        // @todo: in case of error, show nice alert dialog
                        if (!data || data instanceof Error) {
                            callback && callback();
                            throw Error;
                        }

                        // parse xml
                        var nodesInDirXml = apf.getXml(data);
                        // we expect the new created file in the directory listing
                        var fullFolderPath = path + "/" + name;
                        var folder = nodesInDirXml
                            .selectSingleNode("//folder[@path=" + util.escapeXpathString(fullFolderPath) + "]");

                        // not found? display an error
                        if (!folder) {
                            util.alert("Error", "Folder '" + name + "' could not be created",
                                 "An error occurred while creating a new folder, please try again.");
                            callback && callback();
                            return;
                        }
                        tree.slideOpen(null, node, true, function(data, flag, extra){
                            // empty data means it didn't trigger <insert> binding,
                            // therefore the node was expanded already
                            if (!data)
                                tree.add(folder, node);

                            folder = apf.queryNode(node, "folder[@path="+ util.escapeXpathString(fullFolderPath) +"]");

                            tree.select(folder);

                            if (!noRename)
                                tree.startRename();

                            ide.dispatchEvent("newfolder", {
                                folderName: name,
                                parentPath: path,
                                path: fullFolderPath
                            });
                            callback && callback(folder);
                        });
                    });
                }
            }

            name = prefix;
            this.exists(path + "/" + name, test);
        }
    },

    createFile: function(filename, newFile, tree) {
        var node;

        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;
        }

        if (!newFile) {
            node = tree.selected;
            if (!node)
                node = tree.xmlRoot.selectSingleNode("folder");
            if (node.getAttribute("type") != "folder" && node.tagName != "folder")
                node = node.parentNode;
        }
        else {
            node = apf.getXml('<file newfile="1" type="file" size="" changed="1" '
                + 'name="Untitled.txt" contenttype="text/plain; charset=utf-8" '
                + 'modifieddate="" creationdate="" lockable="false" hidden="false" '
                + 'executable="false"></file>');
        }

        if (this.webdav) {
            var prefix = filename ? filename : "Untitled";

            if(!newFile)
                tree.focus();

            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }

            var index = 0;

            var test = function(exists) {
                if (exists) {
                    filename = prefix + "." + index++;
                    _self.exists(path + "/" + filename, test);
                }
                else {
                    if (!newFile) {
                        var file
                        var both = 0;
                        function done(){
                            if (both == 2) {
                                file = apf.xmldb.appendChild(node, file);
                                tree.select(file);
                                tree.startRename();
                                tree.slideOpen(null, node, true);
                            }
                        }

                        tree.slideOpen(null, node, true, function(){
                            both++;
                            done();
                        });

                        _self.webdav.exec("create", [path, filename], function(data) {
                            _self.webdav.exec("readdir", [path], function(data) {
                                if (!data || data instanceof Error) {
                                    // @todo: should we display the error message in the Error object too?
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }

                                // parse xml
                                var filesInDirXml = apf.getXml(data);

                                // we expect the new created file in the directory listing
                                var fullFilePath = path + "/" + filename;
                                var nodes = filesInDirXml
                                    .selectNodes("//file[@path=" + util.escapeXpathString(fullFilePath) + "]");

                                // not found? display an error
                                if (nodes.length === 0) {
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }

                                file = nodes[0];

                                both++;
                                ide.dispatchEvent("newfile", {
                                    fileName: filename,
                                    parentPath: path,
                                    path: fullFilePath
                                });
                                done();
                            });
                        });
                    }
                    else {
                        node.setAttribute("name", filename);
                        node.setAttribute("path", path + "/" + filename);

                        editors.gotoDocument({doc: ide.createDocument(node), type:"newfile", origin: "newfile"});
                    }
                }
            };

            filename = prefix;
            this.exists(path + "/" + filename, test);
        }
    },

    getFileNode : function(path) {
        return this.model.queryNode("//node()[@path="
            + util.escapeXpathString(path) + "]");
    },

    // this path does not exist, keeping checking parents and make them first
    createFolderTree : function(path) {
        var _self = this;
        var dirsToMake = [];

        do {
            dirsToMake.unshift(path);
            path = path.substr(0, path.lastIndexOf("/"));
        } while (this.model.queryNode("//node()[@path="
            + util.escapeXpathString(path) + "]") === null
            && path && path != ide.davPrefix);

        dirsToMake.forEach(function(dir) {
            var parentDir = dir.substring(0, dir.lastIndexOf("/"));

            _self.model.appendXml(_self.createFolderNodeFromPath(dir),
              "//node()[@path=" + util.escapeXpathString(parentDir) + "]");
        });
    },

    beforeRename : function(node, name, newPath, isCopyAction, isReplaceAction) {
        var path = node.getAttribute("path");
        var page = tabEditors.getPage(path);
        
        if (name) {
            // Returning false from this function will cancel the rename. We do this
            // when the name to which the file is to be renamed contains invalid
            // characters
            var match = name.match(/^(?:\w|[.])(?:\w|[.-])*$/);
            if (!(match !== null && match[0] == name)) {
                return false;
            }
            
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        }
        else
            name = newPath.match(/[^\/]+$/);

        node.setAttribute("oldpath", node.getAttribute("path"));
        node.setAttribute("path", newPath);
        if (isCopyAction || node.getAttribute("name") != name)
            apf.xmldb.setAttribute(node, "name", name);

        // when this is a copy action, then we don't want this to happen
        if (page && !isCopyAction)
            page.setAttribute("id", newPath);

        var childNodes = node.childNodes;
        var length = childNodes.length;

        for (var i = 0; i < length; ++i) {
            var childNode = childNodes[i];
            if(!childNode || childNode.nodeType != 1)
                continue;

            this.beforeRename(childNode, null,
                node.getAttribute("path") + "/" + childNode.getAttribute("name"));
        }

        ide.dispatchEvent("updatefile", {
            path: path,
            newPath: newPath,
            filename: name && name[0],
            xmlNode: node,
            replace: isReplaceAction,
            isFolder: node.getAttribute("type") === "folder"
        });
        
        // let us continue!
        return true;
    },

    beforeMove: function(parent, node) {
        var path = node.getAttribute("path");
        var newPath = parent.getAttribute("path") + "/" + node.getAttribute("name");
        node.setAttribute("oldpath", path);
        node.setAttribute("path", newPath);

        var page = tabEditors.getPage(path);
        if (page)
            page.setAttribute("id", newPath);

        var length = node.childNodes.length;
        for (var i = 0; i < length; ++i) {
            this.beforeMove(node, node.childNodes[i]);
        }

        ide.dispatchEvent("updatefile", {
            path: path,
            newPath: newPath,
            xmlNode: node,
            isFolder: node.getAttribute("type") === "folder"
        });

        return true;
    },

    remove: function(node, callback) {
        var path = node.getAttribute("path");
        var page = tabEditors.getPage(path);
        if (page) {
            tabEditors.remove(page);
        }

        // This is a very expensive way to find out whether the item to be
        // removed is a file or a folder, since it involves creating a new model
        // with the filesystem listing data, since the file node has already
        // been removed from this module's model.
        davProject.list(path, function(modelString) {
            var model = new apf.model();
            model.load(modelString);

            var nodeToRemove = model.queryNode("//node()[@path=" + util.escapeXpathString(path) + "]");
            var isFolder = nodeToRemove && nodeToRemove.getAttribute("type") === "folder";
            var cb = function(data, state, extra) {
                // In WebDAV, a 204 status from the DELETE verb means that the
                // file was removed successfully.
                if (extra && extra.status && extra.status === 204) {
                    ide.dispatchEvent("removefile", {
                            path: path,
                            isFolder: isFolder
                    });
                }

                if (callback)
                    callback(data, state, extra);
            };
            davProject.remove(path, false, cb);
        });
    },

    init : function() {
        commands.addCommand({
            name : "open",
            hint: "open a file to edit in a new tab",
            commands: {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        });
        commands.addCommand({
            name: "c9",
            hint: "alias for 'open'",
            commands: {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        });

        this.model = new apf.model();
        this.model.load("<data><folder type='folder' name='" + ide.projectName +
            "' path='" + ide.davPrefix + "' root='1'/></data>");

        this.model.setAttribute("whitespace", false);

        var dav_url = location.href.replace(location.pathname + location.hash, "") + ide.davPrefix;
        this.webdav = apf.document.documentElement.appendChild(new apf.webdav({
            id  : "davProject",
            url : dav_url,
            onauthfailure: function() {
                ide.dispatchEvent("authrequired");
            }
        }));

        function openHandler(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "filesystem",
                extra: e.data.extra
            });
            return false;
        }
        ide.addEventListener("consolecommand.open", openHandler);
        ide.addEventListener("consolecommand.c9",   openHandler);

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();

            // This make the tab animation nicer.
            function dispatchAfterOpenFile(){
                setTimeout(function(){
                    ide.dispatchEvent("afteropenfile", {doc: doc, node: node});
                }, 150);
            }

            apf.xmldb.setAttribute(node, "loading", "true");
            ide.addEventListener("afteropenfile", function(e) {
                if (e.node == node) {
                    apf.xmldb.removeAttribute(e.node, "loading");
                    ide.removeEventListener("afteropenfile", arguments.callee);
                }
            });

            if (doc.hasValue()) {
                dispatchAfterOpenFile();
                return;
            }

            // do we have a value in cache, then use that one
            if (doc.cachedValue) {
                doc.setValue(doc.cachedValue);
                delete doc.cachedValue;
                dispatchAfterOpenFile();
            }
            // if we're creating a new file then we'll fill the doc with nah dah
            else if ((e.type && (e.type === "newfile" || e.type == "nofile"))
              || Number(node.getAttribute("newfile") || 0) === 1) {
                doc.setValue("");
                dispatchAfterOpenFile();
            }
            // otherwise go on loading
            else {
                // add a way to hook into loading of files
                if (ide.dispatchEvent("readfile", {doc: doc, node: node, origin: e.origin || "fs"}) === false)
                    return;

                var path = node.getAttribute("path");

                /**
                 * Callback function after we retrieve response from jsdav
                 */
                var readfileCallback = function(data, state, extra) {
                    // verify if the request succeeded
                    if (state != apf.SUCCESS) {
                        // 404's should give a file not found, but what about others?
                        // for clarity we'll console.log some info; so it'll help us debug it
                        // in case it would happen actually
                        if (extra.status !== 404) {
                            console.log("Opening file failed for", path, "server responded with", state, extra);
                        }

                        // now invoke filenotfound every time
                        // because we can't be sure about the state so force a close of the file tab
                        // this will prevent things like empty files, etc.
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                    }
                    else {
                        //doc.addEventListener("editor.ready", function(){
                            // populate the document
                            doc.setValue(data);

                            // fire event
                            dispatchAfterOpenFile();
                        //});
                    }
                };

                // offline / online detection has been moved into fs.readFile instead
                fs.readFile(path, readfileCallback);
            }
        });

        ide.addEventListener("reload", function(e) {
            var doc  = e.doc,
                node = doc.getNode(),
                path = node.getAttribute("path");

            /**
             * This callback is executed when the file is read, we need to check
             * the current state of online/offline
             */
            var readfileCallback = function(data, state, extra) {
                if (state == apf.OFFLINE) {
                    ide.addEventListener("afteronline", function(e) {
                        fs.readFile(path, readfileCallback);
                        ide.removeEventListener("afteronline", arguments.callee);
                    });
                }
                else if (state != apf.SUCCESS) {
                    if (extra.status == 404)
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                }
                else {
                   ide.dispatchEvent("afterreload", {doc : doc, data : data});
                }
            };

            fs.readFile(path, readfileCallback);
        });
    },

    destroy : function(){
        commands.removeCommandsByName(["open", "c9"]);
        this.webdav.destroy(true, true);
        this.model.destroy(true, true);
    }
});

});
