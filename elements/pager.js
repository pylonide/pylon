jpf.pager = jpf.component(jpf.NODE_VISIBLE, function() {
    this.range      = 5;
    this.curpage    = 1;
    this.totalpages = 0;
    
    var pages = [];
    var _self = this;
    
    this.$supportedProperties.push("range", "onbeforepagechange", "onafterpagechange");

    this.$propHandlers["curpage"] = function(value) {
        if (parseInt(value))
            this.thumbheight = parseInt(value);
    }

    this.selectPage = function(e) {
        var selectedPage = this.curpage = parseInt(e.innerHTML);

        this.dispatchEvent("onbeforepagechange", {page:selectedPage});
        this.$model.loadFrom(this.pageload, null, {
            page     : selectedPage,
            callback : function(){
                _self.dispatchEvent("onafterpagechange", {page:selectedPage});
            }
        });
    };
    
    this.next = function() {
        
    };

    this.$draw  = function() {
        this.oExt = this.$getExternal("main", null, function(oExt) {
            var oContent  = this.$getLayoutNode("main", "content", oExt);
            var oPages = this.$getLayoutNode("main", "pages", oExt);
        });

        this.oContent = this.$getLayoutNode("main", "content",  this.oExt);
        this.oPages = this.$getLayoutNode("main", "pages",  this.oExt);
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
    };
    
    this.$loadJml = function(x) {
        var nodes = x.childNodes;
        jpf.JmlParser.parseChildren(x, null, this);
    };
    
    

    this.$load = function(xmlRoot) {
        var curpage = parseInt(this.applyRuleSetOnNode("current", xmlRoot));
        var totalpages = parseInt(this.applyRuleSetOnNode("total", xmlRoot));
        var r2 = Math.floor(this.range / 2);


        var r = r >= totalpages 
            ? totalpages 
            : parseInt(this.range);
            
        var start = r >= totalpages
            ? 1
            : (curpage - r2 > 1 && curpage + r2 <= totalpages
                ? curpage - r2 
                : (curpage - r2 < 0
                    ? 1
                    : (curpage + r2 > totalpages 
                        ? totalpages - r + 1 
                        : 1)));

        var margin = null, diff = null, width = null, height = null, pageAreaSize = [0, 0];
        
        var previous = this.oPages.appendChild(document.createElement("div"));
            previous.className = "page previous";
            previous.innerHTML = "prev";
            margin = jpf.getMargin(previous);
            diff = jpf.getDiff(previous);
            width = parseInt(jpf.getStyle(previous, "width")); 
            pageAreaSize[0] += margin[0] + diff[0] + width;

        for (var i = start, page; i < start + r; i++) {
            page = this.oPages.appendChild(document.createElement("div"));
            page.innerHTML = i;
            page.className = "page" + (i == curpage ? " selected" : "");
            
            if (i == start) {
                margin = jpf.getMargin(page);
                diff = jpf.getDiff(page);
                width = parseInt(jpf.getStyle(page, "width")); 
                height = parseInt(jpf.getStyle(page, "height"));
                
                pageAreaSize[0] += margin[0] + diff[0] + width;
                pageAreaSize[1] += margin[1] + diff[1] + height;
            }
            else {
                pageAreaSize[0] += margin[0] + diff[0] + width;
            }
            
            page.onclick = function(e) {
                _self.selectPage(this);
            }
        }
        
        var next = this.oPages.appendChild(document.createElement("div"));
            next.className = "page next";
            next.innerHTML = "next";
            margin = jpf.getMargin(next);
            diff = jpf.getDiff(next);
            width = parseInt(jpf.getStyle(next, "width")); 
            pageAreaSize[0] += margin[0] + diff[0] + width;
        
        this.oPages.style.width = pageAreaSize[0] + "px";
        this.oPages.style.height = pageAreaSize[1] + "px";
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
