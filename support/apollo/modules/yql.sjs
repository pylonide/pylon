/*
 * Oni Apollo 'yql' module
 * Stratified wrapper for the YQL web service 
 *
 * Part of the Oni Apollo Standard Module Library
 * Version: 'unstable'
 * http://onilabs.com/apollo
 *
 * (c) 2010-2011 Oni Labs, http://onilabs.com
 *
 * This file is licensed under the terms of the MIT License:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
  @module    yql
  @summary   A stratified wrapper for the [Yahoo! Query Language](http://developer.yahoo.com/yql/) (YQL) Web Service, 
             which enables you to access Internet data with SQL-like commands.
  @desc
    
        var yql = require("apollo:yql");
        var q = "select * from html where url=&#0064;url and xpath='//h1'";
        var rv = yql.query(q, {url:"http://www.onilabs.com"});

    See the [::query] function for more examples.
*/

var http = require("./http");

/**
  @function  query
  @summary   Execute a [YQL query](http://developer.yahoo.com/yql/guide/yql_overview_guide.html) on the Yahoo Web Service.  
  @param     {String} [statement] YQL query.
  @param     {optional Object} [parameters]  Key-value hash of parameters for the query.
  @return    {Object} The query result.
  @desc
    The Yahoo! Query Language is an expressive SQL-like language that lets you query, filter, and join data across Web services. 
    Debug your YQL queries in the [YQL Console](http://developer.yahoo.com/yql/console)

    ### HTML selector Example

        var yql = require("apollo:yql");
        var q = "select * from html where url=&#0064;url and xpath='//h1'";
        var rv = yql.query(q, {url:"http://www.onilabs.com"});
        c.log(rv.results.h1);

    ### Cross-domain XML Example

        var yql = require("apollo:yql");
        var q = "select * from xml where url=&#0064;url";
        var rv = yql.query(q, {
          url:"http://www.weather.gov/xml/current_obs/OOUH1.xml"
        });
        c.log(rv.results.current_observation.temp_c)
*/
exports.query = function (statement, params) {
  var url = "http://query.yahooapis.com/v1/public/yql";
  
  params = params || {};
  if (params.communitytables) {
    delete params.communitytables;
    params.env = "store://datatables.org/alltableswithkeys";
  }
  var rv = http.jsonp([url, { q: statement, format: "json"}, params]);
  if (rv["error"]) {
    throw rv.error.description; // syntax error
  }
  if (rv.query && rv.query.results && rv.query.results.error) {
    var error = rv.query.results.error;
    throw error.description || error; // content error
  }
  return rv.query;
};

/**
  @function  getFeed
  @summary   Load a feed through the Yahoo Web Service.  
  @shortcut  query
  @param     {String} [url] A string containing the URL of the requested Atom feed.
  @return    {Array} An array of Atom entries
  @desc
    This is a convenience wrapper for [the feed table](http://developer.yahoo.com/yql/console/#h=desc%20feed).

        var yql = require("apollo:yql");
        var rv = yql.getFeed("http://planet.mozilla.org/atom.xml"});
        console.log(rv[0].title);`
*/
exports.getFeed = function(url) {
  var q = "select * from atom where url=@url";
  return exports.query(q, {url:url}).results.item;
};

/*
  @function  getXML
  @summary   Loads an XML document through the Yahoo Web Service.  
  @shortcut  query
  @desc
    This is a convenience wrapper for [the xml table](http://developer.yahoo.com/yql/console/#h=desc%20xml).
    `var yql = require("apollo:yql");
    var xmlUrl = "http://www.weather.gov/xml/current_obs/OOUH1.xml";
    var honoluluWeather = yql.getXML(xmlUrl).current_observation;
    console.log(honoluluWeather.temp_c);`
  @param     {String} [url] A string containing the URL of the requested XML document.
  @return    {Object} An object describing the XML document.
exports.getXML = function(url) {
  var q = "select * from xml where url=@url";
  return exports.query(q, {url:url}).results;
};
*/

/*
  @function  getDataURI
  @summary   Returns any file smaller than 25kb through the Yahoo Web Service as a data URI.
  @shortcut  query
  @param     {String} [url] A string containing the URL of the requested file.
  @return    {Array} An array of Atom entries
*/
exports.getDataURI = function(url) {
  var q = "select * from data.uri where url=@url";
  return exports.query(q, {url:url}).results.url;
};

/**
  @function  getFile
  @summary   Returns any file smaller than 25kb through the Yahoo Web Service as a string.  
  @shortcut  query
  @desc
    This is a convenience wrapper for [the data.uri table](http://developer.yahoo.com/yql/console/#h=desc%20data.uri).
  @param     {String} [url] A string containing the URL of the requested file.
  @return    {String}
*/
exports.getFile = function(url) {
  return require("./base64").decode(exports.getDataURI(url).split("base64,")[1]);
};

/*
  var title = y.cssGet("http://www.croczilla.com/stratified", "h1").h1.content;

exports.cssGet = function() {
  var rv = exports.query("select * from data.html.cssselect where url=@url and css=@css", 
                         {url:arguments[0],css:arguments[1]}, {communitytables:true}).results;
  return rv ? rv.results : null;
};
*/