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

// #ifdef __JDATASTORE || __INC_ALL
// #define __WITH_DATABINDING 1

/**
 * Non-visual component providing databinding functionality only.
 *
 * @classDescription		This class creates a new datastore
 * @return {Datastore} Returns a new datastore
 * @type {Datastore}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:datastore
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.datastore = function(){
    jpf.register(this, "datastore", jpf.NOGUI_NODE);/** @inherits jpf.Class */

    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode);
    
    this.smartBinding = true;
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.select = function(xpath){
        var obj = (typeof xpath == "string")
            ? this.XMLRoot.selectSingleNode(xpath)
            : xpath;
        this.setConnections(obj, "select");
        this.value = obj;
    }
    
    this.__load = function(){
        this.value = this.sXpath
            ? this.XMLRoot.selectSingleNode(this.sXpath)
            : this.XMLRoot;
        this.setConnections(this.value, "select");
    }
    
    this.__xmlUpdate = function(){};
    
    this.clear = function(){};
    
    this.draw = function(){};
    
    this.__loadJml = function(x){
        if (x.getAttribute("xpath")) 
            this.sXpath = x.getAttribute("xpath");
        
        if (x.getAttribute("load")) {
            var sNode = jpf.getXmlDom("<SmartBinding><Data file='"
                + x.getAttribute("load") + "' /><Bindings /></SmartBinding>").documentElement;
            var dbnode = sNode.selectSingleNode("Bindings");
            
            jpf.JmlParser.addToSbStack(this.uniqueId, sNode);
        }
        
        jpf.JmlParser.parseChildren(x, null, this);
    }
}
// #endif
