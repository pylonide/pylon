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

ppc.__FOCUSSABLE__ = 1 << 26;

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have focussable
 * features
 * 
 * @class ppc.Focussable
 * @baseclass
 * 
 */
//#ifdef __WITH_FOCUS
ppc.Focussable = function(){
    this.$regbase = this.$regbase | ppc.__FOCUSSABLE__;
    if (this.disabled == undefined)
        this.disabled = false;
    
    /**
     * Sets the position in the list that determines the sequence
     * of elements when using the tab key to move between them.
     * @chainable
     * @param {Number} tabindex The position in the list
     */
    this.setTabIndex = function(tabindex){
        ppc.window.$removeFocus(this);
        ppc.window.$addFocus(this, tabindex);
        return this;
    };

    /**
     * Gives this element the focus. This means that keyboard events
     * are sent to this element.
     * @chainable
     */
    this.focus = function(noset, e, nofix){
        if (!noset) {
            if (this.$isWindowContainer > -1) {
                ppc.window.$focusLast(this, e, true);
            }
            else {
                ppc.window.$focus(this, e);

                //#ifdef __WITH_WINDOW_FOCUS
                if (!nofix && ppc.hasFocusBug)
                    ppc.window.$focusfix();
                //#endif
            }

            return this;
        }

        if (this.$focus && !this.editable && (!e || !e.mouse || this.$focussable == ppc.KEYBOARD_MOUSE))
            this.$focus(e);

        this.dispatchEvent("focus", ppc.extend({
            bubbles    : true
        }, e));
        return this;
    };

    /**
     * Removes the focus from this element.
     * @chainable
     */
    this.blur = function(noset, e){
        //#ifdef __WITH_POPUP
        if ((e && !ppc.isChildOf(e.fromElement, e.toElement)) && ppc.popup.isShowing(this.$uniqueId))
            ppc.popup.forceHide(); //This should be put in a more general position
        //#endif
        
        if (this.$blur)
            this.$blur(e);

        if (!noset)
            ppc.window.$blur(this);

        this.dispatchEvent("blur", ppc.extend({
            bubbles    : !e || !e.cancelBubble
        }, e));
        return this;
    };

    /**
     * Determines whether this element has the focus
     * @returns {Boolean} Indicates whether this element has the focus
     */
    this.hasFocus = function(){
        return ppc.document.activeElement == this || this.$isWindowContainer
            && (ppc.document.activeElement || {}).$focusParent == this;
    };
};

// #endif
