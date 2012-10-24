/**
 * Revisions Server module for Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2012, Ajax.org B.V.
 */

require("amd-loader");
var Plugin = require("../cloud9.core/plugin");
var Diff_Match_Patch = require("./diff_match_patch");
var Path = require("path");
var PathUtils = require("./path_utils.js");
var Async = require("async");
var fsnode = require("vfs-nodefs-adapter");

/**
 *  FILE_SUFFIX = "c9save"
 *
 *  Suffix (extension) for revision files.
 **/
var FILE_SUFFIX = "c9save";

/**
 * REV_FOLDER_NAME = ".c9revisions"
 *
 * Folder to save revisions into
 */
var REV_FOLDER_NAME = ".c9revisions";

var Diff = new Diff_Match_Patch();
var name = "revisions";

module.exports = function setup(options, imports, register) {
    var fs;

    function RevisionsPlugin(ide, workspace) {
        Plugin.call(this, ide, workspace);
        var self = this;
        this.hooks = ["command"];
        this.name = name;

        // This queue makes sure that changes are saved asynchronously but orderly
        this.savingQueue = Async.queue(function(data, callback) {
            self.saveSingleRevision(data.path, data.revision, function(err, revisionInfo) {
                callback(err, revisionInfo);
            });
        }, 1);
    }

    require("util").inherits(RevisionsPlugin, Plugin);

    (function() {
        this.command = function(user, message, client) {
            if (!message.command || message.command !== "revisions") {
                return false;
            }

            var self = this;
            if (message.subCommand) {
                var _error = function(msg) {
                    self.broadcastError(message.subCommand, msg, user);
                };

                switch (message.subCommand) {
                    // Directly save a revision. The revision has been precomputed
                    // on the client as is merely passed to the server in order to
                    // save it.
                    case "saveRevision":
                        if (!message.path) {
                            return _error("No path sent for the file to save");
                        }

                        this.savingQueue.push({
                            path: message.path,
                            revision: message.revision
                        }, function(err, revisionInfo) {
                            if (err) {
                                return _error(err.toString());
                            }

                            self.broadcastConfirmSave(message.path, revisionInfo.revision);
                            if (message.forceRevisionListResponse === true) {
                                self.getAllRevisions(revisionInfo.absPath, function(_err, revObj) {
                                    if (_err) {
                                        return _error("Error retrieving revisions for file " + revisionInfo.absPath);
                                    }

                                    self.broadcastRevisions.call(self, revObj, user, {
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
                            return _error("No path sent for the file");
                        }

                        this.getRevisions(message.path, function(err, revObj) {
                            if (err) {
                                return _error("There was a problem retrieving the revisions" +
                                    " for the file " + message.path + ":\n" + err);
                            }

                            self.broadcastRevisions.call(self, revObj, user, {
                                id: message.id || null,
                                nextAction: message.nextAction,
                                path: message.path
                            });
                        });
                        break;

                    case "getRealFileContents":
                        fs.readFile(message.path, "utf8", function (err, data) {
                            if (err) {
                                return _error("There was a problem reading the contents for the file " +
                                        message.path + ":\n" + err);

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
                            _error("No path sent for the file to be closed");
                        }
                        break;

                    case "removeRevision":
                        if (!message.path) {
                            return _error("No path sent for the file to be removed");
                        }

                        var path = this.getRevisionsPath(message.path);
                        if (message.isFolder === true) {
                            fs.rmdir(path, { recursive: true }, function() {});
                        }
                        else {
                            fs.unlink(path + "." + FILE_SUFFIX);
                        }
                        break;

                    case "moveRevision":
                        if (!message.path || !message.newPath) {
                            return _error("Not enough paths sent for the file to be moved");
                        }

                        var fromPath = this.getRevisionsPath(message.path);
                        var toPath = this.getRevisionsPath(message.newPath);
                        if (message.isFolder !== true) {
                            fromPath += "." + FILE_SUFFIX;
                            toPath += "." + FILE_SUFFIX;
                        }

                        fs.exists(fromPath, function(fromPathExists) {
                            if (!fromPathExists) {
                                return;
                            }
                            fs.exists(Path.dirname(toPath), function(toPathExists) {
                                var renameFn = function() {
                                    fs.rename(fromPath, toPath, function(err) {
                                        if (err) {
                                            _error("There was an error moving " + fromPath + " to " + toPath);
                                        }
                                    });
                                };

                                if (toPathExists) {
                                    renameFn();
                                }
                                else {
                                    fs.mkdirP(Path.dirname(toPath), function(err) {
                                        if (!err) {
                                            renameFn();
                                        }
                                    });
                                }
                            });
                        });
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
            fs.readFile(absPath, "utf8", function(err, data) {
                if (err) {
                    return callback(err);
                }

                var error;
                var lineCount = 0;
                var lines = data.toString().split("\n");
                if (lines.length) {
                    Async.whilst(
                        function () {
                            return lineCount < lines.length && !error;
                        },
                        function (next) {
                            var line = lines[lineCount];
                            if (line) {
                                try {
                                    var revision = JSON.parse(line);
                                    revObj[revision.ts] = revision;
                                }
                                catch(e) {
                                    error = e;
                                }
                            }
                            lineCount++;
                            next();
                        },
                        function (e) {
                            callback(error, revObj);
                        }
                    );
                }
            });
        };

        /**
         * RevisionsPlugin#getRevisionsPath(filePath)
         * - filePath (String): relative path of the actual file
         *
         * Creates the path to a relevant revisions file for a given file
         **/
        this.getRevisionsPath = function(filePath) {
            return Path.join(REV_FOLDER_NAME, filePath);
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

            var self = this;
            // does the revisions file exists?
            fs.exists(absPath, function (exists) {
                if (exists) {
                    self.getAllRevisions(absPath, callback);
                }
                else {
                    // create new file
                    self.saveSingleRevision(filePath, null, callback);
                }
            });
        };

        /**
         * RevisionsPlugin#retrieveRevisionContent(revObj[, upperTSBound], callback)
         * - revObj (Object): Object containing all the revisions in the document.
         * - upperTSBound (Number): Timestamp of the revision to retrieve. Optional.
         * - currentDoc (Function): Callback to pass the results to.
         *
         * Asynchronoulsy calculates the content of the document at a particular
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
            var self = this;
            this.getRevisions(path, function(err, revObj) {
                if (err) {
                    return callback(err);
                }

                self.retrieveRevisionContent(revObj, null, function(err, content) {
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

        this.broadcastError = function(fromMethod, msg, user) {
            var receiver = user || this.ide;
            var data = {
                type: "revision",
                subtype: "serverError",
                body: {
                    fromMethod: fromMethod,
                    msg: msg
                }
            };

            receiver.broadcast(JSON.stringify(data));
        };

        this.saveSingleRevision = function(path, revision, callback) {
            if (!path) {
                return callback(new Error("Missing or wrong parameters (path, revision):", path, revision));
            }

            var absPath = this.getRevisionsPath(path + "." + FILE_SUFFIX);
            var revObj;
            fs.exists(absPath, function(exists) {
                if (!exists) {
                    fs.readFile(path, "utf8", function(err, data) {
                        if (err)
                            return console.error(err);

                        // We just created the revisions file. Since we
                        // don't have a previous revision, our first revision will
                        // consist of the previous contents of the file.
                        var ts = Date.now();
                        var firstRevision = {
                            ts: ts,
                            silentsave: true,
                            restoring: false,
                            patch: [Diff.patch_make("", data)],
                            length: data.length
                        };
                        var revisionString = JSON.stringify(firstRevision);
                        revObj = {};
                        revObj[ts] = firstRevision;

                        create(revisionString + "\n");
                    });
                }
                else if (revision) {
                    fs.readFile(absPath, "utf8", write);
                } else {
                     callback(new Error("Missing or wrong parameters (path, revision):", path, revision));
                }
            });

            function write(err, content) {
                if (err)
                    return callback(err);

                // broadcast first revision
                var returnValue;
                if (revObj) {
                    returnValue = revObj;
                }
                else {
                    content += JSON.stringify(revision) + "\n";
                    returnValue = {
                        absPath: absPath,
                        path: path,
                        revision: revision.ts
                    };
                }

                fs.writeFile(absPath, content, "utf8", function(err) {
                    callback(err, returnValue);
                });
            }

            function create(data) {
                fs.mkdirP(Path.dirname(absPath), function(err) {
                    if (!err)
                        write(null, data);
                });
            }
        };
    }).call(RevisionsPlugin.prototype);

    imports.sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);

        fs = fsnode(imports.vfs, projectDir);
        imports.ide.register(name, RevisionsPlugin, register);
    });
};
