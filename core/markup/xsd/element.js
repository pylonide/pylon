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

//#ifdef __WITH_XSDELEMENT
apf.XsdElement = function(struct, tagName){
    this.$init(true);
    
    this.addEventListener("DOMNodeInserted", function(){
        if (!this.parentNode.$compile)
            this.$compile();
    });

    this.addEventListener("DOMNodeRemoved", function(){
        if (!this.parentNode.$compile)
            this.$compile();
    });
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode.$compile)
            return;
        
        var _self = this;
        apf.queue.add("compile" + this.$uniqueId, function(){
            _self.$compile();
        });
    });
}
apf.XsdElement.prototype = new apf.AmlElement();
apf.XsdElement.prototype.$recompile = function(stack){
    if (!this.$amlLoaded)
        return;
    
    if (this.parentNode.$recompile)
        this.parentNode.$recompile();
    else
        this.$compile();
};
//#endif