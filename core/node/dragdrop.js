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
 * Baseclass adding drag&drop features to this component. This baseclass 
 * operates on the bound data of this component. When a rendered item is dragged
 * and dropped the bound data is moved or copied from one component to another,
 * or to the same component but at a different position. Drag&drop can be turned
 * on with a simple boolean, or detailed rules can be specified which data 
 * should be dragged and/or dropped and where.
 *
 * Example:
 * <code>
 *  <j:smartbinding>
 *      <j:actions>
 *          <j:move 
 *              select = "self::folder"
 *              set    = "{@link datainstruction 'data instruction'}" />
 *          <j:copy 
 *              select = "self::file"
 *              set    = "{@link datainstruction 'data instruction'}" />
 *      </j:actions>
 *      <j:dragdrop>
 *          <j:allow-drag select = "person" copy-condition="event.ctrlKey" />
 *          <j:allow-drop 
 *              select         = "person" 
 *              target         = "company|office" 
 *              action         = "list-append" 
 *              copy-condition = "event.ctrlKey" />
 *          <j:allow-drop 
 *              select         = "offer"  
 *              target         = "person"         
 *              action         = "tree-append" 
 *              copy-condition = "event.ctrlKey" />
 *      </j:dragdrop>
 *  </j:smartbinding>
 * </code>
 *
 * Example:
 * <code>
 *  <j:list 
 *      dragEnabled     = "true" 
 *      dropEnabled     = "true" 
 *      dragMoveEnabled = "true" />
 * </code>
 *
 * @define dragdrop
 * @allowchild allow-drop, allow-drag
 * @define allow-drag   Specifies when nodes can be dragged from this component.
 * @attribute select          an xpath statement querying the xml data element that is dragged. If the query matches a node it is allowed to be dropped. The xpath is automatically prefixed by 'self::'.
 * @attribute copy-condition  a javascript expression that determines wether the dragged element is a copy or a move. Use event.ctrlKey to use the Ctrl key to determine wether the element is copied.
 * @define allow-drop   Specifies when nodes can be dropped into this component.
 * @attribute select          an xpath statement querying the xml data element that is dragged. If the query matches a node it is allowed to be dropped. The xpath is automatically prefixed by 'self::'.
 * @attribute target          an xpath statement determining the new parent of the dropped xml data element. The xpath is automatically prefixed by 'self::'.
 * @attribute action          the action to perform when the xml data element is inserted.
 *   Possible values:
 *   tree-append    Appends the xml data element to the element it's dropped on.
 *   list-append    Appends the xml data element to the root element of this component.
 *   insert-before  Inserts the xml data element before the elements it's dropped on.
 * @attribute copy-condition  a javascript expression that determines wether the drop is a copy or a move. Use event.ctrlKey to use the Ctrl key to determine wether the element is copied.
 *
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
     * Copies a data element to the dataset of this component.
     *
     * @action
     * @param  {XMLElement} xmlNode      the xml data element which is copied.
     * @param  {XMLElement} pNode        the new parent element of the copied data element. If none specified the root element of the data loaded in this component is used.
     * @param  {XMLElement} [beforeNode] the position where the data element is inserted.
     */
    this.copy = function(xmlNode, pNode, beforeNode){
        xmlNode = xmlNode.cloneNode(true);

        //Use Action Tracker
        var exec = this.executeAction("appendChild",
            [pNode, xmlNode, beforeNode], "copy", xmlNode);
        if (exec !== false)
            return xmlNode;

    };
    
    /**
     * Moves a data element to the dataset of this component.
     *
     * @action
     * @param  {XMLElement}  xmlNode      the xml data element which is copied.
     * @param  {XMLElement}  pNode        the new parent element of the moved data element. If none specified the root element of the data loaded in this component is used.
     * @param  {XMLElement}  [beforeNode] the position where the data element is inserted.
     */
    this.move = function(xmlNode, pNode, beforeNode){
        //Use Action Tracker
        var exec = this.executeAction("moveNode",
            [pNode, xmlNode, beforeNode], "move", xmlNode);
        if (exec !== false)
            return xmlNode;

    };
    
    /**
     * Determines wether the user is allowed to drag the passed XML node.
     *
     * @param  {XMLElement} the xml data element subject to the test.
     * @return {Boolean} result of the test
     */
    this.isDragAllowed = function(x){
        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif
        
        if (this.disabled || !x) 
            return false;
        
        if (this.dragenabled || this.dragmoveenabled)
            return true;
            
        var rules = (this.dragdropRules || {})["allow-drag"];
        if (!rules || !rules.length)
            return false;
            
        for (var i=0;i<rules.length;i++) {
            if (x.selectSingleNode("self::" + jpf.parseExpression(
              rules[i].getAttribute("select"))))
                return rules[i];
        }
        
        return false;
    };
    
    /**
     * Determines wether the user is allowed to dropped the passed XML node.
     *
     * @param  {XMLElement} xmlNode the xml data element subject to the test.
     * @return {Boolean} result of the test
     */
    this.isDropAllowed = function(x, target){
        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif
        
        if (this.disabled || !x || !target) 
            return false;

        if (this.dropenabled) {
            var data = x.selectSingleNode("true".indexOf(this.dropenabled) == -1
                ? this.dropenabled
                : (this.hasFeature(__MULTISELECT__)
                    ? "self::" + this.traverse.split("|").join("|self::")
                    : "."));
            
            var tgt = target || target == this.xmlRoot && target || null;
            
            if (data && tgt && !jpf.xmldb.isChildOf(data, tgt, true))
                return [tgt, null];
        }

        var rules = (this.dragdropRules || {})["allow-drop"];

        if (!rules || !rules.length)
            return false;
        
        for (var i = 0; i < rules.length; i++) {
            var data = x.selectSingleNode("self::" + jpf.parseExpression(
                rules[i].getAttribute("select")));
            
            if (!rules[i].getAttribute("target"))
                var tgt = target == this.xmlRoot ? target : null;
            else
                var tgt = target.selectSingleNode("self::" 
                    + rules[i].getAttribute("target"));
            
            if (data && tgt && !jpf.xmldb.isChildOf(data, tgt, true))
                return [tgt, rules[i]];
        }
        
        return false;
    };
    
    this.$dragDrop = function(xmlReceiver, xmlNode, rule, defaction, isParent, srcRule, event){
        if (action == "tree-append" && isParent) return false;
        
        /*
            Possibilities:
            
            tree-append [default]: xmlNode.appendChild(movedNode);
            list-append          : xmlNode.parentNode.appendChild(movedNode);
            insert-before        : xmlNode.parentNode.insertBefore(movedNode, xmlNode);
        */
        var action = rule && rule.getAttribute("operation") || defaction;
        var ifcopy = rule && rule.getAttribute("copy-condition")
            ? eval(rule.getAttribute("copy-condition"))
            : this.dragmoveenabled;
        if (!ifcopy)
            ifcopy = typeof srcRule == "object" 
              && srcRule.getAttribute("copy-condition")
                ? eval(srcRule.getAttribute("copy-condition"))
                : false;
        var actRule = ifcopy ? 'copy' : 'move';

        switch (action) {
            case "list-append":
                var sNode = this[actRule](xmlNode, 
                    isParent ? xmlReceiver : xmlReceiver.parentNode);
                break;
            case "insert-before":
                var sNode = isParent
                    ? this[actRule](xmlNode, xmlReceiver)
                    : this[actRule](xmlNode, xmlReceiver.parentNode, xmlReceiver); 
                break;
            case "tree-append":
                var sNode = this[actRule](xmlNode, xmlReceiver);
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
     * @param  {Array}      rules     the rules array created using {@link jpf#getRules(XMLElement)}
     * @param  {XMLElement} [xmlNode] the reference to the j:dragdrop element
     * @see  SmartBinding
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

        this.oExt.onmousedown = function(e){
            if (!e)
                e = event;
            var fEl, srcEl = e.originalTarget || e.srcElement;
            if (this.host.hasFeature(__MULTISELECT__) && srcEl == this.host.oInt)
                return;
            this.host.dragging = 0;
            
            var srcElement = jpf.hasEventSrcElement ? e.srcElement : e.target;
            if (this.host.allowdeselect
              && (srcElement == this
              || srcElement.getAttribute(jpf.xmldb.htmlIdTag)))
                return this.host.clearSelection(); //hacky
            
            //MultiSelect must have carret behaviour AND deselect at clicking white
            //for(prop in e) if(prop.match(/x/i)) str += prop + "\n";
            //alert(str);
            if (this.host.findValueNode)
                fEl = this.host.findValueNode(srcEl);
            var el = (fEl
                ? jpf.xmldb.getNode(fEl)
                : jpf.xmldb.findXMLNode(srcEl));
            if (this.selectable && (!this.host.selected || el == this.host.xmlRoot) || !el)
                return;

            if (this.host.isDragAllowed(this.selectable ? this.host.selected : el)) {
                this.host.dragging = 1;

                jpf.DragServer.coordinates = {
                    srcElement : srcEl, 
                    offsetX    : e.layerX ? e.layerX - srcEl.offsetLeft : e.offsetX, 
                    offsetY    : e.layerY ? e.layerY - srcEl.offsetTop  : e.offsetY,
                    clientX    : e.clientX,
                    clientY    : e.clientY
                };
                
                jpf.DragServer.start(this.host);
            }
            
            //e.cancelBubble = true;
        }

        this.oExt.onmousemove = function(e){
            if (!e) e = event;
            if (this.host.dragging != 1) return;//e.button != 1 || 
            //if(Math.abs(jpf.DragServer.coordinates.offsetX - (e.layerX ? e.layerX - jpf.DragServer.coordinates.srcElement.offsetLeft : e.offsetX)) < 6 && Math.abs(jpf.DragServer.coordinates.offsetY - (e.layerX ? e.layerY - jpf.DragServer.coordinates.srcElement.offsetTop : e.offsetY)) < 6)
                //return;

            //jpf.DragServer.start(this.host);
        };
        
        this.oExt.onmouseup = function(){
            this.host.dragging = 0;
        };
        
        this.oExt.ondragmove  = 
        this.oExt.ondragstart = function(){ return false; };
        
        if(document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);

        if (this.$initDragDrop && (!rules || !drag_inited))
            this.$initDragDrop();

        drag_inited = true;
    };
    //this.addEventListener("skinchange", this.loadDragDrop);
    
    /**
     * Unloads the dragdrop rules from this component
     *
     * @see  SmartBinding
     */
    this.unloadDragDrop = function(){
        this.xmlDragDrop = this.dragdropRules = this.icoAllowed = this.icoDenied
          = this.oExt.dragdrop = this.oExt.onmousedown = this.oExt.onmousemove
          = this.oExt.onmouseup = this.oExt.ondragmove = this.oExt.ondragstart
          = null;
        
        if (document.elementFromPointRemove)
            document.elementFromPointRemove(this.oExt);
    };
    
    this.$booleanProperties["dragenabled"]     = true;
    this.$booleanProperties["dragmoveenabled"] = true;
    this.$supportedProperties.push("dropenabled", "dragenabled", "dragmoveenabled");
    
    /**
     * @attribute  {Boolean}  dragEnabled       wether the component allows dragging of it's items.
     * Example:
     * <code>
     *  <j:list dragEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {Boolean}  dragMoveEnabled   wether dragged items are moved or copied when holding the Ctrl key.
     * Example:
     * <code>
     *  <j:list dragMoveEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {Boolean}  dropEnabled       wether the component allows items to be dropped.
     * Example:
     * <code>
     *  <j:list dropEnabled="true">
     *      <j:item>item 1</j:item>
     *      <j:item>item 2</j:item>
     *      <j:item>item 3</j:item>
     *  </j:list>
     * </code>
     * @attribute  {String}   dragdrop          the name of the j:dragdrop element for this component.
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
 * @private
 */
jpf.DragServer = {
    Init : function(){
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
            ? "self::" + selection.selectSingleNode(srcRule.getAttribute("select"))
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
        if(!e) e = event;
        var fEl;
        if (o.findValueNode)
            fEl = o.findValueNode(el);
        //if(!fEl) return;
    
        //Check Permission
        var elSel = (fEl
            ? jpf.xmldb.getNode(fEl)
            : jpf.xmldb.findXMLNode(el));
        var candrop = o.isDropAllowed
            ? o.isDropAllowed(this.dragdata.selection, elSel)
            : false; 
        //EVENT - cancellable: ondragover
        if (o.dispatchEvent("dragover") === false)
            candrop = false;
        
        //Set Cursor
        var srcEl = e.originalTarget || e.srcElement;
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
            o.dispatchEvent("dragout");
        
        //REQUIRED INTERFACE: __dragout()
        if (this.last && this.last.$dragout)
            this.last.$dragout(null, this.dragdata);
        
        //Reset Cursor
        //o.oExt.style.cursor = "default";
        this.last = null;
    },
    
    dragdrop : function(o, el, srcO, e){
        //Check Permission
        var elSel   = (o.findValueNode
            ? jpf.xmldb.getNode(o.findValueNode(el))
            : jpf.xmldb.findXMLNode(el));
        var candrop = (elSel && o.isDropAllowed)
            ? o.isDropAllowed(this.dragdata.data, elSel)
            : false; 

        //EVENT - cancellable: ondragdrop
        if (candrop) {
            if (o.dispatchEvent("dragdrop", jpf.extend({candrop : candrop}, 
              this.dragdata)) === false)
                candrop = false;
            else {
                var action = candrop[1] 
                    && candrop[1].getAttribute("operation") 
                    || (o.isTreeArch ? "tree-append" : "list-append");
                if (action == "list-append" && o == this.dragdata.host)
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
            action, (candrop[0] == o.xmlRoot),
            srcO.isDragAllowed(this.dragdata.selection), e);
        this.dragdata.resultNode = rNode;
        
        //REQUIRED INTERFACE: __dragdrop()
        if (o && o.$dragdrop)
            o.$dragdrop(el, this.dragdata, candrop);
        
        //Reset Cursor
        //o.oExt.style.cursor = "default";
        this.last = null;
    },
    
    /* **********************
        Mouse Movements
    ***********************/
    
    onmousemove : function(e){
        if (!jpf.DragServer.dragdata) return;
        if (!e) e = event;
        var dragdata = jpf.DragServer.dragdata;
        
        if (!dragdata.started
          && Math.abs(jpf.DragServer.coordinates.clientX - e.clientX) < 6
          && Math.abs(jpf.DragServer.coordinates.clientY - e.clientY) < 6) 
            return;
        
        if (!dragdata.started) {
            if (dragdata.host.$dragstart)
                dragdata.host.$dragstart(null, dragdata);
            dragdata.started = true;
        }
            
        //get Element at x, y
        dragdata.indicator.style.display = "block";
        if (dragdata.indicator)
            dragdata.indicator.style.top = "10000px";

        jpf.DragServer.dragdata.x = e.clientX + document.documentElement.scrollLeft;
        jpf.DragServer.dragdata.y = e.clientY + document.documentElement.scrollTop;
        var el = document.elementFromPoint(jpf.DragServer.dragdata.x,
            jpf.DragServer.dragdata.y);
        
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
        if(!e) e = event;
        
        if (!jpf.DragServer.dragdata.started
          && Math.abs(jpf.DragServer.coordinates.clientX - e.clientX) < 6
          && Math.abs(jpf.DragServer.coordinates.clientY - e.clientY) < 6) {
            jpf.DragServer.stop(true)
            return;
        }
        
        //get Element at x, y
        var indicator = jpf.DragServer.dragdata.indicator;
        if (indicator)
            indicator.style.top = "10000px";
        
        jpf.DragServer.dragdata.x = e.clientX+document.documentElement.scrollLeft;
        jpf.DragServer.dragdata.y = e.clientY+document.documentElement.scrollTop;
        var el = document.elementFromPoint(jpf.DragServer.dragdata.x,
            jpf.DragServer.dragdata.y);
        
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

jpf.Init.addConditional(function(){jpf.DragServer.Init();}, null, 'jpf');

// #endif
