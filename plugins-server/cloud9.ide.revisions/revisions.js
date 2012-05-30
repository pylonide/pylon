/**
 * Revisions Server module for Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

require("amd-loader");
var Plugin = require("../cloud9.core/plugin");
var Diff_Match_Patch = require("./diff_match_patch");
//var Fs = require("fs");
var Path = require("path");
//var PathUtils = require("./path_utils.js");
//var Spawn = require("child_process").spawn;
var Async = require("async");

/**
 *  FILE_SUFFIX = "c9save"
 *
 *  Suffix (extension) for revision files.
 **/
var FILE_SUFFIX = "c9save";

/** related to: Revisions#docQueue
 *  SAVE_INTERVAL = 1000
 *
 *  The queue will be inspected every SAVE_INTERVAL milliseconds for new documents
 *  to be saved.
 **/
var SAVE_INTERVAL = 1000;

/** related to: Revisions#revisions
 *  PURGE_INTERVAL -> 1 hour
 *
 *  Revision cache will be purged every PURGE_INTERVAL to clear up unfreed memory.
 **/
var Diff = new Diff_Match_Patch();
var name = "revisions";

var IMPORTS;

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, RevisionsPlugin, register);
    
    IMPORTS = {
        fs: imports["sandbox.fs"]
    };
};

var RevisionsPlugin = module.exports.RevisionsPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    var self = this;
    this.hooks = ["command"];
    this.docQueue = [];
    this.name = name;

    // This queue makes sure that changes are saved asynchronously but orderly
    this.savingQueue = Async.queue(function(data, callback) {
        self.saveSingleRevision(data.path, data.revision, function(err, revisionInfo) {
            callback(err, revisionInfo);
        });
    }, 1);

    this.saveInterval = setInterval(this.saveQueue.bind(this), SAVE_INTERVAL);
};

require("util").inherits(RevisionsPlugin, Plugin);

