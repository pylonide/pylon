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

__RENAME__ = 1 << 10;

// #ifdef __WITH_RENAME

/**
 * Baseclass adding renaming features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.Rename = function(){
    /* **********************
        INTERFACE REQUIRED
        
        [none]
    ***********************/
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    this.__regbase    = this.__regbase|__RENAME__;
    this.canrename    = true;
    var renameSubject = null;
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    /**
     * Changes the data presented as the caption of a specified {@info TraverseNodes "Traverse Node(s)"}. 
     * If none is specified the indicated node is used.
     *
     * @action
     * @param  {XMLNode}  xmlNode  required  the Traverse Node to change the caption of.
     * @param  {String}  value   required  the value to set as the caption of the <code>xmlNode</code>.
     */
    this.rename = function(xmlNode, value){
        if (!xmlNode)
            xmlNode = this.indicator || this.selected;

        if (!xmlNode) return;
        
        this.executeActionByRuleSet("rename", "caption", xmlNode, value);
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /**
     * Starts the renaming process with a delay, allowing for cancellation when necesary.
     * Cancellation is necesary for instance, when double click was intended, or a drag&drop operation.
     *
     */
    this.startDelayedRename = function(e, time){
        if (e.button == 2) return;

        clearTimeout(this.renameTimer);
        this.renameTimer = setTimeout('jpf.lookup('
            + this.uniqueId + ').startRename()', time || 400);
    }
    
    /**
     * Starts the renaming process.
     *
     */
    this.startRename  = function(force){
        if(!force && (!this.canrename || !this.__startAction("rename", 
          this.indicator || this.selected, this.stopRename)))
            return false;
        
        this.focus();
        clearTimeout(this.renameTimer);
        
        this.renaming = true;
        renameSubject = this.indicator || this.selected;
        
        var elCaption = this.__getCaptionElement
            ? this.__getCaptionElement()
            : this.__selected;

        if (!elCaption) return;

        elCaption.style.cursor = "text"; //@todo previous value should be remembered
        elCaption.parentNode.replaceChild(this.oTxt, elCaption);
        
        this.replacedNode = elCaption;
        var xmlNode       = this.getNodeFromRule("caption", 
                                this.indicator || this.selected);

        this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"] =
            (xmlNode.nodeType == 2
              ? unescape(decodeURI(xmlNode.nodeValue))
              : jpf.xmldb.getNodeValue(xmlNode)) || "";//o.innerHTML;
        this.oTxt.unselectable = "Off";
        this.oTxt.host         = this;

        //this.oTxt.focus();
        this.oTxt.select();
    }
    
    /**
     * Stop renaming process and change the data according to the set value.
     * Cancel the renaming process without changing data.
     *
     */
    this.stopRename = function(contextXml, success){
        clearTimeout(this.renameTimer);

        if (!this.renaming || contextXml && contextXml != renameSubject)
            return false;
        
        if (this.oTxt.parentNode)
            this.oTxt.parentNode.replaceChild(this.replacedNode, this.oTxt);

        this.replacedNode.style.cursor = "default"; //@todo this should be remembered
        
        if (!success) {
            this.dispatchEvent("onstoprename");
            this.__stopAction("rename");
        }
        else {
            this.replacedNode.innerHTML = this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"]
            
             //this.__selected.innerHTML = this.oTxt.innerHTML;
            this.rename(renameSubject, 
                this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"]
                .replace(/<.*?nobr>/gi, ""));
        }
        
        this.renaming     = false;
        renameSubject     = null;
        this.replacedNode = null;
        
        return true;
    }
    
    /* ********************************************************************
                                        HOOKS
    *********************************************************************/
    
    if (this.__deselect)
        this.__rdeselect = this.__deselect;
    if (this.__blur)
        this.__rdblur    = this.__blur;
    if (this.__select)
        this.__rselect   = this.__select;
        
    
    this.__select = function(o){
        if (this.renaming)
            this.stopRename(null, true);
        
        return this.__rselect ? this.__rselect(o) : o;
    }
    
    this.__deselect = function(o){
        if (this.renaming) {
            //Check if this is the same is the node to be renamed...
            //if(this.__selected.parentNode.nodeType == 11) node = this.__selected;
            
            this.stopRename(null, true);

            if (this.ctrlselect) return false;
        }
        
        return this.__rdeselect ? this.__rdeselect(o) : o;
    }
    
    this.__blur = function(){
        if (this.renaming)
            this.stopRename(null, true);
        
        if (this.__rdblur) this.__rdblur();
    }
    
    if (this.keyHandler)
        this.__keyHandler = this.keyHandler;
    
    /**
     * @private
     */
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (this.renaming) {
            if (key == 27 || key == 13)
                this.stopRename(null, key == 13);

            return;
        }

        //F2
        if (key == 113) {
            this.startRename();
            return false;
        }
        else if (this.__keyHandler) //Normal KeyHandler
            return this.__keyHandler(key, ctrlKey, shiftKey, altKey);
    }
    
    /* ********************************************************************
                                    EDIT FIELD
    *********************************************************************/
    if (!(this.oTxt = this.pHtmlDoc.getElementsByTagName("txt_rename")[0])) {
        if (jpf.hasContentEditable) {
            this.oTxt = document.createElement("DIV");
            this.oTxt.contentEditable = true;
            if (jpf.isIE6)
                this.oTxt.style.width = "1px";
            //this.oTxt.canHaveHTML = false;
        }
        else {
            this.oTxt = document.createElement("INPUT");
            this.oTxt.className = "txt_rename";
            this.oTxt.style.width = "80%";
            this.oTxt.autocomplete = false;
    
        }
        this.oTxt.id               = "txt_rename";
        this.oTxt.style.whiteSpace = "nowrap";
        this.oTxt.onselectstart    = function(e){
            (e || event).cancelBubble = true;
        };
        //this.oTxt.host = this;
        
        this.oTxt.onmouseover = this.oTxt.onmouseout = this.oTxt.oncontextmenu = 
        this.oTxt.onmousedown = function(e){ (e || event).cancelBubble = true; };
        
        this.oTxt.select = function(){
            if (!jpf.hasMsRangeObject)
                return this.focus();
            
            var r = document.selection.createRange();
            //r.moveEnd("character", this.oExt.innerText.length);
            try {
                r.moveToElementText(this);
            } catch(e) {} //BUG!!!!

            r.select();
        }
        
        this.oTxt.onblur = function(){
            if (jpf.isGecko) return; //bug in firefox calling onblur too much

            this.host.stopRename(null, true);
        }
        
        this.__addJmlDestroyer(function(){
            this.oTxt.host = this.oTxt.onmouseover = 
            this.oTxt.onmousedown = this.oTxt.select = null;
        });
    }

    /**
     * @attribute  {Boolean}  rename  true  When set to true the use can rename items in this component.
     */
    this.canrename = true;
    this.__supportedProperties.push("canrename");
}

// #endif
