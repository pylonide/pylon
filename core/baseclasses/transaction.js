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

apf.__TRANSACTION__ = 1 << 3;

// #ifdef __WITH_TRANSACTION

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have transaction support. A transaction is a 
 * set of changes to data which are treated as one change. When one of the 
 * changes in the set fails, all the changes will be cancelled. In the case of
 * a gui this is mostly relevant when a user decides to cancel after 
 * making several changes. A good example are the well known property windows 
 * with an ok, cancel and apply button. 
 *
 * When a user edits data, for instance user information, all the changes are
 * seen as one edit and put on the undo stack as a single action. Thus clicking
 * undo will undo the entire transaction, not just the last change done by that
 * user in the edit window. Transaction support both optimistic and pessimistic 
 * locking. For more information on the latter see the first example below.
 * Example:
 * This example shows a list with one item. When double clicked on the item
 * a window shows that allows the user to edit the properties of this item.
 * When the window is closed the changes are committed to the xml data. If the
 * user presses cancel the changes are discarded. By pressing the 'add new item'
 * button the same window appears which allows the user to add a new item. All
 * changes made by the user are also sent to the original data source via 
 * rpc calls. When the user starts editing an existing item a lock is requested.
 * This is not necesary for transaction support, but this example shows that it
 * is possible. When the lock fails the window will close. By hooking the
 * 'lockfail' event the user can be notified of the reason. For more information 
 * see {@link term.locking}.
 * <code>
 *  <a:list 
 *    id            = "lstItems" 
 *    onafterchoose = "winEdit.show()" 
 *    width         = "200">
 *      <a:each match="[item]">
 *          <a:caption match="[@name]" />
 *          <a:icon value="icoItem.png" />
 *      </a:each>
 *      <a:actions>
 *          <a:add set="http://localhost/save.php?xml=%[.]">
 *              <item name="New Item" />
 *          </a:add>
 *          <a:update 
 *            set  = "http://localhost/save.php?xml=%[.]" 
 *            lock = "http://localhost/lock.php?id=[@id]" />
 *      </a:actions>
 *      <a:model>
 *          <items>
 *              <item name="test" subject="subject" id="1">message</item>
 *          </items>
 *      </a:model>
 *  </a:list>
 *      
 *  <a:button onclick="winEdit.begin('add');">Add new item</a:button>
 *       
 *  <a:window 
 *    width       = "300"
 *    id          = "winEdit" 
 *    transaction = "true"
 *    model       = "{lstItems.selected}"
 *    title       = "Edit this message">
 *      <a:label>Name</a:label>
 *      <a:textbox 
 *        value      = "[@name]" 
 *        required   = "true" 
 *        invalidmsg = "Please enter your name" />
 *      <a:label>Subject</a:label>
 *      <a:textbox value="[@subject]" />
 *    
 *      <a:label>Message</a:label>
 *      <a:textarea value="[text()]" min-length="100" />
 *      
 *      <a:button action="ok" default="true">OK</a:button>
 *      <a:button action="cancel">Cancel</a:button>
 *      <a:button action="apply" disabled="{!winEdit.undolength}">Apply</a:button>
 *   </a:window>
 * </code>
 *
 * @constructor
 * @baseclass
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 * 
 * @event transactionconflict Fires when data in a transaction is being updated by an external process.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8.9
 */
