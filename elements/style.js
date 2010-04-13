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

// #ifdef __AMLSTYLE || __INC_ALL

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.style = function(struct, tagName){
    this.$init(tagName || "style", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$focussable = false;
    
    this.$propHandlers["src"] = function(value){
        apf.getData(value, {
            callback : function(data, state){
                if (state == apf.SUCCESS) {
                    apf.importCssString(data);
                }
            }
        });
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.type != "text/chartcss" && this.firstChild)
            apf.importCssString(this.firstChild.nodeValue);
    });
}).call(apf.style.prototype = new apf.AmlElement());

apf.aml.setElement("style", apf.style);
apf.xhtml.setElement("style",  apf.style);

// #endif