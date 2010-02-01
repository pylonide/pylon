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
apf.__CONTENTEDITABLE__  = 1 << 24;

// #ifdef __WITH_CONTENTEDITABLE2

apf.ContentEditable2 = function() {
    this.$regbase = this.$regbase | apf.__CONTENTEDITABLE__;

    var _self = this;
    
    if (!apf.ContentEditable2.resize)
        apf.ContentEditable2.resize = new apf.Resize();
    
    this.$propHandlers["editable"] = function(value, prop){
        apf.ContentEditable2.resize.initElement(this);
        this.isEditable = true;
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var x = this.$aml;
        var nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (typeof nodes[i].editable == "undefined") { //@todo inheritance?
                if (nodes[i].nodeFunc == apf.NODE_VISIBLE && nodes[i].localName != "page") {
                    nodes[i].setAttribute("editable", true);
                }
                else {
                    nodes[i].isEditable = true;
                    arguments.callee.apply(nodes[i], arguments);
                }
            }
        }
        
        if (!this.parentNode.isEditable) {
            //@todo Use new property events in apf3.0
            $setTimeout(function(){
                apf.ContentEditable2.resize.grab(_self);
            });
        }
    });
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        
    });
};

//@todo Should move to execCommand
apf.ContentEditable2.setMode = function(mode, type){
	this.mode = mode;
	
	if (!this.pointer)
	    this.pointer = new apf.ElementDrawer();
	
	if (mode == "add") this.pointer.activate();
	else this.pointer.deactivate();
	
	this.addType = type;
}

apf.ContentEditable2.actions = {
    transaction : [],
    undostack : [],
    redostack : []
};

apf.ContentEditable2.execCommand = function(type, options, undo){
    if (!options) options = {};
    var sel = options.sel || this.resize.getSelected();//@todo should become a real selection object (see html5 spec)
    
    if (this.started && type != "commit" && type != "rollback" && !undo) {
        apf.ContentEditable2.actions.transaction.push([type, options]);
        return;
    }
    
    var i, item, items;
    switch (type) {
        case "add":
            if (undo) {
                apf.ContentEditable2.execCommand("remove", 
                    {sel: options.addedNode, maintenance: true});
            }
            else {
                var jmlNode    = apf.document.createElementNS(apf.ns.apf, this.addType),
                    htmlNode   = options.htmlNode,
                    parentNode = options.parentNode;
                if (!parentNode) {
                    parentNode = (this.resize.getSelected() || apf.document.documentElement);
                    if (parentNode.getPage) {
                        parentNode = parentNode.getPage();
                    }
                    else {
                        while (!parentNode.canHaveChildren)
                            parentNode = parentNode.parentNode;
                    }
                    options.parentNode = parentNode;
                }
                
                var pos = apf.getAbsolutePosition(parentNode.$int);
                jmlNode.setAttribute("left", htmlNode.offsetLeft - pos[0]);
                jmlNode.setAttribute("top", htmlNode.offsetTop - pos[1]);
                
                parentNode.appendChild(jmlNode);
                
                var minwidth  = jmlNode.minwidth
                        || parseInt(jmlNode.$getOption("main", "minwidth")) || 0,
                    minheight = jmlNode.minheight
                        || parseInt(jmlNode.$getOption("main", "minheight")) || 0,
                    maxwidth  = jmlNode.maxwidth
                        || parseInt(jmlNode.$getOption("main", "maxwidth")) || 10000,
                    maxheight = jmlNode.maxheight
                        || parseInt(jmlNode.$getOption("main", "maxheight")) || 10000;
                
                jmlNode.setAttribute("width", Math.min(maxwidth, Math.max(minwidth,
                    htmlNode.offsetWidth)));
                jmlNode.setAttribute("height", Math.min(maxheight,
                    Math.max(minheight, htmlNode.offsetHeight)));
                jmlNode.setAttribute("editable", true);

                //#ifdef __WITH_LAYOUT
                apf.layout.processQueue();
                //#endif
                this.resize.grab(jmlNode);
                options.addedNode = jmlNode;
            }
            break;
        case "remove":
            if (undo) {
                options.removedNode[1].insertBefore(options.removedNode[0],
                    options.removedNode[2]);
                this.resize.grab(options.removedNode[0]);
            }
            else {
                var pNode = sel.parentNode;
                options.removedNode = [sel, pNode, sel.nextSibling];
                sel.removeNode();
                this.resize.grab(apf.document.activeElement && apf.document.activeElement.editable 
                    ? apf.document.activeElement
                    : (pNode.editable ? pNode : pNode.firstChild));
            }
            break;
        case "property":
            if (undo) {
                sel.setAttribute(options.name, options.prevValue);
            }
            else {
                options.prevValue = sel[options.name];
                sel.setAttribute(options.name, options.value);
            }
            break;
        case "undo":
            var undostack =  apf.ContentEditable2.actions.undostack;
            if (!undostack.length)
                return false;

            item = undostack.pop();
            apf.ContentEditable2.actions.redostack.push(item);
            item[1].maintenance = true;
            apf.ContentEditable2.execCommand(item[0], item[1], true);
            return true;
        case "redo":
            var redostack =  apf.ContentEditable2.actions.redostack;
            if (!redostack.length)
                return false;

            item = redostack.pop();
            apf.ContentEditable2.actions.undostack.push(item);
            item[1].maintenance = true;
            apf.ContentEditable2.execCommand(item[0], item[1]);
            return true;
        case "begin":
            this.started = true;
            return;
        case "commit":
            if (undo) {
                items = options;
                for (i = 0; i < items.length; i++)
                    apf.ContentEditable2.execCommand(items[i][0], items[i][1], true);
            }
            else {
                if (this.started) {
                    this.started = false;
                    items = apf.ContentEditable2.actions.transaction;
                    apf.ContentEditable2.actions.transaction = [];
                    apf.ContentEditable2.actions.undostack.push([type, items]);
                }
                else {
                    items = options;
                }

                for (i = 0; i < items.length; i++) {
                    items[i][1].maintenance = true;
                    if (!items[i][1].sel)
                        items[i][1].sel = sel;
                    apf.ContentEditable2.execCommand(items[i][0], items[i][1]);
                }
            }
            //#ifdef __WITH_LAYOUT
            apf.layout.processQueue();
            //#endif
            this.resize.regrab();
            return;
        case "rollback":
            this.started = false;
            apf.ContentEditable2.actions.transaction = [];
            return;
    }
    
    if (!options || !options.maintenance)
        apf.ContentEditable2.actions.undostack.push([type, options]);
}

