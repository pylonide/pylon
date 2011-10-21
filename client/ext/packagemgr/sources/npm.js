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
        uninstall: null
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
    function listPackages(callback) {
        execCommand({
            command: "visualnpm",
            argv: ["visualnpm", "list"],
            cwd: ide.workspaceDir,
            line: "visualnpm list"
        });
                
        //ide.socket.send(JSON.stringify({ command: "pacman", argv: [ "pacman", "npm-search" ], cwd: ide.workspaceDir, line: "pacman npm-search", type: "npm-search" }));
        
        // register callback
        activeCallbacks.list = callback;
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
    
    function onVisualNpmMessage(e) {
        var res, message = e.message;
    
        if (message.subtype !== "visualnpm") return;
        
        switch (message.body.argv[1]) {
            case "list":
                var model = [];
                
                var list = processList(message.body.out);
                for (var ix = 0; ix < list.length; ix++) {
                    var item = list[ix];
                    model.push({ name: item.name, version: item.version });
                }
                
                if (activeCallbacks.list && typeof activeCallbacks.list === "function") {
                    activeCallbacks.list(model);
                    activeCallbacks.list = null; // clear callback
                } 
                break;
            case "install":
                var icb = activeCallbacks.install;
                if (icb && typeof icb === "function") {
                    icb(null);
                    activeCallbacks.install = null;
                }
                break;
            case "uninstall":
                var ucb = activeCallbacks.uninstall;
                if (ucb && typeof ucb === "function") {
                    ucb(null);
                    activeCallbacks.uninstall = null;
                }               
                break;
        }
    }
    
    function onPacmanMessage(e) {
        if (e.message.subtype !== "npm-search") return;
        
        var cb = activeCallbacks.search;
        if (cb && typeof cb === "function") {
            cb(e.message.body);
            activeCallbacks.search = null;
        }
    }
    
    
    /** process the raw output of 'npm list'
     * param {string} raw raw output of the command
     * @returns {object} array of { name, version, children }
     */
    function processList(raw) {
        var lines = raw.split("\n"), source = [];
        
        // pre process
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (!line) continue;
            
            var indentationMatch = line.match(/^.[^\w]+/);
            if (!indentationMatch || indentationMatch[0].length < 4) {
                continue;
            }
            
            var indentation = indentationMatch[0].length;
            var level = (indentation - 4) / 2;
            var name = line.match(/\w+@[\d\.]+/)[0];
            
            source.push({
                indentation: level,
                name: name
            });
        }
        
        // creates a node of itself + all its children
        function proc(curIx, fullSource) {
            var curItem = fullSource[curIx];
            // find children
            var children = [];
            while (fullSource[++curIx] && fullSource[curIx].indentation !== curItem.indentation) {
                if (fullSource[curIx].indentation === curItem.indentation + 1) {
                    children.push(proc(curIx, fullSource));
                }
            }
            var nv = curItem.name.match(/(\w+)@([\w\.]+)/);
            return {
                name: nv[1],
                version: nv[2],
                dependencies: children
            };
        }
        
        // recursive buildup of the tree
        var tree = [];
        for (var ix = 0, item = source[ix]; ix < source.length; item = source[++ix]) {
            if (item.indentation === 0) {
                tree.push(proc(ix, source));
            }
        }

        return tree;
    }

    module.exports = {
        search: search,
        listPackages: listPackages,
        install: install,
        uninstall: uninstall
    };
});