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
//#ifdef __AMLACCORDION || __INC_ALL

/**
 * The Accordion is component that allows you to provide multiple vertical or 
 * horizontal panes. You can display them one or more at a time. Each bar has 
 * a title and its content. Content can contain other components.
 * 
 * @define accordion
 * 
 * @attribute {String} animtype   animation effect for slide in and slide out, default is "normal normal"
 * Possible values:
 *     normal    Linear tweening method
 *     easein    Ease-in tweening method
 *     easeout   Ease-out tweening method
 *     none      animation is disabled
 *        
 * @attribute {Number} animdelay   the time between each step of animation, default is 10 ms.
 * 
 * @attribute {Boolean} multiexpand   allows expanding one or more bars, default is true
 * Possible values:
 *     true    one or more bars can be expanded at a time
 *     false   only one bar can be expanded at a time
 * 
 * @attribute {String} expand   sets event which activate bar, default is click
 * Possible values:
 *     click   bar will be expanded when user click on it
 *     hover   bar will be expanded when user hover over it with mouse
 * 
 * @attribute {Boolean} startexpanded   expands all bars on load, default is false
 * Possible values:
 *     true    expands all bars
 *     false   only chosen bars will be expanded
 * @see bar expanded="true" 
 * 
 * @inherits apf.Presentation
 * 
 * Example:
 * Horizontal acccordion component with 5 bars. First and third bar will be 
 * expanded on load.
 * 
 * <code>
 *  <a:accordion
 *    width           = "400"
 *    height          = "200"
 *    left            = "200"
 *    top             = "20"
 *    multiexpand     = "true"
 *    expand          = "click"
 *    startexpanded   = "false"
 *    skin            = "accordion_apf_hor">
 *      <a:bar title="Iron Maiden" expanded="true" icon="icon.png">
 *          <b>Discography</b>
 *          <ul>
 *              <li>Piece Of Mind</li>
 *              <li>X Factor</li>
 *          </ul>
 *      </a:bar>
 *      <a:bar title="Megadeth" icon="images/accordion_icon.png">
 *          <b>Discography</b>
 *          <ul>
 *              <li>Youthanasia</li>
 *          </ul>
 *      </a:bar>
 *      <a:bar title="Judas Priest" expanded="true" icon="icon.png">
 *          <b>Discography</b>
 *          <ul>
 *              <li>Painkiller</li>
 *          </ul>
 *      </a:bar>
 *      <a:bar title="Metallica" icon="images/accordion_icon.png">
 *          <b>Discography</b>
 *          <ul>
 *              <li>Load</li>
 *          </ul>
 *      </a:bar>
 *      <a:bar title="Behemoth" icon="images/accordion_icon.png">
 *          <b>Discography</b>
 *          <ul>
 *              <li>Satanica</li>
 *          </ul>
 *      </a:bar>
 *  </a:accordion>
 * </code>
 * 
 * Example:
 * Vertical accordion component with 2 bars. Only one bar can be expanded
 * at a time. Both bars conatins APF components.
 * 
 * <code>
 *  <a:accordion
 *    width           = "400"
 *    left            = "200"
 *    top             = "500"
 *    animtype        = "normal normal"
 *    animdelay       = "10"
 *    multiexpand     = "false"
 *    expand          = "click"
 *    startexpanded   = "false"
 *    skin            = "accordion_vertical">
 *      <a:bar title="Components" expanded="true" icon="icon.png">
 *          <a:label>Choose Your favourite component</a:label><br />
 *          <a:dropdown>
 *              <a:item>Bar</a:item>
 *              <a:item>Notifier</a:item>
 *              <a:item>Tree</a:item>
 *          </a:dropdown><br />
 *      </a:bar>
 *      <a:bar title="Blog" icon="images/accordion_icon.png">
 *          <a:label>Choose Your favourite blog</a:label><br />
 *          <a:radiobutton group="g1">overthinkings</a:radiobutton> 
 *          <a:radiobutton group="g1">Rik on code </a:radiobutton> 
 *          <a:radiobutton group="g1">Arnolds wor(l)ds</a:radiobutton>
 *          <a:radiobutton group="g1">MikedeBoer.nl </a:radiobutton>
 *          <a:radiobutton group="g1">All about Javascript </a:radiobutton>
 *          <a:radiobutton group="g1">observing the dos</a:radiobutton><br />
 *          <a:button>Vote</a:button><br />
 *      </a:bar>
 *  </a:accordion>
 * </code>
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       2.2
 */