apf.Resize = function(){
    this.$init();

    this.$propHandlers = [];
    this.implement(apf.Interactive);
    
    this.draggable     = true;
    this.resizable     = true;
    this.dragOutline   = true;
    this.dragSelection = true;
    
    var _self = this,
        nodes = [],
        pos   = ["n", "ne", "e", "se", "s", "sw", "w", "nw"],
        div;
    while (nodes.length != 8) {
        div = document.body.appendChild(document.createElement("div"));
        div.className = "idegrabber";
        div.style.display = "none";
        div.onmousedown = mousedown;
        
        nodes.push(div);
        nodes[(div.type = pos.pop())] = div;
    }
    
    this.getSelected = function(){
        return selected;
    };
    
    this.initElement = function(el){
        el.$ext.onmousedown = function(e){
            _self.grab(el);
            _self.left = el.left;
            _self.top = el.top;
            _self.right = el.right;
            _self.bottom = el.bottom;
            (e || event).cancelBubble = true;
        }
        this.$propHandlers["draggable"].call({$ext: el.$ext}, true);
    };
    
    var selected, anchors,
        size   = 8,
        margin = 1;
    this.grab = function(oEl, options) {
        //#ifdef __WITH_LAYOUT
        if (this.$ext) {
            apf.layout.removeRule(this.$ext, "contenteditable");
            apf.layout.activateRules(oEl);
        }
        //#endif
        if (!oEl) {
            this.hide();
            return;
        }
        
        if (oEl.nodeFunc) {
            selected = oEl;
            anchors = oEl.$anchors && oEl.$anchors.length 
                ? oEl.$anchors
                : [oEl.top, oEl.right, oEl.bottom, oEl.left];
            oEl = oEl.$ext;
            this.$ext = oEl;
        }
        
        this.regrab();
        
        //Show
        for (var i = 0; i < 8; i++) {
            nodes[i].style.display = "block";
        }

        if (anchors) {
            apf.setStyleClass(nodes.n, anchors[0] ? "idegrabber_selected" : "",
                ["idegrabber_selected"]);
            apf.setStyleClass(nodes.e, anchors[1] ? "idegrabber_selected" : "",
                ["idegrabber_selected"]);
            apf.setStyleClass(nodes.s, anchors[2] ? "idegrabber_selected" : "",
                ["idegrabber_selected"]);
            apf.setStyleClass(nodes.w, anchors[3] ? "idegrabber_selected" : "",
                ["idegrabber_selected"]);
        }

        //This should all be removed on ungrab
        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(oEl, "contenteditable", "apf.all[" + this.$uniqueId + "].regrab()", true);
        apf.layout.queue(oEl);
        //#endif
        _self.onresize = function(){
            apf.ContentEditable2.execCommand("commit");
        };

        _self.ondrag = function(e){
            apf.ContentEditable2.execCommand("commit");
        };
    };
    
    this.regrab = function(){
        //Position
        var oEl = this.$ext;
        var pos = apf.getAbsolutePosition(oEl);
        pos.push(oEl.offsetWidth, oEl.offsetHeight);

        //Middle ones (hor)
        nodes.s.style.left = 
        nodes.n.style.left = (pos[0] + (pos[2] - size)/2) + "px";
        
        //Middle ones (ver)
        nodes.e.style.top = 
        nodes.w.style.top = (pos[1] + (pos[3] - size)/2) + "px";
        
        //Top
        nodes.nw.style.top = 
        nodes.ne.style.top = 
        nodes.n.style.top  = (pos[1] - size - margin) + "px";
        
        //Left
        nodes.sw.style.left = 
        nodes.nw.style.left = 
        nodes.w.style.left  = (pos[0] - size - margin) + "px";
        
        //Right
        nodes.ne.style.left = 
        nodes.se.style.left = 
        nodes.e.style.left  = (pos[0] + pos[2] + margin) + "px";
        
        //Bottom
        nodes.se.style.top = 
        nodes.sw.style.top = 
        nodes.s.style.top  = (pos[1] + pos[3] + margin) + "px";
    };
    
    this.show = function(){
        for (var i = 0; i < 8; i++)
            nodes[i].style.display = "block";
    };
    
    this.hide = function(){
        for (var i = 0; i < 8; i++)
            nodes[i].style.display = "none";
    };
    
    this.setProperty = function(name, value){
        //return selected.setProperty.apply(selected, arguments);
        if (!apf.ContentEditable2.started)
            apf.ContentEditable2.execCommand("begin");

        apf.ContentEditable2.execCommand("property", {name:name, value:value});
        
        return value;
    };
    
    var map = {"e":"right", "w":"left", "n":"top", "s":"bottom"};
    function mousedown(e){
        if (!e) e = event;
        if (e.ctrlKey && this.type.length == 1) {
            apf.ContentEditable2.execCommand("begin");
            
            if (selected.$anchors && selected.$anchors.length) {
                var anchors = selected.$anchors;
                _self.setProperty("anchors", null);
                _self.setProperty("top", anchors[0]);
                _self.setProperty("right", anchors[1]);
                _self.setProperty("bottom", anchors[2]);
                _self.setProperty("left", anchors[3]);
            }
            
            apf.setStyleClass(this, !selected[map[this.type]] 
                ? "idegrabber_selected" : "", ["idegrabber_selected"]);

            var prop = map[this.type];
            if (selected[prop]) {
                if (prop == "right" && !this.left)
                    _self.setProperty("left", selected.$ext.offsetLeft);
                else if (prop == "bottom" && !this.top)
                    _self.setProperty("top", selected.$ext.offsetTop);

                _self.setProperty(prop, null);
            }
            else {
                var pHtmlNode = selected.$ext.offsetParent;
                if (pHtmlNode.tagName == "BODY")
                    pHtmlNode = document.documentElement;
                    
                switch(this.type) {
                    case "e":
                        _self.setProperty("right", pHtmlNode.offsetWidth
                            - selected.$ext.offsetLeft - selected.$ext.offsetWidth);
                        break;
                    case "w":
                        _self.setProperty("left", selected.$ext.offsetLeft);
                        break;
                    case "n":
                        _self.setProperty("top", selected.$ext.offsetTop);
                        break;
                    case "s":
                        _self.setProperty("bottom", pHtmlNode.offsetHeight
                            - selected.$ext.offsetTop - selected.$ext.offsetHeight);
                        break;
                }
            }

            _self.setProperty("width", !this.left || !this.right
                ? selected.$ext.offsetWidth
                : null);
            _self.setProperty("height", !this.top || !this.bottom
                ? selected.$ext.offsetHeight
                : null);
            
            apf.ContentEditable2.execCommand("commit");
        }
        else {
            _self.left      = selected.left;
            _self.top       = selected.top;
            _self.right     = selected.right;
            _self.bottom    = selected.bottom;
            _self.minwidth  = selected.minwidth
                || parseInt(selected.$getOption("main", "minwidth")) || 0;
            _self.minheight = selected.minheight
                || parseInt(selected.$getOption("main", "minheight")) || 0;
            _self.maxwidth  = selected.maxwidth
                || parseInt(selected.$getOption("main", "maxwidth")) || 10000;
            _self.maxheight = selected.maxheight
                || parseInt(selected.$getOption("main", "maxheight")) || 10000;
            
            _self.$resizeStart(e || event, {
                resizeType : this.type,
                nocursor   : true
            });
        }
    }
};
apf.Resize.prototype = new apf.Class();

