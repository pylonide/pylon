/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */
  
// #ifdef __WITH_ABSTRACTEVENT

jpf.AbstractEvent = function(event, win) {
    win = win || window;
    var doc = win.document;
    event = event || win.event;
    if (event.$extended) return event;
    this.$extended = true;

    this.event = event;

    var type   = event.type;
    var target = event.target || event.srcElement;
    while (target && target.nodeType == 3)
        target = target.parentNode;

    if (type.match(/key/)){
        var code = event.which || event.keyCode;
        var key = jpf.AbstractEvent.KEYS.fromCode(code);
        if (type == 'keydown'){
            var fKey = code - 111;
            if (fKey > 0 && fKey < 13) key = 'f' + fKey;
        }
        key = key || String.fromCharCode(code).toLowerCase();
    } else if (type.match(/(click|mouse|menu)/i)){
        doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
        var page = {
            x: event.pageX || event.clientX + doc.scrollLeft,
            y: event.pageY || event.clientY + doc.scrollTop
        };
        var client = {
            x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
            y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
        };
        if (type.match(/DOMMouseScroll|mousewheel/)){
            var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
        }
        var rightClick = (event.which == 3) || (event.button == 2);
        var related = null;
        if (type.match(/over|out/)){
            if (type == "mouseover")
                related = event.relatedTarget || event.fromElement;
            else if (type == "mouseout")
                related = event.relatedTarget || event.toElement;
            else {
                try {
                    while (related && related.nodeType == 3)
                        related = related.parentNode;
                } catch(e) {}
            }
        }
    }

    jpf.extend(this, {
        event     : event,
        type      : type,

        page      : page,
        client    : client,
        rightClick: rightClick,

        wheel     : wheel,

        relatedTarget: related,
        target    : target,

        code      : code,
        key       : key,

        shift     : event.shiftKey,
        control   : event.ctrlKey,
        alt       : event.altKey,
        meta      : event.metaKey
    });
}

jpf.AbstractEvent.KEYS = {
    'enter'    : 13,
    'up'       : 38,
    'down'     : 40,
    'left'     : 37,
    'right'    : 39,
    'esc'      : 27,
    'space'    : 32,
    'backspace': 8,
    'tab'      : 9,
    'delete'   : 46,

    fromCode: function(code) {
        for (var i in this) {
            if (this[i] == code)
                return i;
            return null;
        }
    }
}

jpf.AbstractEvent.addListener = function(el, type, fn){
    if (el.addEventListener)
        el.addEventListener(type, fn, false);
    else if (el.attachEvent)
        el.attachEvent('on' + type, fn);
    return this;
}

jpf.AbstractEvent.removeListener = function(type, fn){
    if (el.removeEventListener)
        el.removeEventListener(type, fn, false);
    else if (el.detachEvent)
        el.detachEvent('on' + type, fn);
    return this;
}

// #endif