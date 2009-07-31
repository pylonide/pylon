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
 *  <a:list
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
 *  <a:smartbinding>
 *      <a:bindings>
 *          <a:caption select="@filename" />
 *          <a:traverse select="file|folder" />
 *
 *          <a:drag select = "person" copy-condition="event.ctrlKey" />
 *          <a:drop
 *              select         = "file"
 *              target         = "folder"
 *              action         = "tree-append"
 *              copy-condition = "event.ctrlKey" />
 *          <a:drop
 *              select         = "folder"
 *              target         = "folder"
 *              action         = "insert-before"
 *              copy-condition = "event.ctrlKey" />
 *      </a:bindings>
 *      <a:actions>
 *          <a:move
 *              select = "self::folder"
 *              set    = "webdav:move({@path}, {../@path})" />
 *          <a:copy
 *              select = "self::file"
 *              set    = "webdav:copy({@path}, {../@path})" />
 *      </a:actions>
 *  </a:smartbinding>
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
 *   {AMLElement}  host      the aml source element.
 * @event  dragover Fires when the users drags over this aml element.
 *   cancellable: Prevents the possibility to drop.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {AMLElement}  host      the aml source element.
 * @event  dragout  Fires when the user moves away from this aml element.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {AMLElement}  host      the aml source element.
 * @event  dragdrop  Fires when the user drops an item on this aml element.
 *   cancellable: Prevents the possibility to drop.
 *   object:
 *   {XMLElement}  data      the data for the drag&drop operation
 *   {XMLElement}  selection the selection at the start of the drag operation
 *   {HTMLElement} indicator the html element that is shown while dragging the data
 *   {AMLElement}  host      the aml source element.
 *   {Boolean}     candrop   whether the data can be inserted at the point hovered over by the user
 *
 * @see element.drag
 * @see element.drop
 * @see element.dragdrop
 *
 * @define dragdrop
 * @allowchild drop, drag
 * @define drag   Determines whether a {@link term.datanode data node} can 
 * be dragged from this element. 
 * Example:
 * This example shows a small mail application. The tree element displays a root
 * node, accounts and folders in a tree. The datagrid contains the mails. This
 * rule specifies which data nodes you can drag. Folders can be dragged but not
 * accounts. Mails can be dragged from the datagrid.
 * <code>
 *  <a:tree align="left" width="200">
 *      <a:bindings>
 *          <a:caption select="@name" />
 *          <a:traverse select="root|account|folder" />
 *
 *          <a:drag select = "folder" />
 *          <a:drop select = "folder" 
 *                  target = "folder|account" />
 *          <a:drop select = "mail" 
 *                  target = "folder" />
 *      </a:bindings>
 *  </a:tree>
 *  <a:datagrid align="right">
 *      <a:bindings>
 *          <a:drag select="mail" />
 *      </a:bindings>
 *  </a:datagrid>
 * </code>
 *
 * @attribute {String} select          an xpath statement querying the {@link term.datanode data node} that is dragged. If the query matches a node it is allowed to be dropped. The xpath is automatically prefixed by 'self::'.
 * @attribute {String} copy-condition  a javascript expression that determines whether the dragged element is a copy or a move. Use event.ctrlKey to use the Ctrl key to determine whether the element is copied.
 *
 * @define drop   Determines whether a {@link term.datanode data node} can 
 * be dropped on a data node bound to this element. 
 * Example:
 * This example shows a small mail application. The tree element displays a root
 * node, accounts and folders in a tree. The datagrid contains the mails. This
 * rule specifies which data nodes can be dropped where. Folders can be dropped 
 * in folders and accounts. Mails can be dropped in folders.
 * <code>
 *  <a:tree align="left" width="200">
 *      <a:bindings>
 *          <a:caption select="@name" />
 *          <a:traverse select="root|account|folder" />
 *
 *          <a:drag select = "folder" />
 *          <a:drop select = "folder" 
 *                        target = "folder|account" />
 *          <a:drop select = "mail" 
 *                        target = "folder" />
 *      </a:bindings>
 *  </a:tree>
 *  <a:datagrid align="right">
 *      <a:bindings>
 *          <a:drag select="mail" />
 *      </a:bindings>
 *  </a:datagrid>
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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.DragDrop = function(){
    this.$regbase = this.$regbase | __DRAGDROP__;

    var _self = this;

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
    this.copy = function(nodeList, pNode, beforeNode, isMove){
        if (nodeList.nodeType)
            nodeList = [nodeList];
        
        var multiple, changes = [];
        for (var i = 0; i < nodeList.length; i++) {
            changes.push({
                func : isMove ? "moveNode" : "appendChild",
                args : [pNode, isMove
                    ? nodeList[i]
                    : nodeList[i] = nodeList[i].cloneNode(true), beforeNode]
            });
        }
        
        if (this.actionRules && this.actionRules[(isMove ? "movegroup" : "copygroup")])
            var exec = this.executeAction("multicall", changes, 
                (isMove ? "movegroup" : "copygroup"), nodeList[0]);
        else {
            var exec = this.executeAction("multicall", changes, 
                (isMove ? "move" : "copy"), nodeList[0], null, null, 
                nodeList.length > 1 ? nodeList : null);
        }

        if (exec !== false)
            return nodeList;

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
    this.move = function(nodeList, pNode, beforeNode){
        return this.copy(nodeList, pNode, beforeNode, true);
    };

    /**
     * Determines whether the user is allowed to drag the passed 
     * {@link term.datanode data node}. The decision is made based on the 
     * {@link element.drag drag} and {@link element.drag drag} 
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
    this.isDragAllowed = function(x, data){
        //#ifdef __WITH_OFFLINE
        if(typeof apf.offline != "undefined" && !apf.offline.canTransact())
            return false;
        //#endif

        if (this.disabled || !x || !x.length || !x[0])
            return false;

        if (this.dragenabled || this.dragmoveenabled) {
            if (data)
                data.merge(x);
            return true;
        }
        
        var rules = (this.bindingRules || {})["drag"];
        if (!rules || !rules.length)
            return false;

        var node, rule, ruleList = [];
        for (var j = 0; j < x.length; j++) {
            node = x[j], rule = null;
            for (var i = 0; i < rules.length; i++) {
                if (node.selectSingleNode("self::" +
                  apf.parseExpression(rules[i].getAttribute("select"))
                  .split("|").join("|self::"))) {
                    rule = rules[i];
                    break;
                }
            }
            if (rule) {
                ruleList.push(rule);
                if (data) {
                    var sel = rule.getAttribute("select");
                    data.push(sel
                      ? node.selectSingleNode("self::" +
                          apf.parseExpression(sel)
                          .split("|").join("|self::"))
                      : node);
                }
            }
            else return false; //It's all or nothing
        }

        return ruleList.length ? ruleList : false;
    };

    /**
     * Determines whether the user is allowed to dropped the passed 
     * {@link term.datanode data node}. The decision is made based on the 
     * {@link element.drag drag} and {@link element.drag drag} 
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
        if(typeof apf.offline != "undefined" && !apf.offline.canTransact())
            return false;
        //#endif

        if (this.disabled || !x || !x.length || !target) //!x[0] ???
            return false;

        var data, tgt;

        if (this.dropenabled) {
            var query = "true".indexOf(this.dropenabled) == -1
                ? this.dropenabled
                : (this.hasFeature(__MULTISELECT__)
                    ? "self::" + this.traverse.replace(/.*?\/([^\/]+)(\||$)/g, "$1$2").split("|").join("|self::")
                    : ".");
            
            tgt = target || target == this.xmlRoot && target || null;
            if (tgt) {
                var retValue = [tgt, null];
                for (var i = 0, l = x.length; i < l; i++) {
                    data = x[i].selectSingleNode(query);
                    if (!data || apf.isChildOf(data, tgt, true)) {
                        retValue = null;
                        break; //All or nothing
                    }
                }
                
                if (retValue)
                    return retValue;
            }
        }

        var rules = (this.bindingRules || {})["drop"];

        if (!rules || !rules.length)
            return false;

        //@todo this can be optimized when needed
        var rule, query;
        for (var op, strTgt, i = 0, rl = rules.length; i < rl; i++) {
            rule  = rules[i];
            query = "self::" + apf.parseExpression(rule.getAttribute("select"))
                .split("|").join("|self::");
                
            for (var j = 0, l = x.length; j < l; j++) {   
                data = x[j].selectSingleNode(query);
                if (!data)
                    break;
            }
            if (j != l)
                continue;

            strTgt = rule.getAttribute("target");
            if (!strTgt || strTgt == ".") {
                op = rule.getAttribute("action");
                tgt = (op == "list-append" || target == this.xmlRoot
                  ? this.xmlRoot
                  : null);
            }
            else
                tgt = target.selectSingleNode("self::" +
                    apf.parseExpression(strTgt)
                    .split("|").join("|self::"));

            if (data && tgt && !apf.isChildOf(data, tgt, true))
                return [tgt, rule];
        }

        return false;
    };

    this.$dragDrop = function(xmlReceiver, xmlNodeList, rule, defaction, isParent, srcRule, event){
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
        var internal = apf.DragServer.dragdata.host == this;
        var ctrlKey  = event.ctrlKey;
        var keyCode  = event.keyCode;

        //apf.parseExpression
        var ifcopy = rule
            ? (rule.getAttribute("copy-condition")
                ? eval(rule.getAttribute("copy-condition"))
                : false) //false (when below wasn't disabled)
            : (this.dragmoveenabled ? ctrlKey : true);
        
        //isn't very efficient for multinode dragdrop
        /*if (!ifcopy)
            ifcopy = typeof srcRule == "object"
              && srcRule.getAttribute("copy-condition")
                ? eval(srcRule.getAttribute("copy-condition"))
                : ctrlKey;*/

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
                sNode = this[actRule](xmlNodeList, xmlReceiver);
                break;
            case "insert-before":
                sNode = isParent
                    ? this[actRule](xmlNodeList, xmlReceiver)
                    : this[actRule](xmlNodeList, xmlReceiver.parentNode, xmlReceiver);
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
                sNode = this[actRule](xmlNodeList, xmlReceiver);
                break;
        }

        if (this.selectable && sNode) {
            this.selectList(sNode);//, null, null, null, true);
            this.setIndicator(sNode[0]);
            this.focus();
        }

        return sNode;
    };

    /* **********************
            Init
    ***********************/

    var drag_inited;
    /**
     * Loads the dragdrop rules from the dragdrop element
     *
     * @param  {Array}      rules     the rules array created using {@link core.apf.method.getrules}
     * @param  {XMLElement} [node] the reference to the dragdrop element
     * @see  SmartBinding
     * @private
     */
    this.enableDragDrop = function(){
        //#ifdef __DEBUG
        apf.console.info("Initializing Drag&Drop for " + this.tagName
            + "[" + (this.name || '') + "]");
        //#endif

        //Set cursors
        //SHOULD come from skin
        this.icoAllowed    = "";//this.xmlDragDrop.getAttribute("allowed");
        this.icoDenied     = "";//this.xmlDragDrop.getAttribute("denied");

        //Setup External Object
        this.oExt.dragdrop = false;

        this.oExt[apf.isIphone ? "ontouchstart" : "onmousedown"] = function(e){
            e = e || window.event;
            // #ifdef __SUPPORT_IPHONE
            if (apf.isIphone) {
                if (e.touches.length == 1) return;
                var old_e = e;
                e = e.touches[0];
                var pos = apf.getAbsolutePosition(e.target, this);
                e.offsetX = pos[0];
                e.offsetY = pos[1];
            }
            //#endif

            var fEl, srcEl = e.originalTarget || e.srcElement || e.target;
            var multiselect = _self.hasFeature(__MULTISELECT__);
            if (multiselect && srcEl == _self.oInt)
                return;
            _self.dragging = 0;

            var srcElement = e.srcElement || e.target;
            if (!apf.isIphone && _self.allowdeselect
              && (srcElement == this
              || srcElement.getAttribute(apf.xmldb.htmlIdTag)))
                return _self.clearSelection(); //hacky

            //MultiSelect must have carret behaviour AND deselect at clicking white
            //for(prop in e) if(prop.match(/x/i)) str += prop + "\n";
            //alert(str);
            if (_self.$findValueNode)
                fEl = _self.$findValueNode(srcEl);
            var el = (fEl
                ? apf.xmldb.getNode(fEl)
                : apf.xmldb.findXmlNode(srcEl));
            if (multiselect && (!_self.selected || !el || el == _self.xmlRoot))
                return;

            if (_self.isDragAllowed(multiselect ? _self.$getSelection() : el)) {
                _self.dragging = 1;

                // #ifdef __SUPPORT_IPHONE
                if (apf.isIphone)
                    old_e.preventDefault();
                //#endif
                
                var d = window.document;
                d = (!d.compatMode || d.compatMode == 'CSS1Compat') 
                    ? d.html || d.documentElement
                    : d.body

                var scrollX = (apf.isIE ? d.scrollLeft : window.pageXOffset),
                    scrollY = (apf.isIE ? d.scrollTop  : window.pageYOffset);
                var oParent = _self.oExt.offsetParent;//srcEl.offsetParent;
                while (oParent && oParent != d && oParent.tagName != "BODY") {
                    scrollX -= oParent.scrollLeft;
                    scrollY -= oParent.scrollTop;
                    oParent = oParent.offsetParent;
                }
                
                if (apf.isIE8) {
                    var loopEl = srcEl;
                    while (!loopEl.getAttribute(apf.xmldb.htmlIdTag)) {
                        loopEl = loopEl.parentNode;
                    }
                    var pos = apf.getAbsolutePosition(loopEl);
                }

                apf.DragServer.coordinates = {
                    srcElement : srcEl,
                    doc        : d,
                    scrollX    : scrollX,
                    scrollY    : scrollY,
                    offsetX    : (e.layerX ? e.layerX - srcEl.offsetLeft : (apf.isIE8 ? e.clientX - pos[0] : e.offsetX)) - scrollX, //|| apf.event.layerX - srcEl.offsetLeft,
                    offsetY    : (e.layerY ? e.layerY - srcEl.offsetTop  : (apf.isIE8 ? e.clientY - pos[1] : e.offsetY)) - scrollY, //|| apf.event.layerY - srcEl.offsetTop,
                    clientX    : e.pageX ? e.pageX - window.pageXOffset : e.clientX,//e.clientX,
                    clientY    : e.pageY ? e.pageY - window.pageYOffset : e.clientY
                };

                apf.DragServer.start(_self);
            }

            //e.cancelBubble = true;
        };

        this.oExt[apf.isIphone ? "ontouchmove" : "onmousemove"] = function(e){
            if (this.host.dragging != 1) return;
        };

        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) {
            this.oExt.ontouchend = this.oExt.ontouchcancel = function(){
                this.host.dragging = 0;
            };
        }
        else 
        //#endif
        {
            this.oExt.onmouseup = function(){
                this.host.dragging = 0;
            };

            this.oExt.ondragmove  =
            this.oExt.ondragstart = function(){ return false; };
        }

        if (document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);

        if (this.$initDragDrop && !drag_inited)
            this.$initDragDrop();

        drag_inited = true;
    };
    //this.addEventListener("skinchange", this.loadDragDrop);
    
    this.disableDragDrop = function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) {
            this.oExt.ontouchstart = this.oExt.ontouchmove
                = this.oExt.ontouchend = this.oExt.ontouchcancel = null;
        }
        else 
        //#endif
        {
            this.oExt.onmousedown = this.oExt.onmousemove
                = this.oExt.onmouseup = null;
        }

        if (document.elementFromPointRemove)
            document.elementFromPointRemove(this.oExt);
    }

    this.$booleanProperties["dragenabled"]     = true;
    this.$booleanProperties["dragmoveenabled"] = true;
    this.$supportedProperties.push("dropenabled", "dragenabled", "dragmoveenabled");

    /**
     * @attribute  {Boolean}  dragEnabled       whether the element allows dragging of it's items.
     * Example:
     * <code>
     *  <a:list dragEnabled="true">
     *      <a:item>item 1</a:item>
     *      <a:item>item 2</a:item>
     *      <a:item>item 3</a:item>
     *  </a:list>
     * </code>
     * @attribute  {Boolean}  dragMoveEnabled   whether dragged items are moved or copied when holding the Ctrl key.
     * Example:
     * <code>
     *  <a:list dragMoveEnabled="true">
     *      <a:item>item 1</a:item>
     *      <a:item>item 2</a:item>
     *      <a:item>item 3</a:item>
     *  </a:list>
     * </code>
     * @attribute  {Boolean}  dropEnabled       whether the element allows items to be dropped.
     * Example:
     * <code>
     *  <a:list dropEnabled="true">
     *      <a:item>item 1</a:item>
     *      <a:item>item 2</a:item>
     *      <a:item>item 3</a:item>
     *  </a:list>
     * </code>
     * @attribute  {String}   dragdrop          the name of the dragdrop element for this element.
     * <code>
     *  <a:list bindings="bndDragdrop" />
     *
     *  <a:bindings id="bndDragdrop">
     *      <a:drag select = "person" copy-condition="event.ctrlKey" />
     *      <a:drop
     *          select         = "offer"
     *          target         = "person"
     *          action         = "tree-append"
     *          copy-condition = "event.ctrlKey" />
     *  </bindings>
     * </code>
     */
    this.$propHandlers["dragenabled"]     =
    this.$propHandlers["dragmoveenabled"] =
    this.$propHandlers["dropenabled"]     = function(value){
        if (value && !drag_inited)
            this.enableDragDrop();
    };

    this.$propHandlers["dragdrop"] = function(value){
        var sb = this.smartBinding || (apf.isParsing
            ? apf.AmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new apf.smartbinding()));

        if (!value) {
            //sb.removeBindings();
            throw new Error("Not Implemented"); //@todo
            return;
        }

        // #ifdef __DEBUG
        if (!apf.nameserver.get("dragdrop", value))
            throw new Error(apf.formatErrorString(1066, this,
                "Connecting dragdrop",
                "Could not find dragdrop by name '"
                + value + "'", this.$aml));
        // #endif

        sb.addDragDrop(apf.nameserver.get("dragdrop", value));
    };

    this.$amlDestroyers.push(function(){
        this.disableDragDrop();
    });
};

