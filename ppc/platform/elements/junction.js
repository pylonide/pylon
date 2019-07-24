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

// #ifdef __AMLCOMMENT || __INC_ALL

/**
 * A symbolic link to an AML element. The visibility of this element determines
 * the true parent of the references AML element. Multiple junctions will compete
 * to determine the parent. Make sure only one junction reference is visible
 * at the same time.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.junction = function(){
    this.$init("junction", apf.NODE_HIDDEN);
};

(function(){
    this.$focussable = false;
    
    this.autoshow = true;
    
    /**
     * @attribute {String} for
     * @attribute {String} autoshow
     */
    this.$booleanProperties["autoshow"] = true;
    
    this.$propHandlers["for"] = function(value){
        if (this.$amlLoaded) //@todo remove vManager
            init.call(this);
    }
    
    function init(e){
        var _self = this;
        if (apf.window.vManager.permanent(this.parentNode, function(){
            //Show
            _self.$reparent();
        }, function(){
            //Hide
            
        })) {
            this.$reparent();
        }
    }
    
    this.$reparent = function(){
        var amlNode = self[this["for"]];
        if (!amlNode)
            return; //@todo warn?
        
        if (this.autoshow)
            amlNode.show();
        
        this.parentNode.insertBefore(amlNode, this);
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", init);
}).call(apf.junction.prototype = new apf.AmlElement());

apf.aml.setElement("junction", apf.junction);

// #endif
