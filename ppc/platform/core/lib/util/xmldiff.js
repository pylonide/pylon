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

// #ifdef __WITH_XMLDIFF

apf.xmlDiff = function (doc1, doc2){
    /*var domParser = new apf.DOMParser();
    domParser.allowAnyElement = true;
    domParser.preserveWhiteSpace = true;
    apf.compareDoc = domParser.parseFromXml(apf.getCleanCopy(mdlTest.data)).documentElement;

    var doc1 = apf.compareDoc,
        doc2 = apf.getCleanCopy(mdlTest2.data),*/

    var debug = true,
        hash  = {},
        rules = [],
        appendRules = [],
        reorderRules = [],
        preserveWhiteSpace = doc1.ownerDocument.$domParser.preserveWhiteSpace,
        
        //#ifdef __DEBUG
        dt = new Date().getTime(),
        //#endif
        
        APPEND       = 1,
        UPDATE       = 2,
        REMOVE       = 3,
        SETATTRIBUTE = 4,

        notFoundEl = {}, notFoundAttr = {}, foundEl = {},
        foundTxt   = {}, foundAttr   = {}, curNode = {include: {}},

        arr, arrPath, l, lPath, found, path, p, t, j, i, a, item, subitem,
        arrIndex, lastRule, prop,
        emptyArr   = [], node;
    
    (function createHash(el, curPath, hash){
        var i, nodes, attr, l, a, e, p;

        curPath += "/" + el.tagName; //or mypath =  ?
        if (l = (nodes = el.childNodes).length){
            for (i = 0; i < l; i++) {
                if ((e = nodes[i]).nodeType == 1) {
                    createHash(nodes[i], curPath, hash);
                    nodes[i].$childNumber = i;
                }
                else {
                    p = curPath + "/" + e.nodeType,
                    (hash[p] || (hash[p] = [])).push(e),
                    e.$isValid = false;
                    e.$childNumber = i;
                }
            }
        }
        if (l = (attr = el.attributes).length){
            for (i = 0; i < l; i++) {
                p = curPath + "/@" + (a = attr[i]).nodeName,
                (hash[p] || (hash[p] = [])).push(a),
                a.$isValid = false;
            }
        }
        
        (hash[curPath] || (hash[curPath] = [])).push(el);
        el.$isValid = false;
        if (el.$amlList)
            delete el.$amlList;
        //el.$validChildren = 0;
    })(doc1, "", hash);

    curNode.include[doc1.parentNode.$uniqueId] = doc1;
    (function match(el, curPath, hash, pNode, curParentNode, childNumber){
        var total, first, v, jl, item, include, i, nodes, attr, l, a, e, p, s, sh,
            tn, curNode, pcur, pcurl, id, count, node,
            max        = 0,
            found      = [],
            pInclude   = {length: 0},
            oldInclude = curParentNode.include;
        
        curPath += "/" + el.tagName; //or mypath =  ?
        if (!(s = hash[curPath])) {
            //rules.push([APPEND, el, curParentNode]);
            (notFoundEl[curPath] || (notFoundEl[curPath]  = [])).push({
                arr     : null,
                node    : el,
                curNode : curParentNode
            });
            return false;
        }
        else {
            //@todo optimize this
            include = (curNode = {}).include = {};
            for (i = 0, l = s.length; i < l; i++) {
                if ((item = s[i]))
                    include[item.$uniqueId] = item;
            }
            include.length = l;
        }
        
        if (l = (nodes = el.childNodes).length){
            for (i = 0; i < l; i++) {
                if ((e = nodes[i]).nodeType == 1) {
                    match(e, curPath, hash, pNode, curNode, i);
                }
                else {
                    if ((sh = hash[p = curPath + "/" + e.nodeType])) {
                        //Ignore the same node
                        for (total = 0, first = null, v = e.nodeValue, j = 0, jl = sh.length; j < jl; j++) {
                            //possible extra heuristic  && tn.parentNode.childNodes.length == e.parentNode.childNodes.length
                            if ((tn = sh[j]) && tn.nodeValue == v) { 
                                if (!first) {
                                    first = {
                                        node    : e,
                                        //node2   : tn,
                                        index   : j,
                                        //v       : v,
                                        arr     : sh,
                                        curNode : curNode,
                                        pcur    : [tn.parentNode.$uniqueId],
                                        found   : [j],
                                        childNumber : i
                                    };
                                }
                                else {
                                    first.found.push(j),
                                    first.pcur.push(tn.parentNode.$uniqueId);
                                }
                                total++;
                            }
                        }
                        
                        if (total) {
                            /*if (total == 1) {
                                (tn = first.node2).$isValid = true; //@todo might be removed
                                (tn = tn.ownerElement).$validChildren++;
                            }*/
                            
                            pcur = first.pcur, pcurl = pcur.length;
                            for (j = 0; j < pcurl; j++) {
                                if (curNode[pcur[j]]) 
                                    curNode[pcur[j]] += (1/total);
                                else 
                                    curNode[pcur[j]] = (1/total);
                            }

                            //delete sh[j];
                            (foundTxt[p] || (foundTxt[p] = [])).push(first);
                            
                            continue;
                        }
                        
                        //Update or New
                        (notFoundEl[p] || (notFoundEl[p] = [])).push({
                            arr     : sh,
                            node    : e,
                            curNode : curNode
                        });
                        
                        continue;
                    }
                    
                    //New node
                    //rules.push([APPEND, e, curNode]);
                    (notFoundEl[p] || (notFoundEl[p]  = [])).push({
                        isNew   : true,
                        arr     : null,
                        node    : e,
                        curNode : curNode
                    });
                }
            }
        }
        if (l = (attr = el.attributes).length){
            for (i = 0; i < l; i++) {
                pattr = curPath + "/@" + (a = attr[i]).nodeName;
                if (sh = hash[pattr]) {
                    //Ignore the same node
                    for (total = 0, first = null, v = a.nodeValue, j = 0, jl = sh.length; j < jl; j++) {
                        //possible extra heuristic  && tn.parentNode.childNodes.length == e.parentNode.childNodes.length
                        if ((tn = sh[j]) && tn.nodeValue == v) {
                            if (!first) {
                                first = {
                                    node    : a,
                                    //node2   : tn,
                                    index   : j,
                                    //v       : v,
                                    arr     : sh,
                                    curNode : curNode,
                                    pcur    : [tn.ownerElement.$uniqueId],
                                    found   : [j]
                                }
                            }
                            else {
                                first.found.push(j),
                                first.pcur.push(tn.ownerElement.$uniqueId);
                            }
                            total++;
                        }
                    }
                        
                    if (total) {
                        /*if (total == 1) {
                            (tn = first.node2).$isValid = true; //@todo might be removed
                            (tn = tn.ownerElement).$validChildren++;
                        }*/
                        
                        pcur = first.pcur, pcurl = pcur.length;
                        for (j = 0; j < pcurl; j++) {
                            if (curNode[pcur[j]]) 
                                curNode[pcur[j]] += (1 / total);
                            else 
                                curNode[pcur[j]]  = (1 / total);
                        }

                        //delete sh[j];
                        (foundAttr[pattr] || (foundAttr[pattr] = [])).push(first);
                        
                        continue;
                    }
                    
                    //Update or New
                    (notFoundAttr[pattr] || (notFoundAttr[pattr] = [])).push({
                        arr     : sh,
                        node    : a,
                        curNode : curNode
                    });
                    
                    continue;
                }
                
                //New node
                //rules.push([SETATTRIBUTE, a, curNode]);
                (notFoundAttr[pattr] || (notFoundAttr[pattr]  = [])).push({
                    isNew   : true,
                    arr     : null,
                    node    : a,
                    curNode : curNode
                });
            }
        }
        
        /*for (i = 0, l = s.length; i < l; i++) {
            //@todo only one? break here?, cache sum?
            if ((tn = s[i]) && tn.$validChildren == tn.childNodes.length + tn.attributes.length) {
                tn.$isValid = true;
                (tn = tn.parentNode).$validChildren++; //@todo -1 not enough?
                
                delete s[i];
            }
        }*/
        
        //if (curPath == "/a:application/div/div/div") debugger;

        for (id in curNode) {
            if (curNode[id] > max) {
                //if (curNode.include[id]) {
                    max = curNode[id];
                    //me = id;
                    count = 1;
                //}
            }
            else if (curNode[id] == max) {
                count++;
            }
        }

        //We have no idea who el is
        if (!max) {
            count = s.length;
            for (i = count; i >= 0; i--){
                if (!s[i])
                    continue;
                    
                pNode = (node = s[i]).parentNode;
            
                if (node.$isValid || !include[node.$uniqueId] || !oldInclude[pNode.$uniqueId]) {
                    delete include[node.$uniqueId],//@todo is this needed?
                    count--;
                    continue;
                }
                
                //Nodes could have same parent
                if (!pInclude[pNode.$uniqueId]) {
                    pInclude[pNode.$uniqueId] = pNode,
                    pInclude.length++;
                }
                found.push(node);
            }
        }
        //We have some hints who el is
        else {
            for (id in curNode) {
                if (curNode[id] != max)
                    continue;
                
                pNode = (node = apf.all[id]).parentNode;
                
                if (node.$isValid || !include[node.$uniqueId] || !oldInclude[pNode.$uniqueId]) {
                    delete include[node.$uniqueId]; //@todo is this needed?
                    count--;
                    continue;
                }
                
                //Nodes could have same parent
                if (!pInclude[pNode.$uniqueId]) {
                    pInclude[pNode.$uniqueId] = pNode,
                    pInclude.length++;
                }
                found.push(node);
            }
        }

        if (found.length) //@experimental - when a new node is found, dont determine the parent.
            curParentNode.include = pInclude;
        
        for (first = null, i = 0, l = found.length; i < l; i++) { //@todo l == count
            pNode = (item = found[i]).parentNode; 
            
            //guessing parentNode
            if (curParentNode[pNode.$uniqueId]) 
                curParentNode[pNode.$uniqueId] += 1 / count;
            else
                curParentNode[pNode.$uniqueId]  = 1 / count;
            
            if (count > 1) {
                if (!first) {
                    first = {
                        node    : el,
                        //node2   : found[0],
                        arr     : s,
                        curNode : curNode,
                        curParentNode : curParentNode,
                        found   : found,
                        childNumber : childNumber
                    };
                    
                    //foundEl should be here with found array filled by this loop - we trust our scheme
                    (foundEl[curPath] || (foundEl[curPath] = [])).push(first);
                }
                
                if (count > (item.$matchedNodes || 0))
                    item.$matchedNodes = count;
            }
            else { //Code below is probably not necessary and can be removed.
                item.$isValid = true;
                
                //Clean up hash
                for (var j = s.length - 1; j >= 0; j--) {
                    if (s[j] == item) {
                        delete s[j];//this.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        if (!found.length) { //was !count
            //There might be information in the parent about who we are so 
            //we'll continue the search in recurEl()
            var found = [];
            for (var prop in curNode.include) {
                if (prop == "length")
                    continue;
                found.push(curNode.include[prop]);
            }
            
            (foundEl[curPath] || (foundEl[curPath] = [])).push({
                arr     : s,
                node    : el,
                curParentNode : curParentNode,
                curNode : curNode,
                found   : found,
                childNumber : childNumber
            });
            
            //Update or New
            /*(notFoundEl[curPath] || (notFoundEl[curPath] = [])).push({
                arr     : s,
                node    : el,
                curNode : curParentNode,
                me      : curNode
            });*/
        }

        curNode.curNode = found[0],
        curNode.parent  = curParentNode,
        curNode.curPath = curPath;
    })(doc2, "", hash, doc1, curNode);
        
    //if (doc1.$isValid) //docs match completely
        //return true;

    /*
        indexOf (nodes in arrPath) to find out if node still exists. 
        do remove node from .arr to say its determined
    */

    function checkOrder(node1, node2) {
        if (node1.$childNumber != node2.childNumber)
            reorderRules.push([node1, node2.childNumber]);
    }

    //Process all conflicting nodes on this path
    //@todo this should be optimized a lot
    function recurEl(path){
        var pathCollision = foundEl[path];
        if (!pathCollision)
            return;

        var curItem, curMatch, l, count, nMatch, j, i, potentialMatches,
            leastMatchNodes, pl, pNode;
        for (i = 0, pl = pathCollision.length; i < pl; i++) {
            //Make sure to do cleanup!
            //Strategy!: the parent knows best!
            
            //if (pathCollision[i].node2.$isValid)
                //continue;
            
            potentialMatches = (curItem = pathCollision[i]).found,
            leastMatchNodes  = 100000;
            for (count = j = 0, l = potentialMatches.length; j < l; j++) {
                if ((curMatch = potentialMatches[j]).$isValid)
                    continue;
                
                nMatch = curMatch.$matchedNodes;
                if (nMatch < leastMatchNodes) {
                    leastMatchNodes = nMatch,
                    count = 1;
                }
                else if (nMatch == leastMatchNodes) {
                    count++;
                }
            }
            
            //Found match
            if (count == 1) {
                for (j = 0, l = potentialMatches.length; j < l; j++) {
                    if (!(curMatch = potentialMatches[j]).$isValid
                      && curMatch.$matchedNodes == leastMatchNodes) {
                        curMatch.$isValid = true,
                        //curMatch.parentNode.$validChildren++;
                        curItem.curNode.curNode = curMatch;//set who is me
                        checkOrder(curMatch, curItem);
                        break;
                    }
                }
            }
            else if (count) {
                //recursion.. with pathCollion[i].curNode.parent.found -> potentialMatches for the parent;
                //if parent found and it was doubting, delete entry from foundEl[path][i].node == pathCollion[i].node.parentNode
                var include = curItem.curParentNode.include;
                //There's only one parent
                if (include.length == 1) {
                    pNode = curItem.curParentNode.curNode;//apf.all[include[0]];
                    for (j = 0, l = potentialMatches.length; j < l; j++) {
                        if (!(curMatch = potentialMatches[j]).$isValid
                          && curMatch.$matchedNodes == leastMatchNodes
                          && curMatch.parentNode == pNode) {
                            curMatch.$isValid = true,
                            //curMatch.parentNode.$validChildren++;
                            curItem.curNode.curNode = curMatch;//set who is me
                            checkOrder(curMatch, curItem);
                            break;
                        }
                    }
                    //@todo check here if found
                    continue;
                }
                
                //Determine who's who for the parents
                recurEl(curItem.curParentNode.curPath);
                
                pNode = curItem.curParentNode.curNode;
                for (j = 0, l = potentialMatches.length; j < l; j++) {
                    if (!(curMatch = potentialMatches[j]).$isValid
                      && curMatch.$matchedNodes == leastMatchNodes
                      && curMatch.parentNode == pNode) {
                        curMatch.$isValid = true,
                        //curMatch.parentNode.$validChildren++;
                        curItem.curNode.curNode = curMatch;//set who is me
                        checkOrder(curMatch, curItem);
                        break;
                    }
                }
                
                /*for (var j = 0; j < potentialMatches.length; j++) {
                    if (!potentialMatches[j].$isValid && potentialMatches[j].$matchedNodes == leastMatchNodes) {
                        recur
                    }
                }*/
            }
            //Add when node is same as others
            else {
                //This case is for when there is a node that almost looks the 
                //same and was discarded but was actually needed
                var nodes = hash[path], foundLast = false;
                for (var k = 0; k < nodes.length; k++) {
                    if (nodes[k] && !nodes[k].$isValid) {
                        nodes[k].$isValid = true;
                        curItem.curNode.curNode = nodes[k];
                        checkOrder(nodes[k], curItem);
                        foundLast = true;
                        break;
                    }
                }
                
                //if (curItem.curParentNode.include.length == 1) {
                //This case is for when a node looks the same as other nodes
                if (!foundLast) {
                    curItem.curNode.isAdding = true;

                    if (!curItem.curParentNode.isAdding) {
                        (notFoundEl[path] || (notFoundEl[path] = [])).push({
                            isNew   : true,
                            arr     : null,
                            node    : curItem.node,
                            curNode : curItem.curParentNode
                        });
                    }
                }
            }
        }
        
        delete foundEl[path];//Will this mess with the iterator?
    }

    //Process conflicting element nodes
    for (path in foundEl) {
        recurEl(path);
    }

    //Process conflicting text nodes
    //debugger;
    for (path in foundTxt) {
        arr     = foundTxt[path], //found text nodes with this path
        l       = arr.length,
        arrPath = arr[0].arr;

        var lost = [];
        for (i = 0; i < l; i++) {
            t        = arr[i],
            arrIndex = t.found;
            
            //Find the right node
            if ((p = t.curNode) && (p = p.curNode)) {
                if (arrPath[t.index] && p == arrPath[t.index].parentNode) {
                    checkOrder(arrPath[t.index], t);
                    delete arrPath[t.index];
                    //p.$validChildren++;
                }
                else {
                    //cleanup hash
                    for (found = false, j = 0; j < arrIndex.length; j++) {
                        if (arrPath[arrIndex[j]] && arrPath[arrIndex[j]].parentNode == p) {
                            checkOrder(arrPath[arrIndex[j]], t);
                            delete arrPath[arrIndex[j]],
                            //p.$validChildren++;
                            found = true;
                            break;
                        }
                    }
                    
                    //if not found, what does it mean?
                    if (!found && !t.curNode.isAdding)
                        (notFoundEl[path] || (notFoundEl[path] = [])).push(t);
                }
            }
            else {
                //throw new Error("hmm, new?");
                //part of a new chain?
                /*if (!t.curNode.isAdding) {
                    
                }*/
                //lost.push(t);

                if (!t.curNode.isAdding)
                    (notFoundEl[path] || (notFoundEl[path] = [])).push(t);
            }
        }
        
        /*for (i = 0; i < lost.length; i++) {
            for (var j = 0; j < arrPath.length; j++) {
                if (!arrPath[j])
                    continue;
                alert(1);
                (notFoundEl[path] || (notFoundEl[path] = [])).push(lost[i]);
                break;
            }
        }*/
    }
    
    //Process conflicting attr nodes
    for (path in foundAttr) {
        arr     = foundAttr[path], //found attributes with this path
        l       = arr.length,
        arrPath = arr[0].arr;

        for (i = 0; i < l; i++) {
            t        = arr[i],
            arrIndex = t.found;
            
            //Find the right node
            if ((p = t.curNode) && (p = p.curNode)) {
                if (arrPath[t.index] && p == arrPath[t.index].ownerElement) {
                    delete arrPath[t.index];
                    //p.$validChildren++;
                }
                else {
                    //cleanup hash
                    for (found = false, j = 0; j < arrIndex.length; j++) {
                        if (arrPath[arrIndex[j]] && arrPath[arrIndex[j]].ownerElement == p) {
                            delete arrPath[arrIndex[j]],
                            //p.$validChildren++;
                            found = true;
                            break;
                        }
                    }
                    
                    //if not found, what does it mean?
                    if (!found && !t.curNode.isAdding)
                        (notFoundAttr[path] || (notFoundAttr[path] = [])).push(t);
                }
            }
            else {
                //throw new Error("hmm, new?");
                //part of a new chain?
                
                if (!t.curNode.isAdding)
                    (notFoundAttr[path] || (notFoundAttr[path] = [])).push(t);
            }
        }
    }
    
    //Process not found attribute
    /*
        arr     : sh,
        node    : a,
        curNode : curNode
        
        is it update or new?
        - get the parent node from curNode.curNode;
            - check if there is a parent node in the list that matches
                - remove entry in arrPath
        - else 
            - parent is new node
    */
    for (path in notFoundAttr) {
        arr     = notFoundAttr[path], //not found attributes with this path
        l       = arr.length,
        arrPath = arr[0].arr || emptyArr,
        lPath   = arrPath.length;

        //should there be a check for isAdded here?

        for (i = 0; i < l; i++) {
            a = arr[i];
            
            if ((p = t.curNode) && p.isAdding) {
                //Ignore, parent is new, so this will be added automatically
                continue;
            }
            
            //Found parent
            if ((p = a.curNode) && (p = p.curNode)) {
                if (a.node.nodeName == "id")
                    p.setAttribute("id", a.node.nodeValue);
                else
                    rules.push([SETATTRIBUTE, p, a.node]);
                //p.$validChildren++;
                
                //cleanup hash
                for (j = 0; j < lPath; j++) {
                    if (arrPath[j] && arrPath[j].ownerElement == p) {
                        delete arrPath[j];
                        break;
                    }
                }
            }
            else {
                //Ignore, parent is new, so this will be added automatically (i think :S)
            }
        }
    }
    //Process not found nodes (all but attribute)
    for (path in notFoundEl) {
        arr     = notFoundEl[path], //not found attributes with this path
        l       = arr.length,
        arrPath = arr[0].arr || emptyArr,
        lPath   = arrPath.length;

//if (path == "/a:application/div/div/div/div/a/3") debugger;

        for (i = 0; i < l; i++) {
            t = arr[i];
            
            if ((p = t.curNode) && p.isAdding) {
                //Ignore, parent is new, so this will be added automatically
                continue;
            }
            
            //Found parent
            if (p = p.curNode) {
                appendRules.push(lastRule = [APPEND, p, t.node]);
                //p.$validChildren++;
                //cleanup hash
                for (j = 0; j < lPath; j++) {
                    if (arrPath[j] && arrPath[j].parentNode == p) {
                        if (t.node.nodeType != 1) {
                            lastRule[0] = UPDATE;
                            lastRule[1] = arrPath[j];
                        }
                        else {
                            appendRules.length--;
                        }

                        delete arrPath[j];
                        break;
                    }
                }
            }
            else {
                
            }
        }
    }
    
    //Process remaining hash
    for (prop in hash){
        item = hash[prop];
        for (i = 0, l = item.length; i < l; i++) {
            subitem = item[i];
            //@todo check if the last check is actually needed:
            // && subitem.$validChildren != subitem.childNodes.length + subitem.attributes.length) {
            if (subitem && !subitem.$isValid && (subitem.parentNode || subitem.ownerElement).$isValid) {
                rules.push([REMOVE, subitem]);
            }
        }
    }

    var dt = new Date().getTime();
    //This loop could be optimized away
    var q = {}, doc = doc1.ownerDocument;
    for (i = 0, l = appendRules.length; i < l; i++) {
        switch((item = appendRules[i])[0]) {//@todo optimize
            case UPDATE:
                //#ifdef __DEBUG
                if (debug) {
                    apf.console.log("XmlDiff: UPDATE " 
                        + item[1].nodeValue + " with "
                        + item[2].nodeValue);
                }
                //#endif
            
                //item[1].nodeValue = item[2].nodeValue;
                item[1].$setValue(item[2].nodeValue);
                if (item[1].nodeType != 2) { //@todo apf3.0 optimize this
                    var childNr1 = apf.getChildNumber(item[1]),
                        childNr2 = apf.getChildNumber(item[2]);
                    if (childNr1 != childNr2)
                        item[1].parentNode.insertBefore(item[1], item[1].parentNode.childNodes[childNr2]);
                }
                //@todo need trigger for aml node
                break;
            case APPEND:
                //#ifdef __DEBUG
                if (debug) {
                    apf.console.log("XmlDiff: APPEND " 
                        + (item[2].tagName ? "<" + item[2].tagName + ">" : item[2].nodeValue) + " to "
                        + "<" + item[1].localName + "> [" + item[1].$uniqueId + "]");
                }
                //#endif
            
                if (!item[1].canHaveChildren) {
                    item[1].$aml = item[2].parentNode;
                    if (item[1].$redraw)
                        item[1].$redraw();
                    continue;
                }
        
                if (item[1].render != "runtime") {
                    var xml = item[1].parentNode;
                    while (xml && xml.nodeType == 1 && !xml.getAttribute("render"))
                        xml = xml.parentNode;
                    if (xml && xml.render) {// && !xml.visible) { //@todo apf3.0 add case for page
                        if (xml.$amlList)
                            xml.$amlList.push(item);
                        else {
                            xml.$amlList = [item];
                            xml.addEventListener("beforerender", function(e){
                                var nodes = this.$amlList;
                                this.$amlList = null;
        
                                for (var item, i = 0, l = nodes.length; i < l; i++) {
                                    item = nodes[i];
                                    var childNr = apf.getChildNumber(node = item[2]);
                                    item[1].insertBefore(doc.importNode(node, true), item[1].childNodes[childNr]);
                                }
                                
                                //@todo call afterrender
                                this.$rendered = true;
                                this.removeEventListener("beforerender", arguments.callee);
                                
                                return false;
                            });
                            xml.$rendered = false;
                        }
                    }
                    else {
                        //!preserveWhiteSpace 
                        /*var list = item[2].parentNode.selectNodes("node()[local-name() or string-length(normalize-space())]");
                        var idx  = apf.getChildNumber(item[2], list);
                        if (idx < list.length) {*/

                        (item[1].$amlList || (item[1].$amlList = []))[apf.getChildNumber(item[2])] = item;
                        q[item[1].$uniqueId] = item[1];
                    }
                }
                else {
                    item[1].$aml = item[2].parentNode;
                    item[1].$rendered = false;
                }
            break;
        }
    }
    
    //@todo apf3.0 optimize this
    var list, newNode;
    for (var id in q) {
        list = q[id].$amlList;
        for (var item, i = 0; i < list.length; i++) {
            item = list[i];
            if (!item) continue;
            /*if (item[2].nodeType == 1) {
                newNode = doc.createElementNS(item[2].namespaceURI || apf.ns.xhtml, item[2][apf.TAGNAME]);
                item[1].insertBefore(newNode, item[1].childNodes[i]);
            }
            else {*/
                newNode = doc.importNode(item[2], true);
                if (newNode)
                    item[1].insertBefore(newNode, item[1].childNodes[i]);
            //}
        }
    }

    for (i = 0, l = rules.length; i < l; i++) {
        switch((item = rules[i])[0]) {
            case REMOVE:
                //#ifdef __DEBUG
                if (debug) {
                    apf.console.log("XmlDiff: REMOVE " 
                        + (item[1].localName ? "<" + item[1].localName + ">" : item[1].nodeValue) 
                        + " [" + item[1].$uniqueId + "] ");
                }
                //#endif
                if ((node = item[1]).destroy) {
                    node.destroy(true, true);
                }
                else if (node.parentNode)
                    node.parentNode.removeChild(node);
                else
                    node.ownerElement.removeAttributeNode(node);
                break;
            case SETATTRIBUTE:
                //#ifdef __DEBUG
                if (debug) {
                    apf.console.log("XmlDiff: ATTRIBUTE " 
                        + "<" + item[1].localName + "> [" + item[1].$uniqueId + "] " 
                        + item[2].nodeName + "=\"" + item[2].nodeValue + "\"");
                }
                //#endif

                item[1].setAttribute((item = item[2]).nodeName, item.nodeValue);
                break;
        }
    }

    for (var node, pnode, next, nr, tonr, i = 0;i < reorderRules.length; i++) {
        node = reorderRules[i][0];
        nr   = node.$childNumber;
        tonr = reorderRules[i][1];
        pnode = node.parentNode;
        next = pnode.childNodes[tonr + (nr < tonr ? 1 : 0)];
        if (node.nextSibling != next && node != next)
            pnode.insertBefore(node, next);
    }
    
    apf.queue.empty();

    //#ifdef __DEBUG
    if (debug)
        apf.console.time("Diff time:" + (time = (new Date() - dt)));
    
    /*var res1 = (apf.formatXml(doc2.xml));
    var res2 = (apf.formatXml(doc1.serialize()));
    
    if(res1 != res2) {
        throw new Error("A potentially serious xml diff problem was detected. \
            Please contact the author of this library:\n" 
            + res1 + "\n\n" + res2); //@todo make this into a proper apf3.0 error
    }*/
        
    //#endif
}

//#endif