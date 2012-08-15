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

//#ifdef __WITH_CLIPBOARD

apf.clipboard = new apf.Class().$init();
apf.clipboard.store = null;
apf.clipboard.empty = true;
apf.clipboard.copied = null;
apf.clipboard.put = function(item){
    this.store = item;
    this.setProperty("data", item);
    this.setProperty("empty", item ? false : true);
};
apf.clipboard.clear = function(){
    this.setProperty("data", null);
    this.setProperty("empty", true);
}
apf.clipboard.get = function(){
    return this.store;
};

//#ifdef __WITH_CLIPBOARD_SELECTION
apf.clipboard.$highlightSelection = function(amlNode, nodes, unset){
    for (var i = 0, l = nodes.length; i < l; i++) {
        apf.setStyleClass(apf.xmldb.getHtmlNode(nodes[i], amlNode), (unset ? '' : 'cut'), ['cut']);
    }
}
apf.clipboard.copySelection = function(amlNode){
    var nodes = this.get() || [];
    this.$highlightSelection(amlNode, nodes, true);
    this.put(amlNode.getSelection().map(function (node) {
        return apf.xmldb.getCleanCopy(node);
    }));
    this.copied = true;
};
apf.clipboard.cutSelection = function(amlNode){
    var nodes = this.get() || [];
    this.$highlightSelection(amlNode, nodes, true);
    this.put(nodes = amlNode.getSelection());
    this.$highlightSelection(amlNode, nodes);
    this.copied = false;
};
apf.clipboard.pasteSelection = function(amlNode, selected){
    var copied, nodes = this.get();
    if (!nodes) return;

    if (!selected)
        selected = amlNode.selected || amlNode.getFirstTraverseNode();

    if (amlNode.hasFeature(apf.__DRAGDROP__)) {
        var candrop = amlNode.isDropAllowed(apf.clipboard.data, selected);
        if (!candrop)
            return false;
        var action = candrop[1] && candrop[1].action 
          || (amlNode.$isTreeArch ? "tree-append" : "list-append");
         
        copied = nodes.slice(0);
        amlNode.$dragDrop(selected, copied, candrop && candrop[1], action, 
            null, null, null, this.copied);
        
        //amlNode.copy(nodes, selected, undefined, !this.copied);
    }
    else {
        if (nodes[0].parentNode) {
            for (var i = 0, l = nodes.length; i < l; i++) {
                apf.xmldb.moveNode(selected, nodes[i]);
            }
        }
        else {
            copied = [];
            for (var i = 0, l = nodes.length; i < l; i++) {
                copied[i] = apf.xmldb.appendChild(selected, nodes[i]);
            }
        }
    }
    
    if (!this.copied) {
        this.$highlightSelection(amlNode, nodes, true);
        apf.clipboard.clear();
    }
    
    amlNode.selectList(copied || nodes);
};
//#endif

//#endif
