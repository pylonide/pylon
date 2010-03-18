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

// #ifdef __AMLPAGER || __INC_ALL

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
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
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
apf.pager = function(struct, tagName){
    this.$init(tagName || "pager", apf.NODE_VISIBLE, struct);
};

(function() {
    this.previous   = "Previous";
    this.next       = "Next";
    this.range      = 5;
    this.curpage    = 1;
    this.totalpages = 0;
    this.autohide   = false;
    this.oEmpty     = null;
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        pageload : 1
    }, this.$attrExcludePropBind);
    
    this.$supportedProperties.push("range", "curpage", "totalpages", 
        "previous", "next", "autohide", "pageload");
        
    this.$booleanProperties["autohide"] = true;
    
    this.$propHandlers["curpage"] = function(value){
        this.gotoPage(value);
    };

    /**
     * Selects page depends on its number or jump length
     * 
     * @param {Number} pageNr      number of choosen page
     * @param {Number} pageDelta   length of jump which should be done between
     *                             current page and new selected page
     */
    this.gotoPage = function(pageNr, pageDelta, userAction) {
        if (userAction && this.disabled)
            return;
        
        var lastCurpage = this.curpage;
        this.curpage    = pageNr || this.curpage + pageDelta;
        if (lastCurpage != this.curpage)
            this.setProperty("curpage", this.curpage);

        //Sanity checks
        if (this.curpage < 1) 
            this.curpage = 1;
        else if (this.totalpages && this.curpage > this.totalpages) 
            this.curpage = this.totalpages;
        
        if (this.dispatchEvent("beforepagechange", {page:this.curpage}) === false)
            return false;
        
        var model = this.getModel(true),
            _self = this;
        if (model) {
            model.$loadFrom(this.pageload, {
                xmlNode  : this.xmlRoot,
                page     : this.curpage,
                callback : function(){
                    _self.dispatchEvent("afterpagechange", {page:_self.curpage});
                }
            });
        }
        else {
            //@todo is this the best way to detect a model?
            $setTimeout(function(){
                var model = _self.getModel(true);
                if (model) {
                    model.$loadFrom(_self.pageload, {
                        xmlNode  : _self.xmlRoot,
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
    
    this.addEventListener("$clear", function(e){
        return false;
    });
    
    this.$setClearMessage = function(msg, type){
        if (!this.$empty) {
            this.$empty = this.$container.ownerDocument.createElement("span");
            this.$setStyleClass(this.$empty, "loader");
        }
        
        if (type == "loading") {
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Loading");
            this.$container.appendChild(this.$empty);
        }
    }
    
    this.$removeClearMessage = function(){
        if (this.$empty && this.$empty.parentNode) {
            this.$empty.parentNode.removeChild(this.$empty);
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Loading"]);
        }
    }
    
    this.$draw  = function() {
        this.$ext = this.$getExternal("main");
        this.$container = this.$getLayoutNode("main", "container",  this.$ext);
    };
    
    this.$load = function(xmlRoot) {
        this.setProperty("curpage",    parseInt(this.$applyBindRule("current", xmlRoot)));
        this.setProperty("totalpages", parseInt(this.$applyBindRule("total", xmlRoot)));
        
        var curpage    = this.curpage,
            totalpages = this.totalpages,
            nodes      = [],
            btn;
        
        this.$container.innerHTML = "";
        
        if (!totalpages)
            return;

        if (curpage != 1 || !this.autohide) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = this.previous;
            this.$setStyleClass(btn, "previous");
            
            if (curpage != 1) {
                btn.setAttribute("onclick", "apf.lookup(" + this.$uniqueId
                    + ").gotoPage(null, -1, true)");
                btn.setAttribute("onmousedown", 'apf.setStyleClass(this, "down");');
                btn.setAttribute("onmouseup", 'apf.setStyleClass(this,"", ["down"]);');
            }
            else {
                this.$setStyleClass(btn, "disabled");
            }

            nodes.push(btn);
        }
        
        var rlow  = Math.floor(this.range / 2),
        //    rhigh = Math.ceil(this.range / 2);
            start = Math.max(1, curpage - rlow),
            end   = Math.min(totalpages + 1, start + this.range),
            i;
        if (end - start < this.range && start != 1)
            start = Math.max(end - this.range, 1);
        
        for (i = start; i < end; i++) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = i;
            btn.setAttribute("onclick", "apf.lookup(" + this.$uniqueId
                + ").gotoPage(" + i + ", null, true)");
            btn.setAttribute("onmousedown", 'apf.setStyleClass(this, "down");');
            btn.setAttribute("onmouseup", 'apf.setStyleClass(this,"", ["down"]);');
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
                btn.setAttribute("onclick", "apf.lookup(" + this.$uniqueId
                    + ").gotoPage(null, 1, true)");
                btn.setAttribute("onmousedown", 'apf.setStyleClass(this, "down");');
                btn.setAttribute("onmouseup", 'apf.setStyleClass(this,"", ["down"]);');
            }
            else {
                this.$setStyleClass(btn, "disabled");
            }

            nodes.push(btn);
        }
        
        apf.insertHtmlNodes(nodes, this.$container);
        
        if (this.$empty)
            this.$container.appendChild(this.$empty);
    }
    
// #ifdef __WITH_DATABINDING
}).call(apf.pager.prototype = new apf.StandardBinding());
/* #else
}).call(apf.pager.prototype = new apf.Presentation());
#endif */

apf.aml.setElement("pager",   apf.pager);
apf.aml.setElement("total",   apf.BindingRule);
apf.aml.setElement("current", apf.BindingRule);
// #endif
