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

var __TRANSACTION__ = 1 << 3;

// #ifdef __WITH_TRANSACTION

/**
 * Baseclass adding transaction features to this element. A transaction is a 
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
 * see {@link locking}.
 * <code>
 *  <j:list id="lstItems" onafterchoose="winMail.startUpdate()">
 *      <j:bindings>
 *          <j:caption select="name" />
 *          <j:icon value="icoItem.png" />
 *          <j:traverse select="item" />
 *      </j:bindings>
 *      <j:model>
 *          <items>
 *              <item name="test" subject="subject">
 *                  message
 *              </item>
 *          </items>
 *      </j:model>
 *  </j:list>
 *  
 *  <j:actions id="actTrans">
 *      <j:add set="rpc:comm.addItem({name}, {subject}, {message})">
 *          <item name="New Item" />
 *      </j:add>
 *      <j:update 
 *          set="rpc:comm.update({@id}, {name}, {subject}, {message})" 
 *          lock="rpc:comm.getLock({@id})" />
 *  </j:actions>
 *  
 *  <j:button onclick="winMail.startAdd();">add new item</j:button>
 *  
 *  <j:window id="winMail" 
 *    actions    = "actTrans" 
 *    model      = "#lstItems"
 *    validgroup = "vgItems">
 *      <j:label>Name</j:label>
 *      <j:textbox ref="@name" required="true" />
 *
 *      <j:label>Subject</j:label>
 *      <j:textbox ref="@subject" />
 *
 *      <j:label>Message</j:label>
 *      <j:textarea ref="text()" min-length="100" />
 *      
 *      <j:button action="ok" default="true">OK</j:button>
 *      <j:button action="cancel">Cancel</j:button>
 *      <j:button action="apply">Apply</j:button>
 *  </j:window>
 * </code>
 *
 * @constructor
 * @advanced
 * @experimental this code has never been executed
 * @baseclass
 *
 * @event transactionconflict Fires when data in a transaction is being updated by an external process.
 * @action add     adds data to the current dataset using transactions. see {@link multiselect#add}
 * @action update  updates existent data using transactions.
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8.9
 */
