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

// #ifdef __WITH_STYLE

/**
 * This method sets a single css rule
 * @param {String} name         the css name of the rule (i.e. '.cls' or '#id').
 * @param {String} type         the css property to change.
 * @param {String} value        the css value of the property.
 * @param {String} [stylesheet] the name of the stylesheet to change.
 */
apf.setStyleRule = function(name, type, value, stylesheet, win){
    name = name.toLowerCase();
    
    if (!stylesheet) {
        var sheets = (win || self).document.styleSheets;
        for (var j = sheets.length - 1; j >= 0; j--) {
            try {
                var rules = sheets[j][apf.styleSheetRules];
                for (var i = 0; i < rules.length; i++) {
                    if (rules.item(i).selectorText.toLowerCase() == name) {
                        rules.item(i).style[type] = value;
                        return true;
                    }
                }
            }
            catch(e){}
        }
    }
    else {
        var rules = (win || self).document.styleSheets[stylesheet || 0][apf.styleSheetRules];
        for (var i = 0; i < rules.length; i++) {
            if (rules.item(i).selectorText.toLowerCase() == name) {
                rules.item(i).style[type] = value;
                return true;
            }
        }
    }
    
    return false;
};

/**
 * This method gets a single css rule
 * @param {String} name         the css name of the rule (i.e. '.cls' or '#id').
 * @param {String} type         the css property to change.
 * @param {String} [stylesheet] the name of the stylesheet to change.
 */
apf.getStyleRule = function(name, type, stylesheet, win){
    name = name.toLowerCase();
    
    if (!stylesheet) {
        var sheets = (win || self).document.styleSheets;
        for (var j = sheets.length - 1; j >= 0; j--) {
            try {
                var rules = sheets[j][apf.styleSheetRules];
                for (var i = 0; i < rules.length; i++) {
                    if (rules.item(i).selectorText.toLowerCase() == name) {
                        return rules.item(i).style[type];
                    }
                }
            }
            catch(e){}
        }
    }
    else {
        var rules = (win || self).document.styleSheets[stylesheet || 0][apf.styleSheetRules];
        for (var i = 0; i < rules.length; i++) {
            if (rules.item(i).selectorText.toLowerCase() == name) {
                return rules.item(i).style[type];
            }
        }
    }
    
    return false;
}

/**
 * This method adds one class name to an HTMLElement and removes none or more.
 * @param {HTMLElement} oHtml        the HTMLElement to apply the css class to.
 * @param {String}      className    the name of the css class to apply.
 * @param {Array}       [exclusion]  a list of strings specifying names of css classes to remove.
 * @returns {HTMLElement}
 */
apf.setStyleClass = function(oHtml, className, exclusion, userAction){
    if (!oHtml || userAction && this.disabled)
        return;

    //#ifdef __DEBUG
    if (oHtml.nodeFunc) {
        throw new Error(apf.formatErrorString(0, this,
            "Setting style class",
            "Trying to set style class on aml node. Only xml or html nodes can \
             be passed to this function"));
    }
    //#endif

    if (className) {
        if (exclusion)
            exclusion[exclusion.length] = className;
        else
            exclusion = [className];
    }

    //Create regexp to remove classes
    //var re = new RegExp("(?:(^| +)" + (exclusion ? exclusion.join("|") : "") + "($| +))", "gi");
    var re = new RegExp("(^| +)(?:" + (exclusion ? exclusion.join("|") : "") + ")", "gi");

    //Set new class
    oHtml.className != null
        ? (oHtml.className = oHtml.className.replace(re, " ") + (className ? " " + className : ""))
        : oHtml.setAttribute("class", (oHtml.getAttribute("class") || "")
            .replace(re, " ") + (className ? " " + className : ""));

    return oHtml;
};

/**
 * This method imports a css stylesheet from a string
 * @param {String} cssString  the css definition
 * @param {Object} [doc]      the reference to the document where the css is applied on
 * @param {String} [media]    the media to which this css applies (i.e. 'print' or 'screen')
 */
