//#!/usr/bin/env phantomjs

var SYSTEM = require("system");
var WEBPAGE = require("webpage");
var FS = require("fs");


function main(callback) {

	function error(err) {
		callback(err);
	}

	var messages = [];
	var steps = [];
	var page = WEBPAGE.create();

	page.onLoadStarted = function () {
	    console.log("Start loading ..."); 
	};

	page.onConsoleMessage = function (msg) {
		if (/^:error:/.test(msg)) {
			error(msg.substring(7));
			return;
		} else
		if (/^:/.test(msg)) {
			steps[msg.substring(1)]();
			return;
		}

		messages.push(msg);
		console.log(msg);
	};

	page.onLoadFinished = function (status) {
	    console.log("Loading finished. Running tests ...");

	    try {

		    // Check some basic things.
			if (status !== "success") {
				return error("Page did not load with 'success'!");
			}
			if (page.content.length <= 1000) {
				return error("Page content is less than 1,000 chars! Something did not load correctly? Content: " + page.content);
			}
			var cloud9config = page.evaluate(function () {
			    return window.cloud9config;
			});
			if (cloud9config.workspaceDir !== FS.workingDirectory) {
				return error("`cloud9config.workspaceDir` does not match `FS.workingDirectory`!");
			}

			steps["start"] = function() {
				page.evaluate(function () {
					console.log(":load-helloworld");
				});
			}

			// TODO: Load and run test for each plugin by reading list of plugins.
			steps["load-helloworld"] = function() {
				page.evaluate(function () {
					sourcemint.sandbox("static/bundles/helloworld.js", function(sandbox) {
						console.log(sandbox.main());
						console.log(":load-helloworld-test");
					});
				});
			}
			steps["load-helloworld-test"] = function() {
				if (messages[0] !== "WORKING") {
					return error("HelloWorld module test not working!");
				}
				page.evaluate(function () {
					sourcemint.sandbox("static/bundles/test/helloworld.js", function(sandbox) {
						sandbox.main(function(err) {
							if (err) {
								console.log(":error:" + ((typeof err === "object" && err.stack)?err.stack:err));
								return;
							}
							console.log(":done");
						});
					});
				});
			}

			steps["done"] = function() {
				callback(null);
			}

			steps["start"]();

		} catch(err) {
			callback(err);
		}
	};

	page.open("http://localhost:" + SYSTEM.args[1] + "/");
}

main(function(err) {
	if (err) {
		console.error((typeof err === "object" && err.stack)?err.stack:err);
		console.error("ERROR");
		phantom.exit(1);
	}
	phantom.exit(0);
});
