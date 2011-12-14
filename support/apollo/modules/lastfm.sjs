/*
 * Oni Apollo 'lastfm' module
 * Bindings to the lastfm API 
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
   @module  lastfm
   @summary A wrapper around the Last.fm API
   @desc
     This module uses the JSONP interface of [the Last.fm API](http://www.last.fm/api).

         var lastfm = require("apollo:lastfm");
         lastfm.key = "somekey...";
         var tracks = lastfm.get({
           method: "user.getrecenttracks", 
           user: "rj"
         }).track;
         for (var i = 0; i < tracks.length; i++) {
           console.log(tracks[i].name);
         }
    
*/
var http = require("./http");
var defaultKey = "b25b959554ed76058ac220b7b2e0a026";

/**
  @variable   key
  @summary    A string containing the API key. 
    By default it will use Last.fm's own demo key (which should not be used in production).
*/
exports.key = defaultKey;

/**
  @function   get
  @summary    Execute a remote method on the Last.fm API.
  @param      {optional String} [method] A string defining the remote method you want to call.
  @param      {optional Object} [params] Object with key/value pairs describing the request parameters.
  @return     {Object}
  @desc
    ###Example

        var name = require("apollo:lastfm").get({
          method: "user.getinfo", 
          user: "rj"
        }).realname;
*/
exports.get = function () {
  if (!exports.key) {
    throw "No Last.fm API key supplied";
  }
  if (exports.key == defaultKey) {
    //require("console").warn() ??
    //using lastfm's demo key
  }
  if (typeof arguments[0] == "string") {
    var params = arguments[1] || {};
    params.method = arguments[0];
  } 
  else {
    var params = arguments[0] || {};
  }
  var rv = http.jsonp(["http://ws.audioscrobbler.com/2.0/",
                       {
                         api_key:  exports.key,
                         format:   "json",
                         cb: Math.random()
                       },
                       params]);
  if (rv.error) {
    var e = new Error(rv.message);
    e.code = rv.error;
    throw e;
  }
  // prettify lastfm's xml->json conversion
  var count = 0;
  var first;
  for (first in rv) { if (++count > 1) break; }
  if (count == 1) return rv[first];
  return rv;
};
/*
exports.getRecentTracks = function (user, limit) {
  limit = limit || 0;
  return exports.get({method: "user.getrecenttracks", user: user, limit: limit}).recenttracks.track;
};

exports.getFriends = function (user, recenttracks, limit) {
  limit = limit || 0;
  recenttracks = recenttracks || false;
  return exports.get({
    method: "user.getfriends", 
    user: user,
    limit: limit,
    recenttracks: recenttracks
  }).friends.user;
};

exports.getTopArtists = function (user, period) {
  period = period || "overall";
  var rv = exports.get({
    method: "user.gettopartists", 
    user: user,
    period: period
  }).topartists.artist;
  return (rv && rv.hasOwnProperty("length")) ? rv : [rv];
  //return toString.call(rv) === "[object Array]" ? rv : [rv]; // XXX doesn't work in Fx
}
*/

