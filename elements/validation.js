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

//#ifdef __WITH_VALIDATION

/**
 * @define validation 
 *
 * @constructor
 * @apfclass
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
apf.validation = apf.component(apf.NODE_HIDDEN, function(){
    this.$rules = [];
    
    var amlNodes = {};
    this.register = function(amlNode){
        if (amlNode.tagName != "model")
            return;
        
        amlNodes[amlNode.uniqueId] = amlNode;
        
        amlNode.$validation = this;
        
        //each child should register
    }

    this.unregister = function(){
        //unregister element
        amlNodes[amlNode.uniqueId] = null;
        delete amlNodes[amlNode.uniqueId];
        
        amlNode.$validation = null;
    };
    
    this.getRule = function(xmlNode){
        /*var rules = this.$rules[name];
        //@todo Shouldn't allow async calls..., should always give a function
        for (var rule, i = 0, l = rules.length; i < l; i++) {
            var rule = rules[i];
            if ((rule[1] || (rule[1] = (rule[5] = apf.jsltParser.compile(rule[0]))[0] || jpf.K))(xmlNode)) 
                return rule;
        }*/

        var id = apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(xmlNode), xmlNode.nodeType == 1 ? xmlNode : xmlNode.parentNode);
        for (var i = 0, l = this.$rules.length; i < l; i++) {
            if (xmlNode.ownerDocument.selectSingleNode("(.//" + this.$rules[i][0].split("|").join("|.//") + ")[@" + apf.xmldb.xmlIdTag + "='" + id + "']"))
                return this.$rules[i][1];
        }
    }
    
    this.validate = function(xmlNode, checkRequired, validityState){
        var rule = this.getRule(xmlNode);
        if (!rule) return validityState;
        
        return (rule.isValid || (rule.isValid 
          = apf.validator.compile(rule)))(apf.queryValue(xmlNode), checkRequired, validityState);
    }
    
    //@todo add DOM handlers
    
    /**
     * @private
     */
    this.loadAml = function(x, parentNode){
        this.name = x.getAttribute("id");
        this.$aml = x;
        
        this.parentNode = parentNode;
        //#ifdef __WITH_AMLDOM_FULL
        apf.implement.call(this, apf.AmlDom); /** @inherits apf.AmlDom */
        //#endif
        
        var rule, attr, node, nodes = x.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if ((node = nodes[i]).nodeType != 1)
                continue;
            this.$rules.push([node.getAttribute("match"), (rule = {})]);
            attr = node.attributes;
            for (var j = 0; j < attr.length; j++)
                rule[attr[j].nodeName] = attr[j].nodeValue;
            rule.node = node;
        }
    };
});

// #endif

