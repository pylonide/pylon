var http = require('apollo:http');
var testUtil = require('../lib/testUtil');

// exports.baseURL = "http://localhost:7070/test/run.sjs";
var baseURL = null;

var setBaseURL = exports.setBaseURL = function(base) {
  baseURL = base;
};

var getHttpURL = exports.getHttpURL = function(relativePath) {
  if(testUtil.isBrowser) return relativePath;
  // node can't resolve relative paths, use server location:
  require("assert").notEqual(baseURL, null, "please call testContext.setBaseURL()");
  return http.canonicalizeURL(relativePath, baseURL);
};
