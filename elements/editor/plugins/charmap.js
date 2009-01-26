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

// #ifdef __ENABLE_EDITOR_CHARMAP || __INC_ALL

jpf.editor.plugin('charmap', function() {
    this.name        = 'charmap';
    this.icon        = 'charmap';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 20;

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement('span'),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.showPopup(this, this.uniqueId, this.buttonNode, jpf.isIE6 ? 469 : 466, 199);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function() {
        return this.state;
    };

    var chars = ["!","&quot;","#","$","%","&amp;","\\'","(",")","*",
              "+","-",".","/","0","1","2","3","4","5","6","7","8","9",":",
              ";","&lt;","=","&gt;","?","@","A","B","C","D","E","F","G","H",
              "I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W",
              "X","Y","Z","[","]","^","_","`","a","b","c","d","e","f","g",
              "h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
              "w","x","y","z","{","|","}","~","&#8364;","&lsquo;","&rsquo;",
              "&rsquo;","&ldquo;","&rdquo;","&ndash;","&mdash;","&iexcl;",
              "&cent;","&pound;","&curren;","&yen;","&brvbar;","&sect;",
              "&uml;","&copy;","&ordf;","&laquo;","&not;","&reg;","&macr;",
              "&deg;","&plusmn;","&sup2;","&sup3;","&acute;","&micro;","&para;",
              "&middot;","&cedil;","&sup1;","&ordm;","&raquo;","&frac14;",
              "&frac12;","&frac34;","&iquest;","&Agrave;","&Aacute;","&Acirc;",
              "&Atilde;","&Auml;","&Aring;","&AElig;","&Ccedil;","&Egrave;",
              "&Eacute;","&Ecirc;","&Euml;","&Igrave;","&Iacute;","&Icirc;",
              "&Iuml;","&ETH;","&Ntilde;","&Ograve;","&Oacute;","&Ocirc;",
              "&Otilde;","&Ouml;","&times;","&Oslash;","&Ugrave;","&Uacute;",
              "&Ucirc;","&Uuml;","&Yacute;","&THORN;","&szlig;","&agrave;",
              "&aacute;","&acirc;","&atilde;","&auml;","&aring;","&aelig;",
              "&ccedil;","&egrave;","&eacute;","&ecirc;","&euml;","&igrave;",
              "&iacute;","&icirc;","&iuml;","&eth;","&ntilde;","&ograve;",
              "&oacute;","&ocirc;","&otilde;","&ouml;","&divide;","&oslash;",
              "&ugrave;","&uacute;","&ucirc;","&uuml;","&uuml;","&yacute;",
              "&thorn;","&yuml;","&OElig;","&oelig;","&sbquo;","&#8219;",
              "&bdquo;","&hellip;","&trade;","&#9658;","&bull;","&rarr;",
              "&rArr;","&hArr;","&diams;","&asymp;"];

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sCode = e.target.getAttribute('rel');
        if (sCode) {
            jpf.popup.forceHide();
            //this.storeSelection();
            this.editor.insertHTML(sCode);
            //this.restoreSelection();
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml  = [];
        var rowLen = this.colspan - 1;
        for (var i = 0; i < chars.length; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
            aHtml.push('<a class="editor_panelcell editor_largecell" style="background-color:#',
                chars[i], ';" rel="', chars[i], '" href="javascript:;" onmousedown="jpf.lookup(',
                this.uniqueId, ').submit(event);">\
                <span>', chars[i],'</span>\
                </a>');
            if (i % this.colspan == rowLen)
                aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');
        return panelBody;
    };

    this.destroy = function() {
        panelBody = null;
        delete panelBody;
    };
});

// #endif
