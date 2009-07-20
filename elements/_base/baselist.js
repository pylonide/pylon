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

// #ifdef __JBASELIST || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1

/**
 * Baseclass of elements that allows the user to select one or more items
 * out of a list.
 *
 * @constructor
 * @baseclass
 *
 * @inherits apf.MultiSelect
 * @inherits apf.Cache
 * @inherits apf.Presentation
 * @inherits apf.DataBinding
 * @inherits apf.Validation
 * @inherits apf.XForms
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 * @default_private
 *
 * @binding caption  Determines the caption of a node.
 * @binding icon     Determines the icon of a node. This binding rule is used
 * to determine the icon displayed when using a list skin. The {baseclass.baselist.binding.image image binding}
 * is used to determine the image in the thumbnail skin.
 * @binding image    Determines the image of a node. This binding rule is used
 * to determine the image displayed when using a thumbnail skin. The {baseclass.baselist.binding.icon icon binding}
 * is used to determine the icon in the list skin.
 * Example:
 * In this example the image url is read from the thumbnail attribute of the data node.
 * <code>
 *  <a:thumbnail>
 *      <a:bindings>
 *          <a:caption select="@caption" />
 *          <a:image select="@thumbnail" />
 *          <a:image value="no_image.png" />
 *          <a:traverse select="images" />
 *      </a:bindings>
 *  </a:thumbnail>
 * </code>
 * @binding css      Determines a css class for a node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <a:list>
 *      <a:bindings>
 *          <a:caption select="@caption" />
 *          <a:css select="message[@unread]" value="highlighUnread" />
 *          <a:icon select="@icon" />
 *          <a:icon select="self::folder" value="icoFolder.gif" />
 *          <a:traverse select="folder" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * @binding tooltip  Determines the tooltip of a node.
 * @event notunique Fires when the more attribute is set and an item is added that has a caption that already exists in the list.
 *   object:
 *   {String} value the value that was entered.
 */
