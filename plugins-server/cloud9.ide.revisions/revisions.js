/**
 * Revisions Server module for Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

require("amd-loader");
var Plugin = require("../cloud9.core/plugin");
var Diff_Match_Patch = require("./diff_match_patch");
var Fs = require("fs");
var Path = require("path");
var PathUtils = require("./path_utils.js");
var Spawn = require("child_process").spawn;
var Async = require("async");

/**
 * compute(data, callback) -> Void
 *
 * - data (Object): Object containing the type of operation and 
 *   the texts to be diffed/patched
 * - callback (Function): Function to be called with the result of
 *   the operation
 *
 *   It spawns a 'worker' process that computes the result of the requested
 *   operation using an external process that uses diff_match_patch.
 */
var compute = function(data, callback) {
    var Dmp = Spawn("node", [__dirname + "/worker.js"]);
    var In = Dmp.stdin;
    var Out = Dmp.stdout;
    var Err = Dmp.stderr;

    In.write(JSON.stringify(data));
    In.end();

    var str = "";
    Out.on("data", function(data) { str += data; });
    Out.on("end", function() { callback(null, str); });
    Err.on("data", function(msg) { callback(new Error(msg)); });
    Dmp.on("exit", function() {});
};

/**
 *  FILE_SUFFIX = "c9save"
 *
 *  Suffix (extension) for revision files.
 **/
var FILE_SUFFIX = "c9save";

/** related to: Revisions#revisions
 *  PURGE_INTERVAL -> 1 hour
 *
 *  Revision cache will be purged every PURGE_INTERVAL to clear up unfreed memory.
 **/
var Diff = new Diff_Match_Patch();
var name = "revisions";

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, RevisionsPlugin, register);
};