apf.accordion = function(struct, tagName){
    this.$init(tagName || "accordion", apf.NODE_VISIBLE, struct);
    
    this.$animtype1      = apf.tween.NORMAL;
    this.$animtype2      = apf.tween.NORMAL;
    this.animdelay       = 10;
    this.hoverdelay      = 500;
    this.multiexpand     = true;
    this.expand          = "click";
    this.startexpanded   = true;

    this.$animStep = {};
    this.$animStep[apf.tween.NORMAL]  = 5;
    this.$animStep[apf.tween.EASEIN]  = 10;
    this.$animStep[apf.tween.EASEOUT] = 10;
    
    /**
     * Keeps all bars
     * 
     * bars[oTitle.id] = {
     *   amlNode   : amlNode,
     *   htmlNode  : htmlNode,
     *   opened    : opened,
     *   htmlTitle : htmlTitle,
     *   htmlBody  : htmlBody,
     *   htmlIcon  : htmlIcon
     * };
     */
    this.bars = {};

    this.hoverTimer = null;
    
    /**
     * when "multiexpand" is false, only one bar with expanded="true"
     * can be opened
     */
    this.startExpanded = 0;
    
    this.$focussable     = false;
    
    this.animType = {
        "normal"  : apf.tween.NORMAL,
        "easein"  : apf.tween.EASEIN,
        "easeout" : apf.tween.EASEOUT,
        "none"    : "none"
    }
    
    this.lastOpened = [];
    
    /**
     * Only one opening action can be run in time
     */
    this.inprogress = false;
};

