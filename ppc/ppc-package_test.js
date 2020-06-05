/**
 * Pylon Platform Code
 *
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global after, afterEach, before, beforeEach, describe, it, setup, suite, teardown, test*/

"use strict";
"use mocha";

var Assert = require("assert");
var fs = require('fs');

var basePath = __dirname;

describe("ppc-package", function() {
  it("PPC should exist", function(next) {
    Assert.equal(true, fs.existsSync(__dirname + "/../plugins-client/lib.ppc/www/ppc/ppc.js", function(result) {
      return result;
    }));
    next();
  });
});
