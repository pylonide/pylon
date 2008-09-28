jpf.slideshow = jpf.component(jpf.GUI_NODE, function() {
    this.$supportedProperties.push("model", "thumbheight");
    var _self = this;

    var el = [
        ["stuff/lol1.jpg", "1/29 Beach - Jamajska plaza, piekno oceanu, cos musze "+
        "tu napisac zeby zapelnic cala linijke, kurcze jeszcze wiecej musze "+
        "cos musze tu napisac zeby zapelnic cala linijke, kurcze jeszcze "+
        "wiecej musze cos musze tu napisac zeby zapelnic cala linijke, kurcze "+
        "jeszcze wiecej musze", "stuff/lol1_small.jpg"],
        ["stuff/lol2.jpg", "2/29 Sky", "stuff/lol2_small.jpg"],
        ["stuff/lol3.jpg", "3/29 Phone", "stuff/lol3_small.jpg"],
        ["stuff/lol4.jpg", "4/29 Fruit", "stuff/lol4_small.jpg"],
        ["stuff/lol5.jpg", "5/29 Mainboard", "stuff/lol5_small.jpg"],
        ["stuff/lol6.jpg", "6/29 More", "stuff/lol6_small.jpg"],
        ["stuff/lol7.jpg", "7/29 More.", "stuff/lol7_small.jpg"],
        ["stuff/lol8.jpg", "8/29 More..", "stuff/lol8_small.jpg"],
        ["stuff/lol9.jpg", "9/29 More...", "stuff/lol9_small.jpg"],
        ["stuff/lol10.jpg", "10/29 More....", "stuff/lol10_small.jpg"],
        ["stuff/lol11.jpg", "11/29 More... ...", "stuff/lol11_small.jpg"],
        ["stuff/lol12.jpg", "12/29 More and More", "stuff/lol12_small.jpg"],
        ["stuff/lol13.jpg", "13/29 Be quick or be dead", "stuff/lol13_small.jpg"],
        ["stuff/lol14.jpg", "14/29 2 Minutes to Midnight", "stuff/lol14_small.jpg"],
        ["stuff/lol15.jpg", "15/29 The Trooper", "stuff/lol15_small.jpg"],
        ["stuff/lol16.jpg", "16/29 666 The number of the beast" , "stuff/lol16_small.jpg"],
        ["stuff/lol17.jpg", "17/29 Hallowed by thy Name", "stuff/lol17_small.jpg"],
        ["stuff/lol18.jpg", "18/29 Lam", "stuff/lol18_small.jpg"],
        ["stuff/lol19.jpg", "19/29 Shiva my eternal Mistress", "stuff/lol19_small.jpg"],
        ["stuff/lol20.jpg", "20/29 Behemoth", "stuff/lol20_small.jpg"],
        ["stuff/lol21.jpg", "21/29 Shiva my eternal Mistress", "stuff/lol21_small.jpg"],
        ["stuff/lol22.jpg", "22/29 Shiva my eternal Mistress", "stuff/lol22_small.jpg"],
        ["stuff/lol23.jpg", "23/29 Shiva my eternal Mistress", "stuff/lol23_small.jpg"],
        ["stuff/lol24.jpg", "24/29 Shiva my eternal Mistress", "stuff/lol24_small.jpg"],
        ["stuff/lol25.jpg", "25/29 Shiva my eternal Mistress", "stuff/lol25_small.jpg"],
        ["stuff/lol26.jpg", "26/29 Shiva my eternal Mistress", "stuff/lol26_small.jpg"],
        ["stuff/lol27.jpg", "27/29 Shiva my eternal Mistress", "stuff/lol27_small.jpg"],
        ["stuff/lol28.jpg", "28/29 Shiva my eternal Mistress", "stuff/lol28_small.jpg"],
        ["stuff/lol29.jpg", "29/29 Shiva my eternal Mistress", "stuff/lol29_small.jpg"]        
        
    ];  
    
    var control = {
        stop : false
    }; 

    var previous, next, current, actual = 0;
    
   /* previous dimension of big images */
    var lastIHeight = 0;
    var lastIWidth = 0;

    var thumbheight;
    var thumbnails = true;
    
    var loadmsg;
    
    var thumbs = [];
    var thumbsTemp = [];
    
    var startThumb = 0;
    var endThumb = 0;
    var activeThumb = 0;

    var titleHeight = 30;
    var vSpace = 210;
    var hSpace = 150;    

    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    var timer5;
    
    this.addEventListener("onkeydown", function(e){
        var e = (e || event);
        var key = e.keyCode;
        var temp = actual;
        
        switch(key) {
            case 37:
                if(actual - 1 > -1) {
                    actual--;
                    if(actual < startThumb){
                        startThumb--;
                        endThumb--;
                    }
                }  
            break;
            
            case 39:
                if(actual + 1 < el.length) {
                   actual++;
                   if(actual > endThumb){
                       startThumb++;
                       endThumb++;
                   }
               }
            break;
        }
        
        if(actual !== temp) {
            _self.refreshThumbs();
            clearInterval(timer5);
            timer5 = setInterval(function() {
                _self.$refresh();
                clearInterval(timer5);
            }, 550);
        };
        return false;
    });   
    

    function setSiblings() {
        previous = actual - 1 > -1 ? el[actual - 1] : null;
        next = actual + 1 < el.length ? el[actual + 1] : null;
        current = actual > -1 && actual < el.length ? el[actual] : null;
    }

    this.paint = function() {
        current = el[actual];
        var src = current[0];

        this.oInt.style.display = "block";
        this.oBody.style.display = "";
        this.oImage.style.display = "";
        this.oImage.src = "about:blank";
        this.oBody.style.height = this.oBody.style.width = "100px";
        this.oBody.style.marginTop = this.oBody.style.marginLeft = "-50px";
        this.oNext.style.display = "none";
        this.oPrevious.style.display = "none";
        this.oLoading.innerHTML = loadmsg;                

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
            control : control,
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
                    
                    
                    _self.addSelection(actual);
                    
                    var checkWH = [false, false];
                    if(lastIWidth !== imgWidth) { 
                        lastIWidth = imgWidth;
                        jpf.tween.single(b, {
                            steps: Math.abs(imgWidth - b.offsetWidth) > 40 ? 10 : 3, 
                            anim: jpf.tween.EASEIN, 
                            type: "mwidth",
                            control : control,
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
                            control : control,
                            margin : -1*(bottomPanel),
                            from: b.offsetHeight - parseInt(jpf.getStyle(_self.oBody, "borderTopWidth")) - parseInt(jpf.getStyle(_self.oBody, "borderBottomWidth")), 
                            to: Math.min(imgHeight, wh - vSpace - bottomPanel), 
                            onfinish : function() { checkWH[1] = true; }
                        });
                    } 
                    else{
                        checkWH[1] = true;
                    }

                    var timer2;
                    timer2 = setInterval(function() {
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
                                control : control,
                                from: 0, 
                                to: 1}
                            );

                            if(next) {
                                _self.oNext.style.display = "block";
                                jpf.tween.single(_self.oNext, {
                                    steps: 5, 
                                    type: "fade", 
                                    control : control,
                                    from: 0, 
                                    to: 1}
                                );
                            }

                            if(previous) {
                                _self.oPrevious.style.display = "block";
                                jpf.tween.single(_self.oPrevious, {
                                    steps: 5, 
                                    type: "fade", 
                                    control : control,
                                    from: 0, 
                                    to: 1}
                                );
                            }    
                            
                            //_self.addSelection(actual);
                            

                        clearInterval(timer2);
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
                    control : control, 
                    from: 0, 
                    to: 1, 
                    onfinish : function() {
                    }
                });
                
                _self.refreshThumbs();
            }
        });    
    }
    
    this.refreshThumbs = function() {
       var lenThumb = 0;
       var _endThumb = endThumb;
       var ww = jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth;
       
       thumbsTemp = thumbs;
       thumbs = [];
             
              
       for(var i = startThumb, l = el.length, t = null, c = 0; i< l; i++) {
           var temp = thumbsTemp.shift();
           c++;
           t = temp ? temp : new _self.createThumb(i, el[i]);
           if(temp) {               
               t.img.src = el[i][2];
               t.i = i;
               t.el = el[i];
               t.img.setAttribute("display", "block");
               t.img.setAttribute("height", thumbheight - 20);//20 is a number who i choose
               t.img.style.marginBottom = t.img.style.marginTop = (20 - parseInt(jpf.getStyle(t.img, "borderTopWidth")) - parseInt(jpf.getStyle(t.img, "borderBottomWidth")))/2 + "px";
           }           
           lenThumb += t.img.width + parseInt(jpf.getStyle(t.img, "marginRight")) + parseInt(jpf.getStyle(t.img, "marginLeft")) + parseInt(jpf.getStyle(t.img, "borderLeftWidth")) + parseInt(jpf.getStyle(t.img, "borderRightWidth"));
           
           endThumb = i;
           thumbs.push(t);

           if((lenThumb + lenThumb/c > ww - 80) || c == 19) {
               _self.otPrevious.style.visibility =  (startThumb == 0 ? "hidden" : "visible");
               _self.otNext.style.visibility = (endThumb == (el.length - 1) ? "hidden" : "visible");
               this.addSelection(actual);
               return;
           }
       } 
       
    }

    this.createThumb = function(i, el) {
        this.i = i;
        this.el = el;
        this.img = new Image();
        this.src = this.el[2];
        var __self = this;

        _self.otBody.appendChild(this.img);
        
        this.img.src = this.src;
        this.img.className = "picture";        
        this.img.setAttribute("height", thumbheight - 20);//20 is a number who i choose
        this.img.style.marginBottom = this.img.style.marginTop = (20 - parseInt(jpf.getStyle(this.img, "borderTopWidth")) - parseInt(jpf.getStyle(this.img, "borderBottomWidth")))/2 + "px";

        this.img.onclick = function(e) {
            actual = __self.i;
            _self.addSelection(__self.i);
            _self.$refresh();
        }
    }


    this.addSelection = function(actual) {        
        this.clearSelection();
        for(var i = 0, l = thumbs.length; i< l; i++){            
            if(thumbs[i].i == actual) {
                _self.$setStyleClass(thumbs[i].img, "selected");
                activeThumb = i;
                this.$selected = thumbs[i].img;
                return;
            }
        }
    }

    this.clearSelection = function() {
       this.$setStyleClass(this.$selected, "", ["selected"]);
    }

    /**** Init ****/

    this.$Next = function() {
        if(actual + 1 < el.length) {
            actual++;
            this.$refresh();
            this.refreshThumbs();
        }
    }    

    this.$Previous = function() {
        if(actual - 1 > -1) {
            actual--;
            this.$refresh();
            this.refreshThumbs();
        }
    }
    
    this.$tNext = function() {
        if(endThumb + 1 < el.length) {
            startThumb++;
            endThumb++;
            this.refreshThumbs();
        }
    }
    
    this.$tPrevious = function() {
        if(startThumb - 1 > -1) {
            startThumb--;
            endThumb--;
            this.refreshThumbs();
        }
    }

    this.$refresh = function() {
        var img = _self.oImage;
        setSiblings();
        
        control.stop = true;
        control = {
            stop : false
        };
        
        jpf.tween.single(img, {
            steps: 3, 
            type: "fade", 
            control : control,
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oNext, {
            steps: 3, 
            type: "fade", 
            control : control,
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oTitle, {
            steps: 3, 
            type: "fade", 
            control : control,
            from: 1, 
            to: 0}
        );

        jpf.tween.single(_self.oPrevious, {
            steps: 3, 
            type: "fade", 
            control : control,
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
            control : control,
            from: 0, 
            to: 1}
        );

        clearTimeout(_self.timer);
    }

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.oCurtain = this.$getLayoutNode("main", "curtain", this.oExt);
        this.oMove = this.$getLayoutNode("main", "move", this.oExt);
        this.oBody = this.$getLayoutNode("main", "body", this.oExt);
        this.oContent = this.$getLayoutNode("main", "content", this.oExt);
        this.oImage = this.$getLayoutNode("main", "image", this.oExt);
        this.oClose = this.$getLayoutNode("main", "close", this.oExt);
        this.oNext = this.$getLayoutNode("main", "next", this.oExt);
        this.oPrevious = this.$getLayoutNode("main", "previous", this.oExt);
        this.oBeam = this.$getLayoutNode("main", "beam", this.oExt);
        this.oTitle = this.$getLayoutNode("main", "title", this.oExt);
        this.oThumbnails = this.$getLayoutNode("main", "thumbnails", this.oExt);
        this.otBody = this.$getLayoutNode("main", "tbody", this.oExt);
        this.otPrevious = this.$getLayoutNode("main", "tprevious", this.oExt);
        this.otNext = this.$getLayoutNode("main", "tnext", this.oExt);
        this.oLoading = this.$getLayoutNode("main", "loading", this.oExt);

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
                _self.$Previous();
            }
            else{
                _self.$Next();
            }
        }

        var timer3;
        this.otPrevious.onmousedown = function(e) {
            timer3 = setInterval(function() {
                _self.$tPrevious();
            }, 20);
        }        
        
        this.otNext.onmousedown = function(e) {
            timer3 = setInterval(function() {
                _self.$tNext();
            }, 20);
        }
                
        document.onmouseup = function(e) {
            /* otNex, otPrevious buttons */
            clearInterval(timer3);
            
            /* from onmove */
            clearInterval(timer);
            _self.oImage.onmousemove = null;
        }
        

        /* mouse wheel */
        var timer4;
        function onScroll(delta) {
        	var temp = actual;
            if (delta < 0) {
                if(actual + 1 < el.length) {
                    actual++;
                    if(actual > endThumb){
                        startThumb++;
                        endThumb++;
                    }
                }
            }
            else {
                if(actual - 1 > -1) {
                    actual--;
                    if(actual < startThumb){
                        startThumb--;
                        endThumb--;
                    }
                }
            } 

            if(actual !== temp) {
                _self.refreshThumbs();
                
                clearInterval(timer4);
                timer4 = setInterval(function() {
                    _self.$refresh();
                    
                    clearInterval(timer4);
                }, 400); 
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

        if (document.addEventListener) {
            document.addEventListener('DOMMouseScroll', wheel, false);
        }
        window.onmousewheel = document.onmousewheel = wheel;


        /* end of mouse wheel*/

        this.oClose.onclick = function() {
            _self.oBody.style.display = "none";
            jpf.tween.single(_self.oCurtain, {
                steps: 3, 
                type: "fade",
                control : control, 
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

            /*document.onmouseup = function(e) {
                clearInterval(timer);
                _self.oImage.onmousemove = null;
            }*/
        }

        /* move code end */
       this.oExt.onresize = function() {
           //alert("ok")
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

    this.$loadJml = function(x) {
       var nodes = x.childNodes;

       thumbheight = this.thumbheight ? this.thumbheight : 50;
       loadmsg     = this.loadmsg ? this.loadmsg : "Loading...";

       this.paint();
    }
}).implement(jpf.Presentation);
