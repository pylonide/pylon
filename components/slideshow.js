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

// #ifdef __JSUBMITFORM || __INC_ALL
// #define __WITH_DATABINDING 1
// #define __WITH_PRESENTATION 1
// #define __JBASETAB 1
// #define __WITH_VALIDATION 1

/**
 * Component allowing special form functionality to a set of JML
 * components. Since v0.98 this component is alias for j:xforms offering
 * xform compatible strategies with relation to submitting the form's data.
 * This component also offers form paging, including validation between
 * and over pages. Buttons placed inside this component can contain an action
 * attribute specifying wether they behave as next, previous or finish(submit)
 * buttons.
 *
 * @classDescription		This class creates a new submitform
 * @return {Submitform} Returns a new submitform
 * @type {Submitform}
 * @constructor
 * @allowchild page, {components}, {anyjml}
 * @addnode components:submitform, components:xforms
 * @alias jpf.xforms
 *
 * @author      Łukasz Lipiński
 * @version     %I%, %G% 
 */

jpf.slideshow = jpf.component(jpf.NODE_VISIBLE, function() {
    this.title        = "number";
    this.thumbheight  = 50;
    this.loadmsg      = "Loading...";
    this.defaultthumb = "images/default_thumb.jpg";
    this.defaultimage = "images/default_image.jpg";

    this.$supportedProperties.push("model", "thumbheight", "title", "defaultthumb", "loadmsg");
    var _self = this;

    var nodes;

    var control = {
        stop : false
    }; 

    var previous, next, current, actual = 0, last = 0;

    /* previous dimension of big image */
    var lastIHeight = 0;
    var lastIWidth  = 0;

    var thumbnails  = true;

    var titleHeight = 30;
    var vSpace      = 210;
    var hSpace      = 150;

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    var timer5;

    var onmousescroll_;
    var onkeydown_ = function(e) {
        e = (e || event);
        var key  = e.keyCode;
        var temp = actual;

        switch (key) {
            case 37:
                actual = actual - 1 > -1 ? --actual : nodes.length - 1;
            break;
            
            case 39:
               actual = actual + 1 < nodes.length ? ++actual : 0;
            break;
        }
        _self.addSelection(key == 39 ? -1 : 1);
        if (actual !== temp) {
            clearInterval(timer5);
            timer5 = setInterval(function() {
                _self.$refresh();
                clearInterval(timer5);
            }, 550);
        };
        return false;
    }

    this.addEventListener("onkeydown", onkeydown_);

    function setSiblings() {
        previous = actual - 1 > -1 ? nodes[actual - 1] : nodes[nodes.length - 1];
        next     = actual + 1 < nodes.length ? nodes[actual + 1] : nodes[0];
        current  = nodes[actual];
    }

    this.paint = function() {
        current = nodes[actual];

        this.oInt.style.display      = "block";
        this.oBody.style.display     = "";
        this.oImage.style.display    = "";
        this.oImage.src              = "about:blank";
        this.oBody.style.height      = this.oBody.style.width = "100px";
        this.oBody.style.marginTop   = this.oBody.style.marginLeft = "-50px";
        this.oNext.style.display     = "none";
        this.oPrevious.style.display = "none";
        this.oLoading.innerHTML      = this.loadmsg;

        if (jpf.isIE6) {
            this.oInt.style.top    = document.documentElement.scrollTop + "px";
            this.oInt.style.height = document.documentElement.offsetHeight + "px";
        }

        this.addSelection();

        jpf.tween.single(this.oCurtain, {
            steps   : 3,
            type    : "fade",
            from    : 0,
            to      : 0.7,
            control : control,
            onfinish: function() {
                _self.oImage.onload = function() {
                    last                           = actual;
                    _self.oBody.style.display      = "block";
                    this.style.display             = "block";
                    var imgWidth                   = this.offsetWidth;
                    var imgHeight                  = this.offsetHeight;
                    var b                          = _self.oBody;
                    var im                         = _self.oImage;
                    this.style.display             = "none";
                    _self.oThumbnails.style.height = _self.thumbheight + "px";
                    _self.addSelection();

                    clearTimeout(_self.timer);

                    var ww = jpf.isIE
                        ? document.documentElement.offsetWidth
                        : window.innerWidth;
                    var wh = jpf.isIE
                        ? document.documentElement.offsetHeight
                        : window.innerHeight;
                    
                    _self.otBody.style.height = (_self.thumbheight - 5) + "px";
                    _self.otBody.style.width = (ww - (parseInt(jpf.getStyle(_self.otNext, "width")) +
                    (parseInt(jpf.getStyle(_self.otNext, "borderLeftWidth")) || 0) +
                    (parseInt(jpf.getStyle(_self.otNext, "borderRightWidth")) || 0) +
                    (parseInt(jpf.getStyle(_self.otNext, "marginLeft")) || 0)*2)*2) + "px";

                    var bottomPanel = thumbnails
                        ? Math.max(_self.oBeam.offsetHeight/2, _self.thumbheight/2
                            + titleHeight)
                        : Math.max(_self.oBeam.offsetHeight/2, titleHeight);

                    /* 20 - half arrow height */
                    _self.oNext.style.top =
                    _self.oPrevious.style.top = wh/2 + 20 - bottomPanel;
                    
                    var checkWH = [false, false];
                    if (lastIWidth !== imgWidth) {
                        lastIWidth = imgWidth;
                        jpf.tween.single(b, {
                            steps   : Math.abs(imgWidth - b.offsetWidth) > 40
                                ? 10
                                : 3,
                            anim    : jpf.tween.EASEIN,
                            type    : "mwidth",
                            control : control,
                            from    : b.offsetWidth -
                                parseInt(jpf.getStyle(_self.oBody, "borderLeftWidth")) -
                                parseInt(jpf.getStyle(_self.oBody, "borderRightWidth")),
                            to      : Math.min(imgWidth, ww - hSpace),
                            onfinish: function() {
                                checkWH[0] = true;
                            }
                        });
                    }
                    else {
                        checkWH[0] = true;
                    }

                    if (lastIHeight !== imgHeight) {
                        lastIHeight = imgHeight;
                        jpf.tween.single(b, {
                            steps    : Math.abs(imgHeight - b.offsetHeight) > 40
                                ? 10
                                : 3,
                            anim     : jpf.tween.EASEIN,
                            type     : "mheight",
                            control  : control,
                            margin   : -1*(bottomPanel),
                            from     : b.offsetHeight -
                                parseInt(jpf.getStyle(_self.oBody, "borderTopWidth")) -
                                parseInt(jpf.getStyle(_self.oBody, "borderBottomWidth")),
                            to       : Math.min(imgHeight, wh - vSpace - bottomPanel),
                            onfinish : function() {
                                checkWH[1] = true;
                            }
                        });
                    }
                    else {
                        checkWH[1] = true;
                    }

                    var timer2;
                    timer2 = setInterval(function() {
                        if (checkWH[0] && checkWH[1]) {
                            setSiblings();

                            _self.oTitle.style.display = "block";

                            if (thumbnails) {
                                _self.oThumbnails.style.display = "block";
                            }

                            _self.oMove.style.display =
                                imgWidth < ww - hSpace &&
                                imgHeight < wh - vSpace - bottomPanel
                                    ? "none"
                                    : "block";
                            _self.oImage.style.cursor =
                                imgWidth < ww - hSpace &&
                                imgHeight < wh - vSpace - bottomPanel
                                    ? "default"
                                    : "move";

                            im.style.display = "block";
                            jpf.tween.single(im, {
                                steps   : 5,
                                type    : "fade",
                                control : control,
                                from    : 0,
                                to      : 1
                            });

                            if (next) {
                                _self.oNext.style.display = "block";
                                jpf.tween.single(_self.oNext, {
                                    steps   : 5,
                                    type    : "fade",
                                    control : control,
                                    from    : 0,
                                    to      : 1
                                });
                            }

                            if (previous) {
                                _self.oPrevious.style.display = "block";
                                jpf.tween.single(_self.oPrevious, {
                                    steps   : 5,
                                    type    : "fade",
                                    control : control,
                                    from    : 0,
                                    to      : 1
                                });
                            }
                            
                            jpf.tween.single(_self.oTitle, {
                                steps   : 10,
                                type    : "fade",
                                control : control,
                                from    : 0,
                                to      : 1
                            });
                        clearInterval(timer2);
                        }
                    }, 30);
                };

                _self.oImage.src = _self.applyRuleSetOnNode("src", current);

                _self.oContent.innerHTML = _self.title == "text"
                    ? _self.applyRuleSetOnNode("title", current)
                    : (_self.title == "number+text"
                        ? "<b>Image " + (actual + 1) + " of " + nodes.length + "</b><br />" +
                            _self.applyRuleSetOnNode("title", current)
                        : "Image " + (actual + 1) + " of " + nodes.length);
            }
        });
    };

    this.addSelection = function(move) {
        var htmlElement = jpf.xmldb.findHTMLNode(nodes[actual], this);
        
        /* checking visiblity */
        if(htmlElement.offsetTop > this.thumbheight - 10){
            if(move){
                if(move > 0){
                    this.$tPrevious();
                }
                else{
                    this.$tNext();
                }
                this.addSelection(move);  
            }           
        }
        
        this.$setStyleClass(this.$selected, "", ["selected"]);
        this.$setStyleClass(htmlElement, "selected");
        this.$selected = htmlElement;

    };

    /**** Init ****/

    this.$Next = function() {
        actual = actual + 1 < nodes.length ? ++actual : 0;
        this.$refresh();
    };

    this.$Previous = function() {
        actual = actual - 1 > -1 ? --actual : nodes.length - 1;
        this.$refresh();
    };

    this.$tNext = function() {
       _self.otBody.appendChild(_self.otBody.childNodes[0]);
    };

    this.$tPrevious = function() {
       _self.otBody.insertBefore(_self.otBody.childNodes[_self.otBody.childNodes.length-1], _self.otBody.firstChild); 
    };

    this.$refresh = function() {
        var img = _self.oImage;
        setSiblings();

        if (last == actual)
            return;

        control.stop = true;
        control = {
            stop : false
        }

        jpf.tween.single(img, {
            steps   : 3,
            type    : "fade",
            control : control,
            from    : 1,
            to      : 0
        });

        jpf.tween.single(_self.oNext, {
            steps   : 3,
            type    : "fade",
            control : control,
            from    : 1,
            to      : 0
        });

        jpf.tween.single(_self.oTitle, {
            steps   : 3,
            type    : "fade",
            control : control,
            from    : 1,
            to      : 0
        });

        jpf.tween.single(_self.oPrevious, {
            steps    : 3,
            type     : "fade",
            control  : control,
            from     : 1,
            to       : 0,
            onfinish : function() {
                _self.oNext.style.display     = "none";
                _self.oPrevious.style.display = "none";
                _self.oTitle.style.display    = "none";
                img.style.left                = "0px";
                img.style.top                 = "0px";
                img.src                       = _self.applyRuleSetOnNode("src", current);
                _self.oContent.innerHTML = _self.title == "text"
                    ? _self.applyRuleSetOnNode("title", current)
                    : (_self.title == "number+text"
                        ? "<b>Image " + (actual + 1) + " of " + nodes.length + "</b><br />" +
                            _self.applyRuleSetOnNode("title", current)
                        : "Image " + (actual + 1) + " of " + nodes.length);
            }
        });

        clearTimeout(_self.timer);
    };

    this.$draw = function() {
        //Build Main Skin
        this.oExt        = this.$getExternal();
        this.oInt        = this.$getLayoutNode("main", "container", this.oExt);
        this.oCurtain    = this.$getLayoutNode("main", "curtain", this.oExt);
        this.oMove       = this.$getLayoutNode("main", "move", this.oExt);
        this.oBody       = this.$getLayoutNode("main", "body", this.oExt);
        this.oContent    = this.$getLayoutNode("main", "content", this.oExt);
        this.oImage      = this.$getLayoutNode("main", "image", this.oExt);
        this.oClose      = this.$getLayoutNode("main", "close", this.oExt);
        this.oNext       = this.$getLayoutNode("main", "next", this.oExt);
        this.oPrevious   = this.$getLayoutNode("main", "previous", this.oExt);
        this.oBeam       = this.$getLayoutNode("main", "beam", this.oExt);
        this.oTitle      = this.$getLayoutNode("main", "title", this.oExt);
        this.oThumbnails = this.$getLayoutNode("main", "thumbnails", this.oExt);
        this.otBody      = this.$getLayoutNode("main", "tbody", this.oExt);
        this.otPrevious  = this.$getLayoutNode("main", "tprevious", this.oExt);
        this.otNext      = this.$getLayoutNode("main", "tnext", this.oExt);
        this.oLoading    = this.$getLayoutNode("main", "loading", this.oExt);

        if (jpf.isIE6) {
            this.oInt.style.position = "absolute";
            document.documentElement.onscroll = function() {
                if (!_self.oInt.offsetHeight)
                    return;

                _self.oInt.style.top    = document.documentElement.scrollTop + "px";
                _self.oInt.style.height = document.documentElement.offsetHeight + "px";
            }
        }

        this.oPrevious.onclick =
        this.oNext.onclick = function(e) {
            if (this.className == "previous")
                _self.$Previous();
            else
                _self.$Next();
        };

        var timer3;
        this.otPrevious.onmousedown = function(e) {
            timer3 = setInterval(function() {
                _self.$tPrevious();
            }, 50);
        };

        this.otNext.onmousedown = function(e) {
            timer3 = setInterval(function() {
                _self.$tNext();
            }, 50);
        };

        document.onmouseup = function(e) {
            /* otNex, otPrevious buttons */
            clearInterval(timer3);

            /* from onmove */
            clearInterval(timer);
            _self.oImage.onmousemove = null;

            return false;
        };

        /* mouse wheel */
        var timer4;
        
        onmousescroll_ = function(e) {
            var delta = e.delta;
            
            var temp = actual;
            if (delta < 0) {
                actual = actual + 1 < nodes.length ? ++actual : 0;
            }
            else {
                actual = actual - 1 > -1 ? --actual : nodes.length-1;
            } 
            _self.addSelection(delta);
            if (actual !== temp) {
                clearInterval(timer4);
                timer4 = setInterval(function() {
                    _self.$refresh();
                    clearInterval(timer4);
                }, 400);
            };
            
            return false;
        }
        
        jpf.addEventListener("mousescroll", onmousescroll_);
        /* end of mouse wheel */

        this.oClose.onclick = function() {
            _self.oBody.style.display = "none";
            jpf.tween.single(_self.oCurtain, {
                steps    : 3, 
                type     : "fade",
                control  : control,
                from     : 0.7,
                to       : 0,
                onfinish : function() {
                    _self.oInt.style.display = "none";
                }
            });
        };

        /* move code */
        var timer;
        this.oImage.onmousedown = function(e) {
            e = e || window.event;
            var ww = jpf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth;
            var wh = jpf.isIE
                ? document.documentElement.offsetHeight
                : window.innerHeight;
            var b = _self.oBody;

            var dx =
                b.offsetWidth -
                parseInt(jpf.getStyle(b, "borderLeftWidth")) -
                parseInt(jpf.getStyle(b, "borderRightWidth")) -
                _self.oImage.offsetWidth;
            var dy = 
                b.offsetHeight -
                parseInt(jpf.getStyle(b, "borderTopWidth")) -
                parseInt(jpf.getStyle(b, "borderBottomWidth")) -
                _self.oImage.offsetHeight;
            var t  = _self.oImage.offsetTop;
            var l  = _self.oImage.offsetLeft;

            var stepX = 0, stepY = 0, cy = e.clientY, cx = e.clientX, x, y;

            clearInterval(timer);
            timer = setInterval(function() {
                if (dx < 0) {
                    if (l - stepX >= dx && l - stepX <= 0) {
                        _self.oImage.style.left = (l - stepX) + "px";
                    }
                }
                if(dy < 0) {
                    if (t - stepY >= dy && t - stepY <= 0) {
                        _self.oImage.style.top = (t - stepY) + "px";
                    }
                }
            }, 10);

            _self.oImage.onmousemove = function(e) {
                e = e || window.event;

                y = e.clientY;
                x = e.clientX;

                stepX = cx - x;
                stepY = cy - y;

                return false;
            };
        };
        /* move code end */

       this.oExt.onresize = function() {
           var ww = jpf.isIE
               ? document.documentElement.offsetWidth
               : window.innerWidth;
           var wh = jpf.isIE
               ? document.documentElement.offsetHeight
               : window.innerHeight;
           var b = _self.oBody;
           var img = _self.oImage;

           var imgWidth = img.offsetWidth;
           var imgHeight = img.offsetHeight;
               
           var wt = Math.min(imgWidth, ww - hSpace);
           if (wt > -1) {
               b.style.width      = wt + "px";
               b.style.marginLeft = -1*(wt/2 + parseInt(jpf.getStyle(b, "borderLeftWidth"))) + "px";
           }
           var bottomPanel = thumbnails 
               ? Math.max(_self.oBeam.offsetHeight/2, _self.thumbheight/2 + titleHeight)
               : Math.max(_self.oBeam.offsetHeight/2, titleHeight);

           var ht = Math.min(imgHeight, wh - vSpace - bottomPanel);

           if (ht > -1) {
               b.style.height = ht + "px";
               b.style.marginTop = -1*(ht/2 + parseInt(jpf.getStyle(b, "borderTopWidth")) + bottomPanel) + "px";
           }

           /* refreshing cursor and move icon */
           _self.oMove.style.display = imgWidth < ww - hSpace && imgHeight < wh - vSpace
                   ? "none"
                   : "block";
           img.style.cursor = imgWidth < ww - hSpace && imgHeight < wh - vSpace
               ? "default"
               : "move";

           /* vertical center of next/prev arrows */
           _self.oNext.style.top     = wh/2 + 20 - bottomPanel;
           _self.oPrevious.style.top = wh/2 + 20 - bottomPanel;

           /* reset image position */
           img.style.left = "0px";
           img.style.top  = "0px";
           
           _self.otBody.style.width = (ww - (parseInt(jpf.getStyle(_self.otNext, "width")) +
               (parseInt(jpf.getStyle(_self.otNext, "borderLeftWidth")) || 0) +
               (parseInt(jpf.getStyle(_self.otNext, "borderRightWidth")) || 0) +
               (parseInt(jpf.getStyle(_self.otNext, "marginLeft")) || 0)*2)*2) + "px";
       };
    };

    this.$xmlUpdate = function() {
        
    }
    
    this.clickThumb = function(oThumb) {
        xmlNode = jpf.xmldb.getNode(oThumb);
        
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (xmlNode == nodes[i]) {
                actual = i;
                this.addSelection();
                this.$refresh();
                return;
            }
        }
    }

    this.$load = function(xmlRoot) {
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(xmlRoot, this);
        
        nodes = this.getTraverseNodes(xmlRoot);
        var length = nodes.length;
        if (!this.renderRoot && !length)
            return this.clearAllTraverse();

        for (var i = 0, img, thumb; i < length; i++) {
            img   = new Image();
            this.otBody.appendChild(img);

            thumb = this.applyRuleSetOnNode("thumb", nodes[i]);
            img.src = thumb ? thumb : this.defaultthumb;
            this.$setStyleClass(img, "picture");
            img.setAttribute("height", this.thumbheight - 20);

            jpf.xmldb.nodeConnect(this.documentId, nodes[i], img, this);

            img.onclick = function(e) {
                _self.clickThumb(this);
            }
        }

        //#ifdef __WITH_PROPERTY_BINDING
        if (length != this.length)
            this.setProperty("length", length);
        //#endif
        
        this.paint();
    }

    this.$destroy = function() {
        this.oExt.onresize =
        this.oImage.onmousemove =
        this.oImage.onmousedown =
        this.otNext.onmousedown =
        this.otPrevious.onmousedown =
        this.oNext.onclick =
        this.oPrevious.onclick = null;

        this.removeEventListener("onkeydown", onkeydown_);
        this.removeEventListener("mousescroll", onmousescroll_);

        this.x = null;
    }

    this.$loadJml = function(x) {
        var nodes = x.childNodes;
        jpf.JmlParser.parseChildren(x, null, this);
    };


    this.$getCurrentFragment = function() {
        var fragment = document.createDocumentFragment();

        while (this.otBody.childNodes.length) {
            fragment.appendChild(this.otBody.childNodes[0]);
        }
        fragment.dataset = this.dataset;

        return fragment;
    };
}).implement(jpf.Presentation, jpf.DataBinding, jpf.Cache);