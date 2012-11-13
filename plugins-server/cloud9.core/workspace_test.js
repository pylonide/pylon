/**
 * Workspace module for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

"use strict";

"mocha";

var assert = require("assert");
var sinon = require("sinon");
var Workspace = require("./workspace");

describe("workspace", function() {
    var ws;
    beforeEach(function() {
        ws = new Workspace({
            options: {
                workspaceId: "user/sergi/cloud9",
                workspaceDir: __dirname
            }
        });

        ws.plugins = {
            p1: {
                canShutdown: function() { return true; }
            },
            p2: {
                canShutdown: function() { return true; }
            }
        };

        sinon.spy(ws, "canShutdown");
    });

    it("should shutdown if this.plugins is not there",  function(next) {
        ws.plugins = null;
        assert(ws.canShutdown(), true);
        next();
    });

    it("should not shutdown if any plugin says no",  function(next) {
        ws.plugins.p3 = { canShutdown: function() { return false; } };
        assert.equal(false, ws.canShutdown());
        next();
    });

    it("should shutdown if all plugins say yes",  function(next) {
        assert.equal(true, ws.canShutdown());
        next();
    });

    it("should get plugins properly",  function(next) {
        assert.equal(null, ws.getExt("Bird is the word"));
        assert.equal(ws.plugins.p3, ws.getExt("p3"));
        next();
    });

    it("should properly exclude",  function(next) {
        var user = {
            permissions: {
                server_exclude: "un|dos|tres|quatre|cinc"
            }
        };

        var test1 = ws.getServerExclude(user);
        var test2 = ws.getServerExclude({});
        assert.equal("object", typeof test1);
        assert.equal(5, Object.keys(test1).length);
        assert.equal(1, Object.keys(test2).length);

        assert.throws(function() { ws.getServerExclude() }, /undefined/);
        next();
    });
});
