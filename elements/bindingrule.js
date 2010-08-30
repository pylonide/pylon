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
 * @define bindings element containing all the binding rules for the data 
 * bound elements referencing this element.
 * Example:
 * <code>
 *  <a:model id="mdlList">
 *      <data>
 *          <item date="2009-11-12" deleted="0"></item>
 *          <item date="2009-11-11" deleted="0"></item>
 *      </data>
 *  </a:model>
 *  <a:bindings id="bndFolders" >
 *      <a:caption match="[@date]" />
 *      <a:icon match="[@icon]" />
 *      <a:each match="[item]" sort="[@date]" />
 *  </a:bindings>
 *  <a:list 
 *    id       = "list" 
 *    width    = "200" 
 *    height   = "200" 
 *    model    = "mdlList" 
 *    bindings = "bndFolders" />
 * </code>
 * @see element.smartbinding
 *
 * @baseclass
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
apf.BindingRule = function(struct, tagName){
    this.$init(tagName || true, apf.NODE_HIDDEN, struct);
};

(function(){
    this.$bindingRule = true;
    
    this.compile = function(prop){
        return (this["c" + prop] = apf.lm.compile(this[prop], {
            xpathmode  : 3,
            injectself : true
        }));
    };
    
    this.$compile = function(prop, options){
        return (this["c" + prop + "2"] = apf.lm.compile(this[prop], options));
    };

    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        value : 1,
        match : 1
    }, this.$attrExcludePropBind);

    this.$booleanProperties["hasaml"] = true;
    
    this.$propHandlers["value"] = 
    this.$propHandlers["match"] = function(value, prop){
        delete this["c" + prop];
        
        if (this.$amlLoaded) {
            //Find parent that this rule works on
            var node = this;
            while (node && node.$bindingRule) 
                node = node.parentNode;
            
            if (!node) return;
            
            //Reload parent to propagate change
            apf.queue.add("reload" + node.$uniqueId, function(){
                node.reload();
            });
            
            //Recompile ruleset
            if (node.$bindings.$isCompiled)
                node.$bindings.$compiled = node.$bindings.compile(
                    this.localName != "each" && this.localName);
        }
    };
    
    /**** DOM Handlers ****/
    
    /*this.addEventListener("DOMAttrModified", function(e){
        
    });*/
    
    this.addEventListener("DOMNodeInserted", function(e){
        //Find parent that this rule works on
        var node = this;
        while (node.$bindingRule) 
            node = node.parentNode;
        
        //Reload parent to propagate change
        //@todo trigger should be maintained on node itself to prevent dual reload
        apf.queue.add("reload" + node.$uniqueId, function(){
            node.reload();
        });

        //If this node is added, add to set
        if (e.currentTarget == this) {
            (node.$bindings[this.localName] 
                || (node.$bindings[this.localName] = [])).push(this);
        }
        //@todo apf3.0 test if proc instr and cdata needs to be serialized
        //Else just update the binding value
        else  if (!this.attributes.getNamedItem("value"))
            this.value = apf.serializeChildren(this);
        //Or do nothing
        else return;

        //Recompile ruleset
        if (node.$bindings.$isCompiled)
            node.$bindings.$compiled = node.$bindings.compile(
                this.localName != "each" && this.localName);
    });
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (this.$amlDestroyed)
            return;
        
        //Find parent that this rule works on
        var first, node = this;
        while (node && node.$bindingRule) 
            node = node.parentNode;
       
        if (!node)
            return;
       
        //If this node is removed, remove to set
        if (e.currentTarget == this) {
            if (node.$bindings && node.$bindings[this.localName])
                node.$bindings[this.localName].remove(this);
            else
                return;
        }
        //@todo apf3.0 test if proc instr and cdata needs to be serialized
        //Else just update the binding value
        else  if (!this.attributes.getNamedItem("value") && (first = this.firstChild)) {
            if (first.nodeType == this.NODE_PROCESSING_INSTRUCTION) {
                if (first.target == "lm")
                    this.value = "{" + first.nodeValue + "}";
                else
                    this.value = first.nodeValue;
            }
            else
                this.value = apf.serializeChildren(this).trim();
        }
        //Or do nothing
        else return;

        //Reload parent to propagate change
        apf.queue.add("reload" + node.$uniqueId, function(){
            if(!node.$amlDestroyed)
                node.reload();
        });

        //Recompile ruleset
        if (node.$bindings.$isCompiled)
            node.$bindings.$compiled = node.$bindings.compile(
                this.localName != "each" && this.localName);
    });

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //#ifdef __DEBUG
        if (!this.match && (!this.value && !this.childNodes.length && !this.get
          || this.localName == "each") || this.select) {
            throw new Error(apf.formatErrorString(0, this, "Bindingrule",
                "Missing attribute 'match'")); //@todo apf3.0 turn this into a good error
        }
        //#endif

        var first;
        if (!this.value && this.localName != "each" && (first = this.$aml 
          && this.$aml.firstChild || this.firstChild)) {
            if (first.nodeType == this.NODE_PROCESSING_INSTRUCTION) {
                if (first.target == "lm")
                    this.value = "{" + first.nodeValue + "}";
                else
                    this.value = first.nodeValue;
            }
            else
                this.value = apf.serializeChildren(this.$aml).trim();
        }
        
        //Find the parent this rule works on
        var pNode = this.parentNode;
        while (pNode.$bindingRule)
            pNode = pNode.parentNode;

        //Add the rule to the set
        var bindings = pNode.$bindings || (pNode.$bindings = new apf.ruleList());
        (bindings[this.localName] || (bindings[this.localName] = [])).push(this);
        
        //Compile if necessary
        if (pNode.localName != "bindings" && (this.localName != "each" || !this.childNodes.length)) {
            var ns = this;
            while((ns = ns.nextSibling) && ns.nodeType != 1);
            
            if (!ns || !ns.$bindingRule) {
                pNode.$cbindings = pNode.$bindings.compile(
                  pNode.$bindings.$isCompiled ? this.localName : null);
                
                pNode.dispatchEvent("bindingsload", {
                    bindings: pNode.$bindings, 
                    compiled: pNode.$cbindings
                });
                pNode.$checkLoadQueue();
            }
        }
    });
}).call(apf.BindingRule.prototype = new apf.AmlElement());

apf.aml.setElement("icon",       apf.BindingRule);
apf.aml.setElement("image",      apf.BindingRule);
apf.aml.setElement("caption",    apf.BindingRule);
apf.aml.setElement("tooltip",    apf.BindingRule);
apf.aml.setElement("css",        apf.BindingRule);
apf.aml.setElement("selectable", apf.BindingRule);
apf.aml.setElement("value",      apf.BindingRule);
apf.aml.setElement("src",        apf.BindingRule);
apf.aml.setElement("collapsed",  apf.BindingRule);
apf.aml.setElement("expanded",  apf.BindingRule);
apf.aml.setElement("empty",      apf.BindingRule);
// #endif

