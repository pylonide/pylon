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

// #ifdef __AMLDATAGRID || __INC_ALL || __AMLPROPEDIT

/**
 * Element providing a sortable, selectable grid containing scrollable 
 * information. Grid columns can be reordered and resized.
 * Example:
 * This example shows a datagrid width several columns mixing percentage and
 * fixed size columns.
 * <code>
 *  <a:model id="mdlNews">
 *      <data>
 *          <news title="text 1" subtitle="text 11" date="2009-11-18"></news>
 *          <news title="text 2" subtitle="text 21" date="2009-11-19"></news>
 *          <news title="text 3" subtitle="text 31" date="2009-11-20"></news>
 *      </data>
 *  </a:model>
 *  <a:datagrid model="mdlNews" options="move|size">
 *      <a:each match="[news]">
 *          <a:column caption="Icon" type="icon" width="40" value="newspaper.png" />
 *          <a:column caption="Date" value="[@date]" width="70" />
 *          <a:column caption="Title" width="180" value="[@title]" />
 *          <a:column caption="Subtitle" value="[@subtitle]" width="100" />
 *      </a:each>
 *  </a:datagrid>
 * </code>
 *
 * @constructor
 * @define datagrid
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.BaseTree
 *
 * @binding invalidmsg  Determines the error message that is shown when a cell is not valid.
 * @binding description Determines the text that is displayed under the expanded row.
 */
apf.datagrid = function(struct, tagName){
    this.$init(tagName || "datagrid", apf.NODE_VISIBLE, struct);
    
    this.$headings       = [],
    this.$cssRules       = []; //@todo Needs to be reset;
    this.$lastOpened     = {};
    
    this.$editors        = {};
    
    // #ifdef __WITH_CSS_BINDS
    this.$dynCssClasses = [];
    // #endif
};

