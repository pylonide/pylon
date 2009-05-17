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

var __DRAGDROP__ = 1 << 5;

// #ifdef __WITH_DRAGDROP

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have drag&drop 
 * features. This baseclass operates on the bound data of this element. 
 * When a rendered item is dragged and dropped the bound data is moved or 
 * copied from one element to another, or to the same element but at a different 
 * position. This is possible because the rendered item has a 
 * {@link term.smartbinding bidirectional connection} to the data. Drag&drop can 
 * be turned on with a simple boolean, or by specifying detailed rules to set 
 * which data can be dragged and dropped and where.
 *
 * Example:
 * This is a simple example, enabling drag&drop for a list.
 * <code>
 *  <j:list
 *      dragEnabled     = "true"
 *      dropEnabled     = "true"
 *      dragMoveEnabled = "true" />
 * </code>
 *
 * Example:
 * This example shows a smartbinding that represents files and folders. It uses 
 * {@link term.datainstruction data instruction} to tell communicat to the webdav
 * server when an item is copied or moved.
 * <code>
 *  <j:smartbinding>
 *      <j:bindings>
 *          <j:caption select="@filename" />
 *          <j:traverse select="file|folder" />
 *      </j:bindings>
 *      <j:actions>
 *          <j:move
 *              select = "self::folder"
 *              set    = "webdav:move({@path}, {../@path})" />
 *          <j:copy
 *              select = "self::file"
 *              set    = "webdav:copy({@path}, {../@path})" />
 *      </j:actions>
 *      <j:dragdrop>
 *          <j:allow-drag select = "person" copy-condition="event.ctrlKey" />
 *          <j:allow-drop
 *              select         = "file"
 *              target         = "folder"
 *              action         = "tree-append"
 *              copy-condition = "event.ctrlKey" />
 *          <j:allow-drop
 *              select         = "folder"
 *              target         = "folder"
 *              action         = "insert-before"
 *              copy-condition = "event.ctrlKey" />
 *      </j:dragdrop>
 *  </j:smartbinding>
 * </code>
 *
 * @event  dragdata  Fires before a drag&drop operation is started to determine the data that is dragged.
 *   object:
 *   {XMLElement} data the default data for the drag&drop operation
 * @event  dragstart Fires before a drag operation is started.
 *   cancellable: Prevents the drag operation to start.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {JMLElement}  host      the jml source element.
 * @event  dragover Fires when the users drags over this jml element.
 *   cancellable: Prevents the possibility to drop.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {JMLElement}  host      the jml source element.
 * @event  dragout  Fires when the user moves away from this jml element.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {JMLElement}  host      the jml source element.
 * @event  dragdrop  Fires when the user drops an item on this jml element.
 *   cancellable: Prevents the possibility to drop.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {JMLElement}  host      the jml source element.
 *   {Boolean}     candrop   whether the data can be inserted at the point hovered over by the user
 *
 * @see element.allow-drag
 * @see element.allow-drop
 * @see element.dragdrop
 *
 * @define dragdrop
 * @allowchild allow-drop, allow-drag
 * @define allow-drag   Determines whether a {@link term.datanode data node} can 
 * be dragged from this element. 
 * Example:
 * This example shows a small mail application. The tree element displays a root
 * node, accounts and folders in a tree. The datagrid contains the mails. This
 * rule specifies which data nodes you can drag. Folders can be dragged but not
 * accounts. Mails can be dragged from the datagrid.
 * <code>
 *  <j:tree align="left" width="200">
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:traverse select="root|account|folder" />
 *      </j:bindings>
 *      <j:dragdrop>
 *          <j:allow-drag select = "folder" />
 *          <j:allow-drop select = "folder" 
 *                        target = "folder|account" />
 *          <j:allow-drop select = "mail" 
 *                        target = "folder" />
 *      </j:dragdrop>
 *  </j:tree>
 *  <j:datagrid align="right">
 *      <j:bindings>
 *          ...
 *      </j:bindings>
 *      <j:dragdrop>
 *          <j:allow-drag select="mail" />
 *      </j:dragdrop>
 *  </j:datagrid>
 * </code>
 *
 * @attribute {String} select          an xpath statement querying the {@link term.datanode data node} that is dragged. If the query matches a node it is allowed to be dropped. The xpath is automatically prefixed by 'self::'.
 * @attribute {String} copy-condition  a javascript expression that determines whether the dragged element is a copy or a move. Use event.ctrlKey to use the Ctrl key to determine whether the element is copied.
 *
 * @define allow-drop   Determines whether a {@link term.datanode data node} can 
 * be dropped on a data node bound to this element. 
 * Example:
 * This example shows a small mail application. The tree element displays a root
 * node, accounts and folders in a tree. The datagrid contains the mails. This
 * rule specifies which data nodes can be dropped where. Folders can be dropped 
 * in folders and accounts. Mails can be dropped in folders.
 * <code>
 *  <j:tree align="left" width="200">
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:traverse select="root|account|folder" />
 *      </j:bindings>
 *      <j:dragdrop>
 *          <j:allow-drag select = "folder" />
 *          <j:allow-drop select = "folder" 
 *                        target = "folder|account" />
 *          <j:allow-drop select = "mail" 
 *                        target = "folder" />
 *      </j:dragdrop>
 *  </j:tree>
 *  <j:datagrid align="right">
 *      <j:bindings>
 *          ...
 *      </j:bindings>
 *      <j:dragdrop>
 *          <j:allow-drag select="mail" />
 *      </j:dragdrop>
 *  </j:datagrid>
 * </code>
 
 * @attribute {String} select          an xpath statement querying the {@link term.datanode data node} that is dragged. If the query matches a node it is allowed to be dropped. The xpath is automatically prefixed by 'self::'.
 * @attribute {String} target          an xpath statement determining the new parent of the dropped {@link term.datanode data node}. The xpath is automatically prefixed by 'self::'.
 * @attribute {String} action          the action to perform when the {@link term.datanode data node} is inserted.
 *   Possible values:
 *   tree-append    Appends the {@link term.datanode data node} to the element it's dropped on.
 *   list-append    Appends the {@link term.datanode data node} to the root element of this element.
 *   insert-before  Inserts the {@link term.datanode data node} before the elements it's dropped on.
 * @attribute {String} copy-condition  a javascript expression that determines whether the drop is a copy or a move. Use event.ctrlKey to use the Ctrl key to determine whether the element is copied.
 */
