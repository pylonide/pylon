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

__DRAGDROP__ = 1 << 5;

// #ifdef __WITH_DRAGDROP

/**
 * Baseclass adding Drag&Drop features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.DragDrop = function(){
    this.__regbase = this.__regbase|__DRAGDROP__;
    
    /* **********************
            Actions	
    ***********************/
    
    /**
     * Copies a data node to the dataset of this component.
     *
     * @action
     * @param  {XMLNode}  pnode  optional  XML node specifying the parent node to which to copy the data node to. If none specified the root node of the data loaded in this component is used.
     * @param  {XMLNode}  xmlNode  required  XML data node which is copied.
     * @param  {XMLNode}  beforeNode  optional  XML node specifying the position where the data node is inserted.
     */
    this.Copy = function(pnode, xmlNode, beforeNode){
        var xmlNode = xmlNode.cloneNode(true);

        //Use Action Tracker
        var exec = this.executeAction("appendChild",
            [pnode, xmlNode, beforeNode], "copy", xmlNode);
        if (exec !== false)
            return xmlNode;

    }
    
    /**
     * Moves a data node to the dataset of this component.
     *
     * @action
     * @param  {XMLNode}  pnode  optional  XML node specifying the parent node to which to move the data node to. If none specified the root node of the data loaded in this component is used.
     * @param  {XMLNode}  xmlNode  required  XML data node which is copied.
     * @param  {XMLNode}  beforeNode  optional  XML node specifying the position where the data node is inserted.
     */
    this.Move = function(pnode, xmlNode, beforeNode){
        //Use Action Tracker
        var exec = this.executeAction("moveNode",
            [pnode, xmlNode, beforeNode], "move", xmlNode);
        if (exec !== false)
            return xmlNode;

    }
    
    /* **********************
        JML Integration
    ***********************/
    /*
        <j:actions>
            <j:Move select="" rpc="" arguments="" />
            <j:Copy select="" rpc="" arguments="" />
        </j:actions>
        <j:dragdrop allowed="allow.cur" denied="deny.cur">
            <j:allow-drag select="Person" copy-condition="event.ctrlKey" />
            <j:allow-drop select="self::Person" target="Company|Office" action="list-append" copy-condition="event.ctrlKey" />
            <j:allow-drop select="self::Offer" target="Person" action="tree-append" copy-condition="event.ctrlKey" />
        </j:dragdrop>
    */
    
    /**
     * Determines wether the user is allowed to drag the passed XML node.
     *
     * @param  {XMLNode}  xmlNode  required  XML node subjected to the test.
     * @return  {Boolean}  result of the test
     */
    this.isDragAllowed = function(x){
        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif
        
        if (!this.dragdropRules || this.disabled) return false;
        var rules = this.dragdropRules["allow-drag"];

        if (!rules || !rules.length || !x)
            return false;

        for (var i=0;i<rules.length;i++) {
            if (x.selectSingleNode(jpf.parseExpression(
              rules[i].getAttribute("select"))))
                return rules[i];//"self::" + 
        }
        
        return false;
    }
    
    /**
     * Determines wether the user is allowed to dropped the passed XML node.
     *
     * @param  {XMLNode}  xmlNode  required  XML node subjected to the test.
     * @return  {Boolean}  result of the test
     */
    this.isDropAllowed = function(x, target){
        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif
        
        if (!this.dragdropRules || this.disabled) return false;
        var rules = this.dragdropRules["allow-drop"];

        if (!rules || !rules.length || !target)
            return false;
        
        for (var i = 0; i < rules.length; i++) {
            var data = x.selectSingleNode(jpf.parseExpression(
                rules[i].getAttribute("select")));//"self::" + 
            
            if (!rules[i].getAttribute("target"))
                var tgt = target == this.XMLRoot ? target : null;
            else
                var tgt = target.selectSingleNode(rules[i].getAttribute("target"));//"self::" + 
            
            if (data && tgt && !jpf.xmldb.isChildOf(data, tgt, true))
                return [tgt, rules[i]];
        }
        
        return false;
    }
    
    this.__dragDrop = function(xmlReceiver, xmlNode, rule, defaction, isParent, srcRule, event){
        if (action == "tree-append" && isParent) return false;
        
        /*
            Possibilities:
            
            tree-append [default]: xmlNode.appendChild(movedNode);
            list-append          : xmlNode.parentNode.appendChild(movedNode);
            insert-before        : xmlNode.parentNode.insertBefore(movedNode, xmlNode);
        */
        var action = rule.getAttribute("operation") || defaction;
        var ifcopy = rule.getAttribute("copy-condition")
            ? eval(rule.getAttribute("copy-condition"))
            : false;
        if (!ifcopy)
            ifcopy = srcRule.getAttribute("copy-condition")
                ? eval(srcRule.getAttribute("copy-condition"))
                : false;
        var actRule = ifcopy ? 'Copy' : 'Move';

        switch (action) {
            case "list-append":
                var sNode = this[actRule](isParent ? xmlReceiver : xmlReceiver.parentNode, xmlNode);
                break;
            case "insert-before":
                var sNode = isParent
                    ? this[actRule](xmlReceiver, xmlNode)
                    : this[actRule](xmlReceiver.parentNode, xmlNode, xmlReceiver); 
                break;
            case "tree-append":
                var sNode = this[actRule](xmlReceiver, xmlNode);
                break;
        }

        if (this.selectable && sNode)
            this.select(sNode);
        
        return sNode;
    }
    
    /* **********************
            Init
    ***********************/

    var drag_inited;
    /**
     * Loads the dragdrop rules from the j:dragdrop element
     *
     * @param  {Array}  rules    required  the rules array created using {@link Kernel#getRules(xmlNode)}
     * @param  {XMLNode}  xmlNode  optional  reference to the j:dragdrop element
     * @see  SmartBinding
     */
    this.loadDragDrop = function(rules, node){
        jpf.console.info("Initializing Drag&Drop for " + this.tagName + "[" + (this.name || '') + "]");
        
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
            if (this.host.allowDeselect
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
            if (this.selectable && (!this.host.selected || el == this.host.XMLRoot) || !el)
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
        }
        
        this.oExt.onmouseup = function(){
            this.host.dragging = 0;
        }
        
        this.oExt.ondragmove = 
        this.oExt.ondragstart = function(){ return false; };
        
        if(document.elementFromPointAdd)
            document.elementFromPointAdd(this.oExt);

        if (this.__initDragDrop && (!rules || !drag_inited))
            this.__initDragDrop();
        drag_inited = true;
    }
    //this.addEventListener("onskinchange", this.loadDragDrop);
    
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
    }
}

