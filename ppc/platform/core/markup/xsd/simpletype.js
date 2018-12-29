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

//#ifdef __WITH_XSDSIMPLETYPE
apf.XsdSimpleType = function(struct, tagName){
    this.$init(tagName || "simpletype", apf.NODE_HIDDEN, struct);
    
    var lastName;
    this.$propHandlers["name"] = function(value){
        if (lastName) {
            apf.xsd.custumTypeHandlers[value] = 
                apf.xsd.custumTypeHandlers[lastName]
            apf.xsd.custumTypeHandlers[lastName] = null;
        }
        
        lastName = value;
    };
};

(function(){
    this.$compile = function(stack){
        var i, l, nodes, node;
        if (!this.parentNode.$compile) {
            stack = [];
    
            nodes = this.childNodes;
            for (i = 0, l = nodes.length; i < l; i++)
                (node = nodes[i]).$compile && node.$compile(stack);
    
            stack.push("return true;");
            apf.xsd.custumTypeHandlers[this.name] =
                new Function('value', stack.join("\n"));
        }
        else {
            nodes = this.childNodes;
            for (i = 0, l = nodes.length; i < l; i++)
                (node = nodes[i]).$compile && node.$compile(stack);
        }
    };
}).call(apf.XsdSimpleType.prototype = new apf.XsdElement());

apf.xsd.setElement("simpletype", apf.XsdSimpleType);
//#endif