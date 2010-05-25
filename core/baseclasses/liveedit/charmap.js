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

apf.LiveEdit.plugin("charmap", function() {
    this.name        = "charmap";
    this.icon        = "charmap";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.buttonNode  = null;
    this.state       = apf.OFF;
    this.colspan     = 20;

    var panelBody;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, apf.isIE6 ? 469 : 466, 318);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function() {
        return this.state;
    };

    var chars = ["!","&#34;","#","$","%","&#38;","\\'","(",")","*","+","-",".",
        "/","0","1","2","3","4","5","6","7","8","9",":",";","&#60;","=","&#62;",
        "?","@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P",
        "Q","R","S","T","U","V","W","X","Y","Z","[","]","^","_","`","a","b","c",
        "d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u",
        "v","w","x","y","z","{","|","}","~","&#161;","&#162;","&#163;","&#164;",
        "&#165;","&#166;","&#167;","&#168;","&#169;","&#170;","&#171;","&#172;",
        "&#174;","&#175;","&#176;","&#177;","&#178;","&#179;","&#180;","&#181;",
        "&#182;","&#183;","&#184;","&#185;","&#186;","&#187;","&#188;","&#189;",
        "&#190;","&#191;","&#192;","&#193;","&#194;","&#195;","&#196;","&#197;",
        "&#198;","&#199;","&#200;","&#201;","&#202;","&#203;","&#204;","&#205;",
        "&#206;","&#207;","&#208;","&#209;","&#210;","&#211;","&#212;","&#213;",
        "&#214;","&#215;","&#216;","&#217;","&#218;","&#219;","&#220;","&#221;",
        "&#222;","&#223;","&#224;","&#225;","&#226;","&#227;","&#228;","&#229;",
        "&#230;","&#231;","&#232;","&#233;","&#234;","&#235;","&#236;","&#237;",
        "&#238;","&#239;","&#241;","&#242;","&#243;","&#244;","&#245;","&#246;",
        "&#247;","&#248;","&#249;","&#250;","&#251;","&#252;","&#253;","&#254;",
        "&#255;","&#338;","&#339;","&#352;","&#353;","&#376;","&#402;","&#710;",
        "&#732;","&#913;","&#914;","&#915;","&#916;","&#917;","&#918;","&#919;",
        "&#920;","&#921;","&#922;","&#923;","&#924;","&#925;","&#926;","&#927;",
        "&#928;","&#929;","&#931;","&#932;","&#933;","&#934;","&#935;","&#936;",
        "&#937;","&#945;","&#946;","&#947;","&#948;","&#949;","&#950;","&#951;",
        "&#952;","&#953;","&#954;","&#955;","&#956;","&#957;","&#958;","&#959;",
        "&#960;","&#961;","&#962;","&#963;","&#964;","&#965;","&#966;","&#967;",
        "&#968;","&#969;","&#977;","&#978;","&#982;","&#8201;","&#8211;","&#8212;",
        "&#8216;","&#8217;","&#8218;","&#8220;","&#8221;","&#8222;","&#8224;",
        "&#8225;","&#8226;","&#8230;","&#8240;","&#8242;","&#8243;","&#8249;",
        "&#8250;","&#8254;","&#8260;","&#8364;","&#8465;","&#8472;","&#8476;",
        "&#8482;","&#8501;","&#8592;","&#8593;","&#8594;","&#8595;","&#8596;",
        "&#8629;","&#8656;","&#8657;","&#8658;","&#8659;","&#8660;","&#8704;",
        "&#8706;","&#8707;","&#8709;","&#8711;","&#8712;","&#8713;","&#8715;",
        "&#8719;","&#8721;","&#8722;","&#8727;","&#8730;","&#8733;","&#8734;",
        "&#8736;","&#8743;","&#8744;","&#8745;","&#8746;","&#8747;","&#8756;",
        "&#8764;","&#8773;","&#8776;","&#8800;","&#8801;","&#8804;","&#8805;",
        "&#8834;","&#8835;","&#8836;","&#8838;","&#8839;","&#8853;","&#8855;",
        "&#8869;","&#8901;","&#8968;","&#8969;","&#8970;","&#8971;","&#9001;",
        "&#9002;","&#9674;","&#9824;","&#9827;","&#9829;","&#9830;"];

    this.submit = function(e) {
        var el = e.target || e.srcElement;
        while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
            el = el.parentNode;
        var sCode = el.getAttribute("rel");
        if (sCode) {
            apf.popup.forceHide();
            //this.storeSelection();
            this.editor.$insertHtml(sCode, true);
            var _self = this;
            $setTimeout(function() { //make sure the 'change' is notified to the smartbindings
                // #ifdef __WITH_DATAACTION
                _self.editor.change(_self.editor.getValue());
                /* #else
                _self.editor.setProperty("value", _self.editor.getValue())
                #endif*/
            });
            //this.restoreSelection();
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml  = [];
        var rowLen = this.colspan - 1;
        for (var i = 0; i < chars.length; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
            aHtml.push('<a class="editor_panelcell editor_largecell" style="background-color:#',
                chars[i], ';" rel="', chars[i], '" href="javascript:;" onmousedown="apf.lookup(',
                this.$uniqueId, ').submit(event);">\
                <span>', chars[i],"</span>\
                </a>");
            if (i % this.colspan == rowLen)
                aHtml.push("</div>");
        }
        panelBody.innerHTML = aHtml.join("");
        return panelBody;
    };

    this.destroy = function() {
        panelBody = null;
        delete panelBody;
    };
});

// #endif