apf.importCssString = function(cssString, doc, media){
    doc = doc || document;
    var htmlNode = doc.getElementsByTagName("head")[0];//doc.documentElement.getElementsByTagName("head")[0];

    //#ifdef __WITH_OPACITY_RUNTIME_FIX
    if (!apf.supportOpacity) {
        cssString = cssString.replace(/opacity[ \s]*\:[ \s]*([\d\.]+)/g,
            function(m, m1){
                return "filter:progid:DXImageTransform.Microsoft.Alpha(opacity=" + (m1*100) + ")";
            });
    }
    //#endif

    if (apf.canCreateStyleNode) {
        //var head  = document.getElementsByTagName("head")[0];
        var style = doc.createElement("style");
        style.appendChild(doc.createTextNode(cssString));
        if (media)
            style.setAttribute('media', media);
        htmlNode.appendChild(style);
    }
    else {
        htmlNode.insertAdjacentHTML("beforeend", ".<style media='"
         + (media || "all") + "'>" + cssString + "</style>");

        /*if(document.body){
            document.body.style.height = "100%";
            $setTimeout('document.body.style.height = "auto"');
        }*/
    }
};

/**
 * This method retrieves the current value of a property on a HTML element
 * recursively. If the style isn't found on the element itself, it's parent is
 * checked.
 * @param {HTMLElement} el    the element to read the property from
 * @param {String}      prop  the property to read
 * @returns {String}
 */
