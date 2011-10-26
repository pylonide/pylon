/**
 * Ah oui, c'est la gestionnaire de paquet node!
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {
    
    var ide = require("core/ide");
    var ext = require("core/ext");
    
    var activeCallbacks = {
        list: null,
        search: null,
        install: null,
        uninstall: null,
        outdated: null,
        update: null
    };
    
    ide.addEventListener("socketMessage", onVisualNpmMessage.bind(this));
    ide.addEventListener("socketMessage", onPacmanMessage.bind(this));
    
    function search(name, callback) {
        execCommand({
            command: "pacman",
            type: "npm-search",
            query: name
        });
        activeCallbacks.search = callback;
    }
    
    // list all installed packages in the current project
    function listPackages(listCallback, outdatedCallback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "ll"],
            cwd: ide.workspaceDir,
            line: "visualnpm ll"
        });
        
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "outdated"],
            cwd: ide.workspaceDir,
            line: "visualnpm outdated"
        });        
                
        //ide.socket.send(JSON.stringify({ command: "pacman", argv: [ "pacman", "npm-search" ], cwd: ide.workspaceDir, line: "pacman npm-search", type: "npm-search" }));
        
        // register callback
        activeCallbacks.list = listCallback;
        activeCallbacks.outdated = outdatedCallback;
    }
            
    function execCommand(data) {
        var cmd = data.command;
        
        if (ext.execCommand(cmd, data) !== false) {
            if (ide.dispatchEvent(cmd, { data: data }) !== false) {
                if (!ide.onLine) { 
                    this.write("Cannot execute command. You are currently offline.");
                }
                else { 
                    ide.socket.send(JSON.stringify(data));
                }
            }
        }        
    }
    
    function install(pckge, callback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "install", pckge],
            cwd: ide.workspaceDir,
            line: "visualnpm install " + pckge
        });
        activeCallbacks.install = callback;
    }
    
    function uninstall(pckge, callback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "uninstall", pckge],
            cwd: ide.workspaceDir,
            line: "visualnpm uninstall " + pckge
        });
        activeCallbacks.uninstall = callback;        
    }
    
    function updateAll(callback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "update"],
            cwd: ide.workspaceDir,
            line: "visualnpm update"
        });
        activeCallbacks.update = callback;        
    }
    
    function update(name, callback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "update", name],
            cwd: ide.workspaceDir,
            line: "visualnpm update " + name
        });
        activeCallbacks.update = callback;        
    }    
    
    function onVisualNpmMessage(e) {
        var res, message = e.message;
    
        if (message.subtype !== "visualnpm") return;
        
        switch (message.body.argv[1]) {
            case "ll":
                var model = [];
                
                var list = processList(message.body.out);
                for (var ix = 0; ix < list.length; ix++) {
                    var items = mapListItemToModel(list[ix]);
                    for (var iix = 0; iix < items.length; iix++) {
                        model.push(items[iix]);
                    }
                }
                                
                if (activeCallbacks.list && typeof activeCallbacks.list === "function") {
                    activeCallbacks.list(model);
                    activeCallbacks.list = null; // clear callback
                } 
                break;
            case "install":
                var icb = activeCallbacks.install;
                if (icb && typeof icb === "function") {
                    icb(message.body);
                    activeCallbacks.install = null;
                }
                break;
            case "uninstall":
                var ucb = activeCallbacks.uninstall;
                if (ucb && typeof ucb === "function") {
                    ucb(message.body);
                    activeCallbacks.uninstall = null;
                }
                break;
            case "outdated":
                var ocb = activeCallbacks.outdated;
                if (ocb && typeof ocb === "function") {
                    ocb( processOutdated(message.body.out));
                    activeCallbacks.outdated = null;
                }
                break;
            case "update":
                var xcb = activeCallbacks.update;
                if (xcb && typeof xcb === "function") {
                    xcb(message.body);
                    activeCallbacks.update = null;
                }
                break;                
        }
    }
    
    function mapListItemToModel(item) {
        var map = function (item) {
            return {
                name: item.name,
                version: item.version,
                description: item.description,
                url: item.url,
                dependencies: getDependencies(item)
            }; 
        };
        
        var arr = [];
        arr.push(map(item));
        
        // have to think how we are going to do this...
        /*for (var ix = 0; ix < item.dependencies.length; ix++) {
            var children = mapListItemToModel(item.dependencies[ix]);
            
            for (var cid = 0; cid < children.length; cid++) {
                arr.push(children[cid]);
            }
        }*/
        return arr;
    }
    
    function onPacmanMessage(e) {
        if (e.message.subtype !== "npm-search") return;
        
        var cb = activeCallbacks.search;
        if (cb && typeof cb === "function") {
            cb(e.message.body);
            activeCallbacks.search = null;
        }
    }
    
    /** get list of packagenames that a given package depends on
     * @returns {array} list of strings
     */
    function getDependencies(item) {
        var dep = [];
        for (var ix = 0; ix < item.dependencies.length; ix++) {
            dep.push(item.dependencies[ix].name);
            
            var children = getDependencies(item.dependencies[ix]);
            for (var cid = 0; cid < children.length; cid++) {
                dep.push(children[cid]);
            }
        }
        return dep;
    }
    
    /** process the raw output of 'npm outdated'
     * param {string} raw raw output of the command
     * @returns {array} array of { name, newVersion }
     */
    function processOutdated(raw) {
        var lines = raw.split('\n');
        
        var outdated = [];
        var parseNewStyle = function(line) {
                var parsed = line.match(/^(\w+)@([\d\.]+) \.\/node_modules\/\1/);
                if (!parsed) return false;
                outdated.push({
                    name: parsed[1],
                    newVersion: parsed[2]
                });
                return true;
            };
            
        var parseOldStyle = function(line) {
                var parsed = line.match(/^(\w+):/);
                if (!parsed) return false;
                outdated.push({
                    name: parsed[1],
                    newVersion: ""
                });
                return true;
            };
            
        for (var ix = 0, line = lines[ix]; ix < lines.length; line = lines[++ix]) {
            line = line.replace(/(^\s+)|(\s+)$/g, "");

            if (!line) continue;
            
            if (!(parseNewStyle(line) || parseOldStyle(line))) {
                continue;
            }
        }
        return outdated;
    }
    
    /** process the raw output of 'npm list'
     * param {string} raw raw output of the command
     * @returns {array} array of { name, version, children }
     */
    function processList(raw) {
        var lines = raw.split("\n"), source = [];
        
        var currentItem = null;
        // pre process
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (!line) continue;
            
            var indentationMatch = line.match(/^.[^\w]+/);
            if (!indentationMatch || indentationMatch[0].length < 4) {
                continue;
            }
            
            var indentation = indentationMatch[0].length;
            
            var nameRegex = new RegExp("[\\w-]+@[\\d\\.]+");
            if (nameRegex.test(line)) {
                if (currentItem) {
                    source.push(currentItem);
                }
                currentItem = {
                    name: line.match(nameRegex)[0],
                    level: (indentation - 4) / 2
                };
            }
            else if (currentItem && !currentItem.path) {
                currentItem.path = line.substring(indentation);
            }
            else if (currentItem && !currentItem.description) {
                currentItem.description = line.substring(indentation);
            }
            else if (currentItem && !currentItem.url) {
                currentItem.url = line.substring(indentation);
            }
        }
        
        if (currentItem) {
            source.push(currentItem);
        }
        
        // creates a node of itself + all its children
        function proc(curIx, fullSource) {
            var curItem = fullSource[curIx];
            // find children
            var children = [];
            while (fullSource[++curIx] && fullSource[curIx].level !== curItem.level) {
                if (fullSource[curIx].level === curItem.level + 1) {
                    children.push(proc(curIx, fullSource));
                }
            }
            var nv = curItem.name.match(/([\w\-]+)@([\w\.]+)/);
            
            if (curItem.url) {
                // try match github url
                var githubMatch = curItem.url.match(/git:\/\/(.*?).git/);
                if (githubMatch) {
                    curItem.url = "http://" + githubMatch[1];
                }
            }
            
            return {
                name: nv[1],
                version: nv[2],
                url: curItem.url,
                description: curItem.description,
                dependencies: children
            };
        }
        
        // recursive buildup of the tree
        var tree = [];
        for (var ix = 0, item = source[ix]; ix < source.length; item = source[++ix]) {
            if (item.level === 0) {
                tree.push(proc(ix, source));
            }
        }

        return tree;
    }

    module.exports = {
        search: search,
        listPackages: listPackages,
        install: install,
        uninstall: uninstall,
        updateAll: updateAll,
        update: update
    };
});