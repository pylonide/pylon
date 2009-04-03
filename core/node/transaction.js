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
 * see {@link term.locking}.
 * <pre class="code">
 *  <j:list id="lstItems" onafterchoose="winEdit.show()">
 *      <j:bindings>
 *          <j:caption select="name" />
 *          <j:icon value="icoItem.png" />
 *          <j:traverse select="item" />
 *      </j:bindings>
 *      <j:actions>
 *          <j:add set="url:save.php?xml={.}">
 *              <item name="New Item" />
 *          </j:add>
 *          <j:update 
 *              set="url:save.php?xml={.}" 
 *              lock="url:lock.php?id={@id}" />
 *      </j:actions>
 *      <j:model>
 *          <items>
 *              <item name="test" subject="subject">
 *                  message
 *              </item>
 *          </items>
 *      </j:model>
 *  </j:list>
 *  
 *  <j:button onclick="winMail.begin('add');">add new item</j:button>
 *  
 *  <j:window id="winEdit" 
 *    transaction = "true"
 *    model       = "#lstItems"
 *    title       = "Edit this message">
 *      <j:label>Name</j:label>
 *      <j:textbox ref="@name" required="true" 
 *        invalidmsg="Please enter your name" />
 *
 *      <j:label>Subject</j:label>
 *      <j:textbox ref="@subject" />
 *
 *      <j:label>Message</j:label>
 *      <j:textarea ref="text()" min-length="100" />
 *      
 *      <j:button action="ok" default="true">OK</j:button>
 *      <j:button action="cancel">Cancel</j:button>
 *      <j:button action="apply" 
 *        disabled="{!winEdit.undolength}">Apply</j:button>
 *  </j:window>
 * </pre>
 *
 * @constructor
 * @baseclass
 *
 * @event transactionconflict Fires when data in a transaction is being updated by an external process.
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8.9
 */
