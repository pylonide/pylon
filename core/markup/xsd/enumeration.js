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

//#ifdef __WITH_XSDENUMERATION
/**
 * Defines a list of acceptable values
 */
apf.XsdEnumeration = function(struct, tagName){
    this.$init(tagName || "enumeration", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$propHandlers["value"] = function(){
        this.parentNode.$recompile();
    };
    
    this.$compile = function(stack){
        if (stack.enumDone) 
            return;

        stack.enumDone = true;

        var k, l,
            re    = [],
            nodes = this.parentNode.getElementsByTagNameNS(this.namespaceURI,
                    "enumeration");
        for (k = 0, l = nodes.length; k < l; k++)
            re.push(nodes[k].value);
        
        stack.push("if (!/^(?:" + re.join("|") + ")$/.test(value)) return false;");
    };
}).call(apf.XsdEnumeration.prototype = new apf.XsdElement());

apf.xsd.setElement("enumeration", apf.XsdEnumeration);
//#endif