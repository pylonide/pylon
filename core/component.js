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

// #ifdef __WITH_COMPONENT || __INC_ALL

/**
 * This function tries to simplify the development of new JML elements.
 * Creating a new element for JPF may now be as easy as:
 * Example:
 * <code language="javascript">
 * // create a new JML component: <j:foo />
 * apf.foo = apf.component(apf.NODE_VISIBLE, {
 *     // component body (method and property declaration)
 * }).implement(apf.barInterface);
 * </code>
 * 
 * @classDescription         This class serves as a baseclass for new elements
 * @param  {Number} nodeFunc A number constant, defining the type of element
 * @param  {mixed}  oBase    May be a function (will be instantiated) or object to populate the elements' prototype
 * @return {Element}       Returns a Function that will serve as the elements' constructor
 * @type   {Element}
 * @constructor
 * 
 * Note: we REALLY don't care about execution speed for this one! It will be
 * optimized by reformatting it using Jaw (compile-time), like C-style macros.
 * *sigh* don't worry, this implementation is still blazing fast and has been
 * profiled and optimized in all major browsers.
 * 
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @private
 */

apf.component = function(nodeFunc, oBase) {
    // the actual constructor for the new comp (see '__init()' below).
    var fC = function() {
        this.$init.apply(this, arguments);
    };
    
    // if oBase is provided, apply it as a prototype of the new comp.
    if (oBase) {
        // a function will be deferred to instantiation of the comp. to be implemented
        if (typeof oBase == "function")
            fC.prototype.base = oBase;
        else
            fC.prototype = oBase;
    }

    // the 'nodeFunc' flag specifies the function that a node/ component represents
    // within JPF.
    fC.prototype.nodeFunc = nodeFunc || apf.NODE_HIDDEN;

    // #ifdef __DESKRUN
    // deprecated Deskrun feature
    if (nodeFunc == apf.NODE_MEDIAFLOW)
        DeskRun.register(fC.prototype);
    // #endif

    // The implement function is copied from 'apf.implement'
    fC.prototype.implement = apf.implement;

    // If the '$init' function is not present yet, we shall define it - the
    // starting engine of a JPF component
    if (typeof fC.prototype['$init'] != "function") {
        var aImpl = [];
        /**
         * The developer may supply interfaces that will inherited upon element
         * instantiation with implement() below. Calls to 'implement()' may be
         * chained.
         * Note: duplicate interfaces will not be filtered out! This means that
         *       only the interface that was provided with implement() will be
         *       actually implemented.
         * 
         * @private
         */
        fC.implement = function() {
            aImpl = aImpl.concat(Array.prototype.slice.call(arguments));
            return fC;
        }
        
        /**
         * Even though '$init()' COULD be overridden, it is still the engine
         * for every new element. It takes care of the basic inheritance
         * difficulties and created the necessary hooks with the Ajax.org Platform.
         * Note: a developer can still use 'init()' as the function to execute
         *       upon instantiation, while '$init()' is used by JPF.
         * 
         * @param {Object} pHtmlNode
         * @param {Object} sName
         * @type void
         */
        fC.prototype.$init = function(pHtmlNode, sName){
            if (typeof sName != "string") 
                throw new Error(apf.formatErrorString(0, this, 
                "Error creating component",
                "Dependencies not met, please provide a component name when \
                 instantiating it (ex.: new apf.tree(oParent, 'tree') )"));

            this.tagName       = sName;
            this.pHtmlNode     = pHtmlNode || document.body;
            this.pHtmlDoc      = this.pHtmlNode.ownerDocument;
            
            this.uniqueId      = apf.all.push(this) - 1;
            
            //Oops duplicate code.... (also in apf.register)
            this.$propHandlers = {}; //@todo fix this in each component
            this.$domHandlers  = {
                "remove"      : [],
                "insert"      : [],
                "reparent"    : [],
                "removechild" : []
            };
            
            if (nodeFunc != apf.NODE_HIDDEN) {
                if (typeof this.$focussable == "undefined")
                    this.$focussable = apf.KEYBOARD_MOUSE; // Each GUINODE can get the focus by default
                
                this.$booleanProperties = {
                    //#ifdef __WITH_KEYBOARD
                    "disable-keyboard" : true,
                    //#endif
                    "visible"          : true,
                    "focussable"       : true
                    //"disabled"         : true
                };
                
                this.$supportedProperties = [
                    //#ifdef __WITH_INTERACTIVE
                    "draggable", "resizable",
                    //#endif
                    "focussable", "zindex", "disabled", "tabindex",
                    "disable-keyboard", "contextmenu", "visible", "autosize", 
                    "loadjml", "actiontracker", "alias"];
            } 
            else {
                this.$booleanProperties   = {}; //@todo fix this in each component
                this.$supportedProperties = []; //@todo fix this in each component
            }
            
            /** 
             * @inherits apf.Class
             * @inherits apf.JmlElement
             */
            // the ORDER is crucial here.
            this.implement(apf.Class);
            this.implement.apply(this, aImpl);
            this.implement(apf.JmlElement, this.base || apf.K);
            
            if (typeof this['init'] == "function")
                this.init();
        }
    }
    
    return fC;
};

