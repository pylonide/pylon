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
// #ifdef __LIVEMARKUP || __INC_ALL

/**
 * Live Markup processor for a processing instruction
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */

apf.LiveMarkupPi = function(){
    //this.$data;
    this.$init();
};

(function(){
    this.mainBind = "data";
    
    this.implement(apf.StandardBinding);

    this.getDocument = function(){
        return this.$data && this.$data.ownerDocument;
    }
    
    this.clear = function(msg){
        if (msg == "loading" && apf.getInheritedAttribute(this, "loading-message")) {
            this.$propHandlers["calcdata"].call(this, "<div class='loading'>Loading...</div>");
            this.calcdata = "";
        }
    }

    this.$propHandlers["calcdata"] = function(data){
        /*if (this.$data) {
            var newXml = apf.getXml("<a:application xmlns:a='" 
              + apf.ns.apf + "'>" + apf.xmlentities(data) + "</a:application>"); //@todo apf3.0 slow, rethink xmlentities
            var oldXml = this.$data;
            apf.xmlDiff(oldXml, newXml);
            
            return;
        }*/

//var dt = new Date().getTime();

        if (this.$data) {
            var nodes = this.$data.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--)
                nodes[i].destroy(true);
        }

        //if (!this.xmlRoot)
            //return this.$int.innerHTML = "loading...";

        if (data && data.indexOf("<a:") > -1) {
            this.$int.innerHTML = "";//data;

            this.$data = this.ownerDocument.$domParser.parseFromString("<a:application xmlns:a='" 
              + apf.ns.apf + "'>" + data + "</a:application>", "text/xml", {
                htmlNode : this.$int
                //nodelay  : true
            }).documentElement;
            
            //apf.queue.empty();
            
            //alert(new Date().getTime() - dt);
        }
        else {
            if (this.$data) {
                var nodes = this.$data.childNodes;
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].destroy(true);
            }
            
            this.$int.innerHTML = data || "";
        }
    };
}).call(apf.LiveMarkupPi.prototype = new apf.AmlProcessingInstruction(true));

apf.aml.setProcessingInstruction("lm", apf.LiveMarkupPi);
apf.aml.setProcessingInstruction("livemarkup", apf.LiveMarkupPi);

// #endif
