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
 * element that loads javascript into the application
 * either from it's first child or from a file.
 * Example:
 * <code>
 *  <a:script src="code.js" />
 * </code>
 * Example:
 * <code>
 *  <a:script>//<!-- 
 *      for (var i = 0; i < 2; i++) {
 *          alert(i);
 *      }
 *  //--></a:script>
 * </code>
 * @attribute {String} src the location of the script file.
 * @addnode global, anyaml
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.script = function(){
    this.$init("script", apf.NODE_HIDDEN);
};

(function(){
    this.$propHandlers["src"] = function(value){
        if (!this.type)
            this.type = this.getAttribute("type");

        if (!this.type || this.type == "text/javascript") {
            if (apf.isOpera) {
                $setTimeout(function(){
                    apf.window.loadCodeFile(apf.hostPath
                        + value);
                }, 1000);
            }
            else {
                apf.window.loadCodeFile(apf.getAbsolutePath(apf.hostPath,
                    value));
            }
        }
        else {
            var _self = this;
            apf.ajax(value, {callback: function(data, state, extra){
                if (state != apf.SUCCESS) {
                    return apf.console.warn("Could not load script " + value);
                }
                
                _self.$execute(data);
            }});
        }
    }
    
    this.$execute = function(code, e){
        if (!this.type || this.type == "text/javascript") {
            apf.jsexec(code);
        }
        else if (this.type.indexOf("livemarkup") > -1
          || this.type.indexOf("lm") > -1) { //@todo this is wrong, it should start in code mode
            var func = apf.lm.compile(code, {event: true, parsecode: true, funcglobal: true, nostring: true});
            func(e || {});
        }
    }
    
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget.nodeType == 3 || e.currentTarget.nodeType == 4) {
            this.$execute(e.currentTarget.nodeValue, apf.isIE && window.event);
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
}).call(apf.script.prototype = new apf.AmlElement());

apf.aml.setElement("script", apf.script);

// #endif
