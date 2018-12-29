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

// #ifdef __AMLGALLERY || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * This component is used to view images. For each of them we can add a 
 * thumbnail and description. We can choose an displayed image in several ways. 
 * From the list of thumbnails, using the keyboard, mouse or buttons.
 *
 * @author      Lukasz Lipinski 
 * @version     %I%, %G%
 * @since       3.0
 *
 * @inherits apf.Presentation
 */

apf.gallery = function(struct, tagName){
    this.$init(tagName || "gallery", apf.NODE_VISIBLE, struct);
    
    this.imageheight   = "auto";
    
    this.defaultthumb  = null;
    this.defaultimage  = null;
    
    this.scalewidth    = false;
    this.zoomIcon      = false;
    
    this.previous      = null,
    this.next          = null,
    this.current       = null,
    this.last          = null;
    
    /**
     * Possbile values:
     * - grid
     * - bar
     */
    this.thumbnailMode = "grid";
    this.title         = "text";
    
    this.nodes         = [];
    
    this.tmrRefresh    = null;
    this.tmrSlide      = null;
    
    this.stepShow      = apf.isIE ? 10 : 15;
    this.stepShowFast  = apf.isIE ? 5 : 8;
    this.stepSlide     = apf.isIE ? 25 : 30;
    this.stepHide      = apf.isIE ? 5 : 7;
    this.intSSlide     = apf.isIE ? 2 : 10;
    
    this.imageStack = {};
    this.isOnStack = false;
    
    this.noThumbArrows = false;
    
    this.mediaType = null;
    this.supportedMediaTypes = ["image", "flash"];
};

