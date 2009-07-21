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

/**
 * This elements displays buttons which can be used to navigate between some
 * parts of data, for example between parts of article
 * 
 * @define pager
 * @attribute {String} range      determines how much page buttons is displayed 
 * @attribute {String} previous   determines the caption of "go to previous page" button
 * @attribute {String} next       determines the caption of "go to next page" button
 * 
 * @inherits apf.Presentation
 * @inherits apf.DataBinding
 * 
 * @author      
 * @version     %I%, %G% 
 * 
 * @define bindings
 * @allowchild current, total
 *
 * @binding current      Determines which page is currently selected
 * @binding total        Determines the number of pages.
 * 
 */
apf.pager = apf.component(apf.NODE_VISIBLE, function() {
    this.previous   = "Previous";
    this.next       = "Next";
    this.range      = 5;
    this.curpage    = 1;
    this.totalpages = 0;
    this.autohide   = true;
    
    var pages = [];
    var _self = this;
    
    this.$supportedProperties.push("range", "curpage", "totalpages", 
        "previous", "next", "autohide");
        
    this.$booleanProperties["autohide"] = true;
    
    /**
     * @attribute {String} represent the id of the element to display 
     * navigation for.
     */
    this.$propHandlers["curpage"] = function(value){
        this.gotoPage(value);
    }

    /**
     * Selects page depends on its number or jump length
     * 
     * @param {Number} pageNr      number of choosen page
     * @param {Number} pageDelta   length of jump which should be done between
     *                             current page and new selected page
     */
    this.gotoPage = function(pageNr, pageDelta) {
        var lastCurpage = this.curpage;
        this.curpage = pageNr || this.curpage + pageDelta;
        if (lastCurpage != this.curpage)
            this.setProperty("curpage", this.curpage);

        //Sanity checks
        if (this.curpage < 1) 
            this.curpage = 1;
        else if (this.totalpages && this.curpage > this.totalpages) 
            this.curpage = this.totalpages;
        
        if (this.dispatchEvent("beforepagechange", {page:this.curpage}) === false)
            return false;
        
        var model = this.getModel(true);
        if (model) {
            model.loadFrom(this.pageload, this.xmlRoot, {
                page     : this.curpage,
                callback : function(){
                    _self.dispatchEvent("afterpagechange", {page:_self.curpage});
                }
            });
        }
        else {
            //@todo is this the best way to detect a model?
            setTimeout(function(){
                var model = _self.getModel(true);
                if (model) {
                    model.loadFrom(_self.pageload, _self.xmlRoot, {
                        page     : _self.curpage,
                        callback : function(){
                            _self.dispatchEvent("afterpagechange", {page:_self.curpage});
                        }
                    });
                }
                
                _self.removeEventListener("afterload", arguments.callee);
            });
        }
    };
    
    this.$draw  = function() {
        this.oExt = this.$getExternal("main");
        this.oInt = this.$getLayoutNode("main", "container",  this.oExt);
    };
    
    this.$loadAml = function(x) {
        var nodes = x.childNodes;
        apf.AmlParser.parseChildren(x, null, this);
    };
    
    this.$load = function(xmlRoot) {
        this.setProperty("curpage", parseInt(this.applyRuleSetOnNode("current", xmlRoot)));
        this.setProperty("totalpages", parseInt(this.applyRuleSetOnNode("total", xmlRoot)));
        
        var curpage = this.curpage;
        var totalpages = this.totalpages;
        var btn, nodes = [];
        
        this.oInt.innerHTML = "";
        
        if (!totalpages)
            return;
        
        if (curpage != 1 || !this.autohide) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = this.previous;
            this.$setStyleClass(btn, "previous");
            
            if (curpage != 1) {
                btn.setAttribute("onclick", "apf.lookup(" + this.uniqueId + ").gotoPage(null, -1)");
            }
            else {
                this.$setStyleClass(btn, "disabled");
            }

            nodes.push(btn);
        }
        
        var rlow  = Math.floor(this.range / 2);
        var rhigh = Math.ceil(this.range / 2);
        var start = Math.max(1, curpage - rlow);
        var end   = Math.min(totalpages + 1, start + this.range);
        if (end - start < this.range && start != 1)
            start = Math.max(end - this.range, 1);
        
        for (var i = start, page; i < end; i++) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = i;
            btn.setAttribute("onclick", "apf.lookup(" + this.uniqueId + ").gotoPage(" + i + ")");
            nodes.push(btn);
            
            if (i == curpage)
                this.$setStyleClass(btn, "current");
        }
        
        if (curpage != totalpages  || !this.autohide) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = this.next;
            this.$setStyleClass(btn, "next");
            
            if (curpage != totalpages) {
                btn.setAttribute("onclick", "apf.lookup(" + this.uniqueId + ").gotoPage(null, 1)");
            }
            else {
                this.$setStyleClass(btn, "disabled");
            }

            nodes.push(btn);
        }
        
        apf.xmldb.htmlImport(nodes, this.oInt);
    }
    
    var oEmpty;
    this.$setClearMessage = function(msg, className) {
        
    };
    
    this.$removeClearMessage = function() {
        if (!oEmpty)
            oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty && oEmpty.parentNode)
            oEmpty.parentNode.removeChild(oEmpty);
    };
    
}).implement(
    apf.Presentation, 
    apf.DataBinding
);
