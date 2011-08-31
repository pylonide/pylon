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

// #ifdef __WITH_LAYOUT

/**
 * Object dealing with layout updates
 */
apf.layout = {
    compile : function(oHtml){
        var l = this.layouts[oHtml.getAttribute("id")];
        if (!l) return false;

        var root = l.root.copy();//is there a point to copying?
        
        l.layout.compile(root);
        l.layout.reset();
    },

    removeAll : function(aData) {
        aData.children.length = null

        var htmlId = this.getHtmlId(aData.pHtml);
        if (!this.rules[htmlId])
            delete this.qlist[htmlId];
    },
    
    timer : null,
    qlist : {},
    dlist : [],
    $hasQueue : false,
    
    queue : function(oHtml, obj, compile, q){
        if (!q) {
            this.$hasQueue = true;
            q = this.qlist;
        }
        
        var id;
        if (!(id = this.getHtmlId(oHtml)))
            id = apf.setUniqueHtmlId(oHtml);
            
        if (q[id]) {
            if (obj)
                q[id][2].push(obj);
            if (compile)
                q[id][1] = compile;
            return;
        }

        q[id] = [oHtml, compile, [obj]];

        if (!this.timer)
            this.timer = apf.setZeroTimeout(function(){
                apf.layout.processQueue();
            });
    },

    processQueue : function(){
        var i, id, l, qItem, list;

        for (i = 0; i < this.dlist.length; i++) {
            if (this.dlist[i].hidden)
                this.dlist[i].hide();
            else
                this.dlist[i].show();
        }

        do {
            var newq = {};
            var qlist = this.qlist;
            this.qlist = {};
            
            this.$hasQueue = false;
            
            for (id in qlist) {
                qItem = qlist[id];
    
                if (qItem[1])
                    apf.layout.compileAlignment(qItem[1]);
    
                list = qItem[2];
                for (i = 0, l = list.length; i < l; i++) {
                    if (list[i]) {
                        if (list[i].$amlDestroyed)
                            continue;
                        //if (list[i].$amlLoaded)
                            list[i].$updateLayout();
                        /*else
                            this.queue(qItem[0], list[i], null, newq);*/
                    }
                }
    
                apf.layout.activateRules(qItem[0]);
            }
        } while (this.$hasQueue);
        
        if (apf.hasSingleRszEvent)
            apf.layout.forceResize();

        this.dlist = [];
        
        clearTimeout(this.timer);
        this.timer = null;
    },
    
    rules     : {},
    onresize  : {},

    getHtmlId : function(oHtml){
        return oHtml.getAttribute ? oHtml.getAttribute("id") : 1;
    },

    /**
     * Adds layout rules to the resize event of the browser. Use this instead
     * of onresize events to add rules that specify determine the layout.
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element. Use this to easily update or remove the rules added.
     * @param {String}      rules       the javascript code that is executed when the html element resizes.
     * @param {Boolean}     [overwrite] whether the rules are added to the resize function or overwrite the previous set rules with the specified id.
     */
    setRules : function(oHtml, id, rules, overwrite){
        if (!this.getHtmlId(oHtml))
            apf.setUniqueHtmlId(oHtml);
        if (!this.rules[this.getHtmlId(oHtml)])
            this.rules[this.getHtmlId(oHtml)] = {};

        var ruleset = this.rules[this.getHtmlId(oHtml)][id];
        if (!overwrite && ruleset) {
            this.rules[this.getHtmlId(oHtml)][id] = rules + "\n" + ruleset;
        }
        else
            this.rules[this.getHtmlId(oHtml)][id] = rules;
    },

    /**
     * Retrieves the rules set for the resize event of an html element specified by an identifier
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element.
     */
    getRules : function(oHtml, id){
        return id
            ? this.rules[this.getHtmlId(oHtml)][id]
            : this.rules[this.getHtmlId(oHtml)];
    },

    /**
     * Removes the rules set for the resize event of an html element specified by an identifier
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     * @param {String}      id          the identifier for the rules within the resize function of this element.
     */
    removeRule : function(oHtml, id){
        var htmlId = this.getHtmlId(oHtml);
        if (!this.rules[htmlId])
            return;

        var ret = this.rules[htmlId][id] ||  false;
        delete this.rules[htmlId][id];

        var prop;
        for (prop in this.rules[htmlId]) {

        }
        if (!prop)
            delete this.rules[htmlId]

        if (apf.hasSingleRszEvent) {
            if (this.onresize[htmlId])
                this.onresize[htmlId] = null;
            else {
                var p = oHtml.parentNode;
                while (p && p.nodeType == 1 && !this.onresize[p.getAttribute("id")]) {
                    p = p.parentNode;
                }
    
                if (p && p.nodeType == 1) {
                    var x = this.onresize[p.getAttribute("id")];
                    if (x.children)
                        delete x.children[htmlId]
                }
            }
        }
        
        return ret;
    },

    /**
     * Activates the rules set for an html element
     * @param {HTMLElement} oHtml       the element that triggers the execution of the rules.
     */
    activateRules : function(oHtml, no_exec){
        if (!oHtml) { //!apf.hasSingleRszEvent &&
            var prop, obj;
            for(prop in this.rules) {
                obj = document.getElementById(prop);
                if (!obj || obj.onresize) // || this.onresize[prop]
                    continue;
                this.activateRules(obj);
            }

             if (apf.hasSingleRszEvent && apf.layout.$onresize)
                apf.layout.$onresize();
            return;
        }

        var rsz, id, rule, rules, strRules = [];
        if (!apf.hasSingleRszEvent) {
            rules = this.rules[this.getHtmlId(oHtml)];
            if (!rules){
                oHtml.onresize = null;
                return false;
            }

            for (id in rules) { //might need optimization using join()
                if (typeof rules[id] != "string")
                    continue;
                strRules.push(rules[id]);
            }

            //apf.console.info(strRules.join("\n"));
            rsz = apf.needsCssPx
                ? new Function(strRules.join("\n"))
                : new Function(strRules.join("\n").replace(/ \+ 'px'|try\{\}catch\(e\)\{\}\n/g,""))

            oHtml.onresize = rsz;
            if (!no_exec) 
                rsz();
        }
        else {
            var htmlId = this.getHtmlId(oHtml);
            rules = this.rules[htmlId];
            if (!rules){
                //@todo keep .children
                //delete this.onresize[htmlId];
                return false;
            }

            for (id in rules) { //might need optimization using join()
                if (typeof rules[id] != "string")
                    continue;
                strRules.push(rules[id]);
            }
            
            var p = oHtml.parentNode;
            while (p && p.nodeType == 1 && !this.onresize[p.getAttribute("id")]) {
                p = p.parentNode;
            }

            var f = new Function(strRules.join("\n"));//.replace(/try\{/g, "").replace(/}catch\(e\)\{\s*\}/g, "\n")
            if (this.onresize[htmlId])
                f.children = this.onresize[htmlId].children;
            
            if (p && p.nodeType == 1) {
                var x = this.onresize[p.getAttribute("id")];
                this.onresize[htmlId] = (x.children || (x.children = {}))[htmlId] = f;
            }
            else {
                this.onresize[htmlId] = f;
            }
            if (!no_exec)
                f();

            if (!apf.layout.$onresize) {
                /*var f = apf.layout.onresize;
                window.onresize = function(){
                    var s = [];
                    for (var name in f)
                        s.unshift(f[name]);
                    for (var i = 0; i < s.length; i++)
                        s[i]();
                }*/
                
                var rsz = function(f){
                    //@todo fix this
                    try{
                        var c = [];
                        for (var name in f)
                            if (f[name])
                                c.unshift(f[name]);
                        for (var i = 0; i < c.length; i++){
                            c[i]();
                            if (c[i].children) {
                                rsz(c[i].children);
                            }
                        }
                    }
                    catch(e){
                        
                    }
                }
                
                apf.addListener(window, "resize", apf.layout.$onresize = function(){
                    rsz(apf.layout.onresize);
                });
            }
        }
    },

    /**
     * Forces calling the resize rules for an html element
     * @param {HTMLElement} oHtml  the element for which the rules are executed.
     */
    forceResize : function(oHtml){
        if (apf.hasSingleRszEvent)
            return apf.layout.$onresize && apf.layout.$onresize();

        /* @todo this should be done recursive, old way for now
        apf.hasSingleRszEvent
            ? this.onresize[this.getHtmlId(oHtml)]
            :
        */

        var rsz = oHtml.onresize;
        if (rsz)
            rsz();

        var els = oHtml.getElementsByTagName("*");
        for (var i = 0, l = els.length; i < l; i++) {
            if (els[i] && els[i].onresize)
                els[i].onresize();
        }
    },

    paused : {},

    /**
     * Disables the resize rules for the html element temporarily.
     * @param {HTMLElement} oHtml  the element for which the rules are paused.
     * @param {Function}    func   the resize code that is used temporarily for resize of the html element.
     */
    pause  : function(oHtml, replaceFunc){
        if (apf.hasSingleRszEvent) {
            var htmlId = this.getHtmlId(oHtml);
            this.paused[htmlId] = this.onresize[htmlId] || true;

            if (replaceFunc) {
                this.onresize[htmlId] = replaceFunc;
                this.onresize[htmlId].children = this.paused[htmlId].children;
                replaceFunc();
            }
            else
                delete this.onresize[htmlId];
        }
        else {
            this.paused[this.getHtmlId(oHtml)] = oHtml.onresize || true;

            if (replaceFunc) {
                oHtml.onresize = replaceFunc;
                replaceFunc();
            }
            else
                oHtml.onresize = null;
        }
    },

    /**
     * Enables paused resize rules for the html element
     * @param {HTMLElement} oHtml  the element for which the rules have been paused.
     */
    play : function(oHtml){
        if (!this.paused[this.getHtmlId(oHtml)])
            return;

        if (apf.hasSingleRszEvent) {
            var htmlId = this.getHtmlId(oHtml);
            var oldFunc = this.paused[htmlId];
            if (typeof oldFunc == "function") {
                this.onresize[htmlId] = oldFunc;
                //oldFunc();
            }
            else
                delete this.onresize[htmlId];

            if (apf.layout.$onresize)
                apf.layout.$onresize();

            this.paused[this.getHtmlId(oHtml)] = null;
        }
        else {
            var oldFunc = this.paused[this.getHtmlId(oHtml)];
            if (typeof oldFunc == "function") {
                oHtml.onresize = oldFunc;
                oldFunc();
            }
            else
                oHtml.onresize = null;

            this.paused[this.getHtmlId(oHtml)] = null;
        }
    }
};
// #endif

/**
 * @private
 */
apf.getWindowWidth = function(){
    return apf.isIE ? document.documentElement.offsetWidth - apf.windowHorBorder : window.innerWidth;
}
/**
 * @private
 */
apf.getWindowHeight = function(){
    return apf.isIE ? document.documentElement.offsetHeight - apf.windowVerBorder : window.innerHeight;
}