/**
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.DragDrop = function(){
    this.$regbase = this.$regbase | __DRAGDROP__;

    /* **********************
            Actions
    ***********************/

    /**
     * Copies a {@link term.datanode data node} to the bound data of this element.
     *
     * @action
     * @param  {XMLElement} xmlNode      the {@link term.datanode data node} which is copied.
     * @param  {XMLElement} pNode        the new parent element of the copied {@link term.datanode data node}. If none specified the root element of the data loaded in this element is used.
     * @param  {XMLElement} [beforeNode] the position where the {@link term.datanode data node} is inserted.
     */
    this.copy = function(xmlNode, pNode, beforeNode){
        xmlNode = xmlNode.cloneNode(true);

        //Use Action Tracker
        var exec = this.executeAction("appendChild",
            [pNode, xmlNode, beforeNode], "copy", xmlNode);

        if (exec !== false)
            return xmlNode;

        return false;
    };

    /**
     * Moves a {@link term.datanode data node} to the bound data of this element.
     *
     * @action
     * @param  {XMLElement}  xmlNode      the {@link term.datanode data node} which is copied.
     * @param  {XMLElement}  pNode        the new parent element of the moved {@link term.datanode data node}. If none specified the root element of the data loaded in this element is used.
     * @param  {XMLElement}  [beforeNode] the position where the {@link term.datanode data node} is inserted.
     */
    this.move = function(xmlNode, pNode, beforeNode){
        //Use Action Tracker
        var exec = this.executeAction("moveNode",
            [pNode, xmlNode, beforeNode], "move", xmlNode);
        if (exec !== false)
            return xmlNode;
        return false;
    };

    /**
     * Determines whether the user is allowed to drag the passed 
     * {@link term.datanode data node}. The decision is made based on the 
     * {@link element.allow-drag allow-drag} and {@link element.allow-drag allow-drag} 
     * rules. These elements determine when a data node can be dropped on 
     * another data node. For instance, imagine a mail application with a root
     * node, accounts and folders in a tree, and mails in a datagrid. The rules
     * would specify you can drag&drop folders within an account, and emails between
     * folders, but not on accounts or the root.
     *
     * @param  {XMLElement} dataNode the {@link term.datanode data node} subject to the test.
     * @return {Boolean} result of the test
     * @see baseclass.dragdrop.method.isDragAllowed
     */
    this.isDragAllowed = function(x){
        //#ifdef __WITH_OFFLINE
        if(typeof jpf.offline != "undefined" && !jpf.offline.canTransact())
            return false;
        //#endif

        if (this.disabled || !x)
            return false;

        if (this.dragenabled || this.dragmoveenabled)
            return true;

        var rules = (this.dragdropRules || {})["allow-drag"];
        if (!rules || !rules.length)
            return false;

        for (var i = 0; i < rules.length; i++) {
            if (x.selectSingleNode("self::" +
              jpf.parseExpression(rules[i].getAttribute("select"))
              .split("|").join("|self::")))
                return rules[i];
        }

        return false;
    };

    /**
     * Determines whether the user is allowed to dropped the passed 
     * {@link term.datanode data node}. The decision is made based on the 
     * {@link element.allow-drag allow-drag} and {@link element.allow-drag allow-drag} 
     * rules. These elements determine when a data node can be dropped on 
     * another data node. For instance, imagine a mail application with a root
     * node, accounts and folders in a tree, and mails in a datagrid. The rules
     * would specify you can drag&drop folders within an account, and emails between
     * folders, but not on accounts or the root.
     *
     * @param  {XMLElement} dataNode the {@link term.datanode data node} subject to the test.
     * @param  {XMLElement} target   the {@link term.datanode data node} on which the dragged data node is dropped.
     * @return {Boolean} result of the test
     * @see baseclass.dragdrop.method.isDragAllowed
     */
    this.isDropAllowed = function(x, target){
        //#ifdef __WITH_OFFLINE
        if(typeof jpf.offline != "undefined" && !jpf.offline.canTransact())
            return false;
        //#endif

        if (this.disabled || !x || !target)
            return false;

        var data, tgt;

        if (this.dropenabled) {
            data = x.selectSingleNode("true".indexOf(this.dropenabled) == -1
                ? this.dropenabled
                : (this.hasFeature(__MULTISELECT__)
                    ? "self::" + this.traverse.replace(/.*?\/([^\/]+)(\||$)/g, "$1$2").split("|").join("|self::")
                    : "."));

            tgt = target || target == this.xmlRoot && target || null;

            if (data && tgt && !jpf.xmldb.isChildOf(data, tgt, true))
                return [tgt, null];
        }

        var rules = (this.dragdropRules || {})["allow-drop"];

        if (!rules || !rules.length)
            return false;

        for (var op, strTgt, i = 0; i < rules.length; i++) {
            data = x.selectSingleNode("self::" +
                jpf.parseExpression(rules[i].getAttribute("select"))
                .split("|").join("|self::"));
                
            if (!data)
                continue;
                
            strTgt = rules[i].getAttribute("target");
            if (!strTgt || strTgt == ".") {
                op = rules[i].getAttribute("action");
                tgt = (op == "list-append" || target == this.xmlRoot
                  ? this.xmlRoot
                  : null);
            }
            else
                tgt = target.selectSingleNode("self::" + strTgt);

            if (data && tgt && !jpf.xmldb.isChildOf(data, tgt, true))
                return [tgt, rules[i]];
        }

        return false;
    };

    this.$dragDrop = function(xmlReceiver, xmlNode, rule, defaction, isParent, srcRule, event){
        if (action == "tree-append" && isParent) 
            return false;

        /*
            Possibilities:

            tree-append [default]: xmlNode.appendChild(movedNode);
            list-append          : xmlNode.parentNode.appendChild(movedNode);
            insert-before        : xmlNode.parentNode.insertBefore(movedNode, xmlNode);
        */
        var action = rule && rule.getAttribute("action") || defaction;
        
        //copy-condition convenience variables
        var internal = jpf.DragServer.dragdata.host == this;
        var ctrlKey  = event.ctrlKey;
        var keyCode  = event.keyCode;

        //jpf.parseExpression
        var ifcopy = rule && rule.getAttribute("copy-condition")
            ? eval(rule.getAttribute("copy-condition"))
            : this.dragmoveenabled;
        if (!ifcopy)
            ifcopy = typeof srcRule == "object"
              && srcRule.getAttribute("copy-condition")
                ? eval(srcRule.getAttribute("copy-condition"))
                : false;

        var sNode, actRule = ifcopy ? 'copy' : 'move';

        var parentXpath = rule ? rule.getAttribute("parent") : null;
        switch (action) {
            case "list-append":
                xmlReceiver = (isParent 
                  ? xmlReceiver
                  : this.getTraverseParent(xmlReceiver));
                if (parentXpath) {
                    if (xmlReceiver.selectSingleNode(parentXpath))
                        xmlReceiver = xmlReceiver.selectSingleNode(parentXpath);
                    else {
                        xmlReceiver.appendChild(xmlReceiver.ownerDocument.createElement(parentXpath));
                        xmlReceiver = xmlReceiver.selectSingleNode(parentXpath);
                    }
                }
                sNode = this[actRule](xmlNode, xmlReceiver);
                break;
            case "insert-before":
                sNode = isParent
                    ? this[actRule](xmlNode, xmlReceiver)
                    : this[actRule](xmlNode, xmlReceiver.parentNode, xmlReceiver);
                break;
            case "tree-append":
                if (parentXpath) {
                    if (xmlReceiver.selectSingleNode(parentXpath))
                        xmlReceiver = xmlReceiver.selectSingleNode(parentXpath);
                    else {
                        xmlReceiver.appendChild(xmlReceiver.ownerDocument.createElement(parentXpath));
                        xmlReceiver = xmlReceiver.selectSingleNode(parentXpath);
                    }
                }
                sNode = this[actRule](xmlNode, xmlReceiver);
                break;
        }

        if (this.selectable && sNode)
            this.select(sNode, null, null, null, true);

        return sNode;
    };

    /* **********************
            Init
    ***********************/

    var drag_inited;
    /**
     * Loads the dragdrop rules from the j:dragdrop element
     *
     * @param  {Array}      rules     the rules array created using {@link core.jpf.method.getrules}
     * @param  {XMLElement} [node] the reference to the j:dragdrop element
     * @see  SmartBinding
     * @private
     */
    this.loadDragDrop = function(rules, node){
        //#ifdef __DEBUG
        jpf.console.info("Initializing Drag&Drop for " + this.tagName
            + "[" + (this.name || '') + "]");
        //#endif

        if (rules) {
            if (this.dragdropRules)
                this.unloadDragDrop();

            //Set Properties
            this.dragdropRules = rules;
        }

        //Set cursors
        //SHOULD come from skin
        this.icoAllowed    = "";//this.xmlDragDrop.getAttribute("allowed");
        this.icoDenied     = "";//this.xmlDragDrop.getAttribute("denied");

        //Setup External Object
        this.oExt.dragdrop = false;

        this.oExt[jpf.isIphone ? "ontouchstart" : "onmousedown"] = function(e){
            e = e || window.event;
            if (jpf.isIphone) {
                if (e.touches.length == 1) return;
                var old_e = e;
                e = e.touches[0];
                var pos = jpf.getAbsolutePosition(e.target, this);
                e.offsetX = pos[0];
                e.offsetY = pos[1];
            }

            var fEl, srcEl = e.originalTarget || e.srcElement || e.target;
            if (this.host.hasFeature(__MULTISELECT__) && srcEl == this.host.oInt)
                return;
            this.host.dragging = 0;

            var srcElement = e.srcElement || e.target;
            if (!jpf.isIphone && this.host.allowdeselect
              && (srcElement == this
              || srcElement.getAttribute(jpf.xmldb.htmlIdTag)))
                return this.host.clearSelection(); //hacky

            //MultiSelect must have carret behaviour AND deselect at clicking white
            //for(prop in e) if(prop.match(/x/i)) str += prop + "\n";
            //alert(str);
            if (this.host.$findValueNode)
                fEl = this.host.$findValueNode(srcEl);
            var el = (fEl
                ? jpf.xmldb.getNode(fEl)
                : jpf.xmldb.findXMLNode(srcEl));
            if (this.selectable && (!this.host.selected || el == this.host.xmlRoot) || !el)
                return;

            if (this.host.isDragAllowed(this.selectable ? this.host.selected : el)) {
                this.host.dragging = 1;

                if (jpf.isIphone)
                    old_e.preventDefault();

                var d = window.document;
                d = (!doc.compatMode || doc.compatMode == 'CSS1Compat') 
                    ? doc.documentElement
                    : doc.body

                var scrollX = (jpf.isIE ? d.scrollLeft : window.pageXOffset),
                    scrollY = (jpf.isIE ? d.scrollTop  : window.pageYOffset);
                var oParent = srcEl.offsetParent;
                while (oParent && oParent.tagName != "BODY") {
                    scrollX -= oParent.scrollLeft;
                    scrollY -= oParent.scrollTop;
                    oParent = oParent.offsetParent;
                }

                jpf.DragServer.coordinates = {
                    srcElement : srcEl,
                    doc        : d,
                    offsetX    : (e.layerX ? e.layerX - srcEl.offsetLeft : e.offsetX) - scrollX, //|| jpf.event.layerX - srcEl.offsetLeft,
                    offsetY    : (e.layerY ? e.layerY - srcEl.offsetTop  : e.offsetY) - scrollY, //|| jpf.event.layerY - srcEl.offsetTop,
                    clientX    : e.pageX ? e.pageX - window.pageXOffset : e.clientX,//e.clientX,
                    clientY    : e.pageY ? e.pageY - window.pageYOffset : e.clientY
                };

                jpf.DragServer.start(this.host);
            }

            //e.cancelBubble = true;
        };

        this.oExt[jpf.isIphone ? "ontouchmove" : "onmousemove"] = function(e){
            //if (!e) e = event;
            if (this.host.dragging != 1) return;//e.button != 1 ||
            //if(Math.abs(jpf.DragServer.coordinates.offsetX - (e.layerX ? e.layerX - jpf.DragServer.coordinates.srcElement.offsetLeft : e.offsetX)) < 6 && Math.abs(jpf.DragServer.coordinates.offsetY - (e.layerX ? e.layerY - jpf.DragServer.coordinates.srcElement.offsetTop : e.offsetY)) < 6)
                //return;

            //jpf.DragServer.start(this.host);
        };

        if (jpf.isIphone) {
            this.oExt.ontouchend = this.oExt.ontouchcancel = function(){
                this.host.dragging = 0;
            };
        }
        else {
            this.oExt.onmouseup = function(){
                this.host.dragging = 0;
            };

            this.oExt.ondragmove  =
            this.oExt.ondragstart = function(){ return false; };
        }

        if(document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);

        if (this.$initDragDrop && (!rules || !drag_inited))
            this.$initDragDrop();

        drag_inited = true;
    };
    //this.addEventListener("skinchange", this.loadDragDrop);

    /**
     * Unloads the dragdrop rules from this element
     *
     * @see  SmartBinding
     * @private
     */
    this.unloadDragDrop = function(){
        this.xmlDragDrop = this.dragdropRules = this.icoAllowed 
          = this.icoDenied = this.oExt.dragdrop = this.oExt.ondragmove
          = this.oExt.ondragstart = null;
        if (jpf.isIphone) {
            this.oExt.ontouchstart = this.oExt.ontouchmove
                = this.oExt.ontouchend = this.oExt.ontouchcancel = null;
        }
        else {
            this.oExt.onmousedown = this.oExt.onmousemove
                = this.oExt.onmouseup = null;
        }

        if (document.elementFromPointRemove)
            document.elementFromPointRemove(this.oExt);
    };

    this.$booleanProperties["dragenabled"]     = true;
    this.$booleanProperties["dragmoveenabled"] = true;
    this.$supportedProperties.push("dropenabled", "dragenabled", "dragmoveenabled");

    /**
     * @attribute  {Boolean}  dragEnabled       whether the element allows dragging of it's items.
     * Example:
     * <code>
     *  <j:list dragEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {Boolean}  dragMoveEnabled   whether dragged items are moved or copied when holding the Ctrl key.
     * Example:
     * <code>
     *  <j:list dragMoveEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {Boolean}  dropEnabled       whether the element allows items to be dropped.
     * Example:
     * <code>
     *  <j:list dropEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {String}   dragdrop          the name of the j:dragdrop element for this element.
     * <code>
     *  <j:list dragdrop="bndDragdrop" />
     *
     *  <j:dragdrop id="bndDragdrop">
     *      <j:allow-drag select = "person" copy-condition="event.ctrlKey" />
     *      <j:allow-drop
     *          select         = "offer"
     *          target         = "person"
     *          action         = "tree-append"
     *          copy-condition = "event.ctrlKey" />
     *  </j:dragdrop>
     * </code>
     */
    this.$propHandlers["dragenabled"]     =
    this.$propHandlers["dragmoveenabled"] =
    this.$propHandlers["dropenabled"]     = function(value){
        if (value && !drag_inited)
            this.loadDragDrop();
    };

    this.$propHandlers["dragdrop"] = function(value){
        var sb = this.smartBinding || (jpf.isParsing
            ? jpf.JmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new jpf.smartbinding()));

        if (!value) {
            //sb.removeBindings();
            throw new Error("Not Implemented"); //@todo
            return;
        }

        // #ifdef __DEBUG
        if (!jpf.nameserver.get("dragdrop", value))
            throw new Error(jpf.formatErrorString(1066, this,
                "Connecting dragdrop",
                "Could not find dragdrop by name '"
                + value + "'", this.$jml));
        // #endif

        sb.addDragDrop(jpf.nameserver.get("dragdrop", value));
    };

    this.$jmlDestroyers.push(function(){
        this.unloadDragDrop();
    });
};

