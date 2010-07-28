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

// #ifdef __AMLLOADER || __INC_ALL

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.loader = function(){
    this.$init("loader", apf.NODE_HIDDEN);
    
    this.show = function(){
        this.$ext.style.display = "block";
    }
    
    this.hide = function(){
        this.$ext.style.display = "none";
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.parentNode.$int)) 
            return;

        this.$ext = apf.insertHtmlNode(null, pHtmlNode, null, (this.$aml 
            ? (this.$aml.serialize ? this.$aml.serialize() : this.$aml.xml)
            : this.serialize()).replace(/^<[^>]*>\s*|\s*<[^>]*>$/g, ""));
        
        if (!apf.loaded) {
            var _self = this;
            apf.addEventListener("load", function(){
                if (apf.config.autoHideLoading) {
                    apf.queue.empty();
                    _self.hide();
                }
            });
        }
    });
};

apf.loader.prototype = new apf.AmlElement();

apf.aml.setElement("loader", apf.loader);

// #endif