var RevisionsPlugin = module.exports.RevisionsPlugin = function(ide, workspace) {
    Plugin.call(this, ide, workspace);
    this.hooks = ["command"];
    this.name = name;
    // `docQueue` will contain the paths of the docs that are being saved ATM.
    var docQueue = this.docQueue = [];
    // `saveQueue` is an asynchronous queue that will orderly and asynchronously 
    // keep saving revisions as told by the client, and remove saved paths from
    // `docQueue`.
    this.saveQueue = Async.queue(function(doc, callback) {
        self.saveRevisionFromMsg(doc[0], doc[1], function() {
            var ind = docQueue.indexOf(doc[1].path);
            if (ind !== -1) {
                docQueue.splice(ind, 1);
            }
            callback();
        });
    }, 1);
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
                        return console.error("No path sent for the file to save");
                    }
                    this.enqueueDoc(user, message, client);
                    break;

                // Directly save a revision. The revision has been precomputed
                // on the client as is merely passed to the server in order to
                // save it.
                case "saveRevision":
                    if (!message.path) {
                        return console.error("No path sent for the file to save");
                    }

                    this.saveRevision(message.path, message.revision, function(err, savedRevisionInfo) {
                        if (err) {
                            return console.error();
                        }

                        var path = savedRevisionInfo.path;
                        var ts = savedRevisionInfo.ts;
                        var revObj = savedRevisionInfo.revObj;
                        if (!self.isCollab()) {
                            self.broadcastConfirmSave(path, ts);
                            if (message.forceRevisionListResponse === true) {
                                self.broadcastRevisions.call(self, revObj, user, {
                                    path: message.path
                                });
                            }
                        }
                        else {
                            // Probably change that
                            self.broadcastRevisions.call(self, revObj, null, { path: path });
                        }
                    });
                    break;

                // The client requests the history of revisions for a particular
                // document (indicated by `path`). The client might also want the
                // original contents of that file (the ones where diffs are applied
                // in order to get the current file).
                case "getRevisionHistory":
                    if (!message.path) {
                        return console.error("No path sent for the file to save");
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
                    var path = PathUtils.getRealFile.call(this, message.path);
                    Fs.readFile(path, "utf8", function (err, data) {
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
                        return console.error("No path sent for the file to save");
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

        // Absolute path in the system for the folder containing the current file
        var parentDir = PathUtils.getAbsoluteParent.call(this, filePath);
        // Absolute path of the final backup file inside the workspace
        var absPath = PathUtils.getAbsolutePath.call(this, filePath) + "." + FILE_SUFFIX;

        var cacheRevision = function(path, rev, cb) {
            cb(null, rev);
        };

        var self = this;
        var revObj; // Represents the revision object
        Path.exists(absPath, function(exists) {
            if (exists) {
                Fs.readFile(absPath, function(err, data) {
                    if (err) {
                        return callback(err);
                    }

                    try {
                        revObj = JSON.parse(data);
                    }
                    catch(e) {
                        return callback(e);
                    }

                    cacheRevision(filePath, revObj, callback);
                });
            }
            else {
                var originalPath = PathUtils.getRealFile.call(self, filePath);
                Fs.readFile(originalPath, function(err, data) {
                    if (err) {
                        return callback(err);
                    }

                    Spawn("mkdir", ["-p", parentDir]).on("exit", function() {
                        revObj = self.createEmptyStack(filePath);
                        // We just created the revisions file. Since we
                        // don't have a 'previous revision, our first revision will
                        // consist of the previous contents of the file.
                        var contents = data.toString();
                        var ts = Date.now();
                        revObj.revisions[ts] = {
                            ts: ts,
                            silentsave: true,
                            restoring: false,
                            patch: [Diff.patch_make("", contents)],
                            length: contents.length
                        };

                        Fs.writeFile(absPath, JSON.stringify(revObj), function(err) {
                            if (err) {
                                return callback(err);
                            }

                            cacheRevision(filePath, revObj, callback);
                        });
                    });
                });
            }
        });
    };

    /**
     * RevisionsPlugin#retrieveRevisionContent(revObj[, upperTSBound], callback)
     * - revObj (Object): Object containing all the revisions in the document.
     * - upperTSBound (Number): Timestamp of the revision to retrieve. Optional.
     * - callback (Function): Callback to pass the results to.
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
        Async.forEach(timestamps, function(ts, next) {
            var revision = revObj.revisions[ts];
            compute({
                type: "patch_apply",
                param1: revision.patch[0],
                param2: content
            }, function(err, result) {
                content += result;
                next();
            });
        }, function(err) {
            callback(err, content);
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

        path = PathUtils.getSessionStylePath.call(this, path);

        var sessions = this.workspace.plugins.concorde.server.getSessions();
        var docSession = sessions[path];
        if (docSession && docSession.getDocument) {
            return (docSession.getDocument() || "").toString();
        }
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
            body: revObj
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
        var ind = this.docQueue.indexOf(message.path);
        if (ind === -1) {
            this.docQueue.push(message.path);
            this.saveQueue.push([user, message]);
        }
    };

    this.saveRevisionFromMsg = function(user, message, callback) {
        var self = this;
        var path = message.path;
        var currentDoc = this.getCurrentDoc(path, message);
        
        if (typeof currentDoc !== "string") {
            return callback(new Error("The contents for document '" + path + "' could not be retrieved"));
        }

        this.getPreviousRevisionContent(path, function(err, previousRev) {
            if (err) {
                return callback(err);
            }

            compute({
                type: "patch_make",
                param1: previousRev,
                param2: currentDoc
            }, function(err, patch) {
                if (err)
                    console.error(err);

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
        });
    };

    this.saveRevision = function(path, revision, callback) {
        this.pushPatch(path, revision, callback);
    };

    /**
     * RevisionsPlugin#pushPatch(path, revision[, currentDoc], callback)
     * - path (String): Relative path for the file to get the document from.
     * - revision (Object): Diff object containing the metadata of the revision.
     * - currentDoc (String): The document is passed in a document object. If it
     * is not there it will be retrieved, and in that case it will be a bit more
     * expensive.
     *
     * Push a new revision into the stack and broadcast it to clients.
     **/
    this.pushPatch = function(path, revision, callback) {
        var self = this;
        this.getRevisions(path, function(err, revObj) {
            if (err)
                return callback(new Error("Couldn't retrieve revisions for " + path));

            revObj.revisions[revision.ts] = revision;
            self.saveToDisk(path, revObj, function(err, savedRevisionInfo) {
                if (err)
                    callback(err);

                savedRevisionInfo.ts = revision.ts;
                callback(null, savedRevisionInfo);
            });
        });
    };

    this.saveToDisk = function(path, revObj, callback) {
        if (!path || !revObj) {
            return callback(new Error("Missing or wrong parameters (path, revObj):", path, revObj));
        }

        var absPath = PathUtils.getAbsolutePath.call(this, path) + "." + FILE_SUFFIX;
        Path.exists(absPath, function(exists) {
            if (!exists)
                return callback(new Error("Backup file path doesn't exist:" + absPath));

            Fs.writeFile(absPath, JSON.stringify(revObj), function (err) {
                if (err)
                    return callback(new Error("Could not save backup file" + absPath));

                callback(null, {
                    absPath: absPath,
                    path: path,
                    revObj: revObj
                });
            });
        });
    };
}).call(RevisionsPlugin.prototype);
