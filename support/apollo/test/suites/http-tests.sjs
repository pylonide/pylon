var testUtil = require('../lib/testUtil');
var getHttpURL = require("../lib/testContext").getHttpURL;
var test = testUtil.test;
var http = require('apollo:http');
//----------------------------------------------------------------------
// constructQueryString/constructURL

test('constructQueryString({a:1},{b:2})', "a=1&b=2", function() {
  return http.constructQueryString({a:1},{b:2});
});


test('constructQueryString({a:1,b:"foo&bar"})', "a=1&b=foo%26bar", function() {
  return http.constructQueryString({a:1,b:"foo&bar"});
});

test('constructQueryString([[null,[{a:1,b:["x","y"]},{c:3}],[[]]]])',
     "a=1&b=x&b=y&c=3", function() {
  return http.constructQueryString([[null,[{a:1,b:['x','y']},{c:3}],[[]]]]);
});

test('constructURL("foo.txt")', "foo.txt", function () {
  return http.constructURL("foo.txt");
});

test('constructURL("foo", "bar", "foo.txt")', "foo/bar/foo.txt", function () {
  return http.constructURL("foo", "bar", "foo.txt");
});

test('constructURL("foo/", "/bar/")', "foo/bar/", function () {
  return http.constructURL("foo/", "/bar/");
});

test('constructURL("foo?a=b")', "foo?a=b", function () {
  return http.constructURL("foo?a=b");
});

test('constructURL("foo?a=b", {b:1})', "foo?a=b&b=1", function () {
  return http.constructURL("foo?a=b", {b:1});
});

test('constructURL("foo?a=b", {b:[1,2]})', "foo?a=b&b=1&b=2", function () {
  return http.constructURL("foo?a=b", {b:[1,2]});
});

test('constructURL("foo?a=b", [{b:[1,2]}])', "foo?a=b&b=1&b=2", function () {
  return http.constructURL("foo?a=b", [{b:[1,2]}]);
});

test('constructURL(["http://foo", {bar:"x", zz:"w"}, {foo:[1,2,3]}])',
     "http://foo?bar=x&zz=w&foo=1&foo=2&foo=3",
     function() {
       return http.constructURL(["http://foo", {bar:"x", zz:"w"}, {foo:[1,2,3]}]);
     });

test('constructURL([["http://foo", {bar:"x", zz:"w"}], [{foo:[1,2,3]}]])',
     "http://foo?bar=x&zz=w&foo=1&foo=2&foo=3",
     function() {
       return http.constructURL([["http://foo", {bar:"x", zz:"w"}], [{foo:[1,2,3]}]]);
     });

//----------------------------------------------------------------------
// canonicalizeURL

test('canonicalizeURL("/foo/bar.txt", "http://a.b/c/d/baz.txt")',
     "http://a.b/foo/bar.txt",
     function() {
       return http.canonicalizeURL("/foo/bar.txt", "http://a.b/c/d/baz.txt");
     });

test('canonicalizeURL("foo/bar.txt", "http://a.b/c/d/baz.txt")',
     "http://a.b/c/d/foo/bar.txt",
     function() {
       return http.canonicalizeURL("foo/bar.txt", "http://a.b/c/d/baz.txt");
     });

test('canonicalizeURL("././foo/./bar.txt", "http://a.b/c/d/")',
     "http://a.b/c/d/foo/bar.txt",
     function() {
       return http.canonicalizeURL("././foo/./bar.txt", "http://a.b/c/d/");
     });

test('canonicalizeURL(".././foo/../bar.txt", "http://a.b/c/d/")',
     "http://a.b/c/bar.txt",
     function() {
       return http.canonicalizeURL(".././foo/../bar.txt", "http://a.b/c/d/");
     });

test('canonicalizeURL("foo/bar.txt", "http://www.noendingslash")',
    "http://www.noendingslash/foo/bar.txt",
    function() {
      return http.canonicalizeURL("foo/bar.txt", "http://www.noendingslash");
    });

test('node.js request fails on non-http URLs', 'Unsupported protocol: file', function() {
  try {
    http.request('file:///');
    return "no error";
  } catch(e) { return e; }
}).serverOnly();

//----------------------------------------------------------------------
// request

