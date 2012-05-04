"use strict";

var assert = require("assert");
var sinon = require("sinon");
var SandboxFs = require("./fs");

var Path = require("path");
var Fs = require("fs");

module.exports = {

    timeout: 5000,

    setUp: function(next) {
        this.fs = new SandboxFs("/usr/jan/1299", 987);
        
        var backup = { Path: {}, Fs: {} };
        Object.keys(Path).forEach(function (k) {
            backup.Path[k] = Path[k];
        });
        Object.keys(Fs).forEach(function (k) {
            backup.Fs[k] = Fs[k];
        });
        this.backup = backup;
        
        next();
    },
    
    tearDown: function(next) {
        var backup = this.backup;
        
        Object.keys(backup.Path).forEach(function (k) {
            Path[k] = backup.Path[k];
        });
        Object.keys(backup.Fs).forEach(function (k) {
            Fs[k] = backup.Fs[k];
        });
        
        next();
    },

    "test exists true": function (next) {
        // mock exists so it always returns true
        Path.exists = sinon.stub().callsArgWith(1, true);
        
        this.fs.exists("test.js", function (err, exists) {
            assert.equal(err, null);
            assert.equal(exists, true);
            next();
        });
    },
    
    "test exists false": function (next) {
        // mock exists so it always returns true
        Path.exists = sinon.stub().callsArgWith(1, false);
        
        this.fs.exists("test.js", function (err, exists) {
            assert.equal(err, null);
            assert.equal(exists, false);
            next();
        });
    },

    "test exists shouldnt allow out of project dir": function (next) {
        // mock exists so it always returns true
        Path.exists = sinon.stub().callsArgWith(1, true);
        
        this.fs.exists("../test.js", function (err) {
            assert.notEqual(err, null);
            next();
        });
    },
    
    "test readFile true": function (next) {
        var readF = Fs.readFile = sinon.stub().callsArgWith(2, null, "Hello world");
        
        this.fs.readFile("hello.js", "utf8", function (err, content) {
            sinon.assert.calledWith(readF, "/usr/jan/1299/hello.js", "utf8");
            assert.equal(err, null);
            assert.equal(content, "Hello world");
            next();
        });
    },
    
    "test readFile shouldnt allow out of project dir": function (next) {
        var readF = Fs.readFile = sinon.stub().callsArgWith(2, null, "Hello world");
        
        this.fs.readFile("../hello.js", "utf8", function (err) {
            assert.equal(readF.called, 0, "fs.readFile shouldnt have been called");
            assert.notEqual(err, null);
            next();
        });    
    },
    
    "test writeFile true": function (next) {
        var writeF = Fs.writeFile = sinon.stub().callsArgWith(3, null);
        var chown = Fs.chown = sinon.stub().callsArgWith(3, null);
        
        this.fs.writeFile("hello.js", "Hi there", "utf8", function (err) {
            assert.equal(err, null);
            sinon.assert.calledWith(writeF, "/usr/jan/1299/hello.js", "Hi there", "utf8");
            sinon.assert.calledWith(chown, "/usr/jan/1299/hello.js", 987, 987);
            
            next();
        });
    },

    "test writeFile without encoding": function (next) {
        var writeF = Fs.writeFile = sinon.stub().callsArgWith(2, null);
        var chown = Fs.chown = sinon.stub().callsArgWith(3, null);
        
        this.fs.writeFile("hello.js", "Hi there", function (err) {
            assert.equal(err, null);
            sinon.assert.calledWith(writeF, "/usr/jan/1299/hello.js", "Hi there");
            sinon.assert.calledWith(chown, "/usr/jan/1299/hello.js", 987, 987);
            
            next();
        });
    },

    "test writeFile without unixId shouldnt chown": function (next) {
        var writeF = Fs.writeFile = sinon.stub().callsArgWith(2, null);
        var chown = Fs.chown = sinon.stub().callsArgWith(3, null);
        
        var fs = new SandboxFs("/usr/jan/1299", null);
        
        fs.writeFile("hello.js", "Hi there", function (err) {
            assert.equal(err, null);
            sinon.assert.calledWith(writeF, "/usr/jan/1299/hello.js", "Hi there");
            assert.equal(chown.called, 0, "Chown shouldnt get called");
            
            next();
        });
    },

    "test chmod true": function (next) {
        var chmod = Fs.chmod = sinon.stub().callsArgWith(2, null);
        
        this.fs.chmod("hello.js", "0660", function (err) {
            sinon.assert.calledWith(chmod, "/usr/jan/1299/hello.js", "0660");
            assert.equal(err, null);
            
            next();
        });
    },
    
    "test chmod outside project dir": function (next) {
        var chmod = Fs.chmod = sinon.stub().callsArgWith(2, null);
        
        this.fs.chmod("../../hello.js", "0660", function (err) {
            assert.equal(chmod.called, 0);
            assert.notEqual(err, null);
            
            next();
        });
    },
};

!module.parent && require("asyncjs").test.testcase(module.exports, "Sandbox.Fs").exec();