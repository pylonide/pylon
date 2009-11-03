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
 * @attribute {String} target 
 * @attribute {String} action
 * @attribute {Boolean} copy
 */
apf.BindingDndRule = function(struct, tagName){
    this.$init(tagName, apf.NODE_HIDDEN, struct);
};

(function(){
    this.compile = function(prop){
        if (!this[prop])
            return;
        
        var compileData;
        if (prop == "value")
            compileData = apf.lm.compile(this[prop], {
                xpathmode  : 3
            });
        else if (prop == "match")
            compileData = apf.lm.compile(this[prop], {
                xpathmode  : 3,
                injectself : true
            });
        else if (prop == "target")
            compileData = apf.lm.compile(this[prop], {
                xpathmode  : 2,
                injectself : true
            });
        else if (prop == "action")
            compileData = apf.lm.compile(this[prop], {
                nostring : true
            });
        else if (prop == "copy")
            compileData = apf.lm.compile(this[prop], {
                withopt  : true,
                nostring : true
            });
        else
            throw new Error("Missing property handler for compile");
        
        return (this["c" + prop] = compileData);
    }
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        target   : 1,
        parent   : 1,
        action   : 1,
        dragcopy : 1
    }, this.$attrExcludePropBind);

    this.$propHandlers["target"]   = 
    this.$propHandlers["parent"]   = 
    this.$propHandlers["action"]   = 
    this.$propHandlers["dragcopy"] = function(value, prop){
        delete this["c" + prop];
    }
    
    this.$noderegister = function(e){
         apf.GuiElement.propHandlers["drop"].call(e.amlNode, true);
    }
    
    //@todo removal
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //Find parent that this rule works on
        var pNode = this;
        while (pNode && pNode.$bindingRule) 
            pNode = pNode.parentNode;
       
        if (!pNode)
            return;
        
        if (pNode.localName == "bindings") {
            pNode.addEventListener("noderegister", this.$noderegister);
            
            var nodes = pNode.$amlNodes;
            for (var i = 0; i < nodes.length; i++)
                apf.GuiElement.propHandlers["drop"].call(nodes[i], true);
        }
        else {
            apf.GuiElement.propHandlers["drop"].call(pNode, true);
        }
    });
}).call(apf.BindingDndRule.prototype = new apf.BindingRule());

apf.aml.setElement("drag", apf.BindingDndRule);
apf.aml.setElement("drop", apf.BindingDndRule);
// #endif

