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

/**
 * @constructor
 * @private
 */
apf.AbstractEvent = function(event, win) {
    win = win || window;
    var doc = win.document;
    event = event || win.event;
    if (event.$extended) return event;
    this.$extended = true;

    this.event = event;

    this.type   = event.type;
    this.target = event.target || event.srcElement;
    while (this.target && this.target.nodeType == 3)
        this.target = this.target.parentNode;

    if (this.type.indexOf("key") != -1) {
        this.code = event.which || event.keyCode;
        /*this.key = apf.AbstractEvent.KEYS.fromCode(this.code);
        if (this.type == 'keydown') {
            var fKey = this.code - 111;
            if (fKey > 0 && fKey < 13)
                this.key = 'f' + fKey;
        }
        this.key = this.key || String.fromCharCode(this.code).toLowerCase();*/
    }
    else if (this.type.match(/(click|mouse|menu)/i)) {
        doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
        this.page = {
            x: event.pageX || event.clientX + (doc ? doc.scrollLeft : 0),
            y: event.pageY || event.clientY + (doc ? doc.scrollTop  : 0)
        };
        this.client = {
            x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
            y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
        };
        if (this.type.match(/DOMMouseScroll|mousewheel/)){
            this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
        }
        this.rightClick = (event.which == 3) || (event.button == 2);
        this.relatedTarget = null;
        if (this.type.match(/over|out/)) {
            if (this.type == "mouseover")
                this.relatedTarget = event.relatedTarget || event.fromElement;
            else if (this.type == "mouseout")
                this.relatedTarget = event.relatedTarget || event.toElement;
            else {
                try {
                    while (this.relatedTarget && this.relatedTarget.nodeType == 3)
                        this.relatedTarget = this.relatedTarget.parentNode;
                }
                catch(e) {}
            }
        }
    }
    
    this.shift   = Boolean(event.shiftKey);
    this.control = Boolean(event.ctrlKey);
    this.alt     = Boolean(event.altKey);
    this.meta    = Boolean(event.metaKey)

    this.stop = function(){
        return this.stopPropagation().preventDefault();
    };

    this.stopPropagation = function(){
        if (this.event.stopPropagation)
            this.event.stopPropagation();
        else
            this.event.cancelBubble = true;
        return this;
    };

    this.preventDefault = function(){
        if (this.event.preventDefault)
            this.event.preventDefault();
        else
            this.event.returnValue = false;
        return this;
    };
};

apf.AbstractEvent.KEYS = {
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
};

apf.AbstractEvent.stop = function(event) {
    return (new apf.AbstractEvent(event)).stop();
};

// #endif
