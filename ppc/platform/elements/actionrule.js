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
 
//#ifdef __WITH_DATABINDING

/** 
 * Define some action rules.
 *
 * @class ppc.ActionRule
 * @inherits ppc.AmlElement
 */
// @todo Doc do all of these.
/*
 * @attribute {String} match
 */
/* 
 * @attribute {String} set
 */
/* 
 * @attribute {String} undo
 */
/* 
 * @attribute {String} lock
 */
// @todo Doc ALL of these
/*
 * @define update
 */
/* 
 * @attribute {String} get 
 */
/* 
 * @attribute {String} parent
 */
/* 
 * @define add
 */
/* 
 * @attribute {Boolean} get 
 */
/*
 * @attribute {Boolean} parent
 */
ppc.ActionRule = function(struct, tagName){
    this.$init(tagName || true, ppc.NODE_HIDDEN, struct);
};

(function(){
    this.$actionRule = true;
    
    this.compile = function(prop, options){
        return (this["c" + prop] = ppc.lm.compile(this[prop], 
            options || {xpathmode: 2}));
    }
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = ppc.extend({
        set    : 1,
        get    : 1,
        undo   : 1,
        lock   : 1,
        match  : 1,
        parent : 1
    }, this.$attrExcludePropBind);

    this.$propHandlers["set"]   = 
    this.$propHandlers["get"]   = 
    this.$propHandlers["parent"]   = 
    this.$propHandlers["match"] = function(value, prop){
        delete this["c" + prop];
    }

    // *** DOM Handlers *** //

    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this) {
            var pNode = this.parentNode;
            if (!pNode.$actions)
                pNode.$actions = new ppc.ruleList();
            
            (pNode.$actions[this.localName] 
              || (pNode.$actions[this.localName] = [])).push(this);
        }
        else {
            if (this.attributes.getNamedItem("value"))
                return;
            
             //@todo ppc3.0 test if proc instr and cdata needs to be serialized
            this.value = ppc.serializeChildren(this);
       }
    });

    this.addEventListener("DOMNodeRemoved", function(e){
        if (this.$amlDestroyed)
            return;
        
        if (e.currentTarget == this) {
            this.parentNode.$actions[this.localName].remove(this);
        }
        else {
            if (this.attributes.getNamedItem("value"))
                return;
            
             //@todo ppc3.0 test if proc instr and cdata needs to be serialized
            this.value = ppc.serializeChildren(this);
       }
    });

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (!this.get)
            this.get = ppc.serializeChildren(this.$aml).trim();

        var actions = this.parentNode.$actions 
          || (this.parentNode.$actions = new ppc.ruleList());
        
        (actions[this.localName] || (actions[this.localName] = [])).push(this);
    });
}).call(ppc.ActionRule.prototype = new ppc.AmlElement());

ppc.aml.setElement("rename", ppc.ActionRule);   
ppc.aml.setElement("remove", ppc.ActionRule);
ppc.aml.setElement("add",    ppc.ActionRule);
ppc.aml.setElement("update", ppc.ActionRule);
ppc.aml.setElement("copy",   ppc.ActionRule);
ppc.aml.setElement("move",   ppc.ActionRule);
ppc.aml.setElement("check",  ppc.ActionRule);
ppc.aml.setElement("change", ppc.ActionRule);
// #endif