test('request(["data/returnQuery.template", {a:1,b:2}])', "a=1&b=2", function() {
  return http.request([getHttpURL("data/returnQuery.template"), {a:1,b:2}]);
}).skip("requires template filter");

test('request(["data/returnQuery.template", {a:1,b:2}])', "a=1&b=2", function() {
  return http.request([getHttpURL("data/returnQuery.template"), {a:1,b:2}]);
}).skip("requires template filter");

test('request("data/returnQuery.template", {query:{a:1,b:2}})', "a=1&b=2", function() {
  return http.request(getHttpURL("data/returnQuery.template"), {query:{a:1,b:2}});
}).skip("requires template filter");

test('request("no_such_url", {throwing:false})', "", function() {
  return http.request(getHttpURL("no_such_url"), {throwing:false});
});

test('try {request("no_such_url")}catch(e){}', "404", function() {
  try {return http.request(getHttpURL("no_such_url"));}catch(e) { return e.status.toString(); }
});

//----------------------------------------------------------------------
// get

test('get(["data/returnQuery.template", {a: 1, b: 2}])', "a=1&b=2", function () {
  return http.get([getHttpURL("data/returnQuery.template"), {a: 1, b: 2}]);
}).skip("requires template filter");

test('get(["data/returnQuery.template", { a: 1 }, {b: 2}])', "a=1&b=2", function () {
  return http.get([getHttpURL("data/returnQuery.template"), { a: 1 }, {b: 2}]);
}).skip("requires template filter");

test('try {get("invalid_url")}catch(e){}', "404", function() {
  try {return http.get(getHttpURL("invalid_url"));}catch(e) { return e.status.toString(); }
});

//----------------------------------------------------------------------
// post

test("http.post", "a=1&b=2", function () {
  return http.post(getHttpURL("/post_echo"), "a=1&b=2");
}).skip("machinery for this test is not in place atm");

test("http.post 2", "a=1&b=b&c=3", function () {
  return http.post(getHttpURL("/post_echo"),
                              http.constructQueryString([{a:1,b:"b"},
                                                         {c:3}]));
}).skip("machinery for this test is not in place atm");

//----------------------------------------------------------------------
// json

test('json("data/data.json")', 1, function () {
  return http.json(getHttpURL("data/data.json")).doc[0].value;
});

//----------------------------------------------------------------------
// xml

test('xml("data/data.xml")', "1", function () {
 return http.xml(getHttpURL("data/data.xml")).getElementsByTagName("leaf")[0].getAttribute("value");
}).skip("http.xml is obsolete");

//----------------------------------------------------------------------
// jsonp

var webserverJsonpTimeout = 5000;

function testJsonpRequest(opts) {
  waitfor {
    return http.jsonp(getHttpURL("data/returnJsonp.template"), [{query: {data:"bananas"}},opts]).data;
  }
  or {
    hold(webserverJsonpTimeout);
    return "timeout";
  }
}

test("jsonp", "bananas", function () {
  return testJsonpRequest();
}).skip("requires template filter");

test("jsonp in iframe", "bananas", function () {
  return testJsonpRequest({iframe:true});
}).skip("requires template filter");

test("jsonp forcecb", "bananas", function () {
  return testJsonpRequest({forcecb:"foobar"});
}).skip("requires template filter");

test("jsonp/indoc bad url should throw", "notfound", function () {
  waitfor {
    try {
      return http.jsonp("nonexistingurl");
    } catch (e) {
      return "notfound";
    }
  } or {hold(webserverJsonpTimeout);return "timeout"; }
});

test("jsonp/in iframe bad url should throw", "notfound", function () {
  waitfor {
    try {
      return http.jsonp("nonexistingurl", {iframe:true});
    } catch (e) {
      return "notfound";
    }
  } or {hold(webserverJsonpTimeout);return "timeout"; }
});


function twitterSearchIframe(opts) {
  waitfor {
    return http.jsonp("http://search.twitter.com/search.json",opts);
  } or {hold(webserverJsonpTimeout);return "timeout"; }
}

test("http.jsonp iframe cache issue", true, function () {
  var a = twitterSearchIframe();
  // if the iframe caches (some browsers), the jsonp callback will not be called
  var b = twitterSearchIframe();
  return (a != "timeout") && (b != "timeout");
});
