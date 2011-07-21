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

// #ifdef __AMLTREE || __INC_ALL

/**
 * Element displaying data in a list where each item in the list can contain
 * such a list. This element gives the user the ability to walk through this
 * tree of data by clicking open elements to show more elements. The tree
 * can grow by fetching more data when the user requests it.
 * Example:
 * A tree with inline items.
 * <code>
 *  <a:tree id="tree" align="right">
 *      <a:item caption="root" icon="icoUsers.gif">
 *          <a:item icon="icoUsers.gif" caption="test">
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *          </a:item>
 *          <a:item icon="icoUsers.gif" caption="test" />
 *          <a:item icon="icoUsers.gif" caption="test" />
 *          <a:item icon="icoUsers.gif" caption="test" />
 *      </a:item>
 *  </a:tree>
 * </code>
 * Example:
 * <code>
 *  <a:tree model="filesystem.xml">
 *      <a:caption match="[@caption]" />
 *      <a:caption match="[@filename]" />
 *      <a:icon match="[@icon]" />
 *      <a:each match="[drive|file|folder]" />
 *  </a:tree>
 * </code>
 * Example:
 * Inline tree description that draws the same as the above example:
 * <code>
 *  <a:tree 
 *    model   = "filesystem.xml"
 *    caption = "[@caption|@filename]"
 *    icon    = "[@icon]"
 *    each    = "[drive|file|folder]" />
 * </code>
 *
 * @constructor
 * @define tree
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @binding insert Determines how new data is loaded when the user expands 
 * an item. For instance by clicking on the + button. This way only the root nodes
 * need to be loaded at the start of the application. All other children are
 * received on demand when the user requests it by navigating throught the tree.
 * Example:
 * This example shows an insert rule that only works on folder elements. It will
 * read the directory contents using webdav and insert it under the selected 
 * tree node.
 * <code>
 *  <a:tree model="filesystem.xml">
 *      <a:bindings>
 *          <a:caption match="[@caption|@filename]" />
 *          <a:insert match="[folder]" get="{myWebdav.readdir([@id])}" />
 *          <a:each match="[drive|file|folder]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * @attribute {String} get the {@link term.datainstruction data instruction} that is used to load the new data.
 * @binding caption  Determines the caption of a tree node.
 * @binding icon     Determines the icon of a tree node.
 * @binding css      Determines a css class for a tree node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <a:tree model="messages.xml">
 *      <a:caption match="[@caption]" />
 *      <a:css match="[folder/message[@unread]]" value="highlighUnread" />
 *      <a:icon match="[@icon]" />
 *      <a:icon match="[folder]" value="icoDir.png" />
 *      <a:each match="[folder|message]" />
 *  </a:tree>
 * </code>
 * @binding tooltip  Determines the tooltip of a tree node.
 * @binding empty    Determines the empty message of a node.
 * Example:
 * This example shows a gouped contact list, that displays a message under 
 * empty groups.
 * <code>
 *  <a:tree model="xml/contacts.xml">
 *      <a:caption match="[@caption]" />
 *      <a:icon match="[contact]" value="icoContact.png" />
 *      <a:icon match="[group]" value="icoFolder.png" />
 *      <a:empty match="[group]" value="Drag a contact to this group." />
 *      <a:each match="[group|contact]" />
 *  </a:tree>
 * </code>
 */
apf.tree = function(struct, tagName){
    this.$init(tagName || "tree", apf.NODE_VISIBLE, struct);
};