apf.getStyleRecur = function(el, prop) {
    var value = apf.hasComputedStyle
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
 * This method imports a stylesheet defined in a multidimensional array 
 * @param {Array}    def Required Multidimensional array specifying 
 * @param {Object}    win Optional Reference to a window
 * @method
 * @deprecated
 */    
apf.importStylesheet = function (def, win) {
    if (!def.length)
        return;
        
    var re = new RegExp("^" + document.domain, 'g');
    var doc = (win || window).document;
    for (var index=0; index < document.styleSheets.length; index++) {
        if (!doc.styleSheets[index].href || doc.styleSheets[index].href.match(re)) {
            break;
        }
    }
    var styleSheet = doc.styleSheets[index];
    
    if (!styleSheet) {
        if (doc.createStyleSheet)
            styleSheet = doc.createStyleSheet();
        else {
            var elem = doc.createElement("style");
            elem.type = "text/css";
            doc.getElementsByTagName("head")[0].appendChild(elem);
            styleSheet = elem.sheet;
        }
    }    
    
    for (var i = 0; i < def.length; i++) {
        if (!def[i][1]) continue;
        
        if (apf.isIE)
            styleSheet.addRule(def[i][0], def[i][1]);
        else
            styleSheet.insertRule(def[i][0] + " {" + def[i][1] + "}", 0);
    }
}

/**
 * This method determines if specified coordinates are within the HTMLElement.
 * @param {HTMLElement} el  the element to check
 * @param {Number}      x   the x coordinate in pixels
 * @param {Number}      y   the y coordinate in pixels
 * @returns {Boolean}
 */
apf.isInRect = function(oHtml, x, y){
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
apf.getOverflowParent = function(o){
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
apf.getPositionedParent = function(o){
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
 * @param {HTMLElement} o           the element to check
 * @param {HTMLElement} [refParent] the reference parent
 * @param {Boolean}     [inclSelf]  whether to include the position of the element to check in the return value.
 * @returns {Array} the x and y coordinate of oHtml.
 */
apf.getAbsolutePosition = function(o, refParent, inclSelf){
    if ("getBoundingClientRect" in document.documentElement) { 
        if (apf.doesNotIncludeMarginInBodyOffset && o == document.body) {
            return [
                o.offsetLeft + (parseFloat(apf.getStyle(o, "marginLeft")) || 0),
                  + (o.scrollLeft || 0),
                o.offsetTop  + (parseFloat(apf.getStyle(o, "marginTop")) || 0)
                  + (o.scrollTop || 0)
            ];
        }
        
        var box  = o.getBoundingClientRect(), 
            top  = box.top,
            left = box.left,
            corr = (apf.isIE && apf.isIE < 8);

        if (refParent && refParent != document.body) {
            var pos = apf.getAbsolutePosition(refParent, null, true);
            top -= pos[1];
            left -= pos[0];
        }
        
        if (!(apf.isIE && o == document.documentElement)) {
            left += (refParent || document.body).scrollLeft || document.documentElement.scrollLeft || 0;
            top  += (refParent || document.body).scrollTop  || document.documentElement.scrollTop  || 0;
        }
        
        if (inclSelf && !refParent) {
            left += parseInt(apf.getStyle(o, "borderLeftWidth")) || 0
            top  += parseInt(apf.getStyle(o, "borderTopWidth")) || 0;
        }

        return [left - (corr ? 2 : 0), top - (corr ? 2 : 0)];
    }
    
    //@todo code below might be deprecated one day
    var wt = inclSelf ? 0 : o.offsetLeft, ht = inclSelf ? 0 : o.offsetTop;
    o = inclSelf ? o : o.offsetParent || o.parentNode ;

    if (apf.isIE8 && refParent) {
        bw = this.getStyle(o, "borderLeftWidth");
        wt -= (apf.isIE && o.currentStyle.borderLeftStyle != "none" 
          && bw == "medium" ? 2 : parseInt(bw) || 0);
        bh = this.getStyle(o, "borderTopWidth");
        ht -= (apf.isIE && o.currentStyle.borderTopStyle != "none" 
          && bh == "medium" ? 2 : parseInt(bh) || 0);
    }

    var bw, bh, fl;
    while (o && o != refParent) {//&& o.tagName.toLowerCase() != "html"
        //Border - Left
        bw = apf.isOpera || apf.isIE8 ? 0 : this.getStyle(o, "borderLeftWidth");

        wt += (apf.isIE && o.currentStyle.borderLeftStyle != "none" && bw == "medium"
            ? 2
            : parseInt(bw) || 0) + o.offsetLeft;

        if (apf.isIE && !apf.isIE8 && apf.getStyle(o, "styleFloat") == "none" 
          && apf.getStyle(o, "position") == "relative") {
            var q = o.previousSibling;
            while (q) {
                if (q.nodeType == 1) {
                    fl = apf.getStyle(q, "styleFloat");
                    if (fl == "left") {
                        wt -= parseInt(apf.getStyle(o, "marginLeft")) 
                            || 0;//-1 * (o.parentNode.offsetWidth - o.offsetWidth)/2; //assuming auto
                        break;
                    }
                    else if (fl == "right")
                        break;
                }
                q = q.previousSibling;
            }
        }

        //Border - Top
        bh = apf.isOpera || apf.isIE8 ? 0 : this.getStyle(o, "borderTopWidth");
        ht += (apf.isIE && o.currentStyle.borderTopStyle != "none" && bh == "medium"
            ? 2
            : parseInt(bh) || 0) + o.offsetTop;

        //Scrolling
        if (!apf.isGecko && o != refParent && (o.tagName != "HTML" || o.ownerDocument != document)) {
            wt -= o.scrollLeft;
            ht -= o.scrollTop;
        }
        
        //Table support
        if (o.tagName.toLowerCase() == "table") {
            ht -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0);
            wt -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0) * 2;
        }
        else if (o.tagName.toLowerCase() == "tr") {
            var cp;
            ht -= (cp = parseInt(o.parentNode.parentNode.cellSpacing));
            while (o.previousSibling)
                ht -= (o = o.previousSibling).offsetHeight + cp;
        }

        if (apf.isIE && !o.offsetParent && o.parentNode.nodeType == 1) {
            wt -= o.parentNode.scrollLeft;
            ht -= o.parentNode.scrollTop;
        }

        o = o.offsetParent;
    }

    return [wt, ht];
};

//@todo its much faster to move these to browser specific files and eliminate apf.getStyle()
apf.getHorBorders = function(oHtml){
    return Math.max(0,
          (parseInt(apf.getStyle(oHtml, "borderLeftWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderRightWidth")) || 0));
};

apf.getVerBorders = function(oHtml){
    return Math.max(0,
          (parseInt(apf.getStyle(oHtml, "borderTopWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderBottomWidth")) || 0));
};

apf.getWidthDiff = function(oHtml){
    if (apf.hasFlexibleBox 
      && apf.getStyle(oHtml, apf.CSSPREFIX + "BoxSizing") != "content-box")
        return 0;
    
    return Math.max(0, (parseInt(apf.getStyle(oHtml, "paddingLeft")) || 0)
        + (parseInt(apf.getStyle(oHtml, "paddingRight")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderLeftWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderRightWidth")) || 0));
};

apf.getHeightDiff = function(oHtml){
    if (apf.hasFlexibleBox 
      && apf.getStyle(oHtml, apf.CSSPREFIX + "BoxSizing") != "content-box")
        return 0;
    
    return Math.max(0, (parseInt(apf.getStyle(oHtml, "paddingTop")) || 0)
        + (parseInt(apf.getStyle(oHtml, "paddingBottom")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderTopWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderBottomWidth")) || 0));
};

apf.getDiff = function(oHtml){
    if (apf.hasFlexibleBox 
      && apf.getStyle(oHtml, apf.CSSPREFIX + "BoxSizing") != "content-box")
        return [0,0];
    
    return [Math.max(0, (parseInt(apf.getStyle(oHtml, "paddingLeft")) || 0)
        + (parseInt(apf.getStyle(oHtml, "paddingRight")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderLeftWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderRightWidth")) || 0)),
        Math.max(0, (parseInt(apf.getStyle(oHtml, "paddingTop")) || 0)
        + (parseInt(apf.getStyle(oHtml, "paddingBottom")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderTopWidth")) || 0)
        + (parseInt(apf.getStyle(oHtml, "borderBottomWidth")) || 0))];
};

apf.getMargin = function(oHtml) {
    return [(parseInt(apf.getStyle(oHtml, "marginLeft")) || 0)
        + (parseInt(apf.getStyle(oHtml, "marginRight")) || 0),
      (parseInt(apf.getStyle(oHtml, "marginTop")) || 0)
        + (parseInt(apf.getStyle(oHtml, "marginBottom")) || 0)]
};

apf.getHtmlInnerWidth = function(oHtml){
    return (oHtml.offsetWidth
        - (parseInt(apf.getStyle(oHtml, "borderLeftWidth")) || 0)
        - (parseInt(apf.getStyle(oHtml, "borderRightWidth")) || 0));
};

apf.getHtmlInnerHeight = function(oHtml){
    return (oHtml.offsetHeight
        - (parseInt(apf.getStyle(oHtml, "borderTopWidth")) || 0)
        - (parseInt(apf.getStyle(oHtml, "borderBottomWidth")) || 0));
};

/**
 * Returns the viewport of the a window.
 *
 * @param  {WindowImplementation} [win] The window to take the measurements of.
 * @return {Object}                     Viewport object with fields x, y, w and h.
 * @type   {Object}
 */
apf.getViewPort = function(win) {
    win = win || window;
    var doc = (!win.document.compatMode
      || win.document.compatMode == "CSS1Compat")
        //documentElement for an iframe
        ? win.document.html || win.document.documentElement
        : win.document.body;

    // Returns viewport size excluding scrollbars
    return {
        x     : win.pageXOffset || doc.scrollLeft,
        y     : win.pageYOffset || doc.scrollTop,
        width : win.innerWidth  || doc.clientWidth,
        height: win.innerHeight || doc.clientHeight
    };
}

// #endif
