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
// #ifdef __JJSLT || __INC_ALL

/**
 * Element displaying the contents of a jslt transformation on
 * the bound dataset. For more information on jslt see 
 * {@link jsltImplementation}.
 * Example:
 * <code>
 *  <j:jslt model="mdlChat"><![CDATA[
 *      [foreach('message'){]
 *          <strong>[%$'@from'.split("@")[0]] says:</strong> <br />
 *          {text()}<br />
 *      [}]
 *  ]]></j:jslt>
 * </code>
 *
 * @constructor
 * @allowchild [cdata]
 * @addnode elements:jslt
 *
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.jslt = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$hasStateMessages = true;
    this.mainBind = "contents";
    this.focussable = false;
    
    this.parse = function(code){
        this.setProperty("value", code);
    };
    
    /**** Focus ****/
    this.$focus = function(){
        if (!this.oExt)
            return;

        jpf.setStyleClass(this.oExt, this.baseCSSname + "Focus");
    };

    this.$blur = function(){
        if (!this.oExt)
            return;

        jpf.setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };
    
    this.getValue = function(){
        return this.value;
    }
    
    /**
     * @todo please test this.
     */
    this.$clear = function(a, b){
        this.setProperty("value", "");
    };
    
    var lastMsg;
    this.$setClearMessage = this.$updateClearMessage = function(msg){
        jpf.setStyleClass(this.oExt, this.baseCSSname + "Empty");
        
        if (msg) {
            this.oInt.innerHTML = msg;
            lastMsg = this.oInt.innerHTML;
        }
    };

    this.$removeClearMessage = function(){
        jpf.setStyleClass(this.oExt, "", [this.baseCSSname + "Empty"]);
        
        if (this.oInt.innerHTML == lastMsg)
            this.oInt.innerHTML = ""; //clear if no empty message is supported
    };

    this.$booleanProperties["selectable"] = true;
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        if (value)
            this.$removeClearMessage();
        
        if (this.createJml) {
            if (typeof code == "string") 
                code = jpf.xmldb.getXml(code);
            // To really make it dynamic, the objects created should be 
            // deconstructed and the xml should be attached and detached
            // of the this.$jml xml. 
            jpf.JmlParser.parseChildren(value, this.oInt, this);
            if (jpf.JmlParser.inited) 
                jpf.JmlParser.parseLastPass();
        }
        else {
            this.oInt.innerHTML = value;
        }
    };
    
    this.$propHandlers["selectable"] = function(value){
        this.oExt.onselectstart = value 
          ? function(){
              event.cancelBubble = true;
            }
          : null;
    };
    
    this.$draw = function(){
        //Build Main Skin
        this.oInt = this.oExt = jpf.isParsing && jpf.xmldb.isOnlyChild(this.$jml)
            ? this.pHtmlNode 
            : this.pHtmlNode.appendChild(document.createElement("div"));
        this.oExt.host = this;

        if (this.$jml.getAttribute("class")) 
            this.oExt.className = this.$jml.getAttribute("class");
    };
    
    this.$loadJml = function(x){
        this.createJml = jpf.isTrue(x.getAttribute("jml"));
        
        //Events
        var a, i, attr = x.attributes;
        for (i = 0; i < attr.length; i++) {
            a = attr[i];
            if (a.nodeName.indexOf("on") == 0)
                this.addEventListener(a.nodeName, new Function(a.nodeValue));
        }

        if (x.firstChild) {
            var bind = x.getAttribute("ref") || ".";
            x.removeAttribute("ref");
            var strBind = "<smartbinding>\
                <bindings>\
                    <value select='" + bind + "'>\
                        <![CDATA[" + x.firstChild.nodeValue + "]]>\
                    </value>\
                </bindings>\
            </smartbinding>";

            jpf.JmlParser.addToSbStack(this.uniqueId, 
                new jpf.smartbinding(null, jpf.xmldb.getXml(strBind)));
        }
    };
}).implement(
    jpf.DataBinding
);

// #endif
