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

// #ifdef __AMLEVENT || __AMLNOTIFIER || __INC_ALL

/**
 * Displays a popup element with a message with optionally an icon at the
 * position specified by the position attribute. After the timeout has passed
 * the popup will dissapear automatically. When the mouse hovers over the popup
 * it doesn't dissapear.
 *
 * @event click Fires when the user clicks on the representation of this event.
 */
apf.event = function(struct, tagName){
    this.$init(tagName || "event", apf.NODE_HIDDEN, struct);
};

(function() {
    this.$hasInitedWhen = false;

    this.$booleanProperties["repeat"] = true;
    this.$supportedProperties.push("when", "message", "icon", "repeat");

    this.$propHandlers["when"] = function(value) {
        if (this.$hasInitedWhen && value && this.parentNode && this.parentNode.popup) {
            var _self = this;
            $setTimeout(function() {
                _self.parentNode.popup(_self.message, _self.icon, _self);
            });
        }
        this.$hasInitedWhen = true;

        if (this.repeat)
            delete this.when;
    };

    this.$loadAml = function(x) {};
}).call(apf.event.prototype = new apf.AmlElement());

apf.aml.setElement("event", apf.event);
// #endif