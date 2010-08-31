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

// #ifdef __AMLSLIDESHOW || __INC_ALL
/** 
 * This element is used for viewing images. It's possible to add thumbnail and 
 * description to each of them. You can select a displayed image in several ways.
 * With a mouse buttons, the mousewheel or keyboard arrows. The thumbnails allow 
 * the user to quickly select the image from the displayed list.
 * 
 * Remarks:
 * The language variables possible to use of this component:
 * <groups>
 *     <english id="sub">
 *         <group id="slideshow">
 *             <key id="loadmsg">Loading...</key>
 *             <key id="defaulttitle">Default title</key>
 *             <key id="image">Picture</key>
 *             <key id="of">of</key>
 *         </group>
 *     </english>
 * </groups>
 * 
 * 
 * Example:
 * Slideshow component with 3 pictures. Each image has its own thumbnail 
 * and description. A new image is shown every 5 seconds.
 * <code>
 *  <a:model id="mdlImages" allowreset="true">
 *      <slideshow>
 *          <picture src="img1.jpg" thumb="thumb1.jpg" title="First Picture"></picture>
 *          <picture src="img2.jpg" thumb="thumb2.jpg" title="Second Picture"></picture>
 *          <picture src="img3.jpg" thumb="thumb3.jpg" title="Third Picture"></picture>
 *      </slideshow>
 *  </a:model>
 *  
 *  <a:slideshow 
 *    title = "number+text" 
 *    delay = "5" 
 *    model = "mdlImages">
 *      <a:bindings>
 *          <a:src   match="[@src]"></a:src>
 *          <a:title match="[@title]"></a:title>
 *          <a:thumb match="[@thumb]"></a:thumb>
 *          <a:each match="[picture]"></a:each>
 *      </a:bindings>
 *  </a:slideshow>
 * </code>
 * 
 * @attribute {String} title           the description of the picture on the slide. 
 *                                     Default is "number".
 *   Possible values:
 *   number        the description contains only slide number on a list.
 *   text          the description contains only text added by creator.
 *   number+text   the description contains slide number on a list and text 
 *                 added by creator.
 *   
 * @attribute {Number}  delay          the delay between slides when the play 
 *                                     button is pressed. Default is 5 seconds.
 * @attribute {Number}  thumbheight    the vertical size of thumbnail bar. 
 *                                     Default is 50px.
 * @attribute {String}  defaultthumb   the thumbnail shown when a slide doesn't 
 *                                     have one.
 * @attribute {String}  defaultimage   the image shown when a slide doesn't have 
 *                                     an image.
 * @attribute {String}  defaulttitle   the text shown when a slide doesn't have 
 *                                     a description.
 * @attribute {String}  loadmsg        this text displayd while the picture is 
 *                                     loading.
 * @attribute {Boolean} scalewidth     whether the width of the thumbnail is 
 *                                     scaled relative to its height.
 * 
 * @inherits apf.Cache
 * @inherits apf.MultiselectBinding
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G% 
 *
 * @define slideshow
 * @addnode elements
 * 
 * @define bindings
 * @allowchild src, title, thumb
 *
 * @binding src      Determines the url to image file.
 * @binding title    Determines the image description text.
 * @binding thumb    Determines the url to thumbnail file.
 */
apf.slideshow = function(struct, tagName){
    this.$init(tagName || "slideshow", apf.NODE_VISIBLE, struct);
    
    this.title            = "number";
    this.thumbheight      = 50;
    this.loadmsg          = null;
    this.defaultthumb     = null;
    this.defaultimage     = null;
    this.defaulttitle     = null;
    this.delay            = 5;
    this.scalewidth       = false;

    /**
     * Contains current selected node, next node to select in two directions
     * and last selected node
     */
    this.previous         = null,
    this.next             = null,
    this.current          = null,
    this.last             = null;
    
    /**
     * Determinates that component is currently loading any image or not
     */
    this.inuse            = false;
    
    /**
     * Determinates that slideshow is playing or not
     */
    this.play             = false;
    
    /**
     * Determinates that thumbnail bar is displayed or not
     */
    this.thumbnails       = true;

    /**
     * Keep the last selected image which is saved there when 
     * slideshow component is busy 
     */
    this.lastChoose       = null;
    
    /**
     * Height of title container
     */
    this.$vSpace          = 210;
    this.$hSpace          = 150;
    
    /* TIMERS */
    this.tmrShowLast      = null; //timer for showLast function
    this.tmrIsResized     = null; 
    this.tmrPlay          = null;
    this.tmrKeyDown       = null;
    this.tmrOnScroll      = null;
    this.tmrZoom          = null;
    this.tmrHoverDelay    = null;
    
    /* Used in zooming to keep size of scaled image */
    this.$imageWidth;
    this.$imageHeight;

    this.viewPortWidth    = 0;
    this.viewPortHeight   = 0;
    
    this.$zooming         = false;
    
    this.$oEmpty;
    
    this.$IEResizeCounter = 0;
    
    this.lastOverflow = null;
    
    /* this.$hide and this.$show function are not overwritten */
    this.$positioning = "basic";
};

