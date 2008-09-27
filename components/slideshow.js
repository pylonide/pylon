jpf.slideshow = jpf.component(jpf.GUI_NODE, function() {
    this.__supportedProperties.push("model", "thumbheight");
    var _self = this;

    var el = [
        ["stuff/lol2.jpg", "Beach - Jamajska plaza, piekno oceanu, cos musze "+
        "tu napisac zeby zapelnic cala linijke, kurcze jeszcze wiecej musze "+
        "cos musze tu napisac zeby zapelnic cala linijke, kurcze jeszcze "+
        "wiecej musze cos musze tu napisac zeby zapelnic cala linijke, kurcze "+
        "jeszcze wiecej musze", "stuff/lol2_small.jpg"],
        ["stuff/lol4.jpg", "1/19 Sky", "stuff/lol4_small.jpg"],
        ["stuff/lol1.jpg", "2/19 Phone", "stuff/lol1_small.jpg"],
        ["stuff/lol5.jpg", "3/19 Fruit", "stuff/lol5_small.jpg"],
        ["stuff/lol3.jpg", "4/19 Mainboard", "stuff/lol3_small.jpg"],
        ["stuff/lol6.jpg", "5/19 More", "stuff/lol6_small.jpg"],
        ["stuff/lol7.jpg", "6/19 More.", "stuff/lol7_small.jpg"],
        ["stuff/lol8.jpg", "7/19 More..", "stuff/lol8_small.jpg"],
        ["stuff/lol9.jpg", "8/19 More...", "stuff/lol9_small.jpg"],
        ["stuff/lol10.jpg", "9/19 More....", "stuff/lol10_small.jpg"],
        ["stuff/lol11.jpg", "10/19 More... ...", "stuff/lol11_small.jpg"],
        ["stuff/lol12.jpg", "11/19 More and More", "stuff/lol12_small.jpg"],
        ["stuff/lol13.jpg", "12/19 Be quick or be dead", "stuff/lol13_small.jpg"],
        ["stuff/lol14.jpg", "13/19 2 Minutes to Midnight", "stuff/lol14_small.jpg"],
        ["stuff/lol15.jpg", "14/19 The Trooper", "stuff/lol15_small.jpg"],
        ["stuff/lol16.jpg", "15/19 666 The number of the beast" , "stuff/lol16_small.jpg"],
        ["stuff/lol17.jpg", "16/19 Hallowed by thy Name", "stuff/lol17_small.jpg"],
        ["stuff/lol18.jpg", "17/19 Lam", "stuff/lol18_small.jpg"],
        ["stuff/lol19.jpg", "18/19 Shiva my eternal Mistress", "stuff/lol19_small.jpg"],
        ["stuff/lol20.jpg", "19/19 Behemoth", "stuff/lol20_small.jpg"]
        
    ];   


    var previous, next, current, actual = 0;

    var lastClicked = null;
    var lastIHeight = 0;
    var lastIWidth = 0;

    var thumbheight = 50;
    var thumbnails = true;
    var thumbs = [];

    var titleHeight = 30;    
    var vSpace = 210;
    var hSpace = 150;

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    var timer2;
    this.keyHandler = function(key, ctrlKey, shiftKey) {        
        var temp = actual;
        if(key == 37) {
            if(actual - 1 > -1) {
                actual--;
            }  
        }
        else if(key == 39) {
           if(actual + 1 < el.length) {
               actual++;
           }
        }

        if(actual !== temp) {
            clearInterval(timer2);
            timer2 = setInterval(function() {
                _self.__refresh();
                clearInterval(timer2);
            }, 300);
        };

        return false;
    }

    function setSiblings() {
        previous = actual - 1 > -1 ? el[actual - 1] : null;
        next = actual + 1 < el.length ? el[actual + 1] : null;
        current = actual > -1 && actual < el.length ? el[actual] : null;
    }

    this.paint = function() {
        current = el[0];
        var src = current[0];

        this.oInt.style.display = "block";
        this.oBody.style.display = "";
        this.oImage.style.display = "";
        this.oImage.src = "about:blank";
        this.oBody.style.height = this.oBody.style.width = "100px";
        this.oBody.style.marginTop = this.oBody.style.marginLeft = "-50px";
        this.oNext.style.display = "none";
        this.oPrevious.style.display = "none";

        if(jpf.isIE6) {
            this.oInt.style.top = document.documentElement.scrollTop + "px";
            this.oInt.style.height = document.documentElement.offsetHeight + 
            "px";
        }

        jpf.tween.single(this.oCurtain, {
            steps: 3, 
            type: "fade", 
            from: 0, 
            to: 0.7,
            onfinish: function() {
                _self.oImage.onload = function() {
                    _self.oBody.style.display = "block";
                    this.style.display = "block";
                    var imgWidth = this.offsetWidth;
                    var imgHeight = this.offsetHeight;
                    var b = _self.oBody;
                    var im = _self.oImage;
                    this.style.display = "none";
                    
                    _self.oThumbnails.style.height = thumbheight + "px";
                    
                    clearTimeout(_self.timer);
                    
                    var ww = jpf.isIE
                        ? document.documentElement.offsetWidth
                        : window.innerWidth;
                    var wh = jpf.isIE 
                        ? document.documentElement.offsetHeight
                        : window.innerHeight;
                    
                    var bottomPanel = thumbnails ? Math.max(_self.oBeam.offsetHeight/2, thumbheight/2 + titleHeight) : Math.max(_self.oBeam.offsetHeight/2, titleHeight);
                        
                    _self.oNext.style.top = wh/2 + 20 - bottomPanel; /* 20 - half arrow height */
                    _self.oPrevious.style.top = wh/2 + 20 - bottomPanel;
                    
                    if(thumbs[actual]){
                        _self.addSelection(actual);
                    }
                    
                    var checkWH = [false, false];
                    if(lastIWidth !== imgWidth) { 
                        lastIWidth = imgWidth;
                        jpf.tween.single(b, {
                            steps: Math.abs(imgWidth - b.offsetWidth) > 40 ? 10 : 3, 
                            anim: jpf.tween.EASEIN, 
                            type: "mwidth",
                            from: b.offsetWidth - parseInt(jpf.getStyle(_self.oBody, "borderLeftWidth")) - parseInt(jpf.getStyle(_self.oBody, "borderRightWidth")), 
                            to: Math.min(imgWidth, ww - hSpace),
                            onfinish : function(){checkWH[0] = true;}
                        });
                    }
                    else{
                        checkWH[0] = true;
                    }
                    
                    if(lastIHeight !== imgHeight) {
                        lastIHeight = imgHeight;
                        jpf.tween.single(b, {
                            steps: Math.abs(imgHeight - b.offsetHeight) > 40 ? 10 : 3, 
                            anim: jpf.tween.EASEIN, 
                            type: "mheight", 
                            margin : -1*(bottomPanel),
                            from: b.offsetHeight - parseInt(jpf.getStyle(_self.oBody, "borderTopWidth")) - parseInt(jpf.getStyle(_self.oBody, "borderBottomWidth")), 
                            to: Math.min(imgHeight, wh - vSpace - bottomPanel), 
                            onfinish : function() { checkWH[1] = true; }
                        });
                    } 
                    else{
                        checkWH[1] = true;
                    }

                    var timer3;
                    timer3 = setInterval(function() {
                        if(checkWH[0] && checkWH[1]) {
                            setSiblings();

                            _self.oTitle.style.display = "block";

                            if(thumbnails) {
                                _self.oThumbnails.style.display = "block";
                            }

                            _self.oMove.style.display = imgWidth < ww - hSpace && imgHeight < wh - vSpace - bottomPanel ? "none" : "block";
                            _self.oImage.style.cursor = imgWidth < ww - hSpace && imgHeight < wh - vSpace - bottomPanel ? "default" : "move";

                            im.style.display = "block";
                            jpf.tween.single(im, {
                                steps: 5, 
                                type: "fade", 
                                from: 0, 
                                to: 1}
                            );

                            if(next) {
                                _self.oNext.style.display = "block";
                                jpf.tween.single(_self.oNext, {
                                    steps: 5, 
                                    type: "fade", 
                                    from: 0, 
                                    to: 1}
                                );
                            }

                            if(previous) {
                                _self.oPrevious.style.display = "block";
                                jpf.tween.single(_self.oPrevious, {
                                    steps: 5, 
                                    type: "fade", 
                                    from: 0, 
                                    to: 1}
                                );
                            }    
                            if((thumbs[actual].img.className || "").indexOf("selected") == -1) {
                                _self.addSelection(actual);
                            }

                        clearInterval(timer3);
                        }
                    }, 30);
                }

                /*clearTimeout(_self.timer);
                _self.timer = setTimeout(
                    function() {_self.oInt.onclick();},
                    3000);*/

                _self.oImage.src = src;

                _self.oContent.innerHTML = current[1];
                jpf.tween.single(_self.oTitle, {
                    steps: 10, 
                    type: "fade", 
                    from: 0, 
                    to: 1, 
                    onfinish : function() {
                    }
                });

                for(var i = 0, l = el.length; i< l; i++) {
                   thumbs.push(new _self.createThumb(i, el[i]));
                }
            }
        });
    }

    this.createThumb = function(i, el) {
        this.i = i;
        this.el = el;
        this.img = new Image();
        this.src = this.el[2];
        var __self = this;

        this.img.src = this.src;
        this.img.className = "picture";

        _self.oThumbnails.appendChild(this.img);

        this.img.onclick = function(e) {
            actual = __self.i;
            _self.__refresh();
        }
    }

    this.addSelection = function(i) {
        _self.__setStyleClass(thumbs[i].img, "selected");

        if(lastClicked || lastClicked == 0) {
            _self.__setStyleClass(thumbs[lastClicked].img, "", ["selected"]);
        }
        lastClicked = i;
    }

    /**** Init ****/

    this.__Next = function() {
        if(actual + 1 < el.length) {
            actual++;
            this.__refresh();
        }
    }

    this.__Previous = function() {
        if(actual - 1 > -1) {
            actual--;
            this.__refresh();
        }
    }

    this.__refresh = function() {
        var img = _self.oImage;
        setSiblings();
        jpf.tween.single(img, {
            steps: 3, 
            type: "fade", 
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oNext, {
            steps: 3, 
            type: "fade", 
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oTitle, {
            steps: 3, 
            type: "fade", 
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oPrevious, {
            steps: 3, 
            type: "fade", 
            from: 1, 
            to: 0, 
            onfinish : function() {
                _self.oNext.style.display = "none";
                _self.oPrevious.style.display = "none";
                _self.oTitle.style.display = "none";
                //_self.oThumbnails.style.display = "none";
                img.style.left = "0px";
                img.style.top = "0px";
                img.src = current[0];
                _self.oContent.innerHTML = current[1];
            }
        });

        jpf.tween.single(_self.oTitle, {
            steps: 20, 
            type: "fade", 
            from: 0, 
            to: 1}
        );

        clearTimeout(_self.timer);
    }

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("main", "container", this.oExt);
        this.oCurtain = this.__getLayoutNode("main", "curtain", this.oExt);
        this.oMove = this.__getLayoutNode("main", "move", this.oExt);
        this.oBody = this.__getLayoutNode("main", "body", this.oExt);
        this.oContent = this.__getLayoutNode("main", "content", this.oExt);
        this.oImage = this.__getLayoutNode("main", "image", this.oExt);
        this.oClose = this.__getLayoutNode("main", "close", this.oExt);
        this.oNext = this.__getLayoutNode("main", "next", this.oExt);
        this.oPrevious = this.__getLayoutNode("main", "previous", this.oExt);
        this.oBeam = this.__getLayoutNode("main", "beam", this.oExt);
        this.oTitle = this.__getLayoutNode("main", "title", this.oExt);
        this.oThumbnails = this.__getLayoutNode("main", "thumbnails", this.oExt);

        if(jpf.isIE6) {
            this.oInt.style.position = "absolute";
            document.documentElement.onscroll = function() {
                if(!_self.oInt.offsetHeight) return;

                _self.oInt.style.top = 
                    document.documentElement.scrollTop + "px";
                _self.oInt.style.height = 
                    document.documentElement.offsetHeight + "px";
            }
        }

        this.oPrevious.onclick = 
        this.oNext.onclick = function(e) {

            if(this.className == "previous") {
                _self.__Previous();
            }
            else{
                _self.__Next();
            }
        }

        /* mouse wheel */
        var timer2;
        function onScroll(delta) {
            var temp = actual;
            if (delta < 0) {
                if(actual + 1 < el.length) {
                    actual++;
                }
            }
            else {
                if(actual - 1 > -1) {
                    actual--;
                }
            } 

           if(actual !== temp) {
                clearInterval(timer2);
                timer2 = setInterval(function() {
                    _self.__refresh();
                    clearInterval(timer2);
                }, 300); 
            };
        }

        function wheel(event) {
            var delta = 0;
            if (!event) event = window.event;
            if (event.wheelDelta) {
                delta = event.wheelDelta/120; 
                if (window.opera) {
                    delta *= -1;
                }
            } 
            else if (event.detail) {
                delta = -event.detail/3;
            }

            if (delta) {
                onScroll(delta);
            }
            if (event.preventDefault) {
                event.preventDefault();
            }
            event.returnValue = false;
        }

        if (_self.oImage.addEventListener) {
            _self.oImage.addEventListener('DOMMouseScroll', wheel, false);
        }
        _self.oImage.onmousewheel = _self.oImage.onmousewheel = wheel;


        /* end of mouse wheel*/

        this.oClose.onclick = function() {
            _self.oBody.style.display = "none";
            jpf.tween.single(_self.oCurtain, {
                steps: 3, 
                type: "fade", 
                from: 0.7, 
                to: 0,
                onfinish : function() {
                    _self.oInt.style.display = "none";
                }});
        }

        /* move code */
        var timer;
        this.oImage.onmousedown = function(e) {
            var e = (e || event);
            var ww = jpf.isIE
                ? document.documentElement.offsetWidth
                : window.innerWidth;
            var wh = jpf.isIE 
                ? document.documentElement.offsetHeight
                : window.innerHeight;
            var b = _self.oBody;

            var dx = b.offsetWidth - parseInt(jpf.getStyle(b, "borderLeftWidth")) - parseInt(jpf.getStyle(b, "borderRightWidth")) - _self.oImage.offsetWidth;
            var dy = b.offsetHeight - parseInt(jpf.getStyle(b, "borderTopWidth")) - parseInt(jpf.getStyle(b, "borderBottomWidth")) - _self.oImage.offsetHeight;
            var t = _self.oImage.offsetTop;
            var l = _self.oImage.offsetLeft;

            var stepX = 0, stepY = 0, cy = e.clientY, cx = e.clientX, x, y;

            clearInterval(timer);
            timer = setInterval(function() {
                if(dx < 0) {
                    if(l-stepX >= dx && l-stepX <=0) {
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
                var e = (e || event);
                
                y = e.clientY;
                x = e.clientX;

                stepX = cx - x;
                stepY = cy - y;
            
                return false;
            }

            document.onmouseup = function(e) {
                clearInterval(timer);
                _self.oImage.onmousemove = null;
            }
        }

        /* move code end */
       window.onresize = function() {
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
           if(wt > -1) {
               b.style.width = wt + "px";
               b.style.marginLeft = -1*(wt/2 + parseInt(jpf.getStyle(b, "borderLeftWidth"))) + "px"; 
           }
           var bottomPanel = thumbnails ? Math.max(_self.oBeam.offsetHeight/2, thumbheight/2 + titleHeight) : Math.max(_self.oBeam.offsetHeight/2, titleHeight);
           //var bottomPanel = Math.max(_self.oBeam.offsetHeight/2, thumbheight/2 + titleHeight);
           var ht = Math.min(imgHeight, wh - vSpace - bottomPanel);           
           
           if(ht > -1) {
               b.style.height = ht + "px";
               b.style.marginTop = -1*(ht/2 + parseInt(jpf.getStyle(b, "borderTopWidth")) + bottomPanel) + "px";
           }

           /* refreshing cursor and move icon */
           _self.oMove.style.display = imgWidth < ww - hSpace && imgHeight < wh - vSpace ? "none" : "block";
           img.style.cursor = imgWidth < ww - hSpace && imgHeight < wh - vSpace ? "default" : "move";

           /* vertical center of next/prev arrows  */
           _self.oNext.style.top = wh/2 + 20 - bottomPanel;
           _self.oPrevious.style.top = wh/2 + 20 - bottomPanel;

           /* reset image position */
           img.style.left = "0px";
           img.style.top = "0px";
       }
    }

    this.__loadJml = function(x) {
       var nodes = x.childNodes;

       if(this.thumbheight) {
           thumbheight = this.thumbheight;
       }

       this.paint();
    }
}).implement(jpf.Presentation);