jpf.Transaction = function(){
    this.$regbase = this.$regbase|__TRANSACTION__;
    var _self     = this;

    var addParent, transactionNode, mode, originalNode;

    /**
     * Commits a started transaction. This will trigger an update or add action.
     * forked copy of template data.
     *
     * @todo  check what's up with actiontracker usage... 
     * @bug  when a commit is cancelled using the onbeforecommit event, the 
     * state of the element becomes undefined.
     */
    this.commitTransaction = function(){
        if (!this.inTransaction) return;
        
        //This should be move to after action has been executed
        this.$at.purge();
        this.inTransaction = false;
        
        if (mode == "add") {
            //Use ActionTracker :: this.xmlData.selectSingleNode("DataBinding/@select") ? o.xmlRoot : o.selected
            this.executeAction("appendChild", [addParent, transactionNode],
                "add", transactionNode);//o.selected || 
        }
        else {
            //Reverse
            if(this.hasFeature(__MULTISELECT__))
                jpf.xmldb.replaceChild(transactionNode, originalNode);
        
            //Use ActionTracker
            //getTraverseParent(o.selected) || o.xmlRoot
            var at = this.$at;
            this.$at = self[this.$jml.getAttribute("actiontracker")];//this.dataParent.parent.getActionTracker();
            
            this.executeAction("replaceNode", [originalNode, transactionNode],
                "update", transactionNode);

            this.$at = at;
    
            if (!this.hasFeature(__MULTISELECT__)) //isn't this implicit?
                this.load(transactionNode);
        }
    };
    
    /**
     * Rolls back the started transaction.
     * @bug When there is no rollback action is defined. A Transaction can never 
     * be rolled back. This is incorrect behaviour.
     */
    this.rollbackTransaction = function(){
        if (!this.inTransaction) return;
        
        if (this.$at) {
            if (this.rpcMode == "realtime")
                this.$at.undo(-1);

            this.$at.reset();
        }
        //this.xmldb.reset();

        //Cleanup
        if (this.hasFeature(__MULTISELECT__)) {
            if (mode == "add")
                jpf.xmldb.removeNode(transactionNode);
            else
                jpf.xmldb.replaceChild(transactionNode, originalNode);
        }
        else if (!this.xmlRoot.parentNode)
            this.load(originalNode);
        
        this.$stopAction(mode, true);
        
        //@todo hook in here to close the window
        
        this.inTransaction = false;
    };

    /**
     * Starts a transaction for this element. This is either an add or update.
     * @param {String} transMode the type of transaction to start
     *   Possible values:
     *   add    the transaction is started to add a new data element.
     *   update the transaction is started to update an existing data element.
     */
    this.beginTransaction = function(transMode){
        //#ifdef __DEBUG
        if (this.inTransaction) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Starting Transaction", 
                "Cannot start a transaction without committing or rolling \
                 back previously started transaction.", this.oldRoot));
        }
        //#endif

        if (mode != "add" && this.hasFeature(__MULTISELECT__) && !this.selected)
            return false;
        
        mode            = transMode || "update";
        transactionNode = null;
        addParent       = null;
        
        //@todo this.selected is not right, because this is the container. It
        //should be the item that is referenced by the model set on this 
        //container
        if(!this.$startAction(mode, this.selected, this.rollback))
            return false;
            
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.canTransact())
            return false;
        //#endif

        this.inTransaction = true;
        
        function beginTransaction(){
            if (mode == "add") {
                //#ifdef __DEBUG
                if (!transactionNode) {
                    throw new Error(jpf.formatErrorString(0, this, 
                        "Starting transaction", 
                        "Could not get a new node to add"));
                }
                //#endif
                
                if (this.hasFeature(__MULTISELECT__)) {
                    if (!addParent) {
                        if (this.isTreeArch)
                            addParent = this.selected || this.xmlRoot;
                        else
                            addParent = this.xmlRoot;
                    }
                    
                    //Add node without going through actiontracker
                    jpf.xmldb.appendChild(addParent, transactionNode);
                    this.select(transactionNode); //select node to notify all other elements to bind to it
                }
                else {
                    if (!addParent) {
                        if (this.dataParent) {
                            var p = this.dataParent.parent;
                            if (p.isTreeArch)
                                addParent = p.selected || p.xmlRoot;
                            else
                                addParent = p.xmlRoot;
                        }
                        else
                            addParent = this.xmlRoot.parentNode;
                    }
                    
                    this.load(transactionNode);
                }
            }
            else {
                originalNode    = this.hasFeature(__MULTISELECT__)
                    ? this.selected
                    : this.xmlRoot;
                transactionNode = originalNode.cloneNode(true);//xmldb.clearConnections(this.xmlRoot.cloneNode(true));
                //xmlNode.removeAttribute(xmldb.xmlIdTag);
                
                //rename listening attributes
                
                if (this.hasFeature(__MULTISELECT__)) {
                    //Replace node without going through actiontracker
                    jpf.xmldb.replaceNode(originalNode, transactionNode);
                    this.select(transactionNode);
                }
                else {
                    this.load(transactionNode);
                }
            }
        }
        
        if (mode == "add") {
            var node = this.actionRules["add"];
            
            //#ifdef __DEBUG
            if (!node || !node[0]) {
                throw new Error(jpf.formatErrorString(0, this,
                    "Add Action", "Could not find Add Node"));
            }
            //#endif
            
            //#ifdef __WITH_OFFLINE
            if (!jpf.offline.onLine && !node.getAttribute("get"))
                return false;
            //#endif
            
            var callback = function(addXmlNode, state, extra){
                if (state != jpf.SUCCESS) {
                    var oError;
                    
                    //#ifdef __DEBUG
                    oError = new Error(jpf.formatErrorString(0, _self, 
                        "Retrieving add node", 
                        "Could not add data for control " + _self.name 
                        + "[" + _self.tagName + "] \nUrl: " + extra.url 
                        + "\nInfo: " + extra.message + "\n\n" + xmlNode));
                    //#endif
                    
                    if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;
                    
                    throw oError;
                }
                
                if (typeof addXmlNode != "object")
                    addXmlNode = jpf.getXmlDom(addXmlNode).documentElement;
                if (addXmlNode.getAttribute(jpf.xmldb.xmlIdTag))
                    addXmlNode.setAttribute(jpf.xmldb.xmlIdTag, "");
                
                var actionNode = _self.getNodeFromRule("add", _self.isTreeArch
                    ? _self.selected
                    : _self.xmlRoot, true, true);
                    
                if (actionNode && actionNode.getAttribute("parent"))
                    addParent = _self.xmlRoot
                        .selectSingleNode(actionNode.getAttribute("parent"));
                
                transactionNode = addXmlNode;
                beginTransaction.call(_self);
            }
            
            if (node.getAttribute("get"))
                return jpf.getData(node.getAttribute("get"), node, null, callback)
            else if (node.firstChild)
                return callback(jpf.getNode(node, [0]).cloneNode(true), jpf.SUCCESS);
        }
        else {
            beginTransaction.call(this);
        }
    };

    /*
     * @todo
     *      transaction="true" OR actions="" OR smartbinding=""
     *      winMultiEdit.show(); //in the case it already has a model #blah, most likely
     *      for always visible components, 'load' should also signal a transaction start, unload triggers event
     *      autoset model="#id-or-generated-id" (remove model and set it)
     *      autoshow="true" --> will autohide as well
     *      create actiontracker based on data id, destroy actiontracker on cancel/commit
     *      Multiple transactions can exist at the same time in the same container, but on different data
     *      .cancel(xmlNode) .apply(xmlNode)
     *      .list(); // returns a list of all started transactions
     *      Add undo/redo methods to winMultiEdit
     *      Route undolength/redolength properties
     *      Setting replaceat="start" or replaceat="end"
     *      winMultiEdit.load(e.dataNode); //will start transaction automatically
     *      winMultiEdit.startAdd(e.dataNode, xpath); //xpath might not exist yet
     *      winMultiEdit.startUpdate(e.dataNode, xpath); //become inherited model, xpath might not exist yet
     *      compare to this.add multiselect
     */

    /**
     * Applies the changes and closes this element.
     */
    this.ok = function(){
        if (this.apply()) 
            this.close();
    };
    
    /**
     * Applies the changes.
     */
    this.apply = function(){
        if (this.$validgroup && this.$validgroup.isValid()) {
            this.commitTransaction();
            
            /*
                Since we are not closing the window here, 
                a new transaction request should be filed
            */
            this.beginTransaction();
            
            return true;
        }
        
        return false;
    };
    
    /**
     * Cancels all changes and closes this element.
     */
    this.cancel = function(){
        this.rollbackTransaction();
        this.close();
    };
    
    /**
     * Starts a new transaction for adding a data element and shows this element.
     */
    this.startAdd = function(xmlNode){
        this.xmlRoot = xmlNode;
        this.cancel();
        this.mode = "add";
        this.beginTransaction(this.mode);
    }
    
    /**
     * Starts a new transaction for updating a data element and shows this element.
     */
    this.startUpdate = function(xmlNode){
        this.xmlRoot = xmlNode;
        this.cancel();
        this.mode = "update";
        this.beginTransaction(this.mode);
    }
    
    this.$load = function(XMLRoot) {
        if (this.inTransaction)
            this.rollbackTransaction();

        jpf.xmldb.addNodeListener(XMLRoot, this);
    };
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (this.inTransaction) {
            this.dispatchEvent("transactionconflict", {
                action : action,
                xmlNode: xmlNode,
                UndoObj: UndoObj,
                bubbles : true
            });
        }
    };
    
    this.addEventListener("display", function(){
        //This might require some tweaking
        if (!this.mode && this.$jml) {
            this.mode = this.$jml.getAttribute("mode") || this.actionRule && 
                (this.actionRules.add ? "add" : 
                    (this.actionRules.update ? "update" : "add"));
        }
        
        if (this.mode == "update")
            this.startUpdate();
        else
            this.startAdd();
    });
    
    this.addEventListener("close", function(){
        if (this.inTransaction) 
            this.rollbackTransaction();
    });
    
    //Init
    if (!this.$jml || !this.$jml.getAttribute("validgroup")) 
        this.$validgroup = new jpf.ValidationGroup(value);
    
    this.$validgroup.add(this);
};

// #endif
