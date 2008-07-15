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

// #ifdef __WITH_APP

/**
 * Component keeping track of all user actions that
 * are triggered in components that are registered
 * to this component. This component allows for undo &
 * redo of the specified actions, whilst being aware
 * of the datasynchronization with a backend data store.
 *
 * @classDescription		This class creates a new actiontracker
 * @return {ActionTracker} Returns a new actiontracker
 * @type {ActionTracker}
 * @constructor
 * @addnode smartbinding:actiontracker, global:actiontracker
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.ActionTracker = function(context){
    jpf.makeClass(this);
    
    this.realtime   = true;
    this.hasChanged = false;
    //this.root = (me == self.main);
    //if(!this.root) 
    
    this.getParentAT = function(){
        if (context) 
            return context.getActionTracker(true);
        else 
            return (self.ActionTracker && self.ActionTracker != this)
                ? self.ActionTracker
                : null;//me.parentWindow ? jpf.window.parentWindow.ActionTracker : 
    }
    
    this.actions     = {};
    this.stackDone   = new Array();
    this.stackUndone = new Array();
    this.stackRPC    = new Array();
    
    /* ********************************************************************
     API
     *********************************************************************/
    this.define = function(action, func){
        this.actions[action] = func;
    }
    
    this.execute = function(action, args, xmlActionNode, jmlNode, selNode){
        this.hasChanged = true;
        if (this.onchange && this.onchange() === false) 
            return;
        
        //Execute action
        var UndoObj = new jpf.UndoData(action, xmlActionNode, args, jmlNode, selNode);
        if (action) 
            (typeof action == "function"
                ? action
                : this.actions[action])(UndoObj, false, this);
        
        //Add action to stack
        var id      = UndoObj.id = this.stackDone.push(UndoObj) - 1;
        this.lastId = id;
        
        //Respond
        UndoObj.saveChange(null, this);
        
        //Reset Redo Stack
        this.stackUndone.length = 0;
        
        //return stack id of action
        return id;
    }
    
    this.addActionGroup = function(done, rpc){
        var UndoObj = new jpf.UndoData("group", null, [
            jpf.copyArray(done, UndoData), jpf.copyArray(rpc, UndoData)
        ]);
        this.stackDone.push(UndoObj);
        
        this.hasChanged = true;
        if (this.onchange) 
            this.onchange();
    }
    
    this.purge = function(nogrouping, forcegrouping){
        var prnt = this.getParentAT();
        
        if (nogrouping && prnt) {
            //if(!forcegrouping && this.parent){
            var hash = {}, ids = [];
            
            //Execute RPC calls through multicall or queued calling
            for (var i = 0; i < this.stackRPC.length; i++) {
                var o = this.stackRPC[i].saveChange(null, this, true);
                hash[o.uniqueId] = o;
                ids.push(this.stackRPC[i].id);
            }
            
            //Purge & Remove Multicall Force
            for (prop in hash) {
                if (typeof prop == "number") {
                    hash[prop].purge(receive, ids);
                    hash[prop].force_multicall = false;
                }
            }
            
            //if (jpf.XMLDatabase.socket) 
                //jpf.XMLDatabase.socket.purge();
        }
        else 
            if (prnt) {
                //else if(!nogrouping){
                //Copy Stacked Actions as a single grouped action to parent ActionTracker
                prnt.addActionGroup(this.stackDone, this.stackRPC);
            }
        
        //Reset Stacks
        this.reset();
    }
    
    this.reset = function(){
        //Reset Stacks
        this.stackDone.length = this.stackUndone.length = this.stackRPC.length = 0;
        
        this.hasChanged = false;
        if (this.onchange) 
            this.onchange(true);
        /* could set start of changed to x and check if different above */
    }
    
    //TODO: merge undo and redo
    this.undo = function(id, single, stackDone, stackUndone, rollBack){
        if (!stackDone)
            stackDone = this.stackDone;
        if (!stackUndone)
            stackUndone = this.stackUndone;
        
        if (!stackDone.length) return;
        
        if (single) {
            var UndoObj = stackDone[id];
            if (!UndoObj) return;
            
            //Workaround for calls coming in late...
            if (id == stackDone.length - 1) 
                stackDone.length--;
            else 
                stackDone[id] = null;
            
            //Undo Client Side Action
            if (UndoObj.action) 
                (typeof UndoObj.action == "function"
                    ? UndoObj.action
                    : this.actions[UndoObj.action])(UndoObj, true, this);
            
            //Respond - REMOVED.. shouldn't be called during undo
            if (!rollBack)
                UndoObj.saveChange(true, this); // WHY NOT??? seems the right place....
            
            //Set Changed Value
            if (!stackDone.length)
                this.hasChanged = false; //doesn't matter for recursion (up)
            
            return UndoObj;
        }
        
        //#ifdef __STATUS
        jpf.status("Executing undo");
        //#endif
        
        //Undo the last X places - where X = id;
        var i = 0;
        if (id == -1)
            id = stackDone.length;
        if (!id)
            id = 1;
        
        while (i < id && stackDone.length > 0) {
            if (!stackDone[stackDone.length - 1]) 
                stackDone.length--;
            else {
                stackUndone.push(this.undo(stackDone.length - 1, true, stackDone,
                    stackUndone));
                i++;
            }
        }
        
        if (this.onchange) 
            this.onchange(true);
    }
    
    this.redo = function(id, single, stackDone, stackUndone, rollBack){
        if (!stackDone) 
            stackDone = this.stackDone;
        if (!stackUndone) 
            stackUndone = this.stackUndone;
        
        if (!stackUndone.length) 
            return;
        if (single) {
            //var UndoObj = stackUndone.pop();
            //if(!UndoObj) return;
            
            var UndoObj = stackUndone[id];
            if (!UndoObj) 
                return;
            
            //Workaround for calls coming in late... (prolly not needed for redo)
            if (id == stackUndone.length - 1) 
                stackUndone.length--;
            else 
                stackUndone[id] = null;
            
            //Undo Client Side Action
            if (UndoObj.action) 
                (typeof UndoObj.action == "function"
                ? UndoObj.action
                : this.actions[UndoObj.action])(UndoObj, false, this);
            
            //Respond - REMOVED.. shouldn't be called during redo
            if (!rollBack) 
                UndoObj.saveChange(false, this); // WHY NOT??? seems the right place....
            //this.stackDone.push(UndoObj);
            this.hasChanged = true;
            
            return UndoObj;
        }
        
        //#ifdef __STATUS
        jpf.status("Executing redo");
        //#endif
        
        //Redo the last X places - where X = id;
        var i = 0;
        if (id == -1) id = stackUndone.length;
        if (!id) id = 1;
        
        while (i < id && stackUndone.length > 0) {
            if (!stackUndone[stackUndone.length - 1]) 
                stackUndone.length--;
            else {
                stackDone.push(this.redo(stackUndone.length - 1, true,
                    stackDone, stackUndone));
                i++;
            }
        }
        
        if (this.onchange) 
            this.onchange();
    }
    
    /* ********************************************************************
     OTHER
     *********************************************************************/
    this.receive = function(data, state, extra, ids){
        if (state != __HTTP_SUCCESS__) {
            if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries) 
                return extra.tpModule.retry(extra.id);
            else {
                var commError = new Error(1028, jpf.formErrorString(1028, null, "ActionTracker", "Could not sent Action RPC request for control " + this.name + "[" + this.tagName + "] \n\n" + extra.message));
                if (this.dispatchEvent("onerror", jpf.extend({
                    error: commError,
                    state: status
                }, extra)) !== false) 
                    throw commError;
                return;
            }
        }
        
        //hack!!
        if (data && data.nodeType && data.selectSingleNode("//undo")) {
            //SDU hacking
            var msg = jpf.getXmlValue(data, "//undo/reason") + "\n";
            var nodes = data.selectNodes("//undo/object");
            for (var i = 0; i < nodes.length; i++) {
                msg += "- " + nodes[i].getAttribute("name") + "\n";
            }
            data = msg;
        }
        else 
            return;
        
        /*if(data){
         //Get Undo Node
         var UndoObj = this.stackDone[ids];
         var xmlActionNode = UndoObj.getActionXmlNode();
         
         //Get Result Node
         if(xmlActionNode.getAttribute("result")){
         var rNode = UndoObj.xmlNode.selectSingleNode(xmlActionNode.getAttribute("result"));
         //Attribute Node - fill
         if(rNode.nodeType == 2) rNode.nodeValue = data;
         
         //Other Node - replace
         else{
         xmlNode = jpf.getObject("XMLDOM", data).documentElement.firstChild;
         rNode.parentNode.replaceChild(xmlNode ,rNode);
         }
         
         jpf.XMLDatabase.applyChanges("synchronize", UndoObj.xmlNode);
         }
         
         return;
         }*/
        if (typeof ids == "number") 
            return this.doError(data, ids);
        
        for (var i = 0; i < ids.length; i++) 
            this.doError(data[i], ids[i]);
    }
    
    this.doError = function(data, id){
        //Alert reason for denying access
        if (data) 
            alert(data);
        
        //Undo failed actions
        //this.undo(id, true);
        this.undo(id, true, null, null, true);
    }
    
    /* ********************************************************************
     BUILD-IN ACTIONS
     *********************************************************************/
    // #ifdef __WITH_APP || __WITH_XMLDATABASE
    
    this.define("setTextNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        // Set Text Node
        if (!undo) 
            jpf.XMLDatabase.setTextNode(q[0], q[1], q[2], UndoObj);
        else //Undo Text Node Setting
            jpf.XMLDatabase.setTextNode(q[0], UndoObj.oldValue, q[2]);
    });
    
    this.define("setAttribute", function(UndoObj, undo){
        var q = UndoObj.args;
        
        // Set Attribute
        if (!undo) {
            //Set undo info
            UndoObj.name = q[1];
            UndoObj.oldValue = q[0].getAttribute(q[1]);
            
            jpf.XMLDatabase.setAttribute(q[0], q[1], q[2], q[3], UndoObj);
        }
        // Undo Attribute Setting
        else {
            if (!UndoObj.oldValue) 
                jpf.XMLDatabase.removeAttribute(q[0], q[1]);
            else 
                jpf.XMLDatabase.setAttribute(q[0], q[1], UndoObj.oldValue, q[3]);
        }
    });
    
    this.define("removeAttribute", function(UndoObj, undo){
        var q = UndoObj.args;
        
        // Remove Attribute
        if (!undo) {
            // Set undo info
            UndoObj.name = q[1];
            UndoObj.oldValue = q[0].getAttribute(q[1]);
            
            jpf.XMLDatabase.removeAttribute(q[0], q[1], q[2], UndoObj);
        }
        //Undo Attribute Removal
        else
            jpf.XMLDatabase.setAttribute(q[0], q[1], UndoObj.oldValue, q[2]);
    });
    
    /**
     * @deprecated Use "multicall" from now on
     */
    this.define("setAttributes", function(UndoObj, undo){
        var prop, q = UndoObj.args;
        
        // Set Attribute
        if (!undo) {
            // Set undo info
            var oldValues = {};
            for (prop in q[1]) {
                oldValues[prop] = q[0].getAttribute(prop);
                q[0].setAttribute(prop, q[1][prop]);
            }
            UndoObj.oldValues = oldValues;
            
            jpf.XMLDatabase.applyChanges("attribute", q[0], UndoObj);
        }
        //Undo Attribute Setting
        else {
            for (prop in UndoObj.oldValues) {
                if (!UndoObj.oldValues[prop]) 
                    q[0].removeAttribute(prop);
                else 
                    q[0].setAttribute(prop, UndoObj.oldValues[prop]);
            }
            
            jpf.XMLDatabase.applyChanges("attribute", q[0], UndoObj);
        }
    });
    
    this.define("replaceNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        //Set Attribute
        if (!undo) 
            jpf.XMLDatabase.replaceNode(q[0], q[1], q[2], UndoObj);
        //Undo Attribute Setting
        else 
            jpf.XMLDatabase.replaceNode(q[1], q[0], q[2]);
    });
    
    this.define("addChildNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        //Add Child Node
        if (!undo) 
            jpf.XMLDatabase.addChildNode(q[0], q[1], q[2], q[3], q[4], UndoObj);
        //Remove Child Node
        else 
            jpf.XMLDatabase.removeNode(UndoObj.addedNode);
    });
    
    this.define("appendChildNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        //Append Child Node
        if (!undo) 
            jpf.XMLDatabase.appendChildNode(q[0], q[1], q[2], q[3], q[4], UndoObj);
        //Remove Child Node
        else 
            jpf.XMLDatabase.removeNode(q[1]);
    });
    
    this.define("moveNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        //Move Node
        if (!undo) 
            jpf.XMLDatabase.moveNode(q[0], q[1], q[2], q[3], UndoObj);
        //Move Node to previous position
        else 
            jpf.XMLDatabase.moveNode(UndoObj.pNode, q[1], UndoObj.beforeNode, q[3]);
    });
    
    this.define("removeNode", function(UndoObj, undo){
        var q = UndoObj.args;
        
        //Remove Node
        if (!undo) 
            jpf.XMLDatabase.removeNode(q[0], q[1], UndoObj);
        //Append Child Node
        else 
            jpf.XMLDatabase.appendChildNode(UndoObj.pNode, UndoObj.removedNode, UndoObj.beforeNode);
    });
    
    this.define("removeNodeList", function(UndoObj, undo){
        if (undo) {
            var d = UndoObj.rData;
            for (var i = 0; i < d.length; i++) {
                jpf.XMLDatabase.appendChildNode(d[i].pNode, d[i].removedNode, d[i].beforeNode, UndoObj);
            }
        }
        else 
            jpf.XMLDatabase.removeNodeList(UndoObj.args);
        
    });
    
    this.define("setUndoObject", function(UndoObj, undo){
        var q = UndoObj.args;
        UndoObj.xmlNode = q[0];
    });
    
    this.define("group", function(UndoObj, undo, at){
        if (!UndoObj.stackDone) {
            var done = UndoObj.args[0];
            UndoObj.stackDone = done;
            UndoObj.stackUndone = [];
        }
        
        at[undo ? "undo" : "redo"](UndoObj.stackDone.length, false, UndoObj.stackDone, UndoObj.stackUndone);
    });
    
    this.define("setValueByXpath", function(UndoObj, undo){
        var q = UndoObj.args;//xmlNode, value, xpath
        // Setting NodeValue and creating the node if it doesnt exist
        if (!undo) {
            if (UndoObj.newNode) {
                var xmlNode = q[0].appendChild(UndoObj.newNode);
            }
            else {
                var newNodes = [];
                var xmlNode = jpf.XMLDatabase.createNodeFromXpath(q[0], q[2], newNodes);
                var node = newNodes[0] || xmlNode;
                
                UndoObj.newNode = node.nodeType == 1 ? node : null;
                if (UndoObj.newNode == q[0]) 
                    UndoObj.newNode = null;
                UndoObj.oldValue = jpf.getXmlValue(q[0], q[2]);
            }
            
            jpf.XMLDatabase.setNodeValue(xmlNode, q[1], true);
        }
        // Undo Setting NodeValue
        else {
            if (UndoObj.newNode) 
                jpf.XMLDatabase.removeNode(UndoObj.newNode);
            else 
                jpf.XMLDatabase.setNodeValue(q[0], UndoObj.oldValue, true);
        }
    });
    
    this.define("multicall",
        function(UndoObj, undo, at){
            var prop, q = UndoObj.args;

            // Set Calls
            if (!undo) {
                for(var i=0;i<q.length;i++)
                    at.actions[q[i].func](q[i], false, at);
            }
            // Undo Calls
            else {
                for (var i = 0; i < q.length; i++)
                    at.actions[q[i].func](q[i], true, at);
            }
        }
    );
    
    this.define("addRemoveNodes", function(UndoObj, undo){
        var q = UndoObj.args;
        
        // Set Text Node
        if (!undo) {
            // Add
            for (var i = 0; i < q[1].length; i++) 
                jpf.XMLDatabase.appendChildNode(q[0], q[1][i], null, null, null, UndoObj);
            // Remove
            for (var i = 0; i < q[2].length; i++) 
                jpf.XMLDatabase.removeNode(q[2][i], null, UndoObj);
        }
        // Undo Text Node Setting
        else {
            // Add
            for (var i = 0; i < q[2].length; i++) 
                jpf.XMLDatabase.appendChildNode(q[0], q[2][i]);
            // Remove
            for (var i = 0; i < q[1].length; i++) 
                jpf.XMLDatabase.removeNode(q[1][i]);
        }
    });
    
    //#endif
}

