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


//#ifdef __JACCORDION
jpf.accordion = jpf.component(jpf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;

    this.animType       = jpf.tween.NORMAL;
    this.animDelay      = 10;
    this.hoverDelay     = 500;
    this.multiCollapse  = true;
    this.expand         = "click";
    this.startcollapsed = false;

    var _self = this;
    /**
     * Keeps all panels
     * panels[oTitle.id] = {}
     */
    var panels = {};
    /**
     * Id of title from last opened panel
     */
    var lastOpened = [];
    var hoverTimer = null;

    this.$booleanProperties["multicollapse"] = true;
    this.$booleanProperties["startcollapsed"] = true;
    
    this.$supportedProperties.push("animtype", "animdelay", "multicollapse",
        "expand", "startcollapsed");
    
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
    
    this.$propHandlers["animtype"] = function(value) {
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
    
    this.$propHandlers["animdelay"] = function(value) {
        this.animDelay = parseInt(value);
    };
    
    this.$propHandlers["multicollapse"] = function(value) {
        this.multiCollapse = value;
    };
    
    this.$propHandlers["startcollapsed"] = function(value) {
        this.startcollapsed = value;
    };
    
    this.$propHandlers["expand"] = function(value) {
        this.expand = value;
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

        if (!panels[id]) {
            return;
        }

        var panel = panels[id];

        //close opened panel because only one can be opened
        if (!_self.multiCollapse && lastOpened.length > 0) {
            var _temp = lastOpened.shift();
            if (_temp !== id) {
                _self.slideUp(_temp);
            }
        }
        
        lastOpened.push(id);
        
        _self.$setStyleClass(panel.oTitle, "Active", ["NotActive"]);

        panel.oBody.style.display = "block";
        if (_self.$dir == "vertical") {
            panel.oBody.style.height = "1px";
        }

        jpf.tween.single(panel.oBody, {
            steps    : 30,
            type     : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
            from     : 0,
            to       : _self.$dir == "vertical" ? panel.oBody.scrollHeight : panel.oBody.scrollWidth,
            anim     : _self.animType,
            interval : _self.animDelay,
            onfinish : function() {
                _self.$setStyleClass(panel.oTitle, "Active", ["NotActive"]);
                if (_self.$dir == "vertical") {
                    panel.oBody.style.height = "auto";
                }
                else {
                    panel.oBody.style.width = "auto";
                }
                
                panels[id].opened = true;
            }
        });
    };

    this.slideUp = function(e) {
        e = e || event;
        var target = e.target || e.srcElement;
        var id = target ? target.id : e;

        if (!panels[id]) {
            return;
        }

        var panel = panels[id];

        _self.$setStyleClass(panel.oTitle, "NotActive", ["Active"]);
        

        jpf.tween.single(panel.oBody, {
            steps    : 30,
            type     : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
            from     : _self.$dir == "vertical" ? panel.oBody.scrollHeight : panel.oBody.scrollWidth,
            to       : 0,
            anim     : _self.animType,
            interval : _self.animDelay,
            onfinish : function() {
                _self.$setStyleClass(panel.oTitle, "NotActive", ["Active"]);
                panel.oBody.style.display = "none";
                
                if (_self.$dir == "horizontal") {
                    panel.oBody.style.width = "auto";
                }

                panels[id].opened = false;
            }
        });
      
        return false;
    };

    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal("main");
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        this.$dir = this.$getOption("main", "direction") || "vertical";
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
                var opened = node.getAttribute("collapsed")
                    ? (node.getAttribute("collapsed") == "true"
                        ? true
                        : false)
                    : false;

                panel.skinName = this.skinName;
                insertChild.call(this, panel);
                panel.loadJml(node, this);
                
                var oTitle = this.$getLayoutNode("panel", "title", panel.oExt);
                jpf.setUniqueHtmlId(oTitle);
                
                if (this.$dir == "horizontal") {
                    var oHeader = this.$getLayoutNode("panel", "header", panel.oExt);
                    oHeader.appendChild(document.createTextNode(node.getAttribute("title")));
                }
                else {
                    oTitle.appendChild(document.createTextNode(node.getAttribute("title")))
                }

                this.$setStyleClass(oTitle, "NotActive");
                
                if (this.expand == "click") {
                    oTitle.onmousedown = function(e) {
                        e = e || event;
                        jpf.lookup(_self.uniqueId).slideToggle(e);
                    }
                }
                else if (this.expand == "hover") {
                    oTitle.onmouseover = function(e) {
                        e = e || event;
                        var target = e.target || e.srcElement;
                        var id = target.id;
                        
                        clearInterval(hoverTimer);
                        hoverTimer = setInterval(function() {
                            jpf.lookup(_self.uniqueId).slideToggle(id);
                            clearInterval(hoverTimer);
                        }, _self.hoverDelay);
                    }
                }

                var oBody = this.$getLayoutNode("panel", "body", panel.oExt);
                jpf.setUniqueHtmlId(oBody);

                panels[oTitle.id] = {
                    panel    : panel,
                    opened   : false,
                    oTitle   : oTitle,
                    oBody    : oBody
                };

                if ((opened || this.startcollapsed) && this.multiCollapse) {
                    this.slideDown(oTitle.id);
                }
            }
        }
    };

    this.$destroy = function() {

    };
}).implement(jpf.Presentation);

// #endif
