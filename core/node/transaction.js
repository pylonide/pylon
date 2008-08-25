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

__TRANSACTION__ = 1 << 3;

// #ifdef __WITH_TRANSACTION

/**
 * Baseclass adding Transaction features to this Component.
 * Transactions are needed when a set of databound components change
 * data and these changes need to be approved or cancelled afterwards.
 * A good example is a property window with an OK and Cancel button. The
 * change should only be applied when OK is pressed. Because the components
 * bound to the data, will change the data immediately, Transaction 
 * forks the data before any change is made using the {@link #startTransaction} method. 
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
    
    this.__regbase = this.__regbase|__TRANSACTION__;
    var jmlNode    = this;
    var addParent, transactionNode, mode, originalNode;
    
    /* ********************************************************************
                                        ACTIONS
    *********************************************************************/
    
    /**
     * Adds or Updates data loaded in this component based on a previously
     * forked copy of template data.
     *
     * @action
     * @todo  check what's up with actiontracker usage... 
     * @bug  when a commit is cancelled using the onbeforecommit event, the state of the component becomes undefined
     */
    this.commit = function(){
        if (!this.inTransaction) return;
        
        //This should be move to after action has been executed
        this.__ActionTracker.purge();
        this.inTransaction = false;
        
        if (mode == "add") {
            //Use ActionTracker :: this.xmlData.selectSingleNode("DataBinding/@select") ? o.XMLRoot : o.selected
            this.executeAction("appendChildNode", [addParent, transactionNode],
                "add", transactionNode);//o.selected || 
        }
        else {
            //Reverse
            if(this.hasFeature(__MULTISELECT__))
                XMLDatabase.replaceChild(transactionNode, originalNode);
        
            //Use ActionTracker
            //getTraverseParent(o.selected) || o.XMLRoot
            var at = this.__ActionTracker;
            this.__ActionTracker = self[this.jml.getAttribute("actiontracker")];//this.dataParent.parent.getActionTracker();
            this.executeAction("replaceNode", [originalNode, transactionNode],
                "update", transactionNode);
            this.__ActionTracker = at;
    
            if (!this.hasFeature(__MULTISELECT__)) //isn't this implicit?
                this.load(transactionNode);
        }
    }
    
    /**
     * Rolls back the started transaction for changing the data of this component.
     *
     * @action
     * @bug When there is no rollback action is defined. A Transaction can never be rolled back. This is incorrect behaviour
     */
    this.rollback = function(){
        if (!this.inTransaction) return;
        
        return this.executeAction(function(){
            if (this.__ActionTracker) {
                if (this.rpcMode == "realtime")
                    this.__ActionTracker.undo(-1);
                this.__ActionTracker.reset();
            }
            //this.XMLDatabase.reset();
    
            //Cleanup
            if (this.hasFeature(__MULTISELECT__)) {
                if (mode == "add")
                    XMLDatabase.removeNode(transactionNode);
                else
                    XMLDatabase.replaceChild(transactionNode, originalNode);
            }
            else {
                if (!this.XMLRoot.parentNode)
                    this.load(originalNode);
            }
            
            this.inTransaction = false;
        }, null, "rollback", originalNode);
    }

    /**
     * Starts a transaction for this component. This forks the currently 
     * bound data and allows for changes to be made which can later be
     * disgarded or committed.
     *
     * @action
     */
    this.startTransaction = function(transMode){
        //#ifdef __DEBUG
        if (this.inTransaction)
            throw new Error(0, jpf.formatErrorString(0, this, "Starting Transaction", "Cannot start a transaction without committing or rolling back previously started transaction.", this.oldRoot));
        //#endif
            
        this.inTransaction = true;
        mode               = transMode || "update";
        transactionNode    = null;
        addParent          = null;
        
        if (mode != "add" && this.hasFeature(__MULTISELECT__) && !this.selected)
            return;
        
        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif
        
        function startTransaction(){
            if (mode == "add") {
                //#ifdef __DEBUG
                if (!transactionNode)
                    throw new Error(0, jpf.formatErrorString(0, this, "Starting transaction", "Could not get a new node to add"));
                //#endif
                
                if (this.hasFeature(__MULTISELECT__)) {
                    if (!addParent) {
                        if (this.isTreeArch)
                            addParent = this.selected || this.XMLRoot;
                        else
                            addParent = this.XMLRoot;
                    }
                    
                    //Add node without going through actiontracker
                    jpf.XMLDatabase.appendChildNode(addParent, transactionNode);
                    this.select(transactionNode); //select node to notify all other elements to bind to it
                }
                else {
                    if (!addParent) {
                        if (this.dataParent) {
                            var p = this.dataParent.parent;
                            if (p.isTreeArch)
                                addParent = p.selected || p.XMLRoot;
                            else
                                addParent = p.XMLRoot;
                        }
                        else
                            addParent = this.XMLRoot.parentNode;
                    }
                    
                    this.load(transactionNode);
                }
            }
            else {
                originalNode    = this.hasFeature(__MULTISELECT__)
                    ? this.selected
                    : this.XMLRoot;
                transactionNode = originalNode.cloneNode(true);//XMLDatabase.clearConnections(this.XMLRoot.cloneNode(true));
                //xmlNode.removeAttribute(XMLDatabase.xmlIdTag);
                
                //rename listening attributes
                
                if (this.hasFeature(__MULTISELECT__)) {
                    //Replace node without going through actiontracker
                    XMLDatabase.replaceNode(originalNode, transactionNode);
                    this.select(transactionNode);
                }
                else {
                    this.load(transactionNode);
                }
            }
        }
        
        if (mode == "add") {
            var node = this.actionRules["add"];
            if (!node || !node[0])
                throw new Error(0, jpf.formatErrorString(0, this, "Add Action", "Could not find Add Node"));
            
            var callback = function(addXmlNode, state, extra){
                if (state != __HTTP_SUCCESS__) {
                    if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries)
                        return extra.tpModule.retry(extra.id);
                    else {
                        var commError = new Error(0, jpf.formatErrorString(0, jmlNode, "Retrieving add node", "Could not add data for control " + jmlNode.name + "[" + jmlNode.tagName + "] \nUrl: " + extra.url + "\nInfo: " + extra.message + "\n\n" + xmlNode));
                        if (jmlNode.dispatchEvent("onerror", jpf.extend(
                          {error : commError, state : status}, extra)) !== false)
                            throw commError;
                        return;
                    }
                }
                
                if (typeof addXmlNode != "object")
                    addXmlNode = jpf.getObject("XMLDOM", addXmlNode).documentElement;
                if (addXmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag))
                    addXmlNode.setAttribute(jpf.XMLDatabase.xmlIdTag, "");
                
                var actionNode = jmlNode.getNodeFromRule("add", jmlNode.isTreeArch
                    ? jmlNode.selected
                    : jmlNode.XMLRoot, true, true);
                if (actionNode && actionNode.getAttribute("parent"))
                    addParent = jmlNode.XMLRoot.selectSingleNode(actionNode.getAttribute("parent"));
                
                transactionNode = addXmlNode;
                
                jmlNode.executeAction(startTransaction, null, "starttransaction",
                    jmlNode.XMLRoot);
            }
            
            if (node.getAttribute("get"))
                return jpf.getData(node.getAttribute("get"), node, callback)
            else if (node.firstChild)
                return callback(jpf.compat.getNode(node, [0]).cloneNode(true), __HTTP_SUCCESS__);
        }
        else {
            this.executeAction(startTransaction, null, "starttransaction", this.XMLRoot);
        }
    }
    
    /**
     * @alias
     */
    this.add = function(){
        this.startTransaction("add");
    }

    if(this.hasFeature(__MULTISELECT__)){
        this.addEventListener("onbeforeselect", function(){
            if (this.inTransaction){
                return this.rollback();
            }
        });
        
        this.addEventListener("onafterselect", function(){
            this.startTransaction();
        });
    }
}

/**
 * @constructor
 * @baseclass
 */
jpf.EditTransaction = function(){
    this.ok = function(){
        if (this.apply()) 
            this.close();
    }
    
    this.apply = function(){
        if (this.validgroup && this.validgroupd.isValid()) {
            this.commit();
            return true;
        }
        return false;
    }
    
    this.cancel = function(){
        this.rollback();
        this.close();
    }
    
    this.__load = function(XMLRoot) {
        if (this.inTransaction)
            this.rollback();
        jpf.XMLDatabase.addNodeListener(XMLRoot, this);
    }
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (this.inTransaction) {
            this.dispatchEvent("ontransactionconflict", {
                action : action,
                xmlNode: xmlNode,
                UndoObj: UndoObj
            });
        }
    }
    
    this.addEventListener("ondisplay", function(){
        if (!this.validgroup && this.jml && this.jml.getAttribute("validgroup")) 
            this.validgroup = self[this.jml.getAttribute("validgroup")];
            
        if (!this.mode && this.jml) 
            this.mode = this.jml.getAttribute("mode") || "add";
        
        this.startTransaction(this.mode);
    });
    
    this.addEventListener("onclose", function(){
        if (this.inTransaction) this.rollback();
    });
}

// #endif
