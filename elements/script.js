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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.script = function(){
    this.$init("script", apf.NODE_HIDDEN);
};

(function(){
    this.$propHandlers["src"] = function(value){
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
    
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget.nodeType != 1) {
            var code = e.currentTarget.nodeValue;
            
            if (!this.type || this.type == "text/javascript") {
                apf.exec(code);
            }
            else if (this.type == "application/livemarkup"
              || this.type == "application/lm") { //@todo this is wrong, it should start in code mode
                this.$setDynamicProperty("$data", code);
            }
        }
    });
    
    //@todo this should use text node insertion
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var nodes = this.childNodes, s = [];
        for (var i = 0, l = nodes.length; i < l; i++) {
            s[s.length] = nodes[i].nodeValue;
        }
        
        var code = s.join("\n");
        
        if (!this.type || this.type == "text/javascript") {
            apf.exec(code);
        }
        else if (this.type == "application/livemarkup"
          || this.type == "application/lm") { //@todo this is wrong, it should start in code mode
            this.$setDynamicProperty("$data", code);
        }
    });
}).call(apf.script.prototype = new apf.AmlElement());

apf.aml.setElement("script", apf.script);

// #endif
