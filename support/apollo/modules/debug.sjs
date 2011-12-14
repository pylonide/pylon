/*
 * Oni Apollo 'debug' module
 * SJS xbrowser console and logging 
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
  @module  debug
  @summary Client-side stratified debugging tools
  @hostenv xbrowser
  @desc
    sample usage:

        var c = require("apollo:debug").console();
        c.log("Hello", document);
        c.warn("Oooh noo!");
*/

if (require('sjs:apollo-sys').hostenv != 'xbrowser') 
  throw new Error('the debug module only runs in an xbrowser environment');

var common = require('./common');
var collection = require('apollo:collection');

//----------------------------------------------------------------------
// logging

var logReceivers = [];

function installLogger(logger) {
  var logging = require('apollo:logging');
  logReceivers.push(logger);
  if(logReceivers.length == 1) { // this is the first logger
    logging.setConsole({log: printToLoggers});
  }
};

function uninstallLogger(logger) {
  var idx = collection.findKey(logReceivers, function(r) { return r == logger; });
  if(idx === undefined) return; // logger was never installed
  logReceivers.splice(idx, 1);

  if(logReceivers.length == 0) { // last logger removed
    var logging = require('apollo:logging');
    logging.setConsole();
  }
};

/**
  @function log
  @summary Log the given object to all Stratfied JS consoles created with *receivelog* = *true*.
  @param {Object} [obj] Object to log.
  @deprecated since 0.13 - use the functions in the [logging::] module instead.
*/
var printToLoggers = exports.log = function() {
  var logArgs = arguments;
  collection.each(logReceivers, function(c) {
    c.log.apply(c, logArgs);
  });
};

//----------------------------------------------------------------------
// console helpers

var fontStyle = "font:12px monospace;"
var execStyle = "color:rgb(84,138,198);";
var systemStyle = "color:#888;";
var icons = {
  arrowblue:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAMCAYAAACwXJejAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHNJREFUeNpiYCAFuLfdUcAlxwRVEACk7gPpBJyKgEAASs8HKuxHV8SIZB3ItPlQDQt2VqkkYiiCKjQAUvuhCg8AcSBQ8QcmNJORHf8Bm3UJUOsY0K2D+a4ASUEjsgIQYIHSB6DGFwIVLMAXmAIMlACAAAMAwjQlc6knNh8AAAAASUVORK5CYII=",
  arrowdark:  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAMCAYAAACwXJejAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHNJREFUeNpiYCAFzJw5UwGXHBNUQQCQug+kE3AqAgIBKD0fqLAfXREjknUg0+ZDNSxIT09PxFAEVWgApPZDFR4A4kCg4g9MaCYjO/4DNusSoNYxoFsH810BkoJGZAUgwAKlD0CNLwQqWIAvMAUYKAEAAQYAh/Ul+0ewq2IAAAAASUVORK5CYII=",
  clear:      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAKZJREFUeNpiYCARMCJzZs6cmQCk8oHYACp0AYgnpqenL8DQAFQ8H0gl4DB4AVBTIojBhGQyTPEHIFYEYkEgboSKJUDVQDRAnQFTLADE60EcoKkNSJrykTXA3GwIdTeIvx9oKkjzBGQ1TGhuBdngiKwJaiMcMCGFBggUAJ2Bruk8shqYholQuh7ojAYoOxDJT3A15AUrNERAAolIzoM5IxGmmCwAEGAA1RE0WajjFisAAAAASUVORK5CYII=",
  shut:   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGJJREFUeNpiYCARMIKImTNnNgCpegJqG9PT0xuYgIoFiFDMAFPDgiwCNIERm0qgof9hbCagog+k+IGJVE+z4LD6AtBmQ1JsMCDKSbg8jS0e/hPjfpCBMBsaiVDfyEAOAAgwANi1GX1uUGWvAAAAAElFTkSuQmCC",
  treeclosed: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAFhJREFUeNpiYCAVNDQ07AdiBVzyTEhsByC+D1TcD8QC+BTCQAFUQwGyICOS1f+xaHoAxIlAuQNMxPqBBYf4ByBuBJo0AZ/CCVBFH3CZeADqngcMlACAAAMAv7Icc+yXbNgAAAAASUVORK5CYII=",
  treeopen:   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAF5JREFUeNpiYKA2YGxoaEgA0vNxyH8AYkOgmgdMQGIBkHMBh8KJIEUgBhNUoBCLogdARQ0wDlghkH8ASG1AU4iimQmHxAGg5g1YFULd0ojLKSxo/AlQTRfIDkeAAAMAtK4cNkAjG14AAAAASUVORK5CYII="
};
var isIE = /msie ([0-9]{1,}[\.0-9]{0,})/i.exec(navigator.userAgent);
var isWebkitMobile = /webkit.*mobile/i.test(navigator.userAgent);
if (isWebkitMobile) fontStyle = "font:12px monospace;line-height:18px;"
if (isIE) isIE = parseFloat(isIE[1]);
if (isIE && isIE < 8) for (var p in icons) icons[p] = "http://onilabs.com/images/console/" + p + ".png";
var setStyle = function() {
  if(isIE) // should check for feature instead of browser
  return function (el, style) { el.style.setAttribute("cssText", style); return el;};
  else return function (el, style) { el.setAttribute("style", style); return el;};
}();
function testFont(name) {
  var body = document.getElementsByTagName("body")[0];
  var test = makeDiv(
    '<b style="display:inline !important; width:auto !important; font:normal 10px/1 \''+name+'\',sans-serif !important">ii</b>'+
    '<b style="display:inline !important; width:auto !important; font:normal 10px/1 \''+name+'\',monospace !important">ii</b>',
    'position: absolute; visibility: hidden; display: block !important');
  body.insertBefore(test, body.firstChild);
  var ab = test.getElementsByTagName('b');
  var installed = ab[0].offsetWidth === ab[1].offsetWidth;
  body.removeChild(test);
  return installed;
}
if (testFont("monaco")) fontStyle = "font:10px monaco;";

