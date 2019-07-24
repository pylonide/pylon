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
  it("APF should exist", function(next) {
    Assert.equal(true, fs.existsSync(__dirname + "/../plugins-client/lib.apf/www/apf-packaged/apf_release.js", function(result) {
      return result;
    }));
    next();
  });
  
  it("PPC should exist", function(next) {
    Assert.equal(true, fs.existsSync(__dirname + "/../plugins-client/lib.ppc/www/ppc/ppc.js", function(result) {
      return result;
    }));
    next();
  });
  
  it("PPC should be the same as APF", function(next) {
    var apf = fs.readFileSync(__dirname + "/../plugins-client/lib.apf/www/apf-packaged/apf_release.js");
    var ppc = fs.readFileSync(__dirname + "/../plugins-client/lib.ppc/www/ppc/ppc.js");
    Assert.equal(true, ppc.equals(apf));
    next();
  });
});
