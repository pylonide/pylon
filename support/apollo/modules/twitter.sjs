/*
 * Oni Apollo 'twitter' module
 * Stratified bindings to the client-side Twitter API.
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
  @module    twitter
  @summary   Stratified bindings to the client-side Twitter API.
  @hostenv   xbrowser
*/

var sys = require('sjs:apollo-sys');
if (require('sjs:apollo-sys').hostenv != 'xbrowser') 
  throw new Error('the twitter module only runs in an xbrowser environment');

var http = require("./http");
var common = require("./common");

/**
  @function initAnywhere
  @summary Load Twitter &#0064;Anywhere and install stratified functions for accessing the full RESTful Twitter API.
  @param {optional Object} [settings] Hash of settings
  @return {Object} Twitter API Client object with stratified functions *call* and *waitforEvent*, see below.
  @setting {String} [v=1] Version of API to load.
  @setting {String} [id] API key.
  @desc
    See <http://dev.twitter.com/anywhere/begin> for an introduction to the
    Twitter &#0064;Anywhere library.

    *initAnywhere* returns the **Twitter API Client** object (the object named
    **T** in the &#0064;Anywhere docs). 

    Two extra functions will be installed on the API Client:

    - *call(method, params)*: make a (stratified) call to the RESTful
    Twitter API (see <http://dev.twitter.com/doc>). If the call fails,
    *call* throws an exception with 'detail' member that contains more
    information about the error.  See also example below.

    - *waitforEvent(event)*: wait for an &#0064;Anywhere event, such as e.g. "authComplete".

    ###Typical usage

    See <http://fatc.onilabs.com> for a complete example of how to use
    this API. The idea is to use the &#0064;Anywhere API for
    authentication to Twitter and the use *call* to make calls
    directly to the RESTful Twitter API, rather than going through the
    &#0064;Anywhere abstractions.

    ###Example

        var T = require('apollo:twitter').initAnywhere({id:MY_API_KEY});
        T("#login").connectButton(); // show twitter connect button
        if (!T.isConnected()) 
          T.waitforEvent("authComplete");
        ...
        var profile = T.call("users/show", {user_id: T.currentUser.id});
        ...
        var tweets = T.call("statuses/home_timeline", {count:30});
        ...
        try {
          var tweet = T.call("favorites/create/:id", [ SOME_TWEET_ID ]);
        }
        catch (e) {
          console.log(e);
          console.log(e.detail);
        }
        ...

*/
exports.initAnywhere = function(settings) {
  settings = common.mergeSettings(
    { v : "1" },
    settings);
  if (!window['twttr'])
    require("./dom").script([
      "http://platform.twitter.com/anywhere.js", settings
    ]);
  
  try {
    waitfor(var _t) {
      twttr.anywhere(resume);
    };
  }
  catch (e) {
    // twttr.anywhere throws exceptions as strings, not as 'new
    // Error'. Wrap them here so that they show nicely in the IE
    // console, etc.
    if (!(e instanceof Error))
      e = new Error(e);
    throw e;
  }

  var _tw = twttr.anywhere._instances[_t.version].contentWindow.twttr;
  
  /*
  _tw.klass("twttr.anywhere.proxies.Collection").methods({
    $: function() {
      waitfor(var dummy, rv) {
        _tw.anywhere.api.util.chain.bind(this.event, resume);
      }
      return rv;
    }
  });
  */
  
  _t.call = function(method, params) {
    waitfor(var rv, success) {
      params = params || {};
      _tw.anywhere.remote.call(method, [params], {
        success: function(rv) { resume(rv, true); },
        error: function(rv) { resume(rv, false); } 
      });
    }
    if (!success) {
      var e = new Error("twitter request error");
      e.detail = rv;
      throw e;
    }
    return rv;
  };
  
  _t.waitforEvent = function(name) {
    waitfor(var rv) {
      _t.one(name, resume);
    }
    return rv;
  }
  return _t;
};

/**
  @function  getProfile
  @summary   Retrieve a Twitter profile.
  @param     {String} [name] Twitter profile id.
  @return    {Object}
*/
exports.getProfile = function(id) {
  return http.jsonp(["http://api.twitter.com/1/users/show.json", {user_id:id}]);
};

/**
  @function  get
  @summary   Retrieve tweets by the given user.
  @param     {String} [name] The Twitter profile id.
  @param     {optional Integer} [limit=10] Limit on the number of tweets to retrieve
  @return    {Object}
*/
exports.get = function(id, limit) {
  limit = limit || 10;
  return http.jsonp(["http://twitter.com/status/user_timeline/" + id + ".json",{count: limit}]);
};

/**
  @function  search
  @summary   Search the Twitter universe.
  @param     {String} [query] A string containing query arguments.
  @param     {optional Object} [params] Key/value hash with optional request parameters. See <http://apiwiki.twitter.com/Twitter-Search-API-Method:-search>
  @return    {Object}
*/
exports.search = function(query, params) {
  return http.jsonp(["http://search.twitter.com/search.json",{q:query}, params]);
};