apf.Transaction = function(){
    this.$regbase = this.$regbase | apf.__TRANSACTION__;

    this.$addParent          =
    this.$transactionNode    =
    this.$transactionSubject =
    this.$originalNode       =
    this.$inTransaction      =
    this.$lastAction         = null;

    this.$supportedProperties.push("autoshow");
    
    /**
     * @attribute {Boolean} autoshow whether this element is shown when a transaction begins.
     */
    this.$booleanProperties["autoshow"] = true;

    /**
     * Commits a started transaction. This will trigger an update or add action.
     * forked copy of template data.
     *
     * @todo  check what's up with actiontracker usage... 
     * @bug  when a commit is cancelled using the onbeforecommit event, the 
     * state of the element becomes undefined.
     */
    this.commit = function(repeat){
        if (!this.$inTransaction)
            return false;

        if (!this.$validgroup && this.validgroup)
            this.$validgroup = self[this.validgroup];

        if (this.$validgroup && !this.$validgroup.isValid())
            return false;

        var returnValue = true;
        if (!this.$at.undolength) {
            if (repeat)
                return false;
            
            this.$at.purge();
            this.$inTransaction = false;
            
            this.load(this.$originalNode);
            this.$helperModel.reset();
            
            returnValue = false;
        }
        else {
            //#ifdef __DEBUG
            apf.console.info("Committing transaction on " + this.localName + "[" + this.name + "]");
            //#endif
            
            this.$at.reset();//purge();
            this.$inTransaction = false;
            
            //@todo recursive
            this.$transactionNode.removeAttribute(apf.xmldb.xmlListenTag)
            
            if (this.$lastAction == "add") {
                //Use ActionTracker :: this.xmlData.selectSingleNode("DataBinding/@select") ? o.xmlRoot : o.selected
                if (this.$transactionSubject.$executeAction("appendChild",
                  [this.$addParent, this.$transactionNode], "add", this.$transactionNode)
                  && this.$transactionSubject.hasFeature(apf.__MULTISELECT__)) {
                    this.$transactionSubject.select(this.$transactionNode);
                }
                
                this.$transactionSubject = null;
            }
            else {
                //Use ActionTracker
                //getTraverseParent(o.selected) || o.xmlRoot
                var at = this.$at;
                this.$at = this.dataParent 
                    ? this.dataParent.parent.getActionTracker()
                    : null;//self[this.getAttribute("actiontracker")];//this.dataParent.parent.getActionTracker();
                
                this.$transactionSubject.$executeAction("replaceNode", [this.$originalNode, this.$transactionNode],
                    "update", this.$transactionNode);
    
                this.$at = at;
        
                //this.load(this.$transactionNode);
            }
        }
        
        this.$transactionNode = null;
        this.$addParent       = null;
        this.$originalNode    = null;
        
        if (this.autoshow) {
            if (this.autoshow == -1)
                this.autoshow = true;
            else
                this.hide();
        }
        
        return returnValue;
    };
    
    /**
     * Rolls back the started transaction.
     */
    this.rollback = function(noLoad){
        if (!this.$inTransaction)
            return;
        
        //#ifdef __DEBUG
        apf.console.info("Rolling back transaction on " + this.localName + "[" + this.name + "]");
        //#endif
        
        if (this.$at) {
            if (this.rpcMode == "realtime")
                this.$at.undo(-1);

            this.$at.reset();
        }
        //this.xmldb.reset();
        
        this.$transactionNode = null; //prevent from restarting the transaction in load
        this.$addParent       = null;

        //Cleanup
        if (!noLoad)
            this.load(this.$originalNode);
        
        this.$helperModel.reset();
        
        this.$stopAction(this.$lastAction, true);
        
        this.$originalNode    = null;
        this.$inTransaction   = false;
        
        if (this.autoshow) {
            if (this.autoshow == -1)
                this.autoshow = true;
            else
                this.hide();
        }
    };

    /**
     * Starts a transaction for this element. This is either an add or update.
     * @param {String}     strAction the type of transaction to start
     *   Possible values:
     *   add    the transaction is started to add a new {@link term.datanode data node}.
     *   update the transaction is started to update an existing {@link term.datanode data node}.
     * @param {XMLElement} xmlNode 
     * @param {XMLElement} parentXmlNode 
     * @param {AMLElement} dataParent 
     */
    this.begin = function(strAction, xmlNode, parentXmlNode, dataParent){
        if (this.$inTransaction) {
            /*throw new Error(apf.formatErrorString(0, this, 
                "Starting Transaction", 
                "Cannot start a transaction without committing or rolling \
                 back previously started transaction.", this.oldRoot));*/
            
            //#ifdef __DEBUG
            apf.console.warn("Rolling back transaction, while starting a new one");
            //#endif
            
            if (this.autoshow)
                this.autoshow = -1;
            this.rollback();
        }

        //#ifdef __DEBUG
        apf.console.info("Beginning transaction on " + this.localName + "[" + this.name + "]");
        //#endif

        //Add should look at dataParent and take selection or xmlRoot
        //winMail.dataParent.parent.xmlRoot

        var _self = this;
        this.$lastAction = strAction;

        if (!this.$lastAction) {
            this.$lastAction = this.xmlRoot && "update" || "add";
                /*this.actionRules && (this.actionRules.add 
                ? "add"
                : (this.actionRules.update
                    ? "update" 
                    : null)) || this.xmlRoot && "update";*/
        }
        
        //#ifdef __DEBUG
        if (!this.$lastAction) {
            throw new Error(apf.formatErrorString(0, this, 
                "Starting Transaction", 
                "Could not determine whether to add or update."));
        }
        //#endif
        
        //Determines the actiontracker to integrate the grouped action into
        if (dataParent)
            this.$setDynamicProperty("model", "[" + dataParent.id + ".selected]"); //@todo what if it doesn't have an id

        if (xmlNode && this.$lastAction == "update") {
            this.xmlRoot = xmlNode;
            //this.$inTransaction = -1; //Prevent load from triggering a new transaction
            //this.load(xmlNode);
        }
        
        /*
         * @todo:
         *   create actiontracker based on data id, destroy actiontracker on cancel/commit - thus being able to implement editor feature natively
         *   Multiple transactions can exist at the same time in the same container, but on different data
         *   .cancel(xmlNode) .apply(xmlNode)
         *   .list(); // returns a list of all started transactions
         *   Add undo/redo methods to winMultiEdit
         *   Route undolength/redolength properties
         *   Setting replaceat="start" or replaceat="end"
         */
        if (!this.$at) {
            this.$at  = new apf.actiontracker();
            var propListen = function(e){
                _self.setProperty(e.prop, e.value);
            };
            this.$at.addEventListener("prop.undolength", propListen);
            this.setProperty("undolength", 0);
            this.$at.addEventListener("prop.redolength", propListen);
            this.setProperty("redolength", 0);
        }
        if (!this.$helperModel) {
            this.$helperModel = new apf.model();
            this.$helperModel["save-original"] = true;
            this.$helperModel.load("<data />");
        }

        this.$transactionNode = null;
        this.$addParent       = null;
        this.$originalNode    = this.xmlRoot;

        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.canTransact())
            return false;
        //#endif

        this.$inTransaction = true;
        function begin(){
            //#ifdef __DEBUG
            if (!this.$transactionNode) {
                throw new Error(apf.formatErrorString(0, this, 
                    "Starting transaction", 
                    "Missing transaction node. Cannot start transaction. \
                     This error is unrecoverable."));
            }
            //#endif

            this.$inTransaction = -1;
            this.$helperModel.data.appendChild(this.$transactionNode);//apf.xmldb.cleanNode());
            this.load(this.$helperModel.data.firstChild);
            this.$inTransaction = true;
            
            if (this.disabled)
                this.enable();
            
            if (this.autoshow) {
                if (this.autoshow == -1)
                    this.autoshow = true;
                else
                    this.show();
            }
        }
        
        //Determine data parent
        dataParent = this.dataParent && this.dataParent.parent;
        
        if (!dataParent || !dataParent.$actions 
          || !dataParent.$actions[this.$lastAction]) {
            dataParent = this;
        }
        
        //Add
        if (this.$lastAction == "add") {
            //Check for add rule on data parent
            var rule, actionRules = dataParent.$actions;
            if (actionRules) {
                if (xmlNode && xmlNode.nodeType)
                    rule = actionRules.getRule("add", xmlNode);
                else if (typeof xmlNode == "string") {
                    if (xmlNode.trim().charAt(0) == "<") {
                        xmlNode = apf.getXml(xmlNode);
                        rule = actionRules.getRule("add", xmlNode)
                    }
                    else {
                        var rules = actionRules.$rules["add"];
                        for (var i = 0, l = rules.length; i < l; i++) {
                            if (rules[i].getAttribute("type") == xmlNode) {
                                xmlNode = null;
                                rule = rules[i];
                                break;
                            }
                        }
                    }
                }
    
                if (!rule) 
                    rule = (dataParent.$actions["add"] || {})[0];
            }
            else
                rule = null;
            
            //#ifdef __WITH_OFFLINE
            if (typeof apf.offline != "undefined" && !apf.offline.onLine
              && !rule.get)
                return false;
            //#endif
            
            //Run the add code (copy from multiselect) but don't add until commit
            var refNode  = this.$isTreeArch ? this.selected || this.xmlRoot : this.xmlRoot;
            var callback = function(addXmlNode, state, extra){
                if (state != apf.SUCCESS) {
                    var oError;
    
                    oError = new Error(apf.formatErrorString(1032, dataParent,
                        "Loading xml data",
                        "Could not add data for control " + dataParent.name
                        + "[" + dataParent.tagName + "] \nUrl: " + extra.url
                        + "\nInfo: " + extra.message + "\n\n" + xmlNode));
    
                    if (extra.tpModule.retryTimeout(extra, state, dataParent, oError) === true)
                        return true;
    
                    throw oError;
                }
                
                /*if (apf.supportNamespaces && node.namespaceURI == apf.ns.xhtml) {
                    node = apf.getXml(node.xml.replace(/xmlns\=\"[^"]*\"/g, ""));
                    //@todo import here for webkit?
                }*/

                if (typeof addXmlNode != "object")
                    addXmlNode = apf.getXmlDom(addXmlNode).documentElement;
                if (addXmlNode.getAttribute(apf.xmldb.xmlIdTag))
                    addXmlNode.setAttribute(apf.xmldb.xmlIdTag, "");
    
                if (!dataParent.$startAction("add", addXmlNode, _self.rollback))
                    return false;
    
                var actionNode = (dataParent.$actions && 
                  dataParent.$actions.getRule("add", dataParent.$isTreeArch
                    ? dataParent.selected
                    : dataParent.xmlRoot) || {})[2];
                
                if (parentXmlNode) {
                    _self.$addParent = parentXmlNode;
                }
                else if (actionNode && actionNode.getAttribute("parent")) {
                    _self.$addParent = dataParent.xmlRoot
                        .selectSingleNode(actionNode.getAttribute("parent"));
                }
                else {
                    _self.$addParent = dataParent.$isTreeArch
                        ? dataParent.selected || dataParent.xmlRoot
                        : dataParent.xmlRoot
                }
    
                if (!_self.$addParent)
                    _self.$addParent = dataParent.xmlRoot || dataParent.getModel(true).data;
    
                if (apf.isWebkit && _self.$addParent.ownerDocument != addXmlNode.ownerDocument)
                    addXmlNode = _self.$addParent.ownerDocument.importNode(addXmlNode, true); //Safari issue not auto importing nodes
    
                _self.$transactionNode    = addXmlNode;
                _self.$transactionSubject = dataParent;
                begin.call(_self);
            }

            if (xmlNode)
                return callback(xmlNode, apf.SUCCESS);
            else {
                if (rule && rule.get)
                    return apf.getData(rule.get, {xmlNode: refNode, callback: callback})
                else {
                    //#ifdef __DEBUG
                    throw new Error(apf.formatErrorString(0, this,
                        "Starting transaction", 
                        "Missing add rule for transaction"));
                    //#endif
                }
            }
        }
        
        //Update
        else {
            if (!dataParent.$startAction(this.$lastAction, this.xmlRoot, this.rollback))
                return false;

            this.$transactionSubject = dataParent;
            this.$transactionNode    = this.$originalNode.cloneNode(true);//xmldb.cleanNode(this.xmlRoot.cloneNode(true));
            //xmlNode.removeAttribute(xmldb.xmlIdTag);
            
            //@todo rename listening attributes
            begin.call(this);
        }
    };
    
    //Transaction nodes can always load data
    this.$canLoadData = function(){
        return true;
    }

    //Prevent model inheritance to the children
    this.addEventListener("prop.model", function(e){
        return false;
    });
    
    //Prevent clear dynamic
    this.clear = function(){
        this.documentId = this.xmlRoot = this.cacheId = null;
    }

    //No need to restart the transaction when the same node is loaded
    this.addEventListener("beforeload", function(e){
        var xmlNode = e.xmlNode;
        
        //@todo apf3.0 test if this can be enabled again
        //if (this.$originalNode == xmlNode)
            //return false;
        
        if (this.$inTransaction == -1)
            return;

        if (this.$inTransaction) {
            if (this.$transactionNode && xmlNode != this.$transactionNode) {
                if (this.autoshow)
                    this.autoshow = -1;
                
                this.rollback(true);
            }
            else return;
        }

        if (this.autoshow)
            this.autoshow = -1;
            
        if (this.begin("update", xmlNode) !== false)
            return false;
    });
     
    //hmm really?
    //@todo what to do here? check original cloned node???
    /*this.addEventListener("xmlupdate", function(e){
        if (this.$inTransaction) {
            this.dispatchEvent("transactionconflict", {
                action : e.action,
                xmlNode: e.xmlNode,
                UndoObj: e.UndoObj,
                bubbles : true
            });
        }
    });*/
    
    //@todo add when not update???
    /*this.watch("visible", function(id, oldval, newval){
        if (!this.xmlRoot || oldval == newval)
            return;
        
        if (newval) {
            if (!this.$inTransaction)
                this.begin();
        }
        else {
            if (this.$inTransaction) 
                this.rollback();
        }
    });*/
}

