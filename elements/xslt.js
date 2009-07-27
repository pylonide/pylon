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
// #ifdef __JXSLT || __INC_ALL

/**
 * Element displaying the contents of an xslt transformation on
 * the bound data. 
 *
 * @todo please test this, especially the clear function.
 * @constructor
 * @allowchild [cdata]
 * @addnode elements:jslt
 *
 * @inherits apf.DataBinding
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.xslt = apf.component(apf.NODE_VISIBLE, function(){
    this.$hasStateMessages = true;
    this.$allowSelect = true;
    
    // INIT
    this.parse = function(code){
        this.setProperty("value", code);
    };
    
    this.$clear = function(a, b){
        if (b == true) {
            this.oInt.innerHTML = "";//alert(a+"-"+b);
            this.setProperty("value", "");
        }
    };
    
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(code){
        if (this.createAml) {
            if (typeof code == "string") 
                code = apf.xmldb.getXml(code);
            // To really make it dynamic, the objects created should be 
            // deconstructed and the xml should be attached and detached
            // of the this.$aml xml. 
            apf.AmlParser.parseChildren(code, this.oInt, this);
            if (apf.AmlParser.inited) 
                apf.AmlParser.parseLastPass();
        }
        else {
            this.oInt.innerHTML = code;
        }
    };
    
    this.$draw = function(){
        //Build Main Skin
        //alert("REDRAW");
        this.oInt = this.oExt = (this.$aml.parentNode.lastChild == this.$aml.parentNode.firstChild)
            ? this.pHtmlNode
            : this.pHtmlNode.appendChild(document.createElement("div"));
        if (this.$aml.getAttribute("cssclass")) 
            this.oExt.className = this.$aml.getAttribute("cssclass");
    };
    
    this.$loadAml = function(x){
        this.createAml = apf.isTrue(x.getAttribute("aml"));
        
        //Events
        var a, i, attr = x.attributes;
        for (i = 0; i < attr.length; i++) {
            a = attr[i];
            if (a.nodeName.indexOf("on") == 0)
                this.addEventListener(a.nodeName, new Function(a.nodeValue));
        }

        var nodes = x.childNodes;
        if (nodes.length) {
            var bind = x.getAttribute("ref") || ".";
            x.removeAttribute("ref");
            //<xsl:stylesheet version='1.0' xmlns:xsl='http://www.w3.org/1999/XSL/Transform'><xsl:template match='" 
                //+ bind + "'></xsl:template></xsl:stylesheet>
            var strBind = "<smartbinding xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>\
                <bindings><value select='" + bind + "'>\
                </value></bindings></smartbinding>";
            
            var xmlNode = apf.xmldb.getXml(strBind);
            var pNode = xmlNode.firstChild.firstChild;//.firstChild.firstChild
            for (var i = nodes.length - 1; i >= 0; i--)
                pNode.appendChild(nodes[i]);
            
            apf.AmlParser.addToSbStack(this.uniqueId, new apf.smartbinding(null, xmlNode));
        }
    };
}).implement(
    apf.DataBinding
);
// #endif
