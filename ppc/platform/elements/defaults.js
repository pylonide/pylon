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

// #ifdef __AMLSERVICES || __INC_ALL

/**
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
ppc.defaults = function(struct, tagName){
    this.$init(tagName || "services", ppc.NODE_HIDDEN, struct);
};

(function(){
    this.$parsePrio = "002";
    //#ifdef __WITH_NAMESERVER
    this.$propHandlers["for"] = function(value){
        if (this.$lastFor)
            ppc.nameserver.remove("defaults_" + this.$lastFor, this);

        ppc.nameserver.add("defaults_" + value, this);
        this.$lastFor = value;
    }
    
    //@todo ppc3.x how should this work?
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        ppc.nameserver.remove("defaults_" + this.$lastFor, this);
    });
    //#endif
}).call(ppc.defaults.prototype = new ppc.AmlElement());

ppc.aml.setElement("defaults", ppc.defaults);

// #endif
