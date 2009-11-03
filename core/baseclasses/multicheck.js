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

apf.__MULTICHECK__ = 1 << 22;

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
    this.$regbase    = this.$regbase | apf.__MULTICHECK__;

    /**** Properties ****/

    this.multicheck  = true;
    this.checklength = 0;
    this.checkedList = [];

    /**** Public Methods ****/
    
    /**
     * Checks a single, or set of.
     * The checking can be visually represented in this element.
     * The element can be checked, partialy checked or unchecked
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     * @return  {Boolean}  whether the selection could not be made
     *
     * @event  beforecheck  Fires before a check is made
     *
     * @event  aftercheck  Fires after a check is made
     *
     */
    this.check = function(xmlNode){ 
        if (this.disabled || this.checkedList.indexOf(xmlNode) > -1)
            return;
        
        if (this.dispatchEvent("beforecheck", {xmlNode : xmlNode}) === false)
            return false;
        
        if (!this.multicheck && this.checkedList.length)
            this.clearChecked(true);

        this.checkedList.push(xmlNode);
        
        // #ifdef __WITH_MULTICHECK_TREE
        if (this.$isTreeArch) {
            //Children
            var nodes = xmlNode.selectNodes(".//" 
                + this.each.split("|").join("|.//"));
        
            this.checkList(nodes, null, true, true);
            
            //Parents
            var all, pNode = this.getTraverseParent(xmlNode);
            while(pNode && pNode != this.xmlRoot) {
                nodes = this.getTraverseNodes(pNode);
                
                all = true;
                for (var i = 0; i < nodes.length; i++) {
                    if (this.checkedList.indexOf(nodes[i]) == -1) {
                        all = false;
                        break;
                    }
                }
                
                apf.setStyleClass(apf.xmldb.getHtmlNode(pNode, this), 
                    all ? "checked"
                        : "partial", ["partial", "checked"]);
                
                if (all) //logical assumption that parent cannot be selected at this point
                    this.checkedList.push(pNode);
                
                pNode = this.getTraverseParent(pNode);
            }
        }
        //#endif

        this.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, this),
            "checked", ["partial"]);
        
        this.dispatchEvent("aftercheck", {
            list        : this.checkedList,
            xmlNode     : xmlNode
        });
    };
    
    /**
     * Unchecks a single, or set of.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     * @return  {Boolean}  whether the selection could be made
     *
     * @event  beforeuncheck  Fires before a uncheck is made
     *
     * @event  afteruncheck  Fires after a uncheck is made
     *
     */
    this.uncheck = function(xmlNode){
        if (this.disabled || this.checkedList.indexOf(xmlNode) == -1)
            return;
        
        // #ifdef __WITH_MULTICHECK_TREE
        if (this.$isTreeArch)
            return this.checkList([xmlNode], true, true);
        //#endif
        
        if (this.dispatchEvent("beforeuncheck", {
            xmlNode : xmlNode
        }) === false)
            return false;

        this.checkedList.remove(xmlNode);
        this.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, this), 
            "", ["checked", "partial"]);
        
        this.dispatchEvent("afteruncheck", {
            list        : this.checkedList,
            xmlNode     : xmlNode
        });
    };

    /**
     * Toggles between check and uncheck a single, or set of.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *
     */
    this.checkToggle = function(xmlNode){
        if (xmlNode.style) {
            var htmlNode = xmlNode,
                id       = htmlNode.getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode)
                    .getAttribute(apf.xmldb.htmlIdTag);
            xmlNode = apf.xmldb.getNode(htmlNode)
        }

        if (this.checkedList.indexOf(xmlNode) > -1)
            this.uncheck(xmlNode);
        else
            this.check(xmlNode);
    };
    
    /**
     * Checks a set of items
     *
     * @param {Array} xmlNodeList the {@link term.datanode data nodes} that will be selected.
     * @param {boolean} 
     * @param {boolean} 
     * @param {boolean} whether to not call any events
     * @event  beforecheck  Fires before a check is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that will be deselected.
     * @event  aftercheck   Fires after a check is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that is deselected.
     */
    this.checkList = function(xmlNodeList, uncheck, noClear, noEvent){
        //if (apf.isIE < 8)
        if (!xmlNodeList.indexOf)
            xmlNodeList = apf.getArrayFromNodelist(xmlNodeList);
            //@todo is this need for ie8 and/or other browsers
        
        if (this.disabled) return;
        
        if (!noEvent && this.dispatchEvent("beforecheck", {
            list : xmlNodeList
        }) === false)
            return false;
        
        if (!uncheck && !noClear) 
            this.clearChecked(true);
        
        if (!this.multicheck)
            xmlNodeList = [xmlNodeList[0]];

        var i;
        if (uncheck) {
            for (i = xmlNodeList.length - 1; i >= 0; i--) {
                this.checkedList.remove(xmlNodeList[i]);
                this.$setStyleClass(
                    apf.xmldb.getHtmlNode(xmlNodeList[i], this), "", ["checked"]);
            }
        }
        else {
            for (i = xmlNodeList.length - 1; i >= 0; i--) {
                this.checkedList.push(xmlNodeList[i]);
                this.$setStyleClass(
                    apf.xmldb.getHtmlNode(xmlNodeList[i], this), "checked");
            }
        }

        // #ifdef __WITH_MULTICHECK_TREE
        if (!noEvent && this.$isTreeArch) {
            var _self = this;
            function recur(xmlNode, forceChange) {
                var nodes = _self.getTraverseNodes(xmlNode);
                if (!nodes.length) {
                    if (forceChange) {
                        if (uncheck) {
                            _self.checkedList.remove(xmlNode);
                            _self.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), 
                                "", ["checked"]);
                            return 0;
                        }
                        else {
                            if (_self.checkedList.indexOf(xmlNode) == -1) {
                                _self.checkedList.push(xmlNode);
                                _self.$setStyleClass(
                                    apf.xmldb.getHtmlNode(xmlNode, _self), "checked");
                            }
                            return 1;
                        }
                    }
                    return _self.checkedList.indexOf(xmlNode) > -1 ? 1 : 0;
                }

                var isInList = _self.checkedList.indexOf(xmlNode) != -1,
                    shouldBeChanged = forceChange
                        || xmlNodeList.indexOf(xmlNode) > -1 && (uncheck
                            ? !isInList
                            : isInList),
                    all      = true,
                    none     = true,
                    partial  = false,
                    isChecked;
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
                
                if (xmlNode == _self.xmlRoot)
                    return;
                
                if (all) {
                    if (!isInList) {
                        _self.checkedList.push(xmlNode);
                        apf.setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), 
                            "checked", ["partial"]);
                    }
                }
                else{
                    if (isInList)
                        _self.checkedList.remove(xmlNode);

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
    };

    /**
     * Removes the selection of one or more checked nodes.
     *
     * @param {Boolean} [singleNode] whether to only deselect the indicated node
     * @param {Boolean} [noEvent]    whether to not call any events
     * @event  beforeuncheck  Fires before a uncheck is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that will be deselected.
     * @event  afteruncheck   Fires after a uncheck is made
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that is deselected.
     */
    this.clearChecked = function(noEvent){
        if (!noEvent && this.dispatchEvent("beforeuncheck", {
            xmlNode : this.checkedList
        }) === false)
            return false;
        
        for (var i = this.checkedList.length - 1; i >= 0; i--) {
            this.$setStyleClass(
                apf.xmldb.getHtmlNode(this.checkedList[i], this), "", ["checked"]);
        }
        
        this.checkedList.length = 0;
        
        if (!noEvent) {
            this.dispatchEvent("afteruncheck", {
                list : this.checkedList
            });
        }
    };
    
    /**
     * Determines whether a node is checked.
     *
     * @param  {XMLElement} xmlNode  The {@link term.datanode data node} to be checked.
     * @return  {Boolean} whether the element is selected.
     */
    this.isChecked = function(xmlNode){
        return this.checkedList.indexOf(xmlNode) > -1;
    };

    /**
     * Retrieves an array or a document fragment containing all the checked
     * {@link term.datanode data nodes} from this element.
     *
     * @param {Boolean} [xmldoc] whether the method should return a document fragment.
     * @return {mixed} the selection of this element.
     */
    this.getChecked = function(xmldoc){
        var i, r;
        if (xmldoc) {
            r = this.xmlRoot
                ? this.xmlRoot.ownerDocument.createDocumentFragment()
                : apf.getXmlDom().createDocumentFragment();
            for (i = 0; i < this.checkedList.length; i++)
                apf.xmldb.cleanNode(r.appendChild(
                    this.checkedList[i].cloneNode(true)));
        }
        else {
            for (r = [], i = 0; i < this.checkedList.length; i++)
                r.push(this.checkedList[i]);
        }

        return r;
    };
    
    /**
     * Checks all the {@link term.eachnode each nodes} of this element
     *
     */
    this.checkAll = function(){
        if (!this.multicheck || this.disabled || !this.xmlRoot)
            return;

        var nodes = this.$isTreeArch
            ? this.xmlRoot.selectNodes(".//" 
              + this.each.split("|").join("|.//"))
            : this.getTraverseNodes();
        
        this.checkList(nodes);
    };
    
    //#ifdef __WITH_PROPERTY_BINDING
    this.addEventListener("aftercheck", function(){
        //@todo inconsistent because setting this is in event callback
        if (this.checklength != this.checkedList.length)
            this.setProperty("checklength", this.checkedList.length);
    });
    
    this.addEventListener("afteruncheck", function(){
        //@todo inconsistent because setting this is in event callback
        if (this.checklength != this.checkedList.length)
            this.setProperty("checklength", this.checkedList.length);
    });
    //#endif
};

//#endif