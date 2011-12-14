var testUtil = require('../lib/testUtil');
var test = testUtil.test;
var g = require('apollo:google');

test('search', true, function() {
  var results = g.search("croczilla");
  return results.responseData.results[0].url != null;
});

test('search(., {start:4})', true, function() {
  var results = g.search("croczilla", {start:4});
  return results.responseData.results[0].url != null;
});

test('siteSearch(., {start:4})', true, function() {
  var results = g.siteSearch("stratified", "http://www.croczilla.com", {start:4});
  return results.responseData.results[0].url != null;
});

test('translate', "Hallo", function() {
  var response = g.translate("hello", "de");
  if (!response.responseData) return response.responseDetails;
  return response.responseData.translatedText;
}).browserOnly();

test('load', true, function() {
  g.load("language", "1");
  return google.language.isFontRenderingSupported("hi");
}).browserOnly();
