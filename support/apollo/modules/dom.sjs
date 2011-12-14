/*
 * Oni Apollo 'dom' module
 * DOM utilities
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
  @module    dom
  @summary   Utilities for interacting with the DOM
  @hostenv   xbrowser
*/

var sys = require('sjs:apollo-sys');
if (require('sjs:apollo-sys').hostenv != 'xbrowser') 
  throw new Error('the dom module only runs in an xbrowser environment');

//------------------------------------------------------------
// event helpers

function elementsFromSelector(selector) {
  var elems;
  // at the moment we only do simple, single element selectors
  if (typeof selector === "string")
    elems = [document.getElementById(selector)];
  else if (sys.isArrayOrArguments(selector))
    elems = selector;
  else
    elems = [selector];
  
  return elems;
}

/*
  @function addListener
  @summary Cross-platform event helper. Adds event listener.
  @param {DOMElement} [elem] DOM element to set handler on.
  @param {String} [type] Event type (e.g. 'click', 'mousemove').
  @param {Function} [handler] Handler function.
*/
function addListener(elem, type, handler) {
  if (elem.addEventListener)
    elem.addEventListener(type, handler, false);
  else // IE
    elem.attachEvent("on"+type, handler);
}
exports.addListener = addListener;


/*
  @function removeListener
  @summary Cross-platform event helper. Removes event listener.
  @param {DOMElement} [elem] DOM element to remove handler from.
  @param {String} [type] Event type (e.g. 'click', 'mousemove').
  @param {Function} [handler] Handler function.
*/
function removeListener(elem, type, handler) {
  if (elem.removeEventListener)
    elem.removeEventListener(type, handler, false);
  else // IE
    elem.detachEvent("on"+type, handler);
}
exports.removeListener = removeListener;

/*
  @function  eventTarget
  @summary Cross-platform event helper. Retrieves event target.
  @param {DOMEvent} [ev] DOM event object.
  @return {DOMElement} Event target (ev.srcElement on IE, ev.target elsewhere)
*/
exports.eventTarget = function(ev) {
  return ev.target || ev.srcElement;
};

/*
  @function pageX
  @summary Cross-platform event helper. Returns page coordinate of event.
  @param {DOMEvent} [ev] DOM event object.
  @return {Integer}
*/
exports.pageX = function(ev) {
//  if (ev.touches) ev = ev.touches[0];
  if (ev.pageX !== undefined) return ev.pageX;
  return ev.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
};

/*
  @function pageY
  @summary Cross-platform event helper. Returns page coordinate of event.
  @param {DOMEvent} [ev] DOM event object.
  @return {Integer}
*/
exports.pageY = function(ev) {
//  if (ev.touches) ev = ev.touches[0];
  if (ev.pageY !== undefined) return ev.pageY;
  return ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
};

/*
  @function preventDefault
  @summary Cross-platform event helper. Cancels default action of given event.
  @param {DOMEvent} [ev] DOM event object.
*/
exports.preventDefault = function(ev) {
  if (ev.preventDefault) {
    ev.preventDefault();
  }
  else {
    // IE
    ev.returnValue = false;
  }
};


/*
  @function stopEvent
  @summary Cross-platform event helper. Cancels propagation, bubbeling and default action of given event.
  @param {DOMEvent} [ev] DOM event object.
*/
exports.stopEvent = function(ev) {
  if (ev.preventDefault) {
    ev.preventDefault();
  }
  else {
    // IE
    ev.returnValue = false;
  }
  if (ev.stopPropagation) {
    ev.stopPropagation();
  }
  else {
    // IE
    ev.cancelBubble = true;
  }
};

//----------------------------------------------------------------------

/**
  @function  waitforEvent
  @summary   Blocks until one of the specified DOM events is triggered on the specified element.
  @param     {String | DOMElement} [selector] Id of DOM element or DOM element on which to wait for the given *events*.
  @param     {String} [events] String containing one or more space-separated DOM event names. E.g.: "click mouseover".
  @param     {optional Function} [filter] Function through which received
             events will be passed. [::waitforEvent]
             continues listening for events and won't return until the filter
             returns a value != true.
  @param     {optional Function} [eventTransformer] Function through which an
             event will be passed before passing the return value on to
             *filter* and/or returning it from *waitforEvent*.
  @return    {DOMEvent | Object} Event object associated with the event that
             was triggered. This will be the original DOMEvent, or a return
             value from *eventTransformer*.
  @desc
    **Example:**

        var e = dom.waitforEvent("myid", "click");
        alert(e.currentTarget);`

    **Keep observing events in an event loop:**

        while (require('apollo:dom').waitforEvent("myid", "mouseover")) {
          console.log("mouseover!");
        }

    Note that this type of event loop can lose events (which is
    sometimes desirable and sometimes isn't). See
    [::eventQueue] for an alternative.
*/
exports.waitforEvent = function(selector, events, filter, eventTransformer) {
  var elems = elementsFromSelector(selector);
  var elem_count = elems.length;
  
  events = events.split(" ");
  var event_count = events.length;
  
  waitfor(var rv = null) {
    function handleEvent(e) {
      // XXX on IE we should maybe clone events here.
      if (eventTransformer)
        e = eventTransformer(e);
      if (filter && !filter(e)) return;
      resume(e);
    }
    
    for (var i = 0; i < event_count; ++i )
      for (var j = 0; j < elem_count; ++j )
        addListener(elems[j], events[i], handleEvent);
  }
  finally {
    try {
      for (var i = 0; i < event_count; ++i )
        for (var j = 0; j < elem_count; ++j )
          removeListener(elems[j], events[i], handleEvent);
    }
    catch(e) {/* ignore errors */}
  }
  return rv;
};

