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

// #ifdef __AMLSOURCE || __INC_ALL

/**
 * Element 
 *
 * @constructor
 *
 * @define source
 * @addnode audio, video
 *
 * @author      Mike de Boer (mike AT javeline DOT com)
 * @version     %I%, %G%
 * @since       3.0
 */
apf.source = function(struct, tagName){
    this.$init(tagName || "source", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$supportedProperties.push("src", "type");

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode.$addSource)
            this.parentNode.$addSource(this);
    });
}).call(apf.source.prototype = new apf.AmlElement());

apf.aml.setElement("source", apf.source);

// #endif
