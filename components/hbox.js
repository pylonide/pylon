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
// #ifdef __JHBOX || __JVBOX || __INC_ALL

/**
 * @define vbox
 * @define hbox
 */
jpf.hbox = jpf.vbox = function(pHtmlNode, tagName){
    jpf.register(this, tagName, jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    //#ifdef __WITH_SPLITTERS
    
    function checkSplitters(node){
        var lastNode = node.children[node.children.length - 1];
        if (lastNode.splitter && node.parent) {
            var p = node;
            p.splitter = lastNode.splitter;
            p.edgeMargin = Math.max(p.edgeMargin, p.splitter);
            lastNode.splitter = null;
            
            if (p.parent && p.stackId == p.parent.children.length - 1) {
                p.parent.splitter = p.splitter;
                p.parent.edgeMargin = Math.max(p.parent.edgeMargin, p.parent.splitter);
                p.splitter = null;
            }
        }
        var firstNode = node.children[0];
        if (firstNode && node.parent) {
            if (node.vbox) {
                node.fwidth = firstNode.fwidth;
                firstNode.fwidth = null;
            }
            else {
                node.fheight = firstNode.fheight;
                firstNode.fheight = null;
            }
            node.weight = firstNode.weight;
        }
        
        for (var i = 0; i < node.children.length; i++) {
            if (!node.children[i].node) 
                checkSplitters(node.children[i]);
        }
    }
    //#endif
    
    this.compileAlignment = function(){
        var n = this.aData.children;
        for (var f = false, i = 0; i < n.length; i++) {
            if (n[i].template == "bottom") {
                if (n[i].splitter) {
                    n[i - 1].splitter = n[i].splitter;
                    n[i - 1].edgeMargin = Math.max(n[i - 1].edgeMargin, n[i - 1].splitter);
                    n[i].splitter = null;
                }
            }
        }
        
        //#ifdef __WITH_SPLITTERS
        checkSplitters(this.aData);
        //#endif
        
        jpf.layoutServer.compile(pHtmlNode);
    }
    
    this.addAlignNode = function(jmlNode){
        var align = jmlNode.jml.getAttribute("align").split("-");
        var s = this.aData.children;
        var a = jmlNode.aData;
        if (align[1] == "splitter") {
            a.splitter = align[2] || 5;
            a.edgeMargin = Math.max(a.edgeMargin, a.splitter);
        }
        align = align[0];
        a.template = align;
        
        if (align == "top") {
            for (var p = s.length, i = 0; i < s.length; i++) {
                if (s[i].template != "top") {
                    p = i;
                    break;
                }
            }
            for (var i = s.length - 1; i > p; i++) {
                s[i + 1] = s[i];
                s[i].stackId = i + 1;
            }
            
            s[p] = a;
            s[p].stackId = p;
            a.parent = this.aData;
        }
        else 
            if (align == "bottom") {
                a.stackId = s.push(a) - 1;
                a.parent = this.aData;
            }
            else {
                //find hbox
                var hbox = null;
                for (var p = 0, i = 0; i < s.length; i++) {
                    if (s[i].hbox) {
                        hbox = s[i];
                        break;
                    }
                    else 
                        if (s[i].node && s[i].template == "top") 
                            p = i;
                }
                
                //create hbox
                if (!hbox) {
                    var hbox = new jpf.hbox(this.pHtmlNode, "hbox");
                    hbox.loadJML(jpf.xmldb.getXml("<hbox />"));
                    hbox.parentNode = this;
                    hbox.aData.jmlNode = hbox;
                    hbox = hbox.aData;
                    hbox.parent = this.aData;
                    if (p) {
                        for (var i = s.length - 1; i > p; i--) {
                            s[i + 1] = s[i];
                            s[i].stackId++;
                        }
                        s[p + 1] = hbox;
                        hbox.stackId = p + 1;
                    }
                    else 
                        hbox.stackId = s.push(hbox) - 1;
                }
                
                //find col
                var col, n = hbox.children;
                for (var i = 0; i < n.length; i++) {
                    if (n[i].template == align) {
                        col = n[i];
                        break;
                    }
                }
                
                //create col
                if (!col) {
                    var col = new jpf.vbox(this.pHtmlNode, "vbox");
                    col.loadJML(jpf.xmldb.getXml("<vbox />"));
                    col.parentNode = hbox.jmlNode;
                    col = col.aData;
                    col.parent = hbox;
                    col.template = align;
                    
                    if (align == "left") {
                        n.unshift(col);
                        for (var i = 0; i < n.length; i++) 
                            n[i].stackId = i;
                    }
                    else 
                        if (align == "right") 
                            col.stackId = n.push(col) - 1;
                        else 
                            if (align == "middle") {
                                for (var f, i = 0; i < n.length; i++) 
                                    if (n[i].template == "right") 
                                        f = i;
                                var rcol = n[f];
                                if (rcol) {
                                    n[f] = col;
                                    col.stackId = f;
                                    rcol.stackId = n.push(rcol) - 1;
                                }
                                else {
                                    col.stackId = n.push(col) - 1;
                                }
                            }
                }
                
                a.stackId = col.children.push(a) - 1;
                a.parent = col;
            }
    }
    
    /* *********
     INIT
     **********/
    //inheriting might needs to be reconsidered
    //this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.loadJML = function(x, pJmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        
        if (x) {
            if (!this.parentNode) 
                this.parentNode = pJmlNode;
            this.jml = x;
        }
        else 
            x = this.jml;
        
        this.inherit(jpf.JmlDomAPI); /** @inherits jpf.JmlDomAPI */
        this.oInt = this.oExt = 
          (this.jml.parentNode.lastChild == this.jml.parentNode.firstChild) 
            ? pHtmlNode 
            : pHtmlNode.appendChild(document.createElement("div"));
        if (this.jml.getAttribute("cssclass")) 
            this.oExt.className = this.jml.getAttribute("cssclass");
        
        if (id) 
            this.oExt.setAttribute("id", id);
        
        //TBD: discuss renaming 'drawed' to 'drawn' <-- Improve English :P
        this.drawed = true;
        this.dispatchEvent("ondraw");
        
        var l      = jpf.layoutServer.get(pHtmlNode, (x.getAttribute("margin") || "").split(/,\s*/));
        this.aData = jpf.layoutServer.parseXml(x, l, null, true);
        
        this.oInt  = jpf.JMLParser.parseChildren(x, pHtmlNode, this);
        
        if (!this.parentNode) 
            return;
        
        if (!this.parentNode.tagName 
          || !this.parentNode.tagName.match(/^(?:vbox|hbox)$/)) {
            l.root = this.aData;
            
            if (this.aData.children.length) 
                jpf.layoutServer.compile(pHtmlNode);
            //if(jpf.JMLParser.loaded) 
            //jpf.layoutServer.activateRules(pHtmlNode);
        }
        else {
            this.aData.stackId = this.parentNode.aData.children.push(this.aData) - 1;
            this.aData.parent  = this.parentNode.aData;
        }
    }
}

// #endif