/**
 * @private
 */
apf.ElementDrawer = function (){
    var p1    = document.body.appendChild(document.createElement("div")),
        p2    = document.body.appendChild(document.createElement("div")),
        q     = document.body.appendChild(document.createElement("div")),
        _self = this,
        startX, startY;
    p1.className = "pointer_left";
    p2.className = "pointer_right";
    q.className  = "new_element";

    this.activate = function(){
        document.onmousemove = function(e){
            if (!e) e = event;

            p1.style.width  = (Math.abs(e.clientX) || 1) + "px";
            p1.style.height = (Math.abs(e.clientY) || 1) + "px";

            p2.style.width  = (Math.abs(document.documentElement.offsetWidth
                - e.clientX - 5) || 1) + "px";
            p2.style.height = (Math.abs(document.documentElement.offsetHeight
                - e.clientY - 5) || 1) + "px";

            if (q.style.display == "block"){
                var wt = e.clientX - startX - 1,
                    ht = e.clientY - startY - 1,
                    min = Math.min(wt, ht);
                if (e.shiftKey)
                    wt = ht = min;

                q.style.width  = (wt < 0 ? -1 * (wt - 1) : (wt || 1)) + "px";
                q.style.height = (ht < 0 ? -1 * (ht - 1) : (ht || 1)) + "px";

                q.style.left  = wt < 0 ? "" : (startX) + "px";
                q.style.right = wt < 0 
                    ? (document.documentElement.offsetWidth - startX - 4) + "px"
                    : "";

                q.style.bottom = ht < 0 
                    ? (document.documentElement.offsetHeight - startY - 4) + "px"
                    : "";
                q.style.top    = ht < 0 ? "" : (startY) + "px";
            }
        }

        document.onmousedown = function(e){
            if (!e) e = event;
            //if ((e.srcElement || e.target) == document.body)
                //return false;

            q.style.display = "block";
            q.style.left    = (startX = event.clientX) + "px";
            q.style.top     = (startY = event.clientY) + "px";
            q.style.width   = (q.style.height = 1) + "px";
        };

        document.onmouseup = function(){
            if (q.offsetWidth > 10 && q.offsetHeight > 10) {
                apf.ContentEditable2.execCommand("add", {htmlNode: q});
                _self.deactivate();
            }

            q.style.display = "none";
            startX = false;
            startY = false;
        };

        p1.style.display =
        p2.style.display = "block";
        document.body.style.cursor =
        document.documentElement.style.cursor = "crosshair";
    };

    this.deactivate = function(){
        document.onmousemove = null;
        document.onmousedown = null;
        document.onmouseup = null;

        p1.style.display =
        p2.style.display = "none";
        document.body.style.cursor =
        document.documentElement.style.cursor = "";
    };
};

/**
 * @private
 */
apf.Selection = function(){};

// #endif
