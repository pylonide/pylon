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

// #ifdef __JSLIDESHOW || __INC_ALL
/** 
 * This element is used to browsing images. It's possible to add thumbnail and 
 * description to each of them. We could choose displayed image in a few ways.
 * With mouse buttons, mousewheel or keyboard arrows. Thumbnails allows to
 * very quick choosing an image.
 * 
 * Example:
 * Slideshow component with 3 pictures. Each of images have its own thumbnail 
 * and description which compose with picture number and description added by
 * creator. Switching speed is 5 seconds.
 * 
 * <j:model id="mdlImages" save-original="true" >
 *     <slideshow>
 *         <picture src="img1.jpg" thumb="thumb1.jpg" title="First Picture"></picture>
 *         <picture src="img2.jpg" thumb="thumb2.jpg" title="Second Picture"></picture>
 *         <picture src="img3.jpg" thumb="thumb3.jpg" title="Third Picture"></picture>
 *     </slideshow>
 * </j:model>
 * 
 * <j:slideshow title="number+text" delay="5" model="mdlImages">
 *     <j:bindings>
 *         <j:src   select="@src"></j:src>
 *         <j:title select="@title"></j:title>
 *         <j:thumb select="@thumb"></j:thumb>
 *         <j:traverse select="picture"></j:traverse>
 *     </j:bindings>
 * </j:slideshow>
 * 
 * @attribute {String} title          describes picture on slide, default is "number"
 *     Possible values:
 *     number        description contains only slide number on a list
 *     text          description contains only text added by creator
 *     number+text   description contains slide number on a list and text added by creator
 * @attribute {Number} delay          switching speed between slides, default is 5 seconds
 * @attribute {Number} thumbheight    vertical size of thumbnails bar, default is 50px
 * @attribute {String} defaultthumb   it will be showing in thumbnails bar if some slide haven't thumbnail
 * @attribute {String} defaultimage   it will be showing if some slide haven't path to image
 * @attribute {String} defaulttitle   this text will be showing for each picture without description
 * @attribute {String} loadmsg        this text will be displayd when picture is loading
 * 
 * @binding src     path to image file
 * @binding title   image description
 * @binding thumb   path to thumbnail file
 * 
 * @classDescription        This class creates a new slideshow
 * @return {Slideshow}      Returns a new slideshow
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Cache
 * @inherits jpf.MultiselectBinding
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G% 
 */
