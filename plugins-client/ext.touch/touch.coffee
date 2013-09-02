class TouchManager
  init: () =>
    document.addEventListener "touchstart", @touchstart, true;
    document.addEventListener "touchmove", @touchmove, true;
    document.addEventListener "touchend", @touchend, true;
    document.addEventListener "touchcancel", @touchcancel, true;
    @startY = 0;
    @createMeta "viewport","user-scalable=1.0,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0"
    @createMeta "apple-mobile-web-app-capable","yes"
    @createMeta "format-detection","telephone=no"
    return;
  createMeta: (name, content) =>
    body = document.getElementsByTagName("head")[0];
    meta = document.createElement('meta');
    meta.setAttribute('name',name);
    meta.setAttribute('content',content);
    body.appendChild(meta);
    return;
  log: (msg) =>
    if console?
      console.log msg
    return;
  touchstart: (e) =>
    e.preventDefault();
    #@log "touchstart"
    if e.touches? && e.touches.length == 1
      @click e;
    return false;

  touchmove: (e) =>
    #@log "touchmove"
    if e.touches? && e.touches.length == 2
      @scroll e;
    else
      e.preventDefault();
    return;
  touchend: (e) =>
    
  touchcancel: (e) =>
    
  click: (e) =>
    @log "click"
    touch = e.touches[0];
    se = document.createEvent "MouseEvents";
    se.initMouseEvent 'click', true, true, window, 1, touch.clientY,  touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, e.target;
    document.dispatchEvent se;
    @log "click finished"
  scroll: (e) =>
    @log "scroll"
    touch = e.touches[0]
    if Math.abs(touch.clientY - @startY) < 10
      return;
    direction = (touch.clientY - @startY) > 0 ? 'up': 'down'
    se = document.createEvent("MouseEvents")
    wheelData = (direction == 'up') ? 10 : -10;
    se.initMouseEvent "mousewheel", true, true, window, wheelData, 0,  0,  0,  0, false, false, false, false, 0, touch.target
    touch.target.dispatchEvent se;

#exports for cloud9
define((require, exports, module) ->
  ext = require "core/ext";
  #ide = require "core/ide";
  module.exports = ext.register "ext/touch/touch",
    name: "Touch Support"
    dev: "Azerothian"
    type: ext.GENERAL
    deps: []
    alone: true
    init: ->
      new TouchManager().init();
      return;
)