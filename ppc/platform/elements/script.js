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

// #ifdef __AMLSCRIPT || __INC_ALL

/**
 * This element loads JavaScript into the application.
 * 
 * #### Example
 *
 * ```xml
 *  <a:script src="code.js" />
 * ```
 *
 * #### Example
 *
 * ```xml
 *  <a:script>//<!-- 
 *      for (var i = 0; i < 2; i++) {
 *          alert(i);
 *      }
 *  //--></a:script>
 * ```
 *
 * @class ppc.script
 * @inherits ppc.AmlElement
 * @define script
 * @logic
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 */
/**
 * @attribute {String} src the location of the script file.
 *
 *
 */
ppc.script = function(){
    this.$init("script", ppc.NODE_HIDDEN);
};

(function(){
    this.$propHandlers["src"] = function(value){
        if (!this.type)
            this.type = this.getAttribute("type");

        if (!this.type || this.type == "text/javascript") {
            if (ppc.isOpera) {
                $setTimeout(function(){
                    ppc.window.loadCodeFile(ppc.hostPath
                        + value);
                }, 1000);
            }
            else {
                ppc.window.loadCodeFile(ppc.getAbsolutePath(ppc.hostPath,
                    value));
            }
        }
        else {
            var _self = this;
            ppc.ajax(value, {callback: function(data, state, extra){
                if (state != ppc.SUCCESS) {
                    return ppc.console.warn("Could not load script " + value);
                }
                
                _self.$execute(data);
            }});
        }
    }
    
    this.$execute = function(code, e){
        if (!this.type || this.type == "text/javascript") {
            ppc.jsexec(code);
        }
        else if (this.type.indexOf("livemarkup") > -1
          || this.type.indexOf("lm") > -1) { //@todo this is wrong, it should start in code mode
            var func = ppc.lm.compile(code, {event: true, parsecode: true, funcglobal: true, nostring: true});
            func(e || {});
        }
    }
    
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget.nodeType == 3 || e.currentTarget.nodeType == 4) {
            this.$execute(e.currentTarget.nodeValue, ppc.isIE && window.event);
        }
    });
    
    //@todo this should use text node insertion
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var nodes = this.childNodes, s = [];
        for (var i = 0, l = nodes.length; i < l; i++) {
            s[s.length] = nodes[i].nodeValue;
        }
        
        var code = s.join("\n");
        
        this.$execute(code);
    });
}).call(ppc.script.prototype = new ppc.AmlElement());

ppc.aml.setElement("script", ppc.script);

// #endif
