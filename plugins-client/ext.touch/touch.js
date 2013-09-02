(function() {
  var TouchManager,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  TouchManager = (function() {
    function TouchManager() {
      this.scroll = __bind(this.scroll, this);
      this.click = __bind(this.click, this);
      this.touchcancel = __bind(this.touchcancel, this);
      this.touchend = __bind(this.touchend, this);
      this.touchmove = __bind(this.touchmove, this);
      this.touchstart = __bind(this.touchstart, this);
      this.log = __bind(this.log, this);
      this.createMeta = __bind(this.createMeta, this);
      this.init = __bind(this.init, this);
    }

    TouchManager.prototype.init = function() {
      document.addEventListener("touchstart", this.touchstart, true);
      document.addEventListener("touchmove", this.touchmove, true);
      document.addEventListener("touchend", this.touchend, true);
      document.addEventListener("touchcancel", this.touchcancel, true);
      this.startY = 0;
      this.createMeta("viewport", "user-scalable=1.0,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0");
      this.createMeta("apple-mobile-web-app-capable", "yes");
      this.createMeta("format-detection", "telephone=no");
    };

    TouchManager.prototype.createMeta = function(name, content) {
      var body, meta;
      body = document.getElementsByTagName("head")[0];
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('content', content);
      body.appendChild(meta);
    };

    TouchManager.prototype.log = function(msg) {
      if (typeof console !== "undefined" && console !== null) {
        console.log(msg);
      }
    };

    TouchManager.prototype.touchstart = function(e) {
      e.preventDefault();
      if ((e.touches != null) && e.touches.length === 1) {
        this.click(e);
      }
      return false;
    };

    TouchManager.prototype.touchmove = function(e) {
      if ((e.touches != null) && e.touches.length === 2) {
        this.scroll(e);
      } else {
        e.preventDefault();
      }
    };

    TouchManager.prototype.touchend = function(e) {};

    TouchManager.prototype.touchcancel = function(e) {};

    TouchManager.prototype.click = function(e) {
      var se, touch;
      this.log("click");
      touch = e.touches[0];
      se = document.createEvent("MouseEvents");
      se.initMouseEvent('click', true, true, window, 1, touch.clientY, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, e.target);
      document.dispatchEvent(se);
      return this.log("click finished");
    };

    TouchManager.prototype.scroll = function(e) {
      var direction, se, touch, wheelData, _ref, _ref1;
      this.log("scroll");
      touch = e.touches[0];
      if (Math.abs(touch.clientY - this.startY) < 10) {
        return;
      }
      direction = (_ref = (touch.clientY - this.startY) > 0) != null ? _ref : {
        'up': 'down'
      };
      se = document.createEvent("MouseEvents");
      wheelData = (_ref1 = direction === 'up') != null ? _ref1 : {
        10: -10
      };
      se.initMouseEvent("mousewheel", true, true, window, wheelData, 0, 0, 0, 0, false, false, false, false, 0, touch.target);
      return touch.target.dispatchEvent(se);
    };

    return TouchManager;

  })();

  define(function(require, exports, module) {
    var ext;
    ext = require("core/ext");
    return module.exports = ext.register("ext/touch/touch", {
      name: "Touch Support",
      dev: "Azerothian",
      type: ext.GENERAL,
      deps: [],
      alone: true,
      init: function() {
        new TouchManager().init();
      }
    });
  });

}).call(this);
