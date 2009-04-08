//#ifdef __JACCORDION
jpf.accordion = jpf.component(jpf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    var content = null;
    var _self = this;
    
    /**** DOM Hooks ****/
    var insertChild;
    
    this.$domHandlers["removechild"].push(function(jmlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;

    });
    
    this.$domHandlers["insert"].push(insertChild = function (jmlNode, beforeNode, withinParent){
        if (jmlNode.tagName != "panel")
            return;
        
        jmlNode.$propHandlers["caption"] = function(value){
            jpf.xmldb.setNodeValue(
                this.$getLayoutNode("panel", "caption", this.oExt), value);
        }
        jmlNode.$propHandlers["icon"] = function(value){
            var oIcon = this.$getLayoutNode("panel", "icon", this.oExt);
            if (!oIcon) return;
        
            if (value)
                this.$setStyleClass(this.oExt, this.baseCSSname + "Icon");
            else
                this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Icon"]);
            
            if (oIcon.tagName == "img") 
                oIcon.setAttribute("src", value ? this.iconPath + value : "");
            else {
                oIcon.style.backgroundImage = value 
                    ? "url(" + this.iconPath + value + ")"
                    : "";
            }
        }
    });

    /**** Private Methods *****/

    this.$enable  = function() {
        
    };
    this.$disable = function() {
        
    };

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.oTitle = 

        this.$dir = this.$getOption("main", "direction") || "horizontal";
    };

    this.$loadJml = function(x){
        var bar, tagName, i, l, node, nodes = this.$jml.childNodes;
        
        //Let's not parse our children, when we've already have them
        if (!this.oInt && this.childNodes.length) 
            return;
        
        //@todo Skin switching here...
        
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1) 
                continue;
            
            tagName = node[jpf.TAGNAME];
            if (tagName == "panel") {
                bar = new jpf.panel(this.oInt, tagName);
                
                this.$getNewContext("title");
                var oTitle = this.oInt.appendChild(this.$getLayoutNode("title"));
                
                bar.skinName = this.skinName
                insertChild.call(this, bar);
                bar.loadJml(node, this);
                

            }
            else if (tagName == "progressbar") {
                new jpf.progressbar(this.oInt, tagName).loadJml(node, this);
            }
        }
        
        /*if (bar) {
            this.$setStyleClass(bar.oExt, bar.baseCSSname + "Last");
        }*/
    };

    this.$destroy = function(){

    };
}).implement(jpf.Presentation);

// #endif
