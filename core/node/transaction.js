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
 * Baseclass adding Transaction features to this Component.
 * Transactions are needed when a set of databound components change
 * data and these changes need to be approved or cancelled afterwards.
 * A good example is a property window with an OK and Cancel button. The
 * change should only be applied when OK is pressed. Because the components
 * bound to the data, will change the data immediately, Transaction 
 * forks the data before any change is made using the {@link #beginTransaction} method. 
 * When OK is pressed, {@link #commit} should be called to merge back 
 * the forked data. When Cancel is pressed {@link #rollback} should be called; 
 * data is not merged, and the situation remains unchanged. 
 * <p>
 * This class takes care of proper ActionTracker handling and can call
 * stacked RPC calls when merging the data. Use the features from this
 * class to implement locking mechanism for your collaborative applications.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8.9
 */
jpf.Transaction = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    this.$regbase = this.$regbase|__TRANSACTION__;
    var _self     = this;

    var addParent, transactionNode, mode, originalNode;
    
    /* ********************************************************************
                                        ACTIONS
    *********************************************************************/
    
    /**
     * Adds or Updates data loaded in this component based on a previously
     * forked copy of template data.
     *
     * @action add
     * @action update
     * @todo  check what's up with actiontracker usage... 
     * @bug  when a commit is cancelled using the onbeforecommit event, the state of the component becomes undefined
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
     * Rolls back the started transaction for changing the data of this component.
     * @bug When there is no rollback action is defined. A Transaction can never be rolled back. This is incorrect behaviour
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
     * Starts a transaction for this component. This forks the currently 
     * bound data and allows for changes to be made which can later be
     * disgarded or committed.
     * Example:
     * <pre class="code">
     *     <j:add set="rpc:comm.addThing(xpath:.)" />
     *     <j:update set="rpc:comm.updateThing(xpath:@name, xpath:@id)" lock="rpc:comm.lockThing(xpath:@id)" />
     * </pre>
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
                    addParent = _self.xmlRoot.selectSingleNode(actionNode.getAttribute("parent"));
                
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
    
    /**
     * @alias
     */
    this.add = function(){
        this.beginTransaction("add");
    };

    if (this.hasFeature(__MULTISELECT__)){
        this.addEventListener("beforeselect", function(){
            if (this.inTransaction){
                return this.rollbackTransaction();
            }
        });
        
        this.addEventListener("afterselect", function(){
            this.beginTransaction();
        });
    }
};

/**
 * @constructor
 * @baseclass
 */
jpf.EditTransaction = function(){
    this.ok = function(){
        if (this.apply()) 
            this.close();
    };
    
    this.apply = function(){
        if (this.$validgroup && this.$validgroupd.isValid()) {
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
    
    this.cancel = function(){
        this.rollbackTransaction();
        this.close();
    };
    
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
        if (!this.$validgroup && this.$jml && this.$jml.getAttribute("validgroup")) 
            this.$validgroup = self[this.$jml.getAttribute("validgroup")];
            
        if (!this.mode && this.$jml) 
            this.mode = this.$jml.getAttribute("mode") || "add";
        
        this.beginTransaction(this.mode);
    });
    
    this.addEventListener("close", function(){
        if (this.inTransaction) 
            this.rollbackTransaction();
    });
};

// #endif
