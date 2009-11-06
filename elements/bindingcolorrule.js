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

//#ifdef __WITH_DATABINDING

/**
 * @todo docs
 */
apf.BindingColorRule = function(struct, tagName){
    this.$init(tagName, apf.NODE_HIDDEN, struct);
};

(function(){
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //@todo This should support multiple color rules, by inserting the rules at the right place.
        if (this.$bindings && this.$bindings.color) {
            var clr = this.$bindings.color[0];
            apf.setStyleRule("." + this.$baseCSSname + (apf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "color", clr.getAttribute("text"), null, this.oWin);
            apf.setStyleRule("." + this.$baseCSSname + (apf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            apf.setStyleRule("." + this.$baseCSSname + (apf.isIE
                ? " .records .highlight"
                : " .records .highlight"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            /*apf.importCssString("." + this.$baseCSSname + " .records div.highlight{background-color:" 
                + clr.getAttribute("row") + ";} ." 
                + this.$baseCSSname + " .records div.highlight span{color:" 
                + clr.getAttribute("text") + ";}");*/
        }
        
        //"." + this.$baseCSSname + " .headings 
        apf.importStylesheet([
          ["." + this.className,
            "width:" + this.$width + (this.$isPercentage ? "%;" : "px;")
            + "text-align:" + h.align],
          ["." + this.className,
            "width:" + this.$width + (this.$isPercentage ? "%;" : "px;")
            + "text-align:" + h.align]
        ]);
        
        this.$draw();
    });
}).call(apf.BindingColorRule.prototype = new apf.BindingRule());

apf.aml.setElement("color", apf.BindingColorRule);
// #endif

