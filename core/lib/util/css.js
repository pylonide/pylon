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
 
/**
 * This method sets a single css rule 
 * @param {String} name         the css name of the rule (i.e. '.cls' or '#id').
 * @param {String} type         the css property to change.
 * @param {String} value        the css value of the property.
 * @param {String} [stylesheet] the name of the stylesheet to change.
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

/**
 * This method adds one class name to an HTMLElement and removes none or more.
 * @param {HTMLElement} oHtml        the HTMLElement to apply the css class to.
 * @param {String}      className    the name of the css class to apply.
 * @param {Array}       [exclusion]  a list of strings specifying names of css classes to remove.
 * @returns {HTMLElement}
 */ 
jpf.setStyleClass = function(oHtml, className, exclusion, special){
    if (!oHtml || this.disabled) 
        return;

    if (!className) className = " ";

    if (exclusion)
        exclusion.push(className);
    else
        exclusion = [className];

    //Remove defined classes
    var re = new RegExp("(?:(^| +)" + exclusion.join("|") + "($| +))", "gi");
    //var re = new RegExp("(?:(?:^| +)(?:" + exclusion.join("|") + ")(?:$| +))", "gi");

    //#ifdef __DEBUG
    if (oHtml.nodeFunc) {
        throw new Error(jpf.formatErrorString(0, this, 
            "Setting style class",
            "Trying to set style class on jml node. Only xml or html nodes can \
             be passed to this function"));
    }
    //#endif

    //Set new class
    oHtml.className != null 
        ? (oHtml.className = oHtml.className.replace(re, " ") + " " + className)
        : oHtml.setAttribute("class", (oHtml.getAttribute("class") || "")
            .replace(re, " ") + " " + className);

    return oHtml;
};

/**
 * This method imports a css stylesheet from a string 
 * @param {Object} doc        the reference to the document where the css is applied on
 * @param {String} cssString  the css definition 
 * @param {String} media      the media to which this css applies (i.e. 'print' or 'screen')
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
};

/**
 * This method retrieves the current value of a property on a HTML element
 * @param {HTMLElement} el    the element to read the property from
 * @param {String}      prop  the property to read 
 * @returns {String}
 */
jpf.getStyle = function(el, prop) {
    return jpf.hasComputedStyle
        ? window.getComputedStyle(el,'').getPropertyValue(prop)
        : el.currentStyle[prop];
};

/**
 * This method retrieves the current value of a property on a HTML element
 * recursively. If the style isn't found on the element itself, it's parent is
 * checked.
 * @param {HTMLElement} el    the element to read the property from
 * @param {String}      prop  the property to read 
 * @returns {String}
 */
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

/**
 * This method determines if specified coordinates are within the HTMLElement.
 * @param {HTMLElement} el  the element to check
 * @param {Number}      x   the x coordinate in pixels
 * @param {Number}      y   the y coordinate in pixels
 * @returns {Boolean}
 */
jpf.isInRect = function(oHtml, x, y){
    var pos = this.getAbsolutePosition(oHtml);
    if (x < pos[0] || y < pos[1] || x > oHtml.offsetWidth + pos[0] - 10
      || y > oHtml.offsetHeight + pos[1] - 10) 
        return false;
    return true;
};

/**
 * Retrieves the parent which provides the rectangle to which the HTMLElement is
 * bound and cannot escape. In css this is accomplished by having the overflow
 * property set to hidden or auto.
 * @param {HTMLElement} o  the element to check
 * @returns {HTMLElement}
 */
jpf.getOverflowParent = function(o){
    //not sure if this is the correct way. should be tested
    
    o = o.offsetParent;
    while (o && (this.getStyle(o, "overflow") != "hidden"
      || "absolute|relative".indexOf(this.getStyle(o, "position")) == -1)) {
        o = o.offsetParent;
    }
    return o || document.documentElement;
};

/**
 * Retrieves the first parent element which has a position absolute or 
 * relative set.
 * @param {HTMLElement} o  the element to check
 * @returns {HTMLElement}
 */
jpf.getPositionedParent = function(o){
    o = o.offsetParent;
    while (o && o.tagName.toLowerCase() != "body"
      && "absolute|relative".indexOf(this.getStyle(o, "position")) == -1) {
        o = o.offsetParent;
    }
    return o || document.documentElement;
};

/**
 * Retrieves the absolute x and y coordinates, relative to the browsers 
 * drawing area or the specified refParent.
 * @param {HTMLElement} oHtml       the element to check
 * @param {HTMLElement} [refParent] the reference parent
 * @param {Boolean}     [inclSelf]  wether to include the position of the element to check in the return value.
 * @returns {Array} the x and y coordinate of oHtml.
 */
jpf.getAbsolutePosition = function(o, refParent, inclSelf){
    var wt = inclSelf ? 0 : o.offsetLeft, ht = inclSelf ? 0 : o.offsetTop;
    o = inclSelf ? o : o.offsetParent;

    var bw, bh;
    while (o && o != refParent) {//&& o.tagName.toLowerCase() != "html" 
        bw = jpf.isOpera ? 0 : this.getStyle(o, jpf.descPropJs 
            ? "borderLeftWidth" : "border-left-width");
        
        wt += (jpf.isIE && o.currentStyle.borderLeftStyle != "none" && bw == "medium" 
            ? 2 
            : parseInt(bw) || 0) + o.offsetLeft;
        
        bh = jpf.isOpera ? 0 : this.getStyle(o, jpf.descPropJs 
            ? "borderTopWidth" : "border-top-width");
        ht += (jpf.isIE && o.currentStyle.borderTopStyle != "none" && bh == "medium" 
            ? 2 
            : parseInt(bh) || 0) + o.offsetTop;
        
        if (o.tagName.toLowerCase() == "table") {
            ht -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0);
            wt -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0) * 2;
        }
        else if (o.tagName.toLowerCase() == "tr") {
            ht -= (cp = parseInt(o.parentNode.parentNode.cellSpacing));
            while (o.previousSibling) 
                ht -= (o = o.previousSibling).offsetHeight + cp;
        }
        
        o = o.offsetParent;
    }
    
    return [wt, ht];
};
