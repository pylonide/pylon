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

apf.__RENAME__ = 1 << 10;

// #ifdef __WITH_RENAME

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have the rename features. Rename is triggered by
 * pressing F2 on an item or by clicking once on an already selected item. This
 * will show an input element in place where the user can change the name of the
 * item to a new one. When the caption is changed the {@link term.datanode data node} is
 * changed accordingly.
 * Example:
 * This example shows a list containing products. Only products that have the
 * editable attribute set to 1 can be renamed by the user.
 * <code>
 *  <a:model id="mdlTest">
 *      <data>
 *          <product name="TV" />
 *          <product name="LCD" editable="1" />
 *      </data>
 *  </a:model>
 *  <a:list id="list" model="mdlTest" width="200">
 *      <a:each match="[product]">
 *          <a:caption match="[@name]" />
 *      </a:each>
 *      <a:actions>
 *          <a:rename
 *            match = "[product[@editable='1']]"
 *            set   = "rename.php" />
 *      </a:actions>
 *  </a:list>
 *       
 *  <a:button
 *    caption = "Rename"
 *    onclick = "list.startRename()" />
 * </code>
 *
 * @event stoprename Fires when a rename action is cancelled.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.Rename = function(){
    this.$regbase      = this.$regbase|apf.__RENAME__;

    this.canrename     = true;
    this.renameSubject =
    this.renameTimer   =
    this.lastCursor    = null;
    
    /**
     * @attribute  {Boolean}  rename  whether the user can start renaming rendered nodes in this element.
     */
    this.$booleanProperties["canrename"]  = true;
    this.$booleanProperties["autorename"] = true;
    this.$supportedProperties.push("canrename", "autorename");

    //#ifdef __ENABLE_AUTORENAME
    this.$propHandlers["autorename"] = function(value){
        if (value) {
            this.reselectable = true;
            this.bufferselect = false;
            this.addEventListener("afterselect", $afterselect);
            this.addEventListener("keydown", $keydown);
        }
        else {
            this.removeEventListener("afterselect", $afterselect);
            this.removeEventListener("keydown", $keydown);
        }
    }
    
    function $afterselect(){
        var _self = this;
        $setTimeout(function(){
            if (_self.hasFocus())
                _self.startRename();
        }, 20);
    }
    
    function $keydown(e){
        if (!this.renaming && apf.isCharacter(e.keyCode))
            this.startRename();
    }
    
    this.$isContentEditable = function(e){
        if (this.renaming && this.autorename)
            return true;
    }
    //#endif

    /**
     * Changes the data presented as the caption of a specified {@link term.datanode data node}.
     * If none is specified the indicated node is used.
     *
     * @action
     * @param  {XMLElement} xmlNode the element to change the caption of.
     * @param  {String}     value   the value to set as the caption of the {@link term.datanode data node}.
     */
    this.rename = function(xmlNode, value){
        if (!xmlNode)
            xmlNode = this.caret || this.selected;

        if (!xmlNode) return;

        this.$executeSingleValue("rename", "caption", xmlNode, value);
    };

    /**
     * Starts the rename process with a delay, allowing for cancellation when
     * necesary. Cancellation is necesary for instance, when double click was
     * intended or a dragdrop operation.
     *
     */
    this.startDelayedRename = function(e, time){
        if (e && (e.button == 2 || e.ctrlKey || e.shiftKey))
            return;

        clearTimeout(this.renameTimer);
        this.renameTimer = $setTimeout('apf.lookup('
            + this.$uniqueId + ').startRename()', time || 400);
    };

    /**
     * Starts the rename process by displaying an input box at the position
     * of the item that can be renamed by the user.
     *
     */
    this.startRename = function(force, startEmpty){
        if (!force && (this.renaming || !this.canrename 
          || !this.$startAction("rename", this.caret 
          || this.selected, this.stopRename)))
            return false;

        if (!this.hasFocus())
            this.focus(null, null, true);

        clearTimeout(this.renameTimer);

        var elCaption = this.$getCaptionElement
            ? this.$getCaptionElement()
            : this.$caret || this.$selected;

        if (!elCaption) 
            return this.stopRename();
        
        this.renaming      = true;
        this.renameSubject = this.caret || this.selected;

        var wdt = elCaption.offsetWidth;
        this.lastCursor = elCaption.style.cursor;
        elCaption.style.cursor = "text";
        elCaption.parentNode.replaceChild(this.oTxt, elCaption);
        elCaption.host = this;

        if (apf.isTrue(this.$getOption("main", "scalerename"))) {
            var diff = apf.getWidthDiff(this.oTxt);
            this.oTxt.style.width = (wdt - diff - 3) + "px";
        }

        this.replacedNode = elCaption;
        var xmlNode       = this.$getCaptionXml
            ? this.$getCaptionXml(this.renameSubject)
            : this.$getDataNode("caption", this.renameSubject);

        this.oTxt[apf.hasContentEditable ? "innerHTML" : "value"] = startEmpty || !xmlNode
            ? ""
            : (xmlNode.nodeType >= 2 && xmlNode.nodeType <= 4
                ? unescape(decodeURI(xmlNode.nodeValue))
                : (apf.isOnlyChild(xmlNode.firstChild, [3,4])
                    ? apf.queryValue(xmlNode)
                    : this.$applyBindRule("caption", this.renameSubject))) || "";

        this.oTxt.unselectable = "Off";
        this.oTxt.host         = this;

        //this.oTxt.focus();
        try {
            this.oTxt.focus();
            this.oTxt.select();
        }
        catch(e) {}
    };

    /**
     * Stop renaming process and change the data according to the set value.
     * Cancel the renaming process without changing data.
     *
     */
    this.stopRename = function(contextXml, success){
        clearTimeout(this.renameTimer);

        if (!this.renaming || contextXml && contextXml != this.renameSubject
          || !this.replacedNode)
            return false;

        if (this.oTxt.parentNode && this.oTxt.parentNode.nodeType == 1) {
            if (apf.isIE8 || apf.isIE7Emulate)
                this.oTxt.blur();
            
            this.oTxt.parentNode.replaceChild(this.replacedNode, this.oTxt);
        }

        this.renaming = false;

        if (this.replacedNode) {
            this.replacedNode.style.cursor = this.lastCursor || "";
            this.replacedNode.host = null;
        }

        if (!success) {
            this.dispatchEvent("stoprename");
            this.$stopAction("rename");
        }
        else {
            if (this.replacedNode) {
                this.replacedNode.innerHTML = this.oTxt[apf.hasContentEditable
                    ? "innerText"
                    : "value"];
            }
             //this.$selected.innerHTML = this.oTxt.innerHTML;
            this.rename(this.renameSubject,
                this.oTxt[apf.hasContentEditable ? "innerText" : "value"]
                .replace(/<.*?nobr>/gi, ""));
        }

        if (!this.renaming) {
            this.renameSubject    = null;
            this.replacedNode     = null;
            this.oTxt.style.width = "";
        }
        
        return true;
    };

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key = e.keyCode;

        if (this.renaming) {
            if (key == 27 || key == 13) {
                this.stopRename(null, key == 13 && !this.$autocomplete);
                e.cancelBubble = true;
                return false;
            }

            return;
        }

        //F2
        if (key == 113) {
            if (this.$tempsel)
                this.$selectTemp();

            if (this.caret != this.selected) {
                if (this.multiselect || this.isSelected(this.caret)) {
                    this.selected  = this.caret;
                    this.$selected = this.$caret;
                }
                else
                    this.select(this.caret, true);
            }

            this.startRename();

            return false;
        }
    }, true);
    //#endif

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        this.oTxt.refCount--;

        if (!this.oTxt.refCount) {
            this.oTxt.host        =
            this.oTxt.onmouseover =
            this.oTxt.onmousedown =
            this.oTxt.select      =
            this.oTxt.onfocus     =
            this.oTxt.onblur      = null;
        }
    });
    
    this.$init(function(){
        if (!(this.oTxt = document.getElementById("txt_rename"))) {
            if (apf.hasContentEditable) {
                this.oTxt = document.createElement("DIV");
                this.oTxt.contentEditable = true;
                if (apf.isIE6)
                    this.oTxt.style.width = "1px";
                //this.oTxt.canHaveHTML = false;
            }
            else {
                this.oTxt              = document.createElement("input");
                this.oTxt.id           = "txt_rename";
                this.oTxt.autocomplete = false;
            }
        
            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug)
                apf.sanitizeTextbox(this.oTxt);
            //#endif
        
            this.oTxt.refCount         = 0;
            this.oTxt.id               = "txt_rename";
            this.oTxt.style.whiteSpace = "nowrap";
            this.oTxt.onselectstart    = function(e){
                (e || event).cancelBubble = true;
            };
            // #ifdef __WITH_WINDOW_FOCUS
            //this.oTxt.host = this;
            apf.sanitizeTextbox(this.oTxt);
            // #endif
        
            this.oTxt.onmouseover = this.oTxt.onmouseout = this.oTxt.oncontextmenu =
            this.oTxt.onmousedown = function(e){ (e || event).cancelBubble = true; };
        
            this.oTxt.onkeyup = function(){
                if (!this.host.$autocomplete)
                    return;
        
                this.host.$lookup(this[apf.hasContentEditable ? "innerHTML" : "value"]);
            }
        
            this.oTxt.select = function(){
                if (!apf.hasMsRangeObject)
                    return this.focus();
        
                var r = document.selection.createRange();
                //r.moveEnd("character", this.$ext.innerText.length);
                try {
                    r.moveToElementText(this);
        
                    if (apf.isFalse(this.host.$getOption("main", "selectrename"))
                      || typeof this.host.$renameStartCollapse != "undefined") //@todo please deprecate renameStartCollapse
                        r.collapse(this.host.$renameStartCollapse);
                } catch(e) {} //BUG!!!!
        
                r.select();
            };
        
            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug) {
                this.oTxt.onfocus = function(){
                    if (apf.window)
                        apf.window.$focusfix2();
                };
            }
            //#endif
        
            this.oTxt.onblur = function(){
                if (apf.isGecko)
                    return; //bug in firefox calling onblur too much
        
                //#ifdef __WITH_WINDOW_FOCUS
                if (apf.hasFocusBug)
                    apf.window.$blurfix();
                //#endif
        
                if (this.host.$autocomplete)
                    return;
        
                this.host.stopRename(null, true);
            };
        }
        
        this.oTxt.refCount++;
    });
}

// #endif