(function(){
    var HAS_CHILD = 1 << 1,
        IS_CLOSED = 1 << 2,
        IS_LAST   = 1 << 3,
        IS_ROOT   = 1 << 4,
        treeState = this.$treeState;

    //#ifdef __WITH_DATAACTION
    this.implement(
        apf.DataAction
    );
    //#endif

    /*this.$init(function() {
        this.addEventListener("keydown", keyHandler, true);
    });*/

    this.bufferselect       = false;
    this.$useTable          = false;
    this.$focussable        = true;
    this.$isWindowContainer = -1;

    this.$widthdiff      = 0;
    this.$defaultwidth   = 0;
    this.$useiframe      = 0;
    this.$needsDepth     = true;

    //#ifdef __WITH_RENAME
    this.canrename = false; //@todo remove rename from basetree and move to tree.js
    //#endif

    /**
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for datagrid and true for spreadsheet and propedit.
     */
    this.$booleanProperties["iframe"]     = true;

     // #ifdef __WITH_MULTICHECK
    
    /**
     * @attribute {String} mode Sets the way this element interacts with the user.
     *   Possible values:
     *   check  the user can select a single item from this element. The selected item is indicated.
     *   radio  the user can select multiple items from this element. Each selected item is indicated.
     */
    this.$mode = 0;
    this.$propHandlers["mode"] = function(value){
        if ("check|radio".indexOf(value) > -1) {
            if (!this.hasFeature(apf.__MULTICHECK__))
                this.implement(apf.MultiCheck);
            
            this.addEventListener("afterrename", $afterRenameMode); //what does this do?
            
            this.multicheck = value == "check"; //radio is single
            this.$mode = this.multicheck ? 1 : 2;
        }
        else {
            //@todo undo actionRules setting
            this.removeEventListener("afterrename", $afterRenameMode);
            //@todo unimplement??
            this.$mode = 0;
        }
    };
    
    //@todo apf3.0 retest this completely
    function $afterRenameMode(){
    }
    
    //#endif
    
    this.$propHandlers["options"] = function(value){
        for (var i = 0, l = this.$headings.length; i < l; i++) {
            this.$headings[i].setAttribute("options", value);
        }
    };
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected),
            o = this.$container;
        o.scrollTop = (Q.offsetTop) - 21;
    }

    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    /*function keyHandler(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$selected || this.$caret;
        
        if (!e.force && (!selHtml || this.renaming)) //@todo how about allowdeselect?
            return;

        var selXml = this.caret || this.selected,
            oInt   = this.$useiframe ? this.oDoc.documentElement : this.$container,
            margin, node, hasScroll, hasScrollX, hasScrollY, items, lines;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.$selectTemp();
            
                this.choose(selHtml);
                break;
            case 32:
                if (ctrlKey || !this.isSelected(this.caret))
                    this.select(this.caret, true);
                return false;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove) 
                    return;
                    
                if (this.celledit) {
                    this.rename(this.caret || this.selected, "");
                    return;
                }
            
                if (this.$tempsel)
                    this.$selectTemp();
            
                this.remove(this.mode ? this.caret : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.$setTempSelected (this.getFirstTraverseNode(), false, shiftKey);
                this.$container.scrollTop = 0;
                return false;
            case 35:
                //END
                this.$setTempSelected (this.getLastTraverseNode(), false, shiftKey);
                this.$container.scrollTop = this.$container.scrollHeight;
                return false;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.cellselect) {
                    if (this.$lastcell) {
                        if (this.$lastcell.previousSibling) {
                            this.selectCell({target:this.$lastcell.previousSibling},
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$caret || this.$selected, 2)
                return false;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.cellselect) {
                    if (this.$lastcell) {
                        if (this.$lastcell.nextSibling) {
                            this.selectCell({target:this.$lastcell.nextSibling},
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$caret || this.$selected, 1)
                    
                return false;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop <= oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0])
                        - parseInt(apf.getStyle(oInt, "paddingTop"));
                }
                return false;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScroll ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ (hasScroll ? 10 : 0)
                
                return false;
            case 33:
                //PGUP
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                items      = Math.floor((oInt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3])) || 1;
                lines      = Math.floor((oInt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0]) 
                        - parseInt(apf.getStyle(oInt, "paddingTop"));
                }
                return false;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel) 
                    return false;

                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                items      = Math.floor((oInt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3])) || 1;
                lines      = Math.floor((oInt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScrollY ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ 10 + (hasScrollY ? 10 : 0)
                return false;
            default:
                if (this.celledit) {
                    if (!ctrlKey && !e.altKey && (key > 46 && key < 112 || key > 123))
                        this.startRename(null, true);
                    return;
                }
                else if (key == 65 && ctrlKey) {
                    this.selectAll();
                    return false;
                } 
                //@todo make this work with the sorted column
                else if (this.caption || (this.bindingRules || {})["caption"]) {
                    if (!this.xmlRoot) return;
                    
                    //this should move to a onkeypress based function
                    if (!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes(); //@todo start at current indicator
                    for (var v, i = 0; i < nodes.length; i++) {
                        v = this.$applyBindRule("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {
                            
                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setCaret(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }
                            
                            if (selHtml)
                                this.$container.scrollTop = selHtml.offsetTop
                                    - (this.$container.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            return;
                        }
                    }
                    return;
                }
                break;
        };
        
        this.lookup = null;
        //return false;
    }*/
    
    // #endif
    
    /**** Focus ****/
    // Too slow for IE
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!this.$selected) 
            return false;

        var nodes     = this.$head.childNodes,
            htmlNodes = this.$selected.childNodes, i = 0;
            
        nodeIter = htmlNodes[i];
        while (nodeIter) {
            if (nodeIter.nodeType != 1) {
                nodeIter = nodeIter.nextSibling;
                continue;
            }
            
            h = apf.all[nodes[i].getAttribute("hid")];
            if (h.tree || h.rename)
                return this.$getLayoutNode(h.tree ? "treecell" : "cell", "caption", nodeIter) || nodeIter;
            
            i++;
            nodeIter = nodeIter.nextSibling;
        }
        
        throw new Error("Datagrid without rename column specified");
    };
    // #endif 
    
    this.$focus = function(){
        if (!this.$ext || (apf.isIE && this.$useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, this.$baseCSSname + "Focus");
    };

    this.$blur = function(){
        //@todo fix this by fixing focussing for this component
        if (!this.$ext || (apf.isIE && this.$useiframe && this.cssfix))
            return;

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, "", [this.$baseCSSname + "Focus"]);
        
        hideEditor.call(this);
    };
    
    /**** Databinding ****/
    
    this.addEventListener("bindingsload", this.$loaddatabinding = function(e){
        var rules = e.bindings["column"];
        if (!rules || !rules.length)
            return;
        
        this.$headings = rules;
        
        var fixed = 0, found = false;
        for (var h, i = 0, l = rules.length; i < l; i++) {
            h = rules[i];
            
            //#ifdef __DEBUG
            if (!h.$width)
                throw new Error("missing width"); //temporary check
            //#endif
            
            if (!h.$isPercentage)
                fixed += parseFloat(h.$width) || 0;
            else 
                found = true;
        }
        
        if (!found) { //@todo removal???
            this.$isFixedGrid = true;
            this.$setStyleClass(this.$ext, "fixed");
            
            if (this.$useiframe)
                this.$setStyleClass(this.oDoc.documentElement, "fixed");
        }
        else {
            //@todo remove
        }

        if (fixed > 0 && !this.$isFixedGrid) {
            var vLeft = fixed;
            
            //first column has total -1 * fixed margin-left. - 5
            //cssRules[0][1] += ";margin-left:-" + vLeft + "px;";
            //cssRules[1][1] += ";margin-left:-" + vLeft + "px;";
            this.$cssRules.push(["." + this.$baseCSSname + " .row" + this.$uniqueId,
                "padding-right:" + vLeft + "px;margin-right:-" + vLeft + "px"]);
        
            //headings and records have same padding-right
            this.$container.style.paddingRight  =
            this.$head.style.paddingRight = vLeft + "px";
        }
        
        this.$fixed = fixed;
        this.$first = 0;

        this.$withContainer = e.bindings.description ? true : false;

        //Activate CSS Rules
        apf.importStylesheet(this.$cssRules, window);
        
        if (this.$useiframe)
            apf.importStylesheet(this.$cssRules, this.oWin);
    });
    
    this.$initNode = function(xmlNode, state, Lid, depth){
        //Build Row
        this.$getNewContext("item");
        var oRow = this.$getLayoutNode("item");
        oRow.setAttribute("id", Lid);
        
        //@todo if treearch
        oRow.setAttribute("class", oRow.getAttribute("class") + " "  
            + treeState[state] + " item" + this.$uniqueId);//"width:" + (totalWidth+40) + "px");
        this.$setStyleClass(this.$getLayoutNode("item", "container"), treeState[state])
        
        oRow.setAttribute("ondblclick", 'var o = apf.lookup(' + this.$uniqueId + ');o.choose(null, true);'
            + (this.$withContainer ? 'o.slideToggle(this, null, true);' : '')
            + (this.celledit && !this.namevalue ? 'o.startRename(null, null, true);' : ''));
        
        if (this.hasFeature(apf.__DRAGDROP__)) {
            oRow.setAttribute("onmouseout", 'this.hasPassedDown = false;');
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey, -1);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, isSelected);' : ''));
            
            oRow.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey, -1);');
        } //@todo add DRAGDROP ifdefs
        else {
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var wasSelected = o.$selected == this;\
                o.select(this, event.ctrlKey, event.shiftKey, -1);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, wasSelected);' : ''));
        }
        
        //Build the Cells
        for (var cellType, cell, h, i = 0; i < this.$headings.length; i++) {
            h = this.$headings[i];
            
            if (h.tree && h.check) {
                cellType = "treecheckcell";
                
                this.$getNewContext("treecheckcell");
                cell = this.$getLayoutNode("treecheckcell");
                var oc = this.$getLayoutNode("treecheckcell", "openclose");
                oc.setAttribute("style", "margin-left:" + (((depth||0)) * 15 + 4) + "px;");
                oc.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.slideToggle(this, null, null, true);\
                    event.cancelBubble = true;\
                    apf.window.$mousedown(event);");
            
                oc.setAttribute("ondblclick", "event.cancelBubble = true");
            }
            else if (h.tree) {
                cellType = "treecell";
                
                this.$getNewContext("treecell");
                cell = this.$getLayoutNode("treecell");
                var oc = this.$getLayoutNode("treecell", "openclose");
                oc.setAttribute("style", "margin-left:" + (((depth||0)) * 15 + 4) + "px;");
                oc.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.slideToggle(this, null, null, true);\
                    event.cancelBubble = true;\
                    apf.window.$mousedown(event);");
            
                oc.setAttribute("ondblclick", "event.cancelBubble = true");
                
                /*cell.setAttribute("style", "background-position: " 
                    + ((((depth||0)+1) * 15) - 10) + "px 50%");*/
            }
            else {
                // #ifdef __WITH_MULTICHECK
                cellType = h.check ? "checkcell" : "cell";
                /* #else
                cellType = "cell";
                #endif */
                
                this.$getNewContext(cellType);
                cell = this.$getLayoutNode(cellType);
            }
            
            // #ifdef __WITH_MULTICHECK
            if (this.$mode && h.check) {
                var elCheck = this.$getLayoutNode(cellType, "check");
                if (elCheck) {
                    elCheck.setAttribute("onmousedown",
                        "var o = apf.lookup(" + this.$uniqueId + ");\
                        o.checkToggle(this, true);\o.$skipSelect = true;");
    
                    if (apf.isTrue(this.$applyBindRule("checked", xmlNode))) {
                        this.$checkedList.push(xmlNode);
                        this.$setStyleClass(oRow, "checked");
                    }
                    else if (this.isChecked(xmlNode))
                        this.$setStyleClass(oRow, "checked");
                }
                else {
                    //#ifdef __DEBUG
                    throw new Error(apf.formatErrorString(0, this,
                        "Could not find check attribute",
                        'Maybe the attribute check is missing from your skin file:\
                            <a:item\
                              class        = "."\
                              caption      = "label/u/text()"\
                              icon         = "label"\
                              openclose    = "span"\
                              select       = "label"\
                              check        = "label/b"\
                              container    = "following-sibling::blockquote"\
                            >\
                                <div><span> </span><label><b> </b><u>-</u></label></div>\
                                <blockquote> </blockquote>\
                            </a:item>\
                        '));
                    //#endif
                    return false;
                }
            }
            //#endif
            
            apf.setStyleClass(cell, h.$className);
            
            if (h.css)
                apf.setStyleClass(cell, (apf.lm.compile(h.css))(xmlNode)); //@todo cashing of compiled function?
            
            if (h.icon) {
                var node = this.$getLayoutNode(cellType, "caption", oRow.appendChild(cell));
                    node = (node.nodeType == 1 && node || node.parentNode);
                    node.setAttribute("style", "background-image:url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            ((h.cicon || h.$compile("icon", {nostring: true}))(xmlNode) || ""))
                        + ");");
                    this.$setStyleClass(node, "iconCell", []);
            }
            
            if (h.value) {
                if (!h.cvalue2) {
                    h.$compile("value", {nostring: true});
                    
                    //#ifdef __WITH_AML_BINDINGS
                    if (h.value)
                        h.cvalue2.hasAml = h.value.indexOf("<a:") > -1;
                    //#endif
                }
                
                //#ifdef __WITH_AML_BINDINGS
                if (h.cvalue2.hasAml){
                    var q = (this.$amlBindQueue || (this.$amlBindQueue = {}));
                    
                    var htmlEl = this.$getLayoutNode(cellType, 
                        "caption", oRow.appendChild(cell));
                    htmlEl.setAttribute("id", "placeholder_" + this.$uniqueId 
                        + "_" + ((q.column || (q.column = [])).push(xmlNode) - 1));
                    apf.setNodeValue(htmlEl, '&nbsp');
                }
                else
                //#endif
                {
                    apf.setNodeValue(this.$getLayoutNode(cellType, 
                        "caption", oRow.appendChild(cell)),
                        h.cvalue2(xmlNode) || '&nbsp');
                }
            }
        }
        
        if (this.$bindings && this.$bindings.color) {
            var colorRule = this.$getDataNode("color", xmlNode);
            this.$setStyleClass(oRow, colorRule ? "highlight" : null, colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(oRow, cssClass);
            if (cssClass)
                this.$dynCssClasses.push(cssClass);
        }
        // #endif

        /*if (this.$withContainer) {
            var desc = this.$applyBindRule("description", xmlNode);
            this.$getNewContext("container");
            var oDesc = this.$getLayoutNode("container");
            apf.setNodeValue(this.$getLayoutNode("container", "container",
                oDesc), desc);
            oDesc.setAttribute("class", (oDesc.getAttribute("class") || "")
                + " row" + this.$uniqueId);
            
            if (htmlParentNode)
                apf.insertHtmlNode(oDesc, htmlParentNode, beforeNode);
            else 
                this.$nodes.push(oDesc);
        }*/
        
        return oRow;
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        
        var nodes     = this.$head.childNodes,
            htmlNodes = htmlNode.childNodes,
            cell, p;
        
        if (!this.namevalue && this.$curBtn)
            p = this.$curBtn.parentNode;

        var nodeIter, h, i = 0;
        nodeIter = htmlNodes[0];
        while (nodeIter) {
            if (nodeIter.nodeType != 1) {
                nodeIter = nodeIter.nextSibling;
                continue;
            }
            
            h = apf.all[nodes[i].getAttribute("hid")];
            
            //@todo fake optimization
            cell = this.$getLayoutNode(h.tree ? "treecell" : "cell", "caption", nodeIter) || nodeIter;//htmlNodes[i].firstChild || 

            if (h.css)
                apf.setStyleClass(cell, (apf.lm.compile(h.css))(xmlNode)); //@todo cashing of compiled function?

            if (h.tree) {
                // #ifdef __WITH_MULTICHECK
                //@todo
                // #endif
                
                /*var oc = this.$getLayoutNode("treecell", "openclose", cell);
                oc.setAttribute("style", "margin-left:" + (((depth||0)) * 15 + 4) + "px;");
                oc.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.slideToggle(this, null, null, true);");*/
            }
            
            if (h.value) {
                if (!h.cvalue2) {
                    h.$compile("value", {nostring: true});
                    
                    //#ifdef __WITH_AML_BINDINGS
                    if (h.value)
                        h.cvalue2.hasAml = h.value.indexOf("<a:") > -1;
                    //#endif
                }
                
                //#ifdef __WITH_AML_BINDINGS
                if (!h.cvalue2.hasAml)
                //#endif
                    cell.innerHTML = h.cvalue2(xmlNode) || "";
            }
            
            if (h.icon) {
                (cell.nodeType == 1 && cell || cell.parentNode).style.backgroundImage = 
                    "url(" + apf.getAbsolutePath(this.iconPath, 
                        ((h.cicon || h.$compile("icon", {nostring: true}))(xmlNode) || ""))
                    + ")";
            }
            
            i++;
            nodeIter = nodeIter.nextSibling;
        }
        
        //return; //@todo fake optimization
        
        if (this.$bindings && this.$bindings.color) {
            var colorRule = this.$getDataNode("color", xmlNode);
            this.$setStyleClass(htmlNode, colorRule ? "highlight" : null,
                colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.$dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.$dynCssClasses);
            if (cssClass && !this.$dynCssClasses.contains(cssClass))
                this.$dynCssClasses.push(cssClass);
        }
        // #endif
        
        /*if (this.$withContainer) {
            htmlNode.nextSibling.innerHTML 
                = this.$applyBindRule("description", xmlNode) || "";
        }*/
    };
    
    this.$dblclick = function(htmlNode){
        var _self = this, id, cell;
        while (!(id = htmlNode.getAttribute(apf.xmldb.htmlIdTag)) || id.indexOf("|") == -1) {
            htmlNode = (cell = htmlNode).parentNode;
            if (htmlNode.nodeType != 1)
                return;
        }
        
        if (this.$lastEditor && this.$lastEditor[3] == htmlNode)
            return;
        
        var h, colId = cell.className.match(/(col\d+)/)[1];
        for (var i = 0; i < this.$headings.length; i++) {
            if (this.$headings[i].$className == colId) {
                h = this.$headings[i];
                break;
            }
        }
        
        if (!h.editor) //No editor specified
            return;

        /*if (this.$lastEditor) {
            //this.$lastEditor[0].$blur();
            this.$lastEditor[0].setProperty("visible", false);
            
            var nodes = this.$lastEditor[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host)
                    nodes[i].style.display = "";
            }
        }*/
        
        var xmlNode = apf.xmldb.getNode(htmlNode);
        /*
            - editor (name of widget, lm function returning amlNode or lm template ref)
            - children being aml nodes
        */
        var editParent = h.tree 
          ? this.$getLayoutNode("cell", "caption", cell)
          : cell;

        var oEditor, editor = h.editor; 
        var ceditor = apf.lm.compile(editor, {xpathmode: 2}); //@todo can this be more efficient?
    
        var nodes = editParent.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (!nodes[i].host) {
                if (nodes[i].nodeType == 1)
                    nodes[i].style.display = "none";
                else {
                    this.$lastTextValue = nodes[i].nodeValue;
                    nodes[i].nodeValue = ""; //@todo
                }
            }
        }

        if (ceditor.type == 2) {
            if (!this.$editors[editor]) {
                var constr = apf.namespaces[apf.ns.aml].elements[editor];
                var info   = {
                    htmlNode : editParent,
                    style    : "position:relative;z-index:10000",
                    value    : "[{" + this.id + ".selected}::" 
                        + (v = h.value).substr(1, v.length - 2)  //only xpath value's supported for now
                        + "]",
                    focussable : false
                };
                if (!h.tree)
                    info.width = "100%-3";
                
                //@todo copy all non-known properties of the prop element

                if (constr.prototype.hasFeature(apf.__MULTISELECT__)) {
                    info.caption   = h.eachcaption || "[text()]";
                    info.eachvalue = h.eachvalue; // || "[@value]";
                    
                    var model;
                    if (model = h.getAttribute("model")) {
                        info.model = model;
                        info.each  = h.each;
                    }
                    else {
                        /*var each = h.each;
                        if (each.charAt(0) == "[")
                            each = each.substr(1, each.length - 2);
                        info.each  = "[{" + this.id + ".selected}::" + each + "]";*/
                        info.model = "{" + this.id + ".selected}"
                        info.each = h.each;
                    }
                }
                
                if (h.skin)
                    info.skin = h.skin;

                oEditor = this.$editors[editor] = new constr(info);

                var box = apf.getBox(apf.getStyle(oEditor.$ext, "margin"));
                if (box[1] || box[3]) {
                    oEditor.setAttribute("width", "100%+2-" + (box[1] + box[3]));
                }
                //else if (!box[3])
                    //oEditor.$ext.style.marginLeft = "-1px";
                
                //oEditor.$focussable = false;
                oEditor.addEventListener("blur", function(){
                    hideEditor.call(_self);
                });
                oEditor.parentNode   = this;
                oEditor.realtime     = false;
                oEditor.$focusParent = this;
                oEditor.setAttribute("focussable", "true");
                //delete oEditor.parentNode;
                
                oEditor.addEventListener("keydown", function(e){
                    if (e.keyCode == 13) {
                        hideEditor.call(_self);
                        _self.$focus();
                    }
                    else if (e.keyCode == 27) {
                        oEditor.removeAttribute("value"); //@todo this bugs in slider
                        hideEditor.call(_self);
                        //_self.getActionTracker().undo();
                    }
                });
                
                //@todo set actiontracker
                
                //Patch oEditor to forward change
                oEditor.$executeAction = function(){
                    this.parentNode.$executeAction.apply(this.parentNode, arguments);
                }
            }
            else {
                oEditor = this.$editors[editor];
                
                if (oEditor.hasFeature(apf.__MULTISELECT__) && !h.model) {
                    //oEditor.setAttribute("model", "{" + this.id + ".selected}");
                    /*var each = h.each;
                    if (each.charAt(0) == "[")
                        each = each.substr(1, each.length - 2);
                    oEditor.setAttribute("each", "[{" + this.id + ".selected}::" + each + "]");*/
                    /*apf.queue.empty();*/
                    oEditor.setAttribute("value", "[{" + this.id + ".selected}::" 
                        + (v = h.value).substr(1, v.length - 2) 
                        + "]");
                }

                /*oEditor.setAttribute("value", "[{" + this.id + ".selected}::" 
                    + (v = h.value).substr(1, v.length - 2) 
                    + "]");*/

                oEditor.setProperty("visible", true);
                editParent.appendChild(oEditor.$ext);
                
                oEditor.setAttribute("width", h.tree ? "" : "100%-3");
            }
            
            /*setTimeout(function(){
                oEditor.focus();
            });*/
        }
        else {
            //Create dropdown 
            
            var obj = ceditor.call(this, this.xmlRoot);
            if (obj.localName == "template") {
                //add template contents to dropped area
            }
            else {
                //add xml into dropped area
            }
        }
        
        if (oEditor.localName == "textbox")
            oEditor.select();
        
        oEditor.focus();
        oEditor.$focus();
        
        this.$setStyleClass(htmlNode, "editing");
        
        this.$lastEditor = [oEditor, editParent, xmlNode, htmlNode, this.getActionTracker().undolength];
    }
    
    this.addEventListener("mousedown", function(e){
        if (this.$lastEditor 
          && !apf.isChildOf(this.$lastEditor[1], 
            e.htmlEvent.srcElement || e.htmlEvent.target, true))
                hideEditor.call(this);
    });
    
    var hideEditor = function(e){
        if (this.$lastEditor) {
            var ed = this.$lastEditor;
            this.$lastEditor = null;

            if (ed[0].hasFeature(apf.__MULTISELECT__)) // && !ed[0].model
                ed[0].$clearDynamicProperty("value");

            //this.$lastEditor[0].$blur();
            ed[0].setProperty("visible", false);
            
            var nodes = ed[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host) {
                    if (nodes[i].nodeType == 1)
                        nodes[i].style.display = "";
                    else if (!ed[0].value) {
                        nodes[i].nodeValue = this.$lastTextValue; //@todo
                    }
                }
            }
            
            this.$setStyleClass(ed[3], "", ["editing"]);
            
            this.focus();
        }
    };
    this.addEventListener("beforeselect", hideEditor);
    
    /**** Column management ****/

    /**
     * Returns a column definition object based on the column number.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.getColumn = function(nr){
        return this.$headings[nr || this.$lastcol || 0];
    };
    
    /** 
     * Resizes a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     * @param {Number} newsize  the new size of the column.
     * @todo optimize but bringing down the string concats
     */
    this.resizeColumn = function(nr, newsize){
        var h = this.$headings[nr];
        h.resize(newsize);
    };

    /**
     * Hides a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.hideColumn = function(nr){
        var h = this.$headings[nr];
        h.hide();
    };
    
    /**
     * Shows a hidden column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.showColumn = function(nr){
        var h = this.$headings[nr];
        h.show();
    };
    
    /**
     * Sorts a column.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.sortColumn = function(hid){
        var h = this.$headings[nr];
        h.sort();
    };
    
    /**
     * Moves a column to another position.
     * @param {Number} fromHid the heading number of the column to move; this number is based on the sequence of the column elements.
     * @param {Number} toHid   the position the column is moved to;
     */
    this.moveColumn = function(from, to){
        var h = this.$headings[nr];
        h.move(to);
    }
    
    /**** Init ****/

    this.$draw = function(){
        this.$drawBase();
        
        var _self = this;
        this.$ext.onmousedown = function(e){
            _self.dispatchEvent("mousedown", {htmlEvent: e || event}); 
        }
        
        //@todo rename 'body' to 'container'
        
        //Build Main Skin
        this.$head    = this.$getLayoutNode("main", "head", this.$ext);
        this.$pointer = this.$getLayoutNode("main", "pointer", this.$ext);

        if (this.$head.firstChild)
            this.$head.removeChild(this.$head.firstChild);
        if (this.$container.firstChild)
            this.$container.removeChild(this.$container.firstChild);

        var widthdiff = this.$widthdiff = this.$getOption("main", "widthdiff") || 0;
        this.$defaultwidth = this.$getOption("main", "defaultwidth") || "100";
        this.$useiframe    = apf.isIE && (apf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

        //Initialize Iframe 
        if (this.$useiframe && !this.oIframe) {
            //this.$container.style.overflow = "hidden";
            //var sInt = this.$container.outerHTML 
            var sClass   = this.$container.className;
            //this.$container.parentNode.removeChild(this.$container);
            this.oIframe = this.$container.appendChild(document.createElement(apf.isIE 
                ? "<iframe frameborder='0'></iframe>"
                : "iframe"));
            this.oIframe.frameBorder = 0;
            this.oWin = this.oIframe.contentWindow;
            this.oDoc = this.oWin.document;
            this.oDoc.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                <html xmlns="http://www.w3.org/1999/xhtml">\
                    <head><script>\
                        apf = {\
                            lookup : function(uid){\
                                return window.parent.apf.lookup(uid);\
                            },\
                            Init : {add:function(){},run:function(){}}\
                        };</script>\
                    </head>\
                    <body></body>\
                </html>');
            //Import CSS
            //this.oDoc.body.innerHTML = sInt;
            this.$container = this.oDoc.body;//.firstChild;
            this.$container.className = sClass;//this.oIframe.parentNode.className;
            this.oDoc.documentElement.className = this.$ext.className;
            //this.oDoc.body.className = this.$ext.className;

            apf.skins.loadCssInWindow(this.skinName, this.oWin, this.mediaPath, this.iconPath);
            
            if (apf.isIE) //@todo this can be removed when focussing is fixed for this component
                this.$setStyleClass(this.oDoc.documentElement, this.$baseCSSname + "Focus");
            
            apf.convertIframe(this.oIframe, true);

            if (apf.getStyle(this.oDoc.documentElement, "overflowY") == "auto") {
                //@todo ie only
                this.oIframe.onresize = function(){
                    _self.$head.style.marginRight = 
                      _self.oDoc.documentElement.scrollHeight > _self.oDoc.documentElement.offsetHeight 
                        ? "16px" : "0";
                }
                
                this.addEventListener("afterload", this.oIframe.onresize);
                this.addEventListener("xmlupdate", this.oIframe.onresize);
            }
            
            this.oDoc.documentElement.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.oDoc.documentElement.scrollLeft;
                };
        }
        else {
            if (apf.getStyle(this.$container, "overflowY") == "auto") {
                this.$resize = function(){
                    _self.$head.style.marginRight = 
                      _self.$container.scrollHeight > _self.$container.offsetHeight 
                        ? "16px" : "0";
                }
                
                //#ifdef __WITH_LAYOUT
                apf.layout.setRules(this.$ext, this.$uniqueId + "_datagrid",
                    "var o = apf.all[" + this.$uniqueId + "];\
                     if (o) o.$resize()");
                apf.layout.queue(this.$ext);
                //#endif
                
                this.addEventListener("afterload", this.$resize);
                this.addEventListener("xmlupdate", this.$resize);
            }
            
            this.$container.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.$container.scrollLeft;
                };
        }
        
        this.$container[this.clickedit ? "onmousedown" : "ondblclick"] = function(e){
            if (!e) e = event;
            _self.$dblclick(e.srcElement || e.target);
        }
    };
    
    this.$destroy = function(){
        //@todo destroy this.$txt here

        this.$ext.onclick = this.$container.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$container, "dg" + this.$uniqueId);
        apf.layout.activateRules(this.$container);
        //#endif
    };
}).call(apf.datagrid.prototype = new apf.BaseTree());