jpf.Transaction = function(){
    this.$regbase = this.$regbase|__TRANSACTION__;
    var _self     = this;

    var addParent, transactionNode, originalNode, inTransaction, lastAction;

    this.$supportedProperties.push("autoshow");
    
    /**
     * @attribute {Boolean} autoshow whether this element is shown when an transaction begins.
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
    this.commit = function(){
        if (!inTransaction) 
            return false;

        if (this.$validgroup && !this.$validgroup.isValid())
            return false;
        
        var returnValue = true;
        if (!this.$at.undolength) {
            this.$at.purge();
            inTransaction = false;
            
            this.load(originalNode);
            
            returnValue = false;
        }
        else {
            //#ifdef __DEBUG
            jpf.console.info("Committing transaction on " + this.tagName + "[" + this.name + "]");
            //#endif
            
            this.$at.reset();//purge();
            inTransaction = false;
            
            if (lastAction == "add") {
                //Use ActionTracker :: this.xmlData.selectSingleNode("DataBinding/@select") ? o.xmlRoot : o.selected
                if (transactionSubject.executeAction("appendChild", 
                  [addParent, transactionNode], "add", transactionNode)) {
                    transactionSubject.select(transactionNode);
                }
                
                transactionSubject = null;
            }
            else {
                //Use ActionTracker
                //getTraverseParent(o.selected) || o.xmlRoot
                var at = this.$at;
                this.$at = this.dataParent 
                    ? this.dataParent.parent.getActionTracker()
                    : null;//self[this.$jml.getAttribute("actiontracker")];//this.dataParent.parent.getActionTracker();
                
                transactionSubject.executeAction("replaceNode", [originalNode, transactionNode],
                    "update", transactionNode);
    
                this.$at = at;
        
                //this.load(transactionNode);
            }
        }
        
        transactionNode = null;
        addParent       = null;
        originalNode    = null;
        
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
        if (!inTransaction) 
            return;
        
        //#ifdef __DEBUG
        jpf.console.info("Rolling back transaction on " + this.tagName + "[" + this.name + "]");
        //#endif
        
        if (this.$at) {
            if (this.rpcMode == "realtime")
                this.$at.undo(-1);

            this.$at.reset();
        }
        //this.xmldb.reset();
        
        transactionNode = null; //prevent from restarting the transaction in load
        addParent       = null;

        //Cleanup
        if (!noLoad)
            this.load(originalNode);
        
        this.$stopAction(lastAction, true);
        
        originalNode    = null;
        inTransaction   = false;
        
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
     *   add    the transaction is started to add a new data element.
     *   update the transaction is started to update an existing data element.
     * @param {XMLElement} xmlNode 
     * @param {JMLElement} dataParent 
     */
    this.begin = function(strAction, xmlNode, dataParent){
        if (inTransaction) {
            /*throw new Error(jpf.formatErrorString(0, this, 
                "Starting Transaction", 
                "Cannot start a transaction without committing or rolling \
                 back previously started transaction.", this.oldRoot));*/
            
            //#ifdef __DEBUG
            jpf.console.warn("Rolling back transaction, while starting a new one");
            //#endif
            
            if (this.autoshow)
                this.autoshow = -1;
            this.rollback();
        }
        
        //#ifdef __DEBUG
        jpf.console.info("Beginning transaction on " + this.tagName + "[" + this.name + "]");
        //#endif

        //Add should look at dataParent and take selection or xmlRoot
        //winMail.dataParent.parent.xmlRoot

        lastAction = strAction;

        if (!lastAction) {
            lastAction = this.xmlRoot && "update" || "add";
                /*this.actionRules && (this.actionRules.add 
                ? "add"
                : (this.actionRules.update
                    ? "update" 
                    : null)) || this.xmlRoot && "update";*/
        }
        
        //#ifdef __DEBUG
        if (!lastAction) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Starting Transaction", 
                "Could not determine wether to add or update."));
        }
        //#endif
        
        //Determines the actiontracker to integrate the grouped action into
        if (dataParent)
            dataParent.connect(this);

        if (xmlNode && lastAction == "update") {
            this.xmlRoot = xmlNode;
            //inTransaction = -1; //Prevent load from triggering a new transaction
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
            this.$at = new jpf.actiontracker();
            var propListen = function(name, oldvalue, newvalue){
                _self.setProperty(name, newvalue);
            };
            this.$at.watch("undolength", propListen);
            this.$at.watch("redolength", propListen);
        }

        transactionNode = null;
        addParent       = null;
        originalNode    = this.xmlRoot;

        //#ifdef __WITH_OFFLINE
        if (typeof jpf.offline != "undefined" && !jpf.offline.canTransact())
            return false;
        //#endif

        inTransaction = true;
        function begin(){
            //#ifdef __DEBUG
            if (!transactionNode) {
                throw new Error(jpf.formatErrorString(0, this, 
                    "Starting transaction", 
                    "Missing transaction node. Cannot start transaction. \
                     This error is unrecoverable."));
            }
            //#endif
            
            this.inTransaction = -1;
            this.load(transactionNode);
            this.inTransaction = true;
            
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
        var node, dataParent = this.dataParent 
          && this.dataParent.parent || this;
        
        //Add
        if (lastAction == "add") {
            //Check for add rule on data parent
            var actionRules = dataParent.actionRules;
            if (actionRules) {
                if (xmlNode && xmlNode.nodeType)
                    node = dataParent.getNodeFromRule("add", xmlNode, true);
                else if (typeof xmlNode == "string") {
                    if (xmlNode.trim().charAt(0) == "<") {
                        xmlNode = jpf.getXml(xmlNode);
                        node = dataParent.getNodeFromRule("add", xmlNode, true);
                    }
                    else {
                        var rules = actionRules["add"];
                        for (var i = 0, l = rules.length; i < l; i++) {
                            if (rules[i].getAttribute("type") == xmlNode) {
                                xmlNode = null;
                                node = rules[i];
                                break;
                            }
                        }
                    }
                }
    
                if (!node && actionRules["add"])
                    node = actionRules["add"][0];
            }
            else
                node = null;
            
            //#ifdef __DEBUG
            if (!node) { // || !node[0]
                throw new Error(jpf.formatErrorString(0, this,
                    "Starting transaction", 
                    "Missing add rule for transaction"));
            }
            //#endif
            
            //#ifdef __WITH_OFFLINE
            if (typeof jpf.offline != "undefined" && !jpf.offline.onLine
              && !node.getAttribute("get"))
                return false;
            //#endif
            
            //Run the add code (copy from multiselect) but don't add until commit
            var refNode  = this.isTreeArch ? this.selected || this.xmlRoot : this.xmlRoot;
            var callback = function(addXmlNode, state, extra){
                if (state != jpf.SUCCESS) {
                    var oError;
    
                    //#ifdef __DEBUG
                    oError = new Error(jpf.formatErrorString(1032, dataParent,
                        "Loading xml data",
                        "Could not add data for control " + dataParent.name
                        + "[" + dataParent.tagName + "] \nUrl: " + extra.url
                        + "\nInfo: " + extra.message + "\n\n" + xmlNode));
                    //#endif
    
                    if (extra.tpModule.retryTimeout(extra, state, dataParent, oError) === true)
                        return true;
    
                    throw oError;
                }

                if (typeof addXmlNode != "object")
                    addXmlNode = jpf.getXmlDom(addXmlNode).documentElement;
                if (addXmlNode.getAttribute(jpf.xmldb.xmlIdTag))
                    addXmlNode.setAttribute(jpf.xmldb.xmlIdTag, "");
    
                if (!dataParent.$startAction("add", addXmlNode, _self.rollback))
                    return false;
    
                var actionNode = dataParent.getNodeFromRule("add", dataParent.isTreeArch
                    ? dataParent.selected
                    : dataParent.xmlRoot, true, true);
                    
                if (actionNode && actionNode.getAttribute("parent")) {
                    addParent = dataParent.xmlRoot
                        .selectSingleNode(actionNode.getAttribute("parent"));
                }
                else {
                    addParent = dataParent.isTreeArch
                        ? dataParent.selected || dataParent.xmlRoot
                        : dataParent.xmlRoot
                }
    
                if (!addParent)
                    addParent = dataParent.xmlRoot;
    
                if (jpf.isSafari && addParent.ownerDocument != addXmlNode.ownerDocument)
                    addXmlNode = addParent.ownerDocument.importNode(addXmlNode, true); //Safari issue not auto importing nodes
    
                transactionNode    = addXmlNode;
                transactionSubject = dataParent;
                begin.call(_self);
            }
    
            if (xmlNode)
                return callback(xmlNode, jpf.SUCCESS);
            else {
                //#ifdef __DEBUG
                if (!node) {
                    throw new Error(jpf.formatErrorString(0, this,
                        "Executing add action",
                        "Missing add action defined in action rules. Unable to \
                         perform action."));
                }
                //#endif
    
                if (node.getAttribute("get"))
                    return jpf.getData(node.getAttribute("get"), refNode, null, callback)
                else if (node.firstChild) {
                    var node = jpf.getNode(node, [0]);
                    if (jpf.supportNamespaces && node.namespaceURI == jpf.ns.xhtml) {
                        node = jpf.getXml(node.xml.replace(/xmlns\=\"[^"]*\"/g, ""));
                        //@todo import here for webkit?
                    }
                    else node = node.cloneNode(true);
                    
                    return callback(node, jpf.SUCCESS);
                }
            }
        }
        
        //Update
        else {
            if (!dataParent.$startAction(lastAction, this.xmlRoot, this.rollback))
                return false;
            
            transactionSubject = dataParent;
            transactionNode    = originalNode.cloneNode(true);//xmldb.clearConnections(this.xmlRoot.cloneNode(true));
            //xmlNode.removeAttribute(xmldb.xmlIdTag);
            
            //@todo rename listening attributes
            
            begin.call(this);
        }
    };

    //No need to restart the transaction when the same node is loaded
    this.addEventListener("beforeload", function(e){
        if (originalNode == e.xmlNode)
            return false;
        
        if (inTransaction == -1)
            return;

        if (inTransaction) {
            if (transactionNode && e.xmlNode != transactionNode) {
                if (this.autoshow)
                    this.autoshow = -1;
                
                this.rollback(true);
            }
            else return;
        }

        if (this.autoshow)
            this.autoshow = -1;
            
        this.begin("update", e.xmlNode);
        
        return false;
    });
     
    //hmm really?
    //@todo what to do here? check original cloned node???
    /*this.addEventListener("xmlupdate", function(e){
        if (inTransaction) {
            this.dispatchEvent("transactionconflict", {
                action : e.action,
                xmlNode: e.xmlNode,
                UndoObj: e.UndoObj,
                bubbles : true
            });
        }
    });*/
    
    //@todo add when not update???
    this.watch("visible", function(id, oldval, newval){
        if (!this.xmlRoot || oldval == newval)
            return;
        
        if (newval) {
            if (!inTransaction)
                this.begin();
        }
        else {
            if (inTransaction) 
                this.rollback();
        }
    });
    
    //Init
    if (!this.$jml || !this.$jml.getAttribute("validgroup")) {
        this.$validgroup = new jpf.ValidationGroup();
        this.$validgroup.add(this);
    }
    
    //autoset model="#id-or-generated-id"
    if (this.$jml) {
        if (!this.$model) {
            this.model = -1;
            if (this.$jml.getAttribute("model")) 
                this.setProperty("model", this.$jml.getAttribute("model"));
            this.$modelIgnoreOnce = true;
        }
            
        if (!this.name)
            this.setAttribute("id", "trAutoName" + this.uniqueId);
        this.$jml.setAttribute("model", "#" + this.name);
    }
    
    if (typeof this.autoshow == "undefined" && (this.tagName == "modalwindow" 
      || this.tagName == "window"))
        this.autoshow = true;
};

// #endif
