jpf.slideshow = jpf.component(jpf.GUI_NODE, function() {
    this.__supportedProperties.push("model");
    var _self = this;

    var el = [
        ["stuff/lol2.jpg", "Beach - Jamajska plaza, piekno oceanu, cos musze "+
        "tu napisac zeby zapelnic cala linijke, kurcze jeszcze wiecej musze "+
        "cos musze tu napisac zeby zapelnic cala linijke, kurcze jeszcze "+
        "wiecej musze cos musze tu napisac zeby zapelnic cala linijke, kurcze "+
        "jeszcze wiecej musze"],
        ["stuff/lol4.jpg", "Sky"],
        ["stuff/lol1.jpg", "Phone"],
        ["stuff/lol5.jpg", "Fruit"],
        ["stuff/lol3.jpg", "Mainboard"]
    ];

    var previous, next, current, actual = 0;

    function setSiblings() {
        previous = actual - 1 > -1 ? el[actual - 1] : null;
        next = actual + 1 < el.length ? el[actual + 1] : null;
    }

    this.show = function() {
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
                    
                    jpf.tween.single(b, {
                        steps: Math.abs(imgWidth - b.offsetWidth) > 40 ? 10 : 3, 
                        anim: jpf.tween.EASEIN, 
                        type: "mwidth", 
                        from: b.offsetWidth-40, 
                        to: (imgWidth > 800 ? 800 : imgWidth)
                        }).single(b, {
                            steps: Math.abs(imgHeight - b.offsetHeight) > 40 
                                ? 10 
                                : 3, 
                            anim: jpf.tween.EASEIN, 
                            type: "mheight", 
                            from: b.offsetHeight-40, 
                            to: (imgHeight > 600 ? 600 : imgHeight), 
                            onfinish : function() {
                                setSiblings();
                                im.style.display = "block";
                                _self.oTitle.style.display = "block";
                                _self.oMove.style.display = imgWidth > 800 || 
                                    imgHeight > 600 ? "block" : "none";
                                _self.oImage.style.cursor = imgWidth > 800 || 
                                    imgHeight > 600 ? "move" : "default";
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
                    steps: 50, 
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
    }

    this.__getPrevious = function() {
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
            var img = _self.oImage;

            if(this.className == "previous") {
                current = previous;
                actual--;
            }
            else{
                current = next;
                actual++;
            }

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
                steps: 50, 
                type: "fade", 
                from: 0, 
                to: 1}
            );

            clearTimeout(_self.timer);
            //_self.timer = setTimeout(function(){_self.oInt.onclick();}, 3000);

            (e || event).cancelBubble = true;
        }

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
            var dx = 800 - _self.oImage.offsetWidth;
            var dy = 600 - _self.oImage.offsetHeight;
            var t = _self.oImage.offsetTop;
            var l = _self.oImage.offsetLeft;
            var stepX = 0, stepY = 0,  cy = e.clientY, cx = e.clientX, x, y;

            clearInterval(timer);
            timer = setInterval(function() {
                if(dx < 0 || dy < 0) {
                    if(stepX > 0 && stepX <= Math.abs(dx) && 
                        Math.abs(l-stepX) < Math.abs(dx)) {
                            _self.oImage.style.left = (l - stepX) + "px";
                    }
                    if(stepY > 0 && Math.abs(stepY) <= Math.abs(dy) && 
                        Math.abs(t-stepY) < Math.abs(dy)) {
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
            }

            document.onmouseup = function(e) {
                clearInterval(timer);
                _self.oImage.onmousemove = null;
                _self.oImage.style.left = "0px";
                _self.oImage.style.top = "0px";
            }
        }

        /* move code end */
    }

    this.__loadJml = function(x) {
       var nodes = x.childNodes;
       this.show();
    }
}).implement(jpf.Presentation);