//----------------------------------------------------------------------

/**
  @class EventQueue
  @summary Listens for specified events and stores them in a queue.
  @desc
     Use function [::eventQueue] to construct a new
     EventQueue object.

  @function  eventQueue
  @summary Constructs a new EventQueue object.
  @return  {::EventQueue}
  @param     {String | DOMElement} [selector] Id of DOM element or DOM element on which to listen for the given *events*.
  @param     {String} [events] A string containing one or more space-separated DOM event names. e.g: "click mouseover".
  @param     {optional Function} [filter] Function through which received
             events will be passed. An event 'e' will only be put into the queue
             if 'filter(e)==true'.
  @param     {optional Function} [eventTransformer] Function through which an
             event will be passed before passing the return value on to
             *filter* and/or entering it into the queue.
  @desc
    The returned [::EventQueue] object proceeds to listen for
    events immediately in the background, and continues to do so until
    [::EventQueue::stop] is called.

    Alternatively, because [::EventQueue] implements a
    [::EventQueue::__finally__] method, it can be used in a
    'using' block:

        using (var Q = require('apollo:dom').eventQueue(elem,"click")) {
          while (true) {
            var ev = Q.get();
            ...
          }
        }

    Here the `using` construct will automatically call
    [::EventQueue::__finally__] when the `using` code
    block is exited.
*/
exports.eventQueue = function(selector, events, filter, eventTransformer) {
  return (new EventQueue(selector, events, filter, eventTransformer));
};

function EventQueue(selector, events, filter, eventTransformer)
{
  // XXX we queue up to 100 events max. Does this need to be configurable?
  var capacity = 100;
  this._queue = new (require("./cutil").Queue)(capacity, true);
  this.elems = elementsFromSelector(selector);
  this.events = events.split(" ");

  var me = this;
  this._handleEvent = function(e) {
    if (eventTransformer)
      e = eventTransformer(e);
    // XXX on IE we should maybe clone events here already; in case filter blocks
    if (filter && !filter(e)) return;
    if (me._queue.size == capacity) {
      // XXX we could employ a different strategy here; e.g. drop at
      // head of queue
      throw new Error("Dropping event in EventQueue");
    }
    if (__oni_rt.UA == "msie") {
      // XXX IE hack:
      // We need to clone the event, or it won't make it to the other side.
      // XXX Unfortunately this also means that setting cancelBubble/returnValue
      // will not work 'on the other side'.
      var orig_g = e;
      e = {};
      for (var p in orig_g)
        e[p] = orig_g[p];
    }
    me._queue.put(e);
  };
  
  for (var i = 0; i < this.events.length; ++i )
    for (var j = 0; j < this.elems.length; ++j )
      addListener(this.elems[j], this.events[i], this._handleEvent);
}

EventQueue.prototype = {
  /**
    @function EventQueue.count
    @summary  Returns current number of events in the queue.
    @return   {Integer}
   */
  count: function() {
    return this._queue.count();
  },
  
  /**
    @function  EventQueue.get
    @summary   Retrieve the next event from the queue; blocks if the queue is empty.
               Safe to be called from multiple strata concurrently.
    @return {DOMEvent | Object} DOMEvent (or object returned from *eventTransformer*)
                                retrieved from head of queue.
   */
  get: function() {
    return this._queue.get();
  },
  
  /**
    @function  EventQueue.stop
    @summary   Stop listening for events.
    @desc
       See 'More information' section under [::eventQueue]
       for an alternative to calling [::EventQueue::stop]
       manually.
   */
  stop: function() {
    for (var i = 0; i < this.events.length; ++i )
      for (var j = 0; j < this.elems.length; ++j )
        removeListener(this.elems[j], this.events[i], this._handleEvent);
  },
  
  /**
    @function  EventQueue.__finally__
    @summary   Calls [::EventQueue::stop]
               Allows EventQueue to be used a `using` construct.
    @desc
       See 'More information' section under [::eventQueue].
   */
  __finally__: function() { this.stop(); }
};


//----------------------------------------------------------------------


var _pendingScripts = {};
var _loadedScripts = {};

