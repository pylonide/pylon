jpf.pager = jpf.component(jpf.NODE_VISIBLE, function() {
    this.previous   = "Previous";
    this.next       = "Next";
    this.range      = 5;
    this.curpage    = 1;
    this.totalpages = 0;
    
    var pages = [];
    var _self = this;
    
    this.$supportedProperties.push("range", "curpage", "totalpages", 
        "previous", "next");

    this.gotoPage = function(pageNr, pageDelta) {
        this.curpage = pageNr || this.curpage + pageDelta;
        
        //Sanity checks
        if (this.curpage < 1) 
            this.curpage = 1;
        else if (this.curpage > this.totalpages) 
            this.curpage = this.totalpages;
        
        this.dispatchEvent("onbeforepagechange", {page:pageNr});
        this.getModel(true).loadFrom(this.pageload, null, {
            page     : pageNr,
            callback : function(){
                _self.dispatchEvent("onafterpagechange", {page:pageNr});
            }
        });
    };
    
    this.$draw  = function() {
        this.oExt = this.$getExternal("main");
        this.oInt = this.$getLayoutNode("main", "container",  this.oExt);
    };
    
    this.$loadJml = function(x) {
        var nodes = x.childNodes;
        jpf.JmlParser.parseChildren(x, null, this);
    };
    
    this.$load = function(xmlRoot) {
        this.setProperty("curpage", parseInt(this.applyRuleSetOnNode("current", xmlRoot)));
        this.setProperty("totalpages", parseInt(this.applyRuleSetOnNode("total", xmlRoot)));
        
        var curpage = this.curpage;
        var totalpages = this.totalpages;
        var btn, nodes = [];
        
        this.oInt.innerHTML = "";
        
        if (curpage != 1) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = this.previous;
            this.$setStyleClass(btn, "previous");
            btn.setAttribute("onclick", "jpf.lookup(" + this.uniqueId + ").gotoPage(null, -1)");
            nodes.push(btn);
        }
        
        var rlow  = Math.floor(this.range / 2);
        var rhigh = Math.ceil(this.range / 2);
        var start = Math.max(1, curpage - rlow);
        var end   = Math.min(totalpages + 1, start + this.range);
        
        for (var i = start, page; i < end; i++) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = i;
            btn.setAttribute("onclick", "jpf.lookup(" + this.uniqueId + ").gotoPage(" + i + ")");
            nodes.push(btn);
            
            if (i == curpage)
                this.$setStyleClass(btn, "current");
        }
        
        if (curpage != totalpages) {
            this.$getNewContext("button");
            btn = this.$getLayoutNode("button");
            this.$getLayoutNode("button", "caption").nodeValue = this.next;
            this.$setStyleClass(btn, "next");
            btn.setAttribute("onclick", "jpf.lookup(" + this.uniqueId + ").gotoPage(null, 1)");
            nodes.push(btn);
        }
        
        jpf.xmldb.htmlImport(nodes, this.oInt);
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
    jpf.Presentation, 
    jpf.DataBinding
);
