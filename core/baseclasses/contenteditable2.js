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

    this.editable = false;
    this.$canEdit = true;
    this.$init(function(tagName, nodeFunc, struct){
         this.$inheritProperties["editable"] = 2;
    });
    
    this.$booleanProperties["editable"] = true;
    this.$propHandlers["editable"] = function(value, prop){
        if (!apf.ContentEditable2.resize)
            apf.ContentEditable2.resize = new apf.Resize();
        
        if (value) {
            if (this.$canEdit)
                apf.ContentEditable2.resize.initElement(this);
            this.isEditable = true;
            
            var _self = this;
            if (!this.parentNode.isEditable) {
                //@todo Use new property events in apf3.0
                $setTimeout(function(){
                    apf.ContentEditable2.resize.grab(_self);
                });
            }
        }
        else {
            if (this.$canEdit)
                apf.ContentEditable2.resize.deInitElement(this);
            this.isEditable = false;
            
            //@todo hack!
            apf.ContentEditable2.resize.hide();
        }
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        /*if (!this.editable)
            return;
        
        var x     = this.$aml;
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
        }*/
        if (!this.editable) {
            this.editable = apf.getInheritedAttribute(this, "editable");
            if (this.editable)
                this.$propHandlers["editable"].call(this, true);
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
	
	if (mode == "add" || mode == "select") 
	    this.pointer.activate();
	else 
	    this.pointer.deactivate();
	
    this.addType = type;
}

apf.ContentEditable2.showContextMenu = function(amlNode, e){
    mnuContentEditable.display(e.x, e.y, null, amlNode);
}

apf.ContentEditable2.actions = {
    transaction : [],
    undostack : [],
    redostack : []
};

apf.ContentEditable2.execCommand = function(type, options, undo){
    if (!options) options = {};
    var sel = options.sel || this.resize.getSelected()[0];//@todo should become a real selection object (see html5 spec)
    
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
                    parentNode = (this.resize.getSelected(0) || apf.document.documentElement);
                    if (parentNode.getPage) {
                        parentNode = parentNode.getPage();
                    }
                    else {
                        while (parentNode && !parentNode.canHaveChildren)
                            parentNode = parentNode.parentNode;
                    }
                    options.parentNode = parentNode;
                }
                
                var pos = apf.getAbsolutePosition(parentNode.$int);
                jmlNode.setAttribute("left", htmlNode.offsetLeft - pos[0]);
                jmlNode.setAttribute("top", htmlNode.offsetTop - pos[1]);
                
                if (self.apfView) {
                    apfView.$int.contentWindow.apf.$debugwin.showAmlNode(parentNode);
                    apfView.$int.contentWindow.apf.xmldb.appendChild(parentNode, jmlNode);//applyChanges("add", jmlNode);
                }
                else {
                    parentNode.appendChild(jmlNode);
                }
                
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
                
                //@todo hacks!
                if (self.apfView) {
                    apfView.$int.contentWindow.apf.$debugwin.showAmlNode(jmlNode);
                    setTimeout(function(){
                        apfView.$int.contentWindow.apf.$debugwin.showAmlNode(jmlNode);
                    }, 100);
                    //apfView.$int.contentWindow.apf.xmldb.applyChanges("add", jmlNode);
                }
                
                trTools.select(trTools.queryNode("//node()[@name='Arrow']"));
            }
            break;
        case "select":
            var htmlNode   = options.htmlNode,
                parentNode = options.parentNode;
            if (!parentNode) {
                parentNode = (this.resize.getSelected(0) || apf.document.documentElement);
                if (parentNode.getPage) {
                    parentNode = parentNode.getPage();
                }
                else {
                    while (parentNode && !parentNode.canHaveChildren)
                        parentNode = parentNode.parentNode;
                }
                options.parentNode = parentNode;
            }
            
            var nodes = parentNode.getElementsByTagName("*");
            var htmlParent = htmlNode.parentNode;
            var left = htmlNode.offsetLeft;
            var top  = htmlNode.offsetTop;
            var right = left + htmlNode.offsetWidth;
            var bottom = top + htmlNode.offsetHeight;
            var first = true;
            for (var i = 0; i < nodes.length; i++) {
                var pos = apf.getAbsolutePosition(nodes[i].$ext, htmlParent);
                if (pos[0] > left && pos[0] + nodes[i].$ext.offsetWidth < right
                  && pos[1] > top && pos[1] + nodes[i].$ext.offsetHeight < bottom) {
                    this.resize.grab(nodes[i], !first);
                    first = false;
                }
            }
            
            trTools.select(trTools.queryNode("//node()[@name='Arrow']"));
            return;
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
        case "cut":
            var options = {};
            this.execCommand("remove", options);
            apf.ContentEditable2.clipBoard.put(sel);
            return;
        case "copy":
            apf.ContentEditable2.clipBoard.put(sel);
            return;
        case "paste":
            var content = apf.ContentEditable2.clipBoard.get();
            if (!content) return;

            if (typeof content == "string") {
                sel.insertMarkup(content);
            }
            else if (content.$regbase) {
                sel.appendChild(content.cloneNode(true))
            }
            else {
                alert("Could not paste content");
            }
            return;
        case "defposition":
            this.execCommand("begin");
            ["align", "left", "top", "right", 
             "bottom", "width", "height", "anchors"].each(function(item){
                if (sel[item])
                    apf.ContentEditable2.execCommand("property", {
                        name : item,
                        value : ""
                    });
            });
            sel.$ext.style.position = ""; //@todo this should be done by align/anchoring
            this.execCommand("commit");
            apf.ContentEditable2.resize.grab(sel, -1);
            return;
        case "back":
            if (sel.zindex != 0)
                this.execCommand("property", {
                    name  : "zindex",
                    value : 0
                });
            return;
        case "backward":
            if (sel.zindex != 0)
                this.execCommand("property", {
                    name  : "zindex",
                    value : (sel.zindex || 1) - 1
                });
            return;
        case "front":
            if (sel.zindex != 100000)
                this.execCommand("property", {
                    name  : "zindex",
                    value : 100000
                });
            return;
        case "forward":
            if (sel.zindex != 100000)
                this.execCommand("property", {
                    name  : "zindex",
                    value : (sel.zindex || 0) + 1
                });
            return;
        case "lock":
            return;
        case "unlock":
            return;
    }
    
    if (!options || !options.maintenance)
        apf.ContentEditable2.actions.undostack.push([type, options]);
}

