jpf.slideshow = jpf.component(jpf.GUI_NODE, function() {
    this.__supportedProperties.push("model");
    var _self = this;

    var el = [
        ["stuff/lol2.jpg", "Beach - Jamajska plaza, piekno oceanu, cos musze "+
        "tu napisac zeby zapelnic cala linijke, kurcze jeszcze wiecej musze "+
        "cos musze tu napisac zeby zapelnic cala linijke, kurcze jeszcze "+
        "wiecej musze cos musze tu napisac zeby zapelnic cala linijke, kurcze "+
        "jeszcze wiecej musze"],
        ["stuff/lol4.jpg", "1/19 Sky"],
        ["stuff/lol1.jpg", "2/19 Phone"],
        ["stuff/lol5.jpg", "3/19 Fruit"],
        ["stuff/lol3.jpg", "4/19 Mainboard"],
        ["stuff/lol6.jpg", "5/19 More"],
        ["stuff/lol7.jpg", "6/19 More."],
        ["stuff/lol8.jpg", "7/19 More.."],
        ["stuff/lol9.jpg", "8/19 More..."],
        ["stuff/lol10.jpg", "9/19 More...."],
        ["stuff/lol11.jpg", "10/19 More... ..."],
        ["stuff/lol12.jpg", "11/19 More and More"],
        ["stuff/lol13.jpg", "12/19 Be quick or be dead"],
        ["stuff/lol14.jpg", "13/19 2 Minutes to Midnight"],
        ["stuff/lol15.jpg", "14/19 The Trooper"],
        ["stuff/lol16.jpg", "15/19 666 The number of the beast"],
        ["stuff/lol17.jpg", "16/19 Hallowed by thy Name"],
        ["stuff/lol18.jpg", "17/19 Lam"],
        ["stuff/lol19.jpg", "18/19 Shiva my eternal Mistress"],
        ["stuff/lol20.jpg", "19/19 Behemoth"]
        
    ];

    var previous, next, current, actual = 0;    
    
    function setSiblings() {
        jpf.console.info("Siblings: "+actual)
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
                    
                    clearTimeout(_self.timer);
                    
                    var ww = jpf.isIE
                        ? document.documentElement.offsetWidth
                        : window.innerWidth;
                    var wh = jpf.isIE 
                        ? document.documentElement.offsetHeight
                        : window.innerHeight;
                        
                        
                    _self.oNext.style.top = wh/2 + 20 - (_self.oTitle.offsetHeight/2 || 25); /* 20 - half arrow height */
                    _self.oPrevious.style.top = wh/2 + 20 - (_self.oTitle.offsetHeight/2 || 25);
                    
                    jpf.tween.single(b, {
                        steps: Math.abs(imgWidth - b.offsetWidth) > 40 ? 10 : 3, 
                        anim: jpf.tween.EASEIN, 
                        type: "mwidth",
                        from: b.offsetWidth - parseInt(jpf.getStyle(_self.oBody, "borderLeftWidth")) - parseInt(jpf.getStyle(_self.oBody, "borderRightWidth")), 
                        to: Math.min(imgWidth, ww - 150)
                        }).single(b, {
                            steps: Math.abs(imgHeight - b.offsetHeight) > 40 ? 10 : 3, 
                            anim: jpf.tween.EASEIN, 
                            type: "mheight", 
                            margin : -25,
                            from: b.offsetHeight - parseInt(jpf.getStyle(_self.oBody, "borderTopWidth")) - parseInt(jpf.getStyle(_self.oBody, "borderBottomWidth")), 
                            to: Math.min(imgHeight, wh - 210), 
                            onfinish : function() {
                                //setSiblings();
                                im.style.display = "block";
                                _self.oTitle.style.display = "block";
                                
                                _self.oMove.style.display = imgWidth < ww - 150 && imgHeight < wh - 210 ? "none" : "block";
                                _self.oImage.style.cursor = imgWidth < ww - 150 && imgHeight < wh - 210 ? "default" : "move";
                                jpf.tween.single(im, {
                                    steps: 5, 
                                    type: "fade", 
                                    from: 0, 
                                    to: 1});

                                  if(next) {
                                      _self.oNext.style.display = "block";
                                      jpf.tween.single(_self.oNext, {
                                          steps: 5, 
                                          type: "fade", 
                                          from: 0, 
                                          to: 1});
                                  }
                                  
                                  if(previous){
                                      _self.oPrevious.style.display = "block";
                                      jpf.tween.single(_self.oPrevious, {
                                          steps: 5, 
                                          type: "fade", 
                                          from: 0, 
                                          to: 1});
                                  }
                              }})
                }

                clearTimeout(_self.timer);
                _self.timer = setTimeout(
                    function() {_self.oInt.onclick();},
                    3000);

                _self.oImage.src = src;

                jpf.tween.single(_self.oTitle, {
                    steps: 10, 
                    type: "fade", 
                    from: 0, 
                    to: 1, 
                    onfinish : function(){
                        _self.oContent.innerHTML = current[1];
                    }
                });
            }
        });
    }

    /**** Init ****/

    this.__getNext = function() {
        if(actual + 1 < el.length){
            //current = next;
            actual++;
            this.__refresh();
        }
        
    }

    this.__getPrevious = function() {
        if(actual - 1 > -1){
            //current = previous;
            actual--;
            this.__refresh();
        }        
    }
    
    this.__refresh = function() {
        jpf.console.info("refresh...");
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
                img.style.left = "0px";
                img.style.top = "0px";
                img.src = current[0];
                _self.oContent.innerHTML = current[1];
            }
        });
        jpf.tween.single(_self.oTitle, {
            steps: 10, 
            type: "fade", 
            from: 0, 
            to: 1}
        );

        clearTimeout(_self.timer);
        //_self.timer = setTimeout(function(){_self.oInt.onclick();}, 3000);

        //(e || event).cancelBubble = true;
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
        this.oTitle = this.__getLayoutNode("main", "title", this.oExt);

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
                _self.__getPrevious();
            }
            else{
                _self.__getNext();
            }
        }
        
        /* mouse wheel */
       var timer2;
        function onScroll(delta) {
            var temp = actual;
            if (delta < 0) {
                if(actual + 1 < el.length){
                    //current = next;
                    actual++;                   
                }                
                //_self.__getPrevious();
            }                
            else {
                if(actual - 1 > -1){
                    //current = previous;
                    actual--;                    
                }      
                //_self.__getNext();
            } 
            jpf.console.info("actual "+actual);
           if(actual !== temp){
                clearInterval(timer2);
                timer2 = setInterval(function() {  
                    _self.__refresh();
                    jpf.console.info("runned...");
                    clearInterval(timer2);
                }, 300); 
            };               
        }    
        
        function wheel(event){
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
               
           var wt = Math.min(imgWidth, ww - 150);
           if(wt > -1) {
               b.style.width = wt + "px";
               b.style.marginLeft = -1*(wt/2 + parseInt(jpf.getStyle(b, "borderLeftWidth"))) + "px"; 
           }
           
           var ht = Math.min(imgHeight, wh - 210);
           if(ht > -1){
               b.style.height = ht + "px";
               b.style.marginTop = -1*(ht/2 + parseInt(jpf.getStyle(b, "borderTopWidth")) + _self.oTitle.offsetHeight/2) + "px";
           }
           
           /* refreshing cursor and move icon */
           _self.oMove.style.display = imgWidth < ww - 150 && imgHeight < wh - 210 ? "none" : "block";
           img.style.cursor = imgWidth < ww - 150 && imgHeight < wh - 210 ? "default" : "move";
           
           /* vertical center of next/prev arrows  */
           _self.oNext.style.top = wh/2 + 20 - (_self.oTitle.offsetHeight/2 || 25);
           _self.oPrevious.style.top = wh/2 + 20 - (_self.oTitle.offsetHeight/2 || 25);
           
           /* reset image position */
           img.style.left = "0px";
           img.style.top = "0px";
       }
       
    }

    this.__loadJml = function(x) {
       var nodes = x.childNodes;
       
       this.paint();    
       
       
    }
}).implement(jpf.Presentation);
