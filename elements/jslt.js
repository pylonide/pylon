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
 * the bound data. For more information on jslt see 
 * {@link core.jsltimplementation}.
 * Example:
 * <code>
 *  <a:jslt model="mdlChat"><![CDATA[
 *      [foreach('message'){]
 *          <strong>[%$'@from'.split("@")[0]] says:</strong> <br />
 *          {text()}<br />
 *      [}]
 *  ]]></a:jslt>
 * </code>
 *
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
apf.jslt = apf.component(apf.NODE_VISIBLE, function(){
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

        apf.setStyleClass(this.oExt, this.baseCSSname + "Focus");
    };

    this.$blur = function(){
        if (!this.oExt)
            return;

        apf.setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
    };
    
    this.getValue = function(){
        return this.value;
    }
    
    var lastMsg, lastClass, changedHeight;
    this.$setClearMessage = this.$updateClearMessage = function(msg, className){
        if (lastClass)
            this.$removeClearMessage();
        apf.setStyleClass(this.oExt, 
            (lastClass = this.baseCSSname + (className || "Empty").uCaseFirst()));//"Empty"); //@todo move to setClearMessage
        
        if (msg) {
            if (this.oInt.offsetHeight 
              && apf.getStyle(this.oInt, "height") == "auto" 
              && (changedHeight = true))
                this.oInt.style.height = (this.oInt.offsetHeight 
                  - apf.getHeightDiff(this.oInt)) + "px";
            this.oInt.innerHTML = msg;
            lastMsg = this.oInt.innerHTML;
        }
    };

    this.$removeClearMessage = function(){
        if (lastClass) {
            apf.setStyleClass(this.oExt, "", [lastClass]);
            lastClass = null;
        }
        
        if (this.oInt.innerHTML == lastMsg) {
            if (changedHeight && !(changedHeight = false))
                this.oInt.style.height = "";
            this.oInt.innerHTML = ""; //clear if no empty message is supported
        }
    };

    this.$booleanProperties["selectable"]      = true;
    this.$supportedProperties.push("value");
    this.$propHandlers["value"] = function(value){
        if (value)
            this.$removeClearMessage();
        
        if (this.createAml) {
            if (typeof value == "string")
                value = apf.xmldb.getXml(value);
            // To really make it dynamic, the objects created should be 
            // deconstructed and the xml should be attached and detached
            // of the this.$aml xml. 
            apf.AmlParser.parseChildren(value, this.oInt, this);
            if (apf.AmlParser.inited) 
                apf.AmlParser.parseLastPass();
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
        this.oInt = this.oExt = apf.isParsing && apf.isOnlyChild(this.$aml)
            ? this.pHtmlNode 
            : this.pHtmlNode.appendChild(document.createElement("div"));
        this.oExt.host = this;

        this.baseCSSname = this.oExt.className = 
            (this.$aml.getAttribute("class") || "jslt");
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

            apf.AmlParser.addToSbStack(this.uniqueId, 
                new apf.smartbinding(null, apf.xmldb.getXml(strBind)));
        }
    };
}).implement(
    apf.DataBinding
);

// #endif
