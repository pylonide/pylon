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
 
/* ******** BROWSER FEATURES ***********
    Compatibility Methods and functions
**************************************/

/**
* This method sets a single CSS rule 
* @param {String}	name Required CSS name of the rule (i.e. '.cls' or '#id')
* @param {String}	type Required CSS property to change
* @param {String}	value Required CSS value of the property
* @param {String}	stylesheet Optional Name of the stylesheet to change 
* @method
*/	
jpf.setStyleRule = function(name, type, value, stylesheet){
    var rules = document.styleSheets[stylesheet || 0][jpf.styleSheetRules];
    for (var i = 0; i < rules.length; i++) {
        if (rules.item(i).selectorText == name) {
            rules.item(i).style[type] = value;
            return;
        }
    }
};

jpf.setStyleClass = function(oEl, className, exclusion, special){
    if (!oEl || this.disabled) return;
    if (!exclusion)
        exclusion = [];
    exclusion.push(className);

    //Remove defined classes
    var re = new RegExp("(?:(^| +)" + exclusion.join("|") + "($| +))", "gi");

    //Set new class
    oEl.className != null 
        ? (oEl.className = oEl.className.replace(re, " ") + " " + className)
        : oEl.setAttribute("class", (oEl.getAttribute("class") || "")
            .replace(re, " ") + " " + className);

    return oEl;
};

/**
* This method imports a CSS stylesheet from a string 
* @param {Object}	doc Required Reference to the document where the CSS is applied on
* @param {String}	cssString Required String containing the CSS definition 
* @param {String}	media Optional The media to which this CSS applies (i.e. 'print' or 'screen')
* @method
*/
jpf.importCssString = function(doc, cssString, media){
    var htmlNode = doc.getElementsByTagName("head")[0];//doc.documentElement.getElementsByTagName("head")[0];

    //#ifdef __WITH_OPACITY_RUNTIME_FIX
    if (!jpf.supportOpacity) {
        cssString = cssString.replace(/opacity[ \s]*\:[ \s]*([\d\.]+)/g, 
            function(m, m1){
                return "filter:progid:DXImageTransform.Microsoft.Alpha(opacity=" + (m1*100) + ")";
            });
    }
    //#endif

    if (jpf.canCreateStyleNode) {
        //var head  = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.appendChild(document.createTextNode(cssString));
        htmlNode.appendChild(style);
    }
    else {
        htmlNode.insertAdjacentHTML("beforeend", ".<style media='"
         + (media || "all") + "'>" + cssString + "</style>");
        
        /*if(document.body){
            document.body.style.height = "100%";
            setTimeout('document.body.style.height = "auto"');
        }*/
    }
}

/**
* This method retrieves the current value of a property on a HTML element
* @param {HTMLElement}	el Required The element to read the property from
* @param {String}	prop Required The property to read 
* @method
*/
jpf.getStyle = function(el, prop) {
    return jpf.hasComputedStyle
        ? document.defaultView.getComputedStyle(el,'').getPropertyValue(prop)
        : el.currentStyle[prop];
}

jpf.getStyleRecur = function(el, prop) {
    var value = jpf.hasComputedStyle
        ? document.defaultView.getComputedStyle(el,'').getPropertyValue(
            prop.replace(/([A-Z])/g, function(m, m1){
                return "-" + m1.toLowerCase();
            }))
        : el.currentStyle[prop]

    return ((!value || value == "transparent" || value == "inherit")
      && el.parentNode && el.parentNode.nodeType == 1)
        ? this.getStyleRecur(el.parentNode, prop)
        : value;
};