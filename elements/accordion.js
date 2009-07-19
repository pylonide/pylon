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
//#ifdef __JACCORDION || __INC_ALL

/**
 * The Accordion is component that allows you to provide multiple vertical or 
 * horizontal panes. You can display them one or more at a time. Each panel has 
 * a title and its content. Content can contain other components.
 * 
 * @define accordion
 * 
 * @attribute {String} animtype   animation effect for slide in and slide out, default is "normal normal"
 * Possible values:
 *     normal    
 *     easein    
 *     easeout   
 *     none      animation is disabled
 * 
 * @attribute {Number} animdelay   the time between each step of animation, default is 10 ms.
 * 
 * @attribute {Boolean} multiexpand   allows collapsing one or more panels, default is true
 * Possible values:
 *     true    one or more planels can be expanded at a time
 *     false   only one panel can be expanded at a time
 * 
 * @attribute {String} expand   sets event which activate panel, default is click
 * Possible values:
 *     click   panel will be expanded when user click on it
 *     hover   panel will be expanded when user hover over it with mouse
 * 
 * @attribute {Boolean} startexpanded   collapses all panels on load, default is false
 * Possible values:
 *     true    collapses all panels
 *     false   only choosen panels will be expanded
 * @see panel expanded="true" 
 * 
 * @inherits apf.Presentation
 * 
 * Example:
 * Horizontal acccordion component with 5 panels. First and third panel will be 
 * expanded on load.
 * 
 * <code>
 * <j:accordion
 *      width           = "400"
 *      height          = "200"
 *      left            = "200"
 *      top             = "20"
 *      multiexpand     = "true"
 *      expand          = "click"
 *      startexpanded   = "false"
 *      skin            = "accordion_horizontal"
 *      >
 *     <j:panel title="Iron Maiden" expanded="true" icon="icon.png">
 *         <b>Discography</b>
 *         <ul>
 *             <li>Piece Of Mind</li>
 *             <li>X Factor</li>
 *         </ul>
 *     </j:panel>
 *     <j:panel title="Megadeth" icon="images/accordion_icon.png">
 *         <b>Discography</b>
 *         <ul>
 *             <li>Youthanasia</li>
 *         </ul>
 *     </j:panel>
 *     <j:panel title="Judas Priest" expanded="true" icon="icon.png">
 *         <b>Discography</b>
 *         <ul>
 *             <li>Painkiller</li>
 *         </ul>
 *     </j:panel>
 *     <j:panel title="Metallica" icon="images/accordion_icon.png">
 *         <b>Discography</b>
 *         <ul>
 *             <li>Load</li>
 *         </ul>
 *     </j:panel>
 *     <j:panel title="Behemoth" icon="images/accordion_icon.png">
 *         <b>Discography</b>
 *         <ul>
 *             <li>Satanica</li>
 *         </ul>
 *     </j:panel>
 * </j:accordion>
 * </code>
 * 
 * Example:
 * Vertical accordion component with 2 panels. Only one panel can be expanded
 * at a time. Both panels conatins JPF components.
 * 
 * <code>
 * <j:accordion
 *     width           = "400"
 *     left            = "200"
 *     top             = "500"
 *     animtype        = "normal normal"
 *     animdelay       = "10"
 *     multiexpand     = "false"
 *     expand          = "click"
 *     startexpanded   = "false"
 *     skin            = "accordion_vertical"
 *     >
 *     <j:panel title="Components" expanded="true" icon="icon.png">
 *         <j:label>Choose Your favourite component</j:label><br />
 *         <j:dropdown>
 *             <j:item>Bar</j:item>
 *             <j:item>Notifier</j:item>
 *             <j:item>Tree</j:item>
 *         </j:dropdown><br />
 *     </j:panel>
 *     <j:panel title="Blog" icon="images/accordion_icon.png">
 *         <j:label>Choose Your favourite blog</j:label><br />
 *         <j:radiobutton group="g1">overthinkings</j:radiobutton> 
 *         <j:radiobutton group="g1">Rik on code </j:radiobutton> 
 *         <j:radiobutton group="g1">Arnolds wor(l)ds</j:radiobutton>
 *         <j:radiobutton group="g1">MikedeBoer.nl </j:radiobutton>
 *         <j:radiobutton group="g1">All about Javascript </j:radiobutton>
 *         <j:radiobutton group="g1">observing the dos</j:radiobutton><br />
 *         <j:button>Vote</j:button><br />
 *     </j:panel>
 * </j:accordion>
 * </code>
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       2.2
 */
