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

        this.hooks = ["command"];
        this.name = name;

        var _self = this;
        // This queue makes sure that changes are saved asynchronously but orderly
        this.savingQueue = Async.queue(function(data, callback) {
            var msg = data.message;
            _self.saveSingleRevision.call(_self, msg.path, msg.revision, function(err, revisions) {
                var revMeta = {
                    revision: revisions,
                    absPath: _self.getRevisionsPath(msg.path + "." + FILE_SUFFIX)
                };

                callback.call(_self, err, revMeta, data._user, msg, data._error);
            });
        }, 1);
    }

    require("util").inherits(RevisionsPlugin, Plugin);

    (function() {
        this.onRevisionSaved = function(err, revisionInfo, user, message, _error) {
            if (err) {
                return _error(err.toString());
            }

            this.broadcastConfirmSave(message.path, revisionInfo.revision);
            if (message.forceRevisionListResponse !== true)
                return;

            var _self = this;
            this.getAllRevisions(revisionInfo.absPath, function(_err, revObj) {
                if (_err) {
                    return _error("Error retrieving revisions for file " +
                        revisionInfo.absPath + "\n" + _err);
                }

                _self.broadcastRevisions.call(_self, revObj, user, {
                    path: message.path
                });
            });
        };

        this.onSaveRevision = function(user, message, _error) {
            if (!message.path) {
                return _error("No path sent for the file to save");
            }

            this.savingQueue.push({
                message: message,
                _user: user,
                _error: _error
            }, this.onRevisionSaved.bind(this));
        };

        this.onGetRevisionHistory = function(user, message, _error) {
            if (!message.path) {
                return _error("No path sent for the file");
            }

            var _self = this;
            this.getRevisions(message.path, function(err, revObj) {
                if (err) {
                    return _error("There was a problem retrieving the revisions" +
                        " for the file " + message.path + ":\n" + err);
                }

                _self.broadcastRevisions.call(_self, revObj, user, {
                    id: message.id || null,
                    nextAction: message.nextAction,
                    path: message.path
                });
            });
        };

        this.onGetRealFileContents = function(user, message, _error) {
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
        };

        this.onRemoveRevision = function(user, message, _error, cb) {
            if (!message.path) {
                return _error("No path sent for the file to be removed");
            }

            cb = cb || function() {};

            var path = this.getRevisionsPath(message.path);
            if (message.isFolder === true) {
                fs.rmdir(path, { recursive: true }, cb);
            }
            else {
                fs.unlink(path + "." + FILE_SUFFIX, cb);
            }
        };

        this.onMoveRevision = function(user, message, _error) {
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
        };

        this.command = function(user, message, client) {
            if (!message.command || message.command !== "revisions" || !message.subCommand) {
                return false;
            }

            var _self = this;
            var _error = function(msg) {
                _self.broadcastError(message.subCommand, msg, user);
            };

            switch (message.subCommand) {
                // Directly save a revision. The revision has been precomputed
                // on the client as is merely passed to the server in order to
                // save it.
                case "saveRevision":
                    _self.onSaveRevision.call(_self, user, message, _error);
                    break;

                // The client requests the history of revisions for a particular
                // document (indicated by `path`). The client might also want the
                // original contents of that file (the ones where diffs are applied
                // in order to get the current file).
                case "getRevisionHistory":
                    _self.onGetRevisionHistory.call(_self, user, message, _error);
                    break;

                case "getRealFileContents":
                    _self.onGetRealFileContents.call(_self, user, message, _error);
                    break;

                case "closeFile":
                    if (!message.path) {
                        _error("No path sent for the file to be closed");
                    }
                    break;

                case "removeRevision":
                    _self.onRemoveRevision.call(_self, user, message, _error);
                    break;

                case "moveRevision":
                    _self.onMoveRevision.call(_self, user, message, _error);
                    break;
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

        this.extractRevisions = function(str, callback) {
            if (typeof str !== "string")
                callback(new Error("String type expected, but " + typeof str + " encountered."));

            var error;
            var revObj = {};
            var lineCount = 0;
            var lines = str.split("\n"); // Could be made into a stream for speed
            if (!lines.length)
                return callback(null, revObj);

            Async.whilst(
                function () {
                    return lineCount < lines.length && !error;
                },
                function (next) {
                    var line = lines[lineCount];
                    if (line) {
                        try {
                            // This is blocking. Perhaps we should look into
                            // JSONStream
                            var revision = JSON.parse(line);

                            // This check is for earlier versions of revisions,
                            // in which the format of every revision line could
                            // (wrongly) be `{ "112387987987": { real revision obj } }`
                            // Ugly, but better than losing data.
                            if (!revision.ts) {
                                revision = revision[Object.keys(revision)[0]];
                                if (!revision.ts)
                                    error = new Error("Could not read revision. Bad format:", line);
                            }
                            else {
                                revObj[revision.ts] = revision;
                            }
                        }
                        catch(e) { error = e; }
                    }
                    lineCount++;
                    next();
                },
                function() {
                    callback(error, revObj);
                }
            );
        };

        this.getAllRevisions = function(absPath, callback) {
            var _self = this;
            fs.readFile(absPath, "utf8", function(err, data) {
                if (err) return callback(err);
                _self.extractRevisions(data, callback);
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
            var revPath = this.getRevisionsPath(filePath + "." + FILE_SUFFIX);
            var _self = this;

            // does the revisions file exists?
            fs.exists(revPath, function(exists) {
                if (exists)
                    _self.getAllRevisions(revPath, callback);
                else
                    // create new file
                    _self.saveSingleRevision(filePath, null, callback);
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
            var _self = this;
            this.getRevisions(path, function(err, revObj) {
                if (err) {
                    return callback(err);
                }

                _self.retrieveRevisionContent(revObj, null, function(err, content) {
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
            // This is blocking. It could be made non-blocking with JSONStreams
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

            var revPath = this.getRevisionsPath(path + "." + FILE_SUFFIX);
            var _self = this;
            function writeRevFile(aContent, aRevision) {
                _self._writeRevisionFile.call(_self, {
                    realPath: path,
                    revPath: revPath,
                    revision: aRevision,
                    content: aContent,
                    cb: callback
                });
            }

            // Let's check if the revision file is already there
            fs.exists(revPath, function(exists) {
                if (!exists) {
                    // Ok, no revision file. Let's read the original file and
                    // make that the first revision.
                    fs.readFile(path, "utf8", function(err, data) {
                        if (err) return callback(err);

                        // We just created the revisions file. Since we
                        // don't have a previous revision, our first revision will
                        // consist of the previous contents of the file.
                        writeRevFile("", {
                            ts: Date.now(),
                            silentsave: true,
                            restoring: false,
                            patch: [Diff.patch_make("", data)],
                            length: data.length
                        });
                    });
                }
                else if (revision) {
                    fs.readFile(revPath, "utf8", function(err, data) {
                        if (err) return callback(err);
                        writeRevFile(data, revision);
                    });
                }
                else {
                    callback(new Error("Missing or wrong parameters (path, revision):", path, revision));
                }
            });
        };

        this._writeRevisionFile = function(data) {
            var _self = this;
            data.content += JSON.stringify(data.revision) + "\n";

            fs.mkdirP(Path.dirname(data.revPath), function(err) {
                if (err) return data.cb(err);
                fs.writeFile(data.revPath, data.content, "utf8", function(err) {
                    if (err) return data.cb(err);

                    var obj = {};
                    obj[data.revision.ts] = data.revision;
                    data.cb.call(_self, null, obj);
                });
            });
        };
    }).call(RevisionsPlugin.prototype);

    imports.sandbox.getProjectDir(function(err, projectDir) {
        if (err) return register(err);

        fs = fsnode(imports.vfs, projectDir);
        imports.ide.register(name, RevisionsPlugin, register);
    });
};