/**
 * This is code to construct a subnode, these are simpler and almost
 * have no inheritance
 */
apf.subnode = function(nodeFunc, oBase) {
    // the actual constructor for the new comp (see '__init()' below).
    var fC = function() {
        this.$init.apply(this, arguments);
    };
    
    // if oBase is provided, apply it as a prototype of the new comp.
    if (oBase) {
        // a function will be deferred to instantiation of the comp. to be implemented
        if (typeof oBase == "function")
            fC.prototype.base = oBase;
        else
            fC.prototype = oBase;
    }

    fC.prototype.nodeFunc = nodeFunc || apf.NODE_HIDDEN;

    fC.prototype.implement  = apf.implement;

    if (typeof fC.prototype['$init'] != "function") {
        var aImpl = [];
        /**
         * The developer may supply interfaces that will implemented upon element
         * instantiation with implement() below. Calls to 'implement()' may be
         * chained.
         * 
         * @private
         */
        fC.implement = function() {
            aImpl = aImpl.concat(Array.prototype.slice.call(arguments));
            return fC;
        }
        
        /**
         * Even though '__init()' COULD be overridden, it is still the engine
         * for every new element. It takes care of the basic inheritance
         * difficulties and created the necessary hooks with the Ajax.org Platform.
         * Note: a developer can still use 'init()' as the function to execute
         *       upon instantiation, while '__init()' is used by JPF.
         * 
         * @param {Object} pHtmlNode
         * @param {Object} sName
         * @param {Object} parentNode
         * @type void
         */
        fC.prototype.$init = function(pHtmlNode, sName, parentNode){
            if (typeof sName != "string") 
                throw new Error(apf.formatErrorString(0, this, 
                    "Error creating component",
                    "Dependencies not met, please provide a component name when \
                     instantiating it (ex.: new apf.tree(oParent, 'tree') )"));

            this.tagName      = sName;
            this.pHtmlNode    = pHtmlNode || document.body;
            this.pHtmlDoc     = this.pHtmlNode.ownerDocument;
            this.parentNode   = parentNode;
            this.$domHandlers = {
                "remove"      : [],
                "insert"      : [],
                "reparent"    : [],
                "removechild" : []
            };
            
            this.uniqueId     = apf.all.push(this) - 1;
            
            /** 
             * @inherits apf.Class
             */
            // the ORDER is crucial here.
            this.implement(apf.Class);
            this.implement.apply(this, aImpl);
            this.implement(apf.JmlDom, this.base || apf.K);
            
            if (typeof this['init'] == "function")
                this.init();
        }
    }
    
    return fC;
};

// #endif
