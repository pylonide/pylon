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

// #ifdef __WITH_AMLRANGE
/**
 * HTML5 Range object
 * @todo copy docs from http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html
 */
apf.AmlRange = function(doc){
    this.$init();

    this.$ownerDocument = 
    this.startContainer = 
    this.endContainer   = doc || apf.document;
    this.startOffset    = 
    this.endOffset      = 0;
    
    var _self = this;
    this.$domCharModS = function (e){
        
    }
    this.$domCharModE = function (e){
        
    }
    
    this.$domNodeInsS = function(e){
        if (e.relatedNode == this && e.currentTarget.nodeType != 2) {
            var nr = apf.getChildNumber(e.currentTarget);
            if (nr < _self.startOffset)
                _self.startOffset++;
        }
    }
    this.$domNodeInsE = function(e){
        if (e.relatedNode == this && e.currentTarget.nodeType != 2) {
            var nr = apf.getChildNumber(e.currentTarget);
            if (nr < _self.endOffset)
                _self.endOffset++;
        }
    }
    
    this.$domNodeRemS = function(e){
        if (e.relatedNode == this && e.currentTarget.nodeType != 2) {
            var nr = apf.getChildNumber(e.currentTarget);
            if (nr < _self.startOffset)
                _self.startOffset--;
        }
    }
    this.$domNodeRemE = function(e){
        if (e.relatedNode == this && e.currentTarget.nodeType != 2) {
            var nr = apf.getChildNumber(e.currentTarget);
            if (nr < _self.endOffset)
                _self.endOffset--;
        }
    }
    
    //@todo this should be rewritten when fromdoc events are fixed
    this.$domNodeRemDoc = function(e){
        if (apf.isChildOf(e.currentTarget, _self.startContainer, true)) {
            _self.setStart(e.currentTarget.parentNode, apf.getChildNumber(e.currentTarget));
        }
        if (apf.isChildOf(e.currentTarget, _self.endContainer, true)) {
            _self.setEnd(e.currentTarget.parentNode, apf.getChildNumber(e.currentTarget));
        }
    }
    
    this.$ownerDocument.addEventListener("DOMNodeRemoved", this.$domNodeRemDoc);
};
(function() {
    this.START_TO_START = 0;
    this.START_TO_END   = 1;
    this.END_TO_END     = 2;
    this.END_TO_START   = 3;
    
    this.collapsed      = true;
    this.commonAncestorContainer = null; //@todo
    
    this.$detached      = false;

    this.toString = function(){
        return "[apf.AmlRange]";
        /*var n = this.$contents(true);
        if (n.serialize)
            return n.serialize().replace(/<[^>]*>/g, "");
        else {
            var str = [];
            for (var i = 0, l = n.childNodes.length; i < l; i++) {
                str.push(n.childNodes[0].serialize());
            }
            return str.join("\n");
        }*/
    }
    
    var charNode = {2:1,3:1,4:1,7:1}

    this.setStart = function(refNode, offset, noEvent){
        if (!refNode) return;
        
        //#ifdef __DEBUG
        if (offset < 0 || offset > (charNode[refNode.nodeType] 
          ? refNode.nodeValue.length 
          : refNode.childNodes.length)) {
            //#ifdef __DEBUG_ERROR
            throw new Error("INDEX_SIZE_ERR:  Raised if offset is negative or \
                             greater than the number of child units in refNode."); //@todo turn into decent apf error
            //#endif
            return;
        }
        //#endif
        
        if (charNode[this.startContainer.nodeType])
            this.startContainer.removeEventListener("DOMCharacterDataModified", this.$domCharModS);
            //@todo
        else {
            this.startContainer.removeEventListener("DOMNodeInserted", this.$domNodeInsS);
            this.startContainer.removeEventListener("DOMNodeRemoved",  this.$domNodeRemS);
        }

        this.startContainer = refNode;
        this.startOffset    = offset;
        
        this.collapsed      = this.startContainer == this.endContainer 
            && this.startOffset == this.endOffset;
        
        //@todo If start > end -> start = end;
        
        if (charNode[refNode.nodeType])
            refNode.addEventListener("DOMCharacterDataModified", this.$domCharModS);
            //@todo
        else {
            refNode.addEventListener("DOMNodeInserted", this.$domNodeInsS);
            refNode.addEventListener("DOMNodeRemoved",  this.$domNodeRemS);
        }
        
        if (!noEvent)
            this.dispatchEvent("update");
    }
    
    this.setStartBefore = function(refNode){
        this.setStart(this.endContainer.parentNode, apf.getChildNumber(refNode));
    }
    
    this.setStartAfter = function(refNode){
        this.setStart(this.endContainer.parentNode, apf.getChildNumber(refNode) + 1);
    }
    
    /**
     * Sets the attributes describing the end of a Range.
     *DOMException
        INDEX_SIZE_ERR: Raised if offset is negative or greater than the number of child units in refNode. Child units are 16-bit units if refNode is a type of CharacterData node (e.g., a Text or Comment node) or a ProcessingInstruction node. Child units are Nodes in all other cases.
        
        INVALID_STATE_ERR: Raised if detach() has already been invoked on this object.
     */
    this.setEnd = function(refNode, offset, noEvent){
        if (!refNode) return;
        
        //#ifdef __DEBUG
        if (offset < 0 || offset > (charNode[refNode.nodeType] 
          ? refNode.nodeValue.length 
          : refNode.childNodes.length)) {
            //#ifdef __DEBUG_ERROR
            throw new Error("INDEX_SIZE_ERR:  Raised if offset is negative or \
                             greater than the number of child units in refNode."); //@todo turn into decent apf error
            //#endif
            return;
        }
        //#endif
        
        if (charNode[this.endContainer.nodeType])
            this.endContainer.removeEventListener("DOMCharacterDataModified", this.$domCharModE);
            //@todo
        else {
            this.endContainer.removeEventListener("DOMNodeInserted", this.$domNodeInsE);
            this.endContainer.removeEventListener("DOMNodeRemoved",  this.$domNodeRemE);
        }
        
        this.endContainer = refNode;
        this.endOffset    = offset;
        
        this.collapsed      = this.startContainer == this.endContainer 
            && this.startOffset == this.endOffset;
        
        //@todo If start > end -> start = end;
        if (charNode[refNode.nodeType])
            refNode.addEventListener("DOMCharacterDataModified", this.$domCharModE);
            //@todo
        else {
            refNode.addEventListener("DOMNodeInserted", this.$domNodeInsE);
            refNode.addEventListener("DOMNodeRemoved",  this.$domNodeRemE);
        }
        
        if (!noEvent)
            this.dispatchEvent("update");
    }
    
    /**
     * Sets the end position to be before a node.
     */
    this.setEndBefore = function(refNode){
        this.setEnd(this.endContainer.parentNode, apf.getChildNumber(refNode));
    }
    
    /**
     * Sets the end of a Range to be after a node
     */
    this.setEndAfter = function(refNode){
        this.setEnd(this.endContainer.parentNode, apf.getChildNumber(refNode) + 1);
    }
    
    this.collapse = function(toStart){
        if (toStart)
            this.setEnd(this.startContainer, this.startOffset, true);
        else
            this.setStart(this.endContainer, this.endOffset, true);
        
        this.dispatchEvent("update");
    }
    
    this.selectNode = function(refNode){
        this.setStart(refNode.parentNode, apf.getChildNumber(refNode), true);
        this.setEnd(refNode.parentNode, this.startOffset + 1);
    }
    
    this.selectNodeContents = function(refNode){
        this.setStart(refNode, 0, true);
        this.setEnd(refNode, refNode.childNodes.length);
    }
    
    //@todo quite possibly the assumption of end > start is wrong.. fix that...
    this.$contents = function(clone){
        var s = this.startContainer, e = this.endContainer, cA = e.childNodes[this.endOffset], 
            last, simple = s == e;
        
        while (cA && !apf.isChildOf(cA, s, true))
            cA = (last = cA).parentNode;
        
        //#ifdef __DEBUG
        if (!cA) {
             //#ifdef __DEBUG_ERROR
            throw new Error("Range start/end does not have a common ancestor"); //@todo turn into decent apf error
            //#endif
            return;
        }
        //#endif
        
        //last = this.endContainer.childNodes[this.endOffset - 1];
        var collection = [];
        var node = s.childNodes[this.startOffset];
        var doc = this.startContainer.ownerDocument;
        var frag = doc.createDocumentFragment();
        
        //Walk up to the common ancestor
        //@todo s could be a textnode...
        if (s != e && s != cA) {
            var pNode = s.cloneNode(false);
            while (node.parentNode != cA) {
                pNode.appendChild(clone ? node.cloneNode(true) : node);
                if (!node.nextSibling) {
                    do {
                        node = node.parentNode;
                        pNode = node.cloneNode(false).appendChild(pNode).parentNode;
                    } while(!node.nextSibling);
                    if (node.parentNode == cA)
                        break;
                }
                node = node.nextSibling;
            }
            frag.appendChild(pNode);
        }
        
        //Walk to the peer
        while (node != last) {
            node = node.nextSibling
            frag.appendChild(clone ? node.cloneNode(true) : node);
        }
        
        //Walk up from the end container
        //@todo e could be a textnode...
        if (s != e && e != cA) {
            var pNode = e.cloneNode(false);
            var node  = last.previousSibling || last.parentNode;//this.endOffset > 0 ? e.childNodes[this.endOffset - 1] : e;
            while (node.parentNode != cA) {
                pNode.appendChild(clone ? node.cloneNode(true) : node);
                if (!node.previousSibling) {
                    do {
                        node = node.parentNode;
                        pNode = node.cloneNode(false).appendChild(pNode).parentNode;
                    } while(!node.previousSibling);
                    if (node.parentNode == cA)
                        break;
                }
                node = node.previousSibling;
            }
            frag.appendChild(pNode);
        }
        
        return frag;
    }
    
    /**
     * Compare the boundary-points of two Ranges in a document.
     * @return -1, 0 or 1 depending on whether the corresponding boundary-point 
     *         of the Range is respectively before, equal to, or after the 
     *         corresponding boundary-point of sourceRange.
     */
    this.compareBoundaryPoints = function(how, sourceRange){
        var d;
        switch(how) {
            case this.START_TO_START:
                d = this.startOffset - sourceRange.startOffset;
            break;
            case this.START_TO_END:
                d = this.startOffset - sourceRange.endOffset;
            break;
            case this.END_TO_START:
                d = this.endOffset - sourceRange.startOffset;
            break;
            case this.END_TO_END:
                d = this.endOffset - sourceRange.endOffset;
            break;
        }
        
        return d < 0 ? -1 : (d > 0 ? 1 : 0);
    }
    
    this.deleteContents = function(){
        this.$contents().destroy();
        this.collapse();
    }
    
    this.extractContents = function(){
        var frag = this.$contents();
        this.collapse();
        return frag;
    }
    
    this.cloneContents = function(){
        return this.$contents(true);
    }
    
    /**
     * Inserts a node into the Document or DocumentFragment at the start of the 
     * Range. If the container is a Text node, this will be split at the start 
     * of the Range (as if the Text node's splitText method was performed at the 
     * insertion point) and the insertion will occur between the two resulting 
     * Text nodes. Adjacent Text nodes will not be automatically merged. If the 
     * node to be inserted is a DocumentFragment node, the children will be 
     * inserted rather than the DocumentFragment node itself.
     */
    this.insertNode = function(newNode){
        //@todo
        this.collapsed = false;
    }
    
    this.surroundContents = function(newParent){
        this.setStart(newParent, newParent.childNodes.length, true);
        newParent.appendChild(this.$contents());
        this.setEnd(newParent, newParent.childNodes.length);
    }
    
    this.cloneRange = function(){
        var range = new apf.AmlRange();
        range.setStart(this.startContainer, this.startOffset, true);
        range.setEnd(this.endContainer, this.endOffset);
        return range;
    }
    
    this.detach = function(){
        this.startContainer = this.endContainer = null;
        
        function detachError(){
            //#ifdef __DEBUG_ERROR
            throw new Error("INVALID_STATE_ERR: Raised if detach() \
                             has already been invoked on this object."); //@todo turn into decent apf error
            //#endif
        }

        for (var prop in this) {
            if (typeof this[prop] == "function" && this[prop] != apf.Class.prototype[prop])
                this[prop] = detachError;
        }
        
        this.$ownerDocument.removeEventListener("DOMNodeRemoved", this.$domNodeRemDoc);
        
        if (this.startContainer) {
            if (charNode[this.startContainer.nodeType])
                this.startContainer.removeEventListener("DOMCharacterDataModified", this.$domCharModS);
                //@todo
            else {
                this.startContainer.removeEventListener("DOMNodeInserted", this.$domNodeInsS);
                this.startContainer.removeEventListener("DOMNodeRemoved",  this.$domNodeRemS);
            }
            
            if (charNode[this.endContainer.nodeType])
                this.endContainer.removeEventListener("DOMCharacterDataModified", this.$domCharModE);
                //@todo
            else {
                this.endContainer.removeEventListener("DOMNodeInserted", this.$domNodeInsE);
                this.endContainer.removeEventListener("DOMNodeRemoved",  this.$domNodeRemE);
            }
        }
    }
}).call(apf.AmlRange.prototype = new apf.Class());
// #endif