function makeDiv(content, style) {
  var rv = document.createElement("div");
  if (style) setStyle(rv, style);
  if (content)
    rv.innerHTML = content;
  return rv;
}

//----------------------------------------------------------------------
// inspectable objects

function has_props(obj) {
  for (var a in obj) {
    return true;
  }
  return false;
}

function to_safestring(obj) {
  var name;
  try { name = obj.toString(); if(name) return name; } catch(e) {}
  try { name = obj.tagName; if(name) return name; } catch(e) {}
  try { name = obj.nodeName; if(name) return name; } catch(e) {}
  try { name = (typeof obj); if(name) return name; } catch(e) {}
  return "";
  // outerHTML?
}

function inspect_obj(obj, name) {
  if (name)
    name = "<span style='font-weight:normal'>"+common.sanitize(name) + ":</span> ";
  else
    name = "";

  var indent = name ? "<span style='width:12px;height:12px;float:left;'></span>" : "";
  var objdesc;
  if (typeof obj == "function")
    objdesc = "function "+common.sanitize(obj.name || "")+"() {...}";
  else if (obj == undefined || obj === true || obj === false) // this catches 'null' too
    return makeDiv(indent+name + "<span style='"+systemStyle+"'>"+obj+"</span>");
  else if (typeof obj == "string")
    return makeDiv(indent+name + '"'+common.sanitize(obj)+'"', "white-space:pre;");
  else if (typeof obj == "number")
    return makeDiv(indent+name+obj, "white-space:pre;");

  if (!has_props(obj)) {
    if (!objdesc) {
      if (Array.isArray(obj))
        objdesc = "[]";
      else if (obj)
        objdesc = "{}"; /* common.sanitize(to_safestring(obj)); */
      else
        objdesc = obj;
    }
    return makeDiv(indent+name + objdesc, "white-space:pre;");
  }
  // else
  if (!objdesc) {
    if (Array.isArray(obj)) {
      objdesc = "[<"+obj.length+">]";
    }
    else {
      objdesc = to_safestring(obj);
      var m = objdesc.match(/\[object (\w+)\]/);
      if (m) objdesc = m[1];
    }
  }
  var rv = makeDiv("\
<div><span style='cursor:pointer'><span 
    style='margin:0 2px 0 -2px;background:url("+icons.treeclosed+") no-repeat 0px 2px;float:left;display:block;width:12px;height:12px'>\
    </span>"+name+"<span style='"+systemStyle+"'>"+common.sanitize(objdesc)+"</span>\
  </span>
</div>");
  spawn((function() {
    var toggle = rv.firstChild.firstChild;
    while (true) {
      require('./dom').waitforEvent(toggle, 'click');
      var children = makeDiv(null, "margin-left:15px");
      var props = Object.keys(obj);
      props.sort();
      for (var i = 0, p; p = props[i]; ++i) {
        try {
          children.appendChild(inspect_obj(obj[p], p));
        } catch (e) {
          children.appendChild(inspect_obj(e, p));
        }
      }
      rv.appendChild(children);
      toggle.firstChild.style.backgroundImage = "url("+icons.treeopen+")";
      require('./dom').waitforEvent(toggle, 'click');
      toggle.firstChild.style.backgroundImage = "url("+icons.treeclosed+")";
      rv.removeChild(children);
      children = null;
    }
  })());
  return rv;
}

// for emulating position:fixed on webkit:
function viewportStick(el, offset) {
  offset = offset || 0;
  el.style.position = "absolute";
  el.style.bottom = "auto";
  el.style.webkitTransition = "top 0.2s ease-in";
  el.style.top = (window.innerHeight + window.pageYOffset - el.offsetHeight) + "px";
//  el.style.top = (window.pageYOffset+offset) + "px";
}

//----------------------------------------------------------------------
// console/commandline


/**
  @class Console
  @summary Stratified JavaScript console.
  @desc
     Use function [::console] to open a new Console object.

  @function console
  @param    {optional Object} [settings]
  @summary  Open a Stratified JavaScript console.
  @setting  {Boolean} [collapsed=true] Show the summon button on the bottom left of the window.
  @setting  {Number} [height=200] Default height for the resizable console (only relevant for target:null. 
  @setting  {String} [target=null] Id of parent DOM element. If null, a full-width resizable div will be appended to the document.
  @setting  {Boolean} [receivelog=false] Whether the console will act as an output for messages from the [logging::] module.
  @return   {::Console}
*/
exports.console = function(opts) {  
  return new Console(opts);
};

function Console(opts) {
  opts = common.mergeSettings({
    collapsed : true,
    height: 200,
    fullscreen: isWebkitMobile ? true : false,
    receivelog: false
  }, opts);

  if (opts.receivelog) installLogger(this);
                              
  var div = document.createElement("div");
  var parent = opts.target ? document.getElementById(opts.target) : null;
  if (!parent) {
    parent = makeDiv(null, "position:fixed;bottom:0;left:0;width:100%;z-index:99999;"+
      (opts.fullscreen?"position:absolute;top:0;":"height:"+opts.height+"px;"));
    document.getElementsByTagName("body")[0].appendChild(parent);
    this.root = parent;
  } else {
    this.root = div;
  }
  this.flipmode = isWebkitMobile; // console bottom?
  setStyle(div, fontStyle+ "\
position:relative;\
height:100%;\
width:100%;\
padding:0; margin:0; background:#fff;\
border"+(opts.target?"":"-top")+": 1px solid #ccc;");
  div.innerHTML = "\
<span style='display:block;cursor:row-resize;position:absolute;top:0px;border-top:1px solid #eee;left:0;right:0;height:2px;background:white;z-index:99999'></span>
<div style='margin:0;position:absolute;top:"+(this.flipmode?20:0)+"px;left:0;right:0px;bottom:"+(this.flipmode?0:20)+"px;overflow:auto'>
</div>\
<div style='height:20px;position:absolute;left:0;right:0;"+(this.flipmode?"top:0;":"bottom:0;")+"background: #fcfcfc url("+icons.arrowblue+") 6px 4px no-repeat;'>\
  <div style='z-index:99999;height:20px;position:absolute;right:0;'>
    <a title='Hide console' style='cursor:pointer;background:url("+icons.shut+") no-repeat 4px 4px; width:12px;height:12px; padding: 4px; display:block;float:left'></a>
    <a title='Clear console' style='cursor:pointer;background:url("+icons.clear+") no-repeat 4px 4px; width:12px;height:12px; padding: 4px; display:block;float:left'></a>
  </div>
  <div style='height:20px;position:absolute;left:0; "+((!isIE || isIE>7)?"right:40px;":"")+"padding:0 0 0 20px'>\
    <input type='text' style='line-height:15px;-webkit-appearance: caret;"+fontStyle+"width:100%;margin:2px 0 0 0;border:0;padding:0;background:transparent;outline:none'/>\
  </div>\
</div>";
  parent.appendChild(div);
  this.output = div.getElementsByTagName("div")[0];
  this.closebutton = div.getElementsByTagName("a")[0];
  this.clearbutton = div.getElementsByTagName("a")[1];
  this.resizehandle = div.getElementsByTagName("span")[0];
  this.cmdline = div.getElementsByTagName("input")[0];
  this.cmdloop_stratum = spawn this._cmdloop();
  try {
    this.history = (window["sessionStorage"] && window["JSON"] && window.sessionStorage.history) ? 
                 JSON.parse(sessionStorage.history) : [""];
  }
  catch (e) {
    // when accessing sessionStorage.history from a file url we get 
    // NS_ERROR_DOM_NOT_SUPPORTED_ERR on FF
    this.sessionStorageBroken = true;
    this.history = [""];
  }
  this.history_p = this.history.length -1;
  this.summonbutton = makeDiv("<div style='background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(#fff), to(#eee));'><a title='Open Apollo Console' style='display:block;padding: 2px 8px 3px 10px;background:url("+icons.arrowblue+") no-repeat 10px 6px;width: 8px;height:17px'></a></div>", "\
position:fixed;bottom:-2px; left:-4px;border-radius: 3px;-webkit-border-radius: 3px;
z-index:9999; line-height:20px; border: 1px solid #ddd;visibility:hidden;cursor:pointer;background: #fff;");
  document.getElementsByTagName("body")[0].appendChild(this.summonbutton);
  if (opts.target) {
    opts.collapsed = false;
    this.closebutton.parentNode.removeChild(this.closebutton);
  }
  if (opts.collapsed) {
    this.shut();
  }
}
Console.prototype = {
  _cmdloop: function() {
    waitfor {
      using (var Q = require('./dom').eventQueue(this.cmdline, 'keydown')) {
        while (true) {
          var key = Q.get().keyCode;
          //        this.log(key);
          switch (key) {
          case 10:
          case 13:
            if (!this.cmdline.value) continue;
            this.exec(this.cmdline.value);
            if (this.history.length > 50) this.history.shift();
            this.history[this.history.length-1] = this.cmdline.value;
            this.history_p = this.history.length;
            this.history.push("");
            if (!this.sessionStorageBroken && window["sessionStorage"] && window["JSON"]) 
              sessionStorage.history = JSON.stringify(this.history);
            this.cmdline.value = "";
            break;
          case 38: // key up
            if (this.history_p == 0) break;
            if (this.history_p == this.history.length-1) // save current commandline
              this.history[this.history_p] = this.cmdline.value;
            this.cmdline.value = this.history[--this.history_p];
            break;
          case 40: // key down
            if (this.history_p == this.history.length-1) break;
            // should we save the changes?
            this.cmdline.value = this.history[++this.history_p];
            break;
          }
        }
      }
    } 
    and {
      while(true) {
        // Can't wait for click on this.root here, because of
        // Android bug http://code.google.com/p/android/issues/detail?id=8575
        waitfor {
          require('./dom').waitforEvent(this.closebutton, "click");
          this.shut();
        }
        or {
          var ev = require('./dom').waitforEvent(this.output, "click");
          if (require('./dom').eventTarget(ev) == this.output)
            this.focus();
        }
        or {
          require('./dom').waitforEvent(this.clearbutton, "click");
          this.clear();
        }
      };
    }
    and {
      if (isWebkitMobile) {
        // emulate position:fixed on webkit:
        using (var Q2 = require('./dom').eventQueue(document.getElementsByTagName("body")[0], 'touchmove touchend')) {
          while(true) {
            viewportStick(this.summonbutton);
            Q2.get();
          };
        }
      }
    }
    and {
      while (true) {
        var ev = require('./dom').waitforEvent(this.resizehandle,"mousedown");
        var lasty = ev.clientY;
        document.documentElement.style.webkitUserSelect = "none";
        waitfor {
          require('./dom').waitforEvent(document, "mouseup");
        }
        or {
          using (var mm = require('./dom').eventQueue(document, "mousemove")) {
            while (1) {
              var ev = mm.get();
              var h = lasty - ev.clientY + this.root.clientHeight;
              if (h > 70) {
                this.root.style.height = h + "px";
                lasty = ev.clientY;
              }
            }
          }
        }
        document.documentElement.style.webkitUserSelect = "auto";
      }
    }
  },
  
  _append: function(e) {
    if (this.flipmode) {
      this.output.insertBefore(e, this.output.firstChild);
    } else {
      this.output.appendChild(e);
      this.output.scrollTop = this.output.scrollHeight;
    }
  },

  /**
    @function Console.shut
    @summary Collapses the console.
   */
  shut : function () {
    this.root.style.display = "none";
    this.summonbutton.style.visibility = "visible";
    spawn (require('./dom').waitforEvent(this.summonbutton, "click"),
           this.expand());
  },
  
  /**
    @function Console.expand
    @summary Restores a collapsed console.
   */
  expand : function () {
    this.root.style.display = "block";
    this.summonbutton.style.visibility = "hidden";
    this.focus();
  },

  /**
    @function Console.exec
    @summary Execute the given commandline in this console.
    @param {String} [cl] Commandline string.
   */
  exec: function(cl) {
    var e = document.createElement("div");
    setStyle(e, fontStyle+"background:#fff url("+icons.arrowdark+") 6px 6px no-repeat;line-height:15px;border-bottom: 1px solid #eee; padding: 5px 15px 4px 20px");
    e.innerHTML = "<div style='"+execStyle+";margin-bottom:2px;white-space:pre;'>"+common.sanitize(cl)+"</div>";
    this._append(e);
    var me = this;
    spawn((function() {
      var result = document.createElement('div');
      waitfor {
        try {
          result = inspect_obj(require('sjs:apollo-sys').eval(cl, {filename:"commandline"}));
        }
        catch(ex) {
          setStyle(result, 'color:red;');
          // *sigh* IE6's Error.toString just prints '[object Error]'. hack:
          var message = ex ? ex.toString() : "<Error>";
          if (message == "[object Error]") message = ex.message || "<Error>";
          result.innerHTML = common.sanitize(message);
        }
      }
      or {
        try {
          e.firstChild.innerHTML += "<a title='Cancel this stratum' style='text-decoration:underline;cursor:pointer;float:right'>abort</a>";
          var b = e.firstChild.lastChild;
          require('./dom').waitforEvent(b, "click");
          result.innerHTML = "<span style='color:red'>Aborted</span>";
        }
        finally {
          b.parentNode.removeChild(b);
        }
      }
      e.appendChild(result);
      if (!me.flipmode) 
        me.output.scrollTop = me.output.scrollHeight;
    })());
  },

  _log: function(args, color) {
    //var s = Array.prototype.splice.call(args, 0).join(", ");
    var e = document.createElement("div");
    setStyle(e, fontStyle+"border-bottom: 1px solid #eee; padding: 6px 15px 4px 20px;" + 
                            (color ? ("color:" + color) : ""));
//    e.innerHTML = common.sanitize(s.toString()); 
    for (var i = 0; i < args.length; ++i) {
      e.appendChild(inspect_obj(args[i]));
    }
    this._append(e);
  },
  /**
    @function Console.log
    @summary Log the given object to the console.
    @param {Object} [obj] Object to log.
   */
  log : function() {
    this._log(arguments);
  },
  /**
    @function Console.warn
    @summary Write a warning to the console.
    @param {String} [str] Warning string.
   */
  warn: function() {
    this._log(arguments, "darkorange");
  },
  /**
    @function Console.error
    @summary Write an error to the console.
    @param {String} [str] Error string.
   */
  error: function() {
    this._log(arguments, "red");
  },
  
  /**
    @function Console.clear
    @summary Clear the console.
   */
  clear : function() {
    this.output.innerHTML = "";
  },

  /**
    @function Console.focus
    @summary Focus the console.
   */
  focus: function() { try { this.cmdline.focus(); } catch(e) {/* let this one slip */ } },
  
  /**
    @function Console.shutdown
    @summary Shutdown this console.
   */
  shutdown: function() {
    uninstallLogger(this);
    // XXX this.cmdloop_stratum.abort();
    this.root.parentNode.removeChild(this.root);
  },
  
  /**
    @function  Console.__finally__
    @summary   Calls [::Console::shutdown].
               Allows Console to be used in a 'using' construct.
   */
  __finally__: function() { this.shutdown(); }
};
