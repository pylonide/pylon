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
    "setTextNode" : function(undoObj, undo){
        var q = undoObj.args;

        // Set Text Node
        if (!undo)
            apf.xmldb.setTextNode(q[0], q[1], q[2], undoObj);
        else //Undo Text Node Setting
            apf.xmldb.setTextNode(q[0], undoObj.extra.oldValue, q[2], undoObj);
    },

    "setAttribute" : function(undoObj, undo){
        var q = undoObj.args;

        // Set Attribute
        if (!undo) {
            //Set undo info
            undoObj.extra.name = q[1];
            undoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.setAttribute(q[0], q[1], q[2], q[3], undoObj);
        }
        // Undo Attribute Setting
        else {
            if (!undoObj.extra.oldValue)
                apf.xmldb.removeAttribute(q[0], q[1], null, undoObj);
            else
                apf.xmldb.setAttribute(q[0], q[1], undoObj.extra.oldValue, q[3], undoObj);
        }
    },

    "removeAttribute" : function(undoObj, undo){
        var q = undoObj.args;

        // Remove Attribute
        if (!undo) {
            // Set undo info
            undoObj.extra.name = q[1];
            undoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.removeAttribute(q[0], q[1], q[2], undoObj);
        }
        //Undo Attribute Removal
        else
            apf.xmldb.setAttribute(q[0], q[1], undoObj.extra.oldValue, q[2], undoObj);
    },

    "replaceNode" : function(undoObj, undo){
        var q = undoObj.args;

        //Set Attribute
        if (!undo)
            apf.xmldb.replaceNode(q[0], q[1], q[2], undoObj);
        //Undo Attribute Setting
        else
            apf.xmldb.replaceNode(q[1], q[0], q[2], undoObj);
    },

    "addChildNode" : function(undoObj, undo){
        var q = undoObj.args;

        //Add Child Node
        if (!undo)
            apf.xmldb.addChildNode(q[0], q[1], q[2], q[3], undoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(undoObj.extra.addedNode, null, undoObj);
    },

    "appendChild" : function(undoObj, undo){
        var q = undoObj.args;

        //Append Child Node
        if (!undo)
            apf.xmldb.appendChild(q[0], q[1], q[2], q[3], q[4], undoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(undoObj.xmlNode, null, undoObj);//q[1]
    },

    "moveNode" : function(undoObj, undo){
        var q = undoObj.args;

        //Move Node
        if (!undo)
            apf.xmldb.moveNode(q[0], q[1], q[2], q[3], undoObj);
        //Move Node to previous position
        else
            apf.xmldb.moveNode(undoObj.extra.oldParent, q[1],
                undoObj.extra.beforeNode, q[3], undoObj);
    },

    "removeNode" : function(undoObj, undo){
        var q = undoObj.args;

        //Remove Node
        if (!undo)
            apf.xmldb.removeNode(q[0], q[1], undoObj);
        //Append Child Node
        else
            apf.xmldb.appendChild(undoObj.extra.parent,
                undoObj.extra.removedNode, undoObj.extra.beforeNode,
                null, null, undoObj);
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "removeNodeList" : function(undoObj, undo){
        if (undo) {
            var d = undoObj.extra.removeList;
            for (var i = d.length - 1; i >= 0; i--) {
                apf.xmldb.appendChild(d[i].pNode,
                    d[i].removedNode, d[i].beforeNode, null, null, undoObj);
            }
        }
        else
            apf.xmldb.removeNodeList(undoObj.args, undoObj);
    },

    "group" : function(undoObj, undo, at){
        if (!undoObj.$undostack) {
            var done = undoObj.args[0];
            undoObj.$undostack = done;
            undoObj.$redostack = [];
        }

        at[undo ? "undo" : "redo"](undoObj.$undostack.length, false,
            undoObj.$undostack, undoObj.$redostack);
    },

    /*"setProperty" : function(undoObj, undo){
        var q = undoObj.args;//amlNode, name, value

        if (!undo) {
            undoObj.extra.oldValue = q[0][q[1]];
            q[0].setProperty(q[1], q[2], q[3], q[4]);
        }
        // Undo
        else {
            q[0].setProperty(q[1], undoObj.extra.oldValue);
        }
    },*/

    "setValueByXpath" : function(undoObj, undo){
        var newNode, q = undoObj.args;//xmlNode, value, xpath

        // Setting NodeValue and creating the node if it doesnt exist
        if (!undo) {
            if (newNode = undoObj.extra.newNode) {
                if (newNode.nodeType == 2) {
                    apf.xmldb.setAttribute(undoObj.extra.ownerElement,
                      newNode.nodeName, newNode.nodeValue);
                    undoObj.extra.newNode = undoObj.extra.ownerElement
                      .getAttributeNode(newNode.nodeName);
                }
                else
                    apf.xmldb.appendChild(undoObj.extra.parentNode,
                        undoObj.extra.newNode, null, null, null, undoObj);
            }
            else {
                var newNodes = [];
                apf.setNodeValue(q[0], q[1], true, {
                    undoObj  : undoObj,
                    xpath    : q[2],
                    newNodes : newNodes,
                    forceNew : q[3]
                });

                newNode = undoObj.extra.newNode = newNodes[0];
                if (newNode) {
                    if (newNode.nodeType == 2)
                        undoObj.extra.ownerElement = newNode.ownerElement
                          || newNode.selectSingleNode("..");
                    else
                        undoObj.extra.parentNode = undoObj.extra.newNode.parentNode;
                }
            }
        }
        // Undo Setting NodeValue
        else {
            if (newNode = undoObj.extra.newNode) {
                if (newNode.nodeType == 2)
                    apf.xmldb.removeAttribute(undoObj.extra.ownerElement,
                      newNode.nodeName, null, undoObj);
                else
                    apf.xmldb.removeNode(undoObj.extra.newNode, null, undoObj);
            }
            else
                apf.setNodeValue(undoObj.extra.appliedNode,
                    undoObj.extra.oldValue, true, {undoObj: undoObj});
        }
    },

    //@todo please change .func to .action for consistency reasons
    "multicall" : function(undoObj, undo, at){
        var q = undoObj.args;

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
                undoObj.rdbModel = q[0].rdbModel;
                undoObj.rdbQueue = q[0].rdbQueue;
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