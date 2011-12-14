var test = require('../lib/testUtil').test;
var yql=require('apollo:yql');

test("query", "JavaScript + structured concurrency", function() {
  var rv = yql.query("select * from html where url=@url and xpath='//h1'",
                     {url:"http://www.stratifiedjs.org"});
  return rv.results.h1;
});

test("getFile", true, function() {
  var file = yql.getFile("http://stratifiedjs.org/presentations/OSCON2010/");
  return file.indexOf("Alexander Fritze") != -1;
});
