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
* @define actions  element containing all the action rules for the data 
 * bound elements referencing this element.
 * Example:
 * <code>
 *  <a:actions id="actPerson" >
 *      <a:add set="{comm.addPerson([.])}">
 *          <person name="New person" />
 *      </a:add
 *      <a:rename set="{comm.renamePerson([@id], [@name])}" />
 *      <a:remove match="[@new]" set="{comm.removePerson([@id])}"/>
 *  </a:actions>
 *
 *  <a:tree actions="actPerson" />
 * </code>
 * @allowchild {actions}
 * @addnode smartbinding, global
 *
 * @constructor
 * @apfclass
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
apf.actions = function(struct, tagName){
    this.$init(tagName || "actions", apf.NODE_HIDDEN, struct);
    
    this.$actions      = new apf.ruleList();
    this.$amlNodes     = {};
};

(function(){
    this.$smartbinding = null;

    this.register = function(amlNode){
        if (amlNode.localName == "smartbinding") {
            this.$smartbinding = amlNode;
            this.$smartbinding.add(this); //Assuming only at init
            return;
        }
        
        this.$amlNodes[amlNode.$uniqueId] = amlNode;
        amlNode.$actions = this.$actions;
        amlNode.$actionsElement = this;
        amlNode.dispatchEvent("actionsload", {bindings: this});
    }

    this.unregister = function(amlNode){
        //unregister element
        this.$amlNodes[amlNode.$uniqueId] = null;
        delete this.$amlNodes[amlNode.$uniqueId];

        delete amlNode.$actionsElement;
        delete amlNode.$actions;
        amlNode.dispatchEvent("actionsunload", {bindings: this});
    };
    
    /**** DOM Handlers ****/
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var nodes = this.childNodes;
        for (var node, i = 0, l = nodes.length; i < l; i++) {
            if ((node = nodes[i]).nodeType != 1)
                continue;
                
            node.dispatchEvent("DOMNodeInsertedIntoDocument");
        }
        
        this.register(this.parentNode);
    });
}).call(apf.actions.prototype = new apf.AmlElement());

apf.aml.setElement("actions", apf.actions);
// #endif