/**
 * Central object for dragdrop handling.
 * @private
 */
apf.DragServer = {
    Init : function(){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) {
            this.ontouchmove = this.onmousemove;
            this.ontouchend = this.ontouchcancel = this.onmouseup;
        }
        //#endif

        apf.dragmode.defineMode("dragdrop", this);

        apf.addEventListener("hotkey", function(e){
            if (apf.window.dragging && e.keyCode == 27) {
                if (document.body.lastHost && document.body.lastHost.dragOut)
                    document.body.lastHost.dragOut(apf.dragHost);

                return apf.DragServer.stopdrag();
            }
        });
    },

    /* **********************
            API
    ***********************/

    start : function(amlNode){
        if (document.elementFromPointReset)
            document.elementFromPointReset();

        //Create Drag Object
        var selection = amlNode.hasFeature(__MULTISELECT__) 
            ? amlNode.getSelection()
            : [amlNode.xmlRoot];

        var data    = [];
        var srcRules = amlNode.isDragAllowed(selection, data);
        if (!srcRules) return;

        if (amlNode.hasEventListener("dragdata"))
            data = amlNode.dispatchEvent("dragdata", {data : data});
        
        for(var i = 0, l = data.length; i < l; i++) {
            data[i] = apf.getCleanCopy(data[i]);
        }

        this.dragdata = {
            rules       : srcRules,
            selection   : selection,
            data        : data,
            indicator   : amlNode.$showDragIndicator(selection, this.coordinates),
            host        : amlNode
        };

        //EVENT - cancellable: ondragstart
        if (amlNode.dispatchEvent("dragstart", this.dragdata) === false)
            return false;//(this.amlNode.$tempsel ? select(this.amlNode.$tempsel) : false);
        amlNode.dragging = 2;

        apf.dragmode.setMode("dragdrop");
    },

    stop : function(runEvent, success){
        if (this.last) this.dragout();

        //Reset Objects
        this.dragdata.host.dragging = 0;
        this.dragdata.host.$hideDragIndicator(success);

        /*if (runEvent && this.dragdata.host.$dragstop) 
            this.dragdata.host.$dragstop();*/

        apf.dragmode.clear();
        this.dragdata = null;
    },

    /*m_out : function(){
        this.style.cursor = "default";
        if (this.$onmouseout)
            this.$onmouseout();
        this.onmouseout = this.$onmouseout || null;
    },*/

    dragover : function(o, el, e){
        e = e || window.event;

        //@todo optimize by not checking the same node dragged over twice in a row

        var fEl;
        if (o.$findValueNode)
            fEl = o.$findValueNode(el);

        if (this.lastFel && this.lastFel == fEl 
          || !this.lastFel && this.last == o) //optimization
            return;

        //Check Permission
        var elSel = (fEl
            ? apf.xmldb.getNode(fEl)
            : apf.xmldb.findXmlNode(el));
        var candrop = o.isDropAllowed && o.xmlRoot
            ? o.isDropAllowed(this.dragdata.data, elSel || o.xmlRoot)
            : apf.isTrue(apf.getInheritedAttribute(o, "", function(p){
                  if (p.dropenabled) {
                      o = p;
                      if (o == apf.DragServer.last)
                        return false;
                      return true;
                  }
               }));

        if (this.last && this.last != o)
            this.dragout(this.last);
            
        if (!candrop)
            return;

        //EVENT - cancellable: ondragover
        if (o.dispatchEvent("dragover", this.dragdata) === false)
            candrop = false;

        //Set Cursor
        var srcEl = e.originalTarget || e.srcElement || e.target;
        /*srcEl.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);
        if (srcEl.onmouseout != this.m_out) {
            srcEl.$onmouseout = srcEl.onmouseout;
            srcEl.onmouseout   = this.m_out;
        }
        o.oExt.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);*/

        //REQUIRED INTERFACE: __dragover()
        if (o && o.$dragover)
            o.$dragover(el, this.dragdata, candrop);

        this.last = o;
        this.lastFel = fEl;
    },

    dragout : function(o){
        //if (this.last == o) 
            //return false;

        this.lastFel = null;

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
        var isParent;
        var elSel   = (o.$findValueNode
          ? apf.xmldb.getNode(o.$findValueNode(el))
          : apf.xmldb.findXmlNode(el));
        var candrop = (o.isDropAllowed && o.xmlRoot)
          ? o.isDropAllowed(this.dragdata.data, elSel || o.xmlRoot) : false;
         
        if (this.dragdata.indicator)
            this.dragdata.indicator.style.top = "10000px";
         
        if (!candrop) 
            candrop = apf.isTrue(apf.getInheritedAttribute(o, "", function(p){
              if (p.dropenabled) {
                  o = p;
                  return true;
              }
            }));

        //EVENT - cancellable: ondragdrop
        if (candrop) {
            if (o.dispatchEvent("dragdrop", apf.extend({candrop : candrop},
              this.dragdata)) === false)
                candrop = false;
            else {
                if (!o.xmlRoot) {
                    var m = o.getModel 
                      ? o.getModel(true) 
                      : apf.nameserver.get("model", o.model)
                    if (m)
                        m.load(this.dragdata.data[0])
                    //else warn??
                    return true;
                }
                else {
                    var action = candrop[1]
                        && candrop[1].getAttribute("action")
                        || (o.isTreeArch ? "tree-append" : "list-append");
                    if (action == "list-append" && (!o.isTreeArch && o == this.dragdata.host))
                        candrop = false;
                }
            }
        }

        //Exit if not allowed
        if (!candrop) {
            this.dragout(o);
            return false;
        }

        if (o.$dragDrop) {
            //Move XML
            var rNode = o.$dragDrop(candrop[0], this.dragdata.data, candrop[1],
                action, isParent || candrop[0] == o.xmlRoot, this.dragdata.rules, e);
            this.dragdata.resultNode = rNode;
        }
        
        if (o.$dragdrop) {
            o.$dragdrop(el, apf.extend({
                htmlEvent : e,
                xmlNode   : rNode
            }, this.dragdata), candrop);
        }

        //Reset Cursor
        //o.oExt.style.cursor = "default";
        this.last = null;
        this.lastFel = null;
        
        return true;
    },

    /* **********************
        Mouse Movements
    ***********************/

    onmousemove : function(e){
        if (!apf.DragServer.dragdata) return;
        e = e || window.event;
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) {
            e.preventDefault();
            if (!e.touches)
                return apf.DragServer.stop(true);
            e = e.touches[0];
        }
        //#endif
        
        var dragdata = apf.DragServer.dragdata,
            c = {
                clientX: e.pageX ? e.pageX - window.pageXOffset : e.clientX,
                clientY: e.pageY ? e.pageY - window.pageYOffset : e.clientY
            };

        if (!dragdata.started
          && Math.abs(apf.DragServer.coordinates.clientX - c.clientX) < 6
          && Math.abs(apf.DragServer.coordinates.clientY - c.clientY) < 6)
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

        apf.DragServer.dragdata.x = e.pageX ? e.pageX - (apf.isGecko
            ? window.pageXOffset
            : 0) : c.clientX;
        apf.DragServer.dragdata.y = e.pageY ? e.pageY - (apf.isGecko
            ? window.pageYOffset
            : 0) : c.clientY;
        var el = document.elementFromPoint(apf.DragServer.dragdata.x,
            apf.DragServer.dragdata.y);

        dragdata.indicator.style.top = storeIndicatorTopPos;
        //console.log("INDICATOR AFTER: "+dragdata.indicator.style.top+" "+dragdata.indicator.style.left+" "+apf.DragServer.dragdata.x+" "+apf.DragServer.dragdata.y);
        //Set Indicator
        dragdata.host.$moveDragIndicator(c);

        //get element and call events
        var receiver = apf.findHost(el);

        //Run Events
        if (receiver)
            apf.DragServer.dragover(receiver, el, e);
        else if (apf.DragServer.last)
            apf.DragServer.dragout(apf.DragServer.last);


        apf.DragServer.lastTime = new Date().getTime();
    },

    onmouseup : function(e){
        e = e || window.event;
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone) {
            e.preventDefault();
            if (!e.changedTouches)
                return apf.DragServer.stop(true);
            e = e.changedTouches[0];
        }
        //#endif

        var c = {
            clientX: e.pageX ? e.pageX - window.pageXOffset : e.clientX,
            clientY: e.pageY ? e.pageY - window.pageYOffset : e.clientY
        };

        if (!apf.DragServer.dragdata.started
          && Math.abs(apf.DragServer.coordinates.clientX - c.clientX) < 6
          && Math.abs(apf.DragServer.coordinates.clientY - c.clientY) < 6) {
            apf.DragServer.stop(true)
            return;
        }

        //get Element at x, y
        var indicator = apf.DragServer.dragdata.indicator;
        var storeIndicatorTopPos = indicator.style.top;
        //apf.console.info("INDICATOR UP BEFORE: "+indicator.style.top+" "+indicator.style.left);
        if (indicator)
            indicator.style.top = "10000px";

        apf.DragServer.dragdata.x = e.pageX ? e.pageX - (apf.isGecko
            ? window.pageXOffset
            : 0) : c.clientX;
        apf.DragServer.dragdata.y = e.pageY ? e.pageY - (apf.isGecko
            ? window.pageYOffset
            : 0) : c.clientY;

        var el = document.elementFromPoint(apf.DragServer.dragdata.x,
            apf.DragServer.dragdata.y);

        indicator.style.top = storeIndicatorTopPos;
        //apf.console.info("INDICATOR UP AFTER: "+indicator.style.top+" "+indicator.style.left);

        //get element and call events
        var host = apf.findHost(el);

        //Run Events
        if (apf.DragServer.host && host != apf.DragServer.host)
            apf.DragServer.dragout(apf.DragServer.host);
        var success = apf.DragServer.dragdrop(host, el, apf.DragServer.dragdata.host, e);
        apf.DragServer.stop(true, success);
    }
};

if (apf.dragmode)
    apf.DragServer.Init();
else
    apf.Init.addConditional(function(){apf.DragServer.Init();}, null, 'apf.dragmode');

// #endif