apf.accordion = apf.component(apf.NODE_VISIBLE, function() {
    this.canHaveChildren = true;
    this.$focussable     = false;

    this.animtype1      = apf.tween.NORMAL;
    this.animtype2      = apf.tween.NORMAL;
    this.animdelay      = 10;
    this.hoverdelay     = 500;
    this.multiexpand    = true;
    this.expand         = "click";
    this.startexpanded  = true;

    var animStep = {};
    animStep[apf.tween.NORMAL] = 5;
    animStep[apf.tween.EASEIN] = 10;
    animStep[apf.tween.EASEOUT] = 10;
    
    var _self    = this;
    
    /**
     * Keeps all panels
     * 
     * panels[oTitle.id] = {
     *     panel  : panel,
     *     opened : false,
     *     oTitle : oTitle,
     *     oBody  : oBody
     * };
     */
    var panels = {};
    
    /**
     * Id of title from last opened panel
     */
    var lastOpened = [];
    var hoverTimer = null;
    
    /**
     * when "multiexpand" is false, only one panel with expanded="true"
     * can be opened
     */
    var startExpanded = 0;

    this.$booleanProperties["multiexpand"]  = true;
    this.$booleanProperties["startexpanded"] = true;
    
    this.$supportedProperties.push("animtype", "animdelay", "multiexpand",
        "expand", "startexpanded");
    
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
        value = value.split(" ");
        
        if (value[0])
            this.animtype1 = animType[value[0]];
        if (value[1])
            this.animtype2 = animType[value[1]];
    };

    this.$propHandlers["animdelay"] = function(value) {
        this.animdelay = parseInt(value);
    };
    
    /**
     * Toggles the visibility of the container with content. It opens
     * or closes it using a slide effect. 
     * 
     * @param {Mixed} e   data which allow on identifiaction of title bar
     * Possible values:
     *     {Object} onmousedown or onmouseover event
     *     {String} unique name of title bar
     */
    this.slideToggle = function(id) {
        if (!panels[id])
            return;

        if (panels[id].opened) 
            _self.slideUp(id);
        else
            this.slideDown(id);
    };

    /**
     * Shows the container with content using a slide effect.
     * 
     * @param {Mixed} e   data which allow on identifiaction of title bar
     * Possible values:
     *     {Object} onmousedown or onmouseover event
     *     {String} unique name of title bar
     */
    this.slideDown = function(id) {
        var id2 = null;

        if (!panels[id]) {
            return;
        }

        var panel = panels[id];
        
        if (!_self.multiexpand && lastOpened.length > 0) {
            var _temp = lastOpened.shift();
            if (_temp !== id) {
                id2 = _temp;
            }
        }
        
        lastOpened.push(id);

        _self.$setStyleClass(panel.panel.oExt, "active");

        panel.oBody.style.display = "block";
        
        //#ifdef __WITH_PROPERTY_WATCH
        panel.panel.dispatchWatch("visible", true);
        //#endif
        
        if (_self.$dir == "vertical") {
            panel.oBody.style.height = "1px";
        }

        if (_self.animtype1 == "none") {
            if (id2) {
                _self.$setStyleClass(panels[id2].panel.oExt, "", ["active"]);
                panels[id2].oBody.style.display = "none";
                
                if (_self.$dir == "horizontal") {
                    panel.oBody.style.width = "auto";
                    panels[id2].oBody.style.width = "auto";
                }

                panels[id].opened = true;
            }
            else {
                if (_self.$dir == "horizontal") {
                    panel.oBody.style.width = "auto";
                }

                panels[id].opened = true;
            }
        }
        else {
            if (id2) {
                _self.$setStyleClass(panels[id2].panel.oExt, "", ["active"]);
                
                apf.tween.multi(panel.oBody, {
                    steps    : animStep[_self.animtype1],
                    anim     : _self.animtype1,
                    interval : _self.animdelay,
                    tweens : [{
                       type : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                       from : 0,
                       to   : _self.$dir == "vertical"
                                  ? panel.oBody.scrollHeight
                                  : panel.oBody.scrollWidth
                    },
                    {
                        type  : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                        from  : _self.$dir == "vertical"
                                   ? panels[id2].oBody.scrollHeight
                                   : panels[id2].oBody.scrollWidth,
                        to    : 0,
                        oHtml : panels[id2].oBody
                    }],
                    onfinish : function() {
                        //Slide down
                        _self.$setStyleClass(panel.panel.oExt, "active", [""]);
        
                        if (_self.$dir == "horizontal")
                            panel.oBody.style.width = "auto";
        
                        panels[id].opened = true;
                        
                        //Slide up
                        _self.$setStyleClass(panels[id2].panel.oExt, "", ["active"]);
                        panels[id2].oBody.style.display = "none";
        
                        if (_self.$dir == "horizontal") {
                            panels[id2].oBody.style.width = "auto";
                        }
        
                        panels[id2].opened = false;
                    }
                });
            }
            else {
                apf.tween.single(panel.oBody, {
                    steps    : animStep[_self.animtype1],
                    type     : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                    from     : 0,
                    to       : _self.$dir == "vertical"
                                   ? panel.oBody.scrollHeight
                                   : panel.oBody.scrollWidth,
                    anim     : _self.animtype1,
                    interval : _self.animdelay,
                    onfinish : function() {
                        _self.$setStyleClass(panel.panel.oExt, "active", [""]);

                        if (_self.$dir == "horizontal")
                            panel.oBody.style.width = "auto";

                        panels[id].opened = true;
                    }
                });
            }
        }
    };

    /**
     * Hides the container with content using a slide effect.
     * 
     * @param {Mixed} e   data which allow on identifiaction of title bar
     * Possible values:
     *     {Object} onmousedown or onmouseover event
     *     {String} unique name of title bar
     */
    this.slideUp = function(id) {
        if (!panels[id]) {
            return;
        }

        var panel = panels[id];
        
        //#ifdef __WITH_PROPERTY_WATCH
        panel.panel.dispatchWatch("visible", false);
        //#endif

        _self.$setStyleClass(panel.panel.oExt, "", ["active"]);

        if (_self.animtype2 == "none") {
            _self.$setStyleClass(panel.panel.oExt, "", ["active"]);
            panel.oBody.style.display = "none";
            
            if (_self.$dir == "horizontal") {
                panel.oBody.style.width = "auto";
            }
    
            panels[id].opened = false;
        }
        else {
            apf.tween.single(panel.oBody, {
                steps    : animStep[_self.animtype2],
                type     : _self.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                from     : _self.$dir == "vertical"
                               ? panel.oBody.scrollHeight
                               : panel.oBody.scrollWidth,
                to       : 0,
                anim     : _self.animtype2,
                interval : _self.animdelay,
                onfinish : function() {
                    _self.$setStyleClass(panel.panel.oExt, "", ["active"]);
                    panel.oBody.style.display = "none";
    
                    if (_self.$dir == "horizontal") {
                        panel.oBody.style.width = "auto";
                    }
    
                    panels[id].opened = false;
                }
            });
        }

        return false;
    };
    
    /**
     * Returns the id of title bar
     * 
     * @param {Number} number   number of title bar, 1 and more for counting 
     *                          from left to right for horizontal mode, and 
     *                          from top to bottom for vertical mode
     */
    this.$getPanelIdByNumber = function(number) {
        var counter = 1;
        
        for (var id in panels) {
            if (counter++ == number)
                return id;
        }

        return null;
    };
    
    var animType = {
        "normal"  : apf.tween.NORMAL,
        "easein"  : apf.tween.EASEIN,
        "easeout" : apf.tween.EASEOUT,
        "none"    : "none"
    }

    /**** Init ****/

    this.$draw = function() {
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

            if (node[apf.TAGNAME] == "panel") {
                var panel = new apf.panel(this.oInt, "panel");
                var opened = node.getAttribute("expanded")
                    ? (node.getAttribute("expanded") == "true"
                        ? true
                        : false)
                    : false;

                panel.skinName = this.skinName;
                insertChild.call(this, panel);
                panel.loadJml(node, this);
                
                var oTitle = this.$getLayoutNode("panel", "title", panel.oExt);
                var oCaption = this.$getLayoutNode("panel", "caption", panel.oExt);
                var oIcon = this.$getLayoutNode("panel", "icon", panel.oExt);
                
                apf.setUniqueHtmlId(oTitle);
                (oCaption || oTitle).appendChild(document.createTextNode(node.getAttribute("title")))

                //this.$setStyleClass(oTitle, "NotActive");

                if (this.expand == "click") {
                    oTitle.onmousedown = function(e) {
                        _self.slideToggle(this.id);
                    };
                    
                    /*oIcon.onmousedown = function(e) {
                        _self.slideToggle(this.parentNode.id);
                    };*/
                }
                else if (this.expand == "hover") {
                    oTitle.onmouseover = function(e) {
                        (e || event).cancelBubble = true;
                        var id = this.id;
                        
                        clearInterval(hoverTimer);
                        hoverTimer = setInterval(function() {
                            _self.slideToggle(id);
                            clearInterval(hoverTimer);
                        }, _self.hoverdelay);
                    };
                    oIcon.onmouseover = function(e) {
                        (e || event).cancelBubble = true;
                        
                        var id = target.parentNode.id;

                        clearInterval(hoverTimer);
                        hoverTimer = setInterval(function() {
                            _self.slideToggle(id);
                            clearInterval(hoverTimer);
                        }, _self.hoverdelay);
                       
                    };
                }

                var oBody = this.$getLayoutNode("panel", "body", panel.oExt);
                apf.setUniqueHtmlId(oBody);

                panels[oTitle.id] = {
                    panel  : panel,
                    opened : false,
                    oTitle : oTitle,
                    oBody  : oBody
                };

                //opened && 
                if ((opened || this.startexpanded) && (this.multiexpand || startExpanded == 0)) {
                    //#ifdef __WITH_PROPERTY_WATCH
                    if (!this.oExt.offsetHeight) {
                        var openTitleId = oTitle.id;
                        function propChange(name, old, value){
                            if (apf.isTrue(value) && _self.oExt.offsetHeight) {
                                _self.slideDown(openTitleId);
                                
                                var p = _self;
                                while (p) {
                                    p.unwatch("visible", propChange);
                                    p = p.parentNode;
                                }
                            }
                        };
                    
                        this.watch("visible", propChange);
                        
                        var p = this.parentNode;
                        while(p) {
                            p.watch("visible", propChange);
                            p = p.parentNode;
                        }
                    }
                    else
                    //#endif
                    {
                        this.slideDown(oTitle.id);
                    }
                    
                    startExpanded++;
                }
            }
        }
        this.$setStyleClass(oBody, "last");
        
        this.oEnding = this.$getExternal("ending");
        var oEnding = this.$getLayoutNode("ending", "container", this.oEnding);

        this.oInt.appendChild(oEnding);
    };

    this.$destroy = function() {
        
    };
}).implement(apf.Presentation);

// #endif
