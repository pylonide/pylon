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

//#ifdef __WITH_ACTIONTRACKER || __WITH_DATAACTION
/**
 * Default actions, that are known to the actiontracker
 * @todo test if the .extra speed impact matters
 * @todo ifdef the undo sections to only be there when the actiontracker is enabled
 * @private
 */
apf.actiontracker.actions = {
    "setTextNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Text Node
        if (!undo)
            apf.xmldb.setTextNode(q[0], q[1], q[2], UndoObj);
        else //Undo Text Node Setting
            apf.xmldb.setTextNode(q[0], UndoObj.extra.oldValue, q[2]);
    },

    "setAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Attribute
        if (!undo) {
            //Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.setAttribute(q[0], q[1], q[2], q[3], UndoObj);
        }
        // Undo Attribute Setting
        else {
            if (!UndoObj.extra.oldValue)
                apf.xmldb.removeAttribute(q[0], q[1]);
            else
                apf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[3]);
        }
    },

    "removeAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Remove Attribute
        if (!undo) {
            // Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.removeAttribute(q[0], q[1], q[2], UndoObj);
        }
        //Undo Attribute Removal
        else
            apf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[2]);
    },

    "replaceNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Set Attribute
        if (!undo)
            apf.xmldb.replaceNode(q[1], q[0], q[2], UndoObj);
        //Undo Attribute Setting
        else
            apf.xmldb.replaceNode(q[0], q[1], q[2], UndoObj);
    },

    "addChildNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Add Child Node
        if (!undo)
            apf.xmldb.addChildNode(q[0], q[1], q[2], q[3], UndoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(UndoObj.extra.addedNode);
    },

    "appendChild" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Append Child Node
        if (!undo)
            apf.xmldb.appendChild(q[0], q[1], q[2], q[3], q[4], UndoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(UndoObj.xmlNode);//q[1]
    },

    "moveNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Move Node
        if (!undo)
            apf.xmldb.moveNode(q[0], q[1], q[2], q[3], UndoObj);
        //Move Node to previous position
        else
            apf.xmldb.moveNode(UndoObj.extra.oldParent, q[1],
                UndoObj.extra.beforeNode, q[3]);
    },

    "removeNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Remove Node
        if (!undo)
            apf.xmldb.removeNode(q[0], q[1], UndoObj);
        //Append Child Node
        else
            apf.xmldb.appendChild(UndoObj.extra.parent,
                UndoObj.extra.removedNode, UndoObj.extra.beforeNode);
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "removeNodeList" : function(UndoObj, undo){
        if (undo) {
            var d = UndoObj.extra.removeList;
            for (var i = d.length - 1; i >= 0; i--) {
                apf.xmldb.appendChild(d[i].pNode,
                    d[i].removedNode, d[i].beforeNode);
            }
        }
        else
            apf.xmldb.removeNodeList(UndoObj.args, UndoObj);
    },

    "group" : function(UndoObj, undo, at){
        if (!UndoObj.$undostack) {
            var done = UndoObj.args[0];
            UndoObj.$undostack = done;
            UndoObj.$redostack = [];
        }

        at[undo ? "undo" : "redo"](UndoObj.$undostack.length, false,
            UndoObj.$undostack, UndoObj.$redostack);
    },
    
    /*"setProperty" : function(UndoObj, undo){
        var q = UndoObj.args;//amlNode, name, value

        if (!undo) {
            UndoObj.extra.oldValue = q[0][q[1]];
            q[0].setProperty(q[1], q[2], q[3], q[4]);
        }
        // Undo 
        else {
            q[0].setProperty(q[1], UndoObj.extra.oldValue);
        }
    },*/
    
    "setValueByXpath" : function(UndoObj, undo){
        var newNode, q = UndoObj.args;//xmlNode, value, xpath
        
        // Setting NodeValue and creating the node if it doesnt exist
        if (!undo) {
            if (newNode = UndoObj.extra.newNode) {
                if (newNode.nodeType == 2) {
                    apf.xmldb.setAttribute(UndoObj.extra.ownerElement, 
                      newNode.nodeName, newNode.nodeValue);
                    UndoObj.extra.newNode = UndoObj.extra.ownerElement
                      .getAttributeNode(newNode.nodeName);
                }
                else
                    apf.xmldb.appendChild(UndoObj.extra.parentNode, UndoObj.extra.newNode);
            }
            else {
                var newNodes = [];
                apf.setNodeValue(q[0], q[1], true, {
                    undoObj  : UndoObj,
                    xpath    : q[2],
                    newNodes : newNodes,
                    forceNew : q[3]
                });
    
                newNode = UndoObj.extra.newNode = newNodes[0];
                if (newNode.nodeType == 2)
                    UndoObj.extra.ownerElement = newNode.ownerElement 
                      || newNode.selectSingleNode("..");
                else
                    UndoObj.extra.parentNode = UndoObj.extra.newNode.parentNode;
            }
        }
        // Undo Setting NodeValue
        else {
            if (newNode = UndoObj.extra.newNode) {
                if (newNode.nodeType == 2)
                    apf.xmldb.removeAttribute(UndoObj.extra.ownerElement, 
                      newNode.nodeName);
                else
                    apf.xmldb.removeNode(UndoObj.extra.newNode);
            }
            else
                apf.setNodeValue(UndoObj.extra.appliedNode, UndoObj.extra.oldValue, true);
        }
    },

    //@todo please change .func to .action for constency reasons
    "multicall" : function(UndoObj, undo, at){
        var q = UndoObj.args;

        var dUpdate = apf.xmldb.delayUpdate;
        apf.xmldb.delayUpdate = true;

        // Set Calls
        if (!undo) {
            for(var i = 0; i < q.length; i++) {
                if (!q[i].extra)
                    q[i].extra = {};
                //#ifdef __WITH_RDB
                if (q[0].rdbModel)
                    q[i].rdbQueue = q[0].rdbQueue;
                //#endif
                apf.actiontracker.actions[q[i].action](q[i], false, at);
            }
            //#ifdef __WITH_RDB
            if (q[0].rdbModel) {
                UndoObj.rdbModel = q[0].rdbModel;
                UndoObj.rdbQueue = q[0].rdbQueue;
            }
            //#endif
        }
        // Undo Calls
        else {
            for (var i = q.length - 1; i >= 0; i--)
                apf.actiontracker.actions[q[i].action](q[i], true, at);
        }

        apf.xmldb.delayUpdate = dUpdate;

        //if (!dUpdate)
            //apf.xmldb.notifyQueued();
    }
};

//#endif