jpf.slideshow = jpf.component(jpf.NODE_VISIBLE, function() {
    this.pHtmlNode      = document.body;
    this.title          = "number";
    this.thumbheight    = 50;
    this.loadmsg        = "Loading...";
    this.defaultthumb   = null;
    this.defaultimage   = null;
    this.defaulttitle   = "No description";
    this.delay          = 5;
    this.scalewidth     = false;

    this.$supportedProperties.push("model", "thumbheight", "title", "loadmsg",
                                   "defaultthumb", "defaulttitle",
                                   "defaultimage", "scalewidth");
    var _self = this;

    var previous, next, current, last;

    var lastIHeight = 0,
        lastIWidth  = 0,
        onuse       = false,
        play        = false,
        thumbnails  = true,
        titleHeight = 30,
        vSpace      = 210,
        hSpace      = 150;
    var lastChoose = [];
    
    /* this.$hide and this.$show function are not overwritten */
    this.$positioning = "basic";
    
    this.$booleanProperties["scalewidth"] = true;

    this.$propHandlers["thumbheight"] = function(value) {
        if (parseInt(value))
            this.thumbheight = parseInt(value);
    }

    this.$propHandlers["delay"] = function(value) {
        if (parseInt(value))
            this.delay = parseInt(value);
    }

    var timer5;
    var onmousescroll_;
    var onkeydown_ = function(e) {
        e = (e || event);
        /*
         * 39 - Right Arrow
         * 37 - Left Arrow
         */

        var key    = e.keyCode,
            temp   = current,
            temp_n = _self.getNextTraverse(current),
            temp_p = _self.getNextTraverse(current, true);

        next     = temp_n ? temp_n : _self.getFirstTraverseNode();
        previous = temp_p ? temp_p : _self.getLastTraverseNode();
        current  = key == 39 ? next : (key == 37 ? previous : current);

        _self.addSelection(key == 39 ? -1 : (key == 37 ? 1 : 0));

        if (current !== temp) {
            clearInterval(timer5);
            timer5 = setInterval(function() {
                _self.$refresh();
                clearInterval(timer5);
            }, 550);
        };
        return false;
    }

    this.addEventListener("onkeydown", onkeydown_);

    /**
     * Prepare previous and next xml representation of slide element dependent
     * of actual slide
     */
    function setSiblings() {
        var temp_n = _self.getNextTraverse(current),
            temp_p = _self.getNextTraverse(current, true);

        next     = temp_n ? temp_n : _self.getFirstTraverseNode();
        previous = temp_p ? temp_p : _self.getLastTraverseNode();
    }
    
    /**
     * Selects image by image number or its xml representation
     * 
     * @param {Number|XMLElement}   badge  picture number or its xml representation
     */
    this.select = function(badge) {
        current = badge;
    }

    /**
     * Draw slideshow component and repaint every single picture when
     * its choosen
     */
    this.paint = function() {
        current = _self.getFirstTraverseNode();

        this.oInt.style.display    = "block";
        this.oBody.style.display   = "";
        this.oImage.style.display  = "";
        this.oImage.src            = "about:blank";
        this.oBody.style.height    = this.oBody.style.width      = "100px";
        this.oBody.style.marginTop = this.oBody.style.marginLeft = "-50px";
        this.oLoading.innerHTML    = this.loadmsg;
        /* Removes window scrollbars */
        this.lastOverflow = document.documentElement.style.overflow;                               
        document.documentElement.style.overflow = "hidden";

        if (current) {
            this.addSelection();
        }
        else {
            this.oConsole.style.display      = "none";
            this.otPrevious.style.visibility = "hidden";
            this.otNext.style.visibility     = "hidden";
        }

        jpf.tween.single(this.oCurtain, {
            steps    : 3,
            type     : "fade",
            from     : 0,
            to       : 0.7,
            onfinish : function() {
                _self.oImage.onload = function() {
                    last                           = current;
                    _self.oBody.style.display      = "block";
                    this.style.display             = "block";
                    var imgWidth                   = this.offsetWidth;
                    var imgHeight                  = this.offsetHeight;
                    var b                          = _self.oBody;
                    var im                         = _self.oImage;
                    this.style.display             = "none";
                    _self.oThumbnails.style.height = _self.thumbheight + "px";

                    if (current)
                        _self.addSelection(); 

                    clearTimeout(_self.timer);

                    var ww = jpf.isIE
                        ? document.documentElement.offsetWidth
                        : window.innerWidth;
                    var wh = jpf.isIE
                        ? document.documentElement.offsetHeight
                        : window.innerHeight;

                    _self.otBody.style.height = _self.thumbheight + "px";

                    var bottomPanel = thumbnails 
                        ? Math.max(_self.oBeam.offsetHeight / 2,
                                   _self.thumbheight / 2 + titleHeight / 2
                                   + _self.oConsole.offsetHeight / 2)
                        : Math.max(_self.oBeam.offsetHeight / 2,
                                   titleHeight / 2
                                   + _self.oConsole.offsetHeight / 2);

                    var diff = jpf.getDiff(b);
                    var checkWH = [false, false];

                    if (lastIWidth !== imgWidth) {
                        lastIWidth = imgWidth;
                        jpf.tween.single(b, {
                            steps    : jpf.isGecko
                                ? 20
                                : (Math.abs(imgWidth - b.offsetWidth) > 40
                                    ? 10
                                    : 3),
                            anim     : jpf.tween.EASEIN,
                            type     : "mwidth",
                            from     : b.offsetWidth - diff[0],
                            to       : Math.min(imgWidth, ww - hSpace),
                            onfinish : function() {
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
                            steps    : jpf.isGecko
                                ? 20
                                : (Math.abs(imgHeight - b.offsetHeight) > 40
                                    ? 10
                                    : 3),
                            anim     : jpf.tween.EASEIN,
                            type     : "mheight",
                            margin   : -1*(bottomPanel - 10),
                            from     : b.offsetHeight - diff[1],
                            to       : Math.min(imgHeight,
                                                wh - vSpace - bottomPanel),
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
                            if (current)
                                setSiblings();

                            _self.oTitle.style.visibility = "visible";
                            _self.oConsole.style.visibility = "visible";

                            _self.checkThumbSize();

                            if (thumbnails) {
                                _self.oThumbnails.style.visibility = "visible";
                            }

                            _self.oMove.style.display = imgWidth < ww - hSpace
                                && imgHeight < wh - vSpace - bottomPanel
                                ? "none"
                                : "block";
                            _self.oImage.style.cursor = imgWidth < ww - hSpace
                                && imgHeight < wh - vSpace - bottomPanel
                                ? "default"
                                : "move";

                            im.style.display = "block";
                            jpf.tween.single(im, {
                                steps : 5,
                                type  : "fade",
                                from  : 0,
                                to    : 1
                            });

                            jpf.tween.single(_self.oTitle, {
                                steps : 10,
                                type  : "fade",
                                from  : 0,
                                to    : 1
                            });
                            clearInterval(timer2);

                            onuse = false;
                            _self.addSelection();

                            if (play) {
                                _self.$play();
                            }
                        }
                    }, 30);
                };
    
                _self.oImage.src = (_self.applyRuleSetOnNode("src", current)
                                    || _self.defaultimage || "about:blank");
                
                /* When image is unavailable and defaultImage is set, but not exist */
                
                jpf.console.info("Ready state: "+_self.oImage.readyState+" "+window.document.readyState)
                if(_self.oImage && _self.oImage.readyState) {
                    if(_self.oImage.readyState == "loading") {
                        _self.oTitle.style.visibility = "visible";
                        _self.oConsole.style.visibility = "visible";

                        if (thumbnails) {
                            _self.oThumbnails.style.height = _self.thumbheight + "px";
                            _self.oThumbnails.style.visibility = "visible";
                        }
                        
                        _self.oImage.style.display = "block";
                        
                        jpf.tween.single(_self.oImage, {
                            steps : 5,
                            type  : "fade",
                            from  : 0,
                            to    : 1
                        });

                        jpf.tween.single(_self.oTitle, {
                            steps : 10,
                            type  : "fade",
                            from  : 0,
                            to    : 1
                        });

                        onuse = false;
                    }
                }
                
                _self.oContent.innerHTML = _self.title == "text"
                    ? _self.applyRuleSetOnNode("title", current)
                    : (_self.title == "number+text"
                        ? "<b>Image " + (_self.getPos() + 1) + " of "
                            + _self.getTraverseNodes().length
                            + "</b><br />"
                            + (_self.applyRuleSetOnNode("title", current)
                                || _self.defaulttitle)
                        : "Image " + (_self.getPos() + 1)
                            + " of " + _self.getTraverseNodes().length);
            }
        });
    };

    /**
     * Return image position on imagelist
     * 
     * @return {Number} image position
     */
    this.getPos = function() {
        return Array.prototype.indexOf.call(_self.getTraverseNodes(), current);
    }

    /**
     * Adds selection to thumbnail of actual selected image, in the same time
     * remove it from previous. When the "move" param is set, selected thumbnail
     * is always in displayed area.
     * 
     * @param {Number} thumbnail bar scrolling direction
     *     Possible values:
     *     1    when thumbnails are scrolling in right
     *     -1   when thumbnails are scrolling in left
     */
    this.addSelection = function(move) {
        var htmlElement = jpf.xmldb.findHTMLNode(current, this),
            ww          = jpf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth,
            diffp       = jpf.getDiff(_self.otPrevious),
            diffn       = jpf.getDiff(_self.otNext),
            bp          = parseInt(jpf.getStyle(_self.otPrevious, "width")),
            bn          = parseInt(jpf.getStyle(_self.otNext, "width")),
            ew          = parseInt(jpf.getStyle(htmlElement, "width"));

        /* checking visiblity */
        if (htmlElement.offsetLeft + ew + 5 >
            ww - bp - bn - diffp[0] - diffn[0]) {
            if (move) {
                if (move > 0)
                    this.$tPrevious();
                else if (move < 0)
                    this.$tNext();
                this.addSelection(move);
            }
        }
        if (this.$selected)
            this.$selected.className = "sspictureBox";
        if (htmlElement)
            htmlElement.className = "sspictureBox ssselected";

        this.$selected = htmlElement;
    };

    /**** Init ****/

    /**
     * Display next image from imagelist
     */
    this.$Next = function() {
        current = next;
        this.addSelection(-1);
        this.$refresh();
    };

    /**
     * Display previous image from imagelist
     */
    this.$Previous = function() {
        current = previous;
        this.addSelection(1);
        this.$refresh();
    };

    /**
     * Move first thumbnail on the left to end of imagebar elementlist.
     * It's possible to scroll imagebar to infinity.
     */
    this.$tNext = function() {
       _self.otBody.appendChild(_self.otBody.childNodes[0]);
    };

    /**
     * Move last thumbnail to begining of imagebar elementlist.
     * It's possible to scroll imagebar to infinity.
     */
    this.$tPrevious = function() {
       _self.otBody.insertBefore(
           _self.otBody.childNodes[_self.otBody.childNodes.length - 1],
           _self.otBody.firstChild); 
    };

    this.showLast = function() {
        var timer8;
        clearInterval(timer8);
        timer8 = setInterval(function() {
            if (!onuse) {
                if (lastChoose.length) {
                    current = lastChoose.pop();
                    lastChoose = [];
                    _self.$refresh();
                }
                clearInterval(timer8);
            }
        }, 100);
    }

    /**
     * When xml representation of new image is set, function initiate redrawing
     */
    this.$refresh = function() {
        /* Fix for situation when image not exist */
        if(_self.oImage && _self.oImage.readyState) {
            if(_self.oImage.readyState == "loading") {
                onuse = false;
            }
        }

        if (onuse) {
            lastChoose.push(current);
            this.showLast();
            return;
        }

        if (play)
            clearInterval(timer7);

        var img = _self.oImage;
        setSiblings();

        onuse = true;

        jpf.tween.single(img, {
            steps : 3,
            type  : "fade",
            from  : 1,
            to    : 0
        });

        jpf.tween.single(_self.oTitle, {
            steps    : 3,
            type     : "fade",
            from     : 1,
            to       : 0,
            onfinish : function() {
                _self.oTitle.style.visibility = "hidden";
                img.style.left                = "0px";
                img.style.top                 = "0px";
                var _src = (_self.applyRuleSetOnNode("src", current) || _self.defaultimage || _self.defaultthumb);
                var _src_temp = img.src;

                img.src = _src;

                /* Safari and Chrome fix for reloading current image */
                if (img.src == _src_temp && (jpf.isChrome || jpf.isSafari)) {
                    onuse = false;
                    jpf.tween.single(img, {
                        steps : 3,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });
                    jpf.tween.single(_self.oTitle, {
                        steps : 3,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });
                    _self.oTitle.style.visibility = "visible";
                }

                _self.oContent.innerHTML = _self.title == "text"
                    ? _self.applyRuleSetOnNode("title", current)
                    : (_self.title == "number+text"
                        ? "<b>Image " + (_self.getPos() + 1) + " of "
                            + _self.getTraverseNodes().length
                            + "</b><br />"
                            + (_self.applyRuleSetOnNode("title", current)
                               || _self.defaulttitle)
                        : "Image " + (_self.getPos() + 1) + " of "
                            + _self.getTraverseNodes().length);
            }
        });
        clearTimeout(_self.timer);
    };

    var timer7;
    this.$play = function() {
         timer7 = setInterval(function() {
             play = true;
             if (onuse) {
                 return;
             }
             _self.$Next();
         }, _self.delay * 1000);
    };

    this.$stop = function() {
        clearInterval(timer7);
        timer7 = null;
        play = false;
    };

    /**
     * Creates html representation of slideshow elements based on skin file
     * and adds events to each one.
     */
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
        this.oBeam       = this.$getLayoutNode("main", "beam", this.oExt);
        this.oTitle      = this.$getLayoutNode("main", "title", this.oExt);
        this.oThumbnails = this.$getLayoutNode("main", "thumbnails", this.oExt);
        this.otBody      = this.$getLayoutNode("main", "tbody", this.oExt);
        this.otPrevious  = this.$getLayoutNode("main", "tprevious", this.oExt);
        this.otNext      = this.$getLayoutNode("main", "tnext", this.oExt);
        this.oLoading    = this.$getLayoutNode("main", "loading", this.oExt);
        this.oEmpty      = this.$getLayoutNode("main", "empty", this.oExt);
        this.oConsole    = this.$getLayoutNode("main", "console", this.oExt);
        this.oPrevious   = this.$getLayoutNode("main", "previous", this.oExt);
        this.oPlay       = this.$getLayoutNode("main", "play", this.oExt);
        this.oNext       = this.$getLayoutNode("main", "next", this.oExt);

        var rules = "jpf.lookup(" + this.uniqueId + ").$resize()";
        jpf.layout.setRules(this.pHtmlNode, this.uniqueId + "_scaling",
                            rules, true);

        this.oPrevious.onclick =
        this.oNext.onclick = function(e) {
            if ((this.className || "").indexOf("ssprevious") != -1)
                _self.$Previous();
            else if ((this.className || "").indexOf("ssnext") != -1)
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

        this.otNext.onmouseover = function(e) {
            _self.$setStyleClass(_self.otNext, "ssnhover");
        };

        this.otPrevious.onmouseover = function(e) {
            _self.$setStyleClass(_self.otPrevious, "ssphover");
        }

        this.otNext.onmouseout = function(e) {
            _self.$setStyleClass(_self.otNext, "", ["ssnhover"]);
        };

        this.otPrevious.onmouseout = function(e) {
            _self.$setStyleClass(_self.otPrevious, "", ["ssphover"]);
        };

        this.oPlay.onclick = function(e) {
            if (timer7) {
                _self.$stop();
                _self.$setStyleClass(_self.oPlay, "", ["ssstop"]);
                _self.$setStyleClass(_self.oPlay, "ssplay");
                _self.oNext.style.visibility     = "visible";
                _self.oPrevious.style.visibility = "visible";
                _self.oThumbnails.style.display  = "block";
            }
            else {
                 _self.$play();
                 _self.$setStyleClass(_self.oPlay, "", ["ssplay"]);
                 _self.$setStyleClass(_self.oPlay, "ssstop");
                 _self.oNext.style.visibility     = "hidden";
                 _self.oPrevious.style.visibility = "hidden";
                 _self.oThumbnails.style.display  = "none";
            }
        };

        document.onmouseup = function(e) {
            /* otNex, otPrevious buttons */
            clearInterval(timer3);

            /* from onmove */
            clearInterval(timer);
            document.onmousemove = null;

            return false;
        };

        /* mouse wheel */
        var timer4, SafariChromeFix = false;
        onmousescroll_ = function(e) {
            if (!_self.xmlRoot || _self.oExt.style.display == "none")
                return;
            
            e = e || event;
            if (jpf.isChrome || jpf.isSafari) {
                SafariChromeFix = SafariChromeFix ? false : true;
                if (!SafariChromeFix)
                    return;
            }

            var delta  = e.delta;
            var temp   = current;
            var temp_n = _self.getNextTraverse(current);
            var temp_p = _self.getNextTraverse(current, true);

            next     = temp_n ? temp_n : _self.getFirstTraverseNode();
            previous = temp_p ? temp_p : _self.getLastTraverseNode();

            current  = delta < 0 ? next : previous;

            _self.addSelection(delta);

            if (current !== temp) {
                clearInterval(timer4);
                timer4 = setInterval(function() {
                    _self.$refresh();
                    clearInterval(timer4);
                }, 400);
            };
            return false;
        };

        jpf.addEventListener("mousescroll", onmousescroll_);
        /* end of mouse wheel */

        this.oClose.onclick = function() {
            _self.hide();
        };

        /* image move */
        var timer;
        this.oImage.onmousedown = function(e) {
            e = e || event;
            var ww = jpf.isIE
                    ? document.documentElement.offsetWidth
                    : window.innerWidth,
                wh = jpf.isIE
                    ? document.documentElement.offsetHeight
                    : window.innerHeight,
                b = _self.oBody,
                diff = jpf.getDiff(b),
                dx = b.offsetWidth - diff[0] - _self.oImage.offsetWidth,
                dy = b.offsetHeight - diff[1] - _self.oImage.offsetHeight;
            var t = parseInt(_self.oImage.style.top),
                l = parseInt(_self.oImage.style.left);

            var cy = e.clientY, cx = e.clientX;

            if (e.preventDefault) {
                e.preventDefault();
            }

            document.onmousemove = function(e) {
                e = e || event;

                if (dx < 0) {
                    if (l + e.clientX - cx >= dx && l + e.clientX - cx <= 0) {
                        _self.oImage.style.left = (l + e.clientX - cx) + "px";
                    }
                }
                if (dy < 0) {
                    if (t + e.clientY - cy >= dy && t + e.clientY - cy <= 0) {
                        _self.oImage.style.top = (t + e.clientY - cy) + "px";
                    }
                }

                return false;
            };
        };
        /* end of image move */

        this.oImage.onmouseover = function(e) {
            onuse = true;
        };

        this.oImage.onmouseout = function(e) {
            onuse = false;
        };
    };

    this.$xmlUpdate = function() {
    };
    
    /**
     * It's called when browser window is resizing. Keeps proportion of each
     * element, depends on browser window size.
     */
    this.$resize = function() {
        var ww        = jpf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth,
            wh        = jpf.isIE
                ? document.documentElement.offsetHeight
                : window.innerHeight,
            b         = _self.oBody,
            img       = _self.oImage,
            imgWidth  = img.offsetWidth,
            imgHeight = img.offsetHeight,
            diff      = jpf.getDiff(b),
            wt        = Math.min(imgWidth, ww - hSpace);

        if (wt > -1) {
           b.style.width      = wt + "px";
           b.style.marginLeft = -1 * (wt / 2
               + (parseInt(jpf.getStyle(b, "borderLeftWidth")) || diff[0] / 2))
               + "px";
        }

        var bottomPanel = thumbnails
            ? Math.max(_self.oBeam.offsetHeight / 2,
                       _self.thumbheight / 2 + titleHeight / 2)
            : Math.max(_self.oBeam.offsetHeight / 2,
                       titleHeight / 2);
        var ht = Math.min(imgHeight, wh - vSpace - bottomPanel);
        if (ht > -1) {
            b.style.height    = ht + "px";
            b.style.marginTop = -1 * (ht / 2
                + (parseInt(jpf.getStyle(b, "borderTopWidth")) || diff[1] / 2)
                    + bottomPanel)
                + "px";
        }

        /* refreshing cursor and move icon */
        _self.oMove.style.display =
            imgWidth < ww - hSpace && imgHeight < wh - vSpace
                ? "none"
                : "block";
        img.style.cursor =
            imgWidth < ww - hSpace && imgHeight < wh - vSpace
                ? "default"
                : "move";

       /* reset image position */
       img.style.left = "0px";
       img.style.top  = "0px";
    }

    /**
     * It's called when thumbnail has been clicked.
     * Adds selection to thumbnail and shows new image.
     * 
     * @param {HTMLElement}   oThumb   html representation of thumbnail element
     */
    this.clickThumb = function(oThumb) {
        current = jpf.xmldb.getNode(oThumb);
        this.addSelection();
        this.$refresh();
    }
    
    this.checkThumbSize = function() {
        if(parseInt(this.otBody.childNodes[0].style.width) > 0) {
            return;
        }

        var nodes = this.getTraverseNodes(), length = nodes.length;
        
        for (var i = 0, diff, thumb, pictureBox, h, w, bh; i < length; i++) {
            pictureBox = this.otBody.childNodes[i];
            thumb = this.applyRuleSetOnNode("thumb", nodes[i]);

            diff = jpf.getDiff(pictureBox);
            
            bh = this.thumbheight - 10 - diff[1];
            
            img = new Image();
            document.body.appendChild(img);
            img.src = thumb ? thumb : this.defaultthumb;
            
            if (this.scalewidth) {
                h = bh;
                if (img.height < bh) {
                    w = img.width;
                }
                else {
                    img.setAttribute("height", bh);
                    w = img.width;
                }
            }
            else {
                h = w = bh;
            }

            document.body.removeChild(img);
            pictureBox.style.width = w + "px";
        }
    }

    this.$load = function(xmlRoot) {
        jpf.xmldb.addNodeListener(xmlRoot, this);
        var nodes = this.getTraverseNodes(),
            length = nodes.length;

        for (var i = 0, diff, thumb, pictureBox, h, w, bh; i < length; i++) {
            pictureBox = this.otBody.appendChild(document.createElement("div"));
            thumb = this.applyRuleSetOnNode("thumb", nodes[i]);
            pictureBox.style.backgroundImage = 'url(' + (thumb ? thumb : this.defaultthumb) +  ')';

            this.$setStyleClass(pictureBox, "sspictureBox");
            diff = jpf.getDiff(pictureBox);
            
            bh = this.thumbheight - 10 - diff[1];
            
            img = new Image();
            document.body.appendChild(img);
            img.src = thumb ? thumb : this.defaultthumb;
            
            if (this.scalewidth) {
                h = bh;
                if (img.height < bh) {
                    w = img.width;
                }
                else {
                    img.setAttribute("height", bh);
                    w = img.width;
                }
            }
            else {
                h = w = bh;
            }
            jpf.console.info(w+" "+h+" - "+img.style.height)
            document.body.removeChild(img);

            pictureBox.style.height = h + "px";
            pictureBox.style.width = w + "px";
            pictureBox.style.marginTop = pictureBox.style.marginBottom = "5px";

            jpf.xmldb.nodeConnect(this.documentId, nodes[i], pictureBox, this);

            pictureBox.onclick = function(e) {
                _self.clickThumb(this);
            }
        }

        //#ifdef __WITH_PROPERTY_BINDING
        if (length != this.length)
            this.setProperty("length", length);
        //#endif

        this.paint();
    }
    
    this.$show = function() {
        _self.oExt.style.display = "block";
        _self.oInt.style.display = "block";
        _self.oBody.style.display = "block";
        
        jpf.tween.single(_self.oCurtain, {
            steps    : 10, 
            type     : "fade",
            from     : 0,
            to       : 0.7,
            onfinish : function() {

            }
        });
        this.$refresh();
    }
    
    this.$hide = function () {
        /* Restores window scrollbars */
        document.documentElement.style.overflow = this.lastOverflow;
        _self.oExt.style.display = "block";

        jpf.tween.single(_self.oCurtain, {
            steps    : 10, 
            type     : "fade",
            from     : 0.7,
            to       : 0,
            onfinish : function() {
                _self.oInt.style.display  = "none";
                _self.oBody.style.display = "none";
                _self.oExt.style.display  = "none";
                _self.oBody.style.display = "none";
            }
        });
    }

    this.$destroy = function() {
        this.otNext.onmouseover =
        this.otPrevious.onmouseover =
        this.otNext.onmouseout =
        this.otPrevious.onmouseout =
        this.oExt.onresize =
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

    var oEmpty;
    this.$setClearMessage = function(msg, className) {
        var ww = jpf.isIE
            ? document.documentElement.offsetWidth
            : window.innerWidth;
        var bp = parseInt(jpf.getStyle(_self.otPrevious, "width"));
        var bn = parseInt(jpf.getStyle(_self.otNext, "width"));
        var ew = parseInt(jpf.getStyle(_self.oEmpty, "width"));
        
        oEmpty = this.oCurtain.appendChild(this.oEmpty.cloneNode(true));

        jpf.xmldb.setNodeValue(oEmpty, msg || "");

        oEmpty.setAttribute("id", "empty" + this.uniqueId);
        oEmpty.style.display = "block";
        oEmpty.style.left = ((ww - ew) / 2 - bp - bn) + "px";
        jpf.setStyleClass(oEmpty, className, ["ssloading", "ssempty", "offline"]);
    };

    this.$removeClearMessage = function() {
        if (!oEmpty)
            oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty && oEmpty.parentNode)
            oEmpty.parentNode.removeChild(oEmpty);
    };

    this.$setCurrentFragment = function(fragment) {
        this.otBody.appendChild(fragment);

        this.dataset = fragment.dataset;

        if (!jpf.window.hasFocus(this))
            this.blur();
    };

    this.$getCurrentFragment = function() {
        var fragment = document.createDocumentFragment();

        while (this.otBody.childNodes.length) {
            fragment.appendChild(this.otBody.childNodes[0]);
        }
        fragment.dataset = this.dataset;

        return fragment;
    };
}).implement(jpf.Presentation, jpf.DataBinding, jpf.Cache,
             jpf.MultiselectBinding);

// #endif
