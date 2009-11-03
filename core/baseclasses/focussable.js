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

apf.__FOCUSSABLE__ = 1 << 26;

//#ifdef __WITH_FOCUS
apf.Focussable = function(){
    this.$regbase = this.$regbase | apf.__FOCUSSABLE__;
    
    /**
     * Sets the position in the list that determines the sequence
     * of elements when using the tab key to move between them.
     * Call-chaining is supported.
     * @param {Number} tabindex the position in the list
     */
    this.setTabIndex = function(tabindex){
        apf.window.$removeFocus(this);
        apf.window.$addFocus(this, tabindex);
        return this;
    };

    /**
     * Gives this element the focus. This means that keyboard events
     * are send to this element.
     */
    this.focus = function(noset, e, nofix){
        if (!noset) {
            if (this.$isWindowContainer) {
                apf.window.$focusLast(this, e, true);
            }
            else {
                apf.window.$focus(this, e);

                //#ifdef __WITH_WINDOW_FOCUS
                if (!nofix && apf.hasFocusBug)
                    apf.window.$focusfix();
                //#endif
            }

            return this;
        }

        if (this.$focus)
            this.$focus(e);

        this.dispatchEvent("focus", apf.extend({
            srcElement : this,
            bubbles    : true
        }, e));
        return this;
    };

    /**
     * Removes the focus from this element.
     * Call-chaining is supported.
     */
    this.blur = function(noset, e){
        //#ifdef __WITH_POPUP
        if (apf.popup.isShowing(this.$uniqueId))
            apf.popup.forceHide(); //This should be put in a more general position
        //#endif
        
        if (this.$blur)
            this.$blur(e);

        if (!noset)
            apf.window.$blur(this);

        this.dispatchEvent("blur", apf.extend({
            srcElement : this,
            bubbles    : !e || !e.cancelBubble
        }, e));
        return this;
    };

    /**
     * Determines whether this element has the focus
     * @returns {Boolean} indicating whether this element has the focus
     */
    this.hasFocus = function(){
        return apf.document.activeElement == this || this.$isWindowContainer
            && (apf.document.activeElement || {}).$focusParent == this;
    };
};

// #endif
