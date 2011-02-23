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

// #ifdef __AMLBAR || __INC_ALL

/**
 * Element displaying a skinnable rectangle which can contain other 
 * aml elements. This element is used by other elements such as the 
 * toolbar and statusbar element to specify sections within those elements
 * which in turn can contain other aml elements.
 * Remarks:
 * This component is used in the accordion element to create its sections. In
 * the statusbar the panel element is an alias of bar.
 *
 * @constructor
 *
 * @define bar, panel, menubar
 * @attribute {String} icon the url pointing to the icon image.
 * @attribute {Boolean} collapsed   collapse panel on load, default is false
 * Possible values:
 *     true    panel is collapsed
 *     false   panel is not collapsed
 * @attribute {String} title   describes content in panel
 * @allowchild button
 * @allowchild {elements}, {anyaml}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.splitbutton = function(struct, tagName){
    this.$init(tagName || "splitbutton", apf.NODE_VISIBLE, struct);
};

(function(){
    this.$focussable = false;
    
    this.$propHandlers["caption"] = function(value) {
        this.$button1.setProperty("caption", value);
    }
    
    this.$propHandlers["icon"] = function(value) {
        this.$button1.setProperty("icon", value);
    }

    this.$propHandlers["disabled"] = function(value) {
        this.$button1.setProperty("disabled", value);
        this.$button2.setProperty("disabled", value);
    }
    
    this.$propHandlers["submenu"] = function(value) {
        this.$button2.setProperty("submenu", value);
        var _self = this;
        self[value].addEventListener("display", function() {
            this.$ext.style.marginLeft = "-" + _self.$button1.$ext.offsetWidth + "px";
        });
    }
    
    this.$draw = function(){
        var _self = this;
        this.$ext = this.$pHtmlNode.appendChild(document.createElement("div"));
        this.$ext.style.overflow = "hidden";
        //this.$ext.style.position = "relative";
        
        var skin = this.getAttribute("skin") || this.localName;
        
        this.$button1 = new apf.button({
            htmlNode: this.$ext,
            parentNode: this,
            skin: skin,
            "class": "main",
            onmouseover: function() {
                apf.setStyleClass(this.$ext, "primary");
                _self.$button2.$setState("Over", {});
            },
            onmouseout: function() {
                apf.setStyleClass(this.$ext, "", ["primary"]);
                _self.$button2.$setState("Out", {});
            },
            onclick: function(e) {
                _self.dispatchEvent("click");
            }
        });
        
        this.$button2 = new apf.button({
            htmlNode: this.$ext,
            parentNode: this,
            skin: skin,
            "class": "arrow",
            onmouseover: function() {
                apf.setStyleClass(this.$ext, "primary");
                _self.$button1.$setState("Over", {});
            },
            onmouseout: function() {
                if(!_self.$button2.value) {
                    apf.setStyleClass(this.$ext, "", ["primary"]);
                    _self.$button1.$setState("Out", {});
                }
                else {
                    apf.setStyleClass(this.$ext, "primary");
                    _self.$button1.$setState("Over", {});
                }
            }
        });
    };

    this.$loadAml = function(x){
        
    };
    
}).call(apf.splitbutton.prototype = new apf.GuiElement());

apf.aml.setElement("splitbutton",  apf.splitbutton);

// #endif