/**
 * @attribute {Boolean} transaction Whether this element provides transaction
 * support for all it's children.
 * @see baseclass.transaction
 */
apf.GuiElement.propHandlers["transaction"] = function(value){
    if (!(this.transaction = apf.isTrue(value)))
        return;

    if (!this.hasFeature(apf.__DATABINDING__))
        this.implement(apf.StandardBinding);

    if (!this.hasFeature(apf.__DATAACTION__)) {
        this.implement(apf.DataAction);

        if (this.actions)
            this.$propHandlers["actions"].call(this, this.actions, "actions");
    }
     
    if (!this.hasFeature(apf.__TRANSACTION__)) {
        this.implement(apf.Transaction);
        
        if (!this.validgroup) {
            this.$validgroup = new apf.ValidationGroup();
            this.$validgroup.register(this);
        }
        
        if (!this.id)
            this.setProperty("id", this.localName + "_" + this.$uniqueId);
        
        var attr = this.attributes.getNamedItem("model");
        if (!attr)  //@todo find a way to not have to add a model
            this.attributes.push(attr = new apf.AmlAttr(this, "model", null));
        attr.inheritedValue = "{" + this.id + ".root}";
                
        if (typeof this.autoshow == "undefined" 
          && (this.localName == "modalwindow" || this.localName == "window"))
            this.autoshow = true;
    }
}

// #endif