apf.ContentEditable2.clipBoard = {
    store : null,
    put : function(item){
        this.store = item;
    },
    get : function(){
        return this.store;
    }
};

apf.Resize = function(){
    this.$init();

    this.$propHandlers = [];
    this.implement(apf.Interactive);
    
    this.draggable     = true;
    this.resizable     = true;
    this.dragOutline   = false;
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
    
    var oOutline = document.body.appendChild(document.createElement("div"));
    oOutline.style.position = "absolute";
    oOutline.style.display  = "none";
    oOutline.style.border   = "2px solid gray";
    oOutline.style.zIndex   = 2000000;
    
    this.getSelected = function(nr){
        return typeof nr != "undefined" ? selected[nr] : selected;
    };
    
    this.deInitElement = function(el) {
        el.$ext.onmousedown = el.$prevmd || null;
    }
    
    this.initElement = function(el){
        el.$prevmd = el.$ext.onmousedown;
        el.$ext.onmousedown = function(e){
            if (!e) e = event;
            
            _self.grab(el, e.ctrlKey);
            _self.left = el.left;
            _self.top = el.top;
            _self.right = el.right;
            _self.bottom = el.bottom;
            e.cancelBubble = true;
            
            if (e.button != 2)
                oOutline.style.display = "block";
            
            if (self.apfView)
                apfView.$int.contentWindow.apf.$debugwin.showAmlNode(el);
        }
        this.$propHandlers["draggable"].call({$ext: el.$ext}, true);
    };
    
    var selected = [], anchors,
        size   = 8,
        margin = 1;
    this.grab = function(oEl, multiple) {
        //#ifdef __WITH_LAYOUT
        if (this.$ext) {
            apf.layout.removeRule(this.$ext, "contenteditable");
            apf.layout.activateRules(oEl);
        }
        //#endif

        if (multiple === true && selected.length && oEl.parentNode != selected[0].parentNode)
            return;

        if (selected.length > 1 && selected.contains(oEl))
            multiple = -1;
        
        if (!oEl) {
            selected = [];
            this.hide();
            return;
        }

        if (oEl.nodeFunc && (multiple != -1 || selected.length == 1)) {
            if (multiple != -1) {
                if (!multiple)
                    selected = [];
                selected.push(oEl);
            }
            oEl = oEl.$ext;
            
            this.$ext = oOutline;//oEl;
        }
        
        this.regrab();
        
        //Show
        for (var i = 0; i < 8; i++) {
            nodes[i].style.display = "block";
        }

        //This should all be removed on ungrab
        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(oEl, "contenteditable", "apf.all[" + this.$uniqueId + "].regrab()", true);
        apf.layout.queue(oEl);
        //#endif

        _self.onresize = function(){
            this.$ext = oOutline;
            apf.ContentEditable2.execCommand("commit");
        };

        _self.ondrag = function(e){
            var el = oEl.host || oEl;
            
            if (selected.length > 1) {
                apf.ContentEditable2.execCommand("rollback");
                apf.ContentEditable2.execCommand("begin");
                
                var deltaX = oOutline.offsetLeft - lastPos[0];
                var deltaY = oOutline.offsetTop - lastPos[1];
                for (var n, i = 0; i < selected.length; i++) {
                    n = selected[i];
                    var diff = apf.getDiff(this.$ext = n.$ext);
                    this.left = n.left;
                    this.top = n.top;
                    this.right = n.right;
                    this.bottom = n.bottom;
                    this.$amlNode = n;
                    this.$updateProperties(
                        n.$ext.offsetLeft + deltaX, 
                        n.$ext.offsetTop + deltaY, 
                        n.$ext.offsetWidth - diff[0], 
                        n.$ext.offsetHeight - diff[1], diff[0], diff[1]);
                }
                
                delete this.$amlNode;
                this.$ext = oOutline;
            }
            
            apf.ContentEditable2.execCommand("commit");
            apf.ContentEditable2.resize.grab(el, -1);
            
            oOutline.style.display = "none";
        };
    };
    
    var lastPos;
    this.regrab = function(){
        //Position
        if (selected.length == 1) {
            var oEl = selected[0];
            
            var anchors = selected.length == 1
              ? (oEl.$anchors && oEl.$anchors.length 
                ? oEl.$anchors
                : [oEl.top, oEl.right, oEl.bottom, oEl.left])
              : [];
    
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
            
            oEl = oEl.$ext;//this.$ext;
            var pos = apf.getAbsolutePosition(oEl);
            pos.push(oEl.offsetWidth, oEl.offsetHeight);
        }
        else {
            var pos = [100000,100000,0,0];
            for (var i = 0; i < selected.length; i++) {
                var oEl  = selected[i].$ext;
                var opos = apf.getAbsolutePosition(oEl);
                if (opos[0] < pos[0]) pos[0] = opos[0];
                if (opos[1] < pos[1]) pos[1] = opos[1];
                if (opos[0] + oEl.offsetWidth > pos[2]) pos[2] = opos[0] + oEl.offsetWidth;
                if (opos[1] + oEl.offsetHeight > pos[3]) pos[3] = opos[1] + oEl.offsetHeight;
            }
            pos[2] -= pos[0];
            pos[3] -= pos[1];
        }

        oEl.offsetParent.appendChild(oOutline);
        var ppos = apf.getAbsolutePosition(oOutline.parentNode, null, true);
        
        lastPos = pos.slice();
        lastPos[0] -= ppos[0];
        lastPos[1] -= ppos[1];
        
        var diff = apf.getDiff(oOutline);
        oOutline.style.left  = (lastPos[0]) + "px";
        oOutline.style.top   = (lastPos[1]) + "px";
        oOutline.style.width = Math.max(0, pos[2] - diff[0]) + "px";
        oOutline.style.height = Math.max(0, pos[3] - diff[1]) + "px";

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

        apf.ContentEditable2.execCommand("property", {sel: this.$amlNode, name:name, value:value});
        
        return value;
    };
    
    var map = {"e":"right", "w":"left", "n":"top", "s":"bottom"};
    function mousedown(e){
        if (!e) e = event;
        if (e.button == 2 || selected.length > 1)
            return;
        
        var sel = selected[0];
        
        if (e.ctrlKey && this.type.length == 1) {
            apf.ContentEditable2.execCommand("begin");

            if (sel.$anchors && sel.$anchors.length) {
                var anchors = sel.$anchors;
                _self.setProperty("anchors", null);
                _self.setProperty("top", anchors[0]);
                _self.setProperty("right", anchors[1]);
                _self.setProperty("bottom", anchors[2]);
                _self.setProperty("left", anchors[3]);
            }
            
            apf.setStyleClass(this, !sel[map[this.type]] 
                ? "idegrabber_sel" : "", ["idegrabber_sel"]);

            var pHtmlNode = sel.$ext.offsetParent;
            if (pHtmlNode.tagName == "BODY")
                pHtmlNode = document.documentElement;

            var prop = map[this.type];
            if (sel[prop]) {
                if (prop == "right" && !this.left)
                    _self.setProperty("left", sel.$ext.offsetLeft
                        - (parseInt(apf.getStyle(pHtmlNode, apf.descPropJs 
                                ? "borderLeftWidth" : "border-left-width")) || 0));
                else if (prop == "bottom" && !this.top)
                    _self.setProperty("top", sel.$ext.offsetTop
                        - (parseInt(apf.getStyle(pHtmlNode, apf.descPropJs 
                                ? "borderTopWidth" : "border-top-width")) || 0));

                _self.setProperty(prop, "");
            }
            else {
                switch(this.type) {
                    case "e":
                        _self.setProperty("right", pHtmlNode.offsetWidth
                            + (parseInt(apf.getStyle(pHtmlNode, apf.descPropJs 
                                ? "borderLeftWidth" : "border-left-width")) || 0)
                            - sel.$ext.offsetLeft - sel.$ext.offsetWidth);
                        break;
                    case "w":
                        _self.setProperty("left", sel.$ext.offsetLeft);
                        break;
                    case "n":
                        _self.setProperty("top", sel.$ext.offsetTop);
                        break;
                    case "s":
                        _self.setProperty("bottom", pHtmlNode.offsetHeight
                            + (parseInt(apf.getStyle(pHtmlNode, apf.descPropJs 
                                ? "borderTopWidth" : "border-top-width")) || 0)
                            - sel.$ext.offsetTop - sel.$ext.offsetHeight);
                        break;
                }
            }

            _self.setProperty("width", !this.left || !this.right
                ? sel.$ext.offsetWidth
                : null);
            _self.setProperty("height", !this.top || !this.bottom
                ? sel.$ext.offsetHeight
                : null);
            
            apf.ContentEditable2.execCommand("commit");
        }
        else {
            _self.left      = sel.left;
            _self.top       = sel.top;
            _self.right     = sel.right;
            _self.bottom    = sel.bottom;
            _self.minwidth  = sel.minwidth
                || parseInt(sel.$getOption("main", "minwidth")) || 0;
            _self.minheight = sel.minheight
                || parseInt(sel.$getOption("main", "minheight")) || 0;
            _self.maxwidth  = sel.maxwidth
                || parseInt(sel.$getOption("main", "maxwidth")) || 10000;
            _self.maxheight = sel.maxheight
                || parseInt(sel.$getOption("main", "maxheight")) || 10000;
            
            _self.$ext = sel.$ext;
            
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

            p1.style.top = "-2000px";
            p2.style.top = "-2000px";
            var el = document.elementFromPoint(e.clientX, e.clientY);
            var amlNode = apf.findHost(el);
            
            p1.style.top = "";
            p2.style.top = "";
            
            if (amlNode) {
                while (amlNode && !amlNode.$int)
                    amlNode = amlNode.parentNode;
            }
            if (!amlNode)
                amlNode = apf.document.documentElement;
            apf.ContentEditable2.resize.grab(amlNode);

            q.style.display = "block";
            q.style.left    = (startX = event.clientX) + "px";
            q.style.top     = (startY = event.clientY) + "px";
            q.style.width   = (q.style.height = 1) + "px";
        };

        document.onmouseup = function(){
            if (q.offsetWidth > 10 && q.offsetHeight > 10) {
                if (apf.ContentEditable2.mode == "select") {
                    apf.ContentEditable2.execCommand("select", {htmlNode: q});
                }
                else {
                    apf.ContentEditable2.execCommand("add", {htmlNode: q});
                }
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

apf.config.$inheritProperties["editable"] = 1;

// #endif
