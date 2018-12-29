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

// #ifdef __WITH_AMLSELECTION
apf.AmlSelection = function(doc){
    this.$init();
    
    this.$ownerDocument = doc;
    
    var _self = this;
    var monitor = false;
    this.$monitorRange = function(){
        apf.queue.add("selrange" + this.$uniqueId, function(){
            var range = _self.$ranges[0];
            _self.anchorNode   = range.startContainer;
            _self.anchorOffset = range.startOffset;
            
            range = _self.$ranges[_self.rangeCount - 1];
            _self.focusNode    = range.endContainer;
            _self.focusOffset  = range.endOffset;
            monitor = false;
        });
        monitor = true;
    }
    
    var update = false;
    this.$update = function(){
        if (!update) {
            apf.queue.add("selupdate" + this.$uniqueId, function(){
                _self.dispatchEvent("update");
                update = false;
            });
            update = true;
        }
    }
};
(function() {
    /**
     * Returns the element that contains the start of the selection.
     * Returns null if there's no selection.
     */
    this.anchorNode   = null;
    
    /**
     * Returns the offset of the start of the selection relative to the element that contains the start of the selection.
     * Returns 0 if there's no selection.
     */
    this.anchorOffset = 0;
    
    /**
     * Returns the element that contains the end of the selection.
     * Returns null if there's no selection.
     */
    this.focusNode    = null;
    
    /**
     * Returns the offset of the end of the selection relative to the element that contains the end of the selection.
     *Returns 0 if there's no selection.
     */
    this.focusOffset  = null;
    
    /**
     * Returns the number of ranges in the selection.
     */
    this.rangeCount   = 0;
    this.$ranges      = [];
    
    this.toString = function(){
        return "[apf.AmlSelection]";// this.$ranges.join("");
    }
    
    /**
     * Returns true if there's no selection or if the selection is empty. Otherwise, returns false.
     */
    this.isCollapsed = function(){
        return !this.rangeCount || this.rangeCount == 1 && this.$ranges[0].collapsed;
    }
    
    /**
     * Replaces the selection with an empty one at the given position.
     */
    this.collapse = function(parentNode, offset, noEvent){
        for (var i = 0, l = this.$ranges.length; i < l; i++) {
            (range = this.$ranges[i]).removeEventListener("update", this.$monitorRange);
            range.detach();
        }
        
        var range;
        this.$ranges = [range = new apf.AmlRange(this.ownerDocument)];
        range.addEventListener("update", this.$monitorRange);
        range.setStart(parentNode, offset);
        range.setEnd(parentNode, offset);
        this.rangeCount = 1;
        
        this.focusNode    = 
        this.anchorNode   = parentNode;
        this.anchorOffset = 
        this.focusOffset  = offset;
        
        if (!noEvent)
            this.dispatchEvent("update");
    }
    
    /**
     * Replaces the selection with an empty one at the position of the start of the current selection.
     */
    this.collapseToStart = function(){
        //#ifdef __DEBUG
        if (!this.rangeCount) {
            //#ifdef __DEBUG_ERROR
            throw new Error("The selection has no ranges");
            //#endif
            return;
        }
        //#endif
        
        var range = this.$ranges[0];
        this.collapse(range.startContainer, range.startOffset);
    }
    
    /**
     * Replaces the selection with an empty one at the position of the end of the current selection.
     */
    this.collapseToEnd = function(){
        //#ifdef __DEBUG
        if (!this.rangeCount) {
            //#ifdef __DEBUG_ERROR
            throw new Error("The selection has no ranges");
            //#endif
            return;
        }
        //#endif
        
        var range = this.$ranges[this.rangeCount - 1];
        this.collapse(range.endContainer, range.endOffset);
    }
    
    /**
     * Replaces the selection with one that contains all the contents of the given element.
     */
    this.selectAllChildren = function(parentNode){
        this.collapse(parentNode, 0, true);
        var range = this.$ranges[0];
        range.selectNodeContents(parseNode);
        
        this.focusNode    = 
        this.anchorNode   = parentNode;
        this.anchorOffset = 0;
        this.focusOffset  = range.endOffset;
        
        this.$update();
    }
    
    /**
     * Deletes the selection.
     */
    this.deleteFromDocument = function(){
        for (var i = 0, l = this.$ranges.length; i < l; i++) {
            this.$ranges[i].deleteContents();
        }
        
        var range = this.$ranges[0];
        this.anchorNode   = range.startContainer;
        this.anchorOffset = range.startOffset;
        
        range = this.$ranges[this.rangeCount - 1];
        this.focusNode    = range.endContainer;
        this.focusOffset  = range.endOffset;
        
        this.$update();
    }
    
    /**
     * Returns the given range.
     */
    this.getRangeAt = function(index){
        //#ifdef __DEBUG_ERROR
        if (index < 0 || index > this.rangeCount - 1)
            throw new Error("INDEX_SIZE_ERR");
        //#endif
        
        return this.$ranges[index];
    }
    
    /**
     * Adds the given range to the selection.
     */
    this.addRange = function(range){
        this.rangeCount = this.$ranges.push(range);
        
        this.focusNode    = range.endContainer;
        this.focusOffset  = range.endOffset;
        range.addEventListener("update", this.$monitorRange);
        
        this.$update();
        
        return range;
    }
    
    /**
     * Removes the given range from the selection, if the range was one of the ones in the selection.
     */
    this.removeRange = function(range){
        this.$ranges.remove(range);
        this.rangeCount = this.$ranges.length;
        range.removeEventListener("update", this.$monitorRange);
        
        var range = this.$ranges[0];
        this.anchorNode   = range.startContainer;
        this.anchorOffset = range.startOffset;
        
        range = this.$ranges[this.rangeCount - 1];
        this.focusNode    = range.endContainer;
        this.focusOffset  = range.endOffset;
        
        this.$update();
    }
    
    /**
     * Removes all the ranges in the selection.
     */
    this.removeAllRanges = function(){
        for (var range, i = 0, l = this.$ranges.length; i < l; i++) {
            (range = this.$ranges[i]).removeEventListener("update", this.$monitorRange);
            range.detach();
        }
        
        this.$ranges    = [];
        this.rangeCount = 0;
        
        this.anchorNode   = null;
        this.anchorOffset = 0;
        this.focusNode    = null;
        this.focusOffset  = 0;
        
        this.$update();
    }
    
    //currently only ranges with single element selected is supported
    this.$getNodeList = function(){
        var nodes = [];
        for (var r, i = 0; i < this.rangeCount; i++) {
            nodes.push((r = this.$ranges[i]).startContainer.childNodes[r.startOffset]);
        }
        return nodes;
    }
    
    this.$selectList = function(list){
        this.removeAllRanges();
        for (var i = 0; i < list.length; i++) {
            this.addRange(new apf.AmlRange(this)).selectNode(list[i]);
        }
    }
    
    this.$getFirstNode = function(){
        var r;
        return (r = this.$ranges[0]).startContainer.childNodes[r.startOffset];
    }
}).call(apf.AmlSelection.prototype = new apf.Class());
// #endif