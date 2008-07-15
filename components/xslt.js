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
 * Component displaying the contents of a XSLT transformation on
 * the bound dataset. This component can create a containing element
 * when none is provided.
 *
 * @classDescription		This class creates a new Xslt component
 * @return {Xslt} Returns a new Xslt component
 * @type {Xslt}
 * @constructor
 * @allowchild [cdata]
 * @addnode components:xslt
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.xslt = function(pHtmlNode){
    jpf.register(this, "xslt", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode); 

    // DATABINDING
    this.mainBind = "contents";
    
    // INIT
    this.parse = function(code){
        this.setProperty("value", code);
    }
    
    this.__clear = function(a, b){
        //BUG: WTF? clear gets called before load AND if there is nothing to load but with different args
        //IF YOU CLEAR HERE A REDRAW WITH THE SAME CONTENT WILL FAIL 
        if (b == true) {
            this.oInt.innerHTML = "";//alert(a+"-"+b);
            // WHY . if i dont do this the setProperty loses its update. 
            this.setProperty("value", "");
        }
        //alert(this.uniqueId);
        //this.oInt.innerHTML = "";
    }
    
    this.__supportedProperties = ["value"];
    this.__handlePropSet = function(prop, code){
        switch (prop) {
            case "value":
                if (this.createJml) {
                    if (typeof code == "string") 
                        code = jpf.XMLDatabase.getXml(code);
                    // To really make it dynamic, the objects created should be 
                    // deconstructed and the xml should be attached and detached
                    // of the this.jml xml. 
                    jpf.JMLParser.parseChildren(code, this.oInt, this);
                    if (jpf.JMLParser.inited) 
                        jpf.JMLParser.parseLastPass();
                } else {
                    this.oInt.innerHTML = code;
                }
                break;
            case "width" :
                break;
        }
    }
    
    this.draw = function(){
        //Build Main Skin
        //alert("REDRAW");
        this.oInt = this.oExt = 
            (this.jml.parentNode.lastChild == this.jml.parentNode.firstChild)
            ? pHtmlNode
            : pHtmlNode.appendChild(document.createElement("div"));
        if (this.jml.getAttribute("cssclass")) 
            this.oExt.className = this.jml.getAttribute("cssclass");
    }
    
    this.__loadJML = function(x){
        this.createJml = jpf.isTrue(x.getAttribute("jml"));
        
        var nodes = x.childNodes;
        if (nodes.length) {
            var bind    = x.getAttribute("ref") || ".";
            x.removeAttribute("ref");
            var strBind = "<smartbinding><bindings><contents select='" + bind + "'><xsl:stylesheet version='1.0' xmlns:xsl='http://www.w3.org/1999/XSL/Transform'><xsl:template match='" + bind + "'></xsl:template></xsl:stylesheet></contents></bindings></smartbinding>";
            var xmlNode = jpf.XMLDatabase.getXml(strBind);
            var tNode   = xmlNode.firstChild.firstChild.firstChild.firstChild
            for (var i = 0; i < nodes.length; i++) {
                //if(tNode.ownerDocument.importNode
                tNode.appendChild(nodes[i]);
            }
            
            jpf.JMLParser.addToSbStack(this.uniqueId, new jpf.SmartBinding(null, xmlNode));
        }
    }
}
// #endif