(function() {
    this.$booleanProperties["multiexpand"]  = true;
    this.$booleanProperties["startexpanded"] = true;
    
    this.$supportedProperties.push("animtype", "animdelay", "multiexpand",
        "expand", "startexpanded");
    
    /**** DOM Hooks ****/
    this.addEventListener("AMLRemoveChild", function(amlNode, doOnlyAdmin) {
        if (doOnlyAdmin)
            return;
    });
    
    this.addEventListener("AMLInsert",this.insertChild = function (amlNode, beforeNode, withinParent) {
        if (amlNode.tagName != "bar")
            return;

        amlNode.$propHandlers["icon"] = function(value) {
            var oIcon = this.$getLayoutNode("bar", "icon", this.$ext);
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
            this.$animtype1 = this.animType[value[0]];
        if (value[1])
            this.$animtype2 = this.animType[value[1]];
    };

    this.$propHandlers["animdelay"] = function(value) {
        this.animdelay = parseInt(value);
    };
    
    /**
     * Toggles the visibility of the container with content. Opens
     * or closes container using a slide effect. 
     * 
     * @param {Mixed} id   id of title
     */
    this.slideToggle = function(id) {
        if (!this.bars[id])
            return;

        if (this.bars[id].opened)
            this.slideUp(id);
        else
            this.slideDown(id);
    };

    /**
     * Shows the container with content using a slide effect.
     * 
     * @param {Mixed} id   id of title
     */
    this.slideDown = function(id) {
        var id2 = null;

        if (!this.bars[id] || this.inprogress) {
            return;
        }
        
        this.inprogress = true;

        var bar = this.bars[id];
        
        bar.htmlBody.style.display = "block";
        
        if (!this.multiexpand && this.lastOpened.length > 0) {
            var _temp = this.lastOpened.shift();
            if (_temp !== id)
                id2 = _temp;
        }
        
        this.lastOpened.push(id);

        this.$setStyleClass(bar.htmlNode, "active");

        if (this.$dir == "vertical") {
            //i don't know why scrollHeight in IE is equal 1
            if (bar.htmlBody.scrollHeight < 2) {
                var timer;
                clearInterval(timer);
                timer = setInterval(function() {
                    if (bar.htmlBody.scrollHeight > 0) {
                        _self.slideDown(bar.htmlTitle.id);
                        clearInterval(timer);
                    }
                }, 100);
            }
            
            bar.htmlBody.style.height = "1px";
        }

        if (this.$animtype1 == "none") {
            if (id2) {
                var bar2 = this.bars[id2];
                this.$setStyleClass(bar2.htmlNode, "", ["active"]);
                bar2.htmlBody.style.display = "none";
                
                if (this.$dir == "horizontal") {
                    bar2.htmlBody.style.width = "auto";
                }
            }
            
            if (this.$dir == "horizontal") {
                bar.htmlBody.style.width = "auto";
            }
            
            this.bars[id].opened = true;
            this.inprogress = false;
        }
        else {
            var _self = this;
            if (id2) {
                var bar2 = this.bars[id2];
                this.$setStyleClass(bar2.htmlNode, "", ["active"]);
                
                apf.tween.multi(bar.htmlBody, {
                    steps    : this.$animStep[this.$animtype1],
                    anim     : this.$animtype1,
                    interval : this.animdelay,
                    tweens : [{
                       type : this.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                       from : 0,
                       to   : this.$dir == "vertical"
                                  ? bar.htmlBody.scrollHeight
                                  : bar.htmlBody.scrollWidth
                    },
                    {
                        type  : this.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                        from  : this.$dir == "vertical"
                                   ? bar2.htmlBody.scrollHeight
                                   : bar2.htmlBody.scrollWidth,
                        to    : 0,
                        oHtml : bar2.htmlBody
                    }],
                    onfinish : function() {
                        //Slide down
                        _self.$setStyleClass(bar.htmlNode, "active", [""]);
        
                        if (_self.$dir == "horizontal") {
                            bar.htmlBody.style.width = "auto";
                        }
        
                        _self.bars[id].opened = true;
                        
                        //Slide up
                        _self.$setStyleClass(bar2.htmlNode, "", ["active"]);
                        bar2.htmlBody.style.display = "none";
        
                        if (_self.$dir == "horizontal") {
                            bar2.htmlBody.style.width = "auto";
                        }
        
                        _self.bars[id2].opened = false;
                        _self.inprogress = false;
                    }
                });
            }
            else {
                //var startSH = bar.htmlBody.scrollHeight;
                apf.tween.single(bar.htmlBody, {
                    steps    : this.$animStep[this.$animtype1],
                    type     : this.$dir == "vertical" ? "scrollheight" : "scrollwidth",
                    from     : 0,
                    to       : this.$dir == "vertical"
                                   ? bar.htmlBody.scrollHeight
                                   : bar.htmlBody.scrollWidth,
                    anim     : this.$animtype1,
                    interval : this.animdelay,
                    onfinish : function() {
                        _self.$setStyleClass(bar.htmlNode, "active", [""]);

                        //if (startSH !== bar.htmlBody.scrollHeight && _self.$dir == "vertical") {
                            //_self.slideDown(id);
                        //}

                        if (_self.$dir == "horizontal") {
                            bar.htmlBody.style.width = "auto";
                        }

                        _self.bars[id].opened = true;
                        
                        _self.inprogress = false;
                    }
                });
            }
        }
    };

    /**
     * Hides the container with content using a slide effect.
     * 
     * @param {Mixed} id   id of title
     */
    this.slideUp = function(id) {
        if (!this.bars[id] || this.inprogress) {
            return;
        }
        
        this.inprogress = true;

        var bar = this.bars[id];

        apf.setStyleClass(bar.htmlNode, "", ["active"]);

        if (this.$animtype2 == "none") {
            bar.htmlBody.style.display = "none";
            
            if (this.$dir == "horizontal")
                bar.htmlBody.style.width = "auto";
    
            this.bars[id].opened = false;
            this.inprogress = false;
        }
        else {
            var _self = this;
            apf.tween.single(bar.htmlBody, {
                steps    : this.$animStep[this.$animtype2],
                type     : this.$dir == "vertical" 
                               ? "scrollheight" 
                               : "scrollwidth",
                from     : this.$dir == "vertical"
                               ? bar.htmlBody.scrollHeight
                               : bar.htmlBody.scrollWidth,
                to       : 0,
                anim     : this.$animtype2,
                interval : this.animdelay,
                onfinish : function() {
                    _self.$setStyleClass(bar.htmlNode, "", ["active"]);
                    bar.htmlBody.style.display = "none";
    
                    if (_self.$dir == "horizontal")
                        bar.htmlBody.style.width = "auto";
    
                    _self.bars[id].opened = false;
                    _self.inprogress = false;
                }
            });
        }

        return false;
    };
    
    /**
     * Returns the id of title
     * 
     * @param {Number} number   number of title, 1 and more for counting 
     *                          from left to right for horizontal mode, and 
     *                          from top to bottom for vertical mode
     */
    this.$getbarIdByNumber = function(number) {
        var counter = 1;
        
        for (var id in this.bars) {
            if (counter++ == number)
                return id;
        }

        return null;
    };

    /**** Init ****/

    this.$draw = function() {
        //Build Main Skin
        this.$ext = this.$getExternal("main");
        this.$int = this.$getLayoutNode("main", "container", this.$ext);

        this.$dir = this.$getOption("main", "direction") || "vertical";
        
        var nodes = this.childNodes;
        var len = nodes.length;
        var node;

        var _self = this;
        
        var xmlBars = 0;
        var htmlBars = 0;
        
        var barsToOpen = [];

        for (var i = 0; i < len; i++) {
            node = nodes[i];

            if ((node.tagName || "").indexOf("a:bar") > -1 && !node.$amlLoaded) {
                xmlBars++;
                node.addEventListener("DOMNodeInsertedIntoDocument", function(e) {
                    htmlBars++;
                    
                    var htmlNode = _self.$ext.lastChild;
                    var amlNode = e.currentTarget;
                    var htmlCaption;
                    var htmlTitle;
                    var htmlIcon;
                    var htmlBody;

                    //is the bar expanded ?
                    var opened = (amlNode.getAttribute("expanded") 
                        ? (amlNode.getAttribute("expanded") == "true"
                        ? true : false) : false); 

                    //Looking for title and body nodes
                    var nodes = htmlNode.childNodes;
                    var l1 = nodes.length;
                    
                    for (var i = 0; i < l1; i++) {
                        if((nodes[i].className || "").indexOf("body") > -1) {
                            htmlBody = nodes[i];
                        }
                        if((nodes[i].className || "").indexOf("title") > -1) {
                            htmlTitle = nodes[i];
                        }
                        
                        //Looking for icon node
                        var subnodes = nodes[i].childNodes;
                        var l2 = subnodes.length;
                        for (var j = 0; j < l2; j++) {
                            if ((subnodes[j].className || "").indexOf("icon") > -1) {
                                htmlIcon = subnodes[j];
                            }
                            if (((subnodes[j].tagName || "").toLowerCase()).indexOf("span") > -1) {
                                htmlCaption = subnodes[j];
                            }
                        }
                    }

                    if (!htmlTitle && !htmlBody) {
                        return;
                    }
                    apf.setUniqueHtmlId(htmlTitle);
                    apf.setUniqueHtmlId(htmlBody);

                    //Set caption
                    var caption = amlNode.getAttribute("title");
                    if (caption) {
                        htmlCaption.innerHTML = caption;
                    }
                    
                    //set icon
                    var icon = amlNode.getAttribute("icon");
                    if (icon) {
                        htmlIcon.style.backgroundImage = "url(" + this.iconPath + icon + ")";
                    }

                    if (_self.expand == "click") {
                        htmlTitle.onmousedown = function(e) {
                            _self.slideToggle(this.id);
                        };
                        
                        //oIcon.onmousedown = function(e) {
                        //    _self.slideToggle(this.parentNode.id);
                        //};
                    }
                    else if (this.expand == "hover") {
                        htmlTitle.onmouseover = function(e) {
                            (e || event).cancelBubble = true;
                            var id = this.id;
                            
                            clearInterval(_self.hoverTimer);
                            _self.hoverTimer = setInterval(function() {
                                _self.slideToggle(id);
                                clearInterval(_self.hoverTimer);
                            }, _self.hoverdelay);
                        };
                        htmlIcon.onmouseover = function(e) {
                            (e || event).cancelBubble = true;
                            
                            var id = (e.srcElement || e.target).parentNode.id;
    
                            clearInterval(_self.hoverTimer);
                            _self.hoverTimer = setInterval(function() {
                                _self.slideToggle(id);
                                clearInterval(_self.hoverTimer);
                            }, _self.hoverdelay);
                           
                        };
                    }
                    
                    //This info must be pushed here, because i could be used in next condition
                    _self.bars[htmlTitle.id] = {
                        amlNode   : amlNode,
                        htmlNode  : htmlNode,
                        opened    : false,
                        htmlTitle : htmlTitle,
                        htmlBody  : htmlBody,
                        htmlIcon  : htmlIcon
                    };

                    if ((opened || _self.startexpanded) && (_self.multiexpand || _self.startExpanded == 0)) {
                        //_self.slideDown(htmlTitle.id);
                        barsToOpen.push(htmlTitle.id);
                        _self.startExpanded++;
                    }
                    
                    if (htmlBars == xmlBars) {
                        //this.$setStyleClass(oBody, "last");
        
                        _self.oEnding = _self.$getExternal("ending");
                        var oEnding = _self.$getLayoutNode("ending", "container", _self.oEnding);
                
                        _self.$int.appendChild(oEnding);
                    }
                });
            }
        }
        
        var openBarTimer = null;
        clearInterval(openBarTimer);
        openBarTimer = setInterval(function() {
            if (htmlBars == xmlBars) {
                for (var i = 0; i < barsToOpen.length; i++) {
                    var id = barsToOpen.pop();
                    _self.slideDown(id);
                }
                clearInterval(openBarTimer);
            }
        }, 50);
    };

    this.$loadAml = function(x) {

    };

    this.$destroy = function() {
        
    };
}).call(apf.accordion.prototype = new apf.Presentation());

apf.aml.setElement("accordion", apf.accordion);
// #endif
