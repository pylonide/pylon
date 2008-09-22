jpf.slideshow = jpf.component(jpf.GUI_NODE, function() {
    this.__supportedProperties.push("model");
    var _self = this;
    
    var el = [
        ["stuff/lol5.jpg", "Beach"],
        ["stuff/lol4.jpg", "Sky"],
        ["stuff/lol1.jpg", "Phone"],
        ["stuff/lol2.jpg", "Fruit"],
        ["stuff/lol3.jpg", "Mainboard"]
    ];
    
    var length = el.length;
    var actual = 0;
    
    /**** Init ****/
    this.redraw = function(src, title) {
        this.oImage.src = src;
        jpf.console.info(this.oImage.height)
        if(this.oImage.height < 600){            
            this.oImage.style.paddingTop = ((600 - this.oImage.height)/2) + "px";
        }
         
    }

    this.__getImage = function() {
        var img =  el[actual];              
        this.redraw(img[0], img[1]);
    }
    
    this.__getNext = function() {
        if(actual + 1 < length){
            var img =  el[++actual];        
            this.redraw(img[0], img[1]);
        }
    }
    
    this.__getPrevious = function() {
        if(actual - 1 > -1){
            var img =  el[--actual];
            this.redraw(img[0], img[1]);
        }
    }
        
    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("main", "container", this.oExt);
        this.oImage = this.__getLayoutNode("main", "image", this.oExt);
        this.oClose = this.__getLayoutNode("main", "close", this.oExt);
        this.oNext = this.__getLayoutNode("main", "next", this.oExt);
        this.oPrevious = this.__getLayoutNode("main", "previous", this.oExt);
        
        this.oNext.onclick = function(e){            
            _self.__getNext();            
        }
        
        this.oPrevious.onclick = function(e){            
            _self.__getPrevious();        
        }
    }

    this.__loadJml = function(x) {
       var nodes = x.childNodes;
       
       this.__getImage();
    }
}).implement(jpf.Presentation);
