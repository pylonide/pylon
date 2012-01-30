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

module.exports = ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    commands: {
        "open": {
            "hint": "open a file to edit in a new tab",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        },
        "c9": {
            "hint": "alias for 'open'",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        }
    },

    readFile : function (path, callback){
        if (this.webdav)
            this.webdav.read(path, callback);
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

    createFolder: function(name, tree) {
        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;
        }

        var node = tree.selected;
        if (!node && tree.xmlRoot)
            node = tree.xmlRoot.selectSingleNode("folder");
        if (!node)
            return;
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
                } else {
                    tree.focus();
                    _self.webdav.exec("mkdir", [path, name], function(data) {
                        // @todo: in case of error, show nice alert dialog
                        if (data instanceof Error)
                            throw Error;

                        var strXml = data.match(new RegExp(("(<folder path='" + path
                                + "/" + name + "'.*?>)").replace(/\//g, "\\/")))[1];

                        tree.slideOpen(null, node, true, function(data, flag, extra){
                            var folder;
                            // empty data means it didn't trigger <insert> binding,
                            // therefore the node was expanded already
                            if (!data)
                                tree.add(apf.getXml(strXml), node);

                            folder = apf.queryNode(node, "folder[@path='"+ path +"/"+ name +"']");

                            tree.select(folder);
                            tree.startRename();
                        });
                    });
                }
            }

            name = prefix;
            this.exists(path + "/" + name, test);
        }
    },

    createFile: function(filename, newFile) {
        var node;

        if (!newFile) {
            node = trFiles.selected;
            if (!node)
                node = trFiles.xmlRoot.selectSingleNode("folder");
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
                trFiles.focus();

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
                                trFiles.select(file);
                                trFiles.startRename();
                            }
                        }

                        trFiles.slideOpen(null, node, true, function(){
                            both++;
                            done();
                        });

                        _self.webdav.exec("create", [path, filename], function(data) {
                            _self.webdav.exec("readdir", [path], function(data) {
                                if (data instanceof Error) {
                                    // @todo: should we display the error message in the Error object too?
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }

                                var m = data.match(new RegExp(("(<file path='" + path +
                                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")))
                                if (!m) {
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }
                                file = apf.getXml(m[1]);

                                both++;
                                done();
                            });
                        });
                    }
                    else {
                        node.setAttribute("name", filename);
                        node.setAttribute("path", path + "/" + filename);
                        ide.dispatchEvent("openfile", {doc: ide.createDocument(node), type:"newfile"});
                    }
                }
            };

            filename = prefix;
            this.exists(path + "/" + filename, test);
        }
    },

    beforeStopRename : function(name) {
        // Returning false from this function will cancel the rename. We do this
        // when the name to which the file is to be renamed contains invalid
        // characters
        var match = name.match(/^(?:\w|[.])(?:\w|[.-])*$/);

        return match !== null && match[0] == name;
    },

    beforeRename : function(node, name, newPath, isCopyAction) {
        var path = node.getAttribute("path");
        var page = tabEditors.getPage(path);

        if (name)
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        else
            name = newPath.match(/[^\/]+$/);

        node.setAttribute("oldpath", node.getAttribute("path"));
        node.setAttribute("path", newPath);
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

            // The 'name' variable is redeclared here for some fucked up reason.
            // The problem is that we are reusing that variable below. If the author
            // of this would be so kind to fix this code as soon as he sees this
            // comment, I would be eternally grateful. Sergi.
            var name = childNode.getAttribute("name");

            this.beforeRename(childNode, null, node.getAttribute("path") + "/" + name);
        }
        ide.dispatchEvent("updatefile", {
            path: path,
            filename: name && name.input,
            xmlNode: node
        });
    },

    beforeMove: function(parent, node, tree) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path),
            newpath = parent.getAttribute("path") + "/" + node.getAttribute("name");
            //webdav = this.webdav;

        // Check the newpath doesn't exists first
        // if (tree.getModel().queryNode("//node()[@path=\""+ newpath +"\"]")) {
        //             webdav.$undoFlag = true;
        //             util.alert("Error", "Unable to move", "Couldn't move to this "
        //               + "destination because there's already a node with the same name", function() {
        //                 tree.getActionTracker().undo();
        //                 tree.enable();
        //             });
        //             tree.enable();
        //             return false;
        //         }

        node.setAttribute("path", newpath);
        if (page)
            page.setAttribute("id", newpath);

        var childNodes = node.childNodes;
        var length = childNodes.length;

        for (var i = 0; i < length; ++i)
            this.beforeMove(node, childNodes[i]);

        ide.dispatchEvent("updatefile", {
            path: path,
            xmlNode: node
        });

        return true;
    },

    remove: function(path) {
        var page = tabEditors.getPage(path);
        if (page)
            tabEditors.remove(page);

        davProject.remove(path, false, function() {
//            console.log("deleted", path);
        });
    },

    /**** Init ****/

    init : function(amlNode){
        this.model = new apf.model();
        this.model.setAttribute("whitespace", false);

        var processing = {};
        this.model.addEventListener("update", function(e){
            //resort on move, copy, rename, add
            if (e.action == "attribute" || e.action == "add" || e.action == "move") {
                var xmlNode = e.xmlNode, pNode = xmlNode.parentNode;
                if (processing[xmlNode.getAttribute("a_id")])
                    return;
                processing[xmlNode.getAttribute("a_id")] = true;

                var sort = new apf.Sort();
                sort.set({xpath: "@name", method: "filesort"});
                var nodes = sort.apply(pNode.childNodes);

                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (nodes[i] == xmlNode) {
                        if (xmlNode.nextSibling != nodes[i+1])
                            apf.xmldb.appendChild(pNode, xmlNode, nodes[i+1]);
                        break;
                    }
                }
            }
        });

        var _self = this;
        _self.model.load("<data><folder type='folder' name='" + ide.projectName
            + "' path='" + ide.davPrefix + "' root='1'/></data>");

        var dav_url = location.href.replace(location.pathname + location.hash, "") + ide.davPrefix;
        this.webdav = new apf.webdav({
            id  : "davProject",
            url : dav_url,
            onauthfailure: function(e) {
                ide.dispatchEvent("authrequired");
            }
        });

        function openHandler(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "filesystem"
            });
            return false;
        }
        ide.addEventListener("consolecommand.open", openHandler);
        ide.addEventListener("consolecommand.c9",   openHandler);

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();
            var editor = e.doc.$page && e.doc.$page.$editor;

            apf.xmldb.setAttribute(node, "loading", "true");
            ide.addEventListener("afteropenfile", function(e) {
                if (e.node == node) {
                    apf.xmldb.removeAttribute(e.node, "loading");
                    ide.removeEventListener("afteropenfile", arguments.callee);
                }
            });

            if (doc.hasValue()) {
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
                return;
            }

            // do we have a value in cache, then use that one
            if (doc.cachedValue) {
                doc.setValue(doc.cachedValue);
                delete doc.cachedValue;
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
            }
            // if we're creating a new file then we'll fill the doc with nah dah
            else if ((e.type && e.type === "newfile") || Number(node.getAttribute("newfile") || 0) === 1) {
                doc.setValue("");
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
            }
            // otherwise go on loading
            else {
                // add a way to hook into loading of files
                if (ide.dispatchEvent("readfile", {doc: doc, node: node}) === false)
                    return;

                var path = node.getAttribute("path");

                /**
                 * Callback function after we retrieve response from jsdav
                 */
                var readfileCallback = function(data, state, extra) {
                    // verify if the request succeeded
                    if (state != apf.SUCCESS) {
                        // 404's should give a file not found, but what about others?
                        if (extra.status == 404) {
                            ide.dispatchEvent("filenotfound", {
                                node : node,
                                url  : extra.url,
                                path : path
                            });
                        }
                    }
                    else {
                        // populate the document
                        doc.setValue(data);
                        // fire event
                        ide.dispatchEvent("afteropenfile", { doc: doc, node: node, editor: editor });
                    }
                };
                
                // if we're not online, we'll add an event handler that listens to the socket connecting (or the ping or so)
                if (!ide.onLine) {
                    var afterOnlineHandler = function () {
                        fs.readFile(path, readfileCallback);
                        ide.removeEventListener("afteronline", afterOnlineHandler);
                    };
                    ide.addEventListener("afteronline", afterOnlineHandler);
                }
                else {
                    fs.readFile(path, readfileCallback);
                }
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
                } else if (state != apf.SUCCESS) {
                    if (extra.status == 404)
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                } else {
                   ide.dispatchEvent("afterreload", {doc : doc, data : data});
                }
            };

            fs.readFile(path, readfileCallback);
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