/**
 * Central object for dragdrop handling.
 * @private
 */
jpf.DragServer = {
    Init : function(){
        if (jpf.isIphone) {
            this.ontouchmove = this.onmousemove;
            this.ontouchend = this.ontouchcancel = this.onmouseup;
        }

        jpf.dragmode.defineMode("dragdrop", this);

        jpf.addEventListener("hotkey", function(e){
            if (jpf.window.dragging && e.keyCode == 27) {
                if (document.body.lastHost && document.body.lastHost.dragOut)
                    document.body.lastHost.dragOut(jpf.dragHost);

                return jpf.DragServer.stopdrag();
            }
        });
    },

    /* **********************
            API
    ***********************/

    start : function(host){
        if (document.elementFromPointReset)
            document.elementFromPointReset();

        //Create Drag Object
        var selection = host.selectable ? host.getSelection()[0] : host.xmlRoot; //currently only a single item is supported

        var srcRule = host.isDragAllowed(selection);
        if (!srcRule) return;

        var data = srcRule.nodeType
            ? selection.selectSingleNode("self::" +
                jpf.parseExpression(srcRule.getAttribute("select"))
                .split("|").join("|self::"))
            : selection;

        if (host.hasEventListener("dragdata"))
            data = host.dispatchEvent("dragdata", {data : data});

        this.dragdata = {
            selection : selection,
            data      : data,
            indicator : host.$showDragIndicator(selection, this.coordinates),
            host      : host
        };

        //EVENT - cancellable: ondragstart
        if (host.dispatchEvent("dragstart", this.dragdata) === false)
            return false;//(this.host.$tempsel ? select(this.host.$tempsel) : false);
        host.dragging = 2;

        jpf.dragmode.setMode("dragdrop");
    },

    stop : function(runEvent){
        if (this.last) this.dragout();

        //Reset Objects
        this.dragdata.host.dragging = 0;
        this.dragdata.host.$hideDragIndicator();

        //????EVENT: ondragstop
        //if(runEvent && this.dragdata.host.ondragstop) this.dragdata.host.ondragstop();

        jpf.dragmode.clear();
        this.dragdata = null;
    },

    m_out : function(){
        //this.style.cursor = "default";
        if (this.$onmouseout)
            this.$onmouseout();
        this.onmouseout = this.$onmouseout || null;
    },

    dragover : function(o, el, e){
        e = e || window.event;
        
        var fEl;
        if (o.$findValueNode)
            fEl = o.$findValueNode(el);
        //if(!fEl) return;

        //Check Permission
        var elSel = (fEl
            ? jpf.xmldb.getNode(fEl)
            : jpf.xmldb.findXMLNode(el));
        var candrop = o.isDropAllowed
            ? o.isDropAllowed(this.dragdata.selection, elSel || o.xmlRoot)
            : false;
        //EVENT - cancellable: ondragover
        if (o.dispatchEvent("dragover", this.dragdata) === false)
            candrop = false;

        //Set Cursor
        var srcEl = e.originalTarget || e.srcElement || e.target;
        //srcEl.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);
        if (srcEl.onmouseout != this.m_out) {
            srcEl.$onmouseout = srcEl.onmouseout;
            srcEl.onmouseout   = this.m_out;
        }
        //o.oExt.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);

        //REQUIRED INTERFACE: __dragover()
        if (o && o.$dragover)
            o.$dragover(el, this.dragdata, candrop);

        this.last = o;
    },

    dragout : function(o){
        if (this.last == o) return false;

        //EVENT: ondragout
        if (o)
            o.dispatchEvent("dragout", this.dragdata);

        //REQUIRED INTERFACE: __dragout()
        if (this.last && this.last.$dragout)
            this.last.$dragout(null, this.dragdata);

        //Reset Cursor
        //o.oExt.style.cursor = "default";
        this.last = null;
    },

    dragdrop : function(o, el, srcO, e){
        //Check Permission
        var elSel   = (o.$findValueNode
            ? jpf.xmldb.getNode(o.$findValueNode(el))
            : jpf.xmldb.findXMLNode(el));
        var candrop = (o.isDropAllowed)//elSel && 
            ? o.isDropAllowed(this.dragdata.data, elSel || o.xmlRoot)
            : false;

        //EVENT - cancellable: ondragdrop
        if (candrop) {
            if (o.dispatchEvent("dragdrop", jpf.extend({candrop : candrop},
              this.dragdata)) === false)
                candrop = false;
            else {
                var action = candrop[1]
                    && candrop[1].getAttribute("action")
                    || (o.isTreeArch ? "tree-append" : "list-append");
                if (action == "list-append" && (!o.isTreeArch && o == this.dragdata.host))
                    candrop = false;
            }
        }

        //Exit if not allowed
        if (!candrop) {
            this.dragout(o);
            return false;
        }

        //Move XML
        var rNode = o.$dragDrop(candrop[0], this.dragdata.data, candrop[1],
            action, (candrop[0] == o.xmlRoot), // || !o.isTraverseNode(candrop[0])
            srcO.isDragAllowed(this.dragdata.selection), e);
        this.dragdata.resultNode = rNode;

        //REQUIRED INTERFACE: __dragdrop()
        if (o && o.$dragdrop) {
            o.$dragdrop(el, jpf.extend({
                htmlEvent : e,
                xmlNode   : rNode
            }, this.dragdata), candrop);
        }

        //Reset Cursor
        //o.oExt.style.cursor = "default";
        this.last = null;
    },

    /* **********************
        Mouse Movements
    ***********************/

    onmousemove : function(e){
        if (!jpf.DragServer.dragdata) return;
        e = e || window.event;
        if (jpf.isIphone) {
            e.preventDefault();
            if (!e.touches)
                return jpf.DragServer.stop(true);
            e = e.touches[0];
        }
        
        var dragdata = jpf.DragServer.dragdata,
            d        = jpf.DragServer.coordinates.doc;

        e.clientX = e.pageX ? e.pageX - window.pageXOffset : e.clientX;
        e.clientY = e.pageY ? e.pageY - window.pageYOffset : e.clientY;

        if (!dragdata.started
          && Math.abs(jpf.DragServer.coordinates.clientX - e.clientX) < 6
          && Math.abs(jpf.DragServer.coordinates.clientY - e.clientY) < 6)
            return;

        if (!dragdata.started) {
            if (dragdata.host.$dragstart)
                dragdata.host.$dragstart(null, dragdata);
            dragdata.started = true;
        }
        
        //dragdata.indicator.style.top = e.clientY+"px";
        //dragdata.indicator.style.left = e.clientX+"px";

        var storeIndicatorTopPos = dragdata.indicator.style.top;
        //console.log("INDICATOR BEFORE: "+dragdata.indicator.style.top+" "+dragdata.indicator.style.left);
        //get Element at x, y
        dragdata.indicator.style.display = "block";
        if (dragdata.indicator)
            dragdata.indicator.style.top = "10000px";

        jpf.DragServer.dragdata.x = e.pageX || e.clientX + d.scrollLeft; //e.clientX + document.documentElement.scrollLeft;
        jpf.DragServer.dragdata.y = e.pageY || e.clientY + d.scrollTop;  //e.clientY + document.documentElement.scrollTop;
        var el = document.elementFromPoint(jpf.DragServer.dragdata.x,
            jpf.DragServer.dragdata.y);

        dragdata.indicator.style.top = storeIndicatorTopPos;
        //console.log("INDICATOR AFTER: "+dragdata.indicator.style.top+" "+dragdata.indicator.style.left+" "+jpf.DragServer.dragdata.x+" "+jpf.DragServer.dragdata.y);
        //Set Indicator
        dragdata.host.$moveDragIndicator(e);

        //get element and call events
        var receiver = jpf.findHost(el);

        //Run Events
        jpf.DragServer.dragout(receiver);
        if (receiver)
            jpf.DragServer.dragover(receiver, el, e);

        jpf.DragServer.lastTime = new Date().getTime();
    },

    onmouseup : function(e){
        e = e || window.event;
        if (jpf.isIphone) {
            e.preventDefault();
            if (!e.changedTouches)
                return jpf.DragServer.stop(true);
            e = e.changedTouches[0];
        }

        e.clientX = e.pageX ? e.pageX - window.pageXOffset : e.clientX;
        e.clientY = e.pageY ? e.pageY - window.pageYOffset : e.clientY;

        if (!jpf.DragServer.dragdata.started
          && Math.abs(jpf.DragServer.coordinates.clientX - e.clientX) < 6
          && Math.abs(jpf.DragServer.coordinates.clientY - e.clientY) < 6) {
            jpf.DragServer.stop(true)
            return;
        }

        //get Element at x, y
        var d         = jpf.DragServer.coordinates.doc,
            indicator = jpf.DragServer.dragdata.indicator;
        var storeIndicatorTopPos = indicator.style.top;
        //jpf.console.info("INDICATOR UP BEFORE: "+indicator.style.top+" "+indicator.style.left);
        if (indicator)
            indicator.style.top = "10000px";

        jpf.DragServer.dragdata.x = e.pageX || e.clientX + d.scrollLeft; //e.clientX+document.documentElement.scrollLeft;
        jpf.DragServer.dragdata.y = e.pageY || e.clientY + d.scrollTop;  //e.clientY+document.documentElement.scrollTop;
        var el = document.elementFromPoint(jpf.DragServer.dragdata.x,
            jpf.DragServer.dragdata.y);

        indicator.style.top = storeIndicatorTopPos;
        //jpf.console.info("INDICATOR UP AFTER: "+indicator.style.top+" "+indicator.style.left);

        //get element and call events
        var host = jpf.findHost(el);

        //Run Events
        if (host != jpf.DragServer.host)
            jpf.DragServer.dragout(host);
        jpf.DragServer.dragdrop(host, el, jpf.DragServer.dragdata.host, e);
        jpf.DragServer.stop(true)

        //Clear Selection
        if (jpf.isNS) {
            var selObj = window.getSelection();
            if (selObj)
                selObj.collapseToEnd();
        }
    }
};

if (jpf.dragmode)
    jpf.DragServer.Init();
else
    jpf.Init.addConditional(function(){jpf.DragServer.Init();}, null, 'jpf.dragmode');

// #endif
