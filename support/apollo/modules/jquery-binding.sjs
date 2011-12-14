/*
 * Oni Apollo 'jquery-binding' module
 * Stratified bindings for jquery 
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
  @module     jquery-binding
  @hostenv    xbrowser
  @summary    A convenience module used to load and extend jQuery to make use of StratifiedJS features.
  @desc 
    By default [::install] will load jQuery from
    a CDN and add stratified versions ($+fnname) of the most common [jQuery functions](http://api.jquery.com/category/events/).

        require("apollo:jquery-binding").install();
        
        while (true) {
          $("a").$click();
          // do something after a click on a link
          $("a").$animate({color:red});
          // we'll get here after the animation is done
          // after that we'll go back to listening to click events
        }
    
    A generic $(selector).waitFor(eventName).

        while(true) {
          $("body").waitFor("click");
          // do something after a click was fired
        }


    ### jQuery functions that get a stratified version

    <table cellspacing=0>
      <tr><td style='width:13em'>jQuery</td><td>
      get, post, getJSON, getScript <br/>though we recommend the http module for these
      </td></tr>
      <tr><td>jQuery.fn</td><td>
      animate, show, hide, load, bind, live
      </td></tr>
      <tr><td>Events</td><td>
      blur focus focusin focusout load resize scroll unload click dblclick
      mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave
      change select submit keydown keypress keyup error.
      </td></tr>
      <tr><td>Special cases</td><td>
      $bind automatically calls unbind when the event happened<br/>
      $bind has an alias: waitFor<br/>
      $live automatically calls die when the event happened
      </td></tr>
    </table>

*/

var jQuery;

function installMethods(obj, methods, prefix) {
  var stub = {};
  for (var i = 0, m; m = methods[i]; i++) {
    stub[prefix(m[0])] = (function(name, cbindex) {
      return function() {
        var args = Array.prototype.slice.call(arguments,0);
        var rv;
        try {
          waitfor(rv) {
            args[cbindex] = resume;
            this[name].apply(this, args);
          }
        }
        finally {
          if (name == "bind")
            this["unbind"].call(this, args[0], args[cbindex]);
          if (name == "live")
            this["die"].call(this, args[0], args[cbindex]);
        }
        return rv;
      }
    }) (m[0], m[1]);
  }
  obj.extend(stub);
}

function installPlugin($, prefix) {
  installMethods($,     [ ["get", 2], ["post", 2], ["getJSON", 2], ["getScript", 1] ], prefix);
  installMethods($.fn,  [ ["animate", 3], ["show", 1], ["hide", 1], ["load", 2], ["bind", 2], ["live", 2]], prefix);
  
  // list of events copied from jquery source
  $.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
    "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
    "change select submit keydown keypress keyup error").split(" "), function( i, name ) {
    $.fn[prefix(name)] = function() {
      return this[prefix("bind")](name);
    };
  });
  $.fn.waitFor = $.fn[prefix("bind")];
}

/**
  @function  install
  @summary   Installs the jQuery and by default the stratified functions.
  @param     {optional Object} [settings] An optional set of key/value pairs that configuring the installation.
  @setting   {Boolean} [autoload=true] Defines if jQuery should be loaded if 'window.jQuery' does not exist yet.
  @setting   {Boolean} [stratify=true] Defines if stratified jQuery wrappers/plugins should be installed. e.g. .click(callback) -> .$click().
  @setting   {String} [url=Google CDN] A string containing the URL to the jQuery library which will be loaded in case it doesn't exist yet and autoload is enabled. This can be a cross-domain or local URL.
  @setting   {String} [version=1.4.2] A string defining the version of jQuery to load from Google's CDN in case the 'url' setting is not changed.
  @XXXsetting   {Function} [prefix=$fnname] Every function's name that gets a stratified version is filtered through this.  function (name) { return "$"+name;}.
  @return    {jQuery} A jQuery object with the stratified plugin installed.
*/

function defaultPrefix(name) {
  //return "waitFor" + name[0].toUpperCase() + name.substring(1);
  return "$" + name;
}

exports.install = function (opts) {
  opts = opts || {};
  if (opts.autoload === undefined) opts.autoload = true;
  if (opts.prefix === undefined) opts.prefix = defaultPrefix;
  if (opts.stratify === undefined) opts.stratify = true;
  
  if (!window["jQuery"] && opts.autoload) {
    exports.load(opts);
  }
  
  if (opts.stratify) {
    installPlugin(window.jQuery, opts.prefix);
  }

  return window.jQuery;
};

exports.load = function (opts) {
  if (!window["jQuery"]) {
    var version = opts.version || "1.4.2";
    var url = opts.url || "http://ajax.googleapis.com/ajax/libs/jquery/"+version+"/jquery.min.js";
    require("./dom").script(url);
    // wait for jquery to be initialized (crucial on IE):
    while (!window.$)
      hold(10);
  }
};


