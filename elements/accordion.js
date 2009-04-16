//#ifdef __JACCORDION
jpf.accordion = jpf.component(jpf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;

    this.animType  = jpf.tween.NORMAL;
    this.animSpeed = 10;
    this.multiCollapse = true;

    var _self = this;
    /**
     * Keeps all panels
     * panels[oTitle.id] = {}
     */
    var panels     = {};
    /**
     * Id of title from last opened panel
     */
    var lastOpened = null;

    this.$booleanProperties["multi-collapse"] = true;
    
    this.$supportedProperties.push("animation-type", "animation-speed", "multi-collapse");
    
    /**** DOM Hooks ****/
    var insertChild;
    
    this.$domHandlers["removechild"].push(function(jmlNode, doOnlyAdmin) {
        if (doOnlyAdmin)
            return;
    });
    
    this.$domHandlers["insert"].push(insertChild = function (jmlNode, beforeNode, withinParent) {
        if (jmlNode.tagName != "panel")
            return;

        jmlNode.$propHandlers["icon"] = function(value) {
            var oIcon = this.$getLayoutNode("panel", "icon", this.oExt);
            if (!oIcon) return;

            if (oIcon.tagName == "img") 
                oIcon.setAttribute("src", value ? this.iconPath + value : "");
            else {
                oIcon.style.backgroundImage = value 
                    ? "url(" + this.iconPath + value + ")"
                    : "";
            }
        }
    });
    
    this.$propHandlers["animation-type"] = function(value) {
        switch(value) {
            case "normal":
                this.animType = jpf.tween.NORMAL;
                break;
            case "easein":
                this.animaType = jpf.tween.EASEIN;
                break;
            case "easeout":
                this.animType = jpf.tween.EASEOUT;
                break;
        }
    };
    
    this.$propHandlers["animation-speed"] = function(value) {
        this.animSpeed = parseInt(value);
    };
    
    this.$propHandlers["multi-collapse"] = function(value) {
        this.multiCollapse = value;
    };

    /**** Private Methods *****/

    this.$enable  = function() {
        
    };
    this.$disable = function() {
        
    };
    
    /**
     * Toggles the visibility of the container with content. It opens
     * or closes it using a slide effect. (the same for slideDown and slideUp)
     * 
     * @param {Mixed} e   
     * Possible values
     *     {Object}   onmousedown event
     *     {String}   title bar unique name
     */
    this.slideToggle = function(e) {
        e = e || event;
        var target = e.target || e.srcElement;
        var id = target ? target.id : e;

        if (!panels[id])
            return;

        if (panels[id].opened) 
            this.slideUp(e);
        else
            this.slideDown(e);
    };

    this.slideDown = function(e) {
        e = e || event;
        var target = e.target || e.srcElement;
        var id = target ? target.id : e;
        
        if (!panels[id])
            return;
        
        var panel = panels[id];

        _self.$setStyleClass(panel.oTitle, "Active", ["NotActive"]);

        //close opened panel because only one can be opened
        if (!_self.multiCollapse && lastOpened) {
            _self.slideUp(lastOpened);
        }

        lastOpened = id;
        panel.opened = true;
        
        panel.oBody.style.display = "block";
        panel.oBody.style.height = "1px";

        jpf.tween.single(panel.oBody, {
            steps    : 30,
            type     : "scrollheight",
            from     : 0,
            to       : panel.oBody.scrollHeight,
            anim     : _self.animType,
            interval : _self.animSpeed,
            onfinish : function() {
                panel.oBody.style.height = "auto";
            }
        });
    };

    this.slideUp = function(e) {
        e = e || event;
        var target = e.target || e.srcElement;
        var id = target ? target.id : e;
        
        if (!panels[id])
            return;
            
        var panel = panels[id];

        if (!panel.opened)
            return false;

        _self.$setStyleClass(panel.oTitle, "NotActive", ["Active"]);
        
        panel.opened = false;
        
        jpf.tween.single(panel.oBody, {
            steps    : 30,
            type     : "scrollheight",
            from     : panel.oBody.scrollHeight,
            to       : 0,
            anim     : _self.animType,
            interval : _self.animSpeed,
            onfinish : function() {
                panel.oBody.style.display = "none";
            }
        });
      
        return false;
    };

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal("main");
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        this.$dir = this.$getOption("main", "direction") || "horizontal";
    };

    this.$loadJml = function(x) {
        var node, panel, nodes = this.$jml.childNodes;
            
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
                
            if (node.nodeType != 1) 
                continue;

            if (node[jpf.TAGNAME] == "panel") {
                //create panel and load JML to element called container in skin file
                var panel = new jpf.panel(this.oInt, "panel");
                var opened = node.getAttribute("startcollapsed")
                    ? (node.getAttribute("startcollapsed") == "true"
                        ? true
                        : false)
                    : false;
                
                panel.skinName = this.skinName;
                insertChild.call(this, panel);
                panel.loadJml(node, this);
                
                var oTitle = this.$getLayoutNode("panel", "title", panel.oExt);
                jpf.setUniqueHtmlId(oTitle);
                oTitle.appendChild(document.createTextNode(node.getAttribute("title")));
                
                oTitle.onmousedown = function(e) {
                    e = e || event;
                    jpf.lookup(_self.uniqueId).slideToggle(e);
                }
                
                this.$setStyleClass(oTitle, "NotActive");
                
                var oBody = this.$getLayoutNode("panel", "body", panel.oExt);
                jpf.setUniqueHtmlId(oBody);

                panels[oTitle.id] = {
                    panel  : panel,
                    opened : opened,
                    oTitle : oTitle,
                    oBody  : oBody
                };
                
                if (opened && this.multiCollapse) {
                    this.$setStyleClass(oTitle, opened ? "Active" : "NotActive");
                    this.slideDown(oTitle.id);
                }
                else if(opened && !this.multiCollapse) {
                    panels[oTitle.id]["opened"] = false;
                }
            }
        }
    };

    this.$destroy = function() {

    };
}).implement(jpf.Presentation);

// #endif
