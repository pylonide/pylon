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

var __MULTICHECK__ = 1 << 22;

// #ifdef __WITH_MULTICHECK

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have checkable items.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @todo type detection, errors (see functions in multiselect)
 */
apf.MultiCheck = function(){
    var checkedList  = [];
    var _self        = this;

    this.$regbase    = this.$regbase|__MULTICHECK__;

    /**** Properties ****/

    this.multicheck = true;

    /**** Public Methods ****/
    
    this.check = function(xmlNode){ 
        if (this.disabled || checkedList.indexOf(xmlNode) > -1)
            return;
        
        if (this.dispatchEvent("beforecheck", {xmlNode : xmlNode}) === false)
            return false;
        
        if (!this.multicheck && checkedList.length)
            this.clearSelection(true);

        checkedList.push(xmlNode);
        
        // #ifdef __WITH_MULTICHECK_TREE
        if (this.isTreeArch) {
            //Children
            var nodes = xmlNode.selectNodes(".//" 
                + this.traverse.split("|").join("|.//"));
        
            this.checkList(nodes, null, true, true);
            
            //Parents
            var all, pNode = this.getTraverseParent(xmlNode);
            while(pNode && pNode != this.xmlRoot) {
                nodes = this.getTraverseNodes(pNode);
                
                all = true;
                for (var i = 0; i < nodes.length; i++) {
                    if (checkedList.indexOf(nodes[i]) == -1) {
                        all = false;
                        break;
                    }
                }
                
                apf.setStyleClass(apf.xmldb.getHtmlNode(pNode, this), 
                    all ? "checked"
                        : "partial", ["partial", "checked"]);
                
                if (all) //logical assumption that parent cannot be selected at this point
                    checkedList.push(pNode);
                
                pNode = this.getTraverseParent(pNode);
            }
        }
        //#endif

        this.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, this), "checked", ["partial"]);
        
        this.dispatchEvent("aftercheck", {
            list        : checkedList,
            xmlNode     : xmlNode
        });
    }
    
    this.uncheck = function(xmlNode){
        if (this.disabled || checkedList.indexOf(xmlNode) == -1)
            return;
        
        if (this.dispatchEvent("beforeuncheck", {
            xmlNode : xmlNode
        }) === false)
            return false;
        
        checkedList.remove(xmlNode);
        
        // #ifdef __WITH_MULTICHECK_TREE
        if (this.isTreeArch) {
            //Children
            var nodes = xmlNode.selectNodes(".//" 
                + this.traverse.split("|").join("|.//"));
        
            this.checkList(nodes, true, true, true);
            
            //Parents
            var none, all, pNode = this.getTraverseParent(xmlNode);
            while(pNode && pNode != this.xmlRoot) {
                nodes = this.getTraverseNodes(pNode);
                
                all = true, none = true;
                for (var i = 0; i < nodes.length; i++) {
                    if (checkedList.indexOf(nodes[i]) == -1)
                        all = false;
                    else
                        none = false;
                    if (!all && !none)
                        break;
                }
                
                apf.setStyleClass(apf.xmldb.getHtmlNode(pNode, this), 
                    none ? ""
                         : "partial", ["partial", "checked"]);
                
                if (!all)
                    checkedList.remove(pNode);
                
                pNode = this.getTraverseParent(pNode);
            }
        }
        //#endif
        
        this.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, this), "", ["checked", "partial"]);
        
        this.dispatchEvent("afteruncheck", {
            list        : checkedList,
            xmlNode     : xmlNode
        });
    }
    
    this.checkToggle = function(xmlNode){
        if (xmlNode.style) {
            var htmlNode = xmlNode;
            var id = htmlNode.getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode)
                    .getAttribute(apf.xmldb.htmlIdTag);
            xmlNode = apf.xmldb.getNode(htmlNode)
        }

        if (checkedList.indexOf(xmlNode) > -1)
            this.uncheck(xmlNode);
        else
            this.check(xmlNode);
    }
    
    this.checkList = function(xmlNodeList, uncheck, noClear, noEvent){
        if (this.disabled) return;
        
        if (!noEvent && this.dispatchEvent("beforecheck", {
            list : xmlNodeList
        }) === false)
            return false;
        
        if (!uncheck && !noClear) 
            this.clearChecked(true);
        
        if (!this.multicheck)
            xmlNodeList = [xmlNodeList[0]];

        if (uncheck) {
            for (var i = xmlNodeList.length - 1; i >= 0; i--) {
                checkedList.remove(xmlNodeList[i]);
                this.$setStyleClass(
                    apf.xmldb.getHtmlNode(xmlNodeList[i], this), "", ["checked"]);
            }
        }
        else {
            for (var i = xmlNodeList.length - 1; i >= 0; i--) {
                checkedList.push(xmlNodeList[i]);
                this.$setStyleClass(
                    apf.xmldb.getHtmlNode(xmlNodeList[i], this), "checked");
            }
        }
        
        // #ifdef __WITH_MULTICHECK_TREE
        if (!noEvent && this.isTreeArch) {
            var recur = function(xmlNode, forceChange){
                var nodes = _self.getTraverseNodes(xmlNode);
                if (!nodes.length) {
                    if (forceChange) {
                        if (uncheck) {
                            checkedList.remove(xmlNode);
                            _self.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), 
                                "", ["checked"]);
                            return 0;
                        }
                        else {
                            checkedList.push(xmlNode);
                            _self.$setStyleClass(
                                apf.xmldb.getHtmlNode(xmlNode, _self), "checked");
                            return 1;
                        }
                    }
                    return checkedList.indexOf(xmlNode) > -1 ? 1 : 0;
                }

                var shouldBeChanged = forceChange 
                    || xmlNodeList.indexOf(xmlNode) > -1 && (uncheck 
                        ? checkedList.indexOf(xmlNode) == -1 
                        : checkedList.indexOf(xmlNode) != -1);
                var all = true, none = true, partial = false, isChecked;
                for (var i = nodes.length - 1; i >= 0; i--) {
                    isChecked = recur(nodes[i], shouldBeChanged);
                    if (isChecked) {
                        none = false;
                        if (!partial && isChecked == 2) {
                            partial = true;
                            //break;
                        }
                    }
                    else
                        all = false;
                    if (!all && !none) {
                        partial = true;
                        //break;
                    }
                }
                
                if (all) {
                    checkedList.push(xmlNode);
                    apf.setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), 
                        "checked", ["partial"]);
                }
                else {
                    checkedList.remove(xmlNode);
                    apf.setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), 
                        partial ? "partial" : "", ["partial", "checked"]);
                }
                
                return all ? 1 : (none ? 0 : 2);
            }

            recur(this.xmlRoot)
        }
        //#endif
        
        if (!noEvent)
            this.dispatchEvent("aftercheck", {
                list        : xmlNodeList
            });
    }
    
    this.clearChecked = function(noEvent){
        if (!noEvent && this.dispatchEvent("beforeuncheck", {
            xmlNode : checkedList
        }) === false)
            return false;
        
        for (var i = checkedList.length - 1; i >= 0; i--) {
            this.$setStyleClass(
                apf.xmldb.getHtmlNode(checkedList[i], this), "", ["checked"]);
        }
        
        checkedList.length = 0;
        
        if (!noEvent)
            this.dispatchEvent("afteruncheck", {
                list : checkedList
            });
    }
    
    this.isChecked = function(xmlNode){
        return checkedList.indexOf(xmlNode) > -1;
    }
    
    this.getChecked = function(xmldoc){
        var i, r;
        if (xmldoc) {
            r = this.xmlRoot
                ? this.xmlRoot.ownerDocument.createDocumentFragment()
                : apf.getXmlDom().createDocumentFragment();
            for (i = 0; i < checkedList.length; i++)
                apf.xmldb.cleanNode(r.appendChild(
                    checkedList[i].cloneNode(true)));
        }
        else
            for (r = [], i = 0; i < checkedList.length; i++)
                r.push(checkedList[i]);

        return r;
    };
    
    this.checkAll = function(){
        if (!this.multicheck || this.disabled || !this.xmlRoot)
            return;

        var nodes = this.isTreeArch
            ? this.xmlRoot.selectNodes(".//" 
              + this.traverse.split("|").join("|.//"))
            : this.getTraverseNodes();
        
        this.checkList(nodes);
    }
};

//#endif