/**
 * Terminal socket tests for the Pylon IDE
 *
 * @copyright 2026, Pylonide
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global after, afterEach, before, beforeEach, describe, it, setup, suite, teardown, test*/

"use strict";
"use mocha";

var Assert = require("assert");
var Http = require("http");
var Tty = require("./tty");
var EngineIoClient = require("engine.io-client");

/**
 * The engine.io endpoint is attached to the raw HTTP server, so connect's session
 * and auth middleware are not in its request path (see the note above
 * Server.prototype.init in tty.js). The socket must therefore authenticate itself,
 * and these tests pin that behaviour: nothing is honoured before a valid IDE
 * session id has been presented.
 */
describe("terminal socket authentication", function() {
    var server;
    var authTimeout = 800;

    // Spawning a pty and waiting out the auth timeout both exceed mocha's default.
    this.timeout(20000);

    // Stand-in for the store provided by connect.session.
    var session = {
        get: function(sid, callback) {
            if (sid === "valid")
                return callback(null, { uid: 42 });
            if (sid === "anonymous")
                return callback(null, { anonid: "anon-1" });
            if (sid === "no-user")
                return callback(null, {});      // session exists, nobody logged in
            if (sid === "broken")
                return callback(new Error("store failure"));
            return callback(null, null);        // unknown or expired
        }
    };

    beforeEach(function(next) {
        server = Http.createServer(function(req, res) {
            res.statusCode = 401;
            res.end("denied");
        });

        Tty.createServer({
            termName: "xterm-color",
            shell: "/bin/sh",
            server: server,
            localOnly: false,
            session: session,
            authTimeout: authTimeout,
            // Production uses syncSession:true, whose session id is
            // remoteAddress|user-agent. Every client here shares both, so sessions
            // would resume one another and mask what is being tested.
            syncSession: false,
            sessionTimeout: 3600,
            log: false
        });

        server.listen(0, "127.0.0.1", next);
    });

    afterEach(function(next) {
        // Polling transports hold keep-alive sockets open, which would stall close().
        server.closeAllConnections();
        server.close(function() { next(); });
    });

    /**
     * Connects, sends `first` once open, and resolves with everything observed.
     * `onCreateACK` opts in to driving a terminal after a successful handshake.
     */
    function attempt(first, options) {
        options = options || {};

        return new Promise(function(resolve) {
            var socket = new EngineIoClient.Socket(
                "http://127.0.0.1:" + server.address().port,
                { transports: ["polling"] });

            var commands = [];
            var output = "";
            var termId = null;
            var settled = false;

            function done(closed) {
                if (settled) return;
                settled = true;
                try { socket.close(); } catch (e) { ; }
                resolve({
                    commands: commands,
                    output: output,
                    closedByServer: closed,
                    authenticated: commands.indexOf("authACK") !== -1,
                    refused: commands.indexOf("authFAIL") !== -1,
                    spawned: commands.indexOf("createACK") !== -1
                });
            }

            socket.on("open", function() {
                if (first !== null && first !== undefined)
                    socket.send(typeof first === "string" ? first : JSON.stringify(first));
            });

            socket.on("message", function(raw) {
                var data;
                try { data = JSON.parse(raw); } catch (e) { return; }
                commands.push(data.cmd);

                if (data.cmd === "authACK" && options.thenCreate)
                    socket.send(JSON.stringify({ cmd: "create", cols: 80, rows: 24 }));

                if (data.cmd === "authACK" && options.thenAuthAgain)
                    socket.send(JSON.stringify({ cmd: "auth", sessionId: "nonexistent" }));

                // A bare successful handshake produces no further traffic. Settle
                // after a short window, which also proves the server left us open.
                if (data.cmd === "authACK" && !options.thenCreate)
                    setTimeout(function() { done(false); }, options.settle || 400);

                if (data.cmd === "createACK" && !data.error) {
                    termId = data.id;
                    socket.send(JSON.stringify({
                        cmd: "data", id: termId, payload: "echo MARKER_$((6*7))\n" }));
                }

                if (data.cmd === "data") {
                    output += data.payload;
                    if (output.indexOf("MARKER_42") !== -1) {
                        socket.send(JSON.stringify({ cmd: "kill", id: termId }));
                        done(false);
                    }
                }
            });

            socket.on("close", function() { done(true); });

            setTimeout(function() { done(false); },
                options.wait || (options.thenCreate ? 8000 : 1500));
        });
    }

    it("should refuse to spawn a terminal for an unauthenticated connection", async function() {
        var r = await attempt({ cmd: "create", cols: 80, rows: 24 });

        Assert.equal(r.spawned, false, "no pty may be created before authentication");
        Assert.equal(r.refused, true);
        Assert.equal(r.closedByServer, true);
    });

    it("should refuse an unknown session id", async function() {
        var r = await attempt({ cmd: "auth", sessionId: "nonexistent" });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
        Assert.equal(r.closedByServer, true);
    });

    it("should refuse a session with neither uid nor anonid", async function() {
        var r = await attempt({ cmd: "auth", sessionId: "no-user" });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
    });

    it("should refuse when the session store errors", async function() {
        var r = await attempt({ cmd: "auth", sessionId: "broken" });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
    });

    it("should refuse an auth message without a session id", async function() {
        var r = await attempt({ cmd: "auth" });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
    });

    it("should refuse any command other than auth as the first message", async function() {
        var r = await attempt({ cmd: "request paste" });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
    });

    it("should refuse a malformed frame without crashing the server", async function() {
        var r = await attempt("not-json{{{");

        Assert.equal(r.refused, true);
        Assert.equal(r.closedByServer, true);

        // Server survived: a subsequent handshake still succeeds.
        var ok = await attempt({ cmd: "auth", sessionId: "valid" });
        Assert.equal(ok.authenticated, true);
    });

    it("should close a connection that never authenticates", async function() {
        var r = await attempt(null, { wait: authTimeout * 4 });

        Assert.equal(r.authenticated, false);
        Assert.equal(r.refused, true);
        Assert.equal(r.closedByServer, true);
    });

    it("should accept a valid session and then allow a terminal", async function() {
        var r = await attempt({ cmd: "auth", sessionId: "valid" }, { thenCreate: true });

        Assert.equal(r.authenticated, true);
        Assert.equal(r.spawned, true);
        Assert.ok(r.output.indexOf("MARKER_42") !== -1,
            "the pty should run the command we wrote to it");
    });

    it("should accept an anonymous session", async function() {
        var r = await attempt({ cmd: "auth", sessionId: "anonymous" });

        Assert.equal(r.authenticated, true);
        Assert.equal(r.refused, false);
    });

    it("should ignore a repeated auth message once authenticated", async function() {
        // A second auth carrying a bad session id must not downgrade or close a
        // socket that already authenticated successfully.
        var r = await attempt({ cmd: "auth", sessionId: "valid" },
            { thenAuthAgain: true, wait: 1500 });

        Assert.equal(r.authenticated, true);
        Assert.equal(r.refused, false, "an already-authenticated socket must not be closed");
        Assert.equal(r.closedByServer, false);
        Assert.equal(r.commands.filter(function(c) { return c === "authACK"; }).length, 1);
    });
});
