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

//#ifdef __WITH_CONTENTEDITABLE
apf.ContentEditable.commands = (function(){
    var STATE = 1;
    var VALUE = 2;
    var ENABL = 3;
    var INDET = 4;
    
    var commands = {};

    var addType;
    commands["add"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }

        //@todo node creation should become a lot simpler, api wise...
        if (typeof addType == "object") {
            var amlNode = apf.getXml("<a:application xmlns:a='" + apf.ns.aml + "' />");
            //var amlNode = addType.ownerDocument.createElement("a:application");
            amlNode.appendChild(addType.cloneNode(true));
        }
        else//apf.document.createElementNS(apf.ns.apf, addType),
            var amlNode = apf.getXml("<a:application xmlns:a='" + apf.ns.aml + "'><a:" + addType + " /></a:application>");
        
        if (options.skinset && options.skinset != "default")
            amlNode.firstChild.setAttribute("skinset", options.skinset);

        var htmlNode   = options.htmlNode,
            parentNode = options.parentNode;
        if (!parentNode) {
            parentNode = (apf.document.activeElement || apf.document.documentElement);
            if (parentNode.getPage) {
                parentNode = parentNode.getPage();
            }
            else {
                while (parentNode && !parentNode.canHaveChildren)
                    parentNode = parentNode.parentNode;
            }
            options.parentNode = parentNode;
        }
        
        //if (!parentNode) debugger;
        
        var domParser = apf.document.$domParser;
        amlNode = domParser.parseFromXml(amlNode, {doc: this}).firstChild.firstChild;
        
        if (!options.ignorePos) {
            var pos = apf.getAbsolutePosition(parentNode.$int, null, true);
            amlNode.setAttribute("left", htmlNode.offsetLeft - pos[0]);
            amlNode.setAttribute("top", htmlNode.offsetTop - pos[1]);
        }
        
        //@todo deprecate this
        if (amlNode.$getOption) {
            var minwidth  = amlNode.minwidth
                    || parseInt(amlNode.$getOption("main", "minwidth")) || 5,
                minheight = amlNode.minheight
                    || parseInt(amlNode.$getOption("main", "minheight")) || 5,
                maxwidth  = amlNode.maxwidth
                    || parseInt(amlNode.$getOption("main", "maxwidth")) || 10000,
                maxheight = amlNode.maxheight
                    || parseInt(amlNode.$getOption("main", "maxheight")) || 10000;
        }
        
        if (!options.ignorePos) {
            amlNode.setAttribute("width", Math.min(maxwidth, Math.max(minwidth,
                htmlNode.offsetWidth)));
            amlNode.setAttribute("height", Math.min(maxheight,
                Math.max(minheight, htmlNode.offsetHeight)));
        }
        else {
            if (options.left || options.left === 0) {
                amlNode.setAttribute("left", options.left);
                amlNode.setAttribute("top", options.top);
            }
            if (options.width || options.width === 0)
                amlNode.setAttribute("width", options.width);
            if (options.height || options.height === 0)
                amlNode.setAttribute("height", options.height);
        }
        
        var name, n = amlNode.localName.uCaseFirst(), i = 0;
        do{
            name = n + ++i;
        } while (self[name]);
        amlNode.setAttribute("id", name);
        
        var hasProp = rename.getEditableProp(amlNode);
        if (hasProp) {
            var prop = hasProp[1];
            amlNode.setAttribute(prop, name);
        }
        
        if (options.userInteraction)
            amlNode.$adding = true;
    
        parentNode.insertBefore(amlNode, options.beforeNode);
        amlNode.setProperty("editable", true);
    
        //#ifdef __WITH_LAYOUT
        apf.layout.processQueue();
        //#endif
        
        if (!options.userInteraction)
            apf.document.getSelection().$selectList([amlNode]);

        options.addedNode = amlNode;
        
        //@todo hack!
        //trTools.select(trTools.queryNode("//node()[@name='Arrow']"));
    };
    
    commands["contextmenu"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }

        if (options.amlNode.ownerDocument.dispatchEvent("contextmenu", {
          x             : options.htmlEvent.x,
          y             : options.htmlEvent.y,
          currentTarget : options.amlNode,
          bubbles       : true
        }) !== false && showUI) {
            //@todo create UI?
            mnuContentEditable.display(options.htmlEvent.x, 
                options.htmlEvent.y, null, options.amlNode);
        }
    };
    
    var rename = {
        getInput : function(){
            apf.Rename.initEditableArea.call(this);
            
            var txt = this.$txt;
            txt.className = "editable"
            txt.style.height = "auto";
            txt.onscroll = function(){
                return false;
            }
            txt.host = this;
            
            return txt;
        },
        
        stopRename : function(n, success){
            if (success && this.renaming) {
                var doc = this.$renameElement.ownerDocument;
                commands.begin.call(doc);
                this.stop(null, true);
                commands.commit.call(doc);
            }
            else this.stop();
        },
        
        getEditableProp : function (el){
            var htmlNode, prop;
            if (el.$childProperty) {
                prop = el.$childProperty;
            }
            else if (el.$editableCaption) {
                prop = el.$editableCaption[0];
            }
            else if (el.$getEditableCaption) {
                var info = el.$getEditableCaption();
                if (!info) 
                    return;
                prop     = info[1];
                htmlNode = info[0];
            }
            else {
                return;
            }
            
            if (!htmlNode)
                htmlNode = el.$getLayoutNode("main", prop, el.$ext);
            
            return [htmlNode, prop];
        },
        
        start : function(el){
            var info = this.getEditableProp(el);
            if (!info) return;
            
            htmlNode            = info[0];
            this.$editableProp  = info[1];
            
            if (!htmlNode) {
                if (el.getPage)
                    this.start(el.getPage());
                return;
            }
    
            this.$renameHtml    = htmlNode;
            this.$renameElement = el;
            this.$renameContents = (htmlNode.nodeType == 1
                ? htmlNode.innerHTML 
                : htmlNode.nodeValue);
            
            var txt = this.getInput();
    
            if (htmlNode.nodeType == 1) {
                htmlNode.innerHTML = "";
                htmlNode.appendChild(txt);
            }
            else {
                htmlNode.parentNode.replaceChild(txt, htmlNode);
            }
            
            if (apf.hasContentEditable) {
                txt.innerHTML = this.$renameContents.replace(/</g, "&lt;") 
                    || apf.hasContentEditableContainerBug && "<br>" || "";
            }
            else 
                txt.value = this.$renameContents;
            
            txt.unselectable = "Off";
    
            //this.$txt.focus();
            var f = function(){
                try {
                    txt.focus();
                    txt.select();
                }
                catch(e) {}
            };
            if (apf.isIE) f() 
            else setTimeout(f);
                
            this.renaming = true;
        },
        
        stop : function(x, success){
            if (!this.renaming)
                return;

            this.renaming = false;

            var htmlNode = this.$renameHtml;
            if (htmlNode.nodeType == 1)
                htmlNode.removeChild(this.$txt);
            else 
                this.$txt.parentNode.replaceChild(htmlNode, this.$txt);
            
            var value = typeof success == "string"
              ? success
              : (apf.hasContentEditable
                ? this.$txt.innerText
                : this.$txt.value)
                  .replace(/<.*?nobr>/gi, "").replace(/\n$/, ""); //last replace is for chrome;
            
            var el   = this.$renameElement;
            var prop = this.$editableProp;

            if (success && el[prop] != value) {
                el.setAttribute(prop, value);
            }
            else {
                if (htmlNode.nodeType == 1)
                    htmlNode.innerHTML = this.$renameContents;
                else
                    htmlNode.nodeValue = this.$renameContents;
            }
            
            htmlNode.parentNode.scrollLeft = 0;
            
            //this.regrab();
            
            this.$editableProp  = 
            this.$renameHtml    = 
            this.$renameElement = 
            this.$renameContents = null;
        }
    };
    commands["rename"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return rename.renaming;
            case VALUE: return String(rename.renaming);
            case ENABL: return rename.getEditableProp(value || sel[0]);
            case INDET: return false;
        }
        
        //Start inline renaming of the caption/title/label etc
        if (showUI) {
            if (sel.length)
                rename.start(sel[0]);
        }
        //Set caption/title/label etc with the value specified
        else {
            rename.stop(null, value);
        }
    };
    
    var mode, vcinited;
    commands["mode"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return mode || "default";
            case VALUE: return mode || "default";
            case ENABL: return true;
            case INDET: return false;
        }

    	//@todo solve this in the UI
    	if (value == "select") {
    	    mode = value;
    	    this.$getSelectRect().activate();
    	}
    	else if (value && value.mode == "connect") {
    	    mode = "connect";
    	    var vc = this.$getVisualConnect();
            vc.setMode("draw");
            vc.activate(value.event,value.timeout);
            
            if (!vcinited) {
                this.$getVisualConnect().onchangemode = function(e){
                    if (e.mode != mode) {
                        if (e.mode == "element") mode = "connect-element"
                        else if (e.mode == "all") mode = "connect-all";
                        else if (e.mode == "draw") mode = "connect";
                        else if (e.mode == "draw-started") mode = "connecting";
                    }
                }
            }
    	}
        else if (value && value.mode == "connect-element") {
    	    mode = value.mode;
    	    var vc = this.$getVisualConnect();
            vc.setMode("element");
            vc.activate(value.event,value.timeout);
    	}
        else if (value && value.mode == "connect-all") {
    	    mode = value.mode;
    	    var vc = this.$getVisualConnect();
            vc.setMode("all");
            vc.activate(value.event,value.timeout);
    	}
    	else if (value && value.mode == "add") {
            mode = "add";
            var e   = value.ev;
    	    var pos = apf.getAbsolutePosition(e.indicator);
    	    (value.dragserver || apf.DragServer).stop(null, true);
    	    
    	    addType = value.value;
    	    var opt = {
    	        //htmlNode   : q,
    	        userInteraction : true,
    	        ignorePos  : true,
    	        parentNode : value.parent || apf.document.body,
    	        skinset    : apf.getInheritedAttribute(value.parent || apf.document.body, "skinset")
    	    };
    	    
    	    commands.begin.call(this);
    	    commands["add"].call(this, null, null, opt);
    	    var amlNode = opt.addedNode;
    	    amlNode.$adding = true;
    	    
    	    if (value.parent) {
    	        var ppos = apf.getAbsolutePosition(value.parent.$int);
    	        pos[0] -= ppos[0];
    	        pos[1] -= ppos[1];
    	    }
    	    
    	    amlNode.$ext.style.left = (amlNode.left = pos[0]) + "px";
    	    amlNode.$ext.style.top  = (amlNode.top  = pos[1]) + "px";
    	    amlNode.$ext.style.position = "absolute";
    	    
    	    amlNode.dragOutline = false;
    	    amlNode.$dragStart({
    	        reappend : true,
    	        clientX  : e.htmlEvent.clientX, 
    	        clientY  : e.htmlEvent.clientY
    	    }, true, true);
    	    //amlNode.dragOutline = true;
    	    
    	    addType = null;
    	}
    	else {
    	    mode = value.mode || value;
    	    this.$getSelectRect().deactivate();
            this.$getVisualConnect().deactivate();
    	}
    };
    
    commands["select"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }

        var htmlNode   = options.htmlNode,
            parentNode = options.parentNode;
        if (!parentNode) {
            parentNode = (apf.document.$getVisualSelect().getLastSelection()[0] || apf.document.documentElement);
            if (parentNode.getPage) {
                parentNode = parentNode.getPage();
            }
            else {
                while (parentNode && !parentNode.canHaveChildren)
                    parentNode = parentNode.parentNode;
            }
            options.parentNode = parentNode;
        }
        
        var nodes = apf.document.getElementsByTagName("*");
        var htmlParent = htmlNode.parentNode;
        var left = apf.getHtmlLeft(htmlNode);
        var top  = apf.getHtmlTop(htmlNode);
        var right = left + htmlNode.offsetWidth;
        var bottom = top + htmlNode.offsetHeight;
        var first = true, ext, selList = [];
        var refParent;
        for (var i = 0; i < nodes.length; i++) {
            if (!(ext = nodes[i].$ext))
                continue;
            
            var pos = apf.getAbsolutePosition(ext, htmlParent);
            if (pos[0] > left && pos[0] + ext.offsetWidth < right
              && pos[1] > top && pos[1] + ext.offsetHeight < bottom) {
                if (!refParent) refParent = nodes[i].parentNode;
                else if (refParent != nodes[i].parentNode) continue;
                selList.push(nodes[i]);
                first = false;
            }
        }
        
        if (selList.length)
            apf.document.getSelection().$selectList(selList);
        
        //trTools.select(trTools.queryNode("//node()[@name='Arrow']"));
    };
    
    commands["remove"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        var pNode = sel[0].parentNode;
        sel.each(function(sel) {
            sel.removeNode();
        });

        var s = pNode.ownerDocument.getSelection();
        s.$selectList([apf.document.activeElement && apf.document.activeElement.editable 
            ? apf.document.activeElement
            : (pNode.editable ? pNode : pNode.firstChild)]);
    };
    
    commands["each"] = function(sel, showUI, func, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }

        sel.each(func);
    };
    
    commands["undo"] = function(sel, showUI, value, query){
        var um = apf.window.undoManager;
        switch(query){
            case STATE: return um.undolength;
            case VALUE: return String(um.undolength);
            case ENABL: return um.undolength > 0;
            case INDET: return false;
        }
        
        um.undo(parseInt(value) || null);
    };
    
    commands["redo"] = function(sel, showUI, value, query){
        var um = apf.window.undoManager;
        switch(query){
            case STATE: return um.redolength;
            case VALUE: return String(um.redolength);
            case ENABL: return um.redolength > 0;
            case INDET: return false;
        }
        
        um.redo(parseInt(value) || null);
    };
    
    commands["cut"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return apf.clipboard.store ? true : false;
            case VALUE: return apf.clipboard.store;
            case ENABL: return true;
            case INDET: return false;
        }
        
        commands["copy"].call(this, sel, showUI);
        commands["remove"].call(this, sel, showUI);
    };
    
    commands["copy"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return apf.clipboard.store ? true : false;
            case VALUE: return apf.clipboard.store;
            case ENABL: return true;
            case INDET: return false;
        }

        var nodes = [];
        sel.each(function(item){
            nodes.push(item.cloneNode(true));
        });
            
        apf.clipboard.put(nodes);
    };
    
    commands["paste"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return apf.clipboard.store ? true : false;
            case VALUE: return apf.clipboard.store;
            case ENABL: return true;
            case INDET: return false;
        }
        
        var content = apf.clipboard.get();
        if (!content) return;
        
        var pNode = sel.length > 1 ? sel[0].parentNode : sel[0];

        if (typeof content == "string") {
            sel.insertMarkup(content);
        }
        else if (content.dataType == apf.ARRAY) {
            if (pNode.localName == "table") //@todo not generic enough
                command["resetgeo"].call(this, sel, showUI);
            
            //Init selection
            var docsel = this.getSelection();
            docsel.removeAllRanges();
            
            //Copy nodes and add to selection
            var _self = this;
            content.each(function(item){
                docsel.addRange(new apf.AmlRange(_self)).selectNode(
                    pNode.appendChild(item.cloneNode(true)));
            });
        }
        else if (content.$regbase) {
            sel.appendChild(content.cloneNode(true))
        }
        else {
            alert("Could not paste content");
        }
        
        //#ifdef __WITH_LAYOUT
        //@todo more general place for this?
        apf.layout.processQueue();
        //#endif
    };
    
    commands["duplicate"] = function(sel, showUI, value, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        //Init selection
        var docsel = this.getSelection();
        docsel.removeAllRanges();
        
        //Copy nodes and add to selection
        sel.each(function(item){
            docsel.addRange(new apf.AmlRange(item)).selectNode(
                item.parentNode.appendChild(apf.getCleanCopy(item)));
        });
        
        /*apf.ContentEditable.execCommand("resetgeo", {
            sel: nodes
        });*/
        
        //#ifdef __WITH_LAYOUT
        //@todo more general place for this?
        apf.layout.processQueue();
        //#endif
    };
    
    commands["resetgeo"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }

        if (!sel.length)
            return;

        var props = ["left", "top", "right", "bottom", "anchors"];
        
        if ("vbox|hbox|table".indexOf(sel[0].parentNode.localName) == -1)
            props.push("align");
        if (!options || !options.keepwidth)
            props.push("width");
        if (!options || !options.keepheight)
            props.push("height");

        sel.each(function(sel){
            props.each(function(item){
                if (sel[item])
                    sel.setAttribute(item, "");
            });
            
            //@todo this should be done by align/anchoring
            sel.$ext.style.position = "";
        });
        
        sel[0].ownerDocument.$getVisualSelect().updateGeo();
    };
    
    commands["property"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        sel.each(function(sel) {
            sel.setAttribute(options.name, options.value);
        });
        
        sel[0].ownerDocument.$getVisualSelect().updateGeo(); //Possibly not best place for this
    };
    
    //@todo should keep an ordered list of zIndexes and reset all...
    commands["back"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        sel.each(function(sel) {
            if (sel.zindex != 0)
                sel.setAttribute("zindex", 0);
        });
    };
    
    //@todo should keep an ordered list of zIndexes and reset all...
    commands["backward"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        sel.each(function(sel) {
            if (sel.zindex != 0)
                sel.setAttribute("zindex", (sel.zindex || 1) - 1);
        });
    };
    
    //@todo should keep an ordered list of zIndexes and reset all...
    commands["front"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        sel.each(function(sel) {
            if (sel.zindex != 100000)
                sel.setAttribute("zindex", 100000);
        });
    };
    
    //@todo should keep an ordered list of zIndexes and reset all...
    commands["forward"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        sel.each(function(sel) {
            if (sel.zindex != 100000)
               sel.setAttribute("zindex", (sel.zindex || 0) + 1);
        });
    };
    
    //@todo not implemented
    commands["align"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        apf.ContentEditable.execCommand("property", {
            name: "align", value: options.to
        });
        if ("left|middle|right".indexOf(options.to) > -1)
            apf.ContentEditable.execCommand("property", {
                name: "height", value: ""
            });
        if ("top|middle|bottom".indexOf(options.to) > -1)
            apf.ContentEditable.execCommand("property", {
                name: "width", value: ""
            });

        sel[0].ownerDocument.$getVisualSelect().updateGeo();
    };
    
    var sortFn = {
        "hbox": function(a, b){
            return (a.$ext.offsetLeft - b.$ext.offsetLeft);
        },
        "vbox": function(a, b){
            return (a.$ext.offsetTop - b.$ext.offsetTop);
        },
        "table": function(a, b){
            var dH = a.$ext.offsetTop - b.$ext.offsetTop;
            if (Math.abs(dH)/b.$ext.offsetHeight < 0.9)
                return (a.$ext.offsetLeft - b.$ext.offsetLeft);
            return dH;
        }
    }
    commands["surround"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
        
        var pNode = sel[0].parentNode;
        var pos = [100000,100000,0,0];
        for (var i = 0; i < sel.length; i++) {
            var oEl  = sel[i].$ext;
            var opos = apf.getAbsolutePosition(oEl, pNode.$int);
            if (opos[0] < pos[0]) pos[0] = opos[0];
            if (opos[1] < pos[1]) pos[1] = opos[1];
            if (opos[0] + oEl.offsetWidth > pos[2]) pos[2] = opos[0] + oEl.offsetWidth;
            if (opos[1] + oEl.offsetHeight > pos[3]) pos[3] = opos[1] + oEl.offsetHeight;
        }
        pos[2] -= pos[0];
        pos[3] -= pos[1];
        
        addType = options.to;
        
        //Spatial sort selection
        sel.sort(sortFn[addType]);
        
        //Reset position
        var isInLayout = "vbox|hbox|table".indexOf(pNode.localName) > -1;
        commands["resetgeo"].call(this, sel, false, {
            keepwidth  : !isInLayout && options.to == "hbox",
            keepheight : !isInLayout && options.to == "vbox"
        });

        //Add container
        var opt = {
            parentNode : pNode,
            beforeNode : sel[0],
            ignorePos : true,
            left : pos[0],
            top : pos[1]
        };
        if (pNode.localName != "table") {
            if (pNode.localName != "vbox")
                opt.width = pos[2];
            if (pNode.localName != "hbox")
                opt.height = pos[3];
        }
        
        commands["add"].call(this, null, false, opt);

        if (isInLayout && options.to != "table") {
            sel.each(function(sel) {
                if (isInLayout) {
                    if (options.to == "hbox" && pNode.localName == "vbox")
                        sel.setAttribute("width", sel.height);
                    if (options.to == "vbox" && pNode.localName == "hbox")
                        sel.setAttribute("height", sel.width);
                }
            });
        }
        
        //Add selection
        sel.each(function(sel) {
            opt.addedNode.appendChild(sel);
        });
        
        this.getSelection().$selectList([opt.addedNode]);
        
        //#ifdef __WITH_LAYOUT
        //@todo more general
        apf.layout.processQueue();
        //#endif
        
    };
    
    //@todo not implemented
    commands["convert"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
    };
    
    //@todo not implemented
    commands["lock"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
    };
    
    //@todo not implemented
    commands["unlock"] = function(sel, showUI, options, query){
        switch(query){
            case STATE: return false;
            case VALUE: return "false";
            case ENABL: return true;
            case INDET: return false;
        }
    };
    
    commands.begin = function(sel, showUI, bClear){
        apf.window.undoManager.begin(this.documentElement, bClear);
    };
    
    commands.rollback = function(){
        apf.window.undoManager.rollback(this.documentElement);
    };
    
    commands.commit = function(){
        apf.window.undoManager.commit(this.documentElement);
    };
    
    commands.pause = function(sel, showUI, bContinue){
        apf.window.undoManager.pause(this.documentElement, bContinue);
    };

    apf.AmlDocument.prototype.$commands = apf.extend(
        apf.AmlDocument.prototype.$commands,
        commands
    );
})();

//#endif
