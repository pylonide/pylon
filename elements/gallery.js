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

// #ifdef __AMLFRAME || __INC_ALL
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
    
    this.thumbheight   = 50;
    this.imageheight   = 400;
    
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
    
    this.$propHandlers["thumbheight"] = function(value) {
        value = parseInt(value);
        if (value > 0)
            this.thumbheight = value;
    };
    
    this.$propHandlers["imageheight"] = function(value) {
        value = parseInt(value);
        if (value > 0)
            this.imageheight = value;
    };
    
    this.$propHandlers["thumb-mode"] = function(value) {
        this.thumbnailMode = value;
        this.$setStyleClass(this.$ext, value + "Mode", ["barMode", "gridMode"]);
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
        var nodes     = this.$container.childNodes;
        var nodes_len = nodes.length;
        
        var thumbBarSize = 0;
        for (var i = 0; i < nodes_len; i++) {
            if ((nodes[i].className || "").indexOf("thumbnail") > -1) {
                thumbBarSize += nodes[i].offsetWidth + apf.getMargin(nodes[i])[0];
            }
        }
        
        this.$container.style.width = thumbBarSize + "px";
    };
    
    this.initiateThumbnailEvents = function() {
        var thumbs     = this.$container.childNodes;
        var thumbs_len = thumbs.length;
        var _self      = this;
        
        for (var i = 0; i < thumbs_len; i++) {
            if ((thumbs[i].className || "").indexOf("thumbnail") > -1) {
                thumbs[i].onmouseover = function(e) {
                    _self.$hoverThumb(e, this);
                };
                
                thumbs[i].onmouseout = function(e) {
                    _self.$hoverThumb(e, this);
                };
            }
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
    
    this.$show = function() {
        var _self = this;
        this.$oImage.src = "about:blank";
        this.$showLoader();
        
        this.$oImageContainer.style.height = this.$oViewport.style.height = this.imageheight + "px";
        
        if (this.thumbnailMode == "bar")
            this.calcThumbBarSize();
        
        
        this.$oImage.onload = function() {
            _self.$hideLoader();
            _self.$oImageBase.src = _self.$oImage.src;
            _self.last = _self.current;
            _self.$setSiblings();
            _self.initiateThumbnailEvents();
            
            //Get image dimension
            _self.$oImageBase.style.display = "block";
            var imgWidth  = _self.$oImageBase.offsetWidth || _self.$oImageBase.width;
            var imgHeight = _self.$oImageBase.offsetHeight || _self.$oImageBase.height;
            _self.$oImageBase.style.display = "none";
            
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
            
            _self.$oImage.style.width      = nWidth + "px";
            _self.$oImage.style.height     = nHeight + "px";
            _self.$oImage.style.marginTop  = parseInt((vpHeight - nHeight) / 2) + "px";
            _self.$oImage.style.marginLeft = parseInt((vpWidth - nWidth) / 2) + "px";
            _self.$oImage.style.display    = "block";
            
            _self.setDescription();
            
            apf.tween.single(_self.$oImage, {
                steps : 20,
                type  : "fade",
                anim  : apf.tween.NORMAL,
                from  : 0,
                to    : 1,
                onfinish: function(){
                
                }
            });
        }
    };
    
    this.$refresh = function() {
        this.$showLoader();
        
        var _self = this;
        clearInterval(this.tmrRefresh);
        _self.tmrRefresh = setInterval(function() {
            clearInterval(_self.tmrRefresh);
            
            apf.tween.single(_self.$oImage, {
                steps : 10,
                type  : "fade",
                anim  : apf.tween.NORMAL,
                from  : 1,
                to    : 0,
                onfinish: function(){
                    _self.setImagePath(_self.current);
                }
            });
        }, 300);
    };
    
    this.setDescription = function(xmlNode) {
        var title = this.current.getAttribute("title")
        
        switch(this.title) {
            case "text":
                var descr = title;
                break;
            case "number+text":
            case "text+number":
                var part1 = apf.language.getWord("sub.slideshow.image") || "Image"
                          + " " + (this.getPos() + 1) + " "
                          + (apf.language.getWord("sub.slideshow.of") || "of") + " "
                          + this.getTraverseNodes().length;
                var part2 = title || this.defaulttitle || apf.language.getWord("sub.slideshow.defaulttitle") || "No description";

                var descr = "<b>" + part1 + "</b><br />" + part2;
                break;
            default:
                var descr = apf.language.getWord("sub.slideshow.image") || "Image"
                          + " " + (this.getPos() + 1) + " "
                          + (apf.language.getWord("sub.slideshow.of") || "of") + " "
                          + this.getTraverseNodes().length;
                break;
        }

        this.$oDescr.innerHTML = descr;
    };
    
    this.getPos = function() {
        return Array.prototype.indexOf.call(this.getTraverseNodes(), this.current);
    };
    
    this.setImagePath = function(xmlNode) {
        this.$oImage.src = this.$applyBindRule("src", xmlNode) 
            || this.defaultimage 
            || this.defaultthumb;
    };

    this.$next = function() {
        this.select(this.current = this.next);
    };

    this.$previous = function() {
        this.select(this.current = this.previous);
    };
    
    this.addEventListener("afterselect", function(e){
        e = e || event;
        
        if (e.selected)
            this.current = e.selected;
        
        if (this.thumbnailMode == "bar")
            this.centerThumbnail(this.current);
        
        this.$refresh();
    });
    
    this.centerThumbnail = function(xmlNode) {
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        
        if (htmlNode == this.$container.firstChild)
            return;
        
        var oLeft  = htmlNode.offsetLeft;
        var oWidth = htmlNode.offsetWidth;
        var _self  = this;
        
        var ocLeft = this.$container.offsetLeft;
        
        var tCenteredPos  = -1 * oLeft - parseInt((oWidth + apf.getMargin(htmlNode)[0]) / 2);
        var vpCenteredPos = parseInt((this.$container.parentNode.offsetWidth - this.$oArrowPrev.offsetWidth - this.$oArrowNext.offsetWidth) / 2)
        
        var newLeft = tCenteredPos + this.maxLeft + vpCenteredPos;
        
        newLeft = newLeft > this.maxLeft
            ? this.maxLeft
            : (newLeft < this.minLeft
                ? this.minLeft
                : newLeft);

        apf.tween.single(this.$container, {
            steps   : 15, 
            type    : "left", 
            anim    : apf.tween.EASEOUT,
            from    : ocLeft, 
            to      : newLeft,
            onfinish : function() {
                
            }
        });
    };
    
    this.$showLoader = function() {
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
    };
    
    this.$removeFilters = function() {
        this.$oLoader.style.filter = "";
    }
    
    this.addEventListener("$clear", function(){return false});
    
    this.$resize = function() {
        this.maxLeft = this.$container.offsetLeft;
        this.minLeft = -1 * (this.$container.offsetWidth - this.$container.parentNode.offsetWidth + this.$oArrowNext.offsetWidth);
    };

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
        this.$container = this.$getLayoutNode("main", "thumbs", this.$ext);
        
        this.$oArrowPrev = this.$getLayoutNode("main", "arrow_prev", this.$ext);
        this.$oArrowNext = this.$getLayoutNode("main", "arrow_next", this.$ext);
        
        this.$setStyleClass(this.$ext, this.thumbnailMode + "Mode");
        
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
        
        this.maxLeft = this.$container.offsetLeft;
        this.minLeft = -1 * (this.$container.offsetWidth - this.$container.parentNode.offsetWidth + this.$oArrowNext.offsetWidth);
        this.slideFinish = true;
        
        this.$oArrowPrev.onmouseover = function() {
            clearInterval(_self.tmrSlide);
            
            _self.tmrSlide = setInterval(function() {
                var oLeft = _self.$container.offsetLeft;
                
                if (oLeft + 1 > _self.minLeft && oLeft < _self.maxLeft) {
                    _self.$container.style.left = (oLeft + 1) + "px";
                }
            }, apf.isIE ? 2 : 10);
        };
        
        this.$oArrowPrev.onmouseout = function() {
            clearInterval(_self.tmrSlide);
        };
        
        this.$oArrowNext.onmouseover = function() {
            clearInterval(_self.tmrSlide);
            
            _self.tmrSlide = setInterval(function() {
                var oLeft = _self.$container.offsetLeft;
                
                if (oLeft > _self.minLeft && oLeft - 1 < _self.maxLeft) { 
                    _self.$container.style.left = (oLeft - 1) + "px";
                }
            }, apf.isIE ? 2 : 10);
        };
        
        this.$oArrowNext.onmouseout = function() {
            clearInterval(_self.tmrSlide);
        };
        
        this.$oArrowPrev.onclick = function() {
            if (!_self.slideFinish)
                return;

            _self.slideFinish = false;
            
            var oLeft   = _self.$container.offsetLeft;
            var newLeft = oLeft + 200 > _self.maxLeft 
                ? _self.maxLeft 
                : oLeft + 200;
            
            apf.tween.single(_self.$container, {
                steps   : 15, 
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
            if (!_self.slideFinish)
                return;

            _self.slideFinish = false;

            var oLeft = _self.$container.offsetLeft;
            var newLeft = oLeft - 200 < _self.minLeft 
                ? _self.minLeft 
                : oLeft - 200;
            
            apf.tween.single(_self.$container, {
                steps   : 15, 
                type    : "left", 
                anim    : apf.tween.EASEOUT,
                from    : oLeft, 
                to      : newLeft,
                onfinish : function() {
                    _self.slideFinish = true;
                }
            });
        };
    };
}).call(apf.gallery.prototype = new apf.BaseList());

apf.aml.setElement("gallery", apf.gallery);