apf.BaseList = function(){
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.implement(apf.Validation);
    //#endif
    //#ifdef __WITH_XFORMS
    this.implement(apf.XForms);
    //#endif

    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif

    /**** Properties and Attributes ****/

    this.$focussable = true; // This object can get the focus
    this.multiselect = true; // Initially Disable MultiSelect

    /**
     * @attribute {String} fill the set of items that should be loaded into this
     * element. A start and an end seperated by a -.
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  <a:dropdown fill="1980-2050" />
     * </code>
     */
    this.$propHandlers["fill"] = function(value){
        if (value)
            this.loadFillData(this.$aml.getAttribute("fill"));
        else
            this.clear();
    };

    /**** Keyboard support ****/

    // #ifdef __WITH_KEYBOARD

    //Handler for a plane list
    this.$keyHandler = function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$selected || this.$indicator;

        if (!selHtml || this.renaming) //@todo how about allowdeselect?
            return;

        var selXml = this.indicator || this.selected,
            oExt   = this.oExt,
            // variables used in the switch statement below:
            node, margin, items, lines, hasScroll, hasScrollX, hasScrollY;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.selectTemp();

                if (this.ctrlselect == "enter")
                    this.select(this.indicator, true);

                this.choose(selHtml);
                break;
            case 32:
                if (ctrlKey || this.mode != "normal" || !this.isSelected(this.indicator))
                    this.select(this.indicator, true);
                break;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove)
                    return;

                if (this.$tempsel)
                    this.selectTemp();

                this.remove(this.mode != "normal" ? this.indicator : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                break;
            case 35:
                //END
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = this.oInt.scrollHeight;
                break;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;
                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));

                margin = apf.getBox(apf.getStyle(selHtml, "margin"));

                node = this.getNextTraverseSelected(node, false);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;

                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oExt.scrollHeight > oExt.offsetHeight;
                items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));

                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else
                    return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 39:
                //RIGHT
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;

                margin = apf.getBox(apf.getStyle(selHtml, "margin"));

                node = this.getNextTraverseSelected(node, true);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else
                    return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight) {
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0];
                }
                break;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;

                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oExt.scrollHeight > oExt.offsetHeight;
                items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));

                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else
                    return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight) { // - (hasScroll ? 10 : 0)
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ (hasScroll ? 10 : 0)
                }
                break;
            case 33:
                //PGUP
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;

                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oExt.scrollHeight > oExt.offsetHeight;
                hasScrollX = oExt.scrollWidth > oExt.offsetWidth;
                items      = Math.floor((oExt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                lines      = Math.floor((oExt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));

                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else
                    return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel)
                    return;

                node = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;

                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oExt.scrollHeight > oExt.offsetHeight;
                hasScrollX = oExt.scrollWidth > oExt.offsetWidth;
                items      = Math.floor((oExt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3]));
                lines      = Math.floor((oExt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));

                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else
                    return;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight) { // - (hasScrollY ? 10 : 0)
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ 10 + (hasScrollY ? 10 : 0)
                }
                break;

            default:
                if (key == 65 && ctrlKey) {
                    this.selectAll();
                }
                else if (this.caption || (this.bindingRules || {})["caption"]) {
                    if (!this.xmlRoot || this.autorename) return;

                    //this should move to a onkeypress based function
                    if (!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300) {
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    }

                    this.lookup.str += String.fromCharCode(key);

                    var nodes = this.getTraverseNodes(); //@todo start at current indicator
                    for (var v, i = 0; i < nodes.length; i++) {
                        v = this.applyRuleSetOnNode("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {

                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setIndicator(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }

                            if (selHtml) {
                                this.oInt.scrollTop = selHtml.offsetTop
                                    - (this.oInt.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            }
                            return;
                        }
                    }
                    return;
                }
                break;
        };

        this.lookup = null;
        return false;
    };

    // #endif

    /**** Private databinding functions ****/

    this.$deInitNode   = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    };

    this.$updateNode   = function(xmlNode, htmlNode, noModifier){
        //Update Identity (Look)
        var elIcon = this.$getLayoutNode("item", "icon", htmlNode);

        if (elIcon) {
            if (elIcon.nodeType == 1) {
                elIcon.style.backgroundImage = "url(" + 
                  apf.getAbsolutePath(this.iconPath,
                      this.applyRuleSetOnNode("icon", xmlNode)) + ")";
            }
            else {
                elIcon.nodeValue =apf.getAbsolutePath(this.iconPath, 
                    this.applyRuleSetOnNode("icon", xmlNode));
            }
        }
        else {
            var elImage = this.$getLayoutNode("item", "image", htmlNode);//.style.backgroundImage = "url(" + this.applyRuleSetOnNode("image", xmlNode) + ")";
            if (elImage) {
                if (elImage.nodeType == 1) {
                    elImage.style.backgroundImage = "url(" + 
                        apf.getAbsolutePath(apf.hostPath,
                            this.applyRuleSetOnNode("image", xmlNode)) + ")";
                }
                else {
                    elImage.nodeValue = apf.getAbsolutePath(apf.hostPath, 
                        this.applyRuleSetOnNode("image", xmlNode));
                }
            }
        }

        //this.$getLayoutNode("item", "caption", htmlNode).nodeValue = this.applyRuleSetOnNode("Caption", xmlNode);
        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
            else
                elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);
        }

        htmlNode.title = this.applyRuleSetOnNode("title", xmlNode) || "";

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);

        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass)) {
                this.dynCssClasses.push(cssClass);
            }
        }
        // #endif

        if (!noModifier && this.$updateModifier)
            this.$updateModifier(xmlNode, htmlNode);
    };

    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        var oPHtmlNode = htmlNode.parentNode;
        var nNode      = this.getNextTraverse(xmlNode);
        var beforeNode = nNode
            ? apf.xmldb.findHtmlNode(nNode, this)
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    };

    var nodes = [];

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("item");
        var Item       = this.$getLayoutNode("item");
        var elSelect   = this.$getLayoutNode("item", "select");
        var elIcon     = this.$getLayoutNode("item", "icon");
        var elImage    = this.$getLayoutNode("item", "image");
        //var elCheckbox = this.$getLayoutNode("item", "checkbox"); // NOT USED
        var elCaption  = this.$getLayoutNode("item", "caption");

        Item.setAttribute("id", Lid);

        //elSelect.setAttribute("oncontextmenu", 'apf.lookup(' + this.uniqueId + ').dispatchEvent("contextmenu", event);');
        elSelect.setAttribute("onmouseover", 'apf.setStyleClass(this, "hover");');
        elSelect.setAttribute("onmouseout", 'apf.setStyleClass(this, "", ["hover"]);');

        if (this.hasFeature(__RENAME__) || this.hasFeature(__DRAGDROP__)) {
            elSelect.setAttribute("ondblclick", 'var o = apf.lookup(' + this.uniqueId + '); ' +
                // #ifdef __WITH_RENAME
                'o.stopRename();' +
                // #endif
                ' o.choose()');
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown",
                'var o = apf.lookup(' + this.uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (!o.renaming && o.hasFocus() && isSelected) \
                    this.dorename = true;\
                 if (!o.hasFeature(__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey)');
            elSelect.setAttribute("onmouseup", 'var o = apf.lookup(' + this.uniqueId + ');\
                if(this.dorename && o.mode == "normal")' +
                // #ifdef __WITH_RENAME
                    'o.startDelayedRename(event);' +
                // #endif
                'this.dorename = false;\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(__DRAGDROP__) && (isSelected || event.ctrlKey))\
                     o.select(this, event.ctrlKey, event.shiftKey)');
        } //@todo add DRAGDROP ifdefs
        else {
            elSelect.setAttribute("ondblclick", 'var o = apf.lookup('
                + this.uniqueId + '); o.choose()');
            elSelect.setAttribute(this.itemSelectEvent
                || "onmousedown", 'var o = apf.lookup(' + this.uniqueId
                + '); o.select(this, event.ctrlKey, event.shiftKey)');
        }

        //Setup Nodes Identity (Look)
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.setAttribute("style", "background-image:url("
                    + apf.getAbsolutePath(this.iconPath, this.applyRuleSetOnNode("icon", xmlNode))
                    + ")");
            else
                elIcon.nodeValue = apf.getAbsolutePath(this.iconPath, this.applyRuleSetOnNode("icon", xmlNode));
        }
        else if (elImage) {
            if (elImage.nodeType == 1)
                elImage.setAttribute("style", "background-image:url("
                    + apf.getAbsolutePath(apf.hostPath, this.applyRuleSetOnNode("image", xmlNode))
                    + ")");
            else {
                if (apf.isSafariOld) { //HAAAAACCCCKKKKKK!!! this should be changed... blrgh..
                    var p = elImage.ownerElement.parentNode;
                    var img = p.appendChild(p.ownerDocument.createElement("img"));
                    img.setAttribute("src", 
                        apf.getAbsolutePath(apf.hostPath, this.applyRuleSetOnNode("image", xmlNode)));
                }
                else {
                    elImage.nodeValue = 
                        apf.getAbsolutePath(apf.hostPath, this.applyRuleSetOnNode("image", xmlNode));
                }
            }
        }

        if (elCaption) {
            apf.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));

            //#ifdef __WITH_AML_BINDINGS
            if (this.lastRule && this.lastRule.getAttribute("parse") == "aml")
                this.doAmlParsing = true;
            //#endif
        }
        Item.setAttribute("title", this.applyRuleSetOnNode("tooltip", xmlNode) || "");

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(Item, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        if (this.$addModifier)
            this.$addModifier(xmlNode, Item);

        if (htmlParentNode)
            apf.xmldb.htmlImport(Item, htmlParentNode, beforeNode);
        else
            nodes.push(Item);
    };

    this.$fill = function(){
        if (this.more && !this.moreItem) {
            this.$getNewContext("item");
            var Item      = this.$getLayoutNode("item");
            var elCaption = this.$getLayoutNode("item", "caption");
            var elSelect  = this.$getLayoutNode("item", "select");

            Item.setAttribute("class", "more");
            elSelect.setAttribute("onmousedown", 'var o = apf.lookup(' + this.uniqueId
                + ');o.clearSelection();o.$setStyleClass(this, "more_down");');
            elSelect.setAttribute("onmouseout", 'apf.lookup(' + this.uniqueId
                + ').$setStyleClass(this, "", ["more_down"]);');
            elSelect.setAttribute("onmouseup", 'apf.lookup(' + this.uniqueId
                + ').startMore(this)');

            if (elCaption)
                apf.setNodeValue(elCaption,
                    this.more.match(/caption:(.*)(;|$)/i)[1]);
            nodes.push(Item);
        }

        apf.xmldb.htmlImport(nodes, this.oInt);
        nodes.length = 0;

        //#ifdef __WITH_AML_BINDINGS
        if (this.doAmlParsing) {
            var x = document.createElement("div");
            while (this.oExt.childNodes.length)
                x.appendChild(this.oExt.childNodes[0]);
            Application.loadSubNode(x, this.oExt, null, null, true);
        }
        //#endif

        if (this.more && !this.moreItem)
            this.moreItem = this.oInt.lastChild;
    };

    //var lastAddedMore; // NOT USED

    /**
     * Adds a new item to the list and lets the users type in the new name.
     * This functionality is especially useful in the interface when
     * {@link element.list.attribute.mode} is set to check or radio. For instance in a form.
     * @see element.list.attribute.more
     */
    this.startMore = function(o){
        this.$setStyleClass(o, "", ["more_down"]);

        var xmlNode;
        if (!this.actionRules || !this.actionRules["add"]) {
            if (this.traverse && !this.traverse.match(/[\/\[]/)) {
                xmlNode = "<" + this.traverse + (this.traverse.match(/^a:/) 
                    ? " xmlns:a='" + apf.ns.aml + "'" 
                    : "") + " custom='1' />";
            }
            else {
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, this,
                    "Could not start more",
                    "No add action rule is defined for this component",
                    this.$aml));
                //#endif
                return false;
            }
        }

        var addedNode = this.add(xmlNode);
        this.select(addedNode, null, null, null, null, true);
        this.oInt.appendChild(this.moreItem);

        var undoLastAction = function(){
            this.getActionTracker().undo(this.autoselect ? 2 : 1);

            this.removeEventListener("stoprename", undoLastAction);
            this.removeEventListener("beforerename", removeSetRenameEvent);
            this.removeEventListener("afterrename",  afterRename);
        }
        var afterRename = function(){
            //this.select(addedNode);
            this.removeEventListener("afterrename",  afterRename);
        };
        var removeSetRenameEvent = function(e){
            this.removeEventListener("stoprename", undoLastAction);
            this.removeEventListener("beforerename", removeSetRenameEvent);

            //There is already a choice with the same value
            var xmlNode = this.findXmlNodeByValue(e.args[1]);
            if (xmlNode || !e.args[1]) {
                if (e.args[1] && this.dispatchEvent("notunique", {
                    value : e.args[1]
                }) === false) {
                    this.startRename();
                    
                    this.addEventListener("stoprename",   undoLastAction);
                    this.addEventListener("beforerename", removeSetRenameEvent);
                }
                else {
                    this.removeEventListener("afterrename", afterRename);
                    
                    this.getActionTracker().undo();//this.autoselect ? 2 : 1);
                    if (!this.isSelected(xmlNode))
                        this.select(xmlNode);
                }
                
                return false;
            }
        };

        this.addEventListener("stoprename",   undoLastAction);
        this.addEventListener("beforerename", removeSetRenameEvent);
        this.addEventListener("afterrename",  afterRename);

        /*if (this.mode == "radio") {
            this.moreItem.style.display = "none";
            if (lastAddedMore)
                this.removeEventListener("xmlupdate", lastAddedMore);

            lastAddedMore = function(){
                this.moreItem.style.display = addedNode.parentNode
                    ? "none"
                    : "block";
            };
            this.addEventListener("xmlupdate", lastAddedMore);
        }*/

      
        // #ifdef __WITH_RENAME
        this.startDelayedRename({}, 1);
        // #endif
    };

    /**** Selection ****/

    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [],
            nodes = this.getTraverseNodes(),
            f, i;
        for (f = false, i = 0; i < nodes.length; i++) {
            if (nodes[i] == xmlStartNode)
                f = true;
            if (f)
                r.push(nodes[i]);
            if (nodes[i] == xmlEndNode)
                f = false;
        }

        if (!r.length || f) {
            r = [];
            for (f = false, i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i] == xmlStartNode)
                    f = true;
                if (f)
                    r.push(nodes[i]);
                if (nodes[i] == xmlEndNode)
                    f = false;
            }
        }

        return r;
    };

    this.$selectDefault = function(XMLRoot){
        this.select(this.getTraverseNodes()[0], null, null, null, true);
    };

    this.implement(apf.MultiSelect,
                   apf.Cache,
                   apf.Presentation,
                   apf.DataBinding);

    /**
     * Generates a list of items based on a string.
     * @param {String} str the description of the items. A start and an end seperated by a -.
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  lst.loadFillData("1980-2050");
     * </code>
     */
    this.loadFillData = function(str){
        var parts = str.split("-");
        var start = parseInt(parts[0]);
        var end   = parseInt(parts[1]);

        var strData = [];
        for (var i = start; i < end + 1; i++) {
            strData.push("<item>" + (i + "")
                .pad(Math.max(parts[0].length, parts[1].length), "0")
              + "</item>");
        }

        if (strData.length) {
            var sNode = new apf.smartbinding(null,
                apf.getXmlDom("<smartbindings xmlns='"
                    + apf.ns.aml
                    + "'><bindings><caption select='text()' /><value select='text()'/><traverse select='item' /></bindings><model><items>"
                    + strData.join("") + "</items></model></smartbindings>")
                  .documentElement);
            apf.AmlParser.addToSbStack(this.uniqueId, sNode);
        }
    };
}

// #endif