apf.aml.setElement("datagrid",    apf.datagrid);
//apf.aml.setElement("column",      apf.BindingRule);
apf.aml.setElement("description", apf.BindingRule);
apf.aml.setElement("color",       apf.BindingRule);
apf.aml.setElement("contents",    apf.BindingRule);

//#endif

// #ifdef __WITH_CONVERTIFRAME
/**
 * @private
 */
//@todo this is all broken. needs to be fixed before apf3.0
apf.convertIframe = function(iframe, preventSelect){
    var win = iframe.contentWindow;
    var doc = win.document;
    var pos;

    if (!apf.isIE)
        apf.importClass(apf.runNonIe, true, win);
        
    //Load Browser Specific Code
    // #ifdef __SUPPORT_WEBKIT
    if (this.isSafari) 
        this.importClass(apf.runSafari, true, win);
    // #endif
    // #ifdef __SUPPORT_OPERA
    if (this.isOpera) 
        this.importClass(apf.runOpera, true, win);
    // #endif
    // #ifdef __SUPPORT_GECKO
    if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
        this.importClass(apf.runGecko, true, win);
    // #endif
    
    doc.onkeydown = function(e){
        if (!e) e = win.event;

        if (document.onkeydown) 
            return document.onkeydown.call(document, e);
        //return false;
    };
    
    doc.onmousedown = function(e){
        if (!e) e = win.event;

        if (!pos)
            pos = apf.getAbsolutePosition(iframe);

        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : iframe,
            target        : iframe,
            targetElement : iframe
        }
        
        if (document.body.onmousedown)
            document.body.onmousedown(q);
        if (document.onmousedown)
            document.onmousedown(q);
        
        if (preventSelect && !apf.isIE)
            return false;
    };
    
    if (preventSelect) {
        doc.onselectstart = function(e){
            return false;
        };
    }
    
    doc.onmouseup = function(e){
        if (!e) e = win.event;
        if (document.body.onmouseup)
            document.body.onmouseup(e);
        if (document.onmouseup)
            document.onmouseup(e);
    };
    
    doc.onclick = function(e){
        if (!e) e = win.event;
        if (document.body.onclick)
            document.body.onclick(e);
        if (document.onclick)
            document.onclick(e);
    };
    
    //all these events should actually be piped to the events of the container....
    doc.documentElement.oncontextmenu = function(e){
        if (!e) e = win.event;
        if (!pos)
            pos = apf.getAbsolutePosition(iframe);
        
        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : e.srcElement,
            target        : e.target,
            targetElement : e.targetElement
        };

        //if(this.host && this.host.oncontextmenu) this.host.oncontextmenu(q);
        if (document.body.oncontextmenu)
            document.body.oncontextmenu(q);
        if (document.oncontextmenu)
            document.oncontextmenu(q);
        
        return false;
    };

    doc.documentElement.onmouseover = function(e){
        pos = apf.getAbsolutePosition(iframe);
    };

    doc.documentElement.onmousemove = function(e){
        if (!e) e = win.event;
        if (!pos)
            pos = apf.getAbsolutePosition(iframe);
    
        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : e.srcElement,
            target        : e.target,
            targetElement : e.targetElement
        }

        if (iframe.onmousemove)
            iframe.onmousemove(q);
        if (document.body.onmousemove)
            document.body.onmousemove(q);
        if (document.onmousemove)
            document.onmousemove(q);
        
        return e.returnValue;
    };
    
    return doc;
};
//#endif