(function() {
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
        //,apf.Cache
    );

    this.$supportedProperties.push("model", "thumbheight", "title", "loadmsg",
                                   "defaultthumb", "defaulttitle",
                                   "defaultimage", "scalewidth");
    
    this.$booleanProperties["scalewidth"] = true;

    this.$propHandlers["thumbheight"] = function(value) {
        if (parseInt(value))
            this.thumbheight = parseInt(value);
    };

    this.$propHandlers["delay"] = function(value) {
        if (parseInt(value))
            this.delay = parseInt(value);
    };

    /**
     * Prepare previous and next xml representation of slide element dependent
     * of actual slide
     */
    this.$setSiblings = function() {
        var temp_n = this.getNextTraverse(this.current),
            temp_p = this.getNextTraverse(this.current, true);

        this.next     = temp_n ? temp_n : this.getFirstTraverseNode();
        this.previous = temp_p ? temp_p : this.getLastTraverseNode();
    };
    
    /**
     * When slideshow is downloading some image, and user is trying to change it,
     * new image is saved and will be displayed later by this method
     */
    this.$showLast = function() {
        var _self = this;
        
        clearInterval(this.tmrShowLast);
        this.tmrShowLast = setInterval(function() {
            if (!_self.inuse) {
                if (_self.lastChoose) {
                    _self.current = _self.lastChoose;
                    _self.lastChoose = null;
                    
                    _self.$refresh();
                }
                clearInterval(_self.tmrShowLast);
            }
        }, 100);
    };
    
    this.$paint = function() {
        var _self = this;

        this.current = this.getFirstTraverseNode();

        //Prepare area
        this.oImage.src               = "about:blank";
        this.oThumbnails.style.height = 
        this.otBody.style.height      = 
        this.otPrevious.style.height  = 
        this.otNext.style.height      = this.thumbheight + "px";
       
        
        this.oLoading.innerHTML       = this.loadmsg 
            || apf.language.getWord("sub.slideshow.loadmsg") 
            || "Loading...";

        //This function will be called when selected image will be downloaded
        this.oImage.onload = function() {
            _self.last                     = _self.current;
            _self.oBody.style.display      = "block";
            _self.oImageBase.style.display = "block";
            _self.oImageBase.src           = _self.oImage.src;

            //Get Image size
            this.style.display = "block";
            
            var imgWidth  = _self.oImageBase.offsetWidth || _self.oImageBase.width;
            var imgHeight = _self.oImageBase.offsetHeight || _self.oImageBase.height;
            
            this.style.display             = "none";
            _self.oImageBase.style.display = "none";
            
            //Get browser window dimension
            var windowWidth = apf.isIE
                    ? document.documentElement.offsetWidth
                    : window.innerWidth;
                windowHeight = apf.isIE
                    ? document.documentElement.offsetHeight
                    : window.innerHeight;
            
            //Get height of the bottom panel
            var bottomPanel = _self.$getPanelSize();

            //Get body margins
            var oBodyDiff = apf.getDiff(_self.oBody);
            
            //is the image resized ?
            var checkWH = [false, false];
            
            //calculate viewport size
            var viewPortHeight = windowHeight - bottomPanel / 2 - _self.$vSpace,
                viewPortWidth  = windowWidth - _self.$hSpace;
            
            var _imgHeight = imgHeight,
                _imgWidth  = imgWidth;

            //if image height is bigger than body, scale it
            if (_imgHeight > viewPortHeight) {
                _imgWidth = parseInt(_imgWidth * (viewPortHeight / _imgHeight));
                _imgHeight = viewPortHeight;
            }
            
            if (_imgWidth > viewPortWidth) {
                _imgHeight = parseInt(_imgHeight * (viewPortWidth / _imgWidth));
                _imgWidth = viewPortWidth;
            }
            
            _self.viewPortHeight = _imgHeight;
            _self.viewPortWidth  = _imgWidth;

            //resize image body horizontaly
            apf.tween.single(_self.oBody, {
                steps    : apf.isGecko
                    ? 20
                    : (Math.abs(imgWidth - _self.oBody.offsetWidth) > 40
                        ? 10
                        : 3),
                anim     : apf.tween.EASEIN,
                type     : "mwidth",
                from     : _self.oBody.offsetWidth - oBodyDiff[0],
                to       : _imgWidth,
                onfinish : function() {
                    checkWH[0] = true;
                }
            });
            
            //Resize image body verticaly
            apf.tween.single(_self.oBody, {
                steps     : apf.isGecko
                    ? 20
                    : (Math.abs(imgHeight - _self.oBody.offsetHeight) > 40
                        ? 10
                        : 3),
                anim     : apf.tween.EASEIN,
                type     : "mheight",
                margin   : -1 * (bottomPanel / 2 - 10),
                from     : _self.oBody.offsetHeight - oBodyDiff[1],
                to       : _imgHeight,
                onfinish : function() {
                    checkWH[1] = true;
                }
            });
            
            _self.oImage.style.display = "block";
            _self.oImage.style.width   = _imgWidth + "px";
            _self.oImage.style.height  = _imgHeight + "px";
            _self.oImage.style.display = "none";

            //do some things when image body is resized
            clearInterval(_self.tmrIsResized);
            _self.tmrIsResized = setInterval(function() {
                if (checkWH[0] && checkWH[1]) {
                    clearInterval(_self.tmrIsResized);
                    
                    if (_self.current)
                        _self.$setSiblings();

                    //_self.oTitle.style.visibility   = "visible";
                    _self.oConsole.style.visibility = "visible";
                    
                    _self.oImage.style.display = "block";
                    _self.oTitle.style.display = "block";

                    _self.$checkThumbSize();

                    if (_self.thumbnails) {
                        _self.oThumbnails.style.display = "block";
                    }

                    apf.tween.single(_self.oImage, {
                        steps : 2,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });

                    apf.tween.single(_self.oTitle, {
                        steps : 10,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });

                    _self.inuse = false;
                    _self.addSelection();

                    if (_self.play) {
                        _self.$play();
                    }
                }
            }, 30);
        };
        
        //If something went wrong
        this.oImage.onerror = function() {
            _self.inuse = false;
        };

        this.oImage.onabort = function() {
            _self.inuse = false;
        };
        
        //_self.oImage.src = (_self.$applyBindRule("src", _self.current) 
        //    || _self.defaultimage || "about:blank");

        this.oContent.innerHTML = _self.title == "text"
            ? this.$applyBindRule("title", this.current)
            : (this.title == "number+text"
                ? "<b>" 
                    + (apf.language.getWord("sub.slideshow.image") || "Image")
                    + " "
                    + (this.getPos() + 1) 
                    + " " + (apf.language.getWord("sub.slideshow.of") || "of") + " "
                    + this.getTraverseNodes().length
                    + "</b><br />"
                    + (this.$applyBindRule("title", this.current)
                        || (this.defaulttitle 
                            ? this.defaulttitle 
                            : (apf.language.getWord("sub.slideshow.defaulttitle") || "No description")))
                : "Image " + (this.getPos() + 1)
                    + " of " + this.getTraverseNodes().length);
    };
    
    /**
     * Return image position on imagelist
     * 
     * @return {Number} image position
     */
    this.getPos = function() {
        return Array.prototype.indexOf.call(this.getTraverseNodes(), this.current);
    };
    
    /**
     * Adds selection to thumbnail of actual selected image and removes selection
     * from previous. When the "move" param is set, selected thumbnail
     * is always in displayed area.
     * 
     * @param {Number}   thumbnail bar scrolling direction
     *     Possible values:
     *     1    when thumbnails are scrolling in right
     *     -1   when thumbnails are scrolling in left
     */
    this.addSelection = function(move) {
        var htmlElement = apf.xmldb.findHtmlNode(this.current, this),
            ww          = apf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth,
                
            diffp       = apf.getDiff(this.otPrevious),
            diffn       = apf.getDiff(this.otNext),
            bp          = parseInt(apf.getStyle(this.otPrevious, "width")),
            bn          = parseInt(apf.getStyle(this.otNext, "width")),
            ew          = parseInt(apf.getStyle(htmlElement, "width"));

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
            this.$selected.className = "ssPicBox";
        if (htmlElement)
            htmlElement.className = "ssPicBox ssselected";

        this.$selected = htmlElement;
    };

    /**
     * When xml representation of new image is set, function initiate redrawing
     */
    this.$refresh = function() {
        var _self = this;

        //When slideshow is downloading some image, and user is trying to change it,
        //new image is saved and will be displayed later
        if (this.inuse) {
            this.lastChoose = this.current;
            this.$showLast();

            return;
        }

        if (this.play)
            clearInterval(this.tmrPlay);
        
        this.$setSiblings();
        this.inuse = true;

        apf.tween.single(this.oImage, {
            steps : 5,
            type  : "fade",
            from  : 1,
            to    : 0
        });
        
        //Hack for Chrome
        this.oTitle.style.display = "block";
        
        apf.tween.single(this.oTitle, {
            steps    : 3,
            type     : "fade",
            from     : 1,
            to       : 0,
            onfinish : function() {
                _self.oImage.style.left       = "0px";
                _self.oImage.style.top        = "0px";
                var _src = (_self.$applyBindRule("src", _self.current) 
                           || _self.defaultimage || _self.defaultthumb);
                var _src_temp = _self.oImage.src;

                _self.oImage.src = _src;
                _self.oImage.style.display = "none";

                // Safari and Chrome fix for reloading current image
                if (_self.oImage.src == _src_temp && apf.isWebkit) {
                    _self.inuse = false;
                    apf.tween.single(_self.oImage, {
                        steps : 5,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });
                    apf.tween.single(_self.oTitle, {
                        steps : 3,
                        type  : "fade",
                        from  : 0,
                        to    : 1
                    });
                    //_self.oTitle.style.visibility = "visible";
                }

                _self.oContent.innerHTML = _self.title == "text"
                    ? _self.$applyBindRule("title", _self.current)
                    : (_self.title == "number+text"
                        ? "<b>" + (apf.language.getWord("sub.slideshow.image") || "Image")
                            + " "
                            + (_self.getPos() + 1) 
                            + " " + (apf.language.getWord("sub.slideshow.of") || "of") + " "
                            + _self.getTraverseNodes().length
                            + "</b><br />"
                            + (_self.$applyBindRule("title", _self.current)
                               || (_self.defaulttitle 
                                   ? _self.defaulttitle 
                                   : apf.language.getWord("sub.slideshow.defaulttitle") || "No description" ))
                        : "Image " + (_self.getPos() + 1) + " of "
                            + _self.getTraverseNodes().length);
            }
        });
    };

    /**
     * Selects image by its xml representation
     * 
     * @param {XMLElement}   badge  xml representation of image
     */
    this.select = function(badge) {
        this.current = badge;
        this.$show();
    };
    
    /**
     * Hides browser scrollbars
     */
    this.$hideScrollbars = function() {
        this.lastOverflow = document.documentElement.style.overflow == "hidden"
            ? "auto"
            : document.documentElement.style.overflow;

        document.documentElement.style.overflow = "hidden";
    };
    
    /**
     * Shows browser scrollbars
     */
    this.$showScrollbars = function() {
        document.documentElement.style.overflow = this.lastOverflow;
    };
    
    
    this.$show = function() {
        var _self = this;
        
        this.$hideScrollbars();
        
        this.oBeam.style.display = "none";
        this.oBody.style.display = "none";
        this.$int.style.display  = "block";
        this.$ext.style.display  = "block";

        apf.tween.single(_self.oCurtain, {
            steps    : 10, 
            type     : "fade",
            from     : 0,
            to       : 0.7,
            onfinish : function() {
                _self.oBeam.style.display = "block";
                apf.tween.single(_self.oBeam, {
                    steps    : 10, 
                    type     : "fade",
                    from     : 0,
                    to       : 1,
                    onfinish : function() {
                        _self.oBody.style.display    = "block";
                        _self.oBody.style.width      = "100px";
                        _self.oBody.style.height     = "100px";
                        _self.oBody.style.marginLeft = "-50px";
                        _self.oBody.style.marginTop  = "-50px";
                        apf.tween.single(_self.oBody, {
                            steps    : 5, 
                            type     : "fade",
                            from     : 0,
                            to       : 1,
                            onfinish : function() {
                                if (apf.isIE) {
                                    _self.oBody.style.filter = "";
                                    _self.oBeam.style.filter = "";
                                }
                                _self.$refresh();
                            }
                        });
                    }
                });
            }
        });
    };
    
    /**** Init ****/

    /**
     * Display next image from imagelist
     */
    this.$Next = function() {
        this.current = this.next;
        this.addSelection(-1);
        this.$refresh();
    };

    /**
     * Display previous image from imagelist
     */
    this.$Previous = function() {
        this.current = this.previous;
        this.addSelection(1);
        this.$refresh();
    };
    
    /**
     * Move first thumbnail from the left to end of imagebar elementlist.
     * It's possible to scroll imagebar to infinity.
     */
    this.$tNext = function() {
       this.otBody.appendChild(this.otBody.childNodes[0]);
    };

    /**
     * Move last thumbnail to begining of imagebar elementlist.
     * It's possible to scroll imagebar to infinity.
     */
    this.$tPrevious = function() {
       this.otBody.insertBefore(
           this.otBody.childNodes[this.otBody.childNodes.length - 1],
           this.otBody.firstChild); 
    };
    
    /**
     * Starts the slide show
     */
    this.$play = function() {
         var _self = this;
         clearInterval(this.tmrPlay);
         this.tmrPlay = setInterval(function() {
             _self.play = true;
             if (_self.inuse)
                 return;

             _self.$Next();
         }, _self.delay * 1000);
    };

    /**
     * Stops the slide show
     */
    this.$stop = function() {
        clearInterval(this.tmrPlay);
        this.tmrPlay = null;
        this.play = false;
    };
    
    /**
     * Adds selection to thumbnail and shows the image.
     * 
     * @param {HTMLElement}   oThumb   html representation of thumbnail element
     */
    this.$clickThumb = function(oThumb) {
        this.current = apf.xmldb.getNode(oThumb);
        this.addSelection();
        this.$refresh();
    };
    
    this.$getPanelSize = function() {
        var title_height = this.oTitle.offsetHeight 
            || parseInt(apf.getStyle(this.oTitle, "height")) 
            + apf.getDiff(this.oTitle)[1];
        
        return Math.max(
            this.oBeam.offsetHeight, 
            title_height 
            + (this.thumbnails 
                ? this.thumbheight 
                : 0) 
            + this.oConsole.offsetHeight
        );
    };
    
    this.$resize = function() {
        //because resize event is called 2 times in IE
        if (apf.isIE) {
            this.$IEResizeCounter++;
        
            if (this.$IEResizeCounter == 2) {
                this.$IEResizeCounter = 0;
                return;
            }
        }

        var _self = this;

        _self.oImage.style.display = "none";
        
        var windowWidth = apf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth,
            windowHeight = apf.isIE
                ? document.documentElement.offsetHeight
                : window.innerHeight;

        var imgWidth    = _self.oImageBase.offsetWidth || _self.oImageBase.width;
        var imgHeight   = _self.oImageBase.offsetHeight || _self.oImageBase.height;
        var oBodyDiff   = apf.getDiff(this.oBody);
        var bottomPanel = this.$getPanelSize();
        
        //calculate viewport size
        var viewPortHeight = windowHeight - bottomPanel / 2 - _self.$vSpace;
        var viewPortWidth = windowWidth - _self.$hSpace;
        
        var _imgHeight = imgHeight;
        var _imgWidth  = imgWidth;

        //if image height is bigger than body, scale it
        if (_imgHeight > viewPortHeight) {
            _imgWidth  = parseInt(_imgWidth * (viewPortHeight / _imgHeight));
            _imgHeight = viewPortHeight;
        }
        
        if (_imgWidth > viewPortWidth) {
            _imgHeight = parseInt(_imgHeight * (viewPortWidth / _imgWidth));
            _imgWidth  = viewPortWidth;
        }
        
        this.viewPortHeight = _imgHeight;
        this.viewPortWidth = _imgWidth;
        
        var checkWH = [false, false];
        
        //resize image body horizontaly
        apf.tween.single(_self.oBody, {
            steps    : 5,
            anim     : apf.tween.EASEIN,
            type     : "mwidth",
            from     : _self.oBody.offsetWidth - oBodyDiff[0],
            to       : _imgWidth,
            onfinish : function() {
                checkWH[0] = true;
            }
        });
        
        //Resize image body verticaly
        apf.tween.single(_self.oBody, {
            steps    : 5,
            anim     : apf.tween.EASEIN,
            type     : "mheight",
            margin   : -1 * (bottomPanel / 2 - 10),
            from     : _self.oBody.offsetHeight - oBodyDiff[1],
            to       : _imgHeight,
            onfinish : function() {
                checkWH[1] = true;
            }
        });
        
        clearInterval(_self.tmrIsResized);
        _self.tmrIsResized = setInterval(function() {
            if (checkWH[0] && checkWH[1]) {
                clearInterval(_self.tmrIsResized);

                _self.oImage.style.display = "block";
                _self.oImage.style.width   = _imgWidth + "px";
                _self.oImage.style.height  = _imgHeight + "px";

                apf.tween.single(_self.oImage, {
                    steps : 2,
                    type  : "fade",
                    from  : 0,
                    to    : 1
                });
            }
        }, 30);
    };

    /**
     * Creates html representation of slideshow elements based on skin file
     * and adds events to each one.
     */
    this.$draw = function() {
        //Build Main Skin
        this.$pHtmlNode  = document.body;
        
        this.$ext        = this.$getExternal();
        this.$int        = this.$getLayoutNode("main", "container", this.$ext);
        this.oCurtain    = this.$getLayoutNode("main", "curtain", this.$ext);
        this.oBody       = this.$getLayoutNode("main", "body", this.$ext);
        this.oContent    = this.$getLayoutNode("main", "content", this.$ext);
        this.oImage      = this.$getLayoutNode("main", "image", this.$ext);
        this.oImageBase  = this.$getLayoutNode("main", "image_base", this.$ext);
        this.oClose      = this.$getLayoutNode("main", "close", this.$ext);
        this.oBeam       = this.$getLayoutNode("main", "beam", this.$ext);
        this.oTitle      = this.$getLayoutNode("main", "title", this.$ext);
        this.oThumbnails = this.$getLayoutNode("main", "thumbnails", this.$ext);
        this.otBody      = this.$getLayoutNode("main", "tbody", this.$ext);
        this.otPrevious  = this.$getLayoutNode("main", "tprevious", this.$ext);
        this.otNext      = this.$getLayoutNode("main", "tnext", this.$ext);
        this.oLoading    = this.$getLayoutNode("main", "loading", this.$ext);
        this.oEmpty      = this.$getLayoutNode("main", "empty", this.$ext);
        this.oConsole    = this.$getLayoutNode("main", "console", this.$ext);
        this.oPrevious   = this.$getLayoutNode("main", "previous", this.$ext);
        this.oPlay       = this.$getLayoutNode("main", "play", this.$ext);
        this.oNext       = this.$getLayoutNode("main", "next", this.$ext);

        var _self = this;
        
        //#ifdef __WITH_LAYOUT
        //@todo add this to $destroy
        var rules = "var o = apf.all[" + this.$uniqueId + "];\
                     if (o) o.$resize()";
        apf.layout.setRules(this.$pHtmlNode, this.$uniqueId + "_scaling",
                            rules, true);
        apf.layout.queue(this.$pHtmlNode);
        //#endif
        
        this.oPrevious.onclick =
        this.oNext.onclick = function(e) {
            if (_self.disabled)
                return;
                
            if ((this.className || "").indexOf("ssprevious") != -1)
                _self.$Previous();
            else if ((this.className || "").indexOf("ssnext") != -1)
                _self.$Next();
        };
        
        var tmrThumbButton = null;
        this.otPrevious.onmousedown = function(e) {
            if (_self.disabled)
                return;
                
            tmrThumbButton = setInterval(function() {
                _self.$tPrevious();
            }, 50);
        };

        this.otNext.onmousedown = function(e) {
            if (_self.disabled)
                return;
                
            tmrThumbButton = setInterval(function() {
                _self.$tNext();
            }, 50);
        };

        this.otNext.onmouseover = function(e) {
            _self.$setStyleClass(_self.otNext, "ssnhover", null, true);
        };

        this.otPrevious.onmouseover = function(e) {
            _self.$setStyleClass(_self.otPrevious, "ssphover", null, true);
        }

        this.otNext.onmouseout = function(e) {
            _self.$setStyleClass(_self.otNext, "", ["ssnhover"], true);
        };

        this.otPrevious.onmouseout = function(e) {
            _self.$setStyleClass(_self.otPrevious, "", ["ssphover"], true);
        };
        
        this.oPlay.onclick = function(e) {
            if (_self.disabled)
                return;
            
            if (_self.tmrPlay) {
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
        
        this.oClose.onclick = function() {
            //_self.visible = true;
            _self.$hide();
            _self.$showScrollbars();
        };

        document.onmouseup = function(e) {
            clearInterval(tmrThumbButton);
            return false;
        };

        this.oImage.onmouseover = function(e) {
            if (_self.disabled)
                return;
            
            _self.inuse = true;
            
            var e = e || event;
            var target = e.target || e.srcElement;
            
            var imgWidth  = _self.oImageBase.offsetWidth || _self.oImageBase.width;
            var imgHeight = _self.oImageBase.offsetHeight || _self.oImageBase.height;
            
            var windowWidth = apf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth;
            var windowHeight = apf.isIE
                ? document.documentElement.offsetHeight
                : window.innerHeight;

            var diff = apf.getDiff(_self.oBody);
            var posX = _self.oBody.offsetLeft + diff[0] / 2;
            var posY = _self.oBody.offsetTop  + diff[1] / 2;

            var dx = 0, dy = 0;
            var w, h, ml, mt;
            var sx = e.clientX - posX;
            var sy = e.clientY - posY;

            w = _self.$imageWidth = parseInt(_self.oImage.style.width);
            h = _self.$imageHeight = parseInt(_self.oImage.style.height);
            
            //wg tej wartosci ustale miejsce na duzym obrazku i bede wiedział wg jakiego punktu mam rozszerzać go
            var percent_posX = sx / _self.$imageWidth;
            var percent_posY = sy / _self.$imageHeight;
            
            this.onmousemove = function(e) {
                var e = e || event;

                sx = e.clientX - posX;
                sy = e.clientY - posY;

                percent_posX = sx / _self.$imageWidth;
                percent_posY = sy / _self.$imageHeight;
                
                if((_self.$imageWidth == parseInt(_self.oImage.style.width) 
                    && _self.$imageHeight == parseInt(_self.oImage.style.height)) || _self.$zooming) {
                    return;
                }

                ml = -1 * (percent_posX * w - sx);
                mt = -1 * (percent_posY * h - sy);

                if (ml <= 0 && ml >= -1 * (w - _self.viewPortWidth)) {
                    _self.oImage.style.left = ml + "px";
                }
                
                if (mt <= 0 && mt >= -1 * (h - _self.viewPortHeight)) {
                    _self.oImage.style.top = mt + "px";
                }
            };

            //little delay to run zooming
            clearInterval(_self.tmrHoverDelay);
            _self.tmrHoverDelay = setInterval(function() {
                clearInterval(_self.tmrHoverDelay);
                clearInterval(_self.tmrZoom);

                _self.tmrZoom = setInterval(function() {
                    _self.$zooming = true;
                        w     = parseInt(_self.oImage.style.width);
                        h     = parseInt(_self.oImage.style.height);
                    var l     = parseInt(_self.oImage.style.left);
                    var t     = parseInt(_self.oImage.style.top);
                    var ratio = apf.isIE ? 0.03 : 0.01;
                    
                    if (w < imgWidth) {
                        _self.oImage.style.width = (w + w * ratio) + "px";
                        _self.oImage.style.left  = -1 * (percent_posX * w - sx) + "px";
                    }
                    if (h < imgHeight) {
                        _self.oImage.style.height = (h + h * ratio) + "px";
                        _self.oImage.style.top    = -1 * (percent_posY * h - sy) + "px";
                    }
                    
                    if (w >= imgWidth && h >= imgHeight) {
                        clearInterval(_self.tmrZoom);
                        _self.$zooming = false;
                    }
                }, apf.isIE ? 5 : 10);

            }, 1000);
        };

        this.oImage.onmouseout = function(e) {
            if (_self.disabled)
                return;
            
            _self.inuse = false;
            clearInterval(_self.tmrZoom);
            clearInterval(_self.tmrHoverDelay);
            
            _self.oImage.style.width  = _self.$imageWidth + "px";
            _self.oImage.style.height = _self.$imageHeight + "px";
            
            _self.oImage.style.top  = "0px";
            _self.oImage.style.left = "0px";
            
            document.onmousemove = null;
        };
        
        var SafariChromeFix = false;
        apf.addEventListener("mousescroll", function(e) {
            if (!_self.xmlRoot || _self.$ext.style.display == "none"
              || _self.disabled)
                return;
            
            e = e || event;
            if (apf.isWebkit) {
                SafariChromeFix = SafariChromeFix ? false : true;
                if (!SafariChromeFix)
                    return;
            }

            var delta  = e.delta;
            
            var curNode  = _self.current;
            var nextNode = _self.getNextTraverse(curNode);
            var prevNode = _self.getNextTraverse(curNode, true);

            _self.next     = nextNode ? nextNode : _self.getFirstTraverseNode();
            _self.previous = prevNode ? prevNode : _self.getLastTraverseNode();

            _self.current = delta < 0 ? _self.next : _self.previous;

            _self.addSelection(delta);

            if (_self.current !== curNode) {
                clearInterval(_self.tmrOnScroll);
                _self.tmrOnScroll = setInterval(function() {
                    _self.$refresh();
                    clearInterval(_self.tmrOnScroll);
                }, 400);
            };
            return false;
        });
        
        apf.addEventListener("onkeydown", function(e) {
            e = (e || event);
            
            if (_self.disabled)
                return;
            
            //39 - Right Arrow
            //37 - Left Arrow
    
            var key     = e.keyCode;
            var curNode = _self.current;
            var nextNode = _self.getNextTraverse(curNode);
            var prevNode = _self.getNextTraverse(curNode, true);
    
            _self.next = nextNode 
                ? nextNode 
                : _self.getFirstTraverseNode();
            _self.previous = prevNode 
                ? prevNode 
                : _self.getLastTraverseNode();
            _self.current = key == 39 
                ? _self.next 
                : (key == 37 
                    ? _self.previous 
                    : _self.current);
    
            _self.addSelection(key == 39 ? -1 : (key == 37 ? 1 : 0));
    
            if (_self.current !== curNode) {
                clearInterval(_self.tmrKeyDown);
                _self.tmrKeyDown = setInterval(function() {
                    _self.$refresh();
                    clearInterval(_self.tmrKeyDown);
                }, 550);
            };
            return false;
        });
    };
    
    /**
     * Closes slideshow component
     */
    this.$hide = function () {
        var _self = this;

        _self.$ext.style.display = "block";

        apf.tween.single(_self.oBody, {
            steps    : 10, 
            type     : "fade",
            from     : 1,
            to       : 0,
            onfinish : function() {
                _self.oBody.style.display = "none";
            }
        });
        
        apf.tween.single(_self.oBeam, {
            steps    : 10, 
            type     : "fade",
            from     : 1,
            to       : 0,
            onfinish : function() {
                _self.oBeam.style.display = "none";
                
                apf.tween.single(_self.oCurtain, {
                    steps    : 10, 
                    type     : "fade",
                    from     : 0.7,
                    to       : 0,
                    onfinish : function() {
                        _self.$int.style.display  = "none";
                        _self.$ext.style.display  = "none";
                    }
                });
            }
        });
    };
    
    this.$checkThumbSize = function() {
        var nodes = this.getTraverseNodes();
        var nodes_len = nodes.length;
        
        var picBoxes = this.otBody.childNodes;
        var picBoxed_len = picBoxes.length;
        
        var widthSum = 0;
        
        var boxDiff, srcThumb, htmlPicBox, h, w, bh, testImg, counter = 0;

        for (var i = 0; i < picBoxed_len; i++) {
            if ((picBoxes[i].className || "").indexOf("ssPicBox") > -1) {
                htmlPicBox = picBoxes[i];

                srcThumb = this.$applyBindRule("thumb", nodes[counter]);
                boxDiff = apf.getDiff(htmlPicBox);
                bh = this.thumbheight - 10 - boxDiff[1];
    
                if (this.scalewidth) {
                    testImg = new Image();
                    document.body.appendChild(testImg);

                    testImg.src = srcThumb ? srcThumb : this.defaultthumb;
                    
                    h = bh;
                    if (testImg.height < bh) {
                        w = testImg.width;
                    }
                    else {
                        testImg.setAttribute("height", bh);
                        w = testImg.width;
                    }
                    document.body.removeChild(testImg);
                }
                else {
                    h = w = bh;
                }
    
                widthSum += w + boxDiff[0]
                         + (parseInt(apf.getStyle(htmlPicBox, "marginLeft")))
                         + (parseInt(apf.getStyle(htmlPicBox, "marginRight")));
    
                htmlPicBox.style.width = w + "px";
                counter++;
            }
        }

        var thumbDiff = apf.getDiff(this.otBody);

        this.otPrevious.style.visibility = this.otNext.style.visibility =
            widthSum < this.oThumbnails.offsetWidth - thumbDiff[0]
                ? "hidden"
                : "visible";
    };

    this.$load = function(xmlRoot) {
        apf.xmldb.addNodeListener(xmlRoot, this);
        
        var nodes = this.getTraverseNodes();
        var nodes_len = nodes.length;
        
        var boxDiff, srcThumb, htmlPicBox, h, w, bh, testImg = null;
        for (var i = 0; i < nodes_len; i++) {
            //Create box for thumbnail
            htmlPicBox = this.otBody.appendChild(document.createElement("div"));
            //Get source path to thumbnail image
            srcThumb = this.$applyBindRule("thumb", nodes[i]);

            htmlPicBox.style.backgroundImage = 'url(' + (srcThumb ? srcThumb : this.defaultthumb) +  ')';
            
            htmlPicBox.className = "ssPicBox";
            boxDiff = apf.getDiff(htmlPicBox);
            
            bh = this.thumbheight - 10 - boxDiff[1];
            
            if (this.scalewidth) {
                testImg = new Image();
                document.body.appendChild(testImg);

                testImg.src = srcThumb ? srcThumb : this.defaultthumb;
                
                h = bh;
                if (testImg.height < bh) {
                    w = testImg.width;
                }
                else {
                    testImg.setAttribute("height", bh);
                    w = testImg.width;
                }
                document.body.removeChild(testImg);
            }
            else {
                h = w = bh;
            }
            
            htmlPicBox.style.height    = h + "px";
            htmlPicBox.style.width     = w + "px";
            htmlPicBox.style.marginTop = htmlPicBox.style.marginBottom = "5px";

            apf.xmldb.nodeConnect(this.documentId, nodes[i], htmlPicBox, this);

            var _self = this;
            htmlPicBox.onclick = function(e) {
                _self.$clickThumb(this);
            }
        }

        //#ifdef __WITH_PROPERTY_BINDING
        if (nodes_len != this.length)
            this.setProperty("length", nodes_len);
        //#endif

        this.$paint();
    }
    
    this.addEventListener("$clear", function(){return false});

    this.$destroy = function() {
        this.otNext.onmouseover =
        this.otPrevious.onmouseover =
        this.otNext.onmouseout =
        this.otPrevious.onmouseout =
        this.$ext.onresize =
        this.oImage.onmousedown =
        this.otNext.onmousedown =
        this.otPrevious.onmousedown =
        this.oNext.onclick =
        this.oPrevious.onclick = null;

        //this.removeEventListener("onkeydown", onkeydown_);
        //this.removeEventListener("mousescroll", onmousescroll_);

        this.x = null;
    };

    this.$setClearMessage = function(msg, className) {
        var ww = apf.isIE
            ? document.documentElement.offsetWidth
            : window.innerWidth;
        var bp = parseInt(apf.getStyle(this.otPrevious, "width"));
        var bn = parseInt(apf.getStyle(this.otNext, "width"));
        var ew = parseInt(apf.getStyle(this.oEmpty, "width"));
        
        this.$oEmpty = this.oCurtain.appendChild(this.oEmpty.cloneNode(true));

        apf.setNodeValue(this.$oEmpty, msg || "");

        this.$oEmpty.setAttribute("id", "empty" + this.$uniqueId);
        this.$oEmpty.style.display = "block";
        this.$oEmpty.style.left = ((ww - ew) / 2 - bp - bn) + "px";
        apf.setStyleClass(this.$oEmpty, className, ["ssloading", "ssempty", "offline"]);
    };

    this.$removeClearMessage = function() {
        if (!this.$oEmpty)
            this.$oEmpty = document.getElementById("empty" + this.$uniqueId);
        if (this.$oEmpty && this.$oEmpty.parentNode)
            this.$oEmpty.parentNode.removeChild(this.$oEmpty);
    };

    this.$setCurrentFragment = function(fragment) {
        this.otBody.appendChild(fragment);

        this.dataset = fragment.dataset;

        if (!apf.window.hasFocus(this))
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

// #ifdef __WITH_DATABINDING
}).call(apf.slideshow.prototype = new apf.MultiselectBinding());
/* #else
}).call(apf.slideshow.prototype = new apf.Presentation());
#endif*/

apf.aml.setElement("slideshow", apf.slideshow);

apf.aml.setElement("src",   apf.BindingRule);
apf.aml.setElement("title", apf.BindingRule);
apf.aml.setElement("thumb", apf.BindingRule);
// #endif