/**
 * @constructor
 */
jpf.UndoData = function(action, xmlActionNode, args, jmlNode, selNode){
    this.tagName = "UndoData";
    
    //Copy Constructor
    if (action && action.tagName == "UndoData") {
        this.action        = action.action;
        this.xmlActionNode = action.xmlActionNode;
        this.xmlNode       = action.xmlNode;
        this.args          = jpf.copyArray(action.args);
        this.rsb_args      = jpf.copyArray(action.rsb_args);
        this.rsb_model     = action.rsb_model;
        this.jmlNode       = jmlNode;
        this.selNode       = action.selNode;
    }
    //Constructor
    else {
        this.action        = action;
        this.xmlActionNode = xmlActionNode;
        this.args          = args;
        this.jmlNode       = jmlNode;
        
        //HACK! Please check the requirement for this and how to solve this. Goes wrong with multiselected actions!
        this.selNode = selNode 
            || (action == "removeNode"
                ? args[0]
                : (jmlNode ? jmlNode.selected : null));
    }
    
    this.getActionXmlNode = function(undo){
        if (!this.xmlActionNode)  return false;
        if (!undo) return this.xmlActionNode;
        
        var xmlNode = $xmlns(this.xmlActionNode, "undo", jpf.ns.jpf)[0];
        if (!xmlNode) 
            xmlNode = this.xmlActionNode;
        
        return xmlNode;
    }
    
    //PROCINSTR
    this.saveChange = function(undo, at, multicall){
        if (at && !at.realtime) 
            return at.stackRPC.push(this);
        
        if (typeof this.action == "function") 
            return;
        
        //Grouped undo/redo support
        if (this.action == "group") {
            var rpcNodes = this.args[1];
            for (var i = 0; i < rpcNodes.length; i++) 
                rpcNodes[i].saveChange(undo, at, multicall);

            return;
        }
        
        //Send RSB Data..
        if (this.rsb_args)
            this.rsb_model.rsb.sendChange(this.rsb_args, this.rsb_model);
        
        var id = this.id, xmlActionNode = this.getActionXmlNode(undo);
        if (!xmlActionNode) return;
        
        //Process Change - Currently only 1 ActionTracker PER Form is supported - UndoData NEEDS id
        jpf.saveData(xmlActionNode.getAttribute("set"), this.selNode,
            function(data, state, extra){
                at.receive(data, state, extra, id);
            }, multicall);
    }
}

// #endif
