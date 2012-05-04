/*
 * Copyright (c) 2011, Ben Noordhuis <info@bnoordhuis.nl>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var NODE_PATH = ['support', 'server'];
var TEST_TIMEOUT = 5000;

function fixups() {
    // work around v0.4 bug where node closes stdout too early
    if (process.versions['node'].indexOf('0.4.') === 0)
        process.stdout = process.stderr;
}

function scanTests(dir, filter) {
    var tests = fs.readdirSync(dir);

    tests = tests.sort();

    tests = tests.filter(function(name) {
        return /^test-.+\.js$/.test(name);
    });

    tests = tests.map(function(name) {
        return {
            name: name.slice(5, -3),
            path: path.join(dir, name)
        };
    });

    if (filter)
        tests = tests.filter(filter);

    return tests;
}

function runTests(suite, filter) {
    var fullPath = path.join(__dirname, suite);
    var tests = scanTests(fullPath, filter);

    if (!tests.length) {
        console.error('No tests to run.');
        return;
    }

    var testsRun = 0;
    var testsPassed = 0;

    progressBar();
    runTest(tests[0], next);

    function progressBar() {
        var test = tests[testsRun];
        var pass = testsPassed;
        var fail = testsRun - testsPassed;
        var pct = ((testsRun / tests.length) * 100).toFixed(0);
        var s = '[TEST: ' + testsRun + '/' + tests.length + ' (' + pct + '%)' +
                ' | PASS: ' + pass +
                ' | FAIL: ' + fail +
                ']: ';

        if (test)
            s += suite + ' ' + test.name;
        else
            s += 'Done.';

        s += Array(79 - s.length).join(' ');
        process.stdout.write('\r' + s);
    }

    function next(success) {
        if (success)
            testsPassed++;

        if (++testsRun == tests.length)
            return done();

        progressBar();
        runTest(tests[testsRun], next);
    }

    function done() {
        // TODO print out a status report?
        progressBar();
        process.stdout.write('\n');
    }
}

function runTest(test, cb) {
    var proc;
    var timer;

    init();

    function init() {
        proc = cp.spawn(process.execPath, [test.path], {env:createEnv()});
        proc.stdout.pipe(process.stdout);
        proc.stderr.pipe(process.stderr);
        proc.on('exit', onExit);

        timer = setTimeout(onTimeout, TEST_TIMEOUT);
        process.on('SIGINT', cbrk);
    }

    function cbrk() {
        proc.kill('SIGKILL');
        console.error('\nInterrupted.');
        process.exit(42);
    }

    function onTimeout() {
        proc.kill('SIGKILL');
        console.error('\nTimed out.');
    }

    function onExit(statusCode) {
        cleanup(statusCode === 0);
    }

    function cleanup(success) {
        proc = null;
        process.removeListener('SIGINT', cbrk);
        clearTimeout(timer);
        cb(success);
    }
}

function createEnv() {
    var env = {};

    for (var key in process.env)
        env[key] = process.env[key];

    if (!('NODE_PATH' in env))
        env['NODE_PATH'] = createPath();

    return env;
}

function createPath() {
    var pathsep = (process.platform == 'win32' ? ';' : ':');

    var paths = NODE_PATH.map(function(dir) {
        return path.join(__dirname, '..', dir);
    });

    return paths.join(pathsep);
}

function createFilter(pattern) {
    if (!pattern) return null;

    var re = new RegExp(pattern);

    return function(test) {
        return re.test(test.name);
    };
}

function main(argv) {
    fixups();
    var suite = argv[2] || 'simple';
    var filter = createFilter(argv[3]);
    runTests(suite, filter);
}

main(process.argv);
