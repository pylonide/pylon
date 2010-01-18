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

// #ifdef __AMLBASELIST || __INC_ALL
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
 * @inherits apf.DataAction
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
 *      <a:model>
 *          <data>
 *              <image caption="Thumb 1" thumbnail="thumb1.jpg" />
 *              <image caption="Thumb 2" thumbnail="thumb2.jpg" />
 *              <image caption="Thumb 3" />
 *          </data>
 *      </a:model>
 *      <a:bindings>
 *          <a:caption match="[@caption]" />
 *          <a:image match="[@thumbnail]" default="default_thumbnail.jpg" />
 *          <a:each match="[image]" />
 *      </a:bindings>
 *  </a:thumbnail>
 * </code>
 * @binding css      Determines a css class for a node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <a:list>
 *      <a:model>
 *          <data>
 *              <folder caption="Folder 1">
 *                  <message unread="true" />
 *              </folder>
 *              <folder caption="Folder 2" icon="email.png"></folder>
 *              <folder caption="Folder 3"></folder>
 *          </data>
 *      </a:model>
 *      <a:bindings>
 *          <a:caption match="[@caption]" />
 *          <a:css match="[message[@unread]]" value="highlighUnread" />
 *          <a:icon match="[@icon]" />
 *          <a:icon match="[folder]" value="Famfolder.gif" />
 *          <a:each match="[folder]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * @binding tooltip  Determines the tooltip of a node.
 * @event notunique Fires when the more attribute is set and an item is added that has a caption that already exists in the list.
 *   object:
 *   {String} value the value that was entered.
 */
apf.BaseList = function(){
    this.$init(true);
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
    
    this.listNodes   = [];
};

