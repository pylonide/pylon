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
//#ifdef __JSTATE || __INC_ALL

jpf.StateServer = {
    states: {},
    groups: {},
    locs  : {},
    
    removeGroup: function(name, elState){
        this.groups[name].remove(elState);
        if (!this.groups[name].length) {
            self[name].destroy();
            self[name] = null;
            delete this.groups[name];
        }
    },
    
    addGroup: function(name, elState, pNode){
        if (!this.groups[name]) {
            this.groups[name] = [];
            
            var pState = new jpf.state();
            pState.parentNode = pNode;
            pState.inherit(jpf.JmlDom);
            pState.name   = name;
            pState.toggle = function(){
                for (var next = 0, i = 0; i < jpf.StateServer.groups[name].length; i++) {
                    if (jpf.StateServer.groups[name][i].active) {
                        next = i + 1;
                        break;
                    }
                }
                
                jpf.StateServer.groups[name][
                    (next == jpf.StateServer.groups[name].length) ? 0 : next
                  ].activate();
            }
            
            this.groups[name].pState = self[name] = pState;
        }
        
        if (elState)
            this.groups[name].push(elState);
        
        return this.groups[name].pState;
    },
    
    removeState: function(elState){
        delete this.states[elState.name];
    },
    
    addState: function(elState){
        this.states[elState.name] = elState;
    }
}

/**
 * Component that sets the name of a state of the application.
 * This state is set by specifying the state of individual constituants
 * and variables which can be used in dynamic properties of JML components.
 *
 * @classDescription		This class creates a new state
 * @return {State} Returns a new state
 * @type {State}
 * @constructor
 * @addnode global:state
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.state = function(pHtmlNode){
    jpf.register(this, "state", jpf.NODE_HIDDEN);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value){
        this.active = 9999;
        this.setProperty("active", value);
    };
    
    /*this.getValue = function(){
     return this.value;
     }*/
    //this group stuff can prolly be more optimized
    this.activate = function(){
        this.active = 9999;
        this.setProperty("active", true);
    };
    
    this.deactivate = function(){
        this.setProperty("active", false);
    };
    
    /* *********
     INIT
     **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */

    this.$supportedProperties.push("value");
    this.$propHandlers["active"] = function(value){
        //Activate State
        if (jpf.isTrue(value)) {
            if (this.group) {
                var nodes = jpf.StateServer.groups[this.group];
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i] != this && nodes[i].active !== false) 
                        nodes[i].deactivate();
                }
            }
            
            var q = this.$signalElements;
            for (var i = 0; i < q.length; i++) {
                //#ifdef __DEBUG
                if (!self[q[i][0]] || !self[q[i][0]].setProperty) {
                    throw new Error(jpf.formatErrorString(1013, this, "Setting State", "Could not find object to give state: '" + q[i][0] + "' on property '" + q[i][1] + "'"));
                }
                //#endif
                
                self[q[i][0]].setProperty(q[i][1], this[q[i].join(".")]);
            }
            
            if (this.group) {
                var attr = this.jml.attributes;
                for (var i = 0; i < attr.length; i++) {
                    if (attr[i].nodeName.match(/^on|^(?:group|id)$|^.*\..*$/)) 
                        continue;
                    self[this.group].setProperty(attr[i].nodeName,
                        attr[i].nodeValue);
                }
            }
            
            this.dispatchEvent("statechange");
            
            //#ifdef __DEBUG
            jpf.console.info("Setting state '" + this.name + "' to ACTIVE");
            //#endif
        }
        
        //Deactivate State
        else {
            this.setProperty("active", false);
            this.dispatchEvent("statechange");
            
            //#ifdef __DEBUG
            jpf.console.info("Setting state '" + this.name + "' to INACTIVE");
            //#endif
        }
    };
    
    this.$signalElements = [];
    
    this.$loadJml = function(x){
        jpf.StateServer.addState(this);
        
        this.group = x.getAttribute("group");
        if (this.group) 
            jpf.StateServer.addGroup(this.group, this);
        
        if (x.getAttribute("location")) 
            jpf.StateServer.locs[x.getAttribute("location")] = this;
        
        //Properties initialization
        var attr = x.attributes;
        for (var s, i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.match(/^on|^(?:group|id)$/)) 
                continue;
            
            s = attr[i].nodeName.split(".");
            if (s.length == 2) 
                this.$signalElements.push(s);
            
            this[attr[i].nodeName] = attr[i].nodeValue;
        }
    };
    
    this.$destroy = function(){
        this.$signalElements = null;
        jpf.StateServer.removeState(this);
        if (this.group) 
            jpf.StateServer.removeGroup(this.group, this);
    };
};

// #endif