/**
  @function  script
  @summary   Load and execute a plain JavaScript file.
  @param {URLSPEC} [url] Request URL (in the same format as accepted by [http::constructURL])
  @desc
    It is safe to call this function simultaneously from several strata,
    even for the same URL: The given URL will only be loaded **once**, and
    all callers will block until it is loaded.
    
    If a browser supports the error event for script tags, 
    this function will throw if it fails to load the URL.

    ### Example:

        var dom = require("apollo:dom");
        dom.script("http://code.jquery.com/jquery.js");
        jQuery("body").css({background:"red"});
*/
exports.script = function(/*url, queries*/) {
  var url = sys.constructURL(arguments);
  if (_loadedScripts[url])
  return;
  var hook = _pendingScripts[url];
  if (hook != null) {
    waitfor(var error) {
      hook.push(resume);
    }
    if (error) {
      throw error;
    }
    //    retract {
    // XXX could remove resume function from hook here
    //    }
  }
  else {
    // we're the initial requester
    waitfor() {
      var elem = document.createElement("script");
      var hook = [];
      var error;
      _pendingScripts[url] = hook;
      
      function listener(e) {
        if (e.type == "error") {
          error = "Could not load script: '" + url + "'."
        }
        resume();
      }
      
      function listenerIE(e) {
        if (e.srcElement.readyState == "loaded" ||
            e.srcElement.readyState == "complete") {
          hold(0);
          resume();
        }
      }
      
      if (elem.addEventListener) {
        elem.addEventListener("load", listener, false);
        elem.addEventListener("error", listener, false);
      }
      else {
        // IE
        elem.attachEvent("onreadystatechange", listenerIE);
      }
      
      // kick off the load:
      document.getElementsByTagName("head")[0].appendChild(elem);
      elem.src = url;
    }
    retract {
      _pendingScripts[url] = null;
    }
    finally {
      if (elem.removeEventListener) {
        elem.removeEventListener("load", listener, false);
        elem.removeEventListener("error", listener, false);
      }
      else {
        elem.detachEvent("onreadystatechange", listenerIE);
      }
    }

    _pendingScripts[url] = null;
    _loadedScripts[url] = true;
    for (var i = 0; i < hook.length; ++i) {
      hook[i](error);
    }
    if (error) {
      throw error;
    }
  }
};

/**
   @function addCSS
   @summary Programatically add CSS to current document
   @param {String} [cssCode] CSS code.
   @desc
     Borrowed from [tomhoppe.com](http://www.tomhoppe.com/index.php/2008/03/dynamically-adding-css-through-javascript/)
*/
exports.addCSS = function(cssCode) {
  var styleElement = document.createElement("style");
  styleElement.type = "text/css";
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = cssCode;
  } 
  else {
    styleElement.appendChild(document.createTextNode(cssCode));
  }
  document.getElementsByTagName("head")[0].appendChild(styleElement);
}

/**
  at function css
  at summary Load a CSS file into the current document.
  at param {URLSPEC} [url] Request URL (in the same format as accepted by [http::constructURL])
  at desc
*/
// XXX should be more robust: http://yui.yahooapis.com/2.8.1/build/get/get.js
/*
exports.css = function (url) {
  var url = constructURL(arguments);
  var elem = document.createElement("link");
  elem.setAttribute("rel", "stylesheet");
  elem.setAttribute("type", "text/css");
  elem.setAttribute("href", "url");
  document.getElementsByTagName("head")[0].appendChild(elem);
};
*/


//----------------------------------------------------------------------

/**
  @function setCookie
  @summary  Sets a cookie to keep data across browsing sessions.
  @param    {String} [name] Name of the cookie.
  @param    {String} [value] Value of the cookie.
  @param    {optional Number} [days] Integer defining the number of days this cookie will be stored.
  @desc
    If the optional *days* parameter is undefined or '==0',
    the cookie will live until the browser is closed.
*/

exports.setCookie = function(name, value, days) {
  var v = name + "=" + escape(value);
	if (days) {
		var date = new Date();
		date.setDate(date.getDate()+days);
    v += ";expires="+date.toUTCString();
	}
	document.cookie = v;
};

/**
  @function getCookie
  @summary  Retrieves a previously set cookie.
  @param    {String} [name] Name of the requested cookie.
  @return   {String} Value of the cookie or empty string if the cookie is not set.
*/
exports.getCookie = function(name) {
  var c, start;
  if (!(c = document.cookie) ||
      (start = c.indexOf(name+"=")) == -1)
    return "";
  start += name.length+1;
  end = c.indexOf(";", start);
  if (end == -1) end = c.length;
  return unescape(c.substring(start,end));
};

/**
  @function removeCookie
  @summary  Removes a previously set cookie.
  @param    {String} [name] Name of the cookie that is about to be eaten.
*/
exports.removeCookie = function(name) {
	exports.setCookie(name,"",-1);
};

