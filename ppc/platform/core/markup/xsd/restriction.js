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

//#ifdef __WITH_XSDRESTRICTION
apf.XsdRestriction = function(struct, tagName){
    this.$init(tagName || "restriction", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$propHandlers["base"] = function(){
        this.parentNode.$recompile();
    }
    
    this.$compile = function(stack){
        stack.push("if (!apf.xsd.matchType(value, '"
            + this.base + "')) return false;");

        var i, l, node,
            nodes = this.childNodes;
        for (i = 0, l = nodes.length; i < l; i++)
            (node = nodes[i]).$compile && node.$compile(stack);
    }
}).call(apf.XsdRestriction.prototype = new apf.XsdElement());

apf.xsd.setElement("restriction", apf.XsdRestriction);
//#endif