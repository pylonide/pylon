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

// #ifdef __WITH_PRINTER

/**
 * @private
 */
jpf.printer = {
    //#ifdef __WITH_JMLDOM_FULL
    tagName  : "printer",
    nodeFunc : jpf.NODE_HIDDEN,
    //#endif
    
    lastContent : "",
    inited      : false,
    
    init : function(jml){
        this.inited = true;
        this.$jml    = jml;
        
        this.contentShower = document.body.appendChild(document.createElement("DIV"));
        this.contentShower.id = "print_content"
        
        with (this.contentShower.style) {
            width           = "100%";
            height          = "100%";
            backgroundColor = "white";
            zIndex          = 100000000;
        }
        
        jpf.importCssString(document, "#print_content{display:none}");
        jpf.importCssString(document,
            "body #print_content, body #print_content *{display:block} body *{display:none}", "print");
        
        if (jml) {
            //Events
            var a, i, attr = jml.attributes;
            for (i = 0; i < attr.length; i++) {
                a = attr[i];
                if (a.nodeName.indexOf("on") == 0)
                    jpf.addEventListener(a.nodeName, new Function(a.nodeValue));
            }
        }

        // #ifdef __WITH_IEPNGFIX
        function printPNGFix(disable) {
            if (jpf.supportPng24) return;
            // #ifdef __WITH_APPSETTINGS
            if (!jpf.appsettings.iePngFix) return;
            // #endif
            for (var e, i = 0, j = document.all.length; i < j; i++) {
                e = document.all[i];
                if (e.filters['DXImageTransform.Microsoft.AlphaImageLoader'] || e._png_print) {
                    if (disable) {
                        e._png_print   = e.style.filter;
                        e.style.filter = '';
                    }
                    else {
                        e.style.filter = e._png_print;
                        e._png_print   = '';
                    }
                }
            }
        }
        // #endif
        
        window.onbeforeprint = function(){
            // #ifdef __WITH_IEPNGFIX
            printPNGFix(true);
            // #endif
            jpf.dispatchEvent("beforeprint");
        };
        
        window.onafterprint = function(){
            // #ifdef __WITH_IEPNGFIX
            printPNGFix(false);
            // #endif
            jpf.dispatchEvent("afterprint");
        };
    },
    
    preview : function(strHtml){
        if (!this.inited)
            this.init();
        
        if (typeof strHtml != "string")
            strHtml = strHtml.outerHTML || strHtml.xml || strHtml.serialize();
        
        this.lastContent = strHtml;
        this.contentShower.innerHTML = strHtml;
    }
};

/**
 * Sents html to a printer in formatted form.
 * @param {String} strHtml the html to be printed.
 */
jpf.print = function(strHtml){
    if (!jpf.printer.inited)
        jpf.printer.init();
    
    jpf.printer.preview(strHtml);
    window.print();
}

// #endif