(function(){
    this.$supportedProperties.push("thumbheight", "imageheight", "scalewidth", 
    "defaultthumb", "defaultimage", "thumb-mode", "title", "zoom-icon");
    
    this.$booleanProperties["scalewidth"] = true;
    this.$booleanProperties["zoom-icon"]  = true;
    
    this.$propHandlers["zoom-icon"] = function(value) {
        this.zoomIcon = value;
        this.$oZoomIcon.style.display = this.zoomIcon ? "block" : "none";
    };
    
    this.$propHandlers["imageheight"] = function(value) {
        this.imageheight = value == "auto" 
            ? "auto" 
            : parseInt(value);
    };
    
    this.$propHandlers["thumb-mode"] = function(value) {
        this.thumbnailMode = value;
        this.$setStyleClass(this.$ext, value + "Mode", ["barMode", "gridMode"]);
    };
    
    this.isSupportedType = function(type) {
        for (var i = 0, l = this.supportedMediaTypes.length; i < l; i++) {
            if (type == this.supportedMediaTypes[i])
                return true;
        }
        return false;
    };
    
    this.$setSiblings = function() {
        var temp_n = this.getNextTraverse(this.current),
            temp_p = this.getNextTraverse(this.current, true);

        this.next     = temp_n ? temp_n : this.getFirstTraverseNode();
        this.previous = temp_p ? temp_p : this.getLastTraverseNode();
    };
    
    this.show = function() {
        this.$show();
    };
    
    this.hide = function() {

    };
    
    this.calcThumbBarSize = function() {
        var nodes     = this.$oThumbs.childNodes;
        var nodes_len = nodes.length;
        
        var thumbBarSize = 0;
        for (var i = 0; i < nodes_len; i++) {
            if ((nodes[i].className || "").indexOf("thumbnail") > -1) {
                thumbBarSize += nodes[i].offsetWidth + apf.getMargin(nodes[i])[0];
            }
        }
        
        this.$oThumbs.style.width = thumbBarSize + "px";
        
        //Whether thumbnail arrows should be displayed or not
        this.noThumbArrows = this.$oThumbs.offsetWidth < this.$oThumbs.parentNode.offsetWidth 
            ? true 
            : false;

        if (this.noThumbArrows)
            this.$setStyleClass(this.$oBar, "noArrows", null);
        else
            this.$setStyleClass(this.$oBar, "", ["noArrows"]);

        this.calculateRange();
    };
    
    this.initiateThumbnailEvents = function() {
        var thumbs     = this.$oThumbs.childNodes;
        var thumbs_len = thumbs.length;
        var _self      = this;
        
        var tHeight, tWidth = null;
        var iHeight, iWidth;
        
        for (var i = 0; i < thumbs_len; i++) {
            if ((thumbs[i].className || "").indexOf("thumbnail") > -1) {
                if (tHeight == null || tHeight <= 0)
                    tHeight = (thumbs[i].offsetHeight || parseInt(thumbs[i].height)) - apf.getVerBorders(thumbs[i]);
                
                thumbs[i].onmouseover = function(e) {
                    _self.$hoverThumb(e, this);
                };
                
                thumbs[i].onmouseout = function(e) {
                    _self.$hoverThumb(e, this);
                };
                
                var images = thumbs[i].childNodes;
                    images_len = images.length;
                    
                for (var j = 0; j < images_len; j++) {
                    if ((images[j].tagName || "").toLowerCase() == "img") {
                        iHeight = images[j].offsetHeight || images[j].height;
                        iWidth  = images[j].offsetWidth || images[j].width;
                        
                        if (iHeight > 0 && iWidth > 0 && tHeight > 0) {
                            images[j].style.height = tHeight + "px";
                            images[j].parentNode.style.width = images[j].style.width = parseInt(iWidth * tHeight/iHeight) + "px";
                        }
                        else {
                            images[j].onload = function() {
                                iHeight = this.offsetHeight || this.height;
                                iWidth = this.offsetWidth || this.width;
                                
                                if (iHeight > 0 && iWidth > 0 && tHeight > 0) {
                                    this.style.height = tHeight + "px";
                                    if (this.parentNode)
                                        this.parentNode.style.width = this.style.width = parseInt(iWidth * tHeight/iHeight) + "px";
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (_self.thumbnailMode == "bar") {
            _self.calcThumbBarSize();
        }
    };
    
    this.$hoverThumb = function(e, htmlElement) {
        e = e || event;
        var target = e.target || e.srcElement;
        var from   = e.type == "mouseover" ? 0.7 : 1;
        var to     = e.type == "mouseover" ? 1   : 0.7;

        if (apf.isChildOf(htmlElement, target, false)) {
            if ((htmlElement.className || "").indexOf("selected") > -1)
                return;
            
            apf.tween.single(htmlElement, {
                steps : 10, 
                type  : "fade",
                from  : from,
                to    : to
            });
        }
    };
    
    this.loading = false;
    this.$show = function() {
        var _self = this;
        //this.$oImage.src = "about:blank";
        this.$showLoader();
        
        if (this.imageheight !== "auto")
            this.$oImageContainer.style.height = this.$oViewport.style.height = this.imageheight + "px";
        
        this.initiateThumbnailEvents();
        
        if (this.thumbnailMode == "bar") {
            this.calcThumbBarSize();
        }

        this.$oImage.onload = function() {
            _self.$hideLoader();
            _self.$oImageBase.src = _self.$oImage.src;
            _self.last = _self.current;
            _self.$setSiblings();
            
            //Get image dimension
            _self.$oImageBase.style.display = "block";
            var imgWidth  = _self.$oImageBase.offsetWidth || _self.$oImageBase.width;
            var imgHeight = _self.$oImageBase.offsetHeight || _self.$oImageBase.height;
            _self.$oImageBase.style.display = "none";
            
            if (_self.imageheight !== "auto") {
                //Get viewport dimension
                var vpWidth  = _self.$oViewport.offsetWidth;
                var vpHeight = _self.$oViewport.offsetHeight;
                
                //New image dimensions
                var nHeight = imgHeight, nWidth = imgWidth;
                
                if (nHeight > vpHeight) {
                    nWidth  = parseInt(imgWidth * (vpHeight / nHeight));
                    nHeight = vpHeight;
                }
                
                if (nWidth > vpWidth) {
                    nHeight = parseInt(nHeight * (vpWidth / nWidth));
                    nWidth  = vpWidth;
                }
                
                if (nWidth > 0 && nHeight > 0) {
                    _self.$oImage.style.width      = nWidth + "px";
                    _self.$oImage.style.height     = nHeight + "px";
                    _self.$oImage.style.marginTop  = parseInt((vpHeight - nHeight) / 2) + "px";
                    _self.$oImage.style.marginLeft = parseInt((vpWidth - nWidth) / 2) + "px";
                }
            }
            else {
                if (imgWidth > 0 && imgHeight > 0) {
                    _self.$oImageContainer.style.width  = imgWidth + "px";
                    _self.$oImageContainer.style.height = imgHeight + "px";
                }
                _self.$oImageContainer.style.margin = "0 auto";
            }
            
            _self.$oImage.style.display = "block";
           
            if (!_self.isOnStack) {
                apf.tween.single(_self.$oImage, {
                    steps : _self.stepShow,
                    type  : "fade",
                    anim  : apf.tween.NORMAL,
                    from  : 0,
                    to    : 1,
                    onfinish: function(){
                        _self.loading = false;
                    }
                });
            }
            else {
                if (apf.isIE){
                    _self.$oImage.style.filter = "alpha(opacity=100)";
                }
                else {
                    _self.$oImage.style.opacity = 1;
                }
                _self.loading = false;
            }
            
            //Keep loaded image to won't show loader once again
            _self.imageStack[_self.$applyBindRule("src", _self.current)] = true;
        };
    };
    
    this.$showVideo = function() {
        this.$oImage.style.display = "none";
        this.$hideLoader();
        this.last = this.current;
        this.$setSiblings();
        
        if (this.mediaType == "flash") {
            //Get viewport dimension
            var vpWidth  = this.$oViewport.offsetWidth;
            var vpHeight = this.$oViewport.offsetHeight;
            
            this.$oMedia.style.width = vpWidth + "px";
            this.$oMedia.style.height = vpHeight + "px";
            
            this.$oMedia.style.display = "block";
            
            if (!this.isOnStack) {
                var _self = this;
                apf.tween.single(this.$oMedia, {
                    steps : _self.stepShow,
                    type  : "fade",
                    anim  : apf.tween.NORMAL,
                    from  : 0,
                    to    : 1,
                    onfinish: function(){
                        _self.loading = false;
                    }
                });
            }
            else {
                this.$oMedia.style.filter = "alpha(opacity=100)";
                this.$oMedia.style.opacity = 1;
                this.loading = false;
            }
        }
        
        this.imageStack[this.$applyBindRule("src", this.current)] = true;
    };
    
    this.$refresh = function() {
        this.isOnStack = this.imageStack[this.$applyBindRule("src", this.current)] 
            ? true 
            : false; 
        
        if (!this.isOnStack)
            this.$showLoader();
        
        var _self = this;
        clearTimeout(this.tmrRefresh);
        _self.tmrRefresh = window.setTimeout(function() {
            clearTimeout(_self.tmrRefresh);
            
            if (_self.$amlDestroyed)
                return;
            
            if (!_self.isOnStack) {
                apf.tween.single(_self.mediaType == "image" ? _self.$oMedia : _self.$oImage, {
                    steps : _self.stepHide,
                    type  : "fade",
                    anim  : apf.tween.NORMAL,
                    from  : 1,
                    to    : 0,
                    onfinish: function() {
                        _self.setImagePath(_self.current);
                        
                        if (_self.mediaType !== "image") {
                            _self.$showVideo();
                        }
                        else {
                            _self.$oMedia.style.display = "none";
                        }
                    }
                });
            }
            else {
                _self.setImagePath(_self.current);
                
                if (_self.mediaType !== "image") {
                    _self.$showVideo();
                }
                else {
                    _self.$oMedia.style.display = "none";
                }
            }
            
        }, apf.isIE ? 80 : 100);
    };
    
    this.setDescription = function(xmlNode) {
        var title = this.$applyBindRule("caption", xmlNode || this.current);
        
        switch(this.title) {
            case "text":
                var descr = title || "No description";
                break;
            case "number+text":
            case "text+number":
                var part1 = (apf.language.getWord("sub/slideshow/image") || "Image")
                          + " " + (this.getPos() + 1) + " "
                          + (apf.language.getWord("sub/slideshow/of") || "of") + " "
                          + this.getTraverseNodes().length;
                var part2 = title || this.defaulttitle || apf.language.getWord("sub/slideshow/defaulttitle") || "No description";

                var descr = "<b>" + part1 + "</b><br />" + part2;
                break;
            default:
                var descr = apf.language.getWord("sub/slideshow/image") || "Image"
                          + " " + (this.getPos() + 1) + " "
                          + (apf.language.getWord("sub/slideshow/of") || "of") + " "
                          + this.getTraverseNodes().length;
                break;
        }

        this.$oDescr.innerHTML = descr;
    };
    
    this.getPos = function() {
        return Array.prototype.indexOf.call(this.getTraverseNodes(), this.current);
    };
    
    this.setImagePath = function(xmlNode) {
        var src = this.$applyBindRule("src", xmlNode);
        
        if (this.mediaType == "image") {
            this.$oImage.src = src 
                || this.defaultimage 
                || this.defaultthumb;
        }
        else if (this.mediaType == "flash") {
            this.loadMedia(this.mediaType, src);
        }
        else {
            alert("Not supported media type.");
        }
    };
    
    this.loadMedia = function (mediaType, data) {
        this.$oMedia.innerHTML = data;
    };

    this.$next = function() {
        this.select(this.current = this.next);
    };

    this.$previous = function() {
        this.select(this.current = this.previous);
    };
    
    this.centerThumbnail = function(xmlNode) {
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        
        if (!htmlNode || this.noThumbArrows)
            return;
        
        var oLeft  = htmlNode.offsetLeft;
        var oWidth = htmlNode.offsetWidth;
        var _self  = this;
        
        var ocLeft = this.$oThumbs.offsetLeft;
        
        if (htmlNode == this.$oThumbs.firstChild && ocLeft == 0)
            return;
        
        var tCenteredPos  = -1 * oLeft - parseInt((oWidth + apf.getMargin(htmlNode)[0]) / 2);
        var vpCenteredPos = parseInt(this.$oThumbs.parentNode.offsetWidth / 2)
        
        var newLeft = tCenteredPos + this.maxLeft + vpCenteredPos;
        
        newLeft = newLeft > this.maxLeft
            ? this.maxLeft
            : (newLeft < this.minLeft
                ? this.minLeft
                : newLeft);

        apf.tween.single(this.$oThumbs, {
            steps   : 15, 
            type    : "left", 
            anim    : apf.tween.EASEOUT,
            from    : ocLeft, 
            to      : newLeft,
            onfinish : function() {
                
            }
        });
    };
    
    this.isLoaderActive = false;
    
    this.$showLoader = function() {
        if (this.isLoaderActive)
            return;
        
        this.isLoaderActive = true;
        
        this.$oLoader.style.display = "block";
        apf.tween.single(this.$oLoader, {
            steps    : 6, 
            type     : "fade",
            from     : 0,
            to       : 1
        });
    };
    
    this.$hideLoader = function() {
        this.$oLoader.style.display = "none";
        this.isLoaderActive = false;
    };
    
    this.$removeFilters = function() {
        this.$oLoader.style.filter = "";
    }
    
    this.addEventListener("$clear", function(){
        return false
    });
    
    this.addEventListener("afterload", function(){
        this.$setStyleClass(this.$ext, this.$baseCSSname + this.thumbnailMode + "Mode");
        this.imageStack = {};
        this.$show();
    });
    
    this.addEventListener("beforeselect", function(e){
        if (this.loading)
            return false;
        
        if (e.selected)
            this.current = e.selected;
        
        var mediaType = this.$applyBindRule("mediatype", this.current);
        this.mediaType = this.isSupportedType(mediaType)
            ? mediaType 
            : "image";
    });
    
    this.addEventListener("afterselect", function(e){
        if (this.thumbnailMode == "bar")
            this.centerThumbnail(this.current);
        
        this.loading = true;
        
        if (this.$oZoomIcon) {
            if (this.mediaType == "image") {
                var _self = this;
                var url = this.$applyBindRule("url", this.current);
    
                this.$oZoomIcon.onclick = function() {
                    _self.dispatchEvent("zoomclick", {url: url, selected: _self.current});
                    if (url)
                        window.location.href = url;
                };
            }
        }
        this.setDescription();
        this.$refresh();
    });
    
    this.$resize = function() {
        
    };
    
    this.calculateRange = function() {
        this.maxLeft = this.$oThumbs.offsetLeft;
        this.minLeft = -1 * (this.$oThumbs.offsetWidth - this.$oThumbs.parentNode.offsetWidth);
    }

    this.$draw = function(){
        this.$getNewContext("main");
        this.$getNewContext("container");

        //Build Main Skin
        this.$ext = this.$getExternal(null, null, function(oExt){

        });
        
        this.$oImageContainer = this.$getLayoutNode("main", "image_container", this.$ext);
        this.$oViewport       = this.$getLayoutNode("main", "viewport", this.$ext);
        this.$oZoomIcon       = this.$getLayoutNode("main", "zoom_icon", this.$ext);
        this.$oImage          = this.$getLayoutNode("main", "image", this.$ext);
        this.$oImageBase      = this.$getLayoutNode("main", "image_base", this.$ext);
        this.$oNext           = this.$getLayoutNode("main", "next", this.$ext);
        this.$oPrevious       = this.$getLayoutNode("main", "previous", this.$ext);
        
        this.$oBar      = this.$getLayoutNode("main", "bar", this.$ext);
        this.$oDescr    = this.$getLayoutNode("main", "descr", this.$ext);
        this.$oLoader   = this.$getLayoutNode("main", "loader", this.$ext);
        this.$oThumbs   = this.$getLayoutNode("main", "thumbs", this.$ext);
        this.$container = this.$oThumbs;
        
        this.$oArrowPrev = this.$getLayoutNode("main", "arrow_prev", this.$ext);
        this.$oArrowNext = this.$getLayoutNode("main", "arrow_next", this.$ext);
        
        this.$oMedia = this.$getLayoutNode("main", "media", this.$ext);
        
        var rules = "var o = apf.all[" + this.$uniqueId + "];\
                     if (o) o.$resize()";
        apf.layout.setRules(this.$pHtmlNode, this.$uniqueId + "_scaling",
                            rules, true);
        apf.layout.queue(this.$pHtmlNode);
        
        //Events
        var _self = this;
        
        this.$oNext.onclick = function() {
            _self.$next();
        };
        
        this.$oPrevious.onclick = function() {
            _self.$previous();
        };
        
        this.calculateRange();
        this.slideFinish = true;
        
        this.$oArrowPrev.onmouseover = function() {
            if (_self.noThumbArrows)
                return;
                
            clearTimeout(_self.tmrSlide);
            
            _self.tmrSlide = window.setTimeout(function() {
                var oLeft = _self.$oThumbs.offsetLeft;
                
                if (oLeft + 1 > _self.minLeft && oLeft < _self.maxLeft) {
                    _self.$oThumbs.style.left = (oLeft + 1) + "px";
                }
            }, _self.intSSlide);
        };
        
        this.$oArrowPrev.onmouseout = function() {
            clearTimeout(_self.tmrSlide);
        };
        
        this.$oArrowNext.onmouseover = function() {
            if (_self.noThumbArrows)
                return;
            
            clearTimeout(_self.tmrSlide);
            
            _self.tmrSlide = window.setTimeout(function() {
                var oLeft = _self.$oThumbs.offsetLeft;
                
                if (oLeft > _self.minLeft && oLeft - 1 < _self.maxLeft) { 
                    _self.$oThumbs.style.left = (oLeft - 1) + "px";
                }
            }, _self.intSSlide);
        };
        
        this.$oArrowNext.onmouseout = function() {
            clearTimeout(_self.tmrSlide);
        };
        
        this.$oArrowPrev.onclick = function() {
            if (!_self.slideFinish || _self.noThumbArrows)
                return;

            _self.slideFinish = false;
            
            var oLeft   = _self.$oThumbs.offsetLeft;
            var newLeft = oLeft + 200 > _self.maxLeft 
                ? _self.maxLeft 
                : oLeft + 200;
            
            apf.tween.single(_self.$oThumbs, {
                steps   : _self.stepSlide, 
                type    : "left", 
                anim    : apf.tween.EASEOUT,
                from    : oLeft, 
                to      : newLeft,
                onfinish : function() {
                    _self.slideFinish = true;
                }
            });
        };
        
        this.$oArrowNext.onclick = function() {
            if (!_self.slideFinish || _self.noThumbArrows)
                return;

            _self.slideFinish = false;
            var oLeft = _self.$oThumbs.offsetLeft;
            var newLeft = oLeft - 200 < _self.minLeft 
                ? _self.minLeft 
                : oLeft - 200;
            
            apf.tween.single(_self.$oThumbs, {
                steps   : _self.stepSlide, 
                type    : "left", 
                anim    : apf.tween.EASEOUT,
                from    : oLeft, 
                to      : newLeft,
                onfinish : function() {
                    _self.slideFinish = true;
                }
            });
        };
        
        this.arrowsAreVisible = false;
        this.arrowsVisible;
        this.arrowsInvisible;
        this.$oImage.onmouseover = function(e) {
            e = e || event;
            
            if (_self.arrowsAreVisible)
                return;
            
            _self.arrowsVisible = {
                stop : false
            };
            
            if (_self.arrowsInvisible)
                _self.arrowsInvisible.stop = true;

            _self.arrowsAreVisible = true;
            _self.$oNext.style.display = "block";
            _self.$oPrevious.style.display = "block";
            
            apf.tween.multi(_self.$oNext, {
                steps   : 15,
                control : _self.arrowsVisible,
                anim     : apf.tween.EASEOUT,
                tweens   : [
                    {type: "fade", from: apf.getOpacity(_self.$oNext), to: 1},
                    {type: "fade", from: apf.getOpacity(_self.$oPrevious), to: 1, oHtml : _self.$oPrevious}
                ],
                onfinish : function() {
                    _self.$oNext.style.display     = "block";
                    _self.$oPrevious.style.display = "block";
                    _self.$oNext.style.filter      = "";
                    _self.$oPrevious.style.filter  = "";
                }
            });
        };
        
        this.$oImageContainer.onmouseout = function(e) {
            e = e || event;
            var target = e.target || e.srcElement;
            
            if (!_self.arrowsAreVisible)
                return;

            target = e.toElement 
                ? e.toElement 
                : (e.relatedTarget 
                    ? e.relatedTarget 
                    : null);
            
            if (apf.isChildOf(_self.$oImageContainer, target, true))
                return;

            _self.arrowsInvisible = {
                stop : false
            };
            
            if (_self.arrowsVisible)
                _self.arrowsVisible.stop = true;

            _self.arrowsAreVisible = false;

            apf.tween.multi(_self.$oNext, {
                steps   : 15,
                control : _self.arrowsInvisible,
                anim     : apf.tween.EASEOUT,
                tweens   : [
                    {type: "fade", from: apf.getOpacity(_self.$oNext), to: 0},
                    {type: "fade", from: apf.getOpacity(_self.$oPrevious), to: 0, oHtml : _self.$oPrevious}
                ],
                onfinish : function() {
                    _self.$oNext.style.display = "none";
                    _self.$oPrevious.style.display = "none";
                }
            });
        };
        
        if (apf.window.vManager.check(this, "gallery", this.initiateThumbnailEvents))
            this.initiateThumbnailEvents();
    };
}).call(apf.gallery.prototype = new apf.BaseList());

apf.aml.setElement("gallery", apf.gallery);

apf.aml.setElement("url", apf.BindingRule);
apf.aml.setElement("mediatype", apf.BindingRule);
//#endif