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
// #ifdef __WITH_LIVEMARKUP || __INC_ALL

/**
 * Live Markup processor for a processing instruction
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 */

apf.LiveMarkupPi = function(){
    //this.$data;
    this.$init();
};

/*
    @todo optimize the pi, possible with this code:
    var div, doc = this.ownerDocument, domParser = doc.$domParser, 
        docFrag = doc.createDocumentFragment(),
        sStart  = "<a:application xmlns:a='" + apf.ns.aml + "'>",
        sEnd    = "</a:application>";
    
    docFrag.$int = div;
    
    domParser.parseFromXml(apf.getXml(sStart + this.$bindingQueue[i] + sEnd), { //@todo might be optimized by doing it only once
        doc        : doc,
        amlNode    : docFrag,
        beforeNode : null,
        include    : true
    });
*/
(function(){
    this.mainBind = "data";
    
    this.implement(apf.StandardBinding);

    this.getDocument = function(){
        return this.$data && this.$data.ownerDocument;
    };
    
    this.clear = function(msg){
        if (msg == "loading" && apf.getInheritedAttribute(this, "loading-message")) {
            this.$propHandlers["calcdata"].call(this, "<span class='loading'>Loading...</span>");
            this.calcdata = "";
        }
    };

    this.$propHandlers["calcdata"] = function(data){
        if (this.$skipChange) //Used by liveedit.js
            return;

        if (this.$data) {
            // #ifdef __WITH_XMLDIFF
            if (this.$useXmlDiff) {
                var newXml = apf.getXml("<a:application xmlns:a='" 
                    + apf.ns.apf + "'>" + apf.xmlentities(data) + "</a:application>", 
                  null, 
                  this.ownerDocument.$domParser.preserveWhiteSpace); //@todo apf3.0 slow, rethink xmlentities
                  
                var oldXml = this.$data;
                apf.xmlDiff(oldXml, newXml);
                
                return;
            }
            //#endif
            
            var nodes = this.$data.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--)
                nodes[i].destroy(true);
        }

        //var dt = new Date().getTime();

        //if (!this.xmlRoot)
            //return this.$ext.innerHTML = "loading...";

        if (typeof data == "string" && data.indexOf("<a:") > -1) { //@todo use the .hasAml attribute
            this.$ext.innerHTML = "";//data;

            var doc = this.ownerDocument.$domParser.parseFromString("<a:application xmlns:a='" 
              + apf.ns.apf + "'>" + data + "</a:application>", "text/xml", {
                htmlNode : this.$ext,
                host     : this
                //nodelay  : true
            })
            this.$data = doc.documentElement;
            
            //apf.queue.empty();
            
            //alert(new Date().getTime() - dt);
        }
        else {
            if (this.$data) {
                var nodes = this.$data.childNodes;
                for (var i = 0; i < nodes.length; i++)
                    nodes[i].destroy(true);
            }
            if (this.$ext)
                this.$ext.innerHTML = data || "";
        }
    };
}).call(apf.LiveMarkupPi.prototype = new apf.AmlProcessingInstruction(true));

apf.aml.setProcessingInstruction("lm", apf.LiveMarkupPi);
apf.aml.setProcessingInstruction("lm-debug", apf.LiveMarkupPi);
apf.aml.setProcessingInstruction("livemarkup", apf.LiveMarkupPi);

// #endif