(function() {
    this.implement(
        //#ifdef __WITH_CACHE
        apf.Cache,
        //#endif
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
        //apf.XForms,
        //#endif
    );

    /**** Properties and Attributes ****/

    this.$focussable = true; // This object can get the focus
    this.multiselect = true; // Initially Disable MultiSelect
    this.mode        = "normal";

    /**
     * @attribute {String} fill the set of items that should be loaded into this
     * element. A start and an end seperated by a -.
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  <a:dropdown fill="1980-2050" />
     *  <a:dropdown fill="red,green,blue,white" />
     *  <a:dropdown fill="None,100-110,1000-1100" />
     *  <a:dropdown fill="01-10" />
     *  <a:dropdown fill="1-10" />
     * </code>
     */
    this.$propHandlers["fill"] = function(value){
        if (value)
            this.loadFillData(this.getAttribute("fill"));
        else
            this.clear();
    };
    
    //@todo unsetter
    this.$propHandlers["template"] = function(value){
        this.$template = typeof value == "object" 
          ? value 
          : apf.nameserver.get("template", value);

        if (!this.$template) {
            var f;
            apf.addEventListener("parsestop", f = function(){
                _self.$propHandlers["template"].call(_self, value);
                apf.removeEventListener("parsestop", f);
            });
            return;
        }
        
        //this.setProperty("skin", "templatelist");
        
        //@todo solve the model inheritance problem
        this.$deInitNode = function(xmlNode, htmlNode){
            var Lid = xmlNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId;
            this.$template.destroyInstance(Lid);
            
            if (htmlNode)
                htmlNode.parentNode.removeChild(htmlNode);
        };

        this.$updateNode = function(xmlNode, htmlNode, noModifier){
            //Do nothing
        };

        this.$moveNode = function(xmlNode, htmlNode){
            //@todo
        };

        var docFrag = document.createDocumentFragment();

        this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
            /*this.$getNewContext("item");
            var item = this.$getLayoutNode("item");
            item.setAttribute("id", Lid);
            var htmlNode = apf.insertHtmlNode(item, htmlParentNode || this.$int, beforeNode);*/
            var htmlNode = document.createElement("div");
            htmlNode.setAttribute("id", Lid);
            docFrag.appendChild(htmlNode);

            this.$template.getNewInstance(
                this.$getLayoutNode("item", "container", htmlNode), Lid, xmlNode, true);
            //docFrag.setProperty("model", xmlNode);
        };
        
        this.$fill = function(){
            //Do nothing (optimization later?)
            //apf.AmlParser.parseLastPass();
            //apf.isParsing = false;
            
            this.$int.appendChild(docFrag);
            
            apf.queue.empty();
        };
        
        //@todo changing template
        this.$checkLoadQueue();
    };

    /**** Keyboard support ****/

    // #ifdef __WITH_KEYBOARD

    //Handler for a plane list
    this.$keyHandler = function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$selected || this.$caret;

        if (e.returnValue == -1 || !selHtml || this.renaming) //@todo how about allowdeselect?
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$ext,
            // variables used in the switch statement below:
            node, margin, items, lines, hasScroll, hasScrollX, hasScrollY;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.$selectTemp();

                if (this.ctrlselect == "enter")
                    this.select(this.caret, true);

                this.choose(this.selected);
                break;
            case 32:
                if (ctrlKey || this.mode != "normal" || !this.isSelected(this.caret))
                    this.select(this.caret, ctrlKey);
                break;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove)
                    return;

                if (this.$tempsel)
                    this.$selectTemp();

                this.remove(this.mode != "normal" ? this.caret : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                if (this.hasFeature(apf.__VIRTUALVIEWPORT__)) 
                    this.viewport.change(0, null, true, true);
                    
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.$int.scrollTop = 0;
                break;
            case 35:
                //END
                if (this.hasFeature(apf.__VIRTUALVIEWPORT__)) 
                    this.viewport.change(this.viewport.length, null, true, true);
                
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.$int.scrollTop = this.$int.scrollHeight;
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

                node   = this.$tempsel
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;
                margin = apf.getBox(apf.getStyle(selHtml, "margin"));
                items  = selHtml.offsetWidth
                    ? Math.floor((oExt.offsetWidth
                        - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                        + margin[1] + margin[3]))
                    : 1;

                margin = apf.getBox(apf.getStyle(selHtml, "margin"));

                node   = this.getNextTraverseSelected(node, false);
                if (node)
                    this.$setTempSelected(node, ctrlKey, shiftKey, true);
                else
                    return;

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
                items     = selHtml.offsetWidth
                    ? Math.floor((oExt.offsetWidth
                        - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                        + margin[1] + margin[3]))
                    : 1;

                node      = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey, true);
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
                node   = this.getNextTraverseSelected(node, true);
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey);
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
                items     = selHtml.offsetWidth
                    ? Math.floor((oExt.offsetWidth
                        - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                        + margin[1] + margin[3]))
                    : 1;

                node      = this.getNextTraverseSelected(node, true, items);
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey);
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

                node       = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey, true);
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

                node       = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey);
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
                else if (this.$hasBindRule("caption")) {
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
                        v = this.$applyBindRule("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {

                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setCaret(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }

                            if (selHtml) {
                                this.$int.scrollTop = selHtml.offsetTop
                                    - (this.$int.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            }
                            return;
                        }
                    }
                    return;
                }
                break;
        }

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
                      this.$applyBindRule("icon", xmlNode)) + ")";
            }
            else {
                elIcon.nodeValue = apf.getAbsolutePath(this.iconPath,
                    this.$applyBindRule("icon", xmlNode));
            }
        }
        else {
            //.style.backgroundImage = "url(" + this.$applyBindRule("image", xmlNode) + ")";
            var elImage = this.$getLayoutNode("item", "image", htmlNode);
            if (elImage) {
                if (elImage.nodeType == 1) {
                    elImage.style.backgroundImage = "url(" + 
                        apf.getAbsolutePath(apf.hostPath,
                            this.$applyBindRule("image", xmlNode)) + ")";
                }
                else {
                    elImage.nodeValue = apf.getAbsolutePath(apf.hostPath, 
                        this.$applyBindRule("image", xmlNode));
                }
            }
        }

        //this.$getLayoutNode("item", "caption", htmlNode).nodeValue = this.$applyBindRule("Caption", xmlNode);
        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.$applyBindRule("caption", xmlNode);
            else
                elCaption.nodeValue = this.$applyBindRule("caption", xmlNode);
        }

        htmlNode.title = this.$applyBindRule("title", xmlNode) || "";

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);

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

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("item");
        var oItem      = this.$getLayoutNode("item"),
            elSelect   = this.$getLayoutNode("item", "select"),
            elIcon     = this.$getLayoutNode("item", "icon"),
            elImage    = this.$getLayoutNode("item", "image"),
            //elCheckbox = this.$getLayoutNode("item", "checkbox"), // NOT USED
            elCaption  = this.$getLayoutNode("item", "caption");

        oItem.setAttribute("id", Lid);

        elSelect.setAttribute("onmouseover",   "apf.setStyleClass(this, 'hover');");
        elSelect.setAttribute("onselectstart", "return false;");
        elSelect.setAttribute("style",         (elSelect.getAttribute("style") || "") + ";user-select:none;-moz-user-select:none;-webkit-user-select:none;");

        if (this.hasFeature(apf.__RENAME__) || this.hasFeature(apf.__DRAGDROP__)) {
            elSelect.setAttribute("ondblclick", "var o = apf.lookup(" + this.$uniqueId + "); " +
                // #ifdef __WITH_RENAME
                "o.stopRename();" +
                // #endif
                " o.choose()");
            elSelect.setAttribute("onmouseout", "apf.setStyleClass(this, '', ['hover']);\
                this.hasPassedDown = false;");
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown",
                'var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.renaming && o.hasFocus() && isSelected == 1) \
                    this.dorename = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || o.mode != "normal" || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey)');
            elSelect.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');' +
                // #ifdef __WITH_RENAME
                'if (o.hasFeature(apf.__RENAME__) && this.dorename && o.mode == "normal")\
                    o.startDelayedRename(event);' +
                // #endif
                'this.dorename = false;\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.mode == "normal" && o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey)');
        } //@todo add DRAGDROP ifdefs
        else {
            elSelect.setAttribute("onmouseout",    "apf.setStyleClass(this, '', ['hover']);");
            elSelect.setAttribute("ondblclick", 'var o = apf.lookup('
                + this.$uniqueId + '); o.choose()');
            elSelect.setAttribute(this.itemSelectEvent
                || "onmousedown", 'var o = apf.lookup(' + this.$uniqueId
                + '); o.select(this, event.ctrlKey, event.shiftKey)');
        }

        //Setup Nodes Identity (Look)
        if (elIcon) {
            if (elIcon.nodeType == 1) {
                elIcon.setAttribute("style", "background-image:url("
                    + apf.getAbsolutePath(this.iconPath, this.$applyBindRule("icon", xmlNode))
                    + ")");
            }
            else {
                elIcon.nodeValue = apf.getAbsolutePath(this.iconPath,
                    this.$applyBindRule("icon", xmlNode));
            }
        }
        else if (elImage) {
            if (elImage.nodeType == 1)
                elImage.setAttribute("style", "background-image:url("
                    + apf.getAbsolutePath(apf.hostPath, this.$applyBindRule("image", xmlNode))
                    + ")");
            else {
                if (apf.isSafariOld) { //@todo this should be changed... blrgh..
                    var p   = elImage.ownerElement.parentNode,
                        img = p.appendChild(p.ownerDocument.createElement("img"));
                    img.setAttribute("src", 
                        apf.getAbsolutePath(apf.hostPath, this.$applyBindRule("image", xmlNode)));
                }
                else {
                    elImage.nodeValue = 
                        apf.getAbsolutePath(apf.hostPath, this.$applyBindRule("image", xmlNode));
                }
            }
        }

        if (elCaption) {
            apf.setNodeValue(elCaption,
                this.$applyBindRule("caption", xmlNode));
        }
        oItem.setAttribute("title", this.$applyBindRule("tooltip", xmlNode) || "");

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(oItem, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        if (this.$addModifier)
            this.$addModifier(xmlNode, oItem);

        if (htmlParentNode)
            apf.insertHtmlNode(oItem, htmlParentNode, beforeNode);
        else
            this.listNodes.push(oItem);
    };

    this.$fill = function(){
        if (this.more && !this.moreItem) {
            this.$getNewContext("item");
            var Item      = this.$getLayoutNode("item"),
                elCaption = this.$getLayoutNode("item", "caption"),
                elSelect  = this.$getLayoutNode("item", "select");

            Item.setAttribute("class", "more");
            elSelect.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId
                + ');o.clearSelection();o.$setStyleClass(this, "more_down");');
            elSelect.setAttribute("onmouseout", 'apf.lookup(' + this.$uniqueId
                + ').$setStyleClass(this, "", ["more_down"]);');
            elSelect.setAttribute("onmouseup", 'apf.lookup(' + this.$uniqueId
                + ').startMore(this)');

            if (elCaption)
                apf.setNodeValue(elCaption,
                    this.more.match(/caption:(.*)(;|$)/i)[1]);
            this.listNodes.push(Item);
        }

        apf.insertHtmlNodes(this.listNodes, this.$int);
        this.listNodes.length = 0;

        if (this.more && !this.moreItem)
            this.moreItem = this.$int.lastChild;
    };

    /**
     * Adds a new item to the list and lets the users type in the new name.
     * This functionality is especially useful in the interface when
     * {@link element.list.attribute.mode} is set to check or radio. For instance in a form.
     * @see element.list.attribute.more
     */
    this.startMore = function(o){
        this.$setStyleClass(o, "", ["more_down"]);

        var xmlNode;
        if (!this.$actions["add"]) {
            if (this.each && !this.each.match(/[\/\[]/)) {
                xmlNode = "<" + this.each + (this.each.match(/^a:/) 
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

        this.add(xmlNode, null, null, function(addedNode){
            this.select(addedNode, null, null, null, null, true);
            this.$int.appendChild(this.moreItem);
    
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
        });
    };

    /**** Selection ****/

    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [],
            nodes = this.hasFeature(apf.__VIRTUALVIEWPORT__)
                ? this.xmlRoot.selectNodes(this.each)
                : this.getTraverseNodes(),
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

    /**
     * Generates a list of items based on a string.
     * @param {String} str the description of the items. Items are seperated by a comma (,). Ranges are specified by a start and end value seperated by a dash (-).
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  lst.loadFillData("1980-2050");
     *  lst.loadFillData("red,green,blue,white");
     *  lst.loadFillData("None,100-110,1000-1100");
     *  lst.loadFillData("1-10"); // 1 2 3 4 etc
     *  lst.loadFillData("01-10"); //01, 02, 03, 04, etc
     * </code>
     */
    this.loadFillData = function(str){
        var len, start, end, parts = str.splitSafe(","), data = [];
        
        for (var p, part, i = 0; i < parts.length; i++) {
            if ((part = parts[i]).match(/^\d+-\d+$/)) {
                p     = part.split("-");
                start = parseInt(p[0]);
                end   = parseInt(p[1]);
                
                if (p[0].length == p[1].length) {
                    len = Math.max(p[0].length, p[1].length);
                    for (var j = start; j < end + 1; j++) {
                        data.push("<item>" + (j + "").pad(len, "0") + "</item>");
                    }
                }
                else {
                    for (var j = start; j < end + 1; j++) {
                        data.push("<item>" + j + "</item>");
                    }
                }
            }
            else {
                data.push("<item>" + part + "</item>");
            }
        }
        
        //@todo this is all an ugly hack (copied from item.js line 486)
        //this.$preventDataLoad = true;//@todo apf3.0 add remove for this
        
        this.$initingModel = true;
        
        this.each = "item";
        this.$setDynamicProperty("caption", "[label/text()|@caption|text()]");
        this.$setDynamicProperty("eachvalue", "[value/text()|@value|text()]");
        this.$canLoadDataAttr = false;

        this.load("<data>" + data.join("") + "</data>");
    };
// #ifdef __WITH_MULTISELECT
}).call(apf.BaseList.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.BaseList.prototype = new apf.MultiselectBinding());
#else 
}).call(apf.BaseList.prototype = new apf.Presentation());
#endif*/

// #endif
