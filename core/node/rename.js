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

var __RENAME__ = 1 << 10;

// #ifdef __WITH_RENAME

/**
 * Baseclass adding rename features to this element. Rename is triggered by
 * pressing F2 on an item or by clicking once on an already selected item. This
 * will show an input element in place where the user can change the name of the
 * item to a new one. When the caption is changed the xml data element is
 * changed accordingly.
 * Example:
 * This example shows a list containing products. Only products that have the
 * editable attribute set to 1 can be renamed by the user.
 * <code>
 *  <j:list model="url:/cgi-bin/products.cgi">
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:traverse select="product" />
 *      </j:bindings>
 *      <j:actions>
 *          <j:rename
 *            select = "product[@editable='1']"
 *            set    = "rpc:comm.update('product', {@id}, {@name})" />
 *      </j:actions>
 *  </j:list>
 * </code>
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.Rename = function(){
    this.$regbase     = this.$regbase|__RENAME__;

    this.canrename    = true;
    var renameSubject = null;
    var renameTimer   = null;
    var lastCursor;
    
    /**
     * @attribute  {Boolean}  rename  whether the user can rename items in this element.
     */
    this.$booleanProperties["canrename"] = true;
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
    
    var _self = this;
    function $afterselect(){
        setTimeout(function(){
            if (_self.hasFocus())
                _self.startRename();
        }, 20);
    }
    
    function $keydown(e){
        if (!this.renaming && e.isCharacter())
            this.startRename();
    }
    
    this.$isContentEditable = function(e){
        if (this.renaming && this.autorename)
            return true;
    }
    //#endif

    /**
     * Changes the data presented as the caption of a specified xml data element.
     * If none is specified the indicated node is used.
     *
     * @action
     * @param  {XMLElement} xmlNode the element to change the caption of.
     * @param  {String}     value   the value to set as the caption of the xml data element.
     */
    this.rename = function(xmlNode, value){
        if (!xmlNode)
            xmlNode = this.indicator || this.selected;

        if (!xmlNode) return;

        this.executeActionByRuleSet("rename", "caption", xmlNode, value);
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

        clearTimeout(renameTimer);
        renameTimer = setTimeout('jpf.lookup('
            + this.uniqueId + ').startRename()', time || 400);
    };

    /**
     * Starts the rename process by displaying an input box at the position
     * of the item that can be renamed by the user.
     *
     */
    this.startRename = function(force, startEmpty){
        if (!force && (this.renaming || !this.canrename 
          || !this.$startAction("rename", this.indicator 
          || this.selected, this.stopRename)))
            return false;

        if (!this.hasFocus())
            this.focus(null, null, true);

        clearTimeout(renameTimer);

        this.renaming = true;
        renameSubject = this.indicator || this.selected;

        var elCaption = this.$getCaptionElement
            ? this.$getCaptionElement()
            : this.$indicator || this.$selected;

        if (!elCaption) 
            return this.stopRename();

        var wdt = elCaption.offsetWidth;
        lastCursor = elCaption.style.cursor;
        elCaption.style.cursor = "text";
        elCaption.parentNode.replaceChild(this.oTxt, elCaption);
        elCaption.host = this;

        if (jpf.isTrue(this.$getOption("main", "scalerename"))) {
            var diff = jpf.getWidthDiff(this.oTxt);
            this.oTxt.style.width = (wdt - diff) + "px";
        }

        this.replacedNode = elCaption;
        var xmlNode       = this.$getCaptionXml
            ? this.$getCaptionXml(renameSubject)
            : this.getNodeFromRule("caption", renameSubject);

        this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"] = startEmpty || !xmlNode
            ? ""
            : (xmlNode.nodeType >= 2 && xmlNode.nodeType <= 4
                ? unescape(decodeURI(xmlNode.nodeValue))
                : (jpf.xmldb.isOnlyChild(xmlNode.firstChild, [3,4])
                    ? jpf.xmldb.getNodeValue(xmlNode)
                    : this.applyRuleSetOnNode("caption", renameSubject))) || "";

        this.oTxt.unselectable = "Off";
        this.oTxt.host         = this;

        //this.oTxt.focus();
        this.oTxt.focus();
        this.oTxt.select();
    };

    /**
     * Stop renaming process and change the data according to the set value.
     * Cancel the renaming process without changing data.
     *
     */
    this.stopRename = function(contextXml, success){
        clearTimeout(renameTimer);

        if (!this.renaming || contextXml && contextXml != renameSubject)
            return false;

        if (this.oTxt.parentNode && this.oTxt.parentNode.nodeType == 1)
            this.oTxt.parentNode.replaceChild(this.replacedNode, this.oTxt);

        this.renaming = false;

        if (this.replacedNode) {
            this.replacedNode.style.cursor = lastCursor || "";
            this.replacedNode.host = null;
        }

        if (!success) {
            this.dispatchEvent("stoprename");
            this.$stopAction("rename");
        }
        else {
            this.replacedNode.innerHTML = this.oTxt[jpf.hasContentEditable
                ? "innerHTML"
                : "value"];

             //this.$selected.innerHTML = this.oTxt.innerHTML;
            this.rename(renameSubject,
                this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"]
                .replace(/<.*?nobr>/gi, ""));
        }

        if (!this.renaming) {
            renameSubject         = null;
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
                return false;
            }

            return;
        }

        //F2
        if (key == 113) {
            if (this.$tempsel)
                this.selectTemp();

            if (this.indicator != this.selected) {
                if (this.multiselect || this.isSelected(this.indicator)) {
                    this.selected  = this.indicator;
                    this.$selected = this.$indicator;
                }
                else
                    this.select(this.indicator, true);
            }

            this.startRename();

            return false;
        }
    }, true);
    //#endif

    if (!(this.oTxt = this.pHtmlDoc.getElementById("txt_rename"))) {
        if (jpf.hasContentEditable) {
            this.oTxt = this.pHtmlDoc.createElement("DIV");
            this.oTxt.contentEditable = true;
            if (jpf.isIE6)
                this.oTxt.style.width = "1px";
            //this.oTxt.canHaveHTML = false;
        }
        else {
            this.oTxt              = this.pHtmlDoc.createElement("input");
            this.oTxt.id           = "txt_rename";
            this.oTxt.autocomplete = false;
        }

        this.oTxt.refCount         = 0;
        this.oTxt.id               = "txt_rename";
        this.oTxt.style.whiteSpace = "nowrap";
        this.oTxt.onselectstart    = function(e){
            (e || event).cancelBubble = true;
        };
        //this.oTxt.host = this;
        jpf.sanitizeTextbox(this.oTxt);

        this.oTxt.onmouseover = this.oTxt.onmouseout = this.oTxt.oncontextmenu =
        this.oTxt.onmousedown = function(e){ (e || event).cancelBubble = true; };

        this.oTxt.onkeyup = function(){
            if (!this.host.$autocomplete)
                return;

            this.host.$lookup(this[jpf.hasContentEditable ? "innerHTML" : "value"]);
        }

        this.oTxt.select = function(){
            if (!jpf.hasMsRangeObject)
                return this.focus();

            var r = document.selection.createRange();
            //r.moveEnd("character", this.oExt.innerText.length);
            try {
                r.moveToElementText(this);

                if (jpf.isFalse(this.host.$getOption("main", "selectrename")) 
                  || typeof this.host.$renameStartCollapse != "undefined") //@todo please deprecate renameStartCollapse
                    r.collapse(this.host.$renameStartCollapse);
            } catch(e) {} //BUG!!!!

            r.select();
        };

        //#ifdef __WITH_WINDOW_FOCUS
        this.oTxt.onfocus = function(){
            if (jpf.hasFocusBug)
                jpf.window.$focusfix2();
        };
        //#endif

        this.oTxt.onblur = function(){
            if (jpf.isGecko)
                return; //bug in firefox calling onblur too much

            //#ifdef __WITH_WINDOW_FOCUS
            if (jpf.hasFocusBug)
                jpf.window.$blurfix();
            //#endif

            if (this.host.$autocomplete)
                return;
                
            this.host.stopRename(null, true);
        };
    }
    this.oTxt.refCount++;

    this.$jmlDestroyers.push(function(){
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
};

// #endif