jpf.DragServer = {
    Init : function(){
        jpf.DragMode.defineMode("dragdrop", this);
    },
    
    /* **********************
            API
    ***********************/
    
    start : function(host){
        if (document.elementFromPointReset)
            document.elementFromPointReset();
        
        //Create Drag Object
        var selection = host.selectable ? host.getSelection()[0] : host.XMLRoot; //currently only a single item is supported
        
        var srcRule = host.isDragAllowed(selection);
        if (!srcRule) return;
        var data = selection.selectSingleNode(srcRule.getAttribute("select"));//"self::" + 
        
        if (host.hasEventListener("ondragdata"))
            data = host.dispatchEvent("ondragdata", {data : data});

        this.dragdata = {
            selection : selection, 
            data      : data,
            indicator : host.__showDragIndicator(selection, this.coordinates),
            host      : host
        };

        //EVENT - cancellable: ondragstart
        if (host.dispatchEvent("ondragstart", this.dragdata) === false)
            return false;//(this.host.tempsel ? select(this.host.tempsel) : false);
        host.dragging = 2;

        jpf.DragMode.setMode("dragdrop");
    },
    
    stop : function(runEvent){
        if (this.last) this.dragout();
        
        //Reset Objects
        this.dragdata.host.dragging = 0;
        this.dragdata.host.__hideDragIndicator();
        
        //????EVENT: ondragstop
        //if(runEvent && this.dragdata.host.ondragstop) this.dragdata.host.ondragstop();
        
        jpf.DragMode.clear();
        this.dragdata = null;
    },
    
    m_out : function(){
        this.style.cursor = "default";
        if (this.__onmouseout)
            this.__onmouseout();
        this.onmouseout = this.__onmouseout || null;
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
        if (o.dispatchEvent("ondragover") === false)
            candrop = false;
        
        //Set Cursor
        var srcEl = e.originalTarget || e.srcElement;
        srcEl.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);
        if (srcEl.onmouseout != this.m_out) {
            srcEl.__onmouseout = srcEl.onmouseout;
            srcEl.onmouseout   = this.m_out;
        }
        //o.oExt.style.cursor = (candrop ? o.icoAllowed : o.icoDenied);
        
        //REQUIRED INTERFACE: __dragover()
        if (o && o.__dragover)
            o.__dragover(el, this.dragdata, candrop);
        
        this.last = o;
    },
    
    dragout : function(o){
        if (this.last == o) return false;
        
        //EVENT: ondragout
        if (o)
            o.dispatchEvent("ondragout");
        
        //REQUIRED INTERFACE: __dragout()
        if (this.last && this.last.__dragout)
            this.last.__dragout(null, this.dragdata);
        
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
            if (o.dispatchEvent("ondragdrop", jpf.extend({}, this.dragdata,
              {candrop : candrop})) === false)
                candrop = false;
            else {
                var action = candrop[1].getAttribute("operation") || "list-append";
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
        var rNode = o.__dragDrop(candrop[0], this.dragdata.data, candrop[1],
            action, (candrop[0] == o.XMLRoot),
            srcO.isDragAllowed(this.dragdata.selection), e);
        this.dragdata.resultNode = rNode;
        
        //REQUIRED INTERFACE: __dragdrop()
        if (o && o.__dragdrop)
            o.__dragdrop(el, this.dragdata, candrop);
        
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
            if (dragdata.host.__dragstart)
                dragdata.host.__dragstart(null, dragdata);
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
        dragdata.host.__moveDragIndicator(e);

        //get Node and call events
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
          && Math.abs(jpf.DragServer.coordinates.clientY - e.clientY) < 6) 
            return;
        
        //get Element at x, y
        var indicator = jpf.DragServer.dragdata.indicator;
        if (indicator)
            indicator.style.top = "10000px";
        
        jpf.DragServer.dragdata.x = e.clientX+document.documentElement.scrollLeft;
        jpf.DragServer.dragdata.y = e.clientY+document.documentElement.scrollTop;
        var el = document.elementFromPoint(jpf.DragServer.dragdata.x,
            jpf.DragServer.dragdata.y);
        
        //get Node and call events
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
}

jpf.Init.addConditional(function(){jpf.DragServer.Init();}, null, 'jpf');

// #endif