(function(){
    var HAS_CHILD = 1 << 1,
        IS_CLOSED = 1 << 2,
        IS_LAST   = 1 << 3,
        IS_ROOT   = 1 << 4,
        treeState = this.$treeState;
    
    /**** Properties and Attributes ****/
    
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
    
    this.$initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.$getNewContext("item");
        
        var hasChildren = state & HAS_CHILD || this.emptyMessage 
            && this.$applyBindRule("empty", xmlNode),
            //should be restructured and combined events set per element
            oItem = this.$getLayoutNode("item");
        //@todo this should use dispatchEvent, and be moved to oExt
        oItem.setAttribute("onmouseover",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            o.$setStyleClass(this, 'hover', null, true);");
        oItem.setAttribute("onmouseout",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            o.$setStyleClass(this, '', ['hover'], true);");
        /*oItem.setAttribute("onmousedown",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            if (o.onmousedown) o.onmousedown(event, this);");*/
        
        //Set open/close skin class & interaction
        this.$setStyleClass(this.$getLayoutNode("item", "class"), treeState[state]).setAttribute(apf.xmldb.htmlIdTag, Lid);
        this.$setStyleClass(this.$getLayoutNode("item", "container"), treeState[state])
        //this.$setStyleClass(oItem, xmlNode.tagName)
        var elOpenClose = this.$getLayoutNode("item", "openclose");
        if (elOpenClose) { //hasChildren && 
            elOpenClose.setAttribute("children", hasChildren);
            elOpenClose.setAttribute("onmousedown",
                "if (this.getAttribute('children') == false) return;\
                var o = apf.lookup(" + this.$uniqueId + ");\
                o.slideToggle(this, null, null, true);\
                apf.cancelBubble(event, o);");
            
            elOpenClose.setAttribute("ondblclick", "event.cancelBubble = true");
        }
        
        // #ifdef __WITH_MULTICHECK
        if (this.$mode) {
            var elCheck = this.$getLayoutNode("item", "check");
            if (elCheck) {
                elCheck.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.checkToggle(this, true);\o.$skipSelect = true;");

                if (apf.isTrue(this.$applyBindRule("checked", xmlNode))) {
                    this.$checkedList.push(xmlNode);
                    this.$setStyleClass(oItem, "checked");
                }
                else if (this.isChecked(xmlNode))
                    this.$setStyleClass(oItem, "checked");
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
        
        var ocAction = this.opencloseaction || "ondblclick";
        
        //Icon interaction
        var elIcon = this.$getLayoutNode("item", "icon");
        if (elIcon && elIcon != elOpenClose) {
            if (ocAction != "ondblclick") {
                elIcon.setAttribute(ocAction, 
                  "var o = apf.lookup(" + this.$uniqueId + ");" +
                   (ocAction == "onmousedown" ? "o.select(this, event.ctrlKey, event.shiftKey, event.button);" : "") +
                   (true ? "o.slideToggle(this, null, null, true);" : ""));
            }
            if (ocAction != "onmousedown") {
                elIcon.setAttribute("onmousedown", 
                  "apf.lookup(" + this.$uniqueId + ").select(this, event.ctrlKey, event.shiftKey, event.button);");
            }
            
            elIcon.setAttribute("ondblclick", 
              "var o = apf.lookup(" + this.$uniqueId + ");\
              o.choose(null, true);" + 
              //#ifdef __WITH_RENAME
              "o.stopRename();" + 
              //#endif
              (true && !ocAction == "ondblclick" ? "o.slideToggle(this, null, null, true);" : "") +
              "apf.cancelBubble(event,o);");
        }

        //Select interaction
        var elSelect = this.$getLayoutNode("item", "select"),
            strMouseDown;
        
        //#ifdef __WITH_RENAME || __WITH_DRAGDROP
        if (this.hasFeature(apf.__RENAME__) || this.hasFeature(apf.__DRAGDROP__)) {
            strMouseDown =
                'var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (event.button == 2) \
                    o.stopRename();\
                 else if (!o.renaming && o.hasFocus() && isSelected == 1) \
                    this.dorename = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey, event.button);\
                 apf.cancelBubble(event, o);';
            
            elSelect.setAttribute("onmouseout", 'this.hasPassedDown = false;' + (elSelect.getAttribute("onmouseout") || ""));
            elSelect.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');' +
                // #ifdef __WITH_RENAME
                'if (this.dorename && !o.mode)\
                    o.startDelayedRename(event, null, true);' +
                // #endif
                'this.dorename = false;\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey, event.button);');
        }
        else 
        //#endif 
        {
            strMouseDown = "o.select(this, event.ctrlKey, event.shiftKey, event.button);\
                            apf.cancelBubble(event, o);";
        }
        
        if (ocAction != "ondblclick") {
            elSelect.setAttribute(ocAction, 
              "var o = apf.lookup(" + this.$uniqueId + ");" +
               (ocAction == "onmousedown" ? strMouseDown : "") +
               (true ? "o.slideToggle(this, null, null, true);" : ""));
        }
        if (ocAction != "onmousedown") {
            elSelect.setAttribute("onmousedown", 
              "var o = apf.lookup(" + this.$uniqueId + ");" + strMouseDown);
        }

        elSelect.setAttribute("ondblclick", 
          "var o = apf.lookup(" + this.$uniqueId + ");\
          o.choose(null, true);" + 
          //#ifdef __WITH_RENAME
          "o.stopRename();this.dorename=false;" + 
          //#endif
          (ocAction == "ondblclick" ? "o.slideToggle(this, null, null, true);" : "") +
          "apf.cancelBubble(event, o);");
        
        //Setup Nodes Identity (Look)
        if (elIcon) {
            var iconURL = this.$applyBindRule("icon", xmlNode);
            if (iconURL) {
                if (elIcon.tagName.match(/^img$/i))
                    elIcon.setAttribute("src", apf.getAbsolutePath(this.iconPath, iconURL));
                else
                    elIcon.setAttribute("style", "background-image:url(" 
                        + apf.getAbsolutePath(this.iconPath, iconURL) + ")");
            }
        }

        var elCaption = this.$getLayoutNode("item", "caption");
        if (elCaption) {
            //#ifdef __WITH_AML_BINDINGS
            if (elCaption.nodeType == 1 
              && this.$cbindings.caption && this.$cbindings.caption.hasAml){
                var q = (this.$amlBindQueue || (this.$amlBindQueue = {}));
                
                elCaption.setAttribute("id", "placeholder_" + this.$uniqueId 
                    + "_" + ((q.caption || (q.caption = [])).push(xmlNode) - 1));
                apf.setNodeValue(elCaption, "");
            }
            else
            //#endif
            {
                apf.setNodeValue(elCaption,
                    this.$applyBindRule("caption", xmlNode));
            }
        }
        
        var strTooltip = this.$applyBindRule("tooltip", xmlNode)
        if (strTooltip)
            oItem.setAttribute("title", strTooltip);
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(this.$getLayoutNode("item", null, oItem), cssClass);
            this.$setStyleClass(this.$getLayoutNode("item", "container", oItem), cssClass);
            this.$dynCssClasses.push(cssClass);
        }
        // #endif

        return oItem;
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        var elIcon  = this.$getLayoutNode("item", "icon", htmlNode),
            iconURL = this.$applyBindRule("icon", xmlNode);
        if (elIcon && iconURL) {
            if (elIcon.tagName && elIcon.tagName.match(/^img$/i))
                elIcon.src = apf.getAbsolutePath(this.iconPath, iconURL);
            else
                elIcon.style.backgroundImage = "url(" 
                    + apf.getAbsolutePath(this.iconPath, iconURL) + ")";
        }
        
        // #ifdef __WITH_MULTICHECK
        //@todo
        // #endif

        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            //if (elCaption.nodeType != 1)
                //elCaption = elCaption.parentNode;
            
            if (elCaption.nodeType == 1) {
                //#ifdef __WITH_AML_BINDINGS
                if (!this.$cbindings.caption || !this.$cbindings.caption.hasAml)
                //#endif
                    elCaption.innerHTML = this.$applyBindRule("caption", xmlNode);
            }
            else
                elCaption.nodeValue = this.$applyBindRule("caption", xmlNode);
        }
        
        var strTooltip = this.$applyBindRule("tooltip", xmlNode);
        if (strTooltip) 
            htmlNode.setAttribute("title", strTooltip);

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.$dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.$dynCssClasses); //@todo overhead!
            if (cssClass && !this.$dynCssClasses.contains(cssClass))
                this.$dynCssClasses.push(cssClass);
        }
        // #endif
    };
    
    /**** Init ****/
    
    this.$draw = function(){
        this.$drawBase();
    };    
}).call(apf.tree.prototype = new apf.BaseTree());

apf.aml.setElement("tree", apf.tree);

apf.aml.setElement("checked", apf.BindingRule);
// #endif