(function() {
    this.command = function(user, message, client) {
        if (!message.command || message.command !== "revisions") {
            return false;
        }

        var self = this;
        if (message.subCommand) {
            switch (message.subCommand) {
                // Let the server save a revision. The client is requesting the
                // server to save a revision, and the server will figure out the
                // diff. The client sends a few parameters to the server in the
                // `message` object.
                case "saveRevisionFromMsg":
                    if (!message.path) {
                        return console.error("saveRevisionFromMsg: No path sent for the file to save");
                    }
                    this.enqueueDoc(user, message, client);
                    break;

                // Directly save a revision. The revision has been precomputed
                // on the client as is merely passed to the server in order to
                // save it.
                case "saveRevision":
                    if (!message.path) {
                        return console.error("saveRevision: No path sent for the file to save");
                    }

                    this.savingQueue.push({
                        path: message.path,
                        revision: message.revision
                    }, function(err, revisionInfo) {
                        if (err) {
                            return console.error(err);
                        }
                    
                        if (!self.isCollab()) {
                            self.broadcastConfirmSave(message.path, revisionInfo.revision);
                            if (message.forceRevisionListResponse === true) {
                                self.getAllRevisions(revisionInfo.absPath, function(err, revObj) {
                                    self.broadcastRevisions.call(self, revObj, user, {
                                        path: message.path
                                    });
                                });
                            }
                        }
                        else {
                            this.getRevisions(message.path, function(err, revObj) {
                                if (err) {
                                    return console.error("There was a problem retrieving the revisions" + " for the file " + message.path + ":\n", err);
                                }
                    
                                self.broadcastRevisions.call(self, revObj, null, {
                                    path: message.path
                                });
                            });
                        }
                    });
                    break;

                // The client requests the history of revisions for a particular
                // document (indicated by `path`). The client might also want the
                // original contents of that file (the ones where diffs are applied
                // in order to get the current file).
                case "getRevisionHistory":
                    if (!message.path) {
                        return console.error("getRevisionHistory: No path sent for the file to save");
                    }

                    this.getRevisions(message.path, function(err, revObj) {
                        if (err) {
                            return console.error(
                                "There was a problem retrieving the revisions" +
                                " for the file " + message.path + ":\n", err);
                        }

                        self.broadcastRevisions.call(self, revObj, user, {
                            id: message.id || null,
                            nextAction: message.nextAction,
                            path: message.path
                        });
                    });
                    break;

                case "getRealFileContents":
                    console.log("Revisions getRealFileContents", message.path);
                    IMPORTS.fs.readFile(message.path, "utf8", function (err, data) {
                          if (err) {
                              console.log(err);
                          }

                          user.broadcast(JSON.stringify({
                              type: "revision",
                              subtype: "getRealFileContents",
                              path: message.path,
                              nextAction: message.nextAction,
                              contents: data
                          }));
                    });
                    break;

                case "closeFile":
                    if (!message.path) {
                        return console.error("closeFile: No path sent for the file to save");
                    }
                    break;
            }
        }
        return true;
    };

    /**
     * RevisionsPlugin#createEmptyStack(path) -> Object
     * - path (String): relative path of the file to create revisions for
     *
     * Creates an empty revisions object. This function is usually called when
     * a backup file is not found for the file in the `path`.
     **/
    this.createEmptyStack = function() {
        return { "revisions": {} };
    };

    this.getAllRevisions = function(absPath, callback) {
        var revObj = {};
        IMPORTS.fs.readFile(absPath, function(err, data) {
            if (err) {
                return callback(err);
            }

            var lines = data.toString().split("\n");

            Async.forEachSeries(lines,
                function(line, next) {
                    if (line) {
                        var revision = JSON.parse(line);
                        revObj[revision.ts] = revision;
                    }
                    next();
                },
                function() { callback(null, revObj); });
        });
    };
    
    /**
     * RevisionsPlugin#getRevisionsPath(filePath)
     * - filePath (String): relative path of the actual file
     * 
     * Creates the path to a relevant revisions file for a given file
     **/
    this.getRevisionsPath = function(filePath) {
        return Path.join(".c9revisions", filePath);
    };

    /**
     * RevisionsPlugin#getRevisions(filePath, callback)
     * - filePath (String): relative path of the file to get revisions for
     * - callback (Function): callback to be called with the revisions object,
     * or error
     *
     * Retrieves the revisions object for a particular file. If it doesn't exist,
     * it will create one and return that. If there is any problem, it will call
     * the `callback` function with the error as the first argument.
     **/
    this.getRevisions = function(filePath, callback) {
        // Physical location of the workspace
        if (!this.ide.workspaceDir) {
            return callback(new Error(
                "Can't retrieve the path to the user's workspace\n" + this.workspace));
        }

        // Path of the final backup file inside the workspace
        var absPath = this.getRevisionsPath(filePath + "." + FILE_SUFFIX);
        // Path to the directory wherein the revisions file stays
        var parentDir = this.getRevisionsPath(Path.dirname(filePath));

        var self = this;
        
        // does the revisions file exists?
        IMPORTS.fs.exists(absPath, function (err, exists) {
            console.log("GETREV", absPath, exists);
            if (err)
                return callback(err);

            if (exists) {
                self.getAllRevisions(absPath, callback);
            }
            else {
                // otherwise read the original file
                IMPORTS.fs.readFile(filePath, function(err, data) {
                    if (err) {
                        return callback(err);
                    }
                    
                    // create a parent dir if not exists
                    IMPORTS.fs.exists(parentDir, function(err, exists) {
                        if (err) {
                            return callback(err);
                        }
                    
                        // and create the first version of a revisions file
                        var createRevisionsFile = function(err) {
                            if (err) return callback(err);
                
                            // We just created the revisions file. Since we
                            // don't have a 'previous revision, our first revision will
                            // consist of the previous contents of the file.
                            var contents = data.toString();
                            var ts = Date.now();
                            var revision = {
                                ts: ts,
                                silentsave: true,
                                restoring: false,
                                patch: [Diff.patch_make("", contents)],
                                length: contents.length
                            };
                            var revisionString = JSON.stringify(revision);
                            var revObj = {};
                            revObj[ts] = revision;
                
                            IMPORTS.fs.writeFile(absPath, revisionString + "\n", function(err) {
                                if (err) {
                                    return callback(err);
                                }
                                callback(null, revObj);
                            });
                        };
                    
                        if (!exists) {
                            IMPORTS.fs.mkdir(parentDir, "0755", createRevisionsFile);
                        }
                        else {
                            createRevisionsFile();
                        }
                    
                    });
                });
            }
        });
    };

    /**
     * RevisionsPlugin#retrieveRevisionContent(revObj[, upperTSBound], callback)
     * - revObj (Object): Object containing all the revisions in the document.
     * - upperTSBound (Number): Timestamp of the revision to retrieve. Optional.
     * - currentDoc (Function): Callback to pass the results to.
     *
     * Asynchronoulsy calculates the content of the documentat a particular
     * revision, or defaults to the current content of the document according to
     * the last revision.
     **/
    this.retrieveRevisionContent = function(revObj, upperTSBound, callback) {
        var timestamps = Object.keys(revObj.revisions).sort(function(a, b) {
            return a - b;
        });

        if (timestamps.length === 0) {
            return callback(new Error("No revisions in the revisions Object"));
        }

        if (upperTSBound) {
            var index = timestamps.indexOf(upperTSBound);
            if (index > -1) {
                timestamps = timestamps.slice(0, index + 1);
            }
        }

        var content = "";
        Async.list(timestamps)
            .each(function(ts, next) {
                var revision = revObj.revisions[ts];
                content = Diff.patch_apply(revision.patch[0], content)[0];
                next();
            })
            .delay(0)
            .end(function() {
                callback(null, content);
            });
    };

    /**
     * RevisionsPlugin#getPreviousRevisionContent(path, callback)
     * - path (String): Relative path for the file to retrieve contents from
     * - callback (Function): Function that will be called with the previous contents
     * of that file.
     *
     * Retrieves the previous contents of the given file.
     **/
    this.getPreviousRevisionContent = function(path, callback) {
        this.getRevisions(path, function(err, revObj) {
            if (err) {
                return callback(err);
            }

            this.retrieveRevisionContent(revObj, null, function(err, content) {
                if (err)
                    return callback(err);

                callback(null, content);
            });
        });
    };

    /**
     * RevisionsPlugin#getCurrentDoc(path, message) -> String
     * - path (String): Relative path for the file to get the document from
     * - message (Object): Object with metadata of the document being retrieved.
     *
     * Retrieves the current document. In case the `message` object contains a
     * non-empty `content` property, it will just use that, understanding that
     * we are not in collaborative mode. Otherwise it will retrieve the document
     * from the Concorde session object.
     **/
    this.getCurrentDoc = function(path, message) {
        if (message && message.content) {
            // Means that the client has detected we are NOT in concorde mode,
            // in which case we can't retrieve the current contents of the
            // document, so the client sends them along. There is no risk of
            // syncing problems since the client is only one.
            return message.content;
        }

        path = this.getSessionStylePath.call(this, path);

        var sessions = this.workspace.plugins.concorde.server.getSessions();
        var docSession = sessions[path];
        if (docSession && docSession.getDocument) {
            return (docSession.getDocument() || "").toString();
        }
    };

    // temp ported this from `path_utils.js`
    this.getSessionStylePath = function (path) {
        var baseUrl = this.ide.options.baseUrl;
        var baseUrlRegex = new RegExp("^" + baseUrl);
        if (!baseUrlRegex.test(path)) {
            path = Path.join(baseUrl, path);
        }
        return path.replace(/^\/+/, "");
    };

    this.isCollab = function() {
        return false;
    };

    /**
     * RevisionsPlugin#broadcastRevisions(revObj[, user])
     * - obj (Object): Object to be broadcasted.
     * - user (Object): Optional. Particular user to whom we want to broadcast
     * - options (Object): Optional. Properties to attach to the `data` object.
     *
     * Broadcast the given revision to all workspace clients.
     **/
    this.broadcastRevisions = function(revObj, user, options) {
        var receiver = user || this.ide;
        var data = {
            type: "revision",
            subtype: "getRevisionHistory",
            body: { revisions: revObj }
        };

        if (options) {
            Object.keys(options).forEach(function(key) {
                data[key] = options[key];
            });
        }

        receiver.broadcast(JSON.stringify(data));
    };

    this.broadcastConfirmSave = function(path, ts) {
        this.ide.broadcast(JSON.stringify({
            type: "revision",
            subtype: "confirmSave",
            path: path,
            ts: ts
        }));
    };

    this.enqueueDoc = function(user, message, client) {
        var path = message.path;
        var docExists = this.docQueue.some(function(doc) {
            return doc[1].path === path;
        });

        if (!docExists) {
            this.docQueue.push([user, message]);
        }
    };

    this.saveQueue = function() {
        var f = function(){};
        while (this.docQueue.length > 0) {
            var doc = this.docQueue.shift();
            this.saveRevisionFromMsg(doc[0], doc[1], f);
        }
    };

    this.saveRevisionFromMsg = function(user, message, callback) {
        var self = this;
        var path = message.path;
        var currentDoc = this.getCurrentDoc(path, message);

        this.getPreviousRevisionContent(path, function(err, previousRev) {
            if (err) {
                return callback(err);
            }

            if (typeof currentDoc !== "string") {
                return callback(new Error("The contents for document '" + path + "' could not be retrieved"));
            }

            var patch = Diff.patch_make(previousRev, currentDoc);
            var revision = {
                ts: Date.now(),
                silentsave: message.silentsave,
                restoring: message.restoring,
                patch: [patch],
                length: currentDoc.length
            };

            var contributors = message.contributors;
            if ((!contributors || !contributors.length) && (user && user.data && user.data.email)) {
                revision.contributors = [user.data.email];
            }

            self.pushPatch(path, revision, callback);
        });
    };

    this.createNewRevisionsFile = function(path, callback) {
        var parentDir = this.getRevisionsPath(Path.dirname(path));
        var originalPath = path;
        var absPath = this.getRevisionsPath(path);

        IMPORTS.fs.readFile(originalPath, function(err, data) {
            if (err) {
                return callback(err);
            }
            
            var writeFile = function (err) {
                if (err) return callback(err);
                
                // We just created the revisions file. Since we
                // don't have a 'previous revision, our first revision will
                // consist of the previous contents of the file.
                var contents = data.toString();
                var ts = Date.now();
                var revision = {
                    ts: ts,
                    silentsave: true,
                    restoring: false,
                    patch: [Diff.patch_make("", contents)],
                    length: contents.length
                };
                var revisionString = JSON.stringify(revision);
                var revObj = {};
                revObj[ts] = revision;

                IMPORTS.fs.writeFile(absPath, revisionString + "\n", function(err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, revObj);
                });
            };
            
            IMPORTS.fs.exists(parentDir, function (err, exists) {
                if (err) return callback(err);
                
                if (exists) {
                    writeFile();
                }
                else {
                    IMPORTS.fs.mkdir(parentDir, "0755", writeFile);
                }
            });
        });
    };

    this.saveSingleRevision = function(path, revision, callback) {
        var self = this;
        Path.exists(path, function(exists) {
            if (!exists) {
                self.createNewRevisionsFile(path, function() {
                    self.appendToFile(path, revision, callback);
            });
            }
            else {
                self.appendToFile(path, revision, callback);
            }
        });
    };

    this.appendToFile = function(path, revision, callback) {
        if (!path || !revision) {
            return callback(new Error("Missing or wrong parameters (path, revision):", path, revision));
        }

        var absPath = this.getRevisionsPath(path + "." + FILE_SUFFIX);
        console.log("APPEND TO FILE", absPath);
        IMPORTS.fs.exists(absPath, function(err, exists) {
            if (err) 
                return callback(err);
            
            if (!exists)
                return callback(new Error("Backup file path doesn't exist:" + absPath));

            IMPORTS.fs.open(absPath, "a", 666, function(err, id) {
                if (err) return callback(err);
                
                IMPORTS.fs.write(id, JSON.stringify(revision) + "\n", null, "utf8", function(err, written, buffer) {
                    if (err) {
                        callback(new Error("Could not save backup file" + absPath));
                    }
                    else {
                        IMPORTS.fs.close(id, function(err) {
                            callback(err, {
                                absPath: absPath,
                                path: path,
                                revision: revision.ts
                            });
                        });
                    }
                });
            });
        });
    };
}).call(RevisionsPlugin.prototype);
