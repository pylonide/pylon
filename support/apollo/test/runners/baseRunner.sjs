var testUtil = require("../lib/testUtil");
var BaseRunner = exports.BaseRunner = function() {
};

BaseRunner.prototype.init = function(opts) {
  this.opts = opts;
  this.testCounter = 0;
  this.testGroups = [];
  this.verbose = opts.verbose;
  this.numTests = 0;

  this.numFailure = 0;
  this.numSuccess = 0;
  this.numError = 0;
};

BaseRunner.prototype.reset = function() {
  this.init(this.opts);
}

var tryStringify = function(obj) {
  try {
    obj = JSON.stringify(obj);
  } catch(e) { }
  return obj;
};

BaseRunner.prototype.addSkip = function(name, reason) {
  ++this.numSuccess;
  if(!this.verbose) return;
  this.dumpSkip(name + " (" + reason + ")");
};
BaseRunner.prototype.addSuccess = function(name, result) {
  ++this.numSuccess;
  if(!this.verbose) return;
  this.dumpSuccess(name + ": " + tryStringify(result));
};
BaseRunner.prototype.addFailure = function(name, expected, actual) {
  ++this.numFailure;
  this.dumpFailure(name + ": expected " + tryStringify(expected) + " but got " + tryStringify(actual));
};
BaseRunner.prototype.addError = function(name, e) {
  ++this.numError;
  this.dumpError(name + ": " + e);
};

BaseRunner.prototype.startGroup = function(name) {
  this.newGroup = name;
};

BaseRunner.prototype.allTests = function() {
  var tests = [];
  for(var i=0; i<this.testGroups.length; i++) {
    var group = this.testGroups[i];
    var tests = group[1];
    tests = tests.concat(tests);
  }
  return tests;
};

BaseRunner.prototype.run = function() {
  this.testCounter = 0;
  for(var i=0; i<this.testGroups.length; i++) {
    var group = this.testGroups[i];
    var filename = group[0];
    var tests = group[1];
    this.startGroup(filename);
    for(var j=0; j<tests.length; j++) {
      var test = tests[j];
      var testName = test[0];
      var testFn = test[1];
      ++this.testCounter;
      if(testFn.skipTest) {
        this.addSkip(testName, testFn.skipTest);
        continue;
      }
      try {
        testFn.call(this);
      } or {
        hold(10000);
        throw new Error("Test didn't complete after 10s");
      } catch (e) {
        this.addError(testName, e);
      }
    }
  }
};


BaseRunner.prototype.totalTestCount = function() {
  return this.unsuccessfulTestCount + this.numSuccess;
};

BaseRunner.prototype.unsuccessfulTestCount = function() {
  return (this.numError + this.numFailure);
};

BaseRunner.prototype.fractionRun = function() {
  if(this.numTests == 0) return 0;
  return this.testCounter / this.numTests;
};
BaseRunner.prototype.fractionFailed = function() {
  if(this.numTests == 0) return 0;
  return this.unsuccessfulTestCount() / this.testCounter;
};
BaseRunner.prototype.success = function() {
  return this.unsuccessfulTestCount() == 0;
};


/* TestWrapper:
 * the return vale from addCase(), allows modifying a test after
 * it's been created. Currently used to declare a test as either
 * browser-only or server (node) only.
 */
var TestWrapper = function(func) {
  this.func = func;
};
TestWrapper.prototype.skip = function(reason) {
  this.func.skipTest = reason || "pending";
};
TestWrapper.prototype.browserOnly = function() {
  if(!testUtil.isBrowser) {
    this.skip("browser only");
  }
};
TestWrapper.prototype.serverOnly = function() {
  if(testUtil.isBrowser) {
    this.skip("server only");
  }
};

BaseRunner.prototype.load = function(filename) {
  testUtil.setRunner(this);
  // ensure the module actually gets reloaded
  // XX maybe replace with require(., {reload:true}) mechanism when we have it.
  delete require.modules[require.resolve(filename).path];
  var fileCases = [];
  this.addCase = function(name, f) {
    fileCases.push([name, f]);
    return new TestWrapper(f);
  };
  try {
    result = require(filename);
  } catch (e) {
    fileCases.push(["(load error)", function() { throw e; }]);
  }
  if(fileCases.length > 0) {
    this.numTests += fileCases.length;
    this.testGroups.push([filename, fileCases]);
  }
  this.addCase = function() { throw "no test load in progress!"; };
};


BaseRunner.prototype.pad = function pad (id) {
  var rv="";
  var l = 6 - (""+id).length;
  for (;l--;) rv+=" ";
  return id+rv;
}
